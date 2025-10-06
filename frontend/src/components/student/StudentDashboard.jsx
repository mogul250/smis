import React, { useState } from 'react';
import Link from 'next/link';
import { useApi } from '../../hooks/useApi';
import { studentAPI } from '../../services/api';
import Button from '../common/Button';
import Badge from '../common/Badge';
import LoadingSpinner from '../common/LoadingSpinner';
import MetricCard from '../ui/MetricCard';
import DashboardSection from '../ui/DashboardSection';
import ChartCard from '../ui/ChartCard';
import ActivityCard, { ActivityItem } from '../ui/ActivityCard';
import QuickActionCard from '../ui/QuickActionCard';
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
    <div className="space-y-8 w-full max-w-7xl mx-auto">
      {/* Header */}
      <DashboardSection
        title="Student Dashboard"
        subtitle={`Welcome back, ${profile?.user?.first_name}! Here's your academic overview.`}
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
                refetchGrades();
                refetchFees();
              }}
            >
              Refresh
            </Button>
          </div>
        }
      />

      {/* Academic Overview */}
      <DashboardSection title="Academic Overview" delay={0.1}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Current GPA"
            value={currentGPA}
            change="+0.2 from last semester"
            changeType="positive"
            trend={FiTrendingUp}
            icon={FiAward}
          />

          <MetricCard
            title="Attendance Rate"
            value={`${attendanceRate}%`}
            change="Excellent attendance"
            changeType="positive"
            icon={FiTarget}
          />

          <MetricCard
            title="Active Courses"
            value={grades?.grades?.length || 0}
            change="This semester"
            changeType="neutral"
            icon={FiBook}
          />

          <MetricCard
            title="Outstanding Fees"
            value={`$${outstandingFees}`}
            change={outstandingFees > 0 ? "Payment due" : "All paid"}
            changeType={outstandingFees > 0 ? "warning" : "positive"}
            icon={FiDollarSign}
          />
        </div>
      </DashboardSection>

      {/* Quick Actions & Recent Activity */}
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

        {/* Recent Grades */}
        <ActivityCard
          title="Recent Grades"
          loading={gradesLoading}
          action={
            <Button variant="outline" size="sm" href="/student/grades">
              View All
            </Button>
          }
          emptyState={
            <div className="text-center text-gray-500">
              <FiBook className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No Grades Yet</p>
              <p className="text-xs mt-1">Your grades will appear here once they're posted.</p>
            </div>
          }
        >
          {grades?.grades?.slice(0, 5).map((grade, index) => (
            <ActivityItem
              key={index}
              icon={FiBook}
              title={grade.course_name}
              description={`${grade.semester} ${grade.year} • ${grade.assessment_type}`}
              status={grade.grade}
              time="Recent"
            />
          ))}
        </ActivityCard>
      </div>

      {/* Fee Status & Upcoming Classes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fee Status */}
        <ActivityCard
          title="Fee Status"
          loading={feesLoading}
          action={
            <Button variant="outline" size="sm" href="/student/fees">
              View All
            </Button>
          }
        >
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
              <ActivityItem
                key={index}
                icon={FiDollarSign}
                title={fee.fee_type}
                description={`Due: ${new Date(fee.due_date).toLocaleDateString()}`}
                status={fee.status}
                time={`$${fee.amount}`}
              />
            ))}
          </div>
        </ActivityCard>

        {/* Today's Schedule */}
        <ActivityCard
          title="Today's Schedule"
          loading={timetableLoading}
          action={
            <Button variant="outline" size="sm" href="/student/timetable">
              View Timetable
            </Button>
          }
          emptyState={
            <div className="text-center text-gray-500">
              <FiCalendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No Classes Today</p>
              <p className="text-xs mt-1">Enjoy your free time!</p>
            </div>
          }
        >
          {timetable?.classes?.slice(0, 4).map((classItem, index) => (
            <ActivityItem
              key={index}
              icon={FiClock}
              title={classItem.course_name}
              description={`${classItem.start_time} - ${classItem.end_time}`}
              time={classItem.room || 'TBA'}
            />
          ))}
        </ActivityCard>
      </div>
    </div>
  );
};

export default StudentDashboard;
