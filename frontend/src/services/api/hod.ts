import api, { 
  handleApiResponse, 
  validateRequiredFields, 
  validatePositiveNumber,
  validateYear 
} from './config';
import {
  DepartmentTeacher,
  ApproveActivityRequest,
  ReportParams,
  ReportResponse,
  ManageCourseRequest,
  ManageCourseResponse,
  ApproveTimetableRequest,
  DepartmentStats,
  TimetableEntry,
  TeacherDepartment,
  AssignTeacherRequest,
  RemoveTeacherRequest,
  TeacherAssignmentResponse
} from './types';

/**
 * HOD (Head of Department) API Module
 * Handles all HOD-related API calls
 * All endpoints require HOD authentication and department authorization
 */
export class HODAPI {
  /**
   * Get teachers in department
   * GET /api/hod/teachers
   */
  async getDepartmentTeachers(): Promise<DepartmentTeacher[]> {
    const response = await api.get<DepartmentTeacher[]>('/hod/teachers');
    return handleApiResponse(response);
  }

  /**
   * Get courses in department
   * GET /api/hod/courses
   */
  async getDepartmentCourses(): Promise<Course[]> {
    const response = await api.get<Course[]>('/hod/courses');
    return handleApiResponse(response);
  }

  /**
   * Approve or reject teacher activities
   * POST /api/hod/activities/approve
   */
  async approveActivity(data: ApproveActivityRequest): Promise<{ message: string }> {
    // Validate required fields
    validateRequiredFields(data, ['activityType', 'activityId', 'approve']);

    // Validate activityType
    if (data.activityType !== 'grade') {
      throw new Error('Invalid activity type. Currently only "grade" is supported');
    }

    // Validate activityId
    if (!validatePositiveNumber(data.activityId)) {
      throw new Error('Activity ID must be a positive integer');
    }

    // Validate approve field
    if (typeof data.approve !== 'boolean') {
      throw new Error('Approve field must be a boolean');
    }

    const response = await api.post<{ message: string }>('/hod/activities/approve', data);
    return handleApiResponse(response);
  }

  /**
   * Generate departmental reports
   * POST /api/hod/reports/:reportType
   */
  async generateReport(reportType: string, data?: ReportParams): Promise<ReportResponse> {
    // Validate reportType
    if (typeof reportType !== 'string' || reportType.trim().length === 0) {
      throw new Error('Report type is required and must be a non-empty string');
    }

    // Validate optional parameters
    if (data) {
      if (data.semester && (typeof data.semester !== 'string' || data.semester.trim().length === 0)) {
        throw new Error('Semester must be a non-empty string');
      }

      if (data.year && !validateYear(data.year)) {
        throw new Error(`Invalid year. Must be between 2000 and ${new Date().getFullYear() + 10}`);
      }
    }

    const response = await api.post<ReportResponse>(`/hod/reports/${encodeURIComponent(reportType)}`, data || {});
    return handleApiResponse(response);
  }

  /**
   * Manage courses in department
   * POST /api/hod/courses/manage
   */
  async manageCourses(data: ManageCourseRequest): Promise<ManageCourseResponse> {
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
      validateRequiredFields(data.courseData, ['course_code', 'name', 'credits']);

      if (typeof data.courseData.course_code !== 'string' || data.courseData.course_code.trim().length === 0) {
        throw new Error('Course code must be a non-empty string');
      }

      if (typeof data.courseData.name !== 'string' || data.courseData.name.trim().length === 0) {
        throw new Error('Course name must be a non-empty string');
      }

      if (!validatePositiveNumber(data.courseData.credits)) {
        throw new Error('Credits must be a positive number');
      }
    }

