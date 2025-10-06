import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import AdminNavigation from '../admin/AdminNavigation';
import {
  FiHome, FiUser, FiBook, FiCalendar, FiDollarSign,
  FiUsers, FiBarChart, FiTrendingUp, FiSettings, FiAward, FiClipboard, FiMail, FiFileText, FiPlus,
  FiHelpCircle, FiLogOut, FiGrid, FiMenu, FiX
} from 'react-icons/fi';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Add safety check for user
  if (!user) {
    return (
      <>
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200 z-40">
          <div className="p-4">
            <div className="text-center text-gray-500">Loading...</div>
          </div>
        </aside>

        {/* Mobile Menu Button */}
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <button className="p-2 rounded-md bg-white shadow-md border border-gray-200">
            <div className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </>
    );
  }

  const getMenuSections = () => {
    const menuSection = {
      title: 'MENU',
      items: [
        { icon: FiHome, label: 'Dashboard', path: '/dashboard' }
      ]
    };

    const generalSection = {
      title: 'GENERAL',
      items: [
        { icon: FiSettings, label: 'Settings', path: '/settings' },
        { icon: FiHelpCircle, label: 'Help', path: '/help' },
        { icon: FiLogOut, label: 'Logout', path: '#', onClick: logout }
      ]
    };

    switch (user?.role) {
      case 'student':
        menuSection.items.push(
          { icon: FiUser, label: 'Profile', path: '/student/profile' },
          { icon: FiBook, label: 'Grades', path: '/student/grades' },
          { icon: FiClipboard, label: 'Attendance', path: '/student/attendance' },
          { icon: FiCalendar, label: 'Timetable', path: '/student/timetable' },
          { icon: FiDollarSign, label: 'Fees', path: '/student/fees' },
          { icon: FiFileText, label: 'Invoices', path: '/student/invoices' },
          { icon: FiPlus, label: 'Fee Request', path: '/student/fee-request' }
        );
        return [menuSection, generalSection];
      
      case 'teacher':
        menuSection.items.push(
          { icon: FiUser, label: 'Profile', path: '/teacher/profile' },
          { icon: FiUsers, label: 'Classes', path: '/teacher/classes' },
          { icon: FiClipboard, label: 'Attendance', path: '/teacher/attendance' },
          { icon: FiBook, label: 'Grades', path: '/teacher/grades' },
          { icon: FiCalendar, label: 'Timetable', path: '/teacher/timetable' }
        );
        return [menuSection, generalSection];
      
      case 'hod':
        menuSection.items.push(
          { icon: FiUsers, label: 'Teachers', path: '/hod/teachers' },
          { icon: FiBook, label: 'Courses', path: '/hod/courses' },
          { icon: FiBarChart, label: 'Reports', path: '/hod/reports' },
          { icon: FiCalendar, label: 'Timetable', path: '/hod/timetable' },
          { icon: FiGrid, label: 'Approvals', path: '/hod/approvals' },
          { icon: FiMail, label: 'Notifications', path: '/hod/notifications' }
        );
        return [menuSection, generalSection];
      
      case 'finance':
        menuSection.items.push(
          { icon: FiDollarSign, label: 'Fees', path: '/finance/fees' },
          { icon: FiTrendingUp, label: 'Reports', path: '/finance/reports' },
          { icon: FiUsers, label: 'Students', path: '/finance/students' },
          { icon: FiClipboard, label: 'Invoices', path: '/finance/invoices' }
        );
        return [menuSection, generalSection];

      case 'admin':
        menuSection.items.push(
          { icon: FiUsers, label: 'Users', path: '/admin/users' },
          { icon: FiAward, label: 'Students', path: '/admin/students' },
          { icon: FiCalendar, label: 'Calendar', path: '/admin/calendar' },
          { icon: FiGrid, label: 'System', path: '/admin/system' },
          { icon: FiTrendingUp, label: 'Analytics', path: '/admin/analytics' }
        );
        return [menuSection, generalSection];

      default:
        return [menuSection, generalSection];
    }
  };

  const menuSections = getMenuSections();

  const isCurrentPath = (path) => {
    return router.pathname === path;
  };

  const handleItemClick = (item) => {
    if (item.onClick) {
      item.onClick();
    }
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-md bg-white shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          {isMobileMenuOpen ? (
            <FiX className="w-6 h-6 text-gray-600" />
          ) : (
            <FiMenu className="w-6 h-6 text-gray-600" />
          )}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Desktop Sidebar - Fixed */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:top-16 bg-white border-r border-gray-200 z-30">
        <div className="flex-1 flex flex-col min-h-0">
          <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
            {user?.role === 'admin' ? (
              <AdminNavigation />
            ) : (
              menuSections.map((section, sectionIndex) => (
                <div key={sectionIndex} className="space-y-2">
                  {/* Section Title */}
                  <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider pt-4">
                    {section.title}
                  </h3>

                  {/* Section Items */}
                  <div className="space-y-1">
                    {section.items.map((item, itemIndex) => {
                      const Icon = item.icon;
                      const isActive = isCurrentPath(item.path);

                      if (!Icon) {
                        console.warn(`Icon is undefined for item:`, item);
                        return null;
                      }

                      if (item.path === '#') {
                        return (
                          <button
                            key={itemIndex}
                            onClick={() => handleItemClick(item)}
                            className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              isActive
                                ? 'bg-primary-green text-white'
                                : 'text-gray-700 hover:bg-green-50 hover:text-primary-green'
                            }`}
                          >
                            <Icon className="w-5 h-5 flex-shrink-0" />
                            <span className="ml-3">{item.label}</span>
                          </button>
                        );
                      }

                      return (
                        <Link
                          key={itemIndex}
                          href={item.path}
                          className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isActive
                              ? 'bg-primary-green text-white'
                              : 'text-gray-700 hover:bg-green-50 hover:text-primary-green'
                          }`}
                        >
                          <Icon className="w-5 h-5 flex-shrink-0" />
                          <span className="ml-3">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </nav>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <aside className={`lg:hidden fixed inset-y-0 left-0 top-16 w-64 bg-white border-r border-gray-200 z-40 transform transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex-1 flex flex-col min-h-0">
          <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
            {user?.role === 'admin' ? (
              <AdminNavigation />
            ) : (
              menuSections.map((section, sectionIndex) => (
                <div key={sectionIndex} className="space-y-2">
                  {/* Section Title */}
                  <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {section.title}
                  </h3>

                  {/* Section Items */}
                  <div className="space-y-1">
                    {section.items.map((item, itemIndex) => {
                      const Icon = item.icon;
                      const isActive = isCurrentPath(item.path);

                      if (!Icon) {
                        console.warn(`Icon is undefined for item:`, item);
                        return null;
                      }

                      if (item.path === '#') {
                        return (
                          <button
                            key={itemIndex}
                            onClick={() => {
                              handleItemClick(item);
                              setIsMobileMenuOpen(false);
                            }}
                            className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              isActive
                                ? 'bg-primary-green text-white'
                                : 'text-gray-700 hover:bg-green-50 hover:text-primary-green'
                            }`}
                          >
                            <Icon className="w-5 h-5 flex-shrink-0" />
                            <span className="ml-3">{item.label}</span>
                          </button>
                        );
                      }

                      return (
                        <Link
                          key={itemIndex}
                          href={item.path}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isActive
                              ? 'bg-primary-green text-white'
                              : 'text-gray-700 hover:bg-green-50 hover:text-primary-green'
                          }`}
                        >
                          <Icon className="w-5 h-5 flex-shrink-0" />
                          <span className="ml-3">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
