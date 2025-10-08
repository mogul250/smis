import Student from '../models/student.js';
import Attendance from '../models/attendance.js';
import Grade from '../models/grade.js';
import Fee from '../models/fee.js';
import Timetable from '../models/timetable.js';
import pool from '../config/database.js';

class StudentController {
  // Get student profile by user ID
  static async getProfile(req, res) {
    try {
      const studentId = req.user.id;
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
      res.json({
        id: student.id,
        user: {
          email: student.email,
          first_name: student.first_name,
          last_name: student.last_name
        },
        phone: student.phone,
        address: student.address,
        date_of_birth: student.date_of_birth,
        gender: student.gender,
        department_id: student.department_id,
        department_name: student.department_name,
        student_id: student.student_id,
        enrollment_year: student.enrollment_year,
        current_year: student.current_year,
        enrollment_date: student.enrollment_date,
        graduation_date: student.graduation_date,
        status: student.status
      });
    } catch (error) {
      console.error('Error in getProfile:', error);
      res.status(500).json({ message: 'internal server error' });
    }
  }

  // Update student profile
  static async updateProfile(req, res) {
    try {
      const studentId = req.user.id;
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
      const updateData = req.body;

      // Validation - students cannot change department_id, enrollment info, or status
      const allowedFields = [
        'email', 'first_name', 'last_name', 'date_of_birth', 'gender', 'address', 'phone'
      ];
      const invalidFields = Object.keys(updateData).filter(field => !allowedFields.includes(field));
      if (invalidFields.length > 0) {
        return res.status(400).json({ message: `Invalid fields: ${invalidFields.join(', ')}` });
      }

      // Basic validation for allowed fields
      if (updateData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updateData.email)) {
        return res.status(400).json({ message: 'Invalid email format' });
      }

      if (updateData.date_of_birth && isNaN(Date.parse(updateData.date_of_birth))) {
        return res.status(400).json({ message: 'Invalid date of birth' });
      }

      if (updateData.gender && !['male', 'female', 'other'].includes(updateData.gender)) {
        return res.status(400).json({ message: 'Invalid gender' });
      }

      await Student.update(studentId, updateData);
      res.json({ message: 'Profile updated successfully' });
    } catch (error) {
      console.error('Error in updateProfile:', error);
      res.status(500).json({ message: 'internal server error' });
    }
  }

  // Get attendance records for the student
  static async getAttendance(req, res) {
    try {
      console.log('=== Student Attendance Request ===');
      console.log('User from token:', req.user);
      console.log('Query params:', req.query);
      
      const studentId = req.user.id;
      console.log('Looking for student with ID:', studentId);
      
      const student = await Student.findById(studentId);
      console.log('Student found:', student ? 'Yes' : 'No');
      
      if (!student) {
        console.log('Student not found, returning 404');
        return res.status(404).json({ message: 'Student not found' });
      }
      
      const { startDate, endDate } = req.query;
      console.log('Date range:', { startDate, endDate });

      // Validation
      if (startDate && isNaN(Date.parse(startDate))) {
        console.log('Invalid start date');
        return res.status(400).json({ message: 'Invalid start date' });
      }
      if (endDate && isNaN(Date.parse(endDate))) {
        console.log('Invalid end date');
        return res.status(400).json({ message: 'Invalid end date' });
      }
      if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        console.log('Start date after end date');
        return res.status(400).json({ message: 'Start date cannot be after end date' });
      }

      console.log('Calling Attendance.getAttendanceByStudent...');
      const attendanceRecords = await Attendance.getAttendanceByStudent(studentId, startDate, endDate);
      console.log('Attendance records retrieved:', attendanceRecords);
      
      res.json(attendanceRecords);
    } catch (error) {
      console.error('Error in getAttendance:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ message: 'internal server error' });
    }
  }

  // Get grades for the student
  static async getGrades(req, res) {
    try {
      const studentId = req.user.id; // This is the student record ID from JWT
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
      const grades = await Grade.getGradesByStudent(studentId);
      const gpa = await Grade.calculateGPA(studentId);
      res.json({ grades, gpa });
    } catch (error) {
      console.error('Error in getGrades:', error);
      res.status(500).json({ message: 'internal server error' });
    }
  }

  // Get fees for the student
  static async getFees(req, res) {
    try {
      const studentId = req.user.id;
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
      const fees = await Fee.getFeesByStudent(studentId);
      const totalOutstanding = await Fee.getTotalOutstanding(studentId);
      res.json({ fees, totalOutstanding });
    } catch (error) {
      console.error('Error in getFees:', error);
      res.status(500).json({ message: 'internal server error' });
    }
  }

  // Get timetable for the student (filtered by enrolled courses only)
  static async getTimetable(req, res) {
    try {
      const studentId = req.user.id;
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
      const { semester } = req.query;

      // Validation
      if (semester && (typeof semester !== 'string' || semester.trim().length === 0)) {
        return res.status(400).json({ message: 'Invalid semester' });
      }

      // Get timetable only for courses the student is enrolled in
      const timetable = await Timetable.getTimetableByStudent(studentId, semester);
      res.json(timetable);
    } catch (error) {
      console.error('Error in getTimetable:', error);
      res.status(500).json({ message: 'internal server error' });
    }
  }

  // Get student's department information
  static async getDepartment(req, res) {
    try {
      const studentId = req.user.id;
      console.log('🔍 Getting department info for student:', studentId);

      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      if (!student.department_id) {
        return res.status(400).json({ message: 'Student is not assigned to any department' });
      }

      // Get detailed department information
      const [deptRows] = await pool.execute(
        `SELECT d.id, d.code, d.name, d.created_at,
                u.first_name as hod_first_name, u.last_name as hod_last_name, u.email as hod_email
         FROM departments d
         LEFT JOIN users u ON d.head_id = u.id
         WHERE d.id = ?`,
        [student.department_id]
      );

      if (deptRows.length === 0) {
        return res.status(404).json({ message: 'Department not found' });
      }

      const department = deptRows[0];
      const response = {
        id: department.id,
        code: department.code,
        name: department.name,
        created_at: department.created_at,
        hod: department.hod_first_name ? {
          name: `${department.hod_first_name} ${department.hod_last_name}`,
          email: department.hod_email
        } : null
      };

      console.log('✅ Department info retrieved:', response);
      res.json(response);
    } catch (error) {
      console.error('Error in getDepartment:', error);
      res.status(500).json({ message: 'internal server error' });
    }
  }

  // Get courses available in student's department
  static async getDepartmentCourses(req, res) {
    try {
      const studentId = req.user.id;
      console.log('🔍 Getting department courses for student:', studentId);

      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      if (!student.department_id) {
        return res.status(400).json({ message: 'Student is not assigned to any department' });
      }

      // Get courses from student's department only
      const [courseRows] = await pool.execute(
        `SELECT c.id, c.course_code, c.name, c.credits, c.semester, c.description,
                ce.enrollment_date, ce.grade, ce.status as enrollment_status
         FROM courses c
         INNER JOIN department_courses dc ON c.id = dc.course_id
         LEFT JOIN course_enrollments ce ON c.id = ce.course_id AND ce.student_id = ?
         WHERE dc.department_id = ?
         ORDER BY c.course_code`,
        [studentId, student.department_id]
      );

      const courses = courseRows.map(course => ({
        id: course.id,
        code: course.course_code,
        name: course.name,
        credits: course.credits,
        semester: course.semester,
        description: course.description,
        isEnrolled: !!course.enrollment_date,
        enrollment: course.enrollment_date ? {
          date: course.enrollment_date,
          grade: course.grade,
          status: course.enrollment_status
        } : null
      }));

      console.log(`✅ Found ${courses.length} courses for department ${student.department_id}`);
      res.json(courses);
    } catch (error) {
      console.error('Error in getDepartmentCourses:', error);
      res.status(500).json({ message: 'internal server error' });
    }
  }
}

export default StudentController;
