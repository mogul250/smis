import pool from '../config/database.js';

class Notification {
  static async create(notificationData) {
    const { sender_id, user_id, type, title, message, data } = notificationData;
    const query = `
      INSERT INTO notifications (sender_id, user_id, type, title, message, data, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;
    const params = [sender_id, user_id, type, title, message, JSON.stringify(data || null)];
    const [result] = await pool.execute(query, params);
    return result.insertId;
  }

  static async findByUserId(userId, limit = 20, offset = 0) {
    const query = `
      SELECT n.id, n.type, n.title, n.message, n.data, n.is_read, n.created_at,
             u.first_name as sender_first_name, u.last_name as sender_last_name
      FROM notifications n
      LEFT JOIN users u ON n.sender_id = u.id
      WHERE n.user_id = ?
      ORDER BY n.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const [rows] = await pool.execute(query, [userId, limit, offset]);
    return rows;
  }

  static async markAsRead(notificationId, userId) {
    const query = `
      UPDATE notifications
      SET is_read = true
      WHERE id = ? AND user_id = ?
    `;
    const [result] = await pool.execute(query, [notificationId, userId]);
    return result.affectedRows > 0;
  }

  static async markAllAsRead(userId) {
    const query = `
      UPDATE notifications
      SET is_read = true
      WHERE user_id = ? AND is_read = false
    `;
    const [result] = await pool.execute(query, [userId]);
    return result.affectedRows;
  }

  // Get users by department (for HOD to send to teachers)
  static async getUsersByDepartment(departmentId, role = null) {
    let query = `
      SELECT DISTINCT u.id, u.first_name, u.last_name, u.email
      FROM users u
      LEFT JOIN students s ON u.id = s.user_id
      LEFT JOIN teachers t ON u.id = t.user_id
      WHERE (s.department_id = ? OR t.department_id = ?)
    `;
    const params = [departmentId, departmentId];

    if (role) {
      query += ' AND u.role = ?';
      params.push(role);
    }

    const [rows] = await pool.execute(query, params);
    return rows;
  }

  // Get students by course (for teacher to send to course students)
  static async getStudentsByCourse(courseId) {
    const query = `
      SELECT DISTINCT u.id, u.first_name, u.last_name, u.email
      FROM users u
      JOIN students s ON u.id = s.user_id
      JOIN course_enrollments ce ON s.id = ce.student_id
      WHERE ce.course_id = ?
    `;
    const [rows] = await pool.execute(query, [courseId]);
    return rows;
  }

  // Get students by teacher (for teacher to send to all their students)
  static async getStudentsByTeacher(teacherId) {
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
  }

  // Get teachers by department (for HOD to send to teachers)
  static async getTeachersByDepartment(departmentId) {
    const query = `
      SELECT DISTINCT u.id, u.first_name, u.last_name, u.email
      FROM users u
      JOIN teachers t ON u.id = t.user_id
      WHERE t.department_id = ?
    `;
    const [rows] = await pool.execute(query, [departmentId]);
    return rows;
  }

  // Get students by class (for teacher to send to class students)
  static async getStudentsByClass(classId) {
    const query = `
      SELECT DISTINCT u.id, u.first_name, u.last_name, u.email
      FROM users u
      JOIN students s ON u.id = s.user_id
      WHERE JSON_CONTAINS((SELECT students FROM classes WHERE id = ?), CAST(s.id AS JSON))
    `;
    const [rows] = await pool.execute(query, [classId]);
    return rows;
  }
}

export default Notification;
