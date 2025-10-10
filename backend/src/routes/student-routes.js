import express from 'express';
import StudentController from '../controllers/student-controller.js';
import { authenticate } from '../middleware/auth-middleware.js';
import { authorize } from '../middleware/role-middleware.js';
import { enforceStudentDepartmentAccess } from '../middleware/student-department-middleware.js';

const router = express.Router();

// All student routes require authentication, student role, and department access control
router.use(authenticate);
router.use(authorize('student'));
router.use(enforceStudentDepartmentAccess);

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

// Get student's department information
router.get('/department', StudentController.getDepartment);

// Get courses available in student's department
router.get('/courses', StudentController.getDepartmentCourses);

// Get student invoices
router.get('/invoices', StudentController.getInvoices);

// Get specific invoice details
router.get('/invoices/:id', StudentController.getInvoice);

// Download invoice as PDF
router.get('/invoices/:id/download', StudentController.downloadInvoice);

export default router;
