import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '../../ui/chart';
import Card from '../../common/Card';

const FeeTypeChart = ({ data, title = "Fee Type Analysis" }) => {
  const chartConfig = {
    totalAmount: {
      label: "Total Amount",
      color: "hsl(221.2 83.2% 53.3%)",
    },
    collectedAmount: {
      label: "Collected",
      color: "hsl(142.1 76.2% 36.3%)",
    },
    outstandingAmount: {
      label: "Outstanding",
      color: "hsl(24.6 95% 53.1%)",
    },
  };

  // Transform data for the chart
  const chartData = data?.revenueBreakdown?.map(item => ({
    feeType: item.feeType?.length > 15 ? item.feeType.substring(0, 15) + '...' : item.feeType,
    totalAmount: item.totalAmount || 0,
    collectedAmount: item.collectedAmount || 0,
    outstandingAmount: item.outstandingAmount || 0,
  })) || [];

  return (
    <Card>
      <Card.Header>
        <Card.Title>{title}</Card.Title>
      </Card.Header>
      <div className="p-6">
        <ChartContainer config={chartConfig} className="h-[350px]">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="feeType" 
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              angle={-45}
              textAnchor="end"
              height={80}
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
                  className="w-[200px]"
                  labelFormatter={(value) => `Fee Type: ${value}`}
                />
              } 
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="totalAmount"
              fill="var(--color-totalAmount)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="collectedAmount"
              fill="var(--color-collectedAmount)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="outstandingAmount"
              fill="var(--color-outstandingAmount)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </div>
    </Card>
  );
};

export default FeeTypeChart;
