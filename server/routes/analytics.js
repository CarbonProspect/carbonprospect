// routes/analytics.js
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const pool = require('../db/pool');

/**
 * @route   POST /api/analytics/product/:productId/view
 * @desc    Track a product view
 * @access  Public (but records user if authenticated)
 */
router.post('/product/:productId/view', async (req, res) => {
  try {
    const { productId } = req.params;
    const { referrer } = req.body;
    
    // Get user ID if authenticated
    let userId = null;
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (err) {
        // Continue without user ID
      }
    }
    
    // Get IP address
    const ipAddress = req.ip || req.connection.remoteAddress;
    
    // Try to insert view (will fail silently if duplicate within same hour)
    await pool.query(
      `INSERT INTO product_views (product_id, user_id, ip_address, referrer)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (product_id, COALESCE(user_id, 0), ip_address, DATE_TRUNC('hour', viewed_at))
       DO NOTHING`,
      [productId, userId, ipAddress, referrer]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking product view:', error);
    res.status(500).json({ error: 'Failed to track view' });
  }
});

/**
 * @route   GET /api/analytics/my-products
 * @desc    Get analytics for user's products
 * @access  Private (Solution Provider)
 */
router.get('/my-products', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all products owned by this user with analytics
    const query = `
      WITH product_stats AS (
        SELECT 
          mp.id,
          mp.name,
          mp.category,
          mp.created_at,
          COUNT(DISTINCT pv.id) as total_views,
          COUNT(DISTINCT pv.user_id) as unique_viewers,
          COUNT(DISTINCT CASE 
            WHEN pv.viewed_at >= NOW() - INTERVAL '7 days' 
            THEN pv.id 
          END) as views_last_week,
          COUNT(DISTINCT CASE 
            WHEN pv.viewed_at >= NOW() - INTERVAL '30 days' 
            THEN pv.id 
          END) as views_last_month,
          COUNT(DISTINCT smp.user_id) as total_saves,
          MAX(pv.viewed_at) as last_viewed
        FROM marketplace_products mp
        LEFT JOIN product_views pv ON mp.id = pv.product_id
        LEFT JOIN saved_marketplace_products smp ON mp.id = smp.product_id
        WHERE mp.user_id = $1
        GROUP BY mp.id, mp.name, mp.category, mp.created_at
      )
      SELECT 
        *,
        CASE 
          WHEN total_views > 0 
          THEN ROUND((total_saves::numeric / total_views) * 100, 2)
          ELSE 0 
        END as save_rate
      FROM product_stats
      ORDER BY total_views DESC`;
    
    const result = await pool.query(query, [userId]);
    
    // Get view trends for sparkline charts
    const trendsQuery = `
      SELECT 
        mp.id as product_id,
        DATE_TRUNC('day', pv.viewed_at) as view_date,
        COUNT(*) as daily_views
      FROM marketplace_products mp
      LEFT JOIN product_views pv ON mp.id = pv.product_id
      WHERE mp.user_id = $1 
        AND pv.viewed_at >= NOW() - INTERVAL '30 days'
      GROUP BY mp.id, DATE_TRUNC('day', pv.viewed_at)
      ORDER BY mp.id, view_date`;
    
    const trendsResult = await pool.query(trendsQuery, [userId]);
    
    // Group trends by product
    const trends = {};
    trendsResult.rows.forEach(row => {
      if (!trends[row.product_id]) {
        trends[row.product_id] = [];
      }
      trends[row.product_id].push({
        date: row.view_date,
        views: parseInt(row.daily_views)
      });
    });
    
    // Combine results
    const products = result.rows.map(product => ({
      ...product,
      viewTrend: trends[product.id] || []
    }));
    
    res.json(products);
  } catch (error) {
    console.error('Error fetching product analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

/**
 * @route   GET /api/analytics/my-projects
 * @desc    Get analytics for user's projects
 * @access  Private
 */
router.get('/my-projects', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const query = `
      SELECT 
        p.id,
        p.title,
        p.project_type,
        p.created_at,
        COUNT(DISTINCT pv.id) as total_views,
        COUNT(DISTINCT pv.user_id) as unique_viewers,
        COUNT(DISTINCT CASE 
          WHEN pv.viewed_at >= NOW() - INTERVAL '7 days' 
          THEN pv.id 
        END) as views_last_week,
        MAX(pv.viewed_at) as last_viewed
      FROM projects p
      LEFT JOIN project_views pv ON p.id = pv.project_id
      WHERE p.user_id = $1
      GROUP BY p.id, p.title, p.project_type, p.created_at
      ORDER BY total_views DESC`;
    
    const result = await pool.query(query, [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching project analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

/**
 * @route   GET /api/analytics/product/:productId/details
 * @desc    Get detailed analytics for a specific product
 * @access  Private (Owner only)
 */
router.get('/product/:productId/details', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;
    
    // Verify ownership
    const ownerCheck = await pool.query(
      'SELECT user_id FROM marketplace_products WHERE id = $1',
      [productId]
    );
    
    if (ownerCheck.rows.length === 0 || ownerCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    // Get referrer stats
    const referrerStats = await pool.query(`
      SELECT 
        COALESCE(referrer, 'Direct') as source,
        COUNT(*) as visits
      FROM product_views
      WHERE product_id = $1
      GROUP BY referrer
      ORDER BY visits DESC
      LIMIT 10`, 
      [productId]
    );
    
    // Get hourly distribution
    const hourlyStats = await pool.query(`
      SELECT 
        EXTRACT(HOUR FROM viewed_at) as hour,
        COUNT(*) as views
      FROM product_views
      WHERE product_id = $1
      GROUP BY EXTRACT(HOUR FROM viewed_at)
      ORDER BY hour`,
      [productId]
    );
    
    // Get recent viewers (anonymized)
    const recentViewers = await pool.query(`
      SELECT 
        pv.viewed_at,
        CASE 
          WHEN u.id IS NOT NULL THEN u.user_type
          ELSE 'Anonymous'
        END as viewer_type,
        pv.referrer
      FROM product_views pv
      LEFT JOIN users u ON pv.user_id = u.id
      WHERE pv.product_id = $1
      ORDER BY pv.viewed_at DESC
      LIMIT 50`,
      [productId]
    );
    
    res.json({
      referrerStats: referrerStats.rows,
      hourlyDistribution: hourlyStats.rows,
      recentActivity: recentViewers.rows
    });
  } catch (error) {
    console.error('Error fetching detailed analytics:', error);
    res.status(500).json({ error: 'Failed to fetch detailed analytics' });
  }
});

module.exports = router;