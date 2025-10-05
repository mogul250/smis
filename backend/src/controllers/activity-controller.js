import ActivityLog from '../models/activity-log.js';

class ActivityController {
  // Get recent activities for admin dashboard
  static async getRecentActivities(req, res) {
    try {
      const { limit = 20, action, entity_type, user_role, date_from, date_to } = req.query;
      
      const filters = {};
      if (action) filters.action = action;
      if (entity_type) filters.entity_type = entity_type;
      if (user_role) filters.user_role = user_role;
      if (date_from) filters.date_from = date_from;
      if (date_to) filters.date_to = date_to;

      const activities = await ActivityLog.getRecentActivities(parseInt(limit), filters);
      
      res.json({
        success: true,
        data: activities,
        count: activities.length
      });
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch recent activities',
        error: error.message
      });
    }
  }

  // Get activities for a specific user
  static async getUserActivities(req, res) {
    try {
      const { userId } = req.params;
      const { limit = 10 } = req.query;

      const activities = await ActivityLog.getByUser(parseInt(userId), parseInt(limit));
      
      res.json({
        success: true,
        data: activities,
        count: activities.length
      });
    } catch (error) {
      console.error('Error fetching user activities:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user activities',
        error: error.message
      });
    }
  }

  // Get activities by entity type (for specific dashboard contexts)
  static async getActivitiesByEntityType(req, res) {
    try {
      const { entityType } = req.params;
      const { limit = 10 } = req.query;

      const activities = await ActivityLog.getByEntityType(entityType, parseInt(limit));
      
      res.json({
        success: true,
        data: activities,
        count: activities.length
      });
    } catch (error) {
      console.error('Error fetching activities by entity type:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch activities by entity type',
        error: error.message
      });
    }
  }

  // Get activity statistics
  static async getActivityStats(req, res) {
    try {
      const { dateRange = 7 } = req.query;

      const stats = await ActivityLog.getActivityStats(parseInt(dateRange));
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching activity stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch activity statistics',
        error: error.message
      });
    }
  }

  // Create a new activity log entry (for manual logging)
  static async createActivity(req, res) {
    try {
      const {
        user_id,
        action,
        entity_type,
        entity_id,
        description,
        metadata
      } = req.body;

      if (!user_id || !action || !description) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: user_id, action, description'
        });
      }

      const activityId = await ActivityLog.create({
        user_id,
        action,
        entity_type,
        entity_id,
        description,
        metadata,
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.status(201).json({
        success: true,
        message: 'Activity logged successfully',
        data: { id: activityId }
      });
    } catch (error) {
      console.error('Error creating activity log:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create activity log',
        error: error.message
      });
    }
  }

  // Get system alerts (derived from recent activities)
  static async getSystemAlerts(req, res) {
    try {
      const { limit = 10 } = req.query;

      // Get recent system-related activities
      const activities = await ActivityLog.getRecentActivities(parseInt(limit), {
        entity_type: 'system'
      });

      // Transform activities into alert format
      const alerts = activities.map(activity => ({
        id: activity.id,
        type: activity.action === 'system_backup' ? 'success' : 
              activity.action === 'system_error' ? 'error' : 'info',
        title: activity.description,
        message: activity.metadata ? JSON.parse(activity.metadata).details || '' : '',
        timestamp: activity.created_at,
        icon: activity.action === 'system_backup' ? 'check-circle' :
              activity.action === 'system_error' ? 'alert-circle' : 'info'
      }));

      res.json({
        success: true,
        data: alerts,
        count: alerts.length
      });
    } catch (error) {
      console.error('Error fetching system alerts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch system alerts',
        error: error.message
      });
    }
  }
}

export default ActivityController;
