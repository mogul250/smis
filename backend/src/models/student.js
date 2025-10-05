import pool from '../config/database.js';
import bcrypt from 'bcryptjs';
import { now } from '../utils/helpers.js';

class Student {
  // Get students by classId
  static async getByClass(classId) {
    // Get student IDs from classes table
    const [classRows] = await pool.execute('SELECT students FROM classes WHERE id = ?', [classId]);
    if (classRows.length === 0) return [];
    let studentIds = classRows[0].students;
    if (typeof studentIds === 'string') studentIds = JSON.parse(studentIds);
    if (!Array.isArray(studentIds) || studentIds.length === 0) return [];
    const placeholders = studentIds.map(() => '?').join(',');
    const [rows] = await pool.execute(
      `SELECT s.*, d.name as department_name FROM students s LEFT JOIN departments d ON s.department_id = d.id WHERE s.id IN (${placeholders})`,
      studentIds
    );
    return rows;
  }
  // Enroll a student in multiple courses
  static async enrollInCourses(studentId, courseIds) {
    if (!Array.isArray(courseIds) || courseIds.length === 0) return false;
    const values = courseIds.map(courseId => [studentId, courseId]);
    const query = 'INSERT INTO course_enrollments (student_id, course_id) VALUES ? ON DUPLICATE KEY UPDATE student_id = student_id';
    try {
      await pool.query(query, [values]);
      return true;
    } catch (error) {
      throw new Error('Failed to enroll student in courses: ' + error.message);
    }
  }
  static async create(studentData) {
    const {
      email,
      password,
      first_name,
      last_name,
      date_of_birth,
      gender,
      address,
      phone,
      department_id,
      student_id,
      enrollment_year,
      current_year,
      enrollment_date,
      graduation_date,
      status = 'active'
    } = studentData;
    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      `INSERT INTO students (
        first_name, last_name, email, password_hash, date_of_birth, gender,
        address, phone, department_id, student_id, enrollment_year, current_year,
        enrollment_date, graduation_date, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        first_name, last_name, email, passwordHash, date_of_birth || null,
        gender || null, address || null, phone || null, department_id || null,
        student_id || null, enrollment_year || now('yyyy'), current_year || now('yyyy'),
        enrollment_date || now('yyyy-MM-dd'), graduation_date || null, status
      ]
    );

    return result.insertId;
  }

  static async findByEmail(email) {
    const [rows] = await pool.execute(
      'SELECT * FROM students WHERE email = ?',
      [email]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT s.*, d.name as department_name FROM students s LEFT JOIN departments d ON s.department_id = d.id WHERE s.id = ?',
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  static async update(id, studentData) {
    if (!studentData || Object.keys(studentData).length === 0) return false;
    const allowedFields = [
      'email', 'is_active', 'first_name', 'last_name', 'date_of_birth', 'gender',
      'address', 'phone', 'department_id', 'enrollment_year', 'current_year',
      'enrollment_date', 'graduation_date', 'status'
    ];
    const setClauses = [];
    const values = [];
    for (const key of Object.keys(studentData)) {
      if (!allowedFields.includes(key)) continue;
      setClauses.push(`${key} = ?`);
      values.push(studentData[key]);
    }
    setClauses.push('updated_at = CURRENT_TIMESTAMP');
    const query = `UPDATE students SET ${setClauses.join(', ')} WHERE id = ?`;
    values.push(id);
    const [result] = await pool.execute(query, values);

    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await pool.execute('DELETE FROM students WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async getAll(limit = 10, offset = 0) {
    const [rows] = await pool.execute(
      `SELECT s.*, d.name as department_name FROM students s LEFT JOIN departments d ON s.department_id = d.id ORDER BY s.id DESC LIMIT ${limit} OFFSET ${offset}`
    );
    return rows;
  }

  static async getByDepartment(departmentId) {
    const [rows] = await pool.execute(
      'SELECT * FROM students WHERE department_id = ? AND status = "active" ORDER BY last_name, first_name',
      [departmentId]
    );
    return rows;
  }

  static async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }
}

export default Student;
