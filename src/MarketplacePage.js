// MarketplacePage.js - Updated to show both products and services
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthSystem';
import { getImageUrl, handleImageError } from './utils/imageUrlHelper';

// Dynamically set API base URL based on environment
const API_BASE = process.env.NODE_ENV === 'production' 
  ? '/api'  // In production, use relative path (same domain)
  : 'http://localhost:3001/api';  // In development, use localhost

const MarketplacePage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState('products'); // Add tab state
  
  // Additional filter states
  const [subcategories, setSubcategories] = useState([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [emissionReductionMin, setEmissionReductionMin] = useState('');
  const [selectedImplementationTime, setSelectedImplementationTime] = useState('all');
  
  // Service-specific filters
  const [serviceCategories] = useState([
    'All Services',
    'Carbon Finance',
    'Carbon Accounting', 
    'Project Development',
    'Project Validation/Verification',
    'Technology Provider',
    'Monitoring & Measurement',
    'Strategy Consulting',
    'Legal Services',
    'Investment Advisory',
    'Other Services'
  ]);
  const [selectedServiceCategory, setSelectedServiceCategory] = useState('All Services');
  
  const { currentUser } = useAuth();
  
  // Load data based on selected tab
  useEffect(() => {
    loadProducts();
    if (selectedTab === 'products') {
      loadCategories();
    }
  }, [selectedTab, selectedCategory, selectedSubcategory, searchTerm, priceRange, emissionReductionMin, selectedImplementationTime, selectedServiceCategory]);
  
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      
      // Filter by entry type based on tab
      if (selectedTab === 'services') {
        params.append('entry_type', 'service');
        if (selectedServiceCategory !== 'All Services') {
          params.append('subcategory', selectedServiceCategory);
        }
      } else {
        params.append('entry_type', 'product');
        if (selectedCategory !== 'all') {
          params.append('category', selectedCategory);
        }
        if (selectedSubcategory !== 'all') {
          params.append('subcategory', selectedSubcategory);
        }
      }
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      const url = `${API_BASE}/marketplace/products${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        // Apply client-side filters
        let filteredProducts = data;
        
        if (selectedTab === 'products') {
          // Product-specific filters
          if (priceRange.min || priceRange.max) {
            filteredProducts = filteredProducts.filter(product => {
              const price = product.unit_price || 0;
              const minPrice = priceRange.min ? parseFloat(priceRange.min) : 0;
              const maxPrice = priceRange.max ? parseFloat(priceRange.max) : Infinity;
              return price >= minPrice && price <= maxPrice;
            });
          }
          
          if (emissionReductionMin) {
            filteredProducts = filteredProducts.filter(product => {
              const reduction = product.emissions_reduction_factor || 0;
              return reduction >= parseFloat(emissionReductionMin) / 100;
            });
          }
          
          if (selectedImplementationTime !== 'all') {
            filteredProducts = filteredProducts.filter(product => {
              const time = product.implementation_time || '';
              switch (selectedImplementationTime) {
                case 'immediate':
                  return time.toLowerCase().includes('immediate') || time.toLowerCase().includes('instant');
                case 'short':
                  return time.includes('week') || time.includes('1-2 month');
                case 'medium':
                  return time.includes('3-6 month') || time.includes('quarter');
                case 'long':
                  return time.includes('year') || time.includes('12 month');
                default:
                  return true;
              }
            });
          }
        }
        
        setProducts(filteredProducts);
      } else {
        console.warn('Unexpected response format:', data);
        setError('Unexpected data format from server');
      }
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Failed to load solutions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedTab, selectedCategory, selectedSubcategory, searchTerm, priceRange, emissionReductionMin, selectedImplementationTime, selectedServiceCategory]);
  
  const loadCategories = async () => {
    try {
      const response = await fetch(`${API_BASE}/marketplace/options`);
      const data = await response.json();
      
      if (data && data.categories) {
        // Filter out 'Services' from product categories
        setCategories(
          data.categories
            .filter(cat => cat !== 'Services')
            .map((category) => ({
              id: category,
              name: category
            }))
        );
      }
      
      if (data && data.subcategories) {
        setSubcategories(
          data.subcategories.map((subcategory) => ({
            id: subcategory,
            name: subcategory
          }))
        );
      }
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };
  
  const handleSearch = (e) => {
    e.preventDefault();
  };
  
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedSubcategory('all');
    setSelectedServiceCategory('All Services');
    setPriceRange({ min: '', max: '' });
    setEmissionReductionMin('');
    setSelectedImplementationTime('all');
  };
  
  // Parse service metadata
  const parseServiceMetadata = (metadata) => {
    if (!metadata) return {};
    if (typeof metadata === 'string') {
      try {
        return JSON.parse(metadata);
      } catch (e) {
        return {};
      }
    }
    return metadata;
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Carbon Reduction Solutions</h1>
        
        {currentUser && currentUser.role === 'solutionProvider' && (
          <Link 
            to="/marketplace/add-solution" 
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Add Your Solution
          </Link>
        )}
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button 
          className={`py-2 px-4 font-medium transition-colors ${
            selectedTab === 'products' 
              ? 'text-blue-600 border-b-2 border-blue-500' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setSelectedTab('products')}
        >
          Products
        </button>
        <button 
          className={`py-2 px-4 font-medium transition-colors ${
            selectedTab === 'services' 
              ? 'text-blue-600 border-b-2 border-blue-500' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setSelectedTab('services')}
        >
          Services
        </button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Filters Sidebar */}
        <div className="w-full md:w-1/4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Filter {selectedTab === 'products' ? 'Products' : 'Services'}</h2>
            
            <form onSubmit={handleSearch} className="mb-6">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="flex">
                <input
                  type="text"
                  id="search"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                  placeholder={`Search ${selectedTab}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button 
                  type="submit" 
                  className="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </form>
            
            {selectedTab === 'products' ? (
              <>
                {/* Product Filters */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categories
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="cat-all"
                        name="category"
                        value="all"
                        checked={selectedCategory === 'all'}
                        onChange={() => setSelectedCategory('all')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label htmlFor="cat-all" className="ml-2 text-sm text-gray-700">
                        All Categories
                      </label>
                    </div>
                    
                    {categories.map(category => (
                      <div key={category.id} className="flex items-center">
                        <input
                          type="radio"
                          id={`cat-${category.id}`}
                          name="category"
                          value={category.id}
                          checked={selectedCategory === category.id}
                          onChange={() => setSelectedCategory(category.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <label htmlFor={`cat-${category.id}`} className="ml-2 text-sm text-gray-700">
                          {category.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Price Range Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range
                  </label>
                  <div className="space-y-2">
                    <input
                      type="number"
                      placeholder="Min price"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      type="number"
                      placeholder="Max price"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                {/* Emission Reduction Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum CO₂ Reduction (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="e.g., 50"
                    value={emissionReductionMin}
                    onChange={(e) => setEmissionReductionMin(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </>
            ) : (
              <>
                {/* Service Filters */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Category
                  </label>
                  <div className="space-y-2">
                    {serviceCategories.map(category => (
                      <div key={category} className="flex items-center">
                        <input
                          type="radio"
                          id={`service-${category}`}
                          name="serviceCategory"
                          value={category}
                          checked={selectedServiceCategory === category}
                          onChange={() => setSelectedServiceCategory(category)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <label htmlFor={`service-${category}`} className="ml-2 text-sm text-gray-700">
                          {category}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
            
            <button
              onClick={resetFilters}
              className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
        
        {/* Main Content Grid */}
        <div className="w-full md:w-3/4">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <p className="font-semibold">Error</p>
              <p>{error}</p>
              <button 
                onClick={loadProducts} 
                className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-600 text-lg">No {selectedTab} found</p>
              <p className="text-gray-500 mt-2">Try adjusting your filters or search terms</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((item) => {
                const isService = item.entry_type === 'service';
                const serviceMetadata = isService ? parseServiceMetadata(item.service_metadata) : {};
                
                return (
                  <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
                    <Link to={`/marketplace/solution/${item.id}`}>
                      <div className="relative h-48 overflow-hidden">
                        <img 
                          src={getImageUrl(item.image_url)} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={handleImageError}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                      </div>
                    </Link>
                    
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                          isService ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {isService ? (item.subcategory || 'Service') : (item.category || 'Product')}
                        </span>
                        <Link 
                          to={`/profile/${item.user_id}`} 
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          {item.company_name || 'Unknown Vendor'}
                        </Link>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-1">
                        <Link to={`/marketplace/solution/${item.id}`} className="hover:text-green-600">
                          {item.name}
                        </Link>
                      </h3>
                      
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {item.description || 'No description available.'}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        {isService ? (
                          <>
                            {serviceMetadata.years_experience && (
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">{serviceMetadata.years_experience}</span> years exp.
                              </div>
                            )}
                            {serviceMetadata.availability && (
                              <div className="text-xs text-gray-500">
                                {serviceMetadata.availability.replace('_', ' ')}
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="flex items-center text-green-600">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M5 12l5 5L20 7" />
                              </svg>
                              <span className="font-semibold text-sm">
                                {item.emissions_reduction_factor ? 
                                  `${Math.round(item.emissions_reduction_factor * 100)}% reduction` : 
                                  'Reduction varies'}
                              </span>
                            </div>
                            
                            {item.implementation_time && (
                              <div className="text-xs text-gray-500 flex items-center">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                                {item.implementation_time}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketplacePage;