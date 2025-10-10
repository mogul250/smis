import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Nike14##',
  database: 'smis'
};

async function addSampleTimetables() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL database');

    // Get course and class IDs
    const [courses] = await connection.execute('SELECT id, course_code FROM courses');
    const [classes] = await connection.execute('SELECT id, name FROM classes');
    const [teachers] = await connection.execute('SELECT id, first_name, last_name, role FROM users WHERE role = "teacher"');

    console.log('Found courses:', courses.length);
    console.log('Found classes:', classes.length);
    console.log('Found teachers:', teachers.length);

    // Create sample timetable entries
    const timetableEntries = [
      // Monday
      {
        course_id: courses.find(c => c.course_code === 'CS101')?.id,
        teacher_id: teachers.find(t => t.first_name === 'Alice')?.id,
        class_id: classes.find(c => c.name.includes('CS Year 1'))?.id,
        day_of_week: 1, // Monday
        start_time: '08:00:00',
        end_time: '09:00:00',
        semester: 'Fall',
        academic_year: '2023-2024'
      },
      {
        course_id: courses.find(c => c.course_code === 'CS201')?.id,
        teacher_id: teachers.find(t => t.first_name === 'Bob')?.id,
        class_id: classes.find(c => c.name.includes('CS Year 2'))?.id,
        day_of_week: 1, // Monday
        start_time: '09:00:00',
        end_time: '10:00:00',
        semester: 'Fall',
        academic_year: '2023-2024'
      },
      // Tuesday
      {
        course_id: courses.find(c => c.course_code === 'EE101')?.id,
        teacher_id: teachers.find(t => t.first_name === 'Carol')?.id,
        class_id: classes.find(c => c.name.includes('EE Year 1'))?.id,
        day_of_week: 2, // Tuesday
        start_time: '08:00:00',
        end_time: '09:00:00',
        semester: 'Fall',
        academic_year: '2023-2024'
      },
      {
        course_id: courses.find(c => c.course_code === 'CS301')?.id,
        teacher_id: teachers.find(t => t.first_name === 'Bob')?.id,
        class_id: classes.find(c => c.name.includes('CS Year 2'))?.id,
        day_of_week: 2, // Tuesday
        start_time: '10:15:00',
        end_time: '11:15:00',
        semester: 'Fall',
        academic_year: '2023-2024'
      },
      // Wednesday
      {
        course_id: courses.find(c => c.course_code === 'ME101')?.id,
        teacher_id: teachers.find(t => t.first_name === 'Eva')?.id,
        class_id: classes.find(c => c.name.includes('CS Year 1'))?.id, // Mixed class
        day_of_week: 3, // Wednesday
        start_time: '08:00:00',
        end_time: '09:00:00',
        semester: 'Fall',
        academic_year: '2023-2024'
      },
      // Thursday
      {
        course_id: courses.find(c => c.course_code === 'BBA101')?.id,
        teacher_id: teachers.find(t => t.first_name === 'Grace')?.id,
        class_id: classes.find(c => c.name.includes('CS Year 1'))?.id, // Mixed class
        day_of_week: 4, // Thursday
        start_time: '09:00:00',
        end_time: '10:00:00',
        semester: 'Fall',
        academic_year: '2023-2024'
      },
      // Friday
      {
        course_id: courses.find(c => c.course_code === 'CE101')?.id,
        teacher_id: teachers.find(t => t.first_name === 'Frank')?.id,
        class_id: classes.find(c => c.name.includes('EE Year 1'))?.id, // Mixed class
        day_of_week: 5, // Friday
        start_time: '08:00:00',
        end_time: '09:00:00',
        semester: 'Fall',
        academic_year: '2023-2024'
      }
    ];

    console.log('Creating timetable entries...');
    let createdCount = 0;

    for (const entry of timetableEntries) {
      if (entry.course_id && entry.teacher_id && entry.class_id) {
        try {
          await connection.execute(
            `INSERT INTO timetable (course_id, teacher_id, class_id, day_of_week, start_time, end_time, semester, academic_year) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              entry.course_id, entry.teacher_id, entry.class_id, entry.day_of_week,
              entry.start_time, entry.end_time, entry.semester, entry.academic_year
            ]
          );
          createdCount++;
          console.log(`✓ Created timetable entry ${createdCount}`);
        } catch (error) {
          console.log(`⚠ Failed to create timetable entry: ${error.message}`);
        }
      } else {
        console.log('⚠ Skipped entry due to missing IDs:', entry);
      }
    }

    console.log(`\nSuccessfully created ${createdCount} timetable entries!`);

    // Display the created timetables
    const [timetables] = await connection.execute(`
      SELECT 
        t.id,
        c.course_code,
        c.name as course_name,
        CONCAT(u.first_name, ' ', u.last_name) as teacher_name,
        cl.name as class_name,
        CASE t.day_of_week
          WHEN 1 THEN 'Monday'
          WHEN 2 THEN 'Tuesday'
          WHEN 3 THEN 'Wednesday'
          WHEN 4 THEN 'Thursday'
          WHEN 5 THEN 'Friday'
          WHEN 6 THEN 'Saturday'
          WHEN 7 THEN 'Sunday'
        END as day_name,
        t.start_time,
        t.end_time
      FROM timetable t
      JOIN courses c ON t.course_id = c.id
      JOIN users u ON t.teacher_id = u.id
      JOIN classes cl ON t.class_id = cl.id
      ORDER BY t.day_of_week, t.start_time
    `);

    console.log('\n=== CREATED TIMETABLES ===');
    timetables.forEach(tt => {
      console.log(`${tt.day_name} ${tt.start_time}-${tt.end_time}: ${tt.course_code} (${tt.course_name}) - ${tt.teacher_name} - ${tt.class_name}`);
    });

  } catch (error) {
    console.error('Error creating timetables:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addSampleTimetables();
