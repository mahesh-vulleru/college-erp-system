import React from 'react';

export const Card = ({
  children,
  title,
  subtitle,
  headerAction,
  footer,
  className = '',
  bodyClassName = ''
}) => {
  return (
    <div className={`bg-white rounded-2xl border border-navy-100 shadow-subtle hover:shadow-card transition-shadow duration-200 overflow-hidden ${className}`}>
      {(title || subtitle || headerAction) && (
        <div className="px-5 sm:px-6 py-4 border-b border-navy-100/80 flex items-center justify-between gap-4">
          <div className="min-w-0">
            {title && <h3 className="text-sm sm:text-base font-bold text-navy-950 tracking-tight truncate">{title}</h3>}
            {subtitle && <p className="text-xs text-navy-500 font-normal mt-0.5 truncate">{subtitle}</p>}
          </div>
          {headerAction && <div className="flex-shrink-0 flex items-center space-x-2">{headerAction}</div>}
        </div>
      )}
      <div className={`p-5 sm:p-6 ${bodyClassName}`}>{children}</div>
      {footer && (
        <div className="px-5 sm:px-6 py-3 bg-navy-50/40 border-t border-navy-100/80 text-xs text-navy-600 font-medium">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
