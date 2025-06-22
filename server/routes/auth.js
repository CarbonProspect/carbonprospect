const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Import pool directly without destructuring
const pool = require('../db/pool');

// Import email service
const emailService = require('../../Services/emailService');

// Add debug logging to verify pool is properly imported
console.log('Auth routes loaded, pool type:', typeof pool);
console.log('Pool has query method:', !!pool.query);

// JWT Secret Key
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Function to get user profile information
const getUserProfileInfo = async (userId, role) => {
  try {
    // For general users, return basic profile info
    if (role === 'generalUser') {
      const profileQuery = await pool.query(
        'SELECT * FROM general_user_profiles WHERE user_id = $1',
        [userId]
      );
      
      return {
        profileId: userId, // Use userId as profileId for general users
        profileType: 'general',
        hasExtendedProfile: profileQuery.rows.length > 0
      };
    }
    
    // Try provider profile first
    let profileQuery = await pool.query(
      'SELECT id FROM provider_profiles WHERE user_id = $1',
      [userId]
    );
    
    if (profileQuery.rows.length > 0) {
      return {
        profileId: profileQuery.rows[0].id,
        profileType: 'provider'
      };
    }
    
    // Try developer profile next
    profileQuery = await pool.query(
      'SELECT id FROM developer_profiles WHERE user_id = $1',
      [userId]
    );
    
    if (profileQuery.rows.length > 0) {
      return {
        profileId: profileQuery.rows[0].id,
        profileType: 'developer'
      };
    }
    
    // Try consultant profile next
    profileQuery = await pool.query(
      'SELECT id FROM consultant_profiles WHERE user_id = $1',
      [userId]
    );
    
    if (profileQuery.rows.length > 0) {
      return {
        profileId: profileQuery.rows[0].id,
        profileType: 'consultant'
      };
    }
    
    return null;
  } catch (err) {
    console.error('Error fetching user profile info:', err);
    return null;
  }
};

