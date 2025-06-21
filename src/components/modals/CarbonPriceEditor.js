import React, { useState, useEffect } from 'react';
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CarbonPriceEditor = ({ 
  isOpen, 
  onClose, 
  projectYears, 
  carbonPricesByYear, 
  onUpdateAll, 
  carbonCreditPrice
}) => {
  const [priceData, setPriceData] = useState([]);
  const [showChart, setShowChart] = useState(true);
  const [customPricePattern, setCustomPricePattern] = useState('flat');
  const [startPrice, setStartPrice] = useState(carbonCreditPrice);
  const [endPrice, setEndPrice] = useState(carbonCreditPrice);
  const [yearStep, setYearStep] = useState(5); // Years between price changes in stepped pattern
  const [priceStep, setPriceStep] = useState(10); // Price change amount in stepped pattern
  
  // Initialize price data from props
  useEffect(() => {
    if (carbonPricesByYear && carbonPricesByYear.length > 0) {
      setPriceData([...carbonPricesByYear]);
    } else {
      // Create default data
      const newData = Array.from({ length: projectYears }, (_, i) => ({
        year: i + 1,
        price: carbonCreditPrice
      }));
      setPriceData(newData);
    }
  }, [carbonPricesByYear, projectYears, carbonCreditPrice]);
  
  // Set price for a specific year
  const updatePrice = (year, price) => {
    const newData = priceData.map(item => 
      item.year === year ? { ...item, price: parseFloat(price) } : item
    );
    setPriceData(newData);
  };
  
  // Apply pattern to all years
  const applyPricePattern = () => {
    let newData = [...priceData];
    
    switch (customPricePattern) {
      case 'flat':
        // Flat price across all years
        newData = newData.map(item => ({ ...item, price: startPrice }));
        break;
        
      case 'linear':
        // Linear increase/decrease from start to end price
        const priceDiff = endPrice - startPrice;
        const priceIncrement = priceDiff / (projectYears - 1);
        
        newData = newData.map((item, index) => ({ 
          ...item, 
          price: parseFloat((startPrice + (priceIncrement * index)).toFixed(2))
        }));
        break;
        
      case 'stepped':
        // Step changes every X years
        let currentPrice = startPrice;
        
        newData = newData.map((item, index) => {
          // Check if we need to step up the price
          if (index > 0 && index % yearStep === 0) {
            currentPrice += priceStep;
          }
          
          return { ...item, price: currentPrice };
        });
        break;
        
      case 's-curve':
        // S-curve (logistic function) from start to end price
        const midpoint = projectYears / 2;
        const steepness = 0.5; // Adjust for steeper/flatter curve
        
        newData = newData.map((item, index) => {
          // Logistic function: start + (end-start)/(1 + e^(-steepness * (x - midpoint)))
          const x = item.year;
          const logisticValue = startPrice + 
            (endPrice - startPrice) / 
            (1 + Math.exp(-steepness * (x - midpoint)));
          
          return { ...item, price: parseFloat(logisticValue.toFixed(2)) };
        });
        break;
        
      default:
        // No changes
        break;
    }
    
    setPriceData(newData);
  };
  
  // Import prices from CSV
  const handleImportCSV = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const rows = content.split('\n');
        
        // Skip header row if it exists
        const startRow = rows[0].toLowerCase().includes('year') || 
                        rows[0].toLowerCase().includes('price') ? 1 : 0;
        
        const newPriceData = [];
        
        // Process each row
        for (let i = startRow; i < rows.length; i++) {
          if (!rows[i].trim()) continue; // Skip empty rows
          
          const values = rows[i].split(',');
          if (values.length >= 2) {
            const year = parseInt(values[0].trim());
            const price = parseFloat(values[1].trim());
            
            if (!isNaN(year) && !isNaN(price) && year > 0 && year <= projectYears) {
              newPriceData.push({ year, price });
            }
          }
        }
        
        // Sort by year and ensure we have data for all years
        newPriceData.sort((a, b) => a.year - b.year);
        
        // Fill in missing years
        let completeData = [];
        for (let year = 1; year <= projectYears; year++) {
          const existingData = newPriceData.find(item => item.year === year);
          if (existingData) {
            completeData.push(existingData);
          } else {
            // For missing years, use the last known price or default
            const lastPrice = completeData.length > 0 ? 
              completeData[completeData.length - 1].price : 
              carbonCreditPrice;
            
            completeData.push({ year, price: lastPrice });
          }
        }
        
        setPriceData(completeData);
      } catch (error) {
        alert('Error parsing CSV file. Please check the format.');
        console.error('CSV parsing error:', error);
      }
    };
    
    reader.readAsText(file);
  };
  
  // Export prices to CSV
  const handleExportCSV = () => {
    // Create CSV content
    const header = 'Year,Price\n';
    const rows = priceData.map(item => `${item.year},${item.price}`).join('\n');
    const csvContent = header + rows;
    
    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Create temporary link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'carbon_prices.csv');
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  // Save changes and close modal
  const handleSave = () => {
    onUpdateAll(priceData);
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full max-h-screen overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Carbon Price Editor</h3>
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
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel: Price pattern settings */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h4 className="font-medium mb-3">Price Pattern Settings</h4>
            
            <div className="mb-3">
              <label className="block text-sm mb-1">Pattern Type</label>
              <select
                value={customPricePattern}
                onChange={(e) => setCustomPricePattern(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="flat">Flat (Constant Price)</option>
                <option value="linear">Linear Increase/Decrease</option>
                <option value="stepped">Stepped Increases</option>
                <option value="s-curve">S-Curve (Logistic)</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-sm mb-1">Start Price ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={startPrice}
                  onChange={(e) => setStartPrice(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 border rounded"
                />
              </div>
              
              {customPricePattern !== 'flat' && (
                <div>
                  <label className="block text-sm mb-1">End Price ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={endPrice}
                    onChange={(e) => setEndPrice(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border rounded"
                  />
                </div>
              )}
              
              {customPricePattern === 'stepped' && (
                <>
                  <div>
                    <label className="block text-sm mb-1">Years Between Steps</label>
                    <input
                      type="number"
                      min="1"
                      max={projectYears}
                      value={yearStep}
                      onChange={(e) => setYearStep(parseInt(e.target.value) || 1)}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Price Change per Step ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={priceStep}
                      onChange={(e) => setPriceStep(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </>
              )}
            </div>
            
            <button
              onClick={applyPricePattern}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded mb-4"
              type="button"
            >
              Apply Pattern
            </button>
            
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Import/Export</h4>
              
              <div className="mb-3">
                <label className="block text-sm mb-1">Import from CSV</label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImportCSV}
                  className="w-full p-2 text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  CSV format: Year,Price (e.g., "1,50")
                </p>
              </div>
              
              <button
                onClick={handleExportCSV}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded"
                type="button"
              >
                Export to CSV
              </button>
            </div>
          </div>
          
          {/* Middle panel: Price chart */}
          <div className="lg:col-span-2">
            <div className="mb-3 flex justify-between items-center">
              <h4 className="font-medium">Carbon Price by Year</h4>
              <button
                onClick={() => setShowChart(!showChart)}
                className="text-blue-600 hover:text-blue-800 text-sm"
                type="button"
              >
                {showChart ? 'Hide Chart' : 'Show Chart'}
              </button>
            </div>
            
            {showChart && (
              <div className="h-64 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={priceData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="year" 
                      label={{ value: 'Year', position: 'insideBottomRight', offset: -5 }} 
                    />
                    <YAxis 
                      label={{ value: 'Price ($)', angle: -90, position: 'insideLeft' }} 
                      domain={['dataMin - 5', 'dataMax + 5']}
                    />
                    <Tooltip 
                      formatter={(value) => `$${value.toFixed(2)}`}
                      labelFormatter={(value) => `Year ${value}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#8884d8" 
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            
            <div className="h-64 overflow-y-auto border rounded">
              <table className="min-w-full border-collapse">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="py-2 px-4 text-left border-b">Year</th>
                    <th className="py-2 px-4 text-left border-b">Carbon Price ($)</th>
                  </tr>
                </thead>
                <tbody>
                  {priceData.map((yearData, index) => (
                    <tr key={yearData.year} className="hover:bg-gray-50">
                      <td className="py-2 px-4 border-b">Year {yearData.year}</td>
                      <td className="py-2 px-4 border-b">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={yearData.price}
                          onChange={(e) => updatePrice(yearData.year, e.target.value)}
                          className="w-24 p-1 border rounded text-right"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded"
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
            type="button"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default CarbonPriceEditor;