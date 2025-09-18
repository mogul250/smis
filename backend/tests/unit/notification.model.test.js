import { expect } from 'chai';
import sinon from 'sinon';
import Notification from '../../src/models/notification.js';
import pool from '../../src/config/database.js';

describe('Notification Model', () => {
  let poolStub;

  beforeEach(() => {
    poolStub = sinon.stub(pool);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('create', () => {
    it('should create notification successfully', async () => {
      const mockResult = { insertId: 1 };
      poolStub.execute.resolves([mockResult]);

      const notificationData = {
        sender_id: 1,
        user_id: 2,
        type: 'info',
        title: 'Test Notification',
        message: 'This is a test message',
        data: { key: 'value' }
      };

      const result = await Notification.create(notificationData);

      expect(result).to.equal(1);
      expect(poolStub.execute.calledWith(
        sinon.match.string,
        [1, 2, 'info', 'Test Notification', 'This is a test message', JSON.stringify({ key: 'value' })]
      )).to.be.true;
    });

    it('should create notification with null data', async () => {
      const mockResult = { insertId: 2 };
      poolStub.execute.resolves([mockResult]);

      const notificationData = {
        sender_id: 1,
        user_id: 2,
        type: 'warning',
        title: 'Warning Notification',
        message: 'This is a warning',
        data: null
      };

      const result = await Notification.create(notificationData);

      expect(result).to.equal(2);
      expect(poolStub.execute.calledWith(
        sinon.match.string,
        [1, 2, 'warning', 'Warning Notification', 'This is a warning', 'null']
      )).to.be.true;
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      poolStub.execute.rejects(error);

      const notificationData = {
        sender_id: 1,
        user_id: 2,
        type: 'error',
        title: 'Error Notification',
        message: 'This is an error'
      };

      try {
        await Notification.create(notificationData);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err.message).to.equal('Failed to create notification: Database connection failed');
      }
    });
  });

  describe('findByUserId', () => {
    it('should find notifications by user ID with default parameters', async () => {
      const mockRows = [
        {
          id: 1,
          type: 'info',
          title: 'Test Notification',
          message: 'Test message',
          data: null,
          is_read: false,
          created_at: '2024-01-01 10:00:00',
          sender_first_name: 'John',
          sender_last_name: 'Doe'
        }
      ];

      poolStub.query.resolves([mockRows]);

      const result = await Notification.findByUserId(1);

      expect(result).to.deep.equal(mockRows);
      expect(poolStub.query.calledWith(
        sinon.match.string,
        [1]
      )).to.be.true;
    });

    it('should find notifications with custom limit and offset', async () => {
      const mockRows = [
        {
          id: 2,
          type: 'warning',
          title: 'Custom Notification',
          message: 'Custom message',
          data: null,
          is_read: true,
          created_at: '2024-01-02 11:00:00',
          sender_first_name: 'Jane',
          sender_last_name: 'Smith'
        }
      ];

      poolStub.query.resolves([mockRows]);

      const result = await Notification.findByUserId(2, 10, 5);

      expect(result).to.deep.equal(mockRows);
      expect(poolStub.query.calledWith(
        sinon.match.string,
        [2]
      )).to.be.true;
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      poolStub.query.rejects(error);

      try {
        await Notification.findByUserId(1);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err.message).to.equal('Failed to get notifications: Database connection failed');
      }
    });

    it('should return empty array when no notifications found', async () => {
      poolStub.query.resolves([[]]);

      const result = await Notification.findByUserId(1);

      expect(result).to.be.an('array').that.is.empty;
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read successfully', async () => {
      const mockResult = { affectedRows: 1 };
      poolStub.execute.resolves([mockResult]);

      const result = await Notification.markAsRead(1, 2);

      expect(result).to.be.true;
      expect(poolStub.execute.calledWith(
        sinon.match.string,
        [1, 2]
      )).to.be.true;
    });

    it('should return false when notification not found or not owned by user', async () => {
      const mockResult = { affectedRows: 0 };
      poolStub.execute.resolves([mockResult]);

      const result = await Notification.markAsRead(999, 2);

      expect(result).to.be.false;
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      poolStub.execute.rejects(error);

      try {
        await Notification.markAsRead(1, 2);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err.message).to.equal('Failed to mark notification as read: Database connection failed');
      }
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read successfully', async () => {
      const mockResult = { affectedRows: 5 };
      poolStub.execute.resolves([mockResult]);

      const result = await Notification.markAllAsRead(1);

      expect(result).to.equal(5);
      expect(poolStub.execute.calledWith(
        sinon.match.string,
        [1]
      )).to.be.true;
    });

    it('should return zero when no unread notifications found', async () => {
      const mockResult = { affectedRows: 0 };
      poolStub.execute.resolves([mockResult]);

      const result = await Notification.markAllAsRead(1);

      expect(result).to.equal(0);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      poolStub.execute.rejects(error);

      try {
        await Notification.markAllAsRead(1);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err.message).to.equal('Failed to mark all notifications as read: Database connection failed');
      }
    });
  });

  describe('getUsersByDepartment', () => {
    it('should get users by department without role filter', async () => {
      const mockRows = [
        { id: 1, first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
        { id: 2, first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com' }
      ];

      poolStub.execute.resolves([mockRows]);

      const result = await Notification.getUsersByDepartment(1);

      expect(result).to.deep.equal(mockRows);
      expect(poolStub.execute.calledWith(
        sinon.match.string,
        [1]
      )).to.be.true;
    });

    it('should get users by department with role filter', async () => {
      const mockRows = [
        { id: 2, first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com' }
      ];

      poolStub.execute.resolves([mockRows]);

      const result = await Notification.getUsersByDepartment(1, 'teacher');

      expect(result).to.deep.equal(mockRows);
      expect(poolStub.execute.calledWith(
        sinon.match.string,
        [1, 'teacher']
      )).to.be.true;
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      poolStub.execute.rejects(error);

      try {
        await Notification.getUsersByDepartment(1);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err.message).to.equal('Failed to get users by department: Database connection failed');
      }
    });

    it('should return empty array when no users found', async () => {
      poolStub.execute.resolves([[]]);

      const result = await Notification.getUsersByDepartment(1);

      expect(result).to.be.an('array').that.is.empty;
    });
  });

  describe('getStudentsByCourse', () => {
    it('should get students by course successfully', async () => {
      const mockRows = [
        { id: 1, first_name: 'Alice', last_name: 'Johnson', email: 'alice@example.com' },
        { id: 2, first_name: 'Bob', last_name: 'Wilson', email: 'bob@example.com' }
      ];

      poolStub.execute.resolves([mockRows]);

      const result = await Notification.getStudentsByCourse(1);

      expect(result).to.deep.equal(mockRows);
      expect(poolStub.execute.calledWith(
        sinon.match.string,
        [1]
      )).to.be.true;
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      poolStub.execute.rejects(error);

      try {
        await Notification.getStudentsByCourse(1);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err.message).to.equal('Failed to get students by course: Database connection failed');
      }
    });

    it('should return empty array when no students found', async () => {
      poolStub.execute.resolves([[]]);

      const result = await Notification.getStudentsByCourse(1);

      expect(result).to.be.an('array').that.is.empty;
    });
  });

  describe('getStudentsByTeacher', () => {
    it('should get students by teacher successfully', async () => {
      const mockRows = [
        { id: 1, first_name: 'Alice', last_name: 'Johnson', email: 'alice@example.com' },
        { id: 3, first_name: 'Charlie', last_name: 'Brown', email: 'charlie@example.com' }
      ];

      poolStub.execute.resolves([mockRows]);

      const result = await Notification.getStudentsByTeacher(1);

      expect(result).to.deep.equal(mockRows);
      expect(poolStub.execute.calledWith(
        sinon.match.string,
        [1]
      )).to.be.true;
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      poolStub.execute.rejects(error);

      try {
        await Notification.getStudentsByTeacher(1);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err.message).to.equal('Failed to get students by teacher: Database connection failed');
      }
    });

    it('should return empty array when no students found', async () => {
      poolStub.execute.resolves([[]]);

      const result = await Notification.getStudentsByTeacher(1);

      expect(result).to.be.an('array').that.is.empty;
    });
  });

  describe('getTeachersByDepartment', () => {
    it('should get teachers by department successfully', async () => {
      const mockRows = [
        { id: 2, first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com' },
        { id: 3, first_name: 'Mike', last_name: 'Johnson', email: 'mike@example.com' }
      ];

      poolStub.execute.resolves([mockRows]);

      const result = await Notification.getTeachersByDepartment(1);

      expect(result).to.deep.equal(mockRows);
      expect(poolStub.execute.calledWith(
        sinon.match.string,
        [1]
      )).to.be.true;
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      poolStub.execute.rejects(error);

      try {
        await Notification.getTeachersByDepartment(1);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err.message).to.equal('Failed to get teachers by department: Database connection failed');
      }
    });

    it('should return empty array when no teachers found', async () => {
      poolStub.execute.resolves([[]]);

      const result = await Notification.getTeachersByDepartment(1);

      expect(result).to.be.an('array').that.is.empty;
    });
  });

  describe('getStudentsByClass', () => {
    it('should get students by class successfully', async () => {
      const mockRows = [
        { id: 1, first_name: 'Alice', last_name: 'Johnson', email: 'alice@example.com' },
        { id: 2, first_name: 'Bob', last_name: 'Wilson', email: 'bob@example.com' }
      ];

      poolStub.execute.resolves([mockRows]);

      const result = await Notification.getStudentsByClass(1);

      expect(result).to.deep.equal(mockRows);
      expect(poolStub.execute.calledWith(
        sinon.match.string,
        [1]
      )).to.be.true;
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      poolStub.execute.rejects(error);

      try {
        await Notification.getStudentsByClass(1);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err.message).to.equal('Failed to get students by class: Database connection failed');
      }
    });

    it('should return empty array when no students found', async () => {
      poolStub.execute.resolves([[]]);

      const result = await Notification.getStudentsByClass(1);

      expect(result).to.be.an('array').that.is.empty;
    });
  });

  describe('getAllUsersExcept', () => {
    it('should get all users except sender successfully', async () => {
      const mockRows = [
        { id: 2, first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com' },
        { id: 3, first_name: 'Mike', last_name: 'Johnson', email: 'mike@example.com' }
      ];

      poolStub.execute.resolves([mockRows]);

      const result = await Notification.getAllUsersExcept(1);

      expect(result).to.deep.equal(mockRows);
      expect(poolStub.execute.calledWith(
        sinon.match.string,
        [1]
      )).to.be.true;
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      poolStub.execute.rejects(error);

      try {
        await Notification.getAllUsersExcept(1);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err.message).to.equal('Failed to get all users except sender: Database connection failed');
      }
    });

    it('should return empty array when no other users found', async () => {
      poolStub.execute.resolves([[]]);

      const result = await Notification.getAllUsersExcept(1);

      expect(result).to.be.an('array').that.is.empty;
    });
  });

  describe('getAllTeachers', () => {
    it('should get all teachers successfully', async () => {
      const mockRows = [
        { id: 2, first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com' },
        { id: 3, first_name: 'Mike', last_name: 'Johnson', email: 'mike@example.com' }
      ];

      poolStub.execute.resolves([mockRows]);

      const result = await Notification.getAllTeachers();

      expect(result).to.deep.equal(mockRows);
      expect(poolStub.execute.calledWith(
        sinon.match.string
      )).to.be.true;
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      poolStub.execute.rejects(error);

      try {
        await Notification.getAllTeachers();
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err.message).to.equal('Failed to get all teachers: Database connection failed');
      }
    });

    it('should return empty array when no teachers found', async () => {
      poolStub.execute.resolves([[]]);

      const result = await Notification.getAllTeachers();

      expect(result).to.be.an('array').that.is.empty;
    });
  });
});