/**
 * @route POST /api/auth/register
 * @desc Register a new user with email verification
 * @access Public
 */
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, profile, agreedToTerms } = req.body;
    
    console.log('Registration request received:', { firstName, lastName, email, role });
    console.log('Full profile data:', profile);
    
    // Validate required fields
    if (!firstName || !lastName || !email || !password || !role || !agreedToTerms) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Validate role
    const validRoles = ['solutionProvider', 'projectDeveloper', 'consultant', 'generalUser'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }
    
    try {
      // Check if user already exists
      const userCheckResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      
      if (userCheckResult.rows.length > 0) {
        return res.status(400).json({ message: 'User already exists' });
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      
      // Begin transaction
      await pool.query('BEGIN');
      
      try {
        // Insert user with verification token
        console.log('Inserting new user with role:', role);
        const userResult = await pool.query(
          'INSERT INTO users (first_name, last_name, email, password, role, agreed_to_terms, verification_token, is_verified) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, first_name, last_name, email, role',
          [firstName, lastName, email, hashedPassword, role, agreedToTerms, verificationToken, false]
        );
        
        const user = userResult.rows[0];
        console.log('User inserted successfully, ID:', user.id);
        
        // Insert profile based on role
        let profileId;
        let profileType;
        
        if (role === 'generalUser') {
          // For general users, use userId as profileId
          profileId = user.id;
          profileType = 'general';
          
          // If profile data provided, create general user profile
          if (profile && (profile.industry || (profile.regions && profile.regions.length > 0))) {
            console.log('Creating general user profile with optional data');
            const profileQuery = 'INSERT INTO general_user_profiles (user_id, industry, regions) VALUES ($1, $2, $3)';
            const profileValues = [
              user.id, 
              profile.industry || null, 
              JSON.stringify(profile.regions || [])
            ];
            
            await pool.query(profileQuery, profileValues);
            console.log('General user profile created');
          }
        } else if (role === 'solutionProvider') {
          console.log('Creating solution provider profile with company:', profile.companyName);
          const profileQuery = 'INSERT INTO provider_profiles (id, user_id, company_name, industry, regions) VALUES ($1, $2, $3, $4, $5) RETURNING id';
          const profileValues = [user.id, user.id, profile.companyName, profile.industry, profile.regions];
          
          console.log('Executing provider profile query:', profileQuery);
          console.log('With values:', profileValues);
          
          const profileResult = await pool.query(profileQuery, profileValues);
          profileId = profileResult.rows[0].id;
          profileType = 'provider';
          console.log('Provider profile created with ID:', profileId);
        } else if (role === 'projectDeveloper') {
          console.log('Creating project developer profile with org:', profile.organizationName);
          const profileQuery = 'INSERT INTO developer_profiles (id, user_id, organization_name, industry, regions) VALUES ($1, $2, $3, $4, $5) RETURNING id';
          const profileValues = [user.id, user.id, profile.organizationName, profile.industry, profile.regions];
          
          console.log('Executing developer profile query:', profileQuery);
          console.log('With values:', profileValues);
          
          const profileResult = await pool.query(profileQuery, profileValues);
          profileId = profileResult.rows[0].id;
          profileType = 'developer';
          console.log('Developer profile created with ID:', profileId);
        } else if (role === 'consultant') {
          console.log('Creating consultant profile with industry:', profile.industry);
          const profileQuery = 'INSERT INTO consultant_profiles (id, user_id, industry, regions) VALUES ($1, $2, $3, $4) RETURNING id';
          const profileValues = [user.id, user.id, profile.industry, profile.regions];
          
          console.log('Executing consultant profile query:', profileQuery);
          console.log('With values:', profileValues);
          
          const profileResult = await pool.query(profileQuery, profileValues);
          profileId = profileResult.rows[0].id;
          profileType = 'consultant';
          console.log('Consultant profile created with ID:', profileId);
        }
        
        // Commit transaction
        await pool.query('COMMIT');
        
        // Send verification email
        try {
          await emailService.sendVerificationEmail(email, verificationToken);
          console.log('Verification email sent to:', email);
        } catch (emailError) {
          console.error('Failed to send verification email:', emailError);
          // Continue with registration even if email fails
        }
        
        // Return success message (no token yet - user must verify email first)
        res.status(201).json({
          message: 'Registration successful! Please check your email to verify your account.',
          requiresVerification: true
        });
        
      } catch (err) {
        // Rollback transaction on error
        await pool.query('ROLLBACK');
        console.error('Database operation failed:', err.message);
        console.error(err.stack);
        throw err;
      }
    } catch (err) {
      console.error('Database query error:', err);
      throw new Error(`Database query failed: ${err.message}`);
    }
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error during registration', error: err.message });
  }
});

/**
 * @route GET /api/auth/verify-email
 * @desc Verify user email with token
 * @access Public
 */
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ message: 'Verification token is required' });
    }
    
    // Find user with this verification token
    const userResult = await pool.query(
      'SELECT id, first_name, last_name, email, role FROM users WHERE verification_token = $1',
      [token]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }
    
    const user = userResult.rows[0];
    
    // Update user as verified
    await pool.query(
      'UPDATE users SET is_verified = true, verification_token = NULL WHERE id = $1',
      [user.id]
    );
    
    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(user.email, `${user.first_name} ${user.last_name}`);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }
    
    // Get profile information
    const profileInfo = await getUserProfileInfo(user.id, user.role);
    
    // Generate JWT token for automatic login
    const payload = {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profileId: profileInfo ? profileInfo.profileId : user.id,
        profileType: profileInfo ? profileInfo.profileType : (user.role === 'generalUser' ? 'general' : null)
      }
    };
    
    jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        
        res.json({
          message: 'Email verified successfully!',
          token,
          user: {
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            role: user.role,
            profileId: profileInfo ? profileInfo.profileId : user.id,
            profileType: profileInfo ? profileInfo.profileType : (user.role === 'generalUser' ? 'general' : null),
            profile_completed: user.role === 'generalUser' ? true : (profileInfo !== null)
          }
        });
      }
    );
  } catch (err) {
    console.error('Email verification error:', err);
    res.status(500).json({ message: 'Server error during email verification' });
  }
});

