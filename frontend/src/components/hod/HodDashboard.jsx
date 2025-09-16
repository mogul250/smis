import React from 'react';
import { FiUsers, FiBarChart3, FiBook, FiSettings } from 'react-icons/fi';

const HodDashboard = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="card">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">HOD Dashboard</h1>
        <p className="text-gray-600">Oversee department operations and performance.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <FiUsers className="w-8 h-8 text-primary-blue mx-auto mb-2" />
          <h3 className="font-medium">Teachers</h3>
        </div>
        <div className="card text-center">
          <FiBarChart3 className="w-8 h-8 text-primary-blue mx-auto mb-2" />
          <h3 className="font-medium">Reports</h3>
        </div>
        <div className="card text-center">
          <FiBook className="w-8 h-8 text-primary-blue mx-auto mb-2" />
          <h3 className="font-medium">Courses</h3>
        </div>
        <div className="card text-center">
          <FiSettings className="w-8 h-8 text-primary-blue mx-auto mb-2" />
          <h3 className="font-medium">Approvals</h3>
        </div>
      </div>
    </div>
  );
};

export default HodDashboard;
