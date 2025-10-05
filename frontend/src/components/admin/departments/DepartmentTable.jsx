import React, { useState } from 'react';
import { Button } from '../../ui/button';
import Card from '../../common/Card';
import LoadingSpinner from '../../common/LoadingSpinner';
import { 
  FiEdit, 
  FiTrash2, 
  FiUsers, 
  FiUser,
  FiMoreVertical,
  FiEye,
  FiSettings
} from 'react-icons/fi';

const DepartmentTable = ({ 
  departments = [], 
  onEdit, 
  onDelete, 
  onManageTeachers,
  loading = false 
}) => {
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort departments
  const sortedDepartments = [...departments].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    // Handle nested values (like hod.name)
    if (sortField === 'hod') {
      aValue = a.hod?.name || '';
      bValue = b.hod?.name || '';
    }

    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Toggle row expansion
  const toggleRowExpansion = (departmentId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(departmentId)) {
      newExpanded.delete(departmentId);
    } else {
      newExpanded.add(departmentId);
    }
    setExpandedRows(newExpanded);
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (status) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'inactive':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  // Get teacher count
  const getTeacherCount = (department) => {
    return department.teachers?.length || 0;
  };

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </Card>
    );
  }

  if (departments.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <FiUsers className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No departments found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new department.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center space-x-1">
                  <span>Department</span>
                  {sortField === 'name' && (
                    <span className="text-blue-500">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('code')}
              >
                <div className="flex items-center space-x-1">
                  <span>Code</span>
                  {sortField === 'code' && (
                    <span className="text-blue-500">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('hod')}
              >
                <div className="flex items-center space-x-1">
                  <span>Head of Department</span>
                  {sortField === 'hod' && (
                    <span className="text-blue-500">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Teachers
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedDepartments.map((department) => (
              <React.Fragment key={department.id}>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {department.name}
                      </div>
                      {department.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {department.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {department.code}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FiUser className="w-4 h-4 text-gray-400 mr-2" />
                      <div className="text-sm text-gray-900">
                        {department.hod?.name || 'Not assigned'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FiUsers className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {getTeacherCount(department)} teachers
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getStatusBadge(department.status)}>
                      {department.status || 'active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRowExpansion(department.id)}
                        title="View details"
                      >
                        <FiEye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onManageTeachers(department)}
                        title="Manage teachers"
                      >
                        <FiUsers className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(department)}
                        title="Edit department"
                      >
                        <FiEdit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(department)}
                        title="Delete department"
                        className="text-red-600 hover:text-red-800"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
                
                {/* Expanded row details */}
                {expandedRows.has(department.id) && (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 bg-gray-50">
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Department Information</h4>
                            <dl className="space-y-1">
                              <div className="flex justify-between">
                                <dt className="text-sm text-gray-500">Created:</dt>
                                <dd className="text-sm text-gray-900">
                                  {department.created_at ? new Date(department.created_at).toLocaleDateString() : 'N/A'}
                                </dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="text-sm text-gray-500">ID:</dt>
                                <dd className="text-sm text-gray-900">{department.id}</dd>
                              </div>
                            </dl>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Quick Actions</h4>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onManageTeachers(department)}
                              >
                                <FiUsers className="w-4 h-4 mr-1" />
                                Manage Teachers
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onEdit(department)}
                              >
                                <FiSettings className="w-4 h-4 mr-1" />
                                Settings
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        {department.description && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-1">Description</h4>
                            <p className="text-sm text-gray-600">{department.description}</p>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default DepartmentTable;
