import pool from './src/config/database.js';

async function debugDatabase() {
  try {
    console.log('Testing database connection...');
    
    // Test connection
    const connection = await pool.getConnection();
    console.log('✓ Database connected successfully');
    
    // Check if tables exist
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('Available tables:');
    tables.forEach(table => {
      console.log('-', Object.values(table)[0]);
    });
    
    // Check if attendance table exists and its structure
    try {
      const [attendanceStructure] = await connection.execute('DESCRIBE attendance');
      console.log('\nAttendance table structure:');
      attendanceStructure.forEach(col => {
        console.log(`- ${col.Field}: ${col.Type}`);
      });
    } catch (error) {
      console.log('\n❌ Attendance table does not exist:', error.message);
    }
    
    // Check if courses table exists
    try {
      const [coursesStructure] = await connection.execute('DESCRIBE courses');
      console.log('\nCourses table structure:');
      coursesStructure.forEach(col => {
        console.log(`- ${col.Field}: ${col.Type}`);
      });
    } catch (error) {
      console.log('\n❌ Courses table does not exist:', error.message);
    }
    
    // Check if users table exists
    try {
      const [usersStructure] = await connection.execute('DESCRIBE users');
      console.log('\nUsers table structure:');
      usersStructure.forEach(col => {
        console.log(`- ${col.Field}: ${col.Type}`);
      });
    } catch (error) {
      console.log('\n❌ Users table does not exist:', error.message);
    }
    
    // Check if students table exists
    try {
      const [studentsStructure] = await connection.execute('DESCRIBE students');
      console.log('\nStudents table structure:');
      studentsStructure.forEach(col => {
        console.log(`- ${col.Field}: ${col.Type}`);
      });
    } catch (error) {
      console.log('\n❌ Students table does not exist:', error.message);
    }
    
    connection.release();
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
  
  process.exit(0);
}

debugDatabase();
