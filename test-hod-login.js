// Simple test script to login as HOD/Student and test API endpoints
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api';

async function testStudentLogin() {
  try {
    console.log('Testing Student login and API endpoints...');

    // Step 1: Test backend health
    console.log('\n1. Testing backend health...');
    const healthResponse = await fetch(`${API_BASE}/health`);
    if (healthResponse.ok) {
      const health = await healthResponse.json();
      console.log('✅ Backend is running:', health.message);
    } else {
      console.log('❌ Backend health check failed');
      return;
    }

    // Step 2: Login as Student
    console.log('\n2. Attempting Student login...');
    const loginResponse = await fetch(`${API_BASE}/auth/student/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'student@test.com',
        password: 'password123'
      })
    });

    if (!loginResponse.ok) {
      const error = await loginResponse.text();
      console.log('❌ Student login failed:', error);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Student login successful:', loginData.user);
    const token = loginData.token;

    // Step 3: Test Student profile endpoint
    console.log('\n3. Testing Student profile endpoint...');
    const profileResponse = await fetch(`${API_BASE}/students/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (profileResponse.ok) {
      const profile = await profileResponse.json();
      console.log('✅ Student profile retrieved:', profile);
    } else {
      const error = await profileResponse.text();
      console.log('❌ Student profile failed:', error);
    }

    console.log('\n🎉 Student tests completed!');
    console.log('\nTo use in frontend:');
    console.log('1. Go to http://localhost:3000/login');
    console.log('2. Select "Student" user type');
    console.log('3. Login with: student@test.com / password123');
    console.log('4. Navigate to dashboard');

  } catch (error) {
    console.error('❌ Student test failed:', error.message);
  }
}

async function testHodLogin() {
  try {
    console.log('Testing HOD login and API endpoints...');
    
    // Step 1: Test backend health
    console.log('\n1. Testing backend health...');
    const healthResponse = await fetch(`${API_BASE}/health`);
    if (healthResponse.ok) {
      const health = await healthResponse.json();
      console.log('✅ Backend is running:', health.message);
    } else {
      console.log('❌ Backend health check failed');
      return;
    }

    // Step 2: Login as HOD
    console.log('\n2. Attempting HOD login...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'hod@test.com',
        password: 'password123'
      })
    });

    if (!loginResponse.ok) {
      const error = await loginResponse.text();
      console.log('❌ Login failed:', error);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful:', loginData.user);
    const token = loginData.token;

    // Step 3: Test HOD profile endpoint
    console.log('\n3. Testing HOD profile endpoint...');
    const profileResponse = await fetch(`${API_BASE}/hod/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (profileResponse.ok) {
      const profile = await profileResponse.json();
      console.log('✅ Profile retrieved:', profile);
    } else {
      const error = await profileResponse.text();
      console.log('❌ Profile failed:', error);
    }

    // Step 4: Test HOD teachers endpoint
    console.log('\n4. Testing HOD teachers endpoint...');
    const teachersResponse = await fetch(`${API_BASE}/hod/teachers`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (teachersResponse.ok) {
      const teachers = await teachersResponse.json();
      console.log('✅ Teachers retrieved:', teachers.length, 'teachers');
    } else {
      const error = await teachersResponse.text();
      console.log('❌ Teachers failed:', error);
    }

    // Step 5: Test HOD stats endpoint
    console.log('\n5. Testing HOD stats endpoint...');
    const statsResponse = await fetch(`${API_BASE}/hod/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (statsResponse.ok) {
      const stats = await statsResponse.json();
      console.log('✅ Stats retrieved:', stats);
    } else {
      const error = await statsResponse.text();
      console.log('❌ Stats failed:', error);
    }

    // Step 6: Test HOD timetable endpoint
    console.log('\n6. Testing HOD timetable endpoint...');
    const timetableResponse = await fetch(`${API_BASE}/hod/timetable`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (timetableResponse.ok) {
      const timetable = await timetableResponse.json();
      console.log('✅ Timetable retrieved:', timetable.length, 'entries');
    } else {
      const error = await timetableResponse.text();
      console.log('❌ Timetable failed:', error);
    }

    console.log('\n🎉 All tests completed!');
    console.log('\nTo use in frontend:');
    console.log('1. Go to http://localhost:3000/login');
    console.log('2. Login with: hod@test.com / password123');
    console.log('3. Navigate to dashboard');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Running all authentication tests...\n');

  await testStudentLogin();
  console.log('\n' + '='.repeat(50) + '\n');
  await testHodLogin();

  console.log('\n🎉 All tests completed!');
}

runAllTests();
