import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import ConstructionCalculator from './ConstructionCalculator';

const CarbonProspectLanding = () => {
  // Mini carbon footprint calculator state
  const [quickCalcData, setQuickCalcData] = useState({
    electricity: '',
    gas: '',
    transportation: '',
    waste: ''
  });
  const [quickCalcResults, setQuickCalcResults] = useState(null);
  
  // Demo carbon calculator state
  const [projectSize, setProjectSize] = useState(100);
  const [projectYears, setProjectYears] = useState(30);
  const [carbonPrice, setCarbonPrice] = useState(50);
  const [treeType, setTreeType] = useState('pine');
  const [totalProjectCost, setTotalProjectCost] = useState(200000);
  const [results, setResults] = useState(null);
  
  // Sample data for demo charts
  const [cashFlowData, setCashFlowData] = useState([]);
  
  // States for actual data from API
  const [featuredProjects, setFeaturedProjects] = useState([]);
  const [featuredSolutions, setFeaturedSolutions] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingSolutions, setLoadingSolutions] = useState(true);

  // Fallback sample data in case API returns no data
  const sampleProjects = [
    {
      id: 'sample-1',
      name: 'Kenya Reforestation Initiative',
      description: 'Large-scale reforestation project aimed at restoring degraded lands and providing sustainable livelihoods for local communities.',
      location: 'Kenya, East Africa',
      category: 'Reforestation',
      status: 'Active',
      reduction_target: 250000,
      image_url: 'https://images.unsplash.com/photo-1564760055775-d63b17a55c44?ixlib=rb-4.0.3&w=400&h=300&fit=crop'
    },
    {
      id: 'sample-2',
      name: 'Solar Farm Development',
      description: 'Installing solar panels to generate clean energy and reduce reliance on fossil fuels.',
      location: 'California, USA',
      category: 'Renewable Energy',
      status: 'Active',
      reduction_target: 150000,
      image_url: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?ixlib=rb-4.0.3&w=400&h=300&fit=crop'
    },
    {
      id: 'sample-3',
      name: 'Wind Energy Project',
      description: 'Developing wind turbines to harness renewable energy and reduce carbon emissions.',
      location: 'Texas, USA',
      category: 'Renewable Energy',
      status: 'Funding',
      reduction_target: 200000,
      image_url: 'https://images.unsplash.com/photo-1548337138-e87d889cc369?ixlib=rb-4.0.3&w=400&h=300&fit=crop'
    }
  ];

  const sampleSolutions = [
    {
      id: 'solution-1',
      name: 'Direct Air Capture System',
      description: 'Advanced DAC technology that captures CO2 directly from ambient air using solid sorbent filters.',
      category: 'Carbon Capture',
      emissions_reduction_factor: 0.95,
      implementation_time: '6-12 months',
      unit_price: 150,
      unit: 'tCO2',
      image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&w=300&h=200&fit=crop'
    },
    {
      id: 'solution-2',
      name: 'Smart Building Management',
      description: 'AI-powered building management system optimizing HVAC, lighting, and energy usage.',
      category: 'Energy Efficiency',
      emissions_reduction_factor: 0.30,
      implementation_time: '1-3 months',
      unit_price: 25000,
      unit: 'building',
      image_url: 'https://images.unsplash.com/photo-1558002038-1055907df827?ixlib=rb-4.0.3&w=300&h=200&fit=crop'
    },
    {
      id: 'solution-3',
      name: 'Electric Fleet Conversion',
      description: 'Complete fleet electrification solution including vehicles and charging infrastructure.',
      category: 'Transportation',
      emissions_reduction_factor: 0.75,
      implementation_time: '6-9 months',
      unit_price: 45000,
      unit: 'vehicle',
      image_url: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?ixlib=rb-4.0.3&w=300&h=200&fit=crop'
    }
  ];

  // Fetch featured projects from API
  useEffect(() => {
    const fetchFeaturedProjects = async () => {
      try {
        setLoadingProjects(true);
        // Use the correct API URL - should be http://localhost:3001/api/projects
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
        const response = await fetch(`${apiUrl}/api/projects`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Projects API response:', data);
          console.log('Response type:', Array.isArray(data) ? 'array' : 'object');
          console.log('Data length:', Array.isArray(data) ? data.length : 'N/A');
          
          // If we have data, use it; otherwise use sample data
          if (Array.isArray(data) && data.length > 0) {
            // Take first 3 projects
            const projectsToShow = data.slice(0, 3);
            setFeaturedProjects(projectsToShow);
          } else {
            console.log('No projects from API, using sample data');
            setFeaturedProjects(sampleProjects);
          }
        } else {
          console.error('API response not OK:', response.status, response.statusText);
          // Try to get error details
          try {
            const errorData = await response.json();
            console.error('Error details:', errorData);
          } catch (e) {
            console.error('Could not parse error response');
          }
          setFeaturedProjects(sampleProjects);
        }
      } catch (error) {
        console.error('Error fetching featured projects:', error);
        // Use sample data as fallback
        setFeaturedProjects(sampleProjects);
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchFeaturedProjects();
  }, []);

  // Fetch featured solutions/products from API
  useEffect(() => {
    const fetchFeaturedSolutions = async () => {
      try {
        setLoadingSolutions(true);
        // Use the correct API URL - should be http://localhost:3001/api/products
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
        const response = await fetch(`${apiUrl}/api/products`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Products API response:', data);
          console.log('Response type:', typeof data);
          console.log('Has products property:', data.hasOwnProperty('products'));
          
          // Handle both paginated and non-paginated responses
          const products = data.products || data;
          console.log('Products array:', Array.isArray(products) ? `${products.length} items` : 'not an array');
          
          if (Array.isArray(products) && products.length > 0) {
            // Take first 3 products
            const productsToShow = products.slice(0, 3);
            setFeaturedSolutions(productsToShow);
          } else {
            console.log('No products from API, using sample data');
            setFeaturedSolutions(sampleSolutions);
          }
        } else {
          console.error('API response not OK:', response.status, response.statusText);
          // Try to get error details
          try {
            const errorData = await response.json();
            console.error('Error details:', errorData);
          } catch (e) {
            console.error('Could not parse error response');
          }
          setFeaturedSolutions(sampleSolutions);
        }
      } catch (error) {
        console.error('Error fetching featured solutions:', error);
        // Use sample data as fallback
        setFeaturedSolutions(sampleSolutions);
      } finally {
        setLoadingSolutions(false);
      }
    };

    fetchFeaturedSolutions();
  }, []);
  
  // Quick calculator functions
  const calculateQuickFootprint = () => {
    const electricity = parseFloat(quickCalcData.electricity) || 0;
    const gas = parseFloat(quickCalcData.gas) || 0;
    const transportation = parseFloat(quickCalcData.transportation) || 0;
    const waste = parseFloat(quickCalcData.waste) || 0;
    
    // Simple emission factors (tCO2e per unit)
    const electricityFactor = 0.0005; // per kWh
    const gasFactor = 0.185; // per cubic meter
    const transportationFactor = 0.00021; // per km
    const wasteFactor = 0.467; // per ton
    
    const emissions = {
      electricity: electricity * electricityFactor * 12, // Annual
      gas: gas * gasFactor * 12,
      transportation: transportation * transportationFactor * 12,
      waste: waste * wasteFactor * 12
    };
    
    const total = Object.values(emissions).reduce((sum, val) => sum + val, 0);
    
    setQuickCalcResults({
      emissions,
      total,
      pieData: [
        { name: 'Electricity', value: emissions.electricity, color: '#3B82F6' },
        { name: 'Gas', value: emissions.gas, color: '#10B981' },
        { name: 'Transportation', value: emissions.transportation, color: '#F59E0B' },
        { name: 'Waste', value: emissions.waste, color: '#EF4444' }
      ]
    });
  };
  
  // Only keeping the forestry project type
  const projectType = { 
    id: 'forestry', 
    name: 'Afforestation/Reforestation', 
    icon: '🌳', 
    description: 'Establish forests on land that hasn\'t been forested in recent history.' 
  };
  
  const treeTypes = [
    { id: 'pine', name: 'Pine', sequestrationRate: 8.5 },
    { id: 'oak', name: 'Oak', sequestrationRate: 7.3 },
    { id: 'eucalyptus', name: 'Eucalyptus', sequestrationRate: 12.2 },
    { id: 'custom', name: 'Custom Tree Type', sequestrationRate: 10.0 }
  ];
  
  // Custom tree type state
  const [customSequestrationRate, setCustomSequestrationRate] = useState(10.0);
  const [yearsToMaturity, setYearsToMaturity] = useState(15);
  
  // Calculate demo results when inputs change
  useEffect(() => {
    // Simple calculation logic for demo purposes
    const treeTypeObj = treeTypes.find(tree => tree.id === treeType);
    // Use custom sequestration rate if custom tree type is selected
    const sequestrationRate = treeType === 'custom' ? customSequestrationRate : (treeTypeObj ? treeTypeObj.sequestrationRate : 8.5);
    
    const totalSequestration = projectSize * sequestrationRate * projectYears * 0.85; // 0.85 success factor
    const totalRevenue = totalSequestration * carbonPrice;
    
    // Use the user-provided total project cost instead of calculating it
    const totalCost = totalProjectCost === '' ? 0 : totalProjectCost;
    const netProfit = totalRevenue - totalCost;
    
    // Calculate ROI
    const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;
    
    // Generate yearly data for charts
    const cashFlow = [];
    
    // Distribute total cost over project years (simple linear distribution for demo)
    let cumulativeCashFlow = 0;
    let breakEvenYear = 'N/A';
    
    for (let year = 0; year <= projectYears; year++) {
      // Adjust growth curve based on years to maturity for custom trees
      const growthRate = treeType === 'custom' ? (yearsToMaturity > 0 ? 3 / yearsToMaturity : 0.1) : 0.1;
      const yearlySequestration = year === 0 ? 0 : projectSize * sequestrationRate * (1 - Math.exp(-growthRate * year)) * 0.85;
      
      const yearlyRevenue = yearlySequestration * carbonPrice;
      
      // Distribute cost more heavily in early years (50% in first year, rest distributed evenly)
      const thisYearCost = year === 0 ? totalCost * 0.5 : (totalCost * 0.5) / (projectYears);
      
      const yearlyNetCashFlow = yearlyRevenue - thisYearCost;
      cumulativeCashFlow += yearlyNetCashFlow;
      
      if (cumulativeCashFlow >= 0 && breakEvenYear === 'N/A') {
        breakEvenYear = year;
      }
      
      cashFlow.push({
        year,
        revenue: yearlyRevenue,
        cost: thisYearCost,
        netCashFlow: yearlyNetCashFlow,
        cumulativeNetCashFlow: cumulativeCashFlow
      });
    }
    
    setCashFlowData(cashFlow);
    
    setResults({
      totalSequestration: Math.round(totalSequestration),
      totalRevenue: Math.round(totalRevenue),
      totalCost: Math.round(totalCost),
      netProfit: Math.round(netProfit),
      roi: roi.toFixed(1),
      breakEvenYear
    });
  }, [projectSize, projectYears, carbonPrice, treeType, totalProjectCost, customSequestrationRate, yearsToMaturity, treeTypes]);

  return (
    <>
      {/* SEO Meta Tags - Since we can't use react-helmet, document these for manual addition to index.html */}
      {/* 
        Add these to your public/index.html file in the <head> section:
        
        <title>Carbon Footprint Calculator & Carbon Project Assessment Tool | Carbon Prospect</title>
        <meta name="description" content="Free carbon footprint calculator and carbon project assessment tool. Measure organizational emissions, create carbon reduction projects, analyze carbon technologies, and generate TCFD, CSRD compliance reports. Start your net-zero journey today." />
        <meta name="keywords" content="carbon footprint calculator, carbon project assessment, GHG emissions calculator, carbon reduction technologies, TCFD reporting, CSRD compliance, net zero planning, carbon sequestration calculator, afforestation projects" />
        
        <meta property="og:title" content="Carbon Footprint Calculator & Project Assessment | Carbon Prospect" />
        <meta property="og:description" content="Measure your carbon footprint, assess carbon projects, and create sustainability reports with our free online tools." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://carbon-prospect.app" />
        <meta property="og:image" content="https://carbon-prospect.app/og-image.jpg" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Carbon Footprint Calculator | Carbon Prospect" />
        <meta name="twitter:description" content="Free tools to measure emissions and plan carbon reduction projects" />
        
        <link rel="canonical" href="https://carbon-prospect.app" />
        <meta name="robots" content="index, follow" />
        
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "Carbon Prospect",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web Browser",
          "description": "Carbon footprint calculator and carbon project assessment tool for organizations. Measure emissions, create carbon projects, and generate compliance reports.",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "ratingCount": "127"
          }
        }
        </script>
      */}

      <div className="bg-white relative overflow-hidden font-sans">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 -mt-16 -mr-32 hidden lg:block">
          <svg width="404" height="384" fill="none" viewBox="0 0 404 384" className="text-green-50">
            <defs>
              <pattern id="de316486-4a29-4312-bdfc-fbce2132a2c1" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="4" height="4" className="text-green-100" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="404" height="384" fill="url(#de316486-4a29-4312-bdfc-fbce2132a2c1)" />
          </svg>
        </div>
        <div className="absolute bottom-0 left-0 -mb-16 -ml-32 hidden lg:block">
          <svg width="404" height="384" fill="none" viewBox="0 0 404 384" className="text-green-50">
            <defs>
              <pattern id="de316486-4a29-4312-bdfc-fbce2132a2c2" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="4" height="4" className="text-green-100" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="404" height="384" fill="url(#de316486-4a29-4312-bdfc-fbce2132a2c2)" />
          </svg>
        </div>
        
        <div className="absolute top-1/4 left-0 opacity-10">
          <div className="w-64 h-64 rounded-full bg-green-300 filter blur-3xl"></div>
        </div>
        
        <div className="absolute bottom-1/3 right-0 opacity-10">
          <div className="w-64 h-64 rounded-full bg-green-400 filter blur-3xl"></div>
        </div>

        {/* Hero section with Quick Carbon Calculator */}
        <header className="relative bg-gradient-to-r from-green-800 via-green-600 to-green-700 py-20">
          <div className="absolute inset-0 bg-opacity-10 overflow-hidden">
            <svg className="absolute left-0 top-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M0 40L40 0M20 40L40 20M0 20L20 0" stroke="white" strokeWidth="0.5" strokeOpacity="0.1" fill="none"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid-pattern)" />
            </svg>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center p-1 bg-green-200 bg-opacity-20 rounded-full mb-4">
                <span className="px-3 py-0.5 text-sm font-semibold text-white bg-green-500 rounded-full">
                  Free Carbon Management Tools
                </span>
              </div>
              <h1 className="text-4xl font-extrabold text-white sm:text-5xl sm:tracking-tight lg:text-6xl drop-shadow-sm">
                Carbon Footprint Calculator & Project Assessment
              </h1>
              <p className="mt-6 max-w-2xl mx-auto text-xl text-green-100">
                Measure your carbon footprint, assess reduction projects, and create sustainability reports - all in one platform
              </p>
            </div>

            {/* Quick Carbon Footprint Calculator */}
            <section className="max-w-4xl mx-auto" aria-labelledby="calculator-heading">
              <div className="bg-white bg-opacity-95 rounded-xl shadow-2xl p-8">
                <h2 id="calculator-heading" className="text-2xl font-bold text-gray-900 mb-6 text-center">Quick Carbon Footprint Calculator</h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-gray-600 mb-4">Enter your monthly usage to get an instant carbon footprint estimate:</p>
                    
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="electricity-input" className="block text-sm font-medium text-gray-700 mb-1">
                          Electricity Usage (kWh/month)
                        </label>
                        <input
                          id="electricity-input"
                          type="number"
                          value={quickCalcData.electricity}
                          onChange={(e) => setQuickCalcData({...quickCalcData, electricity: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="e.g., 350"
                          aria-label="Monthly electricity usage in kilowatt hours"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="gas-input" className="block text-sm font-medium text-gray-700 mb-1">
                          Gas Usage (cubic meters/month)
                        </label>
                        <input
                          id="gas-input"
                          type="number"
                          value={quickCalcData.gas}
                          onChange={(e) => setQuickCalcData({...quickCalcData, gas: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="e.g., 50"
                          aria-label="Monthly gas usage in cubic meters"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="transport-input" className="block text-sm font-medium text-gray-700 mb-1">
                          Transportation (km/month)
                        </label>
                        <input
                          id="transport-input"
                          type="number"
                          value={quickCalcData.transportation}
                          onChange={(e) => setQuickCalcData({...quickCalcData, transportation: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="e.g., 1000"
                          aria-label="Monthly transportation distance in kilometers"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="waste-input" className="block text-sm font-medium text-gray-700 mb-1">
                          Waste Generated (tons/month)
                        </label>
                        <input
                          id="waste-input"
                          type="number"
                          value={quickCalcData.waste}
                          onChange={(e) => setQuickCalcData({...quickCalcData, waste: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="e.g., 0.5"
                          aria-label="Monthly waste generation in tons"
                        />
                      </div>
                    </div>
                    
                    <button
                      onClick={calculateQuickFootprint}
                      className="w-full mt-6 px-6 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors"
                      aria-label="Calculate carbon footprint"
                    >
                      Calculate My Footprint
                    </button>
                  </div>
                  
                  <div>
                    {quickCalcResults ? (
                      <div>
                        <div className="bg-green-50 rounded-lg p-4 mb-4">
                          <h3 className="text-lg font-semibold text-green-800 mb-2">Your Annual Carbon Footprint</h3>
                          <p className="text-3xl font-bold text-green-900">{quickCalcResults.total.toFixed(2)} tCO₂e</p>
                          <p className="text-sm text-green-600 mt-1">tonnes of CO₂ equivalent per year</p>
                        </div>
                        
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={quickCalcResults.pieData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={70}
                                label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              >
                                {quickCalcResults.pieData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        
                        <nav className="mt-4 flex gap-4" aria-label="Next steps">
                          <Link 
                            to="/carbon-footprint/new"
                            className="flex-1 text-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                          >
                            Full Assessment
                          </Link>
                          <Link 
                            to="/dashboard"
                            className="flex-1 text-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                          >
                            View Dashboard
                          </Link>
                        </nav>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          <p>Enter your usage data to see your carbon footprint breakdown</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>
          
          {/* Curved bottom edge */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-white transform translate-y-1/2 rounded-t-full"></div>
        </header>

        {/* Quick Actions Section */}
        <section className="py-16 bg-gray-50" aria-labelledby="quick-actions-heading">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 id="quick-actions-heading" className="text-3xl font-bold text-gray-900">Get Started with Carbon Management</h2>
              <p className="mt-4 text-xl text-gray-600">Choose your path to carbon neutrality</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <article className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-shadow">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Measure Emissions</h3>
                  <p className="text-gray-600 mb-4">Calculate your organization's complete carbon footprint with our comprehensive assessment tool</p>
                  <Link 
                    to="/carbon-footprint/new"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Start Assessment
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                </div>
              </article>
              
              <article className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-shadow">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Generate Reports</h3>
                  <p className="text-gray-600 mb-4">Create compliance reports for TCFD, CSRD, and other frameworks automatically</p>
                  <Link 
                    to="/dashboard"
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    View Reports
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                </div>
              </article>
              
              <article className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-shadow">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Plan Projects</h3>
                  <p className="text-gray-600 mb-4">Assess carbon reduction project feasibility with financial modeling tools</p>
                  <Link 
                    to="/carbon-project/new"
                    className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                  >
                    Create Project
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* Interactive Tool Section 1: Browser-Based Demo */}
        <section className="py-20 bg-white relative" aria-labelledby="carbon-project-demo">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 id="carbon-project-demo" className="inline-flex items-center text-base text-green-600 font-semibold tracking-wide uppercase bg-green-50 px-3 py-1 rounded-full">
                No Downloads Required
              </h2>
              <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Powerful Carbon Project Assessment in Your Browser
              </p>
              <p className="mt-4 max-w-3xl mx-auto text-xl text-gray-500">
                Our web-based tool provides immediate access to sophisticated carbon project analysis without installing any software.
              </p>
            </div>

            {/* Demo Tool 1: Browser-based Simulation */}
            <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200 mb-16 transform transition-all duration-300 hover:shadow-2xl">
              <div className="p-1 bg-gradient-to-r from-green-500 to-green-600"></div>
              <div className="p-6">
                <div className="flex items-center mb-4 border-b pb-2">
                  <div className="flex space-x-1">
                    <div className="h-3 w-3 rounded-full bg-red-500"></div>
                    <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="ml-4 px-4 py-1 bg-gray-100 rounded-md text-xs text-gray-600 flex-grow text-center">
                    carbon-prospect.app
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg shadow-inner">
                  <h3 className="text-lg font-medium mb-6 text-green-700 border-b pb-2">Try It: Afforestation/Reforestation Project Assessment</h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <div className="mb-4">
                        <label htmlFor="project-type-demo" className="block text-sm font-medium mb-1 text-gray-700">
                          Project Type
                        </label>
                        <div id="project-type-demo" className="w-full p-2 border rounded bg-green-50 text-gray-700 flex items-center">
                          {projectType.icon} {projectType.name}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{projectType.description}</p>
                      </div>
                      
                      <div className="mb-4">
                        <label htmlFor="project-size" className="block text-sm font-medium mb-1 text-gray-700">
                          Project Size (hectares)
                        </label>
                        <input
                          id="project-size"
                          type="number"
                          min="1"
                          value={projectSize}
                          onChange={(e) => setProjectSize(Math.max(1, parseInt(e.target.value) || 0))}
                          className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        />
                      </div>
                      
                      <div className="mb-4">
                        <label htmlFor="tree-type" className="block text-sm font-medium mb-1 text-gray-700">
                          Tree Type
                        </label>
                        <select 
                          id="tree-type"
                          value={treeType}
                          onChange={(e) => setTreeType(e.target.value)}
                          className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        >
                          {treeTypes.map(tree => (
                            <option key={tree.id} value={tree.id}>
                              {tree.name} - {tree.sequestrationRate} tCO₂e/ha/year
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {treeType === 'custom' && (
                        <div className="bg-green-50 p-4 rounded-lg mb-4 border border-green-100">
                          <h4 className="text-sm font-medium text-green-800 mb-3">Custom Tree Settings</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label htmlFor="custom-rate" className="block text-xs font-medium mb-1 text-gray-700">
                                Sequestration Rate (tCO₂e/ha/year)
                              </label>
                              <input
                                id="custom-rate"
                                type="number"
                                step="0.1"
                                value={customSequestrationRate}
                                onChange={(e) => setCustomSequestrationRate(e.target.value === '' ? 0 : Number(e.target.value))}
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                              />
                            </div>
                            <div>
                              <label htmlFor="maturity-years" className="block text-xs font-medium mb-1 text-gray-700">
                                Years to Maturity
                              </label>
                              <input
                                id="maturity-years"
                                type="number"
                                value={yearsToMaturity}
                                onChange={(e) => setYearsToMaturity(e.target.value === '' ? 0 : Number(e.target.value))}
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="mb-4">
                        <label htmlFor="total-cost" className="block text-sm font-medium mb-1 text-gray-700">
                          Total Project Cost ($)
                        </label>
                        <input
                          id="total-cost"
                          type="number"
                          value={totalProjectCost}
                          onChange={(e) => setTotalProjectCost(e.target.value === '' ? '' : Number(e.target.value) || 0)}
                          className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="mb-4">
                          <label htmlFor="project-years" className="block text-sm font-medium mb-1 text-gray-700">
                            Project Years
                          </label>
                          <input
                            id="project-years"
                            type="range"
                            min="5"
                            max="50"
                            value={projectYears}
                            onChange={(e) => setProjectYears(parseInt(e.target.value))}
                            className="w-full h-2 bg-green-100 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="text-sm text-center mt-1">{projectYears} years</div>
                        </div>
                        
                        <div className="mb-4">
                          <label htmlFor="carbon-price" className="block text-sm font-medium mb-1 text-gray-700">
                            Carbon Price ($/tCO₂e)
                          </label>
                          <input
                            id="carbon-price"
                            type="range"
                            min="10"
                            max="100"
                            value={carbonPrice}
                            onChange={(e) => setCarbonPrice(parseInt(e.target.value))}
                            className="w-full h-2 bg-green-100 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="text-sm text-center mt-1">${carbonPrice}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      {results && (
                        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                          <h4 className="text-md font-medium mb-3 text-green-700 border-b pb-2">
                            Quick Project Assessment
                          </h4>
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="bg-gray-50 p-3 rounded shadow-inner">
                              <h5 className="text-xs font-medium text-gray-500">Total Sequestration</h5>
                              <p className="text-lg font-bold text-green-700">{results.totalSequestration.toLocaleString()} tCO₂e</p>
                            </div>
                            
                            <div className="bg-gray-50 p-3 rounded shadow-inner">
                              <h5 className="text-xs font-medium text-gray-500">Net Profit</h5>
                              <p className="text-lg font-bold text-green-700">${results.netProfit.toLocaleString()}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="bg-gray-50 p-3 rounded shadow-inner">
                              <h5 className="text-xs font-medium text-gray-500">Total Revenue</h5>
                              <p className="text-lg font-bold text-green-700">${results.totalRevenue.toLocaleString()}</p>
                            </div>
                            
                            <div className="bg-gray-50 p-3 rounded shadow-inner">
                              <h5 className="text-xs font-medium text-gray-500">Total Costs</h5>
                              <p className="text-lg font-bold text-green-700">${results.totalCost.toLocaleString()}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-50 p-3 rounded shadow-inner">
                              <h5 className="text-xs font-medium text-gray-500">ROI</h5>
                              <p className="text-lg font-bold text-green-700">{results.roi}%</p>
                            </div>
                            
                            <div className="bg-gray-50 p-3 rounded shadow-inner">
                              <h5 className="text-xs font-medium text-gray-500">Break-even</h5>
                              <p className="text-lg font-bold text-green-700">Year {results.breakEvenYear}</p>
                            </div>
                          </div>
                          
                          <div className="mt-4 h-40">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={cashFlowData.filter((d, i) => i % 5 === 0 || i === cashFlowData.length - 1)}
                                margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} />
                                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
                                <Bar dataKey="revenue" name="Revenue" fill="#4ade80" />
                                <Bar dataKey="cost" name="Costs" fill="#f87171" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quick Start Button */}
            <div className="mt-16 text-center">
              <Link
                to="/carbon-project/new"
                className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-md shadow-lg text-white bg-green-600 hover:bg-green-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Try Full Assessment Tool
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* Interactive Tool Section 2: Construction Materials Calculator */}
        <section className="py-20 bg-gray-50 relative" aria-labelledby="construction-calculator">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 id="construction-calculator" className="inline-flex items-center text-base text-blue-600 font-semibold tracking-wide uppercase bg-blue-50 px-3 py-1 rounded-full">
                Construction Emissions
              </h2>
              <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Analyze Construction Material Choices
              </p>
              <p className="mt-4 max-w-3xl mx-auto text-xl text-gray-500">
                See how your selection of materials can dramatically reduce the carbon footprint of construction projects.
              </p>
            </div>

            {/* Construction Calculator Tool */}
            <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200 mb-16 transform transition-all duration-300 hover:shadow-2xl">
              <div className="p-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
              <div className="p-6">
                <div className="flex items-center mb-4 border-b pb-2">
                  <div className="flex space-x-1">
                    <div className="h-3 w-3 rounded-full bg-red-500"></div>
                    <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                    <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                  </div>
                  <div className="ml-4 px-4 py-1 bg-gray-100 rounded-md text-xs text-gray-600 flex-grow text-center">
                    carbon-prospect.app/construction
                  </div>
                </div>
                
                {/* Construction Calculator Component */}
                <ConstructionCalculator />
              </div>
            </div>
          </div>
        </section>

        {/* Platform Benefits Section - The Hook */}
        <section className="py-20 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden" aria-labelledby="platform-benefits">
          <div className="absolute inset-0 opacity-5">
            <svg className="absolute left-0 top-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="benefits-pattern" width="60" height="60" patternUnits="userSpaceOnUse">
                  <circle cx="30" cy="30" r="2" fill="currentColor" className="text-green-600"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#benefits-pattern)" />
            </svg>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16">
              <h2 id="platform-benefits" className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
                The Complete Carbon Management Platform
              </h2>
              <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
                Connect, collaborate, and comply. Whether you're developing projects, manufacturing solutions, 
                or seeking carbon reduction strategies - find everything you need in one place.
              </p>
            </div>

            {/* Benefits Grid */}
            <div className="grid lg:grid-cols-2 gap-12 mb-20">
              {/* Technology Manufacturers */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-green-500 transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center mb-6">
                  <div className="bg-green-100 rounded-full p-3 mr-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">For Technology Manufacturers</h3>
                </div>
                <ul className="space-y-4 mb-6">
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700"><strong>Global Marketplace Access:</strong> Showcase your carbon capture, renewable energy, or efficiency solutions to buyers worldwide</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700"><strong>Performance Transparency:</strong> Display verified emissions reduction data, certifications, and third-party validations</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700"><strong>Direct Business Connections:</strong> Connect directly with enterprise buyers and project developers</span>
                  </li>
                </ul>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-800 font-medium">Perfect for businesses of all sizes - from startups to Fortune 500 suppliers</p>
                </div>
              </div>

              {/* Project Developers */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-blue-500 transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center mb-6">
                  <div className="bg-blue-100 rounded-full p-3 mr-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">For Project Developers</h3>
                </div>
                <ul className="space-y-4 mb-6">
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-blue-500 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700"><strong>Funding & Investment Access:</strong> Connect with verified investors and carbon credit buyers actively seeking projects</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-blue-500 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700"><strong>Technology Discovery:</strong> Find and compare verified solutions for your specific project needs</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-blue-500 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700"><strong>Compliance Ready:</strong> Access tools aligned with Article 6, CORSIA, and voluntary carbon market standards</span>
                  </li>
                </ul>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-800 font-medium">From small-scale community projects to large industrial initiatives</p>
                </div>
              </div>

              {/* Service Providers & Consultants */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-purple-500 transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center mb-6">
                  <div className="bg-purple-100 rounded-full p-3 mr-4">
                    <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">For Consultants & Service Providers</h3>
                </div>
                <ul className="space-y-4 mb-6">
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-purple-500 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700"><strong>Showcase Your Expertise:</strong> Highlight your certifications, methodologies, and successful case studies</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-purple-500 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700"><strong>Client Discovery:</strong> Connect with organizations seeking carbon accounting, ESG reporting, and verification services</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-purple-500 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700"><strong>Stay Current:</strong> Access latest regulatory updates and compliance requirements across jurisdictions</span>
                  </li>
                </ul>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-purple-800 font-medium">Supporting independent consultants to Big 4 firms</p>
                </div>
              </div>

              {/* Organizations & Buyers */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-orange-500 transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center mb-6">
                  <div className="bg-orange-100 rounded-full p-3 mr-4">
                    <svg className="w-8 h-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">For Organizations</h3>
                </div>
                <ul className="space-y-4 mb-6">
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-orange-500 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700"><strong>One-Stop Solution Hub:</strong> Find everything from carbon calculators to offset projects and consulting services</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-orange-500 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700"><strong>Compliance Tools:</strong> Free carbon footprint calculators and reporting tools for TCFD, CSRD, SEC, and more</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-orange-500 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700"><strong>Verified Partners:</strong> All providers are vetted with transparent credentials and performance history</span>
                  </li>
                </ul>
                <div className="bg-orange-50 rounded-lg p-4">
                  <p className="text-sm text-orange-800 font-medium">Suitable for SMEs to multinational corporations across all sectors</p>
                </div>
              </div>
            </div>

            {/* Compliance & Regulation Banner */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-8 text-white mb-16">
              <h3 className="text-2xl font-bold mb-4 text-center">Stay Compliant Across All Major Jurisdictions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div>
                  <div className="text-lg font-semibold mb-2">Europe</div>
                  <div className="text-green-100 text-sm">CSRD, EU ETS, EU Taxonomy, SFDR</div>
                </div>
                <div>
                  <div className="text-lg font-semibold mb-2">North America</div>
                  <div className="text-green-100 text-sm">SEC Climate Rules, RGGI, California Cap-and-Trade</div>
                </div>
                <div>
                  <div className="text-lg font-semibold mb-2">Asia-Pacific</div>
                  <div className="text-green-100 text-sm">China ETS, K-ETS, Japan GX League</div>
                </div>
                <div>
                  <div className="text-lg font-semibold mb-2">Global</div>
                  <div className="text-green-100 text-sm">TCFD, ISSB, SBTi, Article 6</div>
                </div>
              </div>
              <p className="text-center mt-6 text-green-100">
                Updated regularly with the latest regulatory changes and compliance requirements
              </p>
            </div>

            {/* CTA Section */}
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Ready to Join the Carbon Management Revolution?
              </h3>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Whether you're buying, selling, or managing carbon - we have the tools and connections you need.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/register"
                  className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-md shadow-lg text-white bg-green-600 hover:bg-green-700 transition-all duration-300"
                >
                  Get Started Free
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
                <Link
                  to="/marketplace"
                  className="inline-flex items-center px-8 py-4 border-2 border-green-600 text-lg font-medium rounded-md text-green-600 bg-white hover:bg-green-50 transition-all duration-300"
                >
                  Explore Platform
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-12 px-4 bg-green-800 text-white" aria-labelledby="cta-heading">
          <div className="max-w-7xl mx-auto text-center">
            <h2 id="cta-heading" className="text-3xl font-bold mb-4">Start Your Carbon Journey Today</h2>
            <p className="mb-8 text-green-100 max-w-3xl mx-auto">
              Measure your carbon footprint, generate compliance reports, and plan reduction projects with our comprehensive platform - completely free
            </p>
            <Link
              to="/carbon-footprint/new"
              className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-md shadow-lg text-green-700 bg-white hover:bg-green-50 transition-all duration-300"
            >
              Start Carbon Assessment Now
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </section>
      </div>
    </>
  );
};

export default CarbonProspectLanding;