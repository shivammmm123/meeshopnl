
import React from 'react';
import { Loader2 } from 'lucide-react';
import { PaymentsDashboardData } from '../types';
import DeliveredVsReturnsBarChart from './charts/DeliveredVsReturnsBarChart';
import UnitEconomicsTable from './charts/UnitEconomicsTable';
import DeliveredVsRtoPieChart from './charts/DeliveredVsRtoPieChart';
import KpiCard from './KpiCard';

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
        orderOverview,
        earningsOverview, 
        dailyDeliveredVsReturns,
        unitEconomics, 
        deliveredVsRtoPie
    } = data;

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
                <ChartCard title="Delivered vs Returns Trend (from Payments)">
                    <DeliveredVsReturnsBarChart data={dailyDeliveredVsReturns}/>
                </ChartCard>
                <ChartCard title="Order Breakdown (from Payments)">
                    <DeliveredVsRtoPieChart data={deliveredVsRtoPie} />
                </ChartCard>
             </div>
        </div>
    );
};

export default PaymentsDashboard;
