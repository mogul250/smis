import React from 'react';
import { motion } from 'framer-motion';

const MetricCard = ({ 
  title, 
  value, 
  change, 
  changeType = 'positive', 
  icon: Icon, 
  description,
  trend,
  className = '',
  ...props 
}) => {
  const changeColor = changeType === 'positive' ? 'text-green-600' : 
                     changeType === 'negative' ? 'text-red-600' : 
                     'text-gray-600';

  const changeBg = changeType === 'positive' ? 'bg-green-50' : 
                  changeType === 'negative' ? 'bg-red-50' : 
                  'bg-gray-50';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={`bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200 ${className}`}
      {...props}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            {Icon && (
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary-green/10">
                <Icon className="w-6 h-6 text-primary-green" />
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
          </div>
          
          {(change || description) && (
            <div className="flex items-center justify-between">
              {change && (
                <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${changeBg} ${changeColor}`}>
                  {trend && <trend className="w-3 h-3 mr-1" />}
                  {change}
                </div>
              )}
              {description && (
                <p className="text-xs text-gray-500">{description}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MetricCard;
