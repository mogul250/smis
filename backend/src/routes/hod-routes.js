import express from 'express';
import HodController from '../controllers/hod-controller.js';
import NotificationController from '../controllers/notification-controller.js';
import { authenticate } from '../middleware/auth-middleware.js';
import { authorize } from '../middleware/role-middleware.js';
import authorizeDepartment from '../middleware/department-middleware.js';

const router = express.Router();

// All routes require authentication, hod role, and department authorization
router.use(authenticate);
router.get('/classes/:classId/students', HodController.getStudentsByClass);
router.use(authorize('hod'));
router.use(authorizeDepartment);

// Get HOD profile
router.get('/profile', HodController.getProfile);

// Get all classes in the HOD's department
// Get students by classId
// Get teachers in department
router.get('/classes/department', HodController.getDepartmentClasses);
router.get('/teachers', HodController.getDepartmentTeachers);

// Get specific teacher's departments
router.get('/teachers/:teacherId/departments', HodController.getTeacherDepartments);

// Approve/reject teacher activities
router.post('/activities/approve', HodController.approveTeacherActivity);

// Generate departmental reports
router.post('/reports/:reportType', HodController.generateReports);



// Manage courses (add/edit/delete)
router.post('/courses/manage', HodController.manageCourses);
// manage classes
router.post('/classes/create', HodController.createClass);
router.post('/classes/add-students', HodController.addStudentsToClass);
router.post('/classes/add-courses', HodController.addCoursesToClass);
router.post('/departments/add-teachers', HodController.addTeachersToDepartment);
router.post('/departments/remove-teachers', HodController.removeTeachersFromDepartment);
// Approve timetable changes
router.post('/timetable/approve', HodController.approveTimetable);

// Get department courses
router.get('/courses', HodController.getDepartmentCourses);

// Get department statistics
router.get('/stats', HodController.getDepartmentStats);

// Get department timetable
router.get('/timetable', HodController.getDepartmentTimetable);

// Send notification to department teachers
router.post('/notifications/department', NotificationController.sendToDepartmentTeachers);

export default router;
