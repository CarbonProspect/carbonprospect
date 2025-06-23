import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, getValidToken } from './AuthSystem';
import { apiCall } from './api-config';

const ProfileEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, currentUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileType, setProfileType] = useState('provider');
  
  // Form data state
  const [formData, setFormData] = useState({
    // Common fields
    organization_name: '',
    company_name: '',
    company_description: '',
    organization_type: '',
    provider_type: '',
    entry_type: 'service_provider',
    headquarters_country: '',
    headquarters_city: '',
    industry: '',
    website: '',
    founded_year: null,
    
    // Developer-specific fields
    regions: [],
    project_types: [],
    carbon_goals: {},
    budget_range: '',
    project_timeline: {},
    decision_makers: [],
    previous_projects: [],
    
    // Provider-specific fields
    company_size: '',
    services: [],
    specializations: [],
    certifications: [],
    team_size: '',
    years_experience: null,
    pricing_model: '',
    hourly_rate_min: null,
    hourly_rate_max: null,
    project_minimum: null,
    availability: '',
    languages: [],
    social_profiles: {
      linkedin: '',
      twitter: '',
      facebook: '',
      instagram: ''
    },
    contact_info: {
      contact_name: '',
      contact_email: '',
      contact_phone: '',
      contact_position: ''
    },
    
    // Visibility settings for all profile types
    visibility_settings: {
      publicProfile: true,
      showContactInfo: true,
      showFinancials: false,
      showProjects: true
    }
  });
  
  // Options for dropdowns
  // Developer profiles have different allowed organization types due to database constraint
  // IMPORTANT: These must be lowercase to match the database constraint
  const developerOrganizationTypes = [
    { value: 'corporation', label: 'Corporation' },
    { value: 'government', label: 'Government' },
    { value: 'ngo', label: 'NGO' },
    { value: 'academic', label: 'Academic' },
    { value: 'other', label: 'Other' }
  ];
  
  const providerOrganizationTypes = [
    'Private Company',
    'Public Company',
    'NGO/Non-profit',
    'Government Agency',
    'Academic Institution',
    'International Organization',
    'Partnership',
    'Individual/Sole Proprietor',
    'Other'
  ];
  
  const providerTypes = [
    'Service Provider',
    'Technology Provider',
    'Consultant',
    'Verification Body',
    'Investor',
    'Other'
  ];
  
  const industryOptions = [
    'Energy',
    'Agriculture & Forestry',
    'Manufacturing',
    'Transportation',
    'Construction',
    'Waste Management',
    'Technology',
    'Consulting',
    'Finance & Investment',
    'Real Estate',
    'Mining',
    'Consumer Goods',
    'Retail',
    'Education',
    'Healthcare',
    'Government',
    'Other'
  ];
  
  const companySizeOptions = [
    'Self-employed',
    'Small (1-50 employees)',
    'Medium (51-250 employees)',
    'Large (251-1000 employees)',
    'Enterprise (1000+ employees)'
  ];
  
  const regionOptions = [
    'North America',
    'South America',
    'Europe',
    'Africa',
    'Middle East',
    'Asia',
    'Australia & Oceania',
    'Global'
  ];
  
  const projectTypeOptions = [
    'Forestry & Conservation',
    'Renewable Energy',
    'Energy Efficiency',
    'Methane Capture',
    'Agricultural',
    'Industrial Emissions Reduction',
    'Transportation',
    'Blue Carbon',
    'Waste Management',
    'Direct Air Capture',
    'Other'
  ];
  
  const certificationOptions = [
    'Gold Standard',
    'Verra/VCS',
    'American Carbon Registry',
    'Climate Action Reserve',
    'Plan Vivo',
    'CDM',
    'ISO 14064',
    'ISO 14001',
    'CORSIA',
    'Article 6.2 Paris Agreement',
    'ACCU (Australian Carbon Credit Units)',
    'Other'
  ];
  
  // Fetch profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!isAuthenticated) {
        setError('You must be logged in to edit a profile');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        console.log(`Fetching profile data for ID: ${id}`);
        
        // Use the unified endpoint
        const profileData = await apiCall('GET', `/profiles/unified/${id}`);
        console.log('Unified profile data:', profileData);
        
        if (profileData.profile_type === 'none') {
          // Handle case where user has no profile
          if (profileData.user_exists && profileData.user_info && currentUser && currentUser.id === parseInt(id)) {
            // This is the current user without a profile - allow them to create one
            setProfileType(profileData.suggested_profile_type || 'provider');
            
            // Pre-populate with user data
            setFormData(prev => ({
              ...prev,
              organization_name: currentUser.organizationName || currentUser.companyName || '',
              company_name: currentUser.companyName || currentUser.organizationName || '',
              industry: currentUser.industry || '',
              regions: Array.isArray(currentUser.regions) ? currentUser.regions : [],
              contact_info: {
                ...prev.contact_info,
                contact_name: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim(),
                contact_email: currentUser.email || ''
              }
            }));
            setLoading(false);
            return;
          } else {
            setError('No profile found for editing');
            setLoading(false);
            return;
          }
        }
        
        setProfileType(profileData.profile_type);
        
        // The unified endpoint already parses JSON fields, so we don't need to parse them again
        setFormData({
          // Common fields
          organization_name: profileData.organization_name || profileData.company_name || '',
          company_name: profileData.company_name || profileData.organization_name || '',
          company_description: profileData.company_description || '',
          organization_type: profileData.organization_type || '',
          provider_type: profileData.provider_type || 'Service Provider',
          entry_type: profileData.entry_type || 'service_provider',
          headquarters_country: profileData.headquarters_country || '',
          headquarters_city: profileData.headquarters_city || '',
          industry: profileData.industry || '',
          website: profileData.website || '',
          founded_year: profileData.founded_year || null,
          
          // Developer-specific fields
          regions: profileData.regions || [],
          project_types: profileData.project_types || [],
          carbon_goals: profileData.carbon_goals || {},
          budget_range: profileData.budget_range || '',
          project_timeline: profileData.project_timeline || {},
          decision_makers: profileData.decision_makers || [],
          previous_projects: profileData.previous_projects || [],
          
          // Provider-specific fields
          company_size: profileData.company_size || '',
          services: profileData.services || [],
          specializations: profileData.specializations || [],
          certifications: profileData.certifications || [],
          team_size: profileData.team_size || '',
          years_experience: profileData.years_experience || null,
          pricing_model: profileData.pricing_model || '',
          hourly_rate_min: profileData.hourly_rate_min || null,
          hourly_rate_max: profileData.hourly_rate_max || null,
          project_minimum: profileData.project_minimum || null,
          availability: profileData.availability || '',
          languages: profileData.languages || [],
          social_profiles: profileData.social_profiles || {
            linkedin: '',
            twitter: '',
            facebook: '',
            instagram: ''
          },
          contact_info: profileData.contact_info || {
            contact_name: '',
            contact_email: '',
            contact_phone: '',
            contact_position: ''
          },
          
          // Visibility settings for all profile types
          visibility_settings: profileData.visibility_settings || {
            publicProfile: true,
            showContactInfo: true,
            showFinancials: false,
            showProjects: true
          }
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError('Failed to load profile data: ' + (err.message || 'Unknown error'));
        setLoading(false);
      }
    };
    
    fetchProfileData();
  }, [id, isAuthenticated, currentUser]);
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      // Handle nested objects like contact_info.contact_name
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else if (type === 'checkbox') {
      // Handle checkbox inputs
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (name === 'founded_year' || name === 'years_experience' || 
               name === 'hourly_rate_min' || name === 'hourly_rate_max' || 
               name === 'project_minimum') {
      // Special handling for numeric fields to ensure they're null when empty
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? null : Number(value)
      }));
    } else if (name === 'website' && type === 'url') {
      // Special handling for website field - auto-add https:// if needed
      let websiteValue = value;
      if (value && !value.startsWith('http://') && !value.startsWith('https://')) {
        // Don't auto-add protocol while typing, let user type naturally
        websiteValue = value;
      }
      setFormData(prev => ({
        ...prev,
        [name]: websiteValue
      }));
    } else {
      // Handle regular inputs
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Helper function to format URL for submission
  const formatUrl = (url) => {
    if (!url) return url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return 'https://' + url;
    }
    return url;
  };
  
  // Handle multi-select fields like regions, project_types, certifications
  const handleMultiSelectChange = (field, value) => {
    setFormData(prev => {
      // If the value is already in the array, remove it
      if (prev[field].includes(value)) {
        return {
          ...prev,
          [field]: prev[field].filter(item => item !== value)
        };
      } 
      // Otherwise, add it
      else {
        return {
          ...prev,
          [field]: [...prev[field], value]
        };
      }
    });
  };
  
  // Handle visibility settings changes
  const handleVisibilityChange = (setting) => {
    setFormData(prev => ({
      ...prev,
      visibility_settings: {
        ...prev.visibility_settings,
        [setting]: !prev.visibility_settings[setting]
      }
    }));
  };
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous messages
    setSaveError(null);
    setSaveSuccess(false);
    
    // Validate form
    if (profileType === 'provider' && !formData.company_name && !formData.organization_name) {
      setSaveError('Company or organization name is required');
      return;
    } else if (profileType === 'developer' && !formData.organization_name) {
      setSaveError('Organization name is required');
      return;
    }
    
    // Additional validation for developer profiles
    if (profileType === 'developer' && !formData.organization_type) {
      setSaveError('Organization type is required for developer profiles');
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Determine which endpoint to use based on profile type
      let endpoint = '';
      if (profileType === 'developer') {
        endpoint = `/profiles/developer/${id}`;
      } else if (profileType === 'provider') {
        endpoint = `/profiles/provider/${id}`;
      } else if (profileType === 'consultant') {
        endpoint = `/profiles/consultant/${id}`;
      }
      
      // Prepare data for submission based on profile type
      let dataToSend = { ...formData };
      
      console.log('Initial data before processing:', dataToSend);
      
      // Format URLs to include protocol if missing
      if (dataToSend.website) {
        dataToSend.website = formatUrl(dataToSend.website);
      }
      if (dataToSend.social_profiles) {
        if (dataToSend.social_profiles.linkedin) {
          dataToSend.social_profiles.linkedin = formatUrl(dataToSend.social_profiles.linkedin);
        }
        if (dataToSend.social_profiles.twitter) {
          dataToSend.social_profiles.twitter = formatUrl(dataToSend.social_profiles.twitter);
        }
        if (dataToSend.social_profiles.facebook) {
          dataToSend.social_profiles.facebook = formatUrl(dataToSend.social_profiles.facebook);
        }
        if (dataToSend.social_profiles.instagram) {
          dataToSend.social_profiles.instagram = formatUrl(dataToSend.social_profiles.instagram);
        }
      }
      
      // For providers, ensure both organization_name and company_name are set
      if (profileType === 'provider') {
        if (dataToSend.company_name && !dataToSend.organization_name) {
          dataToSend.organization_name = dataToSend.company_name;
        } else if (dataToSend.organization_name && !dataToSend.company_name) {
          dataToSend.company_name = dataToSend.organization_name;
        }
      }
      
      // Map organization type values for developer profiles
      if (profileType === 'developer' && dataToSend.organization_type) {
        // The database expects lowercase values for developer profiles
        const orgTypeMapping = {
          'Corporation': 'corporation',
          'Government': 'government',
          'NGO': 'ngo',
          'Academic': 'academic',
          'Other': 'other',
          // Also handle if it's already in the correct format
          'corporation': 'corporation',
          'government': 'government',
          'ngo': 'ngo',
          'academic': 'academic',
          'other': 'other'
        };
        
        // If the value doesn't match any mapping, use it as-is (converted to lowercase)
        dataToSend.organization_type = orgTypeMapping[dataToSend.organization_type] || dataToSend.organization_type.toLowerCase();
        console.log('Mapped organization_type:', dataToSend.organization_type);
      }
      
      // IMPORTANT: Send all visibility settings, not just the mapped ones
      // The backend expects the full visibility_settings object
      const fullVisibilitySettings = {
        publicProfile: dataToSend.visibility_settings.publicProfile || true,
        showContactInfo: dataToSend.visibility_settings.showContactInfo || true,
        showFinancials: dataToSend.visibility_settings.showFinancials || false,
        showProjects: dataToSend.visibility_settings.showProjects || true,
        // Also include the backend field names for compatibility
        contactInfo: dataToSend.visibility_settings.showContactInfo || true,
        financialInfo: dataToSend.visibility_settings.showFinancials || false,
        projectHistory: dataToSend.visibility_settings.showProjects || true
      };
      
      // Clean the data based on profile type
      if (profileType === 'developer') {
        dataToSend = {
          organization_name: dataToSend.organization_name,
          organization_type: dataToSend.organization_type,
          headquarters_country: dataToSend.headquarters_country || '',
          headquarters_city: dataToSend.headquarters_city || '',
          industry: dataToSend.industry || '',
          website: dataToSend.website || '',
          founded_year: dataToSend.founded_year,
          company_description: dataToSend.company_description || '',
          regions: dataToSend.regions || [],
          project_types: dataToSend.project_types || [],
          carbon_goals: dataToSend.carbon_goals || {},
          budget_range: dataToSend.budget_range || '',
          project_timeline: dataToSend.project_timeline || {},
          decision_makers: dataToSend.decision_makers || [],
          previous_projects: dataToSend.previous_projects || [],
          visibility_settings: fullVisibilitySettings,
          // Include contact_info and social_profiles for developer profiles too
          contact_info: dataToSend.contact_info || {},
          social_profiles: dataToSend.social_profiles || {}
        };
      } else if (profileType === 'provider') {
        dataToSend = {
          company_name: dataToSend.company_name,
          organization_name: dataToSend.organization_name || dataToSend.company_name,
          company_description: dataToSend.company_description || '',
          company_size: dataToSend.company_size || '',
          provider_type: dataToSend.provider_type || 'Service Provider',
          entry_type: dataToSend.entry_type || 'service_provider',
          headquarters_country: dataToSend.headquarters_country || '',
          headquarters_city: dataToSend.headquarters_city || '',
          website: dataToSend.website || '',
          founded_year: dataToSend.founded_year,
          industry: dataToSend.industry || '',
          regions: dataToSend.regions || [],
          services: dataToSend.services || [],
          specializations: dataToSend.specializations || [],
          certifications: dataToSend.certifications || [],
          team_size: dataToSend.team_size || '',
          years_experience: dataToSend.years_experience,
          pricing_model: dataToSend.pricing_model || '',
          hourly_rate_min: dataToSend.hourly_rate_min,
          hourly_rate_max: dataToSend.hourly_rate_max,
          project_minimum: dataToSend.project_minimum,
          availability: dataToSend.availability || '',
          languages: dataToSend.languages || [],
          social_profiles: dataToSend.social_profiles || {},
          contact_info: dataToSend.contact_info || {},
          visibility_settings: fullVisibilitySettings
        };
      } else {
        dataToSend.visibility_settings = fullVisibilitySettings;
      }
      
      // Special handling for numeric fields - ensure null instead of empty strings
      if (dataToSend.founded_year === '') {
        dataToSend.founded_year = null;
      }
      if (dataToSend.years_experience === '') {
        dataToSend.years_experience = null;
      }
      if (dataToSend.hourly_rate_min === '') {
        dataToSend.hourly_rate_min = null;
      }
      if (dataToSend.hourly_rate_max === '') {
        dataToSend.hourly_rate_max = null;
      }
      if (dataToSend.project_minimum === '') {
        dataToSend.project_minimum = null;
      }
      
      console.log(`Submitting to endpoint: ${endpoint}`);
      console.log('Final data being sent:', dataToSend);
      
      // Send profile update request using apiCall
      try {
        const updatedProfile = await apiCall('PUT', endpoint, dataToSend);
        console.log('Profile updated successfully:', updatedProfile);
        
        // Update successful
        setSaveSuccess(true);
        setIsSaving(false);
        
        // Redirect to profile view after 2 seconds
        setTimeout(() => {
          navigate(`/profile/${id}`);
        }, 2000);
      } catch (apiError) {
        console.error('API Error details:', {
          message: apiError.message,
          status: apiError.status,
          code: apiError.code,
          fullError: apiError
        });
        throw apiError;
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setSaveError('Failed to update profile: ' + (err.message || 'Unknown error'));
      setIsSaving(false);
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
        <div className="text-center">
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  // Check if current user is the profile owner
  const isProfileOwner = currentUser && (currentUser.id == id || String(currentUser.id) === id);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Edit {profileType === 'developer' ? 'Developer' : profileType === 'provider' ? 'Provider' : 'Consultant'} Profile
        </h1>
        
        {/* Save status messages */}
        {saveError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {saveError}</span>
          </div>
        )}
        
        {saveSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6">
            <strong className="font-bold">Success:</strong>
            <span className="block sm:inline"> Profile updated successfully! Redirecting...</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
          {/* FORM STATE DEBUG - Remove after testing */}
          {isProfileOwner && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-bold text-blue-800 mb-2">Form State Debug</h3>
              <div className="text-xs font-mono space-y-2">
                <p><strong>Website:</strong> "{formData.website}"</p>
                <p><strong>Contact Email:</strong> "{formData.contact_info.contact_email}"</p>
                <p><strong>Contact Name:</strong> "{formData.contact_info.contact_name}"</p>
                <p><strong>LinkedIn:</strong> "{formData.social_profiles.linkedin}"</p>
                <p><strong>Visibility Settings:</strong></p>
                <pre>{JSON.stringify(formData.visibility_settings, null, 2)}</pre>
              </div>
            </div>
          )}
          
          {/* Basic Information Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profileType === 'provider' ? (
                <div>
                  <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name*
                  </label>
                  <input
                    type="text"
                    id="company_name"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label htmlFor="organization_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Organization Name*
                  </label>
                  <input
                    type="text"
                    id="organization_name"
                    name="organization_name"
                    value={formData.organization_name}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
              )}
              
              {profileType === 'provider' && (
                <div>
                  <label htmlFor="provider_type" className="block text-sm font-medium text-gray-700 mb-1">
                    Provider Type
                  </label>
                  <select
                    id="provider_type"
                    name="provider_type"
                    value={formData.provider_type}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Select Provider Type</option>
                    {providerTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div>
                <label htmlFor="organization_type" className="block text-sm font-medium text-gray-700 mb-1">
                  Organization Type{profileType === 'developer' && '*'}
                </label>
                <select
                  id="organization_type"
                  name="organization_type"
                  value={formData.organization_type}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border border-gray-300 rounded-md px-3 py-2"
                  required={profileType === 'developer'}
                >
                  <option value="">Select Organization Type</option>
                  {profileType === 'developer' ? (
                    developerOrganizationTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))
                  ) : (
                    providerOrganizationTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))
                  )}
                </select>
              </div>
              
              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
                  Industry
                </label>
                <select
                  id="industry"
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Select Industry</option>
                  {industryOptions.map(industry => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="founded_year" className="block text-sm font-medium text-gray-700 mb-1">
                  Year Founded
                </label>
                <input
                  type="number"
                  id="founded_year"
                  name="founded_year"
                  value={formData.founded_year || ''}
                  onChange={handleChange}
                  min="1800"
                  max={new Date().getFullYear()}
                  className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border border-gray-300 rounded-md px-3 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">Leave blank if not applicable</p>
              </div>
              
              <div>
                <label htmlFor="headquarters_country" className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  id="headquarters_country"
                  name="headquarters_country"
                  value={formData.headquarters_country}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              
              <div>
                <label htmlFor="headquarters_city" className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  id="headquarters_city"
                  name="headquarters_city"
                  value={formData.headquarters_city}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              
              <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  type="text"
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="example.com or https://example.com"
                  className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border border-gray-300 rounded-md px-3 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">URL will be automatically formatted with https://</p>
              </div>
              
              {profileType === 'provider' && (
                <div>
                  <label htmlFor="company_size" className="block text-sm font-medium text-gray-700 mb-1">
                    Company Size
                  </label>
                  <select
                    id="company_size"
                    name="company_size"
                    value={formData.company_size}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Select Company Size</option>
                    {companySizeOptions.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            <div className="mt-4">
              <label htmlFor="company_description" className="block text-sm font-medium text-gray-700 mb-1">
                Organization Description
              </label>
              <textarea
                id="company_description"
                name="company_description"
                value={formData.company_description}
                onChange={handleChange}
                rows="4"
                className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border border-gray-300 rounded-md px-3 py-2"
                placeholder="Describe your organization, mission, and expertise..."
              ></textarea>
            </div>
          </div>
          
          {/* Contact Information Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Contact Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="contact_info.contact_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  id="contact_info.contact_name"
                  name="contact_info.contact_name"
                  value={formData.contact_info.contact_name}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              
              <div>
                <label htmlFor="contact_info.contact_position" className="block text-sm font-medium text-gray-700 mb-1">
                  Position/Title
                </label>
                <input
                  type="text"
                  id="contact_info.contact_position"
                  name="contact_info.contact_position"
                  value={formData.contact_info.contact_position}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              
              <div>
                <label htmlFor="contact_info.contact_email" className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  id="contact_info.contact_email"
                  name="contact_info.contact_email"
                  value={formData.contact_info.contact_email}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              
              <div>
                <label htmlFor="contact_info.contact_phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  id="contact_info.contact_phone"
                  name="contact_info.contact_phone"
                  value={formData.contact_info.contact_phone}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Social Media Profiles
              </label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="social_profiles.linkedin" className="block text-sm font-medium text-gray-500 mb-1">
                    LinkedIn
                  </label>
                  <input
                    type="text"
                    id="social_profiles.linkedin"
                    name="social_profiles.linkedin"
                    value={formData.social_profiles.linkedin || ''}
                    onChange={handleChange}
                    placeholder="linkedin.com/company/..."
                    className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                
                <div>
                  <label htmlFor="social_profiles.twitter" className="block text-sm font-medium text-gray-500 mb-1">
                    Twitter
                  </label>
                  <input
                    type="text"
                    id="social_profiles.twitter"
                    name="social_profiles.twitter"
                    value={formData.social_profiles.twitter || ''}
                    onChange={handleChange}
                    placeholder="twitter.com/..."
                    className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Provider-specific fields */}
          {profileType === 'provider' && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Service Provider Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="services" className="block text-sm font-medium text-gray-700 mb-1">
                    Services Offered
                  </label>
                  <textarea
                    id="services"
                    name="services"
                    value={Array.isArray(formData.services) ? formData.services.join('\n') : ''}
                    onChange={(e) => {
                      const servicesArray = e.target.value.split('\n').filter(s => s.trim());
                      setFormData(prev => ({
                        ...prev,
                        services: servicesArray
                      }));
                    }}
                    rows="4"
                    className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Enter each service on a new line..."
                  />
                  <p className="text-xs text-gray-500 mt-1">One service per line</p>
                </div>
                
                <div>
                  <label htmlFor="specializations" className="block text-sm font-medium text-gray-700 mb-1">
                    Specializations
                  </label>
                  <textarea
                    id="specializations"
                    name="specializations"
                    value={Array.isArray(formData.specializations) ? formData.specializations.join('\n') : ''}
                    onChange={(e) => {
                      const specializationsArray = e.target.value.split('\n').filter(s => s.trim());
                      setFormData(prev => ({
                        ...prev,
                        specializations: specializationsArray
                      }));
                    }}
                    rows="4"
                    className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Enter each specialization on a new line..."
                  />
                  <p className="text-xs text-gray-500 mt-1">One specialization per line</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label htmlFor="team_size" className="block text-sm font-medium text-gray-700 mb-1">
                    Team Size
                  </label>
                  <input
                    type="text"
                    id="team_size"
                    name="team_size"
                    value={formData.team_size || ''}
                    onChange={handleChange}
                    placeholder="e.g., 10-50"
                    className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                
                <div>
                  <label htmlFor="years_experience" className="block text-sm font-medium text-gray-700 mb-1">
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    id="years_experience"
                    name="years_experience"
                    value={formData.years_experience || ''}
                    onChange={handleChange}
                    min="0"
                    className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label htmlFor="pricing_model" className="block text-sm font-medium text-gray-700 mb-1">
                    Pricing Model
                  </label>
                  <select
                    id="pricing_model"
                    name="pricing_model"
                    value={formData.pricing_model || ''}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Select Pricing Model</option>
                    <option value="hourly">Hourly</option>
                    <option value="project">Project-based</option>
                    <option value="retainer">Retainer</option>
                    <option value="subscription">Subscription</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="availability" className="block text-sm font-medium text-gray-700 mb-1">
                    Availability
                  </label>
                  <select
                    id="availability"
                    name="availability"
                    value={formData.availability || ''}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Select Availability</option>
                    <option value="immediate">Immediate</option>
                    <option value="within_week">Within a week</option>
                    <option value="within_month">Within a month</option>
                    <option value="unavailable">Currently unavailable</option>
                  </select>
                </div>
              </div>
              
              {formData.pricing_model === 'hourly' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label htmlFor="hourly_rate_min" className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Hourly Rate ($)
                    </label>
                    <input
                      type="number"
                      id="hourly_rate_min"
                      name="hourly_rate_min"
                      value={formData.hourly_rate_min || ''}
                      onChange={handleChange}
                      min="0"
                      step="10"
                      className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="hourly_rate_max" className="block text-sm font-medium text-gray-700 mb-1">
                      Maximum Hourly Rate ($)
                    </label>
                    <input
                      type="number"
                      id="hourly_rate_max"
                      name="hourly_rate_max"
                      value={formData.hourly_rate_max || ''}
                      onChange={handleChange}
                      min="0"
                      step="10"
                      className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>
              )}
              
              <div className="mt-4">
                <label htmlFor="project_minimum" className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Project Size ($)
                </label>
                <input
                  type="number"
                  id="project_minimum"
                  name="project_minimum"
                  value={formData.project_minimum || ''}
                  onChange={handleChange}
                  min="0"
                  step="1000"
                  className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>
          )}
          
          {/* Regions & Expertise Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Regions & Expertise</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Regions of Operation
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {regionOptions.map(region => (
                  <div key={region} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`region-${region}`}
                      checked={formData.regions.includes(region)}
                      onChange={() => handleMultiSelectChange('regions', region)}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`region-${region}`} className="ml-2 block text-sm text-gray-700">
                      {region}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            {(profileType === 'developer' || profileType === 'provider') && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Types
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {projectTypeOptions.map(type => (
                    <div key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`project-type-${type}`}
                        checked={formData.project_types.includes(type)}
                        onChange={() => handleMultiSelectChange('project_types', type)}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`project-type-${type}`} className="ml-2 block text-sm text-gray-700">
                        {type}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {profileType === 'provider' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Certifications & Standards
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {certificationOptions.map(cert => (
                    <div key={cert} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`cert-${cert}`}
                        checked={formData.certifications.includes(cert)}
                        onChange={() => handleMultiSelectChange('certifications', cert)}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`cert-${cert}`} className="ml-2 block text-sm text-gray-700">
                        {cert}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {profileType === 'provider' && (
              <>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Languages Spoken
                  </label>
                  <textarea
                    id="languages"
                    name="languages"
                    value={Array.isArray(formData.languages) ? formData.languages.join('\n') : ''}
                    onChange={(e) => {
                      const languagesArray = e.target.value.split('\n').filter(l => l.trim());
                      setFormData(prev => ({
                        ...prev,
                        languages: languagesArray
                      }));
                    }}
                    rows="3"
                    className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Enter each language on a new line (e.g., English, Spanish, Mandarin)..."
                  />
                  <p className="text-xs text-gray-500 mt-1">One language per line</p>
                </div>
              </>
            )}
          </div>
          
          {/* Privacy & Visibility Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Privacy & Visibility</h2>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="visibility_settings.publicProfile"
                  checked={formData.visibility_settings.publicProfile}
                  onChange={() => handleVisibilityChange('publicProfile')}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="visibility_settings.publicProfile" className="ml-2 block text-sm text-gray-700">
                  Make profile visible in public directory
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="visibility_settings.showContactInfo"
                  checked={formData.visibility_settings.showContactInfo}
                  onChange={() => handleVisibilityChange('showContactInfo')}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="visibility_settings.showContactInfo" className="ml-2 block text-sm text-gray-700">
                  Show contact information publicly
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="visibility_settings.showFinancials"
                  checked={formData.visibility_settings.showFinancials}
                  onChange={() => handleVisibilityChange('showFinancials')}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="visibility_settings.showFinancials" className="ml-2 block text-sm text-gray-700">
                  Show financial information (budget, funding, etc.)
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="visibility_settings.showProjects"
                  checked={formData.visibility_settings.showProjects}
                  onChange={() => handleVisibilityChange('showProjects')}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="visibility_settings.showProjects" className="ml-2 block text-sm text-gray-700">
                  Show projects on profile
                </label>
              </div>
            </div>
          </div>
          
          {/* Form Submission Section */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate(`/profile/${id}`)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                'Save Profile'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileEdit;