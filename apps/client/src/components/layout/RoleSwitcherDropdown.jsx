import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldAlert,
  Building2,
  GitBranch,
  UserCheck,
  GraduationCap,
  Coins,
  BookOpen,
  BookCheck,
  ChevronDown,
  CheckCircle2,
  Bus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES, ROLE_LABELS } from '@college-erp/shared';

const ROLES_LIST = [
  {
    id: ROLES.SUPER_ADMIN,
    name: 'Super Admin',
    desc: 'System setup, security audit, and user accounts',
    icon: ShieldAlert,
    path: '/admin'
  },
  {
    id: ROLES.PRINCIPAL,
    name: 'Principal',
    desc: 'Institutional analytics and executive governance',
    icon: Building2,
    path: '/principal'
  },
  {
    id: ROLES.HOD,
    name: 'HOD',
    desc: 'Curriculum, timetables, and faculty loads',
    icon: GitBranch,
    path: '/hod'
  },
  {
    id: ROLES.FACULTY,
    name: 'Faculty',
    desc: 'Class attendance and internal exam marks',
    icon: UserCheck,
    path: '/faculty'
  },
  {
    id: ROLES.STUDENT,
    name: 'Student',
    desc: 'Attendance percentage, grade cards, and fee receipts',
    icon: GraduationCap,
    path: '/student'
  },
  {
    id: ROLES.ACCOUNTS,
    name: 'Accounts',
    desc: 'Fee structures, receipts, and collection ledgers',
    icon: Coins,
    path: '/accounts'
  },
  {
    id: ROLES.LIBRARIAN,
    name: 'Librarian',
    desc: 'Catalog, book issues, returns, and fines',
    icon: BookOpen,
    path: '/library'
  },
  {
    id: ROLES.LIBRARY_STAFF,
    name: 'Library Staff',
    desc: 'Book circulation, issue, return and reservation operations',
    icon: BookCheck,
    path: '/library-staff'
  },
  {
    id: ROLES.TRANSPORT_ADMIN,
    name: 'Transport Admin',
    desc: 'Fleet monitoring, bus routes, drivers, and tracking',
    icon: Bus,
    path: '/transport'
  }
];

const TRANSPORT_ROLES_MAP = {
  [ROLES.TRANSPORT_ADMIN]: {
    id: ROLES.TRANSPORT_ADMIN,
    name: 'Transport Admin',
    desc: 'Fleet monitoring, bus routes, drivers, and tracking',
    icon: Bus,
    path: '/transport'
  },
  [ROLES.TRANSPORT_SUPERVISOR]: {
    id: ROLES.TRANSPORT_SUPERVISOR,
    name: 'Transport Supervisor',
    desc: 'Daily transit schedules, trips, and dispatch operations',
    icon: Bus,
    path: '/transport?tab=supervisor'
  },
  [ROLES.BUS_DRIVER]: {
    id: ROLES.BUS_DRIVER,
    name: 'Bus Driver',
    desc: 'Daily driver transit console and trip updates',
    icon: Bus,
    path: '/transport?tab=driver_portal'
  },
  [ROLES.BUS_ATTENDANT]: {
    id: ROLES.BUS_ATTENDANT,
    name: 'Bus Attendant',
    desc: 'Student bus boarding and transit attendance check',
    icon: Bus,
    path: '/transport?tab=attendance'
  },
  [ROLES.PARENT]: {
    id: ROLES.PARENT,
    name: 'Parent / Guardian',
    desc: 'Student transport tracking and arrival notifications',
    icon: Bus,
    path: '/transport?tab=parent'
  }
};

