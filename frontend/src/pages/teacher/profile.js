import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useApi, useAsyncOperation } from '../../hooks/useApi';
import { teacherAPI } from '../../services/api';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import {
  FiUser, FiEdit, FiBook, FiUsers, FiCalendar, FiClipboard,
  FiBarChart, FiSave, FiX, FiEye, FiGraduationCap, FiClock,
  FiTrendingUp, FiAward, FiBookOpen, FiUserCheck
} from 'react-icons/fi';

const TeacherProfile = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({});
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState('current');

  // API hooks
  const { data: profile, loading: profileLoading, error: profileError, refetch: refetchProfile } = useApi(teacherAPI.getProfile);
  const { data: classes, loading: classesLoading, error: classesError } = useApi(teacherAPI.getClasses);
  const { data: timetable, loading: timetableLoading, execute: loadTimetable } = useApi(
    () => teacherAPI.getTimetable(selectedSemester),
    []
  );
  const { data: allStudents, loading: studentsLoading, execute: loadAllStudents } = useApi(
    () => teacherAPI.getAllStudents(),
    []
  );
  
  const { loading: updateLoading, execute: updateProfile } = useAsyncOperation();

  // Load data on component mount and when dependencies change
  useEffect(() => {
    if (profile) {
      setProfileData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: profile.email || '',
        department_id: profile.department_id || ''
      });
    }
  }, [profile]);

  useEffect(() => {
    loadTimetable();
  }, [selectedSemester, loadTimetable]);

  useEffect(() => {
    if (activeTab === 'students') {
      loadAllStudents();
    }
  }, [activeTab, loadAllStudents]);

  // Handle profile update
  const handleUpdateProfile = async () => {
    try {
      await updateProfile(() => teacherAPI.updateProfile(profileData));
      await refetchProfile();
      setEditMode(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

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
    { id: 'overview', label: 'Overview', icon: FiUser },
    { id: 'classes', label: 'My Classes', icon: FiBook },
    { id: 'schedule', label: 'Schedule', icon: FiCalendar },
    { id: 'students', label: 'Students', icon: FiUsers }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Teacher Profile</h1>
                <p className="text-gray-600 mt-1">Manage your profile and view your teaching information</p>
              </div>
              <Button
                variant="primary"
                icon={editMode ? FiX : FiEdit}
                onClick={() => setEditMode(!editMode)}
              >
                {editMode ? 'Cancel' : 'Edit Profile'}
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <div className="flex items-center">
                <FiBook className="w-8 h-8 mr-3" />
                <div>
                  <p className="text-blue-100">Total Classes</p>
                  <p className="text-2xl font-bold">{stats.totalClasses}</p>
                </div>
              </div>
            </Card>
            
            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <div className="flex items-center">
                <FiUsers className="w-8 h-8 mr-3" />
                <div>
                  <p className="text-green-100">Total Students</p>
                  <p className="text-2xl font-bold">{stats.totalStudents}</p>
                </div>
              </div>
            </Card>
            
            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <div className="flex items-center">
                <FiClock className="w-8 h-8 mr-3" />
                <div>
                  <p className="text-purple-100">Today's Classes</p>
                  <p className="text-2xl font-bold">{stats.todaySchedule}</p>
                </div>
              </div>
            </Card>
            
            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <div className="flex items-center">
                <FiBookOpen className="w-8 h-8 mr-3" />
                <div>
                  <p className="text-orange-100">Subjects</p>
                  <p className="text-2xl font-bold">{stats.subjects}</p>
                </div>
              </div>
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
                <Card.Header>
                  <Card.Title>Profile Information</Card.Title>
                </Card.Header>
                <Card.Content>
                  {profileLoading ? (
                    <div className="flex justify-center py-8">
                      <LoadingSpinner size="lg" />
                    </div>
                  ) : profileError ? (
                    <Alert variant="error">{profileError}</Alert>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input
                        label="First Name"
                        value={profileData.first_name}
                        onChange={(e) => setProfileData({...profileData, first_name: e.target.value})}
                        disabled={!editMode}
                        icon={FiUser}
                      />
                      <Input
                        label="Last Name"
                        value={profileData.last_name}
                        onChange={(e) => setProfileData({...profileData, last_name: e.target.value})}
                        disabled={!editMode}
                        icon={FiUser}
                      />
                      <Input
                        label="Email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                        disabled={!editMode}
                        icon={FiUser}
                      />
                      <Input
                        label="Department ID"
                        type="number"
                        value={profileData.department_id}
                        onChange={(e) => setProfileData({...profileData, department_id: parseInt(e.target.value)})}
                        disabled={!editMode}
                        icon={FiGraduationCap}
                      />
                    </div>
                  )}
                </Card.Content>
                {editMode && (
                  <Card.Footer>
                    <div className="flex justify-end space-x-3">
                      <Button
                        variant="outline"
                        onClick={() => setEditMode(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        icon={FiSave}
                        loading={updateLoading}
                        onClick={handleUpdateProfile}
                      >
                        Save Changes
                      </Button>
                    </div>
                  </Card.Footer>
                )}
              </Card>

              {/* Quick Actions */}
              <Card>
                <Card.Header>
                  <Card.Title>Quick Actions</Card.Title>
                </Card.Header>
                <Card.Content>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      variant="outline"
                      icon={FiClipboard}
                      href="/teacher/attendance"
                      className="h-20 flex-col"
                    >
                      <span className="mt-2">Mark Attendance</span>
                    </Button>
                    <Button
                      variant="outline"
                      icon={FiAward}
                      href="/teacher/grades"
                      className="h-20 flex-col"
                    >
                      <span className="mt-2">Enter Grades</span>
                    </Button>
                    <Button
                      variant="outline"
                      icon={FiBarChart}
                      href="/teacher/analytics"
                      className="h-20 flex-col"
                    >
                      <span className="mt-2">View Analytics</span>
                    </Button>
                  </div>
                </Card.Content>
              </Card>
            </div>
          )}

          {activeTab === 'classes' && (
            <Card>
              <Card.Header>
                <Card.Title>My Classes</Card.Title>
              </Card.Header>
              <Card.Content>
                {classesLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : classesError ? (
                  <Alert variant="error">{classesError}</Alert>
                ) : classes && classes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classes.map((classItem) => (
                      <Card key={classItem.id} hover className="border-l-4 border-l-blue-500">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{classItem.name}</h3>
                            <p className="text-gray-600 text-sm">{classItem.department_name}</p>
                            <Badge variant="primary" className="mt-2">
                              Course ID: {classItem.id}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={FiEye}
                            onClick={() => setSelectedClass(classItem)}
                          >
                            View
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FiBook className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No classes assigned yet</p>
                  </div>
                )}
              </Card.Content>
            </Card>
          )}

          {activeTab === 'schedule' && (
            <Card>
              <Card.Header>
                <div className="flex items-center justify-between">
                  <Card.Title>Teaching Schedule</Card.Title>
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
              </Card.Header>
              <Card.Content>
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
                    <FiCalendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No schedule available for selected semester</p>
                  </div>
                )}
              </Card.Content>
            </Card>
          )}

          {activeTab === 'students' && (
            <Card>
              <Card.Header>
                <Card.Title>My Students</Card.Title>
              </Card.Header>
              <Card.Content>
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
                    <FiUsers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No students found</p>
                  </div>
                )}
              </Card.Content>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
};

export default TeacherProfile;
