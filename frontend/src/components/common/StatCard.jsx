import React from 'react';
import Card from './Card';

const StatCard = ({ 
  title, 
  value, 
  trend, 
  trendValue, 
  trendLabel, 
  icon: Icon, 
  iconColor = 'green',
  className = '',
  ...props 
}) => {
  const iconColorClasses = {
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600',
    gray: 'bg-gray-100 text-gray-600'
  };

  const trendColorClasses = {
    up: 'text-green-500',
    down: 'text-red-500',
    neutral: 'text-gray-500'
  };

  return (
    <Card className={`p-4 sm:p-6 hover:shadow-md transition-shadow duration-200 ${className}`} {...props}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{value}</p>
          
          {(trend || trendValue || trendLabel) && (
            <div className="flex items-center mt-2 sm:mt-3">
              {trend && (
                <trend className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 ${trendColorClasses[trend === 'up' ? 'up' : trend === 'down' ? 'down' : 'neutral']}`} />
              )}
              {trendValue && (
                <span className={`text-xs sm:text-sm font-medium ${trendColorClasses[trend === 'up' ? 'up' : trend === 'down' ? 'down' : 'neutral']}`}>
                  {trendValue}
                </span>
              )}
              {trendLabel && (
                <span className="text-xs sm:text-sm text-gray-500 ml-1 truncate">{trendLabel}</span>
              )}
            </div>
          )}
        </div>

        {Icon && (
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${iconColorClasses[iconColor]}`}>
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatCard;
