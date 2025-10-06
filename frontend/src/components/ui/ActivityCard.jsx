import React from 'react';
import { motion } from 'framer-motion';

const ActivityCard = ({ 
  title, 
  action, 
  children, 
  className = '',
  loading = false,
  emptyState,
  ...props 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 ${className}`}
      {...props}
    >
      {(title || action) && (
        <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            )}
          </div>
          {action && (
            <div className="flex-shrink-0">
              {action}
            </div>
          )}
        </div>
      )}
      
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-green"></div>
          </div>
        ) : children ? (
          <div className="space-y-4">
            {children}
          </div>
        ) : emptyState ? (
          <div className="text-center py-8">
            {emptyState}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No data available</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Activity Item Component
export const ActivityItem = ({ 
  icon: Icon, 
  title, 
  description, 
  time, 
  status,
  onClick,
  className = '' 
}) => {
  const statusColors = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    default: 'bg-gray-100 text-gray-800'
  };

  return (
    <motion.div
      whileHover={{ x: 4 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={`flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {Icon && (
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-green/10 flex-shrink-0">
          <Icon className="w-5 h-5 text-primary-green" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
            {description && (
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 ml-4">
            {status && (
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || statusColors.default}`}>
                {status}
              </span>
            )}
            {time && (
              <span className="text-xs text-gray-500 whitespace-nowrap">{time}</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ActivityCard;
