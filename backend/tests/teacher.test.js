import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../server.js';
import pool from '../src/config/database.js';

const { expect } = chai;
chai.use(chaiHttp);

describe('Teacher Controller Tests', () => {
  let teacherToken;
  let teacherId;
  let userId;
  let courseId;

  before(async () => {
    // Create a test teacher user
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash('password123', 10);

    const [userResult] = await pool.execute(
      'INSERT INTO users (first_name, last_name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      ['Test', 'Teacher', 'testteacher@example.com', hashedPassword, 'teacher']
    );
    userId = userResult.insertId;

    const [teacherResult] = await pool.execute(
      'INSERT INTO teachers (user_id, department_id, hire_date) VALUES (?, ?, ?)',
      [userId, 1, '2020-01-01']
    );
    teacherId = teacherResult.insertId;

    // Create a test course
    const [courseResult] = await pool.execute(
      'INSERT INTO courses (name, code, department_id, credits) VALUES (?, ?, ?, ?)',
      ['Test Course', 'TEST101', 1, 3]
    );
    courseId = courseResult.insertId;

    // Login to get token
    const loginRes = await chai.request(app)
      .post('/api/auth/login')
      .send({
        email: 'testteacher@example.com',
        password: 'password123'
      });
    teacherToken = loginRes.body.token;
  });

  after(async () => {
    // Clean up test data
    await pool.execute('DELETE FROM courses WHERE id = ?', [courseId]);
    await pool.execute('DELETE FROM teachers WHERE id = ?', [teacherId]);
    await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
  });

  describe('GET /api/teacher/profile', () => {
    it('should get teacher profile', (done) => {
      chai.request(app)
        .get('/api/teacher/profile')
        .set('Authorization', `Bearer ${teacherToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('id', teacherId);
          expect(res.body).to.have.property('user');
          done();
        });
    });
  });

  describe('GET /api/teacher/classes', () => {
    it('should get teacher classes', (done) => {
      chai.request(app)
        .get('/api/teacher/classes')
        .set('Authorization', `Bearer ${teacherToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('array');
          done();
        });
    });
  });

  describe('POST /api/teacher/attendance', () => {
    it('should mark attendance for students', (done) => {
      chai.request(app)
        .post('/api/teacher/attendance')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          courseId: courseId,
          attendance: [
            { studentId: 1, status: 'present' },
            { studentId: 2, status: 'absent' }
          ],
          date: '2024-01-01'
        })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('message', 'Attendance marked successfully');
          done();
        });
    });
  });

  describe('POST /api/teacher/grades', () => {
    it('should enter grades for students', (done) => {
      chai.request(app)
        .post('/api/teacher/grades')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          courseId: courseId,
          grades: [
            { studentId: 1, grade: 'A', semester: 'Fall', year: 2024 },
            { studentId: 2, grade: 'B+', semester: 'Fall', year: 2024 }
          ]
        })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('message', 'Grades entered successfully');
          done();
        });
    });
  });

  describe('GET /api/teacher/timetable', () => {
    it('should get teacher timetable', (done) => {
      chai.request(app)
        .get('/api/teacher/timetable')
        .set('Authorization', `Bearer ${teacherToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('array');
          done();
        });
    });
  });
});
