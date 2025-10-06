import React, { useState } from 'react';
import Head from 'next/head';
import { useAuth } from '../../hooks/useAuth';
import { useApi, useAsyncOperation } from '../../hooks/useApi';
import { hodAPI } from '../../services/api';
import Layout from '../../components/common/Layout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import { 
  FiMail, 
  FiSend, 
  FiUsers, 
  FiClock,
  FiCheck,
  FiRefreshCw,
  FiPlus,
  FiX,
  FiEdit,
  FiTrash2
} from 'react-icons/fi';

const NotificationsPage = () => {
  const { user } = useAuth();
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Form state for composing notifications
  const [notificationForm, setNotificationForm] = useState({
    subject: '',
    message: '',
    priority: 'normal',
    recipients: 'all' // 'all' or 'selected'
  });

  // Fetch teachers for recipient selection
  const { data: teachers, loading: teachersLoading, error: teachersError, refetch: refetchTeachers } = useApi(hodAPI.getDepartmentTeachers);

  // Send notification operation
  const { execute: sendNotification, loading: sending } = useAsyncOperation(
    (data) => hodAPI.sendToDepartmentTeachers ? hodAPI.sendToDepartmentTeachers(data) : Promise.resolve()
  );

  // Mock notification history (in real app, this would come from an API)
  const [notificationHistory] = useState([
    {
      id: 1,
      subject: 'Department Meeting Reminder',
      message: 'Please attend the monthly department meeting scheduled for tomorrow at 2 PM.',
      priority: 'high',
      recipients: 12,
      sent_at: '2024-01-15T10:30:00Z',
      status: 'sent'
    },
    {
      id: 2,
      subject: 'Grade Submission Deadline',
      message: 'Reminder: Grade submissions are due by end of this week.',
      priority: 'normal',
      recipients: 12,
      sent_at: '2024-01-14T09:15:00Z',
      status: 'sent'
    },
    {
      id: 3,
      subject: 'New Course Guidelines',
      message: 'Please review the updated course guidelines attached to this notification.',
      priority: 'normal',
      recipients: 8,
      sent_at: '2024-01-13T14:45:00Z',
      status: 'sent'
    }
  ]);

  // Check authorization
  if (!user || user.role !== 'hod') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="error">Access denied. HOD access required.</Alert>
      </div>
    );
  }

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetchTeachers();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNotificationForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle send notification
  const handleSendNotification = async (e) => {
    e.preventDefault();
    try {
      await sendNotification({
        subject: notificationForm.subject,
        message: notificationForm.message,
        priority: notificationForm.priority,
        recipients: notificationForm.recipients
      });
      
      setShowComposeModal(false);
      setNotificationForm({
        subject: '',
        message: '',
        priority: 'normal',
        recipients: 'all'
      });
      
      // Show success message
      alert('Notification sent successfully!');
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Error sending notification. Please try again.');
    }
  };

  // Get priority badge
  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high':
        return <Badge variant="danger" size="sm">High Priority</Badge>;
      case 'normal':
        return <Badge variant="default" size="sm">Normal</Badge>;
      case 'low':
        return <Badge variant="success" size="sm">Low Priority</Badge>;
      default:
        return <Badge variant="default" size="sm">{priority}</Badge>;
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <Head>
        <title>Notifications - HOD Dashboard</title>
        <meta name="description" content="Send notifications to department teachers" />
      </Head>

      <Layout maxWidth="max-w-7xl mx-auto" enableAnimation={true} className="space-y-6">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                  <p className="text-gray-600 mt-1">
                    Send notifications and communicate with your department teachers
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRefresh}
                    loading={refreshing}
                    icon={FiRefreshCw}
                  >
                    Refresh
                  </Button>
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={() => setShowComposeModal(true)}
                    icon={FiPlus}
                  >
                    Compose
                  </Button>
                </div>
              </div>

              {/* Error handling */}
              {teachersError && (
                <Alert variant="error" className="mb-6">
                  Error loading teachers: {teachersError.message}
                </Alert>
              )}

              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-blue-50">
                      <FiMail className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Sent</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {notificationHistory.length}
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-green-50">
                      <FiUsers className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Recipients</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {teachersLoading ? '...' : teachers?.length || 0}
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-purple-50">
                      <FiClock className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">This Week</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {notificationHistory.filter(n => {
                          const sentDate = new Date(n.sent_at);
                          const weekAgo = new Date();
                          weekAgo.setDate(weekAgo.getDate() - 7);
                          return sentDate > weekAgo;
                        }).length}
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-orange-50">
                      <FiCheck className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Success Rate</p>
                      <p className="text-2xl font-semibold text-gray-900">100%</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    variant="outline"
                    className="p-4 h-auto flex-col items-start text-left"
                    onClick={() => {
                      setNotificationForm(prev => ({
                        ...prev,
                        subject: 'Department Meeting Reminder',
                        message: 'Please attend the upcoming department meeting.',
                        priority: 'high'
                      }));
                      setShowComposeModal(true);
                    }}
                  >
                    <FiUsers className="w-6 h-6 text-blue-600 mb-2" />
                    <div>
                      <div className="font-medium text-gray-900">Meeting Reminder</div>
                      <div className="text-sm text-gray-500">Send meeting notifications</div>
                    </div>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="p-4 h-auto flex-col items-start text-left"
                    onClick={() => {
                      setNotificationForm(prev => ({
                        ...prev,
                        subject: 'Grade Submission Reminder',
                        message: 'Please submit grades by the deadline.',
                        priority: 'normal'
                      }));
                      setShowComposeModal(true);
                    }}
                  >
                    <FiClock className="w-6 h-6 text-green-600 mb-2" />
                    <div>
                      <div className="font-medium text-gray-900">Grade Reminder</div>
                      <div className="text-sm text-gray-500">Remind about grade submissions</div>
                    </div>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="p-4 h-auto flex-col items-start text-left"
                    onClick={() => {
                      setNotificationForm(prev => ({
                        ...prev,
                        subject: 'General Announcement',
                        message: '',
                        priority: 'normal'
                      }));
                      setShowComposeModal(true);
                    }}
                  >
                    <FiMail className="w-6 h-6 text-purple-600 mb-2" />
                    <div>
                      <div className="font-medium text-gray-900">General Notice</div>
                      <div className="text-sm text-gray-500">Send general announcements</div>
                    </div>
                  </Button>
                </div>
              </Card>

              {/* Notification History */}
              <Card className="overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Notification History</h3>
                </div>
                {notificationHistory.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {notificationHistory.map((notification) => (
                      <div key={notification.id} className="p-6 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <FiMail className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className="text-sm font-medium text-gray-900">
                                  {notification.subject}
                                </h4>
                                {getPriorityBadge(notification.priority)}
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <div className="flex items-center">
                                  <FiUsers className="w-3 h-3 mr-1" />
                                  {notification.recipients} recipients
                                </div>
                                <div className="flex items-center">
                                  <FiClock className="w-3 h-3 mr-1" />
                                  {formatDate(notification.sent_at)}
                                </div>
                                <Badge variant="success" size="sm">
                                  {notification.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FiMail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications sent</h3>
                    <p className="text-gray-500 mb-4">
                      You haven't sent any notifications yet.
                    </p>
                    <Button 
                      variant="primary" 
                      onClick={() => setShowComposeModal(true)}
                      icon={FiPlus}
                    >
                      Send First Notification
                    </Button>
                  </div>
                )}
              </Card>

              {/* Compose Notification Modal */}
              {showComposeModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Compose Notification
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowComposeModal(false)}
                          icon={FiX}
                        />
                      </div>
                    </div>

                    <form onSubmit={handleSendNotification} className="p-6 space-y-6">
                      <Input
                        label="Subject"
                        name="subject"
                        value={notificationForm.subject}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter notification subject"
                      />

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Message <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          name="message"
                          value={notificationForm.message}
                          onChange={handleInputChange}
                          required
                          rows={6}
                          className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary-light focus:border-primary-light sm:text-sm px-3 py-2"
                          placeholder="Enter your message here..."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Priority
                          </label>
                          <select
                            name="priority"
                            value={notificationForm.priority}
                            onChange={handleInputChange}
                            className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary-light focus:border-primary-light sm:text-sm px-3 py-2"
                          >
                            <option value="low">Low Priority</option>
                            <option value="normal">Normal Priority</option>
                            <option value="high">High Priority</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Recipients
                          </label>
                          <select
                            name="recipients"
                            value={notificationForm.recipients}
                            onChange={handleInputChange}
                            className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary-light focus:border-primary-light sm:text-sm px-3 py-2"
                          >
                            <option value="all">All Department Teachers</option>
                            <option value="selected">Selected Teachers</option>
                          </select>
                        </div>
                      </div>

                      {/* Recipients Summary */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <FiUsers className="w-4 h-4" />
                          <span>
                            This notification will be sent to{' '}
                            <strong>
                              {notificationForm.recipients === 'all'
                                ? `all ${teachers?.length || 0} department teachers`
                                : 'selected teachers'
                              }
                            </strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-3 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowComposeModal(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          variant="primary"
                          loading={sending}
                          icon={FiSend}
                        >
                          Send Notification
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
      </Layout>
    </>
  );
};

export default NotificationsPage;
