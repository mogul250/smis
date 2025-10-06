// Comprehensive HOD functionality test following the testing rule methodology
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api';
const FRONTEND_BASE = 'http://localhost:3000';

// Test credentials from the backend test
const HOD_CREDENTIALS = {
  email: 'hod@test.com',
  password: 'password123'
};

class HODFunctionalityTester {
  constructor() {
    this.token = null;
    this.hodProfile = null;
  }

  async testBackendHealth() {
    console.log('\n🔍 Phase 1: Environment Verification');
    console.log('1. Testing backend health...');
    
    try {
      const response = await fetch(`${API_BASE}/health`);
      if (response.ok) {
        const health = await response.json();
        console.log('✅ Backend is running:', health.message);
        return true;
      } else {
        console.log('❌ Backend health check failed');
        return false;
      }
    } catch (error) {
      console.log('❌ Backend connection failed:', error.message);
      return false;
    }
  }

  async testFrontendHealth() {
    console.log('2. Testing frontend availability...');
    
    try {
      const response = await fetch(FRONTEND_BASE);
      if (response.ok) {
        console.log('✅ Frontend is accessible');
        return true;
      } else {
        console.log('❌ Frontend not accessible');
        return false;
      }
    } catch (error) {
      console.log('❌ Frontend connection failed:', error.message);
      return false;
    }
  }

