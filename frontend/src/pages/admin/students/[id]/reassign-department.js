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

import {
  FiArrowLeft,
  FiUser,
  FiMail,
  FiRefreshCw,
  FiCheck,
  FiDatabase
} from 'react-icons/fi';

const ReassignStudentDepartmentPage = () => {
  const router = useRouter();
  const { id: studentId, from: fromDepartmentId, name: studentName } = router.query;
  const { user, isAuthenticated } = useAuth();

  // State management
  const [student, setStudent] = useState(null);
  const [currentDepartment, setCurrentDepartment] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Fetch data
  const fetchData = async () => {
    if (!studentId) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch student details
      const studentData = await adminAPI.getUserById(parseInt(studentId));
      setStudent(studentData);

      // Fetch current department if we have the ID
      if (fromDepartmentId) {
        const currentDeptData = await adminAPI.getDepartmentById(parseInt(fromDepartmentId));
        setCurrentDepartment(currentDeptData);
      }

      // Fetch all departments
      const departmentsData = await adminAPI.getAllDepartments(1, 100);
      setDepartments(departmentsData || []);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedDepartmentId) {
      setError('Please select a department');
      return;
    }

    if (selectedDepartmentId === fromDepartmentId) {
      setError('Student is already assigned to this department');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Reassign student to new department
      await adminAPI.assignStudentToDepartment(parseInt(studentId), {
        departmentId: parseInt(selectedDepartmentId)
      });

      setSuccess(true);

      // Redirect back to department view after a short delay
      setTimeout(() => {
        router.push(`/admin/departments/${fromDepartmentId}/view`);
      }, 2000);

    } catch (err) {
      console.error('Error reassigning student:', err);
      setError(err.message || 'Failed to reassign student');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (studentId && isAuthenticated && user?.role === 'admin') {
      fetchData();
    }
  }, [studentId, isAuthenticated, user]);

  // Check authentication and authorization
  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <Layout maxWidth="max-w-4xl mx-auto">
        <div className="flex items-center justify-center h-96">
          <Alert variant="error">Access denied. Admin access required.</Alert>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout maxWidth="max-w-4xl mx-auto">
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (success) {
    return (
      <Layout maxWidth="max-w-4xl mx-auto">
        <Alert variant="success">
          <div className="flex items-center">
            <FiCheck className="w-5 h-5 mr-2" />
            <div>
              <h3 className="font-medium">Student Reassigned Successfully!</h3>
              <p className="text-sm mt-1">
                {studentName || 'Student'} has been reassigned to the new department.
                Redirecting back to department view...
              </p>
            </div>
          </div>
        </Alert>
      </Layout>
    );
  }

  return (
    <Layout maxWidth="max-w-4xl mx-auto" enableAnimation={true}>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              icon={FiArrowLeft}
              onClick={() => router.push(`/admin/departments/${fromDepartmentId}/view`)}
            >
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <FiRefreshCw className="mr-3 text-blue-600" />
                Reassign Student Department
              </h1>
              <p className="text-gray-600 mt-1">
                Change the department assignment for {studentName || 'this student'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/departments/${fromDepartmentId}/view`)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={FiRefreshCw}
              onClick={handleSubmit}
              disabled={submitting || !selectedDepartmentId}
              loading={submitting}
            >
              {submitting ? 'Reassigning...' : 'Reassign Student'}
            </Button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="error" className="mb-6">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
            >
              ×
            </Button>
          </div>
        </Alert>
      )}

            {/* Student Information */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <FiUser className="w-5 h-5 mr-2 text-green-600" />
                  Student Information
                </h2>
                
                {student && (
                  <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <FiGraduationCap className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-lg font-medium text-gray-900">
                        {student.first_name} {student.last_name}
                      </div>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <FiMail className="w-4 h-4 mr-1" />
                        {student.email}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Student ID: {student.student_id || student.id}
                      </div>
                    </div>
                    <Badge variant={student.status === 'active' ? 'success' : 'secondary'}>
                      {student.status || 'Active'}
                    </Badge>
                  </div>
                )}
              </div>
            </Card>

            {/* Department Assignment */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <FiDatabase className="w-5 h-5 mr-2 text-blue-600" />
                  Department Assignment
                </h2>

                <div className="space-y-6">
                  {/* Current Department */}
                  {currentDepartment && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Department
                      </label>
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center">
                          <FiDatabase className="w-5 h-5 text-red-600 mr-2" />
                          <span className="font-medium text-red-900">{currentDepartment.name}</span>
                          <span className="ml-2 text-sm text-red-600">({currentDepartment.code})</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* New Department Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Department *
                    </label>
                    <select
                      value={selectedDepartmentId}
                      onChange={(e) => setSelectedDepartmentId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select a department...</option>
                      {departments
                        .filter(dept => dept.id.toString() !== fromDepartmentId)
                        .map((department) => (
                          <option key={department.id} value={department.id.toString()}>
                            {department.name} ({department.code})
                          </option>
                        ))}
                    </select>
                    <p className="text-sm text-gray-500 mt-1">
                      Choose the new department for this student
                    </p>
                  </div>

                  {/* Selected Department Preview */}
                  {selectedDepartmentId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Assignment Preview
                      </label>
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center">
                          <FiDatabase className="w-5 h-5 text-green-600 mr-2" />
                          <span className="font-medium text-green-900">
                            {departments.find(d => d.id.toString() === selectedDepartmentId)?.name}
                          </span>
                          <span className="ml-2 text-sm text-green-600">
                            ({departments.find(d => d.id.toString() === selectedDepartmentId)?.code})
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
    </Layout>
  );
};

export default ReassignStudentDepartmentPage;
