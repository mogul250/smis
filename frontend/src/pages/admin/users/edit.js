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
  FiUser,
  FiArrowLeft,
  FiSave,
  FiMail,
  FiBuilding,
  FiInfo
} from 'react-icons/fi';

const EditUser = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const { userId } = router.query;

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'student',
    departmentId: '',
    status: 'active'
  });

  const [departments, setDepartments] = useState([]);
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

  // Fetch user and departments data
  useEffect(() => {
    if (userId && isAuthenticated && user?.role === 'admin') {
      fetchData();
    }
  }, [userId, isAuthenticated, user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user data and departments in parallel
      const [userData, departmentsData] = await Promise.all([
        adminAPI.getUserById(parseInt(userId)),
        adminAPI.getAllDepartments()
      ]);

      // Set form data from user
      setFormData({
        firstName: userData.first_name || '',
        lastName: userData.last_name || '',
        email: userData.email || '',
        role: userData.role || 'student',
        departmentId: userData.department_id?.toString() || '',
        status: userData.status || 'active'
      });

      setDepartments(departmentsData);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load user data. Please try again.');
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

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }

    if (!formData.role) {
      errors.role = 'Role is required';
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

      const userData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
        departmentId: formData.departmentId || null,
        status: formData.status
      };

      await adminAPI.updateUser(parseInt(userId), userData);
      
      setMessage({ 
        type: 'success', 
        text: 'User updated successfully!' 
      });

      // Redirect to users page after a short delay
      setTimeout(() => {
        router.push('/admin/users');
      }, 2000);

    } catch (err) {
      console.error('Error updating user:', err);
      setError(err.message || 'Failed to update user. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const roleOptions = [
    { value: 'student', label: 'Student' },
    { value: 'teacher', label: 'Teacher' },
    { value: 'hod', label: 'Head of Department' },
    { value: 'finance', label: 'Finance Officer' },
    { value: 'admin', label: 'Administrator' }
  ];

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'pending', label: 'Pending' }
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

  if (error && !formData.firstName) {
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
                    <FiUser className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-red-800">Error Loading User</h3>
                    <p className="text-red-600 mt-1">{error}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/admin/users')}
                    icon={FiArrowLeft}
                  >
                    Back to Users
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
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/admin/users')}
                    icon={FiArrowLeft}
                    className="mr-4"
                  >
                    Back
                  </Button>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
                    <p className="text-gray-600 mt-1">
                      Update user information
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
                  <FiUser className="w-5 h-5 mr-2" />
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

            {/* Edit User Form */}
            <Card>
              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Personal Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="First Name"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        error={validationErrors.firstName}
                        required
                        icon={FiUser}
                      />
                      <Input
                        label="Last Name"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        error={validationErrors.lastName}
                        required
                        icon={FiUser}
                      />
                    </div>
                  </div>

                  {/* Account Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                    <div className="space-y-4">
                      <Input
                        label="Email Address"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        error={validationErrors.email}
                        required
                        icon={FiMail}
                      />
                    </div>
                  </div>

                  {/* Role and Department */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Role and Department</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Select
                        label="Role"
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        options={roleOptions}
                        error={validationErrors.role}
                        required
                      />
                      <Select
                        label="Department"
                        name="departmentId"
                        value={formData.departmentId}
                        onChange={handleInputChange}
                        options={[
                          { value: '', label: 'Select Department (Optional)' },
                          ...departments.map(dept => ({
                            value: dept.id.toString(),
                            label: dept.name
                          }))
                        ]}
                      />
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h3>
                    <Select
                      label="Status"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      options={statusOptions}
                      required
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push('/admin/users')}
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
                      {submitting ? 'Updating User...' : 'Update User'}
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

export default EditUser;
