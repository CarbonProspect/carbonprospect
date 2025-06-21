import React, { useState, useEffect } from 'react';
import emissionsService from '../services/emissionsService';

const ReductionStrategiesInput = ({ industry, emissions, reductionTarget, onStrategiesChange, initialStrategies = [] }) => {
  const [availableStrategies, setAvailableStrategies] = useState([]);
  const [selectedStrategies, setSelectedStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reductionApproach, setReductionApproach] = useState({
    directReductionPercentage: 70,
    offsettingPercentage: 30
  });
  const [scenarios, setScenarios] = useState([]);
  const [currentScenario, setCurrentScenario] = useState({
    id: 'default',
    name: 'Default Scenario',
    strategies: [],
    directReductionPercentage: 70,
    offsettingPercentage: 30
  });

  // Fetch available reduction strategies for the selected industry
  useEffect(() => {
    const fetchStrategies = async () => {
      try {
        setLoading(true);
        const strategies = await emissionsService.getReductionStrategies(industry);
        setAvailableStrategies(strategies);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching reduction strategies:', error);
        setLoading(false);
      }
    };

    fetchStrategies();
  }, [industry]);

  // Initialize with any pre-existing strategies
  useEffect(() => {
    if (initialStrategies && initialStrategies.length > 0) {
      setSelectedStrategies(initialStrategies);
    }
  }, [initialStrategies]);

  // Notify parent component when strategies change
  useEffect(() => {
    if (onStrategiesChange) {
      onStrategiesChange(selectedStrategies);
    }
  }, [selectedStrategies, onStrategiesChange]);

  // Toggle strategy selection
  const toggleStrategy = (strategy) => {
    setSelectedStrategies(prev => {
      const isSelected = prev.some(s => s.id === strategy.id);
      
      if (isSelected) {
        return prev.filter(s => s.id !== strategy.id);
      } else {
        return [...prev, strategy];
      }
    });
  };

  // Handle reduction approach change
  const handleReductionApproachChange = (field, value) => {
    setReductionApproach(prev => {
      const updatedValue = parseFloat(value) || 0;
      
      if (field === 'directReductionPercentage') {
        return {
          directReductionPercentage: updatedValue,
          offsettingPercentage: 100 - updatedValue
        };
      } else {
        return {
          directReductionPercentage: 100 - updatedValue,
          offsettingPercentage: updatedValue
        };
      }
    });
  };

  // Calculate total potential reduction from selected strategies
  const calculateTotalPotentialReduction = () => {
    return selectedStrategies.reduce((total, strategy) => total + strategy.potentialReduction, 0);
  };

  // Calculate if the target can be met
  const calculateTargetStatus = () => {
    const targetReduction = emissions.total * (reductionTarget / 100);
    const potentialReduction = calculateTotalPotentialReduction();
    const offsetReduction = (emissions.total * reductionApproach.offsettingPercentage / 100) * (reductionTarget / 100);
    const totalReduction = potentialReduction + offsetReduction;
    
    return {
      targetReduction,
      potentialReduction,
      offsetReduction,
      totalReduction,
      canMeetTarget: totalReduction >= targetReduction
    };
  };

  const targetStatus = calculateTargetStatus();

  // Save current setup as a scenario
  const saveAsScenario = (scenarioName) => {
    const newScenario = {
      id: `scenario-${Date.now()}`,
      name: scenarioName,
      strategies: [...selectedStrategies],
      directReductionPercentage: reductionApproach.directReductionPercentage,
      offsettingPercentage: reductionApproach.offsettingPercentage
    };
    
    setScenarios([...scenarios, newScenario]);
    setCurrentScenario(newScenario);
  };

  // Mock default reduction strategies (in a real app, these would come from the API)
  useEffect(() => {
    if (availableStrategies.length === 0 && !loading) {
      // Provide fallback strategies if API call failed or returned empty
      const mockStrategies = [
        {
          id: 'renewable-energy',
          strategy: 'Renewable Energy Installation',
          description: 'Install solar panels, wind turbines, or other renewable energy sources',
          potentialReduction: emissions.scope2 * 0.8, // 80% of scope 2
          timeframe: '1-3 years',
          difficulty: 'Medium',
          capex: 100000,
          opexSavings: 30000
        },
        {
          id: 'efficient-equipment',
          strategy: 'Energy-Efficient Equipment',
          description: 'Replace old equipment with energy-efficient alternatives',
          potentialReduction: emissions.scope1 * 0.3, // 30% of scope 1
          timeframe: '1-2 years',
          difficulty: 'Low',
          capex: 50000,
          opexSavings: 25000
        },
        {
          id: 'supply-chain',
          strategy: 'Supply Chain Optimization',
          description: 'Work with suppliers to reduce emissions in your value chain',
          potentialReduction: emissions.scope3 * 0.2, // 20% of scope 3
          timeframe: '2-4 years',
          difficulty: 'High',
          capex: 30000,
          opexSavings: 15000
        },
        {
          id: 'process-improvements',
          strategy: 'Manufacturing Process Improvements',
          description: 'Optimize manufacturing processes to reduce energy and material use',
          potentialReduction: emissions.scope1 * 0.4, // 40% of scope 1
          timeframe: '1-3 years',
          difficulty: 'Medium',
          capex: 80000,
          opexSavings: 35000
        },
        {
          id: 'logistics-optimization',
          strategy: 'Logistics & Transportation Optimization',
          description: 'Optimize routes, switch to electric vehicles, or use alternative fuels',
          potentialReduction: emissions.scope3 * 0.3, // 30% of scope 3 (transportation portion)
          timeframe: '1-4 years',
          difficulty: 'Medium',
          capex: 70000,
          opexSavings: 40000
        }
      ];
      
      setAvailableStrategies(mockStrategies);
    }
  }, [availableStrategies, loading, emissions]);

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Emission Reduction Approach</h3>
      
      {/* Interactive Scenario Comparison Feature */}
      <div className="bg-white p-4 rounded border mb-6">
        <h3 className="font-medium mb-3">Scenario Management</h3>
        <div className="flex items-center mb-4">
          <select 
            className="mr-2 p-2 border rounded"
            value={currentScenario.id}
            onChange={(e) => {
              const selected = scenarios.find(s => s.id === e.target.value);
              if (selected) {
                setCurrentScenario(selected);
                setSelectedStrategies(selected.strategies);
                setReductionApproach({
                  directReductionPercentage: selected.directReductionPercentage,
                  offsettingPercentage: selected.offsettingPercentage
                });
              }
            }}
          >
            {scenarios.map(scenario => (
              <option key={scenario.id} value={scenario.id}>{scenario.name}</option>
            ))}
          </select>
          <button 
            className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600"
            onClick={() => {
              const name = prompt("Enter scenario name:");
              if (name) saveAsScenario(name);
            }}
          >
            Save Current as Scenario
          </button>
        </div>
        
        {scenarios.length > 1 && (
          <div className="mb-4">
            <h4 className="font-medium mb-2">Scenario Comparison</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full border">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-2 px-3 border">Scenario</th>
                    <th className="py-2 px-3 border">Direct Reduction</th>
                    <th className="py-2 px-3 border">Offsetting</th>
                    <th className="py-2 px-3 border">Total Reduction</th>
                    <th className="py-2 px-3 border">Implementation Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {scenarios.map(scenario => {
                    const totalReduction = scenario.strategies.reduce((sum, s) => sum + s.potentialReduction, 0);
                    const offsetAmount = (emissions.total * scenario.offsettingPercentage / 100) * (reductionTarget / 100);
                    const implementation = scenario.strategies.reduce((sum, s) => sum + s.capex, 0);
                    
                    return (
                      <tr key={scenario.id} className={scenario.id === currentScenario.id ? 'bg-blue-50' : ''}>
                        <td className="py-2 px-3 border font-medium">{scenario.name}</td>
                        <td className="py-2 px-3 border">{totalReduction.toFixed(2)} tonnes</td>
                        <td className="py-2 px-3 border">{offsetAmount.toFixed(2)} tonnes</td>
                        <td className="py-2 px-3 border">{(totalReduction + offsetAmount).toFixed(2)} tonnes</td>
                        <td className="py-2 px-3 border">${implementation.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h4 className="font-medium mb-2">Reduction Approach</h4>
          <div className="p-4 bg-gray-50 rounded">
            <div className="mb-3">
              <label className="block text-sm mb-1">Direct Emissions Reduction</label>
              <div className="flex items-center">
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={reductionApproach.directReductionPercentage}
                  onChange={(e) => handleReductionApproachChange('directReductionPercentage', e.target.value)}
                  className="w-full mr-2"
                />
                <span className="text-sm w-10">{reductionApproach.directReductionPercentage}%</span>
              </div>
            </div>
            
            <div className="mb-3">
              <label className="block text-sm mb-1">Carbon Offsetting</label>
              <div className="flex items-center">
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={reductionApproach.offsettingPercentage}
                  onChange={(e) => handleReductionApproachChange('offsettingPercentage', e.target.value)}
                  className="w-full mr-2"
                />
                <span className="text-sm w-10">{reductionApproach.offsettingPercentage}%</span>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Reduction Target Status</h4>
          <div className="p-4 bg-gray-50 rounded">
            <div className="flex justify-between mb-2">
              <span>Target Reduction:</span>
              <span className="font-medium">{targetStatus.targetReduction.toFixed(2)} tonnes CO2e</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>Direct Reduction Potential:</span>
              <span className="font-medium">{targetStatus.potentialReduction.toFixed(2)} tonnes CO2e</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>Offsetting Contribution:</span>
              <span className="font-medium">{targetStatus.offsetReduction.toFixed(2)} tonnes CO2e</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full mt-2 mb-2">
              <div 
                className={`h-2 rounded-full ${targetStatus.canMeetTarget ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min((targetStatus.totalReduction / targetStatus.targetReduction) * 100, 100)}%` }}
              ></div>
            </div>
            <div className="text-center mt-1">
              {targetStatus.canMeetTarget ? (
                <span className="text-green-600 text-sm font-medium">
                  Target achievable with selected strategies
                </span>
              ) : (
                <span className="text-red-600 text-sm font-medium">
                  Need {(targetStatus.targetReduction - targetStatus.totalReduction).toFixed(2)} more tonnes reduction
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <h3 className="text-lg font-semibold mt-6 mb-4">Available Reduction Strategies</h3>
      <div className="overflow-x-auto">
        {loading ? (
          <div className="text-center py-4">Loading strategies...</div>
        ) : (
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-2 px-3 border text-left">Strategy</th>
                <th className="py-2 px-3 border text-left">Potential Reduction</th>
                <th className="py-2 px-3 border text-left">Timeframe</th>
                <th className="py-2 px-3 border text-left">Difficulty</th>
                <th className="py-2 px-3 border text-left">Cost</th>
                <th className="py-2 px-3 border text-left">Annual Savings</th>
                <th className="py-2 px-3 border text-center">Select</th>
              </tr>
            </thead>
            <tbody>
              {availableStrategies.map(strategy => {
                const isSelected = selectedStrategies.some(s => s.id === strategy.id);
                
                return (
                  <tr key={strategy.id} className={isSelected ? 'bg-blue-50' : ''}>
                    <td className="py-2 px-3 border">
                      <div className="font-medium">{strategy.strategy}</div>
                      <div className="text-xs text-gray-500">{strategy.description}</div>
                    </td>
                    <td className="py-2 px-3 border">{strategy.potentialReduction.toFixed(2)} tonnes CO2e</td>
                    <td className="py-2 px-3 border">{strategy.timeframe}</td>
                    <td className="py-2 px-3 border">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        strategy.difficulty === 'Low' ? 'bg-green-100 text-green-800' :
                        strategy.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {strategy.difficulty}
                      </span>
                    </td>
                    <td className="py-2 px-3 border">${strategy.capex.toLocaleString()}</td>
                    <td className="py-2 px-3 border">${strategy.opexSavings.toLocaleString()}/year</td>
                    <td className="py-2 px-3 border text-center">
                      <button
                        className={`w-6 h-6 rounded-full ${isSelected ? 'bg-blue-500 text-white' : 'border border-gray-300'}`}
                        onClick={() => toggleStrategy(strategy)}
                      >
                        {isSelected && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      
      {selectedStrategies.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Selected Strategies Summary</h3>
          <div className="bg-blue-50 p-4 rounded border">
            <div className="mb-3">
              <span className="font-medium">Total Potential Reduction:</span>
              <span className="ml-2">{calculateTotalPotentialReduction().toFixed(2)} tonnes CO2e</span>
            </div>
            <div className="mb-3">
              <span className="font-medium">Total Implementation Cost:</span>
              <span className="ml-2">${selectedStrategies.reduce((total, s) => total + s.capex, 0).toLocaleString()}</span>
            </div>
            <div>
              <span className="font-medium">Projected Annual Savings:</span>
              <span className="ml-2">${selectedStrategies.reduce((total, s) => total + s.opexSavings, 0).toLocaleString()}/year</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Cost-Benefit Analysis Feature */}
      {selectedStrategies.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Cost-Benefit Analysis</h3>
          <div className="bg-white p-4 rounded border">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-3 py-2 text-left">Strategy</th>
                  <th className="border border-gray-300 px-3 py-2 text-right">Implementation Cost</th>
                  <th className="border border-gray-300 px-3 py-2 text-right">Annual Savings</th>
                  <th className="border border-gray-300 px-3 py-2 text-right">ROI (%)</th>
                  <th className="border border-gray-300 px-3 py-2 text-right">Payback Period (years)</th>
                </tr>
              </thead>
              <tbody>
                {selectedStrategies.map((strategy, index) => {
                  const roi = strategy.opexSavings > 0 ? (strategy.opexSavings / strategy.capex) * 100 : 0;
                  const paybackPeriod = strategy.opexSavings > 0 ? strategy.capex / strategy.opexSavings : 'N/A';
                  
                  return (
                    <tr key={strategy.id} className={index % 2 === 1 ? 'bg-gray-50' : ''}>
                      <td className="border border-gray-300 px-3 py-2 font-medium">{strategy.strategy}</td>
                      <td className="border border-gray-300 px-3 py-2 text-right">${strategy.capex.toLocaleString()}</td>
                      <td className="border border-gray-300 px-3 py-2 text-right">${strategy.opexSavings.toLocaleString()}</td>
                      <td className="border border-gray-300 px-3 py-2 text-right">{roi.toFixed(1)}%</td>
                      <td className="border border-gray-300 px-3 py-2 text-right">
                        {typeof paybackPeriod === 'number' ? paybackPeriod.toFixed(1) : paybackPeriod}
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-blue-50 font-medium">
                  <td className="border border-gray-300 px-3 py-2">Total</td>
                  <td className="border border-gray-300 px-3 py-2 text-right">
                    ${selectedStrategies.reduce((total, s) => total + s.capex, 0).toLocaleString()}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-right">
                    ${selectedStrategies.reduce((total, s) => total + s.opexSavings, 0).toLocaleString()}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-right">
                    {(selectedStrategies.reduce((total, s) => total + s.opexSavings, 0) / 
                      selectedStrategies.reduce((total, s) => total + s.capex, 0) * 100).toFixed(1)}%
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-right">
                    {(selectedStrategies.reduce((total, s) => total + s.capex, 0) / 
                      selectedStrategies.reduce((total, s) => total + s.opexSavings, 0)).toFixed(1)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReductionStrategiesInput;