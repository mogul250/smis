import pool from '../config/database.js';

class Department {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.head_id = data.head_id;
    this.hod = data.hod.id ? data.hod : {}
    this.teachers = data.teachers  || [];
    this.created_at = data.created_at;
  }

  // Create a new department
  static async create(departmentData) {
    const { name, head_id, code } = departmentData;
    const query = `
      INSERT INTO departments (name, head_id, code, created_at)
      VALUES (?, ?, ?, NOW())
    `;
    const values = [name, head_id || null, code];

    try {
      const [result] = await pool.execute(query, values);
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating department: ${error.message}`);
    }
  }

  // Find department by ID
  static async findById(id) {
    const query = `
      SELECT d.*, u.first_name as head_first_name, u.last_name as head_last_name
      FROM departments d
      LEFT JOIN users u ON d.head_id = u.id
      WHERE d.id = ?
    `;

    try {
      const [rows] = await pool.execute(query, [id]);
      return rows.length ? new Department(rows[0]) : null;
    } catch (error) {
      console.log(error)
      throw new Error(`internal server error`);
    }
  }

  // Update department information
  static async update(id, updateData) {
    if (!updateData || Object.keys(updateData).length === 0) return false;
    const allowedFields = ['name', 'head_id', 'code'];
    const setClauses = [];
    const values = [];
    for (const key of Object.keys(updateData)) {
      if (!allowedFields.includes(key)) continue;
      setClauses.push(`${key} = ?`);
      values.push(updateData[key]);
    }
    // setClauses.push('updated_at = NOW()');
    const query = `UPDATE departments SET ${setClauses.join(', ')} WHERE id = ?`;
    values.push(id);
    try {
      const [result] = await pool.execute(query, values);
      return result.affectedRows > 0;
    } catch (error) {
      console.log(error)
      throw new Error(`Internal server error`);
    }
  }

  // Delete department
  static async delete(id) {
    const query = 'DELETE FROM departments WHERE id = ?';

    try {
      const [result] = await pool.execute(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deleting department: ${error.message}`);
    }
  }

  // Get all departments
  static async getAll(limit = 10, offset = 0) {
    const query = `
      SELECT d.*, JSON_OBJECT('id', u.id, 'name', CONCAT(u.first_name, ' ' ,u.last_name) ) as hod
      FROM departments d
      LEFT JOIN users u ON d.head_id = u.id
      ORDER BY d.name
      LIMIT ? OFFSET ?
    `;

    try {
      const [rows] = await pool.query(query, [limit, offset]);
      return rows.map(row => new Department(row));
    } catch (error) {
      throw new Error(`Error getting departments: ${error.message}`);
    }
  }

  // Get department statistics
  static async getStats(departmentId) {
    const query = `
      SELECT
        (SELECT COUNT(*) FROM students WHERE department_id = ?) as student_count,
        (SELECT COUNT(*) FROM teachers WHERE department_id = ?) as teacher_count,
        (SELECT COUNT(*) FROM courses c JOIN timetables t ON c.id = t.course_id WHERE t.teacher_id IN (SELECT id FROM teachers WHERE department_id = ?)) as course_count
    `;
    try {
      const [rows] = await pool.execute(query, [departmentId, departmentId, departmentId]);
      return rows[0];
    } catch (error) {
      throw new Error(`Error getting department stats: ${error.message}`);
    }
  }
}

export default Department;
