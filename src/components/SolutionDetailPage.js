// src/components/marketplace/SolutionDetailPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const SolutionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/marketplace/products/${id}`);
      setProduct(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching product details:', err);
      setError('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
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

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/marketplace')}
        className="mb-4 text-green-600 hover:text-green-800 flex items-center"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Marketplace
      </button>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/2">
            <img
              src={product.image_url || '/uploads/images/placeholder-project.jpg'}
              alt={product.name}
              className="w-full h-96 object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/uploads/images/placeholder-project.jpg';
              }}
            />
          </div>
          
          <div className="md:w-1/2 p-8">
            <div className="mb-4">
              <span className="inline-block px-3 py-1 text-sm bg-green-100 text-green-700 rounded-full">
                {product.category || 'Product'}
              </span>
              <span className="ml-2 text-gray-500">{product.company_name}</span>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-800 mb-4">{product.name}</h1>
            
            <p className="text-gray-600 mb-6">{product.description}</p>
            
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <span className="text-4xl font-bold text-green-600">
                  {product.emissions_reduction_factor ? 
                    `${Math.round(product.emissions_reduction_factor * 100)}%` : 
                    'N/A'}
                </span>
                <span className="ml-2 text-gray-600">emissions reduction</span>
              </div>
              
              {product.implementation_time && (
                <p className="text-gray-600">
                  Implementation time: {product.implementation_time}
                </p>
              )}
            </div>
            
            {product.unit_price && (
              <div className="mb-6">
                <p className="text-2xl font-semibold text-gray-800">
                  ${product.unit_price.toLocaleString()}
                  {product.unit && <span className="text-lg text-gray-600"> per {product.unit}</span>}
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              {product.user_id && (
                <Link 
                  to={`/providers/${product.user_id}`}
                  className="w-full px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  View Supplier Profile
                </Link>
              )}
              <button className="w-full px-6 py-3 border border-green-600 text-green-600 rounded hover:bg-green-50 transition">
                Contact Supplier
              </button>
              <button className="w-full px-6 py-3 border border-green-600 text-green-600 rounded hover:bg-green-50 transition">
                Add to Assessment
              </button>
            </div>
          </div>
        </div>
        
        {/* Additional details section */}
        <div className="border-t p-8">
          <h2 className="text-2xl font-semibold mb-4">Technical Details</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Key Features</h3>
              {product.features ? (
                <ul className="list-disc list-inside text-gray-600">
                  {Array.isArray(product.features) 
                    ? product.features.map((feature, idx) => (
                        <li key={idx}>{feature}</li>
                      ))
                    : <li>Features not specified</li>
                  }
                </ul>
              ) : (
                <ul className="list-disc list-inside text-gray-600">
                  <li>Feature 1</li>
                  <li>Feature 2</li>
                  <li>Feature 3</li>
                </ul>
              )}
            </div>
            <div>
              <h3 className="font-semibold mb-2">Applications</h3>
              {product.application_areas ? (
                <ul className="list-disc list-inside text-gray-600">
                  {Array.isArray(product.application_areas) 
                    ? product.application_areas.map((app, idx) => (
                        <li key={idx}>{app}</li>
                      ))
                    : <li>Applications not specified</li>
                  }
                </ul>
              ) : (
                <ul className="list-disc list-inside text-gray-600">
                  <li>Application 1</li>
                  <li>Application 2</li>
                  <li>Application 3</li>
                </ul>
              )}
            </div>
          </div>
          
          {product.specifications && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Specifications</h3>
              <div className="bg-gray-50 p-4 rounded">
                {typeof product.specifications === 'object' 
                  ? <pre className="text-sm text-gray-600">{JSON.stringify(product.specifications, null, 2)}</pre>
                  : <p className="text-gray-600">{product.specifications}</p>
                }
              </div>
            </div>
          )}
          
          {product.certifications && Array.isArray(product.certifications) && product.certifications.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Certifications</h3>
              <div className="flex flex-wrap gap-2">
                {product.certifications.map((cert, idx) => (
                  <span key={idx} className="inline-block px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full">
                    {cert}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SolutionDetailPage;