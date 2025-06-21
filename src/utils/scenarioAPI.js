// utils/scenarioAPI.js
import api from '../api-config';

/**
 * Helper function to log API response and data structure
 * @param {string} action - The action being performed
 * @param {object} response - The response object from axios
 * @returns {object} - The response data
 */
function logApiResponse(action, response) {
  console.group(`Assessment Project API ${action} Response`);
  console.log('Status:', response.status);
  console.log('Headers:', response.headers);
  console.log('Data:', response.data);
  console.log('Data structure:', {
    hasScenarioWrapper: !!response.data?.scenario,
    topLevelKeys: Object.keys(response.data || {}),
    dataType: typeof response.data,
    isArray: Array.isArray(response.data)
  });
  console.groupEnd();
  return response.data;
}

/**
 * Fetches scenarios for an ASSESSMENT PROJECT from the API
 * @param {string} projectId - The ID of the ASSESSMENT PROJECT to get scenarios for
 * @returns {Promise<object>} - Result object with success status and data or error
 */
export const getScenarios = async (projectId) => {
  if (!projectId) {
    console.error("Cannot fetch assessment project scenarios without a project ID");
    return { success: false, error: "No project ID available" };
  }
  
  try {
    console.log(`🔍 Fetching ASSESSMENT PROJECT scenarios for project ${projectId}`);
    
    // Use axios instead of fetch
    const response = await api.get(`/assessment-projects/${projectId}/scenarios`);
    
    // Log the response
    const scenarios = logApiResponse('getScenarios', response);
    
    // Process scenarios
    const processedScenarios = scenarios.map(scenario => {
      const scenarioData = scenario.scenario || scenario;
      
      if (scenarioData.data && Object.keys(scenarioData).length === 1) {
        return scenarioData.data;
      }
      
      return scenarioData;
    });
    
    console.log("✅ Processed ASSESSMENT PROJECT scenarios for loading:", processedScenarios);
    return { success: true, data: processedScenarios };
  } catch (err) {
    console.error('❌ Error fetching assessment project scenarios:', err);
    return { success: false, error: err.response?.data?.message || err.message };
  }
};

/**
 * Saves a scenario to the database for an ASSESSMENT PROJECT
 * @param {string} projectId - The ID of the ASSESSMENT PROJECT this scenario belongs to
 * @param {object} scenarioData - The scenario data to save
 * @returns {Promise<object>} - Result object with success status and data or error
 */
export const saveScenario = async (projectId, scenarioData) => {
  if (!projectId) {
    console.error("Cannot save assessment project scenario without a project ID");
    return { success: false, error: "No project ID available" };
  }
  
  try {
    // Make sure the scenario has a name
    if (!scenarioData.name) {
      scenarioData.name = 'New Assessment Scenario';
    }
    
    console.log(`💾 Saving full ASSESSMENT PROJECT scenario data for project ${projectId}:`, scenarioData);
    
    // Use axios instead of fetch
    const response = await api.post(`/assessment-projects/${projectId}/scenarios`, { 
      scenario: scenarioData 
    });
    
    const savedScenario = response.data;
    
    // Unwrap the scenario if it's nested
    const unwrappedScenario = savedScenario.scenario || savedScenario;
    
    console.log("✅ Successfully saved ASSESSMENT PROJECT scenario with structure:", unwrappedScenario);
    
    return { success: true, data: unwrappedScenario };
  } catch (err) {
    console.error('❌ Error saving assessment project scenario:', err);
    return { success: false, error: err.response?.data?.message || err.message };
  }
};

/**
 * Updates an existing ASSESSMENT PROJECT scenario
 * @param {string} projectId - The ID of the ASSESSMENT PROJECT this scenario belongs to
 * @param {string} scenarioId - The ID of the scenario to update
 * @param {object} scenarioData - The updated scenario data
 * @returns {Promise<object>} - Result object with success status and data or error
 */
