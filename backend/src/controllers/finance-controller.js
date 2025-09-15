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
        amount: parseFloat(amount),
        type,
        due_date: dueDate,
        description: description || '',
        status: 'pending'
      };

      const feeId = await Fee.create(feeData);
      res.status(201).json({ message: 'Fee created successfully', feeId });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Mark fee as paid
  static async markFeePaid(req, res) {
    try {
      const { feeId } = req.params;
      const { paymentDate, transactionId } = req.body;

      const success = await Fee.markAsPaid(feeId, paymentDate, transactionId);
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
        studentName: `${student.user.first_name} ${student.user.last_name}`,
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
          WHERE status = 'pending' ${startDate ? 'AND due_date >= ?' : ''} ${endDate ? 'AND due_date <= ?' : ''}
        `;
        const params = [];
        if (startDate) params.push(startDate);
        if (endDate) params.push(endDate);
        const [rows] = await pool.execute(query, params);
        report.outstanding = rows[0];
      } else if (reportType === 'fee_types') {
        // Fee types breakdown
        const query = `
          SELECT type, SUM(amount) as total_amount, COUNT(*) as count
          FROM fees
          WHERE status = 'paid' ${startDate ? 'AND paid_date >= ?' : ''} ${endDate ? 'AND paid_date <= ?' : ''}
          GROUP BY type
          ORDER BY total_amount DESC
        `;
        const params = [];
        if (startDate) params.push(startDate);
        if (endDate) params.push(endDate);
        const [rows] = await pool.execute(query, params);
        report.feeTypes = rows;
      }

      res.json({ reportType, report });
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

      const query = `
        SELECT * FROM fees
        WHERE student_id = ? AND status = 'paid'
        ORDER BY paid_date DESC
        LIMIT ? OFFSET ?
      `;
      const [rows] = await pool.execute(query, [studentId, parseInt(limit), parseInt(offset)]);

      res.json(rows);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Get overdue fees
  static async getOverdueFees(req, res) {
    try {
      const query = `
        SELECT f.*, s.user_id,
               CONCAT(u.first_name, ' ', u.last_name) as student_name,
               DATEDIFF(CURDATE(), f.due_date) as days_overdue
        FROM fees f
        JOIN students s ON f.student_id = s.id
        JOIN users u ON s.user_id = u.id
        WHERE f.status = 'pending' AND f.due_date < CURDATE()
        ORDER BY f.due_date ASC
      `;
      const [rows] = await pool.execute(query);

      res.json(rows);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

export default FinanceController;
