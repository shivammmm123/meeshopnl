import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { SkuProfitLossData } from '../types';

interface PaginatedDataTableProps {
  title: string;
  data: SkuProfitLossData[];
}

const ROWS_PER_PAGE = 10;

const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const PaginatedDataTable: React.FC<PaginatedDataTableProps> = ({ title, data }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const isLossTable = title.toLowerCase().includes('loss');

  const totalPages = Math.ceil(data.length / ROWS_PER_PAGE);
  const paginatedData = data.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm h-full flex flex-col">
      <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">{title}</h3>
      <div className="flex-grow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">SKU</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Orders</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{isLossTable ? 'Loss' : 'Profit'}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((row) => (
              <tr key={row.sku} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 truncate max-w-xs" title={row.sku}>{row.sku}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.orders}</td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${isLossTable ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(row.value)}
                </td>
              </tr>
            ))}
             {paginatedData.length === 0 && (
                <tr>
                    <td colSpan={3} className="text-center py-10 text-gray-500">
                        <div className="flex flex-col items-center justify-center">
                            {isLossTable ? <TrendingUp size={32} className="text-gray-400 mb-2" /> : <TrendingDown size={32} className="text-gray-400 mb-2" />}
                            <p className="font-semibold">No {isLossTable ? 'Losses' : 'Profits'} to show</p>
                            <p className="text-sm mt-1">No SKUs match this criteria.</p>
                        </div>
                    </td>
                </tr>
             )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center pt-4 mt-auto border-t border-gray-200">
          <span className="text-sm text-gray-600">
            Page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalPages}</span>
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
               className="p-2 rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaginatedDataTable;
