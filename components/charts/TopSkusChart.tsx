

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { NameValueData } from '../../types';

interface ChartProps {
  data: NameValueData[];
  onBarClick?: (sku: string) => void;
  showLabelInside?: boolean;
}

// Custom shape for horizontal bar chart with rounded corners on one side
const RoundedBar = (props: any) => {
  const { fill, x, y, width, height } = props;
  const radius = height / 2;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={radius} ry={radius} fill={fill} />
    </g>
  );
};

const TopSkusChart: React.FC<ChartProps> = ({ data, onBarClick, showLabelInside = false }) => {
  const tickColor = '#475569';
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart 
        data={data} 
        layout="vertical" 
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
          <defs>
            <linearGradient id="colorRed" x1="0" y1="0" x2="1" y2="0">
              <stop offset="5%" stopColor="#fee2e2" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.8}/>
            </linearGradient>
          </defs>
          <XAxis type="number" hide />
          <YAxis 
              dataKey="name" 
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
          <Bar 
            dataKey="value" 
            name="Quantity" 
            fill="url(#colorRed)" 
            barSize={20} 
            shape={<RoundedBar />} 
            onClick={(data) => onBarClick && data && onBarClick(data.name)}
            style={{ cursor: onBarClick ? 'pointer' : 'default' }}
            >
            {showLabelInside && <LabelList dataKey="value" position="insideRight" fill="#fff" fontSize={10} fontWeight="bold" />}
          </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default TopSkusChart;