    const response = await api.post<ManageCourseResponse>('/hod/courses/manage', data);
    return handleApiResponse(response);
  }

  /**
   * Approve timetable changes
   * POST /api/hod/timetable/approve
   */
  async approveTimetable(data: ApproveTimetableRequest): Promise<{ message: string }> {
    // Validate required fields
    validateRequiredFields(data, ['timetableId', 'approve']);

    // Validate timetableId
    if (!validatePositiveNumber(data.timetableId)) {
      throw new Error('Timetable ID must be a positive integer');
    }

    // Validate approve field
    if (typeof data.approve !== 'boolean') {
      throw new Error('Approve field must be a boolean');
    }

    const response = await api.post<{ message: string }>('/hod/timetable/approve', data);
    return handleApiResponse(response);
  }

  /**
   * Get department statistics
   * GET /api/hod/stats
   */
  async getDepartmentStats(): Promise<DepartmentStats> {
    const response = await api.get<DepartmentStats>('/hod/stats');
    return handleApiResponse(response);
  }

  /**
   * Get department timetable
   * GET /api/hod/timetable?semester=string
   */
  async getDepartmentTimetable(semester?: string): Promise<TimetableEntry[]> {
    let url = '/hod/timetable';
    
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
   * Add a new course to the department
   * Helper method for adding courses
   */
  async addCourse(courseData: {
    course_code: string;
    name: string;
    credits: number;
  }): Promise<ManageCourseResponse> {
    return this.manageCourses({
      action: 'add',
      courseData,
    });
  }

  /**
   * Edit an existing course
   * Helper method for editing courses
   */
  async editCourse(courseData: {
    id: number;
    course_code: string;
    name: string;
    credits: number;
  }): Promise<ManageCourseResponse> {
    return this.manageCourses({
      action: 'edit',
      courseData,
    });
  }

  /**
   * Delete a course
   * Helper method for deleting courses
   */
  async deleteCourse(courseId: number): Promise<ManageCourseResponse> {
    if (!validatePositiveNumber(courseId)) {
      throw new Error('Course ID must be a positive integer');
    }

    return this.manageCourses({
      action: 'delete',
      courseData: {
        id: courseId,
        course_code: '', // Required by type but not used for delete
        name: '', // Required by type but not used for delete
        credits: 0, // Required by type but not used for delete
      },
    });
  }

  /**
   * Approve a grade activity
   * Helper method for approving grades
   */
  async approveGrade(gradeId: number): Promise<{ message: string }> {
    return this.approveActivity({
      activityType: 'grade',
      activityId: gradeId,
      approve: true,
    });
  }

  /**
   * Reject a grade activity
   * Helper method for rejecting grades
   */
  async rejectGrade(gradeId: number): Promise<{ message: string }> {
    return this.approveActivity({
      activityType: 'grade',
      activityId: gradeId,
      approve: false,
    });
  }

  /**
   * Approve a timetable
   * Helper method for approving timetables
   */
  async approveTimetableById(timetableId: number): Promise<{ message: string }> {
    return this.approveTimetable({
      timetableId,
      approve: true,
    });
  }

  /**
   * Reject a timetable
   * Helper method for rejecting timetables
   */
  async rejectTimetable(timetableId: number): Promise<{ message: string }> {
    return this.approveTimetable({
      timetableId,
      approve: false,
    });
  }

  /**
   * Generate attendance report
   * Helper method for attendance reports
   */
  async generateAttendanceReport(params?: ReportParams): Promise<ReportResponse> {
    return this.generateReport('attendance', params);
  }

  /**
   * Generate grades report
   * Helper method for grades reports
   */
  async generateGradesReport(params?: ReportParams): Promise<ReportResponse> {
    return this.generateReport('grades', params);
  }

  /**
   * Get current semester timetable
   * Helper method for current semester
   */
  async getCurrentSemesterTimetable(): Promise<TimetableEntry[]> {
    // Call without semester parameter to get all timetable entries
    return this.getDepartmentTimetable();
  }

  /**
   * Get department overview
   * Helper method that combines multiple data sources
   */
  async getDepartmentOverview(): Promise<{
    teachers: DepartmentTeacher[];
    stats: DepartmentStats;
    currentTimetable: TimetableEntry[];
  }> {
    const [teachers, stats, currentTimetable] = await Promise.all([
      this.getDepartmentTeachers(),
      this.getDepartmentStats(),
      this.getCurrentSemesterTimetable(),
    ]);

    return {
      teachers,
      stats,
      currentTimetable,
    };
  }

  /**
   * Get teacher's departments (many-to-many)
   * GET /api/hod/teachers/:teacherId/departments
   */
  async getTeacherDepartments(teacherId: number): Promise<{
    teacherId: number;
    teacherName: string;
    departments: TeacherDepartment[];
  }> {
    validatePositiveNumber(teacherId, 'Teacher ID');
    const response = await api.get<{
      teacherId: number;
      teacherName: string;
      departments: TeacherDepartment[];
    }>(`/hod/teachers/${teacherId}/departments`);
    return handleApiResponse(response);
  }

  /**
   * Assign teachers to department (many-to-many)
   * POST /api/hod/departments/add-teachers
   */
  async assignTeachersToDepartment(data: AssignTeacherRequest): Promise<TeacherAssignmentResponse> {
    validateRequiredFields(data, ['teachers']);

    if (!Array.isArray(data.teachers) || data.teachers.length === 0) {
      throw new Error('Teachers array is required and must not be empty');
    }

    data.teachers.forEach((teacherId, index) => {
      validatePositiveNumber(teacherId, `Teacher ID at index ${index}`);
    });

    const response = await api.post<TeacherAssignmentResponse>('/hod/departments/add-teachers', data);
    return handleApiResponse(response);
  }

  /**
   * Remove teachers from department (many-to-many)
   * POST /api/hod/departments/remove-teachers
   */
  async removeTeachersFromDepartment(data: RemoveTeacherRequest): Promise<TeacherAssignmentResponse> {
    validateRequiredFields(data, ['teachers']);

    if (!Array.isArray(data.teachers) || data.teachers.length === 0) {
      throw new Error('Teachers array is required and must not be empty');
    }

    data.teachers.forEach((teacherId, index) => {
      validatePositiveNumber(teacherId, `Teacher ID at index ${index}`);
    });

    const response = await api.post<TeacherAssignmentResponse>('/hod/departments/remove-teachers', data);
    return handleApiResponse(response);
  }
}

