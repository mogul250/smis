# SMIS Backend Implementation TODO

## High Priority: Database Refactoring
- [x] Refactor database schema to use only two tables:
  - [x] `users` table: Store all staff (teachers, HODs, finance, admins) with role field and auth data
  - [x] `students` table: Independent entity for student data with its own auth fields (username, password, etc.)
  - [x] Remove separate teacher table; integrate teachers into users table with role 'teacher'
  - [x] Update Student model to be independent (no user_id dependency)
  - [x] Update controllers: staff controllers use users table, student controller uses students table
  - [x] Implement separate auth routes for students and staff
  - [ ] Update middleware to handle both user types
  - [ ] Update tests to match new schema
  - [ ] Migrate existing data if any

## Phase 1: Database Setup
- [x] Create database schema (schema.sql)
- [x] Set up database connection (config/database.js)
- [ ] Create initial migrations for tables
- [ ] Set up seed data for testing

## Phase 2: Authentication System
- [x] Implement JWT configuration (config/jwt.js)
- [x] Create User model (models/user.js)
- [x] Implement auth middleware (middleware/auth-middleware.js)
- [x] Implement role-based middleware (middleware/role-middleware.js)
- [x] Create auth controller (controllers/auth-controller.js)
- [x] Create auth routes (routes/auth-routes.js)
- [x] Add password hashing utilities (utils/helpers.js)

## Phase 3: Core Models
- [x] Create Student model (models/student.js)
  - [x] Define Student schema with fields: id, user_id, department_id, enrollment_date, etc.
  - [x] Implement CRUD methods: create, findById, findByUserId, update, delete, getAll
  - [x] Add methods for getting student with related data (user, department)
- [x] Create Teacher model (models/teacher.js)
  - [x] Define Teacher schema: id, user_id, department_id, hire_date, subjects, etc.
  - [x] Implement CRUD methods: create, findById, findByUserId, update, delete, getAll
  - [ ] Add methods for teacher assignments and department relations
- [x] Create Course model (models/course.js)
  - [x] Define Course schema: id, name, code, department_id, credits, description
  - [x] Implement CRUD: create, findById, findByDepartment, update, delete, getAll
  - [x] Add methods for course enrollment and prerequisites
- [x] Create Department model (models/department.js)
  - [x] Define Department schema: id, name, code, head_id (teacher), description
  - [x] Implement CRUD: create, findById, update, delete, getAll
  - [x] Add methods for department statistics and head assignment
- [x] Create Attendance model (models/attendance.js)
  - [x] Define Attendance schema: id, student_id, course_id, teacher_id, date, status, notes
  - [x] Implement methods: markAttendance, getAttendanceByStudent, getAttendanceByCourse, update, getMonthlyReport
  - [x] Add bulk attendance marking for classes
- [x] Create Grade model (models/grade.js)
  - [x] Define Grade schema: id, student_id, course_id, teacher_id, grade, semester, year, comments
  - [x] Implement methods: assignGrade, getGradesByStudent, getGradesByCourse, update, calculateGPA
  - [x] Add grade validation and conversion utilities
- [x] Create Fee model (models/fee.js)
  - [x] Define Fee schema: id, student_id, amount, type, due_date, paid_date, status, description
  - [x] Implement methods: createFee, getFeesByStudent, markAsPaid, getOutstandingFees, generateInvoice
  - [x] Add payment tracking and overdue calculations
- [x] Create Timetable model (models/timetable.js)
  - [x] Define Timetable schema: id, course_id, teacher_id, day, start_time, end_time, room, semester
  - [x] Implement methods: createSlot, getTimetableByStudent, getTimetableByTeacher, checkConflicts, update
  - [x] Add timetable generation and validation logic
- [x] Create Academic Calendar model (models/academic-calendar.js)
  - [x] Define Calendar schema: id, event_name, event_date, event_type, description, academic_year
  - [x] Implement methods: addEvent, getEventsByMonth, getEventsByYear, update, delete
  - [x] Add holiday management and semester definitions

