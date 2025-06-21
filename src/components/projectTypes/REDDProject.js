import React, { useState } from 'react';
import { 
  getCarbonPriceForYear, 
  calculateYearlyCosts, 
  calculateNPV, 
  calculateIRR, 
  calculateROI 
} from '../../utils/calculations';
import { getProjectTypeLabel } from '../../utils/formatters';
import { reddForestTypes, sequestrationRates } from '../../utils/projectData';

const REDDProject = ({ 
  projectSize,
  reddForestType,
  customTypes,
  customSequestrationRate,
  useCustomRate,
  onReddForestTypeChange,
  onCustomSequestrationRateChange,
  onUseCustomRateChange,
  onShowCustomTypeModal
}) => {
  const [deforestationRate, setDeforestationRate] = useState(2.5); // Annual % without project
  const [leakageRisk, setLeakageRisk] = useState(20); // % risk of activity shifting
  const [nonPermanenceBuffer, setNonPermanenceBuffer] = useState(20); // % buffer for reversal risk
  
  return (
    <div className="mb-4">
      <label htmlFor="reddForestType" className="block text-sm font-medium mb-1">Forest Type</label>
      <select
        id="reddForestType"
        value={reddForestType}
        onChange={(e) => {
          if (e.target.value === 'custom') {
            // Handle custom type logic
            if (onShowCustomTypeModal) {
              onShowCustomTypeModal('redd');
            }
          } else {
            if (onReddForestTypeChange) {
              onReddForestTypeChange(e.target.value);
            }
            if (onUseCustomRateChange) {
              onUseCustomRateChange(false);
            }
          }
        }}
        className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
      >
        {reddForestTypes.filter(t => t.id !== 'custom').map((type) => (
          <option key={type.id} value={type.id}>
            {type.name} ({type.sequestrationRate} tCO2e/ha/year)
          </option>
        ))}
        {customTypes?.redd?.map((type) => (
          <option key={type.id} value={type.id}>
            {type.name} ({type.sequestrationRate} tCO2e/ha/year)
          </option>
        ))}
        <option value="custom">Custom Forest Type...</option>
      </select>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div>
          <label htmlFor="deforestationRate" className="block text-sm font-medium mb-1">
            Baseline Deforestation Rate (%/year)
          </label>
          <input
            id="deforestationRate"
            type="number"
            min="0.1"
            max="10"
            step="0.1"
            value={deforestationRate}
            onChange={(e) => setDeforestationRate(Math.min(10, Math.max(0.1, parseFloat(e.target.value) || 0)))}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
          />
          <p className="text-xs text-gray-500 mt-1">
            Historical rate without protection
          </p>
        </div>
        
        <div>
          <label htmlFor="leakageRisk" className="block text-sm font-medium mb-1">
            Leakage Risk (%)
          </label>
          <input
            id="leakageRisk"
            type="number"
            min="0"
            max="50"
            step="1"
            value={leakageRisk}
            onChange={(e) => setLeakageRisk(Math.min(50, Math.max(0, parseInt(e.target.value) || 0)))}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
          />
          <p className="text-xs text-gray-500 mt-1">
            Risk of deforestation shifting elsewhere
          </p>
        </div>
        
        <div>
          <label htmlFor="nonPermanenceBuffer" className="block text-sm font-medium mb-1">
            Buffer Pool Contribution (%)
          </label>
          <input
            id="nonPermanenceBuffer"
            type="number"
            min="10"
            max="30"
            step="1"
            value={nonPermanenceBuffer}
            onChange={(e) => setNonPermanenceBuffer(Math.min(30, Math.max(10, parseInt(e.target.value) || 0)))}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
          />
          <p className="text-xs text-gray-500 mt-1">
            Credits set aside for reversal risk
          </p>
        </div>
      </div>
      
      <div className="mt-4">
        <h3 className="text-sm font-medium mb-2">REDD+ Interventions</h3>
        <div className="bg-gray-50 p-3 rounded border">
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              id="intervention_monitoring"
              className="mr-2 h-4 w-4 text-green-600"
              defaultChecked
            />
            <label htmlFor="intervention_monitoring">Forest Monitoring & Surveillance</label>
          </div>
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              id="intervention_community"
              className="mr-2 h-4 w-4 text-green-600"
              defaultChecked
            />
            <label htmlFor="intervention_community">Community Forest Management</label>
          </div>
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              id="intervention_livelihoods"
              className="mr-2 h-4 w-4 text-green-600"
              defaultChecked
            />
            <label htmlFor="intervention_livelihoods">Alternative Livelihoods Development</label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="intervention_enforcement"
              className="mr-2 h-4 w-4 text-green-600"
              defaultChecked
            />
            <label htmlFor="intervention_enforcement">Legal Protection & Enforcement</label>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          These interventions affect project success but costs are captured in the cost management section.
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

// Calculation function for REDD+ projects
export const calculateREDDResults = ({
  projectSize,
  reddForestType,
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
  const deforestationRate = 2.5 / 100; // Default 2.5% per year
  const leakageRisk = 20 / 100; // Default 20%
  const nonPermanenceBuffer = 20 / 100; // Default 20%

  if (useCustomRate && customSequestrationRate) {
    sequestrationRate = parseFloat(customSequestrationRate);
  } else {
    // Get the appropriate rate for the selected REDD forest type
    let selectedForestType;
    
    // Check if it's a custom forest type
    if (reddForestType.startsWith('custom_')) {
      selectedForestType = customTypes.redd.find(t => t.id === reddForestType);
    } else {
      selectedForestType = reddForestTypes.find(t => t.id === reddForestType);
    }
    
    sequestrationRate = selectedForestType ? selectedForestType.sequestrationRate : sequestrationRates.redd;
  }
  
  const sizeMultiplier = projectSize;
  
  // Calculate yearly results
  let yearlyData = [];
  let cumulativeNetCashFlow = 0;
  let cumulativeSequestration = 0;
  let totalRevenue = 0;
  let totalCost = 0;
  let remainingForest = projectSize; // Forest area remaining without project
  
  for (let year = 1; year <= projectYears; year++) {
    // Calculate how much forest would be lost without protection
    const forestLostWithoutProject = projectSize * deforestationRate;
    
    // Calculate carbon saved by preventing deforestation
    // Use the full sequestration rate and multiply by forest area
    const carbonSaved = sequestrationRate * forestLostWithoutProject;
    
    // Apply leakage and buffer pool reductions
    const leakageReduction = carbonSaved * leakageRisk;
    const bufferReduction = carbonSaved * nonPermanenceBuffer;
    const netCarbonSaved = carbonSaved - leakageReduction - bufferReduction;
    
    // Update remaining forest for next year (for reference only)
    remainingForest -= forestLostWithoutProject;
    
    // Get carbon price for this year
    const carbonPrice = getCarbonPriceForYear(year, useYearlyCarbonPrices, carbonPricesByYear, carbonCreditPrice);
    
    // Calculate revenue from carbon credits
    const yearlyRevenue = netCarbonSaved * carbonPrice;
    
    // Calculate costs for this year
    const yearlyCost = calculateYearlyCosts(costs, year, sizeMultiplier);
    
    // Calculate cash flow
    const netCashFlow = yearlyRevenue - yearlyCost;
    cumulativeNetCashFlow += netCashFlow;
    
    // Update totals
    cumulativeSequestration += netCarbonSaved;
    totalRevenue += yearlyRevenue;
    totalCost += yearlyCost;
    
    // Add data for this year
    yearlyData.push({
      year,
      sequestration: netCarbonSaved,
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
  
  // Add protection setup costs
  const protectionCost = costs
    .filter(cost => cost.type === 'per_hectare' && cost.year === 1)
    .reduce((sum, cost) => sum + cost.value * sizeMultiplier, 0);
  
  if (protectionCost > 0) {
    costBreakdownData.push({
      name: 'Protection Setup',
      value: protectionCost
    });
  }
  
  // Add annual maintenance
  const annualCosts = totalCost - initialInvestment - protectionCost;
  
  if (annualCosts > 0) {
    costBreakdownData.push({
      name: 'Monitoring & Enforcement',
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

export default REDDProject;