// utils/marketplaceApi.js - Fixed version with correct API paths
import api from '../api-config';

// Since api-config baseURL is 'http://localhost:3001/api', we should use '/marketplace/...'
// NOT '/api/marketplace/...'

// Function to fetch products from API with optional filtering
export const fetchMarketplaceProducts = async (filters = {}) => {
  console.log('marketplaceApi.js version: UPDATED');
  const { projectType, category, subcategory, search } = filters;
  const params = new URLSearchParams();
  
  if (projectType) params.append('projectType', projectType);
  if (category) params.append('category', category);
  if (subcategory) params.append('subcategory', subcategory);
  if (search) params.append('search', search);
  
  try {
    // Create the query string
    const queryString = params.toString();
    const url = `/marketplace/products${queryString ? `?${queryString}` : ''}`;
    
    console.log('Fetching products from:', url);
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch marketplace products:', error);
    throw error;
  }
};

// Function to get a single product by ID
export const fetchProductById = async (productId) => {
  try {
    const response = await api.get(`/marketplace/products/${productId}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch product ${productId}:`, error);
    throw error;
  }
};

// Function to fetch products associated with a project
export const fetchProjectProducts = async (projectId) => {
  try {
    const response = await api.get(`/marketplace/assessment-projects/${projectId}/products`);
    return response.data;
  } catch (error) {
    console.error('Error fetching project products:', error);
    if (error.response?.status === 401) {
      throw new Error('Authentication required - please log in again');
    }
    throw error;
  }
};

// Function to add a product to a project
export const addProductToProject = async (projectId, product) => {
  try {
    const payload = {
      productId: product.id,
      quantity: product.quantity || 1,
      notes: product.notes || '',
      material_type: product.material_type || '',
      subcategory: product.subcategory || '',
      unit: product.unit || ''
    };
    
    console.log('Adding product to project with payload:', payload);
    
    const response = await api.post(
      `/marketplace/assessment-projects/${projectId}/products`,
      payload
    );
    
    return response.data;
  } catch (error) {
    console.error('Error adding product to project:', error);
    if (error.response?.status === 401) {
      throw new Error('Authentication required - please log in again');
    }
    throw error;
  }
};

// Function to remove a product from a project
export const removeProductFromProject = async (projectId, productId) => {
  try {
    console.log(`Removing product ${productId} from project ${projectId}`);
    
    const response = await api.delete(
      `/marketplace/assessment-projects/${projectId}/products/${productId}`
    );
    
    return response.data || { success: true };
  } catch (error) {
    console.error('Error removing product from project:', error);
    if (error.response?.status === 401) {
      throw new Error('Authentication required - please log in again');
    }
    throw error;
  }
};

// Function to apply product effects to project results
export const applyProductToProject = (product, projectResults) => {
  if (!product || !projectResults) return projectResults;
  
  let updatedResults = { ...projectResults };
  
  // Apply product effects based on integration details
  const integrationDetails = product.integration_details || {};
  const emissionsReductionFactor = product.emissions_reduction_factor || product.emissionsReduction || 0;
  
  if (product.project_types?.includes('construction') && integrationDetails.construction) {
    const details = integrationDetails.construction;
    
    if (details.materialId) {
      // Apply material-specific effects
      const materialType = details.materialId.split('_')[0];
      
      switch(materialType) {
        case 'steel':
          if (updatedResults.steelEmissions) {
            updatedResults.steelEmissions *= (1 - emissionsReductionFactor);
          }
          break;
        case 'cement':
          if (updatedResults.cementEmissions) {
            updatedResults.cementEmissions *= (1 - emissionsReductionFactor);
          }
          break;
        default:
          // Apply to general embodied carbon
          if (updatedResults.embodiedCarbon) {
            updatedResults.embodiedCarbon *= (1 - emissionsReductionFactor);
          }
      }
    } else {
      // Apply to overall results if no specific material
      if (updatedResults.totalEmissions) {
        updatedResults.totalEmissions *= (1 - emissionsReductionFactor);
      }
      if (updatedResults.totalSequestration) {
        updatedResults.totalSequestration *= (1 + emissionsReductionFactor);
      }
    }
  } else {
    // For non-construction projects, apply to overall results
    if (updatedResults.totalEmissions) {
      updatedResults.totalEmissions *= (1 - emissionsReductionFactor);
    }
    if (updatedResults.totalSequestration) {
      updatedResults.totalSequestration *= (1 + emissionsReductionFactor);
    }
  }
  
  // Recalculate financial metrics if they exist
  if (updatedResults.totalSequestration && updatedResults.carbonCreditPrice) {
    updatedResults.totalRevenue = updatedResults.totalSequestration * updatedResults.carbonCreditPrice;
    
    if (updatedResults.totalCost) {
      updatedResults.netProfit = updatedResults.totalRevenue - updatedResults.totalCost;
      
      if (updatedResults.totalCost > 0) {
        updatedResults.roi = updatedResults.netProfit / updatedResults.totalCost;
      }
    }
  }
  
  return updatedResults;
};