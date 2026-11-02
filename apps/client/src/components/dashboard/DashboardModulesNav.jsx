import React from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  GraduationCap,
  Users,
  UserCheck,
  FileEdit,
  CalendarCheck,
  Clock,
  CreditCard,
  BookMarked,
  Bus,
  BedDouble,
  Briefcase,
  BarChart3,
  Settings,
  Layers,
  ShieldCheck,
  Activity,
  FileText,
  Bell,
  Coins,
  Award
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '@college-erp/shared';

// Role-tailored relevant modules dictionary
const ROLE_MODULES = {
  [ROLES.SUPER_ADMIN]: [
    { label: 'User Directory', icon: Users, path: '/admin/users' },
    { label: 'Roles & RBAC', icon: ShieldCheck, path: '/admin?tab=roles' },
    { label: 'Security Audit', icon: Activity, path: '/audit-logs' },
    { label: 'System Health', icon: Activity, path: '/overview' },
    { label: 'Institution Profile', icon: Building2, path: '/settings' },
    { label: 'System Reports', icon: BarChart3, path: '/reports' }
  ],
  [ROLES.PRINCIPAL]: [
    { label: 'Institution', icon: Building2, path: '/departments' },
    { label: 'Academics', icon: GraduationCap, path: '/courses' },
    { label: 'Students', icon: Users, path: '/students' },
    { label: 'Faculty', icon: UserCheck, path: '/faculty' },
    { label: 'Examinations', icon: FileEdit, path: '/examinations' },
    { label: 'Attendance', icon: CalendarCheck, path: '/attendance' },
    { label: 'Fee & Accounts', icon: CreditCard, path: '/fees' },
    { label: 'Library', icon: BookMarked, path: '/library' },
    { label: 'Executive Reports', icon: BarChart3, path: '/reports' }
  ],
  [ROLES.HOD]: [
    { label: 'Curriculum', icon: GraduationCap, path: '/courses' },
    { label: 'Faculty Roster', icon: UserCheck, path: '/faculty' },
    { label: 'Student Cohort', icon: Users, path: '/students' },
    { label: 'Class Timetable', icon: Clock, path: '/timetable' },
    { label: 'Attendance', icon: CalendarCheck, path: '/attendance' },
    { label: 'Examinations', icon: FileEdit, path: '/examinations' },
    { label: 'Results & Marks', icon: Award, path: '/results' },
    { label: 'Department Notices', icon: Bell, path: '/notices' }
  ],
  [ROLES.FACULTY]: [
    { label: 'My Subjects', icon: GraduationCap, path: '/courses' },
    { label: 'Weekly Timetable', icon: Clock, path: '/timetable' },
    { label: 'Mark Attendance', icon: CalendarCheck, path: '/attendance' },
    { label: 'Exam Schedules', icon: FileEdit, path: '/examinations' },
    { label: 'Internal Marks', icon: Award, path: '/results' },
    { label: 'Campus Notices', icon: Bell, path: '/notices' }
  ],
  [ROLES.STUDENT]: [
    { label: 'My Courses', icon: GraduationCap, path: '/courses' },
    { label: 'Class Timetable', icon: Clock, path: '/timetable' },
    { label: 'My Attendance', icon: CalendarCheck, path: '/attendance' },
    { label: 'Exam Schedules', icon: FileEdit, path: '/examinations' },
    { label: 'Grade Cards', icon: Award, path: '/results' },
    { label: 'Fee Payments', icon: CreditCard, path: '/fees' },
    { label: 'Notices', icon: Bell, path: '/notices' }
  ],
  [ROLES.ACCOUNTS]: [
    { label: 'Fee Structures', icon: CreditCard, path: '/fees' },
    { label: 'Student Invoices', icon: FileText, path: '/fees' },
    { label: 'Payment Ledgers', icon: Coins, path: '/fees' },
    { label: 'Financial Reports', icon: BarChart3, path: '/reports' }
  ],
  [ROLES.LIBRARIAN]: [
    { label: 'Book Catalog', icon: BookMarked, path: '/library?tab=books' },
    { label: 'Circulation Desk', icon: Clock, path: '/library?tab=circulation' },
    { label: 'Library Patrons', icon: Users, path: '/library?tab=members' },
    { label: 'Reservations', icon: BookMarked, path: '/library?tab=reservations' },
    { label: 'Fine Management', icon: Coins, path: '/library?tab=fines' }
  ],
  [ROLES.LIBRARY_STAFF]: [
    { label: 'Issue Desk', icon: Clock, path: '/library-staff' },
    { label: 'Returns Check-In', icon: BookMarked, path: '/library-staff' },
    { label: 'Patron Lookup', icon: Users, path: '/library-staff' },
    { label: 'Fine Collection', icon: Coins, path: '/library-staff' }
  ]
};

export const DashboardModulesNav = ({ modules = null, title = null }) => {
  const { user } = useAuth();
  const role = (user?.role || '').toLowerCase().trim().replace(/[\s-]+/g, '_');

  // Determine role-relevant modules
  const activeModules = modules || ROLE_MODULES[role] || ROLE_MODULES[ROLES.PRINCIPAL];

  if (!activeModules || activeModules.length === 0) {
    return null;
  }

  const sectionTitle = title || (
    role === ROLES.SUPER_ADMIN ? 'System Administration Modules' :
    role === ROLES.PRINCIPAL ? 'Executive Institutional Modules' :
    role === ROLES.HOD ? 'Department Academic Portals' :
    role === ROLES.FACULTY ? 'Teaching Workspace Portals' :
    role === ROLES.STUDENT ? 'Student Self-Service Modules' :
    role === ROLES.ACCOUNTS ? 'Financial Management Portals' :
    'Library Operations Portals'
  );

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
      <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100">
        <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
          <Layers className="w-4 h-4" />
        </div>
        <h3 className="text-sm font-bold text-slate-900">{sectionTitle}</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {activeModules.map((mod) => {
          const Icon = mod.icon;
          return (
            <Link
              key={mod.label}
              to={mod.path}
              className="p-3 rounded-2xl border border-slate-200/80 hover:border-emerald-500/50 hover:bg-emerald-50/50 flex flex-col items-center justify-center gap-2 transition-all shadow-2xs hover-card-elevate group text-center"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition-colors">
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-900 leading-tight">
                {mod.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardModulesNav;
