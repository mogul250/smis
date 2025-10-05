import api, { 
  handleApiResponse, 
  validateRequiredFields, 
  validatePositiveNumber 
} from './config';
import {
  Notification,
  SendNotificationData,
  DepartmentNotificationData,
  CourseNotificationData,
  NotificationResponse,
} from './types';

/**
 * Notifications API Module
 * Handles all notification-related API calls
 * All endpoints require authentication
 */
export class NotificationsAPI {
  /**
   * Get user's notifications with pagination
   * GET /api/notifications/:page?/:limit?
   */
  async getNotifications(page?: number, limit?: number): Promise<Notification[]> {
    let url = '/notifications';

    // Validate and add pagination parameters if provided
    if (page !== undefined || limit !== undefined) {
      // Set defaults
      const pageNum = page || 1;
      const limitNum = limit || 10;

      // Validate pagination parameters
      if (!validatePositiveNumber(pageNum)) {
        throw new Error('Page must be a positive integer');
      }

      if (!validatePositiveNumber(limitNum) || limitNum > 100) {
        throw new Error('Limit must be a positive integer not exceeding 100');
      }

      url += `/${pageNum}/${limitNum}`;
    }

    const response = await api.get<Notification[]>(url);
    return handleApiResponse(response);
  }

  /**
   * Mark notification as read
   * PUT /api/notifications/:notificationId/read
   */
  async markAsRead(notificationId: number): Promise<{ message: string }> {
    // Validate notificationId
    if (!validatePositiveNumber(notificationId)) {
      throw new Error('Notification ID must be a positive integer');
    }

    const response = await api.put<{ message: string }>(`/notifications/${notificationId}/read`);
    return handleApiResponse(response);
  }

  /**
   * Mark all notifications as read
   * PUT /api/notifications/read-all
   */
  async markAllAsRead(): Promise<{ message: string }> {
    const response = await api.put<{ message: string }>('/notifications/read-all');
    return handleApiResponse(response);
  }

  /**
   * Send notification to specific users
   * POST /api/notifications/send/user
   * Auth: Required (admin, hod, teacher)
   */
  async sendToUsers(data: SendNotificationData): Promise<NotificationResponse> {
    // Validate required fields
    validateRequiredFields(data, ['recipientIds', 'type', 'title', 'message']);

    // Validate recipientIds
    if (!Array.isArray(data.recipientIds) || data.recipientIds.length === 0) {
      throw new Error('Recipient IDs must be a non-empty array');
    }

    data.recipientIds.forEach((id, index) => {
      if (!validatePositiveNumber(id)) {
        throw new Error(`Recipient ID at index ${index} must be a positive integer`);
      }
    });

    // Validate type
    if (typeof data.type !== 'string' || data.type.trim().length === 0) {
      throw new Error('Type must be a non-empty string');
    }

    // Validate title
    if (typeof data.title !== 'string' || data.title.trim().length === 0) {
      throw new Error('Title must be a non-empty string');
    }

    // Validate message
    if (typeof data.message !== 'string' || data.message.trim().length === 0) {
      throw new Error('Message must be a non-empty string');
    }

    // Validate data field if provided
    if (data.data && typeof data.data !== 'object') {
      throw new Error('Data field must be an object');
    }

    const response = await api.post<NotificationResponse>('/notifications/send/user', data);
    return handleApiResponse(response);
  }

