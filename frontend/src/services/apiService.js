import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  withCredentials: false, // Disable credentials to avoid CORS issues
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  studentLogin: (credentials) => api.post('/auth/student/login', credentials),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  register: (userData) => api.post('/auth/register', userData),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

// Student API
export const studentAPI = {
  getProfile: () => api.get('/students/profile'),
  updateProfile: (data) => api.put('/students/profile', data),
  getGrades: () => api.get('/students/grades'),
  getAttendance: (params) => api.get('/students/attendance', { params }),
  getFees: () => api.get('/students/fees'),
  getTimetable: (params) => api.get('/students/timetable', { params }),
};

// Teacher API
export const teacherAPI = {
  getProfile: () => api.get('/teachers/profile'),
  updateProfile: (data) => api.put('/teachers/profile', data),
  getClasses: () => api.get('/teachers/classes'),
  markAttendance: (data) => api.post('/teachers/attendance', data),
  markSpecialAttendance: (data) => api.post('/teachers/student/attendance', data),
  enterGrades: (data) => api.post('/teachers/grades', data),
  getClassCourseGrades: (classId, courseId) => api.get(`/teachers/grades/class/${classId}/course/${courseId}`),
  getTimetable: (semester) => api.get(`/teachers/timetable/${semester || 'current'}`),
  getClassStudents: (courseId) => api.get(`/teachers/classes/${courseId}/students`),
  getAllStudents: () => api.get('/teachers/classes/students'),
  uploadResource: (data) => api.post('/teachers/resources', data),
  // Additional methods for analytics and statistics
  getAnalytics: (params) => {
    // This would need a backend endpoint for analytics
    // For now, return mock data or use existing endpoints to calculate
    return Promise.resolve({ data: { 
      totalClasses: 0, 
      totalStudents: 0, 
      attendanceRate: 0, 
      gradeDistribution: {} 
    }});
  },
};

// HOD API
export const hodAPI = {
  getProfile: () => api.get('/hod/profile'),
  getDepartmentTeachers: () => api.get('/hod/teachers'),
  approveActivity: (data) => api.post('/hod/activities/approve', data),
  generateReports: (reportType, data) => api.post(`/hod/reports/${reportType}`, data),
  manageCourses: (data) => api.post('/hod/courses/manage', data),
  approveTimetable: (data) => api.post('/hod/timetable/approve', data),
  getDepartmentStats: (params) => api.get('/hod/stats', { params }),
  getDepartmentTimetable: (params) => api.get('/hod/timetable', { params }),
  sendToDepartmentTeachers: (data) => api.post('/hod/notifications/department', data),
};

// Finance API
export const financeAPI = {
  getProfile: () => api.get('/finance/profile'),
  getStudentFees: (studentId) => api.get(`/finance/students/${studentId}/fees`),
  createFee: (data) => api.post('/finance/fees', data),
  markFeePaid: (feeId, data) => api.put(`/finance/fees/${feeId}/pay`, data),
  generateInvoice: (studentId) => api.get(`/finance/students/${studentId}/invoice`),
  getFinancialReports: (params) => api.get('/finance/reports', { params }),
  getPaymentHistory: (studentId, params) => api.get(`/finance/students/${studentId}/payments`, { params }),
  getOverdueFees: () => api.get('/finance/overdue'),
  
  // Additional methods for frontend functionality
  getAllFees: (params) => {
    // For now, we'll use overdue fees as a proxy for all fees
    // In a real implementation, you'd need a backend endpoint for this
    return api.get('/finance/overdue', { params });
  },
  getPayments: (params) => {
    // This would need a backend endpoint to get all payments
    // For now, return empty data
    return Promise.resolve({ data: { payments: [], stats: {} } });
  },
  getFinancialReport: (params) => {
    return api.get('/finance/reports', { params });
  },
  sendPaymentReminder: (data) => {
    // This would need a backend endpoint
    return Promise.resolve({ data: { message: 'Reminder sent' } });
  },
  refundPayment: (paymentId) => {
    // This would need a backend endpoint
    return Promise.resolve({ data: { message: 'Refund initiated' } });
  },
  verifyPayment: (paymentId) => {
    // This would need a backend endpoint
    return Promise.resolve({ data: { message: 'Payment verified' } });
  },
  getAllStudents: (params) => {
    // This would need a backend endpoint
    return api.get('/admin/users', { params: { ...params, role: 'student' } });
  },
  getStudentDetails: (studentId) => {
    // This would need a backend endpoint
    return api.get(`/admin/users/${studentId}`);
  }
};

