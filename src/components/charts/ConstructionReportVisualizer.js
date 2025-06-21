import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  AreaChart,
  Area,
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart
} from 'recharts';
// Change this import line somewhere around line 1067:28-56
import { calculateConstructionResults } from '../projectTypes/ConstructionProject';

/**
 * Component to visualize construction project emissions and financial data
 * Replaces the "NaN" values in the report with actual calculated data
 */
const ConstructionReportVisualizer = ({
  // Construction project data
  buildingSize = 10000,
  constructionCost = 2500,
  operationalEmissions = 30,
  selectedBuildingType = { name: 'Commercial Office', baselineEmissions: 650, size: 'sqm', lifespan: 50 },
  selectedMaterials = {},
  selectedEnergyMeasures = {},
  materialVolumes = { concrete: 2000, steel: 500, timber: 300, glass: 100, insulation: 400 },
  landscapingOptions = 'standard',
  solarCapacity = 0,
  greenRoofArea = 0,
  rainwaterHarvesting = 'standard',
  usesRecycledMaterials = false,
  recycledContentPercentage = 30,
  buildingLifespan = 50,
  energyUsageBaseline = 200,
  waterUsageBaseline = 1.5,
  energyCostRate = 25,
  waterCostRate = 2.5,
  maintenanceCostBaseline = 25,
  greenBuildingPremiumRate = 10,
  
  // Financial parameters
  carbonCreditPrice = 25,
  discountRate = 5
}) => {
  // State to hold calculated results
  const [results, setResults] = useState(null);
  // Active tab for the charts
  const [activeTab, setActiveTab] = useState('cashflow');

  // Calculate results when inputs change
  useEffect(() => {
    // Gather all construction parameters
    const constructionParams = {
      buildingSize,
      constructionCost,
      operationalEmissions,
      selectedBuildingType,
      selectedMaterials,
      selectedEnergyMeasures,
      materialVolumes,
      landscapingOptions,
      solarCapacity,
      greenRoofArea,
      rainwaterHarvesting,
      usesRecycledMaterials,
      recycledContentPercentage,
      buildingLifespan,
      energyUsageBaseline,
      waterUsageBaseline,
      energyCostRate,
      waterCostRate,
      maintenanceCostBaseline,
      greenBuildingPremiumRate,
      discountRate
    };
    
    // Calculate construction results
    const calculatedResults = calculateConstructionResults(constructionParams);
    setResults(calculatedResults);
  }, [
    buildingSize, constructionCost, operationalEmissions, selectedBuildingType, 
    selectedMaterials, selectedEnergyMeasures, materialVolumes, landscapingOptions, 
    solarCapacity, greenRoofArea, rainwaterHarvesting, usesRecycledMaterials, 
    recycledContentPercentage, buildingLifespan, energyUsageBaseline, waterUsageBaseline, 
    energyCostRate, waterCostRate, maintenanceCostBaseline, greenBuildingPremiumRate, 
    discountRate, carbonCreditPrice
  ]);

  // Format currency values
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // If results aren't calculated yet, show loading
  if (!results) {
    return <div className="p-4 text-center">Calculating construction data...</div>;
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      {/* Tabs for different charts */}
      <div className="border-b border-gray-200 mb-4">
        <ul className="flex flex-wrap -mb-px">
          <li className="mr-2">
            <button
              onClick={() => setActiveTab('cashflow')}
              className={`inline-block p-2 border-b-2 rounded-t-lg ${
                activeTab === 'cashflow'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent hover:border-gray-300 hover:text-gray-600'
              }`}
              type="button"
            >
              Cash Flow Chart
            </button>
          </li>
          <li className="mr-2">
            <button
              onClick={() => setActiveTab('npv')}
              className={`inline-block p-2 border-b-2 rounded-t-lg ${
                activeTab === 'npv'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent hover:border-gray-300 hover:text-gray-600'
              }`}
              type="button"
            >
              NPV Analysis
            </button>
          </li>
          <li className="mr-2">
            <button
              onClick={() => setActiveTab('emissions')}
              className={`inline-block p-2 border-b-2 rounded-t-lg ${
                activeTab === 'emissions'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent hover:border-gray-300 hover:text-gray-600'
              }`}
              type="button"
            >
              Emissions Breakdown
            </button>
          </li>
        </ul>
      </div>
      
      {/* Chart content based on active tab */}
      <div className="h-80">
        {activeTab === 'cashflow' && (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={results.chartData.paybackData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="year" 
                label={{ value: 'Year', position: 'insideBottomRight', offset: -10 }} 
              />
              <YAxis 
                label={{ value: 'Cash Flow ($)', angle: -90, position: 'insideLeft' }}
                tickFormatter={(value) => new Intl.NumberFormat('en-US', {
                  notation: 'compact',
                  compactDisplay: 'short',
                  maximumFractionDigits: 1
                }).format(value)}
              />
              <Tooltip 
                formatter={(value) => formatCurrency(value)}
                labelFormatter={(label) => `Year ${label}`}
              />
              <Legend />
              <ReferenceLine y={0} stroke="#000" strokeDasharray="3 3" />
              <Bar 
                dataKey="cashFlow" 
                name="Annual Cash Flow" 
                fill={(entry) => entry.cashFlow >= 0 ? "#4ade80" : "#f87171"}
                radius={[4, 4, 0, 0]}
              />
              <Line 
                type="monotone" 
                dataKey="cumulativeCashFlow" 
                name="Cumulative Cash Flow" 
                stroke="#0ea5e9"
                strokeWidth={2}
                dot={{ fill: '#0ea5e9', r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
        
        {activeTab === 'npv' && (
          <div className="h-full flex flex-col">
            <div className="mb-4 grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg bg-blue-50">
                <h3 className="text-lg font-semibold text-blue-700">Net Present Value</h3>
                <p className="text-2xl font-bold mt-2">{formatCurrency(results.npv)}</p>
                <p className="text-sm text-gray-600 mt-1">Discount Rate: {discountRate}%</p>
              </div>
              <div className="p-4 border rounded-lg bg-green-50">
                <h3 className="text-lg font-semibold text-green-700">Return on Investment</h3>
                <p className="text-2xl font-bold mt-2">{results.roi.toFixed(1)}%</p>
                <p className="text-sm text-gray-600 mt-1">Payback Period: {results.breakEvenYear} years</p>
              </div>
            </div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={results.chartData.paybackData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis 
                    tickFormatter={(value) => new Intl.NumberFormat('en-US', {
                      notation: 'compact',
                      compactDisplay: 'short',
                      maximumFractionDigits: 1
                    }).format(value)}
                  />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    labelFormatter={(label) => `Year ${label}`}
                  />
                  <ReferenceLine y={0} stroke="#000" strokeDasharray="3 3" />
                  <Area 
                    type="monotone" 
                    dataKey="cumulativeCashFlow" 
                    name="NPV over Time" 
                    stroke="#0284c7" 
                    fill="#bae6fd" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        
        {activeTab === 'emissions' && (
          <div className="grid grid-cols-5 h-full">
            <div className="col-span-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={results.chartData.emissionsBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={(entry) => `${entry.name}: ${Math.round(entry.value).toLocaleString()} t`}
                  >
                    {results.chartData.emissionsBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#4ade80', '#22d3ee', '#a78bfa'][index % 3]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => `${Math.round(value).toLocaleString()} tonnes CO₂e`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="col-span-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={results.chartData.lifecycleEmissionsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" 
                    label={{ value: 'Year', position: 'insideBottomRight', offset: -10 }} 
                  />
                  <YAxis 
                    label={{ value: 'Tonnes CO₂e', angle: -90, position: 'insideLeft' }}
                    tickFormatter={(value) => new Intl.NumberFormat('en-US', {
                      notation: 'compact',
                      compactDisplay: 'short',
                      maximumFractionDigits: 1
                    }).format(value)}
                  />
                  <Tooltip 
                    formatter={(value) => `${Math.round(value).toLocaleString()} tonnes CO₂e`}
                    labelFormatter={(label) => `Year ${label}`}
                  />
                  <Legend />
                  <Bar dataKey="baselineCumulative" name="Baseline Emissions" fill="#f87171" />
                  <Bar dataKey="reducedCumulative" name="Green Building Emissions" fill="#4ade80" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
      
      {/* Year-by-Year Results Table */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Year-by-Year Results</h3>
        <div className="overflow-x-auto border rounded">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Year
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sequestration (tCO₂e)
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Costs
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Cash Flow
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cumulative Cash Flow
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results.yearlyData.slice(0, 10).map((yearData) => (
                <tr 
                  key={yearData.year} 
                  className={yearData.greenPremiumRemaining <= 0 ? "bg-green-50" : ""}
                >
                  <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {yearData.year}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-right text-gray-700">
                    {yearData.year === 0 ? 
                      Math.round(results.embodiedCarbonReduction).toLocaleString() : 
                      Math.round(results.operationalEmissionsReduction).toLocaleString()}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-right text-gray-700">
                    {yearData.year === 0 ? 
                      "$0" : 
                      formatCurrency(results.totalOperationalSavings)}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-right text-gray-700">
                    {yearData.year === 0 ? 
                      formatCurrency(results.greenBuildingPremium) : 
                      "$0"}
                  </td>
                  <td className={`px-6 py-3 whitespace-nowrap text-sm text-right font-medium ${
                    yearData.year === 0 ? "text-red-600" : "text-green-600"
                  }`}>
                    {yearData.year === 0 ? 
                      `-${formatCurrency(results.greenBuildingPremium)}` : 
                      formatCurrency(results.totalOperationalSavings)}
                  </td>
                  <td className={`px-6 py-3 whitespace-nowrap text-sm text-right font-medium ${
                    yearData.greenPremiumRemaining <= 0 ? "text-green-600" : "text-red-600"
                  }`}>
                    {yearData.greenPremiumRemaining <= 0 ? 
                      formatCurrency(Math.abs(yearData.greenPremiumRemaining)) : 
                      `-${formatCurrency(yearData.greenPremiumRemaining)}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-sm text-gray-500 mt-2">
          Showing first 10 years. Export to Excel for full data.
        </div>
      </div>
      
      {/* Financial Summary */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Financial Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Initial Premium:</span>
              <span className="font-medium">{formatCurrency(results.greenBuildingPremium)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Annual Operational Savings:</span>
              <span className="font-medium text-green-600">{formatCurrency(results.totalOperationalSavings)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Property Value Increase:</span>
              <span className="font-medium text-green-600">{formatCurrency(results.propertyValueIncrease)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 mt-2">
              <span className="text-gray-600 font-medium">Payback Period:</span>
              <span className="font-medium">{results.simplePaybackPeriod.toFixed(1)} years</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 font-medium">50-Year NPV:</span>
              <span className="font-medium text-green-600">{formatCurrency(results.npv)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 font-medium">ROI:</span>
              <span className="font-medium text-green-600">{results.roi.toFixed(1)}%</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Environmental Impact</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Embodied Carbon Reduction:</span>
              <span className="font-medium text-green-600">
                {Math.round(results.embodiedCarbonReduction).toLocaleString()} tonnes CO₂e ({results.embodiedCarbonReductionPercentage.toFixed(1)}%)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Annual Operational Reduction:</span>
              <span className="font-medium text-green-600">
                {Math.round(results.operationalEmissionsReduction).toLocaleString()} tonnes CO₂e/year ({results.operationalEmissionsReductionPercentage.toFixed(1)}%)
              </span>
            </div>
            <div className="flex justify-between border-t pt-2 mt-2">
              <span className="text-gray-600 font-medium">Lifetime Carbon Savings:</span>
              <span className="font-medium text-green-600">
                {Math.round(results.totalEmissionsReduction).toLocaleString()} tonnes CO₂e
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 font-medium">Equivalent to:</span>
              <span className="font-medium text-green-600">
                {Math.round(results.totalEmissionsReduction / 4.6).toLocaleString()} cars removed for a year
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 font-medium">Carbon Value (@${carbonCreditPrice}/t):</span>
              <span className="font-medium text-green-600">
                {formatCurrency(results.totalEmissionsReduction * carbonCreditPrice)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConstructionReportVisualizer;