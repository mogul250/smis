import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../../server.js';
import sinon from 'sinon';
import Student from '../../src/models/student.js';
import Attendance from '../../src/models/attendance.js';
import Grade from '../../src/models/grade.js';
import Fee from '../../src/models/fee.js';
import Timetable from '../../src/models/timetable.js';
import StudentController from '../../src/controllers/student-controller.js';

const { expect } = chai;
chai.use(chaiHttp);

describe('Student Controller Unit Tests', () => {
  let req, res, sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    req = {
      user: { id: 1 },
      body: {},
      query: {}
    };
    res = {
      json: sandbox.spy(),
      status: sandbox.stub().returnsThis()
    };
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('getProfile', () => {
    it('should return 404 if student not found', async () => {
      sandbox.stub(Student, 'findById').resolves(null);
      await StudentController.getProfile(req, res);
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Student not found' })).to.be.true;
    });

    it('should return profile when student exists', async () => {
      const student = { id: 1, email: 's@example.com', first_name: 'S', last_name: 'T' };
      sandbox.stub(Student, 'findById').resolves(student);
      await StudentController.getProfile(req, res);
      expect(res.json.calledOnce).to.be.true;
      const payload = res.json.getCall(0).args[0];
      expect(payload).to.deep.equal({
        id: student.id,
        user: { email: student.email, first_name: student.first_name, last_name: student.last_name }
      });
    });

    it('should handle internal error', async () => {
      sandbox.stub(Student, 'findById').throws(new Error('boom'));
      await StudentController.getProfile(req, res);
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWith({ message: 'internal server error' })).to.be.true;
    });
  });

  describe('updateProfile', () => {
    it('should return 404 if student not found', async () => {
      sandbox.stub(Student, 'findById').resolves(null);
      await StudentController.updateProfile(req, res);
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Student not found' })).to.be.true;
    });

    it('should return 400 for invalid fields', async () => {
      sandbox.stub(Student, 'findById').resolves({ id: 1 });
      req.body = { invalidField: 'test' };
      await StudentController.updateProfile(req, res);
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ message: 'Invalid fields: invalidField' })).to.be.true;
    });

    it('should return 400 for invalid enrollment date', async () => {
        sandbox.stub(Student, 'findById').resolves({ id: 1 });
        req.body = { enrollment_date: 'invalid' };
        await StudentController.updateProfile(req, res);
        expect(res.status.calledWith(400)).to.be.true;
        expect(res.json.calledWith({ message: 'Invalid enrollment date' })).to.be.true;
    });

    it('should return 400 for invalid graduation date', async () => {
        sandbox.stub(Student, 'findById').resolves({ id: 1 });
        req.body = { graduation_date: 'invalid' };
        await StudentController.updateProfile(req, res);
        expect(res.status.calledWith(400)).to.be.true;
        expect(res.json.calledWith({ message: 'Invalid graduation date' })).to.be.true;
    });

    it('should return 400 for invalid department ID', async () => {
        sandbox.stub(Student, 'findById').resolves({ id: 1 });
        req.body = { department_id: 'invalid' };
        await StudentController.updateProfile(req, res);
        expect(res.status.calledWith(400)).to.be.true;
        expect(res.json.calledWith({ message: 'Invalid department ID' })).to.be.true;
    });

    it('should return 400 for invalid enrollment year', async () => {
        sandbox.stub(Student, 'findById').resolves({ id: 1 });
        req.body = { enrollment_year: 'invalid' };
        await StudentController.updateProfile(req, res);
        expect(res.status.calledWith(400)).to.be.true;
        expect(res.json.calledWith({ message: 'Invalid enrollment year' })).to.be.true;
    });

    it('should return 400 for invalid current year', async () => {
        sandbox.stub(Student, 'findById').resolves({ id: 1 });
        req.body = { current_year: 'invalid' };
        await StudentController.updateProfile(req, res);
        expect(res.status.calledWith(400)).to.be.true;
        expect(res.json.calledWith({ message: 'Invalid current year' })).to.be.true;
    });

    it('should return 400 for invalid status', async () => {
        sandbox.stub(Student, 'findById').resolves({ id: 1 });
        req.body = { status: 'invalid' };
        await StudentController.updateProfile(req, res);
        expect(res.status.calledWith(400)).to.be.true;
        expect(res.json.calledWith({ message: 'Invalid status' })).to.be.true;
    });

    it('should update profile successfully', async () => {
      sandbox.stub(Student, 'findById').resolves({ id: 1 });
      sandbox.stub(Student, 'update').resolves();
      req.body = { first_name: 'Test' };
      await StudentController.updateProfile(req, res);
      expect(res.json.calledWith({ message: 'Profile updated successfully' })).to.be.true;
    });

    it('should update profile with multiple valid fields', async () => {
      sandbox.stub(Student, 'findById').resolves({ id: 1 });
      const updateStub = sandbox.stub(Student, 'update').resolves();
      req.body = {
        first_name: 'Alice',
        last_name: 'Doe',
        department_id: 1,
        enrollment_year: 2024,
        current_year: 2,
        status: 'active'
      };
      await StudentController.updateProfile(req, res);
      expect(updateStub.calledOnce).to.be.true;
      expect(res.json.calledWith({ message: 'Profile updated successfully' })).to.be.true;
    });

    it('should handle internal error during update', async () => {
      sandbox.stub(Student, 'findById').resolves({ id: 1 });
      sandbox.stub(Student, 'update').throws(new Error('db error'));
      req.body = { first_name: 'Test' };
      await StudentController.updateProfile(req, res);
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWith({ message: 'internal server error' })).to.be.true;
    });
  });

  describe('getAttendance', () => {
    it('should return 404 if student not found', async () => {
      sandbox.stub(Student, 'findById').resolves(null);
      await StudentController.getAttendance(req, res);
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Student not found' })).to.be.true;
    });

    it('should return 400 for invalid start date', async () => {
        sandbox.stub(Student, 'findById').resolves({ id: 1 });
        req.query = { startDate: 'invalid' };
        await StudentController.getAttendance(req, res);
        expect(res.status.calledWith(400)).to.be.true;
        expect(res.json.calledWith({ message: 'Invalid start date' })).to.be.true;
    });

    it('should return 400 for invalid end date', async () => {
        sandbox.stub(Student, 'findById').resolves({ id: 1 });
        req.query = { endDate: 'invalid' };
        await StudentController.getAttendance(req, res);
        expect(res.status.calledWith(400)).to.be.true;
        expect(res.json.calledWith({ message: 'Invalid end date' })).to.be.true;
    });

    it('should return 400 for start date after end date', async () => {
        sandbox.stub(Student, 'findById').resolves({ id: 1 });
        req.query = { startDate: '2024-01-02', endDate: '2024-01-01' };
        await StudentController.getAttendance(req, res);
        expect(res.status.calledWith(400)).to.be.true;
        expect(res.json.calledWith({ message: 'Start date cannot be after end date' })).to.be.true;
    });

    it('should get attendance successfully', async () => {
      sandbox.stub(Student, 'findById').resolves({ id: 1 });
      const records = [{ id: 1 }, { id: 2 }];
      sandbox.stub(Attendance, 'getAttendanceByStudent').resolves(records);
      req.query = { startDate: '2024-01-01', endDate: '2024-02-01' };
      await StudentController.getAttendance(req, res);
      expect(res.json.calledWith(records)).to.be.true;
    });

    it('should handle internal error when fetching attendance', async () => {
      sandbox.stub(Student, 'findById').resolves({ id: 1 });
      sandbox.stub(Attendance, 'getAttendanceByStudent').throws(new Error('db error'));
      await StudentController.getAttendance(req, res);
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWith({ message: 'internal server error' })).to.be.true;
    });
  });

  describe('getGrades', () => {
    it('should return 404 if student not found', async () => {
      sandbox.stub(Student, 'findById').resolves(null);
      await StudentController.getGrades(req, res);
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Student not found' })).to.be.true;
    });

    it('should get grades successfully', async () => {
      sandbox.stub(Student, 'findById').resolves({ id: 1 });
      sandbox.stub(Grade, 'getGradesByStudent').resolves([]);
      sandbox.stub(Grade, 'calculateGPA').resolves(0);
      await StudentController.getGrades(req, res);
      expect(res.json.calledWith({ grades: [], gpa: 0 })).to.be.true;
    });

    it('should handle internal error when fetching grades', async () => {
      sandbox.stub(Student, 'findById').resolves({ id: 1 });
      sandbox.stub(Grade, 'getGradesByStudent').throws(new Error('db error'));
      await StudentController.getGrades(req, res);
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWith({ message: 'internal server error' })).to.be.true;
    });
  });

  describe('getFees', () => {
    it('should return 404 if student not found', async () => {
      sandbox.stub(Student, 'findById').resolves(null);
      await StudentController.getFees(req, res);
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Student not found' })).to.be.true;
    });

    it('should get fees successfully', async () => {
      sandbox.stub(Student, 'findById').resolves({ id: 1 });
      sandbox.stub(Fee, 'getFeesByStudent').resolves([]);
      sandbox.stub(Fee, 'getTotalOutstanding').resolves(0);
      await StudentController.getFees(req, res);
      expect(res.json.calledWith({ fees: [], totalOutstanding: 0 })).to.be.true;
    });

    it('should handle internal error when fetching fees', async () => {
      sandbox.stub(Student, 'findById').resolves({ id: 1 });
      sandbox.stub(Fee, 'getFeesByStudent').throws(new Error('db error'));
      await StudentController.getFees(req, res);
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWith({ message: 'internal server error' })).to.be.true;
    });
  });

  describe('getTimetable', () => {
    it('should return 404 if student not found', async () => {
      sandbox.stub(Student, 'findById').resolves(null);
      await StudentController.getTimetable(req, res);
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Student not found' })).to.be.true;
    });

    it('should return 400 for invalid semester', async () => {
        sandbox.stub(Student, 'findById').resolves({ id: 1 });
        req.query = { semester: '  ' };
        await StudentController.getTimetable(req, res);
        expect(res.status.calledWith(400)).to.be.true;
        expect(res.json.calledWith({ message: 'Invalid semester' })).to.be.true;
    });

    it('should get timetable successfully without semester', async () => {
      sandbox.stub(Student, 'findById').resolves({ id: 1 });
      const records = [];
      sandbox.stub(Timetable, 'getTimetableByStudent').resolves(records);
      req.query = {};
      await StudentController.getTimetable(req, res);
      expect(res.json.calledWith(records)).to.be.true;
    });

    it('should get timetable successfully with semester', async () => {
      sandbox.stub(Student, 'findById').resolves({ id: 1 });
      const records = [];
      sandbox.stub(Timetable, 'getTimetableByStudent').resolves(records);
      req.query = { semester: 'Fall 2024' };
      await StudentController.getTimetable(req, res);
      expect(res.json.calledWith(records)).to.be.true;
    });

    it('should handle internal error when fetching timetable', async () => {
      sandbox.stub(Student, 'findById').resolves({ id: 1 });
      sandbox.stub(Timetable, 'getTimetableByStudent').throws(new Error('db error'));
      await StudentController.getTimetable(req, res);
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWith({ message: 'internal server error' })).to.be.true;
    });
  });
});
