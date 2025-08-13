import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { NameValueData } from '../../types';

interface ChartProps {
  data: NameValueData[];
  theme?: 'light' | 'dark';
}

const DeliveredVsReturnsPieChart: React.FC<ChartProps> = ({ data }) => {
    const COLORS = { delivered: '#22c55e', return: '#ef4444' };
    
    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    <Cell key="cell-0" fill={COLORS.delivered} />
                    <Cell key="cell-1" fill={COLORS.return} />
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