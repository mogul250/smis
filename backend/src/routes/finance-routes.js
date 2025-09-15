import express from 'express';
import FinanceController from '../controllers/finance-controller.js';
import authenticate from '../middleware/auth-middleware.js';
import authorize from '../middleware/role-middleware.js';

const router = express.Router();

// All routes require authentication and finance role
router.use(authenticate);
router.use(authorize('finance'));

// Get student fees
router.get('/students/:studentId/fees', FinanceController.getStudentFees);

// Create new fee entry
router.post('/fees', FinanceController.createFee);

// Mark fee as paid
router.put('/fees/:feeId/pay', FinanceController.markFeePaid);

// Generate invoice
router.get('/students/:studentId/invoice', FinanceController.generateInvoice);

// Get financial reports
router.get('/reports', FinanceController.getFinancialReports);

// Get payment history
router.get('/students/:studentId/payments', FinanceController.getPaymentHistory);

// Get overdue fees
router.get('/overdue', FinanceController.getOverdueFees);

export default router;
