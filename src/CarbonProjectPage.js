import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CarbonProspect from './CarbonProspect';
import ScenarioSummaryPanel from './ScenarioSummaryPanel';
import ScenarioManager from './ScenarioManager';
import AssessmentProductSelector from './AssessmentProductSelector';
import { generateEmissionsReport } from './Services/emissionsService';  // Capital S in Services
import { useAuth, getValidToken } from './AuthSystem';
import { projectTypes } from './utils/projectData';
import { getProjectTypeLabel } from './utils/formatters';
import { saveScenario } from './utils/scenarioAPI';
import { 
  removeProductFromProject, 
  applyProductToProject 
} from './utils/marketplaceApi';
import api from './api-config';  // ADD THIS IMPORT

function CarbonProjectPage() {
  // Get auth functions and navigation
  const { refreshToken } = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  const projectId = params.projectId; // Get projectId from URL parameter
  
  // State for project data and UI
  const [projectData, setProjectData] = useState(null);
  const [loading, setLoading] = useState(projectId ? true : false);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [scenarioRefreshTrigger, setScenarioRefreshTrigger] = useState(0);
  const [showScenarioManager, setShowScenarioManager] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  
  // New state for assessment type selection
  const [assessmentType, setAssessmentType] = useState('');
  const [showAssessmentTypeSelection, setShowAssessmentTypeSelection] = useState(!projectId);
  
  // New state for tab navigation
  const [activeTab, setActiveTab] = useState(0);
  
  // Project-level state
  const [projectName, setProjectName] = useState('New Carbon Project');
  const [selectedProjectType, setSelectedProjectType] = useState('');
  
  // Project state from CarbonProspect
  const [scenarioName, setScenarioName] = useState('New Scenario');
  const [currentScenarioId, setCurrentScenarioId] = useState(null);
  const [calculatedEmissionsReduction, setCalculatedEmissionsReduction] = useState(0);
  const [results, setResults] = useState(null);
  const [projectSize, setProjectSize] = useState(0);
  const [projectYears, setProjectYears] = useState(30);
  const [discountRate, setDiscountRate] = useState(0.05);
  const [carbonCreditPrice, setCarbonCreditPrice] = useState(15);
  
  // Project type specific state variables
  const [treeType, setTreeType] = useState('');
  const [herdSize, setHerdSize] = useState(0);
  const [animalType, setAnimalType] = useState('');
  const [cattleType, setCattleType] = useState('');
  const [feedType, setFeedType] = useState('mixed');
  const [capacityMW, setCapacityMW] = useState(0);
  const [renewableType, setRenewableType] = useState('');
  const [soilType, setSoilType] = useState('');
  const [blueCarbonType, setBlueCarbonType] = useState('');
  const [reddForestType, setReddForestType] = useState('');
  const [buildingSize, setBuildingSize] = useState(0);
  const [constructionCost, setConstructionCost] = useState(0);
  const [operationalEmissions, setOperationalEmissions] = useState(0);
  const [selectedBuildingType, setSelectedBuildingType] = useState(null);
  
  // Save feedback state
  const [saveFeedback, setSaveFeedback] = useState(null);
  
  // Products state
  const [projectProducts, setProjectProducts] = useState([]);

  // What-if analysis state
  const [whatIfMode, setWhatIfMode] = useState(false);
  const [tempCarbonPrice, setTempCarbonPrice] = useState(carbonCreditPrice);
  const [tempSize, setTempSize] = useState(projectSize);
  const [whatIfResults, setWhatIfResults] = useState(null);
  const [minSize, setMinSize] = useState(1);
  const [maxSize, setMaxSize] = useState(1000);
  const [sizeUnit, setSizeUnit] = useState('ha');

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(!localStorage.getItem('carbonProjectOnboardingComplete'));
  const [onboardingStep, setOnboardingStep] = useState(1);

  // Function to handle assessment type selection
  const handleAssessmentTypeSelection = (type) => {
    setAssessmentType(type);
    
    if (type === 'carbon-footprint') {
      // Navigate to the Carbon Footprint assessment page
      navigate('/carbon-footprint/new');
    } else {
      // Continue with Carbon Project assessment
      setShowAssessmentTypeSelection(false);
    }
  };

  // Tooltip helper function
  const Tooltip = ({ children, text }) => {
    return (
      <div className="relative group">
        {children}
        <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded p-2 w-64 z-10">
          <div className="relative">
            {text}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
          </div>
        </div>
      </div>
    );
  };
  // Load project data if we have a projectId
  useEffect(() => {
    const fetchProjectData = async () => {
      if (!projectId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch project data using axios
        const response = await api.get(`/assessment-projects/${projectId}`);
        const data = response.data;
        
        console.log('Loaded project data:', data);
        
        // Set project data
        setProjectData(data);
        
        // Set project name
        setProjectName(data.name || 'New Carbon Project');
        
        // Set basic project info
        if (data.projectType) setSelectedProjectType(data.projectType);
        if (data.projectSize) setProjectSize(data.projectSize);
        if (data.projectYears) setProjectYears(data.projectYears);
        if (data.discountRate) setDiscountRate(data.discountRate);
        if (data.carbonCreditPrice) setCarbonCreditPrice(data.carbonCreditPrice);
        
        // Set scenario name from serializedState if available
        if (data.serializedState && data.serializedState.scenarioName) {
          setScenarioName(data.serializedState.scenarioName);
        }
        
        // Set project-specific parameters if available in serializedState
        if (data.serializedState) {
          const state = data.serializedState;
          
          if (state.projectType === 'forestry' && state.treeType) setTreeType(state.treeType);
          if (state.projectType === 'livestock') {
            if (state.herdSize) setHerdSize(state.herdSize);
            if (state.animalType) setAnimalType(state.animalType);
            if (state.cattleType) setCattleType(state.cattleType);
          }
          if (state.projectType === 'renewable') {
            if (state.capacityMW) setCapacityMW(state.capacityMW);
            if (state.renewableType) setRenewableType(state.renewableType);
          }
          if (state.projectType === 'soil' && state.soilType) setSoilType(state.soilType);
          if (state.projectType === 'bluecarbon' && state.blueCarbonType) setBlueCarbonType(state.blueCarbonType);
          if (state.projectType === 'redd' && state.reddForestType) setReddForestType(state.reddForestType);
          if (state.projectType === 'construction') {
            if (state.buildingSize) setBuildingSize(state.buildingSize);
            if (state.constructionCost) setConstructionCost(state.constructionCost);
            if (state.operationalEmissions) setOperationalEmissions(state.operationalEmissions);
            if (state.selectedBuildingType) setSelectedBuildingType(state.selectedBuildingType);
          }
          
          // Set results if available
          if (state.results) {
            setResults(state.results);
          }
        }

        // Set what-if analysis initial values
        setTempCarbonPrice(data.carbonCreditPrice || 15);
        setTempSize(data.projectSize || 0);
        
        // Set size min/max and units based on project type
        if (data.projectType === 'forestry') {
          setMinSize(10);
          setMaxSize(10000);
          setSizeUnit('ha');
        } else if (data.projectType === 'livestock') {
          setMinSize(100);
          setMaxSize(5000);
          setSizeUnit('animals');
        } else if (data.projectType === 'renewable') {
          setMinSize(1);
          setMaxSize(100);
          setSizeUnit('MW');
        } else if (data.projectType === 'construction') {
          setMinSize(1000);
          setMaxSize(100000);
          setSizeUnit('m²');
        }

        // Fetch project products
        fetchProjectProducts();
      } catch (err) {
        console.error('Error loading project:', err);
        setError(`Failed to load project: ${err.response?.data?.message || err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjectData();
  }, [projectId]);

  // Update what-if results when parameters change
  useEffect(() => {
    if (whatIfMode && results) {
      // Simple calculation for demonstration - in a real app, this would use your actual calculation logic
      const baseSequestration = results.totalSequestration || 0;
      const baseNPV = results.npv || 0;
      const baseROI = results.roi || 0;
      
      // Calculate changes based on size and price changes
      const sizeRatio = tempSize / (projectSize || 1);
      const priceRatio = tempCarbonPrice / (carbonCreditPrice || 1);
      
      const newSequestration = baseSequestration * sizeRatio;
      const newNPV = baseNPV * sizeRatio * priceRatio;
      const newROI = baseROI * priceRatio;
      
      setWhatIfResults({
        totalSequestration: newSequestration,
        npv: newNPV,
        roi: newROI
      });
    }
  }, [whatIfMode, tempSize, tempCarbonPrice, results, projectSize, carbonCreditPrice]);

  // Function to fetch project products
  const fetchProjectProducts = async () => {
    if (!projectId) return;
    
    try {
      const response = await api.get(`/marketplace/assessment-projects/${projectId}/products`);
      const data = response.data;
      
      console.log('Loaded project products:', data);
      setProjectProducts(data);
    } catch (err) {
      console.error('Error loading project products:', err);
    }
  };

  // Function to handle newly added products
  const handleProductAdded = (product) => {
    // Add the product to the local state
    setProjectProducts(prev => [...prev, product]);
    
    // Show feedback
    setSaveFeedback({
      type: 'success',
      message: `${product.name} added to your project!`
    });
    
    // Clear feedback after 3 seconds
    setTimeout(() => {
      setSaveFeedback(null);
    }, 3000);
    
    // Apply product effects to results if needed
    if (results) {
      try {
        const updatedResults = applyProductToProject(product, results);
        setResults(updatedResults);
      } catch (error) {
        console.error('Error applying product to results:', error);
      }
    }
  };

  // Function to handle removing a product from the project
  const handleRemoveProduct = async (productId) => {
    try {
      // Use the utility function from marketplaceApi.js
      await removeProductFromProject(projectId, productId);
      
      // Remove from local state - handle both product.id and product_id
      setProjectProducts(prev => prev.filter(p => p.id !== productId && p.product_id !== productId));
      
      // Show feedback
      setSaveFeedback({
        type: 'success',
        message: 'Product removed from project'
      });
      
      // Clear feedback after 3 seconds
      setTimeout(() => {
        setSaveFeedback(null);
      }, 3000);
      
    } catch (error) {
      console.error('Error removing product:', error);
      setSaveFeedback({
        type: 'error',
        message: `Error removing product: ${error.message}`
      });
    }
  };
  // Function to handle data from CarbonProspect - FIXED VERSION
  const handleProspectData = (data) => {
    console.log("Received prospect data:", data); // Debug logging
    
    // Only update values if they're different from current state
    if (data.scenarioName && data.scenarioName !== scenarioName)
      setScenarioName(data.scenarioName);
    
    // Don't set projectType here since we're managing it at this level now
    
    if (data.totalSequestration !== undefined && 
        data.totalSequestration !== calculatedEmissionsReduction)
      setCalculatedEmissionsReduction(data.totalSequestration);
    
    if (data.results && 
        JSON.stringify(data.results) !== JSON.stringify(results))
      setResults(data.results);
    
    // Only update if values actually changed
    if (data.projectSize !== undefined && 
        data.projectSize !== 0 && 
        data.projectSize !== projectSize) {
      console.log(`Updating projectSize from ${projectSize} to ${data.projectSize}`);
      setProjectSize(data.projectSize);
      setTempSize(data.projectSize); // Update what-if size too
    }
      
    if (data.projectYears !== undefined && 
        data.projectYears !== 0 && 
        data.projectYears !== projectYears) {
      console.log(`Updating projectYears from ${projectYears} to ${data.projectYears}`);
      setProjectYears(data.projectYears);
    }
      
    if (data.discountRate !== undefined && 
        data.discountRate !== discountRate) {
      console.log(`Updating discountRate from ${discountRate} to ${data.discountRate}`);
      setDiscountRate(data.discountRate);
    }
      
    if (data.carbonCreditPrice !== undefined && 
        data.carbonCreditPrice !== 0 && 
        data.carbonCreditPrice !== carbonCreditPrice) {
      console.log(`Updating carbonCreditPrice from ${carbonCreditPrice} to ${data.carbonCreditPrice}`);
      setCarbonCreditPrice(data.carbonCreditPrice);
      setTempCarbonPrice(data.carbonCreditPrice); // Update what-if price too
    }
    
    // Project-specific parameters
    if (data.projectType === 'forestry' && 
        data.treeType && 
        data.treeType !== treeType)
      setTreeType(data.treeType);
      
    if (data.projectType === 'livestock') {
      if (data.herdSize !== undefined && 
          data.herdSize !== 0 && 
          data.herdSize !== herdSize)
        setHerdSize(data.herdSize);
        
      if (data.animalType && 
          data.animalType !== animalType)
        setAnimalType(data.animalType);
        
      if (data.cattleType && 
          data.cattleType !== cattleType)
        setCattleType(data.cattleType);
    }
    
    if (data.projectType === 'renewable') {
      if (data.capacityMW !== undefined && 
          data.capacityMW !== 0 && 
          data.capacityMW !== capacityMW)
        setCapacityMW(data.capacityMW);
        
      if (data.renewableType && 
          data.renewableType !== renewableType)
        setRenewableType(data.renewableType);
    }
    
    if (data.projectType === 'soil' && 
        data.soilType && 
        data.soilType !== soilType)
      setSoilType(data.soilType);
      
    if (data.projectType === 'bluecarbon' && 
        data.blueCarbonType && 
        data.blueCarbonType !== blueCarbonType)
      setBlueCarbonType(data.blueCarbonType);
      
    if (data.projectType === 'redd' && 
        data.reddForestType && 
        data.reddForestType !== reddForestType)
      setReddForestType(data.reddForestType);
      
    if (data.projectType === 'construction') {
      if (data.buildingSize !== undefined && 
          data.buildingSize !== 0 && 
          data.buildingSize !== buildingSize)
        setBuildingSize(data.buildingSize);
        
      if (data.constructionCost !== undefined && 
          data.constructionCost !== 0 && 
          data.constructionCost !== constructionCost)
        setConstructionCost(data.constructionCost);
        
      if (data.operationalEmissions !== undefined && 
          data.operationalEmissions !== operationalEmissions)
        setOperationalEmissions(data.operationalEmissions);
        
      if (data.selectedBuildingType && 
          JSON.stringify(data.selectedBuildingType) !== JSON.stringify(selectedBuildingType))
        setSelectedBuildingType(data.selectedBuildingType);
    }
  };

  // Helper function to handle project type selection 
  const handleProjectTypeSelection = (type) => {
    console.log("Setting project type to:", type);
    setSelectedProjectType(type);
    
    // Reset state for previous project type to prevent carrying over irrelevant parameters
    setTreeType('pine');
    setHerdSize(1000);
    setAnimalType('cattle');
    setCattleType('dairy');
    setCapacityMW(10);
    setRenewableType('solar');
    setSoilType('cropland');
    setBlueCarbonType('mangrove');
    setReddForestType('tropical');
    setBuildingSize(10000);
    setConstructionCost(2500);
    setOperationalEmissions(30);
    setSelectedBuildingType(null);
    
    // Generate a new scenario name with the project type
    const projectTypeName = projectTypes.find(pt => pt.id === type)?.name || 'Project';
    setScenarioName(`New ${projectTypeName} Scenario`);
    
    // Set size min/max and units based on project type
    if (type === 'forestry') {
      setMinSize(10);
      setMaxSize(10000);
      setSizeUnit('ha');
      setProjectSize(100);
      setTempSize(100);
    } else if (type === 'livestock') {
      setMinSize(100);
      setMaxSize(5000);
      setSizeUnit('animals');
      setProjectSize(1000);
      setTempSize(1000);
    } else if (type === 'renewable') {
      setMinSize(1);
      setMaxSize(100);
      setSizeUnit('MW');
      setProjectSize(10);
      setTempSize(10);
    } else if (type === 'construction') {
      setMinSize(1000);
      setMaxSize(100000);
      setSizeUnit('m²');
      setProjectSize(10000);
      setTempSize(10000);
    } else {
      setMinSize(1);
      setMaxSize(1000);
      setSizeUnit('units');
      setProjectSize(100);
      setTempSize(100);
    }
  };
  
  // Function to open the scenario manager
  const openScenarioManager = () => {
    console.log("Opening scenario manager");
    setShowScenarioManager(true);
  };
  
  // Function to close the scenario manager
  const closeScenarioManager = () => {
    console.log("Closing scenario manager");
    setShowScenarioManager(false);
    // Refresh the scenarios list when closing
    setScenarioRefreshTrigger(prev => prev + 1);
  };

  // Function to prepare current data for scenario saving
  const getCurrentData = () => {
    // Construct a data object that contains all current state
    return {
      projectType: selectedProjectType,
      projectSize,
      projectYears,
      discountRate,
      carbonCreditPrice,
      results,
      // Include project type specific parameters based on the selected type
      ...(selectedProjectType === 'forestry' && { treeType }),
      ...(selectedProjectType === 'livestock' && { 
        herdSize, 
        animalType,
        cattleType 
      }),
      ...(selectedProjectType === 'renewable' && { 
        capacityMW, 
        renewableType 
      }),
      ...(selectedProjectType === 'soil' && { soilType }),
      ...(selectedProjectType === 'bluecarbon' && { blueCarbonType }),
      ...(selectedProjectType === 'redd' && { reddForestType }),
      ...(selectedProjectType === 'construction' && { 
        buildingSize, 
        constructionCost, 
        operationalEmissions,
        selectedBuildingType
      })
    };
  };
  
  // Function to manually save current scenario
  const handleManualSave = () => {
    if (!projectId || !currentScenarioId) {
      console.log("Cannot save - no project ID or scenario ID");
      return;
    }
    
    const currentData = getCurrentData();
    currentData.name = scenarioName;
    
    setLoading(true);
    
    saveScenario(projectId, currentData, currentScenarioId)
      .then(result => {
        if (result.success) {
          setSaveFeedback({
            type: 'success',
            message: 'Scenario saved successfully!'
          });
        } else {
          setSaveFeedback({
            type: 'error',
            message: `Failed to save scenario: ${result.error}`
          });
        }
        setLoading(false);
        
        // Clear feedback after 3 seconds
        setTimeout(() => {
          setSaveFeedback(null);
        }, 3000);
      })
      .catch(err => {
        setSaveFeedback({
          type: 'error',
          message: `Error saving scenario: ${err.message}`
        });
        setLoading(false);
        
        // Clear feedback after 3 seconds
        setTimeout(() => {
          setSaveFeedback(null);
        }, 3000);
      });
  };
  // Function to handle creating a new scenario
  const handleCreateNewScenario = (baseScenario = null) => {
    console.log("Creating new scenario", baseScenario ? "based on existing scenario" : "from scratch");
    
    // Clear current scenario ID to indicate we're creating a new one
    setCurrentScenarioId(null);
    
    // Set default project type if not already set
    if (!selectedProjectType) {
      console.log("No project type selected, defaulting to 'forestry'");
      setSelectedProjectType('forestry');
    }
    
    // Generate a new scenario name with timestamp to make it unique
    const timestamp = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });
    
    const newName = baseScenario ? 
      `${baseScenario.name} (Copy)` : 
      `New Scenario (${timestamp})`;
    
    setScenarioName(newName);
    
    // Create a basic empty results structure if we're starting from scratch
    if (!baseScenario && !results) {
      console.log("Creating default empty results structure");
      setResults({
        totalSequestration: 0,
        totalCost: 0,
        npv: 0,
        roi: 0
      });
    }
    
    // If we're duplicating a scenario, copy its values
    if (baseScenario) {
      console.log("Copying properties from base scenario:", baseScenario);
      
      // Copy project parameters if they exist
      if (baseScenario.projectSize) setProjectSize(baseScenario.projectSize);
      if (baseScenario.projectYears) setProjectYears(baseScenario.projectYears);
      if (baseScenario.discountRate) setDiscountRate(baseScenario.discountRate);
      if (baseScenario.carbonCreditPrice) setCarbonCreditPrice(baseScenario.carbonCreditPrice);
      
      // Copy project type specific parameters
      if (baseScenario.treeType) setTreeType(baseScenario.treeType);
      if (baseScenario.herdSize) setHerdSize(baseScenario.herdSize);
      if (baseScenario.animalType) setAnimalType(baseScenario.animalType);
      if (baseScenario.cattleType) setCattleType(baseScenario.cattleType);
      if (baseScenario.capacityMW) setCapacityMW(baseScenario.capacityMW);
      if (baseScenario.renewableType) setRenewableType(baseScenario.renewableType);
      if (baseScenario.soilType) setSoilType(baseScenario.soilType);
      if (baseScenario.blueCarbonType) setBlueCarbonType(baseScenario.blueCarbonType);
      if (baseScenario.reddForestType) setReddForestType(baseScenario.reddForestType);
      if (baseScenario.buildingSize) setBuildingSize(baseScenario.buildingSize);
      if (baseScenario.constructionCost) setConstructionCost(baseScenario.constructionCost);
      if (baseScenario.operationalEmissions) setOperationalEmissions(baseScenario.operationalEmissions);
      if (baseScenario.selectedBuildingType) setSelectedBuildingType(baseScenario.selectedBuildingType);
      
      // Copy results
      if (baseScenario.results) setResults(baseScenario.results);
    }
    
    // Now save the new scenario to the database
    if (projectId) {
      console.log("Attempting to save new scenario to database");
      const scenarioData = {
        name: newName,
        projectType: selectedProjectType || 'forestry',
        projectSize: projectSize || 100,
        projectYears: projectYears || 30,
        discountRate: discountRate || 0.05,
        carbonCreditPrice: carbonCreditPrice || 15,
        results: results || { totalSequestration: 0, totalCost: 0, npv: 0, roi: 0 },
        // Include project type specific parameters
        ...(selectedProjectType === 'forestry' && { treeType }),
        ...(selectedProjectType === 'livestock' && { 
          herdSize, 
          animalType,
          cattleType 
        }),
        ...(selectedProjectType === 'renewable' && { 
          capacityMW, 
          renewableType 
        }),
        ...(selectedProjectType === 'soil' && { soilType }),
        ...(selectedProjectType === 'bluecarbon' && { blueCarbonType }),
        ...(selectedProjectType === 'redd' && { reddForestType }),
        ...(selectedProjectType === 'construction' && { 
          buildingSize, 
          constructionCost, 
          operationalEmissions,
          selectedBuildingType
        })
      };
      
      // Set loading state
      setLoading(true);
      
      saveScenario(projectId, scenarioData)
        .then(result => {
          if (result.success) {
            console.log("Successfully saved new scenario:", result.data);
            setCurrentScenarioId(result.data.id);
            // Refresh the scenarios list
            setScenarioRefreshTrigger(prev => prev + 1);
            // Show success message
            setSaveFeedback({
              type: 'success',
              message: 'New scenario created successfully!'
            });
            
            // Clear feedback after 3 seconds
            setTimeout(() => {
              setSaveFeedback(null);
            }, 3000);
          } else {
            console.error("Failed to save new scenario:", result.error);
            setError(`Failed to save scenario: ${result.error}`);
            setSaveFeedback({
              type: 'error',
              message: `Failed to create scenario: ${result.error}`
            });
          }
          setLoading(false);
        })
        .catch(err => {
          console.error("Error saving new scenario:", err);
          setError(`Error saving scenario: ${err.message}`);
          setSaveFeedback({
            type: 'error',
            message: `Error creating scenario: ${err.message}`
          });
          setLoading(false);
        });
    } else {
      console.warn("Cannot save scenario - no project ID available");
    }
    
    // Trigger a refresh of the scenarios list
    setScenarioRefreshTrigger(prev => prev + 1);
    
    // After a small delay, focus on the scenario name input if it exists
    setTimeout(() => {
      const scenarioNameInput = document.querySelector('input[name="scenarioName"]') || 
                             document.getElementById('scenarioName');
      if (scenarioNameInput) {
        scenarioNameInput.focus();
      }
    }, 100);
  };

  // Function to handle loading a scenario from the ScenarioSummaryPanel
  const handleLoadScenario = (scenario) => {
    console.log("Loading scenario:", scenario);
    
    // First extract data in a consistent format regardless of structure
    const extractScenarioData = (inputScenario) => {
      // Unwrap from scenario wrapper if present
      const unwrappedScenario = inputScenario.scenario || inputScenario;
      
      // Get ID and name at the top level
      const id = unwrappedScenario.id;
      const name = unwrappedScenario.name || 'Unnamed Scenario';
      
      // Get data object which might be at different levels
      let mainData;
      let combinedResults = {};
      
      // Check for data property
      if (unwrappedScenario.data) {
        if (typeof unwrappedScenario.data === 'string') {
          try {
            // Try to parse if it's a string
            mainData = JSON.parse(unwrappedScenario.data);
          } catch (e) {
            console.error("Failed to parse scenario data string:", e);
            mainData = {};
          }
        } else {
          // It's already an object
          mainData = unwrappedScenario.data;
        }
      } else {
        // No data property, use the unwrapped scenario itself
        mainData = unwrappedScenario;
      }
      
      // Extract results from all possible locations
      if (unwrappedScenario.results) {
        const resultsObject = typeof unwrappedScenario.results === 'string' 
          ? JSON.parse(unwrappedScenario.results) 
          : unwrappedScenario.results;
        
        combinedResults = { ...combinedResults, ...resultsObject };
      }
      
      if (mainData.results) {
        const dataResults = typeof mainData.results === 'string'
          ? JSON.parse(mainData.results)
          : mainData.results;
        
        combinedResults = { ...combinedResults, ...dataResults };
      }
      
      // Build the final cleaned data object
      const finalData = {
        id,
        name,
        ...mainData,  // Include all fields from mainData
        results: Object.keys(combinedResults).length > 0 ? combinedResults : null
      };
      
      // Remove any nested data property to avoid duplication
      if (finalData.data) delete finalData.data;
      
      console.log("Normalized scenario data:", finalData);
      return finalData;
    };
    
    // Extract scenario data in a consistent format
    const normalizedScenario = extractScenarioData(scenario);
    
    // First, reset all parameters to defaults
    setTreeType('pine');
    setHerdSize(1000);
    setAnimalType('cattle');
    setCattleType('dairy');
    setCapacityMW(10);
    setRenewableType('solar');
    setSoilType('cropland');
    setBlueCarbonType('mangrove');
    setReddForestType('tropical');
    setBuildingSize(10000);
    setConstructionCost(2500);
    setOperationalEmissions(30);
    setSelectedBuildingType(null);
    
    // Set basic information - ID and name
    if (normalizedScenario.id) {
      setCurrentScenarioId(normalizedScenario.id);
    }
    
    if (normalizedScenario.name) {
      setScenarioName(normalizedScenario.name);
    }
    
    // Set project type if available (this is critical)
    if (normalizedScenario.projectType) {
      console.log("Setting project type to:", normalizedScenario.projectType);
      setSelectedProjectType(normalizedScenario.projectType);
    }
    
    // Handle common parameters with type conversion for numbers
    // Use the 'in' operator to handle zero values correctly
    if ('projectSize' in normalizedScenario) {
      const size = Number(normalizedScenario.projectSize);
      console.log(`Setting projectSize to ${size}`);
      setProjectSize(size);
      setTempSize(size); // Update what-if size too
    }
    
    if ('projectYears' in normalizedScenario) {
      const years = Number(normalizedScenario.projectYears);
      console.log(`Setting projectYears to ${years}`);
      setProjectYears(years);
    }
    
    if ('discountRate' in normalizedScenario) {
      const rate = Number(normalizedScenario.discountRate);
      console.log(`Setting discountRate to ${rate}`);
      setDiscountRate(rate);
    }
    
    if ('carbonCreditPrice' in normalizedScenario) {
      const price = Number(normalizedScenario.carbonCreditPrice);
      console.log(`Setting carbonCreditPrice to ${price}`);
      setCarbonCreditPrice(price);
      setTempCarbonPrice(price); // Update what-if price too
    }
    
    // Handle all project-specific parameters
    if ('treeType' in normalizedScenario) {
      const type = normalizedScenario.treeType;
      console.log(`Setting treeType to ${type}`);
      setTreeType(type);
    }
    
    if ('herdSize' in normalizedScenario) {
      setHerdSize(Number(normalizedScenario.herdSize));
    }
    
    if ('animalType' in normalizedScenario) {
      setAnimalType(normalizedScenario.animalType);
    }
    
    if ('cattleType' in normalizedScenario) {
      setCattleType(normalizedScenario.cattleType);
    }
    
    if ('feedType' in normalizedScenario) {
      setFeedType(normalizedScenario.feedType);
    }
    
    if ('capacityMW' in normalizedScenario) {
      setCapacityMW(Number(normalizedScenario.capacityMW));
    }
    
    if ('renewableType' in normalizedScenario) {
      setRenewableType(normalizedScenario.renewableType);
    }
    
    if ('soilType' in normalizedScenario) {
      setSoilType(normalizedScenario.soilType);
    }
    
    if ('blueCarbonType' in normalizedScenario) {
      setBlueCarbonType(normalizedScenario.blueCarbonType);
    }
    
    if ('reddForestType' in normalizedScenario) {
      setReddForestType(normalizedScenario.reddForestType);
    }
    
    if ('buildingSize' in normalizedScenario) {
      setBuildingSize(Number(normalizedScenario.buildingSize));
    }
    
    if ('constructionCost' in normalizedScenario) {
      setConstructionCost(Number(normalizedScenario.constructionCost));
    }
    
    if ('operationalEmissions' in normalizedScenario) {
      setOperationalEmissions(Number(normalizedScenario.operationalEmissions));
    }
    
    if ('selectedBuildingType' in normalizedScenario) {
      setSelectedBuildingType(normalizedScenario.selectedBuildingType);
    }
    
    // Load results data if available
    if (normalizedScenario.results) {
      console.log("Loading results:", normalizedScenario.results);
      setResults(normalizedScenario.results);
      
      if ('totalSequestration' in normalizedScenario.results) {
        setCalculatedEmissionsReduction(Number(normalizedScenario.results.totalSequestration));
      }
    }
    
    // Display feedback
    setSaveFeedback({
      type: 'success',
      message: `Scenario "${normalizedScenario.name}" loaded successfully!`
    });
    
    // Clear feedback after 3 seconds
    setTimeout(() => {
      setSaveFeedback(null);
    }, 3000);
    
    // Trigger a refresh of the scenarios list
    setScenarioRefreshTrigger(prev => prev + 1);
    
    // Force a re-render after a short delay to ensure all state updates are applied
    setTimeout(() => {
      setScenarioRefreshTrigger(prev => prev + 1);
    }, 200);
  };
  
  // Enhanced save project function with debugging and more flexible validation
  const saveAsProject = async () => {
    if (!projectName.trim()) {
      setError("Project name is required");
      return;
    }
    
    setLoading(true);
    
    try {
      // Gather current state from both components
      const projectData = {
        name: projectName,
        projectType: selectedProjectType,
        serializedState: {
          scenarioName,
          projectType: selectedProjectType,
          projectSize,
          projectYears,
          discountRate,
          carbonCreditPrice,
          // Include project type specific parameters
          ...(selectedProjectType === 'forestry' && { treeType }),
          ...(selectedProjectType === 'livestock' && { 
            herdSize, 
            animalType,
            cattleType 
          }),
          ...(selectedProjectType === 'renewable' && { 
            capacityMW, 
            renewableType 
          }),
          ...(selectedProjectType === 'soil' && { soilType }),
          ...(selectedProjectType === 'bluecarbon' && { blueCarbonType }),
          ...(selectedProjectType === 'redd' && { reddForestType }),
          ...(selectedProjectType === 'construction' && { 
            buildingSize, 
            constructionCost, 
            operationalEmissions,
            selectedBuildingType
          }),
          results
        }
      };
      
      // For updating existing project
      if (projectId) {
        const response = await api.put(`/assessment-projects/${projectId}`, projectData);
        setSaveFeedback({
          type: 'success',
          message: 'Project updated successfully!'
        });
      } 
      // For creating new project
      else {
        const response = await api.post('/assessment-projects', projectData);
        const data = response.data;
        
        // Redirect to the edit page for the new project
        navigate(`/carbon-project/${data.id}`);
        
        setSaveFeedback({
          type: 'success',
          message: 'Project created successfully!'
        });
      }
    } catch (err) {
      console.error('Error saving project:', err);
      setError(`Failed to save project: ${err.response?.data?.message || err.message}`);
      setSaveFeedback({
        type: 'error',
        message: `Failed to save project: ${err.response?.data?.message || err.message}`
      });
    } finally {
      setLoading(false);
      
      // Clear feedback after 3 seconds
      setTimeout(() => {
        setSaveFeedback(null);
      }, 3000);
    }
  };

  // New function to delete the project
  const deleteProject = async () => {
    if (!projectId) {
      console.error("No project ID to delete");
      return;
    }
    
    setLoading(true);
    
    try {
      await api.delete(`/assessment-projects/${projectId}`);
      
      // Close the confirmation dialog
      setShowDeleteConfirm(false);
      
      // Show success message briefly before navigating
      setSaveFeedback({
        type: 'success',
        message: 'Project deleted successfully!'
      });
      
      // Navigate back to dashboard after a brief delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
      
    } catch (err) {
      console.error("Error deleting project:", err);
      setError(`Failed to delete project: ${err.response?.data?.message || err.message}`);
      setSaveFeedback({
        type: 'error',
        message: `Failed to delete project: ${err.response?.data?.message || err.message}`
      });
      setLoading(false);
    }
  };
  return (
    <div className="carbon-project-page relative min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 -mt-16 -mr-32 hidden lg:block pointer-events-none z-0">
        <svg width="404" height="384" fill="none" viewBox="0 0 404 384" className="text-green-50">
          <defs>
            <pattern id="de316486-4a29-4312-bdfc-fbce2132a2c1" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <rect x="0" y="0" width="4" height="4" className="text-green-200" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="404" height="384" fill="url(#de316486-4a29-4312-bdfc-fbce2132a2c1)" />
        </svg>
      </div>
      
      <div className="absolute bottom-0 left-0 -mb-16 -ml-32 hidden lg:block pointer-events-none z-0">
        <svg width="404" height="384" fill="none" viewBox="0 0 404 384" className="text-blue-50">
          <defs>
            <pattern id="de316486-4a29-4312-bdfc-fbce2132a2c2" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <rect x="0" y="0" width="4" height="4" className="text-blue-200" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="404" height="384" fill="url(#de316486-4a29-4312-bdfc-fbce2132a2c2)" />
        </svg>
      </div>

      {/* Interactive Onboarding Help */}
      {showOnboarding && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Welcome to Carbon Project Calculator</h2>
              <button 
                onClick={() => {
                  localStorage.setItem('carbonProjectOnboardingComplete', 'true');
                  setShowOnboarding(false);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              {onboardingStep === 1 && (
                <div>
                  <p className="mb-4">This tool helps you model carbon reduction projects and estimate their financial impact. Let's get started!</p>
                  <img src="/onboarding/step1.png" alt="Project Type Selection" className="mb-4 rounded-lg border" />
                  <p className="text-sm text-gray-600">First, select a project type to begin your carbon assessment.</p>
                </div>
              )}
              
              {onboardingStep === 2 && (
                <div>
                  <p className="mb-4">After selecting a project type, you'll need to enter the basic parameters.</p>
                  <img src="/onboarding/step2.png" alt="Basic Parameters" className="mb-4 rounded-lg border" />
                  <p className="text-sm text-gray-600">Adjust parameters like project size, carbon credit price, and discount rate.</p>
                </div>
              )}
              
              {onboardingStep === 3 && (
                <div>
                  <p className="mb-4">Once parameters are set, your results will automatically calculate!</p>
                  <img src="/onboarding/step3.png" alt="Results Section" className="mb-4 rounded-lg border" />
                  <p className="text-sm text-gray-600">View emissions reductions, NPV, ROI, and other financial metrics.</p>
                </div>
              )}
              
              {onboardingStep === 4 && (
                <div>
                  <p className="mb-4">Save different versions of your project as scenarios to compare approaches.</p>
                  <img src="/onboarding/step4.png" alt="Scenario Management" className="mb-4 rounded-lg border" />
                  <p className="text-sm text-gray-600">Create, save, and compare different project scenarios to find the optimal approach.</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-between">
              <button
                onClick={() => setOnboardingStep(prev => Math.max(1, prev - 1))}
                disabled={onboardingStep === 1}
                className={`px-4 py-2 rounded ${onboardingStep === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Previous
              </button>
              
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4].map(step => (
                  <div 
                    key={step}
                    className={`w-2 h-2 rounded-full ${onboardingStep === step ? 'bg-green-600' : 'bg-gray-300'}`}
                  ></div>
                ))}
              </div>
              
              {onboardingStep < 4 ? (
                <button
                  onClick={() => setOnboardingStep(prev => prev + 1)}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={() => {
                    localStorage.setItem('carbonProjectOnboardingComplete', 'true');
                    setShowOnboarding(false);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Get Started
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Scenario Manager Modal */}
      {showScenarioManager && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto shadow-xl">
            <ScenarioManager 
              projectId={projectId}
              scenarioName={scenarioName}
              setScenarioName={setScenarioName}
              currentData={getCurrentData()}
              onLoadScenario={handleLoadScenario}
              onClose={closeScenarioManager}
              onCreateNew={handleCreateNewScenario}
            />
          </div>
        </div>
      )}

      {/* Delete Project Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <div className="mb-4">
              <div className="flex items-center justify-center bg-red-100 w-12 h-12 rounded-full mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-center">Delete Project</h3>
              <p className="text-center text-gray-600 mt-2">
                Are you sure you want to delete the project "{projectName}"? This action cannot be undone and will permanently delete the project and all associated scenarios.
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={deleteProject}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete Project'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content with CarbonProspect Component */}
      <div className="mx-auto max-w-7xl relative z-10">
        <div className="py-5 px-4 sm:px-6 lg:px-8">
          {/* Page Title Bar with Breadcrumbs */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-gradient-to-br from-green-100 to-blue-100 opacity-30 rounded-bl-full"></div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center text-sm text-gray-500 mb-1">
                  <a href="/" className="hover:text-green-600 transition-colors">Home</a>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mx-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <a href="/dashboard" className="hover:text-green-600 transition-colors">Dashboard</a>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mx-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="text-gray-700">Carbon Project {projectId ? 'Editor' : 'Creator'}</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center flex-wrap">
                  <span className="bg-gradient-to-r from-green-700 to-green-500 bg-clip-text text-transparent">
                    {projectId ? `Edit Assessment Project` : 'Create New Assessment Project'}
                  </span>
                  <span className="ml-3 mt-1 text-xs font-medium px-2 py-1 bg-green-100 text-green-800 rounded-full">
                    Pre-Feasibility Tool
                  </span>
                </h1>
              </div>
              
              <div className="mt-4 md:mt-0 flex space-x-2">
                <button
                  onClick={() => navigate('/dashboard')} 
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Dashboard
                </button>
                
                {/* Manage Scenarios button */}
                {projectId && (
                  <button 
                    onClick={openScenarioManager}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors shadow-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Manage Scenarios
                  </button>
                )}
                
                {/* Save as Project button with loading state */}
                <button 
                  onClick={saveAsProject}
                  disabled={loading}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none transition-colors"
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
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      {projectId ? 'Update Project' : 'Save as Project'}
                    </>
                  )}
                </button>
                
                {/* Delete Project button - only show if we have a project ID */}
                {projectId && (
                  <button 
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={loading}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Project
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Error display with improved styling */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 shadow-sm animate-fadeIn">
              <p className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 90 0118 0z" />
               </svg>
               {error}
             </p>
             {error.includes("required fields") && (
               <p className="mt-2 text-sm text-red-600 ml-7">
                 Please fill in all required fields to continue or click Save again to save as a draft.
               </p>
             )}
           </div>
         )}
         
         {/* Feedback Message */}
         {saveFeedback && (
           <div className={`mb-4 p-4 ${saveFeedback.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'} rounded-lg flex items-start shadow-sm animate-fadeIn`}>
             <div className={`flex-shrink-0 h-5 w-5 ${saveFeedback.type === 'success' ? 'text-green-500' : 'text-red-500'} mr-2 mt-0.5`}>
               {saveFeedback.type === 'success' ? (
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                   <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <p>{saveFeedback.message}</p>
          </div>
        )}
        
        {/* Assessment Type Selection - Side by Side Layout */}
        {showAssessmentTypeSelection && (
          <div className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Select Your Assessment Type</h2>
            
            {/* Enforcing horizontal layout with flex-row and preventing wrapping */}
            <div className="flex flex-col md:flex-row md:flex-nowrap md:space-x-6 space-y-6 md:space-y-0">
              {/* Carbon Footprint Card - LEFT SIDE */}
              <div className="md:w-1/2">
                <button 
                  onClick={() => handleAssessmentTypeSelection('carbon-footprint')}
                  className={`w-full h-full group relative bg-white rounded-xl shadow-md overflow-hidden border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 focus:outline-none ${
                    assessmentType === 'carbon-footprint' 
                      ? 'border-blue-500' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-blue-100 to-transparent opacity-40 rounded-bl-full"></div>
                  <div className="p-8 relative z-10">
                    <div className="flex items-center mb-6">
                      <div className="p-3 bg-blue-100 rounded-lg text-blue-700 mr-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">Carbon Footprint</h2>
                    </div>
                    
                    <p className="text-gray-600 mb-6">
                      Calculate and report on your organization's greenhouse gas emissions for compliance, disclosure, or sustainability initiatives.
                    </p>
                    
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Includes tools for:</h3>
                      <ul className="space-y-2">
                        <li className="flex items-start">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>GHG Protocol-aligned emissions inventory</span>
                        </li>
                        <li className="flex items-start">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Scope 1, 2, and 3 emissions calculation</span>
                        </li>
                        <li className="flex items-start">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Regulatory compliance reporting (CSRD, TCFD)</span>
                        </li>
                        <li className="flex items-start">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Science-based target setting and tracking</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="flex items-center text-blue-600 group-hover:text-blue-800 font-medium">
                      <span>Start Carbon Footprint Assessment</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </div>
                  </div>
                </button>
              </div>
              
              {/* Carbon Project Card - RIGHT SIDE */}
              <div className="md:w-1/2">
                <button 
                  onClick={() => handleAssessmentTypeSelection('carbon-project')}
                  className={`w-full h-full group relative bg-white rounded-xl shadow-md overflow-hidden border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 focus:outline-none ${
                    assessmentType === 'carbon-project' 
                      ? 'border-green-500' 
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-green-100 to-transparent opacity-40 rounded-bl-full"></div>
                  <div className="p-8 relative z-10">
                    <div className="flex items-center mb-6">
                      <div className="p-3 bg-green-100 rounded-lg text-green-700 mr-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">Carbon Project</h2>
                    </div>
                    
                    <p className="text-gray-600 mb-6">
                      Create and assess carbon reduction or sequestration initiatives that generate carbon credits with financial and environmental analysis.
                    </p>
                    
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Includes tools for:</h3>
                      <ul className="space-y-2">
                        <li className="flex items-start">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Pre-feasibility carbon project assessment</span>
                        </li>
                        <li className="flex items-start">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Financial modeling (NPV, ROI, payback period)</span>
                        </li>
                        <li className="flex items-start">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Carbon credit generation estimates</span>
                        </li>
                        <li className="flex items-start">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Project development recommendations</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="flex items-center text-green-600 group-hover:text-green-800 font-medium">
                      <span>Start Carbon Project Assessment</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Only show project content if assessment type selection is completed or we're editing an existing project */}
        {(!showAssessmentTypeSelection || projectId) && (
          <>
            {/* Project Type Selection */}
            <div className="mb-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200 relative overflow-hidden" id="project-type">
              <div className="absolute left-0 bottom-0 w-24 h-24 bg-gradient-to-tr from-green-100 to-transparent opacity-40 rounded-tr-full"></div>
              <h2 className="text-lg font-medium mb-4 text-green-700 border-b pb-2 relative z-10">
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Project Type
                </span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 relative z-10">
                {projectTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => handleProjectTypeSelection(type.id)}
                    className={`p-3 rounded-lg border ${
                      selectedProjectType === type.id
                        ? 'bg-green-100 border-green-500 text-green-800 shadow-md'
                        : 'bg-white hover:bg-green-50 border-gray-200 hover:border-green-300'
                    } transition-all duration-200 transform hover:-translate-y-1`}
                    type="button"
                  >
                    <div className="text-2xl mb-1">{type.icon}</div>
                    <div className="font-medium">{type.name}</div>
                    <div className="text-xs text-gray-500 mt-1 line-clamp-2">{type.description}</div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Project Name Input */}
            <div className="mb-4 bg-white p-5 rounded-lg shadow-sm border border-gray-200 relative overflow-hidden">
              <div className="absolute right-0 bottom-0 w-24 h-24 bg-gradient-to-tl from-blue-100 to-transparent opacity-40 rounded-tl-full"></div>
              <Tooltip text="Enter a descriptive name for your carbon project. This name will appear in your dashboard and project listings.">
                <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-1 relative z-10">
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    Project Name
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                </label>
              </Tooltip>
              <input
                type="text"
                id="projectName"
                name="projectName"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 relative z-10"
                placeholder="Enter project name"
              />
              <p className="mt-1 text-sm text-gray-500 relative z-10">
                This name will appear in your dashboard and project listings.
              </p>
            </div>
            
            <div className="mt-4 mb-6 flex flex-wrap gap-3">
              <button
                onClick={() => {
                  if (!projectId) {
                    saveAsProject();
                  } else {
                    handleCreateNewScenario();
                  }
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                {projectId ? 'Create New Scenario' : 'Save Project'}
              </button>
              
              {projectId && (
                <button
                  onClick={openScenarioManager}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  Manage Scenarios
                </button>
              )}
            </div>
            
            {/* Scenario Summary Panel */}
            {projectId && (
              <div className="mb-4">
                <ScenarioSummaryPanel
                  projectId={projectId}
                  currentScenarioId={currentScenarioId}
                  currentScenarioName={scenarioName}
                  onLoadScenario={handleLoadScenario}
                  onCreateNewScenario={handleCreateNewScenario}
                  refreshScenarios={scenarioRefreshTrigger}
                />
              </div>
            )}
            
            {/* What-If Analysis Section */}
            {projectId && results && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-yellow-800 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    What-If Analysis Mode
                  </h3>
                  <label className="inline-flex items-center cursor-pointer">
                    <input type="checkbox" value="" className="sr-only peer" 
                          checked={whatIfMode} 
                          onChange={() => setWhatIfMode(!whatIfMode)} />
                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-700">{whatIfMode ? 'Enabled' : 'Disabled'}</span>
                  </label>
                </div>
                
                {whatIfMode && (
                  <div className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Carbon Credit Price ($)</label>
                        <input
                          type="range"
                          min="5"
                          max="100"
                          value={tempCarbonPrice}
                          onChange={(e) => setTempCarbonPrice(Number(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>$5</span>
                          <span className="font-medium text-blue-600">${tempCarbonPrice}</span>
                          <span>$100</span>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Project Size ({sizeUnit})</label>
                        <input
                          type="range"
                          min={minSize}
                          max={maxSize}
                          value={tempSize}
                          onChange={(e) => setTempSize(Number(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>{minSize}</span>
                          <span className="font-medium text-blue-600">{tempSize} {sizeUnit}</span>
                          <span>{maxSize}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-end">
                        <button
                          onClick={() => {
                            setCarbonCreditPrice(tempCarbonPrice);
                            setProjectSize(tempSize);
                          }}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
                        >
                          Apply Changes
                        </button>
                      </div>
                    </div>
                    
                    {whatIfResults && (
                      <div className="mt-4 p-3 bg-white rounded border">
                        <div className="text-sm font-medium mb-2">Projected Results with Changes:</div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <div className="text-xs text-gray-500">Sequestration</div>
                            <div className="text-lg font-medium text-green-700">{Math.round(whatIfResults.totalSequestration).toLocaleString()} tCO2e</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {whatIfResults.totalSequestration > (results?.totalSequestration || 0) ? (
                                <span className="text-green-600">+{Math.round(whatIfResults.totalSequestration - (results?.totalSequestration || 0)).toLocaleString()} tCO2e</span>
                              ) : (
                                <span className="text-red-600">{Math.round(whatIfResults.totalSequestration - (results?.totalSequestration || 0)).toLocaleString()} tCO2e</span>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <div className="text-xs text-gray-500">NPV</div>
                            <div className="text-lg font-medium text-green-700">${Math.round(whatIfResults.npv).toLocaleString()}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {whatIfResults.npv > (results?.npv || 0) ? (
                                <span className="text-green-600">+${Math.round(whatIfResults.npv - (results?.npv || 0)).toLocaleString()}</span>
                              ) : (
                                <span className="text-red-600">${Math.round(whatIfResults.npv - (results?.npv || 0)).toLocaleString()}</span>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <div className="text-xs text-gray-500">ROI</div>
                            <div className="text-lg font-medium text-green-700">{Math.round(whatIfResults.roi)}%</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {whatIfResults.roi > (results?.roi || 0) ? (
                                <span className="text-green-600">+{Math.round(whatIfResults.roi - (results?.roi || 0))}%</span>
                              ) : (
                                <span className="text-red-600">{Math.round(whatIfResults.roi - (results?.roi || 0))}%</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Main Content - CarbonProspect Component with Tabs */}
            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 relative overflow-hidden">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
                  <span className="ml-3 text-lg text-gray-700">Loading project data...</span>
                </div>
              ) : (
                <div>
                  <div className="mb-6">
                    <div className="flex border-b mb-4">
                      <button
                        className={`mr-4 pb-2 cursor-pointer ${activeTab === 0 ? 'border-b-2 border-green-500 text-green-600 font-medium' : 'text-gray-600'}`}
                        onClick={() => setActiveTab(0)}
                      >
                        Project Details
                      </button>
                    </div>
                    
                    {activeTab === 0 && (
                      <CarbonProspect 
                        onDataUpdate={handleProspectData}
                        refreshToken={refreshToken}
                        projectId={projectId}
                        initialScenarioName={scenarioName}
                        selectedProjectType={selectedProjectType}
                        onProjectTypeChange={handleProjectTypeSelection}
                        currentScenarioId={currentScenarioId}
                        onScenarioUpdated={() => setScenarioRefreshTrigger(prev => prev + 1)}
                        onCreateNewScenario={handleCreateNewScenario}
                        // CRITICAL: Pass all state variables as props to CarbonProspect
                        projectSize={projectSize}
                        projectYears={projectYears}
                        discountRate={discountRate}
                        carbonCreditPrice={carbonCreditPrice}
                        treeType={treeType}
                        herdSize={herdSize}
                        animalType={animalType}
                        cattleType={cattleType}
                        feedType={feedType}
                        capacityMW={capacityMW}
                        renewableType={renewableType}
                        soilType={soilType}
                        blueCarbonType={blueCarbonType}
                        reddForestType={reddForestType}
                        buildingSize={buildingSize}
                        constructionCost={constructionCost}
                        operationalEmissions={operationalEmissions}
                        selectedBuildingType={selectedBuildingType}
                        results={results}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Carbon Reduction Solutions Section - UPDATED */}
            {projectId && (
              <div className="mt-6 bg-white p-5 rounded-lg shadow-sm border border-gray-200 relative overflow-hidden">
                <h2 className="text-lg font-medium mb-4 text-green-700 border-b pb-2 relative z-10">
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Carbon Reduction Solutions
                  </span>
                </h2>
                
                <AssessmentProductSelector 
                  projectId={projectId}
                  projectType={selectedProjectType}
                  onProductAdded={handleProductAdded}
                />
                
                {/* Display selected products - UPDATED */}
                {projectProducts.length > 0 && (
                  <div className="mt-6 border-t pt-4">
                    <h3 className="text-lg font-semibold mb-3">Selected Solutions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {projectProducts.map(product => (
                        <div key={product.id || product.product_id} className="border rounded-lg p-4">
                          <div className="flex justify-between">
                            <h4 className="font-medium">{product.name}</h4>
                            <button 
                              onClick={() => handleRemoveProduct(product.id || product.product_id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                          <p className="text-sm text-gray-600">{product.description}</p>
                          <div className="mt-2">
                            <span className="text-sm">Quantity: {product.quantity}</span>
                            {product.notes && (
                              <p className="text-sm mt-1">Notes: {product.notes}</p>
                            )}
                          </div>
                          <div className="mt-2">
                            <span className="text-sm font-semibold">
                              Emissions Reduction: 
                              {Math.round((product.emissionsReduction || product.emissions_reduction_factor) * 100 * (product.quantity || 1))}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
        
        {/* Footer with help information */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-200 text-center text-gray-600 text-sm">
          <p>Need help with your carbon project? <a href="/help/carbon-projects" className="text-green-600 hover:text-green-800 transition-colors font-medium">View documentation</a> or <a href="/support" className="text-green-600 hover:text-green-800 transition-colors font-medium">contact support</a>.</p>
        </div>
      </div>
    </div>

    {/* Floating Quick Action Button */}
    <div className="fixed bottom-6 right-6 z-20">
      <div className="relative group">
        <button 
          className="flex items-center justify-center p-3 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          onClick={() => setShowQuickActions(!showQuickActions)}
        >
          {showQuickActions ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          )}
        </button>
        
        {showQuickActions && (
          <div className="absolute bottom-full right-0 mb-2 flex flex-col space-y-2 items-end">
            {projectId && currentScenarioId && (
              <button
                onClick={handleManualSave}
                className="flex items-center px-4 py-2 bg-white text-green-700 rounded-lg border border-green-500 shadow-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save Scenario
              </button>
            )}
            
            {projectId && (
              <button
                onClick={handleCreateNewScenario}
                className="flex items-center px-4 py-2 bg-white text-blue-700 rounded-lg border border-blue-500 shadow-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                New Scenario
              </button>
            )}
            
            <button
              onClick={saveAsProject}
              className="flex items-center px-4 py-2 bg-white text-purple-700 rounded-lg border border-purple-500 shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              {projectId ? 'Update Project' : 'Save as Project'}
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
);
}

export default CarbonProjectPage;