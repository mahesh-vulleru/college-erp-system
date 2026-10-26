import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';

export const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems,
  onPageChange,
  className = ''
}) => {
  if (totalPages <= 1 && !totalItems) return null;

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border-t border-navy-100 text-xs text-navy-600 ${className}`}>
      <div>
        {totalItems !== undefined && (
          <span>
            Total <strong className="font-semibold text-navy-900">{totalItems}</strong> records
          </span>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-navy-500 mr-2">
          Page <strong className="text-navy-900">{currentPage}</strong> of <strong className="text-navy-900">{totalPages || 1}</strong>
        </span>

        <Button
          variant="secondary"
          size="xs"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </Button>

        <Button
          variant="secondary"
          size="xs"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
};

export default Pagination;

