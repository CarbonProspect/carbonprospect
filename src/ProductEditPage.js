// src/components/marketplace/ProductEditPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Use relative URLs when proxy is configured
const API_BASE = '/api';  // This will work with the proxy in package.json

const ProductEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Determine if this is a product or service
  const [entryType, setEntryType] = useState('product');
  
  // Product form data
  const [productFormData, setProductFormData] = useState({
    name: '',
    description: '',
    category: 'Construction',
    subcategory: '',
    emissions_reduction_factor: '',
    implementation_time: 'Implementation time varies',
    image_url: '',
    unit_price: '',
    unit: '',
    material_type: '',
    implementation_guidance: {
      steps: [],
      requirements: [],
      timeline: ''
    },
    pricing_model: 'per_unit'
  });
  
  // Service form data
  const [serviceFormData, setServiceFormData] = useState({
    service_category: '',
    name: '',
    description: '',
    specializations: [],
    certifications: [],
    regions_served: [],
    industries_served: [],
    pricing_model: '',
    hourly_rate_min: '',
    hourly_rate_max: '',
    project_minimum: '',
    languages: [],
    availability: 'scheduled',
    response_time: '24-48 hours',
    image_url: ''
  });
  
  // Company data
  const [companyData, setCompanyData] = useState({
    company_name: ''
  });
  
  // Input states for service array fields
  const [specializationInput, setSpecializationInput] = useState('');
  const [certificationInput, setCertificationInput] = useState('');
  const [regionInput, setRegionInput] = useState('');
  const [industryInput, setIndustryInput] = useState('');
  const [languageInput, setLanguageInput] = useState('');
  
  // Constants from AddSolutionForm
  const MATERIAL_TYPES = {
    'Construction': ['Steel', 'Concrete', 'Wood', 'Aluminum', 'Glass', 'Copper', 'Insulation', 'Other'],
    'Construction Materials': ['Steel', 'Concrete', 'Wood', 'Aluminum', 'Glass', 'Copper', 'Insulation', 'Other'],
    'Green Materials': ['Recycled', 'Bio-based', 'Low-carbon', 'Zero-carbon', 'Other'],
    'Agricultural': ['Soil Amendment', 'Fertilizer', 'Seeds', 'Irrigation', 'Equipment', 'Other'],
    'Coastal': ['Erosion Control', 'Habitat Restoration', 'Water Quality', 'Other'],
    'Forest Management': ['Reforestation', 'Conservation', 'Sustainable Harvesting', 'Fire Management', 'Other'],
    'Forest Protection': ['Monitoring', 'Conservation', 'Restoration', 'Fire Prevention', 'Other'],
    'Green Energy': ['Solar', 'Wind', 'Hydro', 'Geothermal', 'Biomass', 'Storage', 'Other'],
    'Livestock': ['Feed Additives', 'Waste Management', 'Methane Capture', 'Grazing Management', 'Other'],
    'Smart Building': ['HVAC', 'Lighting', 'Insulation', 'Building Management Systems', 'Other']
  };
  
  const UNIT_OPTIONS = {
    'Construction': ['m²', 'm³', 'tonnes', 'kg', 'units', 'other'],
    'Construction Materials': ['m²', 'm³', 'tonnes', 'kg', 'units', 'other'],
    'Green Materials': ['m²', 'm³', 'tonnes', 'kg', 'units', 'other'],
    'Agricultural': ['hectares', 'acres', 'kg', 'tonnes', 'units', 'other'],
    'Coastal': ['km', 'm²', 'hectares', 'units', 'other'],
    'Forest Management': ['hectares', 'acres', 'tonnes', 'trees', 'other'],
    'Forest Protection': ['hectares', 'acres', 'tonnes', 'trees', 'other'],
    'Green Energy': ['kW', 'MW', 'kWh', 'MWh', 'units', 'other'],
    'Livestock': ['animals', 'kg', 'tonnes', 'units', 'other'],
    'Smart Building': ['m²', 'units', 'systems', 'other']
  };
  
  const SUBCATEGORIES = {
    'Construction': ['New Construction', 'Renovation', 'Infrastructure', 'Commercial', 'Residential', 'Industrial'],
    'Construction Materials': ['Structural', 'Finishing', 'Insulation', 'Roofing', 'Flooring', 'Other'],
    'Green Materials': ['Building Materials', 'Packaging', 'Consumer Products', 'Industrial Materials', 'Other'],
    'Agricultural': ['Crop Management', 'Soil Management', 'Water Management', 'Equipment', 'Other'],
    'Coastal': ['Mangrove Restoration', 'Coral Reef Protection', 'Seagrass Meadows', 'Coastal Infrastructure', 'Other'],
    'Forest Management': ['Tropical', 'Temperate', 'Boreal', 'Urban Forestry', 'Agroforestry', 'Other'],
    'Forest Protection': ['REDD+', 'Conservation Easements', 'Indigenous Management', 'Protected Areas', 'Other'],
    'Green Energy': ['Utility Scale', 'Commercial', 'Residential', 'Off-grid', 'Microgrids', 'Other'],
    'Livestock': ['Cattle', 'Pigs', 'Poultry', 'Sheep', 'Goats', 'Other'],
    'Smart Building': ['Commercial', 'Residential', 'Industrial', 'Institutional', 'Other']
  };
  
  const SERVICE_CATEGORIES = [
    'Project Developer',
    'Project Validator/Verifier',
    'Registry Services',
    'Carbon Finance',
    'Carbon Accounting',
    'Investment Advisory',
    'Carbon Credit Trading',
    'Technology Provider',
    'Monitoring & Measurement',
    'Data Analytics',
    'Software Solutions',
    'Strategy Consulting',
    'Technical Consulting',
    'Regulatory Compliance',
    'Certification Support',
    'Legal Services',
    'Policy Advisory',
    'Contract Management',
    'Education & Training',
    'Marketing & Communications',
    'Other Services'
  ];
  
  const REGIONS = [
    'Global', 'North America', 'South America', 'Europe', 'Asia', 'Africa', 'Oceania',
    'United States', 'Canada', 'Mexico', 'Brazil', 'United Kingdom', 'Germany', 'France',
    'China', 'India', 'Japan', 'Australia', 'South Africa'
  ];
  
  const INDUSTRIES = [
    'Energy', 'Manufacturing', 'Transportation', 'Agriculture', 'Forestry',
    'Technology', 'Finance', 'Real Estate', 'Retail', 'Healthcare',
    'Construction', 'Mining', 'Oil & Gas', 'Renewable Energy', 'Waste Management'
  ];
  
  const LANGUAGES = [
    'English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 
    'Portuguese', 'Arabic', 'Hindi', 'Russian', 'Italian', 'Korean'
  ];
  
  const CERTIFICATIONS = [
    'ISO 14064-2', 'ISO 14064-3', 'ISO 14065', 'Gold Standard', 'Verra VCS',
    'CDM', 'Climate Action Reserve', 'American Carbon Registry',
    'SBTi Approved', 'CDP Accredited', 'GHG Protocol Certified',
    'Other ISO Standards', 'Professional Certifications'
  ];
  
  // Material types, units and subcategories for selected category
  const [materialTypeOptions, setMaterialTypeOptions] = useState([]);
  const [unitOptions, setUnitOptions] = useState([]);
  const [subcategoryOptions, setSubcategoryOptions] = useState([]);
  
  // Update available options when category changes
  useEffect(() => {
    const category = productFormData.category;
    setMaterialTypeOptions(MATERIAL_TYPES[category] || []);
    setUnitOptions(UNIT_OPTIONS[category] || []);
    setSubcategoryOptions(SUBCATEGORIES[category] || []);
  }, [productFormData.category]);

  useEffect(() => {
    fetchSolutionDetails();
  }, [id]);

  const fetchSolutionDetails = async () => {
    try {
      setLoading(true);
      console.log('Fetching solution details for ID:', id);
      
      // Use fetch with the same pattern as MarketplacePage
      const response = await fetch(`${API_BASE}/marketplace/products/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const product = await response.json();
      console.log('Fetched solution:', product);
      
      // Determine if this is a product or service
      const isService = product.entry_type === 'service' || product.category === 'Services';
      setEntryType(isService ? 'service' : 'product');
      
      // Set company data
      setCompanyData({
        company_name: product.company_name || ''
      });
      
      if (isService) {
        // Parse service metadata
        let serviceMetadata = product.service_metadata || {};
        if (typeof serviceMetadata === 'string') {
          try {
            serviceMetadata = JSON.parse(serviceMetadata);
          } catch (e) {
            console.error('Error parsing service_metadata:', e);
          }
        }
        
        setServiceFormData({
          name: product.name || '',
          description: product.description || '',
          service_category: product.subcategory || '',
          specializations: serviceMetadata.specializations || [],
          certifications: serviceMetadata.certifications || [],
          regions_served: serviceMetadata.regions_served || [],
          industries_served: serviceMetadata.industries_served || [],
          pricing_model: product.pricing_model || '',
          hourly_rate_min: serviceMetadata.hourly_rate_min || product.unit_price || '',
          hourly_rate_max: serviceMetadata.hourly_rate_max || '',
          project_minimum: serviceMetadata.project_minimum || '',
          languages: serviceMetadata.languages || [],
          availability: serviceMetadata.availability || 'scheduled',
          response_time: serviceMetadata.response_time || '24-48 hours',
          image_url: product.image_url || ''
        });
      } else {
        // Parse implementation guidance
        let implementationGuidance = {
          steps: [],
          requirements: [],
          timeline: ''
        };
        
        if (product.implementation_guidance) {
          try {
            if (typeof product.implementation_guidance === 'string') {
              implementationGuidance = JSON.parse(product.implementation_guidance);
            } else {
              implementationGuidance = product.implementation_guidance;
            }
          } catch (e) {
            console.error('Error parsing implementation_guidance:', e);
          }
        }
        
        setProductFormData({
          name: product.name || '',
          description: product.description || '',
          category: product.category || 'Construction',
          subcategory: product.subcategory || '',
          emissions_reduction_factor: product.emissions_reduction_factor ? (product.emissions_reduction_factor * 100).toString() : '',
          implementation_time: product.implementation_time || 'Implementation time varies',
          image_url: product.image_url || '',
          unit_price: product.unit_price || '',
          unit: product.unit || '',
          material_type: product.material_type || '',
          implementation_guidance: implementationGuidance,
          pricing_model: product.pricing_model || 'per_unit'
        });
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching solution details:', err);
      setError('Failed to load solution details');
    } finally {
      setLoading(false);
    }
  };

  // Handle product input changes
  const handleProductChange = (e) => {
    const { name, value } = e.target;
    setProductFormData({
      ...productFormData,
      [name]: value
    });
  };
  
  // Handle service input changes
  const handleServiceChange = (e) => {
    const { name, value } = e.target;
    setServiceFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle company input changes
  const handleCompanyChange = (e) => {
    const { name, value } = e.target;
    setCompanyData(prev => ({ ...prev, [name]: value }));
  };
  
  // Service array field functions
  const addArrayItem = (field, input, setInput) => {
    if (input.trim()) {
      setServiceFormData(prev => ({
        ...prev,
        [field]: [...prev[field], input.trim()]
      }));
      setInput('');
    }
  };

  const removeArrayItem = (field, index) => {
    setServiceFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage('');

    try {
      let submitData;
      
      if (entryType === 'service') {
        // Prepare service data
        submitData = {
          name: serviceFormData.name || 'Unnamed Service',
          description: serviceFormData.description || 'No description provided',
          category: 'Services',
          subcategory: serviceFormData.service_category || 'Other Services',
          company_name: companyData.company_name || 'Unnamed Company',
          image_url: serviceFormData.image_url || '/uploads/images/placeholder-project.jpg',
          pricing_model: serviceFormData.pricing_model || null,
          unit_price: serviceFormData.hourly_rate_min ? parseFloat(serviceFormData.hourly_rate_min) : null,
          entry_type: 'service',
          service_metadata: {
            specializations: serviceFormData.specializations,
            certifications: serviceFormData.certifications,
            regions_served: serviceFormData.regions_served,
            industries_served: serviceFormData.industries_served,
            languages: serviceFormData.languages,
            availability: serviceFormData.availability,
            response_time: serviceFormData.response_time,
            hourly_rate_min: serviceFormData.hourly_rate_min,
            hourly_rate_max: serviceFormData.hourly_rate_max,
            project_minimum: serviceFormData.project_minimum
          }
        };
      } else {
        // Prepare product data
        submitData = {
          name: productFormData.name || 'Unnamed Product',
          description: productFormData.description || 'No description provided',
          category: productFormData.category,
          subcategory: productFormData.subcategory || null,
          company_name: companyData.company_name || 'Unnamed Company',
          emissions_reduction_factor: productFormData.emissions_reduction_factor ? parseFloat(productFormData.emissions_reduction_factor) / 100 : null,
          implementation_time: productFormData.implementation_time || null,
          image_url: productFormData.image_url || '/uploads/images/placeholder-project.jpg',
          unit_price: productFormData.unit_price ? parseFloat(productFormData.unit_price) : null,
          unit: productFormData.unit || null,
          material_type: productFormData.material_type || null,
          implementation_guidance: productFormData.implementation_guidance,
          pricing_model: productFormData.pricing_model || null,
          entry_type: 'product'
        };
      }

      console.log('Submitting data:', submitData);

      // Use fetch with the same pattern as MarketplacePage
      const response = await fetch(`${API_BASE}/products/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Update response:', result);
      
      setSuccessMessage('Solution updated successfully!');
      
      // Redirect after a brief delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      
    } catch (err) {
      console.error('Error updating solution:', err);
      setError(err.message || 'Failed to update solution');
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

  if (error && !productFormData.name && !serviceFormData.name) {
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
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Edit {entryType === 'service' ? 'Service' : 'Product'}
        </h1>

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
          {/* Company Name */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold mb-4">Company Information</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                name="company_name"
                value={companyData.company_name}
                onChange={handleCompanyChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Product Fields */}
          {entryType === 'product' && (
            <>
              {/* Basic Information */}
              <div className="border-b pb-6">
                <h2 className="text-xl font-semibold mb-4">Product Information</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={productFormData.name}
                      onChange={handleProductChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description *
                    </label>
                    <textarea
                      name="description"
                      value={productFormData.description}
                      onChange={handleProductChange}
                      rows="4"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category *
                      </label>
                      <select
                        name="category"
                        value={productFormData.category}
                        onChange={handleProductChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        required
                      >
                        <option value="Construction">Construction</option>
                        <option value="Agricultural">Agricultural</option>
                        <option value="Coastal">Coastal</option>
                        <option value="Construction Materials">Construction Materials</option>
                        <option value="Forest Management">Forest Management</option>
                        <option value="Forest Protection">Forest Protection</option>
                        <option value="Green Energy">Green Energy</option>
                        <option value="Green Materials">Green Materials</option>
                        <option value="Livestock">Livestock</option>
                        <option value="Smart Building">Smart Building</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subcategory
                      </label>
                      <select
                        name="subcategory"
                        value={productFormData.subcategory}
                        onChange={handleProductChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Select a subcategory</option>
                        {subcategoryOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Material Type
                      </label>
                      <select
                        name="material_type"
                        value={productFormData.material_type}
                        onChange={handleProductChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Select material type</option>
                        {materialTypeOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Emissions Reduction (%)
                      </label>
                      <input
                        type="number"
                        name="emissions_reduction_factor"
                        value={productFormData.emissions_reduction_factor}
                        onChange={handleProductChange}
                        min="0"
                        max="100"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        placeholder="e.g., 30"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pricing Model
                      </label>
                      <select
                        name="pricing_model"
                        value={productFormData.pricing_model}
                        onChange={handleProductChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      >
                        <option value="per_unit">Per Unit</option>
                        <option value="per_project">Per Project</option>
                        <option value="subscription">Subscription</option>
                        <option value="custom_quote">Custom Quote</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit Price
                      </label>
                      <input
                        type="number"
                        name="unit_price"
                        value={productFormData.unit_price}
                        onChange={handleProductChange}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit
                      </label>
                      <select
                        name="unit"
                        value={productFormData.unit}
                        onChange={handleProductChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Select unit</option>
                        {unitOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Image URL (optional)
                    </label>
                    <input
                      type="text"
                      name="image_url"
                      value={productFormData.image_url}
                      onChange={handleProductChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="https://example.com/product-image.jpg"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
          
          {/* Service Fields */}
          {entryType === 'service' && (
            <>
              <div className="border-b pb-6">
                <h2 className="text-xl font-semibold mb-4">Service Information</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Service Category *
                    </label>
                    <select
                      name="service_category"
                      value={serviceFormData.service_category}
                      onChange={handleServiceChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                    >
                      <option value="">Select a category</option>
                      {SERVICE_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Service Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={serviceFormData.name}
                      onChange={handleServiceChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description *
                    </label>
                    <textarea
                      name="description"
                      value={serviceFormData.description}
                      onChange={handleServiceChange}
                      rows="4"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                  
                  {/* Specializations */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Specializations
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={specializationInput}
                        onChange={(e) => setSpecializationInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addArrayItem('specializations', specializationInput, setSpecializationInput))}
                        placeholder="Add a specialization"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => addArrayItem('specializations', specializationInput, setSpecializationInput)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {serviceFormData.specializations.map((spec, index) => (
                        <span key={index} className="px-3 py-1 bg-gray-100 rounded-full flex items-center gap-2">
                          {spec}
                          <button
                            type="button"
                            onClick={() => removeArrayItem('specializations', index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {/* Certifications */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Certifications
                    </label>
                    <div className="flex gap-2 mb-2">
                      <select
                        value={certificationInput}
                        onChange={(e) => setCertificationInput(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Select a certification</option>
                        {CERTIFICATIONS.map(cert => (
                          <option key={cert} value={cert}>{cert}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => certificationInput && addArrayItem('certifications', certificationInput, setCertificationInput)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {serviceFormData.certifications.map((cert, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 rounded-full flex items-center gap-2">
                          {cert}
                          <button
                            type="button"
                            onClick={() => removeArrayItem('certifications', index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {/* Regions Served */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Regions Served
                    </label>
                    <div className="flex gap-2 mb-2">
                      <select
                        value={regionInput}
                        onChange={(e) => setRegionInput(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Select a region</option>
                        {REGIONS.map(region => (
                          <option key={region} value={region}>{region}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => regionInput && addArrayItem('regions_served', regionInput, setRegionInput)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {serviceFormData.regions_served.map((region, index) => (
                        <span key={index} className="px-3 py-1 bg-purple-100 rounded-full flex items-center gap-2">
                          {region}
                          <button
                            type="button"
                            onClick={() => removeArrayItem('regions_served', index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {/* Industries Served */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Industries Served
                    </label>
                    <div className="flex gap-2 mb-2">
                      <select
                        value={industryInput}
                        onChange={(e) => setIndustryInput(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Select an industry</option>
                        {INDUSTRIES.map(industry => (
                          <option key={industry} value={industry}>{industry}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => industryInput && addArrayItem('industries_served', industryInput, setIndustryInput)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {serviceFormData.industries_served.map((industry, index) => (
                        <span key={index} className="px-3 py-1 bg-yellow-100 rounded-full flex items-center gap-2">
                          {industry}
                          <button
                            type="button"
                            onClick={() => removeArrayItem('industries_served', index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {/* Languages */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Languages
                    </label>
                    <div className="flex gap-2 mb-2">
                      <select
                        value={languageInput}
                        onChange={(e) => setLanguageInput(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Select a language</option>
                        {LANGUAGES.map(lang => (
                          <option key={lang} value={lang}>{lang}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => languageInput && addArrayItem('languages', languageInput, setLanguageInput)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {serviceFormData.languages.map((lang, index) => (
                        <span key={index} className="px-3 py-1 bg-indigo-100 rounded-full flex items-center gap-2">
                          {lang}
                          <button
                            type="button"
                            onClick={() => removeArrayItem('languages', index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pricing Model
                      </label>
                      <select
                        name="pricing_model"
                        value={serviceFormData.pricing_model}
                        onChange={handleServiceChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Select pricing model</option>
                        <option value="hourly">Hourly Rate</option>
                        <option value="project">Project-Based</option>
                        <option value="retainer">Monthly Retainer</option>
                        <option value="commission">Commission-Based</option>
                        <option value="negotiable">Negotiable</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Availability
                      </label>
                      <select
                        name="availability"
                        value={serviceFormData.availability}
                        onChange={handleServiceChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      >
                        <option value="immediate">Immediate</option>
                        <option value="within_week">Within a week</option>
                        <option value="within_month">Within a month</option>
                        <option value="scheduled">Scheduled/By appointment</option>
                      </select>
                    </div>
                  </div>
                  
                  {serviceFormData.pricing_model === 'hourly' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Hourly Rate (Min)
                        </label>
                        <input
                          type="number"
                          name="hourly_rate_min"
                          value={serviceFormData.hourly_rate_min}
                          onChange={handleServiceChange}
                          min="0"
                          step="10"
                          placeholder="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Hourly Rate (Max)
                        </label>
                        <input
                          type="number"
                          name="hourly_rate_max"
                          value={serviceFormData.hourly_rate_max}
                          onChange={handleServiceChange}
                          min="0"
                          step="10"
                          placeholder="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </div>
                  )}
                  
                  {(serviceFormData.pricing_model === 'project' || serviceFormData.pricing_model === 'retainer') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Minimum Project/Retainer Size ($)
                      </label>
                      <input
                        type="number"
                        name="project_minimum"
                        value={serviceFormData.project_minimum}
                        onChange={handleServiceChange}
                        min="0"
                        step="1000"
                        placeholder="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Service Image URL (optional)
                    </label>
                    <input
                      type="text"
                      name="image_url"
                      value={serviceFormData.image_url}
                      onChange={handleServiceChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="https://example.com/service-image.jpg"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

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