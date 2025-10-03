// Use built-in fetch (Node.js 18+) or create a simple HTTP client
const https = require('https');
const http = require('http');
const { URL } = require('url');

function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          json: () => Promise.resolve(JSON.parse(data)),
          text: () => Promise.resolve(data)
        });
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

async function testAdminEndpoints() {
  try {
    // First login to get admin token
    console.log('🔑 Getting admin token...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@smis.com',
        password: 'admin123'
      })
    });
    
    if (loginResponse.status !== 200) {
      console.error('❌ Failed to login as admin');
      return;
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Admin token obtained');
    
    // Test admin endpoints
    const endpoints = [
      // User management
      { method: 'GET', path: '/admin/users', description: 'Get all users' },
      { method: 'GET', path: '/admin/users/0/10', description: 'Get users with pagination' },
      { method: 'GET', path: '/admin/users/by-id/9', description: 'Get user by ID' },
      
      // Department management
      { method: 'GET', path: '/admin/departments', description: 'Get all departments' },
      
      // Student management
      { method: 'GET', path: '/admin/students', description: 'Get all students' },
      
      // Statistics
      { method: 'GET', path: '/admin/stats', description: 'Get admin statistics' },
      
      // Timetable
      { method: 'GET', path: '/admin/timetable', description: 'Get timetable' },
      
      // System endpoints
      { method: 'GET', path: '/admin/dashboard', description: 'Get dashboard data' },
      { method: 'GET', path: '/admin/reports', description: 'Get reports' },
      
      // User creation
      { method: 'POST', path: '/admin/users', description: 'Create new user', data: {
        email: 'test.new@example.com',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
        role: 'teacher'
      }},
      
      // Department creation
      { method: 'POST', path: '/admin/departments', description: 'Create department', data: {
        name: 'Test Department',
        code: 'TEST',
        description: 'Test department for API testing'
      }}
    ];
    
    console.log('\n🧪 Testing admin endpoints...\n');
    
    const results = [];
    
    for (const endpoint of endpoints) {
      try {
        const options = {
          method: endpoint.method,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        };
        
        if (endpoint.data) {
          options.body = JSON.stringify(endpoint.data);
        }
        
        const response = await fetch(`http://localhost:5000/api${endpoint.path}`, options);
        const status = response.status;
        
        let responseText = '';
        try {
          responseText = await response.text();
        } catch (e) {
          responseText = 'Could not read response';
        }
        
        const result = {
          endpoint: `${endpoint.method} ${endpoint.path}`,
          description: endpoint.description,
          status,
          working: status >= 200 && status < 300,
          response: responseText.length > 200 ? responseText.substring(0, 200) + '...' : responseText
        };
        
        results.push(result);
        
        const statusIcon = result.working ? '✅' : '❌';
        console.log(`${statusIcon} ${endpoint.method} ${endpoint.path} - ${status} - ${endpoint.description}`);
        
        if (!result.working && responseText) {
          console.log(`   Response: ${responseText.substring(0, 100)}${responseText.length > 100 ? '...' : ''}`);
        }
        
      } catch (error) {
        console.log(`❌ ${endpoint.method} ${endpoint.path} - ERROR - ${error.message}`);
        results.push({
          endpoint: `${endpoint.method} ${endpoint.path}`,
          description: endpoint.description,
          status: 'ERROR',
          working: false,
          response: error.message
        });
      }
    }
    
    // Summary
    console.log('\n📊 SUMMARY:');
    const working = results.filter(r => r.working).length;
    const total = results.length;
    console.log(`✅ Working endpoints: ${working}/${total}`);
    console.log(`❌ Failed endpoints: ${total - working}/${total}`);
    
    console.log('\n📋 WORKING ENDPOINTS:');
    results.filter(r => r.working).forEach(r => {
      console.log(`  ✅ ${r.endpoint} - ${r.description}`);
    });
    
    console.log('\n🚨 FAILED ENDPOINTS:');
    results.filter(r => !r.working).forEach(r => {
      console.log(`  ❌ ${r.endpoint} - ${r.description} (${r.status})`);
    });
    
    return results;
    
  } catch (error) {
    console.error('❌ Error testing admin endpoints:', error.message);
  }
}

testAdminEndpoints();
