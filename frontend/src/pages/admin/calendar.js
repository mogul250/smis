import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useApi, useAsyncOperation } from '../../hooks/useApi';
import { adminAPI } from '../../services/apiService';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { 
  FiCalendar, 
  FiPlus, 
  FiEdit, 
  FiTrash2, 
  FiClock,
  FiRefreshCw,
  FiSave,
  FiX
} from 'react-icons/fi';

const AdminCalendar = () => {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [formData, setFormData] = useState({
    eventName: '',
    eventType: 'holiday',
    startDate: '',
    endDate: '',
    description: ''
  });

  const { data: events, loading, refetch } = useApi(() => adminAPI.getAcademicCalendar());
  const { loading: saving, execute: saveEvent } = useAsyncOperation();

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Admin access required.</p>
        </div>
      </div>
    );
  }

  const eventTypes = [
    { value: 'holiday', label: 'Holiday', color: 'bg-red-100 text-red-800' },
    { value: 'exam', label: 'Examination', color: 'bg-blue-100 text-blue-800' },
    { value: 'semester_start', label: 'Semester Start', color: 'bg-green-100 text-green-800' },
    { value: 'semester_end', label: 'Semester End', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'announcement', label: 'Announcement', color: 'bg-purple-100 text-purple-800' },
    { value: 'meeting', label: 'Meeting', color: 'bg-gray-100 text-gray-800' }
  ];

  const handleOpenModal = (event = null) => {
    if (event) {
      setEditingEvent(event);
      setFormData({
        eventName: event.event_name || '',
        eventType: event.event_type || 'holiday',
        startDate: event.start_date || '',
        endDate: event.end_date || '',
        description: event.description || ''
      });
    } else {
      setEditingEvent(null);
      setFormData({
        eventName: '',
        eventType: 'holiday',
        startDate: '',
        endDate: '',
        description: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEvent(null);
    setFormData({
      eventName: '',
      eventType: 'holiday',
      startDate: '',
      endDate: '',
      description: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const eventData = {
        eventName: formData.eventName,
        eventType: formData.eventType,
        eventDate: formData.startDate,
        endDate: formData.endDate,
        description: formData.description
      };

      if (editingEvent) {
        await saveEvent(() => adminAPI.updateAcademicEvent(editingEvent.id, eventData));
        setActionMessage({ type: 'success', text: 'Event updated successfully!' });
      } else {
        await saveEvent(() => adminAPI.manageAcademicCalendar(eventData));
        setActionMessage({ type: 'success', text: 'Event created successfully!' });
      }
      
      refetch();
      handleCloseModal();
      setTimeout(() => setActionMessage(null), 5000);
    } catch (error) {
      setActionMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to save event' 
      });
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await adminAPI.deleteAcademicEvent(eventId);
        setActionMessage({ type: 'success', text: 'Event deleted successfully!' });
        refetch();
        setTimeout(() => setActionMessage(null), 5000);
      } catch (error) {
        setActionMessage({ 
          type: 'error', 
          text: error.response?.data?.message || 'Failed to delete event' 
        });
      }
    }
  };

  const getEventTypeColor = (type) => {
    const eventType = eventTypes.find(et => et.value === type);
    return eventType ? eventType.color : 'bg-gray-100 text-gray-800';
  };

  const getEventTypeLabel = (type) => {
    const eventType = eventTypes.find(et => et.value === type);
    return eventType ? eventType.label : type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6 flex justify-center items-center">
            <LoadingSpinner size="lg" />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Academic Calendar</h1>
                <p className="text-gray-600">Manage academic events, holidays, and important dates</p>
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="outline" size="sm" icon={FiRefreshCw} onClick={refetch}>
                  Refresh
                </Button>
                <Button variant="primary" icon={FiPlus} onClick={() => handleOpenModal()}>
                  Add Event
                </Button>
              </div>
            </div>

            {actionMessage && (
              <Alert 
                variant={actionMessage.type}
                dismissible
                onDismiss={() => setActionMessage(null)}
              >
                {actionMessage.text}
              </Alert>
            )}

            {/* Events List */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events</h3>
                {events && events.length > 0 ? (
                  <div className="space-y-4">
                    {events.map((event, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FiCalendar className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{event.event_name}</h4>
                            <p className="text-sm text-gray-600">{event.description}</p>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEventTypeColor(event.event_type)}`}>
                                {getEventTypeLabel(event.event_type)}
                              </span>
                              <div className="flex items-center text-sm text-gray-500">
                                <FiClock className="w-4 h-4 mr-1" />
                                {new Date(event.start_date).toLocaleDateString()}
                                {event.end_date && event.end_date !== event.start_date && (
                                  <span> - {new Date(event.end_date).toLocaleDateString()}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            icon={FiEdit}
                            onClick={() => handleOpenModal(event)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            icon={FiTrash2}
                            onClick={() => handleDeleteEvent(event.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FiCalendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Events Found</h3>
                    <p className="text-gray-500 mb-4">Get started by adding your first academic event.</p>
                    <Button variant="primary" icon={FiPlus} onClick={() => handleOpenModal()}>
                      Add Event
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {/* Event Type Legend */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Types</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {eventTypes.map((type) => (
                    <div key={type.value} className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${type.color.split(' ')[0]}`} />
                      <span className="text-sm text-gray-700">{type.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>

      {/* Add/Edit Event Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingEvent ? 'Edit Event' : 'Add New Event'}
              </h3>
              <Button variant="outline" size="sm" icon={FiX} onClick={handleCloseModal}>
                Close
              </Button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <Input
                label="Event Name"
                value={formData.eventName}
                onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                required
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Type
                </label>
                <select
                  value={formData.eventType}
                  onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                  className="form-select"
                  required
                >
                  {eventTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <Input
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
              
              <Input
                label="End Date"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="form-textarea"
                  placeholder="Enter event description..."
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" onClick={handleCloseModal}>
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  type="submit" 
                  icon={FiSave}
                  loading={saving}
                >
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCalendar;

