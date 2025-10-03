/**
 * SMIS API Comprehensive Test Suite
 * Tests all backend API endpoints with proper authentication and validation
 */

const { test, expect } = require('@playwright/test');
const config = require('./config/test-config');

// Test state management
let testTokens = {};
let testUsers = {};
let testUserIds = {};
let createdTestData = {
  users: [],
  students: [],
  classes: []
};

/**
 * API Helper Functions
 */
class APIHelper {
  constructor(request) {
    this.request = request;
    this.baseURL = config.baseURL;
  }

  async makeRequest(method, endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const requestOptions = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    if (config.env.verbose) {
      console.log(`🚀 ${method} ${url}`, requestOptions.data ? JSON.stringify(requestOptions.data) : '');
    }

    const response = await this.request.fetch(url, requestOptions);
    
    if (config.env.verbose) {
      console.log(`✅ Response: ${response.status()}`);
    }

    return response;
  }

  async authenticatedRequest(method, endpoint, token, options = {}) {
    return this.makeRequest(method, endpoint, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    });
  }
}

/**
 * Test Data Validation Helpers
 */
function validateResponseSchema(data, schema) {
  for (const field of schema.required || []) {
    expect(data).toHaveProperty(field);
  }
}

function validateUserObject(user) {
  expect(user).toHaveProperty('id');
  expect(user).toHaveProperty('email');
  expect(user).toHaveProperty('role');
  expect(user).toHaveProperty('userType');
  expect(typeof user.id).toBe('number');
  expect(typeof user.email).toBe('string');
  expect(typeof user.role).toBe('string');
  expect(['staff', 'student']).toContain(user.userType);
}

function requireToken(role) {
  if (!testTokens[role]) {
    throw new Error(`❌ No authentication token available for ${role}. Test setup may have failed.`);
  }
  return testTokens[role];
}

function skipIfNoToken(role) {
  return !testTokens[role];
}

/**
 * Setup and Teardown
 */
test.beforeAll(async ({ request }) => {
  console.log('🧪 Starting SMIS API Comprehensive Test Suite');
  console.log(`📡 Testing against: ${config.baseURL}`);

  const api = new APIHelper(request);

  // Test backend connectivity
  try {
    const healthCheck = await api.makeRequest('GET', '/health');
    if (healthCheck.status() !== 200) {
      throw new Error(`Backend health check failed: ${healthCheck.status()}`);
    }
    console.log('✅ Backend connectivity confirmed');
  } catch (error) {
    console.error('❌ Backend connectivity failed:', error.message);
    throw error;
  }

  // Create test users and store their tokens
  console.log('👥 Creating test users and storing authentication tokens...');

  for (const [role, userData] of Object.entries(config.testData.users)) {
    try {
      console.log(`🔧 Setting up ${role} user: ${userData.email}`);

      // Skip registration since it's failing, try to login directly with existing users
      const loginEndpoint = role === 'student' ? '/auth/student/login' : '/auth/login';
      const loginResponse = await api.makeRequest('POST', loginEndpoint, {
        data: {
          email: userData.email,
          password: userData.password
        }
      });

      console.log(`🔑 Login response for ${role}: ${loginResponse.status()}`);

      if (loginResponse.status() === 200) {
        const loginData = await loginResponse.json();
        testTokens[role] = loginData.token;
        testUserIds[role] = loginData.user.id;
        console.log(`✅ Logged in ${role} user, token stored`);
      } else {
        const errorData = await loginResponse.text();
        console.warn(`⚠️ Failed to login ${role} user: ${loginResponse.status()} - ${errorData}`);

        // If login fails, try to register the user first
        console.log(`🔧 Attempting to register ${role} user...`);
        const registerResponse = await api.makeRequest('POST', '/auth/register', {
          data: userData
        });

        console.log(`📝 Registration response for ${role}: ${registerResponse.status()}`);

        if (registerResponse.status() === 201) {
          console.log(`✅ Created ${role} user: ${userData.email}`);

          // Try login again after registration
          const retryLoginResponse = await api.makeRequest('POST', loginEndpoint, {
            data: {
              email: userData.email,
              password: userData.password
            }
          });

          if (retryLoginResponse.status() === 200) {
            const retryLoginData = await retryLoginResponse.json();
            testTokens[role] = retryLoginData.token;
            testUserIds[role] = retryLoginData.user.id;
            console.log(`✅ Logged in newly created ${role} user, token stored`);
          }
        } else {
          const regErrorData = await registerResponse.text();
          console.warn(`⚠️ Failed to register ${role} user: ${registerResponse.status()} - ${regErrorData}`);
        }
      }
    } catch (error) {
      console.error(`❌ Error setting up ${role} user:`, error.message);
    }
  }

  console.log('📊 Test setup complete. Tokens stored:', Object.keys(testTokens));
  console.log('🔍 Token validation:');
  for (const [role, token] of Object.entries(testTokens)) {
    console.log(`  ${role}: ${token ? 'Token present' : 'No token'}`);
  }

  // Validate that we have at least some tokens
  const tokenCount = Object.keys(testTokens).length;
  if (tokenCount === 0) {
    console.error('❌ No authentication tokens were created. Tests will likely fail.');
  } else {
    console.log(`✅ ${tokenCount} authentication tokens created successfully.`);
  }
});

test.afterAll(async ({ request }) => {
  if (!config.env.cleanup) {
    console.log('⚠️ Skipping test data cleanup (CLEANUP_TEST_DATA=false)');
    return;
  }

  console.log('🧹 Cleaning up test data...');
  const api = new APIHelper(request);
  
  // Cleanup created users (if admin token available)
  if (testTokens.admin) {
    for (const userId of createdTestData.users) {
      try {
        await api.authenticatedRequest('DELETE', `/admin/users/${userId}`, testTokens.admin);
        console.log(`✅ Cleaned up user ${userId}`);
      } catch (error) {
        console.warn(`⚠️ Failed to cleanup user ${userId}:`, error.message);
      }
    }
  }
  
  console.log('✅ Test cleanup completed');
});

