import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../../hooks/useAuth';
import { adminAPI } from '../../../../services/api';
import Layout from '../../../../components/common/Layout';
import LoadingSpinner from '../../../../components/common/LoadingSpinner';
import Card from '../../../../components/common/Card';
import Button from '../../../../components/common/Button';
import Badge from '../../../../components/common/Badge';
import Alert from '../../../../components/common/Alert';
import {
  FiArrowLeft,
  FiEdit,
  FiUsers,
  FiUserPlus,
  FiUser,
  FiCalendar,
  FiMail,
  FiPhone,
  FiMapPin,
  FiRefreshCw,
  FiSettings,
  FiUserMinus,
  FiLayers,
  FiTarget,
  FiStar,
  FiBook,
  FiBookOpen,
  FiPlus,
  FiMinus,
  FiInfo
} from 'react-icons/fi';

const DepartmentDetailView = () => {
  const router = useRouter();
  const { id: departmentId } = router.query;
  const { user, isAuthenticated } = useAuth();

  // State management
  const [department, setDepartment] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [hod, setHod] = useState(null);
  const [availableHODs, setAvailableHODs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  // Fetch department data
  const fetchDepartmentData = async () => {
    if (!departmentId) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch department details
      const departmentData = await adminAPI.getDepartmentById(parseInt(departmentId));
      setDepartment(departmentData);

      // Fetch teachers assigned to this department using the many-to-many relationship
      const teachersData = await fetchDepartmentTeachers(parseInt(departmentId));
      setTeachers(teachersData || []);

      // Fetch students in this department
      const studentsData = await adminAPI.getDepartmentStudents(parseInt(departmentId));
      setStudents(studentsData?.students || []);

      // Fetch courses assigned to this department
      const coursesData = await fetchDepartmentCourses(parseInt(departmentId));
      setCourses(coursesData || []);

      // Fetch current HOD for this department (now includes availableHODs)
      const hodData = await fetchDepartmentHOD(parseInt(departmentId));
      setHod(hodData?.hod || null);
      setAvailableHODs(hodData?.availableHODs || []);

    } catch (err) {
      console.error('Error fetching department data:', err);
      setError(err.message || 'Failed to load department data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch teachers for this specific department
  const fetchDepartmentTeachers = async (deptId) => {
    try {
      // We need to call the backend directly to get teachers for a specific department
      // Since the HOD API only gets teachers for the HOD's own department
      const response = await fetch(`http://localhost:3001/api/admin/departments/${deptId}/teachers`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // If the endpoint doesn't exist, we'll create a workaround
        console.warn('Department teachers endpoint not found, using alternative approach');
        return [];
      }

      return await response.json();
    } catch (error) {
      console.warn('Error fetching department teachers:', error);
      return [];
    }
  };

  // Fetch courses for this specific department
  const fetchDepartmentCourses = async (deptId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/admin/departments/${deptId}/courses`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.warn('Department courses endpoint not found');
        return [];
      }

      return await response.json();
    } catch (error) {
      console.warn('Error fetching department courses:', error);
      return [];
    }
  };

  // Fetch HOD for this specific department
  const fetchDepartmentHOD = async (deptId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/admin/departments/${deptId}/hod`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.warn('Department HOD endpoint not found');
        return null;
      }

      return await response.json();
    } catch (error) {
      console.warn('Error fetching department HOD:', error);
      return null;
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDepartmentData();
    setRefreshing(false);
  };

  // Handle HOD assignment (supports both teachers and existing HODs)
  const handleAssignHOD = async (teacherId, teacherName, isExistingHOD = false) => {
    const hodType = isExistingHOD ? 'existing HOD' : 'teacher';
    if (!confirm(`Are you sure you want to assign "${teacherName}" (${hodType}) as Head of Department?`)) {
      return;
    }

    try {
      setActionLoading(true);
      setActionMessage(null);

      const response = await fetch(`http://localhost:3001/api/admin/departments/${departmentId}/hod`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ teacherId, isExistingHOD })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to assign HOD');
      }

      const result = await response.json();
      setHod(result.hod);
      setActionMessage({
        type: 'success',
        message: `"${teacherName}" has been assigned as Head of Department`
      });

      // Refresh department data to update HOD info
      await fetchDepartmentData();
    } catch (error) {
      console.error('Error assigning HOD:', error);
      setActionMessage({
        type: 'error',
        message: error.message || 'Failed to assign HOD'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle HOD removal
  const handleRemoveHOD = async () => {
    if (!hod || !confirm(`Are you sure you want to remove "${hod.first_name} ${hod.last_name}" as Head of Department?`)) {
      return;
    }

    try {
      setActionLoading(true);
      setActionMessage(null);

      const response = await fetch(`http://localhost:3001/api/admin/departments/${departmentId}/hod`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove HOD');
      }

      setHod(null);
      setActionMessage({
        type: 'success',
        message: 'Head of Department has been removed'
      });

      // Refresh department data to update HOD info
      await fetchDepartmentData();
    } catch (error) {
      console.error('Error removing HOD:', error);
      setActionMessage({
        type: 'error',
        message: error.message || 'Failed to remove HOD'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle removing teacher from department
  const handleRemoveTeacher = async (teacherId, teacherName) => {
    if (!confirm(`Are you sure you want to remove ${teacherName} from this department?`)) {
      return;
    }

    try {
      setActionLoading(true);
      setActionMessage(null);

      const response = await fetch(`http://localhost:3001/api/hod/departments/remove-teachers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          teachers: [teacherId]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to remove teacher from department');
      }

      setActionMessage({
        type: 'success',
        message: `${teacherName} has been removed from the department`
      });

      // Refresh the teachers list
      await fetchDepartmentData();
    } catch (error) {
      console.error('Error removing teacher:', error);
      setActionMessage({
        type: 'error',
        message: error.message || 'Failed to remove teacher from department'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle removing course from department
  const handleRemoveCourse = async (courseId, courseName) => {
    if (!confirm(`Are you sure you want to remove "${courseName}" from this department?`)) {
      return;
    }

    try {
      setActionLoading(true);
      setActionMessage(null);

      const response = await fetch(`http://localhost:3001/api/admin/departments/remove-courses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          courses: [courseId],
          departmentId: parseInt(departmentId)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove course');
      }

      setActionMessage({
        type: 'success',
        message: `"${courseName}" has been removed from the department`
      });

      // Refresh the courses list
      await fetchDepartmentData();
    } catch (error) {
      console.error('Error removing course:', error);
      setActionMessage({
        type: 'error',
        message: error.message || 'Failed to remove course from department'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle reassigning student to different department
  const handleReassignStudent = async (studentId, studentName) => {
    // For now, we'll redirect to a dedicated page for student reassignment
    router.push(`/admin/students/${studentId}/reassign-department?from=${departmentId}&name=${encodeURIComponent(studentName)}`);
  };



  // Fetch data on component mount
  useEffect(() => {
    if (departmentId && isAuthenticated && user?.role === 'admin') {
      fetchDepartmentData();
    }
  }, [departmentId, isAuthenticated, user]);

  // Check authentication and authorization
  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <Alert variant="error">Access denied. Admin access required.</Alert>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout maxWidth="max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout maxWidth="max-w-7xl mx-auto">
        <Alert variant="error">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              Retry
            </Button>
          </div>
        </Alert>
      </Layout>
    );
  }

  return (
    <Layout maxWidth="max-w-7xl mx-auto" enableAnimation={true}>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              icon={FiArrowLeft}
              onClick={() => router.push('/admin/departments')}
            >
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <FiLayers className="mr-3 text-blue-600" />
                {department?.name || 'Department Details'}
              </h1>
              <p className="text-gray-600 mt-1">
                Manage department information, teachers, and students
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              icon={FiRefreshCw}
              onClick={handleRefresh}
              loading={refreshing}
              size="sm"
            >
              Refresh
            </Button>
            <Button
              variant="outline"
              icon={FiEdit}
              onClick={() => router.push(`/admin/departments/edit?id=${departmentId}`)}
              size="sm"
            >
              Edit
            </Button>
          </div>
        </div>
      </div>

      {/* Action Message */}
      {actionMessage && (
        <Alert variant={actionMessage.type} className="mb-6">
          <div className="flex justify-between items-center">
            <span>{actionMessage.message}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActionMessage(null)}
            >
              ×
            </Button>
          </div>
        </Alert>
      )}

      {/* Department Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FiUsers className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Teachers</p>
                <p className="text-2xl font-bold text-gray-900">{teachers.length}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <FiUser className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{students.length}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FiTarget className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Status</p>
                <p className="text-lg font-semibold text-gray-900">
                  <Badge variant={department?.status === 'active' ? 'success' : 'default'}>
                    {department?.status || 'Active'}
                  </Badge>
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Department Information Card */}
      <Card className="mb-8">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <FiSettings className="w-5 h-5 mr-2 text-blue-600" />
              Department Information
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Department Name
              </label>
              <p className="text-gray-900 font-medium">{department?.name || 'N/A'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Department Code
              </label>
              <p className="text-gray-900 font-medium">{department?.code || 'N/A'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Head of Department
              </label>
              <p className="text-gray-900 font-medium">
                {department?.hod?.name || 'Not Assigned'}
              </p>
            </div>

            {department?.description && (
              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Description
                </label>
                <p className="text-gray-900">{department.description}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Created Date
              </label>
              <p className="text-gray-900">
                {department?.created_at ? new Date(department.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* HOD Management Section */}
      <Card className="mb-8">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <FiUser className="w-5 h-5 mr-2 text-purple-600" />
              Head of Department Management
            </h2>
          </div>

          {hod ? (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                    <FiUser className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-medium text-gray-900">
                        {hod.first_name} {hod.last_name}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        hod.role === 'hod'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {hod.role === 'hod' ? 'HOD' : 'Teacher'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{hod.email}</p>
                    {hod.staff_id && (
                      <p className="text-sm text-gray-500">Staff ID: {hod.staff_id}</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  icon={FiMinus}
                  onClick={handleRemoveHOD}
                  disabled={actionLoading}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  Remove HOD
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="text-center">
                <FiUser className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Head of Department Assigned</h3>
                <p className="text-gray-600 mb-4">
                  Select a teacher from the department to assign as Head of Department.
                </p>
                {teachers.length > 0 ? (
                  <p className="text-sm text-gray-500">
                    Use the "Assign as HOD" button in the Teachers section below to assign a teacher.
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">
                    You need to assign teachers to this department first.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Available HODs Section */}
      {availableHODs.length > 0 && (
        <Card className="mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <FiUsers className="w-5 h-5 mr-2 text-indigo-600" />
                Available HODs from Other Departments ({availableHODs.length})
              </h2>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <FiInfo className="w-5 h-5 text-indigo-600 mt-0.5" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-indigo-800">
                    Assign Existing HOD
                  </h3>
                  <p className="text-sm text-indigo-700 mt-1">
                    You can assign an existing Head of Department from another department to also serve as HOD for this department.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {availableHODs.map((availableHOD) => (
                <div key={availableHOD.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
                        <FiUser className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-medium text-gray-900">
                            {availableHOD.first_name} {availableHOD.last_name}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            availableHOD.role === 'hod'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {availableHOD.role === 'hod' ? 'HOD' : 'Teacher'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{availableHOD.email}</p>
                        <p className="text-sm text-gray-500">
                          Current HOD of: {availableHOD.current_department_name} ({availableHOD.current_department_code})
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAssignHOD(availableHOD.id, `${availableHOD.first_name} ${availableHOD.last_name}`, true)}
                      disabled={actionLoading}
                      className="text-indigo-600 hover:text-indigo-700 border-indigo-300 hover:border-indigo-400"
                    >
                      <FiUser className="w-4 h-4 mr-1" />
                      Assign as HOD
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Teachers Section */}
      <Card className="mb-8">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <FiUsers className="w-5 h-5 mr-2 text-blue-600" />
              Department Teachers ({teachers.length})
            </h2>
            <Button
              variant="primary"
              icon={FiUserPlus}
              onClick={() => router.push(`/admin/departments/${departmentId}/assign-teachers`)}
            >
              Assign Teachers
            </Button>
          </div>

          {teachers.length === 0 ? (
            <div className="text-center py-12">
              <FiUsers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No teachers assigned</h3>
              <p className="text-gray-500 mb-6">This department doesn't have any teachers assigned yet.</p>
              <Button
                variant="primary"
                icon={FiUserPlus}
                onClick={() => router.push(`/admin/departments/${departmentId}/assign-teachers`)}
              >
                Assign First Teacher
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Teacher
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Department Role
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Departments
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {teachers.map((teacher) => (
                          <tr key={teacher.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                  <FiUser className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900 flex items-center">
                                    {teacher.name || `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim() || `Teacher ${teacher.id}`}
                                    {teacher.totalDepartments > 1 && (
                                      <div className="ml-2 flex items-center">
                                        <FiLayers className="w-4 h-4 text-purple-600" title="Assigned to multiple departments" />
                                        <span className="ml-1 text-xs text-purple-600 font-medium">
                                          {teacher.totalDepartments}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    ID: {teacher.staff_id || teacher.id}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center text-sm text-gray-900">
                                <FiMail className="w-4 h-4 mr-2 text-gray-400" />
                                {teacher.email}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant={teacher.status === 'active' ? 'success' : 'default'}>
                                {teacher.status || 'Active'}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {teacher.is_primary ? (
                                  <Badge variant="primary" className="flex items-center">
                                    <FiTarget className="w-3 h-3 mr-1" />
                                    Primary
                                  </Badge>
                                ) : (
                                  <Badge variant="default">Secondary</Badge>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex items-center">
                                <span>{teacher.totalDepartments || 1}</span>
                                {teacher.totalDepartments > 1 && (
                                  <FiLayers className="w-4 h-4 ml-1 text-purple-600" />
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                {hod?.id !== teacher.id ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleAssignHOD(teacher.id, `${teacher.first_name} ${teacher.last_name}`)}
                                    disabled={actionLoading}
                                    className="text-purple-600 hover:text-purple-700 border-purple-300 hover:border-purple-400"
                                  >
                                    <FiUser className="w-4 h-4 mr-1" />
                                    Assign as HOD
                                  </Button>
                                ) : (
                                  <Badge variant="primary" className="flex items-center">
                                    <FiUser className="w-3 h-3 mr-1" />
                                    Current HOD
                                  </Badge>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemoveTeacher(teacher.id, `${teacher.first_name} ${teacher.last_name}`)}
                                  disabled={actionLoading}
                                  className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                                >
                                  <FiUserMinus className="w-4 h-4 mr-1" />
                                  Remove
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
            )}
          </div>
        </Card>

        {/* Courses Section */}
        <Card className="mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <FiBook className="w-5 h-5 mr-2 text-purple-600" />
                Department Courses ({courses.length})
              </h2>
              <Button
                variant="primary"
                icon={FiPlus}
                onClick={() => router.push(`/admin/departments/${departmentId}/assign-courses`)}
              >
                Assign Courses
              </Button>
            </div>

            {courses.length === 0 ? (
              <div className="text-center py-12">
                <FiBook className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No courses assigned</h3>
                <p className="text-gray-500 mb-6">This department doesn't have any courses assigned yet.</p>
                <Button
                  variant="primary"
                  icon={FiPlus}
                  onClick={() => router.push(`/admin/departments/${departmentId}/assign-courses`)}
                >
                  Assign First Course
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Course
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Credits
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Semester
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assigned Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {courses.map((course) => (
                      <tr key={course.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                              <FiBook className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {course.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {course.course_code}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="default">
                            {course.credits} Credits
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {course.semester || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {course.assigned_date ? new Date(course.assigned_date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveCourse(course.id, course.name)}
                            disabled={actionLoading}
                            className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                          >
                            <FiMinus className="w-4 h-4 mr-1" />
                            Remove
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>

        {/* Students Section */}
        <Card className="mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <FiUser className="w-5 h-5 mr-2 text-green-600" />
                Department Students ({students.length})
              </h2>
              <Button
                variant="primary"
                icon={FiUserPlus}
                onClick={() => router.push(`/admin/departments/${departmentId}/assign-students`)}
              >
                Assign Students
              </Button>
            </div>

            {students.length === 0 ? (
              <div className="text-center py-12">
                <FiUser className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No students enrolled</h3>
                <p className="text-gray-500 mb-6">This department doesn't have any students enrolled yet.</p>
                <Button
                  variant="primary"
                  icon={FiUserPlus}
                  onClick={() => router.push(`/admin/departments/${departmentId}/assign-students`)}
                >
                  Assign First Student
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Student
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>

                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Enrollment Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {students.map((student) => (
                          <tr key={student.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                  <FiUser className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {student.name || `${student.first_name || ''} ${student.last_name || ''}`.trim() || `Student ${student.id}`}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    ID: {student.student_id || student.id}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center text-sm text-gray-900">
                                <FiMail className="w-4 h-4 mr-2 text-gray-400" />
                                {student.email}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant={student.status === 'active' ? 'success' : 'default'}>
                                {student.status || 'Active'}
                              </Badge>
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {student.enrollment_date ? new Date(student.enrollment_date).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReassignStudent(student.id, student.name || `${student.first_name || ''} ${student.last_name || ''}`.trim() || `Student ${student.id}`)}
                                disabled={actionLoading}
                                className="text-blue-600 hover:text-blue-700 border-blue-300 hover:border-blue-400"
                              >
                                <FiRefreshCw className="w-4 h-4 mr-1" />
                                Reassign
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                </div>
            )}
          </div>
        </Card>
    </Layout>
  );
};

export default DepartmentDetailView;
