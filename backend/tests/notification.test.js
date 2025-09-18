import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../server.js';
import pool from '../src/config/database.js';

const { expect } = chai;
chai.use(chaiHttp);

describe('Notification Controller Tests', () => {
  let token;
  let studentId;
  let userId;
  let departmentId;

  before(async () => {
    // Clean up any existing test data
    await pool.execute('DELETE FROM students WHERE email = ?', ['teststudent@example.com']);
    await pool.execute('DELETE FROM users WHERE email = ?', ['teststudent@example.com']);
    await pool.execute('DELETE FROM departments WHERE code = ?', ['TEST']);

    // Create a test department
    const [departmentResult] = await pool.execute(
      'INSERT INTO departments (code, name) VALUES (?, ?)',
      ['TEST', 'Test Department']
    );
    departmentId = departmentResult.insertId;

    // Create a test user
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash('password123', 10);

    const [userResult] = await pool.execute(
      'INSERT INTO users (first_name, last_name, email, password_hash, role, is_active, department_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['Test', 'User', 'teststudent@example.com', hashedPassword, 'hod', 1, departmentId]
    );
    userId = userResult.insertId;

    // Create a test student
    const [studentResult] = await pool.execute(
      'INSERT INTO students (first_name, last_name, email, password_hash, student_id, department_id, enrollment_year, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ['Test', 'Student', 'teststudent@example.com', hashedPassword, 'STU001', departmentId, 2023, 1]
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
    if (studentId) {
      await pool.execute('DELETE FROM students WHERE id = ?', [studentId]);
    }
    if (userId) {
      await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
    }
    if (departmentId) {
      await pool.execute('DELETE FROM departments WHERE id = ?', [departmentId]);
    }
  });

  describe('GET /api/notifications', () => {
    it('should get user notifications', (done) => {
      chai.request(app)
        .get('/api/notifications/1/20')
        .set('Authorization', `Bearer ${token}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('array');
          done();
        });
    });
  });

  describe('PUT /api/notifications/:id/read', () => {
    let notificationId;

    before(async () => {
      // Create a test notification
      const [notificationResult] = await pool.execute(
        'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
        [userId, 'test', 'Test Notification', 'This is a test notification']
      );
      notificationId = notificationResult.insertId;
    });

    it('should mark notification as read', (done) => {
      chai.request(app)
        .put(`/api/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${token}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('message', 'Notification marked as read');
          done();
        });
    });
  });

  describe('PUT /api/notifications/read-all', () => {
    it('should mark all notifications as read', (done) => {
      chai.request(app)
        .put('/api/notifications/read-all')
        .set('Authorization', `Bearer ${token}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('message');
          done();
        });
    });
  });

  describe('POST /api/notifications/send/user', () => {
    it('should send notification to users', (done) => {
      chai.request(app)
        .post('/api/notifications/send/user')
        .set('Authorization', `Bearer ${token}`)
        .send({
          recipientIds: [userId],
          type: 'test',
          title: 'Test Notification',
          message: 'This is a test notification'
        })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('message', 'Notification sent successfully');
          done();
        });
    });
  });

  describe('POST /api/notifications/send/department', () => {
    it('should send notification to department', (done) => {
      chai.request(app)
        .post('/api/notifications/send/department')
        .set('Authorization', `Bearer ${token}`)
        .send({
          departmentId,
          type: 'test',
          title: 'Test Notification',
          message: 'This is a test notification'
        })
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.have.property('message');
          done();
        });
    });
  });
});
