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
  X,
  Compass
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '@college-erp/shared';
import { getRoleTheme } from '../../theme/roleThemes';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const role = user?.role;
  const location = useLocation();

  const theme = getRoleTheme(role, location.pathname);

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

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.replace(/^(Dr\.|Prof\.|Mr\.|Ms\.|Mrs\.)\s+/i, '').trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // Navigation Items with role-based filtering
  const navSections = [
    {
      title: 'Institutional Portals',
      items: [
        { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, roles: [ROLES.SUPER_ADMIN] },
        { path: '/principal', label: 'Dashboard', icon: LayoutDashboard, roles: [ROLES.PRINCIPAL] },
        { path: '/hod', label: 'Dashboard', icon: LayoutDashboard, roles: [ROLES.HOD] },
        { path: '/faculty', label: 'Dashboard', icon: LayoutDashboard, roles: [ROLES.FACULTY] },
        { path: '/student', label: 'Dashboard', icon: LayoutDashboard, roles: [ROLES.STUDENT] },
        { path: '/accounts', label: 'Dashboard', icon: LayoutDashboard, roles: [ROLES.ACCOUNTS] },

        // Management links for oversight roles
        { path: '/principal', label: 'Principal & Exec', icon: Building2, roles: [ROLES.SUPER_ADMIN] },
        { path: '/hod', label: 'Department Head (HOD)', icon: Users, roles: [ROLES.SUPER_ADMIN, ROLES.PRINCIPAL] },
        { path: '/faculty', label: 'Faculty Workplace', icon: CalendarCheck, roles: [ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD] },
        { path: '/student', label: 'Student Self-Service', icon: GraduationCap, roles: [ROLES.SUPER_ADMIN] },
        { path: '/accounts', label: 'Accounts & Finance', icon: CreditCard, roles: [ROLES.SUPER_ADMIN, ROLES.PRINCIPAL] },
        { path: '/overview', label: 'System Overview Hub', icon: Compass, roles: [ROLES.SUPER_ADMIN, ROLES.PRINCIPAL] }
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
      title: 'Administration',
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
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar container with role-specific theme */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 ${theme.sidebarBg} ${theme.sidebarBorder} flex flex-col transition-all duration-300 ease-in-out border-r lg:static lg:translate-x-0 shadow-xl`}
      >
        {/* Brand header */}
        <div className={`h-16 px-5 border-b ${theme.sidebarBorder} flex items-center justify-between`}>
          <Link to={getMyPortalPath()} onClick={onClose} className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white backdrop-blur-xs border border-white/15">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-wide text-white block">COLLEGE ERP</span>
              <span className="text-[10px] text-white/50 block tracking-wider uppercase font-medium">Apex Engineering</span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/60 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {navSections.map((section, sIdx) => {
            const filteredItems = section.items.filter(
              (item) => item.roles.includes('*') || (role && item.roles.includes(role))
            );

            if (filteredItems.length === 0) return null;

            return (
              <div key={sIdx} className="space-y-1">
                <span className="px-3 text-[10px] font-bold tracking-wider text-white/40 uppercase block mb-1">
                  {section.title}
                </span>
                {filteredItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  return (
                    <NavLink
                      key={`${item.path}-${item.label}`}
                      to={item.path}
                      onClick={() => {
                        if (window.innerWidth < 1024) onClose();
                      }}
                      className={`w-full flex items-center px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                        isActive
                          ? theme.sidebarActive
                          : `${theme.sidebarText} ${theme.sidebarHover}`
                      }`}
                    >
                      <Icon className={`w-4 h-4 mr-3 ${isActive ? 'text-white' : 'text-white/60'}`} />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* User Info Card at bottom with initials avatar */}
        <div className={`p-3 border-t ${theme.sidebarBorder} bg-black/20 space-y-2`}>
          <div className="flex items-center space-x-3 p-2 rounded-xl bg-white/5 border border-white/10">
            <div className={`w-8 h-8 rounded-full ${theme.avatarBg} flex items-center justify-center font-bold text-xs uppercase shadow-sm`}>
              {getInitials(user?.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.name || 'Authorized User'}</p>
              <p className="text-[10px] text-white/60 font-medium uppercase tracking-wider truncate">
                {user?.role?.replace(/_/g, ' ') || 'Role Session'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
