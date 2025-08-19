import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { NameValueData } from '../../types';

interface ChartProps {
  data: NameValueData[];
}

const DeliveredVsReturnsPieChart: React.FC<ChartProps> = ({ data }) => {
    const COLORS = ['#22c55e', '#ef4444'];
    
    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie 
                    data={data} 
                    dataKey="value" 
                    nameKey="name" 
                    cx="50%" 
                    cy="50%" 
                    outerRadius={80} 
                    label={(entry) => `${((entry.percent || 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                >
                    {data.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip 
                    contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e5e7eb',
                    }}
                />
                <Legend iconType="circle" iconSize={8} />
            </PieChart>
        </ResponsiveContainer>
    );
};

export default DeliveredVsReturnsPieChart;
