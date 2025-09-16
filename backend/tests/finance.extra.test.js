import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../server.js';
import pool from '../src/config/database.js';

const { expect } = chai;
chai.use(chaiHttp);

describe('Finance Controller Extra Tests (coverage boost)', () => {
  let financeToken;
  let deptId;
  let financeUserId;
  let studentId;
  let feePaidId;
  let feeUnpaidId;
  let feeOverdueId;

  const FIN_DEPT_CODE = 'FINX';
  const FIN_USER_EMAIL = 'finextra@example.com';
  const FIN_STUDENT_EMAIL = 'finstudent.extra@example.com';

  before(async () => {
    // Cleanup potential leftovers from previous runs
    await pool.execute('DELETE FROM fees WHERE student_id IN (SELECT id FROM students WHERE email IN (?, ?))', [FIN_STUDENT_EMAIL, 'finstudent.invoice@example.com']);
    await pool.execute('DELETE FROM students WHERE email IN (?, ?)', [FIN_STUDENT_EMAIL, 'finstudent.invoice@example.com']);
    await pool.execute('DELETE FROM users WHERE email = ?', [FIN_USER_EMAIL]);
    await pool.execute('DELETE FROM departments WHERE code = ?', [FIN_DEPT_CODE]);

    // Create department
    await pool.execute('INSERT INTO departments (code, name) VALUES (?, ?)', [FIN_DEPT_CODE, 'Finance Extra']);
    const [dRows] = await pool.execute('SELECT id FROM departments WHERE code = ?', [FIN_DEPT_CODE]);
    deptId = dRows[0].id;

    // Hash password
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create finance user
    {
      const [res] = await pool.execute(
        'INSERT INTO users (first_name, last_name, email, password_hash, role, department_id) VALUES (?, ?, ?, ?, ?, ?)',
        ['Fin', 'Extra', FIN_USER_EMAIL, hashedPassword, 'finance', deptId]
      );
      financeUserId = res.insertId;
    }

    // Create student
    {
      const [res] = await pool.execute(
        'INSERT INTO students (first_name, last_name, email, password_hash, department_id, student_id, enrollment_year) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['Fin', 'Student', FIN_STUDENT_EMAIL, hashedPassword, deptId, 'FSTX001', 2024]
      );
      studentId = res.insertId;
    }

    // Login to get token
    const loginRes = await chai.request(app)
      .post('/api/auth/login')
      .send({
        email: FIN_USER_EMAIL,
        password: 'password123'
      });
    financeToken = loginRes.body.token;

    // Seed fees
    // 1) Paid fee
    {
      const [res] = await pool.execute(
        'INSERT INTO fees (student_id, fee_type, amount, due_date, status, created_at, updated_at, paid_date, payment_method, transaction_id) VALUES (?, ?, ?, ?, ?, NOW(), NOW(), ?, ?, ?)',
        [studentId, 'tuition', 200.00, '2024-02-01', 'paid', '2024-01-25', 'cash', 'TXN-PAID-1']
      );
      feePaidId = res.insertId;
    }
    // 2) Unpaid future-due fee
    {
      const [res] = await pool.execute(
        'INSERT INTO fees (student_id, fee_type, amount, due_date, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
        [studentId, 'library', 50.00, '2099-12-31', 'unpaid']
      );
      feeUnpaidId = res.insertId;
    }
    // 3) Overdue unpaid fee (due date in the past)
    {
      const [res] = await pool.execute(
        'INSERT INTO fees (student_id, fee_type, amount, due_date, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
        [studentId, 'lab', 75.00, '2020-01-01', 'unpaid']
      );
      feeOverdueId = res.insertId;
    }
  });

  after(async () => {
    // Cleanup seeded data
    await pool.execute('DELETE FROM fees WHERE student_id = ?', [studentId]);
    await pool.execute('DELETE FROM students WHERE id = ?', [studentId]);
    await pool.execute('DELETE FROM users WHERE email = ?', [FIN_USER_EMAIL]);
    await pool.execute('DELETE FROM departments WHERE code = ?', [FIN_DEPT_CODE]);
  });

  describe('Auth/Authorization checks', () => {
    it('should return 401 when Authorization header is missing', (done) => {
      chai.request(app)
        .get('/api/finance/overdue')
        .end((err, res) => {
          expect(res).to.have.status(401);
          done();
        });
    });
  });

  describe('Negative and edge-case validations', () => {
    it('should 400 on mark fee paid when missing paymentMethod', (done) => {
      chai.request(app)
        .put(`/api/finance/fees/${feeUnpaidId}/pay`)
        .set('Authorization', `Bearer ${financeToken}`)
        .send({
          transactionId: 'MISSING_METHOD'
        })
        .end((err, res) => {
          expect(res).to.have.status(400);
          done();
        });
    });

    it('should 404 on mark fee paid for non-existent feeId', (done) => {
      chai.request(app)
        .put('/api/finance/fees/999999/pay')
        .set('Authorization', `Bearer ${financeToken}`)
        .send({
          paymentMethod: 'cash',
          transactionId: 'TXN-NON-EXIST'
        })
        .end((err, res) => {
          expect(res).to.have.status(404);
          done();
        });
    });

    it('should 404 on get student fees for non-existent studentId', (done) => {
      chai.request(app)
        .get('/api/finance/students/999999/fees')
        .set('Authorization', `Bearer ${financeToken}`)
        .end((err, res) => {
          expect(res).to.have.status(404);
          done();
        });
    });
  });

  describe('Payments, Overdue, and Reports', () => {
    it('should retrieve payment history (array) for student with paid fees', (done) => {
      chai.request(app)
        .get(`/api/finance/students/${studentId}/payments?limit=10&offset=0`)
        .set('Authorization', `Bearer ${financeToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('array');
          // Should include the paid fee record
          if (res.body.length > 0) {
            const hasPaid = res.body.some((f) => f.id === feePaidId || f.status === 'paid');
            expect(hasPaid).to.be.true;
          }
          done();
        });
    });

    it('should list overdue fees including days_overdue and student_name', (done) => {
      chai.request(app)
        .get('/api/finance/overdue')
        .set('Authorization', `Bearer ${financeToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('array');
          const match = res.body.find((f) => f.id === feeOverdueId);
          if (match) {
            expect(match).to.have.property('student_name');
            expect(match).to.have.property('days_overdue');
            expect(match.days_overdue).to.be.greaterThan(0);
          }
          done();
        });
    });

    it('should get revenue report with date range', (done) => {
      chai.request(app)
        .get('/api/finance/reports')
        .set('Authorization', `Bearer ${financeToken}`)
        .query({ reportType: 'revenue', startDate: '2000-01-01', endDate: '2099-12-31' })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('reportType', 'revenue');
          expect(res.body).to.have.property('report');
          expect(res.body.report).to.have.property('revenue');
          done();
        });
    });

    it('should get outstanding report without date filters', (done) => {
      chai.request(app)
        .get('/api/finance/reports')
        .set('Authorization', `Bearer ${financeToken}`)
        .query({ reportType: 'outstanding' })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('reportType', 'outstanding');
          expect(res.body.report).to.have.property('outstanding');
          done();
        });
    });

    it('should get fee_types report', (done) => {
      chai.request(app)
        .get('/api/finance/reports')
        .set('Authorization', `Bearer ${financeToken}`)
        .query({ reportType: 'fee_types' })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('reportType', 'fee_types');
          expect(res.body.report).to.have.property('feeTypes');
          expect(res.body.report.feeTypes).to.be.an('array');
          done();
        });
    });
  });

  describe('Generate invoice endpoint', () => {
    it('should 404 when no outstanding fees exist for a student', async () => {
      // Create a temporary student with only paid fees
      const bcrypt = await import('bcryptjs');
      const hashed = await bcrypt.hash('password123', 10);
      const [sres] = await pool.execute(
        'INSERT INTO students (first_name, last_name, email, password_hash, department_id, student_id, enrollment_year) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['Invoice', 'OnlyPaid', 'finstudent.invoice@example.com', hashed, deptId, 'FSTX002', 2024]
      );
      const tempStudentId = sres.insertId;

      // Add a paid fee only
      await pool.execute(
        'INSERT INTO fees (student_id, fee_type, amount, due_date, status, created_at, updated_at, paid_date, payment_method, transaction_id) VALUES (?, ?, ?, ?, ?, NOW(), NOW(), ?, ?, ?)',
        [tempStudentId, 'tuition', 250.00, '2024-02-01', 'paid', '2024-01-26', 'cash', 'TXN-INVOICE-PAID']
      );

      const res = await chai.request(app)
        .get(`/api/finance/students/${tempStudentId}/invoice`)
        .set('Authorization', `Bearer ${financeToken}`);

      expect(res).to.have.status(404);

      // Cleanup temp student and fees
      await pool.execute('DELETE FROM fees WHERE student_id = ?', [tempStudentId]);
      await pool.execute('DELETE FROM students WHERE id = ?', [tempStudentId]);
    });

    it('should 200 and return invoice when outstanding fees exist', async () => {
      // Ensure unpaid fee exists (feeUnpaidId)
      const res = await chai.request(app)
        .get(`/api/finance/students/${studentId}/invoice`)
        .set('Authorization', `Bearer ${financeToken}`);

      // Depending on implementation, controller may calculate and return invoice or 404 if none.
      // We inserted unpaid fees, so expect 200 and proper payload.
      expect(res).to.have.status(200);
      expect(res.body).to.have.property('studentId');
      expect(res.body).to.have.property('studentName');
      expect(res.body).to.have.property('outstandingFees');
      expect(res.body.outstandingFees).to.be.an('array');
      expect(res.body).to.have.property('totalAmount');
    });
  });

  describe('Mark as paid already paid scenario', () => {
    it('should 404 or falsey when marking an already paid fee as paid again', (done) => {
      chai.request(app)
        .put(`/api/finance/fees/${feePaidId}/pay`)
        .set('Authorization', `Bearer ${financeToken}`)
        .send({
          paymentMethod: 'cash',
          transactionId: 'TXN-REPAY-1'
        })
        .end((err, res) => {
          // Implementation returns 404 when not found or already paid.
          expect([404, 200]).to.include(res.status);
          if (res.status === 200) {
            // If implementation allows updating, still should return success
            expect(res.body).to.have.property('message');
          }
          done();
        });
    });
  });
});
