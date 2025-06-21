/**
 * BuffaloEmissionsCalculator.js
 * 
 * Specialized calculator for buffalo emissions and performance metrics
 * that accounts for the specific physiological differences between
 * buffalo and cattle in emission patterns, reproductive performance,
 * and dietary requirements.
 */

import { calculateAnimalEnergy, calculateReproductiveImpact, calculateTotalEmissions } from './LivestockEnergyCalculator';

/**
 * Buffalo-specific emission factors and constants
 */
const BUFFALO_CONSTANTS = {
  // Types of buffalo and their characteristics
  TYPES: {
    WATER_BUFFALO: {
      // River/water buffalo (Bubalus bubalis) - dairy type
      baseWeight: {
        MALE: 800,
        FEMALE: 650
      },
      milkProduction: {
        AVERAGE: 1800, // kg/lactation
        HIGH: 2500     // kg/lactation
      },
      reproductiveMetrics: {
        AGE_AT_FIRST_CALVING: 36, // months
        CALVING_INTERVAL: 15,     // months
        CALVING_RATE: 70,         // percent
        GESTATION_LENGTH: 310     // days
      }
    },
    SWAMP_BUFFALO: {
      // Swamp buffalo - draft/meat type
      baseWeight: {
        MALE: 650,
        FEMALE: 550
      },
      milkProduction: {
        AVERAGE: 600,  // kg/lactation
        HIGH: 1000     // kg/lactation
      },
      reproductiveMetrics: {
        AGE_AT_FIRST_CALVING: 42, // months
        CALVING_INTERVAL: 18,     // months
        CALVING_RATE: 60,         // percent
        GESTATION_LENGTH: 315     // days
      }
    }
  },
  
  // Buffalo-specific emission factors compared to cattle
  EMISSION_ADJUSTMENT: {
    ENTERIC_METHANE: 1.15,    // 15% higher than equivalent cattle
    MANURE_METHANE: 1.10,     // 10% higher than equivalent cattle
    MANURE_N2O: 0.95          // 5% lower than equivalent cattle
  },
  
  // Feed efficiency factors
  FEED_EFFICIENCY: {
    ROUGHAGE_UTILIZATION: 1.15, // Buffalo can utilize poor quality roughage better than cattle
    CONCENTRATE_RESPONSE: 0.9   // Buffalo respond less to concentrate supplementation than cattle
  },
  
  // Unique buffalo physiological factors
  PHYSIOLOGY: {
    WATER_REQUIREMENT: 0.8,     // 20% less water requirement than cattle
    HEAT_TOLERANCE: 1.2,        // 20% better heat tolerance than cattle
    DISEASE_RESISTANCE: 1.3     // 30% better disease resistance than cattle
  }
};

/**
 * Calculate buffalo-specific emissions and performance metrics
 * 
 * @param {Object} params - Input parameters
 * @param {string} params.buffaloType - 'water_buffalo' or 'swamp_buffalo'
 * @param {string} params.gender - 'male' or 'female'
 * @param {number} params.bodyWeight - Weight in kg
 * @param {number} params.age - Age in months
 * @param {string} params.productionSystem - 'traditional', 'semi_intensive', 'intensive'
 * @param {Object} params.dietInfo - Diet information
 * @param {Object} params.reproductiveInfo - Reproductive information
 * @param {Object} params.manureSystem - Manure management system
 * @returns {Object} - Comprehensive buffalo metrics
 */
