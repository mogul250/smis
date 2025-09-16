import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../server.js';
import pool from '../src/config/database.js';
import Teacher from '../src/models/teacher.js';

const { expect } = chai;
chai.use(chaiHttp);

describe('Teacher Model Tests', () => {
  let teacherId;
  let deptId;

  before(async () => {
    // Create test department
    let [depResults] = await pool.execute('INSERT IGNORE INTO departments (code, name) VALUES (?, ?)', ['TM', 'Test-Department']);
    deptId = depResults.insertId;
    if (deptId === 0) {
      [depResults] = await pool.execute('SELECT id FROM departments WHERE code = ?', ['TM']);
      if (depResults.length > 0) {
        deptId = depResults[0].id;
      }
    }
  });

  after(async () => {
    // Clean up test data
    if (teacherId) {
      await pool.execute('DELETE FROM users WHERE id = ?', [teacherId]);
    }
    if (deptId) {
        await pool.execute('DELETE FROM departments WHERE id = ?', [deptId]);
    }
  });

  it('should create a new teacher', async () => {
    const teacherData = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'johndoe@example.com',
      password_hash: 'password123',
      department_id: deptId,
      hire_date: '2020-01-01',
      subjects: ['Math', 'Science']
    };
    teacherId = await Teacher.create(teacherData);
    expect(teacherId).to.be.a('number');
  });

  it('should find a teacher by ID', async () => {
    const teacher = await Teacher.findById(teacherId);
    expect(teacher).to.be.an.instanceOf(Teacher);
    expect(teacher.id).to.equal(teacherId);
  });

  it('should find a teacher by user ID', async () => {
    const teacher = await Teacher.findByUserId(teacherId);
    expect(teacher).to.be.an.instanceOf(Teacher);
    expect(teacher.id).to.equal(teacherId);
  });

  it('should update a teacher', async () => {
    const updateData = {
      department_id: deptId,
      hire_date: '2021-01-01',
      subjects: ['English', 'History'],
      status: 'active'
    };
    const result = await Teacher.update(teacherId, updateData);
    expect(result).to.be.true;
  });

  it('should get all teachers', async () => {
    const teachers = await Teacher.getAll();
    expect(teachers).to.be.an('array');
  });

  it('should get teachers by department', async () => {
    const teachers = await Teacher.getByDepartment(deptId);
    expect(teachers).to.be.an('array');
  });

  it('should delete a teacher', async () => {
    const result = await Teacher.delete(teacherId);
    expect(result).to.be.true;
  });
});
