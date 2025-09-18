import { expect } from 'chai';
import sinon from 'sinon';
import express from 'express';
import request from 'supertest';
import studentRoutes from '../../src/routes/student-routes.js';
import StudentController from '../../src/controllers/student-controller.js';
import pool from '../../src/config/database.js';
import { generateToken } from '../../src/config/jwt.js';

describe('Student Routes', () => {
  let app;
  let studentId;
  let token;

  beforeEach(async () => {
    // Create test department if not exists
    await pool.execute('INSERT IGNORE INTO departments (id, code, name) VALUES (?, ?, ?)', [1, 'CS', 'Computer Science']);

    // Create a test student if none exists
    let [rows] = await pool.execute('SELECT id FROM students LIMIT 1');
    if (rows.length === 0) {
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash('password123', 10);
      const [result] = await pool.execute(
        'INSERT INTO students (first_name, last_name, email, password_hash, student_id, department_id, enrollment_year, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        ['Test', 'Student', 'teststudent@example.com', hashedPassword, 'STU001', 1, 2023, 1]
      );
      studentId = result.insertId;
    } else {
      studentId = rows[0].id;
    }

    // Generate token for the student
    token = generateToken({
      id: studentId,
      role: 'student',
      userType: 'student'
    });

    app = express();
    app.use(express.json());
    app.use('/api/students', studentRoutes);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('GET /api/students/profile', () => {
    it('should get student profile', async () => {
      const response = await request(app)
        .get('/api/students/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('id', studentId);
      expect(response.body).to.have.property('user');
    });
  });

  describe('PUT /api/students/profile', () => {
    it('should update student profile', async () => {
      const response = await request(app)
        .put('/api/students/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ first_name: 'Updated' });

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('message', 'Profile updated successfully');
    });
  });

  describe('GET /api/students/attendance', () => {
    it('should get student attendance', async () => {
      const response = await request(app)
        .get('/api/students/attendance')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array');
    });
  });

  describe('GET /api/students/grades', () => {
    it('should get student grades', async () => {
      const response = await request(app)
        .get('/api/students/grades')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('grades');
      expect(response.body).to.have.property('gpa');
      expect(response.body.grades).to.be.an('array');
    });
  });

  describe('GET /api/students/fees', () => {
    it('should get student fees', async () => {
      const response = await request(app)
        .get('/api/students/fees')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('fees');
      expect(response.body).to.have.property('totalOutstanding');
      expect(response.body.fees).to.be.an('array');
    });
  });

  describe('GET /api/students/timetable', () => {
    it('should get student timetable', async () => {
      const response = await request(app)
        .get('/api/students/timetable')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array');
    });
  });
});
