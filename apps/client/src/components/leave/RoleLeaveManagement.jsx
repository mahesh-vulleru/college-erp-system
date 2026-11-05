import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  RefreshCw,
  User,
  Building2,
  Calendar,
  FileText,
  AlertTriangle,
  Check,
  X,
  UserCheck,
  Plus,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Sliders,
  Award,
  ChevronRight,
  UploadCloud,
  FileCheck2,
  Eye,
  Info
} from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import Modal from '../common/Modal';
import Pagination from '../common/Pagination';
import EmptyState from '../common/EmptyState';
import api from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ROLES } from '@college-erp/shared';

export const RoleLeaveManagement = ({ defaultTab = 'auto' }) => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const role = (user?.role || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
  const isStudent = role === ROLES.STUDENT;
  const isFaculty = role === ROLES.FACULTY;
  const isHod = role === ROLES.HOD;
  const isPrincipal = role === ROLES.PRINCIPAL;
  const isLibrarian = role === ROLES.LIBRARIAN;
  const isLibraryStaff = role === ROLES.LIBRARY_STAFF;
  const isAccounts = role === ROLES.ACCOUNTS;
  const isSuperAdmin = role === ROLES.SUPER_ADMIN || role === 'admin';

  // Determine initial active tab based on role
  const initialTab = useMemo(() => {
    if (defaultTab !== 'auto') return defaultTab;
    if (isStudent || isLibraryStaff || isAccounts) return 'my-leaves';
    if (isFaculty || isHod || isLibrarian || isPrincipal) return 'approvals';
    if (isSuperAdmin) return 'all';
    return 'my-leaves';
  }, [defaultTab, isStudent, isFaculty, isHod, isLibrarian, isPrincipal, isLibraryStaff, isAccounts, isSuperAdmin]);

  const [activeTab, setActiveTab] = useState(initialTab);
  const [isLoading, setIsLoading] = useState(true);
  const [leaves, setLeaves] = useState([]);
  const [summary, setSummary] = useState({
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    totalCount: 0
  });

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modals state
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  const [selectedLeave, setSelectedLeave] = useState(null);

  // Apply Form State
  const [applyForm, setApplyForm] = useState({
    leaveType: isStudent ? 'medical' : 'casual',
    startDate: '',
    endDate: '',
    reason: '',
    documentUrl: ''
  });
  const [applyError, setApplyError] = useState('');
  const [isSubmittingApply, setIsSubmittingApply] = useState(false);

  // Review Form State
  const [reviewForm, setReviewForm] = useState({
    decision: 'approved',
    remarks: '',
    rejectionReason: ''
  });
  const [reviewError, setReviewError] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Workflow Config State
  const [workflowConfig, setWorkflowConfig] = useState(null);

  // Phase 3 SLA Escalations State
  const [escalations, setEscalations] = useState(null);

  const loadEscalations = useCallback(async () => {
    if (!isPrincipal && !isHod && !isSuperAdmin) return;
    try {
      const res = await api.getWorkflowEscalations();
      if (res?.data) {
        setEscalations(res.data);
      }
    } catch {
      // Non-blocking
    }
  }, [isPrincipal, isHod, isSuperAdmin]);

  const handleEscalate = async (leaveId) => {
    try {
      await api.escalateWorkflowLeave(leaveId, { reason: 'SLA Delay Escalation' });
      addToast({
        type: 'warning',
        title: 'Workflow SLA Escalated',
        message: 'Leave application escalated to higher-tier institutional authority.'
      });
      loadLeaves();
      loadEscalations();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Escalation Failed',
        message: err.message || 'Failed to escalate leave'
      });
    }
  };

  // Load Leave Data
  const loadLeaves = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: pageSize,
        search: searchQuery.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        leaveType: typeFilter !== 'all' ? typeFilter : undefined
      };

      if (activeTab === 'approvals') {
        params.scope = 'approvals';
      } else if (activeTab === 'my-leaves') {
        params.scope = 'my-leaves';
      }

      const res = await api.getLeaves(params);
      if (res?.data) {
        setLeaves(res.data.leaves || []);
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.totalPages || 1);
          setTotalItems(res.data.pagination.total || 0);
        }
      }
    } catch (err) {
      console.error('Error fetching leaves:', err);
      addToast({
        type: 'error',
        title: 'Error loading leave records',
        message: err.message || 'Failed to retrieve leaves.'
      });
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, currentPage, pageSize, searchQuery, statusFilter, typeFilter, addToast]);

  useEffect(() => {
    loadLeaves();
    loadEscalations();
  }, [loadLeaves, loadEscalations]);

  // Load Workflow Config for Super Admin
  const loadWorkflowConfig = async () => {
    try {
      const res = await api.getLeaveWorkflowConfig();
      if (res?.data) {
        setWorkflowConfig(res.data);
      }
    } catch (err) {
      console.error('Error fetching workflow config:', err);
    }
  };

  // Handle Apply Leave Submission
  const handleApplySubmit = async (e) => {
    e.preventDefault();
    setApplyError('');

    if (!applyForm.startDate || !applyForm.endDate) {
      setApplyError('Please select both start and end dates.');
      return;
    }
    if (new Date(applyForm.startDate) > new Date(applyForm.endDate)) {
      setApplyError('Start date cannot be after end date.');
      return;
    }
    if (!applyForm.reason.trim()) {
      setApplyError('Please provide a specific reason for the leave application.');
      return;
    }

    setIsSubmittingApply(true);
    try {
      await api.applyLeave(applyForm);
      addToast({
        type: 'success',
        title: 'Leave Application Submitted',
        message: 'Your leave application has been routed to the designated approver.'
      });
      setIsApplyModalOpen(false);
      setApplyForm({
        leaveType: isStudent ? 'medical' : 'casual',
        startDate: '',
        endDate: '',
        reason: '',
        documentUrl: ''
      });
      loadLeaves();
    } catch (err) {
      setApplyError(err.message || 'Failed to submit leave application.');
    } finally {
      setIsSubmittingApply(false);
    }
  };

  // Handle Review Leave Submission (Approve / Reject)
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError('');

    if (reviewForm.decision === 'rejected' && !reviewForm.rejectionReason.trim()) {
      setReviewError('A specific rejection reason is mandatory when declining leave.');
      return;
    }

    setIsSubmittingReview(true);
    try {
      await api.reviewLeave(selectedLeave.id || selectedLeave._id, {
        status: reviewForm.decision,
        remarks: reviewForm.remarks.trim(),
        rejectionReason: reviewForm.rejectionReason.trim()
      });

      addToast({
        type: 'success',
        title: `Leave ${reviewForm.decision === 'approved' ? 'Approved' : 'Rejected'}`,
        message: `The leave request has been processed and status updated.`
      });
      setIsReviewModalOpen(false);
      setSelectedLeave(null);
      setReviewForm({ decision: 'approved', remarks: '', rejectionReason: '' });
      loadLeaves();
    } catch (err) {
      setReviewError(err.message || 'Failed to review leave application.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Calculate day difference for preview
  const previewDays = useMemo(() => {
    if (!applyForm.startDate || !applyForm.endDate) return 1;
    const s = new Date(applyForm.startDate);
    const e = new Date(applyForm.endDate);
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || s > e) return 1;
    return Math.ceil(Math.abs(e - s) / (1000 * 3600 * 24)) + 1;
  }, [applyForm.startDate, applyForm.endDate]);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Action Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <CalendarDays className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                {isStudent
                  ? 'Student Leave Portal'
                  : isFaculty
                  ? 'Teacher & Student Leave Desk'
                  : isHod
                  ? 'Department Leave Governance'
                  : isPrincipal
                  ? 'Institutional Leave Oversight'
                  : isLibrarian
                  ? 'Library Staff Leave Management'
                  : isSuperAdmin
                  ? 'Leave Hierarchy & Policy Control'
                  : 'Leave Applications & Requests'}
              </h2>
              <p className="text-xs text-slate-500">
                {isStudent
                  ? 'Apply for casual or medical leaves and track class teacher approval registers.'
                  : isFaculty
                  ? 'Approve leaves for assigned cohort students and apply for faculty academic leave.'
                  : isHod
                  ? 'Approve department faculty leave and monitor escalated student absence registers.'
                  : 'Traceable multi-level workflow with institutional role permissions.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 flex-wrap">
          {isSuperAdmin && (
            <Button
              variant="secondary"
              size="sm"
              icon={Sliders}
              onClick={() => {
                loadWorkflowConfig();
                setIsConfigModalOpen(true);
              }}
            >
              Workflow Config
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => {
              setApplyError('');
              setIsApplyModalOpen(true);
            }}
          >
            Apply for Leave
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={loadLeaves}
            isLoading={isLoading}
            title="Refresh leave data"
          />
        </div>
      </div>

      {/* 2. KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-amber-200/70 bg-gradient-to-br from-amber-50/40 via-white to-white shadow-xs">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-amber-800">Pending Actions</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-950 mt-1">{summary.pendingCount}</p>
          <span className="text-[11px] text-amber-700 font-medium">Awaiting Review</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-emerald-200/70 bg-gradient-to-br from-emerald-50/40 via-white to-white shadow-xs">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-emerald-800">Approved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-950 mt-1">{summary.approvedCount}</p>
          <span className="text-[11px] text-emerald-700 font-medium">Sanctioned Leaves</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-rose-200/70 bg-gradient-to-br from-rose-50/40 via-white to-white shadow-xs">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-rose-800">Rejected</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-950 mt-1">{summary.rejectedCount}</p>
          <span className="text-[11px] text-rose-700 font-medium">Declined with Reason</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-700">Total Recorded</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">{summary.totalCount}</p>
          <span className="text-[11px] text-slate-500 font-medium">In Current Scope</span>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200/80 shadow-xs flex items-center justify-between overflow-x-auto gap-2">
        <div className="flex items-center space-x-1.5 min-w-max">
          {(isFaculty || isHod || isLibrarian || isPrincipal) && (
            <button
              onClick={() => {
                setActiveTab('approvals');
                setCurrentPage(1);
              }}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'approvals'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>
                {isFaculty
                  ? 'Student Requests for Review'
                  : isHod
                  ? 'Department Approvals'
                  : isLibrarian
                  ? 'Staff Leave Approvals'
                  : 'Executive Approvals'}
              </span>
              {summary.pendingCount > 0 && activeTab !== 'approvals' && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-black">
                  {summary.pendingCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => {
              setActiveTab('my-leaves');
              setCurrentPage(1);
            }}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'my-leaves'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>My Leave Applications</span>
          </button>

          {(isPrincipal || isSuperAdmin) && (
            <button
              onClick={() => {
                setActiveTab('all');
                setCurrentPage(1);
              }}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>All Institutional Leaves</span>
            </button>
          )}
        </div>

        {/* Quick Filter Badges */}
        <div className="flex items-center space-x-1.5 text-xs text-slate-500">
          <span className="hidden sm:inline font-medium">Status:</span>
          {['all', 'pending', 'approved', 'rejected'].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg font-semibold uppercase text-[10px] tracking-wider transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* SLA Escalation Warning Banner */}
      {escalations?.pendingEscalations?.length > 0 && activeTab === 'approvals' && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              <strong>Workflow SLA Alert:</strong> {escalations.pendingEscalations.length} pending leave application(s) have exceeded the {escalations.slaThresholdHours || 48}-hour SLA review threshold.
            </span>
          </div>
          <span className="text-[11px] font-bold text-amber-700 bg-amber-100/80 px-2.5 py-0.5 rounded-full border border-amber-300">
            SLA Breach Triggered
          </span>
        </div>
      )}

      {/* 4. Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by student/faculty name, roll number, or reason..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200/90 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="text-xs rounded-xl border border-slate-200/90 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">All Leave Types</option>
          <option value="casual">Casual Leave</option>
          <option value="sick">Sick Leave</option>
          <option value="medical">Medical Leave</option>
          <option value="academic">Academic Duty Leave</option>
          <option value="earned">Earned Leave</option>
          <option value="personal">Personal Leave</option>
        </select>
      </div>

      {/* 5. Main Table & Requests View */}
      <Card noPadding>
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
            Loading leave applications...
          </div>
        ) : leaves.length === 0 ? (
          <div className="p-12 text-center">
            <EmptyState
              icon={CalendarDays}
              title="No Leave Applications Found"
              description="No applications match the current role scope and filters."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 text-[11px] text-slate-500 font-bold uppercase border-b border-slate-100 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Application ID</th>
                  <th className="py-3 px-4">Applicant</th>
                  <th className="py-3 px-4">Department / Class</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Dates & Duration</th>
                  <th className="py-3 px-4">Approval Stage</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaves.map((lv) => {
                  const isPending = lv.status === 'pending';
                  const isApproved = lv.status === 'approved';
                  const isRejected = lv.status === 'rejected';

                  // Check if current user is permitted to review this specific request
                  const canReview = isPending && (
                    (isFaculty && lv.applicantRole === ROLES.STUDENT && lv.currentApproverRole === ROLES.FACULTY) ||
                    (isHod && lv.currentApproverRole === ROLES.HOD) ||
                    (isLibrarian && lv.currentApproverRole === ROLES.LIBRARIAN) ||
                    (isPrincipal && lv.currentApproverRole === ROLES.PRINCIPAL) ||
                    isSuperAdmin
                  );

                  return (
                    <tr key={lv._id || lv.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {lv.applicationId || lv.id}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="min-w-[140px]">
                          <span className="font-bold text-slate-900 block">
                            {lv.applicantName || lv.user?.name || 'Applicant'}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {lv.applicantIdNumber || lv.faculty?.employeeId || lv.student?.rollNumber || lv.user?.email}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="min-w-[120px]">
                          <span className="font-semibold text-slate-800 block">
                            {lv.department?.name || 'Institutional'}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {lv.academicClass || (lv.applicantRole ? lv.applicantRole.toUpperCase() : 'General')}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge variant="navy" size="xs">
                          {lv.leaveType ? lv.leaveType.replace(/_/g, ' ') : 'Casual'}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="min-w-[150px]">
                          <span className="font-semibold text-slate-800 block">
                            {new Date(lv.startDate).toLocaleDateString()} &rarr; {new Date(lv.endDate).toLocaleDateString()}
                          </span>
                          <span className="text-[11px] text-emerald-700 font-bold">
                            {lv.durationDays || lv.numberOfDays || 1} Days
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-semibold text-slate-800 block text-[11px]">
                            {lv.currentApproverRole
                              ? `Stage ${lv.approvalStage || 1}: ${lv.currentApproverRole.toUpperCase()}`
                              : 'Finalized'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {lv.currentApprover?.name || 'Assigned Authority'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <Badge
                            variant={isApproved ? 'success' : isRejected ? 'danger' : 'amber'}
                            size="xs"
                          >
                            {lv.status ? lv.status.toUpperCase() : 'PENDING'}
                          </Badge>
                          {lv.isEscalated && (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                              ESCALATED SLA
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <Button
                            variant="secondary"
                            size="xs"
                            icon={Eye}
                            onClick={() => {
                              setSelectedLeave(lv);
                              setIsDetailModalOpen(true);
                            }}
                            title="View full application & audit trail"
                          >
                            Details
                          </Button>

                          {isPending && !lv.isEscalated && (isPrincipal || isSuperAdmin || isHod) && (
                            <Button
                              variant="danger"
                              size="xs"
                              icon={AlertTriangle}
                              onClick={() => handleEscalate(lv._id || lv.id)}
                              title="Escalate overdue leave SLA to next tier"
                            >
                              Escalate
                            </Button>
                          )}

                          {canReview && (
                            <Button
                              variant="primary"
                              size="xs"
                              icon={Check}
                              onClick={() => {
                                setSelectedLeave(lv);
                                setReviewForm({
                                  decision: 'approved',
                                  remarks: '',
                                  rejectionReason: ''
                                });
                                setReviewError('');
                                setIsReviewModalOpen(true);
                              }}
                            >
                              Review
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Showing page {currentPage} of {totalPages} ({totalItems} total requests)
            </span>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </Card>

      {/* =========================================================================
          MODAL 1: APPLY FOR LEAVE
      ========================================================================= */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title="Submit Leave Application"
        subtitle="Submit a formal leave request for departmental and institutional review."
        maxWidth="max-w-md"
      >
        <form onSubmit={handleApplySubmit} className="space-y-4">
          {applyError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{applyError}</span>
            </div>
          )}

          {/* Applicant Info Summary Box */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Applicant</span>
              <span className="font-bold text-slate-900">{user?.name}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Role</span>
              <span className="font-bold text-slate-900 capitalize">{role.replace(/_/g, ' ')}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Leave Type *</label>
            <select
              value={applyForm.leaveType}
              onChange={(e) => setApplyForm({ ...applyForm, leaveType: e.target.value })}
              className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="casual">Casual Leave</option>
              <option value="sick">Sick Leave</option>
              <option value="medical">Medical Leave (Doctor Certificate)</option>
              <option value="earned">Earned Leave</option>
              <option value="academic">Academic Duty / Conference</option>
              <option value="personal">Personal Obligations</option>
              <option value="other">Other Special Leave</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Start Date *</label>
              <input
                type="date"
                value={applyForm.startDate}
                onChange={(e) => setApplyForm({ ...applyForm, startDate: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">End Date *</label>
              <input
                type="date"
                value={applyForm.endDate}
                onChange={(e) => setApplyForm({ ...applyForm, endDate: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-between text-xs text-emerald-800">
            <span>Duration Calculated:</span>
            <span className="font-extrabold">{previewDays} Days</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Leave *</label>
            <textarea
              rows={3}
              value={applyForm.reason}
              onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })}
              placeholder="State clear academic or personal reason..."
              className="w-full text-xs rounded-xl border border-slate-200 p-3 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Supporting Document / Note (Optional)
            </label>
            <input
              type="text"
              value={applyForm.documentUrl}
              onChange={(e) => setApplyForm({ ...applyForm, documentUrl: e.target.value })}
              placeholder="Certificate URL or verification note reference"
              className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => setIsApplyModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={isSubmittingApply}
            >
              Submit Application
            </Button>
          </div>
        </form>
      </Modal>

      {/* =========================================================================
          MODAL 2: REVIEW LEAVE APPLICATION (APPROVE / REJECT)
      ========================================================================= */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title="Review Leave Application"
        subtitle={`Application ID: ${selectedLeave?.applicationId || selectedLeave?.id}`}
        maxWidth="max-w-md"
      >
        {selectedLeave && (
          <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
            {reviewError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{reviewError}</span>
              </div>
            )}

            {/* Application Summary Box */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">
                  {selectedLeave.applicantName || selectedLeave.user?.name}
                </span>
                <Badge variant="navy" size="xs">
                  {selectedLeave.leaveType}
                </Badge>
              </div>
              <p className="text-slate-500 font-mono">
                {selectedLeave.applicantIdNumber || selectedLeave.user?.email} &bull; {selectedLeave.academicClass}
              </p>
              <div className="pt-2 text-slate-700">
                <span className="font-bold text-slate-800">Reason:</span> {selectedLeave.reason}
              </div>
              <div className="text-emerald-700 font-bold pt-1">
                Dates: {new Date(selectedLeave.startDate).toLocaleDateString()} &rarr; {new Date(selectedLeave.endDate).toLocaleDateString()} ({selectedLeave.durationDays || selectedLeave.numberOfDays} Days)
              </div>
            </div>

            {/* Decision Radio Choice */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">Review Decision *</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setReviewForm({ ...reviewForm, decision: 'approved' })}
                  className={`p-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                    reviewForm.decision === 'approved'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                  Approve Application
                </button>

                <button
                  type="button"
                  onClick={() => setReviewForm({ ...reviewForm, decision: 'rejected' })}
                  className={`p-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                    reviewForm.decision === 'rejected'
                      ? 'border-rose-600 bg-rose-50 text-rose-800 ring-2 ring-rose-500'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <XCircle className="w-5 h-5 mx-auto mb-1 text-rose-600" />
                  Reject Application
                </button>
              </div>
            </div>

            {/* Remarks / Mandatory Rejection Reason */}
            {reviewForm.decision === 'rejected' ? (
              <div>
                <label className="block text-xs font-bold text-rose-800 mb-1">
                  Rejection Reason * (Mandatory)
                </label>
                <textarea
                  rows={3}
                  value={reviewForm.rejectionReason}
                  onChange={(e) => setReviewForm({ ...reviewForm, rejectionReason: e.target.value })}
                  placeholder="Explain why this leave application is declined..."
                  className="w-full text-xs rounded-xl border border-rose-300 p-3 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Approval Remarks / Recommendations (Optional)
                </label>
                <input
                  type="text"
                  value={reviewForm.remarks}
                  onChange={(e) => setReviewForm({ ...reviewForm, remarks: e.target.value })}
                  placeholder="e.g. Sanctioned with coursework coverage / Recommended"
                  className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant={reviewForm.decision === 'approved' ? 'primary' : 'danger'}
                size="sm"
                type="submit"
                isLoading={isSubmittingReview}
              >
                {reviewForm.decision === 'approved' ? 'Confirm Approval' : 'Confirm Rejection'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* =========================================================================
          MODAL 3: LEAVE APPLICATION DETAILS & AUDIT TIMELINE
      ========================================================================= */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Leave Request Details & History"
        subtitle={`Application ID: ${selectedLeave?.applicationId || selectedLeave?.id}`}
        maxWidth="max-w-lg"
      >
        {selectedLeave && (
          <div className="space-y-4 text-xs">
            {/* Applicant Profile Card */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Applicant Name</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">
                  {selectedLeave.applicantName || selectedLeave.user?.name}
                </p>
                <span className="text-[11px] text-slate-500 font-mono">
                  {selectedLeave.applicantIdNumber || selectedLeave.user?.email}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Status</span>
                <div className="mt-1">
                  <Badge
                    variant={
                      selectedLeave.status === 'approved'
                        ? 'success'
                        : selectedLeave.status === 'rejected'
                        ? 'danger'
                        : 'amber'
                    }
                    size="xs"
                  >
                    {selectedLeave.status ? selectedLeave.status.toUpperCase() : 'PENDING'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Leave Details Block */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Leave Category</span>
                  <p className="font-bold text-slate-800 capitalize mt-0.5">
                    {selectedLeave.leaveType ? selectedLeave.leaveType.replace(/_/g, ' ') : 'General'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Duration</span>
                  <p className="font-bold text-emerald-700 mt-0.5">
                    {selectedLeave.durationDays || selectedLeave.numberOfDays || 1} Days
                  </p>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Leave Period</span>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {new Date(selectedLeave.startDate).toLocaleDateString()} to {new Date(selectedLeave.endDate).toLocaleDateString()}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Stated Reason</span>
                <p className="text-slate-700 leading-relaxed mt-0.5 bg-white p-2.5 rounded-lg border border-slate-200/60">
                  {selectedLeave.reason}
                </p>
              </div>

              {selectedLeave.rejectionReason && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800">
                  <span className="font-bold block text-[11px] text-rose-900">Rejection Remarks:</span>
                  <p className="mt-0.5">{selectedLeave.rejectionReason}</p>
                </div>
              )}
            </div>

            {/* Chronological Approval Timeline */}
            <div className="space-y-2 pt-2">
              <h4 className="font-bold text-slate-900 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Approval Workflow & Audit Trail</span>
              </h4>

              <div className="space-y-2 border-l-2 border-slate-200 ml-2 pl-4 py-1">
                {selectedLeave.approvalHistory && selectedLeave.approvalHistory.length > 0 ? (
                  selectedLeave.approvalHistory.map((item, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[22px] top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                      <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 capitalize text-xs">
                            {item.action === 'submitted'
                              ? 'Application Submitted'
                              : item.action === 'forwarded'
                              ? 'Forwarded to Next Approver'
                              : item.action === 'approved'
                              ? 'Approved'
                              : 'Rejected'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(item.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          By: <strong className="text-slate-800">{item.approverName || item.approverRole}</strong> ({item.approverRole?.toUpperCase()})
                        </p>
                        {item.remarks && (
                          <p className="text-[11px] text-slate-500 italic mt-1 bg-white p-1.5 rounded border border-slate-100">
                            "{item.remarks}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">Initial submission record registered in audit logs.</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsDetailModalOpen(false)}
              >
                Close Details
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* =========================================================================
          MODAL 4: SUPER ADMIN WORKFLOW MATRIX CONFIGURATION
      ========================================================================= */}
      <Modal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        title="Leave Approval Hierarchy Configuration"
        subtitle="Manage institutional multi-stage approval hierarchies and escalation threshold rules."
        maxWidth="max-w-xl"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Current institutional policy automatically routes student leaves to assigned teachers, with escalation to HOD above 3 days. Faculty leaves route to HOD and escalate to Principal above 5 days.
          </p>

          <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50">
            <h4 className="font-bold text-slate-900">Configured Role Workflows</h4>
            <div className="divide-y divide-slate-200">
              <div className="py-2 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Student Applications</span>
                  <span className="text-[11px] text-slate-500">Stage 1: Class Teacher &bull; Stage 2: HOD (if &gt; 3 days)</span>
                </div>
                <Badge variant="teal" size="xs">Active Multi-Level</Badge>
              </div>

              <div className="py-2 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Faculty Applications</span>
                  <span className="text-[11px] text-slate-500">Stage 1: HOD &bull; Stage 2: Principal (if &gt; 5 days)</span>
                </div>
                <Badge variant="teal" size="xs">Active Multi-Level</Badge>
              </div>

              <div className="py-2 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">HOD Applications</span>
                  <span className="text-[11px] text-slate-500">Stage 1: Principal</span>
                </div>
                <Badge variant="navy" size="xs">Single Stage</Badge>
              </div>

              <div className="py-2 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Library Staff Applications</span>
                  <span className="text-[11px] text-slate-500">Stage 1: Chief Librarian &bull; Stage 2: Principal (if &gt; 3 days)</span>
                </div>
                <Badge variant="teal" size="xs">Active Multi-Level</Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsConfigModalOpen(false)}
            >
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RoleLeaveManagement;
