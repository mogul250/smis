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

      // Create user in users table. Pass raw password; User.create will hash internally.
      const userData = {
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        role,
        department_id: departmentId || null
      };

      const userId = await User.create(userData);

      // For teacher role, user record is sufficient (teachers are stored in users with role='teacher')
      if (role === 'student') {
        if (!departmentId) {
          return res.status(400).json({ message: 'Department ID required for students' });
        }
        // Create a student record in students table
        await Student.create({
          email,
          password,
          first_name: firstName,
          last_name: lastName,
          department_id: departmentId,
          enrollment_year: additionalData?.enrollmentYear || new Date().getFullYear(),
          enrollment_date: additionalData?.enrollmentDate || null,
          status: 'active'
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

      // Base query against users table with optional department join
      let query = `
        SELECT u.id, u.first_name, u.last_name, u.email, u.role, u.created_at, d.name as department_name
        FROM users u
        LEFT JOIN departments d ON u.department_id = d.id
        WHERE 1=1
      `;
      const params = [];

      if (role) {
        query += ' AND u.role = ?';
        params.push(role);
      }

      if (departmentId) {
        query += ' AND u.department_id = ?';
        params.push(departmentId);
      }

      if (search) {
        query += ' AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      // Use inline LIMIT/OFFSET to avoid parameter binding issues
      const lim = Math.max(1, parseInt(limit) || 10);
      const off = Math.max(0, (parseInt(page) - 1) * lim);
      query += ` ORDER BY u.created_at DESC LIMIT ${lim} OFFSET ${off}`;

      const [rows] = await pool.execute(query, params);

      // Total count for pagination
      let countQuery = `
        SELECT COUNT(*) as total
        FROM users u
        WHERE 1=1
      `;
      const countParams = [];
      if (role) {
        countQuery += ' AND u.role = ?';
        countParams.push(role);
      }
      if (departmentId) {
        countQuery += ' AND u.department_id = ?';
        countParams.push(departmentId);
      }
      if (search) {
        countQuery += ' AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)';
        countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      const [countRows] = await pool.execute(countQuery, countParams);
      const total = countRows[0]?.total || 0;

      res.json({
        users: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit) || 1)
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
      const { eventName, eventDate, eventType, description } = req.body;

      // Validate required fields
      if (!eventName || !eventDate || !eventType) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const eventData = {
        event_name: eventName,
        event_date: eventDate,
        event_type: eventType,
        description: description || null
      };

      const eventId = await AcademicCalendar.create(eventData);
      res.status(201).json({ message: 'Calendar event added successfully', eventId });
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

      // Total users
      const [totalUsers] = await pool.execute(`
        SELECT COUNT(*) as totalUsers FROM users
      `);
      stats.totalUsers = totalUsers[0].totalUsers;

      // Total students
      const [totalStudents] = await pool.execute(`
        SELECT COUNT(*) as totalStudents FROM students
      `);
      stats.totalStudents = totalStudents[0].totalStudents;

      // Total teachers
      const [totalTeachers] = await pool.execute(`
        SELECT COUNT(*) as totalTeachers FROM users WHERE role = 'teacher'
      `);
      stats.totalTeachers = totalTeachers[0].totalTeachers;

      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

export default AdminController;
