import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  GraduationCap,
  Lock,
  Mail,
  ArrowRight,
  ShieldAlert,
  Building2,
  Users,
  CalendarCheck,
  CreditCard,
  Coins,
  CheckCircle,
  Eye,
  EyeOff,
  Sparkles,
  BookOpen,
  BookCheck,
  GitBranch,
  RefreshCw,
  Bus,
  Activity,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Notification from '../components/common/Notification';
import { ROLES, ROLE_LABELS } from '@college-erp/shared';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, login } = useAuth();

  const getDashboardPath = (role) => {
    const normalized = (role || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
    switch (normalized) {
      case 'super_admin':
      case 'superadmin':
      case 'super_administrator':
      case 'admin':
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
      case 'librarian':
        return '/library';
      case 'library_staff':
      case 'librarystaff':
        return '/library-staff';
      case 'transport_admin':
      case 'transportadmin':
        return '/transport/admin';
      case 'transport_supervisor':
      case 'transportsupervisor':
        return '/transport/supervisor';
      case 'bus_driver':
      case 'driver':
        return '/transport/driver';
      case 'bus_attendant':
      case 'attendant':
        return '/transport/attendant';
      case 'parent':
        return '/transport/parent';
      default:
        return '/principal';
    }
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user?.role) {
      navigate(getDashboardPath(user.role), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Selected role state
  const [selectedRole, setSelectedRole] = useState(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const roleParam = searchParams.get('role');
      if (roleParam) {
        const normalized = roleParam.toLowerCase().trim().replace(/[\s-]+/g, '_');
        if (normalized === 'admin' || normalized === 'super_admin' || normalized === 'superadmin') {
          return ROLES.SUPER_ADMIN;
        }
        const matched = Object.values(ROLES).find((r) => r === normalized);
        if (matched) return matched;
      }
    } catch {
      // fallback
    }

    if (location.state?.from?.pathname?.includes('admin')) {
      return ROLES.SUPER_ADMIN;
    }
    return ROLES.PRINCIPAL;
  });

  const [activeCategory, setActiveCategory] = useState('all'); // 'all', 'institutional', 'transport'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [detectedRole, setDetectedRole] = useState(null);

  // All 13 Roles: 8 Institutional + 5 Transport
  const rolesList = useMemo(() => [
    // 8 Institutional Roles
    {
      id: ROLES.SUPER_ADMIN,
      label: 'Super Admin',
      title: 'Super Administrator',
      desc: 'System setup, security audit & user accounts',
      icon: ShieldAlert,
      category: 'institutional',
      dashboard: '/admin'
    },
    {
      id: ROLES.PRINCIPAL,
      label: 'Principal',
      title: 'Principal / Management',
      desc: 'Institutional analytics & executive governance',
      icon: Building2,
      category: 'institutional',
      dashboard: '/principal'
    },
    {
      id: ROLES.HOD,
      label: 'HOD',
      title: 'Head of Department',
      desc: 'Curriculum, timetables & faculty loads',
      icon: GitBranch,
      category: 'institutional',
      dashboard: '/hod'
    },
    {
      id: ROLES.FACULTY,
      label: 'Faculty',
      title: 'Faculty Member',
      desc: 'Class attendance & internal exam marks',
      icon: GraduationCap,
      category: 'institutional',
      dashboard: '/faculty'
    },
    {
      id: ROLES.STUDENT,
      label: 'Student',
      title: 'Student',
      desc: 'Attendance %, grade cards & fee receipts',
      icon: Users,
      category: 'institutional',
      dashboard: '/student'
    },
    {
      id: ROLES.ACCOUNTS,
      label: 'Accounts',
      title: 'Accounts & Finance',
      desc: 'Fee structures, receipts & collection ledgers',
      icon: Coins,
      category: 'institutional',
      dashboard: '/accounts'
    },
    {
      id: ROLES.LIBRARIAN,
      label: 'Librarian',
      title: 'Chief Librarian',
      desc: 'Catalog, book issues, returns & fines',
      icon: BookOpen,
      category: 'institutional',
      dashboard: '/library'
    },
    {
      id: ROLES.LIBRARY_STAFF,
      label: 'Library Staff',
      title: 'Library Staff',
      desc: 'Book circulation, issue, return & reservation',
      icon: BookCheck,
      category: 'institutional',
      dashboard: '/library-staff'
    },

    // 5 Transport Roles
    {
      id: ROLES.TRANSPORT_ADMIN,
      label: 'Transport Admin',
      title: 'Transport Administrator',
      desc: 'Fleet command, bus routes, driver rosters & allocations',
      icon: Bus,
      category: 'transport',
      dashboard: '/transport/admin'
    },
    {
      id: ROLES.TRANSPORT_SUPERVISOR,
      label: 'Transport Supervisor',
      title: 'Transport Operations Supervisor',
      desc: 'Transit dispatch, bus monitoring, driver rosters & trip scheduling',
      icon: Activity,
      category: 'transport',
      dashboard: '/transport/supervisor'
    },
    {
      id: ROLES.BUS_DRIVER,
      label: 'Bus Driver',
      title: 'Bus Driver Transit Console',
      desc: 'Active trip execution, GPS sharing & student boarding checklist',
      icon: Bus,
      category: 'transport',
      dashboard: '/transport/driver'
    },
    {
      id: ROLES.BUS_ATTENDANT,
      label: 'Bus Attendant',
      title: 'Student Transit Care Attendant',
      desc: 'Student bus boarding, safety checklist & guardian contacts',
      icon: UserCheck,
      category: 'transport',
      dashboard: '/transport/attendant'
    },
    {
      id: ROLES.PARENT,
      label: 'Parent',
      title: 'Parent & Guardian Portal',
      desc: 'Real-time school bus tracking, child attendance & academic fees',
      icon: Users,
      category: 'transport',
      dashboard: '/transport/parent'
    }
  ], []);

  // Demo credential mapping
  const devCredentials = {
    [ROLES.SUPER_ADMIN]: 'admin@college.edu',
    [ROLES.PRINCIPAL]: 'principal@college.edu',
    [ROLES.HOD]: 'hod.cse@college.edu',
    [ROLES.FACULTY]: 'faculty.turing@college.edu',
    [ROLES.STUDENT]: 'student.aarav@college.edu',
    [ROLES.ACCOUNTS]: 'accounts@college.edu',
    [ROLES.LIBRARIAN]: 'librarian@college.edu',
    [ROLES.LIBRARY_STAFF]: 'librarystaff@college.edu',
    [ROLES.TRANSPORT_ADMIN]: 'transport@college.edu',
    [ROLES.TRANSPORT_SUPERVISOR]: 'supervisor@college.edu',
    [ROLES.BUS_DRIVER]: 'driver@college.edu',
    [ROLES.BUS_ATTENDANT]: 'attendant@college.edu',
    [ROLES.PARENT]: 'parent@college.edu'
  };

  const filteredRoles = useMemo(() => {
    if (activeCategory === 'institutional') {
      return rolesList.filter((r) => r.category === 'institutional');
    }
    if (activeCategory === 'transport') {
      return rolesList.filter((r) => r.category === 'transport');
    }
    return rolesList;
  }, [activeCategory, rolesList]);

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    setDetectedRole(null);
    setError('');
  };

  const handleFillDevCredentials = (roleId = null) => {
    const target = roleId || selectedRole;
    setSelectedRole(target);
    const devEmail = devCredentials[target] || '';
    setEmail(devEmail);
    if (target === ROLES.SUPER_ADMIN) {
      setPassword('Admin@12345');
    } else if (target === ROLES.LIBRARIAN) {
      setPassword('Library@2026#');
    } else {
      setPassword('Password123!');
    }
    setDetectedRole(null);
    setError('');
  };

  const handleEmailChange = (val) => {
    setEmail(val);
    const lower = (val || '').toLowerCase().trim();
    if (lower.startsWith('admin') || lower === 'admin@college.edu') {
      if (selectedRole !== ROLES.SUPER_ADMIN) setSelectedRole(ROLES.SUPER_ADMIN);
    } else if (lower.startsWith('principal')) {
      if (selectedRole !== ROLES.PRINCIPAL) setSelectedRole(ROLES.PRINCIPAL);
    } else if (lower.startsWith('hod')) {
      if (selectedRole !== ROLES.HOD) setSelectedRole(ROLES.HOD);
    } else if (lower.startsWith('faculty')) {
      if (selectedRole !== ROLES.FACULTY) setSelectedRole(ROLES.FACULTY);
    } else if (lower.startsWith('student')) {
      if (selectedRole !== ROLES.STUDENT) setSelectedRole(ROLES.STUDENT);
    } else if (lower.startsWith('account')) {
      if (selectedRole !== ROLES.ACCOUNTS) setSelectedRole(ROLES.ACCOUNTS);
    } else if (lower.startsWith('librarystaff') || lower.startsWith('libstaff') || lower === 'librarystaff@college.edu') {
      if (selectedRole !== ROLES.LIBRARY_STAFF) setSelectedRole(ROLES.LIBRARY_STAFF);
    } else if (lower.startsWith('librarian') || lower === 'librarian@college.edu') {
      if (selectedRole !== ROLES.LIBRARIAN) setSelectedRole(ROLES.LIBRARIAN);
    } else if (lower.startsWith('transport') || lower === 'transport@college.edu') {
      if (selectedRole !== ROLES.TRANSPORT_ADMIN) setSelectedRole(ROLES.TRANSPORT_ADMIN);
    } else if (lower.startsWith('supervisor') || lower === 'supervisor@college.edu') {
      if (selectedRole !== ROLES.TRANSPORT_SUPERVISOR) setSelectedRole(ROLES.TRANSPORT_SUPERVISOR);
    } else if (lower.startsWith('driver') || lower === 'driver@college.edu') {
      if (selectedRole !== ROLES.BUS_DRIVER) setSelectedRole(ROLES.BUS_DRIVER);
    } else if (lower.startsWith('attendant') || lower === 'attendant@college.edu') {
      if (selectedRole !== ROLES.BUS_ATTENDANT) setSelectedRole(ROLES.BUS_ATTENDANT);
    } else if (lower.startsWith('parent') || lower === 'parent@college.edu') {
      if (selectedRole !== ROLES.PARENT) setSelectedRole(ROLES.PARENT);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setError('');
    setDetectedRole(null);

    const cleanEmail = (email || '').trim();
    if (!cleanEmail || !password) {
      setError('Please provide both your registered institutional email and password.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await login({
        email: cleanEmail,
        password,
        role: selectedRole
      });

      if (!result.success) {
        if (result.code === 'AUTH_ROLE_MISMATCH' && result.detectedRole) {
          setDetectedRole(result.detectedRole);
          setError(result.error);
        } else {
          setError(result.error || 'Authentication failed. Please verify credentials.');
        }
        return;
      }

      const userRole = result.user?.role || selectedRole;
      navigate(getDashboardPath(userRole), { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to connect to authorization service.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedRoleMeta = rolesList.find((r) => r.id === selectedRole) || rolesList[1];
  const detectedRoleMeta = detectedRole ? rolesList.find((r) => r.id === detectedRole) : null;

  return (
    <div className="min-h-screen bg-[#072c1f] flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Decorative ambient background glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-3xl relative z-10">
        {/* Institutional Branding Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="text-left">
              <span className="text-xl sm:text-2xl font-black text-white tracking-tight block leading-tight">
                College ERP
              </span>
              <span className="text-xs text-emerald-300 font-medium tracking-wide block">
                Apex Engineering College &bull; Campus Portal
              </span>
            </div>
          </Link>
          <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Role-Based Secure Login
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-emerald-100/80 max-w-md mx-auto">
            Choose your institutional or transport role to access your dedicated dashboard.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 p-5 sm:p-8 backdrop-blur-md mb-6">
          {error && (
            <div className="mb-5">
              <Notification
                type="error"
                message={error}
                onClose={() => setError('')}
              />
            </div>
          )}

          {/* Role Mismatch Recovery Banner */}
          {detectedRole && detectedRoleMeta && (
            <div className="mb-5 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in text-xs">
              <div>
                <p className="font-bold text-amber-950">
                  Role Mismatch Detected
                </p>
                <p className="text-amber-800 mt-0.5">
                  Your credentials belong to the <strong>{detectedRoleMeta.label}</strong> portal.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedRole(detectedRole);
                  setDetectedRole(null);
                  setError('');
                }}
                className="inline-flex items-center justify-center px-3.5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-subtle transition-colors shrink-0 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Sign in as {detectedRoleMeta.label}
              </button>
            </div>
          )}

          {/* Role Category Tabs */}
          <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
            <label className="text-xs font-bold text-slate-800 tracking-wide uppercase text-[11px]">
              1. Select Authorized Portal <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  activeCategory === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Roles (13)
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('institutional')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  activeCategory === 'institutional' ? 'bg-white text-emerald-800 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Institutional (8)
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('transport')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  activeCategory === 'transport' ? 'bg-white text-emerald-800 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Transport & Fleet (5)
              </button>
            </div>
          </div>

          {/* Role Selection Grid */}
          <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {filteredRoles.map((r) => {
              const Icon = r.icon;
              const isSelected = selectedRole === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleRoleSelect(r.id)}
                  className={`p-3 rounded-2xl text-left border transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-[#064e3b] text-white border-[#064e3b] shadow-xs ring-2 ring-emerald-500/20'
                      : 'bg-slate-50 border-slate-200 hover:border-emerald-300 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                        isSelected ? 'bg-emerald-500/30 text-white' : 'bg-white text-slate-600 shadow-2xs'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    {isSelected && (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-300" />
                    )}
                  </div>
                  <div>
                    <span className={`text-xs font-bold block leading-tight ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                      {r.label}
                    </span>
                    <span className={`text-[10px] leading-tight line-clamp-1 mt-0.5 ${isSelected ? 'text-emerald-200' : 'text-slate-500'}`}>
                      {r.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Demo Credentials Bar */}
          <div className="mb-6 p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="text-emerald-900 font-medium">
              Logging into <strong className="font-bold text-emerald-950">{selectedRoleMeta.title}</strong>
            </div>
            <button
              type="button"
              onClick={() => handleFillDevCredentials(selectedRole)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-all self-start sm:self-auto cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" /> Auto-Fill Demo Credentials
            </button>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder="e.g. principal@college.edu"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800 block">
                  Password
                </label>
                <span className="text-[11px] text-slate-400 font-medium">Min 6 characters</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your security password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5 font-mono">
                Email: <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded font-semibold">{devCredentials[selectedRole]}</code> &bull; Password: <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded font-semibold">{selectedRole === ROLES.SUPER_ADMIN ? 'Admin@12345' : selectedRole === ROLES.LIBRARIAN ? 'Library@2026#' : 'Password123!'}</code>
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <span>Verifying Credentials...</span>
                ) : (
                  <>
                    <span>Sign In to {selectedRoleMeta.label} Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Switcher Chips */}
          <div className="mt-6 pt-5 border-t border-slate-100 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Quick 1-Click Role Logins (All 13 Roles):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {rolesList.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleFillDevCredentials(r.id)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-700 transition-colors cursor-pointer"
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Back to Public Site */}
        <div className="text-center text-xs text-emerald-200/70">
          <Link to="/" className="hover:text-white transition-colors">
            &larr; Return to Public College Website
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
