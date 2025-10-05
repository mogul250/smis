import pool from '../config/database.js';

class Department {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.code = data.code;
    this.description = data.description;
    this.status = data.status || 'active';
    this.head_id = data.head_id;

    // Handle HOD data - check if it's from getAll (JSON_OBJECT) or findById (separate fields)
    if (data.hod && typeof data.hod === 'object' && data.hod.id) {
      this.hod = data.hod;
    } else if (data.head_first_name && data.head_last_name) {
      this.hod = {
        id: data.head_id,
        name: `${data.head_first_name} ${data.head_last_name}`
      };
    } else {
      this.hod = {};
    }

    this.teachers = data.teachers || [];
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Create a new department
  static async create(departmentData) {
    const { name, head_id, code, teachers } = departmentData;
    const query = `
      INSERT INTO departments (name, head_id, code, teachers, created_at)
      VALUES (?, ?, ?, ?, NOW())
    `;
    const values = [name, head_id || null, code, JSON.stringify(teachers || [])];

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
      SELECT d.*,
             u.first_name as head_first_name,
             u.last_name as head_last_name,
             u.email as head_email
      FROM departments d
      LEFT JOIN users u ON d.head_id = u.id
      WHERE d.id = ?
    `;

    try {
      const [rows] = await pool.execute(query, [id]);
      if (rows.length === 0) {
        return null;
      }

      const departmentData = rows[0];
      // Map teachers to user info
      let teachers = [];
      if (departmentData.teachers) {
        let teacherIds = departmentData.teachers;
        if (typeof teacherIds === 'string') teacherIds = JSON.parse(teacherIds);
        if (Array.isArray(teacherIds) && teacherIds.length > 0) {
          const placeholders = teacherIds.map(() => '?').join(',');
          const [teacherRows] = await pool.execute(
            `SELECT id, CONCAT(first_name, ' ', last_name) as name, email FROM users WHERE id IN (${placeholders})`,
            teacherIds
          );
          teachers = teacherRows;
        }
      }
      departmentData.teachers = teachers;
      return new Department(departmentData);
    } catch (error) {
      console.error('Error in Department.findById:', error);
      throw new Error(`Error fetching department: ${error.message}`);
    }
  }

  // Update department information
  static async update(id, updateData) {
    if (!updateData || Object.keys(updateData).length === 0) return false;
    const allowedFields = ['name', 'head_id', 'teachers'];
    const setClauses = [];
    const values = [];
    for (const key of Object.keys(updateData)) {
      if (!allowedFields.includes(key)) continue;
      if (key === 'teachers') {
        setClauses.push(`${key} = ?`);
        values.push(JSON.stringify(updateData[key]));
      } else {
        setClauses.push(`${key} = ?`);
        values.push(updateData[key]);
      }
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
