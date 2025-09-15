import pool from '../config/database.js';

class Student {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.department_id = data.department_id;
    this.enrollment_date = data.enrollment_date;
    this.graduation_date = data.graduation_date;
    this.status = data.status;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Create a new student
  static async create(studentData) {
    const { user_id, department_id, enrollment_date, status = 'active' } = studentData;
    const query = `
      INSERT INTO students (user_id, department_id, enrollment_date, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, NOW(), NOW())
    `;
    const values = [user_id, department_id, enrollment_date, status];

    try {
      const [result] = await pool.execute(query, values);
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating student: ${error.message}`);
    }
  }

  // Find student by ID
  static async findById(id) {
    const query = `
      SELECT s.*, u.first_name, u.last_name, u.email, d.name as department_name
      FROM students s
      JOIN users u ON s.user_id = u.id
      JOIN departments d ON s.department_id = d.id
      WHERE s.id = ?
    `;

    try {
      const [rows] = await pool.execute(query, [id]);
      return rows.length ? new Student(rows[0]) : null;
    } catch (error) {
      throw new Error(`Error finding student: ${error.message}`);
    }
  }

  // Find student by user ID
  static async findByUserId(userId) {
    const query = `
      SELECT s.*, u.first_name, u.last_name, u.email, d.name as department_name
      FROM students s
      JOIN users u ON s.user_id = u.id
      JOIN departments d ON s.department_id = d.id
      WHERE s.user_id = ?
    `;

    try {
      const [rows] = await pool.execute(query, [userId]);
      return rows.length ? new Student(rows[0]) : null;
    } catch (error) {
      throw new Error(`Error finding student by user ID: ${error.message}`);
    }
  }

  // Update student information
  static async update(id, updateData) {
    const { department_id, enrollment_date, graduation_date, status } = updateData;
    const query = `
      UPDATE students
      SET department_id = ?, enrollment_date = ?, graduation_date = ?, status = ?, updated_at = NOW()
      WHERE id = ?
    `;
    const values = [department_id, enrollment_date, graduation_date, status, id];

    try {
      const [result] = await pool.execute(query, values);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating student: ${error.message}`);
    }
  }

  // Delete student
  static async delete(id) {
    const query = 'DELETE FROM students WHERE id = ?';

    try {
      const [result] = await pool.execute(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deleting student: ${error.message}`);
    }
  }

  // Get all students with pagination
  static async getAll(limit = 10, offset = 0) {
    const query = `
      SELECT s.*, u.first_name, u.last_name, u.email, d.name as department_name
      FROM students s
      JOIN users u ON s.user_id = u.id
      JOIN departments d ON s.department_id = d.id
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `;

    try {
      const [rows] = await pool.execute(query, [limit, offset]);
      return rows.map(row => new Student(row));
    } catch (error) {
      throw new Error(`Error getting students: ${error.message}`);
    }
  }

  // Get students by department
  static async getByDepartment(departmentId) {
    const query = `
      SELECT s.*, u.first_name, u.last_name, u.email
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE s.department_id = ? AND s.status = 'active'
      ORDER BY u.last_name, u.first_name
    `;

    try {
      const [rows] = await pool.execute(query, [departmentId]);
      return rows.map(row => new Student(row));
    } catch (error) {
      throw new Error(`Error getting students by department: ${error.message}`);
    }
  }
}

export default Student;
