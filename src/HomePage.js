import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// All constants moved OUTSIDE components to prevent re-render issues

// GHG data with Global Warming Potentials (AR6 values) - Top 3 most common
const ghgGases = {
  co2: { name: 'Carbon Dioxide (CO₂)', gwp: 1, symbol: 'CO₂' },
  ch4: { name: 'Methane (CH₄)', gwp: 25, symbol: 'CH₄' },
  n2o: { name: 'Nitrous Oxide (N₂O)', gwp: 298, symbol: 'N₂O' }
};

const treeTypes = [
  { id: 'pine', name: 'Pine', sequestrationRate: 8.5 },
  { id: 'oak', name: 'Oak', sequestrationRate: 7.3 },
  { id: 'eucalyptus', name: 'Eucalyptus', sequestrationRate: 12.2 },
  { id: 'custom', name: 'Custom Tree Type', sequestrationRate: 10.0 }
];

// Project types with different calculation methods
const projectTypes = {
  forestry: { 
    id: 'forestry', 
    name: 'Afforestation/Reforestation', 
    icon: '🌳', 
    description: 'Establish forests on land that hasn\'t been forested in recent history.',
    unit: 'hectares',
    baseSequestration: 8.5 // tCO2e per hectare per year
  },
  livestock: {
    id: 'livestock',
    name: 'Livestock Methane Reduction',
    icon: '🐄',
    description: 'Reduce methane emissions from cattle through feed additives and management practices.',
    unit: 'head of cattle',
    baseSequestration: 2.3 // tCO2e reduction per head per year
  }
};

// Sample marketplace technologies that can be integrated into projects
const marketplaceTechnologies = {
  // Universal option
  none: {
    name: 'No Technology Integration',
    provider: '',
    description: 'Standard project without additional technology',
    emissionReduction: 0,
    costPerUnit: 0,
    category: '',
    applicableProjects: ['forestry', 'livestock']
  },
  
  // Forestry-specific technologies
  'soil-enhancement': {
    name: 'Carbon Sequestration Enhancer',
    provider: 'SoilTech Solutions',
    description: 'Advanced biochar and mycorrhizal inoculant system that increases soil carbon storage capacity and tree growth rates by 25%.',
    emissionReduction: 0.25, // 25% improvement in sequestration
    costPerUnit: 100, // per hectare
    category: 'Soil Enhancement',
    certification: 'USDA Organic, Carbon Trust Verified',
    applicableProjects: ['forestry']
  },
  'precision-planting': {
    name: 'Precision Planting System',
    provider: 'ForestTech Innovations',
    description: 'GPS-guided planting robots with optimized spacing algorithms that increase survival rates and carbon uptake by 35%.',
    emissionReduction: 0.35, // 35% improvement
    costPerUnit: 250, // per hectare
    category: 'Planting Technology',
    certification: 'Forest Stewardship Council Approved',
    applicableProjects: ['forestry']
  },
  
  // Livestock-specific technologies
  'seaweed-supplement': {
    name: 'Seaweed Feed Supplement',
    provider: 'OceanSolutions Inc.',
    description: 'Natural feed supplement containing Asparagopsis taxiformis seaweed that reduces enteric methane emissions from cattle by 80%.',
    emissionReduction: 0.80, // 80% reduction
    costPerUnit: 50, // per head of cattle per year
    category: 'Feed Additive',
    certification: 'Organic Certified, Animal Welfare Approved',
    applicableProjects: ['livestock']
  },
  'methane-inhibitor': {
    name: '3-NOP Feed Integration',
    provider: 'CleanCattle Technologies',
    description: 'Feed integration system for 3-Nitrooxypropanol, a methane inhibitor that blocks the enzyme responsible for methane production in the rumen.',
    emissionReduction: 0.50, // 50% reduction
    costPerUnit: 75, // per head of cattle per year
    category: 'Feed Technology',
    certification: 'EPA Approved, Climate Neutral Certified',
    applicableProjects: ['livestock']
  }
};

// Construction materials with standard and low-carbon alternatives
const constructionMaterials = {
  concrete: { 
    standard: {
      name: 'Standard Concrete', 
      factor: 0.12, 
      unit: 'cubic meters',
      description: 'Traditional Portland cement concrete'
    },
    lowCarbon: {
      name: 'Low-Carbon Concrete',
      factor: 0.08,
      unit: 'cubic meters',
      description: '30% fly ash replacement, reduces emissions by 33%',
      reduction: 0.33
    }
  },
  steel: { 
    standard: {
      name: 'Virgin Steel', 
      factor: 2.1, 
      unit: 'tonnes',
      description: 'Primary steel production'
    },
    lowCarbon: {
      name: 'Recycled Steel',
      factor: 0.85,
      unit: 'tonnes',
      description: '90% recycled content, reduces emissions by 60%',
      reduction: 0.60
    }
  },
  timber: { 
    standard: {
      name: 'Standard Timber', 
      factor: 0.45, 
      unit: 'cubic meters',
      description: 'Regular harvested timber'
    },
    lowCarbon: {
      name: 'FSC Certified Timber',
      factor: 0.31,
      unit: 'cubic meters',
      description: 'Sustainably sourced, reduces emissions by 31%',
      reduction: 0.31
    }
  }
};

const constructionProjectTypes = {
  residential: { name: 'Residential Building', multiplier: 1.0 },
  commercial: { name: 'Commercial Building', multiplier: 1.2 },
  industrial: { name: 'Industrial Facility', multiplier: 1.5 }
};

