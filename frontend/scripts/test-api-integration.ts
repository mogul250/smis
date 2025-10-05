#!/usr/bin/env ts-node

/**
 * Automated API Integration Test
 * Tests all endpoints in sequence with real backend
 * 
 * Usage:
 * npm run test:integration
 * or
 * npx ts-node scripts/test-api-integration.ts
 * 
 * Environment Variables:
 * - API_BASE_URL: Backend API URL (default: http://localhost:5000/api)
 * - TEST_TIMEOUT: Test timeout in ms (default: 30000)
 */

import { authAPI, studentAPI, teacherAPI, hodAPI, financeAPI, adminAPI, notificationsAPI } from '../src/services/api/index.js';

// Test configuration
const config = {
  baseURL: process.env.API_BASE_URL || 'http://localhost:5000/api',
  timeout: parseInt(process.env.TEST_TIMEOUT || '30000'),
  
  // Test credentials (these should exist in your test database)
  credentials: {
    admin: { email: 'admin@test.com', password: 'admin123' },
    teacher: { email: 'teacher@test.com', password: 'teacher123' },
    student: { email: 'student@test.com', password: 'student123' },
    hod: { email: 'hod@test.com', password: 'hod123' },
    finance: { email: 'finance@test.com', password: 'finance123' },
  },
};

// Test results tracking
interface TestResult {
  endpoint: string;
  method: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  duration: number;
  error?: any;
}

const testResults: TestResult[] = [];
let currentUser: any = null;

// Utility functions
function log(message: string, type: 'info' | 'success' | 'error' | 'warn' = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m',   // Red
    warn: '\x1b[33m',    // Yellow
  };
  const reset = '\x1b[0m';
  console.log(`${colors[type]}${message}${reset}`);
}

function logResult(result: TestResult) {
  const status = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
  const duration = `(${result.duration}ms)`;
  log(`${status} ${result.method} ${result.endpoint} ${duration} - ${result.message}`, 
      result.status === 'PASS' ? 'success' : result.status === 'FAIL' ? 'error' : 'warn');
}

async function testEndpoint(
  name: string,
  method: string,
  testFn: () => Promise<any>,
  expectedStatus: 'success' | 'error' = 'success'
): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    const result = await testFn();
    const duration = Date.now() - startTime;
    
    const testResult: TestResult = {
      endpoint: name,
      method,
      status: expectedStatus === 'success' ? 'PASS' : 'FAIL',
      message: expectedStatus === 'success' ? 'Success' : 'Expected error but got success',
      duration,
    };
    
    if (expectedStatus === 'error') {
      testResult.status = 'FAIL';
      testResult.message = 'Expected error but got success';
    }
    
    testResults.push(testResult);
    logResult(testResult);
    return testResult;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    const testResult: TestResult = {
      endpoint: name,
      method,
      status: expectedStatus === 'error' ? 'PASS' : 'FAIL',
      message: expectedStatus === 'error' ? `Expected error: ${error.message}` : error.message,
      duration,
      error,
    };
    
    testResults.push(testResult);
    logResult(testResult);
    return testResult;
  }
}

// Test functions
async function testAuth() {
  log('\n🔐 Testing Authentication Endpoints...', 'info');
  
  // Test staff login
  await testEndpoint('/auth/login', 'POST', async () => {
    const response = await authAPI.login(config.credentials.admin);
    currentUser = response.user;
    return response;
  });
  
  // Test student login
  await testEndpoint('/auth/student/login', 'POST', async () => {
    return await authAPI.studentLogin(config.credentials.student);
  });
  
  // Test profile
  await testEndpoint('/auth/profile', 'GET', async () => {
    return await authAPI.getProfile();
  });
  
  // Test invalid credentials (should fail)
  await testEndpoint('/auth/login', 'POST', async () => {
    return await authAPI.login({ email: 'invalid@test.com', password: 'wrong' });
  }, 'error');
  
  // Test logout
  await testEndpoint('/auth/logout', 'POST', async () => {
    return await authAPI.logout();
  });
}

