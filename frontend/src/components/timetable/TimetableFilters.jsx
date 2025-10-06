import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Search, Download, Settings, X, ChevronDown } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import { Card, CardContent } from '../ui/card';
import TimeConfigModal from './TimeConfigModal';
import { cn } from '../../lib/utils';

const TimetableFilters = ({
  filters = {},
  onFilterChange,
  departments = [],
  teachers = [],
  courses = [],
  showDepartmentFilter = false,
  showTeacherFilter = false,
  showCourseFilter = false,
  showTimeConfig = false,
  onReset,
  onExport
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTimeConfigModal, setShowTimeConfigModal] = useState(false);

  const handleFilterChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const handleTimeConfigSave = (config) => {
    // Save time configuration to localStorage or send to backend
    localStorage.setItem('timetableTimeConfig', JSON.stringify(config));
    console.log('Time configuration saved:', config);
  };

  const semesterOptions = [
    { value: '', label: 'All Semesters' },
    { value: 'Fall 2024', label: 'Fall 2024' },
    { value: 'Spring 2025', label: 'Spring 2025' },
    { value: 'Summer 2025', label: 'Summer 2025' },
    { value: 'Fall 2025', label: 'Fall 2025' }
  ];

  const dayOptions = [
    { value: '', label: 'All Days' },
    { value: '1', label: 'Monday' },
    { value: '2', label: 'Tuesday' },
    { value: '3', label: 'Wednesday' },
    { value: '4', label: 'Thursday' },
    { value: '5', label: 'Friday' },
    { value: '6', label: 'Saturday' },
    { value: '7', label: 'Sunday' }
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary-green" />
                <h3 className="text-lg font-semibold text-gray-900">Filters & Actions</h3>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {showTimeConfig && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTimeConfigModal(true)}
                    className="flex items-center gap-2 hover:bg-primary-green hover:text-white transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:inline">Time Config</span>
                  </Button>
                )}
                {onExport && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onExport}
                    className="flex items-center gap-2 hover:bg-blue-600 hover:text-white transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Export</span>
                  </Button>
                )}
                {onReset && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onReset}
                    className="flex items-center gap-2 hover:bg-red-600 hover:text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                    <span className="hidden sm:inline">Reset</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="sm:hidden flex items-center gap-2"
                >
                  <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
                  {isExpanded ? 'Less' : 'More'}
                </Button>
              </div>
            </div>

            {/* Filters Grid */}
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{
                  opacity: isExpanded || window.innerWidth >= 640 ? 1 : 0,
                  height: isExpanded || window.innerWidth >= 640 ? 'auto' : 0
                }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Semester Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Semester
                    </label>
                    <select
                      value={filters.semester || ''}
                      onChange={(e) => handleFilterChange('semester', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {semesterOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Day Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Day
                    </label>
                    <select
                      value={filters.day || ''}
                      onChange={(e) => handleFilterChange('day', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {dayOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Department Filter */}
                  {showDepartmentFilter && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Department
                      </label>
                      <select
                        value={filters.department || ''}
                        onChange={(e) => handleFilterChange('department', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Departments</option>
                        {departments && departments.length > 0 ? departments.map(dept => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name}
                          </option>
                        )) : (
                          <option value="" disabled>No departments available</option>
                        )}
                      </select>
                    </div>
                  )}

                  {/* Teacher Filter */}
                  {showTeacherFilter && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teacher
                      </label>
                      <select
                        value={filters.teacher || ''}
                        onChange={(e) => handleFilterChange('teacher', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Teachers</option>
                        {teachers && teachers.length > 0 ? teachers.map(teacher => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.first_name} {teacher.last_name}
                          </option>
                        )) : (
                          <option value="" disabled>No teachers available</option>
                        )}
                      </select>
                    </div>
                  )}

                  {/* Course Filter */}
                  {showCourseFilter && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Course
                      </label>
                      <select
                        value={filters.course || ''}
                        onChange={(e) => handleFilterChange('course', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Courses</option>
                        {courses && courses.length > 0 ? courses.map(course => (
                          <option key={course.id} value={course.id}>
                            {course.course_code} - {course.name}
                          </option>
                        )) : (
                          <option value="" disabled>No courses available</option>
                        )}
                      </select>
                    </div>
                  )}

                  {/* Search Filter */}
                  <div>
                    <Input
                      label="Search"
                      value={filters.search || ''}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      placeholder="Search courses, teachers..."
                    />
                  </div>

                  {/* Time Range Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time Range
                    </label>
                    <select
                      value={filters.timeRange || ''}
                      onChange={(e) => handleFilterChange('timeRange', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Times</option>
                      <option value="morning">Morning (8:00-12:00)</option>
                      <option value="afternoon">Afternoon (12:00-17:00)</option>
                      <option value="evening">Evening (17:00-20:00)</option>
                    </select>
                  </div>
                </div>

                {/* Active Filters Display */}
                {Object.keys(filters).some(key => filters[key]) && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                    <span className="text-sm text-gray-600">Active filters:</span>
                    {Object.entries(filters).map(([key, value]) => {
                      if (!value) return null;

                      let displayValue = value;
                      if (key === 'day') {
                        const dayOption = dayOptions.find(d => d.value === value);
                        displayValue = dayOption?.label || value;
                      }

                      return (
                        <span
                          key={key}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {key}: {displayValue}
                          <button
                            onClick={() => handleFilterChange(key, '')}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Time Configuration Modal */}
      <TimeConfigModal
        isOpen={showTimeConfigModal}
        onClose={() => setShowTimeConfigModal(false)}
        onSave={handleTimeConfigSave}
        initialConfig={JSON.parse(localStorage.getItem('timetableTimeConfig') || 'null')}
      />
    </>
  );
};

export default TimetableFilters;
