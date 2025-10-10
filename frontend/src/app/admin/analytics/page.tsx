'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import { adminAPI } from '../../../services/api';
import Layout from '../../../components/common/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  Users,
  UserCheck,
  GraduationCap,
  BookOpen,
  TrendingUp,
  Activity,
  RefreshCw,
  Download
} from 'lucide-react';

interface AnalyticsData {
  userStats: {
    totalUsers: number;
    activeUsers: number;
    newUsersThisMonth: number;
    totalStudents: number;
    totalTeachers: number;
    totalAdmins: number;
    totalHODs: number;
  };
  departmentDistribution: Array<{
    departmentName: string;
    userCount: number;
    studentCount: number;
    teacherCount: number;
  }>;
  registrationTrend: Array<{
    month: string;
    registrations: number;
  }>;
  roleDistribution: Array<{
    role: string;
    count: number;
  }>;
  courseStats: {
    totalCourses: number;
    departmentsWithCourses: number;
  };
  systemActivity: {
    totalLogins: number;
    avgSessionTime: number;
    peakHours: Array<{
      hour: string;
      usage: number;
    }>;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const AdminAnalytics = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      setError(null);

      const response = await adminAPI.getAnalytics();
      setAnalytics(response);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to load analytics data');
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
  }, [isAuthenticated, user]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  // Handle export
  const handleExport = () => {
    if (!analytics) return;

    const data = {
      analytics,
      exportDate: new Date().toISOString(),
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

  if (loading && !analytics) {
    return (
      <Layout maxWidth="max-w-7xl mx-auto">
        <div className="p-6 max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout maxWidth="max-w-7xl mx-auto">
        <div className="p-6 max-w-7xl mx-auto">
          <Card className="p-6 text-center">
            <CardContent>
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!analytics) return null;

  const statCards = [
    {
      title: 'Total Users',
      value: analytics.userStats.totalUsers,
      change: `+${analytics.userStats.newUsersThisMonth} this month`,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Active Users',
      value: analytics.userStats.activeUsers,
      change: `${Math.round((analytics.userStats.activeUsers / analytics.userStats.totalUsers) * 100)}% of total`,
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Students',
      value: analytics.userStats.totalStudents,
      change: `${Math.round((analytics.userStats.totalStudents / analytics.userStats.totalUsers) * 100)}% of users`,
      icon: GraduationCap,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Total Logins',
      value: analytics.systemActivity.totalLogins,
      change: `${analytics.systemActivity.avgSessionTime}m avg session`,
      icon: Activity,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <Layout maxWidth="max-w-7xl mx-auto" enableAnimation={true}>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <TrendingUp className="mr-3 text-blue-600" />
              Analytics Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Real-time insights and system performance metrics
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={handleExport}
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mb-2">
                        {stat.value.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        {stat.change}
                      </p>
                    </div>
                    <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Registration Trend */}
          <Card>
            <CardHeader>
              <CardTitle>User Registration Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.registrationTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="registrations" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    name="New Registrations"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Role Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>User Role Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.roleDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ role, percent }) => `${role} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {analytics.roleDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Department Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Department Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.departmentDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="departmentName" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="studentCount" stackId="a" fill="#8884d8" name="Students" />
                  <Bar dataKey="teacherCount" stackId="a" fill="#82ca9d" name="Teachers" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Peak Usage Hours */}
          <Card>
            <CardHeader>
              <CardTitle>Peak Usage Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.systemActivity.peakHours}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="usage" fill="#ffc658" name="Usage %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                Course Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Courses</span>
                  <span className="text-lg font-semibold">{analytics.courseStats.totalCourses}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Departments with Courses</span>
                  <span className="text-lg font-semibold">{analytics.courseStats.departmentsWithCourses}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Departments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.departmentDistribution.slice(0, 4).map((dept, index) => (
                  <div key={dept.departmentName} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{dept.departmentName}</span>
                    <span className="text-sm font-medium">{dept.userCount} users</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push('/admin/users')}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Manage Users
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push('/admin/departments')}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Manage Departments
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleExport}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default AdminAnalytics;
