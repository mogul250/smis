import React, { useState } from 'react';
import Link from 'next/link';
import { useApi } from '../../hooks/useApi';
import { studentAPI } from '../../services/api';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import LoadingSpinner from '../common/LoadingSpinner';
import {
  FiBook,
  FiCalendar,
  FiDollarSign,
  FiUser,
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
  FiTarget
} from 'react-icons/fi';

const StudentDashboard = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const { data: profile, loading: profileLoading, refetch: refetchProfile } = useApi(studentAPI.getProfile);
  const { data: grades, loading: gradesLoading, refetch: refetchGrades } = useApi(studentAPI.getGrades);
  const { data: fees, loading: feesLoading, refetch: refetchFees } = useApi(studentAPI.getFees);
  const { data: attendance, loading: attendanceLoading } = useApi(() => {
    // Get attendance for the last 30 days
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return studentAPI.getAttendance(startDate, endDate);
  });
  const { data: timetable, loading: timetableLoading } = useApi(() => studentAPI.getTimetable('current'));

  const timeRangeOptions = [
    { value: '24h', label: 'Last 24 hours' },
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' }
  ];

  const quickActions = [
    {
      title: 'View Timetable',
      description: 'Check your class schedule',
      icon: FiCalendar,
      href: '/student/timetable',
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      title: 'Check Attendance',
      description: 'View your attendance record',
      icon: FiBook,
      href: '/student/attendance',
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      title: 'View Grades',
      description: 'See your academic performance',
      icon: FiTrendingUp,
      href: '/student/grades',
      color: 'bg-purple-500',
      textColor: 'text-purple-600'
    },
    {
      title: 'Update Profile',
      description: 'Manage your personal information',
      icon: FiUser,
      href: '/student/profile',
      color: 'bg-orange-500',
      textColor: 'text-orange-600'
    }
  ];

  const calculateGPA = (grades) => {
    if (!grades || grades.length === 0) return 0;
    const totalPoints = grades.reduce((sum, grade) => {
      const gradePoints = {
        'A+': 4.0, 'A': 4.0, 'A-': 3.7,
        'B+': 3.3, 'B': 3.0, 'B-': 2.7,
        'C+': 2.3, 'C': 2.0, 'C-': 1.7,
        'D+': 1.3, 'D': 1.0, 'F': 0.0
      };
      return sum + (gradePoints[grade.grade] || 0);
    }, 0);
    return (totalPoints / grades.length).toFixed(2);
  };

  const currentGPA = calculateGPA(grades?.grades || []);
  const attendanceRate = attendance?.attendanceRate || 0;
  const outstandingFees = fees?.totalOutstanding || 0;

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
            Welcome back, {profile?.user?.first_name}! Here's your academic overview.
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
              refetchGrades();
              refetchFees();
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
              <p className="text-sm font-medium text-gray-600">Current GPA</p>
              <p className="text-3xl font-bold text-gray-900">{currentGPA}</p>
              <div className="flex items-center mt-2">
                <FiTrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+0.2</span>
                <span className="text-sm text-gray-500 ml-1">from last semester</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FiAward className="w-6 h-6 text-green-600" />
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
                <span className="text-sm text-gray-500 ml-1">attendance</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiTarget className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Courses</p>
              <p className="text-3xl font-bold text-gray-900">{grades?.grades?.length || 0}</p>
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
              <p className="text-sm font-medium text-gray-600">Outstanding Fees</p>
              <p className="text-3xl font-bold text-gray-900">${outstandingFees}</p>
              <div className="flex items-center mt-2">
                {outstandingFees > 0 ? (
                  <>
                    <FiAlertCircle className="w-4 h-4 text-red-500 mr-1" />
                    <span className="text-sm text-red-600">Payment due</span>
                  </>
                ) : (
                  <>
                    <FiCheckCircle className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">All paid</span>
                  </>
                )}
              </div>
            </div>
            <div className={`w-12 h-12 ${outstandingFees > 0 ? 'bg-red-100' : 'bg-green-100'} rounded-lg flex items-center justify-center`}>
              <FiDollarSign className={`w-6 h-6 ${outstandingFees > 0 ? 'text-red-600' : 'text-green-600'}`} />
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

        {/* Recent Grades */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Grades</h3>
            <Button variant="outline" size="sm" href="/student/grades">
              View All
            </Button>
          </div>
          {gradesLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : grades?.grades?.length > 0 ? (
            <div className="space-y-4">
              {grades.grades.slice(0, 5).map((grade, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <FiBook className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{grade.course_name}</p>
                      <p className="text-sm text-gray-500">{grade.semester} {grade.year}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-gray-900">{grade.grade}</p>
                    <p className="text-xs text-gray-500">{grade.assessment_type}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FiBook className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Grades Yet</h3>
              <p className="text-gray-500">Your grades will appear here once they're posted.</p>
            </div>
          )}
        </Card>
      </div>

      {/* Fee Status & Upcoming Classes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fee Status */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Fee Status</h3>
            <Button variant="outline" size="sm" href="/student/fees">
              View All
            </Button>
          </div>
          {feesLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FiDollarSign className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">Total Outstanding</p>
                    <p className="text-sm text-gray-500">Amount due for payment</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${outstandingFees > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ${outstandingFees}
                  </p>
                  <Badge variant={outstandingFees > 0 ? 'danger' : 'success'}>
                    {outstandingFees > 0 ? 'Payment Due' : 'All Paid'}
                  </Badge>
                </div>
              </div>
              
              {fees?.fees?.slice(0, 3).map((fee, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{fee.fee_type}</p>
                    <p className="text-sm text-gray-500">
                      Due: {new Date(fee.due_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">${fee.amount}</p>
                    <Badge variant={fee.status === 'paid' ? 'success' : 'danger'}>
                      {fee.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Today's Schedule */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Today's Schedule</h3>
            <Button variant="outline" size="sm" href="/student/timetable">
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
      </div>
    </div>
  );
};

export default StudentDashboard;
