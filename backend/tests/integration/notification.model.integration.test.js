import { expect } from 'chai';
import Notification from '../../src/models/notification.js';
import { testDb, setupTestDatabase, teardownTestDatabase, loadTestFixtures } from './setup.js';

describe('Notification Model - Integration Tests', () => {
  before(async function() {
    this.timeout(10000); // Increase timeout for database operations
    try {
      await setupTestDatabase();
      await loadTestFixtures();
      console.log('✅ Integration test setup completed');
    } catch (error) {
      console.error('❌ Integration test setup failed:', error);
      throw error;
    }
  });

  after(async function() {
    this.timeout(10000);
    try {
      await teardownTestDatabase();
      console.log('✅ Integration test cleanup completed');
    } catch (error) {
      console.error('❌ Integration test cleanup failed:', error);
      throw error;
    }
  });

  beforeEach(async function() {
    // Clean up notifications table before each test
    try {
      await testDb.connection.execute('DELETE FROM notifications');
    } catch (error) {
      console.warn('⚠️  Failed to clean notifications table:', error.message);
    }
  });

  describe('create', () => {
    it('should create notification successfully with real database', async () => {
      const notificationData = {
        sender_id: 1, // John Doe (teacher)
        user_id: 2,  // Jane Smith (hod)
        type: 'info',
        title: 'Test Notification',
        message: 'This is a test message',
        data: { key: 'value' }
      };

      const result = await Notification.create(notificationData);

      expect(result).to.be.a('number');
      expect(result).to.be.greaterThan(0);

      // Verify the notification was actually created in the database
      const [rows] = await testDb.connection.execute(
        'SELECT * FROM notifications WHERE id = ?',
        [result]
      );

      expect(rows).to.have.lengthOf(1);
      const notification = rows[0];
      expect(notification.sender_id).to.equal(1);
      expect(notification.user_id).to.equal(2);
      expect(notification.type).to.equal('info');
      expect(notification.title).to.equal('Test Notification');
      expect(notification.message).to.equal('This is a test message');
      expect(JSON.parse(notification.data)).to.deep.equal({ key: 'value' });
    });

    it('should handle database errors with real database', async () => {
      const notificationData = {
        sender_id: 999, // Non-existent user
        user_id: 2,
        type: 'error',
        title: 'Error Notification',
        message: 'This is an error'
      };

      try {
        await Notification.create(notificationData);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err.message).to.include('Failed to create notification');
        expect(err.message).to.include('Database connection failed');
      }
    });
  });

  describe('findByUserId', () => {
    it('should find notifications by user ID with real database', async () => {
      // First create some test notifications
      const notification1 = {
        sender_id: 1,
        user_id: 2,
        type: 'info',
        title: 'First Notification',
        message: 'First message',
        data: { priority: 'high' }
      };

      const notification2 = {
        sender_id: 1,
        user_id: 2,
        type: 'warning',
        title: 'Second Notification',
        message: 'Second message',
        data: { priority: 'low' }
      };

      await Notification.create(notification1);
      await Notification.create(notification2);

      const result = await Notification.findByUserId(2);

      expect(result).to.be.an('array');
      expect(result).to.have.lengthOf(2);

      // Verify the structure of returned notifications
      const firstNotification = result.find(n => n.title === 'First Notification');
      expect(firstNotification).to.exist;
      expect(firstNotification.type).to.equal('info');
      expect(firstNotification.sender_first_name).to.equal('John');
      expect(firstNotification.sender_last_name).to.equal('Doe');
      expect(JSON.parse(firstNotification.data)).to.deep.equal({ priority: 'high' });
    });

    it('should return empty array when no notifications found', async () => {
      const result = await Notification.findByUserId(999); // Non-existent user

      expect(result).to.be.an('array').that.is.empty;
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read successfully', async () => {
      // Create a test notification
      const notificationData = {
        sender_id: 1,
        user_id: 2,
        type: 'info',
        title: 'Test Notification',
        message: 'Test message'
      };

      const notificationId = await Notification.create(notificationData);

      // Mark as read
      const result = await Notification.markAsRead(notificationId, 2);

      expect(result).to.be.true;

      // Verify in database
      const [rows] = await testDb.connection.execute(
        'SELECT is_read FROM notifications WHERE id = ?',
        [notificationId]
      );

      expect(rows[0].is_read).to.be.true;
    });

    it('should return false when notification not found', async () => {
      const result = await Notification.markAsRead(999, 2);

      expect(result).to.be.false;
    });
  });

  describe('getUsersByDepartment', () => {
    it('should get users by department with real database', async () => {
      const result = await Notification.getUsersByDepartment(1); // Computer Science department

      expect(result).to.be.an('array');
      expect(result).to.have.lengthOf.greaterThan(0);

      // Verify the users are from the correct department
      result.forEach(user => {
        expect(user).to.have.property('first_name');
        expect(user).to.have.property('last_name');
        expect(user).to.have.property('email');
      });
    });

    it('should filter users by role', async () => {
      const result = await Notification.getUsersByDepartment(1, 'teacher');

      expect(result).to.be.an('array');

      // All returned users should be teachers
      result.forEach(user => {
        expect(user.role).to.equal('teacher');
      });
    });
  });

  describe('getStudentsByCourse', () => {
    it('should get students by course with real database', async () => {
      // First students in a course
      await testDb.connection.execute(
        'INSERT INTO course_enrollments (student_id, course_id) VALUES (?, ?)',
        [1, 1] // Student 1 in Course 1
      );

      const result = await Notification.getStudentsByCourse(1);

      expect(result).to.be.an('array');
      expect(result).to.have.lengthOf.greaterThan(0);

      // Verify student data structure
      result.forEach(student => {
        expect(student).to.have.property('first_name');
        expect(student).to.have.property('last_name');
        expect(student).to.have.property('email');
      });
    });
  });

  describe('getTeachersByDepartment', () => {
    it('should get teachers by department with real database', async () => {
      const result = await Notification.getTeachersByDepartment(1); // Computer Science

      expect(result).to.be.an('array');

      // All returned users should be teachers from department 1
      result.forEach(teacher => {
        expect(teacher).to.have.property('first_name');
        expect(teacher).to.have.property('last_name');
        expect(teacher).to.have.property('email');
      });
    });
  });

  describe('getAllTeachers', () => {
    it('should get all teachers with real database', async () => {
      const result = await Notification.getAllTeachers();

      expect(result).to.be.an('array');

      // Should include teachers from our test data
      const johnDoe = result.find(t => t.first_name === 'John' && t.last_name === 'Doe');
      expect(johnDoe).to.exist;
      expect(johnDoe.email).to.equal('john.doe@university.edu');
    });
  });
});
