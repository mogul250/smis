import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { FiUser, FiEdit, FiSave, FiX } from 'react-icons/fi';
import api from '../../services/api/config';

const StudentProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updateMessage, setUpdateMessage] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    date_of_birth: '',
    gender: ''
  });

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
        setFormData({
          first_name: profileData.user?.first_name || '',
          last_name: profileData.user?.last_name || '',
          email: profileData.user?.email || '',
          phone: profileData.phone || '',
          address: profileData.address || '',
          date_of_birth: profileData.date_of_birth || '',
          gender: profileData.gender || ''
        });
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      await api.put('/students/profile', formData);
      setUpdateMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);

      // Refresh profile data
      const updatedResponse = await api.get('/students/profile');
      const updatedProfile = updatedResponse.data;
      setProfile(updatedProfile);
      setFormData({
        first_name: updatedProfile.user?.first_name || '',
        last_name: updatedProfile.user?.last_name || '',
        email: updatedProfile.user?.email || '',
        phone: updatedProfile.phone || '',
        address: updatedProfile.address || '',
        date_of_birth: updatedProfile.date_of_birth || '',
        gender: updatedProfile.gender || ''
      });

      setTimeout(() => setUpdateMessage(null), 5000);
    } catch (error) {
      setUpdateMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to update profile'
      });
      setTimeout(() => setUpdateMessage(null), 5000);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setUpdateMessage(null);
    if (profile) {
      setFormData({
        first_name: profile.user?.first_name || '',
        last_name: profile.user?.last_name || '',
        email: profile.user?.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        date_of_birth: profile.date_of_birth || '',
        gender: profile.gender || ''
      });
    }
  };

  // Show loading while user data is being fetched
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Sidebar />
        <main className="lg:pl-64 pt-16 min-h-screen">
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
        <main className="lg:pl-64 pt-16 min-h-screen">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
              <Alert variant="error">{error}</Alert>
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
      <main className="lg:pl-64 pt-16 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Student Profile</h1>
                <p className="text-gray-600">Manage your personal information</p>
              </div>
              {!isEditing ? (
                <Button
                  variant="primary"
                  icon={FiEdit}
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button
                    variant="success"
                    icon={FiSave}
                    onClick={handleSave}
                  >
                    Save Changes
                  </Button>
                  <Button
                    variant="secondary"
                    icon={FiX}
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            {updateMessage && (
              <Alert
                variant={updateMessage.type}
                dismissible
                onDismiss={() => setUpdateMessage(null)}
              >
                {updateMessage.text}
              </Alert>
            )}

            {loading ? (
              <Card className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </Card>
            ) : error ? (
              <Alert variant="error">
                Failed to load profile: {error}
              </Alert>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Picture & Basic Info */}
                <Card>
                  <div className="text-center">
                    <div className="w-24 h-24 bg-primary-blue rounded-full flex items-center justify-center mx-auto mb-4">
                      <FiUser className="w-12 h-12 text-white" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {profile?.user?.first_name} {profile?.user?.last_name}
                    </h2>
                    <p className="text-gray-600">Student ID: {profile?.id}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Enrolled: {profile?.enrollment_year}
                    </p>
                  </div>
                </Card>

                {/* Personal Information */}
                <div className="lg:col-span-2">
                  <Card>
                    <Card.Header>
                      <Card.Title>Personal Information</Card.Title>
                    </Card.Header>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="First Name"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        required
                      />
                      <Input
                        label="Last Name"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        required
                      />
                      <Input
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        required
                      />
                      <Input
                        label="Phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                      <Input
                        label="Date of Birth"
                        name="date_of_birth"
                        type="date"
                        value={formData.date_of_birth}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Gender
                        </label>
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="form-select"
                        >
                          <option value="">Select Gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <Input
                          label="Address"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
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
