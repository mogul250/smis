import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../hooks/useAuth';
import { adminAPI } from '../../../services/api';
import Header from '../../../components/common/Header';
import Sidebar from '../../../components/common/Sidebar';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import {
  FiBuilding,
  FiEdit2,
  FiTrash2,
  FiArrowLeft,
  FiUsers,
  FiUser,
  FiCalendar,
  FiInfo
} from 'react-icons/fi';

const DepartmentActions = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const { departmentId, action } = router.query;

  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // Check authentication and authorization
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
  }, [isAuthenticated, user, router]);

  // Fetch department data
  useEffect(() => {
    if (departmentId && isAuthenticated && user?.role === 'admin') {
      fetchDepartment();
    }
  }, [departmentId, isAuthenticated, user]);

  const fetchDepartment = async () => {
    try {
      setLoading(true);
      setError(null);
      const departmentData = await adminAPI.getDepartmentById(parseInt(departmentId));
      setSelectedDepartment(departmentData);
    } catch (err) {
      console.error('Error fetching department:', err);
      setError('Failed to load department data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDepartment = async () => {
    if (window.confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
      try {
        setProcessing(true);
        await adminAPI.deleteDepartment(parseInt(departmentId));
        setMessage({ 
          type: 'success', 
          text: 'Department deleted successfully' 
        });
        setTimeout(() => {
          router.push('/admin/departments');
        }, 2000);
      } catch (err) {
        setMessage({ 
          type: 'error', 
          text: `Failed to delete department: ${err.message}` 
        });
        setTimeout(() => setMessage(null), 3000);
      } finally {
        setProcessing(false);
      }
    }
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6 flex justify-center items-center">
            <LoadingSpinner size="lg" />
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6">
            <div className="max-w-4xl mx-auto">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-center">
                  <div className="text-red-500 mr-3">
                    <FiBuilding className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-red-800">Error Loading Department</h3>
                    <p className="text-red-600 mt-1">{error}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/admin/departments')}
                    icon={FiArrowLeft}
                  >
                    Back to Departments
                  </Button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/admin/departments')}
                    icon={FiArrowLeft}
                    className="mr-4"
                  >
                    Back
                  </Button>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Department Actions</h1>
                    <p className="text-gray-600 mt-1">
                      Manage department information and settings
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Message */}
            {message && (
              <div className={`mb-6 p-4 rounded-lg border-l-4 ${
                message.type === 'success' 
                  ? 'bg-green-50 border-green-400 text-green-800' 
                  : 'bg-red-50 border-red-400 text-red-800'
              }`}>
                <div className="flex items-center">
                  {message.type === 'success' ? (
                    <FiBuilding className="w-5 h-5 mr-2" />
                  ) : (
                    <FiInfo className="w-5 h-5 mr-2" />
                  )}
                  <span className="font-medium">{message.text}</span>
                </div>
              </div>
            )}

            {selectedDepartment && (
              <>
                {/* Department Details Card */}
                <Card className="mb-6">
                  <div className="p-6">
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <FiBuilding className="w-8 h-8 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-900">
                          {selectedDepartment.name}
                        </h2>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-gray-600">
                            Code: {selectedDepartment.code}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            selectedDepartment.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {selectedDepartment.status?.toUpperCase() || 'ACTIVE'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Department Information</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-500">Department ID</label>
                            <p className="text-gray-900">{selectedDepartment.id}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Department Name</label>
                            <p className="text-gray-900">{selectedDepartment.name}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Department Code</label>
                            <p className="text-gray-900">{selectedDepartment.code}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Description</label>
                            <p className="text-gray-900">{selectedDepartment.description || 'No description available'}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Statistics</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-500">Head of Department</label>
                            <p className="text-gray-900">{selectedDepartment.hod_name || 'Not assigned'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Total Staff</label>
                            <p className="text-gray-900">{selectedDepartment.staff_count || 0}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Total Students</label>
                            <p className="text-gray-900">{selectedDepartment.student_count || 0}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Created</label>
                            <p className="text-gray-900">
                              {selectedDepartment.created_at ? new Date(selectedDepartment.created_at).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Actions Card */}
                <Card>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Edit Department */}
                      <Button
                        variant="outline"
                        className="justify-start h-auto p-4"
                        onClick={() => router.push(`/admin/departments/edit?departmentId=${departmentId}`)}
                        disabled={processing}
                      >
                        <div className="flex items-center">
                          <FiEdit2 className="w-5 h-5 mr-3 text-blue-600" />
                          <div className="text-left">
                            <div className="font-medium">Edit Department</div>
                            <div className="text-sm text-gray-500">Update department information</div>
                          </div>
                        </div>
                      </Button>

                      {/* View Staff */}
                      <Button
                        variant="outline"
                        className="justify-start h-auto p-4"
                        onClick={() => router.push(`/admin/departments/${departmentId}/staff`)}
                        disabled={processing}
                      >
                        <div className="flex items-center">
                          <FiUsers className="w-5 h-5 mr-3 text-green-600" />
                          <div className="text-left">
                            <div className="font-medium">View Staff</div>
                            <div className="text-sm text-gray-500">Manage department staff</div>
                          </div>
                        </div>
                      </Button>

                      {/* View Students */}
                      <Button
                        variant="outline"
                        className="justify-start h-auto p-4"
                        onClick={() => router.push(`/admin/departments/${departmentId}/students`)}
                        disabled={processing}
                      >
                        <div className="flex items-center">
                          <FiUser className="w-5 h-5 mr-3 text-purple-600" />
                          <div className="text-left">
                            <div className="font-medium">View Students</div>
                            <div className="text-sm text-gray-500">Manage department students</div>
                          </div>
                        </div>
                      </Button>

                      {/* Delete Department */}
                      <Button
                        variant="outline"
                        className="justify-start h-auto p-4 border-red-300 text-red-600 hover:bg-red-50"
                        onClick={handleDeleteDepartment}
                        disabled={processing}
                      >
                        <div className="flex items-center">
                          <FiTrash2 className="w-5 h-5 mr-3 text-red-600" />
                          <div className="text-left">
                            <div className="font-medium">Delete Department</div>
                            <div className="text-sm text-red-500">Permanently remove department</div>
                          </div>
                        </div>
                      </Button>
                    </div>
                  </div>
                </Card>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DepartmentActions;
