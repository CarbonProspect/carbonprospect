// routes/marketplace.js - Fixed version for assessment-projects/:projectId/products
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const pool = require('../db/pool');

// Helper function to check if a column exists in a table
async function columnExists(tableName, columnName) {
  const result = await pool.query(
    `SELECT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = $1 
      AND column_name = $2
    )`,
    [tableName, columnName]
  );
  
  return result.rows[0].exists;
}

/**
 * @route   GET /api/marketplace/products
 * @desc    Get all marketplace products with user information
 * @access  Public
 */
router.get('/products', async (req, res) => {
  try {
    // Get query parameters for filtering
    const { category, subcategory, entry_type, search, projectType } = req.query;
    
    console.log('Query parameters:', { category, subcategory, entry_type, search, projectType });
    
    // Check for required columns
    const hasCategory = await columnExists('marketplace_products', 'category');
    const hasSubcategory = await columnExists('marketplace_products', 'subcategory');
    const hasEntryType = await columnExists('marketplace_products', 'entry_type');
    const hasCreatedAt = await columnExists('marketplace_products', 'created_at');
    const hasUpdatedAt = await columnExists('marketplace_products', 'updated_at');
    const hasProjectTypes = await columnExists('marketplace_products', 'project_types');
    const hasUserId = await columnExists('marketplace_products', 'user_id');
    const hasPricingModel = await columnExists('marketplace_products', 'pricing_model');
    
    console.log('Column check:', { 
      hasCategory, 
      hasSubcategory, 
      hasEntryType, 
      hasCreatedAt, 
      hasUpdatedAt,
      hasProjectTypes,
      hasUserId,
      hasPricingModel
    });
    
    // Build query based on filters - UPDATED to include user_id
    let query = `
      SELECT mp.*`;
    
    // If user_id column doesn't exist, try to get it from provider_profiles
    if (!hasUserId) {
      query += `, pp.user_id`;
    }
    
    query += `
      FROM marketplace_products mp
    `;
    
    // Join with provider_profiles if needed
    if (!hasUserId) {
      query += `
      LEFT JOIN provider_profiles pp ON mp.company_name = pp.company_name
      `;
    }
    
    query += `WHERE 1=1`;
    
    const queryParams = [];
    let paramIndex = 1;
    
    // Add filters if provided AND columns exist
    if (category && hasCategory) {
      query += ` AND mp.category = $${paramIndex++}`;
      queryParams.push(category);
    }
    
    if (subcategory && hasSubcategory) {
      query += ` AND mp.subcategory = $${paramIndex++}`;
      queryParams.push(subcategory);
    }
    
    if (entry_type && hasEntryType) {
      query += ` AND mp.entry_type = $${paramIndex++}`;
      queryParams.push(entry_type);
    }
    
    // Filter by project type if provided (check both specific field and JSON array)
    if (projectType && hasProjectTypes) {
      query += ` AND mp.project_types ? $${paramIndex}`;
      queryParams.push(projectType);
      paramIndex++;
    }
    
    if (search) {
      query += ` AND (mp.name ILIKE $${paramIndex} OR mp.description ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }
    
    // Order by timestamp if available
    if (hasCreatedAt) {
      query += ` ORDER BY mp.created_at DESC`;
    } else if (hasUpdatedAt) {
      query += ` ORDER BY mp.updated_at DESC`;
    }
    
    console.log('Executing query:', query);
    console.log('With parameters:', queryParams);
    
    const result = await pool.query(query, queryParams);
    console.log(`Found ${result.rows.length} products`);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ message: 'Server error fetching products', error: err.message });
  }
});

/**
 * @route   GET /api/marketplace/products/:id
 * @desc    Get a single marketplace product with user information
 * @access  Public
 */
router.get('/products/:id', async (req, res) => {
  try {
    const hasUserId = await columnExists('marketplace_products', 'user_id');
    const hasPricingModel = await columnExists('marketplace_products', 'pricing_model');
    
    let query = `
      SELECT mp.*`;
    
    // If user_id column doesn't exist, try to get it from provider_profiles
    if (!hasUserId) {
      query += `, pp.user_id`;
    }
    
    query += `
      FROM marketplace_products mp
    `;
    
    // Join with provider_profiles if needed
    if (!hasUserId) {
      query += `
      LEFT JOIN provider_profiles pp ON mp.company_name = pp.company_name
      `;
    }
    
    query += `WHERE mp.id = $1`;
    
    const result = await pool.query(query, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({ message: 'Server error fetching product' });
  }
});

/**
 * @route   POST /api/marketplace/products
 * @desc    Create a new marketplace product
 * @access  Private (solutionProvider)
 */
router.post('/products', authenticateToken, async (req, res) => {
  try {
    // Check user role
    if (req.user.role !== 'solutionProvider' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to add products' });
    }
    
    const {
      name,
      description,
      category,
      subcategory,
      company_name,
      emissions_reduction_factor,
      implementation_time,
      image_url,
      unit_price,
      unit,
      material_type,
      implementation_guidance,
      pricing_model,
      entry_type = 'consultant'  // Default to consultant
    } = req.body;
    
    // Validate required fields
    if (!name || !description || !category) {
      return res.status(400).json({ message: 'Name, description, and category are required' });
    }
    
    // Generate a unique ID for the product
    const productId = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Check which columns exist
    const hasUpdatedAt = await columnExists('marketplace_products', 'updated_at');
    const hasCreatedAt = await columnExists('marketplace_products', 'created_at');
    const hasSubcategory = await columnExists('marketplace_products', 'subcategory');
    const hasUnitPrice = await columnExists('marketplace_products', 'unit_price');
    const hasUnit = await columnExists('marketplace_products', 'unit');
    const hasMaterialType = await columnExists('marketplace_products', 'material_type');
    const hasImplementationGuidance = await columnExists('marketplace_products', 'implementation_guidance');
    const hasEntryType = await columnExists('marketplace_products', 'entry_type');
    const hasUserId = await columnExists('marketplace_products', 'user_id');
    const hasPricingModel = await columnExists('marketplace_products', 'pricing_model');
    
    // Build columns and values dynamically based on what exists
    let columns = ['id', 'name', 'description', 'category'];
    let values = [productId, name, description, category];
    let placeholders = ['$1', '$2', '$3', '$4'];
    let index = 5;
    
    if (hasSubcategory) {
      columns.push('subcategory');
      values.push(subcategory || null);
      placeholders.push(`$${index++}`);
    }
    
    columns.push('company_name');
    values.push(company_name || null);
    placeholders.push(`$${index++}`);
    
    columns.push('emissions_reduction_factor');
    values.push(emissions_reduction_factor || 0);
    placeholders.push(`$${index++}`);
    
    columns.push('implementation_time');
    values.push(implementation_time || null);
    placeholders.push(`$${index++}`);
    
    columns.push('image_url');
    values.push(image_url || '/uploads/images/placeholder-project.jpg');
    placeholders.push(`$${index++}`);
    
    if (hasUnitPrice) {
      columns.push('unit_price');
      values.push(unit_price ? parseFloat(unit_price) : null);
      placeholders.push(`$${index++}`);
    }
    
    if (hasUnit) {
      columns.push('unit');
      values.push(unit || null);
      placeholders.push(`$${index++}`);
    }
    
    if (hasMaterialType) {
      columns.push('material_type');
      values.push(material_type || null);
      placeholders.push(`$${index++}`);
    }
    
    if (hasImplementationGuidance) {
      columns.push('implementation_guidance');
      values.push(implementation_guidance ? JSON.stringify(implementation_guidance) : '{}');
      placeholders.push(`$${index++}`);
    }
    
    if (hasEntryType) {
      columns.push('entry_type');
      values.push(entry_type);
      placeholders.push(`$${index++}`);
    }
    
    if (hasUserId) {
      columns.push('user_id');
      values.push(req.user.id);
      placeholders.push(`$${index++}`);
    }
    
    if (hasPricingModel) {
      columns.push('pricing_model');
      values.push(pricing_model || 'per_unit');
      placeholders.push(`$${index++}`);
    }
    
    // Add timestamps if they exist
    if (hasCreatedAt) {
      columns.push('created_at');
      values.push(new Date());
      placeholders.push(`$${index++}`);
    }
    
    if (hasUpdatedAt) {
      columns.push('updated_at');
      values.push(new Date());
      placeholders.push(`$${index++}`);
    }
    
    // Construct the query
    const query = `
      INSERT INTO marketplace_products (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;
    
    console.log('Insert query:', query);
    console.log('Insert values:', values);
    
    const result = await pool.query(query, values);
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ message: 'Server error creating product', error: err.message });
  }
});

