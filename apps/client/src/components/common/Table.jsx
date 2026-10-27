import React from 'react';

export const Table = ({
  columns = [],
  data = [],
  keyField = 'id',
  isLoading = false,
  emptyMessage = 'No institutional records found in this view',
  emptyAction,
  className = ''
}) => {
  return (
    <div className={`w-full overflow-hidden rounded-xl border border-navy-200/80 shadow-subtle bg-white ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-navy-100 text-left text-sm">
          <thead className="bg-navy-50/80 text-[11px] font-semibold uppercase tracking-wider text-navy-600">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} scope="col" className={`px-4 py-3.5 ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-50 bg-white">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-navy-500">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="flex space-x-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-teal-600 animate-bounce" />
                      <div className="w-2.5 h-2.5 rounded-full bg-teal-600 animate-bounce [animation-delay:-.3s]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-teal-600 animate-bounce [animation-delay:-.5s]" />
                    </div>
                    <span className="text-xs text-navy-500 font-medium">Loading institutional data...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center">
                  <p className="text-xs text-navy-500 font-light">{emptyMessage}</p>
                  {emptyAction && <div className="mt-3">{emptyAction}</div>}
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr key={row[keyField] || row._id || rowIdx} className="hover:bg-warm-100/60 transition-colors">
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className={`px-4 py-3 text-navy-800 text-xs sm:text-sm whitespace-nowrap ${col.cellClassName || ''}`}>
                      {col.cell
                        ? col.cell(row)
                        : typeof col.accessor === 'function'
                        ? col.accessor(row)
                        : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
