import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read environment variables
import dotenv from 'dotenv';
dotenv.config();

async function setupDatabase() {
  let connection;
  
  try {
    console.log('Connecting to MySQL...');
    
    // Connect to MySQL without specifying database first
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
    });

    console.log('Connected to MySQL successfully!');

    // Create database
    console.log('Creating database...');
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'smis'}`);
    console.log('Database created successfully!');

    // Use the database
    await connection.execute(`USE ${process.env.DB_NAME || 'smis'}`);
    console.log('Using database:', process.env.DB_NAME || 'smis');

    // Read and execute schema
    console.log('Reading schema file...');
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Executing schema...');
    // Split schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await connection.execute(statement);
          console.log('✓ Executed statement');
        } catch (error) {
          console.log('⚠ Statement failed (might already exist):', error.message);
        }
      }
    }

    console.log('Database setup completed successfully!');
    console.log('You can now start the backend server with: npm start');

  } catch (error) {
    console.error('Database setup failed:', error.message);
    console.log('\nPlease check:');
    console.log('1. MySQL is running');
    console.log('2. The password in .env file is correct');
    console.log('3. The user has proper permissions');
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase();
