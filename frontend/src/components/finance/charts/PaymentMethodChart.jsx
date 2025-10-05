import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '../../ui/chart';
import Card from '../../common/Card';

const PaymentMethodChart = ({ data, title = "Payment Methods Distribution" }) => {
  const chartConfig = {
    cash: {
      label: "Cash",
      color: "hsl(142.1 76.2% 36.3%)",
    },
    bank_transfer: {
      label: "Bank Transfer",
      color: "hsl(221.2 83.2% 53.3%)",
    },
    mobile_money: {
      label: "Mobile Money",
      color: "hsl(24.6 95% 53.1%)",
    },
    card: {
      label: "Card",
      color: "hsl(262.1 83.3% 57.8%)",
    },
    cheque: {
      label: "Cheque",
      color: "hsl(173.4 58.9% 39.1%)",
    },
  };

  // Transform data for the chart
  const chartData = data?.feeAnalysis?.paymentMethodBreakdown?.map((item, index) => ({
    name: item.paymentMethod?.replace('_', ' ') || 'Unknown',
    value: item.totalAmount || 0,
    percentage: item.percentage || 0,
    transactions: item.transactionCount || 0,
    fill: Object.values(chartConfig)[index % Object.values(chartConfig).length]?.color || "hsl(0 0% 50%)",
  })) || [];

  const totalAmount = chartData.reduce((sum, item) => sum + item.value, 0);

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null; // Don't show labels for slices less than 5%
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card>
      <Card.Header>
        <Card.Title>{title}</Card.Title>
        <div className="text-sm text-gray-600">
          Total: ${totalAmount.toLocaleString()}
        </div>
      </Card.Header>
      <div className="p-6">
        <ChartContainer config={chartConfig} className="h-[350px]">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <ChartTooltip 
              content={
                <ChartTooltipContent 
                  className="w-[200px]"
                  labelFormatter={(value) => `Payment Method: ${value}`}
                  formatter={(value, name, props) => [
                    `$${value.toLocaleString()}`,
                    name
                  ]}
                />
              } 
            />
            <ChartLegend 
              content={<ChartLegendContent />}
              verticalAlign="bottom"
              height={36}
            />
          </PieChart>
        </ChartContainer>
        
        {/* Summary below chart */}
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.fill }}
                />
                <span className="font-medium">{item.name}</span>
              </div>
              <div className="text-right">
                <div className="font-semibold">${item.value.toLocaleString()}</div>
                <div className="text-xs text-gray-500">{item.transactions} transactions</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default PaymentMethodChart;
