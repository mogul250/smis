import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { useApi, useAsyncOperation } from '../../hooks/useApi';
import { adminAPI } from '../../services/api';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { 
  FiPlus, 
  FiEdit, 
  FiTrash2, 
  FiBook, 
  FiSearch,
  FiRefreshCw,
  FiBookOpen,
  FiClock,
  FiAward
} from 'react-icons/fi';

const AdminCourses = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  // Form state for create/edit course
  const [courseForm, setCourseForm] = useState({
    name: '',
    course_code: '',
    credits: '',
    description: '',
    semester: ''
  });

  // Check authentication and authorization
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
  }, [isAuthenticated, user, router]);

  // Refetch when filters change
  useEffect(() => {
    refetch();
  }, [searchTerm, selectedSemester]);

  // API calls
  const { data: coursesData, loading, error, refetch } = useApi(() =>
    adminAPI.getAllCourses(1, 50, {
      search: searchTerm,
      semester: selectedSemester !== 'all' ? selectedSemester : undefined
    })
  );

  // Extract courses from the response
  const courses = coursesData?.courses || [];

  const { data: departments } = useApi(() => 
    adminAPI.getAllDepartments ? adminAPI.getAllDepartments() : Promise.resolve([])
  );
  
  const { loading: managing, execute: manageCourse } = useAsyncOperation();

  // Filter courses based on search and filters (client-side filtering for additional refinement)
  const filteredCourses = courses?.filter(course => {
    const matchesSearch = course.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.course_code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSemester = selectedSemester === 'all' || course.semester === selectedSemester;
    
    return matchesSearch && matchesSemester;
  }) || [];

  const handleManageCourse = async (e) => {
    e.preventDefault();
    try {
      const action = editingCourse ? 'update' : 'create';
      const courseData = {
        action,
        ...courseForm,
        id: editingCourse?.id
      };

      await manageCourse(() => adminAPI.manageCourses(courseData));
      setActionMessage({ 
        type: 'success', 
        message: `Course ${action === 'create' ? 'created' : 'updated'} successfully!` 
      });
      
      setShowCreateModal(false);
      setEditingCourse(null);
      setCourseForm({
        name: '',
        course_code: '',
        credits: '',
        description: '',
        semester: ''
      });
      refetch();
    } catch (error) {
      setActionMessage({ 
        type: 'error', 
        message: error.response?.data?.message || error.message || `Failed to ${editingCourse ? 'update' : 'create'} course` 
      });
    }
  };

  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setCourseForm({
      name: course.name || '',
      course_code: course.course_code || '',
      credits: course.credits || '',
      description: course.description || '',
      semester: course.semester || ''
    });
    setShowCreateModal(true);
  };

  const handleDeleteCourse = async (courseId) => {
    if (!confirm('Are you sure you want to delete this course?')) return;
    
    try {
      await manageCourse(() => adminAPI.manageCourses({ action: 'delete', id: courseId }));
      setActionMessage({ type: 'success', message: 'Course deleted successfully!' });
      refetch();
    } catch (error) {
      setActionMessage({ 
        type: 'error', 
        message: error.response?.data?.message || error.message || 'Failed to delete course' 
      });
    }
  };

  const courseColumns = [
    {
      header: 'Course Code',
      accessor: 'course_code',
      cell: (value) => (
        <span className="font-mono text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
          {value || 'N/A'}
        </span>
      )
    },
    {
      header: 'Course Name',
      accessor: 'name',
      cell: (value) => (
        <div className="font-medium text-gray-900">{value || 'N/A'}</div>
      )
    },
    {
      header: 'Department',
      accessor: 'department_name',
      cell: (value) => (
        <div className="text-sm text-gray-600">{value || 'N/A'}</div>
      )
    },
    {
      header: 'Credits',
      accessor: 'credits',
      cell: (value) => (
        <div className="flex items-center text-sm text-gray-600">
          <FiAward className="w-4 h-4 mr-1" />
          {value || 0}
        </div>
      )
    },
    {
      header: 'Semester',
      accessor: 'semester',
      cell: (value) => (
        <div className="flex items-center text-sm text-gray-600">
          <FiClock className="w-4 h-4 mr-1" />
          {value || 'N/A'}
        </div>
      )
    },
    {
      header: 'Year',
      accessor: 'year',
      cell: (value) => (
        <div className="text-sm text-gray-600">{value || 'N/A'}</div>
      )
    },
    {
      header: 'Actions',
      accessor: 'id',
      cell: (value, row) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            icon={FiEdit}
            onClick={() => handleEditCourse(row)}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={FiTrash2}
            onClick={() => handleDeleteCourse(value)}
            className="text-red-600 hover:text-red-700"
          >
            Delete
          </Button>
        </div>
      )
    }
  ];

  if (!isAuthenticated || user?.role !== 'admin') {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <FiBookOpen className="w-8 h-8 mr-3 text-blue-600" />
                  Course Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage academic courses and curriculum
                </p>
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  icon={FiRefreshCw}
                  onClick={refetch}
                  disabled={loading}
                >
                  Refresh
                </Button>
                <Button
                  icon={FiPlus}
                  onClick={() => setShowCreateModal(true)}
                >
                  Add Course
                </Button>
              </div>
            </div>
          </div>

          {/* Action Message */}
          {actionMessage && (
            <Alert
              type={actionMessage.type}
              message={actionMessage.message}
              onClose={() => setActionMessage(null)}
              className="mb-6"
            />
          )}

          {/* Search and Filters */}
          <Card className="p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
              >
                <option value="all">All Semesters</option>
                <option value="Fall 2024">Fall 2024</option>
                <option value="Spring 2024">Spring 2024</option>
                <option value="Summer 2024">Summer 2024</option>
                <option value="Fall 2023">Fall 2023</option>
                <option value="Spring 2023">Spring 2023</option>
              </Select>
            </div>
          </Card>

          {/* Courses Table */}
          <Card className="overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <LoadingSpinner />
                <p className="text-gray-600 mt-2">Loading courses...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <p className="text-red-600">Error loading courses: {error}</p>
                <Button variant="outline" onClick={refetch} className="mt-4">
                  Try Again
                </Button>
              </div>
            ) : (
              <DataTable
                columns={courseColumns}
                data={filteredCourses}
                emptyMessage="No courses found. Click 'Add Course' to create your first course."
              />
            )}
          </Card>

          {/* Create/Edit Course Modal */}
          <Modal
            isOpen={showCreateModal}
            onClose={() => {
              setShowCreateModal(false);
              setEditingCourse(null);
              setCourseForm({
                name: '',
                course_code: '',
                credits: '',
                description: '',
                semester: ''
              });
            }}
            title={editingCourse ? 'Edit Course' : 'Create New Course'}
          >
            <form onSubmit={handleManageCourse} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Course Name"
                  type="text"
                  value={courseForm.name}
                  onChange={(e) => setCourseForm({...courseForm, name: e.target.value})}
                  required
                  placeholder="e.g., Data Structures"
                />
                <Input
                  label="Course Code"
                  type="text"
                  value={courseForm.course_code}
                  onChange={(e) => setCourseForm({...courseForm, course_code: e.target.value})}
                  required
                  placeholder="e.g., CS201"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Credits"
                  type="number"
                  value={courseForm.credits}
                  onChange={(e) => setCourseForm({...courseForm, credits: e.target.value})}
                  required
                  min="1"
                  max="6"
                />
                <Input
                  label="Semester"
                  type="text"
                  value={courseForm.semester}
                  onChange={(e) => setCourseForm({...courseForm, semester: e.target.value})}
                  placeholder="e.g., Fall 2024"
                />
              </div>

              <Input
                label="Description"
                type="textarea"
                value={courseForm.description}
                onChange={(e) => setCourseForm({...courseForm, description: e.target.value})}
                placeholder="Course description..."
                rows={3}
              />

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingCourse(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={managing}
                >
                  {editingCourse ? 'Update' : 'Create'} Course
                </Button>
              </div>
            </form>
          </Modal>
        </main>
      </div>
    </div>
  );
};

export default AdminCourses;
