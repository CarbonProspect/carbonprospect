import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, getValidToken } from './AuthSystem';
import { apiCall, uploadFile } from './api-config';
// Uncomment if you have this component:
// import BilateralAgreementSection from './components/BilateralAgreementSection';

const ProjectEditPage = () => {
  const { id } = useParams();
  const { currentUser, refreshToken } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  
  // Article 6 specific state
  const [article6Compliant, setArticle6Compliant] = useState(false);
  const [hostCountry, setHostCountry] = useState('');
  const [buyingParty, setBuyingParty] = useState('');
  const [implementingAgency, setImplementingAgency] = useState('');
  const [verificationStandard, setVerificationStandard] = useState('');
  const [projectLink, setProjectLink] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    creditType: '', // NEW: Type of carbon credit to be issued
    targetMarkets: [], // NEW: Target compliance markets
    location: '',
    latitude: '',
    longitude: '',
    reductionTarget: '',
    budget: '',
    timeline: {
      start: '',
      end: ''
    },
    status: 'Draft',
    // NEW: Credit pricing fields
    creditPrice: '',
    creditPriceCurrency: 'USD',
    creditPriceType: 'fixed', // 'fixed', 'negotiable', 'auction', 'request_quote'
    minimumPurchase: '', // Minimum tons that must be purchased
    priceValidUntil: '', // Date until which the price is valid
    bulkDiscounts: [], // Array of {minQuantity, discountPercent}
    // Additional fields to match ProjectListingForm
    methodology: '',
    methodologyDetails: '',
    standardBody: '',
    registryLink: '',
    eligibility: {
      article6: false,
      corsia: false,
      verra: false,
      goldStandard: false,
      cdm: false,
      other: false
    },
    eligibilityOther: '',
    projectStage: 'concept',
    verificationStatus: 'unverified',
    cobenefits: [],
    contactEmail: '',
    contactPhone: '',
    documents: [], // Will store document references
    imageUrl: '', // Will store the image URL
    sdgGoals: [], // Sustainable Development Goals
    bilateralAgreements: [], // Track selected bilateral agreements
    agreementDocuments: {
      mou: [], 
      intent: [], 
      noObjection: [], 
      authorization: []
    } // Track agreement documents
  });
  
  // Enhanced project categories
  const projectCategories = [
    { group: "Nature-based Solutions", options: [
      "Forest Carbon",
      "REDD+",
      "Afforestation/Reforestation", 
      "Livestock Methane",
      "Soil Carbon",
      "Blue Carbon",
      "Biodiversity Conservation",
      "Wetland Restoration"
    ]},
    { group: "Energy & Technology", options: [
      "Renewable Energy",
      "Energy Efficiency",
      "Carbon Capture & Storage",
      "Green Construction", 
      "Clean Transportation",
      "Waste Management",
      "Cookstoves",
      "Industrial Processes"
    ]},
    { group: "Compliance Market Projects", options: [
      "ACCU Projects",
      "JCM Projects", 
      "EU ETS Projects",
      "RGGI Projects",
      "California Cap-and-Trade",
      "UK ETS Projects",
      "New Zealand ETS",
      "Korean K-ETS"
    ]}
  ];
  
  // Credit type options
  const creditTypeOptions = [
    { group: "International Standards", options: [
      { value: "VCS", label: "Verified Carbon Standard (VCS)" },
      { value: "Gold_Standard", label: "Gold Standard" },
      { value: "CDM", label: "Clean Development Mechanism" },
      { value: "Plan_Vivo", label: "Plan Vivo" },
      { value: "ACR", label: "American Carbon Registry" },
      { value: "CAR", label: "Climate Action Reserve" }
    ]},
    { group: "National/Regional Systems", options: [
      { value: "ACCU", label: "Australian Carbon Credit Units" },
      { value: "JCM", label: "Joint Crediting Mechanism (Japan)" },
      { value: "J_Credit", label: "J-Credit Scheme (Japan)" },
      { value: "EUA", label: "EU Allowances" },
      { value: "UK_ETS", label: "UK ETS Allowances" },
      { value: "CCA", label: "California Carbon Allowances" },
      { value: "RGGI", label: "RGGI Allowances" },
      { value: "NZU", label: "New Zealand Units" },
      { value: "KAU", label: "Korean Allowance Units" },
      { value: "K_Credit", label: "K-Credit" },
      { value: "Federal_Backstop", label: "Federal Backstop Credits (Canada)" },
      { value: "Provincial_Allowances", label: "Provincial Allowances (Canada)" },
      { value: "Swiss_Domestic", label: "Swiss Domestic Credits" },
      { value: "Singapore_Eligible_International", label: "Singapore Eligible International Credits" }
    ]}
  ];
  
  // Target market options
  const targetMarketOptions = [
    "Australia (ACCU)",
    "Japan (JCM/J-Credit)",
    "European Union (EU ETS)",
    "United Kingdom (UK ETS)", 
    "United States (California)",
    "United States (RGGI)",
    "United States (Voluntary)",
    "New Zealand (NZ ETS)",
    "South Korea (K-ETS)",
    "Canada (Federal/Provincial)",
    "Switzerland (Domestic)",
    "Singapore (International)",
    "CORSIA",
    "Voluntary Global Markets",
    "Article 6.2 Markets"
  ];
  
  // List of Sustainable Development Goals for checkbox selection
  const sdgOptions = [
    { id: 1, name: "No Poverty" },
    { id: 2, name: "Zero Hunger" },
    { id: 3, name: "Good Health & Well-being" },
    { id: 4, name: "Quality Education" },
    { id: 5, name: "Gender Equality" },
    { id: 6, name: "Clean Water & Sanitation" },
    { id: 7, name: "Affordable & Clean Energy" },
    { id: 8, name: "Decent Work & Economic Growth" },
    { id: 9, name: "Industry, Innovation & Infrastructure" },
    { id: 10, name: "Reduced Inequalities" },
    { id: 11, name: "Sustainable Cities & Communities" },
    { id: 12, name: "Responsible Consumption & Production" },
    { id: 13, name: "Climate Action" },
    { id: 14, name: "Life Below Water" },
    { id: 15, name: "Life on Land" },
    { id: 16, name: "Peace, Justice & Strong Institutions" },
    { id: 17, name: "Partnerships for the Goals" }
  ];
  
  // List of possible co-benefits for checkbox selection
  const cobenefitOptions = [
    "Biodiversity protection",
    "Improved water quality/quantity",
    "Soil conservation",
    "Community development",
    "Job creation",
    "Food security",
    "Gender equality",
    "Health improvements",
    "Education support"
  ];
  
  // Track the project type for appropriate endpoint selection
  const [projectType, setProjectType] = useState(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get token and validate
        const token = getValidToken();
        
        if (!token) {
          setError('Authentication required. Please log in to view this project.');
          setLoading(false);
          return;
        }
        
        // Check if the ID is numeric - handle legacy formats
        const numericId = parseInt(id, 10);
        const useNumericId = !isNaN(numericId) && numericId.toString() === id;
        
        let projectId = id;
        
        if (!useNumericId) {
          // Try to extract a numeric ID from legacy format
          if (id.startsWith('article6-')) {
            const externalId = id.substring(9); // Skip "article6-"
            
            try {
              const mappingData = await apiCall('GET', `/projects/article6/legacy-id/${externalId}`);
              if (mappingData.numericId) {
                projectId = mappingData.numericId;
              } else {
                setError('This legacy Article 6 project ID could not be mapped to a new ID. Please use the project search to find the project.');
                setLoading(false);
                return;
              }
            } catch (mappingError) {
              setError('This project URL format is no longer supported. Please use the project search to find the project.');
              setLoading(false);
              return;
            }
          }
        }
        
        // Fetch the project data
        const data = await apiCall('GET', `/projects/${projectId}`);
        
        // Check if the current user is the owner of the project
        if (currentUser && data.user_id !== currentUser.id) {
          setError("You don't have permission to edit this project");
          setLoading(false);
          return;
        }

        // Store the project type for endpoint selection
        setProjectType(data.project_type || 'listing');

        // Set Article 6 specific state
        setArticle6Compliant(data.article6_compliant || false);
        setHostCountry(data.host_country || '');
        setBuyingParty(data.buying_party || '');
        setImplementingAgency(data.implementing_agency || '');
        setVerificationStandard(data.verification_standard || '');
        setProjectLink(data.project_link || '');

        // Format the data for the form
        setFormData({
          name: data.name || '',
          description: data.description || '',
          category: data.category || '',
          creditType: data.credit_type || '', // NEW: Map credit type
          targetMarkets: data.target_markets || [], // NEW: Map target markets
          location: data.location || '',
          latitude: data.latitude || '',
          longitude: data.longitude || '',
          reductionTarget: data.reduction_target || '',
          budget: data.budget || '',
          timeline: {
            start: data.timeline?.start || '',
            end: data.timeline?.end || ''
          },
          status: data.status || 'Draft',
          // NEW: Map credit pricing fields
          creditPrice: data.credit_price || '',
          creditPriceCurrency: data.credit_price_currency || 'USD',
          creditPriceType: data.credit_price_type || 'fixed',
          minimumPurchase: data.minimum_purchase || '',
          priceValidUntil: data.price_valid_until || '',
          bulkDiscounts: data.bulk_discounts || [],
          // Map additional fields from server response
          methodology: data.methodology || '',
          methodologyDetails: data.methodology_details || '',
          standardBody: data.standard_body || '',
          registryLink: data.registry_link || '',
          eligibility: {
            article6: data.eligibility?.article6 || data.article6_compliant || false,
            corsia: data.eligibility?.corsia || false,
            verra: data.eligibility?.verra || false,
            goldStandard: data.eligibility?.gold_standard || false,
            cdm: data.eligibility?.cdm || false,
            other: data.eligibility?.other || false
          },
          eligibilityOther: data.eligibility_other || '',
          projectStage: data.project_stage || 'concept',
          verificationStatus: data.verification_status || 'unverified',
          cobenefits: data.cobenefits || [],
          contactEmail: data.contact_email || '',
          contactPhone: data.contact_phone || '',
          documents: data.documents || [],
          imageUrl: data.image_url || '',
          sdgGoals: data.sdg_goals || [],
          bilateralAgreements: data.bilateral_agreements || [],
          agreementDocuments: data.agreement_documents || {
            mou: [], 
            intent: [], 
            noObjection: [], 
            authorization: []
          }
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching project:', err);
        
        // Handle specific error types
        if (err.isNetworkError) {
          setError('Cannot connect to the server. Please check if the API server is running on the correct port.');
        } else if (err.status === 401 || err.status === 403) {
          // Try to refresh token
          try {
            const refreshed = await refreshToken();
            if (refreshed) {
              // Retry the request (recursive call)
              await fetchProject();
              return;
            } else {
              setError('Your session has expired. Please log in again.');
            }
          } catch (refreshError) {
            setError('Authentication failed. Please log in again.');
          }
        } else if (err.status === 404) {
          setError('Project not found. It may have been deleted.');
        } else if (err.message.includes('API endpoint not found')) {
          setError('API endpoint not available. Please check if the server is running and the API routes are properly configured.');
        } else {
          setError(err.message || 'An unexpected error occurred while loading the project.');
        }
        
        setLoading(false);
      }
    };

    fetchProject();
  }, [id, currentUser, refreshToken]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      // Handle nested fields like timeline.start or eligibility.article6
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      });
      
      // Special case for article6 eligibility - sync with article6Compliant state
      if (parent === 'eligibility' && child === 'article6') {
        setArticle6Compliant(checked);
      }
    } else if (name === 'sdgGoals' || name === 'cobenefits' || name === 'targetMarkets') {
      // Handle multi-select arrays (checkboxes)
      const currentSelections = [...formData[name]];
      
      if (checked) {
        currentSelections.push(value);
      } else {
        const index = currentSelections.indexOf(value);
        if (index > -1) {
          currentSelections.splice(index, 1);
        }
      }
      
      setFormData({
        ...formData,
        [name]: currentSelections
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };

  // Handler for Article 6 specific fields
  const handleArticle6Change = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'article6Compliant') {
      setArticle6Compliant(checked);
      
      // Also update eligibility.article6 to match
      setFormData(prevData => ({
        ...prevData,
        eligibility: {
          ...prevData.eligibility,
          article6: checked
        }
      }));
    } else if (name === 'hostCountry') {
      setHostCountry(value);
    } else if (name === 'buyingParty') {
      setBuyingParty(value);
    } else if (name === 'implementingAgency') {
      setImplementingAgency(value);
    } else if (name === 'verificationStandard') {
      setVerificationStandard(value);
    } else if (name === 'projectLink') {
      setProjectLink(value);
    }
  };
  
  // NEW: Handle bulk discount changes
  const handleBulkDiscountChange = (index, field, value) => {
    const newDiscounts = [...formData.bulkDiscounts];
    newDiscounts[index] = {
      ...newDiscounts[index],
      [field]: value
    };
    setFormData({
      ...formData,
      bulkDiscounts: newDiscounts
    });
  };
  
  const addBulkDiscount = () => {
    setFormData({
      ...formData,
      bulkDiscounts: [...formData.bulkDiscounts, { minQuantity: '', discountPercent: '' }]
    });
  };
  
  const removeBulkDiscount = (index) => {
    const newDiscounts = formData.bulkDiscounts.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      bulkDiscounts: newDiscounts
    });
  };
  
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    const fileType = file.type;
    if (!fileType.match(/image\/(jpeg|jpg|png|gif|webp)/i)) {
      setError("Please upload a valid image file (JPEG, PNG, GIF, or WEBP)");
      return;
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }
    
    setUploadingImage(true);
    setError(null);
    
    try {
      // Use the improved upload function
      const result = await uploadFile('/uploads/images', file, (progress) => {
        console.log(`Upload progress: ${progress}%`);
      });
      
      // Update form data with the image URL
      setFormData(prevData => ({
        ...prevData,
        imageUrl: result.imageUrl
      }));
      
    } catch (err) {
      console.error("Error uploading image:", err);
      setError("Failed to upload image. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDocumentUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploadingDocs(true);
    setError(null);
    
    try {
      const uploadedDocs = [...formData.documents];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file size (20MB max)
        if (file.size > 20 * 1024 * 1024) {
          setError(`File "${file.name}" exceeds the 20MB limit and was not uploaded`);
          continue;
        }
        
        try {
          // Use the improved upload function
          const result = await uploadFile('/uploads/documents', file);
          
          // Add document info to the array
          uploadedDocs.push({
            id: result.id,
            name: file.name,
            url: result.documentUrl,
            type: file.type,
            size: file.size,
            uploadDate: new Date().toISOString()
          });
        } catch (uploadError) {
          console.error(`Failed to upload ${file.name}:`, uploadError);
          setError(`Failed to upload ${file.name}. Please try again.`);
        }
      }
      
      // Update form data with the document array
      setFormData(prevData => ({
        ...prevData,
        documents: uploadedDocs
      }));
      
    } catch (err) {
      console.error("Error uploading documents:", err);
      setError("Failed to upload one or more documents. Please try again.");
    } finally {
      setUploadingDocs(false);
    }
  };
  
  const removeDocument = (docId) => {
    setFormData(prevData => ({
      ...prevData,
      documents: prevData.documents.filter(doc => doc.id !== docId)
    }));
  };
  
  const removeImage = () => {
    setFormData(prevData => ({
      ...prevData,
      imageUrl: ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    try {
      // Get a valid token first
      const token = getValidToken();
      
      if (!token) {
        setError('Your session has expired. Please log in again.');
        setSubmitting(false);
        return;
      }
      
      console.log(`Updating ${projectType || 'standard'} project with ID: ${id}`);
      
      // Include the project type in the request payload
      const requestBody = {
        ...formData,
        project_type: projectType || 'listing', // Default to listing if not specified
        
        // Map pricing fields to match database columns
        credit_price: formData.creditPrice || null,
        credit_price_currency: formData.creditPriceCurrency,
        credit_price_type: formData.creditPriceType,
        minimum_purchase: formData.minimumPurchase || null,
        price_valid_until: formData.priceValidUntil || null,
        bulk_discounts: formData.bulkDiscounts.length > 0 ? formData.bulkDiscounts : null,
        
        // Include Article 6 specific fields
        article6_compliant: article6Compliant,
        host_country: hostCountry,
        buying_party: buyingParty,
        bilateral_agreements: formData.bilateralAgreements,
        agreement_documents: formData.agreementDocuments,
        implementing_agency: implementingAgency,
        verification_standard: verificationStandard,
        project_link: projectLink
      };
      
      // Use the improved API call helper
      const data = await apiCall('PUT', `/projects/${id}`, requestBody);
      
      // Navigate to the project detail page
      navigate(`/projects/${data.id}`);
    } catch (err) {
      console.error('Error updating project:', err);
      
      // Handle specific error types
      if (err.isNetworkError) {
        setError('Cannot connect to the server. Please check if the API server is running.');
      } else if (err.status === 401 || err.status === 403) {
        // Try to refresh token
        try {
          const refreshed = await refreshToken();
          if (refreshed) {
            // Retry the submit
            handleSubmit(e);
            return;
          } else {
            setError('Your session has expired. Please log in again.');
          }
        } catch (refreshError) {
          setError('Authentication failed. Please log in again.');
        }
      } else if (err.message.includes('API endpoint not found')) {
        setError('API endpoint not available. Please check if the server is running and the API routes are properly configured.');
      } else {
        setError(err.message || 'An unexpected error occurred while updating the project.');
      }
      
      setSubmitting(false);
    }
  };

  // Enhanced delete function
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        // Get a valid token first
        const token = getValidToken();
        
        if (!token) {
          setError('Your session has expired. Please log in again.');
          return;
        }
        
        console.log(`Deleting project using endpoint: /api/projects/${id}`);
        
        // Use the improved API call helper
        await apiCall('DELETE', `/projects/${id}`);
        
        // Navigate back to the projects management page
        navigate('/projects/manage');
      } catch (err) {
        console.error('Error deleting project:', err);
        
        // Handle specific error types
        if (err.isNetworkError) {
          setError('Cannot connect to the server. Please check if the API server is running.');
        } else if (err.status === 401 || err.status === 403) {
          // Try to refresh token
          try {
            const refreshed = await refreshToken();
            if (refreshed) {
              // Retry the delete
              handleDelete();
              return;
            } else {
              setError('Your session has expired. Please log in again.');
            }
          } catch (refreshError) {
            setError('Authentication failed. Please log in again.');
          }
        } else if (err.message.includes('API endpoint not found')) {
          setError('API endpoint not available. Please check if the server is running and the API routes are properly configured.');
        } else {
          setError(err.message || 'An unexpected error occurred while deleting the project.');
        }
      }
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
          {(error.includes('session') || error.includes('Authentication')) && (
            <button
              onClick={() => navigate('/login')}
              className="ml-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Log In
            </button>
          )}
          {error.includes('server') && (
            <div className="mt-4 text-sm text-gray-600">
              <p>Troubleshooting tips:</p>
              <ul className="list-disc list-inside mt-2">
                <li>Make sure your API server is running</li>
                <li>Check if the API is running on port 3001</li>
                <li>Verify your API routes are properly configured</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Edit Project</h1>
        
        {/* Project type indicator */}
        {projectType && (
          <div className="mb-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {projectType === 'assessment' ? 'Assessment Project' : 'Project Listing'}
            </span>
            
            {article6Compliant && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Article 6 Compliant
              </span>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          {/* Project Basic Information Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">Basic Information</h2>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                Project Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                Project Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32"
                placeholder="Provide a detailed overview of your project, including its purpose, scope, and expected outcomes."
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="category">
                Project Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              >
                <option value="">Select Project Category</option>
                {projectCategories.map(group => (
                  <optgroup key={group.group} label={group.group}>
                    {group.options.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </optgroup>
                ))}
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="creditType">
                Credit Type *
              </label>
              <select
                id="creditType"
                name="creditType"
                value={formData.creditType}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              >
                <option value="">Select Credit Type</option>
                {creditTypeOptions.map(group => (
                  <optgroup key={group.group} label={group.group}>
                    {group.options.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                The type of carbon credit that will be issued for this project
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Target Markets (Select all that apply)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded p-3">
                {targetMarketOptions.map(market => (
                  <div key={market} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`targetMarket-${market}`}
                      name="targetMarkets"
                      value={market}
                      checked={formData.targetMarkets.includes(market)}
                      onChange={handleChange}
                      className="h-4 w-4 text-green-600 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-700" htmlFor={`targetMarket-${market}`}>
                      {market}
                    </label>
                  </div>
                ))}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                The compliance and voluntary markets where these credits are intended to be used
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="location">
                Project Location *
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Country, region, or specific coordinates"
                required
              />
            </div>

            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="latitude">
                  Latitude
                </label>
                <input
                  type="number"
                  step="0.000001"
                  id="latitude"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="e.g., -33.865143"
                />
                <p className="mt-1 text-xs text-gray-500">Decimal degrees (e.g., -33.865143 for Sydney)</p>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="longitude">
                  Longitude
                </label>
                <input
                  type="number"
                  step="0.000001"
                  id="longitude"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="e.g., 151.209900"
                />
                <p className="mt-1 text-xs text-gray-500">Decimal degrees (e.g., 151.209900 for Sydney)</p>
              </div>
            </div>
          </div>

          {/* NEW: Credit Pricing Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">Credit Pricing Information</h2>
            
            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="creditPrice">
                  Credit Price per tCO2e *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">$</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    id="creditPrice"
                    name="creditPrice"
                    value={formData.creditPrice}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 pl-8 pr-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="0.00"
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Base price per metric ton of CO2 equivalent</p>
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="creditPriceCurrency">
                  Currency
                </label>
                <select
                  id="creditPriceCurrency"
                  name="creditPriceCurrency"
                  value={formData.creditPriceCurrency}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="AUD">AUD - Australian Dollar</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="JPY">JPY - Japanese Yen</option>
                  <option value="CHF">CHF - Swiss Franc</option>
                  <option value="CNY">CNY - Chinese Yuan</option>
                  <option value="SGD">SGD - Singapore Dollar</option>
                </select>
              </div>
            </div>
            
            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="creditPriceType">
                  Pricing Type
                </label>
                <select
                  id="creditPriceType"
                  name="creditPriceType"
                  value={formData.creditPriceType}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="fixed">Fixed Price</option>
                  <option value="negotiable">Negotiable</option>
                  <option value="auction">Auction-based</option>
                  <option value="request_quote">Request Quote</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {formData.creditPriceType === 'fixed' && 'Price is non-negotiable'}
                  {formData.creditPriceType === 'negotiable' && 'Price shown is starting point for negotiation'}
                  {formData.creditPriceType === 'auction' && 'Price will be determined through auction'}
                  {formData.creditPriceType === 'request_quote' && 'Buyers must request a custom quote'}
                </p>
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="minimumPurchase">
                  Minimum Purchase (tCO2e)
                </label>
                <input
                  type="number"
                  id="minimumPurchase"
                  name="minimumPurchase"
                  value={formData.minimumPurchase}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="No minimum"
                />
                <p className="mt-1 text-xs text-gray-500">Leave blank if there's no minimum purchase requirement</p>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="priceValidUntil">
                Price Valid Until
              </label>
              <input
                type="date"
                id="priceValidUntil"
                name="priceValidUntil"
                value={formData.priceValidUntil}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
              <p className="mt-1 text-xs text-gray-500">Date until which the listed price remains valid</p>
            </div>
            
            {/* Bulk Discounts */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Bulk Purchase Discounts
              </label>
              {formData.bulkDiscounts.map((discount, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <input
                    type="number"
                    placeholder="Min quantity"
                    value={discount.minQuantity}
                    onChange={(e) => handleBulkDiscountChange(index, 'minQuantity', e.target.value)}
                    className="flex-1 shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                  <span className="text-gray-600">tCO2e →</span>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Discount %"
                    value={discount.discountPercent}
                    onChange={(e) => handleBulkDiscountChange(index, 'discountPercent', e.target.value)}
                    className="w-24 shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                  <span className="text-gray-600">% off</span>
                  <button
                    type="button"
                    onClick={() => removeBulkDiscount(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addBulkDiscount}
                className="mt-2 text-sm text-green-600 hover:text-green-700 font-medium"
              >
                + Add Bulk Discount Tier
              </button>
              <p className="mt-1 text-xs text-gray-500">Offer discounts for large volume purchases</p>
            </div>
          </div>

          {/* Budget and Timeline Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">Project Metrics</h2>
            
            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="reductionTarget">
                  Emissions Reduction Target (tCO2e)
                </label>
                <input
                  type="number"
                  id="reductionTarget"
                  name="reductionTarget"
                  value={formData.reductionTarget}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="e.g., 10000"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="budget">
                  Project Budget (USD)
                </label>
                <input
                  type="number"
                  id="budget"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="e.g., 500000"
                />
              </div>
            </div>

            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="timeline.start">
                  Project Start Date
                </label>
                <input
                  type="date"
                  id="timeline.start"
                  name="timeline.start"
                  value={formData.timeline.start}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="timeline.end">
                  Project End Date
                </label>
                <input
                  type="date"
                  id="timeline.end"
                  name="timeline.end"
                  value={formData.timeline.end}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
            </div>
          </div>

          {/* Methodology Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">Methodology & Standards</h2>
            
            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="methodology">
                  Methodology
                </label>
                <input
                  type="text"
                  id="methodology"
                  name="methodology"
                  value={formData.methodology}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="e.g., VM0001, ACM0002"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="standardBody">
                  Standard Body
                </label>
                <select
                  id="standardBody"
                  name="standardBody"
                  value={formData.standardBody}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="">Select Standard Body</option>
                  <option value="Verra">Verra (VCS)</option>
                  <option value="Gold Standard">Gold Standard</option>
                  <option value="CDM">Clean Development Mechanism (CDM)</option>
                  <option value="Climate Action Reserve">Climate Action Reserve</option>
                  <option value="American Carbon Registry">American Carbon Registry</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="methodologyDetails">
                Methodology Details
              </label>
              <textarea
                id="methodologyDetails"
                name="methodologyDetails"
                value={formData.methodologyDetails}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-24"
                placeholder="Provide detailed information about the methodology being used..."
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="registryLink">
                Registry Link
              </label>
              <input
                type="url"
                id="registryLink"
                name="registryLink"
                value={formData.registryLink}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="https://registry.verra.org/..."
              />
            </div>
          </div>

          {/* Project Status Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">Project Status</h2>
            
            <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="status">
                  Project Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="Draft">Draft</option>
                  <option value="Active">Active</option>
                  <option value="Seeking Partners">Seeking Partners</option>
                  <option value="Under Development">Under Development</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="projectStage">
                  Project Stage
                </label>
                <select
                  id="projectStage"
                  name="projectStage"
                  value={formData.projectStage}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="concept">Concept/Idea Stage</option>
                  <option value="planning">Planning & Development</option>
                  <option value="implementation">Implementation</option>
                  <option value="monitoring">Monitoring & Reporting</option>
                  <option value="verification">Verification</option>
                  <option value="issuance">Credit Issuance</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="verificationStatus">
                  Verification Status
                </label>
                <select
                  id="verificationStatus"
                  name="verificationStatus"
                  value={formData.verificationStatus}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="unverified">Not Yet Verified</option>
                  <option value="validation">Validation in Process</option>
                  <option value="validated">Validated</option>
                  <option value="verification">Verification in Process</option>
                  <option value="verified">Verified</option>
                  <option value="registered">Registered & Verified</option>
                  <option value="issuance">Credits Issued</option>
                </select>
              </div>
            </div>
          </div>

          {/* Eligibility Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">Eligibility & Standards</h2>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Project Eligibility (Select all that apply)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="flex items-center">
                  <input
                    id="eligibility.article6"
                    name="eligibility.article6"
                    type="checkbox"
                    checked={formData.eligibility.article6}
                    onChange={handleChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="eligibility.article6" className="ml-2 block text-sm text-gray-900">
                    Paris Agreement Article 6.2
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="eligibility.corsia"
                    name="eligibility.corsia"
                    type="checkbox"
                    checked={formData.eligibility.corsia}
                    onChange={handleChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="eligibility.corsia" className="ml-2 block text-sm text-gray-900">
                    CORSIA Eligible
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="eligibility.verra"
                    name="eligibility.verra"
                    type="checkbox"
                    checked={formData.eligibility.verra}
                    onChange={handleChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="eligibility.verra" className="ml-2 block text-sm text-gray-900">
                    Verra Registered
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="eligibility.goldStandard"
                    name="eligibility.goldStandard"
                    type="checkbox"
                    checked={formData.eligibility.goldStandard}
                    onChange={handleChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="eligibility.goldStandard" className="ml-2 block text-sm text-gray-900">
                    Gold Standard Registered
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="eligibility.cdm"
                    name="eligibility.cdm"
                    type="checkbox"
                    checked={formData.eligibility.cdm}
                    onChange={handleChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="eligibility.cdm" className="ml-2 block text-sm text-gray-900">
                    CDM Registered
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="eligibility.other"
                    name="eligibility.other"
                    type="checkbox"
                    checked={formData.eligibility.other}
                    onChange={handleChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="eligibility.other" className="ml-2 block text-sm text-gray-900">
                    Other Standard
                  </label>
                </div>
              </div>
              
              {formData.eligibility.other && (
                <div className="mt-2">
                  <input
                    type="text"
                    id="eligibilityOther"
                    name="eligibilityOther"
                    value={formData.eligibilityOther}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="Please specify the other standard"
                  />
                </div>
              )}
            </div>
          </div>
          
          {/* Article 6 Section */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Article 6 Information</h2>
            
            <div className="mb-4">
              <div className="flex items-center">
                <input
                  id="article6Compliant"
                  name="article6Compliant"
                  type="checkbox"
                  checked={article6Compliant}
                  onChange={handleArticle6Change}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="article6Compliant" className="ml-2 block text-sm text-gray-900">
                  This project is Article 6 compliant
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Check this box if the project is compliant with Article 6 of the Paris Agreement
              </p>
            </div>
            
            {article6Compliant && (
              <div className="space-y-4 mt-4">
                {/* Host Country */}
                <div>
                  <label htmlFor="hostCountry" className="block text-sm font-medium text-gray-700">
                    Host Country <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="hostCountry"
                    name="hostCountry"
                    value={hostCountry}
                    onChange={handleArticle6Change}
                    required={article6Compliant}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    The country where the project is implemented
                  </p>
                </div>
                
                {/* Buying Party */}
                <div>
                  <label htmlFor="buyingParty" className="block text-sm font-medium text-gray-700">
                    Buying Party <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="buyingParty"
                    name="buyingParty"
                    value={buyingParty}
                    onChange={handleArticle6Change}
                    required={article6Compliant}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    The country or entity purchasing the emission reductions
                  </p>
                </div>
                
                {/* Implementing Agency */}
                <div>
                  <label htmlFor="implementingAgency" className="block text-sm font-medium text-gray-700">
                    Implementing Agency
                  </label>
                  <input
                    type="text"
                    id="implementingAgency"
                    name="implementingAgency"
                    value={implementingAgency}
                    onChange={handleArticle6Change}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    The agency or organization implementing the project
                  </p>
                </div>
                
                {/* Verification Standard */}
                <div>
                  <label htmlFor="verificationStandard" className="block text-sm font-medium text-gray-700">
                    Verification Standard
                  </label>
                  <input
                    type="text"
                    id="verificationStandard"
                    name="verificationStandard"
                    value={verificationStandard}
                    onChange={handleArticle6Change}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="e.g., Article 6.2 Paris Agreement"
                  />
                </div>
                
                {/* Project Link */}
                <div>
                  <label htmlFor="projectLink" className="block text-sm font-medium text-gray-700">
                    Official Project Link
                  </label>
                  <input
                    type="url"
                    id="projectLink"
                    name="projectLink"
                    value={projectLink}
                    onChange={handleArticle6Change}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="https://example.com/project"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Link to the official project documentation or website
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sustainability Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">Sustainability Information</h2>
            
            {/* Co-benefits */}
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Project Co-Benefits (Select all that apply)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {cobenefitOptions.map((benefit) => (
                  <div key={benefit} className="flex items-center">
                    <input
                      id={`cobenefit-${benefit}`}
                      name="cobenefits"
                      value={benefit}
                      type="checkbox"
                      checked={formData.cobenefits.includes(benefit)}
                      onChange={handleChange}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`cobenefit-${benefit}`} className="ml-2 block text-sm text-gray-900">
                      {benefit}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* SDG Goals */}
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Sustainable Development Goals (SDGs) (Select all that apply)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded p-3">
                {sdgOptions.map((sdg) => (
                  <div key={sdg.id} className="flex items-center">
                    <input
                      id={`sdg-${sdg.id}`}
                      name="sdgGoals"
                      value={sdg.id.toString()}
                      type="checkbox"
                      checked={formData.sdgGoals.includes(sdg.id.toString())}
                      onChange={handleChange}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`sdg-${sdg.id}`} className="ml-2 block text-xs text-gray-900">
                      SDG {sdg.id}: {sdg.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">Project Image</h2>
            
            {formData.imageUrl && (
              <div className="mb-4">
                <img 
                  src={formData.imageUrl} 
                  alt="Project" 
                  className="h-32 w-48 object-cover rounded border"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="mt-2 text-red-600 text-sm hover:text-red-800"
                >
                  Remove Image
                </button>
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="image">
                Upload Project Image
              </label>
              <input
                type="file"
                id="image"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
              {uploadingImage && (
                <p className="text-sm text-blue-600 mt-1">Uploading image...</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Accepted formats: JPEG, PNG, GIF, WEBP. Maximum size: 5MB.
              </p>
            </div>
          </div>

          {/* Document Upload Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">Supporting Documents</h2>
            
            {formData.documents.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Uploaded Documents</h3>
                <ul className="divide-y divide-gray-200 border rounded-md overflow-hidden">
                  {formData.documents.map((doc) => (
                    <li key={doc.id} className="px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-700">{doc.name}</p>
                          <p className="text-xs text-gray-500">
                            {doc.size ? `${(doc.size / 1024 / 1024).toFixed(2)} MB` : ''}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDocument(doc.id)}
                        className="text-red-600 text-sm hover:text-red-800"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="documents">
                Upload Supporting Documents
              </label>
              <input
                type="file"
                id="documents"
                multiple
                onChange={handleDocumentUpload}
                disabled={uploadingDocs}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
              {uploadingDocs && (
                <p className="text-sm text-blue-600 mt-1">Uploading documents...</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                You can upload multiple files. Maximum size per file: 20MB.
              </p>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">Contact Information</h2>
            
            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="contactEmail">
                  Contact Email
                </label>
                <input
                  type="email"
                  id="contactEmail"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="project@example.com"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="contactPhone">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  id="contactPhone"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
          </div>
          
          {/* Form Submission Section */}
          <div className="flex justify-between items-center mt-8">
            <button
              type="button"
              onClick={() => navigate(`/projects/${id}`)}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Cancel
            </button>
            
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Delete
              </button>
              
              <button
                type="submit"
                disabled={submitting}
                className={`bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                  submitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectEditPage;