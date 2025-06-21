// routes/carbonFootprintRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const authenticateToken = require('../middleware/auth');

// Helper function to convert snake_case to camelCase
const toCamelCase = (str) => {
    return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
};

// Helper function to convert an object's keys from snake_case to camelCase
const convertKeysToCamelCase = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    const converted = {};
    for (const key in obj) {
        const camelKey = toCamelCase(key);
        converted[camelKey] = obj[key];
    }
    return converted;
};

// Helper function to map country names to codes
const mapCountryToCode = (country) => {
    const countryMap = {
        'australia': 'AU',
        'united_states': 'US', 
        'european_union': 'EU',
        'united_kingdom': 'GB',
        'canada': 'CA',
        'china': 'CN',
        'india': 'IN',
        'japan': 'JP',
        'brazil': 'BR',
        'other': 'GLOBAL'
    };
    return countryMap[country?.toLowerCase()] || country?.toUpperCase() || 'GLOBAL';
};

/**
 * Get emission factors
 */
router.get('/emission-factors', async (req, res) => {
    try {
        const { country, year } = req.query;
        
        console.log('🔍 Fetching emission factors for:', { country, year });
        
        // Map country name to code
        const countryCode = mapCountryToCode(country);
        const targetYear = year && year !== 'undefined' ? parseInt(year) : 2024;
        
        console.log('🗺️ Mapped to country code:', countryCode, 'year:', targetYear);
        
        let query;
        let params;
        
        if (countryCode && countryCode !== 'GLOBAL') {
            // Get country-specific factors first, then global as fallback
            query = `
                SELECT * FROM emission_factors 
                WHERE (country_code = $1 OR country_code = 'GLOBAL') 
                AND year = $2
                ORDER BY 
                    CASE WHEN country_code = $1 THEN 0 ELSE 1 END,
                    factor_name
            `;
            params = [countryCode, targetYear];
        } else {
            // Get global factors only
            query = `
                SELECT * FROM emission_factors 
                WHERE country_code = 'GLOBAL' AND year = $1
                ORDER BY factor_name
            `;
            params = [targetYear];
        }
        
        const result = await pool.query(query, params);
        
        // Convert to camelCase
        const factors = result.rows.map(row => convertKeysToCamelCase(row));
        
        console.log(`✅ Found ${factors.length} emission factors`);
        res.json(factors);
        
    } catch (err) {
        console.error('❌ Error fetching emission factors:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get reporting requirements for a country
 */
router.get('/reporting-requirements/:country', async (req, res) => {
    try {
        const { country } = req.params;
        
        console.log('🔍 Fetching reporting requirements for:', country);
        
        // Map country name to code
        const countryCode = mapCountryToCode(country);
        
        console.log('🗺️ Mapped to country code:', countryCode);
        
        const result = await pool.query(
            'SELECT * FROM reporting_requirements WHERE country_code = $1 ORDER BY requirement_name',
            [countryCode]
        );
        
        // Convert to camelCase
        const requirements = result.rows.map(row => convertKeysToCamelCase(row));
        
        console.log(`✅ Found ${requirements.length} reporting requirements`);
        res.json(requirements);
        
    } catch (err) {
        console.error('❌ Error fetching reporting requirements:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get all carbon footprints for a user
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        console.log('🔍 Fetching carbon footprints for user:', userId);
        
        const result = await pool.query(
            `SELECT * FROM carbon_footprints WHERE user_id = $1 ORDER BY created_at DESC`,
            [userId]
        );
        
        // Convert all footprints to camelCase
        const footprints = result.rows.map(row => {
            const converted = convertKeysToCamelCase(row);
            // Parse serialized_state if it exists
            if (converted.serializedState && typeof converted.serializedState === 'string') {
                try {
                    converted.serializedState = JSON.parse(converted.serializedState);
                } catch (e) {
                    console.warn('Could not parse serialized state:', e);
                }
            }
            return converted;
        });
        
        console.log(`✅ Found ${footprints.length} carbon footprints for user ${userId}`);
        res.json(footprints);
    } catch (err) {
        console.error('❌ Error fetching carbon footprints:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * Get a specific carbon footprint by ID
 */
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const footprintId = req.params.id;
        const userId = req.user.id;
        
        console.log('🔍 Fetching carbon footprint:', footprintId, 'for user:', userId);
        
        const result = await pool.query(
            `SELECT * FROM carbon_footprints WHERE id = $1 AND user_id = $2`,
            [footprintId, userId]
        );
        
        if (result.rows.length === 0) {
            console.log('❌ Carbon footprint not found or unauthorized for user:', userId);
            return res.status(404).json({ error: 'Carbon footprint not found' });
        }
        
        // Convert snake_case keys to camelCase
        const footprintData = convertKeysToCamelCase(result.rows[0]);
        
        // Parse serialized_state if it exists and is a string
        if (footprintData.serializedState && typeof footprintData.serializedState === 'string') {
            try {
                footprintData.serializedState = JSON.parse(footprintData.serializedState);
            } catch (e) {
                console.warn('Could not parse serialized state:', e);
            }
        }
        
        console.log('✅ Found carbon footprint:', footprintData.name, 'for user:', userId);
        res.json(footprintData);
    } catch (err) {
        console.error('❌ Error fetching carbon footprint:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * Create a new carbon footprint
 */
router.post('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Convert request body to camelCase
        const camelCaseBody = convertKeysToCamelCase(req.body);
        
        const {
            name,
            description,
            organizationType,
            location,
            status = 'draft',
            employeeCount,
            facilityCount,
            fleetSize,
            annualRevenue,
            industryType,
            reportingYear,
            serializedState
        } = camelCaseBody;
        
        console.log('🔄 Creating carbon footprint for user:', userId);
        console.log('📝 Request data:', {
            name,
            organizationType,
            location,
            industryType,
            employeeCount
        });
        
        // Validate required fields
        if (!name) {
            console.log('❌ Name is required');
            return res.status(400).json({ error: 'Name is required' });
        }
        
        // Map location to country code if needed
        const mappedLocation = mapCountryToCode(location);
        console.log('🗺️ Mapped location:', location, '→', mappedLocation);
        
        const result = await pool.query(
            `INSERT INTO carbon_footprints (
                name, description, organization_type, location, status,
                employee_count, facility_count, fleet_size, annual_revenue,
                industry_type, reporting_year, serialized_state, user_id,
                created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW()) 
            RETURNING *`,
            [
                name, description, organizationType, mappedLocation, status,
                employeeCount, facilityCount, fleetSize, annualRevenue,
                industryType, reportingYear, 
                serializedState ? JSON.stringify(serializedState) : null,
                userId
            ]
        );
        
        // Convert response to camelCase
        const created = convertKeysToCamelCase(result.rows[0]);
        
        console.log('✅ Successfully created carbon footprint:', created.id, 'for user:', userId);
        res.status(201).json(created);
        
    } catch (err) {
        console.error('❌ Error creating carbon footprint:', err);
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
});

/**
 * Update a carbon footprint
 */
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const footprintId = req.params.id;
        const userId = req.user.id;
        
        // Convert request body to camelCase
        const camelCaseBody = convertKeysToCamelCase(req.body);
        
        const {
            name,
            description,
            organizationType,
            location,
            status,
            employeeCount,
            facilityCount,
            fleetSize,
            annualRevenue,
            industryType,
            reportingYear,
            serializedState
        } = camelCaseBody;
        
        console.log('🔄 Updating carbon footprint:', footprintId, 'for user:', userId);
        
        // Validate required fields
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }
        
        // Check if the footprint exists and belongs to the user
        const checkResult = await pool.query(
            `SELECT id FROM carbon_footprints WHERE id = $1 AND user_id = $2`,
            [footprintId, userId]
        );
        
        if (checkResult.rows.length === 0) {
            console.log('❌ Carbon footprint not found or unauthorized for user:', userId);
            return res.status(404).json({ error: 'Carbon footprint not found or unauthorized' });
        }
        
        // Map location to country code if needed
        const mappedLocation = mapCountryToCode(location);
        
        const result = await pool.query(
            `UPDATE carbon_footprints SET 
                name = $1, 
                description = $2,
                organization_type = $3,
                location = $4,
                status = $5,
                employee_count = $6,
                facility_count = $7,
                fleet_size = $8,
                annual_revenue = $9,
                industry_type = $10,
                reporting_year = $11,
                serialized_state = $12,
                updated_at = NOW()
            WHERE id = $13 AND user_id = $14 
            RETURNING *`,
            [
                name, description, organizationType, mappedLocation, status,
                employeeCount, facilityCount, fleetSize, annualRevenue,
                industryType, reportingYear,
                serializedState ? JSON.stringify(serializedState) : null,
                footprintId, userId
            ]
        );
        
        // Convert response to camelCase
        const updated = convertKeysToCamelCase(result.rows[0]);
        
        console.log('✅ Successfully updated carbon footprint for user:', userId);
        res.json(updated);
    } catch (err) {
        console.error('❌ Error updating carbon footprint:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * Delete a carbon footprint
 */
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const footprintId = req.params.id;
        const userId = req.user.id;
        
        console.log('🗑️ Deleting carbon footprint:', footprintId, 'for user:', userId);
        
        // Check if the footprint exists and belongs to the user
        const checkResult = await pool.query(
            `SELECT id FROM carbon_footprints WHERE id = $1 AND user_id = $2`,
            [footprintId, userId]
        );
        
        if (checkResult.rows.length === 0) {
            console.log('❌ Carbon footprint not found or unauthorized for user:', userId);
            return res.status(404).json({ error: 'Carbon footprint not found or unauthorized' });
        }
        
        // Delete associated data first (emissions calculations, scenarios, etc.)
        await pool.query(`DELETE FROM emissions_calculations WHERE project_id = $1`, [footprintId]);
        await pool.query(`DELETE FROM carbon_footprint_scenarios WHERE carbon_footprint_id = $1`, [footprintId]);
        
        // Delete the carbon footprint
        await pool.query(
            `DELETE FROM carbon_footprints WHERE id = $1 AND user_id = $2`,
            [footprintId, userId]
        );
        
        console.log('✅ Successfully deleted carbon footprint for user:', userId);
        res.json({ message: 'Carbon footprint deleted successfully' });
    } catch (err) {
        console.error('❌ Error deleting carbon footprint:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * Get scenarios for a carbon footprint
 */
router.get('/:id/scenarios', authenticateToken, async (req, res) => {
    try {
        const footprintId = req.params.id;
        const userId = req.user.id;
        
        console.log('🔍 Fetching scenarios for footprint:', footprintId, 'user:', userId);
        
        // Check if the footprint exists and belongs to the user
        const checkResult = await pool.query(
            `SELECT id FROM carbon_footprints WHERE id = $1 AND user_id = $2`,
            [footprintId, userId]
        );
        
        if (checkResult.rows.length === 0) {
            console.log('❌ Carbon footprint not found or unauthorized for user:', userId);
            return res.status(404).json({ error: 'Carbon footprint not found or unauthorized' });
        }
        
        // Get all scenarios for this footprint
        const scenariosResult = await pool.query(
            `SELECT * FROM carbon_footprint_scenarios WHERE carbon_footprint_id = $1 ORDER BY created_at DESC`,
            [footprintId]
        );
        
        // Convert to camelCase
        const scenarios = scenariosResult.rows.map(row => {
            const converted = convertKeysToCamelCase(row);
            // Parse data field if it's a string
            if (converted.data && typeof converted.data === 'string') {
                try {
                    converted.data = JSON.parse(converted.data);
                } catch (e) {
                    console.warn('Could not parse scenario data:', e);
                }
            }
            return converted;
        });
        
        console.log(`✅ Found ${scenarios.length} scenarios for footprint ${footprintId}, user ${userId}`);
        res.json(scenarios);
    } catch (err) {
        console.error('❌ Error fetching scenarios:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * Create a new scenario for a carbon footprint
 */
router.post('/:id/scenarios', authenticateToken, async (req, res) => {
    try {
        const footprintId = req.params.id;
        const userId = req.user.id;
        const { name, data } = req.body;
        
        console.log('🔄 Creating scenario for footprint:', footprintId, 'user:', userId);
        
        // Check if the footprint exists and belongs to the user
        const checkResult = await pool.query(
            `SELECT id FROM carbon_footprints WHERE id = $1 AND user_id = $2`,
            [footprintId, userId]
        );
        
        if (checkResult.rows.length === 0) {
            console.log('❌ Carbon footprint not found or unauthorized for user:', userId);
            return res.status(404).json({ error: 'Carbon footprint not found or unauthorized' });
        }
        
        // Create the scenario
        const result = await pool.query(
            `INSERT INTO carbon_footprint_scenarios (carbon_footprint_id, name, data, created_at, updated_at)
             VALUES ($1, $2, $3, NOW(), NOW()) RETURNING *`,
            [footprintId, name || 'New Scenario', JSON.stringify(data || {})]
        );
        
        // Convert to camelCase
        const created = convertKeysToCamelCase(result.rows[0]);
        if (created.data && typeof created.data === 'string') {
            created.data = JSON.parse(created.data);
        }
        
        console.log('✅ Successfully created scenario:', created.id, 'for user:', userId);
        res.status(201).json(created);
    } catch (err) {
        console.error('❌ Error creating scenario:', err);
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
});

/**
 * Update a scenario
 */
router.put('/:id/scenarios/:scenarioId', authenticateToken, async (req, res) => {
    try {
        const footprintId = req.params.id;
        const scenarioId = req.params.scenarioId;
        const userId = req.user.id;
        const { name, data } = req.body;
        
        console.log('🔄 Updating scenario:', scenarioId, 'for footprint:', footprintId, 'user:', userId);
        
        // Check if the footprint exists and belongs to the user
        const checkResult = await pool.query(
            `SELECT id FROM carbon_footprints WHERE id = $1 AND user_id = $2`,
            [footprintId, userId]
        );
        
        if (checkResult.rows.length === 0) {
            console.log('❌ Carbon footprint not found or unauthorized for user:', userId);
            return res.status(404).json({ error: 'Carbon footprint not found or unauthorized' });
        }
        
        // Update the scenario
        const result = await pool.query(
            `UPDATE carbon_footprint_scenarios 
             SET name = COALESCE($1, name), data = COALESCE($2, data), updated_at = NOW()
             WHERE id = $3 AND carbon_footprint_id = $4 RETURNING *`,
            [name, data ? JSON.stringify(data) : null, scenarioId, footprintId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Scenario not found' });
        }
        
        // Convert to camelCase
        const updated = convertKeysToCamelCase(result.rows[0]);
        if (updated.data && typeof updated.data === 'string') {
            updated.data = JSON.parse(updated.data);
        }
        
        console.log('✅ Successfully updated scenario for user:', userId);
        res.json(updated);
    } catch (err) {
        console.error('❌ Error updating scenario:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * Delete a scenario
 */
router.delete('/:id/scenarios/:scenarioId', authenticateToken, async (req, res) => {
    try {
        const footprintId = req.params.id;
        const scenarioId = req.params.scenarioId;
        const userId = req.user.id;
        
        console.log('🗑️ Deleting scenario:', scenarioId, 'from footprint:', footprintId, 'user:', userId);
        
        // Check if the footprint exists and belongs to the user
        const checkResult = await pool.query(
            `SELECT id FROM carbon_footprints WHERE id = $1 AND user_id = $2`,
            [footprintId, userId]
        );
        
        if (checkResult.rows.length === 0) {
            console.log('❌ Carbon footprint not found or unauthorized for user:', userId);
            return res.status(404).json({ error: 'Carbon footprint not found or unauthorized' });
        }
        
        // Delete the scenario
        const result = await pool.query(
            `DELETE FROM carbon_footprint_scenarios 
             WHERE id = $1 AND carbon_footprint_id = $2 RETURNING id, name`,
            [scenarioId, footprintId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Scenario not found' });
        }
        
        console.log('✅ Successfully deleted scenario for user:', userId);
        res.json({ 
            message: 'Scenario deleted successfully', 
            id: scenarioId,
            name: result.rows[0].name
        });
    } catch (err) {
        console.error('❌ Error deleting scenario:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * Get emissions calculations for a carbon footprint
 * This now fetches from the most recent scenario instead of emissions_calculations table
 */
router.get('/:id/emissions', authenticateToken, async (req, res) => {
    try {
        const footprintId = req.params.id;
        const userId = req.user.id;
        
        console.log('🔍 Fetching emissions from scenarios for footprint:', footprintId, 'user:', userId);
        
        // Check if the footprint exists and belongs to the user
        const checkResult = await pool.query(
            `SELECT id FROM carbon_footprints WHERE id = $1 AND user_id = $2`,
            [footprintId, userId]
        );
        
        if (checkResult.rows.length === 0) {
            console.log('❌ Carbon footprint not found or unauthorized for user:', userId);
            return res.status(404).json({ error: 'Carbon footprint not found or unauthorized' });
        }
        
        // Get the most recent scenario with emissions data
        const result = await pool.query(
            `SELECT 
                id,
                name,
                data,
                created_at,
                updated_at
             FROM carbon_footprint_scenarios 
             WHERE carbon_footprint_id = $1 
             AND data->>'emissions' IS NOT NULL
             ORDER BY created_at DESC 
             LIMIT 1`,
            [footprintId]
        );
        
        if (result.rows.length === 0) {
            console.log('📊 No scenarios with emissions data found, returning empty response');
            // Return empty emissions structure instead of 404 to avoid HTML error
            return res.json({
                id: null,
                projectId: footprintId,
                emissions: {
                    scope1: { total: 0 },
                    scope2: { total: 0 },
                    scope3: { total: 0 },
                    total: 0
                },
                rawInputs: {},
                emissionValues: {},
                reductionStrategies: [],
                reductionTarget: 20
            });
        }
        
        const scenario = result.rows[0];
        const scenarioData = scenario.data;
        
        // Extract emissions data from scenario
        const emissionsResponse = {
            id: scenario.id,
            projectId: footprintId,
            scenarioId: scenario.id,
            scenarioName: scenario.name,
            reportingYear: scenarioData.reportingYear || new Date().getFullYear(),
            industryType: scenarioData.industryType || 'services',
            location: scenarioData.location || 'AU',
            rawInputs: scenarioData.rawInputs || {},
            emissionValues: scenarioData.emissionValues || {},
            emissions: scenarioData.emissions || {
                scope1: { total: 0 },
                scope2: { total: 0 },
                scope3: { total: 0 },
                total: 0
            },
            reductionStrategies: scenarioData.reductionStrategies || [],
            reductionTarget: scenarioData.reductionTarget || 20,
            createdAt: scenario.created_at,
            updatedAt: scenario.updated_at
        };
        
        console.log(`✅ Found emissions data in scenario: ${scenario.name}`);
        res.json(emissionsResponse);
        
    } catch (err) {
        console.error('❌ Error fetching emissions from scenarios:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * Save/Update emissions - this now updates the current scenario
 */
router.post('/:id/emissions', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    
    try {
        const footprintId = req.params.id;
        const userId = req.user.id;
        const emissionsData = req.body;
        
        console.log('🔄 Saving emissions to scenario for footprint:', footprintId, 'user:', userId);
        
        // Check if the footprint exists and belongs to the user
        const checkResult = await client.query(
            `SELECT id FROM carbon_footprints WHERE id = $1 AND user_id = $2`,
            [footprintId, userId]
        );
        
        if (checkResult.rows.length === 0) {
            console.log('❌ Carbon footprint not found or unauthorized for user:', userId);
            return res.status(404).json({ error: 'Carbon footprint not found or unauthorized' });
        }
        
        await client.query('BEGIN');
        
        // Get the most recent scenario or create one if none exists
        let scenarioResult = await client.query(
            `SELECT id, data FROM carbon_footprint_scenarios 
             WHERE carbon_footprint_id = $1 
             ORDER BY created_at DESC 
             LIMIT 1`,
            [footprintId]
        );
        
        let scenarioId;
        let existingData = {};
        
        if (scenarioResult.rows.length === 0) {
            // Create a new scenario if none exists
            const newScenarioResult = await client.query(
                `INSERT INTO carbon_footprint_scenarios (carbon_footprint_id, name, data, created_at, updated_at)
                 VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id`,
                [footprintId, 'Initial Emissions Scenario', JSON.stringify({})]
            );
            scenarioId = newScenarioResult.rows[0].id;
        } else {
            scenarioId = scenarioResult.rows[0].id;
            existingData = scenarioResult.rows[0].data || {};
        }
        
        // Merge the emissions data with existing scenario data
        const updatedData = {
            ...existingData,
            ...emissionsData,
            lastEmissionsUpdate: new Date().toISOString()
        };
        
        // Update the scenario with the emissions data
        await client.query(
            `UPDATE carbon_footprint_scenarios 
             SET data = $1, updated_at = NOW() 
             WHERE id = $2`,
            [JSON.stringify(updatedData), scenarioId]
        );
        
        await client.query('COMMIT');
        
        console.log('✅ Successfully saved emissions to scenario:', scenarioId);
        res.status(201).json({ 
            success: true, 
            data: { id: scenarioId, scenarioId },
            message: 'Emissions data saved successfully to scenario' 
        });
        
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Error saving emissions to scenario:', err);
        res.status(500).json({ error: 'Server error: ' + err.message });
    } finally {
        client.release();
    }
});

/**
 * Update emissions - same as POST but explicit
 */
router.put('/:id/emissions', authenticateToken, async (req, res) => {
    // Just forward to the POST handler since we're updating scenarios
    return router.post('/:id/emissions', authenticateToken)(req, res);
});

// POST /api/carbon-footprints/:footprintId/reports - Save a report for a carbon footprint
router.post('/:footprintId/reports', authenticateToken, async (req, res) => {
    try {
      const { footprintId } = req.params;
      const userId = req.user.id;
      const reportData = req.body;
      
      console.log(`💾 Saving report for carbon footprint ${footprintId} user: ${userId}`);
      
      // First, verify the user owns or has access to this footprint
      const footprintCheck = await pool.query(
        'SELECT id FROM carbon_footprints WHERE id = $1 AND user_id = $2',
        [footprintId, userId]
      );
      
      if (footprintCheck.rows.length === 0) {
        return res.status(404).json({ 
          error: 'Carbon footprint not found or access denied' 
        });
      }
      
      // Insert the report into the database
      const result = await pool.query(
        `INSERT INTO carbon_footprint_reports 
         (footprint_id, user_id, report_id, report_type, emissions_data, 
          reduction_target, strategies, report_content, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) 
         RETURNING *`,
        [
          footprintId,
          userId,
          reportData.reportId,
          reportData.reportType,
          JSON.stringify(reportData.emissionsData),
          reportData.reductionTarget,
          JSON.stringify(reportData.strategies),
          reportData.reportContent
        ]
      );
      
      // Convert to camelCase
      const created = convertKeysToCamelCase(result.rows[0]);
      
      console.log('✅ Successfully saved carbon footprint report');
      res.json(created);
    } catch (error) {
      console.error('❌ Error saving carbon footprint report:', error);
      res.status(500).json({ 
        error: 'Failed to save report',
        details: error.message 
      });
    }
  });
  
  // GET /api/carbon-footprints/:footprintId/reports - Get all reports for a carbon footprint
  router.get('/:footprintId/reports', authenticateToken, async (req, res) => {
    try {
      const { footprintId } = req.params;
      const userId = req.user.id;
      
      console.log(`📊 Fetching reports for carbon footprint ${footprintId} user: ${userId}`);
      
      // Get all reports for this footprint
      const result = await pool.query(
        `SELECT * FROM carbon_footprint_reports 
         WHERE footprint_id = $1 AND user_id = $2 
         ORDER BY created_at DESC`,
        [footprintId, userId]
      );
      
      // Convert to camelCase
      const reports = result.rows.map(row => convertKeysToCamelCase(row));
      
      console.log(`✅ Found ${reports.length} reports for footprint ${footprintId}`);
      res.json(reports);
    } catch (error) {
      console.error('❌ Error fetching carbon footprint reports:', error);
      res.status(500).json({ 
        error: 'Failed to fetch reports',
        details: error.message 
      });
    }
  });
  
  // GET /api/carbon-footprints/:footprintId/reports/:reportId - Get a specific report
  router.get('/:footprintId/reports/:reportId', authenticateToken, async (req, res) => {
    try {
      const { footprintId, reportId } = req.params;
      const userId = req.user.id;
      
      console.log(`📊 Fetching report ${reportId} for carbon footprint ${footprintId} user: ${userId}`);
      
      // Get the specific report
      const result = await pool.query(
        `SELECT * FROM carbon_footprint_reports 
         WHERE footprint_id = $1 AND report_id = $2 AND user_id = $3`,
        [footprintId, reportId, userId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ 
          error: 'Report not found' 
        });
      }
      
      // Convert to camelCase
      const report = convertKeysToCamelCase(result.rows[0]);
      
      console.log(`✅ Found report ${reportId}`);
      res.json(report);
    } catch (error) {
      console.error('❌ Error fetching carbon footprint report:', error);
      res.status(500).json({ 
        error: 'Failed to fetch report',
        details: error.message 
      });
    }
  });
  
  module.exports = router;