import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  CalendarCheck,
  Calendar,
  ShieldCheck,
  Award,
  BookOpen,
  Clock,
  CheckCircle,
  Users,
  Search,
  UserPlus,
  RefreshCw,
  Edit2,
  Key,
  UserCheck,
  UserX,
  Mail,
  Building2,
  GraduationCap,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  FileText,
  FileSpreadsheet,
  TrendingUp
} from 'lucide-react';
import Card from '../../components/common/Card';
import CampusBuildingGraphic from '../../components/common/CampusBuildingGraphic';
import DashboardHeaderBanner from '../../components/dashboard/DashboardHeaderBanner';
import DashboardKPICard from '../../components/dashboard/DashboardKPICard';
import DashboardAnalyticsRow from '../../components/dashboard/DashboardAnalyticsRow';
import DashboardWidgetsRow from '../../components/dashboard/DashboardWidgetsRow';
import DashboardModulesNav from '../../components/dashboard/DashboardModulesNav';
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
import RoleLeaveManagement from '../../components/leave/RoleLeaveManagement';
import api from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ROLES, USER_STATUS, DEPARTMENTS } from '@college-erp/shared';

export const FacultyDashboard = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [facultyList, setFacultyList] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [timetableSlots, setTimetableSlots] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [myProfile, setMyProfile] = useState(null);
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [myLeaves, setMyLeaves] = useState([]);
  const [isApplyLeaveOpen, setIsApplyLeaveOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    leaveType: 'casual',
    startDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    reason: ''
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const queryTab = searchParams.get('tab');
  const normalizeTab = (t) => {
    if (!t) return 'timetable';
    if (t === 'leaves' || t === 'leave' || t === 'leave-management') return 'leave';
    if (t === 'substitutions' || t === 'substitution' || t === 'workload') return 'substitutions';
    if (t === 'insights' || t === 'risk') return 'insights';
    return t;
  };
  const [facultyActiveTab, setFacultyActiveTab] = useState(normalizeTab(queryTab));
  const [workloadData, setWorkloadData] = useState(null);
  const [substitutionsList, setSubstitutionsList] = useState([]);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [subForm, setSubForm] = useState({
    slotId: '',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    substituteFacultyId: '',
    reason: 'Academic duty / conference'
  });

  useEffect(() => {
    if (queryTab) {
      setFacultyActiveTab(normalizeTab(queryTab));
    }
  }, [queryTab]);
  // Phase 3 Academic Insights State
  const [academicInsights, setAcademicInsights] = useState(null);
  const [isInsightsLoading, setIsInsightsLoading] = useState(false);

  const loadAcademicInsights = useCallback(async () => {
    setIsInsightsLoading(true);
    try {
      const res = await api.getAcademicInsights();
      if (res?.data) {
        setAcademicInsights(res.data);
      }
    } catch {
      // Non-blocking fallback
    } finally {
      setIsInsightsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (facultyActiveTab === 'insights') {
      loadAcademicInsights();
    }
  }, [facultyActiveTab, loadAcademicInsights]);

  const [isMarkAttendanceOpen, setIsMarkAttendanceOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('');
  const [selectedDesigFilter, setSelectedDesigFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [confirmToggleUser, setConfirmToggleUser] = useState(null);

  // Forms
  const [editForm, setEditForm] = useState({
    designation: 'Assistant Professor',
    department: '',
    qualification: '',
    specialization: ''
  });

  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    employeeId: '',
    departmentId: '',
    designation: 'Assistant Professor',
    qualification: 'M.Tech in Engineering',
    specialization: ''
  });

  const [attendanceForm, setAttendanceForm] = useState({
    subject: '',
    date: new Date().toISOString().split('T')[0],
    periodNumber: 1,
    status: 'present',
    studentId: '',
    remarks: 'Regular period lecture'
  });

  const [newPasswordVal, setNewPasswordVal] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFacultyRole = user?.role === ROLES.FACULTY;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isFacultyRole) {
        const [myProfRes, subjRes, timeRes, studRes, examRes, attRes] = await Promise.all([
          api.getMyFacultyProfile().catch(() => ({ data: null })),
          api.getSubjects().catch(() => ({ data: [] })),
          api.getTimetable().catch(() => ({ data: [] })),
          api.getStudents({ limit: 100 }).catch(() => ({ data: [] })),
          api.getExams().catch(() => ({ data: [] })),
          api.getAttendance().catch(() => ({ data: [] }))
        ]);

        if (myProfRes?.data) setMyProfile(myProfRes.data);
        if (subjRes?.data) setSubjects(subjRes.data);
        if (timeRes?.data) setTimetableSlots(timeRes.data);
        const leavesRes = await api.getLeaves().catch(() => ({ data: [] }));
        if (leavesRes?.data?.leaves) setMyLeaves(leavesRes.data.leaves);
        else if (Array.isArray(leavesRes?.data)) setMyLeaves(leavesRes.data);
        if (studRes?.data) {
          setStudents(studRes.data);
          if (studRes.data.length > 0) {
            setAttendanceForm((prev) => ({ ...prev, studentId: studRes.data[0]._id || studRes.data[0].id }));
          }
        }
        if (examRes?.data) setExams(Array.isArray(examRes.data) ? examRes.data : (examRes.data?.exams || []));
        if (attRes?.data) setAttendanceRecords(attRes.data);
        const [wRes, subRes] = await Promise.all([
          api.getFacultyWorkload().catch(() => ({ data: null })),
          api.getSubstitutions().catch(() => ({ data: [] }))
        ]);
        if (wRes?.data) setWorkloadData(wRes.data);
        if (subRes?.data) setSubstitutionsList(subRes.data);
        if (subjRes?.data?.length > 0) {
          setAttendanceForm((prev) => ({ ...prev, subject: subjRes.data[0]._id || subjRes.data[0].id }));
        }
      } else {
        const [facRes, subjRes, timeRes, deptRes, usersRes] = await Promise.all([
          api.getFaculty({
            department: selectedDeptFilter,
            designation: selectedDesigFilter
          }).catch(() => ({ data: [] })),
          api.getSubjects().catch(() => ({ data: [] })),
          api.getTimetable().catch(() => ({ data: [] })),
          api.getDepartments().catch(() => ({ data: [] })),
          api.getUsers({ role: ROLES.FACULTY, limit: 100 }).catch(() => ({ data: [] }))
        ]);

        if (facRes?.data) setFacultyList(facRes.data);
        if (subjRes?.data) setSubjects(subjRes.data);
        if (timeRes?.data) setTimetableSlots(timeRes.data);
        if (deptRes?.data) setDepartments(deptRes.data);
        if (usersRes?.data) setAllUsers(usersRes.data);
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Error loading faculty workplace',
        message: err.message
      });
    } finally {
      setIsLoading(false);
    }
  }, [isFacultyRole, selectedDeptFilter, selectedDesigFilter, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open Edit Profile
  const handleOpenEdit = (fac) => {
    setSelectedFaculty(fac);
    setEditForm({
      designation: fac.designation || 'Assistant Professor',
      department: fac.department?._id || fac.department?.id || '',
      qualification: fac.qualification || '',
      specialization: fac.specialization || ''
    });
    setFormError('');
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFaculty) return;
    setFormError('');

    setIsSubmitting(true);
    try {
      await api.updateFaculty(selectedFaculty._id || selectedFaculty.id, editForm);
      addToast({
        type: 'success',
        title: 'Faculty Profile Updated',
        message: `Updated profile details for employee ${selectedFaculty.employeeId}`
      });
      setIsEditOpen(false);
      loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to update faculty profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Create Faculty
  const handleOpenCreate = () => {
    setCreateForm({
      name: '',
      email: '',
      password: '',
      employeeId: `FAC-${Date.now().toString().slice(-4)}`,
      departmentId: departments[0]?._id || '',
      designation: 'Assistant Professor',
      qualification: 'M.Tech / Ph.D.',
      specialization: 'Computer Systems'
    });
    setFormError('');
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!createForm.name || !createForm.email || !createForm.password || !createForm.employeeId) {
      setFormError('Please fill in all mandatory fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create or ensure user account
      const userRes = await api.createUser({
        name: createForm.name,
        email: createForm.email,
        password: createForm.password,
        role: ROLES.FACULTY,
        department: departments.find((d) => d._id === createForm.departmentId)?.name || 'Engineering',
        status: USER_STATUS.ACTIVE
      });

      const newUserId = userRes.data?.id || userRes.data?._id;

      // 2. Create faculty record
      await api.createFaculty({
        user: newUserId,
        employeeId: createForm.employeeId,
        department: createForm.departmentId || departments[0]?._id,
        designation: createForm.designation,
        qualification: createForm.qualification,
        specialization: createForm.specialization
      });

      addToast({
        type: 'success',
        title: 'Faculty Provisioned',
        message: `Created faculty account & employee profile for ${createForm.email}`
      });
      setIsCreateOpen(false);
      loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to provision faculty profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset Password
  const handleResetPassSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFaculty?.user?._id) return;
    if (!newPasswordVal || newPasswordVal.length < 6) {
      setFormError('New password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.resetUserPassword(selectedFaculty.user._id, newPasswordVal);
      addToast({
        type: 'success',
        title: 'Password Reset',
        message: `Temporary password assigned to ${selectedFaculty.user.email}`
      });
      setIsResetOpen(false);
      loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to reset password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Status
  const handleApplyLeaveSubmit = async (e) => {
    e.preventDefault();
    if (!leaveForm.reason.trim()) {
      setFormError('Please enter a reason for leave.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.applyLeave(leaveForm);
      addToast({
        type: 'success',
        title: 'Leave Application Submitted',
        message: 'Your leave application has been submitted for review.'
      });
      setIsApplyLeaveOpen(false);
      setLeaveForm({
        leaveType: 'casual',
        startDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        endDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
        reason: ''
      });
      const freshLeaves = await api.getLeaves().catch(() => ({ data: [] }));
      if (freshLeaves?.data?.leaves) setMyLeaves(freshLeaves.data.leaves);
      else if (Array.isArray(freshLeaves?.data)) setMyLeaves(freshLeaves.data);
    } catch (err) {
      addToast({ type: 'error', title: 'Submission Failed', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmToggle = async () => {
    if (!confirmToggleUser?.user?._id) return;
    const currentStatus = confirmToggleUser.user.status;
    const newStatus = currentStatus === USER_STATUS.ACTIVE ? USER_STATUS.DISABLED : USER_STATUS.ACTIVE;

    setIsSubmitting(true);
    try {
      await api.updateUserStatus(confirmToggleUser.user._id, newStatus);
      addToast({
        type: 'success',
        title: 'Status Updated',
        message: `Faculty user ${confirmToggleUser.user.email} is now ${newStatus}.`
      });
      setConfirmToggleUser(null);
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

  // Submit Attendance Session
  const handleMarkAttendanceSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!attendanceForm.subject || !attendanceForm.studentId) {
      setFormError('Please select both a subject and a student.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.markAttendanceBatch({
        subject: attendanceForm.subject,
        date: attendanceForm.date,
        periodNumber: Number(attendanceForm.periodNumber),
        records: [
          {
            studentId: attendanceForm.studentId,
            status: attendanceForm.status,
            remarks: attendanceForm.remarks
          }
        ]
      });
      addToast({
        type: 'success',
        title: 'Attendance Session Recorded',
        message: 'Student session attendance persisted to MongoDB.'
      });
      setIsMarkAttendanceOpen(false);
      loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to submit attendance session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered Faculty List by Search
  const filteredFaculty = facultyList.filter((f) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.employeeId?.toLowerCase().includes(q) ||
      f.user?.name?.toLowerCase().includes(q) ||
      f.user?.email?.toLowerCase().includes(q) ||
      f.specialization?.toLowerCase().includes(q)
    );
  });

  // Columns for Faculty Directory Table
  const facultyColumns = [
    {
      header: 'Employee ID & Details',
      cell: (row) => (
        <div>
          <span className="font-semibold text-navy-950 text-sm block">
            {row.user?.name || 'Faculty Member'}
          </span>
          <span className="text-xs text-teal-800 font-mono font-bold">
            {row.employeeId}
          </span>
        </div>
      )
    },
    {
      header: 'Department',
      cell: (row) => (
        <span className="text-xs text-navy-800 font-medium">
          {row.department?.name || 'â€”'}
        </span>
      )
    },
    {
      header: 'Designation',
      cell: (row) => (
        <Badge variant="teal" size="xs">
          {row.designation}
        </Badge>
      )
    },
    {
      header: 'Specialization & Degree',
      cell: (row) => (
        <div>
          <span className="text-xs text-navy-900 block">{row.specialization || 'Engineering'}</span>
          <span className="text-[11px] text-navy-500 font-light">{row.qualification || 'M.Tech'}</span>
        </div>
      )
    },
    {
      header: 'Status',
      cell: (row) => {
        const isActive = row.user?.status === USER_STATUS.ACTIVE;
        return (
          <span className="inline-flex items-center space-x-1.5">
            <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            <span className={`text-xs font-semibold capitalize ${isActive ? 'text-emerald-700' : 'text-rose-700'}`}>
              {row.user?.status || 'Active'}
            </span>
          </span>
        );
      }
    },
    {
      header: 'Actions',
      cellClassName: 'text-right',
      cell: (row) => {
        const isActive = row.user?.status === USER_STATUS.ACTIVE;
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
              onClick={() => {
                setSelectedFaculty(row);
                setNewPasswordVal('');
                setFormError('');
                setIsResetOpen(true);
              }}
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
            >
              {isActive ? 'Disable' : 'Activate'}
            </Button>
          </div>
        );
      }
    }
  ];

  // ==========================================
  // VIEW 1: AUTHENTICATED FACULTY SELF-SERVICE WORKPLACE
  // ==========================================
  // Faculty timetable & attendance data matching reference image
  const facultyTodayTimetable = [
    { time: '09:00 AM - 10:00 AM', subject: 'Molecular Biology', cohort: 'IV B.Tech', room: 'Room 301' },
    { time: '10:00 AM - 11:00 AM', subject: 'Bioprocess Engineering', cohort: 'IV B.Tech', room: 'Room 302' },
    { time: '02:00 PM - 03:00 PM', subject: 'Lab Session', cohort: 'Biotech Lab', room: 'Lab B' },
    { time: '03:00 PM - 04:00 PM', subject: 'Project Guidance', cohort: 'IV B.Tech', room: 'Seminar Hall' }
  ];

  const facultyAttendanceDonut = [
    { label: 'Present', value: 92, color: '#10b981' },
    { label: 'Absent', value: 6, color: '#ef4444' },
    { label: 'Late', value: 2, color: '#f59e0b' }
  ];

  const facultySubjectsList = [
    { code: 'BT301', name: 'Molecular Biology', students: 14 },
    { code: 'BT302', name: 'Bioprocess Engineering', students: 16 },
    { code: 'BT401', name: 'Biotech Laboratory', students: 12 }
  ];

  const facultyRecentActivities = [
    { title: 'Attendance marked - BT301', time: '2 hours ago', icon: CalendarCheck, color: 'text-purple-600 bg-purple-50' },
    { title: 'Lab records updated', time: '1 day ago', icon: FileSpreadsheet, color: 'text-blue-600 bg-blue-50' },
    { title: 'Internal marks submitted', time: '2 days ago', icon: Award, color: 'text-emerald-600 bg-emerald-50' },
    { title: 'Student meeting conducted', time: '3 days ago', icon: Users, color: 'text-amber-600 bg-amber-50' }
  ];

  if (isFacultyRole) {
    const facultyUser = myProfile || facultyList.find((f) => f.user?._id === user?._id || f.user?.id === user?._id);
    const myDeptName = facultyUser?.department?.name || user?.department || 'Engineering';
    const mySlots = timetableSlots.filter(
      (t) =>
        t.faculty?._id === user?._id ||
        t.faculty?.id === user?._id ||
        t.faculty?.email === user?.email ||
        t.faculty?._id === facultyUser?._id
    );
    const mySubjects = subjects.filter((s) => s.department?.name === myDeptName || !s.department);
    const myStudents = students.filter((s) => s.department?.name === myDeptName || !s.department);

    return (
      <div className="space-y-6">
        {/* 1. Header Banner */}
        <DashboardHeaderBanner
          title="Faculty Academic Portal"
          subtitle="Teaching schedules, period attendance registers, internal marks entry, and leave applications."
          academicYear="2026 – 2027"
        />

        {/* 2. 5-KPI Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <DashboardKPICard
            title="Total Students Taught"
            value={myStudents.length || 184}
            icon={Users}
            trend="+3.2%"
            trendDirection="up"
            color="emerald"
          />
          <DashboardKPICard
            title="Assigned Subjects"
            value={mySubjects.length || 3}
            icon={BookOpen}
            trend="Active"
            trendDirection="up"
            color="blue"
          />
          <DashboardKPICard
            title="Weekly Classes"
            value={mySlots.length ? `${mySlots.length} Slots` : '18 Slots'}
            icon={Clock}
            color="amber"
          />
          <DashboardKPICard
            title="Class Attendance"
            value="91%"
            icon={CalendarCheck}
            trend="+2.0%"
            trendDirection="up"
            color="rose"
          />
          <DashboardKPICard
            title="Leave Balance"
            value={`${user?.leaveBalance ?? 12} Days`}
            icon={ShieldCheck}
            trend="Available"
            trendDirection="up"
            color="purple"
          />
        </div>

        {/* 3. Analytics Row */}
        <DashboardAnalyticsRow
          chartTitle="Weekly Attendance Average"
          donutTitle="Subject Teaching Load"
          totalCount={String(myStudents.length || 184)}
          totalCountLabel="Students"
          quickActions={[
            { label: 'Mark Attendance', icon: CalendarCheck, color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
            { label: 'Apply Leave', icon: Clock, color: 'bg-sky-50 text-sky-800 border-sky-200' },
            { label: 'Enter Marks', icon: Award, color: 'bg-amber-50 text-amber-800 border-amber-200' },
            { label: 'Timetable', icon: Calendar, color: 'bg-purple-50 text-purple-800 border-purple-200' }
          ]}
          onActionClick={(label) => {
            if (label === 'Mark Attendance') setIsMarkAttendanceOpen(true);
            else if (label === 'Apply Leave') setFacultyActiveTab('leave');
            else if (label === 'Enter Marks') setFacultyActiveTab('marks');
            else if (label === 'Timetable') setFacultyActiveTab('timetable');
          }}
        />

        {/* 4. Lower Widgets Row */}
        <DashboardWidgetsRow />

        {/* 5. Modules Grid */}
        <DashboardModulesNav />

        {/* Navigation Tabs */}
        <div className="flex border-b border-navy-200 bg-white px-4 rounded-xl shadow-subtle overflow-x-auto">
          <button
            onClick={() => setFacultyActiveTab('timetable')}
            className={`py-3.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center space-x-2 whitespace-nowrap ${
              facultyActiveTab === 'timetable'
                ? 'border-teal-600 text-teal-800'
                : 'border-transparent text-navy-500 hover:text-navy-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Weekly Teaching Timetable ({mySlots.length})</span>
          </button>

          <button
            onClick={() => setFacultyActiveTab('courses')}
            className={`py-3.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center space-x-2 whitespace-nowrap ${
              facultyActiveTab === 'courses'
                ? 'border-teal-600 text-teal-800'
                : 'border-transparent text-navy-500 hover:text-navy-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Assigned Courses & Syllabus ({mySubjects.length})</span>
          </button>

          <button
            onClick={() => setFacultyActiveTab('roster')}
            className={`py-3.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center space-x-2 whitespace-nowrap ${
              facultyActiveTab === 'roster'
                ? 'border-teal-600 text-teal-800'
                : 'border-transparent text-navy-500 hover:text-navy-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Classroom Student Rosters ({myStudents.length})</span>
          </button>

          <button
            onClick={() => setFacultyActiveTab('exams')}
            className={`py-3.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center space-x-2 whitespace-nowrap ${
              facultyActiveTab === 'exams'
                ? 'border-teal-600 text-teal-800'
                : 'border-transparent text-navy-500 hover:text-navy-900'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Examinations & Assessments ({exams.length})</span>
          </button>

          <button
            onClick={() => setFacultyActiveTab('leave')}
            className={`py-3.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center space-x-2 whitespace-nowrap ${
              facultyActiveTab === 'leave'
                ? 'border-teal-600 text-teal-800'
                : 'border-transparent text-navy-500 hover:text-navy-900'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Leave Management & Approvals</span>
          </button>

          <button
            onClick={() => setFacultyActiveTab('substitutions')}
            className={`py-3.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center space-x-2 whitespace-nowrap ${
              facultyActiveTab === 'substitutions'
                ? 'border-teal-600 text-teal-800'
                : 'border-transparent text-navy-500 hover:text-navy-900'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Workload & Substitutions ({substitutionsList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setFacultyActiveTab('insights')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              facultyActiveTab === 'insights'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-navy-600 hover:text-navy-950 hover:bg-warm-100'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Academic Insights & Pass Probability</span>
          </button>
        </div>

        {/* TAB 1: Weekly Timetable */}
        {facultyActiveTab === 'timetable' && (
          <Card
            title="Weekly Teaching Schedule & Timetable Slots"
            subtitle="Lecture periods and classroom allotments assigned to your faculty profile"
          >
            {mySlots.length === 0 ? (
              <p className="text-xs text-navy-400 py-6 text-center">No individual timetable sessions scheduled for your profile this week.</p>
            ) : (
              <div className="space-y-2">
                {mySlots.map((slot) => (
                  <div key={slot._id || slot.id} className="p-3.5 rounded-xl bg-warm-50 border border-navy-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-navy-950 block">{slot.subject?.name || 'Class Lecture'}</span>
                      <span className="text-[11px] text-navy-500 font-mono">
                        {slot.dayOfWeek?.toUpperCase()} &bull; Period {slot.periodNumber} ({slot.startTime} - {slot.endTime})
                      </span>
                    </div>
                    <div className="text-right">
                      <Badge variant="teal" size="xs">Room {slot.roomNumber || 'LH-101'}</Badge>
                      <span className="text-[10px] text-navy-500 block mt-1">Section A &bull; {slot.department?.name || 'Engineering'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* TAB 2: Courses */}
        {facultyActiveTab === 'courses' && (
          <Card
            title="Assigned Courses & Curriculum Syllabus"
            subtitle="Subject syllabus, course codes, and lecture credit allocations"
          >
            {mySubjects.length === 0 ? (
              <p className="text-xs text-navy-400 py-6 text-center">No curriculum subjects allocated.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {mySubjects.map((sub) => (
                  <div key={sub._id || sub.id} className="p-3.5 rounded-xl bg-warm-50 border border-navy-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-navy-950 block">{sub.name}</span>
                      <span className="text-[11px] text-navy-500 font-mono">
                        Code: {sub.code} &bull; Semester {sub.semester}
                      </span>
                    </div>
                    <div className="text-right">
                      <Badge variant="navy" size="xs">{sub.credits} Credits</Badge>
                      <span className="text-[10px] text-navy-500 uppercase block mt-1">{sub.type || 'Theory'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* TAB 3: Student Roster */}
        {facultyActiveTab === 'roster' && (
          <Card
            title="Classroom Student Rosters"
            subtitle={`Enrolled undergraduate students in Department of ${myDeptName}`}
            headerAction={
              <Button variant="teal" size="xs" onClick={() => setIsMarkAttendanceOpen(true)} icon={CalendarCheck}>
                Mark Session
              </Button>
            }
          >
            {myStudents.length === 0 ? (
              <p className="text-xs text-navy-400 py-6 text-center">No student records enrolled in your department.</p>
            ) : (
              <div className="space-y-2">
                {myStudents.slice(0, 15).map((stud) => (
                  <div key={stud._id || stud.id} className="p-3 rounded-xl bg-warm-50 border border-navy-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-bold text-teal-900 block">{stud.rollNumber}</span>
                      <span className="font-semibold text-navy-950 block">{stud.user?.name || 'Student'}</span>
                      <span className="text-[11px] text-navy-500 font-mono">{stud.user?.email}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-navy-800 block">Semester {stud.currentSemester}</span>
                      <span className="text-[11px] text-navy-500 font-mono block">{stud.batchYear}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* TAB 4: Exams */}
        {facultyActiveTab === 'exams' && (
          <Card
            title="Institutional Examinations & Assessment Information"
            subtitle="Scheduled mid-term and semester evaluation cycles"
            action={
              <Link to="/results">
                <Button variant="teal" size="xs">
                  Enter / Record Marks &rarr;
                </Button>
              </Link>
            }
          >
            {exams.length === 0 ? (
              <p className="text-xs text-navy-400 py-6 text-center">No examination cycles currently scheduled.</p>
            ) : (
              <div className="space-y-2">
                {exams.map((ex) => (
                  <div key={ex.id || ex._id} className="p-3.5 rounded-xl bg-warm-50 border border-navy-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-navy-950 block">{ex.name}</span>
                      <span className="text-[11px] text-navy-500 font-mono">
                        {ex.examType?.toUpperCase()} &bull; Semester {ex.semester} ({ex.academicYear})
                      </span>
                    </div>
                    <div className="text-right">
                      <Badge variant="teal" size="xs">{ex.timelineStatus || 'Scheduled'}</Badge>
                      <span className="text-[10px] text-navy-500 block mt-1">
                        {ex.isPublished ? 'Grades Published' : 'Evaluation Pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* TAB 5: Role-Based Leave Management & Student Approvals */}
        {facultyActiveTab === 'leave' && (
          <RoleLeaveManagement defaultTab="approvals" />
        )}

        {/* TAB 6: Faculty Workload & Substitution Management */}
        {facultyActiveTab === 'substitutions' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatWidget
                title="Weekly Teaching Load"
                value={`${workloadData?.weeklyClasses || mySlots.length} Classes`}
                icon={Clock}
                color="teal"
                subtitle={`${workloadData?.totalWeeklyHours || mySlots.length * 1} scheduled lecture hours`}
              />
              <StatWidget
                title="Workload Standing"
                value={workloadData?.status || 'Balanced'}
                icon={CheckCircle2}
                color={workloadData?.status === 'Overloaded' ? 'rose' : 'emerald'}
                subtitle="Institutional cap: 20 hrs/week"
              />
              <StatWidget
                title="Active Substitutions"
                value={substitutionsList.length}
                icon={RefreshCw}
                color="indigo"
                subtitle="Covered & assigned lectures"
              />
            </div>

            <Card
              title="Classroom Substitution Requests & Adjustments"
              subtitle="Peer faculty teaching coverage to ensure uninterrupted student lectures"
              action={
                <Button size="xs" variant="primary" onClick={() => setIsSubModalOpen(true)}>
                  <RefreshCw className="w-3.5 h-3.5 mr-1" />
                  Request Substitution
                </Button>
              }
            >
              {substitutionsList.length === 0 ? (
                <p className="text-xs text-navy-400 py-6 text-center">No substitution requests recorded for this academic term.</p>
              ) : (
                <div className="divide-y divide-slate-100 text-xs">
                  {substitutionsList.map((sub) => (
                    <div key={sub._id} className="p-3 hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-navy-900">{sub.slot?.subject?.name || 'Class Lecture'}</span>
                          <Badge
                            variant={
                              sub.status === 'approved' ? 'emerald' : sub.status === 'rejected' ? 'rose' : 'amber'
                            }
                            size="xs"
                          >
                            {sub.status.toUpperCase()}
                          </Badge>
                          <span className="text-navy-500 font-mono">Date: {new Date(sub.date).toLocaleDateString()}</span>
                        </div>
                        <p className="text-[11px] text-navy-500 mt-0.5">
                          Original: {sub.originalFaculty?.name || 'Self'} &bull; Substitute: <span className="font-semibold text-navy-800">{sub.substituteFaculty?.name || 'Substitute'}</span> &bull; {sub.reason}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        {sub.status === 'pending' && user?.role === ROLES.HOD && (
                          <>
                            <Button
                              size="xs"
                              variant="primary"
                              onClick={async () => {
                                try {
                                  await api.updateSubstitutionStatus(sub._id, { status: 'approved' });
                                  addToast({ type: 'success', title: 'Substitution Approved', message: 'Lecture coverage confirmed.' });
                                  loadData();
                                } catch (err) {
                                  addToast({ type: 'error', title: 'Error', message: err.message });
                                }
                              }}
                            >
                              Approve
                            </Button>
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={async () => {
                                try {
                                  await api.updateSubstitutionStatus(sub._id, { status: 'rejected' });
                                  addToast({ type: 'info', title: 'Rejected', message: 'Substitution request declined.' });
                                  loadData();
                                } catch (err) {
                                  addToast({ type: 'error', title: 'Error', message: err.message });
                                }
                              }}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Request Substitution Modal */}
      <Modal isOpen={isSubModalOpen} onClose={() => setIsSubModalOpen(false)} title="Request Faculty Class Substitution" size="md">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await api.requestSubstitution(subForm);
              addToast({ type: 'success', title: 'Request Submitted', message: 'Substitution request logged for HOD review.' });
              setIsSubModalOpen(false);
              loadData();
            } catch (err) {
              addToast({ type: 'error', title: 'Request Failed', message: err.message });
            }
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <label className="block font-semibold text-navy-700 mb-1">Select Timetable Period</label>
            <select
              value={subForm.slotId}
              onChange={(e) => setSubForm({ ...subForm, slotId: e.target.value })}
              className="w-full border border-navy-200 rounded-lg px-2.5 py-1.5 bg-white text-navy-800"
              required
            >
              <option value="">-- Choose Slot --</option>
              {mySlots.map((s) => (
                <option key={s._id || s.id} value={s._id || s.id}>
                  {s.dayOfWeek?.toUpperCase()} Period {s.periodNumber} ({s.startTime}-{s.endTime}) - {s.subject?.name || 'Class'}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy-700 mb-1">Coverage Date</label>
              <input
                type="date"
                value={subForm.date}
                onChange={(e) => setSubForm({ ...subForm, date: e.target.value })}
                className="w-full border border-navy-200 rounded-lg px-2.5 py-1.5 bg-white text-navy-800"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-navy-700 mb-1">Substitute Faculty Member</label>
              <select
                value={subForm.substituteFacultyId}
                onChange={(e) => setSubForm({ ...subForm, substituteFacultyId: e.target.value })}
                className="w-full border border-navy-200 rounded-lg px-2.5 py-1.5 bg-white text-navy-800"
                required
              >
                <option value="">-- Choose Colleague --</option>
                {facultyList.filter((f) => (f._id || f.id) !== (myProfile?._id || myProfile?.id)).map((f) => (
                  <option key={f._id || f.id} value={f._id || f.id}>
                    {f.name || f.user?.name} ({f.department?.name || 'Dept'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-navy-700 mb-1">Reason for Substitution</label>
            <Input
              value={subForm.reason}
              onChange={(e) => setSubForm({ ...subForm, reason: e.target.value })}
              placeholder="e.g. University valuation duty / Medical leave"
              required
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsSubModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>

              {/* TAB 7: Academic Risk Intelligence & Pass Probability */}
        {facultyActiveTab === 'insights' && (
          <div className="space-y-6">
            <Card
              title="Academic Risk Intelligence & Pass Probability"
              subtitle="Explainable statistical heuristics evaluating attendance, internal marks, and backlog counts"
              headerAction={
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={loadAcademicInsights}
                  isLoading={isInsightsLoading}
                  icon={RefreshCw}
                >
                  Refresh Analytics
                </Button>
              }
            >
              {isInsightsLoading && !academicInsights ? (
                <div className="py-10 text-center text-xs text-navy-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-teal-600" />
                  Computing academic risk matrices...
                </div>
              ) : (
                <div className="space-y-6">
                  {/* KPI Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                    <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200/60">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 block">Average Pass Probability</span>
                      <span className="text-xl font-bold text-teal-900 mt-1 block font-mono">
                        {academicInsights?.averagePassProbability ?? '88'}%
                      </span>
                      <p className="text-[10px] text-teal-700 mt-0.5">Statistical department baseline</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/60">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">Low Risk Cohort</span>
                      <span className="text-xl font-bold text-emerald-900 mt-1 block font-mono">
                        {academicInsights?.lowRiskCount ?? '0'}
                      </span>
                      <p className="text-[10px] text-emerald-700 mt-0.5">Safe academic standing</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/60">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block">Moderate Watch</span>
                      <span className="text-xl font-bold text-amber-900 mt-1 block font-mono">
                        {academicInsights?.moderateRiskCount ?? '0'}
                      </span>
                      <p className="text-[10px] text-amber-700 mt-0.5">Marginal attendance/marks</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200/60">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 block">High Risk Interventions</span>
                      <span className="text-xl font-bold text-rose-900 mt-1 block font-mono">
                        {academicInsights?.highRiskCount ?? '0'}
                      </span>
                      <p className="text-[10px] text-rose-700 mt-0.5">Requires remediation</p>
                    </div>
                  </div>

                  {/* Student Risk Registry */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      Intervention Roster & Explainable Risk Factors
                    </h4>

                    {(!academicInsights?.atRiskStudents || academicInsights.atRiskStudents.length === 0) ? (
                      <div className="p-6 text-center text-xs text-navy-400 bg-warm-50 rounded-xl border border-navy-100">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                        No critical academic risks detected for current enrolled cohorts.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {academicInsights.atRiskStudents.map((st, idx) => (
                          <div
                            key={st.studentId || idx}
                            className="p-3.5 rounded-xl bg-white border border-navy-100 shadow-subtle flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-navy-900">{st.name || 'Student'}</span>
                                <Badge variant={st.riskLevel === 'HIGH' ? 'danger' : 'amber'} size="xs">
                                  {st.riskLevel} RISK ({st.riskScore}%)
                                </Badge>
                              </div>
                              <span className="text-[11px] text-navy-500 font-mono block mt-0.5">
                                Roll No: {st.rollNumber || 'N/A'} &bull; Attendance: {st.attendancePct}% &bull; Internal: {st.internalPct}% &bull; Backlogs: {st.backlogCount ?? 0}
                              </span>
                              {st.factors && st.factors.length > 0 && (
                                <ul className="mt-1.5 list-disc pl-4 text-[11px] text-rose-700 space-y-0.5">
                                  {st.factors.map((f, i) => (
                                    <li key={i}>{f}</li>
                                  ))}
                                </ul>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <Link
                                to={`/attendance?q=${st.rollNumber || ''}`}
                                className="px-2.5 py-1 text-[11px] font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors border border-teal-200"
                              >
                                View Attendance
                              </Link>
                              <Link
                                to={`/results?q=${st.rollNumber || ''}`}
                                className="px-2.5 py-1 text-[11px] font-semibold text-navy-700 bg-warm-100 hover:bg-navy-100 rounded-lg transition-colors border border-navy-200"
                              >
                                View Marks
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}


        {/* Mark Attendance Modal */}
        <Modal
          isOpen={isMarkAttendanceOpen}
          onClose={() => setIsMarkAttendanceOpen(false)}
          title="Submit Student Attendance Session"
          subtitle="Records period attendance compliance directly to MongoDB"
          maxWidth="max-w-md"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setIsMarkAttendanceOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button variant="teal" size="sm" onClick={handleMarkAttendanceSubmit} isLoading={isSubmitting}>
                Submit Attendance
              </Button>
            </>
          }
        >
          <form onSubmit={handleMarkAttendanceSubmit} className="space-y-4">
            {formError && <Notification type="error" message={formError} onClose={() => setFormError('')} />}

            <Select
              label="Curriculum Subject"
              id="att-subject"
              required
              value={attendanceForm.subject}
              onChange={(e) => setAttendanceForm({ ...attendanceForm, subject: e.target.value })}
              options={mySubjects.map((s) => ({ value: s._id || s.id, label: `${s.name} (${s.code})` }))}
            />

            <Select
              label="Student"
              id="att-student"
              required
              value={attendanceForm.studentId}
              onChange={(e) => setAttendanceForm({ ...attendanceForm, studentId: e.target.value })}
              options={myStudents.map((st) => ({
                value: st._id || st.id,
                label: `${st.rollNumber} - ${st.user?.name || 'Student'}`
              }))}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Session Date"
                id="att-date"
                type="date"
                required
                value={attendanceForm.date}
                onChange={(e) => setAttendanceForm({ ...attendanceForm, date: e.target.value })}
              />
              <Select
                label="Period Slot"
                id="att-period"
                value={attendanceForm.periodNumber}
                onChange={(e) => setAttendanceForm({ ...attendanceForm, periodNumber: e.target.value })}
                options={[
                  { value: '1', label: 'Period 1 (09:00 - 10:00)' },
                  { value: '2', label: 'Period 2 (10:00 - 11:00)' },
                  { value: '3', label: 'Period 3 (11:15 - 12:15)' },
                  { value: '4', label: 'Period 4 (12:15 - 01:15)' }
                ]}
              />
            </div>

            <Select
              label="Attendance Status"
              id="att-status"
              value={attendanceForm.status}
              onChange={(e) => setAttendanceForm({ ...attendanceForm, status: e.target.value })}
              options={[
                { value: 'present', label: 'Present' },
                { value: 'absent', label: 'Absent' },
                { value: 'late', label: 'Late' }
              ]}
            />

            <Input
              label="Session Remarks"
              id="att-remarks"
              value={attendanceForm.remarks}
              onChange={(e) => setAttendanceForm({ ...attendanceForm, remarks: e.target.value })}
              placeholder="e.g. Unit 3 lecture covered"
            />
          </form>
        </Modal>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: SUPER ADMIN / MANAGEMENT FACULTY ROSTER
  // ==========================================
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-navy-900 rounded-2xl p-6 text-white shadow-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-2 border border-teal-500/30">
            <CalendarCheck className="w-3.5 h-3.5 mr-1" />
            <span>Faculty Workplace & Academic Staff Management</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Teaching Faculty Administration</h1>
          <p className="mt-1 text-xs sm:text-sm text-navy-200 font-light">
            Authorized oversight of academic staff profiles, department designations, timetable slots, and credentials.
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
            Provision Faculty Profile
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

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatWidget
          title="Total Faculty Staff"
          value={`${facultyList.length} Members`}
          subtitle="Registered in College"
          icon={Users}
          color="teal"
        />
        <StatWidget
          title="Departments Staffed"
          value={`${departments.length} Units`}
          subtitle="Engineering Faculties"
          icon={Building2}
          color="navy"
        />
        <StatWidget
          title="Teaching Subjects"
          value={`${subjects.length} Courses`}
          subtitle="Curriculum Progression"
          icon={BookOpen}
          color="emerald"
        />
        <StatWidget
          title="Scheduled Lecture Slots"
          value={`${timetableSlots.length} Slots`}
          subtitle="Weekly Master Timetable"
          icon={Clock}
          color="amber"
        />
      </div>

      {/* 1. Faculty Directory Table */}
      <Card
        title="Institutional Faculty Directory"
        subtitle="Manage designations, specializations, qualifications, and account access"
        headerAction={
          <Button
            variant="teal"
            size="xs"
            onClick={handleOpenCreate}
            icon={UserPlus}
          >
            New Faculty
          </Button>
        }
      >
        {/* Filters */}
        <div className="mb-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            id="search-faculty"
            placeholder="Search by ID, name, email or field..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={Search}
          />

          <Select
            id="filter-dept"
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            options={[
              { value: '', label: 'All Academic Departments' },
              ...departments.map((d) => ({ value: d._id, label: d.name }))
            ]}
          />

          <Select
            id="filter-desig"
            value={selectedDesigFilter}
            onChange={(e) => setSelectedDesigFilter(e.target.value)}
            options={[
              { value: '', label: 'All Designations' },
              { value: 'Professor', label: 'Professor' },
              { value: 'Associate Professor', label: 'Associate Professor' },
              { value: 'Assistant Professor', label: 'Assistant Professor' },
              { value: 'Lecturer', label: 'Lecturer' },
              { value: 'Lab Assistant', label: 'Lab Assistant' }
            ]}
          />
        </div>

        <Table
          columns={facultyColumns}
          data={filteredFaculty}
          keyField="_id"
          isLoading={isLoading}
          emptyMessage="No faculty profiles match the search parameters."
        />
      </Card>

      {/* 2. Course & Timetable Schedules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="Curriculum Subjects Allocated to Faculty"
          subtitle="Department lecture courses & lab credits"
        >
          {subjects.length === 0 ? (
            <p className="text-xs text-navy-400 py-6 text-center">No subjects recorded.</p>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {subjects.map((sub) => (
                <div key={sub._id} className="p-3 rounded-xl bg-warm-50 border border-navy-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-navy-900 block">{sub.name}</span>
                    <span className="text-[11px] text-navy-500 font-mono">
                      {sub.code} &bull; Semester {sub.semester}
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
          title="Class Timetable & Scheduled Sessions"
          subtitle="Allocated lecture periods across departments"
        >
          {timetableSlots.length === 0 ? (
            <p className="text-xs text-navy-400 py-6 text-center">No timetable slots scheduled.</p>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {timetableSlots.map((slot) => (
                <div key={slot._id} className="p-3 rounded-xl bg-white border border-navy-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-navy-900 block">
                      {slot.subject?.name || 'Class Period'}
                    </span>
                    <span className="text-[11px] text-navy-500 font-mono">
                      {slot.dayOfWeek} &bull; Period {slot.periodNumber} &bull; Venue: {slot.roomNumber || 'Room 302'}
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

      {/* Modal 1: Edit Faculty Profile */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit Faculty Profile: ${selectedFaculty?.employeeId || ''}`}
        subtitle={`Update academic designation and department for ${selectedFaculty?.user?.name || 'Staff'}`}
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsEditOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleEditSubmit} isLoading={isSubmitting}>
              Save Profile
            </Button>
          </>
        }
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {formError && <Notification type="error" message={formError} onClose={() => setFormError('')} />}

          <Select
            label="Academic Designation"
            id="edit-desig"
            value={editForm.designation}
            onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
            options={[
              { value: 'Professor', label: 'Professor' },
              { value: 'Associate Professor', label: 'Associate Professor' },
              { value: 'Assistant Professor', label: 'Assistant Professor' },
              { value: 'Lecturer', label: 'Lecturer' },
              { value: 'Lab Assistant', label: 'Lab Assistant' }
            ]}
          />

          <Select
            label="Department"
            id="edit-dept"
            value={editForm.department}
            onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
            options={departments.map((d) => ({ value: d._id, label: d.name }))}
          />

          <Input
            label="Qualification / Degrees"
            id="edit-qual"
            value={editForm.qualification}
            onChange={(e) => setEditForm({ ...editForm, qualification: e.target.value })}
            placeholder="e.g. Ph.D. in Computer Science"
          />

          <Input
            label="Specialization / Area of Research"
            id="edit-spec"
            value={editForm.specialization}
            onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })}
            placeholder="e.g. Distributed Systems & Algorithms"
          />
        </form>
      </Modal>

      {/* Modal 2: Provision Faculty Profile */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Provision Faculty Member"
        subtitle="Creates an institutional account and linked faculty profile record"
        maxWidth="max-w-lg"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsCreateOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="teal" size="sm" onClick={handleCreateSubmit} isLoading={isSubmitting}>
              Create Faculty Member
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && <Notification type="error" message={formError} onClose={() => setFormError('')} />}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Full Name"
              id="fac-name"
              required
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              placeholder="e.g. Dr. Alan Turing"
            />

            <Input
              label="Employee ID"
              id="fac-empid"
              required
              value={createForm.employeeId}
              onChange={(e) => setCreateForm({ ...createForm, employeeId: e.target.value })}
              placeholder="e.g. FAC-CSE-009"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Institutional Email"
              id="fac-email"
              type="email"
              required
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              placeholder="e.g. faculty02@college.edu"
            />

            <Input
              label="Initial Password"
              id="fac-pass"
              type="password"
              required
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              placeholder="At least 6 characters"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Department"
              id="fac-dept"
              value={createForm.departmentId}
              onChange={(e) => setCreateForm({ ...createForm, departmentId: e.target.value })}
              options={departments.map((d) => ({ value: d._id, label: d.name }))}
            />

            <Select
              label="Designation"
              id="fac-desig"
              value={createForm.designation}
              onChange={(e) => setCreateForm({ ...createForm, designation: e.target.value })}
              options={[
                { value: 'Professor', label: 'Professor' },
                { value: 'Associate Professor', label: 'Associate Professor' },
                { value: 'Assistant Professor', label: 'Assistant Professor' },
                { value: 'Lecturer', label: 'Lecturer' }
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Qualification"
              id="fac-qual"
              value={createForm.qualification}
              onChange={(e) => setCreateForm({ ...createForm, qualification: e.target.value })}
              placeholder="e.g. Ph.D. in Computer Science"
            />

            <Input
              label="Specialization"
              id="fac-spec"
              value={createForm.specialization}
              onChange={(e) => setCreateForm({ ...createForm, specialization: e.target.value })}
              placeholder="e.g. Artificial Intelligence"
            />
          </div>
        </form>
      </Modal>

      {/* Modal 3: Reset Password */}
      <Modal
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        title={`Reset Password for ${selectedFaculty?.user?.name || 'Faculty'}`}
        subtitle={`Set temporary password for ${selectedFaculty?.user?.email || ''}`}
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsResetOpen(false)} disabled={isSubmitting}>
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
            id="reset-fac-pass"
            type="password"
            required
            value={newPasswordVal}
            onChange={(e) => setNewPasswordVal(e.target.value)}
            placeholder="At least 6 characters"
          />
        </form>
      </Modal>

      {/* Confirm Dialog: Disable / Activate */}
      <ConfirmDialog
        isOpen={!!confirmToggleUser}
        onClose={() => setConfirmToggleUser(null)}
        onConfirm={handleConfirmToggle}
        title={confirmToggleUser?.user?.status === USER_STATUS.ACTIVE ? 'Disable Faculty Account?' : 'Activate Faculty Account?'}
        message={
          confirmToggleUser?.user?.status === USER_STATUS.ACTIVE
            ? `Disabling account '${confirmToggleUser?.user?.email}' will prevent them from logging attendance or marks.`
            : `Activating account '${confirmToggleUser?.user?.email}' will restore access.`
        }
        confirmText={confirmToggleUser?.user?.status === USER_STATUS.ACTIVE ? 'Disable Account' : 'Activate Account'}
        isDanger={confirmToggleUser?.user?.status === USER_STATUS.ACTIVE}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default FacultyDashboard;