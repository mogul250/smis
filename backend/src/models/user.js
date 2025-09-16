import pool from '../config/database.js';
import bcrypt from 'bcryptjs';

class User {
  static async create(userData) {
    const {
      email,
      password,
      role,
      first_name,
      last_name,
      date_of_birth,
      gender,
      address,
      phone,
      department_id,
      staff_id,
      hire_date,
      qualifications,
      subjects,
      status = 'active'
    } = userData;
    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      `INSERT INTO users (
        first_name, last_name, email, password_hash, role, date_of_birth, gender,
        address, phone, department_id, staff_id, hire_date, qualifications, subjects, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        first_name, last_name, email, passwordHash, role, date_of_birth || null,
        gender || null, address || null, phone || null, department_id || null,
        staff_id || null, hire_date || null, qualifications || null,
        subjects ? JSON.stringify(subjects) : null, status
      ]
    );

    return result.insertId;
  }

  static async findByEmail(email) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    if (rows[0]) {
      rows[0].subjects = rows[0].subjects ? JSON.parse(rows[0].subjects) : null;
    }
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    if (rows[0]) {
      rows[0].subjects = rows[0].subjects ? JSON.parse(rows[0].subjects) : null;
    }
    return rows[0];
  }

  static async update(id, userData) {
    const fields = [];
    const values = [];

    // Handle subjects separately to stringify if needed
    if (userData.subjects) {
      userData.subjects = JSON.stringify(userData.subjects);
    }

    for (const [key, value] of Object.entries(userData)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }

    if (fields.length === 0) {
      return; // No fields to update
    }

    values.push(id);

    const query = `
      UPDATE users
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await pool.execute(query, values);
  }


  static async delete(id) {
    await pool.execute('DELETE FROM users WHERE id = ?', [id]);
  }

  static async getAll(limit = 10, offset = 0) {
    const [rows] = await pool.execute(
      'SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
    return rows.map(row => {
      if (row.subjects) row.subjects = JSON.parse(row.subjects);
      return row;
    });
  }

  static async getByRole(role) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE role = ? ORDER BY created_at DESC',
      [role]
    );
    return rows.map(row => {
      if (row.subjects) row.subjects = JSON.parse(row.subjects);
      return row;
    });
  }

  static async findByDepartment(departmentId) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE department_id = ? ORDER BY created_at DESC',
      [departmentId]
    );
    return rows.map(row => {
      if (row.subjects) row.subjects = JSON.parse(row.subjects);
      return row;
    });
  }

  static async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }
}

export default User;
