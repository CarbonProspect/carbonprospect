// article6ProjectsRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

// GET all Article 6 projects
router.get('/', authMiddleware, async (req, res) => {
  try {
    const client = await pool.connect();
    
    try {
      // Query to transform the data to match frontend expectations
      const query = `
        SELECT 
          id,
          external_id AS "id",
          name,
          country,
          buying_party AS "buyingParty",
          description,
          type,
          status,
          start_date AS "startDate",
          estimated_emission_reductions AS "estimatedEmissionReductions",
          sdg_contributions AS "sdgContributions",
          key_features AS "keyFeatures",
          location,
          implementing_agency AS "implementingAgency",
          verification_standard AS "verificationStandard",
          project_link AS "projectLink"
        FROM article6_projects
        ORDER BY country, name
      `;
      
      const result = await client.query(query);
      const projects = result.rows;
      
      // Log the deprecation notice but return the array directly
      console.log("DEPRECATION: This endpoint is deprecated. Please use /api/projects with article6=true filter instead.");
      
      // Return array directly to maintain compatibility with existing clients
      res.json(projects);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error fetching Article 6 projects:', err);
    res.status(500).json({ error: 'Failed to retrieve Article 6 projects' });
  }
});

// GET Article 6 projects by country
router.get('/country/:countryName', authMiddleware, async (req, res) => {
  try {
    const { countryName } = req.params;
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT 
          id,
          external_id AS "id",
          name,
          country,
          buying_party AS "buyingParty",
          description,
          type,
          status,
          start_date AS "startDate",
          estimated_emission_reductions AS "estimatedEmissionReductions",
          sdg_contributions AS "sdgContributions",
          key_features AS "keyFeatures",
          location,
          implementing_agency AS "implementingAgency",
          verification_standard AS "verificationStandard",
          project_link AS "projectLink"
        FROM article6_projects
        WHERE country ILIKE $1
        ORDER BY name
      `;
      
      const result = await client.query(query, [`%${countryName}%`]);
      
      // Log the deprecation notice but return the array directly
      console.log("DEPRECATION: This endpoint is deprecated. Please use /api/projects with article6=true and country filters instead.");
      
      // Return array directly
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error fetching Article 6 projects by country:', err);
    res.status(500).json({ error: 'Failed to retrieve projects by country' });
  }
});

// GET Article 6 projects by buying party
router.get('/buying-party/:partyName', authMiddleware, async (req, res) => {
  try {
    const { partyName } = req.params;
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT 
          id,
          external_id AS "id",
          name,
          country,
          buying_party AS "buyingParty",
          description,
          type,
          status,
          start_date AS "startDate",
          estimated_emission_reductions AS "estimatedEmissionReductions",
          sdg_contributions AS "sdgContributions",
          key_features AS "keyFeatures",
          location,
          implementing_agency AS "implementingAgency",
          verification_standard AS "verificationStandard",
          project_link AS "projectLink"
        FROM article6_projects
        WHERE buying_party ILIKE $1
        ORDER BY country, name
      `;
      
      const result = await client.query(query, [`%${partyName}%`]);
      
      // Log the deprecation notice but return the array directly
      console.log("DEPRECATION: This endpoint is deprecated. Please use /api/projects with article6=true and buyingParty filters instead.");
      
      // Return array directly
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error fetching Article 6 projects by buying party:', err);
    res.status(500).json({ error: 'Failed to retrieve projects by buying party' });
  }
});

// Admin route to add a new Article 6 project
router.post('/', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const {
      externalId,
      name,
      country,
      buyingParty,
      description,
      type,
      status,
      startDate,
      estimatedEmissionReductions,
      sdgContributions,
      keyFeatures,
      location,
      implementingAgency,
      verificationStandard,
      projectLink
    } = req.body;
    
    // Deprecation notice in the log
    console.log("WARNING: The POST /api/article6-projects endpoint is deprecated. Please use POST /api/projects with article6_compliant=true instead.");
    
    // Validate required fields
    if (!name || !country || !buyingParty) {
      return res.status(400).json({ 
        error: 'Name, country, and buying party are required'
      });
    }
    
    const client = await pool.connect();
    
    try {
      // Check if external ID already exists
      if (externalId) {
        const existingProject = await client.query(
          'SELECT id FROM article6_projects WHERE external_id = $1',
          [externalId]
        );
        
        if (existingProject.rows.length > 0) {
          return res.status(409).json({ 
            error: 'A project with this external ID already exists'
          });
        }
      }
      
      const query = `
        INSERT INTO article6_projects (
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
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *
      `;
      
      const values = [
        externalId,
        name,
        country,
        buyingParty,
        description,
        type,
        status,
        startDate,
        estimatedEmissionReductions,
        JSON.stringify(sdgContributions || []),
        JSON.stringify(keyFeatures || []),
        location,
        implementingAgency,
        verificationStandard,
        projectLink
      ];
      
      const result = await client.query(query, values);
      
      // Return the created project directly as an object
      res.status(201).json({
        ...result.rows[0],
        id: result.rows[0].external_id,
        buyingParty: result.rows[0].buying_party,
        startDate: result.rows[0].start_date,
        estimatedEmissionReductions: result.rows[0].estimated_emission_reductions,
        sdgContributions: result.rows[0].sdg_contributions,
        keyFeatures: result.rows[0].key_features,
        implementingAgency: result.rows[0].implementing_agency,
        verificationStandard: result.rows[0].verification_standard,
        projectLink: result.rows[0].project_link
      });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error creating Article 6 project:', err);
    res.status(500).json({ 
      error: 'Failed to create Article 6 project'
    });
  }
});

