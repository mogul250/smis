import pool from '../config/database.js';
import bcrypt from 'bcryptjs';

class User {
  static async create(userData) {
    const { email, password, role } = userData;
    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
      [email, passwordHash, role]
    );

    return result.insertId;
  }

  static async findByEmail(email) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT id, email, role, is_active, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async update(id, userData) {
    const { email, role, is_active } = userData;
    await pool.execute(
      'UPDATE users SET email = ?, role = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [email, role, is_active, id]
    );
  }

  static async delete(id) {
    await pool.execute('DELETE FROM users WHERE id = ?', [id]);
  }

  static async getAll() {
    const [rows] = await pool.execute(
      'SELECT id, email, role, is_active, created_at, updated_at FROM users ORDER BY created_at DESC'
    );
    return rows;
  }

  static async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }
}

export default User;
