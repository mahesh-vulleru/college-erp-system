import React from 'react';

/**
 * Responsive Pure SVG Donut Chart Widget
 * Replicates the donut charts from the reference image with centered metrics and aligned legend.
 */
export const SimpleDonutChart = ({
  data = [], // [{ label: 'Students', value: 2, color: '#3b82f6' }]
  centerValue = '10',
  centerLabel = 'Total',
  size = 140,
  strokeWidth = 18,
  showLegend = true,
  className = ''
}) => {
  const total = data.reduce((sum, item) => sum + Number(item.value || 0), 0) || 1;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-center gap-6 ${className}`}>
      {/* SVG Donut Circle */}
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          {/* Base background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />
          {/* Slices */}
          {data.map((item, idx) => {
            const val = Number(item.value || 0);
            const sliceLength = (val / total) * circumference;
            const offset = currentOffset;
            currentOffset += sliceLength;

            return (
              <circle
                key={idx}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={item.color || '#3b82f6'}
                strokeWidth={strokeWidth}
                strokeDasharray={`${sliceLength} ${circumference - sliceLength}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
                className="transition-all duration-500 ease-out hover:opacity-90"
              />
            );
          })}
        </svg>

        {/* Center Metric Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-xl font-extrabold text-navy-950 tracking-tight leading-none">
            {centerValue}
          </span>
          {centerLabel && (
            <span className="text-[10px] font-semibold text-navy-400 mt-1 uppercase tracking-wider">
              {centerLabel}
            </span>
          )}
        </div>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex-1 w-full space-y-2">
          {data.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color || '#3b82f6' }}
                />
                <span className="text-navy-600 font-medium truncate text-xs">{item.label}</span>
              </div>
              <span className="font-bold text-navy-900 font-mono text-xs ml-2">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SimpleDonutChart;
