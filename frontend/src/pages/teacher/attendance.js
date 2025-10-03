import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { useApi, useAsyncOperation } from '../../hooks/useApi';
import { teacherAPI } from '../../services/api';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { FiCheck, FiX, FiClock, FiSave, FiCalendar, FiUsers } from 'react-icons/fi';

const TeacherAttendance = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { class: classId } = router.query;
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState({});
  const [notes, setNotes] = useState({});
  const [saveMessage, setSaveMessage] = useState(null);

  const { data: classes, loading: classesLoading } = useApi(teacherAPI.getClasses);
  const { data: students, loading: studentsLoading, execute: loadStudents } = useApi(
    () => teacherAPI.getClassStudents(classId),
    []
  );
  
  const { loading: saving, execute: saveAttendance } = useAsyncOperation();

  const selectedClass = classes?.find(c => c.id === parseInt(classId));

  React.useEffect(() => {
    if (classId) {
      loadStudents();
    }
  }, [classId, loadStudents]);

  React.useEffect(() => {
    // Initialize attendance data when students load
    if (students) {
      const initialData = {};
      const initialNotes = {};
      students.forEach(student => {
        initialData[student.id] = 'present'; // Default to present
        initialNotes[student.id] = '';
      });
      setAttendanceData(initialData);
      setNotes(initialNotes);
    }
  }, [students]);

  if (!user || user.role !== 'teacher') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="error">Access denied. Teacher access required.</Alert>
      </div>
    );
  }

  const handleAttendanceChange = (studentId, status) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleNotesChange = (studentId, note) => {
    setNotes(prev => ({
      ...prev,
      [studentId]: note
    }));
  };

  const handleSaveAttendance = async () => {
    if (!classId || !students) return;

    try {
      const attendanceRecords = students.map(student => ({
        studentId: student.id,
        status: attendanceData[student.id] || 'present',
        notes: notes[student.id] || ''
      }));

      await saveAttendance(() => 
        teacherAPI.markAttendance({
          courseId: parseInt(classId),
          attendance: attendanceRecords,
          date: selectedDate
        })
      );

      setSaveMessage({ type: 'success', text: 'Attendance saved successfully!' });
      setTimeout(() => setSaveMessage(null), 5000);
    } catch (error) {
      setSaveMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to save attendance' 
      });
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return FiCheck;
      case 'late': return FiClock;
      case 'absent': return FiX;
      default: return FiCheck;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'text-green-600';
      case 'late': return 'text-yellow-600';
      case 'absent': return 'text-red-600';
      default: return 'text-green-600';
    }
  };

  const attendanceStats = React.useMemo(() => {
    if (!students || !attendanceData) return { present: 0, late: 0, absent: 0 };
    
    const stats = { present: 0, late: 0, absent: 0 };
    students.forEach(student => {
      const status = attendanceData[student.id] || 'present';
      stats[status]++;
    });
    return stats;
  }, [students, attendanceData]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mark Attendance</h1>
                <p className="text-gray-600">
                  {selectedClass ? `${selectedClass.name} (${selectedClass.course_code})` : 'Select a class'}
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={() => router.push('/teacher/classes')}
              >
                Back to Classes
              </Button>
            </div>

            {saveMessage && (
              <Alert 
                variant={saveMessage.type}
                dismissible
                onDismiss={() => setSaveMessage(null)}
              >
                {saveMessage.text}
              </Alert>
            )}

            {/* Class and Date Selection */}
            <Card>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Class
                  </label>
                  <select
                    value={classId || ''}
                    onChange={(e) => router.push(`/teacher/attendance?class=${e.target.value}`)}
                    className="form-select"
                    disabled={classesLoading}
                  >
                    <option value="">Select a class</option>
                    {classes?.map(cls => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} ({cls.course_code})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    variant="primary"
                    icon={FiSave}
                    onClick={handleSaveAttendance}
                    loading={saving}
                    disabled={!classId || !students || students.length === 0}
                    className="w-full"
                  >
                    Save Attendance
                  </Button>
                </div>
              </div>
            </Card>

            {studentsLoading ? (
              <Card className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </Card>
            ) : !classId ? (
              <Card className="text-center py-12">
                <FiCalendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Class</h3>
                <p className="text-gray-500">
                  Choose a class from the dropdown above to mark attendance.
                </p>
              </Card>
            ) : students && students.length > 0 ? (
              <>
                {/* Attendance Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gray-500 rounded-lg flex items-center justify-center mr-4">
                        <FiUsers className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Students</p>
                        <p className="text-2xl font-bold text-gray-900">{students.length}</p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-accent-green rounded-lg flex items-center justify-center mr-4">
                        <FiCheck className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Present</p>
                        <p className="text-2xl font-bold text-gray-900">{attendanceStats.present}</p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-accent-orange rounded-lg flex items-center justify-center mr-4">
                        <FiClock className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Late</p>
                        <p className="text-2xl font-bold text-gray-900">{attendanceStats.late}</p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-accent-red rounded-lg flex items-center justify-center mr-4">
                        <FiX className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Absent</p>
                        <p className="text-2xl font-bold text-gray-900">{attendanceStats.absent}</p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Attendance Table */}
                <Card>
                  <Card.Header>
                    <Card.Title>Student Attendance - {new Date(selectedDate).toLocaleDateString()}</Card.Title>
                  </Card.Header>
                  
                  <Table>
                    <Table.Header>
                      <Table.Row>
                        <Table.Head>Student ID</Table.Head>
                        <Table.Head>Name</Table.Head>
                        <Table.Head>Status</Table.Head>
                        <Table.Head>Notes</Table.Head>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {students.map((student, index) => {
                        const status = attendanceData[student.id] || 'present';
                        const StatusIcon = getStatusIcon(status);
                        
                        return (
                          <Table.Row key={index}>
                            <Table.Cell>
                              <span className="font-mono text-sm">
                                {student.id}
                              </span>
                            </Table.Cell>
                            <Table.Cell>
                              <div className="font-medium text-gray-900">
                                {student.first_name} {student.last_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {student.email}
                              </div>
                            </Table.Cell>
                            <Table.Cell>
                              <div className="flex space-x-2">
                                {['present', 'late', 'absent'].map(statusOption => {
                                  const Icon = getStatusIcon(statusOption);
                                  const isSelected = status === statusOption;
                                  
                                  return (
                                    <button
                                      key={statusOption}
                                      onClick={() => handleAttendanceChange(student.id, statusOption)}
                                      className={`p-2 rounded-lg border-2 transition-colors ${
                                        isSelected
                                          ? statusOption === 'present' 
                                            ? 'border-green-500 bg-green-50 text-green-600'
                                            : statusOption === 'late'
                                            ? 'border-yellow-500 bg-yellow-50 text-yellow-600'
                                            : 'border-red-500 bg-red-50 text-red-600'
                                          : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300'
                                      }`}
                                      title={statusOption.charAt(0).toUpperCase() + statusOption.slice(1)}
                                    >
                                      <Icon className="w-4 h-4" />
                                    </button>
                                  );
                                })}
                              </div>
                            </Table.Cell>
                            <Table.Cell>
                              <input
                                type="text"
                                value={notes[student.id] || ''}
                                onChange={(e) => handleNotesChange(student.id, e.target.value)}
                                placeholder="Add notes..."
                                className="form-input text-sm"
                              />
                            </Table.Cell>
                          </Table.Row>
                        );
                      })}
                    </Table.Body>
                  </Table>
                </Card>
              </>
            ) : (
              <Card className="text-center py-12">
                <FiUsers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
                <p className="text-gray-500">
                  This class doesn't have any students enrolled.
                </p>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default TeacherAttendance;
