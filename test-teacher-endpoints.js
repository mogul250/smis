const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Test teacher endpoints
async function testTeacherEndpoints() {
  console.log('Testing Teacher API Endpoints...\n');

  try {
    // First, let's try to login as a teacher to get a token
    console.log('1. Testing teacher login...');
    
    // You'll need to replace these with actual teacher credentials
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'teacher@example.com', // Replace with actual teacher email
      password: 'password123' // Replace with actual password
    });
    
    const token = loginResponse.data.token;
    console.log('✓ Login successful');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Test 1: Get teacher profile
    console.log('\n2. Testing GET /teachers/profile...');
    try {
      const profileResponse = await axios.get(`${API_BASE}/teachers/profile`, { headers });
      console.log('✓ Profile endpoint working');
      console.log('Profile data:', JSON.stringify(profileResponse.data, null, 2));
    } catch (error) {
      console.log('✗ Profile endpoint failed:', error.response?.data?.message || error.message);
    }

    // Test 2: Get teacher classes
    console.log('\n3. Testing GET /teachers/classes...');
    try {
      const classesResponse = await axios.get(`${API_BASE}/teachers/classes`, { headers });
      console.log('✓ Classes endpoint working');
      console.log('Classes data:', JSON.stringify(classesResponse.data, null, 2));
    } catch (error) {
      console.log('✗ Classes endpoint failed:', error.response?.data?.message || error.message);
    }

    // Test 3: Get teacher timetable
    console.log('\n4. Testing GET /teachers/timetable/current...');
    try {
      const timetableResponse = await axios.get(`${API_BASE}/teachers/timetable/current`, { headers });
      console.log('✓ Timetable endpoint working');
      console.log('Timetable data:', JSON.stringify(timetableResponse.data, null, 2));
    } catch (error) {
      console.log('✗ Timetable endpoint failed:', error.response?.data?.message || error.message);
    }

    // Test 4: Get all students
    console.log('\n5. Testing GET /teachers/classes/students...');
    try {
      const studentsResponse = await axios.get(`${API_BASE}/teachers/classes/students`, { headers });
      console.log('✓ Students endpoint working');
      console.log('Students data:', JSON.stringify(studentsResponse.data, null, 2));
    } catch (error) {
      console.log('✗ Students endpoint failed:', error.response?.data?.message || error.message);
    }

    // Test 5: Update profile
    console.log('\n6. Testing PUT /teachers/profile...');
    try {
      const updateData = {
        first_name: 'Updated',
        last_name: 'Teacher'
      };
      const updateResponse = await axios.put(`${API_BASE}/teachers/profile`, updateData, { headers });
      console.log('✓ Profile update endpoint working');
      console.log('Update response:', JSON.stringify(updateResponse.data, null, 2));
    } catch (error) {
      console.log('✗ Profile update endpoint failed:', error.response?.data?.message || error.message);
    }

  } catch (loginError) {
    console.log('✗ Login failed:', loginError.response?.data?.message || loginError.message);
    console.log('Please ensure you have a teacher account in the database or update the credentials in this test file.');
  }
}

// Test without authentication to check route availability
async function testRouteAvailability() {
  console.log('\n\nTesting Route Availability (without auth)...\n');

  const endpoints = [
    '/teachers/profile',
    '/teachers/classes',
    '/teachers/timetable/current',
    '/teachers/classes/students'
  ];

  for (const endpoint of endpoints) {
    try {
      await axios.get(`${API_BASE}${endpoint}`);
      console.log(`✓ ${endpoint} - Route exists`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log(`✓ ${endpoint} - Route exists (requires auth)`);
      } else if (error.response?.status === 404) {
        console.log(`✗ ${endpoint} - Route not found`);
      } else {
        console.log(`? ${endpoint} - ${error.response?.status || 'Unknown error'}`);
      }
    }
  }
}

// Run tests
testRouteAvailability().then(() => {
  testTeacherEndpoints();
});
