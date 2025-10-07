import pool from '../config/database.js';
import { now } from '../utils/helpers.js';
import Student from './student.js';

class ClassModel {
  // Get all classes for a department
  static async findByDepartment(departmentId) {
    const query = 'SELECT * FROM classes WHERE department_id = ? ORDER BY created_at DESC';
    const [rows] = await pool.execute(query, [departmentId]);
    return rows.map(cls => ({
      ...cls,
    }));
  }
  // Create a new class
  static async create({ academic_year, start_date,department_id, end_date, students, created_by, name }) {
    const query = `
      INSERT INTO classes (academic_year, start_date, end_date, students,department_id, created_by,name)
      VALUES (?, ?, ?, ?,?, ?,?)
    `;
    const [result] = await pool.execute(query, [
      academic_year || now('yyyy'),
      start_date,
      end_date,
      JSON.stringify(students),
      department_id,
      created_by,
      name
    ]);
    return result.insertId;
  }

  // Find class by ID
  static async findById(id) {
    const query = `SELECT 
      c.*,
      JSON_OBJECT(
        'id', d.id,
        'name', d.name
      ) AS department,
      JSON_OBJECT(
        'id', u.id,
        'name', CONCAT(u.first_name, ' ', u.last_name)
      ) AS classTeacher,
      COALESCE(
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', cs.id,
            'name', cs.name,
            'course_code', cs.course_code
          )
        ),
        JSON_ARRAY()
      ) AS courses
    FROM classes c
    INNER JOIN departments d ON d.id = c.department_id
    LEFT JOIN users u ON u.id = c.created_by
    LEFT JOIN class_courses cc ON cc.class_id = c.id
    LEFT JOIN courses cs ON cs.id = cc.course_id
    WHERE c.id = ?
    GROUP BY c.id;
    `;
    const [rows] = await pool.execute(query, [id]);
    if (rows.length === 0) return null;
    const cls = rows[0];
    cls.students = await Promise.all(cls.students.map(async id => {
      let Stu = await Student.findById(id);
      return {id: Stu.id, name: `${Stu.first_name} ${Stu.last_name}`, email: Stu.email}
     }));
    return cls;
  }

  // Get all classes
  static async findAll({offset, limit}) {
    const query = `SELECT c.*, JSON_OBJECT("id",d.id, "name", d.name) as department, JSON_OBJECT("id",u.id, "name", CONCAT(u.first_name, " ", u.last_name)) as classTeacher FROM classes c inner join departments d on d.id = c.department_id left join users u on u.id = c.created_by ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    const [rows] = await pool.execute(query);
    return rows.map(cls => ({
      ...cls
    }));
  }
  // Get active classes
  static async findActive() {
    const query = 'SELECT * FROM classes WHERE is_active = TRUE ORDER BY created_at DESC';
    const [rows] = await pool.execute(query);
    return rows.map(cls => ({
      ...cls,
      // students: JSON.parse(cls.students)
    }));
  }

  // Update class with only provided fields (partial update)
  static async update(id, updateObj) {
    if (!updateObj || Object.keys(updateObj).length === 0) return false;
    const allowedFields = ['academic_year', 'start_date', 'end_date', 'students', 'is_active', 'department_id', 'name'];
    const setClauses = [];
    const values = [];
    for (const key of Object.keys(updateObj)) {
      if (!allowedFields.includes(key)) continue;
      if (key === 'students') {
        setClauses.push(`${key} = ?`);
        values.push(JSON.stringify(updateObj[key]));
      } else {
        setClauses.push(`${key} = ?`);
        values.push(updateObj[key]);
      }
    }
    setClauses.push('updated_at = CURRENT_TIMESTAMP');
    const query = `UPDATE classes SET ${setClauses.join(', ')} WHERE id = ?`;
    values.push(id);
    const [result] = await pool.execute(query, values);
    return result.affectedRows > 0;
  }

  // Add student to class (if not expired)
  static async addStudent(classId, studentId) {
    const cls = await this.findById(classId);
    if (!cls) throw new Error('Class not found');
    if (!cls.is_active) throw new Error('Class is not active');
    if (new Date() > new Date(cls.end_date)) throw new Error('Class has expired');

    const students = cls.students;
    if (!students.includes(studentId)) {
      students.push(studentId);
      await this.update(classId, { students });
      // Enroll the new student in all class courses
      const courses = await this.getCourses(classId);
      const courseIds = courses.map(c => c.id);
      if (courseIds.length > 0) {
        const Student = (await import('./student.js')).default;
        await Student.enrollInCourses(studentId, courseIds);
      }
    }
    return true;
  }

  // Remove student from class
  static async removeStudent(classId, studentId) {
    const cls = await this.findById(classId);
    if (!cls) throw new Error('Class not found');

    const students = cls.students.filter(id => id !== studentId);
    await this.update(classId, { students });
    return true;
  }

  // Get classes for a student
  static async findByStudent(studentId,isActive) {
    const query = `SELECT * FROM classes WHERE JSON_CONTAINS(students, ?) ${isActive ? 'AND is_active = TRUE' : ''}`;
    const [rows] = await pool.execute(query, [JSON.stringify(studentId)]);
    const nowDate = new Date();
    // Only return the active class: start_date <= now <= end_date, is_active
    const activeClass = rows.find(cls => {
      const start = new Date(cls.start_date);
      const end = new Date(cls.end_date);
      return cls.is_active && start <= nowDate && nowDate <= end;
    });
    return activeClass ? [{
      ...activeClass,
      students: JSON.parse(activeClass.students)
    }] : [];
  }

  // Add course to class
  static async addCourse(classId, courseId) {
    const query = 'INSERT INTO class_courses (class_id, course_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE class_id = class_id';
    await pool.execute(query, [classId, courseId]);
    // Enroll all students in this class in the new course
    const cls = await this.findById(classId);
    if (cls && Array.isArray(cls.students) && cls.students.length > 0) {
      await Student.enrollInCourses(cls.students.map(s=> s.id), [courseId]);
    }
    return true;
  }

  // Remove course from class
  static async removeCourse(classId, courseId) {
    const query = 'DELETE FROM class_courses WHERE class_id = ? AND course_id = ?';
    await pool.execute(query, [classId, courseId]);
    const cls = await this.findById(classId);
    if (cls && Array.isArray(cls.students) && cls.students.length > 0) {
      for (const student of cls.students) {
        await Student.unenrollFromCourses(student.id, [courseId]);
      }
    }
    return true;
  }

  // Get courses for a class
  static async getCourses(classId) {
    const query = `
      SELECT c.* FROM courses c
      JOIN class_courses cc ON c.id = cc.course_id
      WHERE cc.class_id = ?
    `;
    const [rows] = await pool.execute(query, [classId]);
    return rows;
  }

  // Get students in a class
  static async getStudents(classId) {
    const cls = await this.findById(classId);
    if (!cls) return [];

    const studentIds = cls.students;
    if (studentIds.length === 0) return [];

    const placeholders = studentIds.map(() => '?').join(',');
    const query = `SELECT * FROM students WHERE id IN (${placeholders})`;
    const [rows] = await pool.execute(query, studentIds);
    return rows;
  }
}

export default ClassModel;
