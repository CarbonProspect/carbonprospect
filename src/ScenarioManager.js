import React, { useState, useEffect, useCallback } from 'react';
// 🔧 CLEANED: Only import assessment project scenario API
import { saveScenario, getScenarios, deleteScenario, duplicateScenario } from './utils/scenarioAPI';

/**
 * 🔧 CLEANED: ScenarioManager for ASSESSMENT PROJECTS ONLY
 * This component should NOT be used for carbon footprints
 */
const ScenarioManager = ({ projectId, scenarioName, setScenarioName, currentData, onLoadScenario, onClose, onCreateNew }) => {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newScenarioName, setNewScenarioName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState(null);

  // Function to fetch scenarios - wrapped in useCallback to prevent unnecessary rerenders
  const fetchScenarios = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("🔍 Fetching ASSESSMENT PROJECT scenarios for project:", projectId);
      const result = await getScenarios(projectId);
      
      if (result.success) {
        setScenarios(result.data || []);
        console.log("✅ ASSESSMENT PROJECT scenarios fetched successfully:", result.data);
      } else {
        setError(result.error || 'Failed to fetch scenarios');
        console.error("❌ Failed to fetch ASSESSMENT PROJECT scenarios:", result.error);
        setScenarios([]);
      }
    } catch (err) {
      console.error('❌ Error in ASSESSMENT PROJECT scenario manager:', err);
      setError('An unexpected error occurred while fetching scenarios');
      setScenarios([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Fetch scenarios when component mounts
  useEffect(() => {
    if (projectId) {
      console.log("🚀 ASSESSMENT PROJECT scenario manager initialized for project:", projectId);
      fetchScenarios();
    }
  }, [projectId, fetchScenarios]);

  // Set initial new scenario name from prop
  useEffect(() => {
    setNewScenarioName(scenarioName || 'New Assessment Scenario');
  }, [scenarioName]);

  // Function to save current scenario
  const handleSaveCurrentScenario = async () => {
    console.log("💾 Saving ASSESSMENT PROJECT scenario with name:", newScenarioName);
    
    if (!currentData) {
      console.error("❌ Cannot save ASSESSMENT PROJECT scenario: No current data available");
      setError("Cannot save scenario: No data available");
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      // Prepare scenario data for ASSESSMENT PROJECTS
      const scenarioData = {
        name: newScenarioName || scenarioName || 'New Assessment Scenario',
        projectType: currentData.projectType || 'forestry', // Default to forestry if not specified
        data: currentData,
        results: currentData.results || {} // Ensure results exists even if empty
      };

      console.log("💾 Saving ASSESSMENT PROJECT scenario data:", scenarioData);
      
      const result = await saveScenario(projectId, scenarioData);
      
      if (result.success) {
        // Update scenario name in parent component
        setScenarioName(newScenarioName);
        
        // Refresh scenarios list
        await fetchScenarios();
        
        // Show success message
        alert('Assessment project scenario saved successfully!');
        
        // Reset new scenario name
        setIsCreating(false);
      } else {
        setError(result.error || 'Failed to save ASSESSMENT PROJECT scenario');
        console.error("❌ Failed to save ASSESSMENT PROJECT scenario:", result.error);
      }
    } catch (err) {
      console.error('❌ Error saving ASSESSMENT PROJECT scenario:', err);
      setError('An unexpected error occurred while saving the ASSESSMENT PROJECT scenario');
    } finally {
      setLoading(false);
    }
  };

  // Function to create a brand new scenario
  const handleCreateNewScenario = () => {
    console.log("💡 Creating new ASSESSMENT PROJECT scenario - delegating to parent");
    // If parent provided a create function, use it
    if (typeof onCreateNew === 'function') {
      onCreateNew();
      onClose(); // Close the manager after creating
    } else {
      console.error("❌ No onCreateNew function provided to ASSESSMENT PROJECT ScenarioManager");
      // Fallback to just showing the scenario name input
      setIsCreating(true);
      setNewScenarioName(`New Assessment Scenario (${new Date().toLocaleDateString()})`);
    }
  };

  // Function to load a scenario
  const handleLoadScenario = (scenario) => {
    console.log("📁 Loading ASSESSMENT PROJECT scenario:", scenario);
    setSelectedScenario(scenario);
    
    // Extract data to load (handle both data and directly stored parameters)
    let scenarioData;
    
    if (scenario.data) {
      // If the data is stored in a data field (either as string or object)
      try {
        scenarioData = typeof scenario.data === 'string' ? JSON.parse(scenario.data) : scenario.data;
      } catch (err) {
        console.error('❌ Error parsing ASSESSMENT PROJECT scenario data:', err);
        scenarioData = scenario;
      }
    } else {
      // If data is stored directly on the scenario object
      scenarioData = scenario;
    }
    
    // Extract results
    let scenarioResults;
    if (scenario.results) {
      try {
        scenarioResults = typeof scenario.results === 'string' ? JSON.parse(scenario.results) : scenario.results;
      } catch (err) {
        console.error('❌ Error parsing ASSESSMENT PROJECT scenario results:', err);
        scenarioResults = null;
      }
    }
    
    // Combine data with parsed results for loading
    const loadData = {
      ...scenarioData,
      results: scenarioResults
    };
    
    console.log("📁 Loading ASSESSMENT PROJECT scenario data:", loadData);
    
    // Call the parent handler
    onLoadScenario(loadData);
    onClose();
  };

  // Function to delete a scenario
  const handleDeleteScenario = async (scenarioId, e) => {
    e.stopPropagation(); // Prevent triggering the row click
    
    if (!window.confirm('Are you sure you want to delete this ASSESSMENT PROJECT scenario? This action cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      console.log("🗑️ Deleting ASSESSMENT PROJECT scenario:", scenarioId);
      const result = await deleteScenario(projectId, scenarioId);
      
      if (result.success) {
        console.log("✅ ASSESSMENT PROJECT scenario deleted successfully");
        // Refresh scenarios list
        await fetchScenarios();
      } else {
        setError(result.error || 'Failed to delete ASSESSMENT PROJECT scenario');
        console.error("❌ Failed to delete ASSESSMENT PROJECT scenario:", result.error);
      }
    } catch (err) {
      console.error('❌ Error deleting ASSESSMENT PROJECT scenario:', err);
      setError('An unexpected error occurred while deleting the ASSESSMENT PROJECT scenario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="scenario-manager bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Manage Assessment Project Scenarios</h2>
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
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-medium text-blue-700 mb-2">Create New Assessment Project Scenario</h3>
        
        {isCreating ? (
          <div className="flex items-center">
            <input
              type="text"
              value={newScenarioName}
              onChange={(e) => setNewScenarioName(e.target.value)}
              className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter assessment scenario name"
            />
            <button
              onClick={handleSaveCurrentScenario}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
              Save the current assessment project configuration as a new scenario
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setIsCreating(true)}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Save Current
              </button>
              <button
                onClick={handleCreateNewScenario}
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Create New
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Existing Scenarios List */}
      <div>
        <h3 className="font-medium text-gray-700 mb-3">Saved Assessment Project Scenarios</h3>
        
        {loading && (
          <div className="flex justify-center my-4">
            <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
        
        {!loading && scenarios.length === 0 ? (
          <p className="text-gray-500 text-center py-4 border border-dashed border-gray-300 rounded-md">
            No assessment project scenarios saved yet
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
                    Project Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Results
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
                {scenarios.map((scenario) => (
                  <tr 
                    key={scenario.id} 
                    onClick={() => handleLoadScenario(scenario)}
                    className={`hover:bg-gray-50 cursor-pointer ${selectedScenario?.id === scenario.id ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{scenario.name || 'Unnamed Assessment Scenario'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{scenario.project_type || scenario.projectType || 'Unknown'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        // Try to extract results data for ASSESSMENT PROJECTS
                        let results;
                        if (scenario.results) {
                          try {
                            results = typeof scenario.results === 'string' 
                              ? JSON.parse(scenario.results) 
                              : scenario.results;
                          } catch (err) {
                            console.error('Error parsing assessment project results:', err);
                          }
                        }
                        
                        if (results?.totalSequestration) {
                          return (
                            <div className="text-sm text-gray-900">
                              {Math.round(results.totalSequestration).toLocaleString()} tCO2e
                            </div>
                          );
                        } else {
                          return (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              No results
                            </span>
                          );
                        }
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {scenario.created_at ? new Date(scenario.created_at).toLocaleDateString() : 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={(e) => handleDeleteScenario(scenario.id, e)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScenarioManager;