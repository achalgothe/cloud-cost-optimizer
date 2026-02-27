import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Box, Typography } from '@mui/material';

const COLORS = ['#1976d2', '#9c27b0', '#ff9800', '#4caf50', '#f44336', '#00bcd4'];

const ProviderBreakdown = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <Box
        sx={{
          height: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography color="text.secondary">No data available</Typography>
      </Box>
    );
  }

  const chartData = data.map((item) => ({
    name: item._id?.toUpperCase(),
    value: item.total,
    count: item.count,
  }));

  const total = chartData.reduce((acc, item) => acc + item.value, 0);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) =>
            `${name}: ${(percent * 100).toFixed(0)}%`
          }
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name, props) => [
            `$${value.toFixed(2)}`,
            props.payload.name,
          ]}
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
          }}
        />
        <Legend
          formatter={(value, entry) => {
            const percentage = ((entry.payload.value / total) * 100).toFixed(1);
            return `${value} (${percentage}%)`;
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default ProviderBreakdown;
