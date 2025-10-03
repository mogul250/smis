import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function testCourses() {
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
      user: process.env.DB_USER || 'root',
      password: 'Nike14##',
      database: process.env.DB_NAME || 'smis'
    });

    console.log('Connected successfully!');

    // Check if courses table exists
    console.log('\n1. Checking if courses table exists...');
    const [tables] = await connection.execute("SHOW TABLES LIKE 'courses'");
    console.log('Courses table exists:', tables.length > 0);

    // Check current courses
    console.log('\n2. Checking existing courses...');
    const [courses] = await connection.execute('SELECT * FROM courses');
    console.log('Number of courses:', courses.length);
    console.log('Courses:', courses);

    // If no courses, create some sample courses
    if (courses.length === 0) {
      console.log('\n3. Creating sample courses...');
      
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
          semester: 'Fall 2024'
        },
        {
          course_code: 'PHYS101',
          name: 'General Physics I',
          description: 'Mechanics and thermodynamics',
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

      for (const course of sampleCourses) {
        await connection.execute(
          'INSERT INTO courses (course_code, name, description, credits, semester) VALUES (?, ?, ?, ?, ?)',
          [course.course_code, course.name, course.description, course.credits, course.semester]
        );
        console.log(`Created course: ${course.course_code} - ${course.name}`);
      }

      console.log('\nSample courses created successfully!');
    }

    // Test the getAllCourses query
    console.log('\n4. Testing getAllCourses query...');
    const query = `
      SELECT c.id, c.course_code, c.name, c.description, c.credits, c.semester,
             c.created_at,
             NULL as year, NULL as prerequisites, NULL as department_id, NULL as updated_at,
             NULL as department_name, NULL as department_code
      FROM courses c
      WHERE 1=1
      ORDER BY c.course_code ASC LIMIT 0, 10
    `;

    const [result] = await connection.execute(query);
    console.log('Query result:', result);
    console.log('Number of courses returned:', result.length);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nConnection closed.');
    }
  }
}

testCourses();
