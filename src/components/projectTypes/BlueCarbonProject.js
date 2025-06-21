import React from 'react';
import { 
  getCarbonPriceForYear, 
  calculateYearlyCosts, 
  calculateNPV, 
  calculateIRR, 
  calculateROI 
} from '../../utils/calculations';
import { getProjectTypeLabel } from '../../utils/formatters';
import { blueCarbonTypes, sequestrationRates } from '../../utils/projectData';

const BlueCarbonProject = ({ 
  projectSize,
  blueCarbonType,
  customTypes,
  customSequestrationRate,
  useCustomRate,
  onBlueCarbonTypeChange,
  onCustomSequestrationRateChange,
  onUseCustomRateChange,
  onShowCustomTypeModal
}) => {
  // Render component specific UI for Blue Carbon project
  return (
    <div className="mb-4">
      <label htmlFor="blueCarbonType" className="block text-sm font-medium mb-1">Ecosystem Type</label>
      <select
        id="blueCarbonType"
        value={blueCarbonType}
        onChange={(e) => {
          if (e.target.value === 'custom') {
            // Handle custom type logic
            if (onShowCustomTypeModal) {
              onShowCustomTypeModal('bluecarbon');
            }
          } else {
            if (onBlueCarbonTypeChange) {
              onBlueCarbonTypeChange(e.target.value);
            }
            if (onUseCustomRateChange) {
              onUseCustomRateChange(false);
            }
          }
        }}
        className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
      >
        {blueCarbonTypes.filter(t => t.id !== 'custom').map((type) => (
          <option key={type.id} value={type.id}>
            {type.name} ({type.sequestrationRate} tCO2e/ha/year)
          </option>
        ))}
        {customTypes?.bluecarbon?.map((type) => (
          <option key={type.id} value={type.id}>
            {type.name} ({type.sequestrationRate} tCO2e/ha/year)
          </option>
        ))}
        <option value="custom">Custom Ecosystem Type...</option>
      </select>
      
      <div className="mt-4">
        <h3 className="text-sm font-medium mb-2">Ecosystem Conditions</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="degradation" className="block text-sm mb-1">Current Degradation Level</label>
            <select
              id="degradation"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="low">Low (80-100% intact)</option>
              <option value="medium">Medium (40-80% intact)</option>
              <option value="high">High (10-40% intact)</option>
              <option value="veryhigh">Very High (0-10% intact)</option>
            </select>
          </div>
          <div>
            <label htmlFor="tidal" className="block text-sm mb-1">Tidal Range (m)</label>
            <input
              id="tidal"
              type="number"
              min="0"
              step="0.1"
              defaultValue="1.5"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          These conditions can affect sequestration rates but are not factored into calculations yet.
        </p>
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <h3 className="text-sm font-medium text-blue-700 mb-2">Co-Benefits</h3>
        <div className="space-y-1 text-sm">
          <div className="flex items-start">
            <div className="text-blue-500 mr-2">•</div>
            <div>Coastal protection and erosion control</div>
          </div>
          <div className="flex items-start">
            <div className="text-blue-500 mr-2">•</div>
            <div>Habitat for marine species and biodiversity</div>
          </div>
          <div className="flex items-start">
            <div className="text-blue-500 mr-2">•</div>
            <div>Water quality improvement</div>
          </div>
          <div className="flex items-start">
            <div className="text-blue-500 mr-2">•</div>
            <div>Local fisheries support</div>
          </div>
        </div>
      </div>
      
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

// Calculation function for Blue Carbon projects
export const calculateBlueCarbonResults = ({
  projectSize,
  blueCarbonType,
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
    // Get the appropriate rate for the selected blue carbon type
    let selectedBlueCarbon;
    
    // Check if it's a custom blue carbon type
    if (blueCarbonType.startsWith('custom_')) {
      selectedBlueCarbon = customTypes.bluecarbon.find(b => b.id === blueCarbonType);
    } else {
      selectedBlueCarbon = blueCarbonTypes.find(b => b.id === blueCarbonType);
    }
    
    sequestrationRate = selectedBlueCarbon ? selectedBlueCarbon.sequestrationRate : sequestrationRates.bluecarbon;
  }
  
  const sizeMultiplier = projectSize;
  
  // Calculate yearly results
  let yearlyData = [];
  let cumulativeNetCashFlow = 0;
  let cumulativeSequestration = 0;
  let totalRevenue = 0;
  let totalCost = 0;
  
  for (let year = 1; year <= projectYears; year++) {
    // For blue carbon projects, there's a ramp-up period as the ecosystem establishes
    // First year is 50%, second year is 70%, third year is 85%, fourth year onward is 100%
    let developmentFactor = 1.0;
    if (year === 1) developmentFactor = 0.5;
    else if (year === 2) developmentFactor = 0.7;
    else if (year === 3) developmentFactor = 0.85;
    
    const yearlySequestration = sequestrationRate * sizeMultiplier * developmentFactor;
    
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
  
  // Add restoration costs
  const restorationCost = costs
    .filter(cost => cost.type === 'per_hectare' && cost.year === 1)
    .reduce((sum, cost) => sum + cost.value * sizeMultiplier, 0);
  
  if (restorationCost > 0) {
    costBreakdownData.push({
      name: 'Ecosystem Restoration',
      value: restorationCost
    });
  }
  
  // Add annual maintenance
  const annualCosts = totalCost - initialInvestment - restorationCost;
  
  if (annualCosts > 0) {
    costBreakdownData.push({
      name: 'Ongoing Maintenance',
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

export default BlueCarbonProject;