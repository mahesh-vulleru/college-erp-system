import React, { useState, useEffect, useMemo } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import {
  GraduationCap,
  LayoutDashboard,
  Building2,
  BookOpen,
  CalendarCheck,
  CreditCard,
  Coins,
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
  BookMarked,
  Car,
  Wrench,
  Fuel,
  Navigation,
  MapPin,
  Activity,
  Radio,
  DollarSign,
  Receipt,
  AlertCircle,
  FileSpreadsheet,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Megaphone,
  TrendingUp,
  Sliders,
  Award,
  CheckCircle2,
  GitBranch,
  User,
  Key,
  Landmark,
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Calendar,
  Target,
  RotateCw,
  Search,
  FileText,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '@college-erp/shared';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();

  // Desktop collapsed state
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('erp_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('erp_sidebar_collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Determine normalized role
  const role = (user?.role || '').toLowerCase().trim().replace(/[\s-]+/g, '_');

  // Determine root dashboard path
  const getRoleDashboardPath = () => {
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
      case 'transport_admin':
      case 'transportadmin':
        return '/transport/admin';
      case 'transport_supervisor':
        return '/transport/supervisor';
      case 'bus_driver':
        return '/transport/driver';
      case 'bus_attendant':
        return '/transport/attendant';
      case 'parent':
        return '/transport/parent';
      default:
        return '/principal';
    }
  };

  const dashboardPath = getRoleDashboardPath();

  // ---------------------------------------------------------------------------
  // ROLE-SPECIFIC MENU GROUPS CONFIGURATION (APPROVED 13-ROLE MAPPING)
  // ---------------------------------------------------------------------------
  const roleMenuGroups = useMemo(() => {
    // 1. TRANSPORT ADMIN (Exact 19 verified features, zero duplication)
    if (role === 'transport_admin' || role === 'transportadmin') {
      return [
        {
          group: 'Overview',
          icon: LayoutDashboard,
          items: [
            { label: 'Transport Overview', path: '/transport/admin', exact: true, icon: LayoutDashboard },
            { label: 'Fleet Analytics', path: '/transport/admin?tab=analytics', icon: TrendingUp }
          ]
        },
        {
          group: 'Fleet & Personnel',
          icon: Car,
          items: [
            { label: 'Buses & Vehicles', path: '/transport/admin?tab=buses', icon: Bus },
            { label: 'Routes & Stops', path: '/transport/admin?tab=routes', icon: MapPin },
            { label: 'Drivers & Staff', path: '/transport/admin?tab=drivers', icon: Users },
            { label: 'Student Allocations', path: '/transport/admin?tab=students', icon: GraduationCap }
          ]
        },
        {
          group: 'Transit Operations',
          icon: Navigation,
          items: [
            { label: 'Trips & Dispatch', path: '/transport/admin?tab=trips', icon: Clock },
            { label: 'Daily Schedule', path: '/transport/admin?tab=schedule', icon: Calendar },
            { label: 'Live GPS', path: '/transport/admin?tab=gps', icon: Activity },
            { label: 'Student Attendance', path: '/transport/admin?tab=attendance', icon: UserCheck }
          ]
        },
        {
          group: 'Maintenance & Fuel',
          icon: Wrench,
          items: [
            { label: 'Maintenance', path: '/transport/admin?tab=maintenance', icon: Wrench },
            { label: 'Fuel', path: '/transport/admin?tab=fuel', icon: Fuel }
          ]
        },
        {
          group: 'Finance & Accounts',
          icon: CreditCard,
          items: [
            { label: 'Fees', path: '/transport/admin?tab=fees', icon: DollarSign },
            { label: 'Expenses', path: '/transport/admin?tab=expenses', icon: CreditCard }
          ]
        },
        {
          group: 'Safety & Grievance',
          icon: ShieldAlert,
          items: [
            { label: 'Safety & SOS', path: '/transport/admin?tab=safety', icon: ShieldAlert },
            { label: 'Complaints', path: '/transport/admin?tab=complaints', icon: MessageSquare },
            { label: 'Announcements', path: '/transport/admin?tab=announcements', icon: Megaphone }
          ]
        },
        {
          group: 'Reports & Settings',
          icon: BarChart3,
          items: [
            { label: 'Reports', path: '/transport/admin?tab=reports', icon: BarChart3 },
            { label: 'Institutional Calendar', path: '/calendar', icon: CalendarCheck },
            { label: 'Settings', path: '/transport/admin?tab=settings', icon: Settings }
          ]
        }
      ];
    }

    // 2. PRINCIPAL
    if (role === 'principal') {
      return [
        {
          group: 'Executive Leadership',
          icon: Building2,
          items: [
            { label: 'Principal Dashboard', path: '/principal', exact: true, icon: LayoutDashboard },
            { label: 'Institutional Health', path: '/overview', icon: Building2 },
            { label: 'Institutional Goals & KPIs', path: '/principal/goals', icon: Target },
            { label: 'Accreditation & Compliance', path: '/principal/accreditation', icon: ShieldCheck }
          ]
        },
        {
          group: 'Academic Governance',
          icon: GraduationCap,
          items: [
            { label: 'Academic Departments', path: '/departments', icon: Building2 },
            { label: 'Programs & Courses', path: '/courses', icon: Layers },
            { label: 'Academic Calendar', path: '/calendar', icon: CalendarCheck },
            { label: 'Institutional Deadlines', path: '/principal/events', icon: Clock },
            { label: 'Timetable Schedules', path: '/timetable', icon: Clock },
            { label: 'Examinations Cell', path: '/examinations', icon: FileEdit },
            { label: 'Results & Performance', path: '/results', icon: Award }
          ]
        },
        {
          group: 'People & Operations',
          icon: Users,
          items: [
            { label: 'Faculty Directory', path: '/faculty', icon: UserCheck },
            { label: 'Student Registry', path: '/students', icon: Users },
            { label: 'Attendance Records', path: '/attendance', icon: CalendarCheck },
            { label: 'Fee Collection Overview', path: '/fees', icon: CreditCard },
            { label: 'Executive Reports', path: '/reports', icon: BarChart3 },
            { label: 'Campus Notices', path: '/notices', icon: MessageSquare }
          ]
        },
        {
          group: 'Administration',
          icon: ShieldCheck,
          items: [
            { label: 'Leave Management', path: '/principal?tab=leaves', icon: CalendarCheck },
            { label: 'Leave Approvals', path: '/principal?tab=leaves', icon: CheckCircle2 },
            { label: 'Institutional Communications', path: '/notices', icon: MessageSquare },
            { label: 'Notifications', path: '/notices', icon: Bell },
            { label: 'Meetings & Scheduling', path: '/calendar', icon: Calendar },
            { label: 'Announcements', path: '/notices', icon: Megaphone },
            { label: 'Institutional Events', path: '/principal/events', icon: CalendarCheck }
          ]
        },
        {
          group: 'Finance Overview',
          icon: CreditCard,
          items: [
            { label: 'Financial Overview', path: '/fees', icon: CreditCard },
            { label: 'Fee Collection Overview', path: '/fees', icon: Receipt },
            { label: 'Pending Dues', path: '/fees', icon: AlertCircle },
            { label: 'Financial Reports', path: '/reports?type=finance', icon: FileSpreadsheet }
          ]
        },
        {
          group: 'Campus Management',
          icon: Landmark,
          items: [
            { label: 'Library Overview', path: '/library', icon: BookMarked },
            { label: 'Transport Overview', path: '/transport', icon: Bus },
            { label: 'Campus Assets & Inventory', path: '/assets', icon: Wrench },
            { label: 'Placements & Careers', path: '/placements', icon: Briefcase },
            { label: 'Campus Operations', path: '/departments', icon: Building2 }
          ]
        },
        {
          group: 'Reports & Analytics',
          icon: BarChart3,
          items: [
            { label: 'Academic Performance Reports', path: '/reports?type=academic', icon: BarChart3 },
            { label: 'Accreditation Readiness', path: '/principal/accreditation', icon: Award },
            { label: 'Department Reports', path: '/reports?type=department', icon: Building2 },
            { label: 'Attendance Reports', path: '/reports?type=attendance', icon: CalendarCheck },
            { label: 'Institutional Reports', path: '/reports', icon: FileSpreadsheet },
            { label: 'Executive Reports', path: '/reports', icon: TrendingUp }
          ]
        },
        {
          group: 'System Settings',
          icon: Settings,
          items: [
            { label: 'Profile Settings', path: '/settings?tab=profile', icon: User },
            { label: 'Security & Access', path: '/settings?tab=security', icon: Key },
            { label: 'Notifications', path: '/settings?tab=notifications', icon: Bell }
          ]
        }
      ];
    }

    // 3. TRANSPORT SUPERVISOR (Exact 10 verified features, zero phantom analytics)
    if (role === 'transport_supervisor') {
      return [
        {
          group: 'Dispatch Operations',
          icon: Navigation,
          items: [
            { label: 'Supervisor Dashboard', path: '/transport/supervisor', exact: true, icon: LayoutDashboard },
            { label: 'Trips & Dispatch', path: '/transport/supervisor?tab=trips', icon: Clock },
            { label: 'Daily Schedule', path: '/transport/supervisor?tab=schedule', icon: Calendar },
            { label: 'Live GPS', path: '/transport/supervisor?tab=gps', icon: Activity },
            { label: 'Student Attendance', path: '/transport/supervisor?tab=attendance', icon: UserCheck }
          ]
        },
        {
          group: 'Fleet Care & Safety',
          icon: ShieldAlert,
          items: [
            { label: 'Maintenance Requests', path: '/transport/supervisor?tab=maintenance', icon: Wrench },
            { label: 'Safety & Emergency', path: '/transport/supervisor?tab=safety', icon: ShieldAlert },
            { label: 'Complaints', path: '/transport/supervisor?tab=complaints', icon: MessageSquare },
            { label: 'Announcements', path: '/transport/supervisor?tab=announcements', icon: Megaphone },
            { label: 'Institutional Calendar', path: '/calendar', icon: CalendarCheck }
          ]
        }
      ];
    }

    // 4. BUS DRIVER (4 verified tabs + Settings)
    if (role === 'bus_driver') {
      return [
        {
          group: 'Driver Console',
          icon: Bus,
          items: [
            { label: 'Driver Console & GPS', path: '/transport/driver', exact: true, icon: Bus },
            { label: 'Daily Transit Schedule', path: '/transport/driver?tab=schedule', icon: Calendar }
          ]
        },
        {
          group: 'Safety & Alerts',
          icon: ShieldAlert,
          items: [
            { label: 'Safety & Emergency SOS', path: '/transport/driver?tab=safety', icon: AlertTriangle },
            { label: 'Notices & Broadcasts', path: '/transport/driver?tab=announcements', icon: Megaphone },
            { label: 'My Settings', path: '/settings', icon: Settings }
          ]
        }
      ];
    }

    // 5. BUS ATTENDANT (4 verified tabs + Settings)
    if (role === 'bus_attendant') {
      return [
        {
          group: 'Attendant Console',
          icon: UserCheck,
          items: [
            { label: 'Take Bus Attendance', path: '/transport/attendant', exact: true, icon: UserCheck },
            { label: 'Passenger Directory', path: '/transport/attendant?tab=roster', icon: Users },
            { label: 'Daily Transit Schedule', path: '/transport/attendant?tab=schedule', icon: Calendar }
          ]
        },
        {
          group: 'Communication',
          icon: MessageSquare,
          items: [
            { label: 'Broadcast Announcements', path: '/transport/attendant?tab=announcements', icon: Megaphone },
            { label: 'My Settings', path: '/settings', icon: Settings }
          ]
        }
      ];
    }

    // 6. PARENT (5 verified tabs + Calendar + Settings)
    if (role === 'parent') {
      return [
        {
          group: 'Parent Ward Portal',
          icon: Users,
          items: [
            { label: 'Live Bus & Transit Radar', path: '/transport/parent', exact: true, icon: Bus },
            { label: 'Academic Performance', path: '/transport/parent?tab=academic', icon: GraduationCap },
            { label: 'Attendance Records', path: '/transport/parent?tab=attendance', icon: CalendarCheck },
            { label: 'Fee Dues & Receipts', path: '/transport/parent?tab=fees', icon: CreditCard }
          ]
        },
        {
          group: 'Communication & Settings',
          icon: MessageSquare,
          items: [
            { label: 'School Announcements', path: '/transport/parent?tab=announcements', icon: Megaphone },
            { label: 'Academic Calendar', path: '/calendar', icon: CalendarCheck },
            { label: 'My Settings', path: '/settings', icon: Settings }
          ]
        }
      ];
    }

    // 7. SUPER ADMIN
    if (role === 'super_admin' || role === 'admin' || role === 'superadmin' || role === 'super_administrator') {
      return [
        {
          group: 'Overview & Access',
          icon: ShieldAlert,
          items: [
            { label: 'Admin Dashboard', path: '/admin', exact: true, icon: LayoutDashboard },
            { label: 'User Management', path: '/admin/users', icon: Users },
            { label: 'System Overview Hub', path: '/overview', icon: Building2 }
          ]
        },
        {
          group: 'Academic Infrastructure',
          icon: GraduationCap,
          items: [
            { label: 'Academic Departments', path: '/departments', icon: Building2 },
            { label: 'Programs & Courses', path: '/courses', icon: Layers },
            { label: 'Class Timetables', path: '/timetable', icon: Clock },
            { label: 'Academic Calendar', path: '/calendar', icon: CalendarCheck },
            { label: 'Examinations System', path: '/examinations', icon: FileEdit }
          ]
        },
        {
          group: 'Campus Portals',
          icon: Landmark,
          items: [
            { label: 'Fee Administration', path: '/fees', icon: CreditCard },
            { label: 'Central Library', path: '/library', icon: BookMarked },
            { label: 'Transport Fleet', path: '/transport/admin', icon: Bus },
            { label: 'Hostel System', path: '/hostel', icon: BedDouble },
            { label: 'Placements', path: '/placements', icon: Briefcase },
            { label: 'Campus Assets & Inventory', path: '/assets', icon: Wrench }
          ]
        },
        {
          group: 'Governance & Logs',
          icon: BarChart3,
          items: [
            { label: 'System Health & Diagnostics', path: '/admin?tab=health', icon: Activity },
            { label: 'Security & Audit Logs', path: '/audit-logs', icon: ShieldCheck },
            { label: 'Executive Reports', path: '/reports', icon: BarChart3 },
            { label: 'Notice Board', path: '/notices', icon: MessageSquare },
            { label: 'System Settings', path: '/settings', icon: Settings }
          ]
        }
      ];
    }

    // 8. HOD
    if (role === 'hod') {
      return [
        {
          group: 'Department Operations',
          icon: GitBranch,
          items: [
            { label: 'HOD Dashboard', path: '/hod', exact: true, icon: LayoutDashboard },
            { label: 'Department Faculty', path: '/hod?tab=faculty', icon: UserCheck },
            { label: 'Student Cohort', path: '/hod?tab=students', icon: Users },
            { label: 'Department Timetable', path: '/hod?tab=timetable', icon: Clock },
            { label: 'Curriculum & Courses', path: '/courses', icon: BookOpen }
          ]
        },
        {
          group: 'Curriculum & Compliance',
          icon: GraduationCap,
          items: [
            { label: 'Faculty Loads', path: '/faculty', icon: UserCheck },
            { label: 'Department Students', path: '/students', icon: Users },
            { label: 'Placements & Training', path: '/placements', icon: Briefcase },
            { label: 'Department Examinations', path: '/examinations', icon: FileEdit },
            { label: 'Academic Risk Alerts', path: '/hod?tab=alerts', icon: AlertTriangle }
          ]
        },
        {
          group: 'Governance & Requests',
          icon: ShieldCheck,
          items: [
            { label: 'Staff Leave Approvals', path: '/hod?tab=leaves', icon: CalendarCheck },
            { label: 'Attendance Register', path: '/attendance', icon: CalendarCheck },
            { label: 'Academic Calendar', path: '/calendar', icon: CalendarCheck },
            { label: 'Department Reports', path: '/reports', icon: BarChart3 },
            { label: 'Notice Board', path: '/notices', icon: MessageSquare }
          ]
        }
      ];
    }

    // 9. FACULTY
    if (role === 'faculty') {
      return [
        {
          group: 'Teaching & Classes',
          icon: GraduationCap,
          items: [
            { label: 'Faculty Dashboard', path: '/faculty', exact: true, icon: LayoutDashboard },
            { label: 'Weekly Teaching Schedule', path: '/faculty?tab=timetable', icon: Clock },
            { label: 'Assigned Subjects', path: '/faculty?tab=courses', icon: BookOpen },
            { label: 'Student Class Roster', path: '/faculty?tab=roster', icon: Users },
            { label: 'Internal Marks Entry', path: '/faculty?tab=exams', icon: FileEdit },
            { label: 'Academic Insights & Risk', path: '/faculty?tab=insights', icon: TrendingUp }
          ]
        },
        {
          group: 'Campus Services',
          icon: Landmark,
          items: [
            { label: 'Apply for Leave', path: '/faculty?tab=leaves', icon: CalendarCheck },
            { label: 'Attendance Marking', path: '/attendance', icon: CalendarCheck },
            { label: 'Academic Calendar', path: '/calendar', icon: CalendarCheck },
            { label: 'Placement Recommendations', path: '/placements', icon: Briefcase },
            { label: 'Library Catalog', path: '/library', icon: BookMarked },
            { label: 'Campus Notices', path: '/notices', icon: MessageSquare }
          ]
        }
      ];
    }

    // 10. STUDENT
    if (role === 'student') {
      return [
        {
          group: 'Student Portal',
          icon: GraduationCap,
          items: [
            { label: 'Student Dashboard', path: '/student', exact: true, icon: LayoutDashboard },
            { label: 'Attendance Records', path: '/attendance', icon: CalendarCheck },
            { label: 'Semester Results', path: '/results', icon: Award },
            { label: 'Class Timetable', path: '/timetable', icon: Clock },
            { label: 'Enrolled Courses', path: '/courses', icon: BookOpen }
          ]
        },
        {
          group: 'Campus Services',
          icon: Landmark,
          items: [
            { label: 'Training & Placements', path: '/placements', icon: Briefcase },
            { label: 'Fee Dues & Receipts', path: '/fees', icon: CreditCard },
            { label: 'Library Access', path: '/library', icon: BookMarked },
            { label: 'Academic Calendar', path: '/calendar', icon: CalendarCheck },
            { label: 'Campus Notice Board', path: '/notices', icon: MessageSquare }
          ]
        }
      ];
    }

    // 11. ACCOUNTS
    if (role === 'accounts' || role === 'accountant' || role === 'finance') {
      return [
        {
          group: 'Finance & Ledgers',
          icon: Coins,
          items: [
            { label: 'Accounts Dashboard', path: '/accounts', exact: true, icon: LayoutDashboard },
            { label: 'Fee Plans & Schedules', path: '/fees?tab=structures', icon: Layers },
            { label: 'Billing Invoices', path: '/fees?tab=invoices', icon: FileText },
            { label: 'Payment Transactions', path: '/fees?tab=payments', icon: Receipt },
            { label: 'Financial Forecasting & Aging', path: '/accounts?tab=reconciliation', icon: TrendingUp },
            { label: 'Asset & Equipment Ledger', path: '/assets', icon: Wrench },
            { label: 'Student Fee Ledgers', path: '/students', icon: Users },
            { label: 'Audit Trail', path: '/audit-logs', icon: ShieldCheck },
            { label: 'Financial Reports', path: '/reports?tab=finance', icon: BarChart3 },
            { label: 'Academic Calendar', path: '/calendar', icon: CalendarCheck },
            { label: 'Notice Board', path: '/notices', icon: Bell }
          ]
        }
      ];
    }

    // 12. LIBRARY STAFF (All 14 verified operational tabs)
    if (role === 'library_staff' || role === 'librarystaff') {
      return [
        {
          group: 'Circulation Desk',
          icon: Clock,
          items: [
            { label: 'Staff Dashboard', path: '/library-staff', exact: true, icon: LayoutDashboard },
            { label: 'Issue Books', path: '/library-staff?tab=issue-books', icon: CheckCircle },
            { label: 'Return Books', path: '/library-staff?tab=return-books', icon: Clock },
            { label: 'Renew Books', path: '/library-staff?tab=renew-books', icon: RotateCw },
            { label: 'Active Issues', path: '/library-staff?tab=active-issues', icon: FileText },
            { label: 'Overdue Books', path: '/library-staff?tab=overdue-books', icon: AlertTriangle }
          ]
        },
        {
          group: 'Catalog & Inventory',
          icon: BookMarked,
          items: [
            { label: 'Search Books', path: '/library-staff?tab=search-books', icon: Search },
            { label: 'Book Availability', path: '/library-staff?tab=availability', icon: BookOpen },
            { label: 'Reservations Queue', path: '/library-staff?tab=reservations', icon: BookMarked },
            { label: 'Member Patrons', path: '/library-staff?tab=members', icon: Users }
          ]
        },
        {
          group: 'Staff Activities & Leaves',
          icon: UserCheck,
          items: [
            { label: 'My Transactions', path: '/library-staff?tab=my-transactions', icon: TrendingUp },
            { label: 'Desk Notifications', path: '/library-staff?tab=notifications', icon: Bell },
            { label: 'My Profile', path: '/library-staff?tab=profile', icon: User },
            { label: 'Apply for Leave', path: '/library-staff?tab=leaves', icon: CalendarCheck }
          ]
        }
      ];
    }

    // 13. LIBRARIAN (Chief Librarian Portal, 9 verified tabs)
    if (role === 'librarian') {
      return [
        {
          group: 'Library Management',
          icon: BookMarked,
          items: [
            { label: 'Chief Librarian Portal', path: '/library', exact: true, icon: LayoutDashboard },
            { label: 'Book Catalog & Accession', path: '/library?tab=books', icon: BookOpen },
            { label: 'Categories Master', path: '/library?tab=categories', icon: Layers },
            { label: 'Circulation Desk', path: '/library?tab=circulation', icon: Clock },
            { label: 'Member Patrons', path: '/library?tab=members', icon: Users },
            { label: 'Book Reservations', path: '/library?tab=reservations', icon: BookMarked },
            { label: 'Library Hardware & Terminals', path: '/assets?category=it_equipment', icon: Wrench },
            { label: 'Overdue & Fine Ledgers', path: '/library?tab=fines', icon: DollarSign },
            { label: 'Digital E-Library', path: '/library?tab=digital', icon: Layers },
            { label: 'Library Rules & Settings', path: '/library?tab=settings', icon: Settings },
            { label: 'Staff Leaves & Approvals', path: '/library?tab=leaves', icon: CalendarCheck },
            { label: 'Academic Calendar', path: '/calendar', icon: CalendarCheck }
          ]
        }
      ];
    }

    // Default fallback
    return [
      {
        group: 'Quick Access',
        icon: LayoutDashboard,
        items: [
          { label: 'Dashboard', path: dashboardPath, exact: true, icon: LayoutDashboard },
          { label: 'Academic Calendar', path: '/calendar', icon: CalendarCheck },
          { label: 'Communications', path: '/notices', icon: MessageSquare }
        ]
      }
    ];
  }, [role, dashboardPath]);

  // Track expanded/collapsed groups. By default, all groups start expanded.
  const [expandedGroups, setExpandedGroups] = useState(() => {
    const initial = {};
    roleMenuGroups.forEach((g) => {
      initial[g.group] = true;
    });
    return initial;
  });

  const toggleGroup = (groupName) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  // Helper to determine if an item is active
  const isItemActive = (item) => {
    const currentPath = location.pathname;
    const currentSearch = new URLSearchParams(location.search);

    const [targetPath, targetQuery] = item.path.split('?');
    const targetParams = new URLSearchParams(targetQuery || '');

    // Check pathname
    const isMatchingPath =
      targetPath === currentPath ||
      (targetPath === '/transport/admin' && (currentPath === '/transport' || currentPath === '/transport/admin')) ||
      (targetPath === '/transport' && (currentPath === '/transport/admin' || currentPath === '/transport'));

    if (!isMatchingPath) {
      if (item.exact) return false;
      if (targetPath.length > 1 && currentPath.startsWith(targetPath + '/')) {
        return true;
      }
      return false;
    }

    // Target specifies query params (e.g. ?tab=buses)
    if (targetQuery) {
      for (const [key, val] of targetParams.entries()) {
        if (currentSearch.get(key) !== val) {
          return false;
        }
      }
      return true;
    }

    // Target has no query params, but current URL has query params
    const activeTab = currentSearch.get('tab');
    if (activeTab && activeTab !== 'overview' && activeTab !== 'dashboard') {
      return false;
    }

    return true;
  };

  // Auto-expand group containing the active item
  useEffect(() => {
    for (const group of roleMenuGroups) {
      const hasActiveChild = group.items.some((item) => isItemActive(item));
      if (hasActiveChild) {
        setExpandedGroups((prev) => ({
          ...prev,
          [group.group]: true
        }));
      }
    }
  }, [location.pathname, location.search, roleMenuGroups]);

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Dark Forest-Green Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 ${
          isCollapsed ? 'lg:w-20' : 'lg:w-64'
        } w-64 bg-[#062a1e] border-r border-[#041d15] flex flex-col transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:static lg:translate-x-0 shadow-2xl text-white select-none`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 border-b border-white/10 flex items-center justify-between shrink-0">
          <Link
            to={dashboardPath}
            onClick={onClose}
            className="flex items-center space-x-3 group min-w-0"
            title="College ERP Home"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
              <GraduationCap className="w-5 h-5 text-emerald-300" />
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-white block leading-tight truncate">
                  College ERP
                </span>
                <span className="text-[10px] text-emerald-300/70 font-medium tracking-wide block truncate">
                  Campus Management
                </span>
              </div>
            )}
          </Link>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-emerald-300/60 hover:text-white hover:bg-white/10 lg:hidden cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Groups */}
        <div className="flex-1 px-2.5 py-3 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-emerald-900/60 scrollbar-track-transparent">
          {roleMenuGroups.map((grp) => {
            const isExpanded = expandedGroups[grp.group] !== false;
            const GroupIcon = grp.icon;

            return (
              <div key={grp.group} className="space-y-1">
                {/* Group Accordion Header */}
                {!isCollapsed ? (
                  <button
                    type="button"
                    onClick={() => toggleGroup(grp.group)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] font-bold tracking-wider text-emerald-300/60 hover:text-emerald-200 uppercase rounded-lg hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <GroupIcon className="w-3.5 h-3.5 text-emerald-400/70 group-hover:text-emerald-300" />
                      <span className="truncate">{grp.group}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-70" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-70" />
                    )}
                  </button>
                ) : (
                  <div className="h-4 border-t border-white/10 my-2" title={grp.group} />
                )}

                {/* Group Items (rendered if expanded or in collapsed icon strip) */}
                {(isExpanded || isCollapsed) && (
                  <nav className="space-y-0.5">
                    {grp.items.map((item) => {
                      const Icon = item.icon;
                      const active = isItemActive(item);

                      return (
                        <div key={item.label + item.path} className="relative group">
                          <NavLink
                            to={item.path}
                            onClick={() => {
                              if (window.innerWidth < 1024) onClose();
                            }}
                            className={`w-full flex items-center ${
                              isCollapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2'
                            } rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                              active
                                ? 'bg-[#a7f3d0] text-[#064e3b] shadow-xs font-bold'
                                : 'text-emerald-100/75 hover:bg-white/10 hover:text-white'
                            }`}
                            title={isCollapsed ? item.label : undefined}
                          >
                            <Icon
                              className={`w-4 h-4 shrink-0 ${
                                isCollapsed ? '' : 'mr-2.5'
                              } ${active ? 'text-[#064e3b]' : 'text-emerald-300/70'}`}
                            />
                            {!isCollapsed && <span className="truncate">{item.label}</span>}
                          </NavLink>

                          {/* Floating Tooltip in Collapsed Desktop Mode */}
                          {isCollapsed && (
                            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-xs font-medium shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-slate-700/80">
                              <span className="block font-bold text-[10px] text-emerald-400 uppercase tracking-wider">
                                {grp.group}
                              </span>
                              <span>{item.label}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </nav>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer: Help & Support, Collapse Toggle, Version */}
        <div className="p-3 border-t border-white/10 bg-[#041f16] flex items-center justify-between text-xs text-emerald-200/70 shrink-0">
          <Link
            to="/settings"
            onClick={onClose}
            className="flex items-center gap-2 hover:text-white transition-colors truncate"
            title="Help & Support"
          >
            <Headphones className="w-4 h-4 text-emerald-400 shrink-0" />
            {!isCollapsed && <span className="font-medium text-[11px] truncate">Help & Support</span>}
          </Link>

          {/* Desktop Expand/Collapse Toggle Button */}
          <button
            type="button"
            onClick={toggleCollapsed}
            className="hidden lg:flex items-center justify-center p-1.5 rounded-lg text-emerald-300/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronsRight className="w-4 h-4" />
            ) : (
              <ChevronsLeft className="w-4 h-4" />
            )}
          </button>

          {!isCollapsed && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800/60 shrink-0">
              v1.0.0
            </span>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
