// Modified projectRoutes.js to support Article 6.2 project saving and credit pricing

const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

// Helper function to convert empty strings to null for numeric fields
const toNumericOrNull = (value) => {
  if (value === '' || value === null || value === undefined) {
    return null;
  }
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
};

// GET all projects
router.get('/', async (req, res) => {
  try {
    const client = await pool.connect();
    
    try {
      // Build the query based on filters
      let query = `
        SELECT p.*, 
               u.email as owner_email,
               COUNT(d.id) as document_count
        FROM projects p
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN documents d ON p.id = d.project_id
      `;
      
      // Check for filters
      const whereConditions = [];
      const queryParams = [];
      
      if (req.query.article6 === 'true') {
        whereConditions.push('p.article6_compliant = true');
      }
      
      // Add country filter if provided
      if (req.query.country) {
        queryParams.push(`%${req.query.country}%`);
        whereConditions.push(`p.country ILIKE $${queryParams.length}`);
      }
      
      // Add buying party filter if provided
      if (req.query.buyingParty) {
        queryParams.push(`%${req.query.buyingParty}%`);
        whereConditions.push(`p.buying_party ILIKE $${queryParams.length}`);
      }
      
      // Add user_id filter if provided - THIS IS THE FIX
      if (req.query.user_id) {
        queryParams.push(req.query.user_id);
        whereConditions.push(`p.user_id = $${queryParams.length}`);
      }
      
      // Add WHERE clause if we have conditions
      if (whereConditions.length > 0) {
        query += ' WHERE ' + whereConditions.join(' AND ');
      }
      
      // Group by and order
      query += `
        GROUP BY p.id, u.email
        ORDER BY p.created_at DESC
      `;
      
      const result = await client.query(query, queryParams);
      
      console.log(`Retrieved ${result.rows.length} projects${req.query.user_id ? ` for user ${req.query.user_id}` : ''}`);
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error fetching projects:', err);
    res.status(500).json({ error: 'Failed to retrieve projects' });
  }
});

// GET all Article 6.2 projects
router.get('/article6', async (req, res) => {
  try {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT p.*, 
               u.email as owner_email,
               COUNT(d.id) as document_count
        FROM projects p
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN documents d ON p.id = d.project_id
        WHERE p.article6_compliant = true
        GROUP BY p.id, u.email
        ORDER BY p.created_at DESC
      `;
      
      const result = await client.query(query);
      
      console.log(`Retrieved ${result.rows.length} Article 6.2 projects`);
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error fetching Article 6.2 projects:', err);
    res.status(500).json({ error: 'Failed to retrieve Article 6.2 projects' });
  }
});

// GET user's saved projects including Article 6.2 projects
// FIXED: Changed from /saved to /user/saved to match frontend calls
router.get('/user/saved', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`Fetching saved projects for user ID: ${userId}`);
    
    // Modified query to include Article 6.2 projects alongside regular projects
    const query = `
      SELECT p.*, 
             u.email as owner_email,
             COUNT(d.id) as document_count,
             sp.saved_at
      FROM saved_projects sp
      JOIN projects p ON sp.project_id = p.id
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN documents d ON p.id = d.project_id
      WHERE sp.user_id = $1
      GROUP BY p.id, u.email, sp.saved_at
      ORDER BY sp.saved_at DESC
    `;
    
    console.log('Executing saved projects query with user ID:', userId);
    
    const client = await pool.connect();
    try {
      const result = await client.query(query, [userId]);
      console.log(`Found ${result.rows.length} saved projects for user ${userId}`);
      
      // Important: Return the array directly, not an object with a projects property
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching saved projects:', error);
    console.error('Error details:', error.stack);
    res.status(500).json({ 
      message: 'Server error fetching saved projects',
      error: error.message 
    });
  }
});

// LEGACY: Keep the old /saved route for backward compatibility
router.get('/saved', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`Fetching saved projects for user ID: ${userId} (legacy route)`);
    
    // Modified query to include Article 6.2 projects alongside regular projects
    const query = `
      SELECT p.*, 
             u.email as owner_email,
             COUNT(d.id) as document_count,
             sp.saved_at
      FROM saved_projects sp
      JOIN projects p ON sp.project_id = p.id
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN documents d ON p.id = d.project_id
      WHERE sp.user_id = $1
      GROUP BY p.id, u.email, sp.saved_at
      ORDER BY sp.saved_at DESC
    `;
    
    console.log('Executing saved projects query with user ID:', userId);
    
    const client = await pool.connect();
    try {
      const result = await client.query(query, [userId]);
      console.log(`Found ${result.rows.length} saved projects for user ${userId}`);
      
      // Important: Return the array directly, not an object with a projects property
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching saved projects:', error);
    console.error('Error details:', error.stack);
    res.status(500).json({ 
      message: 'Server error fetching saved projects',
      error: error.message 
    });
  }
});

// GET user's saved Article 6.2 projects 
router.get('/saved/article6', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`Fetching saved Article 6.2 projects for user ID: ${userId}`);
    
    const query = `
      SELECT p.*, 
             u.email as owner_email,
             COUNT(d.id) as document_count,
             sp.saved_at
      FROM saved_projects sp
      JOIN projects p ON sp.project_id = p.id
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN documents d ON p.id = d.project_id
      WHERE sp.user_id = $1 AND p.article6_compliant = true
      GROUP BY p.id, u.email, sp.saved_at
      ORDER BY sp.saved_at DESC
    `;
    
    const client = await pool.connect();
    try {
      const result = await client.query(query, [userId]);
      console.log(`Found ${result.rows.length} saved Article 6.2 projects for user ${userId}`);
      
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching saved Article 6.2 projects:', error);
    res.status(500).json({ 
      message: 'Server error fetching saved Article 6.2 projects',
      error: error.message 
    });
  }
});

// GET user's projects
router.get('/my-projects', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`Fetching projects for user ID: ${userId}`);
    
    const query = `
      SELECT p.*, 
             u.email as owner_email,
             COUNT(d.id) as document_count
      FROM projects p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN documents d ON p.id = d.project_id
      WHERE p.user_id = $1
      GROUP BY p.id, u.email
      ORDER BY p.created_at DESC
    `;
    
    const client = await pool.connect();
    try {
      const result = await client.query(query, [userId]);
      console.log(`Found ${result.rows.length} projects for user ${userId}`);
      
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching user projects:', error);
    res.status(500).json({ 
      message: 'Server error fetching user projects',
      error: error.message 
    });
  }
});

// GET project by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT p.*, 
               u.email as owner_email,
               COUNT(d.id) as document_count
        FROM projects p
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN documents d ON p.id = d.project_id
        WHERE p.id = $1
        GROUP BY p.id, u.email
      `;
      
      const result = await client.query(query, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      res.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error fetching project by ID:', err);
    res.status(500).json({ error: 'Failed to retrieve project' });
  }
});

// Create a new project with credit pricing support and proper number handling
router.post('/', authMiddleware, async (req, res) => {
  try {
    // Extract project data from request
    const {
      name,
      description,
      category,
      location,
      status,
      reduction_target,
      budget,
      timeline,
      requirements,
      project_type,
      article6_compliant,
      bilateral_agreements,
      sdg_goals,
      implementing_agency,
      verification_standard,
      project_link,
      host_country,
      buying_party,
      // Credit pricing fields
      credit_price,
      credit_price_currency,
      credit_price_type,
      minimum_purchase,
      price_valid_until,
      bulk_discounts
    } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }
    
    const client = await pool.connect();
    
    try {
      // Insert the project with all fields including credit pricing
      const query = `
        INSERT INTO projects (
          name,
          description,
          category,
          location,
          status,
          reduction_target,
          user_id,
          article6_compliant,
          bilateral_agreements,
          sdg_goals,
          implementing_agency,
          verification_standard,
          project_link,
          host_country,
          buying_party,
          budget,
          timeline,
          requirements,
          project_type,
          credit_price,
          credit_price_currency,
          credit_price_type,
          minimum_purchase,
          price_valid_until,
          bulk_discounts,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, NOW(), NOW())
        RETURNING *
      `;
      
      const values = [
        name,
        description,
        category,
        location,
        status || 'Draft',
        toNumericOrNull(reduction_target),  // Convert to number or null
        req.user.id, // From auth middleware
        article6_compliant || false,
        JSON.stringify(bilateral_agreements || []),
        JSON.stringify(sdg_goals || []),
        implementing_agency,
        verification_standard,
        project_link,
        host_country,
        buying_party,
        toNumericOrNull(budget),  // Convert to number or null
        timeline ? JSON.stringify(timeline) : null,
        requirements ? JSON.stringify(requirements) : null,
        project_type || 'listing',
        toNumericOrNull(credit_price),  // Convert to number or null
        credit_price_currency || 'USD',
        credit_price_type || 'fixed',
        toNumericOrNull(minimum_purchase),  // Convert to number or null
        price_valid_until || null,
        bulk_discounts ? JSON.stringify(bulk_discounts) : null
      ];
      
      console.log('Creating project with pricing data:', {
        name,
        credit_price: toNumericOrNull(credit_price),
        credit_price_type,
        minimum_purchase: toNumericOrNull(minimum_purchase),
        price_valid_until,
        budget: toNumericOrNull(budget),
        reduction_target: toNumericOrNull(reduction_target)
      });
      
      const result = await client.query(query, values);
      
      res.status(201).json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error creating project:', err);
    res.status(500).json({ error: 'Failed to create project', details: err.message });
  }
});

// Update an existing project with credit pricing support and proper number handling
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      category,
      location,
      status,
      reduction_target,
      budget,
      timeline,
      requirements,
      project_type,
      article6_compliant,
      bilateral_agreements,
      sdg_goals,
      implementing_agency,
      verification_standard,
      project_link,
      host_country,
      buying_party,
      // Credit pricing fields
      credit_price,
      credit_price_currency,
      credit_price_type,
      minimum_purchase,
      price_valid_until,
      bulk_discounts
    } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }
    
    const client = await pool.connect();
    
    try {
      // Check if project exists
      const projectCheck = await client.query(
        'SELECT id, user_id FROM projects WHERE id = $1',
        [id]
      );
      
      if (projectCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      // Check if user owns the project or is admin
      if (projectCheck.rows[0].user_id !== req.user.id && !req.user.is_admin) {
        return res.status(403).json({ error: 'Not authorized to update this project' });
      }
      
      // Update the project with all fields including credit pricing
      const query = `
        UPDATE projects
        SET
          name = $1,
          description = $2,
          category = $3,
          location = $4,
          status = $5,
          reduction_target = $6,
          article6_compliant = $7,
          bilateral_agreements = $8,
          sdg_goals = $9,
          implementing_agency = $10,
          verification_standard = $11,
          project_link = $12,
          host_country = $13,
          buying_party = $14,
          budget = $15,
          timeline = $16,
          requirements = $17,
          project_type = $18,
          credit_price = $19,
          credit_price_currency = $20,
          credit_price_type = $21,
          minimum_purchase = $22,
          price_valid_until = $23,
          bulk_discounts = $24,
          updated_at = NOW()
        WHERE id = $25
        RETURNING *
      `;
      
      const values = [
        name,
        description,
        category,
        location,
        status,
        toNumericOrNull(reduction_target),  // Convert to number or null
        article6_compliant || false,
        JSON.stringify(bilateral_agreements || []),
        JSON.stringify(sdg_goals || []),
        implementing_agency,
        verification_standard,
        project_link,
        host_country,
        buying_party,
        toNumericOrNull(budget),  // Convert to number or null
        timeline ? JSON.stringify(timeline) : null,
        requirements ? JSON.stringify(requirements) : null,
        project_type,
        toNumericOrNull(credit_price),  // Convert to number or null
        credit_price_currency || 'USD',
        credit_price_type || 'fixed',
        toNumericOrNull(minimum_purchase),  // Convert to number or null
        price_valid_until || null,
        bulk_discounts ? JSON.stringify(bulk_discounts) : null,
        id
      ];
      
      console.log('Updating project with pricing data:', {
        id,
        credit_price: toNumericOrNull(credit_price),
        credit_price_type,
        minimum_purchase: toNumericOrNull(minimum_purchase),
        price_valid_until,
        bulk_discounts,
        budget: toNumericOrNull(budget),
        reduction_target: toNumericOrNull(reduction_target)
      });
      
      const result = await client.query(query, values);
      
      res.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error updating project:', err);
    res.status(500).json({ error: 'Failed to update project', details: err.message });
  }
});

