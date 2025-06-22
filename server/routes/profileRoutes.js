const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Import pool directly without destructuring to match your pattern
const pool = require('../db/pool');

// JWT Secret Key - should match the one used in auth.js
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Authentication middleware
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
 * @route   GET /api/profiles/unified/:id
 * @desc    Get any available profile for a user (developer, provider, consultant, or general)
 * @access  Private
 */
router.get('/unified/:id', auth, async (req, res) => {
  try {
    const id = req.params.id;
    
    // Validate the ID parameter
    if (!id || id === 'undefined') {
      return res.status(400).json({ error: 'Invalid profile ID parameter' });
    }
    
    console.log(`🔍 Searching for any profile for user ID: ${id}`);
    
    let profileData = null;
    let profileType = null;
    
    // Try developer profile first - using ONLY id column
    try {
      const developerResult = await pool.query(
        `SELECT dp.*, 'developer' as profile_type, 
                u.email, u.first_name, u.last_name, u.role, u.created_at as user_created_at
         FROM developer_profiles dp
         JOIN users u ON dp.user_id = u.id
         WHERE dp.id = $1`,
        [id]
      );
      
      if (developerResult.rows.length > 0) {
        profileData = developerResult.rows[0];
        profileType = 'developer';
        console.log(`✅ Found developer profile for user ${id}`);
      }
    } catch (err) {
      console.log(`No developer profile found for user ${id}`);
    }
    
    // If no developer profile, try provider profile
    if (!profileData) {
      try {
        const providerResult = await pool.query(
          `SELECT pp.*, 'provider' as profile_type,
                  u.email, u.first_name, u.last_name, u.role, u.created_at as user_created_at
           FROM provider_profiles pp
           JOIN users u ON pp.user_id = u.id
           WHERE pp.id = $1`,
          [id]
        );
        
        if (providerResult.rows.length > 0) {
          profileData = providerResult.rows[0];
          profileType = 'provider';
          console.log(`✅ Found provider profile for user ${id}`);
        }
      } catch (err) {
        console.log(`No provider profile found for user ${id}`);
      }
    }
    
    // If no provider profile, try consultant profile
    if (!profileData) {
      try {
        const consultantResult = await pool.query(
          `SELECT cp.*, 'consultant' as profile_type,
                  u.email, u.first_name, u.last_name, u.role, u.created_at as user_created_at,
                  cp.firm as company_name, cp.firm as organization_name
           FROM consultant_profiles cp
           JOIN users u ON cp.user_id = u.id
           WHERE cp.id = $1`,
          [id]
        );
        
        if (consultantResult.rows.length > 0) {
          profileData = consultantResult.rows[0];
          profileType = 'consultant';
          console.log(`✅ Found consultant profile for user ${id}`);
        }
      } catch (err) {
        console.log(`No consultant profile found for user ${id}`);
      }
    }
    
    // If still no profile found, get user info
    if (!profileData) {
      try {
        const userResult = await pool.query(
          'SELECT id, email, first_name, last_name, role, created_at FROM users WHERE id = $1',
          [id]
        );
        
        if (userResult.rows.length > 0) {
          const user = userResult.rows[0];
          
          // For general users, return their basic user info as their profile
          if (user.role === 'generalUser') {
            console.log(`✅ Found general user profile for user ${id}`);
            
            // Try to get additional general user info if exists
            const generalUserResult = await pool.query(
              `SELECT * FROM general_user_profiles WHERE user_id = $1`,
              [id]
            );
            
            const generalUserData = generalUserResult.rows.length > 0 
              ? generalUserResult.rows[0] 
              : {};
            
            return res.json({
              profile_type: 'general',
              user_exists: true,
              needs_profile_creation: false,
              id: user.id,
              user_id: user.id,
              first_name: user.first_name,
              last_name: user.last_name,
              email: user.email,
              role: user.role,
              created_at: user.created_at,
              // Include any general user specific data
              industry: generalUserData.industry || null,
              regions: generalUserData.regions || [],
              interests: generalUserData.interests || [],
              bio: generalUserData.bio || '',
              notifications_enabled: generalUserData.notifications_enabled !== false,
              newsletter_subscribed: generalUserData.newsletter_subscribed || false,
              user_info: {
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                role: user.role
              }
            });
          }
          
          // For other users without profiles
          console.log(`ℹ️ User ${id} exists but has no profile`);
          
          return res.json({
            profile_type: 'none',
            user_exists: true,
            user_info: user,
            needs_profile_creation: true,
            suggested_profile_type: user.role === 'solutionProvider' ? 'provider' : 
                                   user.role === 'projectDeveloper' ? 'developer' : 
                                   user.role === 'consultant' ? 'consultant' : 'provider'
          });
        } else {
          return res.status(404).json({ error: 'User not found' });
        }
      } catch (err) {
        console.error('Error checking user existence:', err);
        return res.status(500).json({ error: 'Failed to check user' });
      }
    }
    
    // Helper function to safely parse JSON fields
    const parseJsonField = (field, defaultValue = null) => {
      if (!field) return defaultValue;
      if (typeof field === 'object') return field;
      try {
        return JSON.parse(field);
      } catch (e) {
        console.error(`Error parsing JSON field:`, e);
        return defaultValue;
      }
    };
    
    // Parse all JSON fields
    profileData.regions = parseJsonField(profileData.regions, []);
    profileData.project_types = parseJsonField(profileData.project_types, []);
    profileData.certifications = parseJsonField(profileData.certifications, []);
    profileData.visibility_settings = parseJsonField(profileData.visibility_settings, {
      publicProfile: true,
      showContactInfo: true,
      showFinancials: false,
      showProjects: true
    });
    profileData.contact_info = parseJsonField(profileData.contact_info, {
      contact_name: '',
      contact_email: '',
      contact_phone: '',
      contact_position: ''
    });
    profileData.social_profiles = parseJsonField(profileData.social_profiles, {
      linkedin: '',
      twitter: '',
      facebook: '',
      instagram: ''
    });
    
    // For developer profiles, parse additional JSON fields
    if (profileType === 'developer') {
      profileData.carbon_goals = parseJsonField(profileData.carbon_goals, {});
      profileData.project_timeline = parseJsonField(profileData.project_timeline, {});
      profileData.decision_makers = parseJsonField(profileData.decision_makers, []);
      profileData.previous_projects = parseJsonField(profileData.previous_projects, []);
    }
    
    // Ensure organization_name is set for providers if only company_name exists
    if (profileType === 'provider' && profileData.company_name && !profileData.organization_name) {
      profileData.organization_name = profileData.company_name;
    }
    
    // Add user info
    profileData.user_info = {
      email: profileData.email,
      first_name: profileData.first_name,
      last_name: profileData.last_name,
      role: profileData.role
    };
    
    // Clean up duplicate fields
    delete profileData.email;
    delete profileData.first_name;
    delete profileData.last_name;
    delete profileData.role;
    
    // Return the found profile with type information
    res.json({
      ...profileData,
      profile_type: profileType,
      original_request_id: id
    });
    
  } catch (err) {
    console.error('Error fetching unified profile:', err);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

/**
 * @route   POST /api/profiles/general
 * @desc    Create or update general user profile data
 * @access  Private
 */
router.post('/general', auth, async (req, res) => {
  try {
    const {
      industry,
      regions = [],
      interests = [],
      bio = '',
      notifications_enabled = true,
      newsletter_subscribed = false
    } = req.body;

    // Get the user ID
    const userId = req.user.id;

    // Check if general user profile already exists
    const existingProfile = await pool.query(
      'SELECT * FROM general_user_profiles WHERE user_id = $1',
      [userId]
    );

    let result;
    
    if (existingProfile.rows.length > 0) {
      // Update existing profile
      const query = `
        UPDATE general_user_profiles 
        SET 
          industry = $2,
          regions = $3,
          interests = $4,
          bio = $5,
          notifications_enabled = $6,
          newsletter_subscribed = $7,
          updated_at = NOW()
        WHERE user_id = $1
        RETURNING *
      `;

      result = await pool.query(query, [
        userId,
        industry,
        JSON.stringify(regions),
        JSON.stringify(interests),
        bio,
        notifications_enabled,
        newsletter_subscribed
      ]);
    } else {
      // Insert new profile
      const query = `
        INSERT INTO general_user_profiles (
          user_id,
          industry,
          regions,
          interests,
          bio,
          notifications_enabled,
          newsletter_subscribed,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING *
      `;

      result = await pool.query(query, [
        userId,
        industry,
        JSON.stringify(regions),
        JSON.stringify(interests),
        bio,
        notifications_enabled,
        newsletter_subscribed
      ]);
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating/updating general user profile:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * @route   GET /api/profiles/general/:id
 * @desc    Get general user profile by ID
 * @access  Private
 */
router.get('/general/:id', auth, async (req, res) => {
  try {
    const id = req.params.id;
    
    // Validate the ID parameter
    if (!id || id === 'undefined') {
      return res.status(400).json({ message: 'Invalid profile ID parameter' });
    }
    
    // Get user info and general profile data
    const query = `
      SELECT 
        u.id, u.email, u.first_name, u.last_name, u.role, u.created_at,
        gup.industry, gup.regions, gup.interests, gup.bio, 
        gup.notifications_enabled, gup.newsletter_subscribed
      FROM users u
      LEFT JOIN general_user_profiles gup ON u.id = gup.user_id
      WHERE u.id = $1 AND u.role = 'generalUser'
    `;
    
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'General user profile not found' });
    }

    const profile = result.rows[0];
    
    // Parse JSON fields
    if (profile.regions) {
      profile.regions = typeof profile.regions === 'string' 
        ? JSON.parse(profile.regions) 
        : profile.regions;
    }
    
    if (profile.interests) {
      profile.interests = typeof profile.interests === 'string' 
        ? JSON.parse(profile.interests) 
        : profile.interests;
    }

    res.json(profile);
  } catch (err) {
    console.error('Error fetching general user profile:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
/**
 * @route   POST /api/profiles/provider
 * @desc    Create a new provider profile
 * @access  Private
 */
router.post('/provider', auth, async (req, res) => {
  try {
    const {
      company_name,
      company_description,
      company_size,
      provider_type,
      entry_type = 'service_provider',
      headquarters_country = '',
      headquarters_city = '',
      website = '',
      founded_year = null,
      industry = '',
      regions = [],
      certifications = [],
      social_profiles = {},
      contact_info = {},
      visibility_settings = {}
    } = req.body;

    // Get the user ID to use as both ID and user_id
    const userId = req.user.id;

    // Check if user already has a provider profile
    const existingProfile = await pool.query(
      'SELECT * FROM provider_profiles WHERE user_id = $1',
      [userId]
    );

    if (existingProfile.rows.length > 0) {
      return res.status(400).json({ message: 'User already has a provider profile' });
    }

    // Ensure organization_name is set
    const organization_name = req.body.organization_name || company_name;

    // Insert new provider profile with explicit ID
    const query = `
      INSERT INTO provider_profiles (
        id,
        user_id,
        company_name,
        organization_name,
        company_description,
        company_size,
        provider_type,
        entry_type,
        headquarters_country,
        headquarters_city,
        website,
        founded_year,
        industry,
        regions,
        certifications,
        social_profiles,
        contact_info,
        visibility_settings,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW())
      RETURNING *
    `;

    const result = await pool.query(query, [
      userId, // Use user ID as profile ID
      userId, // Set user_id reference
      company_name,
      organization_name,
      company_description,
      company_size,
      provider_type,
      entry_type,
      headquarters_country,
      headquarters_city,
      website,
      founded_year,
      industry,
      JSON.stringify(regions),
      JSON.stringify(certifications),
      JSON.stringify(social_profiles),
      JSON.stringify(contact_info),
      JSON.stringify(visibility_settings)
    ]);

    // Update user role if needed
    await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2',
      ['solutionProvider', userId]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating provider profile:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * @route   GET /api/profiles/providers
 * @desc    Get provider profiles for marketplace display based on entry_type
 * @access  Public
 */
router.get('/providers', async (req, res) => {
  try {
    // Get entry_type from query params (default to service_provider)
    const entryType = req.query.entry_type || 'service_provider';
    console.log(`Fetching providers with entry_type: ${entryType}`);
    
    // Query to get provider profiles based on entry_type
    let providerQuery = `
      SELECT pp.*, u.profile_image, u.id as user_id, u.first_name, u.last_name
      FROM provider_profiles pp
      JOIN users u ON pp.user_id = u.id
      WHERE u.role = 'solutionProvider'
    `;

    // Add entry_type condition if it's specified
    if (entryType) {
      // First check if entry_type column exists
      try {
        const columnCheck = await pool.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'provider_profiles' AND column_name = 'entry_type'
        `);
        
        // If entry_type column exists, add it to the query
        if (columnCheck.rows.length > 0) {
          providerQuery += ` AND pp.entry_type = '${entryType}'`;
        } else {
          console.log('entry_type column does not exist in provider_profiles table');
          
          // If entry_type is 'consultant', modify query to check provider_type
          if (entryType === 'consultant') {
            providerQuery += ` AND pp.provider_type = 'Consultant'`;
          } 
          // If entry_type is 'service_provider', exclude consultants
          else if (entryType === 'service_provider') {
            providerQuery += ` AND (pp.provider_type != 'Consultant' OR pp.provider_type IS NULL)`;
          }
        }
      } catch (err) {
        console.error('Error checking entry_type column:', err);
      }
    }
    
    // Execute the query
    const result = await pool.query(providerQuery);
    
    // If entry_type is consultant, also try to get consultant profiles
    let consultantProfiles = [];
    if (entryType === 'consultant') {
      try {
        const consultantQuery = `
          SELECT cp.*, 'Consultant' as provider_type, u.profile_image, u.id as user_id, 
                 u.first_name, u.last_name, cp.firm as company_name,
                 CASE WHEN cp.is_independent THEN 'startup' ELSE 'medium' END as company_size
          FROM consultant_profiles cp
          JOIN users u ON cp.user_id = u.id
          WHERE u.role = 'consultant'
        `;
        
        const consultantResult = await pool.query(consultantQuery);
        consultantProfiles = consultantResult.rows;
      } catch (err) {
        console.error('Error fetching consultant profiles (continuing):', err);
      }
    }
    
    // Combine results (if appropriate)
    const providers = [...result.rows, ...consultantProfiles];
    
    // Return all provider profiles
    res.json(providers);
  } catch (err) {
    console.error('Error fetching provider profiles:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * @route   GET /api/profiles/provider/:id
 * @desc    Get provider profile by ID
 * @access  Private
 */
router.get('/provider/:id', auth, async (req, res) => {
  try {
    const id = req.params.id;
    
    // Validate the ID parameter
    if (!id || id === 'undefined') {
      return res.status(400).json({ message: 'Invalid profile ID parameter' });
    }
    
    const result = await pool.query(
      'SELECT * FROM provider_profiles WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const profile = result.rows[0];
    
    // Verify the profile belongs to the authenticated user
    if (profile.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized access to this profile' });
    }

    res.json(profile);
  } catch (err) {
    console.error('Error fetching provider profile:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * @route   GET /api/profiles/solutionProvider/:id
 * @desc    Alias for provider profile by ID
 * @access  Private
 */
router.get('/solutionProvider/:id', auth, async (req, res) => {
  try {
    const id = req.params.id;
    
    // Validate the ID parameter
    if (!id || id === 'undefined') {
      return res.status(400).json({ message: 'Invalid profile ID parameter' });
    }
    
    console.log(`Fetching provider profile with ID: ${id}`);
    
    const result = await pool.query(
      'SELECT * FROM provider_profiles WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const profile = result.rows[0];
    
    // Verify the profile belongs to the authenticated user
    if (profile.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized access to this profile' });
    }

    res.json(profile);
  } catch (err) {
    console.error('Error fetching provider profile:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * @route   POST /api/profiles/developer
 * @desc    Create a new developer profile
 * @access  Private
 */
router.post('/developer', auth, async (req, res) => {
  try {
    const {
      organization_name,
      organization_type,
      headquarters_country,
      headquarters_city,
      industry,
      website,
      founded_year,
      company_description,
      regions = [],
      project_types = [],
      carbon_goals = {},
      budget_range = '',
      project_timeline = {},
      decision_makers = [],
      previous_projects = [],
      visibility_settings = {},
      contact_info = {},
      social_profiles = {}
    } = req.body;

    // Get the user ID to use as both ID and user_id
    const userId = req.user.id;

    // Check if user already has a developer profile
    const existingProfile = await pool.query(
      'SELECT * FROM developer_profiles WHERE user_id = $1',
      [userId]
    );

    if (existingProfile.rows.length > 0) {
      return res.status(400).json({ message: 'User already has a developer profile' });
    }

    // Insert new developer profile with explicit ID
    const query = `
      INSERT INTO developer_profiles (
        id,
        user_id,
        organization_name,
        organization_type,
        headquarters_country,
        headquarters_city,
        industry,
        website,
        founded_year,
        company_description,
        regions,
        project_types,
        carbon_goals,
        budget_range,
        project_timeline,
        decision_makers,
        previous_projects,
        visibility_settings,
        contact_info,
        social_profiles,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW(), NOW())
      RETURNING *
    `;

    const result = await pool.query(query, [
      userId, // Use user ID as profile ID
      userId, // Set user_id reference
      organization_name,
      organization_type,
      headquarters_country,
      headquarters_city,
      industry,
      website,
      founded_year,
      company_description,
      JSON.stringify(regions),
      JSON.stringify(project_types),
      JSON.stringify(carbon_goals),
      budget_range,
      JSON.stringify(project_timeline),
      JSON.stringify(decision_makers),
      JSON.stringify(previous_projects),
      JSON.stringify(visibility_settings),
      JSON.stringify(contact_info),
      JSON.stringify(social_profiles)
    ]);

    // Update user role if needed
    await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2',
      ['projectDeveloper', userId]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating developer profile:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * @route   POST /api/profiles/consultant
 * @desc    Create a new consultant profile
 * @access  Private
 */
router.post('/consultant', auth, async (req, res) => {
  try {
    const {
      firm,
      is_independent,
      industry,
      regions = [],
      expertise = [],
      years_of_experience = null,
      certifications = [],
      services_offered = [],
      client_types = [],
      project_examples = [],
      rate_range = '',
      availability = '',
      visibility_settings = {}
    } = req.body;

    // Get the user ID to use as both ID and user_id
    const userId = req.user.id;

    // Check if user already has a consultant profile
    const existingProfile = await pool.query(
      'SELECT * FROM consultant_profiles WHERE user_id = $1',
      [userId]
    );

    if (existingProfile.rows.length > 0) {
      return res.status(400).json({ message: 'User already has a consultant profile' });
    }

    // Insert new consultant profile with explicit ID
    const query = `
      INSERT INTO consultant_profiles (
        id,
        user_id,
        firm,
        is_independent,
        industry,
        regions,
        expertise,
        years_of_experience,
        certifications,
        services_offered,
        client_types,
        project_examples,
        rate_range,
        availability,
        visibility_settings,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
      RETURNING *
    `;

    const result = await pool.query(query, [
      userId, // Use user ID as profile ID
      userId, // Set user_id reference
      firm,
      is_independent,
      industry,
      JSON.stringify(regions),
      JSON.stringify(expertise),
      years_of_experience,
      JSON.stringify(certifications),
      JSON.stringify(services_offered),
      JSON.stringify(client_types),
      JSON.stringify(project_examples),
      rate_range,
      availability,
      JSON.stringify(visibility_settings)
    ]);

    // Update user role if needed
    await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2',
      ['consultant', userId]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating consultant profile:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
/**
 * @route   GET /api/profiles/developer/:id
 * @desc    Get developer profile by ID
 * @access  Private
 */
router.get('/developer/:id', auth, async (req, res) => {
  try {
    const id = req.params.id;
    
    // Validate the ID parameter
    if (!id || id === 'undefined') {
      return res.status(400).json({ message: 'Invalid profile ID parameter' });
    }
    
    const result = await pool.query(
      'SELECT * FROM developer_profiles WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const profile = result.rows[0];
    
    // Verify the profile belongs to the authenticated user
    if (profile.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized access to this profile' });
    }

    res.json(profile);
  } catch (err) {
    console.error('Error fetching developer profile:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * @route   GET /api/profiles/projectDeveloper/:id
 * @desc    Alias for developer profile by ID
 * @access  Private
 */
router.get('/projectDeveloper/:id', auth, async (req, res) => {
  try {
    const id = req.params.id;
    
    // Validate the ID parameter
    if (!id || id === 'undefined') {
      return res.status(400).json({ message: 'Invalid profile ID parameter' });
    }
    
    console.log(`Fetching developer profile with ID: ${id}`);
    
    const result = await pool.query(
      'SELECT * FROM developer_profiles WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const profile = result.rows[0];
    
    // Verify the profile belongs to the authenticated user
    if (profile.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized access to this profile' });
    }

    res.json(profile);
  } catch (err) {
    console.error('Error fetching developer profile:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * @route   GET /api/profiles/consultant/:id
 * @desc    Get consultant profile by ID
 * @access  Private
 */
router.get('/consultant/:id', auth, async (req, res) => {
  try {
    const id = req.params.id;
    
    // Validate the ID parameter
    if (!id || id === 'undefined') {
      return res.status(400).json({ message: 'Invalid profile ID parameter' });
    }
    
    const result = await pool.query(
      'SELECT * FROM consultant_profiles WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const profile = result.rows[0];
    
    // Verify the profile belongs to the authenticated user
    if (profile.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized access to this profile' });
    }

    res.json(profile);
  } catch (err) {
    console.error('Error fetching consultant profile:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * @route   GET /api/profiles/public/developer/:id
 * @desc    Get public developer profile by ID
 * @access  Private (authenticated but not restricted to owner)
 */
router.get('/public/developer/:id', auth, async (req, res) => {
  try {
    const id = req.params.id;
    
    // Validate the ID parameter
    if (!id || id === 'undefined') {
      return res.status(400).json({ message: 'Invalid profile ID parameter' });
    }
    
    // Get developer profile with user info
    const query = `
      SELECT dp.*, u.email, u.first_name, u.last_name, u.created_at
      FROM developer_profiles dp
      JOIN users u ON dp.user_id = u.id
      WHERE dp.id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Developer profile not found' });
    }
    
    const profile = result.rows[0];
    
    // Handle visibility settings if they exist
    if (profile.visibility_settings) {
      const visSettings = typeof profile.visibility_settings === 'string' 
        ? JSON.parse(profile.visibility_settings) 
        : profile.visibility_settings;
      
      // If this is not the profile owner and the profile is not public,
      // only return limited information
      if (profile.user_id !== req.user.id && !visSettings.publicProfile) {
        return res.json({
          id: profile.id,
          organization_name: profile.organization_name,
          organization_type: profile.organization_type,
          industry: profile.industry,
          created_at: profile.created_at
        });
      }
    }
    
    res.json(profile);
  } catch (err) {
    console.error('Error fetching public developer profile:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * @route   GET /api/profiles/public/provider/:id
 * @desc    Get public provider profile by ID
 * @access  Private (authenticated but not restricted to owner)
 */
router.get('/public/provider/:id', auth, async (req, res) => {
  try {
    const id = req.params.id;
    
    // Validate the ID parameter
    if (!id || id === 'undefined') {
      return res.status(400).json({ message: 'Invalid profile ID parameter' });
    }
    
    // Get provider profile with user info
    const query = `
      SELECT pp.*, u.email, u.first_name, u.last_name, u.created_at
      FROM provider_profiles pp
      JOIN users u ON pp.user_id = u.id
      WHERE pp.id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      // Try consulting profiles if provider profile not found
      const consultantQuery = `
        SELECT cp.*, 'Consultant' as provider_type, u.email, u.first_name, u.last_name, 
               u.created_at, cp.firm as company_name
        FROM consultant_profiles cp
        JOIN users u ON cp.user_id = u.id
        WHERE cp.id = $1
      `;
      
      const consultantResult = await pool.query(consultantQuery, [id]);
      
      if (consultantResult.rows.length === 0) {
        return res.status(404).json({ message: 'Provider profile not found' });
      }
      
      const consultantProfile = consultantResult.rows[0];
      // Handle visibility settings for consultant profiles if needed
      return res.json(consultantProfile);
    }
    
    const profile = result.rows[0];
    
    // Handle visibility settings if they exist
    if (profile.visibility_settings) {
      const visSettings = typeof profile.visibility_settings === 'string' 
        ? JSON.parse(profile.visibility_settings) 
        : profile.visibility_settings;
      
      // If this is not the profile owner and the profile is not public,
      // only return limited information
      if (profile.user_id !== req.user.id && !visSettings.publicProfile) {
        return res.json({
          id: profile.id,
          company_name: profile.company_name,
          company_size: profile.company_size,
          industry: profile.industry,
          provider_type: profile.provider_type,
          created_at: profile.created_at
        });
      }
    }
    
    res.json(profile);
  } catch (err) {
    console.error('Error fetching public provider profile:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * @route   GET /api/profiles/public/general/:id
 * @desc    Get public general user profile by ID
 * @access  Private (authenticated but not restricted to owner)
 */
router.get('/public/general/:id', auth, async (req, res) => {
  try {
    const id = req.params.id;
    
    // Validate the ID parameter
    if (!id || id === 'undefined') {
      return res.status(400).json({ message: 'Invalid profile ID parameter' });
    }
    
    // Get general user info
    const query = `
      SELECT 
        u.id, u.first_name, u.last_name, u.created_at,
        gup.industry, gup.regions, gup.bio
      FROM users u
      LEFT JOIN general_user_profiles gup ON u.id = gup.user_id
      WHERE u.id = $1 AND u.role = 'generalUser'
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'General user profile not found' });
    }
    
    const profile = result.rows[0];
    
    // Parse JSON fields
    if (profile.regions) {
      profile.regions = typeof profile.regions === 'string' 
        ? JSON.parse(profile.regions) 
        : profile.regions;
    }
    
    // Return limited public information
    res.json({
      id: profile.id,
      first_name: profile.first_name,
      last_name: profile.last_name,
      industry: profile.industry,
      regions: profile.regions,
      bio: profile.bio,
      created_at: profile.created_at,
      profile_type: 'general'
    });
  } catch (err) {
    console.error('Error fetching public general user profile:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * @route   PUT /api/profiles/general/:id
 * @desc    Update general user profile
 * @access  Private
 */
router.put('/general/:id', auth, async (req, res) => {
  try {
    const id = req.params.id;
    
    // Validate the ID parameter
    if (!id || id === 'undefined') {
      return res.status(400).json({ message: 'Invalid profile ID parameter' });
    }
    
    // Verify the user is updating their own profile
    if (id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to update this profile' });
    }
    
    // Prepare update fields
    const {
      industry,
      regions,
      interests,
      bio,
      notifications_enabled,
      newsletter_subscribed
    } = req.body;
    
    // Build query dynamically based on provided fields
    let updateFields = [];
    let values = [];
    let counter = 1;
    
    if (industry !== undefined) {
      updateFields.push(`industry = $${counter}`);
      values.push(industry);
      counter++;
    }
    
    if (regions !== undefined) {
      updateFields.push(`regions = $${counter}`);
      values.push(JSON.stringify(regions));
      counter++;
    }
    
    if (interests !== undefined) {
      updateFields.push(`interests = $${counter}`);
      values.push(JSON.stringify(interests));
      counter++;
    }
    
    if (bio !== undefined) {
      updateFields.push(`bio = $${counter}`);
      values.push(bio);
      counter++;
    }
    
    if (notifications_enabled !== undefined) {
      updateFields.push(`notifications_enabled = $${counter}`);
      values.push(notifications_enabled);
      counter++;
    }
    
    if (newsletter_subscribed !== undefined) {
      updateFields.push(`newsletter_subscribed = $${counter}`);
      values.push(newsletter_subscribed);
      counter++;
    }
    
    // Add updated_at timestamp
    updateFields.push(`updated_at = NOW()`);
    
    if (updateFields.length === 1) { // Only updated_at
      return res.status(400).json({ message: 'No fields to update' });
    }
    
    // Add user_id as the last parameter
    values.push(id);
    
    // Execute update query
    const query = `
      UPDATE general_user_profiles 
      SET ${updateFields.join(', ')} 
      WHERE user_id = $${counter} 
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      // If no profile exists, create one
      const createQuery = `
        INSERT INTO general_user_profiles (
          user_id,
          industry,
          regions,
          interests,
          bio,
          notifications_enabled,
          newsletter_subscribed,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING *
      `;
      
      const createResult = await pool.query(createQuery, [
        id,
        industry || null,
        JSON.stringify(regions || []),
        JSON.stringify(interests || []),
        bio || '',
        notifications_enabled !== false,
        newsletter_subscribed || false
      ]);
      
      return res.json(createResult.rows[0]);
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating general user profile:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * @route   PUT /api/profiles/provider/:id
 * @desc    Update provider profile
 * @access  Private
 */
router.put('/provider/:id', auth, async (req, res) => {
  try {
    const id = req.params.id;
    
    // Validate the ID parameter
    if (!id || id === 'undefined') {
      return res.status(400).json({ message: 'Invalid profile ID parameter' });
    }
    
    // First, check if profile exists and belongs to user
    const checkResult = await pool.query(
      'SELECT user_id FROM provider_profiles WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    if (checkResult.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to update this profile' });
    }

    // Prepare update fields
    const {
      company_name,
      organization_name,
      company_description,
      headquarters_country,
      headquarters_city,
      website,
      founded_year,
      company_size,
      industry,
      regions,
      certifications,
      social_profiles,
      contact_info,
      visibility_settings,
      provider_type,
      entry_type
    } = req.body;

    // Build query dynamically based on provided fields
    let updateFields = [];
    let values = [];
    let counter = 1;

    if (company_name !== undefined) {
      updateFields.push(`company_name = $${counter}`);
      values.push(company_name);
      counter++;
    }

    if (organization_name !== undefined) {
      updateFields.push(`organization_name = $${counter}`);
      values.push(organization_name);
      counter++;
    }

    if (company_description !== undefined) {
      updateFields.push(`company_description = $${counter}`);
      values.push(company_description);
      counter++;
    }

    if (headquarters_country !== undefined) {
      updateFields.push(`headquarters_country = $${counter}`);
      values.push(headquarters_country);
      counter++;
    }

    if (headquarters_city !== undefined) {
      updateFields.push(`headquarters_city = $${counter}`);
      values.push(headquarters_city);
      counter++;
    }

    if (website !== undefined) {
      updateFields.push(`website = $${counter}`);
      values.push(website);
      counter++;
    }

    if (founded_year !== undefined) {
      updateFields.push(`founded_year = $${counter}`);
      values.push(founded_year);
      counter++;
    }

    if (company_size !== undefined) {
      updateFields.push(`company_size = $${counter}`);
      values.push(company_size);
      counter++;
    }

    if (industry !== undefined) {
      updateFields.push(`industry = $${counter}`);
      values.push(industry);
      counter++;
    }

    // IMPORTANT: Handle PostgreSQL arrays properly for regions
    if (regions !== undefined) {
      updateFields.push(`regions = $${counter}`);
      // Always store as array for PostgreSQL array columns
      let regionsArray;
      if (Array.isArray(regions)) {
        regionsArray = regions;
      } else if (typeof regions === 'string') {
        try {
          regionsArray = JSON.parse(regions);
        } catch (e) {
          regionsArray = [];
        }
      } else {
        regionsArray = [];
      }
      values.push(regionsArray);
      counter++;
    }

    if (certifications !== undefined) {
      updateFields.push(`certifications = $${counter}`);
      values.push(typeof certifications === 'string' ? certifications : JSON.stringify(certifications));
      counter++;
    }

    if (social_profiles !== undefined) {
      updateFields.push(`social_profiles = $${counter}`);
      values.push(typeof social_profiles === 'string' ? social_profiles : JSON.stringify(social_profiles));
      counter++;
    }

    if (contact_info !== undefined) {
      updateFields.push(`contact_info = $${counter}`);
      values.push(typeof contact_info === 'string' ? contact_info : JSON.stringify(contact_info));
      counter++;
    }

    if (visibility_settings !== undefined) {
      updateFields.push(`visibility_settings = $${counter}`);
      values.push(typeof visibility_settings === 'string' ? visibility_settings : JSON.stringify(visibility_settings));
      counter++;
    }

    if (provider_type !== undefined) {
      updateFields.push(`provider_type = $${counter}`);
      values.push(provider_type);
      counter++;
    }

    if (entry_type !== undefined) {
      // First check if entry_type column exists
      try {
        const columnCheck = await pool.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'provider_profiles' AND column_name = 'entry_type'
        `);
        
        // If entry_type column exists, add it to the update query
        if (columnCheck.rows.length > 0) {
          updateFields.push(`entry_type = $${counter}`);
          values.push(entry_type);
          counter++;
        } else {
          console.log('entry_type column does not exist in provider_profiles table');
        }
      } catch (err) {
        console.error('Error checking entry_type column:', err);
      }
    }

    // Add updated_at timestamp
    updateFields.push(`updated_at = NOW()`);

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    // Add ID as the last parameter
    values.push(id);

    // Execute update query
    const query = `
      UPDATE provider_profiles 
      SET ${updateFields.join(', ')} 
      WHERE id = $${counter} 
      RETURNING *
    `;

    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating provider profile:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * @route   PUT /api/profiles/developer/:id
 * @desc    Update developer profile
 * @access  Private
 */
router.put('/developer/:id', auth, async (req, res) => {
  try {
    const id = req.params.id;
    
    // Validate the ID parameter
    if (!id || id === 'undefined') {
      return res.status(400).json({ message: 'Invalid profile ID parameter' });
    }
    
    // First, check if profile exists and belongs to user
    const checkResult = await pool.query(
      'SELECT user_id FROM developer_profiles WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    if (checkResult.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to update this profile' });
    }

    // Prepare update fields
    const {
      organization_name,
      organization_type,
      headquarters_country,
      headquarters_city,
      industry,
      website,
      founded_year,
      company_description,
      regions,
      project_types,
      carbon_goals,
      budget_range,
      project_timeline,
      decision_makers,
      previous_projects,
      visibility_settings,
      contact_info,
      social_profiles
    } = req.body;

    // Build query dynamically based on provided fields
    let updateFields = [];
    let values = [];
    let counter = 1;

    if (organization_name !== undefined) {
      updateFields.push(`organization_name = $${counter}`);
      values.push(organization_name);
      counter++;
    }

    if (organization_type !== undefined) {
      updateFields.push(`organization_type = $${counter}`);
      values.push(organization_type);
      counter++;
    }

    if (headquarters_country !== undefined) {
      updateFields.push(`headquarters_country = $${counter}`);
      values.push(headquarters_country);
      counter++;
    }

    if (headquarters_city !== undefined) {
      updateFields.push(`headquarters_city = $${counter}`);
      values.push(headquarters_city);
      counter++;
    }

    if (industry !== undefined) {
      updateFields.push(`industry = $${counter}`);
      values.push(industry);
      counter++;
    }

    if (website !== undefined) {
      updateFields.push(`website = $${counter}`);
      values.push(website);
      counter++;
    }

    if (founded_year !== undefined) {
      updateFields.push(`founded_year = $${counter}`);
      values.push(founded_year);
      counter++;
    }

    if (company_description !== undefined) {
      updateFields.push(`company_description = $${counter}`);
      values.push(company_description);
      counter++;
    }

    // IMPORTANT: Handle PostgreSQL arrays properly
    if (regions !== undefined) {
      updateFields.push(`regions = $${counter}`);
      // Always store as array for PostgreSQL array columns
      let regionsArray;
      if (Array.isArray(regions)) {
        regionsArray = regions;
      } else if (typeof regions === 'string') {
        try {
          regionsArray = JSON.parse(regions);
        } catch (e) {
          regionsArray = [];
        }
      } else {
        regionsArray = [];
      }
      values.push(regionsArray);
      counter++;
    }

    // IMPORTANT: Handle PostgreSQL arrays properly
    if (project_types !== undefined) {
      updateFields.push(`project_types = $${counter}`);
      // Always store as array for PostgreSQL array columns
      let projectTypesArray;
      if (Array.isArray(project_types)) {
        projectTypesArray = project_types;
      } else if (typeof project_types === 'string') {
        try {
          projectTypesArray = JSON.parse(project_types);
        } catch (e) {
          projectTypesArray = [];
        }
      } else {
        projectTypesArray = [];
      }
      values.push(projectTypesArray);
      counter++;
    }

    if (carbon_goals !== undefined) {
      updateFields.push(`carbon_goals = $${counter}`);
      values.push(typeof carbon_goals === 'string' ? carbon_goals : JSON.stringify(carbon_goals));
      counter++;
    }

    if (budget_range !== undefined) {
      updateFields.push(`budget_range = $${counter}`);
      values.push(budget_range);
      counter++;
    }

    if (project_timeline !== undefined) {
      updateFields.push(`project_timeline = $${counter}`);
      values.push(typeof project_timeline === 'string' ? project_timeline : JSON.stringify(project_timeline));
      counter++;
    }

    if (decision_makers !== undefined) {
      updateFields.push(`decision_makers = $${counter}`);
      values.push(typeof decision_makers === 'string' ? decision_makers : JSON.stringify(decision_makers));
      counter++;
    }

    if (previous_projects !== undefined) {
      updateFields.push(`previous_projects = $${counter}`);
      values.push(typeof previous_projects === 'string' ? previous_projects : JSON.stringify(previous_projects));
      counter++;
    }

    if (visibility_settings !== undefined) {
      updateFields.push(`visibility_settings = $${counter}`);
      values.push(typeof visibility_settings === 'string' ? visibility_settings : JSON.stringify(visibility_settings));
      counter++;
    }

    // IMPORTANT: Add contact_info field handling
    if (contact_info !== undefined) {
      updateFields.push(`contact_info = $${counter}`);
      values.push(typeof contact_info === 'string' ? contact_info : JSON.stringify(contact_info));
      counter++;
    }

    // IMPORTANT: Add social_profiles field handling
    if (social_profiles !== undefined) {
      updateFields.push(`social_profiles = $${counter}`);
      values.push(typeof social_profiles === 'string' ? social_profiles : JSON.stringify(social_profiles));
      counter++;
    }

    // Add updated_at timestamp
    updateFields.push(`updated_at = NOW()`);

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    // Add ID as the last parameter
    values.push(id);

    // Execute update query
    const query = `
      UPDATE developer_profiles 
      SET ${updateFields.join(', ')} 
      WHERE id = $${counter} 
      RETURNING *
    `;

    console.log('Executing developer profile update query with values:', values);
    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating developer profile:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * @route   PUT /api/profiles/consultant/:id
 * @desc    Update consultant profile
 * @access  Private
 */
router.put('/consultant/:id', auth, async (req, res) => {
  try {
    const id = req.params.id;
    
    // Validate the ID parameter
    if (!id || id === 'undefined') {
      return res.status(400).json({ message: 'Invalid profile ID parameter' });
    }
    
    // First, check if profile exists and belongs to user
    const checkResult = await pool.query(
      'SELECT user_id FROM consultant_profiles WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    if (checkResult.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to update this profile' });
    }

    // Prepare update fields
    const {
      firm,
      is_independent,
      industry,
      regions,
      expertise,
      years_of_experience,
      certifications,
      services_offered,
      client_types,
      project_examples,
      rate_range,
      availability,
      visibility_settings
    } = req.body;

    // Build query dynamically based on provided fields
    let updateFields = [];
    let values = [];
    let counter = 1;

    if (firm !== undefined) {
      updateFields.push(`firm = $${counter}`);
      values.push(firm);
      counter++;
    }

    if (is_independent !== undefined) {
      updateFields.push(`is_independent = $${counter}`);
      values.push(is_independent);
      counter++;
    }

    if (industry !== undefined) {
      updateFields.push(`industry = $${counter}`);
      values.push(industry);
      counter++;
    }

    if (regions !== undefined) {
      updateFields.push(`regions = $${counter}`);
      values.push(Array.isArray(regions) ? JSON.stringify(regions) : regions);
      counter++;
    }

    if (expertise !== undefined) {
      updateFields.push(`expertise = $${counter}`);
      values.push(Array.isArray(expertise) ? JSON.stringify(expertise) : expertise);
      counter++;
    }

    if (years_of_experience !== undefined) {
      updateFields.push(`years_of_experience = $${counter}`);
      values.push(years_of_experience);
      counter++;
    }

    if (certifications !== undefined) {
      updateFields.push(`certifications = $${counter}`);
      values.push(typeof certifications === 'string' ? certifications : JSON.stringify(certifications));
      counter++;
    }

    if (services_offered !== undefined) {
      updateFields.push(`services_offered = $${counter}`);
      values.push(Array.isArray(services_offered) ? JSON.stringify(services_offered) : services_offered);
      counter++;
    }

    if (client_types !== undefined) {
      updateFields.push(`client_types = $${counter}`);
      values.push(Array.isArray(client_types) ? JSON.stringify(client_types) : client_types);
      counter++;
    }

    if (project_examples !== undefined) {
      updateFields.push(`project_examples = $${counter}`);
      values.push(typeof project_examples === 'string' ? project_examples : JSON.stringify(project_examples));
      counter++;
    }

    if (rate_range !== undefined) {
      updateFields.push(`rate_range = $${counter}`);
      values.push(rate_range);
      counter++;
    }

    if (availability !== undefined) {
      updateFields.push(`availability = $${counter}`);
      values.push(availability);
      counter++;
    }

    if (visibility_settings !== undefined) {
      updateFields.push(`visibility_settings = $${counter}`);
      values.push(typeof visibility_settings === 'string' ? visibility_settings : JSON.stringify(visibility_settings));
      counter++;
    }

    // Add updated_at timestamp
    updateFields.push(`updated_at = NOW()`);

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    // Add ID as the last parameter
    values.push(id);

    // Execute update query
    const query = `
      UPDATE consultant_profiles 
      SET ${updateFields.join(', ')} 
      WHERE id = $${counter} 
      RETURNING *
    `;

    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating consultant profile:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Add necessary columns to tables if they don't exist
// This is a safe operation that can be executed on each server startup
const runDatabaseMigrations = async () => {
  try {
    // Create general_user_profiles table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS general_user_profiles (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        industry VARCHAR(100),
        regions JSONB DEFAULT '[]',
        interests JSONB DEFAULT '[]',
        bio TEXT DEFAULT '',
        notifications_enabled BOOLEAN DEFAULT true,
        newsletter_subscribed BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Checked/created general_user_profiles table');

    // Add 'entry_type' column to provider_profiles table if it doesn't exist
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'provider_profiles' AND column_name = 'entry_type'
        ) THEN
          ALTER TABLE provider_profiles ADD COLUMN entry_type VARCHAR(50) DEFAULT 'service_provider';
          
          -- Set consultants to have entry_type = 'consultant'
          UPDATE provider_profiles 
          SET entry_type = 'consultant' 
          WHERE provider_type = 'Consultant';
        END IF;
      END $$;
    `);
    console.log('✅ Checked and potentially added entry_type column');

    // Add missing columns to developer_profiles if they don't exist
    await pool.query(`
      DO $$ 
      BEGIN
        -- Add website column if missing
        IF NOT EXISTS (
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'developer_profiles' AND column_name = 'website'
        ) THEN
          ALTER TABLE developer_profiles ADD COLUMN website TEXT;
        END IF;
        
        -- Add founded_year column if missing
        IF NOT EXISTS (
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'developer_profiles' AND column_name = 'founded_year'
        ) THEN
          ALTER TABLE developer_profiles ADD COLUMN founded_year INTEGER;
        END IF;
        
        -- Add company_description column if missing
        IF NOT EXISTS (
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'developer_profiles' AND column_name = 'company_description'
        ) THEN
          ALTER TABLE developer_profiles ADD COLUMN company_description TEXT;
        END IF;
        
        -- Add contact_info column if missing
        IF NOT EXISTS (
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'developer_profiles' AND column_name = 'contact_info'
        ) THEN
          ALTER TABLE developer_profiles ADD COLUMN contact_info JSONB DEFAULT '{}';
        END IF;
        
        -- Add social_profiles column if missing
        IF NOT EXISTS (
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'developer_profiles' AND column_name = 'social_profiles'
        ) THEN
          ALTER TABLE developer_profiles ADD COLUMN social_profiles JSONB DEFAULT '{}';
        END IF;
      END $$;
    `);
    console.log('✅ Checked and potentially added missing columns to developer_profiles');

    // Add organization_name column to provider_profiles if missing
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'provider_profiles' AND column_name = 'organization_name'
        ) THEN
          ALTER TABLE provider_profiles ADD COLUMN organization_name TEXT;
          
          -- Copy company_name to organization_name for existing records
          UPDATE provider_profiles 
          SET organization_name = company_name 
          WHERE organization_name IS NULL AND company_name IS NOT NULL;
        END IF;
      END $$;
    `);
    console.log('✅ Checked and potentially added organization_name column to provider_profiles');

  } catch (err) {
    console.error('Error running database migrations:', err);
  }
};

module.exports = router;