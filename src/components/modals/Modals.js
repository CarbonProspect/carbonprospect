import React from 'react';
import { formatCurrency } from '../../utils/formatters';

// Carbon Price Modal
export const CarbonPriceModal = ({ 
  isOpen, 
  onClose, 
  projectYears, 
  carbonPricesByYear, 
  onUpdate, 
  onBulkUpdate 
}) => {
  const [startYear, setStartYear] = React.useState(1);
  const [endYear, setEndYear] = React.useState(projectYears);
  const [startPrice, setStartPrice] = React.useState(50);
  const [endPrice, setEndPrice] = React.useState(100);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-screen overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Carbon Price by Year</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <div className="mb-4 p-3 bg-gray-50 rounded border">
          <h4 className="font-medium mb-2">Bulk Update</h4>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-sm mb-1">Start Year</label>
              <input
                type="number"
                min="1"
                max={projectYears}
                value={startYear}
                onChange={(e) => setStartYear(parseInt(e.target.value))}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">End Year</label>
              <input
                type="number"
                min="1"
                max={projectYears}
                value={endYear}
                onChange={(e) => setEndYear(parseInt(e.target.value))}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Start Price ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={startPrice}
                onChange={(e) => setStartPrice(parseFloat(e.target.value))}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">End Price ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={endPrice}
                onChange={(e) => setEndPrice(parseFloat(e.target.value))}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          <button
            onClick={() => onBulkUpdate(startYear, endYear, startPrice, endPrice)}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
            type="button"
          >
            Apply Price Range
          </button>
        </div>
        
        <div className="max-h-80 overflow-y-auto">
          <table className="min-w-full border-collapse">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="py-2 px-4 text-left border">Year</th>
                <th className="py-2 px-4 text-left border">Carbon Price ($)</th>
                <th className="py-2 px-4 text-center border">Action</th>
              </tr>
            </thead>
            <tbody>
              {carbonPricesByYear.map((yearData, index) => (
                <tr key={yearData.year} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border">Year {yearData.year}</td>
                  <td className="py-2 px-4 border">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={yearData.price}
                      onChange={(e) => onUpdate(index, parseFloat(e.target.value))}
                      className="w-full p-1 border rounded"
                    />
                  </td>
                  <td className="py-2 px-4 border text-center">
                    {index > 0 && (
                      <button
                        className="text-gray-500 hover:text-gray-700"
                        onClick={() => onUpdate(index, carbonPricesByYear[index-1].price)}
                        type="button"
                        title="Copy from previous year"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                        </svg>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded mr-2"
            type="button"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Custom Type Modal
export const CustomTypeModal = ({
  isOpen,
  onClose,
  categoryName,
  onAdd,
  typeName,
  typeRate,
  onTypeNameChange,
  onTypeRateChange
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Add Custom {categoryName} Type</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            value={typeName}
            onChange={(e) => onTypeNameChange(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder={`Custom ${categoryName} name`}
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            {categoryName === 'forestry' || categoryName === 'soil' || categoryName === 'bluecarbon' || categoryName === 'redd' ? 
              'Sequestration Rate (tCO2e/ha/year)' : 
              categoryName === 'livestock' ? 
                'Emissions Rate (tCO2e/animal/year)' : 
                categoryName === 'renewable' ? 
                  'Capacity Factor (0-1)' : 
                  'Rate'
            }
          </label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={typeRate}
            onChange={(e) => onTypeRateChange(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded mr-2"
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={onAdd}
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
            type="button"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

// Cost Modal
export const CostModal = ({
  isOpen,
  onClose,
  isEdit,
  cost,
  onCostChange,
  onSave
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{isEdit ? 'Edit Cost' : 'Add New Cost'}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Cost Name</label>
          <input
            type="text"
            value={cost.name}
            onChange={(e) => onCostChange('name', e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="e.g., Equipment Purchase"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Cost Type</label>
          <select
            value={cost.type}
            onChange={(e) => onCostChange('type', e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="fixed">Fixed (one-time)</option>
            <option value="annual">Annual (fixed amount per year)</option>
            <option value="per_hectare">Per Unit (one-time)</option>
            <option value="annual_per_hectare">Per Unit (annual)</option>
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Amount ($)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={cost.value}
            onChange={(e) => onCostChange('value', e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">First Occurrence (Year)</label>
          <input
            type="number"
            min="1"
            value={cost.year}
            onChange={(e) => onCostChange('year', e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Description (Optional)</label>
          <textarea
            value={cost.description}
            onChange={(e) => onCostChange('description', e.target.value)}
            className="w-full p-2 border rounded"
            rows="2"
          ></textarea>
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded mr-2"
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
            type="button"
          >
            {isEdit ? 'Update' : 'Add'} Cost
          </button>
        </div>
      </div>
    </div>
  );
};

// Scenario Management Modal
export const ScenarioManagementModal = ({ 
  isOpen, 
  onClose, 
  savedConfigurations, 
  onLoad, 
  onDelete, 
  onCompare, 
  currentScenarioName 
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-screen overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Scenario Management</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-gray-500">
            Your saved scenarios can be loaded, compared, or deleted. Current scenario: <strong>{currentScenarioName}</strong>
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-4 text-left border">Scenario Name</th>
                <th className="py-2 px-4 text-left border">Project Type</th>
                <th className="py-2 px-4 text-right border">Sequestration</th>
                <th className="py-2 px-4 text-right border">NPV</th>
                <th className="py-2 px-4 text-right border">ROI</th>
                <th className="py-2 px-4 text-right border">Break-even</th>
                <th className="py-2 px-4 text-center border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {savedConfigurations.map((config) => (
                <tr key={config.id} className={config.name === currentScenarioName ? 'bg-green-50' : 'hover:bg-gray-50'}>
                  <td className="py-2 px-4 border font-medium">{config.name}</td>
                  <td className="py-2 px-4 border">{config.projectType.charAt(0).toUpperCase() + config.projectType.slice(1)}</td>
                  <td className="py-2 px-4 border text-right">
                    {Math.round(config.results.totalSequestration).toLocaleString()} tCO2e
                  </td>
                  <td className="py-2 px-4 border text-right">
                    {formatCurrency(config.results.npv)}
                  </td>
                  <td className="py-2 px-4 border text-right">
                    {config.results.roi ? config.results.roi.toFixed(1) + '%' : 'N/A'}
                  </td>
                  <td className="py-2 px-4 border text-right">
                    Year {config.results.breakEvenYear}
                  </td>
                  <td className="py-2 px-4 border text-center">
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => onLoad(config)}
                        className={`text-blue-600 hover:text-blue-800 ${config.name === currentScenarioName ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={config.name === currentScenarioName}
                        title="Load Scenario"
                        type="button"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      </button>
                      <button
                        onClick={() => onCompare(config)}
                        className={`text-green-600 hover:text-green-800 ${config.name === currentScenarioName ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={config.name === currentScenarioName}
                        title="Compare with Current"
                        type="button"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => onDelete(config.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete Scenario"
                        type="button"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {savedConfigurations.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-4 px-4 border text-center text-gray-500">
                    No saved scenarios yet. Configure a project and click "Save Scenario" to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded"
            type="button"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Scenario Comparison Component
export const ScenarioComparison = ({ currentResults, comparisonConfig, onClose, scenarioName }) => {
  if (!currentResults || !comparisonConfig || !comparisonConfig.results) return null;
  
  const comparisonResults = comparisonConfig.results;
  
  // Calculate differences
  const calculateDifference = (current, comparison) => {
    if (!current || !comparison) return 0;
    return ((current - comparison) / comparison) * 100;
  };
  
  const npvDiff = calculateDifference(currentResults.npv, comparisonResults.npv);
  const irrDiff = calculateDifference(
    currentResults.irr || 0, 
    comparisonResults.irr || 0
  );
  const roiDiff = calculateDifference(currentResults.roi, comparisonResults.roi);
  const sequestrationDiff = calculateDifference(
    currentResults.totalSequestration, 
    comparisonResults.totalSequestration
  );
  const revenueDiff = calculateDifference(
    currentResults.totalRevenue, 
    comparisonResults.totalRevenue
  );
  const costDiff = calculateDifference(
    currentResults.totalCost, 
    comparisonResults.totalCost
  );
  const profitDiff = calculateDifference(
    currentResults.netProfit, 
    comparisonResults.netProfit
  );
  
  return (
    <div className="bg-white border rounded-lg p-4 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-green-700">Scenario Comparison</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
          type="button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      <div className="grid grid-cols-3 mb-4">
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-1">Current Scenario</p>
          <p className="font-medium">{scenarioName}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-1">Comparison</p>
          <p className="font-medium">{comparisonConfig.name}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-1">Difference</p>
          <p className="font-medium">% Change</p>
        </div>
      </div>
      
      <div className="overflow-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left py-2 px-4 text-sm">Metric</th>
              <th className="text-right py-2 px-4 text-sm">Current</th>
              <th className="text-right py-2 px-4 text-sm">Comparison</th>
              <th className="text-right py-2 px-4 text-sm">Difference</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-2 px-4 text-sm">Total Sequestration (tCO2e)</td>
              <td className="py-2 px-4 text-right text-sm">{Math.round(currentResults.totalSequestration).toLocaleString()}</td>
              <td className="py-2 px-4 text-right text-sm">{Math.round(comparisonResults.totalSequestration).toLocaleString()}</td>
              <td className={`py-2 px-4 text-right text-sm ${sequestrationDiff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {sequestrationDiff > 0 ? '+' : ''}{sequestrationDiff.toFixed(1)}%
              </td>
            </tr>
            <tr className="border-b">
              <td className="py-2 px-4 text-sm">Total Revenue</td>
              <td className="py-2 px-4 text-right text-sm">{formatCurrency(currentResults.totalRevenue)}</td>
              <td className="py-2 px-4 text-right text-sm">{formatCurrency(comparisonResults.totalRevenue)}</td>
              <td className={`py-2 px-4 text-right text-sm ${revenueDiff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {revenueDiff > 0 ? '+' : ''}{revenueDiff.toFixed(1)}%
              </td>
            </tr>
            <tr className="border-b">
              <td className="py-2 px-4 text-sm">Total Costs</td>
              <td className="py-2 px-4 text-right text-sm">{formatCurrency(currentResults.totalCost)}</td>
              <td className="py-2 px-4 text-right text-sm">{formatCurrency(comparisonResults.totalCost)}</td>
              <td className={`py-2 px-4 text-right text-sm ${costDiff < 0 ? 'text-green-600' : 'text-red-600'}`}>
                {costDiff > 0 ? '+' : ''}{costDiff.toFixed(1)}%
              </td>
            </tr>
            <tr className="border-b">
              <td className="py-2 px-4 text-sm">Net Profit</td>
              <td className="py-2 px-4 text-right text-sm">{formatCurrency(currentResults.netProfit)}</td>
              <td className="py-2 px-4 text-right text-sm">{formatCurrency(comparisonResults.netProfit)}</td>
              <td className={`py-2 px-4 text-right text-sm ${profitDiff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {profitDiff > 0 ? '+' : ''}{profitDiff.toFixed(1)}%
              </td>
            </tr>
            <tr className="border-b">
              <td className="py-2 px-4 text-sm font-medium">NPV</td>
              <td className="py-2 px-4 text-right text-sm">{formatCurrency(currentResults.npv)}</td>
              <td className="py-2 px-4 text-right text-sm">{formatCurrency(comparisonResults.npv)}</td>
              <td className={`py-2 px-4 text-right text-sm ${npvDiff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {npvDiff > 0 ? '+' : ''}{npvDiff.toFixed(1)}%
              </td>
            </tr>
            <tr className="border-b">
              <td className="py-2 px-4 text-sm font-medium">IRR (%)</td>
              <td className="py-2 px-4 text-right text-sm">{currentResults.irr ? `${currentResults.irr.toFixed(1)}%` : 'N/A'}</td>
              <td className="py-2 px-4 text-right text-sm">{comparisonResults.irr ? `${comparisonResults.irr.toFixed(1)}%` : 'N/A'}</td>
              <td className={`py-2 px-4 text-right text-sm ${irrDiff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(currentResults.irr && comparisonResults.irr) ? 
                  `${irrDiff > 0 ? '+' : ''}${irrDiff.toFixed(1)}%` : 
                  'N/A'}
              </td>
            </tr>
            <tr className="border-b">
              <td className="py-2 px-4 text-sm">Break-even Year</td>
              <td className="py-2 px-4 text-right text-sm">Year {currentResults.breakEvenYear}</td>
              <td className="py-2 px-4 text-right text-sm">Year {comparisonResults.breakEvenYear}</td>
              <td className={`py-2 px-4 text-right text-sm ${
                currentResults.breakEvenYear !== 'N/A' && 
                comparisonResults.breakEvenYear !== 'N/A' && 
                parseInt(currentResults.breakEvenYear) < parseInt(comparisonResults.breakEvenYear) ? 
                'text-green-600' : 'text-red-600'}`}>
                {currentResults.breakEvenYear !== 'N/A' && comparisonResults.breakEvenYear !== 'N/A' ? 
                  `${parseInt(currentResults.breakEvenYear) - parseInt(comparisonResults.breakEvenYear)} year(s)` : 
                  'N/A'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        <p>Note: Positive values indicate improvement over the comparison scenario.</p>
      </div>
    </div>
  );
};