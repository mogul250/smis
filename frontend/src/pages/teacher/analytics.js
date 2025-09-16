import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { teacherAPI } from '../../services/apiService';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { FiTrendingUp, FiUsers, FiBarChart, FiPieChart, FiCalendar, FiAward } from 'react-icons/fi';

const TeacherAnalytics = () => {
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('current');

  const { data: classes, loading: classesLoading } = useApi(teacherAPI.getClasses);
  const { data: analytics, loading: analyticsLoading, execute: loadAnalytics } = useApi(
    () => teacherAPI.getAnalytics({ classId: selectedClass, period: selectedPeriod }),
    []
  );

  React.useEffect(() => {
    loadAnalytics();
  }, [selectedClass, selectedPeriod, loadAnalytics]);

  if (!user || user.role !== 'teacher') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="error">Access denied. Teacher access required.</Alert>
      </div>
    );
  }

  const getGradeBadgeVariant = (grade) => {
    if (['A+', 'A', 'A-'].includes(grade)) return 'success';
    if (['B+', 'B', 'B-'].includes(grade)) return 'primary';
    if (['C+', 'C', 'C-'].includes(grade)) return 'warning';
    return 'danger';
  };

  const getAttendanceColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-yellow-600';
    return 'text-red-600';
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
              <h1 className="text-2xl font-bold text-gray-900">Teaching Analytics</h1>
              <p className="text-gray-600">Analyze student performance and class statistics</p>
            </div>

            {/* Filters */}
            <Card>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Class
                  </label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="form-select"
                    disabled={classesLoading}
                  >
                    <option value="all">All Classes</option>
                    {classes?.map(cls => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} ({cls.course_code})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Period
                  </label>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="form-select"
                  >
                    <option value="current">Current Semester</option>
                    <option value="last30">Last 30 Days</option>
                    <option value="last90">Last 90 Days</option>
                    <option value="academic_year">Academic Year</option>
                  </select>
                </div>
              </div>
            </Card>

            {analyticsLoading ? (
              <Card className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </Card>
            ) : analytics ? (
              <>
                {/* Overview Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-primary-blue rounded-lg flex items-center justify-center mr-4">
                        <FiUsers className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Students</p>
                        <p className="text-2xl font-bold text-gray-900">{analytics.totalStudents || 0}</p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-accent-green rounded-lg flex items-center justify-center mr-4">
                        <FiTrendingUp className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Average GPA</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {analytics.averageGPA ? analytics.averageGPA.toFixed(2) : 'N/A'}
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
                        <p className="text-sm font-medium text-gray-600">Avg Attendance</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {analytics.averageAttendance ? `${analytics.averageAttendance.toFixed(1)}%` : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-accent-red rounded-lg flex items-center justify-center mr-4">
                        <FiAward className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">A Grades</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {analytics.gradeDistribution?.A || 0}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Grade Distribution */}
                {analytics.gradeDistribution && (
                  <Card>
                    <Card.Header>
                      <Card.Title>Grade Distribution</Card.Title>
                    </Card.Header>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                      {Object.entries(analytics.gradeDistribution).map(([grade, count]) => (
                        <div key={grade} className="text-center">
                          <div className="text-2xl font-bold text-gray-900">{count}</div>
                          <Badge variant={getGradeBadgeVariant(grade)} className="mt-1">
                            {grade}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Class Performance */}
                {analytics.classPerformance && analytics.classPerformance.length > 0 && (
                  <Card>
                    <Card.Header>
                      <Card.Title>Class Performance Summary</Card.Title>
                    </Card.Header>
                    <Table>
                      <Table.Header>
                        <Table.Row>
                          <Table.Head>Class</Table.Head>
                          <Table.Head>Students</Table.Head>
                          <Table.Head>Avg GPA</Table.Head>
                          <Table.Head>Avg Attendance</Table.Head>
                          <Table.Head>Top Grade</Table.Head>
                          <Table.Head>Lowest Grade</Table.Head>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {analytics.classPerformance.map((classData, index) => (
                          <Table.Row key={index}>
                            <Table.Cell>
                              <div className="font-medium text-gray-900">
                                {classData.className}
                              </div>
                              <div className="text-sm text-gray-500">
                                {classData.courseCode}
                              </div>
                            </Table.Cell>
                            <Table.Cell>
                              <span className="font-medium">{classData.studentCount}</span>
                            </Table.Cell>
                            <Table.Cell>
                              <span className="font-medium">
                                {classData.averageGPA ? classData.averageGPA.toFixed(2) : 'N/A'}
                              </span>
                            </Table.Cell>
                            <Table.Cell>
                              <span className={`font-medium ${getAttendanceColor(classData.averageAttendance)}`}>
                                {classData.averageAttendance ? `${classData.averageAttendance.toFixed(1)}%` : 'N/A'}
                              </span>
                            </Table.Cell>
                            <Table.Cell>
                              {classData.topGrade && (
                                <Badge variant={getGradeBadgeVariant(classData.topGrade)}>
                                  {classData.topGrade}
                                </Badge>
                              )}
                            </Table.Cell>
                            <Table.Cell>
                              {classData.lowestGrade && (
                                <Badge variant={getGradeBadgeVariant(classData.lowestGrade)}>
                                  {classData.lowestGrade}
                                </Badge>
                              )}
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table>
                  </Card>
                )}

                {/* Student Performance Insights */}
                {analytics.studentInsights && analytics.studentInsights.length > 0 && (
                  <Card>
                    <Card.Header>
                      <Card.Title>Student Performance Insights</Card.Title>
                    </Card.Header>
                    <Table>
                      <Table.Header>
                        <Table.Row>
                          <Table.Head>Student</Table.Head>
                          <Table.Head>Class</Table.Head>
                          <Table.Head>Current Grade</Table.Head>
                          <Table.Head>Attendance</Table.Head>
                          <Table.Head>Trend</Table.Head>
                          <Table.Head>Status</Table.Head>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {analytics.studentInsights.map((student, index) => (
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
                              <span className="text-gray-900">{student.className}</span>
                            </Table.Cell>
                            <Table.Cell>
                              {student.currentGrade && (
                                <Badge variant={getGradeBadgeVariant(student.currentGrade)}>
                                  {student.currentGrade}
                                </Badge>
                              )}
                            </Table.Cell>
                            <Table.Cell>
                              <span className={`font-medium ${getAttendanceColor(student.attendanceRate)}`}>
                                {student.attendanceRate ? `${student.attendanceRate.toFixed(1)}%` : 'N/A'}
                              </span>
                            </Table.Cell>
                            <Table.Cell>
                              <div className="flex items-center">
                                {student.trend === 'improving' ? (
                                  <FiTrendingUp className="w-4 h-4 text-green-600 mr-1" />
                                ) : student.trend === 'declining' ? (
                                  <FiTrendingUp className="w-4 h-4 text-red-600 mr-1 transform rotate-180" />
                                ) : (
                                  <FiBarChart className="w-4 h-4 text-gray-400 mr-1" />
                                )}
                                <span className="text-sm capitalize">{student.trend || 'stable'}</span>
                              </div>
                            </Table.Cell>
                            <Table.Cell>
                              <Badge 
                                variant={
                                  student.status === 'excellent' ? 'success' :
                                  student.status === 'good' ? 'primary' :
                                  student.status === 'needs_attention' ? 'warning' : 'danger'
                                }
                              >
                                {student.status?.replace('_', ' ') || 'unknown'}
                              </Badge>
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table>
                  </Card>
                )}

                {/* Attendance Trends */}
                {analytics.attendanceTrends && analytics.attendanceTrends.length > 0 && (
                  <Card>
                    <Card.Header>
                      <Card.Title>Recent Attendance Trends</Card.Title>
                    </Card.Header>
                    <div className="space-y-4">
                      {analytics.attendanceTrends.map((trend, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900">{trend.date}</h4>
                            <p className="text-sm text-gray-600">{trend.className}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold text-gray-900">
                              {trend.presentCount}/{trend.totalStudents}
                            </div>
                            <div className={`text-sm ${getAttendanceColor(trend.attendanceRate)}`}>
                              {trend.attendanceRate.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </>
            ) : (
              <Card className="text-center py-12">
                <FiBarChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
                <p className="text-gray-500">
                  Analytics data will appear here once you have classes with student data.
                </p>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default TeacherAnalytics;
