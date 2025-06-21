import React, { useState, useEffect } from 'react';
// 🔧 CLEANED: Only import assessment project scenario API
import { getScenarios, deleteScenario, duplicateScenario } from './utils/scenarioAPI';
import { formatCurrency } from './utils/formatters';
import LoadingIndicator from './LoadingIndicator';
import ConfirmationDialog from './ConfirmationDialog';

/**
 * 🔧 CLEANED: A component that displays a summary of all scenarios for ASSESSMENT PROJECTS ONLY
 * This should NOT be used for carbon footprints - use CarbonFootprintScenarioPanel instead
 */
const ScenarioSummaryPanel = ({ 
  projectId, 
  currentScenarioId, 
  currentScenarioName,
  onLoadScenario, 
  onCreateNewScenario,
  refreshScenarios
}) => {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [deleteScenarioId, setDeleteScenarioId] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Load scenarios when component mounts or when refreshScenarios changes
  useEffect(() => {
    const fetchScenarios = async () => {
      if (!projectId) {
        console.log("No projectId provided, skipping ASSESSMENT PROJECT scenario fetch");
        return;
      }
      
      console.log("🔍 Fetching scenarios for ASSESSMENT PROJECT:", projectId);
      setLoading(true);
      setError(null);
      
      try {
        const result = await getScenarios(projectId);
        
        if (result.success && result.data) {
          console.log("✅ ASSESSMENT PROJECT scenarios loaded successfully:", result.data);
          // Sort scenarios by the current sort criteria
          const sortedScenarios = sortScenarios(result.data, sortBy, sortOrder);
          setScenarios(sortedScenarios);
        } else {
          console.error("❌ Failed to load ASSESSMENT PROJECT scenarios:", result.error);
          setError(result.error || 'Failed to load scenarios');
        }
      } catch (err) {
        console.error('❌ Error loading ASSESSMENT PROJECT scenarios:', err);
        setError('An error occurred while loading scenarios');
      } finally {
        setLoading(false);
      }
    };
    
    fetchScenarios();
  }, [projectId, refreshScenarios, sortBy, sortOrder]);
  
  // Function to handle sorting
  const handleSort = (field) => {
    if (sortBy === field) {
      // Toggle order if same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to descending
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Sort scenarios by the specified field and order
  const sortScenarios = (scenariosToSort, field, order) => {
    return [...scenariosToSort].sort((a, b) => {
      let valueA, valueB;
      
      // Handle nested properties for assessment project data
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        valueA = a.data && a.data[parent] ? a.data[parent][child] : 0;
        valueB = b.data && b.data[parent] ? b.data[parent][child] : 0;
      } else {
        valueA = a[field];
        valueB = b[field];
      }
      
      // Handle dates
      if (field === 'created_at' || field === 'updated_at') {
        valueA = new Date(valueA || 0).getTime();
        valueB = new Date(valueB || 0).getTime();
      }
      
      // Sort null/undefined values to the end
      if (valueA === null || valueA === undefined) return order === 'asc' ? 1 : -1;
      if (valueB === null || valueB === undefined) return order === 'asc' ? -1 : 1;
      
      // Perform comparison
      if (valueA < valueB) return order === 'asc' ? -1 : 1;
      if (valueA > valueB) return order === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Initiate the scenario deletion confirmation
  const initiateDelete = (scenarioId) => {
    setDeleteScenarioId(scenarioId);
    setDeleteConfirmOpen(true);
  };
  
  // Handle scenario deletion confirmation
  const confirmDeleteScenario = async () => {
    if (!deleteScenarioId) return;
    
    try {
      setLoading(true);
      console.log("🗑️ Deleting ASSESSMENT PROJECT scenario:", deleteScenarioId);
      const result = await deleteScenario(projectId, deleteScenarioId);
      
      if (result.success) {
        console.log("✅ ASSESSMENT PROJECT scenario deleted successfully");
        // Update local state to remove the deleted scenario
        setScenarios(scenarios.filter(s => s.id !== deleteScenarioId));
        setDeleteConfirmOpen(false);
        setDeleteScenarioId(null);
      } else {
        console.error("❌ Failed to delete ASSESSMENT PROJECT scenario:", result.error);
        setError(result.error || 'Failed to delete scenario');
      }
    } catch (err) {
      console.error('❌ Error deleting ASSESSMENT PROJECT scenario:', err);
      setError('An error occurred while deleting the scenario');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle scenario duplication
  const handleDuplicateScenario = async (scenario) => {
    try {
      setLoading(true);
      console.log("📋 Duplicating ASSESSMENT PROJECT scenario:", scenario);
      
      // Use the API function to duplicate the scenario
      const result = await duplicateScenario(projectId, scenario);
      
      if (result.success) {
        console.log("✅ ASSESSMENT PROJECT scenario duplicated successfully:", result.data);
        // Add the new scenario to the list
        setScenarios([...scenarios, result.data]);
        
        // Notify parent of the change
        if (onCreateNewScenario) {
          onCreateNewScenario(result.data);
        }
      } else {
        console.error("❌ Failed to duplicate ASSESSMENT PROJECT scenario:", result.error);
        setError(result.error || 'Failed to duplicate scenario');
      }
    } catch (err) {
      console.error('❌ Error duplicating ASSESSMENT PROJECT scenario:', err);
      setError('An error occurred while duplicating the scenario');
    } finally {
      setLoading(false);
    }
  };

  // Handler for the "New Scenario" button
  const handleCreateNewScenarioClick = () => {
    console.log("💡 Create new ASSESSMENT PROJECT scenario button clicked");
    if (typeof onCreateNewScenario === 'function') {
      onCreateNewScenario();
    } else {
      console.error("❌ onCreateNewScenario is not a function");
      setError("Cannot create new scenario: functionality not available");
    }
  };

  // Render sort indicator
  const renderSortIndicator = (field) => {
    if (sortBy === field) {
      return sortOrder === 'asc' ? ' ↑' : ' ↓';
    }
    return '';
  };

  // Get status indicator class based on assessment project results
  const getStatusIndicator = (scenario) => {
    if (!scenario.results) return 'bg-gray-300'; // No results data
    
    let results;
    try {
      results = typeof scenario.results === 'string' ? JSON.parse(scenario.results) : scenario.results;
    } catch (e) {
      return 'bg-gray-300';
    }
    
    const totalSequestration = results.totalSequestration || 0;
    
    if (totalSequestration > 1000000) return 'bg-green-500'; // High sequestration
    if (totalSequestration > 100000) return 'bg-yellow-500'; // Medium sequestration
    if (totalSequestration > 0) return 'bg-blue-500'; // Some sequestration
    return 'bg-gray-400'; // No results
  };
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDeleteScenario}
        title="Delete Assessment Project Scenario"
        message="Are you sure you want to delete this scenario? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={loading}
      />
      
      <div className="bg-blue-50 p-4 border-b border-blue-100 flex justify-between items-center">
        <h3 className="text-lg font-medium text-blue-800">Assessment Project Scenarios</h3>
        <div className="flex space-x-2">
          <select 
            className="text-sm border border-blue-300 rounded px-2 py-1 bg-white"
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}
          >
            <option value="updated_at-desc">Recently Updated</option>
            <option value="created_at-desc">Recently Created</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="data.totalSequestration-desc">Highest Sequestration</option>
          </select>
          <button
            onClick={handleCreateNewScenarioClick}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm py-1 px-3 rounded flex items-center transition-colors"
            disabled={loading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Assessment Scenario
          </button>
        </div>
      </div>
      
      {loading && scenarios.length === 0 ? (
        <LoadingIndicator size="medium" color="blue" text="Loading assessment scenarios..." />
      ) : error ? (
        <div className="p-6 text-center bg-red-50 text-red-600">
          <p>{error}</p>
          <button 
            onClick={() => setError(null)}
            className="mt-2 text-sm underline"
          >
            Dismiss
          </button>
        </div>
      ) : scenarios.length === 0 ? (
        <div className="p-6 text-center bg-gray-50">
          <div className="flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            <p className="text-gray-500">No assessment scenarios yet. Create your first scenario!</p>
            <button
              onClick={handleCreateNewScenarioClick}
              className="mt-3 bg-blue-600 hover:bg-blue-700 text-white text-sm py-1 px-3 rounded flex items-center transition-colors"
              disabled={loading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Assessment Scenario
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button 
                    onClick={() => handleSort('name')}
                    className="hover:text-blue-700"
                  >
                    Name{renderSortIndicator('name')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project Type
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button 
                    onClick={() => handleSort('results.totalSequestration')}
                    className="hover:text-blue-700"
                  >
                    Sequestration{renderSortIndicator('results.totalSequestration')}
                  </button>
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {scenarios.map((scenario) => (
                <tr 
                  key={scenario.id} 
                  className={`${currentScenarioId === scenario.id ? 'bg-blue-50' : 'hover:bg-gray-50'} cursor-pointer`}
                  onClick={() => currentScenarioId !== scenario.id ? onLoadScenario(scenario) : null}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`h-3 w-3 rounded-full mr-2 ${getStatusIndicator(scenario)}`}></div>
                      <span className={`font-medium ${currentScenarioId === scenario.id ? 'text-blue-700' : 'text-gray-900'}`}>
                        {scenario.name}
                      </span>
                      {currentScenarioId === scenario.id && (
                        <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          Current
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-sm text-gray-500">
                      {scenario.project_type || scenario.projectType || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    {(() => {
                      let results;
                      try {
                        results = typeof scenario.results === 'string' 
                          ? JSON.parse(scenario.results) 
                          : scenario.results;
                      } catch (e) {
                        return <span className="text-gray-400">N/A</span>;
                      }
                      
                      if (results && results.totalSequestration) {
                        return (
                          <span className="font-medium">
                            {Math.round(results.totalSequestration).toLocaleString()} tCO2e
                          </span>
                        );
                      } else {
                        return <span className="text-gray-400">N/A</span>;
                      }
                    })()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-500">
                    {new Date(scenario.updated_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                    <div className="flex justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                      {currentScenarioId !== scenario.id && (
                        <button
                          onClick={() => onLoadScenario(scenario)}
                          title="Load Scenario"
                          className="text-blue-600 hover:text-blue-800"
                          disabled={loading}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => handleDuplicateScenario(scenario)}
                        title="Duplicate Scenario"
                        className="text-green-600 hover:text-green-800"
                        disabled={loading}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => initiateDelete(scenario.id)}
                        title="Delete Scenario"
                        className="text-red-600 hover:text-red-800"
                        disabled={loading}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ScenarioSummaryPanel;