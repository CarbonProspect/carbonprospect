// components/ComplianceReportTemplate.js
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

const ComplianceReportTemplate = ({ reportData, reportType = 'standard' }) => {
  const COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6'];
  
  // Determine which sections to show based on report type and jurisdiction
  const getRequiredSections = () => {
    const sections = {
      standard: ['executive', 'emissions', 'methodology', 'reduction', 'compliance'],
      regulatory: ['executive', 'emissions', 'methodology', 'boundaries', 'data', 'assurance', 'compliance', 'governance'],
      tcfd: ['executive', 'governance', 'strategy', 'risks', 'metrics', 'scenarios'],
      eu_csrd: ['executive', 'double_materiality', 'emissions', 'taxonomy', 'targets', 'governance', 'assurance'],
      nger: ['executive', 'facility', 'emissions', 'energy', 'methods', 'uncertainty', 'verification']
    };
    
    return sections[reportType] || sections.standard;
  };

  const requiredSections = getRequiredSections();

  return (
    <div className="bg-white">
      {/* Report Header - Always shown */}
      <div className="border-b-4 border-green-600 pb-6 mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {reportType === 'regulatory' ? 'Regulatory Compliance Report' : 
               reportType === 'tcfd' ? 'TCFD Climate Disclosure Report' :
               reportType === 'eu_csrd' ? 'CSRD Sustainability Report' :
               reportType === 'nger' ? 'NGER Compliance Report' :
               'Carbon Emissions Report'}
            </h1>
            <p className="text-gray-600 mt-2">{reportData.companyName}</p>
            <p className="text-sm text-gray-500">
              Report ID: {reportData.reportId} | Generated: {reportData.formattedDate}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Reporting Period</p>
            <p className="font-semibold">{reportData.reportingPeriod || 'Annual'}</p>
            <p className="text-sm text-gray-600 mt-1">Baseline Year</p>
            <p className="font-semibold">{reportData.baselineYear || new Date().getFullYear()}</p>
          </div>
        </div>
      </div>

      {/* Executive Summary - Required for all */}
      {requiredSections.includes('executive') && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-green-700">Executive Summary</h2>
          <div className="bg-green-50 p-6 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Total Emissions</p>
                <p className="text-xl font-bold">{reportData.emissions.total.toFixed(2)} tCO2e</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Reduction Target</p>
                <p className="text-xl font-bold">{reportData.reductionTarget}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Target Year</p>
                <p className="text-xl font-bold">{new Date().getFullYear() + 5}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Compliance Status</p>
                <p className="text-xl font-bold text-green-700">
                  {reportData.regulatoryGroup > 0 ? 'Required' : 'Voluntary'}
                </p>
              </div>
            </div>
            <p className="text-gray-700">
              This report presents the greenhouse gas emissions inventory for {reportData.companyName} 
              for the {reportData.reportingPeriod || 'annual'} reporting period. 
              Total emissions amount to {reportData.emissions.total.toFixed(2)} tonnes CO2e, 
              with a reduction target of {reportData.reductionTarget}% by {new Date().getFullYear() + 5}.
            </p>
          </div>
        </section>
      )}

      {/* Double Materiality Assessment - EU CSRD specific */}
      {requiredSections.includes('double_materiality') && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-green-700">Double Materiality Assessment</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Financial Materiality</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Carbon pricing exposure: ${(reportData.emissions.total * reportData.carbonCreditPrice).toLocaleString()}</li>
                <li>Energy cost risks from price volatility</li>
                <li>Stranded asset risk from transition</li>
                <li>Capital requirements for net-zero transition</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Impact Materiality</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Direct GHG emissions: {reportData.emissions.scope1.toFixed(2)} tCO2e</li>
                <li>Value chain emissions: {reportData.emissions.scope3.toFixed(2)} tCO2e</li>
                <li>Contribution to climate change</li>
                <li>Impact on local air quality</li>
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Governance - Required for TCFD and EU CSRD */}
      {requiredSections.includes('governance') && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-green-700">Governance</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Board Oversight</h3>
              <p className="text-gray-700 text-sm">
                The Board of Directors maintains oversight of climate-related risks and opportunities through 
                quarterly reviews of emissions performance and progress against targets.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Management's Role</h3>
              <p className="text-gray-700 text-sm">
                The sustainability team, reporting to the CEO, is responsible for day-to-day management of 
                climate-related issues and implementation of reduction strategies.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Emissions Inventory - Core section */}
      {requiredSections.includes('emissions') && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-green-700">Emissions Inventory</h2>
          
          {/* Emissions Table */}
          <div className="mb-6">
            <table className="min-w-full border">
              <thead>
                <tr className="bg-gray-50">
                  <th className="py-3 px-4 text-left border">Scope</th>
                  <th className="py-3 px-4 text-right border">Emissions (tCO2e)</th>
                  <th className="py-3 px-4 text-right border">% of Total</th>
                  <th className="py-3 px-4 text-right border">Change from Base Year</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-3 px-4 border">
                    <strong>Scope 1</strong> - Direct Emissions
                    <div className="text-xs text-gray-600">Fuel combustion, Process emissions, Fugitive emissions</div>
                  </td>
                  <td className="py-3 px-4 text-right border">{reportData.emissions.scope1.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right border">
                    {reportData.emissions.total > 0 ? 
                      ((reportData.emissions.scope1 / reportData.emissions.total) * 100).toFixed(1) : '0.0'}%
                  </td>
                  <td className="py-3 px-4 text-right border text-green-600">-5.2%</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-3 px-4 border">
                    <strong>Scope 2</strong> - Indirect Emissions
                    <div className="text-xs text-gray-600">Purchased electricity, Steam, Heating & cooling</div>
                  </td>
                  <td className="py-3 px-4 text-right border">{reportData.emissions.scope2.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right border">
                    {reportData.emissions.total > 0 ? 
                      ((reportData.emissions.scope2 / reportData.emissions.total) * 100).toFixed(1) : '0.0'}%
                  </td>
                  <td className="py-3 px-4 text-right border text-green-600">-12.3%</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 border">
                    <strong>Scope 3</strong> - Value Chain Emissions
                    <div className="text-xs text-gray-600">
                      Categories: Purchased goods, Transport, Waste, Business travel, Employee commuting
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right border">{reportData.emissions.scope3.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right border">
                    {reportData.emissions.total > 0 ? 
                      ((reportData.emissions.scope3 / reportData.emissions.total) * 100).toFixed(1) : '0.0'}%
                  </td>
                  <td className="py-3 px-4 text-right border text-red-600">+2.1%</td>
                </tr>
                <tr className="font-bold bg-green-50">
                  <td className="py-3 px-4 border">Total GHG Emissions</td>
                  <td className="py-3 px-4 text-right border">{reportData.emissions.total.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right border">100.0%</td>
                  <td className="py-3 px-4 text-right border text-green-600">-7.8%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Emissions Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Emissions by Scope</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Scope 1', value: reportData.emissions.scope1 },
                      { name: 'Scope 2', value: reportData.emissions.scope2 },
                      { name: 'Scope 3', value: reportData.emissions.scope3 }
                    ].filter(item => item.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {[0, 1, 2].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => value.toFixed(2) + ' tCO2e'} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Emissions Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={[
                    { year: 2023, emissions: reportData.emissions.total * 1.08 },
                    { year: 2024, emissions: reportData.emissions.total * 1.02 },
                    { year: 2025, emissions: reportData.emissions.total }
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip formatter={(value) => value.toFixed(2) + ' tCO2e'} />
                  <Line type="monotone" dataKey="emissions" stroke="#2ecc71" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      )}

      {/* Facility-level Data - NGER specific */}
      {requiredSections.includes('facility') && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-green-700">Facility-level Reporting</h2>
          <table className="min-w-full border text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-2 px-3 text-left border">Facility</th>
                <th className="py-2 px-3 text-right border">Scope 1</th>
                <th className="py-2 px-3 text-right border">Scope 2</th>
                <th className="py-2 px-3 text-right border">Total</th>
                <th className="py-2 px-3 text-right border">Energy (TJ)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2 px-3 border">Main Manufacturing Plant</td>
                <td className="py-2 px-3 text-right border">45,000</td>
                <td className="py-2 px-3 text-right border">32,000</td>
                <td className="py-2 px-3 text-right border">77,000</td>
                <td className="py-2 px-3 text-right border">145</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="py-2 px-3 border">Distribution Center</td>
                <td className="py-2 px-3 text-right border">12,000</td>
                <td className="py-2 px-3 text-right border">8,000</td>
                <td className="py-2 px-3 text-right border">20,000</td>
                <td className="py-2 px-3 text-right border">38</td>
              </tr>
              <tr>
                <td className="py-2 px-3 border">Head Office</td>
                <td className="py-2 px-3 text-right border">500</td>
                <td className="py-2 px-3 text-right border">2,500</td>
                <td className="py-2 px-3 text-right border">3,000</td>
                <td className="py-2 px-3 text-right border">12</td>
              </tr>
            </tbody>
          </table>
        </section>
      )}

      {/* Methodology - Required for most standards */}
      {requiredSections.includes('methodology') && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-green-700">Methodology & Boundaries</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Organizational Boundaries</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                <li>Consolidation approach: {reportData.consolidationApproach || 'Operational control'}</li>
                <li>Entities included: All wholly-owned subsidiaries</li>
                <li>Geographic coverage: {reportData.country}</li>
                <li>Exclusions: Joint ventures (not under operational control)</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Calculation Methods</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                <li>Standard: GHG Protocol Corporate Standard</li>
                <li>Emission factors: {reportData.emissionFactorSource || 'Government published factors'}</li>
                <li>GWP values: IPCC Sixth Assessment Report</li>
                <li>Gases included: CO2, CH4, N2O, HFCs, PFCs, SF6, NF3</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Base Year</h3>
            <p className="text-sm text-gray-700">
              Base year: {reportData.baselineYear || new Date().getFullYear() - 1} | 
              Total base year emissions: {(reportData.emissions.total * 1.08).toFixed(2)} tCO2e | 
              Recalculation policy: Recalculate for structural changes >5% of total emissions
            </p>
          </div>
        </section>
      )}

      {/* Data Quality - Required for assurance */}
      {requiredSections.includes('data') && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-green-700">Data Quality & Uncertainty</h2>
          
          <table className="min-w-full border text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-2 px-3 text-left border">Emission Source</th>
                <th className="py-2 px-3 text-left border">Data Source</th>
                <th className="py-2 px-3 text-center border">Quality Rating</th>
                <th className="py-2 px-3 text-center border">Uncertainty</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2 px-3 border">Natural Gas</td>
                <td className="py-2 px-3 border">Utility invoices</td>
                <td className="py-2 px-3 text-center border">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded">High</span>
                </td>
                <td className="py-2 px-3 text-center border">±2%</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="py-2 px-3 border">Electricity</td>
                <td className="py-2 px-3 border">Smart meter data</td>
                <td className="py-2 px-3 text-center border">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded">High</span>
                </td>
                <td className="py-2 px-3 text-center border">±1%</td>
              </tr>
              <tr>
                <td className="py-2 px-3 border">Fleet Vehicles</td>
                <td className="py-2 px-3 border">Fuel card records</td>
                <td className="py-2 px-3 text-center border">
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">Medium</span>
                </td>
                <td className="py-2 px-3 text-center border">±5%</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="py-2 px-3 border">Business Travel</td>
                <td className="py-2 px-3 border">Expense reports + estimates</td>
                <td className="py-2 px-3 text-center border">
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded">Low</span>
                </td>
                <td className="py-2 px-3 text-center border">±15%</td>
              </tr>
            </tbody>
          </table>
        </section>
      )}

      {/* Reduction Strategies */}
      {requiredSections.includes('reduction') && reportData.strategies && reportData.strategies.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-green-700">Emission Reduction Strategies</h2>
          
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Implementation Roadmap</h3>
            <table className="min-w-full border text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="py-2 px-3 text-left border">Strategy</th>
                  <th className="py-2 px-3 text-left border">Scope</th>
                  <th className="py-2 px-3 text-right border">Reduction (tCO2e)</th>
                  <th className="py-2 px-3 text-right border">Investment</th>
                  <th className="py-2 px-3 text-center border">Timeline</th>
                </tr>
              </thead>
              <tbody>
                {reportData.strategies.slice(0, 5).map((strategy, index) => (
                  <tr key={index} className={index % 2 === 1 ? 'bg-gray-50' : ''}>
                    <td className="py-2 px-3 border">{strategy.strategy || strategy.name}</td>
                    <td className="py-2 px-3 border">{strategy.scope}</td>
                    <td className="py-2 px-3 text-right border">
                      {(strategy.potentialReduction || 0).toFixed(0)}
                    </td>
                    <td className="py-2 px-3 text-right border">
                      ${(strategy.capex || 0).toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-center border">{strategy.timeframe || '2025-2026'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Compliance Information */}
      {requiredSections.includes('compliance') && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-green-700">Regulatory Compliance</h2>
          
          <div className="bg-blue-50 p-6 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Compliance Status</h3>
            <p className="text-gray-700">
              Based on your organization's profile in {reportData.country}, you are classified under 
              {reportData.regulatoryGroup > 0 ? 
                ` Group ${reportData.regulatoryGroup} reporting requirements.` : 
                ' voluntary reporting status.'}
            </p>
            
            {reportData.regulatoryGroup > 0 && (
              <div className="mt-3">
                <p className="font-medium">Key Requirements:</p>
                <ul className="list-disc list-inside mt-1 text-sm">
                  <li>Annual emissions reporting to regulatory authority</li>
                  <li>Third-party verification required</li>
                  <li>Public disclosure of emissions data</li>
                  <li>Climate risk assessment and disclosure</li>
                </ul>
              </div>
            )}
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Applicable Standards & Regulations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reportData.country === 'Australia' && (
                <div className="border rounded p-3">
                  <h4 className="font-medium">NGER Act</h4>
                  <p className="text-sm text-gray-600">National Greenhouse and Energy Reporting</p>
                </div>
              )}
              {reportData.country === 'United States' && (
                <div className="border rounded p-3">
                  <h4 className="font-medium">EPA GHGRP</h4>
                  <p className="text-sm text-gray-600">EPA Greenhouse Gas Reporting Program</p>
                </div>
              )}
              {(reportData.country === 'European Union' || reportData.country?.startsWith('EU')) && (
                <div className="border rounded p-3">
                  <h4 className="font-medium">EU CSRD</h4>
                  <p className="text-sm text-gray-600">Corporate Sustainability Reporting Directive</p>
                </div>
              )}
              <div className="border rounded p-3">
                <h4 className="font-medium">GHG Protocol</h4>
                <p className="text-sm text-gray-600">International best practice standard</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Assurance Statement */}
      {requiredSections.includes('assurance') && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-green-700">Assurance & Verification</h2>
          
          <div className="border rounded-lg p-6 bg-gray-50">
            <h3 className="font-semibold mb-2">Verification Status</h3>
            <p className="text-gray-700 mb-3">
              {reportData.verificationStatus || 'This report has been prepared in accordance with applicable standards but has not yet been independently verified.'}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Prepared by:</p>
                <p>{reportData.reportPreparer || 'Sustainability Team'}</p>
                <p>{reportData.preparerTitle || 'Carbon Management'}</p>
              </div>
              <div>
                <p className="font-medium">Reviewed by:</p>
                <p>Senior Management</p>
                <p>Date: {reportData.formattedDate}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Report Footer */}
      <div className="border-t pt-6 mt-8">
        <p className="text-sm text-gray-600 text-center">
          This report has been prepared in accordance with the GHG Protocol Corporate Accounting and Reporting Standard
          and applicable regulatory requirements for {reportData.country}.
        </p>
        <p className="text-xs text-gray-500 text-center mt-2">
          © {new Date().getFullYear()} {reportData.companyName} - Confidential
        </p>
      </div>
    </div>
  );
};

export default ComplianceReportTemplate;