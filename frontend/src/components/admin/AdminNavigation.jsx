import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  FiHome,
  FiUsers,
  FiBarChart,
  FiCalendar,
  FiSettings,
  FiDatabase,
  FiShield,
  FiMail,
  FiServer,
  FiBook,
  FiGrid
} from 'react-icons/fi';

const AdminNavigation = () => {
  const router = useRouter();

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: FiHome,
      current: router.pathname === '/dashboard'
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: FiUsers,
      current: router.pathname === '/admin/users'
    },
    {
      name: 'Students',
      href: '/admin/students',
      icon: FiUsers,
      current: router.pathname === '/admin/students'
    },
    {
      name: 'Departments',
      href: '/admin/departments',
      icon: FiDatabase,
      current: router.pathname === '/admin/departments'
    },
    {
      name: 'Courses',
      href: '/admin/courses',
      icon: FiBook,
      current: router.pathname === '/admin/courses'
    },
    {
      name: 'Timetable',
      href: '/admin/timetable',
      icon: FiGrid,
      current: router.pathname === '/admin/timetable'
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: FiBarChart,
      current: router.pathname === '/admin/analytics'
    },
    {
      name: 'Calendar',
      href: '/admin/calendar',
      icon: FiCalendar,
      current: router.pathname === '/admin/calendar'
    }
  ];



  return (
    <nav className="space-y-1">
      {/* Main Navigation */}
      <div className="space-y-1">
        {navigationItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                item.current
                  ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {IconComponent && (
                <IconComponent
                  className={`mr-3 h-5 w-5 flex-shrink-0 ${
                    item.current ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
              )}
              {item.name}
            </Link>
          );
        })}
      </div>

      {/* Project Analytics Widget */}
      <div className="pt-6">
        <div className="px-1">
          <div className="bg-gradient-to-br from-green-500 to-green-800 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Total Students</h3>
              <div className="bg-white/20 rounded-full p-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-2xl font-bold">24</div>
                <div className="text-xs text-green-100 flex items-center mt-1">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  Increased from last month
                </div>
              </div>
              <div className="bg-white/20 rounded-lg p-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavigation;
