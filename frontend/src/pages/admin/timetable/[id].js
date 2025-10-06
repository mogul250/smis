import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  User, 
  BookOpen, 
  MapPin, 
  Edit, 
  Trash2, 
  ArrowLeft,
  Users,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useApi, useAsyncOperation } from '../../../hooks/useApi';
import { adminAPI } from '../../../services/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Alert from '../../../components/common/Alert';
import Layout from '../../../components/common/Layout';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import TimetableModal from '../../../components/timetable/TimetableModal';
import { cn } from '../../../lib/utils';

const TimetableDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch timetable slot details
  const { data: slot, loading, error, refetch } = useApi(() => 
    id ? adminAPI.getTimetableSlot(id) : Promise.resolve(null)
  );

  // Fetch related data for editing
  const { data: courses } = useApi(() => adminAPI.getCourses());
  const { data: teachers } = useApi(() => adminAPI.getUsers({ role: 'teacher' }));
  const { data: classes } = useApi(() => adminAPI.getClasses());

  // Delete operation
  const { execute: deleteSlot, loading: deleting } = useAsyncOperation();

  // Check authorization
  if (!user || !['admin', 'hod'].includes(user.role)) {
    return (
      <Layout>
        <Alert variant="error">
          Access denied. Admin or HOD access required.
        </Alert>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (error || !slot) {
    return (
      <Layout>
        <Alert variant="error">
          {error || 'Timetable slot not found'}
        </Alert>
      </Layout>
    );
  }

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleDelete = async () => {
    try {
      await deleteSlot(() => adminAPI.deleteTimetableSlot(id));
      router.push('/admin/timetable');
    } catch (error) {
      console.error('Failed to delete timetable slot:', error);
    }
  };

  const handleSave = async (formData) => {
    try {
      await adminAPI.updateTimetableSlot(id, formData);
      setShowEditModal(false);
      refetch();
    } catch (error) {
      console.error('Failed to update timetable slot:', error);
    }
  };

  const getDayName = (dayNumber) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNumber] || 'Unknown';
  };

  const formatTime = (time) => {
    if (!time) return '';
    return time.substring(0, 5); // Get HH:MM format
  };

  return (
    <>
      <Head>
        <title>Timetable Slot Details - Admin Dashboard</title>
      </Head>

      <Layout>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Timetable Slot Details
                </h1>
                <p className="text-gray-600 mt-1">
                  View and manage this timetable slot
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleEdit}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="danger"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2"
                loading={deleting}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Primary Information */}
            <div className="lg:col-span-2">
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <div className="p-6">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-primary-green mb-6">
                    <Calendar className="h-5 w-5" />
                    Class Information
                  </h2>
                  <div className="space-y-6">
                    {/* Course */}
                    <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
                      <BookOpen className="h-6 w-6 text-blue-600 mt-1" />
                      <div>
                        <h3 className="font-semibold text-blue-900">Course</h3>
                        <p className="text-blue-800 text-lg">
                          {slot.course_name || slot.course_code}
                        </p>
                        {slot.course_code && slot.course_name && (
                          <p className="text-blue-600 text-sm">
                            Code: {slot.course_code}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Teacher */}
                    {slot.teacher_name && (
                      <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg">
                        <User className="h-6 w-6 text-green-600 mt-1" />
                        <div>
                          <h3 className="font-semibold text-green-900">Teacher</h3>
                          <p className="text-green-800 text-lg">{slot.teacher_name}</p>
                        </div>
                      </div>
                    )}

                    {/* Class */}
                    {slot.class_name && (
                      <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-lg">
                        <Users className="h-6 w-6 text-purple-600 mt-1" />
                        <div>
                          <h3 className="font-semibold text-purple-900">Class</h3>
                          <p className="text-purple-800 text-lg">{slot.class_name}</p>
                        </div>
                      </div>
                    )}

                    {/* Room */}
                    {slot.room && (
                      <div className="flex items-start gap-4 p-4 bg-orange-50 rounded-lg">
                        <MapPin className="h-6 w-6 text-orange-600 mt-1" />
                        <div>
                          <h3 className="font-semibold text-orange-900">Room</h3>
                          <p className="text-orange-800 text-lg">{slot.room}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            {/* Schedule Information */}
            <div>
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <div className="p-6">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-primary-green mb-6">
                    <Clock className="h-5 w-5" />
                    Schedule
                  </h2>
                  <div className="space-y-4">
                  <div className="text-center p-6 bg-gradient-to-br from-primary-green/10 to-green-100 rounded-lg">
                    <div className="text-2xl font-bold text-primary-green mb-2">
                      {getDayName(slot.day_of_week)}
                    </div>
                    <div className="text-lg text-gray-700">
                      {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                    </div>
                  </div>

                  {slot.semester && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-1">Semester</h4>
                      <p className="text-gray-700">{slot.semester}</p>
                    </div>
                  )}

                  {slot.academic_year && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-1">Academic Year</h4>
                      <p className="text-gray-700">{slot.academic_year}</p>
                    </div>
                  )}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </motion.div>

        {/* Edit Modal */}
        {showEditModal && (
          <TimetableModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            onSave={handleSave}
            slot={slot}
            mode="edit"
            courses={courses || []}
            teachers={teachers || []}
            classes={classes || []}
          />
        )}

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Confirm Delete
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this timetable slot? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  loading={deleting}
                >
                  Delete
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </Layout>
    </>
  );
};

export default TimetableDetailPage;
