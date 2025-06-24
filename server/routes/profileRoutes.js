const express = require('express');
const router = express.Router();

// Import pool directly without destructuring to match your pattern
const pool = require('../db/pool');

// Import the authenticateToken middleware
const authenticateToken = require('../middleware/auth');

// Helper function to parse error messages for user-friendly display
const parseErrorMessage = (error) => {
  console.error('Database error:', error);
  
  // Numeric overflow error
  if (error.code === '22003') {
    return {
      status: 400,
      error: 'One or more numeric values are too large. Please ensure rates and amounts are below $10 trillion.',
      code: 'NUMERIC_OVERFLOW'
    };
  }
  
  // PostgreSQL constraint violation errors
  if (error.code === '23514') { // Check constraint violation
    if (error.constraint === 'company_size_check') {
      return {
        status: 400,
        error: 'Invalid company size. Please select from: self-employed, small, medium, large, or enterprise.',
        field: 'company_size',
        code: 'INVALID_COMPANY_SIZE'
      };
    }
    if (error.constraint === 'organization_type_check') {
      return {
        status: 400,
        error: 'Invalid organization type. Please select a valid option from the dropdown.',
        field: 'organization_type',
        code: 'INVALID_ORG_TYPE'
      };
    }
    if (error.constraint === 'pricing_model_check') {
      return {
        status: 400,
        error: 'Invalid pricing model. Please select from: hourly, project, retainer, subscription, or custom.',
        field: 'pricing_model',
        code: 'INVALID_PRICING_MODEL'
      };
    }
    if (error.constraint === 'availability_check') {
      return {
        status: 400,
        error: 'Invalid availability. Please select from: immediate, within_week, within_month, or unavailable.',
        field: 'availability',
        code: 'INVALID_AVAILABILITY'
      };
    }
    // Generic constraint violation
    return {
      status: 400,
      error: 'Invalid data provided. Please check all fields and try again.',
      code: 'CONSTRAINT_VIOLATION'
    };
  }
  
  // Unique constraint violations
  if (error.code === '23505') {
    return {
      status: 400,
      error: 'This value already exists. Please use a different one.',
      code: 'DUPLICATE_VALUE'
    };
  }
  
  // Invalid input syntax
  if (error.code === '22P02') {
    return {
      status: 400,
      error: 'Invalid input format. Please check your data and try again.',
      code: 'INVALID_FORMAT'
    };
  }
  
  // Default error
  return {
    status: 500,
    error: 'An unexpected error occurred while updating your profile. Please try again.',
    code: 'UPDATE_FAILED'
  };
};

// Safe JSON parse helper that handles empty strings, null values, and already-parsed objects
const safeJSONParse = (data, defaultValue = null) => {
  // If it's already an object/array, return it as-is
  if (data && typeof data === 'object') {
    return data;
  }
  
  // If it's null, undefined, or empty string, return default value
  if (!data || data === '') {
    return defaultValue;
  }
  
  // If it's a string, try to parse it
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (error) {
      console.warn('Failed to parse JSON:', data, 'Error:', error.message);
      return defaultValue;
    }
  }
  
  // For any other type, return default value
  return defaultValue;
};

// Validation helper functions
const validateCompanySize = (size) => {
  const validSizes = ['self-employed', 'small', 'medium', 'large', 'enterprise'];
  return !size || validSizes.includes(size);
};

const validateDeveloperOrgType = (type) => {
  const validTypes = ['corporation', 'government', 'ngo', 'academic', 'other'];
  return !type || validTypes.includes(type.toLowerCase());
};

const validatePricingModel = (model) => {
  const validModels = ['hourly', 'project', 'retainer', 'subscription', 'custom'];
  return !model || validModels.includes(model);
};

const validateAvailability = (availability) => {
  const validOptions = ['immediate', 'within_week', 'within_month', 'unavailable', 'scheduled'];
  return !availability || validOptions.includes(availability);
};

