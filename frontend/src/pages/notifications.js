import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { 
  FiBell, 
  FiUser, 
  FiDollarSign, 
  FiCalendar, 
  FiAlertCircle, 
  FiCheckCircle, 
  FiClock,
  FiCheck,
  FiTrash2,
  FiFilter,
  FiSearch
} from 'react-icons/fi';

const NotificationsPage = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState([]);

  // Sample notifications data - replace with API call
  const sampleNotifications = [
    {
      id: 1,
      type: 'payment',
      title: 'Payment Received',
      message: 'Student John Doe has made a payment of $500 for tuition fees.',
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      read: false,
      priority: 'high'
    },
    {
      id: 2,
      type: 'schedule',
      title: 'Class Schedule Updated',
      message: 'Mathematics class has been rescheduled from 10:00 AM to 11:00 AM tomorrow.',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      read: false,
      priority: 'medium'
    },
    {
      id: 3,
      type: 'alert',
      title: 'Overdue Payment Alert',
      message: 'Student Jane Smith has an overdue payment of $300. Please follow up.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      read: true,
      priority: 'high'
    },
    {
      id: 4,
      type: 'success',
      title: 'Report Generated Successfully',
      message: 'Monthly financial report has been generated and is ready for download.',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      read: true,
      priority: 'low'
    },
    {
      id: 5,
      type: 'user',
      title: 'New User Registration',
      message: 'A new teacher, Dr. Sarah Wilson, has registered and is pending approval.',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      read: false,
      priority: 'medium'
    },
    {
      id: 6,
      type: 'schedule',
      title: 'Exam Schedule Released',
      message: 'Final examination schedule for this semester has been published.',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      read: true,
      priority: 'medium'
    }
  ];

  useEffect(() => {
    // Load notifications - replace with actual API call
    setNotifications(sampleNotifications);
  }, []);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'payment':
        return <FiDollarSign className="w-5 h-5 text-green-600" />;
      case 'schedule':
        return <FiCalendar className="w-5 h-5 text-blue-600" />;
      case 'alert':
        return <FiAlertCircle className="w-5 h-5 text-red-600" />;
      case 'success':
        return <FiCheckCircle className="w-5 h-5 text-green-600" />;
      case 'user':
        return <FiUser className="w-5 h-5 text-purple-600" />;
      default:
        return <FiBell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-l-green-500 bg-green-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = filter === 'all' || 
      (filter === 'unread' && !notification.read) || 
      (filter === 'read' && notification.read);
    
    const matchesSearch = searchQuery === '' || 
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

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

  const deleteSelected = () => {
    setNotifications(prev => 
      prev.filter(notification => !selectedNotifications.includes(notification.id))
    );
    setSelectedNotifications([]);
  };

  const toggleSelection = (id) => {
    setSelectedNotifications(prev => 
      prev.includes(id) 
        ? prev.filter(notificationId => notificationId !== id)
        : [...prev, id]
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 lg:ml-64 pt-20 p-4 lg:p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                <div className="flex-1">
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                    Notifications
                  </h1>
                  <p className="text-base text-gray-600">
                    Stay updated with important alerts and messages
                    {unreadCount > 0 && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {unreadCount} unread
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    variant="outline" 
                    icon={FiCheck} 
                    onClick={markAllAsRead}
                    disabled={unreadCount === 0}
                  >
                    Mark All Read
                  </Button>
                  {selectedNotifications.length > 0 && (
                    <Button 
                      variant="danger" 
                      icon={FiTrash2} 
                      onClick={deleteSelected}
                    >
                      Delete Selected ({selectedNotifications.length})
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Filters and Search */}
            <Card>
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search notifications..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent text-sm"
                    />
                  </div>
                </div>

                {/* Filter */}
                <div className="flex items-center space-x-2">
                  <FiFilter className="w-4 h-4 text-gray-500" />
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-green focus:border-transparent"
                  >
                    <option value="all">All Notifications</option>
                    <option value="unread">Unread Only</option>
                    <option value="read">Read Only</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Notifications List */}
            <Card>
              <div className="space-y-4">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-12">
                    <FiBell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
                    <p className="text-gray-500">
                      {searchQuery ? 'Try adjusting your search terms.' : 'You\'re all caught up!'}
                    </p>
                  </div>
                ) : (
                  filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`border-l-4 rounded-lg p-4 transition-all hover:shadow-md ${
                        !notification.read ? 'bg-blue-50 border-l-blue-500' : getPriorityColor(notification.priority)
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        {/* Selection Checkbox */}
                        <input
                          type="checkbox"
                          checked={selectedNotifications.includes(notification.id)}
                          onChange={() => toggleSelection(notification.id)}
                          className="mt-1 h-4 w-4 text-primary-green focus:ring-primary-green border-gray-300 rounded"
                        />

                        {/* Icon */}
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                                {notification.title}
                                {!notification.read && (
                                  <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full inline-block"></span>
                                )}
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                                <div className="flex items-center space-x-1">
                                  <FiClock className="w-3 h-3" />
                                  <span>{getTimeAgo(notification.timestamp)}</span>
                                </div>
                                <span className="capitalize">Priority: {notification.priority}</span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center space-x-2 ml-4">
                              {!notification.read && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                  title="Mark as read"
                                >
                                  <FiCheck className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => deleteNotification(notification.id)}
                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                title="Delete notification"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default NotificationsPage;
