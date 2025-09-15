import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../server.js';
import pool from '../src/config/database.js';

const { expect } = chai;
chai.use(chaiHttp);

describe('Notification Controller Tests', () => {
  let adminToken;
  let userId;

  before(async () => {
    // Create a test admin user
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash('password123', 10);

    const [userResult] = await pool.execute(
      'INSERT INTO users (first_name, last_name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      ['Test', 'Admin', 'testadmin2@example.com', hashedPassword, 'admin']
    );
    userId = userResult.insertId;

    // Login to get token
    const loginRes = await chai.request(app)
      .post('/api/auth/login')
      .send({
        email: 'testadmin2@example.com',
        password: 'password123'
      });
    adminToken = loginRes.body.token;
  });

  after(async () => {
    // Clean up test data
    await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
  });

  describe('POST /api/notifications/send', () => {
    it('should send notification to users', (done) => {
      chai.request(app)
        .post('/api/notifications/send')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Notification',
          message: 'This is a test notification',
          recipientIds: [userId],
          type: 'general'
        })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('message', 'Notification sent successfully');
          done();
        });
    });
  });

  describe('GET /api/notifications', () => {
    it('should get user notifications', (done) => {
      chai.request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('array');
          done();
        });
    });
  });

  describe('PUT /api/notifications/:id/read', () => {
    it('should mark notification as read', (done) => {
      // First get notifications to find an ID
      chai.request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .end((err, res) => {
          if (res.body.length > 0) {
            const notificationId = res.body[0].id;
            chai.request(app)
              .put(`/api/notifications/${notificationId}/read`)
              .set('Authorization', `Bearer ${adminToken}`)
              .end((err2, res2) => {
                expect(res2).to.have.status(200);
                expect(res2.body).to.have.property('message', 'Notification marked as read');
                done();
              });
          } else {
            // No notifications to test with
            done();
          }
        });
    });
  });
});
