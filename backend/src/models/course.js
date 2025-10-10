import pool from '../config/database.js';

class Course {
  constructor(data) {
    this.id = data.id;
    this.course_code = data.course_code;
    this.name = data.name;
    this.description = data.description;
    this.credits = data.credits;
    this.semester = data.semester;
    this.department_id = data.department_id;
    this.year = data.year;
    this.prerequisites = data.prerequisites;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Create a new course
  static async create(courseData) {
    const { course_code, name, description, credits, semester } = courseData;
    const query = `
      INSERT INTO courses (course_code, name, description, credits, semester, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;
    const values = [
      course_code, 
      name, 
      description || null, 
      credits, 
      semester || null
    ];

    try {
      const [result] = await pool.execute(query, values);
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating course: ${error.message}`);
    }
  }

  // Find course by ID
  static async findById(id) {
    const query = `
      SELECT c.*
      FROM courses c
      WHERE c.id = ?
    `;

    try {
      const [rows] = await pool.execute(query, [id]);
      return rows.length ? new Course(rows[0]) : null;
    } catch (error) {
      throw new Error(`Error finding course: ${error.message}`);
    }
  }

  // Find course by code
  static async findByCode(courseCode) {
    const query = `
      SELECT c.*
      FROM courses c
      WHERE c.course_code = ?
    `;

    try {
      const [rows] = await pool.execute(query, [courseCode]);
      return rows.length ? new Course(rows[0]) : null;
    } catch (error) {
      throw new Error(`Error finding course by code: ${error.message}`);
    }
  }

  // Update course information
  static async update(id, updateData) {
    if (!updateData || Object.keys(updateData).length === 0) return false;
    const allowedFields = ['course_code', 'name', 'description', 'credits', 'semester'];
    const setClauses = [];
    const values = [];
    for (const key of Object.keys(updateData)) {
      if (!allowedFields.includes(key)) continue;
      setClauses.push(`${key} = ?`);
      values.push(updateData[key]);
    }
    // Note: updated_at column doesn't exist in current schema
    const query = `UPDATE courses SET ${setClauses.join(', ')} WHERE id = ?`;
    values.push(id);
    try {
      const [result] = await pool.execute(query, values);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating course: ${error.message}`);
    }
  }

  // Delete course
  static async delete(id) {
    const query = 'DELETE FROM courses WHERE id = ?';

    try {
      const [result] = await pool.execute(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deleting course: ${error.message}`);
    }
  }

  // Get all courses with pagination
  static async getAll(limit = 10, offset = 0) {
    const query = `
      SELECT c.*
      FROM courses c
      ORDER BY c.id DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    try {
      const [rows] = await pool.execute(query);
      return rows.map(row => new Course(row));
    } catch (error) {
      throw new Error(`Error getting courses: ${error.message}`);
    }
  }

  // Get courses taught by a teacher
  static async getByTeacher(teacherId) {
    const query = `
      SELECT DISTINCT c.*
      FROM courses c
      JOIN timetable t ON c.id = t.course_id
      WHERE t.teacher_id = ?
      ORDER BY c.name
    `;

    try {
      const [rows] = await pool.execute(query, [teacherId]);
      return rows.map(row => new Course(row));
    } catch (error) {
      throw new Error(`Error getting courses by teacher: ${error.message}`);
    }
  }

  // Get courses enrolled by a student
  static async getByStudent(studentId) {
    const query = `
      SELECT c.*
      FROM courses c
      JOIN course_enrollments ce ON c.id = ce.course_id
      WHERE ce.student_id = ?
      ORDER BY c.name
    `;

    try {
      const [rows] = await pool.execute(query, [studentId]);
      return rows.map(row => new Course(row));
    } catch (error) {
      throw new Error(`Error getting courses by student: ${error.message}`);
    }
  }

  // Check if course is being used in timetables or enrollments
  static async checkUsage(courseId) {
    try {
      // Check timetable usage
      const timetableQuery = 'SELECT COUNT(*) as count FROM timetable WHERE course_id = ?';
      const [timetableRows] = await pool.execute(timetableQuery, [courseId]);
      
      // Check enrollment usage (if table exists)
      let enrollmentCount = 0;
      try {
        const enrollmentQuery = 'SELECT COUNT(*) as count FROM course_enrollments WHERE course_id = ?';
        const [enrollmentRows] = await pool.execute(enrollmentQuery, [courseId]);
        enrollmentCount = enrollmentRows[0].count;
      } catch (error) {
        // Table might not exist, ignore error
        console.log('course_enrollments table not found, skipping enrollment check');
      }
      
      return timetableRows[0].count > 0 || enrollmentCount > 0;
    } catch (error) {
      console.error('Error checking course usage:', error);
      return false; // If we can't check, allow deletion
    }
  }

  // Assign course to department
  static async assignToDepartment(courseId, departmentId) {
    try {
      const query = `
        INSERT INTO department_courses (department_id, course_id, assigned_date, created_at, updated_at)
        VALUES (?, ?, CURDATE(), NOW(), NOW())
        ON DUPLICATE KEY UPDATE updated_at = NOW()
      `;
      const [result] = await pool.execute(query, [departmentId, courseId]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error assigning course to department: ${error.message}`);
    }
  }

  // Remove course from department
  static async removeFromDepartment(courseId, departmentId) {
    try {
      const query = 'DELETE FROM department_courses WHERE course_id = ? AND department_id = ?';
      const [result] = await pool.execute(query, [courseId, departmentId]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error removing course from department: ${error.message}`);
    }
  }

  // Get courses by department
  static async getByDepartment(departmentId) {
    try {
      const query = `
        SELECT 
          c.*,
          dc.assigned_date,
          -- Count enrolled students for this course
          (SELECT COUNT(DISTINCT ce.student_id) 
           FROM course_enrollments ce 
           WHERE ce.course_id = c.id AND ce.status = 'enrolled') as enrolled_students,
          -- Count teachers assigned to this course
          (SELECT COUNT(DISTINCT t.teacher_id) 
           FROM timetable t 
           WHERE t.course_id = c.id) as assigned_teachers
        FROM courses c
        INNER JOIN department_courses dc ON c.id = dc.course_id
        WHERE dc.department_id = ?
        ORDER BY c.name
      `;
      const [rows] = await pool.execute(query, [departmentId]);
      return rows.map(row => new Course(row));
    } catch (error) {
      throw new Error(`Error getting courses by department: ${error.message}`);
    }
  }
}

export default Course;
