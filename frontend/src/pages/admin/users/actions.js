import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../hooks/useAuth';
import { adminAPI } from '../../../services/api';
import Header from '../../../components/common/Header';
import Sidebar from '../../../components/common/Sidebar';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import {
  FiUser,
  FiEdit2,
  FiTrash2,
  FiUserCheck,
  FiUserX,
  FiArrowLeft,
  FiMail,
  FiCalendar,
  FiShield,
  FiHome
} from 'react-icons/fi';

const UserActions = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const { userId, action } = router.query;

  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // Check authentication and authorization
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
  }, [isAuthenticated, user, router]);

  // Fetch user data
  useEffect(() => {
    if (userId && isAuthenticated && user?.role === 'admin') {
      fetchUser();
    }
  }, [userId, isAuthenticated, user]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);
      const userData = await adminAPI.getUserById(parseInt(userId));
      setSelectedUser(userData);
    } catch (err) {
      console.error('Error fetching user:', err);
      setError('Failed to load user data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      setProcessing(true);
      await adminAPI.updateUserStatus(parseInt(userId), newStatus);
      setMessage({ 
        type: 'success', 
        text: `User status updated to ${newStatus}` 
      });
      await fetchUser(); // Refresh user data
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: `Failed to update status: ${err.message}` 
      });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteUser = async () => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        setProcessing(true);
        await adminAPI.deleteUser(parseInt(userId));
        setMessage({ 
          type: 'success', 
          text: 'User deleted successfully' 
        });
        setTimeout(() => {
          router.push('/admin/users');
        }, 2000);
      } catch (err) {
        setMessage({ 
          type: 'error', 
          text: `Failed to delete user: ${err.message}` 
        });
        setTimeout(() => setMessage(null), 3000);
      } finally {
        setProcessing(false);
      }
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      teacher: 'bg-blue-100 text-blue-800',
      student: 'bg-green-100 text-green-800',
      hod: 'bg-purple-100 text-purple-800',
      finance: 'bg-orange-100 text-orange-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-yellow-100 text-yellow-800',
      pending: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6 flex justify-center items-center">
            <LoadingSpinner size="lg" />
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6">
            <div className="max-w-4xl mx-auto">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-center">
                  <div className="text-red-500 mr-3">
                    <FiUser className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-red-800">Error Loading User</h3>
                    <p className="text-red-600 mt-1">{error}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/admin/users')}
                    icon={FiArrowLeft}
                  >
                    Back to Users
                  </Button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/admin/users')}
                    icon={FiArrowLeft}
                    className="mr-4"
                  >
                    Back
                  </Button>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">User Actions</h1>
                    <p className="text-gray-600 mt-1">
                      Manage user account and permissions
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Message */}
            {message && (
              <div className={`mb-6 p-4 rounded-lg border-l-4 ${
                message.type === 'success' 
                  ? 'bg-green-50 border-green-400 text-green-800' 
                  : 'bg-red-50 border-red-400 text-red-800'
              }`}>
                <div className="flex items-center">
                  {message.type === 'success' ? (
                    <FiUserCheck className="w-5 h-5 mr-2" />
                  ) : (
                    <FiUserX className="w-5 h-5 mr-2" />
                  )}
                  <span className="font-medium">{message.text}</span>
                </div>
              </div>
            )}

            {selectedUser && (
              <>
                {/* User Details Card */}
                <Card className="mb-6">
                  <div className="p-6">
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <FiUser className="w-8 h-8 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-900">
                          {selectedUser.first_name} {selectedUser.last_name}
                        </h2>
                        <div className="flex items-center space-x-4 mt-2">
                          <div className="flex items-center text-gray-600">
                            <FiMail className="w-4 h-4 mr-1" />
                            {selectedUser.email}
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(selectedUser.role)}`}>
                            {selectedUser.role?.toUpperCase()}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedUser.status)}`}>
                            {selectedUser.status?.toUpperCase() || 'ACTIVE'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Account Information</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-500">User ID</label>
                            <p className="text-gray-900">{selectedUser.id}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Email</label>
                            <p className="text-gray-900">{selectedUser.email}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Role</label>
                            <p className="text-gray-900 capitalize">{selectedUser.role}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Additional Details</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-500">Department</label>
                            <p className="text-gray-900">{selectedUser.department_name || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Created</label>
                            <p className="text-gray-900">
                              {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Status</label>
                            <p className="text-gray-900 capitalize">{selectedUser.status || 'Active'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Actions Card */}
                <Card>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Edit User */}
                      <Button
                        variant="outline"
                        className="justify-start h-auto p-4"
                        onClick={() => router.push(`/admin/users/edit?userId=${userId}`)}
                        disabled={processing}
                      >
                        <div className="flex items-center">
                          <FiEdit2 className="w-5 h-5 mr-3 text-blue-600" />
                          <div className="text-left">
                            <div className="font-medium">Edit User</div>
                            <div className="text-sm text-gray-500">Update user information</div>
                          </div>
                        </div>
                      </Button>

                      {/* Status Actions */}
                      {selectedUser.status !== 'active' && (
                        <Button
                          variant="outline"
                          className="justify-start h-auto p-4"
                          onClick={() => handleStatusUpdate('active')}
                          disabled={processing}
                        >
                          <div className="flex items-center">
                            <FiUserCheck className="w-5 h-5 mr-3 text-green-600" />
                            <div className="text-left">
                              <div className="font-medium">Activate User</div>
                              <div className="text-sm text-gray-500">Enable user account</div>
                            </div>
                          </div>
                        </Button>
                      )}

                      {selectedUser.status !== 'suspended' && (
                        <Button
                          variant="outline"
                          className="justify-start h-auto p-4"
                          onClick={() => handleStatusUpdate('suspended')}
                          disabled={processing}
                        >
                          <div className="flex items-center">
                            <FiUserX className="w-5 h-5 mr-3 text-yellow-600" />
                            <div className="text-left">
                              <div className="font-medium">Suspend User</div>
                              <div className="text-sm text-gray-500">Temporarily disable account</div>
                            </div>
                          </div>
                        </Button>
                      )}

                      {selectedUser.status !== 'inactive' && (
                        <Button
                          variant="outline"
                          className="justify-start h-auto p-4"
                          onClick={() => handleStatusUpdate('inactive')}
                          disabled={processing}
                        >
                          <div className="flex items-center">
                            <FiUserX className="w-5 h-5 mr-3 text-gray-600" />
                            <div className="text-left">
                              <div className="font-medium">Deactivate User</div>
                              <div className="text-sm text-gray-500">Disable user account</div>
                            </div>
                          </div>
                        </Button>
                      )}

                      {/* Delete User */}
                      <Button
                        variant="outline"
                        className="justify-start h-auto p-4 border-red-300 text-red-600 hover:bg-red-50"
                        onClick={handleDeleteUser}
                        disabled={processing}
                      >
                        <div className="flex items-center">
                          <FiTrash2 className="w-5 h-5 mr-3 text-red-600" />
                          <div className="text-left">
                            <div className="font-medium">Delete User</div>
                            <div className="text-sm text-red-500">Permanently remove user</div>
                          </div>
                        </div>
                      </Button>
                    </div>
                  </div>
                </Card>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserActions;
