# SMIS API Documentation

## Overview

This document provides comprehensive API documentation for the Student Management Information System (SMIS). It details all available endpoints, their request/response formats, authentication requirements, and error handling.

## Base URL

All API endpoints are prefixed with `/api`

## Authentication

Most endpoints require authentication via JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

### User Types and Roles

- **Students**: Can access student-specific endpoints
- **Teachers**: Can access teacher-specific endpoints and manage their classes
- **HODs (Head of Department)**: Can manage departmental activities and reports
- **Finance**: Can manage fees and financial reports
- **Admins**: Have full system access

## Authentication Routes (`/api/auth`)

### POST `/register`
**Purpose:** Register a new staff user (teacher, HOD, finance, admin)

**Request Body:**
```json
{
  "first_name": "string (required)",
  "last_name": "string (required)",
  "email": "string (required, valid email)",
  "password": "string (required, min 6 chars)",
  "role": "string (required: 'teacher', 'hod', 'finance', 'admin')"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "userId": "number"
}
```

### POST `/login`
**Purpose:** Login for staff users

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "number",
    "email": "string",
    "role": "string",
    "userType": "staff"
  },
  "token": "string (JWT token)"
}
```

### POST `/student/login`
**Purpose:** Login for students

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "number",
    "email": "string",
    "role": "student",
    "userType": "student"
  },
  "token": "string (JWT token)"
}
```

### POST `/logout`
**Purpose:** Logout user

**Response (200):**
```json
{
  "message": "Logout successful"
}
```

### GET `/profile`
**Purpose:** Get current user profile
**Auth:** Required

**Response (200):**
```json
{
  "user": {
    "id": "number",
    "email": "string",
    "role": "string",
    "userType": "string",
    "is_active": "boolean",
    "created_at": "string (ISO date)"
  }
}
```

### POST `/forgot-password`
**Purpose:** Request password reset

**Request Body:**
```json
{
  "email": "string (required)"
}
```

**Response (200):**
```json
{
  "message": "If the email exists, a reset link has been sent"
}
```

### POST `/reset-password`
**Purpose:** Reset password with token

**Request Body:**
```json
{
  "token": "string (required)",
  "newPassword": "string (required, min 6 chars)"
}
```

**Response (200):**
```json
{
  "message": "Password reset successfully"
}
```

## Student Routes (`/api/student`) - Student Role Required

### GET `/profile`
**Purpose:** Get student profile
**Auth:** Required (student)

**Response (200):**
```json
{
  "id": "number",
  "user": {
    "email": "string",
    "first_name": "string",
    "last_name": "string"
  }
}
```

### PUT `/profile`
**Purpose:** Update student profile
**Auth:** Required (student)

**Request Body:**
```json
{
  "email": "string (optional)",
  "first_name": "string (optional)",
  "last_name": "string (optional)",
  "date_of_birth": "string (optional, ISO date)",
  "gender": "string (optional)",
  "address": "string (optional)",
  "phone": "string (optional)",
  "department_id": "number (optional)",
  "enrollment_year": "number (optional)",
  "current_year": "number (optional)",
  "enrollment_date": "string (optional, ISO date)",
  "graduation_date": "string (optional, ISO date)",
  "status": "string (optional: 'active', 'inactive', 'graduated', 'suspended')"
}
```

**Response (200):**
```json
{
  "message": "Profile updated successfully"
}
```

### GET `/grades`
**Purpose:** Get student grades and GPA
**Auth:** Required (student)

**Response (200):**
```json
{
  "grades": [
    {
      "id": "number",
      "course_id": "number",
      "grade": "string",
      "semester": "string",
      "year": "number",
      "comments": "string",
      "course_name": "string"
    }
  ],
  "gpa": "number"
}
```

### GET `/attendance/startDate=YYYY-MM-DD/endDate=YYYY-MM-DD`
**Purpose:** Get student attendance records
**Auth:** Required (student)

