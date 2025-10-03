import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../hooks/useAuth';
import { adminAPI } from '../../../services/api';
import Header from '../../../components/common/Header';
import Sidebar from '../../../components/common/Sidebar';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import {
  FiBuilding,
  FiArrowLeft,
  FiSave,
  FiUser,
  FiInfo
} from 'react-icons/fi';

const CreateDepartment = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    hodId: '',
    status: 'active'
  });

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Check authentication and authorization
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
  }, [isAuthenticated, user, router]);

  // Fetch users for HOD selection
  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchUsers();
    }
  }, [isAuthenticated, user]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersData = await adminAPI.getAllUsers(1, 1000);
      // Filter for potential HODs (teachers and existing HODs)
      const potentialHODs = usersData.users?.filter(u => 
        u.role === 'teacher' || u.role === 'hod'
      ) || [];
      setUsers(potentialHODs);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Department name is required';
    }

    if (!formData.code.trim()) {
      errors.code = 'Department code is required';
    } else if (formData.code.length < 2 || formData.code.length > 10) {
      errors.code = 'Department code must be between 2 and 10 characters';
    }

    if (!formData.status) {
      errors.status = 'Status is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const departmentData = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim() || null,
        hodId: formData.hodId || null,
        status: formData.status
      };

      await adminAPI.createDepartment(departmentData);
      
      setMessage({ 
        type: 'success', 
        text: 'Department created successfully!' 
      });

      // Redirect to departments page after a short delay
      setTimeout(() => {
        router.push('/admin/departments');
      }, 2000);

    } catch (err) {
      console.error('Error creating department:', err);
      setError(err.message || 'Failed to create department. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ];

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-2xl mx-auto">
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
                    <h1 className="text-2xl font-bold text-gray-900">Create New Department</h1>
                    <p className="text-gray-600 mt-1">
                      Add a new department to the system
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            {message && (
              <div className={`mb-6 p-4 rounded-lg border-l-4 ${
                message.type === 'success' 
                  ? 'bg-green-50 border-green-400 text-green-800' 
                  : 'bg-red-50 border-red-400 text-red-800'
              }`}>
                <div className="flex items-center">
                  <FiBuilding className="w-5 h-5 mr-2" />
                  <span className="font-medium">{message.text}</span>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 rounded-lg border-l-4 bg-red-50 border-red-400 text-red-800">
                <div className="flex items-center">
                  <FiInfo className="w-5 h-5 mr-2" />
                  <span className="font-medium">{error}</span>
                </div>
              </div>
            )}

            {/* Create Department Form */}
            <Card>
              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                    <div className="space-y-4">
                      <Input
                        label="Department Name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        error={validationErrors.name}
                        required
                        icon={FiBuilding}
                        placeholder="e.g., Computer Science"
                      />
                      <Input
                        label="Department Code"
                        name="code"
                        value={formData.code}
                        onChange={handleInputChange}
                        error={validationErrors.code}
                        required
                        icon={FiBuilding}
                        placeholder="e.g., CS"
                        maxLength={10}
                      />
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Brief description of the department (optional)"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Management */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Management</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Select
                        label="Head of Department"
                        name="hodId"
                        value={formData.hodId}
                        onChange={handleInputChange}
                        options={[
                          { value: '', label: 'Select HOD (Optional)' },
                          ...users.map(user => ({
                            value: user.id.toString(),
                            label: `${user.first_name} ${user.last_name} (${user.role})`
                          }))
                        ]}
                      />
                      <Select
                        label="Status"
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        options={statusOptions}
                        error={validationErrors.status}
                        required
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push('/admin/departments')}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      icon={FiSave}
                      disabled={submitting}
                      loading={submitting}
                    >
                      {submitting ? 'Creating Department...' : 'Create Department'}
                    </Button>
                  </div>
                </form>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CreateDepartment;
