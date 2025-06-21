// routes/assessmentProjectRoutes.js
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const pool = require('../db/pool');

// Add debug logging middleware for all route access
router.use((req, res, next) => {
  console.log(`SCENARIO ROUTE ACCESS: ${req.method} ${req.originalUrl}`);
  next();
});

/**
 * @route   GET /api/assessment-projects
 * @desc    Get all assessment projects for the current user
 * @access  Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, category, status, location, reduction_target as "reductionTarget", 
              budget, timeline_start, timeline_end, created_at, updated_at
       FROM assessment_projects 
       WHERE user_id = $1
       ORDER BY updated_at DESC`,
      [req.user.id]
    );

    // Convert snake_case to camelCase
    const projects = result.rows.map(project => ({
      id: project.id,
      name: project.name,
      category: project.category,
      status: project.status,
      location: project.location,
      reductionTarget: project.reductionTarget,
      budget: project.budget,
      timeline: {
        start: project.timeline_start,
        end: project.timeline_end
      },
      createdAt: project.created_at,
      updatedAt: project.updated_at
    }));

    res.json(projects);
  } catch (err) {
    console.error('Error fetching assessment projects:', err);
    res.status(500).json({ error: 'Server error fetching projects' });
  }
});

/**
 * @route   GET /api/assessment-projects/:id
 * @desc    Get a specific assessment project by ID
 * @access  Private
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    // First, check if the project exists and belongs to the user
    const projectResult = await pool.query(
      `SELECT * FROM assessment_projects WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found or access denied' });
    }

    // Get the project details
    const detailsResult = await pool.query(
      `SELECT * FROM assessment_project_details WHERE project_id = $1`,
      [req.params.id]
    );

    // Format the response
    const project = projectResult.rows[0];
    const details = detailsResult.rows[0] || {};
    
    // Format the response with camelCase
    const formattedProject = {
      id: project.id,
      name: project.name,
      description: project.description,
      category: project.category,
      status: project.status,
      location: project.location || '',
      reductionTarget: project.reduction_target,
      budget: project.budget,
      timeline: {
        start: project.timeline_start,
        end: project.timeline_end
      },
      createdAt: project.created_at,
      updatedAt: project.updated_at,
      
      // Add details
      projectType: details.project_type,
      projectSize: details.project_size,
      carbonCreditPrice: details.carbon_credit_price,
      projectYears: details.project_years,
      discountRate: details.discount_rate,
      configData: details.config_data,
      resultsData: details.results_data,
      serializedState: details.serialized_state
    };

    res.json(formattedProject);
  } catch (err) {
    console.error('Error fetching assessment project:', err);
    res.status(500).json({ error: 'Server error fetching project' });
  }
});

/**
 * @route   POST /api/assessment-projects
 * @desc    Create a new assessment project
 * @access  Private
 */
router.post('/', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Extract the base project data
    const { 
      name, description, category, status = 'Draft', location = '', 
      reductionTarget = 0, budget = 0, timeline = {} 
    } = req.body;
    
    // Insert into assessment_projects table
    const projectResult = await client.query(
      `INSERT INTO assessment_projects 
       (user_id, name, description, category, status, location, reduction_target, budget, timeline_start, timeline_end)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        req.user.id, name, description, category, status, location, 
        reductionTarget, budget, timeline.start || null, timeline.end || null
      ]
    );
    
    const projectId = projectResult.rows[0].id;
    
    // Extract project details for the assessment_project_details table
    const { 
      projectType, projectSize, carbonCreditPrice, projectYears, discountRate,
      configData, resultsData, serializedState
    } = req.body;
    
    // Insert into assessment_project_details table
    await client.query(
      `INSERT INTO assessment_project_details
       (project_id, project_type, project_size, carbon_credit_price, project_years, discount_rate, 
        config_data, results_data, serialized_state)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        projectId, projectType, projectSize, carbonCreditPrice, projectYears, discountRate,
        configData ? JSON.stringify(configData) : null,
        resultsData ? JSON.stringify(resultsData) : null,
        serializedState ? JSON.stringify(serializedState) : null
      ]
    );
    
    // Commit the transaction
    await client.query('COMMIT');
    
    // Format the response
    const createdProject = {
      ...projectResult.rows[0],
      timeline: {
        start: projectResult.rows[0].timeline_start,
        end: projectResult.rows[0].timeline_end
      },
      reductionTarget: projectResult.rows[0].reduction_target
    };
    
    delete createdProject.timeline_start;
    delete createdProject.timeline_end;
    delete createdProject.reduction_target;
    
    // Return the created project
    res.status(201).json(createdProject);
    
  } catch (err) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('Error creating assessment project:', err);
    res.status(500).json({ error: 'Failed to create project' });
  } finally {
    // Release the client
    client.release();
  }
});

/**
 * @route   PUT /api/assessment-projects/:id
 * @desc    Update an existing assessment project
 * @access  Private
 */
router.put('/:id', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Check if the project exists and belongs to the user
    const checkResult = await client.query(
      `SELECT id FROM assessment_projects WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    
    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Project not found or access denied' });
    }
    
    // Extract the base project data
    const { 
      name, description, category, status, location, 
      reductionTarget, budget, timeline = {} 
    } = req.body;
    
    // Update the assessment_projects table
    const projectResult = await client.query(
      `UPDATE assessment_projects 
       SET name = $1, description = $2, category = $3, status = $4, location = $5,
           reduction_target = $6, budget = $7, timeline_start = $8, timeline_end = $9,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING *`,
      [
        name, description, category, status, location, 
        reductionTarget, budget, timeline.start || null, timeline.end || null,
        req.params.id
      ]
    );
    
    // Extract project details for the assessment_project_details table
    const { 
      projectType, projectSize, carbonCreditPrice, projectYears, discountRate,
      configData, resultsData, serializedState
    } = req.body;
    
    // Check if details record exists
    const detailsExistQuery = await client.query(
      `SELECT id FROM assessment_project_details WHERE project_id = $1`,
      [req.params.id]
    );
    
    if (detailsExistQuery.rows.length > 0) {
      // Update existing record
      await client.query(
        `UPDATE assessment_project_details
         SET project_type = $1, project_size = $2, carbon_credit_price = $3, 
             project_years = $4, discount_rate = $5, config_data = $6,
             results_data = $7, serialized_state = $8, updated_at = CURRENT_TIMESTAMP
         WHERE project_id = $9`,
        [
          projectType, projectSize, carbonCreditPrice, projectYears, discountRate,
          configData ? JSON.stringify(configData) : null,
          resultsData ? JSON.stringify(resultsData) : null,
          serializedState ? JSON.stringify(serializedState) : null,
          req.params.id
        ]
      );
    } else {
      // Insert new record
      await client.query(
        `INSERT INTO assessment_project_details
         (project_id, project_type, project_size, carbon_credit_price, project_years, discount_rate, 
          config_data, results_data, serialized_state)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          req.params.id, projectType, projectSize, carbonCreditPrice, projectYears, discountRate,
          configData ? JSON.stringify(configData) : null,
          resultsData ? JSON.stringify(resultsData) : null,
          serializedState ? JSON.stringify(serializedState) : null
        ]
      );
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    
    // Format the response
    const updatedProject = {
      ...projectResult.rows[0],
      timeline: {
        start: projectResult.rows[0].timeline_start,
        end: projectResult.rows[0].timeline_end
      },
      reductionTarget: projectResult.rows[0].reduction_target
    };
    
    delete updatedProject.timeline_start;
    delete updatedProject.timeline_end;
    delete updatedProject.reduction_target;
    
    // Return the updated project
    res.json(updatedProject);
    
  } catch (err) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('Error updating assessment project:', err);
    res.status(500).json({ error: 'Failed to update project' });
  } finally {
    // Release the client
    client.release();
  }
});

