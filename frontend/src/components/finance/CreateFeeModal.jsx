import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import Alert from '../common/Alert';
import LoadingSpinner from '../common/LoadingSpinner';
import { useApi } from '../../hooks/useApi';
import { financeAPI } from '../../services/api';
import { FiDollarSign, FiUser, FiCalendar, FiFileText } from 'react-icons/fi';

const CreateFeeModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    studentId: '',
    amount: '',
    type: '',
    dueDate: '',
    description: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Get students list for dropdown
  const { data: studentsData, loading: studentsLoading } = useApi(
    () => financeAPI.getAllStudents(),
    [],
    { fallbackData: { students: [] } }
  );

  const students = studentsData?.students || [];

  const feeTypes = [
    { value: 'Tuition', label: 'Tuition Fee' },
    { value: 'Library', label: 'Library Fee' },
    { value: 'Laboratory', label: 'Laboratory Fee' },
    { value: 'Hostel', label: 'Hostel Fee' },
    { value: 'Transport', label: 'Transport Fee' },
    { value: 'Examination', label: 'Examination Fee' }
  ];

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        studentId: '',
        amount: '',
        type: '',
        dueDate: '',
        description: ''
      });
      setErrors({});
      setSubmitError('');
    }
  }, [isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.studentId) {
      newErrors.studentId = 'Please select a student';
    }

    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount greater than 0';
    }

    if (!formData.type) {
      newErrors.type = 'Please select a fee type';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      await financeAPI.createFee({
        studentId: parseInt(formData.studentId),
        amount: parseFloat(formData.amount),
        type: formData.type,
        dueDate: formData.dueDate,
        description: formData.description || undefined
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      setSubmitError(error.response?.data?.message || 'Failed to create fee. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Create New Fee"
      size="lg"
      closeOnOverlayClick={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {submitError && (
          <Alert variant="error">
            {submitError}
          </Alert>
        )}

        {/* Student Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FiUser className="inline w-4 h-4 mr-1" />
            Student *
          </label>
          {studentsLoading ? (
            <div className="flex items-center justify-center py-4">
              <LoadingSpinner size="sm" />
              <span className="ml-2 text-sm text-gray-500">Loading students...</span>
            </div>
          ) : (
            <Select
              value={formData.studentId}
              onChange={(e) => handleInputChange('studentId', e.target.value)}
              placeholder="Select a student"
              error={errors.studentId}
              required
            >
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.first_name} {student.last_name} ({student.student_id || student.email})
                </option>
              ))}
            </Select>
          )}
        </div>

        {/* Fee Type and Amount */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FiFileText className="inline w-4 h-4 mr-1" />
              Fee Type *
            </label>
            <Select
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              placeholder="Select fee type"
              error={errors.type}
              required
            >
              {feeTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FiDollarSign className="inline w-4 h-4 mr-1" />
              Amount *
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              placeholder="0.00"
              error={errors.amount}
              required
            />
          </div>
        </div>

        {/* Due Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FiCalendar className="inline w-4 h-4 mr-1" />
            Due Date *
          </label>
          <Input
            type="date"
            value={formData.dueDate}
            onChange={(e) => handleInputChange('dueDate', e.target.value)}
            error={errors.dueDate}
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (Optional)
          </label>
          <Input
            type="textarea"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Additional notes about this fee..."
            rows={3}
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            icon={isSubmitting ? LoadingSpinner : FiDollarSign}
          >
            {isSubmitting ? 'Creating...' : 'Create Fee'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateFeeModal;
