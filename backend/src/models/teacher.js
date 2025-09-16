import pool from '../config/database.js';

class Teacher {
  constructor(data) {
    this.id = data.id;
    this.first_name = data.first_name;
    this.last_name = data.last_name;
    this.email = data.email;
    this.department_id = data.department_id;
    this.hire_date = data.hire_date;
    this.subjects = data.subjects;
    this.status = data.status;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Create a new teacher (insert into users table with role 'teacher')
  static async create(teacherData) {
    const { first_name, last_name, email, password_hash, department_id, hire_date, subjects, status = 'active' } = teacherData;
    const query = `
      INSERT INTO users (first_name, last_name, email, password_hash, role, department_id, hire_date, subjects, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'teacher', ?, ?, ?, ?, NOW(), NOW())
    `;
    const values = [first_name, last_name, email, password_hash, department_id, hire_date, JSON.stringify(subjects || []), status];

    try {
      const [result] = await pool.execute(query, values);
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating teacher: ${error.message}`);
    }
  }

  // Find teacher by ID (user ID)
  static async findById(id) {
    const query = `
      SELECT u.*, d.name as department_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ? AND u.role = 'teacher'
    `;

    try {
      const [rows] = await pool.execute(query, [id]);
      if (rows.length) {
        rows[0].subjects = JSON.parse(rows[0].subjects || '[]');
        return new Teacher(rows[0]);
      }
      return null;
    } catch (error) {
      throw new Error(`Error finding teacher: ${error.message}`);
    }
  }

  // Find teacher by user ID (same as findById)
  static async findByUserId(userId) {
    return this.findById(userId);
  }

  // Update teacher information
  static async update(id, updateData) {
    const { department_id, hire_date, subjects, status } = updateData;
    const query = `
      UPDATE users
      SET department_id = ?, hire_date = ?, subjects = ?, status = ?, updated_at = NOW()
      WHERE id = ? AND role = 'teacher'
    `;
    const values = [department_id, hire_date, JSON.stringify(subjects || []), status, id];

    try {
      const [result] = await pool.execute(query, values);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating teacher: ${error.message}`);
    }
  }

  // Delete teacher (set inactive)
  static async delete(id) {
    const query = `UPDATE users SET status = 'inactive', updated_at = NOW() WHERE id = ? AND role = 'teacher'`;

    try {
      const [result] = await pool.execute(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deleting teacher: ${error.message}`);
    }
  }

  // Get all teachers with pagination
  static async getAll(limit = 10, offset = 0) {
    const query = `
      SELECT u.*, d.name as department_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.role = 'teacher' AND u.status = 'active'
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `;

    try {
      const [rows] = await pool.execute(query, [limit, offset]);
      return rows.map(row => {
        row.subjects = JSON.parse(row.subjects || '[]');
        return new Teacher(row);
      });
    } catch (error) {
      throw new Error(`Error getting teachers: ${error.message}`);
    }
  }

  // Get teachers by department
  static async getByDepartment(departmentId) {
    const query = `
      SELECT u.*, d.name as department_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.department_id = ? AND u.role = 'teacher' AND u.status = 'active'
      ORDER BY u.last_name, u.first_name
    `;

    try {
      const [rows] = await pool.execute(query, [departmentId]);
      return rows.map(row => {
        row.subjects = JSON.parse(row.subjects || '[]');
        return new Teacher(row);
      });
    } catch (error) {
      throw new Error(`Error getting teachers by department: ${error.message}`);
    }
  }

  // Get teachers assigned to a course
  static async getByCourse(courseId) {
    const query = `
      SELECT u.*, d.name as department_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      JOIN timetable tt ON u.id = tt.teacher_id
      WHERE tt.course_id = ? AND u.role = 'teacher' AND u.status = 'active'
    `;

    try {
      const [rows] = await pool.execute(query, [courseId]);
      return rows.map(row => {
        row.subjects = JSON.parse(row.subjects || '[]');
        return new Teacher(row);
      });
    } catch (error) {
      throw new Error(`Error getting teachers by course: ${error.message}`);
    }
  }
}

export default Teacher;
