import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Nike14##',
  database: 'smis'
};

// Sample data
const departments = [
  { code: 'CS', name: 'Computer Science' },
  { code: 'EE', name: 'Electrical Engineering' },
  { code: 'ME', name: 'Mechanical Engineering' },
  { code: 'CE', name: 'Civil Engineering' },
  { code: 'BBA', name: 'Business Administration' }
];

const courses = [
  // CS Courses
  { course_code: 'CS101', name: 'Introduction to Programming', credits: 3, semester: 'Fall' },
  { course_code: 'CS201', name: 'Data Structures', credits: 4, semester: 'Spring' },
  { course_code: 'CS301', name: 'Database Systems', credits: 3, semester: 'Fall' },
  // EE Courses
  { course_code: 'EE101', name: 'Circuit Analysis', credits: 4, semester: 'Fall' },
  { course_code: 'EE201', name: 'Electronics', credits: 3, semester: 'Spring' },
  // ME Courses
  { course_code: 'ME101', name: 'Thermodynamics', credits: 3, semester: 'Fall' },
  { course_code: 'ME201', name: 'Fluid Mechanics', credits: 4, semester: 'Spring' },
  // CE Courses
  { course_code: 'CE101', name: 'Structural Engineering', credits: 4, semester: 'Fall' },
  // BBA Courses
  { course_code: 'BBA101', name: 'Principles of Management', credits: 3, semester: 'Fall' },
  { course_code: 'BBA201', name: 'Marketing Management', credits: 3, semester: 'Spring' }
];

const rooms = [
  { room_number: 'A101', building: 'Main Building', capacity: 40, room_type: 'classroom' },
  { room_number: 'A102', building: 'Main Building', capacity: 35, room_type: 'classroom' },
  { room_number: 'B201', building: 'Science Block', capacity: 30, room_type: 'laboratory' },
  { room_number: 'C301', building: 'Engineering Block', capacity: 50, room_type: 'classroom' }
];

