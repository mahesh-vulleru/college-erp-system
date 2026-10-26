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
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className}`}>
      {(title || subtitle || headerAction) && (
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            {title && <h3 className="text-base font-semibold text-gray-900">{title}</h3>}
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className={`p-5 ${bodyClassName}`}>{children}</div>
      {footer && (
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
