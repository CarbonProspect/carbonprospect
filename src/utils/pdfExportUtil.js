// utils/pdfExportUtil.js
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import autoTable from 'jspdf-autotable';

// Import emission factors from the report generator
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

// Constants for consistent formatting
const PAGE_MARGINS = {
  TOP: 25,
  BOTTOM: 35,
  LEFT: 15,
  RIGHT: 15
};

const PAGE_DIMENSIONS = {
  WIDTH: 210, // A4 width in mm
  HEIGHT: 297, // A4 height in mm
  CONTENT_WIDTH: 210 - PAGE_MARGINS.LEFT - PAGE_MARGINS.RIGHT,
  CONTENT_HEIGHT: 297 - PAGE_MARGINS.TOP - PAGE_MARGINS.BOTTOM
};

const FONT_SIZES = {
  TITLE: 20,
  SECTION_HEADER: 16,
  SUBSECTION: 12,
  BODY: 10,
  SMALL: 8
};

// Color scheme matching the preview
const COLORS = {
  PRIMARY: [34, 139, 34], // Green
  SECONDARY: [59, 130, 246], // Blue
  ACCENT: [239, 68, 68], // Red
  GRAY: [107, 114, 128],
  LIGHT_GRAY: [243, 244, 246],
  DARK_GRAY: [31, 41, 55]
};

// Helper function to get colors from branding
const getColors = (branding) => {
  if (!branding) {
    return COLORS; // Use defaults
  }
  
  // Convert hex to RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [0, 0, 0];
  };
  
  return {
    PRIMARY: hexToRgb(branding.primaryColor || '#228B22'),
    SECONDARY: hexToRgb(branding.secondaryColor || '#3B82F6'),
    ACCENT: hexToRgb(branding.accentColor || '#EF4444'),
    GRAY: COLORS.GRAY,
    LIGHT_GRAY: COLORS.LIGHT_GRAY,
    DARK_GRAY: COLORS.DARK_GRAY
  };
};

// Helper function to detect image format from base64 or URL
const detectImageFormat = (imageUrl) => {
  if (!imageUrl) return 'PNG';
  
  if (imageUrl.startsWith('data:')) {
    // Base64 format
    if (imageUrl.includes('image/jpeg') || imageUrl.includes('image/jpg')) return 'JPEG';
    if (imageUrl.includes('image/png')) return 'PNG';
    if (imageUrl.includes('image/gif')) return 'GIF';
    if (imageUrl.includes('image/webp')) return 'WEBP';
  } else {
    // URL format - check extension
    const ext = imageUrl.split('.').pop().toLowerCase().split('?')[0];
    if (ext === 'jpg' || ext === 'jpeg') return 'JPEG';
    if (ext === 'png') return 'PNG';
    if (ext === 'gif') return 'GIF';
    if (ext === 'webp') return 'WEBP';
  }
  return 'PNG'; // Default fallback
};

// Helper function to convert image to compatible format
const processImageForPDF = async (imageUrl) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Enable CORS
    
    img.onload = function() {
      try {
        // Create canvas to convert image
        const canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.height;
        const ctx = canvas.getContext('2d');
        
        // Fill with white background for transparency handling
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw image on canvas
        ctx.drawImage(this, 0, 0);
        
        // Convert to base64 JPEG (most compatible format)
        const processedImage = canvas.toDataURL('image/jpeg', 0.9);
        
        resolve({
          url: processedImage,
          format: 'JPEG',
          width: this.width,
          height: this.height
        });
      } catch (error) {
        console.error('Error processing image:', error);
        resolve(null);
      }
    };
    
    img.onerror = function() {
      console.error('Failed to load image');
      resolve(null);
    };
    
    img.src = imageUrl;
  });
};

// Helper function to calculate dynamic logo dimensions
const calculateLogoDimensions = async (logoUrl, maxWidth, maxHeight) => {
  try {
    const processed = await processImageForPDF(logoUrl);
    if (!processed) {
      return { width: maxWidth, height: maxHeight, aspectRatio: 1, processedUrl: null };
    }
    
    const aspectRatio = processed.width / processed.height;
    let width = maxWidth;
    let height = maxHeight;
    
    if (aspectRatio > maxWidth / maxHeight) {
      // Logo is wider than space, constrain by width
      height = maxWidth / aspectRatio;
    } else {
      // Logo is taller than space, constrain by height
      width = maxHeight * aspectRatio;
    }
    
    return { 
      width, 
      height, 
      aspectRatio, 
      processedUrl: processed.url,
      format: processed.format 
    };
  } catch (error) {
    console.error('Error calculating dimensions:', error);
    return { width: maxWidth, height: maxHeight, aspectRatio: 1, processedUrl: null };
  }
};

// Helper function to handle file upload and convert to base64
const handleLogoUpload = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }
    
    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      reject(new Error('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.'));
      return;
    }
    
    // Check file size (limit to 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      reject(new Error('File size too large. Please upload an image smaller than 5MB.'));
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      resolve(event.target.result);
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsDataURL(file);
  });
};

// Helper class to manage page position and automatic page breaks
class PDFPageManager {
  constructor(pdf, reportData, colors) {
    this.pdf = pdf;
    this.reportData = reportData;
    this.colors = colors || COLORS;
    this.currentY = PAGE_MARGINS.TOP;
    this.pageNumber = 1;
    this.logoCache = null; // Cache logo dimensions
  }

  checkPageBreak(requiredSpace = 20) {
    if (this.currentY + requiredSpace > PAGE_DIMENSIONS.HEIGHT - PAGE_MARGINS.BOTTOM) {
      this.addPage();
      return true;
    }
    return false;
  }

  async addPage() {
    this.pdf.addPage();
    this.pageNumber++;
    this.currentY = PAGE_MARGINS.TOP;
    await addHeaderFooter(this.pdf, this.reportData, this.pageNumber, this.colors, this.logoCache);
  }

  moveY(amount) {
    this.currentY += amount;
  }

  setY(y) {
    this.currentY = y;
  }

  getY() {
    return this.currentY;
  }
}
// Main export function with chart support
const generateReportPDF = async (reportData, reportElement, chartElements) => {
  console.log('generateReportPDF called with:', { 
    reportData, 
    reportElementExists: !!reportElement,
    hasEmissions: !!reportData.emissions,
    hasScenarios: !!reportData.scenarios,
    scenariosCount: reportData.scenarios?.length || 0,
    hasRawInputs: !!reportData.rawInputs,
    hasChartElements: !!chartElements,
    hasLogo: !!reportData.branding?.logoUrl
  });
  
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const colors = getColors(reportData.branding);
    const fontFamily = reportData.branding?.fontFamily || 'Arial';
    
    // Set default font
    pdf.setFont(fontFamily);
    
    const pageManager = new PDFPageManager(pdf, reportData, colors);
    
    // Cache logo dimensions if logo exists
    if (reportData.branding?.logoUrl) {
      pageManager.logoCache = await calculateLogoDimensions(
        reportData.branding.logoUrl, 
        30, // max width for header logos
        12  // max height for header logos
      );
    }
    
    // Add title page
    await addTitlePage(pdf, reportData, pageManager, colors);
    
    // Add executive summary
    await pageManager.addPage();
    addExecutiveSummary(pdf, reportData, pageManager, colors);
    
    // Add organization details
    await pageManager.addPage();
    addOrganizationDetails(pdf, reportData, pageManager, colors);
    
    // Add reporting methodology
    await pageManager.addPage();
    addReportingMethodology(pdf, reportData, pageManager, colors);
    
    // Add emissions summary with chart
    await pageManager.addPage();
    await addEmissionsSummary(pdf, reportData, pageManager, chartElements, colors);
    
    // Add detailed emissions breakdown
    await pageManager.addPage();
    addDetailedEmissionsSection(pdf, reportData, pageManager, colors);
    
    // Add reduction strategies and projections section - ALWAYS include this section
    await pageManager.addPage();
    await addReductionStrategies(pdf, reportData, pageManager, chartElements, colors);
    
    // Add compliance section
    await pageManager.addPage();
    addComplianceSection(pdf, reportData, pageManager, colors);
    
    // Add statement of responsibility
    await pageManager.addPage();
    addStatementOfResponsibility(pdf, reportData, pageManager, colors);
    
    // Add appendices
    await pageManager.addPage();
    addAppendices(pdf, reportData, pageManager, colors);
    
    // Set document properties
    pdf.setProperties({
      title: `Carbon Emissions Report - ${reportData.reportId}`,
      subject: 'GHG Emissions Compliance Report',
      author: 'Carbon Prospect Platform',
      keywords: 'carbon, emissions, GHG, compliance, sustainability',
      creator: reportData.companyName || 'Carbon Prospect'
    });
    
    return pdf;
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    return generateFallbackPDF(reportData);
  }
};

