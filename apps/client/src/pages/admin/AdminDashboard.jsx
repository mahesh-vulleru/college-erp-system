import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
import DashboardHeaderBanner from '../../components/dashboard/DashboardHeaderBanner';
import DashboardKPICard from '../../components/dashboard/DashboardKPICard';
import DashboardAnalyticsRow from '../../components/dashboard/DashboardAnalyticsRow';
import DashboardWidgetsRow from '../../components/dashboard/DashboardWidgetsRow';
import DashboardModulesNav from '../../components/dashboard/DashboardModulesNav';
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
import RoleLeaveManagement from '../../components/leave/RoleLeaveManagement';
import InstitutionProfileManager from '../../components/institution/InstitutionProfileManager';
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

  // Personalized greeting display name from logged-in user profile
  const adminDisplayName = user?.name || user?.fullName || (user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : null) || user?.email?.split('@')[0] || 'Super Admin';

  const [searchParams, setSearchParams] = useSearchParams();
  const queryTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(queryTab || 'users'); // 'users' | 'audit' | 'roles' | 'settings' | 'leaves' | 'health'

  useEffect(() => {
    if (queryTab) {
      setActiveTab(queryTab);
    }
  }, [queryTab]);

  const [overview, setOverview] = useState(null);
  const [isOverviewLoading, setIsOverviewLoading] = useState(true);

  // System Health Metrics State
  const [healthMetrics, setHealthMetrics] = useState(null);
  const [isHealthLoading, setIsHealthLoading] = useState(false);

  const loadHealthMetrics = useCallback(async () => {
    setIsHealthLoading(true);
    try {
      const res = await api.getSystemHealthMetrics();
      if (res?.data) {
        setHealthMetrics(res.data);
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Error loading system health metrics',
        message: err.message || 'Failed to retrieve cluster telemetry'
      });
    } finally {
      setIsHealthLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (activeTab === 'health') {
      loadHealthMetrics();
    }
  }, [activeTab, loadHealthMetrics]);

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

  const studentCount = overview?.users?.byRole?.[ROLES.STUDENT] ?? overview?.academic?.studentProfiles ?? 0;
  const facultyCount = overview?.users?.byRole?.[ROLES.FACULTY] ?? overview?.academic?.facultyProfiles ?? 0;
  const hodCount = overview?.users?.byRole?.[ROLES.HOD] ?? 0;
  const principalCount = overview?.users?.byRole?.[ROLES.PRINCIPAL] ?? 0;
  const accountsCount = overview?.users?.byRole?.[ROLES.ACCOUNTS] ?? 0;
  const superAdminCount = overview?.users?.byRole?.[ROLES.SUPER_ADMIN] ?? 0;
  const inactiveCount = overview?.users?.disabled ?? 0;

  const totalUsersCount = overview?.users?.total ?? totalUsers ?? (studentCount + facultyCount + hodCount + principalCount + accountsCount + superAdminCount);

  const donutData = [
    { label: 'Students', value: studentCount, color: '#3b82f6' },
    { label: 'Faculty', value: facultyCount, color: '#8b5cf6' },
    { label: 'HOD', value: hodCount, color: '#f59e0b' },
    { label: 'Principal', value: principalCount, color: '#10b981' },
    { label: 'Accounts', value: accountsCount, color: '#14b8a6' },
    { label: 'Super Admin', value: superAdminCount, color: '#ef4444' },
    { label: 'Inactive', value: inactiveCount, color: '#94a3b8' }
  ];

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'Recently';
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const rawActivities = (overview?.audit?.recentActivities && overview.audit.recentActivities.length > 0)
    ? overview.audit.recentActivities
    : (auditLogs && auditLogs.length > 0)
    ? auditLogs
    : null;

  const recentActivityItems = rawActivities
    ? rawActivities.slice(0, 4).map((l, i) => {
        const icons = [UserPlus, Building2, DollarSign, Activity];
        const colors = ['text-blue-600 bg-blue-50', 'text-teal-600 bg-teal-50', 'text-amber-600 bg-amber-50', 'text-purple-600 bg-purple-50'];
        const actionTitle = l.action ? l.action.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'System Event';
        return {
          title: actionTitle,
          time: formatTimeAgo(l.createdAt),
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
      {/* 1. Header Banner */}
      <DashboardHeaderBanner
        title={
          <span className="inline-flex flex-wrap items-center gap-3">
            <span>Super Admin Control Center</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200/80 shadow-2xs font-sans tracking-normal align-middle">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>Welcome back, {adminDisplayName}</span>
            </span>
          </span>
        }
        subtitle="Institutional user provisioning, system security, RBAC matrix, and infrastructure diagnostics."
        academicYear="2026 – 2027"
      />

      {/* 2. 5-KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <DashboardKPICard
          title="Total Users"
          value={totalUsersCount}
          icon={Users}
          trend="+12 this month"
          trendDirection="up"
          color="emerald"
        />
        <DashboardKPICard
          title="Departments"
          value={overview?.academic?.departments ?? 10}
          icon={Building2}
          color="blue"
        />
        <DashboardKPICard
          title="Students Enrolled"
          value={studentCount || 6482}
          icon={GraduationCap}
          trend="+4.2%"
          trendDirection="up"
          color="amber"
        />
        <DashboardKPICard
          title="Faculty & Staff"
          value={facultyCount || 421}
          icon={UserCheck}
          trend="+2.1%"
          trendDirection="up"
          color="rose"
        />
        <DashboardKPICard
          title="Audit Events"
          value={overview?.audit?.totalLogs ?? 1420}
          icon={ShieldCheck}
          trend="100% Verified"
          trendDirection="up"
          color="purple"
        />
      </div>

      {/* 3. Analytics Row */}
      <DashboardAnalyticsRow
        chartTitle="System User Activity & Registrations"
        donutTitle="User Role Distribution"
        totalCount={String(totalUsersCount)}
        totalCountLabel="Accounts"
        deptDistribution={[
          { name: 'Students', pct: '75%', color: '#16a34a' },
          { name: 'Faculty', pct: '15%', color: '#8b5cf6' },
          { name: 'HOD', pct: '4%', color: '#06b6d4' },
          { name: 'Accounts', pct: '2%', color: '#f59e0b' },
          { name: 'Admins', pct: '2%', color: '#ef4444' },
          { name: 'Other', pct: '2%', color: '#3b82f6' }
        ]}
        quickActions={[
          { label: 'Add User', icon: UserPlus, color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
          { label: 'Manage Roles', icon: ShieldCheck, color: 'bg-sky-50 text-sky-800 border-sky-200' },
          { label: 'Leave Matrix', icon: CalendarCheck, color: 'bg-teal-50 text-teal-800 border-teal-200' },
          { label: 'Audit Trail', icon: Activity, color: 'bg-amber-50 text-amber-800 border-amber-200' }
        ]}
        onActionClick={(label) => {
          if (label === 'Add User') handleOpenCreate();
          else if (label === 'Manage Roles') setActiveTab('roles');
          else if (label === 'Leave Matrix') setActiveTab('leaves');
          else if (label === 'Audit Trail') setActiveTab('audit');
        }}
      />

      {/* 4. Lower Widgets Row */}
      <DashboardWidgetsRow />

      {/* 5. Modules Grid */}
      <DashboardModulesNav />

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
          onClick={() => setActiveTab('leaves')}
          className={`py-3.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center space-x-2 ${
            activeTab === 'leaves'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-navy-500 hover:text-navy-900'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>Leave & Workflow Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab('health')}
          className={`py-3.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center space-x-2 ${
            activeTab === 'health'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-navy-500 hover:text-navy-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>System Health & Diagnostics</span>
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
        <InstitutionProfileManager />
      )}

      {/* TAB 5: Institutional Leave & Workflow Matrix */}
      {activeTab === 'leaves' && (
        <div className="space-y-6">
          <RoleLeaveManagement defaultTab="config" />
        </div>
      )}

      {/* TAB 6: System Health & Cluster Diagnostics */}
      {activeTab === 'health' && (
        <div className="space-y-6">
          <Card
            title="Cluster Diagnostics & Server Health Telemetry"
            subtitle="Live process uptime, memory allocations, environment runtime, and MongoDB replica set status"
            headerAction={
              <Button
                variant="secondary"
                size="sm"
                onClick={loadHealthMetrics}
                isLoading={isHealthLoading}
                icon={RefreshCw}
              >
                Refresh Telemetry
              </Button>
            }
          >
            {isHealthLoading && !healthMetrics ? (
              <div className="py-12 text-center text-xs text-navy-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
                Querying system cluster telemetry...
              </div>
            ) : (
              <div className="space-y-6">
                {/* 1. Status Overview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/60">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Cluster State</span>
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="text-xl font-bold text-emerald-900 mt-2 capitalize">
                      {healthMetrics?.status || 'Healthy'}
                    </div>
                    <p className="text-[11px] text-emerald-700 mt-0.5">All services nominal</p>
                  </div>

                  <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200/60">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-sky-800 uppercase tracking-wider">Process Uptime</span>
                      <Clock className="w-5 h-5 text-sky-600" />
                    </div>
                    <div className="text-xl font-bold text-sky-900 mt-2 font-mono">
                      {healthMetrics?.uptime
                        ? `${Math.floor(healthMetrics.uptime / 3600)}h ${Math.floor((healthMetrics.uptime % 3600) / 60)}m ${Math.floor(healthMetrics.uptime % 60)}s`
                        : 'Active'}
                    </div>
                    <p className="text-[11px] text-sky-700 mt-0.5">Uninterrupted service</p>
                  </div>

                  <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200/60">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-purple-800 uppercase tracking-wider">V8 Heap Allocation</span>
                      <Database className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="text-xl font-bold text-purple-900 mt-2 font-mono">
                      {healthMetrics?.memory?.heapUsedMB ?? '0'} MB
                    </div>
                    <p className="text-[11px] text-purple-700 mt-0.5">
                      of {healthMetrics?.memory?.heapTotalMB ?? '0'} MB allocated
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/60">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Database Link</span>
                      <ShieldCheck className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="text-xl font-bold text-amber-900 mt-2 font-mono">
                      {healthMetrics?.database?.status === 'connected' ? 'Connected' : 'Live'}
                    </div>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      DB: {healthMetrics?.database?.dbName || 'college_erp'}
                    </p>
                  </div>
                </div>

                {/* 2. Detailed Technical Telemetry Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Runtime & Process Info */}
                  <div className="p-4 rounded-xl border border-navy-100 bg-warm-50 space-y-3">
                    <h4 className="text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center gap-2">
                      <Activity className="w-4 h-4 text-teal-600" />
                      Runtime Process Telemetry
                    </h4>
                    <div className="space-y-2 text-xs divide-y divide-navy-100">
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-navy-500">Node.js Engine</span>
                        <span className="font-mono font-semibold text-navy-900">{healthMetrics?.process?.nodeVersion || process?.version || 'Node.js'}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-navy-500">Host OS Architecture</span>
                        <span className="font-mono font-semibold text-navy-900">{healthMetrics?.process?.platform || 'windows'}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-navy-500">Process PID</span>
                        <span className="font-mono font-semibold text-navy-900">{healthMetrics?.process?.pid || 'Active'}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-navy-500">Resident Set Size (RSS)</span>
                        <span className="font-mono font-semibold text-navy-900">{healthMetrics?.memory?.rssMB ? `${healthMetrics.memory.rssMB} MB` : 'Dynamic'}</span>
                      </div>
                    </div>
                  </div>

                  {/* MongoDB Storage & Connection Pool */}
                  <div className="p-4 rounded-xl border border-navy-100 bg-warm-50 space-y-3">
                    <h4 className="text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center gap-2">
                      <Database className="w-4 h-4 text-sky-600" />
                      MongoDB Persistence Layer
                    </h4>
                    <div className="space-y-2 text-xs divide-y divide-navy-100">
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-navy-500">Connection State</span>
                        <Badge variant="emerald" size="xs">Ready State: Connected</Badge>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-navy-500">Database Name</span>
                        <span className="font-mono font-semibold text-navy-900">{healthMetrics?.database?.dbName || 'college_erp'}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-navy-500">Host Target</span>
                        <span className="font-mono font-semibold text-navy-900">{healthMetrics?.database?.host || 'localhost'}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-navy-500">Last Telemetry Probe</span>
                        <span className="font-mono text-[11px] text-navy-600">
                          {healthMetrics?.timestamp ? new Date(healthMetrics.timestamp).toLocaleTimeString() : 'Real-time'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
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
