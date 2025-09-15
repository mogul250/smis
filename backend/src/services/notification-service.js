import pool from '../config/database.js';
import emailService from './email-service.js';

class NotificationService {
  // Create a new notification
  static async createNotification(userId, type, title, message, data = null) {
    try {
      const query = `
        INSERT INTO notifications (user_id, type, title, message, data, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
      `;
      const [result] = await pool.execute(query, [userId, type, title, message, JSON.stringify(data)]);
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating notification: ${error.message}`);
    }
  }

  // Get notifications for a user
  static async getUserNotifications(userId, limit = 20, offset = 0) {
    try {
      const query = `
        SELECT id, type, title, message, data, is_read, created_at
        FROM notifications
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;
      const [rows] = await pool.execute(query, [userId, limit, offset]);
      return rows;
    } catch (error) {
      throw new Error(`Error getting notifications: ${error.message}`);
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId, userId) {
    try {
      const query = `
        UPDATE notifications
        SET is_read = true
        WHERE id = ? AND user_id = ?
      `;
      const [result] = await pool.execute(query, [notificationId, userId]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error marking notification as read: ${error.message}`);
    }
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(userId) {
    try {
      const query = `
        UPDATE notifications
        SET is_read = true
        WHERE user_id = ? AND is_read = false
      `;
      const [result] = await pool.execute(query, [userId]);
      return result.affectedRows;
    } catch (error) {
      throw new Error(`Error marking all notifications as read: ${error.message}`);
    }
  }

  // Get unread notification count
  static async getUnreadCount(userId) {
    try {
      const query = `
        SELECT COUNT(*) as unread_count
        FROM notifications
        WHERE user_id = ? AND is_read = false
      `;
      const [rows] = await pool.execute(query, [userId]);
      return rows[0].unread_count;
    } catch (error) {
      throw new Error(`Error getting unread count: ${error.message}`);
    }
  }

  // Send grade update notification
  static async notifyGradeUpdate(studentId, courseName, grade) {
    try {
      // Get student user info
      const studentQuery = `
        SELECT u.id, u.first_name, u.last_name, u.email
        FROM students s
        JOIN users u ON s.user_id = u.id
        WHERE s.id = ?
      `;
      const [studentRows] = await pool.execute(studentQuery, [studentId]);
      const student = studentRows[0];

      if (student) {
        // Create in-app notification
        await this.createNotification(
          student.id,
          'grade_update',
          'Grade Updated',
          `Your grade for ${courseName} has been updated to ${grade}`,
          { courseName, grade }
        );

        // Send email notification
        await emailService.sendGradeNotification(
          student.email,
          `${student.first_name} ${student.last_name}`,
          courseName,
          grade
        );
      }
    } catch (error) {
      console.error('Error sending grade update notification:', error);
    }
  }

  // Send attendance alert
  static async notifyAttendanceAlert(studentId, attendancePercentage, absences) {
    try {
      // Get student user info
      const studentQuery = `
        SELECT u.id, u.first_name, u.last_name, u.email
        FROM students s
        JOIN users u ON s.user_id = u.id
        WHERE s.id = ?
      `;
      const [studentRows] = await pool.execute(studentQuery, [studentId]);
      const student = studentRows[0];

      if (student) {
        // Create in-app notification
        await this.createNotification(
          student.id,
          'attendance_alert',
          'Attendance Alert',
          `Your attendance percentage is ${attendancePercentage}%. Absences: ${absences}`,
          { attendancePercentage, absences }
        );

        // Send email alert
        await emailService.sendAttendanceAlert(
          student.email,
          `${student.first_name} ${student.last_name}`,
          attendancePercentage,
          absences
        );
      }
    } catch (error) {
      console.error('Error sending attendance alert:', error);
    }
  }

  // Send fee reminder
  static async notifyFeeReminder(studentId, amount, dueDate) {
    try {
      // Get student user info
      const studentQuery = `
        SELECT u.id, u.first_name, u.last_name, u.email
        FROM students s
        JOIN users u ON s.user_id = u.id
        WHERE s.id = ?
      `;
      const [studentRows] = await pool.execute(studentQuery, [studentId]);
      const student = studentRows[0];

      if (student) {
        // Create in-app notification
        await this.createNotification(
          student.id,
          'fee_reminder',
          'Fee Payment Reminder',
          `You have outstanding fees of $${amount} due on ${dueDate}`,
          { amount, dueDate }
        );

        // Send email reminder
        await emailService.sendFeeReminder(
          student.email,
          `${student.first_name} ${student.last_name}`,
          amount,
          dueDate
        );
      }
    } catch (error) {
      console.error('Error sending fee reminder:', error);
    }
  }

  // Send timetable update notification
  static async notifyTimetableUpdate(userId, message) {
    try {
      await this.createNotification(
        userId,
        'timetable_update',
        'Timetable Updated',
        message,
        null
      );
    } catch (error) {
      console.error('Error sending timetable update notification:', error);
    }
  }

  // Send general announcement
  static async sendAnnouncement(userIds, title, message) {
    try {
      const values = userIds.map(userId => `(${userId}, 'announcement', '${title}', '${message}', NOW())`).join(', ');
      const query = `
        INSERT INTO notifications (user_id, type, title, message, created_at)
        VALUES ${values}
      `;
      await pool.execute(query);
    } catch (error) {
      console.error('Error sending announcement:', error);
    }
  }

  // Clean up old notifications (older than 30 days)
  static async cleanupOldNotifications() {
    try {
      const query = `
        DELETE FROM notifications
        WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
      `;
      const [result] = await pool.execute(query);
      console.log(`Cleaned up ${result.affectedRows} old notifications`);
      return result.affectedRows;
    } catch (error) {
      console.error('Error cleaning up notifications:', error);
      throw error;
    }
  }
}

export default NotificationService;
