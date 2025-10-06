import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const QuickActionCard = ({ 
  title, 
  description, 
  icon: Icon, 
  href, 
  onClick, 
  color = 'bg-primary-green',
  className = '',
  ...props 
}) => {
  const Component = href ? Link : motion.div;
  const componentProps = href ? { href } : { onClick };

  return (
    <Component
      {...componentProps}
      className={`block ${className}`}
      {...props}
    >
      <motion.div
        whileHover={{ y: -2, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
      >
        <div className="flex items-start gap-4">
          {Icon && (
            <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${color} group-hover:scale-110 transition-transform duration-200`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900 mb-2 group-hover:text-primary-green transition-colors duration-200">
              {title}
            </h3>
            {description && (
              <p className="text-sm text-gray-600 leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-end mt-4">
          <div className="flex items-center text-sm text-gray-500 group-hover:text-primary-green transition-colors duration-200">
            <span>Go to</span>
            <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </motion.div>
    </Component>
  );
};

export default QuickActionCard;
