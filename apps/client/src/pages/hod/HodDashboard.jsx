import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  BookOpen,
  CalendarCheck,
  Award,
  Clock,
  Layers,
  Building2,
  AlertTriangle,
  CheckCircle,
  UserPlus,
  RefreshCw,
  Edit2,
  Key,
  UserCheck,
  UserX,
  Mail,
  ShieldAlert
} from 'lucide-react';
import Card from '../../components/common/Card';
import StatWidget from '../../components/common/StatWidget';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Notification from '../../components/common/Notification';
import api from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ROLES, USER_STATUS, DEPARTMENTS } from '@college-erp/shared';

export const HodDashboard = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [departments, setDepartments] = useState([]);
  const [hodUsers, setHodUsers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [timetableSlots, setTimetableSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isAssignHodOpen, setIsAssignHodOpen] = useState(false);
  const [isCreateHodOpen, setIsCreateHodOpen] = useState(false);
  const [isResetPassOpen, setIsResetPassOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedHodUser, setSelectedHodUser] = useState(null);
  const [confirmToggleHod, setConfirmToggleHod] = useState(null);

  // Forms
  const [assignForm, setAssignForm] = useState({ hodUserId: '' });
  const [createHodForm, setCreateHodForm] = useState({
    name: '',
    email: '',
    password: '',
    department: 'Computer Science & Engineering'
  });
  const [newPasswordVal, setNewPasswordVal] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [deptRes, usersRes, subjRes, timeRes] = await Promise.all([
        api.getDepartmentSummaries().catch(() => ({ data: [] })),
        api.getUsers({ role: ROLES.HOD, limit: 50 }).catch(() => ({ data: [] })),
        api.getSubjects().catch(() => ({ data: [] })),
        api.getTimetable().catch(() => ({ data: [] }))
      ]);

      if (deptRes?.data) setDepartments(deptRes.data);
      if (usersRes?.data) setHodUsers(usersRes.data);
      if (subjRes?.data) setSubjects(subjRes.data);
      if (timeRes?.data) setTimetableSlots(timeRes.data);
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Error loading HOD workspace',
        message: err.message
      });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open Assign HOD Modal
  const handleOpenAssign = (dept) => {
    setSelectedDept(dept);
    setAssignForm({ hodUserId: dept.hod?._id || dept.hod?.id || '' });
    setFormError('');
    setIsAssignHodOpen(true);
  };

  // Submit HOD Assignment to Department (with backend conflict prevention)
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDept) return;
    setFormError('');

    setIsSubmitting(true);
    try {
      await api.updateDepartment(selectedDept.id || selectedDept._id, {
        hod: assignForm.hodUserId || null
      });

      addToast({
        type: 'success',
        title: 'HOD Assigned',
        message: `Department ${selectedDept.name} leadership updated.`
      });
      setIsAssignHodOpen(false);
      loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to update department HOD.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create new HOD User Account
  const handleCreateHodSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!createHodForm.name || !createHodForm.email || !createHodForm.password) {
      setFormError('Please fill in all required fields.');
      return;
    }
    if (createHodForm.password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createUser({
        ...createHodForm,
        role: ROLES.HOD,
        status: USER_STATUS.ACTIVE
      });

      addToast({
        type: 'success',
        title: 'HOD Account Created',
        message: `Created account for ${createHodForm.email}`
      });
      setIsCreateHodOpen(false);
      setCreateHodForm({ name: '', email: '', password: '', department: 'Computer Science & Engineering' });
      loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to create HOD account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset HOD Password
  const handleResetPassSubmit = async (e) => {
    e.preventDefault();
    if (!selectedHodUser) return;
    if (!newPasswordVal || newPasswordVal.length < 6) {
      setFormError('New password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.resetUserPassword(selectedHodUser._id || selectedHodUser.id, newPasswordVal);
      addToast({
        type: 'success',
        title: 'Password Reset',
        message: `Temporary password assigned to ${selectedHodUser.email}`
      });
      setIsResetPassOpen(false);
      loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to reset password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle HOD Status
  const handleConfirmToggleHod = async () => {
    if (!confirmToggleHod) return;
    const targetId = confirmToggleHod._id || confirmToggleHod.id;
    const newStatus = confirmToggleHod.status === USER_STATUS.ACTIVE ? USER_STATUS.DISABLED : USER_STATUS.ACTIVE;

    setIsSubmitting(true);
    try {
      await api.updateUserStatus(targetId, newStatus);
      addToast({
        type: 'success',
        title: 'Status Updated',
        message: `${confirmToggleHod.email} is now ${newStatus}.`
      });
      setConfirmToggleHod(null);
      loadData();
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

  // Vacant departments count
  const unassignedDepts = departments.filter((d) => !d.hasHod);

  // Departments Table Columns
  const deptColumns = [
    {
      header: 'Department & Code',
      cell: (row) => (
        <div>
          <span className="font-semibold text-navy-950 text-sm block">{row.name}</span>
          <span className="text-xs text-navy-500 font-mono">Code: {row.code}</span>
        </div>
      )
    },
    {
      header: 'Assigned Head (HOD)',
      cell: (row) => (
        row.hasHod ? (
          <div>
            <span className="text-xs font-semibold text-navy-900 block">{row.hod.name}</span>
            <span className="text-[11px] text-navy-500 font-mono">{row.hod.email}</span>
          </div>
        ) : (
          <Badge variant="danger" size="xs">
            Vacant (No HOD Assigned)
          </Badge>
        )
      )
    },
    {
      header: 'Enrolled Students',
      cell: (row) => (
        <span className="text-xs font-bold text-navy-900">
          {row.studentCount} / {row.intakeCapacity}
        </span>
      )
    },
    {
      header: 'Faculty Allocated',
      cell: (row) => (
        <span className="text-xs text-navy-700">
          {row.facultyCount} Members
        </span>
      )
    },
    {
      header: 'Curriculum Subjects',
      cell: (row) => (
        <span className="text-xs text-navy-700">
          {row.subjectCount} Courses
        </span>
      )
    },
    {
      header: 'Actions',
      cellClassName: 'text-right',
      cell: (row) => (
        <Button
          variant="secondary"
          size="xs"
          onClick={() => handleOpenAssign(row)}
          icon={Edit2}
        >
          {row.hasHod ? 'Reassign HOD' : 'Assign HOD'}
        </Button>
      )
    }
  ];

  // HOD Directory Table Columns
  const hodColumns = [
    {
      header: 'HOD Officer',
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
      header: 'Department Assignment',
      cell: (row) => (
        <span className="text-xs text-navy-800 font-medium">{row.department || '—'}</span>
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
              onClick={() => {
                setSelectedHodUser(row);
                setNewPasswordVal('');
                setFormError('');
                setIsResetPassOpen(true);
              }}
              icon={Key}
              title="Reset Password"
            >
              Reset Pass
            </Button>
            <Button
              variant={isActive ? 'danger' : 'secondary'}
              size="xs"
              onClick={() => setConfirmToggleHod(row)}
              icon={isActive ? UserX : UserCheck}
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
      {/* Header Banner */}
      <div className="bg-navy-900 rounded-2xl p-6 text-white shadow-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-2 border border-teal-500/30">
            <Users className="w-3.5 h-3.5 mr-1" />
            <span>Head of Department Management</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Academic Department Governance & HOD Roster</h1>
          <p className="mt-1 text-xs sm:text-sm text-navy-200 font-light">
            Manage department assignments, prevent conflicting duplicate HOD allotments, and oversee curriculum workload.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="teal"
            size="md"
            onClick={() => setIsCreateHodOpen(true)}
            icon={UserPlus}
            className="shadow-elevation"
          >
            Provision HOD Account
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={loadData}
            icon={RefreshCw}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Vacancy Warning Banner if any department lacks an HOD */}
      {unassignedDepts.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start space-x-3 text-xs sm:text-sm shadow-subtle">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-amber-950">
              Department Leadership Alert: {unassignedDepts.length} Department(s) Without an Assigned HOD
            </h4>
            <p className="mt-0.5 text-amber-800 text-xs font-light">
              The following engineering units have no designated Head of Department:{' '}
              <span className="font-semibold">{unassignedDepts.map((d) => d.name).join(', ')}</span>. Please assign qualified faculty or HOD accounts below.
            </p>
          </div>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatWidget
          title="Departments Configured"
          value={`${departments.length} Units`}
          subtitle="All B.Tech Programs"
          icon={Building2}
          color="navy"
        />
        <StatWidget
          title="Assigned HODs"
          value={`${departments.filter((d) => d.hasHod).length} / ${departments.length}`}
          subtitle={`${unassignedDepts.length} Vacant Position(s)`}
          icon={Users}
          color="teal"
        />
        <StatWidget
          title="Registered HOD Accounts"
          value={`${hodUsers.length} Officers`}
          subtitle={`${hodUsers.filter((u) => u.status === USER_STATUS.ACTIVE).length} Active in System`}
          icon={BookOpen}
          color="emerald"
        />
        <StatWidget
          title="Syllabus Subjects"
          value={`${subjects.length} Courses`}
          subtitle="Curriculum Progression"
          icon={Layers}
          color="amber"
        />
      </div>

      {/* 1. Department Assignment & Vacancies Table */}
      <Card
        title="Department HOD Assignment & Enrollment Summaries"
        subtitle="Ensure every academic unit has a designated Head of Department without conflicting duplicate assignments"
      >
        <Table
          columns={deptColumns}
          data={departments}
          keyField="id"
          isLoading={isLoading}
          emptyMessage="No departments configured in the database."
        />
      </Card>

      {/* 2. HOD Directory & Account Administration */}
      <Card
        title="HOD Officer Directory & Governance"
        subtitle="Manage HOD credentials, profile editing, and password reset initiation"
        headerAction={
          <Button
            variant="teal"
            size="xs"
            onClick={() => setIsCreateHodOpen(true)}
            icon={UserPlus}
          >
            New HOD User
          </Button>
        }
      >
        <Table
          columns={hodColumns}
          data={hodUsers}
          keyField="_id"
          isLoading={isLoading}
          emptyMessage="No HOD accounts registered."
        />
      </Card>

      {/* 3. Academic Operation & Workload Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="Department Curriculum & Workload Summary"
          subtitle="Active subjects mapped to departments"
        >
          {subjects.length === 0 ? (
            <p className="text-xs text-navy-400 py-6 text-center">No syllabus courses found.</p>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {subjects.slice(0, 8).map((sub) => (
                <div key={sub._id} className="p-3 rounded-xl bg-warm-50 border border-navy-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-navy-900 block">{sub.name}</span>
                    <span className="text-[11px] text-navy-500 font-mono">
                      Code: {sub.code} &bull; Semester {sub.semester}
                    </span>
                  </div>
                  <Badge variant="teal" size="xs">
                    {sub.credits} Credits
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card
          title="Master Timetable Scheduled Slots"
          subtitle="Weekly periods allocated across rooms & venues"
        >
          {timetableSlots.length === 0 ? (
            <p className="text-xs text-navy-400 py-6 text-center">No class timetable slots populated yet.</p>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {timetableSlots.slice(0, 8).map((slot) => (
                <div key={slot._id} className="p-3 rounded-xl bg-white border border-navy-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-navy-900 block">
                      {slot.subject?.name || 'Class Session'}
                    </span>
                    <span className="text-[11px] text-navy-500 font-mono">
                      {slot.dayOfWeek} &bull; Period {slot.periodNumber} &bull; Room: {slot.roomNumber || 'Room 302'}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-navy-600 bg-navy-50 px-2 py-0.5 rounded border border-navy-100">
                    {slot.startTime} - {slot.endTime}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Modal 1: Assign / Reassign HOD */}
      <Modal
        isOpen={isAssignHodOpen}
        onClose={() => setIsAssignHodOpen(false)}
        title={`Assign Head of Department: ${selectedDept?.name || ''}`}
        subtitle="Select a qualified faculty member or HOD account. Conflicting double assignments will be rejected by the backend."
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsAssignHodOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="teal" size="sm" onClick={handleAssignSubmit} isLoading={isSubmitting}>
              Confirm Assignment
            </Button>
          </>
        }
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          {formError && <Notification type="error" message={formError} onClose={() => setFormError('')} />}

          <div>
            <label className="block text-xs font-semibold text-navy-700 uppercase tracking-wider mb-1.5">
              Select Designated HOD <span className="text-rose-500">*</span>
            </label>
            <Select
              id="select-hod"
              value={assignForm.hodUserId}
              onChange={(e) => setAssignForm({ hodUserId: e.target.value })}
              options={[
                { value: '', label: '— Unassign / Leave Vacant —' },
                ...hodUsers.map((h) => ({
                  value: h._id,
                  label: `${h.name} (${h.email}) - Current: ${h.department || 'Unassigned'}`
                }))
              ]}
            />
          </div>
          <p className="text-[11px] text-navy-500">
            Enforces institutional rule: An HOD cannot be concurrently assigned to more than one academic department.
          </p>
        </form>
      </Modal>

      {/* Modal 2: Provision HOD Account */}
      <Modal
        isOpen={isCreateHodOpen}
        onClose={() => setIsCreateHodOpen(false)}
        title="Provision New HOD Account"
        subtitle="Creates an institutional account with role 'HOD' and bcrypt password hashing"
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsCreateHodOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="teal" size="sm" onClick={handleCreateHodSubmit} isLoading={isSubmitting}>
              Create HOD Account
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateHodSubmit} className="space-y-4">
          {formError && <Notification type="error" message={formError} onClose={() => setFormError('')} />}

          <Input
            label="Full Name"
            id="hod-name"
            required
            value={createHodForm.name}
            onChange={(e) => setCreateHodForm({ ...createHodForm, name: e.target.value })}
            placeholder="e.g. Prof. David Kumar"
          />

          <Input
            label="Institutional Email"
            id="hod-email"
            type="email"
            required
            value={createHodForm.email}
            onChange={(e) => setCreateHodForm({ ...createHodForm, email: e.target.value })}
            placeholder="e.g. hod.cse@college.edu"
          />

          <Input
            label="Confidential Password"
            id="hod-pass"
            type="password"
            required
            value={createHodForm.password}
            onChange={(e) => setCreateHodForm({ ...createHodForm, password: e.target.value })}
            placeholder="At least 6 characters"
          />

          <Select
            label="Department Assignment"
            id="hod-dept"
            value={createHodForm.department}
            onChange={(e) => setCreateHodForm({ ...createHodForm, department: e.target.value })}
            options={DEPARTMENTS.map((d) => ({ value: d, label: d }))}
          />
        </form>
      </Modal>

      {/* Modal 3: Reset Password */}
      <Modal
        isOpen={isResetPassOpen}
        onClose={() => setIsResetPassOpen(false)}
        title={`Reset Password for ${selectedHodUser?.name || 'HOD'}`}
        subtitle={`Set a new temporary password for ${selectedHodUser?.email || ''}`}
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsResetPassOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleResetPassSubmit} isLoading={isSubmitting} icon={Key}>
              Apply New Password
            </Button>
          </>
        }
      >
        <form onSubmit={handleResetPassSubmit} className="space-y-4">
          {formError && <Notification type="error" message={formError} onClose={() => setFormError('')} />}

          <Input
            label="New Confidential Password"
            id="reset-hod-pass"
            type="password"
            required
            value={newPasswordVal}
            onChange={(e) => setNewPasswordVal(e.target.value)}
            placeholder="At least 6 characters"
          />
        </form>
      </Modal>

      {/* Confirm Dialog: Activate / Disable */}
      <ConfirmDialog
        isOpen={!!confirmToggleHod}
        onClose={() => setConfirmToggleHod(null)}
        onConfirm={handleConfirmToggleHod}
        title={confirmToggleHod?.status === USER_STATUS.ACTIVE ? 'Disable HOD Account?' : 'Activate HOD Account?'}
        message={
          confirmToggleHod?.status === USER_STATUS.ACTIVE
            ? `Disabling account '${confirmToggleHod?.email}' will prevent them from approving marks, verifying timetables, and accessing HOD dashboards.`
            : `Activating account '${confirmToggleHod?.email}' will restore their access.`
        }
        confirmText={confirmToggleHod?.status === USER_STATUS.ACTIVE ? 'Disable Account' : 'Activate Account'}
        isDanger={confirmToggleHod?.status === USER_STATUS.ACTIVE}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default HodDashboard;
