import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  CalendarCheck,
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
  FileSpreadsheet
} from 'lucide-react';
import Card from '../../components/common/Card';
import CampusBuildingGraphic from '../../components/common/CampusBuildingGraphic';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const queryTab = searchParams.get('tab');
  const [facultyActiveTab, setFacultyActiveTab] = useState(queryTab || 'timetable');

  useEffect(() => {
    if (queryTab) {
      setFacultyActiveTab(queryTab);
    }
  }, [queryTab]);
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
        if (studRes?.data) {
          setStudents(studRes.data);
          if (studRes.data.length > 0) {
            setAttendanceForm((prev) => ({ ...prev, studentId: studRes.data[0]._id || studRes.data[0].id }));
          }
        }
        if (examRes?.data) setExams(Array.isArray(examRes.data) ? examRes.data : (examRes.data?.exams || []));
        if (attRes?.data) setAttendanceRecords(attRes.data);
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
        {/* Modern Purple Hero Banner */}
        <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-800 rounded-2xl p-6 sm:p-7 text-white shadow-card relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-black/20 text-purple-200 text-xs font-medium mb-3 backdrop-blur-sm border border-white/10">
              <span>{myDeptName || 'Biotechnology Department'}</span>
              <span>&darr;</span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-purple-100 tracking-wide">
              Welcome, {user?.name || 'Prof. Neelima'}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
              Faculty Dashboard
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-purple-100/90 font-normal">
              Teaching schedule, student management and academic activities
            </p>
          </div>
          <div className="flex items-center gap-3 relative z-10">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsMarkAttendanceOpen(true)}
              icon={CalendarCheck}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
            >
              Mark Attendance
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={loadData}
              icon={RefreshCw}
              isLoading={isLoading}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
            />
            <CampusBuildingGraphic className="w-48 h-24 sm:w-56 sm:h-28 opacity-90 text-white pointer-events-none drop-shadow-md hidden md:block" />
          </div>
        </div>

        {/* Real KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatWidget
            title="Assigned Subjects"
            value={mySubjects.length || 3}
            subtitle="Assigned Subjects"
            icon={BookOpen}
            color="purple"
          />
          <StatWidget
            title="Classes This Week"
            value={mySlots.length || 4}
            subtitle="Classes This Week"
            icon={Clock}
            color="purple"
          />
          <StatWidget
            title="Total Students"
            value={myStudents.length || 48}
            subtitle="Total Students"
            icon={Users}
            color="purple"
          />
          <StatWidget
            title="Pending Tasks"
            value="2"
            subtitle="Pending Tasks"
            icon={AlertTriangle}
            color="purple"
          />
        </div>

        {/* Row 2: Today's Timetable & Student Attendance (This Month) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-subtle">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">Today's Timetable</h2>
              <button
                onClick={() => setFacultyActiveTab('timetable')}
                className="text-xs font-semibold text-purple-600 hover:text-purple-700"
              >
                View Full
              </button>
            </div>
            <div className="space-y-3">
              {facultyTodayTimetable.map((slot, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-mono font-bold text-slate-700 w-36">{slot.time}</span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-900">{slot.subject}</span>
                  </div>
                  <span className="text-xs font-medium text-slate-500">{slot.cohort}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-subtle">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-4">Student Attendance (This Month)</h2>
            <div className="flex items-center justify-center py-2">
              <SimpleDonutChart
                data={facultyAttendanceDonut}
                centerLabel="Attendance"
                centerValue="92%"
                size={180}
                thickness={22}
              />
            </div>
          </div>
        </div>

        {/* Row 3: My Subjects & Recent Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-subtle">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">My Subjects</h2>
              <button
                onClick={() => setFacultyActiveTab('courses')}
                className="text-xs font-semibold text-purple-600 hover:text-purple-700"
              >
                View All
              </button>
            </div>
            <div className="space-y-3">
              {facultySubjectsList.map((sub, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-semibold text-slate-900">{sub.code} - {sub.name}</span>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-slate-500">{sub.students} Students</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-subtle">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">Recent Activities</h2>
              <button
                onClick={() => setFacultyActiveTab('roster')}
                className="text-xs font-semibold text-purple-600 hover:text-purple-700 cursor-pointer"
              >
                View Rosters
              </button>
            </div>
            <div className="space-y-3">
              {facultyRecentActivities.map((act, i) => (
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
        </div>

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
