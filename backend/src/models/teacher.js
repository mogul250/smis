import pool from '../config/database.js';
import Department from './department.js';

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

    // Validate required fields
    if (!first_name || !last_name || !email || !password_hash || !department_id) {
      throw new Error('Missing required fields: first_name, last_name, email, password_hash, department_id are required');
    }

    // Validate that subjects are valid course IDs
    if (subjects && subjects.length > 0) {
      const placeholders = subjects.map(() => '?').join(',');
      const courseQuery = `SELECT id FROM courses WHERE id IN (${placeholders})`;
      const [courseRows] = await pool.execute(courseQuery, subjects);

      if (courseRows.length !== subjects.length) {
        const foundIds = courseRows.map(row => row.id);
        const invalidIds = subjects.filter(id => !foundIds.includes(id));
        throw new Error(`Invalid course IDs: ${invalidIds.join(', ')}`);
      }
    }

    const query = `
      INSERT INTO users (first_name, last_name, email, password_hash, role, department_id, hire_date, subjects, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'teacher', ?, ?, ?, ?, NOW(), NOW())
    `;
    const values = [first_name, last_name, email, password_hash, department_id, hire_date || null, JSON.stringify(subjects || []), status];

    try {
      const [result] = await pool.execute(query, values);
      return result.insertId;
    } catch (error) {
      console.error('Teacher create error:', error);
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
        // Handle both JSON strings and comma-separated strings for backward compatibility
        let subjects = rows[0].subjects || '[]';
        if (typeof subjects === 'string' && !subjects.startsWith('[')) {
          // Convert comma-separated string to array
          subjects = subjects.split(',').map(s => s.trim());
        } else if (typeof subjects === 'string') {
          subjects = JSON.parse(subjects);
        }

        // If subjects contain course IDs, fetch course details
        if (subjects && subjects.length > 0 && typeof subjects[0] === 'number') {
          const placeholders = subjects.map(() => '?').join(',');
          const courseQuery = `SELECT id, course_code, name, description, credits FROM courses WHERE id IN (${placeholders})`;
          const [courseRows] = await pool.execute(courseQuery, subjects);
          rows[0].subjects = courseRows;
        } else {
          rows[0].subjects = subjects;
        }

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
    if (!updateData || Object.keys(updateData).length === 0) return false;
    const allowedFields = ['department_id', 'hire_date', 'subjects', 'status'];
    const setClauses = [];
    const values = [];
    for (const key of Object.keys(updateData)) {
      if (!allowedFields.includes(key)) continue;
      if (key === 'subjects') {
        setClauses.push(`${key} = ?`);
        values.push(JSON.stringify(updateData[key]));
      } else {
        setClauses.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    }
    setClauses.push('updated_at = NOW()');
    const query = `UPDATE users SET ${setClauses.join(', ')} WHERE id = ? AND role = 'teacher'`;
    values.push(id);
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
    // Validate and sanitize inputs to prevent SQL injection
    const actualLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 100); // Min 1, Max 100 records
    const actualOffset = Math.max(parseInt(offset) || 0, 0); // Min 0

    const query = `
      SELECT u.*, d.name as department_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.role = 'teacher' AND u.status = 'active'
      ORDER BY u.created_at DESC
      LIMIT ${actualLimit} OFFSET ${actualOffset}
    `;

    try {
      const [rows] = await pool.execute(query);
      return rows.map(row => {
        // Handle both JSON strings and comma-separated strings for backward compatibility
        let subjects = row.subjects || '[]';
        if (typeof subjects === 'string' && !subjects.startsWith('[')) {
          subjects = subjects.split(',').map(s => s.trim());
        } else if (typeof subjects === 'string') {
          subjects = JSON.parse(subjects);
        }
        row.subjects = subjects;
        return new Teacher(row);
      });
    } catch (error) {
      throw new Error(`Error getting teachers: ${error.message}`);
    }
  }

  // Get teachers by department
  static async getByDepartment(departmentId) {
    const query = `
      SELECT u.*
      FROM users u
      INNER JOIN departments d ON JSON_CONTAINS(d.teachers, CAST(u.id AS JSON), '$')
      WHERE d.id = ? AND u.role = 'teacher' AND u.status = 'active'
      ORDER BY u.last_name, u.first_name
    `;

    try {
      const [rows] = await pool.execute(query, [departmentId]);
      return rows.map(row => {
        return new Teacher(row);
      });
    } catch (error) {
      throw new Error(`Error getting teachers by department: ${error.message}`);
    }
  }

  // Get teachers assigned to a course
  static async getByCourse(courseId) {
    const query = `
      SELECT 
        u.*, 
        d.name AS department_name
      FROM users u
      LEFT JOIN departments d 
        ON JSON_CONTAINS(d.teachers, CAST(u.id AS JSON), '$')
      JOIN timetable tt 
        ON u.id = tt.teacher_id
      WHERE 
        tt.course_id = ? 
        AND u.role = 'teacher' 
        AND u.status = 'active';

    `;

    try {
      const [rows] = await pool.execute(query, [courseId]);
      return rows.map(row => {
        return new Teacher(row);
      });
    } catch (error) {
      throw new Error(`Error getting teachers by course: ${error.message}`);
    }
  }
  static async assignToDepartment(departmentId, teacherId) {
    // Fetch department
    const department = await Department.findById(departmentId);
    if (!department) throw new Error('Department not found');
    let teachers = Array.isArray(department.teachers) ? department.teachers.map(t => t.id || t) : [];
    if (!teachers.includes(teacherId)) {
      teachers.push(teacherId);
      await Department.update(departmentId, { teachers });
    }
    return true;
  }

  // Remove a teacher from the department's teachers array
  static async removeFromDepartment(departmentId, teacherId) {
    // Fetch department
    const department = await Department.findById(departmentId);
    if (!department) throw new Error('Department not found');
    let teachers = Array.isArray(department.teachers) ? department.teachers.map(t => t.id || t) : [];
    teachers = teachers.filter(id => id != teacherId);
    await Department.update(departmentId, { teachers });
    return true;
  }
}

export default Teacher;
