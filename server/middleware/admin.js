// Middleware to check if a user has admin privileges
const pool = require('../db/pool');

/**
 * Simple middleware to verify admin status
 * Used for admin-only routes
 */
const adminMiddleware = async (req, res, next) => {
  try {
    // Ensure user is authenticated first
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required for this action' });
    }
    
    // Query the database to check user role
    const result = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userRole = result.rows[0].role;
    
    // Check if the user has admin role
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Admin privileges required for this action' });
    }
    
    // User is an admin, proceed
    next();
  } catch (err) {
    console.error('Error in admin middleware:', err);
    res.status(500).json({ error: 'Server error checking admin privileges' });
  }
};

module.exports = adminMiddleware;