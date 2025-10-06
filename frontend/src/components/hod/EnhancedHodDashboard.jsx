import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { hodAPI } from '../../services/api';
import Button from '../common/Button';
import Badge from '../common/Badge';
import LoadingSpinner from '../common/LoadingSpinner';
import Alert from '../common/Alert';
import Card from '../common/Card';
import MetricCard from '../ui/MetricCard';
import DashboardSection from '../ui/DashboardSection';
import ChartCard from '../ui/ChartCard';
import ActivityCard, { ActivityItem } from '../ui/ActivityCard';
import QuickActionCard from '../ui/QuickActionCard';
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
    <div className="space-y-8 w-full max-w-7xl mx-auto">
      {/* Header */}
      <DashboardSection
        title="HOD Dashboard"
        subtitle={
          <div className="flex items-center">
            <span>Welcome back! Here's your department overview.</span>
            {useTestData && (
              <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                Test Mode
              </span>
            )}
          </div>
        }
        action={
          <div className="flex items-center gap-3">
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
        }
      />

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

      {/* Department Overview */}
      <DashboardSection title="Department Overview" delay={0.1}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((stat, index) => (
            <MetricCard
              key={index}
              title={stat.title}
              value={isLoading ? "..." : stat.value}
              icon={stat.icon}
              loading={isLoading}
            />
          ))}
        </div>
      </DashboardSection>

      {/* Quick Actions */}
      <DashboardSection title="Quick Actions">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

      {/* Recent Teachers and Timetable Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Teachers */}
        <ActivityCard
          title="Department Teachers"
          loading={teachersLoading && !useTestData}
          action={
            <Button variant="outline" size="sm" href="/hod/teachers">
              View All
            </Button>
          }
          emptyState={
            <div className="text-center text-gray-500">
              <FiUsers className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No teachers found</p>
            </div>
          }
        >
          {finalTeachers?.slice(0, 5).map((teacher, index) => (
            <ActivityItem
              key={index}
              icon={FiUsers}
              title={`${teacher.first_name} ${teacher.last_name}`}
              description={teacher.email}
              status={teacher.status}
              time={`${teacher.course_count || 0} courses`}
            />
          ))}
        </ActivityCard>

        {/* Timetable Overview */}
        <ActivityCard
          title="Today's Schedule"
          loading={timetableLoading && !useTestData}
          action={
            <Button variant="outline" size="sm" href="/hod/timetable">
              View Timetable
            </Button>
          }
          emptyState={
            <div className="text-center text-gray-500">
              <FiCalendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No classes scheduled</p>
            </div>
          }
        >
          {finalTimetable?.slice(0, 5).map((classItem, index) => (
            <ActivityItem
              key={index}
              icon={FiCalendar}
              title={classItem.course_name}
              description={`${classItem.teacher_name} • ${classItem.start_time} - ${classItem.end_time}`}
              time={classItem.room || 'TBA'}
            />
          ))}
        </ActivityCard>
      </div>
    </div>
  );
};

export default EnhancedHodDashboard;
