import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { motion } from 'framer-motion';

const UserGrowthChart = ({ data = [], type = 'bar', height = 300 }) => {
  // Default data if none provided
  const defaultData = [
    { month: 'Jan', students: 120, teachers: 15, total: 135 },
    { month: 'Feb', students: 145, teachers: 18, total: 163 },
    { month: 'Mar', students: 180, teachers: 22, total: 202 },
    { month: 'Apr', students: 210, teachers: 25, total: 235 },
    { month: 'May', students: 250, teachers: 28, total: 278 },
    { month: 'Jun', students: 290, teachers: 32, total: 322 },
  ];

  const chartData = data.length > 0 ? data : defaultData;

  // Custom green colors based on HSL(89.3, 80.4%, %)
  const colors = {
    primary: 'hsl(89.3, 80.4%, 35%)', // green-600
    secondary: 'hsl(89.3, 80.4%, 55%)', // green-400
    tertiary: 'hsl(89.3, 80.4%, 25%)', // green-700
    grid: 'hsl(89.3, 80.4%, 90%)', // lighter grid
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">{`Month: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm capitalize" style={{ color: entry.color }}>
              {`${entry.dataKey}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const BarChartComponent = () => (
    <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
      <XAxis 
        dataKey="month" 
        axisLine={false}
        tickLine={false}
        tick={{ fontSize: 12, fill: '#6B7280' }}
      />
      <YAxis 
        axisLine={false}
        tickLine={false}
        tick={{ fontSize: 12, fill: '#6B7280' }}
      />
      <Tooltip content={<CustomTooltip />} />
      <Bar 
        dataKey="students" 
        fill={colors.primary} 
        radius={[2, 2, 0, 0]}
        animationDuration={1000}
      />
      <Bar 
        dataKey="teachers" 
        fill={colors.secondary} 
        radius={[2, 2, 0, 0]}
        animationDuration={1000}
        animationDelay={200}
      />
    </BarChart>
  );

  const LineChartComponent = () => (
    <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
      <XAxis 
        dataKey="month" 
        axisLine={false}
        tickLine={false}
        tick={{ fontSize: 12, fill: '#6B7280' }}
      />
      <YAxis 
        axisLine={false}
        tickLine={false}
        tick={{ fontSize: 12, fill: '#6B7280' }}
      />
      <Tooltip content={<CustomTooltip />} />
      <Line 
        type="monotone" 
        dataKey="total" 
        stroke={colors.primary} 
        strokeWidth={3}
        dot={{ fill: colors.primary, strokeWidth: 2, r: 4 }}
        activeDot={{ r: 6, fill: colors.tertiary }}
        animationDuration={1500}
      />
      <Line 
        type="monotone" 
        dataKey="students" 
        stroke={colors.secondary} 
        strokeWidth={2}
        dot={{ fill: colors.secondary, strokeWidth: 2, r: 3 }}
        strokeDasharray="5 5"
        animationDuration={1500}
        animationDelay={300}
      />
    </LineChart>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="w-full"
    >
      <ResponsiveContainer width="100%" height={height}>
        {type === 'bar' ? <BarChartComponent /> : <LineChartComponent />}
      </ResponsiveContainer>
    </motion.div>
  );
};

export default UserGrowthChart;
