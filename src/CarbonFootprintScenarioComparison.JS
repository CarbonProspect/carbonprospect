import React, { useState, useCallback, useMemo } from 'react';

const CarbonFootprintScenarioComparison = ({ 
  scenarios, 
  onClose, 
  onLoadScenario, 
  onCreateFromScenario 
}) => {
  const [selectedScenarios, setSelectedScenarios] = useState([]);
  const [comparisonMode, setComparisonMode] = useState('summary'); // 'summary' or 'detailed'

  // Helper function to safely extract scenario data
  const extractScenarioData = useCallback((scenario) => {
    if (!scenario) return {};
    
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
    return scenario;
  }, []);

  // Helper function to extract emissions data
  const extractEmissions = useCallback((scenarioData) => {
    if (scenarioData.emissions && scenarioData.emissions.total) {
      return scenarioData.emissions;
    } else if (scenarioData.emissionsData) {
      if (scenarioData.emissionsData.emissions) {
        return scenarioData.emissionsData.emissions;
      } else if (scenarioData.emissionsData.totalEmissions) {
        return {
          scope1: scenarioData.emissionsData.scope1 || 0,
          scope2: scenarioData.emissionsData.scope2 || 0,
          scope3: scenarioData.emissionsData.scope3 || 0,
          total: scenarioData.emissionsData.totalEmissions
        };
      }
    }
    return { scope1: 0, scope2: 0, scope3: 0, total: 0 };
  }, []);

  // Handle scenario selection
  const handleScenarioSelection = useCallback((scenario) => {
    setSelectedScenarios(prev => {
      if (prev.find(s => s.id === scenario.id)) {
        return prev.filter(s => s.id !== scenario.id);
      } else if (prev.length < 3) {
        return [...prev, scenario];
      } else {
        return [prev[1], prev[2], scenario]; // Replace first with new one
      }
    });
  }, []);

  // Memoized comparison data
  const comparisonData = useMemo(() => {
    return selectedScenarios.map(scenario => {
      const data = extractScenarioData(scenario);
      const emissions = extractEmissions(data);
      
      return {
        id: scenario.id,
        name: scenario.name,
        data,
        emissions,
        createdAt: scenario.created_at,
        updatedAt: scenario.updated_at
      };
    });
  }, [selectedScenarios, extractScenarioData, extractEmissions]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-7xl w-full max-h-[95vh] overflow-auto shadow-xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-green-800 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Compare Carbon Footprint Scenarios
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

          {/* Mode Toggle */}
          <div className="mb-6 flex items-center space-x-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setComparisonMode('summary')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  comparisonMode === 'summary' 
                    ? 'bg-white text-green-700 shadow-sm' 
                    : 'text-gray-600 hover:text-green-600'
                }`}
              >
                Summary View
              </button>
              <button
                onClick={() => setComparisonMode('detailed')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  comparisonMode === 'detailed' 
                    ? 'bg-white text-green-700 shadow-sm' 
                    : 'text-gray-600 hover:text-green-600'
                }`}
              >
                Detailed View
              </button>
            </div>
            <div className="text-sm text-gray-600">
              Select up to 3 scenarios to compare ({selectedScenarios.length}/3)
            </div>
          </div>

          {/* Scenario Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Available Scenarios</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {scenarios.map(scenario => {
                const data = extractScenarioData(scenario);
                const emissions = extractEmissions(data);
                const isSelected = selectedScenarios.find(s => s.id === scenario.id);
                
                return (
                  <div
                    key={scenario.id}
                    onClick={() => handleScenarioSelection(scenario)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-green-500 bg-green-50 shadow-md' 
                        : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 truncate">{scenario.name}</h4>
                      {isSelected && (
                        <div className="bg-green-500 text-white rounded-full p-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      <div>Total Emissions: {Math.round(emissions.total).toLocaleString()} tCO2e</div>
                      <div>Created: {new Date(scenario.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Comparison Results */}
          {selectedScenarios.length > 0 && (
            <div className="border-t border-gray-200 pt-8">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Comparison Results</h3>
              
              {comparisonMode === 'summary' ? (
                <div className="grid grid-cols-1 gap-6">
                  {/* Summary Comparison Table */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Metric
                          </th>
                          {comparisonData.map(scenario => (
                            <th key={scenario.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {scenario.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            Total Emissions (tCO2e)
                          </td>
                          {comparisonData.map(scenario => (
                            <td key={scenario.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {Math.round(scenario.emissions.total).toLocaleString()}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            Scope 1 (tCO2e)
                          </td>
                          {comparisonData.map(scenario => (
                            <td key={scenario.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {Math.round(scenario.emissions.scope1).toLocaleString()}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            Scope 2 (tCO2e)
                          </td>
                          {comparisonData.map(scenario => (
                            <td key={scenario.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {Math.round(scenario.emissions.scope2).toLocaleString()}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            Scope 3 (tCO2e)
                          </td>
                          {comparisonData.map(scenario => (
                            <td key={scenario.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {Math.round(scenario.emissions.scope3).toLocaleString()}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            Employee Count
                          </td>
                          {comparisonData.map(scenario => (
                            <td key={scenario.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {scenario.data.employeeCount?.toLocaleString() || 'N/A'}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            Annual Revenue (USD)
                          </td>
                          {comparisonData.map(scenario => (
                            <td key={scenario.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {scenario.data.annualRevenue ? `$${(scenario.data.annualRevenue / 1000000).toFixed(1)}M` : 'N/A'}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            Reduction Target (%)
                          </td>
                          {comparisonData.map(scenario => (
                            <td key={scenario.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {scenario.data.reductionTarget || 0}%
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            Last Updated
                          </td>
                          {comparisonData.map(scenario => (
                            <td key={scenario.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(scenario.updatedAt).toLocaleDateString()}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {comparisonData.map(scenario => (
                    <div key={scenario.id} className="bg-gray-50 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-lg font-medium text-gray-900">{scenario.name}</h4>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => onLoadScenario(selectedScenarios.find(s => s.id === scenario.id))}
                            className="text-green-600 hover:text-green-800 text-sm"
                            title="Load this scenario"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
                            </svg>
                          </button>
                          <button
                            onClick={() => onCreateFromScenario(selectedScenarios.find(s => s.id === scenario.id))}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                            title="Create new scenario from this one"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-gray-500">Total Emissions</div>
                            <div className="text-lg font-semibold text-gray-900">
                              {Math.round(scenario.emissions.total).toLocaleString()} tCO2e
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Employees</div>
                            <div className="text-lg font-semibold text-gray-900">
                              {scenario.data.employeeCount?.toLocaleString() || 'N/A'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-gray-500">Scope 1</div>
                            <div className="font-medium">{Math.round(scenario.emissions.scope1).toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Scope 2</div>
                            <div className="font-medium">{Math.round(scenario.emissions.scope2).toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Scope 3</div>
                            <div className="font-medium">{Math.round(scenario.emissions.scope3).toLocaleString()}</div>
                          </div>
                        </div>
                        
                        <div className="border-t border-gray-200 pt-3">
                          <div className="text-sm text-gray-500">Industry: {scenario.data.industryType || 'N/A'}</div>
                          <div className="text-sm text-gray-500">Location: {scenario.data.location || 'N/A'}</div>
                          <div className="text-sm text-gray-500">
                            Reduction Target: {scenario.data.reductionTarget || 0}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarbonFootprintScenarioComparison;