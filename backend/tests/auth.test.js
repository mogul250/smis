import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../server.js';
import pool from '../src/config/database.js';

const { expect } = chai;
chai.use(chaiHttp);

describe('Authentication Tests', () => {
  before(async () => {
    // Clean up test data
    await pool.execute('DELETE FROM users WHERE email LIKE ?', ['test%@example.com']);
  });

  after(async () => {
    // Clean up test data
    await pool.execute('DELETE FROM users WHERE email LIKE ?', ['test%@example.com']);
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', (done) => {
      chai.request(app)
        .post('/api/auth/register')
        .send({
          email: 'testuser@example.com',
          password: 'password123',
          role: 'student'
        })
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.have.property('message', 'User registered successfully');
          expect(res.body).to.have.property('userId');
          done();
        });
    });

    it('should not register user with existing email', (done) => {
      chai.request(app)
        .post('/api/auth/register')
        .send({
          email: 'testuser@example.com',
          password: 'password123',
          role: 'student'
        })
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.have.property('message', 'User already exists');
          done();
        });
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with correct credentials', (done) => {
      chai.request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'password123'
        })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('message', 'Login successful');
          expect(res.body).to.have.property('user');
          expect(res.body).to.have.property('token');
          done();
        });
    });

    it('should not login with incorrect password', (done) => {
      chai.request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'wrongpassword'
        })
        .end((err, res) => {
          expect(res).to.have.status(401);
          expect(res.body).to.have.property('message', 'Invalid credentials');
          done();
        });
    });

    it('should not login with non-existent email', (done) => {
      chai.request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .end((err, res) => {
          expect(res).to.have.status(401);
          expect(res.body).to.have.property('message', 'Invalid credentials');
          done();
        });
    });
  });
});
