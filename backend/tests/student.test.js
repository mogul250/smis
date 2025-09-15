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
    // Create a test user and student
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash('password123', 10);

    const [userResult] = await pool.execute(
      'INSERT INTO users (first_name, last_name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      ['Test', 'Student', 'teststudent@example.com', hashedPassword, 'student']
    );
    userId = userResult.insertId;

    const [studentResult] = await pool.execute(
      'INSERT INTO students (user_id, department_id, enrollment_date) VALUES (?, ?, ?)',
      [userId, 1, '2023-01-01']
    );
    studentId = studentResult.insertId;

    // Login to get token
    const loginRes = await chai.request(app)
      .post('/api/auth/login')
      .send({
        email: 'teststudent@example.com',
        password: 'password123'
      });
    token = loginRes.body.token;
  });

  after(async () => {
    // Clean up test data
    await pool.execute('DELETE FROM students WHERE id = ?', [studentId]);
    await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
  });

  describe('GET /api/student/profile', () => {
    it('should get student profile', (done) => {
      chai.request(app)
        .get('/api/student/profile')
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

  describe('GET /api/student/grades', () => {
    it('should get student grades', (done) => {
      chai.request(app)
        .get('/api/student/grades')
        .set('Authorization', `Bearer ${token}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('array');
          done();
        });
    });
  });

  describe('GET /api/student/attendance', () => {
    it('should get student attendance', (done) => {
      chai.request(app)
        .get('/api/student/attendance')
        .set('Authorization', `Bearer ${token}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('array');
          done();
        });
    });
  });

  describe('GET /api/student/fees', () => {
    it('should get student fees', (done) => {
      chai.request(app)
        .get('/api/student/fees')
        .set('Authorization', `Bearer ${token}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('array');
          done();
        });
    });
  });

  describe('GET /api/student/timetable', () => {
    it('should get student timetable', (done) => {
      chai.request(app)
        .get('/api/student/timetable')
        .set('Authorization', `Bearer ${token}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('array');
          done();
        });
    });
  });
});
