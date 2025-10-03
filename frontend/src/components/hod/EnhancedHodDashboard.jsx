import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { hodAPI } from '../../services/api';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import LoadingSpinner from '../common/LoadingSpinner';
import Alert from '../common/Alert';
import {
  FiUsers,
  FiBarChart,
  FiBook,
  FiSettings,
  FiTrendingUp,
  FiTrendingDown,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiCalendar,
  FiMail,
  FiFileText,
  FiGrid,
  FiArrowRight,
  FiWifi,
  FiWifiOff
} from 'react-icons/fi';

const EnhancedHodDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [useTestData, setUseTestData] = useState(false);

  // Test data for development
  const testData = {
    teachers: [
      { id: 1, first_name: 'John', last_name: 'Smith', email: 'john.smith@school.edu', status: 'active', course_count: 3 },
      { id: 2, first_name: 'Jane', last_name: 'Doe', email: 'jane.doe@school.edu', status: 'active', course_count: 2 },
      { id: 3, first_name: 'Bob', last_name: 'Wilson', email: 'bob.wilson@school.edu', status: 'active', course_count: 4 }
    ],
    stats: {
      courses: 12,
      teachers: 3,
      attendance: { avg_attendance_percentage: 85.5 }
    },
    timetable: [
      { id: 1, course_name: 'Mathematics 101', course_code: 'MATH101', teacher_name: 'John Smith', day_of_week: 1, start_time: '09:00', end_time: '10:30', room: 'Room 101' },
      { id: 2, course_name: 'Physics 201', course_code: 'PHYS201', teacher_name: 'Jane Doe', day_of_week: 2, start_time: '11:00', end_time: '12:30', room: 'Lab 1' },
      { id: 3, course_name: 'Chemistry 101', course_code: 'CHEM101', teacher_name: 'Bob Wilson', day_of_week: 3, start_time: '14:00', end_time: '15:30', room: 'Lab 2' }
    ]
  };

  // API calls for dashboard data with fallback data
  const { data: teachers, loading: teachersLoading, error: teachersError, refetch: refetchTeachers } = useApi(
    hodAPI.getDepartmentTeachers,
    [],
    { fallbackData: [] }
  );
  const { data: stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useApi(
    hodAPI.getDepartmentStats,
    [],
    { fallbackData: { courses: 0, teachers: 0, attendance: { avg_attendance_percentage: 0 } } }
  );
  const { data: timetable, loading: timetableLoading, error: timetableError, refetch: refetchTimetable } = useApi(
    () => hodAPI.getDepartmentTimetable(),
    [],
    { fallbackData: [] }
  );

  // Use test data if API fails or in development mode
  const finalTeachers = useTestData || (teachersError && !teachers?.length) ? testData.teachers : teachers;
  const finalStats = useTestData || (statsError && !stats?.courses) ? testData.stats : stats;
  const finalTimetable = useTestData || (timetableError && !timetable?.length) ? testData.timetable : timetable;

  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('API Data Debug:', {
      teachers: teachers,
      stats: stats,
      timetable: timetable,
      errors: { teachersError, statsError, timetableError },
      authToken: typeof window !== 'undefined' ? localStorage.getItem('authToken') : 'N/A'
    });
  }

  // Test backend connectivity
  const [backendStatus, setBackendStatus] = useState('checking');
  useEffect(() => {
    const testBackend = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/health');
        if (response.ok) {
          setBackendStatus('connected');
        } else {
          setBackendStatus('error');
        }
      } catch (error) {
        setBackendStatus('disconnected');
      }
    };
    testBackend();
  }, []);

  const isLoading = teachersLoading || statsLoading || timetableLoading;
  const hasError = teachersError || statsError || timetableError;

  // Refresh all data
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchTeachers(),
        refetchStats(),
        refetchTimetable()
      ]);
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Quick actions configuration
  const quickActions = [
    {
      title: 'Manage Teachers',
      description: 'View and manage department staff',
      icon: FiUsers,
      href: '/hod/teachers',
      color: 'bg-blue-500',
      count: finalTeachers?.length || 0
    },
    {
      title: 'Course Management',
      description: 'Manage department courses',
      icon: FiBook,
      href: '/hod/courses',
      color: 'bg-green-500',
      count: finalStats?.courses || 0
    },
    {
      title: 'Reports & Analytics',
      description: 'Generate departmental reports',
      icon: FiBarChart,
      href: '/hod/reports',
      color: 'bg-purple-500',
      count: null
    },
    {
      title: 'Timetable Management',
      description: 'View and approve timetables',
      icon: FiCalendar,
      href: '/hod/timetable',
      color: 'bg-orange-500',
      count: finalTimetable?.length || 0
    },
    {
      title: 'Approvals',
      description: 'Review pending approvals',
      icon: FiCheckCircle,
      href: '/hod/approvals',
      color: 'bg-red-500',
      count: null
    },
    {
      title: 'Notifications',
      description: 'Send notifications to staff',
      icon: FiMail,
      href: '/hod/notifications',
      color: 'bg-indigo-500',
      count: null
    }
  ];

  // Statistics cards configuration
  const statsCards = [
    {
      title: 'Total Teachers',
      value: finalTeachers?.length || 0,
      icon: FiUsers,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: null
    },
    {
      title: 'Total Courses',
      value: finalStats?.courses || 0,
      icon: FiBook,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: null
    },
    {
      title: 'Avg Attendance',
      value: `${finalStats?.attendance?.avg_attendance_percentage || 0}%`,
      icon: FiTrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: null
    },
    {
      title: 'Active Classes',
      value: finalTimetable?.length || 0,
      icon: FiCalendar,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      change: null
    }
  ];

  if (hasError && !useTestData) {
    return (
      <div className="p-6">
        <Alert variant="error" className="mb-6">
          Error loading dashboard data. Please try refreshing the page.
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-2 text-sm">
              <strong>Debug Info:</strong>
              {teachersError && <div>Teachers: {teachersError.message}</div>}
              {statsError && <div>Stats: {statsError.message}</div>}
              {timetableError && <div>Timetable: {timetableError.message}</div>}
            </div>
          )}
        </Alert>
        <div className="flex space-x-3">
          <Button onClick={handleRefresh} loading={refreshing} icon={FiRefreshCw}>
            Retry
          </Button>
          <Button
            variant="outline"
            onClick={() => setUseTestData(true)}
            icon={FiGrid}
          >
            Use Test Data
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">HOD Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here's your department overview.
            {useTestData && (
              <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                Test Mode
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            loading={refreshing}
            icon={FiRefreshCw}
          >
            Refresh
          </Button>
          {process.env.NODE_ENV === 'development' && (
            <Button
              variant={useTestData ? "primary" : "outline"}
              size="sm"
              onClick={() => setUseTestData(!useTestData)}
              icon={FiGrid}
            >
              {useTestData ? 'Live Data' : 'Test Data'}
            </Button>
          )}
        </div>
      </div>

      {/* Status Display (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="bg-gray-50 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {backendStatus === 'connected' ? (
                  <FiWifi className="w-4 h-4 text-green-500" />
                ) : (
                  <FiWifiOff className="w-4 h-4 text-red-500" />
                )}
                <span className="text-sm font-medium">
                  Backend: {backendStatus === 'connected' ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isAuthenticated ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium">
                  Auth: {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                User: {user?.email || 'None'} ({user?.role || 'N/A'})
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <div className="flex items-center">
                    {isLoading ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link 
                key={index} 
                href={action.href}
                className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all duration-200 text-left group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-gray-900 group-hover:text-gray-700">
                        {action.title}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {action.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {action.count !== null && (
                      <Badge variant="default" size="sm">
                        {isLoading ? '...' : action.count}
                      </Badge>
                    )}
                    <FiArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </Card>

      {/* Recent Teachers and Timetable Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Teachers */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Department Teachers</h3>
            <Button variant="outline" size="sm" href="/hod/teachers">
              View All
            </Button>
          </div>
          {teachersLoading && !useTestData ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : finalTeachers?.length > 0 ? (
            <div className="space-y-4">
              {finalTeachers.slice(0, 5).map((teacher, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <FiUsers className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {teacher.first_name} {teacher.last_name}
                    </p>
                    <p className="text-xs text-gray-500">{teacher.email}</p>
                  </div>
                  <Badge variant={teacher.status === 'active' ? 'success' : 'default'} size="sm">
                    {teacher.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No teachers found
            </div>
          )}
        </Card>

        {/* Timetable Overview */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Today's Schedule</h3>
            <Button variant="outline" size="sm" href="/hod/timetable">
              View Timetable
            </Button>
          </div>
          {timetableLoading && !useTestData ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : finalTimetable?.length > 0 ? (
            <div className="space-y-4">
              {finalTimetable.slice(0, 5).map((classItem, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <FiCalendar className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {classItem.course_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {classItem.teacher_name} • {classItem.start_time} - {classItem.end_time}
                      {classItem.room && ` • ${classItem.room}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No classes scheduled
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default EnhancedHodDashboard;
