import express from 'express';
import Course from '../models/course.js';
import { authenticate } from '../middleware/auth-middleware.js';

const router = express.Router();

// GET /courses/:id - Get course info by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /courses/code/:course_code - Get course info by code
router.get('/code/:course_code', authenticate, async (req, res) => {
  try {
    const course = await Course.findByCode(req.params.course_code);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
