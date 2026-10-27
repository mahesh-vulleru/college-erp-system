import React from 'react';

export const Badge = ({
  children,
  variant = 'neutral',
  size = 'sm',
  dot = false,
  className = ''
}) => {
  const variants = {
    neutral: 'bg-navy-50 text-navy-700 border-navy-200/80',
    primary: 'bg-navy-950 text-white border-navy-950',
    teal: 'bg-teal-50 text-teal-800 border-teal-200/80',
    // Green status badge
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    // Amber status badge
    warning: 'bg-amber-50 text-amber-800 border-amber-200/80',
    // Red status badge
    danger: 'bg-rose-50 text-rose-800 border-rose-200/80',
    // Blue status badge
    info: 'bg-sky-50 text-sky-800 border-sky-200/80',
    blue: 'bg-sky-50 text-sky-800 border-sky-200/80',
    purple: 'bg-purple-50 text-purple-800 border-purple-200/80'
  };

  const dotColors = {
    neutral: 'bg-navy-400',
    primary: 'bg-white',
    teal: 'bg-teal-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-sky-500',
    blue: 'bg-sky-500',
    purple: 'bg-purple-500'
  };

  const sizes = {
    xs: 'px-2 py-0.5 text-[10px] leading-tight',
    sm: 'px-2.5 py-0.5 text-xs font-semibold',
    md: 'px-3 py-1 text-xs font-semibold'
  };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border shadow-2xs ${
        variants[variant] || variants.neutral
      } ${sizes[size] || sizes.sm} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full mr-1.5 flex-shrink-0 ${
            dotColors[variant] || dotColors.neutral
          }`}
        />
      )}
      {children}
    </span>
  );
};

export default Badge;
