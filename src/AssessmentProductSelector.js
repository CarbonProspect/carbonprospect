// AssessmentProductSelector.js - Fixed version
import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthSystem';
import { fetchMarketplaceProducts, addProductToProject } from './utils/marketplaceApi';
import { applyProductToCalculation } from './utils/productIntegration';

const AssessmentProductSelector = ({ projectId, projectType, calculationParams, onProductAdded, onCalculationUpdate }) => {
  const { currentUser, refreshToken } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [materialType, setMaterialType] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [unit, setUnit] = useState('');
  const [totalCost, setTotalCost] = useState(0);
  const [filterCategory, setFilterCategory] = useState('');
  const [availableCategories, setAvailableCategories] = useState([]);
  
  // Material types by category
  const materialTypes = {
    'Construction': ['Steel', 'Concrete', 'Wood', 'Aluminum', 'Glass', 'Copper', 'Insulation', 'Other'],
    'Construction Materials': ['Steel', 'Concrete', 'Wood', 'Aluminum', 'Glass', 'Copper', 'Insulation', 'Other'],
    'Green Materials': ['Recycled', 'Bio-based', 'Low-carbon', 'Zero-carbon', 'Other'],
    'Agricultural': ['Soil Amendment', 'Fertilizer', 'Seeds', 'Irrigation', 'Equipment', 'Other'],
    'Coastal': ['Erosion Control', 'Habitat Restoration', 'Water Quality', 'Other'],
    'Forest Management': ['Reforestation', 'Conservation', 'Sustainable Harvesting', 'Fire Management', 'Other'],
    'Green Energy': ['Solar', 'Wind', 'Hydro', 'Geothermal', 'Biomass', 'Storage', 'Other'],
    'Livestock': ['Feed Additives', 'Waste Management', 'Methane Capture', 'Grazing Management', 'Other'],
    'Smart Building': ['HVAC', 'Lighting', 'Insulation', 'Building Management Systems', 'Other']
  };
  
  // Subcategories by category
  const subcategories = {
    'Construction': ['New Construction', 'Renovation', 'Infrastructure', 'Commercial', 'Residential', 'Industrial'],
    'Construction Materials': ['Structural', 'Finishing', 'Insulation', 'Roofing', 'Flooring', 'Other'],
    'Green Materials': ['Building Materials', 'Packaging', 'Consumer Products', 'Industrial Materials', 'Other'],
    'Agricultural': ['Crop Management', 'Soil Management', 'Water Management', 'Equipment', 'Other'],
    'Coastal': ['Mangrove Restoration', 'Coral Reef Protection', 'Seagrass Meadows', 'Coastal Infrastructure', 'Other'],
    'Forest Management': ['Tropical', 'Temperate', 'Boreal', 'Urban Forestry', 'Agroforestry', 'Other'],
    'Green Energy': ['Utility Scale', 'Commercial', 'Residential', 'Off-grid', 'Microgrids', 'Other'],
    'Livestock': ['Cattle', 'Pigs', 'Poultry', 'Sheep', 'Goats', 'Other'],
    'Smart Building': ['Commercial', 'Residential', 'Industrial', 'Institutional', 'Other']
  };
  
  // Units by category
  const unitOptions = {
    'Construction': ['m²', 'm³', 'tonnes', 'kg', 'units', 'other'],
    'Construction Materials': ['m²', 'm³', 'tonnes', 'kg', 'units', 'other'],
    'Green Materials': ['m²', 'm³', 'tonnes', 'kg', 'units', 'other'],
    'Agricultural': ['hectares', 'acres', 'kg', 'tonnes', 'units', 'other'],
    'Coastal': ['km', 'm²', 'hectares', 'units', 'other'],
    'Forest Management': ['hectares', 'acres', 'tonnes', 'trees', 'other'],
    'Green Energy': ['kW', 'MW', 'kWh', 'MWh', 'units', 'other'],
    'Livestock': ['animals', 'kg', 'tonnes', 'units', 'other'],
    'Smart Building': ['m²', 'units', 'systems', 'other']
  };
  
  // Fetch products and categories on component mount
  useEffect(() => {
    fetchProducts();
  }, [projectType, filterCategory]);
  
  // Refresh token if needed - this is to prevent auth errors
  useEffect(() => {
    // Check if we need to refresh the token
    if (currentUser && currentUser.token) {
      try {
        const tokenParts = currentUser.token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          const expiry = payload.exp * 1000; // Convert to milliseconds
          const timeToExpiry = expiry - Date.now();
          
          // If token expires in less than 5 minutes, refresh it
          if (timeToExpiry < 300000 && timeToExpiry > 0) {
            refreshToken();
          }
        }
      } catch (e) {
        console.warn('Error checking token expiry:', e);
      }
    }
  }, [currentUser, refreshToken]);
  
  // Update total cost when quantity or unit price changes
  useEffect(() => {
    if (selectedProduct && selectedProduct.unit_price) {
      setTotalCost(quantity * selectedProduct.unit_price);
    }
  }, [quantity, selectedProduct]);
  
  // Set default material type and subcategory when selecting a product
  useEffect(() => {
    if (selectedProduct) {
      // Set default material type if provided by the product
      if (selectedProduct.material_type) {
        setMaterialType(selectedProduct.material_type);
      } else if (materialTypes[selectedProduct.category]) {
        setMaterialType(materialTypes[selectedProduct.category][0]);
      }
      
      // Set default subcategory if provided by the product
      if (selectedProduct.subcategory) {
        setSubcategory(selectedProduct.subcategory);
      } else if (subcategories[selectedProduct.category]) {
        setSubcategory(subcategories[selectedProduct.category][0]);
      }
      
      // Set default unit if provided by the product
      if (selectedProduct.unit) {
        setUnit(selectedProduct.unit);
      } else if (unitOptions[selectedProduct.category]) {
        setUnit(unitOptions[selectedProduct.category][0]);
      }
    }
  }, [selectedProduct]);
  
  // Function to fetch products with appropriate filters
  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Use existing API function with appropriate filters
      const filters = {
        projectType: projectType,
        category: filterCategory || undefined
      };
      
      const fetchedProducts = await fetchMarketplaceProducts(filters);
      console.log('Fetched products:', fetchedProducts);
      setProducts(fetchedProducts);
      
      // Extract unique categories for the filter dropdown
      const categories = [...new Set(fetchedProducts.map(product => product.category))];
      setAvailableCategories(categories);
      
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load compatible products. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle product selection
  const handleProductSelect = (product) => {
    console.log('Selected product:', product);
    setSelectedProduct(product);
    setError(null);
    
    // Reset form values
    setQuantity(1);
    setNotes('');
    
    // Preview the effects if we have calculation parameters
    if (calculationParams && onCalculationUpdate) {
      const updatedParams = applyProductToCalculation(product.id, calculationParams);
      onCalculationUpdate(updatedParams, true); // true indicates this is just a preview
    }
  };
  
  // Handle adding product to project
  const handleAddProduct = async () => {
    if (!selectedProduct) {
      setError('Please select a product first');
      return;
    }
    
    try {
      console.log('Adding product to project:', {
        projectId,
        product: {
          id: selectedProduct.id,
          quantity,
          notes,
          material_type: materialType,
          subcategory,
          unit
        }
      });
      
      // Use the imported addProductToProject function
      const result = await addProductToProject(projectId, {
        id: selectedProduct.id,
        quantity,
        notes,
        material_type: materialType,
        subcategory,
        unit
      });
      
      console.log('Product added successfully:', result);
      
      // Apply the product effects to the calculation
      if (calculationParams && onCalculationUpdate) {
        const updatedParams = applyProductToCalculation(selectedProduct.id, calculationParams);
        onCalculationUpdate(updatedParams, false); // false indicates this is a permanent change
      }
      
      // Notify parent component
      if (onProductAdded) {
        onProductAdded({
          ...selectedProduct,
          quantity,
          notes,
          material_type: materialType,
          subcategory,
          unit,
          total_cost: totalCost
        });
      }
      
      // Reset form
      setSelectedProduct(null);
      setQuantity(1);
      setNotes('');
      setMaterialType('');
      setSubcategory('');
      setUnit('');
      setTotalCost(0);
      
    } catch (err) {
      console.error('Error adding product to project:', err);
      if (err.message.includes('Authentication')) {
        // Handle authentication errors specifically
        setError('Your session has expired. Please refresh the page and log in again.');
      } else {
        setError(err.message || 'Failed to add product to project. Please try again.');
      }
    }
  };
  
  // Helper to get badge color based on category
  const getCategoryColor = (category) => {
    const colors = {
      'Construction': 'bg-indigo-100 text-indigo-800',
      'Construction Materials': 'bg-indigo-100 text-indigo-800',
      'Green Materials': 'bg-emerald-100 text-emerald-800',
      'Livestock': 'bg-amber-100 text-amber-800',
      'Livestock Solutions': 'bg-amber-100 text-amber-800',
      'Green Energy': 'bg-blue-100 text-blue-800',
      'Forest Management': 'bg-green-100 text-green-800'
    };
    
    return colors[category] || 'bg-gray-100 text-gray-800';
  };
  
  if (loading && products.length === 0) {
    return <div className="text-center py-4">Loading compatible products...</div>;
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Add Carbon-Reducing Solutions</h3>
      
      {/* Category filter */}
      <div className="mb-6">
        <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-1">
          Filter by Category
        </label>
        <select
          id="category-filter"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Categories</option>
          {availableCategories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}
      
      {products.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          <p>No compatible products found for this project type.</p>
          <a 
            href="/marketplace/add-solution" 
            className="mt-2 inline-block text-blue-600 hover:underline"
          >
            Add a new product to the marketplace
          </a>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {products.map(product => (
              <div 
                key={product.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedProduct?.id === product.id 
                    ? 'border-blue-500 ring-2 ring-blue-200' 
                    : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => handleProductSelect(product)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">{product.name}</h4>
                    <p className="text-sm text-gray-500 mb-2">{product.company || product.company_name}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(product.category)}`}>
                      {product.category}
                    </span>
                    {product.subcategory && (
                      <span className="ml-2 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                        {product.subcategory}
                      </span>
                    )}
                  </div>
                  {product.unit_price && (
                    <div className="text-sm font-semibold text-green-700">
                      ${product.unit_price} / {product.unit || 'unit'}
                    </div>
                  )}
                </div>
                <div className="mt-3">
                  <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                  <div className="flex flex-wrap gap-3 mt-2 text-sm">
                    <span>
                      <span className="font-semibold">Reduction:</span> {Math.round((product.emissionsReduction || product.emissions_reduction_factor) * 100)}%
                    </span>
                    {product.material_type && (
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                        {product.material_type}
                      </span>
                    )}
                  </div>
                  {product.certifications && product.certifications.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {product.certifications.map(cert => (
                        <span key={cert} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                          {cert}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {selectedProduct && (
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-800 mb-3">Add {selectedProduct.name} to your project</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="material_type" className="block text-sm font-medium text-gray-700 mb-1">
                    Material Type
                  </label>
                  <select
                    id="material_type"
                    value={materialType}
                    onChange={(e) => setMaterialType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Material Type</option>
                    {materialTypes[selectedProduct.category]?.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 mb-1">
                    Subcategory
                  </label>
                  <select
                    id="subcategory"
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Subcategory</option>
                    {subcategories[selectedProduct.category]?.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
                    Unit of Measurement
                  </label>
                  <select
                    id="unit"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Unit</option>
                    {unitOptions[selectedProduct.category]?.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (optional)
                  </label>
                  <input
                    type="text"
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Any specific requirements or notes"
                  />
                </div>
              </div>
              
              {/* Product details summary */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h5 className="font-medium text-gray-800 mb-2">Effects on Your Project</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Emissions Reduction</p>
                    <p className="text-lg font-semibold text-green-600">
                      {Math.round((selectedProduct.emissionsReduction || selectedProduct.emissions_reduction_factor) * 100)}%
                    </p>
                  </div>
                  
                  {selectedProduct.unit_price && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Unit Price</p>
                      <p className="text-lg font-semibold text-amber-600">
                        ${selectedProduct.unit_price}/{selectedProduct.unit || 'unit'}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700">Total Cost</p>
                    <p className="text-lg font-semibold text-amber-600">
                      ${totalCost.toFixed(2)}
                    </p>
                  </div>
                  
                  {selectedProduct.costPremium && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Cost Premium</p>
                      <p className="text-lg font-semibold text-amber-600">
                        +{Math.round(selectedProduct.costPremium * 100)}%
                      </p>
                    </div>
                  )}
                  
                  {selectedProduct.costPerHead && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Cost Per Head</p>
                      <p className="text-lg font-semibold text-amber-600">
                        ${selectedProduct.costPerHead} per head
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <button
                type="button"
                onClick={handleAddProduct}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Add to Project
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AssessmentProductSelector;