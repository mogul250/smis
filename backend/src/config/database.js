import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS,
  database: process.env.DB_NAME || 'smis',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

pool.getConnection()
  .then(() => {
    console.log('Connected to MySQL database');
  })
  .catch((err) => {
    console.error('Error connecting to MySQL database:', err);
    // Don't exit in test environment
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  });

export default pool;