// Enhanced ConstructionCalculator component
const ConstructionCalculator = () => {
  const [materialType, setMaterialType] = useState('concrete');
  const [quantity, setQuantity] = useState(100);
  const [projectType, setProjectType] = useState('residential');
  const [useLowCarbon, setUseLowCarbon] = useState(false);
  const [results, setResults] = useState(null);
  
  // Calculate results when inputs change
  useEffect(() => {
    const material = constructionMaterials[materialType];
    const selectedMaterial = useLowCarbon ? material.lowCarbon : material.standard;
    const project = constructionProjectTypes[projectType];
    
    // Base emissions from material production
    const materialEmissions = quantity * selectedMaterial.factor;
    
    // Project type multiplier for complexity
    const totalEmissions = materialEmissions * project.multiplier;
    
    // Calculate savings if using low-carbon alternative
    const standardEmissions = quantity * material.standard.factor * project.multiplier;
    const savings = useLowCarbon ? standardEmissions - totalEmissions : 0;
    const savingsPercent = useLowCarbon ? ((savings / standardEmissions) * 100) : 0;
    
    setResults({
      materialEmissions: materialEmissions.toFixed(2),
      totalEmissions: totalEmissions.toFixed(2),
      standardEmissions: standardEmissions.toFixed(2),
      savings: savings.toFixed(2),
      savingsPercent: savingsPercent.toFixed(0)
    });
  }, [materialType, quantity, projectType, useLowCarbon]);
  
  return (
    <div className="bg-gray-50 p-4 rounded-lg shadow-inner">
      <h3 className="text-lg font-medium mb-6 text-blue-700 border-b pb-2">Construction Materials Carbon Calculator</h3>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Project Type
            </label>
            <select 
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              {Object.entries(constructionProjectTypes).map(([key, project]) => (
                <option key={key} value={key}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Material Type
            </label>
            <select 
              value={materialType}
              onChange={(e) => setMaterialType(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              {Object.entries(constructionMaterials).map(([key, material]) => (
                <option key={key} value={key}>
                  {material.standard.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Quantity ({constructionMaterials[materialType].standard.unit})
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          
          {/* Low Carbon Alternative Toggle */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={useLowCarbon}
                onChange={(e) => setUseLowCarbon(e.target.checked)}
                className="mr-3 h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <div>
                <span className="font-medium text-green-800">Use Low-Carbon Alternative</span>
                <p className="text-xs text-green-600 mt-1">
                  {constructionMaterials[materialType].lowCarbon.description}
                </p>
              </div>
            </label>
          </div>
        </div>
        
        <div>
          {results && (
            <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
              <h4 className="text-md font-medium mb-3 text-blue-700 border-b pb-2">
                Carbon Footprint Analysis
              </h4>
              
              <div className="space-y-3">
                <div className="bg-gray-50 p-3 rounded">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-500">
                      {useLowCarbon ? 'Low-Carbon Material' : 'Standard Material'} Emissions
                    </span>
                    <span className="text-sm font-bold text-gray-700">{results.totalEmissions} tCO₂e</span>
                  </div>
                </div>
                
                {useLowCarbon && (
                  <>
                    <div className="bg-red-50 p-3 rounded">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-red-600">Standard Alternative</span>
                        <span className="text-sm font-bold text-red-700 line-through">{results.standardEmissions} tCO₂e</span>
                      </div>
                    </div>
                    
                    <div className="bg-green-100 p-3 rounded border-2 border-green-300">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-green-800">Carbon Savings</span>
                        <span className="text-xl font-bold text-green-800">-{results.savings} tCO₂e</span>
                      </div>
                      <p className="text-xs text-green-600 mt-1">
                        {results.savingsPercent}% reduction with low-carbon alternative
                      </p>
                    </div>
                  </>
                )}
                
                <div className="mt-4 p-3 bg-blue-50 rounded">
                  <p className="text-xs text-blue-700">
                    <strong>Material:</strong> {useLowCarbon ? constructionMaterials[materialType].lowCarbon.name : constructionMaterials[materialType].standard.name}
                  </p>
                  <p className="text-xs text-blue-700">
                    <strong>Emission Factor:</strong> {useLowCarbon ? constructionMaterials[materialType].lowCarbon.factor : constructionMaterials[materialType].standard.factor} tCO₂e per {constructionMaterials[materialType].standard.unit}
                  </p>
                  <p className="text-xs text-blue-700">
                    <strong>Project Complexity:</strong> {constructionProjectTypes[projectType].multiplier}x multiplier
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-6 text-center">
        <Link
          to="/carbon-footprint/new"
          className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
        >
          Full Construction Assessment
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
      </div>
    </div>
  );
};
const MinimalHomePage = () => {
  // Quick carbon footprint calculator state
  const [quickCalcData, setQuickCalcData] = useState({
    electricity: '',
    gas: '',
    transportation: '',
    waste: ''
  });
  const [quickCalcResults, setQuickCalcResults] = useState(null);

  // GHG Converter state
  const [ghgFromGas, setGhgFromGas] = useState('co2');
  const [ghgToGas, setGhgToGas] = useState('ch4');
  const [ghgAmount, setGhgAmount] = useState(100);
  const [ghgResults, setGhgResults] = useState(null);

  // Demo carbon calculator state
  const [projectSize, setProjectSize] = useState(100);
  const [projectYears, setProjectYears] = useState(30);
  const [carbonPrice, setCarbonPrice] = useState(50);
  const [treeType, setTreeType] = useState('pine');
  const [projectTypeSelected, setProjectTypeSelected] = useState('forestry');
  const [totalProjectCost, setTotalProjectCost] = useState(200000);
  const [selectedTechnology, setSelectedTechnology] = useState('none');
  const [results, setResults] = useState(null);
  
  // Sample data for demo charts
  const [cashFlowData, setCashFlowData] = useState([]);

  // Quick calculator functions
  const calculateQuickFootprint = () => {
    const electricity = parseFloat(quickCalcData.electricity) || 0;
    const gas = parseFloat(quickCalcData.gas) || 0;
    const transportation = parseFloat(quickCalcData.transportation) || 0;
    const waste = parseFloat(quickCalcData.waste) || 0;
    
    // Simple emission factors (tCO2e per unit)
    const electricityFactor = 0.0005; // per kWh
    const gasFactor = 0.185; // per cubic meter
    const transportationFactor = 0.00021; // per km
    const wasteFactor = 0.467; // per ton
    
    const emissions = {
      electricity: electricity * electricityFactor * 12, // Annual
      gas: gas * gasFactor * 12,
      transportation: transportation * transportationFactor * 12,
      waste: waste * wasteFactor * 12
    };
    
    const total = Object.values(emissions).reduce((sum, val) => sum + val, 0);
    
    setQuickCalcResults({
      emissions,
      total,
      pieData: [
        { name: 'Electricity', value: emissions.electricity, color: '#3B82F6' },
        { name: 'Gas', value: emissions.gas, color: '#10B981' },
        { name: 'Transportation', value: emissions.transportation, color: '#F59E0B' },
        { name: 'Waste', value: emissions.waste, color: '#EF4444' }
      ]
    });
  };

  // GHG Converter function
  const convertGHG = () => {
    const fromGas = ghgGases[ghgFromGas];
    const toGas = ghgGases[ghgToGas];
    
    // Convert to CO2 equivalent first, then to target gas
    const co2Equivalent = ghgAmount * fromGas.gwp;
    const convertedAmount = co2Equivalent / toGas.gwp;
    
    setGhgResults({
      co2Equivalent: co2Equivalent.toFixed(2),
      convertedAmount: convertedAmount.toFixed(4),
      fromGas: fromGas,
      toGas: toGas,
      originalAmount: ghgAmount
    });
  };

  // Custom tree type state
  const [customSequestrationRate, setCustomSequestrationRate] = useState(10.0);
  const [yearsToMaturity, setYearsToMaturity] = useState(15);
  
  // Calculate demo results when inputs change
  useEffect(() => {
    const selectedProjectType = projectTypes[projectTypeSelected];
    
    // Get base sequestration rate based on project type
    let sequestrationRate;
    if (projectTypeSelected === 'forestry') {
      const treeTypeObj = treeTypes.find(tree => tree.id === treeType);
      sequestrationRate = treeType === 'custom' ? customSequestrationRate : (treeTypeObj ? treeTypeObj.sequestrationRate : 8.5);
    } else {
      sequestrationRate = selectedProjectType.baseSequestration;
    }
    
    // Apply technology enhancement if selected and applicable
    const technology = marketplaceTechnologies[selectedTechnology];
    if (technology && technology.emissionReduction > 0 && technology.applicableProjects.includes(projectTypeSelected)) {
      sequestrationRate = sequestrationRate * (1 + technology.emissionReduction);
    }
    
    const totalSequestration = projectSize * sequestrationRate * projectYears * 0.85; // 0.85 success factor
    const totalRevenue = totalSequestration * carbonPrice;
    
    // Calculate total cost including technology integration
    const baseCost = totalProjectCost === '' ? 0 : totalProjectCost;
    const technologyCost = (technology && technology.applicableProjects.includes(projectTypeSelected)) ? 
      (technology.costPerUnit * projectSize) : 0;
    const totalCost = baseCost + technologyCost;
    
    const netProfit = totalRevenue - totalCost;
    
    // Calculate ROI
    const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;
    
    // Generate yearly data for charts
    const cashFlow = [];
    
    // Distribute total cost over project years (simple linear distribution for demo)
    let cumulativeCashFlow = 0;
    let breakEvenYear = 'N/A';
    
    for (let year = 0; year <= projectYears; year++) {
      // Adjust growth curve based on years to maturity for custom trees
      const growthRate = (projectTypeSelected === 'forestry' && treeType === 'custom') ? 
        (yearsToMaturity > 0 ? 3 / yearsToMaturity : 0.1) : 0.1;
      const yearlySequestration = year === 0 ? 0 : projectSize * sequestrationRate * (1 - Math.exp(-growthRate * year)) * 0.85;
      
      const yearlyRevenue = yearlySequestration * carbonPrice;
      
      // Distribute cost more heavily in early years (50% in first year, rest distributed evenly)
      const thisYearCost = year === 0 ? totalCost * 0.5 : (totalCost * 0.5) / (projectYears);
      
      const yearlyNetCashFlow = yearlyRevenue - thisYearCost;
      cumulativeCashFlow += yearlyNetCashFlow;
      
      if (cumulativeCashFlow >= 0 && breakEvenYear === 'N/A') {
        breakEvenYear = year;
      }
      
      cashFlow.push({
        year,
        revenue: yearlyRevenue,
        cost: thisYearCost,
        netCashFlow: yearlyNetCashFlow,
        cumulativeNetCashFlow: cumulativeCashFlow
      });
    }
    
    setCashFlowData(cashFlow);
    
    setResults({
      totalSequestration: Math.round(totalSequestration),
      totalRevenue: Math.round(totalRevenue),
      totalCost: Math.round(totalCost),
      technologyCost: Math.round(technologyCost),
      baseCost: Math.round(baseCost),
      netProfit: Math.round(netProfit),
      roi: roi.toFixed(1),
      breakEvenYear,
      enhancedSequestration: technology && technology.emissionReduction > 0 && technology.applicableProjects.includes(projectTypeSelected),
      sequestrationBoost: (technology && technology.applicableProjects.includes(projectTypeSelected)) ? 
        (technology.emissionReduction * 100).toFixed(0) : 0
    });
  }, [projectSize, projectYears, carbonPrice, treeType, projectTypeSelected, totalProjectCost, customSequestrationRate, yearsToMaturity, selectedTechnology]); // Removed constants from dependencies
  return (
    <div className="bg-white">
      {/* 1. Hero section with Quick Carbon Calculator */}
      <header className="relative bg-gradient-to-br from-green-800 via-green-600 to-emerald-700 py-20">
        <div className="absolute inset-0 bg-opacity-20 overflow-hidden pointer-events-none">
          <svg className="absolute left-0 top-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="hero-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M0 40L40 0M20 40L40 20M0 20L20 0" stroke="white" strokeWidth="0.5" strokeOpacity="0.1" fill="none"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-pattern)" />
          </svg>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center p-1 bg-green-200 bg-opacity-20 rounded-full mb-4 animate-pulse">
              <span className="px-3 py-0.5 text-sm font-semibold text-white bg-green-500 rounded-full">
                🌱 Free Carbon Management Tools
              </span>
            </div>
            <h1 className="text-4xl font-extrabold text-white sm:text-5xl sm:tracking-tight lg:text-6xl drop-shadow-lg">
              Carbon Footprint Calculator & ESG Compliance Platform
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-green-100 leading-relaxed">
              Calculate carbon emissions, generate TCFD and CSRD reports, assess carbon offset projects, and plan your net-zero strategy - all in one comprehensive platform
            </p>
          </div>

          {/* Quick Carbon Footprint Calculator */}
          <section className="max-w-4xl mx-auto" aria-labelledby="calculator-heading">
            <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-xl shadow-2xl p-8 border border-white border-opacity-20">
              <h2 id="calculator-heading" className="text-2xl font-bold text-gray-900 mb-6 text-center flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Carbon Footprint Calculator - Scope 1, 2 & 3 Emissions
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-600 mb-4">Calculate your annual carbon footprint using industry-standard emission factors. Our free calculator covers electricity, natural gas, transportation, and waste emissions in line with GHG Protocol standards.</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Electricity Usage (kWh/month)
                      </label>
                      <input
                        type="number"
                        value={quickCalcData.electricity}
                        onChange={(e) => setQuickCalcData({...quickCalcData, electricity: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="e.g., 350"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gas Usage (cubic meters/month)
                      </label>
                      <input
                        type="number"
                        value={quickCalcData.gas}
                        onChange={(e) => setQuickCalcData({...quickCalcData, gas: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="e.g., 50"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Transportation (km/month)
                      </label>
                      <input
                        type="number"
                        value={quickCalcData.transportation}
                        onChange={(e) => setQuickCalcData({...quickCalcData, transportation: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="e.g., 1000"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Waste Generated (tons/month)
                      </label>
                      <input
                        type="number"
                        value={quickCalcData.waste}
                        onChange={(e) => setQuickCalcData({...quickCalcData, waste: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="e.g., 0.5"
                      />
                    </div>
                  </div>
                  
                  <button
                    onClick={calculateQuickFootprint}
                    className="w-full mt-6 px-6 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors"
                  >
                    Calculate My Footprint
                  </button>
                </div>
                
                <div>
                  {quickCalcResults ? (
                    <div>
                      <div className="bg-green-50 rounded-lg p-4 mb-4">
                        <h3 className="text-lg font-semibold text-green-800 mb-2">Your Annual Carbon Footprint</h3>
                        <p className="text-3xl font-bold text-green-900">{quickCalcResults.total.toFixed(2)} tCO₂e</p>
                        <p className="text-sm text-green-600 mt-1">tonnes of CO₂ equivalent per year</p>
                      </div>
                      
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={quickCalcResults.pieData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={70}
                              label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                              {quickCalcResults.pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      
                      <div className="mt-4 flex gap-4">
                        <Link 
                          to="/carbon-footprint/new"
                          className="flex-1 text-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Full Assessment
                        </Link>
                        <Link 
                          to="/dashboard"
                          className="flex-1 text-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                        >
                          View Dashboard
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <p>Enter your usage data to see your carbon footprint breakdown</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </header>

      {/* 2. Generate Report Section with Compliance Report Preview */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50" aria-labelledby="generate-report">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 id="generate-report" className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
              Professional ESG & Compliance Reports
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Generate audit-ready reports aligned with TCFD, CSRD, SEC Climate Rules, and other frameworks. Future-proof your compliance and provide certainty to stakeholders.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Report Preview */}
            <div className="relative">
              <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200 transform rotate-1 hover:rotate-0 transition-transform duration-300">
                <div className="bg-green-600 px-6 py-4 text-white">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold">GREENHOUSE GAS EMISSIONS REPORT</h3>
                    <div className="text-sm opacity-90">Carbon Prospect</div>
                  </div>
                  <div className="text-sm mt-2 opacity-75">
                    Report ID: REP-31-20250622 | Reporting Period: 2024 | Generated: June 22, 2025
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="mb-6">
                    <h4 className="text-lg font-bold text-blue-600 mb-3">EXECUTIVE SUMMARY</h4>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-700 mb-3">
                        This greenhouse gas emissions report has been prepared in accordance with the requirements of the GHG Protocol Corporate Standard, ISO 14064-1, and applicable regulatory requirements.
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>Total Emissions:</strong> 156,438.96 tonnes CO₂e
                        </div>
                        <div>
                          <strong>Reduction Target:</strong> 20% by 2030
                        </div>
                        <div>
                          <strong>Reporting Standards:</strong> NGER Act, Climate Active, TCFD
                        </div>
                        <div>
                          <strong>Status:</strong> ✓ Compliant
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-lg font-bold text-green-600 mb-3">3. EMISSIONS SUMMARY</h4>
                    <div className="overflow-hidden rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-green-600 text-white">
                          <tr>
                            <th className="px-3 py-2 text-left">Emission Scope</th>
                            <th className="px-3 py-2 text-right">Emissions (tCO₂e)</th>
                            <th className="px-3 py-2 text-right">% of Total</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white">
                          <tr className="border-b">
                            <td className="px-3 py-2">Scope 1 - Direct Emissions</td>
                            <td className="px-3 py-2 text-right font-medium">156,438.96</td>
                            <td className="px-3 py-2 text-right">100.0%</td>
                          </tr>
                          <tr className="border-b">
                            <td className="px-3 py-2">Scope 2 - Indirect Emissions</td>
                            <td className="px-3 py-2 text-right">0.00</td>
                            <td className="px-3 py-2 text-right">0.0%</td>
                          </tr>
                          <tr className="bg-green-50 font-bold">
                            <td className="px-3 py-2">TOTAL EMISSIONS</td>
                            <td className="px-3 py-2 text-right">156,438.96</td>
                            <td className="px-3 py-2 text-right">100.0%</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      ✓ Audit-Ready Report | TCFD Compliant | Export Ready
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                PDF Export
              </div>
              <div className="absolute -bottom-4 -left-4 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                Excel Ready
              </div>
            </div>

            {/* Benefits & CTA */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Why Generate Professional Reports?</h3>
              
              <div className="space-y-6 mb-8">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="bg-blue-100 rounded-full p-2">
                      <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-semibold text-gray-900">Future-Proof Compliance</h4>
                    <p className="text-gray-600">Stay ahead of evolving regulations with reports that meet current and upcoming requirements across all major jurisdictions.</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="bg-green-100 rounded-full p-2">
                      <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-semibold text-gray-900">Supply Chain Confidence</h4>
                    <p className="text-gray-600">Provide verified emissions data to customers, partners, and investors, strengthening your position in carbon-conscious value chains.</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="bg-purple-100 rounded-full p-2">
                      <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-semibold text-gray-900">Reduction Strategy Insights</h4>
                    <p className="text-gray-600">Identify your biggest emission sources and get tailored recommendations for cost-effective reduction strategies and ROI projections.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Link
                  to="/carbon-footprint/new"
                  className="block w-full text-center px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Generate Your Report Now
                </Link>
                <p className="text-sm text-gray-500 text-center">
                  No credit card required • Audit-ready format • Export to PDF/Excel
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Quick Actions Section */}
      <section className="py-16 bg-gray-50" aria-labelledby="quick-actions-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 id="quick-actions-heading" className="text-3xl font-bold text-gray-900">Get Started with Carbon Management</h2>
            <p className="mt-4 text-xl text-gray-600">Choose your path to carbon neutrality</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <article className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-shadow">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Measure Emissions</h3>
                <p className="text-gray-600 mb-4">Calculate your organization's complete carbon footprint with our comprehensive assessment tool</p>
                <Link 
                  to="/carbon-footprint/new"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Start Assessment
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            </article>
            
            <article className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-shadow">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Generate Reports</h3>
                <p className="text-gray-600 mb-4">Create compliance reports for TCFD, CSRD, and other frameworks automatically</p>
                <Link 
                  to="/dashboard"
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  View Reports
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            </article>
            
            <article className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-shadow">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Plan Projects</h3>
                <p className="text-gray-600 mb-4">Assess carbon reduction project feasibility with financial modeling tools</p>
                <Link 
                  to="/carbon-project/new"
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                  Create Project
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* 7. Platform Benefits Section */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden" aria-labelledby="platform-benefits">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <svg className="absolute left-0 top-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="benefits-pattern" width="60" height="60" patternUnits="userSpaceOnUse">
                <circle cx="30" cy="30" r="2" fill="currentColor" className="text-green-600"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#benefits-pattern)" />
          </svg>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 id="platform-benefits" className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
              Complete ESG & Carbon Management Solution
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              From carbon accounting to sustainability reporting - comprehensive tools for TCFD, CSRD, SEC Climate Rules, and voluntary carbon market participation.
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid lg:grid-cols-2 gap-12 mb-20">
            {/* Small to Large Businesses */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-green-500 transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="bg-green-100 rounded-full p-3 mr-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">For All Businesses</h3>
              </div>
              <ul className="space-y-4 mb-6">
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-700"><strong>Free Carbon Calculators:</strong> Measure Scope 1, 2, and 3 emissions with industry-standard methodologies</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-700"><strong>Automated Compliance Reporting:</strong> Generate reports for TCFD, CSRD, SEC Climate Rules, and voluntary frameworks</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-700"><strong>Solution Marketplace:</strong> Connect with verified carbon reduction technology providers and consultants</span>
                </li>
              </ul>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-800 font-medium">From startups to Fortune 500 companies - scalable tools for every business size</p>
              </div>
            </div>

            {/* Project Developers */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-blue-500 transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="bg-blue-100 rounded-full p-3 mr-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">For Project Developers</h3>
              </div>
              <ul className="space-y-4 mb-6">
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-blue-500 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-700"><strong>Carbon Credit Development:</strong> Financial modeling tools for reforestation, renewable energy, and carbon capture projects</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-blue-500 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-700"><strong>Methodology Compliance:</strong> Built-in support for VCS, CDM, Gold Standard, and Article 6 requirements</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-blue-500 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-700"><strong>Investor Connection:</strong> Connect with verified carbon credit buyers and project funding sources</span>
                </li>
              </ul>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-800 font-medium">From community-scale to industrial carbon reduction projects</p>
              </div>
            </div>
          </div>

          {/* Global Compliance & Regulation Banner */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-8 text-white mb-16">
            <h3 className="text-2xl font-bold mb-4 text-center">Stay Compliant Across All Major Jurisdictions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-lg font-semibold mb-2">Europe</div>
                <div className="text-green-100 text-sm">CSRD, EU ETS, EU Taxonomy, SFDR</div>
              </div>
              <div>
                <div className="text-lg font-semibold mb-2">North America</div>
                <div className="text-green-100 text-sm">SEC Climate Rules, RGGI, California Cap-and-Trade</div>
              </div>
              <div>
                <div className="text-lg font-semibold mb-2">Asia-Pacific</div>
                <div className="text-green-100 text-sm">China ETS, K-ETS, Japan GX League</div>
              </div>
              <div>
                <div className="text-lg font-semibold mb-2">Global Standards</div>
                <div className="text-green-100 text-sm">TCFD, ISSB, SBTi, Article 6, CORSIA</div>
              </div>
            </div>
            <p className="text-center mt-6 text-green-100">
              Updated regularly with the latest regulatory changes and compliance requirements
            </p>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Start Your Carbon Management Journey?
            </h3>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Whether you're measuring emissions, developing projects, or seeking compliance - we have the tools you need.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/carbon-footprint/new"
                className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-md shadow-lg text-white bg-green-600 hover:bg-green-700 transition-all duration-300"
              >
                Start Free Assessment
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
              <Link
                to="/carbon-project/new"
                className="inline-flex items-center px-8 py-4 border-2 border-green-600 text-lg font-medium rounded-md text-green-600 bg-white hover:bg-green-50 transition-all duration-300"
              >
                Plan Carbon Project
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. "Are you a?" Marketplace Section */}
      <section className="py-16 bg-white" aria-labelledby="marketplace-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 id="marketplace-section" className="text-3xl font-bold text-gray-900 mb-4">Are you a...</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join our global marketplace and connect with the carbon management ecosystem
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <article className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-md p-8 hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-green-200">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Project Developer?</h3>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  List your carbon reduction project at any stage of development. From concept to implementation, connect with investors, technology providers, and buyers.
                </p>
                <ul className="text-sm text-gray-600 mb-6 space-y-2">
                  <li>• Reforestation & afforestation projects</li>
                  <li>• Renewable energy initiatives</li>
                  <li>• Carbon capture & storage</li>
                  <li>• Energy efficiency projects</li>
                </ul>
                <Link 
                  to="/marketplace"
                  className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-md"
                >
                  List Your Project
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            </article>
            
            <article className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-md p-8 hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-blue-200">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Technology Provider?</h3>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  Showcase your carbon reduction technology to a global audience of project developers and organizations seeking solutions.
                </p>
                <ul className="text-sm text-gray-600 mb-6 space-y-2">
                  <li>• Carbon capture equipment</li>
                  <li>• Renewable energy systems</li>
                  <li>• Energy efficiency solutions</li>
                  <li>• Monitoring & verification tools</li>
                </ul>
                <Link 
                  to="/marketplace"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                >
                  List Your Technology
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            </article>
            
            <article className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-md p-8 hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-purple-200">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500 rounded-full mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Service Provider?</h3>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  Connect with organizations seeking professional carbon management services and expertise.
                </p>
                <ul className="text-sm text-gray-600 mb-6 space-y-2">
                  <li>• Carbon accounting & auditing</li>
                  <li>• Legal & regulatory compliance</li>
                  <li>• Project finance & investment</li>
                  <li>• ESG consulting & strategy</li>
                </ul>
                <Link 
                  to="/marketplace"
                  className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors shadow-md"
                >
                  List Your Service
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            </article>
          </div>
          
          <div className="text-center mt-12">
            <p className="text-lg text-gray-600 mb-6">
              Join thousands of verified providers in the world's largest carbon management marketplace
            </p>
            <Link
              to="/marketplace"
              className="inline-flex items-center px-8 py-4 border-2 border-gray-300 text-lg font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all duration-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Explore All Marketplace Listings
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Interactive Tool Section: Carbon Project Assessment */}
      <section className="py-20 bg-gray-50 relative" aria-labelledby="carbon-project-demo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 id="carbon-project-demo" className="inline-flex items-center text-base text-green-600 font-semibold tracking-wide uppercase bg-green-50 px-3 py-1 rounded-full">
              🌳 Project Developer Tools
            </h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Carbon Project Pre-Feasibility Assessment
            </p>
            <p className="mt-4 max-w-3xl mx-auto text-xl text-gray-500">
              Professional-grade financial modeling for carbon offset projects with integrated marketplace technologies. Calculate NPV, IRR, payback periods, and conduct sensitivity analysis using real-world solutions from verified providers.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">NPV Analysis</span>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">IRR Calculations</span>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">Marketplace Integration</span>
              <span className="px-3 py-1 bg-orange-100 text-orange-800 text-sm font-medium rounded-full">Technology ROI</span>
            </div>
          </div>

          {/* Demo Tool: Browser-based Simulation */}
          <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200 mb-16 transform transition-all duration-300 hover:shadow-2xl">
            <div className="p-1 bg-gradient-to-r from-green-500 to-green-600"></div>
            <div className="p-6">
              <div className="flex items-center mb-4 border-b pb-2">
                <div className="flex space-x-1">
                  <div className="h-3 w-3 rounded-full bg-red-500"></div>
                  <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                </div>
                <div className="ml-4 px-4 py-1 bg-gray-100 rounded-md text-xs text-gray-600 flex-grow text-center">
                  carbon-prospect.app/project-assessment
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg shadow-inner">
                <h3 className="text-lg font-medium mb-6 text-green-700 border-b pb-2">
                  Try It: Carbon Project Assessment with Marketplace Technology Integration
                </h3>
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-sm font-medium text-blue-800">Smart Technology Matching</span>
                  </div>
                  <p className="text-xs text-blue-700">
                    Select your project type to see applicable technologies from our marketplace. Each technology shows real-world impact on your project's financial performance.
                  </p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="mb-4">
                      <label htmlFor="project-type-selector" className="block text-sm font-medium mb-1 text-gray-700">
                        Project Type
                      </label>
                      <select 
                        id="project-type-selector"
                        value={projectTypeSelected}
                        onChange={(e) => {
                          setProjectTypeSelected(e.target.value);
                          setSelectedTechnology('none'); // Reset technology when project type changes
                        }}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      >
                        {Object.entries(projectTypes).map(([key, project]) => (
                          <option key={key} value={key}>
                            {project.icon} {project.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">{projectTypes[projectTypeSelected].description}</p>
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="project-size" className="block text-sm font-medium mb-1 text-gray-700">
                        Project Size ({projectTypes[projectTypeSelected].unit})
                      </label>
                      <input
                        id="project-size"
                        type="number"
                        min="1"
                        value={projectSize}
                        onChange={(e) => setProjectSize(Math.max(1, parseInt(e.target.value) || 0))}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      />
                    </div>
                    
                    {projectTypeSelected === 'forestry' && (
                      <div className="mb-4">
                        <label htmlFor="tree-type" className="block text-sm font-medium mb-1 text-gray-700">
                          Tree Type
                        </label>
                        <select 
                          id="tree-type"
                          value={treeType}
                          onChange={(e) => setTreeType(e.target.value)}
                          className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        >
                          {treeTypes.map(tree => (
                            <option key={tree.id} value={tree.id}>
                              {tree.name} - {tree.sequestrationRate} tCO₂e/ha/year
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    {projectTypeSelected === 'forestry' && treeType === 'custom' && (
                      <div className="bg-green-50 p-4 rounded-lg mb-4 border border-green-100">
                        <h4 className="text-sm font-medium text-green-800 mb-3">Custom Tree Settings</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label htmlFor="custom-rate" className="block text-xs font-medium mb-1 text-gray-700">
                              Sequestration Rate (tCO₂e/ha/year)
                            </label>
                            <input
                              id="custom-rate"
                              type="number"
                              step="0.1"
                              value={customSequestrationRate}
                              onChange={(e) => setCustomSequestrationRate(e.target.value === '' ? 0 : Number(e.target.value))}
                              className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                            />
                          </div>
                          <div>
                            <label htmlFor="maturity-years" className="block text-xs font-medium mb-1 text-gray-700">
                              Years to Maturity
                            </label>
                            <input
                              id="maturity-years"
                              type="number"
                              value={yearsToMaturity}
                              onChange={(e) => setYearsToMaturity(e.target.value === '' ? 0 : Number(e.target.value))}
                              className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="mb-4">
                      <label htmlFor="total-cost" className="block text-sm font-medium mb-1 text-gray-700">
                        Base Project Cost ($)
                      </label>
                      <input
                        id="total-cost"
                        type="number"
                        value={totalProjectCost}
                        onChange={(e) => setTotalProjectCost(e.target.value === '' ? '' : Number(e.target.value) || 0)}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      />
                    </div>

                    {/* Marketplace Technology Integration */}
                    <div className="mb-4">
                      <label htmlFor="technology-integration" className="block text-sm font-medium mb-1 text-gray-700">
                        Integrate Marketplace Technology
                      </label>
                      <select 
                        id="technology-integration"
                        value={selectedTechnology}
                        onChange={(e) => setSelectedTechnology(e.target.value)}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      >
                        {Object.entries(marketplaceTechnologies)
                          .filter(([key, tech]) => tech.applicableProjects.includes(projectTypeSelected))
                          .map(([key, tech]) => (
                            <option key={key} value={key}>
                              {tech.name}
                            </option>
                          ))}
                      </select>
                      {selectedTechnology !== 'none' && (
                        <div className="mt-2 p-3 bg-blue-50 rounded border border-blue-200">
                          <div className="text-xs font-medium text-blue-800 mb-1">
                            {marketplaceTechnologies[selectedTechnology].provider}
                          </div>
                          <p className="text-xs text-blue-700 mb-2">
                            {marketplaceTechnologies[selectedTechnology].description}
                          </p>
                          <div className="flex flex-wrap gap-1 mb-2">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                              {marketplaceTechnologies[selectedTechnology].category}
                            </span>
                            <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded">
                              +{(marketplaceTechnologies[selectedTechnology].emissionReduction * 100).toFixed(0)}% Enhancement
                            </span>
                          </div>
                          <div className="text-xs text-gray-600">
                            <strong>Additional Cost:</strong> ${marketplaceTechnologies[selectedTechnology].costPerUnit}/{projectTypes[projectTypeSelected].unit}
                            <br />
                            <strong>Certification:</strong> {marketplaceTechnologies[selectedTechnology].certification}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="mb-4">
                        <label htmlFor="project-years" className="block text-sm font-medium mb-1 text-gray-700">
                          Project Years
                        </label>
                        <input
                          id="project-years"
                          type="range"
                          min="5"
                          max="50"
                          value={projectYears}
                          onChange={(e) => setProjectYears(parseInt(e.target.value))}
                          className="w-full h-2 bg-green-100 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="text-sm text-center mt-1">{projectYears} years</div>
                      </div>
                      
                      <div className="mb-4">
                        <label htmlFor="carbon-price" className="block text-sm font-medium mb-1 text-gray-700">
                          Carbon Price ($/tCO₂e)
                        </label>
                        <input
                          id="carbon-price"
                          type="range"
                          min="10"
                          max="100"
                          value={carbonPrice}
                          onChange={(e) => setCarbonPrice(parseInt(e.target.value))}
                          className="w-full h-2 bg-green-100 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="text-sm text-center mt-1">${carbonPrice}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    {results && (
                      <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                        <h4 className="text-md font-medium mb-3 text-green-700 border-b pb-2">
                          Financial Analysis Summary
                          {results.enhancedSequestration && (
                            <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-600 text-xs rounded">
                              +{results.sequestrationBoost}% Enhanced
                            </span>
                          )}
                        </h4>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="bg-gray-50 p-3 rounded shadow-inner">
                            <h5 className="text-xs font-medium text-gray-500">Total Sequestration</h5>
                            <p className="text-lg font-bold text-green-700">{results.totalSequestration.toLocaleString()} tCO₂e</p>
                            {results.enhancedSequestration && (
                              <p className="text-xs text-green-600">Enhanced by technology</p>
                            )}
                          </div>
                          
                          <div className="bg-gray-50 p-3 rounded shadow-inner">
                            <h5 className="text-xs font-medium text-gray-500">Net Profit (NPV)</h5>
                            <p className="text-lg font-bold text-green-700">${results.netProfit.toLocaleString()}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="bg-gray-50 p-3 rounded shadow-inner">
                            <h5 className="text-xs font-medium text-gray-500">Total Revenue</h5>
                            <p className="text-lg font-bold text-green-700">${results.totalRevenue.toLocaleString()}</p>
                          </div>
                          
                          <div className="bg-gray-50 p-3 rounded shadow-inner">
                            <h5 className="text-xs font-medium text-gray-500">Total Investment</h5>
                            <p className="text-lg font-bold text-green-700">${results.totalCost.toLocaleString()}</p>
                            {results.technologyCost > 0 && (
                              <p className="text-xs text-blue-600">
                                Includes ${results.technologyCost.toLocaleString()} tech integration
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-gray-50 p-3 rounded shadow-inner">
                            <h5 className="text-xs font-medium text-gray-500">ROI</h5>
                            <p className="text-lg font-bold text-green-700">{results.roi}%</p>
                          </div>
                          
                          <div className="bg-gray-50 p-3 rounded shadow-inner">
                            <h5 className="text-xs font-medium text-gray-500">Payback Period</h5>
                            <p className="text-lg font-bold text-green-700">Year {results.breakEvenYear}</p>
                          </div>
                        </div>
                        
                        <div className="mt-4 h-40">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={cashFlowData.filter((d, i) => i % 5 === 0 || i === cashFlowData.length - 1)}
                              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                              <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                              <YAxis tick={{ fontSize: 10 }} />
                              <Tooltip formatter={(value) => [`${value.toLocaleString()}`, '']} />
                              <Bar dataKey="revenue" name="Revenue" fill="#4ade80" />
                              <Bar dataKey="cost" name="Costs" fill="#f87171" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Quick Start Button */}
          <div className="mt-16 text-center">
            <Link
              to="/carbon-project/new"
              className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-md shadow-lg text-white bg-green-600 hover:bg-green-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Access Full Project Assessment Tool
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Interactive Tool Section 2: Construction Materials Calculator */}
      <section className="py-20 bg-white relative" aria-labelledby="construction-calculator">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 id="construction-calculator" className="inline-flex items-center text-base text-blue-600 font-semibold tracking-wide uppercase bg-blue-50 px-3 py-1 rounded-full">
              🏗️ Construction Carbon Calculator
            </h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Building Materials Carbon Footprint Assessment
            </p>
            <p className="mt-4 max-w-3xl mx-auto text-xl text-gray-500">
              Calculate embodied carbon in concrete, steel, timber, and other construction materials. Compare sustainable alternatives and reduce building lifecycle emissions.
            </p>
          </div>

          {/* Construction Calculator Tool */}
          <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200 mb-16 transform transition-all duration-300 hover:shadow-2xl">
            <div className="p-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
            <div className="p-6">
              <div className="flex items-center mb-4 border-b pb-2">
                <div className="flex space-x-1">
                  <div className="h-3 w-3 rounded-full bg-red-500"></div>
                  <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                  <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                </div>
                <div className="ml-4 px-4 py-1 bg-gray-100 rounded-md text-xs text-gray-600 flex-grow text-center">
                  carbon-prospect.app/construction
                </div>
              </div>
              
              {/* Construction Calculator Component */}
              <ConstructionCalculator />
            </div>
          </div>
        </div>
      </section>

      {/* 8. Mini GHG Converter Section */}
      <section className="py-16 bg-gradient-to-r from-blue-50 to-indigo-50" aria-labelledby="ghg-converter">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 id="ghg-converter" className="text-2xl font-bold text-gray-900 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Free GHG Greenhouse Gas Converter Tool
            </h2>
            <p className="mt-2 text-gray-600">Convert CO₂, methane (CH₄), and nitrous oxide (N₂O) using IPCC Global Warming Potential values for accurate carbon accounting and ESG reporting</p>
            <div className="mt-2 text-xs text-blue-600 bg-blue-100 px-3 py-1 rounded-full inline-block">
              💡 Try with the 3 most common gases - convert and track 10+ more in our full converter
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border border-blue-100">
            <div className="grid md:grid-cols-3 gap-6 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Gas</label>
                <select 
                  value={ghgFromGas}
                  onChange={(e) => setGhgFromGas(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  {Object.entries(ghgGases).map(([key, gas]) => (
                    <option key={key} value={key}>
                      {gas.symbol} (GWP: {gas.gwp})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount (tonnes)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={ghgAmount}
                  onChange={(e) => setGhgAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter amount"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To Gas</label>
                <select 
                  value={ghgToGas}
                  onChange={(e) => setGhgToGas(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  {Object.entries(ghgGases).map(([key, gas]) => (
                    <option key={key} value={key}>
                      {gas.symbol} (GWP: {gas.gwp})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <button
                onClick={convertGHG}
                className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-md"
              >
                Convert Gases
              </button>
            </div>
            
            {ghgResults && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-center">
                  <p className="text-lg font-semibold text-blue-900 mb-2">Conversion Results</p>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-white p-3 rounded">
                      <p className="font-medium text-gray-700">Original Amount</p>
                      <p className="text-lg font-bold text-blue-600">{ghgResults.originalAmount} tonnes {ghgResults.fromGas.symbol}</p>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <p className="font-medium text-gray-700">CO₂ Equivalent</p>
                      <p className="text-lg font-bold text-green-600">{ghgResults.co2Equivalent} tonnes CO₂e</p>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <p className="font-medium text-gray-700">Converted Amount</p>
                      <p className="text-lg font-bold text-purple-600">{ghgResults.convertedAmount} tonnes {ghgResults.toGas.symbol}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Link
                to="/ghg-converter"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-md transform hover:scale-105"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Convert & Track 10+ More Gases
              </Link>
              <span className="text-sm text-gray-500">
                Including HFCs, PFCs, SF₆ & more
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Professional Services Section */}
      <section className="py-20 bg-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-400 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-green-400 rounded-full filter blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold mb-4">Professional Carbon Management Services</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Beyond our platform, Carbon Prospect provides comprehensive professional services to ensure your carbon initiatives succeed from planning through implementation.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="bg-blue-500 rounded-lg p-3 mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">Detailed Compliance Reports</h3>
              </div>
              <p className="text-gray-300 mb-4">
                Comprehensive compliance reports aligned with TCFD, CSRD, SEC climate disclosures, and regional requirements. Audit-ready and designed for regulatory scrutiny.
              </p>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• TCFD, CSRD, SEC Climate Rules</li>
                <li>• Third-party audit preparation</li>
                <li>• Stakeholder-ready presentations</li>
              </ul>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="bg-green-500 rounded-lg p-3 mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">Validation & Auditing</h3>
              </div>
              <p className="text-gray-300 mb-4">
                Third-party validation and verification of carbon projects through our network of accredited auditors for Verra, Gold Standard, and national compliance schemes.
              </p>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Verra VCS certification</li>
                <li>• Gold Standard verification</li>
                <li>• National compliance audits</li>
              </ul>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="bg-purple-500 rounded-lg p-3 mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">Broker Network Access</h3>
              </div>
              <p className="text-gray-300 mb-4">
                Connect with our vetted network of carbon brokers and traders for competitive pricing, market liquidity, and professional transaction management.
              </p>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Spot and forward markets</li>
                <li>• Competitive pricing</li>
                <li>• Transaction management</li>
              </ul>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="bg-orange-500 rounded-lg p-3 mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">Project Implementation</h3>
              </div>
              <p className="text-gray-300 mb-4">
                Hands-on assistance from feasibility studies to operational deployment, including technology selection and performance optimization.
              </p>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Feasibility studies</li>
                <li>• Technology selection</li>
                <li>• Performance monitoring</li>
              </ul>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="bg-indigo-500 rounded-lg p-3 mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">Strategic Consulting</h3>
              </div>
              <p className="text-gray-300 mb-4">
                Deep carbon market expertise combined with practical execution capabilities to ensure your initiatives deliver measurable results.
              </p>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Net-zero strategy development</li>
                <li>• Market access guidance</li>
                <li>• Regulatory compliance</li>
              </ul>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="bg-teal-500 rounded-lg p-3 mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">End-to-End Solutions</h3>
              </div>
              <p className="text-gray-300 mb-4">
                Complete carbon management from strategy through execution, combining technical implementation with market access for measurable impact.
              </p>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Full lifecycle support</li>
                <li>• Integrated solutions</li>
                <li>• Measurable outcomes</li>
              </ul>
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">Ready to Accelerate Your Carbon Journey?</h3>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
              Whether you need strategic guidance, technical implementation, or market access, our team delivers results.
            </p>
            <Link
              to="#contact"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Discuss Your Requirements
            </Link>
          </div>
        </div>
      </section>

      {/* 10. Contact Us Section */}
      <section id="contact" className="py-20 bg-white" aria-labelledby="contact-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 id="contact-heading" className="text-4xl font-extrabold text-gray-900 mb-4">Get in Touch</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Ready to start your carbon management journey? Our team is here to help you navigate the path to net-zero.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Connect with Carbon Prospect</h3>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="bg-green-100 rounded-full p-3">
                      <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-semibold text-gray-900">Email</h4>
                    <p className="text-gray-600">contact@carbonprospect.com</p>
                    <p className="text-sm text-gray-500">We'll respond within 24 hours</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="bg-blue-100 rounded-full p-3">
                      <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-semibold text-gray-900">Professional Services</h4>
                    <p className="text-gray-600">For compliance reports, project development, and strategic consulting</p>
                    <p className="text-sm text-gray-500">Custom solutions for your carbon management needs</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="bg-purple-100 rounded-full p-3">
                      <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-semibold text-gray-900">Global Support</h4>
                    <p className="text-gray-600">Connecting carbon solutions across continents</p>
                    <p className="text-sm text-gray-500">Public and private sector collaboration worldwide</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Our Mission</h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Carbon Prospect serves as the central hub for the world's carbon management ecosystem. We unite technology innovators, project developers, service providers, and organizations seeking to measure, reduce, and offset their carbon footprint.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Quick Start Options</h3>
              
              <div className="space-y-4">
                <Link
                  to="/carbon-footprint/new"
                  className="block w-full p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-center font-medium"
                >
                  🌱 Start Free Carbon Assessment
                </Link>
                
                <Link
                  to="/carbon-project/new"
                  className="block w-full p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center font-medium"
                >
                  📊 Plan Carbon Reduction Project
                </Link>
                
                <Link
                  to="/ghg-converter"
                  className="block w-full p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-center font-medium"
                >
                  ⚗️ Use GHG Gas Converter
                </Link>
                
                <Link
                  to="/marketplace"
                  className="block w-full p-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-center font-medium"
                >
                  🛒 Browse Solution Marketplace
                </Link>
              </div>

              <div className="mt-8 text-center">
                <p className="text-sm text-gray-600 mb-4">Join thousands of organizations already using Carbon Prospect</p>
                <div className="flex justify-center space-x-2">
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">Free Tools</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">No Credit Card</span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">Instant Access</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Simple CTA */}
      <section className="py-12 px-4 bg-green-800 text-white">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Start Your Carbon Journey Today</h2>
          <Link
            to="/carbon-footprint/new"
            className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-md shadow-lg text-green-700 bg-white hover:bg-green-50 transition-all duration-300"
          >
            Start Carbon Assessment Now
          </Link>
        </div>
      </section>
    </div>
  );
};

export default MinimalHomePage;