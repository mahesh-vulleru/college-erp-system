import React from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import {
  GraduationCap,
  LayoutDashboard,
  ShieldCheck,
  Building2,
  BookOpen,
  CalendarCheck,
  Award,
  CreditCard,
  Bell,
  BarChart3,
  FileText,
  Clock,
  Users,
  Globe,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '@college-erp/shared';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const role = user?.role;
  const location = useLocation();

  const getMyPortalPath = () => {
    switch (role) {
      case ROLES.SUPER_ADMIN: return '/admin';
      case ROLES.PRINCIPAL: return '/principal';
      case ROLES.HOD: return '/hod';
      case ROLES.FACULTY: return '/faculty';
      case ROLES.STUDENT: return '/student';
      case ROLES.ACCOUNTS: return '/accounts';
      default: return '/';
    }
  };

  // Navigation Items with role-based filtering
  const navSections = [
    {
      title: 'Institutional Portals',
      items: [
        { path: '/admin', label: 'Super Admin Portal', icon: ShieldCheck, roles: [ROLES.SUPER_ADMIN] },
        { path: '/principal', label: 'Principal & Exec', icon: Building2, roles: [ROLES.SUPER_ADMIN, ROLES.PRINCIPAL] },
        { path: '/hod', label: 'Department Head (HOD)', icon: Users, roles: [ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD] },
        { path: '/faculty', label: 'Faculty Workplace', icon: CalendarCheck, roles: [ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY] },
        { path: '/student', label: 'Student Self-Service', icon: GraduationCap, roles: [ROLES.SUPER_ADMIN, ROLES.STUDENT] },
        { path: '/accounts', label: 'Accounts & Finance', icon: CreditCard, roles: [ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.ACCOUNTS] },
        { path: '/overview', label: 'System Overview Hub', icon: LayoutDashboard, roles: [ROLES.SUPER_ADMIN, ROLES.PRINCIPAL] }
      ]
    },
    {
      title: 'Academic Modules',
      items: [
        { path: '/departments', label: 'Departments', icon: Building2, roles: ['*'] },
        { path: '/courses', label: 'Programs & Courses', icon: BookOpen, roles: ['*'] },
        { path: '/timetable', label: 'Class Timetable', icon: Clock, roles: ['*'] },
        { path: '/attendance', label: 'Daily Attendance', icon: CalendarCheck, roles: ['*'] },
        { path: '/examinations', label: 'Examinations', icon: Award, roles: ['*'] },
        { path: '/results', label: 'Results & Grades', icon: FileText, roles: ['*'] }
      ]
    },
    {
      title: 'Institutional Administration',
      items: [
        { path: '/fees', label: 'Fee Schedules & Dues', icon: CreditCard, roles: [ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.ACCOUNTS, ROLES.STUDENT] },
        { path: '/notices', label: 'Notice Board', icon: Bell, roles: ['*'] },
        { path: '/reports', label: 'Executive Reports', icon: BarChart3, roles: [ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.ACCOUNTS] },
        { path: '/audit-logs', label: 'Security & Audit Logs', icon: ShieldCheck, roles: [ROLES.SUPER_ADMIN, ROLES.PRINCIPAL] }
      ]
    }
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-navy-950/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-navy-950 text-navy-100 flex flex-col transition-transform duration-300 ease-in-out border-r border-navy-900 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 px-5 border-b border-navy-900 flex items-center justify-between">
          <Link to={getMyPortalPath()} onClick={onClose} className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-subtle">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-wider text-white block">COLLEGE ERP</span>
              <span className="text-[10px] text-teal-400 block tracking-widest uppercase font-semibold">Institutional v1</span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-navy-400 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          {navSections.map((section, sIdx) => {
            const filteredItems = section.items.filter(
              (item) => item.roles.includes('*') || (role && item.roles.includes(role))
            );

            if (filteredItems.length === 0) return null;

            return (
              <div key={sIdx} className="space-y-1">
                <span className="px-3 text-[10px] font-bold tracking-wider text-navy-400 uppercase block">
                  {section.title}
                </span>
                {filteredItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => {
                        if (window.innerWidth < 1024) onClose();
                      }}
                      className={`w-full flex items-center px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                        isActive
                          ? 'bg-teal-600 text-white shadow-subtle'
                          : 'text-navy-300 hover:bg-navy-900/80 hover:text-white'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mr-3 ${isActive ? 'text-white' : 'text-navy-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Public Website Shortcut & User Info Card at bottom */}
        <div className="p-3 border-t border-navy-900 bg-navy-950 space-y-2">
          <Link
            to="/"
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium text-navy-400 hover:text-teal-300 hover:bg-navy-900/60 transition-colors"
          >
            <span className="flex items-center">
              <Globe className="w-3.5 h-3.5 mr-2 text-teal-500" />
              <span>Public Campus Home</span>
            </span>
            <span className="text-[10px]">&rarr;</span>
          </Link>

          <div className="flex items-center space-x-3 p-2 rounded-xl bg-navy-900/60 border border-navy-800">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-xs uppercase">
              {user?.name ? user.name.charAt(0) : 'G'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name || 'Guest User'}</p>
              <p className="text-[10px] text-teal-400 font-medium uppercase tracking-wider truncate">
                {user?.role?.replace(/_/g, ' ') || 'Visitor Session'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
