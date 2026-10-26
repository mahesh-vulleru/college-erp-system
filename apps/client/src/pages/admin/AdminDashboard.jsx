import React, { useState, useEffect, useCallback } from 'react';
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
  AlertCircle
} from 'lucide-react';
import Card from '../../components/common/Card';
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

  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'audit' | 'roles' | 'settings'
  const [overview, setOverview] = useState(null);
  const [isOverviewLoading, setIsOverviewLoading] = useState(true);

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

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-navy-900 rounded-2xl p-6 text-white shadow-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-2 border border-teal-500/30">
            <ShieldAlert className="w-3.5 h-3.5 mr-1" />
            <span>Super Administrator Control Center</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Institutional Governance & System Administration</h1>
          <p className="mt-1 text-xs sm:text-sm text-navy-200 font-light">
            Live management of 6 institutional roles, account provisioning, security audit logs, and college configuration.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="teal"
            size="md"
            onClick={handleOpenCreate}
            icon={UserPlus}
            className="shadow-elevation"
          >
            Provision User
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={() => { loadOverview(); loadUsers(); }}
            icon={RefreshCw}
          />
        </div>
      </div>

      {/* Real Statistics from MongoDB */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatWidget
          title="Institutional Users"
          value={overview?.users?.total ? `${overview.users.total} Total` : 'Loading...'}
          subtitle={`${overview?.users?.active || 0} Active • ${overview?.users?.disabled || 0} Disabled`}
          icon={Users}
          color="navy"
        />
        <StatWidget
          title="Academic Units"
          value={overview?.academic?.departments ? `${overview.academic.departments} Departments` : 'Loading...'}
          subtitle={`${overview?.academic?.courses || 0} Programs • ${overview?.academic?.subjects || 0} Courses`}
          icon={Building2}
          color="teal"
        />
        <StatWidget
          title="Registered Strength"
          value={overview?.academic?.studentProfiles ? `${overview.academic.studentProfiles} Students` : 'Loading...'}
          subtitle={`${overview?.academic?.facultyProfiles || 0} Faculty Members`}
          icon={Layers}
          color="emerald"
        />
        <StatWidget
          title="Security Audit Events"
          value={overview?.audit?.totalLogs ? `${overview.audit.totalLogs} Logged` : '0 Events'}
          subtitle="Cryptographically Recorded"
          icon={Activity}
          color="amber"
        />
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
