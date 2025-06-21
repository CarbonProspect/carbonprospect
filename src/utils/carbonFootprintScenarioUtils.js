// ✅ CLEAN: This file contains ONLY carbon footprint scenario utilities
// No carbon project or carbon credits functionality
import api from '../api-config'; // FIXED: Use the correct api-config import

/**
 * Utility functions for managing carbon footprint scenarios
 * These are scenarios for GHG compliance calculations, NOT carbon offset projects
 */

// Save a new carbon footprint scenario
export const saveScenario = async (footprintId, scenarioData) => {
  try {
    console.log('💾 [carbonFootprintScenarioUtils] Saving scenario for footprint:', footprintId);
    console.log('📦 [carbonFootprintScenarioUtils] Scenario data:', scenarioData);
    
    const response = await api.post(`/carbon-footprints/${footprintId}/scenarios`, {
      name: scenarioData.name,
      data: scenarioData // Save all scenario data
    });
    
    console.log('✅ [carbonFootprintScenarioUtils] Scenario saved successfully:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ [carbonFootprintScenarioUtils] Error saving scenario:', error);
    return { 
      success: false, 
      error: error.response?.data?.error || error.message || 'Failed to save scenario' 
    };
  }
};

// Get all scenarios for a carbon footprint
export const getScenarios = async (footprintId) => {
  try {
    console.log('🔍 [carbonFootprintScenarioUtils] Fetching scenarios for footprint:', footprintId);
    
    const response = await api.get(`/carbon-footprints/${footprintId}/scenarios`);
    console.log('📡 [carbonFootprintScenarioUtils] API response status:', response.status);
    console.log('📋 [carbonFootprintScenarioUtils] Scenarios data:', response.data);
    
    // Handle the response data - it might be wrapped or direct
    const scenarios = response.data?.data || response.data || [];
    
    console.log('✅ [carbonFootprintScenarioUtils] Scenarios fetched successfully:', scenarios.length);
    return { success: true, data: scenarios };
  } catch (error) {
    console.error('❌ [carbonFootprintScenarioUtils] Error fetching scenarios:', error);
    
    // Check if we got an HTML response (404 error)
    if (error.response && error.response.headers['content-type']?.includes('text/html')) {
      return { 
        success: false, 
        error: 'API endpoint not found - received HTML instead of JSON. Please check the server configuration.' 
      };
    }
    
    return { 
      success: false, 
      error: error.response?.data?.error || error.message || 'Failed to fetch scenarios' 
    };
  }
};

// Update an existing scenario
export const updateScenario = async (footprintId, scenarioId, scenarioData) => {
  try {
    console.log('✏️ [carbonFootprintScenarioUtils] Updating scenario:', scenarioId);
    
    const response = await api.put(`/carbon-footprints/${footprintId}/scenarios/${scenarioId}`, {
      name: scenarioData.name,
      data: scenarioData
    });
    
    console.log('✅ [carbonFootprintScenarioUtils] Scenario updated successfully');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ [carbonFootprintScenarioUtils] Error updating scenario:', error);
    return { 
      success: false, 
      error: error.response?.data?.error || error.message || 'Failed to update scenario' 
    };
  }
};

// Delete a scenario
export const deleteScenario = async (footprintId, scenarioId) => {
  try {
    console.log('🗑️ [carbonFootprintScenarioUtils] Deleting scenario:', scenarioId);
    
    await api.delete(`/carbon-footprints/${footprintId}/scenarios/${scenarioId}`);
    
    console.log('✅ [carbonFootprintScenarioUtils] Scenario deleted successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ [carbonFootprintScenarioUtils] Error deleting scenario:', error);
    return { 
      success: false, 
      error: error.response?.data?.error || error.message || 'Failed to delete scenario' 
    };
  }
};

// Duplicate a scenario
export const duplicateScenario = async (footprintId, scenario) => {
  try {
    console.log('📋 [carbonFootprintScenarioUtils] Duplicating scenario:', scenario.name);
    
    // Extract the scenario data
    let scenarioData = scenario.data || scenario;
    if (typeof scenarioData === 'string') {
      try {
        scenarioData = JSON.parse(scenarioData);
      } catch (e) {
        console.warn('Could not parse scenario data, using as-is');
      }
    }
    
    // Create a new scenario with duplicated data
    const duplicatedData = {
      ...scenarioData,
      name: `${scenario.name || 'Scenario'} (Copy)`,
    };
    
    const response = await api.post(`/carbon-footprints/${footprintId}/scenarios`, {
      name: duplicatedData.name,
      data: duplicatedData
    });
    
    console.log('✅ [carbonFootprintScenarioUtils] Scenario duplicated successfully');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ [carbonFootprintScenarioUtils] Error duplicating scenario:', error);
    return { 
      success: false, 
      error: error.response?.data?.error || error.message || 'Failed to duplicate scenario' 
    };
  }
};

// Export scenarios to JSON
export const exportScenarios = async (footprintId) => {
  try {
    console.log('📤 [carbonFootprintScenarioUtils] Exporting scenarios for footprint:', footprintId);
    
    const result = await getScenarios(footprintId);
    if (!result.success) {
      throw new Error(result.error);
    }
    
    const dataStr = JSON.stringify(result.data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `carbon-footprint-scenarios-${footprintId}-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    console.log('✅ [carbonFootprintScenarioUtils] Scenarios exported successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ [carbonFootprintScenarioUtils] Error exporting scenarios:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to export scenarios' 
    };
  }
};

// Import scenarios from JSON
export const importScenarios = async (footprintId, file) => {
  try {
    console.log('📥 [carbonFootprintScenarioUtils] Importing scenarios for footprint:', footprintId);
    
    const text = await file.text();
    const scenarios = JSON.parse(text);
    
    if (!Array.isArray(scenarios)) {
      throw new Error('Invalid file format: expected an array of scenarios');
    }
    
    const results = [];
    for (const scenario of scenarios) {
      const result = await saveScenario(footprintId, scenario);
      results.push(result);
    }
    
    const successCount = results.filter(r => r.success).length;
    console.log(`✅ [carbonFootprintScenarioUtils] Imported ${successCount}/${scenarios.length} scenarios successfully`);
    
    return { 
      success: true, 
      imported: successCount, 
      total: scenarios.length 
    };
  } catch (error) {
    console.error('❌ [carbonFootprintScenarioUtils] Error importing scenarios:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to import scenarios' 
    };
  }
};