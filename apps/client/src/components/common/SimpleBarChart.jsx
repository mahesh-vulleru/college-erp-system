import React from 'react';

/**
 * Responsive Pure CSS/React Bar Chart Widget
 * Avoids bulky charting dependencies while giving clean, legible institutional metric comparisons.
 */
export const SimpleBarChart = ({
  data = [], // [{ label: 'CSE', value: 85, max: 100 }]
  height = 160,
  barColor = 'bg-teal-600',
  className = ''
}) => {
  const maxVal = Math.max(...data.map((d) => d.value), 100);

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-end justify-between gap-3 pt-6 pb-2" style={{ height: `${height}px` }}>
        {data.map((item, idx) => {
          const percentage = Math.round((item.value / maxVal) * 100);
          return (
            <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
              <span className="text-[10px] font-semibold text-navy-700 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {item.value}%
              </span>
              <div className="w-full bg-navy-100/60 rounded-t-md h-full flex items-end overflow-hidden max-w-[40px]">
                <div
                  className={`w-full ${item.color || barColor} rounded-t-md transition-all duration-500 ease-out`}
                  style={{ height: `${percentage}%` }}
                />
              </div>
              <span className="mt-2 text-[10px] font-medium text-navy-600 truncate max-w-full text-center">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SimpleBarChart;

