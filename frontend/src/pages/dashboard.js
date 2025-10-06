import React from 'react';
import { useAuth } from '../hooks/useAuth';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import StudentDashboard from '../components/student/StudentDashboard';
import TeacherDashboard from '../components/teacher/TeacherDashboard';
import EnhancedHodDashboard from '../components/hod/EnhancedHodDashboard';
import FinanceDashboard from '../components/finance/FinanceDashboard';
import AdminDashboard from '../components/admin/AdminDashboard';

const DashboardPage = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">Please log in to access the dashboard.</p>
          <a href="/login" className="btn btn-primary">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  const renderDashboard = () => {
    switch (user?.role) {
      case 'student':
        return <StudentDashboard />;
      case 'teacher':
        return <TeacherDashboard />;
      case 'hod':
        return <EnhancedHodDashboard />;
      case 'finance':
        return <FinanceDashboard />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return (
          <div className="p-6">
            <div className="card">
              <h2 className="card-title">Welcome to SMIS</h2>
              <p className="text-gray-600 mt-2">
                Your role ({user?.role}) dashboard is being prepared.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Sidebar />
      <main className="lg:pl-64 pt-16 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 max-w-full overflow-hidden">
          {renderDashboard()}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
