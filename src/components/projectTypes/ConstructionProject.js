/*
 * Construction Project Component - Marketplace Integration Fixed
 * Carbon Credit Financial Analysis Sections Removed
 * Section 1: Imports, utilities, and initial setup
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import MarketplaceIntegration from '../marketplace/MarketplaceIntegration';
import { applyProductToProject } from '../../utils/marketplaceApi';

// Format currency utility function
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Unit conversion system
const unitConversions = {
  mass: {
    kg: {
      lbs: 2.20462,
      tonnes: 0.001
    },
    lbs: {
      kg: 0.453592,
      tonnes: 0.000453592
    },
    tonnes: {
      kg: 1000,
      lbs: 2204.62
    }
  },
  volume: {
    m3: {
      ft3: 35.3147,
      yds3: 1.30795
    },
    ft3: {
      m3: 0.0283168,
      yds3: 0.037037
    },
    yds3: {
      m3: 0.764555,
      ft3: 27
    }
  },
  area: {
    m2: {
      ft2: 10.7639,
      sqyd: 1.19599
    },
    ft2: {
      m2: 0.092903,
      sqyd: 0.111111
    },
    sqyd: {
      m2: 0.836127,
      ft2: 9
    }
  },
  length: {
    m: {
      ft: 3.28084,
      inch: 39.3701
    },
    ft: {
      m: 0.3048,
      inch: 12
    },
    inch: {
      m: 0.0254,
      ft: 0.0833333
    }
  },
  energy: {
    kWh: {
      MJ: 3.6,
      BTU: 3412.14
    },
    MJ: {
      kWh: 0.277778,
      BTU: 947.817
    },
    BTU: {
      kWh: 0.000293071,
      MJ: 0.00105506
    }
  }
};

// Define material categories with their respective unit types
const materialUnitTypes = {
  concrete: 'volume',
  cement: 'mass', 
  steel: 'mass',
  timber: 'volume',
  glass: 'mass',
  insulation: 'volume',
  aluminum: 'mass',
  brick: 'volume',
  flooring: 'area',
  roofing: 'area',
  gypsum: 'mass',
  aggregates: 'volume',
  cladding: 'area'
};

// Default units for each unit type
const defaultUnits = {
  volume: 'm3',
  mass: 'tonnes',
  area: 'm2',
  length: 'm',
  energy: 'kWh'
};

// Function to convert values between units
const convertValue = (value, fromUnit, toUnit, unitType) => {
  if (!value || !fromUnit || !toUnit || fromUnit === toUnit) {
    return value;
  }
  
  // Check if we have the unit type and units defined
  if (!unitConversions[unitType] || 
      !unitConversions[unitType][fromUnit] || 
      !unitConversions[unitType][fromUnit][toUnit]) {
    console.warn(`Conversion from ${fromUnit} to ${toUnit} not defined for ${unitType}`);
    return value;
  }
  
  // Convert value to the new unit
  return value * unitConversions[unitType][fromUnit][toUnit];
};

// Function to get available units for a specific material
const getAvailableUnitsForMaterial = (materialCategory) => {
  const unitType = materialUnitTypes[materialCategory] || 'volume';
  return unitConversions[unitType] ? Object.keys(unitConversions[unitType]) : [defaultUnits[unitType]];
};

// Function to get the unit type for a material
const getUnitTypeForMaterial = (materialCategory) => {
  return materialUnitTypes[materialCategory] || 'volume';
};

// Function to format a value with its appropriate unit
const formatValueWithUnit = (value, unit, precision = 2) => {
  if (value === undefined || value === null) return '';
  
  const formattedValue = parseFloat(value).toFixed(precision);
  return `${formattedValue} ${unit}`;
};

// Building performance benchmarks by construction year - focused on renovation relevance
const buildingPerformanceBenchmarks = {
  pre1980: {
    name: "Pre-1980s Building",
    operationalEmissions: 65,
    description: "Minimal insulation, single-pane windows, inefficient HVAC",
    embodiedCarbon: "High",
    renovationImpact: "70-85% potential operational emissions reduction"
  },
  years1980to2000: {
    name: "1980-2000 Building",
    operationalEmissions: 45,
    description: "Basic insulation, double-pane windows, standard HVAC",
    embodiedCarbon: "Medium-High",
    renovationImpact: "50-65% potential operational emissions reduction"
  },
  years2000to2010: {
    name: "2000-2010 Building",
    operationalEmissions: 35,
    description: "Improved insulation, better windows, more efficient systems",
    embodiedCarbon: "Medium",
    renovationImpact: "30-45% potential operational emissions reduction"
  },
  years2010to2020: {
    name: "2010-2020 Building",
    operationalEmissions: 25,
    description: "High-performance envelope, energy-efficient systems",
    embodiedCarbon: "Medium-Low",
    renovationImpact: "15-30% potential operational emissions reduction"
  },
  post2020: {
    name: "Post-2020 Building",
    operationalEmissions: 15,
    description: "Near-passive design, advanced glazing, high-efficiency systems",
    embodiedCarbon: "Low",
    renovationImpact: "5-15% potential operational emissions reduction"
  }
};

// Project templates for quick start
const projectTemplates = {
  commercial: {
    name: "Commercial Office",
    description: "Standard commercial office building template",
    buildingSize: 10000,
    operationalEmissions: 35,
    constructionCost: 2500,
    materialVolumes: {
      concrete: 2000,
      cement: 400,
      steel: 500,
      timber: 300,
      glass: 150,
      insulation: 400,
      aluminum: 75,
      brick: 350,
      flooring: 10000,
      roofing: 2500,
      gypsum: 200,
      aggregates: 3000,
      cladding: 2000
    },
    selectedMaterials: {
      concrete: 'concrete_standard',
      cement: 'cement_standard',
      steel: 'steel_standard',
      timber: 'timber_standard',
      glass: 'glass_standard',
      insulation: 'insulation_standard',
      aluminum: 'aluminum_standard',
      brick: 'brick_standard',
      flooring: 'flooring_vinyl',
      roofing: 'roofing_asphalt',
      gypsum: 'gypsum_standard',
      aggregates: 'aggregates_standard',
      cladding: 'cladding_aluminum'
    }
  },
  residential: {
    name: "Residential Building",
    description: "Multi-family residential building template",
    buildingSize: 5000,
    operationalEmissions: 30,
    constructionCost: 2200,
    materialVolumes: {
      concrete: 1000,
      cement: 200,
      steel: 300,
      timber: 400,
      glass: 100,
      insulation: 300,
      aluminum: 50,
      brick: 500,
      flooring: 5000,
      roofing: 1200,
      gypsum: 150,
      aggregates: 1500,
      cladding: 1000
    },
    selectedMaterials: {
      concrete: 'concrete_standard',
      cement: 'cement_standard',
      steel: 'steel_standard',
      timber: 'timber_standard',
      glass: 'glass_standard',
      insulation: 'insulation_standard',
      aluminum: 'aluminum_standard',
      brick: 'brick_standard',
      flooring: 'flooring_vinyl',
      roofing: 'roofing_asphalt',
      gypsum: 'gypsum_standard',
      aggregates: 'aggregates_standard',
      cladding: 'cladding_aluminum'
    }
  },
  warehouse: {
    name: "Industrial Warehouse",
    description: "Large industrial warehouse template",
    buildingSize: 20000,
    operationalEmissions: 25,
    constructionCost: 1800,
    materialVolumes: {
      concrete: 4000,
      cement: 800,
      steel: 1000,
      timber: 200,
      glass: 100,
      insulation: 600,
      aluminum: 100,
      brick: 200,
      flooring: 20000,
      roofing: 5000,
      gypsum: 100,
      aggregates: 6000,
      cladding: 3000
    },
    selectedMaterials: {
      concrete: 'concrete_standard',
      cement: 'cement_standard',
      steel: 'steel_standard',
      timber: 'timber_standard',
      glass: 'glass_standard',
      insulation: 'insulation_standard',
      aluminum: 'aluminum_standard',
      brick: 'brick_standard',
      flooring: 'flooring_vinyl',
      roofing: 'roofing_asphalt',
      gypsum: 'gypsum_standard',
      aggregates: 'aggregates_standard',
      cladding: 'cladding_aluminum'
    }
  }
};
// Section 2: Component Definition and State Management

const ConstructionProject = ({
  buildingSize = 10000,
  constructionCost = 2500,
  operationalEmissions = 30,
  selectedBuildingType = { name: 'Commercial Office', baselineEmissions: 40, size: 'sqm', lifespan: 50 },
  selectedMaterials = {},
  selectedEnergyMeasures = {},
  selectedWasteManagement = null,
  selectedCertification = null,
  onBuildingTypeChange = () => {},
  onBuildingSizeChange = () => {},
  onConstructionCostChange = () => {},
  onOperationalEmissionsChange = () => {},
  onMaterialSelectionChange = () => {},
  onEnergyMeasureChange = () => {},
  onWasteManagementChange = () => {},
  onCertificationChange = () => {},
  
  // Material volumes
  materialVolumes = null,
  onMaterialVolumeChange = () => {},
  
  // Additional sustainability features
  landscapingOptions = 'standard',
  onLandscapingOptionChange = () => {},
  solarCapacity = 0,
  onSolarCapacityChange = () => {},
  greenRoofArea = 0,
  onGreenRoofAreaChange = () => {},
  rainwaterHarvesting = 'none',
  onRainwaterHarvestingChange = () => {},
  usesRecycledMaterials = false,
  onUsesRecycledMaterialsChange = () => {},
  recycledContentPercentage = 30,
  onRecycledContentPercentageChange = () => {},
  
  // Project type
  projectType = 'new-construction',
  onProjectTypeChange = () => {},
  
  // Integration with products
  selectedProducts = {},
  onProductSelectionChange = () => {}
}) => {
  // ===== STATE MANAGEMENT =====
  // Force update state for refreshing components
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // Local state for project type (to fix renovation selection)
  const [localProjectType, setLocalProjectType] = useState(projectType);
  
  // Reference year for building performance
  const [referenceYear, setReferenceYear] = useState(null);
  
  // State for summary visibility
  const [showSummary, setShowSummary] = useState(true);
  
  // State for tracking user preferred units
  const [unitPreferences, setUnitPreferences] = useState({
    concrete: 'm3',
    cement: 'tonnes',
    steel: 'tonnes',
    timber: 'm3',
    glass: 'tonnes',
    insulation: 'm3',
    aluminum: 'tonnes',
    brick: 'm3',
    flooring: 'm2',
    roofing: 'm2',
    gypsum: 'tonnes',
    aggregates: 'm3',
    cladding: 'm2'
  });
  
  // State for tracking saved projects
  const [savedProjects, setSavedProjects] = useState([]);
  
  // State for managing which material category is being blended
  const [blendingCategory, setBlendingCategory] = useState(null);
  
  // Initialize material volumes if not provided
  const [defaultMaterialVolumes] = useState({
    concrete: 2000,
    cement: 400,
    steel: 500,
    timber: 300,
    glass: 150,
    insulation: 400,
    aluminum: 75,
    brick: 350,
    flooring: 10000,
    roofing: 2500,
    gypsum: 200,
    aggregates: 3000,
    cladding: 2000
  });
  
  // Track local material volumes to prevent null
  const [localMaterialVolumes, setLocalMaterialVolumes] = useState(materialVolumes || defaultMaterialVolumes);
  
  // State for showing the marketplace modal
  const [showMarketplace, setShowMarketplace] = useState(false);
  
  // State for showing templates dropdown
  const [showTemplates, setShowTemplates] = useState(false);
  
  // State for expanded/collapsed categories
  const [expandedCategories, setExpandedCategories] = useState({
    'Structural Materials': true,
    'Envelope & Finishes': true,
    'Other Materials': true
  });

  // Debug when selectedProducts prop changes
  useEffect(() => {
    console.log('▶️ ConstructionProject received selectedProducts:', selectedProducts);
    if (selectedProducts && Object.keys(selectedProducts).length > 0) {
      console.log('  - Number of products:', Object.keys(selectedProducts).length);
      console.log('  - Products:', Object.values(selectedProducts).map(p => p.name));
    }
  }, [selectedProducts]);

  // Add this useEffect to ensure updates when selectedProducts changes
  useEffect(() => {
    // Force a re-render when selectedProducts changes
    if (selectedProducts && Object.keys(selectedProducts).length > 0) {
      // This will trigger a re-render to update the dropdowns
      const materialLibrary = getMaterialLibrary();
      console.log('Material library updated with marketplace products');
      setForceUpdate(prev => prev + 1);
    }
  }, [selectedProducts]);

  // Category groups for organizing materials
  const categoryGroups = {
    'Structural Materials': ['concrete', 'cement', 'steel', 'timber', 'brick'],
    'Envelope & Finishes': ['glass', 'insulation', 'aluminum', 'flooring', 'roofing', 'gypsum', 'cladding'],
    'Other Materials': ['aggregates']
  };

  // Update local project type when prop changes
  useEffect(() => {
    setLocalProjectType(projectType);
  }, [projectType]);
  
  useEffect(() => {
    if (!materialVolumes) {
      // Initialize with defaults based on building size
      const scaleFactor = buildingSize / 10000;
      const scaled = Object.keys(defaultMaterialVolumes || {}).reduce((acc, key) => {
        acc[key] = Math.round(defaultMaterialVolumes[key] * scaleFactor);
        return acc;
      }, {});
      
      onMaterialVolumeChange('all', scaled);
      setLocalMaterialVolumes(scaled);
    } else {
      setLocalMaterialVolumes(materialVolumes);
    }
  }, [buildingSize, defaultMaterialVolumes, materialVolumes, onMaterialVolumeChange]);

  // Building types with standard emission factors
  const buildingTypes = [
    { name: 'Commercial Office', baselineEmissions: 40, size: 'sqm', lifespan: 50,
      description: 'Standard office buildings for business use',
      operationalEmissionsRange: '30-60 kg CO₂e/sqm/year' },
    { name: 'Retail Space', baselineEmissions: 45, size: 'sqm', lifespan: 40,
      description: 'Shopping centers and retail outlets',
      operationalEmissionsRange: '35-70 kg CO₂e/sqm/year' },
    { name: 'Residential Multi-Unit', baselineEmissions: 35, size: 'sqm', lifespan: 60,
      description: 'Apartment buildings and multi-family housing',
      operationalEmissionsRange: '25-50 kg CO₂e/sqm/year' },
    { name: 'Industrial Warehouse', baselineEmissions: 25, size: 'sqm', lifespan: 40,
      description: 'Warehouses and storage facilities',
      operationalEmissionsRange: '15-35 kg CO₂e/sqm/year' }
  ];

  // Base materials library - UPDATED
  const [baseMaterialLibrary] = useState({
    concrete: [
      { id: 'concrete_standard', name: 'Standard Concrete', factor: 1.0, emissionFactor: 300 },
      { id: 'concrete_lowcarbon', name: 'Low Carbon Concrete', factor: 0.7, emissionFactor: 210 },
      { id: 'concrete_ultralowcarbon', name: 'Ultra-Low Carbon Concrete', factor: 0.5, emissionFactor: 150 }
    ],
    cement: [
      { id: 'cement_standard', name: 'Standard Portland Cement', factor: 1.0, emissionFactor: 900 },
      { id: 'cement_blended', name: 'Blended Cement (SCM)', factor: 0.7, emissionFactor: 630 },
      { id: 'cement_geopolymer', name: 'Geopolymer Cement', factor: 0.4, emissionFactor: 360 }
    ],
    steel: [
      { id: 'steel_standard', name: 'Standard Steel', factor: 1.0, emissionFactor: 2000 },
      { id: 'steel_recycled', name: 'High Recycled Content Steel', factor: 0.6, emissionFactor: 1200 },
      { id: 'steel_green', name: 'Green Steel (Hydrogen Reduced)', factor: 0.3, emissionFactor: 600 }
    ],
    timber: [
      { id: 'timber_standard', name: 'Standard Timber', factor: 1.0, emissionFactor: 250 },
      { id: 'timber_fsc', name: 'FSC Certified Timber', factor: 0.8, emissionFactor: 200 },
      { id: 'timber_reclaimed', name: 'Reclaimed Timber', factor: 0.2, emissionFactor: 50 }
    ],
    glass: [
      { id: 'glass_standard', name: 'Standard Glass', factor: 1.0, emissionFactor: 800 },
      { id: 'glass_lowemissivity', name: 'Low-E Glass', factor: 0.85, emissionFactor: 680 },
      { id: 'glass_recycled', name: 'High Recycled Content Glass', factor: 0.7, emissionFactor: 560 }
    ],
    insulation: [
      { id: 'insulation_standard', name: 'Standard Insulation', factor: 1.0, emissionFactor: 100 },
      { id: 'insulation_natural', name: 'Natural Fiber Insulation', factor: 0.6, emissionFactor: 60 },
      { id: 'insulation_bio', name: 'Bio-Based Insulation', factor: 0.4, emissionFactor: 40 }
    ],
    aluminum: [
      { id: 'aluminum_standard', name: 'Standard Aluminum', factor: 1.0, emissionFactor: 8500 },
      { id: 'aluminum_recycled', name: 'Recycled Aluminum', factor: 0.3, emissionFactor: 2550 }
    ],
    brick: [
      { id: 'brick_standard', name: 'Standard Brick', factor: 1.0, emissionFactor: 220 },
      { id: 'brick_reclaimed', name: 'Reclaimed Brick', factor: 0.1, emissionFactor: 22 }
    ],
    flooring: [
      { id: 'flooring_vinyl', name: 'Vinyl Flooring', factor: 1.0, emissionFactor: 7.0 },
      { id: 'flooring_bamboo', name: 'Bamboo Flooring', factor: 0.5, emissionFactor: 3.5 },
      { id: 'flooring_reclaimed', name: 'Reclaimed Wood Flooring', factor: 0.2, emissionFactor: 1.4 }
    ],
    roofing: [
      { id: 'roofing_asphalt', name: 'Asphalt Shingles', factor: 1.0, emissionFactor: 4.5 },
      { id: 'roofing_metal', name: 'Metal Roofing', factor: 0.7, emissionFactor: 3.15 },
      { id: 'roofing_terracotta', name: 'Terracotta Tiles', factor: 0.8, emissionFactor: 3.6 }
    ],
    gypsum: [
      { id: 'gypsum_standard', name: 'Standard Gypsum Board', factor: 1.0, emissionFactor: 120 },
      { id: 'gypsum_recycled', name: 'Recycled Gypsum Board', factor: 0.7, emissionFactor: 84 }
    ],
    aggregates: [
      { id: 'aggregates_standard', name: 'Virgin Aggregates', factor: 1.0, emissionFactor: 50 },
      { id: 'aggregates_recycled', name: 'Recycled Aggregates', factor: 0.4, emissionFactor: 20 }
    ],
    cladding: [
      { id: 'cladding_aluminum', name: 'Aluminum Cladding', factor: 1.0, emissionFactor: 55 },
      { id: 'cladding_timber', name: 'Timber Cladding', factor: 0.4, emissionFactor: 22 },
      { id: 'cladding_recycled', name: 'Recycled Composite Cladding', factor: 0.6, emissionFactor: 33 }
    ]
  });

  // Material selection state - UPDATED to use advanced method
  const [selectedMaterialIds, setSelectedMaterialIds] = useState({
    concrete: 'concrete_standard',
    cement: 'cement_standard',
    steel: 'steel_standard',
    timber: 'timber_standard',
    glass: 'glass_standard',
    insulation: 'insulation_standard',
    aluminum: 'aluminum_standard',
    brick: 'brick_standard',
    flooring: 'flooring_vinyl',
    roofing: 'roofing_asphalt',
    gypsum: 'gypsum_standard',
    aggregates: 'aggregates_standard',
    cladding: 'cladding_aluminum'
  });

  // Material presets
  const materialPresets = {
    standard: {
      name: "Standard Materials",
      description: "Conventional construction materials with standard embodied carbon",
      selections: {
        concrete: 'concrete_standard',
        cement: 'cement_standard',
        steel: 'steel_standard',
        timber: 'timber_standard',
        glass: 'glass_standard',
        insulation: 'insulation_standard',
        aluminum: 'aluminum_standard',
        brick: 'brick_standard',
        flooring: 'flooring_vinyl',
        roofing: 'roofing_asphalt',
        gypsum: 'gypsum_standard',
        aggregates: 'aggregates_standard',
        cladding: 'cladding_aluminum'
      }
    },
    lowCarbon: {
      name: "Low Carbon Materials",
      description: "Materials with reduced embodied carbon (30-40% reduction)",
      selections: {
        concrete: 'concrete_lowcarbon',
        cement: 'cement_blended',
        steel: 'steel_recycled',
        timber: 'timber_fsc',
        glass: 'glass_lowemissivity',
        insulation: 'insulation_natural',
        aluminum: 'aluminum_recycled',
        brick: 'brick_standard',
        flooring: 'flooring_bamboo',
        roofing: 'roofing_metal',
        gypsum: 'gypsum_recycled',
        aggregates: 'aggregates_recycled',
        cladding: 'cladding_timber'
      }
    },
    ultraLowCarbon: {
      name: "Ultra-Low Carbon Materials",
      description: "Best available low-carbon materials (50-80% reduction)",
      selections: {
        concrete: 'concrete_ultralowcarbon',
        cement: 'cement_geopolymer',
        steel: 'steel_green',
        timber: 'timber_reclaimed',
        glass: 'glass_recycled',
        insulation: 'insulation_bio',
        aluminum: 'aluminum_recycled',
        brick: 'brick_reclaimed',
        flooring: 'flooring_reclaimed',
        roofing: 'roofing_terracotta',
        gypsum: 'gypsum_recycled',
        aggregates: 'aggregates_recycled',
        cladding: 'cladding_recycled'
      }
    }
  };
  
  // Material blending state
  const [useBlending, setUseBlending] = useState(false);
  const [materialBlends, setMaterialBlends] = useState(
    Object.keys(baseMaterialLibrary).reduce((acc, category) => {
      acc[category] = [{ materialId: `${category}_standard`, percentage: 100 }];
      return acc;
    }, {})
  );

  // Energy efficiency measures
  const [energyMeasures] = useState({
    highEfficiencyHVAC: { 
      selected: false, 
      energySaving: 15, 
      cost: 250000,
      name: 'High Efficiency HVAC',
      description: 'Modern HVAC systems with heat recovery and smart controls'
    },
    improvedInsulation: { 
      selected: false, 
      energySaving: 12, 
      cost: 180000,
      name: 'Improved Insulation',
      description: 'Enhanced thermal envelope with high-performance insulation'
    },
    solarHotWater: { 
      selected: false, 
      energySaving: 8, 
      cost: 120000,
      name: 'Solar Hot Water',
      description: 'Solar thermal collectors for domestic hot water'
    }
  });
  
  // Local state for selected energy measures
  const [localEnergyMeasures, setLocalEnergyMeasures] = useState(selectedEnergyMeasures || {});
  
  // Update local energy measures when the prop changes
  useEffect(() => {
    setLocalEnergyMeasures(selectedEnergyMeasures || {});
  }, [selectedEnergyMeasures]);

  // State for operational reduction options
  const [operationalReductionOptions] = useState({
    hvacSystems: [
      {
        id: 'heat_recovery',
        name: 'Heat Recovery Ventilation (HRV)',
        description: 'Recovers 75-85% of heat from exhaust air',
        reduction: 25, // % reduction in HVAC energy use
        cost: 15000,
        roi: 3.5 // years
      },
      {
        id: 'smart_zoning',
        name: 'Smart HVAC Zoning System',
        description: 'Independent temperature control for different zones',
        reduction: 15,
        cost: 8000,
        roi: 4.2
      }
    ],
    lighting: [
      {
        id: 'tunable_led',
        name: 'Tunable LED Fixtures',
        description: '75% reduction vs. fluorescent; customizable color temperature',
        reduction: 75,
        cost: 12000,
        roi: 2.8
      },
      {
        id: 'daylight_harvesting',
        name: 'Daylight Harvesting System',
        description: 'Auto-dims artificial lighting based on natural light',
        reduction: 45, 
        cost: 7500,
        roi: 3.2
      }
    ],
    waterSystems: [
      {
        id: 'low_flow_toilets',
        name: 'Ultra-Low Flow Toilets',
        description: '0.8 gallons per flush; saves 20,000+ gallons annually per unit',
        reduction: 50, // % reduction in water use
        cost: 5000,
        roi: 3.0
      },
      {
        id: 'graywater_recovery',
        name: 'Graywater Recovery System',
        description: 'Reuses sink/shower water for toilet flushing',
        reduction: 40,
        cost: 18000,
        roi: 5.5
      }
    ],
    buildingEnvelope: [
      {
        id: 'dynamic_glass',
        name: 'Electrochromic Windows',
        description: 'Auto-tinting based on sun position and interior temperature',
        reduction: 22, // % reduction in HVAC load
        cost: 35000,
        roi: 7.2
      },
      {
        id: 'triple_glazing',
        name: 'High-Performance Triple Glazing',
        description: 'U-values of 0.15-0.25 W/m²K; 45% less heat loss',
        reduction: 45,
        cost: 28000,
        roi: 6.5
      }
    ]
  });

  // State to track selected operational efficiency measures
  const [selectedOperationalMeasures, setSelectedOperationalMeasures] = useState({});
  
  // State for managing material type dropdown visibility
  const [showMaterialDropdown, setShowMaterialDropdown] = useState(null);
  // Section 3: Fixed Marketplace Integration Functions

  // ===== MARKETPLACE INTEGRATION HELPERS - FIXED =====
  
  const createMarketplaceMaterial = (product) => {
    console.log('🔨 createMarketplaceMaterial called with:', product);
    
    if (!product || !product.integration_details || !product.integration_details.construction) {
      console.log('⚠️ Product missing required integration details');
      return null;
    }
    
    const constructionDetails = product.integration_details.construction;
    if (!constructionDetails.materialId) {
      console.log('⚠️ No materialId found in construction details');
      return null;
    }
    
    // Original materialId from database (e.g., "concrete_standard", "steel_standard")
    const dbMaterialId = constructionDetails.materialId;
    
    // Extract category from the materialId (e.g., "concrete" from "concrete_standard")
    const category = dbMaterialId.split('_')[0];
    
    // Validate category exists in baseMaterialLibrary
    if (!baseMaterialLibrary[category]) {
      console.warn(`Category "${category}" not found in baseMaterialLibrary`);
      return null;
    }
    
    // Create company and product parts (removing spaces and special characters)
    const companyPart = (product.company_name || 'unknown').toLowerCase().replace(/[^a-z0-9]/g, '');
    const productPart = (product.name || 'unknown').toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Create a unique material ID for this marketplace product
    const uniqueMaterialId = `marketplace_${companyPart}_${productPart}_${product.id}`;
    
    console.log('Category:', category);
    console.log('Generated material ID:', uniqueMaterialId);
    
    // Get the standard material to use as base
    const standardMaterial = baseMaterialLibrary[category]?.find(m => m.id.includes('standard'));
    if (!standardMaterial) {
      console.warn(`No standard material found for category ${category}`);
      return null;
    }
    
    // Create the marketplace material with proper emissions calculation
    const material = {
      id: uniqueMaterialId,
      name: `${product.company_name} ${product.name}`,
      factor: 1 - (product.emissions_reduction_factor || 0), // This is the reduction factor
      emissionFactor: standardMaterial.emissionFactor, // Use the standard emission factor
      isMarketplaceProduct: true,
      productId: product.id,
      originalMaterialId: dbMaterialId,
      category // Store category for easier access
    };
    
    console.log('✅ Created material:', material);
    return material;
  };
  
  // Helper function to get base emission factor for a category
  const getBaseEmissionFactor = (category) => {
    const standardMaterial = baseMaterialLibrary[category]?.find(m => m.id.includes('standard'));
    return standardMaterial?.emissionFactor || 0;
  };
  
  // Get complete material library including marketplace products - FIXED
  const getMaterialLibrary = () => {
    console.log('📌 getMaterialLibrary called');
    console.log('selectedProducts:', selectedProducts);
    
    // Create a deep copy of the base library
    const library = JSON.parse(JSON.stringify(baseMaterialLibrary));
    
    // Add marketplace products
    if (selectedProducts && typeof selectedProducts === 'object' && Object.keys(selectedProducts).length > 0) {
      console.log('Processing selectedProducts:', Object.keys(selectedProducts).length);
      
      Object.values(selectedProducts).forEach(product => {
        if (!product) {
          console.warn('Null or undefined product in selectedProducts');
          return;
        }
        
        console.log('Checking product:', product.name);
        console.log('Product project_types:', product.project_types);
        
        // Check if product is for construction
        let isForConstruction = false;
        
        // The database stores project_types as JSONB array
        if (Array.isArray(product.project_types)) {
          isForConstruction = product.project_types.includes('construction');
        }
        
        console.log('Is for construction?', isForConstruction);
        
        if (isForConstruction) {
          console.log('✅ Processing construction product:', product.name);
          
          const material = createMarketplaceMaterial(product);
          
          if (material && material.category) {
            const category = material.category;
            
            if (library[category]) {
              // Check if material already exists
              const existingIndex = library[category].findIndex(m => m.id === material.id);
              
              if (existingIndex === -1) {
                // Add new material
                library[category].push(material);
                console.log(`✅ Added material "${material.name}" to category: ${category}`);
              } else {
                // Update existing material
                library[category][existingIndex] = material;
                console.log(`✅ Updated material "${material.name}" in category: ${category}`);
              }
            } else {
              console.warn(`Category "${category}" not found in material library`);
            }
          } else {
            console.warn('Failed to create material from product:', product.name);
          }
        }
      });
    } else {
      console.log('No selectedProducts to process');
    }
    
    console.log('Final library categories:', Object.keys(library));
    Object.keys(library).forEach(cat => {
      const marketplaceItems = library[cat].filter(m => m.isMarketplaceProduct);
      if (marketplaceItems.length > 0) {
        console.log(`${cat}: ${library[cat].length} materials (${marketplaceItems.length} from marketplace)`);
      }
    });
    
    return library;
  };

  // ===== HANDLERS =====
  
  // Function to apply project template
  const applyProjectTemplate = (templateKey) => {
    const template = projectTemplates[templateKey];
    if (!template) return;
    
    // Apply template values to the project
    onBuildingSizeChange(template.buildingSize);
    onOperationalEmissionsChange(template.operationalEmissions);
    onConstructionCostChange(template.constructionCost);
    onMaterialSelectionChange(template.selectedMaterials);
    onMaterialVolumeChange('all', template.materialVolumes);
  };

  // Function to export project data to CSV
  const exportToCSV = (data, filename = 'construction-project-data.csv') => {
    // Convert project data to CSV format
    const headers = ['Category', 'Value', 'Unit'];
    
    const rows = [
      ['Project Type', data.isRenovation ? 'Renovation' : 'New Construction', ''],
      ['Building Size', data.buildingSize, 'm²'],
      ['Construction Cost', data.standardConstructionCost, 'USD'],
      ['Green Building Premium', data.greenBuildingPremium, 'USD'],
      ['Baseline Embodied Carbon', data.baselineEmbodied, 'tonnes CO₂e'],
      ['Reduced Embodied Carbon', data.reducedEmbodied, 'tonnes CO₂e'],
      ['Embodied Carbon Savings', data.embodiedSavings, 'tonnes CO₂e'],
      ['Baseline Operational Carbon', data.baseOperational, 'tonnes CO₂e/year'],
      ['Reduced Operational Carbon', data.finalOperational, 'tonnes CO₂e/year'],
      ['Operational Carbon Savings', data.operationalSavings, 'tonnes CO₂e/year'],
      ['Building Lifespan', data.buildingLifespan, 'years'],
      ['Baseline Lifetime Emissions', data.baselineLifetimeEmissions, 'tonnes CO₂e'],
      ['Reduced Lifetime Emissions', data.reducedLifetimeEmissions, 'tonnes CO₂e'],
      ['Lifetime Carbon Savings', data.lifetimeSavings, 'tonnes CO₂e'],
      ['Annual Financial Savings', data.annualSavings, 'USD/year'],
      ['Simple Payback Period', data.simplePayback, 'years']
    ];
    
    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle unit change
  const handleUnitChange = (category, newUnit) => {
    const unitType = materialUnitTypes[category] || 'volume';
    const currentUnit = unitPreferences[category] || defaultUnits[unitType];
    
    if (newUnit === currentUnit) return;
    
    // Update the material volumes based on the unit change
    if (localMaterialVolumes && localMaterialVolumes[category]) {
      const convertedValue = convertValue(
        localMaterialVolumes[category],
        currentUnit,
        newUnit,
        unitType
      );
      
      // Update the material volumes with the converted value
      handleMaterialVolumeChange(category, convertedValue);
    }
    
    // Update unit preferences
    setUnitPreferences(prev => ({
      ...prev,
      [category]: newUnit
    }));
  };

  // Function to apply products to calculation - FIXED to use project_types
  const applyProductsToCalculation = (calculationResults) => {
    let updatedResults = { ...calculationResults };
    
    // Apply each product's effect
    if (selectedProducts && Object.keys(selectedProducts).length > 0) {
      Object.values(selectedProducts).forEach(product => {
        // Confirm the product applies to construction projects
        if (product && Array.isArray(product.project_types) && product.project_types.includes('construction')) {
          const reductionFactor = product.emissions_reduction_factor || 0;
          
          // Apply material-specific changes if they exist
          if (product.integration_details?.construction) {
            const details = product.integration_details.construction;
            
            if (details.materialId) {
              // Find the corresponding material and category
              let targetCategory = null;
              let standardEmissions = 0;
              
              const materialLibrary = getMaterialLibrary();
              
              // Extract category from materialId
              targetCategory = details.materialId.split('_')[0];
              
              if (targetCategory && localMaterialVolumes[targetCategory]) {
                // Calculate standard emissions for this material
                const volume = localMaterialVolumes[targetCategory] || 0;
                if (volume > 0) {
                  const standardUnit = defaultUnits[materialUnitTypes[targetCategory]];
                  const currentUnit = unitPreferences[targetCategory] || standardUnit;
                  const convertedVolume = convertValue(volume, currentUnit, standardUnit, materialUnitTypes[targetCategory]);
                  
                  // Find standard material for comparison
                  const standardMaterial = materialLibrary[targetCategory]?.find(m => m.id.includes('standard'));
                  if (standardMaterial) {
                    standardEmissions = (convertedVolume * standardMaterial.emissionFactor) / 1000;
                  }
                }
              }
              
              // Apply reduction to both baseline and reduced embodied carbon
              if (targetCategory && standardEmissions > 0) {
                const reduction = standardEmissions * reductionFactor;
                updatedResults.baselineEmbodied -= reduction;
                updatedResults.reducedEmbodied -= reduction;
                updatedResults.embodiedSavings += reduction;
              }
            } else if (details.materialAttribute) {
              // Apply general attribute-based reductions
              if (details.materialAttribute === 'recycledContent' && details.factor) {
                const reduction = updatedResults.reducedEmbodied * details.factor;
                updatedResults.baselineEmbodied -= reduction;
                updatedResults.reducedEmbodied -= reduction;
                updatedResults.embodiedSavings += reduction;
              }
            }
          }
        }
      });
      
      // Recalculate percentages
      if (updatedResults.baselineEmbodied > 0) {
        updatedResults.embodiedSavingsPercentage = (updatedResults.embodiedSavings / updatedResults.baselineEmbodied) * 100;
      }
      
      // Recalculate lifetime emissions and savings
      updatedResults.baselineLifetimeEmissions = updatedResults.baselineEmbodied + (updatedResults.baseOperational * updatedResults.buildingLifespan);
      updatedResults.reducedLifetimeEmissions = updatedResults.reducedEmbodied + (updatedResults.finalOperational * updatedResults.buildingLifespan);
      updatedResults.lifetimeSavings = updatedResults.baselineLifetimeEmissions - updatedResults.reducedLifetimeEmissions;
      
      if (updatedResults.baselineLifetimeEmissions > 0) {
        updatedResults.lifetimeSavingsPercentage = (updatedResults.lifetimeSavings / updatedResults.baselineLifetimeEmissions) * 100;
      }
    }
    
    return updatedResults;
  };

  // Section 4: Handler Functions

  // Handle material selection
  const handleMaterialSelection = (category, materialId) => {
    if (!category || !materialId) return;
    
    console.log(`Selecting material: ${materialId} for category: ${category}`);
    
    // Update local state
    setSelectedMaterialIds(prev => {
      const updated = {
        ...prev,
        [category]: materialId
      };
      console.log('Updated selectedMaterialIds:', updated);
      return updated;
    });
    
    // Update parent component
    onMaterialSelectionChange({
      ...selectedMaterials,
      [category]: materialId
    });
    
    // Check if this is a marketplace product
    const materialLibrary = getMaterialLibrary();
    const material = materialLibrary[category]?.find(m => m.id === materialId);
    
    if (material && material.isMarketplaceProduct) {
      console.log('Selected marketplace product:', material.name);
    }
    
    // Force a re-render to ensure the dropdown updates
    setForceUpdate(prev => prev + 1);
  };
  
  // Apply material preset
  const applyMaterialPreset = (presetKey) => {
    const preset = materialPresets[presetKey];
    if (!preset) return;
    
    // Update all material selections
    setSelectedMaterialIds(preset.selections);
    
    // Update parent component
    onMaterialSelectionChange(preset.selections);
  };
  
  // Handle material blend change
  const handleBlendChange = (category, newBlend) => {
    if (!category || !newBlend) return;
    
    setMaterialBlends(prev => ({
      ...prev,
      [category]: newBlend
    }));
  };
  
  // Balance blend percentages to 100%
  const balanceBlend = (category) => {
    const blends = materialBlends[category];
    if (!blends || blends.length === 0) return;
    
    const totalPercentage = blends.reduce((sum, blend) => sum + (blend.percentage || 0), 0);
    if (totalPercentage === 0) return;
    
    const balanceFactor = 100 / totalPercentage;
    const balancedBlends = blends.map(blend => ({
      ...blend,
      percentage: Math.round((blend.percentage || 0) * balanceFactor)
    }));
    
    // Fix rounding errors
    const newTotal = balancedBlends.reduce((sum, blend) => sum + (blend.percentage || 0), 0);
    if (newTotal !== 100 && balancedBlends.length > 0) {
      // Sort by percentage (descending)
      balancedBlends.sort((a, b) => (b.percentage || 0) - (a.percentage || 0));
      balancedBlends[0].percentage = (balancedBlends[0].percentage || 0) + (100 - newTotal);
    }
    
    setMaterialBlends({
      ...materialBlends,
      [category]: balancedBlends
    });
  };
  
  // Check if a blend is balanced (equals 100%)
  const isBlendBalanced = (category) => {
    const blends = materialBlends[category];
    if (!blends) return false;
    
    const totalPercentage = blends.reduce((sum, blend) => sum + (blend.percentage || 0), 0);
    return totalPercentage === 100;
  };
  
  // Calculate total for a blend
  const calculateBlendTotal = (category) => {
    const blends = materialBlends[category];
    if (!blends) return 0;
    
    return blends.reduce((sum, blend) => sum + (blend.percentage || 0), 0);
  };

  // Handle energy measure toggle
  const handleEnergyMeasureToggle = (measureId, isSelected) => {
    if (!measureId && measureId !== '') return;
    
    const updatedMeasures = {
      ...localEnergyMeasures,
      [measureId]: isSelected
    };
    
    setLocalEnergyMeasures(updatedMeasures);
    onEnergyMeasureChange(updatedMeasures);
  };
  
  // Handle building type change
  const handleBuildingTypeChange = (typeName) => {
    if (!typeName) return;
    
    const selectedType = buildingTypes.find(type => type.name === typeName) || buildingTypes[0];
    onBuildingTypeChange(selectedType);
    
    // Update operational emissions if it's still at default
    if (operationalEmissions === 30) {
      onOperationalEmissionsChange(selectedType.baselineEmissions);
    }
  };
  
  // Update material volume
  const handleMaterialVolumeChange = (category, value) => {
    if ((!category && category !== '') || (value !== 0 && !value && value !== '')) return;
    
    if (category === 'all') {
      setLocalMaterialVolumes(value);
      onMaterialVolumeChange(category, value);
    } else {
      const updatedVolumes = {
        ...localMaterialVolumes,
        [category]: value
      };
      setLocalMaterialVolumes(updatedVolumes);
      onMaterialVolumeChange(category, value);
    }
  };
  
  // Handle project type change with local state
  const handleProjectTypeChange = (type) => {
    if (!type) return;
    
    setLocalProjectType(type);
    onProjectTypeChange(type);
    
    // If changing to renovation, auto-show reference building selector
    if (type === 'renovation' && !referenceYear) {
      setReferenceYear('years2000to2010'); // Default reference for renovations
      onOperationalEmissionsChange(buildingPerformanceBenchmarks['years2000to2010'].operationalEmissions);
    }
  };
  
  // Handle reference year change
  const handleReferenceYearChange = (year) => {
    setReferenceYear(year);
    if (year && buildingPerformanceBenchmarks[year]) {
      // Set operational emissions based on reference year
      onOperationalEmissionsChange(buildingPerformanceBenchmarks[year].operationalEmissions);
    }
  };
  
  // Function to toggle between units and convert values
  const toggleUnit = (category, currentUnit) => {
    if (!category || !currentUnit) return;
    
    let newUnit;
    const unitType = materialUnitTypes[category] || 'volume';
    const availableUnits = Object.keys(unitConversions[unitType] || {});
    
    // Find the next unit in the cycle
    const currentIndex = availableUnits.indexOf(currentUnit);
    if (currentIndex === -1 || availableUnits.length <= 1) return;
    
    newUnit = availableUnits[(currentIndex + 1) % availableUnits.length];
    
    // Call the handleUnitChange function to update the unit and convert the value
    handleUnitChange(category, newUnit);
  };

  // ===== CALCULATIONS =====
  
  // Calculate total embodied emissions for materials - UPDATED to use dynamic library
  const calculateMaterialEmissions = () => {
    if (!localMaterialVolumes) {
      return { baselineTotal: 0, reducedTotal: 0 };
    }
    
    const materialLibrary = getMaterialLibrary();
    let baselineTotal = 0;
    let reducedTotal = 0;
    
    Object.keys(materialLibrary || {}).forEach(category => {
      const volume = localMaterialVolumes?.[category] || 0;
      if (volume <= 0) return;
      
      const standardMaterial = materialLibrary[category]?.find(m => m.id.includes('standard'));
      if (!standardMaterial) return;
      
      // Convert to standard unit for calculation
      const unitType = materialUnitTypes[category] || 'volume';
      const currentUnit = unitPreferences[category] || defaultUnits[unitType];
      const standardUnit = defaultUnits[unitType];
      const standardVolume = convertValue(volume, currentUnit, standardUnit, unitType);
      
      const standardEmission = (standardVolume * (standardMaterial?.emissionFactor || 0)) / 1000;
      baselineTotal += standardEmission;
      
      if (useBlending) {
        const blends = materialBlends?.[category] || [];
        const categoryEmission = blends.reduce((total, blend) => {
          const material = materialLibrary[category]?.find(m => m.id === blend.materialId);
          if (!material) return total;
          return total + (standardVolume * (blend.percentage/100) * material.emissionFactor * material.factor / 1000);
        }, 0);
        reducedTotal += categoryEmission;
      } else {
        const materialId = selectedMaterialIds?.[category];
        const material = materialLibrary[category]?.find(m => m.id === materialId);
        if (material) {
          const emission = (standardVolume * material.emissionFactor * material.factor) / 1000;
          reducedTotal += emission;
        }
      }
    });
    
    return { baselineTotal, reducedTotal };
  };
  
  // Calculate total operational emissions reductions
  const calculateOperationalReductions = () => {
    if (!buildingSize || !operationalEmissions || !operationalReductionOptions) {
      return {
        baseOperational: 0,
        reducedOperational: 0,
        totalReduction: 0,
        totalCost: 0,
        operationalSavings: 0,
        savingsPercentage: 0
      };
    }
    
    let totalReduction = 0;
    let totalCost = 0;
    
    Object.entries(operationalReductionOptions || {}).forEach(([category, options]) => {
      options.forEach(option => {
        if (selectedOperationalMeasures?.[option.id]) {
          // Weight the reductions by category
          if (category === 'hvacSystems' || category === 'buildingEnvelope') {
            totalReduction += option.reduction * 0.3; // 30% weight for HVAC or envelope
          } else if (category === 'lighting') {
            totalReduction += option.reduction * 0.2; // 20% weight for lighting
          }
          // Water systems aren't counted in energy emissions
          
          totalCost += option.cost;
        }
      });
    });
    
    // Cap at 80% reduction
    totalReduction = Math.min(totalReduction, 80);
    
    // Calculate emissions
    const baseOperational = (buildingSize * operationalEmissions) / 1000; // tonnes CO2e per year
    const reducedOperational = baseOperational * (1 - (totalReduction / 100));
    
    return {
      baseOperational,
      reducedOperational,
      totalReduction,
      totalCost,
      operationalSavings: baseOperational - reducedOperational,
      savingsPercentage: baseOperational > 0 ? (baseOperational - reducedOperational) / baseOperational * 100 : 0
    };
  };
  // Section 5: Main Calculations and UI Components

  // Calculate emissions based on current selections - UPDATED to use dynamic library
  const calculateEmissions = useCallback(() => {
    const materialLibrary = getMaterialLibrary();
    
    if (!localMaterialVolumes || !materialLibrary) {
      return {
        baselineEmbodied: 0,
        reducedEmbodied: 0,
        embodiedSavings: 0,
        embodiedSavingsPercentage: 0,
        baseOperational: 0,
        finalOperational: 0,
        operationalSavings: 0,
        operationalSavingsPercentage: 0,
        baselineLifetimeEmissions: 0,
        reducedLifetimeEmissions: 0,
        lifetimeSavings: 0,
        lifetimeSavingsPercentage: 0,
        isRenovation: localProjectType === 'renovation',
        newConstructionEmbodied: { baseline: 0, reduced: 0 },
        renovationSavings: 0,
        standardConstructionCost: 0,
        greenBuildingPremium: 0,
        annualSavings: 0,
        simplePayback: 999,
        buildingLifespan: selectedBuildingType?.lifespan || 50,
        emissionsBreakdown: [
          { name: "Embodied Carbon", value: 0 },
          { name: "Operational Carbon", value: 0 },
          { name: "Remaining Carbon", value: 0 }
        ],
        yearlyData: [],
        energyEfficiencyImprovement: 0,
        solarOffset: 0,
        energySavingsCost: 0,
        solarSavingsCost: 0
      };
    }
    
    // Calculate embodied carbon from materials
    let baselineEmbodied = 0;
    let reducedEmbodied = 0;
    
    // Calculate embodied emissions for each material category
    Object.entries(localMaterialVolumes || {}).forEach(([category, volume]) => {
      if (!volume || volume <= 0 || !materialLibrary[category]) return;
      
      // Get unit and unit type for this material
      const currentUnit = unitPreferences[category] || defaultUnits[materialUnitTypes[category]];
      const unitType = materialUnitTypes[category] || 'volume';
      
      // Convert volume to standard unit for calculation if needed
      const standardUnit = defaultUnits[unitType];
      const standardVolume = convertValue(volume, currentUnit, standardUnit, unitType);
      
      // Calculate for standard construction first
      const standardMaterial = materialLibrary[category]?.find(m => m.id.includes('standard'));
      if (!standardMaterial) return;
      
      const standardEmission = (standardVolume * (standardMaterial?.emissionFactor || 0)) / 1000;
      baselineEmbodied += standardEmission;
      
      if (useBlending) {
        // Calculate with material blending
        const blends = materialBlends?.[category] || [];
        let categoryEmission = 0;
        
        blends.forEach(blend => {
          const material = materialLibrary[category]?.find(m => m.id === blend.materialId);
          if (!material) return;
          
          const blendVolume = (standardVolume * blend.percentage) / 100;
          const emission = (blendVolume * material.emissionFactor * material.factor) / 1000;
          categoryEmission += emission;
        });
        
        reducedEmbodied += categoryEmission;
      } else {
        // Calculate with single material selection
        const materialId = selectedMaterialIds[category];
        const material = materialLibrary[category]?.find(m => m.id === materialId);
        
        if (material) {
          const emission = (standardVolume * material.emissionFactor * material.factor) / 1000;
          reducedEmbodied += emission;
        }
      }
    });

    // For renovation projects, reduce the embodied carbon
    // Store original values for comparison
    const newConstructionEmbodied = { baseline: baselineEmbodied, reduced: reducedEmbodied };
    
    if (localProjectType === 'renovation') {
      // Renovation uses ~35% of the materials of a new construction
      const renovationFactor = 0.35;
      baselineEmbodied *= renovationFactor;
      reducedEmbodied *= renovationFactor;
    }
    
    // Calculate energy efficiency savings
    let energyEfficiencyImprovement = 0;
    
    Object.entries(energyMeasures || {}).forEach(([id, measure]) => {
      if (localEnergyMeasures?.[id]) {
        energyEfficiencyImprovement += measure.energySaving || 0;
      }
    });
    
    // Calculate operational efficiency improvements
    Object.entries(operationalReductionOptions || {}).forEach(([category, options]) => {
      options.forEach(option => {
        if (selectedOperationalMeasures?.[option.id]) {
          // Apply reduction based on category
          if (category === 'hvacSystems' || category === 'buildingEnvelope') {
            // These affect HVAC load
            energyEfficiencyImprovement += option.reduction * 0.3; // 30% weight for HVAC or envelope
          } else if (category === 'lighting') {
            // Lighting typically accounts for 20% of building energy
            energyEfficiencyImprovement += option.reduction * 0.2;
          }
          // Water systems don't directly affect energy usage
        }
      });
    });
    
    // Cap energy reduction at 80%
    energyEfficiencyImprovement = Math.min(energyEfficiencyImprovement, 80);
    
    // Calculate operational carbon
    const baseOperational = (buildingSize * operationalEmissions) / 1000; // tonnes CO2e per year
    
    // Apply energy reductions
    const reducedOperational = baseOperational * (1 - (energyEfficiencyImprovement / 100));
    
    // Calculate solar offset if applicable
    const solarOffset = solarCapacity * 1.5; // tonnes CO2e per year per kW
    
    // Final operational emissions after all reductions
    const finalOperational = Math.max(0, reducedOperational - solarOffset);
    
    // Building lifespan from selected type or default
    const buildingLifespan = selectedBuildingType?.lifespan || 50;
    
    // Total lifetime emissions
    const baselineLifetimeEmissions = baselineEmbodied + (baseOperational * buildingLifespan);
    const reducedLifetimeEmissions = reducedEmbodied + (finalOperational * buildingLifespan);
    
    // Financial calculations
    const costMultiplier = localProjectType === 'renovation' ? 0.6 : 1.0; // Renovation costs ~60% of new build
    const standardConstructionCost = buildingSize * constructionCost * costMultiplier;
      
    // Green building premium (different rates for new vs renovation)
    const greenPremiumRate = localProjectType === 'renovation' ? 8 : 10;
    const greenBuildingPremium = standardConstructionCost * (greenPremiumRate / 100);
    
    // Annual operational cost savings
    const energySavingsCost = baseOperational * 1000 * 0.1 * (energyEfficiencyImprovement / 100); // $100 per tonne CO2e
    const solarSavingsCost = solarOffset * 1000 * 0.1; // $100 per tonne CO2e
    
    const annualSavings = energySavingsCost + solarSavingsCost;
    
    // Simple payback period
    const simplePayback = annualSavings > 0 ? greenBuildingPremium / annualSavings : 999;
    
    // Renovation specific savings
    const renovationSavings = localProjectType === 'renovation' 
      ? newConstructionEmbodied.reduced - reducedEmbodied
      : 0;
    
    // Chart data
    
    // Emissions breakdown for pie chart
    const emissionsBreakdown = [
      { name: "Embodied Carbon", value: baselineEmbodied - reducedEmbodied },
      { name: "Operational Carbon", value: (baseOperational - finalOperational) * buildingLifespan },
      { name: "Remaining Carbon", value: reducedLifetimeEmissions }
    ];
    
    // Year-by-year data for cash flow
    const yearlyData = [];
    
    // Initial year (construction)
    yearlyData.push({
      year: 0,
      cashFlow: -greenBuildingPremium,
      cumulativeCashFlow: -greenBuildingPremium,
      embodiedEmissions: reducedEmbodied,
      baselineEmissions: baselineEmbodied,
      operationalEmissions: 0,
      baselineOperational: 0
    });
    
    // Operational years
    let cumulativeCashFlow = -greenBuildingPremium;
    for (let year = 1; year <= buildingLifespan; year++) {
      cumulativeCashFlow += annualSavings;
      
      yearlyData.push({
        year,
        cashFlow: annualSavings,
        cumulativeCashFlow,
        embodiedEmissions: 0,
        baselineEmissions: 0,
        operationalEmissions: finalOperational,
        baselineOperational: baseOperational
      });
    }
    
    // Create the initial results
    let results = {
      // Emissions data
      baselineEmbodied,
      reducedEmbodied,
      embodiedSavings: baselineEmbodied - reducedEmbodied,
      embodiedSavingsPercentage: baselineEmbodied > 0 ? ((baselineEmbodied - reducedEmbodied) / baselineEmbodied) * 100 : 0,
      
      baseOperational,
      finalOperational,
      operationalSavings: baseOperational - finalOperational,
      operationalSavingsPercentage: baseOperational > 0 ? ((baseOperational - finalOperational) / baseOperational) * 100 : 0,
      
      baselineLifetimeEmissions,
      reducedLifetimeEmissions,
      lifetimeSavings: baselineLifetimeEmissions - reducedLifetimeEmissions,
      lifetimeSavingsPercentage: baselineLifetimeEmissions > 0 ? ((baselineLifetimeEmissions - reducedLifetimeEmissions) / baselineLifetimeEmissions) * 100 : 0,
      
      // Renovation specific data
      isRenovation: localProjectType === 'renovation',
      newConstructionEmbodied,
      renovationSavings,
      
      // Financial data
      standardConstructionCost,
      greenBuildingPremium,
      annualSavings,
      simplePayback,
      
      // Building data
      buildingLifespan,
      
      // Chart data
      emissionsBreakdown,
      yearlyData,
      
      // Detailed savings
      energyEfficiencyImprovement,
      solarOffset,
      energySavingsCost,
      solarSavingsCost
    };
    
    // Apply products to calculation results
    if (selectedProducts && Object.keys(selectedProducts).length > 0) {
      results = applyProductsToCalculation(results);
    }
    
    return results;
  }, [
    localMaterialVolumes, useBlending, materialBlends,
    selectedMaterialIds, localProjectType, energyMeasures, localEnergyMeasures,
    buildingSize, operationalEmissions, solarCapacity,
    constructionCost, selectedBuildingType, selectedOperationalMeasures, operationalReductionOptions,
    selectedProducts, unitPreferences
  ]);

  // ===== UI COMPONENTS =====
  
  // Unit Selector Component
  const UnitSelector = ({ 
    category, 
    currentUnit,
    onUnitChange,
    compact = false
  }) => {
    const unitType = materialUnitTypes[category] || 'volume';
    const availableUnits = getAvailableUnitsForMaterial(category);
    
    if (availableUnits.length <= 1) return null;
    
    return (
      <div className={`unit-selector ${compact ? 'inline-flex items-center' : 'mb-2'}`}>
        {!compact && <label className="block text-xs text-gray-500 mb-1">Unit:</label>}
        <select 
          value={currentUnit}
          onChange={(e) => onUnitChange(category, e.target.value)}
          className="border border-gray-300 rounded p-1 text-sm bg-gray-50"
        >
          {availableUnits.map(unit => (
            <option key={unit} value={unit}>{unit}</option>
          ))}
        </select>
      </div>
    );
  };
  
  // Project Toolbar Component
  const ProjectToolbar = ({ projectData }) => {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 p-3 bg-gray-50 border rounded-lg">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              // Mock save for now - in real implementation would save to backend
              alert('Project saved successfully!');
            }}
            className="px-4 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700 transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Save Project
          </button>
          <div className="relative">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="px-4 py-2 bg-gray-100 border rounded flex items-center text-gray-700 hover:bg-gray-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Templates
            </button>
            
            {showTemplates && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white border rounded shadow-lg z-10">
                <div className="p-2 border-b text-sm font-medium text-gray-700">
                  Project Templates
                </div>
                <ul className="max-h-64 overflow-auto">
                  {Object.entries(projectTemplates).map(([key, template]) => (
                    <li key={key} className="border-b last:border-b-0">
                      <button
                        onClick={() => {
                          applyProjectTemplate(key);
                          setShowTemplates(false);
                        }}
                        className="p-3 w-full text-left hover:bg-gray-50"
                      >
                        <div className="font-medium">{template.name}</div>
                        <div className="text-xs text-gray-500">{template.description}</div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        
        <div>
          <button
            onClick={() => exportToCSV(projectData)}
            className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Data (CSV)
          </button>
        </div>
      </div>
    );
  };

  // Comparison Section Component
  const ComparisonSection = ({ baselineResults, currentResults }) => {
    if (!baselineResults || !currentResults) return null;
    const embodiedSavings = baselineResults.baselineEmbodied - currentResults.reducedEmbodied;
    const embodiedSavingsPercent = (embodiedSavings / baselineResults.baselineEmbodied) * 100;

    const operationalSavings = baselineResults.baseOperational - currentResults.finalOperational;
    const operationalSavingsPercent = (operationalSavings / baselineResults.baseOperational) * 100;

    const totalSavings = baselineResults.baselineLifetimeEmissions - currentResults.reducedLifetimeEmissions;
    const totalSavingsPercent = (totalSavings / baselineResults.baselineLifetimeEmissions) * 100;

    return (
      <div className="bg-white border rounded-lg shadow-sm p-4 mb-6">
        <h3 className="text-lg font-medium mb-3">Project Comparison</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Embodied Carbon Savings</h4>
            <div className="text-xl font-medium text-green-700">{embodiedSavings.toFixed(1)} tonnes</div>
            <div className="text-sm text-green-600">{embodiedSavingsPercent.toFixed(1)}% reduction</div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Operational Carbon Savings (Annual)</h4>
            <div className="text-xl font-medium text-blue-700">{operationalSavings.toFixed(1)} tonnes/year</div>
            <div className="text-sm text-blue-600">{operationalSavingsPercent.toFixed(1)}% reduction</div>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Lifetime Carbon Savings</h4>
            <div className="text-xl font-medium text-purple-700">{totalSavings.toFixed(1)} tonnes</div>
            <div className="text-sm text-purple-600">{totalSavingsPercent.toFixed(1)}% reduction</div>
          </div>
        </div>
      </div>
    );
  };

  // Section 6: Render Functions Part 1

  // Render applied technologies/products - UPDATED
  const renderAppliedProducts = () => {
    if (!selectedProducts || Object.keys(selectedProducts).length === 0) {
      return null;
    }
    
    return (
      <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-100">
        <h3 className="text-md font-medium mb-3 text-green-700">Applied Climate Technologies</h3>
        <div className="space-y-3">
          {Object.values(selectedProducts).map(product => (
            <div key={product.id} className="bg-white p-3 rounded-lg border border-green-100 flex items-center">
              <div className="flex-shrink-0 mr-3 text-green-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-grow">
                <h4 className="text-sm font-medium">{product.name}</h4>
                <p className="text-xs text-gray-600">by {product.company_name}</p>
              </div>
              <div className="flex-shrink-0 text-green-800 text-sm font-medium">
                {Math.round((product.emissions_reduction_factor || 0) * 100)}% emissions reduction
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
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render summary dashboard
  const renderSummaryDashboard = () => {
    const results = calculateEmissions();
    if (!results) return null;
    
    return (
      <div className="mb-4 bg-white border rounded-lg shadow-sm">
        <div className="p-3 bg-gray-50 border-b rounded-t-lg flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-800">
            Project Summary Dashboard
          </h3>
          <button 
            onClick={() => setShowSummary(!showSummary)} 
            className="text-gray-500 hover:text-gray-700"
          >
            {showSummary ? 'Hide Summary' : 'Show Summary'}
          </button>
        </div>
        
        {showSummary && (
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-sm font-medium text-gray-500 mb-1">Total Carbon Saved</div>
                <div className="text-2xl font-medium text-green-700">
                  {results.lifetimeSavings.toFixed(0)} tonnes
                </div>
                <div className="text-sm text-green-600">
                  {results.lifetimeSavingsPercentage.toFixed(0)}% reduction from baseline
                </div>
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${Math.min(100, results.lifetimeSavingsPercentage)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm font-medium text-gray-500 mb-1">Financial Returns</div>
                <div className="text-2xl font-medium text-blue-700">
                  {results.simplePayback < 100 ? results.simplePayback.toFixed(1) + ' years' : 'N/A'}
                </div>
                <div className="text-sm text-blue-600">
                  Simple payback period
                </div>
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${Math.min(100, (10 / Math.max(1, results.simplePayback)) * 100)}%` }}
                  ></div>
                </div>
              </div>
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="text-sm font-medium text-gray-500 mb-1">Project Status</div>
                <div className="text-2xl font-medium text-purple-700">
                  {localProjectType === 'renovation' ? 'Renovation' : 'New Construction'}
                </div>
                <div className="text-sm text-purple-600">
                  {selectedBuildingType?.name || 'Commercial Office'} • {buildingSize.toLocaleString()} sqm
                </div>
                <div className="mt-2 flex space-x-1">
                  <div className={`h-2 rounded-full flex-1 ${Object.values(selectedMaterialIds || {}).some(id => !id.includes('standard')) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <div className={`h-2 rounded-full flex-1 ${Object.keys(localEnergyMeasures || {}).length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <div className={`h-2 rounded-full flex-1 ${Object.keys(selectedOperationalMeasures || {}).length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <div className={`h-2 rounded-full flex-1 ${solarCapacity > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                </div>
              </div>
            </div>
            
            <div className="text-sm text-right text-gray-500">
              Last updated: {new Date().toLocaleString()}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render building information section
  const renderBuildingInfo = () => (
    <div className="mb-6">
      <h3 className="text-md font-medium mb-3 text-green-700">Building Information</h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2 text-gray-700">Project Type</label>
        <div className="flex space-x-4">
          <div className="flex items-center">
            <input
              type="radio"
              id="new-construction"
              name="project-type"
              checked={localProjectType === 'new-construction'}
              onChange={() => handleProjectTypeChange('new-construction')}
              className="h-4 w-4 text-green-600 focus:ring-green-500"
            />
            <label 
              htmlFor="new-construction" 
              className="ml-2 text-sm text-gray-700 cursor-pointer"
              onClick={() => handleProjectTypeChange('new-construction')}
            >
              New Construction
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="radio"
              id="renovation"
              name="project-type"
              checked={localProjectType === 'renovation'}
              onChange={() => handleProjectTypeChange('renovation')}
              className="h-4 w-4 text-green-600 focus:ring-green-500"
            />
            <label 
              htmlFor="renovation" 
              className="ml-2 text-sm text-gray-700 cursor-pointer"
              onClick={() => handleProjectTypeChange('renovation')}
            >
              Renovation / Retrofit
            </label>
          </div>
        </div>
        
        {localProjectType === 'renovation' && (
          <div className="mt-2 p-3 bg-blue-50 rounded border border-blue-200">
            <h4 className="text-sm font-medium text-blue-700 mb-1">Renovation Benefits</h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Uses approximately 35% of the materials of new construction</li>
              <li>Reduces embodied carbon by ~65% compared to new construction</li>
              <li>Costs approximately 60% of new construction</li>
              <li>Green building premium is 8% (vs 10% for new construction)</li>
            </ul>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Building Type</label>
          <select
            value={selectedBuildingType?.name || 'Commercial Office'}
            onChange={(e) => handleBuildingTypeChange(e.target.value)}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
          >
            {buildingTypes && buildingTypes.map(type => (
              <option key={type.name} value={type.name}>{type.name}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            {selectedBuildingType?.description || ''} - Typical emissions: {selectedBuildingType?.operationalEmissionsRange || ''}
          </p>
        </div>
        {localProjectType === 'renovation' && (
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Building Age (for Renovation)</label>
            <select
              value={referenceYear || ''}
              onChange={(e) => handleReferenceYearChange(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
            >
              <option value="">Select Building Age</option>
              {buildingPerformanceBenchmarks && Object.entries(buildingPerformanceBenchmarks).map(([key, benchmark]) => (
                <option key={key} value={key}>{benchmark.name}</option>
              ))}
            </select>
            {referenceYear && buildingPerformanceBenchmarks && buildingPerformanceBenchmarks[referenceYear] && (
              <p className="mt-1 text-xs text-gray-500">
                {buildingPerformanceBenchmarks[referenceYear].description} • 
                {buildingPerformanceBenchmarks[referenceYear].renovationImpact}
              </p>
            )}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Building Size (sqm)</label>
          <input
            type="number"
            value={buildingSize}
            onChange={(e) => onBuildingSizeChange(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Construction Cost (per sqm)</label>
          <input
            type="number"
            value={constructionCost}
            onChange={(e) => onConstructionCostChange(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
          />
          {localProjectType === 'renovation' && (
            <p className="mt-1 text-xs text-green-600">
              Renovation cost estimated at 60% of new construction cost.
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 flex justify-between">
            <span>Operational Emissions (kg CO₂e/sqm/year)</span>
            {referenceYear && buildingPerformanceBenchmarks && buildingPerformanceBenchmarks[referenceYear] && (
              <span className="text-xs text-green-600">
                Using {buildingPerformanceBenchmarks[referenceYear].name} benchmark
              </span>
            )}
          </label>
          <input
            type="number"
            value={operationalEmissions}
            onChange={(e) => onOperationalEmissionsChange(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
          />
          
          <div className="mt-2 flex justify-between text-xs text-gray-500">
            <span>Low: 15 kg CO₂e/sqm/year</span>
            <span>Average: 35 kg CO₂e/sqm/year</span>
            <span>High: 65 kg CO₂e/sqm/year</span>
          </div>
          <div className="h-1 bg-gray-200 rounded-full relative mt-1">
            <div className="absolute bottom-0 left-0 h-3 w-3 bg-gray-400 rounded-full transform -translate-x-1/2 translate-y-1/2" style={{ left: '23%' }}></div>
            <div className="absolute bottom-0 left-0 h-3 w-3 bg-gray-400 rounded-full transform -translate-x-1/2 translate-y-1/2" style={{ left: '54%' }}></div>
            <div className="absolute bottom-0 left-0 h-3 w-3 bg-gray-400 rounded-full transform -translate-x-1/2 translate-y-1/2" style={{ left: '100%' }}></div>
            <div className="absolute bottom-0 left-0 h-4 w-4 bg-green-500 rounded-full transform -translate-x-1/2 translate-y-1/2 border-2 border-white" style={{ left: `${Math.min(100, Math.max(0, (operationalEmissions - 15) / (65 - 15) * 100))}%` }}></div>
          </div>
          <div className="flex justify-between text-xs mt-3">
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded">Post-2020 Standard</span>
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">2000-2010 Standard</span>
            <span className="px-2 py-1 bg-red-100 text-red-800 rounded">Pre-1980s Standard</span>
          </div>
        </div>
      </div>
    </div>
  );
  // Section 7: Render Functions Part 2 and Export

  // Render material selection section - UPDATED with marketplace integration
  const renderMaterialSelection = () => {
    // Calculate total emissions for materials
    const { baselineTotal, reducedTotal } = calculateMaterialEmissions();
    const totalSavings = baselineTotal - reducedTotal;
    const savingsPercentage = baselineTotal > 0 ? (totalSavings / baselineTotal * 100) : 0;
    
    const materialLibrary = getMaterialLibrary(); // Get complete library including marketplace products
    
    return (
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-md font-medium text-green-700">Materials Selection</h3>
          <div className="flex space-x-2">
            <div className="flex items-center mr-4">
              <input
                type="checkbox"
                id="use-blending"
                checked={useBlending}
                onChange={() => setUseBlending(!useBlending)}
                className="h-4 w-4 text-green-600 focus:ring-green-500"
              />
              <label htmlFor="use-blending" className="ml-2 text-sm text-gray-700">
                Enable Material Blending
              </label>
            </div>
            
            {/* Material Presets */}
            <div className="flex space-x-2">
              {materialPresets && Object.entries(materialPresets).map(([key, preset]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => applyMaterialPreset(key)}
                  className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded border border-blue-300 hover:bg-blue-100"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        </div>
        {/* Collapsible Material Categories */}
        <div className="space-y-4">
          {Object.entries(categoryGroups).map(([groupName, categories]) => {
            // Track if this category group is expanded
            const isExpanded = expandedCategories[groupName] !== false; // Default to expanded
            
            return (
              <div key={groupName} className="bg-white border rounded-lg overflow-hidden">
                <button 
                  className="w-full px-4 py-3 bg-gray-50 border-b flex justify-between items-center hover:bg-gray-100 transition-colors"
                  onClick={() => setExpandedCategories({...expandedCategories, [groupName]: !isExpanded})}
                >
                  <h4 className="font-medium text-gray-800">{groupName}</h4>
                  <div className="flex items-center">
                    {/* Show summary of savings if collapsed */}
                    {!isExpanded && (
                      <div className="mr-3 text-sm text-green-700">
                        {categories.some(cat => {
                          const material = materialLibrary[cat];
                          const selectedId = selectedMaterialIds[cat];
                          if (!material || !selectedId) return false;
                          const standardId = `${cat}_standard`;
                          return selectedId !== standardId;
                        }) ? (
                          <span className="px-2 py-1 bg-green-100 rounded-full">
                            Optimized materials
                          </span>
                        ) : (
                          <span className="text-gray-500">Standard materials</span>
                        )}
                      </div>
                    )}
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className={`h-5 w-5 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                {isExpanded && (
                  <div className="divide-y divide-gray-200">
                    {categories.map(category => {
                      const materials = materialLibrary[category] || [];
                      const volume = localMaterialVolumes[category] || 0;
                      const selectedMaterial = materials.find(m => m.id === selectedMaterialIds[category]) || materials[0];
                      const standardMaterial = materials.find(m => m.id.includes('standard'));
                      const currentUnit = unitPreferences[category];
                      const unitType = materialUnitTypes[category] || 'volume';
                      const availableUnits = getAvailableUnitsForMaterial(category);
                      
                      // Add emissions calculation here
                      let emissions = 0;
                      if (volume > 0) {
                        // Convert to standard unit for calculation
                        const standardUnit = defaultUnits[unitType];
                        const standardVolume = convertValue(volume, currentUnit, standardUnit, unitType);
                        
                        if (selectedMaterial) {
                          emissions = (standardVolume * selectedMaterial.emissionFactor * selectedMaterial.factor) / 1000;
                        }
                      }
                      
                      // Calculate standard emissions for comparison
                      const standardVolume = convertValue(volume, currentUnit, defaultUnits[unitType], unitType);
                      const standardEmissions = volume > 0 && standardMaterial ? 
                        (standardVolume * (standardMaterial.emissionFactor || 0)) / 1000 : 0;
                      
                      // Calculate savings
                      const savings = standardEmissions - emissions;
                      const savingsPercentage = standardEmissions > 0 ? (savings / standardEmissions) * 100 : 0;
                      
                      const isBlended = useBlending && materialBlends[category] && (
                        materialBlends[category].length > 1 || 
                        (materialBlends[category].length === 1 && materialBlends[category][0]?.percentage !== 100)
                      );
                      
                      // Determine impact indicator (only if volume > 0 and not standard)
                      let impactIndicator = null;
                      if (volume > 0 && !isBlended && selectedMaterial && standardMaterial && selectedMaterial.id !== standardMaterial.id) {
                        impactIndicator = (
                          <span className={`ml-2 text-xs font-medium ${savingsPercentage > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {savingsPercentage > 0 ? '↓' : '↑'} {Math.abs(savingsPercentage).toFixed(0)}%
                          </span>
                        );
                      }
                      
                      // Check if a product is applied to this material
                      const hasAppliedProduct = selectedProducts && Object.values(selectedProducts).some(p => 
                        p.integration_details?.construction?.materialId === selectedMaterialIds[category]);
                      
                      return (
                        <div key={category} className="p-4">
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center">
                              <span className="font-medium text-gray-800 capitalize">{category}</span>
                              {hasAppliedProduct && (
                                <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                                  Tech Applied
                                </span>
                              )}
                              {impactIndicator}
                            </div>
                            {useBlending && (
                              <button
                                type="button"
                                onClick={() => setBlendingCategory(blendingCategory === category ? null : category)}
                                className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs rounded border border-blue-300 transition-colors"
                              >
                                {blendingCategory === category ? 'Close Blender' : isBlended ? 'Edit Blend' : 'Blend Materials'}
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-12 gap-4">
                            {/* Material Selection Dropdown */}
                            <div className="col-span-4">
                              <label className="block text-sm text-gray-500 mb-1">Material Type</label>
                              <select
                                value={selectedMaterialIds[category]}
                                onChange={(e) => handleMaterialSelection(category, e.target.value)}
                                className="w-full p-2 border rounded focus:ring-1 focus:ring-green-500"
                                disabled={isBlended}
                              >
                                {materials.map(material => (
                                  <option 
                                    key={material.id} 
                                    value={material.id}
                                    className={material.isMarketplaceProduct ? 'bg-green-50 font-medium' : ''}
                                  >
                                    {material.isMarketplaceProduct ? '★ ' : ''}{material.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            
                            {/* Volume Input with Unit Selection */}
                            <div className="col-span-4">
                              <label className="block text-sm text-gray-500 mb-1">Volume/Quantity</label>
                              <div className="flex">
                                <input
                                  type="number"
                                  value={volume}
                                  onChange={(e) => handleMaterialVolumeChange(category, e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                                  className="w-full p-2 border rounded-l"
                                />
                                <select
                                  value={currentUnit}
                                  onChange={(e) => handleUnitChange(category, e.target.value)}
                                  className="border border-l-0 rounded-r bg-gray-50 px-2 py-2"
                                >
                                  {availableUnits.map(unit => (
                                    <option key={unit} value={unit}>{unit}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            
                            {/* Emissions Data */}
                            <div className="col-span-4">
                              <label className="block text-sm text-gray-500 mb-1">Emissions</label>
                              {volume > 0 ? (
                                <div className="text-sm">
                                  <div className="text-gray-900 flex items-center">
                                    {emissions.toFixed(1)} tonnes CO₂e
                                  </div>
                                  {savings > 0 && (
                                    <div className="text-green-600 text-xs">
                                      Saving {savings.toFixed(1)} tonnes ({savingsPercentage.toFixed(0)}%)
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-gray-500">Set volume</span>
                              )}
                            </div>
                          </div>
                          
                          {/* Blending Interface */}
                          {blendingCategory === category && (
                            <div className="mt-4 p-4 border rounded-lg bg-blue-50">
                              <div className="flex justify-between items-center mb-3">
                                <h5 className="font-medium capitalize">Blending {category}</h5>
                                <div className="flex items-center space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => balanceBlend(category)}
                                    className="text-blue-700 hover:text-blue-900 text-sm px-2 py-1 bg-blue-100 rounded border border-blue-300"
                                    disabled={isBlendBalanced(category)}
                                  >
                                    Balance to 100%
                                  </button>
                                  <div className="text-sm font-medium">
                                    {isBlendBalanced(category) ? (
                                      <span className="text-green-600">✓ Balanced (100%)</span>
                                    ) : (
                                      <span className="text-orange-500">⚠ Unbalanced ({calculateBlendTotal(category)}%)</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="p-3 border rounded bg-white">
                                <table className="w-full">
                                  <thead>
                                    <tr className="text-sm text-gray-600">
                                      <th className="text-left">Material</th>
                                      <th className="text-left">Emissions</th>
                                      <th className="text-right w-20">Percentage</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {materials.map(material => {
                                      // Find this material's blend setting or create default
                                      const blendItem = materialBlends[category].find(b => b.materialId === material.id) || 
                                        { materialId: material.id, percentage: 0 };
                                      
                                      return (
                                        <tr key={material.id} className="border-t border-green-100">
                                          <td className="py-2">
                                            <div className={`font-medium ${material.isMarketplaceProduct ? 'text-green-700' : ''}`}>
                                              {material.isMarketplaceProduct ? '★ ' : ''}{material.name}
                                            </div>
                                          </td>
                                          <td className="py-2 text-sm">
                                            {material.factor === 1.0 
                                              ? 'Standard' 
                                              : `${Math.round((material.factor || 0) * 100)}% of standard`}
                                          </td>
                                          <td className="py-2">
                                            <input
                                              type="number"
                                              min="0"
                                              max="100"
                                              value={blendItem.percentage || 0}
                                              onChange={(e) => {
                                                const newValue = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                                                let updatedBlends = [...materialBlends[category]];
                                                
                                                // If this material is not in the blend yet, add it
                                                if (!updatedBlends.find(b => b.materialId === material.id)) {
                                                  updatedBlends.push({ materialId: material.id, percentage: newValue });
                                                } else {
                                                  // Update existing blend
                                                  updatedBlends = updatedBlends.map(blend => {
                                                    if (blend.materialId === material.id) {
                                                      return { ...blend, percentage: newValue };
                                                    }
                                                    return blend;
                                                  });
                                                }
                                                
                                                handleBlendChange(category, updatedBlends);
                                              }}
                                              className="w-full p-1 text-right border rounded"
                                            />
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Materials Emissions Summary */}
        <div className="p-4 bg-gray-50 border rounded-lg mb-6 mt-4">
          <h4 className="font-medium mb-2 text-gray-700">Materials Emissions Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-500">Baseline Embodied Carbon</div>
              <div className="text-lg font-medium">{baselineTotal.toFixed(1)} tonnes CO₂e</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Reduced Embodied Carbon</div>
              <div className="text-lg font-medium text-green-700">{reducedTotal.toFixed(1)} tonnes CO₂e</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Total Savings</div>
              <div className="text-lg font-medium text-green-700">
                {totalSavings.toFixed(1)} tonnes CO₂e ({savingsPercentage.toFixed(0)}%)
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render marketplace integration section
  const renderMarketplaceIntegration = () => {
    return (
      <div className="mb-6 pt-4 border-t">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-md font-medium text-green-700">Carbon Solutions Marketplace</h3>
        </div>
        <div className="p-4 bg-gray-50 border rounded-lg">
          <div className="flex items-start">
            <div className="flex-grow">
              <h4 className="font-medium mb-2">Integrate Advanced Climate Technologies</h4>
              <p className="text-sm text-gray-600 mb-4">
                Explore and integrate cutting-edge low-carbon technologies into your project to further reduce your carbon footprint and improve financial returns.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <div className="flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Green Steel Technologies
                </div>
                <div className="flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Low-Carbon Concrete
                </div>
                <div className="flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Advanced Insulation
                </div>
                <div className="flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Energy Management Systems
                </div>
              </div>
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
        </div>
        
        {/* Display applied technologies/products */}
        {renderAppliedProducts()}
        
        {/* Render the marketplace as a modal when showMarketplace is true */}
        {showMarketplace && (
          <MarketplaceIntegration
            projectType="construction"
            selectedProducts={selectedProducts}
            onProductSelectionChange={onProductSelectionChange}
            onClose={() => setShowMarketplace(false)}
          />
        )}
      </div>
    );
  };

  // Render results section
  const renderResults = () => {
    const results = calculateEmissions();
    
    if (!results) {
      return (
        <div className="p-4 bg-gray-50 border rounded text-center text-gray-500">
          Please complete material selections to see results.
        </div>
      );
    }
    
    return (
      <div className="mb-6">
        <h3 className="text-md font-medium mb-3 text-green-700">Emissions & Financial Results</h3>
        
        {/* Renovation-specific summary - only shown for renovation projects */}
        {results.isRenovation && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
            <h4 className="font-medium mb-2 text-blue-800">Renovation vs. New Construction Comparison</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="text-sm font-medium text-blue-700 mb-1">Embodied Carbon</h5>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>New Construction:</span>
                    <span className="font-medium">{results.newConstructionEmbodied.reduced.toFixed(1)} tonnes CO₂e</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Renovation:</span>
                    <span className="font-medium text-green-700">{results.reducedEmbodied.toFixed(1)} tonnes CO₂e</span>
                  </div>
                  <div className="flex justify-between text-sm pt-1 border-t border-blue-200">
                    <span className="font-medium">Carbon Saved:</span>
                    <span className="font-medium text-green-700">
                      {results.renovationSavings.toFixed(1)} tonnes CO₂e 
                      ({results.newConstructionEmbodied.reduced > 0 ? 
                        ((results.renovationSavings / results.newConstructionEmbodied.reduced) * 100).toFixed(0) : 0}%)
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h5 className="text-sm font-medium text-blue-700 mb-1">Financial Impact</h5>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>New Construction Cost:</span>
                    <span className="font-medium">{formatCurrency(results.standardConstructionCost / 0.6)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Renovation Cost:</span>
                    <span className="font-medium text-green-700">{formatCurrency(results.standardConstructionCost)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-1 border-t border-blue-200">
                    <span className="font-medium">Cost Saved:</span>
                    <span className="font-medium text-green-700">
                      {formatCurrency(results.standardConstructionCost / 0.6 - results.standardConstructionCost)}
                      (40%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Standard results display with visual impact indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded">
            <h4 className="font-medium mb-3">Carbon Emissions</h4>
            
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium">Embodied Carbon</div>
                <div className="flex justify-between">
                  <span className="text-sm">Baseline:</span>
                  <span className="text-sm font-medium">{results.baselineEmbodied.toFixed(1)} tonnes CO₂e</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Reduced:</span>
                  <span className="text-sm font-medium text-green-700">{results.reducedEmbodied.toFixed(1)} tonnes CO₂e</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Savings:</span>
                  <span className="text-sm font-medium text-green-700">
                    {results.embodiedSavings.toFixed(1)} tonnes CO₂e ({results.embodiedSavingsPercentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full mt-1">
                  <div
                    className="h-2 bg-green-500 rounded-full"
                    style={{ width: `${Math.min(100, results.embodiedSavingsPercentage)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="pt-2 border-t border-green-200">
                <div className="text-sm font-medium">Operational Carbon (Annual)</div>
                <div className="flex justify-between">
                  <span className="text-sm">Baseline:</span>
                  <span className="text-sm font-medium">{results.baseOperational.toFixed(1)} tonnes CO₂e/year</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Reduced:</span>
                  <span className="text-sm font-medium text-green-700">{results.finalOperational.toFixed(1)} tonnes CO₂e/year</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Savings:</span>
                  <span className="text-sm font-medium text-green-700">
                    {results.operationalSavings.toFixed(1)} tonnes CO₂e/year ({results.operationalSavingsPercentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full mt-1">
                  <div
                    className="h-2 bg-green-500 rounded-full"
                    style={{ width: `${Math.min(100, results.operationalSavingsPercentage)}%` }}
                  ></div>
                </div>
              </div>
              <div className="pt-2 border-t border-green-200">
                <div className="text-sm font-medium">Lifetime Carbon ({results.buildingLifespan} years)</div>
                <div className="flex justify-between">
                  <span className="text-sm">Total Savings:</span>
                  <span className="text-sm font-medium text-green-700">
                    {results.lifetimeSavings.toFixed(1)} tonnes CO₂e
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full mt-1">
                  <div
                    className="h-2 bg-green-500 rounded-full"
                    style={{ width: `${Math.min(100, results.lifetimeSavingsPercentage)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded">
            <h4 className="font-medium mb-3">Financial Analysis</h4>
            
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium">Investment</div>
                <div className="flex justify-between">
                  <span className="text-sm">Standard Construction:</span>
                  <span className="text-sm font-medium">{formatCurrency(results.standardConstructionCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Green Building Premium:</span>
                  <span className="text-sm font-medium">{formatCurrency(results.greenBuildingPremium)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Premium Percentage:</span>
                  <span className="text-sm font-medium">{localProjectType === 'renovation' ? '8%' : '10%'}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-blue-200">
                <div className="text-sm font-medium">Annual Savings</div>
                <div className="flex justify-between">
                  <span className="text-sm">Energy Savings:</span>
                  <span className="text-sm font-medium">{formatCurrency(results.energySavingsCost)}/year</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Solar Generation:</span>
                  <span className="text-sm font-medium">{formatCurrency(results.solarSavingsCost)}/year</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-sm">Total Operational Savings:</span>
                  <span className="text-sm text-blue-700">{formatCurrency(results.annualSavings)}/year</span>
                </div>
              </div>
              <div className="pt-2 border-t border-blue-200">
                <div className="text-sm font-medium">Return on Investment</div>
                <div className="flex justify-between">
                  <span className="text-sm">Simple Payback Period:</span>
                  <span className="text-sm font-medium">
                    {results.simplePayback < 100 ? results.simplePayback.toFixed(1) + ' years' : 'N/A'}
                  </span>
                </div>
                {results.simplePayback < 100 && (
                  <div className="mt-1">
                    <div className="text-xs text-gray-500 mb-1">Payback timeline:</div>
                    <div className="h-2 bg-gray-200 rounded-full relative">
                      <div
                        className="h-2 bg-blue-500 rounded-full"
                        style={{ width: `${Math.min(100, (results.simplePayback / 20) * 100)}%` }}
                      ></div>
                      <div className="absolute -top-5 left-0 text-xs">0</div>
                      <div className="absolute -top-5 left-1/4 transform -translate-x-1/2 text-xs">5y</div>
                      <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-xs">10y</div>
                      <div className="absolute -top-5 left-3/4 transform -translate-x-1/2 text-xs">15y</div>
                      <div className="absolute -top-5 right-0 transform translate-x-0 text-xs">20y+</div>
                      <div 
                        className="absolute -bottom-5 h-4 w-4 transform -translate-x-1/2"
                        style={{ left: `${Math.min(100, (results.simplePayback / 20) * 100)}%` }}
                      >
                        <span className="text-xs text-blue-800 font-bold">{results.simplePayback.toFixed(1)}y</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          <h4 className="font-medium mb-3">Emissions Breakdown</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={results.emissionsBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  <Cell fill="#10B981" />
                  <Cell fill="#3B82F6" />
                  <Cell fill="#6B7280" />
                </Pie>
                <Tooltip formatter={(value) => `${value.toFixed(1)} tonnes CO₂e`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  // Main render
  return (
    <div>
      {/* Project Toolbar */}
      <ProjectToolbar projectData={calculateEmissions()} />
    
      {/* Project Comparison */}
      <ComparisonSection 
        baselineResults={{
          baselineEmbodied: calculateEmissions().baselineEmbodied,
          baseOperational: calculateEmissions().baseOperational,
          baselineLifetimeEmissions: calculateEmissions().baselineLifetimeEmissions
        }}
        currentResults={calculateEmissions()}
      />
    
      {/* Summary Dashboard */}
      {renderSummaryDashboard()}
      
      {/* Building Information */}
      {renderBuildingInfo()}
      
      {/* Materials Selection */}
      {renderMaterialSelection()}
      
      {/* Marketplace Integration */}
      {renderMarketplaceIntegration()}
      
      {/* Results */}
      {renderResults()}
      
      {/* Render "Back to Top" button that stays visible when scrolling */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="bg-green-600 text-white p-3 rounded-full shadow-lg hover:bg-green-700 transition-colors"
          aria-label="Back to top"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Export the component
export default ConstructionProject;