/**
 * @route   DELETE /api/assessment-projects/:id
 * @desc    Delete an assessment project
 * @access  Private
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Check if the project exists and belongs to the user
    const checkResult = await client.query(
      `SELECT id FROM assessment_projects WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    
    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Project not found or access denied' });
    }
    
    // Delete all scenarios associated with the project
    await client.query(
      `DELETE FROM assessment_project_scenarios WHERE project_id = $1`,
      [req.params.id]
    );
    
    // Delete project details
    await client.query(
      `DELETE FROM assessment_project_details WHERE project_id = $1`,
      [req.params.id]
    );
    
    // Delete the project
    await client.query(
      `DELETE FROM assessment_projects WHERE id = $1`,
      [req.params.id]
    );
    
    // Commit the transaction
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: 'Project successfully deleted'
    });
    
  } catch (err) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('Error deleting assessment project:', err);
    res.status(500).json({ error: 'Failed to delete project' });
  } finally {
    // Release the client
    client.release();
  }
});

/**
 * @route   GET /api/assessment-projects/:id/scenarios
 * @desc    Get all scenarios for a specific project
 * @access  Private
 */
router.get('/:id/scenarios', authenticateToken, async (req, res) => {
  try {
    console.log(`Fetching scenarios for project: ${req.params.id}, user: ${req.user.id}`);
    
    // Check if the project exists and belongs to the user
    const projectResult = await pool.query(
      `SELECT id FROM assessment_projects WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    
    if (projectResult.rows.length === 0) {
      console.log(`Project ${req.params.id} not found or access denied for user ${req.user.id}`);
      return res.status(404).json({ error: 'Project not found or access denied' });
    }

    // Check if the assessment_project_scenarios table exists
    const tableCheckResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'assessment_project_scenarios'
      )
    `);
    
    const tableExists = tableCheckResult.rows[0].exists;
    
    if (!tableExists) {
      console.error("Table assessment_project_scenarios does not exist");
      
      // Create the table if it doesn't exist
      await pool.query(`
        CREATE TABLE assessment_project_scenarios (
          id SERIAL PRIMARY KEY,
          project_id INTEGER NOT NULL REFERENCES assessment_projects(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          data JSONB,
          results JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      console.log("Created assessment_project_scenarios table");
      
      // Return empty array since the table was just created
      return res.json([]);
    }

    // Get all scenarios for the project
    const scenariosResult = await pool.query(
      `SELECT ps.id, ps.name, ps.description, ps.data, ps.results, ps.created_at, ps.updated_at
       FROM assessment_project_scenarios ps
       WHERE ps.project_id = $1
       ORDER BY ps.updated_at DESC`,
      [req.params.id]
    );
    
    console.log(`Found ${scenariosResult.rows.length} scenarios for project ${req.params.id}`);
    
    // Convert the data for each scenario
    const scenarios = scenariosResult.rows.map(scenario => {
      // Parse JSON data if available
      let data = {};
      let results = null;
      
      try {
        if (scenario.data) {
          data = typeof scenario.data === 'string' ? JSON.parse(scenario.data) : scenario.data;
        }
        if (scenario.results) {
          results = typeof scenario.results === 'string' ? JSON.parse(scenario.results) : scenario.results;
        }
      } catch (parseError) {
        console.error('Error parsing scenario data:', parseError);
      }
      
      return {
        id: scenario.id,
        name: scenario.name,
        description: scenario.description,
        // Include parsed data if available
        ...data,
        // Include results if available
        results,
        created_at: scenario.created_at,
        updated_at: scenario.updated_at
      };
    });
    
    res.json(scenarios);
  } catch (err) {
    console.error('Error fetching project scenarios:', err);
    res.status(500).json({ error: 'Failed to fetch scenarios: ' + err.message });
  }
});

/**
 * @route   POST /api/assessment-projects/:id/scenarios
 * @desc    Create a new scenario for a project
 * @access  Private
 */
router.post('/:id/scenarios', authenticateToken, async (req, res) => {
  console.log(`Received scenario creation request for project: ${req.params.id}`);
  console.log("Request body:", JSON.stringify(req.body, null, 2));
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Check if project exists and belongs to user
    const projectResult = await client.query(
      `SELECT id FROM assessment_projects WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    
    if (projectResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Project not found or access denied' });
    }
    
    // Check if the assessment_project_scenarios table exists
    const tableCheckResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'assessment_project_scenarios'
      )
    `);
    
    const tableExists = tableCheckResult.rows[0].exists;
    
    if (!tableExists) {
      console.log("Creating assessment_project_scenarios table");
      
      // Create the table if it doesn't exist
      await client.query(`
        CREATE TABLE assessment_project_scenarios (
          id SERIAL PRIMARY KEY,
          project_id INTEGER NOT NULL REFERENCES assessment_projects(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          data JSONB,
          results JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      console.log("Created assessment_project_scenarios table");
    }
    
    // Get scenario data from request
    const { scenario } = req.body;
    
    if (!scenario) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No scenario data provided' });
    }
    
    // Extract basic fields
    const name = scenario.name || 'New Scenario';
    const description = scenario.description || '';
    
    // Separate scenario data and results
    const { results, ...scenarioData } = scenario;
    
    console.log(`Saving scenario "${name}" for project ${req.params.id}`);
    
    // Insert the scenario
    const insertResult = await client.query(
      `INSERT INTO assessment_project_scenarios
       (project_id, name, description, data, results)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, description, created_at, updated_at`,
      [
        req.params.id,
        name,
        description,
        JSON.stringify(scenarioData),
        results ? JSON.stringify(results) : null
      ]
    );
    
    // Commit the transaction
    await client.query('COMMIT');
    
    // Return the created scenario
    const createdScenario = {
      ...insertResult.rows[0],
      ...scenarioData,
      results
    };
    
    console.log(`Successfully created scenario with ID: ${createdScenario.id}`);
    
    res.status(201).json(createdScenario);
  } catch (err) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('Error creating scenario:', err);
    res.status(500).json({ error: 'Failed to create scenario: ' + err.message });
  } finally {
    // Release the client
    client.release();
  }
});