/**
 * AUTHENTICATION TESTS
 */
test.describe('🔐 Authentication Endpoints', () => {
  let api;

  test.beforeEach(async ({ request }) => {
    api = new APIHelper(request);
  });

  test.describe('User Registration', () => {
    test('should register admin user successfully', async () => {
      const userData = config.testData.users.admin;
      
      const response = await api.makeRequest('POST', '/auth/register', {
        data: userData
      });

      expect(response.status()).toBe(201);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('message');
      expect(responseData.message).toContain('successfully');
      
      // Store for cleanup
      if (responseData.user?.id) {
        createdTestData.users.push(responseData.user.id);
      }
    });

    test('should register teacher user successfully', async () => {
      const userData = config.testData.users.teacher;
      
      const response = await api.makeRequest('POST', '/auth/register', {
        data: userData
      });

      expect(response.status()).toBe(201);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('message');
      
      if (responseData.user?.id) {
        createdTestData.users.push(responseData.user.id);
      }
    });

    test('should register student user successfully', async () => {
      const userData = config.testData.users.student;
      
      const response = await api.makeRequest('POST', '/auth/register', {
        data: userData
      });

      expect(response.status()).toBe(201);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('message');
      
      if (responseData.user?.id) {
        createdTestData.users.push(responseData.user.id);
      }
    });

    test('should register HOD user successfully', async () => {
      const userData = config.testData.users.hod;
      
      const response = await api.makeRequest('POST', '/auth/register', {
        data: userData
      });

      expect(response.status()).toBe(201);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('message');
      
      if (responseData.user?.id) {
        createdTestData.users.push(responseData.user.id);
      }
    });

    test('should register finance user successfully', async () => {
      const userData = config.testData.users.finance;
      
      const response = await api.makeRequest('POST', '/auth/register', {
        data: userData
      });

      expect(response.status()).toBe(201);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('message');
      
      if (responseData.user?.id) {
        createdTestData.users.push(responseData.user.id);
      }
    });

    test('should reject duplicate email registration', async () => {
      const userData = config.testData.users.admin;
      
      const response = await api.makeRequest('POST', '/auth/register', {
        data: userData
      });

      expect(response.status()).toBe(400);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('message');
      expect(responseData.message.toLowerCase()).toContain('exist');
    });

    test('should reject invalid email format', async () => {
      const userData = {
        ...config.testData.users.admin,
        email: config.testData.invalid.malformedEmail
      };
      
      const response = await api.makeRequest('POST', '/auth/register', {
        data: userData
      });

      expect(response.status()).toBe(400);
    });

    test('should reject weak password', async () => {
      const userData = {
        ...config.testData.users.admin,
        email: 'weak.password@test.com',
        password: config.testData.invalid.weakPassword
      };
      
      const response = await api.makeRequest('POST', '/auth/register', {
        data: userData
      });

      expect(response.status()).toBe(400);
    });
  });

  test.describe('Staff Login', () => {
    test('should login admin user successfully', async () => {
      const credentials = {
        email: config.testData.users.admin.email,
        password: config.testData.users.admin.password
      };
      
      const response = await api.makeRequest('POST', '/auth/login', {
        data: credentials
      });

      expect(response.status()).toBe(200);
      
      const responseData = await response.json();
      validateResponseSchema(responseData, config.schemas.loginResponse);
      validateUserObject(responseData.user);
      
      expect(responseData.user.role).toBe('admin');
      expect(responseData.user.userType).toBe('staff');
      expect(typeof responseData.token).toBe('string');
      expect(responseData.token.length).toBeGreaterThan(0);
      
      // Store token for subsequent tests
      testTokens.admin = responseData.token;
      testUsers.admin = responseData.user;
    });

    test('should login teacher user successfully', async () => {
      const credentials = {
        email: config.testData.users.teacher.email,
        password: config.testData.users.teacher.password
      };
      
      const response = await api.makeRequest('POST', '/auth/login', {
        data: credentials
      });

      expect(response.status()).toBe(200);
      
      const responseData = await response.json();
      validateResponseSchema(responseData, config.schemas.loginResponse);
      validateUserObject(responseData.user);
      
      expect(responseData.user.role).toBe('teacher');
      expect(responseData.user.userType).toBe('staff');
      
      testTokens.teacher = responseData.token;
      testUsers.teacher = responseData.user;
    });

    test('should login HOD user successfully', async () => {
      const credentials = {
        email: config.testData.users.hod.email,
        password: config.testData.users.hod.password
      };
      
      const response = await api.makeRequest('POST', '/auth/login', {
        data: credentials
      });

      expect(response.status()).toBe(200);
      
      const responseData = await response.json();
      validateResponseSchema(responseData, config.schemas.loginResponse);
      validateUserObject(responseData.user);
      
      expect(responseData.user.role).toBe('hod');
      expect(responseData.user.userType).toBe('staff');
      
      testTokens.hod = responseData.token;
      testUsers.hod = responseData.user;
    });

    test('should login finance user successfully', async () => {
      const credentials = {
        email: config.testData.users.finance.email,
        password: config.testData.users.finance.password
      };
      
      const response = await api.makeRequest('POST', '/auth/login', {
        data: credentials
      });

      expect(response.status()).toBe(200);
      
      const responseData = await response.json();
      validateResponseSchema(responseData, config.schemas.loginResponse);
      validateUserObject(responseData.user);
      
      expect(responseData.user.role).toBe('finance');
      expect(responseData.user.userType).toBe('staff');
      
      testTokens.finance = responseData.token;
      testUsers.finance = responseData.user;
    });

    test('should reject invalid credentials', async () => {
      const credentials = {
        email: config.testData.invalid.email,
        password: config.testData.invalid.password
      };
      
      const response = await api.makeRequest('POST', '/auth/login', {
        data: credentials
      });

      expect(response.status()).toBe(401);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('message');
      expect(responseData.message.toLowerCase()).toContain('invalid');
    });

    test('should reject missing credentials', async () => {
      const response = await api.makeRequest('POST', '/auth/login', {
        data: {}
      });

      expect(response.status()).toBe(400);
    });
  });

  test.describe('Student Login', () => {
    test('should login student user successfully', async () => {
      const credentials = {
        email: config.testData.users.student.email,
        password: config.testData.users.student.password
      };

      const response = await api.makeRequest('POST', '/auth/student/login', {
        data: credentials
      });

      expect(response.status()).toBe(200);

      const responseData = await response.json();
      validateResponseSchema(responseData, config.schemas.loginResponse);
      validateUserObject(responseData.user);

      expect(responseData.user.role).toBe('student');
      expect(responseData.user.userType).toBe('student');

      testTokens.student = responseData.token;
      testUsers.student = responseData.user;
    });

    test('should reject invalid student credentials', async () => {
      const credentials = {
        email: config.testData.invalid.email,
        password: config.testData.invalid.password
      };

      const response = await api.makeRequest('POST', '/auth/student/login', {
        data: credentials
      });

      expect(response.status()).toBe(401);
    });
  });

  test.describe('Profile and Logout', () => {
    test('should get user profile with valid token', async () => {
      const response = await api.authenticatedRequest('GET', '/auth/profile', testTokens.admin);

      expect(response.status()).toBe(200);

      const responseData = await response.json();
      validateUserObject(responseData);
      expect(responseData.email).toBe(config.testData.users.admin.email);
    });

    test('should reject profile request with invalid token', async () => {
      const response = await api.authenticatedRequest('GET', '/auth/profile', 'invalid-token');

      expect(response.status()).toBe(401);
    });

    test('should logout successfully', async () => {
      const response = await api.authenticatedRequest('POST', '/auth/logout', testTokens.admin);

      expect(response.status()).toBe(200);

      const responseData = await response.json();
      expect(responseData).toHaveProperty('message');
    });
  });
});

