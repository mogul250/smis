import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../hooks/useAuth';
import { useApi, useAsyncOperation } from '../../../hooks/useApi';
import * as adminAPI from '../../../services/api/admin';
import Sidebar from '../../../components/common/Sidebar';
import Header from '../../../components/common/Header';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';

const CreateTimetableSlot = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { day, time } = router.query; // Get pre-filled values from URL params

  // Form state
  const [formData, setFormData] = useState({
    course_id: '',
    teacher_id: '',
    class_id: '',
    day: day || '',
    start_time: time || '',
    end_time: '',
    room: '',
    semester: 'Fall 2024'
  });

  const [validationErrors, setValidationErrors] = useState({});

  // Fetch data for dropdowns
  const { data: courses, loading: coursesLoading } = useApi(() =>
    adminAPI.getCourses().catch((error) => {
      console.log('Failed to fetch courses:', error);
      return [];
    })
  );

  const { data: teachersResponse, loading: teachersLoading } = useApi(() =>
    adminAPI.getTeachers(1, 100).catch((error) => {
      console.log('Failed to fetch teachers:', error);
      return { users: [] };
    })
  );

  const { data: classes, loading: classesLoading } = useApi(() =>
    adminAPI.getClasses().catch((error) => {
      console.log('Failed to fetch classes:', error);
      return [];
    })
  );

  // Extract teachers array from paginated response
  const teachers = teachersResponse?.users || [];

  // Create operation
  const { execute: createSlot, loading: creating } = useAsyncOperation();

  // Update form data when URL params change
  useEffect(() => {
    if (day) setFormData(prev => ({ ...prev, day }));
    if (time) setFormData(prev => ({ ...prev, start_time: time }));
  }, [day, time]);

  // Check authorization
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <Button onClick={() => router.push('/login')}>Go to Login</Button>
        </div>
      </div>
    );
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.course_id) errors.course_id = 'Course is required';
    if (!formData.teacher_id) errors.teacher_id = 'Teacher is required';
    if (!formData.class_id) errors.class_id = 'Class is required';
    if (!formData.day) errors.day = 'Day is required';
    if (!formData.start_time) errors.start_time = 'Start time is required';
    if (!formData.end_time) errors.end_time = 'End time is required';
    if (!formData.room) errors.room = 'Room is required';
    
    // Validate time logic
    if (formData.start_time && formData.end_time && formData.start_time >= formData.end_time) {
      errors.end_time = 'End time must be after start time';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await createSlot(async () => {
        const response = await adminAPI.setupTimetable(formData);
        return response;
      });
      
      // Success - redirect back to timetable
      router.push('/admin/timetable?success=created');
    } catch (error) {
      console.error('Error creating timetable slot:', error);
      // Error handling is done by useAsyncOperation
    }
  };

  const handleCancel = () => {
    router.push('/admin/timetable');
  };

  const dayOptions = [
    { value: '', label: 'Select a day' },
    { value: 'Monday', label: 'Monday' },
    { value: 'Tuesday', label: 'Tuesday' },
    { value: 'Wednesday', label: 'Wednesday' },
    { value: 'Thursday', label: 'Thursday' },
    { value: 'Friday', label: 'Friday' },
    { value: 'Saturday', label: 'Saturday' },
    { value: 'Sunday', label: 'Sunday' }
  ];

  const timeOptions = [
    { value: '', label: 'Select time' },
    { value: '08:00', label: '08:00' },
    { value: '09:00', label: '09:00' },
    { value: '10:00', label: '10:00' },
    { value: '11:00', label: '11:00' },
    { value: '12:00', label: '12:00' },
    { value: '13:00', label: '13:00' },
    { value: '14:00', label: '14:00' },
    { value: '15:00', label: '15:00' },
    { value: '16:00', label: '16:00' },
    { value: '17:00', label: '17:00' },
    { value: '18:00', label: '18:00' }
  ];

  const semesterOptions = [
    { value: 'Fall 2024', label: 'Fall 2024' },
    { value: 'Spring 2025', label: 'Spring 2025' },
    { value: 'Summer 2025', label: 'Summer 2025' },
    { value: 'Fall 2025', label: 'Fall 2025' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Create Timetable Slot</h1>
                  <p className="text-gray-600 mt-1">Add a new class to the timetable schedule</p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                >
                  ← Back to Timetable
                </Button>
              </div>
            </div>

            {/* Form */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Course Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Course *
                      </label>
                      <select
                        value={formData.course_id}
                        onChange={(e) => handleInputChange('course_id', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          validationErrors.course_id ? 'border-red-500' : 'border-gray-300'
                        }`}
                        disabled={coursesLoading}
                      >
                        <option value="">Select a course</option>
                        {courses && courses.length > 0 ? courses.map(course => (
                          <option key={course.id} value={course.id}>
                            {course.course_code} - {course.name}
                          </option>
                        )) : (
                          <option value="" disabled>
                            {coursesLoading ? 'Loading courses...' : 'No courses available'}
                          </option>
                        )}
                      </select>
                      {validationErrors.course_id && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.course_id}</p>
                      )}
                    </div>

                    {/* Teacher Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Teacher *
                      </label>
                      <select
                        value={formData.teacher_id}
                        onChange={(e) => handleInputChange('teacher_id', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          validationErrors.teacher_id ? 'border-red-500' : 'border-gray-300'
                        }`}
                        disabled={teachersLoading}
                      >
                        <option value="">Select a teacher</option>
                        {teachers && teachers.length > 0 ? teachers.map(teacher => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.first_name} {teacher.last_name}
                          </option>
                        )) : (
                          <option value="" disabled>
                            {teachersLoading ? 'Loading teachers...' : 'No teachers available'}
                          </option>
                        )}
                      </select>
                      {validationErrors.teacher_id && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.teacher_id}</p>
                      )}
                    </div>
                  </div>

                  {/* Class and Day */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Class *
                      </label>
                      <select
                        value={formData.class_id}
                        onChange={(e) => handleInputChange('class_id', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          validationErrors.class_id ? 'border-red-500' : 'border-gray-300'
                        }`}
                        disabled={classesLoading}
                      >
                        <option value="">Select a class</option>
                        {classes && classes.length > 0 ? classes.map(cls => (
                          <option key={cls.id} value={cls.id}>
                            {cls.name} ({cls.academic_year})
                          </option>
                        )) : (
                          <option value="" disabled>
                            {classesLoading ? 'Loading classes...' : 'No classes available'}
                          </option>
                        )}
                      </select>
                      {validationErrors.class_id && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.class_id}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Day *
                      </label>
                      <select
                        value={formData.day}
                        onChange={(e) => handleInputChange('day', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          validationErrors.day ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        {dayOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {validationErrors.day && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.day}</p>
                      )}
                    </div>
                  </div>

                  {/* Time and Room */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Time *
                      </label>
                      <select
                        value={formData.start_time}
                        onChange={(e) => handleInputChange('start_time', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          validationErrors.start_time ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        {timeOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {validationErrors.start_time && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.start_time}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Time *
                      </label>
                      <select
                        value={formData.end_time}
                        onChange={(e) => handleInputChange('end_time', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          validationErrors.end_time ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        {timeOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {validationErrors.end_time && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.end_time}</p>
                      )}
                    </div>

                    <div>
                      <Input
                        label="Room *"
                        value={formData.room}
                        onChange={(e) => handleInputChange('room', e.target.value)}
                        placeholder="e.g., Room 101, Lab A"
                        error={validationErrors.room}
                      />
                    </div>
                  </div>

                  {/* Semester */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Semester
                      </label>
                      <select
                        value={formData.semester}
                        onChange={(e) => handleInputChange('semester', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {semesterOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      disabled={creating}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      loading={creating}
                      disabled={creating}
                    >
                      Create Timetable Slot
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CreateTimetableSlot;
