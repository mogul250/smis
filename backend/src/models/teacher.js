import pool from '../config/database.js';

class Teacher {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.department_id = data.department_id;
    this.hire_date = data.hire_date;
    this.subjects = data.subjects;
    this.status = data.status;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Create a new teacher
  static async create(teacherData) {
    const { user_id, department_id, hire_date, subjects, status = 'active' } = teacherData;
    const query = `
      INSERT INTO teachers (user_id, department_id, hire_date, subjects, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const values = [user_id, department_id, hire_date, JSON.stringify(subjects || []), status];

    try {
      const [result] = await pool.execute(query, values);
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating teacher: ${error.message}`);
    }
  }

  // Find teacher by ID
  static async findById(id) {
    const query = `
      SELECT t.*, u.first_name, u.last_name, u.email, d.name as department_name
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      JOIN departments d ON t.department_id = d.id
      WHERE t.id = ?
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

  // Find teacher by user ID
  static async findByUserId(userId) {
    const query = `
      SELECT t.*, u.first_name, u.last_name, u.email, d.name as department_name
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      JOIN departments d ON t.department_id = d.id
      WHERE t.user_id = ?
    `;

    try {
      const [rows] = await pool.execute(query, [userId]);
      if (rows.length) {
        rows[0].subjects = JSON.parse(rows[0].subjects || '[]');
        return new Teacher(rows[0]);
      }
      return null;
    } catch (error) {
      throw new Error(`Error finding teacher by user ID: ${error.message}`);
    }
  }

  // Update teacher information
  static async update(id, updateData) {
    const { department_id, hire_date, subjects, status } = updateData;
    const query = `
      UPDATE teachers
      SET department_id = ?, hire_date = ?, subjects = ?, status = ?, updated_at = NOW()
      WHERE id = ?
    `;
    const values = [department_id, hire_date, JSON.stringify(subjects || []), status, id];

    try {
      const [result] = await pool.execute(query, values);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating teacher: ${error.message}`);
    }
  }

  // Delete teacher
  static async delete(id) {
    const query = 'DELETE FROM teachers WHERE id = ?';

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
      SELECT t.*, u.first_name, u.last_name, u.email, d.name as department_name
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      JOIN departments d ON t.department_id = d.id
      ORDER BY t.created_at DESC
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
      SELECT t.*, u.first_name, u.last_name, u.email
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      WHERE t.department_id = ? AND t.status = 'active'
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
      SELECT t.*, u.first_name, u.last_name, u.email, d.name as department_name
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      JOIN departments d ON t.department_id = d.id
      JOIN timetables tt ON t.id = tt.teacher_id
      WHERE tt.course_id = ? AND t.status = 'active'
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
