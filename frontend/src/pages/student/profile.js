import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { studentAPI } from '../../services/apiService';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { FiUser, FiEdit, FiSave, FiX } from 'react-icons/fi';

const StudentProfile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [updateMessage, setUpdateMessage] = useState(null);

  const { data: profile, loading, error, refetch } = useApi(studentAPI.getProfile);

  React.useEffect(() => {
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
  }, [profile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      await studentAPI.updateProfile(formData);
      setUpdateMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
      refetch();
      setTimeout(() => setUpdateMessage(null), 5000);
    } catch (error) {
      setUpdateMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update profile' 
      });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
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

  if (!user || user.role !== 'student') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="error">Access denied. Student access required.</Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
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
        </main>
      </div>
    </div>
  );
};

export default StudentProfile;
