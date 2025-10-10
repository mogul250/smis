import React, { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // Sample notifications data - replace with API call
  const sampleNotifications = [
    {
      id: 1,
      type: 'payment',
      title: 'Payment Received',
      message: 'Student John Doe has made a payment of $500 for tuition fees.',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      read: false,
      priority: 'high'
    },
    {
      id: 2,
      type: 'schedule',
      title: 'Class Schedule Updated',
      message: 'Mathematics class has been rescheduled from 10:00 AM to 11:00 AM tomorrow.',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      read: false,
      priority: 'medium'
    },
    {
      id: 3,
      type: 'alert',
      title: 'Overdue Payment Alert',
      message: 'Student Jane Smith has an overdue payment of $300. Please follow up.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: true,
      priority: 'high'
    },
    {
      id: 4,
      type: 'success',
      title: 'Report Generated Successfully',
      message: 'Monthly financial report has been generated and is ready for download.',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      read: true,
      priority: 'low'
    },
    {
      id: 5,
      type: 'user',
      title: 'New User Registration',
      message: 'A new teacher, Dr. Sarah Wilson, has registered and is pending approval.',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      read: false,
      priority: 'medium'
    }
  ];

  useEffect(() => {
    // Load notifications from API or localStorage
    setNotifications(sampleNotifications);
  }, []);

  const addNotification = (notification) => {
    const newNotification = {
      ...notification,
      id: Date.now(),
      timestamp: new Date(),
      read: false
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const getUnreadCount = () => {
    return notifications.filter(n => !n.read).length;
  };

  const value = {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getUnreadCount
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
