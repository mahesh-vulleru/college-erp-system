import React, { useState, useRef, useEffect } from 'react';
import { LogOut, User, Shield, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Badge from '../common/Badge';

export const ProfileMenu = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-navy-50 text-left transition-colors focus:outline-none"
      >
        <div className="w-8 h-8 rounded-lg bg-navy-900 text-teal-300 flex items-center justify-center font-bold text-xs uppercase shadow-subtle">
          {user.name ? user.name.charAt(0) : 'U'}
        </div>
        <div className="hidden sm:block">
          <p className="text-xs font-semibold text-navy-900 leading-tight">{user.name}</p>
          <p className="text-[10px] text-teal-700 font-medium capitalize">
            {user.role?.replace(/_/g, ' ')}
          </p>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-navy-400 hidden sm:block" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white shadow-elevation border border-navy-100 py-2 z-50 animate-in fade-in zoom-in-95">
          <div className="px-4 py-3 border-b border-navy-100">
            <p className="text-xs font-bold text-navy-900">{user.name}</p>
            <p className="text-[11px] text-navy-500 truncate">{user.email}</p>
            <div className="mt-2 flex items-center space-x-1.5">
              <Badge variant="teal" size="xs">
                {user.role?.replace(/_/g, ' ')}
              </Badge>
              {user.department && (
                <span className="text-[10px] text-navy-400 truncate">
                  {user.department}
                </span>
              )}
            </div>
          </div>

          <div className="py-1">
            <div className="px-4 py-2 text-[11px] text-navy-500 flex items-center space-x-2">
              <Shield className="w-3.5 h-3.5 text-teal-600" />
              <span>Status: <strong className="text-emerald-700 capitalize">{user.status || 'Active'}</strong></span>
            </div>
          </div>

          <div className="border-t border-navy-100 pt-1">
            <button
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full flex items-center px-4 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              <span>Sign Out of Portal</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;

