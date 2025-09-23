import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';

const AdminTestPage = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Test Page</h1>
          <p className="text-gray-600">
            This is a simple test page to verify that the admin navigation with icons is working correctly.
          </p>
          <div className="mt-6 p-4 bg-green-100 border border-green-400 rounded-lg">
            <h2 className="text-lg font-semibold text-green-800">Success!</h2>
            <p className="text-green-700">
              If you can see this page and the navigation sidebar with icons, then the AdminNavigation component is working correctly.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminTestPage;