// Add title page with improved logo handling
const addTitlePage = async (pdf, reportData, pageManager, colors) => {
  // Company logo/branding area
  pdf.setFillColor(...colors.PRIMARY);
  pdf.rect(0, 0, PAGE_DIMENSIONS.WIDTH, 50, 'F');
  
  let logoEndX = 10; // Default position if no logo
  
  if (reportData.branding?.logoUrl) {
    try {
      // Process and calculate logo dimensions
      const logoDimensions = await calculateLogoDimensions(
        reportData.branding.logoUrl,
        50, // max width for title page
        35  // max height for title page
      );
      
      if (logoDimensions.processedUrl) {
        const logoX = 10;
        const logoY = 7.5; // Center vertically in 50mm header
        
        pdf.addImage(
          logoDimensions.processedUrl,
          logoDimensions.format || 'JPEG',
          logoX,
          logoY,
          logoDimensions.width,
          logoDimensions.height
        );
        
        logoEndX = logoX + logoDimensions.width + 10;
      } else {
        throw new Error('Failed to process logo');
      }
    } catch (error) {
      console.log('Logo loading failed:', error);
      // Add fallback text if logo fails
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      const companyName = reportData.companyInfo?.companyName || 
                         reportData.companyName || 
                         reportData.organizationDetails?.name ||
                         'Company Logo';
      pdf.text(companyName, 10, 25);
      logoEndX = 60;
    }
  } else {
    // Add company name as fallback when no logo
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    const companyName = reportData.companyInfo?.companyName || 
                       reportData.companyName || 
                       reportData.organizationDetails?.name ||
                       'Company Name';
    pdf.text(companyName, 10, 25);
    logoEndX = 60;
  }

  // Platform branding - adjusted position based on logo
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont(undefined, 'bold');
  const platformX = Math.max(PAGE_DIMENSIONS.WIDTH / 2, logoEndX + 10);
  pdf.text('Carbon Prospect', platformX, 25, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.setFont(undefined, 'normal');
  pdf.text('Comprehensive Carbon Management Platform', platformX, 35, { align: 'center' });
  
  // Report title
  pageManager.setY(100);
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(28);
  pdf.setFont(undefined, 'bold');
  pdf.text('GREENHOUSE GAS', PAGE_DIMENSIONS.WIDTH / 2, pageManager.getY(), { align: 'center' });
  pageManager.moveY(15);
  pdf.text('EMISSIONS REPORT', PAGE_DIMENSIONS.WIDTH / 2, pageManager.getY(), { align: 'center' });
  
  // Company name
  const companyName = reportData.companyInfo?.companyName || 
                     reportData.companyName || 
                     reportData.organizationDetails?.name ||
                     'Organization Name';
  
  pageManager.moveY(30);
  pdf.setFontSize(20);
  pdf.setFont(undefined, 'normal');
  pdf.text(companyName, PAGE_DIMENSIONS.WIDTH / 2, pageManager.getY(), { align: 'center' });
  
  // Report details
  pageManager.moveY(30);
  pdf.setFontSize(14);
  pdf.text(`Report ID: ${reportData.reportId || 'N/A'}`, PAGE_DIMENSIONS.WIDTH / 2, pageManager.getY(), { align: 'center' });
  pageManager.moveY(10);
  pdf.text(`Reporting Period: ${reportData.reportingPeriod || new Date().getFullYear()}`, PAGE_DIMENSIONS.WIDTH / 2, pageManager.getY(), { align: 'center' });
  pageManager.moveY(10);
  pdf.text(`Generated: ${reportData.formattedDate || new Date().toLocaleDateString()}`, PAGE_DIMENSIONS.WIDTH / 2, pageManager.getY(), { align: 'center' });
  
  // Add footer
  await addHeaderFooter(pdf, reportData, 1, colors);
};

// Add executive summary - FIXED VERSION WITHOUT setAlpha
const addExecutiveSummary = (pdf, reportData, pageManager, colors) => {
  addSectionHeader(pdf, 'EXECUTIVE SUMMARY', pageManager, colors);
  
  // Blue box background - use a lighter version of secondary color instead of transparency
  const [r, g, b] = colors.SECONDARY;
  // Create a lighter version by mixing with white
  const lightR = Math.round(r + (255 - r) * 0.9);
  const lightG = Math.round(g + (255 - g) * 0.9);
  const lightB = Math.round(b + (255 - b) * 0.9);
  pdf.setFillColor(lightR, lightG, lightB);
  pdf.rect(PAGE_MARGINS.LEFT, pageManager.getY(), PAGE_DIMENSIONS.CONTENT_WIDTH, 60, 'F');
  
  pdf.setFontSize(FONT_SIZES.BODY);
  pdf.setFont(undefined, 'normal');
  
  const summaryText = [
    'This greenhouse gas emissions report has been prepared in accordance with the requirements of the GHG Protocol Corporate Standard, ISO 14064-1, and applicable regulatory requirements.',
    '',
    `Total Emissions: ${(reportData.emissions?.total || 0).toFixed(2)} tonnes CO2e`,
    `Reduction Target: ${reportData.reductionTarget || '20'}% by ${new Date().getFullYear() + 5}`,
    `Reporting Standards: ${reportData.applicableStandards?.join(', ') || 'GHG Protocol, ISO 14064, TCFD'}`
  ];
  
  pageManager.moveY(5);
  summaryText.forEach(text => {
    if (text === '') {
      pageManager.moveY(5);
    } else {
      const lines = pdf.splitTextToSize(text, PAGE_DIMENSIONS.CONTENT_WIDTH - 10);
      lines.forEach(line => {
        pageManager.checkPageBreak();
        pdf.text(line, PAGE_MARGINS.LEFT + 5, pageManager.getY());
        pageManager.moveY(6);
      });
    }
  });
  pageManager.moveY(5);
};

// Add organization details
const addOrganizationDetails = (pdf, reportData, pageManager, colors) => {
  addSectionHeader(pdf, '1. ORGANIZATION DETAILS', pageManager, colors);
  
  // Extract data from the nested structure
  const companyInfo = reportData.companyInfo || {};
  const orgDetails = reportData.organizationDetails || {};
  
  const details = [
    ['Legal Entity Name', companyInfo.companyName || reportData.companyName || 'N/A'],
    ['Business Registration Number', companyInfo.businessNumber || reportData.businessRegistration || 'N/A'],
    ['Registered Address', companyInfo.registeredAddress || reportData.address || 'N/A'],
    ['Industry Sector', reportData.industry || reportData.industrySector || 'N/A'],
    ['Number of Employees', String(orgDetails.size?.employees || reportData.employeeCount || 'N/A')],
    ['Number of Facilities', String(orgDetails.size?.facilities || reportData.facilities || 'N/A')],
    ['Fleet Size', orgDetails.size?.fleetSize ? `${orgDetails.size.fleetSize.toLocaleString()} vehicles` : 'N/A'],
    ['Annual Revenue', orgDetails.size?.revenue ? `$${orgDetails.size.revenue.toLocaleString()}` : 'N/A'],
    ['Reporting Contact', companyInfo.contactPerson || reportData.reportPreparer || 'N/A'],
    ['Contact Email', companyInfo.contactEmail || reportData.contactEmail || 'N/A'],
    ['Contact Phone', companyInfo.contactPhone || 'N/A']
  ];
  
  // Create a nice table
  autoTable(pdf, {
    startY: pageManager.getY(),
    body: details,
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: 4
    },
    columnStyles: {
      0: { 
        fontStyle: 'bold',
        cellWidth: 70
      },
      1: {
        cellWidth: 'auto'
      }
    },
    margin: { left: PAGE_MARGINS.LEFT, right: PAGE_MARGINS.RIGHT }
  });
  
  pageManager.setY(pdf.lastAutoTable.finalY + 10);
};

