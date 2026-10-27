import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const StatWidget = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendDirection = 'up',
  color = 'teal',
  className = ''
}) => {
  const colors = {
    teal: {
      bg: 'bg-teal-50',
      icon: 'text-teal-700',
      border: 'border-teal-100'
    },
    navy: {
      bg: 'bg-navy-50',
      icon: 'text-navy-800',
      border: 'border-navy-100'
    },
    amber: {
      bg: 'bg-amber-50',
      icon: 'text-amber-700',
      border: 'border-amber-100'
    },
    emerald: {
      bg: 'bg-emerald-50',
      icon: 'text-emerald-700',
      border: 'border-emerald-100'
    },
    rose: {
      bg: 'bg-rose-50',
      icon: 'text-rose-700',
      border: 'border-rose-100'
    },
    sky: {
      bg: 'bg-sky-50',
      icon: 'text-sky-700',
      border: 'border-sky-100'
    }
  };

  const scheme = colors[color] || colors.teal;

  return (
    <div
      className={`bg-white rounded-2xl border border-navy-100 p-5 shadow-subtle hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-navy-500 uppercase tracking-wider truncate mr-2">
          {title}
        </span>
        {Icon && (
          <div className={`w-9 h-9 rounded-xl ${scheme.bg} flex items-center justify-center ${scheme.icon} border ${scheme.border} flex-shrink-0 shadow-2xs`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <div className="text-2xl font-extrabold tracking-tight text-navy-950 truncate">{value}</div>
        {trend && (
          <div
            className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full ${
              trendDirection === 'up'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {trendDirection === 'up' ? (
              <ArrowUpRight className="w-3 h-3 mr-0.5" />
            ) : (
              <ArrowDownRight className="w-3 h-3 mr-0.5" />
            )}
            <span>{trend}</span>
          </div>
        )}
      </div>

      {subtitle && (
        <p className="mt-1.5 text-xs text-navy-500 font-medium truncate">{subtitle}</p>
      )}
    </div>
  );
};

export default StatWidget;