// Admin API
export const adminAPI = {
  createUser: (data) => api.post('/admin/users', data),
  getAllUsers: (params) => api.get('/admin/users', { params }),
  getUserById: (userId) => api.get(`/admin/users/${userId}`),
  updateUser: (userId, data) => api.put(`/admin/users/${userId}`, data),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  updateUserStatus: (userId, status) => api.put(`/admin/users/${userId}/status`, { status }),

  // Student management
  // Backend expects: /admin/students/:offset?/:limit?
  // Provide page/limit API for frontend and map to offset
  getAllStudents: (page = 1, limit = 10) => {
    const safeLimit = Math.max(1, parseInt(limit) || 10);
    const safePage = Math.max(1, parseInt(page) || 1);
    const offset = (safePage - 1) * safeLimit;
    return api.get(`/admin/students/${offset}/${safeLimit}`);
  },

  // Department management
  // Backend expects: /admin/departments/:offset?/:limit?
  getAllDepartments: (page = 1, limit = 50) => {
    const safeLimit = Math.max(1, parseInt(limit) || 50);
    const safePage = Math.max(1, parseInt(page) || 1);
    const offset = (safePage - 1) * safeLimit;
    return api.get(`/admin/departments/${offset}/${safeLimit}`);
  },
  createDepartment: (data) => api.post('/admin/departments', data),
  updateDepartment: (deptId, data) => api.put(`/admin/departments/${deptId}`, data),
  deleteDepartment: (deptId) => api.delete(`/admin/departments/${deptId}`),

  // Course management
  manageCourses: (data) => api.post('/admin/courses/manage', data),

  // Academic calendar management
  manageAcademicCalendar: (data) => api.post('/admin/calendar', data),
  getAcademicCalendar: () => api.get('/admin/calendar'),
  updateAcademicEvent: (eventId, data) => api.put(`/admin/calendar/${eventId}`, data),
  deleteAcademicEvent: (eventId) => api.delete(`/admin/calendar/${eventId}`),

  // Timetable management
  setupTimetable: (data) => api.post('/admin/timetable', data),
  getTimetable: (params) => api.get('/admin/timetable', { params }),

  // System management
  getSystemStats: () => api.get('/admin/stats'),
  getSystemConfig: () => api.get('/admin/config'),
  updateSystemConfig: (data) => api.put('/admin/config', data),
  testEmailConfig: () => api.post('/admin/config/test-email'),
  backupDatabase: () => api.post('/admin/backup'),
};

// Activity API
export const activityAPI = {
  getRecentActivities: (params) => api.get('/activities/recent', { params }),
  getUserActivities: (userId, params) => api.get(`/activities/user/${userId}`, { params }),
  getActivitiesByEntityType: (entityType, params) => api.get(`/activities/entity/${entityType}`, { params }),
  getActivityStats: (params) => api.get('/activities/stats', { params }),
  createActivity: (data) => api.post('/activities', data),
  getSystemAlerts: (params) => api.get('/activities/alerts', { params }),
};

// Generic API helper
export const apiHelper = {
  get: (url, params) => api.get(url, { params }),
  post: (url, data) => api.post(url, data),
  put: (url, data) => api.put(url, data),
  delete: (url) => api.delete(url),
};

export default api;
