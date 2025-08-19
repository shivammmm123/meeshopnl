

import React from 'react';
import { OrdersDashboardData } from '../types';
import OrderStatusPieChart from './charts/OrderStatusPieChart';
import StateDistributionChart from './charts/StateDistributionChart';
import KpiCard from './KpiCard';
import DataTable from './DataTable';
import TopSkusChart from './charts/TopSkusChart';

interface DashboardProps {
  data: OrdersDashboardData | null;
}

const ChartCard: React.FC<{title: string, children: React.ReactNode, className?: string}> = ({ title, children, className }) => (
    <div className={`bg-white p-4 sm:p-6 rounded-xl shadow-sm ${className}`}>
        <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">{title}</h3>
        <div className="h-80">
            {children}
        </div>
    </div>
);

const OrdersDashboard: React.FC<DashboardProps> = ({ data }) => {
    if (!data) return <p>Loading data...</p>;
    
    if (!data.hasData) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-50 p-8">
                <div className="text-center bg-white p-10 rounded-xl shadow-md">
                    <h2 className="text-2xl font-bold text-gray-700 mb-2">Orders Data Required</h2>
                    <p className="text-gray-500">Please upload your 'Orders' file to analyze order statuses and trends.</p>
                </div>
            </div>
        );
    }

    const { orderOverview, orderStatusDistribution, stateDistribution, topSkus, allOrders } = data;
    
    const orderColumns = [
      { key: 'orderId', header: 'Order ID' },
      { key: 'sku', header: 'SKU' },
      { key: 'status', header: 'Status' },
      { key: 'state', header: 'State' },
      { key: 'size', header: 'Size' },
    ];

    return (
        <div className="space-y-6">
            <KpiCard title="Order Overview" items={orderOverview} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <ChartCard title="Order Status">
                    <OrderStatusPieChart data={orderStatusDistribution} />
                </ChartCard>
                <ChartCard title="Top 10 States by Order Volume">
                    <StateDistributionChart data={stateDistribution} />
                </ChartCard>
                 <ChartCard title="Top SKUs by Volume">
                    <TopSkusChart data={topSkus} />
                </ChartCard>
            </div>
            <div>
                {allOrders && (
                    <DataTable 
                        data={allOrders} 
                        columns={orderColumns}
                        title="All Orders Data"
                        description="A detailed view of all entries from your uploaded Orders file."
                    />
                )}
            </div>
        </div>
    );
};

export default React.memo(OrdersDashboard);