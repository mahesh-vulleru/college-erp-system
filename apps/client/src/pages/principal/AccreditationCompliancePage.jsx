import React, { useState, useEffect, useCallback } from 'react';
import {
  Award,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertOctagon,
  FileText,
  Plus,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Upload,
  Check,
  X,
  Trash2,
  Edit,
  ShieldCheck,
  BarChart3,
  FileCheck
} from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import api from '../../api/apiClient';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export const AccreditationCompliancePage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [criteria, setCriteria] = useState([]);
  const [summary, setSummary] = useState({
    totalCriteria: 0,
    completedCriteria: 0,
    pendingVerification: 0,
    overdueCriteria: 0,
    overallCompliancePercentage: 0,
    categoryProgress: []
  });

  // Filters & Pagination
  const [selectedFramework, setSelectedFramework] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDept, setSelectedDept] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Departments list for dropdown
  const [departments, setDepartments] = useState([]);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [selectedCriterion, setSelectedCriterion] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State for Create/Edit Criterion
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    framework: 'NAAC',
    category: 'Curricular Aspects',
    department: '',
    assignedOwner: '',
    weightage: 100,
    dueDate: '',
    remarks: ''
  });

  // Evidence upload form state
  const [evidenceForm, setEvidenceForm] = useState({
    name: '',
    url: '',
    fileType: 'application/pdf',
    fileSize: 102400
  });

  // Fetch departments
  useEffect(() => {
    api.getDepartments().then((res) => {
      if (res?.data) setDepartments(res.data);
    }).catch(() => {});
  }, []);

  // Fetch Criteria & Summary
  const fetchCriteria = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: pageSize
      };
      if (selectedFramework !== 'all') params.framework = selectedFramework;
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (selectedStatus !== 'all') params.status = selectedStatus;
      if (selectedDept !== 'all') params.department = selectedDept;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.getAccreditationCriteria(params);
      if (res?.data) {
        setCriteria(res.data.criteria || []);
        if (res.data.summary) setSummary(res.data.summary);
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.totalPages || 1);
          setTotalRecords(res.data.pagination.total || 0);
        }
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Error loading criteria',
        message: err.message || 'Failed to load accreditation compliance criteria.'
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, selectedFramework, selectedCategory, selectedStatus, selectedDept, searchQuery, addToast]);

  useEffect(() => {
    fetchCriteria();
  }, [fetchCriteria]);

  // Create or Update Criterion
  const handleSubmitCriterion = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (selectedCriterion?._id) {
        await api.updateAccreditationCriterion(selectedCriterion._id, formData);
        addToast({
          type: 'success',
          title: 'Criterion Updated',
          message: `Criterion ${formData.code} has been updated.`
        });
      } else {
        await api.createAccreditationCriterion({
          ...formData,
          assignedOwner: formData.assignedOwner || user?._id
        });
        addToast({
          type: 'success',
          title: 'Criterion Registered',
          message: `Criterion ${formData.code} successfully added to accreditation tracker.`
        });
      }
      setIsCreateModalOpen(false);
      setSelectedCriterion(null);
      resetForm();
      fetchCriteria();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Submission Failed',
        message: err.message || 'Could not save criterion.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Criterion
  const handleDeleteCriterion = async (id, code) => {
    if (!window.confirm(`Are you sure you want to delete accreditation criterion ${code}?`)) return;
    try {
      await api.deleteAccreditationCriterion(id);
      addToast({
        type: 'info',
        title: 'Criterion Deleted',
        message: `Criterion ${code} was removed.`
      });
      fetchCriteria();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Delete Failed',
        message: err.message
      });
    }
  };

  // Attach Evidence
  const handleAttachEvidence = async (e) => {
    e.preventDefault();
    if (!selectedCriterion?._id) return;
    setIsSubmitting(true);
    try {
      await api.addCriterionEvidence(selectedCriterion._id, evidenceForm);
      addToast({
        type: 'success',
        title: 'Evidence Attached',
        message: `Document "${evidenceForm.name}" attached for verification.`
      });
      setEvidenceForm({ name: '', url: '', fileType: 'application/pdf', fileSize: 102400 });
      // Refresh criterion
      const updated = await api.getAccreditationCriterionById(selectedCriterion._id);
      if (updated?.data) setSelectedCriterion(updated.data);
      fetchCriteria();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Upload Failed',
        message: err.message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Verify Evidence
  const handleVerifyEvidence = async (critId, docId, status, notes = '') => {
    try {
      await api.verifyCriterionEvidence(critId, docId, {
        verificationStatus: status,
        verificationNotes: notes || `Document marked as ${status} by institutional evaluator`
      });
      addToast({
        type: status === 'verified' ? 'success' : 'warning',
        title: `Evidence ${status === 'verified' ? 'Verified' : 'Rejected'}`,
        message: `Verification status has been updated.`
      });
      const updated = await api.getAccreditationCriterionById(critId);
      if (updated?.data) setSelectedCriterion(updated.data);
      fetchCriteria();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Verification Failed',
        message: err.message
      });
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      title: '',
      description: '',
      framework: 'NAAC',
      category: 'Curricular Aspects',
      department: '',
      assignedOwner: user?._id || '',
      weightage: 100,
      dueDate: '',
      remarks: ''
    });
  };

  const openEditModal = (crit) => {
    setSelectedCriterion(crit);
    setFormData({
      code: crit.code,
      title: crit.title,
      description: crit.description,
      framework: crit.framework,
      category: crit.category,
      department: crit.department?._id || crit.department || '',
      assignedOwner: crit.assignedOwner?._id || crit.assignedOwner || user?._id,
      weightage: crit.weightage || 100,
      dueDate: crit.dueDate ? new Date(crit.dueDate).toISOString().split('T')[0] : '',
      remarks: crit.remarks || ''
    });
    setIsCreateModalOpen(true);
  };

  const openEvidenceModal = (crit) => {
    setSelectedCriterion(crit);
    setIsEvidenceModalOpen(true);
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success" size="xs"><CheckCircle2 className="w-3 h-3 mr-1 inline" /> Completed</Badge>;
      case 'in_progress':
        return <Badge variant="teal" size="xs"><Clock className="w-3 h-3 mr-1 inline" /> In Progress</Badge>;
      case 'under_review':
        return <Badge variant="indigo" size="xs"><FileCheck className="w-3 h-3 mr-1 inline" /> Under Review</Badge>;
      case 'overdue':
        return <Badge variant="danger" size="xs"><AlertOctagon className="w-3 h-3 mr-1 inline" /> Overdue</Badge>;
      case 'not_started':
      default:
        return <Badge variant="neutral" size="xs">Not Started</Badge>;
    }
  };

  // Table Columns
  const columns = [
    {
      header: 'Code & Title',
      cell: (row) => (
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              {row.code}
            </span>
            <Badge variant="neutral" size="xs">{row.framework}</Badge>
          </div>
          <span className="font-bold text-xs sm:text-sm text-slate-900 block mt-1">{row.title}</span>
          <span className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{row.description}</span>
        </div>
      )
    },
    {
      header: 'Category / Scope',
      cell: (row) => (
        <div>
          <span className="text-xs font-semibold text-slate-800 block">{row.category}</span>
          <span className="text-[11px] text-slate-500 font-mono">
            {row.department?.code ? `${row.department.name} (${row.department.code})` : 'Institution-Wide'}
          </span>
        </div>
      )
    },
    {
      header: 'Owner & Deadline',
      cell: (row) => (
        <div>
          <span className="text-xs font-medium text-slate-900 block">
            {row.assignedOwner?.name || 'Assigned Lead'}
          </span>
          <span className={`text-[11px] font-mono block mt-0.5 ${row.isOverdue ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
            Due: {row.dueDate ? new Date(row.dueDate).toLocaleDateString() : 'N/A'}
          </span>
        </div>
      )
    },
    {
      header: 'Compliance %',
      cell: (row) => {
        const pct = row.compliancePercentage || (row.status === 'completed' ? 100 : 0);
        return (
          <div className="w-28">
            <div className="flex items-center justify-between text-xs mb-1 font-mono">
              <span className="font-bold text-slate-900">{pct}%</span>
              <span className="text-[10px] text-slate-400">{row.weightage} pts</span>
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
      header: 'Status',
      cell: (row) => renderStatusBadge(row.status)
    },
    {
      header: 'Evidence',
      cell: (row) => {
        const docCount = row.evidenceDocuments?.length || 0;
        const verifiedCount = (row.evidenceDocuments || []).filter((d) => d.verificationStatus === 'verified').length;
        return (
          <Button
            variant="outline"
            size="xs"
            onClick={() => openEvidenceModal(row)}
            icon={FileText}
            className="text-teal-700 border-teal-300 hover:bg-teal-50"
          >
            {docCount > 0 ? `${verifiedCount}/${docCount} Docs` : 'Attach'}
          </Button>
        );
      }
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center space-x-1">
          <button
            onClick={() => openEditModal(row)}
            className="p-1 text-slate-500 hover:text-teal-700 hover:bg-slate-100 rounded"
            title="Edit Criterion"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleDeleteCriterion(row._id, row.code)}
            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
            title="Delete Criterion"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 rounded-2xl p-6 text-white shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-teal-300" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Accreditation & Compliance Management</h1>
          </div>
          <p className="text-xs sm:text-sm text-teal-100 mt-1 max-w-2xl">
            Institutional quality benchmarking, NAAC/NBA criteria progression, evidence document verification, and compliance score tracking
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchCriteria}
            icon={RefreshCw}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setSelectedCriterion(null);
              resetForm();
              setIsCreateModalOpen(true);
            }}
            icon={Plus}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow-sm"
          >
            New Criterion
          </Button>
        </div>
      </div>

      {/* 1. Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl border bg-white border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Overall Compliance</span>
            <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs">
              %
            </div>
          </div>
          <div className="text-2xl font-black text-teal-950">{summary.overallCompliancePercentage}%</div>
          <p className="text-[11px] text-teal-700 mt-1">Institutional accreditation score</p>
        </div>

        <div className="p-4 rounded-xl border bg-white border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Criteria</span>
            <Award className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{summary.totalCriteria}</div>
          <p className="text-[11px] text-slate-500 mt-1">NAAC & NBA guidelines</p>
        </div>

        <div className="p-4 rounded-xl border bg-white border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-950">{summary.completedCriteria}</div>
          <p className="text-[11px] text-emerald-700 mt-1">Fully documented & audited</p>
        </div>

        <div className="p-4 rounded-xl border bg-white border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">Pending Review</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-950">{summary.pendingVerification}</div>
          <p className="text-[11px] text-indigo-700 mt-1">Awaiting evidence audit</p>
        </div>

        <div className="p-4 rounded-xl border bg-white border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Overdue Items</span>
            <AlertOctagon className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-950">{summary.overdueCriteria}</div>
          <p className="text-[11px] text-rose-700 mt-1">Passed milestone deadlines</p>
        </div>
      </div>

      {/* 2. Category Progress Section */}
      {summary.categoryProgress?.length > 0 && (
        <Card
          title="Accreditation Category Progression"
          subtitle="Real-time compliance index across key NAAC / NBA performance dimensions"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {summary.categoryProgress.map((cat, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="text-xs font-bold text-slate-800 line-clamp-1">{cat.category}</span>
                  <span className="text-xs font-mono font-bold text-teal-700">{cat.percentage}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden mb-1.5">
                  <div
                    className="h-full rounded-full bg-teal-600"
                    style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>Completed: {cat.completed}/{cat.total}</span>
                  <span>{cat.percentage >= 75 ? 'On Track' : 'Needs Focus'}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 3. Filter Bar & Criteria Table */}
      <Card
        title="Accreditation Criteria & Evidence Registry"
        subtitle="Manage institution-wide criteria, attach verification documents, and audit compliance status"
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
                placeholder="Search code, title..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            {/* Framework */}
            <select
              value={selectedFramework}
              onChange={(e) => {
                setSelectedFramework(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
            >
              <option value="all">All Frameworks (NAAC, NBA)</option>
              <option value="NAAC">NAAC Guidelines</option>
              <option value="NBA">NBA Tier-1 Criteria</option>
              <option value="NIRF">NIRF Metrics</option>
              <option value="ISO">ISO 9001:2015</option>
            </select>

            {/* Category */}
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">All Categories</option>
              <option value="Curricular Aspects">Curricular Aspects</option>
              <option value="Teaching-Learning & Evaluation">Teaching-Learning & Evaluation</option>
              <option value="Research, Innovations & Extension">Research, Innovations & Extension</option>
              <option value="Infrastructure & Learning Resources">Infrastructure & Learning Resources</option>
              <option value="Student Support & Progression">Student Support & Progression</option>
              <option value="Governance, Leadership & Management">Governance, Leadership & Management</option>
              <option value="Institutional Values & Best Practices">Institutional Values & Best Practices</option>
            </select>

            {/* Status */}
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="in_progress">In Progress</option>
              <option value="under_review">Under Review</option>
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
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">All Departments / Units</option>
              <option value="institution_wide">Institution-Wide Only</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Criteria Table */}
        <Table
          columns={columns}
          data={criteria}
          keyField="id"
          isLoading={isLoading}
          emptyMessage="No accreditation criteria found matching current filters."
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

      {/* Create / Edit Criterion Modal */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setSelectedCriterion(null);
          }}
          title={selectedCriterion ? `Edit Criterion: ${selectedCriterion.code}` : 'Register Accreditation Criterion'}
          subtitle="Define institutional accreditation parameters, weightage points, and compliance deadlines"
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleSubmitCriterion} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Criterion Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g. NAAC-C1.1"
                  className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Framework
                </label>
                <select
                  value={formData.framework}
                  onChange={(e) => setFormData({ ...formData, framework: e.target.value })}
                  className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="NAAC">NAAC</option>
                  <option value="NBA">NBA</option>
                  <option value="NIRF">NIRF</option>
                  <option value="ISO">ISO</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Curricular Planning and Implementation"
                className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Description & Compliance Requirements <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="State the institutional requirements and evidentiary artifacts expected..."
                className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
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
                  className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="Curricular Aspects">Curricular Aspects</option>
                  <option value="Teaching-Learning & Evaluation">Teaching-Learning & Evaluation</option>
                  <option value="Research, Innovations & Extension">Research, Innovations & Extension</option>
                  <option value="Infrastructure & Learning Resources">Infrastructure & Learning Resources</option>
                  <option value="Student Support & Progression">Student Support & Progression</option>
                  <option value="Governance, Leadership & Management">Governance, Leadership & Management</option>
                  <option value="Institutional Values & Best Practices">Institutional Values & Best Practices</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Department Scope
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="">Institution-Wide</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Weightage Points
                </label>
                <input
                  type="number"
                  min="0"
                  max="500"
                  value={formData.weightage}
                  onChange={(e) => setFormData({ ...formData, weightage: e.target.value })}
                  className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Due Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
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
                variant="teal"
                size="sm"
                type="submit"
                isLoading={isSubmitting}
              >
                {selectedCriterion ? 'Update Criterion' : 'Create Criterion'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Evidence Documents Modal */}
      {isEvidenceModalOpen && selectedCriterion && (
        <Modal
          isOpen={isEvidenceModalOpen}
          onClose={() => {
            setIsEvidenceModalOpen(false);
            setSelectedCriterion(null);
          }}
          title={`Supporting Evidence: ${selectedCriterion.code}`}
          subtitle={`Audit artifacts for "${selectedCriterion.title}"`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-xs">
            {/* Attached Documents List */}
            <div>
              <h4 className="font-bold text-slate-800 text-xs mb-2">Attached Compliance Documents</h4>
              {selectedCriterion.evidenceDocuments?.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-300 text-center text-slate-400">
                  No evidence documents attached yet. Attach supporting files below.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedCriterion.evidenceDocuments.map((doc) => (
                    <div
                      key={doc._id}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center space-x-2.5">
                        <FileText className="w-5 h-5 text-teal-600 flex-shrink-0" />
                        <div>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-teal-800 hover:underline flex items-center"
                          >
                            {doc.name}
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={
                            doc.verificationStatus === 'verified'
                              ? 'success'
                              : doc.verificationStatus === 'rejected'
                              ? 'danger'
                              : 'amber'
                          }
                          size="xs"
                        >
                          {doc.verificationStatus}
                        </Badge>

                        {/* Principal Verification Action Buttons */}
                        {doc.verificationStatus !== 'verified' && (
                          <button
                            onClick={() => handleVerifyEvidence(selectedCriterion._id, doc._id, 'verified')}
                            className="p-1 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-700"
                            title="Verify Document"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {doc.verificationStatus !== 'rejected' && (
                          <button
                            onClick={() => handleVerifyEvidence(selectedCriterion._id, doc._id, 'rejected')}
                            className="p-1 rounded bg-rose-100 hover:bg-rose-200 text-rose-700"
                            title="Reject Document"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Attach New Evidence Form */}
            <form onSubmit={handleAttachEvidence} className="p-3.5 rounded-xl border border-teal-200 bg-teal-50/50 space-y-3">
              <span className="font-bold text-teal-900 block">Attach New Verification Document</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Document Title / Label
                  </label>
                  <input
                    type="text"
                    required
                    value={evidenceForm.name}
                    onChange={(e) => setEvidenceForm({ ...evidenceForm, name: e.target.value })}
                    placeholder="e.g. BoS Meeting Minutes 2026"
                    className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Document Repository URL
                  </label>
                  <input
                    type="text"
                    required
                    value={evidenceForm.url}
                    onChange={(e) => setEvidenceForm({ ...evidenceForm, url: e.target.value })}
                    placeholder="e.g. /uploads/accreditation/bos-2026.pdf"
                    className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="teal"
                  size="xs"
                  type="submit"
                  isLoading={isSubmitting}
                  icon={Upload}
                >
                  Upload & Attach
                </Button>
              </div>
            </form>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsEvidenceModalOpen(false);
                  setSelectedCriterion(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AccreditationCompliancePage;

