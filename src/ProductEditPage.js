// src/components/marketplace/ProductEditPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ProductEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Form state matching the database structure
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    company_name: '',
    emissions_reduction_factor: '',
    implementation_time: '',
    unit_price: '',
    unit: '',
    image_url: '',
    features: [],
    application_areas: [],
    specifications: {},
    certifications: []
  });

  // Temporary state for array inputs
  const [featureInput, setFeatureInput] = useState('');
  const [applicationInput, setApplicationInput] = useState('');
  const [certificationInput, setCertificationInput] = useState('');
  const [specKey, setSpecKey] = useState('');
  const [specValue, setSpecValue] = useState('');
  
  // Image upload state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/marketplace/products/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const product = response.data;
      console.log('Fetched product:', product);
      
      // Parse JSON fields if they're strings
      let features = [];
      let applicationAreas = [];
      let specifications = {};
      let certifications = [];
      
      try {
        if (product.features) {
          features = typeof product.features === 'string' ? JSON.parse(product.features) : product.features;
        }
      } catch (e) {
        console.error('Error parsing features:', e);
      }
      
      try {
        if (product.application_areas) {
          applicationAreas = typeof product.application_areas === 'string' ? JSON.parse(product.application_areas) : product.application_areas;
        }
      } catch (e) {
        console.error('Error parsing application_areas:', e);
      }
      
      try {
        if (product.specifications) {
          specifications = typeof product.specifications === 'string' ? JSON.parse(product.specifications) : product.specifications;
        }
      } catch (e) {
        console.error('Error parsing specifications:', e);
      }
      
      try {
        if (product.certifications) {
          certifications = typeof product.certifications === 'string' ? JSON.parse(product.certifications) : product.certifications;
        }
      } catch (e) {
        console.error('Error parsing certifications:', e);
      }
      
      // Populate form with existing data
      setFormData({
        name: product.name || '',
        description: product.description || '',
        category: product.category || '',
        company_name: product.company_name || '',
        emissions_reduction_factor: product.emissions_reduction_factor || '',
        implementation_time: product.implementation_time || '',
        unit_price: product.unit_price || '',
        unit: product.unit || '',
        image_url: product.image_url || '',
        features: Array.isArray(features) ? features : [],
        application_areas: Array.isArray(applicationAreas) ? applicationAreas : [],
        specifications: typeof specifications === 'object' && specifications !== null ? specifications : {},
        certifications: Array.isArray(certifications) ? certifications : []
      });
      
      // Set image preview if product has image
      if (product.image_url) {
        setImagePreview(product.image_url);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching product details:', err);
      setError('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNumberInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value ? parseFloat(value) : ''
    }));
  };
  
  // Handle image file upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      
      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        // Clear the URL field since we're using file upload
        setFormData(prev => ({ ...prev, image_url: '' }));
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };
  
  // Handle URL change
  const handleImageUrlChange = (e) => {
    const url = e.target.value;
    setFormData(prev => ({ ...prev, image_url: url }));
    if (url) {
      setImagePreview(url);
      setImageFile(null); // Clear file if URL is entered
    } else {
      setImagePreview('');
    }
  };

  // Array management functions
  const addFeature = () => {
    if (featureInput.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, featureInput.trim()]
      }));
      setFeatureInput('');
    }
  };

  const removeFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const addApplication = () => {
    if (applicationInput.trim()) {
      setFormData(prev => ({
        ...prev,
        application_areas: [...prev.application_areas, applicationInput.trim()]
      }));
      setApplicationInput('');
    }
  };

  const removeApplication = (index) => {
    setFormData(prev => ({
      ...prev,
      application_areas: prev.application_areas.filter((_, i) => i !== index)
    }));
  };

  const addCertification = () => {
    if (certificationInput.trim()) {
      setFormData(prev => ({
        ...prev,
        certifications: [...prev.certifications, certificationInput.trim()]
      }));
      setCertificationInput('');
    }
  };

  const removeCertification = (index) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  const addSpecification = () => {
    if (specKey.trim() && specValue.trim()) {
      setFormData(prev => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          [specKey.trim()]: specValue.trim()
        }
      }));
      setSpecKey('');
      setSpecValue('');
    }
  };

  const removeSpecification = (key) => {
    setFormData(prev => {
      const newSpecs = { ...prev.specifications };
      delete newSpecs[key];
      return {
        ...prev,
        specifications: newSpecs
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage('');

    try {
      let finalImageUrl = formData.image_url;
      
      // If there's an image file to upload
      if (imageFile) {
        const formDataUpload = new FormData();
        formDataUpload.append('image', imageFile);
        
        try {
          const uploadResponse = await axios.post('/api/uploads/images', formDataUpload, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'multipart/form-data'
            }
          });
          
          finalImageUrl = uploadResponse.data.imageUrl;
        } catch (uploadErr) {
          console.error('Image upload failed:', uploadErr);
          // Continue with update even if image upload fails
          setError('Image upload failed, but continuing with other updates...');
        }
      }
      
      // Prepare data for submission
      const submitData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        company_name: formData.company_name,
        emissions_reduction_factor: formData.emissions_reduction_factor ? parseFloat(formData.emissions_reduction_factor) : null,
        implementation_time: formData.implementation_time,
        unit_price: formData.unit_price ? parseFloat(formData.unit_price) : null,
        unit: formData.unit,
        image_url: finalImageUrl,
        features: formData.features,
        specifications: formData.specifications,
        application_areas: formData.application_areas,
        certifications: formData.certifications
      };

      console.log('Submitting data:', submitData);

      const response = await axios.put(`/api/products/${id}`, submitData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Update response:', response.data);
      setSuccessMessage('Product updated successfully!');
      
      // Redirect after a brief delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      
    } catch (err) {
      console.error('Error updating product:', err);
      setError(err.response?.data?.message || 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error && !formData.name) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            {error}
          </h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/dashboard')}
        className="mb-4 text-green-600 hover:text-green-800 flex items-center"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Dashboard
      </button>

      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Edit Product</h1>

        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Renewable Energy, Energy Efficiency"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Image
                </label>
                
                <div className="space-y-4">
                  {/* File Upload Option */}
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Upload an image:</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">Max size: 5MB. Supported: JPEG, PNG, GIF, WebP</p>
                  </div>
                  
                  {/* OR Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">OR</span>
                    </div>
                  </div>
                  
                  {/* URL Input Option */}
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Enter image URL:</label>
                    <input
                      type="url"
                      name="image_url"
                      value={formData.image_url}
                      onChange={handleImageUrlChange}
                      placeholder="https://example.com/image.jpg"
                      disabled={!!imageFile}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${imageFile ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    />
                    {imageFile && (
                      <p className="text-xs text-gray-500 mt-1">Clear the uploaded file to use URL instead</p>
                    )}
                  </div>
                  
                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">Preview:</p>
                      <div className="relative w-full max-w-md h-64 bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={imagePreview}
                          alt="Product preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/uploads/images/placeholder-project.jpg';
                            if (formData.image_url) {
                              setError('Failed to load image from URL');
                            }
                          }}
                        />
                        {imageFile && (
                          <button
                            type="button"
                            onClick={() => {
                              setImageFile(null);
                              setImagePreview(formData.image_url || '');
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Impact & Pricing */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold mb-4">Impact & Pricing</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emissions Reduction Factor (0-1)
                </label>
                <input
                  type="number"
                  name="emissions_reduction_factor"
                  value={formData.emissions_reduction_factor}
                  onChange={handleNumberInputChange}
                  min="0"
                  max="1"
                  step="0.01"
                  placeholder="e.g., 0.75 for 75% reduction"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Implementation Time
                </label>
                <input
                  type="text"
                  name="implementation_time"
                  value={formData.implementation_time}
                  onChange={handleInputChange}
                  placeholder="e.g., 3-6 months"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit Price ($)
                </label>
                <input
                  type="number"
                  name="unit_price"
                  value={formData.unit_price}
                  onChange={handleNumberInputChange}
                  min="0"
                  step="0.01"
                  placeholder="e.g., 1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit
                </label>
                <input
                  type="text"
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  placeholder="e.g., unit, kW, m²"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold mb-4">Key Features</h2>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                placeholder="Add a feature"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                type="button"
                onClick={addFeature}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Add
              </button>
            </div>

            <div className="space-y-2">
              {formData.features.map((feature, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                  <span>{feature}</span>
                  <button
                    type="button"
                    onClick={() => removeFeature(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Applications */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold mb-4">Application Areas</h2>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={applicationInput}
                onChange={(e) => setApplicationInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addApplication())}
                placeholder="Add an application area"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                type="button"
                onClick={addApplication}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Add
              </button>
            </div>

            <div className="space-y-2">
              {formData.application_areas.map((app, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                  <span>{app}</span>
                  <button
                    type="button"
                    onClick={() => removeApplication(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Specifications */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold mb-4">Technical Specifications</h2>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={specKey}
                onChange={(e) => setSpecKey(e.target.value)}
                placeholder="Specification name"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <input
                type="text"
                value={specValue}
                onChange={(e) => setSpecValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecification())}
                placeholder="Value"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                type="button"
                onClick={addSpecification}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Add
              </button>
            </div>

            <div className="space-y-2">
              {Object.entries(formData.specifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                  <span><strong>{key}:</strong> {value}</span>
                  <button
                    type="button"
                    onClick={() => removeSpecification(key)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Certifications */}
          <div className="pb-6">
            <h2 className="text-xl font-semibold mb-4">Certifications</h2>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={certificationInput}
                onChange={(e) => setCertificationInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
                placeholder="Add a certification"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                type="button"
                onClick={addCertification}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {formData.certifications.map((cert, index) => (
                <span key={index} className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                  {cert}
                  <button
                    type="button"
                    onClick={() => removeCertification(index)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductEditPage;