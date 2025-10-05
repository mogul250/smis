import Student from '../models/student.js';
import Attendance from '../models/attendance.js';
import Grade from '../models/grade.js';
import Fee from '../models/fee.js';
import Timetable from '../models/timetable.js';

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

      // Validation
      const allowedFields = [
        'email', 'first_name', 'last_name', 'date_of_birth', 'gender', 'address',
        'phone', 'department_id', 'enrollment_year', 'current_year', 'enrollment_date',
        'graduation_date', 'status'
      ];
      const invalidFields = Object.keys(updateData).filter(field => !allowedFields.includes(field));
      if (invalidFields.length > 0) {
        return res.status(400).json({ message: `Invalid fields: ${invalidFields.join(', ')}` });
      }

      if (updateData.enrollment_date && isNaN(Date.parse(updateData.enrollment_date))) {
        return res.status(400).json({ message: 'Invalid enrollment date' });
      }

      if (updateData.graduation_date && isNaN(Date.parse(updateData.graduation_date))) {
        return res.status(400).json({ message: 'Invalid graduation date' });
      }

      if (updateData.department_id && (!Number.isInteger(updateData.department_id) || updateData.department_id <= 0)) {
        return res.status(400).json({ message: 'Invalid department ID' });
      }

      if (updateData.enrollment_year && (!Number.isInteger(updateData.enrollment_year) || updateData.enrollment_year < 1900)) {
        return res.status(400).json({ message: 'Invalid enrollment year' });
      }

      if (updateData.current_year !== undefined && (!Number.isInteger(updateData.current_year) || updateData.current_year < 1)) {
        return res.status(400).json({ message: 'Invalid current year' });
      }


      if (updateData.status && !['active', 'inactive', 'graduated', 'suspended'].includes(updateData.status)) {
        return res.status(400).json({ message: 'Invalid status' });
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

  // Get timetable for the student
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

      const timetable = await Timetable.getTimetableByStudent(studentId, semester);
      res.json(timetable);
    } catch (error) {
      console.error('Error in getTimetable:', error);
      res.status(500).json({ message: 'internal server error' });
    }
  }
}

export default StudentController;