const validateEmail = (email) => {
  if (!email) return true;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateUrl = (url) => {
  if (!url) return true;
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

const validateYear = (year) => {
  if (!year) return true;
  const yearNum = parseInt(year);
  return yearNum >= 1800 && yearNum <= new Date().getFullYear();
};

// Get unified profile endpoint - CLEAN VERSION (NO LEGACY TABLES)
router.get('/unified/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // First check if a user exists with this ID
    const userResult = await pool.query(
      'SELECT id, email, first_name, last_name, role FROM users WHERE id = $1',
      [id]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    console.log(`🔍 Looking for profile for user ${id} with role: ${user.role}`);
    
    // For solutionProvider users, check service_providers table ONLY
    if (user.role === 'solutionProvider') {
      const serviceProviderResult = await pool.query(
        `SELECT 
          sp.*,
          u.email as user_email,
          u.first_name,
          u.last_name,
          u.role,
          'service_provider' as profile_type
        FROM service_providers sp
        JOIN users u ON sp.user_id = u.id
        WHERE sp.user_id = $1`,
        [id]
      );
      
      if (serviceProviderResult.rows.length > 0) {
        const provider = serviceProviderResult.rows[0];
        
        // These fields are already parsed by PostgreSQL, so we just need to ensure they're objects/arrays
        provider.specializations = safeJSONParse(provider.specializations, []);
        provider.certifications = safeJSONParse(provider.certifications, []);
        provider.regions_served = safeJSONParse(provider.regions_served, []);
        provider.industries_served = safeJSONParse(provider.industries_served, []);
        provider.services = safeJSONParse(provider.services, []);
        provider.languages = safeJSONParse(provider.languages, []);
        provider.contact_info = safeJSONParse(provider.contact_info, {});
        provider.social_profiles = safeJSONParse(provider.social_profiles, {});
        provider.visibility_settings = safeJSONParse(provider.visibility_settings, {
          publicProfile: true,
          showContactInfo: true,
          showFinancials: false,
          showProjects: true
        });
        provider.regions = safeJSONParse(provider.regions, []);
        
        console.log(`✅ Found service_provider profile for user ${id}`);
        return res.json(provider);
      } else {
        // solutionProvider user without service_provider profile
        console.log(`ℹ️ solutionProvider user ${id} has no service_provider profile`);
        return res.json({
          profile_type: 'none',
          user_exists: true,
          user_info: user,
          needs_profile_creation: true,
          suggested_profile_type: 'service_provider'
        });
      }
    }
    
    // For projectDeveloper users, check developer_profiles
    if (user.role === 'projectDeveloper') {
      const developerResult = await pool.query(
        `SELECT 
          d.*,
          u.email as user_email,
          u.first_name,
          u.last_name,
          u.role,
          'developer' as profile_type
        FROM developer_profiles d
        JOIN users u ON d.user_id = u.id
        WHERE d.user_id = $1`,
        [id]
      );
      
      if (developerResult.rows.length > 0) {
        const developer = developerResult.rows[0];
        
        // Handle PostgreSQL arrays (text[]) - these are already arrays, not JSON
        developer.regions = developer.regions || [];
        developer.project_types = developer.project_types || [];
        
        // Handle JSON fields
        developer.carbon_goals = safeJSONParse(developer.carbon_goals, {});
        developer.contact_info = safeJSONParse(developer.contact_info, {});
        developer.social_profiles = safeJSONParse(developer.social_profiles, {});
        developer.visibility_settings = safeJSONParse(developer.visibility_settings, {
          publicProfile: true,
          showContactInfo: true,
          showFinancials: false,
          showProjects: true
        });
        
        console.log(`✅ Found developer profile for user ${id}`);
        return res.json(developer);
      } else {
        // projectDeveloper user without developer profile
        console.log(`ℹ️ projectDeveloper user ${id} has no developer profile`);
        return res.json({
          profile_type: 'none',
          user_exists: true,
          user_info: user,
          needs_profile_creation: true,
          suggested_profile_type: 'developer'
        });
      }
    }
    
    // For consultant users, check consultant_profiles
    if (user.role === 'consultant') {
      const consultantResult = await pool.query(
        `SELECT 
          c.*,
          u.email as user_email,
          u.first_name,
          u.last_name,
          u.role,
          'consultant' as profile_type
        FROM consultant_profiles c
        JOIN users u ON c.user_id = u.id
        WHERE c.user_id = $1`,
        [id]
      );
      
      if (consultantResult.rows.length > 0) {
        const consultant = consultantResult.rows[0];
        
        // Parse JSON fields safely
        consultant.regions = consultant.regions || [];
        consultant.expertise = consultant.expertise || [];
        consultant.certifications = consultant.certifications || [];
        
        console.log(`✅ Found consultant profile for user ${id}`);
        return res.json(consultant);
      } else {
        // consultant user without consultant profile
        console.log(`ℹ️ consultant user ${id} has no consultant profile`);
        return res.json({
          profile_type: 'none',
          user_exists: true,
          user_info: user,
          needs_profile_creation: true,
          suggested_profile_type: 'consultant'
        });
      }
    }
    
    // For generalUser users, check general_user_profiles
    if (user.role === 'generalUser') {
      const generalUserResult = await pool.query(
        `SELECT 
          gup.*,
          u.email as user_email,
          u.first_name,
          u.last_name,
          u.role,
          'general' as profile_type
        FROM general_user_profiles gup
        JOIN users u ON gup.user_id = u.id
        WHERE gup.user_id = $1`,
        [id]
      );
      
      if (generalUserResult.rows.length > 0) {
        const generalUser = generalUserResult.rows[0];
        
        // Parse JSON fields safely
        generalUser.regions = generalUser.regions || [];
        generalUser.interests = generalUser.interests || [];
        
        console.log(`✅ Found general user profile for user ${id}`);
        return res.json(generalUser);
      }
      
      // For general users without profiles, return basic user info
      console.log(`ℹ️ General user ${id} has no extended profile, returning basic info`);
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
        user_info: {
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role
        }
      });
    }
    
    // For admin or unknown roles
    console.log(`ℹ️ User ${id} has role '${user.role}' - no specific profile type`);
    return res.json({
      profile_type: 'none',
      user_exists: true,
      user_info: user,
      needs_profile_creation: false,
      suggested_profile_type: null
    });
    
  } catch (error) {
    console.error('Error in unified profile route:', error);
    const errorInfo = parseErrorMessage(error);
    res.status(errorInfo.status).json({ 
      error: errorInfo.error,
      code: errorInfo.code 
    });
  }
});

