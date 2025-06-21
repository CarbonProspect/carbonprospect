// src/utils/exportUtils.js

/* global XLSX */  // Tell ESLint that XLSX is a global variable

// Export to Excel function with enhanced formatting
export const exportToExcel = (results, scenarioName) => {
  try {
    // Check if we have the xlsx library available
    if (typeof window.XLSX === 'undefined') {
      // Try to load SheetJS from CDN
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      script.onload = () => {
        // Retry export after library loads
        exportToExcel(results, scenarioName);
      };
      script.onerror = () => {
        alert('Failed to load Excel export library. Please check your internet connection and try again.');
      };
      document.head.appendChild(script);
      return;
    }

    // Access XLSX from window object to avoid ESLint issues
    const XLSXLib = window.XLSX;

    // Create a new workbook
    const wb = XLSXLib.utils.book_new();
    
    // Define cell styles
    const headerStyle = {
      font: { bold: true, sz: 14 },
      alignment: { horizontal: "center", vertical: "center" },
      fill: { fgColor: { rgb: "22C55E" } }
    };
    
    const subHeaderStyle = {
      font: { bold: true, sz: 12 },
      fill: { fgColor: { rgb: "E5E7EB" } }
    };
    
    const titleStyle = {
      font: { bold: true, sz: 16 },
      alignment: { horizontal: "center" }
    };
    
    // 1. Summary Sheet with enhanced formatting
    const summaryData = [
      ['PROJECT SUMMARY REPORT'],
      [''],
      ['Scenario Name:', scenarioName],
      ['Export Date:', new Date().toLocaleDateString()],
      ['Export Time:', new Date().toLocaleTimeString()],
      [''],
      ['KEY PERFORMANCE METRICS'],
      [''],
      ['Financial Metrics', ''],
      ['Total Revenue:', `$${(results.totalRevenue || 0).toLocaleString()}`],
      ['Total Cost:', `$${(results.totalCost || 0).toLocaleString()}`],
      ['Net Profit:', `$${(results.netProfit || 0).toLocaleString()}`],
      ['Net Present Value (NPV):', `$${(results.npv || 0).toLocaleString()}`],
      ['Internal Rate of Return (IRR):', results.irr ? `${results.irr.toFixed(2)}%` : 'N/A'],
      ['Return on Investment (ROI):', results.roi ? `${results.roi.toFixed(2)}%` : '0.00%'],
      ['Break-even Year:', results.breakEvenYear || 'N/A'],
      [''],
      ['Environmental Impact', ''],
      ['Total Carbon Sequestration:', `${(results.totalSequestration || 0).toLocaleString()} tCO2e`],
      ['Annual Average Sequestration:', `${Math.round((results.totalSequestration || 0) / (results.yearlyData?.length || 1)).toLocaleString()} tCO2e/year`],
    ];

    // Add construction-specific metrics if it's a construction project
    if (results.baselineEmbodied !== undefined) {
      summaryData.push(
        [''],
        ['Construction-Specific Metrics', ''],
        ['Baseline Embodied Carbon:', `${(results.baselineEmbodied || 0).toLocaleString()} tonnes`],
        ['Reduced Embodied Carbon:', `${(results.reducedEmbodied || 0).toLocaleString()} tonnes`],
        ['Embodied Carbon Savings:', `${(results.embodiedSavings || 0).toLocaleString()} tonnes`],
        ['Annual Operational Savings:', `$${(results.annualSavings || 0).toLocaleString()}`],
        ['Simple Payback Period:', results.simplePayback ? `${results.simplePayback} years` : 'N/A'],
        ['Building Lifespan:', `${results.buildingLifespan || 50} years`]
      );
    }

    const summaryWS = XLSXLib.utils.aoa_to_sheet(summaryData);
    
    // Set column widths
    summaryWS['!cols'] = [
      { wch: 35 }, 
      { wch: 25 }
    ];
    
    // Merge cells for headers
    summaryWS['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }, // Title
      { s: { r: 6, c: 0 }, e: { r: 6, c: 1 } }, // Key Performance Metrics
      { s: { r: 8, c: 0 }, e: { r: 8, c: 1 } }, // Financial Metrics
      { s: { r: 17, c: 0 }, e: { r: 17, c: 1 } } // Environmental Impact
    ];
    
    XLSXLib.utils.book_append_sheet(wb, summaryWS, 'Summary');
    
    // 2. Annual Results Sheet with formatting
    if (results.yearlyData && results.yearlyData.length > 0) {
      const yearlyHeaders = [
        ['ANNUAL CASH FLOW ANALYSIS'],
        [''],
        ['Year', 'Carbon Sequestration (tCO2e)', 'Revenue ($)', 'Costs ($)', 'Net Cash Flow ($)', 'Cumulative Cash Flow ($)']
      ];
      
      const yearlyData = [...yearlyHeaders];
      
      let totalSequestration = 0;
      let totalRevenue = 0;
      let totalCosts = 0;
      
      results.yearlyData.forEach(year => {
        const seq = Math.round(year.sequestration || 0);
        const rev = Math.round(year.revenue || 0);
        const cost = Math.round(year.costs || 0);
        
        totalSequestration += seq;
        totalRevenue += rev;
        totalCosts += cost;
        
        yearlyData.push([
          year.year,
          seq.toLocaleString(),
          rev.toLocaleString(),
          cost.toLocaleString(),
          Math.round(year.netCashFlow || 0).toLocaleString(),
          Math.round(year.cumulativeNetCashFlow || 0).toLocaleString()
        ]);
      });
      
      // Add totals row
      yearlyData.push([]);
      yearlyData.push([
        'TOTALS',
        totalSequestration.toLocaleString(),
        totalRevenue.toLocaleString(),
        totalCosts.toLocaleString(),
        (totalRevenue - totalCosts).toLocaleString(),
        '-'
      ]);
      
      const yearlyWS = XLSXLib.utils.aoa_to_sheet(yearlyData);
      
      // Set column widths
      yearlyWS['!cols'] = [
        { wch: 8 },   // Year
        { wch: 25 },  // Sequestration
        { wch: 15 },  // Revenue
        { wch: 15 },  // Costs
        { wch: 18 },  // Net Cash Flow
        { wch: 22 }   // Cumulative
      ];
      
      // Merge title cells
      yearlyWS['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }
      ];
      
      XLSXLib.utils.book_append_sheet(wb, yearlyWS, 'Annual Results');
    }
    
    // 3. Cost Breakdown Sheet with pie chart data
    if (results.chartData && results.chartData.costBreakdownData && results.chartData.costBreakdownData.length > 0) {
      const costHeaders = [
        ['COST BREAKDOWN ANALYSIS'],
        [''],
        ['Cost Category', 'Amount ($)', 'Percentage (%)']
      ];
      
      const costData = [...costHeaders];
      
      const totalCost = results.chartData.costBreakdownData.reduce((sum, item) => sum + (item.value || 0), 0);
      
      results.chartData.costBreakdownData.forEach(item => {
        const amount = Math.round(item.value || 0);
        const percentage = totalCost > 0 ? ((amount / totalCost) * 100).toFixed(2) : '0.00';
        costData.push([
          item.name,
          amount.toLocaleString(),
          `${percentage}%`
        ]);
      });
      
      // Add total row
      costData.push([]);
      costData.push(['TOTAL', totalCost.toLocaleString(), '100.00%']);
      
      const costWS = XLSXLib.utils.aoa_to_sheet(costData);
      
      // Set column widths
      costWS['!cols'] = [
        { wch: 30 }, 
        { wch: 15 },
        { wch: 15 }
      ];
      
      // Merge title
      costWS['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }
      ];
      
      XLSXLib.utils.book_append_sheet(wb, costWS, 'Cost Breakdown');
    }
    
    // 4. Emissions Breakdown Sheet (for construction projects)
    if (results.chartData && results.chartData.emissionsBreakdown && results.chartData.emissionsBreakdown.length > 0) {
      const emissionsHeaders = [
        ['EMISSIONS BREAKDOWN ANALYSIS'],
        [''],
        ['Emission Source', 'Carbon Emissions (tonnes CO2e)', 'Percentage (%)']
      ];
      
      const emissionsData = [...emissionsHeaders];
      
      const totalEmissions = results.chartData.emissionsBreakdown.reduce((sum, item) => sum + (item.value || 0), 0);
      
      results.chartData.emissionsBreakdown.forEach(item => {
        const amount = Math.round(item.value || 0);
        const percentage = totalEmissions > 0 ? ((amount / totalEmissions) * 100).toFixed(2) : '0.00';
        emissionsData.push([
          item.name,
          amount.toLocaleString(),
          `${percentage}%`
        ]);
      });
      
      // Add total row
      emissionsData.push([]);
      emissionsData.push(['TOTAL EMISSIONS', totalEmissions.toLocaleString(), '100.00%']);
      
      const emissionsWS = XLSXLib.utils.aoa_to_sheet(emissionsData);
      
      // Set column widths
      emissionsWS['!cols'] = [
        { wch: 30 }, 
        { wch: 25 },
        { wch: 15 }
      ];
      
      // Merge title
      emissionsWS['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }
      ];
      
      XLSXLib.utils.book_append_sheet(wb, emissionsWS, 'Emissions Breakdown');
    }
    
    // 5. Climate Technologies Sheet (if any)
    if (results.selectedProducts && results.selectedProducts.length > 0) {
      const productHeaders = [
        ['INTEGRATED CLIMATE TECHNOLOGIES'],
        [''],
        ['Technology Name', 'Provider', 'Category', 'Emissions Reduction (%)', 'Implementation Status']
      ];
      
      const productData = [...productHeaders];
      
      results.selectedProducts.forEach(product => {
        productData.push([
          product.name,
          product.company,
          product.category,
          `${Math.round((product.emissionsReduction || 0) * 100)}%`,
          'Selected for Implementation'
        ]);
      });
      
      // Add summary row
      productData.push([]);
      productData.push(['', '', 'Total Technologies:', results.selectedProducts.length, '']);
      
      const productWS = XLSXLib.utils.aoa_to_sheet(productData);
      
      // Set column widths
      productWS['!cols'] = [
        { wch: 30 }, 
        { wch: 20 }, 
        { wch: 20 }, 
        { wch: 20 },
        { wch: 25 }
      ];
      
      // Merge title
      productWS['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }
      ];
      
      XLSXLib.utils.book_append_sheet(wb, productWS, 'Climate Technologies');
    }
    
    // 6. Add a Notes/Assumptions sheet
    const notesData = [
      ['NOTES AND ASSUMPTIONS'],
      [''],
      ['General Assumptions:'],
      ['• All financial figures are in USD'],
      ['• Carbon sequestration rates are based on project-specific parameters'],
      ['• Discount rate applied to NPV calculations'],
      ['• Break-even analysis assumes consistent carbon credit prices unless specified otherwise'],
      [''],
      ['Data Export Information:'],
      ['• Generated by: Carbon Prospect Assessment Tool'],
      ['• Export Date: ' + new Date().toLocaleDateString()],
      ['• Export Time: ' + new Date().toLocaleTimeString()],
      [''],
      ['For questions or support, please contact your Carbon Prospect administrator.']
    ];
    
    const notesWS = XLSXLib.utils.aoa_to_sheet(notesData);
    notesWS['!cols'] = [{ wch: 80 }];
    
    XLSXLib.utils.book_append_sheet(wb, notesWS, 'Notes');
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 10);
    const safeScenarioName = scenarioName.replace(/[^a-z0-9]/gi, '_').substring(0, 50); // Limit filename length
    const filename = `CarbonProspect_${safeScenarioName}_${timestamp}.xlsx`;
    
    // Write the file
    XLSXLib.writeFile(wb, filename);
    
    console.log(`Successfully exported "${scenarioName}" to Excel`);
    
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    alert('Failed to export to Excel. Please check the console for details.');
  }
};

