// ProductDetailPage.js - Display product details from marketplace
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthSystem';
import api from '../api-config';

// Dynamically set API base URL based on environment
const API_BASE = process.env.NODE_ENV === 'production' 
  ? '/api'  // In production, use relative path (same domain)
  : 'http://localhost:3001/api';  // In development, use localhost

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  
  useEffect(() => {
    fetchProductDetails();
    checkIfProductSaved();
  }, [id]);

  useEffect(() => {
    // Fetch related products after the main product is loaded
    if (product) {
      fetchRelatedProducts();
      trackProductView();
    }
  }, [product]);
  
  // Track product view
  const trackProductView = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Add auth header if user is logged in
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      await fetch(`${API_BASE}/analytics/product/${id}/view`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          referrer: document.referrer || 'direct'
        })
      });
    } catch (error) {
      // Silently fail - don't disrupt user experience
      console.error('Failed to track product view:', error);
    }
  };
  
  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/marketplace/products/${id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setProduct(data);
    } catch (err) {
      console.error('Error fetching product details:', err);
      setError('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const checkIfProductSaved = async () => {
    if (!currentUser) return;
    
    try {
      const response = await fetch(`${API_BASE}/marketplace/saved`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const savedProducts = await response.json();
        const isSavedProduct = savedProducts.some(p => p.id === id);
        setIsSaved(isSavedProduct);
      }
    } catch (err) {
      console.error('Error checking saved status:', err);
    }
  };

  const handleSaveProduct = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    setSavingProduct(true);
    
    try {
      const method = isSaved ? 'DELETE' : 'POST';
      const response = await fetch(`${API_BASE}/marketplace/save/${id}`, {
        method: method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setIsSaved(!isSaved);
      } else {
        const error = await response.json();
        console.error('Error saving product:', error);
      }
    } catch (err) {
      console.error('Error saving product:', err);
    } finally {
      setSavingProduct(false);
    }
  };

  const fetchRelatedProducts = async () => {
    try {
      // Wait for product to be loaded first
      if (!product) return;
      
      // Fetch all products
      const response = await fetch(`${API_BASE}/marketplace/products`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Filter for products that match either category or subcategory
      const related = data.filter(p => {
        // Exclude current product
        if (p.id === id) return false;
        
        // Priority 1: Same subcategory (most relevant)
        if (product.subcategory && p.subcategory === product.subcategory) {
          return true;
        }
        
        // Priority 2: Same category
        if (p.category === product.category) {
          return true;
        }
        
        return false;
      })
      .sort((a, b) => {
        // Sort by relevance: same subcategory first
        if (product.subcategory) {
          const aMatchesSubcategory = a.subcategory === product.subcategory;
          const bMatchesSubcategory = b.subcategory === product.subcategory;
          if (aMatchesSubcategory && !bMatchesSubcategory) return -1;
          if (!aMatchesSubcategory && bMatchesSubcategory) return 1;
        }
        return 0;
      })
      .slice(0, 3); // Get first 3 related products
      
      setRelatedProducts(related);
    } catch (err) {
      console.error('Error fetching related products:', err);
    }
  };
  
  // Parse JSON fields safely
  const parseJsonField = (field, defaultValue = null) => {
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
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }
  
  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            {error || 'Product not found'}
          </h2>
          <button
            onClick={() => navigate('/marketplace')}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }
  
  // Parse complex fields
  const features = parseJsonField(product.features, []);
  const specifications = parseJsonField(product.specifications, {});
  const applicationAreas = parseJsonField(product.application_areas, []);
  const certifications = parseJsonField(product.certifications, []);
  const implementationGuidance = parseJsonField(product.implementation_guidance, {});
  
  // Check if the current user owns this product
  const isOwner = currentUser && currentUser.id === product.user_id;
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <div className="flex items-center text-sm text-gray-500 mb-6">
        <Link to="/marketplace" className="hover:text-green-600">Marketplace</Link>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mx-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span>Products</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mx-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-700">{product.name}</span>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Images */}
        <div>
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="relative h-96">
              <img 
                src={getSecureImageUrl(product.image_url)} 
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/uploads/images/placeholder-project.jpg';
                }}
              />
              {product.emissions_reduction_factor && product.emissions_reduction_factor > 0 && (
                <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  {Math.round(product.emissions_reduction_factor * 100)}% CO₂ Reduction
                </div>
              )}
            </div>
          </div>
          
          {/* Product Info Cards */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            {/* Environmental Impact Card */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-600">Environmental Impact</h4>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="space-y-2">
                {product.emissions_reduction_factor ? (
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {Math.round(product.emissions_reduction_factor * 100)}%
                    </p>
                    <p className="text-xs text-gray-500">CO₂ Reduction</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Impact varies by application</p>
                )}
                {product.annual_co2_savings && (
                  <p className="text-xs text-gray-600 mt-1">
                    ~{product.annual_co2_savings.toLocaleString()} tons CO₂/year
                  </p>
                )}
              </div>
            </div>

            {/* Product Type Card */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-600">Product Type</h4>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <p className="text-sm font-medium">{product.material_type || product.entry_type || 'Solution'}</p>
              {product.unit && (
                <p className="text-xs text-gray-500 mt-1">Sold per {product.unit}</p>
              )}
              {product.minimum_order && (
                <p className="text-xs text-gray-600 mt-1">Min. order: {product.minimum_order} {product.unit}</p>
              )}
            </div>
          </div>

          {/* Company Information Card */}
          <div className="mt-4 bg-white rounded-lg shadow p-4">
            <h4 className="text-sm font-semibold text-gray-600 mb-3">Company Information</h4>
            <div className="space-y-2">
              {(product.provider_company_name || product.company_name) && (
                <div>
                  <p className="text-sm font-medium">{product.provider_company_name || product.company_name}</p>
                  {product.provider_name && (
                    <p className="text-xs text-gray-500">Contact: {product.provider_name}</p>
                  )}
                </div>
              )}
              
              {/* Location Information */}
              {(product.headquarters_city || product.headquarters_country) && (
                <div className="border-t pt-2">
                  <p className="text-xs text-gray-600 mb-1">Location</p>
                  <p className="text-sm">
                    {[product.headquarters_city, product.headquarters_country]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>
              )}
              
              {/* Company Size */}
              {product.company_size && (
                <div className="border-t pt-2">
                  <p className="text-xs text-gray-600 mb-1">Company Size</p>
                  <p className="text-sm">{product.company_size}</p>
                </div>
              )}
              
              {/* Founded Year */}
              {product.founded_year && (
                <div className="border-t pt-2">
                  <p className="text-xs text-gray-600 mb-1">Founded</p>
                  <p className="text-sm">{product.founded_year}</p>
                </div>
              )}
              
              {/* Website */}
              {product.website && (
                <div className="border-t pt-2">
                  <p className="text-xs text-gray-600 mb-1">Website</p>
                  <a 
                    href={product.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {product.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              
              {/* View Provider Profile Link */}
              {(product.provider_id || product.user_id) && (
                <div className="border-t pt-3 mt-3">
                  <Link 
                    to={`/profiles/${product.provider_id || product.user_id}`}
                    className="inline-flex items-center px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors w-full justify-center text-sm font-medium"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    View Company Profile
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Right Column - Product Details */}
        <div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold bg-green-100 text-green-700 px-3 py-1 rounded-full">
                  {product.category}
                </span>
                <div className="flex items-center gap-2">
                  {product.subcategory && (
                    <span className="text-sm text-gray-500">
                      {product.subcategory}
                    </span>
                  )}
                  {/* Save Button */}
                  {!isOwner && (
                    <button
                      onClick={handleSaveProduct}
                      disabled={savingProduct}
                      className={`inline-flex items-center px-3 py-1.5 border rounded-lg text-sm font-medium transition-colors ${
                        isSaved 
                          ? 'border-green-500 text-green-600 bg-green-50 hover:bg-green-100' 
                          : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                      } ${savingProduct ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`h-4 w-4 mr-1.5 ${isSaved ? 'fill-current' : ''}`} 
                        fill={isSaved ? "currentColor" : "none"} 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" 
                        />
                      </svg>
                      {savingProduct ? 'Saving...' : (isSaved ? 'Saved' : 'Save')}
                    </button>
                  )}
                </div>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              
              <div className="flex items-center text-gray-600 mb-4">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span>{product.company_name || product.provider_company_name || 'Unknown Provider'}</span>
              </div>
              
              <p className="text-gray-700 mb-4">{product.description}</p>
              
              {/* Price and Unit Info */}
              {product.unit_price && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Price</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ${product.unit_price.toLocaleString()}
                        {product.unit && <span className="text-base font-normal text-gray-600"> / {product.unit}</span>}
                      </p>
                    </div>
                    {product.implementation_time && (
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Implementation Time</p>
                        <p className="font-semibold">{product.implementation_time}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Payback Period and Cost Savings */}
                  {(product.payback_period || product.cost_savings_potential) && (
                    <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-2 gap-4">
                      {product.payback_period && (
                        <div>
                          <p className="text-sm text-gray-600">Payback Period</p>
                          <p className="font-semibold">{product.payback_period}</p>
                        </div>
                      )}
                      {product.cost_savings_potential && (
                        <div>
                          <p className="text-sm text-gray-600">Cost Savings</p>
                          <p className="font-semibold text-green-600">
                            ${product.cost_savings_potential.toLocaleString()}/year
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Action Buttons - Only for owners */}
              {isOwner && (
                <div className="flex gap-3 mb-6">
                  <Link
                    to={`/marketplace/product/edit/${id}`}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center"
                  >
                    Edit Product
                  </Link>
                  <Link
                    to="/dashboard"
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-center"
                  >
                    View Dashboard
                  </Link>
                </div>
              )}
              
              {/* Quick Stats Bar */}
              <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-blue-50 rounded-lg">
                <div className="text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto mb-1 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <p className="text-xs text-gray-600">Verified Solution</p>
                </div>
                <div className="text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto mb-1 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <p className="text-xs text-gray-600">High Impact</p>
                </div>
                <div className="text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto mb-1 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs text-gray-600">Quick ROI</p>
                </div>
              </div>
              
              {/* Key Features */}
              {features.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Key Features</h3>
                  <ul className="space-y-2">
                    {features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Application Areas */}
              {applicationAreas.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Application Areas</h3>
                  <div className="flex flex-wrap gap-2">
                    {applicationAreas.map((area, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Certifications */}
              {certifications.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Certifications</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {certifications.map((cert, index) => (
                      <div key={index} className="flex items-center">
                        <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">{cert}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Technical Specifications */}
          {Object.keys(specifications).length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
              <h3 className="text-lg font-semibold mb-4">Technical Specifications</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(specifications).map(([key, value], index) => (
                  <div key={index} className="border-b pb-2">
                    <p className="text-sm text-gray-600">{key}</p>
                    <p className="font-semibold text-gray-900">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Implementation Guidance */}
          {Object.keys(implementationGuidance).length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
              <h3 className="text-lg font-semibold mb-4">Implementation Guidance</h3>
              <div className="space-y-4">
                {Object.entries(implementationGuidance).map(([phase, details], index) => (
                  <div key={index}>
                    <h4 className="font-medium text-gray-900 mb-2">{phase}</h4>
                    <p className="text-gray-700 pl-4">{details}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Related Products Section */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Related Products</h2>
          <Link 
            to={`/marketplace?category=${product.category}`}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
          >
            View all in {product.category}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        
        {relatedProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <Link 
                key={relatedProduct.id}
                to={`/marketplace/solution/${relatedProduct.id}`}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 group"
              >
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={getSecureImageUrl(relatedProduct.image_url)} 
                    alt={relatedProduct.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/uploads/images/placeholder-project.jpg';
                    }}
                  />
                  {/* Show if it's the same subcategory */}
                  {product.subcategory && relatedProduct.subcategory === product.subcategory && (
                    <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs">
                      Same Type
                    </div>
                  )}
                  {relatedProduct.emissions_reduction_factor && (
                    <div className="absolute bottom-2 right-2 bg-green-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                      {Math.round(relatedProduct.emissions_reduction_factor * 100)}% CO₂ ↓
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      {relatedProduct.category}
                    </span>
                    {relatedProduct.subcategory && (
                      <span className="text-xs text-gray-500">
                        {relatedProduct.subcategory}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-1 line-clamp-1">
                    {relatedProduct.name}
                  </h3>
                  <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                    {relatedProduct.description}
                  </p>
                  <div className="flex items-center justify-between">
                    {relatedProduct.unit_price ? (
                      <p className="text-lg font-bold text-gray-900">
                        ${relatedProduct.unit_price.toLocaleString()}
                        {relatedProduct.unit && <span className="text-sm font-normal"> / {relatedProduct.unit}</span>}
                      </p>
                    ) : (
                      <span className="text-sm text-gray-500">Contact for pricing</span>
                    )}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-gray-100 rounded-lg p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-gray-600 mb-4">No related products found in this category.</p>
            <Link 
              to="/marketplace"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Browse All Products
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;