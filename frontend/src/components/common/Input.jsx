import React, { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  error,
  helperText,
  className = '',
  containerClassName = '',
  required = false,
  icon: Icon,
  type = 'text',
  ...props
}, ref) => {
  const baseClasses = 'block w-full border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 sm:text-sm transition-colors';

  const stateClasses = error
    ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
    : 'border-gray-300 focus:ring-primary-light focus:border-primary-light';

  const paddingClasses = Icon ? 'pl-10 pr-3 py-2' : 'px-3 py-2';
  const isTextarea = type === 'textarea';

  return (
    <div className={containerClassName}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {Icon && !isTextarea && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}

        {isTextarea ? (
          <textarea
            ref={ref}
            className={`${baseClasses} ${stateClasses} px-3 py-2 ${className}`}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${props.id}-error` : helperText ? `${props.id}-helper` : undefined}
            {...props}
          />
        ) : (
          <input
            ref={ref}
            type={type}
            className={`${baseClasses} ${stateClasses} ${paddingClasses} ${className}`}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${props.id}-error` : helperText ? `${props.id}-helper` : undefined}
            {...props}
          />
        )}
      </div>
      
      {error && (
        <p 
          id={`${props.id}-error`}
          className="mt-1 text-sm text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p 
          id={`${props.id}-helper`}
          className="mt-1 text-sm text-gray-500"
        >
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
