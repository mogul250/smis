import React from 'react';
import Button from '../../common/Button';
import Badge from '../../common/Badge';
import {
  FiX,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiUser,
  FiBook,
  FiClock
} from 'react-icons/fi';

const StudentDetailsModal = ({ student, isOpen, onClose }) => {
  if (!isOpen || !student) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'Not provided';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { variant: 'success', label: 'Active' },
      inactive: { variant: 'danger', label: 'Inactive' },
      suspended: { variant: 'warning', label: 'Suspended' },
      graduated: { variant: 'primary', label: 'Graduated' }
    };
    
    const config = statusConfig[status] || { variant: 'default', label: status || 'Unknown' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {student.first_name} {student.last_name}
            </h2>
            <p className="text-sm text-gray-600 mt-1">Student Details</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={FiX}
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          />
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Profile Section */}
          <div className="flex items-start space-x-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-xl font-bold text-white">
                {student.first_name?.[0]}{student.last_name?.[0]}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-lg font-medium text-gray-900">
                  {student.first_name} {student.last_name}
                </h3>
                {getStatusBadge(student.status)}
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <FiMail className="w-4 h-4 mr-1" />
                  {student.email}
                </div>
                {student.phone && (
                  <div className="flex items-center">
                    <FiPhone className="w-4 h-4 mr-1" />
                    {student.phone}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Student ID
              </label>
              <p className="text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded">
                {student.student_id || 'Not assigned'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Department
              </label>
              <p className="text-gray-900">{student.department_name || 'Not assigned'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Enrollment Year
              </label>
              <div className="flex items-center text-gray-900">
                <FiCalendar className="w-4 h-4 mr-2" />
                {student.enrollment_year || 'Not specified'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Current Year
              </label>
              <div className="flex items-center text-gray-900">
                <FiBook className="w-4 h-4 mr-2" />
                {student.current_year || 'Not specified'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Date of Birth
              </label>
              <p className="text-gray-900">{formatDate(student.date_of_birth)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Gender
              </label>
              <div className="flex items-center text-gray-900">
                <FiUser className="w-4 h-4 mr-2" />
                {student.gender || 'Not specified'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Enrollment Date
              </label>
              <p className="text-gray-900">{formatDate(student.enrollment_date)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Graduation Date
              </label>
              <p className="text-gray-900">{formatDate(student.graduation_date)}</p>
            </div>

            {student.address && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Address
                </label>
                <div className="flex items-start text-gray-900">
                  <FiMapPin className="w-4 h-4 mr-2 mt-0.5" />
                  {student.address}
                </div>
              </div>
            )}
          </div>

          {/* Timestamps */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Created At
                </label>
                <div className="flex items-center text-gray-600">
                  <FiClock className="w-3 h-3 mr-1" />
                  {formatDate(student.created_at)}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Last Updated
                </label>
                <div className="flex items-center text-gray-600">
                  <FiClock className="w-3 h-3 mr-1" />
                  {formatDate(student.updated_at)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button 
            variant="primary" 
            icon={FiEdit}
            onClick={() => {
              onClose();
              // Navigate to edit page - you can customize this
              window.open(`/admin/users/${student.id}`, '_blank');
            }}
          >
            Edit Student
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StudentDetailsModal;
