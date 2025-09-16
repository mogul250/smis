import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { studentAPI } from '../../services/apiService';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { FiCalendar, FiClock, FiMapPin, FiUser, FiBook } from 'react-icons/fi';

const StudentTimetable = () => {
  const { user } = useAuth();
  const [selectedSemester, setSelectedSemester] = useState('current');

  const { data: timetable, loading, error } = useApi(
    () => studentAPI.getTimetable({ semester: selectedSemester === 'current' ? undefined : selectedSemester }),
    [selectedSemester]
  );

  if (!user || user.role !== 'student') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="error">Access denied. Student access required.</Alert>
      </div>
    );
  }

  // Days of the week
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Time slots (assuming 8 AM to 6 PM with 1-hour slots)
  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00'
  ];

  // Organize timetable data by day and time
  const organizedTimetable = React.useMemo(() => {
    if (!timetable) return {};

    const organized = {};
    daysOfWeek.forEach(day => {
      organized[day] = {};
      timeSlots.forEach(time => {
        organized[day][time] = null;
      });
    });

    timetable.forEach(slot => {
      const day = slot.day_of_week;
      const startTime = slot.start_time?.substring(0, 5); // Extract HH:MM
      
      if (organized[day] && organized[day][startTime] !== undefined) {
        organized[day][startTime] = slot;
      }
    });

    return organized;
  }, [timetable]);

  // Get current day and time for highlighting
  const now = new Date();
  const currentDay = daysOfWeek[now.getDay() - 1]; // Adjust for Monday = 0
  const currentTime = now.toTimeString().substring(0, 5);

  const isCurrentSlot = (day, time) => {
    if (day !== currentDay) return false;
    const slotTime = new Date(`2000-01-01 ${time}:00`);
    const slotEndTime = new Date(slotTime.getTime() + 60 * 60 * 1000); // Add 1 hour
    const nowTime = new Date(`2000-01-01 ${currentTime}:00`);
    return nowTime >= slotTime && nowTime < slotEndTime;
  };

  const getNextClass = () => {
    if (!timetable) return null;
    
    const now = new Date();
    const currentDayIndex = now.getDay() - 1; // Monday = 0
    const currentTime = now.toTimeString().substring(0, 5);

    // Find next class today or in upcoming days
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const dayIndex = (currentDayIndex + dayOffset) % 6; // Only weekdays
      if (dayIndex >= 6) continue; // Skip weekend
      
      const day = daysOfWeek[dayIndex];
      const dayClasses = timetable.filter(slot => slot.day_of_week === day);
      
      for (const slot of dayClasses.sort((a, b) => a.start_time.localeCompare(b.start_time))) {
        const slotTime = slot.start_time?.substring(0, 5);
        
        if (dayOffset === 0 && slotTime <= currentTime) continue; // Skip past classes today
        
        return { ...slot, day };
      }
    }
    
    return null;
  };

  const nextClass = getNextClass();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Class Timetable</h1>
                <p className="text-gray-600">View your weekly class schedule</p>
              </div>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="form-select w-auto"
              >
                <option value="current">Current Semester</option>
                <option value="Fall 2024">Fall 2024</option>
                <option value="Spring 2024">Spring 2024</option>
                <option value="Summer 2024">Summer 2024</option>
              </select>
            </div>

            {loading ? (
              <Card className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </Card>
            ) : error ? (
              <Alert variant="error">
                Failed to load timetable: {error}
              </Alert>
            ) : (
              <>
                {/* Next Class Info */}
                {nextClass && (
                  <Card className="bg-blue-50 border-blue-200">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary-blue rounded-lg flex items-center justify-center">
                        <FiClock className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">Next Class</h3>
                        <p className="text-gray-600">
                          {nextClass.course_name} • {nextClass.day} at {nextClass.start_time?.substring(0, 5)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {nextClass.room_number} • {nextClass.teacher_name}
                        </p>
                      </div>
                      <Badge variant="primary">
                        {nextClass.day === currentDay ? 'Today' : nextClass.day}
                      </Badge>
                    </div>
                  </Card>
                )}

                {/* Weekly Timetable Grid */}
                <Card>
                  <Card.Header>
                    <Card.Title>Weekly Schedule</Card.Title>
                  </Card.Header>
                  
                  {timetable && timetable.length > 0 ? (
                    <div className="overflow-x-auto">
                      <div className="min-w-full">
                        {/* Header Row */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                          <div className="p-2 text-sm font-medium text-gray-500">Time</div>
                          {daysOfWeek.map(day => (
                            <div key={day} className="p-2 text-sm font-medium text-gray-900 text-center">
                              {day}
                              {day === currentDay && (
                                <Badge variant="primary" className="ml-2 text-xs">Today</Badge>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Time Slots */}
                        {timeSlots.map(time => (
                          <div key={time} className="grid grid-cols-7 gap-1 mb-1">
                            <div className="p-2 text-sm font-medium text-gray-600 border-r">
                              {time}
                            </div>
                            {daysOfWeek.map(day => {
                              const slot = organizedTimetable[day]?.[time];
                              const isCurrent = isCurrentSlot(day, time);
                              
                              return (
                                <div 
                                  key={`${day}-${time}`} 
                                  className={`p-2 min-h-[80px] border rounded ${
                                    slot 
                                      ? isCurrent 
                                        ? 'bg-blue-100 border-blue-300' 
                                        : 'bg-gray-50 border-gray-200'
                                      : 'bg-white border-gray-100'
                                  }`}
                                >
                                  {slot && (
                                    <div className="space-y-1">
                                      <div className="font-medium text-xs text-gray-900 truncate">
                                        {slot.course_name}
                                      </div>
                                      <div className="text-xs text-gray-600 truncate">
                                        {slot.course_code}
                                      </div>
                                      <div className="flex items-center text-xs text-gray-500">
                                        <FiMapPin className="w-3 h-3 mr-1" />
                                        {slot.room_number}
                                      </div>
                                      <div className="flex items-center text-xs text-gray-500">
                                        <FiUser className="w-3 h-3 mr-1" />
                                        {slot.teacher_name}
                                      </div>
                                      {isCurrent && (
                                        <Badge variant="success" className="text-xs">
                                          Now
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FiCalendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No classes scheduled for the selected semester.</p>
                    </div>
                  )}
                </Card>

                {/* Class Summary */}
                {timetable && timetable.length > 0 && (
                  <Card>
                    <Card.Header>
                      <Card.Title>Class Summary</Card.Title>
                    </Card.Header>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {timetable.map((slot, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-primary-blue rounded-lg flex items-center justify-center flex-shrink-0">
                              <FiBook className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 truncate">
                                {slot.course_name}
                              </h4>
                              <p className="text-sm text-gray-600">{slot.course_code}</p>
                              <div className="mt-2 space-y-1">
                                <div className="flex items-center text-sm text-gray-500">
                                  <FiCalendar className="w-4 h-4 mr-2" />
                                  {slot.day_of_week} {slot.start_time?.substring(0, 5)} - {slot.end_time?.substring(0, 5)}
                                </div>
                                <div className="flex items-center text-sm text-gray-500">
                                  <FiMapPin className="w-4 h-4 mr-2" />
                                  {slot.room_number}
                                </div>
                                <div className="flex items-center text-sm text-gray-500">
                                  <FiUser className="w-4 h-4 mr-2" />
                                  {slot.teacher_name}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentTimetable;
