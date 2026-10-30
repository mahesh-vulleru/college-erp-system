import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Search,
  Key,
  Edit2,
  Lock,
  UserCheck,
  UserX,
  RefreshCw,
  Building2,
  Mail,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import api from '../../api/apiClient';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import StatWidget from '../../components/common/StatWidget';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Notification from '../../components/common/Notification';
import { ROLES, ROLE_LABELS, USER_STATUS, DEPARTMENTS } from '@college-erp/shared';

export const UserManagementPage = () => {
  const { addToast } = useToast();

  const [users, setUsers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [confirmToggleUser, setConfirmToggleUser] = useState(null);

  // Form states
  const [activeUser, setActiveUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: ROLES.STUDENT,
    department: 'Computer Science & Engineering',
    status: USER_STATUS.ACTIVE
  });
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Fetch users with filters
  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.getUsers({
        q: searchQuery,
        role: selectedRoleFilter,
        status: selectedStatusFilter,
        limit: 100
      });

      if (response?.data) {
        setUsers(response.data);
        setTotalCount(response.meta?.total || response.data.length);
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve institutional user directory.');
      addToast({
        type: 'error',
        title: 'Directory Load Error',
        message: err.message || 'Could not fetch users'
      });
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedRoleFilter, selectedStatusFilter, addToast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Handle Create User
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
      setFormError('Please fill in all required fields.');
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
        message: `Successfully created account for ${formData.email}`
      });
      setIsCreateOpen(false);
      loadUsers();
    } catch (err) {
      setFormError(err.message || 'Failed to create user account.');
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
        message: `User details updated for ${activeUser.email}`
      });
      setIsEditOpen(false);
      loadUsers();
    } catch (err) {
      setFormError(err.message || 'Failed to update user account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Reset Password
  const handleOpenReset = (user) => {
    setActiveUser(user);
    setResetPasswordValue('');
    setFormError('');
    setIsResetOpen(true);
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!activeUser) return;

    if (!resetPasswordValue || resetPasswordValue.length < 6) {
      setFormError('New password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.resetUserPassword(activeUser._id || activeUser.id, resetPasswordValue);
      addToast({
        type: 'success',
        title: 'Password Reset',
        message: `Password has been reset for ${activeUser.email}. Temporary password flag set.`
      });
      setIsResetOpen(false);
      loadUsers();
    } catch (err) {
      setFormError(err.message || 'Failed to reset user password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Toggle Active/Disabled Status
  const handleConfirmToggleStatus = async () => {
    if (!confirmToggleUser) return;
    const targetId = confirmToggleUser._id || confirmToggleUser.id;
    const newStatus = confirmToggleUser.status === USER_STATUS.ACTIVE ? USER_STATUS.DISABLED : USER_STATUS.ACTIVE;

    setIsSubmitting(true);
    try {
      await api.updateUserStatus(targetId, newStatus);
      addToast({
        type: 'success',
        title: 'Status Updated',
        message: `User ${confirmToggleUser.email} is now ${newStatus}.`
      });
      setConfirmToggleUser(null);
      loadUsers();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: err.message || 'Could not update user status'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Role Badge Variant Mapper
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

  // Statistics
  const activeCount = users.filter((u) => u.status === USER_STATUS.ACTIVE).length;
  const disabledCount = users.filter((u) => u.status === USER_STATUS.DISABLED).length;

  // Table Columns Definition
  const columns = [
    {
      header: 'User & Credentials',
      cell: (row) => (
        <div>
          <div className="font-semibold text-navy-900 text-sm">{row.name}</div>
          <div className="text-xs text-navy-500 font-mono mt-0.5 flex items-center">
            <Mail className="w-3 h-3 mr-1 text-navy-400" />
            {row.email}
          </div>
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
      header: 'Department',
      cell: (row) => (
        <span className="text-xs text-navy-700">
          {row.department || '—'}
        </span>
      )
    },
    {
      header: 'Account Status',
      cell: (row) => {
        const isActive = row.status === USER_STATUS.ACTIVE;
        return (
          <div className="flex items-center space-x-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isActive ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
            <span
              className={`text-xs font-semibold capitalize ${
                isActive ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {row.status}
            </span>
          </div>
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
          <div className="flex items-center justify-end space-x-2">
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
              Reset Pass
            </Button>
            <Button
              variant={isActive ? 'danger' : 'secondary'}
              size="xs"
              onClick={() => setConfirmToggleUser(row)}
              icon={isActive ? UserX : UserCheck}
              title={isActive ? 'Disable Account' : 'Activate Account'}
            >
              {isActive ? 'Disable' : 'Activate'}
            </Button>
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-navy-900 rounded-2xl p-6 text-white shadow-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-2 border border-teal-500/30">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            <span>Super Admin &bull; Identity Governance</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Institutional User Directory</h1>
          <p className="mt-1 text-xs sm:text-sm text-navy-200 font-light">
            Create, edit, reset passwords, and manage active/disabled account statuses across all 6 institutional roles.
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
            Create New Account
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatWidget
          title="Total Institutional Users"
          value={totalCount.toString()}
          subtitle="Registered accounts"
          icon={Users}
          color="navy"
        />
        <StatWidget
          title="Active Accounts"
          value={activeCount.toString()}
          subtitle="Permitted access"
          icon={UserCheck}
          color="emerald"
        />
        <StatWidget
          title="Disabled Accounts"
          value={disabledCount.toString()}
          subtitle="Denied system access"
          icon={UserX}
          color="rose"
        />
      </div>

      {/* Controls & Table Container */}
      <Card
        title="Manage Institutional Accounts"
        subtitle="Enforce unique email constraints, password hashing, and role-based permissions"
        headerAction={
          <Button
            variant="secondary"
            size="xs"
            onClick={loadUsers}
            icon={RefreshCw}
            isLoading={isLoading}
          >
            Refresh
          </Button>
        }
      >
        {/* Filter Bar */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Input
              id="search-user"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={Search}
            />
          </div>

          <div>
            <Select
              id="role-filter"
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              options={[
                { value: '', label: 'All Institutional Roles' },
                { value: ROLES.SUPER_ADMIN, label: 'Super Admin' },
                { value: ROLES.PRINCIPAL, label: 'Principal' },
                { value: ROLES.HOD, label: 'Head of Dept (HOD)' },
                { value: ROLES.FACULTY, label: 'Faculty' },
                { value: ROLES.STUDENT, label: 'Student' },
                { value: ROLES.ACCOUNTS, label: 'Accounts & Finance' }
              ]}
            />
          </div>

          <div>
            <Select
              id="status-filter"
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'All Statuses' },
                { value: USER_STATUS.ACTIVE, label: 'Active Only' },
                { value: USER_STATUS.DISABLED, label: 'Disabled Only' }
              ]}
            />
          </div>
        </div>

        {error && (
          <Notification
            type="error"
            message={error}
            onClose={() => setError('')}
            className="mb-4"
          />
        )}

        {/* Directory Table */}
        <Table
          columns={columns}
          data={users}
          keyField="_id"
          isLoading={isLoading}
          emptyMessage="No institutional user records found matching the active filters."
        />
      </Card>

      {/* 1. Modal: Create Institutional Account */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Provision New Institutional Account"
        subtitle="Account credentials will be hashed before storage in MongoDB"
        maxWidth="max-w-lg"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsCreateOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="teal"
              size="sm"
              onClick={handleCreateSubmit}
              isLoading={isSubmitting}
            >
              Provision Account
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && (
            <Notification
              type="error"
              message={formError}
              onClose={() => setFormError('')}
            />
          )}

          <Input
            label="Full Name"
            id="create-name"
            required
            placeholder="e.g. Dr. Arthur Mitchell or Student Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <Input
            label="Unique Institutional Email Address"
            id="create-email"
            type="email"
            required
            placeholder="e.g. faculty01@college.edu or student01@college.edu"
            icon={Mail}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
            <p className="text-[11px] text-navy-500 mt-1">
              Passwords are automatically hashed with bcrypt (salt 10) before MongoDB insertion.
            </p>
          </div>

          <Select
            label="Assigned Role"
            id="create-role"
            required
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            options={[
              { value: ROLES.SUPER_ADMIN, label: 'Super Admin (System Governance)' },
              { value: ROLES.PRINCIPAL, label: 'Principal (Academic Council)' },
              { value: ROLES.HOD, label: 'Head of Department (HOD)' },
              { value: ROLES.FACULTY, label: 'Faculty Member' },
              { value: ROLES.STUDENT, label: 'Student' },
              { value: ROLES.ACCOUNTS, label: 'Accounts & Finance' }
            ]}
          />

          <Select
            label="Department / Unit"
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

      {/* 2. Modal: Edit User Account */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit User: ${activeUser?.email || ''}`}
        subtitle="Update profile name, role assignment, and department allocation"
        maxWidth="max-w-lg"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsEditOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleEditSubmit}
              isLoading={isSubmitting}
            >
              Save Changes
            </Button>
          </>
        }
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {formError && (
            <Notification
              type="error"
              message={formError}
              onClose={() => setFormError('')}
            />
          )}

          <Input
            label="Full Name"
            id="edit-name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <Input
            label="Institutional Email (Immutable ID)"
            id="edit-email"
            disabled
            value={formData.email}
          />

          <Select
            label="Assigned Institutional Role"
            id="edit-role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            options={[
              { value: ROLES.SUPER_ADMIN, label: 'Super Admin' },
              { value: ROLES.PRINCIPAL, label: 'Principal' },
              { value: ROLES.HOD, label: 'Head of Department (HOD)' },
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

      {/* 3. Modal: Super Admin Reset Password */}
      <Modal
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        title={`Reset Password for ${activeUser?.name || 'User'}`}
        subtitle={`Assign a new temporary password for ${activeUser?.email || ''}`}
        maxWidth="max-w-md"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsResetOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleResetSubmit}
              isLoading={isSubmitting}
              icon={Key}
            >
              Reset Password
            </Button>
          </>
        }
      >
        <form onSubmit={handleResetSubmit} className="space-y-4">
          {formError && (
            <Notification
              type="error"
              message={formError}
              onClose={() => setFormError('')}
            />
          )}

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
                value={resetPasswordValue}
                onChange={(e) => setResetPasswordValue(e.target.value)}
                placeholder="Enter at least 6 characters"
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
            <p className="text-[11px] text-navy-500 mt-1.5 leading-relaxed">
              This action will securely update the user's password using bcrypt with 10 salt rounds.
            </p>
          </div>
        </form>
      </Modal>

      {/* 4. Confirm Dialog: Disable / Enable Account */}
      <ConfirmDialog
        isOpen={!!confirmToggleUser}
        onClose={() => setConfirmToggleUser(null)}
        onConfirm={handleConfirmToggleStatus}
        title={confirmToggleUser?.status === USER_STATUS.ACTIVE ? 'Disable User Account?' : 'Activate User Account?'}
        message={
          confirmToggleUser?.status === USER_STATUS.ACTIVE
            ? `Disabling account '${confirmToggleUser?.email}' will immediately deny access to all institutional dashboards and protected endpoints.`
            : `Activating account '${confirmToggleUser?.email}' will restore their access with role '${confirmToggleUser?.role}'.`
        }
        confirmText={confirmToggleUser?.status === USER_STATUS.ACTIVE ? 'Disable Account' : 'Activate Account'}
        isDanger={confirmToggleUser?.status === USER_STATUS.ACTIVE}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default UserManagementPage;
