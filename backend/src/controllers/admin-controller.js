import User from '../models/user.js';
import Student from '../models/student.js';
import Teacher from '../models/teacher.js';
import Department from '../models/department.js';
import Course from '../models/course.js';
import Attendance from '../models/attendance.js';
import Grade from '../models/grade.js';
import Fee from '../models/fee.js';
import Timetable from '../models/timetable.js';
import AcademicCalendar from '../models/academic-calendar.js';
import pool from '../config/database.js';
import bcrypt from 'bcryptjs';

class AdminController {
  // Create new user (student, teacher, etc.)
  static async createUser(req, res) {
    try {
      const { firstName, lastName, email, password, role, departmentId, additionalData } = req.body;

      // Validate required fields
      if (!firstName || !lastName || !email || !password || !role) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: 'User with this email already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const userData = {
        first_name: firstName,
        last_name: lastName,
        email,
        password: hashedPassword,
        role
      };

      const userId = await User.create(userData);

      // Create role-specific record
      if (role === 'student') {
        if (!departmentId) {
          return res.status(400).json({ message: 'Department ID required for students' });
        }
        await Student.create({
          user_id: userId,
          department_id: departmentId,
          enrollment_date: additionalData?.enrollmentDate || new Date().toISOString().split('T')[0]
        });
      } else if (role === 'teacher') {
        if (!departmentId) {
          return res.status(400).json({ message: 'Department ID required for teachers' });
        }
        await Teacher.create({
          user_id: userId,
          department_id: departmentId,
          hire_date: additionalData?.hireDate || new Date().toISOString().split('T')[0],
          subjects: additionalData?.subjects || ''
        });
      }

      res.status(201).json({ message: 'User created successfully', userId });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Get all users with filtering and pagination
  static async getAllUsers(req, res) {
    try {
      const { role, departmentId, page = 1, limit = 10, search } = req.query;

      let query = `
        SELECT u.id, u.first_name, u.last_name, u.email, u.role, u.created_at,
               d.name as department_name
        FROM users u
        LEFT JOIN students s ON u.id = s.user_id
        LEFT JOIN teachers t ON u.id = t.user_id
        LEFT JOIN departments d ON (s.department_id = d.id OR t.department_id = d.id)
        WHERE 1=1
      `;
      const params = [];

      if (role) {
        query += ' AND u.role = ?';
        params.push(role);
      }

      if (departmentId) {
        query += ' AND (s.department_id = ? OR t.department_id = ?)';
        params.push(departmentId, departmentId);
      }

      if (search) {
        query += ' AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      query += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

      const [rows] = await pool.execute(query, params);

      // Get total count
      let countQuery = `
        SELECT COUNT(*) as total
        FROM users u
        LEFT JOIN students s ON u.id = s.user_id
        LEFT JOIN teachers t ON u.id = t.user_id
        WHERE 1=1
      `;
      const countParams = [];

      if (role) {
        countQuery += ' AND u.role = ?';
        countParams.push(role);
      }

      if (departmentId) {
        countQuery += ' AND (s.department_id = ? OR t.department_id = ?)';
        countParams.push(departmentId, departmentId);
      }

      if (search) {
        countQuery += ' AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)';
        countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      const [countRows] = await pool.execute(countQuery, countParams);
      const total = countRows[0].total;

      res.json({
        users: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Update user information and roles
  static async updateUser(req, res) {
    try {
      const { userId } = req.params;
      const { firstName, lastName, email, role, departmentId, additionalData } = req.body;

      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Update user data
      const updateData = {};
      if (firstName) updateData.first_name = firstName;
      if (lastName) updateData.last_name = lastName;
      if (email) updateData.email = email;
      if (role) updateData.role = role;

      await User.update(userId, updateData);

      // Update role-specific data
      if (role === 'student' && departmentId) {
        const student = await Student.findByUserId(userId);
        if (student) {
          await Student.update(student.id, { department_id: departmentId });
        }
      } else if (role === 'teacher' && departmentId) {
        const teacher = await Teacher.findByUserId(userId);
        if (teacher) {
          await Teacher.update(teacher.id, { department_id: departmentId });
        }
      }

      res.json({ message: 'User updated successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Delete/Deactivate user
  static async deleteUser(req, res) {
    try {
      const { userId } = req.params;

      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Soft delete by setting deleted_at or hard delete
      // For now, hard delete (adjust as needed)
      await User.delete(userId);

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Manage academic calendar
  static async manageAcademicCalendar(req, res) {
    try {
      const { action, eventData } = req.body;

      if (action === 'add') {
        const eventId = await AcademicCalendar.addEvent(eventData);
        res.status(201).json({ message: 'Event added successfully', eventId });
      } else if (action === 'update') {
        const success = await AcademicCalendar.update(eventData.id, eventData);
        if (!success) {
          return res.status(404).json({ message: 'Event not found' });
        }
        res.json({ message: 'Event updated successfully' });
      } else if (action === 'delete') {
        const success = await AcademicCalendar.delete(eventData.id);
        if (!success) {
          return res.status(404).json({ message: 'Event not found' });
        }
        res.json({ message: 'Event deleted successfully' });
      } else {
        res.status(400).json({ message: 'Invalid action' });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Setup timetable
  static async setupTimetable(req, res) {
    try {
      const { action, timetableData } = req.body;

      if (action === 'add') {
        const slotId = await Timetable.createSlot(timetableData);
        res.status(201).json({ message: 'Timetable slot added successfully', slotId });
      } else if (action === 'update') {
        const success = await Timetable.update(timetableData.id, timetableData);
        if (!success) {
          return res.status(404).json({ message: 'Timetable slot not found' });
        }
        res.json({ message: 'Timetable slot updated successfully' });
      } else if (action === 'delete') {
        const success = await Timetable.delete(timetableData.id);
        if (!success) {
          return res.status(404).json({ message: 'Timetable slot not found' });
        }
        res.json({ message: 'Timetable slot deleted successfully' });
      } else {
        res.status(400).json({ message: 'Invalid action' });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Get system statistics
  static async getSystemStats(req, res) {
    try {
      const stats = {};

      // User counts by role
      const [userStats] = await pool.execute(`
        SELECT role, COUNT(*) as count
        FROM users
        GROUP BY role
      `);
      stats.users = userStats;

      // Department stats
      const [deptStats] = await pool.execute(`
        SELECT d.name, COUNT(s.id) as students, COUNT(t.id) as teachers
        FROM departments d
        LEFT JOIN students s ON d.id = s.department_id
        LEFT JOIN teachers t ON d.id = t.department_id
        GROUP BY d.id, d.name
      `);
      stats.departments = deptStats;

      // Course stats
      const [courseStats] = await pool.execute(`
        SELECT COUNT(*) as total_courses,
               AVG(credits) as avg_credits
        FROM courses
      `);
      stats.courses = courseStats[0];

      // Attendance stats (last 30 days)
      const [attendanceStats] = await pool.execute(`
        SELECT
          COUNT(*) as total_records,
          SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count,
          ROUND((SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as attendance_percentage
        FROM attendance
        WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      `);
      stats.attendance = attendanceStats[0];

      // Financial stats
      const [financialStats] = await pool.execute(`
        SELECT
          SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_collected,
          SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as total_outstanding
        FROM fees
      `);
      stats.finances = financialStats[0];

      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

export default AdminController;
