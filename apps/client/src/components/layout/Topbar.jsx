import React, { useState, useEffect } from 'react';
import { Menu, Shield, Bell, Globe } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ProfileMenu from './ProfileMenu';
import Button from '../common/Button';
import api from '../../api/apiClient';

export const Topbar = ({ onToggleSidebar }) => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [apiOnline, setApiOnline] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function checkPing() {
      try {
        await api.checkHealth();
        if (isMounted) setApiOnline(true);
      } catch {
        if (isMounted) setApiOnline(false);
      }
    }
    checkPing();
    const interval = setInterval(checkPing, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const getDashboardPath = () => {
    switch (user?.role) {
      case 'super_admin': return '/admin';
      case 'principal': return '/principal';
      case 'hod': return '/hod';
      case 'faculty': return '/faculty';
      case 'student': return '/student';
      case 'accounts': return '/accounts';
      default: return '/dashboard';
    }
  };

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-navy-100/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-subtle">
      {/* Left: Mobile hamburger & breadcrumb/title */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-navy-500 hover:text-navy-900 hover:bg-navy-50 lg:hidden focus:outline-none transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <Link to={isAuthenticated ? getDashboardPath() : '/'} className="flex items-center space-x-2">
            <h2 className="text-sm sm:text-base font-extrabold text-navy-950 tracking-tight">
              Apex Engineering College
            </h2>
            <span className="hidden md:inline-flex items-center text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200 uppercase tracking-wider">
              ERP Portal
            </span>
          </Link>
          <span className="text-[10px] text-navy-400 font-medium hidden sm:block">
            Institutional Management System &bull; Single-College Portal
          </span>
        </div>
      </div>

      {/* Right: User status & actions */}
      <div className="flex items-center space-x-2.5 sm:space-x-3">
        {/* Link to public website */}
        <Link
          to="/"
          className="hidden md:inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-navy-600 hover:bg-navy-50 hover:text-navy-900 transition-colors border border-transparent hover:border-navy-100"
          title="Visit Public Campus Website"
        >
          <Globe className="w-3.5 h-3.5 text-teal-600" />
          <span>Public Home</span>
        </Link>

        {/* System online status pill */}
        <div className={`hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
          apiOnline
            ? 'bg-teal-50/80 text-teal-800 border-teal-200'
            : 'bg-rose-50/80 text-rose-800 border-rose-200'
        }`}>
          <span className={`w-2 h-2 rounded-full ${apiOnline ? 'bg-teal-500 animate-pulse' : 'bg-rose-500'}`} />
          <span className="text-[11px]">{apiOnline ? 'API Connected' : 'API Offline'}</span>
        </div>

        {/* Notices notification bell */}
        <Link
          to="/notices"
          className="p-2 rounded-xl text-navy-500 hover:bg-navy-50 hover:text-navy-900 transition-colors relative border border-transparent hover:border-navy-100"
          title="Circulars & Notice Board"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-500 ring-2 ring-white" />
        </Link>

        {isAuthenticated ? (
          <ProfileMenu />
        ) : (
          <Button
            variant="teal"
            size="sm"
            onClick={() => navigate('/login')}
            icon={Shield}
          >
            Institutional Sign In
          </Button>
        )}
      </div>
    </header>
  );
};

export default Topbar;