/**
 * STUDENT PORTAL TESTS
 */
test.describe('👨‍🎓 Student Portal Endpoints', () => {
  let api;

  test.beforeEach(async ({ request }) => {
    api = new APIHelper(request);
  });

  test.describe('Student Profile', () => {
    test('should get student profile information', async () => {
      const response = await api.authenticatedRequest('GET', '/student/profile', testTokens.student);

      expect(response.status()).toBe(200);

      const responseData = await response.json();
      validateUserObject(responseData);
      expect(responseData.role).toBe('student');
    });

    test('should reject profile request without authentication', async () => {
      const response = await api.makeRequest('GET', '/student/profile');

      expect(response.status()).toBe(401);
    });

    test('should reject profile request with non-student token', async () => {
      const response = await api.authenticatedRequest('GET', '/student/profile', testTokens.teacher);

      expect(response.status()).toBe(403);
    });
  });

  test.describe('Student Grades', () => {
    test('should get student grades', async () => {
      const response = await api.authenticatedRequest('GET', '/student/grades', testTokens.student);

      expect(response.status()).toBe(200);

      const responseData = await response.json();
      expect(Array.isArray(responseData)).toBe(true);

      // Validate grade structure if grades exist
      if (responseData.length > 0) {
        const grade = responseData[0];
        expect(grade).toHaveProperty('subject');
        expect(grade).toHaveProperty('grade');
        expect(grade).toHaveProperty('semester');
      }
    });

    test('should get student grades by semester', async () => {
      const semester = '2024-1';
      const response = await api.authenticatedRequest('GET', `/student/grades?semester=${semester}`, testTokens.student);

      expect(response.status()).toBe(200);

      const responseData = await response.json();
      expect(Array.isArray(responseData)).toBe(true);
    });

    test('should reject grades request without authentication', async () => {
      const response = await api.makeRequest('GET', '/student/grades');

      expect(response.status()).toBe(401);
    });
  });

  test.describe('Student Attendance', () => {
    test('should get student attendance records', async () => {
      const response = await api.authenticatedRequest('GET', '/student/attendance', testTokens.student);

      expect(response.status()).toBe(200);

      const responseData = await response.json();
      expect(Array.isArray(responseData)).toBe(true);

      // Validate attendance structure if records exist
      if (responseData.length > 0) {
        const attendance = responseData[0];
        expect(attendance).toHaveProperty('date');
        expect(attendance).toHaveProperty('status');
        expect(['present', 'absent', 'late']).toContain(attendance.status);
      }
    });

    test('should get attendance records by date range', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-12-31';
      const response = await api.authenticatedRequest(
        'GET',
        `/student/attendance/startDate=${startDate}/endDate=${endDate}`,
        testTokens.student
      );

      expect(response.status()).toBe(200);

      const responseData = await response.json();
      expect(Array.isArray(responseData)).toBe(true);
    });

    test('should reject attendance request without authentication', async () => {
      const response = await api.makeRequest('GET', '/student/attendance');

      expect(response.status()).toBe(401);
    });
  });

  test.describe('Student Fees', () => {
    test('should get student fee information', async () => {
      const response = await api.authenticatedRequest('GET', '/student/fees', testTokens.student);

      expect(response.status()).toBe(200);

      const responseData = await response.json();
      expect(responseData).toHaveProperty('totalFees');
      expect(responseData).toHaveProperty('paidAmount');
      expect(responseData).toHaveProperty('balance');
      expect(responseData).toHaveProperty('payments');
      expect(Array.isArray(responseData.payments)).toBe(true);
    });

    test('should get fee payment history', async () => {
      const response = await api.authenticatedRequest('GET', '/student/fees/payments', testTokens.student);

      expect(response.status()).toBe(200);

      const responseData = await response.json();
      expect(Array.isArray(responseData)).toBe(true);

      // Validate payment structure if payments exist
      if (responseData.length > 0) {
        const payment = responseData[0];
        expect(payment).toHaveProperty('amount');
        expect(payment).toHaveProperty('date');
        expect(payment).toHaveProperty('status');
      }
    });

    test('should reject fees request without authentication', async () => {
      const response = await api.makeRequest('GET', '/student/fees');

      expect(response.status()).toBe(401);
    });
  });
});

