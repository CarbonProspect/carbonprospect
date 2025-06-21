import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  ComposedChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Area,
  ReferenceLine
} from 'recharts';

// Report Generator Component
const ReportGenerator = ({ 
  isOpen, 
  onClose, 
  results, 
  projectType, 
  projectTypes, 
  scenarioName, 
  projectSize, 
  capacityMW, 
  herdSize, 
  buildingSize, 
  selectedBuildingType, 
  carbonCreditPrice, 
  projectYears, 
  discountRate, 
  treeType, 
  cattleType, 
  soilType, 
  renewableType, 
  blueCarbonType, 
  treeTypes, 
  cattleTypes, 
  soilTypes, 
  renewableTypes, 
  blueCarbonTypes, 
  customTypes, 
  savedConfigurations 
}) => {
  const [reportOptions, setReportOptions] = useState({
    includeExecutiveSummary: true,
    includeProjectDetails: true,
    includeFinancialAnalysis: true,
    includeCharts: true,
    includeAnnualData: true,
    includeScenarioComparison: savedConfigurations.length > 1,
    comparisonScenarios: savedConfigurations.map(sc => ({ id: sc.id, selected: true }))
  });

  // Early return if modal is closed
  if (!isOpen || !results) return null;

  // Get project type name
  const projectTypeName = projectTypes.find(type => type.id === projectType)?.name || projectType;
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Get type-specific name (tree, cattle, soil, etc.)
  const getTypeSpecificName = () => {
    if (projectType === 'forestry') {
      let selectedTree;
      if (treeType?.startsWith('custom_')) {
        selectedTree = customTypes?.forestry?.find(t => t.id === treeType);
      } else {
        selectedTree = treeTypes?.find(t => t.id === treeType);
      }
      return selectedTree ? selectedTree.name : 'Custom';
    } else if (projectType === 'livestock') {
      let selectedCattle;
      if (cattleType?.startsWith('custom_')) {
        selectedCattle = customTypes?.livestock?.find(c => c.id === cattleType);
      } else {
        selectedCattle = cattleTypes?.find(c => c.id === cattleType);
      }
      return selectedCattle ? selectedCattle.name : 'Custom';
    } else if (projectType === 'soil') {
      let selectedSoil;
      if (soilType?.startsWith('custom_')) {
        selectedSoil = customTypes?.soil?.find(s => s.id === soilType);
      } else {
        selectedSoil = soilTypes?.find(s => s.id === soilType);
      }
      return selectedSoil ? selectedSoil.name : 'Custom';
    } else if (projectType === 'renewable') {
      let selectedRenewable;
      if (renewableType?.startsWith('custom_')) {
        selectedRenewable = customTypes?.renewable?.find(r => r.id === renewableType);
      } else {
        selectedRenewable = renewableTypes?.find(r => r.id === renewableType);
      }
      return selectedRenewable ? selectedRenewable.name : 'Custom';
    } else if (projectType === 'bluecarbon') {
      let selectedBlueCarbon;
      if (blueCarbonType?.startsWith('custom_')) {
        selectedBlueCarbon = customTypes?.bluecarbon?.find(b => b.id === blueCarbonType);
      } else {
        selectedBlueCarbon = blueCarbonTypes?.find(b => b.id === blueCarbonType);
      }
      return selectedBlueCarbon ? selectedBlueCarbon.name : 'Custom';
    } else if (projectType === 'construction') {
      return selectedBuildingType ? selectedBuildingType.name : 'Custom';
    }
    return 'N/A';
  };

  // Handle checkbox change for report options
  const handleOptionChange = (option) => {
    setReportOptions({
      ...reportOptions,
      [option]: !reportOptions[option]
    });
  };

  // Handle scenario selection change
  const handleScenarioSelectionChange = (scenarioId) => {
    setReportOptions({
      ...reportOptions,
      comparisonScenarios: reportOptions.comparisonScenarios.map(sc => 
        sc.id === scenarioId ? { ...sc, selected: !sc.selected } : sc
      )
    });
  };
  
  // Handle select all scenarios
  const handleSelectAllScenarios = (selectAll) => {
    setReportOptions({
      ...reportOptions,
      comparisonScenarios: reportOptions.comparisonScenarios.map(sc => 
        ({ ...sc, selected: selectAll })
      )
    });
  };

  // Generate PDF report
  const generateReport = () => {
    // In a real implementation, this would generate a PDF
    // For the demo, we'll just display a message
    alert('Report generated and downloaded!');
    onClose();
  };

  // Cash Flow Chart Component
  const CashFlowChart = ({ data }) => {
    if (!data || data.length === 0) return <div className="p-4 text-gray-500">No data available</div>;
    
    return (
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data}
          margin={{ top: 20, right: 50, left: 50, bottom: 20 }}>
          <defs>
            <linearGradient id="colorPositive" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorNegative" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ff7d85" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#ff7d85" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="year" 
            label={{ value: 'Year', position: 'insideBottomRight', offset: -10 }}
            tick={{ fontSize: 12 }}
            padding={{ left: 20, right: 20 }}
          />
          <YAxis 
            yAxisId="left" 
            label={{ value: 'Cash Flow ($)', angle: -90, position: 'insideLeft' }}
            tickFormatter={(value) => new Intl.NumberFormat('en-US', { 
              notation: 'compact', 
              compactDisplay: 'short',
              maximumFractionDigits: 1
            }).format(value)}
            tick={{ fontSize: 12 }}
            domain={['auto', 'auto']}
            padding={{ top: 20, bottom: 20 }}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            label={{ value: 'Cumulative ($)', angle: 90, position: 'insideRight' }}
            tickFormatter={(value) => new Intl.NumberFormat('en-US', { 
              notation: 'compact',
              compactDisplay: 'short',
              maximumFractionDigits: 1
            }).format(value)}
            tick={{ fontSize: 12 }}
            domain={['auto', 'auto']}
            padding={{ top: 20, bottom: 20 }}
          />
          <Tooltip 
            formatter={(value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)}
            contentStyle={{ fontSize: '12px', padding: '8px', borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
            labelStyle={{ fontWeight: 'bold', marginBottom: '5px' }}
          />
          <Legend wrapperStyle={{ paddingTop: 10 }} />
          
          <Bar 
            yAxisId="left" 
            dataKey="cashflow" 
            name="Annual Cash Flow" 
            barSize={20}
            fill={(entry) => (entry.isPositive ? "#82ca9d" : "#ff7d85")}
            radius={[4, 4, 0, 0]}
          />
          <Line 
            yAxisId="right" 
            type="monotone" 
            dataKey="cumulative" 
            name="Cumulative Cash Flow" 
            stroke="#8884d8" 
            strokeWidth={2} 
            dot={{ r: 4, fill: '#8884d8' }} 
            activeDot={{ r: 6, stroke: '#8884d8', strokeWidth: 1, fill: '#fff' }}
          />
          <ReferenceLine y={0} yAxisId="left" stroke="#000" strokeDasharray="3 3" />
          <ReferenceLine y={0} yAxisId="right" stroke="#000" strokeDasharray="3 3" />
        </ComposedChart>
      </ResponsiveContainer>
    );
  };

  // Cost Breakdown Chart Component
  const CostBreakdownChart = ({ data }) => {
    if (!data || data.length === 0) return <div className="p-4 text-gray-500">No cost data available</div>;
    
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#a4de6c', '#d0ed57'];
    
    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={true}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
            paddingAngle={2}
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => formatCurrency(value)}
            contentStyle={{ fontSize: '12px', padding: '8px', borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
            labelStyle={{ fontWeight: 'bold' }}
          />
          <Legend layout="vertical" verticalAlign="middle" align="right" />
        </PieChart>
      </ResponsiveContainer>
    );
  };
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-screen overflow-y-auto">
        <div className="bg-gradient-to-r from-green-700 to-green-500 text-white p-4 rounded-t-lg flex justify-between items-center">
          <h2 className="text-xl font-bold">Generate Report</h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-green-800 rounded"
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left sidebar - options */}
          <div className="md:col-span-1 bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-lg mb-3 text-green-700">Report Contents</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="includeExecutiveSummary"
                  checked={reportOptions.includeExecutiveSummary}
                  onChange={() => handleOptionChange('includeExecutiveSummary')}
                  className="mr-2 h-4 w-4 text-green-600"
                />
                <label htmlFor="includeExecutiveSummary">Executive Summary</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="includeProjectDetails"
                  checked={reportOptions.includeProjectDetails}
                  onChange={() => handleOptionChange('includeProjectDetails')}
                  className="mr-2 h-4 w-4 text-green-600"
                />
                <label htmlFor="includeProjectDetails">Project Details</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="includeFinancialAnalysis"
                  checked={reportOptions.includeFinancialAnalysis}
                  onChange={() => handleOptionChange('includeFinancialAnalysis')}
                  className="mr-2 h-4 w-4 text-green-600"
                />
                <label htmlFor="includeFinancialAnalysis">Financial Analysis</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="includeCharts"
                  checked={reportOptions.includeCharts}
                  onChange={() => handleOptionChange('includeCharts')}
                  className="mr-2 h-4 w-4 text-green-600"
                />
                <label htmlFor="includeCharts">Charts & Graphs</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="includeAnnualData"
                  checked={reportOptions.includeAnnualData}
                  onChange={() => handleOptionChange('includeAnnualData')}
                  className="mr-2 h-4 w-4 text-green-600"
                />
                <label htmlFor="includeAnnualData">Annual Data Tables</label>
              </div>

              {savedConfigurations.length > 1 && (
                <div>
                  <div className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id="includeScenarioComparison"
                      checked={reportOptions.includeScenarioComparison}
                      onChange={() => handleOptionChange('includeScenarioComparison')}
                      className="mr-2 h-4 w-4 text-green-600"
                    />
                    <label htmlFor="includeScenarioComparison">Scenario Comparison</label>
                  </div>

                  {reportOptions.includeScenarioComparison && (
                    <div className="ml-6 border-l-2 border-green-200 pl-3">
                      <div className="text-sm font-medium mb-1 flex justify-between">
                        <span>Select Scenarios</span>
                        <div>
                          <button 
                            onClick={() => handleSelectAllScenarios(true)} 
                            className="text-xs text-blue-600 hover:text-blue-800 mr-2"
                            type="button"
                          >
                            All
                          </button>
                          <button 
                            onClick={() => handleSelectAllScenarios(false)} 
                            className="text-xs text-blue-600 hover:text-blue-800"
                            type="button"
                          >
                            None
                          </button>
                        </div>
                      </div>
                      <div className="max-h-40 overflow-y-auto">
                        {savedConfigurations.map(scenario => (
                          <div key={scenario.id} className="flex items-center text-sm my-1">
                            <input
                              type="checkbox"
                              id={`scenario-${scenario.id}`}
                              checked={reportOptions.comparisonScenarios.find(sc => sc.id === scenario.id)?.selected || false}
                              onChange={() => handleScenarioSelectionChange(scenario.id)}
                              className="mr-2 h-3 w-3 text-green-600"
                            />
                            <label htmlFor={`scenario-${scenario.id}`} className="truncate">
                              {scenario.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <h3 className="font-medium text-lg mt-6 mb-3 text-green-700">Report Format</h3>
            <div className="space-y-3">
              <div>
                <label htmlFor="reportFormat" className="block text-sm mb-1">Export Format</label>
                <select
                  id="reportFormat"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  defaultValue="pdf"
                >
                  <option value="pdf">PDF Document</option>
                  <option value="docx">Word Document (DOCX)</option>
                  <option value="html">Web Page (HTML)</option>
                </select>
              </div>
              <div>
                <label htmlFor="paperSize" className="block text-sm mb-1">Paper Size</label>
                <select
                  id="paperSize"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  defaultValue="letter"
                >
                  <option value="letter">Letter (8.5" x 11")</option>
                  <option value="a4">A4 (210 x 297 mm)</option>
                  <option value="legal">Legal (8.5" x 14")</option>
                </select>
              </div>
            </div>

            <div className="mt-6">
              <button 
                onClick={generateReport}
                className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors flex items-center justify-center"
                type="button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Generate Report
              </button>
            </div>
          </div>
          
          {/* Right side - preview */}
          <div className="md:col-span-2">
            <h3 className="font-medium text-lg mb-4 text-green-700 border-b pb-2">Report Preview</h3>
            
            <div className="overflow-y-auto max-h-[calc(100vh-250px)] p-4 border rounded-lg">
              {/* Executive Summary */}
              {reportOptions.includeExecutiveSummary && (
                <div className="mb-6">
                  <h4 className="font-bold text-lg mb-2">Executive Summary</h4>
                  <p className="mb-2">
                    This report presents a {projectYears}-year financial and environmental analysis for a {projectTypeName.toLowerCase()} 
                    carbon project ({scenarioName}). The project involves {projectType === 'forestry' ? 
                    `planting and managing ${projectSize} hectares of ${getTypeSpecificName().toLowerCase()} trees` : 
                    projectType === 'livestock' ? 
                    `implementing methane reduction strategies for ${herdSize} ${getTypeSpecificName().toLowerCase()} animals` :
                    projectType === 'soil' ? 
                    `implementing ${getTypeSpecificName().toLowerCase()} soil carbon sequestration practices on ${projectSize} hectares` :
                    projectType === 'renewable' ? 
                    `developing ${capacityMW} MW of ${getTypeSpecificName().toLowerCase()} renewable energy capacity` :
                    projectType === 'bluecarbon' ? 
                    `restoring and managing ${projectSize} hectares of ${getTypeSpecificName().toLowerCase()} ecosystems` :
                    projectType === 'construction' ? 
                    `constructing a ${buildingSize.toLocaleString()} sqm ${getTypeSpecificName().toLowerCase()} building using green building practices` :
                    projectType === 'redd' ?
                    `protecting ${projectSize} hectares of ${getTypeSpecificName().toLowerCase()} from deforestation and degradation` :
                    `a ${projectSize} hectare project`}.
                  </p>
                  
                  <div className="bg-green-50 p-3 rounded border mt-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-sm text-gray-500">Total Carbon Sequestration</div>
                        <div className="font-semibold">{Math.round(results.totalSequestration).toLocaleString()} tCO2e</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Net Present Value (NPV)</div>
                        <div className="font-semibold">{formatCurrency(results.npv)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Internal Rate of Return (IRR)</div>
                        <div className="font-semibold">{results.irr ? `${results.irr.toFixed(1)}%` : 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Break-even Year</div>
                        <div className="font-semibold">Year {results.breakEvenYear}</div>
                      </div>
                    </div>
                  </div>
                  
                  <p className="mt-3">
                    Based on a carbon credit price of ${carbonCreditPrice}/tCO2e and a {discountRate}% discount rate, 
                    this project is expected to generate a total of {formatCurrency(results.totalRevenue)} in revenue
                    against {formatCurrency(results.totalCost)} in costs, resulting in a net profit of {formatCurrency(results.netProfit)}.
                    The project breaks even in Year {results.breakEvenYear} and offers an attractive return on investment of {results.roi?.toFixed(1)}%.
                  </p>
                </div>
              )}
              
              {/* Project Details */}
              {reportOptions.includeProjectDetails && (
                <div className="mb-6">
                  <h4 className="font-bold text-lg mb-2">Project Details</h4>
                  <table className="min-w-full border">
                    <tbody>
                      <tr className="bg-gray-50">
                        <td className="py-2 px-3 border font-medium">Project Type</td>
                        <td className="py-2 px-3 border">{projectTypeName}</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 border font-medium">Scenario Name</td>
                        <td className="py-2 px-3 border">{scenarioName}</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="py-2 px-3 border font-medium">Duration</td>
                        <td className="py-2 px-3 border">{projectYears} years</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 border font-medium">Carbon Credit Price</td>
                        <td className="py-2 px-3 border">${carbonCreditPrice}/tCO2e</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="py-2 px-3 border font-medium">Discount Rate</td>
                        <td className="py-2 px-3 border">{discountRate}%</td>
                      </tr>
                      {projectType === 'forestry' && (
                        <>
                          <tr>
                            <td className="py-2 px-3 border font-medium">Tree Type</td>
                            <td className="py-2 px-3 border">{getTypeSpecificName()}</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="py-2 px-3 border font-medium">Project Size</td>
                            <td className="py-2 px-3 border">{projectSize} hectares</td>
                          </tr>
                        </>
                      )}
                      {projectType === 'redd' && (
                        <>
                          <tr>
                            <td className="py-2 px-3 border font-medium">Forest Type</td>
                            <td className="py-2 px-3 border">{getTypeSpecificName()}</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="py-2 px-3 border font-medium">Project Size</td>
                            <td className="py-2 px-3 border">{projectSize} hectares</td>
                          </tr>
                        </>
                      )}
                      {projectType === 'livestock' && (
                        <>
                          <tr>
                            <td className="py-2 px-3 border font-medium">Livestock Type</td>
                            <td className="py-2 px-3 border">{getTypeSpecificName()}</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="py-2 px-3 border font-medium">Herd Size</td>
                            <td className="py-2 px-3 border">{herdSize} animals</td>
                          </tr>
                        </>
                      )}
                      {projectType === 'renewable' && (
                        <>
                          <tr>
                            <td className="py-2 px-3 border font-medium">Renewable Type</td>
                            <td className="py-2 px-3 border">{getTypeSpecificName()}</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="py-2 px-3 border font-medium">Capacity</td>
                            <td className="py-2 px-3 border">{capacityMW} MW</td>
                          </tr>
                        </>
                      )}
                      {(projectType === 'soil' || projectType === 'bluecarbon') && (
                        <>
                          <tr>
                            <td className="py-2 px-3 border font-medium">
                              {projectType === 'soil' ? 'Soil Type' : 'Ecosystem Type'}
                            </td>
                            <td className="py-2 px-3 border">{getTypeSpecificName()}</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="py-2 px-3 border font-medium">Project Size</td>
                            <td className="py-2 px-3 border">{projectSize} hectares</td>
                          </tr>
                        </>
                      )}
                      {projectType === 'construction' && (
                        <>
                          <tr>
                            <td className="py-2 px-3 border font-medium">Building Type</td>
                            <td className="py-2 px-3 border">{getTypeSpecificName()}</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="py-2 px-3 border font-medium">Building Size</td>
                            <td className="py-2 px-3 border">{buildingSize.toLocaleString()} sqm</td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              
              {/* Financial Analysis */}
              {reportOptions.includeFinancialAnalysis && (
                <div className="mb-6">
                  <h4 className="font-bold text-lg mb-2">Financial Analysis</h4>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-white p-3 rounded border shadow-sm">
                      <div className="text-sm text-gray-500 mb-1">Total Revenue</div>
                      <div className="text-xl font-semibold text-green-700">{formatCurrency(results.totalRevenue)}</div>
                    </div>
                    <div className="bg-white p-3 rounded border shadow-sm">
                      <div className="text-sm text-gray-500 mb-1">Total Costs</div>
                      <div className="text-xl font-semibold text-red-600">{formatCurrency(results.totalCost)}</div>
                    </div>
                    <div className="bg-white p-3 rounded border shadow-sm">
                      <div className="text-sm text-gray-500 mb-1">Net Profit</div>
                      <div className="text-xl font-semibold text-blue-600">{formatCurrency(results.netProfit)}</div>
                    </div>
                    <div className="bg-white p-3 rounded border shadow-sm">
                      <div className="text-sm text-gray-500 mb-1">NPV</div>
                      <div className="text-xl font-semibold">{formatCurrency(results.npv)}</div>
                    </div>
                    <div className="bg-white p-3 rounded border shadow-sm">
                      <div className="text-sm text-gray-500 mb-1">IRR</div>
                      <div className="text-xl font-semibold">{results.irr ? `${results.irr.toFixed(1)}%` : 'N/A'}</div>
                    </div>
                    <div className="bg-white p-3 rounded border shadow-sm">
                      <div className="text-sm text-gray-500 mb-1">ROI</div>
                      <div className="text-xl font-semibold">{results.roi?.toFixed(1)}%</div>
                    </div>
                  </div>
                  <p className="text-sm">
                    <span className="font-medium">Financial Assessment:</span> With a Net Present Value (NPV) of {formatCurrency(results.npv)} 
                    and an Internal Rate of Return (IRR) of {results.irr ? `${results.irr.toFixed(1)}%` : 'N/A'}, 
                    this project {results.npv > 0 ? 'represents a viable investment opportunity' : 'may require further evaluation'}.
                    The project is expected to break even in Year {results.breakEvenYear} and generate a total profit of {formatCurrency(results.netProfit)} 
                    over its {projectYears}-year lifetime.
                  </p>
                </div>
              )}
              
              {/* Charts */}
              {reportOptions.includeCharts && results?.chartData && (
                <div className="mb-6">
                  <h4 className="font-bold text-lg mb-2">Charts & Graphs</h4>
                  
                  <div className="mb-4">
                    <h5 className="font-medium text-sm mb-1">Cash Flow Analysis</h5>
                    {results.chartData && results.chartData.cashFlowData && (
                      <CashFlowChart data={results.chartData.cashFlowData} />
                    )}
                  </div>
                  
                  {results.chartData && (
                    projectType === 'construction' && results.chartData.emissionsBreakdown ? (
                      <div>
                        <h5 className="font-medium text-sm mb-1">Emissions Breakdown</h5>
                        <CostBreakdownChart data={results.chartData.emissionsBreakdown} />
                      </div>
                    ) : (
                      <div>
                        <h5 className="font-medium text-sm mb-1">Cost Breakdown</h5>
                        <CostBreakdownChart data={results.chartData.costBreakdownData} />
                      </div>
                    )
                  )}
                </div>
              )}
              
              {/* Annual Data */}
              {reportOptions.includeAnnualData && results?.yearlyData && (
                <div className="mb-6">
                  <h4 className="font-bold text-lg mb-2">Annual Data</h4>
                  
                  <div className="max-h-60 overflow-y-auto border rounded">
                    <table className="min-w-full">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 border-b">Year</th>
                          {projectType === 'construction' ? (
                            <>
                              <th className="py-2 px-3 text-right text-xs font-medium text-gray-500 border-b">Baseline Emissions</th>
                              <th className="py-2 px-3 text-right text-xs font-medium text-gray-500 border-b">Green Building</th>
                              <th className="py-2 px-3 text-right text-xs font-medium text-gray-500 border-b">Reduction</th>
                            </>
                          ) : (
                            <>
                              <th className="py-2 px-3 text-right text-xs font-medium text-gray-500 border-b">Sequestration</th>
                              <th className="py-2 px-3 text-right text-xs font-medium text-gray-500 border-b">Revenue</th>
                              <th className="py-2 px-3 text-right text-xs font-medium text-gray-500 border-b">Costs</th>
                              <th className="py-2 px-3 text-right text-xs font-medium text-gray-500 border-b">Net Cash Flow</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {results.yearlyData.map((yearData) => (
                          projectType === 'construction' ? (
                            <tr key={yearData.year} className="hover:bg-gray-50">
                              <td className="py-2 px-3 border-b">{yearData.year}</td>
                              <td className="py-2 px-3 text-right border-b">{parseFloat(yearData.baselineEmissions).toLocaleString()} tCO2e</td>
                              <td className="py-2 px-3 text-right border-b">{parseFloat(yearData.greenEmissions).toLocaleString()} tCO2e</td>
                              <td className="py-2 px-3 text-right border-b font-medium text-green-700">{parseFloat(yearData.reduction).toLocaleString()} tCO2e</td>
                            </tr>
                          ) : (
                            <tr key={yearData.year} className={parseFloat(yearData.cumulativeNetCashFlow) >= 0 ? 'bg-green-50' : ''}>
                              <td className="py-2 px-3 border-b">{yearData.year}</td>
                              <td className="py-2 px-3 text-right border-b">{parseFloat(yearData.sequestration).toLocaleString()} tCO2e</td>
                              <td className="py-2 px-3 text-right border-b">${parseFloat(yearData.revenue).toLocaleString()}</td>
                              <td className="py-2 px-3 text-right border-b">${parseFloat(yearData.costs).toLocaleString()}</td>
                              <td className="py-2 px-3 text-right border-b font-medium">${parseFloat(yearData.netCashFlow).toLocaleString()}</td>
                            </tr>
                          )
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {/* Scenario Comparison */}
              {reportOptions.includeScenarioComparison && savedConfigurations.length > 1 && (
                <div className="mb-6">
                  <h4 className="font-bold text-lg mb-2">Scenario Comparison</h4>
                  
                  <div className="overflow-x-auto border rounded">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 border-b">Scenario</th>
                          <th className="py-2 px-3 text-right text-xs font-medium text-gray-500 border-b">Sequestration</th>
                          <th className="py-2 px-3 text-right text-xs font-medium text-gray-500 border-b">Revenue</th>
                          <th className="py-2 px-3 text-right text-xs font-medium text-gray-500 border-b">Costs</th>
                          <th className="py-2 px-3 text-right text-xs font-medium text-gray-500 border-b">NPV</th>
                          <th className="py-2 px-3 text-right text-xs font-medium text-gray-500 border-b">IRR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {savedConfigurations
                          .filter(scenario => 
                            reportOptions.comparisonScenarios.find(sc => sc.id === scenario.id)?.selected
                          )
                          .map((scenario) => (
                            <tr 
                              key={scenario.id} 
                              className={scenario.name === scenarioName ? 'bg-green-50 font-medium' : 'hover:bg-gray-50'}
                            >
                              <td className="py-2 px-3 border-b">{scenario.name}</td>
                              <td className="py-2 px-3 text-right border-b">{Math.round(scenario.results.totalSequestration).toLocaleString()} tCO2e</td>
                              <td className="py-2 px-3 text-right border-b">${Math.round(scenario.results.totalRevenue).toLocaleString()}</td>
                              <td className="py-2 px-3 text-right border-b">${Math.round(scenario.results.totalCost).toLocaleString()}</td>
                              <td className="py-2 px-3 text-right border-b">${Math.round(scenario.results.npv).toLocaleString()}</td>
                              <td className="py-2 px-3 text-right border-b">{scenario.results.irr ? `${scenario.results.irr.toFixed(1)}%` : 'N/A'}</td>
                            </tr>
                          ))
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {/* Conclusions */}
              <div>
                <h4 className="font-bold text-lg mb-2">Conclusions & Recommendations</h4>
                <p className="text-sm">
                  This {projectTypeName.toLowerCase()} carbon project demonstrates {
                    results.npv > 0 ? 'strong' : 'potential'
                  } financial viability with {
                    results.npv > 0 ? 'positive' : 'a'
                  } NPV of {formatCurrency(results.npv)} and {
                    results.irr ? `an IRR of ${results.irr.toFixed(1)}%` : 'potential returns'
                  }. The project will sequester an estimated {Math.round(results.totalSequestration).toLocaleString()} tonnes of CO2e over its {projectYears}-year lifetime.
                </p>
                <p className="text-sm mt-2">
                  Based on these results, we recommend {
                    results.npv > 0 && (results.irr || 0) > discountRate ? 
                    'proceeding with this project as it presents both environmental benefits and financial returns that exceed the discount rate.' : 
                    results.npv > 0 ? 
                    'considering this project for implementation, with additional analysis of non-financial benefits.' :
                    'evaluating alternative configurations or pursuing non-financial justifications for this project.'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportGenerator;