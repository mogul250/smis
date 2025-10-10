import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { FiSearch, FiBell, FiMail, FiChevronDown, FiUser, FiSettings, FiLogOut } from 'react-icons/fi';
import NotificationCard from './NotificationCard';

const Header = () => {
  const { user, logout } = useAuth();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationCardOpen, setIsNotificationCardOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoverTimeout, setHoverTimeout] = useState(null);

  const handleSearch = (e) => {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log('Search query:', searchQuery);
  };

  // Sample notifications data - replace with API call
  const sampleNotifications = [
    {
      id: 1,
      type: 'payment',
      title: 'Payment Received',
      message: 'Student John Doe has made a payment of $500 for tuition fees.',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      read: false
    },
    {
      id: 2,
      type: 'schedule',
      title: 'Class Schedule Updated',
      message: 'Mathematics class has been rescheduled from 10:00 AM to 11:00 AM tomorrow.',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      read: false
    },
    {
      id: 3,
      type: 'alert',
      title: 'Overdue Payment Alert',
      message: 'Student Jane Smith has an overdue payment of $300.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: true
    }
  ];

  const unreadCount = sampleNotifications.filter(n => !n.read).length;

  const handleNotificationMouseEnter = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
    setIsNotificationCardOpen(true);
  };

  const handleNotificationMouseLeave = () => {
    const timeout = setTimeout(() => {
      setIsNotificationCardOpen(false);
    }, 500); // 500ms delay before hiding
    setHoverTimeout(timeout);
  };

  const handleKeyDown = (e) => {
    // Handle Cmd+F / Ctrl+F shortcut
    if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
      e.preventDefault();
      document.getElementById('search-input')?.focus();
    }
  };

  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    };
  }, [hoverTimeout]);

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm fixed top-0 left-0 right-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo - Hidden on mobile since sidebar has menu button */}
          <div className="hidden lg:flex items-center flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-16 h-12 flex items-center justify-center">
                <img src="/image/logo/SMIS-Without-word-logo.png" className="w-16 h-12 object-contain" alt="SMIS logo" />
              </div>
            </div>
          </div>

          {/* Mobile Logo - Centered */}
          <div className="lg:hidden flex-1 flex justify-center ml-16">
            <div className="flex items-center space-x-3">
              <div className="w-16 h-12 flex items-center justify-center">
                <img src="/image/logo/SMIS-Without-word-logo.png" className="w-16 h-12 object-contain" alt="SMIS logo" />
              </div>
            </div>
          </div>

          {/* Search Bar - Hidden on mobile */}
          <div className="hidden md:flex flex-1 justify-center max-w-2xl mx-4 lg:mx-8">
            <form onSubmit={handleSearch} className="relative w-full max-w-lg">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  id="search-input"
                  type="text"
                  placeholder="Search task"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent text-sm bg-gray-50 focus:bg-white transition-colors"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 hidden lg:block">
                  <kbd className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-300 rounded">
                    ⌘F
                  </kbd>
                </div>
              </div>
            </form>
          </div>

          {/* Right side - Notifications and Profile */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Search Button - Mobile only */}
            <button className="md:hidden p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <FiSearch className="w-5 h-5" />
            </button>
            

            {/* Notifications */}
            <div className="relative">
              <button 
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors relative"
                onMouseEnter={handleNotificationMouseEnter}
                onMouseLeave={handleNotificationMouseLeave}
                onClick={() => setIsNotificationCardOpen(!isNotificationCardOpen)}
              >
                <FiBell className="w-5 h-5" />
                {/* Notification badge */}
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Card */}
              <div
                onMouseEnter={handleNotificationMouseEnter}
                onMouseLeave={handleNotificationMouseLeave}
              >
                <NotificationCard
                  notifications={sampleNotifications}
                  isVisible={isNotificationCardOpen}
                  onClose={() => setIsNotificationCardOpen(false)}
                />
              </div>
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center space-x-2 sm:space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-8 h-8 bg-primary-green rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {user?.first_name?.[0]}{user?.last_name?.[0]}
                    </span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium text-gray-900">
                      {user?.first_name} {user?.last_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {user?.email}
                    </div>
                  </div>
                </div>
                <FiChevronDown className="hidden sm:block w-4 h-4 text-gray-400" />
              </button>

              {/* Dropdown Menu */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <div className="text-sm font-medium text-gray-900">
                      {user?.first_name} {user?.last_name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Role: {user?.role?.toUpperCase()}
                    </div>
                  </div>

                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
                    <FiUser className="w-4 h-4" />
                    <span>Profile</span>
                  </button>

                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
                    <FiSettings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>

                  <div className="border-t border-gray-100 mt-1">
                    <button
                      onClick={logout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                    >
                      <FiLogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
