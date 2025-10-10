import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Trash2, Clock, User, BookOpen, MapPin } from 'lucide-react';
import { useAuth } from '../../../../hooks/useAuth';
import { useApi, useAsyncOperation } from '../../../../hooks/useApi';
import * as adminAPI from '../../../../services/api/admin';
import Layout from '../../../../components/common/Layout';
import Button from '../../../../components/common/Button';
import Input from '../../../../components/common/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/card';
import { cn } from '../../../../lib/utils';

const EditTimetableSlot = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    course_id: '',
    teacher_id: '',
    class_id: '',
    day: '',
    start_time: '',
    end_time: '',
    room: '',
    semester: 'Fall 2024'
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(true);

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

  // Operations
  const { execute: updateSlot, loading: updating } = useAsyncOperation();
  const { execute: deleteSlot, loading: deleting } = useAsyncOperation();

  // Load existing timetable slot data
  useEffect(() => {
    if (id) {
      loadTimetableSlot();
    }
  }, [id]);

  const loadTimetableSlot = async () => {
    try {
      setLoading(true);
      // Note: You'll need to implement getTimetableSlot in your API
      // For now, we'll use a placeholder
      const slot = await adminAPI.getTimetableSlot(id);
      setFormData({
        course_id: slot.course_id || '',
        teacher_id: slot.teacher_id || '',
        class_id: slot.class_id || '',
        day: slot.day || '',
        start_time: slot.start_time || '',
        end_time: slot.end_time || '',
        room: slot.room || '',
        semester: slot.semester || 'Fall 2024'
      });
    } catch (error) {
      console.error('Error loading timetable slot:', error);
      // If slot not found, redirect back
      router.push('/admin/timetable?error=not-found');
    } finally {
      setLoading(false);
    }
  };

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
      await updateSlot(async () => {
        const response = await adminAPI.updateTimetableSlot(id, formData);
        return response;
      });
      
      // Success - redirect back to timetable
      router.push('/admin/timetable?success=updated');
    } catch (error) {
      console.error('Error updating timetable slot:', error);
      // Error handling is done by useAsyncOperation
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this timetable slot? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteSlot(async () => {
        const response = await adminAPI.deleteTimetableSlot(id);
        return response;
      });
      
      // Success - redirect back to timetable
      router.push('/admin/timetable?success=deleted');
    } catch (error) {
      console.error('Error deleting timetable slot:', error);
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

  // Helper function to convert 24-hour time to 12-hour format for display
  const formatTimeFor12Hour = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Helper function to convert 12-hour time to 24-hour format for storage
  const convertTo24Hour = (time12) => {
    if (!time12) return '';
    // If already in 24-hour format, return as is
    if (/^\d{2}:\d{2}$/.test(time12)) return time12;
    
    const timeRegex = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i;
    const match = time12.match(timeRegex);
    if (!match) return time12; // Return original if not matching expected format
    
    let [, hours, minutes, ampm] = match;
    hours = parseInt(hours);
    
    if (ampm.toUpperCase() === 'PM' && hours !== 12) {
      hours += 12;
    } else if (ampm.toUpperCase() === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      padding="p-4 sm:p-6 lg:p-8"
      maxWidth="max-w-4xl mx-auto"
      enableAnimation={false}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-primary-green" />
              Edit Timetable Slot
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Modify or delete this timetable slot</p>
          </div>
          <Button
            variant="outline"
            onClick={handleCancel}
            className="flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Timetable
          </Button>
        </div>

        {/* Form */}
        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-primary-green" />
              Slot Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Course and Teacher Selection */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
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
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Time *
                      </label>
                      <input
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => handleInputChange('start_time', e.target.value)}
                        placeholder="e.g., 09:30 or 10:15 AM"
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          validationErrors.start_time ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {validationErrors.start_time && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.start_time}</p>
                      )}
                      <p className="text-gray-500 text-xs mt-1">Use 24-hour format (e.g., 09:30, 14:20) or browser time picker</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Time *
                      </label>
                      <input
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => handleInputChange('end_time', e.target.value)}
                        placeholder="e.g., 10:30 or 11:15 AM"
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          validationErrors.end_time ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {validationErrors.end_time && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.end_time}</p>
                      )}
                      <p className="text-gray-500 text-xs mt-1">Use 24-hour format (e.g., 10:30, 15:20) or browser time picker</p>
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
                      <input
                        type="text"
                        value={formData.semester}
                        onChange={(e) => handleInputChange('semester', e.target.value)}
                        placeholder="Enter semester name (e.g., Fall 2024, Spring 2025, Winter 2026)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-gray-500 text-xs mt-1">Examples: Fall 2024, Spring 2025, Summer 2025, Winter 2026</p>
                    </div>
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-4 pt-6 border-t border-gray-200">
                    <Button
                      type="button"
                      variant="danger"
                      onClick={handleDelete}
                      loading={deleting}
                      disabled={updating || deleting}
                      className="flex items-center gap-2 w-full sm:w-auto justify-center"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Slot
                    </Button>

                    <div className="flex flex-col sm:flex-row gap-3 sm:space-x-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={updating || deleting}
                        className="w-full sm:w-auto"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        loading={updating}
                        disabled={updating || deleting}
                        className="flex items-center gap-2 w-full sm:w-auto justify-center"
                      >
                        <Save className="h-4 w-4" />
                        Update Slot
                      </Button>
                    </div>
                  </div>
                </form>
          </CardContent>
        </Card>
      </motion.div>
    </Layout>
  );
};

export default EditTimetableSlot;
