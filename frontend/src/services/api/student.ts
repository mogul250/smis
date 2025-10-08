import api, { handleApiResponse, validateRequiredFields, validateDateFormat, validateStudentStatus } from './config';
import {
  StudentProfile,
  UpdateStudentProfile,
  GradesResponse,
  AttendanceRecord,
  FeesResponse,
  TimetableEntry,
} from './types';

/**
 * Student API Module
 * Handles all student-related API calls
 * All endpoints require student authentication
 */
export class StudentAPI {
  /**
   * Get student profile
   * GET /api/students/profile
   */
  async getProfile(): Promise<StudentProfile> {
    const response = await api.get<StudentProfile>('/students/profile');
    return handleApiResponse(response);
  }

  /**
   * Update student profile
   * PUT /api/students/profile
   */
  async updateProfile(data: UpdateStudentProfile): Promise<{ message: string }> {
    // Validate optional fields if provided
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      throw new Error('Invalid email format');
    }

    if (data.date_of_birth && !validateDateFormat(data.date_of_birth)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD');
    }

    if (data.enrollment_date && !validateDateFormat(data.enrollment_date)) {
      throw new Error('Invalid enrollment date format. Use YYYY-MM-DD');
    }

    if (data.graduation_date && !validateDateFormat(data.graduation_date)) {
      throw new Error('Invalid graduation date format. Use YYYY-MM-DD');
    }

    if (data.department_id && (typeof data.department_id !== 'number' || data.department_id <= 0)) {
      throw new Error('Department ID must be a positive integer');
    }

    if (data.enrollment_year && (typeof data.enrollment_year !== 'number' || data.enrollment_year < 2000 || data.enrollment_year > new Date().getFullYear() + 10)) {
      throw new Error('Invalid enrollment year');
    }

    if (data.current_year && (typeof data.current_year !== 'number' || data.current_year < 1 || data.current_year > 10)) {
      throw new Error('Current year must be between 1 and 10');
    }

    if (data.status && !validateStudentStatus(data.status)) {
      throw new Error('Invalid status. Must be one of: active, inactive, graduated, suspended');
    }

    const response = await api.put<{ message: string }>('/students/profile', data);
    return handleApiResponse(response);
  }

  /**
   * Get student grades and GPA
   * GET /api/students/grades
   */
  async getGrades(): Promise<GradesResponse> {
    const response = await api.get<GradesResponse>('/students/grades');
    return handleApiResponse(response);
  }

  /**
   * Get student attendance records for a date range
   * GET /api/students/attendance?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
   */
  async getAttendance(startDate: string, endDate: string): Promise<AttendanceRecord[]> {
    // Validate required parameters
    if (!startDate || !endDate) {
      throw new Error('Start date and end date are required');
    }

    // Validate date formats
    if (!validateDateFormat(startDate)) {
      throw new Error('Invalid start date format. Use YYYY-MM-DD');
    }

    if (!validateDateFormat(endDate)) {
      throw new Error('Invalid end date format. Use YYYY-MM-DD');
    }

    // Validate date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      throw new Error('Start date must be before or equal to end date');
    }

    const response = await api.get<AttendanceRecord[]>(`/students/attendance?startDate=${startDate}&endDate=${endDate}`);
    return handleApiResponse(response);
  }

  /**
   * Get student fees and outstanding amount
   * GET /api/students/fees
   */
  async getFees(): Promise<FeesResponse> {
    const response = await api.get<FeesResponse>('/students/fees');
    return handleApiResponse(response);
  }

  /**
   * Get student timetable
   * GET /api/students/timetable?semester=string
   */
  async getTimetable(semester?: string): Promise<TimetableEntry[]> {
    let url = '/students/timetable';

    if (semester) {
      // Validate semester parameter
      if (typeof semester !== 'string' || semester.trim().length === 0) {
        throw new Error('Semester must be a non-empty string');
      }
      url += `?semester=${encodeURIComponent(semester.trim())}`;
    }
    // Note: If no semester is provided, backend will use default behavior

    const response = await api.get<TimetableEntry[]>(url);
    return handleApiResponse(response);
  }

  /**
   * Get student's department information
   * GET /api/students/department
   */
  async getDepartment(): Promise<any> {
    const response = await api.get('/students/department');
    return handleApiResponse(response);
  }

  /**
   * Get courses available in student's department
   * GET /api/students/courses
   */
  async getDepartmentCourses(): Promise<any[]> {
    const response = await api.get('/students/courses');
    return handleApiResponse(response);
  }

  /**
   * Get attendance summary for a specific period
   * Helper method that calculates attendance statistics
   */
  async getAttendanceSummary(startDate: string, endDate: string): Promise<{
    totalClasses: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    attendancePercentage: number;
    records: AttendanceRecord[];
  }> {
    const records = await this.getAttendance(startDate, endDate);
    
    const totalClasses = records.length;
    const presentCount = records.filter(r => r.status === 'present').length;
    const absentCount = records.filter(r => r.status === 'absent').length;
    const lateCount = records.filter(r => r.status === 'late').length;
    const attendancePercentage = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;

    return {
      totalClasses,
      presentCount,
      absentCount,
      lateCount,
      attendancePercentage,
      records,
    };
  }

  /**
   * Get current semester attendance (last 30 days)
   * Helper method for quick attendance check
   */
  async getCurrentSemesterAttendance(): Promise<{
    totalClasses: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    attendancePercentage: number;
    records: AttendanceRecord[];
  }> {
    const endDate = new Date().toISOString().split('T')[0]; // Today
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 30 days ago
    
    return this.getAttendanceSummary(startDate, endDate);
  }

  /**
   * Get outstanding fees summary
   * Helper method that calculates fee statistics
   */
  async getOutstandingFeesSummary(): Promise<{
    totalFees: number;
    paidFees: number;
    unpaidFees: number;
    totalOutstanding: number;
    overdueFees: number;
    fees: FeesResponse;
  }> {
    const fees = await this.getFees();
    
    const totalFees = fees.fees.length;
    const paidFees = fees.fees.filter(f => f.status === 'paid').length;
    const unpaidFees = fees.fees.filter(f => f.status === 'unpaid').length;
    
    // Calculate overdue fees (unpaid fees past due date)
    const today = new Date();
    const overdueFees = fees.fees.filter(f => 
      f.status === 'unpaid' && new Date(f.due_date) < today
    ).length;

    return {
      totalFees,
      paidFees,
      unpaidFees,
      totalOutstanding: fees.totalOutstanding,
      overdueFees,
      fees,
    };
  }
}

// Create singleton instance
const studentAPI = new StudentAPI();

// Export individual methods for backward compatibility
export const getProfile = () => studentAPI.getProfile();
export const updateProfile = (data: UpdateStudentProfile) => studentAPI.updateProfile(data);
export const getGrades = () => studentAPI.getGrades();
export const getAttendance = (startDate: string, endDate: string) => studentAPI.getAttendance(startDate, endDate);
export const getFees = () => studentAPI.getFees();
export const getTimetable = (semester?: string) => studentAPI.getTimetable(semester);
export const getAttendanceSummary = (startDate: string, endDate: string) => studentAPI.getAttendanceSummary(startDate, endDate);
export const getCurrentSemesterAttendance = () => studentAPI.getCurrentSemesterAttendance();
export const getOutstandingFeesSummary = () => studentAPI.getOutstandingFeesSummary();
export const getDepartment = () => studentAPI.getDepartment();
export const getDepartmentCourses = () => studentAPI.getDepartmentCourses();

// Export the class instance as default
export default studentAPI;
