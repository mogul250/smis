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
  let classId;

  before(async () => {
    // Clean up from previous runs to ensure a clean slate
    try {
      const [users] = await pool.execute("SELECT id FROM users WHERE email = 'testteacher@example.com'");
      if (users.length > 0) {
        await pool.execute('DELETE FROM classes WHERE created_by = ?', [users[0].id]);
      }
      await pool.execute("DELETE FROM courses WHERE course_code = 'TEST101'");
      await pool.execute("DELETE FROM users WHERE email = 'testteacher@example.com'");
      await pool.execute("DELETE FROM departments WHERE code = 'CS'");
    } catch (e) {
      // It's fine if cleanup fails, e.g. on a fresh DB
    }
    // Create test department
    let [depResults] = await pool.execute('INSERT IGNORE INTO departments (code, name) VALUES (?, ?)', ['CS', 'Computer Science']);

    let deptId = depResults.insertId;
    if (deptId === 0) {
      [depResults] = await pool.execute('SELECT id FROM departments WHERE code = ?', ['CS']);
      if (depResults.length > 0) {
        deptId = depResults[0].id;
      }
    }


    // Create a test teacher user
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash('password123', 10);

    const [userResult] = await pool.execute(
      'INSERT INTO users (first_name, last_name, email, password_hash, role, department_id, hire_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['Test', 'Teacher', 'testteacher@example.com', hashedPassword, 'teacher', deptId, '2020-01-01']
    );
    userId = userResult.insertId;
    teacherId = userId;

    // Login to get token
    const loginRes = await chai.request(app)
      .post('/api/auth/login')
      .send({
        email: 'testteacher@example.com',
        password: 'password123'
      });
    teacherToken = loginRes.body.token;

    // Create a test course

    const [courseResult] = await pool.execute(
      'INSERT INTO courses (course_code, name, description, credits, semester) VALUES (?, ?, ?, ?, ?)',
      ['TEST101', 'Test Course', 'demo desc', 3, '2']
    );
    courseId = courseResult.insertId;

    // Create a test class
    const [classResult] = await pool.execute(
      'INSERT INTO classes (academic_year, start_date, end_date, is_active, students, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      ['2024', '2024-01-01', '2024-12-31', 1, JSON.stringify([]), userId]
    );
    classId = classResult.insertId;

    // Create a timetable entry for the teacher
    await pool.execute(

      'INSERT INTO timetable (course_id, teacher_id, class_id, day_of_week, start_time, end_time, semester, academic_year) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [courseId, userId, classId, 1, '09:00:00', '10:30:00', '2', '2024']
    );

  });

  after(async () => {
    // Clean up test data
    try {
      if (courseId && userId) {
        await pool.execute('DELETE FROM timetable WHERE course_id = ? AND teacher_id = ?', [courseId, userId]);
      }
      if (classId) {
        await pool.execute('DELETE FROM classes WHERE id = ?', [classId]);
      }
      if (courseId) {
        await pool.execute('DELETE FROM courses WHERE id = ?', [courseId]);
      }
      if (userId) {
        await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
      }
      await pool.execute('DELETE FROM departments WHERE code = ?', ['CS']);
    } catch (error) {
      console.error('Error during test cleanup:', error);
    }
  });


  describe('GET /api/teachers/profile', () => {
    it('should get teacher profile', (done) => {
      chai.request(app)
        .get('/api/teachers/profile')
        .set('Authorization', `Bearer ${teacherToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('user');
          expect(res.body.user).to.have.property('id', teacherId);
          done();
        });
    });
  });

  describe('PUT /api/teachers/profile', () => {
    it('should update teacher profile', (done) => {
      const newProfileData = {
        first_name: 'Updated'
      };

      chai.request(app)
        .put('/api/teachers/profile')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(newProfileData)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('message', 'Profile updated successfully');
          done();
        });
    });

    it('should not update profile with invalid fields', (done) => {
      const newProfileData = {
        role: 'admin'
      };
      chai.request(app)
        .put('/api/teachers/profile')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(newProfileData)
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.have.property('message', 'Invalid fields: role');
          done();
        });
    });

    it('should not update profile with invalid department ID', (done) => {
      const newProfileData = {
        department_id: 'abc'
      };
      chai.request(app)
        .put('/api/teachers/profile')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(newProfileData)
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.have.property('message', 'Invalid department ID');
          done();
        });
    });
  });



  describe('GET /api/teachers/classes', () => {
    it('should get teacher classes', (done) => {
      chai.request(app)
        .get('/api/teachers/classes')
        .set('Authorization', `Bearer ${teacherToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('array');
          done();
        });
    });
  });

  describe('POST /api/teachers/attendance', () => {
    it('should mark attendance for students', (done) => {
      chai.request(app)
        .post('/api/teachers/attendance')
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

  describe('POST /api/teachers/grades', () => {
    it('should enter grades for students', (done) => {
      chai.request(app)
        .post('/api/teachers/grades')
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

  describe('GET /api/teachers/timetable', () => {
    it('should get teacher timetable', (done) => {
      chai.request(app)
        .get('/api/teachers/timetable')
        .set('Authorization', `Bearer ${teacherToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('array');
          done();
        });
    });
  });
});
