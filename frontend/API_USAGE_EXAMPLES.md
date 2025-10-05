# SMIS API Usage Examples

This document provides real-world examples of how to use the SMIS API integration layer.

## Table of Contents
1. [Authentication Examples](#authentication-examples)
2. [Student Operations](#student-operations)
3. [Teacher Operations](#teacher-operations)
4. [HOD Operations](#hod-operations)
5. [Finance Operations](#finance-operations)
6. [Admin Operations](#admin-operations)
7. [Notification Operations](#notification-operations)
8. [Error Handling Patterns](#error-handling-patterns)
9. [React Component Examples](#react-component-examples)

## Authentication Examples

### Example 1: Login and Store Token
```typescript
import { authAPI } from '@/services/api';

const handleLogin = async (email: string, password: string) => {
  try {
    const response = await authAPI.login({ email, password });
    
    // Token is automatically stored in localStorage
    console.log('Login successful:', response.user);
    
    // Redirect based on user role
    switch (response.user.role) {
      case 'student':
        window.location.href = '/student/dashboard';
        break;
      case 'teacher':
        window.location.href = '/teacher/dashboard';
        break;
      case 'admin':
        window.location.href = '/admin/dashboard';
        break;
      default:
        window.location.href = '/dashboard';
    }
  } catch (error) {
    console.error('Login failed:', error.message);
    // Show error to user
  }
};
```

### Example 2: Student Login
```typescript
import { authAPI } from '@/services/api';

const handleStudentLogin = async (email: string, password: string) => {
  try {
    const response = await authAPI.studentLogin({ email, password });
    console.log('Student login successful:', response.user);
    window.location.href = '/student/dashboard';
  } catch (error) {
    if (error.status === 401) {
      alert('Invalid student credentials');
    } else {
      alert('Login failed. Please try again.');
    }
  }
};
```

### Example 3: Check Authentication Status
```typescript
import { authAPI } from '@/services/api';

const checkAuthStatus = async () => {
  if (!authAPI.isAuthenticated()) {
    window.location.href = '/login';
    return;
  }
  
  try {
    const profile = await authAPI.getProfile();
    console.log('Current user:', profile.user);
  } catch (error) {
    if (error.status === 401) {
      // Token expired
      authAPI.clearAuth();
      window.location.href = '/login';
    }
  }
};
```

## Student Operations

### Example 4: Student Dashboard Data
```typescript
import { studentAPI } from '@/services/api';

const loadStudentDashboard = async () => {
  try {
    // Load all student data in parallel
    const [profile, grades, fees, attendance] = await Promise.all([
      studentAPI.getProfile(),
      studentAPI.getGrades(),
      studentAPI.getFees(),
      studentAPI.getCurrentSemesterAttendance(),
    ]);
    
    return {
      profile,
      grades,
      fees,
      attendance,
    };
  } catch (error) {
    console.error('Failed to load dashboard:', error.message);
    throw error;
  }
};
```

### Example 5: View Attendance for Date Range
```typescript
import { studentAPI } from '@/services/api';

const viewAttendanceForMonth = async (year: number, month: number) => {
  try {
    // Get first and last day of month
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    
    const attendance = await studentAPI.getAttendance(startDate, endDate);
    
    // Calculate statistics
    const totalClasses = attendance.length;
    const presentCount = attendance.filter(a => a.status === 'present').length;
    const attendanceRate = totalClasses > 0 ? (presentCount / totalClasses) * 100 : 0;
    
    console.log(`Attendance for ${year}-${month}:`);
    console.log(`Total Classes: ${totalClasses}`);
    console.log(`Present: ${presentCount}`);
    console.log(`Attendance Rate: ${attendanceRate.toFixed(1)}%`);
    
    return { attendance, totalClasses, presentCount, attendanceRate };
  } catch (error) {
    console.error('Failed to load attendance:', error.message);
  }
};
```

### Example 6: Update Student Profile
```typescript
import { studentAPI } from '@/services/api';

const updateStudentProfile = async (updates: {
  phone?: string;
  address?: string;
  email?: string;
}) => {
  try {
    await studentAPI.updateProfile(updates);
    console.log('Profile updated successfully');
    
    // Reload profile to get updated data
    const updatedProfile = await studentAPI.getProfile();
    return updatedProfile;
  } catch (error) {
    if (error.status === 400) {
      console.error('Invalid profile data:', error.message);
    } else {
      console.error('Failed to update profile:', error.message);
    }
    throw error;
  }
};
```

## Teacher Operations

### Example 7: Mark Attendance for Class
```typescript
import { teacherAPI } from '@/services/api';

const markClassAttendance = async (courseId: number, date: string) => {
  try {
    // Get students in the course
    const students = await teacherAPI.getCourseStudents(courseId);
    
    // Mark all as present by default (teacher can modify)
    const attendance = students.map(student => ({
      studentId: student.id,
      status: 'present' as const,
      notes: '',
    }));
    
    const result = await teacherAPI.markAttendance({
      courseId,
      attendance,
      date,
    });
    
    console.log('Attendance marked:', result);
    return result;
  } catch (error) {
    console.error('Failed to mark attendance:', error.message);
    throw error;
  }
};
```

### Example 8: Enter Grades for Course
```typescript
import { teacherAPI } from '@/services/api';

const enterCourseGrades = async (
  courseId: number,
  semester: string,
  year: number,
  gradeData: { studentId: number; grade: string; comments?: string }[]
) => {
  try {
    const grades = gradeData.map(g => ({
      studentId: g.studentId,
      grade: g.grade,
      semester,
      year,
      comments: g.comments || '',
    }));
    
    const result = await teacherAPI.enterGrades({
      courseId,
      grades,
    });
    
    console.log('Grades entered:', result);
    
    // Check for any failures
    const failures = result.results.filter(r => !r.success);
    if (failures.length > 0) {
      console.warn('Some grades failed to save:', failures);
    }
    
    return result;
  } catch (error) {
    console.error('Failed to enter grades:', error.message);
    throw error;
  }
};
```

### Example 9: Get Teacher's Today Schedule
```typescript
import { teacherAPI } from '@/services/api';

const getTodaySchedule = async () => {
  try {
    const schedule = await teacherAPI.getTodaySchedule();
    
    // Sort by start time
    const sortedSchedule = schedule.sort((a, b) => 
      a.start_time.localeCompare(b.start_time)
    );
    
    console.log('Today\'s Schedule:');
    sortedSchedule.forEach(entry => {
      console.log(`${entry.start_time} - ${entry.end_time}: ${entry.course_name}`);
    });
    
    return sortedSchedule;
  } catch (error) {
    console.error('Failed to load schedule:', error.message);
  }
};
```

## HOD Operations

### Example 10: Generate Department Report
```typescript
import { hodAPI } from '@/services/api';

const generateDepartmentAttendanceReport = async (semester: string, year: number) => {
  try {
    const report = await hodAPI.generateAttendanceReport({ semester, year });
    
    console.log(`Attendance Report for ${semester} ${year}:`);
    report.report.attendance.forEach(course => {
      console.log(`${course.course_name} (${course.course_code}):`);
      console.log(`  Total Classes: ${course.total_classes}`);
      console.log(`  Attendance Rate: ${course.attendance_percentage}%`);
    });
    
    return report;
  } catch (error) {
    console.error('Failed to generate report:', error.message);
    throw error;
  }
};
```

### Example 11: Manage Department Courses
```typescript
import { hodAPI } from '@/services/api';

const addNewCourse = async (courseData: {
  course_code: string;
  name: string;
  credits: number;
}) => {
  try {
    const result = await hodAPI.addCourse(courseData);
    console.log('Course added successfully:', result);
    return result;
  } catch (error) {
    if (error.status === 409) {
      console.error('Course code already exists');
    } else {
      console.error('Failed to add course:', error.message);
    }
    throw error;
  }
};

const updateCourse = async (courseId: number, updates: {
  course_code?: string;
  name?: string;
  credits?: number;
}) => {
  try {
    const result = await hodAPI.editCourse({
      id: courseId,
      course_code: updates.course_code || '',
      name: updates.name || '',
      credits: updates.credits || 0,
    });
    console.log('Course updated successfully:', result);
    return result;
  } catch (error) {
    console.error('Failed to update course:', error.message);
    throw error;
  }
};
```

## Finance Operations

### Example 12: Create and Manage Student Fees
```typescript
import { financeAPI } from '@/services/api';

const createSemesterFees = async (studentId: number, semester: string) => {
  try {
    const dueDate = '2024-03-01'; // Semester fee due date
    
    // Create multiple fees for the semester
    const fees = await Promise.all([
      financeAPI.createTuitionFee(studentId, 5000, dueDate, `${semester} Tuition`),
      financeAPI.createLibraryFee(studentId, 100, dueDate, `${semester} Library Fee`),
      financeAPI.createExaminationFee(studentId, 200, dueDate, `${semester} Exam Fee`),
    ]);
    
    console.log('Semester fees created:', fees);
    return fees;
  } catch (error) {
    console.error('Failed to create fees:', error.message);
    throw error;
  }
};

const processPayment = async (feeId: number, paymentMethod: string, transactionId: string) => {
  try {
    const result = await financeAPI.markFeePaid(feeId, {
      paymentMethod,
      transactionId,
      paymentDate: new Date().toISOString().split('T')[0],
    });
    
    console.log('Payment processed:', result);
    return result;
  } catch (error) {
    console.error('Failed to process payment:', error.message);
    throw error;
  }
};
```

### Example 13: Generate Financial Reports
```typescript
import { financeAPI } from '@/services/api';

const generateMonthlyFinancialReport = async (year: number, month: number) => {
  try {
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    
    const [report, overdueFees] = await Promise.all([
      financeAPI.getFinancialReports({
        reportType: 'monthly',
        startDate,
        endDate,
      }),
      financeAPI.getOverdueFees(),
    ]);
    
    console.log(`Financial Report for ${year}-${month}:`);
    console.log(`Total Revenue: $${report.totalRevenue}`);
    console.log(`Outstanding Fees: $${report.outstandingFees}`);
    console.log(`Overdue Fees Count: ${overdueFees.length}`);
    
    return { report, overdueFees };
  } catch (error) {
    console.error('Failed to generate report:', error.message);
    throw error;
  }
};
```

## Admin Operations

### Example 14: Create Users in Bulk
```typescript
import { adminAPI } from '@/services/api';

const createBulkUsers = async (users: Array<{
  firstName: string;
  lastName: string;
  email: string;
  role: 'student' | 'teacher' | 'hod' | 'finance' | 'admin';
  departmentId?: number;
}>) => {
  try {
    const results = await Promise.allSettled(
      users.map(user => adminAPI.createUser({
        ...user,
        password: 'defaultPassword123', // Should be changed on first login
      }))
    );
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`Bulk user creation: ${successful} successful, ${failed} failed`);
    
    // Log failures
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Failed to create user ${users[index].email}:`, result.reason.message);
      }
    });
    
    return { successful, failed, results };
  } catch (error) {
    console.error('Bulk user creation failed:', error.message);
    throw error;
  }
};
```

### Example 15: Manage System Data
```typescript
import { adminAPI } from '@/services/api';

const getSystemOverview = async () => {
  try {
    const [stats, users, students, departments] = await Promise.all([
      adminAPI.getSystemStats(),
      adminAPI.getAllUsers(1, 10), // First 10 users
      adminAPI.getAllStudents(1, 10), // First 10 students
      adminAPI.getAllDepartments(1, 10), // First 10 departments
    ]);
    
    console.log('System Overview:');
    console.log(`Total Users: ${stats.totalUsers}`);
    console.log(`Total Students: ${stats.totalStudents}`);
    console.log(`Total Teachers: ${stats.totalTeachers}`);
    console.log(`Active Departments: ${departments.length}`);
    
    return { stats, users, students, departments };
  } catch (error) {
    console.error('Failed to load system overview:', error.message);
    throw error;
  }
};
```

## Notification Operations

### Example 16: Send Notifications
```typescript
import { notificationsAPI } from '@/services/api';

const sendAssignmentNotification = async (courseId: number, assignmentDetails: any) => {
  try {
    const result = await notificationsAPI.sendAssignmentNotification(
      courseId,
      'New Assignment Posted',
      `A new assignment "${assignmentDetails.title}" has been posted. Due date: ${assignmentDetails.dueDate}`,
      assignmentDetails
    );
    
    console.log(`Assignment notification sent to ${result.recipients} students`);
    return result;
  } catch (error) {
    console.error('Failed to send notification:', error.message);
    throw error;
  }
};

const sendFeeReminder = async (studentIds: number[], dueDate: string) => {
  try {
    const result = await notificationsAPI.sendFeeReminder(
      studentIds,
      'Fee Payment Reminder',
      `Your fees are due on ${dueDate}. Please make payment to avoid late charges.`,
      { dueDate, type: 'fee_reminder' }
    );
    
    console.log(`Fee reminder sent to ${result.recipients} students`);
    return result;
  } catch (error) {
    console.error('Failed to send fee reminder:', error.message);
    throw error;
  }
};
```

## Error Handling Patterns

### Example 17: Comprehensive Error Handling
```typescript
import { getErrorMessage } from '@/services/api';

const handleApiCall = async <T>(apiCall: () => Promise<T>): Promise<T | null> => {
  try {
    return await apiCall();
  } catch (error: any) {
    const message = getErrorMessage(error);
    
    switch (error.status) {
      case 400:
        console.error('Validation Error:', message);
        alert('Please check your input and try again.');
        break;
        
      case 401:
        console.error('Authentication Error:', message);
        // Redirect to login (handled automatically by API)
        break;
        
      case 403:
        console.error('Permission Error:', message);
        alert('You do not have permission to perform this action.');
        break;
        
      case 404:
        console.error('Not Found:', message);
        alert('The requested resource was not found.');
        break;
        
      case 409:
        console.error('Conflict Error:', message);
        alert('This data already exists. Please use different values.');
        break;
        
      case 500:
        console.error('Server Error:', message);
        alert('Server error. Please try again later.');
        break;
        
      default:
        console.error('Unknown Error:', message);
        alert('An unexpected error occurred. Please try again.');
    }
    
    return null;
  }
};

// Usage
const result = await handleApiCall(() => studentAPI.getProfile());
if (result) {
  console.log('Profile loaded:', result);
}
```

## React Component Examples

### Example 18: Student Dashboard Component
```typescript
import React, { useState, useEffect } from 'react';
import { studentAPI } from '@/services/api';

const StudentDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [profile, grades, fees] = await Promise.all([
          studentAPI.getProfile(),
          studentAPI.getGrades(),
          studentAPI.getFees(),
        ]);
        
        setData({ profile, grades, fees });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboard();
  }, []);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>No data available</div>;
  
  return (
    <div>
      <h1>Welcome, {data.profile.user.first_name}!</h1>
      <div>
        <h2>Academic Performance</h2>
        <p>GPA: {data.grades.gpa}</p>
        <p>Total Courses: {data.grades.grades.length}</p>
      </div>
      <div>
        <h2>Financial Status</h2>
        <p>Outstanding Fees: ${data.fees.totalOutstanding}</p>
      </div>
    </div>
  );
};

