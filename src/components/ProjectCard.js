import React from 'react';
import { getEligibleMarketsForProject, getBilateralMarketData } from '../ComplianceMarketManager';

const ProjectCard = ({ project, isSaved, onSave, onRemove, isArticle6 }) => {
  // Get eligible markets for this project
  const markets = getBilateralMarketData();
  // For regular projects, use eligibility check
  // For Article 6 projects, find markets based on buyingParty
  const eligibleMarkets = isArticle6 
    ? markets.filter(market => market.buyingParty === project.buyingParty)
    : getEligibleMarketsForProject(project, markets);
  
  // Function to handle image loading error
  const handleImageError = (e) => {
    e.target.src = '/uploads/images/placeholder-project.jpg'; // Fallback image - FIXED PATH
  };
  
  // FIXED: Function to get the correct profile URL based on user role
  const getProfileUrl = (userId) => {
    // Use the unified profile endpoint that handles routing automatically
    return `/profiles/${userId}`;
  };
  
  // Function to get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Draft':
        return 'bg-gray-100 text-gray-800';
      case 'Seeking Partners':
        return 'bg-blue-100 text-blue-800';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'Completed':
        return 'bg-purple-100 text-purple-800';
      case 'Archived':
        return 'bg-red-100 text-red-800';
      case 'Implementation':
        return 'bg-indigo-100 text-indigo-800';
      case 'Development':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Function to get verification status badge
  const getVerificationBadge = (status) => {
    if (!status) return null;
    
    const badgeClasses = {
      'unverified': 'bg-gray-100 text-gray-800',
      'validation': 'bg-blue-100 text-blue-800',
      'validated': 'bg-teal-100 text-teal-800',
      'verification': 'bg-yellow-100 text-yellow-800',
      'verified': 'bg-green-100 text-green-800',
      'registered': 'bg-purple-100 text-purple-800',
      'issuance': 'bg-indigo-100 text-indigo-800'
    };
    
    const badgeLabels = {
      'unverified': 'Unverified',
      'validation': 'Validation',
      'validated': 'Validated',
      'verification': 'Verification',
      'verified': 'Verified',
      'registered': 'Registered',
      'issuance': 'Credits Issued'
    };
    
    const bgClass = badgeClasses[status] || 'bg-gray-100 text-gray-800';
    const label = badgeLabels[status] || status;
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${bgClass}`}>
        {label}
      </span>
    );
  };
  
  // Helper function to safely parse JSON fields
  const parseJsonField = (field, defaultValue = []) => {
    if (!field) return defaultValue;
    if (Array.isArray(field)) return field;
    
    try {
      return JSON.parse(field);
    } catch (e) {
      return defaultValue;
    }
  };
  
  // Convert SDG IDs to SDG names for display
  const sdgMap = {
    '1': 'No Poverty',
    '2': 'Zero Hunger',
    '3': 'Good Health',
    '4': 'Quality Education',
    '5': 'Gender Equality',
    '6': 'Clean Water',
    '7': 'Clean Energy',
    '8': 'Decent Work',
    '9': 'Industry & Innovation',
    '10': 'Reduced Inequalities',
    '11': 'Sustainable Cities',
    '12': 'Responsible Consumption',
    '13': 'Climate Action',
    '14': 'Life Below Water',
    '15': 'Life On Land',
    '16': 'Peace & Justice',
    '17': 'Partnerships'
  };
  
  // Parse SDG goals and co-benefits
  // For Article 6 projects, use sdgContributions; otherwise use sdg_goals
  const sdgGoals = isArticle6 
    ? (project.sdgContributions || [])
    : parseJsonField(project.sdg_goals);
    
  // For Article 6 projects, use keyFeatures; otherwise use cobenefits
  const cobenefits = isArticle6 
    ? (project.keyFeatures || [])
    : parseJsonField(project.cobenefits);
  
  // Format number for display
  const formatNumber = (num) => {
    if (!num && num !== 0) return 'Not specified';
    
    // For large numbers, format with K/M
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M tCO₂e`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K tCO₂e`;
    } else {
      return `${num} tCO₂e`;
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-full border border-gray-200 hover:shadow-lg transition-shadow duration-200">
      {/* Project Image */}
      <div className="relative h-48 bg-gray-200">
        {project.image_url ? (
          <img 
            src={project.image_url} 
            alt={project.name} 
            className="w-full h-full object-cover"
            onError={handleImageError}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* Article 6 Badge - Top Left */}
        {isArticle6 && (
          <div className="absolute top-2 left-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
              Paris Article 6.2
            </span>
          </div>
        )}
        
        {/* Status Badge - Top Right */}
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
            {project.status}
          </span>
        </div>
        
        {/* Save button - Bottom Right */}
        <button
          onClick={isSaved ? () => onRemove(project.id) : () => onSave(project.id)}
          className="absolute bottom-2 right-2 bg-white p-1.5 rounded-full shadow hover:bg-gray-100 transition-colors"
          title={isSaved ? "Remove from saved" : "Save project"}
        >
          {isSaved ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          )}
        </button>
      </div>
      
      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1 hover:text-green-600 transition-colors">
            <a href={`/projects/${project.id}`}>{project.name}</a>
          </h3>
        </div>
        
        <div className="mb-3 flex flex-wrap gap-1">
          <span className="inline-block px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded">
            {project.category || 'Uncategorized'}
          </span>
          {project.verification_status && (
            <span className="inline-block">
              {getVerificationBadge(project.verification_status)}
            </span>
          )}
        </div>
        
        <p className="text-sm text-gray-600 mb-3 line-clamp-3">
          {project.description}
        </p>
        
        {/* FIXED: Project Owner Link - Now uses correct profile URL */}
        {project.user_id && (
          <div className="text-xs text-gray-500 mb-2">
            <span className="font-medium">Project Owner:</span>{' '}
            <a 
              href={getProfileUrl(project.user_id)}
              className="text-green-600 hover:text-green-800 hover:underline"
            >
              View Profile
            </a>
          </div>
        )}
        
        {/* Location */}
        {project.location && (
          <div className="flex items-center text-xs text-gray-500 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {project.location}
          </div>
        )}
        
        {/* Article 6 Specific - Implementing Agency */}
        {isArticle6 && project.implementingAgency && (
          <div className="text-xs text-gray-500 mb-2">
            <span className="font-medium">Implementing Agency:</span> {project.implementingAgency}
          </div>
        )}
        
        {/* Article 6 Specific - Buying Party */}
        {isArticle6 && project.buyingParty && (
          <div className="text-xs text-gray-500 mb-2">
            <span className="font-medium">Buying Party:</span> {project.buyingParty}
          </div>
        )}
        
        {/* Compliance Markets */}
        {eligibleMarkets.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">
              {isArticle6 ? 'Carbon Credit Destination:' : 'Eligible Carbon Markets:'}
            </p>
            <div className="flex flex-wrap gap-1">
              {eligibleMarkets.map(market => (
                <span 
                  key={market.id} 
                  className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded"
                  style={{
                    backgroundColor: `${market.color}20`, // Light version of the color
                    color: market.color,
                    borderLeft: `3px solid ${market.color}`
                  }}
                  title={`${market.description}: ${market.buyingParty} - ${market.hostCountry}`}
                >
                  {market.buyingParty}-{isArticle6 ? project.hostParty || project.location : market.hostCountry}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* SDG Tags */}
        {sdgGoals && sdgGoals.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {sdgGoals.slice(0, 3).map(sdg => (
              <span 
                key={sdg} 
                className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full"
                title={sdgMap[sdg.toString()] || `SDG ${sdg}`}
              >
                SDG {sdg}
              </span>
            ))}
            {sdgGoals.length > 3 && (
              <span className="inline-block px-2 py-0.5 bg-gray-50 text-gray-600 text-xs font-medium rounded-full">
                +{sdgGoals.length - 3} more
              </span>
            )}
          </div>
        )}
        
        {/* Co-benefits */}
        {cobenefits && cobenefits.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">
              {isArticle6 ? 'Key Features:' : 'Co-benefits:'}
            </p>
            <div className="flex flex-wrap gap-1">
              {cobenefits.slice(0, 2).map((benefit, index) => (
                <span 
                  key={index} 
                  className="inline-block px-2 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded"
                >
                  {benefit}
                </span>
              ))}
              {cobenefits.length > 2 && (
                <span className="inline-block px-2 py-0.5 bg-gray-50 text-gray-600 text-xs font-medium rounded">
                  +{cobenefits.length - 2} more
                </span>
              )}
            </div>
          </div>
        )}
        
        {/* Metrics */}
        <div className="grid grid-cols-2 gap-2 mt-auto">
          {(project.reduction_target || project.estimatedEmissionReductions) && (
            <div className="bg-gray-50 p-2 rounded">
              <p className="text-xs text-gray-500">Emission Reductions</p>
              <p className="text-sm font-medium">
                {formatNumber(project.reduction_target || project.estimatedEmissionReductions)}
              </p>
            </div>
          )}
          
          {project.budget && (
            <div className="bg-gray-50 p-2 rounded">
              <p className="text-xs text-gray-500">Budget</p>
              <p className="text-sm font-medium">
                ${Number(project.budget).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer */}
      <div className="bg-gray-50 px-4 py-3 border-t">
        {/* Credit Pricing Display */}
        {project.credit_price && (
          <div className="mb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Credit Price</span>
              <div className="text-right">
                <span className="text-lg font-semibold text-green-600">
                  ${Number(project.credit_price).toFixed(2)}
                </span>
                <span className="text-xs text-gray-500 ml-1">
                  {project.credit_price_currency}/tCO₂e
                </span>
              </div>
            </div>
            {project.credit_price_type !== 'fixed' && (
              <div className="mt-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                  {project.credit_price_type === 'negotiable' && '💬 Negotiable'}
                  {project.credit_price_type === 'auction' && '🔨 Auction'}
                  {project.credit_price_type === 'request_quote' && '📋 Request Quote'}
                </span>
              </div>
            )}
          </div>
        )}
        
        <a
          href={`/projects/${project.id}`}
          className="text-green-600 hover:text-green-800 text-sm font-medium"
        >
          View Project Details →
        </a>
      </div>
    </div>
  );
};

export default ProjectCard;