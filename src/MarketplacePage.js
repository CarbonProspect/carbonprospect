// MarketplacePage.js - Fixed version that works in both development and production
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthSystem';

// Dynamically set API base URL based on environment
const API_BASE = process.env.NODE_ENV === 'production' 
  ? '/api'  // In production, use relative path (same domain)
  : 'http://localhost:3001/api';  // In development, use localhost

// Alternative: Use environment variable if you have one set up
// const API_BASE = process.env.REACT_APP_API_URL || '/api';

const MarketplacePage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState('products');
  
  // New state for providers
  const [providers, setProviders] = useState([]);
  const [providerTypes, setProviderTypes] = useState([]);
  const [selectedProviderType, setSelectedProviderType] = useState('all');
  
  const { currentUser } = useAuth();
  
  // Load data based on selected tab
  useEffect(() => {
    if (selectedTab === 'products') {
      loadProducts();
      loadCategories();
    } else {
      loadProviders();
      loadProviderTypes();
    }
  }, [selectedTab, selectedCategory, searchTerm, selectedProviderType]);
  
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      // Use direct fetch to avoid proxy issues
      const url = `${API_BASE}/marketplace/products${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setProducts(data);
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
  }, [selectedCategory, searchTerm]);
  
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
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };
  
  const loadProviders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('entry_type', 'service_provider');
      
      if (selectedProviderType !== 'all') {
        params.append('provider_type', selectedProviderType);
      }
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      // Use direct fetch
      const url = `${API_BASE}/profiles/providers${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Handle both paginated and non-paginated responses
      if (data && data.providers && Array.isArray(data.providers)) {
        setProviders(data.providers);
      } else if (Array.isArray(data)) {
        setProviders(data);
      } else {
        console.warn('Unexpected providers response format:', data);
        setProviders([]);
      }
    } catch (err) {
      console.error('Error loading providers:', err);
      setError('Failed to load providers. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedProviderType, searchTerm]);
  
  const loadProviderTypes = async () => {
    // For now, hardcode the provider types
    const types = ['Financial', 'Auditor', 'Technology'];
    setProviderTypes(types.map(type => ({ id: type, name: type })));
  };
  
  const getProviderTypeStyle = (providerType) => {
    switch (providerType) {
      case 'Financial':
        return {
          border: 'border-l-4 border-green-500',
          badge: 'bg-green-100 text-green-700',
          text: 'text-green-700'
        };
      case 'Auditor':
        return {
          border: 'border-l-4 border-yellow-500',
          badge: 'bg-yellow-100 text-yellow-700',
          text: 'text-yellow-700'
        };
      case 'Technology':
        return {
          border: 'border-l-4 border-blue-500',
          badge: 'bg-blue-100 text-blue-700',
          text: 'text-blue-700'
        };
      default:
        return {
          border: 'border-l-4 border-purple-500',
          badge: 'bg-purple-100 text-purple-700',
          text: 'text-purple-700'
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
    } else {
      setSelectedProviderType('all');
    }
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
          Solution Providers
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
            ) : (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Provider Types
                </label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="type-all"
                      name="providerType"
                      value="all"
                      checked={selectedProviderType === 'all'}
                      onChange={() => setSelectedProviderType('all')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label htmlFor="type-all" className="ml-2 text-sm text-gray-700">
                      All Types
                    </label>
                  </div>
                  
                  {providerTypes.map(type => (
                    <div key={type.id} className="flex items-center">
                      <input
                        type="radio"
                        id={`type-${type.id}`}
                        name="providerType"
                        value={type.id}
                        checked={selectedProviderType === type.id}
                        onChange={() => setSelectedProviderType(type.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label htmlFor={`type-${type.id}`} className="ml-2 text-sm text-gray-700">
                        {type.name}
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
        
        {/* Products Grid */}
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
                onClick={selectedTab === 'products' ? loadProducts : loadProviders} 
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
                        src={product.image_url || '/uploads/images/placeholder-project.jpg'} 
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
            // Providers view
            providers.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600 text-lg">No solution providers found</p>
                <p className="text-gray-500 mt-2">Try adjusting your filters or search terms</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {providers.map((provider) => {
                  const style = getProviderTypeStyle(provider.provider_type || 'Technology');
                  return (
                    <Link 
                      to={`/providers/${provider.user_id}`} 
                      key={provider.id || provider.user_id}
                      className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 ${style.border}`}
                    >
                      <div className="relative h-48 overflow-hidden bg-gray-100">
                        <img 
                          src={provider.profile_image || '/uploads/images/placeholder-project.jpg'} 
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
                            {provider.provider_type || 'Technology'}
                          </span>
                          {provider.company_size && (
                            <span className="text-xs text-gray-500">
                              {provider.company_size}
                            </span>
                          )}
                        </div>
                        
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                          {provider.company_name}
                        </h3>
                        
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {provider.company_description || 'No description available.'}
                        </p>
                        
                        {provider.reduction_percentage && (
                          <div className="flex items-center mt-2">
                            <span className={`font-bold ${style.text}`}>
                              {provider.reduction_percentage}% reduction capability
                            </span>
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