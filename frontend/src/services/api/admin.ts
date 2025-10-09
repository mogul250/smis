import api, { 
  handleApiResponse, 
  validateRequiredFields, 
  validatePositiveNumber,
  validateEmail,
  validateUserRole,
  pageToOffset 
} from './config';
import {
  CreateUserData,
  UpdateUserData,
  User,
  UserFilters,
  UsersResponse,
  Student,
  Department,
  CreateDepartmentData,
  UpdateDepartmentData,
  ManageCourseData,
  CalendarEventData,
  TimetableData,
  TimetableParams,
  SystemStats,
} from './types';

/**
 * Admin API Module
 * Handles all admin-related API calls
 * All endpoints require admin role authentication
 * 
 * IMPORTANT: Admin endpoints use offset/limit path parameters, not query parameters
 * Pattern: /api/admin/resource/:offset/:limit
 */
export class AdminAPI {
  /**
   * Create new user
   * POST /api/admin/users
   */
  async createUser(userData: CreateUserData): Promise<{ message: string; userId: number }> {
    // Validate required fields
    validateRequiredFields(userData, ['firstName', 'lastName', 'email', 'password', 'role']);

    // Validate email format
    if (!validateEmail(userData.email)) {
      throw new Error('Invalid email format');
    }

    // Validate password length
    if (userData.password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    // Validate role
    if (!validateUserRole(userData.role)) {
      throw new Error('Invalid role. Must be one of: student, teacher, hod, finance, admin');
    }

    // Validate departmentId for students
    if (userData.role === 'student' && (!userData.departmentId || userData.departmentId === null)) {
      throw new Error('Department ID is required for students');
    }

    // Convert string departmentId to number if it's a string
    if (userData.departmentId && typeof userData.departmentId === 'string') {
      const deptId = parseInt(userData.departmentId, 10);
      if (isNaN(deptId) || deptId <= 0) {
        throw new Error('Department ID must be a positive integer');
      }
      userData.departmentId = deptId;
    }

    // Validate departmentId if provided
    if (userData.departmentId !== null && userData.departmentId !== undefined && !validatePositiveNumber(userData.departmentId)) {
      throw new Error('Department ID must be a positive integer');
    }

    // Validate additional data if provided
    if (userData.additionalData) {
      if (userData.additionalData.enrollmentYear && !validatePositiveNumber(userData.additionalData.enrollmentYear)) {
        throw new Error('Enrollment year must be a positive integer');
      }

      if (userData.additionalData.enrollmentDate && !/^\d{4}-\d{2}-\d{2}$/.test(userData.additionalData.enrollmentDate)) {
        throw new Error('Invalid enrollment date format. Use YYYY-MM-DD');
      }
    }

    const response = await api.post<{ message: string; userId: number }>('/admin/users', userData);
    return handleApiResponse(response);
  }

  /**
   * Get all users with filtering and pagination
   * GET /api/admin/users/:offset/:limit?role=string&departmentId=number&search=string
   * 
   * Note: Backend uses offset/limit path parameters, not query parameters
   */
  async getAllUsers(page: number = 1, limit: number = 10, filters?: UserFilters): Promise<UsersResponse> {
    // Validate pagination parameters
    if (!validatePositiveNumber(page)) {
      throw new Error('Page must be a positive integer');
    }

    if (!validatePositiveNumber(limit) || limit > 100) {
      throw new Error('Limit must be a positive integer not exceeding 100');
    }

    // Convert page to offset
    const offset = pageToOffset(page, limit);

    // Build URL with path parameters
    let url = `/admin/users/${offset}/${limit}`;

    // Add query parameters for filters
    const queryParams = new URLSearchParams();
    if (filters?.role) {
      if (!validateUserRole(filters.role)) {
        throw new Error('Invalid role filter');
      }
      queryParams.append('role', filters.role);
    }

    if (filters?.departmentId) {
      if (!validatePositiveNumber(filters.departmentId)) {
        throw new Error('Department ID filter must be a positive integer');
      }
      queryParams.append('departmentId', filters.departmentId.toString());
    }

    if (filters?.search) {
      if (typeof filters.search !== 'string' || filters.search.trim().length === 0) {
        throw new Error('Search filter must be a non-empty string');
      }
      queryParams.append('search', filters.search.trim());
    }

    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }

    const response = await api.get<UsersResponse>(url);
    return handleApiResponse(response);
  }

  /**
   * Get user by ID
   * GET /api/admin/users/by-id/:userId
   */
  async getUserById(userId: number): Promise<User> {
    // Validate userId
    if (!validatePositiveNumber(userId)) {
      throw new Error('User ID must be a positive integer');
    }

    const response = await api.get<User>(`/admin/users/by-id/${userId}`);
    return handleApiResponse(response);
  }

  /**
   * Update user status
   * PUT /api/admin/users/:userId
   */
  async updateUserStatus(userId: number, status: string): Promise<{ message: string }> {
    // Validate userId
    if (!validatePositiveNumber(userId)) {
      throw new Error('User ID must be a positive integer');
    }

    // Validate status
    const validStatuses = ['active', 'inactive', 'suspended', 'pending'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const response = await api.put<{ message: string }>(`/admin/users/${userId}`, { status });
    return handleApiResponse(response);
  }

  /**
   * Update user
   * PUT /api/admin/users/:userId
   */
  async updateUser(userId: number, userData: UpdateUserData): Promise<{ message: string }> {
    // Validate userId
    if (!validatePositiveNumber(userId)) {
      throw new Error('User ID must be a positive integer');
    }

    // Validate optional fields if provided
    if (userData.email && !validateEmail(userData.email)) {
      throw new Error('Invalid email format');
    }

    if (userData.role && !validateUserRole(userData.role)) {
      throw new Error('Invalid role. Must be one of: student, teacher, hod, finance, admin');
    }

    // Convert string departmentId to number if it's a string
    if (userData.departmentId && typeof userData.departmentId === 'string') {
      const deptId = parseInt(userData.departmentId, 10);
      if (isNaN(deptId) || deptId <= 0) {
        throw new Error('Department ID must be a positive integer');
      }
      userData.departmentId = deptId;
    }

    // Validate departmentId if provided
    if (userData.departmentId !== null && userData.departmentId !== undefined && !validatePositiveNumber(userData.departmentId)) {
      throw new Error('Department ID must be a positive integer');
    }

    if (userData.firstName && (typeof userData.firstName !== 'string' || userData.firstName.trim().length === 0)) {
      throw new Error('First name must be a non-empty string');
    }

    if (userData.lastName && (typeof userData.lastName !== 'string' || userData.lastName.trim().length === 0)) {
      throw new Error('Last name must be a non-empty string');
    }

    const response = await api.put<{ message: string }>(`/admin/users/${userId}`, userData);
    return handleApiResponse(response);
  }

  /**
   * Delete user
   * DELETE /api/admin/users/:userId
   */
  async deleteUser(userId: number): Promise<{ message: string }> {
    // Validate userId
    if (!validatePositiveNumber(userId)) {
      throw new Error('User ID must be a positive integer');
    }

    const response = await api.delete<{ message: string }>(`/admin/users/${userId}`);
    return handleApiResponse(response);
  }

  /**
   * Get all students with pagination
   * GET /api/admin/students/:offset/:limit
   */
  async getAllStudents(page: number = 1, limit: number = 10): Promise<Student[]> {
    // Validate pagination parameters
    if (!validatePositiveNumber(page)) {
      throw new Error('Page must be a positive integer');
    }

    if (!validatePositiveNumber(limit) || limit > 100) {
      throw new Error('Limit must be a positive integer not exceeding 100');
    }

    // Convert page to offset
    const offset = pageToOffset(page, limit);

    const response = await api.get<Student[]>(`/admin/students/${offset}/${limit}`);
    return handleApiResponse(response);
  }

  /**
   * Create new student
   * POST /api/admin/students
   */
  async createStudent(studentData: any): Promise<{ message: string; studentId: number }> {
    // Validate required fields
    validateRequiredFields(studentData, ['firstName', 'lastName', 'email', 'studentId', 'departmentId']);

    // Validate email format
    if (!validateEmail(studentData.email)) {
      throw new Error('Invalid email format');
    }

    // Validate department ID
    if (!validatePositiveNumber(studentData.departmentId)) {
      throw new Error('Department ID must be a positive integer');
    }

    const response = await api.post<{ message: string; studentId: number }>('/admin/students', studentData);
    return handleApiResponse(response);
  }

  /**
   * Update student
   * PUT /api/admin/students/:studentId
   */
  async updateStudent(studentId: number, studentData: any): Promise<{ message: string }> {
    // Validate studentId
    if (!validatePositiveNumber(studentId)) {
      throw new Error('Student ID must be a positive integer');
    }

    // Validate email format if provided
    if (studentData.email && !validateEmail(studentData.email)) {
      throw new Error('Invalid email format');
    }

    // Validate department ID if provided
    if (studentData.departmentId && !validatePositiveNumber(studentData.departmentId)) {
      throw new Error('Department ID must be a positive integer');
    }

    const response = await api.put<{ message: string }>(`/admin/students/${studentId}`, studentData);
    return handleApiResponse(response);
  }

  /**
   * Update student status
   * PUT /api/admin/students/:studentId/status
   */
  async updateStudentStatus(studentId: number, status: string): Promise<{ message: string }> {
    // Validate studentId
    if (!validatePositiveNumber(studentId)) {
      throw new Error('Student ID must be a positive integer');
    }

    // Validate status
    const validStatuses = ['active', 'inactive', 'suspended', 'graduated'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const response = await api.put<{ message: string }>(`/admin/students/${studentId}/status`, { status });
    return handleApiResponse(response);
  }

  /**
   * Delete student
   * DELETE /api/admin/students/:studentId
   */
  async deleteStudent(studentId: number): Promise<{ message: string }> {
    // Validate studentId
    if (!validatePositiveNumber(studentId)) {
      throw new Error('Student ID must be a positive integer');
    }

    const response = await api.delete<{ message: string }>(`/admin/students/${studentId}`);
    return handleApiResponse(response);
  }

  /**
   * Get all departments with pagination
   * GET /api/admin/departments/:offset/:limit
   */
  async getAllDepartments(page: number = 1, limit: number = 10): Promise<Department[]> {
    // Validate pagination parameters
    if (!validatePositiveNumber(page)) {
      throw new Error('Page must be a positive integer');
    }

    if (!validatePositiveNumber(limit) || limit > 100) {
      throw new Error('Limit must be a positive integer not exceeding 100');
    }

    // Convert page to offset
    const offset = pageToOffset(page, limit);

    const response = await api.get<Department[]>(`/admin/departments/${offset}/${limit}`);
    return handleApiResponse(response);
  }

  /**
   * Get department by ID
   * GET /api/admin/departments/:departmentId
   */
  async getDepartmentById(departmentId: number): Promise<Department> {
    // Validate departmentId
    if (!validatePositiveNumber(departmentId)) {
      throw new Error('Department ID must be a positive integer');
    }

    const response = await api.get<Department>(`/admin/departments/${departmentId}`);
    return handleApiResponse(response);
  }

  /**
   * Create new department
   * POST /api/admin/departments
   */
  async createDepartment(data: CreateDepartmentData): Promise<{ message: string; departmentId: number }> {
    // Validate required fields
    validateRequiredFields(data, ['name', 'code']);

    // Validate name
    if (typeof data.name !== 'string' || data.name.trim().length === 0) {
      throw new Error('Department name must be a non-empty string');
    }

    // Validate code
    if (typeof data.code !== 'string' || data.code.trim().length === 0) {
      throw new Error('Department code must be a non-empty string');
    }

    // Validate head_id if provided
    if (data.head_id && !validatePositiveNumber(data.head_id)) {
      throw new Error('Head ID must be a positive integer');
    }

    // Validate description if provided
    if (data.description && typeof data.description !== 'string') {
      throw new Error('Description must be a string');
    }

    const response = await api.post<{ message: string; departmentId: number }>('/admin/departments', data);
    return handleApiResponse(response);
  }

  /**
   * Update department
   * PUT /api/admin/departments/:deptId
   */
  async updateDepartment(deptId: number, data: UpdateDepartmentData): Promise<{ message: string }> {
    // Validate deptId
    if (!validatePositiveNumber(deptId)) {
      throw new Error('Department ID must be a positive integer');
    }

    // Validate optional fields if provided
    if (data.name && (typeof data.name !== 'string' || data.name.trim().length === 0)) {
      throw new Error('Department name must be a non-empty string');
    }

    if (data.code && (typeof data.code !== 'string' || data.code.trim().length === 0)) {
      throw new Error('Department code must be a non-empty string');
    }

    if (data.head_id && !validatePositiveNumber(data.head_id)) {
      throw new Error('Head ID must be a positive integer');
    }

    if (data.description && typeof data.description !== 'string') {
      throw new Error('Description must be a string');
    }

    const response = await api.put<{ message: string }>(`/admin/departments/${deptId}`, data);
    return handleApiResponse(response);
  }

  /**
   * Delete department
   * DELETE /api/admin/departments/:deptId
   */
  async deleteDepartment(deptId: number): Promise<{ message: string }> {
    // Validate deptId
    if (!validatePositiveNumber(deptId)) {
      throw new Error('Department ID must be a positive integer');
    }

    const response = await api.delete<{ message: string }>(`/admin/departments/${deptId}`);
    return handleApiResponse(response);
  }

  /**
   * Get students in a specific department
   * GET /api/admin/departments/:departmentId/students
   */
  async getDepartmentStudents(departmentId: number): Promise<{
    departmentId: number;
    departmentName: string;
    students: any[];
  }> {
    // Validate departmentId
    if (!validatePositiveNumber(departmentId)) {
      throw new Error('Department ID must be a positive integer');
    }

    const response = await api.get<{
      departmentId: number;
      departmentName: string;
      students: any[];
    }>(`/admin/departments/${departmentId}/students`);
    return handleApiResponse(response);
  }

  /**
   * Assign student to department
   * PUT /api/admin/students/:studentId/department
   */
  async assignStudentToDepartment(studentId: number, departmentId: number): Promise<{
    message: string;
    studentId: number;
    departmentId: number;
    studentName: string;
    departmentName: string;
  }> {
    // Validate parameters
    if (!validatePositiveNumber(studentId)) {
      throw new Error('Student ID must be a positive integer');
    }
    if (!validatePositiveNumber(departmentId)) {
      throw new Error('Department ID must be a positive integer');
    }

    const response = await api.put<{
      message: string;
      studentId: number;
      departmentId: number;
      studentName: string;
      departmentName: string;
    }>(`/admin/students/${studentId}/department`, { departmentId });
    return handleApiResponse(response);
  }

  /**
   * Get all courses with pagination
   * GET /api/admin/courses/all/:offset/:limit
   */
  async getAllCourses(page: number = 1, limit: number = 10, filters?: any): Promise<any> {
    // Validate page and limit
    if (!validatePositiveNumber(page)) {
      throw new Error('Page must be a positive integer');
    }

    if (!validatePositiveNumber(limit)) {
      throw new Error('Limit must be a positive integer');
    }

    // Convert page to offset
    const offset = pageToOffset(page, limit);

    // Build query parameters
    const params = new URLSearchParams();
    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.semester) {
      params.append('semester', filters.semester);
    }
    if (filters?.department) {
      params.append('department', filters.department);
    }

    const queryString = params.toString();
    const url = `/admin/courses/all/${offset}/${limit}${queryString ? `?${queryString}` : ''}`;

    const response = await api.get<any>(url);
    return handleApiResponse(response);
  }

  /**
   * Get courses (simple list)
   * GET /api/admin/courses
   */
  async getCourses(): Promise<any> {
    const response = await api.get<any>('/admin/courses');
    return handleApiResponse(response);
  }

  /**
   * Get classes (simple list)
   * GET /api/admin/classes
   */
  async getClasses(): Promise<any> {
    const response = await api.get<any>('/admin/classes');
    return handleApiResponse(response);
  }

  /**
   * Get teachers (users with teacher role)
   * GET /api/admin/users/:offset/:limit
   */
  async getTeachers(page: number = 1, limit: number = 100): Promise<any> {
    // Validate page and limit
    if (!validatePositiveNumber(page)) {
      throw new Error('Page must be a positive integer');
    }

    if (!validatePositiveNumber(limit)) {
      throw new Error('Limit must be a positive integer');
    }

    // Convert page to offset
    const offset = pageToOffset(page, limit);

    const response = await api.get<any>(`/admin/users/${offset}/${limit}?role=teacher`);
    return handleApiResponse(response);
  }

/**
 * Get a specific timetable slot
 * GET /api/admin/timetable/:id
 */
async getTimetableSlot(id: string): Promise<any> {
  const response = await api.get<any>(`/admin/timetable/${id}`);
  return handleApiResponse(response);
}

/**
 * Update a timetable slot
 * PUT /api/admin/timetable/:id
 */
async updateTimetableSlot(id: string, data: any): Promise<any> {
  const response = await api.put<any>(`/admin/timetable/${id}`, data);
  return handleApiResponse(response);
}

/**
 * Delete a timetable slot
 * DELETE /api/admin/timetable/:id
 */
async deleteTimetableSlot(id: string): Promise<any> {
  const response = await api.delete<any>(`/admin/timetable/${id}`);
  return handleApiResponse(response);
}

  /**
   * Manage courses
   * POST /api/admin/courses/manage
   */
  async manageCourses(data: ManageCourseData): Promise<{ message: string; courseId?: number }> {
    // Validate required fields
    validateRequiredFields(data, ['action', 'courseData']);

    // Validate action
    const validActions = ['add', 'edit', 'delete'];
    if (!validActions.includes(data.action)) {
      throw new Error('Invalid action. Must be one of: add, edit, delete');
    }

    // Validate courseData based on action
    if (data.action === 'edit' || data.action === 'delete') {
      if (!data.courseData.id || !validatePositiveNumber(data.courseData.id)) {
        throw new Error('Course ID is required for edit/delete actions and must be a positive integer');
      }
    }

    if (data.action === 'add' || data.action === 'edit') {
      // For add action, require all fields including credits
      if (data.action === 'add') {
        validateRequiredFields(data.courseData, ['course_code', 'name', 'credits']);
        if (!validatePositiveNumber(data.courseData.credits)) {
          throw new Error('Credits must be a positive number');
        }
      } else {
        // For edit action, only require course_code and name
        validateRequiredFields(data.courseData, ['course_code', 'name']);
        // Credits validation is optional for edit - allow any number including 0
        if (data.courseData.credits !== undefined && data.courseData.credits !== null && data.courseData.credits !== '') {
          if (isNaN(Number(data.courseData.credits)) || Number(data.courseData.credits) < 0) {
            throw new Error('Credits must be a non-negative number');
          }
        }
      }

      if (typeof data.courseData.course_code !== 'string' || data.courseData.course_code.trim().length === 0) {
        throw new Error('Course code must be a non-empty string');
      }

      if (typeof data.courseData.name !== 'string' || data.courseData.name.trim().length === 0) {
        throw new Error('Course name must be a non-empty string');
      }
    }

    const response = await api.post<{ message: string; courseId?: number }>('/admin/courses/manage', data);
    return handleApiResponse(response);
  }

  /**
   * Manage academic calendar
   * POST /api/admin/calendar
   */
  async manageAcademicCalendar(data: CalendarEventData): Promise<{ message: string; eventId: number }> {
    // Validate required fields
    validateRequiredFields(data, ['eventName', 'eventDate', 'eventType']);

    // Validate eventName
    if (typeof data.eventName !== 'string' || data.eventName.trim().length === 0) {
      throw new Error('Event name must be a non-empty string');
    }

    // Validate eventDate
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.eventDate)) {
      throw new Error('Invalid event date format. Use YYYY-MM-DD');
    }

