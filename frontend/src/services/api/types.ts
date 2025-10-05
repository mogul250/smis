// API Types for SMIS System
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// Authentication Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: {
    id: number;
    email: string;
    role: string;
    userType: 'staff' | 'student';
  };
  token: string;
}

export interface AuthUser {
  id: number;
  email: string;
  role: string;
  userType: 'staff' | 'student';
  is_active: boolean;
  created_at: string;
}

// Student Types
export interface StudentProfile {
  id: number;
  user: {
    email: string;
    first_name: string;
    last_name: string;
  };
  phone?: string;
  address?: string;
  date_of_birth?: string;
  gender?: string;
  department_id?: number;
  department_name?: string;
  student_id?: string;
  enrollment_year?: number;
  current_year?: number;
  enrollment_date?: string;
  graduation_date?: string;
  status?: string;
}

export interface UpdateStudentProfile {
  email?: string;
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  phone?: string;
  department_id?: number;
  enrollment_year?: number;
  current_year?: number;
  enrollment_date?: string;
  graduation_date?: string;
  status?: 'active' | 'inactive' | 'graduated' | 'suspended';
}

export interface Grade {
  id: number;
  course_id: number;
  grade: string;
  semester: string;
  year: number;
  comments: string;
  course_name: string;
}

export interface GradesResponse {
  grades: Grade[];
  gpa: number;
}

export interface AttendanceRecord {
  id: number;
  student_id: number;
  course_id: number;
  date: string;
  status: 'present' | 'absent' | 'late';
  notes: string;
  course_name: string;
}

export interface Fee {
  id: number;
  fee_type: string;
  amount: number;
  due_date: string;
  status: 'paid' | 'unpaid';
  paid_date?: string;
}

export interface FeesResponse {
  fees: Fee[];
  totalOutstanding: number;
}

export interface TimetableEntry {
  id: number;
  course_id: number;
  teacher_id?: number;
  class_id?: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  course_name: string;
  teacher_name?: string;
}

// Teacher Types
export interface TeacherProfile {
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    department_id: number;
  };
}

export interface UpdateTeacherProfile {
  first_name?: string;
  last_name?: string;
  email?: string;
  department_id?: number;
}

export interface Course {
  id: number;
  course_code: string;
  name: string;
  credits: number;
  department_name: string;
}

export interface AttendanceData {
  courseId: number;
  attendance: {
    studentId: number;
    status: 'present' | 'absent' | 'late';
    notes?: string;
  }[];
  date: string;
}

export interface AttendanceResult {
  studentId: number;
  success: boolean;
  attendanceId?: number;
  message?: string;
}

export interface AttendanceResponse {
  message: string;
  results: AttendanceResult[];
}

export interface GradeData {
  courseId: number;
  grades: {
    studentId: number;
    grade: string;
    semester: string;
    year: number;
    comments?: string;
  }[];
}

export interface GradeResult {
  studentId: number;
  success: boolean;
  gradeId?: number;
  message?: string;
}

export interface GradeResponse {
  message: string;
  results: GradeResult[];
}

export interface ClassStudent {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  course_name: string;
}

// HOD Types
export interface DepartmentTeacher {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: 'teacher';
  department_id: number;
}

export interface ApproveActivityRequest {
  activityType: 'grade';
  activityId: number;
  approve: boolean;
}

export interface ReportParams {
  semester?: string;
  year?: number;
}

export interface AttendanceReportEntry {
  course_name: string;
  course_code: string;
  total_classes: number;
  present_count: number;
  attendance_percentage: number;
}

export interface ReportResponse {
  reportType: string;
  report: {
    attendance: AttendanceReportEntry[];
  };
}

export interface ManageCourseRequest {
  action: 'add' | 'edit' | 'delete';
  courseData: {
    id?: number;
    course_code: string;
    name: string;
    credits: number;
  };
}

export interface ManageCourseResponse {
  message: string;
  courseId?: number;
}

export interface ApproveTimetableRequest {
  timetableId: number;
  approve: boolean;
}

export interface DepartmentStats {
  attendance: {
    total_records: number;
    avg_attendance_percentage: number;
  };
  grades: {
    grade: string;
    count: number;
  }[];
  courses: number;
  teachers: number;
}

// Finance Types
export interface CreateFeeData {
  studentId: number;
  amount: number;
  type: string;
  dueDate: string;
  description?: string;
}

export interface PaymentData {
  paymentMethod: string;
  transactionId: string;
  paymentDate?: string;
}

export interface Invoice {
  studentId: number;
  studentName: string;
  outstandingFees: {
    id: number;
    fee_type: string;
    amount: number;
    due_date: string;
  }[];
  totalAmount: number;
  generatedAt: string;
}

export interface FinancialReport {
  totalRevenue: number;
  outstandingFees: number;
}

export interface PaymentHistoryEntry {
  id: number;
  fee_type: string;
  amount: number;
  paid_date: string;
  payment_method: string;
  transaction_id: string;
}

export interface OverdueFee {
  id: number;
  student_id: number;
  fee_type: string;
  amount: number;
  due_date: string;
  student_name: string;
  days_overdue: number;
}

// Admin Types
export interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'student' | 'teacher' | 'hod' | 'finance' | 'admin';
  departmentId?: number;
  additionalData?: {
    enrollmentYear?: number;
    enrollmentDate?: string;
  };
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  departmentId?: number;
  additionalData?: any;
}

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  created_at: string;
  department_name?: string;
}

export interface UserFilters {
  role?: string;
  departmentId?: number;
  search?: string;
}

export interface UsersResponse {
  users: User[];
  pagination: PaginationResponse;
}

export interface Student {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  department_id: number;
  enrollment_year: number;
  status: string;
  created_at: string;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  description?: string;
  head_id?: number;
  created_at: string;
}

export interface CreateDepartmentData {
  name: string;
  code: string;
  description?: string;
  head_id?: number;
}

export interface UpdateDepartmentData {
  name?: string;
  code?: string;
  description?: string;
  head_id?: number;
}

export interface ManageCourseData {
  action: 'add' | 'edit' | 'delete';
  courseData: {
    id?: number;
    course_code: string;
    name: string;
    credits: number;
  };
}

export interface CalendarEventData {
  eventName: string;
  eventDate: string;
  eventType: string;
  description?: string;
}

export interface TimetableData {
  action: 'add' | 'update' | 'delete';
  timetableData: {
    course_id: number;
    teacher_id: number;
    class_id: number;
    day_of_week: number;
    start_time: string;
    end_time: string;
  };
}

export interface TimetableParams {
  semester?: string;
  department?: string;
}

export interface SystemStats {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
}

// Notification Types
export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  data: any;
  is_read: boolean;
  created_at: string;
  sender_first_name: string;
  sender_last_name: string;
}

export interface SendNotificationData {
  recipientIds: number[];
  type: string;
  title: string;
  message: string;
  data?: any;
}

export interface DepartmentNotificationData {
  departmentId: number;
  role?: string;
  type: string;
  title: string;
  message: string;
  data?: any;
}

export interface CourseNotificationData {
  courseId: number;
  type: string;
  title: string;
  message: string;
  data?: any;
}

export interface NotificationResponse {
  message: string;
  notificationIds: number[];
  recipients: number;
}
