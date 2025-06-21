// AddSolutionForm.js - Fixed version with project_types support
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthSystem';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

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

// Helper function to determine project types based on category
const getProjectTypesFromCategory = (category) => {
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
  
  return categoryMappings[category] || [];
};

// Service Provider constants
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

const AddSolutionForm = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // State variables
  const [formType, setFormType] = useState('product');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Product form data
  const [productFormData, setProductFormData] = useState({
    name: '',
    description: '',
    category: 'Construction',
    subcategory: '',
    company_name: '',
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
  
  // Service Provider form data
  const [providerFormData, setProviderFormData] = useState({
    provider_type: '',
    company_name: '',
    description: '',
    specializations: [],
    certifications: [],
    regions_served: [],
    industries_served: [],
    pricing_model: '',
    hourly_rate_min: '',
    hourly_rate_max: '',
    project_minimum: '',
    years_experience: '',
    team_size: '',
    languages: [],
    website: '',
    linkedin_url: '',
    availability: 'scheduled',
    response_time: '24-48 hours',
    image_url: ''
  });
  
  // Input states for provider array fields
  const [specializationInput, setSpecializationInput] = useState('');
  const [certificationInput, setCertificationInput] = useState('');
  const [regionInput, setRegionInput] = useState('');
  const [industryInput, setIndustryInput] = useState('');
  const [languageInput, setLanguageInput] = useState('');
  
  // Material types, units and subcategories for selected category
  const [materialTypeOptions, setMaterialTypeOptions] = useState([]);
  const [unitOptions, setUnitOptions] = useState([]);
  const [subcategoryOptions, setSubcategoryOptions] = useState([]);

  // Fetch provider categories
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/service-providers/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
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
  
  // Handle provider input changes
  const handleProviderChange = (e) => {
    const { name, value } = e.target;
    setProviderFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };
  
  // Handle form type change
  const handleFormTypeChange = (type) => {
    setFormType(type);
    setError(null);
    setSuccess(false);
  };
  
  // Provider array field functions
  const addArrayItem = (field, input, setInput) => {
    if (input.trim()) {
      setProviderFormData(prev => ({
        ...prev,
        [field]: [...prev[field], input.trim()]
      }));
      setInput('');
    }
  };

  const removeArrayItem = (field, index) => {
    setProviderFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
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
  
  useEffect(() => {
    // Check if user is logged in
    if (!currentUser) {
      navigate('/login', { state: { from: '/marketplace/add-solution' } });
    }
  }, [currentUser, navigate]);
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (formType === 'provider') {
        await submitProvider();
      } else {
        await submitProduct();
      }
      
      setSuccess(true);
      
      // Redirect after success
      setTimeout(() => {
        navigate('/marketplace');
      }, 2000);
      
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(err.response?.data?.message || 'There was an error submitting your solution. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Submit provider to the API
  const submitProvider = async () => {
    const token = localStorage.getItem('token');
    
    await axios.post('/api/service-providers', providerFormData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  };
  
  // Submit product to the API - FIXED VERSION
  const submitProduct = async () => {
    // Prepare implementation guidance as JSONB
    const implementationGuidance = {
      steps: productFormData.implementation_guidance.steps || [],
      requirements: productFormData.implementation_guidance.requirements || [],
      timeline: productFormData.implementation_guidance.timeline || ''
    };
    
    // Get project types based on category
    const projectTypes = getProjectTypesFromCategory(productFormData.category);
    
    const productData = {
      name: productFormData.name,
      description: productFormData.description,
      category: productFormData.category,
      subcategory: productFormData.subcategory,
      company_name: productFormData.company_name,
      emissions_reduction_factor: parseFloat(productFormData.emissions_reduction_factor) / 100,
      implementation_time: productFormData.implementation_time,
      image_url: productFormData.image_url || '/uploads/images/placeholder-project.jpg',
      unit_price: productFormData.unit_price ? parseFloat(productFormData.unit_price) : null,
      unit: productFormData.unit,
      material_type: productFormData.material_type,
      implementation_guidance: implementationGuidance,
      pricing_model: productFormData.pricing_model,
      entry_type: 'product',
      project_types: projectTypes // Add this line
    };
    
    const token = localStorage.getItem('token');
    
    await axios.post(`${API_BASE_URL}/marketplace/products`, productData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
  };
  // Render provider form fields
  const renderProviderFields = () => (
    <div className="space-y-8">
      {/* Basic Information */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Provider Type *</label>
            <select
              name="provider_type"
              value={providerFormData.provider_type}
              onChange={handleProviderChange}
              required
              className="w-full p-2 border rounded-md"
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <optgroup key={cat.id} label={cat.category_name}>
                  {cat.subcategories.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.category_name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Company Name *</label>
            <input
              type="text"
              name="company_name"
              value={providerFormData.company_name}
              onChange={handleProviderChange}
              required
              className="w-full p-2 border rounded-md"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Description *</label>
            <textarea
              name="description"
              value={providerFormData.description}
              onChange={handleProviderChange}
              required
              rows="4"
              className="w-full p-2 border rounded-md"
              placeholder="Describe your services, expertise, and what makes you unique..."
            />
          </div>
        </div>
      </div>

      {/* Expertise & Qualifications */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Expertise & Qualifications</h2>
        
        <div className="space-y-4">
          {/* Specializations */}
          <div>
            <label className="block text-sm font-medium mb-2">Specializations</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={specializationInput}
                onChange={(e) => setSpecializationInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addArrayItem('specializations', specializationInput, setSpecializationInput))}
                placeholder="Add a specialization"
                className="flex-1 p-2 border rounded-md"
              />
              <button
                type="button"
                onClick={() => addArrayItem('specializations', specializationInput, setSpecializationInput)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {providerFormData.specializations.map((spec, index) => (
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
            <label className="block text-sm font-medium mb-2">Certifications</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={certificationInput}
                onChange={(e) => setCertificationInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addArrayItem('certifications', certificationInput, setCertificationInput))}
                placeholder="Add a certification"
                className="flex-1 p-2 border rounded-md"
              />
              <button
                type="button"
                onClick={() => addArrayItem('certifications', certificationInput, setCertificationInput)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {providerFormData.certifications.map((cert, index) => (
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
              <label className="block text-sm font-medium mb-2">Years of Experience</label>
              <input
                type="number"
                name="years_experience"
                value={providerFormData.years_experience}
                onChange={handleProviderChange}
                min="0"
                className="w-full p-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Team Size</label>
              <select
                name="team_size"
                value={providerFormData.team_size}
                onChange={handleProviderChange}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Select team size</option>
                <option value="1">Individual</option>
                <option value="2-5">2-5 people</option>
                <option value="6-10">6-10 people</option>
                <option value="11-25">11-25 people</option>
                <option value="26-50">26-50 people</option>
                <option value="50+">50+ people</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Service Coverage */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Service Coverage</h2>
        
        <div className="space-y-4">
          {/* Regions Served */}
          <div>
            <label className="block text-sm font-medium mb-2">Regions Served</label>
            <div className="flex gap-2 mb-2">
              <select
                value={regionInput}
                onChange={(e) => setRegionInput(e.target.value)}
                className="flex-1 p-2 border rounded-md"
              >
                <option value="">Select a region</option>
                {REGIONS.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => regionInput && addArrayItem('regions_served', regionInput, setRegionInput)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {providerFormData.regions_served.map((region, index) => (
                <span key={index} className="px-3 py-1 bg-green-100 rounded-full flex items-center gap-2">
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
            <label className="block text-sm font-medium mb-2">Industries Served</label>
            <div className="flex gap-2 mb-2">
              <select
                value={industryInput}
                onChange={(e) => setIndustryInput(e.target.value)}
                className="flex-1 p-2 border rounded-md"
              >
                <option value="">Select an industry</option>
                {INDUSTRIES.map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => industryInput && addArrayItem('industries_served', industryInput, setIndustryInput)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {providerFormData.industries_served.map((industry, index) => (
                <span key={index} className="px-3 py-1 bg-purple-100 rounded-full flex items-center gap-2">
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
            <label className="block text-sm font-medium mb-2">Languages</label>
            <div className="flex gap-2 mb-2">
              <select
                value={languageInput}
                onChange={(e) => setLanguageInput(e.target.value)}
                className="flex-1 p-2 border rounded-md"
              >
                <option value="">Select a language</option>
                {LANGUAGES.map(language => (
                  <option key={language} value={language}>{language}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => languageInput && addArrayItem('languages', languageInput, setLanguageInput)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {providerFormData.languages.map((language, index) => (
                <span key={index} className="px-3 py-1 bg-yellow-100 rounded-full flex items-center gap-2">
                  {language}
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
        </div>
      </div>

      {/* Pricing & Availability */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Pricing & Availability</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Pricing Model</label>
            <select
              name="pricing_model"
              value={providerFormData.pricing_model}
              onChange={handleProviderChange}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Select pricing model</option>
              <option value="hourly">Hourly Rate</option>
              <option value="project">Project-Based</option>
              <option value="retainer">Monthly Retainer</option>
              <option value="commission">Commission-Based</option>
              <option value="hybrid">Hybrid</option>
              <option value="negotiable">Negotiable</option>
            </select>
          </div>

          {providerFormData.pricing_model === 'hourly' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Hourly Rate (Min)</label>
                <input
                  type="number"
                  name="hourly_rate_min"
                  value={providerFormData.hourly_rate_min}
                  onChange={handleProviderChange}
                  min="0"
                  step="10"
                  placeholder="$"
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Hourly Rate (Max)</label>
                <input
                  type="number"
                  name="hourly_rate_max"
                  value={providerFormData.hourly_rate_max}
                  onChange={handleProviderChange}
                  min="0"
                  step="10"
                  placeholder="$"
                  className="w-full p-2 border rounded-md"
                />
              </div>
            </>
          )}

          {(providerFormData.pricing_model === 'project' || providerFormData.pricing_model === 'hybrid') && (
            <div>
              <label className="block text-sm font-medium mb-2">Minimum Project Size</label>
              <input
                type="number"
                name="project_minimum"
                value={providerFormData.project_minimum}
                onChange={handleProviderChange}
                min="0"
                step="1000"
                placeholder="$"
                className="w-full p-2 border rounded-md"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Availability</label>
            <select
              name="availability"
              value={providerFormData.availability}
              onChange={handleProviderChange}
              className="w-full p-2 border rounded-md"
            >
              <option value="immediate">Immediate</option>
              <option value="within_week">Within a week</option>
              <option value="within_month">Within a month</option>
              <option value="scheduled">Scheduled/By appointment</option>
              <option value="unavailable">Currently unavailable</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Response Time</label>
            <select
              name="response_time"
              value={providerFormData.response_time}
              onChange={handleProviderChange}
              className="w-full p-2 border rounded-md"
            >
              <option value="1-2 hours">1-2 hours</option>
              <option value="2-4 hours">2-4 hours</option>
              <option value="4-8 hours">4-8 hours</option>
              <option value="24 hours">24 hours</option>
              <option value="24-48 hours">24-48 hours</option>
              <option value="2-3 days">2-3 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Website</label>
            <input
              type="url"
              name="website"
              value={providerFormData.website}
              onChange={handleProviderChange}
              placeholder="https://www.example.com"
              className="w-full p-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">LinkedIn Profile</label>
            <input
              type="url"
              name="linkedin_url"
              value={providerFormData.linkedin_url}
              onChange={handleProviderChange}
              placeholder="https://www.linkedin.com/in/username"
              className="w-full p-2 border rounded-md"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Profile Image URL</label>
            <input
              type="url"
              name="image_url"
              value={providerFormData.image_url}
              onChange={handleProviderChange}
              placeholder="https://example.com/image.jpg"
              className="w-full p-2 border rounded-md"
            />
          </div>
        </div>
      </div>
    </div>
  );
  
  // Render product form fields
  const renderProductFields = () => (
    <>
      <div className="mb-4">
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Product Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={productFormData.name}
          onChange={handleProductChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Your product name"
          required
        />
      </div>
      
      <div className="mb-4">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={productFormData.description}
          onChange={handleProductChange}
          rows="4"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Describe your product..."
          required
        ></textarea>
      </div>
      
      <div className="mb-4">
        <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-1">
          Company Name
        </label>
        <input
          type="text"
          id="company_name"
          name="company_name"
          value={productFormData.company_name}
          onChange={handleProductChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Your company name"
        />
      </div>
      
      <div className="mb-4">
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
          Category
        </label>
        <select
          id="category"
          name="category"
          value={productFormData.category}
          onChange={handleProductChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
      
      {/* Subcategory */}
      <div className="mb-4">
        <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 mb-1">
          Subcategory
        </label>
        <select
          id="subcategory"
          name="subcategory"
          value={productFormData.subcategory}
          onChange={handleProductChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select a subcategory</option>
          {subcategoryOptions.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>
      
      {/* Material Type */}
      <div className="mb-4">
        <label htmlFor="material_type" className="block text-sm font-medium text-gray-700 mb-1">
          Material Type
        </label>
        <select
          id="material_type"
          name="material_type"
          value={productFormData.material_type}
          onChange={handleProductChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select a material type</option>
          {materialTypeOptions.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Unit Price */}
        <div className="mb-4">
          <label htmlFor="unit_price" className="block text-sm font-medium text-gray-700 mb-1">
            Unit Price
          </label>
          <input
            type="number"
            id="unit_price"
            name="unit_price"
            value={productFormData.unit_price}
            onChange={handleProductChange}
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Price per unit"
          />
        </div>
        
        {/* Unit */}
        <div className="mb-4">
          <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
            Unit of Measurement
          </label>
          <select
            id="unit"
            name="unit"
            value={productFormData.unit}
            onChange={handleProductChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a unit</option>
            {unitOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Pricing model field */}
      <div className="mb-4">
        <label htmlFor="pricing_model" className="block text-sm font-medium text-gray-700 mb-1">
          Pricing Model
        </label>
        <select
          id="pricing_model"
          name="pricing_model"
          value={productFormData.pricing_model}
          onChange={handleProductChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="per_unit">Per Unit</option>
          <option value="per_project">Per Project</option>
          <option value="subscription">Subscription</option>
          <option value="custom_quote">Custom Quote</option>
        </select>
      </div>
      
      <div className="mb-4">
        <label htmlFor="emissions_reduction_factor" className="block text-sm font-medium text-gray-700 mb-1">
          Emissions Reduction (%)
        </label>
        <input
          type="number"
          id="emissions_reduction_factor"
          name="emissions_reduction_factor"
          value={productFormData.emissions_reduction_factor}
          onChange={handleProductChange}
          min="1"
          max="100"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g. 20"
        />
      </div>
      
      <div className="mb-4">
        <label htmlFor="implementation_time" className="block text-sm font-medium text-gray-700 mb-1">
          Implementation Time
        </label>
        <input
          type="text"
          id="implementation_time"
          name="implementation_time"
          value={productFormData.implementation_time}
          onChange={handleProductChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Implementation time varies"
        />
      </div>
      
      <div className="mb-4">
        <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-1">
          Image URL (optional)
        </label>
        <input
          type="text"
          id="image_url"
          name="image_url"
          value={productFormData.image_url}
          onChange={handleProductChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="/uploads/images/placeholder-project.jpg"
        />
      </div>
    </>
  );
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Add Your Solution</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex mb-6">
          <button
            type="button"
            className={`mr-4 px-4 py-2 rounded-lg ${formType === 'provider' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
            onClick={() => handleFormTypeChange('provider')}
          >
            Solution Provider
          </button>
          <button
            type="button"
            className={`px-4 py-2 rounded-lg ${formType === 'product' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
            onClick={() => handleFormTypeChange('product')}
          >
            Product
          </button>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{error}</p>
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <p>Your {formType === 'provider' ? 'service provider profile' : 'product'} has been successfully added!</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          {formType === 'provider' ? renderProviderFields() : renderProductFields()}
          
          <button
            type="submit"
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 mt-6"
            disabled={loading}
          >
            {loading ? 'Submitting...' : `Add ${formType === 'provider' ? 'Service Provider' : 'Product'}`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddSolutionForm;