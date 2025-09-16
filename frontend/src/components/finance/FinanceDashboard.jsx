import React from 'react';
import { FiDollarSign, FiBarChart3, FiUsers, FiClipboard } from 'react-icons/fi';

const FinanceDashboard = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="card">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Finance Dashboard</h1>
        <p className="text-gray-600">Manage student fees and financial operations.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <FiDollarSign className="w-8 h-8 text-primary-blue mx-auto mb-2" />
          <h3 className="font-medium">Fees</h3>
        </div>
        <div className="card text-center">
          <FiBarChart3 className="w-8 h-8 text-primary-blue mx-auto mb-2" />
          <h3 className="font-medium">Reports</h3>
        </div>
        <div className="card text-center">
          <FiUsers className="w-8 h-8 text-primary-blue mx-auto mb-2" />
          <h3 className="font-medium">Students</h3>
        </div>
        <div className="card text-center">
          <FiClipboard className="w-8 h-8 text-primary-blue mx-auto mb-2" />
          <h3 className="font-medium">Invoices</h3>
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboard;
