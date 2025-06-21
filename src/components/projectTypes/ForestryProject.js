import React from 'react';
import { 
  getCarbonPriceForYear, 
  calculateYearlyCosts, 
  calculateNPV, 
  calculateIRR, 
  calculateROI 
} from '../../utils/calculations';
import { getProjectTypeLabel } from '../../utils/formatters';
import { treeTypes, sequestrationRates } from '../../utils/projectData';

const ForestryProject = ({ 
  projectSize,
  treeType,
  customTypes,
  customSequestrationRate,
  useCustomRate,
  onTreeTypeChange,
  onCustomSequestrationRateChange,
  onUseCustomRateChange,
  onShowCustomTypeModal
}) => {
  // Render component specific UI for Forestry project
  return (
    <div className="mb-4">
      <label htmlFor="treeType" className="block text-sm font-medium mb-1">Tree Type</label>
      <select
        id="treeType"
        value={treeType}
        onChange={(e) => {
          if (e.target.value === 'custom') {
            // Handle custom type logic
            if (onShowCustomTypeModal) {
              onShowCustomTypeModal('forestry');
            }
          } else {
            if (onTreeTypeChange) {
              onTreeTypeChange(e.target.value);
            }
            if (onUseCustomRateChange) {
              onUseCustomRateChange(false);
            }
          }
        }}
        className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
      >
        {treeTypes.filter(t => t.id !== 'custom').map((type) => (
          <option key={type.id} value={type.id}>
            {type.name} ({type.sequestrationRate} tCO2e/ha/year)
          </option>
        ))}
        {customTypes?.forestry?.map((type) => (
          <option key={type.id} value={type.id}>
            {type.name} ({type.sequestrationRate} tCO2e/ha/year)
          </option>
        ))}
        <option value="custom">Custom Tree Type...</option>
      </select>
      <div className="mt-2 flex items-center">
        <input
          type="checkbox"
          id="useCustomRate"
          checked={useCustomRate}
          onChange={(e) => {
            if (onUseCustomRateChange) {
              onUseCustomRateChange(e.target.checked);
            }
          }}
          className="mr-2"
        />
        <label htmlFor="useCustomRate" className="text-sm mr-3">Custom Rate:</label>
        <input
          type="number"
          min="0.1"
          step="0.1"
          value={customSequestrationRate}
          onChange={(e) => {
            if (onCustomSequestrationRateChange) {
              onCustomSequestrationRateChange(e.target.value);
            }
          }}
          disabled={!useCustomRate}
          className="w-32 p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
          placeholder="tCO2e/ha/year"
        />
      </div>
    </div>
  );
};

