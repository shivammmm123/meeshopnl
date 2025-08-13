import React, { useState, useRef, useEffect } from 'react';
import { FilterContextData, FilterState } from '../types';
import { SlidersHorizontal, X, UploadCloud, Check } from 'lucide-react';

interface DashboardFiltersProps {
  filterContext: FilterContextData;
  filters: FilterState;
  onFilterChange: React.Dispatch<React.SetStateAction<FilterState>>;
  onUploadNewFile: () => void;
}

const MultiSelectDropdown = ({
  options,
  selected,
  onChange,
  placeholder,
}: {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [ref]);

  const handleSelect = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((item) => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };
  
  const displayText = selected.length > 0 ? `${selected.length} selected` : placeholder;

  return (
    <div className="relative w-full" ref={ref}>
      <button
        aria-label={placeholder}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
      >
        <span className="block truncate">{displayText}</span>
      </button>
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md max-h-60 overflow-auto">
          <ul className="py-1">
            {options.map((option) => (
              <li
                key={option}
                onClick={() => handleSelect(option)}
                className="px-3 py-2 cursor-pointer hover:bg-gray-100 flex items-center"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option)}
                  readOnly
                  className="mr-2 form-checkbox h-4 w-4 text-green-600 transition duration-150 ease-in-out"
                />
                {option}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const DashboardFilters: React.FC<DashboardFiltersProps> = ({ filterContext, filters, onFilterChange, onUploadNewFile }) => {
  const [showFilters, setShowFilters] = useState(true);
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  // Sync local state when global filters change (e.g., after clearing or initial load)
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);
  
  const handleLocalFilterChange = (filterName: keyof FilterState, value: any) => {
      setLocalFilters(prev => ({ ...prev, [filterName]: value }));
  };
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocalFilters(prev => ({
      ...prev,
      dateRange: { ...prev.dateRange, [name]: value },
      calculateTrend: false, // Manual date change should not calculate trend
    }));
  };

  const handleApplyFilters = () => {
    onFilterChange(localFilters);
  };
  
  const handleQuickFilter = (period: 'this_month' | 'last_30_days' | 'last_7_days') => {
    const end = new Date();
    let start = new Date();
    
    if (period === 'this_month') {
        start.setDate(1);
    } else if (period === 'last_30_days') {
        start.setDate(end.getDate() - 30);
    } else if (period === 'last_7_days') {
        start.setDate(end.getDate() - 7);
    }
    
    const newFilters = {
        ...filters, // use global filters as base
        dateRange: {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
        },
        calculateTrend: true,
    };
    
    setLocalFilters(newFilters); // Update local state for consistency
    onFilterChange(newFilters); // Apply immediately
  };
  
  const isFilterActive = 
    filters.dateRange.start !== '' ||
    filters.dateRange.end !== '' ||
    filters.orderStatuses.length > 0 ||
    filters.selectedSkus.length > 0 ||
    filters.selectedStates.length > 0 ||
    filters.selectedReasons.length > 0;
    
  const clearFilters = () => {
      const emptyFilters: FilterState = {
        dateRange: { start: '', end: '' },
        orderStatuses: [],
        selectedSkus: [],
        selectedStates: [],
        selectedReasons: [],
        calculateTrend: false,
      };
      setLocalFilters(emptyFilters);
      onFilterChange(emptyFilters);
  }

  return (
    <div className="bg-white/70 p-4 rounded-xl shadow-lg border border-gray-200/50 backdrop-blur-sm">
      <button 
        onClick={() => setShowFilters(!showFilters)} 
        className="flex items-center gap-2 font-semibold text-gray-700 w-full text-left"
      >
        <SlidersHorizontal size={20} />
        Filters
      </button>
      {showFilters && (
        <div className="pt-4 mt-4 border-t border-gray-200">
           {/* Quick Filters */}
           <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-gray-500 mr-2">Quick Select:</span>
                <button onClick={() => handleQuickFilter('last_7_days')} className="px-3 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full hover:bg-green-200">Last 7 Days</button>
                <button onClick={() => handleQuickFilter('last_30_days')} className="px-3 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full hover:bg-green-200">Last 30 Days</button>
                <button onClick={() => handleQuickFilter('this_month')} className="px-3 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full hover:bg-green-200">This Month</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Date Filters */}
              <div>
                <label htmlFor="start-date-filter" className="text-sm font-medium text-gray-700">Start Date</label>
                <input id="start-date-filter" type="date" name="start" value={localFilters.dateRange.start} onChange={handleDateChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500" />
              </div>
              <div>
                <label htmlFor="end-date-filter" className="text-sm font-medium text-gray-700">End Date</label>
                <input id="end-date-filter" type="date" name="end" value={localFilters.dateRange.end} onChange={handleDateChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500" />
              </div>

              {/* SKU Filter */}
              {filterContext.availableSkus.length > 0 && (
                  <div>
                      <label className="text-sm font-medium text-gray-700">SKUs</label>
                       <MultiSelectDropdown
                          options={filterContext.availableSkus}
                          selected={localFilters.selectedSkus}
                          onChange={(val) => handleLocalFilterChange('selectedSkus', val)}
                          placeholder="All SKUs"
                      />
                  </div>
              )}
              
              {/* Status Filter */}
              {filterContext.availableStatuses.length > 0 && (
                   <div>
                      <label className="text-sm font-medium text-gray-700">Order Status</label>
                      <MultiSelectDropdown
                          options={filterContext.availableStatuses}
                          selected={localFilters.orderStatuses}
                          onChange={(val) => handleLocalFilterChange('orderStatuses', val)}
                          placeholder="All Statuses"
                      />
                  </div>
              )}

              {/* State Filter */}
              {filterContext.availableStates.length > 0 && (
                   <div>
                      <label className="text-sm font-medium text-gray-700">Customer State</label>
                      <MultiSelectDropdown
                          options={filterContext.availableStates}
                          selected={localFilters.selectedStates}
                          onChange={(val) => handleLocalFilterChange('selectedStates', val)}
                          placeholder="All States"
                      />
                  </div>
              )}
              
              {/* Reason Filter */}
              {filterContext.availableReasons.length > 0 && (
                   <div>
                      <label className="text-sm font-medium text-gray-700">Return Reason</label>
                      <MultiSelectDropdown
                          options={filterContext.availableReasons}
                          selected={localFilters.selectedReasons}
                          onChange={(val) => handleLocalFilterChange('selectedReasons', val)}
                          placeholder="All Reasons"
                      />
                  </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap items-center justify-end gap-2">
                 {isFilterActive && (
                      <button 
                          onClick={clearFilters}
                          className="flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors"
                      >
                          <X size={16}/>
                          Clear Filters
                      </button>
                )}
                 <button 
                    onClick={onUploadNewFile}
                    className="flex items-center justify-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                    <UploadCloud size={16}/>
                    Upload Another File
                </button>
                 <button 
                    onClick={handleApplyFilters}
                    className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                    <Check size={16}/>
                    Apply Filters
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default DashboardFilters;