import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthSystem';

function CombinedConverterPage() {
  const { currentUser } = useAuth();
  
  // Greenhouse gases data with GWP values (based on AR5 100-year values)
  const greenhouseGases = [
    { id: 'co2', name: 'Carbon Dioxide (CO₂)', gwp: 1, color: '#34d399', 
      description: 'The primary greenhouse gas emitted through human activities, mainly from burning fossil fuels.',
      sources: ['Fossil fuel combustion', 'Deforestation', 'Industrial processes'],
      persistence: 100, // years in atmosphere
      tooltip: 'CO₂ is the baseline for all GWP calculations. While it has a GWP of 1, it\'s the most abundant human-caused greenhouse gas.'
    },
    { id: 'ch4', name: 'Methane (CH₄)', gwp: 28, color: '#f97316',
      description: 'A potent greenhouse gas with 28 times the global warming potential of CO₂ over a 100-year period.',
      sources: ['Natural gas systems', 'Livestock', 'Landfills', 'Rice cultivation'],
      persistence: 12,
      tooltip: 'Methane is powerful but short-lived. It\'s responsible for about 30% of global warming since pre-industrial times.'
    },
    { id: 'n2o', name: 'Nitrous Oxide (N₂O)', gwp: 265, color: '#8b5cf6',
      description: 'Has 265 times the global warming potential of CO₂ over a 100-year period.',
      sources: ['Agricultural soil management', 'Fossil fuel combustion', 'Industrial processes'],
      persistence: 114,
      tooltip: 'Also known as "laughing gas", N₂O is no joke for the climate. It also depletes the ozone layer.'
    },
    { id: 'hfc23', name: 'HFC-23', gwp: 12400, color: '#06b6d4',
      description: 'A hydrofluorocarbon with extremely high GWP, used primarily as a refrigerant.',
      sources: ['Refrigeration', 'Air conditioning', 'HCFC-22 production'],
      persistence: 222,
      tooltip: 'One of the most potent greenhouse gases. A single pound of HFC-23 equals 6 tons of CO₂!'
    },
    { id: 'hfc32', name: 'HFC-32', gwp: 677, color: '#0284c7',
      description: 'A hydrofluorocarbon used as a refrigerant with lower GWP than many other HFCs.',
      sources: ['Air conditioning', 'Refrigeration', 'Heat pumps'],
      persistence: 5,
      tooltip: 'A "greener" refrigerant alternative, but still 677 times worse than CO₂ for the climate.'
    },
    { id: 'hfc125', name: 'HFC-125', gwp: 3170, color: '#2563eb',
      description: 'A hydrofluorocarbon commonly used in refrigeration and fire suppression systems.',
      sources: ['Commercial refrigeration', 'Fire suppression', 'Air conditioning'],
      persistence: 29,
      tooltip: 'Common in refrigerant blends. The Kigali Amendment aims to phase down HFCs like this one.'
    },
    { id: 'hfc134a', name: 'HFC-134a', gwp: 1300, color: '#4f46e5',
      description: 'One of the most common HFCs, widely used in refrigeration and as a propellant.',
      sources: ['Mobile air conditioning', 'Domestic refrigeration', 'Aerosol propellants'],
      persistence: 14,
      tooltip: 'The refrigerant in most car air conditioners. Being phased out in many countries.'
    },
    { id: 'hfc143a', name: 'HFC-143a', gwp: 4800, color: '#7c3aed',
      description: 'A hydrofluorocarbon used in refrigerant blends for low temperature applications.',
      sources: ['Commercial refrigeration', 'Industrial refrigeration', 'Transport refrigeration'],
      persistence: 51,
      tooltip: 'Used in supermarket freezers and cold storage. Has both high GWP and long atmospheric life.'
    },
    { id: 'hfc152a', name: 'HFC-152a', gwp: 138, color: '#a855f7',
      description: 'A hydrofluorocarbon with relatively low GWP compared to other HFCs.',
      sources: ['Foam blowing', 'Aerosol propellants', 'Refrigeration'],
      persistence: 1.5,
      tooltip: 'One of the "better" HFCs with lower GWP and shorter atmospheric lifetime.'
    },
    { id: 'sf6', name: 'Sulfur Hexafluoride (SF₆)', gwp: 23500, color: '#ec4899',
      description: 'An extremely potent greenhouse gas used primarily as an electrical insulator.',
      sources: ['Electrical equipment', 'Magnesium production', 'Semiconductor manufacturing'],
      persistence: 3200,
      tooltip: 'The most potent greenhouse gas. One kilogram equals 23.5 tons of CO₂! Lasts millennia in the atmosphere.'
    },
    { id: 'nf3', name: 'Nitrogen Trifluoride (NF₃)', gwp: 16100, color: '#f43f5e',
      description: 'A potent greenhouse gas used in the electronics industry.',
      sources: ['Semiconductor manufacturing', 'LCD production', 'Solar panel production'],
      persistence: 500,
      tooltip: 'Used to clean electronics manufacturing equipment. Emissions are growing with tech industry expansion.'
    },
    { id: 'cf4', name: 'Carbon Tetrafluoride (CF₄)', gwp: 6630, color: '#ef4444',
      description: 'A perfluorocarbon with very long atmospheric lifetime.',
      sources: ['Aluminum production', 'Semiconductor manufacturing', 'Refrigeration'],
      persistence: 50000,
      tooltip: 'Can last 50,000 years in the atmosphere! Even small emissions have long-lasting impacts.'
    },
    { id: 'c2f6', name: 'Hexafluoroethane (C₂F₆)', gwp: 11100, color: '#f59e0b',
      description: 'A perfluorocarbon with extremely high GWP and long atmospheric lifetime.',
      sources: ['Semiconductor manufacturing', 'Aluminum production', 'Plasma etching'],
      persistence: 10000,
      tooltip: 'Another "forever chemical" that accumulates in the atmosphere over thousands of years.'
    }
  ];

  // Units for conversion
  const units = [
    { id: 'g', name: 'grams (g)', multiplier: 0.001, symbol: 'g' },
    { id: 'kg', name: 'kilograms (kg)', multiplier: 1, symbol: 'kg' },
    { id: 't', name: 'metric tons (t)', multiplier: 1000, symbol: 't' },
    { id: 'kt', name: 'kilotons (kt)', multiplier: 1000000, symbol: 'kt' },
    { id: 'mt', name: 'megatons (Mt)', multiplier: 1000000000, symbol: 'Mt' },
    { id: 'lb', name: 'pounds (lb)', multiplier: 0.45359237, symbol: 'lb' },
    { id: 'ton', name: 'US short tons', multiplier: 907.18474, symbol: 'ton' }
  ];

  // Preset scenarios
  const presetScenarios = [
    { 
      id: 'gasoline', 
      name: '1 Gallon of Gasoline', 
      icon: '⛽',
      sourceGas: 'co2', 
      targetGas: 'co2', 
      sourceUnit: 'kg', 
      targetUnit: 'kg', 
      value: 8.887,
      description: 'Burning 1 gallon of gasoline'
    },
    { 
      id: 'flight', 
      name: 'NYC to LA Flight', 
      icon: '✈️',
      sourceGas: 'co2', 
      targetGas: 'co2', 
      sourceUnit: 'kg', 
      targetUnit: 'kg', 
      value: 901,
      description: 'Round-trip flight per passenger'
    },
    { 
      id: 'beef', 
      name: '1 Year of Beef', 
      icon: '🥩',
      sourceGas: 'ch4', 
      targetGas: 'co2', 
      sourceUnit: 'kg', 
      targetUnit: 't', 
      value: 72,
      description: 'Annual beef consumption (70kg/year)'
    },
    { 
      id: 'car', 
      name: 'Annual Car Emissions', 
      icon: '🚗',
      sourceGas: 'co2', 
      targetGas: 'co2', 
      sourceUnit: 't', 
      targetUnit: 't', 
      value: 4.6,
      description: 'Average US car driven 11,500 miles/year'
    },
    { 
      id: 'home', 
      name: 'Home Electricity (1 Year)', 
      icon: '🏠',
      sourceGas: 'co2', 
      targetGas: 'co2', 
      sourceUnit: 't', 
      targetUnit: 't', 
      value: 7.5,
      description: 'Average US household electricity use'
    },
    { 
      id: 'fridge', 
      name: 'AC Refrigerant Leak', 
      icon: '❄️',
      sourceGas: 'hfc134a', 
      targetGas: 'co2', 
      sourceUnit: 'kg', 
      targetUnit: 't', 
      value: 1,
      description: '1kg of HFC-134a refrigerant'
    }
  ];

  // Fun facts for educational feature
  const funFacts = [
    "A single cow produces about 220 pounds of methane per year through burps and farts!",
    "SF₆ is 23,500 times worse for the climate than CO₂ - just one pound equals burning 2,500 gallons of gasoline!",
    "The refrigerant in your car's AC (HFC-134a) is 1,300 times more potent than CO₂.",
    "Methane traps heat 84 times more effectively than CO₂ in the first 20 years after release.",
    "Some industrial gases can persist in the atmosphere for over 50,000 years!",
    "Nitrous oxide (N₂O) is not just a greenhouse gas - it's also the single most important ozone-depleting substance.",
    "The meat industry produces more greenhouse gases than all transportation combined.",
    "One tree absorbs about 48 pounds of CO₂ per year - it would take 48 trees to offset a round-trip flight from NYC to LA.",
    "HFC-23 is so potent that destroying it generates valuable carbon credits in some markets.",
    "Natural gas is mostly methane - even small leaks can have big climate impacts."
  ];

  // Achievement definitions
  const achievementDefinitions = [
    {
      id: 'first_calc',
      name: 'First Steps',
      description: 'Complete your first calculation',
      reward: '10 points',
      icon: '🎯'
    },
    {
      id: 'low_impact',
      name: 'Low Impact Lifestyle',
      description: 'Personal emissions under 10 tons/year',
      reward: 'Green Badge',
      icon: '🌱'
    },
    {
      id: 'offset_ready',
      name: 'Offset Champion',
      description: 'Calculate and offset your emissions',
      reward: 'Access to premium projects',
      icon: '🏆'
    },
    {
      id: 'educator',
      name: 'Climate Educator',
      description: 'Complete all learning modules',
      reward: '50 points',
      icon: '🎓'
    },
    {
      id: 'calculator_pro',
      name: 'Calculator Pro',
      description: 'Use all 4 calculators',
      reward: 'Advanced features',
      icon: '🧮'
    }
  ];
  
  // State variables
  const [sourceGas, setSourceGas] = useState('co2');
  const [targetGas, setTargetGas] = useState('ch4');
  const [sourceUnit, setSourceUnit] = useState('t');
  const [targetUnit, setTargetUnit] = useState('t');
  const [inputValue, setInputValue] = useState(1);
  const [result, setResult] = useState(null);
  const [co2eResult, setCo2eResult] = useState(null);
  const [isReverseInProgress, setIsReverseInProgress] = useState(false);
  const [currentSourceGasInfo, setCurrentSourceGasInfo] = useState(null);
  const [conversionHistory, setConversionHistory] = useState([]);
  const [realWorldEquivalent, setRealWorldEquivalent] = useState('');
  const [lastConversion, setLastConversion] = useState(null);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [hoveredGas, setHoveredGas] = useState(null);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonGases, setComparisonGases] = useState(['co2', 'ch4', 'n2o']);
  const [offsetInfo, setOffsetInfo] = useState(null);

  // Calculator-specific state
  const [showFlightCalc, setShowFlightCalc] = useState(false);
  const [showCommuteCalc, setShowCommuteCalc] = useState(false);
  const [showHomeCalc, setShowHomeCalc] = useState(false);
  const [showRefrigerantCalc, setShowRefrigerantCalc] = useState(false);

  // Flight calculator state
  const [flightDistance, setFlightDistance] = useState('');
  const [flightClass, setFlightClass] = useState('economy');
  const [isRoundTrip, setIsRoundTrip] = useState(true);
  const [flightResult, setFlightResult] = useState(null);

  // Commute calculator state
  const [commuteDistance, setCommuteDistance] = useState('');
  const [vehicleType, setVehicleType] = useState('car');
  const [commuteDays, setCommuteDays] = useState('5');
  const [commuteResult, setCommuteResult] = useState(null);

  // Home energy calculator state
  const [electricityUsage, setElectricityUsage] = useState('');
  const [gasUsage, setGasUsage] = useState('');
  const [homeResult, setHomeResult] = useState(null);

  // Refrigerant calculator state
  const [refrigerantType, setRefrigerantType] = useState('hfc134a');
  const [chargeSize, setChargeSize] = useState('');
  const [leakRate, setLeakRate] = useState('');
  const [refrigerantResult, setRefrigerantResult] = useState(null);

  // Personal Impact Dashboard State
  const [showPersonalDashboard, setShowPersonalDashboard] = useState(false);
  const [lifestyle, setLifestyle] = useState({
    transport: '',
    diet: '',
    home: '',
    shopping: ''
  });
  const [personalEmissions, setPersonalEmissions] = useState(null);

  // Learning Module State
  const [showLearningModule, setShowLearningModule] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);

  // What-If Scenarios State
  const [selectedScenario, setSelectedScenario] = useState(null);

  // New states for enhanced features
  const [showNotification, setShowNotification] = useState(false);
  const [notificationContent, setNotificationContent] = useState('');
  const [userCalculations, setUserCalculations] = useState(0);
  const [earnedAchievements, setEarnedAchievements] = useState([]);
  const [calculatorsUsed, setCalculatorsUsed] = useState(new Set());

  // Global emissions data for enhanced sections
  const globalEmissionsData = {
    total: 59.1,
    byGas: [
      { gas: 'CO₂', percentage: 74.1, amount: 43.8, color: '#34d399' },
      { gas: 'CH₄', percentage: 17.3, amount: 10.2, color: '#f97316' },
      { gas: 'N₂O', percentage: 6.2, amount: 3.7, color: '#8b5cf6' },
      { gas: 'F-gases', percentage: 2.4, amount: 1.4, color: '#06b6d4' }
    ],
    bySector: [
      { sector: 'Energy', percentage: 73.2, icon: '⚡', color: '#ef4444', 
        breakdown: ['Electricity/Heat (30.4%)', 'Transportation (16.2%)', 'Manufacturing (12.4%)', 'Buildings (10.9%)'] },
      { sector: 'Agriculture', percentage: 18.4, icon: '🌾', color: '#10b981',
        breakdown: ['Livestock (5.8%)', 'Agricultural soils (4.1%)', 'Rice cultivation (3.0%)', 'Deforestation (3.5%)'] },
      { sector: 'Industry', percentage: 5.2, icon: '🏭', color: '#6366f1',
        breakdown: ['Cement (2.2%)', 'Chemicals (1.3%)', 'Steel & Iron (1.1%)', 'Other (0.6%)'] },
      { sector: 'Waste', percentage: 3.2, icon: '🗑️', color: '#f59e0b',
        breakdown: ['Landfills (1.9%)', 'Wastewater (1.3%)'] }
    ],
    byCountry: [
      { country: 'China', emoji: '🇨🇳', percentage: 27.9, perCapita: 7.1, trend: '↑', mainSources: ['Coal power', 'Manufacturing', 'Cement'] },
      { country: 'United States', emoji: '🇺🇸', percentage: 14.5, perCapita: 16.1, trend: '↓', mainSources: ['Transportation', 'Electricity', 'Industry'] },
      { country: 'India', emoji: '🇮🇳', percentage: 6.8, perCapita: 1.9, trend: '↑', mainSources: ['Coal power', 'Agriculture', 'Industry'] },
      { country: 'Russia', emoji: '🇷🇺', percentage: 4.6, perCapita: 11.8, trend: '→', mainSources: ['Natural gas', 'Oil & Gas', 'Industry'] },
      { country: 'Japan', emoji: '🇯🇵', percentage: 3.3, perCapita: 9.3, trend: '↓', mainSources: ['Industry', 'Transportation', 'Buildings'] }
    ]
  };

  const [selectedCountry, setSelectedCountry] = useState(null);
  const [activeTab, setActiveTab] = useState('gas');
  const [animatedPercentage, setAnimatedPercentage] = useState(0);

  // Learning questions
  const learningQuestions = [
    {
      question: "If a supermarket refrigeration system contains 100kg of R-404A and has a 25% annual leak rate, how many tons of CO₂e are emitted per year?",
      hint: "R-404A has a GWP of 3,922. Remember: tons = kg ÷ 1000",
      answer: "98.05",
      explanation: "100kg × 0.25 × 3,922 = 98,050kg CO₂e = 98.05 tons CO₂e"
    },
    {
      question: "Which produces more emissions: Flying from NYC to LA (5,500km round trip) or driving 15,000km in an average car?",
      hint: "Flight emissions: ~0.115 kg CO₂/km/passenger. Car: ~0.171 kg CO₂/km",
      answer: "Driving",
      explanation: "Flight: 5,500 × 0.115 = 632.5kg. Car: 15,000 × 0.171 = 2,565kg. Driving produces 4x more!"
    },
    {
      question: "A dairy farm has 100 cows. Each cow produces 110kg of methane per year. What's the total CO₂e in tons?",
      hint: "Methane (CH₄) has a GWP of 28",
      answer: "308",
      explanation: "100 cows × 110kg CH₄ × 28 GWP = 308,000kg = 308 tons CO₂e"
    }
  ];

  // What-If Scenarios
  const whatIfScenarios = [
    {
      id: 'electric-cars',
      title: "What if all cars were electric?",
      icon: "🚗⚡",
      current: "Transportation produces 9.5 Gt CO₂e/year globally",
      potential: "Could reduce to 3.2 Gt CO₂e/year",
      savings: "6.3 Gt CO₂e",
      equivalent: "Taking 1.4 billion cars off the road",
      challenges: ["Grid capacity", "Battery production", "Charging infrastructure"]
    },
    {
      id: 'no-beef',
      title: "What if everyone ate 50% less beef?",
      icon: "🥩➡️🌱",
      current: "Beef production: 3.1 Gt CO₂e/year",
      potential: "Could reduce to 1.55 Gt CO₂e/year",
      savings: "1.55 Gt CO₂e",
      equivalent: "Removing 335 million cars from roads",
      challenges: ["Cultural change", "Protein alternatives", "Farmer livelihoods"]
    },
    {
      id: 'natural-refrigerants',
      title: "What if all refrigerants were natural?",
      icon: "❄️🌿",
      current: "F-gases: 1.4 Gt CO₂e/year",
      potential: "Could reduce to 0.1 Gt CO₂e/year",
      savings: "1.3 Gt CO₂e",
      equivalent: "Shutting down 325 coal power plants",
      challenges: ["Equipment retrofit costs", "Safety training", "Efficiency"]
    }
  ];

  // Notification system
  const displayNotification = (content) => {
    setNotificationContent(content);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 5000);
  };

  // Achievement checking
  const checkAchievements = () => {
    const newAchievements = [];
    
    if (userCalculations === 1 && !earnedAchievements.includes('first_calc')) {
      newAchievements.push('first_calc');
    }
    
    if (personalEmissions && personalEmissions < 10 && !earnedAchievements.includes('low_impact')) {
      newAchievements.push('low_impact');
    }
    
    if (score === learningQuestions.length && !earnedAchievements.includes('educator')) {
      newAchievements.push('educator');
    }
    
    if (calculatorsUsed.size === 4 && !earnedAchievements.includes('calculator_pro')) {
      newAchievements.push('calculator_pro');
    }
    
    if (newAchievements.length > 0) {
      setEarnedAchievements([...earnedAchievements, ...newAchievements]);
      displayNotification(
        <div>
          🎉 Achievement unlocked: {achievementDefinitions.find(a => a.id === newAchievements[0])?.name}!
        </div>
      );
    }
  };

  // Rotate fun facts
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFactIndex((prev) => (prev + 1) % funFacts.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Animate percentage on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercentage(100);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Check achievements when relevant state changes
  useEffect(() => {
    checkAchievements();
  }, [userCalculations, personalEmissions, score, calculatorsUsed]);

  // Calculate personal emissions based on lifestyle
  const calculatePersonalEmissions = () => {
    let emissions = 0;
    
    const transportEmissions = {
      walk: 0,
      transit: 1.2,
      car: 4.6,
      frequent_flyer: 8.5
    };
    
    const dietEmissions = {
      vegan: 1.5,
      vegetarian: 2.5,
      moderate: 3.5,
      heavy_meat: 5.8
    };
    const homeEmissions = {
      efficient: 3.2,
      average: 7.5,
      inefficient: 12.1
    };
    
    const shoppingEmissions = {
      minimal: 0.8,
      average: 2.1,
      heavy: 4.2
    };
    
    emissions += transportEmissions[lifestyle.transport] || 0;
    emissions += dietEmissions[lifestyle.diet] || 0;
    emissions += homeEmissions[lifestyle.home] || 0;
    emissions += shoppingEmissions[lifestyle.shopping] || 0;
    
    setPersonalEmissions(emissions);
  };

  // Update personal emissions when lifestyle changes
  useEffect(() => {
    if (lifestyle.transport && lifestyle.diet && lifestyle.home && lifestyle.shopping) {
      calculatePersonalEmissions();
    }
  }, [lifestyle]);
  
  // Calculate offsets
  const calculateOffsets = useCallback((co2eInKg) => {
    const co2eInTons = co2eInKg / 1000;
    
    const treesNeeded = Math.round(co2eInKg / 22);
    const forestAcres = (co2eInTons / 3.6).toFixed(2);
    const solarPanels = Math.round(co2eInTons / 1.5);
    const windTurbineHours = (co2eInTons / 4600 * 8760).toFixed(1);
    
    setOffsetInfo({
      trees: treesNeeded,
      forestAcres: forestAcres,
      solarPanels: solarPanels,
      windTurbineHours: windTurbineHours
    });
  }, []);

  // Calculate real-world equivalents
  const calculateRealWorldEquivalent = useCallback((co2eInKg) => {
    const co2eInTons = co2eInKg / 1000;
    
    const equivalents = [
      { threshold: 0.025, text: `Charging a smartphone ${Math.round(co2eInKg / 0.008).toLocaleString()} times` },
      { threshold: 0.1, text: `${Math.round(co2eInKg / 0.089).toLocaleString()} miles driven by an average car` },
      { threshold: 1, text: `${Math.round(co2eInKg / 2.31).toLocaleString()} miles driven by an average car` },
      { threshold: 10, text: `${Math.round(co2eInTons / 4.6 * 12).toLocaleString()} months of electricity for an average home` },
      { threshold: 100, text: `${Math.round(co2eInTons / 11.7).toLocaleString()} round-trip flights from NYC to London` },
      { threshold: 1000, text: `${Math.round(co2eInTons / 16.4).toLocaleString()} American households' annual emissions` },
      { threshold: Infinity, text: `${Math.round(co2eInTons / 36).toLocaleString()} acres of forest needed to offset in one year` }
    ];
    
    const equivalent = equivalents.find(e => co2eInTons < e.threshold);
    return equivalent ? equivalent.text : '';
  }, []);

  // Enhanced calculation function with tracking
  const calculateConversion = useCallback(() => {
    const source = greenhouseGases.find(gas => gas.id === sourceGas);
    const target = greenhouseGases.find(gas => gas.id === targetGas);
    const sUnit = units.find(unit => unit.id === sourceUnit);
    const tUnit = units.find(unit => unit.id === targetUnit);
    
    if (source && target && sUnit && tUnit && inputValue) {
      const sourceAmountInKg = inputValue * sUnit.multiplier;
      const co2Equivalent = sourceAmountInKg * source.gwp;
      const targetAmount = co2Equivalent / target.gwp;
      const finalAmount = targetAmount / tUnit.multiplier;
      
      setResult(finalAmount);
      setCo2eResult(co2Equivalent / units.find(unit => unit.id === targetUnit).multiplier);
      
      const equivalent = calculateRealWorldEquivalent(co2Equivalent);
      setRealWorldEquivalent(equivalent);
      
      calculateOffsets(co2Equivalent);
      
      setCurrentSourceGasInfo({
        name: source.name,
        gwp: source.gwp,
        unit: sUnit.symbol
      });
      
      const newConversion = {
        id: Date.now(),
        from: `${inputValue} ${sUnit.symbol} ${source.name}`,
        to: `${finalAmount.toLocaleString('en-US', { maximumFractionDigits: 3 })} ${tUnit.symbol} ${target.name}`,
        co2e: `${(co2Equivalent / 1000).toLocaleString('en-US', { maximumFractionDigits: 3 })} t CO₂e`,
        co2eValue: co2Equivalent
      };
      
      setLastConversion(newConversion);
      setUserCalculations(prev => prev + 1);
    }
  }, [sourceGas, targetGas, sourceUnit, targetUnit, inputValue, greenhouseGases, units, calculateRealWorldEquivalent, calculateOffsets]);

  // Calculator Functions with tracking
  
  // Flight emissions calculator
  const calculateFlightEmissions = () => {
    if (!flightDistance) return;
    
    const distance = parseFloat(flightDistance);
    const multiplier = isRoundTrip ? 2 : 1;
    
    const emissionFactors = {
      economy: 0.115,
      business: 0.345,
      first: 0.460
    };
    
    const emissions = distance * emissionFactors[flightClass] * multiplier;
    setFlightResult(emissions);
    setCalculatorsUsed(prev => new Set([...prev, 'flight']));
  };

  // Commute emissions calculator
  const calculateCommuteEmissions = () => {
    if (!commuteDistance || !commuteDays) return;
    
    const distance = parseFloat(commuteDistance);
    const days = parseFloat(commuteDays);
    
    const emissionFactors = {
      car: 0.171,
      suv: 0.213,
      motorcycle: 0.103,
      bus: 0.089,
      train: 0.041,
      electric: 0.053
    };
    
    const annualEmissions = distance * 2 * days * 52 * emissionFactors[vehicleType];
    setCommuteResult(annualEmissions);
    setCalculatorsUsed(prev => new Set([...prev, 'commute']));
  };

  // Home energy emissions calculator
  const calculateHomeEmissions = () => {
    if (!electricityUsage && !gasUsage) return;
    
    const electricity = parseFloat(electricityUsage) || 0;
    const gas = parseFloat(gasUsage) || 0;
    
    const electricityFactor = 0.417;
    const gasFactor = 53.06;
    
    const monthlyEmissions = (electricity * electricityFactor) + (gas * gasFactor);
    const annualEmissions = monthlyEmissions * 12;
    
    setHomeResult(annualEmissions);
    setCalculatorsUsed(prev => new Set([...prev, 'home']));
  };

  // Refrigerant leak emissions calculator
  const calculateRefrigerantEmissions = () => {
    if (!chargeSize || !leakRate) return;
    
    const charge = parseFloat(chargeSize);
    const leak = parseFloat(leakRate) / 100;
    
    const refrigerant = greenhouseGases.find(g => g.id === refrigerantType);
    const gwp = refrigerant ? refrigerant.gwp : 1300;
    
    const annualEmissions = charge * leak * gwp;
    setRefrigerantResult(annualEmissions);
    setCalculatorsUsed(prev => new Set([...prev, 'refrigerant']));
  };

  // Enhanced save function with user integration
  const saveConversion = async () => {
    if (currentUser && lastConversion) {
      try {
        // Mock API call - replace with actual API
        displayNotification(
          <div>
            Calculation saved! 
            <Link to="/dashboard" className="underline ml-2 text-green-600">
              View in Dashboard
            </Link>
          </div>
        );
        
        setConversionHistory(prev => [lastConversion, ...prev.slice(0, 4)]);
      } catch (error) {
        console.error('Failed to save calculation:', error);
      }
    } else if (!currentUser) {
      displayNotification(
        <div>
          <Link to="/register" className="underline text-green-600">
            Sign up
          </Link> to save your calculations and track progress!
        </div>
      );
    } else if (lastConversion) {
      setConversionHistory(prev => [lastConversion, ...prev.slice(0, 4)]);
      displayNotification('Conversion saved locally!');
    }
  };

  // Calculate conversions when Convert button is clicked
  const handleConvert = () => {
    calculateConversion();
  };

  // Handle reverse conversion
  const handleReverseConversion = () => {
    setIsReverseInProgress(true);

    const tempSourceGas = sourceGas;
    const tempTargetGas = targetGas;
    const tempSourceUnit = sourceUnit;
    const tempTargetUnit = targetUnit;
    const tempInputValue = inputValue;
    const tempResult = result;

    setSourceGas(tempTargetGas);
    setTargetGas(tempSourceGas);
    setSourceUnit(tempTargetUnit);
    setTargetUnit(tempSourceUnit);
    
    if (tempResult !== null) {
      setInputValue(tempResult);
    }
    
    setResult(null);
    setCo2eResult(null);
    setRealWorldEquivalent('');
    setLastConversion(null);
    setOffsetInfo(null);
  };

  // Apply preset scenario
  const applyPreset = (preset) => {
    setSourceGas(preset.sourceGas);
    setTargetGas(preset.targetGas);
    setSourceUnit(preset.sourceUnit);
    setTargetUnit(preset.targetUnit);
    setInputValue(preset.value);
    setResult(null);
    setCo2eResult(null);
    setRealWorldEquivalent('');
    setOffsetInfo(null);
  };

  // Copy calculation to clipboard
  const copyCalculation = () => {
    if (result !== null) {
      const text = `${inputValue} ${units.find(u => u.id === sourceUnit)?.symbol} ${greenhouseGases.find(g => g.id === sourceGas)?.name} = ${result.toLocaleString('en-US', { maximumFractionDigits: 6 })} ${units.find(u => u.id === targetUnit)?.symbol} ${greenhouseGases.find(g => g.id === targetGas)?.name} (${co2eResult.toLocaleString('en-US', { maximumFractionDigits: 6 })} ${units.find(u => u.id === targetUnit)?.symbol} CO₂e)`;
      navigator.clipboard.writeText(text);
      displayNotification('Calculation copied to clipboard!');
    }
  };

  // Download as CSV
  const downloadAsCSV = () => {
    if (conversionHistory.length > 0) {
      const csv = 'From,To,CO2 Equivalent\n' + conversionHistory.map(h => `"${h.from}","${h.to}","${h.co2e}"`).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ghg-conversions.csv';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Remove the automatic calculation effect
  useEffect(() => {
    if (isReverseInProgress) {
      setIsReverseInProgress(false);
    }
  }, [isReverseInProgress]);

  // Sort gases by GWP for the bar chart
  const sortedGases = [...greenhouseGases].sort((a, b) => a.gwp - b.gwp);
  const maxGWP = Math.max(...greenhouseGases.map(g => g.gwp));

  // Actionable Summary Component
  const ActionableSummary = ({ emissions, source }) => {
    const getRecommendations = () => {
      if (source === 'flight' && emissions > 1000) {
        return {
          icon: '✈️',
          title: 'Frequent Flyer Alert',
          action: 'Browse aviation offset projects',
          link: '/projects?category=aviation'
        };
      }
      if (source === 'refrigerant' && emissions > 5000) {
        return {
          icon: '❄️',
          title: 'High-Impact Refrigerant Leak',
          action: 'Start a refrigerant replacement project',
          link: '/carbon-projects/assessment?type=refrigerant'
        };
      }
      if (source === 'home' && emissions > 10000) {
        return {
          icon: '🏠',
          title: 'High Home Energy Usage',
          action: 'Explore renewable energy projects',
          link: '/projects?category=renewable'
        };
      }
      if (source === 'commute' && emissions > 3000) {
        return {
          icon: '🚗',
          title: 'Heavy Commuter',
          action: 'Browse transport offset options',
          link: '/projects?category=transport'
        };
      }
      return {
        icon: '🌱',
        title: 'Offset Your Impact',
        action: 'Browse carbon offset projects',
        link: '/projects'
      };
    };

    const recommendation = getRecommendations();

    return (
      <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
        <div className="flex items-start">
          <div className="text-3xl mr-4">{recommendation.icon}</div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {recommendation.title}
            </h3>
            <p className="text-gray-700 mb-4">
              Your calculated emissions: <span className="font-bold">{(emissions/1000).toFixed(2)} tons CO₂e</span>
            </p>
            <Link 
              to={recommendation.link}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              {recommendation.action} →
            </Link>
          </div>
        </div>
      </div>
    );
  };

  // Achievements Component
  const Achievements = () => {
    return (
      <div className="bg-purple-50 rounded-lg p-6 mb-8">
        <h3 className="text-xl font-bold mb-4">🏆 Your Achievements</h3>
        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
          {achievementDefinitions.map(achievement => {
            const isEarned = earnedAchievements.includes(achievement.id);
            return (
              <div 
                key={achievement.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  isEarned 
                    ? 'border-purple-500 bg-white shadow-md' 
                    : 'border-gray-300 bg-gray-50 opacity-60'
                }`}
              >
                <div className="text-2xl mb-2 text-center">{achievement.icon}</div>
                <h4 className="font-semibold text-sm">{achievement.name}</h4>
                <p className="text-xs text-gray-600 mt-1">{achievement.description}</p>
                <p className="text-xs text-purple-600 mt-2">Reward: {achievement.reward}</p>
              </div>
            );
          })}
        </div>
        {!currentUser && (
          <p className="text-center mt-4 text-sm text-gray-600">
            <Link to="/register" className="text-purple-600 hover:underline">
              Sign up
            </Link> to track achievements and earn rewards!
          </p>
        )}
      </div>
    );
  };
  return (
    <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      {/* Notification System */}
      {showNotification && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in">
          {notificationContent}
        </div>
      )}

      <div className="text-center mb-12">
        <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">Carbon and GHG Converter</h1>
        <p className="mt-4 max-w-3xl mx-auto text-lg text-gray-600">
          Convert between different greenhouse gases and measurement units using Global Warming Potential (GWP) values.
        </p>
        
        {/* Fun Facts Ticker */}
        <div className="mt-6 bg-green-50 rounded-lg p-3 max-w-2xl mx-auto border border-green-200">
          <div className="flex items-center">
            <span className="text-2xl mr-2">💡</span>
            <p className="text-sm text-green-800 italic">{funFacts[currentFactIndex]}</p>
          </div>
        </div>
      </div>

      {/* Achievements Section */}
      <Achievements />

      {/* Preset Scenarios */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Examples</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {presetScenarios.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset)}
              className="flex flex-col items-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-green-400"
              title={preset.description}
            >
              <span className="text-2xl mb-1">{preset.icon}</span>
              <span className="text-xs text-center text-gray-700">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Converter Section */}
      <div className="bg-white shadow-lg overflow-hidden rounded-lg border border-green-100 mb-8">
        <div className="bg-gradient-to-r from-green-700 to-green-500 px-6 py-4">
          <h2 className="text-xl font-bold text-white">Greenhouse Gas Conversion Calculator</h2>
          <p className="text-green-100 text-sm">Convert any greenhouse gas to another based on climate impact</p>
        </div>
        
        <div className="px-6 py-8">
          <div className="relative grid grid-cols-1 gap-y-8 gap-x-8 sm:grid-cols-2">
            {/* Reverse Button */}
            <button 
              onClick={handleReverseConversion}
              disabled={isReverseInProgress}
              className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 bg-green-600 hover:bg-green-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              aria-label="Reverse conversion"
              title="Swap source and target"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </button>
            
            {/* Source Gas Section */}
            <div className="bg-green-50 p-6 rounded-lg border border-green-100 shadow-sm">
              <h2 className="text-lg font-bold text-green-800 mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                Source
              </h2>
              
              <div>
                <label htmlFor="sourceGas" className="block text-sm font-medium text-gray-700 mb-1">
                  Greenhouse Gas
                </label>
                <div className="relative">
                  <select
                    id="sourceGas"
                    value={sourceGas}
                    onChange={(e) => setSourceGas(e.target.value)}
                    className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full text-base py-3 px-4 border-gray-300 rounded-md appearance-none bg-white"
                  >
                    {greenhouseGases.map((gas) => (
                      <option key={gas.id} value={gas.id} className="py-2">
                        {gas.name} (GWP: {gas.gwp.toLocaleString()})
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                
                {/* Gas color indicator with tooltip */}
                <div className="mt-3 flex items-center group relative">
                  <div 
                    className="w-4 h-4 rounded-full mr-2" 
                    style={{ backgroundColor: greenhouseGases.find(g => g.id === sourceGas)?.color }}
                  ></div>
                  <span className="text-sm text-gray-600">
                    {greenhouseGases.find(g => g.id === sourceGas)?.name}
                  </span>
                  <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-20">
                    <div className="bg-gray-800 text-white text-xs rounded py-2 px-3 max-w-xs">
                      {greenhouseGases.find(g => g.id === sourceGas)?.tooltip}
                      <div className="absolute bottom-0 left-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-gray-800"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="my-4">
                <label htmlFor="sourceUnit" className="block text-sm font-medium text-gray-700 mb-1">
                  Unit
                </label>
                <div className="relative">
                  <select
                    id="sourceUnit"
                    value={sourceUnit}
                    onChange={(e) => setSourceUnit(e.target.value)}
                    className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full text-base py-3 px-4 border-gray-300 rounded-md appearance-none bg-white"
                  >
                    {units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="inputValue" className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <div className="relative rounded-md shadow-sm">
                  <input
                    type="number"
                    id="inputValue"
                    value={inputValue}
                    onChange={(e) => setInputValue(parseFloat(e.target.value) || 0)}
                    className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full text-lg py-3 px-4 border-gray-300 rounded-md"
                    placeholder="Enter value"
                  />
                </div>
              </div>
            </div>

            {/* Target Gas Section */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 shadow-sm">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Target
              </h2>
              
              <div>
                <label htmlFor="targetGas" className="block text-sm font-medium text-gray-700 mb-1">
                  Greenhouse Gas
                </label>
                <div className="relative">
                  <select
                    id="targetGas"
                    value={targetGas}
                    onChange={(e) => setTargetGas(e.target.value)}
                    className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full text-base py-3 px-4 border-gray-300 rounded-md appearance-none bg-white"
                  >
                    {greenhouseGases.map((gas) => (
                      <option key={gas.id} value={gas.id} className="py-2">
                        {gas.name} (GWP: {gas.gwp.toLocaleString()})
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                
                {/* Gas color indicator with tooltip */}
                <div className="mt-3 flex items-center group relative">
                  <div 
                    className="w-4 h-4 rounded-full mr-2" 
                    style={{ backgroundColor: greenhouseGases.find(g => g.id === targetGas)?.color }}
                  ></div>
                  <span className="text-sm text-gray-600">
                    {greenhouseGases.find(g => g.id === targetGas)?.name}
                  </span>
                  <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-20">
                    <div className="bg-gray-800 text-white text-xs rounded py-2 px-3 max-w-xs">
                      {greenhouseGases.find(g => g.id === targetGas)?.tooltip}
                      <div className="absolute bottom-0 left-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-gray-800"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="my-4">
                <label htmlFor="targetUnit" className="block text-sm font-medium text-gray-700 mb-1">
                  Unit
                </label>
                <div className="relative">
                  <select
                    id="targetUnit"
                    value={targetUnit}
                    onChange={(e) => setTargetUnit(e.target.value)}
                    className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full text-base py-3 px-4 border-gray-300 rounded-md appearance-none bg-white"
                  >
                    {units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="result" className="block text-sm font-medium text-gray-700 mb-1">
                  Result
                </label>
                <div className="relative rounded-md shadow-sm">
                  <input
                    type="text"
                    id="result"
                    value={result !== null ? result.toLocaleString('en-US', { maximumFractionDigits: 6 }) : ''}
                    readOnly
                    className="shadow-sm block w-full text-lg font-semibold py-3 px-4 border-gray-300 rounded-md bg-white text-green-700"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">
                      {units.find(u => u.id === targetUnit)?.symbol}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Convert Button */}
            <div className="col-span-full flex justify-center mt-4">
              <button
                onClick={handleConvert}
                disabled={!inputValue || inputValue <= 0}
                className="px-8 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                Convert
              </button>
            </div>
          </div>

          {/* Results Display Section */}
          {result !== null && (
            <div className="mt-8">
              {/* CO2 Equivalent Result */}
              <div className="rounded-md bg-green-50 p-6 border border-green-200 shadow-inner">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-medium text-green-800">CO₂ Equivalent</h3>
                    <div className="mt-2 text-base text-green-700">
                      <div className="space-y-2">
                        <p className="font-semibold">
                          {inputValue.toLocaleString()} {units.find(u => u.id === sourceUnit)?.symbol} of{' '}
                          {greenhouseGases.find(g => g.id === sourceGas)?.name} equals{' '}
                          <span className="text-lg">{result.toLocaleString('en-US', { maximumFractionDigits: 6 })}</span>{' '}
                          {units.find(u => u.id === targetUnit)?.symbol} of {greenhouseGases.find(g => g.id === targetGas)?.name}.
                        </p>
                        <div className="text-sm text-green-600 space-y-1">
                          <p>
                            This {greenhouseGases.find(g => g.id === sourceGas)?.name} equals{' '}
                            <span className="font-semibold">{co2eResult.toLocaleString('en-US', { maximumFractionDigits: 6 })}</span>{' '}
                            {units.find(u => u.id === targetUnit)?.symbol} of CO₂ equivalent
                          </p>
                          <p>
                            This CO₂ equivalent then converts to{' '}
                            <span className="font-semibold">{result.toLocaleString('en-US', { maximumFractionDigits: 6 })}</span>{' '}
                            {units.find(u => u.id === targetUnit)?.symbol} of {greenhouseGases.find(g => g.id === targetGas)?.name}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Real-world Equivalent */}
              {realWorldEquivalent && (
                <div className="mt-4 rounded-md bg-blue-50 p-4 border border-blue-200">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">Real-world Equivalent</h3>
                      <div className="mt-1 text-sm text-blue-700">
                        <p>This amount of CO₂ equivalent is approximately equal to: <span className="font-semibold">{realWorldEquivalent}</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Offset Calculator */}
              {offsetInfo && (
                <div className="mt-4 rounded-md bg-amber-50 p-4 border border-amber-200">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-amber-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className="text-sm font-medium text-amber-800">Offset Options</h3>
                      <div className="mt-2 grid grid-cols-2 gap-3 text-sm text-amber-700">
                        <div>
                          <span className="font-semibold">🌳 {offsetInfo.trees.toLocaleString()}</span> trees for 1 year
                        </div>
                        <div>
                          <span className="font-semibold">🌲 {offsetInfo.forestAcres}</span> acres of forest
                        </div>
                        <div>
                          <span className="font-semibold">☀️ {offsetInfo.solarPanels}</span> home solar systems
                        </div>
                        <div>
                          <span className="font-semibold">💨 {offsetInfo.windTurbineHours}</span> hours of wind power
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={saveConversion}
                  disabled={!lastConversion}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 112 0v2H9V4z" />
                  </svg>
                  Save Conversion
                </button>
                <button
                  onClick={copyCalculation}
                  disabled={result === null}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                  </svg>
                  Copy Calculation
                </button>
                <button
                  onClick={downloadAsCSV}
                  disabled={conversionHistory.length === 0}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Download History
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      
      {/* Central Measure Footprint Feature */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white mb-8 shadow-xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">
            📊 Measure Your Complete Carbon Footprint
          </h2>
          <p className="text-lg mb-6 text-blue-100 max-w-2xl mx-auto">
            Get a comprehensive analysis of your personal or business carbon footprint with our advanced assessment tool
          </p>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="text-3xl mb-2">🏠</div>
              <h3 className="font-semibold mb-2">Personal Assessment</h3>
              <p className="text-sm text-blue-100">Calculate your household's complete carbon footprint</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="text-3xl mb-2">🏢</div>
              <h3 className="font-semibold mb-2">Business Analysis</h3>
              <p className="text-sm text-blue-100">Comprehensive Scope 1, 2 & 3 emissions tracking</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="text-3xl mb-2">📈</div>
              <h3 className="font-semibold mb-2">Action Plans</h3>
              <p className="text-sm text-blue-100">Get personalized reduction strategies</p>
            </div>
          </div>
          <Link 
            to="/carbon-footprint/new"
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 rounded-lg font-bold text-lg hover:bg-blue-50 transition-all transform hover:scale-105 shadow-lg"
          >
            Start Your Assessment →
          </Link>
        </div>
      </div>

      {/* ENHANCED SECTIONS WITH FUNCTIONAL CALCULATORS */}

      {/* Global Emissions Overview */}
      <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-8 shadow-lg mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Global Greenhouse Gas Emissions: The Big Picture
        </h2>
        <p className="text-lg text-gray-700 mb-6">
          Total annual emissions: <span className="font-bold text-2xl text-green-700">{globalEmissionsData.total} billion tons CO₂e</span>
        </p>
        
        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-6 border-b">
          <button
            onClick={() => setActiveTab('gas')}
            className={`pb-2 px-1 font-medium transition-colors ${
              activeTab === 'gas' 
                ? 'text-green-600 border-b-2 border-green-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            By Gas Type
          </button>
          <button
            onClick={() => setActiveTab('sector')}
            className={`pb-2 px-1 font-medium transition-colors ${
              activeTab === 'sector' 
                ? 'text-green-600 border-b-2 border-green-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            By Sector
          </button>
          <button
            onClick={() => setActiveTab('country')}
            className={`pb-2 px-1 font-medium transition-colors ${
              activeTab === 'country' 
                ? 'text-green-600 border-b-2 border-green-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            By Country
          </button>
        </div>

        {/* By Gas Type */}
        {activeTab === 'gas' && (
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Emissions by Greenhouse Gas</h3>
            <div className="space-y-4">
              {globalEmissionsData.byGas.map((item, index) => (
                <div key={index} className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-700">{item.gas}</span>
                    <span className="text-sm text-gray-600">
                      {item.amount} Gt CO₂e ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
                    <div
                      className="h-full rounded-full flex items-center justify-end px-3 transition-all duration-1000 ease-out"
                      style={{
                        backgroundColor: item.color,
                        width: `${(animatedPercentage * item.percentage) / 100}%`
                      }}
                    >
                      <span className="text-xs font-semibold text-white">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                <strong>💡 Insight:</strong> While CO₂ dominates total emissions, methane (CH₄) is 28x more potent per ton, 
                making methane reduction a high-impact climate strategy.
              </p>
            </div>
          </div>
        )}

        {/* By Sector */}
        {activeTab === 'sector' && (
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Emissions by Economic Sector</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {globalEmissionsData.bySector.map((sector, index) => (
                <div key={index} className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex items-center mb-3">
                    <span className="text-3xl mr-3">{sector.icon}</span>
                    <div>
                      <h4 className="font-semibold text-gray-900">{sector.sector}</h4>
                      <p className="text-2xl font-bold" style={{ color: sector.color }}>
                        {sector.percentage}%
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {sector.breakdown.map((item, idx) => (
                      <p key={idx} className="text-sm text-gray-600">• {item}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* By Country */}
        {activeTab === 'country' && (
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Top Emitting Countries</h3>
            <div className="space-y-3">
              {globalEmissionsData.byCountry.map((country, index) => (
                <div 
                  key={index} 
                  className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
                  onClick={() => setSelectedCountry(country)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{country.emoji}</span>
                      <div>
                        <h4 className="font-semibold text-gray-900">{country.country}</h4>
                        <p className="text-sm text-gray-600">
                          Per capita: {country.perCapita} tons/year
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{country.percentage}%</p>
                      <p className="text-sm">
                        <span className={`font-medium ${
                          country.trend === '↑' ? 'text-red-600' : 
                          country.trend === '↓' ? 'text-green-600' : 
                          'text-yellow-600'
                        }`}>
                          {country.trend} Trend
                        </span>
                      </p>
                    </div>
                  </div>
                  {selectedCountry?.country === country.country && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-1">Main emission sources:</p>
                      <div className="flex flex-wrap gap-2">
                        {country.mainSources.map((source, idx) => (
                          <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">
                            {source}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Interactive Carbon Calculator Section with FUNCTIONAL CALCULATORS */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-8 text-white mb-8">
        <h2 className="text-3xl font-bold mb-4">
          Calculate Your Impact: Real-World Emission Sources
        </h2>
        <p className="text-lg mb-6 text-green-100">
          Understand how everyday activities contribute to global emissions
        </p>
        
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-2">✈️ Air Travel</h3>
            <p className="text-sm text-green-100 mb-3">
              NYC→London = 1.6 tons CO₂ round trip
            </p>
            <button 
              onClick={() => setShowFlightCalc(!showFlightCalc)}
              className="w-full bg-white text-green-700 px-4 py-2 rounded font-medium hover:bg-green-50 transition-colors"
            >
              {showFlightCalc ? 'Hide' : 'Calculate'} Flight Emissions
            </button>
          </div>
          
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-2">🚗 Daily Commute</h3>
            <p className="text-sm text-green-100 mb-3">
              Average car emits 4.6 tons CO₂/year
            </p>
            <button 
              onClick={() => setShowCommuteCalc(!showCommuteCalc)}
              className="w-full bg-white text-green-700 px-4 py-2 rounded font-medium hover:bg-green-50 transition-colors"
            >
              {showCommuteCalc ? 'Hide' : 'Calculate'} My Commute
            </button>
          </div>
          
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-2">🏠 Home Energy</h3>
            <p className="text-sm text-green-100 mb-3">
              Average home: 7.5 tons CO₂/year
            </p>
            <button 
              onClick={() => setShowHomeCalc(!showHomeCalc)}
              className="w-full bg-white text-green-700 px-4 py-2 rounded font-medium hover:bg-green-50 transition-colors"
            >
              {showHomeCalc ? 'Hide' : 'Calculate'} Home Emissions
            </button>
          </div>
        </div>

        {/* Flight Calculator */}
        {showFlightCalc && (
          <div className="mt-6 bg-white rounded-lg p-6 text-gray-900">
            <h3 className="text-lg font-semibold mb-4">Flight Emissions Calculator</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Flight Distance (km)
                </label>
                <input
                  type="number"
                  value={flightDistance}
                  onChange={(e) => setFlightDistance(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., 5500 for NYC-London"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class
                </label>
                <select
                  value={flightClass}
                  onChange={(e) => setFlightClass(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                >
                  <option value="economy">Economy</option>
                  <option value="business">Business</option>
                  <option value="first">First Class</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <input
                type="checkbox"
                id="roundTrip"
                checked={isRoundTrip}
                onChange={(e) => setIsRoundTrip(e.target.checked)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="roundTrip" className="ml-2 text-sm text-gray-700">
                Round trip
              </label>
            </div>
            <button
              onClick={calculateFlightEmissions}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Calculate
            </button>
            {flightResult && (
              <>
                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <p className="text-lg font-semibold text-green-800">
                    Flight emissions: {(flightResult / 1000).toFixed(2)} tons CO₂
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    Equivalent to driving {Math.round(flightResult / 0.171).toLocaleString()} km
                  </p>
                </div>
                <ActionableSummary emissions={flightResult} source="flight" />
              </>
            )}
          </div>
        )}

        {/* Commute Calculator */}
        {showCommuteCalc && (
          <div className="mt-6 bg-white rounded-lg p-6 text-gray-900">
            <h3 className="text-lg font-semibold mb-4">Commute Emissions Calculator</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  One-way distance (km)
                </label>
                <input
                  type="number"
                  value={commuteDistance}
                  onChange={(e) => setCommuteDistance(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., 15"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle type
                </label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                >
                  <option value="car">Car</option>
                  <option value="suv">SUV</option>
                  <option value="motorcycle">Motorcycle</option>
                  <option value="bus">Bus</option>
                  <option value="train">Train</option>
                  <option value="electric">Electric Vehicle</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Days per week
                </label>
                <input
                  type="number"
                  value={commuteDays}
                  onChange={(e) => setCommuteDays(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., 5"
                />
              </div>
            </div>
            <button
              onClick={calculateCommuteEmissions}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Calculate Annual Emissions
            </button>
            {commuteResult && (
              <>
                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <p className="text-lg font-semibold text-green-800">
                    Annual commute emissions: {(commuteResult / 1000).toFixed(2)} tons CO₂
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    Equivalent to {Math.round(commuteResult / 22)} trees needed to offset
                  </p>
                </div>
                <ActionableSummary emissions={commuteResult} source="commute" />
              </>
            )}
          </div>
        )}
        {/* Home Energy Calculator */}
        {showHomeCalc && (
          <div className="mt-6 bg-white rounded-lg p-6 text-gray-900">
            <h3 className="text-lg font-semibold mb-4">Home Energy Emissions Calculator</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly electricity (kWh)
                </label>
                <input
                  type="number"
                  value={electricityUsage}
                  onChange={(e) => setElectricityUsage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., 850"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly natural gas (MMBtu)
                </label>
                <input
                  type="number"
                  value={gasUsage}
                  onChange={(e) => setGasUsage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., 0.5"
                />
              </div>
            </div>
            <button
              onClick={calculateHomeEmissions}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Calculate Annual Emissions
            </button>
            {homeResult && (
              <>
                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <p className="text-lg font-semibold text-green-800">
                    Annual home emissions: {(homeResult / 1000).toFixed(2)} tons CO₂
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    {Math.round(homeResult / 1500)} solar panels needed to offset
                  </p>
                </div>
                <ActionableSummary emissions={homeResult} source="home" />
              </>
            )}
          </div>
        )}
      </div>

      {/* Refrigerant Focus Section with FUNCTIONAL CALCULATOR */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Refrigerant GWP Calculator & Database
        </h2>
        <p className="text-gray-600 mb-6">
          Critical tool for HVAC professionals and facility managers tracking F-gas compliance
        </p>
        
        <div className="overflow-x-auto mb-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Refrigerant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  GWP (AR5)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Common Uses
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phase-out Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">R-32</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900">675</td>
                <td className="px-6 py-4 text-sm text-gray-600">Residential AC, heat pumps</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                    Preferred alternative
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">R-134a</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900">1,430</td>
                <td className="px-6 py-4 text-sm text-gray-600">Car AC, domestic fridges</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                    Phasing down
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">R-410A</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900">2,088</td>
                <td className="px-6 py-4 text-sm text-gray-600">Commercial AC, heat pumps</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                    Phase-out by 2025
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">R-404A</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900">3,922</td>
                <td className="px-6 py-4 text-sm text-gray-600">Commercial refrigeration</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                    Banned in EU
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">🔧 Refrigerant Leak Impact Calculator</h3>
          <button
            onClick={() => setShowRefrigerantCalc(!showRefrigerantCalc)}
            className="mb-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            {showRefrigerantCalc ? 'Hide' : 'Open'} Calculator
          </button>
          
          {showRefrigerantCalc && (
            <div className="mt-4 bg-white rounded-lg p-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Refrigerant Type
                  </label>
                  <select
                    value={refrigerantType}
                    onChange={(e) => setRefrigerantType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="hfc32">R-32 (HFC-32)</option>
                    <option value="hfc134a">R-134a (HFC-134a)</option>
                    <option value="hfc125">R-410A (contains HFC-125)</option>
                    <option value="hfc143a">R-404A (contains HFC-143a)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    System Charge (kg)
                  </label>
                  <input
                    type="number"
                    value={chargeSize}
                    onChange={(e) => setChargeSize(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Annual Leak Rate (%)
                  </label>
                  <input
                    type="number"
                    value={leakRate}
                    onChange={(e) => setLeakRate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 10"
                  />
                </div>
              </div>
              <button
                onClick={calculateRefrigerantEmissions}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Calculate Annual Emissions
              </button>
              {refrigerantResult && (
                <>
                  <div className="mt-4 p-4 bg-red-50 rounded-lg">
                    <p className="text-lg font-semibold text-red-800">
                      Annual leak emissions: {(refrigerantResult / 1000).toFixed(2)} tons CO₂e
                    </p>
                    <p className="text-sm text-red-600 mt-1">
                      Equivalent to burning {Math.round(refrigerantResult / 2.31).toLocaleString()} gallons of gasoline!
                    </p>
                  </div>
                  {refrigerantResult > 10000 && (
                    <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-semibold text-purple-800 mb-2">🏢 Commercial Opportunity</h4>
                      <p className="text-sm text-gray-700 mb-3">
                        High refrigerant emissions detected! Switching to natural refrigerants could generate carbon credits.
                      </p>
                      <Link 
                        to="/carbon-projects/assessment?type=refrigerant" 
                        className="text-purple-600 hover:text-purple-800 font-medium text-sm"
                      >
                        Explore refrigerant replacement projects →
                      </Link>
                    </div>
                  )}
                  <ActionableSummary emissions={refrigerantResult} source="refrigerant" />
                </>
              )}
            </div>
          )}
          
          <p className="text-sm text-blue-700 mt-3">
            Formula: Annual emissions = Charge size (kg) × Annual leak rate (%) × GWP
          </p>
        </div>
      </div>

      {/* Personal Impact Dashboard */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          📊 Your Personal Climate Impact Calculator
        </h2>
        <p className="text-gray-600 mb-6">
          Discover your carbon footprint based on your lifestyle choices
        </p>
        
        <button
          onClick={() => setShowPersonalDashboard(!showPersonalDashboard)}
          className="mb-6 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          {showPersonalDashboard ? 'Hide' : 'Calculate'} My Impact
        </button>

        {showPersonalDashboard && (
          <div className="space-y-6">
            {/* Transport */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                How do you primarily travel?
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  onClick={() => setLifestyle({...lifestyle, transport: 'walk'})}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    lifestyle.transport === 'walk' 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">🚶</div>
                  <div className="text-sm font-medium">Walk/Bike</div>
                  <div className="text-xs text-gray-500">0 tons/year</div>
                </button>
                <button
                  onClick={() => setLifestyle({...lifestyle, transport: 'transit'})}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    lifestyle.transport === 'transit' 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">🚌</div>
                  <div className="text-sm font-medium">Public Transit</div>
                  <div className="text-xs text-gray-500">1.2 tons/year</div>
                </button>
                <button
                  onClick={() => setLifestyle({...lifestyle, transport: 'car'})}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    lifestyle.transport === 'car' 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">🚗</div>
                  <div className="text-sm font-medium">Car</div>
                  <div className="text-xs text-gray-500">4.6 tons/year</div>
                </button>
                <button
                  onClick={() => setLifestyle({...lifestyle, transport: 'frequent_flyer'})}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    lifestyle.transport === 'frequent_flyer' 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">✈️</div>
                  <div className="text-sm font-medium">Frequent Flyer</div>
                  <div className="text-xs text-gray-500">8.5 tons/year</div>
                </button>
              </div>
            </div>

            {/* Diet */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                What's your diet like?
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  onClick={() => setLifestyle({...lifestyle, diet: 'vegan'})}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    lifestyle.diet === 'vegan' 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">🥗</div>
                  <div className="text-sm font-medium">Vegan</div>
                  <div className="text-xs text-gray-500">1.5 tons/year</div>
                </button>
                <button
                  onClick={() => setLifestyle({...lifestyle, diet: 'vegetarian'})}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    lifestyle.diet === 'vegetarian' 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">🥛</div>
                  <div className="text-sm font-medium">Vegetarian</div>
                  <div className="text-xs text-gray-500">2.5 tons/year</div>
                </button>
                <button
                  onClick={() => setLifestyle({...lifestyle, diet: 'moderate'})}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    lifestyle.diet === 'moderate' 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">🍗</div>
                  <div className="text-sm font-medium">Moderate Meat</div>
                  <div className="text-xs text-gray-500">3.5 tons/year</div>
                </button>
                <button
                  onClick={() => setLifestyle({...lifestyle, diet: 'heavy_meat'})}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    lifestyle.diet === 'heavy_meat' 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">🥩</div>
                  <div className="text-sm font-medium">Heavy Meat</div>
                  <div className="text-xs text-gray-500">5.8 tons/year</div>
                </button>
              </div>
            </div>

            {/* Home Energy */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                How energy efficient is your home?
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setLifestyle({...lifestyle, home: 'efficient'})}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    lifestyle.home === 'efficient' 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">🌟</div>
                  <div className="text-sm font-medium">Very Efficient</div>
                  <div className="text-xs text-gray-500">3.2 tons/year</div>
                </button>
                <button
                  onClick={() => setLifestyle({...lifestyle, home: 'average'})}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    lifestyle.home === 'average' 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">🏠</div>
                  <div className="text-sm font-medium">Average</div>
                  <div className="text-xs text-gray-500">7.5 tons/year</div>
                </button>
                <button
                  onClick={() => setLifestyle({...lifestyle, home: 'inefficient'})}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    lifestyle.home === 'inefficient' 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">🏚️</div>
                  <div className="text-sm font-medium">Inefficient</div>
                  <div className="text-xs text-gray-500">12.1 tons/year</div>
                </button>
              </div>
            </div>

            {/* Shopping */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                How would you describe your shopping habits?
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setLifestyle({...lifestyle, shopping: 'minimal'})}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    lifestyle.shopping === 'minimal' 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">♻️</div>
                  <div className="text-sm font-medium">Minimal</div>
                  <div className="text-xs text-gray-500">0.8 tons/year</div>
                </button>
                <button
                  onClick={() => setLifestyle({...lifestyle, shopping: 'average'})}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    lifestyle.shopping === 'average' 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">🛍️</div>
                  <div className="text-sm font-medium">Average</div>
                  <div className="text-xs text-gray-500">2.1 tons/year</div>
                </button>
                <button
                  onClick={() => setLifestyle({...lifestyle, shopping: 'heavy'})}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    lifestyle.shopping === 'heavy' 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">🛒</div>
                  <div className="text-sm font-medium">Heavy Consumer</div>
                  <div className="text-xs text-gray-500">4.2 tons/year</div>
                </button>
              </div>
            </div>

            {/* Results */}
            {personalEmissions && (
              <>
                <div className="mt-8 p-6 bg-white rounded-lg shadow-inner">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Your Annual Carbon Footprint</h3>
                  <div className="text-center">
                    <div className="text-5xl font-bold text-purple-600 mb-2">
                      {personalEmissions.toFixed(1)} tons CO₂e
                    </div>
                    <div className="text-gray-600 mb-4">
                      {personalEmissions < 10 ? '🌟 Below average!' : personalEmissions < 16 ? '📊 Near average' : '⚠️ Above average'}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="font-semibold">US Average</div>
                        <div className="text-gray-600">16 tons/year</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="font-semibold">Global Average</div>
                        <div className="text-gray-600">4.8 tons/year</div>
                      </div>
                    </div>
                    <div className="mt-4 text-sm text-gray-600">
                      <p>To offset your emissions, you would need:</p>
                      <p className="font-semibold text-green-600">
                        🌳 {Math.round(personalEmissions * 45)} trees planted annually
                      </p>
                    </div>
                  </div>
                </div>
                
                {personalEmissions > 10 && (
                  <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h4 className="font-semibold text-yellow-800 mb-2">🌱 High Impact Opportunity!</h4>
                    <p className="text-sm text-gray-700 mb-3">
                      Your emissions are above average. Have land or resources that could sequester carbon?
                    </p>
                    <Link 
                      to="/carbon-projects/assessment" 
                      className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                    >
                      Start Carbon Project Assessment →
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
      {/* Interactive Learning Module */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          🎓 Test Your Knowledge: GHG Calculations
        </h2>
        <p className="text-gray-600 mb-6">
          Practice real-world greenhouse gas calculations and improve your understanding
        </p>
        
        <button
          onClick={() => setShowLearningModule(!showLearningModule)}
          className="mb-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showLearningModule ? 'Hide' : 'Start'} Learning Module
        </button>

        {showLearningModule && (
          <div className="bg-white rounded-lg p-6">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Question {currentQuestion + 1} of {learningQuestions.length}</h3>
                <div className="text-sm text-gray-600">Score: {score}/{learningQuestions.length}</div>
              </div>
              
              <div className="mb-6">
                <p className="text-lg mb-3">{learningQuestions[currentQuestion].question}</p>
                <p className="text-sm text-blue-600 italic">💡 Hint: {learningQuestions[currentQuestion].hint}</p>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your answer"
                  disabled={showAnswer}
                />
                
                {!showAnswer && (
                  <button
                    onClick={() => {
                      setShowAnswer(true);
                      if (userAnswer.trim() === learningQuestions[currentQuestion].answer) {
                        setScore(score + 1);
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Check Answer
                  </button>
                )}

                {showAnswer && (
                  <div className={`p-4 rounded-lg ${
                    userAnswer.trim() === learningQuestions[currentQuestion].answer 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <p className="font-semibold mb-2">
                      {userAnswer.trim() === learningQuestions[currentQuestion].answer 
                        ? '✅ Correct!' 
                        : `❌ Incorrect. The answer is: ${learningQuestions[currentQuestion].answer}`}
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Explanation:</strong> {learningQuestions[currentQuestion].explanation}
                    </p>
                  </div>
                )}

                {showAnswer && currentQuestion < learningQuestions.length - 1 && (
                  <button
                    onClick={() => {
                      setCurrentQuestion(currentQuestion + 1);
                      setUserAnswer('');
                      setShowAnswer(false);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Next Question
                  </button>
                )}

                {showAnswer && currentQuestion === learningQuestions.length - 1 && (
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-lg font-semibold">Quiz Complete!</p>
                    <p className="text-2xl font-bold text-blue-600">Final Score: {score}/{learningQuestions.length}</p>
                    <button
                      onClick={() => {
                        setCurrentQuestion(0);
                        setScore(0);
                        setUserAnswer('');
                        setShowAnswer(false);
                      }}
                      className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Restart Quiz
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* What-If Scenario Explorer */}
      <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          🔮 What If? Climate Solution Explorer
        </h2>
        <p className="text-gray-600 mb-6">
          Explore the potential impact of large-scale climate solutions
        </p>

        <div className="grid md:grid-cols-3 gap-4">
          {whatIfScenarios.map((scenario) => (
            <button
              key={scenario.id}
              onClick={() => setSelectedScenario(selectedScenario?.id === scenario.id ? null : scenario)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedScenario?.id === scenario.id
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="text-3xl mb-2">{scenario.icon}</div>
              <h3 className="font-semibold text-gray-900">{scenario.title}</h3>
              <p className="text-sm text-gray-600 mt-1">Save {scenario.savings}</p>
            </button>
          ))}
        </div>

        {selectedScenario && (
          <div className="mt-6 p-6 bg-white rounded-lg shadow-inner">
            <h3 className="text-xl font-bold text-gray-900 mb-4">{selectedScenario.title}</h3>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-semibold text-red-800 mb-2">Current Reality</h4>
                <p className="text-2xl font-bold text-red-600">{selectedScenario.current}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">Potential Future</h4>
                <p className="text-2xl font-bold text-green-600">{selectedScenario.potential}</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-lg font-semibold text-gray-900 mb-2">Impact Equivalent:</p>
              <p className="text-gray-700">{selectedScenario.equivalent}</p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Key Challenges:</h4>
              <ul className="list-disc list-inside text-gray-700">
                {selectedScenario.challenges.map((challenge, idx) => (
                  <li key={idx}>{challenge}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Quick Facts Carousel */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          💡 Did You Know? Climate Facts
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl mb-2">🌡️</div>
            <p className="text-sm font-semibold text-blue-900 mb-1">Temperature Impact</p>
            <p className="text-sm text-gray-700">
            Just 1°C of warming has already caused sea levels to rise 20cm and doubled the frequency of heatwaves
            </p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl mb-2">🌳</div>
            <p className="text-sm font-semibold text-green-900 mb-1">Natural Solutions</p>
            <p className="text-sm text-gray-700">
              Protecting existing forests is 5x more effective than planting new trees for climate mitigation
            </p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl mb-2">⚡</div>
           <p className="text-sm font-semibold text-purple-900 mb-1">Renewable Growth</p>
           <p className="text-sm text-gray-700">
             Solar power is now the cheapest source of electricity in history in most countries
           </p>
         </div>
         
         <div className="bg-yellow-50 p-4 rounded-lg">
           <div className="text-2xl mb-2">🏢</div>
           <p className="text-sm font-semibold text-yellow-900 mb-1">Building Efficiency</p>
           <p className="text-sm text-gray-700">
             40% of global emissions come from buildings - but efficient buildings can reduce emissions by 90%
           </p>
         </div>
         
         <div className="bg-red-50 p-4 rounded-lg">
           <div className="text-2xl mb-2">🍔</div>
           <p className="text-sm font-semibold text-red-900 mb-1">Food Impact</p>
           <p className="text-sm text-gray-700">
             Producing 1kg of beef emits 60kg CO₂e, while 1kg of tofu emits only 3kg CO₂e
           </p>
         </div>
         
         <div className="bg-indigo-50 p-4 rounded-lg">
           <div className="text-2xl mb-2">✈️</div>
           <p className="text-sm font-semibold text-indigo-900 mb-1">Aviation Facts</p>
           <p className="text-sm text-gray-700">
             1% of the world's population accounts for 50% of aviation emissions
           </p>
         </div>
       </div>
     </div>

     {/* Solution Showcase */}
     <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg p-8 mb-8">
       <h2 className="text-3xl font-bold mb-6">
         🌟 Solutions in Action
       </h2>
       
       <div className="grid md:grid-cols-3 gap-6">
         <div className="bg-white/10 backdrop-blur rounded-lg p-6">
           <h3 className="text-xl font-semibold mb-3">Natural Refrigerants</h3>
           <p className="text-green-100 mb-4">
             CO₂, ammonia, and hydrocarbons have GWP &lt; 10 vs thousands for synthetic refrigerants
           </p>
           <div className="text-sm">
             <p className="font-semibold mb-1">Success Story:</p>
             <p className="text-green-100">Coca-Cola has installed 4 million CO₂ coolers, preventing 75M tons CO₂e</p>
           </div>
         </div>
         
         <div className="bg-white/10 backdrop-blur rounded-lg p-6">
           <h3 className="text-xl font-semibold mb-3">Regenerative Agriculture</h3>
           <p className="text-green-100 mb-4">
             Can sequester 5-15 tons CO₂/hectare/year while improving soil health
           </p>
           <div className="text-sm">
             <p className="font-semibold mb-1">Success Story:</p>
             <p className="text-green-100">General Mills working with farmers on 1M acres to reduce emissions 30%</p>
           </div>
         </div>
         
         <div className="bg-white/10 backdrop-blur rounded-lg p-6">
           <h3 className="text-xl font-semibold mb-3">Green Hydrogen</h3>
           <p className="text-green-100 mb-4">
             Zero-emission fuel for heavy industry and transportation
           </p>
           <div className="text-sm">
             <p className="font-semibold mb-1">Success Story:</p>
             <p className="text-green-100">EU investing €470B to produce 10M tons of green hydrogen by 2030</p>
           </div>
         </div>
       </div>
     </div>

     {/* Conversion History */}
     {conversionHistory.length > 0 && (
       <div className="bg-white shadow-md overflow-hidden rounded-lg mb-8">
         <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
           <h3 className="text-lg font-medium text-gray-900">Recent Conversions</h3>
         </div>
         <div className="px-6 py-4">
           <div className="space-y-3">
             {conversionHistory.map((item) => (
               <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                 <div className="flex-1">
                   <span className="text-sm text-gray-600">{item.from}</span>
                   <span className="mx-2 text-gray-400">→</span>
                   <span className="text-sm font-medium text-gray-900">{item.to}</span>
                 </div>
                 <div className="text-sm text-gray-500">
                   ({item.co2e})
                 </div>
               </div>
             ))}
           </div>
         </div>
       </div>
     )}

     {/* Visual Comparison Chart */}
     <div className="bg-white shadow-md overflow-hidden rounded-lg mb-16">
       <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
         <h3 className="text-lg font-medium text-gray-900">Global Warming Potential Comparison</h3>
         <p className="mt-1 text-sm text-gray-500">Visual comparison of all greenhouse gases relative to CO₂</p>
       </div>
       <div className="px-6 py-6">
         <div className="space-y-4">
           {sortedGases.map((gas) => (
             <div key={gas.id} className="relative group">
               <div className="flex items-center justify-between mb-1">
                 <span className="text-sm font-medium text-gray-700">{gas.name}</span>
                 <span className="text-sm text-gray-500">GWP: {gas.gwp.toLocaleString()}</span>
               </div>
               <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                 <div
                   className="h-full rounded-full transition-all duration-1000 flex items-center justify-end px-2 relative"
                   style={{
                     backgroundColor: gas.color,
                     width: `${(Math.log(gas.gwp) / Math.log(maxGWP)) * 100}%`,
                     minWidth: '60px'
                   }}
                   onMouseEnter={() => setHoveredGas(gas.id)}
                   onMouseLeave={() => setHoveredGas(null)}
                 >
                   <span className="text-xs font-semibold text-white">{gas.gwp < 100 ? gas.gwp : `${(gas.gwp / 1000).toFixed(1)}k`}</span>
                 </div>
               </div>
               {hoveredGas === gas.id && (
                 <div className="absolute z-10 mt-1 p-2 bg-gray-800 text-white text-xs rounded shadow-lg max-w-xs">
                   {gas.tooltip}
                 </div>
               )}
             </div>
           ))}
         </div>
         <p className="mt-4 text-xs text-gray-500 italic">Note: Chart uses logarithmic scale to show the wide range of GWP values</p>
       </div>
     </div>

     {/* SEO-Optimized Content Section */}
     <div className="bg-white shadow-md overflow-hidden rounded-lg mb-16 p-8">
       <h2 className="text-2xl font-bold text-gray-900 mb-6">Why Convert Between Greenhouse Gases?</h2>
       
       <div className="prose prose-lg max-w-none text-gray-700">
         <p className="mb-4">
           <strong>Greenhouse gas conversion</strong> is essential for understanding climate impact and carbon footprint calculations. Whether you're a sustainability professional, environmental scientist, or carbon accounting specialist, converting between different greenhouse gases helps you:
         </p>
         
         <ul className="list-disc pl-6 mb-6 space-y-2">
           <li><strong>Calculate carbon footprints accurately</strong> - Convert emissions from various sources (methane from agriculture, refrigerants from cooling systems, SF₆ from electrical equipment) into a common CO₂ equivalent metric</li>
           <li><strong>Meet regulatory compliance</strong> - Many environmental regulations require reporting in CO₂ equivalent terms, making GHG conversion critical for compliance</li>
           <li><strong>Compare environmental impacts</strong> - Understand which gases have the most significant warming effect and prioritize reduction efforts</li>
           <li><strong>Support sustainability reporting</strong> - Convert greenhouse gas emissions for ESG reports, sustainability disclosures, and carbon neutrality goals</li>
           <li><strong>Make informed decisions</strong> - Choose between alternatives by comparing their total global warming potential</li>
         </ul>

         <h3 className="text-xl font-semibold text-gray-800 mb-3">How GHG Conversion Works</h3>
         <p className="mb-4">
           Our greenhouse gas converter uses <strong>Global Warming Potential (GWP)</strong> values from the IPCC's Fifth Assessment Report (AR5) to convert between gases. The conversion process involves two steps:
         </p>
         <ol className="list-decimal pl-6 mb-6 space-y-2">
           <li>Convert your source gas to CO₂ equivalent by multiplying by its GWP</li>
           <li>Convert from CO₂ equivalent to your target gas by dividing by the target gas's GWP</li>
         </ol>

         <h3 className="text-xl font-semibold text-gray-800 mb-3">Common Use Cases for GHG Conversion</h3>
         <div className="grid md:grid-cols-2 gap-4 mb-6">
           <div className="bg-gray-50 p-4 rounded-lg">
             <h4 className="font-semibold text-gray-800 mb-2">🏭 Industrial Emissions</h4>
             <p className="text-sm">Convert SF₆ emissions from electrical equipment or HFC refrigerant leaks to CO₂ equivalent for corporate carbon accounting</p>
           </div>
           <div className="bg-gray-50 p-4 rounded-lg">
             <h4 className="font-semibold text-gray-800 mb-2">🌾 Agriculture</h4>
             <p className="text-sm">Calculate the CO₂ equivalent of methane from livestock or nitrous oxide from fertilizers</p>
           </div>
           <div className="bg-gray-50 p-4 rounded-lg">
             <h4 className="font-semibold text-gray-800 mb-2">🏢 Building Management</h4>
             <p className="text-sm">Convert refrigerant emissions from HVAC systems to understand their climate impact</p>
           </div>
           <div className="bg-gray-50 p-4 rounded-lg">
             <h4 className="font-semibold text-gray-800 mb-2">📊 Carbon Credits</h4>
             <p className="text-sm">Calculate carbon offset requirements by converting all emissions to CO₂ equivalent</p>
           </div>
         </div>

         <p className="text-sm text-gray-600 italic">
           This free greenhouse gas calculator supports conversions between 13 major GHGs including carbon dioxide (CO₂), methane (CH₄), nitrous oxide (N₂O), and various hydrofluorocarbons (HFCs), helping you make accurate climate impact assessments.
         </p>
       </div>
     </div>

     {/* Greenhouse Gases Information Section */}
     <div className="text-center mb-12">
       <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Greenhouse Gases</h2>
       <p className="mt-4 max-w-3xl mx-auto text-lg text-gray-500">
         Greenhouse gases trap heat in the Earth's atmosphere, contributing to global warming and climate change. 
         Each gas has a different Global Warming Potential (GWP), which measures how much heat it can trap compared to CO₂.
       </p>
     </div>
     
     <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-16">
       {greenhouseGases.map(gas => (
         <div key={gas.id} className="bg-white shadow-md overflow-hidden rounded-lg transition-all duration-300 hover:shadow-lg border border-gray-100">
           <div className="px-6 py-5 border-b border-gray-200" style={{ backgroundColor: `${gas.color}10` }}>
             <div className="flex items-center">
               <div 
                 className="w-6 h-6 rounded-full mr-3 flex-shrink-0" 
                 style={{ backgroundColor: gas.color }}
               ></div>
               <h2 className="text-xl font-semibold text-gray-900">{gas.name}</h2>
             </div>
           </div>
           <div className="px-6 py-5">
             <div className="mb-4">
               <h3 className="text-sm font-medium text-gray-500">Global Warming Potential (GWP)</h3>
               <p className="mt-1 text-lg font-semibold text-green-700">{typeof gas.gwp === 'number' ? gas.gwp.toLocaleString() : gas.gwp}</p>
             </div>
             
             <div className="mb-4">
               <p className="text-base text-gray-700">{gas.description}</p>
             </div>
             
             <div>
               <h3 className="text-sm font-medium text-gray-500 mb-2">Main Sources:</h3>
               <ul className="list-disc ml-5 text-gray-700">
                 {gas.sources.map((source, index) => (
                   <li key={index} className="text-base">{source}</li>
                 ))}
               </ul>
             </div>
           </div>
         </div>
       ))}
     </div>
     
     {/* Common Conversions Table */}
     <div className="bg-white shadow-md overflow-hidden sm:rounded-lg mb-16">
       <div className="px-4 py-5 sm:px-6">
         <h3 className="text-lg leading-6 font-medium text-gray-900">
           Common Conversions
         </h3>
         <p className="mt-1 max-w-2xl text-sm text-gray-500">
           Quick reference for commonly used conversions.
         </p>
       </div>
       <div className="border-t border-gray-200">
         <div className="overflow-x-auto">
           <table className="min-w-full divide-y divide-gray-200">
             <thead className="bg-gray-50">
               <tr>
                 <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   Source
                 </th>
                 <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   Equals
                 </th>
                 <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   Target
                 </th>
               </tr>
             </thead>
             <tbody className="bg-white divide-y divide-gray-200">
               <tr>
                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">1 ton of CO₂</td>
                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">=</td>
                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">1 ton of CO₂e</td>
               </tr>
               <tr>
                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">1 ton of CH₄</td>
                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">=</td>
                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">28 tons of CO₂e</td>
               </tr>
               <tr>
                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">1 ton of N₂O</td>
                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">=</td>
                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">265 tons of CO₂e</td>
               </tr>
               <tr>
                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">1 ton of SF₆</td>
                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">=</td>
                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">23,500 tons of CO₂e</td>
               </tr>
               <tr>
                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">1 metric ton</td>
                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">=</td>
                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2,204.62 pounds</td>
               </tr>
               <tr>
                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">1 metric ton</td>
                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">=</td>
                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">1.1023 US short tons</td>
               </tr>
             </tbody>
           </table>
         </div>
       </div>
     </div>
     
     {/* FAQ Section */}
     <div className="bg-white shadow-md overflow-hidden rounded-lg mb-16">
       <div className="px-6 py-5 border-b border-gray-200 bg-green-50">
         <h2 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h2>
       </div>
       <div className="px-6 py-5">
         <div className="space-y-6">
           <div>
             <h3 className="text-lg font-semibold text-gray-800 mb-2">What is CO₂ equivalent (CO₂e)?</h3>
             <p className="text-base text-gray-700">
               CO₂ equivalent is a metric used to compare the emissions from various greenhouse gases based on their global warming potential (GWP). 
               It represents the amount of CO₂ that would have the same global warming impact as a given amount of another greenhouse gas.
             </p>
           </div>
           
           <div>
             <h3 className="text-lg font-semibold text-gray-800 mb-2">Which greenhouse gas is worst for climate change?</h3>
             <p className="text-base text-gray-700">
               While CO₂ is the most abundant greenhouse gas, SF₆ (Sulfur Hexafluoride) has the highest GWP at 23,500 times that of CO₂. 
               However, the overall impact depends on both the GWP and the quantity emitted. CO₂ remains the primary driver of climate change due to its massive volume.
             </p>
           </div>
           
           <div>
             <h3 className="text-lg font-semibold text-gray-800 mb-2">How do I calculate my company's carbon footprint?</h3>
             <p className="text-base text-gray-700">
               To calculate your company's carbon footprint: 1) Identify all emission sources (energy, transportation, processes), 
               2) Measure the quantity of each greenhouse gas emitted, 3) Convert all emissions to CO₂ equivalent using their GWP values, 
               4) Sum all CO₂e values for your total carbon footprint. Use our converter for accurate GHG conversions.
             </p>
           </div>
           
           <div>
             <h3 className="text-lg font-semibold text-gray-800 mb-2">What are Scope 1, 2, and 3 emissions?</h3>
             <p className="text-base text-gray-700">
               Scope 1 emissions are direct emissions from sources you own or control. Scope 2 emissions are indirect emissions from purchased energy. 
               Scope 3 emissions are all other indirect emissions in your value chain. All scopes may include various greenhouse gases that need to be converted to CO₂e for reporting.
             </p>
           </div>
           
           <div>
             <h3 className="text-lg font-semibold text-gray-800 mb-2">Why do different gases have different GWP values?</h3>
             <p className="text-base text-gray-700">
               GWP values differ based on how much infrared radiation a gas absorbs and how long it remains in the atmosphere. 
               Gases like SF₆ and many HFCs have very high GWPs because they're extremely effective at trapping heat and can persist in the atmosphere for thousands of years.
             </p>
           </div>
         </div>
       </div>
     </div>

     {/* Understanding GWP Section - with dynamic CO2 equivalent example */}
     <div className="bg-white shadow-md overflow-hidden rounded-lg mb-16">
       <div className="px-6 py-5 border-b border-gray-200 bg-green-50">
         <h2 className="text-2xl font-bold text-gray-900">Understanding GWP</h2>
       </div>
       <div className="px-6 py-5">
         <p className="text-base text-gray-700 mb-4">
           Global Warming Potential (GWP) is a measure of how much energy the emissions of 1 ton of a gas will absorb over a given period of time, 
           relative to the emissions of 1 ton of carbon dioxide (CO₂). The larger the GWP, the more that a given gas warms the Earth compared to CO₂ 
           over that time period.
         </p>
         
         {/* Dynamic CO2 Equivalent Example */}
         <div className="p-4 mb-4 bg-green-50 rounded-lg border border-green-200">
           <h3 className="text-lg font-semibold text-green-800 mb-2">Conversion Methodology</h3>
           {result !== null && currentSourceGasInfo ? (
             <div className="space-y-3">
               <p className="text-base text-gray-700">
                 <span className="font-semibold">Step 1:</span> Convert {inputValue.toLocaleString()} {currentSourceGasInfo.unit} of{' '}
                 <span className="font-medium">{currentSourceGasInfo.name}</span> to CO₂ equivalent:
               </p>
               <p className="text-base text-gray-700 ml-4">
                 {inputValue.toLocaleString()} × {currentSourceGasInfo.gwp.toLocaleString()} (GWP) = {' '}
                 <span className="font-bold">{(inputValue * units.find(u => u.id === sourceUnit)?.multiplier * currentSourceGasInfo.gwp / units.find(u => u.id === targetUnit)?.multiplier).toLocaleString('en-US', { maximumFractionDigits: 6 })}</span>{' '}
                 {units.find(u => u.id === targetUnit)?.symbol} CO₂e
               </p>
               <p className="text-base text-gray-700">
                 <span className="font-semibold">Step 2:</span> Convert CO₂ equivalent to {greenhouseGases.find(g => g.id === targetGas)?.name}:
               </p>
               <p className="text-base text-gray-700 ml-4">
                 {(inputValue * units.find(u => u.id === sourceUnit)?.multiplier * currentSourceGasInfo.gwp / units.find(u => u.id === targetUnit)?.multiplier).toLocaleString('en-US', { maximumFractionDigits: 6 })} ÷ {greenhouseGases.find(g => g.id === targetGas)?.gwp.toLocaleString()} (GWP) = {' '}
                 <span className="font-bold">{result.toLocaleString('en-US', { maximumFractionDigits: 6 })}</span>{' '}
                 {units.find(u => u.id === targetUnit)?.symbol} {greenhouseGases.find(g => g.id === targetGas)?.name}
               </p>
             </div>
           ) : (
             <p className="text-base text-gray-700">
               Enter values above to see the conversion calculation methodology.
             </p>
           )}
         </div>
         
         <p className="text-base text-gray-700 mb-4">
           GWP values allow for comparisons of the global warming impacts of different gases. For example, methane (CH₄) has a GWP of 28, 
           which means that 1 kg of methane will trap 28 times more heat than 1 kg of carbon dioxide over a 100-year period.
         </p>
         <p className="text-base text-gray-700">
           The GWP values used in this converter are based on the IPCC Fifth Assessment Report (AR5) and represent the global warming 
           impact over a 100-year time horizon. Some gases, like the perfluorocarbons and sulfur hexafluoride, 
           remain in the atmosphere for thousands of years, which contributes to their extremely high GWP values.
         </p>
       </div>
     </div>

     
      {/* Related Tools Section */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Climate Tools</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/carbon-footprint/new" className="block p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <h4 className="font-medium text-gray-900 mb-1">Carbon Footprint Assessment</h4>
            <p className="text-sm text-gray-600">Measure and analyze your carbon footprint</p>
          </Link>
          <Link to="/marketplace" className="block p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <h4 className="font-medium text-gray-900 mb-1">Browse Carbon Technologies</h4>
            <p className="text-sm text-gray-600">Explore carbon reduction technologies</p>
            <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">New</span>
          </Link>
          <Link to="/projects" className="block p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <h4 className="font-medium text-gray-900 mb-1">Browse Projects</h4>
            <p className="text-sm text-gray-600">Explore active carbon sequestration projects</p>
          </Link>
        </div>
      </div>

     {/* Final CTA Section */}
     <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-8 text-white text-center mb-8">
       <h2 className="text-3xl font-bold mb-4">
         Ready to Make a Difference?
       </h2>
       <p className="text-lg mb-6 text-green-100 max-w-2xl mx-auto">
         You've calculated your emissions. Now it's time to take action. Browse verified carbon offset projects or start your own!
       </p>
       <div className="flex flex-col sm:flex-row gap-4 justify-center">
         <Link 
           to="/projects"
           className="inline-flex items-center justify-center px-8 py-3 bg-white text-green-700 rounded-lg font-semibold hover:bg-green-50 transition-colors"
         >
           Browse Carbon Credits
           <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">New</span>
         </Link>
         <Link 
           to="/carbon-projects/assessment"
           className="inline-flex items-center justify-center px-8 py-3 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-colors"
         >
           Start Your Project →
         </Link>
       </div>
     </div>
   </div>
 );
}

export default CombinedConverterPage;