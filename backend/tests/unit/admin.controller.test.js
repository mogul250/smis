import { expect } from 'chai';
import sinon from 'sinon';

import AdminController from '../../src/controllers/admin-controller.js';
import User from '../../src/models/user.js';
import Student from '../../src/models/student.js';
import Teacher from '../../src/models/teacher.js';
import AcademicCalendar from '../../src/models/academic-calendar.js';
import Timetable from '../../src/models/timetable.js';
import pool from '../../src/config/database.js';

let hadStuFindByUserId;

describe('Admin Controller Unit Tests', () => {
  let sandbox;
  let req;
  let res;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    req = { body: {}, params: {}, query: {} };
    res = {
      status: sandbox.stub().returnsThis(),
      json: sandbox.spy()
    };

    // Ensure Student.findByUserId exists for stubbing; controller calls it but Student model lacks it
    hadStuFindByUserId = Object.prototype.hasOwnProperty.call(Student, 'findByUserId');
    if (!hadStuFindByUserId) {
      // define a noop so sinon can stub it
      Student.findByUserId = () => {};
    }
  });

  afterEach(() => {
    sandbox.restore();
    // Clean up injected method if it did not originally exist
    if (!hadStuFindByUserId) {
      delete Student.findByUserId;
    }
  });

  describe('createUser', () => {
    it('should return 400 if required fields are missing', async () => {
      req.body = {};
      await AdminController.createUser(req, res);
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ message: 'Missing required fields' })).to.be.true;
    });

    it('should return 409 if user already exists', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'secret123',
        role: 'teacher'
      };
      sandbox.stub(User, 'findByEmail').resolves({ id: 1 });
      await AdminController.createUser(req, res);
      expect(res.status.calledWith(409)).to.be.true;
      expect(res.json.calledWith({ message: 'User with this email already exists' })).to.be.true;
    });

    it('should return 400 for student role without departmentId (after creating user)', async () => {
      req.body = {
        firstName: 'Stu',
        lastName: 'Dent',
        email: 'student@example.com',
        password: 'secret123',
        role: 'student'
      };
      sandbox.stub(User, 'findByEmail').resolves(null);
      const userCreateStub = sandbox.stub(User, 'create').resolves(100);
      const studentCreateStub = sandbox.stub(Student, 'create').resolves(200);

      await AdminController.createUser(req, res);

      expect(userCreateStub.calledOnce).to.be.true;
      expect(studentCreateStub.called).to.be.false;
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ message: 'Department ID required for students' })).to.be.true;
    });

    it('should create teacher successfully and not call Student.create', async () => {
      req.body = {
        firstName: 'Teach',
        lastName: 'Er',
        email: 'teach@example.com',
        password: 'secret123',
        role: 'teacher'
      };
      sandbox.stub(User, 'findByEmail').resolves(null);
      const userCreateStub = sandbox.stub(User, 'create').resolves(101);
      const studentCreateStub = sandbox.stub(Student, 'create').resolves(201);

      await AdminController.createUser(req, res);

      expect(userCreateStub.calledOnce).to.be.true;
      expect(studentCreateStub.called).to.be.false;
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      const payload = res.json.getCall(0).args[0];
      expect(payload).to.have.property('message', 'User created successfully');
      expect(payload).to.have.property('userId', 101);
    });

    it('should create student successfully when departmentId provided', async () => {
      req.body = {
        firstName: 'Stu',
        lastName: 'Dent',
        email: 'student2@example.com',
        password: 'secret123',
        role: 'student',
        departmentId: 1,
        additionalData: { enrollmentYear: 2024 }
      };
      sandbox.stub(User, 'findByEmail').resolves(null);
      const userCreateStub = sandbox.stub(User, 'create').resolves(102);
      const studentCreateStub = sandbox.stub(Student, 'create').resolves(202);

      await AdminController.createUser(req, res);

      expect(userCreateStub.calledOnce).to.be.true;
      expect(studentCreateStub.calledOnce).to.be.true;
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      const payload = res.json.getCall(0).args[0];
      expect(payload).to.have.property('message', 'User created successfully');
      expect(payload).to.have.property('userId', 102);
    });

    it('should handle internal error and return 500', async () => {
      req.body = {
        firstName: 'Err',
        lastName: 'Or',
        email: 'err@example.com',
        password: 'secret123',
        role: 'teacher'
      };
      sandbox.stub(User, 'findByEmail').resolves(null);
      sandbox.stub(User, 'create').throws(new Error('boom'));

      await AdminController.createUser(req, res);

      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.getCall(0).args[0]).to.have.property('message', 'boom');
    });
  });

  describe('getAllUsers', () => {
    it('should return users with pagination (no filters)', async () => {
      req.query = {}; // defaults: page=1, limit=10
      const rows = [
        { id: 1, first_name: 'A', last_name: 'B', email: 'a@example.com', role: 'teacher', created_at: new Date(), department_name: 'CS' }
      ];
      const execStub = sandbox.stub(pool, 'execute');
      execStub.onFirstCall().resolves([rows]); // main query
      execStub.onSecondCall().resolves([[{ total: rows.length }]]); // count

      await AdminController.getAllUsers(req, res);

      expect(execStub.calledTwice).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      const payload = res.json.getCall(0).args[0];
      expect(payload).to.have.property('users').that.is.an('array').with.lengthOf(1);
      expect(payload).to.have.property('pagination');
      expect(payload.pagination).to.include({ page: 1, limit: 10 });
      expect(payload.pagination).to.have.property('total', 1);
    });

    it('should return users with role, departmentId, and search filters', async () => {
      req.query = { role: 'teacher', departmentId: '2', search: 'john', page: '2', limit: '5' };
      const rows = [
        { id: 2, first_name: 'John', last_name: 'Doe', email: 'john@example.com', role: 'teacher', created_at: new Date(), department_name: 'Math' }
      ];
      const execStub = sandbox.stub(pool, 'execute');
      execStub.onFirstCall().resolves([rows]);
      execStub.onSecondCall().resolves([[{ total: 7 }]]);

      await AdminController.getAllUsers(req, res);

      expect(execStub.calledTwice).to.be.true;
      const payload = res.json.getCall(0).args[0];
      expect(payload.users).to.be.an('array').with.lengthOf(1);
      expect(payload.pagination).to.include({ page: 2, limit: 5 });
      expect(payload.pagination.pages).to.equal(Math.ceil(7 / 5));
    });

    it('should handle internal error and return 500', async () => {
      sandbox.stub(pool, 'execute').throws(new Error('db fail'));
      await AdminController.getAllUsers(req, res);
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.getCall(0).args[0]).to.have.property('message', 'db fail');
    });
  });

  describe('updateUser', () => {
    it('should return 404 when user not found', async () => {
      req.params = { userId: 123 };
      sandbox.stub(User, 'findById').resolves(null);

      await AdminController.updateUser(req, res);

      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'User not found' })).to.be.true;
    });

    it('should update user successfully (generic update)', async () => {
      req.params = { userId: 123 };
      req.body = { firstName: 'New', lastName: 'Name', email: 'new@example.com' };
      sandbox.stub(User, 'findById').resolves({ id: 123 });
      const updateStub = sandbox.stub(User, 'update').resolves();

      await AdminController.updateUser(req, res);

      expect(updateStub.calledOnce).to.be.true;
      expect(res.json.calledWith({ message: 'User updated successfully' })).to.be.true;
    });

    it('should update student role-specific data when role=student and departmentId provided', async () => {
      req.params = { userId: 200 };
      req.body = { role: 'student', departmentId: 5 };
      sandbox.stub(User, 'findById').resolves({ id: 200 });
      sandbox.stub(User, 'update').resolves();
      const findStuStub = sandbox.stub(Student, 'findByUserId').resolves({ id: 300 });
      const stuUpdateStub = sandbox.stub(Student, 'update').resolves();

      await AdminController.updateUser(req, res);

      expect(findStuStub.calledOnce).to.be.true;
      expect(stuUpdateStub.calledWith(300, { department_id: 5 })).to.be.true;
      expect(res.json.calledWith({ message: 'User updated successfully' })).to.be.true;
    });

    it('should update teacher role-specific data when role=teacher and departmentId provided', async () => {
      req.params = { userId: 201 };
      req.body = { role: 'teacher', departmentId: 7 };
      sandbox.stub(User, 'findById').resolves({ id: 201 });
      sandbox.stub(User, 'update').resolves();
      const findTeachStub = sandbox.stub(Teacher, 'findByUserId').resolves({ id: 400 });
      const teachUpdateStub = sandbox.stub(Teacher, 'update').resolves();

      await AdminController.updateUser(req, res);

      expect(findTeachStub.calledOnce).to.be.true;
      expect(teachUpdateStub.calledWith(400, { department_id: 7 })).to.be.true;
      expect(res.json.calledWith({ message: 'User updated successfully' })).to.be.true;
    });

    it('should handle internal error and return 500', async () => {
      req.params = { userId: 500 };
      req.body = { firstName: 'X' };
      sandbox.stub(User, 'findById').resolves({ id: 500 });
      sandbox.stub(User, 'update').throws(new Error('update fail'));

      await AdminController.updateUser(req, res);

      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.getCall(0).args[0]).to.have.property('message', 'update fail');
    });
  });

  describe('deleteUser', () => {
    it('should return 404 when user not found', async () => {
      req.params = { userId: 999 };
      sandbox.stub(User, 'findById').resolves(null);

      await AdminController.deleteUser(req, res);

      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'User not found' })).to.be.true;
    });

    it('should delete user successfully', async () => {
      req.params = { userId: 5 };
      sandbox.stub(User, 'findById').resolves({ id: 5 });
      const delStub = sandbox.stub(User, 'delete').resolves();

      await AdminController.deleteUser(req, res);

      expect(delStub.calledOnce).to.be.true;
      expect(res.json.calledWith({ message: 'User deleted successfully' })).to.be.true;
    });

    it('should handle internal error and return 500', async () => {
      req.params = { userId: 6 };
      sandbox.stub(User, 'findById').resolves({ id: 6 });
      sandbox.stub(User, 'delete').throws(new Error('del fail'));

      await AdminController.deleteUser(req, res);

      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.getCall(0).args[0]).to.have.property('message', 'del fail');
    });
  });

  describe('manageAcademicCalendar', () => {
    it('should return 400 when required fields are missing', async () => {
      req.body = { description: 'No required fields' };
      await AdminController.manageAcademicCalendar(req, res);
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ message: 'Missing required fields' })).to.be.true;
    });

    it('should create event successfully', async () => {
      req.body = {
        eventName: 'Holiday',
        eventDate: '2024-01-01',
        eventType: 'holiday',
        description: 'New Year'
      };
      sandbox.stub(AcademicCalendar, 'create').resolves(77);

      await AdminController.manageAcademicCalendar(req, res);

      expect(res.status.calledWith(201)).to.be.true;
      const payload = res.json.getCall(0).args[0];
      expect(payload).to.have.property('message', 'Calendar event added successfully');
      expect(payload).to.have.property('eventId', 77);
    });

    it('should handle internal error and return 500', async () => {
      req.body = {
        eventName: 'Exam',
        eventDate: '2024-02-01',
        eventType: 'exam'
      };
      sandbox.stub(AcademicCalendar, 'create').throws(new Error('calendar fail'));

      await AdminController.manageAcademicCalendar(req, res);

      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.getCall(0).args[0]).to.have.property('message', 'calendar fail');
    });
  });

  describe('setupTimetable', () => {
    it('should add timetable slot (action=add)', async () => {
      req.body = { action: 'add', timetableData: { course_id: 1 } };
      sandbox.stub(Timetable, 'createSlot').resolves(9);

      await AdminController.setupTimetable(req, res);

      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.getCall(0).args[0]).to.deep.equal({ message: 'Timetable slot added successfully', slotId: 9 });
    });

    it('should update timetable slot (action=update) when found', async () => {
      req.body = { action: 'update', timetableData: { id: 2 } };
      sandbox.stub(Timetable, 'update').resolves(true);

      await AdminController.setupTimetable(req, res);

      expect(res.json.calledWith({ message: 'Timetable slot updated successfully' })).to.be.true;
    });

    it('should return 404 when updating non-existing slot', async () => {
      req.body = { action: 'update', timetableData: { id: 99 } };
      sandbox.stub(Timetable, 'update').resolves(false);

      await AdminController.setupTimetable(req, res);

      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Timetable slot not found' })).to.be.true;
    });

    it('should delete timetable slot (action=delete) when found', async () => {
      req.body = { action: 'delete', timetableData: { id: 3 } };
      sandbox.stub(Timetable, 'delete').resolves(true);

      await AdminController.setupTimetable(req, res);

      expect(res.json.calledWith({ message: 'Timetable slot deleted successfully' })).to.be.true;
    });

    it('should return 404 when deleting non-existing slot', async () => {
      req.body = { action: 'delete', timetableData: { id: 404 } };
      sandbox.stub(Timetable, 'delete').resolves(false);

      await AdminController.setupTimetable(req, res);

      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Timetable slot not found' })).to.be.true;
    });

    it('should return 400 for invalid action', async () => {
      req.body = { action: 'unknown', timetableData: {} };

      await AdminController.setupTimetable(req, res);

      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ message: 'Invalid action' })).to.be.true;
    });

    it('should handle internal error and return 500', async () => {
      req.body = { action: 'add', timetableData: {} };
      sandbox.stub(Timetable, 'createSlot').throws(new Error('timetable fail'));

      await AdminController.setupTimetable(req, res);

      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.getCall(0).args[0]).to.have.property('message', 'timetable fail');
    });
  });

  describe('getSystemStats', () => {
    it('should return system stats successfully', async () => {
      const execStub = sandbox.stub(pool, 'execute');
      // Total users
      execStub.onCall(0).resolves([[{ totalUsers: 10 }]]);
      // Total students
      execStub.onCall(1).resolves([[{ totalStudents: 20 }]]);
      // Total teachers
      execStub.onCall(2).resolves([[{ totalTeachers: 5 }]]);

      await AdminController.getSystemStats(req, res);

      expect(execStub.callCount).to.equal(3);
      expect(res.json.calledOnce).to.be.true;
      const stats = res.json.getCall(0).args[0];
      expect(stats).to.deep.equal({
        totalUsers: 10,
        totalStudents: 20,
        totalTeachers: 5
      });
    });

    it('should handle internal error and return 500', async () => {
      sandbox.stub(pool, 'execute').throws(new Error('stats fail'));

      await AdminController.getSystemStats(req, res);

      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.getCall(0).args[0]).to.have.property('message', 'stats fail');
    });
  });
});
