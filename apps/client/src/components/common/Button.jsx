import React from 'react';

export const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  onClick,
  className = '',
  icon: Icon,
  iconPosition = 'left'
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const variants = {
    primary: 'bg-navy-900 hover:bg-navy-800 text-white focus:ring-navy-700 shadow-subtle',
    teal: 'bg-teal-600 hover:bg-teal-700 text-white focus:ring-teal-500 shadow-subtle',
    secondary: 'bg-white hover:bg-warm-100 text-navy-800 border border-navy-200 focus:ring-navy-400 shadow-subtle',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-subtle',
    outline: 'border border-navy-300 text-navy-800 hover:bg-navy-50 focus:ring-navy-400',
    ghost: 'text-navy-700 hover:bg-navy-100/60 hover:text-navy-900 focus:ring-navy-400',
    soft: 'bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200'
  };

  const sizes = {
    xs: 'px-2 py-1 text-xs rounded-md',
    sm: 'px-3 py-1.5 text-xs rounded-md',
    md: 'px-4 py-2 text-sm rounded-lg',
    lg: 'px-5 py-2.5 text-base rounded-lg'
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseClasses} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : Icon && iconPosition === 'left' ? (
        <Icon className={`w-4 h-4 ${children ? 'mr-2' : ''}`} />
      ) : null}

      {children}

      {!isLoading && Icon && iconPosition === 'right' && (
        <Icon className={`w-4 h-4 ${children ? 'ml-2' : ''}`} />
      )}
    </button>
  );
};

export default Button;