/**
 * TEACHER PORTAL TESTS
 */
test.describe('👨‍🏫 Teacher Portal Endpoints', () => {
  let api;

  test.beforeEach(async ({ request }) => {
    api = new APIHelper(request);
  });

  test.describe('Teacher Profile', () => {
    test('should get teacher profile information', async () => {
      const response = await api.authenticatedRequest('GET', '/teacher/profile', testTokens.teacher);

      expect(response.status()).toBe(200);

      const responseData = await response.json();
      validateUserObject(responseData);
      expect(responseData.role).toBe('teacher');
    });

    test('should reject profile request without authentication', async () => {
      const response = await api.makeRequest('GET', '/teacher/profile');

      expect(response.status()).toBe(401);
    });

    test('should reject profile request with non-teacher token', async () => {
      const response = await api.authenticatedRequest('GET', '/teacher/profile', testTokens.student);

      expect(response.status()).toBe(403);
    });
  });

  test.describe('Teacher Classes', () => {
    test('should get assigned classes list', async () => {
      const response = await api.authenticatedRequest('GET', '/teacher/classes', testTokens.teacher);

      expect(response.status()).toBe(200);

      const responseData = await response.json();
      expect(Array.isArray(responseData)).toBe(true);

      // Validate class structure if classes exist
      if (responseData.length > 0) {
        const classInfo = responseData[0];
        expect(classInfo).toHaveProperty('id');
        expect(classInfo).toHaveProperty('name');
        expect(classInfo).toHaveProperty('subject');
        expect(classInfo).toHaveProperty('students');
        expect(Array.isArray(classInfo.students)).toBe(true);
      }
    });

    test('should get class details by ID', async () => {
      // First get classes to get a valid class ID
      const classesResponse = await api.authenticatedRequest('GET', '/teacher/classes', testTokens.teacher);
      expect(classesResponse.status()).toBe(200);

      const classes = await classesResponse.json();
      if (classes.length > 0) {
        const classId = classes[0].id;

        const response = await api.authenticatedRequest('GET', `/teacher/classes/${classId}`, testTokens.teacher);
        expect(response.status()).toBe(200);

        const responseData = await response.json();
        expect(responseData).toHaveProperty('id');
        expect(responseData).toHaveProperty('name');
        expect(responseData).toHaveProperty('students');
      }
    });

    test('should reject classes request without authentication', async () => {
      const response = await api.makeRequest('GET', '/teacher/classes');

      expect(response.status()).toBe(401);
    });
  });

  test.describe('Attendance Management', () => {
    test('should mark student attendance', async () => {
      // Get classes first to get student IDs
      const classesResponse = await api.authenticatedRequest('GET', '/teacher/classes', testTokens.teacher);
      expect(classesResponse.status()).toBe(200);

      const classes = await classesResponse.json();
      if (classes.length > 0 && classes[0].students.length > 0) {
        const classId = classes[0].id;
        const studentId = classes[0].students[0].id;

        const attendanceData = {
          classId: classId,
          studentId: studentId,
          date: new Date().toISOString().split('T')[0],
          status: 'present'
        };

        const response = await api.authenticatedRequest('POST', '/teacher/attendance', testTokens.teacher, {
          data: attendanceData
        });

        expect(response.status()).toBe(201);

        const responseData = await response.json();
        expect(responseData).toHaveProperty('message');
        expect(responseData.message.toLowerCase()).toContain('success');
      }
    });

    test('should get attendance records for a class', async () => {
      const classesResponse = await api.authenticatedRequest('GET', '/teacher/classes', testTokens.teacher);
      expect(classesResponse.status()).toBe(200);

      const classes = await classesResponse.json();
      if (classes.length > 0) {
        const classId = classes[0].id;

        const response = await api.authenticatedRequest('GET', `/teacher/attendance/${classId}`, testTokens.teacher);
        expect(response.status()).toBe(200);

        const responseData = await response.json();
        expect(Array.isArray(responseData)).toBe(true);
      }
    });

    test('should reject attendance marking without authentication', async () => {
      const attendanceData = {
        classId: 1,
        studentId: 1,
        date: new Date().toISOString().split('T')[0],
        status: 'present'
      };

      const response = await api.makeRequest('POST', '/teacher/attendance', {
        data: attendanceData
      });

      expect(response.status()).toBe(401);
    });
  });

  test.describe('Grade Management', () => {
    test('should enter student grades', async () => {
      // Get classes first to get student IDs
      const classesResponse = await api.authenticatedRequest('GET', '/teacher/classes', testTokens.teacher);
      expect(classesResponse.status()).toBe(200);

      const classes = await classesResponse.json();
      if (classes.length > 0 && classes[0].students.length > 0) {
        const classId = classes[0].id;
        const studentId = classes[0].students[0].id;

        const gradeData = {
          studentId: studentId,
          classId: classId,
          subject: classes[0].subject,
          grade: 'A',
          marks: 85,
          semester: '2024-1',
          examType: 'midterm'
        };

        const response = await api.authenticatedRequest('POST', '/teacher/grades', testTokens.teacher, {
          data: gradeData
        });

        expect(response.status()).toBe(201);

        const responseData = await response.json();
        expect(responseData).toHaveProperty('message');
        expect(responseData.message.toLowerCase()).toContain('success');
      }
    });

    test('should update existing grades', async () => {
      // First create a grade, then update it
      const classesResponse = await api.authenticatedRequest('GET', '/teacher/classes', testTokens.teacher);
      expect(classesResponse.status()).toBe(200);

      const classes = await classesResponse.json();
      if (classes.length > 0 && classes[0].students.length > 0) {
        const studentId = classes[0].students[0].id;

        // Get existing grades
        const gradesResponse = await api.authenticatedRequest('GET', `/teacher/grades/${studentId}`, testTokens.teacher);
        expect(gradesResponse.status()).toBe(200);

        const grades = await gradesResponse.json();
        if (grades.length > 0) {
          const gradeId = grades[0].id;

          const updateData = {
            grade: 'A+',
            marks: 95
          };

          const response = await api.authenticatedRequest('PUT', `/teacher/grades/${gradeId}`, testTokens.teacher, {
            data: updateData
          });

          expect(response.status()).toBe(200);

          const responseData = await response.json();
          expect(responseData).toHaveProperty('message');
        }
      }
    });

    test('should get grades for a student', async () => {
      const classesResponse = await api.authenticatedRequest('GET', '/teacher/classes', testTokens.teacher);
      expect(classesResponse.status()).toBe(200);

      const classes = await classesResponse.json();
      if (classes.length > 0 && classes[0].students.length > 0) {
        const studentId = classes[0].students[0].id;

        const response = await api.authenticatedRequest('GET', `/teacher/grades/${studentId}`, testTokens.teacher);
        expect(response.status()).toBe(200);

        const responseData = await response.json();
        expect(Array.isArray(responseData)).toBe(true);
      }
    });

    test('should reject grade entry without authentication', async () => {
      const gradeData = {
        studentId: 1,
        classId: 1,
        subject: 'Math',
        grade: 'A',
        marks: 85
      };

      const response = await api.makeRequest('POST', '/teacher/grades', {
        data: gradeData
      });

      expect(response.status()).toBe(401);
    });
  });
});

/**
 * ADMIN PORTAL TESTS
 */
test.describe('👨‍💼 Admin Portal Endpoints', () => {
  let api;

  test.beforeEach(async ({ request }) => {
    api = new APIHelper(request);
  });

  test.describe('User Management', () => {
    test('should create new admin user', async () => {
      const userData = {
        email: 'new.admin@smis.test',
        password: 'NewAdmin123!',
        firstName: 'New',
        lastName: 'Admin',
        role: 'admin'
      };

      const response = await api.authenticatedRequest('POST', '/admin/users', testTokens.admin, {
        data: userData
      });

      expect(response.status()).toBe(201);

      const responseData = await response.json();
      expect(responseData).toHaveProperty('message');
      expect(responseData).toHaveProperty('user');
      validateUserObject(responseData.user);

      // Store for cleanup
      if (responseData.user?.id) {
        createdTestData.users.push(responseData.user.id);
      }
    });

    test('should create new teacher user', async () => {
      const userData = {
        email: 'new.teacher@smis.test',
        password: 'NewTeacher123!',
        firstName: 'New',
        lastName: 'Teacher',
        role: 'teacher',
        departmentId: 1
      };

      const response = await api.authenticatedRequest('POST', '/admin/users', testTokens.admin, {
        data: userData
      });

      expect(response.status()).toBe(201);

      const responseData = await response.json();
      expect(responseData).toHaveProperty('user');
      expect(responseData.user.role).toBe('teacher');

      if (responseData.user?.id) {
        createdTestData.users.push(responseData.user.id);
      }
    });

    test('should create new student user', async () => {
      const userData = {
        email: 'new.student@smis.test',
        password: 'NewStudent123!',
        firstName: 'New',
        lastName: 'Student',
        role: 'student',
        departmentId: 1,
        studentId: 'STU2024001'
      };

      const response = await api.authenticatedRequest('POST', '/admin/users', testTokens.admin, {
        data: userData
      });

      expect(response.status()).toBe(201);

      const responseData = await response.json();
      expect(responseData).toHaveProperty('user');
      expect(responseData.user.role).toBe('student');

      if (responseData.user?.id) {
        createdTestData.users.push(responseData.user.id);
      }
    });

    test('should get all users with pagination', async () => {
      const offset = 0;
      const limit = 10;

      const response = await api.authenticatedRequest('GET', `/admin/users/${offset}/${limit}`, testTokens.admin);

      expect(response.status()).toBe(200);

      const responseData = await response.json();
      expect(Array.isArray(responseData)).toBe(true);

      // Validate user structure if users exist
      if (responseData.length > 0) {
        validateUserObject(responseData[0]);
      }
    });

    test('should get users filtered by role', async () => {
      const offset = 0;
      const limit = 10;
      const role = 'teacher';

      const response = await api.authenticatedRequest('GET', `/admin/users/${offset}/${limit}?role=${role}`, testTokens.admin);

      expect(response.status()).toBe(200);

      const responseData = await response.json();
      expect(Array.isArray(responseData)).toBe(true);

      // All returned users should have the specified role
      responseData.forEach(user => {
        expect(user.role).toBe(role);
      });
    });

    test('should get users filtered by department', async () => {
      const offset = 0;
      const limit = 10;
      const departmentId = 1;

      const response = await api.authenticatedRequest('GET', `/admin/users/${offset}/${limit}?departmentId=${departmentId}`, testTokens.admin);

      expect(response.status()).toBe(200);

      const responseData = await response.json();
      expect(Array.isArray(responseData)).toBe(true);
    });

    test('should get user by ID', async () => {
      // First get users to get a valid user ID
      const usersResponse = await api.authenticatedRequest('GET', '/admin/users/0/10', testTokens.admin);
      expect(usersResponse.status()).toBe(200);

      const users = await usersResponse.json();
      if (users.length > 0) {
        const userId = users[0].id;

        const response = await api.authenticatedRequest('GET', `/admin/users/${userId}`, testTokens.admin);
        expect(response.status()).toBe(200);

        const responseData = await response.json();
        validateUserObject(responseData);
        expect(responseData.id).toBe(userId);
      }
    });

    test('should update user information', async () => {
      // Get a user to update
      const usersResponse = await api.authenticatedRequest('GET', '/admin/users/0/10', testTokens.admin);
      expect(usersResponse.status()).toBe(200);

      const users = await usersResponse.json();
      if (users.length > 0) {
        const userId = users[0].id;

        const updateData = {
          firstName: 'Updated',
          lastName: 'Name',
          is_active: true
        };

        const response = await api.authenticatedRequest('PUT', `/admin/users/${userId}`, testTokens.admin, {
          data: updateData
        });

        expect(response.status()).toBe(200);

        const responseData = await response.json();
        expect(responseData).toHaveProperty('message');
        expect(responseData.message.toLowerCase()).toContain('success');
      }
    });

    test('should delete user', async () => {
      // Create a user specifically for deletion
      const userData = {
        email: 'delete.test@smis.test',
        password: 'DeleteTest123!',
        firstName: 'Delete',
        lastName: 'Test',
        role: 'teacher'
      };

      const createResponse = await api.authenticatedRequest('POST', '/admin/users', testTokens.admin, {
        data: userData
      });
      expect(createResponse.status()).toBe(201);

      const createdUser = await createResponse.json();
      const userId = createdUser.user.id;

      const response = await api.authenticatedRequest('DELETE', `/admin/users/${userId}`, testTokens.admin);
      expect(response.status()).toBe(200);

      const responseData = await response.json();
      expect(responseData).toHaveProperty('message');
      expect(responseData.message.toLowerCase()).toContain('success');
    });

    test('should reject user creation without admin privileges', async () => {
      const userData = {
        email: 'unauthorized@smis.test',
        password: 'Test123!',
        firstName: 'Test',
        lastName: 'User',
        role: 'teacher'
      };

      const response = await api.authenticatedRequest('POST', '/admin/users', testTokens.teacher, {
        data: userData
      });

      expect(response.status()).toBe(403);
    });

    test('should reject user listing without admin privileges', async () => {
      const response = await api.authenticatedRequest('GET', '/admin/users/0/10', testTokens.student);

      expect(response.status()).toBe(403);
    });
  });

  test.describe('Department Management', () => {
    test('should get all departments', async () => {
      const response = await api.authenticatedRequest('GET', '/admin/departments/0/10', testTokens.admin);

      expect(response.status()).toBe(200);

      const responseData = await response.json();
      expect(Array.isArray(responseData)).toBe(true);

      // Validate department structure if departments exist
      if (responseData.length > 0) {
        const department = responseData[0];
        expect(department).toHaveProperty('id');
        expect(department).toHaveProperty('name');
        expect(typeof department.id).toBe('number');
        expect(typeof department.name).toBe('string');
      }
    });

    test('should create new department', async () => {
      const departmentData = {
        name: 'Test Department',
        description: 'A test department for API testing',
        code: 'TEST'
      };

      const response = await api.authenticatedRequest('POST', '/admin/departments', testTokens.admin, {
        data: departmentData
      });

      expect(response.status()).toBe(201);

      const responseData = await response.json();
      expect(responseData).toHaveProperty('message');
      expect(responseData).toHaveProperty('department');
      expect(responseData.department.name).toBe(departmentData.name);
    });

    test('should reject department creation without admin privileges', async () => {
      const departmentData = {
        name: 'Unauthorized Department',
        description: 'Should not be created',
        code: 'UNAUTH'
      };

      const response = await api.authenticatedRequest('POST', '/admin/departments', testTokens.teacher, {
        data: departmentData
      });

      expect(response.status()).toBe(403);
    });
  });

  test.describe('Student Management', () => {
    test('should get all students', async () => {
      const response = await api.authenticatedRequest('GET', '/admin/students/0/10', testTokens.admin);

      expect(response.status()).toBe(200);

      const responseData = await response.json();
      expect(Array.isArray(responseData)).toBe(true);

      // Validate student structure if students exist
      if (responseData.length > 0) {
        const student = responseData[0];
        expect(student).toHaveProperty('id');
        expect(student).toHaveProperty('email');
        expect(student).toHaveProperty('role');
        expect(student.role).toBe('student');
      }
    });

    test('should get students filtered by department', async () => {
      const departmentId = 1;
      const response = await api.authenticatedRequest('GET', `/admin/students/0/10?departmentId=${departmentId}`, testTokens.admin);

      expect(response.status()).toBe(200);

      const responseData = await response.json();
      expect(Array.isArray(responseData)).toBe(true);
    });

    test('should reject student listing without admin privileges', async () => {
      const response = await api.authenticatedRequest('GET', '/admin/students/0/10', testTokens.student);

      expect(response.status()).toBe(403);
    });
  });

  test.describe('System Statistics', () => {
    test('should get admin dashboard statistics', async () => {
      const response = await api.authenticatedRequest('GET', '/admin/stats', testTokens.admin);

      expect(response.status()).toBe(200);

      const responseData = await response.json();
      expect(responseData).toHaveProperty('totalUsers');
      expect(responseData).toHaveProperty('totalStudents');
      expect(responseData).toHaveProperty('totalTeachers');
      expect(responseData).toHaveProperty('activeSessions');

      expect(typeof responseData.totalUsers).toBe('number');
      expect(typeof responseData.totalStudents).toBe('number');
      expect(typeof responseData.totalTeachers).toBe('number');
      expect(typeof responseData.activeSessions).toBe('number');
    });

    test('should reject stats access without admin privileges', async () => {
      const response = await api.authenticatedRequest('GET', '/admin/stats', testTokens.teacher);

      expect(response.status()).toBe(403);
    });
  });

  test.describe('Timetable Management', () => {
    test('should get timetable information', async () => {
      const response = await api.authenticatedRequest('GET', '/admin/timetable', testTokens.admin);

      expect(response.status()).toBe(200);

      const responseData = await response.json();
      expect(Array.isArray(responseData)).toBe(true);

      // Validate timetable structure if entries exist
      if (responseData.length > 0) {
        const timetableEntry = responseData[0];
        expect(timetableEntry).toHaveProperty('id');
        expect(timetableEntry).toHaveProperty('subject');
        expect(timetableEntry).toHaveProperty('time');
        expect(timetableEntry).toHaveProperty('day');
      }
    });

    test('should create timetable entry', async () => {
      const timetableData = {
        subject: 'Test Subject',
        teacher: 'Test Teacher',
        time: '09:00-10:00',
        day: 'Monday',
        classroom: 'Room 101',
        departmentId: 1
      };

      const response = await api.authenticatedRequest('POST', '/admin/timetable', testTokens.admin, {
        data: timetableData
      });

      expect(response.status()).toBe(201);

      const responseData = await response.json();
      expect(responseData).toHaveProperty('message');
      expect(responseData.message.toLowerCase()).toContain('success');
    });

    test('should update timetable entry', async () => {
      // First get timetable entries
      const timetableResponse = await api.authenticatedRequest('GET', '/admin/timetable', testTokens.admin);
      expect(timetableResponse.status()).toBe(200);

      const timetable = await timetableResponse.json();
      if (timetable.length > 0) {
        const entryId = timetable[0].id;

        const updateData = {
          subject: 'Updated Subject',
          time: '10:00-11:00'
        };

        const response = await api.authenticatedRequest('PUT', `/admin/timetable/${entryId}`, testTokens.admin, {
          data: updateData
        });

        expect(response.status()).toBe(200);

        const responseData = await response.json();
        expect(responseData).toHaveProperty('message');
      }
    });

    test('should reject timetable access without admin privileges', async () => {
      const response = await api.authenticatedRequest('GET', '/admin/timetable', testTokens.student);

      expect(response.status()).toBe(403);
    });
  });
});

