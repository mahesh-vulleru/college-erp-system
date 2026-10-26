import React from 'react';

export const Textarea = ({
  label,
  id,
  name,
  value,
  onChange,
  placeholder,
  error,
  rows = 3,
  required = false,
  disabled = false,
  className = '',
  helperText
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={id || name} className="block text-xs font-semibold text-navy-700 uppercase tracking-wider mb-1.5">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <textarea
        id={id || name}
        name={name}
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 disabled:bg-warm-100 disabled:text-navy-400 ${
          error
            ? 'border-rose-300 text-rose-900 focus:border-rose-500 focus:ring-rose-500/20'
            : 'border-navy-200 text-navy-900 hover:border-navy-300'
        }`}
      />
      {error && <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-navy-400">{helperText}</p>}
    </div>
  );
};

export default Textarea;

