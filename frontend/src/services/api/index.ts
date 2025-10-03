/**
 * SMIS API Integration Layer
 * 
 * This is the main entry point for all API interactions in the SMIS system.
 * It provides a clean, type-safe interface to the backend API with comprehensive
 * error handling, validation, and helper methods.
 * 
 * Features:
 * - Type-safe API calls with TypeScript
 * - Comprehensive error handling (400, 401, 403, 404, 500)
 * - Request/response interceptors
 * - Automatic token management
 * - Input validation
 * - Helper methods for common operations
 * - Proper pagination handling
 * 
 * Usage:
 * import { authAPI, studentAPI, teacherAPI, hodAPI, financeAPI, adminAPI, notificationsAPI } from '@/services/api';
 * 
 * // Login
 * const response = await authAPI.login({ email: 'user@example.com', password: 'password' });
 * 
 * // Get student profile
 * const profile = await studentAPI.getProfile();
 * 
 * // Mark attendance
 * await teacherAPI.markAttendance({ courseId: 1, attendance: [...], date: '2024-01-15' });
 */

// Import all API modules
import authAPI from './auth';
import studentAPI from './student';
import teacherAPI from './teacher';
import hodAPI from './hod';
import financeAPI from './finance';
import adminAPI from './admin';
import notificationsAPI from './notifications';

// Import configuration and utilities
import api, {
  handleApiResponse,
  createApiError,
  isApiError,
  getErrorMessage,
  isAuthenticated,
  getAuthToken,
  setAuthToken,
  clearAuthToken,
  pageToOffset,
  formatDateForApi,
  validateRequiredFields,
  validateEmail,
  validateDateFormat,
  validatePositiveNumber,
  validateYear,
  validateAttendanceStatus,
  validateUserRole,
  validateStudentStatus,
} from './config';

// Import all types
export * from './types';

// Export API modules
export {
  authAPI,
  studentAPI,
  teacherAPI,
  hodAPI,
  financeAPI,
  adminAPI,
  notificationsAPI,
};

// Export individual API methods for backward compatibility
export {
  // Auth API
  login,
  studentLogin,
  logout,
  getProfile,
  register,
  forgotPassword,
  resetPassword,
  isAuthenticated as isUserAuthenticated,
  getToken,
  clearAuth,
} from './auth';

export {
  // Student API
  getProfile as getStudentProfile,
  updateProfile as updateStudentProfile,
  getGrades,
  getAttendance,
  getFees,
  getTimetable as getStudentTimetable,
  getAttendanceSummary,
  getCurrentSemesterAttendance,
  getOutstandingFeesSummary,
} from './student';

export {
  // Teacher API
  getProfile as getTeacherProfile,
  updateProfile as updateTeacherProfile,
  getClasses,
  markAttendance,
  enterGrades,
  getTimetable as getTeacherTimetable,
  getClassStudents,
  getAllStudents as getAllTeacherStudents,
  getCourseStudents,
  markBulkAttendance,
  enterBulkGrades,
  getDaySchedule,
  getTodaySchedule,
} from './teacher';

export {
  // HOD API
  getDepartmentTeachers,
  approveActivity,
  generateReport,
  manageCourses as hodManageCourses,
  approveTimetable,
  getDepartmentStats,
  getDepartmentTimetable,
  addCourse,
  editCourse,
  deleteCourse,
  approveGrade,
  rejectGrade,
  approveTimetableById,
  rejectTimetable,
  generateAttendanceReport,
  generateGradesReport,
  getCurrentSemesterTimetable,
  getDepartmentOverview,
} from './hod';

export {
  // Finance API
  getStudentFees,
  createFee,
  markFeePaid,
  generateInvoice,
  getFinancialReports,
  getPaymentHistory,
  getOverdueFees,
  getStudentFeesSummary,
  getFinancialOverview,
  createTuitionFee,
  createLibraryFee,
  createExaminationFee,
  markFeePaidCash,
  markFeePaidBankTransfer,
  markFeePaidCard,
} from './finance';

export {
  // Admin API
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getAllStudents,
  getAllDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  manageCourses,
  manageAcademicCalendar,
  getAcademicCalendar,
  setupTimetable,
  getTimetable,
  getSystemStats,
} from './admin';

export {
  // Notifications API
  getNotifications,
  markAsRead,
  markAllAsRead,
  sendToUsers,
  sendToDepartment,
  sendToCourse,
  getUnreadCount,
  getRecentNotifications,
  sendDepartmentAnnouncement,
  sendAssignmentNotification,
  sendExamNotification,
  sendGradeNotification,
  sendFeeReminder,
  sendSystemAlert,
  markMultipleAsRead,
  getNotificationsByType,
  getUnreadNotifications,
} from './notifications';

