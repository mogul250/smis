import mysql from 'mysql2/promise';

async function createDatabase() {
  let connection;
  
  try {
    // Connect to MySQL without specifying database
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Nike14##'
    });

    console.log('Connected to MySQL successfully!');

    // Create database
    await connection.execute('CREATE DATABASE IF NOT EXISTS smis');
    console.log('Database "smis" created successfully!');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createDatabase();
