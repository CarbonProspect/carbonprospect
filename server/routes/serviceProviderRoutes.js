// routes/serviceProviderRoutes.js - Fixed to use correct column names
const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');

// Get all provider categories
router.get('/categories', async (req, res) => {
  try {
    // Get parent categories with their subcategories
    const query = `
      SELECT 
        pc.id,
        pc.category_name,
        pc.description,
        pc.parent_category_id,
        COALESCE(
          json_agg(
            json_build_object(
              'id', sc.id,
              'category_name', sc.category_name,
              'description', sc.description
            ) ORDER BY sc.category_name
          ) FILTER (WHERE sc.id IS NOT NULL), 
          '[]'
        ) as subcategories
      FROM provider_categories pc
      LEFT JOIN provider_categories sc ON sc.parent_category_id = pc.id
      WHERE pc.parent_category_id IS NULL
      GROUP BY pc.id, pc.category_name, pc.description, pc.parent_category_id
      ORDER BY pc.category_name
    `;
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
});

// Get all provider subcategories (flat list for form)
router.get('/categories/flat', async (req, res) => {
  try {
    const query = `
      SELECT 
        sc.id,
        sc.category_name,
        pc.category_name as parent_category_name
      FROM provider_categories sc
      JOIN provider_categories pc ON sc.parent_category_id = pc.id
      WHERE sc.parent_category_id IS NOT NULL
      ORDER BY pc.category_name, sc.category_name
    `;
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching flat categories:', error);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
});

// Create a new service provider with multiple provider types
router.post('/', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const userId = req.user.id;
    const {
      provider_types, // Array of provider type IDs
      company_name,
      description,
      specializations,
      certifications,
      regions_served,
      industries_served,
      pricing_model,
      hourly_rate_min,
      hourly_rate_max,
      project_minimum,
      years_experience,
      team_size,
      languages,
      website,
      linkedin_url,
      availability,
      response_time,
      image_url
    } = req.body;

    // Check if user already has a service provider profile
    const existingProvider = await client.query(
      'SELECT id FROM service_providers WHERE user_id = $1 AND status != $2',
      [userId, 'inactive']
    );

    if (existingProvider.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Service provider profile already exists' });
    }

    // Use the first provider type as the primary one for the provider_type column
    const primaryProviderType = provider_types && provider_types.length > 0 ? provider_types[0] : null;

    // Insert new service provider
    const insertQuery = `
      INSERT INTO service_providers (
        user_id, provider_type, company_name, description,
        specializations, certifications, regions_served, industries_served,
        pricing_model, hourly_rate_min, hourly_rate_max, project_minimum,
        years_experience, team_size, languages, website, linkedin_url,
        availability, response_time, image_url
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
      ) RETURNING *
    `;

    const values = [
      userId,
      primaryProviderType,
      company_name,
      description,
      JSON.stringify(specializations || []),
      JSON.stringify(certifications || []),
      JSON.stringify(regions_served || []),
      JSON.stringify(industries_served || []),
      pricing_model,
      hourly_rate_min || null,
      hourly_rate_max || null,
      project_minimum || null,
      years_experience || null,
      team_size,
      JSON.stringify(languages || []),
      website,
      linkedin_url,
      availability,
      response_time,
      image_url
    ];

    const result = await client.query(insertQuery, values);
    const serviceProviderId = result.rows[0].id;
    
    // Insert all provider types into user_provider_types table
    if (provider_types && provider_types.length > 0) {
      for (let i = 0; i < provider_types.length; i++) {
        await client.query(
          `INSERT INTO user_provider_types (service_provider_id, provider_type, is_primary) 
           VALUES ($1, $2, $3)`,
          [serviceProviderId, provider_types[i], i === 0]
        );
      }
    }
    
    await client.query('COMMIT');
    
    res.status(201).json({
      message: 'Service provider profile created successfully',
      provider: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating service provider:', error);
    res.status(500).json({ message: 'Failed to create service provider profile' });
  } finally {
    client.release();
  }
});

// Get all service providers with their multiple provider types
router.get('/', async (req, res) => {
  try {
    const { provider_type, region, industry, pricing_model } = req.query;
    
    // Fixed query - using first_name and last_name instead of full_name
    let query = `
      SELECT 
        sp.*,
        u.email,
        CONCAT(u.first_name, ' ', u.last_name) as full_name,
        pc.category_name as primary_provider_category_name,
        -- Get all provider types
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', upt.provider_type,
              'name', pc2.category_name,
              'parent_name', parent_pc.category_name,
              'is_primary', upt.is_primary
            )
          ) FILTER (WHERE upt.id IS NOT NULL),
          '[]'
        ) as provider_types_detail
      FROM service_providers sp
      JOIN users u ON sp.user_id = u.id
      LEFT JOIN provider_categories pc ON sp.provider_type::integer = pc.id
      LEFT JOIN user_provider_types upt ON sp.id = upt.service_provider_id
      LEFT JOIN provider_categories pc2 ON upt.provider_type::integer = pc2.id
      LEFT JOIN provider_categories parent_pc ON pc2.parent_category_id = parent_pc.id
      WHERE sp.status = 'active'
    `;
    
    const params = [];
    let paramCount = 1;

    // Handle multiple provider types
    if (provider_type) {
      const providerTypes = Array.isArray(provider_type) ? provider_type : [provider_type];
      
      if (providerTypes.length > 0) {
        const placeholders = providerTypes.map((_, index) => `${paramCount + index}`).join(',');
        
        query += ` AND (sp.provider_type IN (${placeholders}) OR EXISTS (
          SELECT 1 FROM user_provider_types upt2 
          WHERE upt2.service_provider_id = sp.id 
          AND upt2.provider_type IN (${placeholders})
        ))`;
        
        providerTypes.forEach(type => params.push(type));
        paramCount += providerTypes.length;
      }
    }

    if (region) {
      query += ` AND sp.regions_served @> ${paramCount}`;
      params.push(JSON.stringify([region]));
      paramCount++;
    }

    if (industry) {
      query += ` AND sp.industries_served @> ${paramCount}`;
      params.push(JSON.stringify([industry]));
      paramCount++;
    }

    if (pricing_model) {
      query += ` AND sp.pricing_model = ${paramCount}`;
      params.push(pricing_model);
      paramCount++;
    }

    query += ' GROUP BY sp.id, u.email, u.first_name, u.last_name, pc.category_name ORDER BY sp.created_at DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching service providers:', error);
    res.status(500).json({ message: 'Failed to fetch service providers' });
  }
});

// Get service provider by ID with all provider types
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Fixed query - using first_name and last_name instead of full_name
    const query = `
      SELECT 
        sp.*,
        u.email,
        CONCAT(u.first_name, ' ', u.last_name) as full_name,
        pc.category_name as primary_provider_category_name,
        -- Get all provider types
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', upt.provider_type,
              'name', pc2.category_name,
              'parent_name', parent_pc.category_name,
              'is_primary', upt.is_primary
            )
          ) FILTER (WHERE upt.id IS NOT NULL),
          '[]'
        ) as provider_types_detail
      FROM service_providers sp
      JOIN users u ON sp.user_id = u.id
      LEFT JOIN provider_categories pc ON sp.provider_type::integer = pc.id
      LEFT JOIN user_provider_types upt ON sp.id = upt.service_provider_id
      LEFT JOIN provider_categories pc2 ON upt.provider_type::integer = pc2.id
      LEFT JOIN provider_categories parent_pc ON pc2.parent_category_id = parent_pc.id
      WHERE sp.id = $1
      GROUP BY sp.id, u.email, u.first_name, u.last_name, pc.category_name
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Service provider not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching service provider:', error);
    res.status(500).json({ message: 'Failed to fetch service provider' });
  }
});

// Update service provider with multiple provider types
router.put('/:id', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if user owns this service provider profile
    const ownerCheck = await client.query(
      'SELECT id FROM service_providers WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (ownerCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(403).json({ message: 'Unauthorized to update this profile' });
    }
    
    const {
      provider_types, // Array of provider type IDs
      company_name,
      description,
      specializations,
      certifications,
      regions_served,
      industries_served,
      pricing_model,
      hourly_rate_min,
      hourly_rate_max,
      project_minimum,
      years_experience,
      team_size,
      languages,
      website,
      linkedin_url,
      availability,
      response_time,
      image_url,
      status
    } = req.body;
    
    // Use the first provider type as the primary one
    const primaryProviderType = provider_types && provider_types.length > 0 ? provider_types[0] : null;
    
    const updateQuery = `
      UPDATE service_providers
      SET 
        provider_type = COALESCE($1, provider_type),
        company_name = COALESCE($2, company_name),
        description = COALESCE($3, description),
        specializations = COALESCE($4, specializations),
        certifications = COALESCE($5, certifications),
        regions_served = COALESCE($6, regions_served),
        industries_served = COALESCE($7, industries_served),
        pricing_model = COALESCE($8, pricing_model),
        hourly_rate_min = COALESCE($9, hourly_rate_min),
        hourly_rate_max = COALESCE($10, hourly_rate_max),
        project_minimum = COALESCE($11, project_minimum),
        years_experience = COALESCE($12, years_experience),
        team_size = COALESCE($13, team_size),
        languages = COALESCE($14, languages),
        website = COALESCE($15, website),
        linkedin_url = COALESCE($16, linkedin_url),
        availability = COALESCE($17, availability),
        response_time = COALESCE($18, response_time),
        image_url = COALESCE($19, image_url),
        status = COALESCE($20, status),
        updated_at = NOW()
      WHERE id = $21
      RETURNING *
    `;
    
    const values = [
      primaryProviderType,
      company_name,
      description,
      specializations ? JSON.stringify(specializations) : null,
      certifications ? JSON.stringify(certifications) : null,
      regions_served ? JSON.stringify(regions_served) : null,
      industries_served ? JSON.stringify(industries_served) : null,
      pricing_model,
      hourly_rate_min,
      hourly_rate_max,
      project_minimum,
      years_experience,
      team_size,
      languages ? JSON.stringify(languages) : null,
      website,
      linkedin_url,
      availability,
      response_time,
      image_url,
      status,
      id
    ];
    
    const result = await client.query(updateQuery, values);
    
    // Update provider types if provided
    if (provider_types) {
      // Delete existing provider types
      await client.query('DELETE FROM user_provider_types WHERE service_provider_id = $1', [id]);
      
      // Insert new provider types
      for (let i = 0; i < provider_types.length; i++) {
        await client.query(
          `INSERT INTO user_provider_types (service_provider_id, provider_type, is_primary) 
           VALUES ($1, $2, $3)`,
          [id, provider_types[i], i === 0]
        );
      }
    }
    
    await client.query('COMMIT');
    
    res.json({
      message: 'Service provider profile updated successfully',
      provider: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating service provider:', error);
    res.status(500).json({ message: 'Failed to update service provider profile' });
  } finally {
    client.release();
  }
});

// Delete service provider
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if user owns this service provider profile
    const ownerCheck = await pool.query(
      'SELECT id FROM service_providers WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Unauthorized to delete this profile' });
    }
    
    // Soft delete by setting status to inactive
    await pool.query(
      'UPDATE service_providers SET status = $1, updated_at = NOW() WHERE id = $2',
      ['inactive', id]
    );
    
    res.json({ message: 'Service provider profile deleted successfully' });
  } catch (error) {
    console.error('Error deleting service provider:', error);
    res.status(500).json({ message: 'Failed to delete service provider profile' });
  }
});

module.exports = router;