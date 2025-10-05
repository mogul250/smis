import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function seedTestData() {
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
      user: process.env.DB_USER || 'root',
      password: 'Nike14##',
      database: process.env.DB_NAME || 'smis',
    });

    console.log('Connected successfully!');

    // Check and add missing columns if needed
    console.log('Checking database schema...');
    try {
      await connection.execute('ALTER TABLE courses ADD COLUMN department_id INT');
      await connection.execute('ALTER TABLE courses ADD FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL');
      console.log('Added missing department_id column to courses table');
    } catch (error) {
      // Column might already exist, that's okay
      console.log('Courses table schema is up to date');
    }

    // Create test department
    console.log('Creating test department...');
    const [deptResult] = await connection.execute(
      'INSERT IGNORE INTO departments (code, name) VALUES (?, ?)',
      ['CS', 'Computer Science']
    );
    
    let deptId;
    if (deptResult.insertId) {
      deptId = deptResult.insertId;
    } else {
      const [deptRows] = await connection.execute('SELECT id FROM departments WHERE code = ?', ['CS']);
      deptId = deptRows[0]?.id;
    }

    console.log('Department ID:', deptId);

    // Create test HOD user
    console.log('Creating test HOD user...');
    const hodPassword = await bcrypt.hash('password123', 10);
    
    const [hodResult] = await connection.execute(
      `INSERT IGNORE INTO users (
        first_name, last_name, email, password_hash, role, department_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['John', 'Doe', 'hod@test.com', hodPassword, 'hod', deptId, 'active']
    );

    let hodId;
    if (hodResult.insertId) {
      hodId = hodResult.insertId;
    } else {
      const [hodRows] = await connection.execute('SELECT id FROM users WHERE email = ?', ['hod@test.com']);
      hodId = hodRows[0]?.id;
    }

    // Update department head
    await connection.execute('UPDATE departments SET head_id = ? WHERE id = ?', [hodId, deptId]);

    // Create test teachers
    console.log('Creating test teachers...');
    const teachers = [
      ['Alice', 'Smith', 'alice.smith@test.com'],
      ['Bob', 'Johnson', 'bob.johnson@test.com'],
      ['Carol', 'Williams', 'carol.williams@test.com']
    ];

    const teacherPassword = await bcrypt.hash('password123', 10);
    
    for (const [firstName, lastName, email] of teachers) {
      await connection.execute(
        `INSERT IGNORE INTO users (
          first_name, last_name, email, password_hash, role, department_id, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [firstName, lastName, email, teacherPassword, 'teacher', deptId, 'active']
      );
    }

    // Create test courses
    console.log('Creating test courses...');
    const courses = [
      ['CS101', 'Introduction to Programming', 'Basic programming concepts', 3],
      ['CS201', 'Data Structures', 'Data structures and algorithms', 4],
      ['CS301', 'Database Systems', 'Database design and management', 3],
      ['CS401', 'Software Engineering', 'Software development lifecycle', 4]
    ];

    for (const [code, name, description, credits] of courses) {
      await connection.execute(
        `INSERT IGNORE INTO courses (
          course_code, name, description, credits, department_id
        ) VALUES (?, ?, ?, ?, ?)`,
        [code, name, description, credits, deptId]
      );
    }

    // Create test class
    console.log('Creating test class...');
    await connection.execute(
      `INSERT IGNORE INTO classes (
        academic_year, start_date, end_date, students, created_by
      ) VALUES (?, ?, ?, ?, ?)`,
      ['2024-2025', '2024-09-01', '2025-06-30', JSON.stringify([]), hodId]
    );

    // Get course and teacher IDs for timetable
    const [courseRows] = await connection.execute('SELECT id, course_code FROM courses WHERE department_id = ?', [deptId]);
    const [teacherRows] = await connection.execute('SELECT id, first_name, last_name FROM users WHERE role = ? AND department_id = ?', ['teacher', deptId]);
    const [classRows] = await connection.execute('SELECT id FROM classes WHERE created_by = ?', [hodId]);

    if (courseRows.length > 0 && teacherRows.length > 0 && classRows.length > 0) {
      console.log('Creating test timetable entries...');
      const classId = classRows[0].id;
      
      // Create some timetable entries
      const timetableEntries = [
        [courseRows[0].id, teacherRows[0].id, classId, 1, '09:00:00', '10:30:00'], // Monday
        [courseRows[1].id, teacherRows[1].id, classId, 2, '11:00:00', '12:30:00'], // Tuesday
        [courseRows[2].id, teacherRows[2].id, classId, 3, '14:00:00', '15:30:00'], // Wednesday
        [courseRows[0].id, teacherRows[0].id, classId, 4, '10:00:00', '11:30:00'], // Thursday
      ];

      for (const [courseId, teacherId, clsId, dayOfWeek, startTime, endTime] of timetableEntries) {
        await connection.execute(
          `INSERT IGNORE INTO timetable (
            course_id, teacher_id, class_id, day_of_week, start_time, end_time, semester, academic_year
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [courseId, teacherId, clsId, dayOfWeek, startTime, endTime, 'Fall 2024', '2024-2025']
        );
      }
    }

    console.log('✅ Test data seeded successfully!');
    console.log('\nTest credentials:');
    console.log('HOD: hod@test.com / password123');
    console.log('Teachers: alice.smith@test.com, bob.johnson@test.com, carol.williams@test.com / password123');

  } catch (error) {
    console.error('❌ Error seeding test data:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

seedTestData();
