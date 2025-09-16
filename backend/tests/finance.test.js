import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../server.js';
import pool from '../src/config/database.js';

const { expect } = chai;
chai.use(chaiHttp);

describe('Finance Controller Tests', () => {
  let financeToken;
  let financeId;
  let userId;
  let studentId;
  let feeId;

  before(async () => {
    // Create a test finance user
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash('password123', 10);

    const [userResult] = await pool.execute(
      'INSERT INTO users (first_name, last_name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      ['Test', 'Finance', 'testfinance@example.com', hashedPassword, 'finance']
    );
    userId = userResult.insertId;

    // Create a test student for fee operations
    const [studentResult] = await pool.execute(
      'INSERT INTO students (first_name, last_name, email, password_hash, student_id, department_id, enrollment_year) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['Test', 'Student', 'teststudent2@example.com', hashedPassword, 'STU002', 1, 2023]
    );
    studentId = studentResult.insertId;

    // Login to get token
    const loginRes = await chai.request(app)
      .post('/api/auth/login')
      .send({
        email: 'testfinance@example.com',
        password: 'password123'
      });
    financeToken = loginRes.body.token;
  });

  after(async () => {
    // Clean up test data
    if (feeId) {
      await pool.execute('DELETE FROM fees WHERE id = ?', [feeId]);
    }
    await pool.execute('DELETE FROM students WHERE id = ?', [studentId]);
    await pool.execute('DELETE FROM users WHERE email IN (?, ?)', ['testfinance@example.com', 'teststudent2@example.com']);
  });

  describe('POST /api/finance/fees', () => {
    it('should create a new fee entry', (done) => {
      chai.request(app)
        .post('/api/finance/fees')
        .set('Authorization', `Bearer ${financeToken}`)
        .send({
          studentId: studentId,
          amount: 500.00,
          type: 'tuition',
          dueDate: '2024-02-01',
          description: 'Semester tuition fee'
        })
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.have.property('message', 'Fee created successfully');
          expect(res.body).to.have.property('feeId');
          feeId = res.body.feeId;
          done();
        });
    });
  });

  describe('GET /api/finance/students/:studentId/fees', () => {
    it('should get student fees', (done) => {
      chai.request(app)
        .get(`/api/finance/students/${studentId}/fees`)
        .set('Authorization', `Bearer ${financeToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('array');
          done();
        });
    });
  });

  describe('PUT /api/finance/fees/:feeId/pay', () => {
    it('should mark fee as paid', (done) => {
      chai.request(app)
        .put(`/api/finance/fees/${feeId}/pay`)
        .set('Authorization', `Bearer ${financeToken}`)
        .send({
          paymentMethod: 'cash',
          transactionId: 'TXN123456'
        })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('message', 'Fee marked as paid successfully');
          done();
        });
    });
  });

  describe('GET /api/finance/reports', () => {
    it('should get financial reports', (done) => {
      chai.request(app)
        .get('/api/finance/reports')
        .set('Authorization', `Bearer ${financeToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('totalRevenue');
          expect(res.body).to.have.property('outstandingFees');
          done();
        });
    });
  });
});
