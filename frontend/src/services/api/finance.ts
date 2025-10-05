import api, { 
  handleApiResponse, 
  validateRequiredFields, 
  validatePositiveNumber,
  validateDateFormat 
} from './config';
import {
  Fee,
  CreateFeeData,
  PaymentData,
  Invoice,
  FinancialReport,
  PaymentHistoryEntry,
  OverdueFee,
} from './types';

/**
 * Finance API Module
 * Handles all finance-related API calls
 * All endpoints require finance role authentication
 */
export class FinanceAPI {
  /**
   * Get student fees
   * GET /api/finance/students/:studentId/fees
   */
  async getStudentFees(studentId: number): Promise<Fee[]> {
    // Validate studentId
    if (!validatePositiveNumber(studentId)) {
      throw new Error('Student ID must be a positive integer');
    }

    const response = await api.get<Fee[]>(`/finance/students/${studentId}/fees`);
    return handleApiResponse(response);
  }

  /**
   * Create new fee
   * POST /api/finance/fees
   */
  async createFee(data: CreateFeeData): Promise<{ message: string; feeId: number }> {
    // Validate required fields
    validateRequiredFields(data, ['studentId', 'amount', 'type', 'dueDate']);

    // Validate studentId
    if (!validatePositiveNumber(data.studentId)) {
      throw new Error('Student ID must be a positive integer');
    }

    // Validate amount
    if (!validatePositiveNumber(data.amount)) {
      throw new Error('Amount must be a positive number');
    }

    // Validate type
    if (typeof data.type !== 'string' || data.type.trim().length === 0) {
      throw new Error('Fee type must be a non-empty string');
    }

    // Validate dueDate
    if (!validateDateFormat(data.dueDate)) {
      throw new Error('Invalid due date format. Use YYYY-MM-DD');
    }

    // Validate due date is not in the past
    const dueDate = new Date(data.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    if (dueDate < today) {
      throw new Error('Due date cannot be in the past');
    }

    // Validate description if provided
    if (data.description && typeof data.description !== 'string') {
      throw new Error('Description must be a string');
    }

    const response = await api.post<{ message: string; feeId: number }>('/finance/fees', data);
    return handleApiResponse(response);
  }

  /**
   * Mark fee as paid
   * PUT /api/finance/fees/:feeId/pay
   */
  async markFeePaid(feeId: number, data: PaymentData): Promise<{ message: string }> {
    // Validate feeId
    if (!validatePositiveNumber(feeId)) {
      throw new Error('Fee ID must be a positive integer');
    }

    // Validate required fields
    validateRequiredFields(data, ['paymentMethod', 'transactionId']);

    // Validate paymentMethod
    if (typeof data.paymentMethod !== 'string' || data.paymentMethod.trim().length === 0) {
      throw new Error('Payment method must be a non-empty string');
    }

    // Validate transactionId
    if (typeof data.transactionId !== 'string' || data.transactionId.trim().length === 0) {
      throw new Error('Transaction ID must be a non-empty string');
    }

    // Validate paymentDate if provided
    if (data.paymentDate) {
      if (!validateDateFormat(data.paymentDate)) {
        throw new Error('Invalid payment date format. Use YYYY-MM-DD');
      }

      // Validate payment date is not in the future
      const paymentDate = new Date(data.paymentDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      if (paymentDate > today) {
        throw new Error('Payment date cannot be in the future');
      }
    }

    const response = await api.put<{ message: string }>(`/finance/fees/${feeId}/pay`, data);
    return handleApiResponse(response);
  }

  /**
   * Generate invoice for student
   * GET /api/finance/students/:studentId/invoice
   */
  async generateInvoice(studentId: number): Promise<Invoice> {
    // Validate studentId
    if (!validatePositiveNumber(studentId)) {
      throw new Error('Student ID must be a positive integer');
    }

    const response = await api.get<Invoice>(`/finance/students/${studentId}/invoice`);
    return handleApiResponse(response);
  }

  /**
   * Get financial reports
   * GET /api/finance/reports?reportType=string&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
   */
  async getFinancialReports(params: {
    reportType?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<FinancialReport> {
    // Validate reportType if provided
    if (params.reportType && (typeof params.reportType !== 'string' || params.reportType.trim().length === 0)) {
      throw new Error('Report type must be a non-empty string');
    }

    // Validate date formats if provided
    if (params.startDate && !validateDateFormat(params.startDate)) {
      throw new Error('Invalid start date format. Use YYYY-MM-DD');
    }

    if (params.endDate && !validateDateFormat(params.endDate)) {
      throw new Error('Invalid end date format. Use YYYY-MM-DD');
    }

    // Validate date range if both dates provided
    if (params.startDate && params.endDate) {
      const startDate = new Date(params.startDate);
      const endDate = new Date(params.endDate);
      if (startDate > endDate) {
        throw new Error('Start date must be before or equal to end date');
      }
    }

    const response = await api.get<FinancialReport>('/finance/reports', { params });
    return handleApiResponse(response);
  }

  /**
   * Get payment history for student
   * GET /api/finance/students/:studentId/payments?limit=10&offset=0
   */
  async getPaymentHistory(
    studentId: number,
    limit: number = 10,
    offset: number = 0
  ): Promise<PaymentHistoryEntry[]> {
    // Validate studentId
    if (!validatePositiveNumber(studentId)) {
      throw new Error('Student ID must be a positive integer');
    }

    // Validate limit
    if (!validatePositiveNumber(limit) || limit > 100) {
      throw new Error('Limit must be a positive integer not exceeding 100');
    }

    // Validate offset
    if (typeof offset !== 'number' || offset < 0) {
      throw new Error('Offset must be a non-negative integer');
    }

    const response = await api.get<PaymentHistoryEntry[]>(
      `/finance/students/${studentId}/payments`,
      { params: { limit, offset } }
    );
    return handleApiResponse(response);
  }

  /**
   * Get overdue fees
   * GET /api/finance/overdue
   */
  async getOverdueFees(): Promise<OverdueFee[]> {
    const response = await api.get<OverdueFee[]>('/finance/overdue');
    return handleApiResponse(response);
  }

  /**
   * Get all fees for a student with summary
   * Helper method that combines fees and calculates summary
   */
  async getStudentFeesSummary(studentId: number): Promise<{
    fees: Fee[];
    totalFees: number;
    paidFees: number;
    unpaidFees: number;
    totalAmount: number;
    paidAmount: number;
    outstandingAmount: number;
    overdueFees: number;
  }> {
    const fees = await this.getStudentFees(studentId);
    
    const totalFees = fees.length;
    const paidFees = fees.filter(f => f.status === 'paid').length;
    const unpaidFees = fees.filter(f => f.status === 'unpaid').length;
    
    const totalAmount = fees.reduce((sum, f) => sum + f.amount, 0);
    const paidAmount = fees.filter(f => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0);
    const outstandingAmount = totalAmount - paidAmount;
    
    // Calculate overdue fees (unpaid fees past due date)
    const today = new Date();
    const overdueFees = fees.filter(f => 
      f.status === 'unpaid' && new Date(f.due_date) < today
    ).length;

    return {
      fees,
      totalFees,
      paidFees,
      unpaidFees,
      totalAmount,
      paidAmount,
      outstandingAmount,
      overdueFees,
    };
  }

  /**
   * Get financial overview
   * Helper method that provides overall financial statistics
   */
  async getFinancialOverview(): Promise<{
    overdueFees: OverdueFee[];
    totalOverdue: number;
    totalOverdueAmount: number;
    reports: FinancialReport;
  }> {
    const [overdueFees, reports] = await Promise.all([
      this.getOverdueFees(),
      this.getFinancialReports(),
    ]);

    const totalOverdue = overdueFees.length;
    const totalOverdueAmount = overdueFees.reduce((sum, f) => sum + f.amount, 0);

    return {
      overdueFees,
      totalOverdue,
      totalOverdueAmount,
      reports,
    };
  }

  /**
   * Create tuition fee for student
   * Helper method for creating tuition fees
   */
  async createTuitionFee(
    studentId: number,
    amount: number,
    dueDate: string,
    description?: string
  ): Promise<{ message: string; feeId: number }> {
    return this.createFee({
      studentId,
      amount,
      type: 'Tuition',
      dueDate,
      description: description || 'Tuition fee',
    });
  }

  /**
   * Create library fee for student
   * Helper method for creating library fees
   */
  async createLibraryFee(
    studentId: number,
    amount: number,
    dueDate: string,
    description?: string
  ): Promise<{ message: string; feeId: number }> {
    return this.createFee({
      studentId,
      amount,
      type: 'Library',
      dueDate,
      description: description || 'Library fee',
    });
  }

  /**
   * Create examination fee for student
   * Helper method for creating examination fees
   */
  async createExaminationFee(
    studentId: number,
    amount: number,
    dueDate: string,
    description?: string
  ): Promise<{ message: string; feeId: number }> {
    return this.createFee({
      studentId,
      amount,
      type: 'Examination',
      dueDate,
      description: description || 'Examination fee',
    });
  }

  /**
   * Mark fee as paid with cash payment
   * Helper method for cash payments
   */
  async markFeePaidCash(
    feeId: number,
    transactionId: string,
    paymentDate?: string
  ): Promise<{ message: string }> {
    return this.markFeePaid(feeId, {
      paymentMethod: 'Cash',
      transactionId,
      paymentDate,
    });
  }

  /**
   * Mark fee as paid with bank transfer
   * Helper method for bank transfer payments
   */
  async markFeePaidBankTransfer(
    feeId: number,
    transactionId: string,
    paymentDate?: string
  ): Promise<{ message: string }> {
    return this.markFeePaid(feeId, {
      paymentMethod: 'Bank Transfer',
      transactionId,
      paymentDate,
    });
  }

  /**
   * Mark fee as paid with card payment
   * Helper method for card payments
   */
  async markFeePaidCard(
    feeId: number,
    transactionId: string,
    paymentDate?: string
  ): Promise<{ message: string }> {
    return this.markFeePaid(feeId, {
      paymentMethod: 'Card',
      transactionId,
      paymentDate,
    });
  }

  /**
   * Get all fees with filtering and pagination
   * GET /api/finance/fees
   */
  async getAllFees(params?: {
    search?: string;
    status?: string;
    feeType?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    fees: Fee[];
    stats: {
      totalFees: number;
      paidFees: number;
      unpaidFees: number;
      overdueFees: number;
      totalAmount: number;
      paidAmount: number;
      outstandingAmount: number;
    };
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const queryParams = new URLSearchParams();

    if (params?.search) queryParams.append('search', params.search);
    if (params?.status && params.status !== 'all') queryParams.append('status', params.status);
    if (params?.feeType && params.feeType !== 'all') queryParams.append('feeType', params.feeType);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await api.get<{
      fees: Fee[];
      stats: any;
      pagination?: any;
    }>(`/finance/fees?${queryParams.toString()}`);
    return handleApiResponse(response);
  }

  /**
   * Get all students for finance management
   * GET /api/finance/students
   */
  async getAllStudents(params?: {
    search?: string;
    status?: string;
    year?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    students: any[];
    stats: {
      totalStudents: number;
      activeStudents: number;
      inactiveStudents: number;
      totalOutstanding: number;
    };
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const queryParams = new URLSearchParams();

    if (params?.search) queryParams.append('search', params.search);
    if (params?.status && params.status !== 'all') queryParams.append('status', params.status);
    if (params?.year && params.year !== 'all') queryParams.append('year', params.year);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await api.get<{
      students: any[];
      stats: any;
      pagination?: any;
    }>(`/finance/students?${queryParams.toString()}`);
    return handleApiResponse(response);
  }

  /**
   * Get all payments with filtering
   * GET /api/finance/payments
   */
  async getPayments(params?: {
    search?: string;
    status?: string;
    method?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    payments: PaymentHistoryEntry[];
    stats: {
      totalPayments: number;
      totalAmount: number;
      successfulPayments: number;
      failedPayments: number;
    };
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const queryParams = new URLSearchParams();

    if (params?.search) queryParams.append('search', params.search);
    if (params?.status && params.status !== 'all') queryParams.append('status', params.status);
    if (params?.method && params.method !== 'all') queryParams.append('method', params.method);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await api.get<{
      payments: PaymentHistoryEntry[];
      stats: any;
      pagination?: any;
    }>(`/finance/payments?${queryParams.toString()}`);
    return handleApiResponse(response);
  }

  /**
   * Get finance user profile
   * GET /api/finance/profile
   */
  async getProfile(): Promise<{
    user: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      role: string;
      department_id?: number;
      department_name?: string;
    };
  }> {
    const response = await api.get<{
      user: any;
    }>('/finance/profile');
    return handleApiResponse(response);
  }

  /**
   * Get all invoices with filtering
   * GET /api/finance/invoices
   */
  async getAllInvoices(params?: {
    search?: string;
    status?: string;
    dateRange?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    invoices: any[];
    stats: {
      totalInvoices: number;
      paidInvoices: number;
      pendingAmount: number;
      overdueInvoices: number;
    };
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const queryParams = new URLSearchParams();

    if (params?.search) queryParams.append('search', params.search);
    if (params?.status && params.status !== 'all') queryParams.append('status', params.status);
    if (params?.dateRange && params.dateRange !== 'all') queryParams.append('dateRange', params.dateRange);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await api.get<{
      invoices: any[];
      stats: any;
      pagination?: any;
    }>(`/finance/invoices?${queryParams.toString()}`);
    return handleApiResponse(response);
  }

  /**
   * Create new invoice
   * POST /api/finance/invoices
   */
  async createInvoice(invoiceData: {
    studentId: number;
    items: Array<{
      description: string;
      amount: number;
      quantity?: number;
    }>;
    dueDate: string;
    notes?: string;
  }): Promise<any> {
    const response = await api.post<any>('/finance/invoices', invoiceData);
    return handleApiResponse(response);
  }

  /**
   * Get invoice by ID
   * GET /api/finance/invoices/:id
   */
  async getInvoice(invoiceId: number): Promise<any> {
    const response = await api.get<any>(`/finance/invoices/${invoiceId}`);
    return handleApiResponse(response);
  }

  /**
   * Update invoice
   * PUT /api/finance/invoices/:id
   */
  async updateInvoice(invoiceId: number, invoiceData: any): Promise<any> {
    const response = await api.put<any>(`/finance/invoices/${invoiceId}`, invoiceData);
    return handleApiResponse(response);
  }

  /**
   * Send invoice to student
   * POST /api/finance/invoices/:id/send
   */
  async sendInvoice(invoiceId: number): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>(`/finance/invoices/${invoiceId}/send`);
    return handleApiResponse(response);
  }

  /**
   * Download invoice as PDF
   * GET /api/finance/invoices/:id/download
   */
  async downloadInvoice(invoiceId: number): Promise<Blob> {
    const response = await api.get(`/finance/invoices/${invoiceId}/download`, {
      responseType: 'blob'
    });
    return response.data;
  }

  /**
   * Delete invoice
   * DELETE /api/finance/invoices/:id
   */
  async deleteInvoice(invoiceId: number): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/finance/invoices/${invoiceId}`);
    return handleApiResponse(response);
  }

  /**
   * Mark invoice as paid
   * POST /api/finance/invoices/:id/mark-paid
   */
  async markInvoicePaid(invoiceId: number, paymentData?: {
    paymentMethod?: string;
    transactionId?: string;
    paidAmount?: number;
    paymentDate?: string;
  }): Promise<any> {
    const response = await api.post<any>(`/finance/invoices/${invoiceId}/mark-paid`, paymentData);
    return handleApiResponse(response);
  }
}

// Create singleton instance
const financeAPI = new FinanceAPI();

// Export individual methods for backward compatibility
export const getStudentFees = (studentId: number) => financeAPI.getStudentFees(studentId);
export const createFee = (data: CreateFeeData) => financeAPI.createFee(data);
export const markFeePaid = (feeId: number, data: PaymentData) => financeAPI.markFeePaid(feeId, data);
export const generateInvoice = (studentId: number) => financeAPI.generateInvoice(studentId);
export const getFinancialReports = (params?: Parameters<typeof financeAPI.getFinancialReports>[0]) => financeAPI.getFinancialReports(params);
export const getPaymentHistory = (studentId: number, limit?: number, offset?: number) => financeAPI.getPaymentHistory(studentId, limit, offset);
export const getOverdueFees = () => financeAPI.getOverdueFees();
export const getStudentFeesSummary = (studentId: number) => financeAPI.getStudentFeesSummary(studentId);
export const getFinancialOverview = () => financeAPI.getFinancialOverview();
export const createTuitionFee = (studentId: number, amount: number, dueDate: string, description?: string) => financeAPI.createTuitionFee(studentId, amount, dueDate, description);
export const createLibraryFee = (studentId: number, amount: number, dueDate: string, description?: string) => financeAPI.createLibraryFee(studentId, amount, dueDate, description);
export const createExaminationFee = (studentId: number, amount: number, dueDate: string, description?: string) => financeAPI.createExaminationFee(studentId, amount, dueDate, description);
export const markFeePaidCash = (feeId: number, transactionId: string, paymentDate?: string) => financeAPI.markFeePaidCash(feeId, transactionId, paymentDate);
export const markFeePaidBankTransfer = (feeId: number, transactionId: string, paymentDate?: string) => financeAPI.markFeePaidBankTransfer(feeId, transactionId, paymentDate);
export const markFeePaidCard = (feeId: number, transactionId: string, paymentDate?: string) => financeAPI.markFeePaidCard(feeId, transactionId, paymentDate);

// Export new methods
export const getAllFees = (params?: Parameters<typeof financeAPI.getAllFees>[0]) => financeAPI.getAllFees(params);
export const getAllStudents = (params?: Parameters<typeof financeAPI.getAllStudents>[0]) => financeAPI.getAllStudents(params);
export const getPayments = (params?: Parameters<typeof financeAPI.getPayments>[0]) => financeAPI.getPayments(params);
export const getProfile = () => financeAPI.getProfile();

// Invoice management exports
export const getAllInvoices = (params?: Parameters<typeof financeAPI.getAllInvoices>[0]) => financeAPI.getAllInvoices(params);
export const createInvoice = (invoiceData: Parameters<typeof financeAPI.createInvoice>[0]) => financeAPI.createInvoice(invoiceData);
export const getInvoice = (invoiceId: number) => financeAPI.getInvoice(invoiceId);
export const updateInvoice = (invoiceId: number, invoiceData: Parameters<typeof financeAPI.updateInvoice>[1]) => financeAPI.updateInvoice(invoiceId, invoiceData);
export const sendInvoice = (invoiceId: number) => financeAPI.sendInvoice(invoiceId);
export const downloadInvoice = (invoiceId: number) => financeAPI.downloadInvoice(invoiceId);
export const deleteInvoice = (invoiceId: number) => financeAPI.deleteInvoice(invoiceId);
export const markInvoicePaid = (invoiceId: number, paymentData?: Parameters<typeof financeAPI.markInvoicePaid>[1]) => financeAPI.markInvoicePaid(invoiceId, paymentData);

// Export the class instance as default
export default financeAPI;
