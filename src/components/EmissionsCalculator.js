// COMPLETE SECTION 1: IMPORTS, STATE, AND INITIAL SETUP
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend 
} from 'recharts';
import api from '../api-config';
import CarbonCreditsBrowser from './CarbonCreditsBrowser';

// Simple Tooltip component (since it's not imported)
const Tooltip = ({ text, children }) => (
  <div className="relative group">
    {children}
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
      {text}
    </div>
  </div>
);

const EmissionsCalculator = ({ 
  projectId, 
  initialData, 
  onSave, 
  organizationInfo = {}, 
  reportingYear 
}) => {
  // State variables
  const [rawInputs, setRawInputs] = useState({});
  const [emissionValues, setEmissionValues] = useState({
    stationary: 0,
    mobile: 0,
    refrigerants: 0,
    process: 0,
    electricity: 0,
    steam: 0,
    heating: 0,
    cooling: 0,
    purchased_goods: 0,
    business_travel: 0,
    employee_commuting: 0,
    waste: 0,
    waterUsage: 0,
    livestock: 0,
    fertilizers: 0,
    landConverted: 0
  });
  const [reductionStrategies, setReductionStrategies] = useState([]);
  const [reductionTarget, setReductionTarget] = useState(20);
  const [activeSection, setActiveSection] = useState({
    location: false,
    direct: true,
    indirect: false,
    valueChain: false,
    results: false,
    target: false,
    strategies: false,
    offsets: false,
    summary: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [reportingRequirements, setReportingRequirements] = useState([]);
  const [emissionFactors, setEmissionFactors] = useState([]);
  const [showCreditsBrowser, setShowCreditsBrowser] = useState(false);
  const [selectedCarbonProjects, setSelectedCarbonProjects] = useState([]);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editQuantity, setEditQuantity] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  // Extract values from organizationInfo with safe defaults
  const {
    industryType = '',
    location = '',
    employeeCount = 0,
    annualRevenue = 0,
    setLocation = () => {}
  } = organizationInfo;

  // Normalize industry type - memoized to prevent recalculations
  const normalizedIndustryType = useMemo(() => {
    return industryType.toLowerCase().replace(/[^a-z]/g, '');
  }, [industryType]);

  // Mock industries data - memoized to prevent recreation
  const industries = useMemo(() => [
    { id: 'manufacturing', name: 'Manufacturing' },
    { id: 'retail', name: 'Retail' },
    { id: 'services', name: 'Services' },
    { id: 'agriculture', name: 'Agriculture' },
    { id: 'transportation', name: 'Transportation' },
    { id: 'construction', name: 'Construction' },
    { id: 'healthcare', name: 'Healthcare' },
    { id: 'education', name: 'Education' },
    { id: 'technology', name: 'Technology' },
    { id: 'hospitality', name: 'Hospitality' }
  ], []);

  // Colors for charts
  const COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#d35400'];
  const scopeColors = {
    'Scope 1': '#e74c3c',
    'Scope 2': '#3498db', 
    'Scope 3': '#2ecc71'
  };
  // COMPLETE SECTION 2: MOCK DATA AND EVENT HANDLERS

  // Mock data for reporting requirements
  const getMockReportingRequirements = (location) => {
    const requirements = {
      'australia': [{
        requirement_name: 'NGER Scheme',
        description: 'National Greenhouse and Energy Reporting',
        threshold_emissions: 25000,
        is_mandatory: true,
        applicable_industries: ['manufacturing', 'energy', 'mining'],
        legislation_name: 'NGER Act 2007',
        legislation_url: 'https://www.cleanenergyregulator.gov.au/NGER',
        regulatory_body: 'Clean Energy Regulator',
        reporting_deadline: 'October 31 annually',
        legislation_summary: 'Mandatory reporting for facilities emitting 25,000 tonnes CO2e or more annually'
      }],
      'united_states': [{
        requirement_name: 'EPA GHG Reporting',
        description: 'EPA Greenhouse Gas Reporting Program',
        threshold_emissions: 25000,
        is_mandatory: true,
        applicable_industries: ['manufacturing', 'energy', 'transportation'],
        legislation_name: 'Clean Air Act',
        legislation_url: 'https://www.epa.gov/ghgreporting',
        regulatory_body: 'Environmental Protection Agency',
        reporting_deadline: 'March 31 annually',
        legislation_summary: 'Annual reporting required for facilities emitting 25,000 metric tons CO2e or more'
      }],
      'european_union': [{
        requirement_name: 'EU ETS',
        description: 'EU Emissions Trading System',
        threshold_emissions: 10000,
        is_mandatory: true,
        applicable_industries: ['energy', 'manufacturing', 'aviation'],
        legislation_name: 'EU ETS Directive',
        legislation_url: 'https://ec.europa.eu/clima/eu-action/eu-emissions-trading-system-eu-ets_en',
        regulatory_body: 'European Commission',
        reporting_deadline: 'March 31 annually',
        legislation_summary: 'Cap-and-trade system requiring allowances for emissions above threshold'
      }],
      'united_kingdom': [{
        requirement_name: 'SECR',
        description: 'Streamlined Energy and Carbon Reporting',
        threshold_emissions: 40000,
        is_mandatory: true,
        applicable_industries: ['all'],
        legislation_name: 'Companies Act 2006',
        legislation_url: 'https://www.gov.uk/government/publications/environmental-reporting-guidelines-including-mandatory-greenhouse-gas-emissions-reporting-guidance',
        regulatory_body: 'UK Government',
        reporting_deadline: 'Within annual report filing',
        legislation_summary: 'Large companies must report energy and carbon emissions in annual reports'
      }],
      'canada': [{
        requirement_name: 'GHGRP',
        description: 'Greenhouse Gas Reporting Program',
        threshold_emissions: 50000,
        is_mandatory: true,
        applicable_industries: ['manufacturing', 'energy', 'mining'],
        legislation_name: 'Canadian Environmental Protection Act',
        legislation_url: 'https://www.canada.ca/en/environment-climate-change/services/climate-change/greenhouse-gas-emissions/facility-reporting.html',
        regulatory_body: 'Environment and Climate Change Canada',
        reporting_deadline: 'June 1 annually',
        legislation_summary: 'Annual reporting for facilities emitting 50,000 tonnes CO2e or more'
      }],
      'new_zealand': [{
        requirement_name: 'NZ ETS',
        description: 'New Zealand Emissions Trading Scheme',
        threshold_emissions: 25000,
        is_mandatory: true,
        applicable_industries: ['energy', 'industrial', 'waste', 'forestry'],
        legislation_name: 'Climate Change Response Act 2002',
        legislation_url: 'https://www.epa.govt.nz/industry-areas/emissions-trading-scheme/',
        regulatory_body: 'Environmental Protection Authority',
        reporting_deadline: 'March 31 annually',
        legislation_summary: 'Mandatory participation in ETS for facilities above threshold'
      }],
      'japan': [{
        requirement_name: 'GHG Reporting System',
        description: 'Mandatory GHG Accounting and Reporting',
        threshold_emissions: 3000,
        is_mandatory: true,
        applicable_industries: ['manufacturing', 'energy', 'commercial'],
        legislation_name: 'Act on Promotion of Global Warming Countermeasures',
        legislation_url: 'https://www.env.go.jp/en/earth/cc/ghg-report.html',
        regulatory_body: 'Ministry of Environment',
        reporting_deadline: 'July 31 annually',
        legislation_summary: 'Annual reporting for facilities consuming energy equivalent to 1,500kL crude oil or more'
      }],
      'south_korea': [{
        requirement_name: 'K-ETS',
        description: 'Korean Emissions Trading Scheme',
        threshold_emissions: 125000,
        is_mandatory: true,
        applicable_industries: ['energy', 'manufacturing', 'buildings', 'transportation'],
        legislation_name: 'Act on Allocation and Trading of Greenhouse Gas Emissions Allowances',
        legislation_url: 'https://www.gir.go.kr/eng/index.do',
        regulatory_body: 'Ministry of Environment',
        reporting_deadline: 'March 31 annually',
        legislation_summary: 'Mandatory cap-and-trade for companies emitting 125,000 tCO2e or more'
      }],
      'singapore': [{
        requirement_name: 'Carbon Tax',
        description: 'Carbon Pricing Act',
        threshold_emissions: 25000,
        is_mandatory: true,
        applicable_industries: ['manufacturing', 'power', 'waste', 'water'],
        legislation_name: 'Carbon Pricing Act 2018',
        legislation_url: 'https://www.nea.gov.sg/our-services/climate-change-energy-efficiency/climate-change/carbon-tax',
        regulatory_body: 'National Environment Agency',
        reporting_deadline: 'March 31 annually',
        legislation_summary: 'Carbon tax of S$25/tCO2e for facilities emitting 25,000 tCO2e or more'
      }],
      'switzerland': [{
        requirement_name: 'CO2 Act',
        description: 'Federal Act on CO2 Emissions Reduction',
        threshold_emissions: 10000,
        is_mandatory: true,
        applicable_industries: ['manufacturing', 'energy', 'services'],
        legislation_name: 'Federal Act on the Reduction of CO2 Emissions',
        legislation_url: 'https://www.bafu.admin.ch/bafu/en/home/topics/climate/info-specialists/reduction-measures/co2-levy.html',
        regulatory_body: 'Federal Office for the Environment',
        reporting_deadline: 'March 31 annually',
        legislation_summary: 'CO2 levy exemption possible with emission reduction commitments'
      }]
    };
    return requirements[location] || [];
  };

  // Mock emission factors
  const getMockEmissionFactors = (location) => {
    const baseFactors = [
      { factorName: 'Natural Gas Combustion', factorValue: 0.185 },
      { factorName: 'Diesel Combustion', factorValue: 2.68 },
      { factorName: 'Petrol Combustion', factorValue: 2.31 },
      { factorName: 'R-410A Refrigerant', factorValue: 2088 },
      { factorName: 'R-134a Refrigerant', factorValue: 1430 },
      { factorName: 'Business Air Travel', factorValue: 0.185 },
      { factorName: 'Employee Commuting', factorValue: 0.155 },
      { factorName: 'Waste to Landfill', factorValue: 467 },
      { factorName: 'Purchased Goods and Services', factorValue: 0.5 }
    ];

    const gridFactors = {
      'AU': 0.79,
      'US': 0.417,
      'EU': 0.295,
      'GB': 0.233,
      'CN': 0.555,
      'IN': 0.82,
      'CA': 0.13,
      'JP': 0.441,
      'BR': 0.075,
      'australia': 0.79,
      'united_states': 0.417,
      'european_union': 0.295,
      'united_kingdom': 0.233,
      'canada': 0.13,
      'new_zealand': 0.126,
      'japan': 0.441,
      'south_korea': 0.459,
      'singapore': 0.408,
      'switzerland': 0.128
    };

    return [
      ...baseFactors,
      { 
        factorName: `Grid Electricity - ${location}`, 
        factorValue: gridFactors[location] || 0.5 
      }
    ];
  };

  // Handler for carbon project selection - Updated to merge projects
  const handleProjectSelection = useCallback((projects) => {
    setSelectedCarbonProjects(prevProjects => {
      // Merge new projects with existing ones, avoiding duplicates
      const existingIds = prevProjects.map(p => p.id);
      const newProjects = projects.filter(p => !existingIds.includes(p.id));
      return [...prevProjects, ...newProjects];
    });
    console.log('Selected projects for offsetting:', projects);
  }, []);

  // New handlers for project editing
  const handleEditProject = useCallback((projectId) => {
    const project = selectedCarbonProjects.find(p => p.id === projectId);
    if (project) {
      setEditingProjectId(projectId);
      setEditQuantity(project.selectedQuantity || 1);
    }
  }, [selectedCarbonProjects]);

  const handleSaveProjectEdit = useCallback((projectId) => {
    setSelectedCarbonProjects(prevProjects => 
      prevProjects.map(project => 
        project.id === projectId 
          ? { ...project, selectedQuantity: editQuantity }
          : project
      )
    );
    setEditingProjectId(null);
    setEditQuantity(0);
  }, [editQuantity]);

  const handleCancelEdit = useCallback(() => {
    setEditingProjectId(null);
    setEditQuantity(0);
  }, []);

  const handleRemoveProject = useCallback((projectId) => {
    setSelectedCarbonProjects(prevProjects => 
      prevProjects.filter(p => p.id !== projectId)
    );
  }, []);

  // Helper functions - memoized to prevent re-creation
  const toggleSection = useCallback((section) => {
    setActiveSection(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  const handleRawInputChange = useCallback((inputId, value) => {
    const numericValue = parseFloat(value) || 0;
    setRawInputs(prev => ({
      ...prev,
      [inputId]: numericValue
    }));
  }, []);

  const handleTargetChange = useCallback((e) => {
    setReductionTarget(parseInt(e.target.value));
  }, []);

  const addReductionStrategy = useCallback(() => {
    const currentYear = new Date().getFullYear();
    setReductionStrategies(prev => [...prev, {
      name: '',
      description: '',
      category: 'energy-efficiency', // New field for categorization
      reductionPotential: 0,
      reductionType: 'percentage', // 'percentage' or 'absolute'
      reductionTonnes: 0,
      implementationCost: 'medium',
      timeframe: 'medium',
      implementationYear: currentYear, // When implementation starts
      fullRealizationYear: currentYear + 1, // When full reduction is achieved
      yearlyReductions: {}, // Yearly breakdown of reductions
      isConfirmed: false
    }]);
  }, []);

  const removeReductionStrategy = useCallback((index) => {
    setReductionStrategies(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleStrategyChange = useCallback((index, field, value) => {
    setReductionStrategies(prev => prev.map((strategy, i) => {
      if (i !== index) return strategy;
      
      const updated = { ...strategy, [field]: value };
      
      // Auto-calculate full realization year based on timeframe
      if (field === 'timeframe') {
        const baseYear = updated.implementationYear || new Date().getFullYear();
        switch(value) {
          case 'short':
            updated.fullRealizationYear = baseYear;
            break;
          case 'medium':
            updated.fullRealizationYear = baseYear + 2;
            break;
          case 'long':
            updated.fullRealizationYear = baseYear + 4;
            break;
          default:
            updated.fullRealizationYear = baseYear + 1;
        }
      }
      
      return updated;
    }));
  }, []);

  const confirmReductionStrategy = useCallback((index) => {
    setReductionStrategies(prev => prev.map((strategy, i) => 
      i === index ? { ...strategy, isConfirmed: true } : strategy
    ));
  }, []);


  // COMPLETE SECTION 3: INDUSTRY INPUTS AND CALCULATIONS

  // Get industry-specific raw input fields - memoized to prevent infinite loops
  const getIndustryRawInputs = useCallback(() => {
    // Common inputs that apply to all industries
    const commonInputs = {
      purchasedGoods: { id: 'purchasedGoods', label: 'Purchased Goods & Services ($)', icon: '💰', tip: 'Total annual spend on purchased goods and services' }
    };

    switch(normalizedIndustryType) {
      case 'manufacturing':
        return {
          stationary: [
            { id: 'naturalGas', label: 'Natural Gas (therms)', icon: '🔥', tip: 'Total natural gas consumed in therms' }
          ],
          mobile: [
            { id: 'diesel', label: 'Diesel (liters)', icon: '⛽', tip: 'Total diesel fuel consumed in liters' },
            { id: 'petrol', label: 'Petrol (liters)', icon: '⛽', tip: 'Total petrol fuel consumed in liters' }
          ],
          process: [
            { id: 'steelProduction', label: 'Steel Production (tonnes)', icon: '🏭', tip: 'Total steel produced in tonnes' },
            { id: 'cementProduction', label: 'Cement Production (tonnes)', icon: '🏭', tip: 'Total cement produced in tonnes' },
            { id: 'chemicalUsage', label: 'Chemical Usage (tonnes)', icon: '⚗️', tip: 'Total chemicals used in tonnes' }
          ],
          refrigerants: [
            { id: 'refrigerantR410a', label: 'R-410A Refrigerant (kg)', icon: '❄️', tip: 'Total R-410A refrigerant leaked in kg' }
          ],
          electricity: [
            { id: 'electricity', label: 'Electricity (kWh)', icon: '⚡', tip: 'Total electricity consumed in kWh' }
          ],
          steam: [
            { id: 'steamPurchased', label: 'Purchased Steam (MMBtu)', icon: '♨️', tip: 'Total purchased steam in MMBtu' }
          ],
          other: [
            commonInputs.purchasedGoods,
            { id: 'wasteGenerated', label: 'Waste Generated (tonnes)', icon: '🗑️', tip: 'Total waste generated in tonnes' },
            { id: 'waterUsage', label: 'Water Usage (cubic meters)', icon: '💧', tip: 'Total water used in cubic meters' },
            { id: 'businessFlights', label: 'Business Flights (passenger miles)', icon: '✈️', tip: 'Total business travel in passenger miles' }
          ]
        };
      
      case 'retail':
        return {
          stationary: [
            { id: 'naturalGas', label: 'Natural Gas (therms)', icon: '🔥', tip: 'Total natural gas consumed in therms' }
          ],
          mobile: [
            { id: 'diesel', label: 'Delivery Fleet Diesel (liters)', icon: '⛽', tip: 'Total diesel fuel consumed by delivery fleet in liters' },
            { id: 'petrol', label: 'Company Vehicles Petrol (liters)', icon: '⛽', tip: 'Total petrol fuel consumed by company vehicles in liters' }
          ],
          refrigerants: [
            { id: 'refrigerantR410a', label: 'R-410A Refrigerant (kg)', icon: '❄️', tip: 'Total R-410A refrigerant leaked in kg' },
            { id: 'refrigerationUnits', label: 'Refrigeration Units (count)', icon: '🧊', tip: 'Number of refrigeration units' }
          ],
          electricity: [
            { id: 'electricity', label: 'Store Electricity (kWh)', icon: '⚡', tip: 'Total electricity consumed in kWh' }
          ],
          facility: [
            { id: 'storeArea', label: 'Store Area (square meters)', icon: '🏪', tip: 'Total retail space in square meters' }
          ],
          other: [
            commonInputs.purchasedGoods,
            { id: 'wasteGenerated', label: 'Packaging Waste (tonnes)', icon: '🗑️', tip: 'Total packaging waste in tonnes' },
            { id: 'employeeCommuting', label: 'Employee Commuting (passenger miles)', icon: '🚗', tip: 'Total employee commuting in passenger miles' },
            { id: 'paperConsumption', label: 'Paper Consumption (reams)', icon: '📄', tip: 'Total paper consumed in reams' }
          ]
        };
      
      case 'services':
        return {
          stationary: [
            { id: 'naturalGas', label: 'Natural Gas (therms)', icon: '🔥', tip: 'Total natural gas consumed in therms' }
          ],
          mobile: [
            { id: 'petrol', label: 'Company Vehicles Petrol (liters)', icon: '⛽', tip: 'Total petrol fuel consumed by company vehicles in liters' }
          ],
          electricity: [
            { id: 'electricity', label: 'Office Electricity (kWh)', icon: '⚡', tip: 'Total electricity consumed in kWh' }
          ],
          cooling: [
            { id: 'coolingPurchased', label: 'Office Cooling (MMBtu)', icon: '❄️', tip: 'Total purchased cooling in MMBtu' }
          ],
          other: [
            commonInputs.purchasedGoods,
            { id: 'businessFlights', label: 'Business Flights (passenger miles)', icon: '✈️', tip: 'Total business travel in passenger miles' },
            { id: 'employeeCommuting', label: 'Employee Commuting (passenger miles)', icon: '🚗', tip: 'Total employee commuting in passenger miles' },
            { id: 'paperConsumption', label: 'Paper Consumption (reams)', icon: '📄', tip: 'Total paper consumed in reams' },
            { id: 'waterUsage', label: 'Water Usage (cubic meters)', icon: '💧', tip: 'Total water used in cubic meters' }
          ]
        };
      
      case 'agriculture':
        return {
          stationary: [
            { id: 'naturalGas', label: 'Natural Gas (therms)', icon: '🔥', tip: 'Total natural gas consumed in therms' }
          ],
          mobile: [
            { id: 'diesel', label: 'Farm Equipment Diesel (liters)', icon: '⛽', tip: 'Total diesel fuel consumed by farm equipment in liters' },
            { id: 'petrol', label: 'Farm Vehicles Petrol (liters)', icon: '⛽', tip: 'Total petrol fuel consumed by farm vehicles in liters' }
          ],
          livestock: [
            { id: 'livestockCattle', label: 'Cattle (head)', icon: '🐄', tip: 'Number of cattle' },
            { id: 'livestockPigs', label: 'Pigs (head)', icon: '🐖', tip: 'Number of pigs' },
            { id: 'livestockSheep', label: 'Sheep (head)', icon: '🐑', tip: 'Number of sheep' }
          ],
          land: [
            { id: 'landArea', label: 'Land Area (hectares)', icon: '🌾', tip: 'Total land area in hectares' },
            { id: 'fertilizersNitrogen', label: 'Nitrogen Fertilizers (kg)', icon: '💦', tip: 'Total nitrogen fertilizers applied in kg' }
          ],
          electricity: [
            { id: 'electricity', label: 'Farm Electricity (kWh)', icon: '⚡', tip: 'Total electricity consumed in kWh' }
          ],
          other: [
            commonInputs.purchasedGoods,
            { id: 'waterUsage', label: 'Water Usage (cubic meters)', icon: '💧', tip: 'Total water used in cubic meters' }
          ]
        };
      
      case 'transportation':
        return {
          fleet: [
            { id: 'lightDutyVehicles', label: 'Light Duty Vehicles (count)', icon: '🚗', tip: 'Number of light duty vehicles' },
            { id: 'mediumDutyVehicles', label: 'Medium Duty Vehicles (count)', icon: '🚚', tip: 'Number of medium duty vehicles' },
            { id: 'heavyDutyVehicles', label: 'Heavy Duty Vehicles (count)', icon: '🚛', tip: 'Number of heavy duty vehicles' }
          ],
          fuel: [
            { id: 'diesel', label: 'Diesel (liters)', icon: '⛽', tip: 'Total diesel fuel consumed in liters' },
            { id: 'petrol', label: 'Petrol (liters)', icon: '⛽', tip: 'Total petrol fuel consumed in liters' }
          ],
          refrigerants: [
            { id: 'refrigerantR134a', label: 'R-134a Refrigerant (kg)', icon: '❄️', tip: 'Total R-134a refrigerant leaked in kg' }
          ],
          electricity: [
            { id: 'electricity', label: 'Facility Electricity (kWh)', icon: '⚡', tip: 'Total electricity consumed in kWh' }
          ],
          other: [
            commonInputs.purchasedGoods,
            { id: 'employeeCommuting', label: 'Employee Commuting (passenger miles)', icon: '🚗', tip: 'Total employee commuting in passenger miles' }
          ]
        };
        
      case 'construction':
        return {
          equipment: [
            { id: 'diesel', label: 'Equipment Diesel (liters)', icon: '⛽', tip: 'Total diesel fuel consumed by equipment in liters' },
            { id: 'petrol', label: 'Vehicle Petrol (liters)', icon: '⛽', tip: 'Total petrol fuel consumed by vehicles in liters' }
          ],
          electricity: [
            { id: 'electricity', label: 'Site Electricity (kWh)', icon: '⚡', tip: 'Total electricity consumed in kWh' }
          ],
          materials: [
            { id: 'steelProduction', label: 'Steel Used (tonnes)', icon: '🏗️', tip: 'Total steel used in tonnes' },
            { id: 'cementProduction', label: 'Cement Used (tonnes)', icon: '🏗️', tip: 'Total cement used in tonnes' }
          ],
          other: [
            commonInputs.purchasedGoods,
            { id: 'wasteGenerated', label: 'Construction Waste (tonnes)', icon: '🗑️', tip: 'Total construction waste in tonnes' }
          ]
        };
        
      case 'healthcare':
        return {
          stationary: [
            { id: 'naturalGas', label: 'Natural Gas (therms)', icon: '🔥', tip: 'Total natural gas consumed in therms' }
          ],
          mobile: [
            { id: 'diesel', label: 'Ambulance Diesel (liters)', icon: '⛽', tip: 'Total diesel fuel consumed by ambulances in liters' },
            { id: 'petrol', label: 'Staff Vehicles Petrol (liters)', icon: '⛽', tip: 'Total petrol fuel consumed by staff vehicles in liters' }
          ],
          refrigerants: [
            { id: 'refrigerantR410a', label: 'R-410A Refrigerant (kg)', icon: '❄️', tip: 'Total R-410A refrigerant leaked in kg' }
          ],
          electricity: [
            { id: 'electricity', label: 'Facility Electricity (kWh)', icon: '⚡', tip: 'Total electricity consumed in kWh' }
          ],
          other: [
            commonInputs.purchasedGoods,
            { id: 'wasteGenerated', label: 'Medical Waste (tonnes)', icon: '🗑️', tip: 'Total medical waste in tonnes' },
            { id: 'waterUsage', label: 'Water Usage (cubic meters)', icon: '💧', tip: 'Total water used in cubic meters' },
            { id: 'businessFlights', label: 'Staff Travel (passenger miles)', icon: '✈️', tip: 'Total staff travel in passenger miles' }
          ]
        };
      
      case 'education':
        return {
          stationary: [
            { id: 'naturalGas', label: 'Natural Gas (therms)', icon: '🔥', tip: 'Total natural gas consumed in therms' }
          ],
          mobile: [
            { id: 'diesel', label: 'School Buses Diesel (liters)', icon: '⛽', tip: 'Total diesel fuel consumed by school buses in liters' }
          ],
          electricity: [
            { id: 'electricity', label: 'Campus Electricity (kWh)', icon: '⚡', tip: 'Total electricity consumed in kWh' }
          ],
          cooling: [
            { id: 'coolingPurchased', label: 'Campus Cooling (MMBtu)', icon: '❄️', tip: 'Total purchased cooling in MMBtu' }
          ],
          other: [
            commonInputs.purchasedGoods,
            { id: 'wasteGenerated', label: 'Campus Waste (tonnes)', icon: '🗑️', tip: 'Total campus waste in tonnes' },
            { id: 'waterUsage', label: 'Water Usage (cubic meters)', icon: '💧', tip: 'Total water used in cubic meters' },
            { id: 'employeeCommuting', label: 'Staff Commuting (passenger miles)', icon: '🚗', tip: 'Total staff commuting in passenger miles' },
            { id: 'paperConsumption', label: 'Paper Consumption (reams)', icon: '📄', tip: 'Total paper consumed in reams' }
          ]
        };
      
      case 'technology':
        return {
          stationary: [
            { id: 'naturalGas', label: 'Natural Gas (therms)', icon: '🔥', tip: 'Total natural gas consumed in therms' }
          ],
          mobile: [
            { id: 'petrol', label: 'Company Vehicles Petrol (liters)', icon: '⛽', tip: 'Total petrol fuel consumed by company vehicles in liters' }
          ],
          dataCenter: [
            { id: 'serverCount', label: 'Server Count (number)', icon: '💻', tip: 'Number of servers' },
            { id: 'dataCenter', label: 'Data Center Electricity (kWh)', icon: '⚡', tip: 'Total data center electricity in kWh' }
          ],
          electricity: [
            { id: 'electricity', label: 'Office Electricity (kWh)', icon: '⚡', tip: 'Total office electricity consumed in kWh' }
          ],
          cooling: [
            { id: 'coolingPurchased', label: 'Office Cooling (MMBtu)', icon: '❄️', tip: 'Total purchased cooling in MMBtu' }
          ],
          other: [
            commonInputs.purchasedGoods,
            { id: 'businessFlights', label: 'Business Flights (passenger miles)', icon: '✈️', tip: 'Total business travel in passenger miles' },
            { id: 'employeeCommuting', label: 'Employee Commuting (passenger miles)', icon: '🚗', tip: 'Total employee commuting in passenger miles' }
          ]
        };
        
      case 'hospitality':
        return {
          stationary: [
            { id: 'naturalGas', label: 'Natural Gas (therms)', icon: '🔥', tip: 'Total natural gas consumed in therms' }
          ],
          refrigerants: [
            { id: 'refrigerantR410a', label: 'R-410A Refrigerant (kg)', icon: '❄️', tip: 'Total R-410A refrigerant leaked in kg' },
            { id: 'refrigerationUnits', label: 'Refrigeration Units (count)', icon: '🧊', tip: 'Number of refrigeration units' }
          ],
          mobile: [
            { id: 'petrol', label: 'Hotel Vehicles Petrol (liters)', icon: '⛽', tip: 'Total petrol fuel consumed by hotel vehicles in liters' }
          ],
          electricity: [
            { id: 'electricity', label: 'Facility Electricity (kWh)', icon: '⚡', tip: 'Total electricity consumed in kWh' }
          ],
          cooling: [
            { id: 'coolingPurchased', label: 'Air Conditioning (MMBtu)', icon: '❄️', tip: 'Total purchased cooling in MMBtu' }
          ],
          other: [
            commonInputs.purchasedGoods,
            { id: 'wasteGenerated', label: 'Hotel Waste (tonnes)', icon: '🗑️', tip: 'Total hotel waste in tonnes' },
            { id: 'waterUsage', label: 'Water Usage (cubic meters)', icon: '💧', tip: 'Total water used in cubic meters' },
            { id: 'employeeCommuting', label: 'Staff Commuting (passenger miles)', icon: '🚗', tip: 'Total staff commuting in passenger miles' }
          ]
        };
      
      default:
        return {
          stationary: [
            { id: 'naturalGas', label: 'Natural Gas (therms)', icon: '🔥', tip: 'Total natural gas consumed in therms' }
          ],
          mobile: [
            { id: 'diesel', label: 'Diesel (liters)', icon: '⛽', tip: 'Total diesel fuel consumed in liters' },
            { id: 'petrol', label: 'Petrol (liters)', icon: '⛽', tip: 'Total petrol fuel consumed in liters' }
          ],
          refrigerants: [
            { id: 'refrigerantR410a', label: 'R-410A Refrigerant (kg)', icon: '❄️', tip: 'Total R-410A refrigerant leaked in kg' }
          ],
          electricity: [
            { id: 'electricity', label: 'Electricity (kWh)', icon: '⚡', tip: 'Total electricity consumed in kWh' }
          ],
          other: [
            commonInputs.purchasedGoods,
            { id: 'wasteGenerated', label: 'Waste Generated (tonnes)', icon: '🗑️', tip: 'Total waste generated in tonnes' },
            { id: 'waterUsage', label: 'Water Usage (cubic meters)', icon: '💧', tip: 'Total water used in cubic meters' },
            { id: 'businessFlights', label: 'Business Flights (passenger miles)', icon: '✈️', tip: 'Total business travel in passenger miles' },
            { id: 'employeeCommuting', label: 'Employee Commuting (passenger miles)', icon: '🚗', tip: 'Total employee commuting in passenger miles' }
          ]
        };
    }
  }, [normalizedIndustryType]);

  // Memoize industry inputs
  const industryInputs = useMemo(() => getIndustryRawInputs(), [getIndustryRawInputs]);

  // Get emission factor from the fetched data
  const getEmissionFactor = useCallback((factorName) => {
    const factor = emissionFactors.find(f => {
      const fName = f.factorName || f.factor_name;
      if (!fName) return false;
      
      return fName.toLowerCase().includes(factorName.toLowerCase()) ||
             fName === factorName;
    });
    
    const factorValue = factor ? (factor.factorValue || factor.factor_value) : 0;
    return parseFloat(factorValue) || 0;
  }, [emissionFactors]);
  // COMPLETE SECTION 4: CALCULATIONS, USEEFFECTS, AND HELPER FUNCTIONS

  // Enhanced emission factor calculations using database values
  const calculateEmissionFactors = useCallback((inputs) => {
    const results = {
      stationary: 0,
      mobile: 0,
      refrigerants: 0,
      process: 0,
      electricity: 0,
      steam: 0,
      heating: 0,
      cooling: 0,
      purchased_goods: 0,
      business_travel: 0,
      employee_commuting: 0,
      waste: 0,
      waterUsage: 0,
      livestock: 0,
      fertilizers: 0,
      landConverted: 0,
      // Add detailed emissions for each input
      naturalGas: 0,
      diesel: 0,
      petrol: 0,
      refrigerantR410a: 0,
      refrigerantR134a: 0,
      refrigerantR22: 0,
      steelProduction: 0,
      cementProduction: 0,
      chemicalUsage: 0,
      steamPurchased: 0,
      coolingPurchased: 0,
      businessFlights: 0,
      employeeCommuting: 0,
      wasteGenerated: 0,
      paperConsumption: 0,
      livestockCattle: 0,
      livestockPigs: 0,
      livestockSheep: 0,
      fertilizersNitrogen: 0,
      purchasedGoods: 0
    };

    // Calculate Scope 1 emissions using database factors
    if (inputs.naturalGas) {
      results.naturalGas = inputs.naturalGas * getEmissionFactor('Natural Gas Combustion');
      results.stationary += results.naturalGas;
    }
    
    if (inputs.diesel) {
      results.diesel = inputs.diesel * getEmissionFactor('Diesel Combustion');
      results.mobile += results.diesel;
    }
    
    if (inputs.petrol) {
      results.petrol = inputs.petrol * getEmissionFactor('Petrol Combustion');
      results.mobile += results.petrol;
    }
    
    if (inputs.refrigerantR410a) {
      results.refrigerantR410a = inputs.refrigerantR410a * getEmissionFactor('R-410A Refrigerant');
      results.refrigerants += results.refrigerantR410a;
    }
    
    if (inputs.refrigerantR134a) {
      results.refrigerantR134a = inputs.refrigerantR134a * getEmissionFactor('R-134a Refrigerant');
      results.refrigerants += results.refrigerantR134a;
    }
    
    // Process emissions
    if (inputs.steelProduction) {
      results.steelProduction = inputs.steelProduction * 2100;
      results.process += results.steelProduction;
    }
    
    if (inputs.cementProduction) {
      results.cementProduction = inputs.cementProduction * 820;
      results.process += results.cementProduction;
    }
    
    if (inputs.chemicalUsage) {
      results.chemicalUsage = inputs.chemicalUsage * 1500;
      results.process += results.chemicalUsage;
    }

    // Agriculture-specific calculations
    if (inputs.livestockCattle) {
      results.livestockCattle = inputs.livestockCattle * 2300;
      results.livestock += results.livestockCattle;
    }
    
    if (inputs.livestockPigs) {
      results.livestockPigs = inputs.livestockPigs * 200;
      results.livestock += results.livestockPigs;
    }
    
    if (inputs.livestockSheep) {
      results.livestockSheep = inputs.livestockSheep * 150;
      results.livestock += results.livestockSheep;
    }
    
    if (inputs.fertilizersNitrogen) {
      results.fertilizersNitrogen = inputs.fertilizersNitrogen * 4.42;
      results.fertilizers += results.fertilizersNitrogen;
    }

    // Calculate Scope 2 emissions using location-specific factors
    const electricityFactor = getEmissionFactor(`Grid Electricity - ${location}`) || getEmissionFactor('Grid Electricity');
    if (inputs.electricity || inputs.dataCenter) {
      results.electricity = ((inputs.electricity || 0) + (inputs.dataCenter || 0)) * electricityFactor;
    }
    
    if (inputs.steamPurchased) {
      results.steamPurchased = inputs.steamPurchased * 65;
      results.steam = results.steamPurchased;
    }
    
    if (inputs.coolingPurchased) {
      results.coolingPurchased = inputs.coolingPurchased * 65;
      results.cooling = results.coolingPurchased;
    }

    // Calculate Scope 3 emissions using database factors
    if (inputs.purchasedGoods) {
      // Use the emission factor from the database or default to 0.5 kg CO2e per dollar
      const purchasedGoodsFactor = getEmissionFactor('Purchased Goods and Services') || 0.5;
      results.purchasedGoods = inputs.purchasedGoods * purchasedGoodsFactor;
      results.purchased_goods = results.purchasedGoods; // Note: no += here, direct assignment
    }
    
    if (inputs.businessFlights) {
      results.businessFlights = inputs.businessFlights * getEmissionFactor('Business Air Travel');
      results.business_travel = results.businessFlights;
    }
    
    if (inputs.employeeCommuting) {
      results.employeeCommuting = inputs.employeeCommuting * getEmissionFactor('Employee Commuting');
      results.employee_commuting = results.employeeCommuting;
    }
    
    if (inputs.wasteGenerated) {
      results.wasteGenerated = inputs.wasteGenerated * getEmissionFactor('Waste to Landfill');
      results.waste = results.wasteGenerated;
    }
    
    if (inputs.waterUsage) {
      results.waterUsage = inputs.waterUsage * 0.35;
      // Properly assign water usage emissions
    }
    
    if (inputs.paperConsumption) {
      results.paperConsumption = inputs.paperConsumption * 183;
      results.purchased_goods += results.paperConsumption; // This stays as += because it adds to purchased goods
    }

    return results;
  }, [emissionFactors, getEmissionFactor, location]);

  // Calculate emissions - memoized to prevent recalculations
  const calculateEmissions = useCallback(() => {
    const calculated = calculateEmissionFactors(rawInputs);
    
    // Convert to tonnes CO2e
    const inTonnes = {};
    Object.keys(calculated).forEach(key => {
      inTonnes[key] = calculated[key] / 1000; // Convert kg to tonnes
    });

    const scope1 = inTonnes.stationary + inTonnes.mobile + inTonnes.refrigerants + 
                   inTonnes.process + inTonnes.livestock + inTonnes.fertilizers + inTonnes.landConverted;
    const scope2 = inTonnes.electricity + inTonnes.steam + inTonnes.heating + inTonnes.cooling;
    const scope3 = inTonnes.purchased_goods + inTonnes.business_travel + 
                   inTonnes.employee_commuting + inTonnes.waste + inTonnes.waterUsage;
    const total = scope1 + scope2 + scope3;

    return { scope1, scope2, scope3, total };
  }, [rawInputs, calculateEmissionFactors]);

  // Calculate emissions by scope - memoized to prevent recalculations
  const emissions = useMemo(() => calculateEmissions(), [calculateEmissions]);

  // Calculate yearly reductions based on implementation timeline
  const calculateYearlyReductions = useCallback((strategy) => {
    const reductions = {};
    const startYear = strategy.implementationYear;
    const endYear = strategy.fullRealizationYear;
    
    if (!startYear || !endYear) return reductions;
    
    const totalReduction = strategy.reductionType === 'percentage' 
      ? (emissions.total * strategy.reductionPotential / 100)
      : strategy.reductionTonnes;
    
    const years = endYear - startYear + 1;
    
    // Progressive realization based on timeframe
    if (strategy.timeframe === 'short') {
      // 100% in first year
      reductions[startYear] = totalReduction;
    } else if (strategy.timeframe === 'medium') {
      // 30% year 1, 50% year 2, 20% year 3
      reductions[startYear] = totalReduction * 0.3;
      reductions[startYear + 1] = totalReduction * 0.5;
      reductions[startYear + 2] = totalReduction * 0.2;
    } else if (strategy.timeframe === 'long') {
      // 10% year 1, 20% year 2, 30% year 3, 25% year 4, 15% year 5
      reductions[startYear] = totalReduction * 0.1;
      reductions[startYear + 1] = totalReduction * 0.2;
      reductions[startYear + 2] = totalReduction * 0.3;
      reductions[startYear + 3] = totalReduction * 0.25;
      reductions[startYear + 4] = totalReduction * 0.15;
    }
    
    return reductions;
  }, [emissions.total]);

  // Update handleStrategyChange to use calculateYearlyReductions
  useEffect(() => {
    // This ensures yearly reductions are recalculated when strategies change
    setReductionStrategies(prev => prev.map(strategy => {
      if (strategy.needsRecalculation || (strategy.isConfirmed && Object.keys(strategy.yearlyReductions || {}).length === 0)) {
        const { needsRecalculation, ...rest } = strategy;
        return {
          ...rest,
          yearlyReductions: calculateYearlyReductions(strategy)
        };
      }
      return strategy;
    }));
  }, [calculateYearlyReductions, reductionStrategies.length]);

  // Get applicable carbon credit schemes based on location and requirements
  const getApplicableSchemes = useCallback(() => {
    const schemes = [];
    
    // Map location to applicable schemes
    const locationSchemes = {
      'AU': ['ACCUs', 'Climate Active'],
      'australia': ['ACCUs', 'Climate Active'],
      'US': ['VCS', 'Gold Standard', 'CAR', 'ACR'],
      'united_states': ['VCS', 'Gold Standard', 'CAR', 'ACR'],
      'EU': ['EU Allowances (EUAs)', 'Gold Standard', 'VCS'],
      'european_union': ['EU Allowances (EUAs)', 'Gold Standard', 'VCS'],
      'GB': ['UK Allowances (UKAs)', 'Woodland Carbon Units', 'Peatland Carbon Units'],
      'united_kingdom': ['UK Allowances (UKAs)', 'Woodland Carbon Units', 'Peatland Carbon Units'],
      'CN': ['CEAs', 'CCERs'],
      'china': ['CEAs', 'CCERs'],
      'IN': ['PAT Certificates', 'VCS', 'Gold Standard'],
      'india': ['PAT Certificates', 'VCS', 'Gold Standard'],
      'CA': ['Canadian Offset Credits', 'VCS', 'Gold Standard'],
      'canada': ['Canadian Offset Credits', 'VCS', 'Gold Standard'],
      'JP': ['J-Credits', 'JCM Credits', 'VCS', 'Gold Standard'],
      'japan': ['J-Credits', 'JCM Credits', 'VCS', 'Gold Standard'],
      'BR': ['VCS', 'Gold Standard', 'REDD+'],
      'brazil': ['VCS', 'Gold Standard', 'REDD+'],
      'NZ': ['NZ ETS Units', 'VCS', 'Gold Standard'],
      'new_zealand': ['NZ ETS Units', 'VCS', 'Gold Standard'],
      'KR': ['K-OC', 'VCS', 'Gold Standard'],
      'south_korea': ['K-OC', 'VCS', 'Gold Standard'],
      'SG': ['Carbon Credits', 'VCS', 'Gold Standard'],
      'singapore': ['Carbon Credits', 'VCS', 'Gold Standard'],
      'CH': ['Swiss Carbon Credits', 'Gold Standard', 'VCS'],
      'switzerland': ['Swiss Carbon Credits', 'Gold Standard', 'VCS']
    };
    
    // Get schemes for current location
    const currentSchemes = locationSchemes[location] || ['VCS', 'Gold Standard', 'Plan Vivo'];
    schemes.push(...currentSchemes);
    
    // Add specific schemes based on requirements
    if (emissions.total > 25000 && (location === 'AU' || location === 'australia')) {
      schemes.push('Safeguard Mechanism');
    }
    
    if (emissions.total > 10000 && (location === 'EU' || location === 'european_union')) {
      schemes.push('EU ETS');
    }
    
    // Always include international standards
    if (!schemes.includes('Gold Standard')) schemes.push('Gold Standard');
    if (!schemes.includes('VCS')) schemes.push('VCS');
    
    // Remove duplicates
    return [...new Set(schemes)];
  }, [location, emissions.total]);

  // Get offset requirements based on location and emissions
  const getOffsetRequirements = useCallback(() => {
    const totalEmissions = emissions.total;
    
    // Define offset requirements by country/region
    const offsetRules = {
      'australia': {
        mandatory: totalEmissions > 25000,
        percentage: totalEmissions > 100000 ? 25 : totalEmissions > 50000 ? 15 : 10,
        threshold: 25000,
        creditTypes: ['ACCUs', 'International Credits (with restrictions)'],
        schemes: ['Safeguard Mechanism', 'Climate Active'],
        description: 'Australian facilities exceeding 25,000 tCO2e must surrender Australian Carbon Credit Units (ACCUs) or eligible international units.',
        regulations: 'Safeguard Mechanism Rules 2015',
        allowInternational: true,
        internationalLimit: 30
      },
      'united_states': {
        mandatory: false,
        voluntary: true,
        percentage: 0,
        creditTypes: ['VCS', 'Gold Standard', 'CAR', 'ACR'],
        schemes: ['California Cap-and-Trade (for CA)', 'RGGI (for participating states)'],
        description: 'While federal requirements are limited, many states have cap-and-trade programs. Voluntary offsetting is common.',
        stateSpecific: true
      },
      'european_union': {
        mandatory: totalEmissions > 10000,
        percentage: 'varies by sector',
        threshold: 10000,
        creditTypes: ['EU Allowances (EUAs)', 'Limited international credits'],
        schemes: ['EU ETS', 'EU Green Deal'],
        description: 'Installations covered by EU ETS must surrender allowances. CORSIA applies to aviation.',
        regulations: 'EU ETS Directive 2003/87/EC',
        sectorSpecific: true
      },
      'united_kingdom': {
        mandatory: totalEmissions > 10000,
        percentage: 'market-based',
        threshold: 10000,
        creditTypes: ['UK Allowances (UKAs)', 'Woodland Carbon Units', 'Peatland Carbon Units'],
        schemes: ['UK ETS', 'Woodland Carbon Code', 'Peatland Code'],
        description: 'UK ETS covers energy-intensive industries. Voluntary schemes available for nature-based solutions.',
        regulations: 'The Greenhouse Gas Emissions Trading Scheme Order 2020'
      },
      'other': {
        mandatory: false,
        voluntary: true,
        percentage: 0,
        creditTypes: ['VCS', 'Gold Standard', 'Plan Vivo', 'International credits'],
        schemes: ['Various voluntary programs'],
        description: 'Check local regulations. International voluntary standards widely accepted.',
        recommendation: 'Consider Science Based Targets initiative (SBTi) guidelines'
      }
    };

    // Map location codes to offset rules keys
    const locationMapping = {
      'AU': 'australia',
      'US': 'united_states',
      'EU': 'european_union',
      'GB': 'united_kingdom',
      'CN': 'china',
      'IN': 'india',
      'CA': 'canada',
      'JP': 'japan',
      'BR': 'brazil',
      'NZ': 'new_zealand',
      'KR': 'south_korea',
      'SG': 'singapore',
      'CH': 'switzerland',
      'OTHER': 'other'
    };

    const mappedLocation = locationMapping[location] || location || 'other';
    const locationRules = offsetRules[mappedLocation] || offsetRules['other'];
    
    // Calculate offset amount
    let offsetAmount = 0;
    let offsetPercentage = 0;
    
    if (locationRules.mandatory && totalEmissions > (locationRules.threshold || 0)) {
      if (typeof locationRules.percentage === 'number') {
        offsetPercentage = locationRules.percentage;
        offsetAmount = totalEmissions * (offsetPercentage / 100);
      }
    }

    // Add voluntary offset recommendation
    const voluntaryRecommendation = {
      carbonNeutral: totalEmissions,
      scienceBasedTarget: totalEmissions * 0.425,
      netZero: totalEmissions * 0.9
    };

    return {
      ...locationRules,
      totalEmissions,
      offsetAmount,
      offsetPercentage,
      voluntaryRecommendation,
      isRequired: locationRules.mandatory && totalEmissions > (locationRules.threshold || 0)
    };
  }, [location, emissions.total]);

  // Fetch reporting requirements with fallback to mock data
  useEffect(() => {
    const fetchReportingRequirements = async () => {
      if (!location) return;
      
      try {
        const response = await api.get(`/carbon-footprints/reporting-requirements/${location}`);
        setReportingRequirements(response.data);
      } catch (error) {
        console.warn('Using mock reporting requirements for:', location);
        setReportingRequirements(getMockReportingRequirements(location));
      }
    };
    
    fetchReportingRequirements();
  }, [location]);

  // Fetch emission factors with fallback to mock data
  useEffect(() => {
    const fetchEmissionFactors = async () => {
      try {
        const response = await api.get(`/carbon-footprints/emission-factors`, {
          params: { country: location, year: reportingYear }
        });
        setEmissionFactors(response.data);
      } catch (error) {
        console.warn('Using mock emission factors for:', location);
        setEmissionFactors(getMockEmissionFactors(location));
      }
    };
    
    fetchEmissionFactors();
  }, [location, reportingYear]);

  // Update emission values with debouncing to prevent excessive calculations
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const calculated = calculateEmissionFactors(rawInputs);
      setEmissionValues(calculated);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [rawInputs, calculateEmissionFactors]);

  // Load initial data
  useEffect(() => {
    if (initialData) {
      console.log('📥 Loading comprehensive initial emissions data:', initialData);
      
      // Load raw inputs
      if (initialData.rawInputs && Object.keys(initialData.rawInputs).length > 0) {
        console.log('📥 Loading raw inputs:', initialData.rawInputs);
        setRawInputs(initialData.rawInputs);
      }
      
      // Load emission values
      if (initialData.emissionValues && Object.keys(initialData.emissionValues).length > 0) {
        console.log('📥 Loading emission values:', initialData.emissionValues);
        setEmissionValues(initialData.emissionValues);
      }
      
      // Load reduction strategies
      if (initialData.reductionStrategies && Array.isArray(initialData.reductionStrategies)) {
        console.log('📥 Loading reduction strategies:', initialData.reductionStrategies.length, 'strategies');
        setReductionStrategies(initialData.reductionStrategies);
      }
      
      // Load reduction target
      if (initialData.reductionTarget !== undefined) {
        console.log('📥 Loading reduction target:', initialData.reductionTarget);
        setReductionTarget(initialData.reductionTarget);
      }
      
      // Load active sections
      if (initialData.activeSection) {
        console.log('📥 Loading active sections:', initialData.activeSection);
        setActiveSection(initialData.activeSection);
      }
      
      // Handle legacy data structure
      if (initialData.emissionsData) {
        const { 
          rawInputs: savedRawInputs, 
          reductionStrategies: savedStrategies, 
          reductionTarget: savedTarget,
          emissionValues: savedEmissionValues
        } = initialData.emissionsData;
        
        if (savedRawInputs && Object.keys(savedRawInputs).length > 0) {
          console.log('📥 Loading legacy raw inputs:', savedRawInputs);
          setRawInputs(savedRawInputs);
        }
        if (savedEmissionValues && Object.keys(savedEmissionValues).length > 0) {
          console.log('📥 Loading legacy emission values:', savedEmissionValues);
          setEmissionValues(savedEmissionValues);
        }
        if (savedStrategies && Array.isArray(savedStrategies)) {
          setReductionStrategies(savedStrategies);
        }
        if (savedTarget !== undefined) {
          setReductionTarget(savedTarget);
        }
      }
    }
  }, [initialData]);

  // Missing function implementations
  const getRecommendedStrategies = useCallback(() => {
    // Return industry-specific strategies
    const strategies = {
      manufacturing: [
        { name: 'Energy Efficiency Upgrades', impact: 'High', difficulty: 'Medium', description: 'Upgrade equipment and lighting systems' },
        { name: 'Renewable Energy', impact: 'High', difficulty: 'High', description: 'Install solar panels or purchase renewable energy' },
        { name: 'Waste Heat Recovery', impact: 'Medium', difficulty: 'Medium', description: 'Capture and reuse waste heat from processes' }
      ],
      retail: [
        { name: 'LED Lighting', impact: 'Medium', difficulty: 'Low', description: 'Replace all lighting with LED systems' },
        { name: 'HVAC Optimization', impact: 'High', difficulty: 'Medium', description: 'Optimize heating and cooling systems' },
        { name: 'Green Transportation', impact: 'Medium', difficulty: 'High', description: 'Electrify delivery fleet' }
      ],
      services: [
        { name: 'Remote Work Policy', impact: 'High', difficulty: 'Low', description: 'Reduce commuting emissions through remote work' },
        { name: 'Green Building Certification', impact: 'Medium', difficulty: 'Medium', description: 'Achieve LEED or similar certification' },
        { name: 'Digital Transformation', impact: 'Medium', difficulty: 'Medium', description: 'Reduce paper consumption through digitization' }
      ]
    };
    
    return strategies[normalizedIndustryType] || [];
  }, [normalizedIndustryType]);

  const hasRecommendedStrategies = useMemo(() => {
    return getRecommendedStrategies().length > 0;
  }, [getRecommendedStrategies]);

  // Calculate applicable reporting requirements
  const applicableReportingRequirements = useMemo(() => {
    return reportingRequirements.map(req => {
      const threshold = req.threshold_emissions || 0;
      const applicable = emissions.total >= threshold;
      
      return {
        ...req,
        name: req.requirement_name || req.name,
        description: req.description,
        applicable,
        voluntary: !req.is_mandatory,
        link: req.legislation_url,
        legislationName: req.legislation_name,
        regulatoryBody: req.regulatory_body,
        reportingDeadline: req.reporting_deadline,
        legislationSummary: req.legislation_summary,
        reason: applicable 
          ? `Your emissions (${emissions.total.toFixed(0)} tCO2e) exceed the threshold of ${threshold.toLocaleString()} tCO2e`
          : `Your emissions (${emissions.total.toFixed(0)} tCO2e) are below the threshold of ${threshold.toLocaleString()} tCO2e`
      };
    });
  }, [reportingRequirements, emissions.total]);

  const handleManualSave = useCallback(async () => {
    if (!onSave) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const dataToSave = {
        rawInputs,
        emissionValues,
        reductionStrategies,
        reductionTarget,
        activeSection,
        emissions,
        timestamp: new Date().toISOString()
      };
      
      await onSave(dataToSave);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to save emissions data: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [onSave, rawInputs, emissionValues, reductionStrategies, reductionTarget, activeSection, emissions]);

  // Calculate timeline data for the emissions graph
  const calculateTimelineData = useCallback(() => {
    const currentYear = new Date().getFullYear();
    const timelineData = [];
    
    // Start with baseline emissions
    let cumulativeReduction = 0;
    
    // Get all years from strategies
    const yearlyReductions = {};
    reductionStrategies
      .filter(s => s.isConfirmed)
      .forEach(strategy => {
        Object.entries(strategy.yearlyReductions || {}).forEach(([year, amount]) => {
          yearlyReductions[year] = (yearlyReductions[year] || 0) + amount;
        });
      });
    
    // Add carbon credits if selected
    const totalCredits = selectedCarbonProjects.reduce((sum, p) => sum + (p.selectedQuantity || 0), 0);
    
    // Generate timeline for next 10 years
    for (let i = 0; i <= 10; i++) {
      const year = currentYear + i;
      const yearReduction = yearlyReductions[year] || 0;
      cumulativeReduction += yearReduction;
      
      // Add carbon credits in the first year if selected
      const creditsThisYear = i === 0 ? totalCredits : 0;
      
      timelineData.push({
        year: year.toString(),
        baseline: emissions.total,
        emissions: Math.max(0, emissions.total - cumulativeReduction - creditsThisYear),
        reduction: cumulativeReduction + creditsThisYear,
        target: emissions.total * (1 - reductionTarget / 100)
      });
    }
    
    return timelineData;
  }, [emissions.total, reductionStrategies, selectedCarbonProjects, reductionTarget]);
  // COMPLETE SECTION 5: CHART DATA, RENDER FUNCTIONS, AND COMPONENT RETURN

  // Prepare data for charts - memoized
  const scopeChartData = useMemo(() => [
    { name: 'Scope 1 (Direct)', value: emissions.scope1 },
    { name: 'Scope 2 (Electricity)', value: emissions.scope2 },
    { name: 'Scope 3 (Value Chain)', value: emissions.scope3 }
  ], [emissions]);

  // Prepare data for detailed chart
  const prepareDetailedChartData = useCallback(() => {
    const data = [];
    
    // Add Scope 3 emissions
    if (emissionValues.purchased_goods > 0) {
      data.push({
        name: 'Purchased Goods',
        value: emissionValues.purchased_goods / 1000,
        scope: 'Scope 3'
      });
    }
    
    if (emissionValues.business_travel > 0) {
      data.push({
        name: 'Business Travel',
        value: emissionValues.business_travel / 1000,
        scope: 'Scope 3'
      });
    }
    
    if (emissionValues.employee_commuting > 0) {
      data.push({
        name: 'Employee Commuting',
        value: emissionValues.employee_commuting / 1000,
        scope: 'Scope 3'
      });
    }
    
    if (emissionValues.waste > 0) {
      data.push({
        name: 'Waste Generated',
        value: emissionValues.waste / 1000,
        scope: 'Scope 3'
      });
    }
    
    if (emissionValues.waterUsage > 0) {
      data.push({
        name: 'Water Usage',
        value: emissionValues.waterUsage / 1000,
        scope: 'Scope 3'
      });
    }
    
    // Industry-specific emissions
    if (emissionValues.livestock > 0) {
      data.push({
        name: 'Livestock',
        value: emissionValues.livestock / 1000,
        scope: 'Scope 1'
      });
    }
    
    if (emissionValues.fertilizers > 0) {
      data.push({
        name: 'Fertilizers',
        value: emissionValues.fertilizers / 1000,
        scope: 'Scope 1'
      });
    }
    
    if (emissionValues.landConverted > 0) {
      data.push({
        name: 'Land Use',
        value: emissionValues.landConverted / 1000,
        scope: 'Scope 1'
      });
    }
    
    // Sort by value in descending order
    return data.sort((a, b) => b.value - a.value);
  }, [emissionValues]);

  const detailedChartData = useMemo(() => prepareDetailedChartData(), [prepareDetailedChartData]);

  // Render inputs for a given category
  const renderInputCategory = useCallback((categoryName, items) => {
    if (!items || items.length === 0) return null;
    
    return (
      <div className="mb-4">
        <h4 className="text-md font-medium text-gray-700 mb-2">{categoryName}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map(item => (
            <div key={item.id} className="mb-2">
              <Tooltip text={item.tip}>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-1 cursor-help">
                 <span className="mr-1">{item.icon}</span> {item.label}
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
               </label>
             </Tooltip>
             <input
               type="number"
               value={rawInputs[item.id] || 0}
               onChange={(e) => handleRawInputChange(item.id, e.target.value)}
               className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
               min="0"
               step="0.01"
             />
           </div>
         ))}
       </div>
     </div>
   );
 }, [rawInputs, handleRawInputChange]);

 // Legislation Link Component
 const LegislationLink = ({ requirement }) => {
   const [showDetails, setShowDetails] = useState(false);
   
   return (
     <div className="mt-3 space-y-2">
       <div className="flex items-center justify-between">
         <button
           onClick={() => setShowDetails(!showDetails)}
           className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
         >
           <span>View Legislation Details</span>
           <svg 
             xmlns="http://www.w3.org/2000/svg" 
             className={`h-4 w-4 ml-1 transform transition-transform ${showDetails ? 'rotate-180' : ''}`} 
             fill="none" 
             viewBox="0 0 24 24" 
             stroke="currentColor"
           >
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
           </svg>
         </button>
         
         <a 
           href={requirement.link} 
           target="_blank" 
           rel="noopener noreferrer"
           className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
         >
           <span>Open Legislation</span>
           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
           </svg>
         </a>
       </div>
       
       {showDetails && (
         <div className="bg-gray-50 p-3 rounded border text-sm">
           <div className="space-y-2">
             <div>
               <span className="font-medium">Legislation Name:</span>
               <span className="ml-2">{requirement.legislationName}</span>
             </div>
             
             {requirement.effectiveDate && (
               <div>
                 <span className="font-medium">Effective Date:</span>
                 <span className="ml-2">{new Date(requirement.effectiveDate).toLocaleDateString()}</span>
               </div>
             )}
             
             {requirement.regulatoryBody && (
               <div>
                 <span className="font-medium">Regulatory Body:</span>
                 <span className="ml-2">{requirement.regulatoryBody}</span>
               </div>
             )}
             
             {requirement.contactEmail && (
               <div>
                 <span className="font-medium">Contact:</span>
                 <a 
                   href={`mailto:${requirement.contactEmail}`}
                   className="ml-2 text-blue-600 hover:text-blue-800"
                 >
                   {requirement.contactEmail}
                 </a>
               </div>
             )}
             
             {requirement.reportingDeadline && (
               <div>
                 <span className="font-medium">Reporting Deadline:</span>
                 <span className="ml-2">{requirement.reportingDeadline}</span>
               </div>
             )}
             
             {requirement.legislationSummary && (
               <div>
                 <span className="font-medium">Summary:</span>
                 <p className="ml-2 mt-1 text-gray-600">{requirement.legislationSummary}</p>
               </div>
             )}
           </div>
         </div>
       )}
     </div>
   );
 };

 // Emissions Report Modal Component
 const EmissionsReportModal = () => {
   if (!showReport) return null;
   
   const timelineData = calculateTimelineData();
   
   return (
     <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
       <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
         <div className="mt-3">
           <div className="flex justify-between items-center mb-4">
             <h3 className="text-2xl font-bold text-gray-900">Emissions Reduction Report</h3>
             <button
               onClick={() => setShowReport(false)}
               className="text-gray-400 hover:text-gray-500"
             >
               <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               </svg>
             </button>
           </div>
           
           {/* Report Summary */}
           <div className="mb-6 p-4 bg-blue-50 rounded-lg">
             <h4 className="text-lg font-semibold mb-2">Executive Summary</h4>
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
               <div>
                 <p className="text-sm text-gray-600">Current Emissions</p>
                 <p className="text-xl font-bold">{emissions.total.toFixed(2)} tCO2e</p>
               </div>
               <div>
                 <p className="text-sm text-gray-600">Reduction Target</p>
                 <p className="text-xl font-bold">{reductionTarget}%</p>
               </div>
               <div>
                 <p className="text-sm text-gray-600">Planned Reduction</p>
                 <p className="text-xl font-bold">
                   {(() => {
                     const strategies = reductionStrategies.filter(s => s.isConfirmed)
                       .reduce((sum, s) => {
                         if (s.reductionType === 'percentage') {
                           return sum + (emissions.total * s.reductionPotential / 100);
                         }
                         return sum + parseFloat(s.reductionTonnes || 0);
                       }, 0);
                     const credits = selectedCarbonProjects.reduce((sum, p) => sum + (p.selectedQuantity || 0), 0);
                     return (strategies + credits).toFixed(2);
                   })()} tCO2e
                 </p>
               </div>
               <div>
                 <p className="text-sm text-gray-600">Target Year</p>
                 <p className="text-xl font-bold">{new Date().getFullYear() + 5}</p>
               </div>
             </div>
           </div>
           
           {/* Emissions Timeline Chart */}
           <div className="mb-6">
             <h4 className="text-lg font-semibold mb-4">Projected Emissions Timeline</h4>
             <div className="h-96">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={timelineData}>
                   <CartesianGrid strokeDasharray="3 3" />
                   <XAxis dataKey="year" />
                   <YAxis />
                   <RechartsTooltip />
                   <Legend />
                   <Line 
                     type="monotone" 
                     dataKey="baseline" 
                     stroke="#e74c3c" 
                     strokeWidth={2}
                     strokeDasharray="5 5"
                     name="Baseline Emissions"
                   />
                   <Line 
                     type="monotone" 
                     dataKey="emissions" 
                     stroke="#3498db" 
                     strokeWidth={3}
                     name="Projected Emissions"
                   />
                   <Line 
                     type="monotone" 
                     dataKey="target" 
                     stroke="#2ecc71" 
                     strokeWidth={2}
                     strokeDasharray="3 3"
                     name="Target Emissions"
                   />
                 </LineChart>
               </ResponsiveContainer>
             </div>
           </div>
           
           {/* Strategy Summary */}
           <div className="mb-6">
             <h4 className="text-lg font-semibold mb-4">Reduction Strategies Summary</h4>
             <div className="overflow-x-auto">
               <table className="min-w-full bg-white border">
                 <thead>
                   <tr className="bg-gray-50">
                     <th className="py-2 px-4 border text-left">Strategy</th>
                     <th className="py-2 px-4 border text-left">Category</th>
                     <th className="py-2 px-4 border text-left">Reduction</th>
                     <th className="py-2 px-4 border text-left">Timeline</th>
                     <th className="py-2 px-4 border text-left">Cost</th>
                   </tr>
                 </thead>
                 <tbody>
                   {reductionStrategies.filter(s => s.isConfirmed).map((strategy, index) => (
                     <tr key={index}>
                       <td className="py-2 px-4 border">{strategy.name}</td>
                       <td className="py-2 px-4 border">{strategy.category}</td>
                       <td className="py-2 px-4 border">
                         {strategy.reductionType === 'percentage' 
                           ? `${strategy.reductionPotential}%`
                           : `${strategy.reductionTonnes} tCO2e`
                         }
                       </td>
                       <td className="py-2 px-4 border">{strategy.timeframe}</td>
                       <td className="py-2 px-4 border">{strategy.implementationCost}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </div>
           
           {/* Action Buttons */}
           <div className="flex justify-end gap-4">
             <button
               onClick={() => window.print()}
               className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
             >
               Print Report
             </button>
             <button
               onClick={() => setShowReport(false)}
               className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
             >
               Close
             </button>
           </div>
         </div>
       </div>
     </div>
   );
 };
 // Main render
 return (
  <div className="emissions-calculator">
    {error && (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
        {error}
      </div>
    )}
    
    {success && (
      <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
        Emissions data saved successfully!
      </div>
    )}
    
    <div className="mb-6">
      <h2 className="text-lg font-medium mb-4">GHG Emissions Inventory - {reportingYear || new Date().getFullYear()}</h2>
      <p className="text-sm text-gray-600 mb-4">
        Enter your organization's activity data for {industries.find(i => i.id === normalizedIndustryType)?.name || 'your industry'} to calculate your greenhouse gas emissions.
      </p>
      
      {/* STEP 1: Location Display */}
      <div className="mb-8 border rounded-lg overflow-hidden">
        <div 
          className="bg-gray-100 p-3 flex justify-between items-center cursor-pointer"
          onClick={() => toggleSection('location')}
        >
          <div className="flex items-center">
            <div className="w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-800 rounded-full mr-2 font-bold text-sm">📍</div>
            <h3 className="text-md font-medium">Step 1: Reporting Location</h3>
          </div>
          <span>{activeSection.location ? '▼' : '▶'}</span>
        </div>
        
        {activeSection.location && (
          <div className="p-4">
            <p className="text-sm text-gray-600 mb-4">
              Your reporting location determines applicable emissions factors and reporting requirements.
            </p>
            {location ? (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-lg font-medium text-blue-900">
                  <span className="mr-2">📍</span>
                  {location.replace(/_/g, ' ').split(' ').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                  ).join(' ')}
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Emissions factors and reporting requirements are configured for this location.
                </p>
              </div>
            ) : (
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <p className="text-amber-800">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  No location selected. Please select a location at the top of the page to enable accurate emissions calculations.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* STEP 2: Emissions Calculation */}
      <div className="mb-8 border-2 border-blue-300 rounded-lg overflow-hidden">
        <div className="bg-blue-100 p-3">
          <h3 className="text-md font-medium">Step 2: Calculate Your Emissions</h3>
        </div>
        
        {/* Scope 1 Emissions */}
        <div className="border-b">
          <div 
            className="bg-gray-50 p-3 flex justify-between items-center cursor-pointer"
            onClick={() => toggleSection('direct')}
          >
            <div className="flex items-center">
              <div className="w-6 h-6 flex items-center justify-center bg-red-100 text-red-800 rounded-full mr-2 font-bold text-sm">1</div>
              <h3 className="text-md font-medium">Scope 1: Direct Emissions</h3>
            </div>
            <span>{activeSection.direct ? '▼' : '▶'}</span>
          </div>
          
          {activeSection.direct && (
            <div className="p-4 bg-white">
              <p className="text-sm text-gray-600 mb-4">
                Enter data for direct emissions from sources that are owned or controlled by your organization.
              </p>
              
              {renderInputCategory('Stationary Combustion', industryInputs.stationary)}
              {renderInputCategory('Mobile Combustion', industryInputs.mobile)}
              {renderInputCategory('Refrigerants & Fugitive Emissions', industryInputs.refrigerants)}
              {renderInputCategory('Industrial Processes', industryInputs.process)}
              {renderInputCategory('Fleet Vehicles', industryInputs.fleet)}
              {renderInputCategory('Livestock Emissions', industryInputs.livestock)}
              {renderInputCategory('Land Use & Fertilizers', industryInputs.land)}
              {renderInputCategory('Equipment', industryInputs.equipment)}
              
              <div className="mt-4 p-3 bg-red-50 rounded border border-red-200">
                <h4 className="text-sm font-medium text-red-700 mb-1">Calculated Scope 1 Emissions</h4>
                <p className="text-lg font-bold text-red-800">{emissions.scope1.toFixed(2)} tonnes CO2e</p>
                <p className="text-xs text-gray-600">These emissions are directly from sources owned or controlled by your organization.</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Scope 2 Emissions */}
        <div className="border-b">
          <div 
            className="bg-gray-50 p-3 flex justify-between items-center cursor-pointer"
            onClick={() => toggleSection('indirect')}
          >
            <div className="flex items-center">
              <div className="w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-800 rounded-full mr-2 font-bold text-sm">2</div>
              <h3 className="text-md font-medium">Scope 2: Indirect Emissions from Purchased Energy</h3>
            </div>
            <span>{activeSection.indirect ? '▼' : '▶'}</span>
          </div>
          
          {activeSection.indirect && (
            <div className="p-4 bg-white">
              <p className="text-sm text-gray-600 mb-4">
                Enter data for indirect emissions from the generation of purchased electricity, steam, heating, and cooling.
              </p>
              
              {renderInputCategory('Purchased Electricity', industryInputs.electricity)}
              {renderInputCategory('Purchased Steam', industryInputs.steam)}
              {renderInputCategory('Purchased Heating', industryInputs.heating)}
              {renderInputCategory('Purchased Cooling', industryInputs.cooling)}
              {renderInputCategory('Data Center Energy', industryInputs.dataCenter)}
              
              <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                <h4 className="text-sm font-medium text-blue-700 mb-1">Calculated Scope 2 Emissions</h4>
                <p className="text-lg font-bold text-blue-800">{emissions.scope2.toFixed(2)} tonnes CO2e</p>
                <p className="text-xs text-gray-600">These emissions come from purchased electricity, steam, heating, and cooling.</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Scope 3 Emissions */}
        <div>
          <div 
            className="bg-gray-50 p-3 flex justify-between items-center cursor-pointer"
            onClick={() => toggleSection('valueChain')}
          >
            <div className="flex items-center">
              <div className="w-6 h-6 flex items-center justify-center bg-green-100 text-green-800 rounded-full mr-2 font-bold text-sm">3</div>
              <h3 className="text-md font-medium">Scope 3: Other Indirect Emissions</h3>
            </div>
            <span>{activeSection.valueChain ? '▼' : '▶'}</span>
          </div>
          
          {activeSection.valueChain && (
            <div className="p-4 bg-white">
              <p className="text-sm text-gray-600 mb-4">
                Enter data for indirect emissions from your value chain, including both upstream and downstream activities.
              </p>
              
              {renderInputCategory('Other Emissions Sources', industryInputs.other)}
              {renderInputCategory('Facility Information', industryInputs.facility)}
              {renderInputCategory('Materials', industryInputs.materials)}
              
              <div className="mt-4 p-3 bg-green-50 rounded border border-green-200">
                <h4 className="text-sm font-medium text-green-700 mb-1">Calculated Scope 3 Emissions</h4>
                <p className="text-lg font-bold text-green-800">{emissions.scope3.toFixed(2)} tonnes CO2e</p>
                <p className="text-xs text-gray-600">These emissions are from activities in your value chain not owned or controlled by your organization.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* STEP 3: Baseline Results & Analysis */}
      <div className="mb-8 border rounded-lg overflow-hidden bg-blue-50">
        <div 
          className="bg-blue-100 p-3 flex justify-between items-center cursor-pointer"
          onClick={() => toggleSection('results')}
        >
          <h3 className="text-md font-medium">Step 3: Baseline Emissions Analysis</h3>
          <span>{activeSection.results ? '▼' : '▶'}</span>
        </div>
        
        {activeSection.results && (
          <div className="p-4">
            <div className="bg-white p-4 rounded border mb-6">
              <h3 className="text-lg font-semibold">Total Baseline Emissions</h3>
              <p className="text-4xl font-bold my-2">{emissions.total.toFixed(2)} tonnes CO2e</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                  <p className="text-sm font-medium text-red-800">Scope 1 (Direct)</p>
                  <p className="text-xl font-bold text-red-900">{emissions.scope1.toFixed(2)} tonnes</p>
                  <p className="text-xs text-red-700">{emissions.total > 0 ? ((emissions.scope1 / emissions.total) * 100).toFixed(1) : 0}% of total</p>
                </div>
                
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-sm font-medium text-blue-800">Scope 2 (Energy)</p>
                  <p className="text-xl font-bold text-blue-900">{emissions.scope2.toFixed(2)} tonnes</p>
                  <p className="text-xs text-blue-700">{emissions.total > 0 ? ((emissions.scope2 / emissions.total) * 100).toFixed(1) : 0}% of total</p>
                </div>
                
                <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                  <p className="text-sm font-medium text-green-800">Scope 3 (Value Chain)</p>
                  <p className="text-xl font-bold text-green-900">{emissions.scope3.toFixed(2)} tonnes</p>
                  <p className="text-xs text-green-700">{emissions.total > 0 ? ((emissions.scope3 / emissions.total) * 100).toFixed(1) : 0}% of total</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white p-4 rounded border">
                <h3 className="text-lg font-semibold mb-4">Emissions by Scope</h3>
                {emissions.total > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={scopeChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {scopeChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(value) => value.toFixed(2) + ' tonnes CO2e'} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    Enter emissions data to generate chart
                  </div>
                )}
              </div>
              
              <div className="bg-white p-4 rounded border">
                <h3 className="text-lg font-semibold mb-4">Top Emission Sources</h3>
                {detailedChartData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={detailedChartData.slice(0, 5)}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tickFormatter={(value) => value.toFixed(1)} />
                        <YAxis type="category" dataKey="name" width={100} />
                        <RechartsTooltip formatter={(value) => value.toFixed(2) + ' tonnes CO2e'} />
                        <Legend />
                        <Bar dataKey="value" name="Emissions (tonnes CO2e)">
                          {detailedChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={scopeColors[entry.scope]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    Enter emissions data to generate chart
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-white p-4 rounded border mb-6">
              <h3 className="text-lg font-semibold mb-4">Per-Employee Analysis</h3>
              {employeeCount > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm font-medium text-gray-700">Total Per Employee</p>
                    <p className="text-2xl font-bold">{(emissions.total / employeeCount).toFixed(2)} tonnes CO2e</p>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm font-medium text-gray-700">Scope 1 Per Employee</p>
                    <p className="text-xl font-bold">{(emissions.scope1 / employeeCount).toFixed(2)} tonnes CO2e</p>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm font-medium text-gray-700">Scope 2 Per Employee</p>
                    <p className="text-xl font-bold">{(emissions.scope2 / employeeCount).toFixed(2)} tonnes CO2e</p>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4">
                  Enter employee count in organization information to see per-employee metrics
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {/* STEP 4: Set Reduction Target */}
      <div className="mb-8 border rounded-lg overflow-hidden">
         <div 
           className="bg-gray-100 p-3 flex justify-between items-center cursor-pointer"
           onClick={() => toggleSection('target')}
         >
           <h3 className="text-md font-medium">Step 4: Set Your Reduction Target</h3>
           <span>{activeSection.target ? '▼' : '▶'}</span>
         </div>
         
         {activeSection.target && (
           <div className="p-4">
             <div className="bg-white p-4 rounded border">
               <h4 className="text-lg font-semibold mb-4">Define Your Emissions Reduction Goal</h4>
               
               <div className="mb-6">
                 <div className="flex justify-between mb-1">
                   <span className="font-medium">Reduction Target (%)</span>
                   <span className="text-lg font-bold">{reductionTarget}%</span>
                 </div>
                 <input
                   type="range"
                   min="0"
                   max="100"
                   step="5"
                   value={reductionTarget}
                   onChange={handleTargetChange}
                   className="w-full"
                 />
                 <div className="flex justify-between text-sm text-gray-600 mt-1">
                   <span>0%</span>
                   <span>25%</span>
                   <span>50%</span>
                   <span>75%</span>
                   <span>100%</span>
                 </div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="p-3 bg-blue-50 rounded">
                   <p className="font-medium text-sm text-gray-700">Current Emissions</p>
                   <p className="text-xl font-bold">{emissions.total.toFixed(2)} tCO2e</p>
                 </div>
                 
                 <div className="p-3 bg-green-50 rounded">
                   <p className="font-medium text-sm text-gray-700">Target Emissions</p>
                   <p className="text-xl font-bold text-green-600">{(emissions.total * (1 - reductionTarget / 100)).toFixed(2)} tCO2e</p>
                 </div>
                 
                 <div className="p-3 bg-amber-50 rounded">
                   <p className="font-medium text-sm text-gray-700">Required Reduction</p>
                   <p className="text-xl font-bold text-amber-600">{(emissions.total * reductionTarget / 100).toFixed(2)} tCO2e</p>
                 </div>
               </div>
               
               {/* Common target guidelines */}
               <div className="mt-4 p-3 bg-gray-50 rounded">
                 <p className="text-sm font-medium text-gray-700 mb-2">Common Reduction Targets:</p>
                 <ul className="text-sm text-gray-600 space-y-1">
                   <li>• <strong>Science-Based Target:</strong> 42.5% reduction by 2030</li>
                   <li>• <strong>Net Zero Pathway:</strong> 90% reduction + 10% offsets</li>
                   <li>• <strong>Carbon Neutral:</strong> 100% offsets (no reduction required)</li>
                 </ul>
               </div>
             </div>
           </div>
         )}
       </div>

       {/* STEP 5: Emission Reduction Strategies */}
       <div className="mb-8 border rounded-lg overflow-hidden">
         <div 
           className="bg-gray-100 p-3 flex justify-between items-center cursor-pointer"
           onClick={() => toggleSection('strategies')}
         >
           <h3 className="text-md font-medium">Step 5: Plan Your Reduction Strategies</h3>
           <span>{activeSection.strategies ? '▼' : '▶'}</span>
         </div>
         
         {activeSection.strategies && (
           <div className="p-4">
             {/* Yearly Reduction Timeline */}
             {reductionStrategies.filter(s => s.isConfirmed).length > 0 && (
               <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                 <h4 className="text-lg font-semibold mb-3 text-amber-800">Reduction Timeline</h4>
                 {(() => {
                   const currentYear = new Date().getFullYear();
                   const yearlyTotals = {};
                   
                   // Calculate totals by year
                   reductionStrategies.filter(s => s.isConfirmed).forEach(strategy => {
                     Object.entries(strategy.yearlyReductions || {}).forEach(([year, amount]) => {
                       yearlyTotals[year] = (yearlyTotals[year] || 0) + amount;
                     });
                   });
                   
                   // Sort years and create cumulative reductions
                   const years = Object.keys(yearlyTotals).sort();
                   let cumulative = 0;
                   
                   return (
                     <div className="space-y-2">
                       {years.map(year => {
                         cumulative += yearlyTotals[year];
                         const remainingEmissions = emissions.total - cumulative;
                         return (
                           <div key={year} className="flex items-center justify-between bg-white p-3 rounded border border-amber-100">
                             <div className="flex items-center">
                               <span className="font-medium text-lg mr-3">{year}</span>
                               <span className="text-sm text-gray-600">
                                 Year {parseInt(year) - currentYear + 1}
                               </span>
                             </div>
                             <div className="text-right">
                               <p className="font-semibold">
                                 -{yearlyTotals[year].toFixed(2)} tCO2e
                               </p>
                               <p className="text-sm text-gray-600">
                                 Remaining: {remainingEmissions.toFixed(2)} tCO2e
                               </p>
                             </div>
                           </div>
                         );
                       })}
                     </div>
                   );
                 })()}
               </div>
             )}
             
             {/* Projected Impact Summary */}
             {reductionStrategies.length > 0 && emissions.total > 0 && (
               <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                 <h4 className="text-lg font-semibold mb-3 text-blue-800">Projected Impact of Reduction Strategies</h4>
                 
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div className="bg-white p-3 rounded border border-blue-100">
                     <p className="text-sm font-medium text-gray-700">Total Reduction Potential</p>
                     <p className="text-2xl font-bold text-blue-600">
                       {(() => {
                         const confirmedStrategies = reductionStrategies.filter(s => s.isConfirmed);
                         const percentageReduction = confirmedStrategies
                           .filter(s => s.reductionType === 'percentage')
                           .reduce((sum, s) => sum + parseFloat(s.reductionPotential || 0), 0);
                         const absoluteReduction = confirmedStrategies
                           .filter(s => s.reductionType === 'absolute')
                           .reduce((sum, s) => sum + parseFloat(s.reductionTonnes || 0), 0);
                         const absoluteAsPercentage = emissions.total > 0 ? (absoluteReduction / emissions.total * 100) : 0;
                         const totalPercentage = percentageReduction + absoluteAsPercentage;
                         return totalPercentage.toFixed(1);
                       })()}%
                     </p>
                     <p className="text-xs text-gray-600 mt-1">Combined reduction from all strategies</p>
                   </div>
                   
                   <div className="bg-white p-3 rounded border border-blue-100">
                     <p className="text-sm font-medium text-gray-700">Projected Emissions After Implementation</p>
                     <p className="text-2xl font-bold text-green-600">
                       {(() => {
                         const confirmedStrategies = reductionStrategies.filter(s => s.isConfirmed);
                         const percentageReduction = confirmedStrategies
                           .filter(s => s.reductionType === 'percentage')
                           .reduce((sum, s) => sum + parseFloat(s.reductionPotential || 0), 0);
                         const absoluteReduction = confirmedStrategies
                           .filter(s => s.reductionType === 'absolute')
                           .reduce((sum, s) => sum + parseFloat(s.reductionTonnes || 0), 0);
                         const percentageReductionTonnes = emissions.total * (percentageReduction / 100);
                         const totalReductionTonnes = percentageReductionTonnes + absoluteReduction;
                         return Math.max(0, emissions.total - totalReductionTonnes).toFixed(2);
                       })()} tCO2e
                     </p>
                     <p className="text-xs text-gray-600 mt-1">Down from {emissions.total.toFixed(2)} tCO2e</p>
                   </div>
                   
                   <div className="bg-white p-3 rounded border border-blue-100">
                     <p className="text-sm font-medium text-gray-700">Emissions Reduction</p>
                     <p className="text-2xl font-bold text-green-600">
                       {(() => {
                         const confirmedStrategies = reductionStrategies.filter(s => s.isConfirmed);
                         const percentageReduction = confirmedStrategies
                           .filter(s => s.reductionType === 'percentage')
                           .reduce((sum, s) => sum + parseFloat(s.reductionPotential || 0), 0);
                         const absoluteReduction = confirmedStrategies
                           .filter(s => s.reductionType === 'absolute')
                           .reduce((sum, s) => sum + parseFloat(s.reductionTonnes || 0), 0);
                         const percentageReductionTonnes = emissions.total * (percentageReduction / 100);
                         const totalReductionTonnes = percentageReductionTonnes + absoluteReduction;
                         return totalReductionTonnes.toFixed(2);
                       })()} tCO2e
                     </p>
                     <p className="text-xs text-gray-600 mt-1">Total CO2e to be reduced</p>
                   </div>
                 </div>
                 
                 <div className="mt-4">
                   <p className="text-sm text-gray-700 mb-2">Strategy Implementation Timeline:</p>
                   <div className="flex flex-wrap gap-2">
                     <div className="flex items-center">
                       <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                       <span className="text-xs">Short-term ({reductionStrategies.filter(s => s.timeframe === 'short' && s.isConfirmed).length})</span>
                     </div>
                     <div className="flex items-center">
                       <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></div>
                       <span className="text-xs">Medium-term ({reductionStrategies.filter(s => s.timeframe === 'medium' && s.isConfirmed).length})</span>
                     </div>
                     <div className="flex items-center">
                       <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
                       <span className="text-xs">Long-term ({reductionStrategies.filter(s => s.timeframe === 'long' && s.isConfirmed).length})</span>
                     </div>
                   </div>
                 </div>
               </div>
             )}
             
             <div className="mb-6">
               <h4 className="text-lg font-semibold mb-3">Your Reduction Strategies</h4>
               
               {reductionStrategies.map((strategy, index) => (
                 <div key={index} className={`p-4 border rounded-lg mb-4 ${strategy.isConfirmed ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
                   <div className="flex justify-between items-start mb-4">
                     <h4 className="font-medium">
                       Strategy {index + 1}
                       {strategy.isConfirmed && (
                         <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                           Confirmed
                         </span>
                       )}
                     </h4>
                     <div className="flex items-center gap-2">
                       {!strategy.isConfirmed && strategy.name && (
                         <button
                           type="button"
                           onClick={() => confirmReductionStrategy(index)}
                           className="text-green-600 hover:text-green-800"
                           title="Confirm this reduction strategy"
                         >
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                             <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                           </svg>
                         </button>
                       )}
                       <button
                         type="button"
                         onClick={() => removeReductionStrategy(index)}
                         className="text-red-600 hover:text-red-800"
                       >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                         </svg>
                       </button>
                     </div>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Strategy Name</label>
                       <input
                         type="text"
                         value={strategy.name}
                         onChange={(e) => handleStrategyChange(index, 'name', e.target.value)}
                         className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                         readOnly={strategy.isConfirmed}
                       />
                     </div>
                     
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                       <select
                         value={strategy.category || 'energy-efficiency'}
                         onChange={(e) => handleStrategyChange(index, 'category', e.target.value)}
                         className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                         disabled={strategy.isConfirmed}
                       >
                         <option value="energy-efficiency">Energy Efficiency</option>
                         <option value="renewable-energy">Renewable Energy</option>
                         <option value="process-improvement">Process Improvement</option>
                         <option value="fleet-electrification">Fleet Electrification</option>
                         <option value="waste-reduction">Waste Reduction</option>
                         <option value="supply-chain">Supply Chain</option>
                         <option value="behavioral-change">Behavioral Change</option>
                         <option value="other">Other</option>
                       </select>
                     </div>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Reduction Type</label>
                       <select
                         value={strategy.reductionType || 'percentage'}
                         onChange={(e) => handleStrategyChange(index, 'reductionType', e.target.value)}
                         className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                         disabled={strategy.isConfirmed}
                       >
                         <option value="percentage">Percentage (%)</option>
                         <option value="absolute">Absolute (tCO2e)</option>
                       </select>
                     </div>
                     
                     <div>
                       {strategy.reductionType === 'absolute' ? (
                         <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">
                             Reduction Amount (tonnes CO2e)
                           </label>
                           <input
                             type="number"
                             value={strategy.reductionTonnes || 0}
                             onChange={(e) => handleStrategyChange(index, 'reductionTonnes', e.target.value)}
                             className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                             min="0"
                             step="0.1"
                             readOnly={strategy.isConfirmed}
                           />
                           {emissions.total > 0 && (
                             <p className="text-xs text-gray-600 mt-1">
                               Equivalent to {((parseFloat(strategy.reductionTonnes || 0) / emissions.total) * 100).toFixed(1)}% of total emissions
                             </p>
                           )}
                         </div>
                       ) : (
                         <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">
                             Reduction Potential (%)
                           </label>
                           <input
                             type="number"
                             value={strategy.reductionPotential}
                             onChange={(e) => handleStrategyChange(index, 'reductionPotential', e.target.value)}
                             className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                             min="0"
                             max="100"
                             step="0.1"
                             readOnly={strategy.isConfirmed}
                           />
                           {emissions.total > 0 && (
                             <p className="text-xs text-gray-600 mt-1">
                               Equivalent to {(emissions.total * (parseFloat(strategy.reductionPotential || 0) / 100)).toFixed(2)} tonnes CO2e
                             </p>
                           )}
                         </div>
                       )}
                     </div>
                   </div>
                   
                   <div className="mb-2">
                     <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                     <textarea
                       value={strategy.description}
                       onChange={(e) => handleStrategyChange(index, 'description', e.target.value)}
                       className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                       rows="2"
                       readOnly={strategy.isConfirmed}
                     />
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Implementation Cost</label>
                       <select
                         value={strategy.implementationCost}
                         onChange={(e) => handleStrategyChange(index, 'implementationCost', e.target.value)}
                         className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                         disabled={strategy.isConfirmed}
                       >
                         <option value="low">Low (&lt; $50k)</option>
                         <option value="medium">Medium ($50k-$500k)</option>
                         <option value="high">High (&gt; $500k)</option>
                       </select>
                     </div>
                     
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Implementation Timeframe</label>
                       <select
                         value={strategy.timeframe}
                         onChange={(e) => handleStrategyChange(index, 'timeframe', e.target.value)}
                         className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                         disabled={strategy.isConfirmed}
                       >
                         <option value="short">Short-term (&lt; 1 year)</option>
                         <option value="medium">Medium-term (1-3 years)</option>
                         <option value="long">Long-term (3-5 years)</option>
                       </select>
                     </div>
                     
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Implementation Year</label>
                       <input
                         type="number"
                         value={strategy.implementationYear || new Date().getFullYear()}
                         onChange={(e) => handleStrategyChange(index, 'implementationYear', parseInt(e.target.value))}
                         className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                         min={new Date().getFullYear()}
                         max={new Date().getFullYear() + 10}
                         readOnly={strategy.isConfirmed}
                       />
                     </div>
                   </div>
                   
                   {/* Show yearly reduction breakdown if confirmed */}
                   {strategy.isConfirmed && strategy.yearlyReductions && Object.keys(strategy.yearlyReductions).length > 0 && (
                     <div className="mt-3 p-3 bg-gray-50 rounded">
                       <p className="text-sm font-medium text-gray-700 mb-2">Yearly Reduction Schedule:</p>
                       <div className="space-y-1">
                         {Object.entries(strategy.yearlyReductions).map(([year, amount]) => (
                           <div key={year} className="flex justify-between text-sm">
                             <span>{year}:</span>
                             <span className="font-medium">-{amount.toFixed(2)} tCO2e</span>
                           </div>
                         ))}
                         </div>
                     </div>
                   )}
                 </div>
               ))}
               
               <button
                 type="button"
                 onClick={addReductionStrategy}
                 className="flex items-center text-blue-600 hover:text-blue-800"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                   <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                 </svg>
                 Add Reduction Strategy
               </button>
             </div>
             
             {hasRecommendedStrategies && (
               <div className="mb-4">
                 <h4 className="text-lg font-semibold mb-3">Recommended Strategies for {industries.find(i => i.id === normalizedIndustryType)?.name || 'Your Industry'}</h4>
                 
                 <div className="overflow-x-auto">
                   <table className="min-w-full bg-white border">
                     <thead>
                       <tr className="bg-gray-50">
                         <th className="py-2 px-3 border text-left">Strategy</th>
                         <th className="py-2 px-3 border text-left">Impact</th>
                         <th className="py-2 px-3 border text-left">Difficulty</th>
                         <th className="py-2 px-3 border text-left">Description</th>
                         <th className="py-2 px-3 border text-left">Actions</th>
                       </tr>
                     </thead>
                     <tbody>
                       {getRecommendedStrategies().map((strategy, index) => (
                         <tr key={index} className={index % 2 === 0 ? '' : 'bg-gray-50'}>
                           <td className="py-2 px-3 border">{strategy.name}</td>
                           <td className="py-2 px-3 border">
                             <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                               strategy.impact === 'High' ? 'bg-green-100 text-green-800' :
                               strategy.impact === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                               'bg-blue-100 text-blue-800'
                             }`}>
                               {strategy.impact}
                             </span>
                           </td>
                           <td className="py-2 px-3 border">
                             <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                               strategy.difficulty === 'Low' ? 'bg-green-100 text-green-800' :
                               strategy.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                               'bg-red-100 text-red-800'
                             }`}>
                               {strategy.difficulty}
                             </span>
                           </td>
                           <td className="py-2 px-3 border text-sm">{strategy.description}</td>
                           <td className="py-2 px-3 border">
                             <button
                               type="button"
                               onClick={() => {
                                 const newStrategy = {
                                   name: strategy.name,
                                   description: strategy.description,
                                   reductionPotential: strategy.impact === 'High' ? 25 : strategy.impact === 'Medium' ? 15 : 5,
                                   reductionType: 'percentage',
                                   reductionTonnes: 0,
                                   implementationCost: strategy.difficulty === 'High' ? 'high' : strategy.difficulty === 'Medium' ? 'medium' : 'low',
                                   timeframe: strategy.difficulty === 'High' ? 'long' : strategy.difficulty === 'Medium' ? 'medium' : 'short',
                                   category: 'energy-efficiency',
                                   implementationYear: new Date().getFullYear(),
                                   fullRealizationYear: new Date().getFullYear() + (strategy.difficulty === 'High' ? 4 : strategy.difficulty === 'Medium' ? 2 : 0),
                                   yearlyReductions: {},
                                   isConfirmed: false
                                 };
                                 setReductionStrategies(prev => [...prev, newStrategy]);
                               }}
                               className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                             >
                               Add to My Strategies
                             </button>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               </div>
             )}
           </div>
         )}
       </div>

       {/* STEP 6: Carbon Offsets */}
       <div className="mb-8 border rounded-lg overflow-hidden">
         <div 
           className="bg-gray-100 p-3 flex justify-between items-center cursor-pointer"
           onClick={() => toggleSection('offsets')}
         >
           <h3 className="text-md font-medium">Step 6: Select Carbon Offsets (if needed)</h3>
           <span>{activeSection.offsets ? '▼' : '▶'}</span>
         </div>
         
         {activeSection.offsets && (
           <div className="p-4">
             {/* Offset Requirements Section */}
             {(() => {
               const offsetReqs = getOffsetRequirements();
               return (
                 <div>
                   {/* Mandatory Requirements */}
                   {offsetReqs.isRequired && (
                     <div className="p-4 bg-red-50 rounded-lg border border-red-200 mb-4">
                       <h4 className="text-md font-medium text-red-800 flex items-center mb-2">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                         </svg>
                         Mandatory Carbon Offset Requirement
                       </h4>
                       <p className="text-sm mb-3">{offsetReqs.description}</p>
                       
                       <div className="bg-white p-3 rounded border border-red-100">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div>
                             <p className="text-sm font-medium text-gray-700">Required Offset Amount:</p>
                             <p className="text-2xl font-bold text-red-700">
                               {offsetReqs.offsetAmount.toFixed(0)} tCO2e
                               {offsetReqs.offsetPercentage > 0 && (
                                 <span className="text-sm font-normal text-gray-600 ml-2">
                                   ({offsetReqs.offsetPercentage}% of total)
                                 </span>
                               )}
                             </p>
                           </div>
                           
                           <div>
                             <p className="text-sm font-medium text-gray-700">Compliance Threshold:</p>
                             <p className="text-lg font-semibold">
                               {(offsetReqs.threshold || 0).toLocaleString()} tCO2e
                             </p>
                           </div>
                         </div>
                         
                         {offsetReqs.regulations && (
                           <p className="text-xs text-gray-600 mt-2">
                             <span className="font-medium">Regulation:</span> {offsetReqs.regulations}
                           </p>
                         )}
                       </div>
                     </div>
                   )}

                   {/* Credit Types and Schemes */}
                   <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
                     <h4 className="text-md font-medium text-blue-800 mb-3">
                       Available Carbon Credit Types & Schemes
                     </h4>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div>
                         <p className="text-sm font-medium text-gray-700 mb-2">Accepted Credit Types:</p>
                         <ul className="space-y-1">
                           {offsetReqs.creditTypes.map((type, index) => (
                             <li key={index} className="flex items-start text-sm">
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600 mr-1 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                               </svg>
                               <span>{type}</span>
                             </li>
                           ))}
                         </ul>
                         
                         {offsetReqs.allowInternational && (
                           <p className="text-xs text-gray-600 mt-2">
                             International credits allowed up to {offsetReqs.internationalLimit}%
                           </p>
                         )}
                       </div>
                       
                       <div>
                         <p className="text-sm font-medium text-gray-700 mb-2">Applicable Schemes:</p>
                         <ul className="space-y-1">
                           {offsetReqs.schemes.map((scheme, index) => (
                             <li key={index} className="flex items-start text-sm">
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600 mr-1 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                               </svg>
                               <span>{scheme}</span>
                             </li>
                           ))}
                         </ul>
                       </div>
                     </div>
                   </div>

                   {/* Voluntary Offset Options */}
                   <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                     <h4 className="text-md font-medium text-green-800 mb-3">
                       Voluntary Carbon Offsetting Options
                     </h4>
                     
                     <p className="text-sm text-gray-700 mb-3">
                       Even if not mandatory, consider voluntary offsetting to meet sustainability goals:
                     </p>
                     
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <div className="bg-white p-3 rounded border border-green-100">
                         <h5 className="font-medium text-sm mb-1">Carbon Neutral</h5>
                         <p className="text-2xl font-bold text-green-700">
                           {offsetReqs.voluntaryRecommendation.carbonNeutral.toFixed(0)} tCO2e
                         </p>
                         <p className="text-xs text-gray-600">Offset 100% of emissions</p>
                       </div>
                       
                       <div className="bg-white p-3 rounded border border-green-100">
                         <h5 className="font-medium text-sm mb-1">Science-Based Target</h5>
                         <p className="text-2xl font-bold text-green-700">
                           {offsetReqs.voluntaryRecommendation.scienceBasedTarget.toFixed(0)} tCO2e
                         </p>
                         <p className="text-xs text-gray-600">After 42.5% reduction</p>
                       </div>
                       
                       <div className="bg-white p-3 rounded border border-green-100">
                         <h5 className="font-medium text-sm mb-1">Net Zero</h5>
                         <p className="text-2xl font-bold text-green-700">
                           {offsetReqs.voluntaryRecommendation.netZero.toFixed(0)} tCO2e
                         </p>
                         <p className="text-xs text-gray-600">After 90% reduction</p>
                       </div>
                     </div>
                     
                     <div className="mt-4 flex flex-wrap gap-2">
                       <button 
                         onClick={() => setShowCreditsBrowser(true)}
                         className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                       >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                         </svg>
                         Browse Carbon Credits
                       </button>
                       
                       <a 
                         href="/carbon-projects" 
                         className="inline-flex items-center px-4 py-2 bg-white text-green-700 border border-green-600 rounded-md hover:bg-green-50 text-sm font-medium"
                       >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03-3-9s-1.343-9-3-9m-9 9a9 9 0 019-9" />
                         </svg>
                         View Listed Projects
                       </a>
                     </div>
                     
                     {/* Enhanced carbon projects display section */}
                     {selectedCarbonProjects.length > 0 && (
                       <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                         <h5 className="font-semibold text-green-800 mb-2 flex items-center">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                           </svg>
                           Selected Carbon Credit Projects
                         </h5>
                         <div className="space-y-2">
                           {selectedCarbonProjects.map(project => (
                             <div key={project.id} className="bg-white p-3 rounded border border-green-100">
                               <div className="flex items-start justify-between">
                                 <div className="flex-1">
                                   <div className="flex items-start justify-between">
                                     <div>
                                       <span className="font-medium text-sm">{project.name}</span>
                                       <div className="text-xs text-gray-600 mt-1">
                                         <span>{project.location}</span>
                                         {project.credit_type && <span> • {project.credit_type}</span>}
                                         {project.verification_standard && <span> • {project.verification_standard}</span>}
                                       </div>
                                     </div>
                                     
                                     {/* Action buttons */}
                                     <div className="flex items-center gap-1 ml-2">
                                       {editingProjectId !== project.id && (
                                         <>
                                           <button
                                             onClick={() => handleEditProject(project.id)}
                                             className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                             title="Edit quantity"
                                           >
                                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                             </svg>
                                           </button>
                                           <button
                                             onClick={() => handleRemoveProject(project.id)}
                                             className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                             title="Remove project"
                                           >
                                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                             </svg>
                                           </button>
                                         </>
                                       )}
                                     </div>
                                   </div>
                                   
                                   {/* Quantity display/edit */}
                                   <div className="mt-2">
                                     {editingProjectId === project.id ? (
                                       <div className="flex items-center gap-2">
                                         <label className="text-sm font-medium">Credits:</label>
                                         <input
                                           type="number"
                                           value={editQuantity}
                                           onChange={(e) => setEditQuantity(parseInt(e.target.value) || 0)}
                                           className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                                           min="1"
                                           max={project.reduction_target || project.availableCredits || 100000}
                                         />
                                         <span className="text-sm text-gray-600">tCO2e</span>
                                         <button
                                           onClick={() => handleSaveProjectEdit(project.id)}
                                           className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                         >
                                           Save
                                         </button>
                                         <button
                                           onClick={handleCancelEdit}
                                           className="px-2 py-1 bg-gray-300 text-gray-700 rounded text-xs hover:bg-gray-400"
                                         >
                                           Cancel
                                         </button>
                                       </div>
                                     ) : (
                                       <div className="flex items-center gap-3">
                                         <span className="text-green-600 font-medium">
                                           {(project.selectedQuantity || 0).toLocaleString()} tCO2e
                                         </span>
                                         {(project.pricePerTonne || project.price_per_tonne) && (
                                           <span className="text-sm text-gray-600">
                                             (${((project.pricePerTonne || project.price_per_tonne || 0) * (project.selectedQuantity || 0)).toLocaleString()})
                                           </span>
                                         )}
                                       </div>
                                     )}
                                   </div>
                                 </div>
                               </div>
                             </div>
                           ))}
                         </div>
                         
                         {/* Enhanced compliance tracking section */}
                         <div className="mt-3 pt-3 border-t border-green-200">
                           <div className="flex justify-between font-semibold">
                             <span>Total Offset Selected:</span>
                             <span className="text-green-600">
                               {selectedCarbonProjects.reduce((sum, p) => sum + (p.selectedQuantity || 0), 0).toLocaleString()} tCO2e
                             </span>
                           </div>
                           
                           {/* Compliance Status */}
                           {offsetReqs.isRequired && (
                             <div className="mt-3 p-3 bg-white rounded border">
                               <h6 className="font-medium text-sm mb-2">Compliance Status</h6>
                               {(() => {
                                 const totalSelected = selectedCarbonProjects.reduce((sum, p) => sum + (p.selectedQuantity || 0), 0);
                                 const requiredAmount = offsetReqs.offsetAmount;
                                 const percentageCompliant = requiredAmount > 0 ? (totalSelected / requiredAmount * 100) : 0;
                                 const isFullyCompliant = percentageCompliant >= 100;
                                 
                                 return (
                                   <>
                                     <div className="flex items-center justify-between mb-2">
                                       <span className="text-sm text-gray-600">Required Offset:</span>
                                       <span className="font-medium">{requiredAmount.toFixed(0)} tCO2e</span>
                                     </div>
                                     <div className="flex items-center justify-between mb-2">
                                       <span className="text-sm text-gray-600">Selected Offset:</span>
                                       <span className="font-medium">{totalSelected.toLocaleString()} tCO2e</span>
                                     </div>
                                     <div className="flex items-center justify-between mb-3">
                                       <span className="text-sm text-gray-600">Remaining:</span>
                                       <span className={`font-medium ${isFullyCompliant ? 'text-green-600' : 'text-red-600'}`}>
                                         {Math.max(0, requiredAmount - totalSelected).toFixed(0)} tCO2e
                                       </span>
                                     </div>
                                     
                                     {/* Progress bar */}
                                     <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                                       <div 
                                         className={`h-2.5 rounded-full ${
                                           isFullyCompliant ? 'bg-green-600' : 'bg-yellow-400'
                                         }`}
                                         style={{ width: `${Math.min(100, percentageCompliant)}%` }}
                                       ></div>
                                     </div>
                                     
                                     <div className="text-center">
                                       <span className={`text-sm font-medium ${
                                         isFullyCompliant ? 'text-green-600' : 'text-yellow-600'
                                       }`}>
                                         {percentageCompliant.toFixed(1)}% Compliant
                                       </span>
                                       {isFullyCompliant && (
                                         <div className="text-xs text-green-600 mt-1">
                                           ✓ Meets mandatory offset requirements
                                         </div>
                                       )}
                                     </div>
                                   </>
                                 );
                               })()}
                             </div>
                           )}
                           
                           {/* Voluntary offset tracking */}
                           {!offsetReqs.isRequired && (
                             <div className="mt-3 p-3 bg-white rounded border">
                               <h6 className="font-medium text-sm mb-2">Voluntary Offset Progress</h6>
                               {(() => {
                                 const totalSelected = selectedCarbonProjects.reduce((sum, p) => sum + (p.selectedQuantity || 0), 0);
                                 const targets = offsetReqs.voluntaryRecommendation;
                                 
                                 return (
                                   <div className="space-y-2">
                                     <div className="flex items-center justify-between">
                                       <span className="text-xs text-gray-600">Carbon Neutral Target:</span>
                                       <span className="text-xs font-medium">
                                         {totalSelected.toLocaleString()} / {targets.carbonNeutral.toFixed(0)} tCO2e
                                         ({(totalSelected / targets.carbonNeutral * 100).toFixed(1)}%)
                                       </span>
                                     </div>
                                     <div className="flex items-center justify-between">
                                       <span className="text-xs text-gray-600">Science-Based Target:</span>
                                       <span className="text-xs font-medium">
                                         {totalSelected.toLocaleString()} / {targets.scienceBasedTarget.toFixed(0)} tCO2e
                                         ({(totalSelected / targets.scienceBasedTarget * 100).toFixed(1)}%)
                                       </span>
                                     </div>
                                     <div className="flex items-center justify-between">
                                       <span className="text-xs text-gray-600">Net Zero Target:</span>
                                       <span className="text-xs font-medium">
                                         {totalSelected.toLocaleString()} / {targets.netZero.toFixed(0)} tCO2e
                                         ({(totalSelected / targets.netZero * 100).toFixed(1)}%)
                                       </span>
                                     </div>
                                   </div>
                                 );
                               })()}
                             </div>
                           )}
                         </div>
                       </div>
                     )}
                   </div>
                 </div>
               );
             })()}
           </div>
         )}
       </div>

       {/* STEP 7: Comprehensive Summary */}
       <div className="mb-8 border-2 border-green-300 rounded-lg overflow-hidden">
         <div 
           className="bg-green-100 p-3 flex justify-between items-center cursor-pointer"
           onClick={() => toggleSection('summary')}
         >
           <h3 className="text-md font-medium">Step 7: Review Complete Emissions Reduction Plan</h3>
           <span>{activeSection.summary ? '▼' : '▶'}</span>
         </div>
         
         {activeSection.summary && (
           <div className="p-4 bg-green-50">
             {/* Comprehensive Emissions Reduction Summary */}
             <div className="bg-white p-4 rounded border mb-6">
               <h3 className="text-lg font-semibold mb-4">Emissions Reduction Summary</h3>
               {(() => {
                 // Calculate reduction from strategies
                 const confirmedStrategies = reductionStrategies.filter(s => s.isConfirmed);
                 const percentageReduction = confirmedStrategies
                   .filter(s => s.reductionType === 'percentage')
                   .reduce((sum, s) => sum + parseFloat(s.reductionPotential || 0), 0);
                 const absoluteReduction = confirmedStrategies
                   .filter(s => s.reductionType === 'absolute')
                   .reduce((sum, s) => sum + parseFloat(s.reductionTonnes || 0), 0);
                 const percentageReductionTonnes = emissions.total * (percentageReduction / 100);
                 const totalStrategyReduction = percentageReductionTonnes + absoluteReduction;
                 
                 // Calculate carbon credits
                 const totalCreditsSelected = selectedCarbonProjects.reduce((sum, p) => sum + (p.selectedQuantity || 0), 0);
                 
                 // Calculate target vs actual
                 const targetReductionTonnes = emissions.total * (reductionTarget / 100);
                 const totalPlannedReduction = totalStrategyReduction + totalCreditsSelected;
                 const remainingGap = Math.max(0, targetReductionTonnes - totalPlannedReduction);
                 
                 return (
                   <div className="overflow-x-auto">
                     <table className="min-w-full bg-gray-50 rounded">
                       <thead>
                         <tr className="border-b border-gray-200">
                           <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Reduction Method</th>
                           <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">Tonnes CO2e</th>
                           <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">% of Total Emissions</th>
                           <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">Status</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-200">
                         <tr className="bg-white">
                           <td className="py-3 px-4 text-sm">
                             <div className="flex items-center">
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                               </svg>
                               <span className="font-medium">Target Reduction</span>
                             </div>
                           </td>
                           <td className="py-3 px-4 text-sm text-right font-semibold">{targetReductionTonnes.toFixed(2)}</td>
                           <td className="py-3 px-4 text-sm text-right">{reductionTarget}%</td>
                           <td className="py-3 px-4 text-sm text-right">
                             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                               Target Set
                             </span>
                           </td>
                         </tr>
                         
                         <tr className="bg-white">
                           <td className="py-3 px-4 text-sm">
                             <div className="flex items-center">
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                               </svg>
                               <span>Reduction Strategies</span>
                               <span className="ml-2 text-xs text-gray-500">({confirmedStrategies.length} confirmed)</span>
                             </div>
                           </td>
                           <td className="py-3 px-4 text-sm text-right">{totalStrategyReduction.toFixed(2)}</td>
                           <td className="py-3 px-4 text-sm text-right">
                             {((totalStrategyReduction / emissions.total) * 100).toFixed(1)}%
                           </td>
                           <td className="py-3 px-4 text-sm text-right">
                             {confirmedStrategies.length > 0 ? (
                               <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                 Active
                               </span>
                             ) : (
                               <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                 None Confirmed
                               </span>
                             )}
                           </td>
                         </tr>
                         
                         <tr className="bg-white">
                           <td className="py-3 px-4 text-sm">
                             <div className="flex items-center">
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                               </svg>
                               <span>Carbon Credits</span>
                               <span className="ml-2 text-xs text-gray-500">({selectedCarbonProjects.length} projects)</span>
                             </div>
                           </td>
                           <td className="py-3 px-4 text-sm text-right">{totalCreditsSelected.toLocaleString()}</td>
                           <td className="py-3 px-4 text-sm text-right">
                             {((totalCreditsSelected / emissions.total) * 100).toFixed(1)}%
                           </td>
                           <td className="py-3 px-4 text-sm text-right">
                             {totalCreditsSelected > 0 ? (
                               <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                 Selected
                               </span>
                             ) : (
                               <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                 None Selected
                               </span>
                             )}
                           </td>
                         </tr>
                         
                         <tr className="bg-blue-50 font-semibold">
                           <td className="py-3 px-4 text-sm">
                             <div className="flex items-center">
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                               </svg>
                               Total Planned Reduction
                             </div>
                           </td>
                           <td className="py-3 px-4 text-sm text-right text-blue-700">{totalPlannedReduction.toFixed(2)}</td>
                           <td className="py-3 px-4 text-sm text-right text-blue-700">
                             {((totalPlannedReduction / emissions.total) * 100).toFixed(1)}%
                           </td>
                           <td className="py-3 px-4 text-sm text-right">
                             {totalPlannedReduction >= targetReductionTonnes ? (
                               <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                 Target Met
                               </span>
                             ) : (
                               <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                 Gap: {remainingGap.toFixed(0)} tCO2e
                               </span>
                             )}
                           </td>
                         </tr>
                       </tbody>
                     </table>
                     
                     {/* Additional Summary Info */}
                     <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                       <div className="bg-gray-50 p-3 rounded">
                         <p className="text-sm font-medium text-gray-700">Baseline Emissions</p>
                         <p className="text-xl font-bold">{emissions.total.toFixed(2)} tCO2e</p>
                       </div>
                       <div className="bg-gray-50 p-3 rounded">
                         <p className="text-sm font-medium text-gray-700">Net Emissions After Reduction</p>
                         <p className="text-xl font-bold text-green-600">
                           {Math.max(0, emissions.total - totalPlannedReduction).toFixed(2)} tCO2e
                         </p>
                       </div>
                       <div className="bg-gray-50 p-3 rounded">
                         <p className="text-sm font-medium text-gray-700">Achievement vs Target</p>
                         <p className="text-xl font-bold">
                           {totalPlannedReduction >= targetReductionTonnes ? (
                             <span className="text-green-600">
                               +{(((totalPlannedReduction / targetReductionTonnes) - 1) * 100).toFixed(0)}% 
                             </span>
                           ) : (
                             <span className="text-red-600">
                               -{((remainingGap / targetReductionTonnes) * 100).toFixed(0)}%
                             </span>
                           )}
                         </p>
                       </div>
                     </div>
                   </div>
                 );
               })()}
             </div>
           </div>
         )}
       </div>
       
        {/* Save and Generate Report Buttons */}
        <div className="flex items-center gap-4">
         <div className="text-sm text-gray-600">
           💡 Save your emissions data and update the current scenario
         </div>
         
         <button
           type="button"
           onClick={handleManualSave}
           disabled={loading}
           className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
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
               Update Scenario with Emissions
             </>
           )}
         </button>
       </div>
     </div>
     
     {/* Carbon Credits Browser Modal */}
     {showCreditsBrowser && (
       <CarbonCreditsBrowser
         isOpen={showCreditsBrowser}
         onClose={() => setShowCreditsBrowser(false)}
         applicableSchemes={getApplicableSchemes()}
         location={location}
         onSelectProject={handleProjectSelection}
         requiredOffset={getOffsetRequirements().offsetAmount}
         voluntaryTargets={getOffsetRequirements().voluntaryRecommendation}
       />
     )}
     
     {/* Emissions Report Modal */}
     <EmissionsReportModal />
   </div>
 );
};

export default EmissionsCalculator;