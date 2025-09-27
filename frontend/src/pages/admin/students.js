import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { adminAPI } from '../../services/apiService';
import {
  FiUsers,
  FiSearch,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiFilter,
  FiDownload,
  FiChevronLeft,
  FiChevronRight,
  FiCheck,
  FiX,
  FiMoreVertical,
  FiRefreshCw,
  FiUserPlus,
  FiSliders,
  FiSave,
  FiUserCheck,
  FiUserX,
  FiUser,
  FiCalendar,
  FiBook,
  FiGraduationCap,
  FiSettings,
  FiMail,
  FiPhone
} from 'react-icons/fi';

// Import components
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Alert from '../../components/common/Alert';
import Card from '../../components/common/Card';

// Status badge component with modern design
const StatusBadge = ({ status }) => {
  const statusConfig = {
    active: { 
      label: 'Active', 
      className: 'bg-gradient-to-r from-green-400 to-green-600 text-white shadow-lg',
      icon: <FiUserCheck className="w-3 h-3 mr-1" />
    },
    inactive: { 
      label: 'Inactive', 
      className: 'bg-gradient-to-r from-gray-400 to-gray-600 text-white shadow-lg',
      icon: <FiUserX className="w-3 h-3 mr-1" />
    },
    suspended: { 
      label: 'Suspended', 
      className: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg',
      icon: <FiUserX className="w-3 h-3 mr-1" />
    },
    graduated: { 
      label: 'Graduated', 
      className: 'bg-gradient-to-r from-purple-400 to-purple-600 text-white shadow-lg',
      icon: <FiGraduationCap className="w-3 h-3 mr-1" />
    }
  };

  const config = statusConfig[status] || { 
    label: status, 
    className: 'bg-gradient-to-r from-gray-400 to-gray-600 text-white shadow-lg',
    icon: <FiUser className="w-3 h-3 mr-1" />
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold transform transition-all duration-200 hover:scale-105 ${config.className}`}>
      {config.icon}
      {config.label}
    </span>
  );
};

// Student avatar component
const StudentAvatar = ({ firstName, lastName, email }) => {
  const initials = `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`;
  const colors = [
    'from-blue-500 to-indigo-600',
    'from-purple-500 to-pink-600', 
    'from-green-500 to-teal-600',
    'from-yellow-500 to-orange-600',
    'from-red-500 to-pink-600',
    'from-indigo-500 to-purple-600'
  ];
  const colorIndex = (firstName?.charCodeAt(0) || 0) % colors.length;
  
  return (
    <div className={`flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-r ${colors[colorIndex]} flex items-center justify-center text-white font-bold text-sm shadow-lg transform transition-all duration-200 hover:scale-110`}>
      {initials}
    </div>
  );
};

export default function AdminStudentsNew() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  
  // State management
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalStudents, setTotalStudents] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, user, router]);

  // Fetch students data
  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.getAllStudents(currentPage, pageSize);
      const studentsData = Array.isArray(response.data) ? response.data : (response.data?.students || []);
      setStudents(studentsData);
      setTotalStudents(response.data?.total || studentsData.length);
    } catch (err) {
      setError(err.message || 'Failed to fetch students');
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize]);

  // Fetch departments
  const fetchDepartments = useCallback(async () => {
    try {
      const response = await adminAPI.getAllDepartments();
      const deptData = Array.isArray(response.data) ? response.data : (response.data?.departments || []);
      setDepartments(deptData);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchStudents();
      fetchDepartments();
    }
  }, [isAuthenticated, user, fetchStudents, fetchDepartments]);

  // Handle student status update
  const handleStatusUpdate = async (studentId, newStatus) => {
    try {
      setIsSubmitting(true);
      await adminAPI.updateUserStatus(studentId, newStatus);
      await fetchStudents();
      setActionMessage({ 
        type: 'success', 
        message: `Student status updated to ${newStatus}` 
      });
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      setActionMessage({ 
        type: 'error', 
        message: `Failed to update status: ${err.message}` 
      });
      setTimeout(() => setActionMessage(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle student deletion
  const handleDelete = async (studentId) => {
    if (window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      try {
        setIsSubmitting(true);
        await adminAPI.deleteUser(studentId);
        await fetchStudents();
        setActionMessage({ 
          type: 'success', 
          message: 'Student deleted successfully' 
        });
        setTimeout(() => setActionMessage(null), 3000);
      } catch (err) {
        setActionMessage({ 
          type: 'error', 
          message: `Failed to delete student: ${err.message}` 
        });
        setTimeout(() => setActionMessage(null), 3000);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Handle create/update student
  const handleSubmit = async (formData) => {
    try {
      setIsSubmitting(true);
      if (selectedStudent) {
        // Update existing student
        await adminAPI.updateUser(selectedStudent.id, formData);
        setActionMessage({ 
          type: 'success', 
          message: 'Student updated successfully' 
        });
      } else {
        // Create new student
        await adminAPI.createUser({ ...formData, role: 'student' });
        setActionMessage({ 
          type: 'success', 
          message: 'Student created successfully' 
        });
      }
      setShowCreateModal(false);
      setShowEditModal(false);
      setSelectedStudent(null);
      await fetchStudents();
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      setActionMessage({ 
        type: 'error', 
        message: `Error: ${err.message}` 
      });
      setTimeout(() => setActionMessage(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = !searchTerm || 
        student.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.student_id?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDepartment = selectedDepartment === 'all' || 
        Number(student.department_id) === Number(selectedDepartment);
      
      const matchesStatus = selectedStatus === 'all' || 
        student.status === selectedStatus;
      
      const matchesYear = selectedYear === 'all' || 
        Number(student.enrollment_year) === Number(selectedYear);
      
      return matchesSearch && matchesDepartment && matchesStatus && matchesYear;
    });
  }, [students, searchTerm, selectedDepartment, selectedStatus, selectedYear]);

  // Calculate stats
  const stats = useMemo(() => {
    const activeStudents = students.filter(s => s.status === 'active').length;
    const newThisYear = students.filter(s => {
      const enrollmentYear = s.enrollment_year || new Date(s.created_at).getFullYear();
      return Number(enrollmentYear) === new Date().getFullYear();
    }).length;
    const graduatedStudents = students.filter(s => s.status === 'graduated').length;
    
    return {
      total: totalStudents || students.length,
      active: activeStudents,
      newThisYear,
      graduated: graduatedStudents
    };
  }, [students, totalStudents]);

  // Handle page changes
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  // Calculate total pages
  const totalPages = Math.ceil((totalStudents || filteredStudents.length) / pageSize);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-6 lg:mb-0">
                <h1 className="text-4xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Student Management
                </h1>
                <p className="text-lg text-gray-600 font-medium">
                  Manage all student records, enrollment, and academic information with powerful tools
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="border-2 border-blue-500 text-blue-600 hover:bg-blue-50 font-semibold shadow-lg transform transition-all duration-200 hover:scale-105"
                >
                  <FiFilter className="w-5 h-5 mr-2" />
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </Button>
                <Button
                  onClick={() => {
                    setSelectedStudent(null);
                    setShowCreateModal(true);
                  }}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-xl transform transition-all duration-200 hover:scale-105"
                >
                  <FiUserPlus className="w-5 h-5 mr-2" />
                  Add New Student
                </Button>
              </div>
            </div>
          </div>

          {/* Action Message */}
          {actionMessage && (
            <div className={`mb-6 p-4 rounded-lg border-l-4 ${
              actionMessage.type === 'success' 
                ? 'bg-green-50 border-green-400 text-green-800' 
                : 'bg-red-50 border-red-400 text-red-800'
            }`}>
              <div className="flex items-center">
                {actionMessage.type === 'success' ? (
                  <FiCheck className="w-5 h-5 mr-2" />
                ) : (
                  <FiX className="w-5 h-5 mr-2" />
                )}
                <span className="font-medium">{actionMessage.message}</span>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
              <span className="ml-3 text-lg font-medium text-gray-600">Loading students...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="mb-6 p-6 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <FiX className="w-6 h-6 text-red-500 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-red-800">Error Loading Students</h3>
                  <p className="text-red-600 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Students */}
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 shadow-xl transform transition-all duration-200 hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium mb-1">Total Students</p>
                    <p className="text-3xl font-bold">{stats.total.toLocaleString()}</p>
                    <p className="text-blue-100 text-xs mt-1">All registered students</p>
                  </div>
                  <div className="p-3 bg-white bg-opacity-20 rounded-full">
                    <FiUsers className="w-8 h-8" />
                  </div>
                </div>
              </Card>

              {/* Active Students */}
              <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-6 shadow-xl transform transition-all duration-200 hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium mb-1">Active Students</p>
                    <p className="text-3xl font-bold">{stats.active.toLocaleString()}</p>
                    <p className="text-green-100 text-xs mt-1">Currently enrolled</p>
                  </div>
                  <div className="p-3 bg-white bg-opacity-20 rounded-full">
                    <FiUserCheck className="w-8 h-8" />
                  </div>
                </div>
              </Card>

              {/* New This Year */}
              <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white p-6 shadow-xl transform transition-all duration-200 hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-100 text-sm font-medium mb-1">New This Year</p>
                    <p className="text-3xl font-bold">{stats.newThisYear.toLocaleString()}</p>
                    <p className="text-amber-100 text-xs mt-1">Fresh enrollments</p>
                  </div>
                  <div className="p-3 bg-white bg-opacity-20 rounded-full">
                    <FiUserPlus className="w-8 h-8" />
                  </div>
                </div>
              </Card>

              {/* Departments */}
              <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white p-6 shadow-xl transform transition-all duration-200 hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium mb-1">Departments</p>
                    <p className="text-3xl font-bold">{departments.length.toLocaleString()}</p>
                    <p className="text-purple-100 text-xs mt-1">Academic divisions</p>
                  </div>
                  <div className="p-3 bg-white bg-opacity-20 rounded-full">
                    <FiBook className="w-8 h-8" />
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Advanced Filters */}
          {showFilters && (
            <Card className="mb-8 p-6 shadow-lg border-l-4 border-blue-500">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiSliders className="w-5 h-5 mr-2 text-blue-600" />
                Advanced Filters
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search Students</label>
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Name, email, or ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-2 border-gray-200 focus:border-blue-500 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <Select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="border-2 border-gray-200 focus:border-blue-500 rounded-lg"
                  >
                    <option value="all">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <Select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="border-2 border-gray-200 focus:border-blue-500 rounded-lg"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                    <option value="graduated">Graduated</option>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Enrollment Year</label>
                  <Select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="border-2 border-gray-200 focus:border-blue-500 rounded-lg"
                  >
                    <option value="all">All Years</option>
                    {[2020, 2021, 2022, 2023, 2024, 2025].map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </Select>
                </div>
              </div>
              <div className="mt-4 flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedDepartment('all');
                    setSelectedStatus('all');
                    setSelectedYear('all');
                  }}
                  className="border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  <FiX className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
                <Button
                  onClick={() => fetchStudents()}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <FiRefreshCw className="w-4 h-4 mr-2" />
                  Apply Filters
                </Button>
              </div>
            </Card>
          )}

          {/* Students Data Table */}
          {!loading && !error && (
            <Card className="shadow-xl overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 sm:mb-0 flex items-center">
                    <FiUsers className="w-6 h-6 mr-2 text-blue-600" />
                    Students ({filteredStudents.length})
                  </h3>
                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => fetchStudents()}
                      disabled={loading}
                      className="border-gray-300 text-gray-600 hover:bg-gray-50 transform transition-all duration-200 hover:scale-105"
                    >
                      <FiRefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                    <Button
                      variant="outline"
                      className="border-green-500 text-green-600 hover:bg-green-50 transform transition-all duration-200 hover:scale-105"
                    >
                      <FiDownload className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </div>
              
              {filteredStudents.length === 0 ? (
                <div className="p-12 text-center">
                  <FiUsers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-500 mb-2">No Students Found</h3>
                  <p className="text-gray-400 mb-6">Try adjusting your search criteria or add new students.</p>
                  <Button
                    onClick={() => {
                      setSelectedStudent(null);
                      setShowCreateModal(true);
                    }}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                  >
                    <FiUserPlus className="w-4 h-4 mr-2" />
                    Add First Student
                  </Button>
                </div>
              ) : (
                <>
                  <DataTable
                    columns={[
                      {
                        header: 'Student',
                        accessor: 'student_info',
                        cell: (value, row) => (
                          <div className="flex items-center py-2">
                            <StudentAvatar 
                              firstName={row.first_name} 
                              lastName={row.last_name} 
                              email={row.email} 
                            />
                            <div className="ml-4">
                              <div className="text-sm font-semibold text-gray-900">
                                {row.first_name} {row.last_name}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center">
                                <FiMail className="w-3 h-3 mr-1" />
                                {row.email}
                              </div>
                              {row.student_id && (
                                <div className="text-xs text-blue-600 font-mono bg-blue-50 px-2 py-1 rounded mt-1 inline-block">
                                  ID: {row.student_id}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      },
                      {
                        header: 'Department',
                        accessor: 'department_name',
                        cell: (value, row) => (
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">{value || 'N/A'}</div>
                            {row.enrollment_year && (
                              <div className="text-xs text-gray-500 flex items-center mt-1">
                                <FiCalendar className="w-3 h-3 mr-1" />
                                Enrolled: {row.enrollment_year}
                              </div>
                            )}
                          </div>
                        )
                      },
                      {
                        header: 'Status',
                        accessor: 'status',
                        cell: (value) => <StatusBadge status={value} />
                      },
                      {
                        header: 'Contact',
                        accessor: 'contact_info',
                        cell: (value, row) => (
                          <div className="text-sm">
                            {row.phone && (
                              <div className="flex items-center text-gray-600 mb-1">
                                <FiPhone className="w-3 h-3 mr-1" />
                                {row.phone}
                              </div>
                            )}
                            {row.address && (
                              <div className="text-xs text-gray-500 truncate max-w-32" title={row.address}>
                                {row.address}
                              </div>
                            )}
                          </div>
                        )
                      },
                      {
                        header: 'Actions',
                        accessor: 'id',
                        cell: (value, row) => (
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedStudent(row);
                                setShowDetailsModal(true);
                              }}
                              className="text-blue-600 hover:bg-blue-50 p-2 rounded-full transform transition-all duration-200 hover:scale-110"
                              title="View Details"
                            >
                              <FiEye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedStudent(row);
                                setShowEditModal(true);
                              }}
                              className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-full transform transition-all duration-200 hover:scale-110"
                              title="Edit Student"
                            >
                              <FiEdit2 className="w-4 h-4" />
                            </Button>
                            
                            {/* Status Actions Dropdown */}
                            <div className="relative group">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-600 hover:bg-gray-50 p-2 rounded-full transform transition-all duration-200 hover:scale-110"
                                title="More Actions"
                              >
                                <FiMoreVertical className="w-4 h-4" />
                              </Button>
                              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20">
                                <div className="py-2">
                                  {row.status !== 'active' && (
                                    <button
                                      onClick={() => handleStatusUpdate(value, 'active')}
                                      className="flex items-center w-full px-4 py-2 text-sm text-green-700 hover:bg-green-50 transition-colors duration-150"
                                      disabled={isSubmitting}
                                    >
                                      <FiUserCheck className="w-4 h-4 mr-2" />
                                      Activate
                                    </button>
                                  )}
                                  {row.status !== 'suspended' && (
                                    <button
                                      onClick={() => handleStatusUpdate(value, 'suspended')}
                                      className="flex items-center w-full px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50 transition-colors duration-150"
                                      disabled={isSubmitting}
                                    >
                                      <FiUserX className="w-4 h-4 mr-2" />
                                      Suspend
                                    </button>
                                  )}
                                  {row.status !== 'inactive' && (
                                    <button
                                      onClick={() => handleStatusUpdate(value, 'inactive')}
                                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                                      disabled={isSubmitting}
                                    >
                                      <FiUserX className="w-4 h-4 mr-2" />
                                      Deactivate
                                    </button>
                                  )}
                                  <div className="border-t border-gray-100 my-1"></div>
                                  <button
                                    onClick={() => handleDelete(value)}
                                    className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors duration-150"
                                    disabled={isSubmitting}
                                  >
                                    <FiTrash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      }
                    ]}
                    data={filteredStudents}
                    emptyMessage="No students found matching your criteria"
                  />
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-sm text-gray-700 mb-4 sm:mb-0">
                          Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalStudents)} of {totalStudents} students
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-700">Rows per page:</span>
                            <Select
                              value={pageSize}
                              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                              className="w-20 text-sm"
                            >
                              <option value={5}>5</option>
                              <option value={10}>10</option>
                              <option value={25}>25</option>
                              <option value={50}>50</option>
                            </Select>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage === 1}
                              className="p-2"
                            >
                              <FiChevronLeft className="w-4 h-4" />
                            </Button>
                            <span className="text-sm text-gray-700 px-3">
                              Page {currentPage} of {totalPages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChange(currentPage + 1)}
                              disabled={currentPage === totalPages}
                              className="p-2"
                            >
                              <FiChevronRight className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </Card>
          )}
        </main>
      </div>
      
      {/* Student Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <Modal
          isOpen={showCreateModal || showEditModal}
          onClose={() => {
            setShowCreateModal(false);
            setShowEditModal(false);
            setSelectedStudent(null);
          }}
          title={selectedStudent ? 'Edit Student' : 'Create New Student'}
          size="lg"
        >
          <div className="p-6">
            <StudentForm
              student={selectedStudent}
              departments={departments}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowCreateModal(false);
                setShowEditModal(false);
                setSelectedStudent(null);
              }}
              isSubmitting={isSubmitting}
            />
          </div>
        </Modal>
      )}
      
      {/* Student Details Modal */}
      {showDetailsModal && selectedStudent && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedStudent(null);
          }}
          title="Student Details"
          size="xl"
        >
          <div className="p-6">
            <StudentDetails
              student={selectedStudent}
              onEdit={() => {
                setShowDetailsModal(false);
                setShowEditModal(true);
              }}
              onStatusUpdate={handleStatusUpdate}
              onDelete={handleDelete}
              isSubmitting={isSubmitting}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}

// Student Form Component
const StudentForm = ({ student, departments, onSubmit, onCancel, isSubmitting }) => {
  const [formData, setFormData] = useState({
    firstName: student?.first_name || '',
    lastName: student?.last_name || '',
    email: student?.email || '',
    password: '',
    departmentId: student?.department_id || '',
    phone: student?.phone || '',
    address: student?.address || '',
    dateOfBirth: student?.date_of_birth || '',
    gender: student?.gender || '',
    enrollmentYear: student?.enrollment_year || new Date().getFullYear(),
    enrollmentDate: student?.enrollment_date || '',
    status: student?.status || 'active'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
          <Input
            type="text"
            value={formData.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            required
            className="w-full"
            placeholder="Enter first name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
          <Input
            type="text"
            value={formData.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            required
            className="w-full"
            placeholder="Enter last name"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          required
          className="w-full"
          placeholder="Enter email address"
        />
      </div>

      {!student && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
          <Input
            type="password"
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            required={!student}
            className="w-full"
            placeholder="Enter password"
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Department *</label>
          <Select
            value={formData.departmentId}
            onChange={(e) => handleChange('departmentId', e.target.value)}
            required
            className="w-full"
          >
            <option value="">Select Department</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <Select
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
            <option value="graduated">Graduated</option>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
          <Input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            className="w-full"
            placeholder="Enter phone number"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
          <Select
            value={formData.gender}
            onChange={(e) => handleChange('gender', e.target.value)}
            className="w-full"
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </Select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
        <Input
          type="text"
          value={formData.address}
          onChange={(e) => handleChange('address', e.target.value)}
          className="w-full"
          placeholder="Enter address"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
          <Input
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => handleChange('dateOfBirth', e.target.value)}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Enrollment Year</label>
          <Input
            type="number"
            value={formData.enrollmentYear}
            onChange={(e) => handleChange('enrollmentYear', e.target.value)}
            className="w-full"
            min="2000"
            max="2030"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-6"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6"
        >
          {isSubmitting ? (
            <>
              <LoadingSpinner className="w-4 h-4 mr-2" />
              {student ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>
              <FiSave className="w-4 h-4 mr-2" />
              {student ? 'Update Student' : 'Create Student'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

// Student Details Component
const StudentDetails = ({ student, onEdit, onStatusUpdate, onDelete, isSubmitting }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4 pb-6 border-b border-gray-200">
        <StudentAvatar 
          firstName={student.first_name} 
          lastName={student.last_name} 
          email={student.email} 
        />
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-gray-900">
            {student.first_name} {student.last_name}
          </h3>
          <p className="text-gray-600 flex items-center mt-1">
            <FiMail className="w-4 h-4 mr-2" />
            {student.email}
          </p>
          <div className="mt-2">
            <StatusBadge status={student.status} />
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={onEdit}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <FiEdit2 className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900">Personal Information</h4>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">Student ID</label>
              <p className="text-gray-900 font-mono">{student.student_id || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Phone</label>
              <p className="text-gray-900">{student.phone || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Gender</label>
              <p className="text-gray-900 capitalize">{student.gender || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Date of Birth</label>
              <p className="text-gray-900">{student.date_of_birth || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900">Academic Information</h4>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">Department</label>
              <p className="text-gray-900">{student.department_name || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Enrollment Year</label>
              <p className="text-gray-900">{student.enrollment_year || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Current Year</label>
              <p className="text-gray-900">{student.current_year || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Enrollment Date</label>
              <p className="text-gray-900">{student.enrollment_date || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {student.address && (
        <div>
          <label className="text-sm font-medium text-gray-500">Address</label>
          <p className="text-gray-900 mt-1">{student.address}</p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="pt-6 border-t border-gray-200">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h4>
        <div className="flex flex-wrap gap-3">
          {student.status !== 'active' && (
            <Button
              onClick={() => onStatusUpdate(student.id, 'active')}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <FiUserCheck className="w-4 h-4 mr-2" />
              Activate
            </Button>
          )}
          {student.status !== 'suspended' && (
            <Button
              onClick={() => onStatusUpdate(student.id, 'suspended')}
              disabled={isSubmitting}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              <FiUserX className="w-4 h-4 mr-2" />
              Suspend
            </Button>
          )}
          {student.status !== 'inactive' && (
            <Button
              onClick={() => onStatusUpdate(student.id, 'inactive')}
              disabled={isSubmitting}
              variant="outline"
              className="border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              <FiUserX className="w-4 h-4 mr-2" />
              Deactivate
            </Button>
          )}
          <Button
            onClick={() => onDelete(student.id)}
            disabled={isSubmitting}
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            <FiTrash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};
