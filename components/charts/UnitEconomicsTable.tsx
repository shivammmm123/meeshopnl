
import React from 'react';
import { UnitEconomicsData } from '../../types';

interface TableProps {
  data: UnitEconomicsData;
}

const UnitEconomicsTable: React.FC<TableProps> = ({ data }) => {
    
    const noPricesMessage = <span className="text-orange-500 text-xs font-normal">(Enter cost prices for this)</span>;
    
    if (!data.settlementAmt || data.settlementAmt === '₹0.00') {
       return <div className="flex items-center justify-center h-full text-gray-500">Upload Payments file for full analysis.</div>;
    }

    const rows = [
        { label: 'Settlement Amount', value: data.settlementAmt },
        { label: 'Product Cost', value: data.pricesEntered ? data.productCost : noPricesMessage },
        { label: 'Packaging Cost', value: data.pricesEntered ? data.packagingCost : noPricesMessage },
        { label: 'Marketing Cost', value: data.marketingCost },
        { label: 'COGS (Cost of Goods Sold)', value: data.pricesEntered ? data.cogs : noPricesMessage, isBold: true, isTopBorder: true },
        { label: 'Gross Profit', value: data.pricesEntered ? data.grossProfit : noPricesMessage },
        { label: 'Return Cost', value: data.returnCost, isNegative: true },
        { label: 'Net Profit', value: data.pricesEntered ? data.netProfit : noPricesMessage, isBold: true, isTopBorder: true },
        { label: 'Gross Margin %', value: data.pricesEntered ? data.grossMargin : noPricesMessage, isTopBorder: true },
        { label: 'Net Margin %', value: data.pricesEntered ? data.netMargin : noPricesMessage },
        { label: 'Profit per Unit', value: data.pricesEntered ? data.netProfitPerUnit : noPricesMessage, isBold: true },
    ];
    
    return (
        <div className="h-full w-full">
            <div className="flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <table className="min-w-full divide-y divide-gray-200">
                            <tbody>
                                {rows.map((row, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className={`whitespace-nowrap py-3 pl-4 pr-3 text-sm text-gray-800 sm:pl-0 ${row.isBold ? 'font-bold' : 'font-medium'}`}>
                                            {row.label}
                                        </td>
                                        <td className={`whitespace-nowrap px-3 py-3 text-sm text-right ${row.isBold ? 'font-bold text-gray-900' : 'text-gray-600'} ${row.isNegative ? 'text-red-600' : ''}`}>
                                            {row.value}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UnitEconomicsTable;
