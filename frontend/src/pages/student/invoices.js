import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { studentAPI } from '../../services/api';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { 
  FiFileText, 
  FiDownload, 
  FiEye, 
  FiPrinter, 
  FiCalendar, 
  FiDollarSign,
  FiCreditCard,
  FiCheckCircle,
  FiClock,
  FiAlertCircle
} from 'react-icons/fi';

const StudentInvoices = () => {
  const { user } = useAuth();

  if (!user || user.role !== 'student') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="error">Access denied. Student access required.</Alert>
      </div>
    );
  }

  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDateRange, setSelectedDateRange] = useState('all');

  // Mock data for invoices - in real app this would come from API
  const { data: invoicesData, loading, error } = useApi(() => {
    // Simulate API call for invoices
    return Promise.resolve({
      invoices: [
        {
          id: 'INV-2024-001',
          invoice_number: 'INV-2024-001',
          issue_date: '2024-09-01',
          due_date: '2024-09-30',
          amount: 1500.00,
          status: 'paid',
          description: 'Tuition Fee - Semester 1',
          payment_date: '2024-09-15',
          payment_method: 'Bank Transfer'
        },
        {
          id: 'INV-2024-002',
          invoice_number: 'INV-2024-002',
          issue_date: '2024-10-01',
          due_date: '2024-10-31',
          amount: 1500.00,
          status: 'pending',
          description: 'Tuition Fee - Semester 2',
          payment_date: null,
          payment_method: null
        },
        {
          id: 'INV-2024-003',
          invoice_number: 'INV-2024-003',
          issue_date: '2024-09-15',
          due_date: '2024-09-30',
          amount: 200.00,
          status: 'overdue',
          description: 'Library Fee',
          payment_date: null,
          payment_method: null
        }
      ],
      totalAmount: 3200.00,
      paidAmount: 1500.00,
      pendingAmount: 1700.00
    });
  });

  const invoices = invoicesData?.invoices || [];
  const stats = {
    totalAmount: invoicesData?.totalAmount || 0,
    paidAmount: invoicesData?.paidAmount || 0,
    pendingAmount: invoicesData?.pendingAmount || 0
  };

  // Filter invoices
  const filteredInvoices = invoices.filter(invoice => {
    if (selectedStatus !== 'all' && invoice.status !== selectedStatus) {
      return false;
    }
    
    if (selectedDateRange !== 'all') {
      const issueDate = new Date(invoice.issue_date);
      const now = new Date();
      
      switch (selectedDateRange) {
        case 'this_month':
          return issueDate.getMonth() === now.getMonth() && issueDate.getFullYear() === now.getFullYear();
        case 'last_month':
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
          return issueDate.getMonth() === lastMonth.getMonth() && issueDate.getFullYear() === lastMonth.getFullYear();
        case 'this_year':
          return issueDate.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    }
    
    return true;
  });

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'overdue': return 'danger';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return FiCheckCircle;
      case 'pending': return FiClock;
      case 'overdue': return FiAlertCircle;
      default: return FiFileText;
    }
  };

  const handleViewInvoice = (invoiceId) => {
    // Navigate to invoice detail view
    window.open(`/student/invoices/${invoiceId}`, '_blank');
  };

  const handleDownloadInvoice = (invoiceId) => {
    // Download invoice as PDF
    alert(`Download functionality for invoice ${invoiceId} would be implemented here`);
  };

  const handlePrintInvoice = (invoiceId) => {
    // Print invoice
    alert(`Print functionality for invoice ${invoiceId} would be implemented here`);
  };

  const handlePayInvoice = (invoiceId) => {
    // Navigate to payment page
    alert(`Payment functionality for invoice ${invoiceId} would be implemented here`);
  };

  const invoiceColumns = [
    {
      key: 'invoice_number',
      label: 'Invoice #',
      render: (value, invoice) => (
        <div className="flex items-center space-x-2">
          <FiFileText className="w-4 h-4 text-gray-400" />
          <span className="font-medium text-blue-600">{value}</span>
        </div>
      )
    },
    {
      key: 'description',
      label: 'Description',
      render: (value) => (
        <div className="max-w-xs">
          <p className="text-sm font-medium text-gray-900 truncate">{value}</p>
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
      key: 'amount',
      label: 'Amount',
      render: (value) => (
        <div className="flex items-center space-x-1">
          <FiDollarSign className="w-4 h-4 text-gray-400" />
          <span className="font-semibold text-gray-900">
            ${value.toFixed(2)}
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
            onClick={() => handleViewInvoice(invoice.id)}
            className="p-1"
          >
            <FiEye className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownloadInvoice(invoice.id)}
            className="p-1"
          >
            <FiDownload className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePrintInvoice(invoice.id)}
            className="p-1"
          >
            <FiPrinter className="w-4 h-4" />
          </Button>
          {invoice.status !== 'paid' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handlePayInvoice(invoice.id)}
              className="p-1"
            >
              <FiCreditCard className="w-4 h-4" />
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Sidebar />
      <main className="lg:pl-64 pt-16 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Invoices</h1>
                <p className="text-gray-600">View and manage your invoices and payments</p>
              </div>
              <div className="flex space-x-3">
                <Button variant="outline" icon={FiDownload}>
                  Export All
                </Button>
                <Button variant="outline" icon={FiPrinter}>
                  Print Summary
                </Button>
              </div>
            </div>

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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Amount</p>
                        <p className="text-2xl font-bold text-gray-900">
                          ${stats.totalAmount.toFixed(2)}
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
                        <p className="text-sm font-medium text-gray-600">Paid Amount</p>
                        <p className="text-2xl font-bold text-green-600">
                          ${stats.paidAmount.toFixed(2)}
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
                          ${stats.pendingAmount.toFixed(2)}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <FiClock className="w-6 h-6 text-orange-600" />
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Filters */}
                <Card className="p-6">
                  <div className="flex flex-wrap gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All Statuses</option>
                        <option value="paid">Paid</option>
                        <option value="pending">Pending</option>
                        <option value="overdue">Overdue</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date Range
                      </label>
                      <select
                        value={selectedDateRange}
                        onChange={(e) => setSelectedDateRange(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All Time</option>
                        <option value="this_month">This Month</option>
                        <option value="last_month">Last Month</option>
                        <option value="this_year">This Year</option>
                      </select>
                    </div>
                  </div>
                </Card>

                {/* Invoices Table */}
                <Card>
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Invoice History ({filteredInvoices.length})
                    </h3>
                  </div>
                  
                  {filteredInvoices.length > 0 ? (
                    <Table
                      data={filteredInvoices}
                      columns={invoiceColumns}
                      className="w-full"
                    />
                  ) : (
                    <div className="p-12 text-center">
                      <FiFileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No invoices found for the selected filters.</p>
                    </div>
                  )}
                </Card>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentInvoices;
