import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

const NetworkActivityChart = ({ data = [], height = 300 }) => {
  // Default data if none provided
  const defaultData = [
    { time: '00:00', requests: 120, bandwidth: 45 },
    { time: '04:00', requests: 80, bandwidth: 30 },
    { time: '08:00', requests: 350, bandwidth: 120 },
    { time: '12:00', requests: 450, bandwidth: 180 },
    { time: '16:00', requests: 380, bandwidth: 150 },
    { time: '20:00', requests: 280, bandwidth: 90 },
    { time: '24:00', requests: 150, bandwidth: 60 },
  ];

  const chartData = data.length > 0 ? data : defaultData;

  // Custom green colors based on HSL(89.3, 80.4%, %)
  const colors = {
    primary: 'hsl(89.3, 80.4%, 35%)', // green-600
    secondary: 'hsl(89.3, 80.4%, 25%)', // green-700
    light: 'hsl(89.3, 80.4%, 85%)', // green-100
    grid: 'hsl(89.3, 80.4%, 90%)', // lighter grid
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">{`Time: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.dataKey === 'requests' ? 'Requests' : 'Bandwidth (MB)'}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="w-full"
    >
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="requestsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors.primary} stopOpacity={0.8} />
              <stop offset="95%" stopColor={colors.primary} stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="bandwidthGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors.secondary} stopOpacity={0.8} />
              <stop offset="95%" stopColor={colors.secondary} stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
          <XAxis 
            dataKey="time" 
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
          <Area
            type="monotone"
            dataKey="requests"
            stroke={colors.primary}
            fillOpacity={1}
            fill="url(#requestsGradient)"
            strokeWidth={2}
            animationDuration={1500}
          />
          <Area
            type="monotone"
            dataKey="bandwidth"
            stroke={colors.secondary}
            fillOpacity={1}
            fill="url(#bandwidthGradient)"
            strokeWidth={2}
            animationDuration={1500}
            animationDelay={300}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

export default NetworkActivityChart;
