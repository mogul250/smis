import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../server.js';
import pool from '../src/config/database.js';

const { expect } = chai;
chai.use(chaiHttp);

describe('HOD Controller Tests', () => {
  let hodToken;
  let userId;
  let teacherId;
  let courseId;
  let studentId;
  let gradeId;

  before(async () => {
    // Pre-test cleanup to avoid duplicate entries
    await pool.execute('DELETE g FROM grades g JOIN users u ON g.teacher_id = u.id WHERE u.email IN (?, ?)', ['testteacher@example.com', 'testhod@example.com']);
    await pool.execute('DELETE FROM courses WHERE course_code IN (?, ?)', ['CS101', 'CS102']);
    await pool.execute('DELETE FROM users WHERE email IN (?, ?)', ['testteacher@example.com', 'testhod@example.com']);
    await pool.execute('DELETE FROM departments WHERE code = ?', ['CS']);

    // Create test department
    await pool.execute('INSERT IGNORE INTO departments (id, code, name) VALUES (?, ?, ?)', [1, 'CS', 'Computer Science']);
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

    // Create a test teacher user
    const [teacherResult] = await pool.execute(
      'INSERT INTO users (first_name, last_name, email, password_hash, role, department_id) VALUES (?, ?, ?, ?, ?, ?)',
      ['Test', 'Teacher', 'testteacher@example.com', hashedPassword, 'teacher', deptId]
    );
    teacherId = teacherResult.insertId;

    // Update department to set this user as HOD
    await pool.execute('UPDATE departments SET head_id = ? WHERE id = ?', [userId, deptId]);

    // Create a test course
    const [courseResult] = await pool.execute(
      'INSERT INTO courses (course_code, name, credits) VALUES (?, ?, ?)',
      ['CS101', 'Introduction to Computer Science', 3]
    );
    courseId = courseResult.insertId;

    // Create a test student to satisfy FK on grades.student_id
    const [studentResult] = await pool.execute(
      'INSERT INTO students (first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?)',
      ['Student', 'One', 'student1@example.com', hashedPassword]
    );
    studentId = studentResult.insertId;

    // Create a test grade referencing the created student
    const [gradeResult] = await pool.execute(
      'INSERT INTO grades (student_id, course_id, teacher_id, assessment_type, score, max_score, grade) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [studentId, courseId, teacherId, 'midterm', 85, 100, 'A']
    );
    gradeId = gradeResult.insertId;

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
    if (gradeId) {
      await pool.execute('DELETE FROM grades WHERE id = ?', [gradeId]);
    } else {
      await pool.execute('DELETE g FROM grades g JOIN users u ON g.teacher_id = u.id WHERE u.email IN (?, ?)', ['testteacher@example.com', 'testhod@example.com']);
    }
    if (courseId) {
      await pool.execute('DELETE FROM courses WHERE id = ?', [courseId]);
    } else {
      await pool.execute('DELETE FROM courses WHERE course_code IN (?, ?)', ['CS101', 'CS102']);
    }
    await pool.execute('UPDATE departments SET head_id = NULL WHERE head_id = ?', [userId || null]);
    await pool.execute('DELETE FROM users WHERE email IN (?, ?)', ['testteacher@example.com', 'testhod@example.com']);
    // Clean up test student
    if (studentId) {
      await pool.execute('DELETE FROM students WHERE id = ?', [studentId]);
    }
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
          activityId: gradeId,
          approve: true
        })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('message');
          done();
        });
    });
  });

  describe('POST /api/hod/reports/attendance', () => {
    it('should generate department attendance reports', (done) => {
      chai.request(app)
        .post('/api/hod/reports/attendance')
        .set('Authorization', `Bearer ${hodToken}`)
        .send({
          semester: 'Fall',
          year: 2023
        })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('report');
          expect(res.body.report).to.have.property('attendance');
          done();
        });
    });
  });

  describe('POST /api/hod/reports/grades', () => {
    it('should generate department grades reports', (done) => {
      chai.request(app)
        .post('/api/hod/reports/grades')
        .set('Authorization', `Bearer ${hodToken}`)
        .send({
          semester: 'Fall',
          year: 2023
        })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('report');
          expect(res.body.report).to.have.property('grades');
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
          expect(res.body).to.have.property('attendance');
          expect(res.body).to.have.property('grades');
          expect(res.body).to.have.property('courses');
          expect(res.body).to.have.property('teachers');
          done();
        });
    });
  });

  describe('POST /api/hod/courses/manage', () => {
    it('should add a new course', (done) => {
      chai.request(app)
        .post('/api/hod/courses/manage')
        .set('Authorization', `Bearer ${hodToken}`)
        .send({
          action: 'add',
          courseData: {
            course_code: 'CS102',
            name: 'Data Structures',
            credits: 4,
          }
        })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('message', 'Course added');
          done();
        });
    });
  });
});
