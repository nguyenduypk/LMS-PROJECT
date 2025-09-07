const mysql = require('mysql2');
require('dotenv').config({ path: './config.env' });

// Tạo connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'dblms',
  port: process.env.DB_PORT || 4306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Tạo promise wrapper
const promisePool = pool.promise();

// Test kết nối
const testConnection = async () => {
  try {
    const [rows] = await promisePool.execute('SELECT 1');
    console.log('✅ Database connected successfully!');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

module.exports = {
  pool: promisePool,
  testConnection
}; 