// Export utilities
export {
  api,
  handleApiResponse,
  createApiError,
  isApiError,
  getErrorMessage,
  isAuthenticated,
  getAuthToken,
  setAuthToken,
  clearAuthToken,
  pageToOffset,
  formatDateForApi,
  validateRequiredFields,
  validateEmail,
  validateDateFormat,
  validatePositiveNumber,
  validateYear,
  validateAttendanceStatus,
  validateUserRole,
  validateStudentStatus,
};

/**
 * API Helper Class
 * Provides a unified interface for all API operations
 */
export class SMISAPI {
  public auth = authAPI;
  public student = studentAPI;
  public teacher = teacherAPI;
  public hod = hodAPI;
  public finance = financeAPI;
  public admin = adminAPI;
  public notifications = notificationsAPI;

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return isAuthenticated();
  }

  /**
   * Get current auth token
   */
  getToken(): string | null {
    return getAuthToken();
  }

  /**
   * Clear all authentication data
   */
  clearAuth(): void {
    clearAuthToken();
  }

  /**
   * Handle API errors consistently
   */
  handleError(error: any): string {
    return getErrorMessage(error);
  }

  /**
   * Format date for API consumption
   */
  formatDate(date: Date | string): string {
    return formatDateForApi(date);
  }

  /**
   * Convert page number to offset for admin endpoints
   */
  pageToOffset(page: number, limit: number): number {
    return pageToOffset(page, limit);
  }

  /**
   * Validate email format
   */
  validateEmail(email: string): boolean {
    return validateEmail(email);
  }

  /**
   * Validate date format (YYYY-MM-DD)
   */
  validateDate(date: string): boolean {
    return validateDateFormat(date);
  }

  /**
   * Validate positive number
   */
  validatePositiveNumber(value: any): boolean {
    return validatePositiveNumber(value);
  }

  /**
   * Validate year range
   */
  validateYear(year: number): boolean {
    return validateYear(year);
  }

  /**
   * Validate attendance status
   */
  validateAttendanceStatus(status: string): boolean {
    return validateAttendanceStatus(status);
  }

  /**
   * Validate user role
   */
  validateUserRole(role: string): boolean {
    return validateUserRole(role);
  }

  /**
   * Validate student status
   */
  validateStudentStatus(status: string): boolean {
    return validateStudentStatus(status);
  }
}

// Create and export singleton instance
export const smisAPI = new SMISAPI();

// Export as default
export default smisAPI;

/**
 * Quick Start Guide:
 * 
 * 1. Authentication:
 *    import { authAPI } from '@/services/api';
 *    const response = await authAPI.login({ email: 'user@example.com', password: 'password' });
 * 
 * 2. Student Operations:
 *    import { studentAPI } from '@/services/api';
 *    const profile = await studentAPI.getProfile();
 *    const grades = await studentAPI.getGrades();
 *    const attendance = await studentAPI.getAttendance('2024-01-01', '2024-01-31');
 * 
 * 3. Teacher Operations:
 *    import { teacherAPI } from '@/services/api';
 *    const classes = await teacherAPI.getClasses();
 *    await teacherAPI.markAttendance({
 *      courseId: 1,
 *      attendance: [{ studentId: 1, status: 'present' }],
 *      date: '2024-01-15'
 *    });
 * 
 * 4. Admin Operations:
 *    import { adminAPI } from '@/services/api';
 *    const users = await adminAPI.getAllUsers(1, 10, { role: 'student' });
 *    await adminAPI.createUser({
 *      firstName: 'John',
 *      lastName: 'Doe',
 *      email: 'john@example.com',
 *      password: 'password123',
 *      role: 'student',
 *      departmentId: 1
 *    });
 * 
 * 5. Error Handling:
 *    try {
 *      const result = await authAPI.login(credentials);
 *    } catch (error) {
 *      console.error('Login failed:', getErrorMessage(error));
 *      // Handle specific error types
 *      if (error.status === 401) {
 *        // Invalid credentials
 *      } else if (error.status === 500) {
 *        // Server error
 *      }
 *    }
 * 
 * 6. Using the unified API:
 *    import { smisAPI } from '@/services/api';
 *    const profile = await smisAPI.student.getProfile();
 *    const isAuth = smisAPI.isAuthenticated();
 */
