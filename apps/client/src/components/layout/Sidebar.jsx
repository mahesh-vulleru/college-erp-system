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

  const userRole = (role || '').toLowerCase().trim().replace(/[\s-]+/g, '_');

  const getMyPortalPath = () => {
    switch (userRole) {
      case 'super_admin':
      case 'superadmin':
        return '/admin';
      case 'principal':
        return '/principal';
      case 'hod':
        return '/hod';
      case 'faculty':
        return '/faculty';
      case 'student':
        return '/student';
      case 'accounts':
        return '/accounts';
      default:
        return '/';
    }
  };

  // Navigation Items with role-based filtering
  const navSections = [
    {
      title: 'Institutional Portals',
      items: [
        { path: '/admin', label: 'Super Admin Portal', icon: ShieldCheck, roles: [ROLES.SUPER_ADMIN] },
        { path: '/principal', label: 'Principal & Exec', icon: Building2, roles: [ROLES.PRINCIPAL] },
        { path: '/hod', label: 'Department Head (HOD)', icon: Users, roles: [ROLES.HOD] },
        { path: '/faculty', label: 'Faculty Workplace', icon: CalendarCheck, roles: [ROLES.FACULTY] },
        { path: '/student', label: 'Student Self-Service', icon: GraduationCap, roles: [ROLES.STUDENT] },
        { path: '/accounts', label: 'Accounts & Finance', icon: CreditCard, roles: [ROLES.ACCOUNTS] },
        { path: '/overview', label: 'System Overview Hub', icon: LayoutDashboard, roles: [ROLES.SUPER_ADMIN, ROLES.PRINCIPAL] }
      ]
    },
    {
      title: 'Academic Modules',
      items: [
        { path: '/departments', label: 'Departments', icon: Building2, roles: [ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD] },
        { path: '/courses', label: 'Programs & Courses', icon: BookOpen, roles: [ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD] },
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
          className="fixed inset-0 z-40 bg-navy-950/70 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-navy-950 text-white flex flex-col transition-transform duration-300 ease-in-out border-r border-navy-900 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 px-5 border-b border-navy-900 flex items-center justify-between">
          <Link to={getMyPortalPath()} onClick={onClose} className="flex items-center space-x-3 group">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-subtle group-hover:bg-teal-500 transition-colors">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-wider text-white block">COLLEGE ERP</span>
              <span className="text-[10px] text-teal-400 block tracking-widest uppercase font-semibold">Institutional v1</span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-navy-400 hover:text-white lg:hidden transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          {navSections.map((section, sIdx) => {
            const filteredItems = section.items.filter((item) => {
              if (item.roles.includes('*')) return true;
              return item.roles.some((r) => (r || '').toLowerCase().trim().replace(/[\s-]+/g, '_') === userRole);
            });

            if (filteredItems.length === 0) return null;

            return (
              <div key={sIdx} className="space-y-1">
                <span className="px-3 text-[10px] font-bold tracking-wider text-navy-400 uppercase block mb-1">
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
                      className={`group w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                        isActive
                          ? 'bg-teal-600 text-white shadow-subtle'
                          : 'text-navy-200 hover:bg-navy-900 hover:text-white'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mr-3 flex-shrink-0 transition-colors ${
                        isActive ? 'text-white' : 'text-navy-400 group-hover:text-white'
                      }`} />
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
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-navy-300 hover:text-white hover:bg-navy-900 transition-colors"
          >
            <span className="flex items-center">
              <Globe className="w-3.5 h-3.5 mr-2 text-teal-400" />
              <span>Public Campus Home</span>
            </span>
            <span className="text-[10px] text-navy-400">&rarr;</span>
          </Link>

          <div className="flex items-center space-x-3 p-2.5 rounded-xl bg-navy-900/80 border border-navy-800">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-xs uppercase border border-teal-500/30">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name || 'Institutional User'}</p>
              <p className="text-[10px] text-teal-400 font-medium uppercase tracking-wider truncate">
                {user?.role?.replace(/_/g, ' ') || 'Authorized Session'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
