// utils/productIntegration.js
/**
 * This module handles integration of climate technology products with the Carbon Prospect calculator
 */

// Store for all integrated products (would be replaced with backend database in production)
let integratedProducts = [
  {
    id: 'gs-001',
    name: 'GreenSteel™',
    company: 'CleanMetals Inc.',
    category: 'Construction',
    type: 'steel',
    emissionsReduction: 0.75, // 75% emissions reduction
    baseEmissions: 1.85, // tCO2e per ton of standard steel
    reducedEmissions: 0.46, // tCO2e per ton with this product
    costPremium: 0.12, // 12% cost premium
    description: 'Hydrogen-based direct reduction iron with electric arc furnace',
    certifications: ['ISO 14001', 'Environmental Product Declaration']
  },
  {
    id: 'fm-001',
    name: 'FeedX Methane Reducer',
    company: 'AgriTech Solutions',
    category: 'Livestock',
    type: 'feed-additive',
    emissionsReduction: 0.30, // 30% enteric methane reduction
    baseEfficiency: 1.0,
    improvedEfficiency: 0.7, // 30% reduction factor
    costPerHead: 5, // $5 per head monthly
    description: 'Specialized feed additive that inhibits methane production',
    certifications: ['FDA Approved', 'Carbon Trust Verified']
  },
  {
    id: 'cc-001',
    name: 'CarbonCap™ Cement',
    company: 'GreenBuild Materials',
    category: 'Construction',
    type: 'cement',
    emissionsReduction: 0.60, // 60% less CO2 than Portland cement
    baseEmissions: 0.9, // tCO2e per ton of standard cement
    reducedEmissions: 0.36, // tCO2e per ton with this product
    costPremium: 0.05, // 5% cost premium
    description: 'Low-carbon cement using industrial byproducts and novel binding agents',
    certifications: ['ASTM Compliant', 'Cradle to Cradle Certified']
  }
];

/**
 * Add a new product to the integrated products database
 * @param {Object} product - The product to integrate
 * @returns {Object} The integrated product with assigned ID
 */
export const integrateProduct = (product) => {
  // Generate a product ID 
  const productPrefix = product.category.substring(0, 2).toLowerCase();
  const productId = `${productPrefix}-${(integratedProducts.length + 1).toString().padStart(3, '0')}`;
  
  // Process the product data based on category
  let processedProduct = {
    id: productId,
    name: product.name,
    company: product.company,
    category: product.category,
    description: product.description,
    certifications: product.certifications || []
  };
  
  // Add category-specific properties
  if (product.category === 'Green Materials' || product.category === 'Construction Materials') {
    // Extract emission reduction percentage (assuming format like "75% less CO2")
    const reductionMatch = product.emissionsReduction.match(/(\d+)%/);
    const reductionPercent = reductionMatch ? parseFloat(reductionMatch[1]) / 100 : 0.5;
    
    processedProduct = {
      ...processedProduct,
      type: product.name.toLowerCase().includes('steel') ? 'steel' : 
            product.name.toLowerCase().includes('cement') ? 'cement' : 'other',
      emissionsReduction: reductionPercent,
      baseEmissions: product.type === 'steel' ? 1.85 : 0.9, // Default values based on material type
      reducedEmissions: product.type === 'steel' ? 1.85 * (1 - reductionPercent) : 0.9 * (1 - reductionPercent),
      costPremium: 0.1 // Default 10% premium if not specified
    };
    
    // Extract price premium if available (assuming format like "Premium of 12%")
    const premiumMatch = product.price.match(/Premium of (\d+)%/);
    if (premiumMatch) {
      processedProduct.costPremium = parseFloat(premiumMatch[1]) / 100;
    }
  } 
  else if (product.category === 'Livestock Solutions') {
    // Extract emission reduction percentage
    const reductionMatch = product.emissionsReduction.match(/(\d+)%/);
    const reductionPercent = reductionMatch ? parseFloat(reductionMatch[1]) / 100 : 0.2;
    
    processedProduct = {
      ...processedProduct,
      type: 'feed-additive',
      emissionsReduction: reductionPercent,
      baseEfficiency: 1.0,
      improvedEfficiency: 1.0 - reductionPercent,
      costPerHead: 5 // Default $5 per head if not specified
    };
    
    // Extract price per head if available (assuming format like "$5 per head")
    const costMatch = product.price.match(/\$(\d+)/);
    if (costMatch) {
      processedProduct.costPerHead = parseFloat(costMatch[1]);
    }
  }
  
  // Add to integrated products
  integratedProducts.push(processedProduct);
  
  return processedProduct;
};

/**
 * Get all integrated products
 * @returns {Array} All integrated products
 */
export const getAllIntegratedProducts = () => {
  return [...integratedProducts];
};

/**
 * Get integrated products by category
 * @param {string} category - The product category to filter by
 * @returns {Array} Filtered products
 */
export const getProductsByCategory = (category) => {
  return integratedProducts.filter(product => product.category === category);
};

/**
 * Get a specific product by ID
 * @param {string} id - The product ID
 * @returns {Object|null} The product or null if not found
 */
export const getProductById = (id) => {
  return integratedProducts.find(product => product.id === id) || null;
};

/**
 * Apply a product to the Carbon Prospect calculations
 * This function should be used in the appropriate calculation function
 * @param {string} productId - The ID of the product to apply
 * @param {Object} calculationParams - The parameters for the calculation
 * @returns {Object} Modified calculation parameters with the product applied
 */
export const applyProductToCalculation = (productId, calculationParams) => {
  const product = getProductById(productId);
  if (!product) return calculationParams;
  
  // Create a copy of the calculation parameters
  const updatedParams = { ...calculationParams };
  
  // Apply product effects based on category and type
  if (product.category === 'Construction' && product.type === 'steel') {
    // Modify steel emissions in construction projects
    if (updatedParams.materialEmissions && updatedParams.materialEmissions.steel) {
      updatedParams.materialEmissions.steel *= (1 - product.emissionsReduction);
    }
    
    // Adjust construction costs if applicable
    if (updatedParams.constructionCost) {
      updatedParams.constructionCost *= (1 + product.costPremium);
    }
  }
  else if (product.category === 'Construction' && product.type === 'cement') {
    // Modify cement emissions in construction projects
    if (updatedParams.materialEmissions && updatedParams.materialEmissions.cement) {
      updatedParams.materialEmissions.cement *= (1 - product.emissionsReduction);
    }
    
    // Adjust construction costs if applicable
    if (updatedParams.constructionCost) {
      updatedParams.constructionCost *= (1 + product.costPremium);
    }
  }
  else if (product.category === 'Livestock' && product.type === 'feed-additive') {
    // Modify livestock methane emissions
    if (updatedParams.baseEmissions) {
      updatedParams.baseEmissions *= (1 - product.emissionsReduction);
    }
    
    // Add cost of feed additive
    if (updatedParams.costs) {
      const additiveAnnualCost = product.costPerHead * 12 * updatedParams.herdSize;
      updatedParams.costs.push({
        id: `additive-${Date.now()}`,
        name: `${product.name} Feed Additive`,
        type: 'annual',
        value: additiveAnnualCost,
        year: 1,
        description: `Annual cost for ${product.name} at $${product.costPerHead} per head per month`
      });
    }
  }
  
  return updatedParams;
};