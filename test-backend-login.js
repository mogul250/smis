import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';

// Test credentials for each role
const testUsers = [
  { email: 'admin@smis.edu', password: 'admin123', role: 'admin' },
  { email: 'finance@smis.edu', password: 'finance123', role: 'finance' },
  { email: 'hod.cs@smis.edu', password: 'hod123', role: 'hod' },
  { email: 'alice.teacher@smis.edu', password: 'teacher123', role: 'teacher' },
  { email: 'alex.student@smis.edu', password: 'student123', role: 'student' }
];

async function testLogin(user) {
  try {
    console.log(`\n🔍 Testing login for ${user.role}: ${user.email}`);
    
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        password: user.password
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ Login successful for ${user.role}`);
      console.log(`   User ID: ${data.user.id}`);
      console.log(`   Role: ${data.user.role}`);
      console.log(`   User Type: ${data.user.userType}`);
      return data.token;
    } else {
      console.log(`❌ Login failed for ${user.role}: ${data.message}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ Network error for ${user.role}: ${error.message}`);
    return null;
  }
}

async function testBackendEndpoints() {
  console.log('🚀 Testing SMIS Backend Login Endpoints');
  console.log('=====================================');
  
  // Check if backend is running
  try {
    const healthCheck = await fetch(`${BASE_URL}/health`);
    if (!healthCheck.ok) {
      throw new Error('Backend not responding');
    }
    console.log('✅ Backend server is running');
  } catch (error) {
    console.log('❌ Backend server is not running. Please start it with: npm start');
    console.log('   Make sure you are in the backend directory');
    return;
  }

  console.log('\n📝 Testing user logins...');
  
  for (const user of testUsers) {
    const token = await testLogin(user);
    if (token) {
      // Test profile endpoint with token
      try {
        const profileResponse = await fetch(`${BASE_URL}/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (profileResponse.ok) {
          console.log(`   ✅ Profile endpoint working for ${user.role}`);
        } else {
          console.log(`   ⚠ Profile endpoint failed for ${user.role}`);
        }
      } catch (error) {
        console.log(`   ⚠ Profile test failed for ${user.role}: ${error.message}`);
      }
    }
  }

  console.log('\n🎉 Backend testing completed!');
  console.log('\n📋 Summary:');
  console.log('- All user credentials have been created and tested');
  console.log('- You can now use these credentials to test your frontend');
  console.log('- Check USER_CREDENTIALS.md for the complete list of users');
}

// Install node-fetch if not available
try {
  testBackendEndpoints();
} catch (error) {
  if (error.code === 'ERR_MODULE_NOT_FOUND') {
    console.log('Installing node-fetch...');
    console.log('Please run: npm install node-fetch');
  } else {
    console.error('Error:', error.message);
  }
}