    // Validate eventType
    if (typeof data.eventType !== 'string' || data.eventType.trim().length === 0) {
      throw new Error('Event type must be a non-empty string');
    }

    // Validate description if provided
    if (data.description && typeof data.description !== 'string') {
      throw new Error('Description must be a string');
    }

    const response = await api.post<{ message: string; eventId: number }>('/admin/calendar', data);
    return handleApiResponse(response);
  }

  /**
   * Get academic calendar
   * GET /api/admin/calendar
   */
  async getAcademicCalendar(): Promise<CalendarEventData[]> {
    const response = await api.get<CalendarEventData[]>('/admin/calendar');
    return handleApiResponse(response);
  }

  /**
   * Update academic event
   * PUT /api/admin/calendar/:eventId
   */
  async updateAcademicEvent(eventId: number, data: CalendarEventData): Promise<{ message: string }> {
    // Validate eventId
    if (!validatePositiveNumber(eventId)) {
      throw new Error('Event ID must be a positive integer');
    }

    // Validate required fields
    validateRequiredFields(data, ['eventName', 'eventDate', 'eventType']);

    const response = await api.put<{ message: string }>(`/admin/calendar/${eventId}`, data);
    return handleApiResponse(response);
  }

  /**
   * Delete academic event
   * DELETE /api/admin/calendar/:eventId
   */
  async deleteAcademicEvent(eventId: number): Promise<{ message: string }> {
    // Validate eventId
    if (!validatePositiveNumber(eventId)) {
      throw new Error('Event ID must be a positive integer');
    }

    const response = await api.delete<{ message: string }>(`/admin/calendar/${eventId}`);
    return handleApiResponse(response);
  }

  /**
   * Setup timetable
   * POST /api/admin/timetable
   */
  async setupTimetable(data: TimetableData): Promise<{ message: string; slotId?: number }> {
    // Validate required fields
    validateRequiredFields(data, ['action', 'timetableData']);

    // Validate action
    const validActions = ['add', 'update', 'delete'];
    if (!validActions.includes(data.action)) {
      throw new Error('Invalid action. Must be one of: add, update, delete');
    }

    // Validate timetableData
    const timetableData = data.timetableData;
    validateRequiredFields(timetableData, ['course_id', 'teacher_id', 'class_id', 'day_of_week', 'start_time', 'end_time']);

    if (!validatePositiveNumber(timetableData.course_id)) {
      throw new Error('Course ID must be a positive integer');
    }

    if (!validatePositiveNumber(timetableData.teacher_id)) {
      throw new Error('Teacher ID must be a positive integer');
    }

    if (!validatePositiveNumber(timetableData.class_id)) {
      throw new Error('Class ID must be a positive integer');
    }

    if (typeof timetableData.day_of_week !== 'number' || timetableData.day_of_week < 1 || timetableData.day_of_week > 7) {
      throw new Error('Day of week must be a number between 1 (Monday) and 7 (Sunday)');
    }

    // Validate time format (HH:MM:SS)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
    if (!timeRegex.test(timetableData.start_time)) {
      throw new Error('Invalid start time format. Use HH:MM:SS');
    }

    if (!timeRegex.test(timetableData.end_time)) {
      throw new Error('Invalid end time format. Use HH:MM:SS');
    }

    // Validate that start time is before end time
    const startTime = new Date(`1970-01-01T${timetableData.start_time}`);
    const endTime = new Date(`1970-01-01T${timetableData.end_time}`);
    if (startTime >= endTime) {
      throw new Error('Start time must be before end time');
    }

    const response = await api.post<{ message: string; slotId?: number }>('/admin/timetable', data);
    return handleApiResponse(response);
  }

  /**
   * Get timetable
   * GET /api/admin/timetable?params
   */
  async getTimetable(params?: TimetableParams): Promise<any[]> {
    let url = '/admin/timetable';

    if (params) {
      const queryParams = new URLSearchParams();
      
      if (params.semester) {
        if (typeof params.semester !== 'string' || params.semester.trim().length === 0) {
          throw new Error('Semester must be a non-empty string');
        }
        queryParams.append('semester', params.semester);
      }

      if (params.department) {
        if (typeof params.department !== 'string' || params.department.trim().length === 0) {
          throw new Error('Department must be a non-empty string');
        }
        queryParams.append('department', params.department);
      }

      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
    }

    const response = await api.get<any[]>(url);
    return handleApiResponse(response);
  }

  /**
   * Get system statistics
   * GET /api/admin/stats
   */
  async getSystemStats(): Promise<SystemStats> {
    const response = await api.get<SystemStats>('/admin/stats');
    return handleApiResponse(response);
  }
}

