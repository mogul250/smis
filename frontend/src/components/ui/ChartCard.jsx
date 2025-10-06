import React from 'react';
import { motion } from 'framer-motion';

const ChartCard = ({ 
  title, 
  subtitle, 
  action, 
  children, 
  className = '',
  height = 'auto',
  ...props 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={`bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 ${className}`}
      style={{ height }}
      {...props}
    >
      {(title || subtitle || action) && (
        <div className="flex items-center justify-between p-6 pb-4">
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-600">{subtitle}</p>
            )}
          </div>
          {action && (
            <div className="flex-shrink-0">
              {action}
            </div>
          )}
        </div>
      )}
      <div className="px-6 pb-6">
        {children}
      </div>
    </motion.div>
  );
};

export default ChartCard;
