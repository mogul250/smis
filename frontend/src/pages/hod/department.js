import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { hodAPI } from '../../services/api';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { FiUsers, FiBook, FiTrendingUp, FiCalendar, FiEye, FiEdit, FiPlus } from 'react-icons/fi';

const HODDepartment = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: departmentData, loading, error } = useApi(hodAPI.getDepartmentOverview);

  if (!user || user.role !== 'hod') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="error">Access denied. HOD access required.</Alert>
      </div>
    );
  }

  const department = departmentData?.department;
  const stats = departmentData?.stats;
  const teachers = departmentData?.teachers || [];
  const courses = departmentData?.courses || [];
  const students = departmentData?.students || [];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FiTrendingUp },
    { id: 'teachers', label: 'Teachers', icon: FiUsers },
    { id: 'courses', label: 'Courses', icon: FiBook },
    { id: 'students', label: 'Students', icon: FiUsers }
  ];

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
                <h1 className="text-2xl font-bold text-gray-900">Department Management</h1>
                <p className="text-gray-600">
                  {department ? `${department.name} Department` : 'Manage your department'}
                </p>
              </div>
              <Button variant="primary" icon={FiPlus}>
                Add New Course
              </Button>
            </div>

            {loading ? (
              <Card className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </Card>
            ) : error ? (
              <Alert variant="error">
                Failed to load department data: {error}
              </Alert>
            ) : (
              <>
                {/* Department Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-primary-blue rounded-lg flex items-center justify-center mr-4">
                        <FiUsers className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Teachers</p>
                        <p className="text-2xl font-bold text-gray-900">{stats?.totalTeachers || 0}</p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-accent-green rounded-lg flex items-center justify-center mr-4">
                        <FiBook className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Active Courses</p>
                        <p className="text-2xl font-bold text-gray-900">{stats?.totalCourses || 0}</p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-accent-orange rounded-lg flex items-center justify-center mr-4">
                        <FiUsers className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Enrolled Students</p>
                        <p className="text-2xl font-bold text-gray-900">{stats?.totalStudents || 0}</p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-accent-red rounded-lg flex items-center justify-center mr-4">
                        <FiTrendingUp className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Avg Performance</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {stats?.averageGPA ? stats.averageGPA.toFixed(2) : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Tab Navigation */}
                <Card>
                  <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                      {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                              activeTab === tab.id
                                ? 'border-primary-blue text-primary-blue'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span>{tab.label}</span>
                          </button>
                        );
                      })}
                    </nav>
                  </div>

                  {/* Tab Content */}
                  <div className="p-6">
                    {activeTab === 'overview' && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Recent Activities */}
                          <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activities</h3>
                            <div className="space-y-3">
                              {stats?.recentActivities?.map((activity, index) => (
                                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                  <div className="w-8 h-8 bg-primary-blue rounded-full flex items-center justify-center">
                                    <FiCalendar className="w-4 h-4 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                                    <p className="text-xs text-gray-500">{activity.time}</p>
                                  </div>
                                </div>
                              )) || (
                                <p className="text-gray-500 text-center py-4">No recent activities</p>
                              )}
                            </div>
                          </div>

                          {/* Performance Metrics */}
                          <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Metrics</h3>
                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Student Satisfaction</span>
                                <span className="font-medium">85%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-green-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                              </div>
                              
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Course Completion Rate</span>
                                <span className="font-medium">92%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                              </div>
                              
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Average Attendance</span>
                                <span className="font-medium">88%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '88%' }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'teachers' && (
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-medium text-gray-900">Department Teachers</h3>
                          <Button variant="primary" size="sm" icon={FiPlus}>
                            Add Teacher
                          </Button>
                        </div>
                        
                        {teachers.length > 0 ? (
                          <Table>
                            <Table.Header>
                              <Table.Row>
                                <Table.Head>Name</Table.Head>
                                <Table.Head>Employee ID</Table.Head>
                                <Table.Head>Specialization</Table.Head>
                                <Table.Head>Classes</Table.Head>
                                <Table.Head>Status</Table.Head>
                                <Table.Head>Actions</Table.Head>
                              </Table.Row>
                            </Table.Header>
                            <Table.Body>
                              {teachers.map((teacher, index) => (
                                <Table.Row key={index}>
                                  <Table.Cell>
                                    <div className="font-medium text-gray-900">
                                      {teacher.first_name} {teacher.last_name}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {teacher.email}
                                    </div>
                                  </Table.Cell>
                                  <Table.Cell>
                                    <span className="font-mono text-sm">{teacher.employee_id}</span>
                                  </Table.Cell>
                                  <Table.Cell>
                                    <span className="text-gray-900">{teacher.specialization}</span>
                                  </Table.Cell>
                                  <Table.Cell>
                                    <span className="font-medium">{teacher.class_count || 0}</span>
                                  </Table.Cell>
                                  <Table.Cell>
                                    <Badge variant={teacher.status === 'active' ? 'success' : 'danger'}>
                                      {teacher.status}
                                    </Badge>
                                  </Table.Cell>
                                  <Table.Cell>
                                    <div className="flex space-x-2">
                                      <Button variant="outline" size="sm" icon={FiEye}>
                                        View
                                      </Button>
                                      <Button variant="primary" size="sm" icon={FiEdit}>
                                        Edit
                                      </Button>
                                    </div>
                                  </Table.Cell>
                                </Table.Row>
                              ))}
                            </Table.Body>
                          </Table>
                        ) : (
                          <div className="text-center py-8">
                            <FiUsers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">No teachers found in this department.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'courses' && (
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-medium text-gray-900">Department Courses</h3>
                          <Button variant="primary" size="sm" icon={FiPlus}>
                            Add Course
                          </Button>
                        </div>
                        
                        {courses.length > 0 ? (
                          <Table>
                            <Table.Header>
                              <Table.Row>
                                <Table.Head>Course Name</Table.Head>
                                <Table.Head>Code</Table.Head>
                                <Table.Head>Credits</Table.Head>
                                <Table.Head>Instructor</Table.Head>
                                <Table.Head>Enrolled</Table.Head>
                                <Table.Head>Status</Table.Head>
                                <Table.Head>Actions</Table.Head>
                              </Table.Row>
                            </Table.Header>
                            <Table.Body>
                              {courses.map((course, index) => (
                                <Table.Row key={index}>
                                  <Table.Cell>
                                    <div className="font-medium text-gray-900">
                                      {course.name}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {course.description}
                                    </div>
                                  </Table.Cell>
                                  <Table.Cell>
                                    <span className="font-mono text-sm">{course.course_code}</span>
                                  </Table.Cell>
                                  <Table.Cell>
                                    <span className="text-gray-900">{course.credits}</span>
                                  </Table.Cell>
                                  <Table.Cell>
                                    <span className="text-gray-900">{course.instructor_name}</span>
                                  </Table.Cell>
                                  <Table.Cell>
                                    <span className="font-medium">{course.enrolled_count || 0}</span>
                                  </Table.Cell>
                                  <Table.Cell>
                                    <Badge variant={course.status === 'active' ? 'success' : 'warning'}>
                                      {course.status}
                                    </Badge>
                                  </Table.Cell>
                                  <Table.Cell>
                                    <div className="flex space-x-2">
                                      <Button variant="outline" size="sm" icon={FiEye}>
                                        View
                                      </Button>
                                      <Button variant="primary" size="sm" icon={FiEdit}>
                                        Edit
                                      </Button>
                                    </div>
                                  </Table.Cell>
                                </Table.Row>
                              ))}
                            </Table.Body>
                          </Table>
                        ) : (
                          <div className="text-center py-8">
                            <FiBook className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">No courses found in this department.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'students' && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Department Students</h3>
                        
                        {students.length > 0 ? (
                          <Table>
                            <Table.Header>
                              <Table.Row>
                                <Table.Head>Student ID</Table.Head>
                                <Table.Head>Name</Table.Head>
                                <Table.Head>Year</Table.Head>
                                <Table.Head>GPA</Table.Head>
                                <Table.Head>Courses</Table.Head>
                                <Table.Head>Status</Table.Head>
                                <Table.Head>Actions</Table.Head>
                              </Table.Row>
                            </Table.Header>
                            <Table.Body>
                              {students.map((student, index) => (
                                <Table.Row key={index}>
                                  <Table.Cell>
                                    <span className="font-mono text-sm">{student.id}</span>
                                  </Table.Cell>
                                  <Table.Cell>
                                    <div className="font-medium text-gray-900">
                                      {student.first_name} {student.last_name}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {student.email}
                                    </div>
                                  </Table.Cell>
                                  <Table.Cell>
                                    <span className="text-gray-900">{student.enrollment_year}</span>
                                  </Table.Cell>
                                  <Table.Cell>
                                    <span className="font-medium">
                                      {student.gpa ? student.gpa.toFixed(2) : 'N/A'}
                                    </span>
                                  </Table.Cell>
                                  <Table.Cell>
                                    <span className="text-gray-900">{student.course_count || 0}</span>
                                  </Table.Cell>
                                  <Table.Cell>
                                    <Badge variant={student.status === 'active' ? 'success' : 'warning'}>
                                      {student.status}
                                    </Badge>
                                  </Table.Cell>
                                  <Table.Cell>
                                    <Button variant="outline" size="sm" icon={FiEye}>
                                      View Profile
                                    </Button>
                                  </Table.Cell>
                                </Table.Row>
                              ))}
                            </Table.Body>
                          </Table>
                        ) : (
                          <div className="text-center py-8">
                            <FiUsers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">No students found in this department.</p>
                          </div>
                        )}
                      </div>
                    )}
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

export default HODDepartment;