**Response (200):**
```json
[
  {
    "id": "number",
    "student_id": "number",
    "course_id": "number",
    "date": "string (YYYY-MM-DD)",
    "status": "string ('present', 'absent', 'late')",
    "notes": "string",
    "course_name": "string"
  }
]
```

### GET `/fees`
**Purpose:** Get student fees and outstanding amount
**Auth:** Required (student)

**Response (200):**
```json
{
  "fees": [
    {
      "id": "number",
      "fee_type": "string",
      "amount": "number",
      "due_date": "string (YYYY-MM-DD)",
      "status": "string ('paid', 'unpaid')",
      "paid_date": "string (YYYY-MM-DD)"
    }
  ],
  "totalOutstanding": "number"
}
```

### GET `/timetable/semester=string`
**Purpose:** Get student timetable
**Auth:** Required (student)

**Response (200):**
```json
[
  {
    "id": "number",
    "course_id": "number",
    "teacher_id": "number",
    "day_of_week": "number (1-7)",
    "start_time": "string (HH:MM:SS)",
    "end_time": "string (HH:MM:SS)",
    "course_name": "string",
    "teacher_name": "string"
  }
]
```

## Teacher Routes (`/api/teacher`) - Teacher Role Required

### GET `/profile`
**Purpose:** Get teacher profile
**Auth:** Required (teacher)

**Response (200):**
```json
{
  "user": {
    "id": "number",
    "first_name": "string",
    "last_name": "string",
    "email": "string",
    "department_id": "number"
  }
}
```

### PUT `/profile`
**Purpose:** Update teacher profile
**Auth:** Required (teacher)

**Request Body:**
```json
{
  "first_name": "string (optional)",
  "last_name": "string (optional)",
  "email": "string (optional)",
  "department_id": "number (optional)"
}
```

**Response (200):**
```json
{
  "message": "Profile updated successfully"
}
```

### GET `/classes`
**Purpose:** Get classes assigned to teacher
**Auth:** Required (teacher)

**Response (200):**
```json
[
  {
    "id": "number",
    "course_code": "string",
    "name": "string",
    "credits": "number",
    "department_name": "string"
  }
]
```

### POST `/attendance`
**Purpose:** Mark attendance for students
**Auth:** Required (teacher)

**Request Body:**
```json
{
  "courseId": "number (required)",
  "attendance": [
    {
      "studentId": "number (required)",
      "status": "string (required: 'present', 'absent', 'late')",
      "notes": "string (optional)"
    }
  ],
  "date": "string (required, YYYY-MM-DD)"
}
```

**Response (200):**
```json
{
  "message": "Attendance marked successfully",
  "results": [
    {
      "studentId": "number",
      "success": "boolean",
      "attendanceId": "number (if success)",
      "message": "string (if failed)"
    }
  ]
}
```

### POST `/grades`
**Purpose:** Enter grades for students
**Auth:** Required (teacher)

**Request Body:**
```json
{
  "courseId": "number (required)",
  "grades": [
    {
      "studentId": "number (required)",
      "grade": "string (required)",
      "semester": "string (required)",
      "year": "number (required)",
      "comments": "string (optional)"
    }
  ]
}
```

**Response (200):**
```json
{
  "message": "Grades entered successfully",
  "results": [
    {
      "studentId": "number",
      "success": "boolean",
      "gradeId": "number (if success)",
      "message": "string (if failed)"
    }
  ]
}
```

### GET `/timetable?semester=string`
**Purpose:** Get teacher timetable
**Auth:** Required (teacher)

**Response (200):**
```json
[
  {
    "id": "number",
    "course_id": "number",
    "class_id": "number",
    "day_of_week": "number (1-7)",
    "start_time": "string (HH:MM:SS)",
    "end_time": "string (HH:MM:SS)",
    "course_name": "string"
  }
]
```

### GET `/classes/:courseId?/students`
**Purpose:** Get students in teacher's classes
**Auth:** Required (teacher)

**Response (200):**
```json
[
  {
    "id": "number",
    "first_name": "string",
    "last_name": "string",
    "email": "string",
    "course_name": "string"
  }
]
```

## HOD Routes (`/api/hod`) - HOD Role Required + Department Authorization

### GET `/teachers`
**Purpose:** Get teachers in department
**Auth:** Required (hod) + Department auth

**Response (200):**
```json
[
  {
    "id": "number",
    "first_name": "string",
    "last_name": "string",
    "email": "string",
    "role": "teacher",
    "department_id": "number"
  }
]
```

### POST `/activities/approve`
**Purpose:** Approve/reject teacher activities
**Auth:** Required (hod) + Department auth

**Request Body:**
```json
{
  "activityType": "string (required: 'grade')",
  "activityId": "number (required)",
  "approve": "boolean (required)"
}
```

**Response (200):**
```json
{
  "message": "grade activity 123 has been approved"
}
```

### POST `/reports/:reportType`
**Purpose:** Generate departmental reports
**Auth:** Required (hod) + Department auth

**Request Body:**
```json
{
  "semester": "string (optional)",
  "year": "number (optional)"
}
```

**Response (200):**
```json
{
  "reportType": "attendance",
  "report": {
    "attendance": [
      {
        "course_name": "string",
        "course_code": "string",
        "total_classes": "number",
        "present_count": "number",
        "attendance_percentage": "number"
      }
    ]
  }
}
```

### POST `/courses/manage`
**Purpose:** Manage courses in department
**Auth:** Required (hod) + Department auth

**Request Body:**
```json
{
  "action": "string (required: 'add', 'edit', 'delete')",
  "courseData": {
    "id": "number (for edit/delete)",
    "course_code": "string (required for add/edit)",
    "name": "string (required for add/edit)",
    "credits": "number (required for add/edit)"
  }
}
```

**Response (200):**
```json
{
  "message": "Course added",
  "courseId": "number"
}
```

### POST `/timetable/approve`
**Purpose:** Approve timetable changes
**Auth:** Required (hod) + Department auth

**Request Body:**
```json
{
  "timetableId": "number (required)",
  "approve": "boolean (required)"
}
```

**Response (200):**
```json
{
  "message": "Timetable 123 has been approved"
}
```

### GET `/stats`
**Purpose:** Get department statistics
**Auth:** Required (hod) + Department auth

**Response (200):**
```json
{
  "attendance": {
    "total_records": "number",
    "avg_attendance_percentage": "number"
  },
  "grades": [
    {
      "grade": "string",
      "count": "number"
    }
  ],
  "courses": "number",
  "teachers": "number"
}
```

### GET `/timetable?semester=string`
**Purpose:** Get department timetable
**Auth:** Required (hod) + Department auth

**Response (200):**
```json
[
  {
    "id": "number",
    "course_name": "string",
    "course_code": "string",
    "day_of_week": "number",
    "start_time": "string",
    "end_time": "string",
    "teacher_name": "string"
  }
]
```

## Notification Routes (`/api/notifications`) - Auth Required

### GET `/:page?/:limit?`
**Purpose:** Get user's notifications
**Auth:** Required

**Response (200):**
```json
[
  {
    "id": "number",
    "type": "string",
    "title": "string",
    "message": "string",
    "data": "object",
    "is_read": "boolean",
    "created_at": "string (ISO date)",
    "sender_first_name": "string",
    "sender_last_name": "string"
  }
]
```

### PUT `/:notificationId/read`
**Purpose:** Mark notification as read
**Auth:** Required

**Response (200):**
```json
{
  "message": "Notification marked as read"
}
```

### PUT `/read-all`
**Purpose:** Mark all notifications as read
**Auth:** Required

**Response (200):**
```json
{
  "message": "5 notifications marked as read"
}
```

### POST `/send/user`
**Purpose:** Send notification to specific users
**Auth:** Required (admin, hod, teacher)

**Request Body:**
```json
{
  "recipientIds": "array of numbers (required)",
  "type": "string (required)",
  "title": "string (required)",
  "message": "string (required)",
  "data": "object (optional)"
}
```

**Response (201):**
```json
{
  "message": "Notification sent successfully",
  "notificationIds": "array of numbers",
  "recipients": "number"
}
```

