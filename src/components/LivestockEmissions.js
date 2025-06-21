import React, { useState } from 'react';
import LivestockEmissionsChart from './LivestockEmissionsChart';

// Enhanced LivestockProject component with advanced emissions and reproductive metrics
const EnhancedLivestockProject = ({
  // Basic herd info
  herdSize,
  animalType, // 'cattle' or 'buffalo'
  cattleType,
  customTypes,
  customSequestrationRate,
  useCustomRate,
  onAnimalTypeChange,
  onCattleTypeChange,
  onCustomSequestrationRateChange,
  onUseCustomRateChange,
  onShowCustomTypeModal,
  // Emissions calculation factors
  feedType,
  onFeedTypeChange,
  manureManagement,
  onManureManagementChange,
  useEmissionReductionAdditives,
  onUseEmissionReductionAdditivesChange,
  additiveEfficiency,
  onAdditiveEfficiencyChange,
  grazingPractice,
  onGrazingPracticeChange,
  regionClimate,
  onRegionClimateChange,
  // New reproductive metrics
  calvingRate,
  onCalvingRateChange,
  timeToCalfBefore,
  onTimeToCalfBeforeChange,
  timeToCalfAfter,
  onTimeToCalfAfterChange,
  supplementationType,
  onSupplementationTypeChange,
  // Energy and diet metrics
  dietaryEnergyProfile,
  onDietaryEnergyProfileChange,
  seasonalFeedChanges,
  onSeasonalFeedChangesChange,
  customFeedMixture,
  onCustomFeedMixtureChange,
  useCustomFeedMixture,
  onUseCustomFeedMixtureChange
}) => {
  // State for active chart tab
  const [activeChartTab, setActiveChartTab] = useState('cashflow');

  // Standard cattle types
  const cattleTypes = [
    { id: 'dairy', name: 'Dairy Cattle', baseEmissions: 120 },
    { id: 'beef', name: 'Beef Cattle', baseEmissions: 85 },
    { id: 'calves', name: 'Calves', baseEmissions: 35 }
  ];

  // Buffalo types
  const buffaloTypes = [
    { id: 'water_buffalo', name: 'Water Buffalo', baseEmissions: 140 },
    { id: 'swamp_buffalo', name: 'Swamp Buffalo', baseEmissions: 115 },
    { id: 'buffalo_calves', name: 'Buffalo Calves', baseEmissions: 40 }
  ];

  // Feed types and their emission modification factors - now with energy content
  const feedTypes = [
    { id: 'grain', name: 'Grain-Fed', factor: 1.0, energyMJ: 12.5, digestibility: 0.85 },
    { id: 'grass', name: 'Grass-Fed', factor: 0.85, energyMJ: 10.0, digestibility: 0.65 },
    { id: 'mixed', name: 'Mixed Feed', factor: 0.92, energyMJ: 11.2, digestibility: 0.75 },
    { id: 'optimized', name: 'Emission-Optimized Feed', factor: 0.75, energyMJ: 11.8, digestibility: 0.82 }
  ];

  // Supplementation types
  const supplementationTypes = [
    { id: 'none', name: 'None', reproductiveEffect: 0, emissionsFactor: 1.0 },
    { id: 'mineral', name: 'Mineral Supplements', reproductiveEffect: 10, emissionsFactor: 0.98 },
    { id: 'protein', name: 'Protein Supplements', reproductiveEffect: 15, emissionsFactor: 1.05 },
    { id: 'energy', name: 'Energy Supplements', reproductiveEffect: 12, emissionsFactor: 1.03 },
    { id: 'complete', name: 'Complete Feed Supplement', reproductiveEffect: 20, emissionsFactor: 1.08 }
  ];

  // Dietary energy profiles
  const dietaryEnergyProfiles = [
    { id: 'low', name: 'Low Energy Diet', mj_per_day: 100, emissionsFactor: 0.9 },
    { id: 'medium', name: 'Medium Energy Diet', mj_per_day: 150, emissionsFactor: 1.0 },
    { id: 'high', name: 'High Energy Diet', mj_per_day: 200, emissionsFactor: 1.1 },
    { id: 'variable', name: 'Variable Energy Diet', mj_per_day: 175, emissionsFactor: 1.05 }
  ];

  // Seasonal feed change patterns
  const seasonalFeedPatterns = [
    { id: 'constant', name: 'Constant Year-Round', seasonalVariation: false },
    { id: 'two_season', name: 'Wet/Dry Season Pattern', seasonalVariation: true },
    { id: 'four_season', name: 'Four Season Pattern', seasonalVariation: true },
    { id: 'custom', name: 'Custom Seasonal Pattern', seasonalVariation: true }
  ];

  // Manure management systems
  const manureManagementSystems = [
    { id: 'standard', name: 'Standard Storage', factor: 1.0 },
    { id: 'covered', name: 'Covered Storage', factor: 0.8 },
    { id: 'anaerobic', name: 'Anaerobic Digestion', factor: 0.45 },
    { id: 'composting', name: 'Aerobic Composting', factor: 0.6 },
    { id: 'daily_spread', name: 'Daily Spread', factor: 0.7 }
  ];

  // Grazing practices
  const grazingPractices = [
    { id: 'continuous', name: 'Continuous Grazing', factor: 1.0 },
    { id: 'rotational', name: 'Rotational Grazing', factor: 0.85 },
    { id: 'adaptive', name: 'Adaptive Multi-Paddock', factor: 0.7 },
    { id: 'silvopasture', name: 'Silvopasture', factor: 0.6 }
  ];

  // Climate regions
  const climateRegions = [
    { id: 'temperate', name: 'Temperate', factor: 1.0 },
    { id: 'tropical', name: 'Tropical', factor: 1.15 },
    { id: 'arid', name: 'Arid', factor: 0.9 },
    { id: 'continental', name: 'Continental', factor: 1.05 }
  ];
  // Find selected animal type (cattle or buffalo)
  const animalTypesMap = {
    'cattle': cattleTypes,
    'buffalo': buffaloTypes
  };
  
  const availableTypes = animalTypesMap[animalType] || cattleTypes;
  
  // Find selected animal type
  const selectedAnimalType = availableTypes.find(type => type.id === cattleType) || 
                          (customTypes?.[animalType] || []).find(type => type.id === cattleType);

  // Find selected supplementation type
  const selectedSupplementationType = supplementationTypes.find(type => type.id === supplementationType) || supplementationTypes[0];
  
  // Find selected dietary energy profile
  const selectedDietaryProfile = dietaryEnergyProfiles.find(profile => profile.id === dietaryEnergyProfile) || dietaryEnergyProfiles[1];
  
  // Find selected seasonal pattern
  const selectedSeasonalPattern = seasonalFeedPatterns.find(pattern => pattern.id === seasonalFeedChanges) || seasonalFeedPatterns[0];

  // Calculate improved calving rate with supplementation
  const calculatedCalvingRateAfter = Math.min(
    100, 
    parseFloat(calvingRate) + selectedSupplementationType.reproductiveEffect
  );
  // Calculate the current emissions intensity based on selected options
  const calculateEmissionsIntensity = () => {
    // Base emissions rate modified for animal type
    let baseRate = selectedAnimalType?.baseEmissions || 100;
    
    // Species-specific adjustment (buffalo vs cattle)
    if (animalType === 'buffalo') {
      // Buffalo generally have higher emissions due to different digestive efficiency
      baseRate *= 1.15;
    }
    
    // Apply feed factor
    const selectedFeed = feedTypes.find(f => f.id === feedType);
    baseRate *= selectedFeed?.factor || 1.0;
    
    // Apply dietary energy profile factor
    baseRate *= selectedDietaryProfile.emissionsFactor;
    
    // Apply supplementation effect
    baseRate *= selectedSupplementationType.emissionsFactor;
    
    // Apply manure management factor
    const selectedManure = manureManagementSystems.find(m => m.id === manureManagement);
    baseRate *= selectedManure?.factor || 1.0;
    
    // Apply grazing practice factor
    const selectedGrazing = grazingPractices.find(g => g.id === grazingPractice);
    baseRate *= selectedGrazing?.factor || 1.0;
    
    // Apply climate region factor
    const selectedClimate = climateRegions.find(c => c.id === regionClimate);
    baseRate *= selectedClimate?.factor || 1.0;
    
    // Apply additive reduction if enabled
    if (useEmissionReductionAdditives) {
      baseRate *= (1 - (additiveEfficiency / 100));
    }
    
    // Apply seasonal variation if applicable
    if (selectedSeasonalPattern.seasonalVariation) {
      // Add a small factor for seasonal variation - this would ideally be more complex
      baseRate *= 0.95; // Assuming seasonal variation slightly decreases annual emissions
    }
    
    // Apply reproductive efficiency factor - better reproduction = fewer replacement animals needed
    // Lower time to calf and higher calving rate means better efficiency
    const reproductiveEfficiencyFactor = 1 - ((100 - parseFloat(calvingRate)) / 200) - 
                                        ((parseFloat(timeToCalfBefore) - parseFloat(timeToCalfAfter)) / 60);
    
    baseRate *= Math.max(0.8, reproductiveEfficiencyFactor); // Cap the reduction at 20%
    
    return baseRate.toFixed(2);
  };

  // Calculate energy efficiency and feed conversion metrics
  const calculateEnergyMetrics = () => {
    const selectedFeed = feedTypes.find(f => f.id === feedType) || feedTypes[0];
    
    // Calculate daily energy intake (MJ/day)
    let dailyEnergyIntake = selectedDietaryProfile.mj_per_day;
    
    // Adjust for animal type
    if (animalType === 'buffalo') {
      dailyEnergyIntake *= 1.2; // Buffalo typically require more energy
    }
    
    // Calculate methane conversion factor (Ym) - based on digestibility
    const methaneFactor = 6.5 + ((1 - selectedFeed.digestibility) * 10);
    
    // Feed conversion efficiency (kg product / kg feed) - simplified estimation
    const feedConversionEfficiency = selectedFeed.digestibility * 0.15;
    
    return {
      dailyEnergyIntake: dailyEnergyIntake.toFixed(1),
      methaneFactor: methaneFactor.toFixed(1),
      feedConversionEfficiency: feedConversionEfficiency.toFixed(3)
    };
  };

  const currentEmissionsIntensity = calculateEmissionsIntensity();
  const energyMetrics = calculateEnergyMetrics();

  // Calculate reproductive efficiency metrics
  const calculateReproductiveEfficiency = () => {
    // Calculate annual calf production per 100 females
    const annualCalfProductionBefore = parseFloat(calvingRate);
    const annualCalfProductionAfter = calculatedCalvingRateAfter;
    
    // Calculate annual productivity increase
    const productivityIncrease = annualCalfProductionAfter - annualCalfProductionBefore;
    
    // Calculate time saved in reproductive cycle (months)
    const timeSaved = parseFloat(timeToCalfBefore) - parseFloat(timeToCalfAfter);
    
    // Calculate lifetime production impact (assuming 8 year productive life)
    const averageCalvesLifetimeBefore = (annualCalfProductionBefore / 100) * 8;
    const averageCalvesLifetimeAfter = (annualCalfProductionAfter / 100) * 8;
    
    return {
      annualCalfProductionBefore,
      annualCalfProductionAfter,
      productivityIncrease,
      timeSaved,
      averageCalvesLifetimeBefore: averageCalvesLifetimeBefore.toFixed(1),
      averageCalvesLifetimeAfter: averageCalvesLifetimeAfter.toFixed(1),
      lifetimeProductionIncrease: (averageCalvesLifetimeAfter - averageCalvesLifetimeBefore).toFixed(1)
    };
  };

  // Calculate baseline emissions for comparison
  const calculateBaselineEmissions = () => {
    let baseRate = selectedAnimalType?.baseEmissions || 100;
    
    // Species-specific adjustment (buffalo vs cattle)
    if (animalType === 'buffalo') {
      baseRate *= 1.15;
    }
    
    return baseRate.toFixed(2);
  };

  // Calculate emissions data for visualization
  const baselineEmissionsRate = parseFloat(calculateBaselineEmissions());
  const adjustedEmissionsRate = parseFloat(currentEmissionsIntensity);
  
  // Create yearly emissions data for the chart
  const createYearlyEmissionsData = (years = 10) => {
    const data = [];
    for (let year = 1; year <= years; year++) {
      // Base values
      const baselineEmissions = baselineEmissionsRate * herdSize;
      const adjustedEmissions = adjustedEmissionsRate * herdSize;
      
      data.push({
        year,
        baselineEmissions,
        adjustedEmissions,
        emissionsReduction: baselineEmissions - adjustedEmissions,
        emissionsReductionPercent: ((baselineEmissions - adjustedEmissions) / baselineEmissions) * 100
      });
    }
    return data;
  };

  // Generate yearly data for emissions chart
  const yearlyEmissionsData = createYearlyEmissionsData();
  
  // Format emissions intensity data for the chart
  const emissionsIntensityData = {
    baseline: baselineEmissionsRate,
    reduced: adjustedEmissionsRate,
    percentReduction: ((baselineEmissionsRate - adjustedEmissionsRate) / baselineEmissionsRate) * 100
  };

  const reproductiveMetrics = calculateReproductiveEfficiency();
  return (
    <div className="space-y-4">
      {/* Basic Herd Information Section */}
      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
        <h3 className="font-medium text-green-800 mb-2">Herd Information</h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Animal Type</label>
            <select
              value={animalType}
              onChange={(e) => onAnimalTypeChange(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
            >
              <option value="cattle">Cattle</option>
              <option value="buffalo">Buffalo</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Animal Category</label>
            <div className="relative">
              <select
                value={cattleType}
                onChange={(e) => onCattleTypeChange(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              >
                <optgroup label={`Standard ${animalType === 'cattle' ? 'Cattle' : 'Buffalo'} Types`}>
                  {availableTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name} ({type.baseEmissions} kg CO2e/head/year)
                    </option>
                  ))}
                </optgroup>
                {customTypes?.[animalType]?.length > 0 && (
                  <optgroup label="Custom Types">
                    {customTypes[animalType].map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name} ({type.baseEmissions || type.emissionsRate} kg CO2e/head/year)
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              <button
                onClick={() => onShowCustomTypeModal(animalType)}
                className="absolute right-0 top-0 h-full px-2 bg-green-100 text-green-800 border-l rounded-r hover:bg-green-200"
                title={`Add Custom ${animalType === 'cattle' ? 'Cattle' : 'Buffalo'} Type`}
                type="button"
              >
                +
              </button>
            </div>
          </div>
          
          {useCustomRate ? (
            <div>
              <label htmlFor="customEmissionsRate" className="block text-sm font-medium mb-1 text-gray-700">
                Custom Emissions Rate (kg CO2e/head/year)
              </label>
              <input
                id="customEmissionsRate"
                type="number"
                min="0"
                value={customSequestrationRate}
                onChange={(e) => onCustomSequestrationRateChange(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              />
            </div>
          ) : (
            <div>
              <div className="flex justify-between">
                <label className="block text-sm font-medium mb-1 text-gray-700">Base Emissions Rate</label>
                <div className="text-sm">
                  <button
                    type="button"
                    onClick={() => onUseCustomRateChange(true)}
                    className="text-green-600 hover:text-green-800"
                  >
                    Use custom rate
                  </button>
                </div>
              </div>
              <div className="p-2 bg-gray-100 rounded border text-sm">
                {selectedAnimalType ? `${selectedAnimalType.baseEmissions} kg CO2e/head/year` : 'Select an animal type'}
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Herd Size</label>
            <div className="p-2 bg-gray-100 rounded border text-sm">
              {herdSize.toLocaleString()} head
            </div>
          </div>
        </div>
      </div>
      {/* Reproductive Performance Section */}
      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
        <h3 className="font-medium text-purple-800 mb-2">Reproductive Performance</h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="calvingRate" className="block text-sm font-medium mb-1 text-gray-700">
              Current Calving Rate (%)
            </label>
            <input
              id="calvingRate"
              type="number"
              min="0"
              max="100"
              value={calvingRate}
              onChange={(e) => onCalvingRateChange(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Supplementation Type</label>
            <select
              value={supplementationType}
              onChange={(e) => onSupplementationTypeChange(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
            >
              {supplementationTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} (+{type.reproductiveEffect}% calving rate)
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="timeToCalfBefore" className="block text-sm font-medium mb-1 text-gray-700">
              Time to Calf Before Supplementation (months)
            </label>
            <input
              id="timeToCalfBefore"
              type="number"
              min="0"
              max="60"
              value={timeToCalfBefore}
              onChange={(e) => onTimeToCalfBeforeChange(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
            />
          </div>
          
          <div>
            <label htmlFor="timeToCalfAfter" className="block text-sm font-medium mb-1 text-gray-700">
              Time to Calf After Supplementation (months)
            </label>
            <input
              id="timeToCalfAfter"
              type="number"
              min="0"
              max="60"
              value={timeToCalfAfter}
              onChange={(e) => onTimeToCalfAfterChange(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
            />
          </div>
        </div>
        
        {/* Reproductive Metrics Results */}
        <div className="mt-4 p-3 bg-white rounded-lg border border-purple-200">
          <h4 className="font-medium text-purple-700 mb-2">Reproductive Performance Metrics</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-sm">
              <span className="font-medium">Calving Rate Before:</span> {reproductiveMetrics.annualCalfProductionBefore}%
            </div>
            <div className="text-sm">
              <span className="font-medium">Calving Rate After:</span> {reproductiveMetrics.annualCalfProductionAfter}%
            </div>
            <div className="text-sm">
              <span className="font-medium">Productivity Increase:</span> +{reproductiveMetrics.productivityIncrease}%
            </div>
            <div className="text-sm">
              <span className="font-medium">Time Saved per Cycle:</span> {reproductiveMetrics.timeSaved} months
            </div>
            <div className="text-sm">
              <span className="font-medium">Lifetime Calves (Before):</span> {reproductiveMetrics.averageCalvesLifetimeBefore}
            </div>
            <div className="text-sm">
              <span className="font-medium">Lifetime Calves (After):</span> {reproductiveMetrics.averageCalvesLifetimeAfter}
            </div>
          </div>
        </div>
      </div>
      {/* Energy and Diet Section */}
      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <h3 className="font-medium text-yellow-800 mb-2">Energy and Diet</h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Feed Type</label>
            <select
              value={feedType}
              onChange={(e) => onFeedTypeChange(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
            >
              {feedTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} ({type.energyMJ} MJ/kg, {type.digestibility*100}% digestibility)
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Dietary Energy Profile</label>
            <select
              value={dietaryEnergyProfile}
              onChange={(e) => onDietaryEnergyProfileChange(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
            >
              {dietaryEnergyProfiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name} ({profile.mj_per_day} MJ/day)
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Seasonal Feed Changes</label>
            <select
              value={seasonalFeedChanges}
              onChange={(e) => onSeasonalFeedChangesChange(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
            >
              {seasonalFeedPatterns.map((pattern) => (
                <option key={pattern.id} value={pattern.id}>
                  {pattern.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="col-span-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="useCustomFeedMixture"
                checked={useCustomFeedMixture}
                onChange={(e) => onUseCustomFeedMixtureChange(e.target.checked)}
                className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
              />
              <label htmlFor="useCustomFeedMixture" className="ml-2 block text-sm text-gray-700">
                Use custom feed mixture
              </label>
            </div>
            
            {useCustomFeedMixture && (
              <div className="mt-2">
                <label htmlFor="customFeedMixture" className="block text-sm font-medium mb-1 text-gray-700">
                  Custom Feed Composition (JSON format)
                </label>
                <textarea
                  id="customFeedMixture"
                  value={customFeedMixture}
                  onChange={(e) => onCustomFeedMixtureChange(e.target.value)}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                  rows={3}
                  placeholder='{"forage": 60, "grain": 25, "supplement": 15}'
                />
                <p className="text-xs text-gray-500 mt-1">Format: Percentages of each component in the diet (should sum to 100%)</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Energy Metrics Results */}
        <div className="mt-4 p-3 bg-white rounded-lg border border-yellow-200">
          <h4 className="font-medium text-yellow-700 mb-2">Energy Metrics</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-sm">
              <span className="font-medium">Daily Energy Intake:</span> {energyMetrics.dailyEnergyIntake} MJ/day
            </div>
            <div className="text-sm">
              <span className="font-medium">Methane Conversion Factor (Ym):</span> {energyMetrics.methaneFactor}%
            </div>
            <div className="text-sm">
              <span className="font-medium">Feed Conversion Efficiency:</span> {energyMetrics.feedConversionEfficiency} kg product/kg feed
            </div>
          </div>
        </div>
      </div>
      {/* Emissions Factors Section */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-medium text-blue-800 mb-2">Emissions Intensity Factors</h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Manure Management</label>
            <select
              value={manureManagement}
              onChange={(e) => onManureManagementChange(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              {manureManagementSystems.map((system) => (
                <option key={system.id} value={system.id}>{system.name} (Factor: {system.factor})</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Grazing Practice</label>
            <select
              value={grazingPractice}
              onChange={(e) => onGrazingPracticeChange(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              {grazingPractices.map((practice) => (
                <option key={practice.id} value={practice.id}>{practice.name} (Factor: {practice.factor})</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Region/Climate</label>
            <select
              value={regionClimate}
              onChange={(e) => onRegionClimateChange(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              {climateRegions.map((region) => (
                <option key={region.id} value={region.id}>{region.name} (Factor: {region.factor})</option>
              ))}
            </select>
          </div>
          
          <div className="col-span-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="useEmissionReductionAdditives"
                checked={useEmissionReductionAdditives}
                onChange={(e) => onUseEmissionReductionAdditivesChange(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="useEmissionReductionAdditives" className="ml-2 block text-sm text-gray-700">
                Use emission reduction feed additives
              </label>
            </div>
            
            {useEmissionReductionAdditives && (
              <div className="mt-2">
                <label htmlFor="additiveEfficiency" className="block text-sm font-medium mb-1 text-gray-700">
                  Additive Reduction Efficiency (%)
                </label>
                <input
                  id="additiveEfficiency"
                  type="number"
                  min="0"
                  max="40"
                  value={additiveEfficiency}
                  onChange={(e) => onAdditiveEfficiencyChange(Math.min(40, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum methane reduction potential is currently capped at 40% based on available technologies.</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Results preview */}
        <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Calculated Emissions Intensity:</span>
            <span className="text-sm font-bold">{currentEmissionsIntensity} kg CO2e/head/year</span>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="text-xs text-gray-500">
              This reflects the adjusted emissions rate based on your selected management practices and reproductive performance.
              Total annual emissions = {currentEmissionsIntensity} × {herdSize.toLocaleString()} head = {(parseFloat(currentEmissionsIntensity) * herdSize).toLocaleString()} kg CO2e/year
            </div>
          </div>
        </div>
      </div>
      
      {/* New Emissions Analysis Tab Section */}
      <div className="mt-6 border rounded-lg overflow-hidden shadow">
        <div className="bg-gray-100 px-4 py-2 border-b">
          <div className="flex space-x-4">
            <button
              className={`py-2 px-3 ${activeChartTab === 'cashflow' ? 'text-green-700 border-b-2 border-green-700 font-medium' : 'text-gray-600 hover:text-green-600'} transition-colors`}
              onClick={() => setActiveChartTab('cashflow')}
              type="button"
            >
              Cash Flow Chart
            </button>
            <button
              className={`py-2 px-3 ${activeChartTab === 'npv' ? 'text-green-700 border-b-2 border-green-700 font-medium' : 'text-gray-600 hover:text-green-600'} transition-colors`}
              onClick={() => setActiveChartTab('npv')}
              type="button"
            >
              NPV Analysis
            </button>
            <button
              className={`py-2 px-3 ${activeChartTab === 'costs' ? 'text-green-700 border-b-2 border-green-700 font-medium' : 'text-gray-600 hover:text-green-600'} transition-colors`}
              onClick={() => setActiveChartTab('costs')}
              type="button"
            >
              Cost Breakdown
            </button>
            <button
              className={`py-2 px-3 ${activeChartTab === 'emissions' ? 'text-green-700 border-b-2 border-green-700 font-medium' : 'text-gray-600 hover:text-green-600'} transition-colors`}
              onClick={() => setActiveChartTab('emissions')}
              type="button"
            >
              Emissions Analysis
            </button>
          </div>
        </div>
        
        <div className="p-4">
          {activeChartTab === 'emissions' && (
            <LivestockEmissionsChart 
              yearlyData={yearlyEmissionsData}
              emissionsIntensity={emissionsIntensityData}
              herdSize={herdSize}
            />
          )}
          {/* Other chart tabs would be rendered here */}
          {activeChartTab !== 'emissions' && (
            <div className="text-center py-8 text-gray-500">
              Please select the Emissions Analysis tab to view emissions data visualization.
              <p className="mt-2 text-sm">Other chart components would be implemented here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedLivestockProject;
// Enhanced livestock calculation function with reproductive efficiency and energy considerations
export const calculateEnhancedLivestockResults = ({
  // Basic herd parameters
  herdSize,
  animalType,
  cattleType,
  customTypes,
  customSequestrationRate,
  useCustomRate,
  // Emissions intensity parameters
  feedType,
  manureManagement,
  useEmissionReductionAdditives,
  additiveEfficiency,
  grazingPractice,
  regionClimate,
  // Reproductive parameters
  calvingRate,
  timeToCalfBefore,
  timeToCalfAfter,
  supplementationType,
  // Energy parameters
  dietaryEnergyProfile,
  seasonalFeedChanges,
  customFeedMixture,
  useCustomFeedMixture,
  // Common parameters
  projectYears,
  discountRate,
  costs,
  carbonCreditPrice,
  useYearlyCarbonPrices,
  carbonPricesByYear,
  // Added parameter for reproductive improvement costs
  reproductiveImprovementCosts
}) => {
  // Standard cattle types
  const cattleTypes = [
    { id: 'dairy', name: 'Dairy Cattle', baseEmissions: 120, reductionPotential: 0.3, cost: 45 },
    { id: 'beef', name: 'Beef Cattle', baseEmissions: 85, reductionPotential: 0.25, cost: 35 },
    { id: 'calves', name: 'Calves', baseEmissions: 35, reductionPotential: 0.2, cost: 20 }
  ];

  // Buffalo types
  const buffaloTypes = [
    { id: 'water_buffalo', name: 'Water Buffalo', baseEmissions: 140, reductionPotential: 0.25, cost: 55 },
    { id: 'swamp_buffalo', name: 'Swamp Buffalo', baseEmissions: 115, reductionPotential: 0.22, cost: 45 },
    { id: 'buffalo_calves', name: 'Buffalo Calves', baseEmissions: 40, reductionPotential: 0.18, cost: 25 }
  ];

  // Get appropriate animal types based on selection
  const animalTypesMap = {
    'cattle': cattleTypes,
    'buffalo': buffaloTypes
  };
  
  const availableTypes = animalTypesMap[animalType] || cattleTypes;
  
  // Find selected animal type
  const selectedAnimalType = availableTypes.find(type => type.id === cattleType) || 
                          (customTypes?.[animalType] || []).find(type => type.id === cattleType) ||
                          availableTypes[0]; // Default to first type if not found
                          // Supplementation types
  const supplementationTypes = [
    { id: 'none', reproductiveEffect: 0, emissionsFactor: 1.0, cost: 0 },
    { id: 'mineral', reproductiveEffect: 10, emissionsFactor: 0.98, cost: 5 },
    { id: 'protein', reproductiveEffect: 15, emissionsFactor: 1.05, cost: 15 },
    { id: 'energy', reproductiveEffect: 12, emissionsFactor: 1.03, cost: 10 },
    { id: 'complete', reproductiveEffect: 20, emissionsFactor: 1.08, cost: 25 }
  ];

  // Get selected supplementation type
  const selectedSupplementationType = supplementationTypes.find(type => type.id === supplementationType) || supplementationTypes[0];
  
  // Dietary energy profiles
  const dietaryEnergyProfiles = [
    { id: 'low', mj_per_day: 100, emissionsFactor: 0.9 },
    { id: 'medium', mj_per_day: 150, emissionsFactor: 1.0 },
    { id: 'high', mj_per_day: 200, emissionsFactor: 1.1 },
    { id: 'variable', mj_per_day: 175, emissionsFactor: 1.05 }
  ];

  // Get selected dietary profile
  const selectedDietaryProfile = dietaryEnergyProfiles.find(profile => profile.id === dietaryEnergyProfile) || dietaryEnergyProfiles[1];
  
  // Seasonal feed patterns
  const seasonalFeedPatterns = [
    { id: 'constant', seasonalVariation: false, costFactor: 1.0 },
    { id: 'two_season', seasonalVariation: true, costFactor: 1.1 },
    { id: 'four_season', seasonalVariation: true, costFactor: 1.2 },
    { id: 'custom', seasonalVariation: true, costFactor: 1.3 }
  ];

  // Get selected seasonal pattern
  const selectedSeasonalPattern = seasonalFeedPatterns.find(pattern => pattern.id === seasonalFeedChanges) || seasonalFeedPatterns[0];
  
  // Get baseline emission rate - this is the BAU (business as usual) scenario
  let baselineEmissionsRate;
  if (useCustomRate && customSequestrationRate) {
    baselineEmissionsRate = parseFloat(customSequestrationRate);
  } else {
    baselineEmissionsRate = selectedAnimalType.baseEmissions || 100;
  }
  
  // Feed types and their emission modification factors
  const feedTypes = [
    { id: 'grain', factor: 1.0, energyMJ: 12.5, digestibility: 0.85, cost: 12 },
    { id: 'grass', factor: 0.85, energyMJ: 10.0, digestibility: 0.65, cost: 5 },
    { id: 'mixed', factor: 0.92, energyMJ: 11.2, digestibility: 0.75, cost: 8 },
    { id: 'optimized', factor: 0.75, energyMJ: 11.8, digestibility: 0.82, cost: 18 }
  ];
  
  // Apply species-specific adjustment (buffalo vs cattle)
  if (animalType === 'buffalo') {
    // Buffalo generally have higher emissions due to different digestive efficiency
    baselineEmissionsRate *= 1.15;
  }
  // Calculate adjusted emission rate with all factors
  let adjustedEmissionsRate = baselineEmissionsRate;
  
  // Apply feed factor
  const selectedFeed = feedTypes.find(f => f.id === feedType) || feedTypes[0];
  adjustedEmissionsRate *= selectedFeed.factor;
  
  // Apply dietary energy profile factor
  adjustedEmissionsRate *= selectedDietaryProfile.emissionsFactor;
  
  // Apply supplementation effect
  adjustedEmissionsRate *= selectedSupplementationType.emissionsFactor;
  // Apply manure management factor
  const manureManagementSystems = [
    { id: 'standard', factor: 1.0, cost: 0 },
    { id: 'covered', factor: 0.8, cost: 10 },
    { id: 'anaerobic', factor: 0.45, cost: 30 },
    { id: 'composting', factor: 0.6, cost: 15 },
    { id: 'daily_spread', factor: 0.7, cost: 8 }
  ];
  const selectedManure = manureManagementSystems.find(m => m.id === manureManagement) || manureManagementSystems[0];
  adjustedEmissionsRate *= selectedManure.factor;
  
  // Apply grazing practice factor
  const grazingPractices = [
    { id: 'continuous', factor: 1.0, cost: 0 },
    { id: 'rotational', factor: 0.85, cost: 8 },
    { id: 'adaptive', factor: 0.7, cost: 15 },
    { id: 'silvopasture', factor: 0.6, cost: 25 }
  ];
  const selectedGrazing = grazingPractices.find(g => g.id === grazingPractice) || grazingPractices[0];
  adjustedEmissionsRate *= selectedGrazing.factor;
  
  // Apply climate region factor
  const climateRegions = [
    { id: 'temperate', factor: 1.0 },
    { id: 'tropical', factor: 1.15 },
    { id: 'arid', factor: 0.9 },
    { id: 'continental', factor: 1.05 }
  ];
  const selectedClimate = climateRegions.find(c => c.id === regionClimate) || climateRegions[0];
  adjustedEmissionsRate *= selectedClimate.factor;
  
  // Apply additive reduction if enabled
  if (useEmissionReductionAdditives) {
    adjustedEmissionsRate *= (1 - (additiveEfficiency / 100));
  }
  
  // Apply seasonal variation if applicable
  if (selectedSeasonalPattern.seasonalVariation) {
    // Add a small factor for seasonal variation - this would ideally be more complex
    adjustedEmissionsRate *= 0.95; // Assuming seasonal variation slightly decreases annual emissions
  }
  // Calculate improved calving rate with supplementation
  const baseCalvingRate = parseFloat(calvingRate) || 60; // Default to 60% if not provided
  const improvedCalvingRate = Math.min(100, baseCalvingRate + selectedSupplementationType.reproductiveEffect);
  
  // Apply reproductive efficiency factor - better reproduction = fewer replacement animals needed
  // Lower time to calf and higher calving rate means better efficiency
  const timeToCalfBeforeValue = parseFloat(timeToCalfBefore) || 14; // Default to 14 months if not provided
  const timeToCalfAfterValue = parseFloat(timeToCalfAfter) || timeToCalfBeforeValue; // Default to same as before if not provided
  
  const reproductiveEfficiencyFactor = 1 - ((100 - baseCalvingRate) / 200) - 
                                      ((timeToCalfBeforeValue - timeToCalfAfterValue) / 60);
  
  adjustedEmissionsRate *= Math.max(0.8, reproductiveEfficiencyFactor); // Cap the reduction at 20%

  // Calculate baseline and adjusted annual emissions in tCO2e
  const baselineAnnualEmissions = (herdSize * baselineEmissionsRate) / 1000; // Convert kg to tonnes
  const adjustedAnnualEmissions = (herdSize * adjustedEmissionsRate) / 1000;
  
  // Calculate the annual emissions reduction
  const annualEmissionsReduction = baselineAnnualEmissions - adjustedAnnualEmissions;
  // Use carbon price by year or flat price
  const getCarbonPrice = (year) => {
    if (useYearlyCarbonPrices && carbonPricesByYear && carbonPricesByYear.length >= year) {
      return carbonPricesByYear[year - 1].price;
    }
    return carbonCreditPrice;
  };

  // Calculate implementation cost per head based on interventions
  let implementationCostPerHead = selectedAnimalType.cost;
  
  // Add costs for supplementation (reproductive improvement)
  implementationCostPerHead += selectedSupplementationType.cost;
  
  // Add costs for feed type
  implementationCostPerHead += selectedFeed.cost;
  
  // Add costs for manure management
  implementationCostPerHead += selectedManure.cost;
  
  // Add costs for grazing practices
  implementationCostPerHead += selectedGrazing.cost;
  
  // Add costs for seasonal feed management if applicable
  if (selectedSeasonalPattern.seasonalVariation) {
    implementationCostPerHead *= selectedSeasonalPattern.costFactor;
  }
  
  // Add costs for emission reduction additives if used
  if (useEmissionReductionAdditives) {
    implementationCostPerHead += additiveEfficiency / 2; // Cost scales with efficiency
  }
  
  // Initial implementation cost
  const initialImplementationCost = herdSize * implementationCostPerHead;
  
  // Annual maintenance cost
  const annualMaintenanceCost = herdSize * (implementationCostPerHead * 0.2); // 20% of implementation cost
  // Calculate production metrics and benefits
  const calculateProductionBenefits = () => {
    // Calculate calves born per year - before and after
    const calvesBeforeIntervention = herdSize * (baseCalvingRate / 100);
    const calvesAfterIntervention = herdSize * (improvedCalvingRate / 100);
    const additionalCalvesPerYear = calvesAfterIntervention - calvesBeforeIntervention;
    
    // Calculate value of additional production
    const averageCalfValue = animalType === 'cattle' ? 500 : 600; // Assumed market value
    const annualProductionBenefit = additionalCalvesPerYear * averageCalfValue;
    
    // Calculate time-to-market benefit from reduced calving interval
    const marketCyclesBeforeIntervention = 12 / timeToCalfBeforeValue;
    const marketCyclesAfterIntervention = 12 / timeToCalfAfterValue;
    const additionalMarketCycles = marketCyclesAfterIntervention - marketCyclesBeforeIntervention;
    const timeToMarketBenefit = additionalMarketCycles * calvesAfterIntervention * averageCalfValue;
    
    return {
      calvesBeforeIntervention,
      calvesAfterIntervention,
      additionalCalvesPerYear,
      annualProductionBenefit,
      timeToMarketBenefit,
      totalProductionBenefits: annualProductionBenefit + timeToMarketBenefit
    };
  };
  
  const productionBenefits = calculateProductionBenefits();
  // Calculate yearly results
  const yearlyData = [];
  let totalRevenue = 0;
  let totalCost = 0;
  let totalProductionBenefits = 0;
  let netPresentValue = 0;
  let cumulativeNetCashFlow = 0;
  let breakEvenYear = 'N/A';
  
  // Prepare yearly data for calculations
  for (let year = 1; year <= projectYears; year++) {
    // Carbon credit revenue - based on emission reductions
    const carbonPrice = getCarbonPrice(year);
    const yearlyEmissionsRevenue = annualEmissionsReduction * carbonPrice;
    
    // Production benefits
    const yearlyProductionBenefit = productionBenefits.totalProductionBenefits;
    totalProductionBenefits += yearlyProductionBenefit;
    
    // Total revenue
    const yearlyRevenue = yearlyEmissionsRevenue + yearlyProductionBenefit;
    
    // Implementation and maintenance costs
    let yearlyImplementationCost = 0;
    if (year === 1) {
      yearlyImplementationCost = initialImplementationCost;
    }
    
    // Annual maintenance
    const yearlyMaintenanceCost = annualMaintenanceCost;
    
    // Additional costs from the costs array
    const additionalCosts = costs
      .filter(cost => {
        if (cost.type === 'fixed' && cost.year === year) return true;
        if (cost.type === 'annual') return true;
        if (cost.type === 'per_head' && cost.year === year) return true;
        if (cost.type === 'annual_per_head') return true;
        return false;
      })
      .reduce((sum, cost) => {
        if (cost.type === 'per_head' || cost.type === 'annual_per_head') {
          return sum + (cost.value * herdSize);
        }
        return sum + cost.value;
      }, 0);
    
    // Reproductive improvement specific costs
    let yearlyReproductiveCosts = 0;
    if (reproductiveImprovementCosts && supplementationType !== 'none') {
      if (reproductiveImprovementCosts.type === 'annual') {
        yearlyReproductiveCosts = reproductiveImprovementCosts.value;
      } else if (reproductiveImprovementCosts.type === 'annual_per_head') {
        yearlyReproductiveCosts = reproductiveImprovementCosts.value * herdSize;
      } else if (reproductiveImprovementCosts.type === 'fixed' && year === 1) {
        yearlyReproductiveCosts = reproductiveImprovementCosts.value;
      }
    }
    
    // Total costs for the year
    const yearlyCost = yearlyImplementationCost + yearlyMaintenanceCost + additionalCosts + yearlyReproductiveCosts;
    
    // Net cash flow
    const yearlyNetCashFlow = yearlyRevenue - yearlyCost;
    cumulativeNetCashFlow += yearlyNetCashFlow;
    
    // Present value
    const presentValue = yearlyNetCashFlow / Math.pow(1 + (discountRate / 100), year - 1);
    netPresentValue += presentValue;
    
    // Track break-even
    if (breakEvenYear === 'N/A' && cumulativeNetCashFlow >= 0) {
      breakEvenYear = year;
    }
    
    // Update totals
    totalRevenue += yearlyRevenue;
    totalCost += yearlyCost;
    // Calculate emissions data for visualization
    const baselineEmissionsForYear = (herdSize * baselineEmissionsRate); // kg CO2e
    const adjustedEmissionsForYear = (herdSize * adjustedEmissionsRate); // kg CO2e
    const emissionsReductionForYear = baselineEmissionsForYear - adjustedEmissionsForYear; // kg CO2e
    
    // Add yearly data with emissions information
    yearlyData.push({
      year,
      emissionsRevenue: yearlyEmissionsRevenue,
      productionBenefit: yearlyProductionBenefit,
      totalRevenue: yearlyRevenue,
      costs: yearlyCost,
      netCashFlow: yearlyNetCashFlow,
      cumulativeNetCashFlow,
      presentValue,
      cumulativeNPV: netPresentValue,
      sequestration: annualEmissionsReduction, // tonnes CO2e
      carbonPrice,
      calvesProduced: year === 1 ? productionBenefits.calvesAfterIntervention : 
                   (productionBenefits.calvesAfterIntervention * (1 + 0.02 * (year - 1))), // 2% annual improvement
      
      // Add these new emissions data points
      baselineEmissions: baselineEmissionsForYear, // kg CO2e
      adjustedEmissions: adjustedEmissionsForYear, // kg CO2e
      emissionsReduction: emissionsReductionForYear, // kg CO2e
      emissionsReductionPercent: (emissionsReductionForYear / baselineEmissionsForYear) * 100
    });
  }
  // Calculate IRR and ROI
  let irr = null;
  try {
    for (let rate = 0; rate < 100; rate += 0.1) {
      const testRate = rate / 100;
      let npv = 0;
      
      for (let year = 1; year <= projectYears; year++) {
        const yearData = yearlyData[year - 1];
        npv += yearData.netCashFlow / Math.pow(1 + testRate, year - 1);
      }
      
      if (npv <= 0) {
        irr = rate - 0.1;
        break;
      }
    }
  } catch (error) {
    irr = null;
  }
  
  // Calculate ROI
  const roi = (totalRevenue - totalCost) / totalCost * 100;
  
  // Format cash flow data properly for the chart component
  const cashFlowData = yearlyData.map(year => ({
    name: `Year ${year.year}`,
    'Carbon Credits': year.emissionsRevenue,
    'Production Benefits': year.productionBenefit,
    'Costs': -year.costs,
    'Net Cash Flow': year.netCashFlow,
    
    // Fields needed for CashFlowChart component
    year: `Year ${year.year}`,
    cashflow: year.netCashFlow,
    cumulative: year.cumulativeNetCashFlow,
    isPositive: year.netCashFlow >= 0
  }));
  
  // Format NPV data properly for the chart component
  const npvData = yearlyData.map(year => ({
    name: `Year ${year.year}`,
    'Present Value': year.presentValue,
    'Cumulative NPV': year.cumulativeNPV,
    
    // Fields needed for NPVChart component
    year: `Year ${year.year}`,
    discountedCashFlow: year.presentValue,
    cumulativeNpv: year.cumulativeNPV
  }));
  
  // Prepare reproductive performance chart data
  const reproductiveData = yearlyData.map(year => ({
    name: `Year ${year.year}`,
    'Calves Produced': year.calvesProduced,
    'Baseline Production': productionBenefits.calvesBeforeIntervention
  }));
  // Prepare cost breakdown data
  const implementationCosts = initialImplementationCost;
  const maintenanceCosts = annualMaintenanceCost * projectYears;
  const additionalProjectCosts = totalCost - implementationCosts - maintenanceCosts;
  
  const costBreakdownData = [
    { name: 'Implementation', value: implementationCosts },
    { name: 'Maintenance', value: maintenanceCosts },
    { name: 'Other Costs', value: additionalProjectCosts }
  ];
  
  // Prepare revenue breakdown data
  const revenueBreakdownData = [
    { name: 'Carbon Credits', value: totalRevenue - totalProductionBenefits },
    { name: 'Production Benefits', value: totalProductionBenefits }
  ];
  
  // Return results object with emissions data and properly formatted chart data
  return {
    // Using emission reductions as sequestration
    totalSequestration: annualEmissionsReduction * projectYears,
    totalRevenue,
    totalCost,
    totalProductionBenefits,
    netProfit: totalRevenue - totalCost,
    npv: netPresentValue,
    irr,
    roi,
    breakEvenYear,
    yearlyData,
    productionBenefits,
    
    // Include reproductive metrics
    reproductiveMetrics: {
      baseCalvingRate,
      improvedCalvingRate,
      calvingRateImprovement: improvedCalvingRate - baseCalvingRate,
      timeToCalfBefore: timeToCalfBeforeValue,
      timeToCalfAfter: timeToCalfAfterValue,
      timeToCalfImprovement: timeToCalfBeforeValue - timeToCalfAfterValue
    },
    
    // Include emissions metrics
    emissionsMetrics: {
      baselineEmissionsRate,
      adjustedEmissionsRate,
      emissionsReductionPercent: ((baselineEmissionsRate - adjustedEmissionsRate) / baselineEmissionsRate) * 100,
      annualEmissionsReduction
    },
    
    // Include chart data
    chartData: {
      cashFlowData,
      npvData,
      reproductiveData,
      costBreakdownData,
      revenueBreakdownData,
      
      // Include emissions intensity for the chart
      emissionsIntensity: {
        baseline: baselineEmissionsRate,
        reduced: adjustedEmissionsRate,
        percentReduction: ((baselineEmissionsRate - adjustedEmissionsRate) / baselineEmissionsRate) * 100
      }
    },
    
    // Include diagnostics to help debug
    diagnostics: {
      baselineEmissionsRate,
      adjustedEmissionsRate,
      baselineAnnualEmissions,
      adjustedAnnualEmissions,
      annualEmissionsReduction,
      herdSize,
      reproductiveEfficiencyFactor
    }
  };
};
