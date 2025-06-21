/**
 * LivestockEnergyCalculator.js
 * 
 * Specialized utility for calculating energy requirements, methane emissions,
 * and related factors for both cattle and buffalo based on IPCC methodologies
 * and scientific literature.
 */

// Constants for energy calculations
const ENERGY_CONSTANTS = {
  // Maintenance energy requirements (MJ/kg^0.75/day)
  MAINTENANCE: {
    CATTLE: {
      DAIRY: 0.386,
      BEEF: 0.322
    },
    BUFFALO: {
      WATER: 0.426,
      SWAMP: 0.364
    }
  },
  
  // Growth energy requirements (MJ/kg gain)
  GROWTH: {
    CATTLE: 25.0,
    BUFFALO: 28.5
  },
  
  // Lactation energy (MJ/kg milk)
  LACTATION: {
    CATTLE: {
      DAIRY: 5.0,
      BEEF: 5.5
    },
    BUFFALO: 6.4
  },
  
  // Pregnancy energy (MJ/day in last trimester)
  PREGNANCY: {
    CATTLE: 12.0,
    BUFFALO: 14.0
  },
  
  // Methane conversion factors (Ym, %)
  YM: {
    CATTLE: {
      HIGH_FORAGE: 6.5,
      MIXED: 6.0,
      HIGH_GRAIN: 3.0
    },
    BUFFALO: {
      HIGH_FORAGE: 7.0,
      MIXED: 6.5,
      HIGH_GRAIN: 4.0
    }
  },
  
  // Energy content of methane (MJ/kg CH4)
  METHANE_ENERGY: 55.65,
  
  // GWP of methane (CO2e, 100-year)
  METHANE_GWP: 28
};

/**
 * Calculate daily gross energy intake for an animal
 * 
 * @param {Object} params - Input parameters
 * @param {string} params.animalType - 'cattle' or 'buffalo'
 * @param {string} params.animalCategory - Specific category (e.g., 'dairy', 'beef', 'water', 'swamp')
 * @param {number} params.bodyWeight - Body weight in kg
 * @param {number} params.weightGain - Daily weight gain in kg/day (0 if maintaining)
 * @param {number} params.milkProduction - Daily milk production in kg/day (0 if not lactating)
 * @param {number} params.milkFatPercent - Fat percentage in milk (default 4.0% for cattle, 7.0% for buffalo)
 * @param {boolean} params.isPregnant - Whether the animal is in last trimester of pregnancy
 * @param {Object} params.dietInfo - Information about the diet
 * @param {number} params.dietInfo.digestibility - Diet digestibility as decimal (e.g., 0.65 for 65%)
 * @param {string} params.dietInfo.type - 'high_forage', 'mixed', or 'high_grain'
 * @returns {Object} - Energy requirements and related values
 */