export default StudentDashboard;
```

### Example 19: Teacher Attendance Component
```typescript
import React, { useState, useEffect } from 'react';
import { teacherAPI } from '@/services/api';

const AttendanceMarker: React.FC<{ courseId: number }> = ({ courseId }) => {
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const loadStudents = async () => {
      try {
        const courseStudents = await teacherAPI.getCourseStudents(courseId);
        setStudents(courseStudents);
        
        // Initialize attendance as present
        const initialAttendance = courseStudents.reduce((acc, student) => {
          acc[student.id] = 'present';
          return acc;
        }, {} as Record<number, string>);
        setAttendance(initialAttendance);
      } catch (error) {
        console.error('Failed to load students:', error);
      }
    };
    
    loadStudents();
  }, [courseId]);
  
  const handleAttendanceChange = (studentId: number, status: string) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };
  
  const submitAttendance = async () => {
    try {
      setLoading(true);
      
      const attendanceData = students.map(student => ({
        studentId: student.id,
        status: attendance[student.id] as 'present' | 'absent' | 'late',
        notes: '',
      }));
      
      await teacherAPI.markAttendance({
        courseId,
        attendance: attendanceData,
        date: new Date().toISOString().split('T')[0],
      });
      
      alert('Attendance marked successfully!');
    } catch (error) {
      alert('Failed to mark attendance. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <h2>Mark Attendance</h2>
      {students.map(student => (
        <div key={student.id} style={{ marginBottom: '10px' }}>
          <span>{student.first_name} {student.last_name}</span>
          <select
            value={attendance[student.id]}
            onChange={(e) => handleAttendanceChange(student.id, e.target.value)}
          >
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
          </select>
        </div>
      ))}
      <button onClick={submitAttendance} disabled={loading}>
        {loading ? 'Submitting...' : 'Submit Attendance'}
      </button>
    </div>
  );
};

export default AttendanceMarker;
```

These examples demonstrate real-world usage patterns for the SMIS API integration layer. Each example includes proper error handling, type safety, and follows best practices for React applications.
