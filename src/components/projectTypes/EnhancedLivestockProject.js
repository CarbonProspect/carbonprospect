// Enhanced Livestock Project Component

import React, { useState, useEffect } from 'react';
import LivestockEmissionsChart from '../../LivestockEmissionsChart';
import MarketplaceIntegration from '../marketplace/MarketplaceIntegration';

const EnhancedLivestockProject = ({
  // Basic herd info
  herdSize,
  animalType, // 'cattle' or 'buffalo'
  cattleType,
  customTypes,
  customSequestrationRate,
  useCustomRate,
  onAnimalTypeChange,
  onCattleTypeChange,
  onCustomSequestrationRateChange,
  onUseCustomRateChange,
  onShowCustomTypeModal,
  // Emissions calculation factors
  feedType,
  onFeedTypeChange,
  manureManagement,
  onManureManagementChange,
  useEmissionReductionAdditives,
  onUseEmissionReductionAdditivesChange,
  additiveEfficiency,
  onAdditiveEfficiencyChange,
  grazingPractice,
  onGrazingPracticeChange,
  regionClimate,
  onRegionClimateChange,
  // New reproductive metrics
  calvingRate,
  onCalvingRateChange,
  timeToCalfBefore,
  onTimeToCalfBeforeChange,
  timeToCalfAfter,
  onTimeToCalfAfterChange,
  supplementationType,
  onSupplementationTypeChange,
  // Energy and diet metrics
  dietaryEnergyProfile,
  onDietaryEnergyProfileChange,
  seasonalFeedChanges,
  onSeasonalFeedChangesChange,
  customFeedMixture,
  onCustomFeedMixtureChange,
  useCustomFeedMixture,
  onUseCustomFeedMixtureChange,
  selectedFeedAdditive,
  onSelectedFeedAdditiveChange,
  // NEW: Custom feed mix percentages
  feedMixPercentages,
  onFeedMixPercentagesChange,
  // Marketplace integration
  selectedProducts = {},
  onProductSelectionChange = () => {}
}) => {
  // State for active chart tab - simplified, no longer needed for tabs
  const [activeChartTab, setActiveChartTab] = useState('emissions');
  
  // State for showing the marketplace modal
  const [showMarketplace, setShowMarketplace] = useState(false);
  
  // Force update when products change
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // Create local state to ensure selections persist
  const [localFeedType, setLocalFeedType] = useState(feedType || 'mixed');
  const [localSelectedFeedAdditive, setLocalSelectedFeedAdditive] = useState(selectedFeedAdditive || '');
  const [localManureManagement, setLocalManureManagement] = useState(manureManagement || 'standard');
  const [localGrazingPractice, setLocalGrazingPractice] = useState(grazingPractice || 'continuous');
  const [localRegionClimate, setLocalRegionClimate] = useState(regionClimate || 'temperate');
  const [localDietaryEnergyProfile, setLocalDietaryEnergyProfile] = useState(dietaryEnergyProfile || 'medium');
  const [localSeasonalFeedChanges, setLocalSeasonalFeedChanges] = useState(seasonalFeedChanges || 'constant');
  
  // NEW: State for custom feed mix
  const [localFeedMixPercentages, setLocalFeedMixPercentages] = useState(feedMixPercentages || {});
  const [selectedFeedMixes, setSelectedFeedMixes] = useState([]);
  // Use useEffect to sync with parent state when props change
  useEffect(() => {
    if (feedType) setLocalFeedType(feedType);
  }, [feedType]);

  useEffect(() => {
    if (selectedFeedAdditive) setLocalSelectedFeedAdditive(selectedFeedAdditive);
  }, [selectedFeedAdditive]);

  useEffect(() => {
    if (manureManagement) setLocalManureManagement(manureManagement);
  }, [manureManagement]);

  useEffect(() => {
    if (grazingPractice) setLocalGrazingPractice(grazingPractice);
  }, [grazingPractice]);
  
  useEffect(() => {
    if (regionClimate) setLocalRegionClimate(regionClimate);
  }, [regionClimate]);
  
  useEffect(() => {
    if (dietaryEnergyProfile) setLocalDietaryEnergyProfile(dietaryEnergyProfile);
  }, [dietaryEnergyProfile]);
  
  useEffect(() => {
    if (seasonalFeedChanges) setLocalSeasonalFeedChanges(seasonalFeedChanges);
  }, [seasonalFeedChanges]);
  
  useEffect(() => {
    if (feedMixPercentages) setLocalFeedMixPercentages(feedMixPercentages);
  }, [feedMixPercentages]);
  
  // Standard cattle types
  const cattleTypes = [
    { id: 'dairy', name: 'Dairy Cattle', baseEmissions: 120 },
    { id: 'beef', name: 'Beef Cattle', baseEmissions: 85 },
    { id: 'calves', name: 'Calves', baseEmissions: 35 }
  ];

  // Buffalo types
  const buffaloTypes = [
    { id: 'water_buffalo', name: 'Water Buffalo', baseEmissions: 140 },
    { id: 'swamp_buffalo', name: 'Swamp Buffalo', baseEmissions: 115 },
    { id: 'buffalo_calves', name: 'Buffalo Calves', baseEmissions: 40 }
  ];

  // Feed types and their emission modification factors - now with energy content
  const feedTypes = [
    { id: 'grain', name: 'Grain-Fed', factor: 1.0, energyMJ: 12.5, digestibility: 0.85 },
    { id: 'grass', name: 'Grass-Fed', factor: 0.85, energyMJ: 10.0, digestibility: 0.65 },
    { id: 'mixed', name: 'Mixed Feed', factor: 0.92, energyMJ: 11.2, digestibility: 0.75 },
    { id: 'optimized', name: 'Emission-Optimized Feed', factor: 0.75, energyMJ: 11.8, digestibility: 0.82 }
  ];

  // Supplementation types
  const supplementationTypes = [
    { id: 'none', name: 'None', reproductiveEffect: 0, emissionsFactor: 1.0 },
    { id: 'mineral', name: 'Mineral Supplements', reproductiveEffect: 10, emissionsFactor: 0.98 },
    { id: 'protein', name: 'Protein Supplements', reproductiveEffect: 15, emissionsFactor: 1.05 },
    { id: 'energy', name: 'Energy Supplements', reproductiveEffect: 12, emissionsFactor: 1.03 },
    { id: 'complete', name: 'Complete Feed Supplement', reproductiveEffect: 20, emissionsFactor: 1.08 }
  ];

  // Dietary energy profiles
  const dietaryEnergyProfiles = [
    { id: 'low', name: 'Low Energy Diet', mj_per_day: 100, emissionsFactor: 0.9 },
    { id: 'medium', name: 'Medium Energy Diet', mj_per_day: 150, emissionsFactor: 1.0 },
    { id: 'high', name: 'High Energy Diet', mj_per_day: 200, emissionsFactor: 1.1 },
    { id: 'variable', name: 'Variable Energy Diet', mj_per_day: 175, emissionsFactor: 1.05 }
  ];

  // Seasonal feed change patterns - IMPROVED with better impacts
  const seasonalFeedPatterns = [
    { id: 'constant', name: 'Constant Year-Round', seasonalVariation: false, reductionFactor: 1.0, description: 'No adjustment to feed based on seasons' },
    { id: 'two_season', name: 'Wet/Dry Season Pattern', seasonalVariation: true, reductionFactor: 0.93, description: 'Basic two-season feed adjustments based on wet and dry periods' },
    { id: 'four_season', name: 'Four Season Pattern', seasonalVariation: true, reductionFactor: 0.90, description: 'More precise quarterly feed adjustments based on all four seasons' },
    { id: 'custom', name: 'Custom Seasonal Pattern', seasonalVariation: true, reductionFactor: 0.88, description: 'Highly optimized monthly feed adjustments based on local conditions' }
  ];

  // Manure management systems
  const manureManagementSystems = [
    { id: 'standard', name: 'Standard Storage', factor: 1.0, description: 'Basic manure storage without any methane capture or treatment' },
    { id: 'covered', name: 'Covered Storage', factor: 0.8, description: 'Manure stored with covers to reduce emissions and odor' },
    { id: 'anaerobic', name: 'Anaerobic Digestion', factor: 0.45, description: 'Manure processed in oxygen-free tanks to capture methane for energy' },
    { id: 'composting', name: 'Aerobic Composting', factor: 0.6, description: 'Manure decomposed with oxygen to produce fertilizer' },
    { id: 'daily_spread', name: 'Daily Spread', factor: 0.7, description: 'Manure collected and spread on fields daily' }
  ];

  // Grazing practices
  const grazingPractices = [
    { id: 'continuous', name: 'Continuous Grazing', factor: 1.0, description: 'Animals graze freely on the same pasture all season' },
    { id: 'rotational', name: 'Rotational Grazing', factor: 0.85, description: 'Animals moved between pasture sections to allow recovery' },
    { id: 'adaptive', name: 'Adaptive Multi-Paddock', factor: 0.7, description: 'Intensive rotation with short grazing periods and long recovery' },
    { id: 'silvopasture', name: 'Silvopasture', factor: 0.6, description: 'Integration of trees, forage, and grazing animals' }
  ];

  // Climate regions
  const climateRegions = [
    { id: 'temperate', name: 'Temperate', factor: 1.0, description: 'Moderate temperatures with distinct seasons' },
    { id: 'tropical', name: 'Tropical', factor: 1.15, description: 'Hot, humid climate near the equator with high rainfall' },
    { id: 'arid', name: 'Arid', factor: 0.9, description: 'Dry climate with little rainfall and sparse vegetation' },
    { id: 'continental', name: 'Continental', factor: 1.05, description: 'Extreme temperature variations between seasons' }
  ];
  // Find selected animal type (cattle or buffalo)
  const animalTypesMap = {
    'cattle': cattleTypes,
    'buffalo': buffaloTypes
  };
  
  const availableTypes = animalTypesMap[animalType] || cattleTypes;
  
  // IMPROVED: Better handling of custom animal types
  // Find selected animal type - now correctly handles custom types
  const selectedAnimalType = 
    // Check if this is a specific custom type selection 
    (cattleType === `custom_${animalType}`) ? 
      // Use a custom object with the custom emissions rate
      { id: `custom_${animalType}`, name: `Custom ${animalType === 'cattle' ? 'Cattle' : 'Buffalo'}`, baseEmissions: parseFloat(customSequestrationRate) || 100 } :
      // Otherwise find in standard types
      availableTypes.find(type => type.id === cattleType) || 
      // Or in custom types if available
      (customTypes?.[animalType] || []).find(type => type.id === cattleType);

  // Find selected supplementation type
  const selectedSupplementationType = supplementationTypes.find(type => type.id === supplementationType) || supplementationTypes[0];
  
  // Find selected dietary energy profile
  const selectedDietaryProfile = dietaryEnergyProfiles.find(profile => profile.id === localDietaryEnergyProfile) || dietaryEnergyProfiles[1];
  
  // Find selected seasonal pattern - IMPROVED with direct access to reduction factor
  const selectedSeasonalPattern = seasonalFeedPatterns.find(pattern => pattern.id === localSeasonalFeedChanges) || seasonalFeedPatterns[0];

  // Calculate improved calving rate with supplementation
  const calculatedCalvingRateAfter = Math.min(
    100, 
    parseFloat(calvingRate) + selectedSupplementationType.reproductiveEffect
  );
  
  // Helper function to safely call handlers
  const safelyCallHandler = (handler, value) => {
    if (typeof handler === 'function') {
      handler(value);
    } else {
      console.warn(`Handler is not a function for value: ${value}`);
    }
  };
  
  // IMPORTANT: Define calculateBaselineEmissions first since it's used in calculateEmissionsIntensity
  // IMPROVED: Calculate baseline emissions for comparison - now properly handles custom animal types
  const calculateBaselineEmissions = () => {
    // If we have a custom type with "custom_" prefix, use the custom rate directly
    if (cattleType === `custom_${animalType}` && useCustomRate) {
      return parseFloat(customSequestrationRate) || 100;
    }
    
    let baseRate = selectedAnimalType?.baseEmissions || 100;
    
    // Species-specific adjustment (buffalo vs cattle)
    if (animalType === 'buffalo') {
      baseRate *= 1.15;
    }
    
    return baseRate.toFixed(2);
  };
  
  // Fix to initialize Time to Calf After to match Before when component loads
  useEffect(() => {
    // When component first loads, set the "after" time to match the "before" time
    if (timeToCalfAfter === undefined || timeToCalfAfter === '') {
      safelyCallHandler(onTimeToCalfAfterChange, timeToCalfBefore);
    }
    
    // Also check when timeToCalfBefore changes and no supplementation is selected
    if (supplementationType === 'none' && timeToCalfBefore !== timeToCalfAfter) {
      safelyCallHandler(onTimeToCalfAfterChange, timeToCalfBefore);
    }
  }, [timeToCalfBefore, supplementationType, timeToCalfAfter]);
  
  // Monitor selectedProducts changes
  useEffect(() => {
    if (selectedProducts && Object.keys(selectedProducts).length > 0) {
      console.log('🔄 Products changed in livestock project, refreshing calculations');
      console.log('Selected products:', selectedProducts);
      
      // Force recalculation of emissions intensity
      const newIntensity = calculateEmissionsIntensity();
      console.log('New emissions intensity after products applied:', newIntensity);
      
      // Force a re-render to update the UI
      setForceUpdate(prev => prev + 1);
    }
  }, [selectedProducts]);
  // Helper function for feed additives - IMPROVED to better categorize
  const getFeedAdditives = () => {
    const baseAdditives = [
      { id: 'methane_inhibitor', name: 'Methane Inhibitor', reductionPercentage: 20, description: 'Chemical compounds that directly block methane production in the rumen' },
      { id: 'probiotics', name: 'Probiotics Blend', reductionPercentage: 10, description: 'Beneficial microorganisms that improve digestion and reduce methane' },
      { id: 'essential_oils', name: 'Essential Oils Mix', reductionPercentage: 8, description: 'Plant compounds that modify rumen fermentation to produce less methane' }
    ];
    
    // Add marketplace additives if available
    if (selectedProducts && Object.keys(selectedProducts).length > 0) {
      const feedAdditives = Object.values(selectedProducts).filter(product => {
        const livestockDetails = product.integration_details?.livestock;
        const productName = (product.name || '').toLowerCase();
        
        // Only include products with "additive" or "supplement" in name that are NOT feed mixes
        return (productName.includes('additive') || 
               (productName.includes('supplement') && !productName.includes('feed mix') && !productName.includes('seed mix'))) ||
               (livestockDetails && 
                (livestockDetails.applicationType === 'feed_additive' || 
                 livestockDetails.applicationType === 'feed_supplement'));
      });
      
      feedAdditives.forEach(product => {
        const reductionFactor = parseFloat(product.emissions_reduction_factor) || 0;
        baseAdditives.push({
          id: `marketplace_${product.id}`,
          name: product.name,
          reductionPercentage: Math.round(reductionFactor * 100),
          isMarketplaceProduct: true,
          originalProductId: product.id,
          description: product.description || 'Marketplace product to reduce methane emissions'
        });
      });
    }
    
    return baseAdditives;
  };

  // Get enhanced feed types including marketplace products - IMPROVED: all feed/seed mixes go here
  const getEnhancedFeedTypes = () => {
    // Start with the base feed types
    let enhancedFeedTypes = [...feedTypes];
    
    // Check if we have marketplace products to add
    if (selectedProducts && Object.keys(selectedProducts).length > 0) {
      // Filter for feed-related products - more inclusive filtering for feed/seed mixes
      const feedProducts = Object.values(selectedProducts).filter(product => {
        const livestockDetails = product.integration_details?.livestock;
        const productName = (product.name || '').toLowerCase();
        
        // Include ALL feed mixes and seed mixes
        return productName.includes('feed mix') || 
               productName.includes('seed mix') ||
               productName.includes('tmr') || 
               productName.includes('diet') ||
               productName.includes('supplement') || // Include feed supplements here
               (livestockDetails && 
                (livestockDetails.applicationType === 'complete_feed' ||
                 livestockDetails.applicationType === 'feed_system' ||
                 livestockDetails.applicationType === 'feed_supplement'));
      });
      
      // Add feed products to the dropdown options
      feedProducts.forEach(product => {
        // Create a unique ID for this feed product
        const productId = `marketplace_${product.id}`;
        
        // Calculate the emission factor properly - FIXED
        const reductionFactor = parseFloat(product.emissions_reduction_factor) || 0;
        const emissionFactor = 1.0 - reductionFactor; // This is the key fix
        
        // Calculate digestibility based on emission reduction factor
        const estimatedDigestibility = 0.75 + (reductionFactor * 0.2);
        
        // Add to enhanced feed types
        enhancedFeedTypes.push({
          id: productId,
          name: `${product.name} (${product.company_name || "Unknown"})`,
          factor: emissionFactor, // FIXED: Use the calculated emission factor
          energyMJ: 12.0, // Assume standard energy content
          digestibility: Math.min(0.95, estimatedDigestibility),
          isMarketplaceProduct: true,
          originalProductId: product.id,
          reductionPercentage: Math.round(reductionFactor * 100), // Store reduction percentage
          description: product.description || 'Specialized feed mix for improved performance and reduced emissions'
        });
      });
    }
    
    return enhancedFeedTypes;
  };
  // Get enhanced grazing practices including marketplace products - IMPROVED but more selective
  const getEnhancedGrazingPractices = () => {
    // Start with base grazing practices
    let enhancedPractices = [...grazingPractices];
    
    // Check if we have marketplace products to add
    if (selectedProducts && Object.keys(selectedProducts).length > 0) {
      // Filter for grazing-related products but NOT feed/seed mixes
      const grazingProducts = Object.values(selectedProducts).filter(product => {
        const livestockDetails = product.integration_details?.livestock;
        const productName = (product.name || '').toLowerCase();
        
        // Don't include feed/seed mixes as they should be in feed type category
        if (productName.includes('feed mix') || productName.includes('seed mix')) {
          return false;
        }
        
        // Include only grazing-specific products
        return productName.includes('grazing') || 
               productName.includes('pasture system') ||
               (livestockDetails && 
                (livestockDetails.applicationType === 'pasture_system' ||
                 livestockDetails.applicationType === 'grazing_management'));
      });
      
      // Add grazing products to options
      grazingProducts.forEach(product => {
        // Create a unique ID for this grazing product
        const productId = `marketplace_${product.id}`;
        
        // Calculate factor based on emission reduction factor
        const reductionFactor = parseFloat(product.emissions_reduction_factor) || 0;
        const calculatedFactor = Math.max(0.5, 1.0 - reductionFactor);
        
        // Add to enhanced grazing practices
        enhancedPractices.push({
          id: productId,
          name: `${product.name} (${product.company_name || "Unknown"})`,
          factor: calculatedFactor,
          isMarketplaceProduct: true,
          originalProductId: product.id,
          description: product.description || 'Advanced grazing management system that improves soil health and reduces emissions'
        });
      });
    }
    
    return enhancedPractices;
  };

  // Get enhanced manure management systems including marketplace products
  const getEnhancedManureSystems = () => {
    // Start with base manure systems
    let enhancedSystems = [...manureManagementSystems];
    
    // Check if we have marketplace products to add
    if (selectedProducts && Object.keys(selectedProducts).length > 0) {
      // Filter for manure-related products
      const manureProducts = Object.values(selectedProducts).filter(product => {
        const livestockDetails = product.integration_details?.livestock;
        const productName = (product.name || '').toLowerCase();
        
        // Include only manure-specific products
        return productName.includes('manure') || 
               productName.includes('waste') || 
               productName.includes('biogas') ||
               (livestockDetails && 
                (livestockDetails.applicationType === 'manure_management' ||
                 livestockDetails.applicationType === 'biogas_system' ||
                 livestockDetails.applicationType === 'waste_treatment'));
      });
      
      // Add manure products to options
      manureProducts.forEach(product => {
        // Create a unique ID for this manure product
        const productId = `marketplace_${product.id}`;
        
        // Calculate factor based on emission reduction factor
        const reductionFactor = parseFloat(product.emissions_reduction_factor) || 0;
        const calculatedFactor = Math.max(0.4, 1.0 - reductionFactor);
        
        // Add to enhanced manure systems
        enhancedSystems.push({
          id: productId,
          name: `${product.name} (${product.company_name || "Unknown"})`,
          factor: calculatedFactor,
          isMarketplaceProduct: true,
          originalProductId: product.id,
          description: product.description || 'Advanced manure management technology that reduces greenhouse gas emissions'
        });
      });
    }
    
    return enhancedSystems;
  };
  // FIXED: Improved supplementation type handler to properly update Time to Calf
  const handleSupplementationTypeChange = (newSupplementationType) => {
    // Find the selected supplementation type
    const selectedType = supplementationTypes.find(type => type.id === newSupplementationType);
    
    if (selectedType) {
      // Only update the "after" value if we're not selecting "none"
      if (newSupplementationType !== 'none') {
        // Auto-calculate the new time to calf based on supplementation effect
        // Reproductive effect on time to calf is roughly 1 month reduction per 10% calving rate improvement
        const effectTimeReduction = selectedType.reproductiveEffect / 10;
        const currentTime = parseFloat(timeToCalfBefore) || 0;
        const newTimeToCalfAfter = Math.max(1, currentTime - effectTimeReduction);
        
        // Update both state values
        safelyCallHandler(onSupplementationTypeChange, newSupplementationType);
        safelyCallHandler(onTimeToCalfAfterChange, newTimeToCalfAfter.toFixed(1));
      } else {
        // If "none" is selected, make "after" match "before"
        safelyCallHandler(onSupplementationTypeChange, newSupplementationType);
        safelyCallHandler(onTimeToCalfAfterChange, timeToCalfBefore);
      }
    } else {
      // Just update the supplementation type if we can't find the details
      safelyCallHandler(onSupplementationTypeChange, newSupplementationType);
    }
  };

  // NEW: Handle adding and removing feed mixes in the custom feed mix
  const handleAddFeedMix = (feedId) => {
    if (!selectedFeedMixes.includes(feedId)) {
      setSelectedFeedMixes([...selectedFeedMixes, feedId]);
      
      // Initialize with equal percentages
      const updatedPercentages = {...localFeedMixPercentages};
      const newCount = selectedFeedMixes.length + 1;
      const equalPercentage = Math.floor(100 / newCount);
      
      // Update all percentages to be equal
      selectedFeedMixes.forEach(id => {
        updatedPercentages[id] = equalPercentage;
      });
      updatedPercentages[feedId] = equalPercentage;
      
      // Make sure total adds up to 100%
      const total = Object.values(updatedPercentages).reduce((sum, val) => sum + val, 0);
      if (total < 100) {
        // Add remaining to first item
        const firstId = selectedFeedMixes[0] || feedId;
        updatedPercentages[firstId] = updatedPercentages[firstId] + (100 - total);
      }
      
      setLocalFeedMixPercentages(updatedPercentages);
      safelyCallHandler(onFeedMixPercentagesChange, updatedPercentages);
    }
  };
  
  const handleRemoveFeedMix = (feedId) => {
    if (selectedFeedMixes.includes(feedId)) {
      const updatedMixes = selectedFeedMixes.filter(id => id !== feedId);
      setSelectedFeedMixes(updatedMixes);
      
      // Redistribute percentages
      const updatedPercentages = {...localFeedMixPercentages};
      delete updatedPercentages[feedId];
      
      if (updatedMixes.length > 0) {
        const equalPercentage = Math.floor(100 / updatedMixes.length);
        updatedMixes.forEach(id => {
          updatedPercentages[id] = equalPercentage;
        });
        
        // Make sure total adds up to 100%
        const total = Object.values(updatedPercentages).reduce((sum, val) => sum + val, 0);
        if (total < 100 && updatedMixes.length > 0) {
          updatedPercentages[updatedMixes[0]] = updatedPercentages[updatedMixes[0]] + (100 - total);
        }
      }
      
      setLocalFeedMixPercentages(updatedPercentages);
      safelyCallHandler(onFeedMixPercentagesChange, updatedPercentages);
    }
  };
  
  const handleFeedMixPercentageChange = (feedId, percentage) => {
    const newPercentage = Math.min(100, Math.max(0, parseInt(percentage) || 0));
    
    // Update the percentage for this feed
    const updatedPercentages = {...localFeedMixPercentages, [feedId]: newPercentage};
    
    // Calculate total
    const total = Object.values(updatedPercentages).reduce((sum, val) => sum + val, 0);
    
    // Adjust if total exceeds 100%
    if (total > 100) {
      const excess = total - 100;
      
      // Find other feeds to reduce
      const otherFeedIds = selectedFeedMixes.filter(id => id !== feedId);
      
      if (otherFeedIds.length > 0) {
        // Reduce other feeds proportionally
        let remainingExcess = excess;
        
        otherFeedIds.forEach(id => {
          const currentPercentage = updatedPercentages[id];
          const reduceBy = Math.min(currentPercentage, Math.ceil(remainingExcess / otherFeedIds.length));
          updatedPercentages[id] = currentPercentage - reduceBy;
          remainingExcess -= reduceBy;
        });
      } else {
        // If this is the only feed, cap at 100%
        updatedPercentages[feedId] = 100;
      }
    }
    
    setLocalFeedMixPercentages(updatedPercentages);
    safelyCallHandler(onFeedMixPercentagesChange, updatedPercentages);
  };
  // FIXED: Remove the double application of marketplace products
  // This function is no longer needed as marketplace products are already
  // being applied through the dropdown selections in calculateEmissionsIntensity
  const applyMarketplaceProducts = (baseRate) => {
    // Simply return the base rate without modifications
    // All marketplace product effects are already applied through dropdown selections
    return baseRate;
  };

  // Handler for animal type change
  const handleAnimalTypeChange = (e) => {
    const newAnimalType = e.target.value;
    
    // Call the parent component's handler
    if (onAnimalTypeChange) {
      onAnimalTypeChange(newAnimalType);
    }
    
    // Automatically select the first animal category of the new type
    const newOptions = animalTypesMap[newAnimalType] || [];
    if (newOptions.length > 0 && onCattleTypeChange) {
      onCattleTypeChange(newOptions[0].id);
    }
  };
  // IMPROVED: Calculate the current emissions intensity - with better seasonal feed handling
  const calculateEmissionsIntensity = () => {
    // Base emissions rate modified for animal type
    let baseRate = selectedAnimalType?.baseEmissions || 100;
    
    // Species-specific adjustment (buffalo vs cattle)
    if (animalType === 'buffalo') {
      // Buffalo generally have higher emissions due to different digestive efficiency
      baseRate *= 1.15;
    }
    
    // Track all reduction factors for logging
    const reductionFactors = {
      feedType: 1.0,
      dietaryEnergy: 1.0,
      supplementation: 1.0,
      manureManagement: 1.0, 
      grazingPractice: 1.0,
      climateRegion: 1.0,
      additives: 1.0,
      seasonal: 1.0,
      reproductive: 1.0,
      marketplace: 1.0
    };
    
    // Apply feed factor - either single feed or custom feed mix
    if (useCustomFeedMixture && selectedFeedMixes.length > 0) {
      // Calculate weighted average factor for custom feed mix
      let weightedFactor = 0;
      let totalPercentage = 0;
      
      selectedFeedMixes.forEach(feedId => {
        const percentage = localFeedMixPercentages[feedId] || 0;
        totalPercentage += percentage;
        
        // Get factor for this feed type
        const allFeedTypes = getEnhancedFeedTypes();
        const feedType = allFeedTypes.find(f => f.id === feedId);
        
        if (feedType) {
          weightedFactor += feedType.factor * (percentage / 100);
        }
      });
      
      // Normalize if percentages don't add up to 100
      if (totalPercentage > 0 && totalPercentage !== 100) {
        weightedFactor = (weightedFactor / totalPercentage) * 100;
      }
      
      reductionFactors.feedType = weightedFactor || 1.0;
    } else {
      // Single feed type selection
      const allFeedTypes = getEnhancedFeedTypes();
      const selectedFeed = allFeedTypes.find(f => f.id === localFeedType);
      reductionFactors.feedType = selectedFeed?.factor || 1.0;
    }
    
    baseRate *= reductionFactors.feedType;
    
    // Apply dietary energy profile factor
    reductionFactors.dietaryEnergy = selectedDietaryProfile.emissionsFactor;
    baseRate *= reductionFactors.dietaryEnergy;
    
    // Apply supplementation effect
    reductionFactors.supplementation = selectedSupplementationType.emissionsFactor;
    baseRate *= reductionFactors.supplementation;
    
    // Apply manure management factor
    const allManureSystems = getEnhancedManureSystems();
    const selectedManure = allManureSystems.find(m => m.id === localManureManagement);
    reductionFactors.manureManagement = selectedManure?.factor || 1.0;
    baseRate *= reductionFactors.manureManagement;
    
    // Apply grazing practice factor
    const allGrazingPractices = getEnhancedGrazingPractices();
    const selectedGrazing = allGrazingPractices.find(g => g.id === localGrazingPractice);
    reductionFactors.grazingPractice = selectedGrazing?.factor || 1.0;
    baseRate *= reductionFactors.grazingPractice;
    
    // Apply climate region factor
    const selectedClimate = climateRegions.find(c => c.id === localRegionClimate);
    reductionFactors.climateRegion = selectedClimate?.factor || 1.0;
    baseRate *= reductionFactors.climateRegion;
    
    // FIXED: Only apply manual additive reduction if no marketplace product is selected
    const isAnyMarketplaceProductSelected = 
      (localSelectedFeedAdditive && localSelectedFeedAdditive.startsWith('marketplace_')) ||
      (localFeedType && localFeedType.startsWith('marketplace_')) ||
      (localManureManagement && localManureManagement.startsWith('marketplace_')) ||
      (localGrazingPractice && localGrazingPractice.startsWith('marketplace_')) ||
      (useCustomFeedMixture && selectedFeedMixes.some(id => id.startsWith('marketplace_')));
      
    // Apply additive reduction ONLY if no marketplace product is selected
    if (useEmissionReductionAdditives && !isAnyMarketplaceProductSelected) {
      reductionFactors.additives = (1 - (additiveEfficiency / 100));
      baseRate *= reductionFactors.additives;
    }
    
    // IMPROVED: Apply seasonal variation with a more significant impact
    if (selectedSeasonalPattern.seasonalVariation) {
      reductionFactors.seasonal = selectedSeasonalPattern.reductionFactor;
      baseRate *= reductionFactors.seasonal;
      console.log(`Applied seasonal pattern "${selectedSeasonalPattern.name}" with factor: ${reductionFactors.seasonal}`);
    }
    
    // FIXED: Apply reproductive efficiency factor ONLY if there's actual change
    // Check if there's any actual change in reproductive parameters
    const timeDifference = parseFloat(timeToCalfBefore) - parseFloat(timeToCalfAfter);
    const calvingRateDifference = calculatedCalvingRateAfter - parseFloat(calvingRate);
    
    if (timeDifference > 0 || calvingRateDifference > 0) {
      // Only apply reproductive efficiency factor if there are improvements
      const reproductiveEfficiencyFactor = 1 - ((100 - parseFloat(calvingRate)) / 200) - 
                                          (timeDifference / 60);
      
      reductionFactors.reproductive = Math.max(0.8, reproductiveEfficiencyFactor);
      baseRate *= reductionFactors.reproductive;
    } else {
      // No reproductive change, no impact on emissions
      reductionFactors.reproductive = 1.0;
    }
    
    // Apply marketplace products only if they are selected in dropdowns
    const modifiedBaseRate = applyMarketplaceProducts(baseRate);
    
    // Calculate the total reduction from marketplace products
    reductionFactors.marketplace = (modifiedBaseRate / baseRate);
    baseRate = modifiedBaseRate;
    
    // Log the calculations for debugging
    const baselineRate = parseFloat(calculateBaselineEmissions());
    const emissionsReduction = baselineRate - baseRate;
    const reductionPercentage = (emissionsReduction / baselineRate) * 100;
    
    console.log(`Baseline rate: ${baselineRate} kg CO2e/head/year`);
    console.log(`Calculated rate after reductions: ${baseRate} kg CO2e/head/year`);
    console.log(`Emissions reduction: ${emissionsReduction.toFixed(2)} kg CO2e/head/year`);
    console.log(`CORRECT reduction percentage: ${reductionPercentage.toFixed(2)}%`);
    
    return baseRate.toFixed(2);
  };

  // Calculate energy efficiency and feed conversion metrics
  const calculateEnergyMetrics = () => {
    if (useCustomFeedMixture && selectedFeedMixes.length > 0) {
      // Calculate weighted averages for custom feed mix
      let weightedEnergyMJ = 0;
      let weightedDigestibility = 0;
      let totalPercentage = 0;
      
      selectedFeedMixes.forEach(feedId => {
        const percentage = localFeedMixPercentages[feedId] || 0;
        totalPercentage += percentage;
        
        // Get metrics for this feed type
        const allFeedTypes = getEnhancedFeedTypes();
        const feedType = allFeedTypes.find(f => f.id === feedId);
        
        if (feedType) {
          weightedEnergyMJ += feedType.energyMJ * (percentage / 100);
          weightedDigestibility += feedType.digestibility * (percentage / 100);
        }
      });
      
      // Normalize if percentages don't add up to 100
      if (totalPercentage > 0 && totalPercentage !== 100) {
        weightedEnergyMJ = (weightedEnergyMJ / totalPercentage) * 100;
        weightedDigestibility = (weightedDigestibility / totalPercentage) * 100;
      }
      
      // Calculate daily energy intake (MJ/day)
      let dailyEnergyIntake = selectedDietaryProfile.mj_per_day;
      
      // Adjust for animal type
      if (animalType === 'buffalo') {
        dailyEnergyIntake *= 1.2; // Buffalo typically require more energy
      }
      
      // Calculate methane conversion factor (Ym) - based on digestibility
      const methaneFactor = 6.5 + ((1 - weightedDigestibility) * 10);
      
      // Feed conversion efficiency (kg product / kg feed) - simplified estimation
      const feedConversionEfficiency = weightedDigestibility * 0.15;
      
      return {
        dailyEnergyIntake: dailyEnergyIntake.toFixed(1),
        methaneFactor: methaneFactor.toFixed(1),
        feedConversionEfficiency: feedConversionEfficiency.toFixed(3)
      };
    } else {
      // Single feed type calculation - unchanged
      const allFeedTypes = getEnhancedFeedTypes();
      const selectedFeed = allFeedTypes.find(f => f.id === localFeedType) || allFeedTypes[0];
      
      // Calculate daily energy intake (MJ/day)
      let dailyEnergyIntake = selectedDietaryProfile.mj_per_day;
      
      // Adjust for animal type
      if (animalType === 'buffalo') {
        dailyEnergyIntake *= 1.2; // Buffalo typically require more energy
      }
      
      // Calculate methane conversion factor (Ym) - based on digestibility
      const methaneFactor = 6.5 + ((1 - selectedFeed.digestibility) * 10);
      
      // Feed conversion efficiency (kg product / kg feed) - simplified estimation
      const feedConversionEfficiency = selectedFeed.digestibility * 0.15;
      
      return {
        dailyEnergyIntake: dailyEnergyIntake.toFixed(1),
        methaneFactor: methaneFactor.toFixed(1),
        feedConversionEfficiency: feedConversionEfficiency.toFixed(3)
      };
    }
  };

  // Other calculation functions remain the same
  const calculateReproductiveEfficiency = () => {
    // Calculate annual calf production per 100 females
    const annualCalfProductionBefore = parseFloat(calvingRate);
    const annualCalfProductionAfter = calculatedCalvingRateAfter;
    
    // Calculate annual productivity increase
    const productivityIncrease = annualCalfProductionAfter - annualCalfProductionBefore;
    
    // Calculate time saved in reproductive cycle (months)
    const timeSaved = parseFloat(timeToCalfBefore) - parseFloat(timeToCalfAfter);
    
    // Calculate lifetime production impact (assuming 8 year productive life)
    const averageCalvesLifetimeBefore = (annualCalfProductionBefore / 100) * 8;
    const averageCalvesLifetimeAfter = (annualCalfProductionAfter / 100) * 8;
    
    return {
      annualCalfProductionBefore,
      annualCalfProductionAfter,
      productivityIncrease,
      timeSaved,
      averageCalvesLifetimeBefore: averageCalvesLifetimeBefore.toFixed(1),
      averageCalvesLifetimeAfter: averageCalvesLifetimeAfter.toFixed(1),
      lifetimeProductionIncrease: (averageCalvesLifetimeAfter - averageCalvesLifetimeBefore).toFixed(1)
    };
  };

  const formatEmissionReduction = (baselineRate, reducedRate) => {
    // Calculate the absolute reduction
    const absoluteReduction = baselineRate - reducedRate;
    
    // Calculate the percentage reduction (correctly, not in reverse)
    const percentageReduction = (absoluteReduction / baselineRate) * 100;
    
    return {
      baseline: baselineRate.toFixed(1),
      reduced: reducedRate.toFixed(1),
      absoluteReduction: absoluteReduction.toFixed(1),
      percentageReduction: percentageReduction.toFixed(1)
    };
  };

  const formatEmissionsDataForChart = () => {
    const baselineRate = parseFloat(calculateBaselineEmissions());
    const adjustedRate = parseFloat(calculateEmissionsIntensity());
    
    return {
      baseline: baselineRate,
      reduced: adjustedRate,
      percentReduction: ((baselineRate - adjustedRate) / baselineRate) * 100
    };
  };
  // Calculate emissions data
  const currentEmissionsIntensity = calculateEmissionsIntensity();
  const energyMetrics = calculateEnergyMetrics();
  const reproductiveMetrics = calculateReproductiveEfficiency();
  
  // Calculate emissions data for visualization
  const baselineEmissionsRate = parseFloat(calculateBaselineEmissions());
  const adjustedEmissionsRate = parseFloat(currentEmissionsIntensity);
  
  // Create yearly emissions data for the chart
  const createYearlyEmissionsData = (years = 10) => {
    const data = [];
    for (let year = 1; year <= years; year++) {
      // Base values
      const baselineEmissions = baselineEmissionsRate * herdSize;
      const adjustedEmissions = adjustedEmissionsRate * herdSize;
      
      data.push({
        year,
        baselineEmissions,
        adjustedEmissions,
        emissionsReduction: baselineEmissions - adjustedEmissions,
        emissionsReductionPercent: ((baselineEmissions - adjustedEmissions) / baselineEmissions) * 100
      });
    }
    return data;
  };

  // Generate yearly data for emissions chart
  const yearlyEmissionsData = createYearlyEmissionsData();
  
  // Format emissions intensity data for the chart
  const emissionsIntensityData = formatEmissionsDataForChart();
  // Render available technologies
  const renderAvailableTechnologies = () => {
    if (!selectedProducts || Object.keys(selectedProducts).length === 0) {
      return null;
    }
    
    return (
      <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-100">
        <h3 className="text-md font-medium mb-3 text-green-700">Available Technologies</h3>
        <div className="space-y-3">
          {Object.values(selectedProducts).map(product => {
            // Parse the emissions reduction factor correctly
            const reductionFactor = parseFloat(product.emissions_reduction_factor) || 0;
            const reductionPercentage = Math.round(reductionFactor * 100);
            
            return (
              <div key={product.id} className="bg-white p-3 rounded-lg border border-green-100 flex items-center">
                <div className="flex-shrink-0 mr-3 text-green-600">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-grow">
                  <h4 className="text-sm font-medium">{product.name || "Unknown Product"}</h4>
                  <p className="text-xs text-gray-600">by {product.company_name || "Unknown Company"}</p>
                </div>
                <div className="flex-shrink-0 text-green-800 text-sm font-medium">
                  {reductionPercentage}% emissions reduction
                </div>
                <button 
                  onClick={() => {
                    const updatedProducts = {...selectedProducts};
                    delete updatedProducts[product.id];
                    onProductSelectionChange(updatedProducts);
                  }}
                  className="ml-2 text-red-500 hover:text-red-700"
                  title="Remove"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  // NEW: Render the custom feed mix section
  const renderCustomFeedMixSection = () => {
    const allFeedTypes = getEnhancedFeedTypes();
    
    return (
      <div className="mt-4 border rounded p-4 bg-yellow-50">
        <h4 className="font-medium text-yellow-800 mb-3">Custom Feed Mix</h4>
        
        {/* Selected Feed Mixes */}
        <div className="space-y-3 mb-4">
          {selectedFeedMixes.map(feedId => {
            const feedType = allFeedTypes.find(f => f.id === feedId);
            
            return feedType ? (
              <div key={feedId} className="flex items-center space-x-3">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={localFeedMixPercentages[feedId] || 0}
                  onChange={(e) => handleFeedMixPercentageChange(feedId, e.target.value)}
                  className="w-16 p-1 border rounded text-center"
                />
                <span className="text-gray-600">%</span>
                <div className="flex-grow">
                  <span className="text-sm font-medium">{feedType.name}</span>
                </div>
                <button
                  onClick={() => handleRemoveFeedMix(feedId)}
                  className="text-red-500 hover:text-red-700"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : null;
          })}
        </div>
        
        {/* Add Feed Mix Dropdown */}
        <div className="mt-3">
          <label className="block text-sm font-medium mb-1 text-gray-700">Add Feed to Mix</label>
          <div className="flex space-x-2">
            <select
              className="flex-grow p-2 border rounded"
              onChange={(e) => e.target.value && handleAddFeedMix(e.target.value)}
              value=""
            >
              <option value="">Select a feed type</option>
              {allFeedTypes.map(feed => 
                !selectedFeedMixes.includes(feed.id) && (
                  <option key={feed.id} value={feed.id}>
                    {feed.name}
                  </option>
                )
              )}
            </select>
          </div>
        </div>
        
        {/* Total Percentage Display */}
        <div className="mt-4 text-right">
          <span className="text-sm font-medium">
            Total: {Object.values(localFeedMixPercentages).reduce((sum, val) => sum + val, 0)}%
          </span>
          {Object.values(localFeedMixPercentages).reduce((sum, val) => sum + val, 0) !== 100 && (
            <span className="text-red-500 ml-2">(Should equal 100%)</span>
          )}
        </div>
      </div>
    );
  };
  // FIXED: Improved Feed Section with direct dropdown for additives
  const renderFeedAndSupplementsSection = () => {
    return (
      <div className="border rounded-lg overflow-hidden shadow-sm">
        <div className="bg-yellow-50 px-4 py-2 border-b">
          <h3 className="font-medium text-yellow-800">3. Energy and Diet</h3>
        </div>
        <div className="p-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Custom Feed Mix Toggle */}
            <div className="col-span-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="useCustomFeedMixture"
                  checked={useCustomFeedMixture}
                  onChange={(e) => {
                    const newValue = e.target.checked;
                    safelyCallHandler(onUseCustomFeedMixtureChange, newValue);
                    
                    // Reset feed mixes when disabling
                    if (!newValue) {
                      setSelectedFeedMixes([]);
                      setLocalFeedMixPercentages({});
                      safelyCallHandler(onFeedMixPercentagesChange, {});
                    }
                  }}
                  className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                />
                <label htmlFor="useCustomFeedMixture" className="ml-2 block text-sm text-gray-700">
                  Use custom feed mixture
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Creates a personalized feed mix by combining different feed types in specific percentages
              </p>
            </div>
            
            {/* Base Feed Type or Custom Feed Mix */}
            {useCustomFeedMixture ? (
              <div className="col-span-2">
                {renderCustomFeedMixSection()}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Base Feed Type</label>
                <select
                  value={localFeedType}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setLocalFeedType(newValue);
                    safelyCallHandler(onFeedTypeChange, newValue);
                  }}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                >
                  {getEnhancedFeedTypes().map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name} {type.isMarketplaceProduct && type.reductionPercentage ? 
                        `(-${type.reductionPercentage}% emissions)` : 
                        `(${type.energyMJ} MJ/kg, ${Math.round(type.digestibility*100)}% digestibility)`}
                      {type.isMarketplaceProduct ? ' ★' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Higher digestibility feeds (80%+) typically produce less methane per unit of energy
                </p>
              </div>
            )}
            
            {/* Feed Additives - implemented as a separate dropdown */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Feed Additives</label>
              <select
                value={localSelectedFeedAdditive || ''}
                onChange={(e) => {
                  const newValue = e.target.value;
                  // Update local state
                  setLocalSelectedFeedAdditive(newValue);
                  
                  // First check if handler exists before calling it
                  if (typeof onSelectedFeedAdditiveChange === 'function') {
                    onSelectedFeedAdditiveChange(newValue);
                  } else {
                    console.warn('onSelectedFeedAdditiveChange handler is not available');
                  }
                  
                  // Also set the useEmissionReductionAdditives flag based on selection
                  const useAdditives = newValue !== '' && newValue !== 'none';
                  if (typeof onUseEmissionReductionAdditivesChange === 'function') {
                    onUseEmissionReductionAdditivesChange(useAdditives);
                  }
                }}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
              >
                <option value="">None</option>
                {getFeedAdditives().map((additive) => (
                  <option key={additive.id} value={additive.id}>
                    {additive.name} ({additive.reductionPercentage}% methane reduction)
                    {additive.isMarketplaceProduct ? ' ★' : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Supplements that directly reduce methane production in the animal's digestive system
              </p>
            </div>
            
            {/* Dietary Energy Profile */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Dietary Energy Profile</label>
              <select
                value={localDietaryEnergyProfile}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setLocalDietaryEnergyProfile(newValue);
                  safelyCallHandler(onDietaryEnergyProfileChange, newValue);
                }}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
              >
                {dietaryEnergyProfiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name} ({profile.mj_per_day} MJ/day)
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                The total energy content of the daily diet (megajoules per day)
              </p>
            </div>
            
            {/* Seasonal Feed Changes - IMPROVED with better descriptions */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Seasonal Feed Changes</label>
              <select
                value={localSeasonalFeedChanges}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setLocalSeasonalFeedChanges(newValue);
                  safelyCallHandler(onSeasonalFeedChangesChange, newValue);
                }}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
              >
                {seasonalFeedPatterns.map((pattern) => (
                  <option key={pattern.id} value={pattern.id}>
                    {pattern.name} {pattern.seasonalVariation ? `(${((1-pattern.reductionFactor)*100).toFixed(0)}% reduction)` : '(no reduction)'}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {seasonalFeedPatterns.find(p => p.id === localSeasonalFeedChanges)?.description || 
                 "Adapting feed to seasonal conditions can reduce emissions by aligning with animal needs and forage quality"}
              </p>
            </div>
          </div>
          
          {/* Add the summary here */}
          {/* Summary of Feed and Diet Impact */}
          <div className="mt-4 bg-yellow-50 p-3 rounded-lg border border-yellow-100">
            <h5 className="text-sm font-medium text-yellow-800 mb-2">Impact on Emissions</h5>
            <div className="text-xs space-y-1">
              {useCustomFeedMixture ? (
                <>
                  <div className="flex justify-between">
                    <span>Custom feed mix composition:</span>
                    <span className="font-medium">
                      {Object.entries(localFeedMixPercentages)
                        .map(([feedId, percentage]) => {
                          const feedType = getEnhancedFeedTypes().find(f => f.id === feedId);
                          return feedType ? `${percentage}% ${feedType.name.split('(')[0]}` : '';
                        })
                        .filter(text => text)
                        .join(', ')}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between">
                  <span>Selected feed type:</span>
                  <span className="font-medium">
                    {getEnhancedFeedTypes().find(f => f.id === localFeedType)?.name || 'Mixed Feed'}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Feed digestibility:</span>
                <span className="font-medium">
                  {useCustomFeedMixture ? 
                    `${Math.round(selectedFeedMixes.reduce((sum, feedId) => {
                      const feedType = getEnhancedFeedTypes().find(f => f.id === feedId);
                      const percentage = localFeedMixPercentages[feedId] || 0;
                      return sum + (feedType?.digestibility || 0.75) * (percentage / 100);
                    }, 0) * 100)}%` : 
                    `${Math.round((getEnhancedFeedTypes().find(f => f.id === localFeedType)?.digestibility || 0.75) * 100)}%`}
                </span>
              </div>
              {localSelectedFeedAdditive && localSelectedFeedAdditive !== '' && (
                <div className="flex justify-between">
                  <span>Feed additive effect:</span>
                  <span className="font-medium text-green-700">
                    {`-${getFeedAdditives().find(a => a.id === localSelectedFeedAdditive)?.reductionPercentage || 0}%`}
                  </span>
                </div>
              )}
              {/* IMPROVED: Show seasonal feed impact when applicable */}
              {selectedSeasonalPattern.seasonalVariation && (
                <div className="flex justify-between">
                  <span>Seasonal feed adjustments:</span>
                  <span className="font-medium text-green-700">
                    {`-${((1-selectedSeasonalPattern.reductionFactor)*100).toFixed(0)}%`}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-green-700">
                <span>Estimated emissions reduction from feed:</span>
                <span className="font-medium">
                  {(() => {
                    // Base feed factor
                    let baseFactor = 1.0;
                    if (useCustomFeedMixture) {
                      // Calculate weighted average
                      baseFactor = selectedFeedMixes.reduce((sum, feedId) => {
                        const feedType = getEnhancedFeedTypes().find(f => f.id === feedId);
                        const percentage = localFeedMixPercentages[feedId] || 0;
                        return sum + (feedType?.factor || 1.0) * (percentage / 100);
                      }, 0);
                    } else {
                      const selectedFeed = getEnhancedFeedTypes().find(f => f.id === localFeedType);
                      baseFactor = selectedFeed?.factor || 1.0;
                    }
                    
                    // Additive factor
                    let additiveFactor = 1.0;
                    if (localSelectedFeedAdditive && localSelectedFeedAdditive !== '') {
                      const additive = getFeedAdditives().find(a => a.id === localSelectedFeedAdditive);
                      if (additive) {
                        additiveFactor = 1.0 - (additive.reductionPercentage / 100);
                      }
                    }
                    
                    // Seasonal factor
                    let seasonalFactor = 1.0;
                    if (selectedSeasonalPattern.seasonalVariation) {
                      seasonalFactor = selectedSeasonalPattern.reductionFactor;
                    }
                    
                    // Calculate total reduction with seasonal impact
                    const totalReduction = (1.0 - (baseFactor * additiveFactor * seasonalFactor)) * 100;
                    return totalReduction > 0 ? `-${totalReduction.toFixed(1)}%` : '0%';
                  })()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
      // Complete rendering of the component
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Livestock Emissions Reduction Project</h2>
      
      {/* Basic Herd Information Section */}
      <div className="border rounded-lg overflow-hidden shadow-sm">
        <div className="bg-green-50 px-4 py-2 border-b">
          <h3 className="font-medium text-green-800">1. Herd Information</h3>
        </div>
        <div className="p-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Animal Type</label>
              <select
                value={animalType}
                onChange={handleAnimalTypeChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              >
                <option value="cattle">Cattle</option>
                <option value="buffalo">Buffalo</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Different animal species have different baseline methane emissions
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Animal Category</label>
              <div className="relative">
                <select
                  value={cattleType}
                  onChange={(e) => safelyCallHandler(onCattleTypeChange, e.target.value)}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                >
                  <optgroup label={`Standard ${animalType === 'cattle' ? 'Cattle' : 'Buffalo'} Types`}>
                    {availableTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name} ({type.baseEmissions} kg CO2e/head/year)
                      </option>
                    ))}
                  </optgroup>
                  {/* IMPROVED: Added option for custom cattle/buffalo type */}
                  <option value={`custom_${animalType}`}>
                    Custom {animalType === 'cattle' ? 'Cattle' : 'Buffalo'} Type
                  </option>
                  {customTypes?.[animalType]?.length > 0 && (
                    <optgroup label={`My Custom ${animalType === 'cattle' ? 'Cattle' : 'Buffalo'} Types`}>
                      {customTypes[animalType].map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name} ({type.baseEmissions || type.emissionsRate} kg CO2e/head/year)
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                <button
                  onClick={() => safelyCallHandler(onShowCustomTypeModal, animalType)}
                  className="absolute right-0 top-0 h-full px-2 bg-green-100 text-green-800 border-l rounded-r hover:bg-green-200"
                  title={`Add Custom ${animalType === 'cattle' ? 'Cattle' : 'Buffalo'} Type`}
                  type="button"
                >
                  +
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Different animal classes (dairy, beef, etc.) have different emission levels. Custom types allow you to enter specific emissions for your breeds.
              </p>
            </div>
            
            {useCustomRate ? (
              <div>
                <label htmlFor="customEmissionsRate" className="block text-sm font-medium mb-1 text-gray-700">
                  Custom Emissions Rate (kg CO2e/head/year)
                </label>
                <input
                  id="customEmissionsRate"
                  type="number"
                  min="0"
                  value={customSequestrationRate}
                  onChange={(e) => safelyCallHandler(onCustomSequestrationRateChange, e.target.value)}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter a specific emissions value for your herd based on your own measurements
                </p>
              </div>
            ) : (
              <div>
                <div className="flex justify-between">
                  <label className="block text-sm font-medium mb-1 text-gray-700">Base Emissions Rate</label>
                  <div className="text-sm">
                    <button
                      type="button"
                      onClick={() => safelyCallHandler(onUseCustomRateChange, true)}
                      className="text-green-600 hover:text-green-800"
                    >
                      Use custom rate
                    </button>
                  </div>
                </div>
                <div className="p-2 bg-gray-100 rounded border text-sm">
                  {selectedAnimalType ? `${selectedAnimalType.baseEmissions} kg CO2e/head/year` : 'Select an animal type'}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Standard methane emissions for this animal type, measured in CO2 equivalent
                </p>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Herd Size</label>
              <div className="p-2 bg-gray-100 rounded border text-sm">
                {herdSize.toLocaleString()} head
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Total number of animals in your herd
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Reproductive Performance Section */}
      <div className="border rounded-lg overflow-hidden shadow-sm">
        <div className="bg-purple-50 px-4 py-2 border-b">
          <h3 className="font-medium text-purple-800">2. Reproductive Performance</h3>
        </div>
        <div className="p-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
            <label htmlFor="calvingRate" className="block text-sm font-medium mb-1 text-gray-700">
                Current Calving Rate (%)
              </label>
              <input
                id="calvingRate"
                type="number"
                min="0"
                max="100"
                value={calvingRate}
                onChange={(e) => safelyCallHandler(onCalvingRateChange, e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1">
                Percentage of breeding females that produce a calf each year
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Supplementation Type</label>
              <select
                value={supplementationType}
                onChange={(e) => handleSupplementationTypeChange(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              >
                {supplementationTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name} (+{type.reproductiveEffect}% calving rate)
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Nutritional supplements that improve fertility and reproductive performance
              </p>
            </div>
            
            <div>
              <label htmlFor="timeToCalfBefore" className="block text-sm font-medium mb-1 text-gray-700">
                Time to Calf Before Supplementation (months)
              </label>
              <input
                id="timeToCalfBefore"
                type="number"
                min="0"
                max="60"
                value={timeToCalfBefore}
                onChange={(e) => safelyCallHandler(onTimeToCalfBeforeChange, e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1">
                Average time between calvings before nutritional improvements
              </p>
            </div>
            
            <div>
              <label htmlFor="timeToCalfAfter" className="block text-sm font-medium mb-1 text-gray-700">
                Time to Calf After Supplementation (months)
              </label>
              <input
                id="timeToCalfAfter"
                type="number"
                min="0"
                max="60"
                value={timeToCalfAfter}
                onChange={(e) => safelyCallHandler(onTimeToCalfAfterChange, e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1">
                Average time between calvings after nutritional improvements
              </p>
            </div>
          </div>
          
          {/* Add the summary here */}
          {/* Summary of Reproductive Impact */}
          <div className="mt-4 bg-purple-50 p-3 rounded-lg border border-purple-100">
            <h5 className="text-sm font-medium text-purple-800 mb-2">Impact on Emissions</h5>
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span>Reproductive efficiency improvement:</span>
                <span className="font-medium">
                  {reproductiveMetrics.productivityIncrease > 0 ? 
                    `+${reproductiveMetrics.productivityIncrease}%` : 
                    `${reproductiveMetrics.productivityIncrease}%`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Time saved in reproductive cycle:</span>
                <span className="font-medium">{reproductiveMetrics.timeSaved} months</span>
              </div>
              <div className="flex justify-between text-green-700">
                <span>Estimated emissions reduction from reproduction:</span>
                <span className="font-medium">
                  {(() => {
                    // FIXED: Only calculate reduction if there's actual improvement
                    const timeDifference = parseFloat(timeToCalfBefore) - parseFloat(timeToCalfAfter);
                    const calvingRateDifference = calculatedCalvingRateAfter - parseFloat(calvingRate);
                    
                    if (timeDifference > 0 || calvingRateDifference > 0) {
                      // Only calculate emissions reduction if there are improvements
                      const reductionPercentage = (((100 - parseFloat(calvingRate)) / 200) + 
                        (timeDifference / 60)) * 100;
                      
                      return reductionPercentage > 0 ? `-${reductionPercentage.toFixed(1)}%` : '0%';
                    } else {
                      // No reproductive change, no emissions impact
                      return '0%';
                    }
                  })()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Energy and Diet Section - Using the updated structure */}
      {renderFeedAndSupplementsSection()}
      {/* Emissions Factors Section - IMPROVED with better explanations */}
      <div className="border rounded-lg overflow-hidden shadow-sm">
        <div className="bg-blue-50 px-4 py-2 border-b">
          <h3 className="font-medium text-blue-800">4. Emissions Intensity Factors</h3>
          <p className="text-xs text-gray-600 mt-1">
            Emissions intensity refers to the amount of greenhouse gases produced per unit of product (meat/milk). 
            Lower emissions intensity means more efficient production with less climate impact.
          </p>
        </div>
        <div className="p-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Manure Management</label>
              <select
                value={localManureManagement}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setLocalManureManagement(newValue);
                  safelyCallHandler(onManureManagementChange, newValue);
                }}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                {getEnhancedManureSystems().map((system) => (
                  <option key={system.id} value={system.id}>
                    {system.name} (Factor: {system.factor}) 
                    {system.isMarketplaceProduct ? ' ★' : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                How you handle manure significantly impacts methane emissions. Better systems can reduce emissions by 20-55% and may provide additional benefits like biogas production or improved fertilizer.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Grazing Practice</label>
              <select
                value={localGrazingPractice}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setLocalGrazingPractice(newValue);
                  safelyCallHandler(onGrazingPracticeChange, newValue);
                }}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                {getEnhancedGrazingPractices().map((practice) => (
                  <option key={practice.id} value={practice.id}>
                    {practice.name} (Factor: {practice.factor})
                    {practice.isMarketplaceProduct ? ' ★' : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {getEnhancedGrazingPractices().find(p => p.id === localGrazingPractice)?.description || 
                 "How animals are allowed to graze on pasture affects soil health and emissions"}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Region/Climate</label>
              <select
                value={localRegionClimate}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setLocalRegionClimate(newValue);
                  safelyCallHandler(onRegionClimateChange, newValue);
                }}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                {climateRegions.map((region) => (
                  <option key={region.id} value={region.id}>{region.name} (Factor: {region.factor})</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {climateRegions.find(r => r.id === localRegionClimate)?.description || 
                 "Different climate regions affect how methane is produced and released"}
              </p>
            </div>
            
            <div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="useEmissionReductionAdditives"
                  checked={useEmissionReductionAdditives}
                  onChange={(e) => safelyCallHandler(onUseEmissionReductionAdditivesChange, e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="useEmissionReductionAdditives" className="ml-2 block text-sm text-gray-700">
                  Use emission reduction feed additives
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Special supplements that directly reduce methane production in the animal's digestive system
              </p>
              
              {useEmissionReductionAdditives && (
                <div className="mt-2">
                  <label htmlFor="additiveEfficiency" className="block text-sm font-medium mb-1 text-gray-700">
                    Additive Reduction Efficiency (%)
                  </label>
                  <input
                    id="additiveEfficiency"
                    type="number"
                    min="0"
                    max="40"
                    value={additiveEfficiency}
                    onChange={(e) => safelyCallHandler(onAdditiveEfficiencyChange, Math.min(40, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum methane reduction potential is currently capped at 40% based on available technologies.</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Add the summary here */}
          {/* Summary of Emissions Factors Impact */}
          <div className="mt-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
            <h5 className="text-sm font-medium text-blue-800 mb-2">Impact on Emissions</h5>
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span>Manure management effect:</span>
                <span className="font-medium text-green-700">
                  {(() => {
                    const system = getEnhancedManureSystems().find(s => s.id === localManureManagement);
                    const factor = system?.factor || 1.0;
                    const reduction = (1 - factor) * 100;
                    return reduction > 0 ? `-${reduction.toFixed(1)}%` : '0%';
                  })()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Grazing practice effect:</span>
                <span className="font-medium text-green-700">
                  {(() => {
                    const practice = getEnhancedGrazingPractices().find(p => p.id === localGrazingPractice);
                    const factor = practice?.factor || 1.0;
                    const reduction = (1 - factor) * 100;
                    return reduction > 0 ? `-${reduction.toFixed(1)}%` : '0%';
                  })()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Climate region effect:</span>
                <span className="font-medium">
                  {(() => {
                    const region = climateRegions.find(r => r.id === localRegionClimate);
                    const factor = region?.factor || 1.0;
                    if (factor > 1.0) {
                      return `+${((factor - 1.0) * 100).toFixed(1)}%`;
                    } else if (factor < 1.0) {
                      return `-${((1.0 - factor) * 100).toFixed(1)}%`;
                    } else {
                      return '0%';
                    }
                  })()}
                </span>
              </div>
              {useEmissionReductionAdditives && (
                <div className="flex justify-between">
                  <span>Manual emission reduction additives:</span>
                  <span className="font-medium text-green-700">
                    {`-${additiveEfficiency}%`}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-green-700">
                <span>Total emissions factor reduction:</span>
                <span className="font-medium">
                  {(() => {
                    const manureSystem = getEnhancedManureSystems().find(s => s.id === localManureManagement);
                    const manureFactor = manureSystem?.factor || 1.0;
                    
                    const grazingPractice = getEnhancedGrazingPractices().find(p => p.id === localGrazingPractice);
                    const grazingFactor = grazingPractice?.factor || 1.0;
                    
                    const region = climateRegions.find(r => r.id === localRegionClimate);
                    const climateFactor = region?.factor || 1.0;
                    
                    let additivesFactor = 1.0;
                    if (useEmissionReductionAdditives) {
                      additivesFactor = 1.0 - (additiveEfficiency / 100);
                    }
                    
                    const totalFactor = manureFactor * grazingFactor * climateFactor * additivesFactor;
                    const totalReduction = (1.0 - totalFactor) * 100;
                    
                    return totalReduction > 0 ? `-${totalReduction.toFixed(1)}%` : '0%';
                  })()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Marketplace Integration Section */}
      <div className="border rounded-lg overflow-hidden shadow-sm">
        <div className="bg-green-50 px-4 py-2 border-b">
          <h3 className="font-medium text-green-800">5. Carbon Solutions Marketplace</h3>
        </div>
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-grow">
              <h4 className="font-medium mb-2">Explore Carbon Reduction Solutions</h4>
              <p className="text-sm text-gray-600 mb-4">
                Find specialized technologies and products to help reduce emissions from your livestock operation.
              </p>
            </div>
            <div className="ml-4">
              <button
                type="button"
                onClick={() => setShowMarketplace(true)}
                className="px-4 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700 transition-colors"
              >
                Open Marketplace
              </button>
            </div>
          </div>
          
          {/* Display available technologies */}
          {renderAvailableTechnologies()}
          
          {/* Render the marketplace as a modal when showMarketplace is true */}
          {showMarketplace && (
            <MarketplaceIntegration
              projectType="livestock"
              selectedProducts={selectedProducts}
              onProductSelectionChange={onProductSelectionChange}
              onClose={() => setShowMarketplace(false)}
            />
          )}
        </div>
      </div>
      {/* Results Section - IMPROVED with more informative titles */}
      <div className="border rounded-lg overflow-hidden shadow">
        <div className="bg-gray-50 px-4 py-2 border-b">
          <h3 className="font-medium text-gray-800">6. Project Results</h3>
          <p className="text-xs text-gray-600 mt-1">
            Summary of environmental impacts, productivity improvements, and overall project performance
          </p>
        </div>
        <div className="p-4 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Emissions Metrics Card - IMPROVED with clearer explanation */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-2">Emissions Impact</h4>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span>Baseline Rate:</span>
                  <span className="font-medium">{baselineEmissionsRate.toFixed(2)} kg CO2e/head/year</span>
                </div>
                <div className="flex justify-between">
                  <span>Reduced Rate:</span>
                  <span className="font-medium">{currentEmissionsIntensity} kg CO2e/head/year</span>
                </div>
                <div className="flex justify-between text-green-700">
                  <span>Reduction:</span>
                  <span className="font-medium">{emissionsIntensityData.percentReduction.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Annual Emissions:</span>
                  <span className="font-medium">{(parseFloat(currentEmissionsIntensity) * herdSize / 1000).toFixed(2)} tonnes CO2e</span>
                </div>
                <div className="flex justify-between">
                  <span>Carbon Reduction Value:</span>
                  <span className="font-medium">
                    ${(((baselineEmissionsRate - parseFloat(currentEmissionsIntensity)) * herdSize / 1000) * 25).toFixed(2)}*
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">*Estimated at $25 per tonne CO2e market value</div>
              </div>
            </div>
            
            {/* Reproductive Metrics Card */}
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h4 className="font-medium text-purple-800 mb-2">Reproductive Performance</h4>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span>Calving Rate (Before):</span>
                  <span className="font-medium">{reproductiveMetrics.annualCalfProductionBefore}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Calving Rate (After):</span>
                  <span className="font-medium">{reproductiveMetrics.annualCalfProductionAfter}%</span>
                </div>
                <div className="flex justify-between text-purple-700">
                  <span>Improvement:</span>
                  <span className="font-medium">+{reproductiveMetrics.productivityIncrease}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Time Saved per Cycle:</span>
                  <span className="font-medium">{reproductiveMetrics.timeSaved} months</span>
                </div>
              </div>
            </div>
            
            {/* Energy Metrics Card */}
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-medium text-yellow-800 mb-2">Energy Metrics</h4>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span>Daily Energy Intake:</span>
                  <span className="font-medium">{energyMetrics.dailyEnergyIntake} MJ/day</span>
                </div>
                <div className="flex justify-between">
                  <span>Methane Conversion Factor:</span>
                  <span className="font-medium">{energyMetrics.methaneFactor}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Feed Conversion Efficiency:</span>
                  <span className="font-medium">{energyMetrics.feedConversionEfficiency} kg/kg</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Chart - Emissions Analysis */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-100 px-4 py-2 border-b">
              <h4 className="font-medium text-gray-800">Emissions Analysis</h4>
            </div>
            
            <div className="p-4">
              <LivestockEmissionsChart 
                yearlyData={yearlyEmissionsData}
                emissionsIntensity={emissionsIntensityData}
                herdSize={herdSize}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedLivestockProject;