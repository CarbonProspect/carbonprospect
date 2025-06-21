import React from 'react';
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

// Helper function to format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    maximumFractionDigits: 0 
  }).format(value);
};

// Enhanced CashFlow Chart Component
export const CashFlowChart = ({ data }) => {
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

// NPV Chart Component with enhanced styling
export const NPVChart = ({ data }) => {
  if (!data || data.length === 0) return <div className="p-4 text-gray-500">No data available</div>;
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data}
        margin={{ top: 20, right: 50, left: 50, bottom: 20 }}>
        <defs>
          <linearGradient id="colorNpv" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
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
          label={{ value: 'NPV ($)', angle: -90, position: 'insideLeft' }}
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
          dataKey="discountedCashFlow" 
          name="Discounted Cash Flow" 
          fill="#8884d8" 
          fillOpacity={0.7}
          barSize={20}
          radius={[4, 4, 0, 0]}
        />
        <Area
          type="monotone"
          dataKey="cumulativeNpv"
          name="Cumulative NPV"
          stroke="#ff7300"
          strokeWidth={2}
          fillOpacity={0.3}
          fill="url(#colorNpv)"
        />
        <ReferenceLine y={0} stroke="#000" strokeDasharray="3 3" />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

// Cost Breakdown Chart Component with enhanced styling
export const CostBreakdownChart = ({ data }) => {
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