// Get service provider profile
router.get('/service-provider/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT 
        sp.*,
        u.email as user_email,
        u.first_name,
        u.last_name,
        u.role
      FROM service_providers sp
      JOIN users u ON sp.user_id = u.id
      WHERE sp.user_id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service provider profile not found' });
    }
    
    const provider = result.rows[0];
    
    // Parse JSON fields safely
    provider.specializations = safeJSONParse(provider.specializations, []);
    provider.certifications = safeJSONParse(provider.certifications, []);
    provider.regions_served = safeJSONParse(provider.regions_served, []);
    provider.industries_served = safeJSONParse(provider.industries_served, []);
    provider.services = safeJSONParse(provider.services, []);
    provider.languages = safeJSONParse(provider.languages, []);
    provider.contact_info = safeJSONParse(provider.contact_info, {});
    provider.social_profiles = safeJSONParse(provider.social_profiles, {});
    provider.visibility_settings = safeJSONParse(provider.visibility_settings, {
      publicProfile: true,
      showContactInfo: true,
      showFinancials: false,
      showProjects: true
    });
    provider.regions = safeJSONParse(provider.regions, []);
    
    res.json(provider);
  } catch (error) {
    const errorInfo = parseErrorMessage(error);
    res.status(errorInfo.status).json({ 
      error: errorInfo.error,
      code: errorInfo.code 
    });
  }
});

// Update service provider profile - FIXED VERSION WITH ALL FIELDS
router.put('/service-provider/:id', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Verify the user is updating their own profile
    if (parseInt(id) !== userId) {
      return res.status(403).json({ 
        error: 'You can only update your own profile',
        code: 'UNAUTHORIZED' 
      });
    }
    
    // Extract all possible fields from request body
    const {
      // Fields that match database columns
      provider_type,
      company_name,
      description,
      company_description, // Map to description
      specializations,
      certifications,
      regions_served,
      regions, // Map to regions_served
      industries_served,
      pricing_model,
      hourly_rate_min,
      hourly_rate_max,
      project_minimum,
      team_size,
      languages,
      website,
      availability,
      response_time,
      
      // New fields that need to be added to database
      organization_name,
      organization_type,
      company_size,
      headquarters_country,
      headquarters_city,
      industry,
      founded_year,
      services,
      contact_info,
      social_profiles,
      visibility_settings,
      years_experience,
      
      // Fields from AddSolutionForm that might come through
      contact_email,
      contact_phone,
      linkedin_url
    } = req.body;
    
    // Validate required fields
    if (!company_name && !organization_name) {
      return res.status(400).json({ 
        error: 'Company name is required',
        field: 'company_name',
        code: 'REQUIRED_FIELD' 
      });
    }
    
    // Validate company_size if provided
    if (company_size && !validateCompanySize(company_size)) {
      return res.status(400).json({ 
        error: 'Invalid company size. Please select from: self-employed, small, medium, large, or enterprise.',
        field: 'company_size',
        code: 'INVALID_COMPANY_SIZE' 
      });
    }
    
    // Validate pricing model
    if (pricing_model && !validatePricingModel(pricing_model)) {
      return res.status(400).json({ 
        error: 'Invalid pricing model. Please select from: hourly, project, retainer, subscription, or custom.',
        field: 'pricing_model',
        code: 'INVALID_PRICING_MODEL' 
      });
    }
    
    // Validate availability
    if (availability && !validateAvailability(availability)) {
      return res.status(400).json({ 
        error: 'Invalid availability. Please select from: immediate, within_week, within_month, unavailable, or scheduled.',
        field: 'availability',
        code: 'INVALID_AVAILABILITY' 
      });
    }
    
    // Validate numeric fields
    if (hourly_rate_min && hourly_rate_max && 
        parseFloat(hourly_rate_min) > parseFloat(hourly_rate_max)) {
      return res.status(400).json({ 
        error: 'Maximum hourly rate must be greater than minimum rate',
        field: 'hourly_rate_max',
        code: 'INVALID_RANGE' 
      });
    }
    
    // Validate numeric field sizes (precision 15, scale 2 = max 9,999,999,999,999.99)
    const MAX_NUMERIC_VALUE = 9999999999999.99;
    
    if (hourly_rate_min && parseFloat(hourly_rate_min) > MAX_NUMERIC_VALUE) {
      return res.status(400).json({ 
        error: 'Minimum hourly rate cannot exceed $9,999,999,999,999.99',
        field: 'hourly_rate_min',
        code: 'NUMERIC_OVERFLOW' 
      });
    }
    
    if (hourly_rate_max && parseFloat(hourly_rate_max) > MAX_NUMERIC_VALUE) {
      return res.status(400).json({ 
        error: 'Maximum hourly rate cannot exceed $9,999,999,999,999.99',
        field: 'hourly_rate_max',
        code: 'NUMERIC_OVERFLOW' 
      });
    }
    
    if (project_minimum && parseFloat(project_minimum) > MAX_NUMERIC_VALUE) {
      return res.status(400).json({ 
        error: 'Project minimum cannot exceed $9,999,999,999,999.99',
        field: 'project_minimum',
        code: 'NUMERIC_OVERFLOW' 
      });
    }
    
    // Validate URLs
    if (website && !validateUrl(website)) {
      return res.status(400).json({ 
        error: 'Please enter a valid website URL',
        field: 'website',
        code: 'INVALID_URL' 
      });
    }
    
    // Build contact_info object from individual fields if needed
    const contactInfo = contact_info || {};
    if (contact_email && !contactInfo.contact_email) {
      contactInfo.contact_email = contact_email;
    }
    if (contact_phone && !contactInfo.contact_phone) {
      contactInfo.contact_phone = contact_phone;
    }
    
    // Build social_profiles object from individual fields if needed
    const socialProfiles = social_profiles || {};
    if (linkedin_url && !socialProfiles.linkedin) {
      socialProfiles.linkedin = linkedin_url;
    }
    
    // Map fields to match database schema
    const finalCompanyName = company_name || organization_name;
    const finalDescription = description || company_description || '';
    const finalRegionsServed = regions_served || regions || [];
    const finalRegions = regions || regions_served || [];
    
    await client.query('BEGIN');
    
    // Check if service provider profile exists
    const checkResult = await client.query(
      'SELECT id FROM service_providers WHERE user_id = $1',
      [userId]
    );
    
    let result;
    if (checkResult.rows.length === 0) {
      // Create new service provider profile
      result = await client.query(
        `INSERT INTO service_providers 
        (user_id, provider_type, company_name, description, specializations, 
         certifications, regions_served, industries_served, pricing_model, 
         hourly_rate_min, hourly_rate_max, project_minimum, team_size, 
         languages, website, availability, response_time, 
         organization_name, organization_type, company_size, headquarters_country,
         headquarters_city, industry, founded_year, services, contact_info,
         social_profiles, visibility_settings, regions, years_experience,
         created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 
                $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, NOW(), NOW())
        RETURNING *`,
        [
          userId,
          provider_type || 'Service Provider',
          finalCompanyName,
          finalDescription,
          JSON.stringify(specializations || []),
          JSON.stringify(certifications || []),
          JSON.stringify(finalRegionsServed),
          JSON.stringify(industries_served || []),
          pricing_model || null,
          hourly_rate_min ? parseFloat(hourly_rate_min) : null,
          hourly_rate_max ? parseFloat(hourly_rate_max) : null,
          project_minimum ? parseFloat(project_minimum) : null,
          team_size || null,
          JSON.stringify(languages || []),
          website || null,
          availability || null,
          response_time || null,
          organization_name || finalCompanyName,
          organization_type || null,
          company_size || null,
          headquarters_country || null,
          headquarters_city || null,
          industry || null,
          founded_year ? parseInt(founded_year) : null,
          JSON.stringify(services || []),
          JSON.stringify(contactInfo),
          JSON.stringify(socialProfiles),
          JSON.stringify(visibility_settings || {
            publicProfile: true,
            showContactInfo: true,
            showFinancials: false,
            showProjects: true
          }),
          JSON.stringify(finalRegions),
          years_experience ? parseInt(years_experience) : null
        ]
      );
    } else {
      // Update existing service provider profile
      result = await client.query(
        `UPDATE service_providers 
        SET provider_type = $2,
            company_name = $3,
            description = $4,
            specializations = $5,
            certifications = $6,
            regions_served = $7,
            industries_served = $8,
            pricing_model = $9,
            hourly_rate_min = $10,
            hourly_rate_max = $11,
            project_minimum = $12,
            team_size = $13,
            languages = $14,
            website = $15,
            availability = $16,
            response_time = $17,
            organization_name = $18,
            organization_type = $19,
            company_size = $20,
            headquarters_country = $21,
            headquarters_city = $22,
            industry = $23,
            founded_year = $24,
            services = $25,
            contact_info = $26,
            social_profiles = $27,
            visibility_settings = $28,
            regions = $29,
            years_experience = $30,
            updated_at = NOW()
        WHERE user_id = $1
        RETURNING *`,
        [
          userId,
          provider_type || 'Service Provider',
          finalCompanyName,
          finalDescription,
          JSON.stringify(specializations || []),
          JSON.stringify(certifications || []),
          JSON.stringify(finalRegionsServed),
          JSON.stringify(industries_served || []),
          pricing_model || null,
          hourly_rate_min ? parseFloat(hourly_rate_min) : null,
          hourly_rate_max ? parseFloat(hourly_rate_max) : null,
          project_minimum ? parseFloat(project_minimum) : null,
          team_size || null,
          JSON.stringify(languages || []),
          website || null,
          availability || null,
          response_time || null,
          organization_name || finalCompanyName,
          organization_type || null,
          company_size || null,
          headquarters_country || null,
          headquarters_city || null,
          industry || null,
          founded_year ? parseInt(founded_year) : null,
          JSON.stringify(services || []),
          JSON.stringify(contactInfo),
          JSON.stringify(socialProfiles),
          JSON.stringify(visibility_settings || {
            publicProfile: true,
            showContactInfo: true,
            showFinancials: false,
            showProjects: true
          }),
          JSON.stringify(finalRegions),
          years_experience ? parseInt(years_experience) : null
        ]
      );
    }
    
    await client.query('COMMIT');
    
    // Parse JSON fields back to objects for response
    const profile = result.rows[0];
    profile.specializations = safeJSONParse(profile.specializations, []);
    profile.certifications = safeJSONParse(profile.certifications, []);
    profile.regions_served = safeJSONParse(profile.regions_served, []);
    profile.industries_served = safeJSONParse(profile.industries_served, []);
    profile.languages = safeJSONParse(profile.languages, []);
    profile.services = safeJSONParse(profile.services, []);
    profile.contact_info = safeJSONParse(profile.contact_info, {});
    profile.social_profiles = safeJSONParse(profile.social_profiles, {});
    profile.visibility_settings = safeJSONParse(profile.visibility_settings, {});
    profile.regions = safeJSONParse(profile.regions, []);
    
    res.json(profile);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating service provider profile:', error);
    const errorInfo = parseErrorMessage(error);
    res.status(errorInfo.status).json({ 
      error: errorInfo.error,
      field: errorInfo.field,
      code: errorInfo.code 
    });
  } finally {
    client.release();
  }
});

