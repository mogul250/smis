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

  // Get student invoices
  static async getInvoices(req, res) {
    try {
      const studentId = req.user.id;
      const { status, dateRange, page = 1, limit = 10 } = req.query;
      
      console.log('🔍 Getting invoices for student:', studentId);

      let whereClause = 'WHERE i.student_id = ?';
      let queryParams = [studentId];

      // Add status filter
      if (status && status !== 'all') {
        whereClause += ' AND i.status = ?';
        queryParams.push(status);
      }

      // Add date range filter
      if (dateRange && dateRange !== 'all') {
        const now = new Date();
        let startDate, endDate;

        switch (dateRange) {
          case 'this_month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            break;
          case 'last_month':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            endDate = new Date(now.getFullYear(), now.getMonth(), 0);
            break;
          case 'this_year':
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear(), 11, 31);
            break;
        }

        if (startDate && endDate) {
          whereClause += ' AND i.issue_date BETWEEN ? AND ?';
          queryParams.push(startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]);
        }
      }

      // Get invoices with pagination
      const offset = (page - 1) * limit;
      const [invoiceRows] = await pool.execute(
        `SELECT i.*, s.first_name, s.last_name, s.email, s.student_id as student_number
         FROM invoices i
         LEFT JOIN students s ON i.student_id = s.id
         ${whereClause}
         ORDER BY i.created_at DESC
         LIMIT ? OFFSET ?`,
        [...queryParams, parseInt(limit), parseInt(offset)]
      );

      // Get invoice items for each invoice
      const invoicesWithItems = await Promise.all(
        invoiceRows.map(async (invoice) => {
          const [itemRows] = await pool.execute(
            'SELECT * FROM invoice_items WHERE invoice_id = ?',
            [invoice.id]
          );
          return {
            ...invoice,
            items: itemRows
          };
        })
      );

      // Get total count for pagination
      const [countRows] = await pool.execute(
        `SELECT COUNT(*) as total FROM invoices i ${whereClause}`,
        queryParams.slice(0, -2) // Remove limit and offset params
      );
      const totalCount = countRows[0].total;

      // Calculate statistics
      const [statsRows] = await pool.execute(
        `SELECT 
           SUM(total_amount) as totalAmount,
           SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) as paidAmount,
           SUM(CASE WHEN status != 'paid' THEN total_amount ELSE 0 END) as pendingAmount
         FROM invoices 
         WHERE student_id = ?`,
        [studentId]
      );

      const stats = statsRows[0] || { totalAmount: 0, paidAmount: 0, pendingAmount: 0 };

      const response = {
        invoices: invoicesWithItems,
        stats: {
          totalAmount: parseFloat(stats.totalAmount) || 0,
          paidAmount: parseFloat(stats.paidAmount) || 0,
          pendingAmount: parseFloat(stats.pendingAmount) || 0
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      };

      console.log(`✅ Found ${invoicesWithItems.length} invoices for student ${studentId}`);
      res.json(response);
    } catch (error) {
      console.error('Error in getInvoices:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Get specific invoice details
  static async getInvoice(req, res) {
    try {
      const studentId = req.user.id;
      const invoiceId = req.params.id;
      
      console.log('🔍 Getting invoice details:', invoiceId, 'for student:', studentId);

      // Get invoice details
      const [invoiceRows] = await pool.execute(
        `SELECT i.*, s.first_name, s.last_name, s.email, s.student_id as student_number,
                s.phone, s.address, s.current_year, s.status as student_status
         FROM invoices i
         LEFT JOIN students s ON i.student_id = s.id
         WHERE i.id = ? AND i.student_id = ?`,
        [invoiceId, studentId]
      );

      if (invoiceRows.length === 0) {
        return res.status(404).json({ message: 'Invoice not found' });
      }

      const invoice = invoiceRows[0];

      // Get invoice items
      const [itemRows] = await pool.execute(
        'SELECT * FROM invoice_items WHERE invoice_id = ?',
        [invoiceId]
      );

      const response = {
        ...invoice,
        items: itemRows,
        student: {
          first_name: invoice.first_name,
          last_name: invoice.last_name,
          email: invoice.email,
          student_id: invoice.student_number,
          phone: invoice.phone,
          address: invoice.address,
          current_year: invoice.current_year,
          status: invoice.student_status
        }
      };

      console.log('✅ Invoice details retrieved for:', invoiceId);
      res.json(response);
    } catch (error) {
      console.error('Error in getInvoice:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Download invoice as PDF (placeholder)
  static async downloadInvoice(req, res) {
    try {
      const studentId = req.user.id;
      const invoiceId = req.params.id;
      
      console.log('🔍 Downloading invoice:', invoiceId, 'for student:', studentId);

      // Verify invoice belongs to student
      const [invoiceRows] = await pool.execute(
        'SELECT * FROM invoices WHERE id = ? AND student_id = ?',
        [invoiceId, studentId]
      );

      if (invoiceRows.length === 0) {
        return res.status(404).json({ message: 'Invoice not found' });
      }

      // For now, return a simple PDF placeholder
      // In a real implementation, you would generate a PDF using a library like puppeteer or jsPDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoiceId}.pdf`);
      res.send(Buffer.from(`PDF content for invoice ${invoiceId} would be generated here`));
      
      console.log('✅ Invoice PDF generated for:', invoiceId);
    } catch (error) {
      console.error('Error in downloadInvoice:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}

export default StudentController;
