import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useAuth } from '../../../hooks/useAuth';
import { adminAPI } from '../../../services/api';

// Use dynamic imports to avoid SSR issues
const Header = dynamic(() => import('../../../components/common/Header'), {
  ssr: false,
  loading: () => (
    <header className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <h1 className="text-xl font-bold">SMIS - Loading...</h1>
      </div>
    </header>
  )
});

const Sidebar = dynamic(() => import('../../../components/common/Sidebar'), {
  ssr: false,
  loading: () => (
    <aside className="bg-gray-50 border-r border-gray-200 w-64">
      <div className="p-4">
        <div className="text-center text-gray-500">Loading...</div>
      </div>
    </aside>
  )
});

const EditDepartment = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const { departmentId } = router.query;

  // State management
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [teachers, setTeachers] = useState([]);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    head_id: '',
    status: 'active'
  });

  const [validationErrors, setValidationErrors] = useState({});

  // Fetch department data
  const fetchDepartment = async () => {
    if (!departmentId) return;

    try {
      setLoading(true);
      const response = await adminAPI.getDepartmentById(parseInt(departmentId));
      console.log('Department response:', response);

      if (response) {
        setDepartment(response);
        setFormData({
          name: response.name || '',
          code: response.code || '',
          description: response.description || '',
          head_id: response.head_id || '',
          status: response.status || 'active'
        });
      }
    } catch (err) {
      console.error('Error fetching department:', err);
      setError(err.message || 'Failed to fetch department details');
    } finally {
      setLoading(false);
    }
  };

  // Fetch HODs for head of department selection
  const fetchTeachers = async () => {
    try {
      const response = await adminAPI.getAllUsers(1, 100, { role: 'hod' });
      if (response && response.users) {
        setTeachers(response.users);
      } else if (Array.isArray(response)) {
        setTeachers(response);
      }
    } catch (err) {
      console.error('Error fetching HODs:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchDepartment();
      fetchTeachers();
    }
  }, [isAuthenticated, user, departmentId]);

  // Handle input changes
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
        [name]: ''
      }));
    }
  };

  // Validate form
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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const submitData = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim() || null,
        head_id: formData.head_id ? parseInt(formData.head_id) : null,
        status: formData.status
      };

      console.log('Updating department with data:', submitData);

      await adminAPI.updateDepartment(parseInt(departmentId), submitData);

      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/departments');
      }, 2000);

    } catch (err) {
      console.error('Error updating department:', err);
      setError(err.message || 'Failed to update department');
    } finally {
      setSubmitting(false);
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
          <p className="mt-4 text-gray-600">Loading department...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !department) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Error</h2>
          <p className="text-gray-600 mt-2">{error}</p>
          <button
            onClick={() => router.push('/admin/departments')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Departments
          </button>
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
              <button
                onClick={() => router.back()}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                ← Back
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Department</h1>
                <p className="text-gray-600">Update department information</p>
              </div>
            </div>
          </div>
        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="w-5 h-5 text-green-600 mr-3">✓</div>
              <div>
                <h3 className="text-sm font-medium text-green-800">Department Updated Successfully!</h3>
                <p className="text-sm text-green-700 mt-1">Redirecting to departments list...</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="w-5 h-5 text-red-600 mr-3">!</div>
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-5 h-5 text-blue-600 mr-2">🏢</div>
              <h2 className="text-lg font-medium text-gray-900">Department Information</h2>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Department Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Department Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  validationErrors.name ? 'border-red-300' : 'border-gray-300'
                }`}
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
              <input
                type="text"
                id="code"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  validationErrors.code ? 'border-red-300' : 'border-gray-300'
                }`}
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
                <option value="">Select a HOD (optional)</option>
                {teachers.map((hod) => (
                  <option key={hod.id} value={hod.id}>
                    {hod.first_name} {hod.last_name} ({hod.email})
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

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    💾 Update Department
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
        </main>
      </div>
    </div>
  );
};

export default EditDepartment;
