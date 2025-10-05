import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../../ui/chart';
import Card from '../../common/Card';

const RevenueChart = ({ data, title = "Revenue Trend" }) => {
  const chartConfig = {
    revenue: {
      label: "Revenue",
      color: "hsl(221.2 83.2% 53.3%)",
    },
    collections: {
      label: "Collections", 
      color: "hsl(142.1 76.2% 36.3%)",
    },
  };

  // Transform data for the chart
  const chartData = data?.dailyCollections?.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    revenue: item.amount || 0,
    collections: item.amount || 0,
  })) || [];

  return (
    <Card>
      <Card.Header>
        <Card.Title>{title}</Card.Title>
      </Card.Header>
      <div className="p-6">
        <ChartContainer config={chartConfig} className="h-[300px]">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis 
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `$${value.toLocaleString()}`}
            />
            <ChartTooltip 
              content={
                <ChartTooltipContent 
                  className="w-[150px]"
                  nameKey="revenue"
                  labelFormatter={(value) => `Date: ${value}`}
                />
              } 
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="var(--color-revenue)"
              strokeWidth={2}
              dot={{ fill: "var(--color-revenue)", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ChartContainer>
      </div>
    </Card>
  );
};

export default RevenueChart;
