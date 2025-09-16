import Notification from '../models/notification.js';
import pool from '../config/database.js';

class NotificationController {
  // Get notifications for a user
  static async getUserNotifications(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 20, offset = 0 } = req.query;

      const notifications = await Notification.findByUserId(userId, parseInt(limit), parseInt(offset));
      res.json(notifications);
    } catch (error) {
      console.log(error)
      res.status(500).json({ message: error.message });
    }
  }

  // Mark a notification as read
  static async markAsRead(req, res) {
    try {
      const userId = req.user.id;
      const { notificationId } = req.params;

      const success = await Notification.markAsRead(notificationId, userId);
      if (!success) {
        return res.status(404).json({ message: 'Notification not found or already read' });
      }

      res.json({ message: 'Notification marked as read' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Mark all notifications as read
  static async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;
      const count = await Notification.markAllAsRead(userId);
      res.json({ message: `${count} notifications marked as read` });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Send notification to specific user
  static async sendToUser(req, res) {
    try {
      const senderId = req.user.id;
      const { userId, type, title, message, data } = req.body;

      const notificationId = await Notification.create({
        sender_id: senderId,
        user_id: userId,
        type,
        title,
        message,
        data
      });

      res.status(201).json({ message: 'Notification sent successfully', notificationId });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Send notification to department (HOD to teachers/students)
  static async sendToDepartment(req, res) {
    try {
      const senderId = req.user.id;
      const { departmentId, role, type, title, message, data } = req.body;

      // Get users in department
      const users = await Notification.getUsersByDepartment(departmentId, role);

      if (users.length === 0) {
        return res.status(404).json({ message: 'No users found in this department' });
      }

      // Create notifications for all users
      const notificationIds = [];
      for (const user of users) {
        const notificationId = await Notification.create({
          sender_id: senderId,
          user_id: user.id,
          type,
          title,
          message,
          data
        });
        notificationIds.push(notificationId);
      }

      res.status(201).json({
        message: `Notification sent to ${users.length} users`,
        notificationIds,
        recipients: users.length
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Send notification to course students (Teacher to course students)
  static async sendToCourse(req, res) {
    try {
      const senderId = req.user.id;
      const { courseId, type, title, message, data } = req.body;

      // Get students in course
      const students = await Notification.getStudentsByCourse(courseId);

      if (students.length === 0) {
        return res.status(404).json({ message: 'No students found in this course' });
      }

      // Create notifications for all students
      const notificationIds = [];
      for (const student of students) {
        const notificationId = await Notification.create({
          sender_id: senderId,
          user_id: student.id,
          type,
          title,
          message,
          data
        });
        notificationIds.push(notificationId);
      }

      res.status(201).json({
        message: `Notification sent to ${students.length} students`,
        notificationIds,
        recipients: students.length
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Send notification to all students taught by teacher
  static async sendToMyStudents(req, res) {
    try {
      const senderId = req.user.id;
      const { type, title, message, data } = req.body;

      // Get teacher's teacher record
      const teacherQuery = 'SELECT id FROM teachers WHERE user_id = ?';
      const [teacherRows] = await pool.execute(teacherQuery, [senderId]);

      if (teacherRows.length === 0) {
        return res.status(404).json({ message: 'Teacher record not found' });
      }

      const teacherId = teacherRows[0].id;

      // Get students taught by this teacher
      const students = await Notification.getStudentsByTeacher(teacherId);

      if (students.length === 0) {
        return res.status(404).json({ message: 'No students found for your courses' });
      }

      // Create notifications for all students
      const notificationIds = [];
      for (const student of students) {
        const notificationId = await Notification.create({
          sender_id: senderId,
          user_id: student.id,
          type,
          title,
          message,
          data
        });
        notificationIds.push(notificationId);
      }

      res.status(201).json({
        message: `Notification sent to ${students.length} students`,
        notificationIds,
        recipients: students.length
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Send notification to department teachers (HOD to teachers)
  static async sendToDepartmentTeachers(req, res) {
    try {
      const senderId = req.user.id;
      const { departmentId, type, title, message, data } = req.body;

      // Get teachers in department
      const teachers = await Notification.getTeachersByDepartment(departmentId);

      if (teachers.length === 0) {
        return res.status(404).json({ message: 'No teachers found in this department' });
      }

      // Create notifications for all teachers
      const notificationIds = [];
      for (const teacher of teachers) {
        const notificationId = await Notification.create({
          sender_id: senderId,
          user_id: teacher.id,
          type,
          title,
          message,
          data
        });
        notificationIds.push(notificationId);
      }

      res.status(201).json({
        message: `Notification sent to ${teachers.length} teachers`,
        notificationIds,
        recipients: teachers.length
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Send notification to course students by course ID (from params)
  static async sendToCourseById(req, res) {
    req.body.courseId = req.params.courseId;
    return NotificationController.sendToCourse(req, res);
  }

  // Send notification to class students by class ID (from params)
  static async sendToClassById(req, res) {
    try {
      const senderId = req.user.id;
      const { classId } = req.params;
      const { type, title, message, data } = req.body;

      // Get students in class
      const students = await Notification.getStudentsByClass(classId);

      if (students.length === 0) {
        return res.status(404).json({ message: 'No students found in this class' });
      }

      // Create notifications for all students
      const notificationIds = [];
      for (const student of students) {
        const notificationId = await Notification.create({
          sender_id: senderId,
          user_id: student.id,
          type,
          title,
          message,
          data
        });
        notificationIds.push(notificationId);
      }

      res.status(201).json({
        message: `Notification sent to ${students.length} students`,
        notificationIds,
        recipients: students.length
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Send notification to all users (admin only)
  static async sendToAllUsers(req, res) {
    try {
      const senderId = req.user.id;
      const { type, title, message, data } = req.body;

      // Get all users except sender
      const users = await Notification.getAllUsersExcept(senderId);

      if (users.length === 0) {
        return res.status(404).json({ message: 'No users found' });
      }

      // Create notifications for all users
      const notificationIds = [];
      for (const user of users) {
        const notificationId = await Notification.create({
          sender_id: senderId,
          user_id: user.id,
          type,
          title,
          message,
          data
        });
        notificationIds.push(notificationId);
      }

      res.status(201).json({
        message: `Notification sent to ${users.length} users`,
        notificationIds,
        recipients: users.length
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Send notification to all teachers (admin only)
  static async sendToAllTeachers(req, res) {
    try {
      const senderId = req.user.id;
      const { type, title, message, data } = req.body;

      // Get all teachers
      const teachers = await Notification.getAllTeachers();

      if (teachers.length === 0) {
        return res.status(404).json({ message: 'No teachers found' });
      }

      // Create notifications for all teachers
      const notificationIds = [];
      for (const teacher of teachers) {
        const notificationId = await Notification.create({
          sender_id: senderId,
          user_id: teacher.id,
          type,
          title,
          message,
          data
        });
        notificationIds.push(notificationId);
      }

      res.status(201).json({
        message: `Notification sent to ${teachers.length} teachers`,
        notificationIds,
        recipients: teachers.length
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

export default NotificationController;
