const axios = require('axios');

// Test script for course admin endpoints
const API_BASE = 'http://localhost:5000/api';

async function testCourseEndpoints() {
  console.log('🧪 Testing Course Admin Endpoints...\n');

  try {
    // Test 1: Get all courses
    console.log('1️⃣ Testing GET /admin/courses/all/0/10');
    try {
      const response = await axios.get(`${API_BASE}/admin/courses/all/0/10`, {
        headers: {
          'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE'
        }
      });
      console.log('✅ GET courses successful');
      console.log('Response structure:', {
        courses: Array.isArray(response.data.courses),
        pagination: !!response.data.pagination
      });
    } catch (error) {
      console.log('❌ GET courses failed:', error.response?.data?.message || error.message);
    }

    console.log('\n2️⃣ Testing POST /admin/courses/manage (Create)');
    try {
      const createData = {
        action: 'create',
        name: 'Test Course',
        course_code: 'TEST101',
        credits: 3,
        description: 'Test course description',
        department_id: 1,
        semester: 1,
        year: '2024-2025',
        prerequisites: 'None'
      };

      const response = await axios.post(`${API_BASE}/admin/courses/manage`, createData, {
        headers: {
          'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE',
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ CREATE course successful');
      console.log('Course ID:', response.data.courseId);
    } catch (error) {
      console.log('❌ CREATE course failed:', error.response?.data?.message || error.message);
    }

    console.log('\n3️⃣ Testing POST /admin/courses/manage (Update)');
    try {
      const updateData = {
        action: 'update',
        id: 1, // Assuming course ID 1 exists
        name: 'Updated Test Course',
        description: 'Updated description'
      };

      const response = await axios.post(`${API_BASE}/admin/courses/manage`, updateData, {
        headers: {
          'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE',
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ UPDATE course successful');
    } catch (error) {
      console.log('❌ UPDATE course failed:', error.response?.data?.message || error.message);
    }

    console.log('\n4️⃣ Testing POST /admin/courses/manage (Delete)');
    try {
      const deleteData = {
        action: 'delete',
        id: 999 // Using non-existent ID to test error handling
      };

      const response = await axios.post(`${API_BASE}/admin/courses/manage`, deleteData, {
        headers: {
          'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE',
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ DELETE course successful');
    } catch (error) {
      console.log('❌ DELETE course failed (expected):', error.response?.data?.message || error.message);
    }

  } catch (error) {
    console.error('❌ Test setup failed:', error.message);
  }

  console.log('\n🏁 Course endpoint testing completed!');
  console.log('\n📝 Notes:');
  console.log('- Replace YOUR_ADMIN_TOKEN_HERE with a valid admin JWT token');
  console.log('- Ensure the backend server is running on port 5000');
  console.log('- Check database connection and table structure');
}

// Run the tests
testCourseEndpoints();
