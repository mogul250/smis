import React, { useState } from 'react';
import { Button } from '../../ui/button';
import { Alert } from '../../ui/alert';
import { 
  FiTrash2, 
  FiDownload, 
  FiEdit, 
  FiUsers,
  FiX,
  FiCheck
} from 'react-icons/fi';

const BulkActionsBar = ({ 
  selectedDepartments = [], 
  onClearSelection,
  onBulkDelete,
  onBulkExport,
  onBulkStatusChange,
  loading = false
}) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [bulkAction, setBulkAction] = useState('');

  if (selectedDepartments.length === 0) {
    return null;
  }

  const handleBulkDelete = () => {
    setShowConfirmDelete(true);
  };

  const confirmBulkDelete = () => {
    onBulkDelete(selectedDepartments);
    setShowConfirmDelete(false);
  };

  const handleBulkStatusChange = (status) => {
    onBulkStatusChange(selectedDepartments, status);
  };

  const handleBulkExport = () => {
    onBulkExport(selectedDepartments);
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <FiCheck className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              {selectedDepartments.length} department{selectedDepartments.length !== 1 ? 's' : ''} selected
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Status Change Actions */}
            <select
              value={bulkAction}
              onChange={(e) => {
                setBulkAction(e.target.value);
                if (e.target.value === 'activate') {
                  handleBulkStatusChange('active');
                } else if (e.target.value === 'deactivate') {
                  handleBulkStatusChange('inactive');
                }
                setBulkAction('');
              }}
              className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            >
              <option value="">Bulk Actions</option>
              <option value="activate">Activate Selected</option>
              <option value="deactivate">Deactivate Selected</option>
            </select>

            {/* Export Action */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkExport}
              disabled={loading}
            >
              <FiDownload className="w-4 h-4 mr-1" />
              Export
            </Button>

            {/* Delete Action */}
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={loading}
            >
              <FiTrash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>

        {/* Clear Selection */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          disabled={loading}
        >
          <FiX className="w-4 h-4 mr-1" />
          Clear Selection
        </Button>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDelete && (
        <Alert variant="destructive" className="mt-4">
          <div className="flex items-center justify-between">
            <div>
              <strong>Confirm Bulk Delete</strong>
              <p className="text-sm mt-1">
                Are you sure you want to delete {selectedDepartments.length} department{selectedDepartments.length !== 1 ? 's' : ''}? 
                This action cannot be undone.
              </p>
            </div>
            <div className="flex space-x-2 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirmDelete(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={confirmBulkDelete}
                loading={loading}
              >
                Delete All
              </Button>
            </div>
          </div>
        </Alert>
      )}
    </div>
  );
};

export default BulkActionsBar;