/**
 * @route   GET /api/marketplace/options
 * @desc    Get marketplace filter options
 * @access  Public
 */
router.get('/options', async (req, res) => {
  try {
    // Check which columns exist
    const hasCategory = await columnExists('marketplace_products', 'category');
    const hasSubcategory = await columnExists('marketplace_products', 'subcategory');
    const hasMaterialType = await columnExists('marketplace_products', 'material_type');
    
    let categories = [];
    let subcategories = [];
    let materialTypes = [];
    
    // Only fetch options for columns that exist
    if (hasCategory) {
      const categoriesResult = await pool.query(
        'SELECT DISTINCT category FROM marketplace_products WHERE category IS NOT NULL'
      );
      categories = categoriesResult.rows.map(row => row.category);
    }
    
    if (hasSubcategory) {
      const subcategoriesResult = await pool.query(
        'SELECT DISTINCT subcategory FROM marketplace_products WHERE subcategory IS NOT NULL'
      );
      subcategories = subcategoriesResult.rows.map(row => row.subcategory);
    }
    
    if (hasMaterialType) {
      const materialTypesResult = await pool.query(
        'SELECT DISTINCT material_type FROM marketplace_products WHERE material_type IS NOT NULL'
      );
      materialTypes = materialTypesResult.rows.map(row => row.material_type);
    }
    
    res.json({
      categories,
      subcategories,
      materialTypes
    });
  } catch (err) {
    console.error('Error fetching marketplace options:', err);
    res.status(500).json({ message: 'Server error fetching options', error: err.message });
  }
});
/**
 * @route   GET /api/marketplace/assessment-projects/:projectId/products
 * @desc    Get products associated with a project
 * @access  Private
 */
