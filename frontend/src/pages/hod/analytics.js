import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { hodAPI } from '../../services/api';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { FiTrendingUp, FiTrendingDown, FiUsers, FiBook, FiAward, FiCalendar, FiBarChart } from 'react-icons/fi';

const HODAnalytics = () => {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('current_semester');
  const [selectedMetric, setSelectedMetric] = useState('overview');

  const { data: analytics, loading, error, execute: loadAnalytics } = useApi(
    () => hodAPI.getDepartmentAnalytics({ period: selectedPeriod }),
    []
  );

  React.useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod, loadAnalytics]);

  if (!user || user.role !== 'hod') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="error">Access denied. HOD access required.</Alert>
      </div>
    );
  }

  const periods = [
    { value: 'current_semester', label: 'Current Semester' },
    { value: 'last_semester', label: 'Last Semester' },
    { value: 'academic_year', label: 'Academic Year' },
    { value: 'last_year', label: 'Last Year' }
  ];

  const metrics = [
    { id: 'overview', label: 'Overview', icon: FiBarChart },
    { id: 'teachers', label: 'Teacher Performance', icon: FiUsers },
    { id: 'courses', label: 'Course Analytics', icon: FiBook },
    { id: 'students', label: 'Student Outcomes', icon: FiAward }
  ];

  const getTrendIcon = (trend) => {
    if (trend > 0) return FiTrendingUp;
    if (trend < 0) return FiTrendingDown;
    return FiBarChart;
  };

  const getTrendColor = (trend) => {
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Department Analytics</h1>
                <p className="text-gray-600">Comprehensive insights into departmental performance</p>
              </div>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="form-select w-auto"
              >
                {periods.map(period => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>
            </div>

            {loading ? (
              <Card className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </Card>
            ) : error ? (
              <Alert variant="error">
                Failed to load analytics: {error}
              </Alert>
            ) : analytics ? (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-primary-blue rounded-lg flex items-center justify-center mr-4">
                          <FiUsers className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Students</p>
                          <p className="text-2xl font-bold text-gray-900">{analytics.totalStudents || 0}</p>
                        </div>
                      </div>
                      {analytics.studentTrend && (
                        <div className={`flex items-center ${getTrendColor(analytics.studentTrend)}`}>
                          {React.createElement(getTrendIcon(analytics.studentTrend), { className: "w-4 h-4" })}
                          <span className="text-sm ml-1">{Math.abs(analytics.studentTrend)}%</span>
                        </div>
                      )}
                    </div>
                  </Card>
                  
                  <Card>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-accent-green rounded-lg flex items-center justify-center mr-4">
                          <FiTrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Avg GPA</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {analytics.averageGPA ? analytics.averageGPA.toFixed(2) : 'N/A'}
                          </p>
                        </div>
                      </div>
                      {analytics.gpaTrend && (
                        <div className={`flex items-center ${getTrendColor(analytics.gpaTrend)}`}>
                          {React.createElement(getTrendIcon(analytics.gpaTrend), { className: "w-4 h-4" })}
                          <span className="text-sm ml-1">{Math.abs(analytics.gpaTrend).toFixed(1)}%</span>
                        </div>
                      )}
                    </div>
                  </Card>
                  
                  <Card>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-accent-orange rounded-lg flex items-center justify-center mr-4">
                          <FiCalendar className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {analytics.attendanceRate ? `${analytics.attendanceRate.toFixed(1)}%` : 'N/A'}
                          </p>
                        </div>
                      </div>
                      {analytics.attendanceTrend && (
                        <div className={`flex items-center ${getTrendColor(analytics.attendanceTrend)}`}>
                          {React.createElement(getTrendIcon(analytics.attendanceTrend), { className: "w-4 h-4" })}
                          <span className="text-sm ml-1">{Math.abs(analytics.attendanceTrend).toFixed(1)}%</span>
                        </div>
                      )}
                    </div>
                  </Card>
                  
                  <Card>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-accent-red rounded-lg flex items-center justify-center mr-4">
                          <FiBook className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Course Completion</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {analytics.completionRate ? `${analytics.completionRate.toFixed(1)}%` : 'N/A'}
                          </p>
                        </div>
                      </div>
                      {analytics.completionTrend && (
                        <div className={`flex items-center ${getTrendColor(analytics.completionTrend)}`}>
                          {React.createElement(getTrendIcon(analytics.completionTrend), { className: "w-4 h-4" })}
                          <span className="text-sm ml-1">{Math.abs(analytics.completionTrend).toFixed(1)}%</span>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>

                {/* Metric Navigation */}
                <Card>
                  <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                      {metrics.map(metric => {
                        const Icon = metric.icon;
                        return (
                          <button
                            key={metric.id}
                            onClick={() => setSelectedMetric(metric.id)}
                            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                              selectedMetric === metric.id
                                ? 'border-primary-blue text-primary-blue'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span>{metric.label}</span>
                          </button>
                        );
                      })}
                    </nav>
                  </div>

                  {/* Metric Content */}
                  <div className="p-6">
                    {selectedMetric === 'overview' && (
                      <div className="space-y-6">
                        {/* Grade Distribution */}
                        {analytics.gradeDistribution && (
                          <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Grade Distribution</h3>
                            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                              {Object.entries(analytics.gradeDistribution).map(([grade, count]) => (
                                <div key={grade} className="text-center p-4 bg-gray-50 rounded-lg">
                                  <div className="text-2xl font-bold text-gray-900">{count}</div>
                                  <div className="text-sm text-gray-600">{grade} Grade</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Department Comparison */}
                        {analytics.departmentComparison && (
                          <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Department Comparison</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-blue-50 p-4 rounded-lg">
                                <div className="text-sm text-blue-600 font-medium">University Average GPA</div>
                                <div className="text-2xl font-bold text-blue-900">
                                  {analytics.departmentComparison.universityAvgGPA?.toFixed(2) || 'N/A'}
                                </div>
                              </div>
                              <div className="bg-green-50 p-4 rounded-lg">
                                <div className="text-sm text-green-600 font-medium">Department Rank</div>
                                <div className="text-2xl font-bold text-green-900">
                                  #{analytics.departmentComparison.rank || 'N/A'}
                                </div>
                              </div>
                              <div className="bg-purple-50 p-4 rounded-lg">
                                <div className="text-sm text-purple-600 font-medium">Performance Score</div>
                                <div className="text-2xl font-bold text-purple-900">
                                  {analytics.departmentComparison.performanceScore || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedMetric === 'teachers' && analytics.teacherPerformance && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Teacher Performance Analysis</h3>
                        <Table>
                          <Table.Header>
                            <Table.Row>
                              <Table.Head>Teacher</Table.Head>
                              <Table.Head>Classes</Table.Head>
                              <Table.Head>Students</Table.Head>
                              <Table.Head>Avg Class GPA</Table.Head>
                              <Table.Head>Attendance Rate</Table.Head>
                              <Table.Head>Performance</Table.Head>
                            </Table.Row>
                          </Table.Header>
                          <Table.Body>
                            {analytics.teacherPerformance.map((teacher, index) => (
                              <Table.Row key={index}>
                                <Table.Cell>
                                  <div className="font-medium text-gray-900">
                                    {teacher.name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {teacher.employeeId}
                                  </div>
                                </Table.Cell>
                                <Table.Cell>{teacher.classCount}</Table.Cell>
                                <Table.Cell>{teacher.studentCount}</Table.Cell>
                                <Table.Cell>
                                  <span className="font-medium">
                                    {teacher.avgGPA ? teacher.avgGPA.toFixed(2) : 'N/A'}
                                  </span>
                                </Table.Cell>
                                <Table.Cell>
                                  <span className="font-medium">
                                    {teacher.attendanceRate ? `${teacher.attendanceRate.toFixed(1)}%` : 'N/A'}
                                  </span>
                                </Table.Cell>
                                <Table.Cell>
                                  <Badge variant={
                                    teacher.performance === 'excellent' ? 'success' :
                                    teacher.performance === 'good' ? 'primary' :
                                    teacher.performance === 'average' ? 'warning' : 'danger'
                                  }>
                                    {teacher.performance}
                                  </Badge>
                                </Table.Cell>
                              </Table.Row>
                            ))}
                          </Table.Body>
                        </Table>
                      </div>
                    )}

                    {selectedMetric === 'courses' && analytics.courseAnalytics && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Course Performance Analysis</h3>
                        <Table>
                          <Table.Header>
                            <Table.Row>
                              <Table.Head>Course</Table.Head>
                              <Table.Head>Enrolled</Table.Head>
                              <Table.Head>Completion Rate</Table.Head>
                              <Table.Head>Avg Grade</Table.Head>
                              <Table.Head>Satisfaction</Table.Head>
                              <Table.Head>Status</Table.Head>
                            </Table.Row>
                          </Table.Header>
                          <Table.Body>
                            {analytics.courseAnalytics.map((course, index) => (
                              <Table.Row key={index}>
                                <Table.Cell>
                                  <div className="font-medium text-gray-900">
                                    {course.name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {course.code}
                                  </div>
                                </Table.Cell>
                                <Table.Cell>{course.enrolledCount}</Table.Cell>
                                <Table.Cell>
                                  <span className="font-medium">
                                    {course.completionRate ? `${course.completionRate.toFixed(1)}%` : 'N/A'}
                                  </span>
                                </Table.Cell>
                                <Table.Cell>
                                  <span className="font-medium">
                                    {course.avgGrade || 'N/A'}
                                  </span>
                                </Table.Cell>
                                <Table.Cell>
                                  <span className="font-medium">
                                    {course.satisfaction ? `${course.satisfaction.toFixed(1)}%` : 'N/A'}
                                  </span>
                                </Table.Cell>
                                <Table.Cell>
                                  <Badge variant={
                                    course.status === 'excellent' ? 'success' :
                                    course.status === 'good' ? 'primary' :
                                    course.status === 'needs_improvement' ? 'warning' : 'danger'
                                  }>
                                    {course.status?.replace('_', ' ')}
                                  </Badge>
                                </Table.Cell>
                              </Table.Row>
                            ))}
                          </Table.Body>
                        </Table>
                      </div>
                    )}

                    {selectedMetric === 'students' && analytics.studentOutcomes && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Student Outcome Analysis</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-3">Academic Performance</h4>
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Students with GPA ≥ 3.5</span>
                                <span className="font-medium">{analytics.studentOutcomes.highPerformers || 0}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Students at Risk (GPA &lt; 2.0)</span>
                                <span className="font-medium text-red-600">{analytics.studentOutcomes.atRisk || 0}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Graduation Rate</span>
                                <span className="font-medium">
                                  {analytics.studentOutcomes.graduationRate ? `${analytics.studentOutcomes.graduationRate.toFixed(1)}%` : 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-gray-900 mb-3">Engagement Metrics</h4>
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Average Attendance</span>
                                <span className="font-medium">
                                  {analytics.studentOutcomes.avgAttendance ? `${analytics.studentOutcomes.avgAttendance.toFixed(1)}%` : 'N/A'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Course Satisfaction</span>
                                <span className="font-medium">
                                  {analytics.studentOutcomes.satisfaction ? `${analytics.studentOutcomes.satisfaction.toFixed(1)}%` : 'N/A'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Retention Rate</span>
                                <span className="font-medium">
                                  {analytics.studentOutcomes.retentionRate ? `${analytics.studentOutcomes.retentionRate.toFixed(1)}%` : 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </>
            ) : (
              <Card className="text-center py-12">
                <FiBarChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
                <p className="text-gray-500">
                  Analytics data will appear here once sufficient departmental data is available.
                </p>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default HODAnalytics;
