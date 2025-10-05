import React, { useState } from 'react';
import Head from 'next/head';
import { useAuth } from '../../hooks/useAuth';
import { useApi, useAsyncOperation } from '../../hooks/useApi';
import { hodAPI } from '../../services/api';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Input from '../../components/common/Input';
import { 
  FiBook, 
  FiSearch, 
  FiPlus, 
  FiEdit, 
  FiTrash2, 
  FiUsers,
  FiClock,
  FiRefreshCw,
  FiX,
  FiSave
} from 'react-icons/fi';

const CoursesPage = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Form state for add/edit course
  const [courseForm, setCourseForm] = useState({
    name: '',
    course_code: '',
    credits: '',
    description: '',
    semester: '',
    year: ''
  });

  // Fetch courses data
  const { data: courses, loading, error, refetch } = useApi(() =>
    hodAPI.getDepartmentCourses()
  );

  // Course management operations
  const { execute: manageCourse, loading: managing } = useAsyncOperation(hodAPI.manageCourses);

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
      console.error('Error refreshing courses:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCourseForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle add course
  const handleAddCourse = async (e) => {
    e.preventDefault();
    try {
      await manageCourse({
        action: 'add',
        courseData: courseForm
      });
      setShowAddModal(false);
      setCourseForm({
        name: '',
        course_code: '',
        credits: '',
        description: '',
        semester: '',
        year: ''
      });
      await refetch();
    } catch (error) {
      console.error('Error adding course:', error);
    }
  };

  // Handle edit course
  const handleEditCourse = async (e) => {
    e.preventDefault();
    try {
      await manageCourse({
        action: 'edit',
        courseData: { ...courseForm, id: editingCourse.id }
      });
      setEditingCourse(null);
      setCourseForm({
        name: '',
        course_code: '',
        credits: '',
        description: '',
        semester: '',
        year: ''
      });
      await refetch();
    } catch (error) {
      console.error('Error editing course:', error);
    }
  };

  // Handle delete course
  const handleDeleteCourse = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await manageCourse({
          action: 'delete',
          courseData: { id: courseId }
        });
        await refetch();
      } catch (error) {
        console.error('Error deleting course:', error);
      }
    }
  };

  // Start editing a course
  const startEditing = (course) => {
    setEditingCourse(course);
    setCourseForm({
      name: course.name,
      course_code: course.course_code,
      credits: course.credits.toString(),
      description: course.description || '',
      semester: course.semester || '',
      year: course.year?.toString() || ''
    });
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingCourse(null);
    setCourseForm({
      name: '',
      course_code: '',
      credits: '',
      description: '',
      semester: '',
      year: ''
    });
  };

  // Filter courses based on search
  const filteredCourses = courses?.filter(course => {
    const matchesSearch = !searchTerm || 
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.course_code.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  }) || [];

  return (
    <>
      <Head>
        <title>Course Management - HOD Dashboard</title>
        <meta name="description" content="Manage department courses and curriculum" />
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
                  <h1 className="text-3xl font-bold text-gray-900">Course Management</h1>
                  <p className="text-gray-600 mt-1">
                    Manage your department's courses and curriculum
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRefresh}
                    loading={refreshing}
                    icon={FiRefreshCw}
                  >
                    Refresh
                  </Button>
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={() => setShowAddModal(true)}
                    icon={FiPlus}
                  >
                    Add Course
                  </Button>
                </div>
              </div>

              {/* Error handling */}
              {error && (
                <Alert variant="error" className="mb-6">
                  Error loading courses: {error.message}
                </Alert>
              )}

              {/* Search */}
              <Card className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search courses by name or code..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      icon={FiSearch}
                    />
                  </div>
                </div>
              </Card>

              {/* Course Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-blue-50">
                      <FiBook className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Courses</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {loading ? '...' : courses?.length || 0}
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-green-50">
                      <FiUsers className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Active Courses</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {loading ? '...' : courses?.filter(c => c.status === 'active').length || 0}
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-purple-50">
                      <FiClock className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Credits</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {loading ? '...' : courses?.reduce((sum, c) => sum + (c.credits || 0), 0) || 0}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Courses Table */}
              <Card className="overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Department Courses</h3>
                    <span className="text-sm text-gray-500">
                      {filteredCourses.length} of {courses?.length || 0} courses
                    </span>
                  </div>
                </div>

                {loading ? (
                  <div className="flex justify-center py-12">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : filteredCourses.length > 0 ? (
                  <Table>
                    <Table.Header>
                      <Table.Row>
                        <Table.Head>Course</Table.Head>
                        <Table.Head>Code</Table.Head>
                        <Table.Head>Credits</Table.Head>
                        <Table.Head>Semester</Table.Head>
                        <Table.Head>Status</Table.Head>
                        <Table.Head>Actions</Table.Head>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {filteredCourses.map((course) => (
                        <Table.Row key={course.id}>
                          <Table.Cell>
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <FiBook className="w-5 h-5 text-blue-600" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {course.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {course.description}
                                </div>
                              </div>
                            </div>
                          </Table.Cell>
                          <Table.Cell>
                            <span className="text-sm font-mono text-gray-900">
                              {course.course_code}
                            </span>
                          </Table.Cell>
                          <Table.Cell>
                            <span className="text-sm text-gray-900">
                              {course.credits}
                            </span>
                          </Table.Cell>
                          <Table.Cell>
                            <span className="text-sm text-gray-900">
                              {course.semester || 'N/A'}
                            </span>
                          </Table.Cell>
                          <Table.Cell>
                            <Badge variant={course.status === 'active' ? 'success' : 'default'} size="sm">
                              {course.status || 'Active'}
                            </Badge>
                          </Table.Cell>
                          <Table.Cell>
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                icon={FiEdit}
                                onClick={() => startEditing(course)}
                              >
                                Edit
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                icon={FiTrash2}
                                onClick={() => handleDeleteCourse(course.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                Delete
                              </Button>
                            </div>
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <FiBook className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
                    <p className="text-gray-500 mb-4">
                      {searchTerm 
                        ? 'Try adjusting your search criteria.'
                        : 'No courses are available in your department yet.'
                      }
                    </p>
                    <Button 
                      variant="primary" 
                      onClick={() => setShowAddModal(true)}
                      icon={FiPlus}
                    >
                      Add First Course
                    </Button>
                  </div>
                )}
              </Card>

              {/* Add/Edit Course Modal */}
              {(showAddModal || editingCourse) && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {editingCourse ? 'Edit Course' : 'Add New Course'}
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowAddModal(false);
                            cancelEditing();
                          }}
                          icon={FiX}
                        />
                      </div>
                    </div>

                    <form onSubmit={editingCourse ? handleEditCourse : handleAddCourse} className="p-6 space-y-4">
                      <Input
                        label="Course Name"
                        name="name"
                        value={courseForm.name}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter course name"
                      />

                      <Input
                        label="Course Code"
                        name="course_code"
                        value={courseForm.course_code}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g., CS101"
                      />

                      <Input
                        label="Credits"
                        name="credits"
                        type="number"
                        value={courseForm.credits}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter credit hours"
                        min="1"
                        max="10"
                      />

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          name="description"
                          value={courseForm.description}
                          onChange={handleInputChange}
                          rows={3}
                          className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary-light focus:border-primary-light sm:text-sm px-3 py-2"
                          placeholder="Enter course description"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Semester"
                          name="semester"
                          value={courseForm.semester}
                          onChange={handleInputChange}
                          placeholder="e.g., Fall"
                        />

                        <Input
                          label="Year"
                          name="year"
                          type="number"
                          value={courseForm.year}
                          onChange={handleInputChange}
                          placeholder="e.g., 2024"
                          min="2020"
                          max="2030"
                        />
                      </div>

                      <div className="flex justify-end space-x-3 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowAddModal(false);
                            cancelEditing();
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          variant="primary"
                          loading={managing}
                          icon={FiSave}
                        >
                          {editingCourse ? 'Update Course' : 'Add Course'}
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default CoursesPage;
