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
    // Create test department
    await pool.execute('INSERT IGNORE INTO departments (code, name) VALUES (?, ?)', ['CS', 'Computer Science']);
    const [deptRows] = await pool.execute('SELECT id FROM departments WHERE code = ?', ['CS']);
    const deptId = deptRows[0].id;

    // Create a test teacher user
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash('password123', 10);

    const [userResult] = await pool.execute(
      'INSERT INTO users (first_name, last_name, email, password_hash, role, department_id, hire_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['Test', 'Teacher', 'testteacher@example.com', hashedPassword, 'teacher', deptId, '2020-01-01']
    );
    userId = userResult.insertId;
    teacherId = userId; // Since teacher is now in users table

    // Create a test course
    const [courseResult] = await pool.execute(
      'INSERT INTO courses (name, course_code, description, credits, semester) VALUES (?, ?, ?, ?, ?)',
      ['Test Course', 'TEST101', 'demo desc', 3, '2']
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
    try{
      await pool.execute('DELETE FROM courses WHERE id = ?', [courseId]);
      await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
      await pool.execute('DELETE FROM departments WHERE code = ?', ['CS']);
    }catch (error){
      console.log(error)
    }
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
