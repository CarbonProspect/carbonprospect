// server/routes/creditSystemRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const authenticateToken = require('../middleware/auth'); // Import the auth middleware correctly

// Credit Types API endpoint
router.get('/credit-types', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Fetching credit types');
    
    const result = await pool.query(`
      SELECT 
        credit_type_code,
        display_name,
        jurisdiction,
        registry_name,
        registry_url,
        compliance_type,
        description,
        active
      FROM credit_types 
      WHERE active = true 
      ORDER BY 
        CASE compliance_type 
          WHEN 'compliance' THEN 1 
          WHEN 'both' THEN 2 
          WHEN 'voluntary' THEN 3 
        END,
        jurisdiction,
        display_name
    `);
    
    console.log(`✅ Found ${result.rows.length} credit types`);
    res.json(result.rows);
    
  } catch (err) {
    console.error('❌ Error fetching credit types:', err);
    res.status(500).json({ 
      error: 'Failed to fetch credit types',
      message: err.message 
    });
  }
});

// Target Markets API endpoint
router.get('/target-markets', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Fetching target markets');
    
    const result = await pool.query(`
      SELECT 
        market_code,
        display_name,
        jurisdiction,
        market_type,
        eligible_credit_types,
        description,
        active
      FROM target_markets 
      WHERE active = true 
      ORDER BY 
        CASE market_type 
          WHEN 'compliance' THEN 1 
          WHEN 'both' THEN 2 
          WHEN 'voluntary' THEN 3 
        END,
        jurisdiction,
        display_name
    `);
    
    console.log(`✅ Found ${result.rows.length} target markets`);
    res.json(result.rows);
    
  } catch (err) {
    console.error('❌ Error fetching target markets:', err);
    res.status(500).json({ 
      error: 'Failed to fetch target markets',
      message: err.message 
    });
  }
});

// Enhanced projects endpoint to include credit type information
router.get('/projects-with-credits', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Fetching projects with credit information');
    
    const result = await pool.query(`
      SELECT 
        p.*,
        ct.display_name as credit_type_name,
        ct.jurisdiction as credit_jurisdiction,
        ct.compliance_type,
        ct.registry_name,
        ct.registry_url,
        ct.description as credit_type_description
      FROM projects p
      LEFT JOIN credit_types ct ON p.credit_type = ct.credit_type_code
      WHERE p.project_type = 'listing'
      ORDER BY p.updated_at DESC
    `);
    
    console.log(`✅ Found ${result.rows.length} projects with credit information`);
    res.json(result.rows);
    
  } catch (err) {
    console.error('❌ Error fetching projects with credits:', err);
    res.status(500).json({ 
      error: 'Failed to fetch projects with credit information',
      message: err.message 
    });
  }
});

// Credit compatibility check endpoint
router.get('/projects/:id/compatibility/:jurisdiction', authenticateToken, async (req, res) => {
  try {
    const { id, jurisdiction } = req.params;
    console.log(`🔍 Checking compatibility for project ${id} in ${jurisdiction}`);
    
    const result = await pool.query(`
      SELECT * FROM check_credit_compatibility($1, $2)
    `, [parseInt(id), jurisdiction]);
    
    console.log(`✅ Found compatibility data for project ${id}`);
    res.json(result.rows);
    
  } catch (err) {
    console.error('❌ Error checking compatibility:', err);
    res.status(500).json({ 
      error: 'Failed to check compatibility',
      message: err.message 
    });
  }
});

// Get project credit summary (using the view we created)
router.get('/project-credit-summary', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Fetching project credit summary');
    
    const result = await pool.query(`
      SELECT * FROM project_credit_summary
      ORDER BY name
    `);
    
    console.log(`✅ Found ${result.rows.length} projects in credit summary`);
    res.json(result.rows);
    
  } catch (err) {
    console.error('❌ Error fetching project credit summary:', err);
    res.status(500).json({ 
      error: 'Failed to fetch project credit summary',
      message: err.message 
    });
  }
});

// Debug endpoint to test database connection to new tables
router.get('/debug/credit-system', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Testing credit system database connection');
    
    // Test each table
    const creditTypesCount = await pool.query('SELECT COUNT(*) FROM credit_types');
    const targetMarketsCount = await pool.query('SELECT COUNT(*) FROM target_markets');
    const projectsWithCreditsCount = await pool.query('SELECT COUNT(*) FROM projects WHERE credit_type IS NOT NULL');
    
    const summary = {
      credit_types_count: parseInt(creditTypesCount.rows[0].count),
      target_markets_count: parseInt(targetMarketsCount.rows[0].count),
      projects_with_credits_count: parseInt(projectsWithCreditsCount.rows[0].count),
      database_connection: 'OK'
    };
    
    console.log('✅ Credit system debug summary:', summary);
    res.json(summary);
    
  } catch (err) {
    console.error('❌ Error testing credit system:', err);
    res.status(500).json({ 
      error: 'Credit system test failed',
      message: err.message 
    });
  }
});

module.exports = router;