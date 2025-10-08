import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { adminAPI } from '../../services/api';
import Layout from '../../components/common/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  FiDatabase,
  FiPlus,
  FiRefreshCw,
  FiEdit,
  FiTrash2,
  FiUsers,
  FiSearch
} from 'react-icons/fi';

const DepartmentsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  
  // State management
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminAPI.getAllDepartments(1, 50);
      console.log('Departments response:', response);
      
      if (response && response.departments) {
        setDepartments(response.departments);
      } else if (Array.isArray(response)) {
        setDepartments(response);
      } else {
        setDepartments([]);
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
      setError(err.message || 'Failed to fetch departments');
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchDepartments();
    }
  }, [isAuthenticated, user]);

  // Handle delete department
  const handleDeleteDepartment = async (departmentId, departmentName) => {
    if (!confirm(`Are you sure you want to delete ${departmentName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await adminAPI.deleteDepartment(departmentId);
      // Refresh the departments list
      fetchDepartments();
      alert('Department deleted successfully!');
    } catch (err) {
      console.error('Error deleting department:', err);
      alert('Failed to delete department. Please try again.');
    }
  };

  // Handle action buttons
  const handleAction = (action, department) => {
    switch (action) {
      case 'view':
        router.push(`/admin/departments/${department.id}/view`);
        break;
      case 'edit':
        router.push(`/admin/departments/edit?departmentId=${department.id}`);
        break;
      case 'delete':
        handleDeleteDepartment(department.id, department.name);
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  // Auth check
  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
          <p className="text-gray-600 mt-2">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading departments...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout maxWidth="max-w-7xl mx-auto" enableAnimation={true}>
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Department Management</h1>
                <p className="text-gray-600">Manage academic departments and their information</p>
              </div>
              <button
                onClick={() => router.push('/admin/departments/new')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Add Department
              </button>
            </div>
          </div>
        {/* Error State */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
            <button
              onClick={fetchDepartments}
              className="mt-2 text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <div className="w-6 h-6 bg-blue-600 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Departments</p>
                <p className="text-2xl font-bold text-gray-900">{departments.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <div className="w-6 h-6 bg-green-600 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Departments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {departments.filter(d => d.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <div className="w-6 h-6 bg-purple-600 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">With HOD</p>
                <p className="text-2xl font-bold text-gray-900">
                  {departments.filter(d => d.hod?.name).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Departments Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Departments ({departments.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            {departments.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 bg-gray-400 rounded"></div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No departments found</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new department.</p>
                <div className="mt-6">
                  <button
                    onClick={() => router.push('/admin/departments/new')}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Add Department
                  </button>
                </div>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Head of Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {departments.map((department) => (
                    <tr key={department.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                              <div className="h-5 w-5 bg-blue-600 rounded"></div>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {department.name || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {department.code || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {department.hod?.name || 'Not assigned'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          department.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {department.status || 'active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleAction('view', department)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                            title="View Department"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleAction('edit', department)}
                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                            title="Edit Department"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleAction('delete', department)}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
                            title="Delete Department"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>


    </Layout>
  );
};

export default DepartmentsPage;
