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
import ClassModel from '../models/class.js';

class AdminController {
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

  // Get department by ID
  static async getDepartmentById(req, res) {
    try {
      const { departmentId } = req.params;

      // Check if department exists
      const department = await Department.findById(departmentId);
      if (!department) {
        return res.status(404).json({ message: 'Department not found' });
      }

      res.json(department);
    } catch (error) {
      console.error('Error getting department by ID:', error);
      res.status(500).json({ message: error.message });
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
      const { offset = 0, limit = 10 } = req.params;
      const lim = Math.max(1, parseInt(limit) || 10);
      const off = Math.max(0, parseInt(offset) || 0);

      let query, params = [];
      if (role === 'teacher') {
        // For teachers, join departments using department_id
        query = `
          SELECT u.id, u.first_name, u.last_name, u.email, u.role, u.created_at,
            d.id as department_id, d.name as department_name, d.code as department_code
          FROM users u
          LEFT JOIN departments d ON u.department_id = d.id
          WHERE u.role = 'teacher'
        `;
        if (departmentId) {
          query += ' AND u.department_id = ?';
          params.push(departmentId);
        }
        if (search) {
          query += ' AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)';
          params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        query += ` ORDER BY u.created_at DESC LIMIT ${lim} OFFSET ${off}`;
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
          page: Math.floor(off / lim) + 1,
          limit: lim,
          total,
          pages: Math.ceil(total / lim)
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

  // Create new student
  static async createStudent(req, res) {
    try {
      const { firstName, lastName, email, studentId, departmentId, phoneNumber, address, dateOfBirth, enrollmentDate } = req.body;

      // Validate required fields
      if (!firstName || !lastName || !email || !studentId || !departmentId) {
        return res.status(400).json({
          message: 'Missing required fields: firstName, lastName, email, studentId, departmentId'
        });
      }

      // Create student
      const newStudentId = await Student.create({
        firstName,
        lastName,
        email,
        student_id: studentId,
        department_id: departmentId,
        phone_number: phoneNumber,
        address,
        date_of_birth: dateOfBirth,
        enrollment_date: enrollmentDate || new Date().toISOString().split('T')[0]
      });

      res.status(201).json({
        message: 'Student created successfully',
        studentId: newStudentId
      });
    } catch (error) {
      res.status(500).json({ message: `Error creating student: ${error.message}` });
    }
  }

  // Update student
  static async updateStudent(req, res) {
    try {
      const { studentId } = req.params;
      const updateData = req.body;

      // Check if student exists
      const existingStudent = await Student.findById(studentId);
      if (!existingStudent) {
        return res.status(404).json({ message: 'Student not found' });
      }

      // Update student
      await Student.update(studentId, updateData);

      res.json({ message: 'Student updated successfully' });
    } catch (error) {
      res.status(500).json({ message: `Error updating student: ${error.message}` });
    }
  }

  // Update student status
  static async updateStudentStatus(req, res) {
    try {
      const { studentId } = req.params;
      const { status } = req.body;

      // Validate status
      const validStatuses = ['active', 'inactive', 'suspended', 'graduated'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
      }

      // Check if student exists
      const existingStudent = await Student.findById(studentId);
      if (!existingStudent) {
        return res.status(404).json({ message: 'Student not found' });
      }

      // Update student status
      await Student.update(studentId, { status });

      res.json({ message: 'Student status updated successfully' });
    } catch (error) {
      res.status(500).json({ message: `Error updating student status: ${error.message}` });
    }
  }

  // Delete student
  static async deleteStudent(req, res) {
    try {
      const { studentId } = req.params;

      // Check if student exists
      const existingStudent = await Student.findById(studentId);
      if (!existingStudent) {
        return res.status(404).json({ message: 'Student not found' });
      }

      // Delete student
      await Student.delete(studentId);

      res.json({ message: 'Student deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: `Error deleting student: ${error.message}` });
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

  // Update user status
  static async updateUserStatus(req, res) {
    try {
      const { userId } = req.params;
      const { status } = req.body;

      // Validate status
      const validStatuses = ['active', 'inactive', 'suspended', 'pending'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
      }

      // Check if user exists
      const existingUser = await User.findById(userId);
      if (!existingUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Update user status
      await User.update(userId, { status });

      res.json({ message: 'User status updated successfully' });
    } catch (error) {
      res.status(500).json({ message: `Error updating user status: ${error.message}` });
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

  // Get academic calendar events
  static async getAcademicCalendar(req, res) {
    try {
      const events = await AcademicCalendar.getAll();
      res.json(events);
    } catch (error) {
      console.error('Error getting academic calendar:', error);
      res.status(500).json({ message: error.message });
    }
  }

  // Update academic calendar event
  static async updateAcademicEvent(req, res) {
    try {
      const { eventId } = req.params;
      const { eventName, eventDate, eventType, description } = req.body;

      // Check if event exists
      const existingEvent = await AcademicCalendar.findById(eventId);
      if (!existingEvent) {
        return res.status(404).json({ message: 'Calendar event not found' });
      }

      // Validate required fields
      if (!eventName || !eventDate || !eventType) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const updateData = {
        event_name: eventName,
        event_date: eventDate,
        event_type: eventType,
        description: description || null
      };

      const success = await AcademicCalendar.update(eventId, updateData);
      if (!success) {
        return res.status(500).json({ message: 'Failed to update calendar event' });
      }

      res.json({ message: 'Calendar event updated successfully' });
    } catch (error) {
      console.error('Error updating academic calendar event:', error);
      res.status(500).json({ message: error.message });
    }
  }

  // Delete academic calendar event
  static async deleteAcademicEvent(req, res) {
    try {
      const { eventId } = req.params;

      // Check if event exists
      const existingEvent = await AcademicCalendar.findById(eventId);
      if (!existingEvent) {
        return res.status(404).json({ message: 'Calendar event not found' });
      }

      const success = await AcademicCalendar.delete(eventId);
      if (!success) {
        return res.status(500).json({ message: 'Failed to delete calendar event' });
      }

      res.json({ message: 'Calendar event deleted successfully' });
    } catch (error) {
      console.error('Error deleting academic calendar event:', error);
      res.status(500).json({ message: error.message });
    }
  }

  // Get all courses with pagination and filtering for admin
  static async getAllCourses(req, res) {
    try {
      const { offset = 0, limit = 10 } = req.params;
      const { search, department_id, semester } = req.query;
      
      let query = `
        SELECT c.id, c.course_code, c.name, c.description, c.credits, c.semester, 
               c.created_at, c.department_id, c.academic_year as year,
               d.name as department_name, d.code as department_code
        FROM courses c
        LEFT JOIN departments d ON c.department_id = d.id
        WHERE 1=1
      `;
      
      const params = [];
      
      if (search) {
        query += ' AND (c.name LIKE ? OR c.course_code LIKE ? OR c.description LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }
      
      if (department_id) {
        query += ' AND c.department_id = ?';
        params.push(department_id);
      }
      
      if (semester) {
        query += ' AND c.semester = ?';
        params.push(semester);
      }
      
      query += ` ORDER BY c.course_code ASC LIMIT ${parseInt(offset)}, ${parseInt(limit)}`;
      // No need to push limit/offset to params since we're using direct values
      
      const [rows] = await pool.execute(query, params);
      
      // Get total count for pagination
      let countQuery = `
        SELECT COUNT(*) as total
        FROM courses c
        WHERE 1=1
      `;
      
      const countParams = [];
      
      if (search) {
        countQuery += ' AND (c.name LIKE ? OR c.course_code LIKE ? OR c.description LIKE ?)';
        const searchTerm = `%${search}%`;
        countParams.push(searchTerm, searchTerm, searchTerm);
      }
      
      if (department_id) {
        countQuery += ' AND c.department_id = ?';
        countParams.push(department_id);
      }
      
      if (semester) {
        countQuery += ' AND c.semester = ?';
        countParams.push(semester);
      }
      
      const [countResult] = await pool.execute(countQuery, countParams);
      const total = countResult[0].total;
      
      res.json({
        courses: rows,
        pagination: {
          total,
          offset: parseInt(offset),
          limit: parseInt(limit),
          hasMore: parseInt(offset) + parseInt(limit) < total
        }
      });
    } catch (error) {
      console.error('Error getting all courses:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Get courses for timetable dropdown
  static async getCourses(req, res) {
    try {
      const query = `
        SELECT id, course_code, name, description, credits, semester
        FROM courses 
        ORDER BY course_code ASC
      `;
      const [rows] = await pool.execute(query);
      res.json(rows);
    } catch (error) {
      console.error('Error getting courses:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Get classes for timetable dropdown
  static async getClasses(req, res) {
    try {
      const query = `
        SELECT 
          c.id, 
          c.name, 
          c.academic_year,
          d.name as department_name
        FROM classes c 
        LEFT JOIN departments d ON d.id = c.department_id 
        WHERE c.is_active = 1
        ORDER BY c.academic_year DESC, c.name ASC
      `;
      const [rows] = await pool.execute(query);
      res.json(rows);
    } catch (error) {
      console.error('Error getting classes:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
  // Get a specific timetable slot
  static async getTimetableSlot(req, res) {
    try {
      const { id } = req.params;

      const query = `
        SELECT t.*, c.name as course_name, c.course_code,
               u.first_name, u.last_name,
               cl.name as class_name
        FROM timetable t
        LEFT JOIN courses c ON t.course_id = c.id
        LEFT JOIN users u ON t.teacher_id = u.id
        LEFT JOIN classes cl ON t.class_id = cl.id
        WHERE t.id = ?
      `;

      const [rows] = await pool.execute(query, [id]);

      if (rows.length === 0) {
        return res.status(404).json({ message: 'Timetable slot not found' });
      }

      res.json(rows[0]);
    } catch (error) {
      console.error('Error getting timetable slot:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Update a timetable slot
  static async updateTimetableSlot(req, res) {
    try {
      const { id } = req.params;
      const { course_id, teacher_id, class_id, day, start_time, end_time, room, semester } = req.body;

      const query = `
        UPDATE timetable
        SET course_id = ?, teacher_id = ?, class_id = ?, day_of_week = ?,
            start_time = ?, end_time = ?, room = ?, semester = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      const [result] = await pool.execute(query, [
        course_id, teacher_id, class_id, day, start_time, end_time, room, semester, id
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Timetable slot not found' });
      }

      res.json({ message: 'Timetable slot updated successfully', id });
    } catch (error) {
      console.error('Error updating timetable slot:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Delete a timetable slot
  static async deleteTimetableSlot(req, res) {
    try {
      const { id } = req.params;

      const query = 'DELETE FROM timetable WHERE id = ?';
      const [result] = await pool.execute(query, [id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Timetable slot not found' });
      }

      res.json({ message: 'Timetable slot deleted successfully' });
    } catch (error) {
      console.error('Error deleting timetable slot:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Get timetable
  static async getTimetable(req, res) {
    try {
      const { semester, teacher_id, course_id } = req.query;
      
      let query = `
        SELECT t.id, t.course_id, t.teacher_id, t.day_of_week, t.start_time, t.end_time, 
               t.class_id, t.semester, t.academic_year,
               c.name as course_name, c.course_code,
               CONCAT(u.first_name, ' ', u.last_name) as teacher_name
        FROM timetable t
        LEFT JOIN courses c ON t.course_id = c.id
        LEFT JOIN users u ON t.teacher_id = u.id
        WHERE 1=1
      `;
      const params = [];
      
      if (semester) {
        query += ' AND t.semester = ?';
        params.push(semester);
      }
      
      if (teacher_id) {
        query += ' AND t.teacher_id = ?';
        params.push(teacher_id);
      }
      
      if (course_id) {
        query += ' AND t.course_id = ?';
        params.push(course_id);
      }
      
      query += ' ORDER BY t.day_of_week, t.start_time';
      
      const [rows] = await pool.execute(query, params);
      res.json(rows);
    } catch (error) {
      console.error('Error getting timetable:', error);
      res.status(500).json({ message: 'Internal server error' });
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

  // Get comprehensive analytics data
  static async getAnalytics(req, res) {
    try {
      const analytics = {};

      // User statistics
      const [userStats] = await pool.execute(`
        SELECT 
          COUNT(*) as totalUsers,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as activeUsers,
          SUM(CASE WHEN DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as newUsersThisMonth,
          SUM(CASE WHEN role = 'student' THEN 1 ELSE 0 END) as totalStudents,
          SUM(CASE WHEN role = 'teacher' THEN 1 ELSE 0 END) as totalTeachers,
          SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as totalAdmins,
          SUM(CASE WHEN role = 'hod' THEN 1 ELSE 0 END) as totalHODs
        FROM users
      `);

      analytics.userStats = userStats[0];

      // Department distribution
      const [departmentStats] = await pool.execute(`
        SELECT 
          d.name as departmentName,
          COUNT(DISTINCT u.id) as userCount,
          COUNT(DISTINCT CASE WHEN u.role = 'student' THEN u.id END) as studentCount,
          COUNT(DISTINCT CASE WHEN u.role = 'teacher' THEN u.id END) as teacherCount
        FROM departments d
        LEFT JOIN users u ON u.department_id = d.id
        GROUP BY d.id, d.name
        ORDER BY userCount DESC
      `);

      analytics.departmentDistribution = departmentStats;

      // Monthly user registration trend (last 6 months)
      const [registrationTrend] = await pool.execute(`
        SELECT 
          DATE_FORMAT(created_at, '%Y-%m') as month,
          COUNT(*) as registrations
        FROM users 
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month ASC
      `);

      analytics.registrationTrend = registrationTrend;

      // Role distribution
      const [roleDistribution] = await pool.execute(`
        SELECT 
          role,
          COUNT(*) as count
        FROM users
        GROUP BY role
      `);

      analytics.roleDistribution = roleDistribution;

      // Course statistics
      const [courseStats] = await pool.execute(`
        SELECT 
          COUNT(*) as totalCourses,
          COUNT(DISTINCT department_id) as departmentsWithCourses
        FROM courses
      `);

      analytics.courseStats = courseStats[0];

      // System activity (mock data for now - would need activity logs table)
      analytics.systemActivity = {
        totalLogins: Math.floor(analytics.userStats.totalUsers * 2.3),
        avgSessionTime: 24,
        peakHours: [
          { hour: '9:00', usage: 75 },
          { hour: '10:00', usage: 85 },
          { hour: '11:00', usage: 90 },
          { hour: '14:00', usage: 80 },
          { hour: '15:00', usage: 70 }
        ]
      };

      res.json(analytics);
    } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).json({ message: error.message });
    }
  }

  // Create new department
  static async createDepartment(req, res) {
    try {
      const { name, code, description, head_id, teachers = [] } = req.body;

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
        head_id: head_id || null,
        teachers
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

  // Get students in a specific department
  static async getDepartmentStudents(req, res) {
    try {
      const { departmentId } = req.params;

      // Validate department exists
      const department = await Department.findById(departmentId);
      if (!department) {
        return res.status(404).json({ message: 'Department not found' });
      }

      // Get students in the department
      const query = `
        SELECT
          s.id,
          s.first_name,
          s.last_name,
          s.email,
          s.student_id,
          s.enrollment_year,
          s.current_year,
          s.enrollment_date,
          s.status,
          s.created_at,
          d.name as department_name,
          d.code as department_code
        FROM students s
        LEFT JOIN departments d ON s.department_id = d.id
        WHERE s.department_id = ?
        ORDER BY s.last_name, s.first_name
      `;

      const [students] = await pool.execute(query, [departmentId]);

      res.json({
        departmentId: parseInt(departmentId),
        departmentName: department.name,
        students: students
      });
    } catch (error) {
      console.error('Error getting department students:', error);
      res.status(500).json({ message: error.message });
    }
  }

  // Get teachers in a specific department (many-to-many relationship)
  static async getDepartmentTeachers(req, res) {
    try {
      const { departmentId } = req.params;

      // Validate department exists
      const department = await Department.findById(departmentId);
      if (!department) {
        return res.status(404).json({ message: 'Department not found' });
      }

      // Get teachers assigned to this department using the many-to-many relationship
      const query = `
        SELECT DISTINCT
          u.id,
          u.first_name,
          u.last_name,
          u.email,
          u.staff_id,
          u.hire_date,
          u.status,
          td.is_primary,
          td.assigned_date,
          td.created_at as assignment_created_at,
          (SELECT COUNT(*) FROM teacher_departments td2 WHERE td2.teacher_id = u.id) as totalDepartments
        FROM users u
        JOIN teacher_departments td ON u.id = td.teacher_id
        WHERE td.department_id = ? AND u.role = 'teacher' AND u.status = 'active'
        ORDER BY td.is_primary DESC, u.last_name, u.first_name
      `;

      const [teachers] = await pool.execute(query, [departmentId]);

      res.json(teachers);
    } catch (error) {
      console.error('Error getting department teachers:', error);
      res.status(500).json({ message: error.message });
    }
  }

  // Get courses in a specific department (many-to-many relationship)
  static async getDepartmentCourses(req, res) {
    try {
      const { departmentId } = req.params;

      // Validate department exists
      const department = await Department.findById(departmentId);
      if (!department) {
        return res.status(404).json({ message: 'Department not found' });
      }

      // Get courses assigned to this department using the many-to-many relationship
      const query = `
        SELECT DISTINCT
          c.id,
          c.course_code,
          c.name,
          c.description,
          c.credits,
          c.semester,
          c.created_at,
          dc.assigned_date,
          dc.created_at as assignment_created_at
        FROM courses c
        JOIN department_courses dc ON c.id = dc.course_id
        WHERE dc.department_id = ?
        ORDER BY c.course_code, c.name
      `;

      const [courses] = await pool.execute(query, [departmentId]);

      res.json(courses);
    } catch (error) {
      console.error('Error getting department courses:', error);
      res.status(500).json({ message: error.message });
    }
  }

  // Assign courses to department
  static async assignCoursesToDepartment(req, res) {
    try {
      const { courses, departmentId } = req.body;

      // Validate required fields
      if (!courses || !Array.isArray(courses) || courses.length === 0) {
        return res.status(400).json({ message: 'Courses array is required' });
      }
      if (!departmentId) {
        return res.status(400).json({ message: 'Department ID is required' });
      }

      // Validate department exists
      const department = await Department.findById(departmentId);
      if (!department) {
        return res.status(404).json({ message: 'Department not found' });
      }

      // Validate all courses exist
      for (const courseId of courses) {
        const course = await Course.findById(courseId);
        if (!course) {
          return res.status(404).json({ message: `Course with ID ${courseId} not found` });
        }
      }

      // Insert course assignments (ignore duplicates)
      const insertQuery = `
        INSERT IGNORE INTO department_courses (department_id, course_id, assigned_date)
        VALUES (?, ?, CURRENT_DATE)
      `;

      for (const courseId of courses) {
        await pool.execute(insertQuery, [departmentId, courseId]);
      }

      res.json({
        message: `Successfully assigned ${courses.length} course(s) to department`,
        assignedCourses: courses.length
      });
    } catch (error) {
      console.error('Error assigning courses to department:', error);
      res.status(500).json({ message: error.message });
    }
  }

  // Remove courses from department
  static async removeCoursesFromDepartment(req, res) {
    try {
      const { courses, departmentId } = req.body;

      // Validate required fields
      if (!courses || !Array.isArray(courses) || courses.length === 0) {
        return res.status(400).json({ message: 'Courses array is required' });
      }
      if (!departmentId) {
        return res.status(400).json({ message: 'Department ID is required' });
      }

      // Validate department exists
      const department = await Department.findById(departmentId);
      if (!department) {
        return res.status(404).json({ message: 'Department not found' });
      }

      // Remove course assignments
      const deleteQuery = `
        DELETE FROM department_courses
        WHERE department_id = ? AND course_id = ?
      `;

      for (const courseId of courses) {
        await pool.execute(deleteQuery, [departmentId, courseId]);
      }

      res.json({
        message: `Successfully removed ${courses.length} course(s) from department`,
        removedCourses: courses.length
      });
    } catch (error) {
      console.error('Error removing courses from department:', error);
      res.status(500).json({ message: error.message });
    }
  }

  // Assign student to department
  static async assignStudentToDepartment(req, res) {
    try {
      const { studentId } = req.params;
      const { departmentId } = req.body;

      // Validate required fields
      if (!departmentId) {
        return res.status(400).json({ message: 'Department ID is required' });
      }

      // Check if student exists
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      // Check if department exists
      const department = await Department.findById(departmentId);
      if (!department) {
        return res.status(404).json({ message: 'Department not found' });
      }

      // Update student's department
      const updateQuery = `
        UPDATE students
        SET department_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      await pool.execute(updateQuery, [departmentId, studentId]);

      res.json({
        message: 'Student assigned to department successfully',
        studentId: parseInt(studentId),
        departmentId: parseInt(departmentId),
        studentName: `${student.first_name} ${student.last_name}`,
        departmentName: department.name
      });
    } catch (error) {
      console.error('Error assigning student to department:', error);
      res.status(500).json({ message: error.message });
    }
  }

  // Admin course management
  static async manageCourses(req, res) {
    try {
      const { action, name, course_code, credits, description, semester, id } = req.body;

      // Validate action
      if (!['create', 'update', 'delete'].includes(action)) {
        return res.status(400).json({ message: 'Invalid action. Must be create, update, or delete.' });
      }

      if (action === 'create') {
        // Validate required fields for creation
        if (!name || !course_code || !credits) {
          return res.status(400).json({ message: 'Missing required fields: name, course_code, credits' });
        }

        // Check if course code already exists
        const existingCourse = await Course.findByCode(course_code);
        if (existingCourse) {
          return res.status(409).json({ message: 'Course with this code already exists' });
        }

        const courseData = {
          name,
          course_code,
          credits: parseInt(credits),
          description: description || null,
          semester: semester || null
        };

        const courseId = await Course.create(courseData);
        return res.status(201).json({ message: 'Course created successfully', courseId });

      } else if (action === 'update') {
        if (!id) {
          return res.status(400).json({ message: 'Course ID is required for update' });
        }

        // Check if course exists
        const existingCourse = await Course.findById(id);
        if (!existingCourse) {
          return res.status(404).json({ message: 'Course not found' });
        }

        // Check if course code is being changed and if it conflicts
        if (course_code && course_code !== existingCourse.course_code) {
          const codeConflict = await Course.findByCode(course_code);
          if (codeConflict && codeConflict.id !== parseInt(id)) {
            return res.status(409).json({ message: 'Course with this code already exists' });
          }
        }

        const updateData = {};
        if (name) updateData.name = name;
        if (course_code) updateData.course_code = course_code;
        if (credits !== undefined && credits !== '') updateData.credits = parseInt(credits) || 0;
        if (description !== undefined) updateData.description = description || null;
        if (semester) updateData.semester = semester || null;

        const success = await Course.update(id, updateData);
        if (!success) {
          return res.status(500).json({ message: 'Failed to update course' });
        }

        return res.json({ message: 'Course updated successfully' });

      } else if (action === 'delete') {
        if (!id) {
          return res.status(400).json({ message: 'Course ID is required for deletion' });
        }

        // Check if course exists
        const existingCourse = await Course.findById(id);
        if (!existingCourse) {
          return res.status(404).json({ message: 'Course not found' });
        }

        // Check if course is being used in timetable or enrollments
        const isInUse = await Course.checkUsage(id);
        if (isInUse) {
          return res.status(409).json({ 
            message: 'Cannot delete course as it is currently being used in timetables or student enrollments' 
          });
        }

        const success = await Course.delete(id);
        if (!success) {
          return res.status(500).json({ message: 'Failed to delete course' });
        }

        return res.json({ message: 'Course deleted successfully' });
      }

    } catch (error) {
      console.error('Error managing courses:', error);
      res.status(500).json({ message: error.message || 'Internal server error' });
    }
  }

  // HOD course management (existing method)
  static async hodManageCourses(req, res) {
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

  // Get user by ID
  static async getUserById(req, res) {
    try {
      const { userId } = req.params;

      // Validate userId
      if (!userId || isNaN(parseInt(userId))) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }

      // First check if user exists in users table
      let user = await User.findById(parseInt(userId));
      
      // If not found in users table, check students table
      if (!user) {
        user = await Student.findById(parseInt(userId));
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        // Add role field for students if not present
        if (!user.role) {
          user.role = 'student';
        }
      }

      res.json(user);
    } catch (error) {
      console.error('Error getting user by ID:', error);
      res.status(500).json({ message: error.message });
    }
  }

  // Get dashboard data
  static async getDashboard(req, res) {
    try {
      const dashboard = {};

      // Get basic stats
      const [totalUsers] = await pool.execute('SELECT COUNT(*) as count FROM users');
      const [totalStudents] = await pool.execute('SELECT COUNT(*) as count FROM students');
      const [totalDepartments] = await pool.execute('SELECT COUNT(*) as count FROM departments');
      const [totalCourses] = await pool.execute('SELECT COUNT(*) as count FROM courses');

      dashboard.stats = {
        totalUsers: totalUsers[0].count,
        totalStudents: totalStudents[0].count,
        totalDepartments: totalDepartments[0].count,
        totalCourses: totalCourses[0].count
      };

      // Get recent activities (if activity table exists)
      try {
        const [recentActivities] = await pool.execute(`
          SELECT * FROM activities
          ORDER BY created_at DESC
          LIMIT 10
        `);
        dashboard.recentActivities = recentActivities;
      } catch (error) {
        // Activities table might not exist
        dashboard.recentActivities = [];
      }

      // Get user role breakdown
      const [roleBreakdown] = await pool.execute(`
        SELECT role, COUNT(*) as count
        FROM users
        GROUP BY role
      `);
      dashboard.roleBreakdown = roleBreakdown;

      res.json(dashboard);
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      res.status(500).json({ message: error.message });
    }
  }

  // Get reports
  static async getReports(req, res) {
    try {
      const reports = {};

      // User reports
      const [usersByRole] = await pool.execute(`
        SELECT role, COUNT(*) as count
        FROM users
        GROUP BY role
      `);
      reports.usersByRole = usersByRole;

      // Student reports
      const [studentsByDepartment] = await pool.execute(`
        SELECT d.name as department, COUNT(s.id) as count
        FROM departments d
        LEFT JOIN students s ON d.id = s.department_id
        GROUP BY d.id, d.name
      `);
      reports.studentsByDepartment = studentsByDepartment;

      // Course reports (courses don't have department_id in current schema)
      const [totalCourses] = await pool.execute(`
        SELECT COUNT(*) as total_courses FROM courses
      `);
      reports.totalCourses = totalCourses[0].total_courses;

      res.json(reports);
    } catch (error) {
      console.error('Error getting reports:', error);
      res.status(500).json({ message: error.message });
    }
  }

  static async addCoursesToClass(req, res) {
      try {
        const { classId, courses } = req.body;
        if (!Array.isArray(courses) || courses.length === 0) {
          return res.status(400).json({ message: 'No course IDs provided' });
        }
        // Validate class
        const cls = await ClassModel.findById(classId);
        if (!cls) {
          return res.status(404).json({ message: 'Class not found' });
        }
        // Add each course to class and enroll all students
        for (const courseId of courses) {
          const isCourseValid = await Course.findById(courseId);
          if (!isCourseValid) {
            return res.status(404).json({ message: `Course not found: ${courseId}` });
          }
          await ClassModel.addCourse(classId, courseId);
        }
        res.json({ message: 'Courses added to class and students enrolled', classId, courses });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  static async removeCoursesFromClass(req, res) {
      try {
        const { classId, courses } = req.body;
        // Validate class
        const cls = await ClassModel.findById(classId);
        if (!cls) {
          return res.status(404).json({ message: 'Class not found' });
        }

        if (!Array.isArray(courses) || courses.length === 0) {
          return res.status(400).json({ message: 'No course IDs provided' });
        }
        // Remove each course from class and unenroll all students
        for (const courseId of courses) {
          const isCourseValid = await Course.findById(courseId);
          if (!isCourseValid) {
            return res.status(404).json({ message: `Course not found: ${courseId}` });
          }
          await ClassModel.removeCourse(classId, courseId);
        }
        res.json({ message: 'Courses removed from class and students unenrolled', classId, courses });
      } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message });
      }
    }
  static async createClass(req, res) {
      try {
        const {academic_year,start_date,end_date,students,created_by,name,department} = req.body
        const isAvai = await Department.findById(department);
        if (!isAvai) return res.status(404).json({ message: 'Department not found' });
        const created_by_user = await User.findById(created_by);
        if (created_by && (!created_by_user || created_by_user.role !== 'teacher')) return res.status(400).json({ message: 'Invalid creator ID, must be a teacher', created_by });
        if (!Array.isArray(students) || students.length === 0 || !academic_year || !start_date || !end_date || !name) {
          return res.status(400).json({ message: 'Missing fields' });
        }
        //validate students
        for (const student of students) {
          let avai = await Student.findById(student)
          if(!avai) return res.status(404).json({ message: 'Student not found', student });
           let isEnrolled = await ClassModel.findByStudent(student,true)
          if (isEnrolled.length) return res.status(400).json({ message: 'Student is already enrolled in another class',  insertedStudents : students.filter(st => students.indexOf(st) < students.indexOf(student)), student });
        }
        const classId = await ClassModel.create({academic_year,start_date,end_date,students, department_id: department, created_by: created_by || req.user.id,name});
        res.status(201).json({ message: 'class created successfully', classId });

      } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message });
      }
    }
  static async addStudentsToClass(req,res){
    try {
      const {students,classId} = req.body
      //firstly check if the students are all valid and not enrolled in other classes
      for (const student of students) {
        let isValid = await Student.findById(student)
        if (!isValid) return res.status(404).json({message: 'Student Not Found', student, insertedStudents : students.filter(st => students.indexOf(st) < students.indexOf(student))})
        let isEnrolled = await ClassModel.findByStudent(student,true)
        if (isEnrolled.length) return res.status(400).json({ message: 'Student is already enrolled in another class',  insertedStudents : students.filter(st => students.indexOf(st) < students.indexOf(student)), student });
        const isInserted = await ClassModel.addStudent(classId,student)
        if (isInserted) {
          continue
        }
      }
      res.status(201).json({ message: 'student (s) added to class successfully', classId });

    } catch (error) {
      console.log(error)
      res.status(500).json({ message: 'internal server error' });

    }
  }
    // Add teachers to department (updated for many-to-many)
    static async addTeachersToDepartment(req, res) {
      try {
        const { teachers, setPrimary = false,department } = req.body;
        if (!Array.isArray(teachers) || teachers.length === 0) {
          return res.status(400).json({ message: 'No teacher IDs provided' });
        }
        // Get department
        const isDAvai = await Department.findById(department);
        if (!isDAvai) {
          return res.status(404).json({ message: 'Department not found' });
        }
  
        // Validate and assign teachers
        const results = [];
        const errors = [];
  
        for (const teacherId of teachers) {
          try {
            const teacher = await User.findById(teacherId);
            if (!teacher || teacher.role !== 'teacher') {
              errors.push(`Invalid teacher ID: ${teacherId}`);
              continue;
            }
  
            const success = await Teacher.assignToDepartment(teacherId, id, setPrimary);
            if (success) {
              results.push({
                teacherId,
                name: `${teacher.first_name} ${teacher.last_name}`,
                assigned: true,
                isPrimary: setPrimary
              });
            } else {
              errors.push(`Failed to assign teacher ${teacherId}`);
            }
          } catch (error) {
            errors.push(`Error assigning teacher ${teacherId}: ${error.message}`);
          }
        }
  
        const response = {
          message: `${results.length} teachers assigned to department`,
          assigned: results,
          departmentId: id
        };
  
        if (errors.length > 0) {
          response.errors = errors;
        }
  
        res.json(response);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
    static async removeTeachersFromDepartment(req, res) {
      try {
        const { teachers } = req.body;
        const { department } = req.department;

        if (!Array.isArray(teachers) || teachers.length === 0) {
          return res.status(400).json({ message: 'No teacher IDs provided' });
        }
        const results = [];
        const errors = [];

        for (const teacherId of teachers) {
          try {
            const success = await Teacher.removeFromDepartment(department, teacherId);
            if (success) {
              results.push({ teacherId, removed: true });
            } else {
              errors.push(`Teacher ${teacherId} was not assigned to this department`);
            }
          } catch (error) {
            errors.push(`Error removing teacher ${teacherId}: ${error.message}`);
          }
        }

        const response = {
          message: `${results.length} teachers removed from department`,
          removed: results,
          departmentId: id
        };

        if (errors.length > 0) {
          response.errors = errors;
        }

        res.json(response);
      } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message });
      }
    }

    static async getClass(req, res) {
      try {
        const { classID } = req.params;
        const cls = await ClassModel.findById(classID);
        if (!cls) {
          return res.status(404).json({ message: 'Class not found' });
        }
        res.json(cls);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }

    static async getAllClasses(req, res) {
      try {
        const { offset = 0, limit = 10 } = req.query;
        const classes = await ClassModel.findAll({ offset: parseInt(offset), limit: parseInt(limit) });
        res.json(classes);
      }catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message });
      }
    }

  // Get current HOD for a department (including available HODs)
  static async getDepartmentHOD(req, res) {
    try {
      const { departmentId } = req.params;

      // Validate department exists
      const department = await Department.findById(departmentId);
      if (!department) {
        return res.status(404).json({ message: 'Department not found' });
      }

      let currentHOD = null;

      // Get current HOD if exists
      if (department.head_id) {
        const query = `
          SELECT
            u.id,
            u.first_name,
            u.last_name,
            u.email,
            u.staff_id,
            u.hire_date,
            u.status,
            u.role,
            td.assigned_date as hod_assigned_date
          FROM users u
          LEFT JOIN teacher_departments td ON u.id = td.teacher_id AND td.department_id = ?
          WHERE u.id = ? AND (u.role = 'teacher' OR u.role = 'hod')
        `;

        const [hodResult] = await pool.execute(query, [departmentId, department.head_id]);

        if (hodResult.length > 0) {
          currentHOD = hodResult[0];
        }
      }

      // Get all available HODs from other departments and unassigned HODs
      const availableHODsQuery = `
        SELECT DISTINCT
          u.id,
          u.first_name,
          u.last_name,
          u.email,
          u.staff_id,
          u.hire_date,
          u.status,
          u.role,
          d.name as current_department_name,
          d.code as current_department_code,
          d.id as current_department_id
        FROM users u
        LEFT JOIN departments d ON u.id = d.head_id
        WHERE (u.role = 'teacher' OR u.role = 'hod')
        AND u.status = 'active'
        AND (d.id IS NULL OR d.id != ?)
        ORDER BY u.first_name, u.last_name
      `;

      const [availableHODs] = await pool.execute(availableHODsQuery, [departmentId]);

      console.log('🔍 Available HODs found:', availableHODs.length, availableHODs);

      res.json({
        departmentId: parseInt(departmentId),
        departmentName: department.name,
        hod: currentHOD,
        availableHODs: availableHODs
      });
    } catch (error) {
      console.error('Error getting department HOD:', error);
      res.status(500).json({ message: error.message });
    }
  }

  // Get all available HODs (existing HODs from other departments)
  static async getAvailableHODs(req, res) {
    try {
      console.log('🔍 getAvailableHODs called with departmentId:', req.params.departmentId);
      const { departmentId } = req.params;

      // Get all current HODs from other departments (both teachers and HODs)
      const query = `
        SELECT DISTINCT
          u.id,
          u.first_name,
          u.last_name,
          u.email,
          u.staff_id,
          u.hire_date,
          u.status,
          u.role,
          d.name as current_department_name,
          d.code as current_department_code,
          d.id as current_department_id
        FROM users u
        INNER JOIN departments d ON u.id = d.head_id
        WHERE (u.role = 'teacher' OR u.role = 'hod')
        AND u.status = 'active'
        AND d.id != ?
        ORDER BY u.first_name, u.last_name
      `;

      const [hods] = await pool.execute(query, [departmentId]);

      res.json({
        departmentId: parseInt(departmentId),
        availableHODs: hods
      });
    } catch (error) {
      console.error('Error fetching available HODs:', error);
      res.status(500).json({ message: error.message });
    }
  }

  // Simple test endpoint to verify available HODs
  static async getHODsForDepartment(req, res) {
    try {
      const { departmentId } = req.params;
      console.log('🔍 getHODsForDepartment called with departmentId:', departmentId);

      // Get all current HODs from other departments
      const query = `
        SELECT DISTINCT
          u.id,
          u.first_name,
          u.last_name,
          u.email,
          u.role,
          d.name as current_department_name,
          d.code as current_department_code
        FROM users u
        INNER JOIN departments d ON u.id = d.head_id
        WHERE (u.role = 'teacher' OR u.role = 'hod')
        AND u.status = 'active'
        AND d.id != ?
        ORDER BY u.first_name, u.last_name
      `;

      const [hods] = await pool.execute(query, [departmentId]);

      res.json({
        success: true,
        departmentId: parseInt(departmentId),
        count: hods.length,
        availableHODs: hods
      });
    } catch (error) {
      console.error('Error fetching HODs for department:', error);
      res.status(500).json({ message: error.message });
    }
  }

  // Assign HOD to department (enhanced to allow both teachers and existing HODs)
  static async assignDepartmentHOD(req, res) {
    try {
      const { departmentId } = req.params;
      const { teacherId, isExistingHOD = false } = req.body;

      // Validate required fields
      if (!teacherId) {
        return res.status(400).json({ message: 'Teacher ID is required' });
      }

      // Validate department exists
      const department = await Department.findById(departmentId);
      if (!department) {
        return res.status(404).json({ message: 'Department not found' });
      }

      // Validate user exists and is a teacher or HOD
      const [userResult] = await pool.execute(
        'SELECT id, role FROM users WHERE id = ?',
        [teacherId]
      );

      if (userResult.length === 0 || (userResult[0].role !== 'teacher' && userResult[0].role !== 'hod')) {
        return res.status(404).json({ message: 'User not found or user is not a teacher/HOD' });
      }

      // If it's an existing HOD, skip the department assignment check
      if (!isExistingHOD) {
        // Validate teacher is assigned to this department
        const [assignmentCheck] = await pool.execute(
          'SELECT id FROM teacher_departments WHERE teacher_id = ? AND department_id = ?',
          [teacherId, departmentId]
        );

        if (assignmentCheck.length === 0) {
          return res.status(400).json({
            message: 'Teacher must be assigned to the department before becoming HOD'
          });
        }
      }

      // Update department head_id
      const updateQuery = 'UPDATE departments SET head_id = ? WHERE id = ?';
      await pool.execute(updateQuery, [teacherId, departmentId]);

      // Get updated HOD info
      const query = `
        SELECT
          u.id,
          u.first_name,
          u.last_name,
          u.email,
          u.staff_id,
          u.hire_date,
          u.status,
          u.role
        FROM users u
        WHERE u.id = ? AND (u.role = 'teacher' OR u.role = 'hod')
      `;

      const [hodResult] = await pool.execute(query, [teacherId]);

      res.json({
        message: 'HOD assigned successfully',
        departmentId: parseInt(departmentId),
        departmentName: department.name,
        hod: hodResult[0]
      });
    } catch (error) {
      console.error('Error assigning department HOD:', error);
      res.status(500).json({ message: error.message });
    }
  }

  // Remove HOD from department
  static async removeDepartmentHOD(req, res) {
    try {
      const { departmentId } = req.params;

      // Validate department exists
      const department = await Department.findById(departmentId);
      if (!department) {
        return res.status(404).json({ message: 'Department not found' });
      }

      if (!department.head_id) {
        return res.status(400).json({ message: 'Department does not have an HOD assigned' });
      }

      // Remove HOD assignment
      const updateQuery = 'UPDATE departments SET head_id = NULL WHERE id = ?';
      await pool.execute(updateQuery, [departmentId]);

      res.json({
        message: 'HOD removed successfully',
        departmentId: parseInt(departmentId),
        departmentName: department.name
      });
    } catch (error) {
      console.error('Error removing department HOD:', error);
      res.status(500).json({ message: error.message });
    }
  }

}

export default AdminController;
