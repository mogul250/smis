import React from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import LoadingSpinner from '../common/LoadingSpinner';
import { FiUsers, FiBarChart, FiBook, FiSettings } from 'react-icons/fi';

const HodDashboardSimple = () => {
  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">HOD Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here's your department overview.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Department Teachers</p>
              <p className="text-3xl font-bold text-gray-900">12</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiUsers className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Courses</p>
              <p className="text-3xl font-bold text-gray-900">8</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FiBook className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Reports Generated</p>
              <p className="text-3xl font-bold text-gray-900">24</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiBarChart className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
              <p className="text-3xl font-bold text-gray-900">3</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <FiSettings className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all duration-200 text-left group">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <FiUsers className="w-5 h-5 text-white" />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Manage Teachers</h4>
              <p className="text-sm text-gray-600 mb-2">View and manage department staff</p>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all duration-200 text-left group">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <FiBarChart className="w-5 h-5 text-white" />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Generate Reports</h4>
              <p className="text-sm text-gray-600 mb-2">Create departmental reports</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Department Teachers</h3>
            <Badge variant="primary">12 Active</Badge>
          </div>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <FiUsers className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">John Smith</p>
                <p className="text-sm text-gray-500">Mathematics • 5 courses</p>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default HodDashboardSimple;