// Create singleton instance
const adminAPI = new AdminAPI();

// Export individual methods for backward compatibility
export const createUser = (userData: CreateUserData) => adminAPI.createUser(userData);
export const getAllUsers = (page?: number, limit?: number, filters?: UserFilters) => adminAPI.getAllUsers(page, limit, filters);
export const getUserById = (userId: number) => adminAPI.getUserById(userId);
export const updateUser = (userId: number, userData: UpdateUserData) => adminAPI.updateUser(userId, userData);
export const deleteUser = (userId: number) => adminAPI.deleteUser(userId);
export const getAllStudents = (page?: number, limit?: number) => adminAPI.getAllStudents(page, limit);
export const createStudent = (studentData: any) => adminAPI.createStudent(studentData);
export const updateStudent = (studentId: number, studentData: any) => adminAPI.updateStudent(studentId, studentData);
export const updateStudentStatus = (studentId: number, status: string) => adminAPI.updateStudentStatus(studentId, status);
export const deleteStudent = (studentId: number) => adminAPI.deleteStudent(studentId);
export const getAllDepartments = (page?: number, limit?: number) => adminAPI.getAllDepartments(page, limit);
export const getDepartmentById = (departmentId: number) => adminAPI.getDepartmentById(departmentId);
export const createDepartment = (data: CreateDepartmentData) => adminAPI.createDepartment(data);
export const updateDepartment = (deptId: number, data: UpdateDepartmentData) => adminAPI.updateDepartment(deptId, data);
export const deleteDepartment = (deptId: number) => adminAPI.deleteDepartment(deptId);
export const getDepartmentStudents = (departmentId: number) => adminAPI.getDepartmentStudents(departmentId);
export const assignStudentToDepartment = (studentId: number, departmentId: number) => adminAPI.assignStudentToDepartment(studentId, departmentId);
export const getAllCourses = (page?: number, limit?: number, filters?: any) => adminAPI.getAllCourses(page, limit, filters);
export const getCourses = () => adminAPI.getCourses();
export const getClasses = () => adminAPI.getClasses();
export const getTeachers = (page?: number, limit?: number) => adminAPI.getTeachers(page, limit);
export const manageCourses = (data: ManageCourseData) => adminAPI.manageCourses(data);
export const getTimetableSlot = (id: string) => adminAPI.getTimetableSlot(id);
export const updateTimetableSlot = (id: string, data: any) => adminAPI.updateTimetableSlot(id, data);
export const deleteTimetableSlot = (id: string) => adminAPI.deleteTimetableSlot(id);
export const manageAcademicCalendar = (data: CalendarEventData) => adminAPI.manageAcademicCalendar(data);
export const getAcademicCalendar = () => adminAPI.getAcademicCalendar();
export const updateAcademicEvent = (eventId: number, data: CalendarEventData) => adminAPI.updateAcademicEvent(eventId, data);
export const deleteAcademicEvent = (eventId: number) => adminAPI.deleteAcademicEvent(eventId);
export const setupTimetable = (data: TimetableData) => adminAPI.setupTimetable(data);
export const getTimetable = (params?: TimetableParams) => adminAPI.getTimetable(params);
export const getSystemStats = () => adminAPI.getSystemStats();

// Export the class instance as default
export default adminAPI;
