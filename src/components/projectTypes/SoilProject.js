import React from 'react';
import { 
  getCarbonPriceForYear, 
  calculateYearlyCosts, 
  calculateNPV, 
  calculateIRR, 
  calculateROI 
} from '../../utils/calculations';
import { getProjectTypeLabel } from '../../utils/formatters';
import { soilTypes, sequestrationRates } from '../../utils/projectData';

const SoilProject = ({ 
  projectSize,
  soilType,
  customTypes,
  customSequestrationRate,
  useCustomRate,
  onSoilTypeChange,
  onCustomSequestrationRateChange,
  onUseCustomRateChange,
  onShowCustomTypeModal
}) => {
  // Render component specific UI for Soil project
  return (
    <div className="mb-4">
      <label htmlFor="soilType" className="block text-sm font-medium mb-1">Soil Type</label>
      <select
        id="soilType"
        value={soilType}
        onChange={(e) => {
          if (e.target.value === 'custom') {
            // Handle custom type logic
            if (onShowCustomTypeModal) {
              onShowCustomTypeModal('soil');
            }
          } else {
            if (onSoilTypeChange) {
              onSoilTypeChange(e.target.value);
            }
            if (onUseCustomRateChange) {
              onUseCustomRateChange(false);
            }
          }
        }}
        className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
      >
        {soilTypes.filter(t => t.id !== 'custom').map((type) => (
          <option key={type.id} value={type.id}>
            {type.name} ({type.sequestrationRate} tCO2e/ha/year)
          </option>
        ))}
        {customTypes?.soil?.map((type) => (
          <option key={type.id} value={type.id}>
            {type.name} ({type.sequestrationRate} tCO2e/ha/year)
          </option>
        ))}
        <option value="custom">Custom Soil Type...</option>
      </select>
      
      <div className="mt-4">
        <h3 className="text-sm font-medium mb-2">Soil Management Practices</h3>
        <div className="bg-gray-50 p-3 rounded border">
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              id="practice_no_till"
              className="mr-2 h-4 w-4 text-green-600"
            />
            <label htmlFor="practice_no_till">No-till/Reduced Tillage</label>
          </div>
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              id="practice_cover_crops"
              className="mr-2 h-4 w-4 text-green-600"
            />
            <label htmlFor="practice_cover_crops">Cover Crops</label>
          </div>
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              id="practice_crop_rotation"
              className="mr-2 h-4 w-4 text-green-600"
            />
            <label htmlFor="practice_crop_rotation">Crop Rotation</label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="practice_organic_amendments"
              className="mr-2 h-4 w-4 text-green-600"
            />
            <label htmlFor="practice_organic_amendments">Organic Amendments/Compost</label>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          These practices can increase sequestration rates but are not factored into calculations yet.
        </p>
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

// Calculation function for Soil projects
export const calculateSoilResults = ({
  projectSize,
  soilType,
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
    // Get the appropriate rate for the selected soil type
    let selectedSoil;
    
    // Check if it's a custom soil type
    if (soilType.startsWith('custom_')) {
      selectedSoil = customTypes.soil.find(s => s.id === soilType);
    } else {
      selectedSoil = soilTypes.find(s => s.id === soilType);
    }
    
    sequestrationRate = selectedSoil ? selectedSoil.sequestrationRate : sequestrationRates.soil;
  }
  
  const sizeMultiplier = projectSize;
  
  // Calculate yearly results
  let yearlyData = [];
  let cumulativeNetCashFlow = 0;
  let cumulativeSequestration = 0;
  let totalRevenue = 0;
  let totalCost = 0;
  
  for (let year = 1; year <= projectYears; year++) {
    // For soil carbon, we assume a constant sequestration rate
    const yearlySequestration = sequestrationRate * sizeMultiplier;
    
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
  
  // Add implementation costs
  const implementationCost = costs
    .filter(cost => cost.type === 'per_hectare' && cost.year === 1)
    .reduce((sum, cost) => sum + cost.value * sizeMultiplier, 0);
  
  if (implementationCost > 0) {
    costBreakdownData.push({
      name: `${getProjectTypeLabel('soil')} Conversion`,
      value: implementationCost
    });
  }
  
  // Add annual maintenance
  const annualCosts = totalCost - initialInvestment - implementationCost;
  
  if (annualCosts > 0) {
    costBreakdownData.push({
      name: 'Annual Management',
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

export default SoilProject;