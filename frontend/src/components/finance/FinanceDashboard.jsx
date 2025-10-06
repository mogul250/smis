import React, { useState } from 'react';
import Link from 'next/link';
import { useApi } from '../../hooks/useApi';
import { financeAPI } from '../../services/api';
import Button from '../common/Button';
import Badge from '../common/Badge';
import LoadingSpinner from '../common/LoadingSpinner';
import MetricCard from '../ui/MetricCard';
import DashboardSection from '../ui/DashboardSection';
import ChartCard from '../ui/ChartCard';
import ActivityCard, { ActivityItem } from '../ui/ActivityCard';
import QuickActionCard from '../ui/QuickActionCard';
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
    <div className="space-y-8 w-full max-w-7xl mx-auto">
      {/* Header */}
      <DashboardSection
        title="Finance Dashboard"
        subtitle={`Welcome back, ${profile?.user?.first_name || 'Finance User'}! Here's your financial overview.`}
        action={
          <div className="flex items-center gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-green focus:border-transparent"
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
        }
      />

      {/* Financial Overview */}
      <DashboardSection title="Financial Overview" delay={0.1}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Revenue"
            value={`$${totalRevenue.toLocaleString()}`}
            change="+12% this month"
            changeType="positive"
            trend={FiTrendingUp}
            icon={FiDollarSign}
          />

          <MetricCard
            title="Outstanding Fees"
            value={`$${totalOutstanding.toLocaleString()}`}
            change={`${overdueCount} overdue`}
            changeType="warning"
            icon={FiAlertCircle}
          />

          <MetricCard
            title="Total Paid"
            value={`$${totalPaid.toLocaleString()}`}
            change="This month"
            changeType="positive"
            icon={FiCreditCard}
          />

          <MetricCard
            title="Collection Rate"
            value={`${totalRevenue > 0 ? Math.round(((totalRevenue - totalOutstanding) / totalRevenue) * 100) : 0}%`}
            change="Efficiency"
            changeType="neutral"
            icon={FiTarget}
          />
        </div>
      </DashboardSection>

      {/* Quick Actions & Overdue Fees */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <DashboardSection
          title="Quick Actions"
          action={
            <Button variant="outline" size="sm">
              View All
            </Button>
          }
        >
          <div className="grid grid-cols-1 gap-4">
            {quickActions.map((action, index) => (
              <QuickActionCard
                key={index}
                title={action.title}
                description={action.description}
                icon={action.icon}
                href={action.href}
                color={action.color}
              />
            ))}
          </div>
        </DashboardSection>

        {/* Overdue Fees */}
        <ActivityCard
          title="Overdue Fees"
          loading={overdueLoading}
          action={
            <Button variant="outline" size="sm" href="/finance/overdue">
              View All
            </Button>
          }
          emptyState={
            <div className="text-center text-gray-500">
              <FiCheckCircle className="w-12 h-12 mx-auto mb-4 text-green-300" />
              <p>No Overdue Fees</p>
              <p className="text-xs mt-1">All fees are up to date!</p>
            </div>
          }
        >
          {overdueFeesArray.slice(0, 5).map((fee, index) => (
            <ActivityItem
              key={index}
              icon={FiDollarSign}
              title={fee.student_name}
              description={fee.fee_type}
              status="overdue"
              time={`$${fee.amount} - Due: ${new Date(fee.due_date).toLocaleDateString()}`}
            />
          ))}
        </ActivityCard>
      </div>

      {/* Financial Summary & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Summary */}
        <ActivityCard
          title="Financial Summary"
          action={
            <Button variant="outline" size="sm" href="/finance/reports">
              View Reports
            </Button>
          }
        >
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
        </ActivityCard>

        {/* Recent Activity */}
        <ActivityCard
          title="Recent Activity"
          loading={activitiesLoading}
          action={
            <Button variant="outline" size="sm">
              View All
            </Button>
          }
          emptyState={
            <div className="text-center text-gray-500">
              <FiActivity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No Recent Activity</p>
              <p className="text-xs mt-1">Financial activities will appear here</p>
            </div>
          }
        >
          {financeActivities?.data?.map((activity, index) => {
            const getActivityIcon = (action) => {
              switch (action) {
                case 'payment_received': return FiDollarSign;
                case 'invoice_generated': return FiFileText;
                case 'fee_overdue': return FiAlertCircle;
                case 'report_generated': return FiBarChart;
                default: return FiActivity;
              }
            };

            return (
              <ActivityItem
                key={activity.id || index}
                icon={getActivityIcon(activity.action)}
                title={activity.description}
                description={`${activity.user_name} - ${activity.user_role}`}
                time={new Date(activity.created_at).toLocaleString()}
              />
            );
          })}
        </ActivityCard>
      </div>
    </div>
  );
};

export default FinanceDashboard;