export const updateScenario = async (projectId, scenarioId, scenarioData) => {
  if (!projectId || !scenarioId) {
    console.error("Cannot update assessment project scenario without project ID and scenario ID");
    return { success: false, error: "Missing required IDs" };
  }
  
  try {
    console.log(`📝 Updating ASSESSMENT PROJECT scenario ${scenarioId} with full data:`, scenarioData);
    
    // Use axios instead of fetch
    const response = await api.put(`/assessment-projects/${projectId}/scenarios/${scenarioId}`, { 
      scenario: scenarioData 
    });
    
    const updatedScenario = response.data;
    
    // Unwrap the scenario if it's nested
    const unwrappedScenario = updatedScenario.scenario || updatedScenario;
    
    console.log("✅ Successfully updated ASSESSMENT PROJECT scenario with structure:", unwrappedScenario);
    
    return { success: true, data: unwrappedScenario };
  } catch (err) {
    console.error('❌ Error updating assessment project scenario:', err);
    return { success: false, error: err.response?.data?.message || err.message };
  }
};

/**
 * Deletes an ASSESSMENT PROJECT scenario
 * @param {string} projectId - The ID of the ASSESSMENT PROJECT this scenario belongs to
 * @param {string} scenarioId - The ID of the scenario to delete
 * @returns {Promise<object>} - Result object with success status and data or error
 */
export const deleteScenario = async (projectId, scenarioId) => {
  if (!projectId || !scenarioId) {
    console.error("Cannot delete assessment project scenario without project ID and scenario ID");
    return { success: false, error: "Missing required IDs" };
  }
  
  try {
    console.log(`🗑️ Deleting ASSESSMENT PROJECT scenario ${scenarioId} from project ${projectId}`);
    
    // Use axios instead of fetch
    const response = await api.delete(`/assessment-projects/${projectId}/scenarios/${scenarioId}`);
    
    const result = response.data;
    console.log("✅ Successfully deleted ASSESSMENT PROJECT scenario");
    return { success: true, data: result };
  } catch (err) {
    console.error('❌ Error deleting assessment project scenario:', err);
    return { success: false, error: err.response?.data?.message || err.message };
  }
};

/**
 * Duplicates an ASSESSMENT PROJECT scenario by copying its data and creating a new one
 * @param {string} projectId - The ID of the ASSESSMENT PROJECT this scenario belongs to
 * @param {object|string} scenario - The scenario to duplicate (or its ID)
 * @returns {Promise<object>} - Result object with success status and data or error
 */
export const duplicateScenario = async (projectId, scenario) => {
  if (!projectId) {
    console.error("Cannot duplicate assessment project scenario without a project ID");
    return { success: false, error: "Missing required data" };
  }
  
  try {
    // Check if we received a scenario object or just an ID
    let scenarioData;
    
    if (typeof scenario === 'string') {
      // We received just an ID, so we need to fetch the scenario data first
      console.log(`🔍 Fetching ASSESSMENT PROJECT scenario ${scenario} to duplicate`);
      const result = await getScenarios(projectId);
      
      if (!result.success) {
        throw new Error("Failed to fetch assessment project scenarios for duplication");
      }
      
      scenarioData = result.data.find(s => s.id === scenario);
      
      if (!scenarioData) {
        throw new Error(`Assessment project scenario with ID ${scenario} not found`);
      }
    } else {
      // We received the full scenario object
      scenarioData = scenario;
    }
    
    // Create a copy of the scenario with a new name
    const newScenarioData = {
      ...scenarioData,
      name: `${scenarioData.name} (Copy)`,
      id: undefined, // Remove ID so a new one is generated
      created_at: undefined,
      updated_at: undefined
    };
    
    console.log(`📋 Duplicating ASSESSMENT PROJECT scenario with new name: ${newScenarioData.name}`);
    
    // Save the new scenario
    return await saveScenario(projectId, newScenarioData);
  } catch (err) {
    console.error('❌ Error duplicating assessment project scenario:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Fetchs all scenarios for an ASSESSMENT PROJECT
 * @param {string} projectId - The ID of the ASSESSMENT PROJECT
 * @returns {Promise<object>} - Result object with success status and data or error
 */
export const fetchScenarios = async (projectId) => {
  // This is an alias for getScenarios to maintain backward compatibility
  return getScenarios(projectId);
};