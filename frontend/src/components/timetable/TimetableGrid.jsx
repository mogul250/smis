import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Grid3X3, List, Clock, Users, BookOpen } from 'lucide-react';
import TimetableSlot from './TimetableSlot';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

const TimetableGrid = ({
  timetable = [],
  editable = false,
  showActions = false,
  colorScheme = 'default',
  onSlotClick,
  onSlotEdit,
  onSlotDelete,
  onAddSlot,
  title = 'Weekly Schedule',
  className = ''
}) => {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [selectedDay, setSelectedDay] = useState(null);

  // Days of the week
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Customizable time slots - can be made configurable later
  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

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

  // Get statistics for the header
  const stats = {
    totalSlots: timetable?.length || 0,
    teachers: new Set(timetable?.map(s => s.teacher_id)).size || 0,
    courses: new Set(timetable?.map(s => s.course_id)).size || 0
  };

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
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className={cn("w-full", className)}
      >
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary-green" />
                  {title}
                </CardTitle>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {stats.totalSlots} slots
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {stats.teachers} teachers
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    {stats.courses} courses
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="flex items-center gap-2 hover:bg-primary-green hover:text-white transition-colors"
                >
                  <Grid3X3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Grid View</span>
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <motion.div variants={containerVariants} className="space-y-6">
              {daysOfWeek.map((day, dayIndex) => {
                const daySlots = timetable?.filter(slot =>
                  getDayName(slot.day_of_week) === day
                ).sort((a, b) => a.start_time?.localeCompare(b.start_time));

                if (!daySlots?.length) return null;

                return (
                  <motion.div
                    key={day}
                    variants={itemVariants}
                    className="border-l-4 border-primary-green pl-4"
                  >
                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      {day}
                      <span className="text-sm font-normal text-gray-500">
                        ({daySlots.length} {daySlots.length === 1 ? 'class' : 'classes'})
                      </span>
                    </h4>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {daySlots.map((slot, index) => (
                        <motion.div
                          key={`${slot.id}-${index}`}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: dayIndex * 0.1 + index * 0.05 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <TimetableSlot
                            slot={slot}
                            editable={editable}
                            showActions={showActions}
                            colorScheme={colorScheme}
                            onClick={() => onSlotClick?.(slot)}
                            onEdit={onSlotEdit}
                            onDelete={onSlotDelete}
                            size="default"
                          />
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={cn("w-full", className)}
    >
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary-green" />
                {title}
              </CardTitle>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {stats.totalSlots} slots
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {stats.teachers} teachers
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {stats.courses} courses
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode('list')}
                className="flex items-center gap-2 hover:bg-primary-green hover:text-white transition-colors"
              >
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">List View</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <div className="min-w-full">
              {/* Header with days */}
              <motion.div
                variants={itemVariants}
                className="grid grid-cols-8 gap-1 p-4 bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200 rounded-t-lg"
              >
                <div className="text-sm font-semibold text-gray-700 text-center flex items-center justify-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Time
                </div>
                {daysOfWeek.map((day, index) => (
                  <motion.div
                    key={day}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="text-sm font-semibold text-gray-700 text-center py-2"
                  >
                    {day.substring(0, 3)}
                  </motion.div>
                ))}
              </motion.div>
          
              {/* Time slots grid */}
              <motion.div variants={containerVariants}>
                {timeSlots.map((time, timeIndex) => (
                  <motion.div
                    key={time}
                    variants={itemVariants}
                    className="grid grid-cols-8 gap-1 p-2 border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="text-sm text-gray-700 text-center py-3 font-medium bg-gray-50 rounded-md flex items-center justify-center">
                      {time}
                    </div>
                    {daysOfWeek.map((day, dayIndex) => {
                      const slots = groupedTimetable[day][time] || [];
                      return (
                        <motion.div
                          key={`${day}-${time}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: timeIndex * 0.05 + dayIndex * 0.02 }}
                          className="min-h-16 p-1 rounded-md hover:bg-white/50 transition-colors cursor-pointer"
                          onClick={() => handleSlotClick(day, time, slots)}
                        >
                          <AnimatePresence mode="wait">
                            {slots.length > 0 ? (
                              slots.map((slot, index) => (
                                <motion.div
                                  key={`${slot.id}-${index}`}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <TimetableSlot
                                    slot={slot}
                                    editable={editable}
                                    showActions={showActions}
                                    colorScheme={colorScheme}
                                    size="small"
                                    onClick={() => onSlotClick?.(slot)}
                                    onEdit={onSlotEdit}
                                    onDelete={onSlotDelete}
                                  />
                                </motion.div>
                              ))
                            ) : (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                whileHover={{ scale: 1.02 }}
                              >
                                <TimetableSlot
                                  slot={null}
                                  editable={editable}
                                  size="small"
                                  onClick={() => handleSlotClick(day, time, slots)}
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TimetableGrid;
