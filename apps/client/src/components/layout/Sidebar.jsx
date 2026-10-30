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
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '@college-erp/shared';
import { getRoleTheme } from '../../theme/roleThemes';

// Six Role-Specific Navigation Groups strictly matching application routes & architecture
const ROLE_NAV_CONFIGS = {
  // 1. Super Admin: Overview, Institution, Academics, Operations, Finance, Reports, Security
  [ROLES.SUPER_ADMIN]: [
    {
      title: 'Overview',
      items: [
        { path: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard },
        { path: '/overview', label: 'System Overview Hub', icon: Compass }
      ]
    },
    {
      title: 'Institution',
      items: [
        { path: '/departments', label: 'Departments', icon: Building2 }
      ]
    },
    {
      title: 'Academics',
      items: [
        { path: '/courses', label: 'Programs & Courses', icon: BookOpen },
        { path: '/subjects', label: 'Curriculum Subjects', icon: Layers }
      ]
    },
    {
      title: 'Operations',
      items: [
        { path: '/timetable', label: 'Class Timetables', icon: Clock },
        { path: '/attendance', label: 'Daily Attendance', icon: CalendarCheck }
      ]
    },
    {
      title: 'Finance',
      items: [
        { path: '/fees', label: 'Fee Schedules & Dues', icon: CreditCard }
      ]
    },
    {
      title: 'Reports',
      items: [
        { path: '/reports', label: 'Executive Reports', icon: BarChart3 }
      ]
    },
    {
      title: 'Security',
      items: [
        { path: '/audit-logs', label: 'Security & Audit Logs', icon: ShieldCheck }
      ]
    }
  ],

  // 2. Principal: Executive Overview, Departments, Academic Performance, Examinations, Reports, Notices
  [ROLES.PRINCIPAL]: [
    {
      title: 'Executive Overview',
      items: [
        { path: '/principal', label: 'Principal Dashboard', icon: LayoutDashboard },
        { path: '/overview', label: 'Institutional Health', icon: Compass }
      ]
    },
    {
      title: 'Departments',
      items: [
        { path: '/departments', label: 'Academic Departments', icon: Building2 }
      ]
    },
    {
      title: 'Academic Performance',
      items: [
        { path: '/results', label: 'Results & Performance', icon: Award }
      ]
    },
    {
      title: 'Examinations',
      items: [
        { path: '/examinations', label: 'Examinations System', icon: FileText }
      ]
    },
    {
      title: 'Reports',
      items: [
        { path: '/reports', label: 'Executive Reports', icon: BarChart3 }
      ]
    },
    {
      title: 'Notices',
      items: [
        { path: '/notices', label: 'Notice Board', icon: Bell }
      ]
    }
  ],

  // 3. HOD: Department Overview, Faculty, Courses & Subjects, Timetable, Attendance, Examinations, Results
  [ROLES.HOD]: [
    {
      title: 'Department Overview',
      items: [
        { path: '/hod', label: 'HOD Dashboard', icon: LayoutDashboard }
      ]
    },
    {
      title: 'Faculty',
      items: [
        { path: '/hod?tab=faculty', label: 'Department Faculty', icon: Users }
      ]
    },
    {
      title: 'Courses & Subjects',
      items: [
        { path: '/hod?tab=syllabus', label: 'Courses & Syllabus', icon: BookOpen }
      ]
    },
    {
      title: 'Timetable',
      items: [
        { path: '/hod?tab=timetable', label: 'Department Timetable', icon: Clock }
      ]
    },
    {
      title: 'Attendance',
      items: [
        { path: '/attendance', label: 'Attendance Register', icon: CalendarCheck }
      ]
    },
    {
      title: 'Examinations',
      items: [
        { path: '/examinations', label: 'Examinations Cell', icon: Award }
      ]
    },
    {
      title: 'Results',
      items: [
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

  // 4. Faculty: Dashboard, My Classes, Timetable, Attendance, Examinations & Marks, Notices
  [ROLES.FACULTY]: [
    {
      title: 'Dashboard',
      items: [
        { path: '/faculty', label: 'Faculty Dashboard', icon: LayoutDashboard }
      ]
    },
    {
      title: 'My Classes',
      items: [
        { path: '/faculty?tab=courses', label: 'Assigned Courses', icon: BookOpen },
        { path: '/faculty?tab=roster', label: 'Student Rosters', icon: Users }
      ]
    },
    {
      title: 'Timetable',
      items: [
        { path: '/faculty?tab=timetable', label: 'Teaching Schedule', icon: Clock }
      ]
    },
    {
      title: 'Attendance',
      items: [
        { path: '/attendance', label: 'Attendance Capture', icon: CalendarCheck }
      ]
    },
    {
      title: 'Examinations & Marks',
      items: [
        { path: '/faculty?tab=exams', label: 'Exam Duty & Marks', icon: Award }
      ]
    },
    {
      title: 'Notices',
      items: [
        { path: '/notices', label: 'Notice Board', icon: Bell }
      ]
    }
  ],

  // 5. Student: Dashboard, My Courses, Timetable, Attendance, Examinations, Published Results, Fees, Notices, Profile
  [ROLES.STUDENT]: [
    {
      title: 'Dashboard',
      items: [
        { path: '/student', label: 'Student Dashboard', icon: LayoutDashboard }
      ]
    },
    {
      title: 'My Courses',
      items: [
        { path: '/student?tab=courses', label: 'Enrolled Courses', icon: BookOpen }
      ]
    },
    {
      title: 'Timetable',
      items: [
        { path: '/student?tab=timetable', label: 'Semester Timetable', icon: Clock }
      ]
    },
    {
      title: 'Attendance',
      items: [
        { path: '/student?tab=attendance', label: 'Attendance Register', icon: CalendarCheck }
      ]
    },
    {
      title: 'Examinations',
      items: [
        { path: '/examinations', label: 'Exam Schedules', icon: Award }
      ]
    },
    {
      title: 'Published Results',
      items: [
        { path: '/student?tab=results', label: 'Grade Cards & SGPA', icon: FileText }
      ]
    },
    {
      title: 'Fees',
      items: [
        { path: '/fees', label: 'Fee Dues & Receipts', icon: CreditCard }
      ]
    },
    {
      title: 'Notices',
      items: [
        { path: '/notices', label: 'Campus Circulars', icon: Bell }
      ]
    },
    {
      title: 'Profile',
      items: [
        { path: '/student?tab=profile', label: 'Student Profile', icon: GraduationCap }
      ]
    }
  ],

  // 6. Accounts: Finance Overview, Fee Schedules, Invoices, Payments, Outstanding Dues, Financial Reports, Notices
  [ROLES.ACCOUNTS]: [
    {
      title: 'Finance Overview',
      items: [
        { path: '/accounts', label: 'Accounts Dashboard', icon: LayoutDashboard }
      ]
    },
    {
      title: 'Fee Schedules',
      items: [
        { path: '/fees?tab=structures', label: 'Fee Plans & Schedules', icon: Layers }
      ]
    },
    {
      title: 'Invoices',
      items: [
        { path: '/fees?tab=invoices', label: 'Billing Invoices', icon: FileText }
      ]
    },
    {
      title: 'Payments',
      items: [
        { path: '/fees?tab=payments', label: 'Payment Transactions', icon: CreditCard }
      ]
    },
    {
      title: 'Outstanding Dues',
      items: [
        { path: '/accounts?tab=invoices', label: 'Outstanding Ledgers', icon: TrendingUp }
      ]
    },
    {
      title: 'Financial Reports',
      items: [
        { path: '/reports', label: 'Financial Reports', icon: BarChart3 }
      ]
    },
    {
      title: 'Notices',
      items: [
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
    const parts = name.replace(/^(Dr.|Prof.|Mr.|Ms.|Mrs.)s+/i, '').trim().split(' ');
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

  // Precision active state matching supporting query params & tab anchors
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

      if (itemTab && currentTab) {
        if (itemTab === currentTab) return true;
        // Aliases for HOD and academic tabs
        if ((itemTab === 'faculty' || itemTab === 'roster') && (currentTab === 'faculty' || currentTab === 'roster')) return true;
        if ((itemTab === 'syllabus' || itemTab === 'curriculum' || itemTab === 'subjects') && (currentTab === 'syllabus' || currentTab === 'curriculum' || currentTab === 'subjects')) return true;
        if ((itemTab === 'timetable' || itemTab === 'schedule') && (currentTab === 'timetable' || currentTab === 'schedule')) return true;
        if ((itemTab === 'students' || itemTab === 'cohort') && (currentTab === 'students' || currentTab === 'cohort')) return true;
        if ((itemTab === 'exams' || itemTab === 'examination') && (currentTab === 'exams' || currentTab === 'examination')) return true;
      }
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