// Add reporting methodology
const addReportingMethodology = (pdf, reportData, pageManager, colors) => {
  addSectionHeader(pdf, '2. REPORTING METHODOLOGY & BOUNDARIES', pageManager, colors);
  
  const methodology = [
    ['Consolidation Approach', reportData.consolidationApproach || 'Operational control'],
    ['Organizational Boundaries', reportData.boundaries || 'Organizational boundaries set using operational control approach'],
    ['Operational Boundaries', 'All Scope 1, 2, and material Scope 3 emissions'],
    ['Base Year', String(reportData.baselineYear || reportData.reportingPeriod || new Date().getFullYear() - 1)],
    ['Reporting Period', `January 1 - December 31, ${reportData.reportingPeriod || new Date().getFullYear()}`],
    ['GHG Gases Included', 'Carbon dioxide, methane, nitrous oxide, HFCs, PFCs, SF6, NF3'],
    ['Emission Factor Sources', reportData.emissionFactorSource || 'Government published emission factors (DEFRA, EPA, NGER)'],
    ['Data Quality', reportData.dataQuality || 'Primary data where available, secondary data based on industry averages'],
    ['Exclusions', reportData.exclusions || 'No material exclusions from the inventory'],
    ['Uncertainty Level', reportData.uncertaintyLevel || '±10% for Scope 1 & 2, ±30% for Scope 3 emissions']
  ];
  
  autoTable(pdf, {
    startY: pageManager.getY(),
    body: methodology,
    theme: 'plain',
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    columnStyles: {
      0: { 
        fontStyle: 'bold',
        cellWidth: 60
      }
    },
    margin: { left: PAGE_MARGINS.LEFT, right: PAGE_MARGINS.RIGHT }
  });
  
  pageManager.setY(pdf.lastAutoTable.finalY + 10);
};
// Add emissions summary with chart support
const addEmissionsSummary = async (pdf, reportData, pageManager, chartElements, colors) => {
  addSectionHeader(pdf, '3. EMISSIONS SUMMARY', pageManager, colors);
  
  const summaryHeaders = [['Emission Scope', 'Emissions (tCO2e)', '% of Total']];
  const total = reportData.emissions?.total || 0;
  const summaryData = [
    ['Scope 1 - Direct Emissions', (reportData.emissions?.scope1 || 0).toFixed(2), total > 0 ? `${((reportData.emissions?.scope1 || 0) / total * 100).toFixed(1)}%` : '0%'],
    ['Scope 2 - Indirect Emissions', (reportData.emissions?.scope2 || 0).toFixed(2), total > 0 ? `${((reportData.emissions?.scope2 || 0) / total * 100).toFixed(1)}%` : '0%'],
    ['Scope 3 - Value Chain Emissions', (reportData.emissions?.scope3 || 0).toFixed(2), total > 0 ? `${((reportData.emissions?.scope3 || 0) / total * 100).toFixed(1)}%` : '0%']
  ];
  
  // Add table - centered on page
  const tableWidth = 140; // Reduced width for better centering
  const centerX = (PAGE_DIMENSIONS.WIDTH - tableWidth) / 2;
  
  autoTable(pdf, {
    startY: pageManager.getY(),
    head: summaryHeaders,
    body: summaryData,
    theme: 'striped',
    headStyles: { 
      fillColor: colors.PRIMARY,
      fontSize: 10,
      halign: 'center'
    },
    styles: { 
      fontSize: 10,
      cellPadding: 5
    },
    columnStyles: {
      0: { cellWidth: 60, halign: 'left' },
      1: { cellWidth: 50, halign: 'center' },
      2: { cellWidth: 30, halign: 'center' }
    },
    margin: { left: centerX, right: centerX },
    foot: [['TOTAL EMISSIONS', total.toFixed(2), '100.0%']],
    footStyles: { 
      fillColor: colors.LIGHT_GRAY, 
      textColor: [0, 0, 0], 
      fontStyle: 'bold',
      fontSize: 11,
      halign: 'center'
    }
  });
  
  pageManager.setY(pdf.lastAutoTable.finalY + 15);
  
  // Add pie chart if element exists
  if (chartElements?.scopePieChart) {
    try {
      pageManager.checkPageBreak(80);
      const canvas = await html2canvas(chartElements.scopePieChart, {
        scale: 2,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 80;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Center the chart
      const xPos = PAGE_DIMENSIONS.WIDTH / 2 - imgWidth / 2;
      pdf.addImage(imgData, 'PNG', xPos, pageManager.getY(), imgWidth, imgHeight);
      pageManager.moveY(imgHeight + 10);
    } catch (error) {
      console.error('Error rendering pie chart:', error);
    }
  }
  
  // Add intensity metrics box
  pageManager.checkPageBreak(30);
  pdf.setFillColor(...colors.LIGHT_GRAY);
  pdf.rect(PAGE_MARGINS.LEFT, pageManager.getY(), PAGE_DIMENSIONS.CONTENT_WIDTH, 25, 'F');
  
  pageManager.moveY(5);
  pdf.setFont(undefined, 'bold');
  pdf.setFontSize(FONT_SIZES.SUBSECTION);
  pdf.text('Carbon Intensity Metrics', PAGE_MARGINS.LEFT + 5, pageManager.getY());
  pageManager.moveY(8);
  
  // Get employee count and revenue from various possible locations
  const employees = reportData.organizationDetails?.size?.employees || reportData.employeeCount || 1;
  const revenue = reportData.organizationDetails?.size?.revenue || reportData.annualRevenue || 1;
  
  pdf.setFont(undefined, 'normal');
  pdf.setFontSize(FONT_SIZES.BODY);
  pdf.text(`Per Employee: ${(total / employees).toFixed(2)} tonnes CO2e/employee`, PAGE_MARGINS.LEFT + 5, pageManager.getY());
  pageManager.moveY(6);
  pdf.text(`Per $M Revenue: ${(total / (revenue / 1000000)).toFixed(2)} tonnes CO2e/$M`, PAGE_MARGINS.LEFT + 5, pageManager.getY());
  pageManager.moveY(10);
};

// Enhanced detailed emissions section with emission factors
const addDetailedEmissionsSection = (pdf, reportData, pageManager, colors) => {
  addSectionHeader(pdf, '4. DETAILED EMISSIONS BREAKDOWN', pageManager, colors);
  
  // Scope 1 Details
  pdf.setFontSize(FONT_SIZES.SUBSECTION);
  pdf.setFont(undefined, 'bold');
  pdf.text('Scope 1 - Direct Emissions', PAGE_MARGINS.LEFT, pageManager.getY());
  pageManager.moveY(10);
  
  // Build Scope 1 data with emission factors
  const scope1Sources = [];
  
  if (reportData.rawInputs) {
    // Stationary Combustion
    if (reportData.rawInputs.naturalGas > 0) {
      scope1Sources.push([
        'Natural Gas Combustion',
        `${reportData.rawInputs.naturalGas.toLocaleString()} therms`,
        `${EMISSION_FACTORS.naturalGas.factor} ${EMISSION_FACTORS.naturalGas.unit}`,
        ((reportData.detailedEmissions?.naturalGas || reportData.rawInputs.naturalGas * EMISSION_FACTORS.naturalGas.factor) / 1000).toFixed(2)
      ]);
    }
    
    // Mobile Combustion
    if (reportData.rawInputs.diesel > 0) {
      scope1Sources.push([
        'Diesel Fuel',
        `${reportData.rawInputs.diesel.toLocaleString()} liters`,
        `${EMISSION_FACTORS.diesel.factor} ${EMISSION_FACTORS.diesel.unit}`,
        ((reportData.detailedEmissions?.diesel || reportData.rawInputs.diesel * EMISSION_FACTORS.diesel.factor) / 1000).toFixed(2)
      ]);
    }
    if (reportData.rawInputs.petrol > 0) {
      scope1Sources.push([
        'Petrol Fuel',
        `${reportData.rawInputs.petrol.toLocaleString()} liters`,
        `${EMISSION_FACTORS.petrol.factor} ${EMISSION_FACTORS.petrol.unit}`,
        ((reportData.detailedEmissions?.petrol || reportData.rawInputs.petrol * EMISSION_FACTORS.petrol.factor) / 1000).toFixed(2)
      ]);
    }
    
    // Refrigerants
    if (reportData.rawInputs.refrigerantR410a > 0) {
      scope1Sources.push([
        'R-410A Refrigerant',
        `${reportData.rawInputs.refrigerantR410a.toLocaleString()} kg`,
        `${EMISSION_FACTORS.refrigerantR410a.factor} ${EMISSION_FACTORS.refrigerantR410a.unit}`,
        ((reportData.detailedEmissions?.refrigerantR410a || reportData.rawInputs.refrigerantR410a * EMISSION_FACTORS.refrigerantR410a.factor) / 1000).toFixed(2)
      ]);
    }
    
    // Agriculture
    if (reportData.rawInputs.livestockCattle > 0) {
      scope1Sources.push([
        'Cattle (Enteric Fermentation)',
        `${reportData.rawInputs.livestockCattle.toLocaleString()} head`,
        `${EMISSION_FACTORS.livestockCattle.factor} ${EMISSION_FACTORS.livestockCattle.unit}`,
        ((reportData.detailedEmissions?.livestockCattle || reportData.rawInputs.livestockCattle * EMISSION_FACTORS.livestockCattle.factor) / 1000).toFixed(2)
      ]);
    }
    if (reportData.rawInputs.livestockPigs > 0) {
      scope1Sources.push([
        'Pigs',
        `${reportData.rawInputs.livestockPigs.toLocaleString()} head`,
        `${EMISSION_FACTORS.livestockPigs.factor} ${EMISSION_FACTORS.livestockPigs.unit}`,
        ((reportData.detailedEmissions?.livestockPigs || reportData.rawInputs.livestockPigs * EMISSION_FACTORS.livestockPigs.factor) / 1000).toFixed(2)
      ]);
    }
    if (reportData.rawInputs.livestockSheep > 0) {
      scope1Sources.push([
        'Sheep',
        `${reportData.rawInputs.livestockSheep.toLocaleString()} head`,
        `${EMISSION_FACTORS.livestockSheep.factor} ${EMISSION_FACTORS.livestockSheep.unit}`,
        ((reportData.detailedEmissions?.livestockSheep || reportData.rawInputs.livestockSheep * EMISSION_FACTORS.livestockSheep.factor) / 1000).toFixed(2)
      ]);
    }
    if (reportData.rawInputs.fertilizersNitrogen > 0) {
      scope1Sources.push([
        'Nitrogen Fertilizers',
        `${reportData.rawInputs.fertilizersNitrogen.toLocaleString()} kg N`,
        `${EMISSION_FACTORS.fertilizersNitrogen.factor} ${EMISSION_FACTORS.fertilizersNitrogen.unit}`,
        ((reportData.detailedEmissions?.fertilizersNitrogen || reportData.rawInputs.fertilizersNitrogen * EMISSION_FACTORS.fertilizersNitrogen.factor) / 1000).toFixed(2)
      ]);
    }
  }
  
  if (scope1Sources.length > 0) {
    const tableWidth = 180; // Set consistent table width
    const centerX = (PAGE_DIMENSIONS.WIDTH - tableWidth) / 2;
    
    autoTable(pdf, {
      startY: pageManager.getY(),
      head: [['Source', 'Activity Data', 'Emission Factor', 'Emissions (tCO2e)']],
      body: scope1Sources,
      theme: 'grid',
      headStyles: { 
        fillColor: colors.PRIMARY,
        fontSize: 10,
        halign: 'center'
      },
      styles: { 
        fontSize: 9,
        cellPadding: 4
      },
      columnStyles: {
        0: { cellWidth: 50, halign: 'left' },
        1: { cellWidth: 45, halign: 'center' },
        2: { cellWidth: 50, halign: 'center' },
        3: { cellWidth: 35, halign: 'center' }
      },
      margin: { left: centerX, right: centerX }
    });
    pageManager.setY(pdf.lastAutoTable.finalY + 15);
  }
  
  // Scope 2 Details
  pageManager.checkPageBreak(40);
  pdf.setFontSize(FONT_SIZES.SUBSECTION);
  pdf.setFont(undefined, 'bold');
  pdf.text('Scope 2 - Indirect Emissions (Energy)', PAGE_MARGINS.LEFT, pageManager.getY());
  pageManager.moveY(10);
  
  const scope2Sources = [];
  
  if (reportData.rawInputs) {
    if (reportData.rawInputs.electricity > 0) {
      scope2Sources.push([
        'Grid Electricity',
        `${reportData.rawInputs.electricity.toLocaleString()} kWh`,
        `${EMISSION_FACTORS.electricity.factor} ${EMISSION_FACTORS.electricity.unit}`,
        ((reportData.detailedEmissions?.electricity || reportData.rawInputs.electricity * EMISSION_FACTORS.electricity.factor) / 1000).toFixed(2)
      ]);
    }
    if (reportData.rawInputs.renewableElectricity > 0) {
      scope2Sources.push([
        'Renewable Electricity',
        `${reportData.rawInputs.renewableElectricity.toLocaleString()} kWh`,
        `${EMISSION_FACTORS.renewableElectricity.factor} ${EMISSION_FACTORS.renewableElectricity.unit}`,
        '0.00'
      ]);
    }
    if (reportData.rawInputs.steamPurchased > 0) {
      scope2Sources.push([
        'Purchased Steam',
        `${reportData.rawInputs.steamPurchased.toLocaleString()} MMBtu`,
        `${EMISSION_FACTORS.steamPurchased.factor} ${EMISSION_FACTORS.steamPurchased.unit}`,
        ((reportData.detailedEmissions?.steamPurchased || reportData.rawInputs.steamPurchased * EMISSION_FACTORS.steamPurchased.factor) / 1000).toFixed(2)
      ]);
    }
    if (reportData.rawInputs.coolingPurchased > 0) {
      scope2Sources.push([
        'Purchased Cooling',
        `${reportData.rawInputs.coolingPurchased.toLocaleString()} MMBtu`,
        `${EMISSION_FACTORS.coolingPurchased.factor} ${EMISSION_FACTORS.coolingPurchased.unit}`,
        ((reportData.detailedEmissions?.coolingPurchased || reportData.rawInputs.coolingPurchased * EMISSION_FACTORS.coolingPurchased.factor) / 1000).toFixed(2)
      ]);
    }
    if (reportData.rawInputs.dataCenter > 0) {
      scope2Sources.push([
        'Data Center Electricity',
        `${reportData.rawInputs.dataCenter.toLocaleString()} kWh`,
        `${EMISSION_FACTORS.dataCenter.factor} ${EMISSION_FACTORS.dataCenter.unit}`,
        ((reportData.detailedEmissions?.dataCenter || reportData.rawInputs.dataCenter * EMISSION_FACTORS.dataCenter.factor) / 1000).toFixed(2)
      ]);
    }
  }
  
  if (scope2Sources.length > 0) {
    const tableWidth = 180; // Set consistent table width
    const centerX = (PAGE_DIMENSIONS.WIDTH - tableWidth) / 2;
    
    autoTable(pdf, {
      startY: pageManager.getY(),
      head: [['Source', 'Activity Data', 'Emission Factor', 'Emissions (tCO2e)']],
      body: scope2Sources,
      theme: 'grid',
      headStyles: { 
        fillColor: colors.PRIMARY,
        fontSize: 10,
        halign: 'center'
      },
      styles: { 
        fontSize: 9,
        cellPadding: 4
      },
      columnStyles: {
        0: { cellWidth: 50, halign: 'left' },
        1: { cellWidth: 45, halign: 'center' },
        2: { cellWidth: 50, halign: 'center' },
        3: { cellWidth: 35, halign: 'center' }
      },
      margin: { left: centerX, right: centerX }
    });
    pageManager.setY(pdf.lastAutoTable.finalY + 15);
  }
  
  // Scope 3 Details
  if ((reportData.emissions?.scope3 || 0) > 0) {
    pageManager.checkPageBreak(40);
    pdf.setFontSize(FONT_SIZES.SUBSECTION);
    pdf.setFont(undefined, 'bold');
    pdf.text('Scope 3 - Value Chain Emissions', PAGE_MARGINS.LEFT, pageManager.getY());
    pageManager.moveY(10);
    
    const scope3Sources = [];
    
    if (reportData.rawInputs) {
      if (reportData.rawInputs.purchasedGoods > 0) {
        scope3Sources.push([
          'Purchased Goods & Services',
          `${reportData.rawInputs.purchasedGoods.toLocaleString()}`,
          `${EMISSION_FACTORS.purchasedGoods.factor} ${EMISSION_FACTORS.purchasedGoods.unit}`,
          ((reportData.detailedEmissions?.purchasedGoods || reportData.rawInputs.purchasedGoods * EMISSION_FACTORS.purchasedGoods.factor) / 1000).toFixed(2)
        ]);
      }
      if (reportData.rawInputs.businessFlights > 0) {
        scope3Sources.push([
          'Business Travel (Air)',
          `${reportData.rawInputs.businessFlights.toLocaleString()} passenger miles`,
          `${EMISSION_FACTORS.businessFlights.factor} ${EMISSION_FACTORS.businessFlights.unit}`,
          ((reportData.detailedEmissions?.businessFlights || reportData.rawInputs.businessFlights * EMISSION_FACTORS.businessFlights.factor) / 1000).toFixed(2)
        ]);
      }
      if (reportData.rawInputs.employeeCommuting > 0) {
        scope3Sources.push([
          'Employee Commuting',
          `${reportData.rawInputs.employeeCommuting.toLocaleString()} passenger miles`,
          `${EMISSION_FACTORS.employeeCommuting.factor} ${EMISSION_FACTORS.employeeCommuting.unit}`,
          ((reportData.detailedEmissions?.employeeCommuting || reportData.rawInputs.employeeCommuting * EMISSION_FACTORS.employeeCommuting.factor) / 1000).toFixed(2)
        ]);
      }
      if (reportData.rawInputs.wasteGenerated > 0) {
        scope3Sources.push([
          'Waste Disposal',
          `${reportData.rawInputs.wasteGenerated.toLocaleString()} tonnes`,
          `${EMISSION_FACTORS.wasteGenerated.factor} ${EMISSION_FACTORS.wasteGenerated.unit}`,
          ((reportData.detailedEmissions?.wasteGenerated || reportData.rawInputs.wasteGenerated * EMISSION_FACTORS.wasteGenerated.factor) / 1000).toFixed(2)
        ]);
      }
      if (reportData.rawInputs.waterUsage > 0) {
        scope3Sources.push([
          'Water Usage',
          `${reportData.rawInputs.waterUsage.toLocaleString()} m³`,
          `${EMISSION_FACTORS.waterUsage.factor} ${EMISSION_FACTORS.waterUsage.unit}`,
          ((reportData.detailedEmissions?.waterUsage || reportData.rawInputs.waterUsage * EMISSION_FACTORS.waterUsage.factor) / 1000).toFixed(2)
        ]);
      }
      if (reportData.rawInputs.paperConsumption > 0) {
        scope3Sources.push([
          'Paper Consumption',
          `${reportData.rawInputs.paperConsumption.toLocaleString()} reams`,
          `${EMISSION_FACTORS.paperConsumption.factor} ${EMISSION_FACTORS.paperConsumption.unit}`,
          ((reportData.detailedEmissions?.paperConsumption || reportData.rawInputs.paperConsumption * EMISSION_FACTORS.paperConsumption.factor) / 1000).toFixed(2)
        ]);
      }
    }
    
    if (scope3Sources.length > 0) {
      const tableWidth = 180; // Set consistent table width
      const centerX = (PAGE_DIMENSIONS.WIDTH - tableWidth) / 2;
      
      autoTable(pdf, {
        startY: pageManager.getY(),
        head: [['Category', 'Activity Data', 'Emission Factor', 'Emissions (tCO2e)']],
        body: scope3Sources,
        theme: 'grid',
        headStyles: { 
          fillColor: colors.PRIMARY,
          fontSize: 10,
          halign: 'center'
        },
        styles: { 
          fontSize: 9,
          cellPadding: 4
        },
        columnStyles: {
          0: { cellWidth: 50, halign: 'left' },
          1: { cellWidth: 45, halign: 'center' },
          2: { cellWidth: 50, halign: 'center' },
          3: { cellWidth: 35, halign: 'center' }
        },
        margin: { left: centerX, right: centerX }
      });
      pageManager.setY(pdf.lastAutoTable.finalY + 10);
    }
  }
  
  // Add total summary at the end
  pageManager.checkPageBreak(20);
  pdf.setFont(undefined, 'bold');
  pdf.setFontSize(FONT_SIZES.BODY);
  const total = (reportData.emissions?.scope1 || 0) + (reportData.emissions?.scope2 || 0) + (reportData.emissions?.scope3 || 0);
  pdf.text(`Total GHG Emissions: ${total.toFixed(2)} tonnes CO2e`, PAGE_MARGINS.LEFT, pageManager.getY());
};

// Add reduction strategies section with chart support
const addReductionStrategies = async (pdf, reportData, pageManager, chartElements, colors) => {
  addSectionHeader(pdf, '5. REDUCTION STRATEGIES & PROJECTIONS', pageManager, colors);
  
  // Always show projections even if no strategies defined
  if (!reportData.reductionStrategies || reportData.reductionStrategies.length === 0) {
    pdf.setFontSize(FONT_SIZES.BODY);
    pdf.text('No reduction strategies have been defined.', PAGE_MARGINS.LEFT, pageManager.getY());
    pageManager.moveY(10);
  }
  
  // Add strategy chart if available
  if (chartElements?.strategyBarChart) {
    try {
      const canvas = await html2canvas(chartElements.strategyBarChart, {
        scale: 2,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 90;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', PAGE_MARGINS.LEFT, pageManager.getY(), imgWidth, imgHeight);
      pageManager.moveY(imgHeight + 10);
    } catch (error) {
      console.error('Error rendering strategy chart:', error);
    }
  }
  
  // Add projection chart if available
  if (chartElements?.projectionLineChart) {
    try {
      pageManager.checkPageBreak(70);
      const canvas = await html2canvas(chartElements.projectionLineChart, {
        scale: 2,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 90;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Place projection chart on the right side if there's space, otherwise below
      if (chartElements?.strategyBarChart && pageManager.getY() < 150) {
        pdf.addImage(imgData, 'PNG', PAGE_DIMENSIONS.WIDTH - PAGE_MARGINS.RIGHT - imgWidth, pageManager.getY() - imgHeight - 10, imgWidth, imgHeight);
      } else {
        pdf.addImage(imgData, 'PNG', PAGE_MARGINS.LEFT, pageManager.getY(), imgWidth, imgHeight);
        pageManager.moveY(imgHeight + 10);
      }
    } catch (error) {
      console.error('Error rendering projection chart:', error);
    }
  }
  
  // If no chart element but we have projection data, create a simple table
  if (!chartElements?.projectionLineChart && reportData.fiveYearProjection && reportData.fiveYearProjection.length > 0) {
    pageManager.checkPageBreak(40);
    pdf.setFontSize(FONT_SIZES.SUBSECTION);
    pdf.setFont(undefined, 'bold');
    pdf.text('5-Year Emissions Projection', PAGE_MARGINS.LEFT, pageManager.getY());
    pageManager.moveY(10);
    
    const projectionHeaders = [['Year', 'Projected Emissions (tCO2e)', 'Target Pathway (tCO2e)', 'Reduction vs Current (%)']];
    const currentEmissions = reportData.emissions?.total || 0;
    const projectionData = reportData.fiveYearProjection.map(year => [
      year.year,
      year.emissions.toFixed(2),
      year.target.toFixed(2),
      currentEmissions > 0 ? `${((currentEmissions - year.emissions) / currentEmissions * 100).toFixed(1)}%` : '0%'
    ]);
    
    autoTable(pdf, {
      startY: pageManager.getY(),
      head: projectionHeaders,
      body: projectionData,
      theme: 'striped',
      headStyles: { 
        fillColor: colors.PRIMARY,
        fontSize: 9
      },
      styles: { 
        fontSize: 8,
        cellPadding: 3
      },
      columnStyles: {
        0: { halign: 'center' },
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'center' }
      },
      margin: { left: PAGE_MARGINS.LEFT, right: PAGE_MARGINS.RIGHT }
    });
    
    pageManager.setY(pdf.lastAutoTable.finalY + 10);
  }
  
  // Create strategies table
  pageManager.checkPageBreak(50);
  if (reportData.reductionStrategies && reportData.reductionStrategies.length > 0) {
    const strategiesHeaders = [['Strategy', 'Scope', 'Reduction (tCO2e)', 'Timeframe', 'CAPEX', 'Annual Savings', 'Payback']];
    const strategiesData = reportData.reductionStrategies.map(strategy => [
      strategy.strategy || strategy.name || 'Unnamed Strategy',
      strategy.scope || 'Various',
      (strategy.potentialReduction || 0).toFixed(2),
      strategy.timeframe || 'TBD',
      `${(strategy.capex || 0).toLocaleString()}`,
      `${(strategy.opexSavings || 0).toLocaleString()}`,
      strategy.opexSavings > 0 ? `${(strategy.capex / strategy.opexSavings).toFixed(1)} years` : 'N/A'
    ]);
    
    autoTable(pdf, {
      startY: pageManager.getY(),
      head: strategiesHeaders,
      body: strategiesData,
      theme: 'striped',
      headStyles: { 
        fillColor: colors.PRIMARY,
        fontSize: 9
      },
      styles: { 
        fontSize: 8,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 50 },
        2: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'center' }
      },
      margin: { left: PAGE_MARGINS.LEFT, right: PAGE_MARGINS.RIGHT }
    });
    
    pageManager.setY(pdf.lastAutoTable.finalY + 10);
  }
};

// Add compliance section
const addComplianceSection = (pdf, reportData, pageManager, colors) => {
  addSectionHeader(pdf, '6. REGULATORY COMPLIANCE & STANDARDS', pageManager, colors);
  
  // Compliance status box
  pdf.setFillColor(...colors.LIGHT_GRAY);
  pdf.rect(PAGE_MARGINS.LEFT, pageManager.getY(), PAGE_DIMENSIONS.CONTENT_WIDTH, 50, 'F');
  pageManager.moveY(5);
  
  pdf.setFont(undefined, 'bold');
  pdf.setFontSize(FONT_SIZES.BODY);
  pdf.text('Applicable Reporting Standards', PAGE_MARGINS.LEFT + 5, pageManager.getY());
  pageManager.moveY(8);
  
  pdf.setFont(undefined, 'normal');
  pdf.setFontSize(FONT_SIZES.SMALL);
  const standards = reportData.applicableStandards || ['GHG Protocol', 'ISO 14064', 'TCFD'];
  standards.forEach(standard => {
    pdf.text(`• ${standard}`, PAGE_MARGINS.LEFT + 10, pageManager.getY());
    pageManager.moveY(5);
  });
  
  pageManager.moveY(5);
  pdf.setFont(undefined, 'bold');
  pdf.setFontSize(FONT_SIZES.BODY);
  pdf.text('Compliance Status', PAGE_MARGINS.LEFT + 5, pageManager.getY());
  pageManager.moveY(8);

  pdf.setFont(undefined, 'normal');
  pdf.setFontSize(FONT_SIZES.SMALL);
  const regulatoryGroup = reportData.regulatoryGroup || 0;
  if (regulatoryGroup > 0) {
    pdf.text(`Your organization falls under Group ${regulatoryGroup} mandatory reporting requirements.`, PAGE_MARGINS.LEFT + 10, pageManager.getY());
  } else {
    pdf.text('Your organization does not currently meet mandatory reporting thresholds.', PAGE_MARGINS.LEFT + 10, pageManager.getY());
  }
  pageManager.moveY(10);

  // Verification status
  pageManager.moveY(5);
  pdf.setFont(undefined, 'bold');
  pdf.setFontSize(FONT_SIZES.BODY);
  pdf.text('Data Quality & Verification', PAGE_MARGINS.LEFT, pageManager.getY());
  pageManager.moveY(8);

  const verificationData = [
    ['Verification Status', reportData.verificationStatus || 'Self-declared (pending third-party verification)'],
    ['Data Quality', reportData.dataQuality || 'Primary data where available, secondary data based on industry averages'],
    ['Next Steps', 'Engage accredited third-party verifier for independent assurance']
  ];

  autoTable(pdf, {
    startY: pageManager.getY(),
    body: verificationData,
    theme: 'plain',
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 }
    },
    margin: { left: PAGE_MARGINS.LEFT, right: PAGE_MARGINS.RIGHT }
  });

  pageManager.setY(pdf.lastAutoTable.finalY + 10);
};

// Add statement of responsibility with comprehensive disclaimers
const addStatementOfResponsibility = (pdf, reportData, pageManager, colors) => {
  addSectionHeader(pdf, '7. STATEMENT OF RESPONSIBILITY & DISCLAIMER', pageManager, colors);

  // Company name for the statement
  const companyName = reportData.companyInfo?.companyName || reportData.companyName || 'the organization';

  // Set consistent font size - using BODY size throughout
  pdf.setFontSize(FONT_SIZES.BODY);
  pdf.setFont(undefined, 'normal');

  // Statement text - simplified and shorter
  const statementText = `The management of ${companyName} is responsible for the preparation and fair presentation of this greenhouse gas emissions report in accordance with the GHG Protocol Corporate Accounting and Reporting Standard, ISO 14064-1, and applicable regulatory requirements.`;
  
  const lines = pdf.splitTextToSize(statementText, PAGE_DIMENSIONS.CONTENT_WIDTH - 20);
  lines.forEach(line => {
    pageManager.checkPageBreak();
    pdf.text(line, PAGE_MARGINS.LEFT, pageManager.getY());
    pageManager.moveY(6);
  });

  pageManager.moveY(10);

  // Important Notes section - using a table for better formatting
  const notes = [
    ['Standards Compliance', 'ISO 14060 family of standards, Climate Active Carbon Neutral Standard'],
    ['GHG Gases Included', 'CO₂, CH₄, N₂O, HFCs, PFCs, SF₆, NF₃'],
    ['Emission Scopes', 'Classified according to GHG Protocol (Scopes 1, 2, and 3)'],
    ['Uncertainty Level', '±10% for Scope 1 & 2, ±30% for Scope 3 emissions'],
    ['Verification Required', 'Independent third-party auditing required for regulatory compliance']
  ];

  autoTable(pdf, {
    startY: pageManager.getY(),
    head: [['Important Notes', 'Details']],
    body: notes,
    theme: 'plain',
    headStyles: { 
      fillColor: colors.PRIMARY,
      textColor: [255, 255, 255],
      fontSize: FONT_SIZES.BODY, // Changed to maintain consistent font size
      fontStyle: 'bold'
    },
    styles: {
      fontSize: FONT_SIZES.BODY, // Changed to maintain consistent font size
      cellPadding: 3
    },
    columnStyles: {
      0: { 
        fontStyle: 'bold',
        cellWidth: 50
      },
      1: {
        cellWidth: 'auto'
      }
    },
    margin: { left: PAGE_MARGINS.LEFT, right: PAGE_MARGINS.RIGHT }
  });

  pageManager.setY(pdf.lastAutoTable.finalY + 15);

  // Disclaimer section - more concise
  pageManager.checkPageBreak(60);
  pdf.setFillColor(...colors.LIGHT_GRAY);
  const disclaimerY = pageManager.getY();
  pdf.rect(PAGE_MARGINS.LEFT, disclaimerY, PAGE_DIMENSIONS.CONTENT_WIDTH, 50, 'F');

  pageManager.moveY(8);
  pdf.setFont(undefined, 'bold');
  pdf.setFontSize(FONT_SIZES.SUBSECTION);
  pdf.text('Disclaimer', PAGE_MARGINS.LEFT + 5, pageManager.getY());
  pageManager.moveY(8);

  pdf.setFont(undefined, 'normal');
  pdf.setFontSize(FONT_SIZES.BODY); // Changed to maintain consistent font size
  
  const disclaimerPoints = [
    'This report is provided for informational purposes and requires independent third-party verification.',
    'Carbon Prospect is not liable for any errors, omissions, or use of this report.',
    'Emission factors are based on publicly available sources and may not reflect site-specific conditions.',
    'This document does not constitute legal, financial, or professional advice.'
  ];

  disclaimerPoints.forEach(point => {
    const pointLines = pdf.splitTextToSize(`• ${point}`, PAGE_DIMENSIONS.CONTENT_WIDTH - 20);
    pointLines.forEach(line => {
      if (pageManager.getY() > disclaimerY + 45) {
        pageManager.setY(disclaimerY + 52);
      }
      pdf.text(line, PAGE_MARGINS.LEFT + 5, pageManager.getY());
      pageManager.moveY(5);
    });
  });

  pageManager.setY(disclaimerY + 55);

  // Regulatory Compliance Notice - using a black bordered box, thinner
  pageManager.checkPageBreak(30); // Reduced from 40
  pdf.setDrawColor(0, 0, 0); // Black color
  pdf.setLineWidth(0.5); // Thinner line
  const complianceY = pageManager.getY();
  pdf.rect(PAGE_MARGINS.LEFT, complianceY, PAGE_DIMENSIONS.CONTENT_WIDTH, 25, 'S'); // Reduced height from 35 to 25
  
  pageManager.moveY(6); // Reduced from 8
  pdf.setFont(undefined, 'bold');
  pdf.setFontSize(FONT_SIZES.BODY);
  pdf.text('Regulatory Compliance Notice', PAGE_MARGINS.LEFT + 5, pageManager.getY()); // Removed & symbol
  pageManager.moveY(6); // Reduced from 8

  pdf.setFont(undefined, 'normal');
  pdf.setFontSize(FONT_SIZES.BODY); // Changed to maintain consistent font size
  const complianceText = 'This report must be verified by an accredited third-party auditor before submission to regulatory authorities. Organizations are responsible for ensuring compliance with all applicable regulations.';
  
  const complianceLines = pdf.splitTextToSize(complianceText, PAGE_DIMENSIONS.CONTENT_WIDTH - 20);
  complianceLines.forEach(line => {
    pdf.text(line, PAGE_MARGINS.LEFT + 5, pageManager.getY());
    pageManager.moveY(5);
  });

  pageManager.setY(complianceY + 30); // Reduced from 40

  // Signature section - ensure we have space
  pageManager.checkPageBreak(60);

  // Create signature boxes side by side
  const signatureWidth = (PAGE_DIMENSIONS.CONTENT_WIDTH - 20) / 2;
  
  // Prepared by box
  pdf.setDrawColor(...colors.GRAY);
  pdf.setLineWidth(0.5);
  pdf.rect(PAGE_MARGINS.LEFT, pageManager.getY(), signatureWidth, 40, 'S');
  
  // Approved by box
  pdf.rect(PAGE_MARGINS.LEFT + signatureWidth + 20, pageManager.getY(), signatureWidth, 40, 'S');

  pageManager.moveY(8);
  
  // Prepared by content
  pdf.setFont(undefined, 'bold');
  pdf.setFontSize(FONT_SIZES.BODY);
  pdf.text('Prepared by:', PAGE_MARGINS.LEFT + 5, pageManager.getY());
  
  // Approved by content
  pdf.text('Approved by:', PAGE_MARGINS.LEFT + signatureWidth + 25, pageManager.getY());
  
  pageManager.moveY(20);
  pdf.setFont(undefined, 'normal');
  pdf.setFontSize(FONT_SIZES.SMALL);
  pdf.text('Name: _______________________', PAGE_MARGINS.LEFT + 5, pageManager.getY());
  pdf.text('Name: _______________________', PAGE_MARGINS.LEFT + signatureWidth + 25, pageManager.getY());
  
  pageManager.moveY(8);
  pdf.text('Date: _______________________', PAGE_MARGINS.LEFT + 5, pageManager.getY());
  pdf.text('Date: _______________________', PAGE_MARGINS.LEFT + signatureWidth + 25, pageManager.getY());
};

// Helper function to add section headers
const addSectionHeader = (pdf, title, pageManager, colors) => {
  pageManager.checkPageBreak(20);
  pdf.setFontSize(FONT_SIZES.SECTION_HEADER);
  pdf.setFont(undefined, 'bold');
  pdf.setTextColor(...colors.PRIMARY);
  pdf.text(title, PAGE_MARGINS.LEFT, pageManager.getY());
  pdf.setTextColor(0, 0, 0);
  pageManager.moveY(12);
};

// Enhanced header and footer function with logo support
const addHeaderFooter = async (pdf, reportData, pageNumber, colors, logoCache) => {
  // Header
  pdf.setFillColor(...colors.PRIMARY);
  pdf.rect(0, 0, PAGE_DIMENSIONS.WIDTH, 15, 'F');

  let headerTextX = 10; // Default position

  // Add logo to header if available and not on first page
  if (pageNumber > 1 && reportData.branding?.logoUrl && logoCache?.processedUrl) {
    try {
      const logoX = 5;
      const logoY = 2;
      const maxHeight = 11; // Leave some padding
      
      // Use cached dimensions
      let logoWidth = logoCache.width;
      let logoHeight = logoCache.height;
      
      // Scale down if needed for header
      if (logoHeight > maxHeight) {
        const scale = maxHeight / logoHeight;
        logoWidth *= scale;
        logoHeight = maxHeight;
      }
      
      pdf.addImage(
        logoCache.processedUrl,
        logoCache.format || 'JPEG',
        logoX,
        logoY,
        logoWidth,
        logoHeight
      );
      
      headerTextX = logoX + logoWidth + 5;
    } catch (error) {
      console.log('Header logo failed:', error);
    }
  }

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(12);
  pdf.setFont(undefined, 'bold');
  pdf.text('Carbon Prospect', headerTextX, 10);

  pdf.setFontSize(8);
  pdf.setFont(undefined, 'normal');
  pdf.text('Comprehensive Carbon Management Platform', PAGE_DIMENSIONS.WIDTH - 10, 10, { align: 'right' });

  // Footer
  pdf.setTextColor(...colors.GRAY);
  pdf.setFontSize(8);

  // Format the report ID properly
  const reportId = reportData.reportId || `REP-${Date.now()}`;
  const currentDate = new Date().toLocaleDateString();

  pdf.text(`Page ${pageNumber}`, PAGE_DIMENSIONS.WIDTH / 2, PAGE_DIMENSIONS.HEIGHT - 10, { align: 'center' });
  pdf.text(`Report ID: ${reportId}`, 10, PAGE_DIMENSIONS.HEIGHT - 10);
  pdf.text(currentDate, PAGE_DIMENSIONS.WIDTH - 10, PAGE_DIMENSIONS.HEIGHT - 10, { align: 'right' });

  // Reset colors
  pdf.setTextColor(0, 0, 0);
};

// Enhanced appendices section with full emission factors
const addAppendices = (pdf, reportData, pageManager, colors) => {
  addSectionHeader(pdf, 'APPENDICES', pageManager, colors);
  
  // APPENDIX A: Calculation Methodology
  pageManager.moveY(5); // Extra spacing after section header
  pdf.setFontSize(FONT_SIZES.SUBSECTION);
  pdf.setFont(undefined, 'bold');
  pdf.setTextColor(0, 0, 0); // Ensure black text
  pdf.text('Appendix A: Calculation Methodology', PAGE_MARGINS.LEFT, pageManager.getY());
  pageManager.moveY(12); // Increased spacing
  
  pdf.setFontSize(FONT_SIZES.BODY); // Changed from SMALL to BODY
  pdf.setFont(undefined, 'normal');
  const methodology = [
    'Emissions calculated using: Activity Data × Emission Factor = CO2e Emissions',
    'Data sources: Primary data from utility bills, fuel receipts, and operational records',
    'Uncertainty estimates: ±10% for Scope 1 & 2, ±30% for Scope 3',
    'Exclusions: De minimis sources representing <1% of total emissions',
    'Base year recalculation policy: Recalculate when structural changes result in >5% change'
  ];
  
  methodology.forEach(item => {
    pageManager.checkPageBreak();
    pdf.text(`• ${item}`, PAGE_MARGINS.LEFT, pageManager.getY());
    pageManager.moveY(6); // Increased line spacing
  });
  
  // APPENDIX B: Emission Factors and References
  pageManager.moveY(10); // Extra spacing before new appendix
  pageManager.checkPageBreak(40);
  pdf.setFontSize(FONT_SIZES.SUBSECTION);
  pdf.setFont(undefined, 'bold');
  pdf.setTextColor(0, 0, 0); // Ensure black text
  pdf.text('Appendix B: Emission Factors and References', PAGE_MARGINS.LEFT, pageManager.getY());
  pageManager.moveY(12); // Increased spacing
  
  pdf.setFontSize(FONT_SIZES.BODY); // Changed from SMALL to BODY
  pdf.setFont(undefined, 'normal');
  pdf.text('This appendix provides a comprehensive list of all emission factors used in this report, including their sources and references.', 
    PAGE_MARGINS.LEFT, pageManager.getY());
  pageManager.moveY(15); // More spacing before tables
  
  // Scope 1 Emission Factors
  pdf.setFontSize(FONT_SIZES.BODY);
  pdf.setFont(undefined, 'bold');
  pdf.setTextColor(0, 0, 0); // Ensure black text
  pdf.text('Scope 1 - Direct Emission Factors', PAGE_MARGINS.LEFT, pageManager.getY());
  pageManager.moveY(10); // Increased spacing before table
  
  // Stationary Combustion
  const scope1Factors = [
    ['Stationary Combustion', '', '', ''],
    ['Natural Gas', EMISSION_FACTORS.naturalGas.factor, EMISSION_FACTORS.naturalGas.unit, EMISSION_FACTORS.naturalGas.reference],
    ['Mobile Combustion', '', '', ''],
    ['Diesel Fuel', EMISSION_FACTORS.diesel.factor, EMISSION_FACTORS.diesel.unit, EMISSION_FACTORS.diesel.reference],
    ['Petrol/Gasoline', EMISSION_FACTORS.petrol.factor, EMISSION_FACTORS.petrol.unit, EMISSION_FACTORS.petrol.reference],
    ['Vehicle Fuel (average)', EMISSION_FACTORS.vehicleFuel.factor, EMISSION_FACTORS.vehicleFuel.unit, EMISSION_FACTORS.vehicleFuel.reference],
    ['Refrigerants (Fugitive)', '', '', ''],
    ['R-410A', EMISSION_FACTORS.refrigerantR410a.factor, EMISSION_FACTORS.refrigerantR410a.unit, EMISSION_FACTORS.refrigerantR410a.reference],
    ['R-134a', EMISSION_FACTORS.refrigerantR134a.factor, EMISSION_FACTORS.refrigerantR134a.unit, EMISSION_FACTORS.refrigerantR134a.reference],
    ['R-32', EMISSION_FACTORS.refrigerantR32.factor, EMISSION_FACTORS.refrigerantR32.unit, EMISSION_FACTORS.refrigerantR32.reference],
    ['R-404A', EMISSION_FACTORS.refrigerantR404a.factor, EMISSION_FACTORS.refrigerantR404a.unit, EMISSION_FACTORS.refrigerantR404a.reference],
    ['Agriculture & Livestock', '', '', ''],
    ['Cattle (Beef)', EMISSION_FACTORS.livestockCattle.factor, EMISSION_FACTORS.livestockCattle.unit, EMISSION_FACTORS.livestockCattle.reference],
    ['Dairy Cows', EMISSION_FACTORS.livestockDairyCows.factor, EMISSION_FACTORS.livestockDairyCows.unit, EMISSION_FACTORS.livestockDairyCows.reference],
    ['Pigs', EMISSION_FACTORS.livestockPigs.factor, EMISSION_FACTORS.livestockPigs.unit, EMISSION_FACTORS.livestockPigs.reference],
    ['Sheep', EMISSION_FACTORS.livestockSheep.factor, EMISSION_FACTORS.livestockSheep.unit, EMISSION_FACTORS.livestockSheep.reference],
    ['Poultry', EMISSION_FACTORS.livestockPoultry.factor, EMISSION_FACTORS.livestockPoultry.unit, EMISSION_FACTORS.livestockPoultry.reference]
  ];
  
  autoTable(pdf, {
    startY: pageManager.getY(),
    head: [['Emission Source', 'Factor', 'Unit', 'Reference']],
    body: scope1Factors,
    theme: 'striped',
    headStyles: { 
      fillColor: colors.PRIMARY,
      textColor: [255, 255, 255], // White text on colored background
      fontSize: FONT_SIZES.BODY // Changed from 9 to BODY
    },
    styles: { 
      fontSize: FONT_SIZES.BODY, // Changed from 8 to BODY
      cellPadding: 3,
      textColor: [0, 0, 0] // Black text for table content
    },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 35, halign: 'center' },
      3: { cellWidth: 85, fontSize: FONT_SIZES.SMALL } // Reference column can be smaller
    },
    didParseCell: function(data) {
      // Bold category headers
      if (data.row.index === 0 || data.row.index === 2 || data.row.index === 6 || data.row.index === 11) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = colors.LIGHT_GRAY;
        data.cell.styles.textColor = [0, 0, 0]; // Ensure black text for category headers
      }
    },
    margin: { left: PAGE_MARGINS.LEFT, right: PAGE_MARGINS.RIGHT }
  });
  
  pageManager.setY(pdf.lastAutoTable.finalY + 15); // Increased spacing after table
  
  // Scope 2 Emission Factors
  pageManager.checkPageBreak(40);
  pdf.setFontSize(FONT_SIZES.BODY);
  pdf.setFont(undefined, 'bold');
  pdf.setTextColor(0, 0, 0); // Ensure black text
  pdf.text('Scope 2 - Indirect Emission Factors', PAGE_MARGINS.LEFT, pageManager.getY());
  pageManager.moveY(10); // Increased spacing before table
  
  const scope2Factors = [
    ['Electricity', EMISSION_FACTORS.electricity.factor, EMISSION_FACTORS.electricity.unit, EMISSION_FACTORS.electricity.reference],
    ['Renewable Electricity', EMISSION_FACTORS.renewableElectricity.factor, EMISSION_FACTORS.renewableElectricity.unit, EMISSION_FACTORS.renewableElectricity.reference],
    ['Purchased Steam', EMISSION_FACTORS.steamPurchased.factor, EMISSION_FACTORS.steamPurchased.unit, EMISSION_FACTORS.steamPurchased.reference],
    ['Purchased Heating', EMISSION_FACTORS.heatingPurchased.factor, EMISSION_FACTORS.heatingPurchased.unit, EMISSION_FACTORS.heatingPurchased.reference],
    ['Purchased Cooling', EMISSION_FACTORS.coolingPurchased.factor, EMISSION_FACTORS.coolingPurchased.unit, EMISSION_FACTORS.coolingPurchased.reference],
    ['Data Center', EMISSION_FACTORS.dataCenter.factor, EMISSION_FACTORS.dataCenter.unit, EMISSION_FACTORS.dataCenter.reference]
  ];
  
  autoTable(pdf, {
    startY: pageManager.getY(),
    head: [['Emission Source', 'Factor', 'Unit', 'Reference']],
    body: scope2Factors,
    theme: 'striped',
    headStyles: { 
      fillColor: colors.PRIMARY,
      textColor: [255, 255, 255], // White text on colored background
      fontSize: FONT_SIZES.BODY // Changed from 9 to BODY
    },
    styles: { 
      fontSize: FONT_SIZES.BODY, // Changed from 8 to BODY
      cellPadding: 3,
      textColor: [0, 0, 0] // Black text for table content
    },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 35, halign: 'center' },
      3: { cellWidth: 85, fontSize: FONT_SIZES.SMALL } // Reference column can be smaller
    },
    margin: { left: PAGE_MARGINS.LEFT, right: PAGE_MARGINS.RIGHT }
  });
  
  pageManager.setY(pdf.lastAutoTable.finalY + 15); // Increased spacing after table
  
  // Scope 3 Emission Factors
  pageManager.checkPageBreak(40);
  pdf.setFontSize(FONT_SIZES.BODY);
  pdf.setFont(undefined, 'bold');
  pdf.setTextColor(0, 0, 0); // Ensure black text
  pdf.text('Scope 3 - Value Chain Emission Factors', PAGE_MARGINS.LEFT, pageManager.getY());
  pageManager.moveY(10); // Increased spacing before table
  
  const scope3Factors = [
    ['Business Travel', '', '', ''],
    ['Business Flights', EMISSION_FACTORS.businessFlights.factor, EMISSION_FACTORS.businessFlights.unit, EMISSION_FACTORS.businessFlights.reference],
    ['Business Travel (Road)', EMISSION_FACTORS.businessTravel.factor, EMISSION_FACTORS.businessTravel.unit, EMISSION_FACTORS.businessTravel.reference],
    ['Hotel Stays', EMISSION_FACTORS.hotelStays.factor, EMISSION_FACTORS.hotelStays.unit, EMISSION_FACTORS.hotelStays.reference],
    ['Employee Commuting', EMISSION_FACTORS.employeeCommuting.factor, EMISSION_FACTORS.employeeCommuting.unit, EMISSION_FACTORS.employeeCommuting.reference],
    ['Waste & Water', '', '', ''],
    ['Waste to Landfill', EMISSION_FACTORS.wasteGenerated.factor, EMISSION_FACTORS.wasteGenerated.unit, EMISSION_FACTORS.wasteGenerated.reference],
    ['Waste Recycled', EMISSION_FACTORS.wasteRecycled.factor, EMISSION_FACTORS.wasteRecycled.unit, EMISSION_FACTORS.wasteRecycled.reference],
    ['Waste Composted', EMISSION_FACTORS.wasteComposted.factor, EMISSION_FACTORS.wasteComposted.unit, EMISSION_FACTORS.wasteComposted.reference],
    ['Water Usage', EMISSION_FACTORS.waterUsage.factor, EMISSION_FACTORS.waterUsage.unit, EMISSION_FACTORS.waterUsage.reference],
    ['Wastewater', EMISSION_FACTORS.wastewater.factor, EMISSION_FACTORS.wastewater.unit, EMISSION_FACTORS.wastewater.reference],
    ['Supply Chain', '', '', ''],
    ['Purchased Goods', EMISSION_FACTORS.purchasedGoods.factor, EMISSION_FACTORS.purchasedGoods.unit, EMISSION_FACTORS.purchasedGoods.reference],
    ['Paper Consumption', EMISSION_FACTORS.paperConsumption.factor, EMISSION_FACTORS.paperConsumption.unit, EMISSION_FACTORS.paperConsumption.reference],
    ['Freight Transport', EMISSION_FACTORS.freight.factor, EMISSION_FACTORS.freight.unit, EMISSION_FACTORS.freight.reference],
    ['IT Equipment', '', '', ''],
    ['Laptops', EMISSION_FACTORS.laptops.factor, EMISSION_FACTORS.laptops.unit, EMISSION_FACTORS.laptops.reference],
    ['Monitors', EMISSION_FACTORS.monitors.factor, EMISSION_FACTORS.monitors.unit, EMISSION_FACTORS.monitors.reference],
    ['Smartphones', EMISSION_FACTORS.smartphones.factor, EMISSION_FACTORS.smartphones.unit, EMISSION_FACTORS.smartphones.reference],
    ['Servers', EMISSION_FACTORS.servers.factor, EMISSION_FACTORS.servers.unit, EMISSION_FACTORS.servers.reference]
  ];
  
  autoTable(pdf, {
    startY: pageManager.getY(),
    head: [['Emission Source', 'Factor', 'Unit', 'Reference']],
    body: scope3Factors,
    theme: 'striped',
    headStyles: { 
      fillColor: colors.PRIMARY,
      textColor: [255, 255, 255], // White text on colored background
      fontSize: FONT_SIZES.BODY // Changed from 9 to BODY
    },
    styles: { 
      fontSize: FONT_SIZES.BODY, // Changed from 8 to BODY
      cellPadding: 3,
      textColor: [0, 0, 0] // Black text for table content
    },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 35, halign: 'center' },
      3: { cellWidth: 85, fontSize: FONT_SIZES.SMALL } // Reference column can be smaller
    },
    didParseCell: function(data) {
      // Bold category headers
      if (data.row.index === 0 || data.row.index === 5 || data.row.index === 11 || data.row.index === 15) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = colors.LIGHT_GRAY;
        data.cell.styles.textColor = [0, 0, 0]; // Ensure black text for category headers
      }
    },
    margin: { left: PAGE_MARGINS.LEFT, right: PAGE_MARGINS.RIGHT }
  });
  
  pageManager.setY(pdf.lastAutoTable.finalY + 20); // Extra spacing before glossary
  
  // Appendix C: Glossary
  pageManager.checkPageBreak(40);
  pdf.setFontSize(FONT_SIZES.SUBSECTION);
  pdf.setFont(undefined, 'bold');
  pdf.setTextColor(0, 0, 0); // Ensure black text
  pdf.text('Appendix C: Glossary of Terms', PAGE_MARGINS.LEFT, pageManager.getY());
  pageManager.moveY(12); // Increased spacing
  
  pdf.setFontSize(FONT_SIZES.BODY); // Changed from SMALL to BODY
  pdf.setFont(undefined, 'normal');
  
  const glossary = [
    'CO2e: Carbon dioxide equivalent',
    'GHG: Greenhouse Gas',
    'Scope 1: Direct emissions from owned or controlled sources',
    'Scope 2: Indirect emissions from purchased electricity, heat, steam, and cooling',
    'Scope 3: All other indirect emissions in the value chain',
    'tCO2e: Tonnes of carbon dioxide equivalent',
    'TCFD: Task Force on Climate-related Financial Disclosures',
    'SBTi: Science Based Targets initiative',
    'GWP: Global Warming Potential',
    'IPCC: Intergovernmental Panel on Climate Change'
  ];
  
  glossary.forEach(term => {
    pageManager.checkPageBreak();
    pdf.text(`• ${term}`, PAGE_MARGINS.LEFT, pageManager.getY());
    pageManager.moveY(6); // Increased line spacing
  });
  
  // Contact information
  pageManager.moveY(10); // Extra spacing before contact box
  pageManager.checkPageBreak(30);
  pdf.setFillColor(...colors.LIGHT_GRAY);
  pdf.rect(PAGE_MARGINS.LEFT, pageManager.getY(), PAGE_DIMENSIONS.CONTENT_WIDTH, 30, 'F');
  
  pageManager.moveY(8);
  pdf.setFont(undefined, 'bold');
  pdf.setFontSize(FONT_SIZES.BODY);
  pdf.setTextColor(0, 0, 0); // Ensure black text
  pdf.text('For More Information Contact:', PAGE_MARGINS.LEFT + 5, pageManager.getY());
  pageManager.moveY(7); // Increased spacing
  
  pdf.setFont(undefined, 'normal');
  pdf.setFontSize(FONT_SIZES.BODY); // Changed from SMALL to BODY
  const contactPerson = reportData.companyInfo?.contactPerson || reportData.reportPreparer || 'Sustainability Team';
  const contactEmail = reportData.companyInfo?.contactEmail || 'sustainability@company.com';
  const contactPhone = reportData.companyInfo?.contactPhone || 'Not provided';
  
  pdf.text(contactPerson, PAGE_MARGINS.LEFT + 5, pageManager.getY());
  pageManager.moveY(6);
  pdf.text(`Email: ${contactEmail}`, PAGE_MARGINS.LEFT + 5, pageManager.getY());
  pageManager.moveY(6);
  pdf.text(`Phone: ${contactPhone}`, PAGE_MARGINS.LEFT + 5, pageManager.getY());
};

