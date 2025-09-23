import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApi } from '../../hooks/useApi';
import { hodAPI, activityAPI } from '../../services/apiService';
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
  FiArrowRight,
  FiRefreshCw,
  FiActivity,
  FiGraduationCap,
  FiAward,
  FiTarget,
  FiUser,
  FiEdit,
  FiPlus,
  FiCalendar,
  FiClipboard,
  FiMail,
  FiFileText,
  FiGrid
} from 'react-icons/fi';

const HodDashboard = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const { data: profile, loading: profileLoading, refetch: refetchProfile } = useApi(() => hodAPI.getProfile?.() || Promise.resolve({}));
  const { data: teachers, loading: teachersLoading, refetch: refetchTeachers } = useApi(hodAPI.getDepartmentTeachers);
  const { data: stats, loading: statsLoading, refetch: refetchStats } = useApi(hodAPI.getDepartmentStats);
  const { data: timetable, loading: timetableLoading } = useApi(() => hodAPI.getDepartmentTimetable({ week: 'current' }));
  const { data: hodActivities, loading: activitiesLoading } = useApi(
    () => activityAPI.getActivitiesByEntityType('course', { limit: 5 }),
    [],
    { fallbackData: { data: [] } }
  );

  const timeRangeOptions = [
    { value: '24h', label: 'Last 24 hours' },
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' }
  ];

  const quickActions = [
    {
      title: 'Manage Teachers',
      description: 'View and manage department staff',
      icon: FiUsers,
      href: '/hod/teachers',
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      title: 'Generate Reports',
      description: 'Create departmental reports',
      icon: FiBarChart,
      href: '/hod/reports',
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      title: 'Manage Courses',
      description: 'Oversee course offerings',
      icon: FiBook,
      href: '/hod/courses',
      color: 'bg-purple-500',
      textColor: 'text-purple-600'
    },
    {
      title: 'Approvals',
      description: 'Review pending approvals',
      icon: FiSettings,
      href: '/hod/approvals',
      color: 'bg-orange-500',
      textColor: 'text-orange-600'
    }
  ];

  const totalTeachers = teachers?.teachers?.length || 0;
  const totalStudents = stats?.totalStudents || 0;
  const totalCourses = stats?.totalCourses || 0;
  const pendingApprovals = stats?.pendingApprovals || 0;

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
            Welcome back, {profile?.user?.first_name}! Here's your department overview.
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
              refetchTeachers();
              refetchStats();
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
              <p className="text-sm font-medium text-gray-600">Department Teachers</p>
              <p className="text-3xl font-bold text-gray-900">{totalTeachers}</p>
              <div className="flex items-center mt-2">
                <FiTrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+2</span>
                <span className="text-sm text-gray-500 ml-1">this semester</span>
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
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-3xl font-bold text-gray-900">{totalStudents}</p>
              <div className="flex items-center mt-2">
                <FiGraduationCap className="w-4 h-4 text-purple-500 mr-1" />
                <span className="text-sm text-purple-600">Enrolled</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiGraduationCap className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Courses</p>
              <p className="text-3xl font-bold text-gray-900">{totalCourses}</p>
              <div className="flex items-center mt-2">
                <FiBook className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">This semester</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FiBook className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
              <p className="text-3xl font-bold text-gray-900">{pendingApprovals}</p>
              <div className="flex items-center mt-2">
                {pendingApprovals > 0 ? (
                  <>
                    <FiAlertCircle className="w-4 h-4 text-orange-500 mr-1" />
                    <span className="text-sm text-orange-600">Needs review</span>
                  </>
                ) : (
                  <>
                    <FiCheckCircle className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">All caught up</span>
                  </>
                )}
              </div>
            </div>
            <div className={`w-12 h-12 ${pendingApprovals > 0 ? 'bg-orange-100' : 'bg-green-100'} rounded-lg flex items-center justify-center`}>
              <FiSettings className={`w-6 h-6 ${pendingApprovals > 0 ? 'text-orange-600' : 'text-green-600'}`} />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions & Department Teachers */}
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

        {/* Department Teachers */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Department Teachers</h3>
            <Button variant="outline" size="sm" href="/hod/teachers">
              View All
            </Button>
          </div>
          {teachersLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : teachers?.teachers?.length > 0 ? (
            <div className="space-y-4">
              {teachers.teachers.slice(0, 5).map((teacher, index) => (
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
                    <Badge variant={teacher.status === 'active' ? 'success' : 'default'}>
                      {teacher.status}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">{teacher.course_count || 0} courses</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FiUsers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Teachers Yet</h3>
              <p className="text-gray-500">Teachers will appear here once they're assigned to your department.</p>
            </div>
          )}
        </Card>
      </div>

      {/* Department Schedule & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Schedule */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Department Schedule</h3>
            <Button variant="outline" size="sm" href="/hod/timetable">
              View Timetable
            </Button>
          </div>
          {timetableLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : timetable?.classes?.length > 0 ? (
            <div className="space-y-4">
              {timetable.classes.slice(0, 4).map((classItem, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FiClock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{classItem.course_name}</p>
                    <p className="text-sm text-gray-500">
                      {classItem.start_time} - {classItem.end_time}
                    </p>
                    <p className="text-xs text-gray-400">{classItem.teacher_name} • {classItem.room || 'TBA'}</p>
                  </div>
                  <Badge variant="primary">
                    {classItem.day}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FiCalendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Scheduled</h3>
              <p className="text-gray-500">Department schedule will appear here once classes are assigned.</p>
            </div>
          )}
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
              {hodActivities?.data?.length > 0 ? (
                hodActivities.data.map((activity, index) => {
                  const getActivityColor = (action) => {
                    switch (action) {
                      case 'teacher_added': return 'bg-blue-500';
                      case 'course_approved': return 'bg-green-500';
                      case 'timetable_updated': return 'bg-yellow-500';
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
                  <p className="text-sm text-gray-500">No recent department activities</p>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default HodDashboard;