router.get('/assessment-projects/:projectId/products', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // First check if the table exists
    const tableCheck = await pool.query(
      `SELECT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'assessment_project_products'
      )`
    );
    
    // If the table doesn't exist, create it
    if (!tableCheck.rows[0].exists) {
      console.log('Creating assessment_project_products table');
      await pool.query(`
        CREATE TABLE assessment_project_products (
          id SERIAL PRIMARY KEY,
          assessment_project_id INTEGER NOT NULL REFERENCES assessment_projects(id) ON DELETE CASCADE,
          product_id VARCHAR(255) NOT NULL,
          quantity INTEGER DEFAULT 1,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(assessment_project_id, product_id)
        )
      `);
    }
    
    // Check for material_type, subcategory, and unit columns
    const hasMaterialType = await columnExists('assessment_project_products', 'material_type');
    const hasSubcategory = await columnExists('assessment_project_products', 'subcategory');
    const hasUnit = await columnExists('assessment_project_products', 'unit');
    
    // Add missing columns if needed
    if (!hasMaterialType) {
      console.log('Adding material_type column to assessment_project_products');
      await pool.query('ALTER TABLE assessment_project_products ADD COLUMN material_type VARCHAR(255)');
    }
    
    if (!hasSubcategory) {
      console.log('Adding subcategory column to assessment_project_products');
      await pool.query('ALTER TABLE assessment_project_products ADD COLUMN subcategory VARCHAR(255)');
    }
    
    if (!hasUnit) {
      console.log('Adding unit column to assessment_project_products');
      await pool.query('ALTER TABLE assessment_project_products ADD COLUMN unit VARCHAR(50)');
    }
    
    // Query to get products associated with this project
    const query = `
      SELECT app.*, mp.name, mp.description, mp.category, mp.company_name,
             mp.emissions_reduction_factor, mp.image_url, mp.unit_price, mp.unit AS default_unit
      FROM assessment_project_products app
      JOIN marketplace_products mp ON app.product_id = mp.id
      WHERE app.assessment_project_id = $1
    `;
    
    const result = await pool.query(query, [projectId]);
    
    return res.json(result.rows);
  } catch (error) {
    console.error('Error fetching project products:', error);
    return res.status(500).json({ error: 'Failed to fetch project products', details: error.message });
  }
});

/**
 * @route   POST /api/marketplace/assessment-projects/:projectId/products
 * @desc    Add a product to a project
 * @access  Private
 */
