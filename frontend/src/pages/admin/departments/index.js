import React from 'react';
import { useAuth } from '../../../hooks/useAuth';
import Header from '../../../components/common/Header';
import Sidebar from '../../../components/common/Sidebar';
import DepartmentManagement from '../../../components/admin/departments/DepartmentManagement';

const DepartmentsPage = () => {
  const { user, isAuthenticated } = useAuth();

  // Redirect if not authenticated or not admin
  React.useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      window.location.href = '/login';
    }
  }, [isAuthenticated, user]);

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1">
          <DepartmentManagement />
        </main>
      </div>
    </div>
  );
};

export default DepartmentsPage;