export const calculateAnimalEnergy = ({
  animalType,
  animalCategory,
  bodyWeight,
  weightGain = 0,
  milkProduction = 0,
  milkFatPercent = null,
  isPregnant = false,
  activityFactor = 1.0,
  dietInfo = { digestibility: 0.65, type: 'mixed' }
}) => {
  // Set defaults if not provided
  if (milkFatPercent === null) {
    milkFatPercent = animalType === 'buffalo' ? 7.0 : 4.0;
  }
  
  // Convert animalType and category to uppercase for matching constants
  const TYPE = animalType.toUpperCase();
  const CATEGORY = animalCategory.toUpperCase();
  const DIET_TYPE = dietInfo.type.toUpperCase();
  
  // Calculate maintenance energy (NEm)
  let maintenanceEnergy;
  if (TYPE === 'CATTLE') {
    maintenanceEnergy = ENERGY_CONSTANTS.MAINTENANCE.CATTLE[CATEGORY] * Math.pow(bodyWeight, 0.75);
  } else { // buffalo
    maintenanceEnergy = ENERGY_CONSTANTS.MAINTENANCE.BUFFALO[CATEGORY] * Math.pow(bodyWeight, 0.75);
  }
  
  // Apply activity factor (e.g., grazing vs. confined)
  maintenanceEnergy *= activityFactor;
  
  // Calculate growth energy (NEg) if animal is growing
  let growthEnergy = 0;
  if (weightGain > 0) {
    growthEnergy = weightGain * (TYPE === 'CATTLE' ? 
                               ENERGY_CONSTANTS.GROWTH.CATTLE : 
                               ENERGY_CONSTANTS.GROWTH.BUFFALO);
  }
  
  // Calculate lactation energy (NEl) if animal is producing milk
  let lactationEnergy = 0;
  if (milkProduction > 0) {
    // Adjust for fat content (base formula assumes 4% for cattle, 7% for buffalo)
    const fatAdjustment = TYPE === 'CATTLE' ? 
                        (0.0384 + 0.0223 * milkFatPercent) / 0.1276 : 
                        (0.0466 + 0.0279 * milkFatPercent) / 0.2419;
    
    if (TYPE === 'CATTLE') {
      lactationEnergy = milkProduction * ENERGY_CONSTANTS.LACTATION.CATTLE[CATEGORY] * fatAdjustment;
    } else { // buffalo
      lactationEnergy = milkProduction * ENERGY_CONSTANTS.LACTATION.BUFFALO * fatAdjustment;
    }
  }
  
  // Calculate pregnancy energy (NEp) if applicable
  let pregnancyEnergy = 0;
  if (isPregnant) {
    pregnancyEnergy = TYPE === 'CATTLE' ? 
                     ENERGY_CONSTANTS.PREGNANCY.CATTLE : 
                     ENERGY_CONSTANTS.PREGNANCY.BUFFALO;
  }
  
  // Sum up all net energy requirements
  const totalNetEnergy = maintenanceEnergy + growthEnergy + lactationEnergy + pregnancyEnergy;
  
  // Convert net energy to gross energy based on diet digestibility
  // Using IPCC Tier 2 conversion factors
  const REM = 1.123 - (4.092 * Math.pow(10, -3) * dietInfo.digestibility * 100) + 
            (1.126 * Math.pow(10, -5) * Math.pow(dietInfo.digestibility * 100, 2)) - 
            (25.4 / (dietInfo.digestibility * 100));
  
  const REG = 1.164 - (5.160 * Math.pow(10, -3) * dietInfo.digestibility * 100) + 
            (1.308 * Math.pow(10, -5) * Math.pow(dietInfo.digestibility * 100, 2)) - 
            (37.4 / (dietInfo.digestibility * 100));
  
  // Convert individual components to gross energy
  const GEm = maintenanceEnergy / REM;
  const GEg = growthEnergy / REG;
  const GEl = lactationEnergy / 0.65; // Standard conversion for lactation
  const GEp = pregnancyEnergy / 0.13; // Standard conversion for pregnancy
  
  // Total gross energy intake (GE)
  const grossEnergyIntake = GEm + GEg + GEl + GEp;
  
  // Calculate methane emissions using Ym (methane conversion factor)
  const Ym = ENERGY_CONSTANTS.YM[TYPE][DIET_TYPE.replace('HIGH_', '')];
  
  // Methane production (kg CH4/day)
  const methaneDailyProduction = (grossEnergyIntake * (Ym / 100)) / ENERGY_CONSTANTS.METHANE_ENERGY;
  
  // Annual methane emissions (kg CH4/year)
  const methaneAnnualEmissions = methaneDailyProduction * 365;
  
  // Convert to CO2 equivalent (kg CO2e/year)
  const methaneAnnualCO2e = methaneAnnualEmissions * ENERGY_CONSTANTS.METHANE_GWP;
  
  // Calculate feed requirements based on diet energy density (MJ/kg DM)
  const dietEnergyDensity = 18.45 * dietInfo.digestibility; // Approximate based on digestibility
  const dailyFeedIntake = grossEnergyIntake / dietEnergyDensity;
  
  // Feed conversion ratio (for growing animals)
  let feedConversionRatio = null;
  if (weightGain > 0) {
    feedConversionRatio = dailyFeedIntake / weightGain;
  }
  
  // Return comprehensive results
  return {
    // Energy requirements
    maintenanceEnergy: parseFloat(maintenanceEnergy.toFixed(1)),
    growthEnergy: parseFloat(growthEnergy.toFixed(1)),
    lactationEnergy: parseFloat(lactationEnergy.toFixed(1)),
    pregnancyEnergy: parseFloat(pregnancyEnergy.toFixed(1)),
    totalNetEnergy: parseFloat(totalNetEnergy.toFixed(1)),
    grossEnergyIntake: parseFloat(grossEnergyIntake.toFixed(1)),
    
    // Methane emissions
    methaneConversionFactor: Ym,
    methaneDailyProduction: parseFloat(methaneDailyProduction.toFixed(3)),
    methaneAnnualEmissions: parseFloat(methaneAnnualEmissions.toFixed(1)),
    methaneAnnualCO2e: parseFloat(methaneAnnualCO2e.toFixed(1)),
    
    // Feed metrics
    dietEnergyDensity: parseFloat(dietEnergyDensity.toFixed(1)),
    dailyFeedIntake: parseFloat(dailyFeedIntake.toFixed(1)),
    feedConversionRatio: feedConversionRatio !== null ? parseFloat(feedConversionRatio.toFixed(2)) : null,
    
    // Efficiency metrics
    energyEfficiency: parseFloat((totalNetEnergy / grossEnergyIntake * 100).toFixed(1)),
    methaneEnergyLoss: parseFloat((methaneDailyProduction * ENERGY_CONSTANTS.METHANE_ENERGY / grossEnergyIntake * 100).toFixed(1))
  };
};

