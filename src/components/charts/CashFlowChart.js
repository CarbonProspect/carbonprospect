// CashFlowChart.js - Fixed SVG fill warning issues
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CashFlowChart = ({ data }) => {
  // Sample data if not provided
  const sampleData = [
    { month: 'Jan', revenue: 10000, expenses: 8000, profit: 2000 },
    { month: 'Feb', revenue: 12000, expenses: 9000, profit: 3000 },
    { month: 'Mar', revenue: 11000, expenses: 8500, profit: 2500 },
    { month: 'Apr', revenue: 13000, expenses: 9500, profit: 3500 },
    { month: 'May', revenue: 14000, expenses: 10000, profit: 4000 },
    { month: 'Jun', revenue: 16000, expenses: 11000, profit: 5000 },
  ];

  const chartData = data || sampleData;

  // Custom formatter for tooltip
  const formatCurrency = (value) => {
    return `$${value.toLocaleString()}`;
  };

  // Custom dot component to avoid SVG fill warnings
  const CustomDot = (props) => {
    const { cx, cy, stroke } = props;
    return (
      <circle cx={cx} cy={cy} r={4} stroke={stroke} strokeWidth={1} />
    );
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Cash Flow Analysis</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={formatCurrency} />
            <Tooltip 
              formatter={(value) => formatCurrency(value)}
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
              labelStyle={{ color: '#333', fontWeight: 'bold' }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke="#38a169"
              strokeWidth={2}
              dot={<CustomDot />}
              activeDot={{ r: 6, strokeWidth: 1 }}
              isAnimationActive={true}
            />
            <Line
              type="monotone"
              dataKey="expenses"
              name="Expenses"
              stroke="#e53e3e"
              strokeWidth={2}
              dot={<CustomDot />}
              activeDot={{ r: 6, strokeWidth: 1 }}
              isAnimationActive={true}
            />
            <Line
              type="monotone"
              dataKey="profit"
              name="Profit"
              stroke="#3182ce"
              strokeWidth={2}
              dot={<CustomDot />}
              activeDot={{ r: 6, strokeWidth: 1 }}
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CashFlowChart;