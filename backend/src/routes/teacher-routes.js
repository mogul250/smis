import express from 'express';
import TeacherController from '../controllers/teacher-controller.js';
import { authenticate } from '../middleware/auth-middleware.js';
import { authorize } from '../middleware/role-middleware.js';

const router = express.Router();

// All routes require authentication and teacher role
router.use(authenticate);
router.use(authorize('teacher'));

// Get teacher profile
router.get('/profile', TeacherController.getProfile);

// Update teacher profile
router.put('/profile', TeacherController.updateProfile);

// Get classes assigned to teacher
router.get('/classes', TeacherController.getClasses);

// Mark attendance for a class
router.post('/attendance', TeacherController.markAttendance);

// Enter grades for a course
router.post('/grades', TeacherController.enterGrades);

// Get timetable for teacher
router.get('/timetable', TeacherController.getTimetable);

// Get students in a class or all classes
router.get('/classes/:courseId?/students', TeacherController.getClassStudents);

// Upload resource (placeholder)
router.post('/resources', TeacherController.uploadResource);

export default router;
