import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface DataTableProps {
  data: any[];
  columns: { key: string; header: string }[];
  title: string;
  description: string;
  theme?: 'light' | 'dark';
}

const ROWS_PER_PAGE = 25;

const DataTable: React.FC<DataTableProps> = ({ data, columns, title, description }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const lowercasedFilter = searchTerm.toLowerCase();
    return data.filter(item => 
      Object.values(item).some(value => 
        String(value).toLowerCase().includes(lowercasedFilter)
      )
    );
  }, [data, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / ROWS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
    return filteredData.slice(startIndex, startIndex + ROWS_PER_PAGE);
  }, [filteredData, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };
  
  const formatDate = (dateString: any) => {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-GB');
    }
    return dateString;
  };

  const renderStatusPill = (status: string) => {
    const lowerStatus = String(status || '').toLowerCase();
    let colorClasses = 'bg-gray-100 text-gray-800'; // default

    if (lowerStatus.includes('delivered')) {
        colorClasses = 'bg-green-100 text-green-800';
    } else if (lowerStatus.includes('return')) {
        colorClasses = 'bg-red-100 text-red-800';
    } else if (lowerStatus.includes('rto')) {
        colorClasses = 'bg-orange-100 text-orange-800';
    } else if (lowerStatus.includes('cancelled')) {
        colorClasses = 'bg-gray-200 text-gray-600';
    } else if (lowerStatus.includes('shipped')) {
        colorClasses = 'bg-blue-100 text-blue-800';
    }

    return (
        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClasses}`}>
            {status}
        </span>
    );
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-gray-200 space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
           <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            aria-label="Search table"
            placeholder="Search table..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full md:w-72 pl-10 pr-4 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map(col => (
                <th key={col.key} scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                {columns.map(col => (
                  <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                    {col.key === 'status'
                      ? renderStatusPill(row[col.key])
                      : col.key.toLowerCase().includes('date') 
                      ? formatDate(row[col.key]) 
                      : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
             {paginatedData.length === 0 && (
                <tr>
                    <td colSpan={columns.length} className="text-center py-16 text-gray-500">
                        <p className="font-semibold">No results found</p>
                        <p className="text-sm mt-1">Try adjusting your search term.</p>
                    </td>
                </tr>
             )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <span className="text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-800">{Math.min((currentPage - 1) * ROWS_PER_PAGE + 1, filteredData.length)}</span> to <span className="font-semibold text-gray-800">{Math.min(currentPage * ROWS_PER_PAGE, filteredData.length)}</span> of <span className="font-semibold text-gray-800">{filteredData.length}</span> entries
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm font-medium px-2">Page {currentPage} of {totalPages}</span>
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

export default DataTable;