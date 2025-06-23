// MarketplacePage.js - Updated with multiple category selection
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthSystem';

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
  const [selectedTab, setSelectedTab] = useState('products');
  
  // New state for service providers - UPDATED for multiple selection
  const [providers, setProviders] = useState([]);
  const [providerCategories, setProviderCategories] = useState([]);
  const [selectedProviderCategories, setSelectedProviderCategories] = useState([]); // Changed to array
  
  // Additional filter states for products
  const [subcategories, setSubcategories] = useState([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [emissionReductionMin, setEmissionReductionMin] = useState('');
  const [selectedImplementationTime, setSelectedImplementationTime] = useState('all');
  
  const { currentUser } = useAuth();
  
  // Load data based on selected tab
  useEffect(() => {
    if (selectedTab === 'products') {
      loadProducts();
      loadCategories();
    } else {
      loadServiceProviders();
      loadProviderCategories();
    }
  }, [selectedTab, selectedCategory, selectedSubcategory, searchTerm, selectedProviderCategories, priceRange, emissionReductionMin, selectedImplementationTime]); // Updated dependency
  
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      if (selectedSubcategory !== 'all') {
        params.append('subcategory', selectedSubcategory);
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
        // Apply client-side filters for price and emission reduction
        let filteredProducts = data;
        
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
        
        setProducts(filteredProducts);
      } else {
        console.warn('Unexpected response format:', data);
        setError('Unexpected data format from server');
      }
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedSubcategory, searchTerm, priceRange, emissionReductionMin, selectedImplementationTime]);
  
  const loadCategories = async () => {
    try {
      const response = await fetch(`${API_BASE}/marketplace/options`);
      const data = await response.json();
      
      if (data && data.categories) {
        setCategories(
          data.categories.map((category) => ({
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
  
  const loadServiceProviders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const params = new URLSearchParams();
      
      // Handle multiple provider categories
      if (selectedProviderCategories.length > 0) {
        selectedProviderCategories.forEach(catId => {
          params.append('provider_type', catId);
        });
      }
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      // Use service-providers endpoint
      const url = `${API_BASE}/service-providers${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setProviders(data);
      } else {
        console.warn('Unexpected providers response format:', data);
        setProviders([]);
      }
    } catch (err) {
      console.error('Error loading service providers:', err);
      setError('Failed to load service providers. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedProviderCategories, searchTerm]); // Updated dependency
  
  const loadProviderCategories = async () => {
    try {
      // Get the flat list of categories for the filter
      const response = await fetch(`${API_BASE}/service-providers/categories/flat`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setProviderCategories(data);
    } catch (err) {
      console.error('Error loading provider categories:', err);
      // Fallback to basic categories if API fails
      setProviderCategories([]);
    }
  };
  
  const getProviderCategoryStyle = (categoryId) => {
    // Map category IDs to styles based on parent category
    if ([7, 8, 9, 10, 11].includes(parseInt(categoryId))) {
      // Core Carbon Project Consultants
      return {
        border: 'border-l-4 border-green-500',
        badge: 'bg-green-100 text-green-700',
        text: 'text-green-700'
      };
    } else if ([12, 13, 14, 15].includes(parseInt(categoryId))) {
      // Financial & Trading Services
      return {
        border: 'border-l-4 border-yellow-500',
        badge: 'bg-yellow-100 text-yellow-700',
        text: 'text-yellow-700'
      };
    } else if ([16, 17, 18, 19].includes(parseInt(categoryId))) {
      // Technical Specialists
      return {
        border: 'border-l-4 border-blue-500',
        badge: 'bg-blue-100 text-blue-700',
        text: 'text-blue-700'
      };
    } else if ([20, 21, 22].includes(parseInt(categoryId))) {
      // Legal & Regulatory
      return {
        border: 'border-l-4 border-red-500',
        badge: 'bg-red-100 text-red-700',
        text: 'text-red-700'
      };
    } else if ([23, 24, 25, 26, 27].includes(parseInt(categoryId))) {
      // Regional & Standards
      return {
        border: 'border-l-4 border-purple-500',
        badge: 'bg-purple-100 text-purple-700',
        text: 'text-purple-700'
      };
    } else {
      // Support Services
      return {
        border: 'border-l-4 border-gray-500',
        badge: 'bg-gray-100 text-gray-700',
        text: 'text-gray-700'
      };
    }
  };
  
  const handleSearch = (e) => {
    e.preventDefault();
  };
  
  const resetFilters = () => {
    setSearchTerm('');
    if (selectedTab === 'products') {
      setSelectedCategory('all');
      setSelectedSubcategory('all');
      setPriceRange({ min: '', max: '' });
      setEmissionReductionMin('');
      setSelectedImplementationTime('all');
    } else {
      setSelectedProviderCategories([]); // Reset to empty array for multiple selection
    }
  };
  
  // Helper function to fix image URLs
  const getSecureImageUrl = (imageUrl) => {
    if (!imageUrl) return '/uploads/images/placeholder-project.jpg';
    
    if (imageUrl.startsWith('http://localhost:3001')) {
      return imageUrl.replace('http://localhost:3001', '');
    }
    
    if (imageUrl.startsWith('/')) {
      return imageUrl;
    }
    
    if (imageUrl.startsWith('http://')) {
      return imageUrl.replace('http://', 'https://');
    }
    
    return imageUrl;
  };
  
  // Parse JSONB fields safely
  const parseJsonField = (field, defaultValue = []) => {
    if (!field) return defaultValue;
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch (e) {
        return defaultValue;
      }
    }
    return field;
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Carbon Reduction Solutions</h1>
        
        {currentUser && currentUser.role === 'solutionProvider' && (
          <Link 
            to="/service-providers/new" 
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Become a Service Provider
          </Link>
        )}
      </div>
      
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
            selectedTab === 'providers' 
              ? 'text-blue-600 border-b-2 border-blue-500' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setSelectedTab('providers')}
        >
          Service Providers
        </button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Filters Sidebar */}
        <div className="w-full md:w-1/4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Filter Solutions</h2>
            
            <form onSubmit={handleSearch} className="mb-6">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="flex">
                <input
                  type="text"
                  id="search"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                  placeholder="Search solutions..."
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
                
                {/* Subcategory Filter */}
                {subcategories.length > 0 && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subcategories
                    </label>
                    <select
                      value={selectedSubcategory}
                      onChange={(e) => setSelectedSubcategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Subcategories</option>
                      {subcategories.map(subcat => (
                        <option key={subcat.id} value={subcat.id}>
                          {subcat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
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
                
                {/* Implementation Time Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Implementation Time
                  </label>
                  <select
                    value={selectedImplementationTime}
                    onChange={(e) => setSelectedImplementationTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Any timeframe</option>
                    <option value="immediate">Immediate</option>
                    <option value="short">1-2 months</option>
                    <option value="medium">3-6 months</option>
                    <option value="long">1+ years</option>
                  </select>
                </div>
              </>
            ) : (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Categories (Select multiple)
                </label>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  <div className="flex items-center justify-between mb-2">
                    <button
                      type="button"
                      onClick={() => setSelectedProviderCategories([])}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Clear all
                    </button>
                    {selectedProviderCategories.length > 0 && (
                      <span className="text-sm text-gray-500">
                        ({selectedProviderCategories.length} selected)
                      </span>
                    )}
                  </div>
                  
                  {providerCategories.map(category => (
                    <div key={category.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`pcat-${category.id}`}
                        value={category.id}
                        checked={selectedProviderCategories.includes(category.id.toString())}
                        onChange={(e) => {
                          const categoryId = category.id.toString();
                          if (e.target.checked) {
                            setSelectedProviderCategories([...selectedProviderCategories, categoryId]);
                          } else {
                            setSelectedProviderCategories(selectedProviderCategories.filter(id => id !== categoryId));
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`pcat-${category.id}`} className="ml-2 text-sm text-gray-700 flex-1 cursor-pointer">
                        <span className="font-medium">{category.category_name}</span>
                        {category.parent_category_name && (
                          <span className="text-xs text-gray-500 block">
                            {category.parent_category_name}
                          </span>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
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
                onClick={selectedTab === 'products' ? loadProducts : loadServiceProviders} 
                className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : selectedTab === 'products' ? (
            products.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600 text-lg">No products found</p>
                <p className="text-gray-500 mt-2">Try adjusting your filters or search terms</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <Link 
                    to={`/marketplace/solution/${product.id}`} 
                    key={product.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={getSecureImageUrl(product.image_url)} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/uploads/images/placeholder-project.jpg';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    </div>
                    
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold bg-green-100 text-green-700 px-3 py-1 rounded-full">
                          {product.category || 'Product'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {product.company_name || 'Unknown Vendor'}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-1">
                        {product.name}
                      </h3>
                      
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {product.description || 'No description available.'}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-green-600">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M5 12l5 5L20 7" />
                          </svg>
                          <span className="font-semibold text-sm">
                            {product.emissions_reduction_factor ? 
                              `${Math.round(product.emissions_reduction_factor * 100)}% reduction` : 
                              'Reduction varies'}
                          </span>
                        </div>
                        
                        {product.implementation_time && (
                          <div className="text-xs text-gray-500 flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            {product.implementation_time}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )
          ) : (
            // Service Providers view
            providers.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600 text-lg">No service providers found</p>
                <p className="text-gray-500 mt-2">Try adjusting your filters or search terms</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {providers.map((provider) => {
                  const style = getProviderCategoryStyle(provider.provider_type);
                  const specializations = parseJsonField(provider.specializations, []);
                  const certifications = parseJsonField(provider.certifications, []);
                  const regions = parseJsonField(provider.regions_served, []);
                  
                  return (
                    <Link 
                      to={`/service-providers/${provider.id}`} 
                      key={provider.id}
                      className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 ${style.border}`}
                    >
                      <div className="relative h-48 overflow-hidden bg-gray-100">
                        <img 
                          src={getSecureImageUrl(provider.image_url)} 
                          alt={provider.company_name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/uploads/images/placeholder-project.jpg';
                          }}
                        />
                      </div>
                      
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${style.badge}`}>
                            {provider.primary_provider_category_name || 'Service Provider'}
                          </span>
                          {provider.team_size && (
                            <span className="text-xs text-gray-500">
                              {provider.team_size}
                            </span>
                          )}
                        </div>
                        
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                          {provider.company_name}
                        </h3>
                        
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {provider.description || 'No description available.'}
                        </p>
                        
                        {specializations.length > 0 && (
                          <div className="mb-2">
                            <div className="flex flex-wrap gap-1">
                              {specializations.slice(0, 3).map((spec, index) => (
                                <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                  {spec}
                                </span>
                              ))}
                              {specializations.length > 3 && (
                                <span className="text-xs text-gray-500">
                                  +{specializations.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {provider.years_experience && (
                          <div className="flex items-center text-sm text-gray-700">
                            <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {provider.years_experience} years experience
                          </div>
                        )}
                        
                        {provider.pricing_model && (
                          <div className="flex items-center mt-1 text-sm text-gray-700">
                            <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {provider.pricing_model}
                            {provider.hourly_rate_min && provider.hourly_rate_max && (
                              <span className="ml-1">
                                ${provider.hourly_rate_min}-${provider.hourly_rate_max}/hr
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketplacePage;