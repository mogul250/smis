#!/usr/bin/env node

/**
 * Student Endpoint Integration Test
 * Tests the updated student API endpoints to ensure they work correctly
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test configuration
const testConfig = {
  student: {
    email: 'student@test.com',
    password: 'password123'
  }
};

let authToken = null;

async function login() {
  try {
    console.log('🔐 Logging in as student...');
    const response = await axios.post(`${BASE_URL}/auth/student/login`, testConfig.student);
    authToken = response.data.token;
    console.log('✅ Login successful');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testEndpoint(name, method, url, data = null) {
  try {
    console.log(`\n🧪 Testing ${name}...`);
    console.log(`   ${method} ${url}`);
    
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    console.log(`✅ ${name} - Status: ${response.status}`);
    console.log(`   Response type: ${Array.isArray(response.data) ? 'Array' : typeof response.data}`);
    
    if (Array.isArray(response.data)) {
      console.log(`   Array length: ${response.data.length}`);
    } else if (typeof response.data === 'object') {
      console.log(`   Object keys: ${Object.keys(response.data).join(', ')}`);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ ${name} failed:`, error.response?.data?.message || error.message);
    if (error.response?.status) {
      console.error(`   Status: ${error.response.status}`);
    }
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Student Endpoint Integration Tests\n');
  
  // Login first
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.error('❌ Cannot proceed without authentication');
    process.exit(1);
  }
  
  const tests = [
    {
      name: 'Get Student Profile',
      method: 'GET',
      url: '/students/profile'
    },
    {
      name: 'Get Student Grades',
      method: 'GET', 
      url: '/students/grades'
    },
    {
      name: 'Get Student Attendance (with date range)',
      method: 'GET',
      url: '/students/attendance?startDate=2024-01-01&endDate=2024-12-31'
    },
    {
      name: 'Get Student Fees',
      method: 'GET',
      url: '/students/fees'
    },
    {
      name: 'Get Student Timetable (current semester)',
      method: 'GET',
      url: '/students/timetable'
    },
    {
      name: 'Get Student Timetable (specific semester)',
      method: 'GET',
      url: '/students/timetable?semester=Fall%202024'
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const success = await testEndpoint(test.name, test.method, test.url, test.data);
    if (success) {
      passed++;
    } else {
      failed++;
    }
  }
  
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All student endpoint tests passed!');
    console.log('✅ Student endpoint integration is working correctly');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the backend server and database.');
  }
}

// Run the tests
runTests().catch(error => {
  console.error('💥 Test runner failed:', error.message);
  process.exit(1);
});
