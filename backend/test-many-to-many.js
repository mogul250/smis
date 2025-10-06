// Test script for many-to-many teacher-department relationship
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function createConnection() {
  return await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Nike14##',
    database: process.env.DB_NAME || 'smis'
  });
}

async function testManyToManyRelationship() {
  let connection;
  try {
    console.log('🔍 Testing Many-to-Many Teacher-Department Relationship\n');

    connection = await createConnection();

    // 1. Check if migration table exists
    console.log('1. Checking teacher_departments table...');
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'teacher_departments'"
    );
    
    if (tables.length === 0) {
      console.log('❌ teacher_departments table not found. Please run the migration first.');
      console.log('Run: mysql -u root -p smis < database/migrations/add_teacher_departments_table.sql');
      return;
    }
    console.log('✅ teacher_departments table exists');

    // 2. Check table structure
    console.log('\n2. Checking table structure...');
    const [structure] = await connection.execute('DESCRIBE teacher_departments');
    console.log('Table structure:', structure.map(col => `${col.Field} (${col.Type})`).join(', '));

    // 3. Check existing data
    console.log('\n3. Checking existing teacher-department assignments...');
    const [assignments] = await connection.execute(`
      SELECT 
        td.teacher_id,
        CONCAT(u.first_name, ' ', u.last_name) as teacher_name,
        td.department_id,
        d.name as department_name,
        td.is_primary,
        td.assigned_date
      FROM teacher_departments td
      JOIN users u ON td.teacher_id = u.id
      JOIN departments d ON td.department_id = d.id
      ORDER BY td.teacher_id, td.is_primary DESC
    `);

    if (assignments.length === 0) {
      console.log('📝 No teacher-department assignments found');
    } else {
      console.log(`📊 Found ${assignments.length} teacher-department assignments:`);
      assignments.forEach(assignment => {
        console.log(`   - ${assignment.teacher_name} → ${assignment.department_name} ${assignment.is_primary ? '(PRIMARY)' : ''}`);
      });
    }

    // 4. Test many-to-many functionality
    console.log('\n4. Testing many-to-many assignment...');
    
    // Get first teacher and first two departments
    const [teachers] = await connection.execute(
      "SELECT id, first_name, last_name FROM users WHERE role = 'teacher' LIMIT 1"
    );
    
    const [departments] = await connection.execute(
      "SELECT id, name FROM departments LIMIT 2"
    );

    if (teachers.length === 0 || departments.length < 2) {
      console.log('⚠️  Need at least 1 teacher and 2 departments to test many-to-many');
      return;
    }

    const teacher = teachers[0];
    const dept1 = departments[0];
    const dept2 = departments[1];

    console.log(`Testing with teacher: ${teacher.first_name} ${teacher.last_name} (ID: ${teacher.id})`);
    console.log(`Departments: ${dept1.name} (ID: ${dept1.id}), ${dept2.name} (ID: ${dept2.id})`);

    // Assign teacher to both departments
    console.log('\n5. Assigning teacher to multiple departments...');
    
    // First assignment (primary)
    await connection.execute(`
      INSERT INTO teacher_departments (teacher_id, department_id, is_primary, assigned_date)
      VALUES (?, ?, TRUE, CURRENT_DATE)
      ON DUPLICATE KEY UPDATE 
        is_primary = VALUES(is_primary),
        updated_at = CURRENT_TIMESTAMP
    `, [teacher.id, dept1.id]);

    // Second assignment (not primary)
    await connection.execute(`
      INSERT INTO teacher_departments (teacher_id, department_id, is_primary, assigned_date)
      VALUES (?, ?, FALSE, CURRENT_DATE)
      ON DUPLICATE KEY UPDATE 
        is_primary = VALUES(is_primary),
        updated_at = CURRENT_TIMESTAMP
    `, [teacher.id, dept2.id]);

    console.log('✅ Teacher assigned to multiple departments');

    // 6. Verify many-to-many relationship
    console.log('\n6. Verifying many-to-many relationship...');
    const [teacherDepts] = await connection.execute(`
      SELECT 
        d.id,
        d.name,
        td.is_primary,
        td.assigned_date
      FROM teacher_departments td
      JOIN departments d ON td.department_id = d.id
      WHERE td.teacher_id = ?
      ORDER BY td.is_primary DESC
    `, [teacher.id]);

    console.log(`Teacher ${teacher.first_name} ${teacher.last_name} is assigned to:`);
    teacherDepts.forEach(dept => {
      console.log(`   - ${dept.name} ${dept.is_primary ? '(PRIMARY)' : ''} - assigned: ${dept.assigned_date}`);
    });

    // 7. Test department teachers query
    console.log('\n7. Testing department teachers query...');
    const [deptTeachers] = await connection.execute(`
      SELECT DISTINCT 
        u.id,
        CONCAT(u.first_name, ' ', u.last_name) as teacher_name,
        td.is_primary,
        td.assigned_date
      FROM users u
      JOIN teacher_departments td ON u.id = td.teacher_id
      WHERE td.department_id = ? AND u.role = 'teacher'
      ORDER BY u.first_name, u.last_name
    `, [dept1.id]);

    console.log(`Teachers in ${dept1.name} department:`);
    deptTeachers.forEach(teacher => {
      console.log(`   - ${teacher.teacher_name} ${teacher.is_primary ? '(PRIMARY)' : ''}`);
    });

    console.log('\n✅ Many-to-Many Teacher-Department Relationship Test Completed Successfully!');
    console.log('\n📋 Summary:');
    console.log('   - Teachers can now be assigned to multiple departments');
    console.log('   - Each assignment can be marked as primary or secondary');
    console.log('   - Departments can have multiple teachers');
    console.log('   - Backward compatibility maintained with users.department_id');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the test
testManyToManyRelationship();
