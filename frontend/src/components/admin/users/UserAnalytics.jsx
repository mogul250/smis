import React from 'react';
import Card from '../../common/Card';
import { 
  FiTrendingUp, 
  FiTrendingDown,
  FiUsers,
  FiUserPlus,
  FiUserCheck,
  FiActivity,
  FiCalendar,
  FiClock
} from 'react-icons/fi';

const UserAnalytics = ({ stats, loading }) => {
  const analyticsData = [
    {
      title: 'User Growth',
      description: 'New users this month',
      value: stats.newThisMonth || 0,
      change: '+23%',
      changeType: 'positive',
      icon: FiUserPlus,
      color: 'blue'
    },
    {
      title: 'Active Rate',
      description: 'Users active in last 30 days',
      value: `${stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%`,
      change: '+5%',
      changeType: 'positive',
      icon: FiActivity,
      color: 'green'
    },
    {
      title: 'Login Rate',
      description: 'Users logged in today',
      value: Math.round(stats.activeUsers * 0.3) || 0,
      change: '-2%',
      changeType: 'negative',
      icon: FiClock,
      color: 'orange'
    },
    {
      title: 'Completion Rate',
      description: 'Profiles completed',
      value: `${Math.round(stats.activeUsers * 0.85) || 0}%`,
      change: '+12%',
      changeType: 'positive',
      icon: FiUserCheck,
      color: 'purple'
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
      orange: {
        bg: 'bg-orange-50',
        icon: 'text-orange-600',
        iconBg: 'bg-orange-100'
      },
      purple: {
        bg: 'bg-purple-50',
        icon: 'text-purple-600',
        iconBg: 'bg-purple-100'
      }
    };
    return colorMap[color] || colorMap.blue;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {analyticsData.map((item, index) => {
        const Icon = item.icon;
        const colors = getColorClasses(item.color);
        const isPositive = item.changeType === 'positive';
        
        return (
          <Card key={index} className="p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {item.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 mb-2">
                  {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
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
                    {item.change}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">
                    {item.description}
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

// User Activity Timeline Component
export const UserActivityTimeline = ({ activities = [], loading }) => {
  const mockActivities = [
    {
      id: 1,
      type: 'user_created',
      message: 'New student John Doe was created',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      icon: FiUserPlus,
      color: 'blue'
    },
    {
      id: 2,
      type: 'user_login',
      message: 'Teacher Sarah Wilson logged in',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      icon: FiActivity,
      color: 'green'
    },
    {
      id: 3,
      type: 'user_updated',
      message: 'Admin updated user permissions',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      icon: FiUsers,
      color: 'orange'
    },
    {
      id: 4,
      type: 'user_deactivated',
      message: 'User account was deactivated',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
      icon: FiUserCheck,
      color: 'red'
    }
  ];

  const displayActivities = activities.length > 0 ? activities : mockActivities;

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - new Date(timestamp);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  const getColorClasses = (color) => {
    const colorMap = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      orange: 'bg-orange-100 text-orange-600',
      red: 'bg-red-100 text-red-600',
      purple: 'bg-purple-100 text-purple-600'
    };
    return colorMap[color] || colorMap.blue;
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="space-y-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <div className="flex items-center text-sm text-gray-500">
          <FiClock className="w-4 h-4 mr-1" />
          Live updates
        </div>
      </div>
      
      <div className="space-y-4">
        {displayActivities.map((activity, index) => {
          const Icon = activity.icon;
          const colorClasses = getColorClasses(activity.color);
          
          return (
            <div key={activity.id || index} className="flex items-start space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colorClasses}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">{activity.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {getTimeAgo(activity.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-200">
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          View all activity →
        </button>
      </div>
    </Card>
  );
};

// User Distribution Chart Component
export const UserDistributionChart = ({ stats, loading }) => {
  const roles = [
    { key: 'student', label: 'Students', color: 'bg-blue-500' },
    { key: 'teacher', label: 'Teachers', color: 'bg-green-500' },
    { key: 'hod', label: 'HODs', color: 'bg-purple-500' },
    { key: 'finance', label: 'Finance', color: 'bg-orange-500' },
    { key: 'admin', label: 'Admins', color: 'bg-red-500' }
  ];

  const total = Object.values(stats.byRole || {}).reduce((sum, count) => sum + count, 0);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">User Distribution</h3>
      
      {/* Simple bar chart */}
      <div className="space-y-4">
        {roles.map((role) => {
          const count = stats.byRole?.[role.key] || 0;
          const percentage = total > 0 ? (count / total) * 100 : 0;
          
          return (
            <div key={role.key}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{role.label}</span>
                <span className="text-sm text-gray-500">{count} ({Math.round(percentage)}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`${role.color} h-2 rounded-full transition-all duration-300`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-200 text-center">
        <p className="text-sm text-gray-500">
          Total: <span className="font-medium text-gray-900">{total} users</span>
        </p>
      </div>
    </Card>
  );
};

export default UserAnalytics;
