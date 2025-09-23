import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { adminAPI } from '../../services/apiService';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import UserStatsCards, { RoleBreakdownCard } from '../../components/admin/users/UserStatsCards';
import UserTable from '../../components/admin/users/UserTable';
import CreateUserModal from '../../components/admin/users/CreateUserModal';
import EditUserModal from '../../components/admin/users/EditUserModal';
import DeleteUserModal from '../../components/admin/users/DeleteUserModal';
import {
  FiPlus,
  FiSearch,
  FiFilter,
  FiDownload,
  FiRefreshCw,
  FiUsers,
  FiTrendingUp,
  FiSettings,
  FiBell,
  FiActivity
} from 'react-icons/fi';

const AdminUsers = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  // State management
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Pagination and filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Stats
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    newThisMonth: 0,
    byRole: {}
  });

  // Check authentication and authorization
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
  }, [isAuthenticated, user, router]);

  // Fetch users data
  const fetchUsers = async (page = 1, search = '', role = '', department = '') => {
    try {
      setLoading(page === 1);
      setRefreshing(page !== 1);

      const params = {
        page,
        limit: 10,
        ...(search && { search }),
        ...(role && { role }),
        ...(department && { departmentId: department })
      };

      const response = await adminAPI.getAllUsers(params);
      const { users: fetchedUsers, pagination } = response.data;

      setUsers(fetchedUsers);
      setCurrentPage(pagination.page);
      setTotalPages(pagination.pages);
      setTotalUsers(pagination.total);

      // Calculate stats
      calculateUserStats(fetchedUsers);

      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Calculate user statistics
  const calculateUserStats = (usersList) => {
    const stats = {
      totalUsers: usersList.length,
      activeUsers: usersList.filter(u => u.status === 'active').length,
      newThisMonth: usersList.filter(u => {
        const createdDate = new Date(u.created_at);
        const now = new Date();
        return createdDate.getMonth() === now.getMonth() &&
               createdDate.getFullYear() === now.getFullYear();
      }).length,
      byRole: {}
    };

    // Count by role
    usersList.forEach(user => {
      stats.byRole[user.role] = (stats.byRole[user.role] || 0) + 1;
    });

    setUserStats(stats);
  };

  // Initial data fetch
  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchUsers();
    }
  }, [isAuthenticated, user]);

  // Handle search and filters
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      fetchUsers(1, searchTerm, roleFilter, departmentFilter);
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, roleFilter, departmentFilter]);

  // Handle page change
  const handlePageChange = (page) => {
    fetchUsers(page, searchTerm, roleFilter, departmentFilter);
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchUsers(currentPage, searchTerm, roleFilter, departmentFilter);
  };

  // Handle user creation
  const handleCreateUser = async (userData) => {
    try {
      await adminAPI.createUser(userData);
      setShowCreateModal(false);
      handleRefresh();
      // Show success notification
    } catch (err) {
      console.error('Error creating user:', err);
      throw err;
    }
  };

  // Handle user edit
  const handleEditUser = async (userId, userData) => {
    try {
      await adminAPI.updateUser(userId, userData);
      setShowEditModal(false);
      setSelectedUser(null);
      handleRefresh();
      // Show success notification
    } catch (err) {
      console.error('Error updating user:', err);
      throw err;
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (userId) => {
    try {
      await adminAPI.deleteUser(userId);
      setShowDeleteModal(false);
      setSelectedUser(null);
      handleRefresh();
      // Show success notification
    } catch (err) {
      console.error('Error deleting user:', err);
      throw err;
    }
  };

  // Handle user actions
  const handleUserAction = (action, user) => {
    setSelectedUser(user);
    switch (action) {
      case 'create':
        setShowCreateModal(true);
        break;
      case 'edit':
        setShowEditModal(true);
        break;
      case 'delete':
        setShowDeleteModal(true);
        break;
      case 'view':
        // Navigate to user details page
        router.push(`/admin/users/${user.id}`);
        break;
      case 'activate':
        handleActivateUser(user.id);
        break;
      case 'deactivate':
        handleDeactivateUser(user.id);
        break;
      default:
        break;
    }
  };

  const handleActivateUser = async (userId) => {
    try {
      await adminAPI.updateUserStatus(userId, 'active');
      handleRefresh();
      // Show success notification
    } catch (error) {
      console.error('Error activating user:', error);
    }
  };

  const handleDeactivateUser = async (userId) => {
    try {
      await adminAPI.updateUserStatus(userId, 'inactive');
      handleRefresh();
      // Show success notification
    } catch (error) {
      console.error('Error deactivating user:', error);
    }
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-6 max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                    <FiUsers className="mr-3 text-blue-600" />
                    User Management
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Manage all users across the system - students, teachers, and staff
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    icon={FiRefreshCw}
                    onClick={handleRefresh}
                    loading={refreshing}
                    size="sm"
                  >
                    Refresh
                  </Button>
                  <Button
                    variant="outline"
                    icon={FiDownload}
                    size="sm"
                  >
                    Export
                  </Button>
                  <Button
                    variant="primary"
                    icon={FiPlus}
                    onClick={() => setShowCreateModal(true)}
                  >
                    Add User
                  </Button>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
              <div className="lg:col-span-3">
                <UserStatsCards
                  stats={userStats}
                  totalUsers={totalUsers}
                  loading={loading}
                />
              </div>
              <div className="lg:col-span-1">
                <RoleBreakdownCard
                  stats={userStats}
                  loading={loading}
                />
              </div>
            </div>

            {/* Filters and Search */}
            <Card className="mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 flex-1">
                  {/* Search */}
                  <div className="relative flex-1 max-w-md">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Role Filter */}
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Roles</option>
                    <option value="student">Students</option>
                    <option value="teacher">Teachers</option>
                    <option value="hod">HODs</option>
                    <option value="finance">Finance</option>
                    <option value="admin">Admins</option>
                  </select>
                </div>

                <div className="flex items-center text-sm text-gray-500">
                  <FiTrendingUp className="w-4 h-4 mr-1" />
                  {totalUsers} total users
                </div>
              </div>
            </Card>

            {/* Users Table */}
            <UserTable
              users={users}
              loading={loading}
              error={error}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              onUserAction={handleUserAction}
            />
          </div>
        </main>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateUserModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateUser}
        />
      )}

      {showEditModal && selectedUser && (
        <EditUserModal
          isOpen={showEditModal}
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onSubmit={handleEditUser}
        />
      )}

      {showDeleteModal && selectedUser && (
        <DeleteUserModal
          isOpen={showDeleteModal}
          user={selectedUser}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedUser(null);
          }}
          onConfirm={handleDeleteUser}
        />
      )}
    </div>
  );
};

export default AdminUsers;
