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
      <div className="p-3 lg:p-6">
        <ChartContainer config={chartConfig} className="h-[250px] lg:h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
              interval="preserveStartEnd"
            />
            <YAxis 
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
              tickFormatter={(value) => `$${value.toLocaleString()}`}
            />
            <ChartTooltip 
              content={
                <ChartTooltipContent 
                  className="w-[130px] lg:w-[150px]"
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
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </Card>
  );
};

export default RevenueChart;
