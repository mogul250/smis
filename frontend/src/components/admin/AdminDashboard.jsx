import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApi } from '../../hooks/useApi';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import NetworkActivityChart from '../charts/NetworkActivityChart';
import UserGrowthChart from '../charts/UserGrowthChart';
import MetricCard from '../ui/MetricCard';
import DashboardSection from '../ui/DashboardSection';
import ChartCard from '../ui/ChartCard';
import ActivityCard, { ActivityItem } from '../ui/ActivityCard';
import QuickActionCard from '../ui/QuickActionCard';
import Button from '../common/Button';
import {
  FiUsers,
  FiUser,
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



  if (statsLoading) {
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
        title="Admin Dashboard"
        subtitle={`Welcome back, Here's what's happening with your system.`}
        action={
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Import Data
            </Button>
          </div>
        }
      />

      {/* Metrics Overview */}
      <DashboardSection title="Overview" delay={0.1}>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <MetricCard
            title="Total Users"
            value={stats?.totalUsers || 0}
            change="+12% from last month"
            changeType="positive"
            trend={FiTrendingUp}
            icon={FiUsers}
          />

          <MetricCard
            title="Students"
            value={stats?.totalStudents || 0}
            change="+8% from last month"
            changeType="positive"
            trend={FiTrendingUp}
            icon={FiBookOpen}
          />

          <MetricCard
            title="Teachers"
            value={stats?.totalTeachers || 0}
            change="+3% from last month"
            changeType="positive"
            trend={FiTrendingUp}
            icon={FiUsers}
          />

          <MetricCard
            title="Active Sessions"
            value="24"
            change="Live right now"
            changeType="neutral"
            icon={FiActivity}
          />
        </div>
      </DashboardSection>

      {/* Analytics & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Network Activity Chart */}
        <ChartCard
          title="Network Activity"
          subtitle={
            <div className="flex items-center text-sm text-green-600">
              <FiActivity className="w-4 h-4 mr-1" />
              Real-time
            </div>
          }
        >
          <NetworkActivityChart height={250} />
        </ChartCard>

        {/* Quick Actions */}
        <DashboardSection
          title="Quick Actions"
          action={
            <Button variant="outline" size="sm" icon={FiPlus}>
              Add New
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
      </div>

      {/* User Growth Chart */}
      <ChartCard
        title="User Growth Trend"
        subtitle={
          <div className="flex items-center text-sm text-green-600">
            <FiTrendingUp className="w-4 h-4 mr-1" />
            Growing
          </div>
        }
      >
        <UserGrowthChart type="line" height={300} />
      </ChartCard>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityCard
          title="Recent Users"
          loading={usersLoading}
          action={
            <Button variant="outline" size="sm" href="/admin/users">
              View All
            </Button>
          }
          emptyState={
            <div className="text-center text-gray-500">
              <FiUser className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No recent users found</p>
            </div>
          }
        >
          {recentUsers?.users?.slice(0, 5).map((user, index) => (
            <ActivityItem
              key={index}
              icon={FiUser}
              title={`${user.first_name} ${user.last_name}`}
              description={user.email}
              status={user.role}
              time="Recently joined"
            />
          ))}
        </ActivityCard>

        <ActivityCard
          title="System Alerts"
          loading={alertsLoading}
          action={
            <Button variant="outline" size="sm">
              Manage
            </Button>
          }
          emptyState={
            <div className="text-center text-gray-500">
              <FiCheckCircle className="w-12 h-12 mx-auto mb-4 text-green-300" />
              <p>No recent system alerts</p>
              <p className="text-xs mt-1">All systems are running smoothly</p>
            </div>
          }
        >
          {systemAlerts?.data?.map((alert, index) => {
            const IconComponent = alert.icon === 'check-circle' ? FiCheckCircle :
                                alert.icon === 'alert-circle' ? FiAlertCircle : FiActivity;

            return (
              <ActivityItem
                key={alert.id || index}
                icon={IconComponent}
                title={alert.title}
                description={alert.message}
                status={alert.type}
                time={new Date(alert.timestamp).toLocaleString()}
              />
            );
          })}
        </ActivityCard>
      </div>
    </div>
  );
};

export default AdminDashboard;
