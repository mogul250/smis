import express from 'express';
import NotificationController from '../controllers/notification-controller.js';
import { authenticate } from '../middleware/auth-middleware.js';
import { authorize } from '../middleware/role-middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get user's notifications
router.get('/', NotificationController.getUserNotifications);

// Mark notification as read
router.put('/:notificationId/read', NotificationController.markAsRead);

// Mark all notifications as read
router.put('/read-all', NotificationController.markAllAsRead);

// Send notification to specific user (admin, hod, teacher)
router.post('/send/user', authorize('admin', 'hod', 'teacher'), NotificationController.sendToUser);

// Send notification to department (hod only)
router.post('/send/department', authorize('hod'), NotificationController.sendToDepartment);

// Send notification to department teachers (hod only)
router.post('/send/department-teachers', authorize('hod'), NotificationController.sendToDepartmentTeachers);

// Send notification to course students (teacher only)
router.post('/send/course', authorize('teacher'), NotificationController.sendToCourse);

// Send notification to all students taught by teacher (teacher only)
router.post('/send/my-students', authorize('teacher'), NotificationController.sendToMyStudents);

// Send notification to all users (admin only)
router.post('/send/all-users', authorize('admin'), NotificationController.sendToAllUsers);

// Send notification to all teachers (admin only)
router.post('/send/all-teachers', authorize('admin'), NotificationController.sendToAllTeachers);

export default router;
