import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  FiHome, FiUser, FiBook, FiCalendar, FiDollarSign, 
  FiUsers, FiBarChart3, FiSettings, FiChevronLeft,
  FiChevronRight, FiGraduationCap, FiClipboard
} from 'react-icons/fi';

const Sidebar = () => {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const getMenuItems = () => {
    const baseItems = [
      { icon: FiHome, label: 'Dashboard', path: '/dashboard' }
    ];

    switch (user?.role) {
      case 'student':
        return [
          ...baseItems,
          { icon: FiUser, label: 'Profile', path: '/student/profile' },
          { icon: FiBook, label: 'Grades', path: '/student/grades' },
          { icon: FiClipboard, label: 'Attendance', path: '/student/attendance' },
          { icon: FiCalendar, label: 'Timetable', path: '/student/timetable' },
          { icon: FiDollarSign, label: 'Fees', path: '/student/fees' }
        ];
      
      case 'teacher':
        return [
          ...baseItems,
          { icon: FiUser, label: 'Profile', path: '/teacher/profile' },
          { icon: FiUsers, label: 'Classes', path: '/teacher/classes' },
          { icon: FiClipboard, label: 'Attendance', path: '/teacher/attendance' },
          { icon: FiBook, label: 'Grades', path: '/teacher/grades' },
          { icon: FiCalendar, label: 'Timetable', path: '/teacher/timetable' }
        ];
      
      case 'hod':
        return [
          ...baseItems,
          { icon: FiUsers, label: 'Teachers', path: '/hod/teachers' },
          { icon: FiBarChart3, label: 'Reports', path: '/hod/reports' },
          { icon: FiBook, label: 'Courses', path: '/hod/courses' },
          { icon: FiCalendar, label: 'Timetable', path: '/hod/timetable' },
          { icon: FiSettings, label: 'Approvals', path: '/hod/approvals' }
        ];
      
      case 'finance':
        return [
          ...baseItems,
          { icon: FiDollarSign, label: 'Fees', path: '/finance/fees' },
          { icon: FiBarChart3, label: 'Reports', path: '/finance/reports' },
          { icon: FiUsers, label: 'Students', path: '/finance/students' },
          { icon: FiClipboard, label: 'Invoices', path: '/finance/invoices' }
        ];
      
      case 'admin':
        return [
          ...baseItems,
          { icon: FiUsers, label: 'Users', path: '/admin/users' },
          { icon: FiGraduationCap, label: 'Students', path: '/admin/students' },
          { icon: FiCalendar, label: 'Calendar', path: '/admin/calendar' },
          { icon: FiSettings, label: 'System', path: '/admin/system' },
          { icon: FiBarChart3, label: 'Analytics', path: '/admin/analytics' }
        ];
      
      default:
        return baseItems;
    }
  };

  const menuItems = getMenuItems();

  return (
    <aside className={`bg-gray-50 border-r border-gray-200 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      <div className="p-4">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex justify-end text-gray-500 hover:text-gray-700"
        >
          {isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
        </button>
      </div>
      
      <nav className="px-2">
        {menuItems.map((item, index) => (
          <a
            key={index}
            href={item.path}
            className="flex items-center px-3 py-2 mb-1 text-gray-700 rounded-lg hover:bg-primary-light hover:text-white transition-colors"
          >
            <item.icon className="w-5 h-5" />
            {!isCollapsed && (
              <span className="ml-3 text-sm font-medium">{item.label}</span>
            )}
          </a>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
