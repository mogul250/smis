import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { teacherAPI } from '../../services/api';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Alert, AlertDescription } from '../../components/ui/alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';
import Table from '../../components/common/Table';
import {
  User, Book, Users, Calendar, Clipboard,
  BarChart, Eye, Award, Clock,
  TrendingUp, BookOpen, UserCheck, Building,
  Hash, GraduationCap
} from 'lucide-react';

const TeacherProfile = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState('current');
  const [departmentInfo, setDepartmentInfo] = useState(null);

  // API hooks
  const { data: profile, loading: profileLoading, error: profileError } = useApi(teacherAPI.getProfile);
  const { data: classes, loading: classesLoading, error: classesError } = useApi(teacherAPI.getClasses);
  const { data: timetable, loading: timetableLoading, execute: loadTimetable } = useApi(
    () => teacherAPI.getTimetable(selectedSemester),
    []
  );
  const { data: allStudents, loading: studentsLoading, execute: loadAllStudents } = useApi(
    () => teacherAPI.getAllStudents(),
    []
  );

  // Load department information when profile is loaded
  useEffect(() => {
    const fetchDepartmentInfo = async () => {
      if (profile?.departments) {
        // Extract department information from profile
        const deptInfo = {
          departments: profile.departments || [],
          totalDepartments: profile.departments?.length || 0,
          primaryDepartment: profile.departments?.find(d => d.is_primary) || profile.departments?.[0],
          departmentCourses: []
        };
        
        // Get courses for each department
        try {
          // This would need to be implemented in the backend
          // For now, we'll use the classes data as department courses
          deptInfo.departmentCourses = classes || [];
        } catch (error) {
          console.error('Error fetching department courses:', error);
        }
        
        setDepartmentInfo(deptInfo);
      }
    };
    
    fetchDepartmentInfo();
  }, [profile, classes]);

  useEffect(() => {
    loadTimetable();
  }, [selectedSemester, loadTimetable]);

  useEffect(() => {
    if (activeTab === 'students') {
      loadAllStudents();
    }
  }, [activeTab, loadAllStudents]);


  // Calculate statistics
  const getStatistics = () => {
    const totalClasses = classes?.length || 0;
    const totalStudents = allStudents?.length || 0;
    const todaySchedule = timetable?.filter(slot => {
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      return slot.day_of_week?.toLowerCase() === today.toLowerCase();
    })?.length || 0;
    
    const subjects = [...new Set(classes?.map(c => c.name) || [])].length;

    return {
      totalClasses,
      totalStudents,
      todaySchedule,
      subjects
    };
  };

  const stats = getStatistics();

  if (!user || user.role !== 'teacher') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="error">Access denied. Teacher access required.</Alert>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'departments', label: 'Departments', icon: Building },
    { id: 'classes', label: 'My Classes', icon: Book },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'students', label: 'Students', icon: Users }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 lg:ml-64 pt-16">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Teacher Profile</h1>
                <p className="text-gray-600 mt-1">View your profile and teaching information</p>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Book className="w-8 h-8 mr-3" />
                  <div>
                    <p className="text-blue-100">Total Classes</p>
                    <p className="text-2xl font-bold">{stats.totalClasses}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Users className="w-8 h-8 mr-3" />
                  <div>
                    <p className="text-green-100">Total Students</p>
                    <p className="text-2xl font-bold">{stats.totalStudents}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Clock className="w-8 h-8 mr-3" />
                  <div>
                    <p className="text-purple-100">Today's Classes</p>
                    <p className="text-2xl font-bold">{stats.todaySchedule}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <BookOpen className="w-8 h-8 mr-3" />
                  <div>
                    <p className="text-orange-100">Subjects</p>
                    <p className="text-2xl font-bold">{stats.subjects}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Building className="w-8 h-8 mr-3" />
                  <div>
                    <p className="text-indigo-100">Departments</p>
                    <p className="text-2xl font-bold">{departmentInfo?.totalDepartments || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Profile Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>Your personal and professional details</CardDescription>
                </CardHeader>
                <CardContent>
                  {profileLoading ? (
                    <div className="flex justify-center py-8">
                      <LoadingSpinner size="lg" />
                    </div>
                  ) : profileError ? (
                    <Alert variant="destructive">
                      <AlertDescription>{profileError}</AlertDescription>
                    </Alert>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">First Name</label>
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <User className="h-4 w-4 text-gray-500 mr-2" />
                          <span className="text-gray-900">{profile?.first_name || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Last Name</label>
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <User className="h-4 w-4 text-gray-500 mr-2" />
                          <span className="text-gray-900">{profile?.last_name || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Email</label>
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <User className="h-4 w-4 text-gray-500 mr-2" />
                          <span className="text-gray-900">{profile?.email || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Employee ID</label>
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <Hash className="h-4 w-4 text-gray-500 mr-2" />
                          <span className="text-gray-900">{profile?.id || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Primary Department</label>
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <Building className="h-4 w-4 text-gray-500 mr-2" />
                          <span className="text-gray-900">{departmentInfo?.primaryDepartment?.name || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Department Code</label>
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <Hash className="h-4 w-4 text-gray-500 mr-2" />
                          <span className="text-gray-900">{departmentInfo?.primaryDepartment?.code || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clipboard className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>Common teaching tasks and tools</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      variant="outline"
                      className="h-20 flex-col gap-2"
                      asChild
                    >
                      <a href="/teacher/attendance">
                        <Clipboard className="h-6 w-6" />
                        <span>Mark Attendance</span>
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-20 flex-col gap-2"
                      asChild
                    >
                      <a href="/teacher/grades">
                        <Award className="h-6 w-6" />
                        <span>Enter Grades</span>
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-20 flex-col gap-2"
                      asChild
                    >
                      <a href="/teacher/analytics">
                        <BarChart className="h-6 w-6" />
                        <span>View Analytics</span>
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'departments' && (
            <div className="space-y-6">
              {/* Department Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Department Information
                  </CardTitle>
                  <CardDescription>
                    Departments you belong to and their associated courses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {profileLoading ? (
                    <div className="flex justify-center py-8">
                      <LoadingSpinner size="lg" />
                    </div>
                  ) : departmentInfo?.departments?.length > 0 ? (
                    <div className="space-y-6">
                      {departmentInfo.departments.map((dept, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Building className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg">{dept.name}</h3>
                                <p className="text-sm text-gray-600">Code: {dept.code}</p>
                              </div>
                            </div>
                            {dept.is_primary && (
                              <Badge variant="default">Primary</Badge>
                            )}
                          </div>
                          
                          {/* Department Courses */}
                          <div className="mt-4">
                            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                              <BookOpen className="h-4 w-4" />
                              Department Courses ({departmentInfo.departmentCourses?.length || 0})
                            </h4>
                            {departmentInfo.departmentCourses?.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {departmentInfo.departmentCourses.slice(0, 6).map((course, courseIndex) => (
                                  <div key={courseIndex} className="bg-gray-50 p-3 rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <Book className="h-4 w-4 text-gray-500" />
                                      <div>
                                        <p className="font-medium text-sm">{course.course_code}</p>
                                        <p className="text-xs text-gray-600">{course.name}</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                {departmentInfo.departmentCourses.length > 6 && (
                                  <div className="bg-gray-50 p-3 rounded-lg flex items-center justify-center">
                                    <p className="text-sm text-gray-600">
                                      +{departmentInfo.departmentCourses.length - 6} more courses
                                    </p>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-gray-500 text-sm">No courses assigned to this department</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No department information available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'classes' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Book className="h-5 w-5" />
                  My Classes
                </CardTitle>
                <CardDescription>Classes you are currently teaching</CardDescription>
              </CardHeader>
              <CardContent>
                {classesLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : classesError ? (
                  <Alert variant="destructive">
                    <AlertDescription>{classesError}</AlertDescription>
                  </Alert>
                ) : classes && classes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classes.map((classItem) => (
                      <Card key={classItem.id} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <h3 className="font-semibold text-lg">{classItem.name}</h3>
                              <p className="text-gray-600 text-sm">{classItem.department_name}</p>
                              <Badge variant="secondary" className="mt-2">
                                Course ID: {classItem.id}
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedClass(classItem)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Book className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No classes assigned yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'schedule' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Teaching Schedule
                    </CardTitle>
                    <CardDescription>Your weekly teaching timetable</CardDescription>
                  </div>
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                  >
                    <option value="current">Current Semester</option>
                    <option value="fall">Fall Semester</option>
                    <option value="spring">Spring Semester</option>
                    <option value="summer">Summer Semester</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                {timetableLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : timetable && timetable.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table
                      columns={[
                        { key: 'day_of_week', label: 'Day' },
                        { key: 'start_time', label: 'Start Time' },
                        { key: 'end_time', label: 'End Time' },
                        { key: 'course_name', label: 'Course' },
                        { key: 'class_name', label: 'Class' },
                        { key: 'room', label: 'Room' }
                      ]}
                      data={timetable.map(slot => ({
                        ...slot,
                        day_of_week: slot.day_of_week || 'N/A',
                        start_time: slot.start_time || 'N/A',
                        end_time: slot.end_time || 'N/A',
                        course_name: slot.course_name || 'N/A',
                        class_name: slot.class_name || 'N/A',
                        room: slot.room || 'N/A'
                      }))}
                    />
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No schedule available for selected semester</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'students' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  My Students
                </CardTitle>
                <CardDescription>Students enrolled in your classes</CardDescription>
              </CardHeader>
              <CardContent>
                {studentsLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : allStudents && allStudents.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table
                      columns={[
                        { key: 'first_name', label: 'First Name' },
                        { key: 'last_name', label: 'Last Name' },
                        { key: 'email', label: 'Email' },
                        { key: 'course_name', label: 'Course' },
                        { key: 'student_id', label: 'Student ID' }
                      ]}
                      data={allStudents.map(student => ({
                        first_name: student.first_name || 'N/A',
                        last_name: student.last_name || 'N/A',
                        email: student.email || 'N/A',
                        course_name: student.course_name || 'N/A',
                        student_id: student.student_id || student.id || 'N/A'
                      }))}
                    />
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No students found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
};

export default TeacherProfile;
