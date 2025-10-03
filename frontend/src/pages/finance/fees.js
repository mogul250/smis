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
import { FiDollarSign, FiPlus, FiEdit, FiEye, FiSearch, FiDownload, FiCreditCard } from 'react-icons/fi';

const FinanceFees = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedFeeType, setSelectedFeeType] = useState('all');
  const [actionMessage, setActionMessage] = useState(null);

  const { data: feesData, loading, error, refetch } = useApi(
    () => financeAPI.getAllFees({ 
      search: searchTerm, 
      status: selectedStatus, 
      feeType: selectedFeeType 
    }),
    [searchTerm, selectedStatus, selectedFeeType]
  );

  const { loading: processing, execute: processAction } = useAsyncOperation();

  if (!user || user.role !== 'finance') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="error">Access denied. Finance access required.</Alert>
      </div>
    );
  }

  const fees = feesData?.fees || [];
  const stats = feesData?.stats || {};

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'paid', label: 'Paid' },
    { value: 'unpaid', label: 'Unpaid' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'partial', label: 'Partial Payment' }
  ];

  const feeTypeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'tuition', label: 'Tuition' },
    { value: 'library', label: 'Library' },
    { value: 'lab', label: 'Laboratory' },
    { value: 'hostel', label: 'Hostel' },
    { value: 'transport', label: 'Transport' },
    { value: 'exam', label: 'Examination' }
  ];

  const handleCreateFee = () => {
    // Navigate to create fee page or open modal
    alert('Create fee functionality would be implemented here');
  };

  const handleEditFee = (feeId) => {
    // Navigate to edit fee page
    alert(`Edit fee ${feeId} functionality would be implemented here`);
  };

  const handleViewDetails = (feeId) => {
    // Navigate to fee details page
    alert(`View fee ${feeId} details functionality would be implemented here`);
  };

  const handleSendReminder = async (studentId, feeId) => {
    try {
      await processAction(() => financeAPI.sendPaymentReminder({ studentId, feeId }));
      setActionMessage({ type: 'success', text: 'Payment reminder sent successfully!' });
      setTimeout(() => setActionMessage(null), 5000);
    } catch (error) {
      setActionMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to send reminder' 
      });
    }
  };

  const getStatusBadgeVariant = (status, dueDate) => {
    if (status === 'paid') return 'success';
    if (status === 'partial') return 'warning';
    if (status === 'unpaid' && new Date(dueDate) < new Date()) return 'danger';
    return 'warning';
  };

  const getStatusText = (status, dueDate) => {
    if (status === 'paid') return 'Paid';
    if (status === 'partial') return 'Partial';
    if (status === 'unpaid' && new Date(dueDate) < new Date()) return 'Overdue';
    return 'Pending';
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
                <h1 className="text-2xl font-bold text-gray-900">Fee Management</h1>
                <p className="text-gray-600">Manage student fees and payment tracking</p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" icon={FiDownload}>
                  Export Report
                </Button>
                <Button variant="primary" icon={FiPlus} onClick={handleCreateFee}>
                  Create Fee
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
                Failed to load fees: {error}
              </Alert>
            ) : (
              <>
                {/* Fee Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-primary-blue rounded-lg flex items-center justify-center mr-4">
                        <FiDollarSign className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                        <p className="text-2xl font-bold text-gray-900">
                          ${stats.totalRevenue?.toLocaleString() || '0'}
                        </p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-accent-green rounded-lg flex items-center justify-center mr-4">
                        <FiCreditCard className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Collected</p>
                        <p className="text-2xl font-bold text-gray-900">
                          ${stats.collectedAmount?.toLocaleString() || '0'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {stats.collectionRate ? `${stats.collectionRate.toFixed(1)}%` : '0%'} rate
                        </p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-accent-orange rounded-lg flex items-center justify-center mr-4">
                        <FiDollarSign className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Outstanding</p>
                        <p className="text-2xl font-bold text-gray-900">
                          ${stats.outstandingAmount?.toLocaleString() || '0'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {stats.outstandingCount || 0} students
                        </p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-accent-red rounded-lg flex items-center justify-center mr-4">
                        <FiDollarSign className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Overdue</p>
                        <p className="text-2xl font-bold text-gray-900">
                          ${stats.overdueAmount?.toLocaleString() || '0'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {stats.overdueCount || 0} fees
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
                        placeholder="Search by student name or ID..."
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
                        Fee Type
                      </label>
                      <select
                        value={selectedFeeType}
                        onChange={(e) => setSelectedFeeType(e.target.value)}
                        className="form-select"
                      >
                        {feeTypeOptions.map(option => (
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

                {/* Fees Table */}
                <Card>
                  <Card.Header>
                    <Card.Title>Fee Records</Card.Title>
                  </Card.Header>
                  
                  {fees.length > 0 ? (
                    <Table>
                      <Table.Header>
                        <Table.Row>
                          <Table.Head>Student</Table.Head>
                          <Table.Head>Fee Type</Table.Head>
                          <Table.Head>Amount</Table.Head>
                          <Table.Head>Due Date</Table.Head>
                          <Table.Head>Status</Table.Head>
                          <Table.Head>Paid Amount</Table.Head>
                          <Table.Head>Actions</Table.Head>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {fees.map((fee, index) => (
                          <Table.Row key={index}>
                            <Table.Cell>
                              <div className="font-medium text-gray-900">
                                {fee.student_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {fee.student_id}
                              </div>
                            </Table.Cell>
                            <Table.Cell>
                              <div className="font-medium text-gray-900">
                                {fee.fee_type}
                              </div>
                              <div className="text-sm text-gray-500">
                                {fee.description}
                              </div>
                            </Table.Cell>
                            <Table.Cell>
                              <span className="font-semibold text-gray-900">
                                ${parseFloat(fee.amount).toFixed(2)}
                              </span>
                            </Table.Cell>
                            <Table.Cell>
                              <div className="text-gray-900">
                                {new Date(fee.due_date).toLocaleDateString()}
                              </div>
                              {new Date(fee.due_date) < new Date() && fee.status === 'unpaid' && (
                                <div className="text-xs text-red-600">
                                  {Math.ceil((new Date() - new Date(fee.due_date)) / (1000 * 60 * 60 * 24))} days overdue
                                </div>
                              )}
                            </Table.Cell>
                            <Table.Cell>
                              <Badge variant={getStatusBadgeVariant(fee.status, fee.due_date)}>
                                {getStatusText(fee.status, fee.due_date)}
                              </Badge>
                            </Table.Cell>
                            <Table.Cell>
                              <span className="font-medium text-gray-900">
                                ${parseFloat(fee.paid_amount || 0).toFixed(2)}
                              </span>
                              {fee.status === 'partial' && (
                                <div className="text-xs text-gray-500">
                                  ${(parseFloat(fee.amount) - parseFloat(fee.paid_amount || 0)).toFixed(2)} remaining
                                </div>
                              )}
                            </Table.Cell>
                            <Table.Cell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  icon={FiEye}
                                  onClick={() => handleViewDetails(fee.id)}
                                >
                                  View
                                </Button>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  icon={FiEdit}
                                  onClick={() => handleEditFee(fee.id)}
                                >
                                  Edit
                                </Button>
                                {fee.status !== 'paid' && (
                                  <Button
                                    variant="warning"
                                    size="sm"
                                    onClick={() => handleSendReminder(fee.student_id, fee.id)}
                                    loading={processing}
                                  >
                                    Remind
                                  </Button>
                                )}
                              </div>
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <FiDollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Fees Found</h3>
                      <p className="text-gray-500">
                        No fees match the current filters. Try adjusting your search criteria.
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

export default FinanceFees;
