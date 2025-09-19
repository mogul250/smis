import pool from '../config/database.js';

class Fee {
  constructor(data) {
    this.id = data.id;
    this.student_id = data.student_id;
    this.fee_type = data.fee_type;
    this.amount = data.amount;
    this.due_date = data.due_date;
    this.paid_date = data.paid_date;
    this.status = data.status;
    this.payment_method = data.payment_method;
    this.transaction_id = data.transaction_id;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Create a new fee
  static async createFee(feeData) {
    const { student_id, fee_type, amount, due_date, status = 'unpaid' } = feeData;
    const query = `
      INSERT INTO fees (student_id, fee_type, amount, due_date, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const values = [student_id, fee_type, amount, due_date, status];

    try {
      const [result] = await pool.execute(query, values);
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating fee: ${error.message}`);
    }
  }

  // Get fees by student
  static async getFeesByStudent(studentId) {
    const query = `
      SELECT *
      FROM fees
      WHERE student_id = ?
      ORDER BY due_date DESC
    `;

    try {
      const [rows] = await pool.execute(query, [studentId]);
      return rows.map(row => new Fee(row));
    } catch (error) {
      throw new Error(`Error getting fees by student: ${error.message}`);
    }
  }

  // Mark fee as paid
  static async markAsPaid(id, paymentData) {
    if (!paymentData || Object.keys(paymentData).length === 0) return false;
    const allowedFields = ['paid_date', 'status', 'payment_method', 'transaction_id'];
    const setClauses = [];
    const values = [];
    for (const key of Object.keys(paymentData)) {
      if (!allowedFields.includes(key)) continue;
      setClauses.push(`${key} = ?`);
      values.push(paymentData[key]);
    }
    setClauses.push('updated_at = NOW()');
    const query = `UPDATE fees SET ${setClauses.join(', ')} WHERE id = ?`;
    values.push(id);
    try {
      const [result] = await pool.execute(query, values);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error marking fee as paid: ${error.message}`);
    }
  }

  // Get outstanding fees for a student
  static async getOutstandingFees(studentId) {
    const query = `
      SELECT * FROM fees
      WHERE student_id = ? AND status IN ('unpaid', 'overdue')
      ORDER BY due_date ASC
    `;

    try {
      const [rows] = await pool.execute(query, [studentId]);
      return rows.map(row => new Fee(row));
    } catch (error) {
      throw new Error(`Error getting outstanding fees: ${error.message}`);
    }
  }

  // Generate invoice for outstanding fees
  static async generateInvoice(studentId) {
    const outstandingFees = await this.getOutstandingFees(studentId);
    const totalAmount = outstandingFees.reduce((sum, fee) => sum + parseFloat(fee.amount), 0);

    return {
      student_id: studentId,
      fees: outstandingFees,
      total_amount: totalAmount,
      generated_at: new Date()
    };
  }

  // Update fee status to overdue if past due date
  static async updateOverdueFees() {
    const query = `
      UPDATE fees
      SET status = 'overdue', updated_at = NOW()
      WHERE status = 'unpaid' AND due_date < CURDATE()
    `;

    try {
      const [result] = await pool.execute(query);
      return result.affectedRows;
    } catch (error) {
      throw new Error(`Error updating overdue fees: ${error.message}`);
    }
  }

  // Get payment history for a student
  static async getPaymentHistory(studentId) {
    const query = `
      SELECT * FROM fees
      WHERE student_id = ? AND status = 'paid'
      ORDER BY paid_date DESC
    `;

    try {
      const [rows] = await pool.execute(query, [studentId]);
      return rows.map(row => new Fee(row));
    } catch (error) {
      throw new Error(`Error getting payment history: ${error.message}`);
    }
  }

  // Get total outstanding amount for a student
  static async getTotalOutstanding(studentId) {
    const query = `
      SELECT SUM(amount) as total_outstanding
      FROM fees
      WHERE student_id = ? AND status IN ('unpaid', 'overdue')
    `;

    try {
      const [rows] = await pool.execute(query, [studentId]);
      return rows[0].total_outstanding || 0;
    } catch (error) {
      throw new Error(`Error getting total outstanding: ${error.message}`);
    }
  }
}

export default Fee;
