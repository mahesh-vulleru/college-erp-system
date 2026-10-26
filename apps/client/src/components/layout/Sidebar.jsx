import React from 'react';
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  BookOpen,
  CalendarCheck,
  Award,
  CreditCard,
  Settings,
  ShieldAlert,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ isOpen, onClose, currentTab, onSelectTab }) => {
  const { user } = useAuth();
  const role = user?.role;

  // Role-aware navigation items
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['*'] },
    { id: 'users', label: 'User Directory', icon: Users, roles: ['super_admin', 'principal', 'hod', 'accounts'] },
    { id: 'academics', label: 'Academics & Courses', icon: BookOpen, roles: ['super_admin', 'principal', 'hod', 'faculty'] },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck, roles: ['*'] },
    { id: 'marks', label: 'Examinations & Marks', icon: Award, roles: ['*'] },
    { id: 'fees', label: 'Fee Payments', icon: CreditCard, roles: ['super_admin', 'principal', 'accounts', 'student'] },
    { id: 'admin', label: 'System Administration', icon: ShieldAlert, roles: ['super_admin'] },
    { id: 'settings', label: 'Profile Settings', icon: Settings, roles: ['*'] }
  ];

  const visibleItems = navItems.filter(
    (item) => item.roles.includes('*') || (role && item.roles.includes(role))
  );

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-100 flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-wide text-white block">COLLEGE ERP</span>
              <span className="text-[10px] text-slate-400 block tracking-wider uppercase">Portal Foundation</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`w-full flex items-center px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 mr-3 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Role Card at bottom */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs uppercase">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{user?.name || 'Guest User'}</p>
              <p className="text-[10px] text-blue-400 font-semibold tracking-wider uppercase truncate">
                {user?.role?.replace('_', ' ') || 'Visitor'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
