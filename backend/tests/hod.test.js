import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../server.js';
import pool from '../src/config/database.js';

const { expect } = chai;
chai.use(chaiHttp);

describe('HOD Controller Tests', () => {
  let hodToken;
  let userId;

  before(async () => {
    // Create test department
    await pool.execute('INSERT IGNORE INTO departments (code, name) VALUES (?, ?)', ['CS', 'Computer Science']);
    const [deptRows] = await pool.execute('SELECT id FROM departments WHERE code = ?', ['CS']);
    const deptId = deptRows[0].id;

    // Create a test HOD user
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash('password123', 10);

    const [userResult] = await pool.execute(
      'INSERT INTO users (first_name, last_name, email, password_hash, role, department_id) VALUES (?, ?, ?, ?, ?, ?)',
      ['Test', 'HOD', 'testhod@example.com', hashedPassword, 'hod', deptId]
    );
    userId = userResult.insertId;

    // Update department to set this user as HOD
    await pool.execute('UPDATE departments SET head_id = ? WHERE id = ?', [userId, deptId]);

    // Login to get token
    const loginRes = await chai.request(app)
      .post('/api/auth/login')
      .send({
        email: 'testhod@example.com',
        password: 'password123'
      });
    hodToken = loginRes.body.token;
  });

  after(async () => {
    // Clean up test data
    await pool.execute('UPDATE departments SET head_id = NULL WHERE head_id = ?', [userId]);
    await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
    await pool.execute('DELETE FROM departments WHERE code = ?', ['CS']);
  });

  describe('GET /api/hod/teachers', () => {
    it('should get department teachers', (done) => {
      chai.request(app)
        .get('/api/hod/teachers')
        .set('Authorization', `Bearer ${hodToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('array');
          done();
        });
    });
  });

  describe('POST /api/hod/activities/approve', () => {
    it('should approve teacher activity', (done) => {
      chai.request(app)
        .post('/api/hod/activities/approve')
        .set('Authorization', `Bearer ${hodToken}`)
        .send({
          activityType: 'grade',
          activityId: 1,
          approve: true
        })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('message');
          done();
        });
    });
  });

  describe('GET /api/hod/reports', () => {
    it('should generate department reports', (done) => {
      chai.request(app)
        .get('/api/hod/reports')
        .set('Authorization', `Bearer ${hodToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('attendance');
          expect(res.body).to.have.property('grades');
          done();
        });
    });
  });

  describe('GET /api/hod/stats', () => {
    it('should get department statistics', (done) => {
      chai.request(app)
        .get('/api/hod/stats')
        .set('Authorization', `Bearer ${hodToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('totalStudents');
          expect(res.body).to.have.property('totalTeachers');
          done();
        });
    });
  });
});
