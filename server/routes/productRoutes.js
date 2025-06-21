const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Import pool directly without destructuring to match your pattern
const pool = require('../db/pool');

// JWT Secret Key - should match the one used in auth.js
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Authentication middleware (same as in other route files)
const auth = (req, res, next) => {
  // Get token from header
  const token = req.header('Authorization')?.replace('Bearer ', '');

  // Check if not token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Set user from token payload
    req.user = decoded.user;
    next();
  } catch (err) {
    console.error('Token validation error:', err.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

/**
 * @route   GET /api/products
 * @desc    Get all products (solutions) with pagination and filtering
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    // Get query parameters for filtering and pagination
    const { category, search, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const pageSize = parseInt(limit);
    const offset = (pageNum - 1) * pageSize;
    
    // Build query with pagination
    let query = `
      SELECT p.*, 
        u.first_name || ' ' || u.last_name as provider_name,
        pp.company_name as provider_company_name
      FROM marketplace_products p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN provider_profiles pp ON u.id = pp.user_id
    `;
    
    // For WHERE clause parameters
    const queryParams = [];
    let whereClause = [];
    
    // Add category filter if provided
    if (category) {
      queryParams.push(category);
      whereClause.push(`p.category = $${queryParams.length}`);
    }
    
    // Add search filter if provided
    if (search) {
      queryParams.push(`%${search}%`);
      whereClause.push(`(p.name ILIKE $${queryParams.length} OR p.description ILIKE $${queryParams.length})`);
    }
    
    // Add WHERE clause if any filters were added
    if (whereClause.length > 0) {
      query += ` WHERE ${whereClause.join(' AND ')}`;
    }
    
    // Add ordering
    query += ` ORDER BY p.created_at DESC`;
    
    // Count total matching products for pagination
    const countQuery = `
      SELECT COUNT(*) FROM marketplace_products p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN provider_profiles pp ON u.id = pp.user_id
      ${whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : ''}
    `;
    
    const countResult = await pool.query(countQuery, queryParams);
    const totalCount = parseInt(countResult.rows[0].count);
    
    // Add pagination
    query += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(pageSize, offset);
    
    const result = await pool.query(query, queryParams);
    
    // Return data with pagination metadata
    res.json({
      products: result.rows,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: pageSize,
        pages: Math.ceil(totalCount / pageSize)
      }
    });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * @route   GET /api/products/user
 * @desc    Get all products created by the logged-in user with pagination
 * @access  Private
 */
router.get('/user', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const pageSize = parseInt(limit);
    const offset = (pageNum - 1) * pageSize;
    
    // Check if user is a Solution Provider
    if (req.user.role !== 'solutionProvider') {
      return res.status(403).json({ message: 'Only solution providers can access their created products' });
    }
    
    // Count total products by this user
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM marketplace_products WHERE user_id = $1',
      [userId]
    );
    const totalCount = parseInt(countResult.rows[0].count);
    
    // Fetch products created by this user with pagination
    const result = await pool.query(
      'SELECT * FROM marketplace_products WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [userId, pageSize, offset]
    );
    
    res.json({
      products: result.rows,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: pageSize,
        pages: Math.ceil(totalCount / pageSize)
      }
    });
  } catch (err) {
    console.error('Error fetching user products:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * @route   POST /api/products
 * @desc    Create a new product (solution)
 * @access  Private
 */
router.post('/', auth, async (req, res) => {
  try {
    // Only solution providers can create products
    if (req.user.role !== 'solutionProvider') {
      return res.status(403).json({ message: 'Only solution providers can create products' });
    }
    
    const { 
      name, 
      description, 
      category, 
      subcategory,
      company_name,
      price, 
      unit_price,
      unit,
      material_type,
      features, 
      specifications,
      applicationAreas,
      emissions_reduction_factor,
      implementation_time,
      implementation_guidance,
      emissionReduction,
      image_url,
      entry_type
    } = req.body;
    
    // Validate required fields
    if (!name || !description || !category) {
      return res.status(400).json({ message: 'Name, description, and category are required' });
    }
    
    // Begin transaction
    await pool.query('BEGIN');
    
    try {
      // Check if the table has all the necessary columns
      const tableInfo = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'marketplace_products'
      `);
      
      const columns = tableInfo.rows.map(row => row.column_name);
      const hasEntryType = columns.includes('entry_type');
      const hasCreatedAt = columns.includes('created_at');
      const hasUnitPrice = columns.includes('unit_price');
      const hasUnit = columns.includes('unit');
      const hasMaterialType = columns.includes('material_type');
      const hasImplementationGuidance = columns.includes('implementation_guidance');
      
      // Prepare column and value lists for the query
      let columnList = 'user_id, name, description, category';
      let valuePlaceholders = '$1, $2, $3, $4';
      let values = [req.user.id, name, description, category];
      let index = 5;
      
      // Add optional columns if they exist in the table and are provided
      if (subcategory) {
        columnList += ', subcategory';
        valuePlaceholders += `, $${index++}`;
        values.push(subcategory);
      }
      
      if (company_name) {
        columnList += ', company_name';
        valuePlaceholders += `, $${index++}`;
        values.push(company_name);
      }
      
      if (emissions_reduction_factor !== undefined) {
        columnList += ', emissions_reduction_factor';
        valuePlaceholders += `, $${index++}`;
        values.push(emissions_reduction_factor);
      }
      
      if (implementation_time) {
        columnList += ', implementation_time';
        valuePlaceholders += `, $${index++}`;
        values.push(implementation_time);
      }
      
      if (image_url) {
        columnList += ', image_url';
        valuePlaceholders += `, $${index++}`;
        values.push(image_url);
      }
      
      if (hasUnitPrice && unit_price !== undefined) {
        columnList += ', unit_price';
        valuePlaceholders += `, $${index++}`;
        values.push(unit_price);
      }
      
      if (hasUnit && unit) {
        columnList += ', unit';
        valuePlaceholders += `, $${index++}`;
        values.push(unit);
      }
      
      if (hasMaterialType && material_type) {
        columnList += ', material_type';
        valuePlaceholders += `, $${index++}`;
        values.push(material_type);
      }
      
      if (hasImplementationGuidance && implementation_guidance) {
        columnList += ', implementation_guidance';
        valuePlaceholders += `, $${index++}`;
        values.push(JSON.stringify(implementation_guidance));
      }
      
      if (hasEntryType) {
        columnList += ', entry_type';
        valuePlaceholders += `, $${index++}`;
        values.push(entry_type || 'product');
      }
      
      if (hasCreatedAt) {
        columnList += ', created_at, updated_at';
        valuePlaceholders += `, NOW(), NOW()`;
      }
      
      // Insert new product
      const query = `
        INSERT INTO marketplace_products (${columnList}) 
        VALUES (${valuePlaceholders}) 
        RETURNING *
      `;
      
      console.log('Executing query:', query);
      console.log('With values:', values);
      
      const result = await pool.query(query, values);
      
      // Commit transaction
      await pool.query('COMMIT');
      
      res.status(201).json(result.rows[0]);
    } catch (err) {
      // Rollback transaction on error
      await pool.query('ROLLBACK');
      throw err;
    }
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * @route   GET /api/products/:id
 * @desc    Get a product by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    
    // Fetch product details
    const result = await pool.query(
      `SELECT p.*, 
        u.first_name || ' ' || u.last_name as provider_name,
        pp.company_name as provider_company_name
      FROM marketplace_products p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN provider_profiles pp ON u.id = pp.user_id
      WHERE p.id = $1`,
      [productId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Increment view count if the column exists
    const hasViewCount = await pool.query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_name = 'marketplace_products' AND column_name = 'view_count'`
    );
    
    if (hasViewCount.rows.length > 0) {
      await pool.query(
        'UPDATE marketplace_products SET view_count = COALESCE(view_count, 0) + 1 WHERE id = $1',
        [productId]
      );
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * @route   PUT /api/products/:id
 * @desc    Update a product
 * @access  Private
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const productId = req.params.id;
    
    // Check if product exists and belongs to the user
    const checkResult = await pool.query(
      'SELECT user_id FROM marketplace_products WHERE id = $1',
      [productId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    if (checkResult.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to update this product' });
    }
    
    const { 
      name, 
      description, 
      category, 
      subcategory,
      company_name,
      price, 
      unit_price,
      unit,
      material_type,
      features, 
      specifications,
      emissions_reduction_factor,
      implementation_time,
      implementation_guidance,
      image_url
    } = req.body;
    
    // Construct SET clause dynamically
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }
    
    if (category !== undefined) {
      updates.push(`category = $${paramIndex++}`);
      values.push(category);
    }
    
    if (subcategory !== undefined) {
      updates.push(`subcategory = $${paramIndex++}`);
      values.push(subcategory);
    }
    
    if (company_name !== undefined) {
      updates.push(`company_name = $${paramIndex++}`);
      values.push(company_name);
    }
    
    if (price !== undefined) {
      updates.push(`price = $${paramIndex++}`);
      values.push(price);
    }
    
    if (unit_price !== undefined) {
      updates.push(`unit_price = $${paramIndex++}`);
      values.push(unit_price);
    }
    
    if (unit !== undefined) {
      updates.push(`unit = $${paramIndex++}`);
      values.push(unit);
    }
    
    if (material_type !== undefined) {
      updates.push(`material_type = $${paramIndex++}`);
      values.push(material_type);
    }
    
    if (features !== undefined) {
      updates.push(`features = $${paramIndex++}`);
      values.push(JSON.stringify(features));
    }
    
    if (specifications !== undefined) {
      updates.push(`specifications = $${paramIndex++}`);
      values.push(JSON.stringify(specifications));
    }
    
    if (emissions_reduction_factor !== undefined) {
      updates.push(`emissions_reduction_factor = $${paramIndex++}`);
      values.push(emissions_reduction_factor);
    }
    
    if (implementation_time !== undefined) {
      updates.push(`implementation_time = $${paramIndex++}`);
      values.push(implementation_time);
    }
    
    if (implementation_guidance !== undefined) {
      updates.push(`implementation_guidance = $${paramIndex++}`);
      values.push(JSON.stringify(implementation_guidance));
    }
    
    if (image_url !== undefined) {
      updates.push(`image_url = $${paramIndex++}`);
      values.push(image_url);
    }
    
    // Add updated_at timestamp
    updates.push(`updated_at = NOW()`);
    
    // Add product ID to values array
    values.push(productId);
    
    // Update product if there are fields to update
    if (updates.length > 0) {
      const query = `
        UPDATE marketplace_products 
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      
      const result = await pool.query(query, values);
      res.json(result.rows[0]);
    } else {
      // No fields to update
      const result = await pool.query(
        'SELECT * FROM marketplace_products WHERE id = $1',
        [productId]
      );
      res.json(result.rows[0]);
    }
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete a product
 * @access  Private
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const productId = req.params.id;
    
    // Check if product exists and belongs to the user
    const checkResult = await pool.query(
      'SELECT user_id FROM marketplace_products WHERE id = $1',
      [productId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    if (checkResult.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to delete this product' });
    }
    
    // Delete product
    await pool.query('DELETE FROM marketplace_products WHERE id = $1', [productId]);
    
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;