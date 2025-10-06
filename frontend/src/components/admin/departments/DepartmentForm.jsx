import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../../services/api';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Alert } from '../../ui/alert';
import Modal from '../../common/Modal';
import LoadingSpinner from '../../common/LoadingSpinner';
import { FiSave, FiX, FiUser, FiDatabase } from 'react-icons/fi';

const DepartmentForm = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  onError, 
  department = null, 
  title = "Department Form" 
}) => {
  const isEditing = !!department;
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    head_id: '',
    status: 'active'
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [hods, setHods] = useState([]);

  // Load form data when department changes
  useEffect(() => {
    if (department) {
      setFormData({
        name: department.name || '',
        code: department.code || '',
        description: department.description || '',
        head_id: department.head_id || '',
        status: department.status || 'active'
      });
    } else {
      setFormData({
        name: '',
        code: '',
        description: '',
        head_id: '',
        status: 'active'
      });
    }
    setErrors({});
  }, [department]);

  // Fetch HODs for dropdown
  useEffect(() => {
    const fetchHods = async () => {
      try {
        setLoading(true);
        // Get users with HOD role
        const response = await adminAPI.getAllUsers(1, 100, { role: 'hod' });
        setHods(response.users || []);
      } catch (err) {
        console.error('Error fetching HODs:', err);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchHods();
    }
  }, [isOpen]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Department name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Department name must be at least 2 characters';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Department code is required';
    } else if (formData.code.trim().length < 2) {
      newErrors.code = 'Department code must be at least 2 characters';
    } else if (!/^[A-Z0-9]+$/.test(formData.code.trim().toUpperCase())) {
      newErrors.code = 'Department code must contain only letters and numbers';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      
      const submitData = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim() || null,
        head_id: formData.head_id ? parseInt(formData.head_id) : null,
        status: formData.status
      };

      if (isEditing) {
        await adminAPI.updateDepartment(department.id, submitData);
        onSuccess('Department updated successfully');
      } else {
        await adminAPI.createDepartment(submitData);
        onSuccess('Department created successfully');
      }
    } catch (err) {
      console.error('Error saving department:', err);
      onError(err.message || 'Failed to save department');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (!submitting) {
      setFormData({
        name: '',
        code: '',
        description: '',
        head_id: '',
        status: 'active'
      });
      setErrors({});
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Department Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Department Name *
          </label>
          <Input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            error={!!errors.name}
            placeholder="e.g., Computer Science"
            disabled={submitting}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        {/* Department Code */}
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
            Department Code *
          </label>
          <Input
            id="code"
            name="code"
            type="text"
            value={formData.code}
            onChange={handleChange}
            error={!!errors.code}
            placeholder="e.g., CS"
            disabled={submitting}
            className="uppercase"
          />
          {errors.code && (
            <p className="mt-1 text-sm text-red-600">{errors.code}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Use a short, unique code (letters and numbers only)
          </p>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            value={formData.description}
            onChange={handleChange}
            placeholder="Brief description of the department..."
            disabled={submitting}
            className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            {formData.description.length}/500 characters
          </p>
        </div>

        {/* Head of Department */}
        <div>
          <label htmlFor="head_id" className="block text-sm font-medium text-gray-700 mb-1">
            Head of Department
          </label>
          <select
            id="head_id"
            name="head_id"
            value={formData.head_id}
            onChange={handleChange}
            disabled={submitting || loading}
            className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2"
          >
            <option value="">Select HOD (Optional)</option>
            {hods.map(hod => (
              <option key={hod.id} value={hod.id}>
                {hod.first_name} {hod.last_name} ({hod.email})
              </option>
            ))}
          </select>
          {loading && (
            <p className="mt-1 text-sm text-gray-500">Loading HODs...</p>
          )}
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            disabled={submitting}
            className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={submitting}
          >
            <FiX className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="submit"
            loading={submitting}
            disabled={submitting}
          >
            <FiSave className="w-4 h-4 mr-2" />
            {isEditing ? 'Update Department' : 'Create Department'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default DepartmentForm;
