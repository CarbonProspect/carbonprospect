// AddSolutionForm.js - Updated multi-step form for products and services
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthSystem';
import { apiCall } from './api-config';

// Material type options based on product category
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

// Unit options based on category
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

// Service categories for providers
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

// Constants for dropdowns
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

const TEAM_SIZES = [
  { value: '1', label: 'Individual' },
  { value: '2-10', label: '2-10 people' },
  { value: '11-50', label: '11-50 people' },
  { value: '51-200', label: '51-200 people' },
  { value: '200+', label: '200+ people' }
];

const AddSolutionForm = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // State variables
  const [currentStep, setCurrentStep] = useState(1);
  const [formType, setFormType] = useState(''); // 'product' or 'service'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);
  
  // Company information (shared between product and service)
  const [companyData, setCompanyData] = useState({
    company_name: '',
    company_description: '',
    website: '',
    linkedin_url: '',
    headquarters_city: '',
    headquarters_country: '',
    founded_year: '',
    team_size: '',
    years_experience: '',
    contact_email: '',
    contact_phone: ''
  });
  
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
  
  // Input states for service array fields
  const [specializationInput, setSpecializationInput] = useState('');
  const [certificationInput, setCertificationInput] = useState('');
  const [regionInput, setRegionInput] = useState('');
  const [industryInput, setIndustryInput] = useState('');
  const [languageInput, setLanguageInput] = useState('');
  
  // Material types, units and subcategories for selected category
  const [materialTypeOptions, setMaterialTypeOptions] = useState([]);
  const [unitOptions, setUnitOptions] = useState([]);
  const [subcategoryOptions, setSubcategoryOptions] = useState([]);

  // Check if user already has profile data on mount
  useEffect(() => {
    if (!currentUser) {
      navigate('/login', { state: { from: '/marketplace/add-solution' } });
      return;
    }
    
    // Check if user already has company data in their profile
    checkExistingProfile();
  }, [currentUser, navigate]);
  
  const checkExistingProfile = async () => {
    try {
      console.log('Checking for existing profile...');
      const profileData = await apiCall('GET', `profiles/unified/${currentUser.id}`);
      console.log('Profile data received:', profileData);
      
      // Check if the user has an actual profile (not just a "needs_profile_creation" response)
      if (profileData && profileData.company_name && profileData.profile_type !== 'none') {
        setHasExistingProfile(true);
        // Pre-populate company data from existing profile
        setCompanyData({
          company_name: profileData.company_name || '',
          company_description: profileData.description || profileData.company_description || '',
          website: profileData.website || '',
          linkedin_url: profileData.social_profiles?.linkedin || '',
          headquarters_city: profileData.headquarters_city || '',
          headquarters_country: profileData.headquarters_country || '',
          founded_year: profileData.founded_year || '',
          team_size: profileData.team_size || profileData.company_size || '',
          years_experience: profileData.years_of_experience || profileData.years_experience || '',
          contact_email: profileData.contact_info?.contact_email || profileData.contact_email || '',
          contact_phone: profileData.contact_info?.contact_phone || profileData.contact_phone || ''
        });
      }
    } catch (err) {
      console.log('No existing profile data found or error occurred:', err.message);
      // This is not a critical error - user might not have a profile yet
    }
  };
  
  // Update available options when category changes
  useEffect(() => {
    const category = productFormData.category;
    setMaterialTypeOptions(MATERIAL_TYPES[category] || []);
    setUnitOptions(UNIT_OPTIONS[category] || []);
    setSubcategoryOptions(SUBCATEGORIES[category] || []);
    
    // Set default values if current values aren't in the new options
    if (productFormData.subcategory && !SUBCATEGORIES[category]?.includes(productFormData.subcategory)) {
      setProductFormData(prev => ({ ...prev, subcategory: SUBCATEGORIES[category]?.[0] || '' }));
    }
    if (productFormData.material_type && !MATERIAL_TYPES[category]?.includes(productFormData.material_type)) {
      setProductFormData(prev => ({ ...prev, material_type: MATERIAL_TYPES[category]?.[0] || '' }));
    }
    if (productFormData.unit && !UNIT_OPTIONS[category]?.includes(productFormData.unit)) {
      setProductFormData(prev => ({ ...prev, unit: UNIT_OPTIONS[category]?.[0] || '' }));
    }
  }, [productFormData.category]);
  
  // Handle form navigation
  const handleNext = () => {
    if (currentStep === 1 && !formType) {
      setError('Please select whether you are adding a product or service');
      return;
    }
    
    // TEMPORARILY REDUCED VALIDATION - Only check for solution type selection
    if (currentStep === 1) {
      // Just check if they selected product or service
      if (!formType) {
        setError('Please select a solution type');
        return;
      }
      // Minimal validation - just warn if name is empty but allow progression
      if (formType === 'product' && !productFormData.name) {
        console.warn('Product name is empty - will use default');
      } else if (formType === 'service' && !serviceFormData.name) {
        console.warn('Service name is empty - will use default');
      }
    }
    
    // TEMPORARILY REDUCED VALIDATION for step 2
    if (currentStep === 2) {
      // Just warn if company name is empty but allow progression
      if (!companyData.company_name) {
        console.warn('Company name is empty - will use default "Unnamed Company"');
      }
    }
    
    setError(null);
    setCurrentStep(currentStep + 1);
  };
  
  const handleBack = () => {
    setError(null);
    setCurrentStep(currentStep - 1);
  };
  
  // Handle product input changes
  const handleProductChange = (e) => {
    const { name, value } = e.target;
    setProductFormData({
      ...productFormData,
      [name]: value
    });
    setError(null);
  };
  
  // Handle service input changes
  const handleServiceChange = (e) => {
    const { name, value } = e.target;
    setServiceFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };
  
  // Handle company input changes
  const handleCompanyChange = (e) => {
    const { name, value } = e.target;
    setCompanyData(prev => ({ ...prev, [name]: value }));
    setError(null);
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
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      console.log('Starting form submission...');
      
      // First, update the user's profile with company information
      console.log('Updating user profile...');
      const profileResponse = await updateUserProfile();
      console.log('Profile updated successfully:', profileResponse);
      
      // Then create the marketplace entry
      console.log('Creating marketplace entry...');
      if (formType === 'service') {
        await submitService();
      } else {
        await submitProduct();
      }
      
      setSuccess(true);
      console.log('Form submission successful!');
      
      // Redirect after success
      setTimeout(() => {
        navigate(`/profile/${currentUser.id}`);
      }, 2000);
      
    } catch (err) {
      console.error('Error submitting form:', err);
      
      // Extract meaningful error message
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          err.message || 
                          'There was an error submitting your solution. Please try again.';
      
      setError(errorMessage);
      
      // If it's a field-specific error, we might want to highlight that field
      if (err.response?.data?.field) {
        console.error('Field error:', err.response.data.field);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Update user's profile with company information
  const updateUserProfile = async () => {
    // MINIMAL REQUIRED DATA - Only company_name is required by the server
    const profileData = {
      // Required field
      company_name: companyData.company_name || 'Unnamed Company', // Provide default if empty
      
      // Optional fields - send empty strings or nulls if not provided
      description: companyData.company_description || '',
      website: companyData.website || null,
      team_size: companyData.team_size || null,
      
      // Provider type
      provider_type: formType === 'service' ? 'service' : 'product',
      
      // Pricing model - send null if not set
      pricing_model: formType === 'service' ? (serviceFormData.pricing_model || null) : null,
      
      // Service-specific fields - all optional
      ...(formType === 'service' && {
        specializations: serviceFormData.specializations.length > 0 ? serviceFormData.specializations : [],
        certifications: serviceFormData.certifications.length > 0 ? serviceFormData.certifications : [],
        regions_served: serviceFormData.regions_served.length > 0 ? serviceFormData.regions_served : [],
        industries_served: serviceFormData.industries_served.length > 0 ? serviceFormData.industries_served : [],
        languages: serviceFormData.languages.length > 0 ? serviceFormData.languages : [],
        availability: serviceFormData.availability || null,
        response_time: serviceFormData.response_time || null,
        hourly_rate_min: serviceFormData.hourly_rate_min ? parseFloat(serviceFormData.hourly_rate_min) : null,
        hourly_rate_max: serviceFormData.hourly_rate_max ? parseFloat(serviceFormData.hourly_rate_max) : null,
        project_minimum: serviceFormData.project_minimum ? parseFloat(serviceFormData.project_minimum) : null
      })
    };
    
    console.log('Sending profile data:', profileData);
    
    // Update the profile
    const response = await apiCall('PUT', `profiles/service-provider/${currentUser.id}`, profileData);
    console.log('Profile update response:', response);
    return response;
  };
  
  // Submit service to marketplace
  const submitService = async () => {
    const marketplaceData = {
      // Use defaults for required fields if empty
      name: serviceFormData.name || 'Unnamed Service',
      description: serviceFormData.description || 'No description provided',
      category: 'Services',
      subcategory: serviceFormData.service_category || 'Other Services',
      company_name: companyData.company_name || 'Unnamed Company',
      image_url: serviceFormData.image_url || '/uploads/images/placeholder-project.jpg',
      pricing_model: serviceFormData.pricing_model || null,
      unit_price: serviceFormData.hourly_rate_min || null,
      entry_type: 'service',
      
      // Include service metadata
      service_metadata: {
        specializations: serviceFormData.specializations,
        certifications: serviceFormData.certifications,
        regions_served: serviceFormData.regions_served,
        industries_served: serviceFormData.industries_served,
        languages: serviceFormData.languages,
        availability: serviceFormData.availability,
        response_time: serviceFormData.response_time,
        hourly_rate_max: serviceFormData.hourly_rate_max,
        project_minimum: serviceFormData.project_minimum
      }
    };
    
    console.log('Sending marketplace data:', marketplaceData);
    await apiCall('POST', 'marketplace/products', marketplaceData);
  };
  
  // Submit product to marketplace
  const submitProduct = async () => {
    // Get project types based on category
    const categoryMappings = {
      'Construction': ['construction'],
      'Construction Materials': ['construction'],
      'Green Materials': ['construction'],
      'Agricultural': ['agriculture'],
      'Coastal': ['construction', 'agriculture'],
      'Forest Management': ['agriculture'],
      'Forest Protection': ['agriculture'],
      'Green Energy': ['construction', 'agriculture', 'livestock'],
      'Livestock': ['livestock'],
      'Smart Building': ['construction']
    };
    
    const projectTypes = categoryMappings[productFormData.category] || [];
    
    const productData = {
      // Use defaults for required fields if empty
      name: productFormData.name || 'Unnamed Product',
      description: productFormData.description || 'No description provided',
      category: productFormData.category || 'Construction',
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
      entry_type: 'product',
      project_types: projectTypes
    };
    
    console.log('Sending product data:', productData);
    await apiCall('POST', 'marketplace/products', productData);
  };
  
  // Render step 1: Product or Service details
  const renderStep1 = () => (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Step 1: Solution Details</h2>
      
      {/* Solution type selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          What type of solution are you adding? *
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setFormType('product')}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              formType === 'product' 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <h3 className="font-semibold text-lg mb-1">Product</h3>
            <p className="text-sm text-gray-600">
              Physical products, materials, or technologies that reduce carbon emissions
            </p>
          </button>
          
          <button
            type="button"
            onClick={() => setFormType('service')}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              formType === 'service' 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <h3 className="font-semibold text-lg mb-1">Service</h3>
            <p className="text-sm text-gray-600">
              Consulting, verification, financial, or technical services for carbon projects
            </p>
          </button>
        </div>
      </div>
      
      {/* Product form fields */}
      {formType === 'product' && (
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
              placeholder="e.g., Low-Carbon Concrete Mix"
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
              placeholder="Describe your product and its benefits..."
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
      )}
      {/* Service form fields */}
      {formType === 'service' && (
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
              placeholder="e.g., Carbon Footprint Assessment Services"
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
              placeholder="Describe your service offering..."
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
      )}
    </div>
  );
  
  // Render step 2: Company information
  const renderStep2 = () => (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Step 2: Company Information</h2>
      
      {hasExistingProfile && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
          <p className="text-sm text-blue-800">
            We've pre-filled this form with your existing profile information. 
            You can update any fields as needed.
          </p>
        </div>
      )}
      
      {/* Temporary notice about minimal requirements */}
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
        <p className="text-sm text-yellow-800">
          <strong>For testing:</strong> Only Company Name is required. All other fields are optional.
          You can add more details later from your profile page.
        </p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company Name * <span className="text-xs text-gray-500">(Required)</span>
          </label>
          <input
            type="text"
            name="company_name"
            value={companyData.company_name}
            onChange={handleCompanyChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            placeholder="Your company name (or enter 'Test Company' for now)"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company Description <span className="text-xs text-gray-500">(Optional)</span>
          </label>
          <textarea
            name="company_description"
            value={companyData.company_description}
            onChange={handleCompanyChange}
            rows="4"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            placeholder="Tell us about your company (optional)..."
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Headquarters City
            </label>
            <input
              type="text"
              name="headquarters_city"
              value={companyData.headquarters_city}
              onChange={handleCompanyChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="e.g., San Francisco"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Headquarters Country
            </label>
            <input
              type="text"
              name="headquarters_country"
              value={companyData.headquarters_country}
              onChange={handleCompanyChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="e.g., United States"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Founded Year
            </label>
            <input
              type="number"
              name="founded_year"
              value={companyData.founded_year}
              onChange={handleCompanyChange}
              min="1900"
              max={new Date().getFullYear()}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="e.g., 2020"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Team Size
            </label>
            <select
              name="team_size"
              value={companyData.team_size}
              onChange={handleCompanyChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="">Select team size</option>
              {TEAM_SIZES.map(size => (
                <option key={size.value} value={size.value}>{size.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Years in Industry
            </label>
            <input
              type="number"
              name="years_experience"
              value={companyData.years_experience}
              onChange={handleCompanyChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="Years of experience"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Website
            </label>
            <input
              type="url"
              name="website"
              value={companyData.website}
              onChange={handleCompanyChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="https://www.example.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              LinkedIn Profile
            </label>
            <input
              type="url"
              name="linkedin_url"
              value={companyData.linkedin_url}
              onChange={handleCompanyChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="https://linkedin.com/company/..."
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Email
            </label>
            <input
              type="email"
              name="contact_email"
              value={companyData.contact_email}
              onChange={handleCompanyChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="contact@example.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Phone
            </label>
            <input
              type="tel"
              name="contact_phone"
              value={companyData.contact_phone}
              onChange={handleCompanyChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>
      </div>
    </div>
  );
  
  // Render step 3: Review and submit
  const renderStep3 = () => (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Step 3: Review & Submit</h2>
      
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <h3 className="font-semibold text-lg mb-4">
          {formType === 'product' ? 'Product' : 'Service'} Details
        </h3>
        
        {formType === 'product' ? (
          <div className="space-y-2 text-sm">
            <p><strong>Name:</strong> {productFormData.name}</p>
            <p><strong>Category:</strong> {productFormData.category}</p>
            <p><strong>Description:</strong> {productFormData.description}</p>
            {productFormData.emissions_reduction_factor && (
              <p><strong>Emissions Reduction:</strong> {productFormData.emissions_reduction_factor}%</p>
            )}
            {productFormData.unit_price && (
              <p><strong>Price:</strong> ${productFormData.unit_price} per {productFormData.unit || 'unit'}</p>
            )}
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <p><strong>Service:</strong> {serviceFormData.name}</p>
            <p><strong>Category:</strong> {serviceFormData.service_category}</p>
            <p><strong>Description:</strong> {serviceFormData.description}</p>
            {serviceFormData.specializations.length > 0 && (
              <p><strong>Specializations:</strong> {serviceFormData.specializations.join(', ')}</p>
            )}
            {serviceFormData.pricing_model && (
              <p><strong>Pricing Model:</strong> {serviceFormData.pricing_model}</p>
            )}
          </div>
        )}
      </div>
      
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <h3 className="font-semibold text-lg mb-4">Company Information</h3>
        <div className="space-y-2 text-sm">
          <p><strong>Company:</strong> {companyData.company_name}</p>
          <p><strong>Description:</strong> {companyData.company_description}</p>
          {companyData.headquarters_city && companyData.headquarters_country && (
            <p><strong>Location:</strong> {companyData.headquarters_city}, {companyData.headquarters_country}</p>
          )}
          {companyData.team_size && (
            <p><strong>Team Size:</strong> {TEAM_SIZES.find(s => s.value === companyData.team_size)?.label}</p>
          )}
          {companyData.website && (
            <p><strong>Website:</strong> {companyData.website}</p>
          )}
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">What happens next?</h4>
        <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
          <li>Your {formType} will be listed in the marketplace</li>
          <li>Your company profile will be updated with the information provided</li>
          <li>You can manage visibility settings from your profile page</li>
          <li>You can add more {formType === 'product' ? 'products' : 'services'} anytime</li>
        </ul>
      </div>
    </div>
  );
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Add Your Solution</h1>
        
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    currentStep >= step
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`h-1 w-24 md:w-48 ${
                      currentStep > step ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-sm text-gray-600">Solution Details</span>
            <span className="text-sm text-gray-600">Company Info</span>
            <span className="text-sm text-gray-600">Review</span>
          </div>
        </div>
        
        {/* Error display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p>{error}</p>
          </div>
        )}
        
        {/* Success message */}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            <p>Your {formType} has been successfully added! Redirecting to your profile...</p>
          </div>
        )}
        
        {/* Form content */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          
          {/* Navigation buttons */}
          <div className="flex justify-between mt-8">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
            )}
            
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="ml-auto px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="ml-auto px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSolutionForm;