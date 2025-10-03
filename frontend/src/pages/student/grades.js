import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  FiTrendingUp,
  FiBook,
  FiCalendar,
  FiAward,
  FiBarChart3,
  FiTarget,
  FiStar,
  FiDownload,
  FiFilter,
  FiEye
} from 'react-icons/fi';
import { studentAPI } from '../../services/api';

const StudentGrades = () => {
  const [grades, setGrades] = useState([]);
  const [gpa, setGpa] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [viewMode, setViewMode] = useState('summary'); // 'summary' or 'detailed'

  // Fetch grades data
  useEffect(() => {
    const fetchGrades = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await studentAPI.getGrades();

        console.log('Grades data received:', data);

        setGrades(data.grades || []);
        setGpa(data.gpa || 0);
      } catch (err) {
        console.error('Error fetching grades:', err);
        setError(err.message || 'Failed to load grades');
      } finally {
        setLoading(false);
      }
    };

    fetchGrades();
  }, []);

  // Helper function to get grade letter from percentage
  const getGradeLetter = (percentage) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 85) return 'A';
    if (percentage >= 80) return 'A-';
    if (percentage >= 75) return 'B+';
    if (percentage >= 70) return 'B';
    if (percentage >= 65) return 'B-';
    if (percentage >= 60) return 'C+';
    if (percentage >= 55) return 'C';
    if (percentage >= 50) return 'C-';
    if (percentage >= 45) return 'D+';
    if (percentage >= 40) return 'D';
    return 'F';
  };

  // Helper function to get grade color
  const getGradeColor = (percentage) => {
    if (percentage >= 85) return 'text-green-600 bg-green-50';
    if (percentage >= 70) return 'text-blue-600 bg-blue-50';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-50';
    if (percentage >= 50) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  // Helper function to calculate percentage from score
  const calculatePercentage = (score, maxScore) => {
    if (!score || !maxScore || maxScore === 0) return 0;
    return Math.round((score / maxScore) * 100);
  };

  // Filter grades based on selected semester and course
  const filteredGrades = grades.filter(grade => {
    const semesterMatch = selectedSemester === 'all' || grade.semester === selectedSemester;
    const courseMatch = selectedCourse === 'all' || grade.course_name === selectedCourse;
    return semesterMatch && courseMatch;
  });

  // Get unique semesters and courses for filters
  const semesters = [...new Set(grades.map(grade => grade.semester))];
  const courses = [...new Set(grades.map(grade => grade.course_name))];

  // Calculate semester GPA
  const calculateSemesterGPA = (semester) => {
    const semesterGrades = grades.filter(grade => grade.semester === semester);
    if (semesterGrades.length === 0) return 0;
    
    const totalPoints = semesterGrades.reduce((sum, grade) => {
      const percentage = calculatePercentage(grade.score, grade.max_score);
      return sum + getGradePoints(percentage);
    }, 0);
    
    return (totalPoints / semesterGrades.length).toFixed(2);
  };

  // Helper function to get grade points
  const getGradePoints = (percentage) => {
    if (percentage >= 90) return 4.0;
    if (percentage >= 85) return 3.7;
    if (percentage >= 80) return 3.3;
    if (percentage >= 75) return 3.0;
    if (percentage >= 70) return 2.7;
    if (percentage >= 65) return 2.3;
    if (percentage >= 60) return 2.0;
    if (percentage >= 55) return 1.7;
    if (percentage >= 50) return 1.3;
    if (percentage >= 45) return 1.0;
    if (percentage >= 40) return 0.7;
    return 0.0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6">
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error Loading Grades</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Grades</h1>
                <p className="mt-2 text-gray-600">Track your academic performance and progress</p>
              </div>
              <div className="flex space-x-3">
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                  <FiDownload className="mr-2 h-4 w-4" />
                  Export
                </button>
                <div className="flex rounded-md shadow-sm">
                  <button
                    onClick={() => setViewMode('summary')}
                    className={`px-4 py-2 text-sm font-medium rounded-l-md border ${
                      viewMode === 'summary'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Summary
                  </button>
                  <button
                    onClick={() => setViewMode('detailed')}
                    className={`px-4 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
                      viewMode === 'detailed'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Detailed
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* GPA Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
                  <FiTrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Overall GPA</p>
                  <p className="text-2xl font-bold text-gray-900">{gpa.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mr-4">
                  <FiBook className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Courses</p>
                  <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mr-4">
                  <FiCalendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Semesters</p>
                  <p className="text-2xl font-bold text-gray-900">{semesters.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center mr-4">
                  <FiAward className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Assessments</p>
                  <p className="text-2xl font-bold text-gray-900">{grades.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex items-center space-x-4">
              <FiFilter className="h-5 w-5 text-gray-400" />
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Semester
                  </label>
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Semesters</option>
                    {semesters.map(semester => (
                      <option key={semester} value={semester}>{semester}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course
                  </label>
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Courses</option>
                    {courses.map(course => (
                      <option key={course} value={course}>{course}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Semester Performance Overview */}
          {viewMode === 'summary' && (
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Semester Performance</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {semesters.map(semester => (
                  <div key={semester} className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">{semester}</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">GPA:</span>
                        <span className="font-medium">{calculateSemesterGPA(semester)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Courses:</span>
                        <span className="font-medium">
                          {grades.filter(g => g.semester === semester).length}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Avg Score:</span>
                        <span className="font-medium">
                          {Math.round(
                            grades
                              .filter(g => g.semester === semester)
                              .reduce((sum, g) => sum + calculatePercentage(g.score, g.max_score), 0) /
                            grades.filter(g => g.semester === semester).length || 0
                          )}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grades Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {viewMode === 'summary' ? 'Recent Grades' : 'All Grades'}
              </h2>
            </div>

            {filteredGrades.length === 0 ? (
              <div className="text-center py-12">
                <FiBook className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No grades found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No grades available for the selected filters.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Course
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assessment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Grade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Semester
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      {viewMode === 'detailed' && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Comments
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredGrades.map((grade, index) => {
                      const percentage = calculatePercentage(grade.score, grade.max_score);
                      const gradeLetter = getGradeLetter(percentage);
                      const gradeColor = getGradeColor(percentage);

                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {grade.course_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {grade.course_code}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">
                              {grade.assessment_type || 'Assessment'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {grade.score}/{grade.max_score}
                            </div>
                            <div className="text-sm text-gray-500">
                              {percentage}%
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${gradeColor}`}>
                              {gradeLetter}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {grade.semester}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {grade.date_given ? new Date(grade.date_given).toLocaleDateString() : 'N/A'}
                          </td>
                          {viewMode === 'detailed' && (
                            <td className="px-6 py-4 text-sm text-gray-500">
                              <div className="max-w-xs truncate">
                                {grade.comments || 'No comments'}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

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
        </main>
      </div>
    </div>
  );
};

export default StudentGrades;
