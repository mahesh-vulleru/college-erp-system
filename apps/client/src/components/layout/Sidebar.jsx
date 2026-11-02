import React from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import {
  GraduationCap,
  LayoutDashboard,
  Building2,
  BookOpen,
  CalendarCheck,
  CreditCard,
  Bell,
  BarChart3,
  FileEdit,
  Clock,
  Users,
  X,
  Layers,
  UserCheck,
  Bus,
  BedDouble,
  Briefcase,
  Headphones,
  Settings,
  MessageSquare,
  BookMarked
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();

  // Determine role dashboard root path
  const getRoleDashboardPath = () => {
    const role = (user?.role || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
    switch (role) {
      case 'super_admin':
      case 'admin':
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
      case 'accountant':
      case 'finance':
        return '/accounts';
      case 'library_staff':
      case 'librarystaff':
        return '/library-staff';
      case 'librarian':
        return '/library';
      default:
        return '/principal';
    }
  };

  const dashboardPath = getRoleDashboardPath();

  // Navigation Items exactly matching the Reference Design (Image 2)
  const navItems = [
    { path: dashboardPath, label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/departments', label: 'Institution', icon: Building2 },
    { path: '/courses', label: 'Academics', icon: GraduationCap },
    { path: '/students', label: 'Students', icon: Users },
    { path: '/faculty', label: 'Faculty', icon: UserCheck },
    { path: '/examinations', label: 'Examinations', icon: FileEdit },
    { path: '/attendance', label: 'Attendance', icon: CalendarCheck },
    { path: '/timetable', label: 'Timetable', icon: Clock },
    { path: '/subjects', label: 'Curriculum', icon: Layers },
    { path: '/fees', label: 'Fee & Accounts', icon: CreditCard },
    { path: '/library', label: 'Library', icon: BookMarked },
    { path: '/transport', label: 'Transport', icon: Bus },
    { path: '/hostel', label: 'Hostel', icon: BedDouble },
    { path: '/placements', label: 'Placements', icon: Briefcase },
    { path: '/notices', label: 'Communications', icon: MessageSquare },
    { path: '/reports', label: 'Reports & Analytics', icon: BarChart3 },
    { path: '/settings', label: 'Settings', icon: Settings }
  ];

  const isItemActive = (item) => {
    if (item.exact) {
      return location.pathname === item.path ||
        (location.pathname === '/admin' && item.path === '/admin') ||
        (location.pathname === '/principal' && item.path === '/principal') ||
        (location.pathname === '/hod' && item.path === '/hod') ||
        (location.pathname === '/faculty' && item.path === '/faculty') ||
        (location.pathname === '/student' && item.path === '/student') ||
        (location.pathname === '/accounts' && item.path === '/accounts') ||
        (location.pathname === '/library' && item.path === '/library') ||
        (location.pathname === '/library-staff' && item.path === '/library-staff');
    }
    return location.pathname.startsWith(item.path);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Dark Forest-Green Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#062a1e] border-r border-[#041d15] flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:static lg:translate-x-0 shadow-2xl text-white`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-white/10 flex items-center justify-between">
          <Link
            to={dashboardPath}
            onClick={onClose}
            className="flex items-center space-x-3 group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white block leading-tight">
                College ERP
              </span>
              <span className="text-[10px] text-emerald-300/70 font-medium tracking-wide block">
                College Management System
              </span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-300/60 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 px-3 py-4 overflow-y-auto space-y-4">
          <div>
            <span className="px-3 text-[10px] font-bold tracking-wider text-emerald-300/50 uppercase block mb-2">
              Quick Access
            </span>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(item);

                return (
                  <NavLink
                    key={item.label}
                    to={item.path}
                    onClick={() => {
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={`w-full flex items-center px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                      active
                        ? 'bg-[#a7f3d0] text-[#064e3b] shadow-xs font-bold'
                        : 'text-emerald-100/75 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 mr-3 shrink-0 ${
                        active ? 'text-[#064e3b]' : 'text-emerald-300/70'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Footer info: Help & Support + Version pill */}
        <div className="p-3 border-t border-white/10 bg-[#041f16] flex items-center justify-between text-xs text-emerald-200/70">
          <Link
            to="/settings"
            onClick={onClose}
            className="flex items-center gap-2 hover:text-white transition-colors"
          >
            <Headphones className="w-4 h-4 text-emerald-400" />
            <span className="font-medium text-[11px]">Help & Support</span>
          </Link>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800/60">
            v1.0.0
          </span>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