### POST `/send/department`
**Purpose:** Send notification to department
**Auth:** Required (hod)

**Request Body:**
```json
{
  "departmentId": "number (required)",
  "role": "string (optional)",
  "type": "string (required)",
  "title": "string (required)",
  "message": "string (required)",
  "data": "object (optional)"
}
```

**Response (201):**
```json
{
  "message": "Notification sent to 10 users",
  "notificationIds": "array of numbers",
  "recipients": "number"
}
```

### POST `/send/course`
**Purpose:** Send notification to course students
**Auth:** Required (teacher)

**Request Body:**
```json
{
  "courseId": "number (required)",
  "type": "string (required)",
  "title": "string (required)",
  "message": "string (required)",
  "data": "object (optional)"
}
```

**Response (201):**
```json
{
  "message": "Notification sent to 25 students",
  "notificationIds": "array of numbers",
  "recipients": "number"
}
```

## Admin Routes (`/api/admin`) - Admin Role Required

### POST `/users`
**Purpose:** Create new user
**Auth:** Required (admin)

**Request Body:**
```json
{
  "firstName": "string (required)",
  "lastName": "string (required)",
  "email": "string (required)",
  "password": "string (required)",
  "role": "string (required: 'student', 'teacher', 'hod', 'finance', 'admin')",
  "departmentId": "number (required for students)",
  "additionalData": {
    "enrollmentYear": "number (optional)",
    "enrollmentDate": "string (optional, ISO date)"
  }
}
```

**Response (201):**
```json
{
  "message": "User created successfully",
  "userId": "number"
}
```

### GET `/users?page=1&limit=10&role=string&departmentId=number&search=string`
**Purpose:** Get all users with filtering
**Auth:** Required (admin)

**Response (200):**
```json
{
  "users": [
    {
      "id": "number",
      "first_name": "string",
      "last_name": "string",
      "email": "string",
      "role": "string",
      "created_at": "string (ISO date)",
      "department_name": "string"
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "pages": "number"
  }
}
```

### PUT `/users/:userId`
**Purpose:** Update user
**Auth:** Required (admin)

**Request Body:**
```json
{
  "firstName": "string (optional)",
  "lastName": "string (optional)",
  "email": "string (optional)",
  "role": "string (optional)",
  "departmentId": "number (optional)",
  "additionalData": "object (optional)"
}
```

**Response (200):**
```json
{
  "message": "User updated successfully"
}
```

### DELETE `/users/:userId`
**Purpose:** Delete user
**Auth:** Required (admin)

**Response (200):**
```json
{
  "message": "User deleted successfully"
}
```

### POST `/calendar`
**Purpose:** Manage academic calendar
**Auth:** Required (admin)

**Request Body:**
```json
{
  "eventName": "string (required)",
  "eventDate": "string (required, YYYY-MM-DD)",
  "eventType": "string (required)",
  "description": "string (optional)"
}
```

**Response (201):**
```json
{
  "message": "Calendar event added successfully",
  "eventId": "number"
}
```

### POST `/timetable`
**Purpose:** Setup timetable
**Auth:** Required (admin)

**Request Body:**
```json
{
  "action": "string (required: 'add', 'update', 'delete')",
  "timetableData": {
    "course_id": "number",
    "teacher_id": "number",
    "class_id": "number",
    "day_of_week": "number",
    "start_time": "string",
    "end_time": "string"
  }
}
```

**Response (200):**
```json
{
  "message": "Timetable slot added successfully",
  "slotId": "number"
}
```

### GET `/stats`
**Purpose:** Get system statistics
**Auth:** Required (admin)

**Response (200):**
```json
{
  "totalUsers": "number",
  "totalStudents": "number",
  "totalTeachers": "number"
}
```

### POST `/departments`
**Purpose:** Create new department
**Auth:** Required (admin)

**Request Body:**
```json
{
  "name": "string (required)",
  "code": "string (required)",
  "description": "string (optional)",
  "head_id": "number (optional, must be a valid HOD user ID)"
}
```

