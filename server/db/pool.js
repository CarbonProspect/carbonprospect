const { Pool } = require('pg');
require('dotenv').config();

// Get database configuration from environment variables
const connectionString = process.env.DATABASE_URL;

// Create a new Pool instance either using the connection string
// or individual parameters if connection string is not available
const pool = connectionString 
  ? new Pool({ connectionString })
  : new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'carbon_marketplace',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });

// Test the connection
pool.connect((err, client, done) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Successfully connected to PostgreSQL database');
    // Log the database name to verify connection
    client.query('SELECT current_database() as db_name', (err, res) => {
      if (err) {
        console.error('Error querying database name:', err.message);
      } else {
        console.log('Connected to database:', res.rows[0].db_name);
      }
      done();
    });
  }
});

// Handle unexpected errors to prevent app crash
pool.on('error', (err) => {
  console.error('Unexpected database error:', err.message);
  // Attempt to reconnect if needed
});

module.exports = pool;