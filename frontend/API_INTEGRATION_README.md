# SMIS API Integration Layer

A robust, type-safe API integration layer for the School Management Information System (SMIS) frontend.

## 🚀 Features

- **Type-Safe**: Full TypeScript support with comprehensive type definitions
- **Error Handling**: Automatic error handling for all HTTP status codes (400, 401, 403, 404, 500)
- **Authentication**: Automatic JWT token management with interceptors
- **Validation**: Client-side validation for all API requests
- **Modular Design**: Separate modules for each user role (Student, Teacher, HOD, Finance, Admin)
- **Helper Methods**: Convenient helper methods for common operations
- **Testing**: Comprehensive test suite with integration tests
- **Documentation**: Detailed documentation with usage examples

## 📁 Project Structure

```
src/services/api/
├── index.ts              # Main entry point and exports
├── config.ts             # Axios configuration and utilities
├── types.ts              # TypeScript type definitions
├── auth.ts               # Authentication module
├── student.ts            # Student operations
├── teacher.ts            # Teacher operations
├── hod.ts                # HOD operations
├── finance.ts            # Finance operations
├── admin.ts              # Admin operations
├── notifications.ts      # Notifications module
└── __tests__/            # Test suite
    ├── auth.test.ts
    ├── student.test.ts
    └── ...
```

## 🛠 Installation

1. **Install dependencies:**
   ```bash
   npm install axios
   npm install -D @types/node typescript ts-node
   ```

2. **Environment Configuration:**
   Create `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

## 📖 Quick Start

### Basic Usage

```typescript
import { authAPI, studentAPI, teacherAPI } from '@/services/api';

// Login
const response = await authAPI.login({
  email: 'user@example.com',
  password: 'password123'
});

// Get student profile
const profile = await studentAPI.getProfile();

// Mark attendance (teacher)
await teacherAPI.markAttendance({
  courseId: 1,
  attendance: [{ studentId: 1, status: 'present' }],
  date: '2024-01-15'
});
```

### Using the Unified API

```typescript
import { smisAPI } from '@/services/api';

// All APIs available through single instance
const profile = await smisAPI.student.getProfile();
const isAuth = smisAPI.isAuthenticated();
```

## 🔐 Authentication

### Login Examples

```typescript
// Staff login
const staffResponse = await authAPI.login({
  email: 'teacher@example.com',
  password: 'password123'
});

// Student login
const studentResponse = await authAPI.studentLogin({
  email: 'student@example.com',
  password: 'password123'
});

// Check authentication status
if (authAPI.isAuthenticated()) {
  const profile = await authAPI.getProfile();
}
```

### Automatic Token Management

The API automatically:
- Stores JWT tokens in localStorage
- Adds Authorization headers to requests
- Handles token expiration (401 errors)
- Redirects to login when needed

## 👨‍🎓 Student Operations

```typescript
import { studentAPI } from '@/services/api';

// Get profile
const profile = await studentAPI.getProfile();

// Get grades
const grades = await studentAPI.getGrades();

// Get attendance for date range
const attendance = await studentAPI.getAttendance('2024-01-01', '2024-01-31');

// Get fees
const fees = await studentAPI.getFees();

// Get timetable
const timetable = await studentAPI.getTimetable('Fall 2024');

// Helper methods
const summary = await studentAPI.getAttendanceSummary('2024-01-01', '2024-01-31');
const currentAttendance = await studentAPI.getCurrentSemesterAttendance();
const feesSummary = await studentAPI.getOutstandingFeesSummary();
```

## 👨‍🏫 Teacher Operations

```typescript
import { teacherAPI } from '@/services/api';

// Get assigned classes
const classes = await teacherAPI.getClasses();

// Mark attendance
await teacherAPI.markAttendance({
  courseId: 1,
  attendance: [
    { studentId: 1, status: 'present', notes: '' },
    { studentId: 2, status: 'absent', notes: 'Sick' }
  ],
  date: '2024-01-15'
});

// Enter grades
await teacherAPI.enterGrades({
  courseId: 1,
  grades: [
    { studentId: 1, grade: 'A', semester: 'Fall 2024', year: 2024 }
  ]
});

// Get students in class
const students = await teacherAPI.getCourseStudents(1);

// Helper methods
const todaySchedule = await teacherAPI.getTodaySchedule();
await teacherAPI.markBulkAttendance(1, '2024-01-15', 'present');
```

## 👨‍💼 HOD Operations

```typescript
import { hodAPI } from '@/services/api';

// Get department teachers
const teachers = await hodAPI.getDepartmentTeachers();

// Generate reports
const report = await hodAPI.generateAttendanceReport({
  semester: 'Fall 2024',
  year: 2024
});

// Manage courses
await hodAPI.addCourse({
  course_code: 'CS101',
  name: 'Introduction to Computer Science',
  credits: 3
});

// Approve activities
await hodAPI.approveGrade(123);

// Get department stats
const stats = await hodAPI.getDepartmentStats();
```

## 💰 Finance Operations

```typescript
import { financeAPI } from '@/services/api';

