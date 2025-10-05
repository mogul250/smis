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
               c.created_at,
               NULL as year, NULL as prerequisites, NULL as department_id, NULL as updated_at,
               NULL as department_name, NULL as department_code
        FROM courses c
        WHERE 1=1
      `;
      
      const params = [];
      
      if (search) {
        query += ' AND (c.name LIKE ? OR c.course_code LIKE ? OR c.description LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }
      
      // Department filtering disabled - column doesn't exist in current schema
      // if (department_id) {
      //   query += ' AND c.department_id = ?';
      //   params.push(department_id);
      // }
      
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
      
      // Department filtering disabled - column doesn't exist in current schema
      // if (department_id) {
      //   countQuery += ' AND c.department_id = ?';
      //   countParams.push(department_id);
      // }
      
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
        SELECT id, academic_year, start_date, end_date, students, created_by, is_active
        FROM classes
        WHERE is_active = 1
        ORDER BY academic_year DESC, id ASC
      `;
      const [rows] = await pool.execute(query);

      // Transform the data to match expected format
      const transformedRows = rows.map(row => ({
        id: row.id,
        name: `Class ${row.academic_year}`, // Use academic_year as name
        academic_year: row.academic_year,
        department_id: null // Will be null for now
      }));

      res.json(transformedRows);
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
        if (credits) updateData.credits = parseInt(credits);
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

      const user = await User.findById(parseInt(userId));
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
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
}

export default AdminController;
