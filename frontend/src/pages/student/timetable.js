import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { studentAPI } from '../../services/api';

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
          faCalendarAlt: solidIcons.faCalendarAlt,
          faBook: solidIcons.faBook,
          faClock: solidIcons.faClock,
          faUsers: solidIcons.faUsers,
          faDownload: solidIcons.faDownload,
          faSync: solidIcons.faSync,
          faFilter: solidIcons.faFilter,
          faSearch: solidIcons.faSearch,
          faMapMarkerAlt: solidIcons.faMapMarkerAlt
        });
      });
    }).catch(() => {
      // Fallback to emoji if Font Awesome fails to load
      setIcons({
        FontAwesomeIcon: ({ icon, className }) => {
          const iconMap = {
            'calendar-alt': '📅',
            'book': '📚',
            'clock': '🕐',
            'users': '👥',
            'download': '📥',
            'sync': '🔄',
            'filter': '🔍',
            'search': '🔍',
            'map-marker-alt': '📍'
          };
          return <span className={className}>{iconMap[icon?.iconName] || '📋'}</span>;
        },
        faCalendarAlt: { iconName: 'calendar-alt' },
        faBook: { iconName: 'book' },
        faClock: { iconName: 'clock' },
        faUsers: { iconName: 'users' },
        faDownload: { iconName: 'download' },
        faSync: { iconName: 'sync' },
        faFilter: { iconName: 'filter' },
        faSearch: { iconName: 'search' },
        faMapMarkerAlt: { iconName: 'map-marker-alt' }
      });
    });
  }, []);

  return icons;
};

// SSR-Safe inline components
const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg shadow border border-gray-200 p-6 ${className}`}>
    {children}
  </div>
);

const Button = ({ children, variant = 'primary', size = 'md', onClick, disabled = false, loading = false, className = '' }) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors';
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    outline: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500'
  };
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm'
  };
  
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading && <span className="animate-spin mr-2">⏳</span>}
      {children}
    </button>
  );
};

const Badge = ({ children, variant = 'default', size = 'md' }) => {
  const variantClasses = {
    primary: 'bg-blue-100 text-blue-800',
    default: 'bg-gray-100 text-gray-800'
  };
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-2 py-1 text-sm'
  };
  
  return (
    <span className={`rounded font-medium ${variantClasses[variant]} ${sizeClasses[size]}`}>
      {children}
    </span>
  );
};

const Alert = ({ children, variant = 'info' }) => {
  const variantClasses = {
    error: 'bg-red-100 text-red-800 border border-red-200',
    info: 'bg-blue-100 text-blue-800 border border-blue-200'
  };
  
  return (
    <div className={`p-4 rounded ${variantClasses[variant]}`}>
      {children}
    </div>
  );
};

const LoadingSpinner = ({ size = 'md' }) => {
  const sizeClasses = {
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };
  
  return (
    <div className="flex justify-center">
      <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]}`}></div>
    </div>
  );
};

