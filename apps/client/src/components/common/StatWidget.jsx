import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const StatWidget = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendDirection = 'up',
  color = 'blue',
  className = ''
}) => {
  const colors = {
    indigo: {
      bg: 'bg-indigo-50',
      icon: 'text-indigo-600',
      accent: 'border-indigo-100',
      border: 'border-slate-100'
    },
    emerald: {
      bg: 'bg-emerald-50',
      icon: 'text-emerald-600',
      accent: 'border-emerald-100',
      border: 'border-slate-100'
    },
    amber: {
      bg: 'bg-amber-50',
      icon: 'text-amber-600',
      accent: 'border-amber-100',
      border: 'border-slate-100'
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'text-purple-600',
      accent: 'border-purple-100',
      border: 'border-slate-100'
    },
    blue: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      accent: 'border-blue-100',
      border: 'border-slate-100'
    },
    teal: {
      bg: 'bg-teal-50',
      icon: 'text-teal-600',
      accent: 'border-teal-100',
      border: 'border-slate-100'
    },
    rose: {
      bg: 'bg-rose-50',
      icon: 'text-rose-600',
      accent: 'border-rose-100',
      border: 'border-slate-100'
    },
    navy: {
      bg: 'bg-slate-50',
      icon: 'text-slate-700',
      accent: 'border-slate-100',
      border: 'border-slate-100'
    }
  };

  const scheme = colors[color] || colors.blue;

  // Safely extract trend label and positive/negative direction
  const trendText =
    typeof trend === 'object' && trend !== null
      ? (trend.value != null ? String(trend.value) : '')
      : (trend != null ? String(trend) : '');

  const isPositive =
    typeof trend === 'object' && trend !== null && 'positive' in trend
      ? Boolean(trend.positive)
      : trendDirection === 'up';

  const displayValue =
    typeof value === 'object' && value !== null
      ? (value.value != null ? String(value.value) : JSON.stringify(value))
      : value;

  const displaySubtitle =
    typeof subtitle === 'object' && subtitle !== null
      ? (subtitle.value != null ? String(subtitle.value) : JSON.stringify(subtitle))
      : subtitle;

  return (
    <div className={`bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between ${className}`}>
      <div className="flex-1 min-w-0 pr-3">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
          {title}
        </span>
        <div className="mt-1 text-xl sm:text-2xl font-bold tracking-tight text-slate-900 truncate">
          {displayValue}
        </div>
        {(displaySubtitle || trendText) && (
          <div className="mt-1 flex items-center space-x-1.5 text-xs">
            {trendText ? (
              <span
                className={`inline-flex items-center text-[11px] font-bold ${
                  isPositive ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {isPositive ? (
                  <ArrowUpRight className="w-3 h-3 mr-0.5" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 mr-0.5" />
                )}
                {trendText}
              </span>
            ) : null}
            {displaySubtitle ? (
              <span className="text-[11px] text-slate-400 font-medium truncate">
                {displaySubtitle}
              </span>
            ) : null}
          </div>
        )}
      </div>

      {Icon && (
        <div className={`w-11 h-11 rounded-xl ${scheme.bg} flex items-center justify-center ${scheme.icon} flex-shrink-0 shadow-xs`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
};

export default StatWidget;
