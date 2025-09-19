import pool from '../../src/config/database.js';

class TestDatabaseManager {
  constructor() {
    this.testData = new Map();
    this.connection = null;
  }

  async connect() {
    try {
      // Use your existing database connection
      this.connection = pool;
      console.log('✅ Using your existing database connection for integration tests');
    } catch (error) {
      console.error('❌ Failed to connect to database:', error);
      throw error;
    }
  }

  async initializeSchema() {
    try {
      // Just verify connection - your schema should already be set up
      await this.connection.execute('SELECT 1');
      console.log('✅ Database connection verified - using your existing schema');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  async createTestUser(userData) {
    try {
      const { id, first_name, last_name, email, password_hash, role, department_id } = userData;
      const query = `
        INSERT INTO users (id, first_name, last_name, email, password_hash, role, department_id, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, true)
        ON DUPLICATE KEY UPDATE
        first_name = VALUES(first_name),
        last_name = VALUES(last_name),
        email = VALUES(email),
        password_hash = VALUES(password_hash),
        role = VALUES(role),
        department_id = VALUES(department_id),
        is_active = VALUES(is_active)
      `;
      await this.connection.execute(query, [id, first_name, last_name, email, password_hash, role, department_id]);

      this.testData.set(`user_${id}`, { type: 'user', id });
      console.log(`✅ Created/Updated test user: ${first_name} ${last_name}`);
      return id;
    } catch (error) {
      console.error('❌ Failed to create test user:', error);
      throw error;
    }
  }

  async createTestStudent(studentData) {
    try {
      const { id, first_name, last_name, email, password_hash, department_id, student_id } = studentData;
      const query = `
        INSERT INTO students (id, first_name, last_name, email, password_hash, department_id, student_id, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, true)
        ON DUPLICATE KEY UPDATE
        first_name = VALUES(first_name),
        last_name = VALUES(last_name),
        email = VALUES(email),
        password_hash = VALUES(password_hash),
        department_id = VALUES(department_id),
        student_id = VALUES(student_id),
        is_active = VALUES(is_active)
      `;
      await this.connection.execute(query, [id, first_name, last_name, email, password_hash, department_id, student_id]);

      this.testData.set(`student_${id}`, { type: 'student', id });
      console.log(`✅ Created/Updated test student: ${first_name} ${last_name}`);
      return id;
    } catch (error) {
      console.error('❌ Failed to create test student:', error);
      throw error;
    }
  }

  async createTestDepartment(deptData) {
    try {
      const { id, name, code, head_id } = deptData;
      const query = `
        INSERT INTO departments (id, name, code, head_id)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        code = VALUES(code),
        head_id = VALUES(head_id)
      `;
      await this.connection.execute(query, [id, name, code, head_id]);

      this.testData.set(`department_${id}`, { type: 'department', id });
      console.log(`✅ Created/Updated test department: ${name}`);
      return id;
    } catch (error) {
      console.error('❌ Failed to create test department:', error);
      throw error;
    }
  }

  async createTestCourse(courseData) {
    try {
      const { id, course_code, name, credits } = courseData;
      const query = `
        INSERT INTO courses (id, course_code, name, credits)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        course_code = VALUES(course_code),
        name = VALUES(name),
        credits = VALUES(credits)
      `;
      await this.connection.execute(query, [id, course_code, name, credits]);

      this.testData.set(`course_${id}`, { type: 'course', id });
      console.log(`✅ Created/Updated test course: ${name}`);
      return id;
    } catch (error) {
      console.error('❌ Failed to create test course:', error);
      throw error;
    }
  }

  async createTestFee(feeData) {
    try {
      const { id, student_id, amount, fee_type, due_date } = feeData;
      const query = `
        INSERT INTO fees (id, student_id, amount, fee_type, due_date, status)
        VALUES (?, ?, ?, ?, ?, 'unpaid')
        ON DUPLICATE KEY UPDATE
        student_id = VALUES(student_id),
        amount = VALUES(amount),
        fee_type = VALUES(fee_type),
        due_date = VALUES(due_date),
        status = VALUES(status)
      `;
      await this.connection.execute(query, [id, student_id, amount, fee_type, due_date]);

      this.testData.set(`fee_${id}`, { type: 'fee', id });
      console.log(`✅ Created/Updated test fee: ${fee_type} for student ${student_id}`);
      return id;
    } catch (error) {
      console.error('❌ Failed to create test fee:', error);
      throw error;
    }
  }

  async cleanupTestData() {
    try {
      // Only clean up test data we created, not existing production data
      console.log('🧹 Cleaning up test data...');

      // Clean up in reverse order to handle foreign key constraints
      const testIds = Array.from(this.testData.values());

      // Clean up fees
      const feeIds = testIds.filter(item => item.type === 'fee').map(item => item.id);
      if (feeIds.length > 0) {
        await this.connection.execute(`DELETE FROM fees WHERE id IN (${feeIds.map(() => '?').join(',')})`, feeIds);
      }

      // Clean up courses
      const courseIds = testIds.filter(item => item.type === 'course').map(item => item.id);
      if (courseIds.length > 0) {
        await this.connection.execute(`DELETE FROM courses WHERE id IN (${courseIds.map(() => '?').join(',')})`, courseIds);
      }

      // Clean up students
      const studentIds = testIds.filter(item => item.type === 'student').map(item => item.id);
      if (studentIds.length > 0) {
        await this.connection.execute(`DELETE FROM students WHERE id IN (${studentIds.map(() => '?').join(',')})`, studentIds);
      }

      // Clean up users
      const userIds = testIds.filter(item => item.type === 'user').map(item => item.id);
      if (userIds.length > 0) {
        await this.connection.execute(`DELETE FROM users WHERE id IN (${userIds.map(() => '?').join(',')})`, userIds);
      }

      // Clean up departments
      const deptIds = testIds.filter(item => item.type === 'department').map(item => item.id);
      if (deptIds.length > 0) {
        await this.connection.execute(`DELETE FROM departments WHERE id IN (${deptIds.map(() => '?').join(',')})`, deptIds);
      }

      console.log('✅ Test data cleanup completed');
    } catch (error) {
      console.error('❌ Failed to cleanup test data:', error);
      throw error;
    }
  }

  async disconnect() {
    // Don't disconnect from the main pool, just clear our test data tracking
    this.testData.clear();
    console.log('🔌 Test data tracking cleared');
  }

  // Utility method to get test data by type
  getTestData(type) {
    const results = [];
    for (const [key, value] of this.testData) {
      if (value.type === type) {
        results.push(value);
      }
    }
    return results;
  }
}

// Export singleton instance
export const testDb = new TestDatabaseManager();

// Test data fixtures with unique IDs to avoid conflicts
export const testFixtures = {
  departments: [
    { id: 9991, name: 'Test Computer Science', code: 'TCS', head_id: null },
    { id: 9992, name: 'Test Mathematics', code: 'TMATH', head_id: null }
  ],

  users: [
    { id: 9991, first_name: 'TestJohn', last_name: 'TestDoe', email: 'testjohn.doe@university.edu', password_hash: '$2b$10$hashedpassword', role: 'teacher', department_id: 9991 },
    { id: 9992, first_name: 'TestJane', last_name: 'TestSmith', email: 'testjane.smith@university.edu', password_hash: '$2b$10$hashedpassword', role: 'hod', department_id: 9991 },
    { id: 9993, first_name: 'TestBob', last_name: 'TestFinance', email: 'testbob.finance@university.edu', password_hash: '$2b$10$hashedpassword', role: 'finance', department_id: 9991 },
    { id: 9994, first_name: 'TestAlice', last_name: 'TestAdmin', email: 'testalice.admin@university.edu', password_hash: '$2b$10$hashedpassword', role: 'admin', department_id: 9991 }
  ],

  students: [
    { id: 9991, first_name: 'TestStudent', last_name: 'One', email: 'teststudent1@university.edu', password_hash: '$2b$10$hashedpassword', department_id: 9991, student_id: 'TSTU001' },
    { id: 9992, first_name: 'TestStudent', last_name: 'Two', email: 'teststudent2@university.edu', password_hash: '$2b$10$hashedpassword', department_id: 9991, student_id: 'TSTU002' }
  ],

  courses: [
    { id: 9991, course_code: 'TCS101', name: 'Test Introduction to Programming', credits: 3 },
    { id: 9992, course_code: 'TCS201', name: 'Test Data Structures', credits: 4 }
  ],

  fees: [
    { id: 9991, student_id: 9991, amount: 500.00, fee_type: 'tuition', due_date: '2024-12-31' },
    { id: 9992, student_id: 9992, amount: 100.00, fee_type: 'library', due_date: '2024-12-31' }
  ]
};

// Setup and teardown utilities for tests
export async function setupTestDatabase() {
  await testDb.connect();
  await testDb.initializeSchema();
}

export async function teardownTestDatabase() {
  await testDb.cleanupTestData();
  await testDb.disconnect();
}

export async function loadTestFixtures() {
  // Load departments first
  for (const dept of testFixtures.departments) {
    await testDb.createTestDepartment(dept);
  }

  // Load users
  for (const user of testFixtures.users) {
    await testDb.createTestUser(user);
  }

  // Load students
  for (const student of testFixtures.students) {
    await testDb.createTestStudent(student);
  }

  // Load courses
  for (const course of testFixtures.courses) {
    await testDb.createTestCourse(course);
  }

  // Load fees
  for (const fee of testFixtures.fees) {
    await testDb.createTestFee(fee);
  }

  console.log('✅ All test fixtures loaded');
}
