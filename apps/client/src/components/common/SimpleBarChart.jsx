import React from 'react';

/**
 * Enhanced Responsive Bar Chart Widget
 * Supports single series bars and dual grouped bars (e.g. Students vs Faculty) matching the reference dashboards.
 */
export const SimpleBarChart = ({
  data = [], // [{ label: 'CSE', value: 85, value2?: 12 }] or [{ label: 'Jan', value: 40 }]
  seriesNames = ['Students', 'Faculty'],
  height = 140,
  barColor = 'bg-teal-500',
  barColor2 = 'bg-emerald-300',
  isGrouped = false,
  className = ''
}) => {
  const allValues = data.flatMap((d) => [d.value || 0, d.value2 || 0]);
  const maxVal = Math.max(...allValues, 100);

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-end justify-between gap-2 sm:gap-3 pt-4 pb-2" style={{ height: `${height}px` }}>
        {data.map((item, idx) => {
          const pct1 = Math.round(((item.value || 0) / maxVal) * 100);
          const pct2 = isGrouped ? Math.round(((item.value2 || 0) / maxVal) * 100) : null;

          return (
            <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
              <div className="w-full flex items-end justify-center gap-1 h-full">
                {/* Bar 1 */}
                <div className="w-full bg-slate-100/70 rounded-t-md h-full flex items-end overflow-hidden max-w-[20px]">
                  <div
                    className={`w-full ${item.color || barColor} rounded-t-md transition-all duration-500 ease-out`}
                    style={{ height: `${pct1}%` }}
                    title={`${item.label}: ${item.value}`}
                  />
                </div>
                {/* Bar 2 (for grouped charts) */}
                {isGrouped && pct2 !== null && (
                  <div className="w-full bg-slate-100/70 rounded-t-md h-full flex items-end overflow-hidden max-w-[20px]">
                    <div
                      className={`w-full ${item.color2 || barColor2} rounded-t-md transition-all duration-500 ease-out`}
                      style={{ height: `${pct2}%` }}
                      title={`${item.label} (2): ${item.value2}`}
                    />
                  </div>
                )}
              </div>
              <span className="mt-2 text-[10px] font-semibold text-navy-500 truncate max-w-full text-center">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>

      {isGrouped && (
        <div className="flex items-center justify-center space-x-6 mt-3 text-xs">
          <div className="flex items-center space-x-1.5">
            <span className={`w-2.5 h-2.5 rounded-sm ${barColor}`} />
            <span className="text-navy-600 font-medium text-[11px]">{seriesNames[0]}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className={`w-2.5 h-2.5 rounded-sm ${barColor2}`} />
            <span className="text-navy-600 font-medium text-[11px]">{seriesNames[1]}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleBarChart;