router.post('/assessment-projects/:projectId/products', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { productId, quantity, notes, material_type, subcategory, unit } = req.body;
    
    console.log('Received request to add product:', { 
      projectId, 
      productId, 
      quantity, 
      notes,
      material_type,
      subcategory,
      unit
    });
    
    // Validate input
    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }
    
    // Check if the project exists
    const projectCheck = await pool.query(
      'SELECT * FROM assessment_projects WHERE id = $1',
      [projectId]
    );
    
    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Check if the product exists
    const productCheck = await pool.query(
      'SELECT * FROM marketplace_products WHERE id = $1',
      [productId]
    );
    
    if (productCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // First check if the table exists
    const tableCheck = await pool.query(
      `SELECT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'assessment_project_products'
      )`
    );
    
    // If the table doesn't exist, create it
    if (!tableCheck.rows[0].exists) {
      console.log('Creating assessment_project_products table');
      await pool.query(`
        CREATE TABLE assessment_project_products (
          id SERIAL PRIMARY KEY,
          assessment_project_id INTEGER NOT NULL REFERENCES assessment_projects(id) ON DELETE CASCADE,
          product_id VARCHAR(255) NOT NULL,
          quantity INTEGER DEFAULT 1,
          notes TEXT,
          material_type VARCHAR(255),
          subcategory VARCHAR(255),
          unit VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(assessment_project_id, product_id)
        )
      `);
    } else {
      // Check for material_type, subcategory, and unit columns
      const hasMaterialType = await columnExists('assessment_project_products', 'material_type');
      const hasSubcategory = await columnExists('assessment_project_products', 'subcategory');
      const hasUnit = await columnExists('assessment_project_products', 'unit');
      
      // Add missing columns if needed
      if (!hasMaterialType) {
        console.log('Adding material_type column to assessment_project_products');
        await pool.query('ALTER TABLE assessment_project_products ADD COLUMN material_type VARCHAR(255)');
      }
      
      if (!hasSubcategory) {
        console.log('Adding subcategory column to assessment_project_products');
        await pool.query('ALTER TABLE assessment_project_products ADD COLUMN subcategory VARCHAR(255)');
      }
      
      if (!hasUnit) {
        console.log('Adding unit column to assessment_project_products');
        await pool.query('ALTER TABLE assessment_project_products ADD COLUMN unit VARCHAR(50)');
      }
    }
    
    // Check if the product is already associated with the project
    const existingCheck = await pool.query(
      'SELECT * FROM assessment_project_products WHERE assessment_project_id = $1 AND product_id = $2',
      [projectId, productId]
    );
    
    let result;
    
    if (existingCheck.rows.length > 0) {
      // Update the existing association
      console.log('Updating existing product association');
      
      // Check which columns exist in the table
      const columns = [];
      const values = [];
      let paramIndex = 1;
      let setClause = '';
      
      if (quantity !== undefined) {
        setClause += `quantity = $${paramIndex++}, `;
        values.push(quantity);
      }
      
      if (notes !== undefined) {
        setClause += `notes = $${paramIndex++}, `;
        values.push(notes);
      }
      
      if (material_type !== undefined) {
        setClause += `material_type = $${paramIndex++}, `;
        values.push(material_type);
      }
      
      if (subcategory !== undefined) {
        setClause += `subcategory = $${paramIndex++}, `;
        values.push(subcategory);
      }
      
      if (unit !== undefined) {
        setClause += `unit = $${paramIndex++}, `;
        values.push(unit);
      }
      
      setClause += `updated_at = CURRENT_TIMESTAMP`;
      
      const updateQuery = `
        UPDATE assessment_project_products
        SET ${setClause}
        WHERE assessment_project_id = $${paramIndex++} AND product_id = $${paramIndex++}
        RETURNING *
      `;
      
      values.push(projectId, productId);
      
      console.log('Update query:', updateQuery);
      console.log('Update values:', values);
      
      result = await pool.query(updateQuery, values);
    } else {
      // Insert a new association
      console.log('Creating new product association');
      
      const columns = ['assessment_project_id', 'product_id'];
      const values = [projectId, productId];
      const placeholders = ['$1', '$2'];
      let paramIndex = 3;
      
      if (quantity !== undefined) {
        columns.push('quantity');
        values.push(quantity);
        placeholders.push(`$${paramIndex++}`);
      }
      
      if (notes !== undefined) {
        columns.push('notes');
        values.push(notes);
        placeholders.push(`$${paramIndex++}`);
      }
      
      if (material_type !== undefined) {
        columns.push('material_type');
        values.push(material_type);
        placeholders.push(`$${paramIndex++}`);
      }
      
      if (subcategory !== undefined) {
        columns.push('subcategory');
        values.push(subcategory);
        placeholders.push(`$${paramIndex++}`);
      }
      
      if (unit !== undefined) {
        columns.push('unit');
        values.push(unit);
        placeholders.push(`$${paramIndex++}`);
      }
      
      const insertQuery = `
        INSERT INTO assessment_project_products 
        (${columns.join(', ')})
        VALUES (${placeholders.join(', ')})
        RETURNING *
      `;
      
      console.log('Insert query:', insertQuery);
      console.log('Insert values:', values);
      
      result = await pool.query(insertQuery, values);
    }
    
    // Get complete product data including marketplace product details
    const productData = await pool.query(
      `SELECT app.*, mp.name, mp.description, mp.category, mp.company_name,
              mp.emissions_reduction_factor, mp.image_url, mp.unit_price, mp.unit AS default_unit
       FROM assessment_project_products app
       JOIN marketplace_products mp ON app.product_id = mp.id
       WHERE app.id = $1`,
      [result.rows[0].id]
    );
    
    const statusCode = existingCheck.rows.length > 0 ? 200 : 201;
    return res.status(statusCode).json(productData.rows[0]);
  } catch (error) {
    console.error('Error adding product to project:', error);
    return res.status(500).json({ error: 'Failed to add product to project', details: error.message });
  }
});

