import Fee from '../models/fee.js';
import Student from '../models/student.js';
import pool from '../config/database.js';

class FinanceController {
  // Get student fees
  static async getStudentFees(req, res) {
    try {
      const { studentId } = req.params;

      // Validate student exists
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      const fees = await Fee.getFeesByStudent(studentId);
      res.json(fees);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Create new fee entry
  static async createFee(req, res) {
    try {
      const { studentId, amount, type, dueDate, description } = req.body;

      // Validate required fields
      if (!studentId || !amount || !type || !dueDate) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Validate student exists
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      const feeData = {
        student_id: studentId,
        fee_type: type,
        amount: parseFloat(amount),
        due_date: dueDate,
        status: 'unpaid'
      };

      const feeId = await Fee.createFee(feeData);
      res.status(201).json({ message: 'Fee created successfully', feeId });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Mark fee as paid
  static async markFeePaid(req, res) {
    try {
      const { feeId } = req.params;
      const { paymentMethod, transactionId, paymentDate } = req.body;

      if (!paymentMethod || !transactionId) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Default to today's date (YYYY-MM-DD) if not provided
      const paid_date = paymentDate
        ? paymentDate
        : new Date().toISOString().slice(0, 10);

      const success = await Fee.markAsPaid(feeId, {
        paid_date,
        payment_method: paymentMethod,
        transaction_id: transactionId
      });

      if (!success) {
        return res.status(404).json({ message: 'Fee not found or already paid' });
      }

      res.json({ message: 'Fee marked as paid successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Generate invoice for outstanding fees
  static async generateInvoice(req, res) {
    try {
      const { studentId } = req.params;

      // Validate student exists
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      const outstandingFees = await Fee.getOutstandingFees(studentId);
      if (outstandingFees.length === 0) {
        return res.status(404).json({ message: 'No outstanding fees found' });
      }

      // Calculate total amount
      const totalAmount = outstandingFees.reduce((sum, fee) => sum + parseFloat(fee.amount), 0);

      const invoice = {
        studentId,
        studentName: `${student.first_name} ${student.last_name}`,
        outstandingFees,
        totalAmount,
        generatedAt: new Date().toISOString()
      };

      res.json(invoice);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Get financial reports
  static async getFinancialReports(req, res) {
    try {
      const { reportType, startDate, endDate } = req.query;

      if (reportType) {
        let report = {};

        if (reportType === 'revenue') {
          // Revenue report - total fees collected
          const query = `
            SELECT
              SUM(amount) as total_revenue,
              COUNT(*) as total_transactions,
              AVG(amount) as average_fee_amount
            FROM fees
            WHERE status = 'paid' ${startDate ? 'AND paid_date >= ?' : ''} ${endDate ? 'AND paid_date <= ?' : ''}
          `;
          const params = [];
          if (startDate) params.push(startDate);
          if (endDate) params.push(endDate);
          const [rows] = await pool.execute(query, params);
          report.revenue = rows[0];
        } else if (reportType === 'outstanding') {
          // Outstanding fees report
          const query = `
            SELECT
              SUM(amount) as total_outstanding,
              COUNT(*) as outstanding_count,
              AVG(amount) as average_outstanding_amount
            FROM fees
            WHERE status = 'unpaid' ${startDate ? 'AND due_date >= ?' : ''} ${endDate ? 'AND due_date <= ?' : ''}
          `;
          const params = [];
          if (startDate) params.push(startDate);
          if (endDate) params.push(endDate);
          const [rows] = await pool.execute(query, params);
          report.outstanding = rows[0];
        } else if (reportType === 'fee_types') {
          // Fee types breakdown
          const query = `
            SELECT fee_type as type, SUM(amount) as total_amount, COUNT(*) as count
            FROM fees
            WHERE status = 'paid' ${startDate ? 'AND paid_date >= ?' : ''} ${endDate ? 'AND paid_date <= ?' : ''}
            GROUP BY fee_type
            ORDER BY total_amount DESC
          `;
          const params = [];
          if (startDate) params.push(startDate);
          if (endDate) params.push(endDate);
          const [rows] = await pool.execute(query, params);
          report.feeTypes = rows;
        }

        res.json({ reportType, report });
      } else {
        // Default summary report
        const revenueQuery = 'SELECT SUM(amount) as totalRevenue FROM fees WHERE status = "paid"';
        const outstandingQuery = 'SELECT SUM(amount) as outstandingFees FROM fees WHERE status = "unpaid"';

        const [revenueRows] = await pool.execute(revenueQuery);
        const [outstandingRows] = await pool.execute(outstandingQuery);

        res.json({
          totalRevenue: revenueRows[0].totalRevenue || 0,
          outstandingFees: outstandingRows[0].outstandingFees || 0
        });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Get payment history
  static async getPaymentHistory(req, res) {
    try {
      const { studentId } = req.params;
      const { limit = 10, offset = 0 } = req.query;

      // Validate student exists
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      // Coerce pagination to safe integers and inline into SQL to avoid driver issues with LIMIT/OFFSET placeholders
      const lim = Number.isFinite(Number(limit)) ? Math.max(0, parseInt(limit, 10)) : 10;
      const off = Number.isFinite(Number(offset)) ? Math.max(0, parseInt(offset, 10)) : 0;

      const query = `
        SELECT * FROM fees
        WHERE student_id = ? AND status = 'paid'
        ORDER BY paid_date DESC
        LIMIT ${lim} OFFSET ${off}
      `;
      const [rows] = await pool.execute(query, [studentId]);

      res.json(rows);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Get overdue fees
  static async getOverdueFees(req, res) {
    try {
      const query = `
        SELECT f.*,
               CONCAT(s.first_name, ' ', s.last_name) as student_name,
               DATEDIFF(CURDATE(), f.due_date) as days_overdue
        FROM fees f
        JOIN students s ON f.student_id = s.id
        WHERE f.status = 'unpaid' AND f.due_date < CURDATE()
        ORDER BY f.due_date ASC
      `;
      const [rows] = await pool.execute(query);

      res.json(rows);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Get all fees with filtering and pagination
  static async getAllFees(req, res) {
    try {
      const {
        search = '',
        status = 'all',
        feeType = 'all',
        page = 1,
        limit = 10
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      let whereConditions = [];
      let queryParams = [];

      // Build WHERE conditions
      if (search) {
        whereConditions.push(`(CONCAT(s.first_name, ' ', s.last_name) LIKE ? OR f.fee_type LIKE ?)`);
        queryParams.push(`%${search}%`, `%${search}%`);
      }

      if (status !== 'all') {
        whereConditions.push('f.status = ?');
        queryParams.push(status);
      }

      if (feeType !== 'all') {
        whereConditions.push('f.fee_type = ?');
        queryParams.push(feeType);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Get fees with student information
      const feesQuery = `
        SELECT f.*,
               CONCAT(s.first_name, ' ', s.last_name) as student_name,
               s.student_id as student_number,
               d.name as department_name
        FROM fees f
        JOIN students s ON f.student_id = s.id
        LEFT JOIN departments d ON s.department_id = d.id
        ${whereClause}
        ORDER BY f.created_at DESC
        LIMIT ${parseInt(limit)} OFFSET ${offset}
      `;

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM fees f
        JOIN students s ON f.student_id = s.id
        ${whereClause}
      `;

      // Get stats
      const statsQuery = `
        SELECT
          COUNT(*) as totalFees,
          SUM(CASE WHEN f.status = 'paid' THEN 1 ELSE 0 END) as paidFees,
          SUM(CASE WHEN f.status = 'unpaid' THEN 1 ELSE 0 END) as unpaidFees,
          SUM(CASE WHEN f.status = 'unpaid' AND f.due_date < CURDATE() THEN 1 ELSE 0 END) as overdueFees,
          SUM(f.amount) as totalAmount,
          SUM(CASE WHEN f.status = 'paid' THEN f.amount ELSE 0 END) as paidAmount,
          SUM(CASE WHEN f.status = 'unpaid' THEN f.amount ELSE 0 END) as outstandingAmount
        FROM fees f
        JOIN students s ON f.student_id = s.id
        ${whereClause}
      `;

      const [feesRows] = await pool.execute(feesQuery, queryParams);
      const [countRows] = await pool.execute(countQuery, queryParams);
      const [statsRows] = await pool.execute(statsQuery, queryParams);

      const total = countRows[0].total;
      const totalPages = Math.ceil(total / parseInt(limit));

      res.json({
        fees: feesRows,
        stats: statsRows[0],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: totalPages
        }
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Get all students for finance management
  static async getAllStudents(req, res) {
    try {
      const {
        search = '',
        status = 'all',
        year = 'all',
        page = 1,
        limit = 10
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      let whereConditions = [];
      let queryParams = [];

      // Build WHERE conditions
      if (search) {
        whereConditions.push(`(CONCAT(s.first_name, ' ', s.last_name) LIKE ? OR s.student_id LIKE ? OR s.email LIKE ?)`);
        queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      if (status !== 'all') {
        whereConditions.push('s.status = ?');
        queryParams.push(status);
      }

      if (year !== 'all') {
        whereConditions.push('YEAR(s.created_at) = ?');
        queryParams.push(year);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Get students with fee summary
      const studentsQuery = `
        SELECT s.*,
               d.name as department_name,
               COALESCE(fee_summary.total_fees, 0) as total_fees,
               COALESCE(fee_summary.paid_fees, 0) as paid_fees,
               COALESCE(fee_summary.unpaid_fees, 0) as unpaid_fees,
               COALESCE(fee_summary.total_amount, 0) as total_amount,
               COALESCE(fee_summary.outstanding_amount, 0) as outstanding_amount
        FROM students s
        LEFT JOIN departments d ON s.department_id = d.id
        LEFT JOIN (
          SELECT student_id,
                 COUNT(*) as total_fees,
                 SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_fees,
                 SUM(CASE WHEN status = 'unpaid' THEN 1 ELSE 0 END) as unpaid_fees,
                 SUM(amount) as total_amount,
                 SUM(CASE WHEN status = 'unpaid' THEN amount ELSE 0 END) as outstanding_amount
          FROM fees
          GROUP BY student_id
        ) fee_summary ON s.id = fee_summary.student_id
        ${whereClause}
        ORDER BY s.created_at DESC
        LIMIT ${parseInt(limit)} OFFSET ${offset}
      `;

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM students s
        ${whereClause}
      `;

      // Get stats
      const statsQuery = `
        SELECT
          COUNT(*) as totalStudents,
          SUM(CASE WHEN s.status = 'active' THEN 1 ELSE 0 END) as activeStudents,
          SUM(CASE WHEN s.status != 'active' THEN 1 ELSE 0 END) as inactiveStudents,
          COALESCE(SUM(CASE WHEN f.status = 'unpaid' THEN f.amount ELSE 0 END), 0) as totalOutstanding
        FROM students s
        LEFT JOIN fees f ON s.id = f.student_id
        ${whereClause}
      `;

      const [studentsRows] = await pool.execute(studentsQuery, queryParams);
      const [countRows] = await pool.execute(countQuery, queryParams);
      const [statsRows] = await pool.execute(statsQuery, queryParams);

      const total = countRows[0].total;
      const totalPages = Math.ceil(total / parseInt(limit));

      res.json({
        students: studentsRows,
        stats: statsRows[0],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: totalPages
        }
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Get all payments with filtering
  static async getPayments(req, res) {
    try {
      const {
        search = '',
        status = 'all',
        method = 'all',
        startDate = '',
        endDate = '',
        page = 1,
        limit = 10
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      let whereConditions = ['f.status = "paid"']; // Only show paid fees (payments)
      let queryParams = [];

      // Build WHERE conditions
      if (search) {
        whereConditions.push(`(CONCAT(s.first_name, ' ', s.last_name) LIKE ? OR f.transaction_id LIKE ?)`);
        queryParams.push(`%${search}%`, `%${search}%`);
      }

      if (method !== 'all') {
        whereConditions.push('f.payment_method = ?');
        queryParams.push(method);
      }

      if (startDate) {
        whereConditions.push('f.paid_date >= ?');
        queryParams.push(startDate);
      }

      if (endDate) {
        whereConditions.push('f.paid_date <= ?');
        queryParams.push(endDate);
      }

      const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

      // Get payments with student information
      const paymentsQuery = `
        SELECT f.*,
               CONCAT(s.first_name, ' ', s.last_name) as student_name,
               s.student_id as student_number,
               d.name as department_name
        FROM fees f
        JOIN students s ON f.student_id = s.id
        LEFT JOIN departments d ON s.department_id = d.id
        ${whereClause}
        ORDER BY f.paid_date DESC
        LIMIT ${parseInt(limit)} OFFSET ${offset}
      `;

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM fees f
        JOIN students s ON f.student_id = s.id
        ${whereClause}
      `;

      // Get stats
      const statsQuery = `
        SELECT
          COUNT(*) as totalPayments,
          SUM(f.amount) as totalAmount,
          COUNT(*) as successfulPayments,
          0 as failedPayments
        FROM fees f
        JOIN students s ON f.student_id = s.id
        ${whereClause}
      `;

      const [paymentsRows] = await pool.execute(paymentsQuery, queryParams);
      const [countRows] = await pool.execute(countQuery, queryParams);
      const [statsRows] = await pool.execute(statsQuery, queryParams);

      const total = countRows[0].total;
      const totalPages = Math.ceil(total / parseInt(limit));

      res.json({
        payments: paymentsRows,
        stats: statsRows[0],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: totalPages
        }
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Get finance user profile
  static async getProfile(req, res) {
    try {
      const userId = req.user.id; // From authentication middleware

      const query = `
        SELECT u.id, u.first_name, u.last_name, u.email, u.role, u.department_id,
               d.name as department_name
        FROM users u
        LEFT JOIN departments d ON u.department_id = d.id
        WHERE u.id = ?
      `;

      const [rows] = await pool.execute(query, [userId]);

      if (rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({
        user: rows[0]
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

export default FinanceController;
