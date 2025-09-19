import express from 'express';
import AdminController from '../controllers/admin-controller.js';
import {authenticate} from '../middleware/auth-middleware.js';
import { authorize } from '../middleware/role-middleware.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// User management
router.post('/users', AdminController.createUser);
router.get('/users', AdminController.getAllUsers);
router.put('/users/:userId', AdminController.updateUser);
router.delete('/users/:userId', AdminController.deleteUser);

// Academic calendar management
router.post('/calendar', AdminController.manageAcademicCalendar);

// Timetable setup
router.post('/timetable', AdminController.setupTimetable);

// System statistics
router.get('/stats', AdminController.getSystemStats);

// Department management
router.post('/departments', AdminController.createDepartment);

export default router;
