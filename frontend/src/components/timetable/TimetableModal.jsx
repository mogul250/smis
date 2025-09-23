import React, { useState, useEffect } from 'react';
import Button from '../common/Button';
import Input from '../common/Input';
import Alert from '../common/Alert';

const TimetableModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  slot = null, 
  mode = 'create', // 'create' or 'edit'
  courses = [],
  teachers = [],
  loading = false,
  error = null
}) => {
  const [formData, setFormData] = useState({
    course_id: '',
    teacher_id: '',
    day: '',
    start_time: '',
    end_time: '',
    room: '',
    semester: 'Fall 2024'
  });

  const [validationErrors, setValidationErrors] = useState({});

  // Days of the week options
  const dayOptions = [
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
    { value: 7, label: 'Sunday' }
  ];

  // Time options (8 AM to 6 PM)
  const timeOptions = [];
  for (let hour = 8; hour <= 18; hour++) {
    const time = `${hour.toString().padStart(2, '0')}:00`;
    timeOptions.push(time);
  }

  // Semester options
  const semesterOptions = [
    'Fall 2024',
    'Spring 2025',
    'Summer 2025',
    'Fall 2025'
  ];

  useEffect(() => {
    if (slot && mode === 'edit') {
      setFormData({
        course_id: slot.course_id || '',
        teacher_id: slot.teacher_id || '',
        day: slot.day_of_week || '',
        start_time: slot.start_time?.substring(0, 5) || '',
        end_time: slot.end_time?.substring(0, 5) || '',
        room: slot.room || '',
        semester: slot.semester || 'Fall 2024'
      });
    } else {
      // Reset form for create mode
      setFormData({
        course_id: '',
        teacher_id: '',
        day: slot?.day || '',
        start_time: slot?.start_time || '',
        end_time: '',
        room: '',
        semester: 'Fall 2024'
      });
    }
    setValidationErrors({});
  }, [slot, mode, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.course_id) errors.course_id = 'Course is required';
    if (!formData.teacher_id) errors.teacher_id = 'Teacher is required';
    if (!formData.day) errors.day = 'Day is required';
    if (!formData.start_time) errors.start_time = 'Start time is required';
    if (!formData.end_time) errors.end_time = 'End time is required';
    if (!formData.room) errors.room = 'Room is required';

    // Validate time logic
    if (formData.start_time && formData.end_time) {
      if (formData.start_time >= formData.end_time) {
        errors.end_time = 'End time must be after start time';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData = {
      ...formData,
      course_id: parseInt(formData.course_id),
      teacher_id: parseInt(formData.teacher_id),
      day_of_week: parseInt(formData.day)
    };

    if (mode === 'edit' && slot) {
      submitData.id = slot.id;
    }

    onSave(submitData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-screen overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {mode === 'edit' ? 'Edit Timetable Slot' : 'Create Timetable Slot'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <Alert variant="error" className="mb-4">
              {error}
            </Alert>
          )}

          {/* Course Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Course *
            </label>
            <select
              value={formData.course_id}
              onChange={(e) => handleInputChange('course_id', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.course_id ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select a course</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.course_code} - {course.name}
                </option>
              ))}
            </select>
            {validationErrors.course_id && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.course_id}</p>
            )}
          </div>

          {/* Teacher Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teacher *
            </label>
            <select
              value={formData.teacher_id}
              onChange={(e) => handleInputChange('teacher_id', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.teacher_id ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select a teacher</option>
              {teachers.map(teacher => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.first_name} {teacher.last_name}
                </option>
              ))}
            </select>
            {validationErrors.teacher_id && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.teacher_id}</p>
            )}
          </div>

          {/* Day Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Day *
            </label>
            <select
              value={formData.day}
              onChange={(e) => handleInputChange('day', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.day ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select a day</option>
              {dayOptions.map(day => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
            {validationErrors.day && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.day}</p>
            )}
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time *
              </label>
              <select
                value={formData.start_time}
                onChange={(e) => handleInputChange('start_time', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.start_time ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select time</option>
                {timeOptions.map(time => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
              {validationErrors.start_time && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.start_time}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time *
              </label>
              <select
                value={formData.end_time}
                onChange={(e) => handleInputChange('end_time', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.end_time ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select time</option>
                {timeOptions.map(time => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
              {validationErrors.end_time && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.end_time}</p>
              )}
            </div>
          </div>

          {/* Room */}
          <div>
            <Input
              label="Room *"
              value={formData.room}
              onChange={(e) => handleInputChange('room', e.target.value)}
              placeholder="e.g., Room 101, Lab A"
              error={validationErrors.room}
            />
          </div>

          {/* Semester */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Semester
            </label>
            <select
              value={formData.semester}
              onChange={(e) => handleInputChange('semester', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {semesterOptions.map(semester => (
                <option key={semester} value={semester}>
                  {semester}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
            >
              {mode === 'edit' ? 'Update' : 'Create'} Slot
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TimetableModal;
