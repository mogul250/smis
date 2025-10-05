import express from 'express';
import ClassController from '../controllers/class-controller.js';
import { authenticate } from '../middleware/auth-middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all info for a class (students, head teacher, etc)
router.get('/:classId', ClassController.getClassInfo);

// Get all classes
router.get('/', ClassController.getAllClasses);

// Get classes for a student
router.get('/student/:studentId', ClassController.getStudentClasses);

export default router;
