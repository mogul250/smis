import React, { useState, useEffect } from 'react';
import Button from '../../common/Button';
import Input from '../../common/Input';
import { 
  FiX, 
  FiUser, 
  FiMail, 
  FiLock, 
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiUsers,
  FiShield
} from 'react-icons/fi';

const CreateUserModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    departmentId: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    gender: '',
    // Role-specific fields
    studentId: '',
    staffId: '',
    enrollmentYear: '',
    currentYear: '',
    hireDate: '',
    qualifications: '',
    subjects: []
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);

  const roles = [
    { value: 'student', label: 'Student', icon: FiUsers },
    { value: 'teacher', label: 'Teacher', icon: FiUser },
    { value: 'hod', label: 'Head of Department', icon: FiShield },
    { value: 'finance', label: 'Finance Staff', icon: FiUser },
    { value: 'admin', label: 'Administrator', icon: FiShield }
  ];

  const genderOptions = [
    { value: '', label: 'Select Gender' },
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' }
  ];

  // Mock departments - in real app, fetch from API
  useEffect(() => {
    setDepartments([
      { id: 1, name: 'Computer Science' },
      { id: 2, name: 'Mathematics' },
      { id: 3, name: 'Physics' },
      { id: 4, name: 'Chemistry' },
      { id: 5, name: 'Biology' }
    ]);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm password';
    if (!formData.role) newErrors.role = 'Role is required';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Password confirmation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Role-specific validations
    if (formData.role === 'student') {
      if (!formData.studentId.trim()) newErrors.studentId = 'Student ID is required';
      if (!formData.enrollmentYear) newErrors.enrollmentYear = 'Enrollment year is required';
      if (!formData.currentYear) newErrors.currentYear = 'Current year is required';
    }

    if (['teacher', 'hod', 'finance', 'admin'].includes(formData.role)) {
      if (!formData.staffId.trim()) newErrors.staffId = 'Staff ID is required';
      if (!formData.hireDate) newErrors.hireDate = 'Hire date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Prepare data for API
      const userData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: formData.role,
        departmentId: formData.departmentId || null,
        additionalData: {
          phone: formData.phone,
          address: formData.address,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          ...(formData.role === 'student' && {
            studentId: formData.studentId,
            enrollmentYear: parseInt(formData.enrollmentYear),
            currentYear: parseInt(formData.currentYear)
          }),
          ...((['teacher', 'hod', 'finance', 'admin'].includes(formData.role)) && {
            staffId: formData.staffId,
            hireDate: formData.hireDate,
            qualifications: formData.qualifications,
            subjects: formData.subjects
          })
        }
      };

      await onSubmit(userData);
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'student',
        departmentId: '',
        phone: '',
        address: '',
        dateOfBirth: '',
        gender: '',
        studentId: '',
        staffId: '',
        enrollmentYear: '',
        currentYear: '',
        hireDate: '',
        qualifications: '',
        subjects: []
      });
      setErrors({});
      
    } catch (error) {
      console.error('Error creating user:', error);
      setErrors({ submit: error.response?.data?.message || 'Failed to create user' });
    } finally {
      setLoading(false);
    }
  };

  const renderRoleSpecificFields = () => {
    if (formData.role === 'student') {
      return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Student ID"
              name="studentId"
              value={formData.studentId}
              onChange={handleChange}
              error={errors.studentId}
              required
              placeholder="e.g., STU2024001"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <select
                name="departmentId"
                value={formData.departmentId}
                onChange={handleChange}
                className="form-select"
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Enrollment Year"
              name="enrollmentYear"
              type="number"
              value={formData.enrollmentYear}
              onChange={handleChange}
              error={errors.enrollmentYear}
              required
              min="2020"
              max="2030"
            />
            <Input
              label="Current Year"
              name="currentYear"
              type="number"
              value={formData.currentYear}
              onChange={handleChange}
              error={errors.currentYear}
              required
              min="1"
              max="4"
            />
          </div>
        </>
      );
    }

    if (['teacher', 'hod', 'finance', 'admin'].includes(formData.role)) {
      return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Staff ID"
              name="staffId"
              value={formData.staffId}
              onChange={handleChange}
              error={errors.staffId}
              required
              placeholder="e.g., STAFF2024001"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <select
                name="departmentId"
                value={formData.departmentId}
                onChange={handleChange}
                className="form-select"
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
          </div>
          <Input
            label="Hire Date"
            name="hireDate"
            type="date"
            value={formData.hireDate}
            onChange={handleChange}
            error={errors.hireDate}
            required
          />
          <Input
            label="Qualifications"
            name="qualifications"
            value={formData.qualifications}
            onChange={handleChange}
            placeholder="e.g., PhD in Computer Science, MSc Mathematics"
          />
        </>
      );
    }

    return null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New User</h2>
          <Button
            variant="outline"
            size="sm"
            icon={FiX}
            onClick={onClose}
          />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                error={errors.firstName}
                required
                icon={FiUser}
              />
              <Input
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                error={errors.lastName}
                required
                icon={FiUser}
              />
            </div>
            <Input
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              required
              icon={FiMail}
            />
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Role <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {roles.map((role) => {
                const Icon = role.icon;
                return (
                  <label
                    key={role.value}
                    className={`relative flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.role === role.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role.value}
                      checked={formData.role === role.value}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <Icon className="w-5 h-5 mr-2" />
                    <span className="text-sm font-medium">{role.label}</span>
                  </label>
                );
              })}
            </div>
            {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role}</p>}
          </div>

          {/* Role-specific fields */}
          {renderRoleSpecificFields()}

          {/* Password */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Security</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                required
                icon={FiLock}
              />
              <Input
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                required
                icon={FiLock}
              />
            </div>
          </div>

          {/* Optional Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                icon={FiPhone}
                placeholder="+1 (555) 123-4567"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="form-select"
                >
                  {genderOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Input
              label="Date of Birth"
              name="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={handleChange}
              icon={FiCalendar}
            />
            <Input
              label="Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              icon={FiMapPin}
              placeholder="Street address, city, state, zip code"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
            >
              Create User
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserModal;
