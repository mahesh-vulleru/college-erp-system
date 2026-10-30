import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarDays,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Search,
  RefreshCw,
  User,
  Building2,
  Calendar,
  FileText,
  AlertTriangle
} from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import Modal from '../common/Modal';
import Pagination from '../common/Pagination';
import EmptyState from '../common/EmptyState';
import api from '../../api/apiClient';
import { useToast } from '../../context/ToastContext';

export const FacultyLeaveManagement = ({ departments = [] }) => {
  const { addToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [leaves, setLeaves] = useState([]);
  const [summary, setSummary] = useState({
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    totalCount: 0
  });

  // Filter State
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'history' | 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedLeaveType, setSelectedLeaveType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(8);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Rejection Modal State
  const [rejectingLeave, setRejectingLeave] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionRemarks, setRejectionRemarks] = useState('');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);
  const [rejectionError, setRejectionError] = useState('');

  // Fetch Leaves from API
  const fetchLeaves = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: pageSize
      };

      if (activeTab === 'pending') {
        params.status = 'pending';
      } else if (activeTab === 'history') {
        // We'll filter or pass 'all' and filter client side, or let backend return all
        params.status = 'all';
      } else {
        params.status = 'all';
      }

      if (selectedDept !== 'all') params.department = selectedDept;
      if (selectedLeaveType !== 'all') params.leaveType = selectedLeaveType;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.getLeaves(params);
      if (res?.data) {
        let fetchedList = res.data.leaves || [];
        if (activeTab === 'history') {
          fetchedList = fetchedList.filter((l) => l.status === 'approved' || l.status === 'rejected');
        }
        setLeaves(fetchedList);
        if (res.data.summary) setSummary(res.data.summary);
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.totalPages || 1);
          setTotalRecords(res.data.pagination.total || 0);
        }
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Error loading faculty leaves',
        message: err.message || 'Failed to retrieve faculty leave requests.'
      });
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, currentPage, pageSize, selectedDept, selectedLeaveType, searchQuery, addToast]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  // Handle Approve Action
  const handleApprove = async (leaveId, facultyName) => {
    try {
      await api.reviewLeave(leaveId, {
        status: 'approved',
        remarks: 'Approved by Principal'
      });

      addToast({
        type: 'success',
        title: 'Leave Approved',
        message: `Leave application for ${facultyName || 'faculty member'} has been approved.`
      });
      fetchLeaves();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Approval Failed',
        message: err.message || 'Could not approve leave request.'
      });
    }
  };

  // Open Rejection Modal
  const openRejectModal = (leave) => {
    setRejectingLeave(leave);
    setRejectionReason('');
    setRejectionRemarks('');
    setRejectionError('');
  };

  // Submit Rejection
  const handleSubmitRejection = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      setRejectionError('Rejection reason is mandatory.');
      return;
    }

    setIsSubmittingDecision(true);
    setRejectionError('');
    try {
      await api.reviewLeave(rejectingLeave._id || rejectingLeave.id, {
        status: 'rejected',
        rejectionReason: rejectionReason.trim(),
        remarks: rejectionRemarks.trim() || undefined
      });

      addToast({
        type: 'info',
        title: 'Leave Rejected',
        message: `Leave request for ${rejectingLeave.user?.name || 'faculty member'} marked as rejected.`
      });
      setRejectingLeave(null);
      fetchLeaves();
    } catch (err) {
      setRejectionError(err.message || 'Failed to reject leave request.');
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  // Helper for Leave Type Badges
  const renderLeaveTypeBadge = (type) => {
    const formatted = (type || 'casual').replace(/_/g, ' ').toUpperCase();
    switch (type) {
      case 'sick':
        return <Badge variant="danger" size="xs">{formatted}</Badge>;
      case 'duty':
        return <Badge variant="teal" size="xs">{formatted}</Badge>;
      case 'earned':
        return <Badge variant="indigo" size="xs">{formatted}</Badge>;
      case 'casual':
      default:
        return <Badge variant="neutral" size="xs">{formatted}</Badge>;
    }
  };

  // Helper for Status Badges
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <Badge variant="success" size="xs" className="font-semibold">
            <CheckCircle className="w-3 h-3 mr-1 inline" /> Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="danger" size="xs" className="font-semibold">
            <XCircle className="w-3 h-3 mr-1 inline" /> Rejected
          </Badge>
        );
      case 'pending':
      default:
        return (
          <Badge variant="amber" size="xs" className="font-semibold">
            <Clock className="w-3 h-3 mr-1 inline" /> Pending Review
          </Badge>
        );
    }
  };

  return (
    <Card
      title="Faculty Leave Management & Principal Approval Workflow"
      subtitle="Institutional workflow for faculty leave applications with mandatory audit tracking and concurrence checks"
      headerAction={
        <Button
          variant="ghost"
          size="xs"
          onClick={fetchLeaves}
          icon={RefreshCw}
          className="text-slate-600 hover:text-slate-900"
        >
          Refresh
        </Button>
      }
    >
      {/* 1. Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        <div
          onClick={() => {
            setActiveTab('pending');
            setCurrentPage(1);
          }}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'pending'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-200'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
              Pending Approvals
            </span>
            <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-950">{summary.pendingCount}</div>
          <p className="text-[11px] text-amber-700/80 mt-1">
            Awaiting Principal decision
          </p>
        </div>

        <div
          onClick={() => {
            setActiveTab('history');
            setCurrentPage(1);
          }}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Approved Leaves
            </span>
            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-950">{summary.approvedCount}</div>
          <p className="text-[11px] text-emerald-700/80 mt-1">
            Sanctioned faculty absences
          </p>
        </div>

        <div
          onClick={() => {
            setActiveTab('history');
            setCurrentPage(1);
          }}
          className="p-4 rounded-xl border bg-white border-slate-200 shadow-sm hover:border-slate-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
              Rejected Requests
            </span>
            <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-950">{summary.rejectedCount}</div>
          <p className="text-[11px] text-rose-700/80 mt-1">
            With administrative reasons
          </p>
        </div>

        <div
          onClick={() => {
            setActiveTab('all');
            setCurrentPage(1);
          }}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'bg-slate-100 border-slate-300 ring-2 ring-slate-200'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
              Total Recorded
            </span>
            <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-950">{summary.totalCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">
            Full academic term archive
          </p>
        </div>
      </div>

      {/* 2. Status Navigation Tabs & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3 mb-4">
        {/* Tab Buttons */}
        <div className="flex space-x-2 text-xs font-semibold">
          <button
            onClick={() => {
              setActiveTab('pending');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center ${
              activeTab === 'pending'
                ? 'bg-amber-100 text-amber-900 shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
            Pending Action ({summary.pendingCount})
          </button>

          <button
            onClick={() => {
              setActiveTab('history');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center ${
              activeTab === 'history'
                ? 'bg-teal-100 text-teal-900 shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-teal-700" />
            Decision History ({summary.approvedCount + summary.rejectedCount})
          </button>

          <button
            onClick={() => {
              setActiveTab('all');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center ${
              activeTab === 'all'
                ? 'bg-slate-200 text-slate-900 shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Requests ({summary.totalCount})
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search faculty..."
              className="pl-8 pr-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 w-36 sm:w-44"
            />
          </div>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => {
              setSelectedDept(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2 py-1 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="all">All Depts</option>
            {departments.map((d) => (
              <option key={d.id || d._id} value={d.id || d._id}>
                {d.code || d.name}
              </option>
            ))}
          </select>

          {/* Leave Type Filter */}
          <select
            value={selectedLeaveType}
            onChange={(e) => {
              setSelectedLeaveType(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2 py-1 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="all">All Types</option>
            <option value="casual">Casual</option>
            <option value="sick">Sick</option>
            <option value="earned">Earned</option>
            <option value="duty">Duty</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>
      </div>

      {/* 3. Leave Requests Content */}
      {isLoading ? (
        <div className="py-12 text-center text-slate-500 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
          Loading faculty leave records...
        </div>
      ) : leaves.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={
            activeTab === 'pending'
              ? 'No Pending Leave Requests'
              : 'No Leave Applications Found'
          }
          description={
            activeTab === 'pending'
              ? 'All faculty leave requests have been reviewed. Excellent work keeping the approval queue clear!'
              : 'No leave applications match the selected status, department, or filter criteria.'
          }
        />
      ) : (
        <div className="space-y-3">
          {leaves.map((leave) => {
            const facultyName = leave.user?.name || 'Faculty Member';
            const empId = leave.faculty?.employeeId || 'FAC-N/A';
            const deptName = leave.department?.name || 'Department';
            const deptCode = leave.department?.code || '';
            const designation = leave.faculty?.designation || 'Faculty';
            const startDateStr = new Date(leave.startDate).toLocaleDateString();
            const endDateStr = new Date(leave.endDate).toLocaleDateString();

            return (
              <div
                key={leave._id || leave.id}
                className={`p-4 rounded-xl border transition-all ${
                  leave.status === 'pending'
                    ? 'bg-amber-50/40 border-amber-200 shadow-xs'
                    : leave.status === 'approved'
                    ? 'bg-white border-slate-200'
                    : 'bg-rose-50/20 border-rose-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2.5">
                  {/* Faculty Info */}
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-slate-900">{facultyName}</h4>
                      {renderLeaveTypeBadge(leave.leaveType)}
                      {renderStatusBadge(leave.status)}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex flex-wrap gap-x-2">
                      <span>ID: <strong className="text-slate-700">{empId}</strong></span>
                      <span>•</span>
                      <span>{designation}</span>
                      <span>•</span>
                      <span>Dept: <strong className="text-slate-700">{deptName} ({deptCode})</strong></span>
                    </div>
                  </div>

                  {/* Dates & Duration */}
                  <div className="text-left sm:text-right">
                    <div className="text-xs font-bold text-slate-900 flex sm:justify-end items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-teal-600" />
                      <span>{startDateStr} to {endDateStr}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-teal-700 font-mono block mt-0.5">
                      {leave.durationDays || 1} {leave.durationDays === 1 ? 'Day' : 'Days'} Duration
                    </span>
                  </div>
                </div>

                {/* Reason description */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70 text-xs text-slate-700 mb-3 leading-relaxed">
                  <span className="font-semibold text-slate-800 block mb-0.5">Stated Purpose:</span>
                  {leave.reason}
                </div>

                {/* Administrative Decision Info (if decided) */}
                {leave.status !== 'pending' && (
                  <div className="pt-2.5 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 gap-2">
                    <div>
                      <span>Decided by: <strong className="text-slate-800">{leave.reviewedBy?.name || 'Principal'}</strong></span>
                      {leave.reviewedAt && (
                        <span> on {new Date(leave.reviewedAt).toLocaleDateString()}</span>
                      )}
                      {leave.remarks && (
                        <span className="block text-slate-600 mt-0.5">Remarks: {leave.remarks}</span>
                      )}
                    </div>

                    {leave.status === 'rejected' && leave.rejectionReason && (
                      <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-800 font-medium text-xs">
                        <AlertCircle className="w-3.5 h-3.5 inline mr-1 text-rose-600" />
                        Rejection Reason: {leave.rejectionReason}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons for Pending items */}
                {leave.status === 'pending' && (
                  <div className="flex items-center justify-end space-x-2 pt-2.5 border-t border-amber-200/60">
                    <Button
                      variant="danger"
                      size="xs"
                      onClick={() => openRejectModal(leave)}
                      icon={XCircle}
                    >
                      Reject Request
                    </Button>
                    <Button
                      variant="teal"
                      size="xs"
                      onClick={() => handleApprove(leave._id || leave.id, facultyName)}
                      icon={CheckCircle}
                    >
                      Approve Leave
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-end">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(p) => setCurrentPage(p)}
          />
        </div>
      )}

      {/* 5. Mandatory Rejection Reason Modal */}
      {rejectingLeave && (
        <Modal
          isOpen={!!rejectingLeave}
          onClose={() => {
            setRejectingLeave(null);
            setRejectionError('');
          }}
          title="Reject Faculty Leave Request"
          subtitle="A mandatory justification must be recorded for institutional governance and audit transparency"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSubmitRejection} className="space-y-4 text-xs">
            {rejectionError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-start">
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 text-rose-600 mt-0.5" />
                <span>{rejectionError}</span>
              </div>
            )}

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-900 block">
                {rejectingLeave.user?.name || 'Faculty Member'} (
                {rejectingLeave.faculty?.employeeId || 'ID'})
              </span>
              <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                Leave Dates: {new Date(rejectingLeave.startDate).toLocaleDateString()} to{' '}
                {new Date(rejectingLeave.endDate).toLocaleDateString()}
              </span>
              <p className="text-slate-600 mt-1 line-clamp-2 italic">
                "{rejectingLeave.reason}"
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Reason for Rejection <span className="text-rose-500">* (Mandatory)</span>
              </label>
              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Critical laboratory evaluation scheduled; substitute faculty not arranged..."
                className="w-full p-2.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Additional Council Remarks (Optional)
              </label>
              <input
                type="text"
                value={rejectionRemarks}
                onChange={(e) => setRejectionRemarks(e.target.value)}
                placeholder="Internal administrative note..."
                className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setRejectingLeave(null)}
                disabled={isSubmittingDecision}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                type="submit"
                isLoading={isSubmittingDecision}
                icon={XCircle}
              >
                Confirm Rejection
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </Card>
  );
};

export default FacultyLeaveManagement;

