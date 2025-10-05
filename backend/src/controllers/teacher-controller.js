import ClassModel from '../models/class.js';
import User from '../models/user.js';
import Teacher from '../models/teacher.js';
import Attendance from '../models/attendance.js';
import Grade from '../models/grade.js';
import Timetable from '../models/timetable.js';
import pool from '../config/database.js';
import Student from '../models/student.js';

class TeacherController {
  // Get students by classId
  static async getStudentsByClass(req, res) {
    try {
      const { classId } = req.params;
      if (!classId || isNaN(classId)) {
        return res.status(400).json({ message: 'Invalid class ID' });
      }
      // Check if class exists and is valid
      const cls = await ClassModel.findById(classId);
      if (!cls) {
        return res.status(404).json({ message: 'Class not found' });
      }
      const students = await Student.getByClass(classId);
      res.json(students);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
  // Edit a grade assigned by the teacher
  static async editGrade(req, res) {
    try {
      const teacherId = req.user.id;
      const { gradeId } = req.params;
      const updateData = req.body;

      // Find the grade and validate ownership
      const grade = await Grade.findById(gradeId);
      if (!grade) {
        return res.status(404).json({ message: 'Grade not found' });
      }
      // Only allow editing if teacher assigned this grade and teaches the course/class
      if (grade.teacher.id != teacherId) {
        return res.status(403).json({ message: 'Not authorized to edit this grade' });
      }
      // Validate teacher is assigned to this course/class in timetable
      const timetableSlots = await Timetable.getTimetableByTeacher(teacherId);
      const teachesThis = timetableSlots.some(slot =>
        slot.class_id == grade.class.id && slot.course_id == grade.course.id
      );
      if (!teachesThis) {
        return res.status(403).json({ message: 'Not authorized to edit grades for this class/course' });
      }
      // Only allow updating allowed fields
      const allowedFields = ['grade', 'comments', 'score','max_score' ];
      const invalidFields = Object.keys(updateData).filter(field => !allowedFields.includes(field));
      if (invalidFields.length > 0) {
        return res.status(400).json({ message: `Invalid fields: ${invalidFields.join(', ')}` });
      }
      const success = await Grade.update(gradeId, updateData);
      if (success) {
        res.json({ message: 'Grade updated successfully' });
      } else {
        res.status(500).json({ message: 'Failed to update grade' });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Delete a grade assigned by the teacher
  static async deleteGrade(req, res) {
    try {
      const teacherId = req.user.id;
      const { gradeId } = req.params;
      // Find the grade and validate ownership
      const grade = await Grade.findById(gradeId);
      if (!grade) {
        return res.status(404).json({ message: 'Grade not found' });
      }
      // Only allow deleting if teacher assigned this grade and teaches the course/class
      if (grade.teacher.id != teacherId) {
        return res.status(403).json({ message: 'Not authorized to delete this grade' });
      }
      // Validate teacher is assigned to this course/class in timetable
      const timetableSlots = await Timetable.getTimetableByTeacher(teacherId);
      const teachesThis = timetableSlots.some(slot =>
        slot.class_id == grade.class.id && slot.course.id == grade.course.id
      );
      if (!teachesThis) {
        return res.status(403).json({ message: 'Not authorized to delete grades for this class/course' });
      }
      // Delete the grade
      const query = 'DELETE FROM grades WHERE id = ?';
      const [result] = await pool.execute(query, [gradeId]);
      if (result.affectedRows > 0) {
        res.json({ message: 'Grade deleted successfully' });
      } else {
        res.status(500).json({ message: 'Failed to delete grade' });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
  // Get teacher profile by user ID
  static async getProfile(req, res) {
    try {
      const userId = req.user.id;
      const teacher = await Teacher.findById(userId);
      if (!teacher) {
        return res.status(404).json({ message: 'Teacher not found' });
      }
      res.json(teacher);
    } catch (error) {
      console.error('Error in getProfile:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
    // Get grades for a class and course taught by teacher
  static async getClassCourseGrades(req, res) {
    try {
      const teacherId = req.user.id;
      const { classId, courseId } = req.params;
      // Validate class exists and contains the course
      const cls = await ClassModel.findById(classId);
      if (!cls) {
        return res.status(404).json({ message: 'Class not found' });
      }
      const classCourses = await ClassModel.getCourses(classId);
      const courseExists = classCourses.some(c => c.id == courseId);
      if (!courseExists) {
        return res.status(404).json({ message: 'Course not found in class' });
      }

      // Strict validation: check if teacher is assigned to this class/course in timetable
      const timetableSlots = await Timetable.getTimetableByTeacher(teacherId);
      const teachesThis = timetableSlots.some(slot =>
        slot.class_id == classId && slot.course_id == courseId
      );
      if (!teachesThis) {
        return res.status(403).json({ message: 'Not authorized to view grades for this class/course' });
      }

      // Get grades for this class, course, and teacher
      const grades = await Grade.getGradesByCourse(courseId);
      // Filter grades to only those for students in this class and by this teacher
      const studentIds = Array.isArray(cls.students) ? cls.students : JSON.parse(cls.students);
      const filtered = grades.filter(g => studentIds.includes(g.student_id) && g.teacher.id == teacherId);
      res.json(filtered);
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
      console.error('Error in updateProfile:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Get classes assigned to  teacher.
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
        JOIN timetable t ON c.id = t.course_id
        JOIN users u ON t.teacher_id = u.id
        JOIN departments d ON u.department_id = d.id
        WHERE t.teacher_id = ?
        ORDER BY c.name
      `;

      const [rows] = await pool.execute(query, [userId]);
      res.json(rows);
    } catch (error) {
      console.error('Error in getClasses:', error);
      res.status(500).json({ message: 'Internal server error' });
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

      const { courseId, attendance, date } = req.body;

      // Validation
      if (!courseId || !Number.isInteger(courseId) || courseId <= 0) {
        return res.status(400).json({ message: 'Invalid course ID' });
      }

      if (!Array.isArray(attendance)) {
        return res.status(400).json({ message: 'Attendance data must be an array' });
      }

      if (!date || isNaN(Date.parse(date))) {
        return res.status(400).json({ message: 'Invalid date' });
      }

      // Verify teacher is assigned to this course
      const query = 'SELECT COUNT(*) as count FROM timetable WHERE course_id = ? AND teacher_id = ?';
      const [rows] = await pool.execute(query, [courseId, userId]);
      if (!rows || rows.length === 0 || rows[0].count === 0) {
        return res.status(403).json({ message: 'Not authorized to mark attendance for this course' });
      }

      const results = [];
      for (const record of attendance) {
        const { studentId, status, notes } = record;

        if (!studentId || !Number.isInteger(studentId) || studentId <= 0) {
          results.push({ studentId, success: false, message: 'Invalid student ID' });
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

      res.json({ message: 'Attendance marked successfully', results });
    } catch (error) {
      console.error('Error in markAttendance:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
  // Mark special attendance
  static async markSpecialAttendance(req, res) {
    try {
      const userId = req.user.id;
      const teacher = await User.findById(userId);
      if (!teacher) {
        return res.status(404).json({ message: 'Teacher not found' });
      }

      let { student } = req.body;
      if (!student) {
        student = req.student
      }
      const isStuAvai = await Student.findById(student)
      if(!isStuAvai) return res.status(404).json({message: "student not found"})
      let inserted = await Attendance.recordMagicAttendance(student)
      if (!inserted.success) {
        return res.status(inserted.status).json({message: inserted.message})
      }
      res.status(200).json(inserted);
    } catch (error) {
      console.error('Error in markAttendance:', error);
      res.status(500).json({ message: 'Internal server error' });
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

      const { courseId, grades } = req.body;

      // Validation
      if (!courseId || !Number.isInteger(courseId) || courseId <= 0) {
        return res.status(400).json({ message: 'Invalid course ID' });
      }

      if (!Array.isArray(grades)) {
        return res.status(400).json({ message: 'Grades data must be an array' });
      }

      // Verify teacher is assigned to this course
      const query = 'SELECT COUNT(*) as count FROM timetable WHERE course_id = ? AND teacher_id = ?';
      const [rows] = await pool.execute(query, [courseId, userId]);
      if (rows[0].count === 0) {
        return res.status(403).json({ message: 'Not authorized to enter grades for this course' });
      }

      const results = [];
      for (const record of grades) {
        const { student, grade, semester, date, comments,max_score,type,score } = record;

        if (!student || !Number.isInteger(student) || student <= 0) {
          return res.status(400).json({ student, success: false, message: 'Invalid student ID' });
          
        }else{
          let isAvai = Student.findById(student)
          if(!isAvai) return res.status(404).json({ student, success: false, message: 'Student not found' })
        }

        if (!grade || typeof grade !== 'string' || grade.trim().length === 0) {
          return res.status(400).json({ student, success: false, message: 'Invalid grade' });
          
        }

        if (!semester || typeof semester !== 'string' || semester.trim().length === 0) {
          return res.status(400).json({ student, success: false, message: 'Invalid semester' });
          
        }

        try {
          const gradeId = await Grade.assignGrade(student, courseId, userId, { grade, semester, date, comments,max_score,type,score });
          results.push({ student, success: true, gradeId });
        } catch (error) {
          results.push({ student, success: false, message: error.message });
        }
      }

      res.json({ message: 'Grades entered successfully', results });
    } catch (error) {
      console.error('Error in enterGrades:', error);
      res.status(500).json({ message: 'Internal server error' });
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

      const { semester } = req.params;

      // Validation
      if (semester && (typeof semester !== 'string' || semester.trim().length === 0)) {
        return res.status(400).json({ message: 'Invalid semester' });
      }

      const timetable = await Timetable.getTimetableByTeacher(userId, semester);
      res.json(timetable);
    } catch (error) {
      console.error('Error in getTimetable:', error);
      res.status(500).json({ message: 'Internal server error' });
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
        const verifyQuery = 'SELECT COUNT(*) as count FROM timetable WHERE course_id = ? AND teacher_id = ?';
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
          JOIN timetable t ON c.id = t.course_id
          WHERE t.teacher_id = ?
          ORDER BY c.name, u.last_name, u.first_name
        `;
        params = [userId];
      }

      const [rows] = await pool.execute(query, params);
      res.json(rows);
    } catch (error) {
      console.error('Error in getClassStudents:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Upload resource (placeholder for file upload functionality)
  static async uploadResource(req, res) {
    try {
      // This would require multer for file uploads
      // For now, return a placeholder response
      res.json({ message: 'Resource upload functionality to be implemented' });
    } catch (error) {
      console.error('Error in uploadResource:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}

export default TeacherController;
