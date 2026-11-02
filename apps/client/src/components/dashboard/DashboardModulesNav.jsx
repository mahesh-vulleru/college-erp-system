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
  Layers
} from 'lucide-react';

const MODULES = [
  { label: 'Institution', icon: Building2, path: '/departments' },
  { label: 'Academics', icon: GraduationCap, path: '/courses' },
  { label: 'Students', icon: Users, path: '/students' },
  { label: 'Faculty', icon: UserCheck, path: '/faculty' },
  { label: 'Examinations', icon: FileEdit, path: '/examinations' },
  { label: 'Attendance', icon: CalendarCheck, path: '/attendance' },
  { label: 'Timetable', icon: Clock, path: '/timetable' },
  { label: 'Fee & Accounts', icon: CreditCard, path: '/fees' },
  { label: 'Library', icon: BookMarked, path: '/library' },
  { label: 'Transport', icon: Bus, path: '/transport' },
  { label: 'Hostel', icon: BedDouble, path: '/hostel' },
  { label: 'Placements', icon: Briefcase, path: '/placements' },
  { label: 'Reports', icon: BarChart3, path: '/reports' },
  { label: 'Settings', icon: Settings, path: '/settings' }
];

export const DashboardModulesNav = () => {
  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
      <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100">
        <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
          <Layers className="w-4 h-4" />
        </div>
        <h3 className="text-sm font-bold text-slate-900">Modules (Quick Navigation)</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
        {MODULES.map((mod) => {
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

