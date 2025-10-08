import express from 'express';
import AdminController from '../controllers/admin-controller.js';
import {authenticate} from '../middleware/auth-middleware.js';
import { authorize } from '../middleware/role-middleware.js';

const router = express.Router();
// Get students by classId
router.get('/classes/:classId/students', AdminController.getStudentsByClass);

// All routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// User management
router.post('/users', AdminController.createUser);
router.get('/users/by-id/:userId', AdminController.getUserById);
router.get('/users/:offset?/:limit?', AdminController.getAllUsers);
router.put('/users/:userId', AdminController.updateUser);
router.put('/users/:userId/status', AdminController.updateUserStatus);
router.delete('/users/:userId', AdminController.deleteUser);

// Student management
router.post('/students', AdminController.createStudent);
router.get('/students/:offset?/:limit?', AdminController.getAllStudents);
router.put('/students/:studentId', AdminController.updateStudent);
router.put('/students/:studentId/status', AdminController.updateStudentStatus);
router.delete('/students/:studentId', AdminController.deleteStudent);

// Academic calendar management
router.post('/calendar', AdminController.manageAcademicCalendar);
router.get('/calendar', AdminController.getAcademicCalendar);
router.put('/calendar/:eventId', AdminController.updateAcademicEvent);
router.delete('/calendar/:eventId', AdminController.deleteAcademicEvent);

// Course management
router.get('/courses/all/:offset?/:limit?', AdminController.getAllCourses);
router.post('/courses/manage', AdminController.manageCourses);

// Timetable setup
router.get('/courses', AdminController.getCourses);
// router.get('/classes', AdminController.getClasses);
router.get('/timetable', AdminController.getTimetable);
router.get('/timetable/:id', AdminController.getTimetableSlot);
router.post('/timetable', AdminController.setupTimetable);
router.put('/timetable/:id', AdminController.updateTimetableSlot);
router.delete('/timetable/:id', AdminController.deleteTimetableSlot);

// System statistics
router.get('/stats', AdminController.getSystemStats);

// Department management
router.post('/departments', AdminController.createDepartment);
router.put('/departments/:deptId', AdminController.updateDepartment);
router.delete('/departments/:deptId', AdminController.deleteDepartment);

// Department-specific operations (must come before the general routes)
router.get('/departments/:departmentId/students', AdminController.getDepartmentStudents);
router.get('/departments/:departmentId/teachers', AdminController.getDepartmentTeachers);
router.get('/departments/:departmentId/courses', AdminController.getDepartmentCourses);
router.get('/departments/:departmentId/hod', AdminController.getDepartmentHOD);
router.post('/departments/:departmentId/hod', AdminController.assignDepartmentHOD);
router.delete('/departments/:departmentId/hod', AdminController.removeDepartmentHOD);

// Available HODs endpoint with different pattern
router.get('/hods/available/:departmentId', AdminController.getAvailableHODs);

// Test route
router.get('/test-hods', (req, res) => {
  res.json({ message: 'Test route works', timestamp: new Date().toISOString() });
});

// Simple HODs endpoint
router.get('/hods-for-dept/:departmentId', AdminController.getHODsForDepartment);

// Get specific department by ID (must come after specific sub-routes)
router.get('/departments/:departmentId', AdminController.getDepartmentById);

// Get all departments with pagination (must come last to avoid conflicts)
router.get('/departments/:offset?/:limit?', AdminController.getAllDepartments);

// Department course assignment
router.post('/departments/assign-courses', AdminController.assignCoursesToDepartment);
router.post('/departments/remove-courses', AdminController.removeCoursesFromDepartment);
router.put('/students/:studentId/department', AdminController.assignStudentToDepartment);

// Dashboard and reports
router.get('/dashboard', AdminController.getDashboard);
router.get('/reports', AdminController.getReports);
router.get('/classes', AdminController.getAllClasses);
router.get('/classes/:classID', AdminController.getClass);
router.post('/classes/create', AdminController.createClass);
router.post('/classes/add-students', AdminController.addStudentsToClass);
router.post('/classes/add-courses', AdminController.addCoursesToClass);
router.post('/classes/remove-courses', AdminController.removeCoursesFromClass);
router.post('/departments/add-teachers', AdminController.addTeachersToDepartment);
router.post('/departments/remove-teachers', AdminController.removeTeachersFromDepartment);

export default router;
