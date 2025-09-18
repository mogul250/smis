import { expect } from 'chai';
import sinon from 'sinon';
import pool from '../../src/config/database.js';
import NotificationService from '../../src/services/notification-service.js';
import emailService from '../../src/services/email-service.js';

describe('NotificationService Unit Tests', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });
  afterEach(() => {
    sandbox.restore();
  });

  describe('createNotification', () => {
    it('should insert notification and return insertId', async () => {
      const exec = sandbox.stub(pool, 'execute').resolves([{ insertId: 99 }]);
      const id = await NotificationService.createNotification(1, 'type', 'title', 'message', { x: 1 });
      expect(id).to.equal(99);
      expect(exec.calledOnce).to.be.true;
      const args = exec.getCall(0).args;
      expect(args[1][0]).to.equal(1);
      expect(args[1][1]).to.equal('type');
    });

    it('should wrap DB error', async () => {
      sandbox.stub(pool, 'execute').rejects(new Error('create fail'));
      try {
        await NotificationService.createNotification(1, 't', 'x', 'm');
        expect.fail('Expected error');
      } catch (err) {
        expect(err.message).to.include('Error creating notification');
      }
    });
  });

  describe('getUserNotifications', () => {
    it('should return rows', async () => {
      const rows = [{ id: 1 }, { id: 2 }];
      const exec = sandbox.stub(pool, 'execute').resolves([rows]);
      const res = await NotificationService.getUserNotifications(7, 10, 0);
      expect(res).to.deep.equal(rows);
      const args = exec.getCall(0).args[1];
      expect(args).to.deep.equal([7, 10, 0]);
    });

    it('should wrap DB error', async () => {
      sandbox.stub(pool, 'execute').rejects(new Error('get fail'));
      try {
        await NotificationService.getUserNotifications(1);
        expect.fail('Expected error');
      } catch (err) {
        expect(err.message).to.include('Error getting notifications');
      }
    });
  });

  describe('markAsRead', () => {
    it('should return true when affectedRows > 0', async () => {
      sandbox.stub(pool, 'execute').resolves([{ affectedRows: 1 }]);
      const ok = await NotificationService.markAsRead(5, 2);
      expect(ok).to.equal(true);
    });

    it('should return false when affectedRows = 0', async () => {
      sandbox.stub(pool, 'execute').resolves([{ affectedRows: 0 }]);
      const ok = await NotificationService.markAsRead(5, 2);
      expect(ok).to.equal(false);
    });

    it('should wrap DB error', async () => {
      sandbox.stub(pool, 'execute').rejects(new Error('upd fail'));
      try {
        await NotificationService.markAsRead(1, 1);
        expect.fail('Expected error');
      } catch (err) {
        expect(err.message).to.include('Error marking notification as read');
      }
    });
  });

  describe('markAllAsRead', () => {
    it('should return affectedRows number', async () => {
      sandbox.stub(pool, 'execute').resolves([{ affectedRows: 3 }]);
      const n = await NotificationService.markAllAsRead(2);
      expect(n).to.equal(3);
    });

    it('should wrap DB error', async () => {
      sandbox.stub(pool, 'execute').rejects(new Error('upd fail'));
      try {
        await NotificationService.markAllAsRead(1);
        expect.fail('Expected error');
      } catch (err) {
        expect(err.message).to.include('Error marking all notifications as read');
      }
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread_count', async () => {
      sandbox.stub(pool, 'execute').resolves([[{ unread_count: 5 }]]);
      const n = await NotificationService.getUnreadCount(1);
      expect(n).to.equal(5);
    });

    it('should wrap DB error', async () => {
      sandbox.stub(pool, 'execute').rejects(new Error('count fail'));
      try {
        await NotificationService.getUnreadCount(1);
        expect.fail('Expected error');
      } catch (err) {
        expect(err.message).to.include('Error getting unread count');
      }
    });
  });

  describe('notifyGradeUpdate', () => {
    it('should create notification and send email when student exists', async () => {
      const exec = sandbox.stub(pool, 'execute').resolves([[{ id: 10, first_name: 'A', last_name: 'B', email: 's@example.com' }]]);
      const createStub = sandbox.stub(NotificationService, 'createNotification').resolves(1);
      const emailStub = sandbox.stub(emailService, 'sendGradeNotification').resolves();

      await NotificationService.notifyGradeUpdate(99, 'Math', 'A');

      expect(exec.calledOnce).to.be.true;
      expect(createStub.calledOnce).to.be.true;
      expect(emailStub.calledOnce).to.be.true;
      const emailArgs = emailStub.getCall(0).args;
      expect(emailArgs[0]).to.equal('s@example.com');
    });

    it('should no-op when student not found', async () => {
      sandbox.stub(pool, 'execute').resolves([[]]);
      const createStub = sandbox.stub(NotificationService, 'createNotification').resolves(1);
      const emailStub = sandbox.stub(emailService, 'sendGradeNotification').resolves();

      await NotificationService.notifyGradeUpdate(99, 'Math', 'A');

      expect(createStub.called).to.be.false;
      expect(emailStub.called).to.be.false;
    });
  });

  describe('notifyAttendanceAlert', () => {
    it('should create notification and send email when student exists', async () => {
      const exec = sandbox.stub(pool, 'execute').resolves([[{ id: 11, first_name: 'S', last_name: 'T', email: 'p@example.com' }]]);
      const createStub = sandbox.stub(NotificationService, 'createNotification').resolves(1);
      const emailStub = sandbox.stub(emailService, 'sendAttendanceAlert').resolves();

      await NotificationService.notifyAttendanceAlert(88, 70, 3);

      expect(exec.calledOnce).to.be.true;
      expect(createStub.calledOnce).to.be.true;
      expect(emailStub.calledOnce).to.be.true;
      const emailArgs = emailStub.getCall(0).args;
      expect(emailArgs[0]).to.equal('p@example.com');
      expect(emailArgs[2]).to.equal(70);
      expect(emailArgs[3]).to.equal(3);
    });

    it('should no-op when student not found', async () => {
      sandbox.stub(pool, 'execute').resolves([[]]);
      const createStub = sandbox.stub(NotificationService, 'createNotification').resolves(1);
      const emailStub = sandbox.stub(emailService, 'sendAttendanceAlert').resolves();

      await NotificationService.notifyAttendanceAlert(88, 70, 3);

      expect(createStub.called).to.be.false;
      expect(emailStub.called).to.be.false;
    });
  });

  describe('notifyFeeReminder', () => {
    it('should create notification and send email when student exists', async () => {
      const exec = sandbox.stub(pool, 'execute').resolves([[{ id: 12, first_name: 'X', last_name: 'Y', email: 'f@example.com' }]]);
      const createStub = sandbox.stub(NotificationService, 'createNotification').resolves(1);
      const emailStub = sandbox.stub(emailService, 'sendFeeReminder').resolves();

      await NotificationService.notifyFeeReminder(77, 100, '2025-01-01');

      expect(exec.calledOnce).to.be.true;
      expect(createStub.calledOnce).to.be.true;
      expect(emailStub.calledOnce).to.be.true;
      const emailArgs = emailStub.getCall(0).args;
      expect(emailArgs[0]).to.equal('f@example.com');
      expect(emailArgs[2]).to.equal(100);
      expect(emailArgs[3]).to.equal('2025-01-01');
    });

    it('should no-op when student not found', async () => {
      sandbox.stub(pool, 'execute').resolves([[]]);
      const createStub = sandbox.stub(NotificationService, 'createNotification').resolves(1);
      const emailStub = sandbox.stub(emailService, 'sendFeeReminder').resolves();

      await NotificationService.notifyFeeReminder(77, 100, '2025-01-01');

      expect(createStub.called).to.be.false;
      expect(emailStub.called).to.be.false;
    });
  });

  describe('notifyTimetableUpdate', () => {
    it('should create notification', async () => {
      const createStub = sandbox.stub(NotificationService, 'createNotification').resolves(1);
      await NotificationService.notifyTimetableUpdate(5, 'msg');
      expect(createStub.calledOnce).to.be.true;
      const args = createStub.getCall(0).args;
      expect(args[0]).to.equal(5);
      expect(args[1]).to.equal('timetable_update');
    });
  });

  describe('sendAnnouncement', () => {
    it('should insert multiple notifications via VALUES list', async () => {
      const exec = sandbox.stub(pool, 'execute').resolves([{}]);
      await NotificationService.sendAnnouncement([1, 2], 'Title', 'Message');
      expect(exec.calledOnce).to.be.true;
      const sql = exec.getCall(0).args[0];
      expect(sql).to.include('INSERT INTO notifications');
      expect(sql).to.include('(1, \'announcement\'');
      expect(sql).to.include('(2, \'announcement\'');
    });
  });

  describe('cleanupOldNotifications', () => {
    it('should delete old notifications and return affectedRows', async () => {
      sandbox.stub(pool, 'execute').resolves([{ affectedRows: 4 }]);
      const n = await NotificationService.cleanupOldNotifications();
      expect(n).to.equal(4);
    });

    it('should rethrow DB error', async () => {
      sandbox.stub(pool, 'execute').rejects(new Error('del fail'));
      try {
        await NotificationService.cleanupOldNotifications();
        expect.fail('Expected error');
      } catch (err) {
        expect(err.message).to.include('del fail');
      }
    });
  });
});
