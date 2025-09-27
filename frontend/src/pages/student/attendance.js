import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { studentAPI } from '../../services/apiService';

// Use real Header and Sidebar components with SSR-safe dynamic imports
const Header = dynamic(() => import('../../components/common/Header'), {
  ssr: false,
  loading: () => (
    <header className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <h1 className="text-xl font-bold">SMIS - Loading...</h1>
      </div>
    </header>
  )
});

const Sidebar = dynamic(() => import('../../components/common/Sidebar'), {
  ssr: false,
  loading: () => (
    <aside className="w-64 bg-gray-800 text-white min-h-screen">
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Loading...</h2>
      </div>
    </aside>
  )
});

// Client-side Font Awesome icon loading to avoid SSR issues
const useFontAwesome = () => {
  const [icons, setIcons] = useState(null);

  useEffect(() => {
    // Load Font Awesome icons only on client side
    import('@fortawesome/react-fontawesome').then((faModule) => {
      import('@fortawesome/free-solid-svg-icons').then((solidIcons) => {
        setIcons({
          FontAwesomeIcon: faModule.FontAwesomeIcon,
          faChartBar: solidIcons.faChartBar,
          faCalendarAlt: solidIcons.faCalendarAlt,
          faCheck: solidIcons.faCheck,
          faClock: solidIcons.faClock,
          faTimes: solidIcons.faTimes,
          faCalendar: solidIcons.faCalendar
        });
      });
    }).catch(() => {
      // Fallback to emoji if Font Awesome fails to load
      setIcons({
        FontAwesomeIcon: ({ icon, className }) => {
          const iconMap = {
            'chart-bar': '📊',
            'calendar-alt': '📅',
            'check': '✅',
            'clock': '🕐',
            'times': '❌',
            'calendar': '📅'
          };
          return <span className={className}>{iconMap[icon?.iconName] || '📋'}</span>;
        },
        faChartBar: { iconName: 'chart-bar' },
        faCalendarAlt: { iconName: 'calendar-alt' },
        faCheck: { iconName: 'check' },
        faClock: { iconName: 'clock' },
        faTimes: { iconName: 'times' },
        faCalendar: { iconName: 'calendar' }
      });
    });
  }, []);

  return icons;
};

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg shadow border border-gray-200 p-6 ${className}`}>
    {children}
  </div>
);

const Alert = ({ children, variant = 'info' }) => {
  const variantClasses = {
    error: 'bg-red-100 text-red-800 border border-red-200',
    info: 'bg-blue-100 text-blue-800 border border-blue-200',
    success: 'bg-green-100 text-green-800 border border-green-200'
  };
  
  return (
    <div className={`p-4 rounded ${variantClasses[variant]}`}>
      {children}
    </div>
  );
};

const LoadingSpinner = () => (
  <div className="flex justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

const Badge = ({ children, variant = 'default' }) => {
  const variantClasses = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    default: 'bg-gray-100 text-gray-800'
  };
  
  return (
    <span className={`px-2 py-1 rounded text-sm font-medium ${variantClasses[variant]}`}>
      {children}
    </span>
  );
};

const StudentAttendance = () => {
  const { user } = useAuth();
  const icons = useFontAwesome();
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const { data: attendance, loading, error, refetch } = useApi(
    () => {
      console.log('Fetching attendance with dateRange:', dateRange);
      return studentAPI.getAttendance(dateRange);
    },
    [dateRange]
  );

  // Calculate attendance statistics - moved before conditional returns
  const attendanceStats = React.useMemo(() => {
    if (!attendance || attendance.length === 0) {
      return { total: 0, present: 0, absent: 0, late: 0, percentage: 0 };
    }

    const total = attendance.length;
    const present = attendance.filter(a => a.status === 'present').length;
    const absent = attendance.filter(a => a.status === 'absent').length;
    const late = attendance.filter(a => a.status === 'late').length;
    const percentage = total > 0 ? ((present + late) / total * 100).toFixed(1) : 0;

    return { total, present, absent, late, percentage };
  }, [attendance]);

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Debug logging
  console.log('User:', user);
  console.log('Attendance data:', attendance);
  console.log('Loading:', loading);
  console.log('Error:', error);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="error">Please log in to access attendance records.</Alert>
      </div>
    );
  }

  if (user.role !== 'student') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="error">Access denied. Student access required.</Alert>
      </div>
    );
  }

  function getStatusBadgeVariant(status) {
    switch (status) {
      case 'present': return 'success';
      case 'late': return 'warning';
      case 'absent': return 'danger';
      default: return 'default';
    }
  }

  function getStatusIcon(status) {
    if (!icons) return () => <span>⏳</span>; // Loading state
    
    const { FontAwesomeIcon, faCheck, faClock, faTimes, faCalendar } = icons;
    
    switch (status) {
      case 'present': return () => <FontAwesomeIcon icon={faCheck} className="text-green-600" />;
      case 'late': return () => <FontAwesomeIcon icon={faClock} className="text-yellow-600" />;
      case 'absent': return () => <FontAwesomeIcon icon={faTimes} className="text-red-600" />;
      default: return () => <FontAwesomeIcon icon={faCalendar} className="text-gray-600" />;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Page Header */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Attendance Record</h1>
              <p className="text-gray-600">Track your class attendance and participation</p>
            </div>

            {/* Date Range Filter */}
            <Card>
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => handleDateChange('startDate', e.target.value)}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => handleDateChange('endDate', e.target.value)}
                    className="form-input"
                  />
                </div>
                <button
                  onClick={refetch}
                  className="btn btn-primary"
                >
                  Update
                </button>
              </div>
            </Card>

            {loading ? (
              <Card className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </Card>
            ) : error ? (
              <Alert variant="error">
                <div>
                  <p><strong>Failed to load attendance:</strong> {error}</p>
                  <p className="text-sm mt-2">
                    Debug info: User role: {user?.role}, User ID: {user?.id}
                  </p>
                  <button 
                    onClick={refetch}
                    className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    Retry
                  </button>
                </div>
              </Alert>
            ) : (
              <>
                {/* Attendance Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  <Card>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-primary-blue rounded-lg flex items-center justify-center mr-4">
                        {icons ? <icons.FontAwesomeIcon icon={icons.faChartBar} className="text-white text-xl" /> : <span className="text-white text-xl">📊</span>}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                        <p className="text-2xl font-bold text-gray-900">{attendanceStats.percentage}%</p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gray-500 rounded-lg flex items-center justify-center mr-4">
                        {icons ? <icons.FontAwesomeIcon icon={icons.faCalendarAlt} className="text-white text-xl" /> : <span className="text-white text-xl">📅</span>}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Classes</p>
                        <p className="text-2xl font-bold text-gray-900">{attendanceStats.total}</p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-accent-green rounded-lg flex items-center justify-center mr-4">
                        {icons ? <icons.FontAwesomeIcon icon={icons.faCheck} className="text-white text-xl" /> : <span className="text-white text-xl">✅</span>}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Present</p>
                        <p className="text-2xl font-bold text-gray-900">{attendanceStats.present}</p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-accent-orange rounded-lg flex items-center justify-center mr-4">
                        {icons ? <icons.FontAwesomeIcon icon={icons.faClock} className="text-white text-xl" /> : <span className="text-white text-xl">🕐</span>}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Late</p>
                        <p className="text-2xl font-bold text-gray-900">{attendanceStats.late}</p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-accent-red rounded-lg flex items-center justify-center mr-4">
                        {icons ? <icons.FontAwesomeIcon icon={icons.faTimes} className="text-white text-xl" /> : <span className="text-white text-xl">❌</span>}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Absent</p>
                        <p className="text-2xl font-bold text-gray-900">{attendanceStats.absent}</p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Attendance Records Table */}
                <Card>
                  <div className="border-b border-gray-200 pb-4 mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Attendance Records</h3>
                  </div>
                  {attendance && attendance.length > 0 ? (
                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {attendance.map((record, index) => {
                            const StatusIcon = getStatusIcon(record.status);
                            return (
                              <tr key={index} className="transition-colors hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <div className="font-medium text-gray-900">
                                    {new Date(record.date).toLocaleDateString()}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <div className="font-medium text-gray-900">
                                    {record.course_name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {record.course_code}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <span className="text-gray-900">
                                    {record.teacher_name || 'N/A'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <div className="flex items-center space-x-2">
                                    <StatusIcon />
                                    <Badge variant={getStatusBadgeVariant(record.status)}>
                                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                                    </Badge>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <span className="text-sm text-gray-600">
                                    {record.marked_at ? new Date(record.marked_at).toLocaleTimeString() : '-'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <span className="text-sm text-gray-600">
                                    {record.notes || '-'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      {icons ? <icons.FontAwesomeIcon icon={icons.faCalendar} className="text-4xl mb-4 block text-gray-400" /> : <span className="text-4xl mb-4 block">📅</span>}
                      <p className="text-gray-500">No attendance records found for the selected date range.</p>
                    </div>
                  )}
                </Card>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentAttendance;
