import React, { useState } from 'react';
import Link from 'next/link';
import { useApi } from '../../hooks/useApi';
import { financeAPI } from '../../services/api';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import LoadingSpinner from '../common/LoadingSpinner';
import {
  FiDollarSign,
  FiBarChart,
  FiUsers,
  FiClipboard,
  FiTrendingUp,
  FiTrendingDown,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiArrowRight,
  FiRefreshCw,
  FiActivity,
  FiBookOpen,
  FiAward,
  FiTarget,
  FiUser,
  FiEdit,
  FiPlus,
  FiCalendar,
  FiCreditCard,
  FiFileText
} from 'react-icons/fi';

const FinanceDashboard = () => {
  const [timeRange, setTimeRange] = useState('7d');
  
  // Add error handling for API calls with fallback data
  const { data: profile, loading: profileLoading, error: profileError, refetch: refetchProfile } = useApi(
    () => financeAPI.getProfile?.() || Promise.resolve({ data: { user: { first_name: 'Finance User' } } }),
    [],
    { fallbackData: { user: { first_name: 'Finance User' } } }
  );
  const { data: overdueFees, loading: overdueLoading, error: overdueError, refetch: refetchOverdue } = useApi(
    () => financeAPI.getOverdueFees?.() || Promise.resolve({ data: { fees: [], totalOutstanding: 0, overdueCount: 0 } }),
    [],
    { fallbackData: { fees: [], totalOutstanding: 0, overdueCount: 0 } }
  );
  // Remove activityAPI reference as it's not available
  const financeActivities = { data: [] };
  const activitiesLoading = false;
  const { data: reports, loading: reportsLoading, error: reportsError, refetch: refetchReports } = useApi(
    () => financeAPI.getFinancialReports?.({ period: 'month' }) || Promise.resolve({ data: { totalRevenue: 0, totalPaid: 0 } }),
    [],
    { fallbackData: { totalRevenue: 0, totalPaid: 0 } }
  );

  const timeRangeOptions = [
    { value: '24h', label: 'Last 24 hours' },
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' }
  ];

  const quickActions = [
    {
      title: 'Manage Fees',
      description: 'Create and manage student fees',
      icon: FiDollarSign,
      href: '/finance/fees',
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      title: 'Generate Reports',
      description: 'Create financial reports',
      icon: FiBarChart,
      href: '/finance/reports',
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      title: 'View Students',
      description: 'Manage student accounts',
      icon: FiUsers,
      href: '/finance/students',
      color: 'bg-purple-500',
      textColor: 'text-purple-600'
    },
    {
      title: 'Create Invoice',
      description: 'Generate student invoices',
      icon: FiFileText,
      href: '/finance/invoices',
      color: 'bg-orange-500',
      textColor: 'text-orange-600'
    }
  ];

  // Process the API data correctly
  const totalRevenue = reports?.totalRevenue || 0;
  const totalOutstanding = reports?.outstandingFees || 0; // API returns outstandingFees, not totalOutstanding
  const totalPaid = totalRevenue; // For now, use totalRevenue as totalPaid since API doesn't return totalPaid

  // overdueFees is an array, so we need to calculate the values
  const overdueFeesArray = Array.isArray(overdueFees) ? overdueFees : [];
  const overdueCount = overdueFeesArray.length;
  const overdueAmount = overdueFeesArray.reduce((sum, fee) => sum + (parseFloat(fee.amount) || 0), 0);

  // Debug logging
  console.log('FinanceDashboard - profile:', profile);
  console.log('FinanceDashboard - overdueFees:', overdueFees);
  console.log('FinanceDashboard - reports:', reports);
  console.log('FinanceDashboard - profileError:', profileError);
  console.log('FinanceDashboard - overdueError:', overdueError);
  console.log('FinanceDashboard - reportsError:', reportsError);

  if (profileLoading) {
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
          <p className="text-gray-600 mt-1">
            Welcome back, {profile?.user?.first_name || 'Finance User'}! Here's your financial overview.
          </p>
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
            onClick={() => {
              refetchProfile();
              refetchOverdue();
              refetchReports();
            }}
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
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</p>
              <div className="flex items-center mt-2">
                <FiTrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+12%</span>
                <span className="text-sm text-gray-500 ml-1">this month</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FiDollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Outstanding Fees</p>
              <p className="text-3xl font-bold text-gray-900">${totalOutstanding.toLocaleString()}</p>
              <div className="flex items-center mt-2">
                <FiAlertCircle className="w-4 h-4 text-orange-500 mr-1" />
                <span className="text-sm text-orange-600">{overdueCount} overdue</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <FiAlertCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Paid</p>
              <p className="text-3xl font-bold text-gray-900">${totalPaid.toLocaleString()}</p>
              <div className="flex items-center mt-2">
                <FiCheckCircle className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">This month</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiCreditCard className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Collection Rate</p>
              <p className="text-3xl font-bold text-gray-900">
                {totalRevenue > 0 ? Math.round(((totalRevenue - totalOutstanding) / totalRevenue) * 100) : 0}%
              </p>
              <div className="flex items-center mt-2">
                <FiTarget className="w-4 h-4 text-purple-500 mr-1" />
                <span className="text-sm text-purple-600">Efficiency</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiTarget className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions & Overdue Fees */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              // Safety check for icon
              if (!Icon) {
                console.warn(`Icon is undefined for action:`, action);
                return null;
              }
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

        {/* Overdue Fees */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Overdue Fees</h3>
            <Button variant="outline" size="sm" href="/finance/overdue">
              View All
            </Button>
          </div>
          {overdueLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : overdueFeesArray.length > 0 ? (
            <div className="space-y-4">
              {overdueFeesArray.slice(0, 5).map((fee, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <FiDollarSign className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{fee.student_name}</p>
                      <p className="text-sm text-gray-500">{fee.fee_type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">${fee.amount}</p>
                    <p className="text-xs text-gray-500">
                      Due: {new Date(fee.due_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FiCheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Overdue Fees</h3>
              <p className="text-gray-500">All fees are up to date!</p>
            </div>
          )}
        </Card>
      </div>

      {/* Financial Summary & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Summary */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Financial Summary</h3>
            <Button variant="outline" size="sm" href="/finance/reports">
              View Reports
            </Button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <FiDollarSign className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">Monthly Revenue</p>
                  <p className="text-sm text-gray-500">Total income this month</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">${totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-green-600">+12% from last month</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <FiCreditCard className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">Payments Processed</p>
                  <p className="text-sm text-gray-500">Successful transactions</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">${totalPaid.toLocaleString()}</p>
                <p className="text-sm text-blue-600">This month</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <FiAlertCircle className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="font-medium text-gray-900">Outstanding Amount</p>
                  <p className="text-sm text-gray-500">Fees pending collection</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-orange-600">${totalOutstanding.toLocaleString()}</p>
                <p className="text-sm text-orange-600">{overdueCount} overdue</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>
          {activitiesLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="space-y-4">
              {financeActivities?.data?.length > 0 ? (
                financeActivities.data.map((activity, index) => {
                  const getActivityColor = (action) => {
                    switch (action) {
                      case 'payment_received': return 'bg-green-500';
                      case 'invoice_generated': return 'bg-blue-500';
                      case 'fee_overdue': return 'bg-orange-500';
                      case 'report_generated': return 'bg-purple-500';
                      default: return 'bg-gray-500';
                    }
                  };

                  return (
                    <div key={activity.id || index} className="flex items-start space-x-3">
                      <div className={`w-2 h-2 ${getActivityColor(activity.action)} rounded-full mt-2`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                        <p className="text-sm text-gray-600">
                          {activity.user_name} - {activity.user_role}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(activity.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <FiActivity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-500">No recent financial activities</p>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default FinanceDashboard;
