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
import Modal from '../../components/common/Modal';
import { 
  FiFileText, 
  FiPlus, 
  FiEdit, 
  FiEye, 
  FiSearch, 
  FiDownload, 
  FiSend,
  FiPrinter,
  FiCalendar,
  FiDollarSign,
  FiUser,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiTrash2
} from 'react-icons/fi';

const FinanceInvoices = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDateRange, setSelectedDateRange] = useState('all');
  const [actionMessage, setActionMessage] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const { data: invoicesData, loading, error, refetch } = useApi(
    () => financeAPI.getAllInvoices({ 
      search: searchTerm, 
      status: selectedStatus,
      dateRange: selectedDateRange
    }),
    [searchTerm, selectedStatus, selectedDateRange]
  );

  const { loading: processing, execute: processAction } = useAsyncOperation();

  if (!user || user.role !== 'finance') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="error">Access denied. Finance access required.</Alert>
      </div>
    );
  }

  const invoices = invoicesData?.invoices || [];
  const stats = invoicesData?.stats || {};

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'paid', label: 'Paid' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const dateRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'this_week', label: 'This Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'this_year', label: 'This Year' }
  ];

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'paid': return 'success';
      case 'sent': return 'info';
      case 'draft': return 'secondary';
      case 'overdue': return 'danger';
      case 'cancelled': return 'warning';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return FiCheckCircle;
      case 'sent': return FiSend;
      case 'draft': return FiEdit;
      case 'overdue': return FiAlertCircle;
      case 'cancelled': return FiTrash2;
      default: return FiFileText;
    }
  };

  const handleCreateInvoice = () => {
    setShowCreateModal(true);
  };

  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setShowViewModal(true);
  };

  const handleSendInvoice = async (invoiceId) => {
    try {
      await processAction(async () => {
        await financeAPI.sendInvoice(invoiceId);
        setActionMessage({ type: 'success', text: 'Invoice sent successfully!' });
        refetch();
      });
    } catch (error) {
      setActionMessage({ type: 'error', text: 'Failed to send invoice' });
    }
  };

  const handleDownloadInvoice = async (invoiceId) => {
    try {
      await processAction(async () => {
        const blob = await financeAPI.downloadInvoice(invoiceId);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${invoiceId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      });
    } catch (error) {
      setActionMessage({ type: 'error', text: 'Failed to download invoice' });
    }
  };

  const handlePrintInvoice = (invoiceId) => {
    window.open(`/finance/invoices/${invoiceId}/print`, '_blank');
  };

  const handleDeleteInvoice = async (invoiceId) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    
    try {
      await processAction(async () => {
        await financeAPI.deleteInvoice(invoiceId);
        setActionMessage({ type: 'success', text: 'Invoice deleted successfully!' });
        refetch();
      });
    } catch (error) {
      setActionMessage({ type: 'error', text: 'Failed to delete invoice' });
    }
  };

  const invoiceColumns = [
    {
      key: 'invoice_number',
      label: 'Invoice #',
      render: (value, invoice) => (
        <div className="flex items-center space-x-2">
          <FiFileText className="w-4 h-4 text-gray-400" />
          <button
            onClick={() => handleViewInvoice(invoice)}
            className="font-medium text-blue-600 hover:text-blue-800"
          >
            {value}
          </button>
        </div>
      )
    },
    {
      key: 'student_name',
      label: 'Student',
      render: (value, invoice) => (
        <div className="flex items-center space-x-2">
          <FiUser className="w-4 h-4 text-gray-400" />
          <div>
            <p className="font-medium text-gray-900">{value}</p>
            <p className="text-sm text-gray-500">{invoice.student_email}</p>
          </div>
        </div>
      )
    },
    {
      key: 'issue_date',
      label: 'Issue Date',
      render: (value) => (
        <div className="flex items-center space-x-1">
          <FiCalendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">
            {new Date(value).toLocaleDateString()}
          </span>
        </div>
      )
    },
    {
      key: 'due_date',
      label: 'Due Date',
      render: (value) => (
        <div className="flex items-center space-x-1">
          <FiCalendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">
            {new Date(value).toLocaleDateString()}
          </span>
        </div>
      )
    },
    {
      key: 'total_amount',
      label: 'Amount',
      render: (value) => (
        <div className="flex items-center space-x-1">
          <FiDollarSign className="w-4 h-4 text-gray-400" />
          <span className="font-semibold text-gray-900">
            ${value?.toFixed(2) || '0.00'}
          </span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => {
        const Icon = getStatusIcon(value);
        return (
          <Badge variant={getStatusBadgeVariant(value)} className="flex items-center space-x-1">
            <Icon className="w-3 h-3" />
            <span className="capitalize">{value}</span>
          </Badge>
        );
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, invoice) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewInvoice(invoice)}
            className="p-1"
            title="View Invoice"
          >
            <FiEye className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownloadInvoice(invoice.id)}
            className="p-1"
            title="Download PDF"
          >
            <FiDownload className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePrintInvoice(invoice.id)}
            className="p-1"
            title="Print Invoice"
          >
            <FiPrinter className="w-4 h-4" />
          </Button>
          {invoice.status === 'draft' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleSendInvoice(invoice.id)}
              className="p-1"
              title="Send Invoice"
            >
              <FiSend className="w-4 h-4" />
            </Button>
          )}
          {invoice.status === 'draft' && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleDeleteInvoice(invoice.id)}
              className="p-1"
              title="Delete Invoice"
            >
              <FiTrash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      )
    }
  ];

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
                <h1 className="text-2xl font-bold text-gray-900">Invoice Management</h1>
                <p className="text-gray-600">Create, manage, and track student invoices</p>
              </div>
              <div className="flex space-x-3">
                <Button variant="outline" icon={FiDownload}>
                  Export All
                </Button>
                <Button variant="primary" icon={FiPlus} onClick={handleCreateInvoice}>
                  Create Invoice
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
                Failed to load invoices: {error}
              </Alert>
            ) : (
              <>
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Invoices</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {stats.totalInvoices || 0}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FiFileText className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Paid Invoices</p>
                        <p className="text-2xl font-bold text-green-600">
                          {stats.paidInvoices || 0}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <FiCheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Pending Amount</p>
                        <p className="text-2xl font-bold text-orange-600">
                          ${(stats.pendingAmount || 0).toFixed(2)}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <FiClock className="w-6 h-6 text-orange-600" />
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Overdue</p>
                        <p className="text-2xl font-bold text-red-600">
                          {stats.overdueInvoices || 0}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                        <FiAlertCircle className="w-6 h-6 text-red-600" />
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Filters */}
                <Card className="p-6">
                  <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-64">
                      <Input
                        icon={FiSearch}
                        placeholder="Search invoices..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>

                    <div>
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {statusOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <select
                        value={selectedDateRange}
                        onChange={(e) => setSelectedDateRange(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {dateRangeOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </Card>

                {/* Invoices Table */}
                <Card>
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Invoices ({invoices.length})
                    </h3>
                  </div>
                  
                  {invoices.length > 0 ? (
                    <Table
                      data={invoices}
                      columns={invoiceColumns}
                      className="w-full"
                    />
                  ) : (
                    <div className="p-12 text-center">
                      <FiFileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No invoices found.</p>
                      <Button 
                        variant="primary" 
                        className="mt-4"
                        onClick={handleCreateInvoice}
                      >
                        Create First Invoice
                      </Button>
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

export default FinanceInvoices;
