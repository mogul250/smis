import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useApi, useAsyncOperation } from '../../hooks/useApi';
import { hodAPI } from '../../services/apiService';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { FiCheck, FiX, FiClock, FiEye, FiFileText, FiUser, FiCalendar } from 'react-icons/fi';

const HODApprovals = () => {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [actionMessage, setActionMessage] = useState(null);

  const { data: approvals, loading, error, refetch } = useApi(
    () => hodAPI.getApprovals({ type: selectedType, status: selectedStatus }),
    [selectedType, selectedStatus]
  );

  const { loading: processing, execute: processApproval } = useAsyncOperation();

  if (!user || user.role !== 'hod') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="error">Access denied. HOD access required.</Alert>
      </div>
    );
  }

  const handleApproval = async (approvalId, action, comments = '') => {
    try {
      await processApproval(() => 
        hodAPI.processApproval({
          approvalId,
          action, // 'approve' or 'reject'
          comments
        })
      );

      setActionMessage({ 
        type: 'success', 
        text: `Request ${action}d successfully!` 
      });
      
      refetch();
      setTimeout(() => setActionMessage(null), 5000);
    } catch (error) {
      setActionMessage({ 
        type: 'error', 
        text: error.response?.data?.message || `Failed to ${action} request` 
      });
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'danger';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const getTypeBadgeVariant = (type) => {
    switch (type) {
      case 'leave': return 'primary';
      case 'course_change': return 'warning';
      case 'grade_change': return 'danger';
      case 'enrollment': return 'success';
      default: return 'default';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'leave': return FiCalendar;
      case 'course_change': return FiFileText;
      case 'grade_change': return FiFileText;
      case 'enrollment': return FiUser;
      default: return FiFileText;
    }
  };

  const approvalTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'leave', label: 'Leave Requests' },
    { value: 'course_change', label: 'Course Changes' },
    { value: 'grade_change', label: 'Grade Changes' },
    { value: 'enrollment', label: 'Enrollment Requests' }
  ];

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'all', label: 'All Status' }
  ];

  // Calculate approval statistics
  const approvalStats = React.useMemo(() => {
    if (!approvals) return { total: 0, pending: 0, approved: 0, rejected: 0 };
    
    return {
      total: approvals.length,
      pending: approvals.filter(a => a.status === 'pending').length,
      approved: approvals.filter(a => a.status === 'approved').length,
      rejected: approvals.filter(a => a.status === 'rejected').length
    };
  }, [approvals]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Page Header */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Approval Management</h1>
              <p className="text-gray-600">Review and process departmental approval requests</p>
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

            {/* Filters */}
            <Card>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Request Type
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="form-select"
                  >
                    {approvalTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
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
                    {statusOptions.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>

            {loading ? (
              <Card className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </Card>
            ) : error ? (
              <Alert variant="error">
                Failed to load approvals: {error}
              </Alert>
            ) : (
              <>
                {/* Approval Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gray-500 rounded-lg flex items-center justify-center mr-4">
                        <FiFileText className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Requests</p>
                        <p className="text-2xl font-bold text-gray-900">{approvalStats.total}</p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-accent-orange rounded-lg flex items-center justify-center mr-4">
                        <FiClock className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Pending</p>
                        <p className="text-2xl font-bold text-gray-900">{approvalStats.pending}</p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-accent-green rounded-lg flex items-center justify-center mr-4">
                        <FiCheck className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Approved</p>
                        <p className="text-2xl font-bold text-gray-900">{approvalStats.approved}</p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-accent-red rounded-lg flex items-center justify-center mr-4">
                        <FiX className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Rejected</p>
                        <p className="text-2xl font-bold text-gray-900">{approvalStats.rejected}</p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Approvals Table */}
                <Card>
                  <Card.Header>
                    <Card.Title>Approval Requests</Card.Title>
                  </Card.Header>
                  
                  {approvals && approvals.length > 0 ? (
                    <Table>
                      <Table.Header>
                        <Table.Row>
                          <Table.Head>Request ID</Table.Head>
                          <Table.Head>Type</Table.Head>
                          <Table.Head>Requester</Table.Head>
                          <Table.Head>Subject</Table.Head>
                          <Table.Head>Date</Table.Head>
                          <Table.Head>Status</Table.Head>
                          <Table.Head>Actions</Table.Head>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {approvals.map((approval, index) => {
                          const TypeIcon = getTypeIcon(approval.type);
                          
                          return (
                            <Table.Row key={index}>
                              <Table.Cell>
                                <span className="font-mono text-sm">
                                  #{approval.id}
                                </span>
                              </Table.Cell>
                              <Table.Cell>
                                <div className="flex items-center space-x-2">
                                  <TypeIcon className="w-4 h-4 text-gray-500" />
                                  <Badge variant={getTypeBadgeVariant(approval.type)}>
                                    {approval.type.replace('_', ' ')}
                                  </Badge>
                                </div>
                              </Table.Cell>
                              <Table.Cell>
                                <div className="font-medium text-gray-900">
                                  {approval.requester_name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {approval.requester_role}
                                </div>
                              </Table.Cell>
                              <Table.Cell>
                                <div className="font-medium text-gray-900">
                                  {approval.subject}
                                </div>
                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                  {approval.description}
                                </div>
                              </Table.Cell>
                              <Table.Cell>
                                <div className="text-gray-900">
                                  {new Date(approval.created_at).toLocaleDateString()}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {new Date(approval.created_at).toLocaleTimeString()}
                                </div>
                              </Table.Cell>
                              <Table.Cell>
                                <Badge variant={getStatusBadgeVariant(approval.status)}>
                                  {approval.status}
                                </Badge>
                              </Table.Cell>
                              <Table.Cell>
                                <div className="flex space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    icon={FiEye}
                                  >
                                    View
                                  </Button>
                                  {approval.status === 'pending' && (
                                    <>
                                      <Button
                                        variant="success"
                                        size="sm"
                                        icon={FiCheck}
                                        onClick={() => handleApproval(approval.id, 'approve')}
                                        loading={processing}
                                      >
                                        Approve
                                      </Button>
                                      <Button
                                        variant="danger"
                                        size="sm"
                                        icon={FiX}
                                        onClick={() => handleApproval(approval.id, 'reject')}
                                        loading={processing}
                                      >
                                        Reject
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </Table.Cell>
                            </Table.Row>
                          );
                        })}
                      </Table.Body>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <FiFileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Approval Requests</h3>
                      <p className="text-gray-500">
                        {selectedStatus === 'pending' 
                          ? 'No pending approval requests at this time.'
                          : 'No approval requests found for the selected filters.'
                        }
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

export default HODApprovals;
