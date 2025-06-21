import React, { useState } from 'react';
import { 
  getCarbonPriceForYear, 
  calculateYearlyCosts, 
  calculateNPV, 
  calculateIRR, 
  calculateROI 
} from '../../utils/calculations';
import { getProjectTypeLabel } from '../../utils/formatters';
import { renewableTypes, sequestrationRates } from '../../utils/projectData';

const RenewableProject = ({ 
  capacityMW,
  renewableType,
  customTypes,
  customSequestrationRate,
  useCustomRate,
  onRenewableTypeChange,
  onCustomSequestrationRateChange,
  onUseCustomRateChange,
  onShowCustomTypeModal
}) => {
  const [electricityPrice, setElectricityPrice] = useState(0.10); // Default electricity price in $/kWh
  const [includeElectricityRevenue, setIncludeElectricityRevenue] = useState(false);
  const [gridEmissionsIntensity, setGridEmissionsIntensity] = useState(0.5); // Default grid emissions intensity in tCO2e/MWh
  
  // Helper to get capacity factor for the selected renewable type
  const getCapacityFactor = () => {
    if (renewableType.startsWith('custom_')) {
      const customRenewable = customTypes?.renewable?.find(r => r.id === renewableType);
      return customRenewable ? customRenewable.capacityFactor : 0.25;
    } else {
      const selectedRenewable = renewableTypes.find(r => r.id === renewableType);
      return selectedRenewable ? selectedRenewable.capacityFactor : 0.25;
    }
  };
  
  // Calculate annual electricity generation in MWh
  const annualGeneration = capacityMW * getCapacityFactor() * 24 * 365;

  // Render component specific UI for Renewable project
  return (
    <div className="mb-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="renewableType" className="block text-sm font-medium mb-1">Renewable Type</label>
          <select
            id="renewableType"
            value={renewableType}
            onChange={(e) => {
              if (e.target.value === 'custom') {
                // Handle custom type logic
                if (onShowCustomTypeModal) {
                  onShowCustomTypeModal('renewable');
                }
              } else {
                if (onRenewableTypeChange) {
                  onRenewableTypeChange(e.target.value);
                }
                if (onUseCustomRateChange) {
                  onUseCustomRateChange(false);
                }
              }
            }}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
          >
            {renewableTypes.filter(r => r.id !== 'custom').map((type) => (
              <option key={type.id} value={type.id}>
                {type.name} (CF: {type.capacityFactor})
              </option>
            ))}
            {customTypes?.renewable?.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name} (CF: {type.capacityFactor})
              </option>
            ))}
            <option value="custom">Custom Renewable Type...</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="gridEmissionsIntensity" className="block text-sm font-medium mb-1">
            Grid Emissions Intensity (tCO2e/MWh)
          </label>
          <input
            id="gridEmissionsIntensity"
            type="number"
            min="0.01"
            step="0.01"
            value={gridEmissionsIntensity}
            onChange={(e) => setGridEmissionsIntensity(Math.max(0.01, parseFloat(e.target.value) || 0))}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
          />
          <p className="text-xs text-gray-500 mt-1">
            Average emissions intensity of the grid being displaced
          </p>
        </div>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg border mb-4">
        <div className="flex items-center mb-2">
          <input
            type="checkbox"
            id="includeElectricityRevenue"
            checked={includeElectricityRevenue}
            onChange={(e) => setIncludeElectricityRevenue(e.target.checked)}
            className="mr-2 h-4 w-4 text-green-600"
          />
          <label htmlFor="includeElectricityRevenue" className="font-medium">
            Include Electricity Revenue
          </label>
        </div>
        
        <div className={includeElectricityRevenue ? '' : 'opacity-50'}>
          <label htmlFor="electricityPrice" className="block text-sm font-medium mb-1">
            Electricity Price ($/kWh)
          </label>
          <input
            id="electricityPrice"
            type="number"
            min="0.01"
            step="0.01"
            value={electricityPrice}
            onChange={(e) => setElectricityPrice(Math.max(0.01, parseFloat(e.target.value) || 0))}
            disabled={!includeElectricityRevenue}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
          />
        </div>
        
        <div className="mt-3 grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-500">Annual Generation</div>
            <div className="font-medium">
              {Math.round(annualGeneration).toLocaleString()} MWh
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Annual Emissions Reduction</div>
            <div className="font-medium">
              {Math.round(annualGeneration * gridEmissionsIntensity).toLocaleString()} tCO2e
            </div>
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
        <label htmlFor="useCustomRate" className="text-sm mr-3">Custom Emissions Displacement:</label>
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
          placeholder="tCO2e/MW/year"
        />
      </div>
    </div>
  );
};

// Calculation function for Renewable projects
export const calculateRenewableResults = ({
  capacityMW,
  renewableType,
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
  let capacityFactor;

  // Get capacity factor
  if (renewableType.startsWith('custom_')) {
    const customRenewable = customTypes.renewable.find(r => r.id === renewableType);
    capacityFactor = customRenewable ? customRenewable.capacityFactor : 0.25;
  } else {
    const selectedRenewable = renewableTypes.find(r => r.id === renewableType);
    capacityFactor = selectedRenewable ? selectedRenewable.capacityFactor : 0.25;
  }

  if (useCustomRate && customSequestrationRate) {
    sequestrationRate = parseFloat(customSequestrationRate);
  } else {
    // Default calculation based on capacity factor
    // Assuming a grid emissions factor of 0.5 tCO2e/MWh
    const gridEmissionsFactor = 0.5;
    const hoursPerYear = 8760; // 365 days * 24 hours
    
    // Calculate annual MWh generated
    const annualMWh = capacityMW * capacityFactor * hoursPerYear;
    
    // Calculate annual emissions reduction
    sequestrationRate = (annualMWh * gridEmissionsFactor) / capacityMW;
  }
  
  const sizeMultiplier = capacityMW;
  
  // Calculate yearly results
  let yearlyData = [];
  let cumulativeNetCashFlow = 0;
  let cumulativeSequestration = 0;
  let totalRevenue = 0;
  let totalCost = 0;
  
  for (let year = 1; year <= projectYears; year++) {
    // For renewable, we calculate based on annual generation
    // Assume some degradation over time (0.5% per year)
    const degradationFactor = Math.pow(0.995, year - 1);
    const yearlySequestration = sequestrationRate * sizeMultiplier * degradationFactor;
    
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
  
  // Add capital costs
  const capitalCost = costs
    .filter(cost => cost.type === 'per_hectare' && cost.year === 1)
    .reduce((sum, cost) => sum + cost.value * sizeMultiplier, 0);
  
  if (capitalCost > 0) {
    costBreakdownData.push({
      name: 'Capital Expenditure',
      value: capitalCost
    });
  }
  
  // Add annual maintenance
  const annualCosts = totalCost - initialInvestment - capitalCost;
  
  if (annualCosts > 0) {
    costBreakdownData.push({
      name: 'Operation & Maintenance',
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

export default RenewableProject;