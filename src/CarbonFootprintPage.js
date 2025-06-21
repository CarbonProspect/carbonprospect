import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import EmissionsCalculator from './components/EmissionsCalculator';
import EmissionsReportGenerator from './components/EmissionsReportGenerator';
import emissionsService from './Services/emissionsService';
import { useAuth } from './AuthSystem';
import api from './api-config';

// ✅ CLEAN: Only import carbon footprint specific components
import CarbonFootprintScenarioPanel from './CarbonFootprintScenarioPanel';
import CarbonFootprintScenarioManager from './CarbonFootprintScenarioManager';

// ✅ CLEAN: Only import the scenarios utilities we actually use
import { getScenarios, saveScenario, deleteScenario } from './utils/carbonFootprintScenarioUtils';

// Add legislation compliance imports
import { legislationData, getApplicableLegislation } from './utils/complianceLegislation';
import LegislationDetailsModal from './components/LegislationDetailsModal';

// Add this after your existing imports
import { debounce } from 'lodash'; // Or use the debounce function already defined in the file

function CarbonFootprintPage() {
  // Get auth functions and navigation
  const { refreshToken } = useAuth();
  const navigate = useNavigate();
  const routerLocation = useLocation(); // Renamed to avoid conflict with location state
  const params = useParams();
  const footprintId = params.footprintId; // Get footprintId from URL parameter
  // State for project data and UI
  const [loading, setLoading] = useState(footprintId ? true : false);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [scenarioRefreshTrigger, setScenarioRefreshTrigger] = useState(0);
  const [showScenarioManager, setShowScenarioManager] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  
  // New state for assessment type selection
  // If we're on the carbon footprint page, we already know the type is 'carbon-footprint'
  const [assessmentType, setAssessmentType] = useState('carbon-footprint');
  // Only show assessment selection if we're creating from a generic "new assessment" route
  const [showAssessmentTypeSelection, setShowAssessmentTypeSelection] = useState(!footprintId);
  
  // State for tab navigation and emissions data
  const [activeTab, setActiveTab] = useState(0);
  const [emissionsData, setEmissionsData] = useState(null);
  const [reductionStrategies, setReductionStrategies] = useState([]);
  
  // Project-level state
  const [projectName, setProjectName] = useState('New Carbon Footprint');
  const [organizationType, setOrganizationType] = useState('');
  
  // Project state from emissions calculator
  const [scenarioName, setScenarioName] = useState('New Scenario');
  const [currentScenarioId, setCurrentScenarioId] = useState(null);
  
  // Organization-specific state variables
  const [employeeCount, setEmployeeCount] = useState(0);
  const [facilityCount, setFacilityCount] = useState(0);
  const [fleetSize, setFleetSize] = useState(0);
  const [annualRevenue, setAnnualRevenue] = useState(0);
  const [industryType, setIndustryType] = useState('');
  const [reportingYear, setReportingYear] = useState(new Date().getFullYear() - 1);
  
  // New location state for reporting requirements
  const [location, setLocation] = useState('');
  
  // Save feedback state
  const [saveFeedback, setSaveFeedback] = useState(null);

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(!localStorage.getItem('carbonFootprintOnboardingComplete'));
  const [onboardingStep, setOnboardingStep] = useState(1);

  // Track when initial data has been loaded
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  
  // State to hold scenarios for the report
  const [scenarios, setScenarios] = useState([]);

  // 🔧 CRITICAL: New state for emissions calculator data
  const [emissionsInitialData, setEmissionsInitialData] = useState(null);
  const [forceEmissionsReload, setForceEmissionsReload] = useState(0); // Force key for remounting
  const [currentEmissionsState, setCurrentEmissionsState] = useState({
    rawInputs: {},
    emissionValues: {},
    reductionStrategies: [],
    reductionTarget: 20,
    emissions: { scope1: 0, scope2: 0, scope3: 0, total: 0 },
    activeSection: {
      location: false,
      direct: true,
      indirect: false,
      valueChain: false,
      results: false,
      obligations: false,
      strategies: false
    }
  });

  // 🔧 NEW: Function to handle scenario comparison
  const [showScenarioComparison, setShowScenarioComparison] = useState(false);
  const [comparisonScenarios, setComparisonScenarios] = useState([]);

  // Add legislation-related state variables
  const [selectedLegislation, setSelectedLegislation] = useState(null);
  const [showLegislationModal, setShowLegislationModal] = useState(false);
  const [showReportingObligations, setShowReportingObligations] = useState(false);
  
  // Create debounced function that accepts parameters
  const autoSaveProjectData = useMemo(
    () => debounce(async (values) => {
      if (!values.footprintId || !values.projectName.trim()) {
        console.log('Cannot auto-save: missing footprint ID or project name');
        return;
      }
      
      const footprintData = {
        name: values.projectName,
        organizationType: values.organizationType || 'corporate',
        location: values.location || '',
        employeeCount: values.employeeCount,
        facilityCount: values.facilityCount,
        fleetSize: values.fleetSize,
        annualRevenue: values.annualRevenue,
        industryType: values.industryType,
        reportingYear: values.reportingYear,
        serializedState: {
          scenarioName: values.scenarioName,
          organizationType: values.organizationType || 'corporate',
          employeeCount: values.employeeCount,
          facilityCount: values.facilityCount,
          fleetSize: values.fleetSize,
          annualRevenue: values.annualRevenue,
          industryType: values.industryType,
          reportingYear: values.reportingYear,
          location: values.location
        }
      };
      
      try {
        console.log('🔄 Auto-saving project data...');
        console.log('📤 Sending to API:', JSON.stringify(footprintData, null, 2));

        await api.put(`/carbon-footprints/${values.footprintId}`, footprintData);
        
        console.log('✅ Project data auto-saved successfully');
        // Optionally show a subtle save indicator
        setSaveFeedback({
          type: 'success',
          message: 'Changes saved automatically'
        });
        setTimeout(() => setSaveFeedback(null), 2000);
      } catch (err) {
        console.error('❌ Auto-save failed:', err);
      }
    }, 2000), // 2 second debounce
    [] // Empty dependency array - function created once
  );
  
  // Pass current values when calling
  useEffect(() => {
    // Only auto-save if we have a footprintId AND initial data has been loaded
    if (footprintId && initialDataLoaded) {
      console.log('✅ Initial data loaded, auto-save enabled');
      autoSaveProjectData({
        footprintId,
        projectName,
        employeeCount,
        facilityCount,
        fleetSize,
        annualRevenue,
        industryType,
        reportingYear,
        location,
        organizationType,
        scenarioName
      });
    } else {
      console.log('⏳ Skipping auto-save:', { footprintId: !!footprintId, initialDataLoaded });
    }
  }, [organizationType, location, employeeCount, facilityCount, 
      fleetSize, annualRevenue, industryType, reportingYear, 
      scenarioName, footprintId, projectName, initialDataLoaded, autoSaveProjectData]);

  const handleCompareScenarios = useCallback((scenario1, scenario2) => {
    console.log("🔄 Setting up scenario comparison:", scenario1?.name, "vs", scenario2?.name);
    setComparisonScenarios([scenario1, scenario2]);
    setShowScenarioComparison(true);
  }, []);

  const closeScenarioComparison = useCallback(() => {
    setShowScenarioComparison(false);
    setComparisonScenarios([]);
  }, []);
  
  // List of industry types for selection
  const industryTypes = [
    { id: 'manufacturing', name: 'Manufacturing', icon: '🏭', description: 'Production of goods from raw materials' },
    { id: 'services', name: 'Services', icon: '💼', description: 'Professional, financial, or business services' },
    { id: 'retail', name: 'Retail', icon: '🛒', description: 'Sale of goods to consumers' },
    { id: 'energy', name: 'Energy', icon: '⚡', description: 'Production and distribution of energy' },
    { id: 'transportation', name: 'Transportation', icon: '🚚', description: 'Moving people or goods' },
    { id: 'agriculture', name: 'Agriculture', icon: '🌾', description: 'Farming, livestock, and food production' },
    { id: 'construction', name: 'Construction', icon: '🏗️', description: 'Building and infrastructure development' },
    { id: 'healthcare', name: 'Healthcare', icon: '🏥', description: 'Medical services and facilities' },
    { id: 'education', name: 'Education', icon: '🎓', description: 'Educational institutions and services' },
    { id: 'technology', name: 'Technology', icon: '💻', description: 'Software, hardware, and IT services' },
    { id: 'hospitality', name: 'Hospitality', icon: '🏨', description: 'Hotels, restaurants, and tourism' },
    { id: 'other', name: 'Other', icon: '📋', description: 'Other industry types' }
  ];

  // List of locations for selection
  const locationOptions = [
    { id: 'australia', name: 'Australia', icon: '🇦🇺' },
    { id: 'united_states', name: 'United States', icon: '🇺🇸' },
    { id: 'european_union', name: 'European Union', icon: '🇪🇺' },
    { id: 'united_kingdom', name: 'United Kingdom', icon: '🇬🇧' },
    { id: 'canada', name: 'Canada', icon: '🇨🇦' },
    { id: 'new_zealand', name: 'New Zealand', icon: '🇳🇿' },
    { id: 'japan', name: 'Japan', icon: '🇯🇵' },
    { id: 'south_korea', name: 'South Korea', icon: '🇰🇷' },
    { id: 'singapore', name: 'Singapore', icon: '🇸🇬' },
    { id: 'switzerland', name: 'Switzerland', icon: '🇨🇭' }
  ];
  
  // Function to handle assessment type selection
  const handleAssessmentTypeSelection = (type) => {
    setAssessmentType(type);
    
    if (type === 'carbon-project') {
      // Navigate to the Carbon Project assessment page
      navigate('/carbon-project/new');
    } else if (type === 'carbon-footprint') {
      // Continue with Carbon Footprint assessment
      setShowAssessmentTypeSelection(false);
    }
  };

  // NEW: Callback for when a scenario is deleted
  const handleScenarioDeleted = useCallback((deletedScenarioId) => {
    if (deletedScenarioId === currentScenarioId) {
      console.log("Current scenario was deleted, clearing selection");
      setCurrentScenarioId(null);
    }
  }, [currentScenarioId]);
  
  // Add this function to handle report generation
  const handleGenerateReport = useCallback(() => {
    // Switch to the Generate Report tab
    setActiveTab(1);
    
    // Optionally scroll to the top of the page
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Show success message
    setSaveFeedback({
      type: 'success',
      message: 'Switched to report generation. Your emissions data has been saved.'
    });
    
    setTimeout(() => setSaveFeedback(null), 3000);
  }, []);
  // Load scenarios when footprintId or scenarioRefreshTrigger changes
  useEffect(() => {
    const loadScenarios = async () => {
      if (!footprintId) return;
      
      try {
        const result = await getScenarios(footprintId);
        if (result.success) {
          setScenarios(result.data || []);
          console.log('Loaded scenarios for report:', result.data);
        } else {
          console.error('Failed to load scenarios:', result.error);
          setScenarios([]);
        }
      } catch (error) {
        console.error('Error loading scenarios:', error);
        setScenarios([]);
      }
    };
    
    loadScenarios();
  }, [footprintId, scenarioRefreshTrigger]);
  
  // Load footprint data if we have a footprintId
  useEffect(() => {
    const fetchFootprintData = async () => {
      if (!footprintId) return;
      
      setLoading(true);
      setError(null);
      // IMPORTANT: Reset the flag when starting a new load
      setInitialDataLoaded(false);
      
      try {
        const response = await api.get(`/carbon-footprints/${footprintId}`);
        const data = response.data;
        console.log('Loaded footprint data:', data);
        
        // Set project name
        setProjectName(data.name || 'New Carbon Footprint');
        
        // Set basic organization info
        if (data.organizationType !== undefined) setOrganizationType(data.organizationType);
        if (data.employeeCount !== undefined) setEmployeeCount(data.employeeCount);
        if (data.facilityCount !== undefined) setFacilityCount(data.facilityCount);
        if (data.fleetSize !== undefined) setFleetSize(data.fleetSize);
        if (data.annualRevenue !== undefined) setAnnualRevenue(data.annualRevenue);
        if (data.industryType !== undefined) setIndustryType(data.industryType);
        if (data.reportingYear !== undefined) setReportingYear(data.reportingYear);
        
        // Map location BEFORE setting it
        if (data.location !== undefined) {
          const locationMap = {
            'AU': 'australia',
            'US': 'united_states',
            'EU': 'european_union',
            'GB': 'united_kingdom',
            'CA': 'canada',
            'CN': 'china',
            'IN': 'india',
            'JP': 'japan',
            'BR': 'brazil',
            'GLOBAL': 'other',
            'OTHER': 'other'
          };
          
          const mappedLocation = locationMap[data.location] || data.location;
          setLocation(mappedLocation);
        }
        
        // Also check serialized state for industry type
        if (data.serializedState) {
          try {
            const serializedState = typeof data.serializedState === 'string' 
              ? JSON.parse(data.serializedState) 
              : data.serializedState;
            
            if (serializedState.industryType && !data.industryType) {
              setIndustryType(serializedState.industryType);
            }
            if (serializedState.scenarioName) {
              setScenarioName(serializedState.scenarioName);
            }
          } catch (e) {
            console.error('Error parsing serialized state:', e);
          }
        }

        // IMPORTANT: Mark initial data as loaded AFTER all state is set
        setInitialDataLoaded(true);
        console.log('✅ Initial data loaded, enabling auto-save');
      } catch (err) {
        console.error('Error loading footprint:', err);
        setError(`Failed to load footprint: ${err.message}`);
        // Still set as loaded on error to prevent infinite waiting
        setInitialDataLoaded(true);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFootprintData();
  }, [footprintId]);
  
  // 🔧 NEW: Check for navigation state (when coming from create)
  useEffect(() => {
    if (routerLocation.state?.firstScenarioId && footprintId) {
      console.log("📍 Found first scenario ID in navigation state:", routerLocation.state.firstScenarioId);
      setCurrentScenarioId(routerLocation.state.firstScenarioId);
      
      // Clear the state to prevent it from being used again
      navigate(`/carbon-footprint/${footprintId}`, { replace: true, state: {} });
    }
  }, [routerLocation.state, footprintId, navigate]);

  // 🔧 NEW: Auto-create or load scenario when project loads
  useEffect(() => {
    const handleInitialScenario = async () => {
      // Only run if we have a footprintId and initial data has loaded
      if (!footprintId || !initialDataLoaded) return;
      
      // Skip if we already have a current scenario
      if (currentScenarioId) return;
      
      try {
        console.log("🔍 Checking for existing scenarios...");
        const result = await getScenarios(footprintId);
        
        if (result.success && result.data && result.data.length > 0) {
          // Load the most recent scenario
          const mostRecent = result.data.sort((a, b) => 
            new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)
          )[0];
          
          console.log("📂 Loading most recent scenario:", mostRecent.name);
          setCurrentScenarioId(mostRecent.id);
          handleLoadScenario(mostRecent);
        } else {
          // No scenarios exist - create the first one
          console.log("🆕 No scenarios found - creating first scenario");
          
          const industryTypeName = industryType 
            ? industryTypes.find(it => it.id === industryType)?.name || 'Industry'
            : 'Initial';
          const firstScenarioName = `${industryTypeName} Footprint Assessment`;
          
          const firstScenarioData = {
            name: firstScenarioName,
            rawInputs: {},
            emissionValues: {},
            reductionStrategies: [],
            reductionTarget: 20,
            emissions: { scope1: 0, scope2: 0, scope3: 0, total: 0 },
            emissionsData: null,
            activeSection: {
              location: false,
              direct: true,
              indirect: false,
              valueChain: false,
              results: false,
              obligations: false,
              strategies: false
            }
          };
          
          const saveResult = await saveScenario(footprintId, firstScenarioData);
          
          if (saveResult.success) {
            console.log("✅ First scenario created automatically:", saveResult.data);
            setCurrentScenarioId(saveResult.data.id);
            setScenarioName(firstScenarioName);
            setScenarioRefreshTrigger(prev => prev + 1);
          }
        }
      } catch (error) {
        console.error("Error handling initial scenario:", error);
      }
    };
    
    handleInitialScenario();
  }, [footprintId, initialDataLoaded, currentScenarioId, industryType, industryTypes]);

  // New effect to fetch emissions data if we have a footprintId
  useEffect(() => {
    const fetchEmissionsData = async () => {
      if (footprintId) {
        try {
          const data = await emissionsService.getEmissionsCalculationsForProject(footprintId);
          if (data && data.length > 0) {
            setEmissionsData(data[0]);
            if (data[0].reductionStrategies) {
              setReductionStrategies(data[0].reductionStrategies);
            }
          }
        } catch (error) {
          console.error('Error fetching emissions data:', error);
          // Don't set error state here to avoid disrupting the main flow
        }
      }
    };
    
    if (footprintId) {
      fetchEmissionsData();
    }
  }, [footprintId]);
  
  // 🔧 FIX 1: Auto-create first scenario when industry type is selected
  const handleIndustryTypeSelection = useCallback((type) => {
    console.log("Setting industry type to:", type);
    setIndustryType(type);
    
    // Generate a new scenario name with the industry type
    const industryTypeName = industryTypes.find(it => it.id === type)?.name || 'Industry';
    const newScenarioName = `${industryTypeName} Footprint Assessment`;
   setScenarioName(newScenarioName);
   
   // 🔧 CRITICAL: Auto-create first scenario when industry is selected
   if (footprintId && !currentScenarioId) {
     console.log("🆕 Auto-creating first scenario for industry:", type);
     
     const firstScenarioData = {
       name: newScenarioName,
       // REMOVED: Organization data - only emissions data in scenarios
       // Initialize with empty emissions data that will be populated as user enters data
       rawInputs: {},
       emissionValues: {},
       reductionStrategies: [],
       reductionTarget: 20,
       emissions: { scope1: 0, scope2: 0, scope3: 0, total: 0 },
       emissionsData: null,
       activeSection: {
         location: false,
         direct: true,
         indirect: false,
         valueChain: false,
         results: false,
         obligations: false,
         strategies: false
       }
     };
     
     setLoading(true);
     
     saveScenario(footprintId, firstScenarioData)
       .then(result => {
         if (result.success) {
           console.log("✅ First scenario auto-created successfully:", result.data);
           setCurrentScenarioId(result.data.id);
           // Trigger scenario refresh immediately
           setScenarioRefreshTrigger(prev => prev + 1);
           
           setSaveFeedback({
             type: 'success',
             message: `First scenario "${newScenarioName}" created automatically!`
           });
           
           setTimeout(() => setSaveFeedback(null), 3000);
         } else {
           console.error("❌ Failed to auto-create first scenario:", result.error);
           setError(`Failed to create first scenario: ${result.error}`);
         }
         setLoading(false);
       })
       .catch(err => {
         console.error("❌ Error auto-creating first scenario:", err);
         setError(`Error creating first scenario: ${err.message}`);
         setLoading(false);
       });
   }
 }, [industryTypes, footprintId, currentScenarioId]);
 
 // 🔧 FIXED: Enhanced handleEmissionsSave to properly capture all emissions data
 const handleEmissionsSave = useCallback((data) => {
   console.log('📥 Emissions data received from calculator:', data);
   
   // CRITICAL: Update emissions data state immediately
   setEmissionsData(data);
   
   // Update reduction strategies if provided
   if (data.reductionStrategies) {
     setReductionStrategies(data.reductionStrategies);
   }
   
   // Update current emissions state with ALL data
   setCurrentEmissionsState({
     rawInputs: data.rawInputs || {},
     emissionValues: data.emissionValues || {},
     reductionStrategies: data.reductionStrategies || [],
     reductionTarget: data.reductionTarget || 20,
     emissions: data.emissions || { scope1: 0, scope2: 0, scope3: 0, total: 0 },
     activeSection: data.activeSection || {
       location: false,
       direct: true,
       indirect: false,
       valueChain: false,
       results: false,
       obligations: false,
       strategies: false
     }
   });
   
   console.log('✅ Emissions data updated in state:', {
     hasRawInputs: data.rawInputs && Object.keys(data.rawInputs).length > 0,
     hasEmissionValues: data.emissionValues && Object.keys(data.emissionValues).length > 0,
     totalEmissions: data.emissions ? data.emissions.total : 0
   });
   
   // Auto-save if we have a current scenario
   if (footprintId && currentScenarioId) {
     // Check if scenario still exists before saving
     getScenarios(footprintId).then(scenariosResult => {
       if (scenariosResult.success) {
         const scenarioExists = scenariosResult.data.some(s => s.id === currentScenarioId);
         
         if (!scenarioExists) {
           console.warn("Current scenario no longer exists, clearing selection");
           setCurrentScenarioId(null);
           return;
         }
         
         console.log('🔄 Auto-saving scenario after emissions update...');
         
         const completeData = {
           name: scenarioName,
           // REMOVED: Organization data stays at project level
           // Only include emissions-specific data
           rawInputs: data.rawInputs || {},
           emissionValues: data.emissionValues || {},
           reductionStrategies: data.reductionStrategies || [],
           reductionTarget: data.reductionTarget || 20,
           emissions: data.emissions || { scope1: 0, scope2: 0, scope3: 0, total: 0 },
           emissionsData: data,
           activeSection: data.activeSection || {
             location: false,
             direct: true,
             indirect: false,
             valueChain: false,
             results: false,
             obligations: false,
             strategies: false
           }
         };
         
         saveScenario(footprintId, completeData, currentScenarioId)
           .then(result => {
             if (result.success) {
               console.log('✅ Scenario auto-saved with emissions data');
               // Force refresh scenarios
               setScenarioRefreshTrigger(prev => prev + 1);
             } else {
               console.error('❌ Failed to auto-save scenario:', result.error);
             }
           })
           .catch(err => {
             console.error('❌ Error auto-saving scenario:', err);
           });
       }
     });
   }
 }, [footprintId, currentScenarioId, scenarioName]);
 // Helper function to handle location selection - use useCallback to prevent re-renders
 const handleLocationSelection = useCallback((loc) => {
  console.log("Setting location to:", loc);
  setLocation(loc);
}, []);

// Function to open the carbon footprint scenario manager
const openScenarioManager = useCallback(() => {
  console.log("Opening carbon footprint scenario manager");
  setShowScenarioManager(true);
}, []);

// Function to close the carbon footprint scenario manager
const closeScenarioManager = useCallback(() => {
  console.log("Closing carbon footprint scenario manager");
  setShowScenarioManager(false);
  // Refresh the scenarios list when closing
  setScenarioRefreshTrigger(prev => prev + 1);
}, []);

// 🔧 CRITICAL: Function to get complete current data for scenario saving
const getCurrentCompleteData = useCallback(() => {
  console.log("📋 Gathering complete current data for carbon footprint scenario saving");
  console.log("🔍 Current emissions state:", currentEmissionsState);
  console.log("🔍 Current emissions data:", emissionsData);
  
  const completeData = {
    // REMOVED: Basic organization info - these stay at project level
    
    // 🔧 CRITICAL: Include ONLY emissions data from current state
    rawInputs: currentEmissionsState.rawInputs || {},
    emissionValues: currentEmissionsState.emissionValues || {},
    reductionStrategies: currentEmissionsState.reductionStrategies || [],
    reductionTarget: currentEmissionsState.reductionTarget || 20,
    
    // Include calculated emissions
    emissions: currentEmissionsState.emissions || emissionsData?.emissions || {
      scope1: 0,
      scope2: 0,
      scope3: 0,
      total: 0
    },
    
    // Include the full emissions data if available
    emissionsData: emissionsData || null,
    
    // UI state if you want to preserve which sections are open
    activeSection: currentEmissionsState.activeSection || {
      location: false,
      direct: true,
      indirect: false,
      valueChain: false,
      results: false,
      obligations: false,
      strategies: false
    }
  };
  
  console.log("📊 Complete carbon footprint data gathered:", {
    hasRawInputs: Object.keys(completeData.rawInputs).length > 0,
    hasEmissionValues: Object.keys(completeData.emissionValues).length > 0,
    hasReductionStrategies: completeData.reductionStrategies.length > 0,
    totalEmissions: completeData.emissions.total
  });
  
  return completeData;
}, [currentEmissionsState, emissionsData]); // Removed organization dependencies

// Function to calculate compliance score based on data completeness
const calculateComplianceScore = useCallback((legislation) => {
  let score = 0;
  let totalRequirements = 0;
  
  // Basic organizational data requirements
  const orgRequirements = [
    { field: 'organizationType', weight: 1 },
    { field: 'employeeCount', weight: 1 },
    { field: 'facilityCount', weight: 1 },
    { field: 'annualRevenue', weight: 1 },
    { field: 'industryType', weight: 1 },
    { field: 'reportingYear', weight: 1 },
    { field: 'location', weight: 2 } // Higher weight for location
  ];
  
  // Check organizational data completeness
  orgRequirements.forEach(req => {
    totalRequirements += req.weight;
    if (req.field === 'organizationType' && organizationType) score += req.weight;
    else if (req.field === 'employeeCount' && employeeCount > 0) score += req.weight;
    else if (req.field === 'facilityCount' && facilityCount > 0) score += req.weight;
    else if (req.field === 'annualRevenue' && annualRevenue > 0) score += req.weight;
    else if (req.field === 'industryType' && industryType) score += req.weight;
    else if (req.field === 'reportingYear' && reportingYear) score += req.weight;
    else if (req.field === 'location' && location) score += req.weight;
  });
  
  // Emissions data requirements
  const emissions = emissionsData?.emissions || currentEmissionsState?.emissions;
  if (emissions) {
    // Scope 1 emissions (required for most legislation)
    totalRequirements += 3;
    if (emissions.scope1 > 0) score += 3;
    
    // Scope 2 emissions (required for most legislation)
    totalRequirements += 3;
    if (emissions.scope2 > 0) score += 3;
    
    // Scope 3 emissions (required for comprehensive reporting)
    if (legislation?.requiresScope3) {
      totalRequirements += 2;
      if (emissions.scope3 > 0) score += 2;
    }
  } else {
    // If no emissions data, add to total requirements
    totalRequirements += 6;
    if (legislation?.requiresScope3) totalRequirements += 2;
  }
  
  // Reduction strategies (if required by legislation)
  if (legislation?.requiresReductionTargets) {
    totalRequirements += 2;
    if (reductionStrategies && reductionStrategies.length > 0) score += 2;
  }
  
  // Calculate percentage
  const percentage = totalRequirements > 0 ? Math.round((score / totalRequirements) * 100) : 0;
  
  return {
    score,
    totalRequirements,
    percentage,
    isComplete: percentage === 100
  };
}, [organizationType, employeeCount, facilityCount, annualRevenue, industryType, 
    reportingYear, location, emissionsData, currentEmissionsState, reductionStrategies]);

// Function to manually save current carbon footprint scenario
const handleManualSave = useCallback(() => {
  if (!footprintId || !currentScenarioId) {
    console.log("Cannot save - no footprint ID or scenario ID");
    return;
  }
  
  const currentData = getCurrentCompleteData();
  currentData.name = scenarioName;
  
  setLoading(true);
  
  saveScenario(footprintId, currentData, currentScenarioId)
    .then(result => {
      if (result.success) {
        setSaveFeedback({
          type: 'success',
          message: 'Carbon footprint scenario saved successfully!'
        });
        // Force refresh scenarios with delay
        setTimeout(() => {
          setScenarioRefreshTrigger(prev => {
            const newValue = prev + 1;
            console.log("🔄 Triggering scenario refresh after manual save, new value:", newValue);
            return newValue;
          });
        }, 300);
      } else {
        setSaveFeedback({
          type: 'error',
          message: `Failed to save carbon footprint scenario: ${result.error}`
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
        message: `Error saving carbon footprint scenario: ${err.message}`
      });
      setLoading(false);
      
      // Clear feedback after 3 seconds
      setTimeout(() => {
        setSaveFeedback(null);
      }, 3000);
    });
}, [footprintId, currentScenarioId, getCurrentCompleteData, scenarioName]);

// 🔧 ENHANCED: Function to handle creating a new carbon footprint scenario with current values
const handleCreateNewScenario = useCallback((baseScenario = null) => {
  console.log("Creating new carbon footprint scenario", baseScenario ? "based on existing scenario" : "from current state");
  
  // Clear current scenario ID to indicate we're creating a new one
  setCurrentScenarioId(null);
  
  // Set default industry type if not already set
  if (!industryType) {
    console.log("No industry type selected, defaulting to 'services'");
    setIndustryType('services');
  }
  
  // Generate a new scenario name with timestamp to make it unique
  const timestamp = new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  });
  
  let newName;
  let sourceData = null;
  
  if (baseScenario) {
    // Copying from a specific existing scenario
    newName = `${baseScenario.name} (Copy)`;
    sourceData = baseScenario;
  } else {
    // 🔧 ENHANCED: Create from current state instead of empty values
    newName = `${scenarioName} - Copy (${timestamp})`;
    sourceData = getCurrentCompleteData(); // Use current form values
  }
  
  setScenarioName(newName);
  
  // Copy values from source (either existing scenario or current state)
  if (sourceData) {
    console.log("Copying properties from source data:", sourceData);
    
    // Extract data if it's nested
    let dataToUse = sourceData;
    if (sourceData.data) {
      if (typeof sourceData.data === 'string') {
        try {
          dataToUse = JSON.parse(sourceData.data);
        } catch (e) {
          console.warn('Could not parse source data:', e);
          dataToUse = sourceData;
        }
      } else if (typeof sourceData.data === 'object') {
        dataToUse = sourceData.data;
      }
    }
    
    // REMOVED: Don't copy organization parameters - they stay at project level
    
    // 🔧 ENHANCED: Copy emissions data and preserve it for the new scenario
    if (dataToUse.emissionsData) setEmissionsData(dataToUse.emissionsData);
    
    // Set the initial data for the emissions calculator to copy current values
    if (dataToUse.rawInputs || dataToUse.emissionValues || dataToUse.emissions) {
      const initialData = {
        name: newName,
        rawInputs: dataToUse.rawInputs || {},
        emissionValues: dataToUse.emissionValues || {},
        reductionStrategies: dataToUse.reductionStrategies || [],
        reductionTarget: dataToUse.reductionTarget || 20,
        emissions: dataToUse.emissions || { scope1: 0, scope2: 0, scope3: 0, total: 0 },
        activeSection: dataToUse.activeSection || {
          location: false,
          direct: true,
          indirect: false,
          valueChain: false,
          results: false,
          obligations: false,
          strategies: false
        }
      };
      
      console.log("🔄 Setting initial data for new scenario with copied values:", {
        hasRawInputs: Object.keys(initialData.rawInputs).length > 0,
        hasEmissionValues: Object.keys(initialData.emissionValues).length > 0,
        totalEmissions: initialData.emissions.total
      });
      
      setEmissionsInitialData(initialData);
      setCurrentEmissionsState(prev => ({
        ...prev,
        ...initialData
      }));
      
      // Force the emissions calculator to remount with new data
      setForceEmissionsReload(prev => prev + 1);
    }
  }
  
  // Now save the new carbon footprint scenario to the database
  if (footprintId) {
    console.log("Attempting to save new carbon footprint scenario to database");
    const scenarioData = {
      name: newName,
      // REMOVED: Organization data - keep only emissions-related data
      // 🔧 ENHANCED: Include all current emissions data in the new scenario
      rawInputs: currentEmissionsState.rawInputs || {},
      emissionValues: currentEmissionsState.emissionValues || {},
      reductionStrategies: currentEmissionsState.reductionStrategies || [],
      reductionTarget: currentEmissionsState.reductionTarget || 20,
      emissions: currentEmissionsState.emissions || { scope1: 0, scope2: 0, scope3: 0, total: 0 },
      emissionsData: emissionsData || null,
      activeSection: currentEmissionsState.activeSection || {
        location: false,
        direct: true,
        indirect: false,
        valueChain: false,
        results: false,
        obligations: false,
        strategies: false
      }
    };
    
    // Set loading state
    setLoading(true);
    
    saveScenario(footprintId, scenarioData)
      .then(result => {
        if (result.success) {
          console.log("Successfully saved new carbon footprint scenario:", result.data);
          setCurrentScenarioId(result.data.id);
          
          // CRITICAL FIX: Force refresh the scenarios list AFTER saving with increased delay
          setTimeout(() => {
            setScenarioRefreshTrigger(prev => {
              const newValue = prev + 1;
              console.log("🔄 Triggering scenario refresh after save, new value:", newValue);
              return newValue;
            });
          }, 750); // Increased from 100ms to 750ms
          
          // Show success message
          setSaveFeedback({
            type: 'success',
            message: 'New carbon footprint scenario created with current values!'
          });
          
          // Clear feedback after 3 seconds
          setTimeout(() => {
            setSaveFeedback(null);
          }, 3000);
        } else {
          console.error("Failed to save new carbon footprint scenario:", result.error);
          setError(`Failed to save carbon footprint scenario: ${result.error}`);
          setSaveFeedback({
            type: 'error',
            message: `Failed to create carbon footprint scenario: ${result.error}`
          });
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error saving new carbon footprint scenario:", err);
        setError(`Error saving carbon footprint scenario: ${err.message}`);
        setSaveFeedback({
          type: 'error',
          message: `Error creating carbon footprint scenario: ${err.message}`
        });
        setLoading(false);
      });
  } else {
    console.warn("Cannot save carbon footprint scenario - no footprint ID available");
  }
  
  // After a small delay, focus on the scenario name input if it exists
  setTimeout(() => {
    const scenarioNameInput = document.querySelector('input[name="scenarioName"]') || 
                             document.getElementById('scenarioName');
    if (scenarioNameInput) {
      scenarioNameInput.focus();
    }
  }, 100);
}, [footprintId, scenarioName, getCurrentCompleteData, currentEmissionsState, emissionsData, industryType]);

// 🔧 CRITICAL: Enhanced function to handle loading a carbon footprint scenario with complete data handling
const handleLoadScenario = useCallback((loadedData) => {
  console.log("📥 Loading carbon footprint scenario data in parent:", loadedData);
  
  // 🔧 CRITICAL FIX: Extract data from the nested structure properly
  let scenarioData = loadedData;
  
  // If the data is nested in a 'data' field, extract it
  if (loadedData.data) {
    if (typeof loadedData.data === 'string') {
      try {
        scenarioData = JSON.parse(loadedData.data);
        console.log("📁 Parsed nested carbon footprint scenario data:", scenarioData);
      } catch (e) {
        console.warn('Could not parse carbon footprint scenario data:', e);
        scenarioData = loadedData;
      }
    } else if (typeof loadedData.data === 'object') {
      scenarioData = loadedData.data;
      console.log("📁 Extracted nested carbon footprint scenario data:", scenarioData);
    }
  }
  
  // 🔧 CRITICAL FIX: Set the current scenario ID so we know which scenario is active
  if (loadedData.id) {
    setCurrentScenarioId(loadedData.id);
    console.log("🆔 Set current carbon footprint scenario ID:", loadedData.id);
  }
  
  // REMOVED: Don't update organization info from scenarios
  // These should only come from the project level
  
  // 🔧 CRITICAL FIX: Set the emissions initial data to force EmissionsCalculator to reload
  console.log("🔄 Setting emissions initial data to force reload");
  const emissionsInitialData = {
    ...scenarioData,
    name: loadedData.name || scenarioData.name || 'Loaded Carbon Footprint Scenario',
    id: loadedData.id,
    // Ensure emissions data is properly structured
    rawInputs: scenarioData.rawInputs || {},
    emissionValues: scenarioData.emissionValues || {},
    reductionStrategies: scenarioData.reductionStrategies || [],
    reductionTarget: scenarioData.reductionTarget || 20,
    emissions: scenarioData.emissions || { scope1: 0, scope2: 0, scope3: 0, total: 0 },
    activeSection: scenarioData.activeSection || {
      location: false,
      direct: true,
      indirect: false,
      valueChain: false,
      results: false,
      obligations: false,
      strategies: false
    }
  };
  
  console.log("📊 Prepared carbon footprint emissions initial data:", {
    hasRawInputs: Object.keys(emissionsInitialData.rawInputs).length > 0,
    hasEmissionValues: Object.keys(emissionsInitialData.emissionValues).length > 0,
    hasReductionStrategies: emissionsInitialData.reductionStrategies.length > 0,
    totalEmissions: emissionsInitialData.emissions ? emissionsInitialData.emissions.total : 0
  });
  
  setEmissionsInitialData(emissionsInitialData);
  
  // Force EmissionsCalculator to remount with new data
  setForceEmissionsReload(prev => prev + 1);
  
  // Update current emissions state
  setCurrentEmissionsState(prev => ({
    ...prev,
    rawInputs: scenarioData.rawInputs || {},
    emissionValues: scenarioData.emissionValues || {},
    reductionStrategies: scenarioData.reductionStrategies || [],
    reductionTarget: scenarioData.reductionTarget || 20,
    emissions: scenarioData.emissions || { scope1: 0, scope2: 0, scope3: 0, total: 0 },
    activeSection: scenarioData.activeSection || prev.activeSection
  }));
  
  // Update scenario name
  setScenarioName(loadedData.name || scenarioData.name || 'Loaded Carbon Footprint Scenario');
  
  // Close scenario manager
  setShowScenarioManager(false);
  
  // Show feedback
  setSaveFeedback({
    type: 'success',
    message: `Carbon footprint scenario "${loadedData.name || scenarioData.name || 'Loaded Scenario'}" loaded successfully!`
  });
  
  // Clear feedback after 3 seconds
  setTimeout(() => {
    setSaveFeedback(null);
  }, 3000);
}, []);
// Enhanced save project function with automatic scenario creation
const saveAsProject = async () => {
  if (!projectName.trim()) {
    setError("Project name is required");
    return;
  }
  
  setLoading(true);
  
  try {
    // Gather current state for saving
    const footprintData = {
      name: projectName,
      organizationType: organizationType || 'corporate',
      location: location || '',
      employeeCount: employeeCount,
      facilityCount: facilityCount,
      fleetSize: fleetSize,
      annualRevenue: annualRevenue,
      industryType: industryType,
      reportingYear: reportingYear,
      serializedState: {
        scenarioName,
        organizationType: organizationType || 'corporate',
        employeeCount,
        facilityCount,
        fleetSize,
        annualRevenue,
        industryType,
        reportingYear,
        location
      }
    };
    
    // For updating existing carbon footprint project
    if (footprintId) {
      const response = await api.put(`/carbon-footprints/${footprintId}`, footprintData);
      
      setSaveFeedback({
        type: 'success',
        message: 'Carbon footprint updated successfully!'
      });
    } 
    // For creating new carbon footprint project
    else {
      const response = await api.post('/carbon-footprints', footprintData);
      const newFootprintId = response.data.id;
      
      // 🔧 CRITICAL: Create the first scenario immediately after creating the project
      console.log("🆕 Auto-creating first scenario for new carbon footprint project");
      
      // Determine scenario name
      const industryTypeName = industryType 
        ? industryTypes.find(it => it.id === industryType)?.name || 'Industry'
        : 'Initial';
      const firstScenarioName = `${industryTypeName} Footprint Assessment`;
      
      const firstScenarioData = {
        name: firstScenarioName,
        // Initialize with current emissions data if available
        rawInputs: currentEmissionsState.rawInputs || {},
        emissionValues: currentEmissionsState.emissionValues || {},
        reductionStrategies: currentEmissionsState.reductionStrategies || [],
        reductionTarget: currentEmissionsState.reductionTarget || 20,
        emissions: currentEmissionsState.emissions || { scope1: 0, scope2: 0, scope3: 0, total: 0 },
        emissionsData: emissionsData || null,
        activeSection: currentEmissionsState.activeSection || {
          location: false,
          direct: true,
          indirect: false,
          valueChain: false,
          results: false,
          obligations: false,
          strategies: false
        }
      };
      
      try {
        const scenarioResult = await saveScenario(newFootprintId, firstScenarioData);
        
        if (scenarioResult.success) {
          console.log("✅ First scenario created successfully:", scenarioResult.data);
          
          // Store the scenario ID to pass to the edit page
          const firstScenarioId = scenarioResult.data.id;
          
          // Navigate to the edit page with the scenario ID in state
          navigate(`/carbon-footprint/${newFootprintId}`, {
            state: { firstScenarioId }
          });
          
          setSaveFeedback({
            type: 'success',
            message: 'Carbon footprint and initial scenario created successfully!'
          });
        } else {
          console.error("❌ Failed to create first scenario:", scenarioResult.error);
          // Still navigate to the edit page even if scenario creation failed
          navigate(`/carbon-footprint/${newFootprintId}`);
          
          setSaveFeedback({
            type: 'warning',
            message: 'Carbon footprint created, but failed to create initial scenario.'
          });
        }
      } catch (scenarioErr) {
        console.error("❌ Error creating first scenario:", scenarioErr);
        // Still navigate to the edit page
        navigate(`/carbon-footprint/${newFootprintId}`);
        
        setSaveFeedback({
          type: 'warning',
          message: 'Carbon footprint created, but failed to create initial scenario.'
        });
      }
    }
  } catch (err) {
    console.error('Error saving carbon footprint:', err);
    setError(`Failed to save carbon footprint: ${err.message}`);
    setSaveFeedback({
      type: 'error',
      message: `Failed to save carbon footprint: ${err.message}`
    });
  } finally {
    setLoading(false);
    
    // Clear feedback after 3 seconds
    setTimeout(() => {
      setSaveFeedback(null);
    }, 3000);
  }
};

// New function to delete the carbon footprint project
const deleteProject = async () => {
  if (!footprintId) {
    console.error("No carbon footprint ID to delete");
    return;
  }
  
  setLoading(true);
  
  try {
    await api.delete(`/carbon-footprints/${footprintId}`);
    
    // Close the confirmation dialog
    setShowDeleteConfirm(false);
    
    // Show success message briefly before navigating
    setSaveFeedback({
      type: 'success',
      message: 'Carbon footprint deleted successfully!'
    });
    
    // Navigate back to dashboard after a brief delay
    setTimeout(() => {
      navigate('/dashboard');
    }, 1000);
    
  } catch (err) {
    console.error("Error deleting carbon footprint:", err);
    setError(`Failed to delete carbon footprint: ${err.message}`);
    setSaveFeedback({
      type: 'error',
      message: `Failed to delete carbon footprint: ${err.message}`
    });
    setLoading(false);
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

return (
  <div className="carbon-footprint-page relative min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
    {/* Decorative Background Elements */}
    <div className="absolute top-0 right-0 -mt-16 -mr-32 hidden lg:block pointer-events-none z-0">
      <svg width="404" height="384" fill="none" viewBox="0 0 404 384" className="text-blue-50">
        <defs>
          <pattern id="de316486-4a29-4312-bdfc-fbce2132a2c1" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="4" height="4" className="text-blue-200" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="404" height="384" fill="url(#de316486-4a29-4312-bdfc-fbce2132a2c1)" />
      </svg>
    </div>
    
    <div className="absolute bottom-0 left-0 -mb-16 -ml-32 hidden lg:block pointer-events-none z-0">
      <svg width="404" height="384" fill="none" viewBox="0 0 404 384" className="text-green-50">
        <defs>
          <pattern id="de316486-4a29-4312-bdfc-fbce2132a2c2" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="4" height="4" className="text-green-200" fill="currentColor" />
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
            <h2 className="text-xl font-bold text-gray-800">Welcome to Carbon Footprint Calculator</h2>
            <button 
              onClick={() => {
                localStorage.setItem('carbonFootprintOnboardingComplete', 'true');
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
                <p className="mb-4">This tool helps you calculate and report your organization's greenhouse gas emissions. Let's get started!</p>
                <img src="/onboarding/footprint-step1.png" alt="Industry Type Selection" className="mb-4 rounded-lg border" />
                <p className="text-sm text-gray-600">First, select your industry type to begin your carbon footprint assessment.</p>
              </div>
            )}
            
            {onboardingStep === 2 && (
              <div>
                <p className="mb-4">After selecting an industry, you'll need to enter your organization's basic information.</p>
                <img src="/onboarding/footprint-step2.png" alt="Organization Information" className="mb-4 rounded-lg border" />
                <p className="text-sm text-gray-600">Provide details like employee count, facility count, and annual revenue.</p>
              </div>
            )}
            
            {onboardingStep === 3 && (
              <div>
                <p className="mb-4">Next, you'll calculate your emissions across different scopes.</p>
                <img src="/onboarding/footprint-step3.png" alt="Emissions Calculator" className="mb-4 rounded-lg border" />
                <p className="text-sm text-gray-600">Enter data for Scope 1 (direct), Scope 2 (electricity), and Scope 3 (indirect) emissions.</p>
              </div>
            )}
            
            {onboardingStep === 4 && (
              <div>
                <p className="mb-4">Finally, generate detailed reports to track your progress and meet reporting requirements.</p>
                <img src="/onboarding/footprint-step4.png" alt="Reports and Analysis" className="mb-4 rounded-lg border" />
                <p className="text-sm text-gray-600">Create reports for different frameworks like GHG Protocol, TCFD, and more.</p>
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
                  className={`w-2 h-2 rounded-full ${onboardingStep === step ? 'bg-blue-600' : 'bg-gray-300'}`}
                ></div>
              ))}
            </div>
            
            {onboardingStep < 4 ? (
              <button
                onClick={() => setOnboardingStep(prev => prev + 1)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Next
              </button>
            ) : (
              <button
                onClick={() => {
                  localStorage.setItem('carbonFootprintOnboardingComplete', 'true');
                  setShowOnboarding(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Get Started
              </button>
            )}
          </div>
        </div>
      </div>
    )}
    {/* ✅ CLEAN: Carbon Footprint Scenario Manager Modal */}
    {showScenarioManager && (
       <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
         <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto shadow-xl">
           <CarbonFootprintScenarioManager 
             footprintId={footprintId}
             scenarioName={scenarioName}
             setScenarioName={setScenarioName}
             currentData={getCurrentCompleteData()} // 🔧 Pass complete carbon footprint data here
             onLoadScenario={handleLoadScenario}
             onClose={closeScenarioManager}
             onCreateNew={handleCreateNewScenario}
           />
         </div>
       </div>
     )}

     {/* Delete Carbon Footprint Project Confirmation Modal */}
     {showDeleteConfirm && (
       <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
         <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
           <div className="mb-4">
             <div className="flex items-center justify-center bg-red-100 w-12 h-12 rounded-full mx-auto mb-4">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
               </svg>
             </div>
             <h3 className="text-lg font-bold text-center">Delete Carbon Footprint</h3>
             <p className="text-center text-gray-600 mt-2">
               Are you sure you want to delete the carbon footprint "{projectName}"? This action cannot be undone and will permanently delete the footprint and all associated scenarios.
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
               {loading ? 'Deleting...' : 'Delete Carbon Footprint'}
             </button>
           </div>
         </div>
       </div>
     )}

     {/* Add the Legislation Details Modal */}
     <LegislationDetailsModal
       legislation={selectedLegislation}
       isOpen={showLegislationModal}
       onClose={() => {
         setShowLegislationModal(false);
         setSelectedLegislation(null);
       }}
     />
     
     {/* Main Content */}
     <div className="mx-auto max-w-7xl relative z-10">
       <div className="py-5 px-4 sm:px-6 lg:px-8">
         {/* Page Title Bar with Breadcrumbs */}
         <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4 relative overflow-hidden">
           <div className="absolute right-0 top-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-green-100 opacity-30 rounded-bl-full"></div>
           <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between">
             <div>
               <div className="flex items-center text-sm text-gray-500 mb-1">
                 <a href="/" className="hover:text-blue-600 transition-colors">Home</a>
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mx-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                 </svg>
                 <a href="/dashboard" className="hover:text-blue-600 transition-colors">Dashboard</a>
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mx-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                 </svg>
                 <span className="text-gray-700">Carbon Footprint {footprintId ? 'Editor' : 'Creator'}</span>
               </div>
               <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center flex-wrap">
                 <span className="bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">
                   {footprintId ? `Edit Carbon Footprint` : 'Create New Carbon Footprint'}
                 </span>
                 <span className="ml-3 mt-1 text-xs font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                   GHG Emissions Tool
                 </span>
                 {/* 🔧 ADDED: Show current carbon footprint scenario indicator */}
                 {currentScenarioId && (
                   <span className="ml-3 mt-1 text-xs font-medium px-2 py-1 bg-green-100 text-green-800 rounded-full">
                     Scenario: {scenarioName}
                   </span>
                 )}
               </h1>
             </div>
             
             <div className="mt-4 md:mt-0 flex space-x-2">
               <button
                 onClick={() => navigate('/dashboard')} 
                 className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors shadow-sm"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m00l7-7m-7 7h18" />
                 </svg>
                 Back to Dashboard
               </button>
              
              {/* Manage Carbon Footprint Scenarios button */}
              {footprintId && (
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
             </div>
           </div>
         </div>
     
         {/* Error display */}
         {error && (
           <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 shadow-sm animate-fadeIn">
             <p className="flex items-center">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
               {error}
             </p>
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
         
         {/* Assessment Type Selection with Enhanced Information */}
         {showAssessmentTypeSelection && (
           <div className="mb-10">
             <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Select Your Assessment Type</h2>
             <p className="text-center text-gray-600 mb-8 max-w-3xl mx-auto">
               Choose the right tool for your sustainability journey. Whether you're measuring current emissions or planning future reductions, we have the solutions you need.
             </p>

             <div className="flex flex-col md:flex-row md:flex-nowrap md:space-x-6 space-y-6 md:space-y-0 mb-8">
               {/* Carbon Footprint Card */}
               <div className="md:w-1/2">
                 <button
                   onClick={() => handleAssessmentTypeSelection('carbon-footprint')}
                   className={`w-full h-full group relative bg-white rounded-xl shadow-md overflow-hidden border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${assessmentType === 'carbon-footprint'
                       ? 'border-blue-500 ring-2 ring-blue-500'
                       : 'border-gray-200 hover:border-blue-300'}`}
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

               {/* Carbon Project Card */}
               <div className="md:w-1/2">
                 <button
                   onClick={() => handleAssessmentTypeSelection('carbon-project')}
                   className={`w-full h-full group relative bg-white rounded-xl shadow-md overflow-hidden border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-green-500 ${assessmentType === 'carbon-project'
                       ? 'border-green-500 ring-2 ring-green-500'
                       : 'border-gray-200 hover:border-green-300'}`}
                 >
                   <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-green-100 to-transparent opacity-40 rounded-bl-full"></div>
                   <div className="p-8 relative z-10">
                     <div className="flex items-center mb-6">
                       <div className="p-3 bg-green-100 rounded-lg text-green-700 mr-4">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
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

             {/* Additional Benefits Section */}
             <div className="bg-gray-50 rounded-xl p-8 mt-8">
               <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Why Measure Your Carbon Footprint?</h3>
               <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <div className="text-center">
                   <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                     </svg>
                   </div>
                   <h4 className="font-semibold text-gray-900 mb-2">Plan Future Reductions</h4>
                   <p className="text-sm text-gray-600">Identify emission hotspots and prioritize reduction strategies for maximum impact</p>
                 </div>
                 
                 <div className="text-center">
                   <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                     </svg>
                   </div>
                   <h4 className="font-semibold text-gray-900 mb-2">Regulatory Risk Management</h4>
                   <p className="text-sm text-gray-600">Stay ahead of mandatory reporting requirements and avoid penalties</p>
                 </div>
                 
                 <div className="text-center">
                   <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                     </svg>
                   </div>
                   <h4 className="font-semibold text-gray-900 mb-2">Supply Chain Reporting</h4>
                   <p className="text-sm text-gray-600">Provide data for inclusion in your customers' Scope 3 emissions calculations</p>
                 </div>
                 
                 <div className="text-center">
                   <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                     </svg>
                   </div>
                   <h4 className="font-semibold text-gray-900 mb-2">Global Standards</h4>
                   <p className="text-sm text-gray-600">Align with international frameworks like GHG Protocol, TCFD, and CSRD</p>
                 </div>
               </div>
             </div>

             {/* Additional Information */}
             <div className="mt-8 grid md:grid-cols-3 gap-6">
               <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                 <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                   Instant Results
                 </h4>
                 <p className="text-sm text-blue-700">Get preliminary emissions estimates in minutes, not weeks</p>
               </div>
               
               <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                 <h4 className="font-semibold text-green-900 mb-2 flex items-center">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                   Cost Savings
                 </h4>
                 <p className="text-sm text-green-700">Identify inefficiencies and reduce operational costs through emissions reduction</p>
               </div>
               
               <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                 <h4 className="font-semibold text-purple-900 mb-2 flex items-center">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                   </svg>
                   Stakeholder Trust
                 </h4>
                 <p className="text-sm text-purple-700">Build credibility with investors, customers, and regulators through transparent reporting</p>
               </div>
             </div>
           </div>
         )}

         {/* Show project content - we're already on the carbon footprint page */}
         {!showAssessmentTypeSelection && (
           <>
             {/* Industry Type Selection */}
             <div className="mb-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200 relative overflow-hidden" id="industry-type">
               <div className="absolute left-0 bottom-0 w-24 h-24 bg-gradient-to-tr from-blue-100 to-transparent opacity-40 rounded-tr-full"></div>
               <h2 className="text-lg font-medium mb-4 text-blue-700 border-b pb-2 relative z-10">
                 <span className="flex items-center">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                   </svg>
                   Industry Type
                 </span>
               </h2>
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 relative z-10">
                 {industryTypes.map((type) => (
                   <button
                     key={type.id}
                     onClick={() => handleIndustryTypeSelection(type.id)}
                     className={`p-3 rounded-lg border ${
                       industryType === type.id
                         ? 'bg-blue-100 border-blue-500 text-blue-800 shadow-md'
                         : 'bg-white hover:bg-blue-50 border-gray-200 hover:border-blue-300'
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

             {/* Location Selection */}
             <div className="mb-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200 relative overflow-hidden" id="location">
               <div className="absolute right-0 bottom-0 w-24 h-24 bg-gradient-to-tl from-blue-100 to-transparent opacity-40 rounded-tl-full"></div>
               <h2 className="text-lg font-medium mb-4 text-blue-700 border-b pb-2 relative z-10">
                 <span className="flex items-center">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                   </svg>
                   Reporting Location
                 </span>
               </h2>
               <p className="text-sm text-gray-600 mb-4 relative z-10">
                 Select the primary location where your business operates to determine applicable reporting requirements.
               </p>
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 relative z-10">
                 {locationOptions.map((loc) => (
                   <button
                     key={loc.id}
                     onClick={() => handleLocationSelection(loc.id)}
                     className={`p-3 rounded-lg border ${
                       location === loc.id
                         ? 'bg-green-100 border-green-500 text-green-800 shadow-md'
                         : 'bg-white hover:bg-green-50 border-gray-200 hover:border-green-300'
                     } transition-all duration-200 transform hover:-translate-y-1`}
                     type="button"
                   >
                     <div className="text-2xl mb-1">{loc.icon}</div>
                     <div className="font-medium">{loc.name}</div>
                   </button>
                 ))}
               </div>
             </div>

             {/* Carbon Footprint Project Name Input with Save Button */}
             <div className="mb-4 bg-white p-5 rounded-lg shadow-sm border border-gray-200 relative overflow-hidden">
               <div className="absolute right-0 bottom-0 w-24 h-24 bg-gradient-to-tl from-blue-100 to-transparent opacity-40 rounded-tl-full"></div>
               <div className="flex flex-col lg:flex-row lg:items-end lg:space-x-4">
                 <div className="flex-1">
                   <Tooltip text="Enter a descriptive name for your carbon footprint assessment. This name will appear in your dashboard and reports.">
                     <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-1 relative z-10">
                       <span className="flex items-center">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                         </svg>
                         Carbon Footprint Name
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
                     className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 relative z-10"
                     placeholder="Enter carbon footprint assessment name"
                   />
                   <p className="mt-1 text-sm text-gray-500 relative z-10">
                     This name will appear in your dashboard and reports.
                   </p>
                 </div>
                 
                 {/* Save Carbon Footprint Button */}
                 <div className="mt-4 lg:mt-0 flex space-x-2 relative z-10">
                   <button 
                     onClick={saveAsProject}
                     disabled={loading || !projectName.trim()}
                     className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
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
                         {footprintId ? 'Update' : 'Save'} Carbon Footprint
                       </>
                     )}
                   </button>
                   
                   {/* Delete button - only show if editing */}
                   {footprintId && (
                     <button 
                       onClick={() => setShowDeleteConfirm(true)}
                       disabled={loading}
                       className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none transition-colors shadow-sm"
                     >
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                       </svg>
                       Delete
                     </button>
                   )}
                 </div>
               </div>
             </div>

             {/* Organization Information Section */}
             <div className="mb-4 bg-white p-5 rounded-lg shadow-sm border border-gray-200 relative overflow-hidden">
               <div className="absolute left-0 top-0 w-24 h-24 bg-gradient-to-br from-blue-100 to-transparent opacity-40 rounded-br-full"></div>
               <h2 className="text-lg font-medium mb-4 text-blue-700 border-b pb-2 relative z-10">
                 <span className="flex items-center">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                   </svg>
                   Organization Information
                 </span>
               </h2>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                 <div>
                   <label htmlFor="organizationType" className="block text-sm font-medium text-gray-700 mb-1">
                     Organization Type
                   </label>
                   <select
                     id="organizationType"
                     name="organizationType"
                     value={organizationType || ''} // Add || '' to handle null/undefined
                     onChange={(e) => setOrganizationType(e.target.value)}
                     className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                   >
                     <option value="">Select organization type</option>
                     <option value="corporate">Corporate</option>
                     <option value="nonprofit">Non-profit</option>
                     <option value="government">Government</option>
                     <option value="education">Educational Institution</option>
                     <option value="healthcare">Healthcare</option>
                   </select>
                 </div>
                 
                 <div>
                   <label htmlFor="reportingYear" className="block text-sm font-medium text-gray-700 mb-1">
                     Reporting Year
                   </label>
                   <select
                     id="reportingYear"
                     name="reportingYear"
                     value={reportingYear}
                     onChange={(e) => setReportingYear(Number(e.target.value))}
                     className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                   >
                     {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                       <option key={year} value={year}>{year}</option>
                     ))}
                   </select>
                 </div>
                 
                 <div>
                   <label htmlFor="employeeCount" className="block text-sm font-medium text-gray-700 mb-1">
                     Number of Employees
                   </label>
                   <input
                     type="number"
                     id="employeeCount"
                     name="employeeCount"
                     value={employeeCount}
                     onChange={(e) => setEmployeeCount(Number(e.target.value))}
                     min="0"
                     className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                   />
                 </div>
                 
                 <div>
                   <label htmlFor="facilityCount" className="block text-sm font-medium text-gray-700 mb-1">
                     Number of Facilities
                   </label>
                   <input
                     type="number"
                     id="facilityCount"
                     name="facilityCount"
                     value={facilityCount}
                     onChange={(e) => setFacilityCount(Number(e.target.value))}
                     min="0"
                     className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                   />
                 </div>
                 
                 <div>
                   <label htmlFor="fleetSize" className="block text-sm font-medium text-gray-700 mb-1">
                     Number of Fleet Vehicles
                   </label>
                   <input
                     type="number"
                     id="fleetSize"
                     name="fleetSize"
                     value={fleetSize}
                     onChange={(e) => setFleetSize(Number(e.target.value))}
                     min="0"
                     className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                   />
                 </div>
                 
                 <div>
                   <label htmlFor="annualRevenue" className="block text-sm font-medium text-gray-700 mb-1">
                     Annual Revenue (USD)
                   </label>
                   <div className="relative">
                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                       <span className="text-gray-500 sm:text-sm">$</span>
                     </div>
                     <input
                       type="number"
                       id="annualRevenue"
                       name="annualRevenue"
                       value={annualRevenue}
                       onChange={(e) => setAnnualRevenue(Number(e.target.value))}
                       min="0"
                       className="block w-full pl-7 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                     />
                   </div>
                 </div>
               </div>
             </div>
             
             {/* ✅ CLEAN: Carbon Footprint Scenario Summary Panel */}
             {footprintId && (
               <div className="mb-4">
                 <CarbonFootprintScenarioPanel
                   footprintId={footprintId}
                   currentScenarioId={currentScenarioId}
                   currentScenarioName={scenarioName}
                   onLoadScenario={handleLoadScenario}
                   onCreateNewScenario={handleCreateNewScenario}
                   refreshScenarios={scenarioRefreshTrigger}
                   onScenarioDeleted={handleScenarioDeleted}
                 />
               </div>
             )}

             {/* NEW: Reporting Obligations Section with Compliance Display */}
             {location && (
               <div className="mb-4 bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                 <div className="flex items-center justify-between mb-4">
                   <h3 className="text-lg font-semibold flex items-center">
                     <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                     </svg>
                     Reporting Obligations
                   </h3>
                   <button
                     onClick={() => setShowReportingObligations(!showReportingObligations)}
                     className="text-gray-500 hover:text-gray-700"
                   >
                     <svg className={`w-5 h-5 transform transition-transform ${showReportingObligations ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                     </svg>
                   </button>
                 </div>
                 
                 {showReportingObligations && (
                   <div className="space-y-4">
                     <p className="text-gray-600 text-sm">
                       Based on your location and emissions profile, these are the reporting requirements
                       that may apply to your organization.
                     </p>
                     
                     {(() => {
                       // Get applicable legislation based on current data
                       const country = location || 'australia';
                       const revenue = annualRevenue || 0;
                       const employees = employeeCount || 0;
                       
                       // Emissions fallback and debug logging
                       let emissions = emissionsData?.emissions?.total || 0;
                       if (emissions === 0 && currentEmissionsState?.emissions?.total) {
                         emissions = currentEmissionsState.emissions.total;
                       }
                       
                       const applicableLaws = getApplicableLegislation(country, revenue, employees, emissions);
                       
                       const countryMappings = {
                         'australia': 'Australia',
                         'united_states': 'United States',
                         'united_kingdom': 'United Kingdom',
                         'european_union': 'European Union',
                         'canada': 'Canada',
                         'new_zealand': 'New Zealand',
                         'japan': 'Japan',
                         'south_korea': 'South Korea',
                         'singapore': 'Singapore',
                         'switzerland': 'Switzerland'
                       };
                       
                       const mappedCountry = countryMappings[country] || 'Australia';
                       const countryLegislation = legislationData[mappedCountry];
                       
                       if (!countryLegislation) {
                         return (
                           <div className="text-gray-500 text-center py-4">
                             No legislation data available for {country}
                           </div>
                         );
                       }
                       
                       const allLegislation = [];
                       
                       // Add primary legislation
                       if (countryLegislation.primary) {
                         allLegislation.push({
                           ...countryLegislation.primary,
                           status: applicableLaws.some(law => law.name === countryLegislation.primary.name) ? 'Mandatory' : 'Voluntary'
                         });
                       }
                       
                       // Add secondary legislation
                       if (countryLegislation.secondary) {
                         countryLegislation.secondary.forEach(law => {
                           allLegislation.push({
                             ...law,
                             status: applicableLaws.some(appLaw => appLaw.name === law.name) ? 'Mandatory' : 'Voluntary'
                           });
                         });
                       }
                       
                       if (allLegislation.length === 0) {
                         return (
                           <div className="text-gray-500 text-center py-4">
                             No reporting obligations found for your organization.
                           </div>
                         );
                       }
                       
                       return allLegislation.map((legislation, index) => {
                         const compliance = calculateComplianceScore(legislation);
                         
                         return (
                           <div key={index}>
                             <div className="border rounded-lg p-4">
                               <div className="flex items-start justify-between">
                                 <div className="flex-1">
                                   <div className="flex items-center space-x-2">
                                     <svg className={`w-5 h-5 ${legislation.status === 'Mandatory' ? 'text-red-500' : 'text-green-500'}`} fill="currentColor" viewBox="0 0 20 20">
                                       <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                     </svg>
                                     <span className={`text-sm font-medium px-2 py-1 rounded ${legislation.status === 'Mandatory' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                       {legislation.status}
                                     </span>
                                   </div>
                                   <h4 className="font-medium mt-2">{legislation.name}</h4>
                                   <p className="text-sm text-gray-600 mt-1">{legislation.fullName}</p>
                                   <p className="text-sm text-gray-500 mt-2">
                                    {legislation.description && legislation.description.length > 150
                                      ? legislation.description.substring(0, 150) + '...'
                                      : legislation.description}
                                  </p>
                                  
                                  {/* Compliance Score Display */}
                                  <div className="mt-4">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-sm font-medium text-gray-700">Compliance Readiness</span>
                                      <span className={`text-sm font-medium ${
                                        compliance.percentage >= 80 ? 'text-green-600' : 
                                        compliance.percentage >= 50 ? 'text-yellow-600' : 
                                        'text-red-600'
                                      }`}>
                                        {compliance.percentage}%
                                      </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div 
                                        className={`h-2 rounded-full transition-all duration-500 ${
                                          compliance.percentage >= 80 ? 'bg-green-600' : 
                                          compliance.percentage >= 50 ? 'bg-yellow-600' : 
                                          'bg-red-600'
                                        }`}
                                        style={{ width: `${compliance.percentage}%` }}
                                      ></div>
                                    </div>
                                    {compliance.percentage < 100 && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        Complete {compliance.totalRequirements - compliance.score} more data points to meet requirements
                                      </p>
                                    )}
                                    {compliance.percentage === 100 && (
                                      <p className="text-xs text-green-600 mt-1 flex items-center">
                                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        Ready for compliance reporting
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="mt-4 flex space-x-4">
                                <button
                                  onClick={() => {
                                    setSelectedLegislation(legislation);
                                    setShowLegislationModal(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                                >
                                  View Legislation Details
                                  <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>

                                {legislation.link && (
                                  <a  
                                    href={legislation.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                                  >
                                    Open Legislation
                                    <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  </a>
                                )}
                              </div>
                            </div>
                            <div className="mt-3 text-xs text-gray-500">
                              <span className="font-medium">Legislation Name:</span> {legislation.name}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>
            )}
            
            {/* Main Content - Tabs for Calculator and Report */}
            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 relative overflow-hidden">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  <span className="ml-3 text-lg text-gray-700">Loading carbon footprint data...</span>
                </div>
              ) : (
                <div>
                  <div className="mb-6">
                    <div className="flex border-b mb-4">
                      <button
                        className={`mr-4 pb-2 cursor-pointer ${activeTab === 0 ? 'border-b-2 border-blue-500 text-blue-600 font-medium' : 'text-gray-600 hover:text-gray-800'}`}
                        onClick={() => setActiveTab(0)}
                      >
                        Emissions Calculator
                      </button>
                      <button
                        className={`mr-4 pb-2 cursor-pointer ${activeTab === 1 ? 'border-b-2 border-blue-500 text-blue-600 font-medium' : 'text-gray-600 hover:text-gray-800'}`}
                        onClick={() => setActiveTab(1)}
                        // REMOVED disabled={!emissionsData} - button is always enabled
                      >
                        Generate Report
                      </button>
                    </div>
                    
                    {activeTab === 0 && (
                      <EmissionsCalculator 
                        projectId={footprintId}
                        initialData={emissionsInitialData}
                        onSave={(data) => {
                          console.log('📤 EmissionsCalculator onSave called with:', {
                            hasRawInputs: data.rawInputs && Object.keys(data.rawInputs).length > 0,
                            hasEmissionValues: data.emissionValues && Object.keys(data.emissionValues).length > 0,
                            emissions: data.emissions, // Log the actual emissions
                            rawInputsKeys: data.rawInputs ? Object.keys(data.rawInputs) : [],
                            emissionValuesKeys: data.emissionValues ? Object.keys(data.emissionValues) : []
                          });
                          handleEmissionsSave(data);
                        }}
                        onGenerateReport={handleGenerateReport}
                        organizationInfo={{
                          employeeCount,
                          facilityCount,
                          fleetSize,
                          industryType,
                          reportingYear,
                          location,
                          annualRevenue,
                          setLocation: handleLocationSelection
                        }}
                        // Add initialLocation prop to ensure the location is pre-selected
                        initialLocation={location}
                        key={`${industryType}-${location}-${forceEmissionsReload}-${emissionsInitialData ? emissionsInitialData.name || emissionsInitialData.id || 'loaded' : 'new'}`} 
                      />
                    )}
                    
                    {activeTab === 1 && (
                      <EmissionsReportGenerator
                        projectId={footprintId}
                        emissionsData={{
                          // Use emissionsData if available, otherwise fall back to currentEmissionsState
                          emissions: emissionsData?.emissions || currentEmissionsState.emissions || {
                            scope1: 0,
                            scope2: 0,
                            scope3: 0,
                            total: 0
                          },
                          emissionValues: emissionsData?.emissionValues || currentEmissionsState.emissionValues || {},
                          rawInputs: emissionsData?.rawInputs || currentEmissionsState.rawInputs || {},
                          reductionTarget: emissionsData?.reductionTarget || currentEmissionsState.reductionTarget || 20,
                          reductionStrategies: emissionsData?.reductionStrategies || currentEmissionsState.reductionStrategies || [],
                          detailedEmissions: emissionsData?.emissionValues || currentEmissionsState.emissionValues || {},
                          location: location,
                          industryType: industryType,
                          reportingYear: reportingYear,
                          // Include the full emissionsData if available
                          ...emissionsData
                        }}
                        reductionStrategies={emissionsData?.reductionStrategies || currentEmissionsState.reductionStrategies || reductionStrategies || []}
                        organizationInfo={{
                          employeeCount,
                          facilityCount,
                          fleetSize,
                          industryType,
                          reportingYear,
                          location,
                          organizationType,
                          annualRevenue
                        }}
                        scenarios={scenarios || []} // Add scenarios to the report
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer with help information */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-200 text-center text-gray-600 text-sm">
          <p>Need help with your carbon footprint assessment? <a href="/help/carbon-footprint" className="text-blue-600 hover:text-blue-800 transition-colors font-medium">View documentation</a> or <a href="/support" className="text-blue-600 hover:text-blue-800 transition-colors font-medium">contact support</a>.</p>
        </div>
      </div>
    </div>

    {/* Floating Quick Action Button */}
    <div className="fixed bottom-6 right-6 z-20">
      <div className="relative group">
        <button 
          className="flex items-center justify-center p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
            {footprintId && currentScenarioId && (
              <button
                onClick={handleManualSave}
                className="flex items-center px-4 py-2 bg-white text-blue-700 rounded-lg border border-blue-500 shadow-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save Carbon Footprint Scenario
              </button>
            )}
            
            {footprintId && (
              <button
                onClick={handleCreateNewScenario}
                className="flex items-center px-4 py-2 bg-white text-indigo-700 rounded-lg border border-indigo-500 shadow-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                New Carbon Footprint Scenario
              </button>
            )}
            
            <button
              onClick={saveAsProject}
              className="flex items-center px-4 py-2 bg-white text-purple-700 rounded-lg border border-purple-500 shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              {footprintId ? 'Update Carbon Footprint' : 'Save as Carbon Footprint'}
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
);
}

export default CarbonFootprintPage;