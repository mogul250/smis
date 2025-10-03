import api, { 
  handleApiResponse, 
  validateRequiredFields, 
  validateDateFormat, 
  validateAttendanceStatus,
  validateYear,
  validatePositiveNumber 
} from './config';
import {
  TeacherProfile,
  UpdateTeacherProfile,
  Course,
  AttendanceData,
  AttendanceResponse,
  GradeData,
  GradeResponse,
  TimetableEntry,
  ClassStudent,
} from './types';

/**
 * Teacher API Module
 * Handles all teacher-related API calls
 * All endpoints require teacher authentication
 */
export class TeacherAPI {
  /**
   * Get teacher profile
   * GET /api/teacher/profile
   */
  async getProfile(): Promise<TeacherProfile> {
    const response = await api.get<TeacherProfile>('/teacher/profile');
    return handleApiResponse(response);
  }

  /**
   * Update teacher profile
   * PUT /api/teacher/profile
   */
  async updateProfile(data: UpdateTeacherProfile): Promise<{ message: string }> {
    // Validate optional fields if provided
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      throw new Error('Invalid email format');
    }

    if (data.department_id && !validatePositiveNumber(data.department_id)) {
      throw new Error('Department ID must be a positive integer');
    }

    if (data.first_name && typeof data.first_name !== 'string') {
      throw new Error('First name must be a string');
    }

    if (data.last_name && typeof data.last_name !== 'string') {
      throw new Error('Last name must be a string');
    }

    const response = await api.put<{ message: string }>('/teacher/profile', data);
    return handleApiResponse(response);
  }

  /**
   * Get classes assigned to teacher
   * GET /api/teacher/classes
   */
  async getClasses(): Promise<Course[]> {
    const response = await api.get<Course[]>('/teacher/classes');
    return handleApiResponse(response);
  }

  /**
   * Mark attendance for students
   * POST /api/teacher/attendance
   */
  async markAttendance(data: AttendanceData): Promise<AttendanceResponse> {
    // Validate required fields
    validateRequiredFields(data, ['courseId', 'attendance', 'date']);

    // Validate courseId
    if (!validatePositiveNumber(data.courseId)) {
      throw new Error('Course ID must be a positive integer');
    }

    // Validate date format
    if (!validateDateFormat(data.date)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD');
    }

    // Validate attendance array
    if (!Array.isArray(data.attendance) || data.attendance.length === 0) {
      throw new Error('Attendance array is required and must not be empty');
    }

    // Validate each attendance record
    data.attendance.forEach((record, index) => {
      if (!validatePositiveNumber(record.studentId)) {
        throw new Error(`Invalid student ID at index ${index}. Must be a positive integer`);
      }

      if (!validateAttendanceStatus(record.status)) {
        throw new Error(`Invalid attendance status at index ${index}. Must be one of: present, absent, late`);
      }

      // Notes are optional but should be string if provided
      if (record.notes && typeof record.notes !== 'string') {
        throw new Error(`Notes at index ${index} must be a string`);
      }
    });

    // Validate date is not in the future
    const attendanceDate = new Date(data.date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    if (attendanceDate > today) {
      throw new Error('Cannot mark attendance for future dates');
    }

    const response = await api.post<AttendanceResponse>('/teacher/attendance', data);
    return handleApiResponse(response);
  }

  /**
   * Enter grades for students
   * POST /api/teacher/grades
   */
  async enterGrades(data: GradeData): Promise<GradeResponse> {
    // Validate required fields
    validateRequiredFields(data, ['courseId', 'grades']);

    // Validate courseId
    if (!validatePositiveNumber(data.courseId)) {
      throw new Error('Course ID must be a positive integer');
    }

    // Validate grades array
    if (!Array.isArray(data.grades) || data.grades.length === 0) {
      throw new Error('Grades array is required and must not be empty');
    }

    // Validate each grade record
    data.grades.forEach((record, index) => {
      validateRequiredFields(record, ['studentId', 'grade', 'semester', 'year']);

      if (!validatePositiveNumber(record.studentId)) {
        throw new Error(`Invalid student ID at index ${index}. Must be a positive integer`);
      }

      if (typeof record.grade !== 'string' || record.grade.trim().length === 0) {
        throw new Error(`Grade at index ${index} must be a non-empty string`);
      }

      if (typeof record.semester !== 'string' || record.semester.trim().length === 0) {
        throw new Error(`Semester at index ${index} must be a non-empty string`);
      }

      if (!validateYear(record.year)) {
        throw new Error(`Invalid year at index ${index}. Must be between 2000 and ${new Date().getFullYear() + 10}`);
      }

      // Comments are optional but should be string if provided
      if (record.comments && typeof record.comments !== 'string') {
        throw new Error(`Comments at index ${index} must be a string`);
      }
    });

    const response = await api.post<GradeResponse>('/teacher/grades', data);
    return handleApiResponse(response);
  }

  /**
   * Get teacher timetable
   * GET /api/teacher/timetable?semester=string
   */
  async getTimetable(semester?: string): Promise<TimetableEntry[]> {
    let url = '/teacher/timetable';
    
    if (semester) {
      // Validate semester parameter
      if (typeof semester !== 'string' || semester.trim().length === 0) {
        throw new Error('Semester must be a non-empty string');
      }
      url += `?semester=${encodeURIComponent(semester.trim())}`;
    }

    const response = await api.get<TimetableEntry[]>(url);
    return handleApiResponse(response);
  }

  /**
   * Get students in teacher's classes
   * GET /api/teacher/classes/:courseId?/students
   */
  async getClassStudents(courseId?: number): Promise<ClassStudent[]> {
    let url = '/teacher/classes';
    
    if (courseId) {
      // Validate courseId
      if (!validatePositiveNumber(courseId)) {
        throw new Error('Course ID must be a positive integer');
      }
      url += `/${courseId}`;
    }
    
    url += '/students';

    const response = await api.get<ClassStudent[]>(url);
    return handleApiResponse(response);
  }

  /**
   * Get all students across all teacher's classes
   * Helper method for getting all students
   */
  async getAllStudents(): Promise<ClassStudent[]> {
    return this.getClassStudents();
  }

  /**
   * Get students for a specific course
   * Helper method for getting course-specific students
   */
  async getCourseStudents(courseId: number): Promise<ClassStudent[]> {
    return this.getClassStudents(courseId);
  }

  /**
   * Mark attendance for all students in a class
   * Helper method for bulk attendance marking
   */
  async markBulkAttendance(
    courseId: number,
    date: string,
    defaultStatus: 'present' | 'absent' | 'late' = 'present',
    studentOverrides?: { studentId: number; status: 'present' | 'absent' | 'late'; notes?: string }[]
  ): Promise<AttendanceResponse> {
    // Get all students for the course
    const students = await this.getCourseStudents(courseId);
    
    // Create attendance records
    const attendance = students.map(student => {
      // Check if there's an override for this student
      const override = studentOverrides?.find(o => o.studentId === student.id);
      
      return {
        studentId: student.id,
        status: override?.status || defaultStatus,
        notes: override?.notes || '',
      };
    });

    return this.markAttendance({
      courseId,
      attendance,
      date,
    });
  }

  /**
   * Enter grades for all students in a class
   * Helper method for bulk grade entry
   */
  async enterBulkGrades(
    courseId: number,
    semester: string,
    year: number,
    grades: { studentId: number; grade: string; comments?: string }[]
  ): Promise<GradeResponse> {
    // Validate required parameters
    if (!validatePositiveNumber(courseId)) {
      throw new Error('Course ID must be a positive integer');
    }

    if (typeof semester !== 'string' || semester.trim().length === 0) {
      throw new Error('Semester must be a non-empty string');
    }

    if (!validateYear(year)) {
      throw new Error(`Invalid year. Must be between 2000 and ${new Date().getFullYear() + 10}`);
    }

    if (!Array.isArray(grades) || grades.length === 0) {
      throw new Error('Grades array is required and must not be empty');
    }

    // Format grades for API
    const formattedGrades = grades.map(g => ({
      studentId: g.studentId,
      grade: g.grade,
      semester,
      year,
      comments: g.comments || '',
    }));

    return this.enterGrades({
      courseId,
      grades: formattedGrades,
    });
  }

  /**
   * Get teacher's schedule for a specific day
   * Helper method for daily schedule
   */
  async getDaySchedule(dayOfWeek: number, semester?: string): Promise<TimetableEntry[]> {
    if (typeof dayOfWeek !== 'number' || dayOfWeek < 1 || dayOfWeek > 7) {
      throw new Error('Day of week must be a number between 1 (Monday) and 7 (Sunday)');
    }

    const timetable = await this.getTimetable(semester);
    return timetable.filter(entry => entry.day_of_week === dayOfWeek);
  }

  /**
   * Get today's schedule
   * Helper method for current day schedule
   */
  async getTodaySchedule(semester?: string): Promise<TimetableEntry[]> {
    const today = new Date();
    const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay(); // Convert Sunday from 0 to 7
    return this.getDaySchedule(dayOfWeek, semester);
  }
}

