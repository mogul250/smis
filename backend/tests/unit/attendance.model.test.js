import { expect } from 'chai';
import sinon from 'sinon';
import Attendance from '../../src/models/attendance.js';
import pool from '../../src/config/database.js';
import { DateTime } from 'luxon';

describe('Attendance Model', () => {
  let poolStub;

  beforeEach(() => {
    poolStub = sinon.stub(pool);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('markAttendance', () => {
    it('should mark attendance successfully on insert', async () => {
      const mockResult = { insertId: 1 };
      poolStub.execute.resolves([mockResult]);

      const attendanceData = {
        student_id: 1,
        class_id: 1,
        course_id: 1,
        teacher_id: 1,
        date: '2024-01-01',
        status: 'present',
        notes: 'On time'
      };

      const result = await Attendance.markAttendance(attendanceData);

      expect(result).to.equal(1);
      expect(poolStub.execute.calledOnce).to.be.true;
      expect(poolStub.execute.calledWith(
        sinon.match.string,
        [1, 1, 1, 1, '2024-01-01', 'present', 'On time']
      )).to.be.true;
    });

    it('should mark attendance successfully on update', async () => {
      const mockResult = { insertId: null };
      poolStub.execute.resolves([mockResult]);

      const attendanceData = {
        student_id: 1,
        class_id: 1,
        course_id: 1,
        teacher_id: 1,
        date: '2024-01-01',
        status: 'absent',
        notes: null
      };

      const result = await Attendance.markAttendance(attendanceData);

      expect(result).to.be.null;
      expect(poolStub.execute.calledWith(
        sinon.match.string,
        [1, 1, 1, 1, '2024-01-01', 'absent', null]
      )).to.be.true;
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      poolStub.execute.rejects(error);

      const attendanceData = {
        student_id: 1,
        class_id: 1,
        course_id: 1,
        teacher_id: 1,
        date: '2024-01-01',
        status: 'present'
      };

      try {
        await Attendance.markAttendance(attendanceData);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err.message).to.equal('Error marking attendance: Database connection failed');
      }
    });

    it('should handle attendance data without notes', async () => {
      const mockResult = { insertId: 2 };
      poolStub.execute.resolves([mockResult]);

      const attendanceData = {
        student_id: 1,
        class_id: 1,
        course_id: 1,
        teacher_id: 1,
        date: '2024-01-01',
        status: 'late'
      };

      const result = await Attendance.markAttendance(attendanceData);

      expect(result).to.equal(2);
      expect(poolStub.execute.calledWith(
        sinon.match.string,
        [1, 1, 1, 1, '2024-01-01', 'late', null]
      )).to.be.true;
    });
  });

  describe('recordMagicAttendance', () => {
    let dateTimeStub;

    beforeEach(() => {
      dateTimeStub = sinon.stub(DateTime, 'now');
    });

    afterEach(() => {
      dateTimeStub.restore();
    });

    it('should record magic attendance successfully', async () => {
      const mockNow = {
        setZone: sinon.stub().returns({
          weekday: 1, // Monday
          toFormat: sinon.stub().returns('09:30:00'),
          toISODate: sinon.stub().returns('2024-01-15')
        })
      };
      dateTimeStub.returns(mockNow);

      const mockClassRows = [{ id: 1, start_date: '2024-01-01', end_date: '2024-12-31', is_active: true }];
      const mockTimetableRows = [{ id: 1, course_id: 1, teacher_id: 1 }];

      poolStub.execute.onFirstCall().resolves([mockClassRows]);
      poolStub.execute.onSecondCall().resolves([mockTimetableRows]);
      poolStub.execute.onThirdCall().resolves([{ insertId: 1 }]);

      const result = await Attendance.recordMagicAttendance(1);

      expect(result).to.deep.equal({
        message: 'Attendance recorded successfully',
        date: '2024-01-15',
        courseId: 1
      });
    });

    it('should throw error when no active class found', async () => {
      const mockNow = {
        setZone: sinon.stub().returns({
          weekday: 1,
          toFormat: sinon.stub().returns('09:30:00'),
          toISODate: sinon.stub().returns('2024-01-15')
        })
      };
      dateTimeStub.returns(mockNow);

      poolStub.execute.resolves([[]]);

      try {
        await Attendance.recordMagicAttendance(1);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err.message).to.equal('Error recording attendance: Active class not found for student');
      }
    });

    it('should throw error when no course scheduled at current time', async () => {
      const mockNow = {
        setZone: sinon.stub().returns({
          weekday: 1,
          toFormat: sinon.stub().returns('09:30:00'),
          toISODate: sinon.stub().returns('2024-01-15')
        })
      };
      dateTimeStub.returns(mockNow);

      const mockClassRows = [{ id: 1, start_date: '2024-01-01', end_date: '2024-12-31', is_active: true }];

      poolStub.execute.onFirstCall().resolves([mockClassRows]);
      poolStub.execute.onSecondCall().resolves([[]]);

      try {
        await Attendance.recordMagicAttendance(1);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err.message).to.equal('Error recording attendance: No course scheduled at this time for your class');
      }
    });

    it('should handle database errors during class lookup', async () => {
      const mockNow = {
        setZone: sinon.stub().returns({
          weekday: 1,
          toFormat: sinon.stub().returns('09:30:00'),
          toISODate: sinon.stub().returns('2024-01-15')
        })
      };
      dateTimeStub.returns(mockNow);

      const error = new Error('Database connection failed');
      poolStub.execute.rejects(error);

      try {
        await Attendance.recordMagicAttendance(1);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err.message).to.equal('Error recording attendance: Database connection failed');
      }
    });
  });

  describe('getAttendanceByStudent', () => {
    it('should get attendance records for a student without date range', async () => {
      const mockRows = [
        {
          id: 1,
          student_id: 1,
          class_id: 1,
          course_id: 1,
          teacher_id: 1,
          date: '2024-01-01',
          status: 'present',
          notes: null,
          course_name: 'Mathematics',
          teacher_name: 'John Doe'
        }
      ];

      poolStub.execute.resolves([mockRows]);

      const result = await Attendance.getAttendanceByStudent(1);

      expect(result).to.have.lengthOf(1);
      expect(result[0]).to.be.instanceOf(Attendance);
      expect(result[0].id).to.equal(1);
      expect(result[0].class_id).to.equal(1);
      expect(result[0].course_id).to.equal(1);
      expect(result[0].teacher_id).to.equal(1);
      expect(poolStub.execute.calledWith(
        sinon.match.string,
        [1]
      )).to.be.true;
    });

    it('should get attendance records with date range', async () => {
      const mockRows = [
        {
          id: 1,
          student_id: 1,
          class_id: 1,
          course_id: 1,
          date: '2024-01-15',
          status: 'present',
          course_name: 'Physics',
          teacher_name: 'Jane Smith'
        }
      ];

      poolStub.execute.resolves([mockRows]);

      const result = await Attendance.getAttendanceByStudent(1, '2024-01-01', '2024-01-31');

      expect(result).to.have.lengthOf(1);
      expect(result[0].date).to.equal('2024-01-15');
      expect(result[0].class_id).to.equal(1);
      expect(poolStub.execute.calledWith(
        sinon.match.string,
        [1, '2024-01-01', '2024-01-31']
      )).to.be.true;
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      poolStub.execute.rejects(error);

      try {
        await Attendance.getAttendanceByStudent(1);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err.message).to.equal('Error fetching attendance: Database connection failed');
      }
    });

    it('should return empty array when no records found', async () => {
      poolStub.execute.resolves([[]]);

      const result = await Attendance.getAttendanceByStudent(1);

      expect(result).to.be.an('array').that.is.empty;
    });
  });

  describe('getAttendanceByCourse', () => {
    it('should get attendance records for a course on specific date', async () => {
      const mockRows = [
        {
          id: 1,
          student_id: 1,
          course_id: 1,
          teacher_id: 1,
          date: '2024-01-15',
          status: 'present',
          student_user_id: 2
        },
        {
          id: 2,
          student_id: 2,
          course_id: 1,
          teacher_id: 1,
          date: '2024-01-15',
          status: 'absent',
          student_user_id: 3
        }
      ];

      poolStub.execute.resolves([mockRows]);

      const result = await Attendance.getAttendanceByCourse(1, '2024-01-15');

      expect(result).to.have.lengthOf(2);
      expect(result[0]).to.be.instanceOf(Attendance);
      expect(result[0].course_id).to.equal(1);
      expect(result[0].date).to.equal('2024-01-15');
      expect(result[1].status).to.equal('absent');
      expect(poolStub.execute.calledWith(
        sinon.match.string,
        [1, '2024-01-15']
      )).to.be.true;
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      poolStub.execute.rejects(error);

      try {
        await Attendance.getAttendanceByCourse(1, '2024-01-15');
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err.message).to.equal('Error fetching attendance by course: Database connection failed');
      }
    });

    it('should return empty array when no records found', async () => {
      poolStub.execute.resolves([[]]);

      const result = await Attendance.getAttendanceByCourse(1, '2024-01-15');

      expect(result).to.be.an('array').that.is.empty;
    });
  });

  describe('updateAttendance', () => {
    it('should update attendance record successfully', async () => {
      const mockResult = { affectedRows: 1 };
      poolStub.execute.resolves([mockResult]);

      const updateData = {
        status: 'late',
        notes: 'Arrived 15 minutes late'
      };

      const result = await Attendance.updateAttendance(1, updateData);

      expect(result).to.be.true;
      expect(poolStub.execute.calledWith(
        sinon.match.string,
        ['late', 'Arrived 15 minutes late', 1]
      )).to.be.true;
    });

    it('should return false when no record updated', async () => {
      const mockResult = { affectedRows: 0 };
      poolStub.execute.resolves([mockResult]);

      const updateData = {
        status: 'present',
        notes: null
      };

      const result = await Attendance.updateAttendance(999, updateData);

      expect(result).to.be.false;
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      poolStub.execute.rejects(error);

      const updateData = {
        status: 'present',
        notes: 'Updated notes'
      };

      try {
        await Attendance.updateAttendance(1, updateData);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err.message).to.equal('Error updating attendance: Database connection failed');
      }
    });

    it('should update attendance without notes', async () => {
      const mockResult = { affectedRows: 1 };
      poolStub.execute.resolves([mockResult]);

      const updateData = {
        status: 'absent',
        notes: null
      };

      const result = await Attendance.updateAttendance(1, updateData);

      expect(result).to.be.true;
      expect(poolStub.execute.calledWith(
        sinon.match.string,
        ['absent', null, 1]
      )).to.be.true;
    });
  });

  describe('Attendance constructor', () => {
    it('should create Attendance instance with all properties', () => {
      const data = {
        id: 1,
        student_id: 1,
        class_id: 1,
        course_id: 1,
        teacher_id: 1,
        date: '2024-01-01',
        status: 'present',
        notes: 'Good attendance',
        created_at: '2024-01-01 09:00:00'
      };

      const attendance = new Attendance(data);

      expect(attendance.id).to.equal(1);
      expect(attendance.student_id).to.equal(1);
      expect(attendance.class_id).to.equal(1);
      expect(attendance.course_id).to.equal(1);
      expect(attendance.teacher_id).to.equal(1);
      expect(attendance.date).to.equal('2024-01-01');
      expect(attendance.status).to.equal('present');
      expect(attendance.notes).to.equal('Good attendance');
      expect(attendance.created_at).to.equal('2024-01-01 09:00:00');
    });

    it('should create Attendance instance with minimal properties', () => {
      const data = {
        id: 2,
        student_id: 2,
        class_id: 2,
        course_id: 2,
        teacher_id: 2,
        date: '2024-01-02',
        status: 'absent'
      };

      const attendance = new Attendance(data);

      expect(attendance.id).to.equal(2);
      expect(attendance.student_id).to.equal(2);
      expect(attendance.class_id).to.equal(2);
      expect(attendance.status).to.equal('absent');
      expect(attendance.notes).to.be.undefined;
      expect(attendance.created_at).to.be.undefined;
    });
  });
});

