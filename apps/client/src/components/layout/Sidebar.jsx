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
  Target,
  Search,
  RotateCw,
  AlertTriangle,
  CheckCircle,
  Bus,
  MapPin,
  Radio,
  Activity,
  Wrench,
  Fuel,
  Receipt,
  ShieldAlert,
  MessageSquare,
  Megaphone
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

  // 2. Principal: Executive Leadership, Academic Administration, Operations & Examination, Governance & Audits
  [ROLES.PRINCIPAL]: [
    {
      title: 'Executive Leadership',
      items: [
        { path: '/principal', label: 'Principal Dashboard', icon: LayoutDashboard },
        { path: '/principal/accreditation', label: 'Accreditation & Compliance', icon: ShieldCheck },
        { path: '/principal/goals', label: 'Institutional Goals & KPIs', icon: Target },
        { path: '/principal/events', label: 'Institutional Academic Calendar', icon: CalendarCheck },
        { path: '/overview', label: 'Institutional Health', icon: Compass }
      ]
    },
    {
      title: 'Academic Administration',
      items: [
        { path: '/departments', label: 'Academic Departments', icon: Building2 },
        { path: '/faculty', label: 'Teaching Faculty', icon: Users },
        { path: '/students', label: 'Student Cohorts', icon: GraduationCap },
        { path: '/courses', label: 'Programs & Courses', icon: BookOpen }
      ]
    },
    {
      title: 'Operations & Performance',
      items: [
        { path: '/timetable', label: 'Class Timetables', icon: Clock },
        { path: '/attendance', label: 'Daily Attendance', icon: CalendarCheck },
        { path: '/examinations', label: 'Examination Status & Schedules', icon: FileText },
        { path: '/results', label: 'Results & Performance', icon: Award }
      ]
    },
    {
      title: 'Governance & Audits',
      items: [
        { path: '/reports?tab=faculty', label: 'Faculty Workload', icon: Clock },
        { path: '/reports', label: 'Executive Reports', icon: BarChart3 },
        { path: '/audit-logs', label: 'Regulatory Audit Reports', icon: ShieldCheck },
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
  ],
  // 7. Librarian: Overview, Catalog Management, Circulation Desk, Patrons & Accounts, Digital & Governance
  [ROLES.LIBRARIAN]: [
    {
      title: 'Overview',
      items: [
        { path: '/library', label: 'Library Dashboard', icon: LayoutDashboard }
      ]
    },
    {
      title: 'Catalog Management',
      items: [
        { path: '/library?tab=books', label: 'Books & Physical Copies', icon: BookOpen },
        { path: '/library?tab=categories', label: 'Categories & Classification', icon: Layers }
      ]
    },
    {
      title: 'Circulation Desk',
      items: [
        { path: '/library?tab=circulation', label: 'Issues & Checkouts', icon: Clock },
        { path: '/library?tab=reservations', label: 'Reservations Queue', icon: CalendarCheck }
      ]
    },
    {
      title: 'Patrons & Accounts',
      items: [
        { path: '/library?tab=members', label: 'Student & Faculty Members', icon: Users },
        { path: '/library?tab=fines', label: 'Overdue Books & Fines', icon: CreditCard }
      ]
    },
    {
      title: 'Digital & Governance',
      items: [
        { path: '/library?tab=digital', label: 'Digital Library Resources', icon: FileText },
        { path: '/library?tab=reports', label: 'Reports & Analytics', icon: BarChart3 },
        { path: '/library?tab=settings', label: 'Library Rules & Settings', icon: ShieldCheck }
      ]
    }
  ],

  // 8. Library Staff: 13 Circulation & Operations items matching Phase 2 specifications
  [ROLES.LIBRARY_STAFF]: [
    {
      title: 'Operations Overview',
      items: [
        { path: '/library-staff', label: 'Staff Dashboard', icon: LayoutDashboard }
      ]
    },
    {
      title: 'Catalog & Inventory',
      items: [
        { path: '/library-staff?tab=search-books', label: 'Search Books', icon: Search },
        { path: '/library-staff?tab=availability', label: 'Book Availability', icon: BookOpen }
      ]
    },
    {
      title: 'Circulation Desk',
      items: [
        { path: '/library-staff?tab=issue-books', label: 'Issue Books', icon: CheckCircle },
        { path: '/library-staff?tab=return-books', label: 'Return Books', icon: Clock },
        { path: '/library-staff?tab=renew-books', label: 'Renew Books', icon: RotateCw },
        { path: '/library-staff?tab=active-issues', label: 'Active Issues', icon: FileText },
        { path: '/library-staff?tab=overdue-books', label: 'Overdue Books', icon: AlertTriangle }
      ]
    },
    {
      title: 'Patrons & Requests',
      items: [
        { path: '/library-staff?tab=reservations', label: 'Reservations', icon: CalendarCheck },
        { path: '/library-staff?tab=members', label: 'Member Search', icon: Users }
      ]
    },
    {
      title: 'Activity & Profile',
      items: [
        { path: '/library-staff?tab=my-transactions', label: 'My Transactions', icon: TrendingUp },
        { path: '/library-staff?tab=notifications', label: 'Notifications', icon: Bell },
        { path: '/library-staff?tab=profile', label: 'My Profile', icon: UserCheck }
      ]
    }
  ],

  // 9. Transport Admin: Fleet, Trips, GPS, Attendance & Operations
  [ROLES.TRANSPORT_ADMIN]: [
    {
      title: 'Transport Overview',
      items: [
        { path: '/transport', label: 'Transport Overview', icon: LayoutDashboard }
      ]
    },
    {
      title: 'Transit Operations',
      items: [
        { path: '/transport?tab=trips', label: 'Trip Management', icon: Clock },
        { path: '/transport?tab=schedule', label: 'Daily Transit Schedule', icon: CalendarCheck },
        { path: '/transport?tab=gps', label: 'Live GPS Radar', icon: Radio },
        { path: '/transport?tab=attendance', label: 'Student Attendance', icon: UserCheck }
      ]
    },
    {
      title: 'Fleet & Routes',
      items: [
        { path: '/transport?tab=buses', label: 'Bus & Vehicle Management', icon: Bus },
        { path: '/transport?tab=routes', label: 'Route & Stop Management', icon: MapPin }
      ]
    },
    {
      title: 'Staff & Allocations',
      items: [
        { path: '/transport?tab=drivers', label: 'Driver & Staff Management', icon: Users },
        { path: '/transport?tab=students', label: 'Student Transport Management', icon: GraduationCap }
      ]
    },
    {
      title: 'Maintenance & Fuel',
      items: [
        { path: '/transport?tab=maintenance', label: 'Vehicle Maintenance', icon: Wrench },
        { path: '/transport?tab=fuel', label: 'Fuel & Mileage Tracking', icon: Fuel }
      ]
    },
    {
      title: 'Financial Management',
      items: [
        { path: '/transport?tab=expenses', label: 'Transport Expenses', icon: CreditCard },
        { path: '/transport?tab=fees', label: 'Transport Fee Ledger', icon: Receipt }
      ]
    },
    {
      title: 'Safety & Grievances',
      items: [
        { path: '/transport?tab=safety', label: 'Safety & Emergency SOS', icon: ShieldAlert },
        { path: '/transport?tab=complaints', label: 'Feedback & Grievances', icon: MessageSquare },
        { path: '/transport?tab=announcements', label: 'Notices & Broadcasts', icon: Megaphone }
      ]
    },
    {
      title: 'Configuration',
      items: [
        { path: '/transport?tab=settings', label: 'Transport Settings', icon: ShieldCheck }
      ]
    }
  ],

  [ROLES.TRANSPORT_SUPERVISOR]: [
    {
      title: 'Operations Overview',
      items: [
        { path: '/transport?tab=supervisor', label: 'Operations Dashboard', icon: LayoutDashboard }
      ]
    },
    {
      title: 'Safety & Emergency',
      items: [
        { path: '/transport?tab=safety', label: 'Safety & SOS Alerts', icon: ShieldAlert },
        { path: '/transport?tab=complaints', label: 'Assigned Complaints', icon: MessageSquare }
      ]
    },
    {
      title: 'Dispatch & Radar',
      items: [
        { path: '/transport?tab=gps', label: 'Live GPS Fleet Radar', icon: Radio },
        { path: '/transport?tab=schedule', label: 'Daily Transit Schedule', icon: CalendarCheck },
        { path: '/transport?tab=trips', label: 'Trip Management', icon: Clock }
      ]
    },
    {
      title: 'Passenger Operations',
      items: [
        { path: '/transport?tab=attendance', label: 'Student Attendance', icon: UserCheck }
      ]
    }
  ],

  [ROLES.BUS_DRIVER]: [
    {
      title: 'Driver Console',
      items: [
        { path: '/transport?tab=driver_portal', label: 'My Assigned Trips', icon: Bus },
        { path: '/transport?tab=schedule', label: 'Today\'s Transit Schedule', icon: Clock },
        { path: '/transport?tab=safety', label: 'Safety & SOS Alert', icon: ShieldAlert }
      ]
    }
  ],

  [ROLES.BUS_ATTENDANT]: [
    {
      title: 'Attendant Desk',
      items: [
        { path: '/transport?tab=attendance', label: 'Student Boarding & Drops', icon: UserCheck },
        { path: '/transport?tab=safety', label: 'Safety & SOS Alert', icon: ShieldAlert }
      ]
    }
  ],

  [ROLES.PARENT]: [
    {
      title: 'Child Transit',
      items: [
        { path: '/transport?tab=parent', label: 'Child Bus Tracker', icon: Bus },
        { path: '/transport?tab=complaints', label: 'Submit Grievance', icon: MessageSquare },
        { path: '/transport?tab=announcements', label: 'Transport Notices', icon: Megaphone }
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
      case ROLES.LIBRARIAN: return '/library';
      case ROLES.LIBRARY_STAFF: return '/library-staff';
      case ROLES.TRANSPORT_ADMIN: return '/transport';
      case ROLES.TRANSPORT_SUPERVISOR: return '/transport?tab=supervisor';
      case ROLES.BUS_DRIVER: return '/transport?tab=driver_portal';
      case ROLES.BUS_ATTENDANT: return '/transport?tab=attendance';
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
    if (location.search && (itemPath === '/student' || itemPath === '/faculty' || itemPath === '/hod' || itemPath === '/accounts' || itemPath === '/fees' || itemPath === '/reports' || itemPath === '/library' || itemPath === '/transport')) {
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
