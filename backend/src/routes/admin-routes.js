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
router.get('/users/:offset?/:limit?', AdminController.getAllUsers);
router.put('/users/:userId', AdminController.updateUser);
router.delete('/users/:userId', AdminController.deleteUser);

// Student management
router.get('/students/:offset?/:limit?', AdminController.getAllStudents);

// Academic calendar management
router.post('/calendar', AdminController.manageAcademicCalendar);

// Timetable setup
router.post('/timetable', AdminController.setupTimetable);

// System statistics
router.get('/stats', AdminController.getSystemStats);

// Department management
router.post('/departments', AdminController.createDepartment);
router.put('/departments/:deptId', AdminController.updateDepartment);
router.delete('/departments/:deptId', AdminController.deleteDepartment);

// Get all departments with pagination
router.get('/departments/:offset?/:limit?', AdminController.getAllDepartments);

router.post('/courses/manage', AdminController.manageCourses);


export default router;