**Response (201):**
```json
{
  "message": "Department created successfully",
  "departmentId": "number"
}
```

## Finance Routes (`/api/finance`) - Finance Role Required

### GET `/students/:studentId/fees`
**Purpose:** Get student fees
**Auth:** Required (finance)

**Response (200):**
```json
[
  {
    "id": "number",
    "fee_type": "string",
    "amount": "number",
    "due_date": "string (YYYY-MM-DD)",
    "status": "string",
    "paid_date": "string (YYYY-MM-DD)"
  }
]
```

### POST `/fees`
**Purpose:** Create new fee
**Auth:** Required (finance)

**Request Body:**
```json
{
  "studentId": "number (required)",
  "amount": "number (required)",
  "type": "string (required)",
  "dueDate": "string (required, YYYY-MM-DD)",
  "description": "string (optional)"
}
```

**Response (201):**
```json
{
  "message": "Fee created successfully",
  "feeId": "number"
}
```

### PUT `/fees/:feeId/pay`
**Purpose:** Mark fee as paid
**Auth:** Required (finance)

**Request Body:**
```json
{
  "paymentMethod": "string (required)",
  "transactionId": "string (required)",
  "paymentDate": "string (optional, YYYY-MM-DD)"
}
```

**Response (200):**
```json
{
  "message": "Fee marked as paid successfully"
}
```

### GET `/students/:studentId/invoice`
**Purpose:** Generate invoice
**Auth:** Required (finance)

**Response (200):**
```json
{
  "studentId": "number",
  "studentName": "string",
  "outstandingFees": [
    {
      "id": "number",
      "fee_type": "string",
      "amount": "number",
      "due_date": "string"
    }
  ],
  "totalAmount": "number",
  "generatedAt": "string (ISO date)"
}
```

### GET `/reports?reportType=string&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
**Purpose:** Get financial reports
**Auth:** Required (finance)

**Response (200):**
```json
{
  "totalRevenue": "number",
  "outstandingFees": "number"
}
```

### GET `/students/:studentId/payments?limit=10&offset=0`
**Purpose:** Get payment history
**Auth:** Required (finance)

**Response (200):**
```json
[
  {
    "id": "number",
    "fee_type": "string",
    "amount": "number",
    "paid_date": "string",
    "payment_method": "string",
    "transaction_id": "string"
  }
]
```

### GET `/overdue`
**Purpose:** Get overdue fees
**Auth:** Required (finance)

**Response (200):**
```json
[
  {
    "id": "number",
    "student_id": "number",
    "fee_type": "string",
    "amount": "number",
    "due_date": "string",
    "student_name": "string",
    "days_overdue": "number"
  }
]
```

## Error Response Format

All endpoints return errors in this format:

```json
{
  "message": "Error description"
}
```

## Common HTTP Status Codes

- **200**: Success
- **201**: Created
- **400**: Bad Request (validation errors)
- **401**: Unauthorized (invalid/missing authentication)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **409**: Conflict (duplicate data)
- **500**: Internal Server Error

## Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

Tokens are obtained from login endpoints and are valid for 24 hours.

## Data Validation Rules

### Student Profile Updates
- Email must be valid format
- Enrollment/graduation dates must be valid ISO dates
- Department ID must be a positive integer
- Status must be one of: 'active', 'inactive', 'graduated', 'suspended'

### Attendance
- Status must be one of: 'present', 'absent', 'late'
- Date must be in YYYY-MM-DD format
- Student ID and Course ID must be positive integers

### Grades
- Grade must be a non-empty string
- Semester must be a non-empty string
- Year must be between 2000-2100
- Student ID and Course ID must be positive integers

### Fees
- Amount must be a positive number
- Due date must be in YYYY-MM-DD format
- Fee type must be a non-empty string

### Notifications
- Type, title, and message are required fields
- Data field is optional and will be JSON stringified
- Recipient IDs must be an array of positive integers

This documentation provides the complete API specification for the SMIS system, showing the expected request/response data formats for all endpoints across different user roles.
