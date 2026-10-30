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
  X,
  Compass,
  Layers,
  TrendingUp,
  UserCheck,
  Target
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '@college-erp/shared';
import { getRoleTheme } from '../../theme/roleThemes';

// Six Role-Specific Navigation Groups strictly matching application routes & architecture
const ROLE_NAV_CONFIGS = {
  // 1. Super Admin: Overview, User Management, Institution, Academics, Operations, Finance & Administration
  [ROLES.SUPER_ADMIN]: [
    {
      title: 'Overview',
      items: [
        { path: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard },
        { path: '/overview', label: 'System Overview Hub', icon: Compass }
      ]
    },
    {
      title: 'User Management',
      items: [
        { path: '/admin/users', label: 'User Directory', icon: Users },
        { path: '/audit-logs', label: 'Security & Audit Logs', icon: ShieldCheck }
      ]
    },
    {
      title: 'Institution',
      items: [
        { path: '/departments', label: 'Academic Departments', icon: Building2 },
        { path: '/faculty', label: 'Teaching Faculty', icon: UserCheck },
        { path: '/students', label: 'Student Registry', icon: GraduationCap }
      ]
    },
    {
      title: 'Academics',
      items: [
        { path: '/courses', label: 'Programs & Courses', icon: BookOpen },
        { path: '/subjects', label: 'Curriculum Subjects', icon: Layers },
        { path: '/timetable', label: 'Class Timetables', icon: Clock },
        { path: '/attendance', label: 'Daily Attendance', icon: CalendarCheck },
        { path: '/examinations', label: 'Examinations System', icon: FileText },
        { path: '/results', label: 'Results & Performance', icon: Award }
      ]
    },
    {
      title: 'Finance & Administration',
      items: [
        { path: '/fees', label: 'Fee Schedules & Dues', icon: CreditCard },
        { path: '/reports', label: 'Executive Reports', icon: BarChart3 },
        { path: '/notices', label: 'Notice Board', icon: Bell }
      ]
    }
  ],

  // 2. Principal: Institutional Management, Academic Administration, Academics & Governance
  [ROLES.PRINCIPAL]: [
    {
      title: 'Institutional Management',
      items: [
        { path: '/principal', label: 'Principal Dashboard', icon: LayoutDashboard },
        { path: '/principal/accreditation', label: 'Accreditation & Compliance', icon: ShieldCheck },
        { path: '/principal/goals', label: 'Institutional Goals & KPIs', icon: Target },
        { path: '/principal/events', label: 'Deadline & Event Tracker', icon: CalendarCheck },
        { path: '/overview', label: 'Institutional Health', icon: Compass }
      ]
    },
    {
      title: 'Academic Administration',
      items: [
        { path: '/departments', label: 'Academic Departments', icon: Building2 },
        { path: '/faculty', label: 'Teaching Faculty', icon: Users },
        { path: '/students', label: 'Student Cohorts', icon: GraduationCap },
        { path: '/courses', label: 'Programs & Courses', icon: BookOpen },
        { path: '/timetable', label: 'Class Timetables', icon: Clock },
        { path: '/attendance', label: 'Daily Attendance', icon: CalendarCheck }
      ]
    },
    {
      title: 'Academics & Governance',
      items: [
        { path: '/examinations', label: 'Examinations System', icon: FileText },
        { path: '/results', label: 'Results & Performance', icon: Award },
        { path: '/reports', label: 'Executive Reports', icon: BarChart3 },
        { path: '/audit-logs', label: 'Security & Audit Logs', icon: ShieldCheck },
        { path: '/notices', label: 'Notice Board', icon: Bell }
      ]
    }
  ],

  // 3. HOD: Department Overview, Faculty & Students, Courses, Operations, Examinations & Administration
  [ROLES.HOD]: [
    {
      title: 'Department Overview',
      items: [
        { path: '/hod', label: 'HOD Dashboard', icon: LayoutDashboard }
      ]
    },
    {
      title: 'Faculty & Students',
      items: [
        { path: '/faculty', label: 'Department Faculty', icon: Users },
        { path: '/students', label: 'Student Cohort', icon: GraduationCap }
      ]
    },
    {
      title: 'Courses & Curriculum',
      items: [
        { path: '/courses', label: 'Courses & Syllabus', icon: BookOpen }
      ]
    },
    {
      title: 'Timetable & Operations',
      items: [
        { path: '/timetable', label: 'Department Timetable', icon: Clock },
        { path: '/attendance', label: 'Attendance Register', icon: CalendarCheck }
      ]
    },
    {
      title: 'Examinations & Performance',
      items: [
        { path: '/examinations', label: 'Examinations Cell', icon: Award },
        { path: '/results', label: 'Results & Analysis', icon: FileText }
      ]
    },
    {
      title: 'Administration',
      items: [
        { path: '/reports', label: 'Department Reports', icon: BarChart3 },
        { path: '/notices', label: 'Notice Board', icon: Bell }
      ]
    }
  ],

  // 4. Faculty: Dashboard, Teaching & Schedule, Attendance & Students, Examinations & Grading, Communications
  [ROLES.FACULTY]: [
    {
      title: 'Dashboard',
      items: [
        { path: '/faculty', label: 'Faculty Dashboard', icon: LayoutDashboard }
      ]
    },
    {
      title: 'Teaching & Schedule',
      items: [
        { path: '/courses', label: 'Assigned Courses & Syllabus', icon: BookOpen },
        { path: '/timetable', label: 'Teaching Schedule', icon: Clock }
      ]
    },
    {
      title: 'Attendance & Students',
      items: [
        { path: '/attendance', label: 'Attendance Capture', icon: CalendarCheck },
        { path: '/students', label: 'Student Directory', icon: Users }
      ]
    },
    {
      title: 'Examinations & Grading',
      items: [
        { path: '/examinations', label: 'Exam Schedules & Cell', icon: Award },
        { path: '/results', label: 'Evaluation & Marks Entry', icon: FileText }
      ]
    },
    {
      title: 'Communications',
      items: [
        { path: '/notices', label: 'Notice Board', icon: Bell }
      ]
    }
  ],

  // 5. Student: Dashboard, Academics & Schedule, Attendance & Performance, Finance & Notices
  [ROLES.STUDENT]: [
    {
      title: 'Dashboard',
      items: [
        { path: '/student', label: 'Student Dashboard', icon: LayoutDashboard }
      ]
    },
    {
      title: 'Academics & Schedule',
      items: [
        { path: '/courses', label: 'Enrolled Courses & Syllabus', icon: BookOpen },
        { path: '/timetable', label: 'Semester Timetable', icon: Clock }
      ]
    },
    {
      title: 'Attendance & Performance',
      items: [
        { path: '/attendance', label: 'Attendance Register', icon: CalendarCheck },
        { path: '/examinations', label: 'Exam Schedules', icon: Award },
        { path: '/results', label: 'Published Results & Grades', icon: FileText }
      ]
    },
    {
      title: 'Finance & Notices',
      items: [
        { path: '/fees', label: 'Fee Dues & Receipts', icon: CreditCard },
        { path: '/notices', label: 'Campus Circulars', icon: Bell }
      ]
    }
  ],

  // 6. Accounts: Finance Overview, Fee Management, Reports & Notices
  [ROLES.ACCOUNTS]: [
    {
      title: 'Finance Overview',
      items: [
        { path: '/accounts', label: 'Accounts Dashboard', icon: LayoutDashboard }
      ]
    },
    {
      title: 'Fee Management',
      items: [
        { path: '/fees?tab=structures', label: 'Fee Plans & Schedules', icon: Layers },
        { path: '/fees?tab=invoices', label: 'Billing Invoices', icon: FileText },
        { path: '/fees?tab=payments', label: 'Payment Transactions', icon: CreditCard },
        { path: '/fees?status=unpaid', label: 'Outstanding Dues Ledgers', icon: TrendingUp }
      ]
    },
    {
      title: 'Reports & Notices',
      items: [
        { path: '/reports', label: 'Financial Reports', icon: BarChart3 },
        { path: '/notices', label: 'Notice Board', icon: Bell }
      ]
    }
  ]
};