// Save any project to user's saved projects (now allows saving Article 6.2 projects)
router.post('/save/:id', authMiddleware, async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const userId = req.user.id;
    
    console.log(`Attempting to save project ${projectId} for user ${userId}`);
    
    const client = await pool.connect();
    
    try {
      // Check if project exists
      const projectCheck = await client.query(
        'SELECT id FROM projects WHERE id = $1',
        [projectId]
      );
      
      if (projectCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      // Check if already saved
      const alreadySaved = await client.query(
        'SELECT id FROM saved_projects WHERE user_id = $1 AND project_id = $2',
        [userId, projectId]
      );
      
      if (alreadySaved.rows.length > 0) {
        return res.status(200).json({ message: 'Project already saved', status: 'already_saved' });
      }
      
      // Save the project
      const query = `
        INSERT INTO saved_projects (user_id, project_id, saved_at)
        VALUES ($1, $2, NOW())
        RETURNING *
      `;
      
      const result = await client.query(query, [userId, projectId]);
      
      console.log(`Project ${projectId} saved successfully for user ${userId}`);
      res.status(201).json({
        message: 'Project saved successfully',
        saved_project: result.rows[0]
      });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error saving project:', err);
    res.status(500).json({ error: 'Failed to save project', message: err.message });
  }
});

