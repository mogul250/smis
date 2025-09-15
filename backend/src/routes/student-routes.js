import express from 'express';
import StudentController from '../controllers/student-controller.js';
import { authenticate } from '../middleware/auth-middleware.js';
import { authorize } from '../middleware/role-middleware.js';

const router = express.Router();

// All student routes require authentication and student role
router.use(authenticate);
router.use(authorize(['student']));

// Get student profile
router.get('/profile', StudentController.getProfile);

// Update student profile
router.put('/profile', StudentController.updateProfile);

// Get student grades
router.get('/grades', StudentController.getGrades);

// Get student attendance
router.get('/attendance', StudentController.getAttendance);

// Get student fees
router.get('/fees', StudentController.getFees);

// Get student timetable
router.get('/timetable', StudentController.getTimetable);

export default router;
