import express from 'express';
import { register, login, logout, getProfile, requestPasswordReset, resetPassword, studentLogin } from '../controllers/auth-controller.js';
import { authenticate } from '../middleware/auth-middleware.js';

const router = express.Router();

// Public routes for staff
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPassword);

// Public routes for students
router.post('/student/login', studentLogin);

// Protected routes
router.get('/profile', authenticate, getProfile);

export default router;
