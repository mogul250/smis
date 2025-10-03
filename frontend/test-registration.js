const fetch = require('node-fetch');

async function testRegistration() {
  try {
    console.log('Testing registration endpoint...');
    
    const response = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
        role: 'admin'
      })
    });
    
    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('Response body:', text);
    
    if (response.headers.get('content-type')?.includes('application/json')) {
      try {
        const data = JSON.parse(text);
        console.log('Parsed JSON:', data);
      } catch (e) {
        console.log('Failed to parse JSON:', e.message);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testRegistration();
