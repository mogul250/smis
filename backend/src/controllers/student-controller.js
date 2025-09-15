import Student from '../models/student.js';
import Attendance from '../models/attendance.js';
import Grade from '../models/grade.js';
import Fee from '../models/fee.js';
import Timetable from '../models/timetable.js';

class StudentController {
  // Get student profile by user ID
  static async getProfile(req, res) {
    try {
      const userId = req.user.id;
      const student = await Student.findByUserId(userId);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
      res.json(student);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Update student profile
  static async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const student = await Student.findByUserId(userId);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
      const updateData = req.body;

      // Validation
      const allowedFields = ['enrollment_date', 'department_id'];
      const invalidFields = Object.keys(updateData).filter(field => !allowedFields.includes(field));
      if (invalidFields.length > 0) {
        return res.status(400).json({ message: `Invalid fields: ${invalidFields.join(', ')}` });
      }

      if (updateData.enrollment_date && isNaN(Date.parse(updateData.enrollment_date))) {
        return res.status(400).json({ message: 'Invalid enrollment date' });
      }

      if (updateData.department_id && (!Number.isInteger(updateData.department_id) || updateData.department_id <= 0)) {
        return res.status(400).json({ message: 'Invalid department ID' });
      }

      const success = await Student.update(student.id, updateData);
      if (success) {
        res.json({ message: 'Profile updated successfully' });
      } else {
        res.status(400).json({ message: 'Failed to update profile' });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Get attendance records for the student
  static async getAttendance(req, res) {
    try {
      const userId = req.user.id;
      const student = await Student.findByUserId(userId);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
      const { startDate, endDate } = req.query;

      // Validation
      if (startDate && isNaN(Date.parse(startDate))) {
        return res.status(400).json({ message: 'Invalid start date' });
      }
      if (endDate && isNaN(Date.parse(endDate))) {
        return res.status(400).json({ message: 'Invalid end date' });
      }
      if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        return res.status(400).json({ message: 'Start date cannot be after end date' });
      }

      const attendanceRecords = await Attendance.getAttendanceByStudent(student.id, startDate, endDate);
      res.json(attendanceRecords);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Get grades for the student
  static async getGrades(req, res) {
    try {
      const userId = req.user.id;
      const student = await Student.findByUserId(userId);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
      const grades = await Grade.getGradesByStudent(student.id);
      const gpa = await Grade.calculateGPA(student.id);
      res.json({ grades, gpa });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Get fees for the student
  static async getFees(req, res) {
    try {
      const userId = req.user.id;
      const student = await Student.findByUserId(userId);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
      const fees = await Fee.getFeesByStudent(student.id);
      const totalOutstanding = await Fee.getTotalOutstanding(student.id);
      res.json({ fees, totalOutstanding });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Get timetable for the student
  static async getTimetable(req, res) {
    try {
      const userId = req.user.id;
      const student = await Student.findByUserId(userId);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
      const { semester } = req.query;

      // Validation
      if (semester && (typeof semester !== 'string' || semester.trim().length === 0)) {
        return res.status(400).json({ message: 'Invalid semester' });
      }

      const timetable = await Timetable.getTimetableByStudent(student.id, semester);
      res.json(timetable);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

export default StudentController;
