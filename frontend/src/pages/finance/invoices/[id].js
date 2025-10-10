import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../hooks/useAuth';
import { useApi, useAsyncOperation } from '../../../hooks/useApi';
import { financeAPI } from '../../../services/api';
import Header from '../../../components/common/Header';
import Sidebar from '../../../components/common/Sidebar';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Alert } from '../../../components/ui/alert';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import Badge from '../../../components/common/Badge';
import { 
  FiFileText, 
  FiUser, 
  FiCalendar, 
  FiDollarSign,
  FiArrowLeft,
  FiDownload,
  FiPrinter,
  FiSend,
  FiEdit,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiMail,
  FiPhone,
  FiMapPin
} from 'react-icons/fi';

const InvoiceView = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [actionMessage, setActionMessage] = useState(null);

  // Fetch invoice details
  const { data: invoiceData, loading, error, refetch } = useApi(
    () => id ? financeAPI.getInvoice(id) : null,
    [id],
    { fallbackData: null }
  );

  const { loading: processing, execute: processAction } = useAsyncOperation();

  if (!user || user.role !== 'finance') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive">Access denied. Finance access required.</Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6 lg:ml-64 pt-16">
            <div className="max-w-5xl mx-auto">
              <Card className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </Card>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !invoiceData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6 lg:ml-64 pt-16">
            <div className="max-w-5xl mx-auto">
              <Alert variant="destructive">
                Failed to load invoice details. {error || 'Invoice not found.'}
              </Alert>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const invoice = invoiceData;

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
      case 'cancelled': return FiAlertCircle;
      default: return FiFileText;
    }
  };

  const handleSendInvoice = async () => {
    try {
      await processAction(async () => {
        await financeAPI.sendInvoice(id);
        setActionMessage({ type: 'success', text: 'Invoice sent successfully!' });
        refetch();
      });
    } catch (error) {
      setActionMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to send invoice' 
      });
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      await processAction(async () => {
        const blob = await financeAPI.downloadInvoice(id);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${invoice.invoice_number}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      });
    } catch (error) {
      setActionMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to download invoice' 
      });
    }
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  const handleEditInvoice = () => {
    router.push(`/finance/invoices/edit/${id}`);
  };

  const handleMarkAsPaid = async () => {
    try {
      await processAction(async () => {
        await financeAPI.markInvoicePaid(id, {
          paymentMethod: 'Manual',
          transactionId: `TXN-${Date.now()}`,
          paidAmount: invoice.total_amount,
          paymentDate: new Date().toISOString().split('T')[0]
        });
        setActionMessage({ type: 'success', text: 'Invoice marked as paid!' });
        refetch();
      });
    } catch (error) {
      setActionMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to mark invoice as paid' 
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const StatusIcon = getStatusIcon(invoice.status);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 lg:ml-64 pt-16">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex items-center space-x-2"
                >
                  <FiArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Invoice Details</h1>
                  <p className="text-gray-600">View and manage invoice information</p>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={handleDownloadInvoice}
                  disabled={processing}
                  className="flex items-center space-x-2"
                >
                  <FiDownload className="w-4 h-4" />
                  <span>Download</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handlePrintInvoice}
                  className="flex items-center space-x-2"
                >
                  <FiPrinter className="w-4 h-4" />
                  <span>Print</span>
                </Button>
                {invoice.status === 'draft' && (
                  <Button
                    variant="primary"
                    onClick={handleSendInvoice}
                    disabled={processing}
                    className="flex items-center space-x-2"
                  >
                    <FiSend className="w-4 h-4" />
                    <span>Send Invoice</span>
                  </Button>
                )}
                {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                  <Button
                    variant="success"
                    onClick={handleMarkAsPaid}
                    disabled={processing}
                    className="flex items-center space-x-2"
                  >
                    <FiCheckCircle className="w-4 h-4" />
                    <span>Mark as Paid</span>
                  </Button>
                )}
                {invoice.status === 'draft' && (
                  <Button
                    variant="outline"
                    onClick={handleEditInvoice}
                    className="flex items-center space-x-2"
                  >
                    <FiEdit className="w-4 h-4" />
                    <span>Edit</span>
                  </Button>
                )}
              </div>
            </div>

            {actionMessage && (
              <Alert variant={actionMessage.type === 'error' ? 'destructive' : 'default'}>
                {actionMessage.text}
              </Alert>
            )}

            {/* Invoice Header Card */}
            <Card>
              <CardContent className="p-8">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h2>
                    <div className="flex items-center space-x-2">
                      <FiFileText className="w-5 h-5 text-gray-400" />
                      <span className="text-xl font-semibold text-gray-700">
                        {invoice.invoice_number}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={getStatusBadgeVariant(invoice.status)} 
                      className="flex items-center space-x-1 mb-4"
                    >
                      <StatusIcon className="w-4 h-4" />
                      <span className="capitalize">{invoice.status}</span>
                    </Badge>
                    <div className="text-3xl font-bold text-gray-900">
                      {formatCurrency(invoice.total_amount)}
                    </div>
                    {invoice.paid_amount > 0 && invoice.paid_amount < invoice.total_amount && (
                      <div className="text-sm text-gray-500">
                        Paid: {formatCurrency(invoice.paid_amount)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Invoice Dates */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <FiCalendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-600">Issue Date</span>
                    </div>
                    <p className="text-gray-900">{formatDate(invoice.issue_date)}</p>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <FiCalendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-600">Due Date</span>
                    </div>
                    <p className="text-gray-900">{formatDate(invoice.due_date)}</p>
                  </div>
                  {invoice.payment_date && (
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <FiCheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium text-gray-600">Payment Date</span>
                      </div>
                      <p className="text-gray-900">{formatDate(invoice.payment_date)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Student Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FiUser className="w-5 h-5" />
                  <span>Bill To</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {invoice.student?.first_name} {invoice.student?.last_name}
                    </h3>
                    <div className="space-y-2 text-gray-600">
                      <div className="flex items-center space-x-2">
                        <FiUser className="w-4 h-4" />
                        <span>Student ID: {invoice.student?.student_id}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FiMail className="w-4 h-4" />
                        <span>{invoice.student?.email}</span>
                      </div>
                      {invoice.student?.phone && (
                        <div className="flex items-center space-x-2">
                          <FiPhone className="w-4 h-4" />
                          <span>{invoice.student?.phone}</span>
                        </div>
                      )}
                      {invoice.student?.address && (
                        <div className="flex items-center space-x-2">
                          <FiMapPin className="w-4 h-4" />
                          <span>{invoice.student?.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Academic Information</h4>
                    <div className="space-y-1 text-gray-600">
                      <p>Department: {invoice.student?.department || 'N/A'}</p>
                      <p>Year: {invoice.student?.current_year || 'N/A'}</p>
                      <p>Status: {invoice.student?.status || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Invoice Items */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Description</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-900">Quantity</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-900">Unit Price</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-900">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items?.map((item, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-4 px-4 text-gray-900">{item.description}</td>
                          <td className="py-4 px-4 text-center text-gray-600">{item.quantity || 1}</td>
                          <td className="py-4 px-4 text-right text-gray-600">
                            {formatCurrency(item.amount)}
                          </td>
                          <td className="py-4 px-4 text-right font-medium text-gray-900">
                            {formatCurrency(item.amount * (item.quantity || 1))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gray-300">
                        <td colSpan="3" className="py-4 px-4 text-right font-semibold text-gray-900">
                          Total Amount:
                        </td>
                        <td className="py-4 px-4 text-right text-xl font-bold text-gray-900">
                          {formatCurrency(invoice.total_amount)}
                        </td>
                      </tr>
                      {invoice.paid_amount > 0 && (
                        <>
                          <tr>
                            <td colSpan="3" className="py-2 px-4 text-right font-medium text-gray-600">
                              Amount Paid:
                            </td>
                            <td className="py-2 px-4 text-right font-medium text-green-600">
                              -{formatCurrency(invoice.paid_amount)}
                            </td>
                          </tr>
                          <tr>
                            <td colSpan="3" className="py-2 px-4 text-right font-semibold text-gray-900">
                              Balance Due:
                            </td>
                            <td className="py-2 px-4 text-right font-bold text-red-600">
                              {formatCurrency(invoice.total_amount - invoice.paid_amount)}
                            </td>
                          </tr>
                        </>
                      )}
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            {(invoice.payment_method || invoice.transaction_id) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FiDollarSign className="w-5 h-5" />
                    <span>Payment Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {invoice.payment_method && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Payment Method</span>
                        <p className="text-gray-900 capitalize">{invoice.payment_method}</p>
                      </div>
                    )}
                    {invoice.transaction_id && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Transaction ID</span>
                        <p className="text-gray-900 font-mono">{invoice.transaction_id}</p>
                      </div>
                    )}
                    {invoice.payment_date && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Payment Date</span>
                        <p className="text-gray-900">{formatDate(invoice.payment_date)}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {invoice.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default InvoiceView;
