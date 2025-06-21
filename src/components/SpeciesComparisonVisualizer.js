import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart, Line, Area
} from 'recharts';
import { compareBuffaloToCattle } from '../utils/BuffaloEmissionsCalculator.js';

/**
 * Component to visualize differences between cattle and buffalo emissions
 * and productivity metrics
 */
const SpeciesComparisonVisualizer = ({
  // Buffalo parameters
  buffaloParams = {
    buffaloType: 'water_buffalo',
    gender: 'female',
    bodyWeight: 650,
    age: 48,
    productionSystem: 'traditional',
    milkProduction: 5,
    isPregnant: false,
    isLactating: true,
    dietInfo: {
      digestibility: 0.60,
      type: 'high_forage',
      crudeProtein: 10
    },
    reproductiveInfo: {
      calvingRate: 70,
      timeToCalf: 15,
      ageAtFirstCalving: 36
    },
    manureSystem: 'dry_lot'
  },
  // Cattle parameters
  cattleParams = {
    cattleType: 'dairy',
    bodyWeight: 600,
    weightGain: 0,
    milkProduction: 15,
    milkFatPercent: 4.0,
    isPregnant: false,
    activityFactor: 1.0,
    dietInfo: {
      digestibility: 0.65,
      type: 'mixed'
    },
    manureSystem: 'dry_lot',
    productionSystem: 'semi_intensive',
    reproductiveInfo: {
      calvingRate: 80,
      timeToCalf: 12
    },
    baselineDiet: {
      energyBalance: 0,
      proteinPercent: 12
    },
    improvedDiet: {
      energyBalance: 10,
      proteinPercent: 16
    },
    supplementType: 'protein'
  },
  // Display options
  displayOptions = {
    showEmissions: true,
    showEnergy: true,
    showReproduction: true,
    showEnvironmental: true
  }
}) => {
  // State to store comparison results
  const [comparisonData, setComparisonData] = useState(null);
  const [activeTab, setActiveTab] = useState('emissions');

  // Calculate comparison data when parameters change
  useEffect(() => {
    const results = compareBuffaloToCattle(buffaloParams, cattleParams);
    setComparisonData(results);
  }, [buffaloParams, cattleParams]);

  // Chart colors
  const COLORS = {
    buffalo: '#8884d8',
    cattle: '#82ca9d',
    neutral: '#8dd1e1',
    positive: '#82ca9d',
    negative: '#ff8042'
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 shadow-sm rounded text-xs">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} style={{ color: entry.color }}>
              {entry.name}: {entry.value} {entry.unit || ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Function to render emissions comparison
  const renderEmissionsComparison = () => {
    if (!comparisonData?.emissionsComparison) {
      return <div className="text-center py-4">Loading emissions data...</div>;
    }

    const { emissionsComparison, methaneComparison } = comparisonData;
    
    // Prepare data for emissions by source chart
    const emissionsBySourceData = [
      {
        name: 'Enteric',
        Buffalo: comparisonData.buffaloEmissions?.emissionsBySource?.enteric || 0,
        Cattle: comparisonData.cattleEmissions?.emissionsBySource?.enteric || 0
      },
      {
        name: 'Manure CH4',
        Buffalo: comparisonData.buffaloEmissions?.emissionsBySource?.manure_ch4 || 0,
        Cattle: comparisonData.cattleEmissions?.emissionsBySource?.manure_ch4 || 0
      },
      {
        name: 'Manure N2O',
        Buffalo: comparisonData.buffaloEmissions?.emissionsBySource?.manure_n2o || 0,
        Cattle: comparisonData.cattleEmissions?.emissionsBySource?.manure_n2o || 0
      },
      {
        name: 'Feed',
        Buffalo: comparisonData.buffaloEmissions?.emissionsBySource?.feed_production || 0,
        Cattle: comparisonData.cattleEmissions?.emissionsBySource?.feed_production || 0
      }
    ];
    
    // Prepare data for total emissions comparison
    const totalEmissionsData = [
      {
        name: 'Buffalo',
        value: emissionsComparison.buffalo,
        color: COLORS.buffalo
      },
      {
        name: 'Cattle',
        value: emissionsComparison.cattle,
        color: COLORS.cattle
      }
    ];
    
    return (
      <div className="space-y-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Total Annual Emissions</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={totalEmissionsData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis label={{ value: 'kg CO2e/year', angle: -90, position: 'insideLeft' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="value" name="Annual Emissions" fill={COLORS.neutral} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 p-3 bg-gray-50 rounded border">
            <p className="text-sm font-medium">Buffalo vs Cattle Emissions:</p>
            <p className="text-sm">
              {emissionsComparison.percentDifference > 0 ? 
                `Buffalo produce ${emissionsComparison.percentDifference}% more emissions than equivalent cattle` :
                `Buffalo produce ${Math.abs(emissionsComparison.percentDifference)}% less emissions than equivalent cattle`
              }
            </p>
            <p className="text-sm mt-2 font-medium">Methane Production:</p>
            <p className="text-sm">
              {methaneComparison.percentDifference > 0 ? 
                `Buffalo produce ${methaneComparison.percentDifference}% more methane than equivalent cattle` :
                `Buffalo produce ${Math.abs(methaneComparison.percentDifference)}% less methane than equivalent cattle`
              }
            </p>
          </div>
        </div>
        
        {emissionsBySourceData.some(item => item.Buffalo > 0 || item.Cattle > 0) && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Emissions by Source</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={emissionsBySourceData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: 'kg CO2e/year', angle: -90, position: 'insideLeft' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="Buffalo" fill={COLORS.buffalo} />
                  <Bar dataKey="Cattle" fill={COLORS.cattle} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Function to render energy and feed efficiency comparison
  const renderEnergyComparison = () => {
    if (!comparisonData?.energyComparison) {
      return <div className="text-center py-4">Loading energy data...</div>;
    }

    const { energyComparison, feedEfficiencyComparison } = comparisonData;
    
    // Prepare data for energy requirements chart
    const energyData = [
      {
        name: 'Buffalo',
        value: energyComparison.buffalo,
        color: COLORS.buffalo
      },
      {
        name: 'Cattle',
        value: energyComparison.cattle,
        color: COLORS.cattle
      }
    ];
    
    // Prepare feed efficiency comparison if available
    const feedEfficiencyData = feedEfficiencyComparison ? [
      {
        name: 'Buffalo',
        value: feedEfficiencyComparison.buffalo,
        color: COLORS.buffalo
      },
      {
        name: 'Cattle',
        value: feedEfficiencyComparison.cattle,
        color: COLORS.cattle
      }
    ] : null;
    
    // Prepare radar chart data for comparing various aspects
    const radarData = [
      {
        subject: 'Roughage Use',
        Buffalo: 9,
        Cattle: 6,
        fullMark: 10
      },
      {
        subject: 'Concentrate Response',
        Buffalo: 6,
        Cattle: 9,
        fullMark: 10
      },
      {
        subject: 'Feed Conversion',
        Buffalo: feedEfficiencyComparison?.ratio > 1 ? 5 : 8,
        Cattle: feedEfficiencyComparison?.ratio > 1 ? 8 : 5,
        fullMark: 10
      },
      {
        subject: 'Energy Efficiency',
        Buffalo: energyComparison.ratio > 1 ? 6 : 8,
        Cattle: energyComparison.ratio > 1 ? 8 : 6,
        fullMark: 10
      },
      {
        subject: 'Digestive Efficiency',
        Buffalo: 8,
        Cattle: 7,
        fullMark: 10
      }
    ];
    
    return (
      <div className="space-y-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Daily Energy Requirements</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={energyData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis label={{ value: 'MJ/day', angle: -90, position: 'insideLeft' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="value" name="Energy Requirement" fill={COLORS.neutral} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 p-3 bg-gray-50 rounded border">
            <p className="text-sm font-medium">Energy Requirement Comparison:</p>
            <p className="text-sm">
              {energyComparison.percentDifference > 0 ? 
                `Buffalo require ${energyComparison.percentDifference}% more energy than equivalent cattle` :
                `Buffalo require ${Math.abs(energyComparison.percentDifference)}% less energy than equivalent cattle`
              }
            </p>
          </div>
        </div>
        
        {feedEfficiencyData && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Feed Conversion Ratio</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={feedEfficiencyData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: 'kg feed/kg gain', angle: -90, position: 'insideLeft' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="value" name="Feed Conversion Ratio" fill={COLORS.neutral} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Lower values indicate better feed conversion efficiency (less feed needed per kg of weight gain)
            </p>
          </div>
        )}
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Feed Utilization Profile</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart outerRadius={90} width={730} height={250} data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 10]} />
                <Radar name="Buffalo" dataKey="Buffalo" stroke={COLORS.buffalo} fill={COLORS.buffalo} fillOpacity={0.6} />
                <Radar name="Cattle" dataKey="Cattle" stroke={COLORS.cattle} fill={COLORS.cattle} fillOpacity={0.6} />
                <Legend />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-sm text-gray-700 mt-3">
            Buffalo generally have better utilization of low-quality roughage and fibrous feeds, while cattle typically respond better to high-energy concentrate feeds. 
            This chart shows relative performance on different feeding metrics (higher values are better).
          </p>
        </div>
      </div>
    );
  };

  // Function to render reproductive performance comparison
  const renderReproductiveComparison = () => {
    if (!comparisonData?.reproductiveComparison) {
      return <div className="text-center py-4">No reproductive comparison data available.</div>;
    }

    const { reproductiveComparison } = comparisonData;
    
    // Prepare data for calving rate improvement chart
    const calvingRateData = [
      {
        name: 'Buffalo',
        value: reproductiveComparison.calvingRateImprovement.buffalo,
        color: COLORS.buffalo
      },
      {
        name: 'Cattle',
        value: reproductiveComparison.calvingRateImprovement.cattle,
        color: COLORS.cattle
      }
    ];
    
    // Prepare data for time to calf improvement chart
    const timeToCalfData = [
      {
        name: 'Buffalo',
        value: reproductiveComparison.timeToCalfImprovement.buffalo,
        color: COLORS.buffalo
      },
      {
        name: 'Cattle',
        value: reproductiveComparison.timeToCalfImprovement.cattle,
        color: COLORS.cattle
      }
    ];
    
    // Simulated reproductive performance over time data
    const reproPerformanceData = Array(10).fill().map((_, index) => {
      const year = index + 1;
      // Buffalo start lower but improve over time
      const buffaloCalvingRate = Math.min(90, buffaloParams.reproductiveInfo.calvingRate + 
                               (reproductiveComparison.calvingRateImprovement.buffalo * (1 - Math.exp(-0.3 * year))));
      
      // Cattle start higher but have less room for improvement
      const cattleCalvingRate = Math.min(95, cattleParams.reproductiveInfo.calvingRate + 
                              (reproductiveComparison.calvingRateImprovement.cattle * (1 - Math.exp(-0.4 * year))));
      
      return {
        year: `Year ${year}`,
        Buffalo: buffaloCalvingRate,
        Cattle: cattleCalvingRate
      };
    });
    
    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Calving Rate Improvement</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={calvingRateData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: 'Percentage Points', angle: -90, position: 'insideLeft' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="value" name="Calving Rate Improvement" fill={COLORS.neutral} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Time to Calf Improvement</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={timeToCalfData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: 'Months Reduced', angle: -90, position: 'insideLeft' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="value" name="Time to Calf Reduction" fill={COLORS.neutral} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Reproductive Performance Over Time</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={reproPerformanceData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis label={{ value: 'Calving Rate (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="Buffalo" stroke={COLORS.buffalo} strokeWidth={2} />
                <Line type="monotone" dataKey="Cattle" stroke={COLORS.cattle} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 p-3 bg-gray-50 rounded border">
            <p className="text-sm font-medium">Reproductive Comparison:</p>
            <p className="text-sm">
              Cattle generally have better initial reproductive performance with shorter calving intervals and higher calving rates.
              However, with proper management, buffalo can show significant improvements over time, especially in tropical environments.
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Function to render environmental impact comparison
  const renderEnvironmentalComparison = () => {
    if (!comparisonData?.environmentalImpactComparison) {
      return <div className="text-center py-4">Loading environmental data...</div>;
    }

    const { environmentalImpactComparison, contextualAdvantages } = comparisonData;
    
    // Prepare data for environmental impact chart
    const environmentalData = [
      {
        name: 'Water Use',
        value: environmentalImpactComparison.waterUse,
        fill: environmentalImpactComparison.waterUse < 1 ? COLORS.positive : COLORS.negative
      },
      {
        name: 'Land Use',
        value: environmentalImpactComparison.landUse,
        fill: environmentalImpactComparison.landUse < 1 ? COLORS.positive : COLORS.negative
      },
      {
        name: 'GHG Emissions',
        value: environmentalImpactComparison.greenhouseGasEmissions,
        fill: environmentalImpactComparison.greenhouseGasEmissions < 1 ? COLORS.positive : COLORS.negative
      }
    ];
    
    return (
      <div className="space-y-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Environmental Impact Ratio (Buffalo:Cattle)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={environmentalData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis label={{ value: 'Ratio (Buffalo:Cattle)', angle: -90, position: 'insideLeft' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="value" name="Impact Ratio" fill={(data) => data.fill} />
                <Line type="monotone" dataKey="value" stroke="#ff7300" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Values less than 1.0 indicate buffalo have lower impact than cattle; values greater than 1.0 indicate higher impact.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Buffalo Advantages</h3>
            <ul className="space-y-2 text-sm">
              {contextualAdvantages.buffalo.map((advantage, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  <span>{advantage}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Cattle Advantages</h3>
            <ul className="space-y-2 text-sm">
              {contextualAdvantages.cattle.map((advantage, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  <span>{advantage}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Environmental Considerations</h3>
          <p className="text-sm text-gray-700">
            The choice between buffalo and cattle should consider local environmental conditions. Buffalo thrive better in hot, humid environments and 
            are particularly well-adapted to wetlands and areas with poor quality feed. Cattle generally perform better in temperate climates with 
            high-quality feed availability.
          </p>
          <p className="text-sm text-gray-700 mt-3">
            Buffalo typically require less water and can utilize poorer quality roughage, making them more suitable for resource-constrained environments.
            However, their longer reproductive cycles can increase lifetime emissions per unit of production.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          {displayOptions.showEmissions && (
            <button
              onClick={() => setActiveTab('emissions')}
              className={`py-2 px-4 text-sm font-medium ${
                activeTab === 'emissions'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent'
              }`}
            >
              Emissions
            </button>
          )}
          
          {displayOptions.showEnergy && (
            <button
              onClick={() => setActiveTab('energy')}
              className={`py-2 px-4 text-sm font-medium ${
                activeTab === 'energy'
                  ? 'border-b-2 border-yellow-500 text-yellow-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent'
              }`}
            >
              Energy & Feed
            </button>
          )}
          
          {displayOptions.showReproduction && (
            <button
              onClick={() => setActiveTab('reproduction')}
              className={`py-2 px-4 text-sm font-medium ${
                activeTab === 'reproduction'
                  ? 'border-b-2 border-purple-500 text-purple-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent'
              }`}
            >
              Reproduction
            </button>
          )}
          
          {displayOptions.showEnvironmental && (
            <button
              onClick={() => setActiveTab('environmental')}
              className={`py-2 px-4 text-sm font-medium ${
                activeTab === 'environmental'
                  ? 'border-b-2 border-green-500 text-green-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent'
              }`}
            >
              Environmental
            </button>
          )}
        </nav>
      </div>

      {/* Tab content */}
      <div className="mt-4">
        {!comparisonData ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Calculating species comparison data...</p>
          </div>
        ) : (
          <>
            {activeTab === 'emissions' && renderEmissionsComparison()}
            {activeTab === 'energy' && renderEnergyComparison()}
            {activeTab === 'reproduction' && renderReproductiveComparison()}
            {activeTab === 'environmental' && renderEnvironmentalComparison()}
          </>
        )}
      </div>
    </div>
  );
};

export default SpeciesComparisonVisualizer;