async function testStudentEndpoints() {
  log('\n👨‍🎓 Testing Student Endpoints...', 'info');
  
  // Login as student first
  await authAPI.studentLogin(config.credentials.student);
  
  await testEndpoint('/student/profile', 'GET', async () => {
    return await studentAPI.getProfile();
  });
  
  await testEndpoint('/student/grades', 'GET', async () => {
    return await studentAPI.getGrades();
  });
  
  await testEndpoint('/student/attendance', 'GET', async () => {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return await studentAPI.getAttendance(startDate, endDate);
  });
  
  await testEndpoint('/student/fees', 'GET', async () => {
    return await studentAPI.getFees();
  });
  
  await testEndpoint('/student/timetable', 'GET', async () => {
    return await studentAPI.getTimetable();
  });
  
  // Test invalid date format (should fail)
  await testEndpoint('/student/attendance', 'GET', async () => {
    return await studentAPI.getAttendance('invalid-date', '2024-01-31');
  }, 'error');
}

async function testTeacherEndpoints() {
  log('\n👨‍🏫 Testing Teacher Endpoints...', 'info');
  
  // Login as teacher first
  await authAPI.login(config.credentials.teacher);
  
  await testEndpoint('/teacher/profile', 'GET', async () => {
    return await teacherAPI.getProfile();
  });
  
  await testEndpoint('/teacher/classes', 'GET', async () => {
    return await teacherAPI.getClasses();
  });
  
  await testEndpoint('/teacher/classes/students', 'GET', async () => {
    return await teacherAPI.getAllStudents();
  });
  
  await testEndpoint('/teacher/timetable', 'GET', async () => {
    return await teacherAPI.getTimetable();
  });
  
  // Test attendance marking (might fail if no students/courses)
  await testEndpoint('/teacher/attendance', 'POST', async () => {
    return await teacherAPI.markAttendance({
      courseId: 1,
      attendance: [{ studentId: 1, status: 'present' }],
      date: new Date().toISOString().split('T')[0],
    });
  });
  
  // Test invalid course ID (should fail)
  await testEndpoint('/teacher/attendance', 'POST', async () => {
    return await teacherAPI.markAttendance({
      courseId: -1,
      attendance: [{ studentId: 1, status: 'present' }],
      date: new Date().toISOString().split('T')[0],
    });
  }, 'error');
}

async function testHODEndpoints() {
  log('\n👨‍💼 Testing HOD Endpoints...', 'info');
  
  // Login as HOD first
  await authAPI.login(config.credentials.hod);
  
  await testEndpoint('/hod/teachers', 'GET', async () => {
    return await hodAPI.getDepartmentTeachers();
  });
  
  await testEndpoint('/hod/stats', 'GET', async () => {
    return await hodAPI.getDepartmentStats();
  });
  
  await testEndpoint('/hod/timetable', 'GET', async () => {
    return await hodAPI.getDepartmentTimetable();
  });
  
  // Test course management
  await testEndpoint('/hod/courses/manage', 'POST', async () => {
    return await hodAPI.addCourse({
      course_code: 'TEST101',
      name: 'Test Course',
      credits: 3,
    });
  });
  
  // Test invalid action (should fail)
  await testEndpoint('/hod/courses/manage', 'POST', async () => {
    return await hodAPI.manageCourses({
      action: 'invalid' as any,
      courseData: { course_code: 'TEST', name: 'Test', credits: 3 },
    });
  }, 'error');
}

async function testFinanceEndpoints() {
  log('\n💰 Testing Finance Endpoints...', 'info');
  
  // Login as finance first
  await authAPI.login(config.credentials.finance);
  
  await testEndpoint('/finance/overdue', 'GET', async () => {
    return await financeAPI.getOverdueFees();
  });
  
  await testEndpoint('/finance/reports', 'GET', async () => {
    return await financeAPI.getFinancialReports();
  });
  
  // Test student fees (might fail if student doesn't exist)
  await testEndpoint('/finance/students/1/fees', 'GET', async () => {
    return await financeAPI.getStudentFees(1);
  });
  
  // Test fee creation
  await testEndpoint('/finance/fees', 'POST', async () => {
    return await financeAPI.createFee({
      studentId: 1,
      amount: 100,
      type: 'Test Fee',
      dueDate: '2024-12-31',
      description: 'Integration test fee',
    });
  });
  
  // Test invalid student ID (should fail)
  await testEndpoint('/finance/students/-1/fees', 'GET', async () => {
    return await financeAPI.getStudentFees(-1);
  }, 'error');
}

