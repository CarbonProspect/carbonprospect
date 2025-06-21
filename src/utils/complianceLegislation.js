// utils/complianceLegislation.js
// Updated comprehensive compliance and legislation data for different countries
// Links verified as of June 2025

// Helper function to normalize country names from various formats
const normalizeCountryName = (country) => {
  if (!country) return 'Australia'; // Default
  
  // Convert to lowercase and replace underscores with spaces for comparison
  const normalized = country.toLowerCase().replace(/_/g, ' ').trim();
  
  // Mapping of all variations to canonical names
  const countryMap = {
    // Australia
    'australia': 'Australia',
    'au': 'Australia',
    'aus': 'Australia',
    
    // United States
    'united states': 'United States',
    'usa': 'United States',
    'us': 'United States',
    
    // United Kingdom  
    'united kingdom': 'United Kingdom',
    'uk': 'United Kingdom',
    'gb': 'United Kingdom',
    'great britain': 'United Kingdom',
    
    // European Union
    'european union': 'European Union',
    'eu': 'European Union',
    'europe': 'European Union',
    
    // Canada
    'canada': 'Canada',
    'ca': 'Canada',
    'can': 'Canada',
    
    // New Zealand
    'new zealand': 'New Zealand',
    'nz': 'New Zealand',
    'newzealand': 'New Zealand',
    
    // Japan
    'japan': 'Japan',
    'jp': 'Japan',
    'jpn': 'Japan',
    
    // South Korea
    'south korea': 'South Korea',
    'korea': 'South Korea',
    'kr': 'South Korea',
    'kor': 'South Korea',
    
    // Singapore
    'singapore': 'Singapore',
    'sg': 'Singapore',
    'sgp': 'Singapore',
    
    // Switzerland
    'switzerland': 'Switzerland',
    'ch': 'Switzerland',
    'che': 'Switzerland',
  };
  
  // Return mapped value or format the original
  return countryMap[normalized] || 
    country.replace(/_/g, ' ')
           .split(' ')
           .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
           .join(' ');
};

