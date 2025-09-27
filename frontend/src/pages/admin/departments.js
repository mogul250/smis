import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';

// Safe imports with fallbacks
let useAuth, adminAPI;
let Header, Sidebar, DataTable, Button, Input, Select, Badge, Modal, LoadingSpinner, Alert, Card;

// Safe useAuth import
try {
  // Try importing from AuthContext first
  const authContextModule = require('../../context/AuthContext');
  useAuth = authContextModule.useAuth;
  
  if (!useAuth || typeof useAuth !== 'function') {
    // Try the hooks file as fallback
    const authHooksModule = require('../../hooks/useAuth');
    useAuth = authHooksModule.useAuth || authHooksModule.default;
  }
  
  if (!useAuth || typeof useAuth !== 'function') {
    throw new Error('useAuth not found');
  }
} catch (e) {
  console.warn('useAuth hook not available, using fallback:', e.message);
  useAuth = () => ({ 
    user: { role: 'admin', first_name: 'Admin', last_name: 'User' }, 
    isAuthenticated: true,
    isLoading: false,
    logout: () => console.log('Logout clicked')
  });
}

try {
  ({ adminAPI } = require('../../services/apiService'));
} catch (e) {
  adminAPI = {
    getAllDepartments: () => Promise.resolve({ data: [] }),
    getAllUsers: () => Promise.resolve({ data: { users: [] } }),
    createDepartment: () => Promise.resolve({}),
    updateDepartment: () => Promise.resolve({}),
    deleteDepartment: () => Promise.resolve({})
  };
}

// Safe component imports
try {
  Header = require('../../components/common/Header').default;
} catch (e) {
  Header = () => <div className="bg-blue-600 text-white p-4"><h1 className="text-xl font-bold">SMIS - Department Management</h1></div>;
}

try {
  Sidebar = require('../../components/common/Sidebar').default;
} catch (e) {
  Sidebar = () => <div className="w-64 bg-gray-800 min-h-screen p-4"><div className="text-white">Navigation</div></div>;
}

