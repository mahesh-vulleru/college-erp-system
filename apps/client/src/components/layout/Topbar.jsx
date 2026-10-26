import React, { useState, useEffect } from 'react';
import { Menu, Shield, Bell, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ProfileMenu from './ProfileMenu';
import Button from '../common/Button';
import api from '../../api/apiClient';

export const Topbar = ({ onToggleSidebar }) => {
  const { isAuthenticated } = useAuth();
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

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-navy-100 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-subtle">
      {/* Left: Mobile hamburger & breadcrumb/title */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-navy-500 hover:text-navy-900 hover:bg-navy-50 lg:hidden focus:outline-none transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <Link to="/" className="flex items-center space-x-2">
            <h2 className="text-sm sm:text-base font-bold text-navy-950 tracking-tight">
              Apex Engineering College
            </h2>
            <span className="hidden md:inline-block text-[10px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
              ERP Foundation
            </span>
          </Link>
          <span className="text-[10px] text-navy-400 font-normal hidden sm:block">
            Institutional Management System &bull; &lt;1,000 Students
          </span>
        </div>
      </div>

      {/* Right: User status & actions */}
      <div className="flex items-center space-x-3">
        {/* System online badge */}
        <div className={`hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
          apiOnline
            ? 'bg-teal-50 text-teal-800 border-teal-200'
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <span className={`w-2 h-2 rounded-full ${apiOnline ? 'bg-teal-500 animate-pulse' : 'bg-rose-500'}`} />
          <span className="text-[11px] font-semibold">{apiOnline ? 'API Connected' : 'API Offline'}</span>
        </div>

        {/* Notices notification icon */}
        <Link
          to="/notices"
          className="p-2 rounded-xl text-navy-500 hover:bg-navy-50 hover:text-navy-900 transition-colors relative"
          title="Circulars & Notices"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-500" />
        </Link>

        {isAuthenticated ? (
          <ProfileMenu />
        ) : (
          <Button
            variant="primary"
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
