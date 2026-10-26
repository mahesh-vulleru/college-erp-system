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
      accent: 'border-teal-100'
    },
    navy: {
      bg: 'bg-navy-50',
      icon: 'text-navy-800',
      accent: 'border-navy-100'
    },
    amber: {
      bg: 'bg-amber-50',
      icon: 'text-amber-700',
      accent: 'border-amber-100'
    },
    emerald: {
      bg: 'bg-emerald-50',
      icon: 'text-emerald-700',
      accent: 'border-emerald-100'
    },
    rose: {
      bg: 'bg-rose-50',
      icon: 'text-rose-700',
      accent: 'border-rose-100'
    }
  };

  const scheme = colors[color] || colors.teal;

  return (
    <div className={`bg-white rounded-xl border border-navy-200/80 p-5 shadow-subtle hover:shadow-card transition-shadow ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-navy-500 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className={`w-9 h-9 rounded-xl ${scheme.bg} flex items-center justify-center ${scheme.icon}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <div className="text-2xl font-bold tracking-tight text-navy-900">{value}</div>
        {trend && (
          <div className={`inline-flex items-center text-xs font-semibold ${
            trendDirection === 'up' ? 'text-emerald-600' : 'text-rose-600'
          }`}>
            {trendDirection === 'up' ? (
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
            )}
            <span>{trend}</span>
          </div>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-navy-500 font-light truncate">{subtitle}</p>
      )}
    </div>
  );
};

export default StatWidget;

