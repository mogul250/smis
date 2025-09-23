import React, { useState } from 'react';
import TimetableSlot from './TimetableSlot';
import Card from '../common/Card';
import Button from '../common/Button';

const TimetableGrid = ({ 
  timetable = [], 
  editable = false,
  showActions = false,
  colorScheme = 'default',
  onSlotClick,
  onSlotEdit,
  onSlotDelete,
  onAddSlot,
  title = 'Weekly Schedule'
}) => {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Days of the week
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Time slots (8 AM to 6 PM)
  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  // Group timetable by day and time
  const groupedTimetable = {};
  daysOfWeek.forEach(day => {
    groupedTimetable[day] = {};
    timeSlots.forEach(time => {
      groupedTimetable[day][time] = [];
    });
  });

  // Populate grouped timetable
  timetable?.forEach(item => {
    const dayName = getDayName(item.day_of_week);
    const timeSlot = item.start_time?.substring(0, 5); // Get HH:MM format
    if (groupedTimetable[dayName] && groupedTimetable[dayName][timeSlot]) {
      groupedTimetable[dayName][timeSlot].push(item);
    }
  });

  // Helper function to get day name from number
  function getDayName(dayNumber) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNumber] || 'Unknown';
  }

  const handleSlotClick = (day, time, existingSlots) => {
    if (existingSlots.length > 0) {
      // If there are existing slots, handle click on first slot
      if (onSlotClick) {
        onSlotClick(existingSlots[0]);
      }
    } else if (editable && onAddSlot) {
      // If no slots and editable, add new slot
      const dayNumber = daysOfWeek.indexOf(day) + 1; // Convert to 1-7
      onAddSlot({ day: dayNumber, start_time: time });
    }
  };

  if (viewMode === 'list') {
    return (
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setViewMode('grid')}
            >
              📅 Grid View
            </Button>
          </div>
        </div>
        
        <div className="p-6">
          {daysOfWeek.map(day => {
            const daySlots = timetable?.filter(slot => 
              getDayName(slot.day_of_week) === day
            ).sort((a, b) => a.start_time?.localeCompare(b.start_time));

            if (!daySlots?.length) return null;

            return (
              <div key={day} className="mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-3">{day}</h4>
                <div className="space-y-2">
                  {daySlots.map((slot, index) => (
                    <TimetableSlot
                      key={`${slot.id}-${index}`}
                      slot={slot}
                      editable={editable}
                      showActions={showActions}
                      colorScheme={colorScheme}
                      onClick={() => onSlotClick?.(slot)}
                      onEdit={onSlotEdit}
                      onDelete={onSlotDelete}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setViewMode('list')}
          >
            📋 List View
          </Button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Header with days */}
          <div className="grid grid-cols-8 gap-1 p-4 bg-gray-50 border-b">
            <div className="text-xs font-medium text-gray-500 text-center">Time</div>
            {daysOfWeek.map(day => (
              <div key={day} className="text-xs font-medium text-gray-500 text-center">
                {day}
              </div>
            ))}
          </div>
          
          {/* Time slots grid */}
          {timeSlots.map(time => (
            <div key={time} className="grid grid-cols-8 gap-1 p-2 border-b border-gray-100">
              <div className="text-xs text-gray-600 text-center py-2 font-medium">
                {time}
              </div>
              {daysOfWeek.map(day => {
                const slots = groupedTimetable[day][time] || [];
                return (
                  <div 
                    key={`${day}-${time}`} 
                    className="min-h-16 p-1"
                    onClick={() => handleSlotClick(day, time, slots)}
                  >
                    {slots.length > 0 ? (
                      slots.map((slot, index) => (
                        <TimetableSlot
                          key={`${slot.id}-${index}`}
                          slot={slot}
                          editable={editable}
                          showActions={showActions}
                          colorScheme={colorScheme}
                          size="small"
                          onClick={() => onSlotClick?.(slot)}
                          onEdit={onSlotEdit}
                          onDelete={onSlotDelete}
                        />
                      ))
                    ) : (
                      <TimetableSlot
                        slot={null}
                        editable={editable}
                        size="small"
                        onClick={() => handleSlotClick(day, time, slots)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default TimetableGrid;
