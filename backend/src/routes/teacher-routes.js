// Get grades for a class and course taught by teacher
import express from 'express';
import TeacherController from '../controllers/teacher-controller.js';
import { authenticate } from '../middleware/auth-middleware.js';
import { authorize } from '../middleware/role-middleware.js';

const router = express.Router();

// All routes require authentication and teacher role
router.use(authenticate);
router.use(authorize('teacher'));
//getclass and course grades
router.get('/grades/class/:classId/course/:courseId', TeacherController.getClassCourseGrades);
// Get teacher profile
router.get('/profile', TeacherController.getProfile);

// Update teacher profile
router.put('/profile', TeacherController.updateProfile);

// Get classes assigned to teacher
router.get('/classes', TeacherController.getClasses);

// Mark attendance for a class
router.post('/attendance', TeacherController.markAttendance);

// Mark attendance for a student
router.post('/student/attendance', TeacherController.markSpecialAttendance);

// Enter grades for a course
router.post('/grades', TeacherController.enterGrades);

// Edit a grade assigned by the teacher
router.put('/grades/:gradeId', TeacherController.editGrade);

// Delete a grade assigned by the teacher
router.delete('/grades/:gradeId', TeacherController.deleteGrade);

// Get timetable for teacher
router.get('/timetable/:semester', TeacherController.getTimetable);

// Get students in a class or all classes
router.get('/classes/students', TeacherController.getClassStudents);
router.get('/classes/:courseId/students', TeacherController.getClassStudents);

// Upload resource (placeholder)
router.post('/resources', TeacherController.uploadResource);

export default router;
