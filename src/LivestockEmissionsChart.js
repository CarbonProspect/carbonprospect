import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

// Component for displaying livestock emissions charts
const LivestockEmissionsChart = ({ yearlyData, emissionsIntensity, herdSize }) => {
  // Format numbers for display
  const formatNumber = (num) => {
    return num?.toLocaleString(undefined, { maximumFractionDigits: 1 }) || '0';
  };

  // Create data for yearly emissions chart
  const prepareChartData = () => {
    if (!yearlyData || yearlyData.length === 0) {
      return Array.from({ length: 10 }, (_, i) => ({
        year: i + 1,
        baselineEmissions: 0,
        adjustedEmissions: 0,
        emissionsReduction: 0
      }));
    }
    
    return yearlyData.map(year => ({
      year: `Year ${year.year}`,
      baselineEmissions: year.baselineEmissions / 1000, // Convert kg to tonnes
      adjustedEmissions: year.adjustedEmissions / 1000, // Convert kg to tonnes
      emissionsReduction: year.emissionsReduction / 1000 // Convert kg to tonnes
    }));
  };

  // Create formatted data from inputs
  const chartData = prepareChartData();
  
  return (
    <div className="space-y-6">
      {/* Emissions Intensity Overview */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="font-medium text-blue-800 mb-3">Emissions Intensity Overview</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">Baseline Emissions</div>
            <div className="text-xl font-bold text-blue-700">
              {formatNumber(emissionsIntensity?.baseline)} <span className="text-sm font-normal">kg CO2e/head/year</span>
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">Reduced Emissions</div>
            <div className="text-xl font-bold text-green-700">
              {formatNumber(emissionsIntensity?.reduced)} <span className="text-sm font-normal">kg CO2e/head/year</span>
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">Reduction</div>
            <div className="text-xl font-bold text-green-700">
              {formatNumber(emissionsIntensity?.percentReduction)}% <span className="text-sm font-normal">reduction</span>
            </div>
          </div>
        </div>
        
        <div className="mt-3 text-xs text-gray-500">
          Total annual herd emissions after reductions: {formatNumber((emissionsIntensity?.reduced * herdSize) / 1000)} tonnes CO2e
        </div>
      </div>
      
      {/* Yearly Emissions Chart */}
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <h4 className="font-medium text-gray-800 mb-4">Annual Emissions Comparison</h4>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis label={{ value: 'Tonnes CO2e', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value) => [`${formatNumber(value)} tonnes CO2e`, null]} />
              <Legend />
              <Bar name="Baseline Emissions" dataKey="baselineEmissions" fill="#94a3b8" />
              <Bar name="Reduced Emissions" dataKey="adjustedEmissions" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Emissions Reduction Over Time */}
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <h4 className="font-medium text-gray-800 mb-4">Emissions Reduction Over Time</h4>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis label={{ value: 'Tonnes CO2e Reduction', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value) => [`${formatNumber(value)} tonnes CO2e`, null]} />
              <Legend />
              <Line
                name="Emissions Reduction"
                type="monotone"
                dataKey="emissionsReduction"
                stroke="#16a34a"
                strokeWidth={2}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Cumulative Impact */}
      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <h4 className="font-medium text-green-800 mb-2">Cumulative Emissions Impact</h4>
        <div className="text-sm">
          <p>Over a 10-year project period, this livestock management approach could reduce emissions by approximately:</p>
          <p className="text-2xl font-bold text-green-700 mt-2 mb-1">
            {formatNumber((emissionsIntensity?.baseline - emissionsIntensity?.reduced) * herdSize * 10 / 1000)} tonnes CO2e
          </p>
          <p className="text-xs text-gray-500">
            Equivalent to removing {formatNumber(((emissionsIntensity?.baseline - emissionsIntensity?.reduced) * herdSize * 10 / 1000) / 4.6)} cars from the road for a year
          </p>
        </div>
      </div>
    </div>
  );
};

export default LivestockEmissionsChart;