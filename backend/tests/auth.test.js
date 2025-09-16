import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../server.js';
import pool from '../src/config/database.js';

const { expect } = chai;
chai.use(chaiHttp);

describe('Authentication Tests', () => {
  before(async () => {
    // Create test department
    await pool.execute('INSERT IGNORE INTO departments (name) VALUES (?)', ['Computer Science']);
    // Clean up test data
    await pool.execute('DELETE FROM users WHERE email LIKE ?', ['test%@example.com']);
  });

  after(async () => {
    // Clean up test data
    await pool.execute('DELETE FROM users WHERE email LIKE ?', ['test%@example.com']);
    await pool.execute('DELETE FROM departments WHERE name = ?', ['Computer Science']);
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const [rows] = await pool.execute('SELECT id FROM departments WHERE name = ?', ['Computer Science']);
      const deptId = rows[0].id;

      const res = await chai.request(app)
        .post('/api/auth/register')
        .send({
          first_name: 'Test',
          last_name: 'User',
          email: 'testuser@example.com',
          password: 'password123',
          role: 'teacher',
          department_id: deptId
        });

      expect(res).to.have.status(201);
      expect(res.body).to.have.property('message', 'User registered successfully');
      expect(res.body).to.have.property('userId');
    });

    it('should not register user with existing email', async () => {
      const [rows] = await pool.execute('SELECT id FROM departments WHERE name = ?', ['Computer Science']);
      const deptId = rows[0].id;

      const res = await chai.request(app)
        .post('/api/auth/register')
        .send({
          first_name: 'Test',
          last_name: 'User2',
          email: 'testuser@example.com',
          password: 'password123',
          role: 'teacher',
          department_id: deptId
        });

      expect(res).to.have.status(400);
      expect(res.body).to.have.property('message', 'User already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with correct credentials', async () => {
      const res = await chai.request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'password123'
        });

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('message', 'Login successful');
      expect(res.body).to.have.property('user');
      expect(res.body).to.have.property('token');
    });

    it('should not login with incorrect password', async () => {
      const res = await chai.request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'wrongpassword'
        });

      expect(res).to.have.status(401);
      expect(res.body).to.have.property('message', 'Invalid credentials');
    });

    it('should not login with non-existent email', async () => {
      const res = await chai.request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(res).to.have.status(401);
      expect(res.body).to.have.property('message', 'Invalid credentials');
    });
  });
});
