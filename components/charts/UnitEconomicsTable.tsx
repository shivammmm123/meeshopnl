import React from 'react';
import { UnitEconomicsData } from '../../types';
import { DollarSign, Box, Package, Megaphone, RotateCcw, TrendingUp, TrendingDown, Info, Landmark } from 'lucide-react';

interface TableProps {
  data: UnitEconomicsData;
}

const InfoTooltip = ({ text }: { text: string }) => (
    <div className="relative inline-block ml-1 group">
        <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10">
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
        </div>
    </div>
);

const parseNumberFromCurrency = (value: string): number => {
  return parseFloat(String(value).replace(/[^0-9.-]/g, ''));
}

const UnitEconomicsTable: React.FC<TableProps> = ({ data }) => {
    
    if (!data.settlementAmt || data.settlementAmt === '₹0.00') {
       return <div className="flex items-center justify-center h-full text-gray-500">Upload Payments file for full analysis.</div>;
    }

    const netProfitValue = parseNumberFromCurrency(data.netProfit);

    const rows = [
        // Revenue
        { type: 'header', label: 'Revenue & Credits' },
        { label: 'Invoice Price', value: data.invoicePrice, icon: <DollarSign size={18} className="text-blue-500"/>, tooltip: "Total sale value of the products." },
        { label: 'Settlement Amount', value: data.settlementAmt, icon: <DollarSign size={18} className="text-green-500"/> },
        { label: 'Claim Amount', value: data.claimAmount, icon: <TrendingUp size={18} className="text-yellow-500"/> },
        { label: 'Recovery Amount', value: data.recovery, icon: <TrendingUp size={18} className="text-yellow-600"/> },
        
        // Costs
        { type: 'header', label: 'Costs & Expenses' },
        { label: 'Product Cost', value: data.pricesEntered ? data.productCost : <span className="text-orange-500 text-xs font-normal">(Enter costs to see this)</span>, icon: <Box size={18} className="text-orange-500"/> },
        { label: 'Packaging Cost', value: data.pricesEntered ? data.packagingCost : <span className="text-orange-500 text-xs font-normal">(Enter costs to see this)</span>, icon: <Package size={18} className="text-cyan-500"/> },
        { label: 'Marketing Cost', value: data.marketingCost, icon: <Megaphone size={18} className="text-indigo-500"/> },
        { label: 'Return Cost', value: data.returnCost, icon: <RotateCcw size={18} className="text-red-500"/> },
        
        // Taxes
        { type: 'header', label: 'Taxes & Deductions' },
        { label: 'Total GST', value: data.totalGst, icon: <Landmark size={18} className="text-gray-400"/>, tooltip: "Calculated based on your Settlement and GST Rate." },
        { label: 'TDS', value: data.tds, icon: <Landmark size={18} className="text-gray-400"/> },
        { label: 'TCS', value: data.tcs, icon: <Landmark size={18} className="text-gray-400"/> },
        
        // Totals & Margins
        { type: 'header', label: 'Profitability' },
        { label: 'COGS', value: data.pricesEntered ? data.cogs : 'N/A', icon: <TrendingDown size={18} className="text-slate-600"/>, isBold: true },
        { label: 'Gross Profit', value: data.pricesEntered ? data.grossProfit : 'N/A', icon: <TrendingUp size={18} className="text-emerald-600"/>, isBold: true },
        { label: netProfitValue >= 0 ? 'Net Profit' : 'Net Loss', value: data.pricesEntered ? data.netProfit : 'N/A', icon: <TrendingUp size={18} className={netProfitValue >= 0 ? 'text-green-600' : 'text-red-600'}/>, isBold: true },
        { label: 'Net Profit (w/o GST)', value: data.pricesEntered ? data.netProfitWithoutGst : 'N/A', icon: <TrendingUp size={18} className="text-gray-500"/> },
        { label: 'Gross Margin', value: data.pricesEntered ? data.grossMargin : 'N/A', icon: <TrendingUp size={18} className="text-gray-500"/> },
        { label: 'Net Margin', value: data.pricesEntered ? data.netMargin : 'N/A', icon: <TrendingUp size={18} className="text-gray-500"/> },
        { label: 'Profit/Unit', value: data.pricesEntered ? data.netProfitPerUnit : 'N/A', icon: <TrendingUp size={18} className="text-gray-500"/> },
        { label: 'Profit/Unit (w/o GST)', value: data.pricesEntered ? data.netProfitPerUnitWithoutGst : 'N/A', icon: <TrendingUp size={18} className="text-gray-500"/> },
    ];
    
    return (
        <div className="h-full w-full">
            <div className="flow-root">
                <table className="min-w-full">
                    <tbody className="divide-y divide-gray-200">
                        {rows.map((row, index) => (
                            row.type === 'header' ? (
                                <tr key={index}>
                                    <td colSpan={2} className="pt-4 pb-2">
                                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{row.label}</h4>
                                    </td>
                                </tr>
                            ) : (
                            <tr key={index} className="hover:bg-gray-50">
                                <td className={`whitespace-nowrap py-3 pl-1 pr-3 text-sm text-gray-800 flex items-center gap-2 ${row.isBold ? 'font-bold' : 'font-medium'}`}>
                                    {row.icon}
                                    {row.label}
                                    {row.tooltip && <InfoTooltip text={row.tooltip} />}
                                </td>
                                <td className={`whitespace-nowrap px-3 py-3 text-sm text-right ${row.isBold ? 'font-bold text-gray-900' : 'text-gray-600'} ${row.label === 'Return Cost' ? 'text-red-600' : ''} ${row.label === 'Net Loss' ? 'text-red-600' : ''}`}>
                                    {row.value}
                                </td>
                            </tr>
                            )
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UnitEconomicsTable;