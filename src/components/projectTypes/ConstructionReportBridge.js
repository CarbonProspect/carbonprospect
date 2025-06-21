import React, { useState, useEffect } from 'react';
import { calculateConstructionResults } from './ConstructionProject';
import ReportGenerator from '../../ReportGenerator';

/**
 * This component bridges the gap between the ConstructionProject and ReportGenerator
 * It transforms construction emission data into financial report data format
 */
const ConstructionReportBridge = ({
  // Construction project data
  buildingSize = 10000,
  constructionCost = 2500,
  operationalEmissions = 30,
  selectedBuildingType = { name: 'Commercial Office', baselineEmissions: 650, size: 'sqm', lifespan: 50 },
  selectedMaterials = {},
  selectedEnergyMeasures = {},
  materialVolumes = { concrete: 2000, steel: 500, timber: 300, glass: 100, insulation: 400 },
  landscapingOptions = 'standard',
  solarCapacity = 0,
  greenRoofArea = 0,
  rainwaterHarvesting = 'standard',
  usesRecycledMaterials = false,
  recycledContentPercentage = 30,
  buildingLifespan = 50,
  energyUsageBaseline = 200,
  waterUsageBaseline = 1.5,
  energyCostRate = 25,
  waterCostRate = 2.5,
  maintenanceCostBaseline = 25,
  greenBuildingPremiumRate = 10,
  
  // Report configuration
  scenarioName = "Standard Green Building",
  carbonCreditPrice = 25,  // Can be used to value carbon savings
  discountRate = 5,
  
  // Saved configurations for comparison
  savedConfigurations = []
}) => {
  // State for transformed report data
  const [reportData, setReportData] = useState(null);
  // State for showing/hiding the report modal
  const [showReport, setShowReport] = useState(false);

  // Transform construction data to report-compatible format
  useEffect(() => {
    // Gather all construction parameters
    const constructionParams = {
      buildingSize,
      constructionCost,
      operationalEmissions,
      selectedBuildingType,
      selectedMaterials,
      selectedEnergyMeasures,
      materialVolumes,
      landscapingOptions,
      solarCapacity,
      greenRoofArea,
      rainwaterHarvesting,
      usesRecycledMaterials,
      recycledContentPercentage,
      buildingLifespan,
      energyUsageBaseline,
      waterUsageBaseline,
      energyCostRate,
      waterCostRate,
      maintenanceCostBaseline,
      greenBuildingPremiumRate,
      discountRate
    };
    
    // Calculate construction results using the function from ConstructionProject.js
    const constructionResults = calculateConstructionResults(constructionParams);
    
    // Transform the data into report-compatible format
    const transformedData = transformConstructionDataToReportFormat(constructionResults);
    
    // Set the report data
    setReportData(transformedData);
  }, [
    buildingSize, constructionCost, operationalEmissions, selectedBuildingType, 
    selectedMaterials, selectedEnergyMeasures, materialVolumes, landscapingOptions, 
    solarCapacity, greenRoofArea, rainwaterHarvesting, usesRecycledMaterials, 
    recycledContentPercentage, buildingLifespan, energyUsageBaseline, waterUsageBaseline, 
    energyCostRate, waterCostRate, maintenanceCostBaseline, greenBuildingPremiumRate, 
    discountRate
  ]);

  // Function to transform construction data to report format
  const transformConstructionDataToReportFormat = (constructionData) => {
    // Extract key metrics from construction data
    const {
      baselineEmbodiedCarbon,
      actualEmbodiedCarbon,
      embodiedCarbonReduction,
      baseOperationalEmissions,
      finalOperationalEmissions,
      operationalEmissionsReduction,
      totalEmissionsReduction,
      greenBuildingPremium,
      totalOperationalSavings,
      simplePaybackPeriod,
      projectLifetime,
      npvOperationalSavings,
      roi,
      propertyValueIncrease,
      yearlyData,
      chartData
    } = constructionData;

    // Calculate total carbon savings with a monetary value
    const totalCarbonValue = totalEmissionsReduction * carbonCreditPrice;
    
    // Create report-compatible results object
    return {
      // Standard financial metrics
      totalSequestration: totalEmissionsReduction,
      totalRevenue: totalOperationalSavings * projectLifetime + totalCarbonValue,
      totalCost: greenBuildingPremium,
      netProfit: (totalOperationalSavings * projectLifetime) - greenBuildingPremium + propertyValueIncrease + totalCarbonValue,
      npv: npvOperationalSavings - greenBuildingPremium + propertyValueIncrease,
      irr: Math.min(99, roi / 2), // Simple approximation with cap
      roi: roi,
      breakEvenYear: Math.ceil(simplePaybackPeriod),
      
      // Yearly data for tables
      yearlyData: yearlyData.map(year => ({
        year: year.year,
        sequestration: year.year === 0 ? embodiedCarbonReduction : operationalEmissionsReduction,
        revenue: year.year === 0 ? 0 : totalOperationalSavings + (operationalEmissionsReduction * carbonCreditPrice),
        costs: year.year === 0 ? greenBuildingPremium : 0,
        netCashFlow: year.year === 0 ? -greenBuildingPremium : totalOperationalSavings + (operationalEmissionsReduction * carbonCreditPrice),
        cumulativeNetCashFlow: year.cumulativeSavings - greenBuildingPremium,
        
        // Construction-specific emissions data
        baselineEmissions: year.year === 0 ? baselineEmbodiedCarbon : baseOperationalEmissions,
        greenEmissions: year.year === 0 ? actualEmbodiedCarbon : finalOperationalEmissions,
        reduction: year.year === 0 ? embodiedCarbonReduction : operationalEmissionsReduction
      })),
      
      // Chart data
      chartData: {
        // Cash flow chart data
        cashFlowData: yearlyData.map(year => ({
          year: year.year,
          cashflow: year.year === 0 ? -greenBuildingPremium : totalOperationalSavings,
          cumulative: year.greenPremiumRemaining <= 0 ? 
            Math.abs(year.greenPremiumRemaining) : 
            -year.greenPremiumRemaining,
          isPositive: year.year > 0
        })),
        
        // Emissions breakdown chart
        emissionsBreakdown: chartData.emissionsBreakdown || [
          { name: 'Embodied Carbon Savings', value: embodiedCarbonReduction },
          { name: 'Annual Operational Savings', value: operationalEmissionsReduction },
          { name: 'Total Lifecycle Savings', value: totalEmissionsReduction }
        ],
        
        // Any other charts from the construction data
        ...chartData
      }
    };
  };

  // Format for saved configurations to be compatible with report generator
  const formattedSavedConfigurations = savedConfigurations.map(config => {
    // If config already has results, keep them; otherwise calculate
    if (!config.results) {
      const results = calculateConstructionResults(config);
      const transformedResults = transformConstructionDataToReportFormat(results);
      return { ...config, results: transformedResults };
    }
    return config;
  });

  return (
    <div>
      {/* Button to show the report generator */}
      <button 
        onClick={() => setShowReport(true)}
        className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
        type="button"
      >
        Generate Sustainability Report
      </button>
      
      {/* Report Generator Modal */}
      {showReport && reportData && (
        <ReportGenerator 
          isOpen={showReport}
          onClose={() => setShowReport(false)}
          results={reportData}
          projectType="construction"
          projectTypes={[
            { id: 'construction', name: 'Green Building Construction' }
          ]}
          scenarioName={scenarioName}
          buildingSize={buildingSize}
          selectedBuildingType={selectedBuildingType}
          carbonCreditPrice={carbonCreditPrice}
          projectYears={buildingLifespan}
          discountRate={discountRate}
          savedConfigurations={formattedSavedConfigurations}
        />
      )}
    </div>
  );
};

export default ConstructionReportBridge;