async function testAdminEndpoints() {
  log('\n👨‍💻 Testing Admin Endpoints...', 'info');
  
  // Login as admin first
  await authAPI.login(config.credentials.admin);
  
  await testEndpoint('/admin/stats', 'GET', async () => {
    return await adminAPI.getSystemStats();
  });
  
  await testEndpoint('/admin/users', 'GET', async () => {
    return await adminAPI.getAllUsers(1, 10);
  });
  
  await testEndpoint('/admin/students', 'GET', async () => {
    return await adminAPI.getAllStudents(1, 10);
  });
  
  await testEndpoint('/admin/departments', 'GET', async () => {
    return await adminAPI.getAllDepartments(1, 10);
  });
  
  // Test user creation
  await testEndpoint('/admin/users', 'POST', async () => {
    return await adminAPI.createUser({
      firstName: 'Test',
      lastName: 'User',
      email: `test.user.${Date.now()}@test.com`,
      password: 'password123',
      role: 'teacher',
    });
  });
  
  // Test invalid role (should fail)
  await testEndpoint('/admin/users', 'POST', async () => {
    return await adminAPI.createUser({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@test.com',
      password: 'password123',
      role: 'invalid' as any,
    });
  }, 'error');
}

async function testNotifications() {
  log('\n🔔 Testing Notifications Endpoints...', 'info');
  
  // Should work with any authenticated user
  await authAPI.login(config.credentials.admin);
  
  await testEndpoint('/notifications', 'GET', async () => {
    return await notificationsAPI.getNotifications();
  });
  
  await testEndpoint('/notifications/read-all', 'PUT', async () => {
    return await notificationsAPI.markAllAsRead();
  });
  
  // Test sending notification to users
  await testEndpoint('/notifications/send/user', 'POST', async () => {
    return await notificationsAPI.sendToUsers({
      recipientIds: [1],
      type: 'test',
      title: 'Integration Test',
      message: 'This is a test notification from integration tests',
    });
  });
  
  // Test invalid recipient IDs (should fail)
  await testEndpoint('/notifications/send/user', 'POST', async () => {
    return await notificationsAPI.sendToUsers({
      recipientIds: [],
      type: 'test',
      title: 'Test',
      message: 'Test',
    });
  }, 'error');
}

// Main test runner
async function runIntegrationTests() {
  log('🚀 Starting SMIS API Integration Tests...', 'info');
  log(`📡 Backend URL: ${config.baseURL}`, 'info');
  log(`⏱️  Timeout: ${config.timeout}ms`, 'info');
  
  const startTime = Date.now();
  
  try {
    // Test all modules
    await testAuth();
    await testStudentEndpoints();
    await testTeacherEndpoints();
    await testHODEndpoints();
    await testFinanceEndpoints();
    await testAdminEndpoints();
    await testNotifications();
    
    // Generate summary
    const totalTests = testResults.length;
    const passedTests = testResults.filter(r => r.status === 'PASS').length;
    const failedTests = testResults.filter(r => r.status === 'FAIL').length;
    const skippedTests = testResults.filter(r => r.status === 'SKIP').length;
    const totalDuration = Date.now() - startTime;
    
    log('\n📊 Test Summary:', 'info');
    log(`Total Tests: ${totalTests}`, 'info');
    log(`✅ Passed: ${passedTests}`, 'success');
    log(`❌ Failed: ${failedTests}`, failedTests > 0 ? 'error' : 'info');
    log(`⏭️  Skipped: ${skippedTests}`, 'warn');
    log(`⏱️  Total Duration: ${totalDuration}ms`, 'info');
    log(`📈 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`, 'info');
    
    // Show failed tests
    if (failedTests > 0) {
      log('\n❌ Failed Tests:', 'error');
      testResults
        .filter(r => r.status === 'FAIL')
        .forEach(result => {
          log(`  ${result.method} ${result.endpoint}: ${result.message}`, 'error');
          if (result.error) {
            log(`    Error: ${result.error.message}`, 'error');
          }
        });
    }
    
    log('\n✅ Integration tests completed!', 'success');
    
    // Exit with appropriate code
    process.exit(failedTests > 0 ? 1 : 0);
    
  } catch (error: any) {
    log(`\n💥 Integration tests failed with error: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runIntegrationTests();
}

export { runIntegrationTests, testResults };
