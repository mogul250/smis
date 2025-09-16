import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { studentAPI } from '../../services/apiService';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { FiTrendingUp, FiBook, FiCalendar, FiAward } from 'react-icons/fi';

const StudentGrades = () => {
  const { user } = useAuth();
  const [selectedSemester, setSelectedSemester] = useState('all');
  
  const { data: gradesData, loading, error } = useApi(studentAPI.getGrades);

  if (!user || user.role !== 'student') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="error">Access denied. Student access required.</Alert>
      </div>
    );
  }

  const grades = gradesData?.grades || [];
  const gpa = gradesData?.gpa || 0;

  // Filter grades by semester
  const filteredGrades = selectedSemester === 'all' 
    ? grades 
    : grades.filter(grade => grade.semester === selectedSemester);

  // Get unique semesters
  const semesters = [...new Set(grades.map(grade => grade.semester))].sort();

  // Calculate semester statistics
  const semesterStats = semesters.map(semester => {
    const semesterGrades = grades.filter(g => g.semester === semester);
    const totalCredits = semesterGrades.reduce((sum, g) => sum + (g.credits || 3), 0);
    const gradePoints = semesterGrades.reduce((sum, g) => {
      const points = getGradePoints(g.grade);
      return sum + (points * (g.credits || 3));
    }, 0);
    const semesterGPA = totalCredits > 0 ? (gradePoints / totalCredits).toFixed(2) : 0;
    
    return {
      semester,
      courses: semesterGrades.length,
      gpa: semesterGPA,
      credits: totalCredits
    };
  });

  function getGradePoints(grade) {
    const gradeMap = {
      'A+': 4.0, 'A': 4.0, 'A-': 3.7,
      'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7,
      'D+': 1.3, 'D': 1.0, 'F': 0.0
    };
    return gradeMap[grade] || 0;
  }

  function getGradeBadgeVariant(grade) {
    if (['A+', 'A', 'A-'].includes(grade)) return 'success';
    if (['B+', 'B', 'B-'].includes(grade)) return 'primary';
    if (['C+', 'C', 'C-'].includes(grade)) return 'warning';
    return 'danger';
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Page Header */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Academic Grades</h1>
              <p className="text-gray-600">View your academic performance and GPA</p>
            </div>

            {loading ? (
              <Card className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </Card>
            ) : error ? (
              <Alert variant="error">
                Failed to load grades: {error}
              </Alert>
            ) : (
              <>
                {/* GPA Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-primary-blue rounded-lg flex items-center justify-center mr-4">
                        <FiTrendingUp className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Overall GPA</p>
                        <p className="text-2xl font-bold text-gray-900">{gpa.toFixed(2)}</p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-accent-green rounded-lg flex items-center justify-center mr-4">
                        <FiBook className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Courses</p>
                        <p className="text-2xl font-bold text-gray-900">{grades.length}</p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-accent-orange rounded-lg flex items-center justify-center mr-4">
                        <FiCalendar className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Semesters</p>
                        <p className="text-2xl font-bold text-gray-900">{semesters.length}</p>
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
                          {grades.filter(g => ['A+', 'A', 'A-'].includes(g.grade)).length}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Semester Performance */}
                <Card>
                  <Card.Header>
                    <Card.Title>Semester Performance</Card.Title>
                  </Card.Header>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {semesterStats.map((stat, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900">{stat.semester}</h3>
                        <div className="mt-2 space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">GPA:</span>
                            <span className="font-medium">{stat.gpa}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Courses:</span>
                            <span className="font-medium">{stat.courses}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Credits:</span>
                            <span className="font-medium">{stat.credits}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Grades Table */}
                <Card>
                  <Card.Header>
                    <div className="flex justify-between items-center">
                      <Card.Title>Course Grades</Card.Title>
                      <select
                        value={selectedSemester}
                        onChange={(e) => setSelectedSemester(e.target.value)}
                        className="form-select w-auto"
                      >
                        <option value="all">All Semesters</option>
                        {semesters.map(semester => (
                          <option key={semester} value={semester}>{semester}</option>
                        ))}
                      </select>
                    </div>
                  </Card.Header>
                  
                  {filteredGrades.length > 0 ? (
                    <Table>
                      <Table.Header>
                        <Table.Row>
                          <Table.Head>Course</Table.Head>
                          <Table.Head>Code</Table.Head>
                          <Table.Head>Semester</Table.Head>
                          <Table.Head>Year</Table.Head>
                          <Table.Head>Grade</Table.Head>
                          <Table.Head>Credits</Table.Head>
                          <Table.Head>Comments</Table.Head>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {filteredGrades.map((grade, index) => (
                          <Table.Row key={index}>
                            <Table.Cell>
                              <div className="font-medium text-gray-900">
                                {grade.course_name}
                              </div>
                            </Table.Cell>
                            <Table.Cell>
                              <span className="text-gray-600">{grade.course_code}</span>
                            </Table.Cell>
                            <Table.Cell>{grade.semester}</Table.Cell>
                            <Table.Cell>{grade.year}</Table.Cell>
                            <Table.Cell>
                              <Badge variant={getGradeBadgeVariant(grade.grade)}>
                                {grade.grade}
                              </Badge>
                            </Table.Cell>
                            <Table.Cell>{grade.credits || 3}</Table.Cell>
                            <Table.Cell>
                              <span className="text-sm text-gray-600">
                                {grade.comments || '-'}
                              </span>
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No grades found for the selected semester.</p>
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

export default StudentGrades;
