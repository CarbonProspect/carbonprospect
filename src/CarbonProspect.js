import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import ReportGenerator from './ReportGenerator';

// Import utility functions
import { formatCurrency, getProjectSizeLabel, getProjectTypeLabel } from './utils/formatters';
import { projectTypes } from './utils/projectData';
import { exportToExcel, shareProject, scrollToSection, generatePdfReport, loadSharedProject } from './utils/exportUtils';
import { 
  getAllIntegratedProducts, 
  getProductsByCategory, 
  applyProductToCalculation 
} from './utils/productIntegration';

// Import chart components
import { CashFlowChart, NPVChart, CostBreakdownChart } from './components/charts/ChartComponents';

// Import the emissions chart component
import LivestockEmissionsChart from './LivestockEmissionsChart.js';

// Import modal components
import { 
  CarbonPriceModal, 
  CustomTypeModal, 
  CostModal, 
  ScenarioManagementModal, 
  ScenarioComparison 
} from './components/modals/Modals';
import CarbonPriceEditor from './components/modals/CarbonPriceEditor';

// Import project type components and their calculation functions
import ForestryProject, { calculateForestryResults } from './components/projectTypes/ForestryProject';
import EnhancedLivestockProject from './components/projectTypes/EnhancedLivestockProject';
import { calculateEnhancedLivestockResults } from './livestockCalculations.js';
import SoilProject, { calculateSoilResults } from './components/projectTypes/SoilProject';
import RenewableProject, { calculateRenewableResults } from './components/projectTypes/RenewableProject';
import BlueCarbonProject, { calculateBlueCarbonResults } from './components/projectTypes/BlueCarbonProject';
import REDDProject, { calculateREDDResults } from './components/projectTypes/REDDProject';
import ConstructionProject from './components/projectTypes/ConstructionProject';

// Import new ScenarioManager component
import ScenarioManager from './ScenarioManager';

