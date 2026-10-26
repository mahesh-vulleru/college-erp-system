import React from 'react';
import { Menu, LogOut, Shield, Wifi } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Topbar = ({ onToggleSidebar, onNavigateLogin }) => {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left: Mobile hamburger & breadcrumb/title */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 lg:hidden focus:outline-none"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-sm sm:text-base font-bold text-gray-800 leading-tight">
            Academic Management System
          </h2>
          <span className="text-[10px] text-gray-500 font-medium">Single Engineering College Edition (&lt;1,000 Students)</span>
        </div>
      </div>

      {/* Right: User status & actions */}
      <div className="flex items-center space-x-3">
        {/* System online badge */}
        <div className="hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>API Connected</span>
        </div>

        {isAuthenticated ? (
          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-semibold text-gray-900 block leading-none">{user?.name}</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block mt-0.5">{user?.email}</span>
            </div>
            <button
              onClick={logout}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors border border-red-200"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        ) : (
          <button
            onClick={onNavigateLogin}
            className="inline-flex items-center space-x-1 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Topbar;
