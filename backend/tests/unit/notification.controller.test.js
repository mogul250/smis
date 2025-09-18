import { expect } from 'chai';
import sinon from 'sinon';
import NotificationController from '../../src/controllers/notification-controller.js';
import Notification from '../../src/models/notification.js';
import pool from '../../src/config/database.js';

describe('NotificationController', () => {
  let req, res, next;
  let notificationStub, poolStub;

  beforeEach(() => {
    req = {
      user: { id: 1 },
      params: {},
      body: {},
      query: {}
    };
    res = {
      json: sinon.spy(),
      status: sinon.stub().returnsThis()
    };
    next = sinon.spy();

    // Stub individual Notification model methods
    sinon.stub(Notification, 'findByUserId').resolves([]);
    sinon.stub(Notification, 'markAsRead').resolves(true);
    sinon.stub(Notification, 'markAllAsRead').resolves(0);
    sinon.stub(Notification, 'create').resolves(1);
    sinon.stub(Notification, 'getUsersByDepartment').resolves([]);
    sinon.stub(Notification, 'getStudentsByCourse').resolves([]);
    sinon.stub(Notification, 'getStudentsByTeacher').resolves([]);
    sinon.stub(Notification, 'getTeachersByDepartment').resolves([]);
    sinon.stub(Notification, 'getStudentsByClass').resolves([]);
    sinon.stub(Notification, 'getAllUsersExcept').resolves([]);
    sinon.stub(Notification, 'getAllTeachers').resolves([]);

    // Stub pool methods
    sinon.stub(pool, 'execute').resolves([[]]);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('getUserNotifications', () => {
    it('should return user notifications successfully', async () => {
      const mockNotifications = [
        { id: 1, type: 'info', title: 'Test', message: 'Test message', is_read: false }
      ];

      Notification.findByUserId.resolves(mockNotifications);

      req.params = { page: '1', limit: '10' };

      await NotificationController.getUserNotifications(req, res);

      expect(Notification.findByUserId.calledWith(1, 10, 0)).to.be.true;
      expect(res.json.calledWith(mockNotifications)).to.be.true;
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      Notification.findByUserId.rejects(error);

      await NotificationController.getUserNotifications(req, res);

      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWith({ message: error.message })).to.be.true;
    });

    it('should use default pagination values', async () => {
      Notification.findByUserId.resolves([]);

      await NotificationController.getUserNotifications(req, res);

      expect(Notification.findByUserId.calledWith(1, 20, 0)).to.be.true;
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read successfully', async () => {
      Notification.markAsRead.resolves(true);
      req.params = { notificationId: '1' };

      await NotificationController.markAsRead(req, res);

      expect(Notification.markAsRead.calledWith('1', 1)).to.be.true;
      expect(res.json.calledWith({ message: 'Notification marked as read' })).to.be.true;
    });

    it('should return 404 when notification not found', async () => {
      Notification.markAsRead.resolves(false);
      req.params = { notificationId: '1' };

      await NotificationController.markAsRead(req, res);

      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Notification not found or already read' })).to.be.true;
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      Notification.markAsRead.rejects(error);
      req.params = { notificationId: '1' };

      await NotificationController.markAsRead(req, res);

      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWith({ message: error.message })).to.be.true;
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read successfully', async () => {
      Notification.markAllAsRead.resolves(5);

      await NotificationController.markAllAsRead(req, res);

      expect(Notification.markAllAsRead.calledWith(1)).to.be.true;
      expect(res.json.calledWith({ message: '5 notifications marked as read' })).to.be.true;
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      Notification.markAllAsRead.rejects(error);

      await NotificationController.markAllAsRead(req, res);

      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWith({ message: error.message })).to.be.true;
    });
  });

  describe('sendToUser', () => {
    it('should send notification to multiple users successfully', async () => {
      const recipientIds = [2, 3, 4];
      req.body = {
        recipientIds,
        type: 'info',
        title: 'Test Title',
        message: 'Test Message',
        data: { key: 'value' }
      };

      Notification.create.resolves(1);

      await NotificationController.sendToUser(req, res);

      expect(Notification.create.callCount).to.equal(3);
      expect(res.json.calledWithMatch({
        message: 'Notification sent successfully',
        notificationIds: sinon.match.array
      })).to.be.true;
    });

    it('should return 400 for invalid recipientIds', async () => {
      req.body = { recipientIds: [] };

      await NotificationController.sendToUser(req, res);

      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ message: 'recipientIds must be a non-empty array' })).to.be.true;
    });

    it('should return 400 for non-array recipientIds', async () => {
      req.body = { recipientIds: 'invalid' };

      await NotificationController.sendToUser(req, res);

      expect(res.status.calledWith(400)).to.be.true;
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      req.body = { recipientIds: [2], type: 'info', title: 'Test', message: 'Test' };
      Notification.create.rejects(error);

      await NotificationController.sendToUser(req, res);

      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWith({ message: error.message })).to.be.true;
    });
  });

  describe('sendToDepartment', () => {
    it('should send notification to department successfully', async () => {
      const mockUsers = [
        { id: 2, first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
        { id: 3, first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com' }
      ];

      req.body = {
        departmentId: 1,
        role: 'teacher',
        type: 'info',
        title: 'Department Notice',
        message: 'Test Message',
        data: {}
      };

      Notification.getUsersByDepartment.resolves(mockUsers);
      Notification.create.resolves(1);

      await NotificationController.sendToDepartment(req, res);

      expect(Notification.getUsersByDepartment.calledWith(1, 'teacher')).to.be.true;
      expect(Notification.create.callCount).to.equal(2);
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.calledWithMatch({
        message: 'Notification sent to 2 users',
        recipients: 2
      })).to.be.true;
    });

    it('should return 404 when no users found in department', async () => {
      req.body = { departmentId: 1, type: 'info', title: 'Test', message: 'Test' };
      Notification.getUsersByDepartment.resolves([]);

      await NotificationController.sendToDepartment(req, res);

      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'No users found in this department' })).to.be.true;
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      req.body = { departmentId: 1, type: 'info', title: 'Test', message: 'Test' };
      Notification.getUsersByDepartment.rejects(error);

      await NotificationController.sendToDepartment(req, res);

      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWith({ message: error.message })).to.be.true;
    });
  });

  describe('sendToCourse', () => {
    it('should send notification to course students successfully', async () => {
      const mockStudents = [
        { id: 2, first_name: 'John', last_name: 'Doe', email: 'john@example.com' }
      ];

      req.body = {
        courseId: 1,
        type: 'info',
        title: 'Course Notice',
        message: 'Test Message',
        data: {}
      };

      Notification.getStudentsByCourse.resolves(mockStudents);
      Notification.create.resolves(1);

      await NotificationController.sendToCourse(req, res);

      expect(Notification.getStudentsByCourse.calledWith(1)).to.be.true;
      expect(Notification.create.callCount).to.equal(1);
      expect(res.status.calledWith(201)).to.be.true;
    });

    it('should return 404 when no students found in course', async () => {
      req.body = { courseId: 1, type: 'info', title: 'Test', message: 'Test' };
      Notification.getStudentsByCourse.resolves([]);

      await NotificationController.sendToCourse(req, res);

      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'No students found in this course' })).to.be.true;
    });
  });

  describe('sendToMyStudents', () => {
    it('should send notification to teacher\'s students successfully', async () => {
      const mockTeacherRows = [{ id: 1 }];
      const mockStudents = [
        { id: 2, first_name: 'John', last_name: 'Doe', email: 'john@example.com' }
      ];

      req.body = {
        type: 'info',
        title: 'Teacher Notice',
        message: 'Test Message',
        data: {}
      };

      pool.execute.onFirstCall().resolves([mockTeacherRows]);
      Notification.getStudentsByTeacher.resolves(mockStudents);
      Notification.create.resolves(1);

      await NotificationController.sendToMyStudents(req, res);

      expect(pool.execute.calledWith('SELECT id FROM teachers WHERE user_id = ?', [1])).to.be.true;
      expect(Notification.getStudentsByTeacher.calledWith(1)).to.be.true;
      expect(res.status.calledWith(201)).to.be.true;
    });

    it('should return 404 when teacher record not found', async () => {
      req.body = { type: 'info', title: 'Test', message: 'Test' };
      pool.execute.resolves([[]]);

      await NotificationController.sendToMyStudents(req, res);

      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Teacher record not found' })).to.be.true;
    });

    it('should return 404 when no students found', async () => {
      const mockTeacherRows = [{ id: 1 }];
      req.body = { type: 'info', title: 'Test', message: 'Test' };

      pool.execute.resolves([mockTeacherRows]);
      Notification.getStudentsByTeacher.resolves([]);

      await NotificationController.sendToMyStudents(req, res);

      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'No students found for your courses' })).to.be.true;
    });
  });

  describe('sendToDepartmentTeachers', () => {
    it('should send notification to department teachers successfully', async () => {
      const mockTeachers = [
        { id: 2, first_name: 'John', last_name: 'Doe', email: 'john@example.com' }
      ];

      req.body = {
        departmentId: 1,
        type: 'info',
        title: 'Teacher Notice',
        message: 'Test Message',
        data: {}
      };

      Notification.getTeachersByDepartment.resolves(mockTeachers);
      Notification.create.resolves(1);

      await NotificationController.sendToDepartmentTeachers(req, res);

      expect(Notification.getTeachersByDepartment.calledWith(1)).to.be.true;
      expect(res.status.calledWith(201)).to.be.true;
    });

    it('should return 404 when no teachers found in department', async () => {
      req.body = { departmentId: 1, type: 'info', title: 'Test', message: 'Test' };
      Notification.getTeachersByDepartment.resolves([]);

      await NotificationController.sendToDepartmentTeachers(req, res);

      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'No teachers found in this department' })).to.be.true;
    });
  });

  describe('sendToCourseById', () => {
    it('should delegate to sendToCourse with courseId from params', async () => {
      const sendToCourseStub = sinon.stub(NotificationController, 'sendToCourse');
      req.params = { courseId: '1' };

      await NotificationController.sendToCourseById(req, res);

      expect(sendToCourseStub.calledWith(req, res)).to.be.true;
      expect(req.body.courseId).to.equal('1');

      sendToCourseStub.restore();
    });
  });

  describe('sendToClassById', () => {
    it('should send notification to class students successfully', async () => {
      const mockStudents = [
        { id: 2, first_name: 'John', last_name: 'Doe', email: 'john@example.com' }
      ];

      req.params = { classId: '1' };
      req.body = {
        type: 'info',
        title: 'Class Notice',
        message: 'Test Message',
        data: {}
      };

      Notification.getStudentsByClass.resolves(mockStudents);
      Notification.create.resolves(1);

      await NotificationController.sendToClassById(req, res);

      expect(Notification.getStudentsByClass.calledWith('1')).to.be.true;
      expect(res.status.calledWith(201)).to.be.true;
    });

    it('should return 404 when no students found in class', async () => {
      req.params = { classId: '1' };
      req.body = { type: 'info', title: 'Test', message: 'Test' };
      Notification.getStudentsByClass.resolves([]);

      await NotificationController.sendToClassById(req, res);

      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'No students found in this class' })).to.be.true;
    });
  });

  describe('sendToAllUsers', () => {
    it('should send notification to all users successfully', async () => {
      const mockUsers = [
        { id: 2, first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
        { id: 3, first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com' }
      ];

      req.body = {
        type: 'info',
        title: 'System Notice',
        message: 'Test Message',
        data: {}
      };

      Notification.getAllUsersExcept.resolves(mockUsers);
      Notification.create.resolves(1);

      await NotificationController.sendToAllUsers(req, res);

      expect(Notification.getAllUsersExcept.calledWith(1)).to.be.true;
      expect(Notification.create.callCount).to.equal(2);
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.calledWithMatch({
        message: 'Notification sent to 2 users',
        recipients: 2
      })).to.be.true;
    });

    it('should return 404 when no users found', async () => {
      req.body = { type: 'info', title: 'Test', message: 'Test' };
      Notification.getAllUsersExcept.resolves([]);

      await NotificationController.sendToAllUsers(req, res);

      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'No users found' })).to.be.true;
    });
  });

  describe('sendToAllTeachers', () => {
    it('should send notification to all teachers successfully', async () => {
      const mockTeachers = [
        { id: 2, first_name: 'John', last_name: 'Doe', email: 'john@example.com' }
      ];

      req.body = {
        type: 'info',
        title: 'Teacher Notice',
        message: 'Test Message',
        data: {}
      };

      Notification.getAllTeachers.resolves(mockTeachers);
      Notification.create.resolves(1);

      await NotificationController.sendToAllTeachers(req, res);

      expect(Notification.getAllTeachers.calledOnce).to.be.true;
      expect(res.status.calledWith(201)).to.be.true;
    });

    it('should return 404 when no teachers found', async () => {
      req.body = { type: 'info', title: 'Test', message: 'Test' };
      Notification.getAllTeachers.resolves([]);

      await NotificationController.sendToAllTeachers(req, res);

      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'No teachers found' })).to.be.true;
    });
  });
});