// Import scenario API functions - FIXED PATH
import { saveScenario, getScenarios, updateScenario, deleteScenario as deleteScenarioAPI } from './utils/scenarioAPI';
// Component definition and state variables
const CarbonProspect = ({ 
  projectId, 
  selectedProjectType, // Use the projectType passed from parent
  onProjectTypeChange, // Callback to update parent's projectType state
  initialScenarioName,
  currentScenarioId: externalScenarioId,
  onDataUpdate,
  onScenarioUpdated,
  refreshToken,
  onCreateNewScenario,
  // Add the following project properties as props
  projectSize: externalProjectSize,
  projectYears: externalProjectYears,
  discountRate: externalDiscountRate,
  carbonCreditPrice: externalCarbonCreditPrice,
  treeType: externalTreeType,
  herdSize: externalHerdSize,
  animalType: externalAnimalType,
  cattleType: externalCattleType,
  feedType: externalFeedType,
  capacityMW: externalCapacityMW,
  renewableType: externalRenewableType,
  soilType: externalSoilType,
  blueCarbonType: externalBlueCarbonType,
  reddForestType: externalReddForestType,
  buildingSize: externalBuildingSize,
  constructionCost: externalConstructionCost,
  operationalEmissions: externalOperationalEmissions,
  selectedBuildingType: externalSelectedBuildingType,
  results: externalResults
}) => {
  // Add these state variables at the beginning of your CarbonProspect component
  const [updateDebounceTimeout, setUpdateDebounceTimeout] = useState(null);
  const [scenarioNameUpdateTimeout, setScenarioNameUpdateTimeout] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Basic state variables
  const [scenarioName, setScenarioName] = useState(initialScenarioName || 'Base Case');
  const [projectType, setProjectType] = useState(selectedProjectType || 'forestry');
  const [projectSize, setProjectSize] = useState(100);
  const [carbonCreditPrice, setCarbonCreditPrice] = useState(50);
  const [projectYears, setProjectYears] = useState(30);
  const [discountRate, setDiscountRate] = useState(5);
  const [results, setResults] = useState(null);
  const [activeChartTab, setActiveChartTab] = useState('cashflow');
  // Scenario management state
  const [currentScenarioId, setCurrentScenarioId] = useState(externalScenarioId || null);
  const [showSummaryPanel, setShowSummaryPanel] = useState(false);
  const [refreshScenarios, setRefreshScenarios] = useState(0);
  
  // Carbon price by year state
  const [useYearlyCarbonPrices, setUseYearlyCarbonPrices] = useState(false);
  const [carbonPricesByYear, setCarbonPricesByYear] = useState([]);
  const [showCarbonPriceModal, setShowCarbonPriceModal] = useState(false);
  const [showCarbonPriceEditor, setShowCarbonPriceEditor] = useState(false);
  
  // NOW add the refs after all state declarations
  const prevProjectSize = useRef(projectSize);
  const prevProjectYears = useRef(projectYears);
  const prevDiscountRate = useRef(discountRate);
  const prevCarbonCreditPrice = useRef(carbonCreditPrice);
  const lastSentData = useRef(null);
  const isCalculating = useRef(false);
  const previousUseYearlyCarbonPrices = useRef(useYearlyCarbonPrices);

  // Refs to track user editing state
  const userIsEditing = useRef(false);
  
  // Project-specific state variables
  const [capacityMW, setCapacityMW] = useState(10); // For renewable energy
  const [herdSize, setHerdSize] = useState(1000); // For livestock
  // Enhanced project specifics
  const [treeType, setTreeType] = useState('pine');
  const [reddForestType, setReddForestType] = useState('tropical');
  const [cattleType, setCattleType] = useState('dairy');
  const [soilType, setSoilType] = useState('cropland');
  const [renewableType, setRenewableType] = useState('solar');
  const [blueCarbonType, setBlueCarbonType] = useState('mangrove');
  const [customSequestrationRate, setCustomSequestrationRate] = useState('');
  const [useCustomRate, setUseCustomRate] = useState(false);
  const [showCustomTypeModal, setShowCustomTypeModal] = useState(false);
  const [customTypeName, setCustomTypeName] = useState('');
  const [customTypeRate, setCustomTypeRate] = useState('');
  const [customTypeCategory, setCustomTypeCategory] = useState('forestry');
  const [customTypes, setCustomTypes] = useState({
    forestry: [],
    livestock: [],
    soil: [],
    renewable: [],
    bluecarbon: [],
    redd: []
  });
  // Enhanced Livestock state variables - original ones
  const [animalType, setAnimalType] = useState('cattle'); // Default value for livestock
  const [feedType, setFeedType] = useState('mixed');
  const [manureManagement, setManureManagement] = useState('standard');
  const [useEmissionReductionAdditives, setUseEmissionReductionAdditives] = useState(false);
  const [additiveEfficiency, setAdditiveEfficiency] = useState(20);
  const [grazingPractice, setGrazingPractice] = useState('continuous');
  const [regionClimate, setRegionClimate] = useState('temperate');

  // NEW Enhanced Livestock state variables
  const [calvingRate, setCalvingRate] = useState(60); 
  const [timeToCalfBefore, setTimeToCalfBefore] = useState(14);
  const [timeToCalfAfter, setTimeToCalfAfter] = useState(12);
  const [supplementationType, setSupplementationType] = useState('none');
  const [dietaryEnergyProfile, setDietaryEnergyProfile] = useState('medium');
  const [seasonalFeedChanges, setSeasonalFeedChanges] = useState('constant');
  const [customFeedMixture, setCustomFeedMixture] = useState('');
  const [useCustomFeedMixture, setUseCustomFeedMixture] = useState(false);
  // Cost management state
  const [costs, setCosts] = useState([
    { id: 1, name: 'Initial Investment', type: 'fixed', value: 50000, year: 1, description: 'Initial project setup costs' }
  ]);
  const [showAddCost, setShowAddCost] = useState(false);
  const [showEditCost, setShowEditCost] = useState(false);
  const [editingCost, setEditingCost] = useState(null);
  const [newCost, setNewCost] = useState({
    id: Date.now(),
    name: '',
    type: 'fixed',
    value: '',
    year: 1,
    description: ''
  });
  
  // Construction project state
  const [buildingSize, setBuildingSize] = useState(10000); // sqm
  const [constructionCost, setConstructionCost] = useState(2500); // per sqm
  const [operationalEmissions, setOperationalEmissions] = useState(30); // kg CO2e/sqm/year
  const [selectedBuildingType, setSelectedBuildingType] = useState({ name: 'Commercial Office', baselineEmissions: 650, size: 'sqm', lifespan: 50 });
  const [selectedMaterials, setSelectedMaterials] = useState({});
  const [selectedEnergyMeasures, setSelectedEnergyMeasures] = useState({});
  const [selectedWasteManagement, setSelectedWasteManagement] = useState(null);
  const [selectedCertification, setSelectedCertification] = useState(null);
  const [showCustomBuildingType, setShowCustomBuildingType] = useState(false);
  
  // Enhanced Construction state variables
  const [materialVolumes, setMaterialVolumes] = useState(null);
  const [landscapingOptions, setLandscapingOptions] = useState('standard');
  const [solarCapacity, setSolarCapacity] = useState(0);
  const [greenRoofArea, setGreenRoofArea] = useState(0);
  const [rainwaterHarvesting, setRainwaterHarvesting] = useState('standard');
  const [usesRecycledMaterials, setUsesRecycledMaterials] = useState(false);
  const [recycledContentPercentage, setRecycledContentPercentage] = useState(30);
  
  // Report generator state
  const [showReportGenerator, setShowReportGenerator] = useState(false);
  
  // Scenario management state
  const [savedConfigurations, setSavedConfigurations] = useState([
    {
      id: 1,
      name: 'Base Case (Pine, 100 ha)',
      projectType: 'forestry',
      projectSize: 100,
      carbonCreditPrice: 50,
      projectYears: 30,
      discountRate: 5,
      results: {
        totalSequestration: 22500,
        totalRevenue: 1125000,
        totalCost: 300000,
        netProfit: 825000,
        npv: 500000,
        irr: 25,
        breakEvenYear: 6
      }
    }
  ]);
  const [showScenarios, setShowScenarios] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonConfig, setComparisonConfig] = useState(null);
  
  // New state for ScenarioManager
  const [showScenarioManager, setShowScenarioManager] = useState(false);
  
  // Add state for selected products
  const [selectedProducts, setSelectedProducts] = useState({});

  // Loading state for saving scenarios
  const [loading, setLoading] = useState(false);
  // Complete initialization from props on mount
  useEffect(() => {
    // Complete initialization from props on mount
    console.log("Initializing CarbonProspect from props:", {
      projectId,
      selectedProjectType,
      initialScenarioName
    });
    
    // Set project type from props
    if (selectedProjectType) {
      setProjectType(selectedProjectType);
    }
    
    // Set scenario name from props
    if (initialScenarioName) {
      setScenarioName(initialScenarioName);
    }
    
    // Set scenario ID from props
    if (externalScenarioId) {
      setCurrentScenarioId(externalScenarioId);
    }
    
  }, []); // Empty dependency array means this runs once on mount
  
  // Effect to sync projectType with the parent component's selectedProjectType
  useEffect(() => {
    if (selectedProjectType && selectedProjectType !== projectType) {
      setProjectType(selectedProjectType);
    }
  }, [selectedProjectType]); // FIXED: Removed projectType from dependency array

  // Effect to sync currentScenarioId with external value
  useEffect(() => {
    if (externalScenarioId !== undefined && externalScenarioId !== currentScenarioId) {
      setCurrentScenarioId(externalScenarioId);
    }
  }, [externalScenarioId]); // FIXED: Removed currentScenarioId from dependency array

  // Effect to sync scenarioName with initialScenarioName
  useEffect(() => {
    if (initialScenarioName && initialScenarioName !== scenarioName) {
      setScenarioName(initialScenarioName);
    }
  }, [initialScenarioName]); // FIXED: Removed scenarioName from dependency array
  
  // Effect hooks to sync component state with parent props - FIXED VERSIONS
  
  // Project Size
  useEffect(() => {
    if (externalProjectSize !== undefined && 
        externalProjectSize !== 0 && 
        externalProjectSize !== projectSize) {
      console.log("Updating projectSize from props:", externalProjectSize);
      prevProjectSize.current = externalProjectSize;
      setProjectSize(externalProjectSize);
    }
  }, [externalProjectSize]); // FIXED: Removed projectSize from dependency array

  // Project Years
  useEffect(() => {
    if (externalProjectYears !== undefined && 
        externalProjectYears !== 0 && 
        externalProjectYears !== projectYears) {
      console.log("Updating projectYears from props:", externalProjectYears);
      prevProjectYears.current = externalProjectYears;
      setProjectYears(externalProjectYears);
    }
  }, [externalProjectYears]); // FIXED: Removed projectYears from dependency array

  // Discount Rate
  useEffect(() => {
    if (externalDiscountRate !== undefined && 
        externalDiscountRate !== discountRate) {
      console.log("Updating discountRate from props:", externalDiscountRate);
      prevDiscountRate.current = externalDiscountRate;
      setDiscountRate(externalDiscountRate);
    }
  }, [externalDiscountRate]); // FIXED: Removed discountRate from dependency array

  // Carbon Credit Price
  useEffect(() => {
    if (externalCarbonCreditPrice !== undefined && 
        externalCarbonCreditPrice !== 0 && 
        externalCarbonCreditPrice !== carbonCreditPrice) {
      console.log("Updating carbonCreditPrice from props:", externalCarbonCreditPrice);
      prevCarbonCreditPrice.current = externalCarbonCreditPrice;
      setCarbonCreditPrice(externalCarbonCreditPrice);
    }
  }, [externalCarbonCreditPrice]); // FIXED: Removed carbonCreditPrice from dependency array

  // Project type specific parameters
  useEffect(() => {
    if (externalTreeType && externalTreeType !== treeType) {
      console.log("Updating treeType from props:", externalTreeType);
      setTreeType(externalTreeType);
    }
  }, [externalTreeType]); // FIXED: Removed treeType from dependency array

  useEffect(() => {
    if (externalHerdSize !== undefined && 
        externalHerdSize !== 0 && 
        externalHerdSize !== herdSize) {
      console.log("Updating herdSize from props:", externalHerdSize);
      setHerdSize(externalHerdSize);
    }
  }, [externalHerdSize]); // FIXED: Removed herdSize from dependency array

  useEffect(() => {
    if (externalAnimalType && externalAnimalType !== animalType) {
      console.log("Updating animalType from props:", externalAnimalType);
      setAnimalType(externalAnimalType);
    }
  }, [externalAnimalType]); // FIXED: Removed animalType from dependency array

  useEffect(() => {
    if (externalCattleType && externalCattleType !== cattleType) {
      console.log("Updating cattleType from props:", externalCattleType);
      setCattleType(externalCattleType);
    }
  }, [externalCattleType]); // FIXED: Removed cattleType from dependency array

  useEffect(() => {
    if (externalFeedType && externalFeedType !== feedType) {
      console.log("Updating feedType from props:", externalFeedType);
      setFeedType(externalFeedType);
    }
  }, [externalFeedType]); // FIXED: Removed feedType from dependency array

  useEffect(() => {
    if (externalCapacityMW !== undefined && 
        externalCapacityMW !== 0 && 
        externalCapacityMW !== capacityMW) {
      console.log("Updating capacityMW from props:", externalCapacityMW);
      setCapacityMW(externalCapacityMW);
    }
  }, [externalCapacityMW]); // FIXED: Removed capacityMW from dependency array

  useEffect(() => {
    if (externalRenewableType && externalRenewableType !== renewableType) {
      console.log("Updating renewableType from props:", externalRenewableType);
      setRenewableType(externalRenewableType);
    }
  }, [externalRenewableType]); // FIXED: Removed renewableType from dependency array

  useEffect(() => {
    if (externalSoilType && externalSoilType !== soilType) {
      console.log("Updating soilType from props:", externalSoilType);
      setSoilType(externalSoilType);
    }
  }, [externalSoilType]); // FIXED: Removed soilType from dependency array

  useEffect(() => {
    if (externalBlueCarbonType && externalBlueCarbonType !== blueCarbonType) {
      console.log("Updating blueCarbonType from props:", externalBlueCarbonType);
      setBlueCarbonType(externalBlueCarbonType);
    }
  }, [externalBlueCarbonType]); // FIXED: Removed blueCarbonType from dependency array

  useEffect(() => {
    if (externalReddForestType && externalReddForestType !== reddForestType) {
      console.log("Updating reddForestType from props:", externalReddForestType);
      setReddForestType(externalReddForestType);
    }
  }, [externalReddForestType]); // FIXED: Removed reddForestType from dependency array
  
  useEffect(() => {
    if (externalBuildingSize !== undefined && 
        externalBuildingSize !== 0 && 
        externalBuildingSize !== buildingSize) {
      console.log("Updating buildingSize from props:", externalBuildingSize);
      setBuildingSize(externalBuildingSize);
    }
  }, [externalBuildingSize]); // FIXED: Removed buildingSize from dependency array

  useEffect(() => {
    if (externalConstructionCost !== undefined && 
        externalConstructionCost !== 0 && 
        externalConstructionCost !== constructionCost) {
      console.log("Updating constructionCost from props:", externalConstructionCost);
      setConstructionCost(externalConstructionCost);
    }
  }, [externalConstructionCost]); // FIXED: Removed constructionCost from dependency array

  useEffect(() => {
    if (externalOperationalEmissions !== undefined && 
        externalOperationalEmissions !== operationalEmissions) {
      console.log("Updating operationalEmissions from props:", externalOperationalEmissions);
      setOperationalEmissions(externalOperationalEmissions);
    }
  }, [externalOperationalEmissions]); // FIXED: Removed operationalEmissions from dependency array

  useEffect(() => {
    if (externalSelectedBuildingType && 
        JSON.stringify(externalSelectedBuildingType) !== JSON.stringify(selectedBuildingType)) {
      console.log("Updating selectedBuildingType from props:", externalSelectedBuildingType);
      setSelectedBuildingType(externalSelectedBuildingType);
    }
  }, [externalSelectedBuildingType]); // FIXED: Removed selectedBuildingType from dependency array

  // If results are passed directly, use them
  useEffect(() => {
    if (externalResults && 
        JSON.stringify(externalResults) !== JSON.stringify(results)) {
      console.log("Updating results from props:", externalResults);
      setResults(externalResults);
    }
  }, [externalResults]); // FIXED: Removed results from dependency array
  // Debounced update function to avoid excessive API calls
  const debouncedUpdateScenario = (projectId, scenarioId, scenarioData) => {
    // Clear any existing timeout
    if (updateDebounceTimeout) {
      clearTimeout(updateDebounceTimeout);
    }
    
    // Create a complete scenario object with ALL parameters regardless of current project type
    const completeScenarioData = {
      name: scenarioData.name,
      projectType: scenarioData.projectType,
      // Common parameters
      projectSize: scenarioData.projectSize,
      projectYears: scenarioData.projectYears,
      discountRate: scenarioData.discountRate,
      carbonCreditPrice: scenarioData.carbonCreditPrice,
      useYearlyCarbonPrices: scenarioData.useYearlyCarbonPrices,
      carbonPricesByYear: scenarioData.carbonPricesByYear,
      // Always include ALL project-specific parameters for ALL types
      // This ensures they're available when switching scenarios
      treeType: scenarioData.treeType,
      herdSize: scenarioData.herdSize,
      animalType: scenarioData.animalType,
      cattleType: scenarioData.cattleType,
      feedType: scenarioData.feedType,
      manureManagement: scenarioData.manureManagement,
      useEmissionReductionAdditives: scenarioData.useEmissionReductionAdditives,
      additiveEfficiency: scenarioData.additiveEfficiency,
      grazingPractice: scenarioData.grazingPractice,
      regionClimate: scenarioData.regionClimate,
      calvingRate: scenarioData.calvingRate,
      timeToCalfBefore: scenarioData.timeToCalfBefore,
      timeToCalfAfter: scenarioData.timeToCalfAfter,
      supplementationType: scenarioData.supplementationType,
      dietaryEnergyProfile: scenarioData.dietaryEnergyProfile,
      seasonalFeedChanges: scenarioData.seasonalFeedChanges,
      customFeedMixture: scenarioData.customFeedMixture,
      useCustomFeedMixture: scenarioData.useCustomFeedMixture,
      capacityMW: scenarioData.capacityMW,
      renewableType: scenarioData.renewableType,
      soilType: scenarioData.soilType,
      blueCarbonType: scenarioData.blueCarbonType,
      reddForestType: scenarioData.reddForestType,
      buildingSize: scenarioData.buildingSize,
      constructionCost: scenarioData.constructionCost,
      operationalEmissions: scenarioData.operationalEmissions,
      selectedBuildingType: scenarioData.selectedBuildingType,
      // Include costs and user selections
      costs: scenarioData.costs,
      customTypes: scenarioData.customTypes,
      selectedProducts: scenarioData.selectedProducts,
      
      // Include the calculation results
      results: scenarioData.results
    };
    
    console.log("Updating scenario with ALL parameters:", completeScenarioData);
    
    // Set a new timeout with the complete data
    setUpdateDebounceTimeout(setTimeout(() => {
      updateScenario(projectId, scenarioId, completeScenarioData)
        .then(result => {
          if (result.success) {
            console.log("Successfully updated scenario with new results");
            // Reset unsaved changes flag
            setHasUnsavedChanges(false);
            // Notify parent component
            if (onScenarioUpdated) {
              onScenarioUpdated();
            }
          } else {
            console.error("Failed to update scenario results:", result.error);
          }
        })
        .catch(err => {
          console.error("Error updating scenario results:", err);
        });
    }, 2000)); // 2 second debounce
  };
  
  // Manual save function
  const handleManualSave = async () => {
    if (!currentScenarioId || !projectId) {
      console.error("Cannot save: No scenario ID or project ID available");
      return;
    }
    
    setLoading(true);
    
    try {
      // Get the current scenario data
      const currentScenarioData = {
        name: scenarioName,
        projectType: projectType,
        projectSize,
        projectYears,
        discountRate,
        carbonCreditPrice,
        // Other relevant data based on project type
        ...(projectType === 'forestry' && { treeType }),
        ...(projectType === 'livestock' && { 
          herdSize, 
          animalType,
          cattleType,
          feedType,
          manureManagement,
          useEmissionReductionAdditives,
          additiveEfficiency,
          grazingPractice,
          regionClimate,
          calvingRate,
          timeToCalfBefore,
          timeToCalfAfter,
          supplementationType,
          dietaryEnergyProfile,
          seasonalFeedChanges,
          customFeedMixture,
          useCustomFeedMixture
        }),
        ...(projectType === 'soil' && { soilType }),
        ...(projectType === 'renewable' && { 
          capacityMW, 
          renewableType 
        }),
        ...(projectType === 'bluecarbon' && { blueCarbonType }),
        ...(projectType === 'redd' && { reddForestType }),
        ...(projectType === 'construction' && { 
          buildingSize, 
          constructionCost, 
          operationalEmissions,
          selectedBuildingType,
          selectedMaterials,
          selectedEnergyMeasures,
          selectedWasteManagement,
          selectedCertification,
          materialVolumes,
          landscapingOptions,
          solarCapacity,
          greenRoofArea,
          rainwaterHarvesting,
          usesRecycledMaterials,
          recycledContentPercentage
        }),
        
        // Include costs and user selections
        costs,
        selectedProducts,
        useYearlyCarbonPrices,
        carbonPricesByYear,
        
        // Include the current calculation results
        results: results
      };
      
      console.log("Manually saving scenario data:", currentScenarioData);
      
      // Call the API to update the scenario
      const result = await updateScenario(projectId, currentScenarioId, currentScenarioData);
      
      if (result.success) {
        console.log("Successfully saved scenario manually");
        setHasUnsavedChanges(false);
        
        // Notify parent component
        if (onScenarioUpdated) {
          onScenarioUpdated();
        }
        
        // Show success message
        alert("Scenario saved successfully!");
      } else {
        console.error("Failed to save scenario:", result.error);
        alert(`Failed to save scenario: ${result.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("Error saving scenario:", err);
      alert(`Error saving scenario: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Handler for calculation results - Modified to not auto-save
  const handleCalculationResults = (calculationResults) => {
    console.log("New calculation results:", calculationResults);
    
    // Only proceed if we have actual changes in results
    if (JSON.stringify(calculationResults) !== JSON.stringify(results)) {
      // Update the local state with the calculation results
      setResults(calculationResults);
      
      // If we have a current scenario ID, mark as having unsaved changes instead of auto-saving
      if (currentScenarioId && projectId) {
        console.log(`Scenario ${currentScenarioId} has unsaved changes`);
        setHasUnsavedChanges(true);
      }
      
      // Notify parent component of the results update - using deep comparison
      if (onDataUpdate) {
        const newData = {
          scenarioName,
          projectType,
          totalSequestration: calculationResults.totalSequestration,
          results: calculationResults,
          projectSize,
          projectYears,
          discountRate,
          carbonCreditPrice,
          // Project type specific parameters
          ...(projectType === 'forestry' && { treeType }),
          ...(projectType === 'livestock' && { 
            herdSize, 
            animalType,
            cattleType 
          }),
          ...(projectType === 'renewable' && { 
            capacityMW, 
            renewableType 
          }),
          ...(projectType === 'soil' && { soilType }),
          ...(projectType === 'bluecarbon' && { blueCarbonType }),
          ...(projectType === 'redd' && { reddForestType }),
          ...(projectType === 'construction' && { 
            buildingSize, 
            constructionCost, 
            operationalEmissions,
            selectedBuildingType
          })
        };
        
        const newDataString = JSON.stringify(newData);
        if (newDataString !== JSON.stringify(lastSentData.current)) {
          console.log("Sending updated data to parent");
          lastSentData.current = JSON.parse(newDataString); // Store deep copy
          onDataUpdate(newData);
        }
      }
    }
  };
  
  // Memoize chart data to avoid conditional hook calls
  const memoizedCashFlowData = useMemo(() => 
    results?.chartData?.cashFlowData || [],
    [results?.chartData?.cashFlowData]
  );
  
  const memoizedNpvData = useMemo(() => 
    results?.chartData?.npvData || [],
    [results?.chartData?.npvData]
  );
  
  const memoizedCostBreakdownData = useMemo(() => 
    results?.chartData?.costBreakdownData || [],
    [results?.chartData?.costBreakdownData]
  );
  
  const memoizedEmissionsBreakdown = useMemo(() => 
    results?.chartData?.emissionsBreakdown || [],
    [results?.chartData?.emissionsBreakdown]
  );

  // Replace multiple carbon price useEffect hooks with a single hook
  useEffect(() => {
    // Only proceed if there's a change in relevant states
    const shouldUpdate = projectYears !== carbonPricesByYear.length ||
      carbonPricesByYear.length === 0 ||
      useYearlyCarbonPrices !== previousUseYearlyCarbonPrices.current;
    
    if (!shouldUpdate) return;
    
    // Update reference for comparison
    previousUseYearlyCarbonPrices.current = useYearlyCarbonPrices;
    
    // Create proper length array with appropriate prices
    const newPrices = Array.from({ length: projectYears }, (_, i) => {
      const year = i + 1;
      // When using yearly prices and we have an existing price, keep it
      if (useYearlyCarbonPrices && i < carbonPricesByYear.length) {
        return carbonPricesByYear[i];
      }
      // Otherwise use the default pricing structure (base + yearly increase)
      return { 
        year, 
        price: carbonCreditPrice + (i * 1)  // Default increasing price
      };
    });
    
    setCarbonPricesByYear(newPrices);
  }, [projectYears, useYearlyCarbonPrices, carbonCreditPrice, carbonPricesByYear.length]);
  
  // Check for shared configuration on component mount
  useEffect(() => {
    const sharedConfig = loadSharedProject();
    if (sharedConfig) {
      // Load shared configuration
      setScenarioName(sharedConfig.scenarioName || 'Shared Scenario');
      setProjectType(sharedConfig.projectType || 'forestry');
      setProjectSize(sharedConfig.projectSize || 100);
      setCarbonCreditPrice(sharedConfig.carbonCreditPrice || 50);
      setProjectYears(sharedConfig.projectYears || 30);
      setDiscountRate(sharedConfig.discountRate || 5);
      
      // Load project-specific parameters
      if (sharedConfig.projectType === 'forestry' && sharedConfig.treeType) {
        setTreeType(sharedConfig.treeType);
      } else if (sharedConfig.projectType === 'livestock') {
        if (sharedConfig.herdSize) setHerdSize(sharedConfig.herdSize);
        if (sharedConfig.cattleType) setCattleType(sharedConfig.cattleType);
      } else if (sharedConfig.projectType === 'renewable') {
        if (sharedConfig.capacityMW) setCapacityMW(sharedConfig.capacityMW);
        if (sharedConfig.renewableType) setRenewableType(sharedConfig.renewableType);
      }
      
      // Alert user that a shared configuration was loaded
      alert('A shared project configuration has been loaded!');
    }
  }, []);

  // Initialize projectId from localStorage or other source if available
  useEffect(() => {
    // For example, you might get this from localStorage or your app state
    const storedProjectId = localStorage.getItem('currentProjectId');
    if (storedProjectId) {
      // NOTE: We don't need to set projectId here since it's passed as a prop
      // Just log for debugging
      console.log('Found stored project ID:', storedProjectId);
    }
  }, []);
  
  // Add this useEffect to load saved scenarios when projectId changes
  useEffect(() => {
    const loadSavedScenarios = async () => {
      if (!projectId) {
        console.log('Cannot load scenarios - no project ID available');
        return;
      }
      
      try {
        console.log('Loading scenarios for project ID:', projectId);
        
        // Use the getScenarios function from your scenarioAPI
        const result = await getScenarios(projectId);
        
        if (result.success && result.data && result.data.length > 0) {
          console.log('Successfully loaded scenarios:', result.data);
          
          // Transform the scenarios to match your expected format
          const formattedScenarios = result.data.map(scenario => {
            // Extract scenario data - handle potential different formats
            const scenarioData = scenario.data || scenario;
            
            return {
              id: scenario.id,
              name: scenario.name || 'Unnamed Scenario',
              projectType: scenarioData.projectType || 'forestry',
              // Extract specific project parameters
              projectSize: scenarioData.projectSize,
              carbonCreditPrice: scenarioData.carbonCreditPrice,
              projectYears: scenarioData.projectYears,
              discountRate: scenarioData.discountRate,
              // Extract conditional project type parameters
              ...(scenarioData.treeType && { treeType: scenarioData.treeType }),
              ...(scenarioData.herdSize && { herdSize: scenarioData.herdSize }),
              ...(scenarioData.capacityMW && { capacityMW: scenarioData.capacityMW }),
              // Include costs and results
              costs: scenarioData.costs || [],
              results: scenario.results || scenarioData.results || null
            };
          });
          
          console.log('Formatted scenarios:', formattedScenarios);
          setSavedConfigurations(formattedScenarios);
        } else {
          console.log('No scenarios found or error fetching scenarios');
          if (result.error) {
            console.error('Error from API:', result.error);
          }
        }
      } catch (err) {
        console.error('Error loading scenarios:', err);
      }
    };
    
    // Only try to load scenarios if we have a projectId
    if (projectId) {
      loadSavedScenarios();
    }
  }, [projectId]); // Run this whenever projectId changes
  
  // Warning when navigating away with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        const message = "You have unsaved changes. Are you sure you want to leave?";
        e.returnValue = message; // Standard for most browsers
        return message; // For some older browsers
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);
  // New function to calculate construction results without carbon credits
  const calculateConstructionResults = (params) => {
    // Construction projects don't generate carbon credits
    // Instead they focus on emissions reduction and cost savings
    
    const results = params.constructionEmissions || {};
    
    return {
      // Emissions data
      totalSequestration: 0, // Construction doesn't sequester
      baselineEmbodied: results.baselineEmbodied || 0,
      reducedEmbodied: results.reducedEmbodied || 0,
      embodiedSavings: results.embodiedSavings || 0,
      baseOperational: results.baseOperational || 0,
      finalOperational: results.finalOperational || 0,
      operationalSavings: results.operationalSavings || 0,
      lifetimeSavings: results.lifetimeSavings || 0,
      
      // Financial data (construction cost savings, not carbon revenue)
      totalRevenue: 0, // No carbon credit revenue
      totalCost: results.greenBuildingPremium || 0,
      netProfit: results.annualSavings ? (results.annualSavings * 20) - (results.greenBuildingPremium || 0) : 0,
      npv: 0, // Simplified - construction component handles its own financial calcs
      irr: 0, // Simplified
      roi: results.simplePayback ? (100 / results.simplePayback) : 0,
      breakEvenYear: results.simplePayback || 'N/A',
      
      // Construction-specific results
      standardConstructionCost: results.standardConstructionCost || 0,
      greenBuildingPremium: results.greenBuildingPremium || 0,
      annualSavings: results.annualSavings || 0,
      simplePayback: results.simplePayback || 999,
      buildingLifespan: results.buildingLifespan || 50,
      
      // Chart data
      yearlyData: results.yearlyData || [],
      chartData: {
        cashFlowData: results.yearlyData || [],
        npvData: [], // Not applicable for construction
        costBreakdownData: results.emissionsBreakdown || [],
        emissionsBreakdown: results.emissionsBreakdown || []
      }
    };
  };
  
  // Calculate results whenever inputs change - Modified for unsaved changes tracking
  const calculateResults = useCallback(() => {
    if (!projectType) return null;
    
    // Special handling for construction projects
    if (projectType === 'construction') {
      // Get the construction component's results directly
      // The ConstructionProject component handles its own calculations
      return null; // Will be set by the construction component
    }
    
    let calculationParams = {
      // Base calculation params based on project type
      ...(projectType === 'forestry' && {
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
      }),
      ...(projectType === 'livestock' && {
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
        reproductiveImprovementCosts: {
          type: 'annual_per_head',
          value: 5
        }
      }),
      ...(projectType === 'soil' && {
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
      }),
      ...(projectType === 'renewable' && {
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
      }),
      ...(projectType === 'bluecarbon' && {
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
      }),
      ...(projectType === 'redd' && {
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
      })
    };
    
    // Apply selected products to calculation parameters
    if (Object.keys(selectedProducts).length > 0) {
      Object.keys(selectedProducts).forEach(productId => {
        calculationParams = applyProductToCalculation(productId, calculationParams);
      });
    }
    
    let calculatedResults;
    
    // Call the appropriate calculation function based on project type
    switch(projectType) {
      case 'forestry':
        calculatedResults = calculateForestryResults(calculationParams);
        break;
      case 'livestock':
        calculatedResults = calculateEnhancedLivestockResults(calculationParams);
        break;
      case 'soil':
        calculatedResults = calculateSoilResults(calculationParams);
        break;
      case 'renewable':
        calculatedResults = calculateRenewableResults(calculationParams);
        break;
      case 'bluecarbon':
        calculatedResults = calculateBlueCarbonResults(calculationParams);
        break;
      case 'redd':
        calculatedResults = calculateREDDResults(calculationParams);
        break;
      default:
        // For now, return a placeholder result for unimplemented project types
        calculatedResults = {
          totalSequestration: 0,
          totalRevenue: 0,
          totalCost: 0,
          netProfit: 0,
          npv: 0,
          irr: 0,
          roi: 0,
          breakEvenYear: 'N/A',
          yearlyData: [],
          chartData: {
            cashFlowData: [],
            npvData: [],
            costBreakdownData: []
          }
        };
    }
    
    // Add selected products to results for reporting
    if (Object.keys(selectedProducts).length > 0) {
      calculatedResults.selectedProducts = Object.values(selectedProducts).map(product => ({
        id: product.id,
        name: product.name,
        company: product.company,
        category: product.category,
        emissionsReduction: product.emissionsReduction
      }));
    }
    
    return calculatedResults;
  }, [
    projectType, projectSize, capacityMW, herdSize,
    discountRate, costs, treeType, cattleType,
    soilType, renewableType, blueCarbonType, reddForestType,
    useCustomRate, customSequestrationRate, customTypes,
    projectYears, carbonCreditPrice, useYearlyCarbonPrices, carbonPricesByYear,
    // Existing livestock parameters
    feedType, manureManagement, useEmissionReductionAdditives, additiveEfficiency,
    grazingPractice, regionClimate,
    // New enhanced livestock parameters
    animalType, calvingRate, timeToCalfBefore, timeToCalfAfter, supplementationType,
    dietaryEnergyProfile, seasonalFeedChanges, customFeedMixture, useCustomFeedMixture,
    // Add selected products as a dependency
    selectedProducts
  ]);
  
  // Update results when inputs change - Modified to track unsaved changes
  useEffect(() => {
    if (!projectType || isCalculating.current || projectType === 'construction') return;
    
    isCalculating.current = true;
    
    // Debounce the calculation
    const timer = setTimeout(() => {
      console.log("Calculating results after debounce");
      const newResults = calculateResults();
      
      // Instead of auto-saving, just track that we have unsaved changes
      if (newResults) {
        handleCalculationResults(newResults);
        
        // Mark that we have unsaved changes if a scenario is loaded
        if (currentScenarioId) {
          setHasUnsavedChanges(true);
        }
      }
      
      isCalculating.current = false;
    }, 300); // 300ms debounce
    
    return () => {
      clearTimeout(timer);
      isCalculating.current = false;
    };
  }, [calculateResults, projectType, currentScenarioId]);
  
  // Consolidated cost management object
  const costManager = {
    add: (cost) => {
      if (!cost.name || !cost.value || isNaN(parseFloat(cost.value))) {
        return false;
      }
      
      const costToAdd = {
        ...cost,
        id: Date.now(),
        value: parseFloat(cost.value),
        year: parseInt(cost.year) || 1
      };
      
      setCosts(prev => [...prev, costToAdd]);
      setShowAddCost(false);
      
      // Reset the form
      setNewCost({
        id: Date.now() + 1,
        name: '',
        type: 'fixed',
        value: '',
        year: 1,
        description: ''
      });
      
      // Mark as having unsaved changes
      setHasUnsavedChanges(true);
      
      return true;
    },
    
    update: (cost) => {
      if (!cost.name || !cost.value || isNaN(parseFloat(cost.value))) {
        return false;
      }
      
      setCosts(prev => prev.map(c => 
        c.id === cost.id ? {
          ...cost,
          value: parseFloat(cost.value),
          year: parseInt(cost.year) || 1
        } : c
      ));
      
      setShowEditCost(false);
      setEditingCost(null);
      
      // Mark as having unsaved changes
      setHasUnsavedChanges(true);
      
      return true;
    },
    
    remove: (id) => {
      setCosts(prev => prev.filter(cost => cost.id !== id));
      
      // Mark as having unsaved changes
      setHasUnsavedChanges(true);
    },
    
    prepareForEdit: (cost) => {
      setEditingCost(cost);
      setShowEditCost(true);
    }
  };
  
  // Unified function to handle scenario loading
  const handleLoadScenario = (scenario) => {
    // Extract data from server response format
    const unwrappedScenario = scenario.scenario || scenario;
    const scenarioData = unwrappedScenario.data || unwrappedScenario;
    
    console.log("Loading scenario with data:", scenarioData);
    
    // IMPORTANT: DO NOT reset values to defaults first
    // Just set the project type immediately
    const newProjectType = scenarioData.projectType || 'forestry';
    handleProjectTypeChange(newProjectType);
    
    // Set the scenario name
    setScenarioName(unwrappedScenario.name || scenarioData.name || 'Loaded Scenario');
    
    // Set all scenario values BEFORE applying any defaults
    if (scenarioData.projectSize !== undefined) setProjectSize(scenarioData.projectSize);
    if (scenarioData.carbonCreditPrice !== undefined) setCarbonCreditPrice(scenarioData.carbonCreditPrice);
    if (scenarioData.projectYears !== undefined) setProjectYears(scenarioData.projectYears);
    if (scenarioData.discountRate !== undefined) setDiscountRate(scenarioData.discountRate);
    
    // Project-specific parameters
    if (scenarioData.treeType) setTreeType(scenarioData.treeType);
    if (scenarioData.herdSize !== undefined) setHerdSize(scenarioData.herdSize);
    if (scenarioData.animalType) setAnimalType(scenarioData.animalType);
    if (scenarioData.cattleType) setCattleType(scenarioData.cattleType);
    if (scenarioData.feedType) setFeedType(scenarioData.feedType);
    if (scenarioData.manureManagement) setManureManagement(scenarioData.manureManagement);
    if (scenarioData.useEmissionReductionAdditives !== undefined) setUseEmissionReductionAdditives(scenarioData.useEmissionReductionAdditives);
    if (scenarioData.additiveEfficiency !== undefined) setAdditiveEfficiency(scenarioData.additiveEfficiency);
    if (scenarioData.grazingPractice) setGrazingPractice(scenarioData.grazingPractice);
    if (scenarioData.regionClimate) setRegionClimate(scenarioData.regionClimate);
    // More parameters
    if (scenarioData.calvingRate !== undefined) setCalvingRate(scenarioData.calvingRate);
    if (scenarioData.timeToCalfBefore !== undefined) setTimeToCalfBefore(scenarioData.timeToCalfBefore);
    if (scenarioData.timeToCalfAfter !== undefined) setTimeToCalfAfter(scenarioData.timeToCalfAfter);
    if (scenarioData.supplementationType) setSupplementationType(scenarioData.supplementationType);
    if (scenarioData.dietaryEnergyProfile) setDietaryEnergyProfile(scenarioData.dietaryEnergyProfile);
    if (scenarioData.seasonalFeedChanges) setSeasonalFeedChanges(scenarioData.seasonalFeedChanges);
    if (scenarioData.customFeedMixture) setCustomFeedMixture(scenarioData.customFeedMixture);
    if (scenarioData.useCustomFeedMixture !== undefined) setUseCustomFeedMixture(scenarioData.useCustomFeedMixture);
    
    if (scenarioData.capacityMW !== undefined) setCapacityMW(scenarioData.capacityMW);
    if (scenarioData.renewableType) setRenewableType(scenarioData.renewableType);
    
    if (scenarioData.soilType) setSoilType(scenarioData.soilType);
    if (scenarioData.blueCarbonType) setBlueCarbonType(scenarioData.blueCarbonType);
    if (scenarioData.reddForestType) setReddForestType(scenarioData.reddForestType);
    
    if (scenarioData.buildingSize !== undefined) setBuildingSize(scenarioData.buildingSize);
    if (scenarioData.constructionCost !== undefined) setConstructionCost(scenarioData.constructionCost);
    if (scenarioData.operationalEmissions !== undefined) setOperationalEmissions(scenarioData.operationalEmissions);
    if (scenarioData.selectedBuildingType) setSelectedBuildingType(scenarioData.selectedBuildingType);
    
    // Other properties
    if (scenarioData.useYearlyCarbonPrices !== undefined) {
      setUseYearlyCarbonPrices(scenarioData.useYearlyCarbonPrices);
      if (scenarioData.carbonPricesByYear && scenarioData.carbonPricesByYear.length) {
        setCarbonPricesByYear(scenarioData.carbonPricesByYear);
      }
    }
    
    // Load costs if available
    if (scenarioData.costs) {
      setCosts(scenarioData.costs);
    }
    
    // Set custom types if available
    if (scenarioData.customTypes) {
      setCustomTypes(scenarioData.customTypes);
    }
    
    // Set selected products if available
    if (scenarioData.selectedProducts) {
      setSelectedProducts(scenarioData.selectedProducts);
    }
    
    // Set results
    if (scenarioData.results) {
      setResults(scenarioData.results);
    }
    
    // Set scenario ID if available
    if (unwrappedScenario.id) {
      setCurrentScenarioId(unwrappedScenario.id);
      if (onScenarioUpdated) {
        onScenarioUpdated(unwrappedScenario.id);
      }
    }
    
    // Reset unsaved changes flag
    setHasUnsavedChanges(false);
    
    // Close modals
    setShowComparison(false);
    setShowScenarioManager(false);
    
    // Force recalculation
    setTimeout(() => {
      const newResults = calculateResults();
      if (newResults) {
        handleCalculationResults(newResults);
        setHasUnsavedChanges(false); // Don't flag initial calculation as unsaved change
      }
    }, 100);
  };
  
  // Function to handle scenario save
  const handleSaveScenario = async (name = null) => {
    if (!results && projectType !== 'construction') {
      alert('Please calculate results before saving a scenario.');
      return;
    }
    
    // Check if we have a project ID
    if (!projectId) {
      console.error('Cannot save scenario: No project ID available');
      alert('Unable to save scenario - no project ID available. Please try refreshing the page.');
      return;
    }
    
    // Show saving indicator
    setLoading(true);
    
    try {
      // Create a complete scenario object with ALL parameters regardless of current project type
      const completeScenarioData = {
        name: name || scenarioName,
        projectType: projectType,
        // Common parameters
        projectSize: projectSize,
        carbonCreditPrice: carbonCreditPrice,
        projectYears: projectYears,
        discountRate: discountRate,
        useYearlyCarbonPrices: useYearlyCarbonPrices,
        carbonPricesByYear: carbonPricesByYear,
        // Always include ALL project-specific parameters for ALL types
        // This ensures they're available when switching scenarios
        treeType: treeType,
        herdSize: herdSize,
        animalType: animalType,
        cattleType: cattleType,
        feedType: feedType,
        manureManagement: manureManagement,
        useEmissionReductionAdditives: useEmissionReductionAdditives,
        additiveEfficiency: additiveEfficiency,
        grazingPractice: grazingPractice,
        regionClimate: regionClimate,
        calvingRate: calvingRate,
        timeToCalfBefore: timeToCalfBefore,
        timeToCalfAfter: timeToCalfAfter,
        supplementationType: supplementationType,
        dietaryEnergyProfile: dietaryEnergyProfile,
        seasonalFeedChanges: seasonalFeedChanges,
        customFeedMixture: customFeedMixture,
        useCustomFeedMixture: useCustomFeedMixture,
        capacityMW: capacityMW,
        renewableType: renewableType,
        soilType: soilType,
        blueCarbonType: blueCarbonType,
        reddForestType: reddForestType,
        buildingSize: buildingSize,
        constructionCost: constructionCost,
        operationalEmissions: operationalEmissions,
        selectedBuildingType: selectedBuildingType,
        // Include costs and custom types
        costs: costs,
        customTypes: customTypes,
        // Include selected products
        selectedProducts: selectedProducts,
        
        // Save the full results
        results: results
      };
      
      console.log("Saving scenario with ALL parameters:", completeScenarioData);
      
      // Use imported saveScenario function to save to server
      const result = await saveScenario(projectId, completeScenarioData);
      
      if (result.success) {
        console.log('Scenario saved successfully:', result.data);
        
        // Update local state with the new scenario including the server-generated ID
        const newScenario = {
          ...completeScenarioData,
          id: result.data.id || Date.now() // Use server ID if available, fallback to timestamp
        };
        
        setSavedConfigurations([...savedConfigurations, newScenario]);
        
        // Set current scenario ID
        if (result.data.id) {
          setCurrentScenarioId(result.data.id);
          // Notify parent component
          if (onScenarioUpdated) {
            onScenarioUpdated(result.data.id);
          }
        }
        
        // Reset unsaved changes flag
        setHasUnsavedChanges(false);
        
        // Trigger a refresh of scenarios
        setRefreshScenarios(prev => prev + 1);
        
        // Show success message
        alert(`Scenario "${completeScenarioData.name}" saved successfully!`);
        
        // Return the result to allow additional handling
        return { success: true, data: newScenario };
      } else {
        console.error('Failed to save scenario:', result.error);
        alert(`Failed to save scenario: ${result.error || 'Unknown error'}`);
        return { success: false, error: result.error };
      }
    } catch (err) {
      console.error('Error in saveScenario:', err);
      alert('An error occurred while saving the scenario. Please check the console for details.');
      return { success: false, error: err.message };
    } finally {
      setLoading(false); // Clear loading indicator
    }
  };
  
  // Handle delete scenario 
  const handleDeleteScenario = async (scenarioId) => {
    // First confirm with the user
    if (!window.confirm('Are you sure you want to delete this scenario? This action cannot be undone.')) {
      return { success: false, canceled: true };
    }
    
    try {
      // Use the API to delete the scenario
      const result = await deleteScenarioAPI(projectId, scenarioId);
      
      if (result.success) {
        // Update the local state
        setSavedConfigurations(prev => prev.filter(config => config.id !== scenarioId));
        
        // If comparing with the deleted scenario, close comparison
        if (comparisonConfig && comparisonConfig.id === scenarioId) {
          setComparisonConfig(null);
          setShowComparison(false);
        }
        
        // If current scenario was deleted, reset current ID
        if (currentScenarioId === scenarioId) {
          setCurrentScenarioId(null);
          // Reset unsaved changes flag
          setHasUnsavedChanges(false);
        }
        
        // Trigger refresh
        setRefreshScenarios(prev => prev + 1);
        
        // Notify parent component
        if (onScenarioUpdated) {
          onScenarioUpdated(null);
        }
        
        return { success: true };
      } else {
        console.error('Failed to delete scenario:', result.error);
        alert(`Failed to delete scenario: ${result.error || 'Unknown error'}`);
        return { success: false, error: result.error };
      }
    } catch (err) {
      console.error('Error deleting scenario:', err);
      alert('An error occurred while deleting the scenario. Please check the console for details.');
      return { success: false, error: err.message };
    }
  };
  
  // Function to compare scenarios
  const compareScenario = (scenario) => {
    setComparisonConfig(scenario);
    setShowComparison(true);
  };

  // Helper function to reset project-specific state when changing project type
  // Helper function to reset project-specific state when changing project type
  const handleProjectTypeChange = (newType) => {
    setProjectType(newType);
    
    // Notify the parent component
    if (onProjectTypeChange) {
      onProjectTypeChange(newType);
    }
    
    // Reset results when changing project type
    setResults(null);
    
    // Update scenario name based on project type
    const projectTypeName = projectTypes.find(pt => pt.id === newType)?.name || 'Project';
    setScenarioName(`Base Case - ${projectTypeName}`);
    
    // Mark as having unsaved changes
    if (currentScenarioId) {
      setHasUnsavedChanges(true);
    }
  };
  
  // Get the appropriate size input field based on project type
  const getSizeInput = () => {
    if (projectType === 'renewable') {
      return (
        <input
          id="capacityMW"
          type="number"
          min="1"
          value={capacityMW}
          onChange={(e) => {
            const value = Math.max(1, parseInt(e.target.value) || 0);
            setCapacityMW(value);
            // Mark as having unsaved changes
            if (currentScenarioId) {
              setHasUnsavedChanges(true);
            }
          }}
          onFocus={() => { userIsEditing.current = true; }}
          onBlur={() => { userIsEditing.current = false; }}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500"
        />
      );
    } else if (projectType === 'livestock') {
      return (
        <input
          id="herdSize"
          type="number"
          min="1"
          value={herdSize}
          onChange={(e) => {
            const value = Math.max(1, parseInt(e.target.value) || 0);
            setHerdSize(value);
            // Mark as having unsaved changes
            if (currentScenarioId) {
              setHasUnsavedChanges(true);
            }
          }}
          onFocus={() => { userIsEditing.current = true; }}
          onBlur={() => { userIsEditing.current = false; }}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500"
        />
      );
    } else if (projectType === 'construction') {
      return (
        <input
          id="buildingSize"
          type="number"
          min="1"
          value={buildingSize}
          onChange={(e) => {
            const value = Math.max(1, parseInt(e.target.value) || 0);
            setBuildingSize(value);
            // Mark as having unsaved changes
            if (currentScenarioId) {
              setHasUnsavedChanges(true);
            }
          }}
          onFocus={() => { userIsEditing.current = true; }}
          onBlur={() => { userIsEditing.current = false; }}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500"
        />
      );
    } else {
      // For forestry, soil, bluecarbon, redd
      return (
        <input
          id="projectSize"
          type="number"
          min="1"
          value={projectSize}
          onChange={(e) => {
            const value = Math.max(1, parseInt(e.target.value) || 0);
            setProjectSize(value);
            // Mark as having unsaved changes
            if (currentScenarioId) {
              setHasUnsavedChanges(true);
            }
          }}
          onFocus={() => { userIsEditing.current = true; }}
          onBlur={() => { userIsEditing.current = false; }}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500"
        />
      );
    }
  };
  
  // Carbon price by year handlers - UPDATED for proper refs
  const handleToggleYearlyCarbonPrices = () => {
    setUseYearlyCarbonPrices(prev => {
      const newValue = !prev;
      previousUseYearlyCarbonPrices.current = newValue;
      // Mark as having unsaved changes
      if (currentScenarioId) {
        setHasUnsavedChanges(true);
      }
      return newValue;
    });
  };
  
  const handleUpdateCarbonPrice = (yearIndex, newPrice) => {
    const updatedPrices = [...carbonPricesByYear];
    updatedPrices[yearIndex] = {
      ...updatedPrices[yearIndex],
      price: newPrice
    };
    setCarbonPricesByYear(updatedPrices);
    // Mark as having unsaved changes
    if (currentScenarioId) {
      setHasUnsavedChanges(true);
    }
  };
  
  const handleBulkUpdateCarbonPrices = (startYear, endYear, startPrice, endPrice) => {
    if (startYear > endYear || startYear < 1 || endYear > projectYears) {
      alert('Invalid year range');
      return;
    }
    
    // Calculate price increment
    const yearCount = endYear - startYear;
    const priceIncrement = yearCount > 0 ? (endPrice - startPrice) / yearCount : 0;
    
    // Create a copy of the current prices
    const updatedPrices = [...carbonPricesByYear];
    
    // Update prices for the year range
    for (let i = startYear - 1; i < endYear; i++) {
      const yearProgress = i - (startYear - 1);
      const interpolatedPrice = startPrice + (priceIncrement * yearProgress);
      
      updatedPrices[i] = {
        year: i + 1,
        price: parseFloat(interpolatedPrice.toFixed(2))
      };
    }
    
    setCarbonPricesByYear(updatedPrices);
    // Mark as having unsaved changes
    if (currentScenarioId) {
      setHasUnsavedChanges(true);
    }
  };
  
  const handleUpdateAllCarbonPrices = (newPriceData) => {
    setCarbonPricesByYear(newPriceData);
    // Mark as having unsaved changes
    if (currentScenarioId) {
      setHasUnsavedChanges(true);
    }
  };
  
  // Handler for custom type modal form
  const handleAddCustomType = () => {
    if (customTypeName && customTypeRate) {
      const rate = parseFloat(customTypeRate);
      if (isNaN(rate) || rate <= 0) return;

      if (customTypeCategory === 'livestock') {
        // Create a proper cattle type object with all required fields
        const newCattle = {
          id: `custom_${Date.now()}`,
          name: customTypeName,
          // For livestock, we use baseEmissions instead of emissionsRate
          // to align with how standard cattle types are defined
          baseEmissions: rate,
          emissionsRate: rate, // Include both for compatibility
          reductionPotential: 0.3, // Default reduction potential
          cost: 30 // Default cost
        };
        
        // Add to custom types
        const updatedCustomTypes = {
          ...customTypes,
          livestock: [...customTypes.livestock, newCattle]
        };
        
        // Update the state with the new custom types
        setCustomTypes(updatedCustomTypes);
        
        // Set this new type as the selected cattle type
        setCattleType(newCattle.id);
        
        // Log for debugging
        console.log("Added custom cattle type:", newCattle);
        console.log("Updated custom types:", updatedCustomTypes);
      } else if (customTypeCategory === 'forestry') {
        const newTree = {
          id: `custom_${Date.now()}`,
          name: customTypeName,
          sequestrationRate: rate,
          cost: 2000, // Default cost,
          maturityYears: 20 // Default maturity
        };
        // Add to custom tree types and set as selected
        setCustomTypes({
          ...customTypes,
          forestry: [...customTypes.forestry, newTree]
        });
        setTreeType(newTree.id);
      } else if (customTypeCategory === 'redd') {
        const newForestType = {
          id: `custom_${Date.now()}`,
          name: customTypeName,
          sequestrationRate: rate,
          protectionCost: 2000, // Default cost
          maintenanceCost: 300  // Default maintenance
        };
        setCustomTypes({
          ...customTypes,
          redd: [...customTypes.redd, newForestType]
        });
        setReddForestType(newForestType.id);
      } else if (customTypeCategory === 'soil') {
        const newSoil = {
          id: `custom_${Date.now()}`,
          name: customTypeName,
          sequestrationRate: rate,
          conversionCost: 800, // Default cost,
          maintenanceCost: 120 // Default maintenance
        };
        setCustomTypes({
          ...customTypes,
          soil: [...customTypes.soil, newSoil]
        });
        setSoilType(newSoil.id);
      } else if (customTypeCategory === 'renewable') {
        const newRenewable = {
          id: `custom_${Date.now()}`,
          name: customTypeName,
          capacityFactor: rate,
          initialCost: 1500000, // Default cost,
          opexCost: 30000 // Default opex
        };
        setCustomTypes({
          ...customTypes,
          renewable: [...customTypes.renewable, newRenewable]
        });
        setRenewableType(newRenewable.id);
      } else if (customTypeCategory === 'bluecarbon') {
        const newBlueCarbon = {
          id: `custom_${Date.now()}`,
          name: customTypeName,
          sequestrationRate: rate,
          restorationCost: 7000, // Default cost,
          maintenanceCost: 450 // Default maintenance
        };
        setCustomTypes({
          ...customTypes,
          bluecarbon: [...customTypes.bluecarbon, newBlueCarbon]
        });
        setBlueCarbonType(newBlueCarbon.id);
      }
      
      // Reset and close modal
      setCustomTypeName('');
      setCustomTypeRate('');
      setShowCustomTypeModal(false);
      
      // Mark as having unsaved changes
      if (currentScenarioId) {
        setHasUnsavedChanges(true);
      }
    }
  };
  
  // Handle showing the custom type modal
  const handleShowCustomTypeModal = (category) => {
    setCustomTypeCategory(category);
    setShowCustomTypeModal(true);
  };
  
  // Handle product selection change
  const handleProductSelectionChange = (updatedProducts) => {
    setSelectedProducts(updatedProducts);
    // Mark as having unsaved changes
    if (currentScenarioId) {
      setHasUnsavedChanges(true);
    }
  };
  
  // Handle Quick Link clicks with section scrolling
  const handleQuickLinkClick = (sectionId) => {
    scrollToSection(sectionId);
  };
  
  // Handle export to Excel
  const handleExportToExcel = () => {
    if (!results && projectType !== 'construction') {
      alert('Please calculate results before exporting.');
      return;
    }
    
    exportToExcel(results, scenarioName);
  };
  
  // Handle Share button click
  const handleShareProject = () => {
    // Create configuration object with current state
    const currentConfig = {
      scenarioName,
      projectType,
      projectSize,
      carbonCreditPrice,
      projectYears,
      discountRate,
      costs,
      ...(projectType === 'renewable' && { capacityMW, renewableType }),
      ...(projectType === 'livestock' && { 
        herdSize, 
        cattleType,
        feedType,
        manureManagement,
        useEmissionReductionAdditives,
        additiveEfficiency,
        grazingPractice,
        regionClimate,
        calvingRate,
        timeToCalfBefore,
        timeToCalfAfter,
        supplementationType,
        dietaryEnergyProfile,
        seasonalFeedChanges
      }),
      ...(projectType === 'forestry' && { treeType }),
      ...(projectType === 'soil' && { soilType }),
      ...(projectType === 'bluecarbon' && { blueCarbonType }),
      ...(projectType === 'redd' && { reddForestType }),
      ...(projectType === 'construction' && { 
        buildingSize, 
        constructionCost, 
        operationalEmissions, 
        selectedBuildingType: selectedBuildingType?.name
      })
    };
    
    shareProject(currentConfig);
  };

  // Handle Export Report button click
  const handleExportReport = () => {
    // Create configuration object
    const currentConfig = {
      scenarioName,
      projectType,
      projectSize,
      carbonCreditPrice,
      projectYears,
      discountRate,
      // Include other relevant state
    };
    
    generatePdfReport(currentConfig, results);
  };
  
  // Input component with proper ref handling for carbonCreditPrice
  const renderCarbonCreditPriceInput = () => (
    <input
      id="carbonCreditPrice"
      type="number"
      min="1"
      value={carbonCreditPrice}
      onChange={(e) => {
        const value = Math.max(1, parseInt(e.target.value) || 0);
        setCarbonCreditPrice(value);
        prevCarbonCreditPrice.current = value; // Update ref when user changes value
        // Mark as having unsaved changes
        if (currentScenarioId) {
          setHasUnsavedChanges(true);
        }
      }}
      onFocus={() => { userIsEditing.current = true; }}
      onBlur={() => { userIsEditing.current = false; }}
      className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
    />
  );

  // Input component with proper ref handling for discountRate
  const renderDiscountRateInput = () => (
    <input
      id="discountRate"
      type="number"
      min="0"
      max="50"
      step="0.1"
      value={discountRate}
      onChange={(e) => {
        const value = Math.max(0, parseFloat(e.target.value) || 0);
        setDiscountRate(value);
        prevDiscountRate.current = value; // Update ref when user changes value
        // Mark as having unsaved changes
        if (currentScenarioId) {
          setHasUnsavedChanges(true);
        }
      }}
      onFocus={() => { userIsEditing.current = true; }}
      onBlur={() => { userIsEditing.current = false; }}
      className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
    />
  );
  
  // Render project type specific inputs
  const renderProjectTypeSpecificInputs = () => {
    if (projectType === 'forestry') {
      return (
        <ForestryProject
          projectSize={projectSize}
          treeType={treeType}
          customTypes={customTypes}
          customSequestrationRate={customSequestrationRate}
          useCustomRate={useCustomRate}
          onTreeTypeChange={(newTreeType) => {
            setTreeType(newTreeType);
            if (currentScenarioId) {
              setHasUnsavedChanges(true);
            }
          }}
          onCustomSequestrationRateChange={(rate) => {
            setCustomSequestrationRate(rate);
            if (currentScenarioId) {
              setHasUnsavedChanges(true);
            }
          }}
          onUseCustomRateChange={(useRate) => {
            setUseCustomRate(useRate);
            if (currentScenarioId) {
              setHasUnsavedChanges(true);
            }
          }}
          onShowCustomTypeModal={handleShowCustomTypeModal}
          selectedProducts={selectedProducts}
          onProductSelectionChange={handleProductSelectionChange}
        />
      );
    } else if (projectType === 'livestock') {
      return (
        <EnhancedLivestockProject
          herdSize={herdSize}
          animalType={animalType}
          cattleType={cattleType}
          customTypes={customTypes}
          customSequestrationRate={customSequestrationRate}
          useCustomRate={useCustomRate}
          onAnimalTypeChange={(newType) => {
            setAnimalType(newType);
            if (currentScenarioId) {
              setHasUnsavedChanges(true);
            }
          }}
          onCattleTypeChange={(newType) => {
            setCattleType(newType);
            if (currentScenarioId) {
              setHasUnsavedChanges(true);
            }
          }}
          onCustomSequestrationRateChange={(rate) => {
            setCustomSequestrationRate(rate);
            if (currentScenarioId) {
              setHasUnsavedChanges(true);
            }
          }}
          onUseCustomRateChange={(useRate) => {
            setUseCustomRate(useRate);
            if (currentScenarioId) {
              setHasUnsavedChanges(true);
            }
          }}
          onShowCustomTypeModal={handleShowCustomTypeModal}
          // Existing emissions factors
          feedType={feedType}
          onFeedTypeChange={(newType) => {
            setFeedType(newType);
            if (currentScenarioId) {
              setHasUnsavedChanges(true);
            }
          }}
          manureManagement={manureManagement}
          onManureManagementChange={(newType) => {
            setManureManagement(newType);
            if (currentScenarioId) {
              setHasUnsavedChanges(true);
            }
          }}
          useEmissionReductionAdditives={useEmissionReductionAdditives}
          onUseEmissionReductionAdditivesChange={(value) => {
            setUseEmissionReductionAdditives(value);
            if (currentScenarioId) {
              setHasUnsavedChanges(true);
            }
          }}
          additiveEfficiency={additiveEfficiency}
          onAdditiveEfficiencyChange={(value) => {
            setAdditiveEfficiency(value);
            if (currentScenarioId) {
              setHasUnsavedChanges(true);
            }
          }}
          grazingPractice={grazingPractice}
          onGrazingPracticeChange={(value) => {
            setGrazingPractice(value);
            if (currentScenarioId) {
              setHasUnsavedChanges(true);
            }
          }}
          regionClimate={regionClimate}
          onRegionClimateChange={(value) => {
            setRegionClimate(value);
            if (currentScenarioId) {
              setHasUnsavedChanges(true);
            }
          }}
          // New reproductive metrics
          calvingRate={calvingRate}
          onCalvingRateChange={(value) => {
            setCalvingRate(value);
            if (currentScenarioId) {
              setHasUnsavedChanges(true);
            }
          }}
          timeToCalfBefore={timeToCalfBefore}
          onTimeToCalfBeforeChange={(value) => {
            setTimeToCalfBefore(value);
            if (currentScenarioId) {
              setHasUnsavedChanges(true);
            }
          }}
          timeToCalfAfter={timeToCalfAfter}
          onTimeToCalfAfterChange={(value) => {
            setTimeToCalfAfter(value);
            if (currentScenarioId) {
              setHasUnsavedChanges(true);
            }
          }}
          supplementationType={supplementationType}
          onSupplementationTypeChange={(value) => {
            setSupplementationType(value);
            if (currentScenarioId) {
              setHasUnsavedChanges(true);
            }
          }}
          // Energy and diet metrics
          dietaryEnergyProfile={dietaryEnergyProfile}
          onDietaryEnergyProfileChange={(value) => {
            setDietaryEnergyProfile(value);
            if (currentScenarioId) {
              setHasUnsavedChanges(true);
            }
          }}
          seasonalFeedChanges={seasonalFeedChanges}
          onSeasonalFeedChangesChange={(value) => {
            setSeasonalFeedChanges(value);
            if (currentScenarioId) {
              setHasUnsavedChanges(true);
            }
          }}
          customFeedMixture={customFeedMixture}
          onCustomFeedMixtureChange={(value) => {
            setCustomFeedMixture(value);
            if (currentScenarioId) {
              setHasUnsavedChanges(true);
            }
          }}
          useCustomFeedMixture={useCustomFeedMixture}
          onUseCustomFeedMixtureChange={(value) => {
            setUseCustomFeedMixture(value);
            if (currentScenarioId) {
              setHasUnsavedChanges(true);
            }
          }}
          selectedProducts={selectedProducts}
          onProductSelectionChange={handleProductSelectionChange}
        />
      );
    } else if (projectType === 'soil') {
      return (
        <SoilProject
          projectSize={projectSize}
          soilType={soilType}
          customTypes={customTypes}
          customSequestrationRate={customSequestrationRate}
          useCustomRate={useCustomRate}
          onSoilTypeChange={(newType) => {
            setSoilType(newType);
            if (currentScenarioId) {
              setHasUnsavedChanges(true);
            }
          }}
          onCustomSequestrationRateChange={(rate) => {
            setCustomSequestrationRate(rate);
            if (currentScenarioId) {
              setHasUnsavedChanges(true);
            }
          }}
          onUseCustomRateChange={(useRate) => {
            setUseCustomRate(useRate);
            if (currentScenarioId) {
              setHasUnsavedChanges(true);
            }
          }}
          onShowCustomTypeModal={handleShowCustomTypeModal}
          selectedProducts={selectedProducts}
          onProductSelectionChange={handleProductSelectionChange}
        />
      );
    } else if (projectType === 'renewable') {
      return (
        <RenewableProject
          capacityMW={capacityMW}
          renewableType={renewableType}
          customTypes={customTypes}
          customSequestrationRate={customSequestrationRate}
          useCustomRate={useCustomRate}
          onRenewableTypeChange={(newType) => {
            setRenewableType(newType);
            if (currentScenarioId) {
              setHasUnsavedChanges(true);
            }
          }}
          onCustomSequestrationRateChange={(rate) => {
            setCustomSequestrationRate(rate);
            if (currentScenarioId) {
              setHasUnsavedChanges(true);
            }
          }}
          onUseCustomRateChange={(useRate) => {
            setUseCustomRate(useRate);
            if (currentScenarioId) {
              setHasUnsavedChanges(true);
            }
          }}
          onShowCustomTypeModal={handleShowCustomTypeModal}
          selectedProducts={selectedProducts}
          onProductSelectionChange={handleProductSelectionChange}
        />
      );
    } else if (projectType === 'bluecarbon') {
      return (
        <BlueCarbonProject
          projectSize={projectSize}
          blueCarbonType={blueCarbonType}
          customTypes={customTypes}
          customSequestrationRate={customSequestrationRate}
          useCustomRate={useCustomRate}
          onBlueCarbonTypeChange={(newType) => {
            setBlueCarbonType(newType);
            if (currentScenarioId) {
              setHasUnsavedChanges(true);
            }
          }}
          onCustomSequestrationRateChange={(rate) => {
            setCustomSequestrationRate(rate);
            if (currentScenarioId) {
              setHasUnsavedChanges(true);
            }
          }}
          onUseCustomRateChange={(useRate) => {
            setUseCustomRate(useRate);
            if (currentScenarioId) {
              setHasUnsavedChanges(true);
            }
          }}
          onShowCustomTypeModal={handleShowCustomTypeModal}
          selectedProducts={selectedProducts}
          onProductSelectionChange={handleProductSelectionChange}
        />
      );
    } else if (projectType === 'redd') {
      return (
        <REDDProject
          projectSize={projectSize}
          reddForestType={reddForestType}
          customTypes={customTypes}
          customSequestrationRate={customSequestrationRate}
          useCustomRate={useCustomRate}
          onReddForestTypeChange={(newType) => {
            setReddForestType(newType);
            if (currentScenarioId) {
              setHasUnsavedChanges(true);
            }
          }}
          onCustomSequestrationRateChange={(rate) => {
            setCustomSequestrationRate(rate);
            if (currentScenarioId) {
              setHasUnsavedChanges(true);
            }
          }}
          onUseCustomRateChange={(useRate) => {
            setUseCustomRate(useRate);
            if (currentScenarioId) {
              setHasUnsavedChanges(true);
            }
          }}
          onShowCustomTypeModal={handleShowCustomTypeModal}
          selectedProducts={selectedProducts}
          onProductSelectionChange={handleProductSelectionChange}
        />
      );
    } else if (projectType === 'construction') {
      return (
        <ConstructionProject
          buildingSize={buildingSize}
          constructionCost={constructionCost}
          operationalEmissions={operationalEmissions}
          selectedBuildingType={selectedBuildingType}
          selectedMaterials={selectedMaterials}
          selectedEnergyMeasures={selectedEnergyMeasures}
          selectedWasteManagement={selectedWasteManagement}
          selectedCertification={selectedCertification}
          onBuildingTypeChange={(newType) => {
            setSelectedBuildingType(newType);
            if (currentScenarioId) {
              setHasUnsavedChanges(true);
            }
          }}
          onBuildingSizeChange={(value) => {
            setBuildingSize(value);
            if (currentScenarioId) {
              setHasUnsavedChanges(true);
            }
          }}
          onConstructionCostChange={(value) => {
            setConstructionCost(value);
            if (currentScenarioId) {
              setHasUnsavedChanges(true);
            }
          }}
          onOperationalEmissionsChange={(value) => {
            setOperationalEmissions(value);
            if (currentScenarioId) {
              setHasUnsavedChanges(true);
            }
          }}
          onMaterialSelectionChange={(materials) => {
            setSelectedMaterials(materials);
            if (currentScenarioId) {
              setHasUnsavedChanges(true);
            }
          }}
          onEnergyMeasureChange={(measures) => {
            setSelectedEnergyMeasures(measures);
            if (currentScenarioId) {
              setHasUnsavedChanges(true);
            }
          }}
          onWasteManagementChange={(waste) => {
            setSelectedWasteManagement(waste);
            if (currentScenarioId) {
              setHasUnsavedChanges(true);
            }
          }}
          onCertificationChange={(cert) => {
            setSelectedCertification(cert);
            if (currentScenarioId) {
              setHasUnsavedChanges(true);
            }
          }}
          showCustomBuildingType={showCustomBuildingType}
          setShowCustomBuildingType={setShowCustomBuildingType}
          // Pass new props
          materialVolumes={materialVolumes}
          onMaterialVolumeChange={(material, value) => {
            setMaterialVolumes({
              ...(materialVolumes || {}),
              [material]: value
            });
            if (currentScenarioId) {
              setHasUnsavedChanges(true);
            }
          }}
          landscapingOptions={landscapingOptions}
          onLandscapingOptionChange={(value) => {
            setLandscapingOptions(value);
            if (currentScenarioId) {
              setHasUnsavedChanges(true);
            }
          }}
          solarCapacity={solarCapacity}
          onSolarCapacityChange={(value) => {
            setSolarCapacity(value);
            if (currentScenarioId) {
              setHasUnsavedChanges(true);
            }
          }}
          greenRoofArea={greenRoofArea}
          onGreenRoofAreaChange={(value) => {
            setGreenRoofArea(value);
            if (currentScenarioId) {
              setHasUnsavedChanges(true);
            }
          }}
          rainwaterHarvesting={rainwaterHarvesting}
          onRainwaterHarvestingChange={(value) => {
            setRainwaterHarvesting(value);
            if (currentScenarioId) {
              setHasUnsavedChanges(true);
            }
          }}
          usesRecycledMaterials={usesRecycledMaterials}
          onUsesRecycledMaterialsChange={(value) => {
            setUsesRecycledMaterials(value);
            if (currentScenarioId) {
              setHasUnsavedChanges(true);
            }
          }}
          recycledContentPercentage={recycledContentPercentage}
          onRecycledContentPercentageChange={(value) => {
            setRecycledContentPercentage(value);
            if (currentScenarioId) {
              setHasUnsavedChanges(true);
            }
          }}
          selectedProducts={selectedProducts}
          onProductSelectionChange={handleProductSelectionChange}
        />
      );
    } else {
      // For any other project types or unimplemented types
      return (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-700">
            This project type is currently under development. Basic functionality is available but detailed configuration options will be coming soon.
          </p>
        </div>
      );
    }
  };
  // Main render function
  return (
    <div className="p-4 max-w-6xl mx-auto">
      {/* Floating Save Button */}
      {currentScenarioId && (
        <div className="fixed bottom-24 right-8 z-50">
          <button
            onClick={handleManualSave}
            disabled={loading || !hasUnsavedChanges}
            className={`px-6 py-3 rounded-full shadow-lg text-white font-medium flex items-center gap-3
              ${hasUnsavedChanges ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}
              transition-all duration-200 hover:shadow-xl`}
            title={hasUnsavedChanges ? "Save Scenario" : "No changes to save"}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      )}
      
      {/* Scenario Name Input */}
      <div className="mb-4">
        <label htmlFor="scenarioName" className="block text-sm font-medium text-gray-700 mb-1">
          Scenario Name
        </label>
        <div className="flex">
          <input
            type="text"
            id="scenarioName"
            name="scenarioName"
            value={scenarioName}
            onFocus={() => { userIsEditing.current = true; }}
            onBlur={() => { userIsEditing.current = false; }}
            onChange={(e) => {
              setScenarioName(e.target.value);
              // Mark as having unsaved changes
              if (currentScenarioId) {
                setHasUnsavedChanges(true);
              }
            }}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
            placeholder="Enter scenario name"
          />
          {/* Only show save button if there's a current scenario */}
          {currentScenarioId && (
            <button
              onClick={handleManualSave}
              disabled={loading || !hasUnsavedChanges}
              className={`ml-2 px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white 
                ${hasUnsavedChanges ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'} 
                focus:outline-none flex items-center`}
              title={hasUnsavedChanges ? "Save Scenario" : "No changes to save"}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Save
                </>
              )}
            </button>
          )}
          
          {/* Unsaved changes indicator */}
          {hasUnsavedChanges && (
            <div className="ml-2 flex items-center text-amber-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="ml-1 text-sm">Unsaved changes</span>
            </div>
          )}
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Give your scenario a descriptive name to easily identify it later.
          {hasUnsavedChanges && " Click Save to store your changes."}
        </p>
      </div>
      
      {/* Modals */}
      {projectType !== 'construction' && (
        <>
          <CarbonPriceModal 
            isOpen={showCarbonPriceModal}
            onClose={() => setShowCarbonPriceModal(false)}
            projectYears={projectYears}
            carbonPricesByYear={carbonPricesByYear}
            onUpdate={handleUpdateCarbonPrice}
            onBulkUpdate={handleBulkUpdateCarbonPrices}
          />
          
          <CarbonPriceEditor
            isOpen={showCarbonPriceEditor}
            onClose={() => setShowCarbonPriceEditor(false)}
            projectYears={projectYears}
            carbonPricesByYear={carbonPricesByYear}
            onUpdateAll={handleUpdateAllCarbonPrices}
            carbonCreditPrice={carbonCreditPrice}
          />
        </>
      )}
      
      <CustomTypeModal
        isOpen={showCustomTypeModal}
        onClose={() => setShowCustomTypeModal(false)}
        categoryName={customTypeCategory}
        onAdd={handleAddCustomType}
        typeName={customTypeName}
        typeRate={customTypeRate}
        onTypeNameChange={setCustomTypeName}
        onTypeRateChange={setCustomTypeRate}
      />
      
      {projectType !== 'construction' && (
        <>
          <CostModal
            isOpen={showAddCost}
            onClose={() => setShowAddCost(false)}
            isEdit={false}
            cost={newCost}
            onCostChange={(field, value) => setNewCost({...newCost, [field]: value})}
            onSave={() => costManager.add(newCost)}
          />
          
          <CostModal
            isOpen={showEditCost}
            onClose={() => setShowEditCost(false)}
            isEdit={true}
            cost={editingCost || {}}
            onCostChange={(field, value) => setEditingCost({...editingCost, [field]: value})}
            onSave={() => costManager.update(editingCost)}
          />
        </>
      )}
      
      {showReportGenerator && (
        <ReportGenerator
          isOpen={showReportGenerator}
          onClose={() => setShowReportGenerator(false)}
          scenarioName={scenarioName}
          results={results}
          projectType={projectType}
          projectTypes={projectTypes}
          projectSize={projectSize}
          capacityMW={capacityMW}
          herdSize={herdSize}
          buildingSize={buildingSize}
          selectedBuildingType={selectedBuildingType}
          carbonCreditPrice={carbonCreditPrice}
          projectYears={projectYears}
          discountRate={discountRate}
          treeType={treeType}
          cattleType={cattleType}
          soilType={soilType}
          renewableType={renewableType}
          blueCarbonType={blueCarbonType}
          savedConfigurations={savedConfigurations}
        />
      )}
      
      <ScenarioManagementModal
        isOpen={showScenarios}
        onClose={() => setShowScenarios(false)}
        savedConfigurations={savedConfigurations}
        onLoad={handleLoadScenario}
        onDelete={handleDeleteScenario}
        onCompare={compareScenario}
        currentScenarioName={scenarioName}
      />
      
      {/* New ScenarioManager Component */}
      {showScenarioManager && projectId && (
        <ScenarioManager
          projectId={projectId}
          scenarioName={scenarioName}
          setScenarioName={setScenarioName}
          currentData={{
            projectType,
            projectSize,
            capacityMW,
            herdSize,
            buildingSize,
            carbonCreditPrice,
            projectYears,
            discountRate,
            costs,
            results,
            // Include other relevant state to save
            ...(projectType === 'forestry' && { treeType }),
            ...(projectType === 'livestock' && {
              cattleType,
              feedType,
              manureManagement,
              useEmissionReductionAdditives,
              additiveEfficiency,
              grazingPractice,
              regionClimate,
              calvingRate,
              timeToCalfBefore,
              timeToCalfAfter,
              supplementationType,
              dietaryEnergyProfile,
              seasonalFeedChanges,
              customFeedMixture,
              useCustomFeedMixture
            }),
            ...(projectType === 'soil' && { soilType }),
            ...(projectType === 'renewable' && { renewableType }),
            ...(projectType === 'bluecarbon' && { blueCarbonType }),
            ...(projectType === 'redd' && { reddForestType }),
            ...(projectType === 'construction' && {
              selectedBuildingType,
              constructionCost,
              operationalEmissions,
              selectedMaterials,
              selectedEnergyMeasures,
              selectedWasteManagement,
              selectedCertification,
              materialVolumes,
              landscapingOptions,
              solarCapacity,
              greenRoofArea,
              rainwaterHarvesting,
              usesRecycledMaterials,
              recycledContentPercentage
            })
          }}
          onLoadScenario={handleLoadScenario}
          onClose={() => setShowScenarioManager(false)}
          onCreateNew={onCreateNewScenario}
          // Pass setHasUnsavedChanges to the ScenarioManager
          setHasUnsavedChanges={setHasUnsavedChanges}
        />
      )}
      <div className="flex flex-col gap-4">
        {/* First Section - Inputs */}
        <div className="bg-white p-4 rounded-lg shadow" id="project-parameters">
          <h2 className="text-lg font-medium mb-4 text-green-700 border-b pb-2">Project Parameters</h2>
          
          {/* Basic Parameters */}
          <div className="mb-4">
            <label htmlFor="projectSize" className="block text-sm font-medium mb-1 text-gray-700">
              {getProjectSizeLabel(projectType)}
            </label>
            {getSizeInput()}
          </div>
          
          {/* Project Type Specific Inputs */}
          {renderProjectTypeSpecificInputs()}
          
          {/* Carbon Credit Price - Only show for non-construction projects */}
          {projectType !== 'construction' && (
            <div className="mb-4 mt-6 pt-3 border-t">
              <h3 className="text-md font-medium mb-3 text-green-700">Carbon Credit Parameters</h3>
              
              <div className="mb-4">
                <div className="flex justify-between items-center">
                  <label htmlFor="carbonCreditPrice" className="block text-sm font-medium mb-1">
                    Carbon Credit Price ($/tCO2e)
                  </label>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="useYearlyCarbonPrices"
                      checked={useYearlyCarbonPrices}
                      onChange={handleToggleYearlyCarbonPrices}
                      className="mr-2"
                    />
                    <label htmlFor="useYearlyCarbonPrices" className="text-sm">Use yearly prices</label>
                  </div>
                </div>
                
                {!useYearlyCarbonPrices ? (
                  renderCarbonCreditPriceInput()
                ) : (
                  <div className="flex space-x-2 mt-2">
                    <button
                      onClick={() => setShowCarbonPriceModal(true)}
                      className="flex-1 bg-white hover:bg-gray-50 text-green-700 border border-green-500 py-2 px-4 rounded flex items-center justify-center"
                      type="button"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Quick Configure
                    </button>
                    <button
                      onClick={() => setShowCarbonPriceEditor(true)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded flex items-center justify-center"
                      type="button"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Advanced Editor
                    </button>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="mb-4">
                  <label htmlFor="projectYears" className="block text-sm font-medium mb-1">Project Duration (years)</label>
                  <input
                    id="projectYears"
                    type="number"
                    min="1"
                    max="100"
                    value={projectYears}
                    onChange={(e) => {
                      const value = Math.max(1, parseInt(e.target.value) || 0);
                      setProjectYears(value);
                      prevProjectYears.current = value; // Update ref when user changes value
                      // Mark as having unsaved changes
                      if (currentScenarioId) {
                        setHasUnsavedChanges(true);
                      }
                    }}
                    onFocus={() => { userIsEditing.current = true; }}
                    onBlur={() => { userIsEditing.current = false; }}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="discountRate" className="block text-sm font-medium mb-1">Discount Rate (%)</label>
                  {renderDiscountRateInput()}
                </div>
              </div>
            </div>
          )}
          
          {/* Cost Management - Only show for non-construction projects */}
          {projectType !== 'construction' && (
            <div className="mb-4 mt-6 pt-3 border-t" id="cost-management">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-md font-medium text-green-700">Cost Management</h3>
                <button
                  onClick={() => {
                    setNewCost({
                      id: Date.now(),
                      name: '',
                      type: 'fixed',
                      value: '',
                      year: 1,
                      description: ''
                    });
                    setShowAddCost(true);
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded text-sm flex items-center"
                  type="button"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Cost
                </button>
              </div>
              
              <div className="bg-gray-50 rounded border overflow-hidden">
                {costs.length > 0 ? (
                  <table className="min-w-full border-collapse">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="py-2 px-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="py-2 px-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                        <th className="py-2 px-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {costs.map((cost) => (
                        <tr key={cost.id} className="border-t hover:bg-green-50">
                          <td className="py-2 px-3 text-sm">
                            <div className="font-medium">{cost.name}</div>
                            {cost.description && <div className="text-xs text-gray-500">{cost.description}</div>}
                          </td>
                          <td className="py-2 px-3 text-sm">
                            {cost.type === 'fixed' && 'Fixed (one-time)'}
                            {cost.type === 'annual' && 'Annual (fixed)'}
                            {cost.type === 'per_hectare' && 'Per Unit (one-time)'}
                            {cost.type === 'annual_per_hectare' && 'Per Unit (annual)'}
                          </td>
                          <td className="py-2 px-3 text-right text-sm">{formatCurrency(cost.value)}</td>
                          <td className="py-2 px-3 text-center text-sm">{cost.year}</td>
                          <td className="py-2 px-3 text-center">
                            <div className="flex justify-center space-x-2">
                              <button
                                onClick={() => costManager.prepareForEdit(cost)}
                                className="text-blue-600 hover:text-blue-800"
                                title="Edit Cost"
                                type="button"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => costManager.remove(cost.id)}
                                className="text-red-600 hover:text-red-800"
                                title="Remove Cost"
                                type="button"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    No costs defined yet. Click "Add Cost" to define project costs.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Second Section - Results */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4 text-green-700 border-b pb-2">Results</h2>
          
          {results || projectType === 'construction' ? (
            <div>
              {/* Key metrics display - Adjusted for construction projects */}
              {projectType === 'construction' ? (
                // Construction project results are handled by the component itself
                <div className="text-gray-500 text-center p-4">
                  Construction project results are displayed within the project configuration above.
                </div>
              ) : (
                <>
                  <div className="bg-gray-50 p-4 rounded-lg shadow-inner mb-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="bg-white p-3 rounded shadow">
                        <h3 className="text-sm font-medium text-gray-500">Total Sequestration</h3>
                        <p className="text-xl font-bold text-green-700">{Math.round(results.totalSequestration).toLocaleString()} tCO2e</p>
                      </div>
                      
                      <div className="bg-white p-3 rounded shadow">
                        <h3 className="text-sm font-medium text-gray-500">Net Profit</h3>
                        <p className="text-xl font-bold text-green-700">{formatCurrency(results.netProfit)}</p>
                      </div>
                      
                      <div className="bg-white p-3 rounded shadow">
                        <h3 className="text-sm font-medium text-gray-500">NPV</h3>
                        <p className="text-xl font-bold text-green-700">{formatCurrency(results.npv)}</p>
                      </div>
                      
                      <div className="bg-white p-3 rounded shadow">
                        <h3 className="text-sm font-medium text-gray-500">IRR</h3>
                        <p className="text-xl font-bold text-green-700">{results.irr ? `${results.irr.toFixed(1)}%` : 'N/A'}</p>
                      </div>
                      
                      <div className="bg-white p-3 rounded shadow">
                        <h3 className="text-sm font-medium text-gray-500">ROI</h3>
                        <p className="text-xl font-bold text-green-700">{`${results.roi ? results.roi.toFixed(1) : 0}%`}</p>
                      </div>
                      
                      <div className="bg-white p-3 rounded shadow">
                        <h3 className="text-sm font-medium text-gray-500">Break-even</h3>
                        <p className="text-xl font-bold text-green-700">Year {results.breakEvenYear}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={handleExportToExcel}
                        className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded text-sm flex items-center"
                        type="button"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export to Excel
                      </button>
                    </div>
                  </div>
                  
                  {/* Display integrated climate technologies if any */}
                  {results.selectedProducts && results.selectedProducts.length > 0 && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-100">
                      <h3 className="text-md font-medium mb-3 text-green-700">Integrated Climate Technologies</h3>
                      <div className="space-y-3">
                        {results.selectedProducts.map(product => (
                          <div key={product.id} className="bg-white p-3 rounded-lg border border-green-100 flex items-center">
                            <div className="flex-shrink-0 mr-3 text-green-600">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <div className="flex-grow">
                              <h4 className="text-sm font-medium">{product.name}</h4>
                              <p className="text-xs text-gray-600">by {product.company}</p>
                            </div>
                            <div className="flex-shrink-0 text-green-800 text-sm font-medium">
                              {Math.round(product.emissionsReduction * 100)}% emissions reduction
                            </div>
                          </div>
                        ))}
                        <div className="text-right mt-2">
                          <a href="/featured" className="text-sm font-medium text-green-700 hover:text-green-800 flex items-center justify-end">
                            Browse more climate technologies
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Charts with Tabs */}
                  <div className="mt-6 border rounded-lg overflow-hidden shadow">
                    <div className="bg-gray-100 px-4 py-2 border-b">
                      <div className="flex space-x-4">
                        <button
                          className={`py-2 px-3 ${activeChartTab === 'cashflow' ? 'text-green-700 border-b-2 border-green-700 font-medium' : 'text-gray-600 hover:text-green-600'} transition-colors`}
                          onClick={() => setActiveChartTab('cashflow')}
                          type="button"
                        >
                          Cash Flow Chart
                        </button>
                        <button
                          className={`py-2 px-3 ${activeChartTab === 'npv' ? 'text-green-700 border-b-2 border-green-700 font-medium' : 'text-gray-600 hover:text-green-600'} transition-colors`}
                          onClick={() => setActiveChartTab('npv')}
                          type="button"
                        >
                          NPV Analysis
                        </button>
                        <button
                         className={`py-2 px-3 ${activeChartTab === 'costs' ? 'text-green-700 border-b-2 border-green-700 font-medium' : 'text-gray-600 hover:text-green-600'} transition-colors`}
                         onClick={() => setActiveChartTab('costs')}
                         type="button"
                       >
                         Cost Breakdown
                       </button>
                       {projectType === 'livestock' && (
                         <button
                           className={`py-2 px-3 ${activeChartTab === 'emissions' ? 'text-green-700 border-b-2 border-green-700 font-medium' : 'text-gray-600 hover:text-green-600'} transition-colors`}
                           onClick={() => setActiveChartTab('emissions')}
                           type="button"
                         >
                           Emissions Analysis
                         </button>
                       )}
                     </div>
                   </div>
                   <div className="p-4">
                     {activeChartTab === 'cashflow' && results?.chartData?.cashFlowData && (
                       <CashFlowChart data={memoizedCashFlowData} />
                     )}
                     {activeChartTab === 'npv' && results?.chartData?.npvData && (
                       <NPVChart data={memoizedNpvData} />
                     )}
                     {activeChartTab === 'costs' && results?.chartData && (
                       <CostBreakdownChart data={memoizedCostBreakdownData} />
                     )}
                     {activeChartTab === 'emissions' && projectType === 'livestock' && results?.chartData?.emissionsIntensity && (
                       <LivestockEmissionsChart 
                         yearlyData={results.yearlyData}
                         emissionsIntensity={results.chartData.emissionsIntensity}
                         herdSize={herdSize}
                       />
                     )}
                   </div>
                 </div>
                 
                 {/* Annual Results Table */}
                 <div className="mt-6 border rounded-lg overflow-hidden shadow">
                   <div className="bg-gray-100 px-4 py-2 border-b">
                     <h3 className="font-medium">Year-by-Year Results</h3>
                   </div>
                   <div className="p-4 overflow-x-auto">
                     <table className="min-w-full border-collapse">
                       <thead>
                         <tr className="bg-gray-50">
                           <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">Year</th>
                           <th className="py-2 px-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border">Sequestration (tCO2e)</th>
                           <th className="py-2 px-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border">Revenue</th>
                           <th className="py-2 px-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border">Costs</th>
                           <th className="py-2 px-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border">Net Cash Flow</th>
                           <th className="py-2 px-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border">Cumulative Cash Flow</th>
                         </tr>
                       </thead>
                       <tbody>
                         {results.yearlyData && results.yearlyData.slice(0, 10).map((yearData) => (
                           <tr key={yearData.year} className="hover:bg-gray-50">
                             <td className="py-2 px-3 text-sm border">{yearData.year}</td>
                             <td className="py-2 px-3 text-right text-sm border">{Math.round(yearData.sequestration).toLocaleString()}</td>
                             <td className="py-2 px-3 text-right text-sm border">{formatCurrency(yearData.revenue)}</td>
                             <td className="py-2 px-3 text-right text-sm border">{formatCurrency(yearData.costs)}</td>
                             <td className={`py-2 px-3 text-right text-sm border ${yearData.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                               {formatCurrency(yearData.netCashFlow)}
                             </td>
                             <td className={`py-2 px-3 text-right text-sm border ${yearData.cumulativeNetCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                               {formatCurrency(yearData.cumulativeNetCashFlow)}
                             </td>
                           </tr>
                         ))}
                         {results.yearlyData && results.yearlyData.length > 10 && (
                           <tr>
                             <td colSpan="6" className="py-2 px-3 text-center text-sm text-gray-500 border">
                               Showing first 10 years. Export to Excel for full data.
                             </td>
                           </tr>
                         )}
                       </tbody>
                     </table>
                   </div>
                 </div>
               </>
             )}
           </div>
         ) : (
           <div className="bg-gray-50 p-8 text-center rounded-lg shadow-inner">
             <div className="flex justify-center mb-3">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
               </svg>
             </div>
             <h3 className="text-lg font-medium mb-2 text-green-700">No Results Yet</h3>
             <p className="text-gray-500 mb-4">
               Configure your project parameters to see {projectType === 'construction' ? 'emissions and cost analysis' : 'financial projections'}
             </p>
           </div>
         )}
       </div>
     </div>
     
     <div className="mt-6 bg-white p-4 rounded-lg shadow">
       <div className="text-center text-gray-500 text-sm">
         <p>Carbon Prospect - Carbon Assessment and Financial Analysis Tool</p>
       </div>
     </div>
   </div>
 );
};

export default CarbonProspect;

// Export scenario API functions for use in other components
export { saveScenario, getScenarios, updateScenario, deleteScenario as deleteScenarioAPI } from './utils/scenarioAPI';