/**
 * Calculate how dietary changes affect reproductive performance
 * 
 * @param {Object} params - Input parameters
 * @param {string} params.animalType - 'cattle' or 'buffalo'
 * @param {string} params.animalCategory - Specific category
 * @param {number} params.currentCalvingRate - Current calving rate as percentage
 * @param {number} params.currentTimeToCalf - Current time to calf in months
 * @param {Object} params.baselineDiet - Baseline diet information
 * @param {Object} params.improvedDiet - Improved diet information
 * @param {string} params.supplementType - Type of supplementation
 * @returns {Object} - Projected reproductive improvements
 */
export const calculateReproductiveImpact = ({
  animalType,
  animalCategory,
  currentCalvingRate,
  currentTimeToCalf,
  baselineDiet = { 
    energyBalance: 0, // Energy balance in MJ/day (0 = maintenance)
    proteinPercent: 10 // Crude protein percentage
  },
  improvedDiet = {
    energyBalance: 10, // Energy balance in MJ/day (positive = above maintenance)
    proteinPercent: 14 // Crude protein percentage
  },
  supplementType = 'mineral' // 'none', 'mineral', 'protein', 'energy', 'complete'
}) => {
  // Base improvement factors by supplement type
  const supplementImpacts = {
    'none': { calvingRate: 0, timeToCalf: 0 },
    'mineral': { calvingRate: 5, timeToCalf: 0.5 },
    'protein': { calvingRate: 8, timeToCalf: 1.0 },
    'energy': { calvingRate: 7, timeToCalf: 0.8 },
    'complete': { calvingRate: 12, timeToCalf: 1.5 }
  };
  
  // Additional factors based on energy balance improvement
  const energyBalanceEffect = Math.max(0, improvedDiet.energyBalance - baselineDiet.energyBalance);
  let energyImpact = 0;
  
  if (energyBalanceEffect > 0) {
    // Diminishing returns on energy impact
    energyImpact = Math.min(10, 2 * Math.sqrt(energyBalanceEffect));
  }
  
  // Additional factors based on protein improvement
  const proteinEffect = Math.max(0, improvedDiet.proteinPercent - baselineDiet.proteinPercent);
  let proteinImpact = 0;
  
  if (proteinEffect > 0) {
    // Linear impact up to a point, then diminishing returns
    if (proteinEffect <= 4) {
      proteinImpact = proteinEffect * 1.5;
    } else {
      proteinImpact = 6 + (proteinEffect - 4) * 0.5;
    }
  }
  
  // Animal-specific factors (buffalo respond differently than cattle)
  const animalFactor = animalType === 'buffalo' ? 0.85 : 1.0;
  
  // Base impacts from supplementation
  let baseCalvingRateImprovement = supplementImpacts[supplementType]?.calvingRate || 0;
  let baseTimeToCalfImprovement = supplementImpacts[supplementType]?.timeToCalf || 0;
  
  // Total calving rate improvement (percentage points)
  const calvingRateImprovement = (baseCalvingRateImprovement + (energyImpact * 0.5) + proteinImpact) * animalFactor;
  
  // Projected improved calving rate (capped at 95% for biological realism)
  const projectedCalvingRate = Math.min(95, currentCalvingRate + calvingRateImprovement);
  
  // Total time to calf improvement (months)
  const timeToCalfImprovement = (baseTimeToCalfImprovement + (energyImpact * 0.1) + (proteinImpact * 0.05)) * animalFactor;
  
  // Projected improved time to calf (with biological minimum)
  const biologicalMinimum = animalType === 'buffalo' ? 13 : 11.5;
  const projectedTimeToCalf = Math.max(biologicalMinimum, currentTimeToCalf - timeToCalfImprovement);
  
  // Project the economic impact over time
  const projectedPerformanceByYear = [];
  
  // Maximum possible improvement over baseline
  const maxCalvingRateImprovement = Math.min(95, currentCalvingRate + calvingRateImprovement * 1.5) - currentCalvingRate;
  const maxTimeReduction = Math.min(currentTimeToCalf - biologicalMinimum, timeToCalfImprovement * 1.5);
  
  for (let year = 1; year <= 10; year++) {
    // Assume gradual adoption/benefits with diminishing returns
    const adoptionFactor = 1 - Math.exp(-0.3 * year);
    
    const yearlyCalvingRate = currentCalvingRate + (maxCalvingRateImprovement * adoptionFactor);
    const yearlyTimeToCalf = currentTimeToCalf - (maxTimeReduction * adoptionFactor);
    
    // More calves produced
    const calvesPerHundredFemales = yearlyCalvingRate;
    
    // More frequent calving
    const calvingsPerFemalePerYear = 12 / yearlyTimeToCalf;
    
    projectedPerformanceByYear.push({
      year,
      calvingRate: parseFloat(yearlyCalvingRate.toFixed(1)),
      timeToCalf: parseFloat(yearlyTimeToCalf.toFixed(1)),
      calvesPerHundredFemales: parseFloat(calvesPerHundredFemales.toFixed(1)),
      calvingsPerFemalePerYear: parseFloat(calvingsPerFemalePerYear.toFixed(2))
    });
  }
  
  return {
    // Current values
    currentCalvingRate,
    currentTimeToCalf,
    
    // Improvements
    calvingRateImprovement: parseFloat(calvingRateImprovement.toFixed(1)),
    timeToCalfImprovement: parseFloat(timeToCalfImprovement.toFixed(1)),
    
    // Projected values
    projectedCalvingRate,
    projectedTimeToCalf,
    
    // Contributing factors
    supplementEffect: parseFloat((baseCalvingRateImprovement * animalFactor).toFixed(1)),
    energyEffect: parseFloat((energyImpact * 0.5 * animalFactor).toFixed(1)),
    proteinEffect: parseFloat((proteinImpact * animalFactor).toFixed(1)),
    
    // Yearly projections
    projectedPerformanceByYear,
    
    // Summary metrics
    totalProductionIncrease: parseFloat(((projectedCalvingRate / currentCalvingRate - 1) * 100).toFixed(1)),
    timeSaved: parseFloat((currentTimeToCalf - projectedTimeToCalf).toFixed(1))
  };
};

/**
 * Calculate emissions from different sources for livestock
 * 
 * @param {Object} params - Input parameters
 * @param {string} params.animalType - 'cattle' or 'buffalo'
 * @param {Object} params.entericMetrics - Enteric methane metrics from calculateAnimalEnergy
 * @param {string} params.manureSystem - Manure management system
 * @param {Object} params.animalDetails - Additional animal details
 * @returns {Object} - Total emissions from all sources
 */
export const calculateTotalEmissions = ({
  animalType,
  entericMetrics,
  manureSystem = 'dry_lot',
  animalDetails = {
    bodyWeight: 500,
    productionSystem: 'grazing'
  }
}) => {
  // Emission factors for manure management (kg CH4/head/year)
  const manureEmissionFactors = {
    'cattle': {
      'liquid_slurry': 50,
      'solid_storage': 4,
      'dry_lot': 1.5,
      'pasture': 1.0,
      'daily_spread': 0.5,
      'anaerobic_digestion': 0.5
    },
    'buffalo': {
      'liquid_slurry': 55,
      'solid_storage': 5,
      'dry_lot': 2.0,
      'pasture': 1.5,
      'daily_spread': 0.8,
      'anaerobic_digestion': 0.5
    }
  };
  
  // N2O emission factors (kg N2O-N/kg N excreted)
  const n2oEmissionFactors = {
    'liquid_slurry': 0.001,
    'solid_storage': 0.02,
    'dry_lot': 0.02,
    'pasture': 0.01,
    'daily_spread': 0.005,
    'anaerobic_digestion': 0.001
  };
  
  // N excretion rates (kg N/1000kg animal mass/day)
  const nExcretionRates = {
    'cattle': 0.35,
    'buffalo': 0.32
  };
  
  // Get enteric methane emissions from the provided metrics
  const entericCH4Annual = entericMetrics.methaneAnnualEmissions;
  const entericCO2e = entericMetrics.methaneAnnualCO2e;
  
  // Calculate manure methane emissions
  const manureCH4Factor = manureEmissionFactors[animalType][manureSystem] || manureEmissionFactors[animalType]['dry_lot'];
  const manureCH4Annual = manureCH4Factor * (animalDetails.bodyWeight / 500); // Scale by animal weight
  const manureCH4CO2e = manureCH4Annual * ENERGY_CONSTANTS.METHANE_GWP;
  
  // Calculate N2O emissions from manure
  const nExcretionRate = nExcretionRates[animalType];
  const nExcretionAnnual = nExcretionRate * animalDetails.bodyWeight * 365 / 1000;
  const n2oEmissionFactor = n2oEmissionFactors[manureSystem] || n2oEmissionFactors['dry_lot'];
  
  // N2O emissions (kg N2O/year)
  const n2oAnnual = nExcretionAnnual * n2oEmissionFactor * 44/28; // Convert N2O-N to N2O
  
  // Convert N2O to CO2e (GWP of N2O = 265)
  const n2oCO2e = n2oAnnual * 265;
  
  // Feed production emissions (simplified estimate)
  // This varies greatly based on feed type, origin, processing, etc.
  let feedEmissionsFactor;
  
  if (animalDetails.productionSystem === 'grazing') {
    feedEmissionsFactor = 0.5; // kg CO2e/kg dry matter
  } else if (animalDetails.productionSystem === 'mixed') {
    feedEmissionsFactor = 0.8;
  } else { // intensive
    feedEmissionsFactor = 1.2;
  }
  
  const feedCO2e = entericMetrics.dailyFeedIntake * 365 * feedEmissionsFactor;
  
  // Total emissions (kg CO2e/year)
  const totalCO2e = entericCO2e + manureCH4CO2e + n2oCO2e + feedCO2e;
  
  // Compile emissions by source
  const emissionsBySource = {
    enteric: parseFloat(entericCO2e.toFixed(1)),
    manure_ch4: parseFloat(manureCH4CO2e.toFixed(1)),
    manure_n2o: parseFloat(n2oCO2e.toFixed(1)),
    feed_production: parseFloat(feedCO2e.toFixed(1))
  };
  
  // Calculate percentages
  const totalForPercent = Object.values(emissionsBySource).reduce((sum, val) => sum + val, 0);
  
  const emissionsPercentages = {};
  for (const [key, value] of Object.entries(emissionsBySource)) {
    emissionsPercentages[key] = parseFloat((value / totalForPercent * 100).toFixed(1));
  }
  
  return {
    totalAnnualEmissions: parseFloat(totalCO2e.toFixed(1)),
    emissionsBySource,
    emissionsPercentages,
    
    // Detailed metrics
    entericMethane: {
      annualCH4: parseFloat(entericCH4Annual.toFixed(1)),
      co2e: parseFloat(entericCO2e.toFixed(1))
    },
    manureMethane: {
      annualCH4: parseFloat(manureCH4Annual.toFixed(1)),
      co2e: parseFloat(manureCH4CO2e.toFixed(1))
    },
    manureN2O: {
      annualN2O: parseFloat(n2oAnnual.toFixed(2)),
      co2e: parseFloat(n2oCO2e.toFixed(1))
    },
    feedEmissions: {
      co2e: parseFloat(feedCO2e.toFixed(1)),
      feedIntake: parseFloat((entericMetrics.dailyFeedIntake * 365).toFixed(0))
    },
    
    // Emissions intensity (kg CO2e/kg body weight)
    emissionsIntensity: parseFloat((totalCO2e / animalDetails.bodyWeight).toFixed(2)),
    
    // Source of calculation
    calculationMethod: 'IPCC Tier 2 with modifications'
  };
};