import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../hooks/useAuth';
import { adminAPI } from '../../../services/api';
import Header from '../../../components/common/Header';
import Sidebar from '../../../components/common/Sidebar';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';
import Badge from '../../../components/common/Badge';
import { 
  FiArrowLeft,
  FiEdit,
  FiTrash2,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiUser,
  FiShield,
  FiActivity,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle
} from 'react-icons/fi';

const UserDetailsPage = () => {
  const { user: currentUser, isAuthenticated } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check authentication and authorization
  useEffect(() => {
    if (!isAuthenticated || currentUser?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
  }, [isAuthenticated, currentUser, router]);

  // Fetch user details
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        // Note: This endpoint doesn't exist in the current backend
        // You would need to add GET /admin/users/:id endpoint
        const response = await adminAPI.getUserById(id);
        setUser(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching user details:', err);
        setError('Failed to load user details');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && currentUser?.role === 'admin') {
      fetchUserDetails();
    }
  }, [id, isAuthenticated, currentUser]);

  const getRoleIcon = (role) => {
    const iconMap = {
      admin: FiShield,
      hod: FiShield,
      teacher: FiUser,
      finance: FiActivity,
      student: FiUser
    };
    return iconMap[role] || FiUser;
  };

  const getRoleColor = (role) => {
    const colorMap = {
      admin: 'text-red-600 bg-red-100',
      hod: 'text-orange-600 bg-orange-100',
      teacher: 'text-blue-600 bg-blue-100',
      finance: 'text-green-600 bg-green-100',
      student: 'text-purple-600 bg-purple-100'
    };
    return colorMap[role] || 'text-gray-600 bg-gray-100';
  };

  const getStatusIcon = (status) => {
    const iconMap = {
      active: FiCheckCircle,
      inactive: FiXCircle,
      suspended: FiAlertCircle,
      pending: FiClock
    };
    return iconMap[status] || FiClock;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      active: 'text-green-600',
      inactive: 'text-gray-600',
      suspended: 'text-red-600',
      pending: 'text-yellow-600'
    };
    return colorMap[status] || 'text-gray-600';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not provided';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAuthenticated || currentUser?.role !== 'admin') {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            <div className="p-6 max-w-4xl mx-auto">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="h-64 bg-gray-200 rounded-lg"></div>
                    <div className="h-48 bg-gray-200 rounded-lg"></div>
                  </div>
                  <div className="space-y-6">
                    <div className="h-32 bg-gray-200 rounded-lg"></div>
                    <div className="h-48 bg-gray-200 rounded-lg"></div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            <div className="p-6 max-w-4xl mx-auto">
              <div className="text-center py-12">
                <FiUser className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">User Not Found</h3>
                <p className="text-gray-500 mb-6">
                  {error || 'The requested user could not be found.'}
                </p>
                <Button
                  variant="primary"
                  onClick={() => router.push('/admin/users')}
                  icon={FiArrowLeft}
                >
                  Back to Users
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const RoleIcon = getRoleIcon(user.role);
  const StatusIcon = getStatusIcon(user.status || 'active');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={FiArrowLeft}
                    onClick={() => router.push('/admin/users')}
                    className="mr-4"
                  >
                    Back
                  </Button>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {user.first_name} {user.last_name}
                    </h1>
                    <p className="text-gray-600 mt-1">User Details</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="primary"
                    icon={FiEdit}
                    onClick={() => router.push(`/admin/users/${user.id}/edit`)}
                  >
                    Edit User
                  </Button>
                  <Button
                    variant="danger"
                    icon={FiTrash2}
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this user?')) {
                        // Handle delete
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Profile Card */}
                <Card className="p-6">
                  <div className="flex items-start space-x-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">
                        {user.first_name?.[0]}{user.last_name?.[0]}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h2 className="text-xl font-semibold text-gray-900">
                          {user.first_name} {user.last_name}
                        </h2>
                        <div className={`flex items-center px-3 py-1 rounded-full ${getRoleColor(user.role)}`}>
                          <RoleIcon className="w-4 h-4 mr-1" />
                          <span className="text-sm font-medium capitalize">{user.role}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <FiMail className="w-4 h-4 mr-1" />
                          {user.email}
                        </div>
                        {user.phone && (
                          <div className="flex items-center">
                            <FiPhone className="w-4 h-4 mr-1" />
                            {user.phone}
                          </div>
                        )}
                      </div>
                      {user.address && (
                        <div className="flex items-center mt-2 text-sm text-gray-600">
                          <FiMapPin className="w-4 h-4 mr-1" />
                          {user.address}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Personal Information */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Date of Birth
                      </label>
                      <p className="text-gray-900">{formatDate(user.date_of_birth)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Gender
                      </label>
                      <p className="text-gray-900 capitalize">{user.gender || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Department
                      </label>
                      <p className="text-gray-900">{user.department_name || 'Not assigned'}</p>
                    </div>
                    {user.role === 'student' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            Student ID
                          </label>
                          <p className="text-gray-900 font-mono">{user.student_id || 'Not assigned'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            Enrollment Year
                          </label>
                          <p className="text-gray-900">{user.enrollment_year || 'Not specified'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            Current Year
                          </label>
                          <p className="text-gray-900">{user.current_year || 'Not specified'}</p>
                        </div>
                      </>
                    )}
                    {['teacher', 'hod', 'finance', 'admin'].includes(user.role) && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            Staff ID
                          </label>
                          <p className="text-gray-900 font-mono">{user.staff_id || 'Not assigned'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            Hire Date
                          </label>
                          <p className="text-gray-900">{formatDate(user.hire_date)}</p>
                        </div>
                        {user.qualifications && (
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-500 mb-1">
                              Qualifications
                            </label>
                            <p className="text-gray-900">{user.qualifications}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Status Card */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status</span>
                      <div className={`flex items-center ${getStatusColor(user.status || 'active')}`}>
                        <StatusIcon className="w-4 h-4 mr-1" />
                        <span className="text-sm font-medium capitalize">
                          {user.status || 'active'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Last Login</span>
                      <span className="text-sm text-gray-900">
                        {formatDateTime(user.last_login)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Created</span>
                      <span className="text-sm text-gray-900">
                        {formatDate(user.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Updated</span>
                      <span className="text-sm text-gray-900">
                        {formatDate(user.updated_at)}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Quick Actions */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      icon={FiMail}
                    >
                      Send Email
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      icon={FiActivity}
                    >
                      View Activity Log
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      icon={FiShield}
                    >
                      Reset Password
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserDetailsPage;
