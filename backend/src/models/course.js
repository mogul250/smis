import pool from '../config/database.js';

class Course {
  constructor(data) {
    this.id = data.id;
    this.course_code = data.course_code;
    this.name = data.name;
    this.description = data.description;
    this.credits = data.credits;
    this.semester = data.semester;
    this.created_at = data.created_at;
  }

  // Create a new course
  static async create(courseData) {
    const { course_code, name, description, credits, semester } = courseData;
    const query = `
      INSERT INTO courses (course_code, name, description, credits, semester, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;
    const values = [course_code, name, description || null, credits, semester || null];

    try {
      const [result] = await pool.execute(query, values);
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating course: ${error.message}`);
    }
  }

  // Find course by ID
  static async findById(id) {
    const query = `
      SELECT c.*
      FROM courses c
      WHERE c.id = ?
    `;

    try {
      const [rows] = await pool.execute(query, [id]);
      return rows.length ? new Course(rows[0]) : null;
    } catch (error) {
      throw new Error(`Error finding course: ${error.message}`);
    }
  }

  // Find course by code
  static async findByCode(courseCode) {
    const query = `
      SELECT c.*
      FROM courses c
      WHERE c.course_code = ?
    `;

    try {
      const [rows] = await pool.execute(query, [courseCode]);
      return rows.length ? new Course(rows[0]) : null;
    } catch (error) {
      throw new Error(`Error finding course by code: ${error.message}`);
    }
  }

  // Update course information
  static async update(id, updateData) {
    const { course_code, name, description, credits, semester } = updateData;
    const query = `
      UPDATE courses
      SET course_code = ?, name = ?, description = ?, credits = ?, semester = ?
      WHERE id = ?
    `;
    const values = [course_code, name, description, credits, semester, id];

    try {
      const [result] = await pool.execute(query, values);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating course: ${error.message}`);
    }
  }

  // Delete course
  static async delete(id) {
    const query = 'DELETE FROM courses WHERE id = ?';

    try {
      const [result] = await pool.execute(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deleting course: ${error.message}`);
    }
  }

  // Get all courses with pagination
  static async getAll(limit = 10, offset = 0) {
    const query = `
      SELECT c.*
      FROM courses c
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `;

    try {
      const [rows] = await pool.execute(query, [limit, offset]);
      return rows.map(row => new Course(row));
    } catch (error) {
      throw new Error(`Error getting courses: ${error.message}`);
    }
  }

  // Get courses taught by a teacher
  static async getByTeacher(teacherId) {
    const query = `
      SELECT c.*
      FROM courses c
      JOIN timetables t ON c.id = t.course_id
      WHERE t.teacher_id = ?
      GROUP BY c.id
      ORDER BY c.name
    `;

    try {
      const [rows] = await pool.execute(query, [teacherId]);
      return rows.map(row => new Course(row));
    } catch (error) {
      throw new Error(`Error getting courses by teacher: ${error.message}`);
    }
  }

  // Get courses enrolled by a student
  static async getByStudent(studentId) {
    const query = `
      SELECT c.*
      FROM courses c
      JOIN course_enrollments ce ON c.id = ce.course_id
      WHERE ce.student_id = ?
      ORDER BY c.name
    `;

    try {
      const [rows] = await pool.execute(query, [studentId]);
      return rows.map(row => new Course(row));
    } catch (error) {
      throw new Error(`Error getting courses by student: ${error.message}`);
    }
  }
}

export default Course;
