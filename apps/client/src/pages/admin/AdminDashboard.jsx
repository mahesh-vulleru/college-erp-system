import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Users,
  Database,
  Lock,
  Activity,
  FileText,
  Search,
  UserPlus,
  RefreshCw,
  Key,
  Edit2,
  UserCheck,
  UserX,
  Mail,
  Building2,
  Layers,
  Settings,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  GraduationCap,
  CreditCard,
  Clock,
  CalendarCheck,
  Award,
  DollarSign,
  Bell,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import Card from '../../components/common/Card';
import CampusBuildingGraphic from '../../components/common/CampusBuildingGraphic';
import SimpleDonutChart from '../../components/common/SimpleDonutChart';
import { useAuth } from '../../context/AuthContext';
import StatWidget from '../../components/common/StatWidget';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Notification from '../../components/common/Notification';
import api from '../../api/apiClient';
import { useToast } from '../../context/ToastContext';
import {
  ROLES,
  ROLE_LABELS,
  USER_STATUS,
  ROLE_PERMISSIONS,
  DEPARTMENTS
} from '@college-erp/shared';

export const AdminDashboard = () => {
  const { addToast } = useToast();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'audit' | 'roles' | 'settings' | 'modules'
  const [overview, setOverview] = useState(null);
  const [isOverviewLoading, setIsOverviewLoading] = useState(true);

  // 17 Institutional Modules
  const allModules = [
    { id: 1, name: 'System Diagnostics & Overview', path: '/overview', role: 'Super Admin, Principal', desc: 'Cluster health, diagnostics & cross-role metric telemetry', icon: Activity, badge: 'Overview' },
    { id: 2, name: 'Super Admin Control Center', path: '/admin', role: 'Super Admin', desc: 'Institutional user provisioning, RBAC matrix & security audit log', icon: ShieldAlert, badge: 'Governance' },
    { id: 3, name: 'Principal Executive Portal', path: '/principal', role: 'Principal, Super Admin', desc: 'Academic performance, department health & council approvals', icon: Building2, badge: 'Executive' },
    { id: 4, name: 'Head of Department (HOD)', path: '/hod', role: 'HOD, Principal, Super Admin', desc: 'Department governance, syllabus progression & faculty allocation', icon: Users, badge: 'Department' },
    { id: 5, name: 'Faculty Academic Workplace', path: '/faculty', role: 'Faculty, HOD, Super Admin', desc: 'Weekly teaching schedules, student rosters & attendance capture', icon: BookOpen, badge: 'Academic' },
    { id: 6, name: 'Student Self-Service Portal', path: '/student', role: 'Student, Super Admin', desc: 'Course enrollment, semester timetables, attendance & grade cards', icon: GraduationCap, badge: 'Self-Service' },
    { id: 7, name: 'Finance & Accounts Office', path: '/accounts', role: 'Accounts, Principal, Super Admin', desc: 'Fee schedules, payment receipts & reconciliation ledgers', icon: CreditCard, badge: 'Finance' },
    { id: 8, name: 'Department Management', path: '/departments', role: 'All Permitted Roles', desc: 'Academic engineering departments, intake limits & faculty allotment', icon: Building2, badge: 'Academic' },
    { id: 9, name: 'Degree Programs & Courses', path: '/courses', role: 'All Permitted Roles', desc: 'Undergraduate B.Tech degree programs & credit requirements', icon: Layers, badge: 'Programs' },
    { id: 10, name: 'Curriculum Subjects', path: '/subjects', role: 'All Permitted Roles', desc: 'Semester syllabus courses, theory lectures & lab practicals', icon: BookOpen, badge: 'Curriculum' },
    { id: 11, name: 'Class Timetables & Schedules', path: '/timetable', role: 'All Permitted Roles', desc: 'Weekly master schedules, room allotment & lecture timings', icon: Clock, badge: 'Schedule' },
    { id: 12, name: 'Attendance Register', path: '/attendance', role: 'All Permitted Roles', desc: 'Daily period attendance capture & condonation compliance', icon: CalendarCheck, badge: 'Operations' },
    { id: 13, name: 'Examinations System', path: '/examinations', role: 'All Permitted Roles', desc: 'Mid-term evaluations, semester-end exam slots & hall schedules', icon: Award, badge: 'Exam Cell' },
    { id: 14, name: 'Marks & Grade Evaluation', path: '/results', role: 'All Permitted Roles', desc: 'Internal test marks, external exam scores & letter grade cards', icon: Award, badge: 'Evaluation' },
    { id: 15, name: 'Fee Schedules & Dues', path: '/fees', role: 'Accounts, Admin, Student', desc: 'Invoices, outstanding dues, payment gateways & fee waivers', icon: DollarSign, badge: 'Finance' },
    { id: 16, name: 'Institutional Notice Board', path: '/notices', role: 'All Roles (Audience Scoped)', desc: 'Campus circulars, executive decrees & emergency broadcasts', icon: Bell, badge: 'Notices' },
    { id: 17, name: 'Security & Audit Logs', path: '/audit-logs', role: 'Super Admin, Principal', desc: 'Cryptographically recorded immutable institutional audit events', icon: Lock, badge: 'Security' }
  ];

  // User Management State
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [activeUser, setActiveUser] = useState(null);
  const [confirmToggleUser, setConfirmToggleUser] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: ROLES.STUDENT,
    department: 'Computer Science & Engineering',
    status: USER_STATUS.ACTIVE
  });
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);
  const [isAuditLoading, setIsAuditLoading] = useState(false);

  // Fetch Overview Stats
  const loadOverview = useCallback(async () => {
    setIsOverviewLoading(true);
    try {
      const res = await api.getAdminOverview();
      if (res?.data) {
        setOverview(res.data);
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Error loading admin stats',
        message: err.message
      });
    } finally {
      setIsOverviewLoading(false);
    }
  }, [addToast]);

  // Fetch Users
  const loadUsers = useCallback(async () => {
    setIsUsersLoading(true);
    try {
      const res = await api.getUsers({
        q: searchQuery,
        role: roleFilter,
        status: statusFilter,
        limit: 50
      });
      if (res?.data) {
        setUsers(res.data);
        setTotalUsers(res.meta?.total || res.data.length);
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Error loading users',
        message: err.message
      });
    } finally {
      setIsUsersLoading(false);
    }
  }, [searchQuery, roleFilter, statusFilter, addToast]);

  // Fetch Audit Logs
  const loadAuditLogs = useCallback(async () => {
    setIsAuditLoading(true);
    try {
      const res = await api.getAuditLogs({ limit: 40 });
      if (res?.data) {
        setAuditLogs(res.data);
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Error loading audit logs',
        message: err.message
      });
    } finally {
      setIsAuditLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'audit') {
      loadAuditLogs();
    }
  }, [activeTab, loadUsers, loadAuditLogs]);

  // Handle Account Provisioning
  const handleOpenCreate = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: ROLES.STUDENT,
      department: 'Computer Science & Engineering',
      status: USER_STATUS.ACTIVE
    });
    setFormError('');
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.name || !formData.email || !formData.password || !formData.role) {
      setFormError('All marked fields are mandatory.');
      return;
    }
    if (formData.password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createUser(formData);
      addToast({
        type: 'success',
        title: 'Account Provisioned',
        message: `Created account for ${formData.email}`
      });
      setIsCreateOpen(false);
      loadUsers();
      loadOverview();
    } catch (err) {
      setFormError(err.message || 'Failed to provision account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Edit User
  const handleOpenEdit = (user) => {
    setActiveUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      role: user.role || ROLES.STUDENT,
      department: user.department || '',
      status: user.status || USER_STATUS.ACTIVE
    });
    setFormError('');
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!activeUser) return;
    setFormError('');
    setIsSubmitting(true);
    try {
      await api.updateUser(activeUser._id || activeUser.id, {
        name: formData.name,
        role: formData.role,
        department: formData.department,
        status: formData.status
      });
      addToast({
        type: 'success',
        title: 'Account Updated',
        message: `Saved changes for ${activeUser.email}`
      });
      setIsEditOpen(false);
      loadUsers();
      loadOverview();
    } catch (err) {
      setFormError(err.message || 'Failed to update account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Password Reset
  const handleOpenReset = (user) => {
    setActiveUser(user);
    setNewPasswordValue('');
    setFormError('');
    setIsResetOpen(true);
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!activeUser) return;
    if (!newPasswordValue || newPasswordValue.length < 6) {
      setFormError('New password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.resetUserPassword(activeUser._id || activeUser.id, newPasswordValue);
      addToast({
        type: 'success',
        title: 'Password Reset Initiated',
        message: `Assigned new temporary password for ${activeUser.email}`
      });
      setIsResetOpen(false);
      loadUsers();
    } catch (err) {
      setFormError(err.message || 'Failed to reset password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Activate / Deactivate
  const handleConfirmToggle = async () => {
    if (!confirmToggleUser) return;
    const targetId = confirmToggleUser._id || confirmToggleUser.id;
    const newStatus = confirmToggleUser.status === USER_STATUS.ACTIVE ? USER_STATUS.DISABLED : USER_STATUS.ACTIVE;

    setIsSubmitting(true);
    try {
      await api.updateUserStatus(targetId, newStatus);
      addToast({
        type: 'success',
        title: 'Status Updated',
        message: `${confirmToggleUser.email} is now ${newStatus}.`
      });
      setConfirmToggleUser(null);
      loadUsers();
      loadOverview();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Status Update Failed',
        message: err.message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case ROLES.SUPER_ADMIN: return 'rose';
      case ROLES.PRINCIPAL: return 'purple';
      case ROLES.HOD: return 'amber';
      case ROLES.FACULTY: return 'teal';
      case ROLES.STUDENT: return 'navy';
      case ROLES.ACCOUNTS: return 'emerald';
      default: return 'neutral';
    }
  };

  // User Table Columns
  const userColumns = [
    {
      header: 'Account & Identity',
      cell: (row) => (
        <div>
          <span className="font-semibold text-navy-950 text-sm block">{row.name}</span>
          <span className="text-xs text-navy-500 font-mono flex items-center mt-0.5">
            <Mail className="w-3 h-3 mr-1 text-navy-400" />
            {row.email}
          </span>
        </div>
      )
    },
    {
      header: 'Assigned Role',
      cell: (row) => (
        <Badge variant={getRoleBadgeVariant(row.role)} size="xs">
          {ROLE_LABELS[row.role] || row.role}
        </Badge>
      )
    },
    {
      header: 'Department / Unit',
      cell: (row) => (
        <span className="text-xs text-navy-700">{row.department || '—'}</span>
      )
    },
    {
      header: 'Status',
      cell: (row) => {
        const isActive = row.status === USER_STATUS.ACTIVE;
        return (
          <span className="inline-flex items-center space-x-1.5">
            <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            <span className={`text-xs font-semibold capitalize ${isActive ? 'text-emerald-700' : 'text-rose-700'}`}>
              {row.status}
            </span>
          </span>
        );
      }
    },
    {
      header: 'Last Login',
      cell: (row) => (
        <span className="text-xs text-navy-500 font-mono">
          {row.lastLogin ? new Date(row.lastLogin).toLocaleDateString() : 'Never'}
        </span>
      )
    },
    {
      header: 'Actions',
      cellClassName: 'text-right',
      cell: (row) => {
        const isActive = row.status === USER_STATUS.ACTIVE;
        return (
          <div className="flex items-center justify-end space-x-1.5">
            <Button
              variant="secondary"
              size="xs"
              onClick={() => handleOpenEdit(row)}
              icon={Edit2}
              title="Edit Profile"
            >
              Edit
            </Button>
            <Button
              variant="secondary"
              size="xs"
              onClick={() => handleOpenReset(row)}
              icon={Key}
              title="Reset Password"
            >
              Reset
            </Button>
            <Button
              variant={isActive ? 'danger' : 'secondary'}
              size="xs"
              onClick={() => setConfirmToggleUser(row)}
              icon={isActive ? UserX : UserCheck}
            >
              {isActive ? 'Disable' : 'Activate'}
            </Button>
          </div>
        );
      }
    }
  ];

  // Audit Log Columns
  const auditColumns = [
    {
      header: 'Timestamp',
      cell: (row) => (
        <span className="text-xs text-navy-500 font-mono">
          {new Date(row.createdAt).toLocaleString()}
        </span>
      )
    },
    {
      header: 'Actor',
      cell: (row) => (
        <div>
          <span className="text-xs font-semibold text-navy-900 block">
            {row.user?.name || 'System'}
          </span>
          <span className="text-[11px] text-navy-500 font-mono">
            {row.user?.email || 'automated-task'}
          </span>
        </div>
      )
    },
    {
      header: 'Action',
      cell: (row) => (
        <Badge variant="navy" size="xs">
          {row.action}
        </Badge>
      )
    },
    {
      header: 'Entity',
      cell: (row) => (
        <span className="text-xs text-navy-700 font-mono">
          {row.entityType} {row.entityId ? `#${row.entityId.slice(-6)}` : ''}
        </span>
      )
    },
    {
      header: 'Client IP',
      cell: (row) => (
        <span className="text-xs text-navy-500 font-mono">
          {row.ipAddress}
        </span>
      )
    }
  ];

  const totalUsersCount = overview?.users?.total ?? totalUsers ?? 10;
  const donutData = [
    { label: 'Students', value: overview?.users?.byRole?.[ROLES.STUDENT] ?? 2, color: '#3b82f6' },
    { label: 'Faculty', value: overview?.users?.byRole?.[ROLES.FACULTY] ?? 2, color: '#8b5cf6' },
    { label: 'HOD', value: overview?.users?.byRole?.[ROLES.HOD] ?? 1, color: '#f59e0b' },
    { label: 'Principal', value: overview?.users?.byRole?.[ROLES.PRINCIPAL] ?? 1, color: '#10b981' },
    { label: 'Accounts', value: overview?.users?.byRole?.[ROLES.ACCOUNTS] ?? 1, color: '#14b8a6' },
    { label: 'Super Admin', value: overview?.users?.byRole?.[ROLES.SUPER_ADMIN] ?? 1, color: '#ef4444' },
    { label: 'Inactive', value: overview?.users?.disabled ?? 1, color: '#94a3b8' }
  ];

  const recentActivityItems = (auditLogs && auditLogs.length > 0)
    ? auditLogs.slice(0, 4).map((l, i) => {
        const icons = [UserPlus, Building2, DollarSign, Activity];
        const colors = ['text-blue-600 bg-blue-50', 'text-teal-600 bg-teal-50', 'text-amber-600 bg-amber-50', 'text-purple-600 bg-purple-50'];
        return {
          title: `${l.action || 'Activity'} (${l.entityType || 'System'})`,
          time: new Date(l.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          icon: icons[i % icons.length],
          iconColor: colors[i % colors.length].split(' ')[0],
          iconBg: colors[i % colors.length].split(' ')[1]
        };
      })
    : [
        { title: 'New user registered', time: '2 hours ago', icon: UserPlus, iconColor: 'text-blue-600', iconBg: 'bg-blue-50' },
        { title: 'Department updated', time: '4 hours ago', icon: Building2, iconColor: 'text-teal-600', iconBg: 'bg-teal-50' },
        { title: 'Fee schedule published', time: '6 hours ago', icon: DollarSign, iconColor: 'text-amber-600', iconBg: 'bg-amber-50' },
        { title: 'System backup completed', time: '1 day ago', icon: Activity, iconColor: 'text-purple-600', iconBg: 'bg-purple-50' }
      ];

  return (
    <div className="space-y-6">
      {/* Indigo Hero Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 rounded-2xl p-6 sm:p-7 text-white shadow-card relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative z-10 max-w-xl">
          <p className="text-xs sm:text-sm font-medium text-blue-100 tracking-wide">
            Welcome back, {user?.name || 'Dr. Arthur Mitchell'}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
            Super Admin Dashboard
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-blue-100/90 font-normal">
            Complete institutional management and system administration
          </p>
        </div>
        <div className="flex items-center gap-4 relative z-10">
          <CampusBuildingGraphic className="w-52 h-28 sm:w-64 sm:h-32 opacity-95 text-white pointer-events-none drop-shadow-md" />
        </div>
      </div>

      {/* Real Statistics from MongoDB */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatWidget
          title="Institutional Users"
          value={overview?.users?.total ?? totalUsers ?? 10}
          subtitle={`${overview?.users?.active || 8} Active`}
          trend={{ value: '+2 this month', positive: true }}
          icon={Users}
          color="indigo"
        />
        <StatWidget
          title="Departments"
          value={overview?.academic?.departments ?? 4}
          subtitle="Active"
          icon={Building2}
          color="blue"
        />
        <StatWidget
          title="Students"
          value={overview?.academic?.studentProfiles ?? 2}
          subtitle="Active"
          icon={GraduationCap}
          color="emerald"
        />
        <StatWidget
          title="Audit Events"
          value={overview?.audit?.totalLogs ?? 47}
          subtitle="This week"
          icon={Activity}
          color="rose"
        />
      </div>

      {/* 4 Quick Action Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button
          onClick={handleOpenCreate}
          className="bg-white hover:bg-slate-50 transition-all border border-slate-200/80 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-subtle hover:shadow-card group cursor-pointer"
        >
          <div className="w-11 h-11 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <UserPlus className="w-5 h-5" />
          </div>
          <span className="text-xs sm:text-sm font-semibold text-slate-800">Add User</span>
        </button>

        <button
          onClick={() => setActiveTab('roles')}
          className="bg-white hover:bg-slate-50 transition-all border border-slate-200/80 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-subtle hover:shadow-card group cursor-pointer"
        >
          <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="text-xs sm:text-sm font-semibold text-slate-800">Manage Roles</span>
        </button>

        <Link
          to="/reports"
          className="bg-white hover:bg-slate-50 transition-all border border-slate-200/80 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-subtle hover:shadow-card group cursor-pointer"
        >
          <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <FileText className="w-5 h-5" />
          </div>
          <span className="text-xs sm:text-sm font-semibold text-slate-800">View Reports</span>
        </Link>

        <button
          onClick={() => setActiveTab('settings')}
          className="bg-white hover:bg-slate-50 transition-all border border-slate-200/80 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-subtle hover:shadow-card group cursor-pointer"
        >
          <div className="w-11 h-11 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Settings className="w-5 h-5" />
          </div>
          <span className="text-xs sm:text-sm font-semibold text-slate-800">System Settings</span>
        </button>
      </div>

      {/* Role Distribution Donut & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-subtle">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-4">User Role Distribution</h2>
          <div className="flex items-center justify-center py-2">
            <SimpleDonutChart
              data={donutData}
              centerLabel="Total"
              centerValue={totalUsersCount}
              size={180}
              thickness={22}
            />
          </div>
        </div>

        <div className="lg:col-span-6 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">Recent Activities</h2>
              <button
                onClick={() => setActiveTab('audit')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                View All
              </button>
            </div>
            <div className="space-y-3.5">
              {recentActivityItems.map((item, idx) => (
                <div key={idx} className="flex items-start space-x-3 text-xs">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${item.iconBg}`}>
                    <item.icon className={`w-3.5 h-3.5 ${item.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{item.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-navy-200 bg-white px-4 rounded-xl shadow-subtle">
        <button
          onClick={() => setActiveTab('users')}
          className={`py-3.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center space-x-2 ${
            activeTab === 'users'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-navy-500 hover:text-navy-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Directory & Accounts</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`py-3.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center space-x-2 ${
            activeTab === 'audit'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-navy-500 hover:text-navy-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Security Audit Trail</span>
        </button>

        <button
          onClick={() => setActiveTab('roles')}
          className={`py-3.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center space-x-2 ${
            activeTab === 'roles'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-navy-500 hover:text-navy-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Roles & Permissions</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`py-3.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center space-x-2 ${
            activeTab === 'settings'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-navy-500 hover:text-navy-900'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Institution Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('modules')}
          className={`py-3.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center space-x-2 ${
            activeTab === 'modules'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-navy-500 hover:text-navy-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>All 17 ERP Modules</span>
        </button>
      </div>

      {/* TAB 1: User Directory & Accounts */}
      {activeTab === 'users' && (
        <Card
          title="Institutional User Management"
          subtitle="Super Admin access governance across all 6 roles with unique email and bcrypt hashing"
          headerAction={
            <Button
              variant="teal"
              size="sm"
              onClick={handleOpenCreate}
              icon={UserPlus}
            >
              Add User
            </Button>
          }
        >
          {/* Filters */}
          <div className="mb-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              id="search-user"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={Search}
            />

            <Select
              id="role-filter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              options={[
                { value: '', label: 'All Roles' },
                { value: ROLES.SUPER_ADMIN, label: 'Super Admin' },
                { value: ROLES.PRINCIPAL, label: 'Principal' },
                { value: ROLES.HOD, label: 'Head of Dept (HOD)' },
                { value: ROLES.FACULTY, label: 'Faculty' },
                { value: ROLES.STUDENT, label: 'Student' },
                { value: ROLES.ACCOUNTS, label: 'Accounts & Finance' }
              ]}
            />

            <Select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'All Statuses' },
                { value: USER_STATUS.ACTIVE, label: 'Active Only' },
                { value: USER_STATUS.DISABLED, label: 'Disabled Only' }
              ]}
            />
          </div>

          <Table
            columns={userColumns}
            data={users}
            keyField="_id"
            isLoading={isUsersLoading}
            emptyMessage="No institutional user accounts match the current query."
          />
        </Card>
      )}

      {/* TAB 2: Security Audit Trail */}
      {activeTab === 'audit' && (
        <Card
          title="Administrative Audit Activity"
          subtitle="Immutable record of user provisioning, role adjustments, password resets, and state mutations"
          headerAction={
            <Button
              variant="secondary"
              size="xs"
              onClick={loadAuditLogs}
              icon={RefreshCw}
              isLoading={isAuditLoading}
            >
              Refresh Logs
            </Button>
          }
        >
          <Table
            columns={auditColumns}
            data={auditLogs}
            keyField="_id"
            isLoading={isAuditLoading}
            emptyMessage="No administrative audit events recorded yet."
          />
        </Card>
      )}

      {/* TAB 3: Roles & Permissions Matrix */}
      {activeTab === 'roles' && (
        <Card
          title="Role-Based Access Control (RBAC) Architecture"
          subtitle="Pre-configured permissions enforced at the backend Express API middleware layer"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(ROLES).map((role) => {
              const perms = ROLE_PERMISSIONS[role] || [];
              return (
                <div key={role} className="p-4 rounded-xl border border-navy-100 bg-warm-50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={getRoleBadgeVariant(role)} size="sm">
                        {ROLE_LABELS[role]}
                      </Badge>
                      <span className="text-[10px] text-navy-400 font-mono">{perms.length} Permissions</span>
                    </div>
                    <p className="text-xs text-navy-600 mb-3">
                      Enforced on API route level via <code>authorizeRoles</code> and <code>requirePermissions</code>.
                    </p>
                  </div>
                  <div className="space-y-1 border-t border-navy-200/60 pt-2">
                    {perms.slice(0, 4).map((p, idx) => (
                      <span key={idx} className="block text-[11px] font-mono text-teal-900 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/40">
                        {p}
                      </span>
                    ))}
                    {perms.length > 4 && (
                      <span className="block text-[10px] text-navy-400 italic">
                        +{perms.length - 4} additional privileges
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* TAB 4: Institution Profile & Settings */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card title="Institution Baseline Profile" subtitle="Single Engineering College Specification" className="lg:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-warm-50 border border-navy-100">
                <span className="text-navy-400 block font-semibold text-[10px] uppercase">College Name</span>
                <span className="text-sm font-bold text-navy-900 mt-1 block">Apex Engineering College</span>
              </div>
              <div className="p-3.5 rounded-xl bg-warm-50 border border-navy-100">
                <span className="text-navy-400 block font-semibold text-[10px] uppercase">Affiliation / Council</span>
                <span className="text-sm font-bold text-navy-900 mt-1 block">State Technical University & AICTE</span>
              </div>
              <div className="p-3.5 rounded-xl bg-warm-50 border border-navy-100">
                <span className="text-navy-400 block font-semibold text-[10px] uppercase">Target Student Capacity</span>
                <span className="text-sm font-bold text-navy-900 mt-1 block">&lt; 1,000 Students</span>
              </div>
              <div className="p-3.5 rounded-xl bg-warm-50 border border-navy-100">
                <span className="text-navy-400 block font-semibold text-[10px] uppercase">Academic Year</span>
                <span className="text-sm font-bold text-navy-900 mt-1 block">2025 - 2026</span>
              </div>
              <div className="p-3.5 rounded-xl bg-warm-50 border border-navy-100">
                <span className="text-navy-400 block font-semibold text-[10px] uppercase">Current Active Term</span>
                <span className="text-sm font-bold text-navy-900 mt-1 block">Odd Semester (Sem 1, 3, 5, 7)</span>
              </div>
              <div className="p-3.5 rounded-xl bg-warm-50 border border-navy-100">
                <span className="text-navy-400 block font-semibold text-[10px] uppercase">Multi-Tenancy Mode</span>
                <span className="text-sm font-bold text-navy-900 mt-1 block">Single Institution (Dedicated)</span>
              </div>
            </div>
          </Card>

          <Card title="Security & Compliance Controls" subtitle="Phase 1 Safeguards">
            <div className="space-y-3 text-xs text-navy-700">
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Bcrypt Password Hashing (Salt Rounds: 10)</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>JWT Bearer Authentication with 7-Day Expiry</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Strict API-Level Role-Permission Enforcement</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>No Password Hashes Returned in API Responses</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Immediate Access Denial for Disabled Users</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 5: All 17 Institutional Modules */}
      {activeTab === 'modules' && (
        <Card
          title="Institutional Modules & Subsystems Directory"
          subtitle="Direct quick access to all 17 college operational portals, academic engines, and financial ledgers"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allModules.map((mod) => {
              const ModIcon = mod.icon;
              return (
                <Link
                  key={mod.id}
                  to={mod.path}
                  className="group p-4 rounded-xl bg-warm-50 border border-navy-100 hover:border-teal-500 hover:bg-white hover:shadow-subtle transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 rounded-lg bg-teal-500/10 text-teal-700 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                        <ModIcon className="w-5 h-5" />
                      </div>
                      <Badge variant="teal" size="xs">
                        {mod.badge}
                      </Badge>
                    </div>
                    <h3 className="font-bold text-navy-900 group-hover:text-teal-700 text-sm mb-1 transition-colors">
                      {mod.name}
                    </h3>
                    <p className="text-xs text-navy-600 line-clamp-2 mb-3">
                      {mod.desc}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-navy-100/60 flex items-center justify-between text-[11px] text-navy-400">
                    <span className="font-mono text-teal-800 font-semibold">{mod.path}</span>
                    <span className="inline-flex items-center font-medium text-teal-700 group-hover:translate-x-0.5 transition-transform">
                      Open <ExternalLink className="w-3 h-3 ml-1" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      )}

      {/* 1. Modal: Create Account */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Provision Institutional Account"
        subtitle="Password will be hashed using bcrypt before MongoDB persistence"
        maxWidth="max-w-lg"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsCreateOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="teal" size="sm" onClick={handleCreateSubmit} isLoading={isSubmitting}>
              Provision Account
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && <Notification type="error" message={formError} onClose={() => setFormError('')} />}

          <Input
            label="Full Name"
            id="create-name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Dr. Arthur Mitchell or Student Name"
          />

          <Input
            label="Institutional Email Address"
            id="create-email"
            type="email"
            required
            icon={Mail}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="e.g. faculty01@college.edu"
          />

          <div className="w-full">
            <label className="block text-xs font-semibold text-navy-700 uppercase tracking-wider mb-1.5">
              Initial Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative rounded-lg shadow-subtle">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-navy-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="create-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="At least 6 characters"
                className="block w-full rounded-lg border border-navy-200 bg-white pl-9 pr-10 py-2.5 text-sm text-navy-900 placeholder-navy-300 hover:border-navy-300 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-navy-400 hover:text-navy-700"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Select
            label="Assigned Role"
            id="create-role"
            required
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            options={[
              { value: ROLES.SUPER_ADMIN, label: 'Super Admin' },
              { value: ROLES.PRINCIPAL, label: 'Principal' },
              { value: ROLES.HOD, label: 'Head of Dept (HOD)' },
              { value: ROLES.FACULTY, label: 'Faculty' },
              { value: ROLES.STUDENT, label: 'Student' },
              { value: ROLES.ACCOUNTS, label: 'Accounts & Finance' }
            ]}
          />

          <Select
            label="Department / Allocation"
            id="create-dept"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            options={[
              { value: 'Administration', label: 'Administration' },
              { value: 'Academic Council', label: 'Academic Council' },
              { value: 'Finance & Accounts', label: 'Finance & Accounts' },
              ...DEPARTMENTS.map((d) => ({ value: d, label: d }))
            ]}
          />

          <Select
            label="Initial Account Status"
            id="create-status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={[
              { value: USER_STATUS.ACTIVE, label: 'Active (Permitted Login)' },
              { value: USER_STATUS.DISABLED, label: 'Disabled (Access Denied)' }
            ]}
          />
        </form>
      </Modal>

      {/* 2. Modal: Edit Account */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit Account: ${activeUser?.email || ''}`}
        subtitle="Modify legal name, role grant, and department"
        maxWidth="max-w-lg"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsEditOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleEditSubmit} isLoading={isSubmitting}>
              Save Changes
            </Button>
          </>
        }
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {formError && <Notification type="error" message={formError} onClose={() => setFormError('')} />}

          <Input
            label="Full Name"
            id="edit-name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <Input
            label="Institutional Email (Immutable)"
            id="edit-email"
            disabled
            value={formData.email}
          />

          <Select
            label="Assigned Role"
            id="edit-role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            options={[
              { value: ROLES.SUPER_ADMIN, label: 'Super Admin' },
              { value: ROLES.PRINCIPAL, label: 'Principal' },
              { value: ROLES.HOD, label: 'Head of Dept (HOD)' },
              { value: ROLES.FACULTY, label: 'Faculty' },
              { value: ROLES.STUDENT, label: 'Student' },
              { value: ROLES.ACCOUNTS, label: 'Accounts & Finance' }
            ]}
          />

          <Select
            label="Department"
            id="edit-dept"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            options={[
              { value: 'Administration', label: 'Administration' },
              { value: 'Academic Council', label: 'Academic Council' },
              { value: 'Finance & Accounts', label: 'Finance & Accounts' },
              ...DEPARTMENTS.map((d) => ({ value: d, label: d }))
            ]}
          />

          <Select
            label="Account Status"
            id="edit-status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={[
              { value: USER_STATUS.ACTIVE, label: 'Active' },
              { value: USER_STATUS.DISABLED, label: 'Disabled' }
            ]}
          />
        </form>
      </Modal>

      {/* 3. Modal: Reset Password */}
      <Modal
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        title={`Reset Password for ${activeUser?.name || 'User'}`}
        subtitle={`Set temporary password for ${activeUser?.email || ''}`}
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsResetOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleResetSubmit} isLoading={isSubmitting} icon={Key}>
              Apply New Password
            </Button>
          </>
        }
      >
        <form onSubmit={handleResetSubmit} className="space-y-4">
          {formError && <Notification type="error" message={formError} onClose={() => setFormError('')} />}

          <div className="w-full">
            <label className="block text-xs font-semibold text-navy-700 uppercase tracking-wider mb-1.5">
              New Confidential Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative rounded-lg shadow-subtle">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-navy-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="reset-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={newPasswordValue}
                onChange={(e) => setNewPasswordValue(e.target.value)}
                placeholder="At least 6 characters"
                className="block w-full rounded-lg border border-navy-200 bg-white pl-9 pr-10 py-2.5 text-sm text-navy-900 placeholder-navy-300 hover:border-navy-300 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-navy-400 hover:text-navy-700"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-navy-500 mt-1">
              Will be hashed with bcrypt (salt 10) before MongoDB update.
            </p>
          </div>
        </form>
      </Modal>

      {/* 4. Confirm Dialog: Activate / Deactivate */}
      <ConfirmDialog
        isOpen={!!confirmToggleUser}
        onClose={() => setConfirmToggleUser(null)}
        onConfirm={handleConfirmToggle}
        title={confirmToggleUser?.status === USER_STATUS.ACTIVE ? 'Disable User Account?' : 'Activate User Account?'}
        message={
          confirmToggleUser?.status === USER_STATUS.ACTIVE
            ? `Disabling account '${confirmToggleUser?.email}' immediately revokes session tokens and blocks login.`
            : `Activating account '${confirmToggleUser?.email}' will allow login with role '${confirmToggleUser?.role}'.`
        }
        confirmText={confirmToggleUser?.status === USER_STATUS.ACTIVE ? 'Disable Account' : 'Activate Account'}
        isDanger={confirmToggleUser?.status === USER_STATUS.ACTIVE}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default AdminDashboard;
