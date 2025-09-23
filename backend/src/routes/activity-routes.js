import express from 'express';
import ActivityController from '../controllers/activity-controller.js';
import { authenticate } from '../middleware/auth-middleware.js';
import { authorize } from '../middleware/role-middleware.js';

const router = express.Router();

// Get recent activities (admin only)
router.get('/recent',
  authenticate,
  authorize('admin'),
  ActivityController.getRecentActivities
);

// Get activities for a specific user
router.get('/user/:userId',
  authenticate,
  ActivityController.getUserActivities
);

// Get activities by entity type
router.get('/entity/:entityType',
  authenticate,
  ActivityController.getActivitiesByEntityType
);

// Get activity statistics
router.get('/stats',
  authenticate,
  authorize('admin'),
  ActivityController.getActivityStats
);

// Create a new activity log entry
router.post('/',
  authenticate,
  ActivityController.createActivity
);

// Get system alerts
router.get('/alerts',
  authenticate,
  authorize('admin'),
  ActivityController.getSystemAlerts
);

export default router;
