import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Clock,
  UserCheck,
  ShieldCheck,
  Ticket,
  ClipboardList,
  Edit3,
  CheckCircle2,
  Cpu,
  Award,
  BarChart3
} from 'lucide-react';

const EXAM_NAV_ITEMS = [
  { label: 'Dashboard', path: '/examinations/controller', icon: LayoutDashboard },
  { label: 'Calendar', path: '/examinations/calendar', icon: Calendar },
  { label: 'Scheduling', path: '/examinations/scheduling', icon: Clock },
  { label: 'Registrations', path: '/examinations/registrations', icon: UserCheck },
  { label: 'Eligibility', path: '/examinations/eligibility', icon: ShieldCheck },
  { label: 'Hall Tickets', path: '/examinations/hall-tickets', icon: Ticket },
  { label: 'Attendance', path: '/examinations/attendance', icon: ClipboardList },
  { label: 'Marks Entry', path: '/examinations/marks-entry', icon: Edit3 },
  { label: 'Verification', path: '/examinations/marks-verification', icon: CheckCircle2 },
  { label: 'Processing', path: '/examinations/results-processing', icon: Cpu },
  { label: 'Results', path: '/examinations/results', icon: Award },
  { label: 'Reports', path: '/examinations/reports', icon: BarChart3 }
];

export const ExamNavHeader = ({ title, subtitle, actionButton }) => {
  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 rounded-full">
              Examination Controller Office
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>
        {actionButton && <div>{actionButton}</div>}
      </div>

      {/* Navigation Sub-bar */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
        {EXAM_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`
              }
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};

export default ExamNavHeader;

