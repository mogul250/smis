import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useApi, useAsyncOperation } from '../../hooks/useApi';
import { financeAPI } from '../../services/api';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { FiUsers, FiSearch, FiEye, FiDollarSign, FiMail, FiPhone, FiCalendar, FiTrendingUp, FiAlertCircle } from 'react-icons/fi';

const FinanceStudents = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [actionMessage, setActionMessage] = useState(null);

  const { data: studentsData, loading, error, refetch } = useApi(
    () => financeAPI.getAllStudents({ 
      search: searchTerm, 
      status: selectedStatus,
      year: selectedYear
    }),
    [searchTerm, selectedStatus, selectedYear],
    { fallbackData: { students: [], stats: {} } }
  );

  const { loading: processing, execute: processAction } = useAsyncOperation();

  if (!user || user.role !== 'finance') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="error">Access denied. Finance access required.</Alert>
      </div>
    );
  }

  const students = studentsData?.students || [];
  const stats = studentsData?.stats || {};

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'graduated', label: 'Graduated' },
    { value: 'suspended', label: 'Suspended' }
  ];

  const yearOptions = [
    { value: 'all', label: 'All Years' },
    { value: '2024', label: '2024' },
    { value: '2023', label: '2023' },
    { value: '2022', label: '2022' },
    { value: '2021', label: '2021' }
  ];

  const handleViewStudent = (studentId) => {
    // Navigate to student details page
    window.location.href = `/finance/students/${studentId}`;
  };

  const handleViewFees = async (studentId) => {
    try {
      const fees = await processAction(() => financeAPI.getStudentFees(studentId));
      // Show fees in a modal or navigate to fees page
      alert(`Student has ${fees?.length || 0} fee records`);
    } catch (error) {
      setActionMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to load student fees' 
      });
    }
  };

  const handleGenerateInvoice = async (studentId) => {
    try {
      const invoice = await processAction(() => financeAPI.generateInvoice(studentId));
      // Show invoice or download
      alert(`Invoice generated for student ${studentId}. Total: $${invoice?.totalAmount || 0}`);
    } catch (error) {
      setActionMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to generate invoice' 
      });
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'warning';
      case 'graduated': return 'primary';
      case 'suspended': return 'danger';
      default: return 'default';
    }
  };

  const getOutstandingBadgeVariant = (amount) => {
    if (amount === 0) return 'success';
    if (amount < 500) return 'warning';
    return 'danger';
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
                <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
                <p className="text-gray-600">Manage student accounts and financial records</p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" icon={FiTrendingUp}>
                  Export Report
                </Button>
                <Button variant="primary" icon={FiUsers}>
                  Add Student
                </Button>
              </div>
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
                Failed to load students: {error}
              </Alert>
            ) : (
              <>
                {/* Student Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-primary-blue rounded-lg flex items-center justify-center mr-4">
                        <FiUsers className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Students</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {stats.totalStudents || 0}
                        </p>
                        <p className="text-xs text-gray-500">
                          {stats.activeStudents || 0} active
                        </p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-accent-green rounded-lg flex items-center justify-center mr-4">
                        <FiDollarSign className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Outstanding</p>
                        <p className="text-2xl font-bold text-gray-900">
                          ${stats.totalOutstanding?.toLocaleString() || '0'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {stats.studentsWithFees || 0} students
                        </p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-accent-orange rounded-lg flex items-center justify-center mr-4">
                        <FiAlertCircle className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Overdue Fees</p>
                        <p className="text-2xl font-bold text-gray-900">
                          ${stats.overdueAmount?.toLocaleString() || '0'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {stats.overdueStudents || 0} students
                        </p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-accent-red rounded-lg flex items-center justify-center mr-4">
                        <FiCalendar className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Graduated</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {stats.graduatedStudents || 0}
                        </p>
                        <p className="text-xs text-gray-500">
                          This year
                        </p>
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
                        placeholder="Search by name, ID, or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        icon={FiSearch}
                      />
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
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Enrollment Year
                      </label>
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="form-select"
                      >
                        {yearOptions.map(option => (
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

                {/* Students Table */}
                <Card>
                  <Card.Header>
                    <Card.Title>Student Records</Card.Title>
                  </Card.Header>
                  
                  {students.length > 0 ? (
                    <Table>
                      <Table.Header>
                        <Table.Row>
                          <Table.Head>Student</Table.Head>
                          <Table.Head>Contact</Table.Head>
                          <Table.Head>Enrollment</Table.Head>
                          <Table.Head>Status</Table.Head>
                          <Table.Head>Outstanding</Table.Head>
                          <Table.Head>Actions</Table.Head>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {students.map((student, index) => (
                          <Table.Row key={index}>
                            <Table.Cell>
                              <div className="font-medium text-gray-900">
                                {student.first_name} {student.last_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {student.student_id || student.id}
                              </div>
                            </Table.Cell>
                            <Table.Cell>
                              <div className="text-sm text-gray-900">
                                <div className="flex items-center mb-1">
                                  <FiMail className="w-4 h-4 mr-2 text-gray-400" />
                                  {student.email}
                                </div>
                                {student.phone && (
                                  <div className="flex items-center">
                                    <FiPhone className="w-4 h-4 mr-2 text-gray-400" />
                                    {student.phone}
                                  </div>
                                )}
                              </div>
                            </Table.Cell>
                            <Table.Cell>
                              <div className="text-gray-900">
                                {student.enrollment_year || 'N/A'}
                              </div>
                              <div className="text-sm text-gray-500">
                                Year {student.current_year || 'N/A'}
                              </div>
                            </Table.Cell>
                            <Table.Cell>
                              <Badge variant={getStatusBadgeVariant(student.status)}>
                                {student.status}
                              </Badge>
                            </Table.Cell>
                            <Table.Cell>
                              <div className="flex items-center">
                                <Badge variant={getOutstandingBadgeVariant(student.outstanding_amount || 0)}>
                                  ${(student.outstanding_amount || 0).toFixed(2)}
                                </Badge>
                                {student.overdue_count > 0 && (
                                  <span className="ml-2 text-xs text-red-600">
                                    {student.overdue_count} overdue
                                  </span>
                                )}
                              </div>
                            </Table.Cell>
                            <Table.Cell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  icon={FiEye}
                                  onClick={() => handleViewStudent(student.id)}
                                >
                                  View
                                </Button>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  icon={FiDollarSign}
                                  onClick={() => handleViewFees(student.id)}
                                >
                                  Fees
                                </Button>
                                <Button
                                  variant="warning"
                                  size="sm"
                                  onClick={() => handleGenerateInvoice(student.id)}
                                  loading={processing}
                                >
                                  Invoice
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
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
                      <p className="text-gray-500">
                        No students match the current filters. Try adjusting your search criteria.
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

export default FinanceStudents;
