
import { expect } from 'chai';
import sinon from 'sinon';
import Fee from '../../src/models/fee.js';
import pool from '../../src/config/database.js';

describe('Fee Model', () => {
  let poolStub;

  beforeEach(() => {
    poolStub = sinon.stub(pool);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('createFee', () => {
    it('should create a new fee successfully', async () => {
      const mockResult = { insertId: 1 };
      poolStub.execute.resolves([mockResult]);

      const feeData = {
        student_id: 1,
        fee_type: 'tuition',
        amount: 500.00,
        due_date: '2024-02-01',
        status: 'unpaid'
      };

      const result = await Fee.createFee(feeData);

      expect(result).to.equal(1);
      expect(poolStub.execute.calledWith(
        sinon.match.string,
        [1, 'tuition', 500.00, '2024-02-01', 'unpaid']
      )).to.be.true;
    });

    it('should create fee with default status unpaid', async () => {
      const mockResult = { insertId: 2 };
      poolStub.execute.resolves([mockResult]);

      const feeData = {
        student_id: 1,
        fee_type: 'library',
        amount: 50.00,
        due_date: '2024-03-01'
      };

      const result = await Fee.createFee(feeData);

      expect(result).to.equal(2);
      expect(poolStub.execute.calledWith(
        sinon.match.string,
        [1, 'library', 50.00, '2024-03-01', 'unpaid']
      )).to.be.true;
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      poolStub.execute.rejects(error);

      const feeData = {
        student_id: 1,
        fee_type: 'tuition',
        amount: 500.00,
        due_date: '2024-02-01'
      };

      try {
        await Fee.createFee(feeData);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err.message).to.equal('Error creating fee: Database connection failed');
      }
    });
  });

  describe('getFeesByStudent', () => {
    it('should get all fees for a student', async () => {
      const mockRows = [
        {
          id: 1,
          student_id: 1,
          fee_type: 'tuition',
          amount: 500.00,
          due_date: '2024-02-01',
          paid_date: null,
          status: 'unpaid',
          payment_method: null,
          transaction_id: null,
          created_at: '2024-01-01 10:00:00',
          updated_at: '2024-01-01 10:00:00'
        },
        {
          id: 2,
          student_id: 1,
          fee_type: 'library',
          amount: 50.00,
          due_date: '2024-03-01',
          paid_date: '2024-02-15',
          status: 'paid',
          payment_method: 'card',
          transaction_id: 'txn_123',
          created_at: '2024-01-01 10:00:00',
          updated_at: '2024-02-15 14:30:00'
        }
      ];

      poolStub.execute.resolves([mockRows]);

      const result = await Fee.getFeesByStudent(1);

      expect(result).to.have.lengthOf(2);
      expect(result[0]).to.be.instanceOf(Fee);
      expect(result[0].id).to.equal(1);
      expect(result[0].fee_type).to.equal('tuition');
      expect(result[1].status).to.equal('paid');
      expect(result[1].payment_method).to.equal('card');
      expect(poolStub.execute.calledWith(
        sinon.match.string,
        [1]
      )).to.be.true;
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      poolStub.execute.rejects(error);

      try {
        await Fee.getFeesByStudent(1);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err.message).to.equal('Error getting fees by student: Database connection failed');
      }
    });

    it('should return empty array when no fees found', async () => {
      poolStub.execute.resolves([[]]);

      const result = await Fee.getFeesByStudent(1);

      expect(result).to.be.an('array').that.is.empty;
    });
  });

  describe('markAsPaid', () => {
    it('should mark fee as paid successfully', async () => {
      const mockResult = { affectedRows: 1 };
      poolStub.execute.resolves([mockResult]);

      const paymentData = {
        paid_date: '2024-02-15',
        payment_method: 'card',
        transaction_id: 'txn_123'
      };

      const result = await Fee.markAsPaid(1, paymentData);

      expect(result).to.be.true;
      expect(poolStub.execute.calledWith(
        sinon.match.string,
        ['2024-02-15', 'card', 'txn_123', 1]
      )).to.be.true;
    });

    it('should return false when fee not found', async () => {
      const mockResult = { affectedRows: 0 };
      poolStub.execute.resolves([mockResult]);

      const paymentData = {
        paid_date: '2024-02-15',
        payment_method: 'cash',
        transaction_id: null
      };

      const result = await Fee.markAsPaid(999, paymentData);

      expect(result).to.be.false;
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      poolStub.execute.rejects(error);

      const paymentData = {
        paid_date: '2024-02-15',
        payment_method: 'bank_transfer',
        transaction_id: 'txn_456'
      };

      try {
        await Fee.markAsPaid(1, paymentData);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err.message).to.equal('Error marking fee as paid: Database connection failed');
      }
    });
  });

  describe('getOutstandingFees', () => {
    it('should get outstanding fees for a student', async () => {
      const mockRows = [
        {
          id: 1,
          student_id: 1,
          fee_type: 'tuition',
          amount: 500.00,
          due_date: '2024-02-01',
          status: 'unpaid',
          created_at: '2024-01-01 10:00:00'
        },
        {
          id: 3,
          student_id: 1,
          fee_type: 'exam',
          amount: 100.00,
          due_date: '2024-01-15',
          status: 'overdue',
          created_at: '2024-01-01 10:00:00'
        }
      ];

      poolStub.execute.resolves([mockRows]);

      const result = await Fee.getOutstandingFees(1);

      expect(result).to.have.lengthOf(2);
      expect(result[0]).to.be.instanceOf(Fee);
      expect(result[0].status).to.equal('unpaid');
      expect(result[1].status).to.equal('overdue');
      expect(poolStub.execute.calledWith(
        sinon.match.string,
        [1]
      )).to.be.true;
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      poolStub.execute.rejects(error);

      try {
        await Fee.getOutstandingFees(1);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err.message).to.equal('Error getting outstanding fees: Database connection failed');
      }
    });

    it('should return empty array when no outstanding fees', async () => {
      poolStub.execute.resolves([[]]);

      const result = await Fee.getOutstandingFees(1);

      expect(result).to.be.an('array').that.is.empty;
    });
  });

  describe('generateInvoice', () => {
    it('should generate invoice for outstanding fees', async () => {
      const mockOutstandingFees = [
        { id: 1, amount: 500.00, fee_type: 'tuition' },
        { id: 2, amount: 100.00, fee_type: 'library' }
      ];

      const getOutstandingFeesStub = sinon.stub(Fee, 'getOutstandingFees').resolves(mockOutstandingFees);

      const result = await Fee.generateInvoice(1);

      expect(result.student_id).to.equal(1);
      expect(result.fees).to.equal(mockOutstandingFees);
      expect(result.total_amount).to.equal(600.00);
      expect(result.generated_at).to.be.instanceOf(Date);

      getOutstandingFeesStub.restore();
    });

    it('should generate invoice with zero total when no outstanding fees', async () => {
      const getOutstandingFeesStub = sinon.stub(Fee, 'getOutstandingFees').resolves([]);

      const result = await Fee.generateInvoice(1);

      expect(result.student_id).to.equal(1);
      expect(result.fees).to.be.an('array').that.is.empty;
      expect(result.total_amount).to.equal(0);
      expect(result.generated_at).to.be.instanceOf(Date);

      getOutstandingFeesStub.restore();
    });
  });

  describe('updateOverdueFees', () => {
    it('should update overdue fees successfully', async () => {
      const mockResult = { affectedRows: 5 };
      poolStub.execute.resolves([mockResult]);

      const result = await Fee.updateOverdueFees();

      expect(result).to.equal(5);
      expect(poolStub.execute.calledWith(sinon.match.string)).to.be.true;
    });

    it('should return zero when no fees updated', async () => {
      const mockResult = { affectedRows: 0 };
      poolStub.execute.resolves([mockResult]);

      const result = await Fee.updateOverdueFees();

      expect(result).to.equal(0);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      poolStub.execute.rejects(error);

      try {
        await Fee.updateOverdueFees();
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err.message).to.equal('Error updating overdue fees: Database connection failed');
      }
    });
  });

  describe('getPaymentHistory', () => {
    it('should get payment history for a student', async () => {
      const mockRows = [
        {
          id: 2,
          student_id: 1,
          fee_type: 'library',
          amount: 50.00,
          paid_date: '2024-02-15',
          status: 'paid',
          payment_method: 'card',
          transaction_id: 'txn_123',
          created_at: '2024-01-01 10:00:00'
        },
        {
          id: 4,
          student_id: 1,
          fee_type: 'exam',
          amount: 75.00,
          paid_date: '2024-03-01',
          status: 'paid',
          payment_method: 'cash',
          transaction_id: null,
          created_at: '2024-01-01 10:00:00'
        }
      ];

      poolStub.execute.resolves([mockRows]);

      const result = await Fee.getPaymentHistory(1);

      expect(result).to.have.lengthOf(2);
      expect(result[0]).to.be.instanceOf(Fee);
      expect(result[0].paid_date).to.equal('2024-02-15');
      expect(result[0].payment_method).to.equal('card');
      expect(result[1].transaction_id).to.be.null;
      expect(poolStub.execute.calledWith(
        sinon.match.string,
        [1]
      )).to.be.true;
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      poolStub.execute.rejects(error);

      try {
        await Fee.getPaymentHistory(1);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err.message).to.equal('Error getting payment history: Database connection failed');
      }
    });

    it('should return empty array when no payment history', async () => {
      poolStub.execute.resolves([[]]);

      const result = await Fee.getPaymentHistory(1);

      expect(result).to.be.an('array').that.is.empty;
    });
  });

  describe('getTotalOutstanding', () => {
    it('should get total outstanding amount for a student', async () => {
      const mockRows = [{ total_outstanding: 650.00 }];
      poolStub.execute.resolves([mockRows]);

      const result = await Fee.getTotalOutstanding(1);

      expect(result).to.equal(650.00);
      expect(poolStub.execute.calledWith(
        sinon.match.string,
        [1]
      )).to.be.true;
    });

    it('should return zero when no outstanding fees', async () => {
      const mockRows = [{ total_outstanding: null }];
      poolStub.execute.resolves([mockRows]);

      const result = await Fee.getTotalOutstanding(1);

      expect(result).to.equal(0);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      poolStub.execute.rejects(error);

      try {
        await Fee.getTotalOutstanding(1);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err.message).to.equal('Error getting total outstanding: Database connection failed');
      }
    });
  });

  describe('Fee constructor', () => {
    it('should create Fee instance with all properties', () => {
      const data = {
        id: 1,
        student_id: 1,
        fee_type: 'tuition',
        amount: 500.00,
        due_date: '2024-02-01',
        paid_date: '2024-02-15',
        status: 'paid',
        payment_method: 'card',
        transaction_id: 'txn_123',
        created_at: '2024-01-01 10:00:00',
        updated_at: '2024-02-15 14:30:00'
      };

      const fee = new Fee(data);

      expect(fee.id).to.equal(1);
      expect(fee.student_id).to.equal(1);
      expect(fee.fee_type).to.equal('tuition');
      expect(fee.amount).to.equal(500.00);
      expect(fee.due_date).to.equal('2024-02-01');
      expect(fee.paid_date).to.equal('2024-02-15');
      expect(fee.status).to.equal('paid');
      expect(fee.payment_method).to.equal('card');
      expect(fee.transaction_id).to.equal('txn_123');
      expect(fee.created_at).to.equal('2024-01-01 10:00:00');
      expect(fee.updated_at).to.equal('2024-02-15 14:30:00');
    });

    it('should create Fee instance with minimal properties', () => {
      const data = {
        id: 2,
        student_id: 2,
        fee_type: 'library',
        amount: 50.00,
        due_date: '2024-03-01',
        status: 'unpaid'
      };

      const fee = new Fee(data);

      expect(fee.id).to.equal(2);
      expect(fee.student_id).to.equal(2);
      expect(fee.fee_type).to.equal('library');
      expect(fee.amount).to.equal(50.00);
      expect(fee.status).to.equal('unpaid');
      expect(fee.paid_date).to.be.undefined;
      expect(fee.payment_method).to.be.undefined;
      expect(fee.transaction_id).to.be.undefined;
    });
  });
});
