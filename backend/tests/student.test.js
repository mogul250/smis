import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../server.js';
import pool from '../src/config/database.js';

const { expect } = chai;
chai.use(chaiHttp);

describe('Student Controller Tests', () => {
  let token;
  let studentId;
  let userId;

  before(async () => {
    // Create test department
    await pool.execute('INSERT IGNORE INTO departments (id, code, name) VALUES (?, ?, ?)', [1, 'CS', 'Computer Science']);

    // Create a test student
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash('password123', 10);

    const [studentResult] = await pool.execute(
      'INSERT INTO students (first_name, last_name, email, password_hash, student_id, department_id, enrollment_year, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ['Test', 'Student', 'teststudent@example.com', hashedPassword, 'STU001', 1, 2023, 1]
    );
    studentId = studentResult.insertId;

    // Login to get token
    const loginRes = await chai.request(app)
      .post('/api/auth/student/login')
      .send({
        email: 'teststudent@example.com',
        password: 'password123'
      });
    token = loginRes.body.token;
  });

  after(async () => {
    // Clean up test data
    await pool.execute('DELETE FROM students WHERE id = ?', [studentId]);
  });

  describe('GET /api/students/profile', () => {
    it('should get student profile', (done) => {
      chai.request(app)
        .get('/api/students/profile')
        .set('Authorization', `Bearer ${token}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('id', studentId);
          expect(res.body).to.have.property('user');
          expect(res.body.user).to.have.property('email', 'teststudent@example.com');
          done();
        });
    });
  });

  describe('GET /api/students/grades', () => {
    it('should get student grades', (done) => {
      chai.request(app)
        .get('/api/students/grades')
        .set('Authorization', `Bearer ${token}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('grades');
          expect(res.body).to.have.property('gpa');
          expect(res.body.grades).to.be.an('array');
          done();
        });
    });
  });

  describe('GET /api/students/attendance', () => {
    it('should get student attendance', (done) => {
      chai.request(app)
        .get('/api/students/attendance')
        .set('Authorization', `Bearer ${token}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('array');
          done();
        });
    });
  });

  describe('GET /api/students/fees', () => {
    it('should get student fees', (done) => {
      chai.request(app)
        .get('/api/students/fees')
        .set('Authorization', `Bearer ${token}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('fees');
          expect(res.body).to.have.property('totalOutstanding');
          expect(res.body.fees).to.be.an('array');
          done();
        });
    });
  });

  describe('GET /api/students/timetable', () => {
    it('should get student timetable', (done) => {
      chai.request(app)
        .get('/api/students/timetable')
        .set('Authorization', `Bearer ${token}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('array');
          done();
        });
    });
  });
});