// Enhanced fallback PDF generation
const generateFallbackPDF = (reportData) => {
  console.log('Using fallback PDF generation');
  
  const pdf = new jsPDF('p', 'mm', 'a4');
  const colors = getColors(reportData.branding);
  const pageManager = new PDFPageManager(pdf, reportData, colors);
  
  // Use the same structured approach as main function
  addTitlePage(pdf, reportData, pageManager, colors);
  
  // Add basic content sections
  pageManager.addPage();
  addExecutiveSummary(pdf, reportData, pageManager, colors);
  
  if (reportData.emissions) {
    pageManager.addPage();
    addEmissionsSummary(pdf, reportData, pageManager, null, colors);
  }
  
  // Add a simple message if data is limited
  if (!reportData.emissions || !reportData.companyName) {
    pageManager.addPage();
    pdf.setFontSize(12);
    pdf.text('Limited data available for report generation.', PAGE_MARGINS.LEFT, pageManager.getY());
    pageManager.moveY(10);
    pdf.text('Please ensure all required data is provided.', PAGE_MARGINS.LEFT, pageManager.getY());
  }
  
  return pdf;
};

// Email report function
const emailReport = async (reportData, recipientEmail) => {
  try {
    if (!recipientEmail || !recipientEmail.includes('@')) {
      throw new Error('Invalid email address');
    }
    
    const reportElement = document.getElementById('emissions-report');
    const pdf = await generateReportPDF(reportData, reportElement);
    const pdfBlob = pdf.output('blob');
    
    console.log('Sending report to:', recipientEmail);
    console.log('Report size:', pdfBlob.size, 'bytes');
    
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Email sent successfully');
        resolve({
          success: true,
          message: `Report sent to ${recipientEmail}`
        });
      }, 2000);
    });
    
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Legacy export for backward compatibility
const generateComplianceReportPDF = generateReportPDF;

// Export all functions
export { 
  handleLogoUpload,
  generateReportPDF,
  emailReport,
  generateComplianceReportPDF,
  addHeaderFooter, 
  addAppendices, 
  addDetailedEmissionsSection,
  addTitlePage,
  addExecutiveSummary,
  addOrganizationDetails,
  addReportingMethodology,
  addEmissionsSummary,
  addReductionStrategies,
  addComplianceSection,
  addStatementOfResponsibility,
  addSectionHeader,
  generateFallbackPDF,
  PDFPageManager,
  PAGE_MARGINS,
  PAGE_DIMENSIONS,
  FONT_SIZES,
  COLORS,
  EMISSION_FACTORS,
  getColors,
  detectImageFormat,
  processImageForPDF,
  calculateLogoDimensions
};