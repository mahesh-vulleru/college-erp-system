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
  CheckCircle,
  Eye,
  EyeOff,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Notification from '../components/common/Notification';
import { ROLES, ROLE_LABELS } from '@college-erp/shared';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, login } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user?.role) {
      navigate(getDashboardPath(user.role), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Selected role state - default to 'student'
  const [selectedRole, setSelectedRole] = useState(ROLES.STUDENT);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [detectedRole, setDetectedRole] = useState(null);

  // 6 Selectable Institutional Roles
  const rolesList = [
    {
      id: ROLES.SUPER_ADMIN,
      label: 'Super Admin',
      title: ROLE_LABELS[ROLES.SUPER_ADMIN] || 'Super Administrator',
      desc: 'System setup, security audit, and user accounts',
      icon: ShieldAlert,
      dashboard: '/admin'
    },
    {
      id: ROLES.PRINCIPAL,
      label: 'Principal',
      title: ROLE_LABELS[ROLES.PRINCIPAL] || 'Principal / Management',
      desc: 'Institutional analytics and executive governance',
      icon: Building2,
      dashboard: '/principal'
    },
    {
      id: ROLES.HOD,
      label: 'HOD',
      title: ROLE_LABELS[ROLES.HOD] || 'Head of Department',
      desc: 'Curriculum, timetables, and faculty loads',
      icon: Users,
      dashboard: '/hod'
    },
    {
      id: ROLES.FACULTY,
      label: 'Faculty',
      title: ROLE_LABELS[ROLES.FACULTY] || 'Faculty Member',
      desc: 'Class attendance and internal exam marks',
      icon: CalendarCheck,
      dashboard: '/faculty'
    },
    {
      id: ROLES.STUDENT,
      label: 'Student',
      title: ROLE_LABELS[ROLES.STUDENT] || 'Student',
      desc: 'Attendance percentage, grade cards, and fee receipts',
      icon: GraduationCap,
      dashboard: '/student'
    },
    {
      id: ROLES.ACCOUNTS,
      label: 'Accounts',
      title: ROLE_LABELS[ROLES.ACCOUNTS] || 'Accounts & Finance',
      desc: 'Fee structures, receipts, and collection ledgers',
      icon: CreditCard,
      dashboard: '/accounts'
    }
  ];

  // Development-only sample credential fixtures (verified against seeded database accounts)
  const devCredentials = {
    [ROLES.SUPER_ADMIN]: 'admin@college.edu',
    [ROLES.PRINCIPAL]: 'principal@college.edu',
    [ROLES.HOD]: 'hod.cse@college.edu',
    [ROLES.FACULTY]: 'faculty.turing@college.edu',
    [ROLES.STUDENT]: 'student.aarav@college.edu',
    [ROLES.ACCOUNTS]: 'accounts@college.edu'
  };

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    setDetectedRole(null);
    setError(''); // clear previous errors when switching roles
  };

  const handleFillDevCredentials = () => {
    const devEmail = devCredentials[selectedRole] || '';
    setEmail(devEmail);
    setPassword(selectedRole === ROLES.SUPER_ADMIN ? 'Admin@12345' : 'Password123!');
    setDetectedRole(null);
    setError('');
  };

  const getDashboardPath = (role) => {
    const normalized = (role || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
    switch (normalized) {
      case 'super_admin':
      case 'superadmin':
      case 'super_administrator':
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
      default:
        return '/';
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
      // Send selected role along with credentials for server-side verification
      const response = await login(cleanEmail, password, selectedRole);

      // Successfully authenticated: navigate directly to the correct role dashboard
      const targetRole = response?.user?.role || selectedRole;
      const targetPath = getDashboardPath(targetRole);

      navigate(targetPath, { replace: true });
    } catch (err) {
      const errMsg = err.message || 'Authentication failed. Please verify your credentials and selected role.';
      setError(errMsg);

      // Detect role mismatch from server response data or message
      const registered = err.data?.registeredRole;
      if (registered && Object.values(ROLES).includes(registered)) {
        setDetectedRole(registered);
      } else {
        const match = errMsg.match(/registered as '([^']+)'/i);
        if (match && match[1]) {
          const rawRole = match[1].toLowerCase().trim().replace(/[\s-]+/g, '_');
          const matchedRole = Object.values(ROLES).find((r) => r === rawRole) ||
            (rawRole === 'super_administrator' ? ROLES.SUPER_ADMIN : null);
          if (matchedRole && matchedRole !== selectedRole) {
            setDetectedRole(matchedRole);
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const selectedRoleMeta = rolesList.find((r) => r.id === selectedRole) || rolesList[4];
  const detectedRoleMeta = detectedRole ? rolesList.find((r) => r.id === detectedRole) : null;

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background radial glows */}
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-navy-700/20 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-2xl z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2 mb-8">
          <Link to="/" className="inline-block group">
            <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center mx-auto shadow-elevation shadow-teal-950/40 group-hover:bg-teal-500 transition-colors">
              <GraduationCap className="w-8 h-8" />
            </div>
          </Link>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Apex Engineering College
          </h2>
          <p className="text-xs sm:text-sm text-navy-300 font-light">
            Unified Institutional ERP &bull; Role-Based Access Gateway
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-white py-8 px-6 sm:px-10 shadow-elevation rounded-2xl border border-navy-100">
          {error && (
            <Notification
              type="error"
              message={error}
              onClose={() => {
                setError('');
                setDetectedRole(null);
              }}
              className={detectedRole ? 'mb-3' : 'mb-6'}
            />
          )}

          {/* 1-Click Role Switch Helper Banner on Mismatch */}
          {detectedRole && detectedRoleMeta && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-300 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-subtle">
              <div className="text-xs text-amber-900">
                <span className="font-bold text-amber-950 block text-sm mb-0.5">Role Switch Required</span>
                This account is assigned to the <strong>{detectedRoleMeta.label}</strong> role. Click below to switch and continue.
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedRole(detectedRole);
                  setDetectedRole(null);
                  setError('');
                }}
                className="inline-flex items-center justify-center px-3.5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-subtle transition-colors shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Switch to {detectedRoleMeta.label}
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Six Selectable Roles Grid */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="block text-xs font-bold text-navy-800 uppercase tracking-wider">
                  Select Institutional Role <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-teal-700 font-semibold">
                  Selected: {selectedRoleMeta.title}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {rolesList.map((role) => {
                  const Icon = role.icon;
                  const isSelected = selectedRole === role.id;

                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => handleRoleSelect(role.id)}
                      className={`relative p-3 rounded-xl border text-left transition-all duration-150 focus:outline-none flex flex-col justify-between ${
                        isSelected
                          ? 'border-teal-600 bg-teal-50/80 ring-2 ring-teal-500/20 shadow-subtle'
                          : 'border-navy-200 bg-warm-50 hover:border-navy-300 hover:bg-white text-navy-700'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            isSelected ? 'bg-teal-600 text-white' : 'bg-navy-100 text-navy-700'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        {isSelected && (
                          <CheckCircle className="w-4 h-4 text-teal-600" />
                        )}
                      </div>

                      <div>
                        <span className={`block text-xs font-bold ${
                          isSelected ? 'text-teal-950' : 'text-navy-900'
                        }`}>
                          {role.label}
                        </span>
                        <span className="block text-[10px] text-navy-500 font-light truncate mt-0.5">
                          {role.desc}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Institutional Email & Password Credentials */}
            <div className="space-y-4 pt-2 border-t border-navy-100">
              <Input
                label="Institutional Email Address"
                id="email"
                name="email"
                type="email"
                required
                placeholder="e.g. principal@college.edu or student01@college.edu"
                icon={Mail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <div className="w-full">
                <label className="block text-xs font-semibold text-navy-700 uppercase tracking-wider mb-1.5">
                  Confidential Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative rounded-lg shadow-subtle">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-navy-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your confidential password"
                    className="block w-full rounded-lg border border-navy-200 bg-white pl-9 pr-10 py-2.5 text-sm text-navy-900 placeholder-navy-300 hover:border-navy-300 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-navy-400 hover:text-navy-700"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="teal"
              size="lg"
              isLoading={isLoading}
              className="w-full shadow-elevation text-sm font-bold"
              icon={ArrowRight}
              iconPosition="right"
            >
              Sign In as {selectedRoleMeta.label}
            </Button>
          </form>

          {/* Development-Only Presets (Strictly removed in production builds) */}
          {import.meta.env.DEV && (
            <div className="mt-6 pt-5 border-t border-navy-100 bg-warm-50/70 p-3.5 rounded-xl border border-navy-200/60">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center font-semibold text-navy-800">
                  <Sparkles className="w-3.5 h-3.5 mr-1.5 text-teal-600" />
                  <span>Dev Helper: Test {selectedRoleMeta.label} Credentials</span>
                </span>
                <button
                  type="button"
                  onClick={handleFillDevCredentials}
                  className="px-2.5 py-1 text-[11px] font-semibold text-teal-700 hover:text-teal-900 bg-white hover:bg-teal-50 border border-teal-200 rounded-lg transition-colors shadow-subtle"
                >
                  Autofill Credentials
                </button>
              </div>
              <p className="text-[10px] text-navy-500 mt-1.5 font-mono">
                Email: <code>{devCredentials[selectedRole]}</code> &bull; Password: <code>{selectedRole === ROLES.SUPER_ADMIN ? 'Admin@12345' : 'Password123!'}</code>
              </p>
            </div>
          )}

          {/* Return to Public Landing Page */}
          <div className="mt-6 pt-4 border-t border-navy-100 text-center">
            <Link
              to="/"
              className="text-xs font-medium text-navy-500 hover:text-navy-900 transition-colors"
            >
              &larr; Return to Apex Engineering College Public Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