// Create singleton instance
const teacherAPI = new TeacherAPI();

// Export individual methods for backward compatibility
export const getProfile = () => teacherAPI.getProfile();
export const updateProfile = (data: UpdateTeacherProfile) => teacherAPI.updateProfile(data);
export const getClasses = () => teacherAPI.getClasses();
export const markAttendance = (data: AttendanceData) => teacherAPI.markAttendance(data);
export const enterGrades = (data: GradeData) => teacherAPI.enterGrades(data);
export const getTimetable = (semester?: string) => teacherAPI.getTimetable(semester);
export const getClassStudents = (courseId?: number) => teacherAPI.getClassStudents(courseId);
export const getAllStudents = () => teacherAPI.getAllStudents();
export const getCourseStudents = (courseId: number) => teacherAPI.getCourseStudents(courseId);
export const markBulkAttendance = (
  courseId: number,
  date: string,
  defaultStatus?: 'present' | 'absent' | 'late',
  studentOverrides?: Parameters<typeof teacherAPI.markBulkAttendance>[3]
) => teacherAPI.markBulkAttendance(courseId, date, defaultStatus, studentOverrides);
export const enterBulkGrades = (
  courseId: number,
  semester: string,
  year: number,
  grades: Parameters<typeof teacherAPI.enterBulkGrades>[3]
) => teacherAPI.enterBulkGrades(courseId, semester, year, grades);
export const getDaySchedule = (dayOfWeek: number, semester?: string) => teacherAPI.getDaySchedule(dayOfWeek, semester);
export const getTodaySchedule = (semester?: string) => teacherAPI.getTodaySchedule(semester);

// Export the class instance as default
export default teacherAPI;
