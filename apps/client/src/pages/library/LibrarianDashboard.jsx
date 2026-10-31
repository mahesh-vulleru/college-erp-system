import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BookOpen,
  Users,
  Clock,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Search,
  Download,
  RefreshCw,
  FileText,
  Layers,
  ShieldCheck,
  CalendarCheck,
  RotateCw,
  Sparkles,
  Archive,
  Eye,
  Sliders,
  DollarSign
} from 'lucide-react';
import Card from '../../components/common/Card';
import StatWidget from '../../components/common/StatWidget';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import SimpleBarChart from '../../components/common/SimpleBarChart';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../api/apiClient';

export const LibrarianDashboard = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active tab syncing with URL query parameter: /library?tab=books, etc.
  const currentTab = searchParams.get('tab') || 'overview';
  const setActiveTab = (tab) => {
    if (tab === 'overview') {
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
  const [bookStatusFilter, setBookStatusFilter] = useState('');
  const [selectedBookForCopies, setSelectedBookForCopies] = useState(null);
  const [isCopiesModalOpen, setIsCopiesModalOpen] = useState(false);
  const [newCopiesCount, setNewCopiesCount] = useState(1);
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    isbn: '',
    publisher: '',
    publicationYear: new Date().getFullYear(),
    edition: '1st Edition',
    category: '',
    shelfLocation: '',
    copiesCount: 3,
    description: ''
  });

  // 3. Categories State
  const [categories, setCategories] = useState([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    code: '',
    description: ''
  });

  // 4. Members State
  const [members, setMembers] = useState([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [isMembersLoading, setIsMembersLoading] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberRoleFilter, setMemberRoleFilter] = useState('');
  const [selectedMemberDetails, setSelectedMemberDetails] = useState(null);
  const [isMemberDetailsModalOpen, setIsMemberDetailsModalOpen] = useState(false);
  const [isRegisterMemberModalOpen, setIsRegisterMemberModalOpen] = useState(false);
  const [memberForm, setMemberForm] = useState({
    name: '',
    email: '',
    role: 'student',
    department: 'Computer Science & Engineering',
    membershipCardNumber: '',
    rollNumber: '',
    employeeId: '',
    maxBooksAllowed: 3
  });

  // 5. Circulation State
  const [issues, setIssues] = useState([]);
  const [totalIssues, setTotalIssues] = useState(0);
  const [isIssuesLoading, setIsIssuesLoading] = useState(false);
  const [issueStatusFilter, setIssueStatusFilter] = useState('');
  const [issueSearch, setIssueSearch] = useState('');
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [issueForm, setIssueForm] = useState({
    membershipCardNumber: '',
    accessionNumber: '',
    dueDate: '',
    remarks: ''
  });
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnForm, setReturnForm] = useState({
    accessionNumber: '',
    condition: 'good',
    remarks: ''
  });

  // 6. Reservations State
  const [reservations, setReservations] = useState([]);
  const [isReservationsLoading, setIsReservationsLoading] = useState(false);

  // 7. Fines State
  const [fines, setFines] = useState([]);
  const [totalFines, setTotalFines] = useState(0);
  const [isFinesLoading, setIsFinesLoading] = useState(false);
  const [fineStatusFilter, setFineStatusFilter] = useState('');
  const [isPayFineModalOpen, setIsPayFineModalOpen] = useState(false);
  const [payFineForm, setPayFineForm] = useState({
    fineId: '',
    paymentMethod: 'cash',
    referenceNumber: '',
    remarks: ''
  });
  const [isWaiveFineModalOpen, setIsWaiveFineModalOpen] = useState(false);
  const [waiveFineForm, setWaiveFineForm] = useState({
    fineId: '',
    reason: ''
  });

  // 8. Digital Resources State
  const [digitalResources, setDigitalResources] = useState([]);
  const [isDigitalLoading, setIsDigitalLoading] = useState(false);
  const [isDigitalModalOpen, setIsDigitalModalOpen] = useState(false);
  const [digitalForm, setDigitalForm] = useState({
    title: '',
    author: '',
    category: '',
    resourceType: 'pdf',
    accessLevel: 'all',
    fileUrl: '',
    description: ''
  });

  // 9. Settings State
  const [settings, setSettings] = useState({
    finePerDay: 5,
    defaultLoanPeriodDays: 14,
    facultyLoanPeriodDays: 30,
    maxBooksAllowedStudent: 3,
    maxBooksAllowedFaculty: 6,
    maxRenewalsAllowed: 2
  });
  const [isSettingsLoading, setIsSettingsLoading] = useState(false);

  // --------------------------------------------------------------------------
  // Data Fetchers
  // --------------------------------------------------------------------------
  const fetchDashboard = useCallback(async () => {
    setIsDashboardLoading(true);
    try {
      const res = await api.getLibraryDashboard();
      if (res.success) {
        setDashboardData(res.data);
      }
    } catch (err) {
      console.error('Error fetching library dashboard:', err);
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
        status: bookStatusFilter,
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
  }, [bookSearch, bookCategoryFilter, bookStatusFilter]);

  const fetchCategories = useCallback(async () => {
    setIsCategoriesLoading(true);
    try {
      const res = await api.getBookCategories();
      if (res.success) {
        setCategories(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setIsCategoriesLoading(false);
    }
  }, []);

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
      console.error('Error fetching issues:', err);
    } finally {
      setIsIssuesLoading(false);
    }
  }, [issueStatusFilter, issueSearch]);

  const fetchReservations = useCallback(async () => {
    setIsReservationsLoading(true);
    try {
      const res = await api.getBookReservations({ limit: 100 });
      if (res.success) {
        setReservations(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching reservations:', err);
    } finally {
      setIsReservationsLoading(false);
    }
  }, []);

  const fetchFines = useCallback(async () => {
    setIsFinesLoading(true);
    try {
      const res = await api.getLibraryFines({
        status: fineStatusFilter,
        limit: 100
      });
      if (res.success) {
        setFines(res.data || []);
        setTotalFines(res.pagination?.total || (res.data || []).length);
      }
    } catch (err) {
      console.error('Error fetching fines:', err);
    } finally {
      setIsFinesLoading(false);
    }
  }, [fineStatusFilter]);

  const fetchDigitalResources = useCallback(async () => {
    setIsDigitalLoading(true);
    try {
      const res = await api.getDigitalResources({ limit: 100 });
      if (res.success) {
        setDigitalResources(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching digital resources:', err);
    } finally {
      setIsDigitalLoading(false);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    setIsSettingsLoading(true);
    try {
      const res = await api.getLibrarySettings();
      if (res.success && res.data) {
        setSettings(res.data);
      }
    } catch (err) {
      console.error('Error fetching library settings:', err);
    } finally {
      setIsSettingsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchDashboard();
    fetchCategories();
  }, [fetchDashboard, fetchCategories]);

  // Tab change trigger
  useEffect(() => {
    switch (currentTab) {
      case 'overview':
        fetchDashboard();
        break;
      case 'books':
        fetchBooks();
        fetchCategories();
        break;
      case 'categories':
        fetchCategories();
        break;
      case 'members':
        fetchMembers();
        break;
      case 'circulation':
        fetchIssues();
        break;
      case 'reservations':
        fetchReservations();
        break;
      case 'fines':
        fetchFines();
        break;
      case 'digital':
        fetchDigitalResources();
        break;
      case 'settings':
        fetchSettings();
        break;
      default:
        break;
    }
  }, [
    currentTab,
    fetchDashboard,
    fetchBooks,
    fetchCategories,
    fetchMembers,
    fetchIssues,
    fetchReservations,
    fetchFines,
    fetchDigitalResources,
    fetchSettings
  ]);

  // --------------------------------------------------------------------------
  // Action Handlers
  // --------------------------------------------------------------------------
  const handleCreateBook = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createBook(bookForm);
      if (res.success) {
        addToast('Book added successfully with physical copies', 'success');
        setIsAddBookModalOpen(false);
        setBookForm({
          title: '',
          author: '',
          isbn: '',
          publisher: '',
          publicationYear: new Date().getFullYear(),
          edition: '1st Edition',
          category: '',
          shelfLocation: '',
          copiesCount: 3,
          description: ''
        });
        fetchBooks();
        fetchDashboard();
      }
    } catch (err) {
      addToast(err.message || 'Failed to add book', 'error');
    }
  };

  const handleAddCopies = async (e) => {
    e.preventDefault();
    if (!selectedBookForCopies) return;
    try {
      const res = await api.addBookCopies(selectedBookForCopies._id, {
        count: Number(newCopiesCount)
      });
      if (res.success) {
        addToast(`Added ${newCopiesCount} new copies successfully`, 'success');
        setIsCopiesModalOpen(false);
        fetchBooks();
        fetchDashboard();
      }
    } catch (err) {
      addToast(err.message || 'Failed to add copies', 'error');
    }
  };

  const handleArchiveBook = async (book) => {
    if (!window.confirm(`Are you sure you want to archive "${book.title}"?`)) return;
    try {
      const res = await api.archiveBook(book._id);
      if (res.success) {
        addToast('Book archived successfully', 'success');
        fetchBooks();
        fetchDashboard();
      }
    } catch (err) {
      addToast(err.message || 'Failed to archive book', 'error');
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createBookCategory(categoryForm);
      if (res.success) {
        addToast('Category created successfully', 'success');
        setIsCategoryModalOpen(false);
        setCategoryForm({ name: '', code: '', description: '' });
        fetchCategories();
      }
    } catch (err) {
      addToast(err.message || 'Failed to create category', 'error');
    }
  };

  const handleRegisterMember = async (e) => {
    e.preventDefault();
    try {
      const res = await api.registerLibraryMember(memberForm);
      if (res.success) {
        addToast('Library member registered successfully', 'success');
        setIsRegisterMemberModalOpen(false);
        setMemberForm({
          name: '',
          email: '',
          role: 'student',
          department: 'Computer Science & Engineering',
          membershipCardNumber: '',
          rollNumber: '',
          employeeId: '',
          maxBooksAllowed: 3
        });
        fetchMembers();
        fetchDashboard();
      }
    } catch (err) {
      addToast(err.message || 'Failed to register member', 'error');
    }
  };

  const handleViewMemberDetails = async (memberId) => {
    try {
      const res = await api.getLibraryMemberDetails(memberId);
      if (res.success) {
        setSelectedMemberDetails(res.data);
        setIsMemberDetailsModalOpen(true);
      }
    } catch (err) {
      addToast(err.message || 'Failed to load member profile', 'error');
    }
  };

  const handleIssueBook = async (e) => {
    e.preventDefault();
    try {
      const res = await api.issueBook(issueForm);
      if (res.success) {
        addToast('Book issued successfully', 'success');
        setIsIssueModalOpen(false);
        setIssueForm({
          membershipCardNumber: '',
          accessionNumber: '',
          dueDate: '',
          remarks: ''
        });
        fetchIssues();
        fetchDashboard();
      }
    } catch (err) {
      addToast(err.message || 'Failed to issue book', 'error');
    }
  };

  const handleReturnBook = async (e) => {
    e.preventDefault();
    try {
      const res = await api.returnBook(returnForm);
      if (res.success) {
        if (res.data?.fine && res.data.fine.amount > 0) {
          addToast(
            `Book returned. Overdue fine of ₹${res.data.fine.amount} accrued (${res.data.fine.daysOverdue} days late).`,
            'warning'
          );
        } else {
          addToast('Book returned in good condition', 'success');
        }
        setIsReturnModalOpen(false);
        setReturnForm({ accessionNumber: '', condition: 'good', remarks: '' });
        fetchIssues();
        fetchDashboard();
      }
    } catch (err) {
      addToast(err.message || 'Failed to return book', 'error');
    }
  };

  const handleRenewBook = async (issueId) => {
    try {
      const res = await api.renewBook({ issueId });
      if (res.success) {
        addToast(
          `Book renewed successfully. New due date: ${new Date(res.data.dueDate).toLocaleDateString()}`,
          'success'
        );
        fetchIssues();
        fetchDashboard();
      }
    } catch (err) {
      addToast(err.message || 'Failed to renew book', 'error');
    }
  };

  const handleCancelReservation = async (resId) => {
    if (!window.confirm('Cancel this reservation?')) return;
    try {
      const res = await api.cancelBookReservation(resId);
      if (res.success) {
        addToast('Reservation cancelled', 'success');
        fetchReservations();
        fetchDashboard();
      }
    } catch (err) {
      addToast(err.message || 'Failed to cancel reservation', 'error');
    }
  };

  const handlePayFine = async (e) => {
    e.preventDefault();
    try {
      const res = await api.payLibraryFine(payFineForm);
      if (res.success) {
        addToast('Fine payment recorded successfully', 'success');
        setIsPayFineModalOpen(false);
        setPayFineForm({ fineId: '', paymentMethod: 'cash', referenceNumber: '', remarks: '' });
        fetchFines();
        fetchDashboard();
      }
    } catch (err) {
      addToast(err.message || 'Failed to record fine payment', 'error');
    }
  };

  const handleWaiveFine = async (e) => {
    e.preventDefault();
    try {
      const res = await api.waiveLibraryFine(waiveFineForm);
      if (res.success) {
        addToast('Fine waived and audit entry logged', 'success');
        setIsWaiveFineModalOpen(false);
        setWaiveFineForm({ fineId: '', reason: '' });
        fetchFines();
        fetchDashboard();
      }
    } catch (err) {
      addToast(err.message || 'Failed to waive fine', 'error');
    }
  };

  const handleCreateDigital = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createDigitalResource(digitalForm);
      if (res.success) {
        addToast('Digital resource cataloged successfully', 'success');
        setIsDigitalModalOpen(false);
        setDigitalForm({
          title: '',
          author: '',
          category: '',
          resourceType: 'pdf',
          accessLevel: 'all',
          fileUrl: '',
          description: ''
        });
        fetchDigitalResources();
      }
    } catch (err) {
      addToast(err.message || 'Failed to add digital resource', 'error');
    }
  };

  const handleDownloadDigital = async (resource) => {
    try {
      await api.recordDigitalDownload(resource._id);
      window.open(resource.fileUrl, '_blank');
      fetchDigitalResources();
    } catch (err) {
      console.error(err);
      window.open(resource.fileUrl, '_blank');
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await api.updateLibrarySettings(settings);
      if (res.success) {
        addToast('Library rules & settings updated', 'success');
        fetchSettings();
      }
    } catch (err) {
      addToast(err.message || 'Failed to update settings', 'error');
    }
  };

  const handleExportCsv = async (type) => {
    try {
      addToast(`Generating ${type} report...`, 'info');
      await api.downloadLibraryReport(type);
      addToast(`${type.toUpperCase()} report exported successfully`, 'success');
    } catch (err) {
      addToast(err.message || 'Failed to export CSV report', 'error');
    }
  };

  // --------------------------------------------------------------------------
  // Monthly Trends Chart Data Preparation
  // --------------------------------------------------------------------------
  const monthlyChartData = useMemo(() => {
    if (!dashboardData?.monthlyTrends || dashboardData.monthlyTrends.length === 0) {
      return [
        { label: 'May', value: 12, value2: 10 },
        { label: 'Jun', value: 18, value2: 15 },
        { label: 'Jul', value: 24, value2: 20 },
        { label: 'Aug', value: 35, value2: 28 },
        { label: 'Sep', value: 42, value2: 36 },
        { label: 'Oct', value: 50, value2: 44 }
      ];
    }
    return dashboardData.monthlyTrends.map((t) => ({
      label: t.label,
      value: t.issues || 0,
      value2: t.returns || 0
    }));
  }, [dashboardData]);

  // Tab Navigation Definitions
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'books', label: 'Book Catalog', icon: Layers },
    { id: 'categories', label: 'Categories', icon: Layers },
    { id: 'circulation', label: 'Circulation Desk', icon: Clock },
    { id: 'reservations', label: 'Reservations', icon: CalendarCheck },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'fines', label: 'Overdue & Fines', icon: CreditCard },
    { id: 'digital', label: 'Digital Library', icon: FileText },
    { id: 'reports', label: 'Reports & Exports', icon: Download },
    { id: 'settings', label: 'Settings', icon: Sliders }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header Banner matching Burgundy & Rose theme */}
      <div className="bg-gradient-to-r from-[#230914] via-[#380e21] to-[#1d0610] text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-rose-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-rose-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-rose-300 text-xs font-semibold tracking-wider uppercase mb-1">
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span>Central Library Services • Apex Engineering</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Central Library Management System
            </h1>
            <p className="text-rose-200/80 text-xs sm:text-sm mt-1 max-w-2xl font-light">
              End-to-end physical inventory, accession barcode tracking, circulation desk, patron
              services, digital resources, and fine audit ledgers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchDashboard();
                if (currentTab === 'books') fetchBooks();
                if (currentTab === 'circulation') fetchIssues();
                if (currentTab === 'members') fetchMembers();
                if (currentTab === 'fines') fetchFines();
              }}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsIssueModalOpen(true)}
              className="bg-rose-600 hover:bg-rose-700 text-white border-none shadow-md shadow-rose-900/40 text-xs"
            >
              <Clock className="w-3.5 h-3.5 mr-1.5" />
              Issue Book
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsReturnModalOpen(true)}
              className="bg-white/20 hover:bg-white/30 text-white border-none text-xs"
            >
              <RotateCw className="w-3.5 h-3.5 mr-1.5" />
              Return Book
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddBookModalOpen(true)}
              className="bg-rose-700 hover:bg-rose-800 text-white border-none text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add Book
            </Button>
          </div>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex items-center space-x-1.5 overflow-x-auto mt-6 pt-4 border-t border-rose-900/40 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-950/50'
                    : 'text-rose-200/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          TAB 1: OVERVIEW DASHBOARD
      ========================================================================= */}
      {currentTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metric Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
            <StatWidget
              title="Total Titles"
              value={dashboardData?.summary?.totalTitles ?? '...'}
              subtitle="Unique Books"
              icon={BookOpen}
              color="rose"
            />
            <StatWidget
              title="Physical Copies"
              value={dashboardData?.summary?.totalCopies ?? '...'}
              subtitle="All Volumes"
              icon={Layers}
              color="indigo"
            />
            <StatWidget
              title="Available"
              value={dashboardData?.summary?.availableCopies ?? '...'}
              subtitle="On Shelf"
              icon={CheckCircle}
              color="emerald"
            />
            <StatWidget
              title="Issued"
              value={dashboardData?.summary?.issuedCopies ?? '...'}
              subtitle="Checked Out"
              icon={Clock}
              color="blue"
            />
            <StatWidget
              title="Overdue"
              value={dashboardData?.summary?.overdueIssues ?? '...'}
              subtitle="Late Returns"
              icon={AlertTriangle}
              color="rose"
            />
            <StatWidget
              title="Members"
              value={dashboardData?.summary?.totalMembers ?? '...'}
              subtitle="Active Patrons"
              icon={Users}
              color="teal"
            />
            <StatWidget
              title="Unpaid Fines"
              value={`₹${dashboardData?.summary?.unpaidFinesTotal ?? 0}`}
              subtitle="Pending Dues"
              icon={DollarSign}
              color="amber"
            />
          </div>

          {/* Real-time Circulation Charts & Popular Books */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 p-5" title="Circulation Trends (Last 6 Months)">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 font-normal">
                  Comparison of monthly book issues against processed returns
                </span>
                <div className="flex items-center space-x-3 text-xs">
                  <div className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                    <span className="text-slate-600 font-medium">Issues</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
                    <span className="text-slate-600 font-medium">Returns</span>
                  </div>
                </div>
              </div>
              <SimpleBarChart
                data={monthlyChartData}
                isGrouped={true}
                seriesNames={['Issues', 'Returns']}
                barColor="bg-rose-500"
                barColor2="bg-amber-400"
                height={160}
              />
            </Card>

            <Card className="p-5" title="Most Popular Books">
              <p className="text-xs text-slate-500 mb-3">Top borrowed titles this academic term</p>
              <div className="space-y-3">
                {dashboardData?.popularBooks && dashboardData.popularBooks.length > 0 ? (
                  dashboardData.popularBooks.map((b, idx) => (
                    <div
                      key={b._id || idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-rose-50/50 transition-colors border border-slate-100"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-bold text-slate-900 truncate">{b.title}</p>
                        <p className="text-[11px] text-slate-500 truncate">{b.author}</p>
                      </div>
                      <Badge variant="primary" className="bg-rose-100 text-rose-700 text-[10px]">
                        {b.borrowCount} issues
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-xs text-slate-400">
                    No circulation activity recorded yet
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Urgent Overdue Alerts Section */}
          <Card
            className="p-5 border-rose-200 bg-rose-50/30"
            title="Urgent Overdue Alerts"
            badge={
              <Badge variant="danger" className="text-xs">
                {dashboardData?.overdueList?.length || 0} Critical
              </Badge>
            }
          >
            <p className="text-xs text-slate-600 mb-3">
              Patrons with overdue books exceeding loan periods. Automatic fines are accruing daily.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-rose-100/60 text-[11px] text-rose-900 font-semibold uppercase">
                  <tr>
                    <th className="px-3 py-2">Accession #</th>
                    <th className="px-3 py-2">Book Title</th>
                    <th className="px-3 py-2">Borrower</th>
                    <th className="px-3 py-2">Card / Roll #</th>
                    <th className="px-3 py-2">Due Date</th>
                    <th className="px-3 py-2">Days Late</th>
                    <th className="px-3 py-2">Estimated Fine</th>
                    <th className="px-3 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-100">
                  {dashboardData?.overdueList && dashboardData.overdueList.length > 0 ? (
                    dashboardData.overdueList.map((item) => (
                      <tr key={item._id} className="hover:bg-rose-50 transition-colors">
                        <td className="px-3 py-2.5 font-mono font-medium text-rose-900">
                          {item.bookCopy?.accessionNumber || '—'}
                        </td>
                        <td className="px-3 py-2.5 font-semibold text-slate-900 max-w-[200px] truncate">
                          {item.book?.title}
                        </td>
                        <td className="px-3 py-2.5">{item.member?.name}</td>
                        <td className="px-3 py-2.5 font-mono text-slate-600">
                          {item.member?.membershipCardNumber || item.member?.rollNumber}
                        </td>
                        <td className="px-3 py-2.5 text-rose-700 font-medium">
                          {new Date(item.dueDate).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-2.5 font-bold text-rose-700">
                          {item.daysOverdue} days
                        </td>
                        <td className="px-3 py-2.5 font-bold text-slate-900">
                          ₹{item.estimatedFine}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setReturnForm({
                                accessionNumber: item.bookCopy?.accessionNumber || '',
                                condition: 'good',
                                remarks: 'Returned via Overdue Action'
                              });
                              setIsReturnModalOpen(true);
                            }}
                            className="text-[11px] py-1 px-2.5 bg-rose-600 hover:bg-rose-700 text-white border-none"
                          >
                            Process Return
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="text-center py-6 text-slate-500 text-xs">
                        No overdue books! All active loans are currently within their loan period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Recent Circulation Transactions Table */}
          <Card className="p-5" title="Recent Circulation Activity">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] text-slate-600 font-semibold uppercase">
                  <tr>
                    <th className="px-3 py-2.5">Issue #</th>
                    <th className="px-3 py-2.5">Book Title</th>
                    <th className="px-3 py-2.5">Accession #</th>
                    <th className="px-3 py-2.5">Borrower</th>
                    <th className="px-3 py-2.5">Issue Date</th>
                    <th className="px-3 py-2.5">Due Date</th>
                    <th className="px-3 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 ? (
                    dashboardData.recentActivity.map((act) => (
                      <tr key={act._id} className="hover:bg-slate-50/70">
                        <td className="px-3 py-2.5 font-mono text-slate-600">
                          {act.issueNumber || act._id.slice(-6)}
                        </td>
                        <td className="px-3 py-2.5 font-semibold text-slate-900 max-w-[220px] truncate">
                          {act.book?.title}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-rose-800">
                          {act.bookCopy?.accessionNumber}
                        </td>
                        <td className="px-3 py-2.5">{act.member?.name}</td>
                        <td className="px-3 py-2.5 text-slate-500">
                          {new Date(act.issueDate).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-2.5 text-slate-500">
                          {new Date(act.dueDate).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge
                            variant={
                              act.status === 'returned'
                                ? 'success'
                                : act.status === 'overdue'
                                ? 'danger'
                                : 'primary'
                            }
                            className="text-[10px] capitalize"
                          >
                            {act.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-6 text-slate-400 text-xs">
                        No transactions recorded yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* =========================================================================
          TAB 2: BOOK CATALOG & PHYSICAL COPIES
      ========================================================================= */}
      {currentTab === 'books' && (
        <div className="space-y-4">
          <Card className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={bookSearch}
                    onChange={(e) => setBookSearch(e.target.value)}
                    placeholder="Search by title, author, ISBN..."
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-rose-500"
                  />
                </div>
                <select
                  value={bookCategoryFilter}
                  onChange={(e) => setBookCategoryFilter(e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white"
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <select
                  value={bookStatusFilter}
                  onChange={(e) => setBookStatusFilter(e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddBookModalOpen(true)}
                className="bg-rose-600 hover:bg-rose-700 text-white border-none w-full sm:w-auto text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add New Book
              </Button>
            </div>

            <Table
              isLoading={isBooksLoading}
              data={books}
              columns={[
                {
                  header: 'Title & Author',
                  render: (row) => (
                    <div>
                      <div className="font-bold text-slate-900">{row.title}</div>
                      <div className="text-[11px] text-slate-500">By {row.author}</div>
                    </div>
                  )
                },
                {
                  header: 'ISBN / Publisher',
                  render: (row) => (
                    <div className="text-xs">
                      <span className="font-mono text-slate-700">{row.isbn || '—'}</span>
                      <div className="text-[11px] text-slate-400">
                        {row.publisher} ({row.publicationYear})
                      </div>
                    </div>
                  )
                },
                {
                  header: 'Category',
                  render: (row) => (
                    <Badge variant="teal" className="text-[11px]">
                      {row.category?.name || 'General'}
                    </Badge>
                  )
                },
                {
                  header: 'Shelf / Location',
                  render: (row) => (
                    <span className="text-xs font-mono text-slate-600">
                      {row.shelfLocation || 'Main Stack'}
                    </span>
                  )
                },
                {
                  header: 'Copies (Avail/Total)',
                  render: (row) => (
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-emerald-700 text-xs">
                        {row.availableCopiesCount ?? row.availableCopies}
                      </span>
                      <span className="text-slate-400 text-xs">/</span>
                      <span className="font-semibold text-slate-800 text-xs">
                        {row.copiesCount ?? row.totalCopies}
                      </span>
                    </div>
                  )
                },
                {
                  header: 'Status',
                  render: (row) => (
                    <Badge
                      variant={row.status === 'active' ? 'success' : 'neutral'}
                      className="text-[10px] capitalize"
                    >
                      {row.status}
                    </Badge>
                  )
                },
                {
                  header: 'Actions',
                  render: (row) => (
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedBookForCopies(row);
                          setIsCopiesModalOpen(true);
                        }}
                        className="text-[11px] py-1 px-2 text-rose-700 border-rose-200 hover:bg-rose-50"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Copies
                      </Button>
                      <button
                        onClick={() => handleArchiveBook(row)}
                        title="Archive book"
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )
                }
              ]}
              emptyMessage="No books matching criteria found in library catalog"
            />
          </Card>
        </div>
      )}

      {/* =========================================================================
          TAB 3: CATEGORIES
      ========================================================================= */}
      {currentTab === 'categories' && (
        <div className="space-y-4">
          <Card className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Library Classification Categories</h3>
                <p className="text-xs text-slate-500">
                  Organize books by academic engineering disciplines and classification codes
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCategoryModalOpen(true)}
                className="bg-rose-600 hover:bg-rose-700 text-white border-none text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Category
              </Button>
            </div>

            <Table
              isLoading={isCategoriesLoading}
              data={categories}
              columns={[
                {
                  header: 'Category Name',
                  render: (row) => <span className="font-bold text-slate-900">{row.name}</span>
                },
                {
                  header: 'Classification Code',
                  render: (row) => (
                    <Badge variant="primary" className="font-mono text-xs">
                      {row.code}
                    </Badge>
                  )
                },
                {
                  header: 'Description',
                  render: (row) => (
                    <span className="text-xs text-slate-600">{row.description || '—'}</span>
                  )
                },
                {
                  header: 'Books Count',
                  render: (row) => (
                    <span className="text-xs font-semibold text-slate-800">
                      {row.bookCount ?? '—'}
                    </span>
                  )
                }
              ]}
              emptyMessage="No library categories created yet"
            />
          </Card>
        </div>
      )}

      {/* =========================================================================
          TAB 4: CIRCULATION DESK (ISSUES, RETURNS, RENEWALS)
      ========================================================================= */}
      {currentTab === 'circulation' && (
        <div className="space-y-4">
          <Card className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={issueSearch}
                    onChange={(e) => setIssueSearch(e.target.value)}
                    placeholder="Search by issue #, member, accession..."
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-rose-500"
                  />
                </div>
                <select
                  value={issueStatusFilter}
                  onChange={(e) => setIssueStatusFilter(e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white"
                >
                  <option value="">All Circulation Statuses</option>
                  <option value="issued">Active Loans</option>
                  <option value="returned">Returned</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsIssueModalOpen(true)}
                  className="bg-rose-600 hover:bg-rose-700 text-white border-none text-xs flex-1 sm:flex-initial"
                >
                  <Clock className="w-3.5 h-3.5 mr-1" />
                  Issue Book
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsReturnModalOpen(true)}
                  className="bg-slate-800 hover:bg-slate-900 text-white border-none text-xs flex-1 sm:flex-initial"
                >
                  <RotateCw className="w-3.5 h-3.5 mr-1" />
                  Return Book
                </Button>
              </div>
            </div>

            <Table
              isLoading={isIssuesLoading}
              data={issues}
              columns={[
                {
                  header: 'Issue Number',
                  render: (row) => (
                    <span className="font-mono text-xs font-bold text-slate-800">
                      {row.issueNumber}
                    </span>
                  )
                },
                {
                  header: 'Book & Accession',
                  render: (row) => (
                    <div>
                      <div className="font-semibold text-slate-900">{row.book?.title}</div>
                      <div className="font-mono text-[11px] text-rose-700">
                        {row.bookCopy?.accessionNumber}
                      </div>
                    </div>
                  )
                },
                {
                  header: 'Borrower / Patron',
                  render: (row) => (
                    <div>
                      <div className="font-medium text-slate-900">{row.member?.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {row.member?.membershipCardNumber} • {row.member?.role}
                      </div>
                    </div>
                  )
                },
                {
                  header: 'Issue & Due Dates',
                  render: (row) => (
                    <div className="text-xs">
                      <div>Issued: {new Date(row.issueDate).toLocaleDateString()}</div>
                      <div
                        className={
                          row.status === 'overdue'
                            ? 'text-rose-600 font-bold'
                            : 'text-slate-500 font-medium'
                        }
                      >
                        Due: {new Date(row.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                  )
                },
                {
                  header: 'Renewals',
                  render: (row) => (
                    <span className="text-xs font-semibold text-slate-700">
                      {row.renewCount || 0} times
                    </span>
                  )
                },
                {
                  header: 'Status',
                  render: (row) => (
                    <Badge
                      variant={
                        row.status === 'returned'
                          ? 'success'
                          : row.status === 'overdue'
                          ? 'danger'
                          : 'primary'
                      }
                      className="text-[10px] capitalize"
                    >
                      {row.status}
                    </Badge>
                  )
                },
                {
                  header: 'Actions',
                  render: (row) => (
                    <div className="flex items-center space-x-1.5">
                      {row.status !== 'returned' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRenewBook(row._id)}
                            className="text-[10px] py-1 px-2 border-slate-200"
                          >
                            Renew
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setReturnForm({
                                accessionNumber: row.bookCopy?.accessionNumber || '',
                                condition: 'good',
                                remarks: ''
                              });
                              setIsReturnModalOpen(true);
                            }}
                            className="text-[10px] py-1 px-2 bg-rose-600 hover:bg-rose-700 text-white border-none"
                          >
                            Return
                          </Button>
                        </>
                      )}
                    </div>
                  )
                }
              ]}
              emptyMessage="No circulation issue records found"
            />
          </Card>
        </div>
      )}

      {/* =========================================================================
          TAB 5: RESERVATIONS
      ========================================================================= */}
      {currentTab === 'reservations' && (
        <div className="space-y-4">
          <Card className="p-4 sm:p-5">
            <div className="mb-4">
              <h3 className="font-bold text-slate-900 text-sm">Book Reservation Queue</h3>
              <p className="text-xs text-slate-500">
                Hold requests submitted by patrons for books currently checked out
              </p>
            </div>

            <Table
              isLoading={isReservationsLoading}
              data={reservations}
              columns={[
                {
                  header: 'Reservation Code',
                  render: (row) => (
                    <span className="font-mono text-xs font-bold text-slate-800">
                      {row.reservationCode || row._id.slice(-6)}
                    </span>
                  )
                },
                {
                  header: 'Book Requested',
                  render: (row) => (
                    <div>
                      <div className="font-semibold text-slate-900">{row.book?.title}</div>
                      <div className="text-[11px] text-slate-500">By {row.book?.author}</div>
                    </div>
                  )
                },
                {
                  header: 'Patron',
                  render: (row) => (
                    <div>
                      <div className="font-medium text-slate-900">{row.member?.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {row.member?.membershipCardNumber}
                      </div>
                    </div>
                  )
                },
                {
                  header: 'Queue Priority',
                  render: (row) => (
                    <Badge variant="neutral" className="text-xs">
                      #{row.priority || 1} in queue
                    </Badge>
                  )
                },
                {
                  header: 'Status',
                  render: (row) => (
                    <Badge
                      variant={
                        row.status === 'available'
                          ? 'success'
                          : row.status === 'fulfilled'
                          ? 'teal'
                          : row.status === 'cancelled'
                          ? 'neutral'
                          : 'warning'
                      }
                      className="text-[10px] capitalize"
                    >
                      {row.status}
                    </Badge>
                  )
                },
                {
                  header: 'Actions',
                  render: (row) => (
                    <div>
                      {row.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancelReservation(row._id)}
                          className="text-[10px] py-1 px-2 text-rose-600 border-rose-200"
                        >
                          Cancel Hold
                        </Button>
                      )}
                    </div>
                  )
                }
              ]}
              emptyMessage="No book reservation requests in queue"
            />
          </Card>
        </div>
      )}

      {/* =========================================================================
          TAB 6: LIBRARY MEMBERS
      ========================================================================= */}
      {currentTab === 'members' && (
        <div className="space-y-4">
          <Card className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Search by name, card #, roll #..."
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-rose-500"
                  />
                </div>
                <select
                  value={memberRoleFilter}
                  onChange={(e) => setMemberRoleFilter(e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white"
                >
                  <option value="">All Patron Roles</option>
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                </select>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsRegisterMemberModalOpen(true)}
                className="bg-rose-600 hover:bg-rose-700 text-white border-none w-full sm:w-auto text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Register Member
              </Button>
            </div>

            <Table
              isLoading={isMembersLoading}
              data={members}
              columns={[
                {
                  header: 'Patron Details',
                  render: (row) => (
                    <div>
                      <div className="font-bold text-slate-900">{row.name}</div>
                      <div className="text-[11px] text-slate-500">{row.email}</div>
                    </div>
                  )
                },
                {
                  header: 'Library Card #',
                  render: (row) => (
                    <span className="font-mono text-xs font-semibold text-rose-800">
                      {row.membershipCardNumber}
                    </span>
                  )
                },
                {
                  header: 'Role / Department',
                  render: (row) => (
                    <div className="text-xs">
                      <Badge
                        variant={row.role === 'faculty' ? 'primary' : 'teal'}
                        className="text-[10px] capitalize mb-0.5"
                      >
                        {row.role}
                      </Badge>
                      <div className="text-[11px] text-slate-500">{row.department}</div>
                    </div>
                  )
                },
                {
                  header: 'Active / Max Allowed',
                  render: (row) => (
                    <div className="text-xs font-semibold">
                      <span
                        className={
                          (row.activeIssuesCount || 0) >= (row.maxBooksAllowed || 3)
                            ? 'text-rose-600'
                            : 'text-slate-800'
                        }
                      >
                        {row.activeIssuesCount || 0}
                      </span>
                      <span className="text-slate-400"> / {row.maxBooksAllowed || 3} books</span>
                    </div>
                  )
                },
                {
                  header: 'Status',
                  render: (row) => (
                    <Badge
                      variant={row.status === 'active' ? 'success' : 'neutral'}
                      className="text-[10px] capitalize"
                    >
                      {row.status}
                    </Badge>
                  )
                },
                {
                  header: 'Actions',
                  render: (row) => (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewMemberDetails(row._id)}
                      className="text-[11px] py-1 px-2.5 text-rose-700 border-rose-200 hover:bg-rose-50"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View Profile
                    </Button>
                  )
                }
              ]}
              emptyMessage="No library members registered"
            />
          </Card>
        </div>
      )}

      {/* =========================================================================
          TAB 7: OVERDUE & FINE MANAGEMENT
      ========================================================================= */}
      {currentTab === 'fines' && (
        <div className="space-y-4">
          <Card className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Overdue Fines & Waivers Ledger</h3>
                <p className="text-xs text-slate-500">
                  Track automatic overdue fine accruals, record student/faculty payments, and perform
                  authorized fee waivers.
                </p>
              </div>

              <select
                value={fineStatusFilter}
                onChange={(e) => setFineStatusFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white"
              >
                <option value="">All Fine Statuses</option>
                <option value="unpaid">Unpaid / Outstanding</option>
                <option value="paid">Paid</option>
                <option value="waived">Waived</option>
              </select>
            </div>

            <Table
              isLoading={isFinesLoading}
              data={fines}
              columns={[
                {
                  header: 'Patron',
                  render: (row) => (
                    <div>
                      <div className="font-bold text-slate-900">{row.member?.name}</div>
                      <div className="font-mono text-[11px] text-slate-500">
                        {row.member?.membershipCardNumber}
                      </div>
                    </div>
                  )
                },
                {
                  header: 'Related Book & Issue',
                  render: (row) => (
                    <div>
                      <div className="font-medium text-slate-900">{row.book?.title}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Issue #{row.issue?.issueNumber}
                      </div>
                    </div>
                  )
                },
                {
                  header: 'Days Late',
                  render: (row) => (
                    <span className="text-xs font-semibold text-rose-600">
                      {row.daysOverdue} days
                    </span>
                  )
                },
                {
                  header: 'Amount',
                  render: (row) => (
                    <span className="font-bold text-slate-900 text-xs">₹{row.amount}</span>
                  )
                },
                {
                  header: 'Status',
                  render: (row) => (
                    <Badge
                      variant={
                        row.status === 'paid'
                          ? 'success'
                          : row.status === 'waived'
                          ? 'teal'
                          : 'danger'
                      }
                      className="text-[10px] capitalize"
                    >
                      {row.status}
                    </Badge>
                  )
                },
                {
                  header: 'Actions',
                  render: (row) => (
                    <div className="flex items-center space-x-1.5">
                      {row.status === 'unpaid' && (
                        <>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => {
                              setPayFineForm({
                                fineId: row._id,
                                paymentMethod: 'cash',
                                referenceNumber: '',
                                remarks: ''
                              });
                              setIsPayFineModalOpen(true);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] py-1 px-2 border-none"
                          >
                            Collect
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setWaiveFineForm({ fineId: row._id, reason: '' });
                              setIsWaiveFineModalOpen(true);
                            }}
                            className="text-[10px] py-1 px-2 text-rose-700 border-rose-200"
                          >
                            Waive
                          </Button>
                        </>
                      )}
                      {row.status === 'waived' && (
                        <span className="text-[10px] text-slate-400 italic">
                          Waived: {row.waiverReason}
                        </span>
                      )}
                    </div>
                  )
                }
              ]}
              emptyMessage="No library fine records found"
            />
          </Card>
        </div>
      )}

      {/* =========================================================================
          TAB 8: DIGITAL LIBRARY RESOURCES
      ========================================================================= */}
      {currentTab === 'digital' && (
        <div className="space-y-4">
          <Card className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Digital Learning Repository & E-Books
                </h3>
                <p className="text-xs text-slate-500">
                  Open-access e-books, lecture slides, syllabus reference PDFs, and research journals
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsDigitalModalOpen(true)}
                className="bg-rose-600 hover:bg-rose-700 text-white border-none text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Upload Resource
              </Button>
            </div>

            <Table
              isLoading={isDigitalLoading}
              data={digitalResources}
              columns={[
                {
                  header: 'Title & Author',
                  render: (row) => (
                    <div>
                      <div className="font-bold text-slate-900">{row.title}</div>
                      <div className="text-[11px] text-slate-500">By {row.author}</div>
                    </div>
                  )
                },
                {
                  header: 'Category',
                  render: (row) => (
                    <Badge variant="teal" className="text-[10px]">
                      {row.category?.name || 'General'}
                    </Badge>
                  )
                },
                {
                  header: 'Format',
                  render: (row) => (
                    <Badge variant="neutral" className="uppercase font-mono text-[10px]">
                      {row.resourceType}
                    </Badge>
                  )
                },
                {
                  header: 'Downloads',
                  render: (row) => (
                    <span className="text-xs font-semibold text-slate-700">
                      {row.downloadCount || 0} times
                    </span>
                  )
                },
                {
                  header: 'Access Level',
                  render: (row) => (
                    <span className="text-xs text-slate-500 capitalize">{row.accessLevel}</span>
                  )
                },
                {
                  header: 'Download Link',
                  render: (row) => (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadDigital(row)}
                      className="text-[11px] py-1 px-2.5 text-rose-700 border-rose-200 hover:bg-rose-50"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Access File
                    </Button>
                  )
                }
              ]}
              emptyMessage="No digital resources cataloged yet"
            />
          </Card>
        </div>
      )}

      {/* =========================================================================
          TAB 9: REPORTS & EXPORTS
      ========================================================================= */}
      {currentTab === 'reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Card className="p-5 border-slate-200 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Book Inventory Report</h4>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  Full list of all books, authors, ISBNs, physical accession counts, and current shelf
                  availability.
                </p>
              </div>
              <Button
                variant="primary"
                onClick={() => handleExportCsv('inventory')}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white text-xs"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Export Inventory CSV
              </Button>
            </Card>

            <Card className="p-5 border-slate-200 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                  <Clock className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Circulation History Ledger</h4>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  Audit report of all book issues, loan duration, returns, patron IDs, and renewal
                  counts.
                </p>
              </div>
              <Button
                variant="primary"
                onClick={() => handleExportCsv('circulation')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Export Circulation CSV
              </Button>
            </Card>

            <Card className="p-5 border-slate-200 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Fines & Waivers Audit Report</h4>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  Comprehensive ledger of collected overdue fines, outstanding amounts, and approved
                  waiver audit reasons.
                </p>
              </div>
              <Button
                variant="primary"
                onClick={() => handleExportCsv('fines')}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Export Fines CSV
              </Button>
            </Card>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 10: LIBRARY SETTINGS & RULES
      ========================================================================= */}
      {currentTab === 'settings' && (
        <Card className="p-5 max-w-2xl" title="Library Rules & Borrowing Policies">
          <form onSubmit={handleUpdateSettings} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Fine Rate per Day (₹)"
                type="number"
                value={settings.finePerDay}
                onChange={(e) =>
                  setSettings({ ...settings, finePerDay: Number(e.target.value) })
                }
                required
              />
              <Input
                label="Max Renewals Allowed"
                type="number"
                value={settings.maxRenewalsAllowed}
                onChange={(e) =>
                  setSettings({ ...settings, maxRenewalsAllowed: Number(e.target.value) })
                }
                required
              />
              <Input
                label="Student Loan Period (Days)"
                type="number"
                value={settings.defaultLoanPeriodDays}
                onChange={(e) =>
                  setSettings({ ...settings, defaultLoanPeriodDays: Number(e.target.value) })
                }
                required
              />
              <Input
                label="Faculty Loan Period (Days)"
                type="number"
                value={settings.facultyLoanPeriodDays}
                onChange={(e) =>
                  setSettings({ ...settings, facultyLoanPeriodDays: Number(e.target.value) })
                }
                required
              />
              <Input
                label="Student Borrowing Limit (Books)"
                type="number"
                value={settings.maxBooksAllowedStudent}
                onChange={(e) =>
                  setSettings({ ...settings, maxBooksAllowedStudent: Number(e.target.value) })
                }
                required
              />
              <Input
                label="Faculty Borrowing Limit (Books)"
                type="number"
                value={settings.maxBooksAllowedFaculty}
                onChange={(e) =>
                  setSettings({ ...settings, maxBooksAllowedFaculty: Number(e.target.value) })
                }
                required
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs"
              >
                Save Library Rules
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* =========================================================================
          MODALS
      ========================================================================= */}

      {/* 1. Add Book Modal */}
      <Modal
        isOpen={isAddBookModalOpen}
        onClose={() => setIsAddBookModalOpen(false)}
        title="Catalog New Book Title"
        subtitle="Registers the title and generates physical copy accession barcodes"
      >
        <form onSubmit={handleCreateBook} className="space-y-3.5">
          <Input
            label="Book Title *"
            value={bookForm.title}
            onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
            placeholder="e.g. Modern Operating Systems"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Author *"
              value={bookForm.author}
              onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
              placeholder="e.g. Andrew S. Tanenbaum"
              required
            />
            <Input
              label="ISBN"
              value={bookForm.isbn}
              onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
              placeholder="e.g. 978-0133591620"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Publisher"
              value={bookForm.publisher}
              onChange={(e) => setBookForm({ ...bookForm, publisher: e.target.value })}
              placeholder="e.g. Pearson"
            />
            <Input
              label="Publication Year"
              type="number"
              value={bookForm.publicationYear}
              onChange={(e) =>
                setBookForm({ ...bookForm, publicationYear: Number(e.target.value) })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Category"
              value={bookForm.category}
              onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
            >
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Input
              label="Initial Physical Copies"
              type="number"
              min="1"
              max="50"
              value={bookForm.copiesCount}
              onChange={(e) =>
                setBookForm({ ...bookForm, copiesCount: Number(e.target.value) })
              }
              required
            />
          </div>
          <Input
            label="Shelf / Rack Location"
            value={bookForm.shelfLocation}
            onChange={(e) => setBookForm({ ...bookForm, shelfLocation: e.target.value })}
            placeholder="e.g. Aisle 3, Rack B"
          />

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddBookModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Create & Generate Copies
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. Physical Copies Modal */}
      <Modal
        isOpen={isCopiesModalOpen}
        onClose={() => setIsCopiesModalOpen(false)}
        title={`Physical Copies: ${selectedBookForCopies?.title || ''}`}
        subtitle="Individual volumes tracked by unique accession numbers"
      >
        <div className="space-y-4">
          <form
            onSubmit={handleAddCopies}
            className="flex items-center space-x-2 p-3 bg-slate-50 rounded-xl"
          >
            <Input
              label="Add More Copies"
              type="number"
              min="1"
              max="20"
              value={newCopiesCount}
              onChange={(e) => setNewCopiesCount(e.target.value)}
              className="w-32"
            />
            <Button
              type="submit"
              variant="primary"
              className="bg-rose-600 hover:bg-rose-700 text-white mt-5 text-xs"
            >
              Generate
            </Button>
          </form>

          <div className="max-h-60 overflow-y-auto space-y-2">
            {selectedBookForCopies?.copies && selectedBookForCopies.copies.length > 0 ? (
              selectedBookForCopies.copies.map((copy) => (
                <div
                  key={copy._id}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-white"
                >
                  <div>
                    <span className="font-mono text-xs font-bold text-rose-800">
                      {copy.accessionNumber}
                    </span>
                    <span className="text-[11px] text-slate-500 ml-2">
                      Condition: {copy.condition || 'good'}
                    </span>
                  </div>
                  <Badge
                    variant={copy.status === 'available' ? 'success' : 'primary'}
                    className="text-[10px] capitalize"
                  >
                    {copy.status}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">No copies registered</p>
            )}
          </div>
        </div>
      </Modal>

      {/* 3. Create Category Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Add Book Classification Category"
      >
        <form onSubmit={handleCreateCategory} className="space-y-3">
          <Input
            label="Category Name *"
            value={categoryForm.name}
            onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
            placeholder="e.g. Artificial Intelligence"
            required
          />
          <Input
            label="Classification Code *"
            value={categoryForm.code}
            onChange={(e) => setCategoryForm({ ...categoryForm, code: e.target.value })}
            placeholder="e.g. AI-01"
            required
          />
          <Input
            label="Description"
            value={categoryForm.description}
            onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
            placeholder="e.g. Machine learning, deep neural nets, and robotics"
          />

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCategoryModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Create Category
            </Button>
          </div>
        </form>
      </Modal>

      {/* 4. Issue Book Modal */}
      <Modal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        title="Issue Book to Patron"
        subtitle="Validates borrowing limits and active overdue fines before checkout"
      >
        <form onSubmit={handleIssueBook} className="space-y-3">
          <Input
            label="Library Membership Card Number *"
            value={issueForm.membershipCardNumber}
            onChange={(e) =>
              setIssueForm({ ...issueForm, membershipCardNumber: e.target.value })
            }
            placeholder="e.g. LIB-STU-0001"
            required
          />
          <Input
            label="Book Copy Accession Number *"
            value={issueForm.accessionNumber}
            onChange={(e) =>
              setIssueForm({ ...issueForm, accessionNumber: e.target.value })
            }
            placeholder="e.g. LIB-2025-00001"
            required
          />
          <Input
            label="Custom Due Date (Leave blank for default policy)"
            type="date"
            value={issueForm.dueDate}
            onChange={(e) => setIssueForm({ ...issueForm, dueDate: e.target.value })}
          />
          <Input
            label="Remarks / Notes"
            value={issueForm.remarks}
            onChange={(e) => setIssueForm({ ...issueForm, remarks: e.target.value })}
            placeholder="e.g. Semester reference loan"
          />

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsIssueModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Checkout Book
            </Button>
          </div>
        </form>
      </Modal>

      {/* 5. Return Book Modal */}
      <Modal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        title="Check-In / Return Book"
        subtitle="Scans accession barcode and calculates overdue fines if return is late"
      >
        <form onSubmit={handleReturnBook} className="space-y-3">
          <Input
            label="Book Copy Accession Number *"
            value={returnForm.accessionNumber}
            onChange={(e) =>
              setReturnForm({ ...returnForm, accessionNumber: e.target.value })
            }
            placeholder="e.g. LIB-2025-00001"
            required
          />
          <Select
            label="Returned Physical Condition"
            value={returnForm.condition}
            onChange={(e) => setReturnForm({ ...returnForm, condition: e.target.value })}
          >
            <option value="good">Good Condition</option>
            <option value="fair">Fair / Minor Wear</option>
            <option value="damaged">Damaged (Fine liable)</option>
          </Select>
          <Input
            label="Return Notes"
            value={returnForm.remarks}
            onChange={(e) => setReturnForm({ ...returnForm, remarks: e.target.value })}
            placeholder="e.g. Returned at counter"
          />

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsReturnModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Process Check-In
            </Button>
          </div>
        </form>
      </Modal>

      {/* 6. Register Member Modal */}
      <Modal
        isOpen={isRegisterMemberModalOpen}
        onClose={() => setIsRegisterMemberModalOpen(false)}
        title="Register Library Patron"
      >
        <form onSubmit={handleRegisterMember} className="space-y-3">
          <Input
            label="Full Name *"
            value={memberForm.name}
            onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
            required
          />
          <Input
            label="Email Address *"
            type="email"
            value={memberForm.email}
            onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Patron Role"
              value={memberForm.role}
              onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
            >
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
            </Select>
            <Input
              label="Borrowing Limit (Books)"
              type="number"
              value={memberForm.maxBooksAllowed}
              onChange={(e) =>
                setMemberForm({ ...memberForm, maxBooksAllowed: Number(e.target.value) })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Roll Number (if student)"
              value={memberForm.rollNumber}
              onChange={(e) => setMemberForm({ ...memberForm, rollNumber: e.target.value })}
            />
            <Input
              label="Employee ID (if faculty)"
              value={memberForm.employeeId}
              onChange={(e) => setMemberForm({ ...memberForm, employeeId: e.target.value })}
            />
          </div>
          <Input
            label="Department"
            value={memberForm.department}
            onChange={(e) => setMemberForm({ ...memberForm, department: e.target.value })}
          />

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRegisterMemberModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Register Patron
            </Button>
          </div>
        </form>
      </Modal>

      {/* 7. Member Profile Details Modal */}
      <Modal
        isOpen={isMemberDetailsModalOpen}
        onClose={() => setIsMemberDetailsModalOpen(false)}
        title="Patron Profile & Circulation History"
      >
        {selectedMemberDetails && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-slate-900">{selectedMemberDetails.member?.name}</h4>
                  <p className="text-xs text-slate-500">{selectedMemberDetails.member?.email}</p>
                </div>
                <Badge variant="primary" className="font-mono text-xs">
                  {selectedMemberDetails.member?.membershipCardNumber}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400">Department:</span>{' '}
                  {selectedMemberDetails.member?.department}
                </div>
                <div>
                  <span className="text-slate-400">Role:</span>{' '}
                  <span className="capitalize">{selectedMemberDetails.member?.role}</span>
                </div>
              </div>
            </div>

            <div>
              <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-2">
                Active Checked Out Books ({selectedMemberDetails.activeIssues?.length || 0})
              </h5>
              <div className="max-h-40 overflow-y-auto space-y-1.5">
                {selectedMemberDetails.activeIssues &&
                selectedMemberDetails.activeIssues.length > 0 ? (
                  selectedMemberDetails.activeIssues.map((iss) => (
                    <div
                      key={iss._id}
                      className="p-2 rounded-lg border border-slate-100 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">{iss.book?.title}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {iss.bookCopy?.accessionNumber}
                        </div>
                      </div>
                      <span className="text-[11px] text-rose-700 font-medium">
                        Due: {new Date(iss.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-2">No active loans</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 8. Pay Fine Modal */}
      <Modal
        isOpen={isPayFineModalOpen}
        onClose={() => setIsPayFineModalOpen(false)}
        title="Record Fine Payment"
      >
        <form onSubmit={handlePayFine} className="space-y-3">
          <Select
            label="Payment Mode *"
            value={payFineForm.paymentMethod}
            onChange={(e) =>
              setPayFineForm({ ...payFineForm, paymentMethod: e.target.value })
            }
          >
            <option value="cash">Cash Counter</option>
            <option value="upi">UPI / QR Code</option>
            <option value="card">Credit / Debit Card</option>
            <option value="online">Online Portal</option>
          </Select>
          <Input
            label="Transaction / Receipt Ref Number"
            value={payFineForm.referenceNumber}
            onChange={(e) =>
              setPayFineForm({ ...payFineForm, referenceNumber: e.target.value })
            }
            placeholder="e.g. REC-2025-0891"
          />
          <Input
            label="Remarks"
            value={payFineForm.remarks}
            onChange={(e) => setPayFineForm({ ...payFineForm, remarks: e.target.value })}
            placeholder="e.g. Paid in full"
          />

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPayFineModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Confirm Collection
            </Button>
          </div>
        </form>
      </Modal>

      {/* 9. Waive Fine Modal */}
      <Modal
        isOpen={isWaiveFineModalOpen}
        onClose={() => setIsWaiveFineModalOpen(false)}
        title="Authorize Fine Waiver"
        subtitle="Mandatory justification required. An immutable security audit log will be created."
      >
        <form onSubmit={handleWaiveFine} className="space-y-3">
          <Input
            label="Waiver Justification / Reason *"
            value={waiveFineForm.reason}
            onChange={(e) => setWaiveFineForm({ ...waiveFineForm, reason: e.target.value })}
            placeholder="e.g. Medical emergency certificate approved by HOD"
            required
          />

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsWaiveFineModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Authorize Waiver
            </Button>
          </div>
        </form>
      </Modal>

      {/* 10. Add Digital Resource Modal */}
      <Modal
        isOpen={isDigitalModalOpen}
        onClose={() => setIsDigitalModalOpen(false)}
        title="Catalog Digital Learning Resource"
      >
        <form onSubmit={handleCreateDigital} className="space-y-3">
          <Input
            label="Resource Title *"
            value={digitalForm.title}
            onChange={(e) => setDigitalForm({ ...digitalForm, title: e.target.value })}
            placeholder="e.g. Cloud Architecture Handbook"
            required
          />
          <Input
            label="Author / Lecturer *"
            value={digitalForm.author}
            onChange={(e) => setDigitalForm({ ...digitalForm, author: e.target.value })}
            placeholder="e.g. Dr. Alan Turing"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Format"
              value={digitalForm.resourceType}
              onChange={(e) =>
                setDigitalForm({ ...digitalForm, resourceType: e.target.value })
              }
            >
              <option value="pdf">PDF E-Book</option>
              <option value="epub">EPUB</option>
              <option value="slides">Lecture Slides</option>
              <option value="paper">Research Paper</option>
            </Select>
            <Select
              label="Category"
              value={digitalForm.category}
              onChange={(e) => setDigitalForm({ ...digitalForm, category: e.target.value })}
            >
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <Input
            label="File / Download URL *"
            value={digitalForm.fileUrl}
            onChange={(e) => setDigitalForm({ ...digitalForm, fileUrl: e.target.value })}
            placeholder="https://example.com/ebook.pdf"
            required
          />
          <Input
            label="Description"
            value={digitalForm.description}
            onChange={(e) => setDigitalForm({ ...digitalForm, description: e.target.value })}
            placeholder="Brief abstract or syllabus reference"
          />

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDigitalModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Save E-Resource
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LibrarianDashboard;

