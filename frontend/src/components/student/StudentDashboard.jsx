import React from 'react';
import { useApi } from '../../hooks/useApi';
import { studentAPI } from '../../services/apiService';
import { FiBook, FiCalendar, FiDollarSign, FiUser, FiTrendingUp } from 'react-icons/fi';
import Card from '../common/Card';
import Badge from '../common/Badge';
import LoadingSpinner from '../common/LoadingSpinner';

const StudentDashboard = () => {
  const { data: profile, loading: profileLoading } = useApi(studentAPI.getProfile);
  const { data: grades, loading: gradesLoading } = useApi(studentAPI.getGrades);
  const { data: fees, loading: feesLoading } = useApi(studentAPI.getFees);

  const quickStats = [
    {
      title: 'Current GPA',
      value: grades?.gpa || 'N/A',
      icon: FiTrendingUp,
      color: 'bg-accent-green',
    },
    {
      title: 'Total Courses',
      value: grades?.grades?.length || 0,
      icon: FiBook,
      color: 'bg-primary-light',
    },
    {
      title: 'Outstanding Fees',
      value: fees?.totalOutstanding ? `$${fees.totalOutstanding}` : '$0',
      icon: FiDollarSign,
      color: fees?.totalOutstanding > 0 ? 'bg-accent-red' : 'bg-accent-green',
    },
  ];

  const recentGrades = grades?.grades?.slice(0, 5) || [];

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <Card>
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-primary-blue rounded-full flex items-center justify-center">
            <FiUser className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {profile?.user?.first_name}!
            </h1>
            <p className="text-gray-600">
              Here's your academic overview for today.
            </p>
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickStats.map((stat, index) => (
          <Card key={index}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Grades */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recent Grades</h2>
          </div>
          {gradesLoading ? (
            <div className="flex justify-center py-4">
              <div className="spinner"></div>
            </div>
          ) : recentGrades.length > 0 ? (
            <div className="space-y-3">
              {recentGrades.map((grade, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{grade.course_name}</p>
                    <p className="text-sm text-gray-600">{grade.semester} {grade.year}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-primary-blue">{grade.grade}</p>
                  </div>
                </div>
              ))}
              <div className="pt-2">
                <a href="/student/grades" className="text-primary-light hover:text-primary-blue text-sm font-medium">
                  View all grades →
                </a>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No grades available yet.</p>
          )}
        </div>

        {/* Fee Status */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Fee Status</h2>
          </div>
          {feesLoading ? (
            <div className="flex justify-center py-4">
              <div className="spinner"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Outstanding:</span>
                <span className={`font-bold text-lg ${
                  fees?.totalOutstanding > 0 ? 'text-accent-red' : 'text-accent-green'
                }`}>
                  ${fees?.totalOutstanding || 0}
                </span>
              </div>
              
              {fees?.fees?.slice(0, 3).map((fee, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{fee.fee_type}</p>
                    <p className="text-sm text-gray-600">Due: {new Date(fee.due_date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-accent-red">${fee.amount}</p>
                    <span className={`badge ${
                      fee.status === 'paid' ? 'badge-success' : 'badge-danger'
                    }`}>
                      {fee.status}
                    </span>
                  </div>
                </div>
              ))}
              
              <div className="pt-2">
                <a href="/student/fees" className="text-primary-light hover:text-primary-blue text-sm font-medium">
                  View all fees →
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a href="/student/timetable" className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <FiCalendar className="w-8 h-8 text-primary-blue mb-2" />
            <span className="text-sm font-medium text-gray-900">View Timetable</span>
          </a>
          <a href="/student/attendance" className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <FiBook className="w-8 h-8 text-primary-blue mb-2" />
            <span className="text-sm font-medium text-gray-900">Attendance</span>
          </a>
          <a href="/student/grades" className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <FiTrendingUp className="w-8 h-8 text-primary-blue mb-2" />
            <span className="text-sm font-medium text-gray-900">View Grades</span>
          </a>
          <a href="/student/profile" className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <FiUser className="w-8 h-8 text-primary-blue mb-2" />
            <span className="text-sm font-medium text-gray-900">Update Profile</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
