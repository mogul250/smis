import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { studentAPI } from '../../services/apiService';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { FiCalendar, FiCheck, FiX, FiClock, FiBarChart3 } from 'react-icons/fi';

const StudentAttendance = () => {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const { data: attendance, loading, error, refetch } = useApi(
    () => studentAPI.getAttendance(dateRange),
    [dateRange]
  );

  if (!user || user.role !== 'student') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="error">Access denied. Student access required.</Alert>
      </div>
    );
  }

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Calculate attendance statistics
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
      case 'present': return FiCheck;
      case 'late': return FiClock;
      case 'absent': return FiX;
      default: return FiCalendar;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
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
                Failed to load attendance: {error}
              </Alert>
            ) : (
              <>
                {/* Attendance Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  <Card>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-primary-blue rounded-lg flex items-center justify-center mr-4">
                        <FiBarChart3 className="w-6 h-6 text-white" />
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
                        <FiCalendar className="w-6 h-6 text-white" />
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
                        <FiCheck className="w-6 h-6 text-white" />
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
                        <FiClock className="w-6 h-6 text-white" />
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
                        <FiX className="w-6 h-6 text-white" />
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
                  <Card.Header>
                    <Card.Title>Attendance Records</Card.Title>
                  </Card.Header>
                  
                  {attendance && attendance.length > 0 ? (
                    <Table>
                      <Table.Header>
                        <Table.Row>
                          <Table.Head>Date</Table.Head>
                          <Table.Head>Course</Table.Head>
                          <Table.Head>Teacher</Table.Head>
                          <Table.Head>Status</Table.Head>
                          <Table.Head>Time</Table.Head>
                          <Table.Head>Notes</Table.Head>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {attendance.map((record, index) => {
                          const StatusIcon = getStatusIcon(record.status);
                          return (
                            <Table.Row key={index}>
                              <Table.Cell>
                                <div className="font-medium text-gray-900">
                                  {new Date(record.date).toLocaleDateString()}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                </div>
                              </Table.Cell>
                              <Table.Cell>
                                <div className="font-medium text-gray-900">
                                  {record.course_name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {record.course_code}
                                </div>
                              </Table.Cell>
                              <Table.Cell>
                                <span className="text-gray-900">
                                  {record.teacher_name}
                                </span>
                              </Table.Cell>
                              <Table.Cell>
                                <div className="flex items-center space-x-2">
                                  <StatusIcon className="w-4 h-4" />
                                  <Badge variant={getStatusBadgeVariant(record.status)}>
                                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                                  </Badge>
                                </div>
                              </Table.Cell>
                              <Table.Cell>
                                <span className="text-sm text-gray-600">
                                  {record.marked_at ? new Date(record.marked_at).toLocaleTimeString() : '-'}
                                </span>
                              </Table.Cell>
                              <Table.Cell>
                                <span className="text-sm text-gray-600">
                                  {record.notes || '-'}
                                </span>
                              </Table.Cell>
                            </Table.Row>
                          );
                        })}
                      </Table.Body>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <FiCalendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No attendance records found for the selected date range.</p>
                    </div>
                  )}
                </Card>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentAttendance;
