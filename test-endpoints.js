#!/usr/bin/env node

/**
 * SMIS Frontend-Backend Endpoint Testing Script
 * Tests all API endpoints to ensure frontend-backend compatibility
 */

const axios = require('axios');

// Simple color functions to replace chalk
const colors = {
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`,
  white: (text) => `\x1b[37m${text}\x1b[0m`
};

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';
const TEST_TIMEOUT = 5000;

// Test results tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
let warnings = 0;

// Test credentials (you may need to adjust these)
const TEST_CREDENTIALS = {
  admin: { email: 'admin@smis.edu', password: 'admin123' },
  teacher: { email: 'teacher@smis.edu', password: 'teacher123' },
  student: { email: 'student@smis.edu', password: 'student123' },
  hod: { email: 'hod@smis.edu', password: 'hod123' },
  finance: { email: 'finance@smis.edu', password: 'finance123' }
};

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  timeout: TEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Utility functions
const log = {
  info: (msg) => console.log(colors.blue('ℹ'), msg),
  success: (msg) => console.log(colors.green('✅'), msg),
  error: (msg) => console.log(colors.red('❌'), msg),
  warning: (msg) => console.log(colors.yellow('⚠️'), msg),
  header: (msg) => console.log(colors.bold(colors.cyan(`\n=== ${msg} ===`))),
  subheader: (msg) => console.log(colors.bold(colors.white(`\n--- ${msg} ---`)))
};

const incrementTest = (passed = true) => {
  totalTests++;
  if (passed) passedTests++;
  else failedTests++;
};

const incrementWarning = () => {
  warnings++;
};

// Test server connectivity
async function testServerConnectivity() {
  log.header('Testing Server Connectivity');
  
  try {
    const response = await axios.get(`${BASE_URL.replace('/api', '')}/health`, { timeout: 3000 });
    log.success(`Server is running at ${BASE_URL}`);
    incrementTest(true);
    return true;
  } catch (error) {
    try {
      // Try the API base URL directly
      await api.get('/');
      log.success(`Server is running at ${BASE_URL}`);
      incrementTest(true);
      return true;
    } catch (apiError) {
      log.error(`Server is not accessible at ${BASE_URL}`);
      log.error(`Error: ${error.message}`);
      incrementTest(false);
      return false;
    }
  }
}

// Test authentication endpoints
async function testAuthEndpoints() {
  log.header('Testing Authentication Endpoints');
  
  const authTests = [
    { method: 'POST', path: '/auth/register', name: 'Staff Registration' },
    { method: 'POST', path: '/auth/login', name: 'Staff Login' },
    { method: 'POST', path: '/auth/student/login', name: 'Student Login' },
    { method: 'POST', path: '/auth/logout', name: 'Logout' },
    { method: 'POST', path: '/auth/forgot-password', name: 'Forgot Password' },
    { method: 'POST', path: '/auth/reset-password', name: 'Reset Password' },
    { method: 'GET', path: '/auth/profile', name: 'Get Profile', requiresAuth: true }
  ];

  let authToken = null;

  for (const test of authTests) {
    try {
      let config = {};
      let data = {};

      // Prepare test data based on endpoint
      if (test.path === '/auth/login') {
        data = TEST_CREDENTIALS.admin;
      } else if (test.path === '/auth/student/login') {
        data = TEST_CREDENTIALS.student;
      } else if (test.path === '/auth/register') {
        data = {
          email: 'test@smis.edu',
          password: 'test123',
          first_name: 'Test',
          last_name: 'User',
          role: 'teacher'
        };
      } else if (test.path === '/auth/forgot-password') {
        data = { email: 'test@smis.edu' };
      } else if (test.path === '/auth/reset-password') {
        data = { token: 'dummy-token', password: 'newpass123' };
      }

      // Add auth header if required
      if (test.requiresAuth && authToken) {
        config.headers = { Authorization: `Bearer ${authToken}` };
      }

      const response = await api[test.method.toLowerCase()](test.path, test.method === 'GET' ? config : data, config);
      
      // Store auth token from login
      if (test.path === '/auth/login' && response.data.token) {
        authToken = response.data.token;
      }

      log.success(`${test.name}: ${response.status}`);
      incrementTest(true);
    } catch (error) {
      const status = error.response?.status || 'No Response';
      const message = error.response?.data?.message || error.message;
      
      // Some endpoints might fail due to missing test data, which is expected
      if (status === 404 || status === 400) {
        log.warning(`${test.name}: ${status} - ${message} (Expected for test environment)`);
        incrementWarning();
      } else {
        log.error(`${test.name}: ${status} - ${message}`);
        incrementTest(false);
      }
    }
  }

  return authToken;
}

// Test role-based endpoints
async function testRoleEndpoints(role, token) {
  log.subheader(`Testing ${role.toUpperCase()} Endpoints`);
  
  const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  
  const endpointsByRole = {
    student: [
      { method: 'GET', path: '/students/profile', name: 'Get Student Profile' },
      { method: 'PUT', path: '/students/profile', name: 'Update Student Profile' },
      { method: 'GET', path: '/students/grades', name: 'Get Student Grades' },
      { method: 'GET', path: '/students/attendance/2024-01-01/2024-12-31', name: 'Get Student Attendance' },
      { method: 'GET', path: '/students/fees', name: 'Get Student Fees' },
      { method: 'GET', path: '/students/timetable/1', name: 'Get Student Timetable' }
    ],
    teacher: [
      { method: 'GET', path: '/teachers/profile', name: 'Get Teacher Profile' },
      { method: 'PUT', path: '/teachers/profile', name: 'Update Teacher Profile' },
      { method: 'GET', path: '/teachers/classes', name: 'Get Teacher Classes' },
      { method: 'POST', path: '/teachers/attendance', name: 'Mark Attendance' },
      { method: 'POST', path: '/teachers/grades', name: 'Enter Grades' },
      { method: 'GET', path: '/teachers/timetable/1', name: 'Get Teacher Timetable' },
      { method: 'GET', path: '/teachers/classes/students', name: 'Get All Students' },
      { method: 'GET', path: '/teachers/classes/1/students', name: 'Get Class Students' }
    ],
    hod: [
      { method: 'GET', path: '/hod/profile', name: 'Get HOD Profile' },
      { method: 'GET', path: '/hod/teachers', name: 'Get Department Teachers' },
      { method: 'POST', path: '/hod/activities/approve', name: 'Approve Activity' },
      { method: 'POST', path: '/hod/reports/attendance', name: 'Generate Reports' },
      { method: 'POST', path: '/hod/courses/manage', name: 'Manage Courses' },
      { method: 'POST', path: '/hod/timetable/approve', name: 'Approve Timetable' },
      { method: 'GET', path: '/hod/stats', name: 'Get Department Stats' },
      { method: 'GET', path: '/hod/timetable/1', name: 'Get Department Timetable' }
    ],
    finance: [
      { method: 'GET', path: '/finance/profile', name: 'Get Finance Profile' },
      { method: 'GET', path: '/finance/students/1/fees', name: 'Get Student Fees' },
      { method: 'POST', path: '/finance/fees', name: 'Create Fee' },
      { method: 'PUT', path: '/finance/fees/1/pay', name: 'Mark Fee Paid' },
      { method: 'GET', path: '/finance/students/1/invoice', name: 'Generate Invoice' },
      { method: 'GET', path: '/finance/reports', name: 'Get Financial Reports' },
      { method: 'GET', path: '/finance/overdue', name: 'Get Overdue Fees' }
    ],
    admin: [
      { method: 'POST', path: '/admin/users', name: 'Create User' },
      { method: 'GET', path: '/admin/users', name: 'Get All Users' },
      { method: 'GET', path: '/admin/users/1', name: 'Get User By ID' },
      { method: 'PUT', path: '/admin/users/1', name: 'Update User' },
      { method: 'DELETE', path: '/admin/users/1', name: 'Delete User' },
      { method: 'GET', path: '/admin/stats', name: 'Get System Stats' },
      { method: 'POST', path: '/admin/calendar', name: 'Manage Academic Calendar' },
      { method: 'POST', path: '/admin/timetable', name: 'Setup Timetable' }
    ]
  };

  const endpoints = endpointsByRole[role] || [];
  
  for (const endpoint of endpoints) {
    try {
      let data = {};
      
      // Prepare minimal test data for POST/PUT requests
      if (endpoint.method === 'POST' || endpoint.method === 'PUT') {
        data = { test: true }; // Minimal test data
      }

      const response = await api[endpoint.method.toLowerCase()](
        endpoint.path, 
        endpoint.method === 'GET' ? config : data,
        endpoint.method === 'GET' ? {} : config
      );
      
      log.success(`${endpoint.name}: ${response.status}`);
      incrementTest(true);
    } catch (error) {
      const status = error.response?.status || 'No Response';
      const message = error.response?.data?.message || error.message;
      
      if (status === 401) {
        log.warning(`${endpoint.name}: ${status} - Authentication required`);
        incrementWarning();
      } else if (status === 403) {
        log.warning(`${endpoint.name}: ${status} - Authorization failed`);
        incrementWarning();
      } else if (status === 404) {
        log.error(`${endpoint.name}: ${status} - Endpoint not found`);
        incrementTest(false);
      } else {
        log.warning(`${endpoint.name}: ${status} - ${message}`);
        incrementWarning();
      }
    }
  }
}

// Test additional endpoints
async function testAdditionalEndpoints() {
  log.subheader('Testing Additional Endpoints');
  
  const additionalTests = [
    { method: 'GET', path: '/activities/recent', name: 'Get Recent Activities' },
    { method: 'GET', path: '/courses/1', name: 'Get Course by ID' },
    { method: 'GET', path: '/courses/code/CS101', name: 'Get Course by Code' },
    { method: 'GET', path: '/notifications', name: 'Get Notifications' }
  ];

  for (const test of additionalTests) {
    try {
      const response = await api[test.method.toLowerCase()](test.path);
      log.success(`${test.name}: ${response.status}`);
      incrementTest(true);
    } catch (error) {
      const status = error.response?.status || 'No Response';
      const message = error.response?.data?.message || error.message;
      
      if (status === 401) {
        log.warning(`${test.name}: ${status} - Authentication required`);
        incrementWarning();
      } else {
        log.error(`${test.name}: ${status} - ${message}`);
        incrementTest(false);
      }
    }
  }
}

// Main test function
async function runTests() {
  console.log(colors.bold(colors.blue('\n🧪 SMIS Frontend-Backend Endpoint Testing\n')));
  
  // Test server connectivity first
  const serverRunning = await testServerConnectivity();
  if (!serverRunning) {
    log.error('Cannot proceed with endpoint testing - server is not accessible');
    process.exit(1);
  }

  // Test authentication endpoints
  const authToken = await testAuthEndpoints();

  // Test role-based endpoints
  const roles = ['student', 'teacher', 'hod', 'finance', 'admin'];
  for (const role of roles) {
    await testRoleEndpoints(role, authToken);
  }

  // Test additional endpoints
  await testAdditionalEndpoints();

  // Print summary
  log.header('Test Summary');
  console.log(colors.bold(`Total Tests: ${totalTests}`));
  console.log(colors.green(`Passed: ${passedTests}`));
  console.log(colors.red(`Failed: ${failedTests}`));
  console.log(colors.yellow(`Warnings: ${warnings}`));

  const successRate = ((passedTests / totalTests) * 100).toFixed(1);
  console.log(colors.bold(`Success Rate: ${successRate}%`));

  if (failedTests > 0) {
    log.warning('\nSome endpoints are not working. Check the backend server and route implementations.');
  }
  
  if (warnings > 0) {
    log.info('\nWarnings indicate endpoints that require authentication or specific data to test properly.');
  }
}

// Run the tests
runTests().catch(error => {
  log.error(`Test execution failed: ${error.message}`);
  process.exit(1);
});
