import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApi } from '../../hooks/useApi';
import { adminAPI } from '../../services/api';
import Card from '../common/Card';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import {
  FiUsers,
  FiBookOpen,
  FiCalendar,
  FiSettings,
  FiBarChart,
  FiTrendingUp,
  FiTrendingDown,
  FiActivity,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiArrowRight,
  FiPlus,
  FiRefreshCw
} from 'react-icons/fi';

const AdminDashboard = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const { data: stats, loading: statsLoading, refetch: refetchStats } = useApi(adminAPI.getSystemStats);
  const { data: recentUsers, loading: usersLoading } = useApi(() => adminAPI.getAllUsers({ limit: 5 }));
  const { data: systemAlerts, loading: alertsLoading } = useApi(() => activityAPI.getSystemAlerts({ limit: 5 }));

  const timeRangeOptions = [
    { value: '24h', label: 'Last 24 hours' },
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' }
  ];

  const quickActions = [
    {
      title: 'Create User',
      description: 'Add new student, teacher, or staff',
      icon: FiUsers,
      href: '/admin/users',
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      title: 'Manage Calendar',
      description: 'Add events and academic dates',
      icon: FiCalendar,
      href: '/admin/calendar',
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      title: 'System Settings',
      description: 'Configure system preferences',
      icon: FiSettings,
      href: '/admin/system',
      color: 'bg-purple-500',
      textColor: 'text-purple-600'
    },
    {
      title: 'View Analytics',
      description: 'System performance and usage',
      icon: FiBarChart,
      href: '/admin/analytics',
      color: 'bg-orange-500',
      textColor: 'text-orange-600'
    }
  ];

  const systemHealth = [
    { label: 'Database', status: 'healthy', value: '99.9%' },
    { label: 'API Response', status: 'healthy', value: '120ms' },
    { label: 'Active Users', status: 'healthy', value: stats?.totalUsers || 0 },
    { label: 'System Load', status: 'warning', value: '78%' }
  ];

  if (statsLoading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your school management system.</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {timeRangeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            icon={FiRefreshCw}
            onClick={refetchStats}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
              <div className="flex items-center mt-2">
                <FiTrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+12%</span>
                <span className="text-sm text-gray-500 ml-1">from last month</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiUsers className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Students</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.totalStudents || 0}</p>
              <div className="flex items-center mt-2">
                <FiTrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+8%</span>
                <span className="text-sm text-gray-500 ml-1">from last month</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FiBookOpen className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Teachers</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.totalTeachers || 0}</p>
              <div className="flex items-center mt-2">
                <FiTrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+3%</span>
                <span className="text-sm text-gray-500 ml-1">from last month</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiUsers className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Sessions</p>
              <p className="text-3xl font-bold text-gray-900">24</p>
              <div className="flex items-center mt-2">
                <FiActivity className="w-4 h-4 text-blue-500 mr-1" />
                <span className="text-sm text-blue-600">Live</span>
                <span className="text-sm text-gray-500 ml-1">right now</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <FiActivity className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* System Health & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
            <div className="flex items-center text-sm text-green-600">
              <FiCheckCircle className="w-4 h-4 mr-1" />
              All Systems Operational
            </div>
          </div>
          <div className="space-y-4">
            {systemHealth.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{item.label}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                  <div className={`w-2 h-2 rounded-full ${
                    item.status === 'healthy' ? 'bg-green-500' : 
                    item.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            <Button variant="outline" size="sm" icon={FiPlus}>
              Add New
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link 
                  key={index} 
                  href={action.href}
                  className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all duration-200 text-left group"
                >
                  <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">{action.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{action.description}</p>
                  <div className="flex items-center text-sm text-gray-500 group-hover:text-gray-700">
                    <span>Go to</span>
                    <FiArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Users</h3>
            <Button variant="outline" size="sm" href="/admin/users">
              View All
            </Button>
          </div>
          {usersLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="space-y-4">
              {recentUsers?.users?.slice(0, 5).map((user, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {user.first_name?.[0]}{user.last_name?.[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-sm text-gray-500 truncate">{user.email}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.role === 'admin' ? 'bg-red-100 text-red-800' :
                      user.role === 'teacher' ? 'bg-blue-100 text-blue-800' :
                      user.role === 'student' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role}
                    </span>
                    <FiClock className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">System Alerts</h3>
            <Button variant="outline" size="sm">
              Manage
            </Button>
          </div>
          {alertsLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="space-y-4">
              {systemAlerts?.data?.length > 0 ? (
                systemAlerts.data.map((alert, index) => {
                  const IconComponent = alert.icon === 'check-circle' ? FiCheckCircle :
                                      alert.icon === 'alert-circle' ? FiAlertCircle : FiActivity;
                  const iconColor = alert.type === 'success' ? 'text-green-500' :
                                  alert.type === 'error' ? 'text-red-500' :
                                  alert.type === 'warning' ? 'text-yellow-500' : 'text-blue-500';

                  return (
                    <div key={alert.id || index} className="flex items-start space-x-3">
                      <IconComponent className={`w-5 h-5 ${iconColor} mt-0.5`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                        {alert.message && (
                          <p className="text-sm text-gray-600">{alert.message}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <FiCheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-sm text-gray-500">No recent system alerts</p>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
