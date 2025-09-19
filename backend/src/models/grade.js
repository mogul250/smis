import pool from '../config/database.js';

class Grade {
  constructor(data) {
    this.id = data.id;
    this.student_id = data.student_id;
    this.course_id = data.course_id;
    this.teacher_id = data.teacher_id;
    this.grade = data.grade;
    this.semester = data.semester;
    this.year = data.year;
    this.comments = data.comments;
  }

  // Assign a grade to a student for a course
  static async assignGrade(studentId, courseId, teacherId, gradeData) {
    const { grade, semester, year, comments } = gradeData;
    const query = `
      INSERT INTO grades (student_id, course_id, teacher_id, grade, semester, year, comments)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    try {
      const [result] = await pool.execute(query, [studentId, courseId, teacherId, grade, semester, year, comments]);
      return result.insertId;
    } catch (error) {
      throw new Error('Failed to assign grade: ' + error.message);
    }
  }

  // Get grades for a specific student
  static async getGradesByStudent(studentId) {
    const query = `
      SELECT g.*, c.name as course_name, c.course_code as course_code, CONCAT(u.first_name, ' ', u.last_name) as teacher_name
      FROM grades g
      JOIN courses c ON g.course_id = c.id
      LEFT JOIN users u ON g.teacher_id = u.id
      WHERE g.student_id = ?
      ORDER BY g.date_given DESC
    `;
    try {
      const [rows] = await pool.execute(query, [studentId]);
      return rows.map(row => new Grade(row));
    } catch (error) {
      throw new Error('Failed to get grades: ' + error.message);
    }
  }

  // Get grades for a specific course
  static async getGradesByCourse(courseId) {
    const query = `
      SELECT g.*, s.user_id, u.name as student_name
      FROM grades g
      JOIN students s ON g.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE g.course_id = ?
      ORDER BY u.name
    `;
    try {
      const [rows] = await pool.execute(query, [courseId]);
      return rows;
    } catch (error) {
      throw new Error('Failed to get course grades: ' + error.message);
    }
  }

  // Update a grade
  static async update(gradeId, updateData) {
    if (!updateData || Object.keys(updateData).length === 0) return false;
    const allowedFields = ['grade', 'comments'];
    const setClauses = [];
    const values = [];
    for (const key of Object.keys(updateData)) {
      if (!allowedFields.includes(key)) continue;
      setClauses.push(`${key} = ?`);
      values.push(updateData[key]);
    }
    setClauses.push('updated_at = NOW()');
    const query = `UPDATE grades SET ${setClauses.join(', ')} WHERE id = ?`;
    values.push(gradeId);
    try {
      const [result] = await pool.execute(query, values);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error('Failed to update grade: ' + error.message);
    }
  }

  // Calculate GPA for a student
  static async calculateGPA(studentId) {
    const query = `
      SELECT AVG(
        CASE
          WHEN grade = 'A' THEN 4.0
          WHEN grade = 'B+' THEN 3.5
          WHEN grade = 'B' THEN 3.0
          WHEN grade = 'C+' THEN 2.5
          WHEN grade = 'C' THEN 2.0
          WHEN grade = 'D' THEN 1.0
          WHEN grade = 'F' THEN 0.0
          ELSE 0.0
        END
      ) as gpa
      FROM grades
      WHERE student_id = ?
    `;
    try {
      const [rows] = await pool.execute(query, [studentId]);
      return rows[0].gpa || 0.0;
    } catch (error) {
      throw new Error('Failed to calculate GPA: ' + error.message);
    }
  }

  // Find grade by ID
  static async findById(id) {
    const query = 'SELECT * FROM grades WHERE id = ?';
    try {
      const [rows] = await pool.execute(query, [id]);
      return rows.length > 0 ? new Grade(rows[0]) : null;
    } catch (error) {
      throw new Error('Failed to find grade: ' + error.message);
    }
  }
}

export default Grade;
