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
  FiServer
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
    },
    {
      name: 'System',
      href: '/admin/system',
      icon: FiSettings,
      current: router.pathname === '/admin/system'
    }
  ];

  const systemItems = [
    {
      name: 'Database',
      href: '/admin/database',
      icon: FiDatabase,
      current: router.pathname === '/admin/database'
    },
    {
      name: 'Security',
      href: '/admin/security',
      icon: FiShield,
      current: router.pathname === '/admin/security'
    },
    {
      name: 'Email',
      href: '/admin/email',
      icon: FiMail,
      current: router.pathname === '/admin/email'
    },
    {
      name: 'Server',
      href: '/admin/server',
      icon: FiServer,
      current: router.pathname === '/admin/server'
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

      {/* System Section */}
      <div className="pt-6">
        <div className="px-3 mb-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            System
          </h3>
        </div>
        <div className="space-y-1">
          {systemItems.map((item) => {
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
      </div>
    </nav>
  );
};

export default AdminNavigation;