/**
 * @route   DELETE /api/marketplace/assessment-projects/:projectId/products/:productId
 * @desc    Remove a product from a project
 * @access  Private
 */
router.delete('/assessment-projects/:projectId/products/:productId', authenticateToken, async (req, res) => {
  try {
    const { projectId, productId } = req.params;
    
    // Check if the table exists before attempting to delete
    const tableCheck = await pool.query(
      `SELECT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'assessment_project_products'
      )`
    );
    
    if (!tableCheck.rows[0].exists) {
      return res.status(404).json({ error: 'Project products table not found' });
    }
    
    const query = `
      DELETE FROM assessment_project_products 
      WHERE assessment_project_id = $1 AND product_id = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [projectId, productId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found in project' });
    }
    
    return res.json({ success: true, message: 'Product removed from project' });
  } catch (error) {
    console.error('Error removing product from project:', error);
    return res.status(500).json({ error: 'Failed to remove product from project', details: error.message });
  }
});

/**
 * @route   GET /api/marketplace/saved
 * @desc    Get all saved marketplace products for the current user
 * @access  Private
 */
router.get('/saved', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // First, check if the saved_marketplace_products table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'saved_marketplace_products'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      // Create the table if it doesn't exist
      await pool.query(`
        CREATE TABLE saved_marketplace_products (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          product_id VARCHAR(255) NOT NULL,
          saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, product_id)
        );
      `);
      
      // Create indexes for better performance
      await pool.query(`
        CREATE INDEX idx_saved_marketplace_user ON saved_marketplace_products(user_id);
        CREATE INDEX idx_saved_marketplace_product ON saved_marketplace_products(product_id);
      `);
    }
    
    // Fetch saved products with full product details
    const result = await pool.query(`
      SELECT 
        mp.*,
        smp.saved_at
      FROM saved_marketplace_products smp
      JOIN marketplace_products mp ON smp.product_id = mp.id
      WHERE smp.user_id = $1
      ORDER BY smp.saved_at DESC
    `, [userId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching saved products:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * @route   POST /api/marketplace/save/:productId
 * @desc    Save a marketplace product to user's dashboard
 * @access  Private
 */
router.post('/save/:productId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = req.params.productId;
    
    // Check if product exists
    const productCheck = await pool.query(
      'SELECT id FROM marketplace_products WHERE id = $1',
      [productId]
    );
    
    if (productCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Check if the saved_marketplace_products table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'saved_marketplace_products'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      // Create the table if it doesn't exist
      await pool.query(`
        CREATE TABLE saved_marketplace_products (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          product_id VARCHAR(255) NOT NULL,
          saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, product_id)
        );
      `);
    }
    
    // Check if already saved
    const existingCheck = await pool.query(
      'SELECT id FROM saved_marketplace_products WHERE user_id = $1 AND product_id = $2',
      [userId, productId]
    );
    
    if (existingCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Product already saved' });
    }
    
    // Save the product
    const result = await pool.query(
      'INSERT INTO saved_marketplace_products (user_id, product_id) VALUES ($1, $2) RETURNING *',
      [userId, productId]
    );
    
    res.status(201).json({ 
      message: 'Product saved successfully', 
      saved: result.rows[0] 
    });
  } catch (err) {
    console.error('Error saving product:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * @route   DELETE /api/marketplace/save/:productId
 * @desc    Remove a saved marketplace product from user's dashboard
 * @access  Private
 */
router.delete('/save/:productId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = req.params.productId;
    
    // Delete the saved product
    const result = await pool.query(
      'DELETE FROM saved_marketplace_products WHERE user_id = $1 AND product_id = $2 RETURNING *',
      [userId, productId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Saved product not found' });
    }
    
    res.json({ message: 'Product removed from saved items' });
  } catch (err) {
    console.error('Error removing saved product:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Export the router
module.exports = router;