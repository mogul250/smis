import pool from '../config/database.js';

class Timetable {
  constructor(data) {
    this.id = data.id;
    this.course_id = data.course_id;
    this.teacher_id = data.teacher_id;
    this.day_of_week = data.day_of_week;
    this.start_time = data.start_time;
    this.end_time = data.end_time;
    this.class_id = data.class_id;
    this.semester = data.semester;
    this.academic_year = data.academic_year;
  }

  // Create a new timetable slot
  static async createSlot(slotData) {
    const { course_id, teacher_id, day, start_time, end_time, room, semester } = slotData;
    const query = `
      INSERT INTO timetable (course_id, teacher_id, day, start_time, end_time, room, semester)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    try {
      const [result] = await pool.execute(query, [course_id, teacher_id, day, start_time, end_time, room, semester]);
      return result.insertId;
    } catch (error) {
      throw new Error('Failed to create timetable slot: ' + error.message);
    }
  }

  // Get timetable for a specific student
  static async getTimetableByStudent(studentId, semester = null) {
    let query = `
      SELECT t.*, c.name as course_name, c.course_code as course_code, CONCAT(u.first_name, ' ', u.last_name) as teacher_name

      FROM timetable t
      JOIN courses c ON t.course_id = c.id
      JOIN users u ON t.teacher_id = u.id
      JOIN course_enrollments ce ON ce.course_id = t.course_id
      WHERE ce.student_id = ?
    `;
    const params = [studentId];

    if (semester) {
      query += ' AND t.semester = ?';
      params.push(semester);
    }

    query += ' ORDER BY t.day_of_week, t.start_time';

    try {
      const [rows] = await pool.execute(query, params);
      return rows.map(row => new Timetable(row));
    } catch (error) {
      throw new Error('Failed to get student timetable: ' + error.message);
    }
  }

  // Get timetable for a specific teacher
  static async getTimetableByTeacher(teacherId, semester = null) {
    let query = `
      SELECT t.*, c.name as course_name, c.course_code as course_code
      FROM timetable t
      JOIN courses c ON t.course_id = c.id
      WHERE t.teacher_id = ?
    `;
    const params = [teacherId];

    if (semester) {
      query += ' AND t.semester = ?';
      params.push(semester);
    }

    query += ' ORDER BY t.day_of_week, t.start_time';

    try {
      const [rows] = await pool.execute(query, params);
      return rows.map(row => new Timetable(row));
    } catch (error) {
      throw new Error('Failed to get teacher timetable: ' + error.message);
    }
  }

  // Check for conflicts in timetable
  static async checkConflicts(courseId, teacherId, day, startTime, endTime, semester, excludeId = null) {
    let query = `
      SELECT COUNT(*) as conflicts FROM timetable
      WHERE semester = ? AND day = ? AND (
        (start_time < ? AND end_time > ?) OR
        (start_time < ? AND end_time > ?) OR
        (start_time >= ? AND end_time <= ?)
      ) AND (course_id = ? OR teacher_id = ?)
    `;
    const params = [semester, day, endTime, startTime, startTime, endTime, startTime, endTime, courseId, teacherId];

    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    try {
      const [rows] = await pool.execute(query, params);
      return rows[0].conflicts > 0;
    } catch (error) {
      throw new Error('Failed to check conflicts: ' + error.message);
    }
  }

  // Update a timetable slot
  static async update(slotId, updateData) {
    const { course_id, teacher_id, day, start_time, end_time, room, semester } = updateData;
    const query = `
      UPDATE timetable
      SET course_id = ?, teacher_id = ?, day = ?, start_time = ?, end_time = ?, room = ?, semester = ?
      WHERE id = ?
    `;
    try {
      const [result] = await pool.execute(query, [course_id, teacher_id, day, start_time, end_time, room, semester, slotId]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error('Failed to update timetable slot: ' + error.message);
    }
  }

  // Delete a timetable slot
  static async delete(slotId) {
    const query = 'DELETE FROM timetable WHERE id = ?';
    try {
      const [result] = await pool.execute(query, [slotId]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error('Failed to delete timetable slot: ' + error.message);
    }
  }

  // Find slot by ID
  static async findById(id) {
    const query = 'SELECT * FROM timetable WHERE id = ?';
    try {
      const [rows] = await pool.execute(query, [id]);
      return rows.length > 0 ? new Timetable(rows[0]) : null;
    } catch (error) {
      throw new Error('Failed to find timetable slot: ' + error.message);
    }
  }

  // Get all timetable slots for a semester
  static async getAllBySemester(semester) {
    const query = `
      SELECT t.*, c.name as course_name, c.course_code, CONCAT(u.first_name, ' ', u.last_name) as teacher_name
      FROM timetable t
      JOIN courses c ON t.course_id = c.id
      JOIN users u ON t.teacher_id = u.id
      WHERE t.semester = ?
      ORDER BY t.day_of_week, t.start_time
    `;
    try {
      const [rows] = await pool.execute(query, [semester]);
      return rows.map(row => new Timetable(row));
    } catch (error) {
      throw new Error('Failed to get semester timetable: ' + error.message);
    }
  }
}

export default Timetable;
