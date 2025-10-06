import React from 'react';
import Layout from '../components/common/Layout';
import StatCard from '../components/common/StatCard';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { FiUsers, FiTrendingUp, FiPlus, FiGrid } from 'react-icons/fi';

const ResponsiveTestPage = () => {
  return (
    <Layout>
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Responsive Test</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Testing responsive design across all breakpoints.</p>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Button
              variant="primary"
              size="sm"
              icon={FiPlus}
              className="bg-primary-green hover:bg-green-600 text-white text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">Add Item</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            title="Total Users"
            value="1,234"
            trend={FiTrendingUp}
            trendValue="+12%"
            trendLabel="from last month"
            icon={FiUsers}
            iconColor="green"
          />
          <StatCard
            title="Active Sessions"
            value="89"
            trend={FiTrendingUp}
            trendValue="+5%"
            trendLabel="this week"
            icon={FiGrid}
            iconColor="green"
          />
          <StatCard
            title="Revenue"
            value="$45.2K"
            trend={FiTrendingUp}
            trendValue="+8%"
            trendLabel="this month"
            icon={FiTrendingUp}
            iconColor="green"
          />
          <StatCard
            title="Growth Rate"
            value="23.5%"
            trend={FiTrendingUp}
            trendValue="+2.1%"
            trendLabel="vs last quarter"
            icon={FiTrendingUp}
            iconColor="green"
          />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Card className="p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Mobile First Design</h3>
            <p className="text-gray-600 text-sm sm:text-base">
              This layout is designed mobile-first and scales up to larger screens.
            </p>
            <ul className="mt-4 space-y-2 text-sm sm:text-base">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Mobile: Single column layout
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Tablet: Two column grid
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Desktop: Four column grid
              </li>
            </ul>
          </Card>

          <Card className="p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Responsive Features</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Fixed Sidebar</span>
                <span className="text-xs text-gray-500 hidden lg:inline">Desktop Only</span>
                <span className="text-xs text-gray-500 lg:hidden">Mobile Menu</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Search Bar</span>
                <span className="text-xs text-gray-500 hidden md:inline">Visible</span>
                <span className="text-xs text-gray-500 md:hidden">Hidden</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">User Info</span>
                <span className="text-xs text-gray-500 hidden sm:inline">Full</span>
                <span className="text-xs text-gray-500 sm:hidden">Avatar Only</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Breakpoint Indicators */}
        <Card className="p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Breakpoint</h3>
          <div className="flex flex-wrap gap-2">
            <div className="sm:hidden px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
              Mobile (&lt; 640px)
            </div>
            <div className="hidden sm:block md:hidden px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
              Small (640px - 768px)
            </div>
            <div className="hidden md:block lg:hidden px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
              Medium (768px - 1024px)
            </div>
            <div className="hidden lg:block xl:hidden px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
              Large (1024px - 1280px)
            </div>
            <div className="hidden xl:block px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
              Extra Large (≥ 1280px)
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default ResponsiveTestPage;
