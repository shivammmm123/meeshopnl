

import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Package, RotateCcw, TrendingUp, TrendingDown, DollarSign, Box, XCircle, Truck, Repeat, Loader2, Info, AlertTriangle, Target, LayoutDashboard, Menu } from 'lucide-react';
import { AllDashboardsData, FilterContextData, FilterState, KpiData, RawOrderEntry, FilesData, SkuPrices, SkuDrilldownData, NameValueData, StateDistributionData, ReturnsDashboardData, OrdersDashboardData, RawReturnEntry } from '../types';

import { calculateSkuDrilldown } from '../utils/dataProcessor';
import SkuDrilldownModal from './SkuDrilldownModal';
import DashboardFilters from './DashboardFilters';
import DataTable from './DataTable';
import OrderStatusPieChart from './charts/OrderStatusPieChart';
import TopSkusChart from './charts/TopSkusChart';
import AppHeader from './AppHeader';
import Footer from './Footer';
import StateDistributionChart from './charts/StateDistributionChart';
import ReturnReasonsChart from './charts/ReturnReasonsChart';
import TopReturnedSkusChart from './charts/TopReturnedSkusChart';

type RedesignedView = 'overview' | 'orders' | 'returns';

interface RedesignedDashboardProps {
    onGoBack: () => void;
    allDashboardData: AllDashboardsData;
    filterContext: FilterContextData | null;
    filters: FilterState;
    onFilterChange: React.Dispatch<React.SetStateAction<FilterState>>;
    isProcessing: boolean;
    filesData: FilesData;
    skuPrices: SkuPrices | null;
    onUploadNewFile: () => void;
}

// --- Reusable UI Components ---

