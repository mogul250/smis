import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../server.js';
import pool from '../src/config/database.js';

const { expect } = chai;
chai.use(chaiHttp);

describe('HOD Controller Extra Tests (coverage boost)', () => {
  let hodToken;
  let deptId;
  let hodId;
  let teacherId;
  let studentId;
  let courseId;
  let gradeId;

  before(async () => {
    // Cleanup potential leftovers from previous runs
    await pool.execute('DELETE g FROM grades g JOIN users u ON g.teacher_id = u.id WHERE u.email IN (?, ?)', ['ithod@example.com', 'itteacher@example.com']);
    await pool.execute('DELETE FROM courses WHERE course_code IN (?, ?)', ['IT101', 'IT102']);
    await pool.execute('DELETE FROM users WHERE email IN (?, ?)', ['ithod@example.com', 'itteacher@example.com']);
    await pool.execute('DELETE FROM students WHERE email IN (?)', ['itstudent@example.com']);
    await pool.execute('DELETE FROM departments WHERE code = ?', ['IT']);

    // Create department
    await pool.execute('INSERT INTO departments (code, name) VALUES (?, ?)', ['IT', 'Information Technology']);
    const [dRows] = await pool.execute('SELECT id FROM departments WHERE code = ?', ['IT']);
    deptId = dRows[0].id;

    // Hash password
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create HOD
    {
      const [res] = await pool.execute(
        'INSERT INTO users (first_name, last_name, email, password_hash, role, department_id) VALUES (?, ?, ?, ?, ?, ?)',
        ['IT', 'HOD', 'ithod@example.com', hashedPassword, 'hod', deptId]
      );
      hodId = res.insertId;
    }
    // Set department head to this HOD for department authorization middleware
    await pool.execute('UPDATE departments SET head_id = ? WHERE id = ?', [hodId, deptId]);

    // Create Teacher
    {
      const [res] = await pool.execute(
        'INSERT INTO users (first_name, last_name, email, password_hash, role, department_id) VALUES (?, ?, ?, ?, ?, ?)',
        ['IT', 'Teacher', 'itteacher@example.com', hashedPassword, 'teacher', deptId]
      );
      teacherId = res.insertId;
    }

    // Create student
    {
      const [res] = await pool.execute(
        'INSERT INTO students (first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?)',
        ['IT', 'Student', 'itstudent@example.com', hashedPassword]
      );
      studentId = res.insertId;
    }

    // Create a course
    {
      const [res] = await pool.execute(
        'INSERT INTO courses (course_code, name, credits) VALUES (?, ?, ?)',
        ['IT101', 'Intro to IT', 3]
      );
      courseId = res.insertId;
    }

    // Create a grade to test reject flow
    {
      const [res] = await pool.execute(
        'INSERT INTO grades (student_id, course_id, teacher_id, assessment_type, score, max_score, grade) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [studentId, courseId, teacherId, 'quiz', 75, 100, 'B']
      );
      gradeId = res.insertId;
    }

    // Login as HOD
    const loginRes = await chai.request(app)
      .post('/api/auth/login')
      .send({ email: 'ithod@example.com', password: 'password123' });
    hodToken = loginRes.body.token;
  });

  after(async () => {
    await pool.execute('UPDATE departments SET head_id = NULL WHERE head_id = ?', [hodId || null]);
    if (gradeId) await pool.execute('DELETE FROM grades WHERE id = ?', [gradeId]);
    if (courseId) await pool.execute('DELETE FROM courses WHERE id = ?', [courseId]);
    await pool.execute('DELETE FROM courses WHERE course_code IN (?, ?)', ['IT101', 'IT102']);
    if (studentId) await pool.execute('DELETE FROM students WHERE id = ?', [studentId]);
    await pool.execute('DELETE FROM users WHERE email IN (?, ?)', ['ithod@example.com', 'itteacher@example.com']);
    await pool.execute('DELETE FROM departments WHERE code = ?', ['IT']);
  });

  it('should reject teacher activity (grade) successfully', (done) => {
    chai.request(app)
      .post('/api/hod/activities/approve')
      .set('Authorization', `Bearer ${hodToken}`)
      .send({
        activityType: 'grade',
        activityId: gradeId,
        approve: false
      })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('message');
        done();
      });
  });

  it('should add, edit and delete a course via manage endpoint', async () => {
    // Add IT102
    const addRes = await chai.request(app)
      .post('/api/hod/courses/manage')
      .set('Authorization', `Bearer ${hodToken}`)
      .send({
        action: 'add',
        courseData: {
          course_code: 'IT102',
          name: 'Networking Basics',
          credits: 4
        }
      });
    expect(addRes).to.have.status(200);
    expect(addRes.body).to.have.property('message', 'Course added');
    const addedCourseId = addRes.body.courseId;

    // Edit IT102
    const editRes = await chai.request(app)
      .post('/api/hod/courses/manage')
      .set('Authorization', `Bearer ${hodToken}`)
      .send({
        action: 'edit',
        courseData: {
          id: addedCourseId,
          course_code: 'IT102',
          name: 'Networking Fundamentals',
          description: 'Introductory networking',
          credits: 5,
          semester: 'Fall'
        }
      });
    expect(editRes).to.have.status(200);
    expect(editRes.body).to.have.property('message', 'Course updated');

    // Delete IT102
    const deleteRes = await chai.request(app)
      .post('/api/hod/courses/manage')
      .set('Authorization', `Bearer ${hodToken}`)
      .send({
        action: 'delete',
        courseData: {
          id: addedCourseId
        }
      });
    expect(deleteRes).to.have.status(200);
    expect(deleteRes.body).to.have.property('message', 'Course deleted');
  });

  it('should get department timetable (array)', (done) => {
    chai.request(app)
      .get('/api/hod/timetable')
      .set('Authorization', `Bearer ${hodToken}`)
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('array');
        done();
      });
  });
});
