import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  withCredentials: true, // Include cookies for authentication
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
  enterGrades: (data) => api.post('/teachers/grades', data),
  getTimetable: (params) => api.get('/teachers/timetable', { params }),
  getClassStudents: (courseId) => api.get(`/teachers/classes/${courseId}/students`),
  getAllStudents: () => api.get('/teachers/classes/students'),
};

// HOD API
export const hodAPI = {
  getDepartmentTeachers: () => api.get('/hod/teachers'),
  approveActivity: (data) => api.post('/hod/approve', data),
  generateReports: (reportType, data) => api.post(`/hod/reports/${reportType}`, data),
  manageCourses: (data) => api.post('/hod/courses', data),
  approveTimetable: (data) => api.post('/hod/timetable/approve', data),
  getDepartmentStats: (params) => api.get('/hod/stats', { params }),
  getDepartmentTimetable: (params) => api.get('/hod/timetable', { params }),
};

// Finance API
export const financeAPI = {
  getStudentFees: (studentId) => api.get(`/finance/students/${studentId}/fees`),
  createFee: (data) => api.post('/finance/fees', data),
  markFeePaid: (feeId, data) => api.post(`/finance/fees/${feeId}/pay`, data),
  generateInvoice: (studentId) => api.get(`/finance/students/${studentId}/invoice`),
  getFinancialReports: (params) => api.get('/finance/reports', { params }),
  getPaymentHistory: (studentId, params) => api.get(`/finance/students/${studentId}/payments`, { params }),
  getOverdueFees: () => api.get('/finance/overdue'),
};

// Admin API
export const adminAPI = {
  createUser: (data) => api.post('/admin/users', data),
  getAllUsers: (params) => api.get('/admin/users', { params }),
  updateUser: (userId, data) => api.put(`/admin/users/${userId}`, data),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  manageAcademicCalendar: (data) => api.post('/admin/calendar', data),
  setupTimetable: (data) => api.post('/admin/timetable', data),
  getSystemStats: () => api.get('/admin/stats'),
};

// Generic API helper
export const apiHelper = {
  get: (url, params) => api.get(url, { params }),
  post: (url, data) => api.post(url, data),
  put: (url, data) => api.put(url, data),
  delete: (url) => api.delete(url),
};

export default api;
