// setup_assessment_tables.js
const pool = require('./db/pool');

async function setupAssessmentTables() {
  const client = await pool.connect();
  
  try {
    // Start transaction
    await client.query('BEGIN');
    
    console.log('Creating assessment project tables...');
    
    // Create Assessment Projects table
    await client.query(`
      CREATE TABLE IF NOT EXISTS assessment_projects (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        status VARCHAR(50) DEFAULT 'Draft',
        location VARCHAR(255),
        reduction_target INTEGER,
        budget DECIMAL(15,2),
        timeline_start DATE,
        timeline_end DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create Assessment Project Details table
    await client.query(`
      CREATE TABLE IF NOT EXISTS assessment_project_details (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL,
        project_type VARCHAR(50) NOT NULL,
        project_size DECIMAL(15,2),
        carbon_credit_price DECIMAL(10,2),
        project_years INTEGER,
        discount_rate DECIMAL(5,2),
        config_data JSONB,
        results_data JSONB,
        serialized_state JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_project
          FOREIGN KEY(project_id)
          REFERENCES assessment_projects(id)
          ON DELETE CASCADE
      )
    `);
    
    // Create indexes for better performance
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_assessment_projects_user_id') THEN
          CREATE INDEX idx_assessment_projects_user_id ON assessment_projects(user_id);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_assessment_project_details_project_id') THEN
          CREATE INDEX idx_assessment_project_details_project_id ON assessment_project_details(project_id);
        END IF;
      END
      $$;
    `);
    
    await client.query('COMMIT');
    console.log('Successfully created assessment project tables!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error setting up assessment tables:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Run the setup function
setupAssessmentTables()
  .then(() => {
    console.log('Setup complete.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Setup failed:', err);
    process.exit(1);
  });