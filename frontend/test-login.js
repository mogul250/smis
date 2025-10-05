const fetch = require('node-fetch');

async function testLogin() {
  try {
    console.log('Testing login endpoint...');
    
    // Try with some common test credentials
    const credentials = [
      { email: 'admin@smis.com', password: 'admin123' },
      { email: 'admin@example.com', password: 'password' },
      { email: 'test@test.com', password: 'test123' },
      { email: 'admin', password: 'admin' }
    ];
    
    for (const cred of credentials) {
      console.log(`\nTrying login with: ${cred.email}`);
      
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cred)
      });
      
      console.log('Status:', response.status);
      
      const text = await response.text();
      console.log('Response:', text);
      
      if (response.status === 200) {
        console.log('✅ Login successful!');
        try {
          const data = JSON.parse(text);
          console.log('User:', data.user);
          console.log('Token available:', !!data.token);
          return data;
        } catch (e) {
          console.log('Failed to parse response');
        }
      }
    }
    
    console.log('❌ No successful logins found');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testLogin();