/**
 * @route   PUT /api/assessment-projects/:id/scenarios/:scenarioId
 * @desc    Update an existing scenario
 * @access  Private
 */
router.put('/:id/scenarios/:scenarioId', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Check if project exists and belongs to user
    const projectResult = await client.query(
      `SELECT id FROM assessment_projects WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    
    if (projectResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Project not found or access denied' });
    }
    
    // Check if scenario exists and belongs to the project
    const scenarioResult = await client.query(
      `SELECT id FROM assessment_project_scenarios 
       WHERE id = $1 AND project_id = $2`,
      [req.params.scenarioId, req.params.id]
    );
    
    if (scenarioResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Scenario not found or does not belong to this project' });
    }
    
    // Get scenario data from request
    const { scenario } = req.body;
    
    if (!scenario) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No scenario data provided' });
    }
    
    // Extract basic fields
    const name = scenario.name || 'Updated Scenario';
    const description = scenario.description || '';
    
    // Separate scenario data and results
    const { results, ...scenarioData } = scenario;
    
    // Update the scenario
    const updateResult = await client.query(
      `UPDATE assessment_project_scenarios
       SET name = $1, description = $2, data = $3, results = $4, updated_at = NOW()
       WHERE id = $5 AND project_id = $6
       RETURNING id, name, description, created_at, updated_at`,
      [
        name,
        description,
        JSON.stringify(scenarioData),
        results ? JSON.stringify(results) : null,
        req.params.scenarioId,
        req.params.id
      ]
    );
    
    // Commit the transaction
    await client.query('COMMIT');
    
    // Return the updated scenario
    const updatedScenario = {
      ...updateResult.rows[0],
      ...scenarioData,
      results
    };
    
    res.json(updatedScenario);
  } catch (err) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('Error updating scenario:', err);
    res.status(500).json({ error: 'Failed to update scenario: ' + err.message });
  } finally {
    // Release the client
    client.release();
  }
});

/**
 * @route   DELETE /api/assessment-projects/:id/scenarios/:scenarioId
 * @desc    Delete a scenario
 * @access  Private
 */
router.delete('/:id/scenarios/:scenarioId', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Check if project exists and belongs to user
    const projectResult = await client.query(
      `SELECT id FROM assessment_projects WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    
    if (projectResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Project not found or access denied' });
    }
    
    // Delete the scenario
    const deleteResult = await client.query(
      `DELETE FROM assessment_project_scenarios
       WHERE id = $1 AND project_id = $2
       RETURNING id`,
      [req.params.scenarioId, req.params.id]
    );
    
    if (deleteResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Scenario not found or does not belong to this project' });
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    
    res.json({ 
      success: true,
      message: 'Scenario successfully deleted',
      id: req.params.scenarioId
    });
  } catch (err) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('Error deleting scenario:', err);
    res.status(500).json({ error: 'Failed to delete scenario: ' + err.message });
  } finally {
    // Release the client
    client.release();
  }
});

