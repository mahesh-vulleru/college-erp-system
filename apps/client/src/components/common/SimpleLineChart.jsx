import React from 'react';

/**
 * Pure SVG Multi-Series Line Chart Widget
 * Replicates the "Student Enrollment Trend" chart from the reference image.
 */
export const SimpleLineChart = ({
  categories = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  series = [
    { name: 'New Admissions', data: [35, 45, 55, 60, 72, 85], color: '#38bdf8' },
    { name: 'Total Students', data: [45, 55, 62, 70, 80, 95], color: '#10b981' }
  ],
  height = 150,
  className = ''
}) => {
  const allValues = series.flatMap((s) => s.data);
  const maxVal = Math.max(...allValues, 100);
  const minVal = 0;
  const range = maxVal - minVal || 1;

  const width = 360;
  const paddingX = 25;
  const paddingY = 20;
  const usableWidth = width - paddingX * 2;
  const usableHeight = height - paddingY * 2;

  const getCoordinates = (valIndex, val) => {
    const x = paddingX + (valIndex / (categories.length - 1)) * usableWidth;
    const y = height - paddingY - ((val - minVal) / range) * usableHeight;
    return { x, y };
  };

  return (
    <div className={`w-full ${className}`}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
        {/* Horizontal gridlines */}
        {[0, 0.33, 0.66, 1].map((pct, idx) => {
          const y = height - paddingY - pct * usableHeight;
          return (
            <line
              key={idx}
              x1={paddingX}
              y1={y}
              x2={width - paddingX}
              y2={y}
              stroke="#e2e8f0"
              strokeDasharray="3 3"
              strokeWidth="0.8"
            />
          );
        })}

        {/* Series Lines and Circles */}
        {series.map((s, sIdx) => {
          const points = s.data.map((val, idx) => getCoordinates(idx, val));
          const pathD = points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');

          return (
            <g key={sIdx}>
              {/* Line */}
              <path
                d={pathD}
                fill="none"
                stroke={s.color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Points */}
              {points.map((pt, pIdx) => (
                <circle
                  key={pIdx}
                  cx={pt.x}
                  cy={pt.y}
                  r="3.5"
                  fill="#ffffff"
                  stroke={s.color}
                  strokeWidth="2"
                  className="transition-transform hover:scale-125"
                />
              ))}
            </g>
          );
        })}

        {/* X Axis Labels */}
        {categories.map((cat, idx) => {
          const x = paddingX + (idx / (categories.length - 1)) * usableWidth;
          return (
            <text
              key={idx}
              x={x}
              y={height - 4}
              fontSize="9"
              fill="#94a3b8"
              textAnchor="middle"
              fontWeight="500"
            >
              {cat}
            </text>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 mt-3 text-xs">
        {series.map((s, idx) => (
          <div key={idx} className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-navy-600 font-medium text-[11px]">{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimpleLineChart;
