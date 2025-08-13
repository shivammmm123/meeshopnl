
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { NameValueData } from '../../types';

interface ChartProps {
  data: NameValueData[];
}

const RoundedBar = (props: any) => {
  const { fill, x, y, width, height } = props;
  const radius = height / 2;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={radius} ry={radius} fill={fill} />
    </g>
  );
};

const TopReturnedSkusChart: React.FC<ChartProps> = ({ data }) => {
  const tickColor = '#475569';

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart 
        data={data} 
        layout="vertical" 
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
          <defs>
            <linearGradient id="colorReturn" x1="0" y1="0" x2="1" y2="0">
              <stop offset="5%" stopColor="#fecaca" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#b91c1c" stopOpacity={0.8}/>
            </linearGradient>
          </defs>
          <XAxis type="number" hide />
          <YAxis 
              dataKey="name" 
              type="category" 
              axisLine={false} 
              tickLine={false} 
              width={120} 
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
          <Bar dataKey="value" name="Count" fill="url(#colorReturn)" barSize={20} shape={<RoundedBar />} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default TopReturnedSkusChart;
