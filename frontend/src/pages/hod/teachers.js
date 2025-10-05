import React, { useState } from 'react';
import Head from 'next/head';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { hodAPI } from '../../services/api';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Input from '../../components/common/Input';
import { 
  FiUsers, 
  FiSearch, 
  FiFilter, 
  FiDownload, 
  FiEye, 
  FiMail,
  FiPhone,
  FiCalendar,
  FiBook,
  FiRefreshCw
} from 'react-icons/fi';

const TeachersPage = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch teachers data
  const { data: teachers, loading, error, refetch } = useApi(hodAPI.getDepartmentTeachers);

  // Check authorization
  if (!user || user.role !== 'hod') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="error">Access denied. HOD access required.</Alert>
      </div>
    );
  }

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('Error refreshing teachers:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Filter teachers based on search and status
  const filteredTeachers = teachers?.filter(teacher => {
    const matchesSearch = !searchTerm || 
      `${teacher.first_name} ${teacher.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.staff_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || teacher.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  // Get status badge variant
  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge variant="success" size="sm">Active</Badge>;
      case 'inactive':
        return <Badge variant="warning" size="sm">Inactive</Badge>;
      case 'suspended':
        return <Badge variant="danger" size="sm">Suspended</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <>
      <Head>
        <title>Teachers Management - HOD Dashboard</title>
        <meta name="description" content="Manage department teachers and staff" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Teachers Management</h1>
                  <p className="text-gray-600 mt-1">
                    Manage and oversee your department teachers
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRefresh}
                    loading={refreshing}
                    icon={FiRefreshCw}
                  >
                    Refresh
                  </Button>
                  <Button variant="outline" size="sm" icon={FiDownload}>
                    Export
                  </Button>
                </div>
              </div>

              {/* Error handling */}
              {error && (
                <Alert variant="error" className="mb-6">
                  Error loading teachers: {error.message}
                </Alert>
              )}

              {/* Filters and Search */}
              <Card className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search teachers by name, email, or staff ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      icon={FiSearch}
                    />
                  </div>
                  <div className="sm:w-48">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary-light focus:border-primary-light sm:text-sm px-3 py-2"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>
              </Card>

              {/* Teachers Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-blue-50">
                      <FiUsers className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Teachers</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {loading ? '...' : teachers?.length || 0}
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-green-50">
                      <FiUsers className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Active</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {loading ? '...' : teachers?.filter(t => t.status === 'active').length || 0}
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-yellow-50">
                      <FiUsers className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Inactive</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {loading ? '...' : teachers?.filter(t => t.status === 'inactive').length || 0}
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-red-50">
                      <FiUsers className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Suspended</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {loading ? '...' : teachers?.filter(t => t.status === 'suspended').length || 0}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Teachers Table */}
              <Card className="overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Department Teachers</h3>
                    <span className="text-sm text-gray-500">
                      {filteredTeachers.length} of {teachers?.length || 0} teachers
                    </span>
                  </div>
                </div>

                {loading ? (
                  <div className="flex justify-center py-12">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : filteredTeachers.length > 0 ? (
                  <Table>
                    <Table.Header>
                      <Table.Row>
                        <Table.Head>Teacher</Table.Head>
                        <Table.Head>Staff ID</Table.Head>
                        <Table.Head>Contact</Table.Head>
                        <Table.Head>Hire Date</Table.Head>
                        <Table.Head>Status</Table.Head>
                        <Table.Head>Actions</Table.Head>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {filteredTeachers.map((teacher) => (
                        <Table.Row key={teacher.id}>
                          <Table.Cell>
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <FiUsers className="w-5 h-5 text-blue-600" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {teacher.first_name} {teacher.last_name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {teacher.email}
                                </div>
                              </div>
                            </div>
                          </Table.Cell>
                          <Table.Cell>
                            <span className="text-sm text-gray-900">
                              {teacher.staff_id || 'N/A'}
                            </span>
                          </Table.Cell>
                          <Table.Cell>
                            <div className="text-sm text-gray-900">
                              {teacher.phone && (
                                <div className="flex items-center mb-1">
                                  <FiPhone className="w-4 h-4 text-gray-400 mr-1" />
                                  {teacher.phone}
                                </div>
                              )}
                              <div className="flex items-center">
                                <FiMail className="w-4 h-4 text-gray-400 mr-1" />
                                {teacher.email}
                              </div>
                            </div>
                          </Table.Cell>
                          <Table.Cell>
                            <div className="flex items-center text-sm text-gray-900">
                              <FiCalendar className="w-4 h-4 text-gray-400 mr-1" />
                              {formatDate(teacher.hire_date)}
                            </div>
                          </Table.Cell>
                          <Table.Cell>
                            {getStatusBadge(teacher.status)}
                          </Table.Cell>
                          <Table.Cell>
                            <div className="flex items-center space-x-2">
                              <Button variant="outline" size="sm" icon={FiEye}>
                                View
                              </Button>
                            </div>
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <FiUsers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No teachers found</h3>
                    <p className="text-gray-500">
                      {searchTerm || statusFilter !== 'all' 
                        ? 'Try adjusting your search or filter criteria.'
                        : 'No teachers are assigned to your department yet.'
                      }
                    </p>
                  </div>
                )}
              </Card>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default TeachersPage;
