import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { generateReportPDF, emailReport } from '../utils/pdfExportUtil';
import reportStorage from '../Services/reportStorage';

// Helper function to safely convert values to numbers
const safeNumber = (value) => {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

// Comprehensive emission factors with references
const EMISSION_FACTORS = {
  // Scope 1 - Direct Emissions
  naturalGas: { factor: 5.3, unit: 'kg CO2e/therm', reference: 'EPA Emission Factors Hub 2024' },
  diesel: { factor: 2.68, unit: 'kg CO2e/liter', reference: 'EPA Emission Factors Hub 2024' },
  petrol: { factor: 2.31, unit: 'kg CO2e/liter', reference: 'EPA Emission Factors Hub 2024' },
  vehicleFuel: { factor: 2.5, unit: 'kg CO2e/liter', reference: 'Average of diesel/petrol, EPA 2024' },
  refrigerantR410a: { factor: 2088, unit: 'kg CO2e/kg', reference: 'IPCC AR5 GWP values' },
  refrigerantR134a: { factor: 1430, unit: 'kg CO2e/kg', reference: 'IPCC AR5 GWP values' },
  refrigerantR32: { factor: 675, unit: 'kg CO2e/kg', reference: 'IPCC AR5 GWP values' },
  refrigerantR404a: { factor: 3922, unit: 'kg CO2e/kg', reference: 'IPCC AR5 GWP values' },
  
  // Industrial processes
  steelProduction: { factor: 2100, unit: 'kg CO2e/tonne', reference: 'World Steel Association 2023' },
  cementProduction: { factor: 820, unit: 'kg CO2e/tonne', reference: 'WBCSD Cement CO2 Protocol' },
  aluminumProduction: { factor: 12000, unit: 'kg CO2e/tonne', reference: 'International Aluminium Institute 2023' },
  chemicalUsage: { factor: 1500, unit: 'kg CO2e/tonne', reference: 'Industry average, ICCA 2023' },
  
  // Agriculture
  livestockCattle: { factor: 2300, unit: 'kg CO2e/head/year', reference: 'IPCC 2019 Guidelines Vol 4 Ch 10 Table 10.11' },
  livestockDairyCows: { factor: 3200, unit: 'kg CO2e/head/year', reference: 'IPCC 2019 Guidelines Vol 4 Ch 10 Table 10.11' },
  livestockPigs: { factor: 200, unit: 'kg CO2e/head/year', reference: 'IPCC 2019 Guidelines Vol 4 Ch 10 Table 10.12' },
  livestockSheep: { factor: 150, unit: 'kg CO2e/head/year', reference: 'IPCC 2019 Guidelines Vol 4 Ch 10 Table 10.13' },
  livestockPoultry: { factor: 5, unit: 'kg CO2e/head/year', reference: 'IPCC 2019 Guidelines Vol 4 Ch 10' },
  
  // Fertilizers
  fertilizersNitrogen: { factor: 4.42, unit: 'kg CO2e/kg N', reference: 'IPCC 2019 Guidelines Vol 4 Ch 11 Eq 11.1' },
  fertilizersPhosphorus: { factor: 0.2, unit: 'kg CO2e/kg P2O5', reference: 'Brentrup et al. 2016' },
  fertilizersPotassium: { factor: 0.15, unit: 'kg CO2e/kg K2O', reference: 'Brentrup et al. 2016' },
  fertilizersUrea: { factor: 3.7, unit: 'kg CO2e/kg', reference: 'IPCC 2019 Guidelines Vol 4 Ch 11' },
  
  // Land use
  landUseChange: { factor: 500, unit: 'kg CO2e/hectare', reference: 'IPCC 2019 Guidelines Vol 4 Ch 2' },
  riceProduction: { factor: 1370, unit: 'kg CO2e/hectare', reference: 'IPCC 2019 Guidelines Vol 4 Ch 5.5' },
  
  // Scope 2 - Indirect Emissions
  electricity: { factor: 0.42, unit: 'kg CO2e/kWh', reference: 'National Grid Average 2024' },
  renewableElectricity: { factor: 0, unit: 'kg CO2e/kWh', reference: 'Zero emissions for certified renewable' },
  steamPurchased: { factor: 65, unit: 'kg CO2e/MMBtu', reference: 'EPA Emission Factors Hub 2024' },
  heatingPurchased: { factor: 73, unit: 'kg CO2e/MMBtu', reference: 'EPA Emission Factors Hub 2024' },
  coolingPurchased: { factor: 65, unit: 'kg CO2e/MMBtu', reference: 'EPA Emission Factors Hub 2024' },
  dataCenter: { factor: 0.42, unit: 'kg CO2e/kWh', reference: 'Grid average with PUE 1.6' },
  
  // Scope 3 - Value Chain
  businessFlights: { factor: 0.24, unit: 'kg CO2e/passenger mile', reference: 'DEFRA 2024 Business Travel' },
  businessTravel: { factor: 0.185, unit: 'kg CO2e/km', reference: 'DEFRA 2024 Average car' },
  hotelStays: { factor: 20, unit: 'kg CO2e/night', reference: 'Cornell Hotel Sustainability 2023' },
  employeeCommuting: { factor: 0.155, unit: 'kg CO2e/passenger mile', reference: 'EPA Commuter Model 2024' },
  wasteGenerated: { factor: 467, unit: 'kg CO2e/tonne', reference: 'EPA WARM Model 2024' },
  wasteRecycled: { factor: -150, unit: 'kg CO2e/tonne', reference: 'EPA WARM Model 2024 (avoided)' },
  wasteComposted: { factor: -180, unit: 'kg CO2e/tonne', reference: 'EPA WARM Model 2024 (avoided)' },
  waterUsage: { factor: 0.35, unit: 'kg CO2e/m³', reference: 'Water UK 2023' },
  wastewater: { factor: 0.71, unit: 'kg CO2e/m³', reference: 'IPCC 2019 Guidelines Vol 5 Ch 6' },
  paperConsumption: { factor: 183, unit: 'kg CO2e/ream', reference: 'EPA Paper Calculator 2024' },
  purchasedGoods: { factor: 0.5, unit: 'kg CO2e/$', reference: 'EEIO Model average' },
  freight: { factor: 0.15, unit: 'kg CO2e/tonne-km', reference: 'GLEC Framework 2023' },
  
  // IT Equipment
  laptops: { factor: 350, unit: 'kg CO2e/unit', reference: 'Dell Product Carbon Footprint 2023' },
  monitors: { factor: 500, unit: 'kg CO2e/unit', reference: 'Industry average LCA studies' },
  smartphones: { factor: 70, unit: 'kg CO2e/unit', reference: 'Apple Environmental Report 2023' },
  servers: { factor: 3000, unit: 'kg CO2e/unit', reference: 'HPE Carbon Footprint Data 2023' }
};

const EmissionsReportGenerator = ({ projectId, emissionsData, reductionStrategies, organizationInfo, currentUser, scenarios }) => {
  const [reportData, setReportData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [reportType, setReportType] = useState('standard');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [companyDetails, setCompanyDetails] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [reportPreparer, setReportPreparer] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('Self-declared (pending third-party verification)');

  // Enhanced company details with additional fields
  const [additionalCompanyInfo, setAdditionalCompanyInfo] = useState({
    companyName: '',
    businessNumber: '',
    registeredAddress: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    website: ''
  });

  // Add state for branding
  const [brandingOptions, setBrandingOptions] = useState({
    primaryColor: '#228B22', // Default green
    secondaryColor: '#3B82F6', // Default blue
    accentColor: '#EF4444', // Default red
    fontFamily: 'Arial',
    logoUrl: ''
  });

  // Use organizationInfo passed as prop instead of fetching
  useEffect(() => {
    if (organizationInfo) {
      setCompanyDetails({
        name: organizationInfo.companyName || organizationInfo.organizationType || 'Organization',
        size: {
          revenue: safeNumber(organizationInfo.annualRevenue),
          employees: safeNumber(organizationInfo.employeeCount),
          facilities: safeNumber(organizationInfo.facilityCount),
          fleetSize: safeNumber(organizationInfo.fleetSize)
        },
        isListed: organizationInfo.isListed || false,
        industryType: organizationInfo.industryType || 'Not specified',
        location: organizationInfo.location || 'Not specified',
        reportingYear: safeNumber(organizationInfo.reportingYear) || new Date().getFullYear() - 1
      });
    }
  }, [organizationInfo]);

  // Set report preparer based on current user
  useEffect(() => {
    if (currentUser) {
      const name = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.name || 'Unknown';
      setReportPreparer(name);
    }
  }, [currentUser]);
  // Generate report data - UPDATED to properly use emissions data
  useEffect(() => {
    const currentDate = new Date();
    
    const reportId = `REP-${projectId || 'NEW'}-${currentDate.getFullYear()}${String(currentDate.getMonth() + 1).padStart(2, '0')}${String(currentDate.getDate()).padStart(2, '0')}`;
    
    // Format date for display
    const formattedDate = currentDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Ensure emissions data is properly structured with safe numbers
    const emissions = emissionsData?.emissions ? {
      scope1: safeNumber(emissionsData.emissions.scope1),
      scope2: safeNumber(emissionsData.emissions.scope2),
      scope3: safeNumber(emissionsData.emissions.scope3),
      total: safeNumber(emissionsData.emissions.total)
    } : {
      scope1: 0,
      scope2: 0,
      scope3: 0,
      total: 0
    };
    
    // Extract detailed emission values for comprehensive reporting
    const detailedEmissions = emissionsData?.detailedEmissions || emissionsData?.emissionValues || {};
    const rawInputs = emissionsData?.rawInputs || {};
    
    // Handle reduction strategies - FIXED with better handling of both percentage and absolute values
    const validStrategies = Array.isArray(reductionStrategies) 
      ? reductionStrategies.filter(s => s && (s.strategy || s.name)).map(strategy => {
          let absoluteReduction = 0;
          let reductionPercentage = 0;
          
          // Check the reduction type explicitly
          if (strategy.reductionType === 'absolute') {
            // For absolute type, use reductionTonnes field
            absoluteReduction = safeNumber(strategy.reductionTonnes);
            reductionPercentage = emissions.total > 0 ? (absoluteReduction / emissions.total * 100) : 0;
            console.log(`Strategy "${strategy.name}" - Absolute: ${absoluteReduction} tonnes (${reductionPercentage.toFixed(1)}%)`);
          } else if (strategy.reductionType === 'percentage') {
            // For percentage type, use reductionPotential field
            reductionPercentage = safeNumber(strategy.reductionPotential);
            absoluteReduction = emissions.total * (reductionPercentage / 100);
            console.log(`Strategy "${strategy.name}" - Percentage: ${reductionPercentage}% (${absoluteReduction.toFixed(2)} tonnes)`);
          } else {
            // Fallback logic for legacy data or when reductionType is not set
            const reductionValue = safeNumber(strategy.potentialReduction || strategy.reductionPotential || strategy.reductionTonnes);
            
            if (reductionValue > 100) {
              // Likely absolute tonnes
              absoluteReduction = reductionValue;
              reductionPercentage = emissions.total > 0 ? (absoluteReduction / emissions.total * 100) : 0;
              console.log(`Strategy "${strategy.name}" - Inferred Absolute: ${absoluteReduction} tonnes`);
            } else {
              // Likely percentage
              reductionPercentage = reductionValue;
              absoluteReduction = emissions.total * (reductionPercentage / 100);
              console.log(`Strategy "${strategy.name}" - Inferred Percentage: ${reductionPercentage}%`);
            }
          }
          
          return {
            ...strategy,
            potentialReduction: absoluteReduction,
            reductionPercentage: reductionPercentage,
            strategy: strategy.strategy || strategy.name,
            name: strategy.name || strategy.strategy,
            capex: safeNumber(strategy.capex || strategy.implementationCost || 0),
            opexSavings: safeNumber(strategy.opexSavings || 0),
            scope: strategy.scope || 'Various',
            timeframe: strategy.timeframe || 'TBD'
          };
        })
      : [];
    
    // Add debug logging
    console.log('DEBUG - Original strategies:', reductionStrategies);
    console.log('DEBUG - Mapped strategies:', validStrategies);
    console.log('DEBUG - Total emissions:', emissions.total);
    
    // Calculate reduction percentages by scope with safe numbers
    const reductionsByScope = {
      scope1: validStrategies
        .filter(s => s.scope === 'Scope 1')
        .reduce((total, s) => total + safeNumber(s.potentialReduction), 0),
      scope2: validStrategies
        .filter(s => s.scope === 'Scope 2')
        .reduce((total, s) => total + safeNumber(s.potentialReduction), 0),
      scope3: validStrategies
        .filter(s => s.scope === 'Scope 3')
        .reduce((total, s) => total + safeNumber(s.potentialReduction), 0)
    };
    
    // Calculate percentage reductions with safe division
    const reductionPercentages = {
      scope1: emissions.scope1 > 0 
        ? (reductionsByScope.scope1 / emissions.scope1) * 100 
        : 0,
      scope2: emissions.scope2 > 0 
        ? (reductionsByScope.scope2 / emissions.scope2) * 100 
        : 0,
      scope3: emissions.scope3 > 0 
        ? (reductionsByScope.scope3 / emissions.scope3) * 100 
        : 0,
      total: emissions.total > 0 
        ? ((reductionsByScope.scope1 + reductionsByScope.scope2 + reductionsByScope.scope3) / emissions.total) * 100 
        : 0
    };
    
    // Generate 5-year projection data
    const generateFiveYearProjection = () => {
      const years = [];
      const currentYear = currentDate.getFullYear();
      
      // Annual emissions reduction rate
      const annualReductionRate = reductionPercentages.total / 100 / 5; // Spread over 5 years
      
      // Start with current emissions
      let currentEmissions = emissions.total || 0;
      const targetReduction = safeNumber(emissionsData?.reductionTarget || 20) / 100;
      
      // Add data for current year and next 4 years
      for (let i = 0; i < 5; i++) {
        years.push({
          year: currentYear + i,
          emissions: i === 0 ? currentEmissions : currentEmissions * (1 - annualReductionRate * i),
          target: currentEmissions * (1 - targetReduction * (i / 4))
        });
      }
      
      return years;
    };

    // Determine regulatory group based on organization info
    const annualRevenue = safeNumber(organizationInfo?.annualRevenue);
    const employeeCount = safeNumber(organizationInfo?.employeeCount);
    const revenueInMillions = annualRevenue / 1000000;
    
    let regulatoryGroup = 0;
    if (revenueInMillions >= 500 || employeeCount >= 500) {
      regulatoryGroup = 1;
    } else if (revenueInMillions >= 200 || employeeCount >= 250) {
      regulatoryGroup = 2;
    } else if (revenueInMillions >= 50 || employeeCount >= 100) {
      regulatoryGroup = 3;
    }

    // Determine applicable standards based on location and emissions data
    const getApplicableStandards = (location) => {
      // Use standards from emissions data if available
      if (emissionsData?.applicableSchemes && emissionsData.applicableSchemes.length > 0) {
        return emissionsData.applicableSchemes;
      }
      
      const standards = {
        'australia': ['NGER Act', 'Climate Active', 'TCFD'],
        'united_states': ['EPA GHG Reporting', 'SEC Climate Disclosure', 'TCFD'],
        'european_union': ['EU CSRD', 'EU Taxonomy', 'SFDR'],
        'united_kingdom': ['UK SECR', 'TCFD', 'UK Taxonomy'],
        'canada': ['ECCC Reporting', 'TCFD', 'OSFI Guidelines'],
        'new_zealand': ['Climate Standards', 'TCFD', 'XRB Standards'],
        'japan': ['GHG Reporting System', 'TCFD', 'METI Guidelines'],
        'singapore': ['SGX Climate Reporting', 'TCFD', 'MAS Guidelines'],
        'default': ['GHG Protocol', 'ISO 14064', 'TCFD']
      };
      
      return standards[location] || standards.default;
    };

    // Extract reporting requirements and compliance data from emissions data
    const reportingRequirements = emissionsData?.reportingRequirements || [];
    const offsetRequirements = emissionsData?.offsetRequirements || {};

    setReportData({
      reportId,
      formattedDate,
      companyName: companyDetails?.name || organizationInfo?.companyName || 'Unknown Organization',
      industry: organizationInfo?.industryType || emissionsData?.industryType || 'Not specified',
      country: organizationInfo?.location || emissionsData?.location || 'Not specified',
      emissions: emissions,
      detailedEmissions: detailedEmissions,
      rawInputs: rawInputs,
      reductionTarget: safeNumber(emissionsData?.reductionTarget) || 20,
      strategies: validStrategies,
      reductionPercentages,
      reductionsByScope,
      fiveYearProjection: generateFiveYearProjection(),
      companySize: emissionsData?.companySize || 'Not specified',
      regulatoryGroup,
      projectId,
      // Add additional data for compliance reports
      reportingPeriod: safeNumber(emissionsData?.reportingYear || organizationInfo?.reportingYear) || new Date().getFullYear() - 1,
      baselineYear: safeNumber(organizationInfo?.baselineYear) || new Date().getFullYear() - 1,
      consolidationApproach: 'Operational control',
      emissionFactorSource: 'Government published emission factors (DEFRA, EPA, NGER)',
      verificationStatus: verificationStatus,
      reportPreparer: reportPreparer || currentUser ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() : 'Unknown',
      preparerTitle: currentUser?.title || 'Sustainability Manager',
      carbonCreditPrice: safeNumber(emissionsData?.carbonCreditPrice) || 25,
      applicableStandards: getApplicableStandards(organizationInfo?.location || emissionsData?.location),
      organizationDetails: companyDetails,
      dataQuality: 'Primary data where available, secondary data based on industry averages',
      boundaries: 'Organizational boundaries set using operational control approach',
      exclusions: 'No material exclusions from the inventory',
      uncertaintyLevel: '±10% for Scope 1 & 2, ±30% for Scope 3 emissions',
      annualRevenue: safeNumber(organizationInfo?.annualRevenue),
      employeeCount: safeNumber(organizationInfo?.employeeCount),
      organizationType: organizationInfo?.organizationType || 'Corporate',
      // Add compliance-specific data
      reportingRequirements: reportingRequirements,
      offsetRequirements: offsetRequirements,
      emissionFactors: emissionsData?.emissionFactors || [],
      location: organizationInfo?.location || emissionsData?.location || 'Not specified'
    });
  }, [emissionsData, reductionStrategies, companyDetails, projectId, organizationInfo, currentUser, reportPreparer, verificationStatus]);
  // Save report to database
  const saveReport = async () => {
    try {
      setLoading(true);
      
      // Save to local storage
      const result = reportStorage.saveReport(reportData);
      
      if (result.success) {
        alert(`Report saved successfully!\nReport ID: ${result.reportId}\n\nYou can access saved reports from the Reports section.`);
      } else {
        throw new Error(result.error || 'Failed to save report');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error saving report:', error);
      setLoading(false);
      alert('Error saving report. Please try again.');
    }
  };

  // Handle exporting PDF - Updated version with chart support
  const handleExportPDF = async () => {
    try {
      setIsDownloading(true);
      
      // Get the report element
      const reportElement = document.getElementById('emissions-report');
      if (!reportElement) {
        throw new Error('Report element not found');
      }
      
      // Get chart elements
      const chartElements = {
        scopePieChart: document.getElementById('scope-pie-chart'),
        strategyBarChart: document.getElementById('strategy-bar-chart'),
        projectionLineChart: document.getElementById('projection-line-chart')
      };
      
      // Prepare complete report data including all emissions details
      const enhancedReportData = {
        ...reportData, // Include all existing report data
        
        // Add branding options
        branding: brandingOptions,
        
        // Ensure all emissions data is included
        rawInputs: reportData.rawInputs || emissionsData?.rawInputs || {},
        detailedEmissions: reportData.detailedEmissions || emissionsData?.detailedEmissions || emissionsData?.emissionValues || {},
        emissionValues: reportData.detailedEmissions || emissionsData?.emissionValues || {},
        
        // Ensure compliance data is included
        reportingRequirements: reportData.reportingRequirements || emissionsData?.reportingRequirements || [],
        offsetRequirements: reportData.offsetRequirements || emissionsData?.offsetRequirements || {},
        emissionFactors: reportData.emissionFactors || emissionsData?.emissionFactors || [],
        location: reportData.location || organizationInfo?.location || emissionsData?.location || 'Not specified',
        
        // Company info with all fields
        companyInfo: {
          companyName: additionalCompanyInfo.companyName || organizationInfo?.companyName || reportData.companyName || 'Organization Name',
          businessNumber: additionalCompanyInfo.businessNumber || organizationInfo?.businessNumber || 'Not provided',
          registeredAddress: additionalCompanyInfo.registeredAddress || organizationInfo?.registeredAddress || 'Not provided',
          contactPerson: additionalCompanyInfo.contactPerson || reportPreparer || currentUser?.name || 'Not provided',
          contactEmail: additionalCompanyInfo.contactEmail || organizationInfo?.contactEmail || currentUser?.email || 'Not provided',
          contactPhone: additionalCompanyInfo.contactPhone || organizationInfo?.contactPhone || 'Not provided',
          website: additionalCompanyInfo.website || organizationInfo?.website || 'Not provided'
        },
        
        // Organization details
        organizationDetails: {
          ...reportData.organizationDetails,
          size: {
            employees: safeNumber(organizationInfo?.employeeCount || reportData.employeeCount),
            facilities: safeNumber(organizationInfo?.facilityCount),
            fleetSize: safeNumber(organizationInfo?.fleetSize),
            revenue: safeNumber(organizationInfo?.annualRevenue || reportData.annualRevenue)
          }
        },
        
        // Additional fields for comprehensive reporting
        emissionBreakdown: {
          scope1: {
            stationary: safeNumber(reportData.detailedEmissions?.stationary),
            mobile: safeNumber(reportData.detailedEmissions?.mobile),
            process: safeNumber(reportData.detailedEmissions?.process),
            refrigerants: safeNumber(reportData.detailedEmissions?.refrigerants),
            livestock: safeNumber(reportData.detailedEmissions?.livestock),
            fertilizers: safeNumber(reportData.detailedEmissions?.fertilizers)
          },
          scope2: {
            electricity: safeNumber(reportData.detailedEmissions?.electricity),
            steam: safeNumber(reportData.detailedEmissions?.steam),
            heating: safeNumber(reportData.detailedEmissions?.heating),
            cooling: safeNumber(reportData.detailedEmissions?.cooling)
          },
          scope3: {
            purchasedGoods: safeNumber(reportData.detailedEmissions?.purchased_goods),
            businessTravel: safeNumber(reportData.detailedEmissions?.business_travel),
            employeeCommuting: safeNumber(reportData.detailedEmissions?.employee_commuting),
            waste: safeNumber(reportData.detailedEmissions?.waste),
            waterUsage: safeNumber(reportData.detailedEmissions?.waterUsage)
          }
        },
        
        // Include scenarios if available
        scenarios: scenarios || [],
        
        // Include reduction strategies with proper formatting - ensuring all strategies are included
        reductionStrategies: (reportData.strategies || reductionStrategies || []).map(strategy => ({
          ...strategy,
          name: strategy.name || strategy.strategy || 'Unnamed Strategy',
          potentialReduction: safeNumber(strategy.potentialReduction), // Already converted to tonnes
          reductionPercentage: safeNumber(strategy.reductionPercentage), // Store percentage for display
          scope: strategy.scope || 'Various',
          timeframe: strategy.timeframe || 'TBD',
          capex: safeNumber(strategy.capex),
          opexSavings: safeNumber(strategy.opexSavings)
        })),
        
        // Add chart data for PDF generation
        chartData: prepareChartData()
      };
      
      console.log('Enhanced report data being sent to PDF generator:', enhancedReportData);
      console.log('Strategies included:', enhancedReportData.reductionStrategies.length);
      console.log('Strategy details:', enhancedReportData.reductionStrategies);
      
      // Generate PDF with complete data and chart elements
      const pdf = await generateReportPDF(enhancedReportData, reportElement, chartElements);
      
      // Download the PDF
      const fileName = `Carbon_Emissions_Report_${organizationInfo?.companyName || 'Organization'}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      // Show success message
      alert('Report downloaded successfully!');
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(`Error generating PDF: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle email report
  const handleEmailReport = async () => {
    try {
      setEmailing(true);
      
      // Prompt for email address
      const email = prompt('Enter recipient email address:');
      
      if (email) {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          throw new Error('Invalid email address format');
        }
        
        // Send email using the utility
        await emailReport(reportData, email);
        
        alert(`Report successfully sent to ${email}`);
      }
      
      setEmailing(false);
      
    } catch (error) {
      console.error('Error sending email:', error);
      setEmailing(false);
      alert(error.message || 'Error sending email. Please try again.');
    }
  };

  // Prepare data for charts - FIXED to ensure all strategies are included
  const prepareChartData = () => {
    if (!reportData) return null;
    
    // Scope breakdown data with safe numbers
    const scopeData = [
      { name: 'Scope 1', value: safeNumber(reportData.emissions.scope1) },
      { name: 'Scope 2', value: safeNumber(reportData.emissions.scope2) },
      { name: 'Scope 3', value: safeNumber(reportData.emissions.scope3) }
    ].filter(item => item.value > 0); // Only show scopes with emissions
    
    // Strategy reduction data - Include ALL strategies, not just those with > 0 reduction
    const strategyData = reportData.strategies
      .map(strategy => ({
        name: strategy.strategy || strategy.name,
        value: safeNumber(strategy.potentialReduction)
      }))
      .sort((a, b) => b.value - a.value) // Sort by value descending
      .slice(0, 10); // Show top 10 strategies
    
    // Add debug logging
    console.log('DEBUG - Chart data strategies:', strategyData);
    
    // Projection data
    const projectionData = reportData.fiveYearProjection;
    
    // Colors for charts
    const COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6'];
    
    return {
      scopeData,
      strategyData,
      projectionData,
      COLORS
    };
  };

  const chartData = prepareChartData();

  // Helper function to calculate emissions with proper conversion
  const calculateEmissionValue = (rawValue, factor, conversionToTonnes = 1000) => {
    const safeRawValue = safeNumber(rawValue);
    if (safeRawValue === 0) return 0;
    // Check if detailedEmissions has the calculated value
    const calculatedValue = safeRawValue * factor / conversionToTonnes;
    return calculatedValue;
  };

  // If still loading or data not ready
  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-base">Preparing report data...</p>
      </div>
    );
  }

  // Handle case where no data exists
  if (!reportData || !chartData) {
    return (
      <div className="p-6 text-center">
        <p className="text-base">No emissions data available. Please add emissions data first.</p>
      </div>
    );
  }

  // Add better error handling for missing data
  if (!chartData || !chartData.strategyData || chartData.strategyData.length === 0) {
    console.warn('No valid strategy data available for charts');
  }

  // Company Information Form
  const renderCompanyInfoForm = () => (
    <>
      {/* Branding Options */}
      <div className="mb-6 p-4 bg-gray-50 rounded">
        <h3 className="text-lg font-bold mb-4">Report Branding Options</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Primary Color</label>
            <input
              type="color"
              value={brandingOptions.primaryColor}
              onChange={(e) => setBrandingOptions({...brandingOptions, primaryColor: e.target.value})}
              className="w-full h-10 rounded cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Secondary Color</label>
            <input
              type="color"
              value={brandingOptions.secondaryColor}
              onChange={(e) => setBrandingOptions({...brandingOptions, secondaryColor: e.target.value})}
              className="w-full h-10 rounded cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Accent Color</label>
            <input
              type="color"
              value={brandingOptions.accentColor}
              onChange={(e) => setBrandingOptions({...brandingOptions, accentColor: e.target.value})}
              className="w-full h-10 rounded cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Font Family</label>
            <select
              value={brandingOptions.fontFamily}
              onChange={(e) => setBrandingOptions({...brandingOptions, fontFamily: e.target.value})}
              className="w-full p-2 border rounded text-sm"
            >
              <option value="Arial">Arial</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Georgia">Georgia</option>
              <option value="Verdana">Verdana</option>
              <option value="Calibri">Calibri</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Logo URL (optional)</label>
            <input
              type="url"
              value={brandingOptions.logoUrl}
              onChange={(e) => setBrandingOptions({...brandingOptions, logoUrl: e.target.value})}
              className="w-full p-2 border rounded text-sm"
              placeholder="https://example.com/logo.png"
            />
          </div>
        </div>
        <div className="mt-4 p-3 bg-white rounded border">
          <p className="text-xs text-gray-600">
            Preview: <span style={{color: brandingOptions.primaryColor, fontFamily: brandingOptions.fontFamily}}>Primary</span> | 
            <span style={{color: brandingOptions.secondaryColor, fontFamily: brandingOptions.fontFamily}}> Secondary</span> | 
            <span style={{color: brandingOptions.accentColor, fontFamily: brandingOptions.fontFamily}}> Accent</span>
          </p>
        </div>
      </div>

      {/* Company Information */}
      <div className="mb-6 p-4 bg-gray-50 rounded">
        <h3 className="text-lg font-bold mb-4">Company Information (Required for Compliance)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Company Legal Name *</label>
            <input
              type="text"
              value={additionalCompanyInfo.companyName}
              onChange={(e) => setAdditionalCompanyInfo({...additionalCompanyInfo, companyName: e.target.value})}
              className="w-full p-2 border rounded text-sm"
              placeholder="Carbon Prospect Pty Ltd"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Business Number (ABN/EIN/Registration) *</label>
            <input
              type="text"
              value={additionalCompanyInfo.businessNumber}
              onChange={(e) => setAdditionalCompanyInfo({...additionalCompanyInfo, businessNumber: e.target.value})}
              className="w-full p-2 border rounded text-sm"
              placeholder="12 345 678 901"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Registered Address *</label>
            <input
              type="text"
              value={additionalCompanyInfo.registeredAddress}
              onChange={(e) => setAdditionalCompanyInfo({...additionalCompanyInfo, registeredAddress: e.target.value})}
              className="w-full p-2 border rounded text-sm"
              placeholder="123 Business St, City, State, ZIP"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Report Contact Person *</label>
            <input
              type="text"
              value={additionalCompanyInfo.contactPerson}
              onChange={(e) => setAdditionalCompanyInfo({...additionalCompanyInfo, contactPerson: e.target.value})}
              className="w-full p-2 border rounded text-sm"
              placeholder="John Smith"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Contact Email *</label>
            <input
              type="email"
              value={additionalCompanyInfo.contactEmail}
              onChange={(e) => setAdditionalCompanyInfo({...additionalCompanyInfo, contactEmail: e.target.value})}
              className="w-full p-2 border rounded text-sm"
              placeholder="sustainability@company.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Contact Phone</label>
            <input
              type="tel"
              value={additionalCompanyInfo.contactPhone}
              onChange={(e) => setAdditionalCompanyInfo({...additionalCompanyInfo, contactPhone: e.target.value})}
              className="w-full p-2 border rounded text-sm"
              placeholder="+1 234 567 8900"
            />
          </div>
        </div>
      </div>
    </>
  );
  // Render comprehensive report content
  const renderReportContent = () => {
    const textStyle = "text-sm"; // Consistent text size throughout
    
    return (
      <div className={textStyle}>
        {/* Report Header */}
        <div className="mb-8 border-b-2 border-gray-300 pb-4">
          <h1 className="text-2xl font-bold text-center mb-2">GREENHOUSE GAS EMISSIONS REPORT</h1>
          <h2 className="text-xl text-center mb-4">{additionalCompanyInfo.companyName || reportData.companyName}</h2>
          <div className="text-center text-gray-600">
            <p>Report ID: {reportData.reportId}</p>
            <p>Reporting Period: {reportData.reportingPeriod}</p>
            <p>Generated: {reportData.formattedDate}</p>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="mb-6">
          <h3 className="text-lg font-bold mb-3 text-blue-800">EXECUTIVE SUMMARY</h3>
          <div className="bg-blue-50 p-4 rounded">
            <p className={`${textStyle} mb-2`}>
              This greenhouse gas emissions report has been prepared in accordance with the requirements of the GHG Protocol Corporate Standard, 
              ISO 14064-1, and applicable regulatory requirements for {reportData.country}.
            </p>
            <p className={`${textStyle} mb-2`}>
              <strong>Total Emissions:</strong> {safeNumber(reportData.emissions.total).toFixed(2)} tonnes CO2e
            </p>
            <p className={`${textStyle} mb-2`}>
              <strong>Reduction Target:</strong> {safeNumber(reportData.reductionTarget).toFixed(0)}% by {new Date().getFullYear() + 5}
            </p>
            <p className={`${textStyle} mb-2`}>
              <strong>Total Reduction Potential:</strong> {safeNumber(reportData.reductionPercentages.total).toFixed(1)}% ({safeNumber(reportData.reductionsByScope.scope1 + reportData.reductionsByScope.scope2 + reportData.reductionsByScope.scope3).toFixed(2)} tonnes CO2e)
            </p>
            <p className={textStyle}>
              <strong>Reporting Standards:</strong> {reportData.applicableStandards.join(', ')}
            </p>
          </div>
        </div>

        {/* Organization Details */}
        <div className="mb-6">
          <h3 className="text-lg font-bold mb-3 text-blue-800">1. ORGANIZATION DETAILS</h3>
          <table className="w-full border-collapse">
            <tbody>
              <tr className="border-b">
                <td className={`${textStyle} font-medium py-2 w-1/3`}>Legal Entity Name:</td>
                <td className={`${textStyle} py-2`}>{additionalCompanyInfo.companyName || reportData.companyName}</td>
              </tr>
              <tr className="border-b">
                <td className={`${textStyle} font-medium py-2`}>Business Registration Number:</td>
                <td className={`${textStyle} py-2`}>{additionalCompanyInfo.businessNumber || 'Not provided'}</td>
              </tr>
              <tr className="border-b">
                <td className={`${textStyle} font-medium py-2`}>Registered Address:</td>
                <td className={`${textStyle} py-2`}>{additionalCompanyInfo.registeredAddress || 'Not provided'}</td>
              </tr>
              <tr className="border-b">
                <td className={`${textStyle} font-medium py-2`}>Industry Sector:</td>
                <td className={`${textStyle} py-2`}>{reportData.industry}</td>
              </tr>
              <tr className="border-b">
                <td className={`${textStyle} font-medium py-2`}>Number of Employees:</td>
                <td className={`${textStyle} py-2`}>{safeNumber(reportData.organizationDetails?.size?.employees).toFixed(0)}</td>
              </tr>
              <tr className="border-b">
                <td className={`${textStyle} font-medium py-2`}>Number of Facilities:</td>
                <td className={`${textStyle} py-2`}>{safeNumber(reportData.organizationDetails?.size?.facilities).toFixed(0)}</td>
              </tr>
              <tr className="border-b">
                <td className={`${textStyle} font-medium py-2`}>Fleet Size:</td>
                <td className={`${textStyle} py-2`}>{safeNumber(reportData.organizationDetails?.size?.fleetSize).toFixed(0)} vehicles</td>
              </tr>
              <tr className="border-b">
                <td className={`${textStyle} font-medium py-2`}>Annual Revenue:</td>
                <td className={`${textStyle} py-2`}>${safeNumber(reportData.organizationDetails?.size?.revenue).toLocaleString()}</td>
              </tr>
              <tr className="border-b">
                <td className={`${textStyle} font-medium py-2`}>Reporting Contact:</td>
                <td className={`${textStyle} py-2`}>{additionalCompanyInfo.contactPerson || reportData.reportPreparer}</td>
              </tr>
              <tr className="border-b">
                <td className={`${textStyle} font-medium py-2`}>Contact Email:</td>
                <td className={`${textStyle} py-2`}>{additionalCompanyInfo.contactEmail || 'Not provided'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Reporting Methodology */}
        <div className="mb-6">
          <h3 className="text-lg font-bold mb-3 text-blue-800">2. REPORTING METHODOLOGY & BOUNDARIES</h3>
          <div className="space-y-2">
            <p className={textStyle}><strong>Consolidation Approach:</strong> {reportData.consolidationApproach}</p>
            <p className={textStyle}><strong>Organizational Boundaries:</strong> {reportData.boundaries}</p>
            <p className={textStyle}><strong>Operational Boundaries:</strong> All Scope 1, 2, and material Scope 3 emissions</p>
            <p className={textStyle}><strong>Base Year:</strong> {safeNumber(reportData.baselineYear).toFixed(0)}</p>
            <p className={textStyle}><strong>Reporting Period:</strong> January 1 - December 31, {safeNumber(reportData.reportingPeriod).toFixed(0)}</p>
            <p className={textStyle}><strong>GHG Gases Included:</strong> CO2, CH4, N2O, HFCs, PFCs, SF6, NF3</p>
            <p className={textStyle}><strong>Emission Factor Sources:</strong> {reportData.emissionFactorSource}</p>
            <p className={textStyle}><strong>Data Quality:</strong> {reportData.dataQuality}</p>
            <p className={textStyle}><strong>Exclusions:</strong> {reportData.exclusions}</p>
            <p className={textStyle}><strong>Uncertainty Level:</strong> {reportData.uncertaintyLevel}</p>
          </div>
        </div>

        {/* Emissions Summary with Visual - UPDATED WITH FIXED FORMATTING */}
        <div className="mb-6">
          <h3 className="text-lg font-bold mb-3 text-blue-800">3. EMISSIONS SUMMARY</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Emissions Table - FIXED FORMATTING */}
            <div>
              <table className="w-full border-collapse border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={`${textStyle} font-medium p-2 border text-center`}>Emission Scope</th>
                    <th className={`${textStyle} font-medium p-2 border text-center`}>Emissions (tCO2e)</th>
                    <th className={`${textStyle} font-medium p-2 border text-center`}>% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={`${textStyle} p-2 border`}>Scope 1 - Direct Emissions</td>
                    <td className={`${textStyle} p-2 border text-center`}>{safeNumber(reportData.emissions.scope1).toFixed(2)}</td>
                    <td className={`${textStyle} p-2 border text-center`}>
                      {reportData.emissions.total > 0 ? (safeNumber(reportData.emissions.scope1) / safeNumber(reportData.emissions.total) * 100).toFixed(1) : '0.0'}%
                    </td>
                  </tr>
                  <tr>
                    <td className={`${textStyle} p-2 border`}>Scope 2 - Indirect Emissions</td>
                    <td className={`${textStyle} p-2 border text-center`}>{safeNumber(reportData.emissions.scope2).toFixed(2)}</td>
                    <td className={`${textStyle} p-2 border text-center`}>
                      {reportData.emissions.total > 0 ? (safeNumber(reportData.emissions.scope2) / safeNumber(reportData.emissions.total) * 100).toFixed(1) : '0.0'}%
                    </td>
                  </tr>
                  <tr>
                    <td className={`${textStyle} p-2 border`}>Scope 3 - Value Chain Emissions</td>
                    <td className={`${textStyle} p-2 border text-center`}>{safeNumber(reportData.emissions.scope3).toFixed(2)}</td>
                    <td className={`${textStyle} p-2 border text-center`}>
                      {reportData.emissions.total > 0 ? (safeNumber(reportData.emissions.scope3) / safeNumber(reportData.emissions.total) * 100).toFixed(1) : '0.0'}%
                    </td>
                  </tr>
                  <tr className="font-bold bg-gray-100">
                    <td className={`${textStyle} p-2 border`}>TOTAL EMISSIONS</td>
                    <td className={`${textStyle} p-2 border text-center`}>{safeNumber(reportData.emissions.total).toFixed(2)}</td>
                    <td className={`${textStyle} p-2 border text-center`}>100.0%</td>
                  </tr>
                </tbody>
              </table>
              
              {/* Carbon Intensity Metrics */}
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <h4 className={`${textStyle} font-bold mb-2`}>Carbon Intensity Metrics</h4>
                <p className={textStyle}>Per Employee: {safeNumber(reportData.organizationDetails?.size?.employees) > 0 
                  ? (safeNumber(reportData.emissions.total) / safeNumber(reportData.organizationDetails.size.employees)).toFixed(2) 
                  : '0.00'} tonnes CO2e/employee</p>
                <p className={textStyle}>Per $M Revenue: {safeNumber(reportData.organizationDetails?.size?.revenue) > 0 
                  ? (safeNumber(reportData.emissions.total) / (safeNumber(reportData.organizationDetails.size.revenue) / 1000000)).toFixed(2) 
                  : '0.00'} tonnes CO2e/$M</p>
              </div>
            </div>

            {/* Pie Chart */}
            <div id="scope-pie-chart" className="bg-white p-4 rounded border">
              <h4 className={`${textStyle} font-semibold mb-2 text-center`}>Emissions by Scope</h4>
              <div className="h-64">
                {chartData.scopeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.scopeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {chartData.scopeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={chartData.COLORS[index % chartData.COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => safeNumber(value).toFixed(2) + ' tonnes CO2e'} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No emissions data available
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Detailed Emissions Breakdown - ENHANCED with proper calculations */}
        <div className="mb-6">
          <h3 className="text-lg font-bold mb-3 text-blue-800">4. DETAILED EMISSIONS BREAKDOWN</h3>
          
          {/* Scope 1 Details */}
          <div className="mb-4">
            <h4 className={`${textStyle} font-bold mb-2`}>Scope 1 - Direct Emissions</h4>
            <table className="w-full border-collapse border text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className={`${textStyle} p-2 border text-left`}>Source</th>
                  <th className={`${textStyle} p-2 border text-center`}>Activity Data</th>
                  <th className={`${textStyle} p-2 border text-center`}>Emission Factor</th>
                  <th className={`${textStyle} p-2 border text-center`}>Emissions (tCO2e)</th>
                </tr>
              </thead>
              <tbody>
                {/* Stationary Combustion */}
                {safeNumber(reportData.rawInputs?.naturalGas) > 0 && (
                  <tr>
                    <td className={`${textStyle} p-2 border`}>Natural Gas Combustion</td>
                    <td className={`${textStyle} p-2 border text-center`}>{safeNumber(reportData.rawInputs.naturalGas).toLocaleString()} therms</td>
                    <td className={`${textStyle} p-2 border text-center`}>{EMISSION_FACTORS.naturalGas.factor} {EMISSION_FACTORS.naturalGas.unit}</td>
                    <td className={`${textStyle} p-2 border text-center`}>
                      {reportData.detailedEmissions?.naturalGas 
                        ? (safeNumber(reportData.detailedEmissions.naturalGas) / 1000).toFixed(2)
                        : calculateEmissionValue(reportData.rawInputs.naturalGas, EMISSION_FACTORS.naturalGas.factor, 1).toFixed(2)}
                    </td>
                  </tr>
                )}
                
                {/* Mobile Combustion */}
                {safeNumber(reportData.rawInputs?.diesel) > 0 && (
                  <tr>
                    <td className={`${textStyle} p-2 border`}>Diesel Fuel</td>
                    <td className={`${textStyle} p-2 border text-center`}>{safeNumber(reportData.rawInputs.diesel).toLocaleString()} liters</td>
                    <td className={`${textStyle} p-2 border text-center`}>{EMISSION_FACTORS.diesel.factor} {EMISSION_FACTORS.diesel.unit}</td>
                    <td className={`${textStyle} p-2 border text-center`}>
                      {reportData.detailedEmissions?.diesel 
                        ? (safeNumber(reportData.detailedEmissions.diesel) / 1000).toFixed(2)
                        : calculateEmissionValue(reportData.rawInputs.diesel, EMISSION_FACTORS.diesel.factor, 1).toFixed(2)}
                    </td>
                  </tr>
                )}
                {safeNumber(reportData.rawInputs?.petrol) > 0 && (
                  <tr>
                    <td className={`${textStyle} p-2 border`}>Petrol Fuel</td>
                    <td className={`${textStyle} p-2 border text-center`}>{safeNumber(reportData.rawInputs.petrol).toLocaleString()} liters</td>
                    <td className={`${textStyle} p-2 border text-center`}>{EMISSION_FACTORS.petrol.factor} {EMISSION_FACTORS.petrol.unit}</td>
                    <td className={`${textStyle} p-2 border text-center`}>
                      {reportData.detailedEmissions?.petrol 
                        ? (safeNumber(reportData.detailedEmissions.petrol) / 1000).toFixed(2)
                        : calculateEmissionValue(reportData.rawInputs.petrol, EMISSION_FACTORS.petrol.factor, 1).toFixed(2)}
                    </td>
                  </tr>
                )}
                
                {/* Refrigerants */}
                {safeNumber(reportData.rawInputs?.refrigerantR410a) > 0 && (
                  <tr>
                    <td className={`${textStyle} p-2 border`}>R-410A Refrigerant Leakage</td>
                    <td className={`${textStyle} p-2 border text-center`}>{safeNumber(reportData.rawInputs.refrigerantR410a).toLocaleString()} kg</td>
                    <td className={`${textStyle} p-2 border text-center`}>{EMISSION_FACTORS.refrigerantR410a.factor} {EMISSION_FACTORS.refrigerantR410a.unit}</td>
                    <td className={`${textStyle} p-2 border text-center`}>
                      {reportData.detailedEmissions?.refrigerantR410a 
                        ? (safeNumber(reportData.detailedEmissions.refrigerantR410a) / 1000).toFixed(2)
                        : calculateEmissionValue(reportData.rawInputs.refrigerantR410a, EMISSION_FACTORS.refrigerantR410a.factor, 1).toFixed(2)}
                    </td>
                  </tr>
                )}
                
                {/* Industrial Processes */}
                {safeNumber(reportData.rawInputs?.steelProduction) > 0 && (
                  <tr>
                    <td className={`${textStyle} p-2 border`}>Steel Production</td>
                    <td className={`${textStyle} p-2 border text-center`}>{safeNumber(reportData.rawInputs.steelProduction).toLocaleString()} tonnes</td>
                    <td className={`${textStyle} p-2 border text-center`}>{EMISSION_FACTORS.steelProduction.factor} {EMISSION_FACTORS.steelProduction.unit}</td>
                    <td className={`${textStyle} p-2 border text-center`}>
                      {reportData.detailedEmissions?.steelProduction 
                        ? (safeNumber(reportData.detailedEmissions.steelProduction) / 1000).toFixed(2)
                        : calculateEmissionValue(reportData.rawInputs.steelProduction, EMISSION_FACTORS.steelProduction.factor, 1).toFixed(2)}
                    </td>
                  </tr>
                )}
                
                {/* Agriculture-specific */}
                {safeNumber(reportData.rawInputs?.livestockCattle) > 0 && (
                  <tr>
                    <td className={`${textStyle} p-2 border`}>Cattle (Enteric Fermentation)</td>
                    <td className={`${textStyle} p-2 border text-center`}>{safeNumber(reportData.rawInputs.livestockCattle).toLocaleString()} head</td>
                    <td className={`${textStyle} p-2 border text-center`}>{EMISSION_FACTORS.livestockCattle.factor} {EMISSION_FACTORS.livestockCattle.unit}</td>
                    <td className={`${textStyle} p-2 border text-center`}>
                      {reportData.detailedEmissions?.livestockCattle 
                        ? (safeNumber(reportData.detailedEmissions.livestockCattle) / 1000).toFixed(2)
                        : calculateEmissionValue(reportData.rawInputs.livestockCattle, EMISSION_FACTORS.livestockCattle.factor, 1).toFixed(2)}
                    </td>
                  </tr>
                )}
                
                {/* Show aggregated if no details */}
                {(!reportData.rawInputs || Object.keys(reportData.rawInputs).length === 0) && safeNumber(reportData.emissions?.scope1) > 0 && (
                  <tr>
                    <td className={`${textStyle} p-2 border`}>Direct Emissions (aggregated)</td>
                    <td className={`${textStyle} p-2 border text-center`}>Various sources</td>
                    <td className={`${textStyle} p-2 border text-center`}>-</td>
                    <td className={`${textStyle} p-2 border text-center`}>{safeNumber(reportData.emissions.scope1).toFixed(2)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Scope 2 Details */}
          <div className="mb-4">
          <h4 className={`${textStyle} font-bold mb-2`}>Scope 2 - Indirect Emissions (Electricity)</h4>
            <table className="w-full border-collapse border text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className={`${textStyle} p-2 border text-left`}>Source</th>
                  <th className={`${textStyle} p-2 border text-center`}>Activity Data</th>
                  <th className={`${textStyle} p-2 border text-center`}>Emission Factor</th>
                  <th className={`${textStyle} p-2 border text-center`}>Emissions (tCO2e)</th>
                </tr>
              </thead>
              <tbody>
                {safeNumber(reportData.rawInputs?.electricity) > 0 && (
                  <tr>
                    <td className={`${textStyle} p-2 border`}>Grid Electricity</td>
                    <td className={`${textStyle} p-2 border text-center`}>{safeNumber(reportData.rawInputs.electricity).toLocaleString()} kWh</td>
                    <td className={`${textStyle} p-2 border text-center`}>{EMISSION_FACTORS.electricity.factor} {EMISSION_FACTORS.electricity.unit}</td>
                    <td className={`${textStyle} p-2 border text-center`}>
                      {reportData.detailedEmissions?.electricity 
                        ? (safeNumber(reportData.detailedEmissions.electricity) / 1000).toFixed(2)
                        : calculateEmissionValue(reportData.rawInputs.electricity, EMISSION_FACTORS.electricity.factor, 1).toFixed(2)}
                    </td>
                  </tr>
                )}
                {/* Show aggregated if no details */}
                {(!reportData.rawInputs || Object.values(reportData.rawInputs).filter(v => safeNumber(v) > 0).length === 0) && safeNumber(reportData.emissions?.scope2) > 0 && (
                  <tr>
                    <td className={`${textStyle} p-2 border`}>Indirect Energy Emissions (aggregated)</td>
                    <td className={`${textStyle} p-2 border text-center`}>Various sources</td>
                    <td className={`${textStyle} p-2 border text-center`}>-</td>
                    <td className={`${textStyle} p-2 border text-center`}>{safeNumber(reportData.emissions.scope2).toFixed(2)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Scope 3 Details */}
          <div className="mb-4">
            <h4 className={`${textStyle} font-bold mb-2`}>Scope 3 - Value Chain Emissions</h4>
            <table className="w-full border-collapse border text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className={`${textStyle} p-2 border text-left`}>Category</th>
                  <th className={`${textStyle} p-2 border text-center`}>Activity Data</th>
                  <th className={`${textStyle} p-2 border text-center`}>Emission Factor</th>
                  <th className={`${textStyle} p-2 border text-center`}>Emissions (tCO2e)</th>
                </tr>
              </thead>
              <tbody>
                {/* Purchased Goods */}
                {safeNumber(reportData.rawInputs?.purchasedGoods) > 0 && (
                  <tr>
                    <td className={`${textStyle} p-2 border`}>Purchased Goods & Services</td>
                    <td className={`${textStyle} p-2 border text-center`}>${safeNumber(reportData.rawInputs.purchasedGoods).toLocaleString()}</td>
                    <td className={`${textStyle} p-2 border text-center`}>{EMISSION_FACTORS.purchasedGoods.factor} {EMISSION_FACTORS.purchasedGoods.unit}</td>
                    <td className={`${textStyle} p-2 border text-center`}>
                      {reportData.detailedEmissions?.purchasedGoods 
                        ? (safeNumber(reportData.detailedEmissions.purchasedGoods) / 1000).toFixed(2)
                        : calculateEmissionValue(reportData.rawInputs.purchasedGoods, EMISSION_FACTORS.purchasedGoods.factor, 1).toFixed(2)}
                    </td>
                  </tr>
                )}
                
                {/* Business Travel */}
                {safeNumber(reportData.rawInputs?.businessFlights) > 0 && (
                  <tr>
                    <td className={`${textStyle} p-2 border`}>Business Travel (Air)</td>
                    <td className={`${textStyle} p-2 border text-center`}>{safeNumber(reportData.rawInputs.businessFlights).toLocaleString()} passenger miles</td>
                    <td className={`${textStyle} p-2 border text-center`}>{EMISSION_FACTORS.businessFlights.factor} {EMISSION_FACTORS.businessFlights.unit}</td>
                    <td className={`${textStyle} p-2 border text-center`}>
                      {reportData.detailedEmissions?.businessFlights 
                        ? (safeNumber(reportData.detailedEmissions.businessFlights) / 1000).toFixed(2)
                        : calculateEmissionValue(reportData.rawInputs.businessFlights, EMISSION_FACTORS.businessFlights.factor, 1).toFixed(2)}
                    </td>
                  </tr>
                )}
                
                {/* Show aggregated if no details */}
                {(!reportData.rawInputs || Object.values(reportData.rawInputs).filter(v => safeNumber(v) > 0).length === 0) && safeNumber(reportData.emissions?.scope3) > 0 && (
                  <tr>
                    <td className={`${textStyle} p-2 border`}>Value Chain Emissions (aggregated)</td>
                    <td className={`${textStyle} p-2 border text-center`}>Various sources</td>
                    <td className={`${textStyle} p-2 border text-center`}>-</td>
                    <td className={`${textStyle} p-2 border text-center`}>{safeNumber(reportData.emissions.scope3).toFixed(2)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Reduction Strategies and Projections */}
        <div className="mb-6">
          <h3 className="text-lg font-bold mb-3 text-blue-800">5. REDUCTION STRATEGIES & PROJECTIONS</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            {/* Strategy Impact Chart */}
            <div id="strategy-bar-chart" className="bg-white p-4 rounded border">
              <h4 className={`${textStyle} font-semibold mb-2`}>Top Reduction Strategies Impact</h4>
              <div className="h-64">
                {chartData.strategyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData.strategyData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={(value) => safeNumber(value).toFixed(1)} />
                      <YAxis type="category" dataKey="name" width={120} tick={{fontSize: 12}} />
                      <Tooltip formatter={(value) => safeNumber(value).toFixed(2) + ' tonnes CO2e'} />
                      <Bar dataKey="value" name="Emissions Reduction">
                        {chartData.strategyData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={chartData.COLORS[index % chartData.COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No reduction strategies defined
                  </div>
                )}
              </div>
            </div>
            
            {/* 5-Year Projection */}
            <div id="projection-line-chart" className="bg-white p-4 rounded border">
              <h4 className={`${textStyle} font-semibold mb-2`}>5-Year Emissions Projection</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData.projectionData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis tickFormatter={(value) => safeNumber(value).toFixed(0)} />
                    <Tooltip formatter={(value) => safeNumber(value).toFixed(2) + ' tonnes CO2e'} />
                    <Legend />
                    <Line type="monotone" dataKey="emissions" name="Projected Emissions" stroke="#3498db" strokeWidth={2} />
                    <Line type="monotone" dataKey="target" name="Target Pathway" stroke="#e74c3c" strokeWidth={2} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* Detailed Strategy Table - FIXED to show all strategies including those with 0 reduction */}
          {reportData.strategies.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={`${textStyle} p-2 border text-left`}>Strategy</th>
                    <th className={`${textStyle} p-2 border text-left`}>Scope</th>
                    <th className={`${textStyle} p-2 border text-center`}>Reduction (tCO2e)<br /><span className="text-xs font-normal">& Percentage</span></th>
                    <th className={`${textStyle} p-2 border text-left`}>Timeframe</th>
                    <th className={`${textStyle} p-2 border text-center`}>CAPEX</th>
                    <th className={`${textStyle} p-2 border text-center`}>Annual Savings</th>
                    <th className={`${textStyle} p-2 border text-center`}>Payback (years)</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.strategies.map((strategy, index) => (
                    <tr key={strategy.id || index}>
                      <td className={`${textStyle} p-2 border`}>{strategy.strategy || strategy.name}</td>
                      <td className={`${textStyle} p-2 border`}>{strategy.scope}</td>
                      <td className={`${textStyle} p-2 border text-center`}>
                        {safeNumber(strategy.potentialReduction).toFixed(2)}
                        {strategy.reductionPercentage && strategy.reductionPercentage > 0 && (
                          <>
                            <br />
                            <span className="text-xs text-gray-600">({strategy.reductionPercentage.toFixed(1)}%)</span>
                          </>
                        )}
                      </td>
                      <td className={`${textStyle} p-2 border`}>{strategy.timeframe}</td>
                      <td className={`${textStyle} p-2 border text-center`}>${safeNumber(strategy.capex).toLocaleString()}</td>
                      <td className={`${textStyle} p-2 border text-center`}>${safeNumber(strategy.opexSavings).toLocaleString()}</td>
                      <td className={`${textStyle} p-2 border text-center`}>
                        {safeNumber(strategy.opexSavings) > 0 ? (safeNumber(strategy.capex) / safeNumber(strategy.opexSavings)).toFixed(1) : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Regulatory Requirements Section */}
        {reportData.reportingRequirements && reportData.reportingRequirements.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-3 text-blue-800">6. REGULATORY REQUIREMENTS & LEGISLATION</h3>
            
            {reportData.reportingRequirements.map((req, index) => (
              <div key={index} className="mb-4 p-4 bg-gray-50 rounded">
                <h4 className={`${textStyle} font-bold mb-2`}>{req.scheme || req.name}</h4>
                
                {req.legislation && (
                  <div className="mb-3">
                    <p className={`${textStyle} font-semibold`}>Applicable Legislation:</p>
                    <p className={`${textStyle} italic`}>{req.legislation}</p>
                  </div>
                )}
                
                {req.thresholds && (
                  <div className="mb-3">
                    <p className={`${textStyle} font-semibold`}>Reporting Thresholds:</p>
                    <ul className={`${textStyle} list-disc list-inside ml-4`}>
                      {Object.entries(req.thresholds).map(([key, value]) => (
                        <li key={key}>{key}: {value}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {req.requirements && (
                  <div className="mb-3">
                    <p className={`${textStyle} font-semibold`}>Requirements:</p>
                    <ul className={`${textStyle} list-disc list-inside ml-4`}>
                      {req.requirements.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {req.extract && (
                  <div className="mt-3 p-3 bg-white border rounded">
                    <p className={`${textStyle} font-semibold mb-2`}>Legislative Extract:</p>
                    <p className={`${textStyle} text-xs italic`}>{req.extract}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Scenarios Section */}
        {scenarios && scenarios.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-3 text-blue-800">7. SCENARIO ANALYSIS</h3>
            
            <div className="mb-4">
              <p className={textStyle}>
                The following scenarios have been analyzed to understand potential emissions pathways:
              </p>
            </div>
            
            <table className="w-full border-collapse border text-sm mb-4">
              <thead>
                <tr className="bg-gray-100">
                  <th className={`${textStyle} p-2 border text-left`}>Scenario Name</th>
                  <th className={`${textStyle} p-2 border text-center`}>Total Emissions (tCO2e)</th>
                  <th className={`${textStyle} p-2 border text-center`}>vs Baseline</th>
                  <th className={`${textStyle} p-2 border text-left`}>Key Strategies</th>
                </tr>
              </thead>
              <tbody>
                {scenarios.slice(0, 5).map((scenario, index) => {
                  const scenarioEmissions = scenario.emissions || scenario.data?.emissions || {};
                  const scenarioTotal = safeNumber(scenarioEmissions.total);
                  const baselineTotal = safeNumber(reportData.emissions?.total);
                  const difference = baselineTotal > 0 ? ((scenarioTotal - baselineTotal) / baselineTotal * 100).toFixed(1) : '0';
                  const changeIndicator = parseFloat(difference) > 0 ? `+${difference}%` : `${difference}%`;
                  
                  return (
                    <tr key={index}>
                      <td className={`${textStyle} p-2 border`}>{scenario.name || 'Unnamed Scenario'}</td>
                      <td className={`${textStyle} p-2 border text-center`}>{scenarioTotal.toFixed(2)}</td>
                      <td className={`${textStyle} p-2 border text-center ${parseFloat(difference) < 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {changeIndicator}
                      </td>
                      <td className={`${textStyle} p-2 border`}>
                        {scenario.strategies ? scenario.strategies.slice(0, 2).join(', ') : 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {scenarios.length > 5 && (
              <p className={`${textStyle} text-gray-600 italic`}>
                ... and {scenarios.length - 5} additional scenarios analyzed.
              </p>
            )}
          </div>
        )}
        {/* Regulatory Compliance */}
        <div className="mb-6">
          <h3 className="text-lg font-bold mb-3 text-blue-800">8. REGULATORY COMPLIANCE & STANDARDS</h3>
          
          <div className="p-4 bg-gray-50 rounded">
            <h4 className={`${textStyle} font-bold mb-2`}>Applicable Reporting Standards</h4>
            <ul className={`${textStyle} list-disc list-inside space-y-1`}>
              {reportData.applicableStandards.map((standard, index) => (
                <li key={index}>{standard}</li>
              ))}
            </ul>
            
            <h4 className={`${textStyle} font-bold mt-4 mb-2`}>Compliance Status</h4>
            <p className={textStyle}>
              {reportData.regulatoryGroup === 1 ? (
                <span>Your organization falls under <strong>Group 1</strong> mandatory reporting requirements.</span>
              ) : reportData.regulatoryGroup === 2 ? (
                <span>Your organization falls under <strong>Group 2</strong> mandatory reporting requirements.</span>
              ) : reportData.regulatoryGroup === 3 ? (
                <span>Your organization falls under <strong>Group 3</strong> mandatory reporting requirements.</span>
              ) : (
                <span>Your organization does not currently meet mandatory reporting thresholds.</span>
              )}
            </p>
            
            <h4 className={`${textStyle} font-bold mt-4 mb-2`}>Data Quality & Verification</h4>
            <p className={textStyle}><strong>Verification Status:</strong> {reportData.verificationStatus}</p>
            <p className={textStyle}><strong>Next Steps:</strong> Engage accredited third-party verifier for independent assurance</p>
          </div>
        </div>

        {/* Statement of Responsibility - UPDATED WITH PROFESSIONAL DISCLAIMER */}
        <div className="mb-6">
          <h3 className="text-lg font-bold mb-3 text-blue-800">9. STATEMENT OF RESPONSIBILITY & DISCLAIMER</h3>
          
          <div className="p-4 border rounded">
            <p className={`${textStyle} mb-4`}>
              The management of {additionalCompanyInfo.companyName || reportData.companyName} is responsible for the preparation 
              and fair presentation of this greenhouse gas emissions report in accordance with the GHG Protocol Corporate 
              Accounting and Reporting Standard, ISO 14064-1, and applicable regulatory requirements.
            </p>
            
            <p className={`${textStyle} mb-4`}>
              This responsibility includes designing, implementing, and maintaining internal controls relevant to the 
              preparation and fair presentation of the greenhouse gas emissions inventory that is free from material 
              misstatement, whether due to fraud or error.
            </p>

            <p className={`${textStyle} mb-4 font-semibold`}>
              Important Notes:
            </p>
            <ul className={`${textStyle} list-disc list-inside ml-4 mb-4 space-y-1`}>
              <li>The report conforms to ISO 14060 family of standards for greenhouse gas accounting</li>
              <li>The report aligns with the Climate Active Carbon Neutral Standard for Organizations where applicable</li>
              <li>Greenhouse gases reported include CO₂, CH₄, N₂O, and fluorinated gases where applicable</li>
              <li>Emissions are classified according to the GHG Protocol scopes (1, 2, and 3)</li>
              <li>Error margins are estimated at ±10% for Scope 1 & 2, ±30% for Scope 3 emissions</li>
              <li>This report requires independent third-party auditing and validation for regulatory compliance</li>
            </ul>

            <div className="mt-6 p-3 bg-gray-50 rounded">
              <p className={`${textStyle} font-semibold mb-2`}>Disclaimer:</p>
              <p className={`${textStyle} text-xs mb-2`}>
                While every effort has been made to ensure that the content of this report is accurate and complete, 
                Carbon Prospect and {additionalCompanyInfo.companyName || reportData.companyName} cannot be held responsible 
                or liable for any errors, omissions, or misrepresentations. This report is provided for informational purposes 
                and requires independent third-party verification before being relied upon for compliance or decision-making purposes.
              </p>
              <p className={`${textStyle} text-xs`}>
                Carbon Prospect is not responsible or liable for any loss, damage, claim, expense, cost or other liability 
                arising from use or non-use of this report. Users must engage qualified third-party auditors to verify the 
                accuracy and completeness of emissions data before relying on this report for regulatory compliance or other purposes.
              </p>
            </div>
            
            <div className="mt-6">
              <p className={textStyle}><strong>Prepared by:</strong></p>
              <p className={textStyle}>{reportData.reportPreparer}</p>
              <p className={textStyle}>{reportData.preparerTitle}</p>
              <p className={textStyle}>{reportData.formattedDate}</p>
            </div>
            
            <div className="mt-4">
              <p className={textStyle}><strong>Approved by:</strong></p>
              <p className={textStyle}>_________________________________</p>
              <p className={textStyle}>Senior Management Representative</p>
              <p className={textStyle}>Date: _________________</p>
            </div>
          </div>
        </div>

        {/* Appendices */}
        <div className="mb-6">
          <h3 className="text-lg font-bold mb-3 text-blue-800">APPENDIX A: METHODOLOGY & ASSUMPTIONS</h3>
          
          <div className={`${textStyle} space-y-2`}>
            <p><strong>General Approach:</strong></p>
            <p>Emissions are calculated using the formula: Activity Data × Emission Factor = CO2e Emissions</p>
            
            <p className="mt-3"><strong>Key Assumptions:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Global Warming Potentials (GWP) based on IPCC AR5 values</li>
              <li>Grid electricity factors from national databases</li>
              <li>Default emission factors where primary data unavailable</li>
              <li>Conservative estimates used where uncertainty exists</li>
            </ul>
            
            <p className="mt-3"><strong>Data Sources:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Primary data from utility bills and fuel receipts</li>
              <li>Vehicle mileage from fleet management systems</li>
              <li>Waste data from waste management contractors</li>
              <li>Business travel data from expense reports</li>
            </ul>
          </div>
        </div>

        {/* New Comprehensive Emission Factors Appendix */}
        <div className="mb-6">
          <h3 className="text-lg font-bold mb-3 text-blue-800">APPENDIX B: EMISSION FACTORS AND REFERENCES</h3>
         
         <div className={`${textStyle} mb-4`}>
           <p className="mb-2">This appendix provides a comprehensive list of all emission factors used in this report, including their sources and references.</p>
         </div>
         
         {/* Scope 1 Emission Factors */}
         <div className="mb-4">
           <h4 className={`${textStyle} font-bold mb-2`}>Scope 1 - Direct Emission Factors</h4>
           <table className="w-full border-collapse border text-sm">
             <thead>
               <tr className="bg-gray-100">
                 <th className={`${textStyle} p-2 border text-left`}>Emission Source</th>
                 <th className={`${textStyle} p-2 border text-center`}>Factor</th>
                 <th className={`${textStyle} p-2 border text-center`}>Unit</th>
                 <th className={`${textStyle} p-2 border text-left`}>Reference</th>
               </tr>
             </thead>
             <tbody>
               <tr>
                 <td className={`${textStyle} p-2 border font-semibold`} colSpan="4">Stationary Combustion</td>
               </tr>
               <tr>
                 <td className={`${textStyle} p-2 border pl-4`}>Natural Gas</td>
                 <td className={`${textStyle} p-2 border text-center`}>{EMISSION_FACTORS.naturalGas.factor}</td>
                 <td className={`${textStyle} p-2 border text-center`}>{EMISSION_FACTORS.naturalGas.unit}</td>
                 <td className={`${textStyle} p-2 border text-xs`}>{EMISSION_FACTORS.naturalGas.reference}</td>
               </tr>
               
               <tr>
                 <td className={`${textStyle} p-2 border font-semibold`} colSpan="4">Mobile Combustion</td>
               </tr>
               <tr>
                 <td className={`${textStyle} p-2 border pl-4`}>Diesel Fuel</td>
                 <td className={`${textStyle} p-2 border text-center`}>{EMISSION_FACTORS.diesel.factor}</td>
                 <td className={`${textStyle} p-2 border text-center`}>{EMISSION_FACTORS.diesel.unit}</td>
                 <td className={`${textStyle} p-2 border text-xs`}>{EMISSION_FACTORS.diesel.reference}</td>
               </tr>
               <tr>
                 <td className={`${textStyle} p-2 border pl-4`}>Petrol/Gasoline</td>
                 <td className={`${textStyle} p-2 border text-center`}>{EMISSION_FACTORS.petrol.factor}</td>
                 <td className={`${textStyle} p-2 border text-center`}>{EMISSION_FACTORS.petrol.unit}</td>
                 <td className={`${textStyle} p-2 border text-xs`}>{EMISSION_FACTORS.petrol.reference}</td>
               </tr>
               
               <tr>
                 <td className={`${textStyle} p-2 border font-semibold`} colSpan="4">Refrigerants (Fugitive Emissions)</td>
               </tr>
               <tr>
                 <td className={`${textStyle} p-2 border pl-4`}>R-410A</td>
                 <td className={`${textStyle} p-2 border text-center`}>{EMISSION_FACTORS.refrigerantR410a.factor}</td>
                 <td className={`${textStyle} p-2 border text-center`}>{EMISSION_FACTORS.refrigerantR410a.unit}</td>
                 <td className={`${textStyle} p-2 border text-xs`}>{EMISSION_FACTORS.refrigerantR410a.reference}</td>
               </tr>
               <tr>
                 <td className={`${textStyle} p-2 border pl-4`}>R-134a</td>
                 <td className={`${textStyle} p-2 border text-center`}>{EMISSION_FACTORS.refrigerantR134a.factor}</td>
                 <td className={`${textStyle} p-2 border text-center`}>{EMISSION_FACTORS.refrigerantR134a.unit}</td>
                 <td className={`${textStyle} p-2 border text-xs`}>{EMISSION_FACTORS.refrigerantR134a.reference}</td>
               </tr>
             </tbody>
           </table>
         </div>
         
         {/* Scope 2 Emission Factors */}
         <div className="mb-4">
           <h4 className={`${textStyle} font-bold mb-2`}>Scope 2 - Indirect Emission Factors</h4>
           <table className="w-full border-collapse border text-sm">
             <thead>
               <tr className="bg-gray-100">
                 <th className={`${textStyle} p-2 border text-left`}>Emission Source</th>
                 <th className={`${textStyle} p-2 border text-center`}>Factor</th>
                 <th className={`${textStyle} p-2 border text-center`}>Unit</th>
                 <th className={`${textStyle} p-2 border text-left`}>Reference</th>
               </tr>
             </thead>
             <tbody>
               <tr>
                 <td className={`${textStyle} p-2 border`}>Grid Electricity</td>
                 <td className={`${textStyle} p-2 border text-center`}>{EMISSION_FACTORS.electricity.factor}</td>
                 <td className={`${textStyle} p-2 border text-center`}>{EMISSION_FACTORS.electricity.unit}</td>
                 <td className={`${textStyle} p-2 border text-xs`}>{EMISSION_FACTORS.electricity.reference}</td>
               </tr>
               <tr>
                 <td className={`${textStyle} p-2 border`}>Renewable Electricity</td>
                 <td className={`${textStyle} p-2 border text-center`}>{EMISSION_FACTORS.renewableElectricity.factor}</td>
                 <td className={`${textStyle} p-2 border text-center`}>{EMISSION_FACTORS.renewableElectricity.unit}</td>
                 <td className={`${textStyle} p-2 border text-xs`}>{EMISSION_FACTORS.renewableElectricity.reference}</td>
               </tr>
             </tbody>
           </table>
         </div>
         
         {/* Scope 3 Emission Factors */}
         <div className="mb-4">
           <h4 className={`${textStyle} font-bold mb-2`}>Scope 3 - Value Chain Emission Factors</h4>
           <table className="w-full border-collapse border text-sm">
             <thead>
               <tr className="bg-gray-100">
                 <th className={`${textStyle} p-2 border text-left`}>Emission Source</th>
                 <th className={`${textStyle} p-2 border text-center`}>Factor</th>
                 <th className={`${textStyle} p-2 border text-center`}>Unit</th>
                 <th className={`${textStyle} p-2 border text-left`}>Reference</th>
               </tr>
             </thead>
             <tbody>
               <tr>
                 <td className={`${textStyle} p-2 border`}>Purchased Goods & Services</td>
                 <td className={`${textStyle} p-2 border text-center`}>{EMISSION_FACTORS.purchasedGoods.factor}</td>
                 <td className={`${textStyle} p-2 border text-center`}>{EMISSION_FACTORS.purchasedGoods.unit}</td>
                 <td className={`${textStyle} p-2 border text-xs`}>{EMISSION_FACTORS.purchasedGoods.reference}</td>
               </tr>
               <tr>
                 <td className={`${textStyle} p-2 border`}>Business Air Travel</td>
                 <td className={`${textStyle} p-2 border text-center`}>{EMISSION_FACTORS.businessFlights.factor}</td>
                 <td className={`${textStyle} p-2 border text-center`}>{EMISSION_FACTORS.businessFlights.unit}</td>
                 <td className={`${textStyle} p-2 border text-xs`}>{EMISSION_FACTORS.businessFlights.reference}</td>
               </tr>
               <tr>
                 <td className={`${textStyle} p-2 border`}>Employee Commuting</td>
                 <td className={`${textStyle} p-2 border text-center`}>{EMISSION_FACTORS.employeeCommuting.factor}</td>
                 <td className={`${textStyle} p-2 border text-center`}>{EMISSION_FACTORS.employeeCommuting.unit}</td>
                 <td className={`${textStyle} p-2 border text-xs`}>{EMISSION_FACTORS.employeeCommuting.reference}</td>
               </tr>
               <tr>
                 <td className={`${textStyle} p-2 border`}>Waste to Landfill</td>
                 <td className={`${textStyle} p-2 border text-center`}>{EMISSION_FACTORS.wasteGenerated.factor}</td>
                 <td className={`${textStyle} p-2 border text-center`}>{EMISSION_FACTORS.wasteGenerated.unit}</td>
                 <td className={`${textStyle} p-2 border text-xs`}>{EMISSION_FACTORS.wasteGenerated.reference}</td>
               </tr>
             </tbody>
           </table>
         </div>
         
         <div className={`${textStyle} mt-4 p-3 bg-gray-50 rounded`}>
           <p className="font-semibold mb-2">Notes on Emission Factors:</p>
           <ul className="list-disc list-inside space-y-1 text-xs">
             <li>All emission factors are expressed in CO2-equivalent (CO2e) using IPCC AR5 Global Warming Potentials</li>
             <li>Location-specific grid factors should be used where available for more accurate Scope 2 calculations</li>
             <li>Negative factors for recycling and composting represent avoided emissions</li>
             <li>IT equipment factors include full lifecycle emissions (manufacturing, use, and disposal)</li>
           </ul>
         </div>
       </div>

       {/* Contact Information */}
       <div className="mt-8 p-4 bg-gray-100 rounded">
         <h4 className={`${textStyle} font-bold mb-2`}>For More Information Contact:</h4>
         <p className={textStyle}>{additionalCompanyInfo.contactPerson || reportData.reportPreparer}</p>
         <p className={textStyle}>Email: {additionalCompanyInfo.contactEmail || 'Not provided'}</p>
         <p className={textStyle}>Phone: {additionalCompanyInfo.contactPhone || 'Not provided'}</p>
         <p className={`${textStyle} mt-2`}>
           <strong>Report Generated by:</strong> Carbon Prospect Emissions Management Platform
         </p>
       </div>
     </div>
   );
 };

 return (
   <div className="max-w-6xl mx-auto bg-white rounded-lg shadow">
     <div className="p-6 border-b">
       <h2 className="text-2xl font-bold mb-2">Carbon Emissions Report Generator</h2>
       <p className="text-gray-600">Prepare compliance-ready emissions reports</p>
       
       {renderCompanyInfoForm()}
       
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
         <div>
           <div className="mb-4">
             <label className="block text-sm font-medium mb-1">Report Type</label>
             <select
               value={reportType}
               onChange={(e) => setReportType(e.target.value)}
               className="w-full p-2 border rounded text-sm"
             >
               <option value="standard">Standard Compliance Report</option>
               <option value="regulatory">Regulatory Compliance Report</option>
               <option value="tcfd">TCFD Climate Disclosure</option>
               <option value="eu_csrd">EU CSRD Report</option>
               <option value="nger">Australian NGER Report</option>
               <option value="executive">Executive Summary</option>
             </select>
           </div>
         </div>
         
         <div className="flex items-end">
           <button 
             className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mr-2 text-sm"
             onClick={() => setShowPreview(!showPreview)}
           >
             {showPreview ? 'Hide Preview' : 'Preview Report'}
           </button>
           
           <button 
             className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
             onClick={saveReport}
             disabled={loading}
           >
             {loading ? 'Saving...' : 'Save Report'}
           </button>
         </div>
       </div>
     </div>
     
     {/* Report Preview */}
     {showPreview && (
       <div id="emissions-report" className="p-6">
         {renderReportContent()}
         
         {/* PDF Export and Email Buttons */}
         <div className="flex justify-center mt-6 space-x-4">
           <button 
             className="bg-blue-600 text-white px-4 py-2 rounded flex items-center hover:bg-blue-700 text-sm"
             onClick={handleExportPDF}
             disabled={isDownloading}
           >
             {isDownloading ? 'Generating...' : 'Download PDF'}
             <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
             </svg>
           </button>
           
           <button 
             className="bg-green-600 text-white px-4 py-2 rounded flex items-center hover:bg-green-700 text-sm"
             onClick={handleEmailReport}
             disabled={emailing}
           >
             {emailing ? 'Sending...' : 'Email Report'}
             <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
             </svg>
           </button>
         </div>
       </div>
     )}
     
     {!showPreview && (
       <div className="p-6 text-center text-gray-500">
         <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
         </svg>
         <p className="mt-2 text-sm">Click "Preview Report" to view your comprehensive emissions report</p>
       </div>
     )}
   </div>
 );
};

export default EmissionsReportGenerator;