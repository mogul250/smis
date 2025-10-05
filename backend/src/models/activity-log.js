import pool from '../config/database.js';

class ActivityLog {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.action = data.action;
    this.entity_type = data.entity_type;
    this.entity_id = data.entity_id;
    this.description = data.description;
    this.metadata = data.metadata;
    this.ip_address = data.ip_address;
    this.user_agent = data.user_agent;
    this.created_at = data.created_at;
  }

  // Create a new activity log entry
  static async create(activityData) {
    const {
      user_id,
      action,
      entity_type,
      entity_id,
      description,
      metadata,
      ip_address,
      user_agent
    } = activityData;

    const query = `
      INSERT INTO activity_logs (
        user_id, action, entity_type, entity_id, description, 
        metadata, ip_address, user_agent, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const values = [
      user_id,
      action,
      entity_type,
      entity_id || null,
      description,
      JSON.stringify(metadata || {}),
      ip_address || null,
      user_agent || null
    ];

    try {
      const [result] = await pool.execute(query, values);
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating activity log: ${error.message}`);
    }
  }

  // Get recent activities for a specific user
  static async getByUser(userId, limit = 10) {
    const query = `
      SELECT al.*, 
             CONCAT(u.first_name, ' ', u.last_name) as user_name,
             u.email as user_email,
             u.role as user_role
      FROM activity_logs al
      JOIN users u ON al.user_id = u.id
      WHERE al.user_id = ?
      ORDER BY al.created_at DESC
      LIMIT ?
    `;

    try {
      const [rows] = await pool.execute(query, [userId, limit]);
      return rows.map(row => ({
        ...new ActivityLog(row),
        user_name: row.user_name,
        user_email: row.user_email,
        user_role: row.user_role
      }));
    } catch (error) {
      throw new Error(`Error fetching user activities: ${error.message}`);
    }
  }

  // Get recent activities for admin dashboard (all users)
  static async getRecentActivities(limit = 20, filters = {}) {
    let query = `
      SELECT al.*, 
             CONCAT(u.first_name, ' ', u.last_name) as user_name,
             u.email as user_email,
             u.role as user_role
      FROM activity_logs al
      JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // Apply filters
    if (filters.action) {
      query += ' AND al.action = ?';
      params.push(filters.action);
    }

    if (filters.entity_type) {
      query += ' AND al.entity_type = ?';
      params.push(filters.entity_type);
    }

    if (filters.user_role) {
      query += ' AND u.role = ?';
      params.push(filters.user_role);
    }

    if (filters.date_from) {
      query += ' AND al.created_at >= ?';
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      query += ' AND al.created_at <= ?';
      params.push(filters.date_to);
    }

    query += ' ORDER BY al.created_at DESC LIMIT ?';
    params.push(limit);

    try {
      const [rows] = await pool.execute(query, params);
      return rows.map(row => ({
        ...new ActivityLog(row),
        user_name: row.user_name,
        user_email: row.user_email,
        user_role: row.user_role
      }));
    } catch (error) {
      throw new Error(`Error fetching recent activities: ${error.message}`);
    }
  }

  // Get activities by entity type (for specific dashboard contexts)
  static async getByEntityType(entityType, limit = 10) {
    const query = `
      SELECT al.*, 
             CONCAT(u.first_name, ' ', u.last_name) as user_name,
             u.email as user_email,
             u.role as user_role
      FROM activity_logs al
      JOIN users u ON al.user_id = u.id
      WHERE al.entity_type = ?
      ORDER BY al.created_at DESC
      LIMIT ?
    `;

    try {
      const [rows] = await pool.execute(query, [entityType, limit]);
      return rows.map(row => ({
        ...new ActivityLog(row),
        user_name: row.user_name,
        user_email: row.user_email,
        user_role: row.user_role
      }));
    } catch (error) {
      throw new Error(`Error fetching activities by entity type: ${error.message}`);
    }
  }

  // Get activity statistics
  static async getActivityStats(dateRange = 7) {
    const query = `
      SELECT 
        action,
        entity_type,
        COUNT(*) as count,
        DATE(created_at) as date
      FROM activity_logs
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY action, entity_type, DATE(created_at)
      ORDER BY created_at DESC
    `;

    try {
      const [rows] = await pool.execute(query, [dateRange]);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching activity stats: ${error.message}`);
    }
  }

  // Helper method to log common activities
  static async logActivity(userId, action, entityType, entityId, description, metadata = {}, req = null) {
    const activityData = {
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      description,
      metadata,
      ip_address: req?.ip || req?.connection?.remoteAddress,
      user_agent: req?.get('User-Agent')
    };

    return await this.create(activityData);
  }
}

export default ActivityLog;