export const legislationData = {
  'Australia': {
    primary: {
      name: 'NGER',
      fullName: 'National Greenhouse and Energy Reporting Act 2007',
      description: 'The NGER scheme is a national framework for reporting and disseminating company information about greenhouse gas emissions, energy production, energy consumption and other information.',
      thresholds: {
        facility: '25,000 tCO2e per year',
        corporate: '50,000 tCO2e per year OR 200 TJ energy',
        revenue: 'No specific revenue threshold',
        employees: 'No specific employee threshold'
      },
      reportingRequirements: [
        'Annual reporting of Scope 1 and Scope 2 emissions',
        'Energy production and consumption data',
        'Methods used for measurement and estimation',
        'Uncertainty assessments',
        'Registered corporation details'
      ],
      penalties: 'Civil penalties up to $444,000 for corporations failing to register or report. Criminal penalties for providing false or misleading information.',
      timeline: {
        registration: 'By 31 August if thresholds exceeded',
        reporting: 'By 31 October each year',
        verification: 'External audit required for facilities over 125,000 tCO2e'
      },
      link: 'https://cer.gov.au/schemes/national-greenhouse-and-energy-reporting-scheme',
      legislationLink: 'https://www.legislation.gov.au/Details/C2023C00090',
      requiresScope3: false,
      lastUpdated: '2025-06-09'
    },
    secondary: [
      {
        name: 'Safeguard Mechanism',
        fullName: 'Safeguard Mechanism under the NGER Act',
        description: 'Requires Australia\'s largest greenhouse gas emitters to keep their net emissions below an emissions limit (baseline).',
        thresholds: {
          facility: '100,000 tCO2e per year'
        },
        reportingRequirements: [
          'Annual emissions reporting under NGER',
          'Compliance with baseline emissions limits',
          'Purchase of Australian Carbon Credit Units (ACCUs) if exceeded'
        ],
        requiresReductionTargets: true
      },
      {
        name: 'Climate Active',
        fullName: 'Climate Active Carbon Neutral Standard',
        description: 'Voluntary certification for businesses and organizations to achieve carbon neutrality.',
        thresholds: {
          applicability: 'Voluntary - no thresholds'
        },
        reportingRequirements: [
          'Complete emissions inventory (Scopes 1, 2, and 3)',
          'Emissions reduction strategy',
          'Carbon offset purchasing',
          'Independent validation'
        ],
        requiresScope3: true
      }
    ]
  },
  'United States': {
    primary: {
      name: 'EPA GHGRP',
      fullName: 'EPA Greenhouse Gas Reporting Program',
      description: 'Requires reporting of greenhouse gas data from large GHG emission sources, fuel and industrial gas suppliers, and CO2 injection sites in the U.S.',
      thresholds: {
        facility: '25,000 metric tons CO2e per year',
        suppliers: 'Various thresholds by category',
        revenue: 'No direct revenue threshold',
        employees: 'No direct employee threshold'
      },
      reportingRequirements: [
        'Annual GHG emissions data by source category',
        'Calculation methodologies used',
        'Activity data and emission factors',
        'Quality assurance and control procedures',
        'Certification by designated representative'
      ],
      penalties: 'Up to $51,796 per day per violation for failure to report or false reporting',
      timeline: {
        reporting: 'By May 30, 2025 for 2024 data (extended deadline), normally March 31',
        verification: 'EPA verification of reported data'
      },
      link: 'https://www.epa.gov/ghgreporting',
      legislationLink: 'https://www.ecfr.gov/current/title-40/chapter-I/subchapter-C/part-98',
      requiresScope3: false,
      lastUpdated: '2025-06-09',
      notes: 'Trump administration announced reconsideration of GHGRP in March 2025'
    },
    secondary: [
      {
        name: 'SEC Climate Rules',
        fullName: 'SEC Climate-Related Disclosure Rules',
        description: 'Proposed rules requiring public companies to disclose climate-related risks and emissions data.',
        thresholds: {
          applicability: 'All SEC registrants (public companies)',
          materiality: 'Material climate risks must be disclosed'
        },
        reportingRequirements: [
          'Climate-related risks and impacts on business',
          'Scope 1 and 2 emissions (Scope 3 if material)',
          'Climate-related targets and transition plans',
          'Board oversight and governance'
        ],
        requiresScope3: true
      },
      {
        name: 'California SB 253',
        fullName: 'Climate Corporate Data Accountability Act',
        description: 'Requires large companies doing business in California to report greenhouse gas emissions.',
        thresholds: {
          revenue: '$1 billion+ annual revenue'
        },
        reportingRequirements: [
          'Scope 1, 2, and 3 emissions annually',
          'Third-party verification required',
          'Public disclosure of emissions data'
        ],
        requiresScope3: true,
        requiresReductionTargets: true
      }
    ]
  },
  'European Union': {
    primary: {
      name: 'CSRD',
      fullName: 'Corporate Sustainability Reporting Directive',
      description: 'Requires large companies and listed SMEs to disclose information on sustainability matters including climate.',
      thresholds: {
        large_companies: '250+ employees OR €50M+ revenue OR €25M+ assets',
        listed_SMEs: 'Listed on EU regulated markets (except micro)',
        non_EU: '€150M+ net turnover in EU'
      },
      reportingRequirements: [
        'Double materiality assessment',
        'Climate targets and transition plans',
        'Scope 1, 2, and 3 GHG emissions',
        'Climate risks and opportunities',
        'Alignment with EU Taxonomy'
      ],
      penalties: 'Member state dependent - typically % of annual turnover',
      timeline: {
        group1: 'FY 2024 (reports in 2025) - Large public interest entities',
        group2: 'FY 2025 (reports in 2026) - Other large companies',
        group3: 'FY 2026 (reports in 2027) - Listed SMEs'
      },
      link: 'https://finance.ec.europa.eu/capital-markets-union-and-financial-markets/company-reporting-and-auditing/company-reporting/corporate-sustainability-reporting_en',
      legislationLink: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022L2464',
      requiresScope3: true,
      requiresReductionTargets: true,
      lastUpdated: '2025-06-09',
      notes: 'EU Commission proposed significant reductions to CSRD scope in February 2025 Omnibus proposals - raising threshold to 1000+ employees'
    },
    secondary: [
      {
        name: 'EU Taxonomy',
        fullName: 'EU Taxonomy Regulation',
        description: 'Classification system establishing which economic activities are environmentally sustainable.',
        reportingRequirements: [
          'Proportion of taxonomy-aligned activities',
          'CapEx and OpEx alignment',
          'Technical screening criteria compliance'
        ]
      },
      {
        name: 'EU ETS',
        fullName: 'EU Emissions Trading System',
        description: 'Cap-and-trade system covering power stations, manufacturing plants, and airlines.',
        thresholds: {
          facility: '20MW thermal input for combustion installations'
        },
        reportingRequirements: [
          'Annual verified emissions reports',
          'Surrender of allowances equal to emissions',
          'Monitoring plan approval'
        ]
      }
    ]
  },
  'United Kingdom': {
    primary: {
      name: 'SECR',
      fullName: 'Streamlined Energy and Carbon Reporting',
      description: 'Requires UK companies to report on energy use and carbon emissions within their annual reports.',
      thresholds: {
        quoted_companies: 'All UK quoted companies',
        large_unquoted: '250+ employees OR £36M+ turnover OR £18M+ balance sheet',
        energy: '40,000 kWh+ annual energy use'
      },
      reportingRequirements: [
        'UK energy use and Scope 1 & 2 emissions',
        'Intensity metrics',
        'Energy efficiency actions taken',
        'Methodology used',
        'Prior year comparisons'
      ],
      penalties: 'Unlimited fines for non-compliance or false statements',
      timeline: {
        reporting: 'Within annual financial reports',
        filing: 'Within 9 months of financial year end'
      },
      link: 'https://www.gov.uk/government/publications/environmental-reporting-guidelines-including-mandatory-greenhouse-gas-emissions-reporting-guidance',
      legislationLink: 'https://www.legislation.gov.uk/uksi/2018/1155/contents/made',
      requiresScope3: false,
      lastUpdated: '2025-06-09'
    },
    secondary: [
      {
        name: 'TCFD',
        fullName: 'Task Force on Climate-related Financial Disclosures',
        description: 'Mandatory climate-related financial disclosures for large companies and financial institutions.',
        thresholds: {
          companies: '500+ employees AND £500M+ turnover',
          financial: 'Banks, insurers, and asset managers with £5B+ AUM'
        },
        reportingRequirements: [
          'Governance of climate risks',
          'Climate strategy and scenarios',
          'Risk management processes',
          'Metrics and targets'
        ],
        requiresReductionTargets: true
      },
      {
        name: 'UK ETS',
        fullName: 'UK Emissions Trading Scheme',
        description: 'Cap-and-trade system for energy intensive industries, power generation, and aviation.',
        thresholds: {
          facility: '20MW thermal input for combustion installations'
        },
        reportingRequirements: [
          'Annual emissions monitoring and reporting',
          'Third-party verification',
          'Surrender of UK allowances'
        ]
      }
    ]
  },
  'Canada': {
    primary: {
      name: 'GHGRP',
      fullName: 'Greenhouse Gas Reporting Program',
      description: 'Federal program requiring facilities to report greenhouse gas emissions.',
      thresholds: {
        facility: '10,000 tonnes CO2e per year (reduced from 50,000 in 2018)',
        expanded_reporting: 'Additional requirements for specific sectors'
      },
      reportingRequirements: [
        'Annual facility-level GHG emissions',
        'Production data',
        'Calculation methodologies',
        'Third-party verification for certain sectors'
      ],
      penalties: 'Up to $1 million CAD per day for non-compliance',
      timeline: {
        reporting: 'By June 2 each year for prior year (was June 1)',
        verification: 'By June 2 for facilities requiring verification'
      },
      link: 'https://www.canada.ca/en/environment-climate-change/services/climate-change/greenhouse-gas-emissions/facility-reporting.html',
      legislationLink: 'https://laws-lois.justice.gc.ca/eng/acts/C-15.31/',
      requiresScope3: false,
      lastUpdated: '2025-06-09',
      notes: 'Latest Notice covers 2024-2025 reporting, published December 2023'
    },
    secondary: [
      {
        name: 'Federal Carbon Pricing',
        fullName: 'Greenhouse Gas Pollution Pricing Act',
        description: 'Carbon pricing backstop for provinces without their own systems.',
        thresholds: {
          fuel_charge: 'All fossil fuels',
          OBPS: 'Facilities emitting 50,000+ tonnes CO2e'
        },
        reportingRequirements: [
          'Registration in OBPS if applicable',
          'Annual compliance reports',
          'Payment of excess emissions charges'
        ]
      },
      {
        name: 'TCFD (voluntary)',
        fullName: 'Task Force on Climate-related Financial Disclosures',
        description: 'Voluntary but increasingly expected for large Canadian companies.',
        reportingRequirements: [
          'Climate governance',
          'Risk assessment',
          'Scenario analysis',
          'Metrics and targets'
        ],
        requiresReductionTargets: true
      }
    ]
  },
  'New Zealand': {
    primary: {
      name: 'ETS',
      fullName: 'New Zealand Emissions Trading Scheme',
      description: 'Mandatory emissions trading scheme covering forestry, energy, industry, and waste sectors.',
      thresholds: {
        energy: 'Importing/mining 10,000+ tonnes coal or 2,000+ tonnes natural gas',
        industry: 'Various thresholds by activity',
        waste: 'Operating disposal facilities'
      },
      reportingRequirements: [
        'Annual emissions returns',
        'Surrender of New Zealand Units (NZUs)',
        'Record keeping for 7 years',
        'Third-party verification for some participants'
      ],
      penalties: 'Up to $50,000 NZD plus 1.5x units not surrendered',
      timeline: {
        reporting: 'Annual returns by March 31',
        surrender: 'Units due by May 31'
      },
      link: 'https://www.epa.govt.nz/industry-areas/emissions-trading-scheme/',
      requiresScope3: false,
      lastUpdated: '2025-06-09'
    },
    secondary: [
      {
        name: 'Climate-related Disclosures',
        fullName: 'Financial Sector (Climate-related Disclosures) Amendment Act',
        description: 'Mandatory climate reporting for large financial entities.',
        thresholds: {
          banks: 'Total assets over $1 billion',
          insurers: 'Total assets over $1 billion or annual premium income over $250 million',
          investment: 'Total assets under management over $1 billion'
        },
        reportingRequirements: [
          'Governance arrangements',
          'Climate-related risks and opportunities',
          'Scenario analysis',
          'GHG emissions metrics',
          'Transition plans'
        ],
        requiresScope3: true,
        requiresReductionTargets: true
      },
      {
        name: 'Carbon Neutral Government Programme',
        fullName: 'Carbon Neutral Government Programme',
        description: 'Requires public sector organizations to measure, reduce, and offset emissions.',
        reportingRequirements: [
          'Annual emissions inventory',
          'Reduction plans',
          'Offset purchasing for residual emissions'
        ],
        requiresScope3: true
      }
    ]
  },
  'Japan': {
    primary: {
      name: 'GHG Reporting',
      fullName: 'Mandatory GHG Accounting and Reporting System',
      description: 'Required reporting under the Act on Promotion of Global Warming Countermeasures.',
      thresholds: {
        energy: '1,500 kL crude oil equivalent per year',
        emissions: '3,000 tCO2e per year',
        employees: '21+ employees for transport sector'
      },
      reportingRequirements: [
        'Annual GHG emissions reports',
        'Energy consumption data',
        'Emission reduction plans',
        'Progress reports on reduction measures'
      ],
      penalties: 'Up to ¥200,000 for non-compliance',
      timeline: {
        reporting: 'By July 31 each year',
        planning: 'Submit reduction plans with reports'
      },
      link: 'https://www.env.go.jp/en/press/press_04099.html',
      legislationLink: 'https://www.env.go.jp/en/headline/742.html',
      requiresScope3: false,
      lastUpdated: '2025-06-09',
      notes: 'Japan announced 60% GHG reduction target by 2035 vs 2013 levels in December 2024'
    },
    secondary: [
      {
        name: 'Tokyo Cap-and-Trade',
        fullName: 'Tokyo Metropolitan Environmental Security Ordinance',
        description: 'Mandatory emissions reductions for large facilities in Tokyo.',
        thresholds: {
          facility: 'Annual energy consumption ≥1,500 kL crude oil equivalent'
        },
        reportingRequirements: [
          'Annual emissions reports',
          'Third-party verification',
          'Compliance with reduction targets',
          'Trading or offset purchasing if needed'
        ],
        requiresReductionTargets: true
      },
      {
        name: 'TCFD Disclosure',
        fullName: 'TCFD-aligned Climate Disclosures',
        description: 'Required for companies listed on Prime Market of Tokyo Stock Exchange.',
        reportingRequirements: [
          'Climate governance',
          'Risk and opportunity assessment',
          'Scenario analysis',
          'Metrics and targets'
        ],
        requiresScope3: true,
        requiresReductionTargets: true
      }
    ]
  },
  'South Korea': {
    primary: {
      name: 'K-ETS',
      fullName: 'Korean Emissions Trading Scheme',
      description: 'Mandatory cap-and-trade system covering major emitters.',
      thresholds: {
        company: '125,000 tCO2e per year',
        facility: '25,000 tCO2e per year'
      },
      reportingRequirements: [
        'Annual emissions reports',
        'Third-party verification',
        'Monitoring plans',
        'Allowance surrender'
      ],
      penalties: 'Up to 3x market price for non-surrendered allowances',
      timeline: {
        reporting: 'By March 31 for previous year',
        verification: 'Complete by March 31',
        surrender: 'By June 30'
      },
      link: 'https://icapcarbonaction.com/en/ets/korea-emissions-trading-system-k-ets',
      legislationLink: 'https://www.law.go.kr/LSW/eng/engLsSc.do?menuId=2&query=emissions+trading#liBgcolor0',
      requiresScope3: false,
      lastUpdated: '2025-06-09',
      notes: 'Currently in Phase 3 (2021-2025). Phase 4 (2026-2030) planning underway. Derivatives market to open by 2025.'
    },
    secondary: [
      {
        name: 'Target Management System',
        fullName: 'GHG and Energy Target Management System',
        description: 'For large emitters not covered by K-ETS.',
        thresholds: {
          company: '50,000 tCO2e per year',
          facility: '15,000 tCO2e per year'
        },
        reportingRequirements: [
          'Annual emissions reporting',
          'Achievement of government-set targets',
          'Improvement plans if targets missed'
        ],
        requiresReductionTargets: true
      },
      {
        name: 'Green New Deal Reporting',
        fullName: 'ESG Disclosure Requirements',
        description: 'Sustainability reporting for listed companies.',
        thresholds: {
          assets: 'KOSPI-listed companies with assets over 2 trillion KRW'
        },
        reportingRequirements: [
          'Environmental metrics including GHG emissions',
          'Climate risk assessment',
          'Green investment disclosures'
        ],
        requiresScope3: true
      }
    ]
  },
  'Singapore': {
    primary: {
      name: 'Carbon Tax',
      fullName: 'Carbon Pricing Act',
      description: 'Carbon tax on facilities emitting significant greenhouse gases.',
      thresholds: {
        facility: '25,000 tCO2e per year'
      },
      reportingRequirements: [
        'Annual emissions reports',
        'Monitoring plans',
        'Third-party verification',
        'Payment of carbon tax'
      ],
      penalties: 'Up to $200,000 SGD and/or 2 years imprisonment',
      timeline: {
        reporting: 'By March 31 for previous year',
        payment: 'Carbon tax payment by September 30'
      },
      carbonTaxRate: {
        current: '$25 SGD/tCO2e (2024-2025)',
        future: '$45 SGD/tCO2e (2026-2027), $50-80 SGD/tCO2e by 2030'
      },
      link: 'https://www.nea.gov.sg/our-services/climate-change-energy-efficiency/climate-change/carbon-tax',
      legislationLink: 'https://www.mse.gov.sg/policies/climate-change/carbon-pricing-act',
      requiresScope3: false,
      lastUpdated: '2025-06-09',
      notes: 'Companies can use eligible international carbon credits to offset up to 5% of taxable emissions from 2024'
    },
    secondary: [
      {
        name: 'SGX Climate Reporting',
        fullName: 'SGX Sustainability Reporting',
        description: 'Climate-related disclosures for listed companies.',
        thresholds: {
          listing: 'All SGX-listed companies'
        },
        reportingRequirements: [
          'Climate-related risks and opportunities',
          'GHG emissions (Scope 1 & 2 mandatory, Scope 3 encouraged)',
          'Board oversight of climate issues',
          'Targets and transition plans'
        ],
        requiresScope3: true,
        requiresReductionTargets: true
      },
      {
        name: 'Green Plan 2030',
        fullName: 'Singapore Green Plan 2030',
        description: 'National sustainability targets affecting large businesses.',
        reportingRequirements: [
          'Sector-specific targets',
          'Progress reporting for participating companies',
          'Green finance disclosures'
        ]
      }
    ]
  },
  'Switzerland': {
    primary: {
      name: 'CO2 Act',
      fullName: 'Federal Act on the Reduction of CO2 Emissions',
      description: 'Comprehensive climate legislation with various compliance mechanisms.',
      thresholds: {
        exemption: 'Companies can apply for exemption from CO2 levy if they commit to reduction targets',
        ETS: 'Large emitters (varies by sector)'
      },
      reportingRequirements: [
        'Annual emissions monitoring',
        'Target achievement reports',
        'Energy efficiency measures',
        'Compliance with sector agreements'
      ],
      penalties: 'CO2 levy of CHF 120 per tonne if not exempt',
      timeline: {
        reporting: 'Annual reporting deadlines vary by program',
        verification: 'Third-party audits required'
      },
      link: 'https://www.bafu.admin.ch/bafu/en/home/topics/climate/info-specialists/reduction-measures/co2-levy.html',
      requiresScope3: false,
      lastUpdated: '2025-06-09'
    },
    secondary: [
      {
        name: 'Swiss Climate Scores',
        fullName: 'Swiss Climate Scores',
        description: 'Voluntary best practice for climate transparency in financial sector.',
        reportingRequirements: [
          'Portfolio GHG emissions',
          'Climate alignment metrics',
          'Net zero commitments',
          'Climate stewardship activities'
        ],
        requiresScope3: true,
        requiresReductionTargets: true
      },
      {
        name: 'SIX Exchange Reporting',
        fullName: 'SIX Swiss Exchange Sustainability Reporting',
        description: 'Sustainability reporting requirements for listed companies.',
        thresholds: {
          listing: 'Large listed companies'
        },
        reportingRequirements: [
          'Climate risks and opportunities',
          'GHG emissions data',
          'Climate targets',
          'TCFD-aligned disclosures'
        ],
        requiresScope3: true
      }
    ]
  }
};

