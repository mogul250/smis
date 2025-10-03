const mysql = require('mysql2/promise');

// Database connection
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', // Update with your MySQL password
  database: 'smis_db'
};

async function addSampleCourses() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL database');

    // Sample courses data
    const sampleCourses = [
      {
        course_code: 'CS101',
        name: 'Introduction to Computer Science',
        description: 'Basic concepts of computer science and programming',
        credits: 3,
        semester: 'Fall 2024'
      },
      {
        course_code: 'MATH201',
        name: 'Calculus I',
        description: 'Differential and integral calculus',
        credits: 4,
        semester: 'Fall 2024'
      },
      {
        course_code: 'ENG101',
        name: 'English Composition',
        description: 'Academic writing and communication skills',
        credits: 3,
        semester: 'Spring 2024'
      },
      {
        course_code: 'PHYS101',
        name: 'General Physics I',
        description: 'Mechanics, waves, and thermodynamics',
        credits: 4,
        semester: 'Fall 2024'
      },
      {
        course_code: 'CS201',
        name: 'Data Structures',
        description: 'Arrays, linked lists, stacks, queues, trees',
        credits: 3,
        semester: 'Spring 2024'
      }
    ];

    // Insert sample courses
    for (const course of sampleCourses) {
      const query = `
        INSERT INTO courses (course_code, name, description, credits, semester, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        description = VALUES(description),
        credits = VALUES(credits),
        semester = VALUES(semester)
      `;
      
      const values = [
        course.course_code,
        course.name,
        course.description,
        course.credits,
        course.semester
      ];

      await connection.execute(query, values);
      console.log(`✅ Added/Updated course: ${course.course_code} - ${course.name}`);
    }

    console.log('\n🎉 Sample courses added successfully!');
    console.log('You can now test the course admin page at: http://localhost:3000/admin/courses');

  } catch (error) {
    console.error('❌ Error adding sample courses:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the script
addSampleCourses();
