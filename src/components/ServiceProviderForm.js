// src/components/ServiceProviderForm.js - Updated with multiple category selection
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ServiceProviderForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    provider_types: [], // Changed from provider_type to provider_types (array)
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

  // Input states for array fields
  const [specializationInput, setSpecializationInput] = useState('');
  const [certificationInput, setCertificationInput] = useState('');
  const [regionInput, setRegionInput] = useState('');
  const [industryInput, setIndustryInput] = useState('');
  const [languageInput, setLanguageInput] = useState('');

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle provider type selection (checkbox)
  const handleProviderTypeToggle = (typeId, typeName, parentName) => {
    setFormData(prev => {
      const currentTypes = [...prev.provider_types];
      const existingIndex = currentTypes.findIndex(t => t.id === typeId);
      
      if (existingIndex > -1) {
        // Remove if already selected
        currentTypes.splice(existingIndex, 1);
      } else {
        // Add if not selected
        currentTypes.push({
          id: typeId,
          name: typeName,
          parent: parentName
        });
      }
      
      return {
        ...prev,
        provider_types: currentTypes
      };
    });
  };

  const isProviderTypeSelected = (typeId) => {
    return formData.provider_types.some(t => t.id === typeId);
  };

  const addArrayItem = (field, input, setInput) => {
    if (input.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], input.trim()]
      }));
      setInput('');
    }
  };

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare data with provider_types as an array of IDs
      const submitData = {
        ...formData,
        provider_types: formData.provider_types.map(t => t.id) // Send only the IDs
      };

      const response = await axios.post('/api/service-providers', submitData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      alert('Service provider profile created successfully!');
      navigate('/marketplace?tab=providers');
    } catch (error) {
      console.error('Error creating profile:', error);
      alert(error.response?.data?.message || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  const regions = [
    'Global', 'North America', 'South America', 'Europe', 'Asia', 'Africa', 'Oceania',
    'United States', 'Canada', 'Mexico', 'Brazil', 'United Kingdom', 'Germany', 'France',
    'China', 'India', 'Japan', 'Australia', 'South Africa'
  ];

  const industries = [
    'Energy', 'Manufacturing', 'Transportation', 'Agriculture', 'Forestry',
    'Technology', 'Finance', 'Real Estate', 'Retail', 'Healthcare',
    'Construction', 'Mining', 'Oil & Gas', 'Renewable Energy', 'Waste Management'
  ];

  const languages = [
    'English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 
    'Portuguese', 'Arabic', 'Hindi', 'Russian', 'Italian', 'Korean'
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Register as a Service Provider</h1>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Provider Types * (Select all that apply)</label>
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                {categories.map(cat => (
                  <div key={cat.id} className="mb-4">
                    <h3 className="font-semibold text-gray-800 mb-2 text-sm uppercase tracking-wide">
                      {cat.category_name}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {cat.subcategories.map(sub => (
                        <label 
                          key={sub.id} 
                          className={`flex items-start p-2 rounded cursor-pointer hover:bg-gray-100 transition-colors ${
                            isProviderTypeSelected(sub.id) ? 'bg-blue-50 border-blue-300' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isProviderTypeSelected(sub.id)}
                            onChange={() => handleProviderTypeToggle(sub.id, sub.category_name, cat.category_name)}
                            className="mt-1 mr-2"
                          />
                          <div className="flex-1">
                            <span className="text-sm font-medium">{sub.category_name}</span>
                            {sub.description && (
                              <p className="text-xs text-gray-600 mt-0.5">{sub.description}</p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {formData.provider_types.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm text-gray-600 mb-2">Selected: {formData.provider_types.length} type(s)</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.provider_types.map((type, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {type.parent} - {type.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Company Name *</label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleInputChange}
                required
                className="w-full p-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
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
                {formData.specializations.map((spec, index) => (
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
                {formData.certifications.map((cert, index) => (
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
                  value={formData.years_experience}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full p-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Team Size</label>
                <select
                  name="team_size"
                  value={formData.team_size}
                  onChange={handleInputChange}
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
                  {regions.map(region => (
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
                {formData.regions_served.map((region, index) => (
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
                  {industries.map(industry => (
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
                {formData.industries_served.map((industry, index) => (
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
                  {languages.map(language => (
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
                {formData.languages.map((language, index) => (
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
                value={formData.pricing_model}
                onChange={handleInputChange}
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

            {formData.pricing_model === 'hourly' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Hourly Rate (Min)</label>
                  <input
                    type="number"
                    name="hourly_rate_min"
                    value={formData.hourly_rate_min}
                    onChange={handleInputChange}
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
                    value={formData.hourly_rate_max}
                    onChange={handleInputChange}
                    min="0"
                    step="10"
                    placeholder="$"
                    className="w-full p-2 border rounded-md"
                  />
                </div>
              </>
            )}

            {(formData.pricing_model === 'project' || formData.pricing_model === 'hybrid') && (
              <div>
                <label className="block text-sm font-medium mb-2">Minimum Project Size</label>
                <input
                  type="number"
                  name="project_minimum"
                  value={formData.project_minimum}
                  onChange={handleInputChange}
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
                value={formData.availability}
                onChange={handleInputChange}
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
                value={formData.response_time}
                onChange={handleInputChange}
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
                value={formData.website}
                onChange={handleInputChange}
                placeholder="https://www.example.com"
                className="w-full p-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">LinkedIn Profile</label>
              <input
                type="url"
                name="linkedin_url"
                value={formData.linkedin_url}
                onChange={handleInputChange}
                placeholder="https://www.linkedin.com/in/username"
                className="w-full p-2 border rounded-md"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Profile Image URL</label>
              <input
                type="url"
                name="image_url"
                value={formData.image_url}
                onChange={handleInputChange}
                placeholder="https://example.com/image.jpg"
                className="w-full p-2 border rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/marketplace')}
            className="px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || formData.provider_types.length === 0}
            className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ServiceProviderForm;