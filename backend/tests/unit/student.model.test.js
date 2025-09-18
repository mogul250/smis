import { expect } from 'chai';
import pool from '../../src/config/database.js';
import Student from '../../src/models/student.js';
import bcrypt from 'bcryptjs';

describe('Student Model - Integration Tests', () => {
  let testStudentId;
  let testDepartmentId;

  before(async function() {
    this.timeout(10000);

    // Create test department
    const [deptResult] = await pool.execute(
      'INSERT INTO departments (id, name, code) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)',
      [9991, 'Test Computer Science', 'TCS']
    );
    testDepartmentId = 9991;
  });

  after(async function() {
    this.timeout(10000);

    // Clean up test data
    if (testStudentId) {
      await pool.execute('DELETE FROM students WHERE id = ?', [testStudentId]);
    }
    await pool.execute('DELETE FROM departments WHERE id = ?', [testDepartmentId]);
  });

  describe('create', () => {
    it('should hash password and insert student with real database', async () => {
      const studentData = {
        email: 'teststudent9991@example.com',
        password: 'password123',
        first_name: 'Test',
        last_name: 'Student',
        student_id: 'TSTU9991',
        department_id: testDepartmentId,
        enrollment_year: 2023
      };

      const result = await Student.create(studentData);
      expect(result).to.be.a('number');
      testStudentId = result;

      // Verify student was created in database
      const [rows] = await pool.execute('SELECT * FROM students WHERE id = ?', [result]);
      expect(rows).to.have.lengthOf(1);
      const student = rows[0];
      expect(student.first_name).to.equal('Test');
      expect(student.last_name).to.equal('Student');
      expect(student.email).to.equal('teststudent9991@example.com');
      expect(student.student_id).to.equal('TSTU9991');

      // Verify password was hashed
      const isValidPassword = await bcrypt.compare('password123', student.password_hash);
      expect(isValidPassword).to.be.true;
    });
  });

  describe('findByEmail', () => {
    it('should return student by email with real database', async () => {
      const result = await Student.findByEmail('teststudent9991@example.com');

      expect(result).to.be.an('object');
      expect(result).to.have.property('id', testStudentId);
      expect(result).to.have.property('first_name', 'Test');
      expect(result).to.have.property('last_name', 'Student');
      expect(result).to.have.property('email', 'teststudent9991@example.com');
    });

    it('should return null for non-existent email', async () => {
      const result = await Student.findByEmail('nonexistent@example.com');
      expect(result).to.be.null;
    });
  });

  describe('findById', () => {
    it('should return student by id with department name', async () => {
      const result = await Student.findById(testStudentId);

      expect(result).to.be.an('object');
      expect(result).to.have.property('id', testStudentId);
      expect(result).to.have.property('first_name', 'Test');
      expect(result).to.have.property('last_name', 'Student');
      expect(result).to.have.property('department_name', 'Test Computer Science');
    });

    it('should return null for non-existent id', async () => {
      const result = await Student.findById(999999);
      expect(result).to.be.null;
    });
  });

  describe('update', () => {
    it('should update student data with real database', async () => {
      const updateData = {
        first_name: 'Updated',
        last_name: 'StudentName',
        email: 'updated9991@example.com',
        phone: '1234567890',
        address: '123 Test Street',
        current_year: 2,
        is_active: 1,
        date_of_birth: null,
        gender: null,
        department_id: testDepartmentId,
        enrollment_year: 2023,
        enrollment_date: null,
        graduation_date: null,
        status: 'active'
      };

      const result = await Student.update(testStudentId, updateData);
      expect(result).to.be.true;

      // Verify update in database
      const [rows] = await pool.execute('SELECT * FROM students WHERE id = ?', [testStudentId]);
      expect(rows).to.have.lengthOf(1);
      const student = rows[0];
      expect(student.first_name).to.equal('Updated');
      expect(student.last_name).to.equal('StudentName');
      expect(student.email).to.equal('updated9991@example.com');
      expect(student.phone).to.equal('1234567890');
    });
  });

  describe('getAll', () => {
    it('should return list of students with department names', async () => {
      const result = await Student.getAll(10, 0);

      expect(result).to.be.an('array');
      expect(result.length).to.be.greaterThan(0);

      // Check that our test student is included
      const testStudent = result.find(s => s.id === testStudentId);
      expect(testStudent).to.exist;
      expect(testStudent).to.have.property('department_name');
    });
  });

  describe('getByDepartment', () => {
    it('should return active students by department', async () => {
      const result = await Student.getByDepartment(testDepartmentId);

      expect(result).to.be.an('array');
      expect(result.length).to.be.greaterThan(0);

      // All students should belong to the test department
      result.forEach(student => {
        expect(student.department_id).to.equal(testDepartmentId);
        expect(student.is_active).to.equal(1); // MySQL TINYINT(1) returns 1 for true
      });
    });
  });

  describe('verifyPassword', () => {
    it('should verify password correctly', async () => {
      // Get the hashed password from database
      const [rows] = await pool.execute('SELECT password_hash FROM students WHERE id = ?', [testStudentId]);
      const hashedPassword = rows[0].password_hash;

      const result = await Student.verifyPassword('password123', hashedPassword);
      expect(result).to.be.true;
    });

    it('should return false for incorrect password', async () => {
      // Get the hashed password from database
      const [rows] = await pool.execute('SELECT password_hash FROM students WHERE id = ?', [testStudentId]);
      const hashedPassword = rows[0].password_hash;

      const result = await Student.verifyPassword('wrongpassword', hashedPassword);
      expect(result).to.be.false;
    });
  });

  describe('delete', () => {
    it('should delete student by id', async () => {
      const result = await Student.delete(testStudentId);
      expect(result).to.be.true;

      // Verify student was deleted from database
      const [rows] = await pool.execute('SELECT * FROM students WHERE id = ?', [testStudentId]);
      expect(rows).to.have.lengthOf(0);

      // Clear testStudentId so cleanup doesn't try to delete again
      testStudentId = null;
    });
  });
});