const KpiIcon = ({ type }: { type: string }) => {
    const iconStyle = "h-9 w-9";
    const icons: { [key: string]: React.ReactNode } = {
        rto: <RotateCcw className={`${iconStyle} text-purple-500`} />,
        shipped: <Truck className={`${iconStyle} text-blue-500`} />,
        delivered: <Package className={`${iconStyle} text-green-500`} />,
        returns: <TrendingDown className={`${iconStyle} text-red-600`} />,
        settlement: <DollarSign className={`${iconStyle} text-emerald-500`} />,
        profit: <TrendingUp className={`${iconStyle} text-green-600`} />,
        return_cost: <TrendingDown className={`${iconStyle} text-red-500`} />,
        total: <Package className={`${iconStyle} text-gray-500`} />,
        claim: <svg xmlns="http://www.w3.org/2000/svg" className={`${iconStyle} text-yellow-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path><line x1="16" y1="8" x2="2" y2="22"></line><line x1="17.5" y1="15.5" x2="9" y2="7"></line></svg>,
        exchanged: <Repeat className={`${iconStyle} text-teal-500`} />,
        cancelled: <XCircle className={`${iconStyle} text-slate-500`} />,
        product_cost: <Box className={`${iconStyle} text-orange-500`} />,
        packaging_cost: <Box className={`${iconStyle} text-cyan-500`} />,
        marketing_cost: <svg xmlns="http://www.w3.org/2000/svg" className={`${iconStyle} text-indigo-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.354A1.76 1.76 0 017.165 9.7zM11 5.882a1.76 1.76 0 012.583-.223l5.445 4.666a1.76 1.76 0 01.223 2.583l-1.488 1.734a1.76 1.76 0 01-2.583.223L11 11.482v-5.6z" /></svg>,
    };
    return icons[type] || icons.total;
};

const KpiItem: React.FC<{ item: KpiData }> = ({ item }) => (
    <div className="bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-gray-200/50 flex gap-4 items-center flex-grow">
        <div className="p-3 bg-white/70 rounded-full shadow-inner">
            <KpiIcon type={item.icon} />
        </div>
        <div>
            <p className="text-sm text-gray-500">{item.title}</p>
            <p className="text-2xl font-bold text-gray-800">{item.value}</p>
        </div>
        {item.trend && (
             <div className={`ml-auto text-sm font-semibold flex items-center gap-1 ${item.trend.direction === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                {item.trend.direction === 'up' ? <TrendingUp size={14}/> : <TrendingDown size={14} />}
                {item.trend.change}%
            </div>
        )}
    </div>
);

const CombinedKpiItem: React.FC<{ items: KpiData[] }> = ({ items }) => (
    <div className="bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-gray-200/50 flex gap-4 items-center flex-grow">
       {items.map((item, index) => (
         <React.Fragment key={item.title}>
            <div className="flex-1 flex flex-col items-center justify-center">
                <p className="text-xs text-gray-500">{item.title}</p>
                <p className="text-xl font-bold text-gray-800">{item.value}</p>
            </div>
            {index < items.length - 1 && <div className="w-px h-8 bg-gray-200" />}
         </React.Fragment>
       ))}
    </div>
);

const ModernOverviewCard: React.FC<{ title: string; kpis: KpiData[]; totalValue?: string | number; children?: React.ReactNode }> = ({ title, kpis, totalValue, children }) => {
    const combinedKpis: KpiData[][] = [];
    const singleKpis: KpiData[] = [];
    
    const combinedPairs = [
        ['Delivered', 'Delivered %'], ['RTO', 'RTO %'], ['Returns', 'Return %'], ['Cancelled', 'Cancelled %'],
    ];

    const kpiMap = new Map(kpis.map(k => [k.title, k]));
    const processedTitles = new Set();

    combinedPairs.forEach(pair => {
        if(kpiMap.has(pair[0]) && kpiMap.has(pair[1])){
            combinedKpis.push([kpiMap.get(pair[0])!, kpiMap.get(pair[1])!]);
            processedTitles.add(pair[0]);
            processedTitles.add(pair[1]);
        }
    });

    kpis.forEach(kpi => {
        if(!processedTitles.has(kpi.title)){
            singleKpis.push(kpi);
        }
    });

    return (
        <div className="bg-white/60 p-6 rounded-2xl shadow-lg border border-gray-200 backdrop-blur-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                {totalValue && <span className="text-2xl font-bold text-green-600">{totalValue}</span>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {combinedKpis.map((pair, index) => <CombinedKpiItem key={index} items={pair} />)}
                {singleKpis.map(kpi => <KpiItem key={kpi.title} item={kpi} />)}
            </div>
            {children}
        </div>
    );
}

const ChartCard: React.FC<{ title: string, children: React.ReactNode, className?: string }> = ({ title, children, className }) => (
    <div className={`bg-white/60 p-4 sm:p-6 rounded-2xl shadow-lg border border-gray-200 backdrop-blur-md ${className}`}>
        <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">{title}</h3>
        <div className="h-80">
            {children}
        </div>
    </div>
);

// --- New Sidebar for Redesigned Dashboard ---
const RedesignedSidebar: React.FC<{ view: RedesignedView, setView: (view: RedesignedView) => void, hasOrders: boolean, hasReturns: boolean, onUploadNewFile: () => void }> = ({ view, setView, hasOrders, hasReturns, onUploadNewFile }) => {
    
    const menuItems = [
        { name: 'overview', label: 'Dashboard Overview', icon: <LayoutDashboard size={20} /> },
        { name: 'orders', label: 'Orders Analysis', icon: <Package size={20} />, requiresData: hasOrders },
        { name: 'returns', label: 'Returns Analysis', icon: <RotateCcw size={20} />, requiresData: hasReturns },
    ];

    return (
        <aside className="w-64 bg-white/30 backdrop-blur-lg p-4 flex-shrink-0 border-r border-gray-200/80 h-full flex flex-col">
            <nav className="flex flex-col space-y-2">
                {menuItems.map(item => (
                    <button
                        key={item.name}
                        onClick={() => {
                            if(item.requiresData === false) {
                                alert(`Please upload the ${item.name} file to view this analysis.`);
                                onUploadNewFile();
                            } else {
                                setView(item.name as RedesignedView)
                            }
                        }}
                        className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 text-left ${view === item.name ? 'bg-green-100 text-green-800 font-bold shadow-sm' : 'text-gray-600 hover:bg-gray-100/50'}`}
                        title={item.label}
                        disabled={item.requiresData === false && item.name !== 'overview'}
                    >
                        {item.icon}
                        <span className="truncate">{item.label}</span>
                        {item.requiresData === false && item.name !== 'overview' && <span className="ml-auto" title="Data required"><Info size={16} className="text-blue-500"/></span>}
                    </button>
                ))}
            </nav>
        </aside>
    );
};

// --- View Components for each dashboard section ---

