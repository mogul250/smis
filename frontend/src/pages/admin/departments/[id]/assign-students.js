import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../../hooks/useAuth';
import { adminAPI } from '../../../../services/api';
import Header from '../../../../components/common/Header';
import Sidebar from '../../../../components/common/Sidebar';
import LoadingSpinner from '../../../../components/common/LoadingSpinner';
import Card from '../../../../components/common/Card';
import Button from '../../../../components/common/Button';
// Temporarily use direct imports to bypass module resolution issues
const Badge = ({ children, variant = 'default', size = 'md', className = '', ...props }) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full';
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800'
  };
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm'
  };
  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`} {...props}>
      {children}
    </span>
  );
};

const Alert = ({ children, variant = 'info', dismissible = false, onDismiss, className = '', ...props }) => {
  const baseClasses = 'p-4 rounded-md border';
  const variantConfig = {
    success: { classes: 'bg-green-50 border-green-200 text-green-800', icon: '✓', iconColor: 'text-green-400' },
    error: { classes: 'bg-red-50 border-red-200 text-red-800', icon: '!', iconColor: 'text-red-400' },
    warning: { classes: 'bg-yellow-50 border-yellow-200 text-yellow-800', icon: '⚠', iconColor: 'text-yellow-400' },
    info: { classes: 'bg-blue-50 border-blue-200 text-blue-800', icon: 'i', iconColor: 'text-blue-400' }
  };
  const config = variantConfig[variant] || variantConfig.info;
  return (
    <div className={`${baseClasses} ${config.classes} ${className}`} role="alert" {...props}>
      <div className="flex">
        <div className="flex-shrink-0">
          <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${config.iconColor}`}>
            {config.icon}
          </span>
        </div>
        <div className="ml-3 flex-1">{children}</div>
        {dismissible && (
          <div className="ml-auto pl-3">
            <button type="button" onClick={onDismiss} className="text-gray-400 hover:text-gray-600">×</button>
          </div>
        )}
      </div>
    </div>
  );
};
import {
  FiArrowLeft,
  FiSearch,
  FiUsers,
  FiUserPlus,
  FiUser,
  FiMail,
  FiCheck,
  FiX,
  FiRefreshCw,
  FiSave,
  FiBook // Use FiBook instead of FiGraduationCap which doesn't exist
} from 'react-icons/fi';
const AssignStudentsPage = () => {
  
  const router = useRouter();
  const { id: departmentId } = router.query;
  const { user, isAuthenticated } = useAuth();

  // State management
  const [department, setDepartment] = useState(null);
  const [allStudents, setAllStudents] = useState([]);
  const [currentStudents, setCurrentStudents] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudents, setSelectedStudents] = useState(new Set());

  // Fetch data
  const fetchData = async () => {
    if (!departmentId) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch department details, all students, and current department students in parallel
      const [departmentData, allStudentsData, currentStudentsData] = await Promise.all([
        adminAPI.getDepartmentById(parseInt(departmentId)),
        adminAPI.getAllStudents(1, 100), // Get maximum allowed students
        adminAPI.getDepartmentStudents(parseInt(departmentId)).catch(() => ({ students: [] }))
      ]);

      setDepartment(departmentData);
      
      // Handle different response formats
      const students = allStudentsData?.users || allStudentsData || [];
      const currentDeptStudents = currentStudentsData?.students || [];
      
      setAllStudents(students);
      setCurrentStudents(currentDeptStudents);

      // Calculate available students (not assigned to this department)
      const currentStudentIds = new Set(currentDeptStudents.map(s => s.id));
      const available = students.filter(s => !currentStudentIds.has(s.id));
      setAvailableStudents(available);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Filter available students based on search
  const filteredAvailableStudents = availableStudents.filter(student =>
    `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.student_id && student.student_id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle student selection
  const toggleStudentSelection = (studentId) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  // Select all filtered students
  const selectAllFiltered = () => {
    const newSelected = new Set(selectedStudents);
    filteredAvailableStudents.forEach(student => {
      newSelected.add(student.id);
    });
    setSelectedStudents(newSelected);
  };

  // Clear all selections
  const clearAllSelections = () => {
    setSelectedStudents(new Set());
  };

  // Handle assign students
  const handleAssignStudents = async () => {
    if (selectedStudents.size === 0) {
      setError('Please select at least one student to assign');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const studentIds = Array.from(selectedStudents);
      const assignmentPromises = studentIds.map(studentId =>
        adminAPI.assignStudentToDepartment(studentId, parseInt(departmentId))
      );

      await Promise.all(assignmentPromises);

      setSuccess(`Successfully assigned ${studentIds.length} student(s) to ${department?.name}`);
      setSelectedStudents(new Set());
      
      // Refresh data to show updated assignments
      await fetchData();

      // Redirect back to department view after a short delay
      setTimeout(() => {
        router.push(`/admin/departments/${departmentId}/view`);
      }, 2000);

    } catch (err) {
      console.error('Error assigning students:', err);
      setError(err.message || 'Failed to assign students');
    } finally {
      setSubmitting(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    if (departmentId && isAuthenticated && user?.role === 'admin') {
      fetchData();
    }
  }, [departmentId, isAuthenticated, user]);

  // Check authentication and authorization
  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="error">Access denied. Admin access required.</Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6">
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner size="lg" />
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
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  onClick={() => router.push(`/admin/departments/${departmentId}/view`)}
                  className="p-2"
                >
                  <FiArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Assign Students to {department?.name || 'Department'}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Select students to assign to this department
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/admin/departments/${departmentId}/view`)}
                >
                  <FiX className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleAssignStudents}
                  disabled={selectedStudents.size === 0 || submitting}
                  className="flex items-center"
                >
                  {submitting ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <FiSave className="w-4 h-4 mr-2" />
                  )}
                  Assign {selectedStudents.size > 0 ? `(${selectedStudents.size})` : ''} Students
                </Button>
              </div>
            </div>

            {/* Alerts */}
            {error && (
              <Alert variant="error">
                {error}
              </Alert>
            )}

            {success && (
              <Alert variant="success">
                {success}
              </Alert>
            )}

            {/* Department Info Card */}
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {department?.name} ({department?.code})
                    </h2>
                    <p className="text-gray-600 mt-1">
                      Currently has {currentStudents.length} student(s) enrolled
                    </p>
                  </div>
                  <Badge variant="primary">
                    {availableStudents.length} Available Students
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Search and Selection Controls */}
            <Card>
              <div className="p-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex-1 max-w-md">
                    <div className="relative">
                      <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search students by name, email, or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAllFiltered}
                      disabled={filteredAvailableStudents.length === 0}
                    >
                      <FiCheck className="w-4 h-4 mr-2" />
                      Select All ({filteredAvailableStudents.length})
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAllSelections}
                      disabled={selectedStudents.size === 0}
                    >
                      <FiX className="w-4 h-4 mr-2" />
                      Clear Selection
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Available Students List */}
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <FiBook className="w-5 h-5 mr-2 text-green-600" />
                    Available Students ({filteredAvailableStudents.length})
                  </h2>
                  {selectedStudents.size > 0 && (
                    <Badge variant="primary">
                      {selectedStudents.size} Selected
                    </Badge>
                  )}
                </div>

                {filteredAvailableStudents.length === 0 ? (
                  <div className="text-center py-12">
                    <FiBook className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {searchTerm ? 'No students found' : 'No available students'}
                    </h3>
                    <p className="text-gray-500">
                      {searchTerm
                        ? 'Try adjusting your search criteria'
                        : 'All students are already assigned to departments'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <input
                              type="checkbox"
                              checked={filteredAvailableStudents.length > 0 &&
                                       filteredAvailableStudents.every(s => selectedStudents.has(s.id))}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  selectAllFiltered();
                                } else {
                                  clearAllSelections();
                                }
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Student
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Current Department
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Enrollment Year
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredAvailableStudents.map((student) => (
                          <tr
                            key={student.id}
                            className={`hover:bg-gray-50 cursor-pointer ${
                              selectedStudents.has(student.id) ? 'bg-blue-50' : ''
                            }`}
                            onClick={() => toggleStudentSelection(student.id)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={selectedStudents.has(student.id)}
                                onChange={() => toggleStudentSelection(student.id)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                  <FiUser className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {student.first_name} {student.last_name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    ID: {student.student_id || student.id}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center text-sm text-gray-900">
                                <FiMail className="w-4 h-4 mr-2 text-gray-400" />
                                {student.email}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant={student.status === 'active' ? 'success' : 'secondary'}>
                                {student.status || 'Active'}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {student.department_name || 'Unassigned'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {student.enrollment_year || 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </Card>

            {/* Action Summary */}
            {selectedStudents.size > 0 && (
              <Card>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                        <FiUserPlus className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          Ready to Assign Students
                        </h3>
                        <p className="text-gray-600">
                          {selectedStudents.size} student(s) selected for assignment to {department?.name}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={handleAssignStudents}
                      disabled={submitting}
                      size="lg"
                      className="flex items-center"
                    >
                      {submitting ? (
                        <LoadingSpinner size="sm" className="mr-2" />
                      ) : (
                        <FiSave className="w-5 h-5 mr-2" />
                      )}
                      Assign {selectedStudents.size} Student{selectedStudents.size !== 1 ? 's' : ''}
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AssignStudentsPage;
