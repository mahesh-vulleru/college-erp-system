import React from 'react';

export const Table = ({
  columns = [],
  data = [],
  keyField = 'id',
  isLoading = false,
  emptyMessage = 'No records found'
}) => {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white">
      <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
        <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} scope="col" className={`px-4 py-3.5 ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:-.3s]" />
                  <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:-.5s]" />
                  <span className="text-xs ml-2">Loading data...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-xs text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr key={row[keyField] || rowIdx} className="hover:bg-gray-50 transition-colors">
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className={`px-4 py-3 text-gray-700 text-xs sm:text-sm whitespace-nowrap ${col.cellClassName || ''}`}>
                    {typeof col.accessor === 'function'
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
  );
};

export default Table;