/**
 * HOD PORTAL TESTS
 */
test.describe('👨‍💼 HOD Portal Endpoints', () => {
  let api;

  test.beforeEach(async ({ request }) => {
    api = new APIHelper(request);
  });

  test.describe('HOD Profile', () => {
    test('should get HOD profile information', async () => {
      const response = await api.authenticatedRequest('GET', '/hod/profile', testTokens.hod);

      expect(response.status()).toBe(200);

      const responseData = await response.json();
      validateUserObject(responseData);
      expect(responseData.role).toBe('hod');
    });

    test('should reject profile request without authentication', async () => {
      const response = await api.makeRequest('GET', '/hod/profile');

      expect(response.status()).toBe(401);
    });
  });

  test.describe('Department Management', () => {
    test('should get department information', async () => {
      const response = await api.authenticatedRequest('GET', '/hod/department', testTokens.hod);

      expect(response.status()).toBe(200);

      const responseData = await response.json();
      expect(responseData).toHaveProperty('id');
      expect(responseData).toHaveProperty('name');
      expect(responseData).toHaveProperty('teachers');
      expect(responseData).toHaveProperty('students');
      expect(Array.isArray(responseData.teachers)).toBe(true);
      expect(Array.isArray(responseData.students)).toBe(true);
    });

    test('should get department statistics', async () => {
      const response = await api.authenticatedRequest('GET', '/hod/stats', testTokens.hod);

      expect(response.status()).toBe(200);

      const responseData = await response.json();
      expect(responseData).toHaveProperty('totalTeachers');
      expect(responseData).toHaveProperty('totalStudents');
      expect(responseData).toHaveProperty('totalCourses');
      expect(typeof responseData.totalTeachers).toBe('number');
      expect(typeof responseData.totalStudents).toBe('number');
      expect(typeof responseData.totalCourses).toBe('number');
    });

    test('should reject department access without HOD privileges', async () => {
      const response = await api.authenticatedRequest('GET', '/hod/department', testTokens.teacher);

      expect(response.status()).toBe(403);
    });
  });

  test.describe('Teacher Management', () => {
    test('should get department teachers', async () => {
      const response = await api.authenticatedRequest('GET', '/hod/teachers', testTokens.hod);

      expect(response.status()).toBe(200);

      const responseData = await response.json();
      expect(Array.isArray(responseData)).toBe(true);

      // Validate teacher structure if teachers exist
      if (responseData.length > 0) {
        const teacher = responseData[0];
        expect(teacher).toHaveProperty('id');
        expect(teacher).toHaveProperty('email');
        expect(teacher).toHaveProperty('role');
        expect(teacher.role).toBe('teacher');
      }
    });

    test('should approve teacher requests', async () => {
      // This would typically require a pending request to approve
      const approvalData = {
        teacherId: 1,
        requestType: 'leave',
        status: 'approved',
        comments: 'Approved by HOD'
      };

      const response = await api.authenticatedRequest('POST', '/hod/approvals', testTokens.hod, {
        data: approvalData
      });

      // Status could be 200 (success) or 404 (no pending requests)
      expect([200, 404]).toContain(response.status());
    });
  });
});

