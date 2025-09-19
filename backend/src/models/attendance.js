import pool from '../config/database.js';

import { DateTime } from 'luxon';

class Attendance {
  constructor(data) {
    this.id = data.id;
    this.student_id = data.student_id;
    this.class_id = data.class_id;
    this.course_id = data.course_id;
    this.teacher_id = data.teacher_id;
    this.date = data.date;
    this.status = data.status;
    this.notes = data.notes;
    this.created_at = data.created_at;
  }

  // Mark attendance for a student on a specific date and course
  static async markAttendance(attendanceData) {
    const { student_id, class_id, course_id, teacher_id, date, status, notes } = attendanceData;
    const query = `
      INSERT INTO attendance (student_id, class_id, course_id, teacher_id, date, status, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE status = VALUES(status), notes = VALUES(notes)
    `;
    const values = [student_id, class_id, course_id, teacher_id, date, status, notes || null];

    try {
      const [result] = await pool.execute(query, values);
      return result.insertId || null;
    } catch (error) {
      throw new Error(`Error marking attendance: ${error.message}`);
    }
  }

  // Magic attendance recording method
  static async recordMagicAttendance(studentId) {
    try {
      // Get current datetime in Kigali timezone
      const now = DateTime.now().setZone('Africa/Kigali');
      const currentDayOfWeek = now.weekday; // 1=Monday ... 7=Sunday
      const currentTime = now.toFormat('HH:mm:ss');
      const currentDate = now.toISODate();

      // Get student's class (active class)
      const classQuery = `
        SELECT id, start_date, end_date, is_active
        FROM classes
        WHERE JSON_CONTAINS(students, CAST(? AS JSON))
          AND is_active = TRUE
          AND start_date <= ?
          AND end_date >= ?
        LIMIT 1
      `;
      const [classRows] = await pool.execute(classQuery, [studentId, currentDate, currentDate]);
      if (classRows.length === 0) {
        throw new Error('Active class not found for student');
      }
      const studentClass = classRows[0];

      // Find timetable entry for this class at current day and time
      const timetableQuery = `
        SELECT id, course_id, teacher_id
        FROM timetable
        WHERE class_id = ?
          AND day_of_week = ?
          AND start_time <= ?
          AND end_time >= ?
          AND semester = (SELECT semester FROM classes WHERE id = ?)
          AND academic_year = (SELECT academic_year FROM classes WHERE id = ?)
        LIMIT 1
      `;
      const [timetableRows] = await pool.execute(timetableQuery, [
        studentClass.id,
        currentDayOfWeek,
        currentTime,
        currentTime,
        studentClass.id,
        studentClass.id
      ]);
      if (timetableRows.length === 0) {
        throw new Error('No course scheduled at this time for your class');
      }
      const timetableEntry = timetableRows[0];

      // Insert attendance record
      const insertQuery = `
        INSERT INTO attendance (student_id, class_id, course_id, teacher_id, date, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'present', NOW(), NOW())
        ON DUPLICATE KEY UPDATE status = 'present', updated_at = NOW()
      `;
      await pool.execute(insertQuery, [
        studentId,
        studentClass.id,
        timetableEntry.course_id,
        timetableEntry.teacher_id,
        currentDate
      ]);

      return {
        message: 'Attendance recorded successfully',
        date: currentDate,
        courseId: timetableEntry.course_id
      };
    } catch (error) {
      throw new Error(`Error recording attendance: ${error.message}`);
    }
  }

  // Get attendance records for a student
  static async getAttendanceByStudent(studentId, startDate = null, endDate = null) {
    let query = `
      SELECT a.*, c.name as course_name, CONCAT(u.first_name, ' ', u.last_name) as teacher_name
      FROM attendance a
      JOIN courses c ON a.course_id = c.id
      LEFT JOIN users u ON a.teacher_id = u.id
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
