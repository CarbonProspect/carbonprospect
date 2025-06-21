// assessment-project-schema-update.js
const pool = require('./db/pool');

async function modifyTables() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Check if scenarios column already exists
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'assessment_project_details' 
      AND column_name = 'scenarios'
    `);
    
    if (checkResult.rows.length === 0) {
      console.log('Adding scenarios column to assessment_project_details table...');
      
      // Add scenarios column as JSONB array to store multiple scenarios
      await client.query(`
        ALTER TABLE assessment_project_details
        ADD COLUMN scenarios JSONB DEFAULT '[]'::jsonb
      `);
      
      console.log('Successfully added scenarios column!');
    } else {
      console.log('Scenarios column already exists.');
    }
    
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error modifying tables:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Run the modification
modifyTables()
  .then(() => {
    console.log('Table modification complete.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Table modification failed:', err);
    process.exit(1);
  });