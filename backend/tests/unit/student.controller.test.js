import { expect } from 'chai';
import sinon from 'sinon';
import StudentController from '../../src/controllers/student-controller.js';
import Student from '../../src/models/student.js';
import Attendance from '../../src/models/attendance.js';
import Grade from '../../src/models/grade.js';
import Fee from '../../src/models/fee.js';
import Timetable from '../../src/models/timetable.js';

describe('Student Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: { id: 1 },
      body: {},
      query: {}
    };
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
      send: sinon.stub()
    };
    next = sinon.stub();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('getProfile', () => {
    it('should return student profile', async () => {
      const fakeStudent = { id: 1, email: 'test@example.com', first_name: 'Test', last_name: 'Student' };
      sinon.stub(Student, 'findById').resolves(fakeStudent);

      await StudentController.getProfile(req, res);

      expect(res.json.calledWith({
        id: fakeStudent.id,
        user: {
          email: fakeStudent.email,
          first_name: fakeStudent.first_name,
          last_name: fakeStudent.last_name
        }
      })).to.be.true;
    });

    it('should return 404 if student not found', async () => {
      sinon.stub(Student, 'findById').resolves(null);

      await StudentController.getProfile(req, res);

      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Student not found' })).to.be.true;
    });
  });

  describe('updateProfile', () => {
    it('should update student profile', async () => {
      const fakeStudent = { id: 1 };
      sinon.stub(Student, 'findById').resolves(fakeStudent);
      sinon.stub(Student, 'update').resolves();

      req.body = { first_name: 'Updated' };

      await StudentController.updateProfile(req, res);

      expect(res.json.calledWith({ message: 'Profile updated successfully' })).to.be.true;
    });

    it('should return 400 for invalid fields', async () => {
      const fakeStudent = { id: 1 };
      sinon.stub(Student, 'findById').resolves(fakeStudent);

      req.body = { invalid_field: 'value' };

      await StudentController.updateProfile(req, res);

      expect(res.status.calledWith(400)).to.be.true;
    });
  });

  describe('getAttendance', () => {
    it('should return attendance records', async () => {
      const fakeStudent = { id: 1 };
      const fakeAttendance = [{ date: '2023-01-01', status: 'present' }];
      sinon.stub(Student, 'findById').resolves(fakeStudent);
      sinon.stub(Attendance, 'getAttendanceByStudent').resolves(fakeAttendance);

      await StudentController.getAttendance(req, res);

      expect(res.json.calledWith(fakeAttendance)).to.be.true;
    });
  });

  describe('getGrades', () => {
    it('should return grades and GPA', async () => {
      const fakeStudent = { id: 1 };
      const fakeGrades = [{ course: 'Math', grade: 'A' }];
      const fakeGPA = 3.5;
      sinon.stub(Student, 'findById').resolves(fakeStudent);
      sinon.stub(Grade, 'getGradesByStudent').resolves(fakeGrades);
      sinon.stub(Grade, 'calculateGPA').resolves(fakeGPA);

      await StudentController.getGrades(req, res);

      expect(res.json.calledWith({ grades: fakeGrades, gpa: fakeGPA })).to.be.true;
    });
  });

  describe('getFees', () => {
    it('should return fees and total outstanding', async () => {
      const fakeStudent = { id: 1 };
      const fakeFees = [{ amount: 100, status: 'unpaid' }];
      const fakeTotalOutstanding = 100;
      sinon.stub(Student, 'findById').resolves(fakeStudent);
      sinon.stub(Fee, 'getFeesByStudent').resolves(fakeFees);
      sinon.stub(Fee, 'getTotalOutstanding').resolves(fakeTotalOutstanding);

      await StudentController.getFees(req, res);

      expect(res.json.calledWith({ fees: fakeFees, totalOutstanding: fakeTotalOutstanding })).to.be.true;
    });
  });

  describe('getTimetable', () => {
    it('should return timetable', async () => {
      const fakeStudent = { id: 1 };
      const fakeTimetable = [{ course_name: 'Math', start_time: '09:00' }];
      sinon.stub(Student, 'findById').resolves(fakeStudent);
      sinon.stub(Timetable, 'getTimetableByStudent').resolves(fakeTimetable);

      await StudentController.getTimetable(req, res);

      expect(res.json.calledWith(fakeTimetable)).to.be.true;
    });
  });
});