/**
 * @route POST /api/auth/resend-verification
 * @desc Resend verification email
 * @access Public
 */
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    // Check if user exists and is not verified
    const userResult = await pool.query(
      'SELECT id, email, is_verified, verification_token FROM users WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    if (user.is_verified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }
    
    // Generate new verification token if needed
    let verificationToken = user.verification_token;
    if (!verificationToken) {
      verificationToken = crypto.randomBytes(32).toString('hex');
      await pool.query(
        'UPDATE users SET verification_token = $1 WHERE id = $2',
        [verificationToken, user.id]
      );
    }
    
    // Send verification email
    try {
      await emailService.sendVerificationEmail(email, verificationToken);
      res.json({ message: 'Verification email sent successfully' });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      res.status(500).json({ message: 'Failed to send verification email' });
    }
  } catch (err) {
    console.error('Resend verification error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route POST /api/auth/login
 * @desc Authenticate user & get token
 * @access Public
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }
    
    // Check if user exists
    const userResult = await pool.query(
      'SELECT id, first_name, last_name, email, password, role, is_verified FROM users WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const user = userResult.rows[0];
    
    // Check if user is verified
    if (!user.is_verified) {
      return res.status(401).json({ 
        message: 'Please verify your email before logging in',
        requiresVerification: true,
        email: user.email
      });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Get profile information
    const profileInfo = await getUserProfileInfo(user.id, user.role);
    
    // Generate JWT
    const payload = {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profileId: profileInfo ? profileInfo.profileId : user.id,
        profileType: profileInfo ? profileInfo.profileType : (user.role === 'generalUser' ? 'general' : null)
      }
    };
    
    jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        
        // Return user with token
        res.json({
          token,
          user: {
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            role: user.role,
            profileId: profileInfo ? profileInfo.profileId : user.id,
            profileType: profileInfo ? profileInfo.profileType : (user.role === 'generalUser' ? 'general' : null),
            profile_completed: user.role === 'generalUser' ? true : (profileInfo !== null)
          }
        });
      }
    );
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

/**
 * @route POST /api/auth/forgot-password
 * @desc Request password reset
 * @access Public
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    // Check if user exists
    const userResult = await pool.query(
      'SELECT id, email FROM users WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      // Don't reveal if user exists or not
      return res.json({ message: 'If an account exists with this email, you will receive a password reset link.' });
    }
    
    const user = userResult.rows[0];
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now
    
    // Save reset token to database
    await pool.query(
      'UPDATE users SET reset_password_token = $1, reset_password_expiry = $2 WHERE id = $3',
      [resetToken, resetTokenExpiry, user.id]
    );
    
    // Send password reset email
    try {
      await emailService.sendPasswordResetEmail(email, resetToken);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
    }
    
    res.json({ message: 'If an account exists with this email, you will receive a password reset link.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route POST /api/auth/reset-password
 * @desc Reset password with token
 * @access Public
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }
    
    // Find user with valid reset token
    const userResult = await pool.query(
      'SELECT id, email FROM users WHERE reset_password_token = $1 AND reset_password_expiry > $2',
      [token, new Date()]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }
    
    const user = userResult.rows[0];
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password and clear reset token
    await pool.query(
      'UPDATE users SET password = $1, reset_password_token = NULL, reset_password_expiry = NULL WHERE id = $2',
      [hashedPassword, user.id]
    );
    
    res.json({ message: 'Password reset successfully!' });
  } catch (err) {
    console.error('Password reset error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route GET /api/auth/verify-token
 * @desc Verify JWT token
 * @access Private
 */
router.get('/verify-token', async (req, res) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    // Check if token exists
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user details to confirm user still exists
    const userResult = await pool.query(
      'SELECT id, first_name, last_name, email, role FROM users WHERE id = $1',
      [decoded.user.id]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'User no longer exists' });
    }
    
    const user = userResult.rows[0];
    
    // Get profile information
    const profileInfo = await getUserProfileInfo(decoded.user.id, user.role);
    
    // Return user information with profile data
    res.json({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role,
      profileId: profileInfo ? profileInfo.profileId : user.id,
      profileType: profileInfo ? profileInfo.profileType : (user.role === 'generalUser' ? 'general' : null),
      profile_completed: user.role === 'generalUser' ? true : (profileInfo !== null)
    });
  } catch (err) {
    console.error('Token verification error:', err);
    res.status(401).json({ message: 'Token is not valid' });
  }
});

