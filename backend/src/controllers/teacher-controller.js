import User from '../models/user.js';
import Attendance from '../models/attendance.js';
import Grade from '../models/grade.js';
import Timetable from '../models/timetable.js';
import pool from '../config/database.js';

class TeacherController {
  // Get teacher profile by user ID
  static async getProfile(req, res) {
    try {
      const userId = req.user.id;
      const teacher = await User.findById(userId);
      if (!teacher) {
        return res.status(404).json({ message: 'Teacher not found' });
      }
      res.json(teacher);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Update teacher profile
  static async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const teacher = await User.findById(userId);
      if (!teacher) {
        return res.status(404).json({ message: 'Teacher not found' });
      }
      const updateData = req.body;

      // Validation
      const allowedFields = ['first_name', 'last_name', 'email', 'department_id'];
      const invalidFields = Object.keys(updateData).filter(field => !allowedFields.includes(field));
      if (invalidFields.length > 0) {
        return res.status(400).json({ message: `Invalid fields: ${invalidFields.join(', ')}` });
      }

      if (updateData.department_id && (!Number.isInteger(updateData.department_id) || updateData.department_id <= 0)) {
        return res.status(400).json({ message: 'Invalid department ID' });
      }

      await User.update(userId, updateData);
      res.json({ message: 'Profile updated successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Get classes assigned to the teacher
  static async getClasses(req, res) {
    try {
      const userId = req.user.id;
      const teacher = await User.findById(userId);
      if (!teacher) {
        return res.status(404).json({ message: 'Teacher not found' });
      }

      const query = `
        SELECT DISTINCT c.*, d.name as department_name
        FROM courses c
        JOIN departments d ON c.department_id = d.id
        JOIN timetables t ON c.id = t.course_id
        WHERE t.teacher_id = ?
        ORDER BY c.name
      `;
      const [rows] = await pool.execute(query, [userId]);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Mark attendance for students in a class
  static async markAttendance(req, res) {
    try {
      const userId = req.user.id;
      const teacher = await User.findById(userId);
      if (!teacher) {
        return res.status(404).json({ message: 'Teacher not found' });
      }

      const { courseId, attendanceData } = req.body;

      // Validation
      if (!courseId || !Number.isInteger(courseId) || courseId <= 0) {
        return res.status(400).json({ message: 'Invalid course ID' });
      }

      if (!Array.isArray(attendanceData)) {
        return res.status(400).json({ message: 'Attendance data must be an array' });
      }

      // Verify teacher is assigned to this course
      const query = 'SELECT COUNT(*) as count FROM timetables WHERE course_id = ? AND teacher_id = ?';
      const [rows] = await pool.execute(query, [courseId, userId]);
      if (rows[0].count === 0) {
        return res.status(403).json({ message: 'Not authorized to mark attendance for this course' });
      }

      const results = [];
      for (const record of attendanceData) {
        const { studentId, date, status, notes } = record;

        if (!studentId || !Number.isInteger(studentId) || studentId <= 0) {
          results.push({ studentId, success: false, message: 'Invalid student ID' });
          continue;
        }

        if (!date || isNaN(Date.parse(date))) {
          results.push({ studentId, success: false, message: 'Invalid date' });
          continue;
        }

        if (!['present', 'absent', 'late'].includes(status)) {
          results.push({ studentId, success: false, message: 'Invalid status' });
          continue;
        }

        try {
          const attendanceId = await Attendance.markAttendance(studentId, courseId, userId, date, status, notes);
          results.push({ studentId, success: true, attendanceId });
        } catch (error) {
          results.push({ studentId, success: false, message: error.message });
        }
      }

      res.json({ message: 'Attendance marked', results });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Enter grades for students in a course
  static async enterGrades(req, res) {
    try {
      const userId = req.user.id;
      const teacher = await User.findById(userId);
      if (!teacher) {
        return res.status(404).json({ message: 'Teacher not found' });
      }

      const { courseId, gradesData } = req.body;

      // Validation
      if (!courseId || !Number.isInteger(courseId) || courseId <= 0) {
        return res.status(400).json({ message: 'Invalid course ID' });
      }

      if (!Array.isArray(gradesData)) {
        return res.status(400).json({ message: 'Grades data must be an array' });
      }

      // Verify teacher is assigned to this course
      const query = 'SELECT COUNT(*) as count FROM timetables WHERE course_id = ? AND teacher_id = ?';
      const [rows] = await pool.execute(query, [courseId, userId]);
      if (rows[0].count === 0) {
        return res.status(403).json({ message: 'Not authorized to enter grades for this course' });
      }

      const results = [];
      for (const record of gradesData) {
        const { studentId, grade, semester, year, comments } = record;

        if (!studentId || !Number.isInteger(studentId) || studentId <= 0) {
          results.push({ studentId, success: false, message: 'Invalid student ID' });
          continue;
        }

        if (!grade || typeof grade !== 'string' || grade.trim().length === 0) {
          results.push({ studentId, success: false, message: 'Invalid grade' });
          continue;
        }

        if (!semester || typeof semester !== 'string' || semester.trim().length === 0) {
          results.push({ studentId, success: false, message: 'Invalid semester' });
          continue;
        }

        if (!year || !Number.isInteger(year) || year < 2000 || year > 2100) {
          results.push({ studentId, success: false, message: 'Invalid year' });
          continue;
        }

        try {
          const gradeId = await Grade.assignGrade(studentId, courseId, userId, { grade, semester, year, comments });
          results.push({ studentId, success: true, gradeId });
        } catch (error) {
          results.push({ studentId, success: false, message: error.message });
        }
      }

      res.json({ message: 'Grades entered', results });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Get timetable for the teacher
  static async getTimetable(req, res) {
    try {
      const userId = req.user.id;
      const teacher = await User.findById(userId);
      if (!teacher) {
        return res.status(404).json({ message: 'Teacher not found' });
      }

      const { semester } = req.query;

      // Validation
      if (semester && (typeof semester !== 'string' || semester.trim().length === 0)) {
        return res.status(400).json({ message: 'Invalid semester' });
      }

      const timetable = await Timetable.getTimetableByTeacher(userId, semester);
      res.json(timetable);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Get students in classes assigned to the teacher
  static async getClassStudents(req, res) {
    try {
      const userId = req.user.id;
      const teacher = await User.findById(userId);
      if (!teacher) {
        return res.status(404).json({ message: 'Teacher not found' });
      }

      const { courseId } = req.params;

      // Validation
      if (courseId && (!Number.isInteger(parseInt(courseId)) || parseInt(courseId) <= 0)) {
        return res.status(400).json({ message: 'Invalid course ID' });
      }

      let query;
      let params;

      if (courseId) {
        // Verify teacher is assigned to this course
        const verifyQuery = 'SELECT COUNT(*) as count FROM timetables WHERE course_id = ? AND teacher_id = ?';
        const [verifyRows] = await pool.execute(verifyQuery, [courseId, userId]);
        if (verifyRows[0].count === 0) {
          return res.status(403).json({ message: 'Not authorized to view students for this course' });
        }

        query = `
          SELECT DISTINCT s.*, u.first_name, u.last_name, u.email, c.name as course_name
          FROM students s
          JOIN users u ON s.user_id = u.id
          JOIN student_courses sc ON s.id = sc.student_id
          JOIN courses c ON sc.course_id = c.id
          WHERE sc.course_id = ?
          ORDER BY u.last_name, u.first_name
        `;
        params = [courseId];
      } else {
        // Get all students from all courses assigned to the teacher
        query = `
          SELECT DISTINCT s.*, u.first_name, u.last_name, u.email, c.name as course_name
          FROM students s
          JOIN users u ON s.user_id = u.id
          JOIN student_courses sc ON s.id = sc.student_id
          JOIN courses c ON sc.course_id = c.id
          JOIN timetables t ON c.id = t.course_id
          WHERE t.teacher_id = ?
          ORDER BY c.name, u.last_name, u.first_name
        `;
        params = [userId];
      }

      const [rows] = await pool.execute(query, params);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Upload resource (placeholder for file upload functionality)
  static async uploadResource(req, res) {
    try {
      // This would require multer for file uploads
      // For now, return a placeholder response
      res.json({ message: 'Resource upload functionality to be implemented' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

export default TeacherController;
