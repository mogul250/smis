import React, { useState, useEffect } from 'react';
import { adminAPI, hodAPI } from '../../../services/api';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Alert } from '../../ui/alert';
import Modal from '../../common/Modal';
import LoadingSpinner from '../../common/LoadingSpinner';
import { 
  FiUsers, 
  FiPlus, 
  FiMinus, 
  FiSearch, 
  FiStar,
  FiUser,
  FiCheck,
  FiX
} from 'react-icons/fi';

const TeacherAssignmentModal = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  onError, 
  department 
}) => {
  // State management
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [allTeachers, setAllTeachers] = useState([]);
  const [assignedTeachers, setAssignedTeachers] = useState([]);
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeachers, setSelectedTeachers] = useState(new Set());
  const [primaryTeacherId, setPrimaryTeacherId] = useState(null);

  // Fetch data when modal opens
  useEffect(() => {
    if (isOpen && department) {
      fetchData();
    }
  }, [isOpen, department]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all teachers and department teachers in parallel
      const [allTeachersResponse, departmentTeachersResponse] = await Promise.all([
        adminAPI.getAllUsers(1, 200, { role: 'teacher' }),
        hodAPI.getDepartmentTeachers()
      ]);

      const teachers = allTeachersResponse.users || [];
      const deptTeachers = departmentTeachersResponse || [];

      setAllTeachers(teachers);
      setAssignedTeachers(deptTeachers);

      // Find primary teacher
      const primary = deptTeachers.find(t => t.primaryDepartment?.id === department.id);
      setPrimaryTeacherId(primary?.id || null);

      // Calculate available teachers (not assigned to this department)
      const assignedIds = new Set(deptTeachers.map(t => t.id));
      const available = teachers.filter(t => !assignedIds.has(t.id));
      setAvailableTeachers(available);

    } catch (err) {
      console.error('Error fetching teacher data:', err);
      onError('Failed to load teacher data');
    } finally {
      setLoading(false);
    }
  };

  // Filter available teachers based on search
  const filteredAvailableTeachers = availableTeachers.filter(teacher =>
    `${teacher.first_name} ${teacher.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle teacher selection
  const toggleTeacherSelection = (teacherId) => {
    const newSelected = new Set(selectedTeachers);
    if (newSelected.has(teacherId)) {
      newSelected.delete(teacherId);
    } else {
      newSelected.add(teacherId);
    }
    setSelectedTeachers(newSelected);
  };

  // Handle assign teachers
  const handleAssignTeachers = async (setPrimary = false) => {
    if (selectedTeachers.size === 0) return;

    try {
      setSubmitting(true);
      
      const teacherIds = Array.from(selectedTeachers);
      await hodAPI.assignTeachersToDepartment({
        teachers: teacherIds,
        setPrimary
      });

      onSuccess(`${teacherIds.length} teacher(s) assigned successfully`);
      setSelectedTeachers(new Set());
      await fetchData(); // Refresh data
    } catch (err) {
      console.error('Error assigning teachers:', err);
      onError(err.message || 'Failed to assign teachers');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle remove teacher
  const handleRemoveTeacher = async (teacherId) => {
    try {
      setSubmitting(true);
      
      await hodAPI.removeTeachersFromDepartment({
        teachers: [teacherId]
      });

      onSuccess('Teacher removed successfully');
      await fetchData(); // Refresh data
    } catch (err) {
      console.error('Error removing teacher:', err);
      onError(err.message || 'Failed to remove teacher');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle set primary teacher
  const handleSetPrimary = async (teacherId) => {
    try {
      setSubmitting(true);
      
      await hodAPI.assignTeachersToDepartment({
        teachers: [teacherId],
        setPrimary: true
      });

      onSuccess('Primary teacher updated successfully');
      setPrimaryTeacherId(teacherId);
      await fetchData(); // Refresh data
    } catch (err) {
      console.error('Error setting primary teacher:', err);
      onError(err.message || 'Failed to set primary teacher');
    } finally {
      setSubmitting(false);
    }
  };

  if (!department) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Manage Teachers - ${department.name}`}
      size="xl"
    >
      <div className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            {/* Department Info */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-blue-900 mb-2">
                {department.name} ({department.code})
              </h3>
              <p className="text-blue-700 text-sm">
                Currently has {assignedTeachers.length} teacher(s) assigned
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Available Teachers */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-medium text-gray-900">
                    Available Teachers
                  </h4>
                  <span className="text-sm text-gray-500">
                    {filteredAvailableTeachers.length} available
                  </span>
                </div>

                {/* Search */}
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search teachers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Teacher List */}
                <div className="border rounded-lg max-h-64 overflow-y-auto">
                  {filteredAvailableTeachers.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No available teachers found
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredAvailableTeachers.map(teacher => (
                        <div
                          key={teacher.id}
                          className={`p-3 hover:bg-gray-50 cursor-pointer ${
                            selectedTeachers.has(teacher.id) ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                          }`}
                          onClick={() => toggleTeacherSelection(teacher.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`w-4 h-4 border-2 rounded ${
                                selectedTeachers.has(teacher.id) 
                                  ? 'bg-blue-500 border-blue-500' 
                                  : 'border-gray-300'
                              }`}>
                                {selectedTeachers.has(teacher.id) && (
                                  <FiCheck className="w-3 h-3 text-white" />
                                )}
                              </div>
                              <FiUser className="w-4 h-4 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {teacher.first_name} {teacher.last_name}
                                </p>
                                <p className="text-xs text-gray-500">{teacher.email}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Assign Actions */}
                {selectedTeachers.size > 0 && (
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleAssignTeachers(false)}
                      disabled={submitting}
                    >
                      <FiPlus className="w-4 h-4 mr-1" />
                      Assign ({selectedTeachers.size})
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAssignTeachers(true)}
                      disabled={submitting || selectedTeachers.size !== 1}
                    >
                      <FiStar className="w-4 h-4 mr-1" />
                      Assign as Primary
                    </Button>
                  </div>
                )}
              </div>

              {/* Assigned Teachers */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-medium text-gray-900">
                    Assigned Teachers
                  </h4>
                  <span className="text-sm text-gray-500">
                    {assignedTeachers.length} assigned
                  </span>
                </div>

                <div className="border rounded-lg max-h-64 overflow-y-auto">
                  {assignedTeachers.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No teachers assigned yet
                    </div>
                  ) : (
                    <div className="divide-y">
                      {assignedTeachers.map(teacher => (
                        <div key={teacher.id} className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <FiUser className="w-4 h-4 text-gray-400" />
                              <div>
                                <div className="flex items-center space-x-2">
                                  <p className="text-sm font-medium text-gray-900">
                                    {teacher.first_name} {teacher.last_name}
                                  </p>
                                  {teacher.id === primaryTeacherId && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                      <FiStar className="w-3 h-3 mr-1" />
                                      Primary
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500">{teacher.email}</p>
                                {teacher.departments && (
                                  <p className="text-xs text-gray-400">
                                    {teacher.totalDepartments} department(s)
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-1">
                              {teacher.id !== primaryTeacherId && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleSetPrimary(teacher.id)}
                                  disabled={submitting}
                                  title="Set as primary"
                                >
                                  <FiStar className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveTeacher(teacher.id)}
                                disabled={submitting}
                                className="text-red-600 hover:text-red-800"
                                title="Remove from department"
                              >
                                <FiMinus className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Info Alert */}
            <Alert variant="default" className="text-sm">
              <FiUsers className="w-4 h-4" />
              <div className="ml-2">
                <strong>Many-to-Many Assignment:</strong> Teachers can be assigned to multiple departments. 
                Each teacher can have one primary department that appears in their main profile.
              </div>
            </Alert>
          </>
        )}

        {/* Modal Actions */}
        <div className="flex justify-end pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={submitting}
          >
            <FiX className="w-4 h-4 mr-2" />
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default TeacherAssignmentModal;
