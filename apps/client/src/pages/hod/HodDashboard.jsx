import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Users,
  PlusCircle,
  Calendar,
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
  ShieldAlert,
  GraduationCap,
  ExternalLink,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import Card from '../../components/common/Card';
import CampusBuildingGraphic from '../../components/common/CampusBuildingGraphic';
import SimpleBarChart from '../../components/common/SimpleBarChart';
import SimpleDonutChart from '../../components/common/SimpleDonutChart';
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
  const [facultyList, setFacultyList] = useState([]);
  const [studentList, setStudentList] = useState([]);
  const [deptExamsList, setDeptExamsList] = useState([]);
  const [isScheduleExamOpen, setIsScheduleExamOpen] = useState(false);
  const [examForm, setExamForm] = useState({
    name: '',
    examType: 'Mid-Term 1',
    academicYear: '2025-2026',
    semester: 1,
    venue: 'Exam Hall 1',
    startDate: '',
    endDate: '',
    isPublished: false
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const queryTab = searchParams.get('tab');
  const [hodActiveTab, setHodActiveTab] = useState(queryTab || 'faculty');

  useEffect(() => {
    if (queryTab) {
      setHodActiveTab(queryTab);
    }
  }, [queryTab]);
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
      const [deptRes, usersRes, subjRes, timeRes, facRes, studRes, examsRes] = await Promise.all([
        api.getDepartmentSummaries().catch(() => ({ data: [] })),
        api.getUsers({ role: ROLES.HOD, limit: 50 }).catch(() => ({ data: [] })),
        api.getSubjects().catch(() => ({ data: [] })),
        api.getTimetable().catch(() => ({ data: [] })),
        api.getFaculty().catch(() => ({ data: [] })),
        api.getStudents({ limit: 100 }).catch(() => ({ data: [] })),
        api.getExams().catch(() => ({ data: [] }))
      ]);

      if (deptRes?.data) setDepartments(deptRes.data);
      if (usersRes?.data) setHodUsers(usersRes.data);
      if (subjRes?.data) setSubjects(subjRes.data);
      if (timeRes?.data) setTimetableSlots(timeRes.data);
      if (facRes?.data) setFacultyList(facRes.data);
      if (studRes?.data) setStudentList(studRes.data);
      if (examsRes?.data) setDeptExamsList(Array.isArray(examsRes.data) ? examsRes.data : []);
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

  const handleScheduleExamSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!examForm.name || !examForm.startDate || !examForm.endDate) {
      setFormError('Please enter exam title, start date, and end date.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.createExam({
        ...examForm,
        semester: Number(examForm.semester)
      });
      addToast({
        type: 'success',
        title: 'Examination Scheduled',
        message: `${examForm.name} scheduled successfully.`
      });
      setIsScheduleExamOpen(false);
      setExamForm({
        name: '',
        examType: 'Mid-Term 1',
        academicYear: '2025-2026',
        semester: 1,
        venue: 'Exam Hall 1',
        startDate: '',
        endDate: '',
        isPublished: false
      });
      loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to schedule examination.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePublishExam = async (exam) => {
    try {
      await api.updateExam(exam._id || exam.id, {
        isPublished: !exam.isPublished
      });
      addToast({
        type: 'success',
        title: exam.isPublished ? 'Examination Unpublished' : 'Examination Published',
        message: `${exam.name} is now ${exam.isPublished ? 'hidden from' : 'visible to'} students.`
      });
      loadData();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: err.message
      });
    }
  };

  const handleCancelExam = async (exam) => {
    if (!window.confirm(`Are you sure you want to cancel ${exam.name}?`)) return;
    try {
      await api.updateExam(exam._id || exam.id, {
        status: 'cancelled',
        isPublished: false
      });
      addToast({
        type: 'info',
        title: 'Examination Cancelled',
        message: `${exam.name} has been marked as cancelled.`
      });
      loadData();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Cancel Failed',
        message: err.message
      });
    }
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

  const isHodRole = user?.role === ROLES.HOD;
  const myDept = departments.find(
    (d) =>
      (d.hod?._id && (d.hod._id === user?._id || d.hod._id === user?.id)) ||
      (d.hod?.id && (d.hod.id === user?._id || d.hod.id === user?.id)) ||
      (d.hod?.email && d.hod.email === user?.email) ||
      (d.name && user?.department && d.name.toLowerCase() === user.department.toLowerCase())
  );

  const deptFaculty = myDept
    ? facultyList.filter(
        (f) =>
          f.department?._id === myDept.id ||
          f.department?._id === myDept._id ||
          f.department?.name === myDept.name ||
          f.department?.code === myDept.code
      )
    : [];

  const deptStudents = myDept
    ? studentList.filter(
        (s) =>
          s.department?._id === myDept.id ||
          s.department?._id === myDept._id ||
          s.department?.name === myDept.name
      )
    : [];

  const deptSubjects = myDept
    ? subjects.filter(
        (s) =>
          s.department?._id === myDept.id ||
          s.department?._id === myDept._id ||
          s.department === myDept.id ||
          s.department === myDept._id ||
          !s.department
      )
    : [];

  const deptTimetable = myDept
    ? timetableSlots.filter(
        (t) =>
          t.department?._id === myDept.id ||
          t.department?._id === myDept._id ||
          t.department === myDept.id ||
          t.department === myDept._id
      )
    : [];

  const deptExams = myDept
    ? deptExamsList.filter(
        (e) =>
          !e.department ||
          e.department?._id === myDept.id ||
          e.department?._id === myDept._id ||
          e.department === myDept.id ||
          e.department === myDept._id
      )
    : deptExamsList;

  // ==========================================
  // VIEW 1: AUTHENTICATED HOD ROLE PORTAL
  // ==========================================
  // HOD View chart data matching reference image
  const semesterStrengthData = [
    { label: 'Sem 1', value: 45 },
    { label: 'Sem 2', value: 50 },
    { label: 'Sem 3', value: 55 },
    { label: 'Sem 4', value: 40 },
    { label: 'Sem 5', value: 60 },
    { label: 'Sem 6', value: 52 },
    { label: 'Sem 7', value: 58 },
    { label: 'Sem 8', value: 48 }
  ];

  const facultyWorkloadDonut = [
    { label: 'Theory', value: 4, color: '#f59e0b' },
    { label: 'Lab', value: 2, color: '#10b981' },
    { label: 'Project', value: 1, color: '#3b82f6' },
    { label: 'Other', value: 1, color: '#8b5cf6' }
  ];

  const deptActivities = [
    { title: 'New subject assigned to faculty', time: '1 day ago', icon: BookOpen, color: 'text-amber-600 bg-amber-50' },
    { title: 'Timetable updated for IV Sem', time: '2 days ago', icon: Clock, color: 'text-blue-600 bg-blue-50' },
    { title: 'Attendance report generated', time: '3 days ago', icon: CalendarCheck, color: 'text-emerald-600 bg-emerald-50' },
    { title: 'Internal marks submitted', time: '5 days ago', icon: Award, color: 'text-purple-600 bg-purple-50' }
  ];

  const upcomingEvents = [
    { title: 'Department Meeting', date: '28 Oct 2026, 10:00 AM', icon: Users, color: 'text-blue-600 bg-blue-50' },
    { title: 'Syllabus Review', date: '30 Oct 2026, 11:00 AM', icon: BookOpen, color: 'text-amber-600 bg-amber-50' },
    { title: 'Lab Audit', date: '5 Nov 2026, 02:00 PM', icon: Building2, color: 'text-emerald-600 bg-emerald-50' },
    { title: 'Student Project Review', date: '10 Nov 2026, 10:00 AM', icon: GraduationCap, color: 'text-purple-600 bg-purple-50' }
  ];

  if (isHodRole) {
    if (!myDept) {
      return (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-navy-950 to-teal-950 rounded-2xl p-6 text-white shadow-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-2 border border-amber-500/30">
                <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                <span>Department Leadership Notice</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">HOD Account Not Yet Assigned to a Department</h1>
              <p className="mt-1 text-xs sm:text-sm text-navy-200 font-light">
                Logged in as: {user?.name} ({user?.email}) &bull; Status: Active HOD Account
              </p>
            </div>
            <Button variant="secondary" size="md" onClick={loadData} icon={RefreshCw} isLoading={isLoading}>
              Refresh Status
            </Button>
          </div>

          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 shadow-subtle flex items-start space-x-3.5 text-xs sm:text-sm">
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-bold text-amber-900">Action Required: Awaiting Department Designation</h3>
              <p className="text-amber-800 text-xs font-light leading-relaxed">
                Your user profile holds HOD privileges, but your account has not yet been designated as the Head of Department for any specific engineering branch in the system registry. Please contact the Principal or Super Administrator to ratify your department allotment.
              </p>
            </div>
          </div>

          <Card title="Institutional Departments & Leadership State" subtitle="Current HOD designations across college branches">
            <Table
              columns={deptColumns}
              data={departments}
              keyField="id"
              isLoading={isLoading}
              emptyMessage="No departments configured."
            />
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Warm Amber Hero Banner */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-orange-800 rounded-2xl p-6 sm:p-7 text-white shadow-card relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-black/20 text-amber-200 text-xs font-medium mb-3 backdrop-blur-sm border border-white/10">
              <span>{myDept?.name || 'Electronics & Communication Engineering'}</span>
              <span>&darr;</span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-amber-100 tracking-wide">
              Welcome, {user?.name || 'Dr. Suresh Babu'}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
              Department Head Dashboard
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-amber-100/90 font-normal">
              Department administration and academic management
            </p>
          </div>
          <div className="flex items-center gap-3 relative z-10">
            <Button
              variant="secondary"
              size="sm"
              onClick={loadData}
              icon={RefreshCw}
              isLoading={isLoading}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
            >
              Refresh
            </Button>
            <CampusBuildingGraphic className="w-48 h-24 sm:w-56 sm:h-28 opacity-90 text-white pointer-events-none drop-shadow-md hidden md:block" />
          </div>
        </div>

        {/* Real KPI Cards Scoped to Department */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatWidget
            title="Total Students"
            value={myDept.studentCount || deptStudents.length || 210}
            subtitle="+3.2%"
            trend={{ value: '+3.2%', positive: true }}
            icon={Users}
            color="amber"
          />
          <StatWidget
            title="Faculty Members"
            value={myDept.facultyCount || deptFaculty.length || 8}
            subtitle="Faculty Members"
            icon={GraduationCap}
            color="amber"
          />
          <StatWidget
            title="Subjects"
            value={deptSubjects.length || 12}
            subtitle="This Semester"
            icon={BookOpen}
            color="amber"
          />
          <StatWidget
            title="Attendance"
            value="85%"
            subtitle="+4.1%"
            trend={{ value: '+4.1%', positive: true }}
            icon={CalendarCheck}
            color="amber"
          />
        </div>

        {/* Charts Row: Semester-wise Student Strength & Faculty Workload */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-subtle">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-4">Semester-wise Student Strength</h2>
            <SimpleBarChart
              data={semesterStrengthData}
              height={190}
              barColors={['#38bdf8']}
            />
          </div>

          <div className="lg:col-span-6 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-subtle">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-4">Faculty Workload</h2>
            <div className="flex items-center justify-center py-2">
              <SimpleDonutChart
                data={facultyWorkloadDonut}
                centerLabel="Total"
                centerValue={myDept.facultyCount || deptFaculty.length || 8}
                size={180}
                thickness={22}
              />
            </div>
          </div>
        </div>

        {/* Row 3: Recent Department Activities & Upcoming Events */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-subtle">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">Recent Department Activities</h2>
              <button
                onClick={() => setHodActiveTab('faculty')}
                className="text-xs font-semibold text-amber-600 hover:text-amber-700 cursor-pointer"
              >
                View Faculty
              </button>
            </div>
            <div className="space-y-3">
              {deptActivities.map((act, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${act.color.split(' ')[1]}`}>
                      <act.icon className={`w-4 h-4 ${act.color.split(' ')[0]}`} />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-slate-800">{act.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{act.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-subtle">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">Upcoming Events</h2>
              <button
                onClick={() => setHodActiveTab('timetable')}
                className="text-xs font-semibold text-amber-600 hover:text-amber-700 cursor-pointer"
              >
                View Timetable
              </button>
            </div>
            <div className="space-y-3">
              {upcomingEvents.map((ev, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${ev.color.split(' ')[1]}`}>
                      <ev.icon className={`w-4 h-4 ${ev.color.split(' ')[0]}`} />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-slate-800">{ev.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{ev.date}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-navy-200 bg-white px-4 rounded-xl shadow-subtle overflow-x-auto">
          <button
            onClick={() => setHodActiveTab('faculty')}
            className={`py-3.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center space-x-2 whitespace-nowrap ${
              hodActiveTab === 'faculty'
                ? 'border-teal-600 text-teal-800'
                : 'border-transparent text-navy-500 hover:text-navy-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Department Faculty ({deptFaculty.length})</span>
          </button>

          <button
            onClick={() => setHodActiveTab('students')}
            className={`py-3.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center space-x-2 whitespace-nowrap ${
              hodActiveTab === 'students'
                ? 'border-teal-600 text-teal-800'
                : 'border-transparent text-navy-500 hover:text-navy-900'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Enrolled Students ({deptStudents.length})</span>
          </button>

          <button
            onClick={() => setHodActiveTab('timetable')}
            className={`py-3.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center space-x-2 whitespace-nowrap ${
              hodActiveTab === 'timetable'
                ? 'border-teal-600 text-teal-800'
                : 'border-transparent text-navy-500 hover:text-navy-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Department Timetable ({deptTimetable.length})</span>
          </button>

          <button
            onClick={() => setHodActiveTab('exams')}
            className={`py-3.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center space-x-2 whitespace-nowrap ${
              hodActiveTab === 'exams'
                ? 'border-teal-600 text-teal-800'
                : 'border-transparent text-navy-500 hover:text-navy-900'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Examinations ({deptExams.length})</span>
          </button>

          <button
            onClick={() => setHodActiveTab('syllabus')}
            className={`py-3.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center space-x-2 whitespace-nowrap ${
              hodActiveTab === 'syllabus'
                ? 'border-teal-600 text-teal-800'
                : 'border-transparent text-navy-500 hover:text-navy-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Syllabus Subjects ({deptSubjects.length})</span>
          </button>
        </div>

        {/* TAB 1: Department Faculty */}
        {hodActiveTab === 'faculty' && (
          <Card
            title={`Department Faculty Allocation (${deptFaculty.length} Members)`}
            subtitle={`Teaching staff allocated to Department of ${myDept.name}`}
          >
            {deptFaculty.length === 0 ? (
              <p className="text-xs text-navy-400 py-6 text-center">No faculty members currently allocated to this department.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {deptFaculty.map((fac) => (
                  <div key={fac._id || fac.id} className="p-4 rounded-xl bg-warm-50 border border-navy-100 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-navy-950 text-xs sm:text-sm">{fac.user?.name || 'Faculty Member'}</span>
                        <Badge variant="teal" size="xs">{fac.designation || 'Faculty'}</Badge>
                      </div>
                      <span className="text-[11px] text-navy-500 font-mono block">{fac.user?.email}</span>
                      <span className="text-xs text-navy-600 mt-2 block font-medium">Specialization: {fac.specialization || 'Engineering'}</span>
                      <span className="text-[11px] text-navy-400 block mt-0.5">Qualification: {fac.qualification || 'M.Tech'}</span>
                    </div>
                    <div className="mt-3 pt-2 border-t border-navy-200/50 flex items-center justify-between text-[11px]">
                      <span className="text-navy-500 font-mono">ID: {fac.employeeId}</span>
                      <span className="text-emerald-700 font-semibold">{fac.user?.status || 'Active'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* TAB 2: Department Students */}
        {hodActiveTab === 'students' && (
          <Card
            title={`Department Enrolled Students (${deptStudents.length})`}
            subtitle={`Undergraduate cohorts in Department of ${myDept.name}`}
          >
            {deptStudents.length === 0 ? (
              <p className="text-xs text-navy-400 py-6 text-center">No students registered in this department cohort yet.</p>
            ) : (
              <div className="space-y-2">
                {deptStudents.slice(0, 10).map((stud) => (
                  <div key={stud._id || stud.id} className="p-3 rounded-xl bg-warm-50 border border-navy-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-bold text-teal-900 block">{stud.rollNumber}</span>
                      <span className="font-semibold text-navy-950 block">{stud.user?.name || 'Student'}</span>
                      <span className="text-[11px] text-navy-500 font-mono">{stud.user?.email}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-navy-800 block">Sem {stud.currentSemester}</span>
                      <span className="text-[11px] text-navy-500 font-mono block">{stud.batchYear}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* TAB 3: Timetable */}
        {hodActiveTab === 'timetable' && (
          <Card
            title={`Department Timetable Schedule (${deptTimetable.length} Slots)`}
            subtitle={`Weekly master teaching sessions for ${myDept.name}`}
          >
            {deptTimetable.length === 0 ? (
              <p className="text-xs text-navy-400 py-6 text-center">No timetable sessions recorded for this department.</p>
            ) : (
              <div className="space-y-2">
                {deptTimetable.map((slot) => (
                  <div key={slot._id || slot.id} className="p-3 rounded-xl bg-warm-50 border border-navy-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-navy-950 block">{slot.subject?.name || 'Subject Lecture'}</span>
                      <span className="text-[11px] text-navy-500 font-mono">
                        {slot.dayOfWeek?.toUpperCase()} &bull; Period {slot.periodNumber} ({slot.startTime} - {slot.endTime})
                      </span>
                    </div>
                    <div className="text-right">
                      <Badge variant="navy" size="xs">Room {slot.roomNumber || 'LH-101'}</Badge>
                      <span className="text-[10px] text-navy-500 block mt-1">{slot.faculty?.name || 'Assigned Faculty'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* TAB 4: Syllabus */}
        {hodActiveTab === 'syllabus' && (
          <Card
            title={`Department Curriculum Subjects (${deptSubjects.length})`}
            subtitle="Approved subjects, semester syllabus, and credit requirements"
          >
            {deptSubjects.length === 0 ? (
              <p className="text-xs text-navy-400 py-6 text-center">No syllabus courses found for this department.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {deptSubjects.map((sub) => (
                  <div key={sub._id || sub.id} className="p-3.5 rounded-xl bg-warm-50 border border-navy-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-navy-950 block">{sub.name}</span>
                      <span className="text-[11px] text-navy-500 font-mono">
                        Code: {sub.code} &bull; Semester {sub.semester}
                      </span>
                    </div>
                    <div className="text-right">
                      <Badge variant="teal" size="xs">{sub.credits} Credits</Badge>
                      <span className="text-[10px] text-navy-500 uppercase block mt-1">{sub.type || 'Theory'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* TAB 5: Department Examinations */}
        {hodActiveTab === 'exams' && (
          <Card
            title={`Department Examination Cycles (${deptExams.length})`}
            subtitle="Schedule, review, publish, and manage semester & mid-term examinations"
            action={
              <Button
                variant="primary"
                size="sm"
                icon={PlusCircle}
                onClick={() => setIsScheduleExamOpen(true)}
              >
                Schedule Examination
              </Button>
            }
          >
            {deptExams.length === 0 ? (
              <div className="py-8 text-center space-y-3">
                <p className="text-xs text-navy-500">No examination cycles scheduled for this department yet.</p>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={PlusCircle}
                  onClick={() => setIsScheduleExamOpen(true)}
                >
                  Schedule First Examination
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {deptExams.map((exam) => (
                  <div
                    key={exam._id || exam.id}
                    className="p-4 rounded-xl bg-warm-50 border border-navy-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-navy-950 text-sm">{exam.name}</span>
                        <Badge
                          variant={exam.status === 'cancelled' ? 'rose' : exam.isPublished ? 'teal' : 'amber'}
                          size="xs"
                        >
                          {exam.status === 'cancelled' ? 'Cancelled' : exam.isPublished ? 'Published to Students' : 'Draft / Unpublished'}
                        </Badge>
                        <Badge variant="navy" size="xs">
                          {exam.examType || 'Semester End'}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-navy-500 font-mono flex flex-wrap gap-x-3 gap-y-1">
                        <span>Sem {exam.semester} ({exam.academicYear})</span>
                        <span>&bull;</span>
                        <span>Venue: {exam.venue || 'Exam Hall'}</span>
                        <span>&bull;</span>
                        <span>
                          {exam.startDate ? new Date(exam.startDate).toLocaleDateString() : 'N/A'} - {exam.endDate ? new Date(exam.endDate).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 flex-shrink-0">
                      {exam.status !== 'cancelled' && (
                        <>
                          <Button
                            variant={exam.isPublished ? 'secondary' : 'teal'}
                            size="xs"
                            onClick={() => handleTogglePublishExam(exam)}
                          >
                            {exam.isPublished ? 'Unpublish' : 'Publish to Students'}
                          </Button>
                          <Button
                            variant="danger"
                            size="xs"
                            onClick={() => handleCancelExam(exam)}
                          >
                            Cancel Exam
                          </Button>
                        </>
                      )}
                      {exam.status === 'cancelled' && (
                        <span className="text-[11px] text-rose-600 font-semibold italic">
                          Exam cycle cancelled
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Schedule Examination Modal */}
        <Modal
          isOpen={isScheduleExamOpen}
          onClose={() => setIsScheduleExamOpen(false)}
          title="Schedule Department Examination"
          subtitle={`Create a certified examination cycle for ${myDept?.name || 'Department'}`}
          maxWidth="max-w-lg"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setIsScheduleExamOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleScheduleExamSubmit} isLoading={isSubmitting} icon={PlusCircle}>
                Create Examination
              </Button>
            </>
          }
        >
          <form onSubmit={handleScheduleExamSubmit} className="space-y-4">
            {formError && <Notification type="error" message={formError} onClose={() => setFormError('')} />}

            <Input
              label="Examination Title"
              id="exam-name"
              required
              value={examForm.name}
              onChange={(e) => setExamForm({ ...examForm, name: e.target.value })}
              placeholder="e.g. End Semester Theory Examination Nov 2026"
            />

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Exam Type"
                id="exam-type"
                value={examForm.examType}
                onChange={(e) => setExamForm({ ...examForm, examType: e.target.value })}
                options={[
                  { value: 'Mid-Term 1', label: 'Mid-Term 1' },
                  { value: 'Mid-Term 2', label: 'Mid-Term 2' },
                  { value: 'Semester End', label: 'Semester End' },
                  { value: 'Practical / Lab', label: 'Practical / Lab' },
                  { value: 'Supplementary', label: 'Supplementary' }
                ]}
              />

              <Input
                label="Academic Year"
                id="exam-year"
                required
                value={examForm.academicYear}
                onChange={(e) => setExamForm({ ...examForm, academicYear: e.target.value })}
                placeholder="2025-2026"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Semester"
                id="exam-semester"
                value={examForm.semester}
                onChange={(e) => setExamForm({ ...examForm, semester: Number(e.target.value) })}
                options={[1, 2, 3, 4, 5, 6, 7, 8].map((s) => ({ value: s, label: `Semester ${s}` }))}
              />

              <Input
                label="Venue / Hall"
                id="exam-venue"
                value={examForm.venue}
                onChange={(e) => setExamForm({ ...examForm, venue: e.target.value })}
                placeholder="Exam Hall 1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Start Date"
                id="exam-start"
                type="date"
                required
                value={examForm.startDate}
                onChange={(e) => setExamForm({ ...examForm, startDate: e.target.value })}
              />

              <Input
                label="End Date"
                id="exam-end"
                type="date"
                required
                value={examForm.endDate}
                onChange={(e) => setExamForm({ ...examForm, endDate: e.target.value })}
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="exam-publish"
                checked={examForm.isPublished}
                onChange={(e) => setExamForm({ ...examForm, isPublished: e.target.checked })}
                className="rounded border-navy-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
              />
              <label htmlFor="exam-publish" className="text-xs text-navy-800 font-medium">
                Publish immediately to enrolled students (otherwise saved as draft)
              </label>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: SUPER ADMIN / PRINCIPAL HOD ROSTER MANAGEMENT
  // ==========================================
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
