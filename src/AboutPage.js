import React, { useState } from 'react';

function AboutPage() {
  // State for contact form
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [formStatus, setFormStatus] = useState(null);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real application, you would send the form data to your server or email service
    // For this example, we'll just show a success message
    setFormStatus('success');
    console.log('Form submitted:', formData);
    
    // Clear the form after submitting
    setTimeout(() => {
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
      setFormStatus(null);
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-green-600 to-green-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold sm:text-5xl lg:text-6xl">
              Connecting the Global Carbon Ecosystem
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-xl text-green-100">
              Bridging technology providers, project developers, consultants, and organizations 
              to accelerate the transition to a net-zero economy
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Mission Section */}
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden mb-12">
          <div className="bg-gradient-to-r from-green-500 to-green-600 px-8 py-6">
            <h2 className="text-2xl font-bold text-white">Our Mission</h2>
          </div>
          <div className="px-8 py-8">
            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="text-lg leading-relaxed mb-6">
                Carbon Prospect serves as the central hub for the world's carbon management ecosystem. 
                We unite technology innovators, project developers, service providers, and organizations 
                seeking to measure, reduce, and offset their carbon footprint.
              </p>
              <p className="text-lg leading-relaxed mb-6">
                In an era where climate action is imperative, we believe that connecting the right 
                solutions with the right organizations shouldn't be complicated. Our platform facilitates 
                these connections across public and private sectors globally, accelerating the deployment 
                of carbon reduction technologies and projects.
              </p>
              <p className="text-lg leading-relaxed">
                By providing free tools, verified marketplace listings, and comprehensive resources, 
                we're democratizing access to carbon management solutions and empowering every organization 
                to participate in the net-zero transition.
              </p>
            </div>
          </div>
        </div>

        {/* Vision & Values Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Global Reach */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-blue-500">
            <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Global Reach</h3>
            <p className="text-gray-600">
              Connecting carbon solutions across continents, facilitating international collaboration 
              between public and private sectors to address climate challenges at scale.
            </p>
          </div>

          {/* Verified Ecosystem */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-green-500">
            <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Verified Ecosystem</h3>
            <p className="text-gray-600">
              Every technology provider, consultant, and project developer on our platform is vetted, 
              ensuring organizations connect with credible partners for their carbon management needs.
            </p>
          </div>

          {/* Open Access */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-purple-500">
            <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Open Access</h3>
            <p className="text-gray-600">
              Free tools and resources available to all, from SMEs to Fortune 500 companies, 
              ensuring every organization can participate in the carbon economy regardless of size.
            </p>
          </div>
        </div>

        {/* Our Platform Section */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-8 mb-12">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">How We Facilitate the Carbon Ecosystem</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-500 text-white">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Technology Marketplace</h3>
                  <p className="mt-2 text-gray-600">
                    Browse verified carbon reduction technologies from global manufacturers, 
                    compare solutions, and connect directly with providers.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Project Directory</h3>
                  <p className="mt-2 text-gray-600">
                    Discover carbon offset projects worldwide, from reforestation to renewable energy, 
                    with transparent impact metrics and investment opportunities.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-purple-500 text-white">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Free Assessment Tools</h3>
                  <p className="mt-2 text-gray-600">
                    Carbon footprint calculators, project feasibility assessments, and compliance 
                    reporting tools available at no cost to all users.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Expert Network</h3>
                  <p className="mt-2 text-gray-600">
                    Connect with verified consultants and service providers for carbon accounting, 
                    ESG reporting, and implementation support.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Impact Section */}
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden mb-12">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-6">
            <h2 className="text-2xl font-bold text-white">Our Impact</h2>
          </div>
          <div className="px-8 py-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">For Public Sector</h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Support national and regional climate commitments with verified solutions</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Facilitate public-private partnerships for large-scale carbon projects</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Enable transparent monitoring and reporting of climate initiatives</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Access global best practices and proven technologies</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">For Private Sector</h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Streamline carbon management across complex supply chains</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Meet regulatory compliance requirements efficiently</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Identify cost-effective carbon reduction opportunities</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Enhance ESG performance and investor confidence</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        {/* Our Services Section */}
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden mb-12">
          <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-8 py-6">
            <h2 className="text-2xl font-bold text-white">Our Professional Services</h2>
          </div>
          <div className="px-8 py-8">
            <p className="text-lg text-gray-700 mb-8">
              Beyond our platform, Carbon Prospect provides comprehensive professional services to ensure 
              your carbon initiatives succeed from planning through implementation.
            </p>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Compliance Reports */}
              <div className="border-l-4 border-indigo-500 pl-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-md bg-indigo-100 text-indigo-600">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Detailed Compliance Reports</h3>
                    <p className="text-gray-600">
                      We prepare comprehensive compliance reports aligned with international standards including 
                      TCFD, CSRD, SEC climate disclosures, and regional requirements. Our reports are audit-ready 
                      and designed to meet the scrutiny of regulators and stakeholders.
                    </p>
                  </div>
                </div>
              </div>

              {/* Validation & Auditing */}
              <div className="border-l-4 border-green-500 pl-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-md bg-green-100 text-green-600">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Validation & Auditing Services</h3>
                    <p className="text-gray-600">
                      We organize and facilitate third-party validation and verification of carbon projects. 
                      Our network includes accredited auditors for major standards including Verra, Gold Standard, 
                      and national compliance schemes, ensuring your projects meet certification requirements.
                    </p>
                  </div>
                </div>
              </div>

              {/* Broker Connections */}
              <div className="border-l-4 border-blue-500 pl-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-md bg-blue-100 text-blue-600">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Broker Network Access</h3>
                    <p className="text-gray-600">
                      We connect project developers and credit sellers with our vetted network of carbon brokers 
                      and traders. This ensures competitive pricing, market liquidity, and professional transaction 
                      management for both spot and forward carbon credit sales.
                    </p>
                  </div>
                </div>
              </div>

              {/* Project Implementation */}
              <div className="border-l-4 border-purple-500 pl-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-md bg-purple-100 text-purple-600">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Project Implementation Support</h3>
                    <p className="text-gray-600">
                      From initial feasibility studies to operational deployment, we provide hands-on assistance 
                      in project implementation. This includes technology selection, stakeholder engagement, 
                      monitoring system setup, and ongoing performance optimization.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-indigo-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <h4 className="text-xl font-semibold text-gray-900">End-to-End Carbon Solutions</h4>
              </div>
              <p className="text-center text-gray-700 max-w-3xl mx-auto">
                Whether you need strategic guidance, technical implementation, or market access, 
                our team combines deep carbon market expertise with practical execution capabilities 
                to ensure your carbon initiatives deliver measurable results.
              </p>
            </div>
          </div>
        </div>
        
        {/* Contact Form */}
        <div id="contact" className="bg-white shadow-xl rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-green-600 px-8 py-6">
            <h2 className="text-2xl font-bold text-white">Get in Touch</h2>
          </div>
          <div className="px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div>
                <p className="text-lg text-gray-700 mb-6">
                  Whether you're a technology provider, project developer, consultant, or organization 
                  seeking carbon solutions, we're here to help you connect with the right partners.
                </p>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="text-gray-700">contact@carbonprospect.com</span>
                      </div>
                      
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                        </svg>
                        <span className="text-gray-700">Global Operations - Serving All Time Zones</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <h4 className="font-semibold text-green-900 mb-2">For Providers</h4>
                      <p className="text-sm text-green-800">
                        List your technology, project, or service on our platform
                      </p>
                      <p className="text-sm font-medium text-green-900 mt-2">
                        providers@carbonprospect.com
                      </p>
                    </div>
                    
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">For Organizations</h4>
                      <p className="text-sm text-blue-800">
                        Find carbon solutions for your business
                      </p>
                      <p className="text-sm font-medium text-blue-900 mt-2">
                        solutions@carbonprospect.com
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2">Partnership Opportunities</h4>
                    <p className="text-sm text-gray-700">
                      Interested in strategic partnerships, API integration, or white-label solutions? 
                      Let's discuss how we can work together to scale carbon action.
                    </p>
                    <p className="text-sm font-medium text-gray-900 mt-2">
                      partnerships@carbonprospect.com
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                {formStatus === 'success' ? (
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-8 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-xl font-semibold text-green-800 mb-2">Message Sent Successfully!</h3>
                    <p className="text-gray-700">
                      Thank you for reaching out. Our team will respond within 24 hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                          Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          id="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                          Email *
                        </label>
                        <input
                          type="email"
                          name="email"
                          id="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                        Subject *
                      </label>
                      <select
                        name="subject"
                        id="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="">Select a topic</option>
                        <option value="list-solution">List a Technology/Solution</option>
                        <option value="list-project">List a Carbon Project</option>
                        <option value="find-solutions">Find Carbon Solutions</option>
                        <option value="partnership">Partnership Inquiry</option>
                        <option value="support">Technical Support</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                        Message *
                      </label>
                      <textarea
                        name="message"
                        id="message"
                        rows={6}
                        value={formData.message}
                        onChange={handleChange}
                        required
                        className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Tell us how we can help..."
                      />
                    </div>
                    
                    <div>
                      <button
                        type="submit"
                        className="w-full flex justify-center py-3 px-6 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                      >
                        Send Message
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AboutPage;