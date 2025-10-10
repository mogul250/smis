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
  GraduationCap,
  Building,
  Timer,
  CalendarDays,
  School,
  UserCheck,
  Info,
  Settings,
  ChevronRight,
  Badge,
  Star,
  AlertCircle
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
  const { data: teachers } = useApi(() => adminAPI.getAllUsers(1, 100, { role: 'teacher' }));
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

  const formatDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return '';
    const start = new Date(`1970-01-01T${startTime}`);
    const end = new Date(`1970-01-01T${endTime}`);
    const diffMs = end - start;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    }
    return `${diffMinutes}m`;
  };

  const getStatusBadge = (slot) => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentTime = now.toTimeString().substring(0, 5);
    
    if (slot.day_of_week === currentDay) {
      if (currentTime < slot.start_time?.substring(0, 5)) {
        return { text: 'Upcoming', color: 'bg-blue-100 text-blue-800' };
      } else if (currentTime >= slot.start_time?.substring(0, 5) && currentTime <= slot.end_time?.substring(0, 5)) {
        return { text: 'In Progress', color: 'bg-green-100 text-green-800' };
      } else {
        return { text: 'Completed', color: 'bg-gray-100 text-gray-800' };
      }
    }
    return { text: 'Scheduled', color: 'bg-purple-100 text-purple-800' };
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
          <div className="border-b border-gray-200 pb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div className="flex items-start gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.back()}
                  className="flex items-center gap-2 mt-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">
                      {slot.course_name || slot.course_code || 'Timetable Slot'}
                    </h1>
                    {slot && (
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        getStatusBadge(slot).color
                      )}>
                        {getStatusBadge(slot).text}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {getDayName(slot.day_of_week)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Timer className="h-4 w-4" />
                      {formatDuration(slot.start_time, slot.end_time)}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={handleEdit}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit Slot
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2"
                  loading={deleting}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Primary Information */}
            <div className="xl:col-span-2 space-y-6">
              {/* Course & Academic Details */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    Course Information
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Course Details */}
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-500">Course Name</p>
                          <p className="text-lg font-semibold text-gray-900 truncate">
                            {slot.course_name || 'Not specified'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <Badge className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-500">Course Code</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {slot.course_code || 'Not specified'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Academic Info */}
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <CalendarDays className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-500">Semester</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {slot.semester || 'Not specified'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <GraduationCap className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-500">Academic Year</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {slot.academic_year || 'Not specified'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* People & Location */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <Users className="h-5 w-5 text-emerald-600" />
                    People & Location
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Teacher */}
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <UserCheck className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-500">Instructor</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {slot.first_name && slot.last_name 
                            ? `${slot.first_name} ${slot.last_name}`
                            : slot.teacher_name || 'Not assigned'
                          }
                        </p>
                        {slot.first_name && slot.last_name && (
                          <p className="text-sm text-gray-500">Teaching Staff</p>
                        )}
                      </div>
                    </div>

                    {/* Class */}
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <School className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-500">Class</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {slot.class_name || 'Not specified'}
                        </p>
                        {slot.class_id && (
                          <p className="text-sm text-gray-500">Class ID: {slot.class_id}</p>
                        )}
                      </div>
                    </div>

                    {/* Room */}
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-500">Room</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {slot.room || 'Not specified'}
                        </p>
                        <p className="text-sm text-gray-500">Location</p>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Info className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-500">Slot ID</p>
                        <p className="text-lg font-semibold text-gray-900">#{slot.id}</p>
                        <p className="text-sm text-gray-500">System Reference</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              {slot.notes && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                      Additional Notes
                    </h2>
                  </div>
                  <div className="p-6">
                    <p className="text-gray-700 leading-relaxed">{slot.notes}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Schedule Information Sidebar */}
            <div className="space-y-6">
              {/* Schedule Card */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <Clock className="h-5 w-5 text-indigo-600" />
                    Schedule Details
                  </h2>
                </div>
                <div className="p-6 space-y-6">
                  {/* Day & Time Highlight */}
                  <div className="text-center p-6 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-100">
                    <div className="text-2xl font-bold text-indigo-900 mb-2">
                      {getDayName(slot.day_of_week)}
                    </div>
                    <div className="text-lg font-semibold text-indigo-700 mb-1">
                      {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                    </div>
                    <div className="text-sm text-indigo-600">
                      Duration: {formatDuration(slot.start_time, slot.end_time)}
                    </div>
                  </div>

                  {/* Schedule Breakdown */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-500">Start Time</span>
                      <span className="text-sm font-semibold text-gray-900">{formatTime(slot.start_time)}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-500">End Time</span>
                      <span className="text-sm font-semibold text-gray-900">{formatTime(slot.end_time)}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-500">Duration</span>
                      <span className="text-sm font-semibold text-gray-900">{formatDuration(slot.start_time, slot.end_time)}</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm font-medium text-gray-500">Day of Week</span>
                      <span className="text-sm font-semibold text-gray-900">{getDayName(slot.day_of_week)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <Settings className="h-5 w-5 text-gray-600" />
                    Quick Actions
                  </h2>
                </div>
                <div className="p-6 space-y-3">
                  <Button
                    variant="outline"
                    onClick={handleEdit}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Slot Details
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/admin/timetable')}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <Calendar className="h-4 w-4" />
                    View All Slots
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full flex items-center justify-center gap-2"
                    loading={deleting}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Slot
                  </Button>
                </div>
              </div>

              {/* Metadata */}
              <div className="bg-gray-50 rounded-xl border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <Info className="h-5 w-5 text-gray-600" />
                    Metadata
                  </h2>
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Created</span>
                    <span className="text-gray-900 font-medium">
                      {slot.created_at ? new Date(slot.created_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Last Updated</span>
                    <span className="text-gray-900 font-medium">
                      {slot.updated_at ? new Date(slot.updated_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Status</span>
                    <span className={cn(
                      "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                      getStatusBadge(slot).color
                    )}>
                      {getStatusBadge(slot).text}
                    </span>
                  </div>
                </div>
              </div>
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

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-gray-200"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Delete Timetable Slot
                    </h3>
                    <p className="text-sm text-gray-500">
                      This action cannot be undone
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-4">
                <p className="text-gray-600 mb-4">
                  Are you sure you want to delete this timetable slot? This will permanently remove:
                </p>
                <ul className="space-y-2 text-sm text-gray-600 mb-4">
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-3 w-3 text-gray-400" />
                    <span><strong>{slot.course_name || slot.course_code}</strong> class schedule</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-3 w-3 text-gray-400" />
                    <span>{getDayName(slot.day_of_week)} {formatTime(slot.start_time)} - {formatTime(slot.end_time)} time slot</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-3 w-3 text-gray-400" />
                    <span>All associated scheduling data</span>
                  </li>
                </ul>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800 font-medium">
                    ⚠️ This action is permanent and cannot be reversed.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  loading={deleting}
                  className="min-w-[100px]"
                >
                  {deleting ? 'Deleting...' : 'Delete Slot'}
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
