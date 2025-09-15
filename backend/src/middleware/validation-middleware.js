import pool from '../config/database.js';

// Validation middleware for user registration
export const validateUserRegistration = (req, res, next) => {
  const { firstName, lastName, email, password, role } = req.body;

  const errors = [];

  if (!firstName || firstName.trim().length < 2) {
    errors.push('First name must be at least 2 characters long');
  }

  if (!lastName || lastName.trim().length < 2) {
    errors.push('Last name must be at least 2 characters long');
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Valid email is required');
  }

  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  if (!role || !['student', 'teacher', 'hod', 'finance', 'admin'].includes(role)) {
    errors.push('Valid role is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  next();
};

// Validation middleware for course creation
export const validateCourseCreation = (req, res, next) => {
  const { name, code, departmentId, credits, description } = req.body;

  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push('Course name must be at least 2 characters long');
  }

  if (!code || code.trim().length < 2) {
    errors.push('Course code must be at least 2 characters long');
  }

  if (!departmentId || isNaN(departmentId)) {
    errors.push('Valid department ID is required');
  }

  if (!credits || isNaN(credits) || credits < 1 || credits > 6) {
    errors.push('Credits must be a number between 1 and 6');
  }

  if (description && description.length > 500) {
    errors.push('Description must not exceed 500 characters');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  next();
};

// Validation middleware for attendance marking
export const validateAttendanceMarking = (req, res, next) => {
  const { studentId, courseId, date, status } = req.body;

  const errors = [];

  if (!studentId || isNaN(studentId)) {
    errors.push('Valid student ID is required');
  }

  if (!courseId || isNaN(courseId)) {
    errors.push('Valid course ID is required');
  }

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    errors.push('Valid date in YYYY-MM-DD format is required');
  }

  if (!status || !['present', 'absent', 'late'].includes(status)) {
    errors.push('Status must be present, absent, or late');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  next();
};

// Validation middleware for grade assignment
export const validateGradeAssignment = (req, res, next) => {
  const { studentId, courseId, grade, semester, year } = req.body;

  const errors = [];

  if (!studentId || isNaN(studentId)) {
    errors.push('Valid student ID is required');
  }

  if (!courseId || isNaN(courseId)) {
    errors.push('Valid course ID is required');
  }

  const validGrades = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F'];
  if (!grade || !validGrades.includes(grade)) {
    errors.push('Valid grade is required (A, A-, B+, B, B-, C+, C, C-, D+, D, F)');
  }

  if (!semester || !['Fall', 'Spring', 'Summer'].includes(semester)) {
    errors.push('Valid semester is required (Fall, Spring, Summer)');
  }

  if (!year || isNaN(year) || year < 2020 || year > 2030) {
    errors.push('Valid year between 2020 and 2030 is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  next();
};

// Validation middleware for fee creation
export const validateFeeCreation = (req, res, next) => {
  const { studentId, amount, type, dueDate } = req.body;

  const errors = [];

  if (!studentId || isNaN(studentId)) {
    errors.push('Valid student ID is required');
  }

  if (!amount || isNaN(amount) || amount <= 0) {
    errors.push('Valid positive amount is required');
  }

  if (!type || type.trim().length < 2) {
    errors.push('Fee type is required');
  }

  if (!dueDate || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    errors.push('Valid due date in YYYY-MM-DD format is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  next();
};

// Validation middleware for timetable creation
export const validateTimetableCreation = (req, res, next) => {
  const { courseId, teacherId, day, startTime, endTime, room } = req.body;

  const errors = [];

  if (!courseId || isNaN(courseId)) {
    errors.push('Valid course ID is required');
  }

  if (!teacherId || isNaN(teacherId)) {
    errors.push('Valid teacher ID is required');
  }

  const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  if (!day || !validDays.includes(day)) {
    errors.push('Valid day of the week is required');
  }

  if (!startTime || !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(startTime)) {
    errors.push('Valid start time in HH:MM format is required');
  }

  if (!endTime || !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(endTime)) {
    errors.push('Valid end time in HH:MM format is required');
  }

  if (startTime >= endTime) {
    errors.push('End time must be after start time');
  }

  if (!room || room.trim().length < 1) {
    errors.push('Room is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  next();
};

// General validation helper
export const validateId = (id, fieldName) => {
  if (!id || isNaN(id)) {
    return `${fieldName} must be a valid number`;
  }
  return null;
};

export const validateEmail = (email) => {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'Valid email is required';
  }
  return null;
};

export const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === 'string' && value.trim().length === 0)) {
    return `${fieldName} is required`;
  }
  return null;
};

export const validateLength = (value, fieldName, min, max) => {
  if (value && (value.length < min || value.length > max)) {
    return `${fieldName} must be between ${min} and ${max} characters`;
  }
  return null;
};
