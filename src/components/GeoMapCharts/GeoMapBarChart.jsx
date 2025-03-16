import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const GeoMapBarChart = ({ data, onClose }) => {
  // Define custom colors for the bars
  const barColors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  // Custom tooltip to display value with commas
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const value = payload[0].value.toLocaleString(); // Format value with commas
      return (
        <div className="custom-tooltip" style={{ backgroundColor: '#f9f9f9', padding: '10px', border: '1px solid #ccc' }}>
          <p className="label" style={{ fontWeight: 'bold' }}>{`${label}`}</p>
          <p className="intro">{`${payload[0].name}: ${value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: 400 }}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis tickFormatter={(value) => value.toLocaleString()} /> {/* Format Y-axis values with commas */}
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {data.map((entry, index) => (
            <Bar key={`bar-${index}`} dataKey="value" fill={barColors[index % barColors.length]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GeoMapBarChart;