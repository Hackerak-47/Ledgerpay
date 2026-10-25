import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface ActivityChartProps {
  data: {
    day: string;
    incoming: number;
    outgoing: number;
  }[];
}

export const ActivityChart: React.FC<ActivityChartProps> = ({ data }) => {
  return (
    <div className="w-full h-52">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          barGap={4}
        >
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: '#667085' }}
            axisLine={{ stroke: '#DFE3E8' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#667085' }}
            axisLine={{ stroke: '#DFE3E8' }}
            tickLine={false}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              borderColor: '#DFE3E8',
              borderRadius: '4px',
              fontSize: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            }}
            formatter={(value: number) => [
              new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value),
            ]}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }}
          />
          <Bar
            name="Incoming"
            dataKey="incoming"
            fill="#218568"
            radius={[2, 2, 0, 0]}
            maxBarSize={20}
          />
          <Bar
            name="Outgoing"
            dataKey="outgoing"
            fill="#344563"
            radius={[2, 2, 0, 0]}
            maxBarSize={20}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
