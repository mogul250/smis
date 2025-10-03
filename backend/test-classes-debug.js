import mysql from 'mysql2/promise';

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Nike14##',
  database: 'smis',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function testClassesQuery() {
  let connection;
  
  try {
    console.log('🔗 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected successfully');
    
    console.log('\n📋 Testing classes query...');
    
    const query = `
      SELECT id, academic_year, start_date, end_date, students, created_by, is_active
      FROM classes 
      WHERE is_active = 1
      ORDER BY academic_year DESC, id ASC
    `;
    
    console.log('🔍 Executing query:', query);
    
    const [rows] = await connection.execute(query);
    
    console.log('✅ Query executed successfully');
    console.log('📊 Raw results:', rows);
    
    // Transform the data to match expected format
    const transformedRows = rows.map(row => ({
      id: row.id,
      name: `Class ${row.academic_year}`, // Use academic_year as name
      academic_year: row.academic_year,
      department_id: null // Will be null for now
    }));
    
    console.log('🔄 Transformed results:', transformedRows);
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

testClassesQuery();
