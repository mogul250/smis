import React, { useState } from 'react';
import Head from 'next/head';
import { useAuth } from '../../hooks/useAuth';
import { useApi, useAsyncOperation } from '../../hooks/useApi';
import { hodAPI } from '../../services/apiService';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';
import { 
  FiBarChart, 
  FiDownload, 
  FiCalendar, 
  FiUsers,
  FiBook,
  FiTrendingUp,
  FiTrendingDown,
  FiRefreshCw,
  FiFileText,
  FiPieChart,
  FiActivity
} from 'react-icons/fi';

const ReportsPage = () => {
  const { user } = useAuth();
  const [selectedReportType, setSelectedReportType] = useState('attendance');
  const [reportData, setReportData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch department statistics
  const { data: stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useApi(hodAPI.getDepartmentStats);

  // Generate report operation
  const { execute: generateReport, loading: generatingReport } = useAsyncOperation(hodAPI.generateReports);

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
      await refetchStats();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle report generation
  const handleGenerateReport = async (reportType) => {
    try {
      const result = await generateReport(reportType, {
        semester: 'current',
        year: new Date().getFullYear()
      });
      setReportData(result);
      setSelectedReportType(reportType);
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  // Report types configuration
  const reportTypes = [
    {
      id: 'attendance',
      title: 'Attendance Report',
      description: 'Detailed attendance statistics by course and teacher',
      icon: FiUsers,
      color: 'bg-blue-500'
    },
    {
      id: 'grades',
      title: 'Grade Distribution Report',
      description: 'Grade distribution and performance analytics',
      icon: FiBarChart,
      color: 'bg-green-500'
    },
    {
      id: 'performance',
      title: 'Department Performance',
      description: 'Overall department performance metrics',
      icon: FiTrendingUp,
      color: 'bg-purple-500'
    },
    {
      id: 'courses',
      title: 'Course Analytics',
      description: 'Course enrollment and completion statistics',
      icon: FiBook,
      color: 'bg-orange-500'
    }
  ];

  // Statistics cards configuration
  const statsCards = [
    {
      title: 'Total Teachers',
      value: stats?.teachers || 0,
      icon: FiUsers,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: null
    },
    {
      title: 'Total Courses',
      value: stats?.courses || 0,
      icon: FiBook,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: null
    },
    {
      title: 'Avg Attendance',
      value: `${stats?.attendance?.avg_attendance_percentage || 0}%`,
      icon: FiTrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: null
    },
    {
      title: 'Total Records',
      value: stats?.attendance?.total_records || 0,
      icon: FiActivity,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      change: null
    }
  ];

  return (
    <>
      <Head>
        <title>Reports & Analytics - HOD Dashboard</title>
        <meta name="description" content="Generate and view department reports and analytics" />
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
                  <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
                  <p className="text-gray-600 mt-1">
                    Generate comprehensive reports and view department analytics
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
                  {reportData && (
                    <Button variant="outline" size="sm" icon={FiDownload}>
                      Export Report
                    </Button>
                  )}
                </div>
              </div>

              {/* Error handling */}
              {statsError && (
                <Alert variant="error" className="mb-6">
                  Error loading statistics: {statsError.message}
                </Alert>
              )}

              {/* Statistics Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsCards.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <Card key={index} className="p-6">
                      <div className="flex items-center">
                        <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                          <Icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                          <div className="flex items-center">
                            {statsLoading ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Report Generation */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Generate Reports</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reportTypes.map((reportType) => {
                    const Icon = reportType.icon;
                    return (
                      <div
                        key={reportType.id}
                        className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all duration-200"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center">
                            <div className={`w-10 h-10 ${reportType.color} rounded-lg flex items-center justify-center`}>
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="ml-3">
                              <h4 className="text-sm font-medium text-gray-900">
                                {reportType.title}
                              </h4>
                              <p className="text-xs text-gray-500 mt-1">
                                {reportType.description}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGenerateReport(reportType.id)}
                            loading={generatingReport && selectedReportType === reportType.id}
                            icon={FiFileText}
                          >
                            Generate
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Report Results */}
              {reportData && (
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {reportTypes.find(r => r.id === selectedReportType)?.title} Results
                    </h3>
                    <Badge variant="success" size="sm">
                      Generated {new Date().toLocaleDateString()}
                    </Badge>
                  </div>

                  {selectedReportType === 'attendance' && reportData.attendance && (
                    <div className="space-y-4">
                      <h4 className="text-md font-medium text-gray-900">Attendance by Course</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Course
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Code
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total Classes
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Present Count
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Attendance %
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {reportData.attendance.map((course, index) => (
                              <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {course.course_name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {course.course_code}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {course.total_classes}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {course.present_count}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <Badge 
                                    variant={course.attendance_percentage >= 75 ? 'success' : course.attendance_percentage >= 60 ? 'warning' : 'danger'}
                                    size="sm"
                                  >
                                    {course.attendance_percentage}%
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {selectedReportType === 'grades' && reportData.grades && (
                    <div className="space-y-4">
                      <h4 className="text-md font-medium text-gray-900">Grade Distribution</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(reportData.grades).map(([grade, count]) => (
                          <div key={grade} className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-gray-900">{count}</div>
                            <div className="text-sm text-gray-500">Grade {grade}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!reportData.attendance && !reportData.grades && (
                    <div className="text-center py-8 text-gray-500">
                      <FiFileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p>Report generated successfully. Data will be displayed here.</p>
                    </div>
                  )}
                </Card>
              )}

              {/* Quick Insights */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Overview</h3>
                  {statsLoading ? (
                    <div className="flex justify-center py-8">
                      <LoadingSpinner />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Teachers</span>
                        <span className="text-sm font-medium text-gray-900">{stats?.teachers || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Courses</span>
                        <span className="text-sm font-medium text-gray-900">{stats?.courses || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Average Attendance</span>
                        <Badge 
                          variant={
                            (stats?.attendance?.avg_attendance_percentage || 0) >= 75 ? 'success' : 
                            (stats?.attendance?.avg_attendance_percentage || 0) >= 60 ? 'warning' : 'danger'
                          }
                          size="sm"
                        >
                          {stats?.attendance?.avg_attendance_percentage || 0}%
                        </Badge>
                      </div>
                    </div>
                  )}
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <FiFileText className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Last report generated</p>
                        <p className="text-xs text-gray-500">
                          {reportData ? 'Just now' : 'No reports generated yet'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <FiTrendingUp className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Data last updated</p>
                        <p className="text-xs text-gray-500">
                          {new Date().toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default ReportsPage;
