import React, { useState } from 'react';
import Head from 'next/head';
import { useAuth } from '../../hooks/useAuth';
import { useApi, useAsyncOperation } from '../../hooks/useApi';
import { adminAPI } from '../../services/apiService';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { TimetableGrid, TimetableModal, TimetableFilters } from '../../components/timetable';

const AdminTimetablePage = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [modalMode, setModalMode] = useState('create');
  const [successMessage, setSuccessMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch timetable data (we'll need to create a GET endpoint or use existing data)
  const { data: timetable, loading, error, refetch } = useApi(() => 
    // For now, return mock data since there's no GET endpoint for all timetables
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
        room: 'Room 102',
        semester: 'Fall 2024'
      }
    ])
  );

  // Mock data for dropdowns (in real app, these would come from API)
  const courses = [
    { id: 1, name: 'Computer Science 101', course_code: 'CS101' },
    { id: 2, name: 'Mathematics 201', course_code: 'MATH201' },
    { id: 3, name: 'Physics 101', course_code: 'PHY101' }
  ];

  const teachers = [
    { id: 2, first_name: 'John', last_name: 'Smith' },
    { id: 3, first_name: 'Jane', last_name: 'Doe' },
    { id: 4, first_name: 'Bob', last_name: 'Wilson' }
  ];

  // Timetable operations
  const { execute: createSlot, loading: creating } = useAsyncOperation();
  const { execute: updateSlot, loading: updating } = useAsyncOperation();
  const { execute: deleteSlot, loading: deleting } = useAsyncOperation();

  // Check authorization
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
    setEditingSlot(slotData);
    setModalMode('create');
    setShowModal(true);
  };

  const handleEditSlot = (slot) => {
    setEditingSlot(slot);
    setModalMode('edit');
    setShowModal(true);
  };

  const handleDeleteSlot = async (slot) => {
    if (!confirm(`Are you sure you want to delete this timetable slot for ${slot.course_name}?`)) {
      return;
    }

    try {
      await deleteSlot(() => adminAPI.setupTimetable({
        action: 'delete',
        timetableData: { id: slot.id }
      }));
      
      setSuccessMessage('Timetable slot deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      refetch();
    } catch (error) {
      console.error('Error deleting slot:', error);
    }
  };

  const handleSaveSlot = async (slotData) => {
    try {
      if (modalMode === 'create') {
        await createSlot(() => adminAPI.setupTimetable({
          action: 'add',
          timetableData: {
            course_id: slotData.course_id,
            teacher_id: slotData.teacher_id,
            day: slotData.day_of_week,
            start_time: slotData.start_time,
            end_time: slotData.end_time,
            room: slotData.room,
            semester: slotData.semester
          }
        }));
        setSuccessMessage('Timetable slot created successfully');
      } else {
        await updateSlot(() => adminAPI.setupTimetable({
          action: 'update',
          timetableData: {
            id: slotData.id,
            course_id: slotData.course_id,
            teacher_id: slotData.teacher_id,
            day: slotData.day_of_week,
            start_time: slotData.start_time,
            end_time: slotData.end_time,
            room: slotData.room,
            semester: slotData.semester
          }
        }));
        setSuccessMessage('Timetable slot updated successfully');
      }
      
      setTimeout(() => setSuccessMessage(''), 3000);
      setShowModal(false);
      setEditingSlot(null);
      refetch();
    } catch (error) {
      console.error('Error saving slot:', error);
    }
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
                  onSlotClick={handleEditSlot}
                  onSlotEdit={handleEditSlot}
                  onSlotDelete={handleDeleteSlot}
                  onAddSlot={handleAddSlot}
                />
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Timetable Modal */}
      <TimetableModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingSlot(null);
        }}
        onSave={handleSaveSlot}
        slot={editingSlot}
        mode={modalMode}
        courses={courses}
        teachers={teachers}
        loading={creating || updating}
      />
    </>
  );
};

export default AdminTimetablePage;
