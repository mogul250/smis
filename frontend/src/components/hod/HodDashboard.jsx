import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  Calendar,
  BarChart3,
  Settings,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
  GraduationCap,
  FileText,
  Bell,
  ArrowRight,
  Activity,
  Target
} from 'lucide-react';
import hodAPI from '../../services/api/hod';

const HodDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Dashboard data state
  const [dashboardData, setDashboardData] = useState({
    profile: null,
    teachers: [],
    stats: null,
    courses: [],
    timetable: []
  });

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    try {
      setError(null);
      
      const [profile, teachers, stats, courses, timetable] = await Promise.allSettled([
        hodAPI.getProfile(),
        hodAPI.getDepartmentTeachers(),
        hodAPI.getDepartmentStats(),
        hodAPI.getDepartmentCourses(),
        hodAPI.getDepartmentTimetable()
      ]);

      setDashboardData({
        profile: profile.status === 'fulfilled' ? profile.value : null,
        teachers: teachers.status === 'fulfilled' ? teachers.value : [],
        stats: stats.status === 'fulfilled' ? stats.value : null,
        courses: courses.status === 'fulfilled' ? courses.value : [],
        timetable: timetable.status === 'fulfilled' ? timetable.value : []
      });

      // Log any failed requests for debugging
      if (profile.status === 'rejected') console.warn('Profile fetch failed:', profile.reason);
      if (teachers.status === 'rejected') console.warn('Teachers fetch failed:', teachers.reason);
      if (stats.status === 'rejected') console.warn('Stats fetch failed:', stats.reason);
      if (courses.status === 'rejected') console.warn('Courses fetch failed:', courses.reason);
      if (timetable.status === 'rejected') console.warn('Timetable fetch failed:', timetable.reason);

    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
  };

  // Quick actions configuration
  const quickActions = [
    {
      title: 'Manage Teachers',
      description: 'View and manage department staff',
      icon: Users,
      href: '/hod/teachers',
      color: 'bg-blue-500 hover:bg-blue-600',
      count: dashboardData.teachers?.length || 0
    },
    {
      title: 'Course Management',
      description: 'Manage department courses',
      icon: BookOpen,
      href: '/hod/courses',
      color: 'bg-green-500 hover:bg-green-600',
      count: dashboardData.courses?.length || 0
    },
    {
      title: 'Reports & Analytics',
      description: 'Generate departmental reports',
      icon: BarChart3,
      href: '/hod/reports',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Timetable Management',
      description: 'View and manage schedules',
      icon: Calendar,
      href: '/hod/timetable',
      color: 'bg-orange-500 hover:bg-orange-600',
      count: dashboardData.timetable?.length || 0
    },
    {
      title: 'Approvals',
      description: 'Review pending approvals',
      icon: CheckCircle,
      href: '/hod/approvals',
      color: 'bg-red-500 hover:bg-red-600'
    },
    {
      title: 'Notifications',
      description: 'Send department notifications',
      icon: Bell,
      href: '/hod/notifications',
      color: 'bg-indigo-500 hover:bg-indigo-600'
    }
  ];

  // Statistics cards
  const statsCards = [
    {
      title: 'Total Teachers',
      value: dashboardData.teachers?.length || 0,
      icon: Users,
      description: 'Active department staff',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Total Courses',
      value: dashboardData.courses?.length || 0,
      icon: BookOpen,
      description: 'Department courses',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Avg Attendance',
      value: `${dashboardData.stats?.attendance?.avg_attendance_percentage || 0}%`,
      icon: TrendingUp,
      description: 'Department average',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Active Classes',
      value: dashboardData.timetable?.length || 0,
      icon: Calendar,
      description: 'Scheduled classes',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">HOD Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {dashboardData.profile?.user?.first_name || user?.first_name || 'HOD'}! 
            Here's your department overview.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {loading ? '...' : stat.value}
                    </p>
                    <p className="text-sm text-gray-500">{stat.description}</p>
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

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Manage your department efficiently with these quick actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link key={index} href={action.href}>
                  <Card className="hover:shadow-md transition-all duration-200 cursor-pointer group">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center transition-transform group-hover:scale-105`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <h4 className="font-semibold text-gray-900">{action.title}</h4>
                          <p className="text-sm text-gray-600">{action.description}</p>
                          {action.count !== undefined && (
                            <p className="text-xs text-gray-500 font-medium">
                              {action.count} items
                            </p>
                          )}
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Department Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Teachers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">Department Teachers</CardTitle>
            <Link href="/hod/teachers">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {dashboardData.teachers?.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.teachers.slice(0, 5).map((teacher, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {teacher.first_name?.[0]}{teacher.last_name?.[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {teacher.first_name} {teacher.last_name}
                        </p>
                        <p className="text-sm text-gray-500">{teacher.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        teacher.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {teacher.status || 'active'}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {teacher.course_count || 0} courses
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Teachers Yet</h3>
                <p className="text-gray-500 mb-4">
                  Teachers will appear here once they're assigned to your department.
                </p>
                <Link href="/hod/teachers">
                  <Button size="sm">
                    Manage Teachers
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">Today's Schedule</CardTitle>
            <Link href="/hod/timetable">
              <Button variant="outline" size="sm">
                View Timetable
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {dashboardData.timetable?.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.timetable.slice(0, 5).map((classItem, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {classItem.course_name || classItem.course_code}
                      </p>
                      <p className="text-sm text-gray-500">
                        {classItem.start_time} - {classItem.end_time}
                      </p>
                      <p className="text-xs text-gray-400">
                        {classItem.teacher_name} • {classItem.room || 'TBA'}
                      </p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {classItem.day || 'Today'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Scheduled</h3>
                <p className="text-gray-500 mb-4">
                  Department schedule will appear here once classes are assigned.
                </p>
                <Link href="/hod/timetable">
                  <Button size="sm">
                    Manage Timetable
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Latest activities in your department
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-500">No recent activities to display</p>
            <p className="text-xs text-gray-400 mt-1">
              Activities will appear here as they occur in your department
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HodDashboard;