## Phase 4: Controllers Implementation
- [x] Implement Student controller (controllers/student-controller.js)
  - [x] getProfile: Fetch student profile with user and department data
  - [x] updateProfile: Update student information (with validation)
  - [x] getGrades: Retrieve grades for the student with course details
  - [x] getAttendance: Get attendance records with percentage calculations
  - [x] getFees: View fee statements and payment status
  - [x] getTimetable: Display student's class schedule
  - [x] Add input validation and error handling for all methods
- [x] Implement Teacher controller (controllers/teacher-controller.js)
  - [x] getProfile: Get teacher profile with department and subjects
  - [x] getClasses: List courses assigned to the teacher
  - [x] markAttendance: Record attendance for a class (bulk or individual)
  - [x] enterGrades: Assign grades to students for specific courses
  - [x] uploadResource: Handle file uploads for course materials
  - [x] getTimetable: View teacher's schedule
  - [x] getClassStudents: Get list of students in assigned classes
  - [x] Add authorization checks and data validation
- [x] Implement HOD controller (controllers/hod-controller.js)
  - [x] getDepartmentTeachers: List teachers in the department
  - [x] approveTeacherActivity: Approve/reject teacher requests
  - [x] generateReports: Create department performance reports
  - [x] manageCourses: Add/edit/delete courses in department
  - [x] approveTimetable: Review and approve timetable changes
  - [x] getDepartmentStats: View attendance, grades, and performance metrics
  - [x] Add department-level authorization
- [x] Implement Finance controller (controllers/finance-controller.js)
  - [x] getStudentFees: Retrieve fee records for a student
  - [x] createFee: Add new fee entry for a student
  - [x] markFeePaid: Update payment status and record transaction
  - [x] generateInvoice: Create PDF invoice for outstanding fees
  - [x] getFinancialReports: Generate financial summaries and analytics
  - [x] getPaymentHistory: View payment transactions
  - [x] Add financial data validation and audit logging
- [x] Implement Admin controller (controllers/admin-controller.js)
  - [x] createUser: Register new users (students, teachers, etc.)
  - [x] getAllUsers: List all users with filtering and pagination
  - [x] updateUser: Modify user information and roles
  - [x] deleteUser: Deactivate user accounts
  - [x] manageAcademicCalendar: Add/edit/delete calendar events
  - [x] setupTimetable: Create and manage master timetable
  - [x] getSystemStats: View overall system statistics
  - [x] Add admin-level authorization and comprehensive validation

## Phase 5: Routes Setup
- [x] Implement Student routes (routes/student-routes.js)
- [x] Implement Teacher routes (routes/teacher-routes.js)
- [x] Implement HOD routes (routes/hod-routes.js)
- [x] Implement Finance routes (routes/finance-routes.js)
- [x] Implement Admin routes (routes/admin-routes.js)

## Phase 6: Services and Utilities
- [x] Implement Email service (services/email-service.js)
- [x] Implement Report service (services/report-service.js)
- [x] Implement Notification service (services/notification-service.js)
- [x] Add validation middleware (middleware/validation-middleware.js)
- [x] Add constants (utils/constants.js)
- [x] Add helper functions (utils/helpers.js)

## Phase 7: Testing and Validation
- [x] Write unit tests for controllers
- [x] Write integration tests for routes
- [x] Test authentication flow
- [x] Test database operations
- [x] Validate API responses
- [x] Write critical-path tests for Teacher endpoints (profile, classes, attendance, grades, timetable)
- [x] Write critical-path tests for HOD endpoints (teachers, activities approval, reports, stats)
- [x] Write critical-path tests for Finance endpoints (create fee, get fees, mark paid, reports)
- [x] Write critical-path tests for Admin endpoints (user management, calendar, system stats)
- [x] Write critical-path tests for Notification endpoints (send, get, mark read)
- [ ] Write unit tests for Email service
- [ ] Write unit tests for Report service
- [ ] Write unit tests for Notification service

## Phase 8: Deployment Preparation
- [x] Update Dockerfile if needed
- [x] Create docker-compose.yml
- [x] Set up environment variables (.env.example)
- [x] Create .gitignore
- [x] Update README.md with setup instructions

## Phase 9: Documentation
- [ ] Document API endpoints (docs/api/)
- [ ] Create user guides (docs/user-guides/)
- [ ] Add deployment guide (docs/deployment/)
