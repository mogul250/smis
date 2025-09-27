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
import { now } from '../utils/helpers.js';

class AdminController {
  // Get all departments with pagination
  static async getAllDepartments(req, res) {
    try {
      const limit = parseInt(req.params.limit) || 10;
      const offset = parseInt(req.params.offset) || 0;
      const departments = await Department.getAll(limit, offset);
      res.json(departments);
    } catch (error) {
      console.log(error)
      res.status(500).json({ message: "internal server error" });
    }
  }
  // Create new user (student, teacher, etc.)
  static async createUser(req, res) {
    try {
      const { firstName, lastName, email, password, role, departmentId, additionalData } = req.body;
      let userId
      // Validate required fields
      if (!firstName || !lastName || !email || !password || !role) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Check if user already exists
      if(role != 'student'){
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
          return res.status(409).json({ message: 'User with this email already exists' });
        }
      }else{
        const existingUser = await Student.findByEmail(email);
        if (existingUser) {
          return res.status(409).json({ message: 'Student with this email already exists' });
        }
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
      if (role != 'student') {
        userId = await User.create(userData);
      }

      // For teacher role, user record is sufficient (teachers are stored in users with role='teacher')
      if (role === 'student') {
        if (!departmentId) {
          return res.status(400).json({ message: 'Department ID required for students' });
        }
        const {date_of_birth,gender,address,phone,student_id} = req.body
        // Create a student record in students table
        userId = await Student.create({
          email,
          password,
          first_name: firstName,
          last_name: lastName,
          department_id: departmentId,
          enrollment_year: additionalData?.enrollmentYear || new Date().getFullYear(),
          enrollment_date: additionalData?.enrollmentDate || now('yyyy-MM-dd'),
          status: 'active',
          date_of_birth,
          gender,
          address,
          phone,
          student_id
        });
      }

      res.status(201).json({ message: `${role == 'student' ? 'Student' : 'User'} created successfully`, userId });
    } catch (error) {
      console.log(error)
      res.status(500).json({ message: error.message });
    }
  }

