import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../server.js';
import pool from '../src/config/database.js';

const { expect } = chai;
chai.use(chaiHttp);

describe('Admin Controller Tests', () => {
  let adminToken;
  let adminId;
  let userId;
  let testUserId;

  before(async () => {
    // Create a test admin user
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash('password123', 10);

    const [userResult] = await pool.execute(
      'INSERT INTO users (first_name, last_name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      ['Test', 'Admin', 'testadmin@example.com', hashedPassword, 'admin']
    );
    userId = userResult.insertId;

    // Login to get token
    const loginRes = await chai.request(app)
      .post('/api/auth/login')
      .send({
        email: 'testadmin@example.com',
        password: 'password123'
      });
    adminToken = loginRes.body.token;
  });

  after(async () => {
    // Clean up test data
    if (testUserId) {
      await pool.execute('DELETE FROM users WHERE id = ?', [testUserId]);
    }
    await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
  });

  describe('POST /api/admin/users', () => {
    it('should create a new user', (done) => {
      chai.request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'New',
          lastName: 'User',
          email: 'newuser@example.com',
          password: 'password123',
          role: 'teacher',
          departmentId: 1
        })
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.have.property('message', 'User created successfully');
          expect(res.body).to.have.property('userId');
          testUserId = res.body.userId;
          done();
        });
    });
  });

  describe('GET /api/admin/users', () => {
    it('should get all users', (done) => {
      chai.request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.length.greaterThan(0);
          done();
        });
    });
  });

  describe('PUT /api/admin/users/:userId', () => {
    it('should update user information', (done) => {
      chai.request(app)
        .put(`/api/admin/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'User',
          role: 'teacher'
        })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('message', 'User updated successfully');
          done();
        });
    });
  });

  describe('POST /api/admin/calendar', () => {
    it('should add calendar event', (done) => {
      chai.request(app)
        .post('/api/admin/calendar')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          eventName: 'Test Event',
          eventDate: '2024-12-25',
          eventType: 'holiday',
          description: 'Christmas Holiday'
        })
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.have.property('message', 'Calendar event added successfully');
          done();
        });
    });
  });

  describe('GET /api/admin/stats', () => {
    it('should get system statistics', (done) => {
      chai.request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('totalUsers');
          expect(res.body).to.have.property('totalStudents');
          expect(res.body).to.have.property('totalTeachers');
          done();
        });
    });
  });
});
