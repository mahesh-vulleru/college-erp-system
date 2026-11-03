import React, { useState, useEffect } from 'react';
import { Menu, Search, Bell, Calendar, HelpCircle, User, LogOut, ExternalLink } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';
import RoleSwitcherDropdown from './RoleSwitcherDropdown';
import api from '../../api/apiClient';
import { ROLE_LABELS } from '@college-erp/shared';

export const Topbar = ({ onToggleSidebar }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchVal, setSearchVal] = useState('');
  const [unreadNoticesCount, setUnreadNoticesCount] = useState(2);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchNoticesCount() {
      try {
        const res = await api.getNotices();
        if (isMounted && res?.data) {
          setUnreadNoticesCount(res.data.length || 2);
        }
      } catch {
        // Fallback default
      }
    }
    if (isAuthenticated) {
      fetchNoticesCount();
    }
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchVal.trim()) return;
    const term = searchVal.trim();
    navigate(`/courses?q=${encodeURIComponent(term)}`);
  };

  const displayName = user?.name || user?.fullName || (user?.email ? user.email.split('@')[0] : 'Institutional User');
  const roleDisplay = user?.role ? (ROLE_LABELS[user.role] || user.role.replace(/_/g, ' ')) : 'User';

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left: Mobile hamburger & Role Switcher */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden focus:outline-none transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Institutional Role Switcher Pill Dropdown */}
        <RoleSwitcherDropdown />
      </div>

      {/* Center: Search Bar with Ctrl + K */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search students, faculty, courses, reports..."
            className="w-full bg-[#f8faf9] border border-slate-200 rounded-xl pl-10 pr-16 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-2xs"
          />
          <div className="absolute right-2.5 top-2 pointer-events-none">
            <span className="text-[10px] font-semibold text-slate-400 bg-white border border-slate-200/90 rounded px-1.5 py-0.5 shadow-2xs">
              Ctrl + K
            </span>
          </div>
        </form>
      </div>

      {/* Right: Notification, Calendar, Help, Profile */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Universal Notifications Dropdown */}
        <NotificationDropdown />

        {/* Calendar / Events quick link */}
        <Link
          to="/calendar"
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-emerald-700 transition-colors hidden sm:inline-flex"
          title="Institutional Calendar & Events"
        >
          <Calendar className="w-4 h-4" />
        </Link>

        {/* Timetable / Calendar quick button */}
        <Link
          to="/timetable"
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-emerald-700 transition-colors hidden sm:inline-flex"
          title="Institutional Academic Calendar"
        >
          <Calendar className="w-4 h-4" />
        </Link>

        {/* Help Circle */}
        <button
          type="button"
          onClick={() => setIsHelpOpen((prev) => !prev)}
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-emerald-700 transition-colors hidden sm:inline-flex"
          title="Support & Guide"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Profile Avatar & Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsProfileOpen((prev) => !prev)}
            className="flex items-center space-x-2.5 p-1 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-700 to-teal-500 text-white font-bold text-xs flex items-center justify-center shadow-xs ring-2 ring-white">
              {displayName.charAt(0)}
            </div>
            <div className="text-left hidden sm:block">
              <span className="text-xs font-bold text-slate-800 block leading-tight">
                {displayName} ▾
              </span>
              <span className="text-[10px] text-slate-500 capitalize block leading-none">
                {roleDisplay}
              </span>
            </div>
          </button>

          {/* Profile Popover Menu */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-xl border border-slate-200/90 py-2 z-50 animate-fade-in">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-800 truncate">{displayName}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email || 'admin@college.edu'}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 capitalize">
                  {roleDisplay}
                </span>
              </div>
              <div className="p-1 space-y-0.5">
                <Link
                  to="/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-slate-400" /> Account Settings
                </Link>
                <Link
                  to="/"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" /> Public Portal
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                    navigate('/login');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-left font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Help Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fade-in">
          <div className="erp-modal-panel rounded-3xl max-w-md w-full p-6 shadow-2xl border border-pink-200" style={{ backgroundColor: "#FFF1F5" }}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-600" /> College ERP Help & Support
              </h3>
              <button
                onClick={() => setIsHelpOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>
            <div className="py-4 space-y-3 text-xs text-slate-600">
              <p>Welcome to <strong>College ERP v1.0.0</strong> — Apex Engineering College central management platform.</p>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <p><strong>Campus Tech Desk:</strong> support@college.edu</p>
                <p><strong>Emergency Admin Hotline:</strong> +91 (800) 234-5678</p>
                <p><strong>Operating Hours:</strong> Mon - Sat (8:00 AM - 6:00 PM IST)</p>
              </div>
              <p className="text-slate-500">Press <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] border border-slate-200">Ctrl + K</kbd> to search courses, faculty or students anytime.</p>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsHelpOpen(false)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors"
              >
                Close Support
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Topbar;
