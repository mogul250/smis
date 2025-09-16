import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useApi, useAsyncOperation } from '../../hooks/useApi';
import { financeAPI } from '../../services/apiService';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { FiCreditCard, FiDollarSign, FiCalendar, FiEye, FiDownload, FiRefreshCw, FiSearch } from 'react-icons/fi';

const FinancePayments = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedMethod, setSelectedMethod] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [actionMessage, setActionMessage] = useState(null);

  const { data: paymentsData, loading, error, refetch } = useApi(
    () => financeAPI.getPayments({ 
      search: searchTerm, 
      status: selectedStatus, 
      method: selectedMethod,
      ...dateRange
    }),
    [searchTerm, selectedStatus, selectedMethod, dateRange]
  );

  const { loading: processing, execute: processAction } = useAsyncOperation();

  if (!user || user.role !== 'finance') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="error">Access denied. Finance access required.</Alert>
      </div>
    );
  }

  const payments = paymentsData?.payments || [];
  const stats = paymentsData?.stats || {};

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'completed', label: 'Completed' },
    { value: 'pending', label: 'Pending' },
    { value: 'failed', label: 'Failed' },
    { value: 'refunded', label: 'Refunded' }
  ];

  const methodOptions = [
    { value: 'all', label: 'All Methods' },
    { value: 'cash', label: 'Cash' },
    { value: 'card', label: 'Credit/Debit Card' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'online', label: 'Online Payment' },
    { value: 'cheque', label: 'Cheque' }
  ];

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleViewReceipt = (paymentId) => {
    // Open receipt in new window or download
    alert(`View receipt for payment ${paymentId} functionality would be implemented here`);
  };

  const handleRefundPayment = async (paymentId) => {
    try {
      await processAction(() => financeAPI.refundPayment(paymentId));
      setActionMessage({ type: 'success', text: 'Payment refund initiated successfully!' });
      refetch();
      setTimeout(() => setActionMessage(null), 5000);
    } catch (error) {
      setActionMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to initiate refund' 
      });
    }
  };

  const handleVerifyPayment = async (paymentId) => {
    try {
      await processAction(() => financeAPI.verifyPayment(paymentId));
      setActionMessage({ type: 'success', text: 'Payment verified successfully!' });
      refetch();
      setTimeout(() => setActionMessage(null), 5000);
    } catch (error) {
      setActionMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to verify payment' 
      });
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'danger';
      case 'refunded': return 'default';
      default: return 'default';
    }
  };

  const getMethodBadgeVariant = (method) => {
    switch (method) {
      case 'cash': return 'success';
      case 'card': return 'primary';
      case 'bank_transfer': return 'warning';
      case 'online': return 'primary';
      case 'cheque': return 'default';
      default: return 'default';
    }
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
                <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
                <p className="text-gray-600">Track and manage all payment transactions</p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" icon={FiDownload}>
                  Export Report
                </Button>
                <Button variant="outline" icon={FiRefreshCw} onClick={refetch}>
                  Refresh
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
                Failed to load payments: {error}
              </Alert>
            ) : (
              <>
                {/* Payment Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-primary-blue rounded-lg flex items-center justify-center mr-4">
                        <FiDollarSign className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Payments</p>
                        <p className="text-2xl font-bold text-gray-900">
                          ${stats.totalAmount?.toLocaleString() || '0'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {stats.totalCount || 0} transactions
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
                        <p className="text-sm font-medium text-gray-600">Completed</p>
                        <p className="text-2xl font-bold text-gray-900">
                          ${stats.completedAmount?.toLocaleString() || '0'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {stats.completedCount || 0} payments
                        </p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-accent-orange rounded-lg flex items-center justify-center mr-4">
                        <FiCalendar className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Pending</p>
                        <p className="text-2xl font-bold text-gray-900">
                          ${stats.pendingAmount?.toLocaleString() || '0'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {stats.pendingCount || 0} payments
                        </p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-accent-red rounded-lg flex items-center justify-center mr-4">
                        <FiRefreshCw className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Failed/Refunded</p>
                        <p className="text-2xl font-bold text-gray-900">
                          ${stats.failedAmount?.toLocaleString() || '0'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {stats.failedCount || 0} payments
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Filters */}
                <Card>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <Input
                        label="Search"
                        placeholder="Search by student or transaction ID..."
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
                        Payment Method
                      </label>
                      <select
                        value={selectedMethod}
                        onChange={(e) => setSelectedMethod(e.target.value)}
                        className="form-select"
                      >
                        {methodOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={dateRange.startDate}
                        onChange={(e) => handleDateChange('startDate', e.target.value)}
                        className="form-input"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={dateRange.endDate}
                        onChange={(e) => handleDateChange('endDate', e.target.value)}
                        className="form-input"
                      />
                    </div>
                  </div>
                </Card>

                {/* Payments Table */}
                <Card>
                  <Card.Header>
                    <Card.Title>Payment Transactions</Card.Title>
                  </Card.Header>
                  
                  {payments.length > 0 ? (
                    <Table>
                      <Table.Header>
                        <Table.Row>
                          <Table.Head>Transaction ID</Table.Head>
                          <Table.Head>Student</Table.Head>
                          <Table.Head>Fee Type</Table.Head>
                          <Table.Head>Amount</Table.Head>
                          <Table.Head>Method</Table.Head>
                          <Table.Head>Date</Table.Head>
                          <Table.Head>Status</Table.Head>
                          <Table.Head>Actions</Table.Head>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {payments.map((payment, index) => (
                          <Table.Row key={index}>
                            <Table.Cell>
                              <span className="font-mono text-sm">
                                {payment.transaction_id}
                              </span>
                            </Table.Cell>
                            <Table.Cell>
                              <div className="font-medium text-gray-900">
                                {payment.student_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {payment.student_id}
                              </div>
                            </Table.Cell>
                            <Table.Cell>
                              <span className="text-gray-900">{payment.fee_type}</span>
                            </Table.Cell>
                            <Table.Cell>
                              <span className="font-semibold text-gray-900">
                                ${parseFloat(payment.amount).toFixed(2)}
                              </span>
                            </Table.Cell>
                            <Table.Cell>
                              <Badge variant={getMethodBadgeVariant(payment.payment_method)}>
                                {payment.payment_method?.replace('_', ' ')}
                              </Badge>
                            </Table.Cell>
                            <Table.Cell>
                              <div className="text-gray-900">
                                {new Date(payment.payment_date).toLocaleDateString()}
                              </div>
                              <div className="text-sm text-gray-500">
                                {new Date(payment.payment_date).toLocaleTimeString()}
                              </div>
                            </Table.Cell>
                            <Table.Cell>
                              <Badge variant={getStatusBadgeVariant(payment.status)}>
                                {payment.status}
                              </Badge>
                            </Table.Cell>
                            <Table.Cell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  icon={FiEye}
                                  onClick={() => handleViewReceipt(payment.id)}
                                >
                                  Receipt
                                </Button>
                                {payment.status === 'pending' && (
                                  <Button
                                    variant="success"
                                    size="sm"
                                    onClick={() => handleVerifyPayment(payment.id)}
                                    loading={processing}
                                  >
                                    Verify
                                  </Button>
                                )}
                                {payment.status === 'completed' && (
                                  <Button
                                    variant="warning"
                                    size="sm"
                                    onClick={() => handleRefundPayment(payment.id)}
                                    loading={processing}
                                  >
                                    Refund
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
                      <FiCreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Payments Found</h3>
                      <p className="text-gray-500">
                        No payment transactions match the current filters.
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

export default FinancePayments;
