import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { useApi, useAsyncOperation } from '../../hooks/useApi';
import { teacherAPI } from '../../services/apiService';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { FiSave, FiEdit, FiEye, FiBarChart, FiUsers } from 'react-icons/fi';

const TeacherGrades = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { class: classId } = router.query;
  
  const [selectedSemester, setSelectedSemester] = useState('current');
  const [gradeData, setGradeData] = useState({});
  const [comments, setComments] = useState({});
  const [saveMessage, setSaveMessage] = useState(null);

  const { data: classes, loading: classesLoading } = useApi(teacherAPI.getClasses);
  const { data: students, loading: studentsLoading, execute: loadStudents } = useApi(
    () => teacherAPI.getClassStudents(classId),
    []
  );
  
  const { data: existingGrades, loading: gradesLoading, execute: loadGrades } = useApi(
    () => teacherAPI.getClassGrades(classId, selectedSemester),
    []
  );

  const { loading: saving, execute: saveGrades } = useAsyncOperation();

  const selectedClass = classes?.find(c => c.id === parseInt(classId));

  React.useEffect(() => {
    if (classId) {
      loadStudents();
      loadGrades();
    }
  }, [classId, selectedSemester, loadStudents, loadGrades]);

  React.useEffect(() => {
    // Initialize grade data when students and existing grades load
    if (students && existingGrades) {
      const initialGrades = {};
      const initialComments = {};
      
      students.forEach(student => {
        const existingGrade = existingGrades.find(g => g.student_id === student.id);
        initialGrades[student.id] = existingGrade?.grade || '';
        initialComments[student.id] = existingGrade?.comments || '';
      });
      
      setGradeData(initialGrades);
      setComments(initialComments);
    }
  }, [students, existingGrades]);

  if (!user || user.role !== 'teacher') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="error">Access denied. Teacher access required.</Alert>
      </div>
    );
  }

  const handleGradeChange = (studentId, grade) => {
    setGradeData(prev => ({
      ...prev,
      [studentId]: grade
    }));
  };

  const handleCommentChange = (studentId, comment) => {
    setComments(prev => ({
      ...prev,
      [studentId]: comment
    }));
  };

  const handleSaveGrades = async () => {
    if (!classId || !students) return;

    try {
      const gradeRecords = students.map(student => ({
        studentId: student.id,
        grade: gradeData[student.id] || '',
        comments: comments[student.id] || '',
        semester: selectedSemester === 'current' ? 'Fall 2024' : selectedSemester
      })).filter(record => record.grade); // Only save records with grades

      await saveGrades(() => 
        teacherAPI.submitGrades({
          courseId: parseInt(classId),
          grades: gradeRecords
        })
      );

      setSaveMessage({ type: 'success', text: 'Grades saved successfully!' });
      setTimeout(() => setSaveMessage(null), 5000);
    } catch (error) {
      setSaveMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to save grades' 
      });
    }
  };

  const validateGrade = (grade) => {
    const validGrades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F'];
    return validGrades.includes(grade.toUpperCase());
  };

  const getGradePoints = (grade) => {
    const gradeMap = {
      'A+': 4.0, 'A': 4.0, 'A-': 3.7,
      'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7,
      'D+': 1.3, 'D': 1.0, 'F': 0.0
    };
    return gradeMap[grade.toUpperCase()] || 0;
  };

  const gradeStats = React.useMemo(() => {
    if (!students || !gradeData) return { total: 0, graded: 0, avgGPA: 0 };
    
    const gradedStudents = students.filter(student => gradeData[student.id]);
    const totalPoints = gradedStudents.reduce((sum, student) => {
      return sum + getGradePoints(gradeData[student.id]);
    }, 0);
    
    return {
      total: students.length,
      graded: gradedStudents.length,
      avgGPA: gradedStudents.length > 0 ? (totalPoints / gradedStudents.length).toFixed(2) : 0
    };
  }, [students, gradeData]);

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
                <h1 className="text-2xl font-bold text-gray-900">Grade Entry</h1>
                <p className="text-gray-600">
                  {selectedClass ? `${selectedClass.name} (${selectedClass.course_code})` : 'Select a class'}
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={() => router.push('/teacher/classes')}
              >
                Back to Classes
              </Button>
            </div>

            {saveMessage && (
              <Alert 
                variant={saveMessage.type}
                dismissible
                onDismiss={() => setSaveMessage(null)}
              >
                {saveMessage.text}
              </Alert>
            )}

            {/* Class and Semester Selection */}
            <Card>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Class
                  </label>
                  <select
                    value={classId || ''}
                    onChange={(e) => router.push(`/teacher/grades?class=${e.target.value}`)}
                    className="form-select"
                    disabled={classesLoading}
                  >
                    <option value="">Select a class</option>
                    {classes?.map(cls => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} ({cls.course_code})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Semester
                  </label>
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    className="form-select"
                  >
                    <option value="current">Current Semester</option>
                    <option value="Fall 2024">Fall 2024</option>
                    <option value="Spring 2024">Spring 2024</option>
                    <option value="Summer 2024">Summer 2024</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <Button
                    variant="primary"
                    icon={FiSave}
                    onClick={handleSaveGrades}
                    loading={saving}
                    disabled={!classId || !students || students.length === 0}
                    className="w-full"
                  >
                    Save Grades
                  </Button>
                </div>
              </div>
            </Card>

            {studentsLoading || gradesLoading ? (
              <Card className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </Card>
            ) : !classId ? (
              <Card className="text-center py-12">
                <FiBarChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Class</h3>
                <p className="text-gray-500">
                  Choose a class from the dropdown above to enter grades.
                </p>
              </Card>
            ) : students && students.length > 0 ? (
              <>
                {/* Grade Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-primary-blue rounded-lg flex items-center justify-center mr-4">
                        <FiUsers className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Students</p>
                        <p className="text-2xl font-bold text-gray-900">{gradeStats.total}</p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-accent-green rounded-lg flex items-center justify-center mr-4">
                        <FiEdit className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Graded</p>
                        <p className="text-2xl font-bold text-gray-900">{gradeStats.graded}</p>
                        <p className="text-xs text-gray-500">
                          {gradeStats.total > 0 ? Math.round((gradeStats.graded / gradeStats.total) * 100) : 0}% complete
                        </p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-accent-orange rounded-lg flex items-center justify-center mr-4">
                        <FiBarChart className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Class Average</p>
                        <p className="text-2xl font-bold text-gray-900">{gradeStats.avgGPA}</p>
                        <p className="text-xs text-gray-500">GPA</p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Grade Entry Table */}
                <Card>
                  <Card.Header>
                    <Card.Title>Student Grades - {selectedSemester}</Card.Title>
                  </Card.Header>
                  
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Grade Scale</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div><strong>A+/A:</strong> 4.0</div>
                      <div><strong>A-:</strong> 3.7</div>
                      <div><strong>B+:</strong> 3.3</div>
                      <div><strong>B:</strong> 3.0</div>
                      <div><strong>B-:</strong> 2.7</div>
                      <div><strong>C+:</strong> 2.3</div>
                      <div><strong>C:</strong> 2.0</div>
                      <div><strong>C-:</strong> 1.7</div>
                      <div><strong>D+:</strong> 1.3</div>
                      <div><strong>D:</strong> 1.0</div>
                      <div><strong>F:</strong> 0.0</div>
                    </div>
                  </div>
                  
                  <Table>
                    <Table.Header>
                      <Table.Row>
                        <Table.Head>Student ID</Table.Head>
                        <Table.Head>Name</Table.Head>
                        <Table.Head>Grade</Table.Head>
                        <Table.Head>GPA Points</Table.Head>
                        <Table.Head>Comments</Table.Head>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {students.map((student, index) => {
                        const grade = gradeData[student.id] || '';
                        const isValidGrade = grade ? validateGrade(grade) : true;
                        const gpaPoints = grade ? getGradePoints(grade) : 0;
                        
                        return (
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
                              <div className="text-sm text-gray-500">
                                {student.email}
                              </div>
                            </Table.Cell>
                            <Table.Cell>
                              <div className="w-24">
                                <input
                                  type="text"
                                  value={grade}
                                  onChange={(e) => handleGradeChange(student.id, e.target.value.toUpperCase())}
                                  placeholder="A, B+, C..."
                                  className={`form-input text-center font-medium ${
                                    !isValidGrade ? 'border-red-300 bg-red-50' : ''
                                  }`}
                                />
                                {!isValidGrade && (
                                  <p className="text-xs text-red-600 mt-1">Invalid grade</p>
                                )}
                              </div>
                            </Table.Cell>
                            <Table.Cell>
                              <span className="font-medium text-gray-900">
                                {grade ? gpaPoints.toFixed(1) : '-'}
                              </span>
                            </Table.Cell>
                            <Table.Cell>
                              <input
                                type="text"
                                value={comments[student.id] || ''}
                                onChange={(e) => handleCommentChange(student.id, e.target.value)}
                                placeholder="Optional comments..."
                                className="form-input text-sm"
                              />
                            </Table.Cell>
                          </Table.Row>
                        );
                      })}
                    </Table.Body>
                  </Table>
                </Card>
              </>
            ) : (
              <Card className="text-center py-12">
                <FiUsers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
                <p className="text-gray-500">
                  This class doesn't have any students enrolled.
                </p>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default TeacherGrades;
