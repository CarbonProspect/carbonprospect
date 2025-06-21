// Define project types
export const projectTypes = [
    {
      id: 'forestry',
      name: 'Forest Carbon',
      icon: '🌲',
      description: 'Afforestation, reforestation, and forest management projects'
    },
    {
      id: 'redd',
      name: 'REDD+',
      icon: '🌳',
      description: 'Reducing Emissions from Deforestation and Forest Degradation'
    },
    {
      id: 'livestock',
      name: 'Livestock Methane',
      icon: '🐄',
      description: 'Cattle methane abatement through feed additives and management'
    },
    {
      id: 'soil',
      name: 'Soil Carbon',
      icon: '🌱',
      description: 'Agricultural practices enhancing soil carbon sequestration'
    },
    {
      id: 'renewable',
      name: 'Renewable Energy',
      icon: '☀️',
      description: 'Clean energy generation displacing fossil fuel emissions'
    },
    {
      id: 'bluecarbon',
      name: 'Blue Carbon',
      icon: '🌊',
      description: 'Coastal ecosystem restoration and conservation'
    },
    {
      id: 'construction',
      name: 'Green Construction',
      icon: '🏗️',
      description: 'Building projects utilizing low-carbon materials and sustainable practices'
    }
  ];
  
  // Default sequestration rates for each project type
  export const sequestrationRates = {
    forestry: 7.5,   // tCO2e per hectare per year,
    redd: 15.2,      // tCO2e per hectare per year,
    livestock: 3.5,  // tCO2e per animal per year,
    soil: 4.2,       // tCO2e per hectare per year,
    renewable: 0.75, // tCO2e per MWh (with capacity factor),
    bluecarbon: 8.0  // tCO2e per hectare per year
  };
  
  // Define tree types
  export const treeTypes = [
    { id: 'pine', name: 'Pine', sequestrationRate: 7.5, cost: 2000, maturityYears: 25 },
    { id: 'oak', name: 'Oak', sequestrationRate: 6.8, cost: 2400, maturityYears: 40 },
    { id: 'eucalyptus', name: 'Eucalyptus', sequestrationRate: 11.2, cost: 1800, maturityYears: 15 },
    { id: 'maple', name: 'Maple', sequestrationRate: 5.9, cost: 2200, maturityYears: 30 },
    { id: 'bamboo', name: 'Bamboo', sequestrationRate: 12.5, cost: 2600, maturityYears: 7 },
    { id: 'mangrove', name: 'Mangrove', sequestrationRate: 9.8, cost: 3200, maturityYears: 20 },
    { id: 'custom', name: 'Custom...', sequestrationRate: 0, cost: 0, maturityYears: 0 }
  ];
  
  // Define cattle types
  export const cattleTypes = [
    { id: 'dairy', name: 'Dairy Cattle', emissionsRate: 3.5, reductionPotential: 0.40, cost: 35 },
    { id: 'beef', name: 'Beef Cattle', emissionsRate: 4.2, reductionPotential: 0.35, cost: 30 },
    { id: 'sheep', name: 'Sheep', emissionsRate: 0.8, reductionPotential: 0.30, cost: 18 },
    { id: 'goat', name: 'Goat', emissionsRate: 0.7, reductionPotential: 0.25, cost: 20 },
    { id: 'buffalo', name: 'Buffalo', emissionsRate: 3.8, reductionPotential: 0.32, cost: 40 },
    { id: 'custom', name: 'Custom...', emissionsRate: 0, reductionPotential: 0, cost: 0 }
  ];
  
  // Define soil types
  export const soilTypes = [
    { id: 'cropland', name: 'Cropland', sequestrationRate: 4.2, conversionCost: 700, maintenanceCost: 100 },
    { id: 'grassland', name: 'Grassland', sequestrationRate: 3.5, conversionCost: 500, maintenanceCost: 80 },
    { id: 'degraded', name: 'Degraded Land', sequestrationRate: 5.8, conversionCost: 1200, maintenanceCost: 150 },
    { id: 'peatland', name: 'Peatland', sequestrationRate: 7.6, conversionCost: 2000, maintenanceCost: 250 },
    { id: 'custom', name: 'Custom...', sequestrationRate: 0, conversionCost: 0, maintenanceCost: 0 }
  ];
  
  // Define renewable energy types
  export const renewableTypes = [
    { id: 'solar', name: 'Solar PV', capacityFactor: 0.25, initialCost: 1000000, opexCost: 25000 },
    { id: 'wind', name: 'Wind Turbines', capacityFactor: 0.35, initialCost: 1200000, opexCost: 30000 },
    { id: 'hydro', name: 'Small Hydro', capacityFactor: 0.50, initialCost: 2500000, opexCost: 20000 },
    { id: 'geothermal', name: 'Geothermal', capacityFactor: 0.80, initialCost: 4000000, opexCost: 40000 },
    { id: 'biomass', name: 'Biomass', capacityFactor: 0.65, initialCost: 3000000, opexCost: 60000 },
    { id: 'custom', name: 'Custom...', capacityFactor: 0, initialCost: 0, opexCost: 0 }
  ];
  
  // Define blue carbon types
  export const blueCarbonTypes = [
    { id: 'mangrove', name: 'Mangrove Forest', sequestrationRate: 8.0, restorationCost: 8000, maintenanceCost: 500 },
    { id: 'saltmarsh', name: 'Salt Marsh', sequestrationRate: 6.5, restorationCost: 6000, maintenanceCost: 400 },
    { id: 'seagrass', name: 'Seagrass Meadow', sequestrationRate: 5.0, restorationCost: 7000, maintenanceCost: 350 },
    { id: 'custom', name: 'Custom...', sequestrationRate: 0, restorationCost: 0, maintenanceCost: 0 }
  ];
  
  // REDD+ Forest types
  export const reddForestTypes = [
    { id: 'tropical', name: 'Tropical Rainforest', sequestrationRate: 15.2, protectionCost: 2200, maintenanceCost: 350 },
    { id: 'temperate', name: 'Temperate Forest', sequestrationRate: 9.8, protectionCost: 1800, maintenanceCost: 280 },
    { id: 'boreal', name: 'Boreal Forest', sequestrationRate: 7.4, protectionCost: 1500, maintenanceCost: 220 },
    { id: 'mangrove', name: 'Mangrove Forest', sequestrationRate: 12.5, protectionCost: 2800, maintenanceCost: 420 },
    { id: 'peatland', name: 'Peatland Forest', sequestrationRate: 16.8, protectionCost: 3200, maintenanceCost: 480 },
    { id: 'custom', name: 'Custom...', sequestrationRate: 0, protectionCost: 0, maintenanceCost: 0 }
  ];
  
  // Building types for construction projects
  export const buildingTypes = [
    { name: 'Commercial Office', baselineEmissions: 650, size: 'sqm', lifespan: 50 },
    { name: 'Residential Multi-unit', baselineEmissions: 520, size: 'sqm', lifespan: 60 },
    { name: 'Single Family Home', baselineEmissions: 400, size: 'sqm', lifespan: 75 },
    { name: 'Retail', baselineEmissions: 580, size: 'sqm', lifespan: 40 },
    { name: 'Hospital/Healthcare', baselineEmissions: 850, size: 'sqm', lifespan: 50 },
    { name: 'School/Educational', baselineEmissions: 480, size: 'sqm', lifespan: 60 },
    { name: 'Industrial', baselineEmissions: 720, size: 'sqm', lifespan: 35 }
  ];
  
  // Green building materials data
  export const greenMaterials = [
    { 
      name: 'Low-Carbon Concrete', 
      category: 'Structural', 
      baselineEmissions: 180, // kg CO2e per cubic meter,
      greenEmissions: 90, // kg CO2e per cubic meter,
      cost: 1.2, // cost multiplier compared to conventional (1.0 = same cost),
      proportion: 0.3, // Proportion of total building emissions typically from this material,
      description: 'Concrete using SCMs (supplementary cementitious materials) like fly ash or GGBS'
    },
    { 
      name: 'Green Steel', 
      category: 'Structural', 
      baselineEmissions: 2300, // kg CO2e per tonne,
      greenEmissions: 1150, // kg CO2e per tonne ,
      cost: 1.3,
      proportion: 0.2,
      description: 'Steel produced using electric arc furnaces or hydrogen-based processes'
    },
    { 
      name: 'Mass Timber', 
      category: 'Structural', 
      baselineEmissions: 350, // kg CO2e per cubic meter,
      greenEmissions: 150, // kg CO2e per cubic meter,
      cost: 1.1,
      proportion: 0.15,
      description: 'Engineered wood products like CLT (cross-laminated timber), sequestering carbon'
    },
    { 
      name: 'Recycled Insulation', 
      category: 'Envelope', 
      baselineEmissions: 45, // kg CO2e per sqm,
      greenEmissions: 12, // kg CO2e per sqm,
      cost: 0.9,
      proportion: 0.08,
      description: 'Insulation made from recycled materials like cellulose or denim'
    },
    { 
      name: 'Bio-based Finishes', 
      category: 'Finishing', 
      baselineEmissions: 25, // kg CO2e per sqm,
      greenEmissions: 8, // kg CO2e per sqm,
      cost: 1.15,
      proportion: 0.05,
      description: 'Flooring, paints, and finishes made from natural, renewable materials'
    },
    { 
      name: 'Low-Carbon Glass', 
      category: 'Envelope', 
      baselineEmissions: 60, // kg CO2e per sqm,
      greenEmissions: 40, // kg CO2e per sqm,
      cost: 1.25,
      proportion: 0.07,
      description: 'Energy-efficient glazing systems with optimized carbon footprint'
    },
    { 
      name: 'Recycled Aluminum', 
      category: 'Envelope', 
      baselineEmissions: 12000, // kg CO2e per tonne,
      greenEmissions: 2500, // kg CO2e per tonne,
      cost: 1.05,
      proportion: 0.06,
      description: 'Aluminum with high recycled content for facades and window frames'
    }
  ];
  
  // Energy efficiency measures for buildings
  export const energyMeasures = [
    { 
      name: 'Advanced Building Envelope', 
      emissionsReduction: 0.2, // 20% reduction in operational emissions
      applicability: 0.7, // Applies to 70% of building's operational energy
      cost: 1.08 // 8% cost premium
    },
    { 
      name: 'High-Efficiency HVAC', 
      emissionsReduction: 0.25,
      applicability: 0.4,
      cost: 1.1
    },
    { 
      name: 'Renewable Energy Integration', 
      emissionsReduction: 0.6,
      applicability: 0.25,
      cost: 1.15
    },
    { 
      name: 'Smart Building Systems', 
      emissionsReduction: 0.15,
      applicability: 0.6,
      cost: 1.05
    },
    { 
      name: 'Water Conservation Measures', 
      emissionsReduction: 0.08,
      applicability: 0.1,
      cost: 1.02
    }
  ];
  
  // Define waste management practices
  export const wasteManagement = [
    {
      name: 'Material Reuse Program',
      wasteReduction: 0.4, // 40% reduction in waste emissions
      cost: 1.02 // 2% cost premium
    },
    {
      name: 'Advanced Waste Sorting',
      wasteReduction: 0.3,
      cost: 1.01
    },
    {
      name: 'Comprehensive Recycling',
      wasteReduction: 0.25,
      cost: 1.005
    }
  ];
  
  // Building certification standards
  export const certifications = [
    {
      name: 'LEED Platinum',
      marketPremium: 0.1, // 10% market value premium,
      costPremium: 0.07, // 7% construction cost premium,
      emissionsReduction: 0.35, // 35% total emissions reduction,
      description: 'Leadership in Energy and Environmental Design - highest level'
    },
    {
      name: 'LEED Gold',
      marketPremium: 0.07,
      costPremium: 0.05,
      emissionsReduction: 0.25,
      description: 'Leadership in Energy and Environmental Design - Gold level'
    },
    {
      name: 'BREEAM Outstanding',
      marketPremium: 0.09,
      costPremium: 0.065,
      emissionsReduction: 0.32,
      description: 'Building Research Establishment Environmental Assessment Method - highest level'
    },
    {
      name: 'BREEAM Excellent',
      marketPremium: 0.06,
      costPremium: 0.045,
      emissionsReduction: 0.22,
      description: 'Building Research Establishment Environmental Assessment Method - Excellent level'
    },
    {
      name: 'Living Building Challenge',
      marketPremium: 0.12,
      costPremium: 0.1,
      emissionsReduction: 0.45,
      description: 'Requires net positive energy, water, and waste over 12 consecutive months'
    },
    {
      name: 'Passive House',
      marketPremium: 0.08,
      costPremium: 0.06,
      emissionsReduction: 0.3,
      description: 'Ultra-low energy building standard focused on energy efficiency'
    },
    {
      name: 'Net Zero Carbon',
      marketPremium: 0.11,
      costPremium: 0.08,
      emissionsReduction: 0.4,
      description: 'Zero net carbon emissions over the building lifecycle'
    }
  ];