export const calculateBuffaloMetrics = ({
  buffaloType = 'water_buffalo',
  gender = 'female',
  bodyWeight,
  age = 48,
  productionSystem = 'traditional',
  milkProduction = 0,
  isPregnant = false,
  isLactating = false,
  dietInfo = {
    digestibility: 0.60,
    type: 'high_forage',
    crudeProtein: 10
  },
  reproductiveInfo = {
    calvingRate: null, // Will use default if null
    timeToCalf: null,  // Will use default if null
    ageAtFirstCalving: null
  },
  manureSystem = 'dry_lot'
}) => {
  // Get buffalo type constants (defaulting to water buffalo if not found)
  const buffaloTypeUpper = buffaloType.toUpperCase();
  const typeInfo = BUFFALO_CONSTANTS.TYPES[buffaloTypeUpper] || BUFFALO_CONSTANTS.TYPES.WATER_BUFFALO;
  
  // Set default body weight if not provided
  if (!bodyWeight) {
    bodyWeight = gender.toUpperCase() === 'MALE' ? 
                typeInfo.baseWeight.MALE : 
                typeInfo.baseWeight.FEMALE;
  }
  
  // Set reproductive defaults if not provided
  if (reproductiveInfo.calvingRate === null) {
    reproductiveInfo.calvingRate = typeInfo.reproductiveMetrics.CALVING_RATE;
  }
  
  if (reproductiveInfo.timeToCalf === null) {
    reproductiveInfo.timeToCalf = typeInfo.reproductiveMetrics.CALVING_INTERVAL;
  }
  
  if (reproductiveInfo.ageAtFirstCalving === null) {
    reproductiveInfo.ageAtFirstCalving = typeInfo.reproductiveMetrics.AGE_AT_FIRST_CALVING;
  }
  
  // Determine buffalo category for energy calculations
  const buffaloCategory = buffaloTypeUpper === 'WATER_BUFFALO' ? 'WATER' : 'SWAMP';
  
  // Determine milk production if animal is lactating
  let milkProductionValue = milkProduction;
  if (isLactating && milkProductionValue === 0) {
    milkProductionValue = typeInfo.milkProduction.AVERAGE / 305; // Convert lactation yield to daily
  }
  
  // Calculate daily weight gain based on age and production system
  let weightGain = 0;
  if (age < 24) {
    // Growing buffalo
    switch (productionSystem) {
      case 'intensive':
        weightGain = 0.7;
        break;
      case 'semi_intensive':
        weightGain = 0.5;
        break;
      default: // traditional
        weightGain = 0.3;
    }
  } else if (age < 36) {
    // Young adult buffalo
    switch (productionSystem) {
      case 'intensive':
        weightGain = 0.4;
        break;
      case 'semi_intensive':
        weightGain = 0.3;
        break;
      default: // traditional
        weightGain = 0.2;
    }
  } else {
    // Mature buffalo - minimal growth
    weightGain = 0.05;
  }
  
  // Calculate energy requirements and methane emissions
  const energyMetrics = calculateAnimalEnergy({
    animalType: 'buffalo',
    animalCategory: buffaloCategory.toLowerCase(),
    bodyWeight,
    weightGain,
    milkProduction: milkProductionValue,
    milkFatPercent: 7.0, // Default for buffalo
    isPregnant,
    activityFactor: productionSystem === 'traditional' ? 1.2 : 1.0,
    dietInfo: {
      digestibility: dietInfo.digestibility,
      type: dietInfo.type
    }
  });
  
  // Calculate reproductive metrics if female
  let reproductiveMetrics = null;
  if (gender.toLowerCase() === 'female' && age >= reproductiveInfo.ageAtFirstCalving) {
    // Calculate baseline and improved diet effects
    const baselineDiet = {
      energyBalance: 0, // Maintenance
      proteinPercent: dietInfo.crudeProtein
    };
    
    // Improved diet for projection
    const improvedDiet = {
      energyBalance: productionSystem === 'traditional' ? 5 : 10,
      proteinPercent: dietInfo.crudeProtein + 2
    };
    
    // Determine appropriate supplement type based on production system
    let supplementType = 'none';
    switch (productionSystem) {
      case 'intensive':
        supplementType = 'complete';
        break;
      case 'semi_intensive':
        supplementType = 'protein';
        break;
      case 'traditional':
        supplementType = 'mineral';
        break;
    }
    
    reproductiveMetrics = calculateReproductiveImpact({
      animalType: 'buffalo',
      animalCategory: buffaloCategory.toLowerCase(),
      currentCalvingRate: reproductiveInfo.calvingRate,
      currentTimeToCalf: reproductiveInfo.timeToCalf,
      baselineDiet,
      improvedDiet,
      supplementType
    });
  }
  
  // Buffalo-specific production metrics
  const productionMetrics = {
    milkProduction: isLactating ? {
      dailyYield: milkProductionValue,
      lactationYield: milkProductionValue * 305,
      milkFat: 7.0,
      milkProtein: 4.3
    } : null,
    
    meatProduction: gender.toLowerCase() === 'male' || age < reproductiveInfo.ageAtFirstCalving ? {
      dressPercentage: 48, // Lower than cattle
      meatQuality: productionSystem === 'traditional' ? 'Standard' : 'Premium',
      dailyGain: weightGain
    } : null,
    
    draftCapability: buffaloTypeUpper === 'SWAMP_BUFFALO' && gender.toLowerCase() === 'male' && age >= 36 ? {
      workingHoursPerDay: 6,
      drawbarPull: bodyWeight * 0.1, // 10% of body weight
      workOutput: bodyWeight * 0.1 * 3 // Simplified calculation
    } : null
  };
  
  // Calculate total emissions
  const emissionsMetrics = calculateTotalEmissions({
    animalType: 'buffalo',
    entericMetrics: energyMetrics,
    manureSystem,
    animalDetails: {
      bodyWeight,
      productionSystem
    }
  });
  
  // Apply buffalo-specific emission adjustment factors
  emissionsMetrics.emissionsBySource.enteric *= BUFFALO_CONSTANTS.EMISSION_ADJUSTMENT.ENTERIC_METHANE;
  emissionsMetrics.emissionsBySource.manure_ch4 *= BUFFALO_CONSTANTS.EMISSION_ADJUSTMENT.MANURE_METHANE;
  emissionsMetrics.emissionsBySource.manure_n2o *= BUFFALO_CONSTANTS.EMISSION_ADJUSTMENT.MANURE_N2O;
  
  // Recalculate total emissions after adjustments
  emissionsMetrics.totalAnnualEmissions = Object.values(emissionsMetrics.emissionsBySource).reduce((sum, val) => sum + val, 0);
  
  // Calculate emission intensity per unit of product
  let productEmissionIntensity = null;
  
  if (isLactating && productionMetrics.milkProduction) {
    // Emissions per kg milk
    productEmissionIntensity = {
      perKgMilk: parseFloat((emissionsMetrics.totalAnnualEmissions / productionMetrics.milkProduction.lactationYield).toFixed(2)),
      unit: 'kg CO2e/kg milk'
    };
  } else if (productionMetrics.meatProduction) {
    // Emissions per kg meat production (assuming annual weight gain)
    const annualGain = productionMetrics.meatProduction.dailyGain * 365;
    productEmissionIntensity = {
      perKgLiveWeightGain: parseFloat((emissionsMetrics.totalAnnualEmissions / annualGain).toFixed(2)),
      perKgCarcassWeight: parseFloat((emissionsMetrics.totalAnnualEmissions / (annualGain * productionMetrics.meatProduction.dressPercentage / 100)).toFixed(2)),
      unit: 'kg CO2e/kg product'
    };
  }
  
  // Calculate feed conversion ratio and efficiency
  const feedEfficiency = {
    dryMatterIntake: energyMetrics.dailyFeedIntake,
    feedConversionRatio: energyMetrics.feedConversionRatio,
    roughageUtilization: BUFFALO_CONSTANTS.FEED_EFFICIENCY.ROUGHAGE_UTILIZATION,
    concentrateResponse: BUFFALO_CONSTANTS.FEED_EFFICIENCY.CONCENTRATE_RESPONSE,
    // Buffalo-specific efficiency calculation
    dryMatterPerProductUnit: isLactating && productionMetrics.milkProduction ?
      parseFloat((energyMetrics.dailyFeedIntake / milkProductionValue).toFixed(2)) :
      (productionMetrics.meatProduction ?
        parseFloat((energyMetrics.dailyFeedIntake / productionMetrics.meatProduction.dailyGain).toFixed(2)) :
        null)
  };
  
  // Environment adaptability metrics
  const environmentalAdaptation = {
    heatToleranceIndex: BUFFALO_CONSTANTS.PHYSIOLOGY.HEAT_TOLERANCE,
    waterRequirementRatio: BUFFALO_CONSTANTS.PHYSIOLOGY.WATER_REQUIREMENT,
    diseaseResistanceIndex: BUFFALO_CONSTANTS.PHYSIOLOGY.DISEASE_RESISTANCE,
    roughageSuitability: 'High',
    suitableEnvironments: ['Tropical', 'Subtropical', 'Wet', 'Muddy']
  };
  
  // Return comprehensive buffalo metrics
  return {
    basicInfo: {
      buffaloType,
      gender,
      bodyWeight,
      age,
      productionSystem
    },
    energyMetrics,
    emissionsMetrics: {
      ...emissionsMetrics,
      productEmissionIntensity
    },
    reproductiveMetrics,
    productionMetrics,
    feedEfficiency,
    environmentalAdaptation,
    
    // Summary metrics for display
    summary: {
      totalAnnualEmissions: parseFloat(emissionsMetrics.totalAnnualEmissions.toFixed(1)),
      dailyEnergyRequirement: parseFloat(energyMetrics.grossEnergyIntake.toFixed(1)),
      methaneDailyProduction: parseFloat(energyMetrics.methaneDailyProduction.toFixed(3)),
      calvingRateImprovement: reproductiveMetrics ? 
        parseFloat(reproductiveMetrics.calvingRateImprovement.toFixed(1)) : null,
      feedRequirementKg: parseFloat(energyMetrics.dailyFeedIntake.toFixed(1)),
      emissionsComparisonToCattle: parseFloat(((emissionsMetrics.totalAnnualEmissions / (emissionsMetrics.totalAnnualEmissions / BUFFALO_CONSTANTS.EMISSION_ADJUSTMENT.ENTERIC_METHANE) - 1) * 100).toFixed(1))
    }
  };
};

