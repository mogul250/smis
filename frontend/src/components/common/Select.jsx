import React from 'react';

const Select = ({ 
  label, 
  value, 
  onChange, 
  children, 
  className = '', 
  error = '', 
  required = false,
  disabled = false,
  placeholder = '',
  ...props 
}) => {
  const baseClasses = `
    w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    disabled:bg-gray-100 disabled:cursor-not-allowed
    ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        className={baseClasses}
        disabled={disabled}
        required={required}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {children}
      </select>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default Select;