async function populateDatabase() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL database');

    // Clear existing data
    console.log('Clearing existing data...');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    // List of tables to clear (only existing ones)
    const tablesToClear = [
      'timetable', 'attendance', 'grades', 'fees', 'course_enrollments', 
      'class_courses', 'classes', 'students', 'users', 'courses', 'departments'
    ];
    
    for (const table of tablesToClear) {
      try {
        await connection.execute(`TRUNCATE TABLE ${table}`);
        console.log(`✓ Cleared ${table}`);
      } catch (error) {
        console.log(`⚠ Could not clear ${table}: ${error.message}`);
      }
    }
    
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');

    // Insert departments
    console.log('Creating departments...');
    const departmentIds = {};
    for (const dept of departments) {
      const [result] = await connection.execute(
        'INSERT INTO departments (code, name) VALUES (?, ?)',
        [dept.code, dept.name]
      );
      departmentIds[dept.code] = result.insertId;
    }

    // Insert courses
    console.log('Creating courses...');
    for (const course of courses) {
      await connection.execute(
        'INSERT INTO courses (course_code, name, credits, semester) VALUES (?, ?, ?, ?)',
        [course.course_code, course.name, course.credits, course.semester]
      );
    }

    // Skip rooms and time configuration as tables don't exist in current schema

    // Create users
    console.log('Creating users...');
    const userCredentials = [];

    // Admin users
    const adminUsers = [
      { first_name: 'John', last_name: 'Admin', email: 'admin@smis.edu', password: 'admin123', role: 'admin', staff_id: 'ADM001' },
      { first_name: 'Sarah', last_name: 'Manager', email: 'sarah.admin@smis.edu', password: 'admin123', role: 'admin', staff_id: 'ADM002' }
    ];

    for (const user of adminUsers) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await connection.execute(
        'INSERT INTO users (first_name, last_name, email, password_hash, role, staff_id, hire_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [user.first_name, user.last_name, user.email, hashedPassword, user.role, user.staff_id, '2023-01-01', 'active']
      );
      userCredentials.push({ ...user, userType: 'staff' });
    }

    // Finance users
    const financeUsers = [
      { first_name: 'Michael', last_name: 'Finance', email: 'finance@smis.edu', password: 'finance123', role: 'finance', staff_id: 'FIN001' },
      { first_name: 'Lisa', last_name: 'Accounts', email: 'lisa.finance@smis.edu', password: 'finance123', role: 'finance', staff_id: 'FIN002' }
    ];

    for (const user of financeUsers) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await connection.execute(
        'INSERT INTO users (first_name, last_name, email, password_hash, role, staff_id, hire_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [user.first_name, user.last_name, user.email, hashedPassword, user.role, user.staff_id, '2023-01-01', 'active']
      );
      userCredentials.push({ ...user, userType: 'staff' });
    }

    // HOD users (one for each department)
    const hodUsers = [
      { first_name: 'Dr. Robert', last_name: 'Smith', email: 'hod.cs@smis.edu', password: 'hod123', role: 'hod', department_id: departmentIds['CS'], staff_id: 'HOD001' },
      { first_name: 'Dr. Emily', last_name: 'Johnson', email: 'hod.ee@smis.edu', password: 'hod123', role: 'hod', department_id: departmentIds['EE'], staff_id: 'HOD002' },
      { first_name: 'Dr. David', last_name: 'Wilson', email: 'hod.me@smis.edu', password: 'hod123', role: 'hod', department_id: departmentIds['ME'], staff_id: 'HOD003' },
      { first_name: 'Dr. Maria', last_name: 'Garcia', email: 'hod.ce@smis.edu', password: 'hod123', role: 'hod', department_id: departmentIds['CE'], staff_id: 'HOD004' },
      { first_name: 'Dr. James', last_name: 'Brown', email: 'hod.bba@smis.edu', password: 'hod123', role: 'hod', department_id: departmentIds['BBA'], staff_id: 'HOD005' }
    ];

    const hodIds = {};
    for (const user of hodUsers) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      const [result] = await connection.execute(
        'INSERT INTO users (first_name, last_name, email, password_hash, role, department_id, staff_id, hire_date, status, subjects) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [user.first_name, user.last_name, user.email, hashedPassword, user.role, user.department_id, user.staff_id, '2023-01-01', 'active', JSON.stringify(['Management', 'Leadership'])]
      );
      hodIds[user.department_id] = result.insertId;
      userCredentials.push({ ...user, userType: 'staff' });
    }

    // Update departments with HOD references
    for (const [deptCode, deptId] of Object.entries(departmentIds)) {
      if (hodIds[deptId]) {
        await connection.execute(
          'UPDATE departments SET head_id = ? WHERE id = ?',
          [hodIds[deptId], deptId]
        );
      }
    }

    // Teacher users (2-3 per department)
    const teacherUsers = [
      // CS Teachers
      { first_name: 'Alice', last_name: 'Cooper', email: 'alice.teacher@smis.edu', password: 'teacher123', role: 'teacher', department_id: departmentIds['CS'], staff_id: 'TCH001', subjects: ['Programming', 'Data Structures'] },
      { first_name: 'Bob', last_name: 'Davis', email: 'bob.teacher@smis.edu', password: 'teacher123', role: 'teacher', department_id: departmentIds['CS'], staff_id: 'TCH002', subjects: ['Database Systems', 'Web Development'] },
      // EE Teachers
      { first_name: 'Carol', last_name: 'Evans', email: 'carol.teacher@smis.edu', password: 'teacher123', role: 'teacher', department_id: departmentIds['EE'], staff_id: 'TCH003', subjects: ['Circuit Analysis', 'Electronics'] },
      { first_name: 'Daniel', last_name: 'Foster', email: 'daniel.teacher@smis.edu', password: 'teacher123', role: 'teacher', department_id: departmentIds['EE'], staff_id: 'TCH004', subjects: ['Power Systems', 'Control Systems'] },
      // ME Teachers
      { first_name: 'Eva', last_name: 'Green', email: 'eva.teacher@smis.edu', password: 'teacher123', role: 'teacher', department_id: departmentIds['ME'], staff_id: 'TCH005', subjects: ['Thermodynamics', 'Heat Transfer'] },
      // CE Teachers
      { first_name: 'Frank', last_name: 'Harris', email: 'frank.teacher@smis.edu', password: 'teacher123', role: 'teacher', department_id: departmentIds['CE'], staff_id: 'TCH006', subjects: ['Structural Engineering', 'Construction Management'] },
      // BBA Teachers
      { first_name: 'Grace', last_name: 'Lee', email: 'grace.teacher@smis.edu', password: 'teacher123', role: 'teacher', department_id: departmentIds['BBA'], staff_id: 'TCH007', subjects: ['Management', 'Marketing'] }
    ];

    for (const user of teacherUsers) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await connection.execute(
        'INSERT INTO users (first_name, last_name, email, password_hash, role, department_id, staff_id, hire_date, status, subjects) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [user.first_name, user.last_name, user.email, hashedPassword, user.role, user.department_id, user.staff_id, '2023-01-01', 'active', JSON.stringify(user.subjects)]
      );
      userCredentials.push({ ...user, userType: 'staff' });
    }

    // Student users (5 per department)
    console.log('Creating students...');
    const studentUsers = [
      // CS Students
      { first_name: 'Alex', last_name: 'Student1', email: 'alex.student@smis.edu', password: 'student123', department_id: departmentIds['CS'], student_id: 'CS2023001', enrollment_year: 2023, current_year: 1 },
      { first_name: 'Betty', last_name: 'Student2', email: 'betty.student@smis.edu', password: 'student123', department_id: departmentIds['CS'], student_id: 'CS2023002', enrollment_year: 2023, current_year: 1 },
      { first_name: 'Charlie', last_name: 'Student3', email: 'charlie.student@smis.edu', password: 'student123', department_id: departmentIds['CS'], student_id: 'CS2022001', enrollment_year: 2022, current_year: 2 },
      { first_name: 'Diana', last_name: 'Student4', email: 'diana.student@smis.edu', password: 'student123', department_id: departmentIds['CS'], student_id: 'CS2022002', enrollment_year: 2022, current_year: 2 },
      { first_name: 'Edward', last_name: 'Student5', email: 'edward.student@smis.edu', password: 'student123', department_id: departmentIds['CS'], student_id: 'CS2021001', enrollment_year: 2021, current_year: 3 },
      // EE Students
      { first_name: 'Fiona', last_name: 'Student6', email: 'fiona.student@smis.edu', password: 'student123', department_id: departmentIds['EE'], student_id: 'EE2023001', enrollment_year: 2023, current_year: 1 },
      { first_name: 'George', last_name: 'Student7', email: 'george.student@smis.edu', password: 'student123', department_id: departmentIds['EE'], student_id: 'EE2023002', enrollment_year: 2023, current_year: 1 },
      { first_name: 'Helen', last_name: 'Student8', email: 'helen.student@smis.edu', password: 'student123', department_id: departmentIds['EE'], student_id: 'EE2022001', enrollment_year: 2022, current_year: 2 },
      // ME Students
      { first_name: 'Ivan', last_name: 'Student9', email: 'ivan.student@smis.edu', password: 'student123', department_id: departmentIds['ME'], student_id: 'ME2023001', enrollment_year: 2023, current_year: 1 },
      { first_name: 'Julia', last_name: 'Student10', email: 'julia.student@smis.edu', password: 'student123', department_id: departmentIds['ME'], student_id: 'ME2022001', enrollment_year: 2022, current_year: 2 },
      // CE Students
      { first_name: 'Kevin', last_name: 'Student11', email: 'kevin.student@smis.edu', password: 'student123', department_id: departmentIds['CE'], student_id: 'CE2023001', enrollment_year: 2023, current_year: 1 },
      { first_name: 'Laura', last_name: 'Student12', email: 'laura.student@smis.edu', password: 'student123', department_id: departmentIds['CE'], student_id: 'CE2022001', enrollment_year: 2022, current_year: 2 },
      // BBA Students
      { first_name: 'Mike', last_name: 'Student13', email: 'mike.student@smis.edu', password: 'student123', department_id: departmentIds['BBA'], student_id: 'BBA2023001', enrollment_year: 2023, current_year: 1 },
      { first_name: 'Nina', last_name: 'Student14', email: 'nina.student@smis.edu', password: 'student123', department_id: departmentIds['BBA'], student_id: 'BBA2022001', enrollment_year: 2022, current_year: 2 },
      { first_name: 'Oscar', last_name: 'Student15', email: 'oscar.student@smis.edu', password: 'student123', department_id: departmentIds['BBA'], student_id: 'BBA2021001', enrollment_year: 2021, current_year: 3 }
    ];

    const studentIds = {};
    for (const user of studentUsers) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      const [result] = await connection.execute(
        'INSERT INTO students (first_name, last_name, email, password_hash, department_id, student_id, enrollment_year, current_year, enrollment_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [user.first_name, user.last_name, user.email, hashedPassword, user.department_id, user.student_id, user.enrollment_year, user.current_year, '2023-09-01', 'active']
      );
      studentIds[user.student_id] = result.insertId;
      userCredentials.push({ ...user, userType: 'student' });
    }

    // Create classes
    console.log('Creating classes...');
    const classes = [
      { name: 'CS Year 1 - 2023', academic_year: '2023-2024', department_id: departmentIds['CS'], students: [studentIds['CS2023001'], studentIds['CS2023002']] },
      { name: 'CS Year 2 - 2022', academic_year: '2023-2024', department_id: departmentIds['CS'], students: [studentIds['CS2022001'], studentIds['CS2022002']] },
      { name: 'EE Year 1 - 2023', academic_year: '2023-2024', department_id: departmentIds['EE'], students: [studentIds['EE2023001'], studentIds['EE2023002']] }
    ];

    for (const classData of classes) {
      await connection.execute(
        'INSERT INTO classes (name, academic_year, department_id, students, start_date, end_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [classData.name, classData.academic_year, classData.department_id, JSON.stringify(classData.students), '2023-09-01', '2024-06-30', 1]
      );
    }

    console.log('Database populated successfully!');
    
    // Generate credentials file
    const credentialsContent = generateCredentialsFile(userCredentials);
    console.log('\n' + credentialsContent);
    
    return userCredentials;

  } catch (error) {
    console.error('Error populating database:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

function generateCredentialsFile(credentials) {
  let content = `# SMIS User Credentials\n\n`;
  content += `Generated on: ${new Date().toLocaleString()}\n\n`;
  
  const groupedCredentials = {
    admin: credentials.filter(c => c.role === 'admin'),
    finance: credentials.filter(c => c.role === 'finance'),
    hod: credentials.filter(c => c.role === 'hod'),
    teacher: credentials.filter(c => c.role === 'teacher'),
    student: credentials.filter(c => c.userType === 'student')
  };

  for (const [role, users] of Object.entries(groupedCredentials)) {
    if (users.length > 0) {
      content += `## ${role.toUpperCase()} USERS\n\n`;
      users.forEach(user => {
        content += `**${user.first_name} ${user.last_name}**\n`;
        content += `- Email: ${user.email}\n`;
        content += `- Password: ${user.password}\n`;
        content += `- Role: ${user.role || 'student'}\n`;
        if (user.staff_id) content += `- Staff ID: ${user.staff_id}\n`;
        if (user.student_id) content += `- Student ID: ${user.student_id}\n`;
        content += `\n`;
      });
      content += `\n`;
    }
  }

  return content;
}

// Run the population script
populateDatabase()
  .then((credentials) => {
    console.log(`\nSuccessfully created ${credentials.length} users!`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to populate database:', error);
    process.exit(1);
  });
