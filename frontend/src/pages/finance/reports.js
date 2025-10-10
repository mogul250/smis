import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { financeAPI } from '../../services/api';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import RevenueChart from '../../components/finance/charts/RevenueChart';
import FeeTypeChart from '../../components/finance/charts/FeeTypeChart';
import PaymentMethodChart from '../../components/finance/charts/PaymentMethodChart';
import CollectionTrendChart from '../../components/finance/charts/CollectionTrendChart';
import { FiBarChart, FiDownload, FiCalendar, FiDollarSign, FiTrendingUp, FiPieChart } from 'react-icons/fi';

const FinanceReports = () => {
  const { user } = useAuth();
  const [selectedReport, setSelectedReport] = useState('revenue');
  const [reportPeriod, setReportPeriod] = useState('current_month');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const { data: reportData, loading, error, execute: loadReport } = useApi(
    () => financeAPI.getFinancialReports({
      reportType: selectedReport,
      ...(reportPeriod === 'custom' ? customDateRange : {})
    }),
    []
  );

  // Mock data for demonstration - this would come from the API in a real implementation
  const mockReportData = {
    summary: {
      totalRevenue: 45000,
      totalCollections: 42000,
      totalOutstanding: 8500,
      totalOverdue: 3200,
      revenueGrowth: 12.5,
      collectionRate: 93.3,
      outstandingCount: 23,
      overdueCount: 8
    },
    revenueBreakdown: [
      { feeType: 'Tuition', totalAmount: 25000, collectedAmount: 23500, outstandingAmount: 1500, collectionRate: 94 },
      { feeType: 'Library', totalAmount: 8000, collectedAmount: 7200, outstandingAmount: 800, collectionRate: 90 },
      { feeType: 'Laboratory', totalAmount: 6000, collectedAmount: 5800, outstandingAmount: 200, collectionRate: 96.7 },
      { feeType: 'Sports', totalAmount: 4000, collectedAmount: 3500, outstandingAmount: 500, collectionRate: 87.5 },
      { feeType: 'Transport', totalAmount: 2000, collectedAmount: 2000, outstandingAmount: 0, collectionRate: 100 }
    ],
    dailyCollections: [
      { date: '2024-01-01', amount: 2500, transactionCount: 15, paymentMethods: ['Cash', 'Bank Transfer'] },
      { date: '2024-01-02', amount: 3200, transactionCount: 18, paymentMethods: ['Mobile Money', 'Card'] },
      { date: '2024-01-03', amount: 2800, transactionCount: 12, paymentMethods: ['Cash', 'Cheque'] },
      { date: '2024-01-04', amount: 4100, transactionCount: 22, paymentMethods: ['Bank Transfer', 'Card'] },
      { date: '2024-01-05', amount: 3600, transactionCount: 19, paymentMethods: ['Mobile Money', 'Cash'] },
      { date: '2024-01-06', amount: 2900, transactionCount: 14, paymentMethods: ['Card', 'Bank Transfer'] },
      { date: '2024-01-07', amount: 3800, transactionCount: 21, paymentMethods: ['Cash', 'Mobile Money'] }
    ],
    feeAnalysis: {
      paymentMethodBreakdown: [
        { paymentMethod: 'bank_transfer', totalAmount: 18500, transactionCount: 45, percentage: 44.0 },
        { paymentMethod: 'mobile_money', totalAmount: 12800, transactionCount: 38, percentage: 30.5 },
        { paymentMethod: 'cash', totalAmount: 7200, transactionCount: 28, percentage: 17.1 },
        { paymentMethod: 'card', totalAmount: 2800, transactionCount: 12, percentage: 6.7 },
        { paymentMethod: 'cheque', totalAmount: 700, transactionCount: 3, percentage: 1.7 }
      ],
      feeTypePerformance: [
        { feeType: 'Tuition', totalAmount: 25000, studentCount: 150, collectionRate: 94 },
        { feeType: 'Library', totalAmount: 8000, studentCount: 120, collectionRate: 90 },
        { feeType: 'Laboratory', totalAmount: 6000, studentCount: 80, collectionRate: 96.7 },
        { feeType: 'Sports', totalAmount: 4000, studentCount: 100, collectionRate: 87.5 }
      ]
    }
  };

  // Use mock data for demonstration, fallback to API data
  const displayData = reportData?.summary ? reportData : mockReportData;

  React.useEffect(() => {
    loadReport();
  }, [selectedReport, reportPeriod, customDateRange, loadReport]);

  if (!user || user.role !== 'finance') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="error">Access denied. Finance access required.</Alert>
      </div>
    );
  }

  const reportTypes = [
    { value: 'revenue', label: 'Revenue Report', icon: FiDollarSign },
    { value: 'collections', label: 'Collections Report', icon: FiTrendingUp },
    { value: 'outstanding', label: 'Outstanding Report', icon: FiBarChart },
    { value: 'fee_analysis', label: 'Fee Analysis', icon: FiPieChart }
  ];

  const periodOptions = [
    { value: 'current_month', label: 'Current Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'current_quarter', label: 'Current Quarter' },
    { value: 'current_year', label: 'Current Year' },
    { value: 'last_year', label: 'Last Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const handleDateChange = (field, value) => {
    setCustomDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleExportReport = () => {
    // Export functionality would be implemented here
    alert('Export report functionality would be implemented here');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(1)}%`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 lg:ml-64 pt-20 p-4 lg:p-6">
          <div className="max-w-7xl mx-auto space-y-4 lg:space-y-6">
            {/* Page Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6 mb-6">
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                <div className="flex-1">
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Financial Reports</h1>
                  <p className="text-base text-gray-600">Generate and analyze financial reports and insights</p>
                </div>
                <div className="flex-shrink-0">
                  <Button 
                    variant="primary" 
                    icon={FiDownload} 
                    onClick={handleExportReport} 
                    className="w-full lg:w-auto px-6 py-3 text-base font-semibold"
                  >
                    Export Report
                  </Button>
                </div>
              </div>
            </div>

            {/* Report Configuration */}
            <Card>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Report Type
                  </label>
                  <select
                    value={selectedReport}
                    onChange={(e) => setSelectedReport(e.target.value)}
                    className="form-select"
                  >
                    {reportTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Period
                  </label>
                  <select
                    value={reportPeriod}
                    onChange={(e) => setReportPeriod(e.target.value)}
                    className="form-select"
                  >
                    {periodOptions.map(period => (
                      <option key={period.value} value={period.value}>
                        {period.label}
                      </option>
                    ))}
                  </select>
                </div>

                {reportPeriod === 'custom' && (
                  <div className="sm:col-span-2 lg:col-span-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={customDateRange.startDate}
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
                          value={customDateRange.endDate}
                          onChange={(e) => handleDateChange('endDate', e.target.value)}
                          className="form-input"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {loading ? (
              <Card className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </Card>
            ) : error ? (
              <Alert variant="error">
                Failed to load report: {error}
              </Alert>
            ) : displayData ? (
              <>
                {/* Report Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                  <Card>
                    <div className="flex items-center">
                      <div className="w-10 h-10 lg:w-12 lg:h-12 bg-primary-blue rounded-lg flex items-center justify-center mr-3 lg:mr-4">
                        <FiDollarSign className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs lg:text-sm font-medium text-gray-600">Total Revenue</p>
                        <p className="text-lg lg:text-2xl font-bold text-gray-900 truncate">
                          {formatCurrency(displayData.summary?.totalRevenue)}
                        </p>
                        {displayData.summary?.revenueGrowth && (
                          <p className="text-xs text-green-600">
                            +{formatPercentage(displayData.summary.revenueGrowth)} from last period
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                  
                  <Card>
                    <div className="flex items-center">
                      <div className="w-10 h-10 lg:w-12 lg:h-12 bg-accent-green rounded-lg flex items-center justify-center mr-3 lg:mr-4">
                        <FiTrendingUp className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs lg:text-sm font-medium text-gray-600">Collections</p>
                        <p className="text-lg lg:text-2xl font-bold text-gray-900 truncate">
                          {formatCurrency(displayData.summary?.totalCollections)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatPercentage(displayData.summary?.collectionRate)} collection rate
                        </p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card>
                    <div className="flex items-center">
                      <div className="w-10 h-10 lg:w-12 lg:h-12 bg-accent-orange rounded-lg flex items-center justify-center mr-3 lg:mr-4">
                        <FiBarChart className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs lg:text-sm font-medium text-gray-600">Outstanding</p>
                        <p className="text-lg lg:text-2xl font-bold text-gray-900 truncate">
                          {formatCurrency(displayData.summary?.totalOutstanding)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {displayData.summary?.outstandingCount || 0} students
                        </p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card>
                    <div className="flex items-center">
                      <div className="w-10 h-10 lg:w-12 lg:h-12 bg-accent-red rounded-lg flex items-center justify-center mr-3 lg:mr-4">
                        <FiCalendar className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs lg:text-sm font-medium text-gray-600">Overdue</p>
                        <p className="text-lg lg:text-2xl font-bold text-gray-900 truncate">
                          {formatCurrency(displayData.summary?.totalOverdue)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {displayData.summary?.overdueCount || 0} fees
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Report Content */}
                {selectedReport === 'revenue' && displayData.revenueBreakdown && (
                  <div className="space-y-6">
                    {/* Revenue Chart */}
                    <FeeTypeChart data={displayData} title="Revenue Breakdown by Fee Type" />

                    {/* Revenue Table */}
                    <Card>
                      <Card.Header>
                        <Card.Title>Detailed Revenue Breakdown</Card.Title>
                      </Card.Header>
                      <Table>
                        <Table.Header>
                          <Table.Row>
                            <Table.Head>Fee Type</Table.Head>
                            <Table.Head>Total Amount</Table.Head>
                            <Table.Head>Collected</Table.Head>
                            <Table.Head>Outstanding</Table.Head>
                            <Table.Head>Collection Rate</Table.Head>
                          </Table.Row>
                        </Table.Header>
                        <Table.Body>
                          {displayData.revenueBreakdown.map((item, index) => (
                            <Table.Row key={index}>
                              <Table.Cell>
                                <span className="font-medium text-gray-900">{item.feeType}</span>
                              </Table.Cell>
                              <Table.Cell>
                                <span className="font-semibold">{formatCurrency(item.totalAmount)}</span>
                              </Table.Cell>
                              <Table.Cell>
                                <span className="text-green-600 font-medium">
                                  {formatCurrency(item.collectedAmount)}
                                </span>
                              </Table.Cell>
                              <Table.Cell>
                                <span className="text-orange-600 font-medium">
                                  {formatCurrency(item.outstandingAmount)}
                                </span>
                              </Table.Cell>
                              <Table.Cell>
                                <span className="font-medium">
                                  {formatPercentage(item.collectionRate)}
                                </span>
                              </Table.Cell>
                            </Table.Row>
                          ))}
                        </Table.Body>
                      </Table>
                    </Card>
                  </div>
                )}

                {selectedReport === 'collections' && displayData.dailyCollections && (
                  <div className="space-y-4 lg:space-y-6">
                    {/* Collections Charts */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
                      <div className="w-full">
                        <RevenueChart data={displayData} title="Daily Collections Trend" />
                      </div>
                      <div className="w-full">
                        <CollectionTrendChart data={displayData} title="Collection Progress" />
                      </div>
                    </div>

                    {/* Collections Details */}
                    <Card>
                      <Card.Header>
                        <Card.Title>Daily Collections Details</Card.Title>
                      </Card.Header>
                      <div className="space-y-4">
                        {displayData.dailyCollections.map((day, index) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                              <div className="font-medium text-gray-900">
                                {new Date(day.date).toLocaleDateString()}
                              </div>
                              <div className="text-sm text-gray-500">
                                {day.transactionCount} transactions
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-semibold text-gray-900">
                                {formatCurrency(day.amount)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {day.paymentMethods?.join(', ')}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                )}

                {selectedReport === 'outstanding' && reportData.outstandingDetails && (
                  <Card>
                    <Card.Header>
                      <Card.Title>Outstanding Fees by Student</Card.Title>
                    </Card.Header>
                    <Table>
                      <Table.Header>
                        <Table.Row>
                          <Table.Head>Student</Table.Head>
                          <Table.Head>Total Outstanding</Table.Head>
                          <Table.Head>Overdue Amount</Table.Head>
                          <Table.Head>Days Overdue</Table.Head>
                          <Table.Head>Fee Types</Table.Head>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {reportData.outstandingDetails.map((student, index) => (
                          <Table.Row key={index}>
                            <Table.Cell>
                              <div className="font-medium text-gray-900">
                                {student.studentName}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {student.studentId}
                              </div>
                            </Table.Cell>
                            <Table.Cell>
                              <span className="font-semibold text-orange-600">
                                {formatCurrency(student.totalOutstanding)}
                              </span>
                            </Table.Cell>
                            <Table.Cell>
                              <span className="font-semibold text-red-600">
                                {formatCurrency(student.overdueAmount)}
                              </span>
                            </Table.Cell>
                            <Table.Cell>
                              <span className="text-gray-900">
                                {student.maxDaysOverdue || 0} days
                              </span>
                            </Table.Cell>
                            <Table.Cell>
                              <div className="text-sm text-gray-600">
                                {student.feeTypes?.join(', ')}
                              </div>
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table>
                  </Card>
                )}

                {selectedReport === 'fee_analysis' && displayData.feeAnalysis && (
                  <div className="space-y-6">
                    {/* Payment Method Chart */}
                    <PaymentMethodChart data={displayData} title="Payment Methods Distribution" />

                    {/* Fee Analysis Details */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card>
                        <Card.Header>
                          <Card.Title>Fee Type Performance</Card.Title>
                        </Card.Header>
                        <div className="space-y-4">
                          {displayData.feeAnalysis.feeTypePerformance?.map((fee, index) => (
                            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                              <div>
                                <div className="font-medium text-gray-900">{fee.feeType}</div>
                                <div className="text-sm text-gray-500">
                                  {fee.studentCount} students
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-gray-900">
                                  {formatCurrency(fee.totalAmount)}
                                </div>
                                <div className="text-sm text-green-600">
                                  {formatPercentage(fee.collectionRate)} collected
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>

                      <Card>
                        <Card.Header>
                          <Card.Title>Payment Method Details</Card.Title>
                        </Card.Header>
                        <div className="space-y-4">
                          {displayData.feeAnalysis.paymentMethodBreakdown?.map((method, index) => (
                            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                              <div>
                                <div className="font-medium text-gray-900">
                                  {method.paymentMethod?.replace('_', ' ')}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {method.transactionCount} transactions
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-gray-900">
                                  {formatCurrency(method.totalAmount)}
                                </div>
                                <div className="text-sm text-blue-600">
                                  {formatPercentage(method.percentage)} of total
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Card className="text-center py-12">
                <FiBarChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Report Data</h3>
                <p className="text-gray-500">
                  Select a report type and period to generate financial reports.
                </p>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default FinanceReports;
