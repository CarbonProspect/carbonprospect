/**
 * Utility functions to transform calculation results into chart-compatible data formats
 */

/**
 * Transforms yearly data from livestock calculations into the format expected by CashFlowChart
 * @param {Array} yearlyData - Array of yearly data objects from calculations
 * @returns {Array} - Formatted data for CashFlowChart component
 */
export const formatCashFlowData = (yearlyData) => {
  if (!yearlyData || yearlyData.length === 0) return [];
  
  return yearlyData.map(year => ({
    year: `Year ${year.year}`,
    cashflow: year.netCashFlow,
    cumulative: year.cumulativeNetCashFlow,
    isPositive: year.netCashFlow >= 0,
    // Preserve original data for other visualizations
    'Carbon Credits': year.emissionsRevenue,
    'Production Benefits': year.productionBenefit,
    'Costs': -year.costs,
    'Net Cash Flow': year.netCashFlow
  }));
};

/**
 * Transforms yearly data from livestock calculations into the format expected by NPVChart
 * @param {Array} yearlyData - Array of yearly data objects from calculations
 * @returns {Array} - Formatted data for NPVChart component
 */
export const formatNPVData = (yearlyData) => {
  if (!yearlyData || yearlyData.length === 0) return [];
  
  return yearlyData.map(year => ({
    year: `Year ${year.year}`,
    discountedCashFlow: year.presentValue,
    cumulativeNpv: year.cumulativeNPV,
    // Preserve original data
    'Present Value': year.presentValue,
    'Cumulative NPV': year.cumulativeNPV
  }));
};

/**
 * Transforms yearly data into the format expected by the EmissionsChart component
 * @param {Array} yearlyData - Array of yearly data objects from calculations
 * @returns {Array} - Formatted data for EmissionsChart component
 */
export const formatEmissionsData = (yearlyData) => {
  if (!yearlyData || yearlyData.length === 0) return [];
  
  return yearlyData.map(year => ({
    name: `Year ${year.year}`,
    'Baseline Emissions': year.baselineEmissions / 1000, // Convert to tonnes
    'Reduced Emissions': year.adjustedEmissions / 1000, // Convert to tonnes
    'Emissions Reduction': year.emissionsReduction / 1000, // Convert to tonnes
    year: year.year
  }));
};