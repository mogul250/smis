import React from 'react';
import { motion } from 'framer-motion';

const DashboardSection = ({ 
  title, 
  subtitle, 
  action, 
  children, 
  className = '',
  delay = 0,
  ...props 
}) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className={`space-y-4 ${className}`}
      {...props}
    >
      {(title || subtitle || action) && (
        <div className="flex items-center justify-between">
          <div>
            {title && (
              <h2 className="text-xl font-semibold text-gray-900 mb-1">{title}</h2>
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
      <div className="space-y-4">
        {children}
      </div>
    </motion.section>
  );
};

export default DashboardSection;
