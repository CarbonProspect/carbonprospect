import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, ComposedChart, Area } from 'recharts';

// Component to visualize livestock metrics including energy efficiency and reproductive performance
const LivestockMetricsVisualizer = ({
  // Basic inputs
  herdSize,
  animalType, 
  cattleType,
  // Emissions calculation factors
  feedType,
  manureManagement,
  useEmissionReductionAdditives,
  additiveEfficiency,
  grazingPractice,
  // Reproductive metrics
  calvingRate,
  timeToCalfBefore,
  timeToCalfAfter,
  supplementationType,
  // Energy metrics
  dietaryEnergyProfile,
  seasonalFeedChanges,
  // Project parameters
  projectYears = 10
}) => {
  // State for calculated metrics
  const [metricsData, setMetricsData] = useState(null);
  const [activeTab, setActiveTab] = useState('emissions');

  // Animal types data
  const animalTypes = {
    'cattle': {
      'dairy': { baseEmissions: 120, defaultCalvingRate: 85, defaultTimeToCalfBefore: 13 },
      'beef': { baseEmissions: 85, defaultCalvingRate: 75, defaultTimeToCalfBefore: 14 },
      'calves': { baseEmissions: 35, defaultCalvingRate: 0, defaultTimeToCalfBefore: 0 }
    },
    'buffalo': {
      'water_buffalo': { baseEmissions: 140, defaultCalvingRate: 70, defaultTimeToCalfBefore: 15 },
      'swamp_buffalo': { baseEmissions: 115, defaultCalvingRate: 65, defaultTimeToCalfBefore: 16 },
      'buffalo_calves': { baseEmissions: 40, defaultCalvingRate: 0, defaultTimeToCalfBefore: 0 }
    }
  };

  // Feed types data
  const feedTypes = {
    'grain': { factor: 1.0, energyMJ: 12.5, digestibility: 0.85 },
    'grass': { factor: 0.85, energyMJ: 10.0, digestibility: 0.65 },
    'mixed': { factor: 0.92, energyMJ: 11.2, digestibility: 0.75 },
    'optimized': { factor: 0.75, energyMJ: 11.8, digestibility: 0.82 }
  };

  // Dietary energy profiles
  const dietaryEnergyProfiles = {
    'low': { mj_per_day: 100, emissionsFactor: 0.9 },
    'medium': { mj_per_day: 150, emissionsFactor: 1.0 },
    'high': { mj_per_day: 200, emissionsFactor: 1.1 },
    'variable': { mj_per_day: 175, emissionsFactor: 1.05 }
  };

  // Supplementation types
  const supplementationTypes = {
    'none': { reproductiveEffect: 0, emissionsFactor: 1.0 },
    'mineral': { reproductiveEffect: 10, emissionsFactor: 0.98 },
    'protein': { reproductiveEffect: 15, emissionsFactor: 1.05 },
    'energy': { reproductiveEffect: 12, emissionsFactor: 1.03 },
    'complete': { reproductiveEffect: 20, emissionsFactor: 1.08 }
  };

  // Calculate metrics when inputs change
  useEffect(() => {
    calculateMetrics();
  }, [
    herdSize, animalType, cattleType, feedType, manureManagement,
    useEmissionReductionAdditives, additiveEfficiency, grazingPractice,
    calvingRate, timeToCalfBefore, timeToCalfAfter, supplementationType,
    dietaryEnergyProfile, seasonalFeedChanges, projectYears
  ]);

  // Function to calculate all metrics
  const calculateMetrics = () => {
    // Get baseline info for selected animal type
    const animalInfo = animalTypes[animalType]?.[cattleType] || 
                     { baseEmissions: 100, defaultCalvingRate: 70, defaultTimeToCalfBefore: 14 };
    
    // Get supplementation impact
    const supplementInfo = supplementationTypes[supplementationType] || supplementationTypes.none;
    
    // Get feed type info
    const feedInfo = feedTypes[feedType] || feedTypes.mixed;
    
    // Get dietary energy profile
    const dietaryInfo = dietaryEnergyProfiles[dietaryEnergyProfile] || dietaryEnergyProfiles.medium;
    
    // Calculate base and adjusted emissions intensity
    let baseEmissionsIntensity = animalInfo.baseEmissions;
    if (animalType === 'buffalo') baseEmissionsIntensity *= 1.15;
    
    // Apply various factors to get adjusted emissions
    let adjustedEmissionsIntensity = baseEmissionsIntensity;
    adjustedEmissionsIntensity *= feedInfo.factor;
    adjustedEmissionsIntensity *= dietaryInfo.emissionsFactor;
    adjustedEmissionsIntensity *= supplementInfo.emissionsFactor;
    
    // Apply emission reduction additives if enabled
    if (useEmissionReductionAdditives) {
      adjustedEmissionsIntensity *= (1 - (additiveEfficiency / 100));
    }
    
    // Calculate reproductive metrics
    const baseCalvingRate = parseFloat(calvingRate) || animalInfo.defaultCalvingRate;
    const improvedCalvingRate = Math.min(100, baseCalvingRate + supplementInfo.reproductiveEffect);
    
    const baseTimeToCalfMonths = parseFloat(timeToCalfBefore) || animalInfo.defaultTimeToCalfBefore;
    const improvedTimeToCalfMonths = parseFloat(timeToCalfAfter) || 
                                  Math.max(baseTimeToCalfMonths - 2, baseTimeToCalfMonths * 0.85);
    
    // Calculate energy metrics
    // Methane conversion factor (Ym) - % of gross energy intake converted to methane
    // This varies by animal type, feed digestibility, and other factors
    const baseMethaneFactor = animalType === 'buffalo' ? 7.0 : 6.5; // Buffalo have slightly higher base methane conversion
    const methaneFactor = baseMethaneFactor + ((1 - feedInfo.digestibility) * 10);
    
    // Calculate daily energy intake (MJ/day)
    let dailyEnergyIntake = dietaryInfo.mj_per_day;
    if (animalType === 'buffalo') dailyEnergyIntake *= 1.2; // Buffalo typically require more energy
    
    // Feed conversion efficiency (kg product / kg feed) - simplified estimation
    const feedConversionEfficiency = feedInfo.digestibility * (animalType === 'buffalo' ? 0.13 : 0.15);
    
    // Calculate emission factors by source
    // In livestock, emissions come from enteric fermentation, manure management, and feed production
    const entericFermentationPercent = animalType === 'buffalo' ? 65 : 60;
    const manureManagementPercent = 25;
    const feedProductionPercent = 100 - entericFermentationPercent - manureManagementPercent;
    
    // Calculate emissions by year and source
    const yearlyEmissionsData = [];
    let baseAnnualEmissions = (herdSize * baseEmissionsIntensity) / 1000; // tonnes CO2e
    let adjustedAnnualEmissions = (herdSize * adjustedEmissionsIntensity) / 1000;
    
    for (let year = 1; year <= projectYears; year++) {
      // Reproductive impact improves over time (better herd management leads to lower emissions intensity)
      const yearAdjustment = 1 - (Math.min(0.2, 0.02 * (year - 1))); // Up to 20% improvement over 10 years
      
      yearlyEmissionsData.push({
        year,
        baseEmissions: baseAnnualEmissions,
        adjustedEmissions: adjustedAnnualEmissions * yearAdjustment,
        entericFermentation: adjustedAnnualEmissions * yearAdjustment * (entericFermentationPercent / 100),
        manureManagement: adjustedAnnualEmissions * yearAdjustment * (manureManagementPercent / 100),
        feedProduction: adjustedAnnualEmissions * yearAdjustment * (feedProductionPercent / 100)
      });
    }
    
    // Calculate calf production over time
    const yearlyCalvingData = [];
    
    for (let year = 1; year <= projectYears; year++) {
      // Calculate calves born each year with gradual improvement in reproduction
      const yearlyImprovement = Math.min(5, 0.5 * (year - 1)); // Up to 5% additional improvement over 10 years
      const currentCalvingRate = Math.min(100, improvedCalvingRate + yearlyImprovement);
      const calvesProduced = herdSize * (currentCalvingRate / 100);
      const baseCalvesProduced = herdSize * (baseCalvingRate / 100);
      
      yearlyCalvingData.push({
        year,
        calvingRate: currentCalvingRate,
        calvesProduced,
        baseCalvesProduced,
        additionalCalves: calvesProduced - baseCalvesProduced
      });
    }
    
    // Calculate relationship between energy intake and emissions
    const energyEmissionsData = [];
    
    const baseEnergy = dietaryInfo.mj_per_day;
    for (let energyLevel = 0.7; energyLevel <= 1.3; energyLevel += 0.1) {
      const currentEnergy = baseEnergy * energyLevel;
      
      // Higher energy generally means higher emissions, but with diminishing returns
      // and different curves for cattle vs buffalo
      let emissionFactor;
      if (animalType === 'buffalo') {
        emissionFactor = 0.8 + (0.4 * Math.sqrt(energyLevel));
      } else {
        emissionFactor = 0.85 + (0.3 * Math.sqrt(energyLevel));
      }
      
      energyEmissionsData.push({
        energyLevel: currentEnergy.toFixed(0),
        emissionsFactor: emissionFactor.toFixed(2),
        relativeEmissions: (adjustedEmissionsIntensity * emissionFactor).toFixed(0)
      });
    }
    
    // Compile all metrics
    setMetricsData({
      emissions: {
        baseEmissionsIntensity: baseEmissionsIntensity.toFixed(1),
        adjustedEmissionsIntensity: adjustedEmissionsIntensity.toFixed(1),
        reductionPercent: ((baseEmissionsIntensity - adjustedEmissionsIntensity) / baseEmissionsIntensity * 100).toFixed(1),
        yearlyEmissionsData,
        emissionsSources: [
          { name: 'Enteric Fermentation', value: entericFermentationPercent },
          { name: 'Manure Management', value: manureManagementPercent },
          { name: 'Feed Production', value: feedProductionPercent }
        ]
      },
      reproduction: {
        baseCalvingRate,
        improvedCalvingRate,
        baseTimeToCalfMonths,
        improvedTimeToCalfMonths,
        timeSaved: (baseTimeToCalfMonths - improvedTimeToCalfMonths).toFixed(1),
        yearlyCalvingData
      },
      energy: {
        dailyEnergyIntake: dailyEnergyIntake.toFixed(1),
        methaneFactor: methaneFactor.toFixed(1),
        feedConversionEfficiency: feedConversionEfficiency.toFixed(3),
        feedDigestibility: (feedInfo.digestibility * 100).toFixed(0),
        energyEmissionsData
      }
    });
  };

  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 shadow-sm rounded text-xs">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} style={{ color: entry.color }}>
              {entry.name}: {entry.value} {entry.unit || ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Function to render emissions charts
  const renderEmissionsCharts = () => {
    if (!metricsData?.emissions) return <div className="text-center py-4">Loading emissions data...</div>;
    
    const { yearlyEmissionsData, emissionsSources } = metricsData.emissions;
    
    return (
      <div className="space-y-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Emissions Over Time</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={yearlyEmissionsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" label={{ value: 'Year', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'Tonnes CO2e', angle: -90, position: 'insideLeft' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="entericFermentation" stackId="1" fill="#FFBB28" stroke="#FFBB28" name="Enteric Fermentation" />
                <Area type="monotone" dataKey="manureManagement" stackId="1" fill="#00C49F" stroke="#00C49F" name="Manure Management" />
                <Area type="monotone" dataKey="feedProduction" stackId="1" fill="#0088FE" stroke="#0088FE" name="Feed Production" />
                <Line type="monotone" dataKey="baseEmissions" stroke="#ff0000" strokeWidth={2} dot={false} name="Baseline Emissions" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Emissions Sources</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={emissionsSources}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {emissionsSources.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Emissions Intensity</h3>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="p-3 bg-gray-50 rounded border text-center">
                <p className="text-sm text-gray-600">Baseline</p>
                <p className="text-xl font-bold text-red-600">{metricsData.emissions.baseEmissionsIntensity}</p>
                <p className="text-xs text-gray-500">kg CO2e/head/year</p>
              </div>
              <div className="p-3 bg-gray-50 rounded border text-center">
                <p className="text-sm text-gray-600">Improved</p>
                <p className="text-xl font-bold text-green-600">{metricsData.emissions.adjustedEmissionsIntensity}</p>
                <p className="text-xs text-gray-500">kg CO2e/head/year</p>
              </div>
              <div className="col-span-2 p-3 bg-green-50 rounded border text-center">
                <p className="text-sm text-gray-600">Reduction</p>
                <p className="text-xl font-bold text-green-700">{metricsData.emissions.reductionPercent}%</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Based on current management practices, {animalType} type, feed, and reproductive performance.
              Total herd emissions reduction: {((parseFloat(metricsData.emissions.baseEmissionsIntensity) - parseFloat(metricsData.emissions.adjustedEmissionsIntensity)) * herdSize / 1000).toFixed(1)} tonnes CO2e/year.
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Function to render reproductive performance charts
  const renderReproductionCharts = () => {
    if (!metricsData?.reproduction) return <div className="text-center py-4">Loading reproductive data...</div>;
    
    const { yearlyCalvingData, baseCalvingRate, improvedCalvingRate, baseTimeToCalfMonths, improvedTimeToCalfMonths } = metricsData.reproduction;
    
    return (
      <div className="space-y-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Calving Production Over Time</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={yearlyCalvingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" label={{ value: 'Year', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'Calves Born', angle: -90, position: 'insideLeft' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="baseCalvesProduced" fill="#0088FE" name="Base Production" />
                <Bar dataKey="additionalCalves" fill="#00C49F" name="Additional Production" stackId="a" />
                <Line type="monotone" dataKey="calvingRate" stroke="#FF8042" strokeWidth={2} yAxisId="right" name="Calving Rate (%)" />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'Calving Rate (%)', angle: 90, position: 'insideRight' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Reproductive Performance</h3>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="p-3 bg-gray-50 rounded border text-center">
                <p className="text-sm text-gray-600">Base Calving Rate</p>
                <p className="text-xl font-bold text-gray-600">{baseCalvingRate}%</p>
              </div>
              <div className="p-3 bg-gray-50 rounded border text-center">
                <p className="text-sm text-gray-600">Improved Rate</p>
                <p className="text-xl font-bold text-purple-600">{improvedCalvingRate}%</p>
              </div>
              <div className="p-3 bg-gray-50 rounded border text-center">
                <p className="text-sm text-gray-600">Base Time to Calf</p>
                <p className="text-xl font-bold text-gray-600">{baseTimeToCalfMonths} months</p>
              </div>
              <div className="p-3 bg-gray-50 rounded border text-center">
                <p className="text-sm text-gray-600">Improved Time</p>
                <p className="text-xl font-bold text-purple-600">{improvedTimeToCalfMonths.toFixed(1)} months</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Reproductive Benefits</h3>
            <div className="space-y-4 mt-4">
              <div className="p-3 bg-purple-50 rounded border">
                <p className="text-sm text-gray-600">Calving Rate Improvement</p>
                <p className="text-xl font-bold text-purple-700">+{(improvedCalvingRate - baseCalvingRate).toFixed(1)}%</p>
                <p className="text-xs text-gray-500">More calves born per 100 females</p>
              </div>
              
              <div className="p-3 bg-purple-50 rounded border">
                <p className="text-sm text-gray-600">Time Saved Per Reproductive Cycle</p>
                <p className="text-xl font-bold text-purple-700">{metricsData.reproduction.timeSaved} months</p>
                <p className="text-xs text-gray-500">Shorter interval between calvings</p>
              </div>
              
              <div className="p-3 bg-green-50 rounded border">
                <p className="text-sm text-gray-600">Additional Calves (Year 10)</p>
                <p className="text-xl font-bold text-green-700">
                  {(yearlyCalvingData[yearlyCalvingData.length - 1]?.additionalCalves || 0).toFixed(0)}
                </p>
                <p className="text-xs text-gray-500">Increased production from reproductive improvements</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Function to render energy metrics charts
  const renderEnergyCharts = () => {
    if (!metricsData?.energy) return <div className="text-center py-4">Loading energy data...</div>;
    
    const { energyEmissionsData, dailyEnergyIntake, methaneFactor, feedConversionEfficiency, feedDigestibility } = metricsData.energy;
    
    return (
      <div className="space-y-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Energy-Emissions Relationship</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={energyEmissionsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="energyLevel" label={{ value: 'Daily Energy Intake (MJ)', position: 'insideBottom', offset: -5 }} />
                <YAxis yAxisId="left" label={{ value: 'Emissions Factor', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'Relative Emissions (kg CO2e)', angle: 90, position: 'insideRight' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="emissionsFactor" stroke="#0088FE" name="Emissions Factor" />
                <Line yAxisId="right" type="monotone" dataKey="relativeEmissions" stroke="#FF8042" name="Relative Emissions" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            This chart shows how emissions change with energy intake for {animalType}. Higher energy intake generally increases emissions, but efficiency can improve with balanced diets.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Energy Metrics</h3>
            <div className="space-y-3 mt-4">
              <div className="p-3 bg-yellow-50 rounded border">
                <div className="flex justify-between">
                  <p className="text-sm font-medium text-gray-600">Daily Energy Intake:</p>
                  <p className="text-sm font-bold">{dailyEnergyIntake} MJ/day</p>
                </div>
              </div>
              
              <div className="p-3 bg-yellow-50 rounded border">
                <div className="flex justify-between">
                  <p className="text-sm font-medium text-gray-600">Feed Digestibility:</p>
                  <p className="text-sm font-bold">{feedDigestibility}%</p>
                </div>
              </div>
              
              <div className="p-3 bg-yellow-50 rounded border">
                <div className="flex justify-between">
                  <p className="text-sm font-medium text-gray-600">Methane Conversion Factor (Ym):</p>
                  <p className="text-sm font-bold">{methaneFactor}%</p>
                </div>
                <p className="text-xs text-gray-500 mt-1">Percentage of gross energy converted to methane</p>
              </div>
              
              <div className="p-3 bg-yellow-50 rounded border">
                <div className="flex justify-between">
                  <p className="text-sm font-medium text-gray-600">Feed Conversion Efficiency:</p>
                  <p className="text-sm font-bold">{feedConversionEfficiency} kg/kg</p>
                </div>
                <p className="text-xs text-gray-500 mt-1">kg product per kg feed intake</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Energy Efficiency</h3>
            <p className="text-sm text-gray-600 mb-4">
              Energy efficiency metrics for {animalType === 'cattle' ? 'cattle' : 'buffalo'} with selected diet and management practices:
            </p>
            
            <div className="p-3 bg-blue-50 rounded border">
              <p className="text-sm font-medium text-gray-700 mb-2">Key Energy Insights:</p>
              <ul className="text-sm space-y-2">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>{animalType === 'buffalo' ? 'Buffalo typically' : 'Cattle typically'} convert {methaneFactor}% of dietary energy to methane</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Higher feed digestibility ({feedDigestibility}%) reduces methane emissions</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Current feed conversion efficiency: {feedConversionEfficiency} kg product/kg feed</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>
                    {animalType === 'buffalo' ? 'Buffalo generally' : 'Cattle generally'} require {dailyEnergyIntake} MJ/day with current diet and productivity
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('emissions')}
            className={`py-2 px-4 text-sm font-medium ${
              activeTab === 'emissions'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent'
            }`}
          >
            Emissions Metrics
          </button>
          <button
            onClick={() => setActiveTab('reproduction')}
            className={`py-2 px-4 text-sm font-medium ${
              activeTab === 'reproduction'
                ? 'border-b-2 border-purple-500 text-purple-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent'
            }`}
          >
            Reproductive Performance
          </button>
          <button
            onClick={() => setActiveTab('energy')}
            className={`py-2 px-4 text-sm font-medium ${
              activeTab === 'energy'
                ? 'border-b-2 border-yellow-500 text-yellow-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent'
            }`}
          >
            Energy Metrics
          </button>
        </nav>
      </div>

      {/* Tab content */}
      <div className="mt-4">
        {!metricsData ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading metrics data...</p>
          </div>
        ) : (
          <>
            {activeTab === 'emissions' && renderEmissionsCharts()}
            {activeTab === 'reproduction' && renderReproductionCharts()}
            {activeTab === 'energy' && renderEnergyCharts()}
          </>
        )}
      </div>
    </div>
  );
};

export default LivestockMetricsVisualizer;