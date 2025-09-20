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
    const { course_id, teacher_id, day_of_week, start_time, end_time, class_id, semester } = slotData;
    const query = `
      INSERT INTO timetable (course_id, teacher_id, day_of_week, start_time, end_time, class_id, semester)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    try {
      const [result] = await pool.execute(query, [course_id, teacher_id, day_of_week, start_time, end_time, class_id, semester]);
      return result.insertId;
    } catch (error) {
      throw new Error('Failed to create timetable slot: ' + error.message);
    }
  }

  // Get timetable for a specific student
  static async getTimetableByStudent(studentId, semester = null) {
    let query = `
      SELECT t.*,
        JSON_OBJECT('id', c.id, 'name', c.name) AS course,
        JSON_OBJECT('id', u.id, 'name', CONCAT(u.first_name, ' ', u.last_name)) AS teacher,
        JSON_OBJECT('id', cl.id, 'name', cl.name) AS class
      FROM timetable t
      JOIN courses c ON t.course_id = c.id
      JOIN users u ON t.teacher_id = u.id
      JOIN classes cl ON t.class_id = cl.id
      JOIN course_enrollments ce ON ce.course_id = t.course_id AND ce.student_id = ?
      WHERE JSON_CONTAINS(cl.students, CAST(? AS JSON))
    `;
    const params = [studentId,studentId];
    if (semester) {
      query += ' AND t.semester = ?';
      params.push(semester);
    }

    query += ' ORDER BY t.day_of_week, t.start_time';

    try {
      const [rows] = await pool.execute(query, params);
      return rows; // Return full joined row objects
    } catch (error) {
      throw new Error('Failed to get student timetable: ' + error.message);
    }
  }

  // Get timetable for a specific teacher
  static async getTimetableByTeacher(teacherId, semester = null) {
    let query = `
      SELECT t.*,
        JSON_OBJECT('id', c.id, 'name', c.name) AS course,
        JSON_OBJECT('id', u.id, 'name', CONCAT(u.first_name, ' ', u.last_name)) AS teacher,
        JSON_OBJECT('id', cl.id, 'name', cl.name) AS class
      FROM timetable t
      JOIN courses c ON t.course_id = c.id
      JOIN users u ON t.teacher_id = u.id
      JOIN classes cl ON t.class_id = cl.id
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
      return rows; // Return full joined row objects
    } catch (error) {
      throw new Error('Failed to get teacher timetable: ' + error.message);
    }
  }

  // Check for conflicts in timetable
  static async checkConflicts(courseId, teacherId, day_of_week, startTime, endTime, semester, excludeId = null) {
    let query = `
      SELECT id FROM timetable
      WHERE semester = ? AND day_of_week = ? AND (
        (start_time < ? AND end_time > ?) OR
        (start_time < ? AND end_time > ?) OR
        (start_time >= ? AND end_time <= ?)
      ) AND (course_id = ? OR teacher_id = ?)
    `;
    const params = [semester, day_of_week, endTime, startTime, startTime, endTime, startTime, endTime, courseId, teacherId];

    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    try {
      const [rows] = await pool.execute(query, params);
      // Return array of conflicting slot IDs
      return rows.map(row => row.id);
    } catch (error) {
      throw new Error('Failed to check conflicts: ' + error.message);
    }
  }

  // Update a timetable slot
  static async update(slotId, updateData) {
    if (!updateData || Object.keys(updateData).length === 0) return false;
    const allowedFields = ['course_id', 'teacher_id', 'day', 'start_time', 'end_time', 'room', 'semester','day_of_week'];
    const setClauses = [];
    const values = [];
    for (const key of Object.keys(updateData)) {
      if (!allowedFields.includes(key)) continue;
      setClauses.push(`${key} = ?`);
      values.push(updateData[key]);
    }
    // setClauses.push('updated_at = NOW()');
    const query = `UPDATE timetable SET ${setClauses.join(', ')} WHERE id = ?`;
    values.push(slotId);
    try {
      const [result] = await pool.execute(query, values);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error('Failed to update timetable slot: ' + error);
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
      SELECT t.*,
        JSON_OBJECT('id', c.id, 'name', c.name) AS course,
        JSON_OBJECT('id', u.id, 'name', CONCAT(u.first_name, ' ', u.last_name)) AS teacher,
        JSON_OBJECT('id', cl.id, 'name', cl.name) AS class
      FROM timetable t
      JOIN courses c ON t.course_id = c.id
      JOIN users u ON t.teacher_id = u.id
      JOIN classes cl ON t.class_id = cl.id
      WHERE t.semester = ?
      ORDER BY t.day_of_week, t.start_time
    `;
    try {
      const [rows] = await pool.execute(query, [semester]);
      return rows; // Return full joined row objects
    } catch (error) {
      throw new Error('Failed to get semester timetable: ' + error.message);
    }
  }
}

export default Timetable;
