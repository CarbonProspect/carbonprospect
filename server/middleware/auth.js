// middleware/auth.js
const jwt = require('jsonwebtoken');

// JWT Secret Key
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

const authenticateToken = (req, res, next) => {
  // Get token from header
  const token = req.header('Authorization')?.replace('Bearer ', '');

  // Check if token exists
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Set user in request - handle both formats
    // Some tokens store user data in decoded.user, others directly in decoded
    if (decoded.user) {
      req.user = decoded.user;
    } else {
      // If user data is stored directly in the decoded token
      req.user = {
        id: decoded.id || decoded.userId,
        email: decoded.email,
        username: decoded.username
      };
    }
    
    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = authenticateToken;