import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Users,
  GraduationCap,
  TrendingUp,
  Award,
  BookOpen,
  CalendarCheck,
  CheckCircle,
  XCircle,
  Clock,
  Bell,
  RefreshCw,
  Send,
  FileText,
  ExternalLink,
  FileSpreadsheet,
  Layers,
  ArrowRight
} from 'lucide-react';
import Card from '../../components/common/Card';
import CampusBuildingGraphic from '../../components/common/CampusBuildingGraphic';
import SimpleLineChart from '../../components/common/SimpleLineChart';
import SimpleBarChart from '../../components/common/SimpleBarChart';
import StatWidget from '../../components/common/StatWidget';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';
import Notification from '../../components/common/Notification';
import api from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import StudentAtRiskAlerts from '../../components/principal/StudentAtRiskAlerts';
import FacultyLeaveManagement from '../../components/principal/FacultyLeaveManagement';
import ExecutiveReportsExport from '../../components/principal/ExecutiveReportsExport';

export const PrincipalDashboard = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [deptSummaries, setDeptSummaries] = useState([]);
  const [academicSummary, setAcademicSummary] = useState(null);
  const [attendanceHealth, setAttendanceHealth] = useState(null);
  const [notices, setNotices] = useState([]);
  const [examReports, setExamReports] = useState([]);
  const [resultsSummary, setResultsSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReviewApproval, setSelectedReviewApproval] = useState(null);
  const [enrollmentPeriod, setEnrollmentPeriod] = useState('This Year');

  // Approval Workflow State
  const [approvals, setApprovals] = useState([
    {
      id: 'APP-2025-01',
      title: 'B.Tech CSE Semester 3 Syllabus Revision Proposal',
      department: 'Computer Science & Engineering',
      submittedBy: 'Prof. David Kumar (HOD)',
      submittedDate: '2025-10-18',
      type: 'Curriculum Revision',
      status: 'pending',
      description: 'Addition of Cloud-Native microservices unit in CS302 Database Management Systems.'
    },
    {
      id: 'APP-2025-02',
      title: 'Mid-Term Examination Hall Allotment Schedule',
      department: 'Academic Council',
      submittedBy: 'Exam Cell Committee',
      submittedDate: '2025-10-22',
      type: 'Exam Scheduling',
      status: 'pending',
      description: 'Master classroom & laboratory allotment for Odd Semester Mid-Term evaluations.'
    },
    {
      id: 'APP-2025-03',
      title: 'Laboratory Modernization Grant Request (ECE Dept)',
      department: 'Electronics & Communication Engineering',
      submittedBy: 'Prof. Sarah Jenkins (HOD)',
      submittedDate: '2025-10-24',
      type: 'Resource Allocation',
      status: 'pending',
      description: 'Procurement of 15 Digital Storage Oscilloscopes for Signals & Systems lab.'
    }
  ]);

  const [decisionHistory, setDecisionHistory] = useState([
    {
      id: 'DEC-2025-99',
      title: 'Annual Academic Calendar 2025-26 Ratification',
      decision: 'Approved',
      date: '2025-08-15',
      decisionBy: user?.name || 'Dr. Eleanor Vance',
      remarks: 'Ratified by Academic Council.'
    }
  ]);

  // Notice Creation Modal
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    content: '',
    targetRoles: '*',
    priority: 'normal',
    isPinned: false
  });
  const [isSubmittingNotice, setIsSubmittingNotice] = useState(false);
  const [noticeError, setNoticeError] = useState('');

  // Academic Calendar Milestones
  const academicCalendar = [
    { event: 'Commencement of Odd Semester Instruction', date: 'August 18, 2025', status: 'Completed' },
    { event: 'Mid-Term Examination Series 1', date: 'October 27 - 31, 2025', status: 'Ongoing' },
    { event: 'Mid-Term Examination Series 2', date: 'November 24 - 28, 2025', status: 'Upcoming' },
    { event: 'Practical Laboratory Final Exams', date: 'December 08 - 15, 2025', status: 'Scheduled' },
    { event: 'Semester-End University Written Exams', date: 'January 05 - 20, 2026', status: 'Scheduled' },
    { event: 'Odd Semester Grade Publication', date: 'February 10, 2026', status: 'Scheduled' }
  ];

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [deptRes, summaryRes, attRes, noticesRes, examRes, resultRes] = await Promise.all([
        api.getDepartmentSummaries().catch(() => ({ data: [] })),
        api.getAcademicSummary().catch(() => ({ data: null })),
        api.getAttendanceOverview().catch(() => ({ data: null })),
        api.getNotices().catch(() => ({ data: [] })),
        api.getExaminationsReport().catch(() => ({ data: [] })),
        api.getResultsSummaryReport().catch(() => ({ data: null }))
      ]);

      if (deptRes?.data) setDeptSummaries(deptRes.data);
      if (summaryRes?.data) setAcademicSummary(summaryRes.data);
      if (attRes?.data) setAttendanceHealth(attRes.data);
      if (noticesRes?.data) setNotices(noticesRes.data);
      if (examRes?.data) setExamReports(Array.isArray(examRes.data) ? examRes.data : (examRes.data?.exams || []));
      if (resultRes?.data) setResultsSummary(resultRes.data);
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Error loading executive dashboard',
        message: err.message
      });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handle Approval Action
  const handleApprovalAction = (approvalId, decision) => {
    const item = approvals.find((a) => a.id === approvalId);
    if (!item) return;

    setApprovals((prev) => prev.filter((a) => a.id !== approvalId));
    setDecisionHistory((prev) => [
      {
        id: `DEC-${Date.now().toString().slice(-4)}`,
        title: item.title,
        decision,
        date: new Date().toISOString().split('T')[0],
        decisionBy: user?.name || 'Principal',
        remarks: `${decision} by Principal & Academic Council on ${new Date().toLocaleDateString()}`
      },
      ...prev
    ]);

    addToast({
      type: decision === 'Approved' ? 'success' : 'info',
      title: `Action Recorded: ${decision}`,
      message: `Proposal "${item.title}" marked as ${decision}.`
    });
  };

  // Handle Notice Publication
  const handlePublishNotice = async (e) => {
    e.preventDefault();
    setNoticeError('');
    if (!noticeForm.title.trim() || !noticeForm.content.trim()) {
      setNoticeError('Notice title and body content are required.');
      return;
    }

    setIsSubmittingNotice(true);
    try {
      await api.createNotice({
        ...noticeForm,
        targetRoles: noticeForm.targetRoles === '*' ? ['*'] : [noticeForm.targetRoles]
      });

      addToast({
        type: 'success',
        title: 'Notice Published',
        message: 'Institutional circular has been broadcast to the college community.'
      });
      setIsNoticeModalOpen(false);
      setNoticeForm({ title: '', content: '', targetRoles: '*', priority: 'normal', isPinned: false });
      loadDashboardData();
    } catch (err) {
      setNoticeError(err.message || 'Failed to publish notice.');
    } finally {
      setIsSubmittingNotice(false);
    }
  };

  // Department Table Columns
  const deptColumns = [
    {
      header: 'Department',
      cell: (row) => (
        <div>
          <span className="font-semibold text-navy-950 text-sm block">{row.name}</span>
          <span className="text-xs text-navy-500 font-mono">Code: {row.code}</span>
        </div>
      )
    },
    {
      header: 'Head of Department (HOD)',
      cell: (row) => (
        row.hod ? (
          <div>
            <span className="text-xs font-semibold text-navy-900 block">{row.hod.name}</span>
            <span className="text-[11px] text-navy-500 font-mono">{row.hod.email}</span>
          </div>
        ) : (
          <Badge variant="warning" size="xs">Unassigned</Badge>
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
      header: 'Faculty Strength',
      cell: (row) => (
        <span className="text-xs text-navy-700">
          {row.facultyCount} Members
        </span>
      )
    },
    {
      header: 'Capacity Utilization',
      cell: (row) => {
        const util = row.utilizationPercentage || 0;
        return (
          <div className="w-32">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="font-bold text-navy-900">{util}%</span>
              <span className="text-navy-400">Intake</span>
            </div>
            <div className="w-full bg-navy-100 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  util >= 80 ? 'bg-teal-600' : util >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(util, 100)}%` }}
              />
            </div>
          </div>
        );
      }
    }
  ];

  // Chart data matching reference image
  const enrollmentTrend = {
    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    series: [
      { name: 'New Admissions', color: '#06b6d4', data: [42, 38, 48, 52, 45, 58] },
      { name: 'Total Students', color: '#3b82f6', data: [820, 835, 850, 890, 940, 1000] }
    ]
  };

  const deptStrengthBars = [
    { label: 'CSE', values: [280, 32] },
    { label: 'ECE', values: [210, 26] },
    { label: 'ME', values: [180, 22] },
    { label: 'CE', values: [150, 18] },
    { label: 'AI&DS', values: [180, 22] }
  ];

  const pendingApprovalsList = approvals.length > 0
    ? approvals.slice(0, 4)
    : [
        { id: '1', title: 'Academic Calendar 2026-27', time: '2 days ago', status: 'Pending', variant: 'amber' },
        { id: '2', title: 'Curriculum Revision - CSE', time: '3 days ago', status: 'Pending', variant: 'amber' },
        { id: '3', title: 'New Faculty Appointment', time: '5 days ago', status: 'Review', variant: 'blue' },
        { id: '4', title: 'Examination Schedule', time: '1 week ago', status: 'Review', variant: 'blue' }
      ];

  const importantNoticesList = notices.length > 0
    ? notices.slice(0, 4)
    : [
        { id: '1', title: 'Semester Examinations Schedule', date: 'Published on 25 Oct 2026' },
        { id: '2', title: 'Faculty Development Program', date: 'Published on 22 Oct 2026' },
        { id: '3', title: 'IQAC Meeting', date: 'Published on 20 Oct 2026' },
        { id: '4', title: 'Annual Sports Event', date: 'Published on 18 Oct 2026' }
      ];

  return (
    <div className="space-y-6">
      {/* Elegant Green Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 rounded-2xl p-6 sm:p-7 text-white shadow-card relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative z-10 max-w-xl">
          <p className="text-xs sm:text-sm font-medium text-emerald-100 tracking-wide">
            Welcome, {user?.name || 'Dr. Priya Reddy'}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
            Principal Dashboard
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-emerald-100/90 font-normal">
            Institutional performance, academic insights and executive decisions
          </p>
        </div>
        <div className="flex items-center gap-4 relative z-10">
          <CampusBuildingGraphic className="w-52 h-28 sm:w-64 sm:h-32 opacity-95 text-white pointer-events-none drop-shadow-md" />
        </div>
      </div>

      {/* Real Statistics from MongoDB */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatWidget
          title="Total Students"
          value={academicSummary?.totalStudents ?? '1,000'}
          subtitle="+3.2%"
          trend={{ value: '+3.2%', positive: true }}
          icon={Users}
          color="blue"
        />
        <StatWidget
          title="Faculty Members"
          value={academicSummary?.totalFaculty ?? '120'}
          subtitle="+2.1%"
          trend={{ value: '+2.1%', positive: true }}
          icon={Users}
          color="emerald"
        />
        <StatWidget
          title="Departments"
          value={academicSummary?.totalDepartments ?? deptSummaries?.length ?? '4'}
          subtitle="Active"
          icon={Building2}
          color="emerald"
        />
        <StatWidget
          title="Attendance Rate"
          value={attendanceHealth ? `${attendanceHealth.collegeAveragePercentage || 85}%` : '85%'}
          subtitle="+3.4%"
          trend={{ value: '+3.4%', positive: true }}
          icon={CalendarCheck}
          color="blue"
        />
      </div>

      {/* Charts Row: Enrollment Trend & Department Strength */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm sm:text-base font-bold text-slate-900">Student Enrollment Trend</h2>
            <div className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium cursor-pointer">
              This Year &darr;
            </div>
          </div>
          <SimpleLineChart
            categories={enrollmentTrend.categories}
            series={enrollmentTrend.series}
            height={190}
          />
        </div>

        <div className="lg:col-span-6 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm sm:text-base font-bold text-slate-900">Department Strength</h2>
            <div className="flex items-center space-x-3 text-xs text-slate-600">
              <span className="inline-flex items-center"><span className="w-2.5 h-2.5 rounded-sm bg-cyan-500 mr-1.5" /> Students</span>
              <span className="inline-flex items-center"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 mr-1.5" /> Faculty</span>
            </div>
          </div>
          <SimpleBarChart
            data={deptStrengthBars}
            height={190}
            barColors={['#06b6d4', '#10b981']}
          />
        </div>
      </div>

      {/* Row 3: Pending Approvals & Important Notices */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm sm:text-base font-bold text-slate-900">Pending Approvals</h2>
            <button
              onClick={() => {
                const el = document.getElementById('council-approvals-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {pendingApprovalsList.map((app, i) => (
              <div
                key={app.id || i}
                onClick={() => setSelectedReviewApproval(app)}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
                title="Click to review and decide"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">
                    <FileText className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-slate-800 group-hover:text-emerald-800 transition-colors">{app.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{app.submittedDate ? `${app.submittedDate} • ${app.department || ''}` : (app.time || 'Pending review')}</p>
                  </div>
                </div>
                <Badge variant={app.variant || (app.status === 'pending' ? 'amber' : 'blue')} size="xs">
                  {app.status ? (app.status === 'pending' ? 'Pending' : 'Review') : 'Pending'}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-6 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm sm:text-base font-bold text-slate-900">Important Notices</h2>
            <Link to="/notices" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {importantNoticesList.map((not, i) => (
              <div key={not.id || i} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-slate-800">{not.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{not.createdAt ? `Published on ${new Date(not.createdAt).toLocaleDateString()}` : not.date}</p>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">Official</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 1. Department-Wise Summaries */}
      <Card
        title="Department-Wise Enrollment & Faculty Distribution"
        subtitle="Live metrics computed directly from enrolled student profiles and department allocations in MongoDB"
      >
        <Table
          columns={deptColumns}
          data={deptSummaries}
          keyField="id"
          isLoading={isLoading}
          emptyMessage="No departments found."
        />
      </Card>

      {/* Feature 1: Student At-Risk Identification & Attendance Alerts */}
      <StudentAtRiskAlerts departments={deptSummaries} />

      {/* 2. Institutional Examinations & Academic Results Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="Institutional Examination Status & Schedules"
          subtitle="Real-time examination cycle tracking from Exam Cell"
          headerAction={
            <Link to="/examinations" className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center">
              View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          }
        >
          {examReports.length === 0 ? (
            <p className="text-xs text-navy-400 py-6 text-center">No examination schedules currently registered in the database.</p>
          ) : (
            <div className="space-y-2.5">
              {examReports.slice(0, 4).map((ex) => (
                <div key={ex.id} className="p-3.5 rounded-xl bg-warm-50 border border-navy-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-navy-950 block">{ex.name}</span>
                    <span className="text-[11px] text-navy-500 font-mono">
                      {ex.examType?.toUpperCase()} &bull; Sem {ex.semester} ({ex.academicYear})
                    </span>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={ex.timelineStatus === 'Completed' ? 'success' : ex.timelineStatus === 'In Progress' ? 'amber' : 'navy'}
                      size="xs"
                    >
                      {ex.timelineStatus}
                    </Badge>
                    <span className="text-[10px] text-navy-500 block mt-1">
                      {ex.isPublished ? 'Results Published' : 'Under Tabulation'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card
          title="Published Results & Academic Pass Performance"
          subtitle="Governing exam pass percentage across verified published results"
          headerAction={
            <Link to="/results" className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center">
              Grade Cell <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          }
        >
          {resultsSummary ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-teal-50 border border-teal-100">
                  <span className="text-[10px] uppercase font-bold text-teal-600 block">Total Graded</span>
                  <span className="text-lg font-bold text-teal-950 mt-0.5 block">{resultsSummary.totalGraded || 0}</span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <span className="text-[10px] uppercase font-bold text-emerald-600 block">Pass Rate</span>
                  <span className="text-lg font-bold text-emerald-700 mt-0.5 block">{resultsSummary.passPercentage || '0'}%</span>
                </div>
                <div className="p-3 rounded-xl bg-warm-50 border border-navy-100">
                  <span className="text-[10px] uppercase font-bold text-navy-500 block">Passed / Failed</span>
                  <span className="text-xs font-mono font-bold text-navy-900 mt-1 block">
                    {resultsSummary.passedCount || 0} / {resultsSummary.failedCount || 0}
                  </span>
                </div>
              </div>

              {resultsSummary.gradeDistribution && (
                <div>
                  <span className="text-[11px] font-semibold text-navy-500 uppercase tracking-wider block mb-2">
                    Grade Distribution
                  </span>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 text-center text-xs">
                    {Object.entries(resultsSummary.gradeDistribution).map(([grd, count]) => (
                      <div key={grd} className="p-2 rounded-lg bg-warm-50 border border-navy-100">
                        <span className="font-bold text-navy-900 block">{grd}</span>
                        <span className="text-[11px] text-navy-500 font-mono mt-0.5 block">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-navy-400 py-6 text-center">No examination results currently published for academic council review.</p>
          )}
        </Card>
      </div>

      {/* 2. Pending Approvals & Decision History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="Pending Academic Approvals"
          subtitle="Institutional workflow items requiring Principal review & executive approval"
        >
          {approvals.length === 0 ? (
            <div className="py-8 text-center text-navy-500 text-xs font-light">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              All submitted proposals and schedules have been reviewed.
            </div>
          ) : (
            <div className="space-y-3">
              {approvals.map((app) => (
                <div key={app.id} className="p-4 rounded-xl border border-navy-100 bg-warm-50">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-navy-950">{app.title}</h4>
                      <p className="text-[11px] text-navy-500 mt-0.5">
                        {app.department} &bull; Submitted by: {app.submittedBy}
                      </p>
                    </div>
                    <Badge variant="amber" size="xs">{app.type}</Badge>
                  </div>
                  <p className="text-xs text-navy-700 font-light mb-3 leading-relaxed">
                    {app.description}
                  </p>
                  <div className="flex items-center justify-end space-x-2 border-t border-navy-200/60 pt-2.5">
                    <Button
                      variant="danger"
                      size="xs"
                      onClick={() => handleApprovalAction(app.id, 'Rejected')}
                      icon={XCircle}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="teal"
                      size="xs"
                      onClick={() => handleApprovalAction(app.id, 'Approved')}
                      icon={CheckCircle}
                    >
                      Approve Proposal
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card
          title="Executive Decision History"
          subtitle="Log of ratified academic proposals and council resolutions"
        >
          <div className="space-y-3">
            {decisionHistory.map((dec) => (
              <div key={dec.id} className="p-3.5 rounded-xl border border-navy-100 bg-white">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-navy-900">{dec.title}</h4>
                  <Badge variant={dec.decision === 'Approved' ? 'success' : 'danger'} size="xs">
                    {dec.decision}
                  </Badge>
                </div>
                <p className="text-xs text-navy-600 mt-1 font-light">{dec.remarks}</p>
                <div className="mt-2 text-[10px] text-navy-400 font-mono">
                  Resolved on: {dec.date} &bull; Authorized by: {dec.decisionBy}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Feature 2: Faculty Leave Management & Approval Workflow */}
      <FacultyLeaveManagement departments={deptSummaries} />

      {/* 3. Academic Calendar & Institutional Circulars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="Institutional Academic Calendar 2025-26"
          subtitle="Governing timelines for odd and even terms"
        >
          <div className="space-y-2.5">
            {academicCalendar.map((item, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-warm-50 border border-navy-100 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2.5">
                  <Clock className="w-4 h-4 text-teal-600 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-navy-900 block">{item.event}</span>
                    <span className="text-[11px] text-navy-500 font-mono">{item.date}</span>
                  </div>
                </div>
                <Badge
                  variant={item.status === 'Completed' ? 'success' : item.status === 'Ongoing' ? 'amber' : 'neutral'}
                  size="xs"
                >
                  {item.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card
          title="Active Institutional Circulars"
          subtitle="Live notices broadcasted across the campus"
          headerAction={
            <Button
              variant="teal"
              size="xs"
              onClick={() => setIsNoticeModalOpen(true)}
              icon={Send}
            >
              New Circular
            </Button>
          }
        >
          {notices.length === 0 ? (
            <div className="py-8 text-center text-navy-500 text-xs font-light">
              No circulars currently published.
            </div>
          ) : (
            <div className="space-y-3">
              {notices.slice(0, 4).map((notice) => (
                <div key={notice._id} className="p-3 rounded-xl border border-navy-100 bg-white">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-navy-900 flex items-center">
                      {notice.isPinned && <span className="text-amber-500 mr-1.5">&bull; Pinned</span>}
                      {notice.title}
                    </h4>
                    <Badge variant={notice.priority === 'urgent' ? 'danger' : 'teal'} size="xs">
                      {notice.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-navy-600 mt-1 line-clamp-2 font-light">
                    {notice.content}
                  </p>
                  <div className="mt-2 text-[10px] text-navy-400 font-mono flex items-center justify-between">
                    <span>Target: {notice.targetRoles?.join(', ') || 'All Roles'}</span>
                    <span>{new Date(notice.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>


      {/* Feature 3: Multi-Format Executive Reports Export */}
      <ExecutiveReportsExport departments={deptSummaries} />

      {/* Proposal Review & Executive Decision Modal */}
      {selectedReviewApproval && (
        <Modal
          isOpen={!!selectedReviewApproval}
          onClose={() => setSelectedReviewApproval(null)}
          title="Executive Council Proposal Review"
          subtitle="Principal review & administrative ratification"
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <span className="font-bold text-sm text-slate-900 block">{selectedReviewApproval.title}</span>
              <p className="text-slate-600 leading-relaxed">
                {selectedReviewApproval.description || 'Proposal submitted for executive council ratification and administrative approval.'}
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px] text-slate-400 font-mono border-t border-slate-200/50">
                <span>Dept: {selectedReviewApproval.department || 'Academic Council'}</span>
                <span>•</span>
                <span>By: {selectedReviewApproval.submittedBy || 'Committee'}</span>
                <span>•</span>
                <span>Date: {selectedReviewApproval.submittedDate || selectedReviewApproval.time || 'Recent'}</span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedReviewApproval(null)}
              >
                Close
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  handleApprovalAction(selectedReviewApproval.id, 'Rejected');
                  setSelectedReviewApproval(null);
                }}
              >
                Reject Proposal
              </Button>
              <Button
                variant="teal"
                size="sm"
                onClick={() => {
                  handleApprovalAction(selectedReviewApproval.id, 'Approved');
                  setSelectedReviewApproval(null);
                }}
              >
                Approve Proposal
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Publish Notice Modal */}
      <Modal
        isOpen={isNoticeModalOpen}
        onClose={() => setIsNoticeModalOpen(false)}
        title="Broadcast Institutional Circular"
        subtitle="Official announcement published on behalf of Principal & Academic Council"
        maxWidth="max-w-lg"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsNoticeModalOpen(false)} disabled={isSubmittingNotice}>
              Cancel
            </Button>
            <Button variant="teal" size="sm" onClick={handlePublishNotice} isLoading={isSubmittingNotice} icon={Send}>
              Broadcast Notice
            </Button>
          </>
        }
      >
        <form onSubmit={handlePublishNotice} className="space-y-4">
          {noticeError && <Notification type="error" message={noticeError} onClose={() => setNoticeError('')} />}

          <Input
            label="Circular Title"
            id="notice-title"
            required
            value={noticeForm.title}
            onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
            placeholder="e.g. Schedule of Odd Semester Mid-Term Examinations"
          />

          <Textarea
            label="Notice Announcement Body"
            id="notice-content"
            required
            rows={4}
            value={noticeForm.content}
            onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
            placeholder="Write the full circular announcement details here..."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Target Audience"
              id="notice-target"
              value={noticeForm.targetRoles}
              onChange={(e) => setNoticeForm({ ...noticeForm, targetRoles: e.target.value })}
              options={[
                { value: '*', label: 'Entire College (* All)' },
                { value: 'faculty', label: 'Faculty Members Only' },
                { value: 'student', label: 'Students Only' },
                { value: 'hod', label: 'Department Heads (HOD)' },
                { value: 'accounts', label: 'Finance & Accounts' }
              ]}
            />

            <Select
              label="Priority Level"
              id="notice-priority"
              value={noticeForm.priority}
              onChange={(e) => setNoticeForm({ ...noticeForm, priority: e.target.value })}
              options={[
                { value: 'normal', label: 'Standard Notice' },
                { value: 'urgent', label: 'Urgent / Important' }
              ]}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PrincipalDashboard;