  async authenticateHOD() {
    console.log('\n🔐 Phase 2: Authentication Testing');
    console.log('1. Attempting HOD login...');
    
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(HOD_CREDENTIALS)
      });

      if (!response.ok) {
        const error = await response.text();
        console.log('❌ HOD login failed:', error);
        return false;
      }

      const loginData = await response.json();
      this.token = loginData.token;
      console.log('✅ HOD login successful:', loginData.user);
      return true;
    } catch (error) {
      console.log('❌ HOD authentication failed:', error.message);
      return false;
    }
  }

  async testHODProfile() {
    console.log('\n👤 Phase 3: Profile Management Testing');
    console.log('1. Testing HOD profile retrieval...');
    
    try {
      const response = await fetch(`${API_BASE}/hod/profile`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (response.ok) {
        this.hodProfile = await response.json();
        console.log('✅ HOD profile retrieved successfully');
        console.log('   - Name:', `${this.hodProfile.user.first_name} ${this.hodProfile.user.last_name}`);
        console.log('   - Department:', this.hodProfile.department.name);
        console.log('   - Department Code:', this.hodProfile.department.code);
        return true;
      } else {
        const error = await response.text();
        console.log('❌ HOD profile retrieval failed:', error);
        return false;
      }
    } catch (error) {
      console.log('❌ HOD profile test failed:', error.message);
      return false;
    }
  }

  async testDepartmentTeachers() {
    console.log('\n👥 Phase 4: Department Management Testing');
    console.log('1. Testing department teachers retrieval...');
    
    try {
      const response = await fetch(`${API_BASE}/hod/teachers`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (response.ok) {
        const teachers = await response.json();
        console.log('✅ Department teachers retrieved successfully');
        console.log(`   - Total teachers: ${teachers.length}`);
        
        if (teachers.length > 0) {
          console.log('   - Sample teacher:', teachers[0].first_name, teachers[0].last_name);
        }
        return { success: true, data: teachers };
      } else {
        const error = await response.text();
        console.log('❌ Department teachers retrieval failed:', error);
        return { success: false, error };
      }
    } catch (error) {
      console.log('❌ Department teachers test failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async testDepartmentCourses() {
    console.log('2. Testing department courses retrieval...');
    
    try {
      const response = await fetch(`${API_BASE}/hod/courses`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (response.ok) {
        const courses = await response.json();
        console.log('✅ Department courses retrieved successfully');
        console.log(`   - Total courses: ${courses.length}`);
        
        if (courses.length > 0) {
          console.log('   - Sample course:', courses[0].course_code, '-', courses[0].name);
        }
        return { success: true, data: courses };
      } else {
        const error = await response.text();
        console.log('❌ Department courses retrieval failed:', error);
        return { success: false, error };
      }
    } catch (error) {
      console.log('❌ Department courses test failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async testDepartmentStats() {
    console.log('\n📊 Phase 5: Statistics and Reporting Testing');
    console.log('1. Testing department statistics...');
    
    try {
      const response = await fetch(`${API_BASE}/hod/stats`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (response.ok) {
        const stats = await response.json();
        console.log('✅ Department statistics retrieved successfully');
        console.log('   - Attendance records:', stats.attendance?.total_records || 0);
        console.log('   - Average attendance:', stats.attendance?.avg_attendance_percentage || 0, '%');
        console.log('   - Total courses:', stats.courses || 0);
        console.log('   - Total teachers:', stats.teachers || 0);
        return { success: true, data: stats };
      } else {
        const error = await response.text();
        console.log('❌ Department statistics retrieval failed:', error);
        return { success: false, error };
      }
    } catch (error) {
      console.log('❌ Department statistics test failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async testDepartmentTimetable() {
    console.log('2. Testing department timetable...');
    
    try {
      const response = await fetch(`${API_BASE}/hod/timetable`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (response.ok) {
        const timetable = await response.json();
        console.log('✅ Department timetable retrieved successfully');
        console.log(`   - Total timetable entries: ${timetable.length}`);
        
        if (timetable.length > 0) {
          console.log('   - Sample entry:', timetable[0].course_name, '-', timetable[0].teacher_name);
        }
        return { success: true, data: timetable };
      } else {
        const error = await response.text();
        console.log('❌ Department timetable retrieval failed:', error);
        return { success: false, error };
      }
    } catch (error) {
      console.log('❌ Department timetable test failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async runComprehensiveTest() {
    console.log('🚀 Starting Comprehensive HOD Functionality Test');
    console.log('Following the "Navigate, Test, Monitor, Fix, Verify" methodology');
    console.log('=' * 60);

    const results = {
      backendHealth: false,
      frontendHealth: false,
      authentication: false,
      profile: false,
      teachers: false,
      courses: false,
      stats: false,
      timetable: false
    };

    // Phase 1: Environment Verification
    results.backendHealth = await this.testBackendHealth();
    if (!results.backendHealth) {
      console.log('\n❌ Backend not available. Cannot proceed with tests.');
      return results;
    }

    results.frontendHealth = await this.testFrontendHealth();
    
    // Phase 2: Authentication
    results.authentication = await this.authenticateHOD();
    if (!results.authentication) {
      console.log('\n❌ Authentication failed. Cannot proceed with authenticated tests.');
      return results;
    }

    // Phase 3: Profile Management
    results.profile = await this.testHODProfile();

    // Phase 4: Department Management
    const teachersResult = await this.testDepartmentTeachers();
    results.teachers = teachersResult.success;

    const coursesResult = await this.testDepartmentCourses();
    results.courses = coursesResult.success;

    // Phase 5: Statistics and Reporting
    const statsResult = await this.testDepartmentStats();
    results.stats = statsResult.success;

    const timetableResult = await this.testDepartmentTimetable();
    results.timetable = timetableResult.success;

    // Summary
    this.printTestSummary(results);
    
    return results;
  }

  printTestSummary(results) {
    console.log('\n' + '=' * 60);
    console.log('📋 TEST SUMMARY');
    console.log('=' * 60);
    
    const tests = [
      { name: 'Backend Health', result: results.backendHealth },
      { name: 'Frontend Health', result: results.frontendHealth },
      { name: 'HOD Authentication', result: results.authentication },
      { name: 'HOD Profile', result: results.profile },
      { name: 'Department Teachers', result: results.teachers },
      { name: 'Department Courses', result: results.courses },
      { name: 'Department Statistics', result: results.stats },
      { name: 'Department Timetable', result: results.timetable }
    ];

    let passed = 0;
    let total = tests.length;

    tests.forEach(test => {
      const status = test.result ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} - ${test.name}`);
      if (test.result) passed++;
    });

    console.log('\n' + '-' * 40);
    console.log(`OVERALL RESULT: ${passed}/${total} tests passed`);
    
    if (passed === total) {
      console.log('🎉 All HOD functionality tests PASSED!');
    } else {
      console.log('⚠️  Some HOD functionality tests FAILED. Review the issues above.');
    }
    
    console.log('\n📝 Next Steps:');
    if (!results.frontendHealth) {
      console.log('- Start the frontend server: cd frontend && npm run dev');
    }
    if (results.authentication && results.profile) {
      console.log('- HOD backend functionality is working correctly');
      console.log('- Ready for frontend integration testing');
    }
    console.log('- Use browser automation to test frontend HOD features');
  }
}

// Run the comprehensive test
async function runHODTests() {
  const tester = new HODFunctionalityTester();
  await tester.runComprehensiveTest();
}

runHODTests().catch(console.error);
