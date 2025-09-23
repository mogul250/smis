import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function seedStudentData() {
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

    // Get or create test department
    console.log('Getting department...');
    let deptId;
    const [deptRows] = await connection.execute('SELECT id FROM departments WHERE code = ?', ['CS']);
    if (deptRows.length > 0) {
      deptId = deptRows[0].id;
      console.log('Using existing department ID:', deptId);
    } else {
      const [deptResult] = await connection.execute(
        'INSERT INTO departments (code, name) VALUES (?, ?)',
        ['CS', 'Computer Science']
      );
      deptId = deptResult.insertId;
      console.log('Created new department ID:', deptId);
    }

    // Create test students
    console.log('Creating test students...');
    const students = [
      {
        first_name: 'John',
        last_name: 'Student',
        email: 'student@test.com',
        student_id: 'STU001',
        enrollment_year: 2024,
        current_year: 1
      },
      {
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane.student@test.com',
        student_id: 'STU002',
        enrollment_year: 2023,
        current_year: 2
      },
      {
        first_name: 'Mike',
        last_name: 'Wilson',
        email: 'mike.student@test.com',
        student_id: 'STU003',
        enrollment_year: 2022,
        current_year: 3
      }
    ];

    const studentPassword = await bcrypt.hash('password123', 10);
    
    for (const student of students) {
      try {
        await connection.execute(
          `INSERT IGNORE INTO students (
            first_name, last_name, email, password_hash, role, department_id, 
            student_id, enrollment_year, current_year, enrollment_date, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            student.first_name, 
            student.last_name, 
            student.email, 
            studentPassword, 
            'student', 
            deptId,
            student.student_id,
            student.enrollment_year,
            student.current_year,
            new Date().toISOString().split('T')[0], // Today's date
            'active'
          ]
        );
        console.log(`✅ Created student: ${student.first_name} ${student.last_name} (${student.email})`);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`⚠️  Student already exists: ${student.email}`);
        } else {
          console.error(`❌ Error creating student ${student.email}:`, error.message);
        }
      }
    }

    console.log('\n✅ Student data seeded successfully!');
    console.log('\nTest student credentials:');
    console.log('Primary: student@test.com / password123');
    console.log('Others: jane.student@test.com, mike.student@test.com / password123');
    console.log('\nYou can now test student login at: http://localhost:3000/login');

  } catch (error) {
    console.error('❌ Error seeding student data:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

seedStudentData();
