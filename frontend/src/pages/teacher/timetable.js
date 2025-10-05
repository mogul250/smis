import React, { useState } from 'react';
import Head from 'next/head';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { teacherAPI } from '../../services/api';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';
import { TimetableGrid, TimetableFilters } from '../../components/timetable';

const TeacherTimetablePage = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState({ semester: 'current' });
  const [refreshing, setRefreshing] = useState(false);

  // Fetch teacher's timetable
  const { data: timetable, loading, error, refetch } = useApi(() => 
    teacherAPI.getTimetable({ semester: filters.semester === 'current' ? undefined : filters.semester })
  );

  // Check authorization
  if (!user || user.role !== 'teacher') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="error">Access denied. Teacher access required.</Alert>
      </div>
    );
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({ semester: 'current' });
  };

  const handleExport = () => {
    // Create a simple text export of the timetable
    if (!timetable || timetable.length === 0) {
      alert('No timetable data to export');
      return;
    }

    const exportData = timetable.map(slot => ({
      Day: getDayName(slot.day_of_week),
      Time: `${slot.start_time?.substring(0, 5)} - ${slot.end_time?.substring(0, 5)}`,
      Course: `${slot.course_code} - ${slot.course_name}`,
      Room: slot.room || 'TBA',
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
    a.download = `my-timetable-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Helper function to get day name from number
  function getDayName(dayNumber) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNumber] || 'Unknown';
  }

  // Calculate statistics
  const stats = {
    totalClasses: timetable?.length || 0,
    uniqueCourses: new Set(timetable?.map(s => s.course_id)).size || 0,
    hoursPerWeek: timetable?.reduce((total, slot) => {
      const start = new Date(`1970-01-01T${slot.start_time}`);
      const end = new Date(`1970-01-01T${slot.end_time}`);
      return total + (end - start) / (1000 * 60 * 60);
    }, 0) || 0,
    busyDays: new Set(timetable?.map(s => s.day_of_week)).size || 0
  };

  // Filter timetable data
  const filteredTimetable = timetable?.filter(slot => {
    if (filters.day && slot.day_of_week.toString() !== filters.day) return false;
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return (
        slot.course_name?.toLowerCase().includes(searchTerm) ||
        slot.course_code?.toLowerCase().includes(searchTerm) ||
        slot.room?.toLowerCase().includes(searchTerm)
      );
    }
    return true;
  }) || [];

  return (
    <>
      <Head>
        <title>My Timetable - Teacher Dashboard</title>
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
                  <h1 className="text-3xl font-bold text-gray-900">My Timetable</h1>
                  <p className="text-gray-600 mt-1">
                    View your teaching schedule and class assignments
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

              {/* Error Message */}
              {error && (
                <Alert variant="error">
                  Error loading timetable: {error}
                </Alert>
              )}

              {/* Filters */}
              <TimetableFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                onReset={handleResetFilters}
                onExport={handleExport}
              />

              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="p-4">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalClasses}</div>
                  <div className="text-sm text-gray-600">Total Classes</div>
                </Card>
                <Card className="p-4">
                  <div className="text-2xl font-bold text-green-600">{stats.uniqueCourses}</div>
                  <div className="text-sm text-gray-600">Courses Teaching</div>
                </Card>
                <Card className="p-4">
                  <div className="text-2xl font-bold text-purple-600">{stats.hoursPerWeek.toFixed(1)}</div>
                  <div className="text-sm text-gray-600">Hours per Week</div>
                </Card>
                <Card className="p-4">
                  <div className="text-2xl font-bold text-orange-600">{stats.busyDays}</div>
                  <div className="text-sm text-gray-600">Teaching Days</div>
                </Card>
              </div>

              {/* Quick Info */}
              {timetable && timetable.length > 0 && (
                <Card className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Next Class */}
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-sm font-medium text-blue-800">Next Class</div>
                      <div className="text-blue-600">
                        {/* This would need more complex logic to find actual next class */}
                        Check your schedule below
                      </div>
                    </div>
                    
                    {/* Most Frequent Room */}
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-sm font-medium text-green-800">Most Used Room</div>
                      <div className="text-green-600">
                        {timetable.reduce((acc, slot) => {
                          acc[slot.room] = (acc[slot.room] || 0) + 1;
                          return acc;
                        }, {})}
                        {Object.entries(timetable.reduce((acc, slot) => {
                          acc[slot.room] = (acc[slot.room] || 0) + 1;
                          return acc;
                        }, {})).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}
                      </div>
                    </div>

                    {/* Busiest Day */}
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="text-sm font-medium text-purple-800">Busiest Day</div>
                      <div className="text-purple-600">
                        {Object.entries(timetable.reduce((acc, slot) => {
                          const day = getDayName(slot.day_of_week);
                          acc[day] = (acc[day] || 0) + 1;
                          return acc;
                        }, {})).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Timetable Display */}
              {loading ? (
                <Card className="p-12">
                  <div className="flex justify-center">
                    <LoadingSpinner size="lg" />
                  </div>
                </Card>
              ) : timetable && timetable.length > 0 ? (
                <TimetableGrid
                  timetable={filteredTimetable}
                  editable={false}
                  showActions={false}
                  colorScheme="course"
                  title="My Teaching Schedule"
                />
              ) : (
                <Card className="p-12 text-center">
                  <div className="text-gray-500">
                    <div className="text-4xl mb-4">📅</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Scheduled</h3>
                    <p className="text-gray-600">
                      You don't have any classes scheduled for the selected semester.
                      Contact your department head if this seems incorrect.
                    </p>
                  </div>
                </Card>
              )}

              {/* Course List */}
              {timetable && timetable.length > 0 && (
                <Card>
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Course Details</h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Array.from(new Set(timetable.map(s => s.course_id))).map(courseId => {
                        const course = timetable.find(s => s.course_id === courseId);
                        const courseSlots = timetable.filter(s => s.course_id === courseId);
                        
                        return (
                          <div key={courseId} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-medium text-gray-900">{course.course_name}</h4>
                                <p className="text-sm text-gray-600">{course.course_code}</p>
                              </div>
                              <Badge variant="primary" size="sm">
                                {courseSlots.length} {courseSlots.length === 1 ? 'class' : 'classes'}
                              </Badge>
                            </div>
                            <div className="space-y-1 text-sm text-gray-600">
                              {courseSlots.map((slot, index) => (
                                <div key={index}>
                                  {getDayName(slot.day_of_week)} {slot.start_time?.substring(0, 5)} - {slot.end_time?.substring(0, 5)}
                                  {slot.room && ` • ${slot.room}`}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
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

export default TeacherTimetablePage;