  /**
   * Send notification to department
   * POST /api/notifications/send/department
   * Auth: Required (hod)
   */
  async sendToDepartment(data: DepartmentNotificationData): Promise<NotificationResponse> {
    // Validate required fields
    validateRequiredFields(data, ['departmentId', 'type', 'title', 'message']);

    // Validate departmentId
    if (!validatePositiveNumber(data.departmentId)) {
      throw new Error('Department ID must be a positive integer');
    }

    // Validate role if provided
    if (data.role && typeof data.role !== 'string') {
      throw new Error('Role must be a string');
    }

    // Validate type
    if (typeof data.type !== 'string' || data.type.trim().length === 0) {
      throw new Error('Type must be a non-empty string');
    }

    // Validate title
    if (typeof data.title !== 'string' || data.title.trim().length === 0) {
      throw new Error('Title must be a non-empty string');
    }

    // Validate message
    if (typeof data.message !== 'string' || data.message.trim().length === 0) {
      throw new Error('Message must be a non-empty string');
    }

    // Validate data field if provided
    if (data.data && typeof data.data !== 'object') {
      throw new Error('Data field must be an object');
    }

    const response = await api.post<NotificationResponse>('/notifications/send/department', data);
    return handleApiResponse(response);
  }

  /**
   * Send notification to course students
   * POST /api/notifications/send/course
   * Auth: Required (teacher)
   */
  async sendToCourse(data: CourseNotificationData): Promise<NotificationResponse> {
    // Validate required fields
    validateRequiredFields(data, ['courseId', 'type', 'title', 'message']);

    // Validate courseId
    if (!validatePositiveNumber(data.courseId)) {
      throw new Error('Course ID must be a positive integer');
    }

    // Validate type
    if (typeof data.type !== 'string' || data.type.trim().length === 0) {
      throw new Error('Type must be a non-empty string');
    }

    // Validate title
    if (typeof data.title !== 'string' || data.title.trim().length === 0) {
      throw new Error('Title must be a non-empty string');
    }

    // Validate message
    if (typeof data.message !== 'string' || data.message.trim().length === 0) {
      throw new Error('Message must be a non-empty string');
    }

    // Validate data field if provided
    if (data.data && typeof data.data !== 'object') {
      throw new Error('Data field must be an object');
    }

    const response = await api.post<NotificationResponse>('/notifications/send/course', data);
    return handleApiResponse(response);
  }

  /**
   * Get unread notifications count
   * Helper method to get count of unread notifications
   */
  async getUnreadCount(): Promise<number> {
    const notifications = await this.getNotifications();
    return notifications.filter(n => !n.is_read).length;
  }

  /**
   * Get recent notifications (last 10)
   * Helper method for quick access to recent notifications
   */
  async getRecentNotifications(): Promise<Notification[]> {
    return this.getNotifications(1, 10);
  }

  /**
   * Send announcement to all users in department
   * Helper method for department-wide announcements
   */
  async sendDepartmentAnnouncement(
    departmentId: number,
    title: string,
    message: string,
    role?: string
  ): Promise<NotificationResponse> {
    return this.sendToDepartment({
      departmentId,
      role,
      type: 'announcement',
      title,
      message,
    });
  }

  /**
   * Send assignment notification to course students
   * Helper method for assignment notifications
   */
  async sendAssignmentNotification(
    courseId: number,
    title: string,
    message: string,
    assignmentData?: any
  ): Promise<NotificationResponse> {
    return this.sendToCourse({
      courseId,
      type: 'assignment',
      title,
      message,
      data: assignmentData,
    });
  }

  /**
   * Send exam notification to course students
   * Helper method for exam notifications
   */
  async sendExamNotification(
    courseId: number,
    title: string,
    message: string,
    examData?: any
  ): Promise<NotificationResponse> {
    return this.sendToCourse({
      courseId,
      type: 'exam',
      title,
      message,
      data: examData,
    });
  }

  /**
   * Send grade notification to specific students
   * Helper method for grade notifications
   */
  async sendGradeNotification(
    studentIds: number[],
    title: string,
    message: string,
    gradeData?: any
  ): Promise<NotificationResponse> {
    return this.sendToUsers({
      recipientIds: studentIds,
      type: 'grade',
      title,
      message,
      data: gradeData,
    });
  }

  /**
   * Send fee reminder to specific students
   * Helper method for fee reminders
   */
  async sendFeeReminder(
    studentIds: number[],
    title: string,
    message: string,
    feeData?: any
  ): Promise<NotificationResponse> {
    return this.sendToUsers({
      recipientIds: studentIds,
      type: 'fee_reminder',
      title,
      message,
      data: feeData,
    });
  }

