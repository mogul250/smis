import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { studentAPI } from '../../services/api';
import Layout from '../../components/common/Layout';

import {
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiTrendingUp,
  FiTrendingDown,
  FiRefreshCw
} from 'react-icons/fi';

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg shadow border border-gray-200 p-6 ${className}`}>
    {children}
  </div>
);

const Alert = ({ children, variant = 'info' }) => {
  const variantClasses = {
    error: 'bg-red-100 text-red-800 border border-red-200',
    info: 'bg-blue-100 text-blue-800 border border-blue-200',
    success: 'bg-green-100 text-green-800 border border-green-200'
  };
  
  return (
    <div className={`p-4 rounded ${variantClasses[variant]}`}>
      {children}
    </div>
  );
};



const Badge = ({ children, variant = 'default' }) => {
  const variantClasses = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    default: 'bg-gray-100 text-gray-800'
  };

  return (
    <span className={`px-2 py-1 rounded text-sm font-medium ${variantClasses[variant]}`}>
      {children}
    </span>
  );
};

const LoadingSpinner = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex justify-center">
      <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]}`}></div>
    </div>
  );
};

const StudentAttendance = () => {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const { data: attendance, loading, error, refetch } = useApi(
    () => {
      console.log('Fetching attendance with dateRange:', dateRange);
      return studentAPI.getAttendance(dateRange.startDate, dateRange.endDate);
    },
    [dateRange]
  );

  // Calculate attendance statistics - moved before conditional returns
  const attendanceStats = React.useMemo(() => {
    if (!attendance || attendance.length === 0) {
      return { total: 0, present: 0, absent: 0, late: 0, percentage: 0 };
    }

    const total = attendance.length;
    const present = attendance.filter(a => a.status === 'present').length;
    const absent = attendance.filter(a => a.status === 'absent').length;
    const late = attendance.filter(a => a.status === 'late').length;
    const percentage = total > 0 ? ((present + late) / total * 100).toFixed(1) : 0;

    return { total, present, absent, late, percentage };
  }, [attendance]);

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Debug logging
  console.log('User:', user);
  console.log('Attendance data:', attendance);
  console.log('Loading:', loading);
  console.log('Error:', error);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="error">Please log in to access attendance records.</Alert>
      </div>
    );
  }

  if (user.role !== 'student') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="error">Access denied. Student access required.</Alert>
      </div>
    );
  }

  function getStatusBadgeVariant(status) {
    switch (status) {
      case 'present': return 'success';
      case 'late': return 'warning';
      case 'absent': return 'danger';
      default: return 'default';
    }
  }

  function getStatusIcon(status) {
    switch (status) {
      case 'present': return () => <FiCheckCircle className="text-green-600" />;
      case 'late': return () => <FiClock className="text-yellow-600" />;
      case 'absent': return () => <FiXCircle className="text-red-600" />;
      default: return () => <FiCalendar className="text-gray-600" />;
    }
  }

  return (
    <Layout maxWidth="max-w-7xl mx-auto" enableAnimation={true}>
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Page Header */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Attendance Record</h1>
              <p className="text-gray-600">Track your class attendance and participation</p>
            </div>

            {/* Date Range Filter */}
            <Card>
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => handleDateChange('startDate', e.target.value)}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => handleDateChange('endDate', e.target.value)}
                    className="form-input"
                  />
                </div>
                <button
                  onClick={refetch}
                  className="btn btn-primary"
                >
                  Update
                </button>
              </div>
            </Card>

            {loading ? (
              <Card className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </Card>
            ) : error ? (
              <Alert variant="error">
                <div>
                  <p><strong>Failed to load attendance:</strong> {error}</p>
                  <p className="text-sm mt-2">
                    Debug info: User role: {user?.role}, User ID: {user?.id}
                  </p>
                  <button 
                    onClick={refetch}
                    className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    Retry
                  </button>
                </div>
              </Alert>
            ) : (
              <>
                {/* Attendance Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  <Card>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-primary-blue rounded-lg flex items-center justify-center mr-4">
                        <FiTrendingUp className="text-white text-xl" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                        <p className="text-2xl font-bold text-gray-900">{attendanceStats.percentage}%</p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gray-500 rounded-lg flex items-center justify-center mr-4">
                        <FiCalendar className="text-white text-xl" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Classes</p>
                        <p className="text-2xl font-bold text-gray-900">{attendanceStats.total}</p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-accent-green rounded-lg flex items-center justify-center mr-4">
                        <FiCheckCircle className="text-white text-xl" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Present</p>
                        <p className="text-2xl font-bold text-gray-900">{attendanceStats.present}</p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-accent-orange rounded-lg flex items-center justify-center mr-4">
                        <FiClock className="text-white text-xl" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Late</p>
                        <p className="text-2xl font-bold text-gray-900">{attendanceStats.late}</p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-accent-red rounded-lg flex items-center justify-center mr-4">
                        <FiXCircle className="text-white text-xl" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Absent</p>
                        <p className="text-2xl font-bold text-gray-900">{attendanceStats.absent}</p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Attendance Records Table */}
                <Card>
                  <div className="border-b border-gray-200 pb-4 mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Attendance Records</h3>
                  </div>
                  {attendance && attendance.length > 0 ? (
                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {attendance.map((record, index) => {
                            const StatusIcon = getStatusIcon(record.status);
                            return (
                              <tr key={index} className="transition-colors hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <div className="font-medium text-gray-900">
                                    {new Date(record.date).toLocaleDateString()}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <div className="font-medium text-gray-900">
                                    {record.course_name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {record.course_code}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <span className="text-gray-900">
                                    {record.teacher_name || 'N/A'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <div className="flex items-center space-x-2">
                                    <StatusIcon />
                                    <Badge variant={getStatusBadgeVariant(record.status)}>
                                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                                    </Badge>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <span className="text-sm text-gray-600">
                                    {record.marked_at ? new Date(record.marked_at).toLocaleTimeString() : '-'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <span className="text-sm text-gray-600">
                                    {record.notes || '-'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FiCalendar className="text-4xl mb-4 block text-gray-400" />
                      <p className="text-gray-500">No attendance records found for the selected date range.</p>
                    </div>
                  )}
                </Card>
              </>
            )}
          </div>
    </Layout>
  );
};

export default StudentAttendance;
