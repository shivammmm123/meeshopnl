import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { NameValueData } from '../../types';

interface ChartProps {
  data: NameValueData[];
  theme?: 'light' | 'dark';
}

const OrderStatusPieChart: React.FC<ChartProps> = ({ data }) => {
  
  const COLORS = ['#22c55e', '#ef4444', '#3b82f6', '#f97316', '#8b5cf6', '#6b7280'];

  return (
    <ResponsiveContainer width="100%" height="100%">
        <PieChart>
            <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
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

export default OrderStatusPieChart;