const StudentTimetable = () => {
  const { user } = useAuth();
  const icons = useFontAwesome();
  const [filters, setFilters] = useState({ semester: 'current' });
  const [refreshing, setRefreshing] = useState(false);

  const { data: timetable, loading, error, refetch } = useApi(() =>
    studentAPI.getTimetable(filters.semester === 'current' ? undefined : filters.semester)
  );

  if (!user || user.role !== 'student') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="error">Access denied. Student access required.</Alert>
      </div>
    );
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({ semester: 'current' });
  };

  const handleExport = () => {
    // Create a simple text export of the timetable
    if (!timetable || timetable.length === 0) {
      alert('No timetable data to export');
      return;
    }

    const exportData = timetable.map(slot => ({
      Day: getDayName(slot.day_of_week),
      Time: `${slot.start_time?.substring(0, 5)} - ${slot.end_time?.substring(0, 5)}`,
      Course: `${slot.course_code} - ${slot.course_name}`,
      Teacher: slot.teacher_name,
      Room: slot.room || 'TBA',
      Semester: slot.semester || 'N/A'
    }));

    const csvContent = [
      Object.keys(exportData[0]).join(','),
      ...exportData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-timetable-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Helper function to get day name from number
  function getDayName(dayNumber) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNumber] || 'Unknown';
  }

  // Calculate statistics
  const stats = {
    totalClasses: timetable?.length || 0,
    uniqueCourses: new Set(timetable?.map(s => s.course_id)).size || 0,
    hoursPerWeek: timetable?.reduce((total, slot) => {
      const start = new Date(`1970-01-01T${slot.start_time}`);
      const end = new Date(`1970-01-01T${slot.end_time}`);
      return total + (end - start) / (1000 * 60 * 60);
    }, 0) || 0,
    busyDays: new Set(timetable?.map(s => s.day_of_week)).size || 0
  };

  // Filter timetable data
  const filteredTimetable = timetable?.filter(slot => {
    if (filters.day && slot.day_of_week.toString() !== filters.day) return false;
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return (
        slot.course_name?.toLowerCase().includes(searchTerm) ||
        slot.course_code?.toLowerCase().includes(searchTerm) ||
        slot.teacher_name?.toLowerCase().includes(searchTerm) ||
        slot.room?.toLowerCase().includes(searchTerm)
      );
    }
    return true;
  }) || [];

  return (
    <>
      <Head>
        <title>My Timetable - Student Dashboard</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">My Timetable</h1>
                  <p className="text-gray-600 mt-1">
                    View your class schedule and course information
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    loading={refreshing}
                  >
                    {icons ? <icons.FontAwesomeIcon icon={icons.faSync} className="mr-2" /> : '🔄 '}
                    Refresh
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    disabled={!timetable || timetable.length === 0}
                  >
                    {icons ? <icons.FontAwesomeIcon icon={icons.faDownload} className="mr-2" /> : '📥 '}
                    Export
                  </Button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <Alert variant="error">
                  Error loading timetable: {error}
                </Alert>
              )}

              {/* Filters */}
              <Card>
                <div className="flex flex-wrap items-end gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Semester
                    </label>
                    <select
                      value={filters.semester}
                      onChange={(e) => setFilters({ ...filters, semester: e.target.value })}
                      className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="current">Current Semester</option>
                      <option value="1">Semester 1</option>
                      <option value="2">Semester 2</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Day
                    </label>
                    <select
                      value={filters.day || ''}
                      onChange={(e) => setFilters({ ...filters, day: e.target.value })}
                      className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Days</option>
                      <option value="1">Monday</option>
                      <option value="2">Tuesday</option>
                      <option value="3">Wednesday</option>
                      <option value="4">Thursday</option>
                      <option value="5">Friday</option>
                      <option value="6">Saturday</option>
                      <option value="0">Sunday</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Search
                    </label>
                    <input
                      type="text"
                      placeholder="Search courses, teachers..."
                      value={filters.search || ''}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetFilters}
                  >
                    Reset
                  </Button>
                </div>
              </Card>

              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="p-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                      {icons ? <icons.FontAwesomeIcon icon={icons.faCalendarAlt} className="text-white text-xl" /> : <span className="text-white text-xl">📅</span>}
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{stats.totalClasses}</div>
                      <div className="text-sm text-gray-600">Total Classes</div>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mr-4">
                      {icons ? <icons.FontAwesomeIcon icon={icons.faBook} className="text-white text-xl" /> : <span className="text-white text-xl">📚</span>}
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{stats.uniqueCourses}</div>
                      <div className="text-sm text-gray-600">Enrolled Courses</div>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mr-4">
                      {icons ? <icons.FontAwesomeIcon icon={icons.faClock} className="text-white text-xl" /> : <span className="text-white text-xl">🕐</span>}
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">{stats.hoursPerWeek.toFixed(1)}</div>
                      <div className="text-sm text-gray-600">Hours per Week</div>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center mr-4">
                      {icons ? <icons.FontAwesomeIcon icon={icons.faUsers} className="text-white text-xl" /> : <span className="text-white text-xl">👥</span>}
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600">{stats.busyDays}</div>
                      <div className="text-sm text-gray-600">Class Days</div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Quick Info */}
              {timetable && timetable.length > 0 && (
                <Card className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Today's Classes */}
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-sm font-medium text-blue-800">Today's Classes</div>
                      <div className="text-blue-600">
                        {timetable.filter(slot => slot.day_of_week === new Date().getDay()).length} classes
                      </div>
                    </div>

                    {/* Next Class */}
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-sm font-medium text-green-800">Next Class</div>
                      <div className="text-green-600">
                        Check your schedule below
                      </div>
                    </div>

                    {/* Favorite Teacher */}
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="text-sm font-medium text-purple-800">Most Classes With</div>
                      <div className="text-purple-600">
                        {Object.entries(timetable.reduce((acc, slot) => {
                          acc[slot.teacher_name] = (acc[slot.teacher_name] || 0) + 1;
                          return acc;
                        }, {})).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Timetable Display */}
              {loading ? (
                <Card className="p-12">
                  <div className="flex justify-center">
                    <LoadingSpinner size="lg" />
                  </div>
                </Card>
              ) : timetable && timetable.length > 0 ? (
                <Card>
                  <div className="border-b border-gray-200 pb-4 mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">My Class Schedule</h3>
                  </div>
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredTimetable.map((slot, index) => (
                          <tr key={index} className="transition-colors hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="font-medium text-gray-900">
                                {getDayName(slot.day_of_week)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="font-medium text-gray-900">
                                {slot.start_time?.substring(0, 5)} - {slot.end_time?.substring(0, 5)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="font-medium text-gray-900">
                                {slot.course_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {slot.course_code}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className="text-gray-900">
                                {slot.teacher_name || 'TBA'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className="text-gray-900">
                                {slot.room || 'TBA'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              ) : (
                <Card className="p-12 text-center">
                  <div className="text-gray-500">
                    {icons ? <icons.FontAwesomeIcon icon={icons.faCalendarAlt} className="text-4xl mb-4 block text-gray-400 mx-auto" /> : <div className="text-4xl mb-4">📅</div>}
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Scheduled</h3>
                    <p className="text-gray-600">
                      You don't have any classes scheduled for the selected semester.
                      Contact your academic advisor if this seems incorrect.
                    </p>
                  </div>
                </Card>
              )}

              {/* Course List */}
              {timetable && timetable.length > 0 && (
                <Card>
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Enrolled Courses</h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Array.from(new Set(timetable.map(s => s.course_id))).map(courseId => {
                        const course = timetable.find(s => s.course_id === courseId);
                        const courseSlots = timetable.filter(s => s.course_id === courseId);

                        return (
                          <div key={courseId} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-medium text-gray-900">{course.course_name}</h4>
                                <p className="text-sm text-gray-600">{course.course_code}</p>
                                <p className="text-sm text-gray-500">Prof. {course.teacher_name}</p>
                              </div>
                              <Badge variant="primary" size="sm">
                                {courseSlots.length} {courseSlots.length === 1 ? 'class' : 'classes'}
                              </Badge>
                            </div>
                            <div className="space-y-1 text-sm text-gray-600">
                              {courseSlots.map((slot, index) => (
                                <div key={index}>
                                  {getDayName(slot.day_of_week)} {slot.start_time?.substring(0, 5)} - {slot.end_time?.substring(0, 5)}
                                  {slot.room && ` • ${slot.room}`}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default StudentTimetable;
