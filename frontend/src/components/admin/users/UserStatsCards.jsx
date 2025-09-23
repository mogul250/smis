import React from 'react';
import Card from '../../common/Card';
import {
  FiUsers,
  FiUserCheck,
  FiUserPlus,
  FiTrendingUp,
  FiTrendingDown,
  FiActivity,
  FiShield,
  FiBookOpen
} from 'react-icons/fi';

const UserStatsCards = ({ stats, totalUsers, loading }) => {
  const statsCards = [
    {
      title: 'Total Users',
      value: totalUsers || 0,
      change: '+12%',
      changeType: 'positive',
      icon: FiUsers,
      color: 'blue',
      description: 'All system users'
    },
    {
      title: 'Active Users',
      value: stats.activeUsers || 0,
      change: `${totalUsers > 0 ? Math.round((stats.activeUsers / totalUsers) * 100) : 0}%`,
      changeType: 'positive',
      icon: FiUserCheck,
      color: 'green',
      description: 'Currently active'
    },
    {
      title: 'New This Month',
      value: stats.newThisMonth || 0,
      change: '+8%',
      changeType: 'positive',
      icon: FiUserPlus,
      color: 'purple',
      description: 'Recent additions'
    },
    {
      title: 'Students',
      value: stats.byRole?.student || 0,
      change: '+5%',
      changeType: 'positive',
      icon: FiBookOpen,
      color: 'indigo',
      description: 'Enrolled students'
    }
  ];

  const getColorClasses = (color) => {
    const colorMap = {
      blue: {
        bg: 'bg-blue-50',
        icon: 'text-blue-600',
        iconBg: 'bg-blue-100'
      },
      green: {
        bg: 'bg-green-50',
        icon: 'text-green-600',
        iconBg: 'bg-green-100'
      },
      purple: {
        bg: 'bg-purple-50',
        icon: 'text-purple-600',
        iconBg: 'bg-purple-100'
      },
      indigo: {
        bg: 'bg-indigo-50',
        icon: 'text-indigo-600',
        iconBg: 'bg-indigo-100'
      },
      orange: {
        bg: 'bg-orange-50',
        icon: 'text-orange-600',
        iconBg: 'bg-orange-100'
      },
      red: {
        bg: 'bg-red-50',
        icon: 'text-red-600',
        iconBg: 'bg-red-100'
      }
    };
    return colorMap[color] || colorMap.blue;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsCards.map((stat, index) => {
        const Icon = stat.icon;
        const colors = getColorClasses(stat.color);
        const isPositive = stat.changeType === 'positive';
        
        return (
          <Card key={index} className="p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold text-gray-900 mb-2">
                  {stat.value.toLocaleString()}
                </p>
                <div className="flex items-center">
                  {isPositive ? (
                    <FiTrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <FiTrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm font-medium ${
                    isPositive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">
                    {stat.description}
                  </span>
                </div>
              </div>
              <div className={`w-12 h-12 ${colors.iconBg} rounded-lg flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${colors.icon}`} />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

// Additional role breakdown component
export const RoleBreakdownCard = ({ stats, loading }) => {
  const roles = [
    { key: 'student', label: 'Students', color: 'blue', icon: FiBookOpen },
    { key: 'teacher', label: 'Teachers', color: 'green', icon: FiUsers },
    { key: 'hod', label: 'HODs', color: 'purple', icon: FiShield },
    { key: 'finance', label: 'Finance', color: 'orange', icon: FiActivity },
    { key: 'admin', label: 'Admins', color: 'red', icon: FiShield }
  ];

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-200 rounded mr-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-8"></div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  const total = Object.values(stats.byRole || {}).reduce((sum, count) => sum + count, 0);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">User Distribution</h3>
      <div className="space-y-3">
        {roles.map((role) => {
          const count = stats.byRole?.[role.key] || 0;
          const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
          const Icon = role.icon;
          
          return (
            <div key={role.key} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-8 h-8 bg-${role.color}-100 rounded flex items-center justify-center mr-3`}>
                  <Icon className={`w-4 h-4 text-${role.color}-600`} />
                </div>
                <span className="text-sm font-medium text-gray-900">{role.label}</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm font-bold text-gray-900 mr-2">{count}</span>
                <span className="text-xs text-gray-500">({percentage}%)</span>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Progress bars */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="space-y-2">
          {roles.map((role) => {
            const count = stats.byRole?.[role.key] || 0;
            const percentage = total > 0 ? (count / total) * 100 : 0;
            
            return (
              <div key={`${role.key}-bar`} className="flex items-center">
                <span className="text-xs text-gray-500 w-16">{role.label}</span>
                <div className="flex-1 mx-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`bg-${role.color}-500 h-2 rounded-full transition-all duration-300`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-xs text-gray-500 w-8">{Math.round(percentage)}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

export default UserStatsCards;
