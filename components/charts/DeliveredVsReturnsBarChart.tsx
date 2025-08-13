
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { NameValueData } from '../../types';

interface ChartProps {
  data: NameValueData[];
}

const DeliveredVsReturnsBarChart: React.FC<ChartProps> = ({ data }) => {
  const tickColor = '#475569';
  const gridColor = '#e5e7eb';
  const legendColor = '#334155';
  const COLORS = { delivered: '#22c55e', return: '#ef4444' };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor}/>
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: tickColor }} tickLine={false} axisLine={{ stroke: gridColor }} />
        <YAxis tick={{ fontSize: 10, fill: tickColor }} tickLine={false} axisLine={{ stroke: gridColor }} />
        <Tooltip 
           cursor={{fill: 'rgba(226, 232, 240, 0.4)'}}
           contentStyle={{
              backgroundColor: '#ffffff',
              borderColor: '#e2e8f0',
              borderRadius: '0.5rem',
          }}
        />
        <Legend wrapperStyle={{fontSize: "12px", color: legendColor, paddingTop: '10px'}} iconType="circle" iconSize={8} />
        <Bar dataKey="Delivered" fill={COLORS.delivered} barSize={10} radius={[4, 4, 0, 0]} />
        <Bar dataKey="Return" fill={COLORS.return} barSize={10} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default DeliveredVsReturnsBarChart;
