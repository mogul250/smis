import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { teacherAPI } from '../../services/api';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { FiUsers, FiBook, FiCalendar, FiClipboard, FiEye, FiEdit } from 'react-icons/fi';

const TeacherClasses = () => {
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState(null);
  const [studentsView, setStudentsView] = useState(false);

  const { data: classes, loading: classesLoading, error: classesError } = useApi(teacherAPI.getClasses);
  const { data: students, loading: studentsLoading, execute: loadStudents } = useApi(
    () => teacherAPI.getClassStudents(selectedClass?.id),
    []
  );

  React.useEffect(() => {
    if (selectedClass && studentsView) {
      loadStudents();
    }
  }, [selectedClass, studentsView, loadStudents]);

  if (!user || user.role !== 'teacher') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="error">Access denied. Teacher access required.</Alert>
      </div>
    );
  }

  const handleViewStudents = (classItem) => {
    setSelectedClass(classItem);
    setStudentsView(true);
  };

  const handleBackToClasses = () => {
    setStudentsView(false);
    setSelectedClass(null);
  };

  const handleMarkAttendance = (classItem) => {
    // Navigate to attendance marking page
    window.location.href = `/teacher/attendance?class=${classItem.id}`;
  };

  const handleEnterGrades = (classItem) => {
    // Navigate to grade entry page
    window.location.href = `/teacher/grades?class=${classItem.id}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Sidebar />
      <main className="lg:pl-64 pt-16 min-h-screen">
        <div className="p-4 sm:p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {studentsView ? `Students in ${selectedClass?.name}` : 'My Classes'}
                </h1>
                <p className="text-gray-600">
                  {studentsView 
                    ? 'Manage students in this class' 
                    : 'Manage your assigned classes and students'
                  }
                </p>
              </div>
              {studentsView && (
                <Button
                  variant="secondary"
                  onClick={handleBackToClasses}
                >
                  Back to Classes
                </Button>
              )}
            </div>

            {!studentsView ? (
              // Classes View
              <>
                {classesLoading ? (
                  <Card className="flex justify-center py-12">
                    <LoadingSpinner size="lg" />
                  </Card>
                ) : classesError ? (
                  <Alert variant="error">
                    Failed to load classes: {classesError}
                  </Alert>
                ) : classes && classes.length > 0 ? (
                  <>
                    {/* Classes Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card>
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-primary-blue rounded-lg flex items-center justify-center mr-4">
                            <FiBook className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Total Classes</p>
                            <p className="text-2xl font-bold text-gray-900">{classes.length}</p>
                          </div>
                        </div>
                      </Card>
                      
                      <Card>
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-accent-green rounded-lg flex items-center justify-center mr-4">
                            <FiUsers className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Total Students</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {classes.reduce((sum, cls) => sum + (cls.student_count || 0), 0)}
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
                            <p className="text-sm font-medium text-gray-600">Departments</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {new Set(classes.map(cls => cls.department_name)).size}
                            </p>
                          </div>
                        </div>
                      </Card>
                    </div>

                    {/* Classes Table */}
                    <Card>
                      <Card.Header>
                        <Card.Title>Assigned Classes</Card.Title>
                      </Card.Header>
                      
                      <Table>
                        <Table.Header>
                          <Table.Row>
                            <Table.Head>Course</Table.Head>
                            <Table.Head>Code</Table.Head>
                            <Table.Head>Department</Table.Head>
                            <Table.Head>Students</Table.Head>
                            <Table.Head>Credits</Table.Head>
                            <Table.Head>Actions</Table.Head>
                          </Table.Row>
                        </Table.Header>
                        <Table.Body>
                          {classes.map((classItem, index) => (
                            <Table.Row key={index}>
                              <Table.Cell>
                                <div className="font-medium text-gray-900">
                                  {classItem.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {classItem.description}
                                </div>
                              </Table.Cell>
                              <Table.Cell>
                                <span className="font-mono text-sm">
                                  {classItem.course_code}
                                </span>
                              </Table.Cell>
                              <Table.Cell>
                                <span className="text-gray-900">
                                  {classItem.department_name}
                                </span>
                              </Table.Cell>
                              <Table.Cell>
                                <span className="font-medium">
                                  {classItem.student_count || 0}
                                </span>
                              </Table.Cell>
                              <Table.Cell>
                                <span className="text-gray-900">
                                  {classItem.credits || 3}
                                </span>
                              </Table.Cell>
                              <Table.Cell>
                                <div className="flex space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    icon={FiEye}
                                    onClick={() => handleViewStudents(classItem)}
                                  >
                                    Students
                                  </Button>
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    icon={FiClipboard}
                                    onClick={() => handleMarkAttendance(classItem)}
                                  >
                                    Attendance
                                  </Button>
                                  <Button
                                    variant="success"
                                    size="sm"
                                    icon={FiEdit}
                                    onClick={() => handleEnterGrades(classItem)}
                                  >
                                    Grades
                                  </Button>
                                </div>
                              </Table.Cell>
                            </Table.Row>
                          ))}
                        </Table.Body>
                      </Table>
                    </Card>
                  </>
                ) : (
                  <Card className="text-center py-12">
                    <FiBook className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Assigned</h3>
                    <p className="text-gray-500">
                      You don't have any classes assigned yet. Contact your department head for class assignments.
                    </p>
                  </Card>
                )}
              </>
            ) : (
              // Students View
              <>
                {studentsLoading ? (
                  <Card className="flex justify-center py-12">
                    <LoadingSpinner size="lg" />
                  </Card>
                ) : students && students.length > 0 ? (
                  <Card>
                    <Card.Header>
                      <div className="flex justify-between items-center">
                        <Card.Title>Class Roster</Card.Title>
                        <div className="flex space-x-2">
                          <Button
                            variant="primary"
                            icon={FiClipboard}
                            onClick={() => handleMarkAttendance(selectedClass)}
                          >
                            Mark Attendance
                          </Button>
                          <Button
                            variant="success"
                            icon={FiEdit}
                            onClick={() => handleEnterGrades(selectedClass)}
                          >
                            Enter Grades
                          </Button>
                        </div>
                      </div>
                    </Card.Header>
                    
                    <Table>
                      <Table.Header>
                        <Table.Row>
                          <Table.Head>Student ID</Table.Head>
                          <Table.Head>Name</Table.Head>
                          <Table.Head>Email</Table.Head>
                          <Table.Head>Enrollment Year</Table.Head>
                          <Table.Head>Status</Table.Head>
                          <Table.Head>Actions</Table.Head>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {students.map((student, index) => (
                          <Table.Row key={index}>
                            <Table.Cell>
                              <span className="font-mono text-sm">
                                {student.id}
                              </span>
                            </Table.Cell>
                            <Table.Cell>
                              <div className="font-medium text-gray-900">
                                {student.first_name} {student.last_name}
                              </div>
                            </Table.Cell>
                            <Table.Cell>
                              <span className="text-gray-600">
                                {student.email}
                              </span>
                            </Table.Cell>
                            <Table.Cell>
                              <span className="text-gray-900">
                                {student.enrollment_year}
                              </span>
                            </Table.Cell>
                            <Table.Cell>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                student.status === 'active' 
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {student.status}
                              </span>
                            </Table.Cell>
                            <Table.Cell>
                              <Button
                                variant="outline"
                                size="sm"
                                icon={FiEye}
                              >
                                View Profile
                              </Button>
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table>
                  </Card>
                ) : (
                  <Card className="text-center py-12">
                    <FiUsers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Enrolled</h3>
                    <p className="text-gray-500">
                      This class doesn't have any students enrolled yet.
                    </p>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeacherClasses;
