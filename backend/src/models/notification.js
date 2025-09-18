import pool from '../config/database.js';

class Notification {
  static async create(notificationData) {
    try {
      const { sender_id, user_id, type, title, message, data } = notificationData;
      const query = `
        INSERT INTO notifications (sender_id, user_id, type, title, message, data, created_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
      `;
      const params = [sender_id, user_id, type, title, message, JSON.stringify(data || null)];
      const [result] = await pool.execute(query, params);
      return result.insertId;
    } catch (error) {
      throw new Error(`Failed to create notification: ${error.message}`);
    }
  }

  static async findByUserId(userId, limit = 20, offset = 0) {
    try {
      const query = `
        SELECT n.id, n.type, n.title, n.message, n.data, n.is_read, n.created_at,
               u.first_name as sender_first_name, u.last_name as sender_last_name
        FROM notifications n
        LEFT JOIN users u ON n.sender_id = u.id
        WHERE n.user_id = ?
        ORDER BY n.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      const [rows] = await pool.query(query, [userId]);

      return rows;
    } catch (error) {
      throw new Error(`Failed to get notifications: ${error.message}`);
    }
  }

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
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }
  }

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
      throw new Error(`Failed to mark all notifications as read: ${error.message}`);
    }
  }

  // Get users by department (for HOD to send to teachers)
  static async getUsersByDepartment(departmentId, role = null) {
    try {
      let query = `
        SELECT DISTINCT u.id, u.first_name, u.last_name, u.email
        FROM users u
        WHERE u.department_id = ?
      `;
      const params = [departmentId];

      if (role) {
        query += ' AND u.role = ?';
        params.push(role);
      }

      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Failed to get users by department: ${error.message}`);
    }
  }

  // Get students by course (for teacher to send to course students)
  static async getStudentsByCourse(courseId) {
    try {
      const query = `
        SELECT DISTINCT u.id, u.first_name, u.last_name, u.email
        FROM users u
        JOIN students s ON u.id = s.user_id
        JOIN course_enrollments ce ON s.id = ce.student_id
        WHERE ce.course_id = ?
      `;
      const [rows] = await pool.execute(query, [courseId]);
      return rows;
    } catch (error) {
      throw new Error(`Failed to get students by course: ${error.message}`);
    }
  }

  // Get students by teacher (for teacher to send to all their students)
  static async getStudentsByTeacher(teacherId) {
    try {
      const query = `
        SELECT DISTINCT u.id, u.first_name, u.last_name, u.email
        FROM users u
        JOIN students s ON u.id = s.user_id
        JOIN course_enrollments ce ON s.id = ce.student_id
        JOIN courses c ON ce.course_id = c.id
        JOIN timetable t ON c.id = t.course_id
        WHERE t.teacher_id = ?
      `;
      const [rows] = await pool.execute(query, [teacherId]);
      return rows;
    } catch (error) {
      throw new Error(`Failed to get students by teacher: ${error.message}`);
    }
  }

  // Get teachers by department (for HOD to send to teachers)
  static async getTeachersByDepartment(departmentId) {
    try {
      const query = `
        SELECT DISTINCT u.id, u.first_name, u.last_name, u.email
        FROM users u
        WHERE u.department_id = ? AND u.role = 'teacher'
      `;
      const [rows] = await pool.execute(query, [departmentId]);
      return rows;
    } catch (error) {
      throw new Error(`Failed to get teachers by department: ${error.message}`);
    }
  }

  // Get students by class (for teacher to send to class students)
  static async getStudentsByClass(classId) {
    try {
      const query = `
        SELECT DISTINCT u.id, u.first_name, u.last_name, u.email
        FROM users u
        JOIN students s ON u.id = s.user_id
        WHERE JSON_CONTAINS((SELECT students FROM classes WHERE id = ?), CAST(s.id AS JSON))
      `;
      const [rows] = await pool.execute(query, [classId]);
      return rows;
    } catch (error) {
      throw new Error(`Failed to get students by class: ${error.message}`);
    }
  }

  // Get all users except sender
  static async getAllUsersExcept(senderId) {
    try {
      const query = `
        SELECT id, first_name, last_name, email
        FROM users
        WHERE id != ? AND is_active = TRUE
      `;
      const [rows] = await pool.execute(query, [senderId]);
      return rows;
    } catch (error) {
      throw new Error(`Failed to get all users except sender: ${error.message}`);
    }
  }

  // Get all teachers
  static async getAllTeachers() {
    try {
      const query = `
        SELECT DISTINCT u.id, u.first_name, u.last_name, u.email
        FROM users u
        WHERE u.role = 'teacher' AND u.is_active = TRUE
      `;
      const [rows] = await pool.execute(query);
      return rows;
    } catch (error) {
      throw new Error(`Failed to get all teachers: ${error.message}`);
    }
  }
}

export default Notification;
