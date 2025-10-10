import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  FiSave,
  FiEdit,
  FiEye,
  FiBarChart,
  FiUsers,
  FiPlus,
  FiTrash2,
  FiCheck,
  FiX,
  FiFilter,
  FiDownload
} from 'react-icons/fi';
import { teacherAPI } from '../../services/api';

const TeacherGrades = () => {
  const router = useRouter();
  const { courseId } = router.query;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(courseId || '');
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('Fall 2024');
  
  const [gradeEntries, setGradeEntries] = useState({});
  const [editMode, setEditMode] = useState(false);

  // Fetch teacher's courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const courses = await teacherAPI.getClasses();
        setCourses(courses || []);
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError('Failed to load courses');
      }
    };

    fetchCourses();
  }, []);

  // Fetch students and grades for selected course
  useEffect(() => {
    if (!selectedCourse) {
      setLoading(false);
      return;
    }

    const fetchCourseData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch students in the course
        const studentsData = await teacherAPI.getClassStudents(parseInt(selectedCourse));
        setStudents(studentsData || []);

        // For now, initialize empty grades since we need to implement the getClassGrades method
        const gradesData = [];
        setGrades(gradesData);

        // Initialize grade entries
        const entries = {};
        (studentsData || []).forEach(student => {
          const existingGrade = gradesData.find(g => g.student_id === student.id);
          entries[student.id] = {
            assessment_type: existingGrade?.assessment_type || 'assignment',
            score: existingGrade?.score || '',
            max_score: existingGrade?.max_score || 100,
            comments: existingGrade?.comments || ''
          };
        });
        setGradeEntries(entries);

      } catch (err) {
        console.error('Error fetching course data:', err);
        setError('Failed to load course data');
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [selectedCourse, selectedSemester]);

  // Handle grade entry changes
  const handleGradeChange = (studentId, field, value) => {
    setGradeEntries(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  // Calculate percentage and grade letter
  const calculateGrade = (score, maxScore) => {
    if (!score || !maxScore || maxScore === 0) return { percentage: 0, letter: 'F' };
    const percentage = Math.round((score / maxScore) * 100);
    let letter = 'F';
    
    if (percentage >= 90) letter = 'A+';
    else if (percentage >= 85) letter = 'A';
    else if (percentage >= 80) letter = 'A-';
    else if (percentage >= 75) letter = 'B+';
    else if (percentage >= 70) letter = 'B';
    else if (percentage >= 65) letter = 'B-';
    else if (percentage >= 60) letter = 'C+';
    else if (percentage >= 55) letter = 'C';
    else if (percentage >= 50) letter = 'C-';
    else if (percentage >= 45) letter = 'D+';
    else if (percentage >= 40) letter = 'D';
    
    return { percentage, letter };
  };

  // Save grades
  const handleSaveGrades = async () => {
    if (!selectedCourse) return;

    try {
      setSaving(true);
      setError(null);

      const gradesToSave = Object.entries(gradeEntries)
        .filter(([studentId, entry]) => entry.score && entry.score !== '')
        .map(([studentId, entry]) => {
          const { percentage, letter } = calculateGrade(entry.score, entry.max_score);
          return {
            student: parseInt(studentId),
            grade: letter,
            semester: selectedSemester,
            date: new Date().toISOString().split('T')[0],
            comments: entry.comments,
            max_score: entry.max_score,
            type: entry.assessment_type,
            score: parseFloat(entry.score)
          };
        });

      if (gradesToSave.length === 0) {
        setError('No grades to save');
        return;
      }

      await teacherAPI.enterGrades({
        courseId: parseInt(selectedCourse),
        grades: gradesToSave
      });

      setSuccess('Grades saved successfully!');
      setEditMode(false);

      // For now, we'll just clear the grades since we need to implement the refresh method
      setGrades([]);

      setTimeout(() => setSuccess(null), 5000);

    } catch (err) {
      console.error('Error saving grades:', err);
      setError(err.response?.data?.message || 'Failed to save grades');
    } finally {
      setSaving(false);
    }
  };

  // Calculate class statistics
  const classStats = React.useMemo(() => {
    const validGrades = Object.values(gradeEntries).filter(entry => 
      entry.score && entry.max_score && entry.score !== ''
    );
    
    if (validGrades.length === 0) {
      return { average: 0, highest: 0, lowest: 0, graded: 0, total: students.length };
    }

    const percentages = validGrades.map(entry => 
      (parseFloat(entry.score) / parseFloat(entry.max_score)) * 100
    );

    return {
      average: Math.round(percentages.reduce((sum, p) => sum + p, 0) / percentages.length),
      highest: Math.round(Math.max(...percentages)),
      lowest: Math.round(Math.min(...percentages)),
      graded: validGrades.length,
      total: students.length
    };
  }, [gradeEntries, students]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Sidebar />
        <main className="lg:pl-64 pt-16 min-h-screen">
          <div className="p-4 sm:p-6">
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Sidebar />
      <main className="lg:pl-64 pt-16 min-h-screen">
        <div className="p-4 sm:p-6">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Grade Management</h1>
                <p className="mt-2 text-gray-600">Enter and manage student grades</p>
              </div>
              <div className="flex space-x-3">
                <button 
                  onClick={() => setEditMode(!editMode)}
                  className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium ${
                    editMode 
                      ? 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100'
                      : 'border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100'
                  }`}
                >
                  {editMode ? <FiX className="mr-2 h-4 w-4" /> : <FiEdit className="mr-2 h-4 w-4" />}
                  {editMode ? 'Cancel Edit' : 'Edit Grades'}
                </button>
                {editMode && (
                  <button
                    onClick={handleSaveGrades}
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? (
                      <LoadingSpinner size="sm" className="mr-2" />
                    ) : (
                      <FiSave className="mr-2 h-4 w-4" />
                    )}
                    Save Grades
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <FiX className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex">
                <FiCheck className="h-5 w-5 text-green-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Success</h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>{success}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Course and Semester Selection */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Course
                </label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a course</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.name} ({course.course_code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Semester
                </label>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Fall 2024">Fall 2024</option>
                  <option value="Spring 2024">Spring 2024</option>
                  <option value="Summer 2024">Summer 2024</option>
                </select>
              </div>
            </div>
          </div>

          {/* Class Statistics */}
          {selectedCourse && students.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
                    <FiUsers className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Students</p>
                    <p className="text-2xl font-bold text-gray-900">{classStats.total}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mr-4">
                    <FiCheck className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Graded</p>
                    <p className="text-2xl font-bold text-gray-900">{classStats.graded}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center mr-4">
                    <FiBarChart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Class Average</p>
                    <p className="text-2xl font-bold text-gray-900">{classStats.average}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mr-4">
                    <FiBarChart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Highest</p>
                    <p className="text-2xl font-bold text-gray-900">{classStats.highest}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center mr-4">
                    <FiBarChart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Lowest</p>
                    <p className="text-2xl font-bold text-gray-900">{classStats.lowest}%</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Students and Grades Table */}
          {selectedCourse ? (
            students.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <FiUsers className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No students are enrolled in this course.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Student Grades</h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Assessment Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Score
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Max Score
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Percentage
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Grade
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Comments
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {students.map((student) => {
                        const entry = gradeEntries[student.id] || {};
                        const { percentage, letter } = calculateGrade(entry.score, entry.max_score);

                        return (
                          <tr key={student.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                                  <span className="text-sm font-medium text-gray-700">
                                    {student.first_name?.[0]}{student.last_name?.[0]}
                                  </span>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {student.first_name} {student.last_name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    ID: {student.student_id || student.id}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {editMode ? (
                                <select
                                  value={entry.assessment_type || 'assignment'}
                                  onChange={(e) => handleGradeChange(student.id, 'assessment_type', e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                >
                                  <option value="assignment">Assignment</option>
                                  <option value="quiz">Quiz</option>
                                  <option value="midterm">Midterm</option>
                                  <option value="final">Final Exam</option>
                                  <option value="project">Project</option>
                                  <option value="participation">Participation</option>
                                </select>
                              ) : (
                                <span className="text-sm text-gray-900">
                                  {entry.assessment_type || 'Assignment'}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {editMode ? (
                                <input
                                  type="number"
                                  value={entry.score || ''}
                                  onChange={(e) => handleGradeChange(student.id, 'score', e.target.value)}
                                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="0"
                                  min="0"
                                  step="0.1"
                                />
                              ) : (
                                <span className="text-sm text-gray-900">
                                  {entry.score || '-'}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {editMode ? (
                                <input
                                  type="number"
                                  value={entry.max_score || 100}
                                  onChange={(e) => handleGradeChange(student.id, 'max_score', e.target.value)}
                                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="100"
                                  min="1"
                                />
                              ) : (
                                <span className="text-sm text-gray-900">
                                  {entry.max_score || 100}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-900">
                                {entry.score ? `${percentage}%` : '-'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {entry.score ? (
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  percentage >= 85 ? 'text-green-600 bg-green-50' :
                                  percentage >= 70 ? 'text-blue-600 bg-blue-50' :
                                  percentage >= 60 ? 'text-yellow-600 bg-yellow-50' :
                                  percentage >= 50 ? 'text-orange-600 bg-orange-50' :
                                  'text-red-600 bg-red-50'
                                }`}>
                                  {letter}
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {editMode ? (
                                <input
                                  type="text"
                                  value={entry.comments || ''}
                                  onChange={(e) => handleGradeChange(student.id, 'comments', e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="Optional comments"
                                />
                              ) : (
                                <span className="text-sm text-gray-500">
                                  {entry.comments || '-'}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <FiBarChart className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Select a Course</h3>
              <p className="mt-1 text-sm text-gray-500">
                Choose a course from the dropdown above to manage grades.
              </p>
            </div>
          )}

          {/* Grade Scale Reference */}
          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Grade Scale Reference</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-blue-800">A+ (90-100%)</div>
                <div className="text-blue-600">4.0 GPA</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-blue-800">A (85-89%)</div>
                <div className="text-blue-600">3.7 GPA</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-blue-800">A- (80-84%)</div>
                <div className="text-blue-600">3.3 GPA</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-blue-800">B+ (75-79%)</div>
                <div className="text-blue-600">3.0 GPA</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-blue-800">B (70-74%)</div>
                <div className="text-blue-600">2.7 GPA</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-blue-800">B- (65-69%)</div>
                <div className="text-blue-600">2.3 GPA</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeacherGrades;
