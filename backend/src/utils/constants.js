// User roles
export const USER_ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  HOD: 'hod',
  FINANCE: 'finance',
  ADMIN: 'admin'
};

// Attendance statuses
export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late'
};

// Grade values
export const GRADE_VALUES = {
  A: 'A',
  A_MINUS: 'A-',
  B_PLUS: 'B+',
  B: 'B',
  B_MINUS: 'B-',
  C_PLUS: 'C+',
  C: 'C',
  C_MINUS: 'C-',
  D_PLUS: 'D+',
  D: 'D',
  F: 'F'
};

// Grade point mapping
export const GRADE_POINTS = {
  'A': 4.0,
  'A-': 3.7,
  'B+': 3.3,
  'B': 3.0,
  'B-': 2.7,
  'C+': 2.3,
  'C': 2.0,
  'C-': 1.7,
  'D+': 1.3,
  'D': 1.0,
  'F': 0.0
};

// Fee types
export const FEE_TYPES = {
  TUITION: 'tuition',
  LIBRARY: 'library',
  LABORATORY: 'laboratory',
  EXAMINATION: 'examination',
  SPORTS: 'sports',
  TRANSPORT: 'transport',
  OTHER: 'other'
};

// Fee statuses
export const FEE_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  OVERDUE: 'overdue'
};

// Days of the week
export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

// Semesters
export const SEMESTERS = [
  'Fall',
  'Spring',
  'Summer'
];

// Academic calendar event types
export const EVENT_TYPES = {
  HOLIDAY: 'holiday',
  EXAM: 'exam',
  REGISTRATION: 'registration',
  ORIENTATION: 'orientation',
  GRADUATION: 'graduation',
  OTHER: 'other'
};

// Notification types
export const NOTIFICATION_TYPES = {
  GRADE_UPDATE: 'grade_update',
  ATTENDANCE_ALERT: 'attendance_alert',
  FEE_REMINDER: 'fee_reminder',
  TIMETABLE_UPDATE: 'timetable_update',
  ANNOUNCEMENT: 'announcement',
  GENERAL: 'general'
};

// Pagination defaults
export const PAGINATION = {
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
};

// File upload limits
export const FILE_LIMITS = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
};

// Email templates
export const EMAIL_TEMPLATES = {
  WELCOME_SUBJECT: 'Welcome to SMIS - School Management Information System',
  PASSWORD_RESET_SUBJECT: 'Password Reset - SMIS',
  GRADE_UPDATE_SUBJECT: 'Grade Update - SMIS',
  ATTENDANCE_ALERT_SUBJECT: 'Attendance Alert - SMIS',
  FEE_REMINDER_SUBJECT: 'Fee Payment Reminder - SMIS'
};

// Database table names
export const TABLES = {
  USERS: 'users',
  STUDENTS: 'students',
  TEACHERS: 'teachers',
  DEPARTMENTS: 'departments',
  COURSES: 'courses',
  ATTENDANCE: 'attendance',
  GRADES: 'grades',
  FEES: 'fees',
  TIMETABLE: 'timetable',
  ACADEMIC_CALENDAR: 'academic_calendar',
  NOTIFICATIONS: 'notifications'
};

// Error messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  VALIDATION_FAILED: 'Validation failed',
  INTERNAL_ERROR: 'Internal server error',
  INVALID_CREDENTIALS: 'Invalid credentials',
  USER_EXISTS: 'User already exists',
  INVALID_TOKEN: 'Invalid or expired token'
};

// Success messages
export const SUCCESS_MESSAGES = {
  USER_CREATED: 'User created successfully',
  USER_UPDATED: 'User updated successfully',
  USER_DELETED: 'User deleted successfully',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  PASSWORD_RESET: 'Password reset successful',
  GRADE_ASSIGNED: 'Grade assigned successfully',
  ATTENDANCE_MARKED: 'Attendance marked successfully',
  FEE_PAID: 'Fee payment recorded successfully'
};