/**
 * ASSESSMENT PROJECT PRODUCTS ROUTES
 * These routes handle the relationship between assessment projects and marketplace products
 */

/**
 * @route   GET /api/assessment-projects/:id/products
 * @desc    Get all products associated with an assessment project
 * @access  Private
 */
router.get('/:id/products', authenticateToken, async (req, res) => {
  try {
    const projectId = req.params.id;
    
    // Verify project exists and belongs to user
    const projectResult = await pool.query(
      `SELECT id FROM assessment_projects WHERE id = $1 AND user_id = $2`,
      [projectId, req.user.id]
    );
    
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found or access denied' });
    }
    
    // Check if the junction table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'assessment_project_products'
      )
    `);
    
    if (!tableExists.rows[0].exists) {
      // Create the table if it doesn't exist
      await pool.query(`
        CREATE TABLE assessment_project_products (
          id SERIAL PRIMARY KEY,
          assessment_project_id INTEGER REFERENCES assessment_projects(id) ON DELETE CASCADE,
          product_id TEXT REFERENCES marketplace_products(id) ON DELETE CASCADE,
          quantity INTEGER DEFAULT 1,
          notes TEXT,
          material_type VARCHAR(100),
          subcategory VARCHAR(100),
          unit VARCHAR(10),
          total_cost NUMERIC,
          added_by_user_id INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Return empty array since the table was just created
      return res.json([]);
    }
    
    // Get products with their quantities and notes
    const result = await pool.query(`
      SELECT 
        mp.*, 
        app.quantity, 
        app.notes,
        app.material_type,
        app.subcategory,
        app.unit,
        app.total_cost,
        app.id as project_product_id
      FROM 
        assessment_project_products app
      JOIN 
        marketplace_products mp ON app.product_id = mp.id
      WHERE 
        app.assessment_project_id = $1
      ORDER BY 
        mp.name ASC
    `, [projectId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching project products:', err);
    res.status(500).json({ error: 'Failed to fetch products: ' + err.message });
  }
});

/**
 * @route   POST /api/assessment-projects/:id/products
 * @desc    Add a product to an assessment project
 * @access  Private
 */