export const RoleSwitcherDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Determine current active role from authenticated user
  const currentRole = (user?.role || '').toLowerCase().trim().replace(/[\s-]+/g, '_');

  const getCurrentRoleInfo = () => {
    // 1. Direct match on transport roles
    if (TRANSPORT_ROLES_MAP[currentRole]) {
      return TRANSPORT_ROLES_MAP[currentRole];
    }

    // 2. Direct match on pathname for navigation context
    const path = location.pathname;
    if (path.startsWith('/admin')) return ROLES_LIST[0];
    if (path.startsWith('/principal')) return ROLES_LIST[1];
    if (path.startsWith('/hod')) return ROLES_LIST[2];
    if (path.startsWith('/faculty')) return ROLES_LIST[3];
    if (path.startsWith('/student')) return ROLES_LIST[4];
    if (path.startsWith('/accounts') || path.startsWith('/fees')) return ROLES_LIST[5];
    if (path.startsWith('/library-staff')) return ROLES_LIST[7];
    if (path.startsWith('/library')) return ROLES_LIST[6];
    if (path.startsWith('/transport')) {
      return ROLES_LIST[8] || TRANSPORT_ROLES_MAP[ROLES.TRANSPORT_ADMIN];
    }

    // 3. Match user role in general list
    const found = ROLES_LIST.find((r) => r.id === currentRole);
    if (found) return found;

    // 4. Default fallback to user assigned role label if available
    if (ROLE_LABELS[currentRole]) {
      return {
        id: currentRole,
        name: ROLE_LABELS[currentRole],
        desc: 'Institutional user portal',
        icon: Building2,
        path: '/principal'
      };
    }

    return ROLES_LIST[1]; // Principal fallback
  };

  const activeRoleInfo = getCurrentRoleInfo();
  const IconComponent = activeRoleInfo.icon;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectRole = (role) => {
    setIsOpen(false);
    navigate(role.path);
  };

  const isSuperAdmin = currentRole === 'super_admin' || currentRole === 'admin' || currentRole === 'superadmin' || currentRole === 'super_administrator';

  // For non-superadmin users: display assigned role as a static, non-clickable label
  if (!isSuperAdmin) {
    const userRoleItem = TRANSPORT_ROLES_MAP[currentRole] || ROLES_LIST.find((r) => r.id === currentRole) || activeRoleInfo;
    const DisplayIcon = userRoleItem.icon || Building2;
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-[#072c1f] text-white text-xs sm:text-sm font-semibold tracking-wide shadow-xs border border-emerald-900/60 select-none">
        <DisplayIcon className="w-4 h-4 text-emerald-300 shrink-0" />
        <span className="truncate max-w-[140px] sm:max-w-none">{userRoleItem.name}</span>
      </div>
    );
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Role Pill Button for Super Admin */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-[#072c1f] hover:bg-[#0a3a2b] text-white text-xs sm:text-sm font-semibold tracking-wide transition-all shadow-xs border border-emerald-900/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer"
      >
        <IconComponent className="w-4 h-4 text-emerald-300 shrink-0" />
        <span className="truncate max-w-[120px] sm:max-w-none">{activeRoleInfo.name}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-emerald-300/80 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Floating Modal Popover */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200/90 z-50 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 tracking-wide">
              Select Institutional Role <span className="text-rose-500">*</span>
            </span>
            <span className="text-[10px] text-slate-500 font-medium">{ROLES_LIST.length} Portals Available</span>
          </div>

          {/* List of Roles */}
          <div className="p-2 space-y-1 max-h-[420px] overflow-y-auto">
            {ROLES_LIST.map((role) => {
              const RoleIcon = role.icon;
              const isCurrent = activeRoleInfo.id === role.id;

              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => handleSelectRole(role)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-3 group cursor-pointer ${
                    isCurrent
                      ? 'bg-emerald-50/80 border border-emerald-200/80'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      isCurrent
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-700'
                    }`}
                  >
                    <RoleIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold truncate ${isCurrent ? 'text-emerald-950' : 'text-slate-800'}`}>
                        {role.name}
                      </span>
                      {isCurrent && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-1" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug line-clamp-2 mt-0.5">
                      {role.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleSwitcherDropdown;
