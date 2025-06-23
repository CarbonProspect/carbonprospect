// ServiceProviderProfile.js - Updated component for viewing service provider profiles
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from './AuthSystem';
import { apiCall } from './api-config';

const ServiceProviderProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);
  
  useEffect(() => {
    fetchProviderData();
  }, [id]);
  
  const fetchProviderData = async () => {
    try {
      setLoading(true);
      const data = await apiCall('GET', `/service-providers/${id}`);
      setProvider(data);
    } catch (err) {
      console.error('Error fetching service provider:', err);
      setError('Failed to load service provider profile');
    } finally {
      setLoading(false);
    }
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
  
  // Handle contact button click
  const handleContactClick = () => {
    if (!currentUser) {
      // Redirect to login if not authenticated
      navigate('/login', { state: { from: `/service-providers/${id}` } });
      return;
    }
    setShowContactModal(true);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }
  
  if (error || !provider) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error || 'Provider not found'}</span>
        </div>
        <button
          onClick={() => navigate('/marketplace')}
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
        >
          Back to Marketplace
        </button>
      </div>
    );
  }
  
  const specializations = parseJsonField(provider.specializations);
  const certifications = parseJsonField(provider.certifications);
  const regions = parseJsonField(provider.regions_served);
  const industries = parseJsonField(provider.industries_served);
  const languages = parseJsonField(provider.languages);
  const caseStudies = parseJsonField(provider.case_studies);
  const providerTypes = parseJsonField(provider.provider_types_detail);
  
  const isOwner = currentUser && currentUser.id === provider.user_id;
  
  // Contact Modal Component
  const ContactModal = () => {
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    
    const handleSendMessage = async () => {
      if (!message.trim()) return;
      
      setSending(true);
      try {
        // In a real implementation, this would send an email or notification
        // For now, we'll just show the contact information
        alert(`Message would be sent to: ${provider.contact_email || 'No email provided'}`);
        setShowContactModal(false);
      } catch (err) {
        console.error('Error sending message:', err);
        alert('Failed to send message');
      } finally {
        setSending(false);
      }
    };
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg max-w-lg w-full mx-4 p-6">
          <h3 className="text-lg font-semibold mb-4">Contact {provider.company_name}</h3>
          
          {/* Display contact information if available */}
          <div className="bg-gray-50 rounded p-4 mb-4">
            <h4 className="font-medium text-sm text-gray-700 mb-2">Contact Information:</h4>
            <div className="space-y-1 text-sm">
              {provider.contact_email && (
                <p>
                  <span className="font-medium">Email:</span>{' '}
                  <a href={`mailto:${provider.contact_email}`} className="text-blue-600 hover:underline">
                    {provider.contact_email}
                  </a>
                </p>
              )}
              {provider.contact_phone && (
                <p>
                  <span className="font-medium">Phone:</span>{' '}
                  <a href={`tel:${provider.contact_phone}`} className="text-blue-600 hover:underline">
                    {provider.contact_phone}
                  </a>
                </p>
              )}
              {provider.website && (
                <p>
                  <span className="font-medium">Website:</span>{' '}
                  <a 
                    href={provider.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {provider.website}
                  </a>
                </p>
              )}
              {!provider.contact_email && !provider.contact_phone && (
                <p className="text-gray-500 italic">No direct contact information provided</p>
              )}
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Hello, I'm interested in learning more about your services..."
            />
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowContactModal(false)}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSendMessage}
              disabled={sending || !message.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
            >
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumbs */}
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <Link to="/marketplace" className="hover:text-green-600">Marketplace</Link>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mx-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span>Service Providers</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mx-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-700">{provider.company_name}</span>
        </div>
        
        {/* Header Section */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-8">
          {isOwner && (
            <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-yellow-800">
                  This is your service provider profile (Legacy System)
                </span>
                <div className="flex gap-2">
                  <Link 
                    to={`/profile/${provider.user_id}/edit`}
                    className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                  >
                    Switch to New Profile System
                  </Link>
                  <Link 
                    to={`/service-providers/${id}/edit`}
                    className="text-sm bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
                  >
                    Edit Legacy Profile
                  </Link>
                </div>
              </div>
            </div>
          )}
          
          <div className="px-6 py-5">
            <div className="flex items-start">
              {/* Company Logo/Avatar */}
              <div className="flex-shrink-0 mr-6">
                <div className="h-20 w-20 rounded-full bg-green-600 flex items-center justify-center text-white text-2xl overflow-hidden">
                  {provider.image_url ? (
                    <img 
                      src={provider.image_url} 
                      alt={provider.company_name} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{provider.company_name.substring(0, 2).toUpperCase()}</span>
                  )}
                </div>
              </div>
              
              {/* Company Details */}
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {provider.company_name}
                </h1>
                
                {/* Provider Categories */}
                {providerTypes && providerTypes.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {providerTypes.map((type, index) => (
                      <span 
                        key={index}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          type.is_primary 
                            ? 'bg-green-100 text-green-800 ring-1 ring-green-600' 
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {type.name}
                        {type.parent_name && (
                          <span className="ml-1 text-gray-600">({type.parent_name})</span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  {provider.team_size && (
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {provider.team_size} team
                    </span>
                  )}
                  
                  {provider.years_experience && (
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {provider.years_experience} years
                    </span>
                  )}
                  
                  {provider.availability && (
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {provider.availability.replace('_', ' ')}
                    </span>
                  )}
                </div>
                
                {/* Website and LinkedIn */}
                <div className="flex items-center gap-4 mt-3">
                  {provider.website && (
                    <a 
                      href={provider.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline flex items-center text-sm"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Website
                    </a>
                  )}
                  
                  {provider.linkedin_url && (
                    <a 
                      href={provider.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline flex items-center text-sm"
                    >
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                      </svg>
                      LinkedIn
                    </a>
                  )}
                </div>
              </div>
              
              {/* Contact Button */}
              <div className="flex-shrink-0 ml-6">
                <button 
                  onClick={handleContactClick}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Contact Provider
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">About</h2>
              <p className="text-gray-700 whitespace-pre-line">{provider.description}</p>
            </div>
            
            {/* Specializations */}
            {specializations.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Specializations</h2>
                <div className="flex flex-wrap gap-2">
                  {specializations.map((spec, index) => (
                    <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Certifications */}
            {certifications.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Certifications</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
            
            {/* Case Studies */}
            {caseStudies.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Case Studies</h2>
                <div className="space-y-4">
                  {caseStudies.map((study, index) => (
                    <div key={index} className="border-l-4 border-green-500 pl-4">
                      <h3 className="font-semibold text-gray-800">{study.title}</h3>
                      <p className="text-gray-600 text-sm mt-1">{study.description}</p>
                      {study.results && (
                        <p className="text-green-600 text-sm mt-2">
                          <strong>Results:</strong> {study.results}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Contact Information Card - Only show if user has chosen to display it */}
            {(provider.contact_email || provider.contact_phone) && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
                <div className="space-y-3">
                  {provider.contact_email && (
                    <div>
                      <span className="text-sm text-gray-500">Email:</span>
                      <p className="font-medium">
                        <a 
                          href={`mailto:${provider.contact_email}`}
                          className="text-blue-600 hover:underline"
                        >
                          {provider.contact_email}
                        </a>
                      </p>
                    </div>
                  )}
                  
                  {provider.contact_phone && (
                    <div>
                      <span className="text-sm text-gray-500">Phone:</span>
                      <p className="font-medium">
                        <a 
                          href={`tel:${provider.contact_phone}`}
                          className="text-blue-600 hover:underline"
                        >
                          {provider.contact_phone}
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Pricing Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Pricing</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500">Model:</span>
                  <p className="font-medium capitalize">{provider.pricing_model}</p>
                </div>
                
                {provider.hourly_rate_min && provider.hourly_rate_max && (
                  <div>
                    <span className="text-sm text-gray-500">Hourly Rate:</span>
                    <p className="font-medium">
                      ${provider.hourly_rate_min} - ${provider.hourly_rate_max}
                    </p>
                  </div>
                )}
                
                {provider.project_minimum && (
                  <div>
                    <span className="text-sm text-gray-500">Project Minimum:</span>
                    <p className="font-medium">${provider.project_minimum}</p>
                  </div>
                )}
                
                {provider.response_time && (
                  <div>
                    <span className="text-sm text-gray-500">Response Time:</span>
                    <p className="font-medium capitalize">
                      {provider.response_time.replace('_', ' ')}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Service Areas */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Service Areas</h2>
              
              {regions.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Regions</h3>
                  <div className="flex flex-wrap gap-1">
                    {regions.map((region, index) => (
                      <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {region}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {industries.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Industries</h3>
                  <div className="flex flex-wrap gap-1">
                    {industries.map((industry, index) => (
                      <span key={index} className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        {industry}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Languages */}
            {languages.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Languages</h2>
                <div className="space-y-1">
                  {languages.map((language, index) => (
                    <p key={index} className="text-gray-700">{language}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Contact Modal */}
      {showContactModal && <ContactModal />}
    </div>
  );
};

export default ServiceProviderProfile;