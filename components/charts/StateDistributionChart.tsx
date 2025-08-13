import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { StateDistributionData } from '../../types';

interface ChartProps {
  data: StateDistributionData[];
}

const StateDistributionChart: React.FC<ChartProps> = ({ data }) => {
  const tickColor = '#475569';
  const gridColor = '#e5e7eb';
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart 
        data={data} 
        layout="vertical" 
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridColor}/>
        <XAxis type="number" tick={{ fontSize: 10, fill: tickColor }} />
        <YAxis 
            dataKey="state" 
            type="category" 
            axisLine={false} 
            tickLine={false} 
            width={100} 
            tick={{fontSize: 10, fill: tickColor}}
            interval={0}
        />
        <Tooltip 
            cursor={{fill: 'rgba(243, 244, 246, 0.5)'}}
            contentStyle={{
                backgroundColor: '#ffffff',
                borderColor: '#e5e7eb',
            }}
        />
        <Bar dataKey="count" fill="#3b82f6" barSize={20} radius={[0, 4, 4, 0]}/>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default StateDistributionChart;
