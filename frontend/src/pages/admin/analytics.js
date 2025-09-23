import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { adminAPI } from '../../services/apiService';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import UserAnalytics, { UserActivityTimeline, UserDistributionChart } from '../../components/admin/users/UserAnalytics';
import UserStatsCards from '../../components/admin/users/UserStatsCards';
import {
  FiBarChart,
  FiTrendingUp,
  FiUsers,
  FiActivity,
  FiDownload,
  FiRefreshCw,
  FiCalendar,
  FiFilter
} from 'react-icons/fi';

const AdminAnalytics = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('30d');
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    newThisMonth: 0,
    byRole: {}
  });
  const [systemStats, setSystemStats] = useState({
    totalLogins: 0,
    avgSessionTime: 0,
    bounceRate: 0,
    systemUptime: 0
  });

  // Check authentication and authorization
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
  }, [isAuthenticated, user, router]);

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch users data for analytics
      const usersResponse = await adminAPI.getAllUsers({ limit: 1000 });
      const users = usersResponse.data.users || [];

      // Calculate user statistics
      const stats = {
        totalUsers: users.length,
        activeUsers: users.filter(u => u.status === 'active').length,
        newThisMonth: users.filter(u => {
          const createdDate = new Date(u.created_at);
          const now = new Date();
          return createdDate.getMonth() === now.getMonth() &&
                 createdDate.getFullYear() === now.getFullYear();
        }).length,
        byRole: {}
      };

      // Count by role
      users.forEach(user => {
        stats.byRole[user.role] = (stats.byRole[user.role] || 0) + 1;
      });

      setUserStats(stats);

      // Mock system stats (in real app, fetch from backend)
      setSystemStats({
        totalLogins: Math.floor(stats.totalUsers * 2.3),
        avgSessionTime: 24,
        bounceRate: 12,
        systemUptime: 99.9
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchAnalytics();
    }
  }, [isAuthenticated, user, timeRange]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  // Handle export
  const handleExport = () => {
    // Mock export functionality
    const data = {
      userStats,
      systemStats,
      exportDate: new Date().toISOString(),
      timeRange
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  const systemMetrics = [
    {
      title: 'Total Logins',
      value: systemStats.totalLogins,
      change: '+15%',
      changeType: 'positive',
      icon: FiActivity,
      color: 'blue'
    },
    {
      title: 'Avg Session Time',
      value: `${systemStats.avgSessionTime}m`,
      change: '+8%',
      changeType: 'positive',
      icon: FiTrendingUp,
      color: 'green'
    },
    {
      title: 'Bounce Rate',
      value: `${systemStats.bounceRate}%`,
      change: '-3%',
      changeType: 'positive',
      icon: FiBarChart,
      color: 'orange'
    },
    {
      title: 'System Uptime',
      value: `${systemStats.systemUptime}%`,
      change: '+0.1%',
      changeType: 'positive',
      icon: FiActivity,
      color: 'purple'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-6 max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                    <FiBarChart className="mr-3 text-blue-600" />
                    Analytics Dashboard
                  </h1>
                  <p className="text-gray-600 mt-1">
                    System performance and user insights
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  {/* Time Range Selector */}
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                    <option value="1y">Last year</option>
                  </select>

                  <Button
                    variant="outline"
                    icon={FiRefreshCw}
                    onClick={handleRefresh}
                    loading={refreshing}
                    size="sm"
                  >
                    Refresh
                  </Button>
                  <Button
                    variant="outline"
                    icon={FiDownload}
                    onClick={handleExport}
                    size="sm"
                  >
                    Export
                  </Button>
                </div>
              </div>
            </div>

            {/* User Statistics Overview */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">User Overview</h2>
              <UserStatsCards
                stats={userStats}
                totalUsers={userStats.totalUsers}
                loading={loading}
              />
            </div>

            {/* User Analytics */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">User Analytics</h2>
              <UserAnalytics
                stats={userStats}
                loading={loading}
              />
            </div>

            {/* System Metrics */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">System Metrics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {systemMetrics.map((metric, index) => {
                  const Icon = metric.icon;
                  const isPositive = metric.changeType === 'positive';

                  return (
                    <Card key={index} className="p-6 hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-600 mb-1">
                            {metric.title}
                          </p>
                          <p className="text-2xl font-bold text-gray-900 mb-2">
                            {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
                          </p>
                          <div className="flex items-center">
                            <FiTrendingUp className={`w-4 h-4 mr-1 ${
                              isPositive ? 'text-green-500' : 'text-red-500'
                            }`} />
                            <span className={`text-sm font-medium ${
                              isPositive ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {metric.change}
                            </span>
                            <span className="text-sm text-gray-500 ml-1">
                              vs last period
                            </span>
                          </div>
                        </div>
                        <div className={`w-12 h-12 bg-${metric.color}-100 rounded-lg flex items-center justify-center`}>
                          <Icon className={`w-6 h-6 text-${metric.color}-600`} />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Detailed Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* User Distribution */}
              <UserDistributionChart
                stats={userStats}
                loading={loading}
              />

              {/* Activity Timeline */}
              <UserActivityTimeline
                loading={loading}
              />
            </div>

            {/* Additional Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Peak Usage Times */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Peak Usage Times</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Morning (8-12 PM)</span>
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                      <span className="text-sm font-medium">75%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Afternoon (12-6 PM)</span>
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '90%' }}></div>
                      </div>
                      <span className="text-sm font-medium">90%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Evening (6-10 PM)</span>
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div className="bg-orange-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                      </div>
                      <span className="text-sm font-medium">45%</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Top Departments */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Departments</h3>
                <div className="space-y-3">
                  {['Computer Science', 'Mathematics', 'Physics', 'Chemistry'].map((dept, index) => (
                    <div key={dept} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{dept}</span>
                      <span className="text-sm font-medium">{Math.floor(Math.random() * 50) + 20}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Quick Actions */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    icon={FiUsers}
                    onClick={() => router.push('/admin/users')}
                  >
                    Manage Users
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    icon={FiCalendar}
                    onClick={() => router.push('/admin/calendar')}
                  >
                    Academic Calendar
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    icon={FiBarChart}
                  >
                    Generate Report
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminAnalytics;

