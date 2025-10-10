import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../../ui/chart';
import Card from '../../common/Card';

const CollectionTrendChart = ({ data, title = "Collection Trend" }) => {
  const chartConfig = {
    collections: {
      label: "Collections",
      color: "hsl(142.1 76.2% 36.3%)",
    },
    cumulative: {
      label: "Cumulative",
      color: "hsl(221.2 83.2% 53.3%)",
    },
  };

  // Transform data for the chart with cumulative calculation
  let cumulative = 0;
  const chartData = data?.dailyCollections?.map(item => {
    cumulative += item.amount || 0;
    return {
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      collections: item.amount || 0,
      cumulative: cumulative,
      transactions: item.transactionCount || 0,
    };
  }) || [];

  return (
    <Card>
      <Card.Header>
        <Card.Title>{title}</Card.Title>
        <div className="text-sm text-gray-600">
          Daily collections with cumulative total
        </div>
      </Card.Header>
      <div className="p-3 lg:p-6">
        <ChartContainer config={chartConfig} className="h-[250px] lg:h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCollections" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-collections)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="var(--color-collections)" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-cumulative)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="var(--color-cumulative)" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
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
                  className="w-[180px] lg:w-[200px]"
                  labelFormatter={(value) => `Date: ${value}`}
                  formatter={(value, name, props) => {
                    if (name === 'collections') {
                      return [
                        `$${value.toLocaleString()}`,
                        `Daily Collections (${props.payload.transactions} transactions)`
                      ];
                    }
                    return [`$${value.toLocaleString()}`, 'Cumulative Total'];
                  }}
                />
              } 
            />
            <Area
              type="monotone"
              dataKey="collections"
              stroke="var(--color-collections)"
              fillOpacity={1}
              fill="url(#colorCollections)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="cumulative"
              stroke="var(--color-cumulative)"
              fillOpacity={1}
              fill="url(#colorCumulative)"
              strokeWidth={2}
            />
          </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </Card>
  );
};

export default CollectionTrendChart;