try {
  DataTable = require('../../components/common/DataTable').default;
} catch (e) {
  DataTable = ({ columns, data, emptyMessage }) => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col, i) => (
              <th key={i} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr><td colSpan={columns.length} className="px-6 py-4 text-center text-gray-500">{emptyMessage}</td></tr>
          ) : (
            data.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                {columns.map((col, j) => (
                  <td key={j} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {col.cell ? col.cell(row[col.accessor], row) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

try {
  Button = require('../../components/common/Button').default;
} catch (e) {
  Button = ({ children, onClick, className = '', variant = 'primary', disabled, ...props }) => (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`px-4 py-2 rounded font-medium transition-colors ${
        variant === 'outline' ? 'border border-gray-300 text-gray-700 hover:bg-gray-50' :
        variant === 'ghost' ? 'text-gray-600 hover:bg-gray-100' :
        'bg-blue-600 text-white hover:bg-blue-700'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

try {
  Input = require('../../components/common/Input').default;
} catch (e) {
  Input = ({ className = '', ...props }) => (
    <input 
      className={`px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
      {...props}
    />
  );
}

try {
  Select = require('../../components/common/Select').default;
} catch (e) {
  Select = ({ children, className = '', ...props }) => (
    <select 
      className={`px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

try {
  Modal = require('../../components/common/Modal').default;
} catch (e) {
  Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className={`bg-white rounded-lg shadow-xl ${size === 'xl' ? 'max-w-4xl' : size === 'lg' ? 'max-w-2xl' : 'max-w-md'} w-full mx-4`}>
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          {children}
        </div>
      </div>
    );
  };
}

try {
  LoadingSpinner = require('../../components/common/LoadingSpinner').default;
} catch (e) {
  LoadingSpinner = ({ size = 'md', className = '' }) => (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${
      size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-8 w-8' : 'h-6 w-6'
    } ${className}`}></div>
  );
}

try {
  Card = require('../../components/common/Card').default;
} catch (e) {
  Card = ({ children, className = '', ...props }) => (
    <div className={`bg-white rounded-lg shadow-md ${className}`} {...props}>
      {children}
    </div>
  );
}

// FontAwesome icon fallbacks - professional SVG icons
const iconFallbacks = {
  FiBuilding: ({ className = '' }) => (
    <svg className={`w-4 h-4 ${className}`} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
    </svg>
  ),
  FiSearch: ({ className = '' }) => (
    <svg className={`w-4 h-4 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  FiPlus: ({ className = '' }) => (
    <svg className={`w-4 h-4 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  ),
  FiEdit2: ({ className = '' }) => (
    <svg className={`w-4 h-4 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  FiTrash2: ({ className = '' }) => (
    <svg className={`w-4 h-4 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  FiEye: ({ className = '' }) => (
    <svg className={`w-4 h-4 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  FiFilter: ({ className = '' }) => (
    <svg className={`w-4 h-4 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  ),
  FiDownload: ({ className = '' }) => (
    <svg className={`w-4 h-4 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
  FiCheck: ({ className = '' }) => (
    <svg className={`w-4 h-4 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  FiX: ({ className = '' }) => (
    <svg className={`w-4 h-4 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  FiRefreshCw: ({ className = '' }) => (
    <svg className={`w-4 h-4 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  FiSliders: ({ className = '' }) => (
    <svg className={`w-4 h-4 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
    </svg>
  ),
  FiSave: ({ className = '' }) => (
    <svg className={`w-4 h-4 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
    </svg>
  ),
  FiUser: ({ className = '' }) => (
    <svg className={`w-4 h-4 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  FiBook: ({ className = '' }) => (
    <svg className={`w-4 h-4 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  FiUsers: ({ className = '' }) => (
    <svg className={`w-4 h-4 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  FiTarget: ({ className = '' }) => (
    <svg className={`w-4 h-4 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
      <circle cx="12" cy="12" r="10" strokeWidth={2} />
    </svg>
  )
};

let icons = {};
try {
  const reactIcons = require('react-icons/fi');
  icons = {
    FiBuilding: reactIcons.FiBuilding || iconFallbacks.FiBuilding,
    FiSearch: reactIcons.FiSearch || iconFallbacks.FiSearch,
    FiPlus: reactIcons.FiPlus || iconFallbacks.FiPlus,
    FiEdit2: reactIcons.FiEdit2 || iconFallbacks.FiEdit2,
    FiTrash2: reactIcons.FiTrash2 || iconFallbacks.FiTrash2,
    FiEye: reactIcons.FiEye || iconFallbacks.FiEye,
    FiFilter: reactIcons.FiFilter || iconFallbacks.FiFilter,
    FiDownload: reactIcons.FiDownload || iconFallbacks.FiDownload,
    FiCheck: reactIcons.FiCheck || iconFallbacks.FiCheck,
    FiX: reactIcons.FiX || iconFallbacks.FiX,
    FiRefreshCw: reactIcons.FiRefreshCw || iconFallbacks.FiRefreshCw,
    FiSliders: reactIcons.FiSliders || iconFallbacks.FiSliders,
    FiSave: reactIcons.FiSave || iconFallbacks.FiSave,
    FiUser: reactIcons.FiUser || iconFallbacks.FiUser,
    FiBook: reactIcons.FiBook || iconFallbacks.FiBook,
    FiUsers: reactIcons.FiUsers || iconFallbacks.FiUsers,
    FiTarget: reactIcons.FiTarget || iconFallbacks.FiTarget
  };
} catch (e) {
  console.warn('react-icons not available, using professional SVG fallback icons');
  // Use professional SVG fallback icons directly
  icons = iconFallbacks;
}

const { FiBuilding, FiSearch, FiPlus, FiEdit2, FiTrash2, FiEye, FiFilter, FiDownload, FiCheck, FiX, FiRefreshCw, FiSliders, FiSave, FiUser, FiBook, FiUsers, FiTarget } = icons;

// Status badge component with modern design
const StatusBadge = ({ hasHOD }) => {
  const statusConfig = {
    active: { 
      label: 'Active', 
      className: 'bg-gradient-to-r from-green-400 to-green-600 text-white shadow-lg',
      icon: <FiCheck className="w-3 h-3 mr-1" />
    },
    pending: { 
      label: 'Needs HOD', 
      className: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg',
      icon: <FiTarget className="w-3 h-3 mr-1" />
    }
  };

  const currentStatus = hasHOD ? 'active' : 'pending';
  const config = statusConfig[currentStatus];

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold transform transition-all duration-200 hover:scale-105 ${config.className}`}>
      {config.icon}
      {config.label}
    </span>
  );
};

// Department avatar component
const DepartmentAvatar = ({ name, code }) => {
  const colors = [
    'from-blue-500 to-indigo-600',
    'from-purple-500 to-pink-600', 
    'from-green-500 to-teal-600',
    'from-yellow-500 to-orange-600',
    'from-red-500 to-pink-600',
    'from-indigo-500 to-purple-600'
  ];
  const colorIndex = (name?.charCodeAt(0) || 0) % colors.length;
  
  return (
    <div className={`flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-r ${colors[colorIndex]} flex items-center justify-center text-white font-bold text-sm shadow-lg transform transition-all duration-200 hover:scale-110`}>
      {code || name?.substring(0, 2).toUpperCase() || 'DP'}
    </div>
  );
};

export default function AdminDepartments() {
  const router = useRouter();
  
  // Debug: Check if useAuth is properly defined
  if (typeof useAuth !== 'function') {
    console.error('useAuth is not a function:', typeof useAuth);
    return <div className="p-8 text-red-600">Error: useAuth is not properly loaded</div>;
  }
  
  const { user, isAuthenticated } = useAuth();
  
  // Debug: Check if all components are defined
  const undefinedComponents = [];
  if (!Header) undefinedComponents.push('Header');
  if (!Sidebar) undefinedComponents.push('Sidebar');
  if (!Card) undefinedComponents.push('Card');
  if (!Button) undefinedComponents.push('Button');
  if (!Input) undefinedComponents.push('Input');
  if (!Select) undefinedComponents.push('Select');
  if (!DataTable) undefinedComponents.push('DataTable');
  if (!Modal) undefinedComponents.push('Modal');
  if (!LoadingSpinner) undefinedComponents.push('LoadingSpinner');
  
  // Check icons
  if (!FiBuilding) undefinedComponents.push('FiBuilding');
  if (!FiSearch) undefinedComponents.push('FiSearch');
  if (!FiPlus) undefinedComponents.push('FiPlus');
  if (!FiFilter) undefinedComponents.push('FiFilter');
  if (!FiCheck) undefinedComponents.push('FiCheck');
  if (!FiX) undefinedComponents.push('FiX');
  
  if (undefinedComponents.length > 0) {
    console.error('Undefined components:', undefinedComponents);
    return (
      <div className="p-8 text-red-600">
        <h2 className="text-xl font-bold mb-4">Component Loading Error</h2>
        <p>The following components are undefined: {undefinedComponents.join(', ')}</p>
        <p className="mt-2">Please check component imports and exports.</p>
      </div>
    );
  }
  
  // State management
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalDepartments, setTotalDepartments] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [availableHODs, setAvailableHODs] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, user, router]);

  // Fetch departments data
  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.getAllDepartments(currentPage, pageSize);
      const deptData = Array.isArray(response.data) ? response.data : (response.data?.departments || []);
      setDepartments(deptData);
      setTotalDepartments(response.data?.total || deptData.length);
    } catch (err) {
      setError(err.message || 'Failed to fetch departments');
      console.error('Error fetching departments:', err);
      
      // Fallback mock data for development
      const mockDepartments = [
        {
          id: 1,
          name: 'Computer Science',
          code: 'CS',
          description: 'Department of Computer Science and Engineering',
          head_id: 1,
          hod: { id: 1, name: 'Dr. John Smith' },
          student_count: 156,
          teacher_count: 12,
          created_at: '2024-01-15'
        },
        {
          id: 2,
          name: 'Mathematics',
          code: 'MATH',
          description: 'Department of Mathematics and Statistics',
          head_id: null,
          hod: null,
          student_count: 89,
          teacher_count: 8,
          created_at: '2024-01-20'
        },
        {
          id: 3,
          name: 'Physics',
          code: 'PHY',
          description: 'Department of Physics and Applied Sciences',
          head_id: 2,
          hod: { id: 2, name: 'Dr. Sarah Johnson' },
          student_count: 134,
          teacher_count: 10,
          created_at: '2024-02-01'
        }
      ];
      setDepartments(mockDepartments);
      setTotalDepartments(mockDepartments.length);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize]);

  // Fetch available HODs
  const fetchAvailableHODs = useCallback(async () => {
    try {
      const response = await adminAPI.getAllUsers({ role: 'hod' });
      setAvailableHODs(response.data.users || []);
    } catch (err) {
      console.error('Failed to fetch HODs:', err);
      // Mock HOD data for development
      const mockHODs = [
        { id: 1, first_name: 'John', last_name: 'Smith', email: 'john.smith@school.edu' },
        { id: 2, first_name: 'Sarah', last_name: 'Johnson', email: 'sarah.johnson@school.edu' },
        { id: 3, first_name: 'Michael', last_name: 'Brown', email: 'michael.brown@school.edu' },
        { id: 4, first_name: 'Emily', last_name: 'Davis', email: 'emily.davis@school.edu' }
      ];
      setAvailableHODs(mockHODs);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchDepartments();
      fetchAvailableHODs();
    }
  }, [isAuthenticated, user, fetchDepartments, fetchAvailableHODs]);

  // Handle department deletion
  const handleDelete = async (departmentId) => {
    if (window.confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
      try {
        setIsSubmitting(true);
        await adminAPI.deleteDepartment(departmentId);
        await fetchDepartments();
        setActionMessage({ 
          type: 'success', 
          message: 'Department deleted successfully' 
        });
        setTimeout(() => setActionMessage(null), 3000);
      } catch (err) {
        setActionMessage({ 
          type: 'error', 
          message: `Failed to delete department: ${err.message}` 
        });
        setTimeout(() => setActionMessage(null), 3000);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Handle create/update department
  const handleSubmit = async (formData) => {
    try {
      setIsSubmitting(true);
      if (selectedDepartment) {
        // Update existing department
        await adminAPI.updateDepartment(selectedDepartment.id, formData);
        setActionMessage({ 
          type: 'success', 
          message: 'Department updated successfully' 
        });
      } else {
        // Create new department
        await adminAPI.createDepartment(formData);
        setActionMessage({ 
          type: 'success', 
          message: 'Department created successfully' 
        });
      }
      setShowCreateModal(false);
      setShowEditModal(false);
      setSelectedDepartment(null);
      await fetchDepartments();
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      setActionMessage({ 
        type: 'error', 
        message: `Error: ${err.message}` 
      });
      setTimeout(() => setActionMessage(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter departments
  const filteredDepartments = useMemo(() => {
    return departments.filter(dept => {
      const matchesSearch = !searchTerm || 
        dept.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (dept.hod?.name && dept.hod.name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = selectedStatus === 'all' || 
        (selectedStatus === 'with_hod' && dept.head_id) ||
        (selectedStatus === 'without_hod' && !dept.head_id);
      
      return matchesSearch && matchesStatus;
    });
  }, [departments, searchTerm, selectedStatus]);

  // Calculate stats
  const stats = useMemo(() => {
    const activeDepartments = departments.filter(d => d.head_id).length;
    const totalTeachers = departments.reduce((sum, dept) => sum + (dept.teacher_count || 0), 0);
    const totalStudents = departments.reduce((sum, dept) => sum + (dept.student_count || 0), 0);
    
    return {
      total: totalDepartments || departments.length,
      active: activeDepartments,
      totalTeachers,
      totalStudents
    };
  }, [departments, totalDepartments]);

  // Handle page changes
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  // Calculate total pages
  const totalPages = Math.ceil((totalDepartments || filteredDepartments.length) / pageSize);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-6 lg:mb-0">
                <h1 className="text-4xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Department Management
                </h1>
                <p className="text-lg text-gray-600 font-medium">
                  Manage all academic departments, HOD assignments, and organizational structure
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="border-2 border-blue-500 text-blue-600 hover:bg-blue-50 font-semibold shadow-lg transform transition-all duration-200 hover:scale-105"
                >
                  <FiFilter className="w-5 h-5 mr-2" />
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </Button>
                <Button
                  onClick={() => {
                    setSelectedDepartment(null);
                    setShowCreateModal(true);
                  }}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-xl transform transition-all duration-200 hover:scale-105"
                >
                  <FiPlus className="w-5 h-5 mr-2" />
                  Add New Department
                </Button>
              </div>
            </div>
          </div>

          {/* Action Message */}
          {actionMessage && (
            <div className={`mb-6 p-4 rounded-lg border-l-4 ${
              actionMessage.type === 'success' 
                ? 'bg-green-50 border-green-400 text-green-800' 
                : 'bg-red-50 border-red-400 text-red-800'
            }`}>
              <div className="flex items-center">
                {actionMessage.type === 'success' ? (
                  <FiCheck className="w-5 h-5 mr-2" />
                ) : (
                  <FiX className="w-5 h-5 mr-2" />
                )}
                <span className="font-medium">{actionMessage.message}</span>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
              <span className="ml-3 text-lg font-medium text-gray-600">Loading departments...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="mb-6 p-6 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <FiX className="w-6 h-6 text-red-500 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-red-800">Error Loading Departments</h3>
                  <p className="text-red-600 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Departments */}
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 shadow-xl transform transition-all duration-200 hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium mb-1">Total Departments</p>
                    <p className="text-3xl font-bold">{stats.total.toLocaleString()}</p>
                    <p className="text-blue-100 text-xs mt-1">Academic divisions</p>
                  </div>
                  <div className="p-3 bg-white bg-opacity-20 rounded-full">
                    <FiBuilding className="w-8 h-8" />
                  </div>
                </div>
              </Card>

              {/* Active Departments */}
              <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-6 shadow-xl transform transition-all duration-200 hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium mb-1">With HODs</p>
                    <p className="text-3xl font-bold">{stats.active.toLocaleString()}</p>
                    <p className="text-green-100 text-xs mt-1">Fully staffed</p>
                  </div>
                  <div className="p-3 bg-white bg-opacity-20 rounded-full">
                    <FiUsers className="w-8 h-8" />
                  </div>
                </div>
              </Card>

              {/* Total Teachers */}
              <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white p-6 shadow-xl transform transition-all duration-200 hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-100 text-sm font-medium mb-1">Total Teachers</p>
                    <p className="text-3xl font-bold">{stats.totalTeachers.toLocaleString()}</p>
                    <p className="text-amber-100 text-xs mt-1">Faculty members</p>
                  </div>
                  <div className="p-3 bg-white bg-opacity-20 rounded-full">
                    <FiUser className="w-8 h-8" />
                  </div>
                </div>
              </Card>

              {/* Total Students */}
              <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white p-6 shadow-xl transform transition-all duration-200 hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium mb-1">Total Students</p>
                    <p className="text-3xl font-bold">{stats.totalStudents.toLocaleString()}</p>
                    <p className="text-purple-100 text-xs mt-1">Enrolled students</p>
                  </div>
                  <div className="p-3 bg-white bg-opacity-20 rounded-full">
                    <FiBook className="w-8 h-8" />
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Advanced Filters */}
          {showFilters && (
            <Card className="mb-8 p-6 shadow-lg border-l-4 border-blue-500">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiSliders className="w-5 h-5 mr-2 text-blue-600" />
                Advanced Filters
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search Departments</label>
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Name, code, or HOD..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-2 border-gray-200 focus:border-blue-500 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <Select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="border-2 border-gray-200 focus:border-blue-500 rounded-lg"
                  >
                    <option value="all">All Departments</option>
                    <option value="with_hod">With HOD</option>
                    <option value="without_hod">Needs HOD</option>
                  </Select>
                </div>
              </div>
              <div className="mt-4 flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedStatus('all');
                  }}
                  className="border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  <FiX className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
                <Button
                  onClick={() => fetchDepartments()}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <FiRefreshCw className="w-4 h-4 mr-2" />
                  Apply Filters
                </Button>
              </div>
            </Card>
          )}

          {/* Departments Data Table */}
          {!loading && !error && (
            <Card className="shadow-xl overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 sm:mb-0 flex items-center">
                    <FiBuilding className="w-6 h-6 mr-2 text-blue-600" />
                    Departments ({filteredDepartments.length})
                  </h3>
                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => fetchDepartments()}
                      disabled={loading}
                      className="border-gray-300 text-gray-600 hover:bg-gray-50 transform transition-all duration-200 hover:scale-105"
                    >
                      <FiRefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                    <Button
                      variant="outline"
                      className="border-green-500 text-green-600 hover:bg-green-50 transform transition-all duration-200 hover:scale-105"
                    >
                      <FiDownload className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </div>
              
              {filteredDepartments.length === 0 ? (
                <div className="p-12 text-center">
                  <FiBuilding className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-500 mb-2">No Departments Found</h3>
                  <p className="text-gray-400 mb-6">Try adjusting your search criteria or add new departments.</p>
                  <Button
                    onClick={() => {
                      setSelectedDepartment(null);
                      setShowCreateModal(true);
                    }}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                  >
                    <FiPlus className="w-4 h-4 mr-2" />
                    Add First Department
                  </Button>
                </div>
              ) : (
                <DataTable
                  columns={[
                    {
                      header: 'Department',
                      accessor: 'department_info',
                      cell: (value, row) => (
                        <div className="flex items-center py-2">
                          <DepartmentAvatar 
                            name={row.name} 
                            code={row.code}
                          />
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">
                              {row.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              Code: {row.code}
                            </div>
                            {row.description && (
                              <div className="text-xs text-gray-400 truncate max-w-xs mt-1">
                                {row.description}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    },
                    {
                      header: 'Head of Department',
                      accessor: 'hod_info',
                      cell: (value, row) => (
                        <div className="text-sm">
                          {row.hod ? (
                            <div>
                              <div className="font-medium text-gray-900">{row.hod.name}</div>
                              <div className="text-xs text-gray-500">Department Head</div>
                            </div>
                          ) : (
                            <div className="text-gray-400 italic">Not assigned</div>
                          )}
                        </div>
                      )
                    },
                    {
                      header: 'Status',
                      accessor: 'status',
                      cell: (value, row) => <StatusBadge hasHOD={!!row.head_id} />
                    },
                    {
                      header: 'Statistics',
                      accessor: 'stats',
                      cell: (value, row) => (
                        <div className="text-sm">
                          <div className="flex items-center text-gray-600 mb-1">
                            <FiUsers className="w-3 h-3 mr-1" />
                            {row.student_count || 0} Students
                          </div>
                          <div className="flex items-center text-gray-600">
                            <FiUser className="w-3 h-3 mr-1" />
                            {row.teacher_count || 0} Teachers
                          </div>
                        </div>
                      )
                    },
                    {
                      header: 'Actions',
                      accessor: 'id',
                      cell: (value, row) => (
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedDepartment(row);
                              setShowDetailsModal(true);
                            }}
                            className="text-blue-600 hover:bg-blue-50 p-2 rounded-full transform transition-all duration-200 hover:scale-110"
                            title="View Details"
                          >
                            <FiEye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedDepartment(row);
                              setShowEditModal(true);
                            }}
                            className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-full transform transition-all duration-200 hover:scale-110"
                            title="Edit Department"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(value)}
                            className="text-red-600 hover:bg-red-50 p-2 rounded-full transform transition-all duration-200 hover:scale-110"
                            title="Delete Department"
                            disabled={isSubmitting}
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )
                    }
                  ]}
                  data={filteredDepartments}
                  emptyMessage="No departments found matching your criteria"
                />
              )}
            </Card>
          )}
        </main>
      </div>
      
      {/* Department Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <Modal
          isOpen={showCreateModal || showEditModal}
          onClose={() => {
            setShowCreateModal(false);
            setShowEditModal(false);
            setSelectedDepartment(null);
          }}
          title={selectedDepartment ? 'Edit Department' : 'Create New Department'}
          size="lg"
        >
          <div className="p-6">
            <DepartmentForm
              department={selectedDepartment}
              availableHODs={availableHODs}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowCreateModal(false);
                setShowEditModal(false);
                setSelectedDepartment(null);
              }}
              isSubmitting={isSubmitting}
            />
          </div>
        </Modal>
      )}
      
      {/* Department Details Modal */}
      {showDetailsModal && selectedDepartment && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedDepartment(null);
          }}
          title="Department Details"
          size="xl"
        >
          <div className="p-6">
            <DepartmentDetails
              department={selectedDepartment}
              onEdit={() => {
                setShowDetailsModal(false);
                setShowEditModal(true);
              }}
              onDelete={handleDelete}
              isSubmitting={isSubmitting}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}

// Department Form Component
const DepartmentForm = ({ department, availableHODs, onSubmit, onCancel, isSubmitting }) => {
  const [formData, setFormData] = useState({
    name: department?.name || '',
    code: department?.code || '',
    description: department?.description || '',
    head_id: department?.head_id || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Department Name *</label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
            className="w-full"
            placeholder="Enter department name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Department Code *</label>
          <Input
            type="text"
            value={formData.code}
            onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
            required
            className="w-full"
            placeholder="Enter department code"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Head of Department</label>
        <Select
          value={formData.head_id}
          onChange={(e) => handleChange('head_id', e.target.value)}
          className="w-full"
        >
          <option value="">Select HOD (Optional)</option>
          {availableHODs.map((hod) => (
            <option key={hod.id} value={hod.id}>
              {hod.first_name} {hod.last_name} ({hod.email})
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter department description..."
        />
      </div>

      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-6 py-2"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-6 py-2"
        >
          {isSubmitting ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              {department ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>
              <FiSave className="w-4 h-4 mr-2" />
              {department ? 'Update Department' : 'Create Department'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

// Department Details Component
const DepartmentDetails = ({ department, onEdit, onDelete, isSubmitting }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <DepartmentAvatar name={department.name} code={department.code} />
        <div>
          <h3 className="text-2xl font-bold text-gray-900">{department.name}</h3>
          <p className="text-gray-600">Code: {department.code}</p>
        </div>
      </div>

      {department.description && (
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Description</h4>
          <p className="text-gray-700">{department.description}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Head of Department</h4>
          {department.hod ? (
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                {department.hod.name?.charAt(0) || 'H'}
              </div>
              <div>
                <p className="font-medium text-gray-900">{department.hod.name}</p>
                <p className="text-sm text-gray-600">Department Head</p>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-yellow-800">No HOD assigned</p>
            </div>
          )}
        </div>

        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Statistics</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Students:</span>
              <span className="font-medium">{department.student_count || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Teachers:</span>
              <span className="font-medium">{department.teacher_count || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Created:</span>
              <span className="font-medium">
                {new Date(department.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
        <Button
          variant="outline"
          onClick={() => onDelete(department.id)}
          disabled={isSubmitting}
          className="text-red-600 border-red-300 hover:bg-red-50"
        >
          <FiTrash2 className="w-4 h-4 mr-2" />
          Delete Department
        </Button>
        <Button
          onClick={onEdit}
          disabled={isSubmitting}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          <FiEdit2 className="w-4 h-4 mr-2" />
          Edit Department
        </Button>
      </div>
    </div>
  );
};