const OverviewView: React.FC<Omit<RedesignedDashboardProps, 'onGoBack' | 'onFilterChange' | 'filters'> & { onBarClick: (sku: string) => void, onAlertClick: (sku?: string) => void }> = ({ allDashboardData, filesData, onUploadNewFile, onBarClick, onAlertClick }) => {
    const { payments, orders } = allDashboardData;
    const hasAnyFile = Object.keys(filesData).length > 0;
    
    const SmartAlertsDisplay = () => {
        const alerts = payments?.smartAlerts;
        if (!alerts || alerts.length === 0) return null;

        return (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-semibold text-yellow-800">Actionable Insights</h3>
                        <div className="mt-2 text-sm text-yellow-700">
                            <ul className="list-disc space-y-1 pl-5">
                                {alerts.map(alert => (
                                    <li key={alert.id}>
                                        {alert.message}
                                        {alert.sku && (
                                            <button onClick={() => onAlertClick(alert.sku)} className="ml-2 font-bold text-yellow-800 hover:underline">
                                                (View Details)
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    
    const { mockKpiData, mockBarData, mockStateData, mockPaymentsTableData } = useMemo(() => getMockData(), []);

    return (
        <div className="space-y-6">
            {hasAnyFile && <SmartAlertsDisplay />}
            <ModernOverviewCard title="Order Overview" kpis={hasAnyFile && orders ? orders.orderOverview : mockKpiData.orders} totalValue={hasAnyFile && orders ? orders.orderOverview.find(k => k.title === 'Total Orders')?.value : mockKpiData.totalOrders} />
            <ModernOverviewCard title="Earnings Overview" kpis={hasAnyFile && payments ? payments.earningsOverview : mockKpiData.payments} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <ChartCard title="Top Performing Products">
                    <TopSkusChart data={hasAnyFile && orders ? orders.topSkus : mockBarData} onBarClick={onBarClick} />
                </ChartCard>
                <ChartCard title="Top 10 States by Order Volume">
                   <StateDistributionChart data={hasAnyFile && orders ? orders.stateDistribution : mockStateData} />
                </ChartCard>
                <ChartCard title="Order Status Distribution">
                     <OrderStatusPieChart data={hasAnyFile && orders ? orders.orderStatusDistribution : [{name: 'Delivered', value: 950}, {name: 'RTO', value: 150}, {name: 'Return', value: 100}, {name: 'Cancelled', value: 50}]} />
                </ChartCard>
            </div>
             <DataTable
                data={hasAnyFile && payments ? payments.allPayments : mockPaymentsTableData}
                columns={[ { key: 'orderDate', header: 'Date' }, { key: 'orderId', header: 'Order ID' }, { key: 'sku', header: 'SKU' }, { key: 'status', header: 'Status' }, { key: 'finalPayment', header: 'Settlement' }, { key: 'returnCost', header: 'Return Cost' } ]}
                title="Payments Data"
                description={hasAnyFile ? "Filtered entries from your Payments file." : "Sample payments data."}
            />
        </div>
    );
};

const OrdersView: React.FC<{data: OrdersDashboardData | null, onBarClick: (sku: string) => void}> = ({ data, onBarClick }) => {
    const { mockKpiData, mockBarData, mockStateData, mockOrderData } = useMemo(() => getMockData(), []);
    const orderColumns = [ { key: 'orderId', header: 'Order ID' }, { key: 'sku', header: 'SKU' }, { key: 'status', header: 'Status' }, { key: 'state', header: 'State' }, { key: 'size', header: 'Size' }, ];

    if (!data || !data.hasData) {
        return (
            <div className="space-y-6">
                <ModernOverviewCard title="Order Overview" kpis={mockKpiData.orders} totalValue={mockKpiData.totalOrders} />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <ChartCard title="Order Status"><OrderStatusPieChart data={[{name: 'Delivered', value: 950}, {name: 'RTO', value: 150}, {name: 'Return', value: 100}, {name: 'Cancelled', value: 50}]} /></ChartCard>
                    <ChartCard title="Top 10 States by Order Volume"><StateDistributionChart data={mockStateData} /></ChartCard>
                    <ChartCard title="Top SKUs by Volume"><TopSkusChart data={mockBarData} onBarClick={onBarClick} /></ChartCard>
                </div>
                <DataTable data={mockOrderData} columns={orderColumns} title="Sample Orders Data" description="This is a sample table. Upload your files to see your own data here." />
            </div>
        )
    }
    
    return (
        <div className="space-y-6">
            <ModernOverviewCard title="Order Overview" kpis={data.orderOverview} totalValue={data.orderOverview.find(k => k.title === 'Total Orders')?.value} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <ChartCard title="Order Status"><OrderStatusPieChart data={data.orderStatusDistribution} /></ChartCard>
                 <ChartCard title="Top 10 States by Order Volume"><StateDistributionChart data={data.stateDistribution} /></ChartCard>
                 <ChartCard title="Top SKUs by Volume"><TopSkusChart data={data.topSkus} onBarClick={onBarClick} /></ChartCard>
            </div>
            <DataTable data={data.allOrders} columns={orderColumns} title="All Orders Data" description="A detailed view of all entries from your uploaded Orders file." />
        </div>
    );
};

const ReturnsView: React.FC<{data: ReturnsDashboardData | null, onBarClick: (sku: string) => void}> = ({ data, onBarClick }) => {
    const { mockTopReturnedSkusData, mockReturnReasonsData, mockReturnData } = useMemo(() => getMockData(), []);
    const returnColumns = [ { key: 'orderId', header: 'Order ID' }, { key: 'sku', header: 'SKU' }, { key: 'returnType', header: 'Return Type' }, { key: 'returnReason', header: 'Reason' }, { key: 'subReason', header: 'Sub Reason' }, ];

    if (!data || !data.hasData) {
        const mockKpis: KpiData[] = [{ title: 'Total Returns', value: 25, icon: 'returns' }, { title: 'Most Returned SKU', value: 'SKU-D-004', icon: 'product_cost' }];
        return (
            <div className="space-y-6">
                <ModernOverviewCard title="Returns Overview" kpis={mockKpis} />
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-3">
                      <ChartCard title="Top Reasons for Return">
                        <ReturnReasonsChart data={mockReturnReasonsData} />
                      </ChartCard>
                    </div>
                    <div className="lg:col-span-2">
                       <ChartCard title="Most Returned SKUs">
                        <TopReturnedSkusChart data={mockTopReturnedSkusData} />
                       </ChartCard>
                    </div>
                </div>
                <DataTable data={mockReturnData} columns={returnColumns} title="All Returns Data" description="Sample returns data. Upload your files to see your own data here." />
            </div>
        )
    }
    
    const kpis: KpiData[] = [{ title: 'Total Returns', value: data.allReturns.length, icon: 'returns' }];
    if(data.topReturnedSkus[0]) {
        kpis.push({ title: 'Most Returned SKU', value: data.topReturnedSkus[0].name, icon: 'product_cost' });
    }

    return (
        <div className="space-y-6">
            <ModernOverviewCard title="Returns Overview" kpis={kpis} />
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
            <DataTable data={data.allReturns} columns={returnColumns} title="All Returns Data" description="A detailed view of all entries from your uploaded Returns file." />
        </div>
    );
};

// --- Mock Data Generation ---
const getMockData = () => ({
    mockKpiData: {
        orders: [
            { title: 'Delivered', value: 950, icon: 'delivered' }, { title: 'Delivered %', value: `76.0%`, icon: 'delivered' },
            { title: 'RTO', value: 150, icon: 'rto' }, { title: 'RTO %', value: `12.0%`, icon: 'rto' },
            { title: 'Returns', value: 100, icon: 'returns' }, { title: 'Return %', value: `8.0%`, icon: 'returns' },
            { title: 'Cancelled', value: 50, icon: 'cancelled' }, { title: 'Cancelled %', value: `4.0%`, icon: 'cancelled' },
            { title: 'Shipped', value: 1100, icon: 'shipped' }, { title: 'Exchanged', value: 25, icon: 'exchanged' },
        ],
        payments: [
            { title: 'Settlement Amt', value: "₹4.5L", icon: 'settlement' }, { title: 'Product Cost', value: "₹2.1L", icon: 'product_cost' },
            { title: 'Packaging Cost', value: "₹25K", icon: 'packaging_cost' }, { title: 'Marketing Cost', value: "₹15K", icon: 'marketing_cost' },
            { title: 'Return Cost', value: "₹18K", icon: 'return_cost' }, { title: 'Claim Amount', value: "₹5K", icon: 'claim' },
            { title: 'Net Profit', value: "₹1.87L", icon: 'profit' },
        ],
        totalOrders: 1250,
    },
    mockBarData: [
        { name: 'SKU-A-001', value: 250 }, { name: 'SKU-B-002', value: 180 }, { name: 'SKU-C-003', value: 150 },
        { name: 'SKU-D-004', value: 120 }, { name: 'SKU-E-005', value: 90 },
    ],
    mockStateData: [
        { state: 'Maharashtra', count: 280 }, { state: 'Uttar Pradesh', count: 190 }, { state: 'Karnataka', count: 150 },
        { state: 'Delhi', count: 120 }, { state: 'West Bengal', count: 95 }, { state: 'Telangana', count: 80 },
        { state: 'Gujarat', count: 70 }, { state: 'Tamil Nadu', count: 65 }, { state: 'Rajasthan', count: 50 }, { state: 'Haryana', count: 40 },
    ],
    mockOrderData: Array.from({length: 50}, (_, i) => ({
        orderId: `OD123456789${i}`, sku: ['SKU-A-001', 'SKU-B-002', 'SKU-C-003'][i%3],
        status: ['Delivered', 'RTO', 'Shipped'][i%3], state: ['Maharashtra', 'Delhi', 'Karnataka'][i%3], size: 'M'
    })),
    mockPaymentsTableData: Array.from({length: 50}, (_, i) => ({
        orderDate: new Date(Date.now() - i * 24 * 3600 * 1000), orderId: `OD123456789${i}`, sku: ['SKU-A-001', 'SKU-B-002', 'SKU-C-003'][i%3],
        status: ['Delivered', 'RTO', 'Return'][i%3], finalPayment: 450, returnCost: i % 2 === 0 ? 60 : 0
    })),
    mockReturnData: Array.from({length: 20}, (_, i) => ({
        orderId: `OD987654321${i}`, sku: ['SKU-A-001', 'SKU-D-004'][i%2], returnType: 'Customer Return',
        returnReason: ['Quality Issue', 'Wrong Item', 'Did not fit'][i%3], subReason: 'N/A'
    })),
    mockReturnReasonsData: [{ name: 'Quality Issue', value: 40 }, { name: 'Wrong Item', value: 30 }, { name: 'Did not fit', value: 20 }, { name: 'Not as described', value: 10 }],
    mockTopReturnedSkusData: [{ name: 'SKU-D-004', value: 25 }, { name: 'SKU-A-001', value: 18 }, { name: 'SKU-C-003', value: 12 }],
});

const MobileNav: React.FC<{ view: RedesignedView, setView: (view: RedesignedView) => void }> = ({ view, setView }) => {
    const navItems = [
        { name: 'overview', label: 'Overview', icon: <LayoutDashboard size={18} /> },
        { name: 'orders', label: 'Orders', icon: <Package size={18} /> },
        { name: 'returns', label: 'Returns', icon: <RotateCcw size={18} /> },
    ];

    return (
        <nav className="md:hidden bg-white/70 border-b border-gray-200 backdrop-blur-sm sticky top-[68px] z-20">
            <div className="flex justify-around items-center p-1">
                {navItems.map(item => (
                    <button
                        key={item.name}
                        onClick={() => setView(item.name as RedesignedView)}
                        className={`flex-1 flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors ${
                            view === item.name 
                            ? 'bg-green-100 text-green-700' 
                            : 'text-gray-600 hover:bg-gray-100/50'
                        }`}
                    >
                        {item.icon}
                        <span className="text-xs font-semibold">{item.label}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
};

const RedesignedDashboard: React.FC<RedesignedDashboardProps> = (props) => {
    const { onGoBack, allDashboardData, filterContext, filters, onFilterChange, isProcessing, filesData, skuPrices, onUploadNewFile } = props;
    const { payments, orders, returns } = allDashboardData;
    const hasAnyFile = Object.keys(filesData).length > 0;
    
    const [view, setView] = useState<RedesignedView>('overview');
    const [selectedSku, setSelectedSku] = useState<string | null>(null);
    const [drilldownData, setDrilldownData] = useState<SkuDrilldownData | null>(null);

    useEffect(() => {
        if (selectedSku) {
            const data = calculateSkuDrilldown(selectedSku, filesData, skuPrices);
            setDrilldownData(data);
        } else {
            setDrilldownData(null);
        }
    }, [selectedSku, filesData, skuPrices]);
    
    const handleBarClick = (sku: string) => setSelectedSku(sku);
    const handleAlertClick = (sku?: string) => sku && setSelectedSku(sku);

    const renderContent = () => {
        switch(view) {
            case 'orders':
                return <OrdersView data={orders} onBarClick={handleBarClick} />;
            case 'returns':
                return <ReturnsView data={returns} onBarClick={handleBarClick} />;
            case 'overview':
            default:
                return <OverviewView {...props} onBarClick={handleBarClick} onAlertClick={handleAlertClick} />;
        }
    };
    
    if (isProcessing && !hasAnyFile) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50">
                <Loader2 className="w-16 h-16 animate-spin text-green-500" />
                <p className="mt-4 text-lg font-medium text-gray-700">Loading Dashboard...</p>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-green-50 text-gray-800 font-sans">
            <AppHeader onBack={onGoBack} backText={hasAnyFile ? "Back to Old Dashboard" : "Back to Home"} backIcon={<ArrowLeft size={16} />} />
            
            <MobileNav view={view} setView={setView} />

            <div className="flex flex-1 overflow-hidden">
                {/* Desktop Sidebar */}
                <div className="hidden md:flex flex-shrink-0">
                    <RedesignedSidebar 
                        view={view} 
                        setView={setView} 
                        hasOrders={!!filesData.orders && filesData.orders.length > 0}
                        hasReturns={!!filesData.returns && filesData.returns.length > 0}
                        onUploadNewFile={onUploadNewFile}
                    />
                </div>

                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    {selectedSku && drilldownData && (
                        <SkuDrilldownModal 
                            data={drilldownData}
                            onClose={() => setSelectedSku(null)}
                        />
                    )}
                    <div className="max-w-7xl mx-auto space-y-6">
                        {!hasAnyFile && view === 'overview' && (
                           <>
                            <div className="text-center p-8 bg-white/70 rounded-2xl shadow-lg border border-gray-200 backdrop-blur-md">
                                <Info size={48} className="mx-auto text-green-500 mb-4" />
                                <h1 className="text-3xl font-bold text-gray-800">This is a Preview of the New Dashboard</h1>
                                <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
                                    You're viewing a prototype with sample data. To see your own business analytics, please go back and upload your Meesho report files.
                                </p>
                            </div>
                             {/* Mobile-only Upload Buttons */}
                            <div className="md:hidden mt-6 bg-white/70 rounded-2xl shadow-lg border border-gray-200 backdrop-blur-md p-4">
                                <h3 className="text-lg font-semibold text-center mb-3 text-gray-700">Upload files to get started</h3>
                                <div className="flex flex-col gap-3">
                                    <button onClick={onUploadNewFile} className="flex items-center justify-center gap-3 w-full text-center p-3 bg-green-100 hover:bg-green-200 text-green-800 rounded-lg font-semibold transition-colors">
                                        <DollarSign size={18} />
                                        <span>Upload Payments File</span>
                                    </button>
                                    <button onClick={onUploadNewFile} className="flex items-center justify-center gap-3 w-full text-center p-3 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg font-semibold transition-colors">
                                        <Package size={18} />
                                        <span>Upload Orders File</span>
                                    </button>
                                    <button onClick={onUploadNewFile} className="flex items-center justify-center gap-3 w-full text-center p-3 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-lg font-semibold transition-colors">
                                        <RotateCcw size={18} />
                                        <span>Upload Returns File</span>
                                    </button>
                                </div>
                            </div>
                           </>
                        )}
                        
                        {hasAnyFile && <DashboardFilters filterContext={filterContext!} filters={filters} onFilterChange={onFilterChange} onUploadNewFile={onUploadNewFile} />}
                        
                        {isProcessing ? (
                             <div className="w-full h-96 flex flex-col items-center justify-center bg-gray-50/50 rounded-2xl">
                                <Loader2 className="w-12 h-12 animate-spin text-green-500" />
                                <p className="mt-4 text-lg font-semibold text-gray-700">Applying filters...</p>
                            </div>
                        ) : renderContent()}
                    </div>
                </main>
            </div>
            
            <Footer />
        </div>
    );
};

export default RedesignedDashboard;