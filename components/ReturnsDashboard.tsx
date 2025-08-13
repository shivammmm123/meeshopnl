
import React from 'react';
import { ReturnsDashboardData } from '../types';
import ReturnReasonsChart from './charts/ReturnReasonsChart';
import TopReturnedSkusChart from './charts/TopReturnedSkusChart';
import DataTable from './DataTable';

interface ReturnsDashboardProps {
  data: ReturnsDashboardData | null;
}

const ChartCard: React.FC<{title: string, children: React.ReactNode, className?: string}> = ({ title, children, className }) => (
    <div className={`bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-gray-200 ${className}`}>
        <h2 className="text-lg font-bold text-gray-800 mb-4">{title}</h2>
        <div className="h-96">
            {children}
        </div>
    </div>
);

const ReturnsDashboard: React.FC<ReturnsDashboardProps> = ({ data }) => {
    if (!data || !data.hasData) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-50 p-8">
                <div className="text-center bg-white p-10 rounded-xl shadow-md">
                    <h2 className="text-2xl font-bold text-gray-700 mb-2">Returns Data Required</h2>
                    <p className="text-gray-500">Please upload your 'Returns' file to analyze return reasons and trends.</p>
                </div>
            </div>
        );
    }
  
  const returnColumns = [
    { key: 'orderId', header: 'Order ID' },
    { key: 'sku', header: 'SKU' },
    { key: 'returnType', header: 'Return Type' },
    { key: 'returnReason', header: 'Reason' },
    { key: 'subReason', header: 'Sub Reason' },
  ];

  return (
    <div className="space-y-8">
       <header>
            <h1 className="text-4xl font-bold text-gray-800">Returns Analysis</h1>
            <p className="text-md text-gray-500 mt-1">Understand why products are returned and identify key trends.</p>
        </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <ChartCard title="Top Reasons for Return">
            <ReturnReasonsChart data={data.returnReasons} />
          </ChartCard>
        </div>
        <div className="lg:col-span-2">
           <ChartCard title="Most Returned SKUs">
            <TopReturnedSkusChart data={data.topReturnedSkus} />
           </ChartCard>
        </div>
      </div>
      
      <div>
        <DataTable
          data={data.allReturns || []}
          columns={returnColumns}
          title="All Returns Data"
          description="A detailed view of all entries from your uploaded Returns file."
        />
      </div>
    </div>
  );
};

export default ReturnsDashboard;
