import express from 'express';
import HodController from '../controllers/hod-controller.js';
import authenticate from '../middleware/auth-middleware.js';
import authorize from '../middleware/role-middleware.js';
import authorizeDepartment from '../middleware/department-middleware.js';

const router = express.Router();

// All routes require authentication, hod role, and department authorization
router.use(authenticate);
router.use(authorize('hod'));
router.use(authorizeDepartment);

// Get teachers in department
router.get('/teachers', HodController.getDepartmentTeachers);

// Approve/reject teacher activities
router.post('/activities/approve', HodController.approveTeacherActivity);

// Generate departmental reports
router.get('/reports', HodController.generateReports);

// Manage courses (add/edit/delete)
router.post('/courses/manage', HodController.manageCourses);

// Approve timetable changes
router.post('/timetable/approve', HodController.approveTimetable);

// Get department statistics
router.get('/stats', HodController.getDepartmentStats);

// Get department timetable
router.get('/timetable', HodController.getDepartmentTimetable);

export default router;
