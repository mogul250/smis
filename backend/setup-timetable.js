import pool from './src/config/database.js';
import fs from 'fs';

async function setupTimetableData() {
  try {
    console.log('🚀 Setting up SMIS timetable data based on actual database schema...');
    
    // Read the SQL file
    const sqlFile = fs.readFileSync('./setup-timetable-data.sql', 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sqlFile.split(';').filter(stmt => stmt.trim().length > 0 && !stmt.trim().startsWith('SELECT'));
    
    for (const statement of statements) {
      if (statement.trim() && !statement.trim().startsWith('--')) {
        try {
          await pool.execute(statement);
          const preview = statement.trim().substring(0, 60).replace(/\s+/g, ' ');
          console.log('✓ Executed:', preview + '...');
        } catch (error) {
          if (!error.message.includes('Duplicate entry') && !error.message.includes('already exists')) {
            console.log('⚠ Warning:', error.message);
          }
        }
      }
    }
    
    console.log('\n✅ Database setup completed!');
    
    // Test the student timetable query (the actual query used by the application)
    console.log('\n📋 Testing student timetable query for student ID 1...');
    
    try {
      const [rows] = await pool.execute(`
        SELECT 
          t.id,
          t.day_of_week,
          t.start_time,
          t.end_time,
          t.semester,
          t.academic_year,
          c.course_code,
          c.name as course_name,
          CONCAT(u.first_name, ' ', u.last_name) as teacher_name,
          cl.name as class_name
        FROM course_enrollments ce
        JOIN courses c ON ce.course_id = c.id
        JOIN timetable t ON t.course_id = c.id
        LEFT JOIN users u ON t.teacher_id = u.id
        LEFT JOIN classes cl ON t.class_id = cl.id
        WHERE ce.student_id = 1 
          AND ce.status = 'enrolled'
        ORDER BY t.day_of_week, t.start_time
      `);
      
      console.log(`\n📅 Found ${rows.length} timetable entries for student:`);
      
      if (rows.length > 0) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        rows.forEach(row => {
          console.log(`  ${days[row.day_of_week]} ${row.start_time.substring(0,5)}-${row.end_time.substring(0,5)}: ${row.course_code} - ${row.course_name} (${row.teacher_name})`);
        });
        
        console.log('\n🎉 SUCCESS: Real timetable data is now available!');
        console.log('   Your frontend should now display real data instead of sample data.');
      } else {
        console.log('⚠ No timetable entries found. Check if data was inserted correctly.');
      }
      
    } catch (queryError) {
      console.error('❌ Error testing timetable query:', queryError.message);
    }
    
    // Also test basic table existence
    console.log('\n🔍 Checking database tables...');
    const tables = ['departments', 'users', 'students', 'courses', 'classes', 'course_enrollments', 'timetable'];
    
    for (const table of tables) {
      try {
        const [result] = await pool.execute(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`  ✓ ${table}: ${result[0].count} records`);
      } catch (error) {
        console.log(`  ❌ ${table}: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error setting up timetable data:', error);
  } finally {
    await pool.end();
    console.log('\n🔚 Database connection closed.');
  }
}

setupTimetableData();
