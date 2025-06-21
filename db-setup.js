const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

// Get database connection details from environment variables
const connectionString = process.env.DATABASE_URL || 
  `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

// Create a pool connection
const pool = new Pool({
  connectionString: connectionString,
});

// Path to SQL files - adjust these to the correct location
const authTablesPath = path.join(__dirname, 'server', 'db', 'setup_auth_tables.sql');
const schemaPath = path.join(__dirname, 'server', 'db', 'simplified_schema.sql');

// Log the paths to help debug
console.log('Auth tables SQL path:', authTablesPath);
console.log('Schema SQL path:', schemaPath);
console.log('Current directory:', __dirname);

// Check if files exist
console.log('Auth tables SQL exists:', fs.existsSync(authTablesPath));
console.log('Schema SQL exists:', fs.existsSync(schemaPath));

async function setupDatabase() {
  const client = await pool.connect();
  
  try {
    // Start transaction
    await client.query('BEGIN');
    
    console.log('Setting up authentication tables...');
    // First try with the path as is
    try {
      const authTablesSQL = fs.readFileSync(authTablesPath, 'utf8');
      await client.query(authTablesSQL);
      console.log('Authentication tables created successfully!');
    } catch (err) {
      console.error('Error reading auth tables file, trying alternate path:', err.message);
      // Try a different path as fallback
      const alternatePath = path.join(__dirname, 'db', 'setup_auth_tables.sql');
      console.log('Trying alternate path:', alternatePath);
      
      if (fs.existsSync(alternatePath)) {
        const authTablesSQL = fs.readFileSync(alternatePath, 'utf8');
        await client.query(authTablesSQL);
        console.log('Authentication tables created successfully using alternate path!');
      } else {
        throw new Error(`Could not find SQL file at either path. Original: ${authTablesPath}, Alternate: ${alternatePath}`);
      }
    }
    
    console.log('Setting up project and solution tables...');
    // First try with the path as is
    try {
      const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
      await client.query(schemaSQL);
      console.log('Project and solution tables created successfully!');
    } catch (err) {
      console.error('Error reading schema file, trying alternate path:', err.message);
      // Try a different path as fallback
      const alternatePath = path.join(__dirname, 'db', 'simplified_schema.sql');
      console.log('Trying alternate path:', alternatePath);
      
      if (fs.existsSync(alternatePath)) {
        const schemaSQL = fs.readFileSync(alternatePath, 'utf8');
        await client.query(schemaSQL);
        console.log('Project and solution tables created successfully using alternate path!');
      } else {
        throw new Error(`Could not find SQL file at either path. Original: ${schemaPath}, Alternate: ${alternatePath}`);
      }
    }
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('Database setup completed successfully!');
  } catch (err) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('Error setting up database:', err);
    process.exit(1);
  } finally {
    // Release client back to pool
    client.release();
    // Close pool
    pool.end();
  }
}

setupDatabase();