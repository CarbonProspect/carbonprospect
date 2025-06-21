// Services/emissionsService.js
// Service for handling emissions calculations and data
// Updated to work with the new database structure

import api from '../api-config';

const emissionsService = {
  /**
   * Get project details for a carbon footprint
   * @param {string} projectId - The carbon footprint project ID
   * @returns {Promise<object>} - Project details including company information
   */
  async getProjectDetails(projectId) {
    if (!projectId) {
      throw new Error('Project ID is required');
    }

    try {
      const response = await api.get(`/carbon-footprints/${projectId}`);
      const data = response.data;
      
      // Transform the data to include company information
      return {
        ...data,
        company: {
          name: data.name || 'Unknown Company',
          size: {
            revenue: data.annual_revenue || 0,
            employees: data.employee_count || 0
          },
          isListed: data.isListed || false
        }
      };
    } catch (error) {
      console.error('Error fetching project details:', error);
      throw error;
    }
  },

  /**
   * Save report data
   * @param {object} reportData - The report data to save
   * @returns {Promise<object>} - Saved report data
   */
  async saveReport(reportData) {
    if (!reportData || !reportData.projectId) {
      throw new Error('Report data with project ID is required');
    }

    try {
      // Since we have a carbon_footprint_reports table, we might use this endpoint
      const response = await api.post(`/carbon-footprints/${reportData.projectId}/reports`, reportData);
      return response.data;
    } catch (error) {
      console.error('Error saving report:', error);
      throw error;
    }
  },

  /**
   * Get emissions calculations for a specific project (carbon footprint)
   * Emissions are now stored within carbon_footprint_scenarios
   * @param {string} projectId - The carbon footprint project ID
   * @returns {Promise<Array>} - Array of emissions calculations
   */
  async getEmissionsCalculationsForProject(projectId) {
    if (!projectId) {
      throw new Error('Project ID is required');
    }

    try {
      // Get scenarios for this carbon footprint
      const response = await api.get(`/carbon-footprints/${projectId}/scenarios`);
      const scenarios = response.data;
      
      // Extract emissions data from scenarios
      const emissionsData = [];
      
      for (const scenario of scenarios) {
        // Parse the scenario data if it's stored as JSONB
        const scenarioData = scenario.data || {};
        
        // Check if this scenario has emissions data
        if (scenarioData.emissions || scenarioData.emissionsData) {
          emissionsData.push({
            id: scenario.id,
            scenarioName: scenario.name,
            scenarioId: scenario.id,
            isBaseline: scenario.is_baseline || false,
            // Extract emissions data from the scenario
            emissions: scenarioData.emissions || scenarioData.emissionsData?.emissions || {
              scope1: 0,
              scope2: 0,
              scope3: 0,
              total: 0
            },
            emissionValues: scenarioData.emissionValues || scenarioData.emissionsData?.emissionValues || {},
            rawInputs: scenarioData.rawInputs || scenarioData.emissionsData?.rawInputs || {},
            reductionStrategies: scenarioData.reductionStrategies || scenarioData.emissionsData?.reductionStrategies || [],
            reductionTarget: scenarioData.reductionTarget || scenarioData.emissionsData?.reductionTarget || 20
          });
        }
      }
      
      return emissionsData;
    } catch (error) {
      console.error('Error fetching emissions calculations:', error);
      // Return empty array instead of throwing to prevent breaking the UI
      return [];
    }
  },

  /**
   * Save emissions calculation data for a project
   * This now updates the current scenario with emissions data
   * @param {string} projectId - The carbon footprint project ID
   * @param {object} emissionsData - The emissions data to save
   * @param {string} scenarioId - The scenario ID to update (optional)
   * @returns {Promise<object>} - Saved emissions data
   */
  async saveEmissionsCalculation(projectId, emissionsData, scenarioId = null) {
    if (!projectId) {
      throw new Error('Project ID is required');
    }

    if (!emissionsData) {
      throw new Error('Emissions data is required');
    }

    try {
      // If we have a scenario ID, update that specific scenario
      if (scenarioId) {
        const response = await api.get(`/carbon-footprints/${projectId}/scenarios/${scenarioId}`);
        const scenario = response.data;
        
        // Merge emissions data into scenario data
        const updatedData = {
          ...scenario.data,
          emissions: emissionsData.emissions,
          emissionValues: emissionsData.emissionValues,
          rawInputs: emissionsData.rawInputs,
          reductionStrategies: emissionsData.reductionStrategies,
          reductionTarget: emissionsData.reductionTarget,
          emissionsData: emissionsData
        };
        
        // Update the scenario
        await api.put(`/carbon-footprints/${projectId}/scenarios/${scenarioId}`, {
          name: scenario.name,
          data: updatedData
        });
        
        return emissionsData;
      } else {
        // If no scenario ID, this would be handled by the scenario creation in CarbonFootprintPage
        console.log('Note: Emissions should be saved as part of a scenario');
        return emissionsData;
      }
    } catch (error) {
      console.error('Error saving emissions calculation:', error);
      throw error;
    }
  },

  /**
   * Update existing emissions calculation data
   * This is now handled through scenario updates
   * @param {string} projectId - The carbon footprint project ID
   * @param {string} emissionsId - The emissions calculation ID (now scenario ID)
   * @param {object} emissionsData - The updated emissions data
   * @returns {Promise<object>} - Updated emissions data
   */
  async updateEmissionsCalculation(projectId, emissionsId, emissionsData) {
    // Redirect to saveEmissionsCalculation with scenario ID
    return this.saveEmissionsCalculation(projectId, emissionsData, emissionsId);
  },

  /**
   * Delete emissions calculation
   * Since emissions are part of scenarios, this would delete the scenario
   * @param {string} projectId - The carbon footprint project ID
   * @param {string} emissionsId - The emissions calculation ID (scenario ID)
   * @returns {Promise<boolean>} - Success status
   */
  async deleteEmissionsCalculation(projectId, emissionsId) {
    if (!projectId || !emissionsId) {
      throw new Error('Project ID and emissions ID are required');
    }

    try {
      // This would delete the scenario containing the emissions
      await api.delete(`/carbon-footprints/${projectId}/scenarios/${emissionsId}`);
      return true;
    } catch (error) {
      console.error('Error deleting emissions calculation:', error);
      throw error;
    }
  },

  /**
   * Calculate emissions based on activity data
   * This might be a separate endpoint or handled client-side
   * @param {object} activityData - Activity data for emissions calculation
   * @param {object} organizationInfo - Organization information for context
   * @returns {Promise<object>} - Calculated emissions data
   */
  async calculateEmissions(activityData, organizationInfo = {}) {
    if (!activityData) {
      throw new Error('Activity data is required for emissions calculation');
    }

    try {
      // This endpoint might not exist in your current setup
      // You might need to implement calculation logic client-side
      // or create this endpoint in your backend
      const response = await api.post('/emissions/calculate', {
        activityData,
        organizationInfo
      });
      return response.data;
    } catch (error) {
      console.error('Error calculating emissions:', error);
      // If the endpoint doesn't exist, return a basic calculation
      // You can implement your calculation logic here
      return {
        emissions: {
          scope1: 0,
          scope2: 0,
          scope3: 0,
          total: 0
        }
      };
    }
  },

  /**
   * Get emission factors for calculations
   * Based on your emission_factors table
   * @param {string} category - Emission factor category
   * @param {string} region - Geographic region for location-specific factors
   * @returns {Promise<object>} - Emission factors data
   */
  async getEmissionFactors(category, region = null) {
    try {
      let url = `/emission-factors`;
      const params = new URLSearchParams();
      
      if (category) params.append('category', category);
      if (region) params.append('region', region);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching emission factors:', error);
      // Return empty object if the endpoint doesn't exist
      return {};
    }
  },

  /**
   * Generate emissions report
   * Uses the carbon_footprint_reports table
   * @param {string} projectId - The carbon footprint project ID
   * @param {object} reportOptions - Report generation options
   * @returns {Promise<object>} - Generated report data
   */
  async generateReport(projectId, reportOptions = {}) {
    if (!projectId) {
      throw new Error('Project ID is required');
    }

    try {
      const response = await api.post(`/carbon-footprints/${projectId}/reports`, reportOptions);
      return response.data;
    } catch (error) {
      console.error('Error generating emissions report:', error);
      throw error;
    }
  }
};

export default emissionsService;