// Save an Article 6.2 project
router.post('/save/article6/:id', authMiddleware, async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const userId = req.user.id;
    
    const client = await pool.connect();
    
    try {
      // Check if project exists and is an Article 6.2 project
      const projectCheck = await client.query(
        'SELECT id FROM projects WHERE id = $1 AND article6_compliant = true',
        [projectId]
      );
      
      if (projectCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Article 6.2 project not found' });
      }
      
      // Check if already saved
      const alreadySaved = await client.query(
        'SELECT id FROM saved_projects WHERE user_id = $1 AND project_id = $2',
        [userId, projectId]
      );
      
      if (alreadySaved.rows.length > 0) {
        return res.status(409).json({ error: 'Project already saved', status: 'already_saved' });
      }
      
      // Save the Article 6.2 project
      const query = `
        INSERT INTO saved_projects (user_id, project_id, saved_at)
        VALUES ($1, $2, NOW())
        RETURNING *
      `;
      
      const result = await client.query(query, [userId, projectId]);
      
      res.status(201).json({
        message: 'Article 6.2 project saved successfully',
        saved_project: result.rows[0]
      });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error saving Article 6.2 project:', err);
    res.status(500).json({ error: 'Failed to save Article 6.2 project' });
  }
});

// Unsave a project (regular or Article 6.2)
router.delete('/unsave/:id', authMiddleware, async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const userId = req.user.id;
    
    console.log(`Attempting to unsave project ${projectId} for user ${userId}`);
    
    const client = await pool.connect();
    
    try {
      // Delete the saved project
      const result = await client.query(
        'DELETE FROM saved_projects WHERE user_id = $1 AND project_id = $2 RETURNING *',
        [userId, projectId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Saved project not found' });
      }
      
      console.log(`Project ${projectId} unsaved successfully for user ${userId}`);
      res.json({
        message: 'Project unsaved successfully',
        unsaved_project: result.rows[0]
      });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error unsaving project:', err);
    res.status(500).json({ error: 'Failed to unsave project', message: err.message });
  }
});

// GET bilateral agreements data
router.get('/bilateral-agreements/all', async (req, res) => {
  try {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT 
          ba.id,
          ba.name,
          ba.buying_party,
          ba.host_country,
          ba.signing_date,
          ba.implementation_date,
          ba.status,
          ba.agreement_link,
          COUNT(p.id) as project_count
        FROM bilateral_agreements ba
        LEFT JOIN projects p ON p.bilateral_agreement_id = ba.id
        GROUP BY ba.id
        ORDER BY ba.signing_date DESC
      `;
      
      const result = await client.query(query);
      
      console.log(`Retrieved ${result.rows.length} bilateral agreements`);
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error fetching bilateral agreements:', err);
    res.status(500).json({ error: 'Failed to retrieve bilateral agreements' });
  }
});

module.exports = router;