// Legacy route aliases that redirect to service-provider routes
// These maintain backward compatibility but use the new service_providers table

router.get('/provider/:id', authenticateToken, (req, res, next) => {
  // Forward to service-provider route
  req.url = req.url.replace('/provider/', '/service-provider/');
  req.originalUrl = req.originalUrl.replace('/provider/', '/service-provider/');
  return router.handle(req, res, next);
});

router.put('/provider/:id', authenticateToken, (req, res, next) => {
  // Forward to service-provider route
  req.url = req.url.replace('/provider/', '/service-provider/');
  req.originalUrl = req.originalUrl.replace('/provider/', '/service-provider/');
  return router.handle(req, res, next);
});

router.get('/solutionProvider/:id', authenticateToken, (req, res, next) => {
  // Forward to service-provider route
  req.url = req.url.replace('/solutionProvider/', '/service-provider/');
  req.originalUrl = req.originalUrl.replace('/solutionProvider/', '/service-provider/');
  return router.handle(req, res, next);
});

router.put('/solutionProvider/:id', authenticateToken, (req, res, next) => {
  // Forward to service-provider route
  req.url = req.url.replace('/solutionProvider/', '/service-provider/');
  req.originalUrl = req.originalUrl.replace('/solutionProvider/', '/service-provider/');
  return router.handle(req, res, next);
});

