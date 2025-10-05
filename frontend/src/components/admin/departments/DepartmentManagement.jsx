import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { adminAPI, hodAPI } from '../../../services/api';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Alert } from '../../ui/alert';
import Card from '../../common/Card';
import LoadingSpinner from '../../common/LoadingSpinner';
import DepartmentTable from './DepartmentTable';
import DepartmentForm from './DepartmentForm';
import TeacherAssignmentModal from './TeacherAssignmentModal';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';
import { 
  FiPlus, 
  FiSearch, 
  FiRefreshCw, 
  FiFilter,
  FiDownload,
  FiUsers,
  FiDatabase
} from 'react-icons/fi';

const DepartmentManagement = () => {
  const router = useRouter();
  
  // State management
  const [departments, setDepartments] = useState([]);
  const [filteredDepartments, setFilteredDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modal states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showTeacherAssignment, setShowTeacherAssignment] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  
  // Success/Error messages
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminAPI.getAllDepartments(1, 100);
      setDepartments(response);
      setFilteredDepartments(response);
    } catch (err) {
      console.error('Error fetching departments:', err);
      setError(err.message || 'Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  // Filter departments based on search and status
  useEffect(() => {
    let filtered = departments;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(dept => 
        dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (dept.hod?.name && dept.hod.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(dept => dept.status === statusFilter);
    }

    setFilteredDepartments(filtered);
  }, [departments, searchTerm, statusFilter]);

  // Load departments on component mount
  useEffect(() => {
    fetchDepartments();
  }, []);

  // Handle department creation
  const handleCreateDepartment = () => {
    setSelectedDepartment(null);
    setShowCreateForm(true);
  };

  // Handle department editing
  const handleEditDepartment = (department) => {
    setSelectedDepartment(department);
    setShowEditForm(true);
  };

  // Handle teacher assignment
  const handleManageTeachers = (department) => {
    setSelectedDepartment(department);
    setShowTeacherAssignment(true);
  };

  // Handle department deletion
  const handleDeleteDepartment = (department) => {
    setSelectedDepartment(department);
    setShowDeleteDialog(true);
  };

  // Handle form success
  const handleFormSuccess = (message) => {
    setSuccessMessage(message);
    setShowCreateForm(false);
    setShowEditForm(false);
    fetchDepartments();
    
    // Clear success message after 5 seconds
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  // Handle form error
  const handleFormError = (message) => {
    setErrorMessage(message);
    
    // Clear error message after 5 seconds
    setTimeout(() => setErrorMessage(''), 5000);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    try {
      await adminAPI.deleteDepartment(selectedDepartment.id);
      setSuccessMessage('Department deleted successfully');
      setShowDeleteDialog(false);
      fetchDepartments();
      
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to delete department');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  // Handle teacher assignment success
  const handleTeacherAssignmentSuccess = (message) => {
    setSuccessMessage(message);
    setShowTeacherAssignment(false);
    fetchDepartments();
    
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  // Clear messages
  const clearMessages = () => {
    setSuccessMessage('');
    setErrorMessage('');
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <FiDatabase className="mr-3 text-blue-600" />
            Department Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage academic departments, assign teachers, and configure department settings
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={fetchDepartments}
            disabled={loading}
          >
            <FiRefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleCreateDepartment}>
            <FiPlus className="w-4 h-4 mr-2" />
            Add Department
          </Button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <Alert variant="success" className="mb-4">
          <div className="flex justify-between items-center">
            <span>{successMessage}</span>
            <button onClick={clearMessages} className="text-green-600 hover:text-green-800">
              ×
            </button>
          </div>
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="destructive" className="mb-4">
          <div className="flex justify-between items-center">
            <span>{errorMessage}</span>
            <button onClick={clearMessages} className="text-red-600 hover:text-red-800">
              ×
            </button>
          </div>
        </Alert>
      )}

      {/* Filters and Search */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search departments, codes, or HODs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <FiUsers className="w-4 h-4" />
            <span>{filteredDepartments.length} departments</span>
          </div>
        </div>
      </Card>

      {/* Department Table */}
      {error ? (
        <Alert variant="destructive">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={fetchDepartments}>
              Retry
            </Button>
          </div>
        </Alert>
      ) : (
        <DepartmentTable
          departments={filteredDepartments}
          onEdit={handleEditDepartment}
          onDelete={handleDeleteDepartment}
          onManageTeachers={handleManageTeachers}
          loading={loading}
        />
      )}

      {/* Modals */}
      {showCreateForm && (
        <DepartmentForm
          isOpen={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          onSuccess={handleFormSuccess}
          onError={handleFormError}
          title="Create New Department"
        />
      )}

      {showEditForm && selectedDepartment && (
        <DepartmentForm
          isOpen={showEditForm}
          onClose={() => setShowEditForm(false)}
          onSuccess={handleFormSuccess}
          onError={handleFormError}
          department={selectedDepartment}
          title="Edit Department"
        />
      )}

      {showTeacherAssignment && selectedDepartment && (
        <TeacherAssignmentModal
          isOpen={showTeacherAssignment}
          onClose={() => setShowTeacherAssignment(false)}
          onSuccess={handleTeacherAssignmentSuccess}
          onError={handleFormError}
          department={selectedDepartment}
        />
      )}

      {showDeleteDialog && selectedDepartment && (
        <DeleteConfirmationDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleDeleteConfirm}
          department={selectedDepartment}
        />
      )}
    </div>
  );
};

export default DepartmentManagement;
