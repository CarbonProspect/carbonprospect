import React, { useState, useEffect } from 'react';
import { fetchMarketplaceProducts } from '../../utils/marketplaceApi';

const MarketplaceIntegration = ({
  projectType = 'construction',
  selectedProducts = {},
  onProductSelectionChange = () => {},
  onClose = () => {}
}) => {
  // State for products data
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for category filters
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSubcategory, setActiveSubcategory] = useState('all');
  
  // State for search
  const [searchQuery, setSearchQuery] = useState('');
  
  // State for selected preview product
  const [previewProduct, setPreviewProduct] = useState(null);
  
  // Load products from database on component mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use the marketplaceApi utility function instead of direct fetch
        const productsData = await fetchMarketplaceProducts({ 
          projectType: projectType || undefined 
        });
        
        console.log('Products received from API:', productsData);
        
        // Normalize data to ensure consistent structure
        const normalizedProducts = productsData.map(product => ({
          ...product,
          integration_details: product.integration_details || {},
          certifications: Array.isArray(product.certifications) ? product.certifications : [],
          project_types: Array.isArray(product.project_types) ? product.project_types : [],
          emissions_reduction_factor: parseFloat(product.emissions_reduction_factor) || 0,
          cost_savings_per_unit: parseFloat(product.cost_savings_per_unit) || 0
        }));
        
        setProducts(normalizedProducts);
      } catch (err) {
        console.error('Error loading products:', err);
        
        // Check if it's an authentication error
        if (err.message && err.message.includes('Authentication required')) {
          setError('Authentication required - please log in again');
        } else {
          setError('Failed to load marketplace products. Please check if the server is running.');
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadProducts();
  }, [projectType]);
  
  // Get unique categories and subcategories for filtering
  const categories = ['all', ...new Set(products.map(product => product.category).filter(Boolean))];
  
  // Get subcategories for the active category
  const subcategories = activeCategory === 'all' 
    ? ['all']
    : ['all', ...new Set(products
        .filter(product => activeCategory === 'all' || product.category === activeCategory)
        .map(product => product.subcategory)
        .filter(Boolean)
      )];
  
  // Filter products by category, subcategory and search query
  const filteredProducts = products.filter(product => {
    const matchesCategory = activeCategory === 'all' || product.category === activeCategory;
    const matchesSubcategory = activeSubcategory === 'all' || product.subcategory === activeSubcategory;
    const matchesSearch = searchQuery === '' || 
      (product.name && product.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSubcategory && matchesSearch;
  });
  
  // Handle product selection
  const handleSelectProduct = (product) => {
    const isSelected = !!selectedProducts[product.id];
    
    if (isSelected) {
      // Remove the product
      const updatedProducts = {...selectedProducts};
      delete updatedProducts[product.id];
      onProductSelectionChange(updatedProducts);
    } else {
      // Add the product
      onProductSelectionChange({
        ...selectedProducts,
        [product.id]: product
      });
    }
  };
  
  // Calculate product impacts based on project type
  const calculateProductImpact = (product) => {
    if (!product) return { primaryImpact: '0% emissions reduction', secondaryImpact: null };
    
    const emissionsFactor = parseFloat(product.emissions_reduction_factor) || 0;
    const integrationDetails = product.integration_details || {};
    
    // Handle different project types
    if (projectType === 'construction' && integrationDetails.construction) {
      const details = integrationDetails.construction;
      
      if (details.materialId) {
        // Material-specific impact
        const materialIdParts = details.materialId.split('_');
        const materialName = materialIdParts.map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        
        return {
          primaryImpact: `${Math.round(emissionsFactor * 100)}% reduction in ${materialName} emissions`,
          secondaryImpact: 'Optimizes material usage and reduces embodied carbon'
        };
      }
      
      // Default impact for construction
      return {
        primaryImpact: `${Math.round(emissionsFactor * 100)}% emissions reduction`,
        secondaryImpact: 'Reduces embodied carbon in construction materials'
      };
    }
    else if (projectType === 'livestock' && integrationDetails.livestock) {
      const details = integrationDetails.livestock;
      let applicationType = details.applicationType || 'feed';
      
      // Format application type for display (convert_snake_case to Title Case)
      const formattedType = applicationType
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      // Create impact details based on application type
      let secondaryImpact = null;
      
      if (details.dosePerAnimal) {
        secondaryImpact = `${formattedType}: ${details.dosePerAnimal} per animal`;
        
        if (details.costPerAnimal) {
          secondaryImpact += ` at $${details.costPerAnimal.toFixed(2)}/animal/day`;
        }
      } else if (details.implementationCost) {
        secondaryImpact = `Implementation cost: $${details.implementationCost} with $${details.costPerHectare}/hectare`;
      }
      
      return {
        primaryImpact: `${Math.round(emissionsFactor * 100)}% methane emissions reduction`,
        secondaryImpact: secondaryImpact
      };
    }
    else if (projectType === 'agriculture' && integrationDetails.agriculture) {
      // Handle agriculture-specific impacts
      const details = integrationDetails.agriculture;
      
      return {
        primaryImpact: `${Math.round(emissionsFactor * 100)}% emissions reduction`,
        secondaryImpact: details.description || 'Improves agricultural sustainability'
      };
    }
    else if (projectType === 'consulting' || product.category === 'Consultants') {
      // Handle consultant-specific impacts
      const details = integrationDetails.consulting || {};
      const expertise = details.expertise || [];
      
      return {
        primaryImpact: `${Math.round(emissionsFactor * 100)}% potential emissions reduction`,
        secondaryImpact: expertise.length > 0 
          ? `Expertise in: ${expertise.join(', ')}` 
          : 'Professional advisory services'
      };
    }
    
    // Default impact for any project type
    return {
      primaryImpact: `${Math.round(emissionsFactor * 100)}% emissions reduction`,
      secondaryImpact: null
    };
  };
  
  // Preview selected product details
  const handlePreviewProduct = (product) => {
    setPreviewProduct(product);
  };
  
  // Close preview
  const handleClosePreview = () => {
    setPreviewProduct(null);
  };
  
  // Render a badge based on project type
  const renderProjectTypeBadge = (type) => {
    const badgeClasses = {
      construction: 'bg-blue-100 text-blue-800',
      livestock: 'bg-green-100 text-green-800',
      agriculture: 'bg-yellow-100 text-yellow-800',
      consulting: 'bg-purple-100 text-purple-800',
      default: 'bg-gray-100 text-gray-800'
    };
    
    const badgeClass = badgeClasses[type] || badgeClasses.default;
    
    return (
      <span className={`px-2 py-0.5 text-xs ${badgeClass} rounded-full`}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  };
  
  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 overflow-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-auto">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-xl font-medium text-gray-800">Carbon Solutions Marketplace</h2>
          <div className="flex items-center space-x-2">
            {projectType && (
              <span className="mr-2">
                Viewing products for: {renderProjectTypeBadge(projectType)}
              </span>
            )}
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-4 bg-gray-50 border-b border-gray-200 sticky top-16 z-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2 items-center">
              <div className="text-sm font-medium text-gray-700 mr-1">Filter by:</div>
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => {
                      setActiveCategory(category);
                      setActiveSubcategory('all');
                    }}
                    className={`px-3 py-1 text-sm rounded-full ${
                      activeCategory === category 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {category === 'all' ? 'All Categories' : category}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Search technologies..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <svg className="animate-spin h-8 w-8 text-green-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="mt-2 text-gray-600">Loading marketplace technologies...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="mt-2">{error}</p>
              {error.includes('Authentication') && (
                <p className="mt-2 text-sm">
                  <a href="/login" className="text-blue-600 hover:underline">Click here to log in</a>
                </p>
              )}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="mt-2">No technologies found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProducts.map(product => {
                const isSelected = !!selectedProducts[product.id];
                const impact = calculateProductImpact(product);
                
                // Get array of project types
                let projectTypes = [];
                if (Array.isArray(product.project_types)) {
                  projectTypes = product.project_types;
                } else if (typeof product.project_types === 'string') {
                  try {
                    projectTypes = JSON.parse(product.project_types);
                  } catch (e) {
                    projectTypes = [];
                  }
                }
                
                return (
                  <div 
                    key={product.id}
                    className={`border rounded-lg transition-all ${isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-grow">
                          <div className="flex items-center">
                            <h3 className="font-medium text-lg">{product.name}</h3>
                            <span className="ml-2 text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Featured</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">by {product.company_name}</p>
                        </div>
                        <div>
                          <button
                            onClick={() => handleSelectProduct(product)}
                            className={`p-2 rounded-full ${
                              isSelected 
                                ? 'bg-green-500 text-white' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                            aria-label={isSelected ? "Remove product" : "Add product"}
                          >
                            {isSelected ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-3">{product.description}</p>
                      
                      {/* Project Type Badges */}
                      {projectTypes && projectTypes.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {projectTypes.map((type, index) => (
                            <span key={index}>
                              {renderProjectTypeBadge(type)}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Certifications */}
                      {product.certifications && product.certifications.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {product.certifications.map((cert, index) => (
                            <span key={index} className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                              {cert}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div className="border-t border-gray-200 pt-3">
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center text-green-700 text-sm font-medium">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            {impact.primaryImpact}
                          </div>
                          
                          {impact.secondaryImpact && (
                            <div className="text-xs text-gray-600 pl-6">
                              {impact.secondaryImpact}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 px-4 py-2 border-t border-gray-200 rounded-b-lg flex justify-between">
                      <button
                        onClick={() => handlePreviewProduct(product)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        View Details
                      </button>
                      
                      <button
                        onClick={() => handleSelectProduct(product)}
                        className={`text-sm ${isSelected ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}
                      >
                        {isSelected ? 'Remove from Project' : 'Add to Project'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Product preview modal */}
          {previewProduct && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
                  <h3 className="text-lg font-medium text-gray-800">{previewProduct.name}</h3>
                  <button 
                    onClick={handleClosePreview}
                    className="text-gray-500 hover:text-gray-700"
                    aria-label="Close preview"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <span className="text-sm text-gray-600 mr-2">by {previewProduct.company_name}</span>
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Featured</span>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Technology Description</h4>
                    <p className="text-sm text-gray-600">{previewProduct.description}</p>
                  </div>
                  
                  {/* Project Types */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Compatible With</h4>
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        let types = [];
                        if (Array.isArray(previewProduct.project_types)) {
                          types = previewProduct.project_types;
                        } else if (typeof previewProduct.project_types === 'string') {
                          try {
                            types = JSON.parse(previewProduct.project_types);
                          } catch (e) {
                            // If parsing fails, try to handle as comma-separated string
                            types = previewProduct.project_types.split(',').map(t => t.trim());
                          }
                        }
                        
                        return types.map((type, index) => (
                          <span key={index}>
                            {renderProjectTypeBadge(type)}
                          </span>
                        ));
                      })()}
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Performance</h4>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center text-green-700 text-sm font-medium mb-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        {calculateProductImpact(previewProduct).primaryImpact}
                      </div>
                      
                      {calculateProductImpact(previewProduct).secondaryImpact && (
                        <div className="text-sm text-gray-600 pl-6">
                          {calculateProductImpact(previewProduct).secondaryImpact}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Implementation Details - only show for specific project types */}
                  {(() => {
                    const details = previewProduct.integration_details || {};
                    
                    if (projectType === 'livestock' && details.livestock) {
                      return (
                        <div className="mb-6">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Implementation Details</h4>
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <dl className="divide-y divide-blue-100">
                              {details.livestock.applicationType && (
                                <div className="py-2 flex justify-between">
                                  <dt className="text-sm text-gray-600">Application Type:</dt>
                                  <dd className="text-sm font-medium text-gray-900">
                                    {details.livestock.applicationType.split('_').map(word => 
                                      word.charAt(0).toUpperCase() + word.slice(1)
                                    ).join(' ')}
                                  </dd>
                                </div>
                              )}
                              {details.livestock.dosePerAnimal && (
                                <div className="py-2 flex justify-between">
                                  <dt className="text-sm text-gray-600">Dosage:</dt>
                                  <dd className="text-sm font-medium text-gray-900">{details.livestock.dosePerAnimal}</dd>
                                </div>
                              )}
                              {details.livestock.costPerAnimal && (
                                <div className="py-2 flex justify-between">
                                  <dt className="text-sm text-gray-600">Cost per Animal:</dt>
                                  <dd className="text-sm font-medium text-gray-900">${details.livestock.costPerAnimal}/day</dd>
                                </div>
                              )}
                              {details.livestock.implementationCost && (
                                <div className="py-2 flex justify-between">
                                  <dt className="text-sm text-gray-600">Implementation Cost:</dt>
                                  <dd className="text-sm font-medium text-gray-900">${details.livestock.implementationCost}</dd>
                                </div>
                              )}
                              {details.livestock.costPerHectare && (
                                <div className="py-2 flex justify-between">
                                  <dt className="text-sm text-gray-600">Cost per Hectare:</dt>
                                  <dd className="text-sm font-medium text-gray-900">${details.livestock.costPerHectare}</dd>
                                </div>
                              )}
                            </dl>
                          </div>
                        </div>
                      );
                    } 
                    else if (projectType === 'construction' && details.construction) {
                      return (
                        <div className="mb-6">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Construction Details</h4>
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <dl className="divide-y divide-blue-100">
                              {details.construction.materialId && (
                                <div className="py-2 flex justify-between">
                                  <dt className="text-sm text-gray-600">Replaces Material:</dt>
                                  <dd className="text-sm font-medium text-gray-900">
                                    {details.construction.materialId.split('_').map(word => 
                                      word.charAt(0).toUpperCase() + word.slice(1)
                                    ).join(' ')}
                                  </dd>
                                </div>
                              )}
                              {details.construction.factor && (
                                <div className="py-2 flex justify-between">
                                  <dt className="text-sm text-gray-600">Carbon Reduction Factor:</dt>
                                  <dd className="text-sm font-medium text-gray-900">{details.construction.factor * 100}%</dd>
                                </div>
                              )}
                            </dl>
                          </div>
                        </div>
                      );
                    }
                    
                    return null;
                  })()}
                  
                  {previewProduct.certifications && previewProduct.certifications.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Certifications</h4>
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          let certs = [];
                          if (Array.isArray(previewProduct.certifications)) {
                            certs = previewProduct.certifications;
                          } else if (typeof previewProduct.certifications === 'string') {
                            try {
                              certs = JSON.parse(previewProduct.certifications);
                            } catch (e) {
                              // Handle as a single certification if parsing fails
                              certs = [previewProduct.certifications];
                            }
                          }
                          
                          return certs.map((cert, index) => (
                            <span key={index} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                              {cert}
                            </span>
                          ));
                        })()}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between pt-4 border-t border-gray-200">
                    <button
                      onClick={handleClosePreview}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                    >
                      Close
                    </button>
                    
                    <button
                      onClick={() => {
                        handleSelectProduct(previewProduct);
                        handleClosePreview();
                      }}
                      className={`px-4 py-2 rounded ${
                        selectedProducts[previewProduct.id]
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {selectedProducts[previewProduct.id] ? 'Remove from Project' : 'Add to Project'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-8 flex justify-between">
            <div>
              {Object.keys(selectedProducts).length > 0 && (
                <div className="text-sm text-green-700">
                  {Object.keys(selectedProducts).length} technology solution{Object.keys(selectedProducts).length !== 1 ? 's' : ''} selected
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Apply & Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceIntegration;