import React, { useState } from 'react';
import Button from '../../common/Button';
import { 
  FiX, 
  FiAlertTriangle,
  FiTrash2,
  FiUser,
  FiMail,
  FiShield
} from 'react-icons/fi';

const DeleteUserModal = ({ isOpen, user, onClose, onConfirm }) => {
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');

  const expectedConfirmText = 'DELETE';

  const handleConfirm = async () => {
    if (confirmText !== expectedConfirmText) {
      setError(`Please type "${expectedConfirmText}" to confirm`);
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await onConfirm(user.id);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setConfirmText('');
      setError('');
      onClose();
    }
  };

  const getRoleIcon = (role) => {
    const iconMap = {
      admin: FiShield,
      hod: FiShield,
      teacher: FiUser,
      finance: FiUser,
      student: FiUser
    };
    return iconMap[role] || FiUser;
  };

  const getRoleColor = (role) => {
    const colorMap = {
      admin: 'text-red-600',
      hod: 'text-orange-600',
      teacher: 'text-blue-600',
      finance: 'text-green-600',
      student: 'text-purple-600'
    };
    return colorMap[role] || 'text-gray-600';
  };

  const getWarningMessage = (role) => {
    const messages = {
      admin: 'Deleting an administrator will remove all their system access and permissions. This action cannot be undone.',
      hod: 'Deleting a Head of Department will affect department management and approvals. Consider transferring responsibilities first.',
      teacher: 'Deleting a teacher will remove their access to classes, grades, and student records. This may affect ongoing courses.',
      finance: 'Deleting finance staff will remove their access to financial records and payment processing.',
      student: 'Deleting a student will remove their academic records, grades, and enrollment status. This action cannot be undone.'
    };
    return messages[role] || 'This action will permanently delete the user and cannot be undone.';
  };

  if (!isOpen || !user) return null;

  const RoleIcon = getRoleIcon(user.role);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
              <FiAlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Delete User</h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={FiX}
            onClick={handleClose}
            disabled={loading}
          />
        </div>

        {/* Content */}
        <div className="p-6">
          {/* User Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
                <span className="text-sm font-medium text-white">
                  {user.first_name?.[0]}{user.last_name?.[0]}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center">
                  <h3 className="font-medium text-gray-900">
                    {user.first_name} {user.last_name}
                  </h3>
                  <div className={`ml-2 flex items-center ${getRoleColor(user.role)}`}>
                    <RoleIcon className="w-4 h-4 mr-1" />
                    <span className="text-sm font-medium capitalize">
                      {user.role}
                    </span>
                  </div>
                </div>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <FiMail className="w-3 h-3 mr-1" />
                  {user.email}
                </div>
                {user.department_name && (
                  <div className="text-xs text-gray-400 mt-1">
                    {user.department_name}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Warning Message */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <FiAlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-red-800 mb-2">
                  Warning: This action cannot be undone
                </h4>
                <p className="text-sm text-red-700">
                  {getWarningMessage(user.role)}
                </p>
              </div>
            </div>
          </div>

          {/* Confirmation Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To confirm deletion, type <span className="font-mono font-bold text-red-600">{expectedConfirmText}</span> below:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => {
                setConfirmText(e.target.value);
                if (error) setError('');
              }}
              placeholder={`Type "${expectedConfirmText}" to confirm`}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                error ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={loading}
            />
            {error && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>

          {/* Impact Summary */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">
              What will be deleted:
            </h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• User account and login credentials</li>
              <li>• Personal information and profile data</li>
              {user.role === 'student' && (
                <>
                  <li>• Academic records and grades</li>
                  <li>• Enrollment and attendance history</li>
                  <li>• Fee payment records</li>
                </>
              )}
              {['teacher', 'hod'].includes(user.role) && (
                <>
                  <li>• Class assignments and teaching records</li>
                  <li>• Grade entries and assessments</li>
                  <li>• Department associations</li>
                </>
              )}
              {user.role === 'finance' && (
                <li>• Financial transaction records</li>
              )}
              <li>• System access and permissions</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirm}
              loading={loading}
              disabled={confirmText !== expectedConfirmText}
              icon={FiTrash2}
            >
              Delete User
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteUserModal;
