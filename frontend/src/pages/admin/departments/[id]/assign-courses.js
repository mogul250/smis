import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../../hooks/useAuth';
import { adminAPI } from '../../../../services/api';
import Layout from '../../../../components/common/Layout';
import LoadingSpinner from '../../../../components/common/LoadingSpinner';
import Card from '../../../../components/common/Card';
import Button from '../../../../components/common/Button';
import Badge from '../../../../components/common/Badge';
import Alert from '../../../../components/common/Alert';
import { Input } from '../../../../components/ui/input';
import {
  FiArrowLeft,
  FiBook,
  FiBookOpen,
  FiSearch,
  FiCheck,
  FiX,
  FiPlus,
  FiMinus,
  FiRefreshCw
} from 'react-icons/fi';

const AssignCoursesPage = () => {
  const router = useRouter();
  const { id: departmentId } = router.query;
  const { user, isAuthenticated } = useAuth();

  // State management
  const [department, setDepartment] = useState(null);
  const [allCourses, setAllCourses] = useState([]);
  const [assignedCourses, setAssignedCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourses, setSelectedCourses] = useState(new Set());

  // Fetch data
  const fetchData = async () => {
    if (!departmentId) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch department details
      const departmentData = await adminAPI.getDepartmentById(parseInt(departmentId));
      setDepartment(departmentData);

      // Fetch all courses
      const allCoursesResponse = await adminAPI.getAllCourses(1, 100);
      const courses = allCoursesResponse.courses || allCoursesResponse || [];
      setAllCourses(courses);

      // Fetch currently assigned courses for this department
      const assignedCoursesData = await fetchDepartmentCourses(parseInt(departmentId));
      setAssignedCourses(assignedCoursesData || []);

      // Calculate available courses (not yet assigned to this department)
      const assignedIds = new Set((assignedCoursesData || []).map(c => c.id));
      const available = courses.filter(course => !assignedIds.has(course.id));
      setAvailableCourses(available);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch courses for this specific department
  const fetchDepartmentCourses = async (deptId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/admin/departments/${deptId}/courses`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.warn('Department courses endpoint not found, using alternative approach');
        return [];
      }
      
      return await response.json();
    } catch (error) {
      console.warn('Error fetching department courses:', error);
      return [];
    }
  };

  // Handle course selection
  const handleCourseSelect = (courseId) => {
    const newSelected = new Set(selectedCourses);
    if (newSelected.has(courseId)) {
      newSelected.delete(courseId);
    } else {
      newSelected.add(courseId);
    }
    setSelectedCourses(newSelected);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (selectedCourses.size === 0) return;

    try {
      setSubmitting(true);
      setError(null);

      // Assign selected courses to department
      const response = await fetch(`http://localhost:3001/api/admin/departments/assign-courses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          courses: Array.from(selectedCourses),
          departmentId: parseInt(departmentId)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to assign courses');
      }

      // Redirect back to department view
      router.push(`/admin/departments/${departmentId}/view`);

    } catch (err) {
      console.error('Error assigning courses:', err);
      setError(err.message || 'Failed to assign courses');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter available courses based on search
  const filteredCourses = availableCourses.filter(course =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.course_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  useEffect(() => {
    if (departmentId && isAuthenticated && user?.role === 'admin') {
      fetchData();
    }
  }, [departmentId, isAuthenticated, user]);

  // Check authentication and authorization
  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <Alert variant="error">Access denied. Admin access required.</Alert>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout maxWidth="max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout maxWidth="max-w-7xl mx-auto" enableAnimation={true}>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              icon={FiArrowLeft}
              onClick={() => router.push(`/admin/departments/${departmentId}/view`)}
            >
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <FiBookOpen className="mr-3 text-blue-600" />
                Assign Courses to {department?.name}
              </h1>
              <p className="text-gray-600 mt-1">
                Select courses to assign to this department
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/departments/${departmentId}/view`)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={FiPlus}
              onClick={handleSubmit}
              disabled={submitting || selectedCourses.size === 0}
              loading={submitting}
            >
              {submitting ? 'Assigning...' : `Assign ${selectedCourses.size} Course${selectedCourses.size !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {/* Search Section */}
      <Card className="mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </Card>

      {/* Available Courses Section */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <FiBook className="mr-2 text-blue-600" />
            Available Courses ({filteredCourses.length})
          </h2>
        </div>

        {filteredCourses.length === 0 ? (
          <div className="text-center py-12">
            <FiBook className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No courses available</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm ? 'No courses match your search criteria.' : 'All courses are already assigned to this department.'}
            </p>
            {searchTerm && (
              <Button
                variant="outline"
                onClick={() => setSearchTerm('')}
              >
                Clear Search
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Select
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Credits
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Semester
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleCourseSelect(course.id)}
                        className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                          selectedCourses.has(course.id)
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        {selectedCourses.has(course.id) && <FiCheck className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <FiBook className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {course.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {course.course_code}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="default">
                        {course.credits} Credits
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {course.semester || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </Layout>
  );
};

export default AssignCoursesPage;
