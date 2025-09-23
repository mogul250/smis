import React, { useState } from 'react';
import Link from 'next/link';
import { useApi } from '../../hooks/useApi';
import { teacherAPI } from '../../services/apiService';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import LoadingSpinner from '../common/LoadingSpinner';
import {
  FiUsers,
  FiBook,
  FiCalendar,
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
  FiPlus
} from 'react-icons/fi';

const TeacherDashboard = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const { data: profile, loading: profileLoading, refetch: refetchProfile } = useApi(teacherAPI.getProfile);
  const { data: classes, loading: classesLoading, refetch: refetchClasses } = useApi(teacherAPI.getClasses);
  const { data: timetable, loading: timetableLoading } = useApi(() => teacherAPI.getTimetable({ week: 'current' }));
  const { data: students, loading: studentsLoading } = useApi(teacherAPI.getAllStudents);

  const timeRangeOptions = [
    { value: '24h', label: 'Last 24 hours' },
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' }
  ];

  const quickActions = [
    {
      title: 'Mark Attendance',
      description: 'Record student attendance',
      icon: FiClipboard,
      href: '/teacher/attendance',
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      title: 'Enter Grades',
      description: 'Submit student grades',
      icon: FiBook,
      href: '/teacher/grades',
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      title: 'View Classes',
      description: 'Manage your classes',
      icon: FiUsers,
      href: '/teacher/classes',
      color: 'bg-purple-500',
      textColor: 'text-purple-600'
    },
    {
      title: 'View Timetable',
      description: 'Check your schedule',
      icon: FiCalendar,
      href: '/teacher/timetable',
      color: 'bg-orange-500',
      textColor: 'text-orange-600'
    }
  ];

  const totalStudents = students?.students?.length || 0;
  const totalClasses = classes?.classes?.length || 0;
  const pendingGrades = classes?.classes?.reduce((acc, cls) => acc + (cls.pendingGrades || 0), 0) || 0;
  const attendanceRate = 95; // This would come from actual data

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
            Welcome back, {profile?.user?.first_name}! Here's your teaching overview.
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
              refetchClasses();
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
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-3xl font-bold text-gray-900">{totalStudents}</p>
              <div className="flex items-center mt-2">
                <FiTrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+5</span>
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
              <p className="text-sm font-medium text-gray-600">Active Classes</p>
              <p className="text-3xl font-bold text-gray-900">{totalClasses}</p>
              <div className="flex items-center mt-2">
                <FiBook className="w-4 h-4 text-purple-500 mr-1" />
                <span className="text-sm text-purple-600">This semester</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiBook className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
              <p className="text-3xl font-bold text-gray-900">{attendanceRate}%</p>
              <div className="flex items-center mt-2">
                <FiCheckCircle className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">Excellent</span>
                <span className="text-sm text-gray-500 ml-1">overall</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FiTarget className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Grades</p>
              <p className="text-3xl font-bold text-gray-900">{pendingGrades}</p>
              <div className="flex items-center mt-2">
                {pendingGrades > 0 ? (
                  <>
                    <FiAlertCircle className="w-4 h-4 text-orange-500 mr-1" />
                    <span className="text-sm text-orange-600">Needs attention</span>
                  </>
                ) : (
                  <>
                    <FiCheckCircle className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">All caught up</span>
                  </>
                )}
              </div>
            </div>
            <div className={`w-12 h-12 ${pendingGrades > 0 ? 'bg-orange-100' : 'bg-green-100'} rounded-lg flex items-center justify-center`}>
              <FiEdit className={`w-6 h-6 ${pendingGrades > 0 ? 'text-orange-600' : 'text-green-600'}`} />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions & Recent Activity */}
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

        {/* My Classes */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">My Classes</h3>
            <Button variant="outline" size="sm" href="/teacher/classes">
              View All
            </Button>
          </div>
          {classesLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : classes?.classes?.length > 0 ? (
            <div className="space-y-4">
              {classes.classes.slice(0, 5).map((classItem, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <FiBook className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{classItem.course_name}</p>
                      <p className="text-sm text-gray-500">{classItem.semester} • {classItem.student_count} students</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={classItem.status === 'active' ? 'success' : 'default'}>
                      {classItem.status}
                    </Badge>
                    {classItem.pendingGrades > 0 && (
                      <p className="text-xs text-orange-600 mt-1">{classItem.pendingGrades} pending</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FiBook className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Assigned</h3>
              <p className="text-gray-500">You haven't been assigned to any classes yet.</p>
            </div>
          )}
        </Card>
      </div>

      {/* Today's Schedule & Recent Students */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Today's Schedule</h3>
            <Button variant="outline" size="sm" href="/teacher/timetable">
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
                    <p className="text-xs text-gray-400">{classItem.room || 'TBA'}</p>
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Today</h3>
              <p className="text-gray-500">Enjoy your free time!</p>
            </div>
          )}
        </Card>

        {/* Recent Students */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Students</h3>
            <Button variant="outline" size="sm" href="/teacher/classes">
              View All
            </Button>
          </div>
          {studentsLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : students?.students?.length > 0 ? (
            <div className="space-y-4">
              {students.students.slice(0, 5).map((student, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {student.first_name?.[0]}{student.last_name?.[0]}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {student.first_name} {student.last_name}
                    </p>
                    <p className="text-sm text-gray-500">{student.course_name}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="success">
                      Active
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FiUsers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Yet</h3>
              <p className="text-gray-500">Students will appear here once classes are assigned.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default TeacherDashboard;