export const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const rawRole = user?.role;
  const normalizedRole = (rawRole || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
  const role = (normalizedRole === 'admin' || normalizedRole === 'superadmin' || normalizedRole === 'super_administrator')
    ? ROLES.SUPER_ADMIN
    : rawRole;
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
    const parts = name.replace(/^(Dr.|Prof.|Mr.|Ms.|Mrs.)\s+/i, '').trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // Select navigation groups for current role
  const navSections = (role && ROLE_NAV_CONFIGS[role]) || [
    {
      title: 'Navigation',
      items: [
        { path: getMyPortalPath(), label: 'Dashboard', icon: LayoutDashboard }
      ]
    }
  ];

  // Precision active state matching supporting full pages, query params & tab anchors
  const isItemActive = (itemPath) => {
    const currentFull = `${location.pathname}${location.search}`;
    if (itemPath === currentFull) return true;

    if (itemPath.includes('?')) {
      const [itemBase, itemQueryStr] = itemPath.split('?');
      if (location.pathname !== itemBase) return false;
      const itemParams = new URLSearchParams(itemQueryStr);
      const currentParams = new URLSearchParams(location.search);
      const itemTab = itemParams.get('tab');
      const currentTab = currentParams.get('tab');
      const itemStatus = itemParams.get('status');
      const currentStatus = currentParams.get('status');

      if (itemTab && currentTab && itemTab === currentTab) return true;
      if (itemStatus && currentStatus && itemStatus === currentStatus) return true;
      return false;
    }

    // If current location has query params, do not match parent dashboard path
    if (location.search && (itemPath === '/student' || itemPath === '/faculty' || itemPath === '/hod' || itemPath === '/accounts' || itemPath === '/fees')) {
      return false;
    }
    return location.pathname === itemPath;
  };

  return (
    <>
      {/* Mobile backdrop with click-to-dismiss */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container with role-specific theme & responsive drawer transform */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 ${theme.sidebarBg} ${theme.sidebarBorder} flex flex-col transition-transform duration-300 ease-in-out border-r ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:static lg:translate-x-0 shadow-xl`}
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

        {/* Role-specific Navigation List */}
        <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              <span className="px-3 text-[10px] font-bold tracking-wider text-white/40 uppercase block mb-1">
                {section.title}
              </span>
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(item.path);

                return (
                  <NavLink
                    key={`${item.path}-${item.label}`}
                    to={item.path}
                    onClick={() => {
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={`w-full flex items-center px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                      active
                        ? theme.sidebarActive
                        : `${theme.sidebarText} ${theme.sidebarHover}`
                    }`}
                  >
                    <Icon className={`w-4 h-4 mr-3 ${active ? 'text-white' : 'text-white/60'}`} />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
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