  // Get all users with filtering and pagination
  static async getAllUsers(req, res) {
    try {
      const { role, departmentId, search } = req.query;
      const { page = 0, limit = 10 } = req.params;
      const lim = Math.max(1, parseInt(limit) || 10);
      const off = Math.max(0, (parseInt(page) - 1) * lim);

      let query, params = [];
      if (role === 'teacher') {
        // For teachers, join departments using JSON_CONTAINS and aggregate department info
        query = `
          SELECT u.id, u.first_name, u.last_name, u.email, u.role, u.created_at,
            JSON_ARRAYAGG(JSON_OBJECT('id', d.id, 'name', d.name, 'code', d.code)) AS departments
          FROM users u
          LEFT JOIN departments d ON JSON_CONTAINS(d.teachers, CAST(u.id AS JSON))
          WHERE u.role = 'teacher'
        `;
        if (departmentId) {
          query += ' AND JSON_CONTAINS(d.teachers, CAST(u.id AS JSON)) AND d.id = ?';
          params.push(departmentId);
        }
        if (search) {
          query += ' AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)';
          params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        query += ` GROUP BY u.id ORDER BY u.created_at DESC LIMIT ${lim} OFFSET ${off}`;
      } else {
        // For other roles, keep existing join
        query = `
          SELECT u.id, u.first_name, u.last_name, u.email, u.role, u.created_at, d.name as department_name
          FROM users u
          LEFT JOIN departments d ON u.department_id = d.id
          WHERE 1=1
        `;
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
        query += ` ORDER BY u.created_at DESC LIMIT ${lim} OFFSET ${off}`;
      }

      const [rows] = await pool.execute(query, params);

      // Total count for pagination
      let countQuery = `SELECT COUNT(*) as total FROM users u WHERE 1=1`;
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
    // In AdminController
  static async getAllStudents(req, res) {
    try {
      const limit = parseInt(req.params.limit) || 10;
      const offset = parseInt(req.params.offset) || 0;
      const students = await Student.getAll(limit, offset);
      res.json(students);
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
        // Validate for conflicts before creating
        const { course_id, teacher_id, day_of_week, start_time, end_time, semester, class_id } = timetableData;
        const conflictingIds = await Timetable.checkConflicts(course_id, teacher_id, day_of_week, start_time, end_time, semester);
        if (conflictingIds.length > 0) {
          return res.status(409).json({ message: 'Timetable conflict detected', conflictingSlotIds: conflictingIds });
        }
        const slotId = await Timetable.createSlot(timetableData);
        res.status(201).json({ message: 'Timetable slot added successfully', slotId });
      } else if (action === 'update') {
        const { id } = timetableData;
        // Fetch current slot
        const currentSlot = await Timetable.findById(id);
        if (!currentSlot) {
          return res.status(404).json({ message: 'Timetable slot not found' });
        }
        // Merge fields: new data overwrites current slot
        const merged = { ...currentSlot, ...timetableData };
        // Check for conflicts with merged data
        const conflictingIds = await Timetable.checkConflicts(
          merged.course_id, merged.teacher_id, merged.day_of_week, merged.start_time, merged.end_time, merged.semester, id
        );
        if (conflictingIds.length > 0) {
          return res.status(409).json({ message: 'Timetable conflict detected', conflictingSlotIds: conflictingIds });
        }
        // Update with only provided fields
        const success = await Timetable.update(id, timetableData);
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
      console.log(error)
      res.status(500).json({ message: 'internal server error' });
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

  // Create new department
  static async createDepartment(req, res) {
    try {
      const { name, code, description, head_id } = req.body;

      // Validate required fields
      if (!name || !code) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Check if head_id is a valid HOD
      if (head_id) {
        const user = await User.findById(head_id);
        if (!user || user.role !== 'hod') {
          return res.status(400).json({ message: 'Invalid HOD ID provided' });
        }
      }

      const departmentData = {
        name,
        code,
        description: description || null,
        head_id: head_id || null
      };

      const departmentId = await Department.create(departmentData);
      res.status(201).json({ message: 'Department created successfully', departmentId });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Update department
  static async updateDepartment(req, res) {
    try {
      const { deptId } = req.params;
      const { name, code, description, head_id } = req.body;

      // Check if department exists
      const department = await Department.findById(deptId);
      if (!department) {
        return res.status(404).json({ message: 'Department not found' });
      }

      // Validate required fields
      if (!name || !code) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Check if head_id is a valid HOD
      if (head_id) {
        const user = await User.findById(head_id);
        if (!user || user.role !== 'hod') {
          return res.status(400).json({ message: 'Invalid HOD ID provided' });
        }
      }

      const updateData = {
        name,
        code,
        description: description || null,
        head_id: head_id || null
      };

      const success = await Department.update(deptId, updateData);
      if (!success) {
        return res.status(404).json({ message: 'Department not found' });
      }

      res.json({ message: 'Department updated successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Delete department
  static async deleteDepartment(req, res) {
    try {
      const { deptId } = req.params;

      // Check if department exists
      const department = await Department.findById(deptId);
      if (!department) {
        return res.status(404).json({ message: 'Department not found' });
      }

      // Check if department has students or teachers
      const [studentCount] = await pool.execute(
        'SELECT COUNT(*) as count FROM students WHERE department_id = ?',
        [deptId]
      );
      
      if (studentCount[0].count > 0) {
        return res.status(400).json({ 
          message: 'Cannot delete department with enrolled students. Please transfer students first.' 
        });
      }

      const success = await Department.delete(deptId);
      if (!success) {
        return res.status(404).json({ message: 'Department not found' });
      }

      res.json({ message: 'Department deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
  static async manageCourses(req, res) {
    try {
      const userId = req.user.id;
      const hod = await User.findById(userId);
      if (!hod) {
        return res.status(404).json({ message: 'HOD not found' });
      }

      const { action, courseData } = req.body;

      if (!['add', 'edit', 'delete'].includes(action)) {
        return res.status(400).json({ message: 'Invalid action' });
      }

      if (action === 'add') {
        courseData.department_id = req.department.id;
        const courseId = await Course.create(courseData);
        return res.json({ message: 'Course added', courseId });
      } else if (action === 'edit') {
        const success = await Course.update(courseData.id, courseData);
        return res.json({ message: success ? 'Course updated' : 'Failed to update course' });
      } else if (action === 'delete') {
        const success = await Course.delete(courseData.id);
        return res.json({ message: success ? 'Course deleted' : 'Failed to delete course' });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

export default AdminController;
