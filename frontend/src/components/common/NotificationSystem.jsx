import React, { useEffect, useState } from 'react';
import { useAppState } from '../../context/AppStateContext';
import {
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiX,
  FiAlertTriangle
} from 'react-icons/fi';

const NotificationSystem = () => {
  const { notification, clearNotification } = useAppState();
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
      setIsLeaving(false);
    }
  }, [notification]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      clearNotification();
    }, 300);
  };

  if (!notification || !isVisible) return null;

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <FiCheckCircle className="w-5 h-5" />;
      case 'error':
        return <FiAlertCircle className="w-5 h-5" />;
      case 'warning':
        return <FiAlertTriangle className="w-5 h-5" />;
      case 'info':
      default:
        return <FiInfo className="w-5 h-5" />;
    }
  };

  const getStyles = () => {
    const baseStyles = "flex items-center p-4 rounded-lg shadow-lg border";
    
    switch (notification.type) {
      case 'success':
        return `${baseStyles} bg-green-50 border-green-200 text-green-800`;
      case 'error':
        return `${baseStyles} bg-red-50 border-red-200 text-red-800`;
      case 'warning':
        return `${baseStyles} bg-yellow-50 border-yellow-200 text-yellow-800`;
      case 'info':
      default:
        return `${baseStyles} bg-blue-50 border-blue-200 text-blue-800`;
    }
  };

  const getIconColor = () => {
    switch (notification.type) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      case 'info':
      default:
        return 'text-blue-600';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div
        className={`${getStyles()} transform transition-all duration-300 ${
          isLeaving 
            ? 'translate-x-full opacity-0' 
            : 'translate-x-0 opacity-100'
        }`}
      >
        <div className={`${getIconColor()} mr-3`}>
          {getIcon()}
        </div>
        
        <div className="flex-1">
          {notification.title && (
            <h4 className="font-medium mb-1">{notification.title}</h4>
          )}
          <p className="text-sm">{notification.message}</p>
        </div>
        
        <button
          onClick={handleClose}
          className="ml-3 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <FiX className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default NotificationSystem;