// Get developer profile
router.get('/developer/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT 
        d.*,
        u.email as user_email,
        u.first_name,
        u.last_name,
        u.role
      FROM developer_profiles d
      JOIN users u ON d.user_id = u.id
      WHERE d.user_id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Developer profile not found' });
    }
    
    const developer = result.rows[0];
    
    // Handle PostgreSQL arrays (text[]) - these are already arrays, not JSON
    developer.regions = developer.regions || [];
    developer.project_types = developer.project_types || [];
    
    // Handle JSON fields
    developer.carbon_goals = safeJSONParse(developer.carbon_goals, {});
    developer.contact_info = safeJSONParse(developer.contact_info, {});
    developer.social_profiles = safeJSONParse(developer.social_profiles, {});
    developer.visibility_settings = safeJSONParse(developer.visibility_settings, {
      publicProfile: true,
      showContactInfo: true,
      showFinancials: false,
      showProjects: true
    });
    
    res.json(developer);
  } catch (error) {
    const errorInfo = parseErrorMessage(error);
    res.status(errorInfo.status).json({ 
      error: errorInfo.error,
      code: errorInfo.code 
    });
  }
});

// Update developer profile
router.put('/developer/:id', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Verify the user is updating their own profile
    if (parseInt(id) !== userId) {
      return res.status(403).json({ 
        error: 'You can only update your own profile',
        code: 'UNAUTHORIZED' 
      });
    }
    
    // Validate required fields
    if (!req.body.organization_name) {
      return res.status(400).json({ 
        error: 'Organization name is required',
        field: 'organization_name',
        code: 'REQUIRED_FIELD' 
      });
    }
    
    // Validate organization type for developers
    if (req.body.organization_type && !validateDeveloperOrgType(req.body.organization_type)) {
      return res.status(400).json({ 
        error: 'Invalid organization type. Please select from: Corporation, Government, NGO, Academic, or Other.',
        field: 'organization_type',
        code: 'INVALID_ORG_TYPE' 
      });
    }
    
    // Validate other fields
    if (req.body.founded_year && !validateYear(req.body.founded_year)) {
      return res.status(400).json({ 
        error: 'Please enter a valid year between 1800 and ' + new Date().getFullYear(),
        field: 'founded_year',
        code: 'INVALID_YEAR' 
      });
    }
    
    if (req.body.website && !validateUrl(req.body.website)) {
      return res.status(400).json({ 
        error: 'Please enter a valid website URL',
        field: 'website',
        code: 'INVALID_URL' 
      });
    }
    
    await client.query('BEGIN');
    
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
      contact_info,
      social_profiles,
      visibility_settings
    } = req.body;
    
    // Check if developer profile exists
    const checkResult = await client.query(
      'SELECT id FROM developer_profiles WHERE user_id = $1',
      [userId]
    );
    
    let result;
    if (checkResult.rows.length === 0) {
      // Create new developer profile
      result = await client.query(
        `INSERT INTO developer_profiles 
        (user_id, organization_name, organization_type, headquarters_country, 
         headquarters_city, industry, website, founded_year, company_description, 
         regions, project_types, carbon_goals, budget_range, project_timeline, 
         decision_makers, previous_projects, contact_info, social_profiles, 
         visibility_settings, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW(), NOW())
        RETURNING *`,
        [
          userId,
          organization_name,
          organization_type?.toLowerCase() || null,
          headquarters_country || null,
          headquarters_city || null,
          industry || null,
          website || null,
          founded_year || null,
          company_description || null,
          regions || [],
          project_types || [],
          JSON.stringify(carbon_goals || {}),
          budget_range || null,
          JSON.stringify(project_timeline || {}),
          JSON.stringify(decision_makers || []),
          JSON.stringify(previous_projects || []),
          JSON.stringify(contact_info || {}),
          JSON.stringify(social_profiles || {}),
          JSON.stringify(visibility_settings || {
            publicProfile: true,
            showContactInfo: true,
            showFinancials: false,
            showProjects: true
          })
        ]
      );
    } else {
      // Update existing developer profile
      result = await client.query(
        `UPDATE developer_profiles 
        SET organization_name = $2,
            organization_type = $3,
            headquarters_country = $4,
            headquarters_city = $5,
            industry = $6,
            website = $7,
            founded_year = $8,
            company_description = $9,
            regions = $10,
            project_types = $11,
            carbon_goals = $12,
            budget_range = $13,
            project_timeline = $14,
            decision_makers = $15,
            previous_projects = $16,
            contact_info = $17,
            social_profiles = $18,
            visibility_settings = $19,
            updated_at = NOW()
        WHERE user_id = $1
        RETURNING *`,
        [
          userId,
          organization_name,
          organization_type?.toLowerCase() || null,
          headquarters_country || null,
          headquarters_city || null,
          industry || null,
          website || null,
          founded_year || null,
          company_description || null,
          regions || [],
          project_types || [],
          JSON.stringify(carbon_goals || {}),
          budget_range || null,
          JSON.stringify(project_timeline || {}),
          JSON.stringify(decision_makers || []),
          JSON.stringify(previous_projects || []),
          JSON.stringify(contact_info || {}),
          JSON.stringify(social_profiles || {}),
          JSON.stringify(visibility_settings || {
            publicProfile: true,
            showContactInfo: true,
            showFinancials: false,
            showProjects: true
          })
        ]
      );
    }
    
    await client.query('COMMIT');
    res.json(result.rows[0]);
    
  } catch (error) {
    await client.query('ROLLBACK');
    const errorInfo = parseErrorMessage(error);
    res.status(errorInfo.status).json({ 
      error: errorInfo.error,
      field: errorInfo.field,
      code: errorInfo.code 
    });
  } finally {
    client.release();
  }
});

