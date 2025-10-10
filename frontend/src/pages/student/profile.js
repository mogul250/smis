import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { User, Building, Hash, GraduationCap, Calendar, Mail,Eye, Phone, MapPin } from 'lucide-react';
import api from '../../services/api/config';

const StudentProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [departmentInfo, setDepartmentInfo] = useState(null);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/students/profile');
        const profileData = response.data;

        console.log('Profile data received:', profileData);

        setProfile(profileData);
        
        // Extract department information
        if (profileData.department) {
          setDepartmentInfo({
            name: profileData.department.name,
            code: profileData.department.code,
            courses: profileData.department.courses || []
          });
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);


  // Show loading while user data is being fetched
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Sidebar />
        <main className="lg:ml-64 pt-16 min-h-screen">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
              <LoadingSpinner />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show error if there's an error loading profile
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Sidebar />
        <main className="lg:ml-64 pt-16 min-h-screen">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Sidebar />
      <main className="lg:ml-64 pt-16 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Student Profile</h1>
                <p className="text-gray-600">View your personal and academic information</p>
              </div>
            </div>


            {loading ? (
              <Card className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </Card>
            ) : error ? (
              <Alert variant="destructive">
                <AlertDescription>Failed to load profile: {error}</AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Picture & Basic Info */}
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User className="w-12 h-12 text-white" />
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {profile?.user?.first_name} {profile?.user?.last_name}
                      </h2>
                      <p className="text-gray-600 flex items-center justify-center gap-1 mt-2">
                        <Hash className="h-4 w-4" />
                        Student ID: {profile?.id}
                      </p>
                      <p className="text-sm text-gray-500 mt-2 flex items-center justify-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Enrolled: {profile?.enrollment_year}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Personal Information */}
                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Personal Information
                      </CardTitle>
                      <CardDescription>Your personal details and contact information</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">First Name</label>
                          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                            <User className="h-4 w-4 text-gray-500 mr-2" />
                            <span className="text-gray-900">{profile?.user?.first_name || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Last Name</label>
                          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                            <User className="h-4 w-4 text-gray-500 mr-2" />
                            <span className="text-gray-900">{profile?.user?.last_name || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Email</label>
                          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                            <Mail className="h-4 w-4 text-gray-500 mr-2" />
                            <span className="text-gray-900">{profile?.user?.email || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Phone</label>
                          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                            <Phone className="h-4 w-4 text-gray-500 mr-2" />
                            <span className="text-gray-900">{profile?.phone || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Date of Birth</label>
                          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                            <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                            <span className="text-gray-900">{profile?.date_of_birth || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Gender</label>
                          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                            <User className="h-4 w-4 text-gray-500 mr-2" />
                            <span className="text-gray-900 capitalize">{profile?.gender || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-sm font-medium text-gray-700">Address</label>
                          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                            <MapPin className="h-4 w-4 text-gray-500 mr-2" />
                            <span className="text-gray-900">{profile?.address || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Department Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building className="h-5 w-5" />
                        Department Information
                      </CardTitle>
                      <CardDescription>Your academic department and courses</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {departmentInfo ? (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">Department Name</label>
                              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                                <Building className="h-4 w-4 text-gray-500 mr-2" />
                                <span className="text-gray-900">{departmentInfo.name}</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">Department Code</label>
                              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                                <Hash className="h-4 w-4 text-gray-500 mr-2" />
                                <span className="text-gray-900">{departmentInfo.code}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Department Courses */}
                          <div>
                            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                              <GraduationCap className="h-4 w-4" />
                              Department Courses ({departmentInfo.courses?.length || 0})
                            </h4>
                            {departmentInfo.courses?.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {departmentInfo.courses.map((course, index) => (
                                  <div key={index} className="bg-gray-50 p-3 rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <GraduationCap className="h-4 w-4 text-gray-500" />
                                      <div>
                                        <p className="font-medium text-sm">{course.course_code}</p>
                                        <p className="text-xs text-gray-600">{course.name}</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500 text-sm">No courses available</p>
                            )}
                          </div>
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
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentProfile;