/**
 * FINANCE PORTAL TESTS
 */
test.describe('💰 Finance Portal Endpoints', () => {
  let api;

  test.beforeEach(async ({ request }) => {
    api = new APIHelper(request);
  });

  test.describe('Finance Profile', () => {
    test('should get finance profile information', async () => {
      const response = await api.authenticatedRequest('GET', '/finance/profile', testTokens.finance);

      expect(response.status()).toBe(200);

      const responseData = await response.json();
      validateUserObject(responseData);
      expect(responseData.role).toBe('finance');
    });

    test('should reject profile request without authentication', async () => {
      const response = await api.makeRequest('GET', '/finance/profile');

      expect(response.status()).toBe(401);
    });
  });

  test.describe('Fee Management', () => {
    test('should get all student fees', async () => {
      const response = await api.authenticatedRequest('GET', '/finance/fees', testTokens.finance);

      expect(response.status()).toBe(200);

      const responseData = await response.json();
      expect(Array.isArray(responseData)).toBe(true);

      // Validate fee structure if fees exist
      if (responseData.length > 0) {
        const fee = responseData[0];
        expect(fee).toHaveProperty('studentId');
        expect(fee).toHaveProperty('amount');
        expect(fee).toHaveProperty('status');
        expect(typeof fee.amount).toBe('number');
      }
    });

    test('should get fee payments', async () => {
      const response = await api.authenticatedRequest('GET', '/finance/payments', testTokens.finance);

      expect(response.status()).toBe(200);

      const responseData = await response.json();
      expect(Array.isArray(responseData)).toBe(true);

      // Validate payment structure if payments exist
      if (responseData.length > 0) {
        const payment = responseData[0];
        expect(payment).toHaveProperty('id');
        expect(payment).toHaveProperty('amount');
        expect(payment).toHaveProperty('date');
        expect(payment).toHaveProperty('status');
        expect(typeof payment.amount).toBe('number');
      }
    });

    test('should process fee payment', async () => {
      const paymentData = {
        studentId: 1,
        amount: 1000,
        paymentMethod: 'bank_transfer',
        transactionId: 'TXN123456',
        description: 'Semester fee payment'
      };

      const response = await api.authenticatedRequest('POST', '/finance/payments', testTokens.finance, {
        data: paymentData
      });

      expect(response.status()).toBe(201);

      const responseData = await response.json();
      expect(responseData).toHaveProperty('message');
      expect(responseData.message.toLowerCase()).toContain('success');
    });

    test('should generate financial reports', async () => {
      const reportParams = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        type: 'fee_collection'
      };

      const response = await api.authenticatedRequest('GET', `/finance/reports?startDate=${reportParams.startDate}&endDate=${reportParams.endDate}&type=${reportParams.type}`, testTokens.finance);

      expect(response.status()).toBe(200);

      const responseData = await response.json();
      expect(responseData).toHaveProperty('totalCollection');
      expect(responseData).toHaveProperty('totalOutstanding');
      expect(responseData).toHaveProperty('paymentBreakdown');
      expect(typeof responseData.totalCollection).toBe('number');
      expect(typeof responseData.totalOutstanding).toBe('number');
    });

    test('should reject fee access without finance privileges', async () => {
      const response = await api.authenticatedRequest('GET', '/finance/fees', testTokens.teacher);

      expect(response.status()).toBe(403);
    });
  });
});

/**
 * ERROR HANDLING AND EDGE CASES
 */
test.describe('🚨 Error Handling and Edge Cases', () => {
  let api;

  test.beforeEach(async ({ request }) => {
    api = new APIHelper(request);
  });

  test.describe('Authentication Errors', () => {
    test('should handle expired tokens', async () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

      const response = await api.authenticatedRequest('GET', '/auth/profile', expiredToken);

      expect(response.status()).toBe(401);
    });

    test('should handle malformed tokens', async () => {
      const malformedToken = 'invalid.token.format';

      const response = await api.authenticatedRequest('GET', '/auth/profile', malformedToken);

      expect(response.status()).toBe(401);
    });

    test('should handle missing authorization header', async () => {
      const response = await api.makeRequest('GET', '/auth/profile');

      expect(response.status()).toBe(401);
    });
  });

  test.describe('Input Validation', () => {
    test('should validate email format in registration', async () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'ValidPassword123!',
        firstName: 'Test',
        lastName: 'User',
        role: 'student'
      };

      const response = await api.makeRequest('POST', '/auth/register', {
        data: invalidData
      });

      expect(response.status()).toBe(400);
    });

    test('should validate required fields', async () => {
      const incompleteData = {
        email: 'test@example.com'
        // Missing required fields
      };

      const response = await api.makeRequest('POST', '/auth/register', {
        data: incompleteData
      });

      expect(response.status()).toBe(400);
    });

    test('should handle invalid pagination parameters', async () => {
      const response = await api.authenticatedRequest('GET', '/admin/users/-1/0', testTokens.admin);

      expect(response.status()).toBe(400);
    });
  });

  test.describe('Resource Not Found', () => {
    test('should handle non-existent user ID', async () => {
      const nonExistentId = 999999;

      const response = await api.authenticatedRequest('GET', `/admin/users/${nonExistentId}`, testTokens.admin);

      expect(response.status()).toBe(404);
    });

    test('should handle non-existent endpoints', async () => {
      const response = await api.authenticatedRequest('GET', '/non-existent-endpoint', testTokens.admin);

      expect(response.status()).toBe(404);
    });
  });
});
