// routes/emissionsRoutes.js - Updated to match existing structure
const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const authenticateToken = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Validation middleware for emissions data
const validateEmissionsData = [
  body('projectId').isInt().withMessage('Project ID must be an integer'),
  body('reportingYear').isInt({ min: 2000, max: 2030 }).withMessage('Reporting year must be between 2000 and 2030'),
  body('industryType').isLength({ min: 1 }).withMessage('Industry type is required'),
  body('totalEmissions').isFloat({ min: 0 }).withMessage('Total emissions must be a positive number'),
];

// GET /api/carbon-footprints/:id/emissions - Get emissions data for a project
router.get('/:id/emissions', authenticateToken, async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const userId = req.user.id;
    
    // First verify the project belongs to the user
    const projectCheck = await pool.query(
      'SELECT id FROM carbon_footprints WHERE id = $1 AND user_id = $2',
      [projectId, userId]
    );
    
    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found or unauthorized' });
    }
    
    // Get emissions calculation with strategies
    const emissionsQuery = `
      SELECT ec.*, 
             json_agg(
               json_build_object(
                 'id', ers.id,
                 'name', ers.strategy_name,
                 'description', ers.description,
                 'reductionPotential', ers.reduction_potential_percentage,
                 'implementationCost', ers.implementation_cost,
                 'timeframe', ers.timeframe,
                 'status', ers.status
               )
             ) FILTER (WHERE ers.id IS NOT NULL) as strategies
      FROM emissions_calculations ec
      LEFT JOIN emission_reduction_strategies ers ON ec.id = ers.emissions_calculation_id
      WHERE ec.project_id = $1
      GROUP BY ec.id
      ORDER BY ec.created_at DESC
      LIMIT 1
    `;
    
    const result = await pool.query(emissionsQuery, [projectId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No emissions data found for this project' });
    }
    
    const emissionsData = result.rows[0];
    
    // Transform data for frontend
    const response = {
      id: emissionsData.id,
      projectId: emissionsData.project_id,
      reportingYear: emissionsData.reporting_year,
      industryType: emissionsData.industry_type,
      location: emissionsData.location,
      rawInputs: emissionsData.raw_inputs,
      scope1: {
        stationary: parseFloat(emissionsData.scope1_stationary) || 0,
        mobile: parseFloat(emissionsData.scope1_mobile) || 0,
        refrigerants: parseFloat(emissionsData.scope1_refrigerants) || 0,
        process: parseFloat(emissionsData.scope1_process) || 0,
        livestock: parseFloat(emissionsData.scope1_livestock) || 0,
        fertilizers: parseFloat(emissionsData.scope1_fertilizers) || 0,
        landUse: parseFloat(emissionsData.scope1_land_use) || 0,
        total: parseFloat(emissionsData.scope1_total) || 0
      },
      scope2: {
        electricity: parseFloat(emissionsData.scope2_electricity) || 0,
        steam: parseFloat(emissionsData.scope2_steam) || 0,
        heating: parseFloat(emissionsData.scope2_heating) || 0,
        cooling: parseFloat(emissionsData.scope2_cooling) || 0,
        total: parseFloat(emissionsData.scope2_total) || 0
      },
      scope3: {
        purchasedGoods: parseFloat(emissionsData.scope3_purchased_goods) || 0,
        businessTravel: parseFloat(emissionsData.scope3_business_travel) || 0,
        employeeCommuting: parseFloat(emissionsData.scope3_employee_commuting) || 0,
        waste: parseFloat(emissionsData.scope3_waste) || 0,
        waterUsage: parseFloat(emissionsData.scope3_water_usage) || 0,
        total: parseFloat(emissionsData.scope3_total) || 0
      },
      totalEmissions: parseFloat(emissionsData.total_emissions) || 0,
      reductionTarget: emissionsData.reduction_target_percentage || 0,
      targetEmissions: parseFloat(emissionsData.target_emissions) || 0,
      offsetRequired: parseFloat(emissionsData.offset_required) || 0,
      reductionStrategies: emissionsData.strategies || [],
      verificationStatus: emissionsData.verification_status,
      createdAt: emissionsData.created_at,
      updatedAt: emissionsData.updated_at
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching emissions data:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/carbon-footprints/:id/emissions - Save emissions data
router.post('/:id/emissions', authenticateToken, validateEmissionsData, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { id: projectId } = req.params;
    const userId = req.user.id;
    const {
      reportingYear,
      industryType,
      location,
      rawInputs,
      scope1,
      scope2,
      scope3,
      totalEmissions,
      reductionTarget,
      targetEmissions,
      offsetRequired,
      reductionStrategies
    } = req.body;
    
    // First verify the project belongs to the user
    const projectCheck = await client.query(
      'SELECT id FROM carbon_footprints WHERE id = $1 AND user_id = $2',
      [projectId, userId]
    );
    
    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found or unauthorized' });
    }
    
    await client.query('BEGIN');
    
    // Check if emissions data already exists
    const existingQuery = 'SELECT id FROM emissions_calculations WHERE project_id = $1';
    const existingResult = await client.query(existingQuery, [projectId]);
    
    let emissionsId;
    
    if (existingResult.rows.length > 0) {
      // Update existing record
      emissionsId = existingResult.rows[0].id;
      
      const updateQuery = `
        UPDATE emissions_calculations SET
          reporting_year = $2,
          industry_type = $3,
          location = $4,
          raw_inputs = $5,
          scope1_stationary = $6,
          scope1_mobile = $7,
          scope1_refrigerants = $8,
          scope1_process = $9,
          scope1_livestock = $10,
          scope1_fertilizers = $11,
          scope1_land_use = $12,
          scope1_total = $13,
          scope2_electricity = $14,
          scope2_steam = $15,
          scope2_heating = $16,
          scope2_cooling = $17,
          scope2_total = $18,
          scope3_purchased_goods = $19,
          scope3_business_travel = $20,
          scope3_employee_commuting = $21,
          scope3_waste = $22,
          scope3_water_usage = $23,
          scope3_total = $24,
          total_emissions = $25,
          reduction_target_percentage = $26,
          target_emissions = $27,
          offset_required = $28,
          updated_at = NOW()
        WHERE id = $1
      `;
      
      await client.query(updateQuery, [
        emissionsId, reportingYear, industryType, location, JSON.stringify(rawInputs),
        scope1.stationary || 0, scope1.mobile || 0, scope1.refrigerants || 0, scope1.process || 0,
        scope1.livestock || 0, scope1.fertilizers || 0, scope1.landUse || 0, scope1.total || 0,
        scope2.electricity || 0, scope2.steam || 0, scope2.heating || 0, scope2.cooling || 0, scope2.total || 0,
        scope3.purchasedGoods || 0, scope3.businessTravel || 0, scope3.employeeCommuting || 0,
        scope3.waste || 0, scope3.waterUsage || 0, scope3.total || 0,
        totalEmissions, reductionTarget || 0, targetEmissions || 0, offsetRequired || 0
      ]);
      
      // Delete existing strategies
      await client.query('DELETE FROM emission_reduction_strategies WHERE emissions_calculation_id = $1', [emissionsId]);
      
    } else {
      // Create new record
      const insertQuery = `
        INSERT INTO emissions_calculations (
          project_id, reporting_year, industry_type, location, raw_inputs,
          scope1_stationary, scope1_mobile, scope1_refrigerants, scope1_process,
          scope1_livestock, scope1_fertilizers, scope1_land_use, scope1_total,
          scope2_electricity, scope2_steam, scope2_heating, scope2_cooling, scope2_total,
          scope3_purchased_goods, scope3_business_travel, scope3_employee_commuting,
          scope3_waste, scope3_water_usage, scope3_total,
          total_emissions, reduction_target_percentage, target_emissions, offset_required
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
          $19, $20, $21, $22, $23, $24, $25, $26, $27, $28
        ) RETURNING id
      `;
      
      const insertResult = await client.query(insertQuery, [
        projectId, reportingYear, industryType, location, JSON.stringify(rawInputs),
        scope1.stationary || 0, scope1.mobile || 0, scope1.refrigerants || 0, scope1.process || 0,
        scope1.livestock || 0, scope1.fertilizers || 0, scope1.landUse || 0, scope1.total || 0,
        scope2.electricity || 0, scope2.steam || 0, scope2.heating || 0, scope2.cooling || 0, scope2.total || 0,
        scope3.purchasedGoods || 0, scope3.businessTravel || 0, scope3.employeeCommuting || 0,
        scope3.waste || 0, scope3.waterUsage || 0, scope3.total || 0,
        totalEmissions, reductionTarget || 0, targetEmissions || 0, offsetRequired || 0
      ]);
      
      emissionsId = insertResult.rows[0].id;
    }
    
    // Insert reduction strategies
    if (reductionStrategies && reductionStrategies.length > 0) {
      for (const strategy of reductionStrategies) {
        await client.query(
          `INSERT INTO emission_reduction_strategies 
           (emissions_calculation_id, strategy_name, description, reduction_potential_percentage, 
            implementation_cost, timeframe) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            emissionsId, 
            strategy.name, 
            strategy.description, 
            strategy.reductionPotential,
            strategy.implementationCost, 
            strategy.timeframe
          ]
        );
      }
    }
    
    await client.query('COMMIT');
    
    // Return the saved data
    const savedData = await pool.query(
      'SELECT * FROM emissions_calculations WHERE id = $1',
      [emissionsId]
    );
    
    res.status(201).json({
      message: 'Emissions data saved successfully',
      data: savedData.rows[0]
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error saving emissions data:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// PUT /api/carbon-footprints/:id/emissions - Update emissions data
router.put('/:id/emissions', authenticateToken, validateEmissionsData, async (req, res) => {
  // Use the same logic as POST but force update
  const client = await pool.connect();
  
  try {
    const { id: projectId } = req.params;
    const userId = req.user.id;
    
    // First verify the project belongs to the user
    const projectCheck = await client.query(
      'SELECT id FROM carbon_footprints WHERE id = $1 AND user_id = $2',
      [projectId, userId]
    );
    
    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found or unauthorized' });
    }
    
    const {
      reportingYear,
      industryType,
      location,
      rawInputs,
      scope1,
      scope2,
      scope3,
      totalEmissions,
      reductionTarget,
      targetEmissions,
      offsetRequired,
      reductionStrategies
    } = req.body;
    
    await client.query('BEGIN');
    
    // Get existing emissions ID
    const existingQuery = 'SELECT id FROM emissions_calculations WHERE project_id = $1';
    const existingResult = await client.query(existingQuery, [projectId]);
    
    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'No emissions data found for this project' });
    }
    
    const emissionsId = existingResult.rows[0].id;
    
    // Update existing record
    const updateQuery = `
      UPDATE emissions_calculations SET
        reporting_year = $2,
        industry_type = $3,
        location = $4,
        raw_inputs = $5,
        scope1_stationary = $6,
        scope1_mobile = $7,
        scope1_refrigerants = $8,
        scope1_process = $9,
        scope1_livestock = $10,
        scope1_fertilizers = $11,
        scope1_land_use = $12,
        scope1_total = $13,
        scope2_electricity = $14,
        scope2_steam = $15,
        scope2_heating = $16,
        scope2_cooling = $17,
        scope2_total = $18,
        scope3_purchased_goods = $19,
        scope3_business_travel = $20,
        scope3_employee_commuting = $21,
        scope3_waste = $22,
        scope3_water_usage = $23,
        scope3_total = $24,
        total_emissions = $25,
        reduction_target_percentage = $26,
        target_emissions = $27,
        offset_required = $28,
        updated_at = NOW()
      WHERE id = $1
    `;
    
    await client.query(updateQuery, [
      emissionsId, reportingYear, industryType, location, JSON.stringify(rawInputs),
      scope1.stationary || 0, scope1.mobile || 0, scope1.refrigerants || 0, scope1.process || 0,
      scope1.livestock || 0, scope1.fertilizers || 0, scope1.landUse || 0, scope1.total || 0,
      scope2.electricity || 0, scope2.steam || 0, scope2.heating || 0, scope2.cooling || 0, scope2.total || 0,
      scope3.purchasedGoods || 0, scope3.businessTravel || 0, scope3.employeeCommuting || 0,
      scope3.waste || 0, scope3.waterUsage || 0, scope3.total || 0,
      totalEmissions, reductionTarget || 0, targetEmissions || 0, offsetRequired || 0
    ]);
    
    // Delete and re-insert strategies
    await client.query('DELETE FROM emission_reduction_strategies WHERE emissions_calculation_id = $1', [emissionsId]);
    
    if (reductionStrategies && reductionStrategies.length > 0) {
      for (const strategy of reductionStrategies) {
        await client.query(
          `INSERT INTO emission_reduction_strategies 
           (emissions_calculation_id, strategy_name, description, reduction_potential_percentage, 
            implementation_cost, timeframe) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            emissionsId, 
            strategy.name, 
            strategy.description, 
            strategy.reductionPotential,
            strategy.implementationCost, 
            strategy.timeframe
          ]
        );
      }
    }
    
    await client.query('COMMIT');
    
    res.json({ message: 'Emissions data updated successfully' });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating emissions data:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// GET /api/reporting-requirements/:location - Get reporting requirements for a location
router.get('/reporting-requirements/:location', async (req, res) => {
  try {
    const { location } = req.params;
    
    const query = `
      SELECT rr.*, 
             ls.legislation_text, 
             ls.version as latest_version,
             ls.snapshot_date as latest_snapshot_date
      FROM reporting_requirements rr
      LEFT JOIN LATERAL (
        SELECT legislation_text, version, snapshot_date 
        FROM legislation_snapshots ls2 
        WHERE ls2.requirement_id = rr.id 
        ORDER BY ls2.snapshot_date DESC 
        LIMIT 1
      ) ls ON true
      WHERE rr.country_code = $1 OR rr.country_code = 'GLOBAL'
      ORDER BY rr.is_mandatory DESC, rr.threshold_emissions ASC
    `;
    
    const result = await pool.query(query, [location.toUpperCase()]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching reporting requirements:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/emission-factors - Get emission factors
router.get('/emission-factors', async (req, res) => {
  try {
    const { country, category, year } = req.query;
    
    let query = 'SELECT * FROM emission_factors WHERE 1=1';
    const params = [];
    let paramCount = 0;
    
    if (country) {
      paramCount++;
      query += ` AND (country_code = $${paramCount} OR country_code = 'GLOBAL')`;
      params.push(country.toUpperCase());
    }
    
    if (category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      params.push(category);
    }
    
    if (year) {
      paramCount++;
      query += ` AND year = $${paramCount}`;
      params.push(parseInt(year));
    }
    
    query += ' ORDER BY is_default DESC, country_code, year DESC';
    
    const result = await pool.query(query, params);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching emission factors:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;