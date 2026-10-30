import React, { useState, useEffect, useCallback } from 'react';
import {
  Target,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertOctagon,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Edit,
  Trash2,
  BarChart3,
  Calendar,
  Building2,
  CheckSquare,
  ArrowUpRight,
  History
} from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import SimpleBarChart from '../../components/common/SimpleBarChart';
import api from '../../api/apiClient';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export const InstitutionalGoalsPage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [goals, setGoals] = useState([]);
  const [summary, setSummary] = useState({
    totalGoals: 0,
    completedGoals: 0,
    inProgressGoals: 0,
    atRiskOrOverdueGoals: 0,
    overallTargetAchievement: 0,
    departmentComparison: [],
    categoryBreakdown: [],
    statusDistribution: {}
  });

  // Filters & Pagination
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('all');
  const [selectedDept, setSelectedDept] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Departments list
  const [departments, setDepartments] = useState([]);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Goal Form Data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Academic Excellence',
    targetValue: 100,
    currentValue: 0,
    unit: '%',
    priority: 'medium',
    owner: '',
    department: '',
    periodType: 'annual',
    academicYear: '2026-2027',
    deadline: ''
  });

  // Progress Update Form Data
  const [progressForm, setProgressForm] = useState({
    value: 0,
    note: ''
  });

  // Fetch departments
  useEffect(() => {
    api.getDepartments().then((res) => {
      if (res?.data) setDepartments(res.data);
    }).catch(() => {});
  }, []);

  // Fetch Goals
  const fetchGoals = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: pageSize
      };
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (selectedStatus !== 'all') params.status = selectedStatus;
      if (selectedPriority !== 'all') params.priority = selectedPriority;
      if (selectedAcademicYear !== 'all') params.academicYear = selectedAcademicYear;
      if (selectedDept !== 'all') params.department = selectedDept;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.getInstitutionalGoals(params);
      if (res?.data) {
        setGoals(res.data.goals || []);
        if (res.data.summary) setSummary(res.data.summary);
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.totalPages || 1);
          setTotalRecords(res.data.pagination.total || 0);
        }
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Error loading goals',
        message: err.message || 'Failed to load institutional KPI goals.'
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, selectedCategory, selectedStatus, selectedPriority, selectedAcademicYear, selectedDept, searchQuery, addToast]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  // Submit Goal
  const handleSubmitGoal = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (selectedGoal?._id) {
        await api.updateInstitutionalGoal(selectedGoal._id, formData);
        addToast({
          type: 'success',
          title: 'Goal Updated',
          message: `Goal "${formData.title}" updated successfully.`
        });
      } else {
        await api.createInstitutionalGoal({
          ...formData,
          owner: formData.owner || user?._id
        });
        addToast({
          type: 'success',
          title: 'Goal Established',
          message: `Institutional goal "${formData.title}" created.`
        });
      }
      setIsCreateModalOpen(false);
      setSelectedGoal(null);
      resetForm();
      fetchGoals();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Goal Save Failed',
        message: err.message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Progress
  const handleSubmitProgress = async (e) => {
    e.preventDefault();
    if (!selectedGoal?._id) return;
    setIsSubmitting(true);
    try {
      await api.recordGoalProgress(selectedGoal._id, progressForm);
      addToast({
        type: 'success',
        title: 'Progress Recorded',
        message: `Logged progress for "${selectedGoal.title}".`
      });
      setIsProgressModalOpen(false);
      setSelectedGoal(null);
      fetchGoals();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Progress Update Failed',
        message: err.message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Goal
  const handleDeleteGoal = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete institutional goal "${title}"?`)) return;
    try {
      await api.deleteInstitutionalGoal(id);
      addToast({
        type: 'info',
        title: 'Goal Removed',
        message: `Goal "${title}" was deleted.`
      });
      fetchGoals();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Delete Failed',
        message: err.message
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'Academic Excellence',
      targetValue: 100,
      currentValue: 0,
      unit: '%',
      priority: 'medium',
      owner: user?._id || '',
      department: '',
      periodType: 'annual',
      academicYear: '2026-2027',
      deadline: ''
    });
  };

  const openEditModal = (goal) => {
    setSelectedGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description,
      category: goal.category,
      targetValue: goal.targetValue,
      currentValue: goal.currentValue,
      unit: goal.unit,
      priority: goal.priority,
      owner: goal.owner?._id || goal.owner || user?._id,
      department: goal.department?._id || goal.department || '',
      periodType: goal.periodType || 'annual',
      academicYear: goal.academicYear || '2026-2027',
      deadline: goal.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : ''
    });
    setIsCreateModalOpen(true);
  };

  const openProgressModal = (goal) => {
    setSelectedGoal(goal);
    setProgressForm({
      value: goal.currentValue,
      note: ''
    });
    setIsProgressModalOpen(true);
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success" size="xs"><CheckCircle2 className="w-3 h-3 mr-1 inline" /> Completed</Badge>;
      case 'in_progress':
        return <Badge variant="teal" size="xs"><Clock className="w-3 h-3 mr-1 inline" /> In Progress</Badge>;
      case 'at_risk':
        return <Badge variant="amber" size="xs"><AlertTriangle className="w-3 h-3 mr-1 inline" /> At Risk</Badge>;
      case 'overdue':
        return <Badge variant="danger" size="xs"><AlertOctagon className="w-3 h-3 mr-1 inline" /> Overdue</Badge>;
      case 'not_started':
      default:
        return <Badge variant="neutral" size="xs">Not Started</Badge>;
    }
  };

  // Prepare chart data for department comparison
  const deptBarData = (summary.departmentComparison || []).slice(0, 6).map((d) => ({
    label: d.department.slice(0, 8),
    values: [d.averageAchievement, 100 - d.averageAchievement]
  }));

  // Columns definition
  const columns = [
    {
      header: 'Goal Title & Scope',
      cell: (row) => (
        <div>
          <span className="font-bold text-xs sm:text-sm text-slate-900 block">{row.title}</span>
          <span className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{row.description}</span>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium">
              {row.category}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {row.department?.code ? `${row.department.name} (${row.department.code})` : 'Campus-Wide'}
            </span>
          </div>
        </div>
      )
    },
    {
      header: 'Target vs Actual',
      cell: (row) => (
        <div>
          <div className="text-xs font-bold text-slate-900 font-mono">
            {row.currentValue} / {row.targetValue} {row.unit}
          </div>
          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
            Gap: {row.remainingGap} {row.unit} remaining
          </span>
        </div>
      )
    },
    {
      header: 'Progress',
      cell: (row) => {
        const pct = row.achievementPercentage || 0;
        return (
          <div className="w-28">
            <div className="flex items-center justify-between text-xs mb-1 font-mono">
              <span className={`font-bold ${pct >= 100 ? 'text-emerald-700' : 'text-slate-900'}`}>{pct}%</span>
              <span className="text-[10px] text-slate-400">{row.priority}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  pct >= 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-teal-500' : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
          </div>
        );
      }
    },
    {
      header: 'Deadline & Owner',
      cell: (row) => (
        <div>
          <span className="text-xs font-medium text-slate-800 block">
            {row.owner?.name || 'Institutional Lead'}
          </span>
          <span className={`text-[11px] font-mono block mt-0.5 ${row.status === 'overdue' ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
            {row.deadline ? new Date(row.deadline).toLocaleDateString() : 'No date'}
          </span>
        </div>
      )
    },
    {
      header: 'Status',
      cell: (row) => renderStatusBadge(row.status)
    },
    {
      header: 'Log Progress',
      cell: (row) => (
        <Button
          variant="outline"
          size="xs"
          onClick={() => openProgressModal(row)}
          icon={ArrowUpRight}
          className="text-teal-700 border-teal-300 hover:bg-teal-50"
        >
          Update
        </Button>
      )
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center space-x-1">
          <button
            onClick={() => openEditModal(row)}
            className="p-1 text-slate-500 hover:text-teal-700 hover:bg-slate-100 rounded"
            title="Edit Goal"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleDeleteGoal(row._id, row.title)}
            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
            title="Delete Goal"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900 rounded-2xl p-6 text-white shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Target className="w-6 h-6 text-blue-300" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Institutional Goals & KPI Tracker</h1>
          </div>
          <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-2xl">
            Strategic performance benchmarking, academic target versus actual monitoring, department comparisons, and milestone achievement
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchGoals}
            icon={RefreshCw}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setSelectedGoal(null);
              resetForm();
              setIsCreateModalOpen(true);
            }}
            icon={Plus}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow-sm"
          >
            New Goal
          </Button>
        </div>
      </div>

      {/* 1. Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl border bg-white border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Overall Target Achievement</span>
            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
              %
            </div>
          </div>
          <div className="text-2xl font-black text-blue-950">{summary.overallTargetAchievement}%</div>
          <p className="text-[11px] text-blue-700 mt-1">Average target milestone pace</p>
        </div>

        <div className="p-4 rounded-xl border bg-white border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Goals</span>
            <Target className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{summary.totalGoals}</div>
          <p className="text-[11px] text-slate-500 mt-1">Active strategic objectives</p>
        </div>

        <div className="p-4 rounded-xl border bg-white border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-950">{summary.completedGoals}</div>
          <p className="text-[11px] text-emerald-700 mt-1">100% target attained</p>
        </div>

        <div className="p-4 rounded-xl border bg-white border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">In Progress</span>
            <Clock className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-teal-950">{summary.inProgressGoals}</div>
          <p className="text-[11px] text-teal-700 mt-1">Active execution phase</p>
        </div>

        <div className="p-4 rounded-xl border bg-white border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">At Risk / Overdue</span>
            <AlertOctagon className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-950">{summary.atRiskOrOverdueGoals}</div>
          <p className="text-[11px] text-rose-700 mt-1">Behind schedule / passed deadline</p>
        </div>
      </div>

      {/* 2. Charts / Analytics Row */}
      {summary.departmentComparison?.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Department-Wise Goal Achievement</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Comparative achievement rates across academic units</p>
              </div>
              <span className="text-xs font-mono text-slate-400">Target Pace</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {summary.departmentComparison.map((d, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-xs font-bold text-slate-800 line-clamp-1 block">{d.department}</span>
                  <div className="text-lg font-black text-blue-900 mt-1">{d.averageAchievement}%</div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden mt-1.5">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{ width: `${Math.min(d.averageAchievement, 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block mt-1">
                    {d.completedGoals}/{d.totalGoals} Goals
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3">Goal Status Distribution</h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 text-emerald-800">
                  <span className="font-semibold">Completed (100%+)</span>
                  <span className="font-bold font-mono">{summary.statusDistribution.completed || 0}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-teal-50 text-teal-800">
                  <span className="font-semibold">In Progress</span>
                  <span className="font-bold font-mono">{summary.statusDistribution.in_progress || 0}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50 text-amber-800">
                  <span className="font-semibold">At Risk (&lt;40% near due)</span>
                  <span className="font-bold font-mono">{summary.statusDistribution.at_risk || 0}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50 text-rose-800">
                  <span className="font-semibold">Overdue</span>
                  <span className="font-bold font-mono">{summary.statusDistribution.overdue || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Goals Table & Filters */}
      <Card
        title="Institutional Performance Goals & KPI Registry"
        subtitle="Manage annual and semester-wise objectives with live progress tracking and gap analysis"
      >
        <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 mb-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search goals..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Category */}
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="Academic Excellence">Academic Excellence</option>
              <option value="Student Enrollment">Student Enrollment</option>
              <option value="Examination & Results">Examination & Results</option>
              <option value="Faculty Development">Faculty Development</option>
              <option value="Placement & Industry">Placement & Industry</option>
              <option value="Research & Publications">Research & Publications</option>
              <option value="Infrastructure & Finance">Infrastructure & Finance</option>
            </select>

            {/* Priority */}
            <select
              value={selectedPriority}
              onChange={(e) => {
                setSelectedPriority(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Status */}
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="in_progress">In Progress</option>
              <option value="at_risk">At Risk</option>
              <option value="overdue">Overdue</option>
              <option value="not_started">Not Started</option>
            </select>

            {/* Department */}
            <select
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Departments</option>
              <option value="institution_wide">Institution-Wide Only</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Goals Table */}
        <Table
          columns={columns}
          data={goals}
          keyField="id"
          isLoading={isLoading}
          emptyMessage="No institutional goals found matching the selected filters."
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex justify-end">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(p) => setCurrentPage(p)}
            />
          </div>
        )}
      </Card>

      {/* Create / Edit Goal Modal */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setSelectedGoal(null);
          }}
          title={selectedGoal ? `Edit Goal: ${selectedGoal.title}` : 'Define Institutional Goal'}
          subtitle="Establish target metrics, department scope, and measurement criteria"
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleSubmitGoal} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Goal Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Achieve 85% Pass Rate in Semester 3 Mid-Term Evaluations"
                className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Description & Success Criteria <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the institutional goal, strategic justification, and action plan..."
                className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Academic Excellence">Academic Excellence</option>
                  <option value="Student Enrollment">Student Enrollment</option>
                  <option value="Examination & Results">Examination & Results</option>
                  <option value="Faculty Development">Faculty Development</option>
                  <option value="Placement & Industry">Placement & Industry</option>
                  <option value="Research & Publications">Research & Publications</option>
                  <option value="Infrastructure & Finance">Infrastructure & Finance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Department Scope
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Campus-Wide</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Target Value <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.targetValue}
                  onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                  className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Current / Baseline
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.currentValue}
                  onChange={(e) => setFormData({ ...formData, currentValue: e.target.value })}
                  className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Unit <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="e.g. %, Students, Papers"
                  className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Target Deadline <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                isLoading={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {selectedGoal ? 'Update Goal' : 'Save Goal'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Record Progress Modal */}
      {isProgressModalOpen && selectedGoal && (
        <Modal
          isOpen={isProgressModalOpen}
          onClose={() => {
            setIsProgressModalOpen(false);
            setSelectedGoal(null);
          }}
          title={`Log Progress: ${selectedGoal.title}`}
          subtitle={`Current Target: ${selectedGoal.targetValue} ${selectedGoal.unit}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSubmitProgress} className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-700 block">Baseline Value</span>
                <span className="text-base font-bold text-blue-950 font-mono">
                  {selectedGoal.currentValue} {selectedGoal.unit}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-blue-700 block">Goal Target</span>
                <span className="text-base font-bold text-blue-950 font-mono">
                  {selectedGoal.targetValue} {selectedGoal.unit}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                New Measurement Value ({selectedGoal.unit}) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="any"
                value={progressForm.value}
                onChange={(e) => setProgressForm({ ...progressForm, value: e.target.value })}
                className="w-full p-2.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-base font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Progress Note / Justification
              </label>
              <textarea
                rows={2}
                value={progressForm.note}
                onChange={(e) => setProgressForm({ ...progressForm, note: e.target.value })}
                placeholder="e.g. Odd semester final marks tabulated across all 6 departments..."
                className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => setIsProgressModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                isLoading={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Log Progress
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default InstitutionalGoalsPage;

