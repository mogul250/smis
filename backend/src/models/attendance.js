import pool from '../config/database.js';

class Attendance {
  constructor(data) {
    this.id = data.id;
    this.student_id = data.student_id;
    this.course_id = data.course_id;
    this.teacher_id = data.teacher_id;
    this.date = data.date;
    this.status = data.status;
    this.notes = data.notes;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Mark attendance for a student on a specific date and course
  static async markAttendance(attendanceData) {
    const { student_id, course_id, teacher_id, date, status, notes } = attendanceData;
    const query = `
      INSERT INTO attendance (student_id, course_id, teacher_id, date, status, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE status = VALUES(status), notes = VALUES(notes), updated_at = NOW()
    `;
    const values = [student_id, course_id, teacher_id, date, status, notes || null];

    try {
      const [result] = await pool.execute(query, values);
      return result.insertId || null;
    } catch (error) {
      throw new Error(`Error marking attendance: ${error.message}`);
    }
  }

  // Get attendance records for a student
  static async getAttendanceByStudent(studentId, startDate = null, endDate = null) {
    let query = `
      SELECT a.*, c.name as course_name, t.user_id as teacher_user_id
      FROM attendance a
      JOIN courses c ON a.course_id = c.id
      JOIN teachers t ON a.teacher_id = t.id
      WHERE a.student_id = ?
    `;
    const params = [studentId];

    if (startDate && endDate) {
      query += ' AND a.date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    query += ' ORDER BY a.date DESC';

    try {
      const [rows] = await pool.execute(query, params);
      return rows.map(row => new Attendance(row));
    } catch (error) {
      throw new Error(`Error fetching attendance: ${error.message}`);
    }
  }

  // Get attendance records for a course
  static async getAttendanceByCourse(courseId, date) {
    const query = `
      SELECT a.*, s.user_id as student_user_id
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      WHERE a.course_id = ? AND a.date = ?
    `;
    try {
      const [rows] = await pool.execute(query, [courseId, date]);
      return rows.map(row => new Attendance(row));
    } catch (error) {
      throw new Error(`Error fetching attendance by course: ${error.message}`);
    }
  }

  // Update attendance record
  static async updateAttendance(id, updateData) {
    const { status, notes } = updateData;
    const query = `
      UPDATE attendance
      SET status = ?, notes = ?, updated_at = NOW()
      WHERE id = ?
    `;
    try {
      const [result] = await pool.execute(query, [status, notes, id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating attendance: ${error.message}`);
    }
  }
}

export default Attendance;
