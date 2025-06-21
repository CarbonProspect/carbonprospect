// migrate-article6-projects.js
const pool = require('../db/pool');

const migrateArticle6Projects = async () => {
  const client = await pool.connect();
  
  try {
    // Start a transaction
    await client.query('BEGIN');
    
    console.log('Starting migration of Article 6 projects to main projects table...');
    
    // First, check if the article6_projects table exists
    const tableCheckQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'article6_projects'
      );
    `;
    
    const tableExists = await client.query(tableCheckQuery);
    
    if (!tableExists.rows[0].exists) {
      console.log('The article6_projects table does not exist, skipping migration.');
      await client.query('COMMIT');
      return;
    }
    
    // Get all Article 6 projects
    const getArticle6Query = `
      SELECT 
        id,
        external_id,
        name,
        country,
        buying_party,
        description,
        type,
        status,
        start_date,
        estimated_emission_reductions,
        sdg_contributions,
        key_features,
        location,
        implementing_agency,
        verification_standard,
        project_link
      FROM article6_projects
    `;
    
    const article6Result = await client.query(getArticle6Query);
    const article6Projects = article6Result.rows;
    
    console.log(`Found ${article6Projects.length} Article 6 projects to migrate.`);
    
    if (article6Projects.length === 0) {
      console.log('No Article 6 projects to migrate.');
      await client.query('COMMIT');
      return;
    }
    
    // Insert each project into the main projects table
    for (const project of article6Projects) {
      // Check if a project with this external_id already exists in the main table
      const checkExistingQuery = `
        SELECT id FROM projects WHERE name = $1 AND article6_compliant = true
      `;
      
      const existingResult = await client.query(checkExistingQuery, [project.name]);
      
      if (existingResult.rows.length > 0) {
        console.log(`Project '${project.name}' already exists in main table with ID ${existingResult.rows[0].id}, skipping.`);
        continue;
      }
      
      // Create a bilateral agreement object from the country and buying party
      const bilateralAgreements = [
        {
          name: `${project.country}-${project.buying_party} Agreement`,
          hostCountry: project.country,
          buyingParty: project.buying_party
        }
      ];
      
      // Insert the project into the main projects table
      const insertQuery = `
        INSERT INTO projects (
          name,
          description,
          category,
          location,
          status,
          reduction_target,
          article6_compliant,
          bilateral_agreements,
          sdg_goals,
          implementing_agency,
          verification_standard,
          project_link,
          host_country,
          buying_party,
          created_at,
          updated_at,
          project_stage
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW(), 'verification'
        ) RETURNING id
      `;
      
      const insertValues = [
        project.name,
        project.description,
        project.type, // Use 'type' as category
        project.location,
        project.status,
        project.estimated_emission_reductions,
        true, // article6_compliant
        JSON.stringify(bilateralAgreements),
        project.sdg_contributions,
        project.implementing_agency,
        project.verification_standard,
        project.project_link,
        project.country,
        project.buying_party
      ];
      
      const insertResult = await client.query(insertQuery, insertValues);
      const newProjectId = insertResult.rows[0].id;
      
      console.log(`Migrated Article 6 project '${project.name}' to main table with ID ${newProjectId}`);
      
      // Optional: Record mapping from article6_projects.id to projects.id for reference
      await client.query(
        'INSERT INTO migration_log (source_table, source_id, target_table, target_id) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
        ['article6_projects', project.id, 'projects', newProjectId]
      ).catch(err => {
        // If migration_log table doesn't exist, just continue
        console.log('Note: migration_log table not available, skipping log entry');
      });
    }
    
    console.log('Migration completed successfully.');
    console.log('NOTE: The article6_projects table has NOT been dropped. Once you verify the migration was successful, you can drop it manually.');
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error during migration:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run the migration if this script is executed directly
if (require.main === module) {
  migrateArticle6Projects()
    .then(() => {
      console.log('Migration script completed.');
      process.exit(0);
    })
    .catch(err => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
} else {
  // Export for use in other scripts
  module.exports = migrateArticle6Projects;
}