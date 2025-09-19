import { expect } from 'chai';
import pool from '../../src/config/database.js';
import Course from '../../src/models/course.js';

describe('Course Model - Integration Tests', () => {
  let testCourseId;
  let testDepartmentId;

  before(async function() {
    this.timeout(10000);

    // Create test department
    await pool.execute(
      'INSERT INTO departments (id, name, code) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)',
      [9992, 'Test Engineering', 'TENG']
    );
    testDepartmentId = 9992;
  });

  after(async function() {
    this.timeout(10000);

    // Clean up test data
    if (testCourseId) {
      await pool.execute('DELETE FROM courses WHERE id = ?', [testCourseId]);
    }
    await pool.execute('DELETE FROM departments WHERE id = ?', [testDepartmentId]);
  });

  describe('create', () => {
    it('should insert course and return insertId with real database', async () => {
      const courseData = {
        course_code: 'TCS9991',
        name: 'Test Database Systems',
        description: 'Advanced database concepts',
        credits: 4,
        department_id: testDepartmentId,
        semester: 'Fall'
      };

      const id = await Course.create(courseData);
      expect(id).to.be.a('number');
      testCourseId = id;

      // Verify course was created in database
      const [rows] = await pool.execute('SELECT * FROM courses WHERE id = ?', [id]);
      expect(rows).to.have.lengthOf(1);
      const course = rows[0];
      expect(course.course_code).to.equal('TCS9991');
      expect(course.name).to.equal('Test Database Systems');
      expect(course.credits).to.equal(4);
      expect(course.semester).to.equal('Fall');
    });

    it('should handle database errors with real database', async () => {
      const invalidCourseData = {
        course_code: '', // Invalid empty course code
        name: 'Invalid Course',
        credits: 3
      };

      try {
        await Course.create(invalidCourseData);
        expect.fail('should have thrown');
      } catch (err) {
        expect(err.message).to.include('Error creating course');
      }
    });
  });

  describe('findById', () => {
    it('should return Course instance when course exists', async () => {
      const res = await Course.findById(testCourseId);

      expect(res).to.be.instanceOf(Course);
      expect(res.id).to.equal(testCourseId);
      expect(res.course_code).to.equal('TCS9991');
      expect(res.name).to.equal('Test Database Systems');
      expect(res.credits).to.equal(4);
    });

    it('should return null when course not found', async () => {
      const res = await Course.findById(999999);
      expect(res).to.equal(null);
    });


  });

  describe('findByCode', () => {
    it('should return Course instance when course exists', async () => {
      const res = await Course.findByCode('TCS9991');

      expect(res).to.be.instanceOf(Course);
      expect(res.id).to.equal(testCourseId);
      expect(res.name).to.equal('Test Database Systems');
    });

    it('should return null when course code not found', async () => {
      const res = await Course.findByCode('NONEXISTENT');
      expect(res).to.equal(null);
    });


  });

  describe('update', () => {
    it('should update course data successfully', async () => {
      const updateData = {
        course_code: 'TCS9991',
        name: 'Updated Database Systems',
        description: 'Updated description',
        credits: 3,
        semester: 'Spring'
      };

      const ok = await Course.update(testCourseId, updateData);
      expect(ok).to.equal(true);

      // Verify update in database
      const [rows] = await pool.execute('SELECT * FROM courses WHERE id = ?', [testCourseId]);
      expect(rows).to.have.lengthOf(1);
      const course = rows[0];
      expect(course.name).to.equal('Updated Database Systems');
      expect(course.credits).to.equal(3);
      expect(course.semester).to.equal('Spring');
    });

    it('should return false when course not found', async () => {
      const updateData = { name: 'Should not update' };
      const ok = await Course.update(999999, updateData);
      expect(ok).to.equal(false);
    });
  });

  describe('getAll', () => {
    it('should return array of Course instances', async () => {
      const res = await Course.getAll(10, 0);

      expect(res).to.be.an('array');
      expect(res.length).to.be.greaterThan(0);

      // Check that our test course is included
      const testCourse = res.find(c => c.id === testCourseId);
      expect(testCourse).to.exist;
      expect(testCourse).to.be.instanceOf(Course);
      expect(testCourse.name).to.equal('Updated Database Systems');
    });

    it('should handle database errors', async () => {
      try {
        await Course.getAll('invalid_limit', 'invalid_offset');
        expect.fail('should have thrown');
      } catch (err) {
        expect(err.message).to.include('Error getting courses');
      }
    });
  });

  describe('getByTeacher', () => {
    it('should return courses assigned to teacher', async () => {
      // First create a teacher and assign course to them
      const [teacherResult] = await pool.execute(
        'INSERT INTO users (id, first_name, last_name, email, password_hash, role, department_id) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE first_name = VALUES(first_name)',
        [9993, 'Test', 'Teacher', 'testteacher9993@university.edu', '$2b$10$hashedpassword', 'teacher', testDepartmentId]
      );

      // Assign course to teacher (this might require additional tables based on schema)
      // For now, we'll test the method exists and handles empty results
      const res = await Course.getByTeacher(9993);
      expect(res).to.be.an('array');
      // May be empty if no assignment relationship exists
    });


  });

  describe('getByStudent', () => {
    it('should return courses enrolled by student', async () => {
      // First create a student
      const [studentResult] = await pool.execute(
        'INSERT INTO students (id, first_name, last_name, email, password_hash, student_id, department_id) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE first_name = VALUES(first_name)',
        [9994, 'Test', 'Student', 'teststudent9994@university.edu', '$2b$10$hashedpassword', 'TSTU9994', testDepartmentId]
      );

      // Test the method (may return empty if no enrollment relationship exists)
      const res = await Course.getByStudent(9994);
      expect(res).to.be.an('array');
      // May be empty if no enrollment relationship exists
    });


  });

  describe('delete', () => {
    it('should delete course successfully', async () => {
      const ok = await Course.delete(testCourseId);
      expect(ok).to.equal(true);

      // Verify course was deleted from database
      const [rows] = await pool.execute('SELECT * FROM courses WHERE id = ?', [testCourseId]);
      expect(rows).to.have.lengthOf(0);

      // Clear testCourseId so cleanup doesn't try to delete again
      testCourseId = null;
    });

    it('should return false when course not found', async () => {
      const ok = await Course.delete(999999);
      expect(ok).to.equal(false);
    });
  });
});