// Get consultant profile
router.get('/consultant/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT 
        c.*,
        u.email as user_email,
        u.first_name,
        u.last_name,
        u.role
      FROM consultant_profiles c
      JOIN users u ON c.user_id = u.id
      WHERE c.user_id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Consultant profile not found' });
    }
    
    const consultant = result.rows[0];
    
    // Parse JSON fields safely
    consultant.regions = consultant.regions || [];
    consultant.expertise = consultant.expertise || [];
    consultant.certifications = consultant.certifications || [];
    
    res.json(consultant);
  } catch (error) {
    const errorInfo = parseErrorMessage(error);
    res.status(errorInfo.status).json({ 
      error: errorInfo.error,
      code: errorInfo.code 
    });
  }
});

// Update consultant profile
router.put('/consultant/:id', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Verify the user is updating their own profile
    if (parseInt(id) !== userId) {
      return res.status(403).json({ 
        error: 'You can only update your own profile',
        code: 'UNAUTHORIZED' 
      });
    }
    
    await client.query('BEGIN');
    
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
      availability
    } = req.body;
    
    // Check if consultant profile exists
    const checkResult = await client.query(
      'SELECT id FROM consultant_profiles WHERE user_id = $1',
      [userId]
    );
    
    let result;
    if (checkResult.rows.length === 0) {
      // Create new consultant profile
      result = await client.query(
        `INSERT INTO consultant_profiles 
        (user_id, firm, is_independent, industry, regions, expertise, 
         years_of_experience, certifications, services_offered, client_types, 
         project_examples, rate_range, availability, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
        RETURNING *`,
        [
          userId,
          firm || null,
          is_independent || false,
          industry || null,
          JSON.stringify(regions || []),
          JSON.stringify(expertise || []),
          years_of_experience || null,
          JSON.stringify(certifications || []),
          JSON.stringify(services_offered || []),
          JSON.stringify(client_types || []),
          JSON.stringify(project_examples || []),
          rate_range || null,
          availability || null
        ]
      );
    } else {
      // Update existing consultant profile
      result = await client.query(
        `UPDATE consultant_profiles 
        SET firm = $2,
            is_independent = $3,
            industry = $4,
            regions = $5,
            expertise = $6,
            years_of_experience = $7,
            certifications = $8,
            services_offered = $9,
            client_types = $10,
            project_examples = $11,
            rate_range = $12,
            availability = $13,
            updated_at = NOW()
        WHERE user_id = $1
        RETURNING *`,
        [
          userId,
          firm || null,
          is_independent || false,
          industry || null,
          JSON.stringify(regions || []),
          JSON.stringify(expertise || []),
          years_of_experience || null,
          JSON.stringify(certifications || []),
          JSON.stringify(services_offered || []),
          JSON.stringify(client_types || []),
          JSON.stringify(project_examples || []),
          rate_range || null,
          availability || null
        ]
      );
    }
    
    await client.query('COMMIT');
    res.json(result.rows[0]);
    
  } catch (error) {
    await client.query('ROLLBACK');
    const errorInfo = parseErrorMessage(error);
    res.status(errorInfo.status).json({ 
      error: errorInfo.error,
      field: errorInfo.field,
      code: errorInfo.code 
    });
  } finally {
    client.release();
  }
});