// Share project function
export const shareProject = (config) => {
  try {
    const encodedData = btoa(JSON.stringify(config));
    const shareableUrl = `${window.location.origin}${window.location.pathname}?shared=${encodedData}`;
    
    // Create a temporary input element to copy the URL
    const tempInput = document.createElement('input');
    document.body.appendChild(tempInput);
    tempInput.value = shareableUrl;
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    
    // Alert the user that the URL has been copied
    alert('Shareable link copied to clipboard! You can paste and share it with others.');
    
    // Optionally, also store in localStorage for sharing across tabs
    // localStorage.setItem('sharedProject', JSON.stringify(config));
    
    return shareableUrl;
  } catch (error) {
    console.error('Error sharing project:', error);
    alert('Failed to generate shareable link. Please try again.');
    return null;
  }
};

// Load shared project function
export const loadSharedProject = () => {
  try {
    // Check URL parameters for shared project data
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('shared')) {
      const sharedData = JSON.parse(atob(urlParams.get('shared')));
      // Clear URL parameter after loading to avoid reloading on refresh
      window.history.replaceState({}, document.title, window.location.pathname);
      return sharedData;
    }
    
    // Check localStorage for shared project data
    const storedSharedProject = localStorage.getItem('sharedProject');
    if (storedSharedProject) {
      // Remove from localStorage after loading to avoid reloading on refresh
      localStorage.removeItem('sharedProject');
      return JSON.parse(storedSharedProject);
    }
    
    return null;
  } catch (error) {
    console.error('Error loading shared project:', error);
    return null;
  }
};

// Scroll to section function
export const scrollToSection = (sectionId) => {
  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({ behavior: 'smooth' });
  }
};

// Generate PDF report function
export const generatePdfReport = (config, results) => {
  console.log('Generating PDF report for:', config, results);
  // Actual PDF generation would go here
  alert('PDF report generation will be implemented soon.');
};