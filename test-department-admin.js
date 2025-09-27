// Test script to verify department admin functionality
// This can be run to test the department management endpoints

const testDepartmentAPI = async () => {
  const baseURL = 'http://localhost:5000/api';
  
  console.log('🧪 Testing Department Admin API Endpoints...\n');
  
  // Test data
  const testDepartment = {
    name: 'Test Computer Science',
    code: 'TCS',
    description: 'Test department for computer science',
    head_id: null
  };
  
  try {
    // 1. Test Create Department
    console.log('1️⃣ Testing Create Department...');
    const createResponse = await fetch(`${baseURL}/admin/departments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE'
      },
      body: JSON.stringify(testDepartment)
    });
    
    if (createResponse.ok) {
      const createResult = await createResponse.json();
      console.log('✅ Create Department: SUCCESS', createResult);
      
      const departmentId = createResult.departmentId;
      
      // 2. Test Get All Departments
      console.log('\n2️⃣ Testing Get All Departments...');
      const getResponse = await fetch(`${baseURL}/admin/departments/0/10`, {
        headers: {
          'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE'
        }
      });
      
      if (getResponse.ok) {
        const departments = await getResponse.json();
        console.log('✅ Get Departments: SUCCESS', `Found ${departments.length} departments`);
      } else {
        console.log('❌ Get Departments: FAILED', await getResponse.text());
      }
      
      // 3. Test Update Department
      console.log('\n3️⃣ Testing Update Department...');
      const updateData = {
        ...testDepartment,
        name: 'Updated Computer Science',
        description: 'Updated description'
      };
      
      const updateResponse = await fetch(`${baseURL}/admin/departments/${departmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE'
        },
        body: JSON.stringify(updateData)
      });
      
      if (updateResponse.ok) {
        const updateResult = await updateResponse.json();
        console.log('✅ Update Department: SUCCESS', updateResult);
      } else {
        console.log('❌ Update Department: FAILED', await updateResponse.text());
      }
      
      // 4. Test Delete Department
      console.log('\n4️⃣ Testing Delete Department...');
      const deleteResponse = await fetch(`${baseURL}/admin/departments/${departmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE'
        }
      });
      
      if (deleteResponse.ok) {
        const deleteResult = await deleteResponse.json();
        console.log('✅ Delete Department: SUCCESS', deleteResult);
      } else {
        console.log('❌ Delete Department: FAILED', await deleteResponse.text());
      }
      
    } else {
      console.log('❌ Create Department: FAILED', await createResponse.text());
    }
    
  } catch (error) {
    console.error('🚨 Test Error:', error.message);
  }
  
  console.log('\n🏁 Department API Tests Complete!');
};

// Instructions for running this test
console.log(`
📋 INSTRUCTIONS:
1. Start your backend server (npm run dev)
2. Replace 'YOUR_ADMIN_TOKEN_HERE' with a valid admin JWT token
3. Run this script: node test-department-admin.js
4. Check the console output for test results

🔑 To get an admin token:
1. Login as admin via POST /api/auth/login
2. Copy the token from the response
3. Replace 'YOUR_ADMIN_TOKEN_HERE' with the actual token
`);

// Uncomment the line below to run the tests
// testDepartmentAPI();
