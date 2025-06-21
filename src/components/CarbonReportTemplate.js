import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const CarbonReportTemplate = ({ reportData, reportType = 'standard' }) => {
  const COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6'];

  // Convert reportData into chart formats
  const scopeData = [
    { name: 'Scope 1 (Direct)', value: reportData.emissions.scope1 },
    { name: 'Scope 2 (Electricity)', value: reportData.emissions.scope2 },
    { name: 'Scope 3 (Value Chain)', value: reportData.emissions.scope3 }
  ];
  
  const strategyData = reportData.strategies
    .sort((a, b) => b.potentialReduction - a.potentialReduction)
    .slice(0, 5) // Top 5 strategies
    .map(strategy => ({
      name: strategy.strategy,
      value: strategy.potentialReduction
    }));

  return (
    <div className="max-w-6xl mx-auto">
      {/* Report Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Carbon Emissions Report</h1>
        <p className="text-lg">
          <span className="font-medium">{reportData.companyName}</span> | {reportData.industry} | {reportData.country}
        </p>
        <p className="text-gray-600 mt-1">
          Report ID: {reportData.reportId} | Generated: {reportData.formattedDate}
        </p>
      </div>
      
      {/* Executive Summary - All report types */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 pb-2 border-b">Executive Summary</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-1">Total Emissions</h3>
            <p className="text-3xl font-bold">{reportData.emissions.total.toFixed(2)}</p>
            <p className="text-sm text-gray-600">tonnes CO₂e</p>
          </div>
          
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-1">Reduction Target</h3>
            <p className="text-3xl font-bold">{reportData.reductionTarget}%</p>
            <p className="text-sm text-gray-600">by {new Date().getFullYear() + 5}</p>
          </div>
          
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-1">Projected Reduction</h3>
            <p className="text-3xl font-bold">{reportData.reductionPercentages.total.toFixed(1)}%</p>
            <p className="text-sm text-gray-600">with selected strategies</p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded shadow">
          <p className="mb-2">
            <span className="font-medium">{reportData.companyName}</span> has calculated a carbon footprint of <span className="font-medium">{reportData.emissions.total.toFixed(2)} tonnes CO₂e</span>. 
            This report outlines the company's emissions profile and reduction strategies to achieve a 
            <span className="font-medium"> {reportData.reductionTarget}% reduction</span> by {new Date().getFullYear() + 5}.
          </p>
          <p>
            The selected reduction strategies are projected to reduce emissions by 
            <span className="font-medium"> {reportData.reductionPercentages.total.toFixed(1)}%</span>, 
            {reportData.reductionPercentages.total >= reportData.reductionTarget ? 
              ' which meets the target reduction goal.' : 
              ' which falls short of the target reduction goal.'}
          </p>
        </div>
      </div>
      
      {/* Emissions Breakdown - All report types */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 pb-2 border-b">Emissions Breakdown</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded shadow">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={scopeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {scopeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => value.toFixed(2) + ' tonnes CO₂e'} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div>
            <table className="min-w-full border">
              <thead>
                <tr className="bg-gray-50">
                  <th className="py-2 px-3 border text-left">Emissions Category</th>
                  <th className="py-2 px-3 border text-right">Emissions (tonnes CO₂e)</th>
                  <th className="py-2 px-3 border text-right">Percentage</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-2 px-3 border font-medium">Scope 1 (Direct)</td>
                  <td className="py-2 px-3 border text-right">{reportData.emissions.scope1.toFixed(2)}</td>
                  <td className="py-2 px-3 border text-right">
                    {((reportData.emissions.scope1 / reportData.emissions.total) * 100).toFixed(1)}%
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-2 px-3 border font-medium">Scope 2 (Electricity)</td>
                  <td className="py-2 px-3 border text-right">{reportData.emissions.scope2.toFixed(2)}</td>
                  <td className="py-2 px-3 border text-right">
                    {((reportData.emissions.scope2 / reportData.emissions.total) * 100).toFixed(1)}%
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 border font-medium">Scope 3 (Value Chain)</td>
                  <td className="py-2 px-3 border text-right">{reportData.emissions.scope3.toFixed(2)}</td>
                  <td className="py-2 px-3 border text-right">
                    {((reportData.emissions.scope3 / reportData.emissions.total) * 100).toFixed(1)}%
                  </td>
                </tr>
                <tr className="bg-blue-50">
                  <td className="py-2 px-3 border font-medium">Total</td>
                  <td className="py-2 px-3 border text-right font-medium">{reportData.emissions.total.toFixed(2)}</td>
                  <td className="py-2 px-3 border text-right font-medium">100%</td>
                </tr>
              </tbody>
            </table>

            {/* Brief description of emissions breakdown */}
            <div className="mt-4 text-sm">
              <p className="mb-1">Key insights from emissions breakdown:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  {scopeData.sort((a, b) => b.value - a.value)[0].name} represents the largest emissions source 
                  ({((scopeData.sort((a, b) => b.value - a.value)[0].value / reportData.emissions.total) * 100).toFixed(1)}% of total)
                </li>
                <li>
                  {reportData.emissions.scope1 + reportData.emissions.scope2 > reportData.emissions.scope3 
                    ? 'Direct operations (Scope 1 & 2) account for the majority of emissions' 
                    : 'Value chain emissions (Scope 3) account for the majority of emissions'}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* Reduction Strategy - All report types */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 pb-2 border-b">Reduction Strategy</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-4">Top Reduction Opportunities</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={strategyData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(value) => value.toFixed(1)} />
                  <YAxis type="category" dataKey="name" width={150} />
                  <Tooltip formatter={(value) => value.toFixed(2) + ' tonnes CO₂e'} />
                  <Bar dataKey="value" name="Emissions Reduction">
                    {strategyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-4">Projected Emissions (5-Year)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={reportData.fiveYearProjection}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={(value) => value.toFixed(0)} />
                  <Tooltip formatter={(value) => value.toFixed(2) + ' tonnes CO₂e'} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="emissions" 
                    name="Projected Emissions" 
                    stroke="#3498db" 
                    strokeWidth={2} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="target" 
                    name="Target Pathway" 
                    stroke="#e74c3c" 
                    strokeWidth={2} 
                    strokeDasharray="5 5" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded shadow mt-6">
          <h3 className="font-semibold mb-4">Selected Reduction Strategies</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead>
                <tr className="bg-gray-50">
                  <th className="py-2 px-3 border text-left">Strategy</th>
                  <th className="py-2 px-3 border text-left">Scope</th>
                  <th className="py-2 px-3 border text-left">Emission Reduction</th>
                  <th className="py-2 px-3 border text-left">Timeframe</th>
                  <th className="py-2 px-3 border text-right">Implementation Cost</th>
                  <th className="py-2 px-3 border text-right">Annual Savings</th>
                </tr>
              </thead>
              <tbody>
                {reportData.strategies.map((strategy, index) => (
                  <tr key={strategy.id} className={index % 2 === 1 ? 'bg-gray-50' : ''}>
                    <td className="py-2 px-3 border font-medium">{strategy.strategy}</td>
                    <td className="py-2 px-3 border">{strategy.scope}</td>
                    <td className="py-2 px-3 border">{strategy.potentialReduction.toFixed(2)} tonnes CO₂e</td>
                    <td className="py-2 px-3 border">{strategy.timeframe}</td>
                    <td className="py-2 px-3 border text-right">${strategy.capex.toLocaleString()}</td>
                    <td className="py-2 px-3 border text-right">${strategy.opexSavings.toLocaleString()}/year</td>
                  </tr>
                ))}
                <tr className="bg-blue-50 font-medium">
                  <td className="py-2 px-3 border" colSpan="2">Total</td>
                  <td className="py-2 px-3 border">
                    {reportData.strategies.reduce((total, s) => total + s.potentialReduction, 0).toFixed(2)} tonnes CO₂e
                  </td>
                  <td className="py-2 px-3 border"></td>
                  <td className="py-2 px-3 border text-right">
                    ${reportData.strategies.reduce((total, s) => total + s.capex, 0).toLocaleString()}
                  </td>
                  <td className="py-2 px-3 border text-right">
                    ${reportData.strategies.reduce((total, s) => total + s.opexSavings, 0).toLocaleString()}/year
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Regulatory Compliance - Only for regulatory and detailed reports */}
      {(reportType === 'regulatory' || reportType === 'detailed') && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 pb-2 border-b">Regulatory Compliance</h2>
          
          <div className="bg-white p-4 rounded shadow">
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Compliance Status</h3>
              <div className="p-3 bg-blue-50 rounded">
                <p className="font-medium">Based on your company details in {reportData.country}:</p>
                <p className="mt-1">
                  {reportData.regulatoryGroup === 1 ? (
                    <span className="bg-yellow-100 px-2 py-1 rounded">Your company falls under <strong>Group 1</strong> reporting requirements starting <strong>January 1, 2025</strong></span>
                  ) : reportData.regulatoryGroup === 2 ? (
                    <span className="bg-yellow-100 px-2 py-1 rounded">Your company falls under <strong>Group 2</strong> reporting requirements starting <strong>July 1, 2026</strong></span>
                  ) : reportData.regulatoryGroup === 3 ? (
                    <span className="bg-yellow-100 px-2 py-1 rounded">Your company falls under <strong>Group 3</strong> reporting requirements starting <strong>July 1, 2027</strong></span>
                  ) : (
                    <span className="bg-green-100 px-2 py-1 rounded">Your business doesn't appear to meet mandatory reporting thresholds yet</span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="mb-3">
              <h3 className="font-semibold mb-2">Compliance Checklist</h3>
              <div className="space-y-2">
                <div className="flex items-start">
                  <span className="flex-shrink-0 h-5 w-5 text-green-500 mr-2">✓</span>
                  <span className="text-sm">Measure your emissions accurately (all scopes)</span>
                </div>
                <div className="flex items-start">
                  <span className="flex-shrink-0 h-5 w-5 text-green-500 mr-2">✓</span>
                  <span className="text-sm">Identify your major emission sources</span>
                </div>
                <div className="flex items-start">
                  <span className="flex-shrink-0 h-5 w-5 text-green-500 mr-2">✓</span>
                  <span className="text-sm">Set reduction targets</span>
                </div>
                <div className="flex items-start">
                  <span className="flex-shrink-0 h-5 w-5 text-green-500 mr-2">✓</span>
                  <span className="text-sm">Implement reduction strategies</span>
                </div>
                <div className="flex items-start">
                  <span className="flex-shrink-0 h-5 w-5 text-gray-300 mr-2">○</span>
                  <span className="text-sm">Document governance structures</span>
                </div>
                <div className="flex items-start">
                  <span className="flex-shrink-0 h-5 w-5 text-gray-300 mr-2">○</span>
                  <span className="text-sm">Complete climate risk assessment</span>
                </div>
                <div className="flex items-start">
                  <span className="flex-shrink-0 h-5 w-5 text-gray-300 mr-2">○</span>
                  <span className="text-sm">Obtain third-party verification</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded shadow mt-6">
            <h3 className="font-semibold mb-3">Reporting Requirements Details</h3>
            <div className="bg-gray-50 p-3 rounded">
              <h4 className="font-medium mb-2">Required Report Content:</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Scope 1 & 2 emissions from first reporting year</li>
                <li>Scope 3 emissions from second reporting year</li>
                <li>Climate-related risks and opportunities</li>
                <li>Governance of climate-related risks</li>
                <li>Strategy for addressing climate risks</li>
                <li>Risk management processes</li>
                <li>Metrics and targets</li>
              </ul>
            </div>
            
            <div className="mt-4">
              <h4 className="font-medium mb-2">Next Steps for Compliance:</h4>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Document your organization's climate governance structure</li>
                <li>Conduct a formal climate risk assessment</li>
                <li>Develop a detailed transition plan with timelines and milestones</li>
                <li>Consider professional verification of your emissions data</li>
                <li>Submit your report according to your jurisdiction's requirements</li>
              </ol>
            </div>
          </div>
        </div>
      )}
      
      {/* Financial Analysis - Only for detailed reports */}
      {reportType === 'detailed' && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 pb-2 border-b">Financial Analysis</h2>
          
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-3">Financial Metrics</h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full border">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-2 px-3 border text-left">Strategy</th>
                    <th className="py-2 px-3 border text-right">Implementation Cost</th>
                    <th className="py-2 px-3 border text-right">Annual Savings</th>
                    <th className="py-2 px-3 border text-right">ROI (%)</th>
                    <th className="py-2 px-3 border text-right">Payback Period (years)</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.strategies.map((strategy, index) => {
                    const roi = strategy.opexSavings > 0 ? (strategy.opexSavings / strategy.capex) * 100 : 0;
                    const paybackPeriod = strategy.opexSavings > 0 ? strategy.capex / strategy.opexSavings : 'N/A';
                    
                    return (
                      <tr key={strategy.id} className={index % 2 === 1 ? 'bg-gray-50' : ''}>
                        <td className="py-2 px-3 border font-medium">{strategy.strategy}</td>
                        <td className="py-2 px-3 border text-right">${strategy.capex.toLocaleString()}</td>
                        <td className="py-2 px-3 border text-right">${strategy.opexSavings.toLocaleString()}/year</td>
                        <td className="py-2 px-3 border text-right">{roi.toFixed(1)}%</td>
                        <td className="py-2 px-3 border text-right">
                          {typeof paybackPeriod === 'number' ? paybackPeriod.toFixed(1) : paybackPeriod}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-blue-50 font-medium">
                    <td className="py-2 px-3 border">Total</td>
                    <td className="py-2 px-3 border text-right">
                      ${reportData.strategies.reduce((total, s) => total + s.capex, 0).toLocaleString()}
                    </td>
                    <td className="py-2 px-3 border text-right">
                      ${reportData.strategies.reduce((total, s) => total + s.opexSavings, 0).toLocaleString()}/year
                    </td>
                    <td className="py-2 px-3 border text-right">
                      {(reportData.strategies.reduce((total, s) => total + s.opexSavings, 0) / 
                        reportData.strategies.reduce((total, s) => total + s.capex, 0) * 100).toFixed(1)}%
                    </td>
                    <td className="py-2 px-3 border text-right">
                      {(reportData.strategies.reduce((total, s) => total + s.capex, 0) / 
                        reportData.strategies.reduce((total, s) => total + s.opexSavings, 0)).toFixed(1)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {/* Report Footer */}
      <div className="mt-8 text-center text-sm text-gray-600 border-t pt-4">
        <p>Generated with Carbon Prospect on {reportData.formattedDate}</p>
        <p className="mt-1">
          This report provides estimates based on the data provided and should not be considered as the sole basis for regulatory compliance. 
          For official submissions, verification by a qualified third party is recommended.
        </p>
      </div>
    </div>
  );
};

export default CarbonReportTemplate;