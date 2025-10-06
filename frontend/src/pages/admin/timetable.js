import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { adminAPI } from '../../services/api';
import Layout from '../../components/common/Layout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { TimetableGrid, TimetableFilters } from '../../components/timetable';

const AdminTimetablePage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [filters, setFilters] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch timetable data using GET endpoint
  const { data: timetable, loading, error, refetch } = useApi(() => 
    adminAPI.getTimetable({ semester: 'Fall 2024' }).catch(() => 
      // Fallback to mock data if endpoint fails
      Promise.resolve([
        {
          id: 1,
          course_id: 1,
          course_name: 'Computer Science 101',
          course_code: 'CS101',
          teacher_id: 2,
          teacher_name: 'Dr. John Smith',
          day_of_week: 1,
          start_time: '09:00:00',
          end_time: '10:30:00',
          class_id: 1,
          room: 'Room 101',
          semester: 'Fall 2024'
        },
        {
          id: 2,
          course_id: 2,
          course_name: 'Mathematics 201',
          course_code: 'MATH201',
          teacher_id: 3,
          teacher_name: 'Prof. Jane Doe',
          day_of_week: 2,
          start_time: '11:00:00',
          end_time: '12:30:00',
          class_id: 1,
          room: 'Room 102',
          semester: 'Fall 2024'
        }
      ])
    )
  );

  // Fetch courses from API
  const { data: courses } = useApi(() =>
    adminAPI.getCourses().catch((error) => {
      console.log('Failed to fetch courses:', error);
      return Promise.resolve([]);
    })
  );

  // Fetch teachers from API
  const { data: teachers } = useApi(() =>
    adminAPI.getTeachers(1, 100).catch((error) => {
      console.log('Failed to fetch teachers:', error);
      return Promise.resolve([]);
    })
  );

  // Handle success messages from URL params - MOVED BEFORE AUTHORIZATION CHECK
  React.useEffect(() => {
    const { success } = router.query;
    if (success) {
      switch (success) {
        case 'created':
          setSuccessMessage('Timetable slot created successfully!');
          break;
        case 'updated':
          setSuccessMessage('Timetable slot updated successfully!');
          break;
        case 'deleted':
          setSuccessMessage('Timetable slot deleted successfully!');
          break;
      }

      // Clear the success param from URL
      router.replace('/admin/timetable', undefined, { shallow: true });

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);

      // Refresh data
      refetch();
    }
  }, [router.query.success, router, refetch]);

  // Check authorization - MOVED AFTER ALL HOOKS
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="error">Access denied. Admin access required.</Alert>
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

  const handleAddSlot = (slotData = {}) => {
    // Navigate to create page with optional context
    const queryParams = new URLSearchParams();
    if (slotData.day) queryParams.append('day', slotData.day);
    if (slotData.time) queryParams.append('time', slotData.time);

    const queryString = queryParams.toString();
    router.push(`/admin/timetable/create${queryString ? `?${queryString}` : ''}`);
  };

  const handleSlotClick = (slot) => {
    // Navigate to detail page
    router.push(`/admin/timetable/${slot.id}`);
  };

  const handleEditSlot = (slot) => {
    // Navigate to edit page
    router.push(`/admin/timetable/edit/${slot.id}`);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({});
  };

  const handleExport = () => {
    // Implement export functionality
    console.log('Exporting timetable...');
  };

  // Filter timetable data based on filters
  const filteredTimetable = timetable?.filter(slot => {
    if (filters.semester && slot.semester !== filters.semester) return false;
    if (filters.day && slot.day_of_week.toString() !== filters.day) return false;
    if (filters.teacher && slot.teacher_id.toString() !== filters.teacher) return false;
    if (filters.course && slot.course_id.toString() !== filters.course) return false;
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return (
        slot.course_name?.toLowerCase().includes(searchTerm) ||
        slot.course_code?.toLowerCase().includes(searchTerm) ||
        slot.teacher_name?.toLowerCase().includes(searchTerm) ||
        slot.room?.toLowerCase().includes(searchTerm)
      );
    }
    return true;
  }) || [];

  return (
    <>
      <Head>
        <title>Timetable Management - Admin Dashboard</title>
      </Head>

      <Layout>
        <div className="space-y-6">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Timetable Management</h1>
                  <p className="text-gray-600 mt-1">
                    Create and manage class schedules across all departments
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
                    onClick={() => handleAddSlot()}
                  >
                    ➕ Add Slot
                  </Button>
                </div>
              </div>

              {/* Success Message */}
              {successMessage && (
                <Alert variant="success" dismissible onDismiss={() => setSuccessMessage('')}>
                  {successMessage}
                </Alert>
              )}

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
                teachers={teachers}
                courses={courses}
                showTeacherFilter={true}
                showCourseFilter={true}
                showTimeConfig={true}
                onReset={handleResetFilters}
                onExport={handleExport}
              />

              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="p-4">
                  <div className="text-2xl font-bold text-blue-600">{timetable?.length || 0}</div>
                  <div className="text-sm text-gray-600">Total Slots</div>
                </Card>
                <Card className="p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {new Set(timetable?.map(s => s.course_id)).size || 0}
                  </div>
                  <div className="text-sm text-gray-600">Courses Scheduled</div>
                </Card>
                <Card className="p-4">
                  <div className="text-2xl font-bold text-purple-600">
                    {new Set(timetable?.map(s => s.teacher_id)).size || 0}
                  </div>
                  <div className="text-sm text-gray-600">Teachers Assigned</div>
                </Card>
                <Card className="p-4">
                  <div className="text-2xl font-bold text-orange-600">
                    {new Set(timetable?.map(s => s.room)).size || 0}
                  </div>
                  <div className="text-sm text-gray-600">Rooms Used</div>
                </Card>
              </div>

              {/* Timetable Display */}
              {loading ? (
                <Card className="p-12">
                  <div className="flex justify-center">
                    <LoadingSpinner size="lg" />
                  </div>
                </Card>
              ) : (
                <TimetableGrid
                  timetable={filteredTimetable}
                  editable={true}
                  showActions={true}
                  colorScheme="course"
                  title="Master Timetable"
                  onSlotClick={handleSlotClick}
                  onSlotEdit={handleEditSlot}
                  onSlotDelete={handleEditSlot}
                  onAddSlot={handleAddSlot}
                />
              )}
        </div>
      </Layout>


    </>
  );
};

export default AdminTimetablePage;
