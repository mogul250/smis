import pool from '../config/database.js';
import { now } from '../utils/helpers.js';

class ClassModel {
  // Create a new class
  static async create({ academic_year, start_date,department_id, end_date, students, created_by, name }) {
    const query = `
      INSERT INTO classes (academic_year, start_date, end_date, students,department_id, created_by,name)
      VALUES (?, ?, ?, ?,?, ?,?)
    `;
    const [result] = await pool.execute(query, [
      academic_year || now('yyyy'),
      start_date,
      end_date,
      JSON.stringify(students),
      department_id,
      created_by,
      name
    ]);
    return result.insertId;
  }

  // Find class by ID
  static async findById(id) {
    const query = 'SELECT * FROM classes WHERE id = ?';
    const [rows] = await pool.execute(query, [id]);
    if (rows.length === 0) return null;
    const cls = rows[0];
    // cls.students = JSON.parse(cls.students);
    return cls;
  }

  // Get all classes
  static async findAll() {
    const query = 'SELECT * FROM classes ORDER BY created_at DESC';
    const [rows] = await pool.execute(query);
    return rows.map(cls => ({
      ...cls,
      students: JSON.parse(cls.students)
    }));
  }

  // Get active classes
  static async findActive() {
    const query = 'SELECT * FROM classes WHERE is_active = TRUE ORDER BY created_at DESC';
    const [rows] = await pool.execute(query);
    return rows.map(cls => ({
      ...cls,
      students: JSON.parse(cls.students)
    }));
  }

  // Update class with only provided fields (partial update)
  static async update(id, updateObj) {
    if (!updateObj || Object.keys(updateObj).length === 0) return false;
    const allowedFields = ['academic_year', 'start_date', 'end_date', 'students', 'is_active', 'department_id', 'name'];
    const setClauses = [];
    const values = [];
    for (const key of Object.keys(updateObj)) {
      if (!allowedFields.includes(key)) continue;
      if (key === 'students') {
        setClauses.push(`${key} = ?`);
        values.push(JSON.stringify(updateObj[key]));
      } else {
        setClauses.push(`${key} = ?`);
        values.push(updateObj[key]);
      }
    }
    setClauses.push('updated_at = CURRENT_TIMESTAMP');
    const query = `UPDATE classes SET ${setClauses.join(', ')} WHERE id = ?`;
    values.push(id);
    const [result] = await pool.execute(query, values);
    return result.affectedRows > 0;
  }

  // Add student to class (if not expired)
  static async addStudent(classId, studentId) {
    const cls = await this.findById(classId);
    if (!cls) throw new Error('Class not found');
    if (!cls.is_active) throw new Error('Class is not active');
    if (new Date() > new Date(cls.end_date)) throw new Error('Class has expired');

    const students = cls.students;
    if (!students.includes(studentId)) {
      students.push(studentId);
      await this.update(classId, { students });
    }
    return true;
  }

  // Remove student from class
  static async removeStudent(classId, studentId) {
    const cls = await this.findById(classId);
    if (!cls) throw new Error('Class not found');

    const students = cls.students.filter(id => id !== studentId);
    await this.update(classId, { students });
    return true;
  }

  // Get classes for a student
  static async findByStudent(studentId,isActive) {
    const query = `SELECT * FROM classes WHERE JSON_CONTAINS(students, ?) ${isActive ? 'AND  is_active = TRUE' : '' } `;
    const [rows] = await pool.execute(query, [JSON.stringify(studentId)]);
    return rows.map(cls => ({
      ...cls,
      students: JSON.parse(cls.students)
    }));
  }

  // Add course to class
  static async addCourse(classId, courseId) {
    const query = 'INSERT INTO class_courses (class_id, course_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE class_id = class_id';
    await pool.execute(query, [classId, courseId]);
    return true;
  }

  // Remove course from class
  static async removeCourse(classId, courseId) {
    const query = 'DELETE FROM class_courses WHERE class_id = ? AND course_id = ?';
    await pool.execute(query, [classId, courseId]);
    return true;
  }

  // Get courses for a class
  static async getCourses(classId) {
    const query = `
      SELECT c.* FROM courses c
      JOIN class_courses cc ON c.id = cc.course_id
      WHERE cc.class_id = ?
    `;
    const [rows] = await pool.execute(query, [classId]);
    return rows;
  }

  // Get students in a class
  static async getStudents(classId) {
    const cls = await this.findById(classId);
    if (!cls) return [];

    const studentIds = cls.students;
    if (studentIds.length === 0) return [];

    const placeholders = studentIds.map(() => '?').join(',');
    const query = `SELECT * FROM students WHERE id IN (${placeholders})`;
    const [rows] = await pool.execute(query, studentIds);
    return rows;
  }
}

export default ClassModel;
