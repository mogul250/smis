import React from 'react';
import { motion } from 'framer-motion';
import { Clock, User, BookOpen, MapPin, Plus } from 'lucide-react';
import Badge from '../common/Badge';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

const TimetableSlot = ({
  slot,
  editable = false,
  showActions = false,
  onClick,
  onEdit,
  onDelete,
  colorScheme = 'default',
  size = 'default',
  className = ''
}) => {
  if (!slot) {
    return (
      <motion.div
        className={cn(
          "border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400 transition-all duration-200",
          size === 'small' ? 'min-h-12 p-1 text-xs' : 'min-h-16 p-2 text-sm',
          editable && 'hover:border-primary-green hover:bg-green-50 cursor-pointer hover:text-primary-green',
          className
        )}
        onClick={editable ? onClick : undefined}
        whileHover={editable ? { scale: 1.02 } : {}}
        whileTap={editable ? { scale: 0.98 } : {}}
      >
        {editable && (
          <div className="flex items-center gap-1">
            <Plus className="h-3 w-3" />
            <span className="font-medium">Add Class</span>
          </div>
        )}
      </motion.div>
    );
  }

  const getSlotColor = () => {
    switch (colorScheme) {
      case 'status':
        return slot.status === 'approved'
          ? 'bg-green-100 border-green-300 text-green-800 shadow-green-100'
          : slot.status === 'rejected'
          ? 'bg-red-100 border-red-300 text-red-800 shadow-red-100'
          : 'bg-yellow-100 border-yellow-300 text-yellow-800 shadow-yellow-100';
      case 'course':
        const colors = [
          'bg-blue-100 border-blue-300 text-blue-800 shadow-blue-100',
          'bg-purple-100 border-purple-300 text-purple-800 shadow-purple-100',
          'bg-green-100 border-green-300 text-green-800 shadow-green-100',
          'bg-orange-100 border-orange-300 text-orange-800 shadow-orange-100',
          'bg-pink-100 border-pink-300 text-pink-800 shadow-pink-100',
          'bg-indigo-100 border-indigo-300 text-indigo-800 shadow-indigo-100',
          'bg-teal-100 border-teal-300 text-teal-800 shadow-teal-100',
        ];
        return colors[slot.course_id % colors.length];
      default:
        return 'bg-primary-green/10 border-primary-green/30 text-primary-green shadow-green-100';
    }
  };

  const formatTime = (time) => {
    if (!time) return '';
    return time.substring(0, 5); // Get HH:MM format
  };

  return (
    <motion.div
      className={cn(
        "border rounded-lg mb-1 relative group shadow-sm transition-all duration-200",
        getSlotColor(),
        size === 'small' ? 'p-2 text-xs' : 'p-3 text-sm',
        onClick && 'cursor-pointer hover:shadow-lg hover:scale-[1.02]',
        className
      )}
      onClick={onClick}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      layout
    >
      {/* Course Name */}
      <div className={cn(
        "font-semibold truncate flex items-center gap-1",
        size === 'small' ? 'text-xs' : 'text-sm'
      )}>
        <BookOpen className="h-3 w-3 flex-shrink-0" />
        {slot.course_name || slot.course_code}
      </div>

      {/* Teacher Name */}
      {slot.teacher_name && (
        <div className={cn(
          "text-opacity-90 truncate flex items-center gap-1 mt-1",
          size === 'small' ? 'text-xs' : 'text-sm'
        )}>
          <User className="h-3 w-3 flex-shrink-0" />
          {slot.teacher_name}
        </div>
      )}

      {/* Time */}
      <div className={cn(
        "text-opacity-80 flex items-center gap-1 mt-1",
        size === 'small' ? 'text-xs' : 'text-xs'
      )}>
        <Clock className="h-3 w-3 flex-shrink-0" />
        {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
      </div>

      {/* Room */}
      {slot.room && (
        <div className={cn(
          "text-opacity-80 flex items-center gap-1 mt-1",
          size === 'small' ? 'text-xs' : 'text-xs'
        )}>
          <MapPin className="h-3 w-3 flex-shrink-0" />
          {slot.room}
        </div>
      )}

      {/* Status Badge */}
      {colorScheme === 'status' && slot.status && (
        <div className="absolute top-1 right-1">
          <Badge 
            variant={
              slot.status === 'approved' ? 'success' :
              slot.status === 'rejected' ? 'error' : 'warning'
            }
            size="xs"
          >
            {slot.status}
          </Badge>
        </div>
      )}

      {/* Action Buttons */}
      {showActions && (editable || onEdit || onDelete) && (
        <motion.div
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
        >
          <div className="flex space-x-1">
            {onEdit && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(slot);
                }}
                className="h-6 w-6 p-0 hover:bg-white/50"
              >
                ✏️
              </Button>
            )}
            {onDelete && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(slot);
                }}
                className="h-6 w-6 p-0 hover:bg-white/50 text-red-600 hover:text-red-800"
              >
                🗑️
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default TimetableSlot;
