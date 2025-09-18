import pool from '../config/database.js';
import bcrypt from 'bcryptjs';

class Student {
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
        student_id || null, enrollment_year || null, current_year || null,
        enrollment_date || null, graduation_date || null, status
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
    const {
      email,
      is_active,
      first_name,
      last_name,
      date_of_birth,
      gender,
      address,
      phone,
      department_id,
      enrollment_year,
      current_year,
      enrollment_date,
      graduation_date,
      status
    } = studentData;

    const [result] = await pool.execute(
      `UPDATE students SET
        email = ?, is_active = ?, first_name = ?, last_name = ?,
        date_of_birth = ?, gender = ?, address = ?, phone = ?, department_id = ?,
        enrollment_year = ?, current_year = ?, enrollment_date = ?, graduation_date = ?,
        status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
      [
        email, is_active, first_name, last_name, date_of_birth, gender,
        address, phone, department_id, enrollment_year, current_year,
        enrollment_date, graduation_date, status, id
      ]
    );

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
