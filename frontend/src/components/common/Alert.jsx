import React from 'react';
import { FiCheckCircle, FiAlertCircle, FiAlertTriangle, FiInfo, FiX } from 'react-icons/fi';

const Alert = ({ 
  children, 
  variant = 'info', 
  dismissible = false,
  onDismiss,
  className = '',
  ...props 
}) => {
  const baseClasses = 'p-4 rounded-md border';
  
  const variantConfig = {
    success: {
      classes: 'bg-green-50 border-green-200 text-green-800',
      icon: FiCheckCircle,
      iconColor: 'text-green-400'
    },
    error: {
      classes: 'bg-red-50 border-red-200 text-red-800',
      icon: FiAlertCircle,
      iconColor: 'text-red-400'
    },
    warning: {
      classes: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      icon: FiAlertTriangle,
      iconColor: 'text-yellow-400'
    },
    info: {
      classes: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: FiInfo,
      iconColor: 'text-blue-400'
    }
  };

  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div 
      className={`${baseClasses} ${config.classes} ${className}`}
      role="alert"
      {...props}
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${config.iconColor}`} aria-hidden="true" />
        </div>
        <div className="ml-3 flex-1">
          {children}
        </div>
        {dismissible && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  variant === 'success' ? 'text-green-500 hover:bg-green-100 focus:ring-green-600' :
                  variant === 'error' ? 'text-red-500 hover:bg-red-100 focus:ring-red-600' :
                  variant === 'warning' ? 'text-yellow-500 hover:bg-yellow-100 focus:ring-yellow-600' :
                  'text-blue-500 hover:bg-blue-100 focus:ring-blue-600'
                }`}
                onClick={onDismiss}
                aria-label="Dismiss alert"
              >
                <FiX className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alert;
