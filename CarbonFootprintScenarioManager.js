import React, { useState, useEffect, useCallback } from 'react';
// This component ONLY uses carbon footprint scenario utilities
import { saveScenario, getScenarios, deleteScenario, duplicateScenario, updateScenario } from './utils/carbonFootprintScenarioUtils';

const CarbonFootprintScenarioManager = ({ 
  footprintId, 
  scenarioName, 
  setScenarioName, 
  currentData, 
  onLoadScenario, 
  onClose, 
  onCreateNew 
}) => {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newScenarioName, setNewScenarioName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [editingScenarioId, setEditingScenarioId] = useState(null);
  const [editingName, setEditingName] = useState('');

  // Function to fetch carbon footprint scenarios - wrapped in useCallback to prevent unnecessary rerenders
  const fetchScenarios = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("🔍 Fetching carbon footprint scenarios for footprint ID:", footprintId);
      const result = await getScenarios(footprintId);
      
      if (result.success) {
        setScenarios(result.data || []);
        console.log("✅ Carbon footprint scenarios fetched successfully:", result.data);
      } else {
        setError(result.error || 'Failed to fetch carbon footprint scenarios');
        console.error("❌ Failed to fetch carbon footprint scenarios:", result.error);
        setScenarios([]);
      }
    } catch (err) {
      console.error('❌ Error in carbon footprint scenario manager:', err);
      setError('An unexpected error occurred while fetching carbon footprint scenarios');
      setScenarios([]);
    } finally {
      setLoading(false);
    }
  }, [footprintId]);

  // Fetch scenarios when component mounts
  useEffect(() => {
    if (footprintId) {
      console.log("🚀 Carbon footprint scenario manager initialized for footprint ID:", footprintId);
      fetchScenarios();
    }
  }, [footprintId, fetchScenarios]);

  // Set initial new scenario name from prop
  useEffect(() => {
    setNewScenarioName(scenarioName || 'New Carbon Footprint Scenario');
  }, [scenarioName]);

  // 🔧 FIXED: Updated function to save current carbon footprint scenario with ALL emissions data
  const handleSaveCurrentScenario = async () => {
    console.log("💾 Saving carbon footprint scenario with name:", newScenarioName);
    
    if (!currentData) {
      console.error("❌ Cannot save carbon footprint scenario: No current data available");
      setError("Cannot save scenario: No data available");
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      // 🔧 FIXED: Prepare complete carbon footprint scenario data including ALL emissions data
      const scenarioData = {
        name: newScenarioName || scenarioName || 'New Carbon Footprint Scenario',
        organizationType: currentData.organizationType || 'corporate',
        industryType: currentData.industryType || 'services',
        location: currentData.location || '',
        employeeCount: currentData.employeeCount || 0,
        facilityCount: currentData.facilityCount || 0,
        fleetSize: currentData.fleetSize || 0,
        annualRevenue: currentData.annualRevenue || 0,
        reportingYear: currentData.reportingYear || new Date().getFullYear(),
        
        // 🔧 CRITICAL: Save ALL emissions-related data
        rawInputs: currentData.rawInputs || {},
        emissionValues: currentData.emissionValues || {},
        reductionStrategies: currentData.reductionStrategies || [],
        reductionTarget: currentData.reductionTarget || 20,
        emissionsData: currentData.emissionsData || null,
        
        // Save calculated emissions if available
        emissions: currentData.emissions || {
          scope1: 0,
          scope2: 0, 
          scope3: 0,
          total: 0
        },
        
        // Save any additional state that should be preserved
        activeSection: currentData.activeSection || {
          location: false,
          direct: true,
          indirect: false,
          valueChain: false,
          results: false,
          obligations: false,
          strategies: false
        }
      };

      console.log("💾 Saving complete carbon footprint scenario data:", {
        name: scenarioData.name,
        hasRawInputs: Object.keys(scenarioData.rawInputs).length > 0,
        hasEmissionValues: Object.keys(scenarioData.emissionValues).length > 0,
        hasReductionStrategies: scenarioData.reductionStrategies.length > 0,
        reductionTarget: scenarioData.reductionTarget,
        totalEmissions: scenarioData.emissions.total
      });
      
      const result = await saveScenario(footprintId, scenarioData);
      
      if (result.success) {
        // Update scenario name in parent component
        setScenarioName(newScenarioName);
        
        // Refresh scenarios list
        await fetchScenarios();
        
        // Show success message
        alert('Carbon footprint scenario saved successfully!');
        
        // Reset new scenario name
        setIsCreating(false);
      } else {
        setError(result.error || 'Failed to save carbon footprint scenario');
        console.error("❌ Failed to save carbon footprint scenario:", result.error);
      }
    } catch (err) {
      console.error('❌ Error saving carbon footprint scenario:', err);
      setError('An unexpected error occurred while saving the carbon footprint scenario');
    } finally {
      setLoading(false);
    }
  };

  // Function to start editing a scenario name
  const startEditingName = (scenario) => {
    setEditingScenarioId(scenario.id);
    setEditingName(scenario.name || 'Unnamed Scenario');
  };

  // Function to save edited scenario name
  const saveEditedName = async (scenario) => {
    if (!editingName.trim()) {
      setError("Scenario name cannot be empty");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("✏️ Updating scenario name:", editingName);
      
      // Extract scenario data for update
      let scenarioData = scenario.data || scenario;
      if (typeof scenarioData === 'string') {
        try {
          scenarioData = JSON.parse(scenarioData);
        } catch (e) {
          console.warn('Could not parse scenario data for update');
          scenarioData = scenario;
        }
      }

      // Update the name in the data
      const updatedData = {
        ...scenarioData,
        name: editingName.trim()
      };

      const result = await updateScenario(footprintId, scenario.id, updatedData);
      
      if (result.success) {
        console.log("✅ Scenario name updated successfully");
        setEditingScenarioId(null);
        setEditingName('');
        await fetchScenarios(); // Refresh the list
      } else {
        setError(result.error || 'Failed to update scenario name');
        console.error("❌ Failed to update scenario name:", result.error);
      }
    } catch (err) {
      console.error('❌ Error updating scenario name:', err);
      setError('An unexpected error occurred while updating the scenario name');
    } finally {
      setLoading(false);
    }
  };

  // Function to cancel editing
  const cancelEditing = () => {
    setEditingScenarioId(null);
    setEditingName('');
  };

  // Function to create a brand new carbon footprint scenario
  const handleCreateNewScenario = () => {
    console.log("💡 Creating new carbon footprint scenario - delegating to parent");
    // If parent provided a create function, use it
    if (typeof onCreateNew === 'function') {
      onCreateNew();
      onClose(); // Close the manager after creating
    } else {
      console.error("❌ No onCreateNew function provided to CarbonFootprintScenarioManager");
      // Fallback to just showing the scenario name input
      setIsCreating(true);
      setNewScenarioName(`New Carbon Footprint Scenario (${new Date().toLocaleDateString()})`);
    }
  };

  // 🔧 CRITICAL FIX: Updated function to load a carbon footprint scenario with complete data handling
  const handleLoadScenario = (scenario) => {
    console.log("📁 Loading carbon footprint scenario:", scenario);
    setSelectedScenario(scenario);
    
    // 🔧 CRITICAL FIX: Pass the complete scenario object, not just the data
    // This ensures the parent gets both the scenario metadata (id, name) AND the nested data
    console.log("📁 Passing complete scenario object to parent:", {
      id: scenario.id,
      name: scenario.name,
      hasNestedData: !!scenario.data,
      dataType: typeof scenario.data
    });
    
    // Call the parent handler with the complete scenario object
    // The parent will handle extracting nested data properly
    onLoadScenario(scenario);
    onClose();
  };

  // Function to delete a carbon footprint scenario
  const handleDeleteScenario = async (scenarioId, e) => {
    e.stopPropagation(); // Prevent triggering the row click
    
    if (!window.confirm('Are you sure you want to delete this carbon footprint scenario? This action cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      console.log("🗑️ Deleting carbon footprint scenario:", scenarioId);
      const result = await deleteScenario(footprintId, scenarioId);
      
      if (result.success) {
        console.log("✅ Carbon footprint scenario deleted successfully");
        // Refresh scenarios list
        await fetchScenarios();
      } else {
        setError(result.error || 'Failed to delete carbon footprint scenario');
        console.error("❌ Failed to delete carbon footprint scenario:", result.error);
      }
    } catch (err) {
      console.error('❌ Error deleting carbon footprint scenario:', err);
      setError('An unexpected error occurred while deleting the carbon footprint scenario');
    } finally {
      setLoading(false);
    }
  };

  // Function to duplicate a carbon footprint scenario
  const handleDuplicateScenario = async (scenario, e) => {
    e.stopPropagation(); // Prevent triggering the row click
    
    setLoading(true);
    setError(null);

    try {
      console.log("📋 Duplicating carbon footprint scenario:", scenario);
      const result = await duplicateScenario(footprintId, scenario);
      
      if (result.success) {
        console.log("✅ Carbon footprint scenario duplicated successfully");
        // Refresh scenarios list
        await fetchScenarios();
      } else {
        setError(result.error || 'Failed to duplicate carbon footprint scenario');
        console.error("❌ Failed to duplicate carbon footprint scenario:", result.error);
      }
    } catch (err) {
      console.error('❌ Error duplicating carbon footprint scenario:', err);
      setError('An unexpected error occurred while duplicating the carbon footprint scenario');
    } finally {
      setLoading(false);
    }
  };

  // 🔧 NEW: Helper function to safely extract data from nested scenario structure
  const extractScenarioData = (scenario) => {
    if (scenario.data) {
      if (typeof scenario.data === 'string') {
        try {
          return JSON.parse(scenario.data);
        } catch (e) {
          console.warn('Could not parse scenario data:', e);
          return {};
        }
      } else if (typeof scenario.data === 'object') {
        return scenario.data;
      }
    }
    return scenario; // Fallback to the scenario itself
  };

  return (
    <div className="carbon-footprint-scenario-manager bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-green-800 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Manage Carbon Footprint Scenarios
        </h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          <p className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </p>
        </div>
      )}

      {/* Create New Scenario Section */}
      <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
        <h3 className="font-medium text-green-700 mb-2">Create New Carbon Footprint Scenario</h3>
        
        {isCreating ? (
          <div className="flex items-center">
            <input
              type="text"
              value={newScenarioName}
              onChange={(e) => setNewScenarioName(e.target.value)}
              className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-green-500 focus:border-green-500"
              placeholder="Enter carbon footprint scenario name"
            />
            <button
              onClick={handleSaveCurrentScenario}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-r-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => setIsCreating(false)}
              className="ml-2 px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Save the current carbon footprint configuration as a new scenario
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setIsCreating(true)}
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Save Current
              </button>
              <button
                onClick={handleCreateNewScenario}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create New
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Existing Scenarios List */}
      <div>
        <h3 className="font-medium text-gray-700 mb-3">Saved Carbon Footprint Scenarios</h3>
        
        {loading && (
          <div className="flex justify-center my-4">
            <svg className="animate-spin h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
        
        {!loading && scenarios.length === 0 ? (
          <p className="text-gray-500 text-center py-4 border border-dashed border-gray-300 rounded-md">
            No carbon footprint scenarios saved yet
          </p>
        ) : (
          <div className="overflow-y-auto max-h-96 border border-gray-200 rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Industry
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Emissions
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employees
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {scenarios.map((scenario) => {
                  // 🔧 FIXED: Extract scenario data safely
                  const scenarioData = extractScenarioData(scenario);
                  
                  return (
                    <tr 
                      key={scenario.id} 
                      onClick={() => editingScenarioId !== scenario.id ? handleLoadScenario(scenario) : null}
                      className={`hover:bg-gray-50 cursor-pointer ${selectedScenario?.id === scenario.id ? 'bg-green-50 border-l-4 border-green-500' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingScenarioId === scenario.id ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="text-sm font-medium text-gray-900 border border-gray-300 rounded px-2 py-1 flex-grow"
                              onKeyPress={(e) => e.key === 'Enter' && saveEditedName(scenario)}
                              autoFocus
                            />
                            <button
                              onClick={() => saveEditedName(scenario)}
                              className="text-green-600 hover:text-green-800"
                              title="Save name"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="text-gray-600 hover:text-gray-800"
                              title="Cancel editing"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <div className="text-sm font-medium text-gray-900">
                              {scenario.name || 'Unnamed Carbon Footprint Scenario'}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditingName(scenario);
                              }}
                              className="text-gray-400 hover:text-gray-600"
                              title="Edit name"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {(() => {
                            const industryType = scenarioData.industryType || 'Unknown';
                            return industryType.charAt(0).toUpperCase() + industryType.slice(1);
                          })()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          // Try to extract emissions data
                          let totalEmissions = 0;
                          
                          // Check for emissions in the new format
                          if (scenarioData.emissions && scenarioData.emissions.total) {
                            totalEmissions = scenarioData.emissions.total;
                          } else if (scenarioData.emissionsData && scenarioData.emissionsData.totalEmissions) {
                            totalEmissions = scenarioData.emissionsData.totalEmissions;
                          }
                          
                          if (totalEmissions > 0) {
                            return (
                              <div className="text-sm text-gray-900">
                                {Math.round(totalEmissions).toLocaleString()} tCO2e
                              </div>
                            );
                          } else {
                            return (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                No emissions
                              </span>
                            );
                          }
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {(() => {
                            const employeeCount = scenarioData.employeeCount || 0;
                            return employeeCount > 0 ? employeeCount.toLocaleString() : 'N/A';
                          })()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {scenario.created_at ? new Date(scenario.created_at).toLocaleDateString() : 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={(e) => handleDuplicateScenario(scenario, e)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Duplicate scenario"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => handleDeleteScenario(scenario.id, e)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete scenario"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CarbonFootprintScenarioManager;