import React from 'react';
import Link from 'next/link';
import { FiBell, FiUser, FiDollarSign, FiCalendar, FiAlertCircle, FiCheckCircle, FiClock } from 'react-icons/fi';

const NotificationCard = ({ notifications = [], isVisible, onClose }) => {
  if (!isVisible) return null;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'payment':
        return <FiDollarSign className="w-4 h-4 text-green-600" />;
      case 'schedule':
        return <FiCalendar className="w-4 h-4 text-blue-600" />;
      case 'alert':
        return <FiAlertCircle className="w-4 h-4 text-red-600" />;
      case 'success':
        return <FiCheckCircle className="w-4 h-4 text-green-600" />;
      case 'user':
        return <FiUser className="w-4 h-4 text-purple-600" />;
      default:
        return <FiBell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="absolute right-0 mt-1 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden" style={{ maxHeight: 'calc(24rem + 3px)' }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">{notifications.length} new</span>
          <Link 
            href="/notifications" 
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            onClick={onClose}
          >
            View All
          </Link>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-80 overflow-y-auto" style={{ maxHeight: 'calc(20rem + 3px)' }}>
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <FiBell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No new notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.slice(0, 5).map((notification) => (
              <div
                key={notification.id}
                className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                  !notification.read ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">
                      {notification.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center mt-2 space-x-2">
                      <FiClock className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-400">
                        {getTimeAgo(notification.timestamp)}
                      </span>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
          <Link
            href="/notifications"
            className="block text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
            onClick={onClose}
          >
            View All Notifications ({notifications.length})
          </Link>
        </div>
      )}
    </div>
  );
};

export default NotificationCard;
