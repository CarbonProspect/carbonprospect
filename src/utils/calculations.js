// Financial calculation functions
export const calculateNPV = (cashFlows, rate) => {
    const decimalRate = rate / 100; // Convert percentage to decimal
    let npv = 0;
    
    cashFlows.forEach((cashFlow, year) => {
      npv += cashFlow / Math.pow(1 + decimalRate, year + 1);
    });
    
    return npv;
  };
  
  export const calculateIRR = (cashFlows) => {
    // Simple implementation - in real code would use more robust algorithm
    if (cashFlows.length <= 1) return null;
    if (cashFlows.every(cf => cf >= 0) || cashFlows.every(cf => cf <= 0)) return null;
    
    // Try different rates and find when NPV is close to zero
    let low = -0.99;
    let high = 1;
    let guess = 0.1;
    let iterations = 0;
    let maxIterations = 100;
    
    while (iterations < maxIterations) {
      const currentGuess = guess;
      const npv = cashFlows.reduce((acc, cf, i) => 
        acc + cf / Math.pow(1 + currentGuess, i + 1), 0);
      
      if (Math.abs(npv) < 0.001) {
        return guess * 100; // Convert to percentage
      }
      
      if (npv > 0) {
        low = guess;
      } else {
        high = guess;
      }
      
      guess = (low + high) / 2;
      iterations++;
    }
    
    return guess * 100; // Convert to percentage
  };
  
  export const calculateROI = (totalProfit, totalCost) => {
    return totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;
  };
  
  // Function to get carbon price for a specific year
  export const getCarbonPriceForYear = (year, useYearlyCarbonPrices, carbonPricesByYear, carbonCreditPrice) => {
    if (!useYearlyCarbonPrices || carbonPricesByYear.length === 0) {
      return carbonCreditPrice;
    }
    
    const yearData = carbonPricesByYear.find(y => y.year === year);
    return yearData ? yearData.price : carbonCreditPrice;
  };
  
  // Helper function to calculate yearly costs
  export const calculateYearlyCosts = (costs, year, sizeMultiplier) => {
    let yearlyTotalCost = 0;
    
    // Add any fixed costs that occur in this specific year
    yearlyTotalCost += costs
      .filter(cost => cost.type === 'fixed' && cost.year === year)
      .reduce((sum, cost) => sum + cost.value, 0);
    
    // Add any per-hectare/unit costs that occur in this specific year
    yearlyTotalCost += costs
      .filter(cost => cost.type === 'per_hectare' && cost.year === year)
      .reduce((sum, cost) => sum + cost.value * sizeMultiplier, 0);
    
    // Add annual costs
    yearlyTotalCost += costs
      .filter(cost => cost.type === 'annual')
      .reduce((sum, cost) => {
        // If year is 0 or not specified, apply every year
        if (!cost.year || cost.year === 0) return sum + cost.value;
        // If year is specified, only apply in that year and subsequent years
        if (year >= cost.year) return sum + cost.value;
        return sum;
      }, 0);
    
    // Add annual per hectare costs
    yearlyTotalCost += costs
      .filter(cost => cost.type === 'annual_per_hectare')
      .reduce((sum, cost) => {
        // If year is 0 or not specified, apply every year
        if (!cost.year || cost.year === 0) return sum + cost.value * sizeMultiplier;
        // If year is specified, only apply in that year and subsequent years
        if (year >= cost.year) return sum + cost.value * sizeMultiplier;
        return sum;
      }, 0);
  
    return yearlyTotalCost;
  };
  
  // Helper function to prepare chart data from results
  export const prepareChartData = (results) => {
    if (!results || !results.yearlyData) return {};
    
    const cashFlowData = results.yearlyData.map(yearData => ({
      year: yearData.year,
      cashflow: yearData.netCashFlow,
      cumulative: yearData.cumulativeNetCashFlow,
      isPositive: yearData.netCashFlow >= 0
    }));
    
    const npvData = cashFlowData.map((d, i) => ({
      year: d.year,
      discountedCashFlow: results.yearlyData[i].netCashFlow / Math.pow(1 + (results.discountRate / 100), d.year),
      cumulativeNpv: results.npv * (i + 1) / results.yearlyData.length // Simplified approximation
    }));
    
    return {
      cashFlowData,
      npvData
    };
  };