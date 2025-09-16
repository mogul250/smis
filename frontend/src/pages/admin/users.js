import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useApi, useAsyncOperation } from '../../hooks/useApi';
import { adminAPI } from '../../services/apiService';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { FiUsers, FiPlus, FiEdit, FiTrash2, FiEye, FiSearch, FiUserCheck, FiUserX } from 'react-icons/fi';

const AdminUsers = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [actionMessage, setActionMessage] = useState(null);

  const { data: usersData, loading, error, refetch } = useApi(
    () => adminAPI.getAllUsers({ 
      search: searchTerm, 
      role: selectedRole, 
      status: selectedStatus 
    }),
    [searchTerm, selectedRole, selectedStatus]
  );

  const { loading: processing, execute: processAction } = useAsyncOperation();

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="error">Access denied. Admin access required.</Alert>
      </div>
    );
  }

  const users = usersData?.users || [];
  const stats = usersData?.stats || {};

  const roleOptions = [
    { value: 'all', label: 'All Roles' },
    { value: 'student', label: 'Students' },
    { value: 'teacher', label: 'Teachers' },
    { value: 'hod', label: 'HODs' },
    { value: 'finance', label: 'Finance Staff' },
    { value: 'admin', label: 'Administrators' }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'pending', label: 'Pending Approval' }
  ];

  const handleCreateUser = () => {
    // Navigate to create user page or open modal
    alert('Create user functionality would be implemented here');
  };

  const handleEditUser = (userId) => {
    // Navigate to edit user page
    alert(`Edit user ${userId} functionality would be implemented here`);
  };

  const handleViewUser = (userId) => {
    // Navigate to user details page
    alert(`View user ${userId} details functionality would be implemented here`);
  };

  const handleActivateUser = async (userId) => {
    try {
      await processAction(() => adminAPI.updateUserStatus(userId, 'active'));
      setActionMessage({ type: 'success', text: 'User activated successfully!' });
      refetch();
      setTimeout(() => setActionMessage(null), 5000);
    } catch (error) {
      setActionMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to activate user' 
      });
    }
  };

  const handleDeactivateUser = async (userId) => {
    try {
      await processAction(() => adminAPI.updateUserStatus(userId, 'inactive'));
      setActionMessage({ type: 'success', text: 'User deactivated successfully!' });
      refetch();
      setTimeout(() => setActionMessage(null), 5000);
    } catch (error) {
      setActionMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to deactivate user' 
      });
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await processAction(() => adminAPI.deleteUser(userId));
        setActionMessage({ type: 'success', text: 'User deleted successfully!' });
        refetch();
        setTimeout(() => setActionMessage(null), 5000);
      } catch (error) {
        setActionMessage({ 
          type: 'error', 
          text: error.response?.data?.message || 'Failed to delete user' 
        });
      }
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'suspended': return 'danger';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'admin': return 'danger';
      case 'hod': return 'warning';
      case 'teacher': return 'primary';
      case 'finance': return 'success';
      case 'student': return 'default';
      default: return 'default';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                <p className="text-gray-600">Manage system users and their permissions</p>
              </div>
              <Button variant="primary" icon={FiPlus} onClick={handleCreateUser}>
                Create User
              </Button>
            </div>

            {actionMessage && (
              <Alert 
                variant={actionMessage.type}
                dismissible
                onDismiss={() => setActionMessage(null)}
              >
                {actionMessage.text}
              </Alert>
            )}

            {loading ? (
              <Card className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </Card>
            ) : error ? (
              <Alert variant="error">
                Failed to load users: {error}
              </Alert>
            ) : (
              <>
                {/* User Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-primary-blue rounded-lg flex items-center justify-center mr-4">
                        <FiUsers className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Users</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalUsers || 0}</p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-accent-green rounded-lg flex items-center justify-center mr-4">
                        <FiUserCheck className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Active Users</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.activeUsers || 0}</p>
                        <p className="text-xs text-gray-500">
                          {stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}% of total
                        </p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-accent-orange rounded-lg flex items-center justify-center mr-4">
                        <FiUserX className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.pendingUsers || 0}</p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-accent-red rounded-lg flex items-center justify-center mr-4">
                        <FiUsers className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">New This Month</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.newUsersThisMonth || 0}</p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Filters */}
                <Card>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Input
                        label="Search"
                        placeholder="Search by name, email, or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        icon={FiSearch}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role
                      </label>
                      <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="form-select"
                      >
                        {roleOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="form-select"
                      >
                        {statusOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-end">
                      <Button
                        variant="outline"
                        onClick={refetch}
                        className="w-full"
                      >
                        Refresh
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Users Table */}
                <Card>
                  <Card.Header>
                    <Card.Title>System Users</Card.Title>
                  </Card.Header>
                  
                  {users.length > 0 ? (
                    <Table>
                      <Table.Header>
                        <Table.Row>
                          <Table.Head>User</Table.Head>
                          <Table.Head>Role</Table.Head>
                          <Table.Head>Department</Table.Head>
                          <Table.Head>Status</Table.Head>
                          <Table.Head>Last Login</Table.Head>
                          <Table.Head>Created</Table.Head>
                          <Table.Head>Actions</Table.Head>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {users.map((userItem, index) => (
                          <Table.Row key={index}>
                            <Table.Cell>
                              <div className="font-medium text-gray-900">
                                {userItem.first_name} {userItem.last_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {userItem.email}
                              </div>
                              {userItem.employee_id && (
                                <div className="text-xs text-gray-400">
                                  ID: {userItem.employee_id}
                                </div>
                              )}
                            </Table.Cell>
                            <Table.Cell>
                              <Badge variant={getRoleBadgeVariant(userItem.role)}>
                                {userItem.role?.toUpperCase()}
                              </Badge>
                            </Table.Cell>
                            <Table.Cell>
                              <span className="text-gray-900">
                                {userItem.department_name || '-'}
                              </span>
                            </Table.Cell>
                            <Table.Cell>
                              <Badge variant={getStatusBadgeVariant(userItem.status)}>
                                {userItem.status}
                              </Badge>
                            </Table.Cell>
                            <Table.Cell>
                              <div className="text-gray-900">
                                {userItem.last_login 
                                  ? new Date(userItem.last_login).toLocaleDateString()
                                  : 'Never'
                                }
                              </div>
                              {userItem.last_login && (
                                <div className="text-sm text-gray-500">
                                  {new Date(userItem.last_login).toLocaleTimeString()}
                                </div>
                              )}
                            </Table.Cell>
                            <Table.Cell>
                              <span className="text-gray-900">
                                {new Date(userItem.created_at).toLocaleDateString()}
                              </span>
                            </Table.Cell>
                            <Table.Cell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  icon={FiEye}
                                  onClick={() => handleViewUser(userItem.id)}
                                >
                                  View
                                </Button>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  icon={FiEdit}
                                  onClick={() => handleEditUser(userItem.id)}
                                >
                                  Edit
                                </Button>
                                {userItem.status === 'active' ? (
                                  <Button
                                    variant="warning"
                                    size="sm"
                                    icon={FiUserX}
                                    onClick={() => handleDeactivateUser(userItem.id)}
                                    loading={processing}
                                  >
                                    Deactivate
                                  </Button>
                                ) : (
                                  <Button
                                    variant="success"
                                    size="sm"
                                    icon={FiUserCheck}
                                    onClick={() => handleActivateUser(userItem.id)}
                                    loading={processing}
                                  >
                                    Activate
                                  </Button>
                                )}
                                <Button
                                  variant="danger"
                                  size="sm"
                                  icon={FiTrash2}
                                  onClick={() => handleDeleteUser(userItem.id)}
                                  loading={processing}
                                >
                                  Delete
                                </Button>
                              </div>
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <FiUsers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
                      <p className="text-gray-500">
                        No users match the current filters. Try adjusting your search criteria.
                      </p>
                    </div>
                  )}
                </Card>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminUsers;
