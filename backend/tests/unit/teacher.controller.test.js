import chai from 'chai';
import sinon from 'sinon';
import TeacherController from '../../src/controllers/teacher-controller.js';
import User from '../../src/models/user.js';
import Teacher from '../../src/models/teacher.js';
import Attendance from '../../src/models/attendance.js';
import Grade from '../../src/models/grade.js';
import Timetable from '../../src/models/timetable.js';
import pool from '../../src/config/database.js';

const { expect } = chai;

describe('Teacher Controller Unit Tests', () => {
  let req, res, sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    req = {
      user: { id: 1 },
      body: {},
      params: {},
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
    it('should return 404 if teacher not found', async () => {
      sandbox.stub(Teacher, 'findById').resolves(null);
      await TeacherController.getProfile(req, res);
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Teacher not found' })).to.be.true;
    });

    it('should return profile when teacher exists', async () => {
      const teacher = { id: 1, first_name: 'T' };
      sandbox.stub(Teacher, 'findById').resolves(teacher);
      await TeacherController.getProfile(req, res);
      expect(res.json.calledOnce).to.be.true;
      const payload = res.json.getCall(0).args[0];
      expect(payload).to.deep.equal({ user: teacher });
    });

    it('should handle internal error', async () => {
      sandbox.stub(Teacher, 'findById').throws(new Error('boom'));
      await TeacherController.getProfile(req, res);
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWith({ message: 'Internal server error' })).to.be.true;
    });
  });

  describe('updateProfile', () => {
    it('should return 404 if teacher not found', async () => {
      sandbox.stub(User, 'findById').resolves(null);
      await TeacherController.updateProfile(req, res);
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Teacher not found' })).to.be.true;
    });

    it('should return 400 for invalid fields', async () => {
      sandbox.stub(User, 'findById').resolves({ id: 1 });
      req.body = { invalidField: 'x' };
      await TeacherController.updateProfile(req, res);
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWithMatch({ message: sinon.match(/Invalid fields:/) })).to.be.true;
    });

    it('should return 400 for invalid department ID', async () => {
      sandbox.stub(User, 'findById').resolves({ id: 1 });
      req.body = { department_id: 'abc' };
      await TeacherController.updateProfile(req, res);
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ message: 'Invalid department ID' })).to.be.true;
    });

    it('should update profile successfully', async () => {
      sandbox.stub(User, 'findById').resolves({ id: 1 });
      const updateStub = sandbox.stub(User, 'update').resolves();
      req.body = { first_name: 'Alice', last_name: 'Doe', email: 't@example.com', department_id: 1 };
      await TeacherController.updateProfile(req, res);
      expect(updateStub.calledOnce).to.be.true;
      expect(res.json.calledWith({ message: 'Profile updated successfully' })).to.be.true;
    });

    it('should handle internal error during update', async () => {
      sandbox.stub(User, 'findById').resolves({ id: 1 });
      sandbox.stub(User, 'update').throws(new Error('db error'));
      req.body = { first_name: 'X' };
      await TeacherController.updateProfile(req, res);
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWith({ message: 'Internal server error' })).to.be.true;
    });
  });

  describe('getClasses', () => {
    it('should return 404 if teacher not found', async () => {
      sandbox.stub(User, 'findById').resolves(null);
      await TeacherController.getClasses(req, res);
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Teacher not found' })).to.be.true;
    });

    it('should return classes list', async () => {
      sandbox.stub(User, 'findById').resolves({ id: 1 });
      const rows = [{ id: 10, name: 'Course A' }];
      const stub = sandbox.stub(pool, 'execute').resolves([rows]);
      await TeacherController.getClasses(req, res);
      expect(stub.calledOnce).to.be.true;
      expect(res.json.calledWith(rows)).to.be.true;
    });

    it('should handle internal error', async () => {
      sandbox.stub(User, 'findById').resolves({ id: 1 });
      sandbox.stub(pool, 'execute').throws(new Error('db error'));
      await TeacherController.getClasses(req, res);
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWith({ message: 'Internal server error' })).to.be.true;
    });
  });

  describe('markAttendance', () => {
    it('should return 404 if teacher not found', async () => {
      sandbox.stub(User, 'findById').resolves(null);
      await TeacherController.markAttendance(req, res);
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Teacher not found' })).to.be.true;
    });

    it('should return 400 for invalid course ID', async () => {
      sandbox.stub(User, 'findById').resolves({ id: 1 });
      req.body = { courseId: 'abc', attendance: [], date: '2024-01-01' };
      await TeacherController.markAttendance(req, res);
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ message: 'Invalid course ID' })).to.be.true;
    });

    it('should return 400 when attendance is not an array', async () => {
      sandbox.stub(User, 'findById').resolves({ id: 1 });
      req.body = { courseId: 1, attendance: {}, date: '2024-01-01' };
      await TeacherController.markAttendance(req, res);
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ message: 'Attendance data must be an array' })).to.be.true;
    });

    it('should return 400 for invalid date', async () => {
      sandbox.stub(User, 'findById').resolves({ id: 1 });
      req.body = { courseId: 1, attendance: [], date: 'bad' };
      await TeacherController.markAttendance(req, res);
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ message: 'Invalid date' })).to.be.true;
    });

    it('should return 403 if not authorized to mark attendance for course', async () => {
      sandbox.stub(User, 'findById').resolves({ id: 1 });
      sandbox.stub(pool, 'execute').resolves([[{ count: 0 }]]);
      req.body = { courseId: 1, attendance: [], date: '2024-01-01' };
      await TeacherController.markAttendance(req, res);
      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json.calledWith({ message: 'Not authorized to mark attendance for this course' })).to.be.true;
    });

    it('should mark attendance with mixed results', async () => {
      sandbox.stub(User, 'findById').resolves({ id: 1 });
      sandbox.stub(pool, 'execute').resolves([[{ count: 1 }]]);
      const attStub = sandbox.stub(Attendance, 'markAttendance');
      attStub.onCall(0).resolves(101);
      attStub.onCall(1).rejects(new Error('fail'));

      req.body = {
        courseId: 1,
        date: '2024-01-01',
        attendance: [
          { studentId: 0, status: 'present' },            // invalid studentId
          { studentId: 2, status: 'bad' },                // invalid status
          { studentId: 3, status: 'present' },            // success -> 101
          { studentId: 4, status: 'absent', notes: 'n' }  // thrown -> fail
        ]
      };

      await TeacherController.markAttendance(req, res);
      expect(res.json.calledOnce).to.be.true;
      const payload = res.json.getCall(0).args[0];
      expect(payload).to.have.property('message', 'Attendance marked successfully');
      expect(payload.results).to.be.an('array').with.length(4);
      // Check one success and errors captured
      expect(payload.results.some(r => r.success === true && r.attendanceId === 101)).to.be.true;
      expect(payload.results.filter(r => r.success === false).length).to.equal(3);
    });

    it('should handle internal error', async () => {
      sandbox.stub(User, 'findById').throws(new Error('boom'));
      await TeacherController.markAttendance(req, res);
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWith({ message: 'Internal server error' })).to.be.true;
    });
  });

  describe('enterGrades', () => {
    it('should return 404 if teacher not found', async () => {
      sandbox.stub(User, 'findById').resolves(null);
      await TeacherController.enterGrades(req, res);
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Teacher not found' })).to.be.true;
    });

    it('should return 400 for invalid course ID', async () => {
      sandbox.stub(User, 'findById').resolves({ id: 1 });
      req.body = { courseId: 'x', grades: [] };
      await TeacherController.enterGrades(req, res);
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ message: 'Invalid course ID' })).to.be.true;
    });

    it('should return 400 when grades is not an array', async () => {
      sandbox.stub(User, 'findById').resolves({ id: 1 });
      req.body = { courseId: 1, grades: {} };
      await TeacherController.enterGrades(req, res);
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ message: 'Grades data must be an array' })).to.be.true;
    });

    it('should return 403 if not authorized to enter grades for course', async () => {
      sandbox.stub(User, 'findById').resolves({ id: 1 });
      sandbox.stub(pool, 'execute').resolves([[{ count: 0 }]]);
      req.body = { courseId: 1, grades: [] };
      await TeacherController.enterGrades(req, res);
      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json.calledWith({ message: 'Not authorized to enter grades for this course' })).to.be.true;
    });

    it('should enter grades with validations and successes/failures', async () => {
      sandbox.stub(User, 'findById').resolves({ id: 1 });
      sandbox.stub(pool, 'execute').resolves([[{ count: 1 }]]);
      const assignStub = sandbox.stub(Grade, 'assignGrade');
      assignStub.onCall(0).resolves(201); // for valid entry
      assignStub.onCall(1).rejects(new Error('assign error')); // for thrown path (if any extra valid entries are added)

      req.body = {
        courseId: 1,
        grades: [
          { studentId: 0, grade: 'A', semester: 'Fall', year: 2024 }, // invalid studentId
          { studentId: 2, grade: '', semester: 'Fall', year: 2024 },  // invalid grade
          { studentId: 3, grade: 'A', semester: ' ', year: 2024 },    // invalid semester
          { studentId: 4, grade: 'A', semester: 'Fall', year: 1900 }, // invalid year
          { studentId: 5, grade: 'A', semester: 'Fall', year: 2024 }  // success -> 201
        ]
      };

      await TeacherController.enterGrades(req, res);
      expect(res.json.calledOnce).to.be.true;
      const payload = res.json.getCall(0).args[0];
      expect(payload).to.have.property('message', 'Grades entered successfully');
      expect(payload.results).to.be.an('array').with.length(5);
      expect(payload.results.some(r => r.success === true && r.gradeId === 201)).to.be.true;
      // The rest should be failures due to validations
      const failures = payload.results.filter(r => r.success === false);
      expect(failures.length).to.be.at.least(4);
    });

    it('should handle internal error', async () => {
      sandbox.stub(User, 'findById').throws(new Error('boom'));
      await TeacherController.enterGrades(req, res);
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWith({ message: 'Internal server error' })).to.be.true;
    });
  });

  describe('getTimetable', () => {
    it('should return 404 if teacher not found', async () => {
      sandbox.stub(User, 'findById').resolves(null);
      await TeacherController.getTimetable(req, res);
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Teacher not found' })).to.be.true;
    });

    it('should return 400 for invalid semester', async () => {
      sandbox.stub(User, 'findById').resolves({ id: 1 });
      req.query = { semester: '   ' };
      await TeacherController.getTimetable(req, res);
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ message: 'Invalid semester' })).to.be.true;
    });

    it('should return timetable successfully', async () => {
      sandbox.stub(User, 'findById').resolves({ id: 1 });
      sandbox.stub(Timetable, 'getTimetableByTeacher').resolves([]);
      req.query = {};
      await TeacherController.getTimetable(req, res);
      expect(res.json.calledWith([])).to.be.true;
    });

    it('should handle internal error', async () => {
      sandbox.stub(User, 'findById').resolves({ id: 1 });
      sandbox.stub(Timetable, 'getTimetableByTeacher').throws(new Error('db error'));
      await TeacherController.getTimetable(req, res);
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWith({ message: 'Internal server error' })).to.be.true;
    });
  });

  describe('getClassStudents', () => {
    it('should return 404 if teacher not found', async () => {
      sandbox.stub(User, 'findById').resolves(null);
      await TeacherController.getClassStudents(req, res);
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Teacher not found' })).to.be.true;
    });

    it('should return 400 for invalid course ID param', async () => {
      sandbox.stub(User, 'findById').resolves({ id: 1 });
      req.params = { courseId: 'abc' };
      await TeacherController.getClassStudents(req, res);
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ message: 'Invalid course ID' })).to.be.true;
    });

    it('should return 403 if not authorized for provided courseId', async () => {
      sandbox.stub(User, 'findById').resolves({ id: 1 });
      req.params = { courseId: '10' };
      const stub = sandbox.stub(pool, 'execute');
      stub.onFirstCall().resolves([[{ count: 0 }]]);
      await TeacherController.getClassStudents(req, res);
      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json.calledWith({ message: 'Not authorized to view students for this course' })).to.be.true;
    });

    it('should return students for provided courseId when authorized', async () => {
      sandbox.stub(User, 'findById').resolves({ id: 1 });
      req.params = { courseId: '10' };
      const rows = [{ id: 1, first_name: 'S' }];
      const stub = sandbox.stub(pool, 'execute');
      stub.onFirstCall().resolves([[{ count: 1 }]]); // verify
      stub.onSecondCall().resolves([rows]);          // fetch
      await TeacherController.getClassStudents(req, res);
      expect(res.json.calledWith(rows)).to.be.true;
    });

    it('should return students across all assigned courses when no courseId', async () => {
      sandbox.stub(User, 'findById').resolves({ id: 1 });
      req.params = {};
      const rows = [{ id: 2, first_name: 'S2' }];
      sandbox.stub(pool, 'execute').resolves([rows]);
      await TeacherController.getClassStudents(req, res);
      expect(res.json.calledWith(rows)).to.be.true;
    });

    it('should handle internal error', async () => {
      sandbox.stub(User, 'findById').resolves({ id: 1 });
      sandbox.stub(pool, 'execute').throws(new Error('db error'));
      await TeacherController.getClassStudents(req, res);
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWith({ message: 'Internal server error' })).to.be.true;
    });
  });

  describe('uploadResource', () => {
    it('should return placeholder message', async () => {
      await TeacherController.uploadResource(req, res);
      expect(res.json.calledWith({ message: 'Resource upload functionality to be implemented' })).to.be.true;
    });

    it('should handle internal error', async () => {
      // Create a fresh res object so we can simulate a throw on the first json call
      // and then allow the catch block to respond with 500 using a stubbed json.
      const localRes = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub().onFirstCall().throws(new Error('boom')).onSecondCall().returns()
      };
      await TeacherController.uploadResource(req, localRes);
      expect(localRes.status.calledWith(500)).to.be.true;
      // The second call to json should be with the error payload from the catch block
      expect(localRes.json.secondCall.args[0]).to.deep.equal({ message: 'Internal server error' });
    });
  });
});
