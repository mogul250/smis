import React from 'react';
import Badge from '../common/Badge';
import Button from '../common/Button';

const TimetableSlot = ({ 
  slot, 
  editable = false, 
  showActions = false,
  onClick,
  onEdit,
  onDelete,
  colorScheme = 'default',
  size = 'default'
}) => {
  if (!slot) {
    return (
      <div className={`
        ${size === 'small' ? 'min-h-12 p-1' : 'min-h-16 p-2'}
        border-2 border-dashed border-gray-200 rounded-lg
        flex items-center justify-center text-gray-400 text-xs
        ${editable ? 'hover:border-gray-300 cursor-pointer' : ''}
      `}
      onClick={editable ? onClick : undefined}
      >
        {editable && <span>+ Add Class</span>}
      </div>
    );
  }

  const getSlotColor = () => {
    switch (colorScheme) {
      case 'status':
        return slot.status === 'approved' ? 'bg-green-100 border-green-200 text-green-800' :
               slot.status === 'rejected' ? 'bg-red-100 border-red-200 text-red-800' :
               'bg-yellow-100 border-yellow-200 text-yellow-800';
      case 'course':
        const colors = [
          'bg-blue-100 border-blue-200 text-blue-800',
          'bg-purple-100 border-purple-200 text-purple-800',
          'bg-green-100 border-green-200 text-green-800',
          'bg-orange-100 border-orange-200 text-orange-800',
          'bg-pink-100 border-pink-200 text-pink-800',
        ];
        return colors[slot.course_id % colors.length];
      default:
        return 'bg-blue-100 border-blue-200 text-blue-800';
    }
  };

  const formatTime = (time) => {
    if (!time) return '';
    return time.substring(0, 5); // Get HH:MM format
  };

  return (
    <div 
      className={`
        ${getSlotColor()}
        ${size === 'small' ? 'p-1 text-xs' : 'p-2 text-sm'}
        border rounded-lg mb-1 relative group
        ${onClick ? 'cursor-pointer hover:shadow-md' : ''}
        transition-all duration-200
      `}
      onClick={onClick}
    >
      {/* Course Name */}
      <div className={`font-medium truncate ${size === 'small' ? 'text-xs' : 'text-sm'}`}>
        {slot.course_name || slot.course_code}
      </div>
      
      {/* Teacher Name */}
      {slot.teacher_name && (
        <div className={`text-opacity-80 truncate ${size === 'small' ? 'text-xs' : 'text-sm'}`}>
          {slot.teacher_name}
        </div>
      )}
      
      {/* Time */}
      <div className={`text-opacity-70 ${size === 'small' ? 'text-xs' : 'text-xs'}`}>
        {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
      </div>
      
      {/* Room */}
      {slot.room && (
        <div className={`text-opacity-70 ${size === 'small' ? 'text-xs' : 'text-xs'}`}>
          📍 {slot.room}
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
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex space-x-1">
            {onEdit && (
              <Button
                size="xs"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(slot);
                }}
                className="p-1"
              >
                ✏️
              </Button>
            )}
            {onDelete && (
              <Button
                size="xs"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(slot);
                }}
                className="p-1 text-red-600 hover:text-red-800"
              >
                🗑️
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetableSlot;
