import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
// ✅ CLEAN: This component ONLY uses carbon footprint scenario utilities
import { getScenarios, deleteScenario, duplicateScenario, updateScenario } from './utils/carbonFootprintScenarioUtils';
import ConfirmationDialog from './ConfirmationDialog';

/**
 * ✅ CLEAN: A component that displays scenarios ONLY for carbon footprint compliance projects
 * This is completely separate from any carbon project tools
 */
const CarbonFootprintScenarioPanel = ({ 
  footprintId, 
  currentScenarioId, 
  currentScenarioName,
  onLoadScenario, 
  onCreateNewScenario,
  refreshScenarios,
  onScenarioDeleted // NEW: Add callback for when scenario is deleted
}) => {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true); // Start with loading true when we have a footprintId
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [deleteScenarioId, setDeleteScenarioId] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  
  // Name editing states
  const [editingScenarioId, setEditingScenarioId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [savingName, setSavingName] = useState(false);

  // Use ref to track if component is mounted to prevent memory leaks
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // 🔧 CRITICAL FIX: Simplified extractScenarioData function to prevent infinite loops
  const extractScenarioData = useCallback((scenario) => {
    if (!scenario) return {};
    
    if (scenario.data) {
      if (typeof scenario.data === 'string') {
        try {
          return JSON.parse(scenario.data);
        } catch (e) {
          console.warn('Could not parse carbon footprint scenario data:', e);
          return {};
        }
      } else if (typeof scenario.data === 'object') {
        return scenario.data;
      }
    }
    
    // Fallback to scenario itself if no nested data
    return scenario;
  }, []);

  // 🔧 FIXED: Updated extractEmissionsData function to check root level first
  const extractEmissionsData = useCallback((scenario) => {
    const scenarioData = extractScenarioData(scenario);
    
    let totalEmissions = 0;
    let emissions = null;
    
    // FIXED: Check for emissions at the root level first (this is where it's actually stored)
    if (scenarioData.emissions && typeof scenarioData.emissions === 'object') {
      // Direct emissions object at root level
      if (scenarioData.emissions.total !== undefined) {
        totalEmissions = parseFloat(scenarioData.emissions.total) || 0;
        emissions = {
          scope1: parseFloat(scenarioData.emissions.scope1) || 0,
          scope2: parseFloat(scenarioData.emissions.scope2) || 0,
          scope3: parseFloat(scenarioData.emissions.scope3) || 0,
          total: totalEmissions
        };
      }
    }
    
    // If not found at root, check nested locations
    if (!emissions && scenarioData.emissionsData) {
      if (scenarioData.emissionsData.emissions && scenarioData.emissionsData.emissions.total) {
        totalEmissions = parseFloat(scenarioData.emissionsData.emissions.total) || 0;
        emissions = scenarioData.emissionsData.emissions;
      } else if (scenarioData.emissionsData.totalEmissions) {
        totalEmissions = parseFloat(scenarioData.emissionsData.totalEmissions) || 0;
        emissions = {
          scope1: parseFloat(scenarioData.emissionsData.scope1) || 0,
          scope2: parseFloat(scenarioData.emissionsData.scope2) || 0,
          scope3: parseFloat(scenarioData.emissionsData.scope3) || 0,
          total: totalEmissions
        };
      }
    }
    
    // Check if we have raw inputs or emission values (indicates data entry even if not calculated)
    const hasRawInputs = scenarioData.rawInputs && 
      typeof scenarioData.rawInputs === 'object' && 
      Object.keys(scenarioData.rawInputs).length > 0;
      
    const hasEmissionValues = scenarioData.emissionValues && 
      typeof scenarioData.emissionValues === 'object' && 
      Object.keys(scenarioData.emissionValues).length > 0;
    
    return {
      totalEmissions,
      emissions,
      hasEmissions: totalEmissions > 0,
      hasInputData: hasRawInputs || hasEmissionValues
    };
  }, [extractScenarioData]);

  // 🔧 CRITICAL FIX: Simplified sort function to prevent dependency loops
  const sortScenarios = useCallback((scenariosToSort, field, order) => {
    return [...scenariosToSort].sort((a, b) => {
      let valueA, valueB;
      
      if (field === 'totalEmissions') {
        valueA = a._processedEmissions ? a._processedEmissions.totalEmissions : 0;
        valueB = b._processedEmissions ? b._processedEmissions.totalEmissions : 0;
      } else if (field === 'created_at' || field === 'updated_at') {
        valueA = new Date(a[field] || 0).getTime();
        valueB = new Date(b[field] || 0).getTime();
      } else {
        valueA = a[field];
        valueB = b[field];
      }
      
      // Sort null/undefined values to the end
      if (valueA === null || valueA === undefined) return order === 'asc' ? 1 : -1;
      if (valueB === null || valueB === undefined) return order === 'asc' ? -1 : 1;
      
      // Perform comparison
      if (valueA < valueB) return order === 'asc' ? -1 : 1;
      if (valueA > valueB) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }, []);

  // 🔧 FIXED: Replace the fetchScenarios function - Remove the circular dependency issue
  const fetchScenarios = useCallback(async () => {
    if (!footprintId) {
      console.log("❌ No footprintId provided, cannot fetch carbon footprint scenarios");
      setScenarios([]);
      setLoading(false);
      return;
    }
    
    console.log("🔍 Fetching carbon footprint scenarios for footprint:", footprintId);
    setLoading(true);
    setError(null);
    
    try {
      const result = await getScenarios(footprintId);
      console.log("🔍 Raw result from getScenarios:", result);
      
      if (result.success) {
        console.log("✅ Carbon footprint scenarios loaded successfully:", result.data?.length || 0, "scenarios");
        console.log("📋 Scenarios data:", result.data);
        
        // 🔧 CRITICAL FIX: Ensure we always set an array, even if result.data is null/undefined
        const scenariosArray = Array.isArray(result.data) ? result.data : [];
        console.log("📋 Setting scenarios array:", scenariosArray);
        console.log("📋 Scenarios array length:", scenariosArray.length);
        
        // 🔧 FIXED: Always update state when data is received
        setScenarios(scenariosArray);
        setLoading(false);
        setError(null);
        
        // 🔧 DEBUG: Log state after setting
        console.log("✅ State updated - scenarios set to:", scenariosArray.length, "items");
      } else {
        console.error("❌ Failed to load carbon footprint scenarios:", result.error);
        setError(result.error || 'Failed to load carbon footprint scenarios');
        setScenarios([]);
        setLoading(false);
      }
    } catch (err) {
      console.error('❌ Error loading carbon footprint scenarios:', err);
      setError('An error occurred while loading carbon footprint scenarios: ' + err.message);
      setScenarios([]);
      setLoading(false);
    }
  }, [footprintId]); // 🔧 CRITICAL FIX: REMOVED getScenarios from dependencies to prevent circular reference

  // 🔧 FIXED: Updated main useEffect without isMounted check
  useEffect(() => {
    console.log("🔄 CarbonFootprintScenarioPanel useEffect triggered", {
      footprintId,
      refreshScenarios,
      hasFootprintId: !!footprintId
    });
    
    if (footprintId) {
      fetchScenarios();
    } else {
      // If no footprintId, ensure we're not loading
      setLoading(false);
      setScenarios([]);
      console.log("⚠️ No footprintId provided - clearing scenarios");
    }
  }, [footprintId, refreshScenarios, fetchScenarios]);

  // 🔧 FIXED: Updated refresh useEffect without isMounted check and with delay
  useEffect(() => {
    if (refreshScenarios > 0 && footprintId) {
      console.log("🔄 Force refresh triggered by parent component - refreshScenarios:", refreshScenarios);
      // Add a small delay to ensure the save is complete
      setTimeout(() => {
        fetchScenarios();
      }, 100);
    }
  }, [refreshScenarios, footprintId, fetchScenarios]);

  // 🔧 CRITICAL FIX: Process scenarios with emissions data
  const processedScenarios = useMemo(() => {
    console.log("🔄 Processing scenarios:", scenarios.length);
    return scenarios.map(scenario => {
      const emissionsInfo = extractEmissionsData(scenario);
      return {
        ...scenario,
        _processedEmissions: emissionsInfo
      };
    });
  }, [scenarios, extractEmissionsData]);

  // 🔧 CRITICAL FIX: Sort processed scenarios
  const sortedScenarios = useMemo(() => {
    const sorted = sortScenarios(processedScenarios, sortBy, sortOrder);
    console.log("📊 Sorted scenarios:", sorted.length);
    return sorted;
  }, [processedScenarios, sortBy, sortOrder, sortScenarios]);
  
  // Function to handle sorting
  const handleSort = useCallback((field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  }, [sortBy, sortOrder]);

  // NEW: Function to start editing a scenario name
  const startEditingName = useCallback((scenario, e) => {
    e.stopPropagation(); // Prevent triggering row click
    setEditingScenarioId(scenario.id);
    setEditingName(scenario.name || 'Unnamed Scenario');
  }, []);

  // NEW: Function to save edited scenario name
  const saveEditedName = useCallback(async () => {
    if (!editingName.trim()) {
      setError("Scenario name cannot be empty");
      return;
    }

    setSavingName(true);
    setError(null);

    try {
      console.log("✏️ Updating scenario name:", editingName);
      
      // Find the scenario being edited
      const scenario = scenarios.find(s => s.id === editingScenarioId);
      if (!scenario) {
        setError("Scenario not found");
        return;
      }
      
      // Extract scenario data for update
      let scenarioData = scenario.data || scenario;
      if (typeof scenarioData === 'string') {
        try {
          scenarioData = JSON.parse(scenarioData);
        } catch (e) {
          console.warn('Could not parse scenario data for update');
          scenarioData = {};
        }
      }

      // Update the name in the data
      const updatedData = {
        ...scenarioData,
        name: editingName.trim()
      };

      const result = await updateScenario(footprintId, editingScenarioId, updatedData);
      
      if (result.success) {
        console.log("✅ Scenario name updated successfully");
        
        // Update the local state immediately for better UX
        setScenarios(prevScenarios => 
          prevScenarios.map(s => 
            s.id === editingScenarioId 
              ? { ...s, name: editingName.trim() }
              : s
          )
        );
        
        setEditingScenarioId(null);
        setEditingName('');
        
        // Fetch fresh data after a short delay
        setTimeout(() => {
          fetchScenarios();
        }, 500);
      } else {
        setError(result.error || 'Failed to update scenario name');
        console.error("❌ Failed to update scenario name:", result.error);
      }
    } catch (err) {
      console.error('❌ Error updating scenario name:', err);
      setError('An unexpected error occurred while updating the scenario name');
    } finally {
      setSavingName(false);
    }
  }, [editingName, editingScenarioId, scenarios, footprintId, fetchScenarios]);

  // NEW: Function to cancel editing
  const cancelEditing = useCallback(() => {
    setEditingScenarioId(null);
    setEditingName('');
  }, []);

  // NEW: Handle key press for name editing
  const handleNameKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEditedName();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  }, [saveEditedName, cancelEditing]);

  // Initiate the carbon footprint scenario deletion confirmation
  const initiateDelete = useCallback((scenarioId) => {
    setDeleteScenarioId(scenarioId);
    setDeleteConfirmOpen(true);
  }, []);
  
  // Handle carbon footprint scenario deletion confirmation
  const confirmDeleteScenario = useCallback(async () => {
    if (!deleteScenarioId) return;
    
    try {
      setLoading(true);
      console.log("🗑️ Deleting carbon footprint scenario:", deleteScenarioId);
      const result = await deleteScenario(footprintId, deleteScenarioId);
      
      if (result.success) {
        console.log("✅ Carbon footprint scenario deleted successfully");
        setScenarios(scenarios.filter(s => s.id !== deleteScenarioId));
        
        // NEW: If we deleted the current scenario, notify parent
        if (deleteScenarioId === currentScenarioId && onScenarioDeleted) {
          onScenarioDeleted(deleteScenarioId);
        }
        
        setDeleteConfirmOpen(false);
        setDeleteScenarioId(null);
      } else {
        console.error("❌ Failed to delete carbon footprint scenario:", result.error);
        setError(result.error || 'Failed to delete carbon footprint scenario');
      }
    } catch (err) {
      console.error('❌ Error deleting carbon footprint scenario:', err);
      setError('An error occurred while deleting the carbon footprint scenario');
    } finally {
      setLoading(false);
    }
  }, [deleteScenarioId, footprintId, scenarios, currentScenarioId, onScenarioDeleted]);
  
  // Handle carbon footprint scenario duplication
  const handleDuplicateScenario = useCallback(async (scenario) => {
    try {
      setLoading(true);
      console.log("📋 Duplicating carbon footprint scenario:", scenario);
      
      const result = await duplicateScenario(footprintId, scenario);
      
      if (result.success) {
        console.log("✅ Carbon footprint scenario duplicated successfully:", result.data);
        
        // 🔧 NEW FIX: Immediately add the new scenario to the list
        setScenarios(prevScenarios => {
          const updatedScenarios = [...prevScenarios, result.data];
          console.log("📊 Updated scenarios list with duplicated scenario:", updatedScenarios.length);
          return updatedScenarios;
        });
        
        // Also fetch fresh data from server after a delay
        setTimeout(() => {
          fetchScenarios();
        }, 500);
        
        if (onCreateNewScenario) {
          onCreateNewScenario(result.data);
        }
      } else {
        console.error("❌ Failed to duplicate carbon footprint scenario:", result.error);
        setError(result.error || 'Failed to duplicate carbon footprint scenario');
      }
    } catch (err) {
      console.error('❌ Error duplicating carbon footprint scenario:', err);
      setError('An error occurred while duplicating the carbon footprint scenario');
    } finally {
      setLoading(false);
    }
  }, [footprintId, onCreateNewScenario, fetchScenarios]);

  // Handler for the "New Carbon Footprint Scenario" button
  const handleCreateNewScenarioClick = useCallback(() => {
    console.log("💡 Create new carbon footprint scenario button clicked");
    if (typeof onCreateNewScenario === 'function') {
      onCreateNewScenario();
    } else {
      console.error("❌ onCreateNewScenario is not a function");
      setError("Cannot create new carbon footprint scenario: functionality not available");
    }
  }, [onCreateNewScenario]);

  // Render sort indicator
  const renderSortIndicator = useCallback((field) => {
    if (sortBy === field) {
      return sortOrder === 'asc' ? ' ↑' : ' ↓';
    }
    return '';
  }, [sortBy, sortOrder]);

  // 🔧 CRITICAL FIX: Simplified status indicator
  const getStatusIndicator = useCallback((scenario) => {
    const emissionsInfo = scenario._processedEmissions;
    
    if (!emissionsInfo) return 'bg-gray-300';
    if (!emissionsInfo.hasEmissions && !emissionsInfo.hasInputData) return 'bg-gray-300';
    if (!emissionsInfo.hasEmissions && emissionsInfo.hasInputData) return 'bg-orange-400';
    if (emissionsInfo.totalEmissions > 0) return 'bg-green-500';
    return 'bg-gray-400';
  }, []);

  // 🔧 DEBUG: Add console logs to track component state
  console.log("🔍 CarbonFootprintScenarioPanel render:", {
    footprintId,
    loading,
    error,
    scenariosCount: scenarios.length,
    sortedScenariosCount: sortedScenarios.length,
    refreshScenarios,
    isMounted: isMountedRef.current,
    rawScenarios: scenarios, // Added to see raw data
    processedScenarios: processedScenarios.length,
    hasScenarios: scenarios.length > 0
  });
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Delete Carbon Footprint Scenario Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDeleteScenario}
        title="Delete Carbon Footprint Scenario"
        message="Are you sure you want to delete this carbon footprint scenario? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={loading}
      />
      
      <div className="bg-green-50 p-4 border-b border-green-100 flex justify-between items-center">
        <h3 className="text-lg font-medium text-green-800">
          <span className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Carbon Footprint Scenarios ({sortedScenarios.length})
          </span>
        </h3>
        <div className="flex space-x-2">
          <select 
            className="text-sm border border-green-300 rounded px-2 py-1 bg-white"
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
            <option value="totalEmissions-desc">Highest Emissions</option>
          </select>
          <button
            onClick={handleCreateNewScenarioClick}
            className="bg-green-600 hover:bg-green-700 text-white text-sm py-1 px-3 rounded flex items-center transition-colors"
            disabled={loading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Carbon Footprint Scenario
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="p-6 text-center">
          <div className="flex justify-center items-center">
            <svg className="animate-spin h-6 w-6 text-green-600 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-green-700">Loading carbon footprint scenarios...</span>
          </div>
        </div>
      ) : error ? (
        <div className="p-6 text-center bg-red-50 text-red-600">
          <div className="flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mb-2">{error}</p>
            <button 
              onClick={() => {
                setError(null);
                fetchScenarios(); // Retry fetching scenarios
              }}
              className="text-sm underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        </div>
      ) : sortedScenarios.length === 0 ? (
        <div className="p-6 text-center bg-gray-50">
          <div className="flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            <p className="text-gray-500 mb-2">No carbon footprint scenarios yet.</p>
            <p className="text-sm text-gray-400 mb-4">Create your first scenario to start managing your carbon footprint data.</p>
            <button
              onClick={handleCreateNewScenarioClick}
              className="bg-green-600 hover:bg-green-700 text-white text-sm py-2 px-4 rounded flex items-center transition-colors"
              disabled={loading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Carbon Footprint Scenario
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
                    className="hover:text-green-700"
                  >
                    Name{renderSortIndicator('name')}
                  </button>
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button 
                    onClick={() => handleSort('totalEmissions')}
                    className="hover:text-green-700"
                  >
                    Total Emissions{renderSortIndicator('totalEmissions')}
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
              {sortedScenarios.map((scenario) => {
                const emissionsInfo = scenario._processedEmissions || { 
                  totalEmissions: 0, 
                  hasEmissions: false, 
                  hasInputData: false 
                };
                const isEditing = editingScenarioId === scenario.id;
                
                return (
                  <tr 
                    key={scenario.id} 
                    className={`${currentScenarioId === scenario.id ? 'bg-green-50 border-l-4 border-green-500' : 'hover:bg-gray-50'} cursor-pointer`}
                    onClick={() => !isEditing && currentScenarioId !== scenario.id ? onLoadScenario(scenario) : null}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`h-3 w-3 rounded-full mr-2 ${getStatusIndicator(scenario)}`}></div>
                        {isEditing ? (
                          <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={handleNameKeyPress}
                              className="text-sm font-medium text-gray-900 border border-gray-300 rounded px-2 py-1 flex-grow focus:outline-none focus:ring-2 focus:ring-green-500"
                              autoFocus
                              disabled={savingName}
                            />
                            <button
                              onClick={saveEditedName}
                              disabled={savingName}
                              className={`${savingName ? 'text-gray-400' : 'text-green-600 hover:text-green-800'} transition-colors`}
                              title="Save name"
                            >
                              {savingName ? (
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                            <button
                              onClick={cancelEditing}
                              disabled={savingName}
                              className="text-gray-600 hover:text-gray-800 transition-colors"
                              title="Cancel editing"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center group">
                            <span className={`font-medium ${currentScenarioId === scenario.id ? 'text-green-700' : 'text-gray-900'}`}>
                              {scenario.name || 'Unnamed Scenario'}
                            </span>
                            <button
                              onClick={(e) => startEditingName(scenario, e)}
                              className="ml-2 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Edit name"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            {currentScenarioId === scenario.id && (
                              <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Current
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      {emissionsInfo.hasEmissions ? (
                        <span className="font-medium text-gray-900">
                          {Math.round(emissionsInfo.totalEmissions).toLocaleString()} tCO2e
                        </span>
                      ) : emissionsInfo.hasInputData ? (
                        <span className="text-orange-600 text-sm">Needs Calculation</span>
                      ) : (
                        <span className="text-gray-400">No Data</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-500">
                      {scenario.updated_at ? new Date(scenario.updated_at).toLocaleDateString() : 'Unknown'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                      <div className="flex justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                        {currentScenarioId !== scenario.id && (
                          <button
                            onClick={() => onLoadScenario(scenario)}
                            title="Load Carbon Footprint Scenario"
                            className="text-green-600 hover:text-green-800 p-1"
                            disabled={loading}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => handleDuplicateScenario(scenario)}
                          title="Duplicate Carbon Footprint Scenario"
                          className="text-blue-600 hover:text-blue-800 p-1"
                          disabled={loading}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => initiateDelete(scenario.id)}
                          title="Delete Carbon Footprint Scenario"
                          className="text-red-600 hover:text-red-800 p-1"
                          disabled={loading}
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
  );
};

export default CarbonFootprintScenarioPanel;