/**
 * Comparative analysis between buffalo and cattle
 * 
 * @param {Object} buffaloParams - Parameters for buffalo calculation
 * @param {Object} cattleParams - Parameters for cattle calculation
 * @returns {Object} - Comparative analysis
 */
export const compareBuffaloToCattle = (buffaloParams, cattleParams) => {
  // Calculate buffalo metrics
  const buffaloMetrics = calculateBuffaloMetrics(buffaloParams);
  
  // For cattle, use the standard livestock calculator
  const cattleEnergy = calculateAnimalEnergy({
    animalType: 'cattle',
    animalCategory: cattleParams.cattleType || 'beef',
    bodyWeight: cattleParams.bodyWeight,
    weightGain: cattleParams.weightGain || 0,
    milkProduction: cattleParams.milkProduction || 0,
    milkFatPercent: cattleParams.milkFatPercent || 4.0,
    isPregnant: cattleParams.isPregnant || false,
    activityFactor: cattleParams.activityFactor || 1.0,
    dietInfo: cattleParams.dietInfo || { digestibility: 0.65, type: 'mixed' }
  });
  
  const cattleEmissions = calculateTotalEmissions({
    animalType: 'cattle',
    entericMetrics: cattleEnergy,
    manureSystem: cattleParams.manureSystem || 'dry_lot',
    animalDetails: {
      bodyWeight: cattleParams.bodyWeight,
      productionSystem: cattleParams.productionSystem || 'mixed'
    }
  });
  
  // Calculate reproductive impact for cattle if applicable
  let cattleReproductive = null;
  if (cattleParams.reproductiveInfo) {
    cattleReproductive = calculateReproductiveImpact({
      animalType: 'cattle',
      animalCategory: cattleParams.cattleType || 'beef',
      currentCalvingRate: cattleParams.reproductiveInfo.calvingRate || 80,
      currentTimeToCalf: cattleParams.reproductiveInfo.timeToCalf || 12,
      baselineDiet: cattleParams.baselineDiet || { energyBalance: 0, proteinPercent: 12 },
      improvedDiet: cattleParams.improvedDiet || { energyBalance: 10, proteinPercent: 16 },
      supplementType: cattleParams.supplementType || 'protein'
    });
  }
  
  // Calculate ratios and differences
  const emissionsRatio = buffaloMetrics.emissionsMetrics.totalAnnualEmissions / cattleEmissions.totalAnnualEmissions;
  const energyRatio = buffaloMetrics.energyMetrics.grossEnergyIntake / cattleEnergy.grossEnergyIntake;
  const methaneRatio = buffaloMetrics.energyMetrics.methaneAnnualEmissions / cattleEnergy.methaneAnnualEmissions;
  const feedEfficiencyRatio = (buffaloMetrics.feedEfficiency.feedConversionRatio || 0) / (cattleEnergy.feedConversionRatio || 1);
  
  // Calculate relative environmental impact
  const environmentalImpactComparison = {
    waterUse: buffaloParams.bodyWeight * BUFFALO_CONSTANTS.PHYSIOLOGY.WATER_REQUIREMENT / 
             (cattleParams.bodyWeight * 1.0),
    landUse: buffaloMetrics.energyMetrics.dailyFeedIntake * 365 / 
            (cattleEnergy.dailyFeedIntake * 365),
    greenhouseGasEmissions: emissionsRatio
  };
  
  return {
    emissionsComparison: {
      buffalo: buffaloMetrics.emissionsMetrics.totalAnnualEmissions,
      cattle: cattleEmissions.totalAnnualEmissions,
      ratio: parseFloat(emissionsRatio.toFixed(2)),
      percentDifference: parseFloat(((emissionsRatio - 1) * 100).toFixed(1))
    },
    energyComparison: {
      buffalo: buffaloMetrics.energyMetrics.grossEnergyIntake,
      cattle: cattleEnergy.grossEnergyIntake,
      ratio: parseFloat(energyRatio.toFixed(2)),
      percentDifference: parseFloat(((energyRatio - 1) * 100).toFixed(1))
    },
    methaneComparison: {
      buffalo: buffaloMetrics.energyMetrics.methaneAnnualEmissions,
      cattle: cattleEnergy.methaneAnnualEmissions,
      ratio: parseFloat(methaneRatio.toFixed(2)),
      percentDifference: parseFloat(((methaneRatio - 1) * 100).toFixed(1))
    },
    feedEfficiencyComparison: feedEfficiencyRatio !== 0 ? {
      buffalo: buffaloMetrics.feedEfficiency.feedConversionRatio,
      cattle: cattleEnergy.feedConversionRatio,
      ratio: parseFloat(feedEfficiencyRatio.toFixed(2)),
      percentDifference: parseFloat(((feedEfficiencyRatio - 1) * 100).toFixed(1))
    } : null,
    reproductiveComparison: (buffaloMetrics.reproductiveMetrics && cattleReproductive) ? {
      calvingRateImprovement: {
        buffalo: buffaloMetrics.reproductiveMetrics.calvingRateImprovement,
        cattle: cattleReproductive.calvingRateImprovement,
        difference: parseFloat((buffaloMetrics.reproductiveMetrics.calvingRateImprovement - cattleReproductive.calvingRateImprovement).toFixed(1))
      },
      timeToCalfImprovement: {
        buffalo: buffaloMetrics.reproductiveMetrics.timeToCalfImprovement,
        cattle: cattleReproductive.timeToCalfImprovement,
        difference: parseFloat((buffaloMetrics.reproductiveMetrics.timeToCalfImprovement - cattleReproductive.timeToCalfImprovement).toFixed(1))
      }
    } : null,
    environmentalImpactComparison: {
      waterUse: parseFloat(environmentalImpactComparison.waterUse.toFixed(2)),
      landUse: parseFloat(environmentalImpactComparison.landUse.toFixed(2)),
      greenhouseGasEmissions: parseFloat(environmentalImpactComparison.greenhouseGasEmissions.toFixed(2))
    },
    contextualAdvantages: {
      buffalo: [
        'Better utilization of poor quality roughage',
        'Higher heat and humidity tolerance',
        'Better resistance to parasites and some diseases',
        'Lower water requirements',
        'Higher fat content in milk',
        'Longer productive lifespan',
        'Better adaptation to wetlands and swampy areas'
      ],
      cattle: [
        'Higher milk production in specialized dairy breeds',
        'Faster growth rates in specialized beef breeds',
        'Earlier sexual maturity',
        'Higher conception rates',
        'Shorter calving intervals',
        'Better adaptation to intensive production systems',
        'More responsive to high-quality feeds'
      ]
    }
  };
};