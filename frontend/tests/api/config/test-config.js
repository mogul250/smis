/**
 * SMIS API Test Configuration
 * Centralized configuration for API testing
 */

const config = {
  // Base API URL - can be overridden by environment variable
  baseURL: process.env.SMIS_API_URL || 'http://localhost:5000/api',
  
  // Test timeouts
  timeout: {
    default: 30000,
    auth: 10000,
    api: 15000
  },
  
  // Test data configuration
  testData: {
    // Test users for different roles
    users: {
      admin: {
        email: 'admin@smis.com',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin'
      },
      teacher: {
        email: 'teacher@smis.com',
        password: 'teacher123',
        firstName: 'Teacher',
        lastName: 'User',
        role: 'teacher'
      },
      student: {
        email: 'student@smis.com',
        password: 'student123',
        firstName: 'Student',
        lastName: 'User',
        role: 'student'
      },
      hod: {
        email: 'hod@smis.com',
        password: 'hod123',
        firstName: 'HOD',
        lastName: 'User',
        role: 'hod'
      },
      finance: {
        email: 'finance@smis.com',
        password: 'finance123',
        firstName: 'Finance',
        lastName: 'User',
        role: 'finance'
      }
    },
    
    // Invalid test data
    invalid: {
      email: 'invalid@test.com',
      password: 'wrongpassword',
      malformedEmail: 'not-an-email',
      weakPassword: '123'
    }
  },
  
  // Expected response schemas
  schemas: {
    loginResponse: {
      required: ['message', 'user', 'token'],
      userFields: ['id', 'email', 'role', 'userType']
    },
    userResponse: {
      required: ['id', 'email', 'role', 'userType'],
      optional: ['firstName', 'lastName', 'is_active']
    },
    errorResponse: {
      required: ['message'],
      optional: ['error', 'details']
    }
  },
  
  // Test environment settings
  env: {
    cleanup: process.env.CLEANUP_TEST_DATA !== 'false',
    verbose: process.env.VERBOSE_TESTS === 'true',
    retries: parseInt(process.env.TEST_RETRIES) || 2
  }
};

module.exports = config;
