// livestockCalculations.js
// This file contains the calculation functions for livestock projects

// Function to calculate enhanced livestock results
export const calculateEnhancedLivestockResults = ({
  herdSize,
  animalType,
  cattleType,
  customTypes,
  customSequestrationRate,
  useCustomRate,
  // Emissions factors
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
  // Optional reproductive improvement costs
  reproductiveImprovementCosts
}) => {
  // Define baseline emissions based on cattle type
  let baselineEmissionsPerHead = 0;
  
  // Find the cattle type in custom types if it's a custom one
  const isCustomCattleType = cattleType.startsWith('custom_');
  
  if (isCustomCattleType) {
    // Find the custom cattle type in the custom types
    const customCattle = customTypes?.livestock?.find(type => type.id === cattleType);
    if (customCattle) {
      baselineEmissionsPerHead = customCattle.baseEmissions || customCattle.emissionsRate || 2500;
    }
  } else {
    // Use predefined emissions rates
    switch (cattleType) {
      case 'dairy':
        baselineEmissionsPerHead = 3000; // kg CO2e per head per year
        break;
      case 'beef':
        baselineEmissionsPerHead = 2500; // kg CO2e per head per year
        break;
      case 'mixed':
        baselineEmissionsPerHead = 2750; // kg CO2e per head per year
        break;
      default:
        baselineEmissionsPerHead = 2500; // Default
    }
  }
  
  // Apply feed type adjustments
  let feedMultiplier = 1.0;
  switch (feedType) {
    case 'grain':
      feedMultiplier = 0.9; // 10% reduction from baseline
      break;
    case 'grass':
      feedMultiplier = 1.1; // 10% increase from baseline
      break;
    case 'mixed':
      feedMultiplier = 1.0; // No change
      break;
    case 'optimized':
      feedMultiplier = 0.8; // 20% reduction from baseline
      break;
    default:
      feedMultiplier = 1.0;
  }
  
  // Apply manure management adjustments
  let manureMultiplier = 1.0;
  switch (manureManagement) {
    case 'covered':
      manureMultiplier = 0.85; // 15% reduction from baseline
      break;
    case 'standard':
      manureMultiplier = 1.0; // No change
      break;
    case 'anaerobic':
      manureMultiplier = 0.5; // 50% reduction from baseline
      break;
    case 'composting':
      manureMultiplier = 0.75; // 25% reduction from baseline
      break;
    case 'daily_spread':
      manureMultiplier = 0.9; // 10% reduction from baseline
      break;
    default:
      manureMultiplier = 1.0;
  }
  
  // Apply emission reduction additives if used
  let additiveMultiplier = 1.0;
  if (useEmissionReductionAdditives) {
    // Convert efficiency percentage to a multiplier (e.g., 20% efficiency -> 0.8 multiplier)
    additiveMultiplier = 1.0 - (additiveEfficiency / 100);
  }
  
  // Apply grazing practice adjustments
  let grazingMultiplier = 1.0;
  switch (grazingPractice) {
    case 'rotational':
      grazingMultiplier = 0.9; // 10% reduction from baseline
      break;
    case 'continuous':
      grazingMultiplier = 1.0; // No change
      break;
    case 'adaptive':
      grazingMultiplier = 0.75; // 25% reduction from baseline
      break;
    case 'silvopasture':
      grazingMultiplier = 0.65; // 35% reduction from baseline
      break;
    default:
      grazingMultiplier = 1.0;
  }
  
  // Apply climate region adjustments
  let climateMultiplier = 1.0;
  switch (regionClimate) {
    case 'tropical':
      climateMultiplier = 1.1; // 10% increase from baseline
      break;
    case 'temperate':
      climateMultiplier = 1.0; // No change
      break;
    case 'arid':
      climateMultiplier = 0.95; // 5% reduction from baseline
      break;
    case 'continental':
      climateMultiplier = 1.05; // 5% increase from baseline
      break;
    default:
      climateMultiplier = 1.0;
  }
  
  // Calculate the combined multiplier
  const combinedMultiplier = feedMultiplier * manureMultiplier * additiveMultiplier * grazingMultiplier * climateMultiplier;
  
  // Calculate the original (baseline) emissions
  const baselineEmissionsTotal = baselineEmissionsPerHead * herdSize; // kg CO2e per year
  
  // Reproductive efficiency improvement
  let reproductiveEfficiencyMultiplier = 1.0;
  
  // If we have reproductive parameters, calculate improvements
  if (calvingRate && timeToCalfBefore && timeToCalfAfter) {
    // Calculate reproductive efficiency change
    // Higher calving rate means more calves per cow, which spreads emissions
    const calvingRateImprovement = calvingRate / 100; // Convert percentage to decimal
    
    // Faster calving time means more efficient production
    const calvingTimeReduction = Math.max(0, (timeToCalfBefore - timeToCalfAfter) / timeToCalfBefore);
    
    // Improved genetics and supplementation can further improve efficiency
    let supplementationEffect = 0;
    switch (supplementationType) {
      case 'mineral':
        supplementationEffect = 0.05; // 5% improvement
        break;
      case 'protein':
        supplementationEffect = 0.10; // 10% improvement
        break;
      case 'energy':
        supplementationEffect = 0.08; // 8% improvement
        break;
      case 'complete':
        supplementationEffect = 0.15; // 15% improvement
        break;
      case 'none':
      default:
        supplementationEffect = 0; // No improvement
    }
    
    // Calculate combined reproductive efficiency (this is a simplification)
    // We'll say that these factors can reduce emissions intensity by making production more efficient
    reproductiveEfficiencyMultiplier = Math.max(0.6, 1.0 - ((calvingRateImprovement * 0.2) + (calvingTimeReduction * 0.3) + supplementationEffect));
  }
  
  // Dietary energy multiplier based on energy profile
  let dietaryEnergyMultiplier = 1.0;
  switch (dietaryEnergyProfile) {
    case 'high':
      dietaryEnergyMultiplier = 1.1; // 10% increase from higher energy intake
      break;
    case 'medium':
      dietaryEnergyMultiplier = 1.0; // No change
      break;
    case 'low':
      dietaryEnergyMultiplier = 0.9; // 10% reduction from lower energy intake
      break;
    case 'variable':
      dietaryEnergyMultiplier = 1.05; // 5% increase from variable energy
      break;
    default:
      dietaryEnergyMultiplier = 1.0;
  }
  
  // Seasonal feed changes can impact efficiency
  let seasonalFeedMultiplier = 1.0;
  switch (seasonalFeedChanges) {
    case 'two_season':
      seasonalFeedMultiplier = 0.95; // 5% reduction from optimized seasonal feeding
      break;
    case 'four_season':
      seasonalFeedMultiplier = 0.9; // 10% reduction from more optimized feeding
      break;
    case 'custom':
      seasonalFeedMultiplier = 0.85; // 15% reduction from custom optimization
      break;
    case 'constant':
    default:
      seasonalFeedMultiplier = 1.0; // No change
  }
  
  // Custom feed mixture could provide further benefits
  let customFeedMultiplier = 1.0;
  if (useCustomFeedMixture && customFeedMixture) {
    // This would be more complex in a real implementation
    // For simplicity, assuming a modest improvement
    customFeedMultiplier = 0.95; // 5% reduction
  }
  
  // Combined feed and energy multiplier
  const feedEnergyMultiplier = dietaryEnergyMultiplier * seasonalFeedMultiplier * customFeedMultiplier;
  
  // Calculate the adjusted emissions with all factors
  const adjustedEmissionsTotal = baselineEmissionsTotal * combinedMultiplier * reproductiveEfficiencyMultiplier * feedEnergyMultiplier; // kg CO2e per year
  
  // Calculate the emissions reduction
  const emissionsReduction = baselineEmissionsTotal - adjustedEmissionsTotal; // kg CO2e per year
  
  // Convert to CO2e tonnes for carbon credit calculation
  const emissionsReductionTonnes = emissionsReduction / 1000; // tonnes CO2e per year
  
  // Initialize yearly data array to track cash flows and other metrics
  const yearlyData = [];
  let cumulativeSequestration = 0;
  let cumulativeNetCashFlow = 0;
  
  // Calculate yearly cash flows
  for (let year = 1; year <= projectYears; year++) {
    // Carbon credit price for the year (baseline or from yearly prices)
    let creditPrice = carbonCreditPrice;
    if (useYearlyCarbonPrices && carbonPricesByYear && carbonPricesByYear.length >= year) {
      creditPrice = carbonPricesByYear[year - 1].price;
    }
    
    // Calculate sequestration (emissions reduction) for this year
    // For simplicity, we assume constant reduction each year
    const sequestration = emissionsReductionTonnes;
    
    // Calculate revenue from carbon credits
    const revenue = sequestration * creditPrice;
    
    // Calculate costs for this year
    let yearCosts = 0;
    
    // Add fixed and annual costs
    if (costs && Array.isArray(costs)) {
      costs.forEach(cost => {
        if (cost.type === 'fixed' && cost.year === year) {
          yearCosts += cost.value;
        } else if (cost.type === 'annual') {
          yearCosts += cost.value;
        } else if (cost.type === 'per_hectare' && cost.year === year) {
          yearCosts += cost.value * herdSize;
        } else if (cost.type === 'annual_per_hectare') {
          yearCosts += cost.value * herdSize;
        }
      });
    }
    
    // Add reproductive improvement costs if applicable
    if (reproductiveImprovementCosts) {
      if (reproductiveImprovementCosts.type === 'annual_per_head') {
        yearCosts += reproductiveImprovementCosts.value * herdSize;
      } else if (reproductiveImprovementCosts.type === 'fixed' && year === 1) {
        yearCosts += reproductiveImprovementCosts.value;
      }
    }
    
    // Calculate net cash flow for the year
    const netCashFlow = revenue - yearCosts;
    
    // Update cumulative metrics
    cumulativeSequestration += sequestration;
    cumulativeNetCashFlow += netCashFlow;
    
    // Calculate NPV components
    const discountFactor = 1 / Math.pow(1 + (discountRate / 100), year);
    const discountedCashFlow = netCashFlow * discountFactor;
    
    // Add data for this year to the yearly data array
    yearlyData.push({
      year,
      sequestration,
      revenue,
      costs: yearCosts,
      netCashFlow,
      cumulativeNetCashFlow,
      discountedCashFlow,
      discountFactor,
      baselineEmissions: baselineEmissionsTotal, // kg CO2e
      adjustedEmissions: adjustedEmissionsTotal,  // kg CO2e
      emissionsReduction: emissionsReduction, // kg CO2e
      emissionsReductionPercent: (emissionsReduction / baselineEmissionsTotal) * 100
    });
  }
  
  // Calculate NPV (sum of discounted cash flows)
  const npv = yearlyData.reduce((sum, year) => sum + year.discountedCashFlow, 0);
  
  // Calculate IRR (simplified approximation)
  // This is a very simplified approach
  let irr = null;
  if (costs && Array.isArray(costs)) {
    const initialInvestment = costs.filter(cost => cost.year === 1)
      .reduce((sum, cost) => sum + cost.value, 0);
    
    if (initialInvestment > 0) {
      // Simple approximation based on NPV and initial investment
      irr = (npv / initialInvestment) * (100 / projectYears);
    }
  }
  
  // Calculate ROI
  const totalRevenue = yearlyData.reduce((sum, year) => sum + year.revenue, 0);
  const totalCost = yearlyData.reduce((sum, year) => sum + year.costs, 0);
  const roi = totalCost > 0 ? ((totalRevenue - totalCost) / totalCost) * 100 : 0;
  
  // Calculate break-even year
  let breakEvenYear = 'Never';
  for (let i = 0; i < yearlyData.length; i++) {
    if (yearlyData[i].cumulativeNetCashFlow >= 0) {
      breakEvenYear = yearlyData[i].year;
      break;
    }
  }
  
  // Prepare chart data for visualization
  
  // Cash flow chart data
  const cashFlowData = yearlyData.map(year => ({
    year: year.year,
    cashflow: year.netCashFlow,
    cumulative: year.cumulativeNetCashFlow,
    isPositive: year.netCashFlow >= 0,
    name: `Year ${year.year}`,
    'Carbon Credits': year.revenue,
    'Costs': -year.costs,
    'Net Cash Flow': year.netCashFlow
  }));
  
  // NPV chart data
  const npvData = yearlyData.map(year => ({
    year: year.year,
    discountedCashFlow: year.discountedCashFlow,
    cumulativeNpv: yearlyData
      .filter(y => y.year <= year.year)
      .reduce((sum, y) => sum + y.discountedCashFlow, 0),
    name: `Year ${year.year}`,
    'Present Value': year.discountedCashFlow,
    'Cumulative NPV': yearlyData
      .filter(y => y.year <= year.year)
      .reduce((sum, y) => sum + y.discountedCashFlow, 0)
  }));
  
  // Cost breakdown categories
  // Collect fixed costs
  let fixedCosts = 0;
  let annualCosts = 0;
  let perHeadCosts = 0;
  let annualPerHeadCosts = 0;
  
  if (costs && Array.isArray(costs)) {
    fixedCosts = costs
      .filter(cost => cost.type === 'fixed')
      .reduce((sum, cost) => sum + cost.value, 0);
    
    // Calculate annual costs over the project lifetime
    annualCosts = costs
      .filter(cost => cost.type === 'annual')
      .reduce((sum, cost) => sum + (cost.value * projectYears), 0);
    
    // Calculate per hectare costs
    perHeadCosts = costs
      .filter(cost => cost.type === 'per_hectare')
      .reduce((sum, cost) => sum + (cost.value * herdSize), 0);
    
    // Calculate annual per hectare costs over the project lifetime
    annualPerHeadCosts = costs
      .filter(cost => cost.type === 'annual_per_hectare')
      .reduce((sum, cost) => sum + (cost.value * herdSize * projectYears), 0);
  }
  
  // Reproductive costs (if applicable)
  let reproductiveImprovementCostsTotal = 0;
  if (reproductiveImprovementCosts) {
    if (reproductiveImprovementCosts.type === 'annual_per_head') {
      reproductiveImprovementCostsTotal = reproductiveImprovementCosts.value * herdSize * projectYears;
    } else if (reproductiveImprovementCosts.type === 'fixed') {
      reproductiveImprovementCostsTotal = reproductiveImprovementCosts.value;
    }
  }
  
  // Create cost breakdown data for pie chart
  const costBreakdownData = [
    { name: 'Fixed Costs', value: fixedCosts },
    { name: 'Annual Costs', value: annualCosts },
    { name: 'Per Head One-time', value: perHeadCosts },
    { name: 'Per Head Annual', value: annualPerHeadCosts }
  ];
  
  // Add reproductive costs if significant
  if (reproductiveImprovementCostsTotal > 0) {
    costBreakdownData.push({ name: 'Reproductive Improvement', value: reproductiveImprovementCostsTotal });
  }
  
  // Filter out zero-value entries
  const filteredCostBreakdownData = costBreakdownData.filter(item => item.value > 0);
  
  // Create emissions breakdown data
  const emissionsIntensity = {
    baseline: baselineEmissionsPerHead, // kg CO2e/head/year
    reduced: adjustedEmissionsTotal / herdSize, // kg CO2e/head/year
    percentReduction: ((baselineEmissionsPerHead - (adjustedEmissionsTotal / herdSize)) / baselineEmissionsPerHead) * 100
  };
  
  // Return all calculated results
  return {
    // Overall project metrics
    totalSequestration: cumulativeSequestration,
    totalRevenue,
    totalCost,
    netProfit: totalRevenue - totalCost,
    npv,
    irr,
    roi,
    breakEvenYear,
    
    // Yearly detailed data
    yearlyData,
    
    // Chart data
    chartData: {
      cashFlowData,
      npvData,
      costBreakdownData: filteredCostBreakdownData,
      emissionsIntensity  // Add emissions data for livestock projects
    },
    
    // Specific metrics for enhanced livestock projects
    livestockMetrics: {
      baselineEmissions: baselineEmissionsTotal / 1000, // tonnes CO2e/year
      reducedEmissions: adjustedEmissionsTotal / 1000, // tonnes CO2e/year
      emissionsReduction: emissionsReductionTonnes, // tonnes CO2e/year
      emissionsIntensity
    }
  };
};