  /**
   * Send system alert to administrators
   * Helper method for system alerts
   */
  async sendSystemAlert(
    adminIds: number[],
    title: string,
    message: string,
    alertData?: any
  ): Promise<NotificationResponse> {
    return this.sendToUsers({
      recipientIds: adminIds,
      type: 'system_alert',
      title,
      message,
      data: alertData,
    });
  }

  /**
   * Mark multiple notifications as read
   * Helper method for bulk marking as read
   */
  async markMultipleAsRead(notificationIds: number[]): Promise<{ success: number; failed: number; errors: string[] }> {
    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      throw new Error('Notification IDs must be a non-empty array');
    }

    const results = await Promise.allSettled(
      notificationIds.map(id => this.markAsRead(id))
    );

    const success = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    const errors = results
      .filter(r => r.status === 'rejected')
      .map(r => (r as PromiseRejectedResult).reason.message);

    return { success, failed, errors };
  }

  /**
   * Get notifications by type
   * Helper method to filter notifications by type
   */
  async getNotificationsByType(type: string, page?: number, limit?: number): Promise<Notification[]> {
    if (typeof type !== 'string' || type.trim().length === 0) {
      throw new Error('Type must be a non-empty string');
    }

    const notifications = await this.getNotifications(page, limit);
    return notifications.filter(n => n.type === type);
  }

  /**
   * Get unread notifications
   * Helper method to get only unread notifications
   */
  async getUnreadNotifications(page?: number, limit?: number): Promise<Notification[]> {
    const notifications = await this.getNotifications(page, limit);
    return notifications.filter(n => !n.is_read);
  }
}

// Create singleton instance
const notificationsAPI = new NotificationsAPI();

// Export individual methods for backward compatibility
export const getNotifications = (page?: number, limit?: number) => notificationsAPI.getNotifications(page, limit);
export const markAsRead = (notificationId: number) => notificationsAPI.markAsRead(notificationId);
export const markAllAsRead = () => notificationsAPI.markAllAsRead();
export const sendToUsers = (data: SendNotificationData) => notificationsAPI.sendToUsers(data);
export const sendToDepartment = (data: DepartmentNotificationData) => notificationsAPI.sendToDepartment(data);
export const sendToCourse = (data: CourseNotificationData) => notificationsAPI.sendToCourse(data);
export const getUnreadCount = () => notificationsAPI.getUnreadCount();
export const getRecentNotifications = () => notificationsAPI.getRecentNotifications();
export const sendDepartmentAnnouncement = (departmentId: number, title: string, message: string, role?: string) => notificationsAPI.sendDepartmentAnnouncement(departmentId, title, message, role);
export const sendAssignmentNotification = (courseId: number, title: string, message: string, assignmentData?: any) => notificationsAPI.sendAssignmentNotification(courseId, title, message, assignmentData);
export const sendExamNotification = (courseId: number, title: string, message: string, examData?: any) => notificationsAPI.sendExamNotification(courseId, title, message, examData);
export const sendGradeNotification = (studentIds: number[], title: string, message: string, gradeData?: any) => notificationsAPI.sendGradeNotification(studentIds, title, message, gradeData);
export const sendFeeReminder = (studentIds: number[], title: string, message: string, feeData?: any) => notificationsAPI.sendFeeReminder(studentIds, title, message, feeData);
export const sendSystemAlert = (adminIds: number[], title: string, message: string, alertData?: any) => notificationsAPI.sendSystemAlert(adminIds, title, message, alertData);
export const markMultipleAsRead = (notificationIds: number[]) => notificationsAPI.markMultipleAsRead(notificationIds);
export const getNotificationsByType = (type: string, page?: number, limit?: number) => notificationsAPI.getNotificationsByType(type, page, limit);
export const getUnreadNotifications = (page?: number, limit?: number) => notificationsAPI.getUnreadNotifications(page, limit);

// Export the class instance as default
export default notificationsAPI;