// Get general user profile
router.get('/general/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT 
        gup.*,
        u.email as user_email,
        u.first_name,
        u.last_name,
        u.role
      FROM general_user_profiles gup
      JOIN users u ON gup.user_id = u.id
      WHERE gup.user_id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'General user profile not found' });
    }
    
    const generalUser = result.rows[0];
    
    // Parse JSON fields safely
    generalUser.regions = generalUser.regions || [];
    generalUser.interests = generalUser.interests || [];
    
    res.json(generalUser);
  } catch (error) {
    const errorInfo = parseErrorMessage(error);
    res.status(errorInfo.status).json({ 
      error: errorInfo.error,
      code: errorInfo.code 
    });
  }
});

// Update general user profile
router.put('/general/:id', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Verify the user is updating their own profile
    if (parseInt(id) !== userId) {
      return res.status(403).json({ 
        error: 'You can only update your own profile',
        code: 'UNAUTHORIZED' 
      });
    }
    
    await client.query('BEGIN');
    
    const {
      industry,
      regions,
      interests,
      bio,
      notifications_enabled,
      newsletter_subscribed
    } = req.body;
    
    // Check if general user profile exists
    const checkResult = await client.query(
      'SELECT user_id FROM general_user_profiles WHERE user_id = $1',
      [userId]
    );
    
    let result;
    if (checkResult.rows.length === 0) {
      // Create new general user profile
      result = await client.query(
        `INSERT INTO general_user_profiles 
        (user_id, industry, regions, interests, bio, notifications_enabled, 
         newsletter_subscribed, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING *`,
        [
          userId,
          industry || null,
          JSON.stringify(regions || []),
          JSON.stringify(interests || []),
          bio || '',
          notifications_enabled !== false,
          newsletter_subscribed || false
        ]
      );
    } else {
      // Update existing general user profile
      result = await client.query(
        `UPDATE general_user_profiles 
        SET industry = $2,
            regions = $3,
            interests = $4,
            bio = $5,
            notifications_enabled = $6,
            newsletter_subscribed = $7,
            updated_at = NOW()
        WHERE user_id = $1
        RETURNING *`,
        [
          userId,
          industry || null,
          JSON.stringify(regions || []),
          JSON.stringify(interests || []),
          bio || '',
          notifications_enabled !== false,
          newsletter_subscribed || false
        ]
      );
    }
    
    await client.query('COMMIT');
    res.json(result.rows[0]);
    
  } catch (error) {
    await client.query('ROLLBACK');
    const errorInfo = parseErrorMessage(error);
    res.status(errorInfo.status).json({ 
      error: errorInfo.error,
      field: errorInfo.field,
      code: errorInfo.code 
    });
  } finally {
    client.release();
  }
});

// Get profile statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = {};
    
    // Get counts for each profile type
    const serviceProviderCount = await pool.query('SELECT COUNT(*) FROM service_providers');
    const developerCount = await pool.query('SELECT COUNT(*) FROM developer_profiles');
    const consultantCount = await pool.query('SELECT COUNT(*) FROM consultant_profiles');
    const generalUserCount = await pool.query('SELECT COUNT(*) FROM general_user_profiles');
    
    stats.totalProfiles = 
      parseInt(serviceProviderCount.rows[0].count) + 
      parseInt(developerCount.rows[0].count) + 
      parseInt(consultantCount.rows[0].count) + 
      parseInt(generalUserCount.rows[0].count);
    
    stats.byType = {
      service_providers: parseInt(serviceProviderCount.rows[0].count),
      developers: parseInt(developerCount.rows[0].count),
      consultants: parseInt(consultantCount.rows[0].count),
      general_users: parseInt(generalUserCount.rows[0].count)
    };
    
    res.json(stats);
    
  } catch (error) {
    const errorInfo = parseErrorMessage(error);
    res.status(errorInfo.status).json({ 
      error: errorInfo.error,
      code: errorInfo.code 
    });
  }
});

module.exports = router;