/**
 * @route GET /api/auth/create-test-user
 * @desc Test endpoint to create a test user (only for development)
 * @access Public
 */
router.get('/create-test-user', async (req, res) => {
  try {
    // Check if test user already exists
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', ['test@example.com']);
    
    if (existingUser.rows.length > 0) {
      // Check if profile exists
      const profileInfo = await getUserProfileInfo(existingUser.rows[0].id, existingUser.rows[0].role);
      
      return res.json({ 
        message: 'Test user already exists', 
        user: {
          email: 'test@example.com',
          password: 'password123',
          id: existingUser.rows[0].id,
          profileId: profileInfo ? profileInfo.profileId : existingUser.rows[0].id,
          profileType: profileInfo ? profileInfo.profileType : null
        }
      });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    // Begin transaction
    await pool.query('BEGIN');
    
    // Insert user (verified by default for test user)
    const userResult = await pool.query(
      'INSERT INTO users (first_name, last_name, email, password, role, agreed_to_terms, is_verified) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, first_name, last_name, email, role',
      ['Test', 'User', 'test@example.com', hashedPassword, 'consultant', true, true]
    );
    
    const user = userResult.rows[0];
    
    // Insert profile - using consultant profile for test user
    const regionsArray = ['North America'];
    const profileResult = await pool.query(
      'INSERT INTO consultant_profiles (id, user_id, industry, regions) VALUES ($1, $2, $3, $4) RETURNING id',
      [user.id, user.id, 'Technology', regionsArray]
    );
    
    const profileId = profileResult.rows[0].id;
    
    // Commit transaction
    await pool.query('COMMIT');
    
    res.json({ 
      message: 'Test user created successfully', 
      user: {
        email: 'test@example.com',
        password: 'password123',
        id: user.id,
        profileId,
        profileType: 'consultant'
      }
    });
  } catch (err) {
    // Rollback transaction on error
    if (pool.query) await pool.query('ROLLBACK');
    console.error('Test user creation error:', err);
    res.status(500).json({ message: 'Failed to create test user', error: err.message });
  }
});

/**
 * @route GET /api/auth/create-test-general-user
 * @desc Test endpoint to create a test general user (only for development)
 * @access Public
 */
router.get('/create-test-general-user', async (req, res) => {
  try {
    // Check if test general user already exists
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', ['testgeneral@example.com']);
    
    if (existingUser.rows.length > 0) {
      return res.json({ 
        message: 'Test general user already exists', 
        user: {
          email: 'testgeneral@example.com',
          password: 'password123',
          id: existingUser.rows[0].id,
          role: 'generalUser'
        }
      });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    // Begin transaction
    await pool.query('BEGIN');
    
    // Insert user (verified by default for test user)
    const userResult = await pool.query(
      'INSERT INTO users (first_name, last_name, email, password, role, agreed_to_terms, is_verified) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, first_name, last_name, email, role',
      ['Test', 'General', 'testgeneral@example.com', hashedPassword, 'generalUser', true, true]
    );
    
    const user = userResult.rows[0];
    
    // Create optional general user profile
    await pool.query(
      'INSERT INTO general_user_profiles (user_id, industry, regions) VALUES ($1, $2, $3)',
      [user.id, 'Technology', JSON.stringify(['North America'])]
    );
    
    // Commit transaction
    await pool.query('COMMIT');
    
    res.json({ 
      message: 'Test general user created successfully', 
      user: {
        email: 'testgeneral@example.com',
        password: 'password123',
        id: user.id,
        role: 'generalUser'
      }
    });
  } catch (err) {
    // Rollback transaction on error
    if (pool.query) await pool.query('ROLLBACK');
    console.error('Test general user creation error:', err);
    res.status(500).json({ message: 'Failed to create test general user', error: err.message });
  }
});

module.exports = router;