// Updated reporting group classifications
export const reportingGroups = {
  1: {
    name: 'Group 1 - Large Emitters',
    criteria: {
      revenue: '≥ $500M annual revenue',
      employees: '≥ 500 employees',
      emissions: '≥ 100,000 tCO2e (facility level)'
    },
    timeline: 'Mandatory reporting from January 1, 2025',
    requirements: [
      'Quarterly emissions reporting',
      'Third-party verification required',
      'Board-level climate governance',
      'TCFD-aligned disclosures',
      'Science-based targets required'
    ]
  },
  2: {
    name: 'Group 2 - Medium Enterprises',
    criteria: {
      revenue: '≥ $200M annual revenue',
      employees: '≥ 250 employees',
      emissions: '≥ 50,000 tCO2e'
    },
    timeline: 'Mandatory reporting from July 1, 2026',
    requirements: [
      'Annual emissions reporting',
      'Limited assurance required',
      'Management-level oversight',
      'Simplified TCFD reporting',
      'Emissions reduction plan'
    ]
  },
  3: {
    name: 'Group 3 - Small-Medium Enterprises',
    criteria: {
      revenue: '≥ $50M annual revenue',
      employees: '≥ 100 employees',
      emissions: '≥ 25,000 tCO2e'
    },
    timeline: 'Mandatory reporting from July 1, 2027',
    requirements: [
      'Annual emissions reporting',
      'Self-certification acceptable',
      'Basic governance structures',
      'Streamlined reporting format',
      'Voluntary reduction targets'
    ]
  }
};

