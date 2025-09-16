import { expect } from 'chai';
import sinon from 'sinon';
import pool from '../../src/config/database.js';
import Student from '../../src/models/student.js';
import bcrypt from 'bcryptjs';

describe('Student Model', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('create', () => {
    it('should hash password and insert student', async () => {
      const fakeHash = 'hashedpassword';
      sinon.stub(bcrypt, 'hash').resolves(fakeHash);
      const fakeResult = { insertId: 1 };
      sinon.stub(pool, 'execute').resolves([fakeResult]);

      const studentData = {
        email: 'test@example.com',
        password: 'password123',
        first_name: 'Test',
        last_name: 'Student'
      };

      const result = await Student.create(studentData);
      expect(result).to.equal(1);
      expect(bcrypt.hash.calledOnce).to.be.true;
      expect(pool.execute.calledOnce).to.be.true;
    });
  });

  describe('findByEmail', () => {
    it('should return student by email', async () => {
      const fakeStudent = { id: 1, email: 'test@example.com' };
      sinon.stub(pool, 'execute').resolves([[fakeStudent]]);

      const result = await Student.findByEmail('test@example.com');
      expect(result).to.deep.equal(fakeStudent);
    });
  });

  describe('findById', () => {
    it('should return student by id with department name', async () => {
      const fakeStudent = { id: 1, first_name: 'Test', department_name: 'CS' };
      sinon.stub(pool, 'execute').resolves([[fakeStudent]]);

      const result = await Student.findById(1);
      expect(result).to.deep.equal(fakeStudent);
    });
  });

  describe('update', () => {
    it('should update student data', async () => {
      const fakeExecute = sinon.stub(pool, 'execute').resolves([{ affectedRows: 1 }]);
      const studentData = {
        email: 'updated@example.com',
        is_active: true,
        first_name: 'Updated',
        last_name: 'Student',
        date_of_birth: '2000-01-01',
        gender: 'male',
        address: '123 Street',
        phone: '1234567890',
        department_id: 1,
        enrollment_year: 2020,
        current_year: 3,
        enrollment_date: '2020-09-01',
        graduation_date: '2024-06-01',
        status: 'active'
      };

      await Student.update(1, studentData);
      expect(fakeExecute.calledOnce).to.be.true;
    });
  });

  describe('delete', () => {
    it('should delete student by id', async () => {
      const fakeExecute = sinon.stub(pool, 'execute').resolves([{ affectedRows: 1 }]);
      await Student.delete(1);
      expect(fakeExecute.calledOnce).to.be.true;
    });
  });

  describe('getAll', () => {
    it('should return list of students with department names', async () => {
      const fakeStudents = [{ id: 1, department_name: 'CS' }];
      sinon.stub(pool, 'execute').resolves([fakeStudents]);

      const result = await Student.getAll(10, 0);
      expect(result).to.deep.equal(fakeStudents);
    });
  });

  describe('getByDepartment', () => {
    it('should return active students by department', async () => {
      const fakeStudents = [{ id: 1, department_id: 1 }];
      sinon.stub(pool, 'execute').resolves([fakeStudents]);

      const result = await Student.getByDepartment(1);
      expect(result).to.deep.equal(fakeStudents);
    });
  });

  describe('verifyPassword', () => {
    it('should verify password correctly', async () => {
      const fakeCompare = sinon.stub(bcrypt, 'compare').resolves(true);
      const result = await Student.verifyPassword('password123', 'hashedpassword');
      expect(result).to.be.true;
      expect(fakeCompare.calledOnce).to.be.true;
    });
  });
});
