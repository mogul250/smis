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
  FiLock,
  FiUserCheck,
  FiHome
} from 'react-icons/fi';

const CreateUser = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
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

  // Fetch departments
  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchDepartments();
    }
  }, [isAuthenticated, user]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const departmentsData = await adminAPI.getAllDepartments();
      setDepartments(departmentsData);
    } catch (err) {
      console.error('Error fetching departments:', err);
      setError('Failed to load departments. Please try again.');
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

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.role) {
      errors.role = 'Role is required';
    }

    // Validate department for students
    if (formData.role === 'student' && !formData.departmentId) {
      errors.departmentId = 'Please select a department for students';
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
        password: formData.password,
        role: formData.role,
        departmentId: formData.departmentId ? parseInt(formData.departmentId, 10) : null,
        status: formData.status
      };

      // Additional validation for department ID
      if (userData.departmentId && (isNaN(userData.departmentId) || userData.departmentId <= 0)) {
        setError('Invalid department selection. Please select a valid department.');
        return;
      }

      await adminAPI.createUser(userData);
      
      setMessage({ 
        type: 'success', 
        text: 'User created successfully!' 
      });

      // Redirect to users page after a short delay
      setTimeout(() => {
        router.push('/admin/users');
      }, 2000);

    } catch (err) {
      console.error('Error creating user:', err);
      setError(err.message || 'Failed to create user. Please try again.');
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
                    <h1 className="text-2xl font-bold text-gray-900">Create New User</h1>
                    <p className="text-gray-600 mt-1">
                      Add a new user to the system
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
                  <FiUserCheck className="w-5 h-5 mr-2" />
                  <span className="font-medium">{message.text}</span>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 rounded-lg border-l-4 bg-red-50 border-red-400 text-red-800">
                <div className="flex items-center">
                  <FiUser className="w-5 h-5 mr-2" />
                  <span className="font-medium">{error}</span>
                </div>
              </div>
            )}

            {/* Create User Form */}
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Password"
                          name="password"
                          type="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          error={validationErrors.password}
                          required
                          icon={FiLock}
                        />
                        <Input
                          label="Confirm Password"
                          name="confirmPassword"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          error={validationErrors.confirmPassword}
                          required
                          icon={FiLock}
                        />
                      </div>
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
                          { value: '', label: formData.role === 'student' ? 'Select Department (Required)' : 'Select Department (Optional)' },
                          ...departments.map(dept => ({
                            value: dept.id.toString(),
                            label: dept.name
                          }))
                        ]}
                        error={validationErrors.departmentId}
                        required={formData.role === 'student'}
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
                      {submitting ? 'Creating User...' : 'Create User'}
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

export default CreateUser;
