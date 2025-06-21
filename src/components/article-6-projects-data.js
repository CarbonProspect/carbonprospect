// src/components/article-6-projects-data.js
// A comprehensive sample of Article 6 bilateral agreement projects

const ARTICLE_6_PROJECTS = [
  // Ghana Projects
  {
    id: "GHA-001",
    name: "Climate-Smart Rice Project",
    country: "Ghana",
    buyingParty: "Switzerland",
    description: "Training program for rice farmers on sustainable agricultural practices to reduce methane emissions and improve water efficiency",
    type: "Agriculture",
    status: "Active",
    startDate: "2022-11-12", // First authorized project under Article 6.2
    estimatedEmissionReductions: 2000000, // 2 million tonnes CO2e
    sdgContributions: [1, 2, 13, 15], // SDG goals this project contributes to
    keyFeatures: [
      "Training for over 20,000 rice farmers covering 80% of Ghana's rice production",
      "Sustainable agricultural techniques to reduce methane emissions",
      "Water use efficiency improvements",
      "Additional income through carbon revenue to farmers",
      "First ever bilaterally authorized project under Article 6.2"
    ],
    location: "Multiple regions across Ghana",
    implementingAgency: "UNDP (United Nations Development Programme)",
    verificationStandard: "Article 6.2 Paris Agreement",
    projectLink: "https://www.undp.org/ghana/press-releases/ghana-authorizes-transfer-mitigation-outcomes-switzerland"
  },
  {
    id: "GHA-002",
    name: "Forest Conservation and REDD+ Program",
    country: "Ghana",
    buyingParty: "Switzerland",
    description: "Protection of forest ecosystems and sustainable forestry practices to reduce emissions from deforestation",
    type: "Forestry",
    status: "Active",
    startDate: "2023-03-15",
    estimatedEmissionReductions: 1500000,
    sdgContributions: [13, 15],
    keyFeatures: [
      "Protection of 450,000 hectares of forest",
      "Community-based forest management",
      "Sustainable timber harvesting practices",
      "Biodiversity conservation"
    ],
    location: "Western and Eastern regions of Ghana",
    implementingAgency: "Forestry Commission of Ghana",
    verificationStandard: "Article 6.2 Paris Agreement",
    projectLink: "https://unfccc.int/ITMOregistry"
  },
  
  // Peru Projects
  {
    id: "PER-001",
    name: "Energy-Efficient Cook Stoves",
    country: "Peru",
    buyingParty: "Switzerland",
    description: "Support for the use of energy-efficient cook stoves to reduce emissions and improve air quality",
    type: "Energy Efficiency",
    status: "Active",
    startDate: "2020-10-20", // First bilateral agreement under Article 6
    estimatedEmissionReductions: 800000, // tonnes CO2e
    sdgContributions: [3, 7, 13],
    keyFeatures: [
      "Deployment of clean cooking technologies",
      "Reduced indoor air pollution",
      "Decreased deforestation and wood consumption",
      "Health benefits for households"
    ],
    location: "Various regions in Peru",
    implementingAgency: "Klik Foundation",
    verificationStandard: "Article 6.2 Paris Agreement",
    projectLink: "https://www.carbon-mechanisms.de/en/news-details/first-bilateral-agreement-on-article-6-cooperation-signed"
  },
  {
    id: "PER-002",
    name: "Sustainable Waste Management Program",
    country: "Peru",
    buyingParty: "Switzerland",
    description: "Implementation of integrated waste management systems to reduce methane emissions from landfills",
    type: "Waste Management",
    status: "Active",
    startDate: "2021-08-05",
    estimatedEmissionReductions: 950000,
    sdgContributions: [11, 12, 13],
    keyFeatures: [
      "Landfill gas capture and utilization",
      "Waste sorting and recycling facilities",
      "Organic waste composting",
      "Improved waste collection systems"
    ],
    location: "Lima and surrounding municipalities",
    implementingAgency: "KliK Foundation",
    verificationStandard: "Article 6.2 Paris Agreement",
    projectLink: "https://unfccc.int/ITMOregistry"
  },
  {
    id: "PER-003",
    name: "Sustainable Urban Transportation",
    country: "Peru",
    buyingParty: "Switzerland",
    description: "Development of low-carbon transportation systems in urban areas",
    type: "Transportation",
    status: "Implementation",
    startDate: "2022-02-10",
    estimatedEmissionReductions: 1200000,
    sdgContributions: [11, 13],
    keyFeatures: [
      "Bus rapid transit system expansion",
      "Electric bus fleet deployment",
      "Cycling infrastructure development",
      "Transport-oriented urban planning"
    ],
    location: "Lima, Arequipa, and Cusco",
    implementingAgency: "Peruvian Ministry of Transport and Communications",
    verificationStandard: "Article 6.2 Paris Agreement",
    projectLink: "https://unfccc.int/ITMOregistry"
  },
  
  // Senegal Projects 
  {
    id: "SEN-001",
    name: "Biogas Development Program",
    country: "Senegal",
    buyingParty: "Switzerland",
    description: "Development of biogas facilities to capture and utilize methane from agricultural waste",
    type: "Renewable Energy",
    status: "Active",
    startDate: "2021-06-23",
    estimatedEmissionReductions: 500000, // tonnes CO2e
    sdgContributions: [7, 13],
    keyFeatures: [
      "Methane capture from agricultural waste",
      "Clean energy generation",
      "Waste management improvement",
      "Renewable energy production"
    ],
    location: "Rural areas in Senegal",
    implementingAgency: "Klik Foundation",
    verificationStandard: "Article 6.2 Paris Agreement",
    projectLink: "https://www.admin.ch/gov/en/start/documentation/media-releases.msg-id-84104.html"
  },
  {
    id: "SEN-002",
    name: "Electric Mobility Project",
    country: "Senegal",
    buyingParty: "Switzerland",
    description: "Deployment of e-buses and e-taxis with supporting charging infrastructure",
    type: "Transport",
    status: "Under Development",
    startDate: "2023-01-15",
    estimatedEmissionReductions: 350000, // tonnes CO2e
    sdgContributions: [11, 13],
    keyFeatures: [
      "E-buses and e-taxis deployment",
      "Charging infrastructure development",
      "Reduced urban air pollution",
      "Sustainable public transportation"
    ],
    location: "Urban centers in Senegal",
    implementingAgency: "Klik Foundation",
    verificationStandard: "Article 6.2 Paris Agreement",
    projectLink: "https://planet2050.earth/blog/article6-pacm"
  },
  {
    id: "SEN-003",
    name: "Mangrove Restoration and Conservation",
    country: "Senegal",
    buyingParty: "Switzerland",
    description: "Restoration and protection of mangrove ecosystems in coastal regions",
    type: "Forestry",
    status: "Active",
    startDate: "2022-11-30",
    estimatedEmissionReductions: 650000,
    sdgContributions: [13, 14, 15],
    keyFeatures: [
      "Restoration of 10,000 hectares of mangrove forests",
      "Community-based conservation programs",
      "Sustainable fishing practices",
      "Coastal protection from sea-level rise"
    ],
    location: "Sine-Saloum Delta and Casamance region",
    implementingAgency: "Senegalese Agency for Reforestation",
    verificationStandard: "Article 6.2 Paris Agreement",
    projectLink: "https://unfccc.int/ITMOregistry"
  },
  
  // Thailand Projects
  {
    id: "THA-001",
    name: "Solar Photovoltaic Program",
    country: "Thailand",
    buyingParty: "Switzerland",
    description: "Installation of solar PV systems on commercial and residential buildings",
    type: "Renewable Energy",
    status: "Active",
    startDate: "2023-02-10", // Second authorized project
    estimatedEmissionReductions: 900000, // tonnes CO2e
    sdgContributions: [7, 13],
    keyFeatures: [
      "Rooftop solar installations",
      "Renewable energy generation",
      "Reduced dependence on fossil fuels",
      "Support for energy transition"
    ],
    location: "Urban and peri-urban areas in Thailand",
    implementingAgency: "Klik Foundation",
    verificationStandard: "Article 6.2 Paris Agreement",
    projectLink: "https://www.bafu.admin.ch/bafu/en/home/topics/climate/info-specialists/climate--international-affairs/staatsvertraege-umsetzung-klimauebereinkommen-von-paris-artikel6.html"
  },
  {
    id: "THA-002",
    name: "Industrial Energy Efficiency Improvement",
    country: "Thailand",
    buyingParty: "Switzerland",
    description: "Implementation of energy efficiency measures in industrial facilities",
    type: "Energy Efficiency",
    status: "Active",
    startDate: "2022-09-20",
    estimatedEmissionReductions: 780000,
    sdgContributions: [7, 9, 13],
    keyFeatures: [
      "Energy-efficient technology installation",
      "Process optimization",
      "Energy management systems",
      "Capacity building for industrial operators"
    ],
    location: "Industrial zones across Thailand",
    implementingAgency: "Thai Department of Industrial Works",
    verificationStandard: "Article 6.2 Paris Agreement",
    projectLink: "https://unfccc.int/ITMOregistry"
  },
  {
    id: "THA-003",
    name: "Electric Vehicle Infrastructure Development",
    country: "Thailand",
    buyingParty: "Switzerland",
    description: "Development of charging infrastructure and incentives for electric vehicle adoption",
    type: "Transportation",
    status: "Implementation",
    startDate: "2023-05-15",
    estimatedEmissionReductions: 630000,
    sdgContributions: [11, 13],
    keyFeatures: [
      "EV charging network deployment",
      "Public transportation electrification",
      "Vehicle conversion programs",
      "Driver education and incentives"
    ],
    location: "Bangkok and major urban centers",
    implementingAgency: "Thai Ministry of Transport",
    verificationStandard: "Article 6.2 Paris Agreement",
    projectLink: "https://unfccc.int/ITMOregistry"
  },
  
  // Vanuatu Projects
  {
    id: "VAN-001",
    name: "Rural Electrification through Renewables",
    country: "Vanuatu",
    buyingParty: "Switzerland",
    description: "Providing access to reliable, affordable electricity through renewable energy for rural populations",
    type: "Renewable Energy",
    status: "Active",
    startDate: "2022-11-12", // Along with Ghana project
    estimatedEmissionReductions: 450000, // tonnes CO2e
    sdgContributions: [7, 13],
    keyFeatures: [
      "Rural electrification",
      "Renewable energy deployment",
      "Energy access for unserved communities",
      "First unilaterally authorized project under Article 6.2"
    ],
    location: "Rural islands of Vanuatu",
    implementingAgency: "UNDP",
    verificationStandard: "Article 6.2 Paris Agreement",
    projectLink: "https://www.undp.org/geneva/press-releases/ghana-vanuatu-and-switzerland-launch-worlds-first-projects-under-new-carbon-market-mechanism-set-out-article-62-paris-agreement"
  },
  {
    id: "VAN-002",
    name: "Coastal Protection and Mangrove Restoration",
    country: "Vanuatu",
    buyingParty: "Switzerland",
    description: "Restoration of mangrove ecosystems and coastal protection measures to enhance resilience and carbon sequestration",
    type: "Forestry",
    status: "Active",
    startDate: "2023-02-28",
    estimatedEmissionReductions: 320000,
    sdgContributions: [13, 14, 15],
    keyFeatures: [
      "Mangrove reforestation",
      "Coastal erosion prevention",
      "Community-based ecosystem management",
      "Climate adaptation co-benefits"
    ],
    location: "Coastal areas across multiple islands",
    implementingAgency: "Vanuatu Department of Environment",
    verificationStandard: "Article 6.2 Paris Agreement",
    projectLink: "https://unfccc.int/ITMOregistry"
  },
  
  // Kenya Projects
  {
    id: "KEN-001",
    name: "Kenya Bilateral Agreement",
    country: "Kenya",
    buyingParty: "Switzerland",
    description: "Recently signed bilateral carbon trade agreement",
    type: "Multiple",
    status: "Implementation Phase",
    startDate: "2023-09-07",
    estimatedEmissionReductions: 0, // Not yet determined
    sdgContributions: [13],
    keyFeatures: [
      "Recently signed agreement",
      "Projects to be determined",
      "Framework for future carbon market cooperation"
    ],
    location: "Kenya",
    implementingAgency: "To be determined",
    verificationStandard: "Article 6.2 Paris Agreement",
    projectLink: "https://www.bafu.admin.ch/bafu/en/home/topics/climate/info-specialists/climate--international-affairs/staatsvertraege-umsetzung-klimauebereinkommen-von-paris-artikel6.html"
  },
  {
    id: "KEN-002",
    name: "Geothermal Power Expansion",
    country: "Kenya",
    buyingParty: "Switzerland",
    description: "Expansion of geothermal power capacity in the Great Rift Valley",
    type: "Renewable Energy",
    status: "Development",
    startDate: "2023-10-15",
    estimatedEmissionReductions: 1100000,
    sdgContributions: [7, 8, 13],
    keyFeatures: [
      "Geothermal power plant development",
      "Clean energy production",
      "Grid reliability improvement",
      "Technology transfer and capacity building"
    ],
    location: "Great Rift Valley",
    implementingAgency: "Kenya Electricity Generating Company",
    verificationStandard: "Article 6.2 Paris Agreement",
    projectLink: "https://unfccc.int/ITMOregistry"
  },
  {
    id: "KEN-003",
    name: "Climate-Smart Agriculture Program",
    country: "Kenya",
    buyingParty: "Switzerland",
    description: "Implementation of climate-smart agricultural practices to enhance resilience and reduce emissions",
    type: "Agriculture",
    status: "Development",
    startDate: "2023-11-20",
    estimatedEmissionReductions: 850000,
    sdgContributions: [2, 13, 15],
    keyFeatures: [
      "Drought-resistant crop varieties",
      "Water-efficient irrigation systems",
      "Soil carbon enhancement practices",
      "Farmer training and knowledge sharing"
    ],
    location: "Arid and semi-arid regions of Kenya",
    implementingAgency: "Kenya Agricultural Research Institute",
    verificationStandard: "Article 6.2 Paris Agreement",
    projectLink: "https://unfccc.int/ITMOregistry"
  },
  
  // Additional projects with other countries
  
  // Morocco Projects
  {
    id: "MAR-001",
    name: "Concentrated Solar Power Development",
    country: "Morocco",
    buyingParty: "Switzerland",
    description: "Development of concentrated solar power plants in desert regions",
    type: "Renewable Energy",
    status: "Development",
    startDate: "2023-07-10",
    estimatedEmissionReductions: 1700000,
    sdgContributions: [7, 9, 13],
    keyFeatures: [
      "Large-scale solar thermal power generation",
      "Energy storage capabilities",
      "Grid integration",
      "Technology transfer"
    ],
    location: "Ouarzazate region",
    implementingAgency: "Moroccan Agency for Sustainable Energy",
    verificationStandard: "Article 6.2 Paris Agreement",
    projectLink: "https://unfccc.int/ITMOregistry"
  },
  
  // Dominican Republic Projects
  {
    id: "DOM-001",
    name: "Coral Reef and Blue Carbon Conservation",
    country: "Dominican Republic",
    buyingParty: "Switzerland",
    description: "Protection of coral reef ecosystems and blue carbon resources",
    type: "Marine Conservation",
    status: "Active",
    startDate: "2023-03-28",
    estimatedEmissionReductions: 520000,
    sdgContributions: [13, 14],
    keyFeatures: [
      "Marine protected area expansion",
      "Sustainable tourism practices",
      "Seagrass and mangrove conservation",
      "Community-based monitoring"
    ],
    location: "Coastal regions of Dominican Republic",
    implementingAgency: "Ministry of Environment and Natural Resources",
    verificationStandard: "Article 6.2 Paris Agreement",
    projectLink: "https://unfccc.int/ITMOregistry"
  },
  
  // Georgia Projects
  {
    id: "GEO-001",
    name: "Sustainable Forestry and REDD+",
    country: "Georgia",
    buyingParty: "Sweden",
    description: "Implementation of sustainable forestry practices and REDD+ activities",
    type: "Forestry",
    status: "Active",
    startDate: "2022-06-15",
    estimatedEmissionReductions: 680000,
    sdgContributions: [13, 15],
    keyFeatures: [
      "Sustainable forest management",
      "Prevention of illegal logging",
      "Forest monitoring systems",
      "Rural livelihoods improvement"
    ],
    location: "Northern and Eastern Georgia",
    implementingAgency: "National Forestry Agency of Georgia",
    verificationStandard: "Article 6.2 Paris Agreement",
    projectLink: "https://unfccc.int/ITMOregistry"
  },
  
  // Costa Rica Projects
  {
    id: "CRI-001",
    name: "Decarbonization of Transportation Sector",
    country: "Costa Rica",
    buyingParty: "Switzerland",
    description: "Implementation of Costa Rica's National Decarbonization Plan in the transportation sector",
    type: "Transportation",
    status: "Development",
    startDate: "2023-06-01",
    estimatedEmissionReductions: 1200000,
    sdgContributions: [11, 13],
    keyFeatures: [
      "Electric public transportation",
      "Zero-emission vehicle incentives",
      "Sustainable urban mobility",
      "Charging infrastructure development"
    ],
    location: "San José metropolitan area",
    implementingAgency: "Costa Rican Ministry of Environment and Energy",
    verificationStandard: "Article 6.2 Paris Agreement",
    projectLink: "https://unfccc.int/ITMOregistry"
  },
  
  // Rwanda Projects
  {
    id: "RWA-001",
    name: "Clean Cooking Solutions Program",
    country: "Rwanda",
    buyingParty: "Sweden",
    description: "Deployment of clean cooking solutions to reduce deforestation and indoor air pollution",
    type: "Energy Efficiency",
    status: "Active",
    startDate: "2022-04-12",
    estimatedEmissionReductions: 750000,
    sdgContributions: [3, 7, 13, 15],
    keyFeatures: [
      "Efficient cookstove distribution",
      "Alternative fuel production",
      "Household air quality improvement",
      "Reduced fuelwood consumption"
    ],
    location: "Nationwide",
    implementingAgency: "Rwanda Environment Management Authority",
    verificationStandard: "Article 6.2 Paris Agreement",
    projectLink: "https://unfccc.int/ITMOregistry"
  }
];

// Export the projects data
export default ARTICLE_6_PROJECTS;