// Admin route to update an Article 6 project
router.put('/:id', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { id } = req.params;
    const {
      externalId,
      name,
      country,
      buyingParty,
      description,
      type,
      status,
      startDate,
      estimatedEmissionReductions,
      sdgContributions,
      keyFeatures,
      location,
      implementingAgency,
      verificationStandard,
      projectLink
    } = req.body;
    
    // Deprecation notice in the log
    console.log("WARNING: The PUT /api/article6-projects/:id endpoint is deprecated. Please use PUT /api/projects/:id with article6_compliant=true instead.");
    
    // Validate required fields
    if (!name || !country || !buyingParty) {
      return res.status(400).json({ 
        error: 'Name, country, and buying party are required'
      });
    }
    
    const client = await pool.connect();
    
    try {
      // Check if project exists
      const existingProject = await client.query(
        'SELECT id FROM article6_projects WHERE id = $1',
        [id]
      );
      
      if (existingProject.rows.length === 0) {
        return res.status(404).json({ 
          error: 'Article 6 project not found'
        });
      }
      
      const query = `
        UPDATE article6_projects
        SET
          external_id = $1,
          name = $2,
          country = $3,
          buying_party = $4,
          description = $5,
          type = $6,
          status = $7,
          start_date = $8,
          estimated_emission_reductions = $9,
          sdg_contributions = $10,
          key_features = $11,
          location = $12,
          implementing_agency = $13,
          verification_standard = $14,
          project_link = $15,
          updated_at = NOW()
        WHERE id = $16
        RETURNING *
      `;
      
      const values = [
        externalId,
        name,
        country,
        buyingParty,
        description,
        type,
        status,
        startDate,
        estimatedEmissionReductions,
        JSON.stringify(sdgContributions || []),
        JSON.stringify(keyFeatures || []),
        location,
        implementingAgency,
        verificationStandard,
        projectLink,
        id
      ];
      
      const result = await client.query(query, values);
      
      // Return the updated project directly as an object
      res.json({
        ...result.rows[0],
        id: result.rows[0].external_id,
        buyingParty: result.rows[0].buying_party,
        startDate: result.rows[0].start_date,
        estimatedEmissionReductions: result.rows[0].estimated_emission_reductions,
        sdgContributions: result.rows[0].sdg_contributions,
        keyFeatures: result.rows[0].key_features,
        implementingAgency: result.rows[0].implementing_agency,
        verificationStandard: result.rows[0].verification_standard,
        projectLink: result.rows[0].project_link
      });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error updating Article 6 project:', err);
    res.status(500).json({ 
      error: 'Failed to update Article 6 project'
    });
  }
});

module.exports = router;