import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function testClasses() {
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'smis_db'
    });
    
    console.log('Connected successfully!');
    
    // Check if classes table exists
    console.log('\n1. Checking if classes table exists...');
    const [tables] = await connection.execute("SHOW TABLES LIKE 'classes'");
    console.log('Classes table exists:', tables.length > 0);
    
    if (tables.length === 0) {
      console.log('Classes table does not exist. Creating it...');
      
      const createTableQuery = `
        CREATE TABLE classes (
          id INT AUTO_INCREMENT PRIMARY KEY,
          academic_year VARCHAR(20) NOT NULL,
          name VARCHAR(255) NOT NULL,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          department_id INT,
          created_by INT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB;
      `;
      
      await connection.execute(createTableQuery);
      console.log('Classes table created successfully!');
      
      // Insert sample data
      console.log('\n2. Inserting sample classes...');
      const insertQuery = `
        INSERT INTO classes (academic_year, name, start_date, end_date, is_active, department_id, created_by)
        VALUES 
        ('2024-2025', 'Computer Science Year 1', '2024-09-01', '2025-06-30', 1, 1, 1),
        ('2024-2025', 'Computer Science Year 2', '2024-09-01', '2025-06-30', 1, 1, 1),
        ('2024-2025', 'Mathematics Year 1', '2024-09-01', '2025-06-30', 1, 2, 1),
        ('2024-2025', 'Physics Year 1', '2024-09-01', '2025-06-30', 1, 3, 1),
        ('2024-2025', 'Engineering Year 1', '2024-09-01', '2025-06-30', 1, 4, 1)
      `;
      
      await connection.execute(insertQuery);
      console.log('Sample classes inserted successfully!');
    }
    
    // Check existing classes
    console.log('\n3. Checking existing classes...');
    const [classes] = await connection.execute('SELECT * FROM classes ORDER BY academic_year, name');
    console.log('Number of classes:', classes.length);
    console.log('Classes:', classes);
    
    // Test the getClasses query
    console.log('\n4. Testing getClasses query...');
    const query = `
      SELECT id, name, academic_year, department_id
      FROM classes 
      WHERE is_active = 1
      ORDER BY academic_year DESC, name ASC
    `;
    
    const [result] = await connection.execute(query);
    console.log('Query result:', result);
    console.log('Number of classes returned:', result.length);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nConnection closed.');
    }
  }
}

testClasses();