// Get student fees
const fees = await financeAPI.getStudentFees(1);

// Create fee
await financeAPI.createTuitionFee(1, 5000, '2024-03-01', 'Spring 2024 Tuition');

// Mark fee as paid
await financeAPI.markFeePaidCard(123, 'TXN123456', '2024-01-15');

// Get overdue fees
const overdue = await financeAPI.getOverdueFees();

// Generate reports
const report = await financeAPI.getFinancialReports({
  startDate: '2024-01-01',
  endDate: '2024-01-31'
});
```

## 👨‍💻 Admin Operations

```typescript
import { adminAPI } from '@/services/api';

// Create user
await adminAPI.createUser({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  password: 'password123',
  role: 'teacher',
  departmentId: 1
});

// Get users with pagination and filters
const users = await adminAPI.getAllUsers(1, 10, {
  role: 'student',
  departmentId: 1,
  search: 'john'
});

// Manage departments
await adminAPI.createDepartment({
  name: 'Computer Science',
  code: 'CS',
  description: 'Computer Science Department'
});

// Get system stats
const stats = await adminAPI.getSystemStats();
```

## 🔔 Notifications

```typescript
import { notificationsAPI } from '@/services/api';

// Get notifications
const notifications = await notificationsAPI.getNotifications(1, 10);

// Send notifications
await notificationsAPI.sendAssignmentNotification(
  1, // courseId
  'New Assignment',
  'Assignment on React has been posted'
);

await notificationsAPI.sendFeeReminder(
  [1, 2, 3], // studentIds
  'Fee Payment Due',
  'Your fees are due in 3 days'
);

// Mark as read
await notificationsAPI.markAsRead(123);
await notificationsAPI.markAllAsRead();
```

## 🧪 Testing

### Run Unit Tests
```bash
npm test
npm run test:watch
npm run test:coverage
```

### Run Integration Tests
```bash
npm run test:integration
```

The integration test script tests all endpoints with a real backend and provides detailed results.

### Test Configuration
Set environment variables for integration tests:
```bash
export API_BASE_URL=http://localhost:5000/api
export TEST_TIMEOUT=30000
```

## 🔧 Error Handling

### Automatic Error Handling
The API automatically handles:
- **400**: Validation errors with detailed messages
- **401**: Token expiration with automatic redirect
- **403**: Permission errors with user-friendly messages
- **404**: Not found errors
- **500**: Server errors with retry suggestions

### Manual Error Handling
```typescript
import { getErrorMessage } from '@/services/api';

try {
  const result = await studentAPI.getProfile();
} catch (error) {
  const message = getErrorMessage(error);
  
  if (error.status === 403) {
    alert('You do not have permission to access this resource');
  } else {
    alert(`Error: ${message}`);
  }
}
```

## 🔍 Validation

### Built-in Validation
The API includes validation for:
- Email formats
- Date formats (YYYY-MM-DD)
- Positive numbers
- Required fields
- Enum values (roles, statuses, etc.)

### Custom Validation
```typescript
import { 
  validateEmail, 
  validateDateFormat, 
  validatePositiveNumber 
} from '@/services/api';

if (!validateEmail(email)) {
  throw new Error('Invalid email format');
}

if (!validateDateFormat(date)) {
  throw new Error('Date must be in YYYY-MM-DD format');
}
```

## 📊 Performance

### Pagination
Admin endpoints use offset/limit pattern:
```typescript
// Get users: page 2, 20 items per page
const users = await adminAPI.getAllUsers(2, 20);
// Internally converts to offset=20, limit=20
```

### Parallel Requests
Load multiple resources simultaneously:
```typescript
const [profile, grades, fees] = await Promise.all([
  studentAPI.getProfile(),
  studentAPI.getGrades(),
  studentAPI.getFees()
]);
```

## 🐛 Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Check if user is logged in
   - Verify token hasn't expired
   - Try logging in again

2. **403 Forbidden**
   - Verify user has correct role
   - Check department authorization for HOD
   - Ensure course access for teachers

3. **400 Bad Request**
   - Check request data format
   - Verify required fields
   - Validate data types

4. **Network Errors**
   - Check backend server is running
   - Verify API base URL
   - Check network connection

### Debug Mode
Enable detailed logging in development:
```typescript
// Logs appear in browser console
// 🚀 API Request: POST /auth/login
// ✅ API Response: POST /auth/login (200)
// ❌ API Error: POST /auth/login (401)
```

## 📚 Documentation

- **[API Troubleshooting Guide](./API_TROUBLESHOOTING.md)** - Detailed error handling guide
- **[Usage Examples](./API_USAGE_EXAMPLES.md)** - Real-world usage examples
- **[Type Definitions](./src/services/api/types.ts)** - Complete TypeScript types
- **[Backend API Docs](../docs/api-documentation.md)** - Backend API documentation

## 🤝 Contributing

1. Follow TypeScript best practices
2. Add tests for new features
3. Update documentation
4. Validate with integration tests
5. Handle all error cases

## 📄 License

This project is part of the SMIS system and follows the same license terms.