// Calculation function for Forestry projects
export const calculateForestryResults = ({
  projectSize,
  treeType,
  customTypes,
  customSequestrationRate,
  useCustomRate,
  projectYears,
  discountRate,
  costs,
  carbonCreditPrice,
  useYearlyCarbonPrices,
  carbonPricesByYear
}) => {
  let sequestrationRate;

  if (useCustomRate && customSequestrationRate) {
    sequestrationRate = parseFloat(customSequestrationRate);
  } else {
    // Get the appropriate rate for the selected tree type
    let selectedTree;
    
    // Check if it's a custom tree type
    if (treeType.startsWith('custom_')) {
      selectedTree = customTypes.forestry.find(t => t.id === treeType);
    } else {
      selectedTree = treeTypes.find(t => t.id === treeType);
    }
    
    sequestrationRate = selectedTree ? selectedTree.sequestrationRate : sequestrationRates.forestry;
  }
  
  const sizeMultiplier = projectSize;
  
  // Calculate yearly results
  let yearlyData = [];
  let cumulativeNetCashFlow = 0;
  let cumulativeSequestration = 0;
  let totalRevenue = 0;
  let totalCost = 0;
  
  for (let year = 1; year <= projectYears; year++) {
    // Calculate sequestration with growth curve
    const selectedTree = treeTypes.find(t => t.id === treeType) || 
                        (customTypes?.forestry || []).find(t => t.id === treeType) || 
                        treeTypes[0];
    
    // Simple growth factor that starts at 60% and reaches 100% at maturity
    const yearsSincePlanting = year;
    const growthFactor = Math.min(1, 0.6 + (0.4 * yearsSincePlanting / selectedTree.maturityYears));
    const yearlySequestration = sequestrationRate * sizeMultiplier * growthFactor;
    
    // Get carbon price for this year
    const carbonPrice = getCarbonPriceForYear(year, useYearlyCarbonPrices, carbonPricesByYear, carbonCreditPrice);
    
    // Calculate revenue from carbon credits
    const yearlyRevenue = yearlySequestration * carbonPrice;
    
    // Calculate costs for this year
    const yearlyCost = calculateYearlyCosts(costs, year, sizeMultiplier);
    
    // Calculate cash flow
    const netCashFlow = yearlyRevenue - yearlyCost;
    cumulativeNetCashFlow += netCashFlow;
    
    // Update totals
    cumulativeSequestration += yearlySequestration;
    totalRevenue += yearlyRevenue;
    totalCost += yearlyCost;
    
    // Add data for this year
    yearlyData.push({
      year,
      sequestration: yearlySequestration,
      revenue: yearlyRevenue,
      costs: yearlyCost,
      netCashFlow,
      cumulativeNetCashFlow,
      carbonPrice,
      isPositive: netCashFlow >= 0
    });
  }
  
  // Get all yearly cash flows for NPV calculation
  const cashFlows = yearlyData.map(year => year.netCashFlow);
  const npv = calculateNPV(cashFlows, discountRate);
  const irr = calculateIRR(cashFlows);
  const roi = calculateROI(totalRevenue - totalCost, totalCost);
  
  // Determine break-even year
  let breakEvenYear = 'N/A';
  for (let i = 0; i < yearlyData.length; i++) {
    if (yearlyData[i].cumulativeNetCashFlow >= 0) {
      breakEvenYear = yearlyData[i].year;
      break;
    }
  }
  
  // Create chart data
  const cashFlowData = yearlyData.map(yearData => ({
    year: yearData.year,
    cashflow: yearData.netCashFlow,
    cumulative: yearData.cumulativeNetCashFlow,
    isPositive: yearData.netCashFlow >= 0
  }));
  
  const npvData = cashFlowData.map((d, i) => ({
    year: d.year,
    discountedCashFlow: yearlyData[i].netCashFlow / Math.pow(1 + (discountRate / 100), d.year),
    cumulativeNpv: npv * (i + 1) / yearlyData.length // Simplified approximation
  }));
  
  // Create cost breakdown data
  let costBreakdownData = [];
  
  // Add initial investment
  const initialInvestment = costs
    .filter(cost => cost.type === 'fixed' && cost.year === 1)
    .reduce((sum, cost) => sum + cost.value, 0);
  
  if (initialInvestment > 0) {
    costBreakdownData.push({
      name: 'Initial Investment',
      value: initialInvestment
    });
  }
  
  // Add planting/implementation costs
  const implementationCost = costs
    .filter(cost => cost.type === 'per_hectare' && cost.year === 1)
    .reduce((sum, cost) => sum + cost.value * sizeMultiplier, 0);
  
  if (implementationCost > 0) {
    costBreakdownData.push({
      name: `${getProjectTypeLabel('forestry')} Setup`,
      value: implementationCost
    });
  }
  
  // Add annual maintenance
  const annualCosts = totalCost - initialInvestment - implementationCost;
  
  if (annualCosts > 0) {
    costBreakdownData.push({
      name: 'Ongoing Costs',
      value: annualCosts
    });
  }
  
  return {
    totalSequestration: cumulativeSequestration,
    totalRevenue,
    totalCost,
    netProfit: totalRevenue - totalCost,
    yearlyData,
    breakEvenYear,
    npv,
    irr,
    roi,
    chartData: {
      cashFlowData,
      npvData,
      costBreakdownData
    }
  };
};

export default ForestryProject;