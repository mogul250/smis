// API Response Types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success?: boolean;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ErrorResponse {
  message: string;
  code?: string;
  details?: any;
}

// User Types
export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: 'admin' | 'teacher' | 'hod' | 'finance';
  department_id?: number;
  department_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Student {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: 'student';
  department_id: number;
  department_name?: string;
  student_id?: string;
  enrollment_year?: number;
  current_year?: number;
  enrollment_date?: string;
  graduation_date?: string;
  status: 'active' | 'inactive' | 'graduated' | 'suspended';
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'admin' | 'teacher' | 'hod' | 'finance' | 'student';
  departmentId?: number;
  additionalData?: {
    enrollmentYear?: number;
    enrollmentDate?: string;
    studentId?: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'other';
    address?: string;
    phone?: string;
  };
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: 'admin' | 'teacher' | 'hod' | 'finance' | 'student';
  departmentId?: number;
  additionalData?: any;
}

// Department Types
export interface Department {
  id: number;
  name: string;
  code: string;
  description?: string;
  head_id?: number;
  head_name?: string;
  created_at: string;
}

export interface CreateDepartmentRequest {
  name: string;
  code: string;
  description?: string;
  head_id?: number;
}

// Course Types
export interface Course {
  id: number;
  course_code: string;
  name: string;
  description?: string;
  credits: number;
  semester?: string;
  department_id?: number;
  department_name?: string;
  created_at: string;
}

export interface ManageCourseRequest {
  action: 'add' | 'edit' | 'delete';
  courseData: {
    id?: number;
    course_code?: string;
    name?: string;
    description?: string;
    credits?: number;
    semester?: string;
    department_id?: number;
  };
}

// Academic Calendar Types
export interface AcademicEvent {
  id: number;
  event_name: string;
  event_type: string;
  start_date: string;
  end_date?: string;
  description?: string;
  is_recurring: boolean;
  created_at: string;
}

export interface CreateAcademicEventRequest {
  eventName: string;
  eventDate: string;
  eventType: string;
  description?: string;
}

// Timetable Types
export interface TimetableSlot {
  id: number;
  course_id: number;
  course_name?: string;
  course_code?: string;
  teacher_id?: number;
  teacher_name?: string;
  class_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  semester?: string;
  academic_year?: string;
  created_at: string;
}

export interface ManageTimetableRequest {
  action: 'add' | 'update' | 'delete';
  timetableData: {
    id?: number;
    course_id?: number;
    teacher_id?: number;
    class_id?: number;
    day_of_week?: number;
    start_time?: string;
    end_time?: string;
    semester?: string;
    academic_year?: string;
  };
}

// System Stats Types
export interface SystemStats {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalDepartments?: number;
  totalCourses?: number;
  activeUsers?: number;
  systemHealth?: {
    database: 'healthy' | 'warning' | 'error';
    api: 'healthy' | 'warning' | 'error';
    storage: 'healthy' | 'warning' | 'error';
  };
}

// Notification Types
export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  data?: any;
  is_read: boolean;
  created_at: string;
  sender_first_name?: string;
  sender_last_name?: string;
}

export interface SendNotificationRequest {
  recipientIds?: number[];
  departmentId?: number;
  courseId?: number;
  role?: string;
  type: string;
  title: string;
  message: string;
  data?: any;
}

// Activity Log Types
export interface ActivityLog {
  id: number;
  user_id: number;
  entity_type: string;
  entity_id: number;
  action: string;
  description: string;
  metadata?: any;
  created_at: string;
  user_name?: string;
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

// API Hook Options
export interface ApiHookOptions {
  enabled?: boolean;
  ttl?: number;
  staleWhileRevalidate?: boolean;
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
  retries?: number;
  retryDelay?: number;
  throwOnError?: boolean;
  fallbackData?: any;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  optimisticUpdate?: boolean;
  dedupe?: boolean;
  throttleMs?: number;
  debounceMs?: number;
}

// Filter and Search Types
export interface UserFilters {
  role?: string;
  departmentId?: number;
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface StudentFilters {
  departmentId?: number;
  status?: string;
  enrollmentYear?: number;
  search?: string;
  page?: number;
  limit?: number;
}

// Form Validation Types
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormState<T = any> {
  data: T;
  errors: ValidationError[];
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
}

// Cache Types
export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface CacheStats {
  size: number;
  hitRate: number;
  keys: string[];
}

// App State Types
export interface AppNotification {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  autoClose?: boolean;
}

export interface AppState {
  loading: boolean;
  error: string | null;
  notification: AppNotification | null;
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  breadcrumbs: Breadcrumb[];
  isOffline: boolean;
  userData: {
    users: User[] | null;
    students: Student[] | null;
    departments: Department[] | null;
    stats: SystemStats | null;
  };
}

export interface Breadcrumb {
  label: string;
  href?: string;
  active?: boolean;
}

// Component Props Types
export interface TableColumn<T = any> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  error?: string | null;
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
  onRowClick?: (item: T) => void;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  className?: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  icon?: React.ComponentType<any>;
  loading?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}