// Helper function to determine applicable legislation with robust country name handling
export const getApplicableLegislation = (country, revenue, employees, emissions) => {
  // Use the normalization function to handle all country name variations
  const countryKey = normalizeCountryName(country);
  
  console.log(`Country mapping: "${country}" -> "${countryKey}"`);
  
  const countryLegislation = legislationData[countryKey];
  
  // If country not found in data, return empty array
  if (!countryLegislation) {
    console.warn(`No legislation data found for country: ${country} (mapped to: ${countryKey})`);
    return [];
  }
  
  const applicable = [];
  
  // Check primary legislation
  if (countryLegislation.primary) {
    const primary = countryLegislation.primary;
    let applies = false;
    
    // Check thresholds based on country
    switch (countryKey) {
      case 'Australia':
        if (emissions >= 50000) applies = true;
        break;
      case 'United States':
        if (emissions >= 25000) applies = true;
        break;
      case 'European Union':
        if (employees >= 250 || revenue >= 50000000) applies = true;
        break;
      case 'United Kingdom':
        if (employees >= 250 || revenue >= 36000000) applies = true;
        break;
      case 'Canada':
        if (emissions >= 10000) applies = true; // Updated threshold
        break;
      case 'New Zealand':
        // ETS applies to specific sectors/activities
        if (emissions >= 25000) applies = true;
        break;
      case 'Japan':
        if (emissions >= 3000) applies = true; // ~1500kL oil equivalent
        break;
      case 'South Korea':
        if (emissions >= 125000) applies = true;
        break;
      case 'Singapore':
        if (emissions >= 25000) applies = true;
        break;
      case 'Switzerland':
        // Complex rules, simplified here
        if (emissions >= 10000) applies = true;
        break;
      default:
        // No specific thresholds for other countries
        applies = false;
        break;
    }
    
    if (applies) {
      applicable.push({
        ...primary,
        reason: `Your organization meets the thresholds for ${primary.name} reporting.`
      });
    }
  }
  
  // Check secondary legislation
  if (countryLegislation.secondary) {
    countryLegislation.secondary.forEach(legislation => {
      let applies = false;
      let reason = '';
      
      // Country-specific secondary legislation checks
      if (legislation.name === 'California SB 253' && revenue >= 1000000000) {
        applies = true;
        reason = 'Your organization exceeds $1 billion in annual revenue.';
      } else if (legislation.name === 'SEC Climate Rules' && countryKey === 'United States') {
        // Check if public company (simplified)
        if (revenue >= 100000000) {
          applies = true;
          reason = 'Applies to SEC registrants (public companies).';
        }
      } else if (legislation.name === 'TCFD' && countryKey === 'United Kingdom') {
        if (employees >= 500 && revenue >= 500000000) {
          applies = true;
          reason = 'Your organization meets TCFD mandatory disclosure thresholds.';
        }
      } else if (legislation.name === 'Climate-related Disclosures' && countryKey === 'New Zealand') {
        if (revenue >= 1000000000) {
          applies = true;
          reason = 'Large financial entities must provide climate disclosures.';
        }
      } else if (legislation.name === 'Tokyo Cap-and-Trade' && countryKey === 'Japan') {
        if (emissions >= 3000) {
          applies = true;
          reason = 'Facilities in Tokyo exceeding energy thresholds.';
        }
      } else if (legislation.name === 'SGX Climate Reporting' && countryKey === 'Singapore') {
        // Applies to listed companies
        if (revenue >= 100000000) {
          applies = true;
          reason = 'SGX-listed companies must provide climate disclosures.';
        }
      }
      
      if (applies) {
        applicable.push({
          ...legislation,
          reason
        });
      }
    });
  }
  
  return applicable;
};

// Helper function to get reporting timeline
export const getReportingTimeline = (country, group) => {
  const timeline = [];
  const currentYear = new Date().getFullYear();
  
  const countryKey = normalizeCountryName(country);
  const countryLegislation = legislationData[countryKey];
  
  if (!countryLegislation) return timeline;
  
  // Add country-specific timelines
  if (countryLegislation.primary && countryLegislation.primary.timeline) {
    const primaryTimeline = countryLegislation.primary.timeline;
    
    if (primaryTimeline.reporting) {
      timeline.push({
        date: `${currentYear}-${primaryTimeline.reporting.includes('March') ? '03-31' : '10-31'}`,
        milestone: 'Annual report due',
        action: `Submit ${countryLegislation.primary.name} report`
      });
    }
    
    if (primaryTimeline.verification) {
      timeline.push({
        date: `${currentYear}-${primaryTimeline.verification.includes('March') ? '03-31' : '06-30'}`,
        milestone: 'Verification deadline',
        action: 'Complete third-party verification'
      });
    }
  }
  
  return timeline;
};

// Default export for backwards compatibility
const complianceLegislation = {
  legislationData,
  reportingGroups,
  getApplicableLegislation,
  getReportingTimeline,
  normalizeCountryName
};

export default complianceLegislation;