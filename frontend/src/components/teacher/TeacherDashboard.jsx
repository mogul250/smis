import React, { useState } from 'react';
import Link from 'next/link';
import { useApi } from '../../hooks/useApi';
import { teacherAPI } from '../../services/api';
import Button from '../common/Button';
import Badge from '../common/Badge';
import LoadingSpinner from '../common/LoadingSpinner';
import MetricCard from '../ui/MetricCard';
import DashboardSection from '../ui/DashboardSection';
import ChartCard from '../ui/ChartCard';
import ActivityCard, { ActivityItem } from '../ui/ActivityCard';
import QuickActionCard from '../ui/QuickActionCard';
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
    <div className="space-y-8 w-full max-w-7xl mx-auto">
      {/* Header */}
      <DashboardSection
        title="Teacher Dashboard"
        subtitle={`Welcome back, ${profile?.user?.first_name}! Here's your teaching overview.`}
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
                refetchClasses();
              }}
            >
              Refresh
            </Button>
          </div>
        }
      />

      {/* Teaching Overview */}
      <DashboardSection title="Teaching Overview" delay={0.1}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Students"
            value={totalStudents}
            change="+5 this semester"
            changeType="positive"
            trend={FiTrendingUp}
            icon={FiUsers}
          />

          <MetricCard
            title="Active Classes"
            value={totalClasses}
            change="This semester"
            changeType="neutral"
            icon={FiBook}
          />

          <MetricCard
            title="Attendance Rate"
            value={`${attendanceRate}%`}
            change="Excellent overall"
            changeType="positive"
            icon={FiTarget}
          />

          <MetricCard
            title="Pending Grades"
            value={pendingGrades}
            change="To be reviewed"
            changeType={pendingGrades > 0 ? "warning" : "positive"}
            icon={FiClipboard}
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

        {/* My Classes */}
        <ActivityCard
          title="My Classes"
          loading={classesLoading}
          action={
            <Button variant="outline" size="sm" href="/teacher/classes">
              View All
            </Button>
          }
          emptyState={
            <div className="text-center text-gray-500">
              <FiBook className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No Classes Assigned</p>
              <p className="text-xs mt-1">You haven't been assigned to any classes yet.</p>
            </div>
          }
        >
          {classes?.classes?.slice(0, 5).map((classItem, index) => (
            <ActivityItem
              key={index}
              icon={FiBook}
              title={classItem.course_name}
              description={`${classItem.semester} • ${classItem.student_count} students`}
              status={classItem.status}
              time={classItem.pendingGrades > 0 ? `${classItem.pendingGrades} pending` : 'Up to date'}
            />
          ))}
        </ActivityCard>
      </div>

      {/* Today's Schedule & Recent Students */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <ActivityCard
          title="Today's Schedule"
          loading={timetableLoading}
          action={
            <Button variant="outline" size="sm" href="/teacher/timetable">
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
              status={classItem.day}
              time={classItem.room || 'TBA'}
            />
          ))}
        </ActivityCard>

        {/* Recent Students */}
        <ActivityCard
          title="Recent Students"
          loading={studentsLoading}
          action={
            <Button variant="outline" size="sm" href="/teacher/classes">
              View All
            </Button>
          }
          emptyState={
            <div className="text-center text-gray-500">
              <FiUsers className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No Students Yet</p>
              <p className="text-xs mt-1">Students will appear here once classes are assigned.</p>
            </div>
          }
        >
          {students?.students?.slice(0, 5).map((student, index) => (
            <ActivityItem
              key={index}
              icon={FiUser}
              title={`${student.first_name} ${student.last_name}`}
              description={student.course_name}
              status="active"
              time="Enrolled"
            />
          ))}
        </ActivityCard>
      </div>
    </div>
  );
};

export default TeacherDashboard;
