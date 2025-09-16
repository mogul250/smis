import React from 'react';
import { FiUsers, FiGraduationCap, FiCalendar, FiSettings, FiBarChart3 } from 'react-icons/fi';

const AdminDashboard = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="card">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">System administration and user management.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card text-center">
          <FiUsers className="w-8 h-8 text-primary-blue mx-auto mb-2" />
          <h3 className="font-medium">Users</h3>
        </div>
        <div className="card text-center">
          <FiGraduationCap className="w-8 h-8 text-primary-blue mx-auto mb-2" />
          <h3 className="font-medium">Students</h3>
        </div>
        <div className="card text-center">
          <FiCalendar className="w-8 h-8 text-primary-blue mx-auto mb-2" />
          <h3 className="font-medium">Calendar</h3>
        </div>
        <div className="card text-center">
          <FiSettings className="w-8 h-8 text-primary-blue mx-auto mb-2" />
          <h3 className="font-medium">System</h3>
        </div>
        <div className="card text-center">
          <FiBarChart3 className="w-8 h-8 text-primary-blue mx-auto mb-2" />
          <h3 className="font-medium">Analytics</h3>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
