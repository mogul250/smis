import React from 'react';
import { useAuth } from '../../hooks/useAuth';

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-primary-blue text-white shadow-lg">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">SMIS</h1>
          <span className="text-sm opacity-75">
            School Management Information System
          </span>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-sm">
            <span className="opacity-75">Welcome, </span>
            <span className="font-medium">{user?.first_name} {user?.last_name}</span>
            <span className="ml-2 px-2 py-1 bg-primary-light rounded text-xs">
              {user?.role?.toUpperCase()}
            </span>
          </div>
          
          <button
            onClick={logout}
            className="px-3 py-1 bg-accent-red hover:bg-red-600 rounded text-sm transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