router.post('/:id/products', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const projectId = req.params.id;
    const { 
      product_id, 
      quantity, 
      notes,
      material_type,
      subcategory,
      unit,
      total_cost
    } = req.body;
    
    // Validate required fields
    if (!product_id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Product ID is required' });
    }
    
    // Verify project exists and belongs to user
    const projectResult = await client.query(
      `SELECT id FROM assessment_projects WHERE id = $1 AND user_id = $2`,
      [projectId, req.user.id]
    );
    
    if (projectResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Project not found or access denied' });
    }
    
    // Verify product exists
    const productResult = await client.query(
      `SELECT id FROM marketplace_products WHERE id = $1`,
      [product_id]
    );
    
    if (productResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Check if the junction table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'assessment_project_products'
      )
    `);
    
    if (!tableExists.rows[0].exists) {
      // Create the table if it doesn't exist
      await client.query(`
        CREATE TABLE assessment_project_products (
          id SERIAL PRIMARY KEY,
          assessment_project_id INTEGER REFERENCES assessment_projects(id) ON DELETE CASCADE,
          product_id TEXT REFERENCES marketplace_products(id) ON DELETE CASCADE,
          quantity INTEGER DEFAULT 1,
          notes TEXT,
          material_type VARCHAR(100),
          subcategory VARCHAR(100),
          unit VARCHAR(10),
          total_cost NUMERIC,
          added_by_user_id INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }
    
    // Check if product is already added to this project
    const existingEntry = await client.query(
      `SELECT id FROM assessment_project_products 
       WHERE assessment_project_id = $1 AND product_id = $2`,
      [projectId, product_id]
    );
    
    let result;
    
    if (existingEntry.rows.length > 0) {
      // Update existing entry
      result = await client.query(
        `UPDATE assessment_project_products 
         SET quantity = $1, notes = $2, material_type = $3, subcategory = $4, 
             unit = $5, total_cost = $6
         WHERE assessment_project_id = $7 AND product_id = $8
         RETURNING *`,
        [
          quantity || 1, 
          notes || '', 
          material_type || '',
          subcategory || '',
          unit || '',
          total_cost || 0,
          projectId, 
          product_id
        ]
      );
    } else {
      // Add product to project
      result = await client.query(
        `INSERT INTO assessment_project_products
         (assessment_project_id, product_id, quantity, notes, material_type, 
          subcategory, unit, total_cost, added_by_user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          projectId, 
          product_id, 
          quantity || 1, 
          notes || '', 
          material_type || '',
          subcategory || '',
          unit || '',
          total_cost || 0,
          req.user.id
        ]
      );
    }
    
    // Get the product details to return
    const productDetails = await client.query(
      `SELECT * FROM marketplace_products WHERE id = $1`,
      [product_id]
    );
    
    // Commit the transaction
    await client.query('COMMIT');
    
    // Combine product details with relationship data
    const response = {
      ...productDetails.rows[0],
      quantity: result.rows[0].quantity,
      notes: result.rows[0].notes,
      material_type: result.rows[0].material_type,
      subcategory: result.rows[0].subcategory,
      unit: result.rows[0].unit,
      total_cost: result.rows[0].total_cost,
      project_product_id: result.rows[0].id
    };
    
    res.status(201).json(response);
  } catch (err) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('Error adding product to project:', err);
    res.status(500).json({ error: 'Failed to add product: ' + err.message });
  } finally {
    // Release the client
    client.release();
  }
});

/**
 * @route   DELETE /api/assessment-projects/:id/products/:product_id
 * @desc    Remove a product from an assessment project
 * @access  Private
 */
router.delete('/:id/products/:product_id', authenticateToken, async (req, res) => {
  try {
    const projectId = req.params.id;
    const productId = req.params.product_id;
    
    // Verify project exists and belongs to user
    const projectResult = await pool.query(
      `SELECT id FROM assessment_projects WHERE id = $1 AND user_id = $2`,
      [projectId, req.user.id]
    );
    
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found or access denied' });
    }
    
    // Check if the junction table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'assessment_project_products'
      )
    `);
    
    if (!tableExists.rows[0].exists) {
      return res.status(404).json({ error: 'Product not found in project' });
    }
    
    // Remove product from project
    const deleteResult = await pool.query(
      `DELETE FROM assessment_project_products
       WHERE assessment_project_id = $1 AND product_id = $2
       RETURNING id`,
      [projectId, productId]
    );
    
    if (deleteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found in project' });
    }
    
    res.json({ 
      success: true,
      message: 'Product successfully removed from project',
      product_id: productId
    });
  } catch (err) {
    console.error('Error removing product from project:', err);
    res.status(500).json({ error: 'Failed to remove product: ' + err.message });
  }
});

module.exports = router;