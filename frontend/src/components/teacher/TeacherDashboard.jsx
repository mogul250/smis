import React from 'react';
import { FiUsers, FiBook, FiCalendar, FiClipboard } from 'react-icons/fi';

const TeacherDashboard = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="card">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Teacher Dashboard</h1>
        <p className="text-gray-600">Manage your classes, attendance, and grades.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <FiUsers className="w-8 h-8 text-primary-blue mx-auto mb-2" />
          <h3 className="font-medium">My Classes</h3>
        </div>
        <div className="card text-center">
          <FiClipboard className="w-8 h-8 text-primary-blue mx-auto mb-2" />
          <h3 className="font-medium">Attendance</h3>
        </div>
        <div className="card text-center">
          <FiBook className="w-8 h-8 text-primary-blue mx-auto mb-2" />
          <h3 className="font-medium">Grades</h3>
        </div>
        <div className="card text-center">
          <FiCalendar className="w-8 h-8 text-primary-blue mx-auto mb-2" />
          <h3 className="font-medium">Timetable</h3>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
