import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

async function testAuthEndpoints() {
  console.log('🧪 Testing Authentication Endpoints...\n');

  try {
    // Test 1: Register a new user
    console.log('1. Testing user registration...');
    const registerData = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@test.com',
      password: 'password123',
      role: 'teacher'
    };

    try {
      const registerResponse = await axios.post(`${API_BASE}/auth/register`, registerData);
      console.log('✅ Registration successful:', registerResponse.data);
    } catch (error) {
      console.log('❌ Registration failed:', error.response?.data?.message || error.message);
    }

    // Test 2: Login with the registered user
    console.log('\n2. Testing user login...');
    const loginData = {
      email: 'john.doe@test.com',
      password: 'password123'
    };

    try {
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, loginData);
      console.log('✅ Login successful:', loginResponse.data);
      
      // Test 3: Get user profile
      console.log('\n3. Testing profile retrieval...');
      const token = loginResponse.data.token;
      const profileResponse = await axios.get(`${API_BASE}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Profile retrieved:', profileResponse.data);
      
    } catch (error) {
      console.log('❌ Login failed:', error.response?.data?.message || error.message);
    }

    // Test 4: Test student login endpoint
    console.log('\n4. Testing student login endpoint...');
    try {
      const studentLoginResponse = await axios.post(`${API_BASE}/auth/student/login`, {
        email: 'student@test.com',
        password: 'password123'
      });
      console.log('✅ Student login successful:', studentLoginResponse.data);
    } catch (error) {
      console.log('❌ Student login failed (expected if no student exists):', error.response?.data?.message || error.message);
    }

  } catch (error) {
    console.log('❌ Server not responding. Make sure the backend server is running on port 5000');
    console.log('Error:', error.message);
  }
}

testAuthEndpoints();
