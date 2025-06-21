
// article6IdMappingRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin'); // If you have an admin middleware

// GET a numeric ID from a legacy Article 6 external ID
router.get('/legacy-id/:externalId', authMiddleware, async (req, res) => {
  try {
    const { externalId } = req.params;
    
    if (!externalId) {
      return res.status(400).json({ error: 'External ID is required' });
    }
    
    const client = await pool.connect();
    
    try {
      // Check if mapping exists
      const mappingQuery = `
        SELECT numeric_id 
        FROM article6_id_map 
        WHERE external_id = $1
      `;
      
      const mappingResult = await client.query(mappingQuery, [externalId]);
      
      if (mappingResult.rows.length > 0) {
        res.json({ numericId: mappingResult.rows[0].numeric_id });
        return;
      }
      
      // If not in mapping table, try to find in the original article6_projects table
      const originalQuery = `
        SELECT id, name, country, buying_party
        FROM article6_projects
        WHERE external_id = $1
      `;
      
      const originalResult = await client.query(originalQuery, [externalId]);
      
      if (originalResult.rows.length === 0) {
        res.status(404).json({ error: 'External ID not found' });
        return;
      }
      
      // Found in original table, now try to find a matching project in the main projects table
      const original = originalResult.rows[0];
      
      const matchQuery = `
        SELECT id 
        FROM projects 
        WHERE article6_compliant = true 
        AND name = $1 
        AND (host_country = $2 OR location ILIKE $3)
        AND buying_party = $4
      `;
      
      const matchResult = await client.query(matchQuery, [
        original.name,
        original.country,
        `%${original.country}%`,
        original.buying_party
      ]);
      
      if (matchResult.rows.length === 0) {
        res.status(404).json({ 
          error: 'No matching project found in the main projects table',
          originalData: original
        });
        return;
      }
      
      // Found a match, create a mapping entry for future use
      const numericId = matchResult.rows[0].id;
      
      await client.query(`
        INSERT INTO article6_id_map (external_id, numeric_id)
        VALUES ($1, $2)
        ON CONFLICT (external_id) DO NOTHING
      `, [externalId, numericId]);
      
      res.json({ numericId });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error mapping legacy Article 6 ID:', error);
    res.status(500).json({ error: 'Server error mapping legacy ID' });
  }
});

// GET legacy external ID from a numeric ID - useful for backward compatibility
router.get('/numeric-id/:numericId', authMiddleware, async (req, res) => {
  try {
    const { numericId } = req.params;
    
    if (!numericId) {
      return res.status(400).json({ error: 'Numeric ID is required' });
    }
    
    const client = await pool.connect();
    
    try {
      // Check if mapping exists
      const mappingQuery = `
        SELECT external_id 
        FROM article6_id_map 
        WHERE numeric_id = $1
      `;
      
      const mappingResult = await client.query(mappingQuery, [numericId]);
      
      if (mappingResult.rows.length > 0) {
        res.json({ externalId: mappingResult.rows[0].external_id });
        return;
      }
      
      // Not found in mapping table
      res.status(404).json({ error: 'No mapping found for this numeric ID' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching legacy Article 6 ID mapping:', error);
    res.status(500).json({ error: 'Server error fetching legacy ID mapping' });
  }
});

// Create/update a mapping
router.post('/create-mapping', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { externalId, numericId } = req.body;
    
    if (!externalId || !numericId) {
      return res.status(400).json({ error: 'External ID and Numeric ID are required' });
    }
    
    const client = await pool.connect();
    
    try {
      // Make sure the numeric ID exists and is Article 6 compliant
      const projectQuery = `
        SELECT id
        FROM projects
        WHERE id = $1 AND article6_compliant = true
      `;
      
      const projectResult = await client.query(projectQuery, [numericId]);
      
      if (projectResult.rows.length === 0) {
        return res.status(404).json({ error: 'Numeric ID not found or not an Article 6 project' });
      }
      
      // Create or update the mapping
      await client.query(`
        INSERT INTO article6_id_map (external_id, numeric_id)
        VALUES ($1, $2)
        ON CONFLICT (external_id) 
        DO UPDATE SET numeric_id = $2, created_at = NOW()
      `, [externalId, numericId]);
      
      res.json({ success: true, message: 'Mapping created/updated successfully' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating/updating Article 6 ID mapping:', error);
    res.status(500).json({ error: 'Server error creating/updating mapping' });
  }
});

// Get all mappings - useful for admin interfaces
router.get('/all-mappings', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT m.external_id, m.numeric_id, m.created_at,
               p.name, p.host_country, p.buying_party
        FROM article6_id_map m
        JOIN projects p ON m.numeric_id = p.id
        ORDER BY m.created_at DESC
      `;
      
      const result = await client.query(query);
      
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching Article 6 ID mappings:', error);
    res.status(500).json({ error: 'Server error fetching mappings' });
  }
});

// Auto-migrate Article 6 projects - Admin route to help move projects
router.post('/auto-migrate', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { userId } = req.body; // Optional user ID to assign projects to
    
    const client = await pool.connect();
    
    try {
      // Start a transaction
      await client.query('BEGIN');
      
      // Get all Article 6 projects that haven't been migrated yet
      const oldProjectsQuery = `
        SELECT a.* 
        FROM article6_projects a
        LEFT JOIN article6_id_map m ON a.external_id = m.external_id
        WHERE m.external_id IS NULL
      `;
      
      const oldProjectsResult = await client.query(oldProjectsQuery);
      const oldProjects = oldProjectsResult.rows;
      
      if (oldProjects.length === 0) {
        await client.query('COMMIT');
        return res.json({ 
          success: true, 
          message: 'No unmigrated Article 6 projects found', 
          migratedCount: 0 
        });
      }
      
      // Process each project
      const migrationResults = [];
      
      for (const oldProject of oldProjects) {
        // Convert to the new format
        const timeline = {
          start: oldProject.start_date,
          end: null
        };
        
        // Check if a project with the same name already exists
        const existingQuery = `
          SELECT id 
          FROM projects 
          WHERE name = $1 
          AND (host_country = $2 OR location ILIKE $3)
        `;
        
        const existingResult = await client.query(existingQuery, [
          oldProject.name,
          oldProject.country,
          `%${oldProject.country}%`
        ]);
        
        if (existingResult.rows.length > 0) {
          // Already exists, create mapping
          const numericId = existingResult.rows[0].id;
          
          // Update the existing project to ensure it's Article 6 compliant
          await client.query(`
            UPDATE projects
            SET article6_compliant = true,
                buying_party = $1,
                implementing_agency = $2,
                verification_standard = $3,
                project_link = $4,
                host_country = $5,
                updated_at = NOW()
            WHERE id = $6
          `, [
            oldProject.buying_party,
            oldProject.implementing_agency,
            oldProject.verification_standard,
            oldProject.project_link,
            oldProject.country,
            numericId
          ]);
          
          // Create the mapping
          await client.query(`
            INSERT INTO article6_id_map (external_id, numeric_id)
            VALUES ($1, $2)
            ON CONFLICT (external_id) DO NOTHING
          `, [oldProject.external_id, numericId]);
          
          migrationResults.push({
            externalId: oldProject.external_id,
            numericId: numericId,
            status: 'Mapped to existing project',
            name: oldProject.name
          });
        } else {
          // Create a new project
          const insertQuery = `
            INSERT INTO projects (
              user_id,
              name,
              description,
              category,
              project_type,
              location,
              status,
              timeline,
              sdg_goals,
              article6_compliant,
              implementing_agency,
              verification_standard,
              project_link,
              host_country,
              buying_party,
              reduction_target,
              created_at,
              updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
            RETURNING id
          `;
          
          const insertResult = await client.query(insertQuery, [
            userId || null, // Use provided user ID or null
            oldProject.name,
            oldProject.description,
            oldProject.type,
            'listing', // Default project type
            oldProject.location,
            oldProject.status,
            JSON.stringify(timeline),
            oldProject.sdg_contributions,
            true, // article6_compliant
            oldProject.implementing_agency,
            oldProject.verification_standard,
            oldProject.project_link,
            oldProject.country,
            oldProject.buying_party,
            oldProject.estimated_emission_reductions
          ]);
          
          const newProjectId = insertResult.rows[0].id;
          
          // Create the mapping
          await client.query(`
            INSERT INTO article6_id_map (external_id, numeric_id)
            VALUES ($1, $2)
            ON CONFLICT (external_id) DO NOTHING
          `, [oldProject.external_id, newProjectId]);
          
          migrationResults.push({
            externalId: oldProject.external_id,
            numericId: newProjectId,
            status: 'Created new project',
            name: oldProject.name
          });
        }
      }
      
      // Commit the transaction
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: `Successfully processed ${migrationResults.length} Article 6 projects`,
        migratedCount: migrationResults.length,
        results: migrationResults
      });
    } catch (error) {
      // Rollback in case of error
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error auto-migrating Article 6 projects:', error);
    res.status(500).json({ 
      error: 'Server error auto-migrating Article 6 projects',
      details: error.message
    });
  }
});

module.exports = router;