import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../hooks/useAuth';
import { adminAPI } from '../../../services/api';
import Header from '../../../components/common/Header';
import Sidebar from '../../../components/common/Sidebar';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../../components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '../../../components/ui/alert';
import {
  FiBuilding,
  FiArrowLeft,
  FiSave,
  FiUser,
  FiInfo,
  FiAlertCircle,
  FiCheck,
  FiLoader
} from 'react-icons/fi';

const NewDepartment = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    head_id: '',
    status: 'active'
  });

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Fetch users for HOD selection
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await adminAPI.getAllUsers(1, 100, { role: 'teacher' });
        if (response && response.users) {
          setUsers(response.users);
        }
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load teachers for HOD selection');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && user?.role === 'admin') {
      fetchUsers();
    }
  }, [isAuthenticated, user]);

  // Auth check
  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Department name is required';
    } else if (formData.name.length < 2) {
      errors.name = 'Department name must be at least 2 characters';
    }

    if (!formData.code.trim()) {
      errors.code = 'Department code is required';
    } else if (formData.code.length < 2) {
      errors.code = 'Department code must be at least 2 characters';
    } else if (!/^[A-Z0-9]+$/.test(formData.code)) {
      errors.code = 'Department code must contain only uppercase letters and numbers';
    }

    if (formData.description && formData.description.length > 500) {
      errors.description = 'Description must be less than 500 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const submitData = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim() || null,
        head_id: formData.head_id ? parseInt(formData.head_id) : null,
        status: formData.status
      };

      await adminAPI.createDepartment(submitData);
      setSuccess(true);
      
      // Redirect after success
      setTimeout(() => {
        router.push('/admin/departments');
      }, 2000);

    } catch (err) {
      console.error('Error creating department:', err);
      setError(err.message || 'Failed to create department');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FiLoader className="animate-spin h-8 w-8 text-blue-600 mx-auto" />
          <p className="mt-2 text-gray-600">Loading...</p>
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
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="mr-4"
              >
                <FiArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create New Department</h1>
                <p className="text-gray-600">Add a new academic department to the system</p>
              </div>
            </div>
          </div>
        {/* Success Message */}
        {success && (
          <Alert variant="success" className="mb-6">
            <FiCheck className="h-4 w-4" />
            <AlertTitle>Department Created Successfully!</AlertTitle>
            <AlertDescription>
              Redirecting to departments list...
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <FiAlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FiBuilding className="w-5 h-5 text-blue-600 mr-2" />
              Department Information
            </CardTitle>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {/* Department Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Department Name *
                </label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  error={!!validationErrors.name}
                  placeholder="e.g., Computer Science"
                  disabled={submitting}
                />
                {validationErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
                )}
              </div>

              {/* Department Code */}
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                  Department Code *
                </label>
                <Input
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  error={!!validationErrors.code}
                  placeholder="e.g., CS, ENG, MATH"
                  disabled={submitting}
                  style={{ textTransform: 'uppercase' }}
                />
                {validationErrors.code && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.code}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">Use uppercase letters and numbers only</p>
              </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  validationErrors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Brief description of the department..."
                disabled={submitting}
              />
              {validationErrors.description && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                {formData.description.length}/500 characters
              </p>
            </div>

            {/* Head of Department */}
            <div>
              <label htmlFor="head_id" className="block text-sm font-medium text-gray-700 mb-2">
                Head of Department
              </label>
              <select
                id="head_id"
                name="head_id"
                value={formData.head_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={submitting}
              >
                <option value="">Select a teacher (optional)</option>
                {users.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.first_name} {teacher.last_name} ({teacher.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={submitting}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            </CardContent>

            <CardFooter className="flex items-center justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={submitting}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <FiLoader className="animate-spin w-4 h-4 mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <FiSave className="w-4 h-4 mr-2" />
                    Create Department
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
        </main>
      </div>
    </div>
  );
};

export default NewDepartment;
