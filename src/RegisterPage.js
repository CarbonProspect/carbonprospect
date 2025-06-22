// RegisterPage.js - Updated with General User type and Email Verification
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthSystem';

const RegisterPage = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    companyName: '',
    organizationName: '',
    industry: '',
    regions: [],
    agreedToTerms: false
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();
  
  // Available roles - Added generalUser
  const roles = [
    { id: 'solutionProvider', name: 'Solution Provider', description: 'I offer carbon reduction technologies and solutions' },
    { id: 'projectDeveloper', name: 'Project Developer', description: 'I implement carbon reduction projects' },
    { id: 'consultant', name: 'Consultant/Advisor', description: 'I advise on carbon reduction strategies' },
    { id: 'generalUser', name: 'General User', description: 'I want to explore carbon solutions and use assessment tools' }
  ];
  
  // Industry options
  const industries = [
    'Energy', 'Manufacturing', 'Construction', 'Transportation', 
    'Agriculture', 'Waste Management', 'Technology', 'Finance', 
    'Government', 'Education', 'Healthcare', 'Other'
  ];
  
  // Region options
  const regionOptions = [
    'North America', 'Europe', 'Asia Pacific', 'Latin America', 
    'Middle East', 'Africa', 'Global'
  ];
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error for this field if any
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  const handleRegionChange = (region) => {
    setFormData(prev => {
      const updatedRegions = prev.regions.includes(region)
        ? prev.regions.filter(r => r !== region) // Remove if already selected
        : [...prev.regions, region]; // Add if not selected
      
      return { ...prev, regions: updatedRegions };
    });
  };
  
  const validateStep = (stepNumber) => {
    const newErrors = {};
    
    if (stepNumber === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Email is invalid';
      }
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    if (stepNumber === 2) {
      if (!formData.role) newErrors.role = 'Please select a role';
    }
    
    if (stepNumber === 3) {
      // Different validation for general users
      if (formData.role === 'generalUser') {
        // Only require terms agreement for general users
        if (!formData.agreedToTerms) newErrors.agreedToTerms = 'You must agree to the terms';
      } else {
        // Existing validation for other roles
        if (formData.role === 'solutionProvider' && !formData.companyName.trim()) {
          newErrors.companyName = 'Company name is required';
        }
        if (formData.role === 'projectDeveloper' && !formData.organizationName.trim()) {
          newErrors.organizationName = 'Organization name is required';
        }
        if (!formData.industry) newErrors.industry = 'Please select an industry';
        if (formData.regions.length === 0) newErrors.regions = 'Please select at least one region';
        if (!formData.agreedToTerms) newErrors.agreedToTerms = 'You must agree to the terms';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
    }
  };
  
  const prevStep = () => {
    setStep(prev => prev - 1);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(step)) return;
    
    try {
      setIsSubmitting(true);
      
      // Format data for API
      const registerData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        profile: {
          // Common profile fields (optional for general users)
          ...(formData.industry && { industry: formData.industry }),
          ...(formData.regions.length > 0 && { regions: formData.regions }),
          
          // Role-specific fields
          ...(formData.role === 'solutionProvider' && {
            companyName: formData.companyName
          }),
          ...(formData.role === 'projectDeveloper' && {
            organizationName: formData.organizationName
          })
        },
        agreedToTerms: formData.agreedToTerms
      };
      
      // Log registration data for debugging (remove in production)
      console.log('Submitting registration data:', JSON.stringify(registerData, null, 2));
      
      // Call the register function from AuthSystem
      const result = await register(registerData);
      
      // Check if we got a successful response (201 status)
      if (result.message && result.requiresVerification) {
        // Registration was successful, show verification message
        setSubmitSuccess(true);
        setErrors({});
      } else if (result.success) {
        // Legacy success format (if backend changes)
        if (result.requiresVerification) {
          setSubmitSuccess(true);
          setErrors({});
        } else {
          // This shouldn't happen with email verification enabled
          // but if it does, navigate based on user type
          if (formData.role === 'generalUser') {
            navigate('/dashboard');
          } else {
            navigate('/profile/complete');
          }
        }
      } else {
        setErrors({ general: result.error || result.message || 'Registration failed' });
      }
    } catch (err) {
      console.error('Registration error:', err);
      
      // Handle API validation errors
      if (err.errors) {
        setErrors(err.errors);
      } else {
        setErrors({ 
          general: err.message || 
          (err.response?.data?.message || 'Registration failed. Please try again.') 
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show success message after registration
  if (submitSuccess) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-xl font-bold text-green-600">Carbon Prospect</span>
            </Link>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-4">Check Your Email!</h2>
            <p className="text-gray-600 mb-6">
              We've sent a verification link to <strong>{formData.email}</strong>. 
              Please check your inbox and click the link to verify your account.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Can't find the email? Check your spam folder or wait a few minutes.
            </p>
            <Link
              to="/login"
              className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2 text-green-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-xl font-bold text-green-600">Carbon Prospect</span>
          </Link>
          <h1 className="text-3xl font-bold mt-6 mb-2">Create Your Account</h1>
          <p className="text-gray-600">Join our marketplace of carbon reduction solutions</p>
        </div>
        
        {/* Progress Steps */}
        <div className="flex justify-between mb-8 relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2 z-0"></div>
          
          {[1, 2, 3].map((stepNumber) => (
            <div 
              key={stepNumber} 
              className={`relative z-10 flex flex-col items-center ${stepNumber < step ? 'text-green-600' : stepNumber === step ? 'text-blue-600' : 'text-gray-400'}`}
            >
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                  stepNumber < step 
                    ? 'bg-green-100 text-green-600 border border-green-600' 
                    : stepNumber === step 
                      ? 'bg-blue-100 text-blue-600 border border-blue-600' 
                      : 'bg-gray-100 text-gray-400 border border-gray-300'
                }`}
              >
                {stepNumber < step ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  stepNumber
                )}
              </div>
              <div className="text-sm mt-1 font-medium">
                {stepNumber === 1 ? 'Basic Info' : stepNumber === 2 ? 'Select Role' : 'Complete Setup'}
              </div>
            </div>
          ))}
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Basic Information */}
            {step === 1 && (
              <div>
                <h2 className="text-xl font-semibold mb-6">Basic Information</h2>
                
                {/* Email Provider Warning */}
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex">
                    <svg className="h-5 w-5 text-blue-400 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">Email Delivery Notice</h3>
                      <p className="mt-1 text-sm text-blue-700">
                        For best results, we recommend using Gmail, Yahoo, or business email addresses. 
                        Some providers (Hotmail, Outlook) may block verification emails. 
                        If you don't receive your email, please check spam or try a different email provider.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                      First Name*
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.firstName ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name*
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.lastName ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                    )}
                  </div>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address*
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>
                
                <div className="mb-4">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password*
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Password must be at least 8 characters long
                  </p>
                </div>
                
                <div className="mb-6">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password*
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>
            )}
            
            {/* Step 2: Select Role */}
            {step === 2 && (
              <div>
                <h2 className="text-xl font-semibold mb-6">Select Your Role</h2>
                <p className="text-gray-600 mb-6">
                  Choose the role that best describes how you'll use Carbon Prospect
                </p>
                
                <div className="space-y-4 mb-6">
                  {roles.map(role => (
                    <div
                      key={role.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        formData.role === role.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleChange({ target: { name: 'role', value: role.id } })}
                    >
                      <div className="flex items-center">
                        <div className={`w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center ${
                          formData.role === role.id
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {formData.role === role.id && (
                            <span className="block w-3 h-3 rounded-full bg-white" />
                          )}
                        </div>
                        <div className="ml-3">
                          <div className="font-medium">{role.name}</div>
                          <div className="text-sm text-gray-600">{role.description}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {errors.role && (
                  <p className="mt-1 text-sm text-red-600 mb-4">{errors.role}</p>
                )}
              </div>
            )}
            
            {/* Step 3: Organization Details */}
            {step === 3 && (
              <div>
                {/* Simplified setup for General Users */}
                {formData.role === 'generalUser' ? (
                  <>
                    <h2 className="text-xl font-semibold mb-6">Complete Your Setup</h2>
                    <p className="text-gray-600 mb-6">
                      As a general user, you'll have access to explore our marketplace, 
                      use carbon assessment tools, and connect with providers.
                    </p>
                    
                    <div className="mb-4">
                      <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
                        Industry (Optional)
                      </label>
                      <select
                        id="industry"
                        name="industry"
                        value={formData.industry}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300"
                      >
                        <option value="">Select Industry</option>
                        {industries.map(industry => (
                          <option key={industry} value={industry}>{industry}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Regions of Interest (Optional)
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {regionOptions.map(region => (
                          <button
                            key={region}
                            type="button"
                            onClick={() => handleRegionChange(region)}
                            className={`px-3 py-1 text-sm rounded-full ${
                              formData.regions.includes(region) 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {region}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="text-xl font-semibold mb-6">
                      {formData.role === 'solutionProvider' ? 'Company Details' :
                       formData.role === 'projectDeveloper' ? 'Organization Details' :
                       'Professional Details'}
                    </h2>
                    
                    {formData.role === 'solutionProvider' && (
                      <div className="mb-4">
                        <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                          Company Name*
                        </label>
                        <input
                          type="text"
                          id="companyName"
                          name="companyName"
                          value={formData.companyName}
                          onChange={handleChange}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.companyName ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.companyName && (
                          <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>
                        )}
                      </div>
                    )}
                    
                    {formData.role === 'projectDeveloper' && (
                      <div className="mb-4">
                        <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700 mb-1">
                          Organization Name*
                        </label>
                        <input
                          type="text"
                          id="organizationName"
                          name="organizationName"
                          value={formData.organizationName}
                          onChange={handleChange}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.organizationName ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.organizationName && (
                          <p className="mt-1 text-sm text-red-600">{errors.organizationName}</p>
                        )}
                      </div>
                    )}
                    
                    <div className="mb-4">
                      <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
                        Industry*
                      </label>
                      <select
                        id="industry"
                        name="industry"
                        value={formData.industry}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.industry ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select Industry</option>
                        {industries.map(industry => (
                          <option key={industry} value={industry}>{industry}</option>
                        ))}
                      </select>
                      {errors.industry && (
                        <p className="mt-1 text-sm text-red-600">{errors.industry}</p>
                      )}
                    </div>
                    
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Regions*
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {regionOptions.map(region => (
                          <button
                            key={region}
                            type="button"
                            onClick={() => handleRegionChange(region)}
                            className={`px-3 py-1 text-sm rounded-full ${
                              formData.regions.includes(region) 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {region}
                          </button>
                        ))}
                      </div>
                      {errors.regions && (
                        <p className="mt-1 text-sm text-red-600">{errors.regions}</p>
                      )}
                    </div>
                  </>
                )}
                
                <div className="mb-6">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="agreedToTerms"
                        name="agreedToTerms"
                        type="checkbox"
                        checked={formData.agreedToTerms}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="agreedToTerms" className="font-medium text-gray-700">
                        I agree to the <Link to="/terms" className="text-blue-600 hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
                      </label>
                    </div>
                  </div>
                  {errors.agreedToTerms && (
                    <p className="mt-1 text-sm text-red-600">{errors.agreedToTerms}</p>
                  )}
                </div>
              </div>
            )}
            
            {/* Form Error Message */}
            {errors.general && (
              <div className="p-4 mb-6 text-red-700 bg-red-100 rounded-lg">
                <p>{errors.general}</p>
              </div>
            )}
            
            {/* Navigation Buttons */}
            <div className="flex justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Previous
                </button>
              ) : (
                <div></div> // Empty div to maintain flex positioning
              )}
              
              {step < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Account...
                    </span>
                  ) : (
                    'Create Account'
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
        
        <p className="text-center mt-6 text-gray-600">
          Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Log In</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;