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
import { FiDollarSign, FiCreditCard, FiFileText, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

const StudentFees = () => {
  const { user } = useAuth();
  const [selectedFeeType, setSelectedFeeType] = useState('all');

  const { data: feesData, loading, error } = useApi(studentAPI.getFees);

  if (!user || user.role !== 'student') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="error">Access denied. Student access required.</Alert>
      </div>
    );
  }

  const fees = feesData?.fees || [];
  const totalOutstanding = feesData?.totalOutstanding || 0;

  // Filter fees by type
  const filteredFees = selectedFeeType === 'all' 
    ? fees 
    : fees.filter(fee => fee.fee_type === selectedFeeType);

  // Get unique fee types
  const feeTypes = [...new Set(fees.map(fee => fee.fee_type))];

  // Calculate fee statistics
  const feeStats = React.useMemo(() => {
    const paid = fees.filter(f => f.status === 'paid');
    const unpaid = fees.filter(f => f.status === 'unpaid');
    const overdue = unpaid.filter(f => new Date(f.due_date) < new Date());
    
    const totalPaid = paid.reduce((sum, f) => sum + parseFloat(f.amount), 0);
    const totalUnpaid = unpaid.reduce((sum, f) => sum + parseFloat(f.amount), 0);
    const totalOverdue = overdue.reduce((sum, f) => sum + parseFloat(f.amount), 0);

    return {
      totalFees: fees.length,
      paidCount: paid.length,
      unpaidCount: unpaid.length,
      overdueCount: overdue.length,
      totalPaid,
      totalUnpaid,
      totalOverdue
    };
  }, [fees]);

  function getStatusBadgeVariant(status, dueDate) {
    if (status === 'paid') return 'success';
    if (status === 'unpaid' && new Date(dueDate) < new Date()) return 'danger';
    return 'warning';
  }

  function getStatusText(status, dueDate) {
    if (status === 'paid') return 'Paid';
    if (status === 'unpaid' && new Date(dueDate) < new Date()) return 'Overdue';
    return 'Pending';
  }

  const handlePayment = (feeId) => {
    // This would typically open a payment gateway or redirect to payment page
    alert(`Payment functionality for fee ${feeId} would be implemented here`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Page Header */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Fee Management</h1>
              <p className="text-gray-600">View and manage your academic fees</p>
            </div>

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
                {/* Outstanding Balance Alert */}
                {totalOutstanding > 0 && (
                  <Alert variant="warning">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FiAlertCircle className="w-5 h-5 mr-2" />
                        <span>
                          You have an outstanding balance of <strong>${totalOutstanding.toFixed(2)}</strong>
                        </span>
                      </div>
                      <Button variant="warning" size="sm">
                        Pay Now
                      </Button>
                    </div>
                  </Alert>
                )}

                {/* Fee Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-primary-blue rounded-lg flex items-center justify-center mr-4">
                        <FiFileText className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Fees</p>
                        <p className="text-2xl font-bold text-gray-900">{feeStats.totalFees}</p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-accent-green rounded-lg flex items-center justify-center mr-4">
                        <FiCheckCircle className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Paid</p>
                        <p className="text-2xl font-bold text-gray-900">${feeStats.totalPaid.toFixed(0)}</p>
                        <p className="text-xs text-gray-500">{feeStats.paidCount} fees</p>
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
                        <p className="text-2xl font-bold text-gray-900">${feeStats.totalUnpaid.toFixed(0)}</p>
                        <p className="text-xs text-gray-500">{feeStats.unpaidCount} fees</p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-accent-red rounded-lg flex items-center justify-center mr-4">
                        <FiAlertCircle className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Overdue</p>
                        <p className="text-2xl font-bold text-gray-900">${feeStats.totalOverdue.toFixed(0)}</p>
                        <p className="text-xs text-gray-500">{feeStats.overdueCount} fees</p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Fee Records Table */}
                <Card>
                  <Card.Header>
                    <div className="flex justify-between items-center">
                      <Card.Title>Fee Records</Card.Title>
                      <select
                        value={selectedFeeType}
                        onChange={(e) => setSelectedFeeType(e.target.value)}
                        className="form-select w-auto"
                      >
                        <option value="all">All Fee Types</option>
                        {feeTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  </Card.Header>
                  
                  {filteredFees.length > 0 ? (
                    <Table>
                      <Table.Header>
                        <Table.Row>
                          <Table.Head>Fee Type</Table.Head>
                          <Table.Head>Amount</Table.Head>
                          <Table.Head>Due Date</Table.Head>
                          <Table.Head>Status</Table.Head>
                          <Table.Head>Paid Date</Table.Head>
                          <Table.Head>Payment Method</Table.Head>
                          <Table.Head>Actions</Table.Head>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {filteredFees.map((fee, index) => (
                          <Table.Row key={index}>
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
                              <span className="text-gray-600">
                                {fee.paid_date ? new Date(fee.paid_date).toLocaleDateString() : '-'}
                              </span>
                            </Table.Cell>
                            <Table.Cell>
                              <span className="text-gray-600">
                                {fee.payment_method || '-'}
                              </span>
                            </Table.Cell>
                            <Table.Cell>
                              {fee.status === 'unpaid' ? (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  icon={FiCreditCard}
                                  onClick={() => handlePayment(fee.id)}
                                >
                                  Pay Now
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  icon={FiFileText}
                                >
                                  Receipt
                                </Button>
                              )}
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <FiDollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No fees found for the selected type.</p>
                    </div>
                  )}
                </Card>

                {/* Payment Instructions */}
                <Card>
                  <Card.Header>
                    <Card.Title>Payment Information</Card.Title>
                  </Card.Header>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Accepted Payment Methods</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Credit/Debit Cards (Visa, MasterCard, American Express)</li>
                        <li>• Bank Transfer</li>
                        <li>• Online Banking</li>
                        <li>• Cash (at Finance Office)</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Important Notes</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Late payment fees may apply for overdue payments</li>
                        <li>• Keep payment receipts for your records</li>
                        <li>• Contact the Finance Office for payment plan options</li>
                        <li>• Payments may take 1-2 business days to reflect in your account</li>
                      </ul>
                    </div>
                  </div>
                </Card>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentFees;
