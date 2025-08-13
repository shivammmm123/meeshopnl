import React from 'react';
import { SkuDrilldownData } from '../types';
import { X, Package, CheckCircle, TrendingUp, TrendingDown, RotateCcw, Box } from 'lucide-react';

interface SkuDrilldownModalProps {
  data: SkuDrilldownData;
  onClose: () => void;
}

const StatItem = ({ icon, label, value, colorClass }: { icon: React.ReactNode, label: string, value: string | number, colorClass?: string }) => (
    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
        <div className={`p-2 rounded-full bg-white shadow-sm ${colorClass}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-lg font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

const formatCurrency = (value: number) => {
    if (isNaN(value)) return '₹0';
    return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
};

const SkuDrilldownModal: React.FC<SkuDrilldownModalProps> = ({ data, onClose }) => {
    if (!data) return null;

    const { sku, totalSold, totalDelivered, totalSettlement, totalReturns, totalRTO, netProfit, isDataSufficient } = data;
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all animate-fade-in-down" role="dialog" aria-modal="true">
                <header className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <Box className="text-green-600" size={24}/>
                        <h2 className="text-xl font-bold text-gray-800 truncate" title={sku}>{sku}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full text-gray-500 hover:bg-gray-100">
                        <X size={24} />
                    </button>
                </header>

                <main className="p-6">
                    {!isDataSufficient ? (
                        <div className="text-center text-gray-600">
                            <p>Insufficient data to calculate profitability for this SKU.</p>
                            <p className="text-sm">Please ensure both Payments and Orders files are uploaded.</p>
                        </div>
                    ) : (
                       <>
                         <div className="text-center mb-6 p-6 rounded-xl bg-gradient-to-br from-green-50 to-emerald-100">
                            <p className="text-lg font-semibold text-gray-600">Net Profit/Loss for this SKU</p>
                            <p className={`text-5xl font-extrabold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(netProfit)}
                            </p>
                         </div>
                        
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <StatItem icon={<Package size={20} />} label="Total Units Sold (from Orders)" value={totalSold} />
                            <StatItem icon={<CheckCircle size={20} className="text-green-500" />} label="Total Units Delivered" value={totalDelivered} />
                            <StatItem icon={<TrendingUp size={20} className="text-emerald-500" />} label="Total Settlement Amount" value={formatCurrency(totalSettlement)} />
                            <StatItem icon={<TrendingDown size={20} className="text-red-500" />} label="Total Returns (Customer)" value={totalReturns} />
                            <StatItem icon={<RotateCcw size={20} className="text-orange-500" />} label="Total RTO (Courier Return)" value={totalRTO} />
                         </div>
                       </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default SkuDrilldownModal;
