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
import { Input } from '../../../../components/ui/input';
import {
  FiArrowLeft,
  FiUsers,
  FiUserPlus,
  FiUser,
  FiMail,
  FiSearch,
  FiCheck,
  FiX,
  FiStar,
  FiLayers,
  FiRefreshCw
} from 'react-icons/fi';

const AssignTeachersPage = () => {
  const router = useRouter();
  const { id: departmentId } = router.query;
  const { user, isAuthenticated } = useAuth();

  // State management
  const [department, setDepartment] = useState(null);
  const [allTeachers, setAllTeachers] = useState([]);
  const [assignedTeachers, setAssignedTeachers] = useState([]);
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeachers, setSelectedTeachers] = useState(new Set());
  const [primaryTeacherId, setPrimaryTeacherId] = useState(null);

  // Fetch data
  const fetchData = async () => {
    if (!departmentId) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch department details
      const departmentData = await adminAPI.getDepartmentById(parseInt(departmentId));
      setDepartment(departmentData);

      // Fetch all teachers
      const allTeachersResponse = await adminAPI.getAllUsers(1, 100, { role: 'teacher' });
      const teachers = allTeachersResponse.users || allTeachersResponse || [];
      setAllTeachers(teachers);

      // Fetch currently assigned teachers for this department
      const assignedTeachersData = await fetchDepartmentTeachers(parseInt(departmentId));
      setAssignedTeachers(assignedTeachersData || []);

      // Calculate available teachers (not yet assigned to this department)
      const assignedIds = new Set((assignedTeachersData || []).map(t => t.id));
      const available = teachers.filter(teacher => !assignedIds.has(teacher.id));
      setAvailableTeachers(available);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch teachers for this specific department
  const fetchDepartmentTeachers = async (deptId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/departments/${deptId}/teachers`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.warn('Department teachers endpoint not found, using alternative approach');
        return [];
      }
      
      return await response.json();
    } catch (error) {
      console.warn('Error fetching department teachers:', error);
      return [];
    }
  };

  // Handle teacher selection
  const handleTeacherSelect = (teacherId) => {
    const newSelected = new Set(selectedTeachers);
    if (newSelected.has(teacherId)) {
      newSelected.delete(teacherId);
      if (primaryTeacherId === teacherId) {
        setPrimaryTeacherId(null);
      }
    } else {
      newSelected.add(teacherId);
    }
    setSelectedTeachers(newSelected);
  };

  // Handle setting primary teacher
  const handleSetPrimary = (teacherId) => {
    if (selectedTeachers.has(teacherId)) {
      setPrimaryTeacherId(primaryTeacherId === teacherId ? null : teacherId);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (selectedTeachers.size === 0) {
      setError('Please select at least one teacher to assign');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const teacherIds = Array.from(selectedTeachers);
      
      console.log('🔍 Assigning teachers:', {
        teachers: teacherIds,
        departmentId: parseInt(departmentId),
        setPrimary: false
      });
      
      // Assign teachers to department
      const response = await fetch(`http://localhost:5000/api/hod/departments/add-teachers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          teachers: teacherIds,
          departmentId: parseInt(departmentId),
          setPrimary: false // We'll handle primary assignment separately if needed
        })
      });

      console.log('🔍 API Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('🔍 API Error response:', errorData);
        throw new Error(`Failed to assign teachers to department: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('🔍 API Success response:', result);

      // If there's a primary teacher selected, set them as primary
      if (primaryTeacherId) {
        await fetch(`http://localhost:5000/api/hod/departments/add-teachers`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            teachers: [primaryTeacherId],
            departmentId: parseInt(departmentId),
            setPrimary: true
          })
        });
      }

      // Redirect back to department view
      router.push(`/admin/departments/${departmentId}/view`);

    } catch (err) {
      console.error('🔍 Error assigning teachers:', err);
      setError(err.message || 'Failed to assign teachers');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter available teachers based on search
  const filteredTeachers = availableTeachers.filter(teacher =>
    `${teacher.first_name} ${teacher.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (teacher.staff_id && teacher.staff_id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  useEffect(() => {
    if (departmentId && isAuthenticated && user?.role === 'admin') {
      fetchData();
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
              onClick={() => router.push(`/admin/departments/${departmentId}/view`)}
            >
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <FiUserPlus className="mr-3 text-blue-600" />
                Assign Teachers to {department?.name}
              </h1>
              <p className="text-gray-600 mt-1">
                Select teachers to assign to this department
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/departments/${departmentId}/view`)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={FiUserPlus}
              onClick={handleSubmit}
              disabled={submitting || selectedTeachers.size === 0}
              loading={submitting}
            >
              {submitting ? 'Assigning...' : `Assign ${selectedTeachers.size} Teacher${selectedTeachers.size !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="error" className="mb-6">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
            >
              ×
            </Button>
          </div>
        </Alert>
      )}

      {/* Search and Filters */}
      <Card className="mb-6">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search teachers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {selectedTeachers.size > 0 && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>{selectedTeachers.size}</strong> teacher{selectedTeachers.size !== 1 ? 's' : ''} selected
                {primaryTeacherId && (
                  <span className="ml-2">
                    • <strong>Primary:</strong> {allTeachers.find(t => t.id === primaryTeacherId)?.first_name} {allTeachers.find(t => t.id === primaryTeacherId)?.last_name}
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Teachers List */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <FiUsers className="w-5 h-5 mr-2 text-blue-600" />
              Available Teachers ({filteredTeachers.length})
            </h2>
          </div>

          {filteredTeachers.length === 0 ? (
            <div className="text-center py-12">
              <FiUsers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No teachers found' : 'No available teachers'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm ? 'No teachers found matching your search criteria.' : 'All teachers are already assigned to this department.'}
              </p>
              {searchTerm && (
                <Button
                  variant="outline"
                  onClick={() => setSearchTerm('')}
                >
                  Clear Search
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Select
                          </th>
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
                            Current Departments
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Primary
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredTeachers.map((teacher) => {
                          const isSelected = selectedTeachers.has(teacher.id);
                          const isPrimary = primaryTeacherId === teacher.id;

                          return (
                            <tr key={teacher.id} className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <button
                                  onClick={() => handleTeacherSelect(teacher.id)}
                                  className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                    isSelected
                                      ? 'bg-blue-600 border-blue-600 text-white'
                                      : 'border-gray-300 hover:border-blue-400'
                                  }`}
                                >
                                  {isSelected && <FiCheck className="w-3 h-3" />}
                                </button>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                    <FiUser className="w-5 h-5 text-blue-600" />
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {teacher.first_name} {teacher.last_name}
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
                                <Badge variant={teacher.status === 'active' ? 'success' : 'secondary'}>
                                  {teacher.status || 'Active'}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <div className="flex items-center">
                                  <span>{teacher.totalDepartments || 0}</span>
                                  {teacher.totalDepartments > 0 && (
                                    <FiLayers className="w-4 h-4 ml-1 text-purple-600" />
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <button
                                  onClick={() => handleSetPrimary(teacher.id)}
                                  disabled={!isSelected}
                                  className={`p-2 rounded-full ${
                                    isPrimary
                                      ? 'bg-yellow-100 text-yellow-600'
                                      : isSelected
                                      ? 'bg-gray-100 text-gray-600 hover:bg-yellow-100 hover:text-yellow-600'
                                      : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                  }`}
                                  title={isPrimary ? 'Primary department' : isSelected ? 'Set as primary' : 'Select teacher first'}
                                >
                                  <FiStar className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
            )}
          </div>
        </Card>
    </Layout>
  );
};

export default AssignTeachersPage;
