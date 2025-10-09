import React, { useState } from 'react';
import Card from '../../common/Card.jsx';
import Button from '../../common/Button.jsx';
import Badge from '../../common/Badge.jsx';
import { 
  FiEdit, 
  FiTrash2, 
  FiEye, 
  FiMoreVertical,
  FiMail,
  FiPhone,
  FiCalendar,
  FiUsers,
  FiChevronLeft,
  FiChevronRight,
  FiUserCheck,
  FiUserX,
  FiShield,
  FiActivity
} from 'react-icons/fi';

const UserTable = ({ 
  users, 
  loading, 
  error, 
  currentPage, 
  totalPages, 
  onPageChange, 
  onUserAction 
}) => {
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showDropdown, setShowDropdown] = useState(null);

  const getRoleBadgeVariant = (role) => {
    const roleMap = {
      admin: 'danger',
      hod: 'warning', 
      teacher: 'primary',
      finance: 'success',
      student: 'default'
    };
    return roleMap[role] || 'default';
  };

  const getStatusBadgeVariant = (status) => {
    const statusMap = {
      active: 'success',
      inactive: 'default',
      suspended: 'danger',
      pending: 'warning'
    };
    return statusMap[status] || 'default';
  };

  const getRoleIcon = (role) => {
    const iconMap = {
      admin: FiShield,
      hod: FiShield,
      teacher: FiUsers,
      finance: FiActivity,
      student: FiUsers
    };
    return iconMap[role] || FiUsers;
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.id));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
                <div className="h-8 bg-gray-200 rounded w-20"></div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">
            <FiUsers className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Users</h3>
          <p className="text-gray-500">{error}</p>
        </div>
      </Card>
    );
  }

  if (!users || users.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-12">
          <FiUsers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
          <p className="text-gray-500 mb-6">
            No users match the current filters. Try adjusting your search criteria.
          </p>
          <Button 
            variant="primary" 
            onClick={() => onUserAction('create')}
          >
            Create First User
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">System Users</h3>
          <div className="flex items-center space-x-4">
            {selectedUsers.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {selectedUsers.length} selected
                </span>
                <Button variant="outline" size="sm">
                  Bulk Actions
                </Button>
              </div>
            )}
            <span className="text-sm text-gray-500">
              {users.length} users
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedUsers.length === users.length}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Department
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Login
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => {
              const RoleIcon = getRoleIcon(user.role);
              
              return (
                <tr 
                  key={user.id} 
                  className={`hover:bg-gray-50 transition-colors ${
                    selectedUsers.includes(user.id) ? 'bg-blue-50' : ''
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
                        <span className="text-sm font-medium text-white">
                          {user.first_name?.[0]}{user.last_name?.[0]}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <FiMail className="w-3 h-3 mr-1" />
                          {user.email}
                        </div>
                        {user.staff_id && (
                          <div className="text-xs text-gray-400">
                            ID: {user.staff_id}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <RoleIcon className="w-4 h-4 mr-2 text-gray-400" />
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {user.role?.toUpperCase()}
                      </Badge>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.department_name || '-'}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getStatusBadgeVariant(user.status || 'active')}>
                      {user.status || 'active'}
                    </Badge>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <FiCalendar className="w-4 h-4 mr-1 text-gray-400" />
                      <div>
                        <div>{formatDate(user.last_login)}</div>
                        {user.last_login && (
                          <div className="text-xs text-gray-500">
                            {formatTime(user.last_login)}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(user.created_at)}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={FiEye}
                        onClick={() => onUserAction('view', user)}
                      >
                        View
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        icon={FiEdit}
                        onClick={() => onUserAction('edit', user)}
                      >
                        Edit
                      </Button>
                      <div className="relative">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={FiMoreVertical}
                          onClick={() => setShowDropdown(showDropdown === user.id ? null : user.id)}
                        />
                        {showDropdown === user.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  onUserAction('activate', user);
                                  setShowDropdown(null);
                                }}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                              >
                                <FiUserCheck className="w-4 h-4 mr-2" />
                                Activate
                              </button>
                              <button
                                onClick={() => {
                                  onUserAction('deactivate', user);
                                  setShowDropdown(null);
                                }}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                              >
                                <FiUserX className="w-4 h-4 mr-2" />
                                Deactivate
                              </button>
                              <hr className="my-1" />
                              <button
                                onClick={() => {
                                  onUserAction('delete', user);
                                  setShowDropdown(null);
                                }}
                                className="flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 w-full text-left"
                              >
                                <FiTrash2 className="w-4 h-4 mr-2" />
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                icon={FiChevronLeft}
                disabled={currentPage === 1}
                onClick={() => onPageChange(currentPage - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={FiChevronRight}
                iconPosition="right"
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default UserTable;
