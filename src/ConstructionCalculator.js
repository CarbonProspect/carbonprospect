import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

// Material types defined outside component to prevent recreation
const concreteTypes = [
  { id: 'standard', name: 'Standard Concrete', factor: 1.0 },
  { id: 'lowcarbon', name: 'Low Carbon Concrete', factor: 0.7 },
  { id: 'geopolymer', name: 'Geopolymer Concrete', factor: 0.4 }
];

const steelTypes = [
  { id: 'standard', name: 'Standard Steel', factor: 1.0 },
  { id: 'recycled', name: 'Recycled Content Steel', factor: 0.6 },
  { id: 'green', name: 'Green Steel (Hydrogen Reduced)', factor: 0.3 }
];

const ConstructionCalculator = () => {
  // Demo construction calculator state
  const [buildingSize, setBuildingSize] = useState(5000);
  const [concreteType, setConcreteType] = useState('standard');
  const [steelType, setSteelType] = useState('standard');
  const [includeInsulation, setIncludeInsulation] = useState(true);
  const [includeRenewables, setIncludeRenewables] = useState(false);
  const [buildingLifespan, setBuildingLifespan] = useState(50);
  const [results, setResults] = useState(null);
  
  // Calculate emissions when inputs change
  useEffect(() => {
    // Emission factors (kg CO2e per unit)
    const concreteEmissionFactor = 300; // kg CO2e per m3
    const steelEmissionFactor = 2000; // kg CO2e per tonne
    
    // Get selected material factors
    const selectedConcrete = concreteTypes.find(c => c.id === concreteType);
    const selectedSteel = steelTypes.find(s => s.id === steelType);
    
    // Simple calculation for material volumes based on building size
    const concreteVolume = buildingSize * 0.2; // m3 per sqm (simplified)
    const steelVolume = buildingSize * 0.03; // tonnes per sqm (simplified)
    
    // Calculate baseline embodied carbon (standard materials)
    const baselineConcrete = concreteVolume * concreteEmissionFactor / 1000; // tonnes CO2e
    const baselineSteel = steelVolume * steelEmissionFactor / 1000; // tonnes CO2e
    
    // Calculate reduced embodied carbon (selected materials)
    const reducedConcrete = baselineConcrete * selectedConcrete.factor;
    const reducedSteel = baselineSteel * selectedSteel.factor;
    
    // Calculate operational carbon
    const baseOperational = buildingSize * 30 / 1000; // 30 kg CO2e/sqm/year
    
    // Apply reductions for insulation and renewables
    let reducedOperational = baseOperational;
    if (includeInsulation) {
      reducedOperational *= 0.75; // 25% reduction for improved insulation
    }
    if (includeRenewables) {
      reducedOperational *= 0.6; // Additional 40% reduction for renewables
    }
    
    // Prepare yearly data for charts
    const yearlyData = [];
    
    // Embodied carbon is front-loaded at year 0
    const totalBaselineEmbodied = baselineConcrete + baselineSteel;
    const totalReducedEmbodied = reducedConcrete + reducedSteel;
    
    let baselineCumulative = totalBaselineEmbodied;
    let reducedCumulative = totalReducedEmbodied;
    
    yearlyData.push({
      year: 0,
      baselineEmissions: totalBaselineEmbodied,
      reducedEmissions: totalReducedEmbodied,
      baselineCumulative,
      reducedCumulative
    });
    
    // Operational emissions accumulate over time
    for (let year = 1; year <= buildingLifespan; year++) {
      baselineCumulative += baseOperational;
      reducedCumulative += reducedOperational;
      
      yearlyData.push({
        year,
        baselineEmissions: baseOperational,
        reducedEmissions: reducedOperational,
        baselineCumulative,
        reducedCumulative
      });
    }
    
    // Materials breakdown data
    const materialsData = [
      {
        name: 'Concrete',
        baseline: baselineConcrete,
        reduced: reducedConcrete,
        savings: baselineConcrete - reducedConcrete
      },
      {
        name: 'Steel',
        baseline: baselineSteel,
        reduced: reducedSteel,
        savings: baselineSteel - reducedSteel
      }
    ];
    
    // Calculate emissions savings and other results
    const embodiedSavings = totalBaselineEmbodied - totalReducedEmbodied;
    const operationalSavings = baseOperational - reducedOperational;
    const annualSavings = operationalSavings;
    const lifetimeSavings = embodiedSavings + (operationalSavings * buildingLifespan);
    
    // Calculate break-even year
    let breakEvenYear = 'N/A';
    for (let i = 0; i < yearlyData.length; i++) {
      if (yearlyData[i].baselineCumulative >= yearlyData[i].reducedCumulative) {
        breakEvenYear = yearlyData[i].year;
        break;
      }
    }
    
    setResults({
      baselineConcrete,
      reducedConcrete,
      baselineSteel,
      reducedSteel,
      baseOperational,
      reducedOperational,
      totalBaselineEmbodied,
      totalReducedEmbodied,
      embodiedSavings,
      embodiedSavingsPercentage: (embodiedSavings / totalBaselineEmbodied) * 100,
      operationalSavings,
      operationalSavingsPercentage: (operationalSavings / baseOperational) * 100,
      annualSavings,
      lifetimeSavings,
      breakEvenYear,
      yearlyData,
      materialsData
    });
  }, [buildingSize, concreteType, steelType, includeInsulation, includeRenewables, buildingLifespan]); // Removed concreteTypes and steelTypes from dependencies

  return (
    <div className="bg-gray-50 p-4 rounded-lg shadow-inner">
      <h3 className="text-lg font-medium mb-6 text-blue-700 border-b pb-2">Try It: Construction Materials Emissions Assessment</h3>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Building Size (sqm)
            </label>
            <input
              type="number"
              min="100"
              max="50000"
              value={buildingSize}
              onChange={(e) => setBuildingSize(Math.max(100, parseInt(e.target.value) || 0))}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Concrete Type
            </label>
            <select 
              value={concreteType}
              onChange={(e) => setConcreteType(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              {concreteTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name} - {type.factor < 1 ? `-${Math.round((1-type.factor)*100)}% emissions` : 'Standard'}
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Steel Type
            </label>
            <select 
              value={steelType}
              onChange={(e) => setSteelType(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              {steelTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name} - {type.factor < 1 ? `-${Math.round((1-type.factor)*100)}% emissions` : 'Standard'}
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-4 space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="include_insulation"
                checked={includeInsulation}
                onChange={(e) => setIncludeInsulation(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="include_insulation" className="ml-2 block text-sm text-gray-700">
                Include High-Performance Insulation (-25% operational)
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="include_renewables"
                checked={includeRenewables}
                onChange={(e) => setIncludeRenewables(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="include_renewables" className="ml-2 block text-sm text-gray-700">
                Include Renewable Energy (-40% operational)
              </label>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Building Lifespan (years)
            </label>
            <input
              type="range"
              min="10"
              max="100"
              value={buildingLifespan}
              onChange={(e) => setBuildingLifespan(parseInt(e.target.value))}
              className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer"
            />
            <div className="text-sm text-center mt-1">{buildingLifespan} years</div>
          </div>
        </div>
        
        <div>
          {results && (
            <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
              <h4 className="text-md font-medium mb-3 text-blue-700 border-b pb-2">
                Quick Construction Assessment
              </h4>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 p-3 rounded shadow-inner">
                  <h5 className="text-xs font-medium text-gray-500">Embodied Carbon Reduction</h5>
                  <p className="text-lg font-bold text-blue-700">{results.embodiedSavingsPercentage.toFixed(1)}%</p>
                  <p className="text-xs text-gray-500">({results.embodiedSavings.toFixed(1)} tonnes CO₂e)</p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded shadow-inner">
                  <h5 className="text-xs font-medium text-gray-500">Operational Carbon Reduction</h5>
                  <p className="text-lg font-bold text-blue-700">{results.operationalSavingsPercentage.toFixed(1)}%</p>
                  <p className="text-xs text-gray-500">({results.operationalSavings.toFixed(1)} tonnes CO₂e/year)</p>
                </div>
              </div>
              
              <div className="h-40 mb-3">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={results.materialsData}
                    margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(value) => [`${value.toFixed(1)} tonnes CO₂e`, '']} />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Bar dataKey="baseline" name="Baseline Emissions" fill="#f87171" />
                    <Bar dataKey="reduced" name="Reduced Emissions" fill="#4ade80" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="p-3 bg-blue-50 rounded border border-blue-100">
                <h5 className="text-xs font-medium text-blue-800 mb-2">Lifetime Assessment</h5>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-gray-600">Total Savings:</div>
                  <div className="font-medium text-blue-700">
                    {results.lifetimeSavings.toFixed(1)} tonnes CO₂e
                  </div>
                  <div className="text-gray-600">Break-even Year:</div>
                  <div className="font-medium text-blue-700">Year {results.breakEvenYear}</div>
                  <div className="text-gray-600">Equivalent to:</div>
                  <div className="font-medium text-blue-700">
                    {Math.round(results.lifetimeSavings / 4.6)} cars off road for a year
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConstructionCalculator;