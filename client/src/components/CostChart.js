import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { Box, Typography } from '@mui/material';

const CostChart = ({ data }) => {
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
    date: item._id,
    cost: item.total,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#1976d2" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#1976d2" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => {
            const date = new Date(value);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          }}
        />
        <YAxis
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => `$${value.toFixed(0)}`}
        />
        <Tooltip
          formatter={(value) => [`$${value.toFixed(2)}`, 'Cost']}
          labelFormatter={(label) => `Date: ${label}`}
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
          }}
        />
        <Area
          type="monotone"
          dataKey="cost"
          stroke="#1976d2"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorCost)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default CostChart;