// Create singleton instance
const hodAPI = new HODAPI();

// Export individual methods for backward compatibility
export const getDepartmentTeachers = () => hodAPI.getDepartmentTeachers();
export const getDepartmentCourses = () => hodAPI.getDepartmentCourses();
export const approveActivity = (data: ApproveActivityRequest) => hodAPI.approveActivity(data);
export const generateReport = (reportType: string, data?: ReportParams) => hodAPI.generateReport(reportType, data);
export const manageCourses = (data: ManageCourseRequest) => hodAPI.manageCourses(data);
export const approveTimetable = (data: ApproveTimetableRequest) => hodAPI.approveTimetable(data);
export const getDepartmentStats = () => hodAPI.getDepartmentStats();
export const getDepartmentTimetable = (semester?: string) => hodAPI.getDepartmentTimetable(semester);
export const addCourse = (courseData: Parameters<typeof hodAPI.addCourse>[0]) => hodAPI.addCourse(courseData);
export const editCourse = (courseData: Parameters<typeof hodAPI.editCourse>[0]) => hodAPI.editCourse(courseData);
export const deleteCourse = (courseId: number) => hodAPI.deleteCourse(courseId);
export const approveGrade = (gradeId: number) => hodAPI.approveGrade(gradeId);
export const rejectGrade = (gradeId: number) => hodAPI.rejectGrade(gradeId);
export const approveTimetableById = (timetableId: number) => hodAPI.approveTimetableById(timetableId);
export const rejectTimetable = (timetableId: number) => hodAPI.rejectTimetable(timetableId);
export const generateAttendanceReport = (params?: ReportParams) => hodAPI.generateAttendanceReport(params);
export const generateGradesReport = (params?: ReportParams) => hodAPI.generateGradesReport(params);
export const getCurrentSemesterTimetable = () => hodAPI.getCurrentSemesterTimetable();
export const getDepartmentOverview = () => hodAPI.getDepartmentOverview();

// Many-to-many teacher-department operations
export const getTeacherDepartments = (teacherId: number) => hodAPI.getTeacherDepartments(teacherId);
export const assignTeachersToDepartment = (data: AssignTeacherRequest) => hodAPI.assignTeachersToDepartment(data);
export const removeTeachersFromDepartment = (data: RemoveTeacherRequest) => hodAPI.removeTeachersFromDepartment(data);

// Export the class instance as default
export default hodAPI;
