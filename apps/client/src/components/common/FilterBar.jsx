import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import Button from './Button';

export const FilterBar = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search records...',
  children,
  onReset,
  className = ''
}) => {
  return (
    <div
      className={`bg-white p-3.5 sm:p-4 rounded-2xl border border-navy-100 shadow-subtle flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 ${className}`}
    >
      {/* Search Input */}
      {onSearchChange && (
        <div className="relative flex-1 min-w-[240px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-navy-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchQuery || ''}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-navy-200 bg-navy-50/40 text-navy-950 placeholder-navy-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-600 transition-colors shadow-2xs"
          />
        </div>
      )}

      {/* Additional Filter Selects passed as children */}
      <div className="flex flex-wrap items-center gap-2">
        {children}

        {onReset && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-navy-500 hover:text-navy-900 hover:bg-navy-50"
            title="Reset All Filters"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1 text-navy-400" />
            <span className="text-xs">Reset</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
