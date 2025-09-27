const API_BASE_URL = 'http://localhost:5000/api';

// Test function to check attendance endpoint
async function testAttendanceEndpoint() {
  try {
    console.log('Testing attendance endpoint...');
    
    // First, test if server is running
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✓ Server is running:', healthData);
    
    // Test attendance endpoint (this will fail without auth, but we can see the error)
    try {
      const attendanceUrl = `${API_BASE_URL}/students/attendance?startDate=2024-01-01&endDate=2024-12-31`;
      const attendanceResponse = await fetch(attendanceUrl);
      
      if (attendanceResponse.status === 401) {
        console.log('✓ Attendance endpoint exists but requires authentication (expected)');
        const errorData = await attendanceResponse.json();
        console.log('Response:', errorData);
      } else if (attendanceResponse.ok) {
        const data = await attendanceResponse.json();
        console.log('✓ Attendance endpoint response:', data);
      } else {
        const errorData = await attendanceResponse.json();
        console.log('✗ Unexpected error:', errorData);
      }
    } catch (authError) {
      console.log('✗ Attendance endpoint error:', authError.message);
    }
    
  } catch (error) {
    console.error('✗ Server connection failed:', error.message);
    console.log('Make sure the backend server is running on port 5000');
  }
}

// Run the test
testAttendanceEndpoint();
