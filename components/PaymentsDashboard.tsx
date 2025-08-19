

import React from 'react';
import { Loader2 } from 'lucide-react';
import { PaymentsDashboardData, NameValueData } from '../types';
import DeliveredVsReturnsBarChart from './charts/DeliveredVsReturnsBarChart';
import DeliveredVsReturnsPieChart from './charts/DeliveredVsReturnsPieChart';
import KpiCard from './KpiCard';
import UnitEconomicsTable from './charts/UnitEconomicsTable';
import TopSkusChart from './charts/TopSkusChart';
import PaginatedDataTable from './PaginatedDataTable';
import DataTable from './DataTable';

interface DashboardProps {
  data: PaymentsDashboardData | null;
}

const ChartCard: React.FC<{title: string, children: React.ReactNode, className?: string, fullHeight?: boolean}> = ({ title, children, className, fullHeight }) => (
    <div className={`bg-white p-4 sm:p-6 rounded-xl shadow-sm ${className}`}>
        <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">{title}</h3>
        <div className={`${fullHeight ? 'h-full' : 'h-80'}`}>
            {children}
        </div>
    </div>
);

const PaymentsDashboard: React.FC<DashboardProps> = ({ data }) => {
    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <Loader2 className="w-16 h-16 animate-spin text-green-500" />
                <p className="mt-4 text-lg font-medium text-gray-700">Waiting for data...</p>
            </div>
        );
    }
    
    if (!data.hasData) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-50 p-8">
                <div className="text-center bg-white p-10 rounded-xl shadow-md">
                    <h2 className="text-2xl font-bold text-gray-700 mb-2">Payment Data Required</h2>
                    <p className="text-gray-500">Please upload your 'Payments' file to see profit and loss analysis.</p>
                </div>
            </div>
        );
    }
    
    if (data.allPayments && data.allPayments.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-50 p-8">
                <div className="text-center bg-white p-10 rounded-xl shadow-md">
                    <h2 className="text-2xl font-bold text-gray-700 mb-2">No Data Found For Filters</h2>
                    <p className="text-gray-500">No payment data matches your current filter selection. Try adjusting your filters.</p>
                </div>
            </div>
        )
    }

    const {
        orderOverview, earningsOverview, unitEconomics, 
        dailyDeliveredVsReturns, deliveredVsReturnPie,
        topDeliveredSkus, topReturnedSkus,
        skuProfitData, skuLossData, keywordDistribution,
        allPayments
    } = data;
    
    const paymentColumns = [
        { key: 'orderDate', header: 'Date' },
        { key: 'orderId', header: 'Order ID' },
        { key: 'sku', header: 'SKU' },
        { key: 'status', header: 'Status' },
        { key: 'invoicePrice', header: 'Invoice Price' },
        { key: 'finalPayment', header: 'Settlement' },
        { key: 'returnCost', header: 'Return Cost' },
        { key: 'claimAmount', header: 'Claim' },
        { key: 'recovery', header: 'Recovery' },
        { key: 'tds', header: 'TDS' },
        { key: 'tcs', header: 'TCS' },
    ];

    return (
        <div className="space-y-6">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <KpiCard title="Order Overview (from Payments File)" items={orderOverview} />
                <KpiCard title="Earnings Overview" items={earningsOverview} />
             </div>
             
             <div className="grid grid-cols-1">
                 <ChartCard title="Unit Economics (Based on Delivered Orders)">
                    <UnitEconomicsTable data={unitEconomics} />
                 </ChartCard>
             </div>
            
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ChartCard title="Top 10 SKUs by Delivery">
                    <TopSkusChart data={topDeliveredSkus} showLabelInside />
                </ChartCard>
                 <ChartCard title="Top 10 SKUs by Returns">
                    <TopSkusChart data={topReturnedSkus} showLabelInside />
                </ChartCard>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PaginatedDataTable title="SKU Wise Profit" data={skuProfitData} />
                <PaginatedDataTable title="SKU Wise Loss" data={skuLossData} />
             </div>
             
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <ChartCard title="Daily Delivered vs Returns Trend">
                        <DeliveredVsReturnsBarChart data={dailyDeliveredVsReturns}/>
                    </ChartCard>
                </div>
                <ChartCard title="Delivered vs Returns Ratio">
                    <DeliveredVsReturnsPieChart data={deliveredVsReturnPie} />
                </ChartCard>
             </div>
             
             <ChartCard title="Top Keywords by Delivered Orders">
                <TopSkusChart data={keywordDistribution} />
             </ChartCard>

             <DataTable 
                data={allPayments} 
                columns={paymentColumns}
                title="All Payments Data"
                description="A detailed view of all entries from your uploaded Payments file that match the current filters."
            />
        </div>
    );
};

export default React.memo(PaymentsDashboard);