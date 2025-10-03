import React, { useState } from 'react';
import Head from 'next/head';
import { useAuth } from '../../hooks/useAuth';
import { useApi, useAsyncOperation } from '../../hooks/useApi';
import { hodAPI } from '../../services/api';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { TimetableGrid, TimetableFilters } from '../../components/timetable';
import { FiCalendar, FiCheck, FiClock, FiX } from 'react-icons/fi';

const TimetablePage = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState({ semester: 'current' });
  const [refreshing, setRefreshing] = useState(false);

  // Fetch timetable data
  const { data: timetable, loading, error, refetch } = useApi(() =>
    hodAPI.getDepartmentTimetable({ semester: filters.semester === 'current' ? undefined : filters.semester })
  );

  // Approve timetable operation
  const { execute: approveTimetable } = useAsyncOperation();

  // Check authorization
  if (!user || user.role !== 'hod') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="error">Access denied. HOD access required.</Alert>
      </div>
    );
  }

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('Error refreshing timetable:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle timetable approval
  const handleApproval = async (timetableId, approve) => {
    try {
      await approveTimetable(() => hodAPI.approveTimetable({
        timetableId,
        approve
      }));
      await refetch();
    } catch (error) {
      console.error('Error approving timetable:', error);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({ semester: 'current' });
  };

  const handleExport = () => {
    // Export functionality
    if (!timetable || timetable.length === 0) {
      alert('No timetable data to export');
      return;
    }

    const exportData = timetable.map(slot => ({
      Day: getDayName(slot.day_of_week),
      Time: `${slot.start_time?.substring(0, 5)} - ${slot.end_time?.substring(0, 5)}`,
      Course: `${slot.course_code} - ${slot.course_name}`,
      Teacher: slot.teacher_name,
      Room: slot.room || 'TBA',
      Status: slot.status || 'N/A',
      Semester: slot.semester || 'N/A'
    }));

    const csvContent = [
      Object.keys(exportData[0]).join(','),
      ...exportData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `department-timetable-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };



  // Helper function to get day name from number
  function getDayName(dayNumber) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNumber] || 'Unknown';
  }



  return (
    <>
      <Head>
        <title>Timetable Management - HOD Dashboard</title>
        <meta name="description" content="Manage department timetable and approve scheduling" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Timetable Management</h1>
                  <p className="text-gray-600 mt-1">
                    View and manage your department's class schedule
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    loading={refreshing}
                  >
                    🔄 Refresh
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    disabled={!timetable || timetable.length === 0}
                  >
                    📥 Export
                  </Button>
                </div>
              </div>

              {/* Error handling */}
              {error && (
                <Alert variant="error" className="mb-6">
                  Error loading timetable: {error.message}
                </Alert>
              )}

              {/* Filters */}
              <TimetableFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                onReset={handleResetFilters}
                onExport={handleExport}
                showTeacherFilter={true}
                showRoomFilter={true}
              />

              {/* Timetable Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-blue-50">
                      <FiCalendar className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Classes</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {loading ? '...' : timetable?.length || 0}
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-green-50">
                      <FiCheck className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Approved</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {loading ? '...' : timetable?.filter(t => t.status === 'approved').length || 0}
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-yellow-50">
                      <FiClock className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Pending</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {loading ? '...' : timetable?.filter(t => t.status === 'pending').length || 0}
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-red-50">
                      <FiX className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Rejected</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {loading ? '...' : timetable?.filter(t => t.status === 'rejected').length || 0}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Timetable Display */}
              {loading ? (
                <Card className="p-12">
                  <div className="flex justify-center">
                    <LoadingSpinner size="lg" />
                  </div>
                </Card>
              ) : timetable && timetable.length > 0 ? (
                <TimetableGrid
                  timetable={timetable}
                  editable={false}
                  showActions={true}
                  colorScheme="teacher"
                  title="Department Timetable"
                  onApprove={handleApproval}
                  showApprovalActions={true}
                />
              ) : (
                <Card className="p-12 text-center">
                  <div className="text-gray-500">
                    <div className="text-4xl mb-4">📅</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Scheduled</h3>
                    <p className="text-gray-600">
                      No classes are scheduled for the selected semester.
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default TimetablePage;
