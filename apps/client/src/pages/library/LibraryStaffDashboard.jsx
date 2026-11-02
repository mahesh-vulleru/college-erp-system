import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BookOpen,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  RefreshCw,
  FileText,
  Layers,
  CalendarCheck,
  RotateCw,
  Archive,
  Eye,
  TrendingUp,
  Bell,
  UserCheck,
  ShieldAlert,
  ArrowRight,
  Info
} from 'lucide-react';
import Card from '../../components/common/Card';
import StatWidget from '../../components/common/StatWidget';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../api/apiClient';

export const LibraryStaffDashboard = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active tab syncing with URL query parameter: /library-staff?tab=search-books, etc.
  const currentTab = searchParams.get('tab') || 'dashboard';
  const setActiveTab = (tab) => {
    if (tab === 'dashboard') {
      searchParams.delete('tab');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ tab });
    }
  };

  // 1. Dashboard Metrics State
  const [dashboardData, setDashboardData] = useState(null);
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);

  // 2. Books Catalog State
  const [books, setBooks] = useState([]);
  const [totalBooks, setTotalBooks] = useState(0);
  const [isBooksLoading, setIsBooksLoading] = useState(false);
  const [bookSearch, setBookSearch] = useState('');
  const [bookCategoryFilter, setBookCategoryFilter] = useState('');
  const [categories, setCategories] = useState([]);

  // 3. Copies / Availability State
  const [availabilitySearch, setAvailabilitySearch] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');

  // 4. Issues & Circulation State
  const [issues, setIssues] = useState([]);
  const [totalIssues, setTotalIssues] = useState(0);
  const [isIssuesLoading, setIsIssuesLoading] = useState(false);
  const [issueSearch, setIssueSearch] = useState('');
  const [issueStatusFilter, setIssueStatusFilter] = useState('');

  // 5. Issue Book Workflow State
  const [issueMemberQuery, setIssueMemberQuery] = useState('');
  const [verifiedMember, setVerifiedMember] = useState(null);
  const [isVerifyingMember, setIsVerifyingMember] = useState(false);
  const [issueAccessionNumber, setIssueAccessionNumber] = useState('');
  const [verifiedCopy, setVerifiedCopy] = useState(null);
  const [isVerifyingCopy, setIsVerifyingCopy] = useState(false);
  const [customDueDate, setCustomDueDate] = useState('');
  const [issueRemarks, setIssueRemarks] = useState('');
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);
  const [issueSuccessData, setIssueSuccessData] = useState(null);

  // 6. Return Book Workflow State
  const [returnLookupQuery, setReturnLookupQuery] = useState('');
  const [foundReturnIssue, setFoundReturnIssue] = useState(null);
  const [isLookingUpReturn, setIsLookingUpReturn] = useState(false);
  const [returnCondition, setReturnCondition] = useState('good');
  const [returnRemarks, setReturnRemarks] = useState('');
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
  const [returnSuccessData, setReturnSuccessData] = useState(null);

  // 7. Renew Book Workflow State
  const [renewLookupQuery, setRenewLookupQuery] = useState('');
  const [foundRenewIssue, setFoundRenewIssue] = useState(null);
  const [isLookingUpRenew, setIsLookingUpRenew] = useState(false);
  const [isSubmittingRenew, setIsSubmittingRenew] = useState(false);

  // 8. Reservations State
  const [reservations, setReservations] = useState([]);
  const [isReservationsLoading, setIsReservationsLoading] = useState(false);
  const [reservationStatusFilter, setReservationStatusFilter] = useState('pending');

  // 9. Members Directory State
  const [members, setMembers] = useState([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [isMembersLoading, setIsMembersLoading] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberRoleFilter, setMemberRoleFilter] = useState('');
  const [selectedMemberProfile, setSelectedMemberProfile] = useState(null);
  const [isMemberProfileModalOpen, setIsMemberProfileModalOpen] = useState(false);

  // 10. My Transactions State
  const [myTransactions, setMyTransactions] = useState([]);
  const [totalMyTransactions, setTotalMyTransactions] = useState(0);
  const [isMyTransactionsLoading, setIsMyTransactionsLoading] = useState(false);
  const [myTxFilter, setMyTxFilter] = useState('');

  // 11. Overdue Books State
  const overdueIssues = useMemo(() => {
    const now = new Date();
    return (issues || []).filter(
      (iss) => (iss.status === 'issued' || iss.status === 'overdue') && iss.dueDate && new Date(iss.dueDate) < now
    );
  }, [issues]);

  // 12. Quick Action Modals
  const [quickReturnIssue, setQuickReturnIssue] = useState(null);
  const [isQuickReturnModalOpen, setIsQuickReturnModalOpen] = useState(false);

  // --------------------------------------------------------------------------
  // Data Fetchers
  // --------------------------------------------------------------------------
  const fetchDashboard = useCallback(async () => {
    setIsDashboardLoading(true);
    try {
      const res = await api.getStaffDashboard();
      if (res.success) {
        setDashboardData(res.data);
      }
    } catch (err) {
      console.error('Error fetching staff dashboard:', err);
    } finally {
      setIsDashboardLoading(false);
    }
  }, []);

  const fetchBooks = useCallback(async () => {
    setIsBooksLoading(true);
    try {
      const res = await api.getBooks({
        search: bookSearch,
        category: bookCategoryFilter,
        limit: 100
      });
      if (res.success) {
        setBooks(res.data || []);
        setTotalBooks(res.pagination?.total || (res.data || []).length);
      }
    } catch (err) {
      console.error('Error fetching books:', err);
    } finally {
      setIsBooksLoading(false);
    }
  }, [bookSearch, bookCategoryFilter]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.getBookCategories();
      if (res.success) {
        setCategories(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, []);

  const fetchIssues = useCallback(async () => {
    setIsIssuesLoading(true);
    try {
      const res = await api.getCirculationIssues({
        status: issueStatusFilter,
        search: issueSearch,
        limit: 100
      });
      if (res.success) {
        setIssues(res.data || []);
        setTotalIssues(res.pagination?.total || (res.data || []).length);
      }
    } catch (err) {
      console.error('Error fetching circulation issues:', err);
    } finally {
      setIsIssuesLoading(false);
    }
  }, [issueStatusFilter, issueSearch]);

  const fetchReservations = useCallback(async () => {
    setIsReservationsLoading(true);
    try {
      const res = await api.getBookReservations({
        status: reservationStatusFilter === 'all' ? undefined : reservationStatusFilter,
        limit: 100
      });
      if (res.success) {
        setReservations(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching reservations:', err);
    } finally {
      setIsReservationsLoading(false);
    }
  }, [reservationStatusFilter]);

  const fetchMembers = useCallback(async () => {
    setIsMembersLoading(true);
    try {
      const res = await api.getLibraryMembers({
        search: memberSearch,
        role: memberRoleFilter,
        limit: 100
      });
      if (res.success) {
        setMembers(res.data || []);
        setTotalMembers(res.pagination?.total || (res.data || []).length);
      }
    } catch (err) {
      console.error('Error fetching members:', err);
    } finally {
      setIsMembersLoading(false);
    }
  }, [memberSearch, memberRoleFilter]);

  const fetchMyTransactions = useCallback(async () => {
    setIsMyTransactionsLoading(true);
    try {
      const res = await api.getMyTransactions({
        status: myTxFilter || undefined,
        limit: 100
      });
      if (res.success) {
        setMyTransactions(res.data || []);
        setTotalMyTransactions(res.meta?.total || (res.data || []).length);
      }
    } catch (err) {
      console.error('Error fetching my transactions:', err);
    } finally {
      setIsMyTransactionsLoading(false);
    }
  }, [myTxFilter]);

  // Initial load
  useEffect(() => {
    fetchDashboard();
    fetchCategories();
  }, [fetchDashboard, fetchCategories]);

  // Tab change trigger
  useEffect(() => {
    switch (currentTab) {
      case 'dashboard':
        fetchDashboard();
        break;
      case 'search-books':
      case 'availability':
        fetchBooks();
        fetchCategories();
        break;
      case 'active-issues':
      case 'overdue-books':
        fetchIssues();
        break;
      case 'reservations':
        fetchReservations();
        break;
      case 'members':
        fetchMembers();
        break;
      case 'my-transactions':
        fetchMyTransactions();
        break;
      case 'issue-books':
      case 'return-books':
      case 'renew-books':
        // Pre-load issues so lookups are fast
        fetchIssues();
        break;
      default:
        break;
    }
  }, [currentTab, fetchDashboard, fetchBooks, fetchCategories, fetchIssues, fetchReservations, fetchMembers, fetchMyTransactions]);

  // --------------------------------------------------------------------------
  // Workflow Handlers: Issue Books
  // --------------------------------------------------------------------------
  const handleVerifyMember = async (e) => {
    e?.preventDefault();
    if (!issueMemberQuery.trim()) {
      addToast('Please enter a student roll number, faculty ID, or membership card number', 'warning');
      return;
    }
    setIsVerifyingMember(true);
    setVerifiedMember(null);
    try {
      const res = await api.getLibraryMembers({ search: issueMemberQuery.trim(), limit: 5 });
      if (res.success && res.data && res.data.length > 0) {
        // Pick exact match or first result
        const member = res.data.find(
          (m) =>
            m.membershipNumber?.toUpperCase() === issueMemberQuery.trim().toUpperCase() ||
            m.membershipCardNumber?.toUpperCase() === issueMemberQuery.trim().toUpperCase() ||
            m.user?.rollNumber?.toUpperCase() === issueMemberQuery.trim().toUpperCase() ||
            m.user?.employeeId?.toUpperCase() === issueMemberQuery.trim().toUpperCase()
        ) || res.data[0];

        // Fetch full circulation details
        const detailsRes = await api.getLibraryMemberDetails(member._id);
        if (detailsRes.success) {
          setVerifiedMember(detailsRes.data.member || member);
          // Set recommended due date based on member type
          const loanDays = member.loanPeriodDays || (member.memberType === 'faculty' ? 30 : 14);
          const targetDate = new Date();
          targetDate.setDate(targetDate.getDate() + loanDays);
          setCustomDueDate(targetDate.toISOString().slice(0, 10));
          addToast(`Member verified: ${member.user?.name || member.membershipNumber}`, 'success');
        } else {
          setVerifiedMember(member);
        }
      } else {
        addToast('No active library member found matching query', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Failed to verify library member', 'error');
    } finally {
      setIsVerifyingMember(false);
    }
  };

  const handleVerifyCopy = async (e) => {
    e?.preventDefault();
    if (!issueAccessionNumber.trim()) {
      addToast('Please enter a book accession number (e.g. LIB-001, CSE-002)', 'warning');
      return;
    }
    setIsVerifyingCopy(true);
    setVerifiedCopy(null);
    try {
      const res = await api.getBooks({ search: issueAccessionNumber.trim(), limit: 10 });
      if (res.success && res.data) {
        let found = null;
        for (const bk of res.data) {
          if (bk.copies && bk.copies.length > 0) {
            const cp = bk.copies.find(
              (c) => c.accessionNumber?.toUpperCase() === issueAccessionNumber.trim().toUpperCase()
            );
            if (cp) {
              found = { ...cp, bookTitle: bk.title, bookAuthor: bk.author, bookIsbn: bk.isbn, shelfLocation: bk.shelfLocation };
              break;
            }
          }
        }
        if (found) {
          setVerifiedCopy(found);
          if (found.status === 'available') {
            addToast(`Copy verified: ${found.bookTitle} (Available)`, 'success');
          } else {
            addToast(`Copy found, but status is '${found.status}'`, 'warning');
          }
        } else {
          // If not in nested array, try checking active issues to see if it's currently checked out
          addToast('Copy accession number not found in catalog', 'error');
        }
      }
    } catch (err) {
      addToast(err.message || 'Error checking copy accession number', 'error');
    } finally {
      setIsVerifyingCopy(false);
    }
  };

  const handleProcessIssue = async (e) => {
    e.preventDefault();
    if (!verifiedMember) {
      addToast('Please verify an eligible library member first', 'warning');
      return;
    }
    if (!issueAccessionNumber.trim()) {
      addToast('Please enter the book accession number', 'warning');
      return;
    }

    const activeCount = verifiedMember.currentBooksIssued ?? verifiedMember.activeIssuesCount ?? 0;
    if (activeCount >= verifiedMember.maxBooksAllowed) {
      addToast(`Member limit reached (${verifiedMember.maxBooksAllowed} max allowed). Return a book first.`, 'error');
      return;
    }

    setIsSubmittingIssue(true);
    try {
      const payload = {
        memberId: verifiedMember._id,
        accessionNumber: issueAccessionNumber.trim().toUpperCase(),
        dueDate: customDueDate || undefined,
        remarks: issueRemarks || undefined
      };

      const res = await api.issueBook(payload);
      if (res.success) {
        setIssueSuccessData({
          issue: res.data,
          member: verifiedMember,
          accessionNumber: issueAccessionNumber.trim().toUpperCase()
        });
        addToast('Book issued successfully!', 'success');
        // Reset inputs
        setVerifiedMember(null);
        setVerifiedCopy(null);
        setIssueMemberQuery('');
        setIssueAccessionNumber('');
        setIssueRemarks('');
        fetchDashboard();
      }
    } catch (err) {
      addToast(err.message || 'Failed to issue book', 'error');
    } finally {
      setIsSubmittingIssue(false);
    }
  };

  // --------------------------------------------------------------------------
  // Workflow Handlers: Return Books
  // --------------------------------------------------------------------------
  const handleLookupReturn = async (e) => {
    e?.preventDefault();
    if (!returnLookupQuery.trim()) {
      addToast('Please enter an accession number, member ID, or issue number', 'warning');
      return;
    }
    setIsLookingUpReturn(true);
    setFoundReturnIssue(null);
    try {
      const res = await api.getCirculationIssues({
        search: returnLookupQuery.trim(),
        limit: 10
      });
      if (res.success && res.data && res.data.length > 0) {
        const active = res.data.find((iss) => iss.status === 'issued' || iss.status === 'overdue');
        if (active) {
          setFoundReturnIssue(active);
          addToast(`Active loan found for "${active.book?.title || 'Book'}"`, 'success');
        } else {
          addToast('Found circulation records, but none are currently active/checked-out', 'warning');
        }
      } else {
        addToast('No active checkout found for given query', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Failed to lookup checkout record', 'error');
    } finally {
      setIsLookingUpReturn(false);
    }
  };

  const handleProcessReturn = async (e) => {
    e?.preventDefault();
    if (!foundReturnIssue) {
      addToast('Please lookup an active checkout first', 'warning');
      return;
    }
    setIsSubmittingReturn(true);
    try {
      const payload = {
        issueId: foundReturnIssue._id,
        accessionNumber: foundReturnIssue.bookCopy?.accessionNumber,
        condition: returnCondition,
        remarks: returnRemarks || undefined
      };

      const res = await api.returnBook(payload);
      if (res.success) {
        setReturnSuccessData({
          issue: res.data?.issue || foundReturnIssue,
          fine: res.data?.fine
        });
        if (res.data?.fine && res.data.fine.amount > 0) {
          addToast(`Book returned. Overdue fine assessed: ₹${res.data.fine.amount}`, 'warning');
        } else {
          addToast('Book returned in good order!', 'success');
        }
        setFoundReturnIssue(null);
        setReturnLookupQuery('');
        setReturnRemarks('');
        fetchDashboard();
      }
    } catch (err) {
      addToast(err.message || 'Failed to process return', 'error');
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  // --------------------------------------------------------------------------
  // Workflow Handlers: Renew Books
  // --------------------------------------------------------------------------
  const handleLookupRenew = async (e) => {
    e?.preventDefault();
    if (!renewLookupQuery.trim()) {
      addToast('Please enter an accession number, member ID, or issue number', 'warning');
      return;
    }
    setIsLookingUpRenew(true);
    setFoundRenewIssue(null);
    try {
      const res = await api.getCirculationIssues({
        search: renewLookupQuery.trim(),
        limit: 10
      });
      if (res.success && res.data && res.data.length > 0) {
        const active = res.data.find((iss) => iss.status === 'issued' || iss.status === 'overdue');
        if (active) {
          setFoundRenewIssue(active);
          addToast(`Active checkout located for "${active.book?.title || 'Book'}"`, 'success');
        } else {
          addToast('No active checkout found for given query', 'warning');
        }
      } else {
        addToast('No matching active loans found', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Lookup failed', 'error');
    } finally {
      setIsLookingUpRenew(false);
    }
  };

  const handleProcessRenew = async (issueId) => {
    const targetId = issueId || foundRenewIssue?._id;
    if (!targetId) return;

    setIsSubmittingRenew(true);
    try {
      const res = await api.renewBook({ issueId: targetId });
      if (res.success) {
        addToast(
          `Book renewed successfully! New due date: ${new Date(res.data?.dueDate).toLocaleDateString()}`,
          'success'
        );
        setFoundRenewIssue(null);
        setRenewLookupQuery('');
        fetchIssues();
        fetchDashboard();
      }
    } catch (err) {
      addToast(err.message || 'Renewal not authorized or loan policy limit reached', 'error');
    } finally {
      setIsSubmittingRenew(false);
    }
  };

  // Quick return from active list or overdue list
  const handleProcessQuickReturn = async (e) => {
    e.preventDefault();
    if (!quickReturnIssue) return;
    try {
      const res = await api.returnBook({
        issueId: quickReturnIssue._id,
        condition: returnCondition,
        remarks: returnRemarks || undefined
      });
      if (res.success) {
        if (res.data?.fine && res.data.fine.amount > 0) {
          addToast(`Book returned. Overdue fine: ₹${res.data.fine.amount}`, 'warning');
        } else {
          addToast('Book returned successfully', 'success');
        }
        setIsQuickReturnModalOpen(false);
        setQuickReturnIssue(null);
        fetchIssues();
        fetchDashboard();
      }
    } catch (err) {
      addToast(err.message || 'Failed to process return', 'error');
    }
  };

  const handleCancelReservation = async (resId) => {
    if (!window.confirm('Are you sure you want to cancel this patron reservation?')) return;
    try {
      const res = await api.cancelBookReservation(resId);
      if (res.success) {
        addToast('Reservation cancelled successfully', 'success');
        fetchReservations();
        fetchDashboard();
      }
    } catch (err) {
      addToast(err.message || 'Failed to cancel reservation', 'error');
    }
  };

  const handleViewMemberProfile = async (memberId) => {
    try {
      const res = await api.getLibraryMemberDetails(memberId);
      if (res.success) {
        setSelectedMemberProfile(res.data);
        setIsMemberProfileModalOpen(true);
      }
    } catch (err) {
      addToast(err.message || 'Failed to load member profile', 'error');
    }
  };

  // Helper calculations
  const calculateDaysOverdue = (dueDate) => {
    if (!dueDate) return 0;
    const diff = new Date().getTime() - new Date(dueDate).getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  // --------------------------------------------------------------------------
  // Render Tab Content
  // --------------------------------------------------------------------------
  return (
    <div className="space-y-6 pb-12">
      {/* Top Staff Circulation Header Banner */}
      <div className="rounded-2xl p-6 sm:p-7 bg-gradient-to-r from-[#181a29] via-[#242742] to-[#141522] text-white border border-indigo-900/40 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Circulation Desk Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              Central Library Operations
            </h1>
            <p className="text-indigo-200/80 text-xs sm:text-sm mt-1 max-w-xl font-light">
              Welcome, <span className="font-semibold text-white">{user?.name || 'Staff Member'}</span>. Process book checkouts, manage returns, verify patron borrowing eligibility, and monitor reservations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                fetchDashboard();
                addToast('Refreshing operations metrics...', 'info');
              }}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Sync Data
            </Button>
            <Button
              variant="indigo"
              size="sm"
              onClick={() => setActiveTab('issue-books')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-md text-xs"
            >
              <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
              Issue Book
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setActiveTab('return-books')}
              className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600 text-xs"
            >
              <Clock className="w-3.5 h-3.5 mr-1.5" />
              Return Book
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setActiveTab('renew-books')}
              className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600 text-xs"
            >
              <RotateCw className="w-3.5 h-3.5 mr-1.5" />
              Renew
            </Button>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 1. STAFF DASHBOARD TAB (OVERVIEW) */}
      {/* -------------------------------------------------------------------- */}
      {currentTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Top Real-time Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatWidget
              title="Issued Today"
              value={dashboardData?.summary?.booksIssuedToday ?? 0}
              icon={CheckCircle}
              trend={{ direction: 'up', label: 'Daily checkouts' }}
              accentColor="indigo"
            />
            <StatWidget
              title="Returned Today"
              value={dashboardData?.summary?.booksReturnedToday ?? 0}
              icon={Clock}
              trend={{ direction: 'neutral', label: 'Returns recorded' }}
              accentColor="teal"
            />
            <StatWidget
              title="Active Loans"
              value={dashboardData?.summary?.activeTransactions ?? 0}
              icon={BookOpen}
              trend={{ direction: 'neutral', label: 'Total checked-out' }}
              accentColor="blue"
            />
            <StatWidget
              title="Pending Returns"
              value={dashboardData?.summary?.pendingReturns ?? 0}
              icon={Layers}
              trend={{ direction: 'neutral', label: 'Expected returns' }}
              accentColor="purple"
            />
            <StatWidget
              title="Overdue Books"
              value={dashboardData?.summary?.overdueBooks ?? 0}
              icon={AlertTriangle}
              trend={{ direction: 'down', label: 'Overdue loans' }}
              accentColor="rose"
            />
            <StatWidget
              title="Pending Reservations"
              value={dashboardData?.summary?.pendingReservations ?? 0}
              icon={CalendarCheck}
              trend={{ direction: 'neutral', label: 'Patron requests' }}
              accentColor="amber"
            />
          </div>

          {/* Staff Daily Activity Card & Fast Circulation Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 p-5 border border-indigo-100 bg-gradient-to-br from-indigo-50/50 via-white to-slate-50 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-indigo-100">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-bold text-navy-950">My Daily Activity</h3>
                </div>
                <Badge variant="primary">Today</Badge>
              </div>

              <div className="mt-4 space-y-3.5">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-indigo-100 shadow-2xs">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-navy-900">Issues Processed</p>
                      <p className="text-[10px] text-navy-500">Checked out by you today</p>
                    </div>
                  </div>
                  <span className="text-base font-extrabold text-indigo-700">
                    {dashboardData?.myActivity?.issuesToday ?? 0}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-teal-100 shadow-2xs">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-xs">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-navy-900">Returns Processed</p>
                      <p className="text-[10px] text-navy-500">Checked in by you today</p>
                    </div>
                  </div>
                  <span className="text-base font-extrabold text-teal-700">
                    {dashboardData?.myActivity?.returnsToday ?? 0}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-navy-900">My Total Transactions</p>
                      <p className="text-[10px] text-navy-500">Lifetime staff audit count</p>
                    </div>
                  </div>
                  <span className="text-base font-extrabold text-navy-800">
                    {dashboardData?.myActivity?.totalTransactions ?? 0}
                  </span>
                </div>

                <div className="pt-2 text-[11px] text-navy-500 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>Assigned Desk: Central Circulation Counter • Shift active</span>
                </div>
              </div>
            </Card>

            {/* Quick Circulation Workflows */}
            <Card className="lg:col-span-2 p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-sm font-bold text-navy-950">Fast Circulation Actions</h3>
                  </div>
                  <span className="text-xs text-navy-500">Quick Desk Access</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  <button
                    onClick={() => setActiveTab('issue-books')}
                    className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/40 hover:bg-indigo-50 transition-all text-left group flex items-start space-x-3"
                  >
                    <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-navy-950 group-hover:text-indigo-600 transition-colors">
                        Issue Book to Patron
                      </h4>
                      <p className="text-[11px] text-navy-500 mt-0.5">
                        Verify member card, select available copy, and issue loan.
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('return-books')}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-100 transition-all text-left group flex items-start space-x-3"
                  >
                    <div className="w-9 h-9 rounded-lg bg-slate-700 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-navy-950 group-hover:text-slate-800 transition-colors">
                        Process Book Return
                      </h4>
                      <p className="text-[11px] text-navy-500 mt-0.5">
                        Record condition, calculate overdue fines, restore copy.
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('availability')}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-100 transition-all text-left group flex items-start space-x-3"
                  >
                    <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Search className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-navy-950 group-hover:text-blue-600 transition-colors">
                        Check Book Availability
                      </h4>
                      <p className="text-[11px] text-navy-500 mt-0.5">
                        Live search by accession number, shelf rack, or ISBN.
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('renew-books')}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-100 transition-all text-left group flex items-start space-x-3"
                  >
                    <div className="w-9 h-9 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <RotateCw className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-navy-950 group-hover:text-teal-600 transition-colors">
                        Renew Active Checkout
                      </h4>
                      <p className="text-[11px] text-navy-500 mt-0.5">
                        Verify renewal limits, check reservations, extend due date.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-navy-500">
                <span>Standard Loan: Students (14 days) • Faculty (30 days)</span>
                <span className="font-semibold text-rose-600">Overdue Rate: ₹5 / day</span>
              </div>
            </Card>
          </div>

          {/* Recent Circulation Transactions Table */}
          <Card className="p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-navy-950">Recent Circulation Activity</h3>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setActiveTab('active-issues')}
                className="text-xs"
              >
                View All Active Loans
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>

            {dashboardData?.recentTransactions && dashboardData.recentTransactions.length > 0 ? (
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-navy-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Issue #</th>
                      <th className="py-2.5 px-3">Book Title</th>
                      <th className="py-2.5 px-3">Accession No</th>
                      <th className="py-2.5 px-3">Borrower / Member</th>
                      <th className="py-2.5 px-3">Due Date</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Issued By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dashboardData.recentTransactions.map((tx) => (
                      <tr key={tx._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-navy-950">{tx.issueNumber}</td>
                        <td className="py-2.5 px-3 font-medium text-navy-900 max-w-xs truncate">
                          {tx.book?.title || 'Unknown Title'}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-indigo-700">
                          {tx.bookCopy?.accessionNumber || 'N/A'}
                        </td>
                        <td className="py-2.5 px-3 text-navy-800">
                          <div>
                            <span className="font-semibold">{tx.user?.name || 'Member'}</span>
                            <span className="text-[10px] text-navy-400 block font-mono">
                              {tx.member?.membershipNumber}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-navy-600">
                          {tx.dueDate ? new Date(tx.dueDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge
                            variant={
                              tx.status === 'returned'
                                ? 'success'
                                : tx.status === 'overdue'
                                ? 'danger'
                                : 'primary'
                            }
                          >
                            {tx.status}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-navy-600">
                          {tx.issuedBy?.name || 'Circulation Desk'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="No recent circulation records"
                description="Transactions processed today will appear here in real-time."
              />
            )}
          </Card>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 2. SEARCH BOOKS TAB */}
      {/* -------------------------------------------------------------------- */}
      {currentTab === 'search-books' && (
        <Card className="p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-navy-950 flex items-center gap-2">
                <Search className="w-4 h-4 text-indigo-600" />
                Library Catalog Search
              </h3>
              <p className="text-xs text-navy-500 mt-0.5">
                Browse catalog titles, inspect copy counts, shelf locations, and availability status.
              </p>
            </div>
            <span className="text-xs text-navy-500 font-semibold">{totalBooks} Titles in Catalog</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Input
                placeholder="Search by title, author, or ISBN..."
                value={bookSearch}
                onChange={(e) => setBookSearch(e.target.value)}
                leftIcon={Search}
              />
            </div>
            <div>
              <Select
                value={bookCategoryFilter}
                onChange={(e) => setBookCategoryFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Categories' },
                  ...categories.map((c) => ({ value: c._id, label: c.name }))
                ]}
              />
            </div>
          </div>

          {books.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-navy-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Title & Author</th>
                    <th className="py-2.5 px-3">ISBN</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Shelf Location</th>
                    <th className="py-2.5 px-3">Total Copies</th>
                    <th className="py-2.5 px-3">Available</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {books.map((bk) => (
                    <tr key={bk._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-navy-950">{bk.title}</div>
                        <div className="text-[11px] text-navy-500 font-normal">by {bk.author}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-navy-600">{bk.isbn || 'N/A'}</td>
                      <td className="py-2.5 px-3">
                        <Badge variant="secondary">{bk.category?.name || 'General'}</Badge>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-xs text-navy-700">
                        {bk.shelfLocation || bk.rackNumber || 'Central Stacks'}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-navy-800">{bk.totalCopies || 0}</td>
                      <td className="py-2.5 px-3">
                        <Badge variant={bk.availableCopies > 0 ? 'success' : 'danger'}>
                          {bk.availableCopies || 0} Available
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="text-[11px] h-7 px-2"
                            onClick={() => {
                              setAvailabilitySearch(bk.title);
                              setActiveTab('availability');
                            }}
                          >
                            Check Copies
                          </Button>
                          {bk.availableCopies > 0 && (
                            <Button
                              variant="indigo"
                              size="sm"
                              className="text-[11px] h-7 px-2 bg-indigo-600 text-white"
                              onClick={() => {
                                // Find an available copy if present in nested array
                                const availCopy = bk.copies?.find((c) => c.status === 'available');
                                if (availCopy) {
                                  setIssueAccessionNumber(availCopy.accessionNumber);
                                  setVerifiedCopy({ ...availCopy, bookTitle: bk.title });
                                }
                                setActiveTab('issue-books');
                              }}
                            >
                              Issue
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No books matching criteria"
              description="Try adjusting your search terms or category filter."
            />
          )}
        </Card>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 3. BOOK AVAILABILITY TAB */}
      {/* -------------------------------------------------------------------- */}
      {currentTab === 'availability' && (
        <Card className="p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-navy-950 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                Live Book & Copy Availability Checker
              </h3>
              <p className="text-xs text-navy-500 mt-0.5">
                Inspect physical barcode/accession numbers, shelf locations, and real-time status.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchBooks}
                className="text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                Refresh
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Input
                placeholder="Filter by accession number (e.g. CSE-001) or book title..."
                value={availabilitySearch}
                onChange={(e) => setAvailabilitySearch(e.target.value)}
                leftIcon={Search}
              />
            </div>
            <div>
              <Select
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'available', label: 'Available Only' },
                  { value: 'issued', label: 'Issued / Checked Out' },
                  { value: 'damaged', label: 'Damaged / Under Repair' }
                ]}
              />
            </div>
          </div>

          {/* Copy List Extracted from Books */}
          {(() => {
            // Flatten copies from fetched books
            const allCopies = [];
            books.forEach((b) => {
              if (b.copies && b.copies.length > 0) {
                b.copies.forEach((cp) => {
                  allCopies.push({
                    ...cp,
                    bookTitle: b.title,
                    bookAuthor: b.author,
                    shelfLocation: b.shelfLocation || b.rackNumber || 'General Stacks',
                    category: b.category?.name || 'General'
                  });
                });
              }
            });

            const filteredCopies = allCopies.filter((cp) => {
              const matchesSearch =
                !availabilitySearch ||
                cp.accessionNumber?.toLowerCase().includes(availabilitySearch.toLowerCase()) ||
                cp.bookTitle?.toLowerCase().includes(availabilitySearch.toLowerCase());
              const matchesStatus =
                availabilityFilter === 'all' || cp.status === availabilityFilter;
              return matchesSearch && matchesStatus;
            });

            return filteredCopies.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-navy-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Accession Number</th>
                      <th className="py-2.5 px-3">Book Title</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Shelf / Rack</th>
                      <th className="py-2.5 px-3">Condition</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Circulation Desk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCopies.map((cp) => (
                      <tr key={cp._id || cp.accessionNumber} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">
                          {cp.accessionNumber}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-navy-950 block">{cp.bookTitle}</span>
                          <span className="text-[10px] text-navy-500 font-normal">{cp.bookAuthor}</span>
                        </td>
                        <td className="py-2.5 px-3 text-navy-600">{cp.category}</td>
                        <td className="py-2.5 px-3 font-mono text-navy-700">{cp.shelfLocation}</td>
                        <td className="py-2.5 px-3">
                          <span className="capitalize text-navy-600">{cp.condition || 'good'}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge
                            variant={
                              cp.status === 'available'
                                ? 'success'
                                : cp.status === 'issued'
                                ? 'primary'
                                : 'danger'
                            }
                          >
                            {cp.status}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {cp.status === 'available' ? (
                            <Button
                              variant="indigo"
                              size="sm"
                              className="text-[11px] h-7 px-2.5 bg-indigo-600 text-white"
                              onClick={() => {
                                setIssueAccessionNumber(cp.accessionNumber);
                                setVerifiedCopy(cp);
                                setActiveTab('issue-books');
                              }}
                            >
                              Issue Copy
                            </Button>
                          ) : (
                            <Button
                              variant="secondary"
                              size="sm"
                              className="text-[11px] h-7 px-2.5"
                              onClick={() => {
                                setReturnLookupQuery(cp.accessionNumber);
                                setActiveTab('return-books');
                              }}
                            >
                              Return / Check
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="No copies matching availability filter"
                description="Try searching with a different accession number or status."
              />
            );
          })()}
        </Card>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 4. ISSUE BOOKS TAB */}
      {/* -------------------------------------------------------------------- */}
      {currentTab === 'issue-books' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-navy-950 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-indigo-600" />
                Circulation Desk: Issue Book
              </h3>
              <p className="text-xs text-navy-500 mt-1">
                Fast 3-step checkout: verify member eligibility, select copy, and confirm loan terms.
              </p>
            </div>

            {/* Step 1: Member Verification */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">1</span>
                  Patron Verification
                </span>
                {verifiedMember && (
                  <Badge variant="success">Member Verified</Badge>
                )}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Student Roll # / Faculty ID / Card # (e.g. CS2024001, LIB-MEM-001)"
                  value={issueMemberQuery}
                  onChange={(e) => setIssueMemberQuery(e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="indigo"
                  size="sm"
                  onClick={handleVerifyMember}
                  isLoading={isVerifyingMember}
                  className="bg-indigo-600 text-white shrink-0 text-xs px-4"
                >
                  Verify Member
                </Button>
              </div>

              {/* Verified Member Eligibility Summary */}
              {verifiedMember && (
                <div className="mt-3 p-3.5 rounded-xl bg-white border border-indigo-100 shadow-2xs space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-navy-950 text-sm">{verifiedMember.user?.name}</span>
                      <span className="text-navy-500 block font-mono text-[11px]">
                        {verifiedMember.membershipNumber} • {verifiedMember.memberType?.toUpperCase()}
                      </span>
                    </div>
                    <Badge variant={verifiedMember.status === 'active' ? 'success' : 'danger'}>
                      Status: {verifiedMember.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                    <div>
                      <span className="text-navy-400 block">Department</span>
                      <span className="font-semibold text-navy-800">{verifiedMember.department || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-navy-400 block">Active Loans / Limit</span>
                      <span className="font-semibold text-navy-800">
                        {verifiedMember.currentBooksIssued ?? 0} / {verifiedMember.maxBooksAllowed || 3} books
                      </span>
                    </div>
                    <div>
                      <span className="text-navy-400 block">Overdue Fines Due</span>
                      <span className={`font-semibold ${(verifiedMember.totalFinesDue || 0) > 0 ? 'text-rose-600' : 'text-teal-600'}`}>
                        ₹{verifiedMember.totalFinesDue || 0}
                      </span>
                    </div>
                  </div>

                  {(verifiedMember.currentBooksIssued ?? 0) >= (verifiedMember.maxBooksAllowed || 3) && (
                    <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Borrowing limit reached. Patron must return an active book before new issues.</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 2: Book Copy Selection */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">2</span>
                  Select Book Copy
                </span>
                {verifiedCopy && (
                  <Badge variant={verifiedCopy.status === 'available' ? 'success' : 'danger'}>
                    {verifiedCopy.status}
                  </Badge>
                )}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Enter Copy Accession Number (e.g. CSE-001, LIB-002)..."
                  value={issueAccessionNumber}
                  onChange={(e) => setIssueAccessionNumber(e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleVerifyCopy}
                  isLoading={isVerifyingCopy}
                  className="shrink-0 text-xs px-4"
                >
                  Verify Copy
                </Button>
              </div>

              {verifiedCopy && (
                <div className="p-3 rounded-lg bg-white border border-slate-200 text-xs space-y-1">
                  <p className="font-bold text-navy-950">{verifiedCopy.bookTitle}</p>
                  <p className="text-navy-500 text-[11px]">
                    Accession: <span className="font-mono text-indigo-700 font-semibold">{verifiedCopy.accessionNumber}</span> • Shelf: {verifiedCopy.shelfLocation}
                  </p>
                </div>
              )}
            </div>

            {/* Step 3: Loan Terms & Issue Action */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">3</span>
                Loan Terms & Due Date
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Due Date (Generated or Custom)"
                  type="date"
                  value={customDueDate}
                  onChange={(e) => setCustomDueDate(e.target.value)}
                />
                <Input
                  label="Staff Remarks (Optional)"
                  placeholder="Condition notes, reference purpose..."
                  value={issueRemarks}
                  onChange={(e) => setIssueRemarks(e.target.value)}
                />
              </div>

              <div className="pt-2">
                <Button
                  variant="indigo"
                  size="md"
                  onClick={handleProcessIssue}
                  isLoading={isSubmittingIssue}
                  disabled={!verifiedMember || !issueAccessionNumber.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-md font-semibold text-xs py-2.5"
                >
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                  Confirm & Issue Book
                </Button>
              </div>
            </div>
          </Card>

          {/* Issue Confirmation Receipt Card */}
          <div className="space-y-4">
            <Card className="p-5 border border-indigo-100 bg-gradient-to-br from-indigo-50/30 to-white shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-navy-700 mb-2">
                Circulation Rules & Policy
              </h4>
              <ul className="text-xs text-navy-600 space-y-2 list-disc list-inside">
                <li><span className="font-semibold">Student Quota:</span> Maximum 3 books for 14 days.</li>
                <li><span className="font-semibold">Faculty Quota:</span> Maximum 6 books for 30 days.</li>
                <li><span className="font-semibold">Overdue Fine:</span> ₹5 per calendar day past due date.</li>
                <li><span className="font-semibold">Max Renewals:</span> 2 times, provided no reservations exist.</li>
              </ul>
            </Card>

            {issueSuccessData && (
              <Card className="p-5 border-2 border-emerald-500 bg-emerald-50/40 shadow-sm space-y-3">
                <div className="flex items-center space-x-2 text-emerald-800">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">Issue Receipt Confirmed</h4>
                </div>
                <div className="text-xs text-navy-800 space-y-1.5 bg-white p-3 rounded-lg border border-emerald-200">
                  <p><span className="font-semibold">Issue #:</span> {issueSuccessData.issue?.issueNumber}</p>
                  <p><span className="font-semibold">Patron:</span> {issueSuccessData.member?.user?.name}</p>
                  <p><span className="font-semibold">Member ID:</span> {issueSuccessData.member?.membershipNumber}</p>
                  <p><span className="font-semibold">Accession:</span> {issueSuccessData.accessionNumber}</p>
                  <p><span className="font-semibold">Due Date:</span> {new Date(issueSuccessData.issue?.dueDate).toLocaleDateString()}</p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => setIssueSuccessData(null)}
                >
                  Clear Receipt / New Issue
                </Button>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 5. RETURN BOOKS TAB */}
      {/* -------------------------------------------------------------------- */}
      {currentTab === 'return-books' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-navy-950 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                Circulation Desk: Process Book Return
              </h3>
              <p className="text-xs text-navy-500 mt-1">
                Lookup active checkout by barcode/accession number or patron ID, inspect condition, and record check-in.
              </p>
            </div>

            {/* Step 1: Active Issue Lookup */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                1. Lookup Active Loan Record
              </span>

              <div className="flex gap-2">
                <Input
                  placeholder="Enter Accession Number (e.g. CSE-001) or Member ID..."
                  value={returnLookupQuery}
                  onChange={(e) => setReturnLookupQuery(e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="indigo"
                  size="sm"
                  onClick={handleLookupReturn}
                  isLoading={isLookingUpReturn}
                  className="bg-indigo-600 text-white shrink-0 text-xs px-4"
                >
                  Find Loan
                </Button>
              </div>

              {foundReturnIssue && (
                <div className="p-4 rounded-xl bg-white border border-indigo-100 shadow-2xs space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <span className="font-bold text-navy-950 text-sm">
                        {foundReturnIssue.book?.title}
                      </span>
                      <span className="text-navy-500 block font-mono text-[11px]">
                        Accession: {foundReturnIssue.bookCopy?.accessionNumber}
                      </span>
                    </div>
                    <Badge variant={foundReturnIssue.status === 'overdue' ? 'danger' : 'primary'}>
                      {foundReturnIssue.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                    <div>
                      <span className="text-navy-400 block">Patron</span>
                      <span className="font-semibold text-navy-800">{foundReturnIssue.user?.name}</span>
                    </div>
                    <div>
                      <span className="text-navy-400 block">Issue Date</span>
                      <span className="font-semibold text-navy-800">
                        {new Date(foundReturnIssue.issueDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-navy-400 block">Due Date</span>
                      <span className="font-semibold text-navy-800">
                        {new Date(foundReturnIssue.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {calculateDaysOverdue(foundReturnIssue.dueDate) > 0 && (
                    <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        Book is overdue by {calculateDaysOverdue(foundReturnIssue.dueDate)} days
                      </span>
                      <span className="font-bold">Estimated Fine: ₹{calculateDaysOverdue(foundReturnIssue.dueDate) * 5}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 2: Book Condition & Return Confirmation */}
            {foundReturnIssue && (
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                  2. Condition Inspection & Confirmation
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Select
                    label="Physical Condition Upon Return"
                    value={returnCondition}
                    onChange={(e) => setReturnCondition(e.target.value)}
                    options={[
                      { value: 'good', label: 'Good - Standard condition' },
                      { value: 'fair', label: 'Fair - Minor shelf wear' },
                      { value: 'damaged', label: 'Damaged - Requires rebinding / repair' },
                      { value: 'lost', label: 'Lost - Patron reported missing' }
                    ]}
                  />

                  <Input
                    label="Staff Return Notes (Optional)"
                    placeholder="Condition remarks or fine acknowledgment..."
                    value={returnRemarks}
                    onChange={(e) => setReturnRemarks(e.target.value)}
                  />
                </div>

                <div className="pt-2">
                  <Button
                    variant="indigo"
                    size="md"
                    onClick={handleProcessReturn}
                    isLoading={isSubmittingReturn}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white shadow-md font-semibold text-xs py-2.5"
                  >
                    <CheckCircle className="w-4 h-4 mr-1.5" />
                    Process Return & Restore Copy
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Return Status Feedback */}
          <div>
            {returnSuccessData ? (
              <Card className="p-5 border-2 border-emerald-500 bg-emerald-50/40 shadow-sm space-y-3">
                <div className="flex items-center space-x-2 text-emerald-800">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">Return Confirmed</h4>
                </div>
                <div className="text-xs text-navy-800 space-y-1.5 bg-white p-3 rounded-lg border border-emerald-200">
                  <p><span className="font-semibold">Issue #:</span> {returnSuccessData.issue?.issueNumber}</p>
                  <p><span className="font-semibold">Return Time:</span> {new Date().toLocaleString()}</p>
                  {returnSuccessData.fine && returnSuccessData.fine.amount > 0 ? (
                    <div className="mt-2 p-2 rounded bg-amber-50 border border-amber-200 text-amber-800">
                      <p className="font-bold">Overdue Fine Assessed: ₹{returnSuccessData.fine.amount}</p>
                      <p className="text-[10px]">Patron fine account has been updated.</p>
                    </div>
                  ) : (
                    <p className="text-teal-700 font-semibold">Returned on time. No overdue fine assessed.</p>
                  )}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => setReturnSuccessData(null)}
                >
                  Process Another Return
                </Button>
              </Card>
            ) : (
              <Card className="p-5 border border-slate-200 shadow-sm space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-navy-700">
                  Return Inspection Checklist
                </h4>
                <ul className="text-xs text-navy-600 space-y-2 list-disc list-inside">
                  <li>Inspect book spine, pages, and library stamp.</li>
                  <li>Verify barcode / accession number matches checkout.</li>
                  <li>Mark as <span className="font-semibold">Damaged</span> if torn or waterlogged.</li>
                  <li>Overdue fines are calculated automatically at ₹5/day.</li>
                </ul>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 6. RENEW BOOKS TAB */}
      {/* -------------------------------------------------------------------- */}
      {currentTab === 'renew-books' && (
        <Card className="max-w-2xl mx-auto p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="pb-3 border-b border-slate-200">
            <h3 className="text-base font-bold text-navy-950 flex items-center gap-2">
              <RotateCw className="w-5 h-5 text-indigo-600" />
              Circulation Desk: Renew Book Loan
            </h3>
            <p className="text-xs text-navy-500 mt-1">
              Verify renewal eligibility, check for patron holds/reservations, and extend the due date.
            </p>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Search active loan by Accession Number or Member ID..."
              value={renewLookupQuery}
              onChange={(e) => setRenewLookupQuery(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="indigo"
              size="sm"
              onClick={handleLookupRenew}
              isLoading={isLookingUpRenew}
              className="bg-indigo-600 text-white shrink-0 text-xs px-4"
            >
              Lookup Loan
            </Button>
          </div>

          {foundRenewIssue && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                  <span className="font-bold text-navy-950 text-sm">{foundRenewIssue.book?.title}</span>
                  <span className="text-navy-500 block font-mono text-[11px]">
                    Accession: {foundRenewIssue.bookCopy?.accessionNumber}
                  </span>
                </div>
                <Badge variant={foundRenewIssue.renewalCount >= 2 ? 'danger' : 'primary'}>
                  Renewals: {foundRenewIssue.renewalCount || 0} / {foundRenewIssue.maxRenewals || 2}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-navy-400 block text-[11px]">Borrower</span>
                  <span className="font-semibold text-navy-800">{foundRenewIssue.user?.name}</span>
                </div>
                <div>
                  <span className="text-navy-400 block text-[11px]">Current Due Date</span>
                  <span className="font-semibold text-navy-800">
                    {new Date(foundRenewIssue.dueDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {foundRenewIssue.renewalCount >= (foundRenewIssue.maxRenewals || 2) ? (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span>Maximum renewal limit reached. This book must be returned to the library.</span>
                </div>
              ) : (
                <div className="pt-2">
                  <Button
                    variant="indigo"
                    size="md"
                    onClick={() => handleProcessRenew(foundRenewIssue._id)}
                    isLoading={isSubmittingRenew}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-md text-xs py-2.5"
                  >
                    <RotateCw className="w-4 h-4 mr-1.5" />
                    Confirm Renewal (+14 or +30 Days)
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 7. ACTIVE ISSUES TAB */}
      {/* -------------------------------------------------------------------- */}
      {currentTab === 'active-issues' && (
        <Card className="p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-navy-950 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                Active Circulation Loans
              </h3>
              <p className="text-xs text-navy-500 mt-0.5">
                All books currently checked out across students and faculty members.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-navy-500 font-semibold">{totalIssues} Active Checkouts</span>
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchIssues}
                className="text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Input
                placeholder="Search by patron name, accession number, or title..."
                value={issueSearch}
                onChange={(e) => setIssueSearch(e.target.value)}
                leftIcon={Search}
              />
            </div>
            <div>
              <Select
                value={issueStatusFilter}
                onChange={(e) => setIssueStatusFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Active Issues' },
                  { value: 'issued', label: 'Issued (Within Term)' },
                  { value: 'overdue', label: 'Overdue Only' }
                ]}
              />
            </div>
          </div>

          {issues.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-navy-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Issue #</th>
                    <th className="py-2.5 px-3">Book Title</th>
                    <th className="py-2.5 px-3">Accession No</th>
                    <th className="py-2.5 px-3">Patron Name</th>
                    <th className="py-2.5 px-3">Issue Date</th>
                    <th className="py-2.5 px-3">Due Date</th>
                    <th className="py-2.5 px-3">Renewals</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Desk Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {issues.map((iss) => {
                    const daysOverdue = calculateDaysOverdue(iss.dueDate);
                    const isLate = daysOverdue > 0;
                    return (
                      <tr key={iss._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-navy-950">{iss.issueNumber}</td>
                        <td className="py-2.5 px-3 font-medium text-navy-900 max-w-xs truncate">
                          {iss.book?.title}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-indigo-700">
                          {iss.bookCopy?.accessionNumber || 'N/A'}
                        </td>
                        <td className="py-2.5 px-3 text-navy-800">
                          <div>
                            <span className="font-semibold">{iss.user?.name || 'Member'}</span>
                            <span className="text-[10px] text-navy-400 block font-mono">
                              {iss.member?.membershipNumber}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-navy-600">
                          {new Date(iss.issueDate).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`font-semibold ${isLate ? 'text-rose-600' : 'text-navy-700'}`}>
                            {new Date(iss.dueDate).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-navy-600">
                          {iss.renewalCount || 0} / {iss.maxRenewals || 2}
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge variant={isLate ? 'danger' : 'primary'}>
                            {isLate ? `${daysOverdue}d overdue` : 'Issued'}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="secondary"
                              size="sm"
                              className="text-[11px] h-7 px-2"
                              onClick={() => {
                                setQuickReturnIssue(iss);
                                setIsQuickReturnModalOpen(true);
                              }}
                            >
                              Return
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="text-[11px] h-7 px-2"
                              disabled={iss.renewalCount >= (iss.maxRenewals || 2)}
                              onClick={() => handleProcessRenew(iss._id)}
                            >
                              Renew
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No active circulation issues found"
              description="All loaned books have been returned or no checkouts match the current search."
            />
          )}
        </Card>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 8. OVERDUE BOOKS TAB */}
      {/* -------------------------------------------------------------------- */}
      {currentTab === 'overdue-books' && (
        <Card className="p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-rose-950 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Overdue Books & Accrued Fines Tracking
              </h3>
              <p className="text-xs text-navy-500 mt-0.5">
                Active loans that have passed their scheduled return due date. Standard overdue fine: ₹5 / day.
              </p>
            </div>
            <span className="text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
              {overdueIssues.length} Books Overdue
            </span>
          </div>

          {overdueIssues.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-rose-50/60 text-navy-700 font-bold border-b border-rose-200">
                  <tr>
                    <th className="py-2.5 px-3">Issue #</th>
                    <th className="py-2.5 px-3">Book Title</th>
                    <th className="py-2.5 px-3">Accession No</th>
                    <th className="py-2.5 px-3">Patron / Contact</th>
                    <th className="py-2.5 px-3">Due Date</th>
                    <th className="py-2.5 px-3">Days Late</th>
                    <th className="py-2.5 px-3">Accrued Fine</th>
                    <th className="py-2.5 px-3 text-right">Circulation Desk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {overdueIssues.map((iss) => {
                    const daysLate = calculateDaysOverdue(iss.dueDate);
                    const fineAmt = daysLate * 5;
                    return (
                      <tr key={iss._id} className="hover:bg-rose-50/30 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-navy-950">{iss.issueNumber}</td>
                        <td className="py-2.5 px-3 font-medium text-navy-900 max-w-xs truncate">
                          {iss.book?.title}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-indigo-700">
                          {iss.bookCopy?.accessionNumber}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-navy-950 block">{iss.user?.name}</span>
                          <span className="text-[10px] text-navy-500 block font-mono">{iss.user?.email}</span>
                        </td>
                        <td className="py-2.5 px-3 text-rose-700 font-medium">
                          {new Date(iss.dueDate).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge variant="danger">{daysLate} Days</Badge>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-rose-700">₹{fineAmt}</td>
                        <td className="py-2.5 px-3 text-right">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="text-[11px] h-7 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200"
                            onClick={() => {
                              setQuickReturnIssue(iss);
                              setIsQuickReturnModalOpen(true);
                            }}
                          >
                            Return Book
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No overdue books at this time"
              description="Great job! All patrons have returned or renewed their loans on time."
            />
          )}
        </Card>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 9. RESERVATIONS TAB */}
      {/* -------------------------------------------------------------------- */}
      {currentTab === 'reservations' && (
        <Card className="p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-navy-950 flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-indigo-600" />
                Book Reservation Queue
              </h3>
              <p className="text-xs text-navy-500 mt-0.5">
                Manage patron hold queues for high-demand titles according to library allocation policy.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={reservationStatusFilter}
                onChange={(e) => setReservationStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Requests' },
                  { value: 'pending', label: 'Pending Queue Only' },
                  { value: 'fulfilled', label: 'Fulfilled' },
                  { value: 'cancelled', label: 'Cancelled' }
                ]}
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchReservations}
                className="text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {reservations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-navy-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Book Title</th>
                    <th className="py-2.5 px-3">Patron Name</th>
                    <th className="py-2.5 px-3">Membership #</th>
                    <th className="py-2.5 px-3">Request Date</th>
                    <th className="py-2.5 px-3">Expiry Date</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reservations.map((res) => (
                    <tr key={res._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-navy-950">
                        {res.book?.title || 'Unknown Title'}
                      </td>
                      <td className="py-2.5 px-3 text-navy-800">{res.user?.name || 'Member'}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-navy-600">
                        {res.member?.membershipNumber || 'N/A'}
                      </td>
                      <td className="py-2.5 px-3 text-navy-600">
                        {new Date(res.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3 text-navy-600">
                        {res.expiryDate ? new Date(res.expiryDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge
                          variant={
                            res.status === 'pending'
                              ? 'warning'
                              : res.status === 'fulfilled'
                              ? 'success'
                              : 'secondary'
                          }
                        >
                          {res.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {res.status === 'pending' && (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="secondary"
                              size="sm"
                              className="text-[11px] h-7 px-2 text-rose-600 hover:bg-rose-50"
                              onClick={() => handleCancelReservation(res._id)}
                            >
                              Cancel Hold
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No book reservations found"
              description="There are currently no active reservations matching this status filter."
            />
          )}
        </Card>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 10. MEMBER SEARCH & DIRECTORY TAB */}
      {/* -------------------------------------------------------------------- */}
      {currentTab === 'members' && (
        <Card className="p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-navy-950 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                Library Patron Search & Circulation History
              </h3>
              <p className="text-xs text-navy-500 mt-0.5">
                Verify patron borrowing eligibility, view loan counts, and check outstanding fines.
              </p>
            </div>
            <span className="text-xs text-navy-500 font-semibold">{totalMembers} Registered Patrons</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Input
                placeholder="Search member by name, roll number, card number, or email..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                leftIcon={Search}
              />
            </div>
            <div>
              <Select
                value={memberRoleFilter}
                onChange={(e) => setMemberRoleFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Member Roles' },
                  { value: 'student', label: 'Students' },
                  { value: 'faculty', label: 'Faculty' }
                ]}
              />
            </div>
          </div>

          {members.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-navy-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Membership Number</th>
                    <th className="py-2.5 px-3">Member Name</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">Active Issues</th>
                    <th className="py-2.5 px-3">Fines Due</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Circulation Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {members.map((mem) => (
                    <tr key={mem._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">
                        {mem.membershipNumber}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-navy-950 block">{mem.user?.name || 'Member'}</span>
                        <span className="text-[10px] text-navy-400 block font-mono">{mem.user?.email}</span>
                      </td>
                      <td className="py-2.5 px-3 capitalize">
                        <Badge variant={mem.memberType === 'faculty' ? 'purple' : 'primary'}>
                          {mem.memberType}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-navy-700">{mem.department || 'General'}</td>
                      <td className="py-2.5 px-3 font-semibold text-navy-800">
                        {mem.currentBooksIssued ?? 0} / {mem.maxBooksAllowed || 3}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={(mem.totalFinesDue || 0) > 0 ? 'text-rose-600 font-bold' : 'text-teal-600'}>
                          ₹{mem.totalFinesDue || 0}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge variant={mem.status === 'active' ? 'success' : 'danger'}>
                          {mem.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="text-[11px] h-7 px-2.5"
                          onClick={() => handleViewMemberProfile(mem._id)}
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          View Profile
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No patrons found"
              description="Try adjusting your search criteria."
            />
          )}
        </Card>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 11. MY TRANSACTIONS TAB */}
      {/* -------------------------------------------------------------------- */}
      {currentTab === 'my-transactions' && (
        <Card className="p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-navy-950 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                My Desk Circulation History
              </h3>
              <p className="text-xs text-navy-500 mt-0.5">
                Audit trail of issues and returns processed under your staff credentials (<span className="font-semibold text-indigo-600">{user?.name}</span>).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={myTxFilter}
                onChange={(e) => setMyTxFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Operations' },
                  { value: 'issued', label: 'Issues Handled' },
                  { value: 'returned', label: 'Returns Handled' }
                ]}
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchMyTransactions}
                className="text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {myTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-navy-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Issue #</th>
                    <th className="py-2.5 px-3">Book Title</th>
                    <th className="py-2.5 px-3">Accession No</th>
                    <th className="py-2.5 px-3">Patron</th>
                    <th className="py-2.5 px-3">Issue Date</th>
                    <th className="py-2.5 px-3">Return Date</th>
                    <th className="py-2.5 px-3">Condition</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myTransactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-navy-950">{tx.issueNumber}</td>
                      <td className="py-2.5 px-3 font-medium text-navy-900 max-w-xs truncate">
                        {tx.book?.title}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-indigo-700">
                        {tx.bookCopy?.accessionNumber}
                      </td>
                      <td className="py-2.5 px-3 text-navy-800">
                        <span className="font-semibold block">{tx.user?.name}</span>
                        <span className="text-[10px] text-navy-400 font-mono">{tx.member?.membershipNumber}</span>
                      </td>
                      <td className="py-2.5 px-3 text-navy-600">
                        {new Date(tx.issueDate).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3 text-navy-600">
                        {tx.returnDate ? new Date(tx.returnDate).toLocaleDateString() : 'Active'}
                      </td>
                      <td className="py-2.5 px-3 capitalize text-navy-600">
                        {tx.bookCopy?.condition || 'good'}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge variant={tx.status === 'returned' ? 'success' : tx.status === 'overdue' ? 'danger' : 'primary'}>
                          {tx.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No staff transactions found"
              description="Transactions you process at the circulation desk will be automatically recorded here."
            />
          )}
        </Card>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 12. NOTIFICATIONS TAB */}
      {/* -------------------------------------------------------------------- */}
      {currentTab === 'notifications' && (
        <Card className="p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-200">
            <h3 className="text-sm font-bold text-navy-950 flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-600" />
              Library Staff Circulars & Operational Notices
            </h3>
            <p className="text-xs text-navy-500 mt-0.5">
              Important circulation policy notices, overdue reminders, and inventory guidelines.
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/30 flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Info className="w-4 h-4" />
              </div>
              <div className="text-xs text-navy-800 space-y-1">
                <h4 className="font-bold text-navy-950">Circulation Desk Standard Operating Procedure</h4>
                <p className="text-navy-600">
                  Please verify physical condition of all returning books before recording them in the system. Damaged books must have remarks noted and status set to 'damaged' to prevent re-issuing.
                </p>
                <span className="text-[10px] text-navy-400 block pt-1">Library Directorate • General Notice</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/40 flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="text-xs text-navy-800 space-y-1">
                <h4 className="font-bold text-navy-950">Overdue Follow-up Notice</h4>
                <p className="text-navy-600">
                  Staff members are requested to notify patrons with loans exceeding 7 days overdue. Automated overdue fines continue to accrue at ₹5 per calendar day.
                </p>
                <span className="text-[10px] text-navy-400 block pt-1">Circulation Division • Action Required</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/30 flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div className="text-xs text-navy-800 space-y-1">
                <h4 className="font-bold text-navy-950">Upcoming Book Fair & New Acquisition Holds</h4>
                <p className="text-navy-600">
                  Physical accessioning for new engineering and medical references is in progress. Check the 'Availability' tab for newly stamped copies.
                </p>
                <span className="text-[10px] text-navy-400 block pt-1">Acquisitions Section • Information</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 13. MY PROFILE TAB */}
      {/* -------------------------------------------------------------------- */}
      {currentTab === 'profile' && (
        <Card className="max-w-2xl mx-auto p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="pb-3 border-b border-slate-200">
            <h3 className="text-base font-bold text-navy-950 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-600" />
              Library Staff Profile & Permissions
            </h3>
            <p className="text-xs text-navy-500 mt-1">
              Authenticated credentials, assigned circulation desk, and operational access levels.
            </p>
          </div>

          <div className="flex items-center space-x-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl uppercase shadow-md">
              {user?.name?.slice(0, 2).toUpperCase() || 'LS'}
            </div>
            <div>
              <h4 className="text-base font-bold text-navy-950">{user?.name}</h4>
              <p className="text-xs text-navy-500 font-mono">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="primary">Role: Library Staff</Badge>
                <Badge variant="secondary">Central Institutional Library</Badge>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-navy-700">
              Assigned Responsibilities & Permissions
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg border border-emerald-100 bg-emerald-50/40 text-emerald-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Search catalog & inspect copy availability</span>
              </div>
              <div className="p-2.5 rounded-lg border border-emerald-100 bg-emerald-50/40 text-emerald-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Issue books to eligible students & faculty</span>
              </div>
              <div className="p-2.5 rounded-lg border border-emerald-100 bg-emerald-50/40 text-emerald-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Process book returns & record book condition</span>
              </div>
              <div className="p-2.5 rounded-lg border border-emerald-100 bg-emerald-50/40 text-emerald-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Renew loans within borrowing policy limits</span>
              </div>
              <div className="p-2.5 rounded-lg border border-emerald-100 bg-emerald-50/40 text-emerald-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Manage reservations & check hold queues</span>
              </div>
              <div className="p-2.5 rounded-lg border border-emerald-100 bg-emerald-50/40 text-emerald-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>View personal circulation audit transaction log</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-navy-700">
              Security & Policy Restrictions
            </h4>
            <div className="text-xs text-navy-600 space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <p className="flex items-center gap-2 text-rose-700 font-medium">
                <XCircle className="w-4 h-4 shrink-0" />
                Cannot alter library-wide settings or borrowing duration policies.
              </p>
              <p className="flex items-center gap-2 text-rose-700 font-medium">
                <XCircle className="w-4 h-4 shrink-0" />
                Cannot waive overdue fines (Librarian authorization required).
              </p>
              <p className="flex items-center gap-2 text-rose-700 font-medium">
                <XCircle className="w-4 h-4 shrink-0" />
                Cannot delete transaction audit logs or historical checkout records.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* QUICK RETURN MODAL */}
      {/* -------------------------------------------------------------------- */}
      <Modal
        isOpen={isQuickReturnModalOpen}
        onClose={() => {
          setIsQuickReturnModalOpen(false);
          setQuickReturnIssue(null);
        }}
        title="Circulation Desk: Quick Return"
      >
        {quickReturnIssue && (
          <form onSubmit={handleProcessQuickReturn} className="space-y-4">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
              <p className="font-bold text-navy-950">{quickReturnIssue.book?.title}</p>
              <p className="text-navy-500">
                Accession: <span className="font-mono text-indigo-700 font-semibold">{quickReturnIssue.bookCopy?.accessionNumber}</span>
              </p>
              <p className="text-navy-500">
                Patron: <span className="font-semibold text-navy-800">{quickReturnIssue.user?.name}</span> ({quickReturnIssue.member?.membershipNumber})
              </p>
            </div>

            <Select
              label="Book Condition"
              value={returnCondition}
              onChange={(e) => setReturnCondition(e.target.value)}
              options={[
                { value: 'good', label: 'Good - Standard condition' },
                { value: 'fair', label: 'Fair - Minor wear' },
                { value: 'damaged', label: 'Damaged - Needs repair' },
                { value: 'lost', label: 'Lost - Reported missing' }
              ]}
            />

            <Input
              label="Staff Remarks (Optional)"
              placeholder="Return remarks..."
              value={returnRemarks}
              onChange={(e) => setReturnRemarks(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => {
                  setIsQuickReturnModalOpen(false);
                  setQuickReturnIssue(null);
                }}
              >
                Cancel
              </Button>
              <Button variant="indigo" size="sm" type="submit" className="bg-indigo-600 text-white">
                Confirm Return
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* -------------------------------------------------------------------- */}
      {/* PATRON PROFILE & HISTORY MODAL */}
      {/* -------------------------------------------------------------------- */}
      <Modal
        isOpen={isMemberProfileModalOpen}
        onClose={() => {
          setIsMemberProfileModalOpen(false);
          setSelectedMemberProfile(null);
        }}
        title="Patron Circulation Profile"
        size="lg"
      >
        {selectedMemberProfile && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-navy-950">
                  {selectedMemberProfile.member?.user?.name || selectedMemberProfile.member?.membershipNumber}
                </h4>
                <p className="text-navy-500 font-mono text-[11px]">
                  Card: {selectedMemberProfile.member?.membershipCardNumber || selectedMemberProfile.member?.membershipNumber}
                </p>
              </div>
              <Badge variant={selectedMemberProfile.member?.status === 'active' ? 'success' : 'danger'}>
                {selectedMemberProfile.member?.status}
              </Badge>
            </div>

            <div>
              <h5 className="font-bold text-navy-950 mb-2">Active Loans ({selectedMemberProfile.activeIssues?.length || 0})</h5>
              {selectedMemberProfile.activeIssues && selectedMemberProfile.activeIssues.length > 0 ? (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {selectedMemberProfile.activeIssues.map((iss) => (
                    <div key={iss._id} className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-navy-900 block">{iss.book?.title}</span>
                        <span className="text-[10px] text-navy-500 font-mono">
                          Accession: {iss.bookCopy?.accessionNumber} • Due: {new Date(iss.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                      <Badge variant={calculateDaysOverdue(iss.dueDate) > 0 ? 'danger' : 'primary'}>
                        {calculateDaysOverdue(iss.dueDate) > 0 ? `${calculateDaysOverdue(iss.dueDate)}d late` : 'Active'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-navy-400 italic">No active loans currently checked out.</p>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsMemberProfileModalOpen(false);
                  setSelectedMemberProfile(null);
                }}
              >
                Close Profile
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LibraryStaffDashboard;

