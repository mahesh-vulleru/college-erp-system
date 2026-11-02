import React, { useState, useEffect } from 'react';
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
  GitBranch
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

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [detectedRole, setDetectedRole] = useState(null);

  // 8 Selectable Institutional Roles matching reference design
  const rolesList = [
    {
      id: ROLES.SUPER_ADMIN,
      label: 'Super Admin',
      title: 'Super Administrator',
      desc: 'System setup, security audit & user accounts',
      icon: ShieldAlert,
      dashboard: '/admin'
    },
    {
      id: ROLES.PRINCIPAL,
      label: 'Principal / Management',
      title: 'Principal',
      desc: 'Institutional analytics & executive governance',
      icon: Building2,
      dashboard: '/principal'
    },
    {
      id: ROLES.HOD,
      label: 'HOD',
      title: 'Head of Department',
      desc: 'Curriculum, timetables & faculty loads',
      icon: GitBranch,
      dashboard: '/hod'
    },
    {
      id: ROLES.FACULTY,
      label: 'Faculty',
      title: 'Faculty Member',
      desc: 'Class attendance & internal exam marks',
      icon: GraduationCap,
      dashboard: '/faculty'
    },
    {
      id: ROLES.STUDENT,
      label: 'Student',
      title: 'Student',
      desc: 'Attendance %, grade cards & fee receipts',
      icon: Users,
      dashboard: '/student'
    },
    {
      id: ROLES.ACCOUNTS,
      label: 'Accounts',
      title: 'Accounts & Finance',
      desc: 'Fee structures, receipts & collection ledgers',
      icon: Coins,
      dashboard: '/accounts'
    },
    {
      id: ROLES.LIBRARIAN,
      label: 'Librarian',
      title: 'Chief Librarian',
      desc: 'Catalog, book issues, returns & fines',
      icon: BookOpen,
      dashboard: '/library'
    },
    {
      id: ROLES.LIBRARY_STAFF,
      label: 'Library Staff',
      title: 'Library Staff',
      desc: 'Book circulation, issue, return & reservation',
      icon: BookCheck,
      dashboard: '/library-staff'
    }
  ];

  // Demo accounts
  const devCredentials = {
    [ROLES.SUPER_ADMIN]: 'admin@college.edu',
    [ROLES.PRINCIPAL]: 'principal@college.edu',
    [ROLES.HOD]: 'hod.cse@college.edu',
    [ROLES.FACULTY]: 'faculty.turing@college.edu',
    [ROLES.STUDENT]: 'student.aarav@college.edu',
    [ROLES.ACCOUNTS]: 'accounts@college.edu',
    [ROLES.LIBRARIAN]: 'librarian@college.edu',
    [ROLES.LIBRARY_STAFF]: 'librarystaff@college.edu'
  };

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
    } else if (lower.startsWith('librarystaff') || lower === 'librarystaff@college.edu') {
      if (selectedRole !== ROLES.LIBRARY_STAFF) setSelectedRole(ROLES.LIBRARY_STAFF);
    } else if (lower.startsWith('librarian') || lower === 'librarian@college.edu') {
      if (selectedRole !== ROLES.LIBRARIAN) setSelectedRole(ROLES.LIBRARIAN);
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
      const response = await login(cleanEmail, password, selectedRole);
      const targetRole = response?.user?.role || selectedRole;
      const targetPath = getDashboardPath(targetRole);
      navigate(targetPath, { replace: true });
    } catch (err) {
      const errMsg = err.message || 'Authentication failed. Please verify your credentials and selected role.';
      setError(errMsg);

      const registered = err.data?.registeredRole;
      if (registered && Object.values(ROLES).includes(registered)) {
        setDetectedRole(registered);
        setSelectedRole(registered);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const selectedRoleMeta = rolesList.find((r) => r.id === selectedRole) || rolesList[1];

  return (
    <div className="min-h-screen bg-[#062a1e] text-white flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background ambient accents */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-4xl z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block group">
            <div className="w-13 h-13 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg group-hover:scale-105 transition-all">
              <GraduationCap className="w-8 h-8 text-emerald-300" />
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            College ERP System
          </h1>
          <p className="text-xs sm:text-sm text-emerald-200/70 font-normal">
            Institutional Role-Based Gateway &bull; Secure Authentication
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white text-slate-900 py-7 px-5 sm:px-8 shadow-2xl rounded-3xl border border-slate-200/80">
          {error && (
            <Notification
              type="error"
              message={error}
              onClose={() => {
                setError('');
                setDetectedRole(null);
              }}
              className="mb-5"
            />
          )}

          {/* Role Selection Grid */}
          <div className="mb-6 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 tracking-wide uppercase text-[11px]">
                1. Select Institutional Role <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-500">8 Roles Available</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {rolesList.map((r) => {
                const Icon = r.icon;
                const isSelected = selectedRole === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleRoleSelect(r.id)}
                    className={`p-3 rounded-2xl text-left border transition-all flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'bg-[#064e3b] text-white border-[#064e3b] shadow-xs'
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
          </div>

          {/* Quick Demo Credentials Bar */}
          <div className="mb-6 p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="text-emerald-900 font-medium">
              Logging into <strong className="font-bold text-emerald-950">{selectedRoleMeta.title}</strong>
            </div>
            <button
              type="button"
              onClick={() => handleFillDevCredentials(selectedRole)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-all self-start sm:self-auto"
            >
              <Sparkles className="w-3.5 h-3.5" /> Auto-Fill Demo Credentials
            </button>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                Institutional Email
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
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
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
              Quick 1-Click Role Logins (Demo Fixtures):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {rolesList.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleFillDevCredentials(r.id)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-700 transition-colors"
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
