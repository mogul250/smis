import React, { useState } from 'react';
import { Button } from '../../ui/button';
import { Alert } from '../../ui/alert';
import Modal from '../../common/Modal';
import { FiTrash2, FiAlertTriangle, FiX } from 'react-icons/fi';

const DeleteConfirmationDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  department 
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);
      await onConfirm();
    } catch (error) {
      console.error('Error deleting department:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!department) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Department"
      size="sm"
      closeOnOverlayClick={!isDeleting}
    >
      <div className="space-y-4">
        {/* Warning Icon */}
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
          <FiAlertTriangle className="w-6 h-6 text-red-600" />
        </div>

        {/* Warning Message */}
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Delete Department
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Are you sure you want to delete the department{' '}
            <span className="font-semibold text-gray-900">
              "{department.name}" ({department.code})
            </span>
            ? This action cannot be undone.
          </p>
        </div>

        {/* Warning Alert */}
        <Alert variant="warning" className="text-sm">
          <FiAlertTriangle className="w-4 h-4" />
          <div className="ml-2">
            <strong>Warning:</strong> Deleting this department will:
            <ul className="mt-1 ml-4 list-disc text-xs">
              <li>Remove all teacher assignments from this department</li>
              <li>Affect any students enrolled in this department</li>
              <li>Remove department-related course associations</li>
            </ul>
          </div>
        </Alert>

        {/* Department Details */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Department Details:</h4>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Name:</dt>
              <dd className="text-gray-900 font-medium">{department.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Code:</dt>
              <dd className="text-gray-900 font-medium">{department.code}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">HOD:</dt>
              <dd className="text-gray-900">{department.hod?.name || 'Not assigned'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Teachers:</dt>
              <dd className="text-gray-900">{department.teachers?.length || 0}</dd>
            </div>
          </dl>
        </div>

        {/* Confirmation Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type <span className="font-mono bg-gray-100 px-1 rounded">DELETE</span> to confirm:
          </label>
          <input
            type="text"
            placeholder="Type DELETE to confirm"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
            onChange={(e) => {
              const confirmButton = document.getElementById('confirm-delete-btn');
              if (confirmButton) {
                confirmButton.disabled = e.target.value !== 'DELETE' || isDeleting;
              }
            }}
            disabled={isDeleting}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            <FiX className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            id="confirm-delete-btn"
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            loading={isDeleting}
            disabled={true} // Initially disabled until user types DELETE
          >
            <FiTrash2 className="w-4 h-4 mr-2" />
            {isDeleting ? 'Deleting...' : 'Delete Department'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteConfirmationDialog;
