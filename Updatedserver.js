// db/pool.js
const { Pool } = require('pg');
require('dotenv').config();

console.log("Environment variables loaded");
console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);

// Create pool with DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  // Don't exit process, allow fallback to mock data
  console.error('Database error, app will fallback to mock data');
});

// Test connection immediately
console.log('Attempting database connection...');
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error acquiring client', err.stack);
    console.error('Check if DATABASE_URL is correctly set in .env file');
    console.error('Check if PostgreSQL server is running');
    // Don't exit the process, let the app fall back to mock data
    return;
  }
  
  console.log('Database connected successfully');
  // Test a simple query to verify connectivity
  client.query('SELECT COUNT(*) FROM marketplace_products', (queryErr, result) => {
    release();
    if (queryErr) {
      console.error('Error executing test query:', queryErr.stack);
    } else {
      console.log('Successfully queried products table, found', result.rows[0].count, 'products');
    }
  });
});

module.exports = pool;