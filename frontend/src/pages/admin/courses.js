import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { useApi, useAsyncOperation } from '../../hooks/useApi';
import { adminAPI } from '../../services/apiService';
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
    department_id: '',
    semester: '',
    year: '',
    prerequisites: ''
  });

  // Check authentication and authorization
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
  }, [isAuthenticated, user, router]);

  // API calls
  const { data: courses, loading, error, refetch } = useApi(() => 
    // Since there's no direct get courses endpoint, we'll simulate with empty array
    // In a real implementation, you'd have a GET endpoint for courses
    Promise.resolve([])
  );

  const { data: departments } = useApi(() => 
    adminAPI.getAllDepartments ? adminAPI.getAllDepartments() : Promise.resolve([])
  );
  
  const { loading: managing, execute: manageCourse } = useAsyncOperation();

  // Filter courses based on search and filters
  const filteredCourses = courses?.filter(course => {
    const matchesSearch = course.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.course_code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === 'all' || course.department_id === selectedDepartment;
    const matchesSemester = selectedSemester === 'all' || course.semester === selectedSemester;
    
    return matchesSearch && matchesDepartment && matchesSemester;
  }) || [];

  const handleManageCourse = async (e) => {
    e.preventDefault();
    try {
      const action = editingCourse ? 'update' : 'create';
      const courseData = {
        ...courseForm,
        action,
        id: editingCourse?.id
      };

      await manageCourse(() => adminAPI.manageCourses(courseData));
      setActionMessage({ 
        type: 'success', 
        message: `Course ${action}d successfully!` 
      });
      
      setShowCreateModal(false);
      setEditingCourse(null);
      setCourseForm({
        name: '',
        course_code: '',
        credits: '',
        description: '',
        department_id: '',
        semester: '',
        year: '',
        prerequisites: ''
      });
      refetch();
    } catch (error) {
      setActionMessage({ 
        type: 'error', 
        message: error.message || `Failed to ${editingCourse ? 'update' : 'create'} course` 
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
      department_id: course.department_id || '',
      semester: course.semester || '',
      year: course.year || '',
      prerequisites: course.prerequisites || ''
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
      setActionMessage({ type: 'error', message: error.message || 'Failed to delete course' });
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
              >
                <option value="all">All Departments</option>
                {departments?.map(dept => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </Select>
              <Select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
              >
                <option value="all">All Semesters</option>
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
                <option value="3">Semester 3</option>
                <option value="4">Semester 4</option>
                <option value="5">Semester 5</option>
                <option value="6">Semester 6</option>
                <option value="7">Semester 7</option>
                <option value="8">Semester 8</option>
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
                department_id: '',
                semester: '',
                year: '',
                prerequisites: ''
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
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  label="Department"
                  value={courseForm.department_id}
                  onChange={(e) => setCourseForm({...courseForm, department_id: e.target.value})}
                  required
                >
                  <option value="">Select Department</option>
                  {departments?.map(dept => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </Select>
                <Input
                  label="Credits"
                  type="number"
                  value={courseForm.credits}
                  onChange={(e) => setCourseForm({...courseForm, credits: e.target.value})}
                  required
                  min="1"
                  max="6"
                />
                <Select
                  label="Semester"
                  value={courseForm.semester}
                  onChange={(e) => setCourseForm({...courseForm, semester: e.target.value})}
                  required
                >
                  <option value="">Select Semester</option>
                  {[1,2,3,4,5,6,7,8].map(sem => (
                    <option key={sem} value={sem}>Semester {sem}</option>
                  ))}
                </Select>
              </div>

              <Input
                label="Academic Year"
                type="text"
                value={courseForm.year}
                onChange={(e) => setCourseForm({...courseForm, year: e.target.value})}
                placeholder="e.g., 2024-2025"
              />

              <Input
                label="Description"
                type="textarea"
                value={courseForm.description}
                onChange={(e) => setCourseForm({...courseForm, description: e.target.value})}
                placeholder="Course description..."
                rows={3}
              />

              <Input
                label="Prerequisites"
                type="text"
                value={courseForm.prerequisites}
                onChange={(e) => setCourseForm({...courseForm, prerequisites: e.target.value})}
                placeholder="e.g., CS101, MATH201"
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
