import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { useApi, useAsyncOperation } from '../../hooks/useApi';
import { teacherAPI } from '../../services/api';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Alert } from '../../components/ui/alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Check, X, Clock, Save, Calendar, Users, AlertCircle } from 'lucide-react';

const AttendanceStatus = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late'
};

const TeacherAttendance = () => {
  const { user } = useAuth();
  const router = useRouter();
  
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState({});
  const [notes, setNotes] = useState({});
  const [saveMessage, setSaveMessage] = useState(null);

  // Always call hooks in the same order
  const { data: classes, loading: classesLoading } = useApi(teacherAPI.getClasses);
  const { data: students, loading: studentsLoading, execute: loadStudents } = useApi(
    () => selectedCourse ? teacherAPI.getClassStudents(selectedCourse) : Promise.resolve([]),
    []
  );
  
  const { loading: saving, execute: saveAttendance } = useAsyncOperation();

  const selectedClass = classes?.find(c => c.id === parseInt(selectedCourse));

  const attendanceStats = useMemo(() => {
    if (!students || !attendanceData) return { present: 0, late: 0, absent: 0 };
    
    const stats = { present: 0, late: 0, absent: 0 };
    students.forEach(student => {
      const status = attendanceData[student.id] || AttendanceStatus.PRESENT;
      stats[status]++;
    });
    return stats;
  }, [students, attendanceData]);

  useEffect(() => {
    if (selectedCourse) {
      loadStudents();
    }
  }, [selectedCourse, loadStudents]);

  useEffect(() => {
    if (students) {
      const initialData = {};
      const initialNotes = {};
      students.forEach(student => {
        initialData[student.id] = AttendanceStatus.PRESENT;
        initialNotes[student.id] = '';
      });
      setAttendanceData(initialData);
      setNotes(initialNotes);
    }
  }, [students]);

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
    if (!selectedCourse || !students || students.length === 0) {
      setSaveMessage({ type: 'error', text: 'Please select a course with students' });
      return;
    }

    try {
      const attendanceRecords = students.map(student => ({
        studentId: student.id,
        status: attendanceData[student.id] || AttendanceStatus.PRESENT,
        notes: notes[student.id] || ''
      }));

      await saveAttendance(() => 
        teacherAPI.markAttendance({
          courseId: parseInt(selectedCourse),
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

  // Early return after all hooks
  if (!user || user.role !== 'teacher') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <div>Access denied. Teacher access required.</div>
        </Alert>
      </div>
    );
  }

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
                  {selectedClass ? `${selectedClass.name}` : 'Select a course'}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push('/teacher/classes')}
              >
                Back to Classes
              </Button>
            </div>

            {saveMessage && (
              <Alert variant={saveMessage.type === 'error' ? 'destructive' : 'default'}>
                <AlertCircle className="h-4 w-4" />
                <div>{saveMessage.text}</div>
              </Alert>
            )}

            {/* Course and Date Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Attendance Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="course-select">Course</Label>
                    <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes?.map(cls => (
                          <SelectItem key={cls.id} value={cls.id.toString()}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="date-input">Date</Label>
                    <Input
                      id="date-input"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                  </div>

                  <div className="flex items-end">
                    <Button
                      onClick={handleSaveAttendance}
                      disabled={!selectedCourse || !students || students.length === 0 || saving}
                      className="w-full"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Attendance'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {studentsLoading ? (
              <Card className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </Card>
            ) : !selectedCourse ? (
              <Card className="text-center py-12">
                <CardContent className="pt-6">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Course</h3>
                  <p className="text-gray-500">
                    Choose a course from the dropdown above to mark attendance.
                  </p>
                </CardContent>
              </Card>
            ) : students && students.length > 0 ? (
              <div>
                {/* Attendance Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gray-500 rounded-lg flex items-center justify-center mr-4">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Students</p>
                          <p className="text-2xl font-bold text-gray-900">{students.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mr-4">
                          <Check className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Present</p>
                          <p className="text-2xl font-bold text-gray-900">{attendanceStats.present}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mr-4">
                          <Clock className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Late</p>
                          <p className="text-2xl font-bold text-gray-900">{attendanceStats.late}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center mr-4">
                          <X className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Absent</p>
                          <p className="text-2xl font-bold text-gray-900">{attendanceStats.absent}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Attendance Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Student Attendance - {new Date(selectedDate).toLocaleDateString()}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {students.map((student) => {
                        const status = attendanceData[student.id] || AttendanceStatus.PRESENT;
                        
                        return (
                          <div key={student.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">
                                  {student.first_name} {student.last_name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {student.email}
                                </div>
                              </div>
                              
                              <div className="flex space-x-2">
                                <Button
                                  variant={status === AttendanceStatus.PRESENT ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handleAttendanceChange(student.id, AttendanceStatus.PRESENT)}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Present
                                </Button>
                                <Button
                                  variant={status === AttendanceStatus.LATE ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handleAttendanceChange(student.id, AttendanceStatus.LATE)}
                                >
                                  <Clock className="h-4 w-4 mr-1" />
                                  Late
                                </Button>
                                <Button
                                  variant={status === AttendanceStatus.ABSENT ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handleAttendanceChange(student.id, AttendanceStatus.ABSENT)}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Absent
                                </Button>
                              </div>
                            </div>
                            
                            <div className="mt-3">
                              <Label htmlFor={`notes-${student.id}`} className="text-sm">Notes</Label>
                              <Input
                                id={`notes-${student.id}`}
                                placeholder="Add notes (optional)"
                                value={notes[student.id] || ''}
                                onChange={(e) => handleNotesChange(student.id, e.target.value)}
                                className="mt-1"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent className="pt-6">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
                  <p className="text-gray-500">
                    This course doesn't have any students enrolled.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default TeacherAttendance;
