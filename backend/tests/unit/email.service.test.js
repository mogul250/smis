import { expect } from 'chai';
import sinon from 'sinon';
import emailService from '../../src/services/email-service.js';

describe('EmailService Unit Tests', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  const stubSend = () => sandbox.stub(emailService.transporter, 'sendMail').resolves();

  describe('sendWelcomeEmail', () => {
    it('should send welcome email', async () => {
      const sendStub = stubSend();
      await emailService.sendWelcomeEmail('u@example.com', 'User', 'teacher');
      expect(sendStub.calledOnce).to.be.true;
      const opts = sendStub.getCall(0).args[0];
      expect(opts).to.include.keys(['to', 'subject', 'html']);
      expect(opts.to).to.equal('u@example.com');
      expect(opts.subject).to.include('Welcome');
    });

    it('should propagate transport error', async () => {
      const sendStub = sandbox.stub(emailService.transporter, 'sendMail').rejects(new Error('smtp fail'));
      try {
        await emailService.sendWelcomeEmail('u@example.com', 'User', 'teacher');
        expect.fail('Expected error');
      } catch (err) {
        expect(sendStub.calledOnce).to.be.true;
        expect(err.message).to.include('smtp fail');
      }
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email', async () => {
      process.env.FRONTEND_URL = 'http://localhost:3000';
      const sendStub = stubSend();
      await emailService.sendPasswordResetEmail('p@example.com', 'token123');
      expect(sendStub.calledOnce).to.be.true;
      const opts = sendStub.getCall(0).args[0];
      expect(opts.to).to.equal('p@example.com');
      expect(opts.subject).to.include('Password Reset');
      expect(opts.html).to.include('token123');
    });

    it('should propagate transport error', async () => {
      const sendStub = sandbox.stub(emailService.transporter, 'sendMail').rejects(new Error('reset fail'));
      try {
        await emailService.sendPasswordResetEmail('p@example.com', 't');
        expect.fail('Expected error');
      } catch (err) {
        expect(sendStub.calledOnce).to.be.true;
        expect(err.message).to.include('reset fail');
      }
    });
  });

  describe('sendGradeNotification', () => {
    it('should send grade notification', async () => {
      const sendStub = stubSend();
      await emailService.sendGradeNotification('s@example.com', 'Student Name', 'Math', 'A');
      expect(sendStub.calledOnce).to.be.true;
      const opts = sendStub.getCall(0).args[0];
      expect(opts.to).to.equal('s@example.com');
      expect(opts.subject).to.include('Grade Update');
      expect(opts.html).to.include('Math');
      expect(opts.html).to.include('A');
    });

    it('should propagate transport error', async () => {
      const sendStub = sandbox.stub(emailService.transporter, 'sendMail').rejects(new Error('grade fail'));
      try {
        await emailService.sendGradeNotification('s@example.com', 'Name', 'Course', 'B');
        expect.fail('Expected error');
      } catch (err) {
        expect(sendStub.calledOnce).to.be.true;
        expect(err.message).to.include('grade fail');
      }
    });
  });

  describe('sendFeeReminder', () => {
    it('should send fee reminder', async () => {
      const sendStub = stubSend();
      await emailService.sendFeeReminder('f@example.com', 'Student Name', 123, '2025-01-01');
      expect(sendStub.calledOnce).to.be.true;
      const opts = sendStub.getCall(0).args[0];
      expect(opts.to).to.equal('f@example.com');
      expect(opts.subject).to.include('Fee');
      expect(opts.html).to.include('123');
      expect(opts.html).to.include('2025-01-01');
    });

    it('should propagate transport error', async () => {
      const sendStub = sandbox.stub(emailService.transporter, 'sendMail').rejects(new Error('fee fail'));
      try {
        await emailService.sendFeeReminder('f@example.com', 'Name', 100, '2025-01-01');
        expect.fail('Expected error');
      } catch (err) {
        expect(sendStub.calledOnce).to.be.true;
        expect(err.message).to.include('fee fail');
      }
    });
  });

  describe('sendAttendanceAlert', () => {
    it('should send attendance alert', async () => {
      const sendStub = stubSend();
      await emailService.sendAttendanceAlert('a@example.com', 'Student Name', 75, 5);
      expect(sendStub.calledOnce).to.be.true;
      const opts = sendStub.getCall(0).args[0];
      expect(opts.to).to.equal('a@example.com');
      expect(opts.subject).to.include('Attendance');
      expect(opts.html).to.include('75');
      expect(opts.html).to.include('5');
    });

    it('should propagate transport error', async () => {
      const sendStub = sandbox.stub(emailService.transporter, 'sendMail').rejects(new Error('att fail'));
      try {
        await emailService.sendAttendanceAlert('a@example.com', 'Name', 70, 3);
        expect.fail('Expected error');
      } catch (err) {
        expect(sendStub.calledOnce).to.be.true;
        expect(err.message).to.include('att fail');
      }
    });
  });

  describe('sendNotification', () => {
    it('should send generic notification', async () => {
      const sendStub = stubSend();
      await emailService.sendNotification('n@example.com', 'Subj', 'Message');
      expect(sendStub.calledOnce).to.be.true;
      const opts = sendStub.getCall(0).args[0];
      expect(opts.to).to.equal('n@example.com');
      expect(opts.subject).to.equal('Subj');
      expect(opts.html).to.include('Message');
    });

    it('should propagate transport error', async () => {
      const sendStub = sandbox.stub(emailService.transporter, 'sendMail').rejects(new Error('notify fail'));
      try {
        await emailService.sendNotification('n@example.com', 'S', 'M');
        expect.fail('Expected error');
      } catch (err) {
        expect(sendStub.calledOnce).to.be.true;
        expect(err.message).to.include('notify fail');
      }
    });
  });
});
