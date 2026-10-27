import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  Receipt,
  AlertCircle,
  FileSpreadsheet,
  Download,
  PlusCircle,
  Search,
  RefreshCw,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Percent,
  Calendar,
  Building2,
  Printer,
  Archive,
  ArrowUpRight
} from 'lucide-react';
import Card from '../../components/common/Card';
import StatWidget from '../../components/common/StatWidget';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Notification from '../../components/common/Notification';
import api from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ROLES } from '@college-erp/shared';

export const FeeManagementPage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const isStaff = [ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.ACCOUNTS].includes(user?.role);
  const isStudent = user?.role === ROLES.STUDENT;

  const [searchParams, setSearchParams] = useSearchParams();
  const queryTab = searchParams.get('tab');
  const queryStatus = searchParams.get('status');
  const [activeTab, setActiveTab] = useState(queryTab || 'invoices'); // 'invoices' | 'structures' | 'payments'

  useEffect(() => {
    if (queryTab) setActiveTab(queryTab);
    if (queryStatus) setStatusFilter(queryStatus);
  }, [queryTab, queryStatus]);
  const [invoices, setInvoices] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);
  const [payments, setPayments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [students, setStudents] = useState([]);
  const [gatewayStatus, setGatewayStatus] = useState(null);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [isWaiverModalOpen, setIsWaiverModalOpen] = useState(false);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Forms
  const [planForm, setPlanForm] = useState({
    title: 'B.Tech Regular Academic Fee 2025-26',
    department: '',
    academicYear: '2025-2026',
    semester: 3,
    feeCategory: 'composite',
    tuitionFee: 35000,
    labFee: 5000,
    libraryFee: 2000,
    examFee: 1500,
    otherFee: 1000,
    dueDate: '2026-11-30'
  });

  const [invoiceForm, setInvoiceForm] = useState({
    student: '',
    feeStructure: '',
    title: 'Semester 3 Academic Tuition & Lab Dues',
    academicYear: '2025-2026',
    semester: 3,
    amountDue: 44500,
    dueDate: '2026-11-30'
  });

  const [waiverForm, setWaiverForm] = useState({
    type: 'waiver',
    amount: 5000,
    reason: 'Merit-based institutional tuition concession'
  });

  const [paymentForm, setPaymentForm] = useState({
    student: '',
    invoice: '',
    amountPaid: 44500,
    paymentMethod: 'UPI',
    transactionReference: '',
    remarks: 'Fee payment verified at cashier counter'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [invRes, structRes, payRes, deptRes, gwRes, studRes] = await Promise.all([
        api.getInvoices().catch(() => ({ data: [], meta: {} })),
        api.getFeeStructures().catch(() => ({ data: [] })),
        api.getPayments().catch(() => ({ data: [] })),
        api.getDepartments().catch(() => ({ data: [] })),
        api.getGatewayStatus().catch(() => ({ data: null })),
        isStaff ? api.getStudents({ limit: 100 }).catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
      ]);

      if (invRes?.data) {
        setInvoices(invRes.data);
        if (invRes.meta?.summary) setSummary(invRes.meta.summary);
      }
      if (structRes?.data) setFeeStructures(structRes.data);
      if (payRes?.data) setPayments(payRes.data);
      if (deptRes?.data) {
        setDepartments(deptRes.data);
        if (deptRes.data.length > 0 && !planForm.department) {
          setPlanForm((prev) => ({ ...prev, department: deptRes.data[0]._id }));
        }
      }
      if (gwRes?.data) setGatewayStatus(gwRes.data);
      if (studRes?.data) {
        setStudents(studRes.data);
        if (studRes.data.length > 0 && !invoiceForm.student) {
          setInvoiceForm((prev) => ({ ...prev, student: studRes.data[0]._id }));
        }
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Error loading fee schedules',
        message: err.message
      });
    } finally {
      setIsLoading(false);
    }
  }, [addToast, isStaff]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.createFeeStructure({
        ...planForm,
        tuitionFee: Number(planForm.tuitionFee),
        labFee: Number(planForm.labFee),
        libraryFee: Number(planForm.libraryFee),
        examFee: Number(planForm.examFee),
        otherFee: Number(planForm.otherFee),
        totalAmount:
          Number(planForm.tuitionFee) +
          Number(planForm.labFee) +
          Number(planForm.libraryFee) +
          Number(planForm.examFee) +
          Number(planForm.otherFee)
      });
      addToast({ type: 'success', title: 'Fee Plan Created', message: 'New fee structure plan published.' });
      setIsCreatePlanOpen(false);
      loadData();
    } catch (err) {
      addToast({ type: 'error', title: 'Creation Failed', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchivePlan = async (id) => {
    if (!window.confirm('Are you sure you want to archive this fee plan? Historical records will be preserved.')) return;
    try {
      await api.archiveFeeStructure(id);
      addToast({ type: 'success', title: 'Fee Plan Archived', message: 'The plan was moved to archive.' });
      loadData();
    } catch (err) {
      addToast({ type: 'error', title: 'Archival Failed', message: err.message });
    }
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.createInvoice({
        ...invoiceForm,
        amountDue: Number(invoiceForm.amountDue)
      });
      addToast({ type: 'success', title: 'Invoice Issued', message: 'Student dues invoice generated successfully.' });
      setIsCreateInvoiceOpen(false);
      loadData();
    } catch (err) {
      addToast({ type: 'error', title: 'Failed to Issue Invoice', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyWaiver = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setIsSubmitting(true);
    try {
      await api.applyInvoiceAdjustment(selectedInvoice._id, {
        type: waiverForm.type,
        amount: Number(waiverForm.amount),
        reason: waiverForm.reason
      });
      addToast({ type: 'success', title: 'Adjustment Applied', message: `₹${waiverForm.amount} ${waiverForm.type} recorded.` });
      setIsWaiverModalOpen(false);
      setSelectedInvoice(null);
      loadData();
    } catch (err) {
      addToast({ type: 'error', title: 'Adjustment Failed', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.recordPayment({
        ...paymentForm,
        amountPaid: Number(paymentForm.amountPaid)
      });
      addToast({
        type: 'success',
        title: 'Payment Recorded',
        message: `Official Receipt ${res.data?.receiptNumber || ''} generated.`
      });
      setIsRecordPaymentOpen(false);
      loadData();
    } catch (err) {
      addToast({ type: 'error', title: 'Payment Recording Failed', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewReceipt = async (paymentId) => {
    try {
      const res = await api.getReceipt(paymentId);
      if (res?.data) {
        setSelectedReceipt(res.data);
        setIsReceiptModalOpen(true);
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Receipt Unavailable', message: err.message });
    }
  };

  const handleExportCsv = () => {
    window.open('/api/v1/fees/invoices/export', '_blank');
  };

  // Filtered invoices
  const filteredInvoices = invoices.filter((inv) => {
    if (statusFilter !== 'all' && inv.derivedStatus !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const roll = inv.student?.rollNumber?.toLowerCase() || '';
      const name = inv.student?.user?.name?.toLowerCase() || '';
      const invNum = inv.invoiceNumber?.toLowerCase() || '';
      return roll.includes(q) || name.includes(q) || invNum.includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-navy-950 flex items-center">
            <CreditCard className="w-6 h-6 mr-2.5 text-teal-600" />
            Fee Schedules, Dues & Ledgers
          </h1>
          <p className="text-xs sm:text-sm text-navy-600 mt-1">
            Institutional fee plans, student dues calculation, tamper-evident payment receipts, and authorized waivers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isStaff && (
            <>
              <Button variant="secondary" size="sm" onClick={handleExportCsv}>
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Export Ledger (CSV)
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setIsCreateInvoiceOpen(true)}>
                <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                Issue Invoice
              </Button>
              <Button variant="primary" size="sm" onClick={() => setIsCreatePlanOpen(true)}>
                <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                New Fee Plan
              </Button>
            </>
          )}
          <Button variant="ghost" size="sm" onClick={loadData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Honest Gateway Configuration Banner */}
      {gatewayStatus && !gatewayStatus.isConfigured && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start space-x-3 text-amber-900">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold">Payment Gateway Setup Notice: </span>
            {gatewayStatus.details} Institutional cashier counter and DemandDraft/Cheque modes are fully operational.
          </div>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatWidget
          title="Total Invoiced Dues"
          value={`₹${(summary?.totalInvoiced || 0).toLocaleString('en-IN')}`}
          icon={Receipt}
          color="navy"
          subtitle="All academic cohorts"
        />
        <StatWidget
          title="Verified Collections"
          value={`₹${(summary?.totalCollected || 0).toLocaleString('en-IN')}`}
          icon={TrendingUp}
          color="emerald"
          subtitle="Cleared bank transactions"
        />
        <StatWidget
          title="Net Outstanding Balance"
          value={`₹${(summary?.totalOutstanding || 0).toLocaleString('en-IN')}`}
          icon={DollarSign}
          color="rose"
          subtitle="Calculated live on server"
        />
        <StatWidget
          title="Authorized Waivers"
          value={`₹${(summary?.totalWaivers || 0).toLocaleString('en-IN')}`}
          icon={Percent}
          color="teal"
          subtitle="Scholarships & concessions"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-navy-200 flex space-x-6">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center ${
            activeTab === 'invoices' ? 'border-teal-600 text-teal-700' : 'border-transparent text-navy-500 hover:text-navy-900'
          }`}
        >
          <Receipt className="w-4 h-4 mr-2" />
          Student Dues & Invoices ({filteredInvoices.length})
        </button>
        <button
          onClick={() => setActiveTab('structures')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center ${
            activeTab === 'structures' ? 'border-teal-600 text-teal-700' : 'border-transparent text-navy-500 hover:text-navy-900'
          }`}
        >
          <Calendar className="w-4 h-4 mr-2" />
          Fee Plans & Schedules ({feeStructures.length})
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center ${
            activeTab === 'payments' ? 'border-teal-600 text-teal-700' : 'border-transparent text-navy-500 hover:text-navy-900'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Verified Transactions & Receipts ({payments.length})
        </button>
      </div>

      {/* Tab 1: Invoices */}
      {activeTab === 'invoices' && (
        <Card className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-navy-400" />
              <input
                type="text"
                placeholder="Search roll, name, invoice..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-navy-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <span className="text-xs text-navy-500 font-medium">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-xl border border-navy-200 bg-white"
              >
                <option value="all">All Invoices</option>
                <option value="unpaid">Unpaid</option>
                <option value="partial">Partially Paid</option>
                <option value="paid">Fully Settled</option>
                <option value="waived">Waived</option>
              </select>
            </div>
          </div>

          <Table
            columns={[
              {
                header: 'Invoice #',
                render: (row) => (
                  <div>
                    <span className="font-mono font-bold text-navy-950 block">{row.invoiceNumber}</span>
                    <span className="text-[10px] text-navy-500">{row.academicYear} • Sem {row.semester}</span>
                  </div>
                )
              },
              {
                header: 'Student',
                render: (row) => (
                  <div>
                    <span className="font-semibold text-navy-900 block">{row.student?.user?.name || 'Student Account'}</span>
                    <span className="text-[10px] font-mono text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                      {row.student?.rollNumber || 'N/A'}
                    </span>
                  </div>
                )
              },
              {
                header: 'Amount Due',
                render: (row) => <span className="font-medium text-navy-900">₹{(row.amountDue || 0).toLocaleString('en-IN')}</span>
              },
              {
                header: 'Waivers',
                render: (row) => (
                  <span className={row.totalWaivers > 0 ? 'text-teal-700 font-semibold' : 'text-navy-400'}>
                    ₹{(row.totalWaivers || 0).toLocaleString('en-IN')}
                  </span>
                )
              },
              {
                header: 'Paid',
                render: (row) => (
                  <span className={row.totalVerifiedPayments > 0 ? 'text-emerald-700 font-semibold' : 'text-navy-400'}>
                    ₹{(row.totalVerifiedPayments || 0).toLocaleString('en-IN')}
                  </span>
                )
              },
              {
                header: 'Outstanding Balance',
                render: (row) => (
                  <span className={`font-bold ${row.outstandingBalance > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                    ₹{(row.outstandingBalance || 0).toLocaleString('en-IN')}
                  </span>
                )
              },
              {
                header: 'Status',
                render: (row) => {
                  const s = row.derivedStatus;
                  if (s === 'paid') return <Badge variant="success">Fully Paid</Badge>;
                  if (s === 'waived') return <Badge variant="teal">Waived</Badge>;
                  if (s === 'partial') return <Badge variant="warning">Partial</Badge>;
                  return <Badge variant="danger">Unpaid</Badge>;
                }
              },
              {
                header: 'Actions',
                render: (row) => (
                  <div className="flex items-center space-x-1.5">
                    {isStaff && row.outstandingBalance > 0 && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedInvoice(row);
                            setWaiverForm((prev) => ({ ...prev, amount: Math.min(5000, row.outstandingBalance) }));
                            setIsWaiverModalOpen(true);
                          }}
                          className="px-2 py-1 text-[11px] rounded bg-teal-50 text-teal-700 hover:bg-teal-100 font-medium"
                          title="Apply Waiver / Scholarship"
                        >
                          Waiver
                        </button>
                        <button
                          onClick={() => {
                            setPaymentForm({
                              student: row.student?._id || '',
                              invoice: row._id,
                              amountPaid: row.outstandingBalance,
                              paymentMethod: 'UPI',
                              transactionReference: '',
                              remarks: `Settlement for invoice ${row.invoiceNumber}`
                            });
                            setIsRecordPaymentOpen(true);
                          }}
                          className="px-2 py-1 text-[11px] rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium"
                          title="Record Cashier Payment"
                        >
                          Collect
                        </button>
                      </>
                    )}
                  </div>
                )
              }
            ]}
            data={filteredInvoices}
            isLoading={isLoading}
            emptyMessage="No fee invoices match the active filter."
          />
        </Card>
      )}

      {/* Tab 2: Fee Plans */}
      {activeTab === 'structures' && (
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-navy-500">
              Department-approved fee heads and semester schedules with institutional component breakdowns.
            </p>
            {isStaff && (
              <Button size="sm" variant="primary" onClick={() => setIsCreatePlanOpen(true)}>
                <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                Create Plan
              </Button>
            )}
          </div>

          <Table
            columns={[
              {
                header: 'Fee Plan Title',
                render: (row) => (
                  <div>
                    <span className="font-semibold text-navy-950 block">{row.title}</span>
                    <span className="text-[10px] text-navy-500">{row.department?.name || 'All Depts'} • Sem {row.semester}</span>
                  </div>
                )
              },
              { header: 'Academic Year', render: (row) => <span className="font-medium text-navy-700">{row.academicYear}</span> },
              { header: 'Tuition Fee', render: (row) => <span>₹{(row.tuitionFee || 0).toLocaleString('en-IN')}</span> },
              { header: 'Lab & Practicals', render: (row) => <span>₹{(row.labFee || 0).toLocaleString('en-IN')}</span> },
              { header: 'Library & Exam', render: (row) => <span>₹{((row.libraryFee || 0) + (row.examFee || 0)).toLocaleString('en-IN')}</span> },
              {
                header: 'Total Plan Amount',
                render: (row) => <span className="font-bold text-teal-800">₹{(row.totalAmount || 0).toLocaleString('en-IN')}</span>
              },
              {
                header: 'Due Date',
                render: (row) => (
                  <span className="text-xs text-navy-600">
                    {row.dueDate ? new Date(row.dueDate).toLocaleDateString() : 'N/A'}
                  </span>
                )
              },
              {
                header: 'Status',
                render: (row) => (row.status === 'archived' ? <Badge variant="neutral">Archived</Badge> : <Badge variant="success">Active</Badge>)
              },
              {
                header: 'Actions',
                render: (row) =>
                  isStaff && row.status !== 'archived' && (
                    <button
                      onClick={() => handleArchivePlan(row._id)}
                      className="text-xs text-rose-600 hover:text-rose-800 p-1 flex items-center"
                      title="Archive Plan"
                    >
                      <Archive className="w-3.5 h-3.5 mr-1" />
                      Archive
                    </button>
                  )
              }
            ]}
            data={feeStructures}
            isLoading={isLoading}
            emptyMessage="No fee structures recorded."
          />
        </Card>
      )}

      {/* Tab 3: Verified Payments */}
      {activeTab === 'payments' && (
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-navy-500">
              Verified cashier payments, verified digital transactions, and official audit receipt logs.
            </p>
            {isStaff && (
              <Button size="sm" variant="secondary" onClick={() => setIsRecordPaymentOpen(true)}>
                <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                Record Counter Payment
              </Button>
            )}
          </div>

          <Table
            columns={[
              {
                header: 'Receipt #',
                render: (row) => (
                  <div>
                    <span className="font-mono font-bold text-teal-700 block">{row.receiptNumber}</span>
                    <span className="text-[10px] text-navy-500">{new Date(row.paymentDate || row.createdAt).toLocaleString()}</span>
                  </div>
                )
              },
              {
                header: 'Student',
                render: (row) => (
                  <div>
                    <span className="font-semibold text-navy-900 block">{row.student?.user?.name || 'Student Account'}</span>
                    <span className="text-[10px] font-mono text-navy-500">{row.student?.rollNumber || 'N/A'}</span>
                  </div>
                )
              },
              {
                header: 'Amount Paid',
                render: (row) => <span className="font-bold text-emerald-700">₹{(row.amountPaid || 0).toLocaleString('en-IN')}</span>
              },
              {
                header: 'Method',
                render: (row) => <Badge variant="neutral">{row.paymentMethod || 'UPI'}</Badge>
              },
              {
                header: 'Reference',
                render: (row) => <span className="text-xs font-mono text-navy-600 truncate max-w-xs">{row.transactionReference || 'N/A'}</span>
              },
              {
                header: 'Verification',
                render: (row) =>
                  row.isVerified ? (
                    <Badge variant="success" dot>
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="warning">Pending</Badge>
                  )
              },
              {
                header: 'Receipt',
                render: (row) => (
                  <Button variant="ghost" size="xs" onClick={() => handleViewReceipt(row._id)}>
                    <Printer className="w-3.5 h-3.5 mr-1 text-teal-600" />
                    Receipt
                  </Button>
                )
              }
            ]}
            data={payments}
            isLoading={isLoading}
            emptyMessage="No payment transactions found."
          />
        </Card>
      )}

      {/* MODAL: Create Fee Plan */}
      <Modal isOpen={isCreatePlanOpen} onClose={() => setIsCreatePlanOpen(false)} title="Create Institutional Fee Plan">
        <form onSubmit={handleCreatePlan} className="space-y-3.5 text-xs">
          <Input
            label="Plan Title"
            value={planForm.title}
            onChange={(e) => setPlanForm({ ...planForm, title: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Department"
              value={planForm.department}
              onChange={(e) => setPlanForm({ ...planForm, department: e.target.value })}
              options={departments.map((d) => ({ label: `${d.code} - ${d.name}`, value: d._id }))}
              required
            />
            <Input
              label="Academic Year"
              value={planForm.academicYear}
              onChange={(e) => setPlanForm({ ...planForm, academicYear: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Semester"
              type="number"
              min={1}
              max={8}
              value={planForm.semester}
              onChange={(e) => setPlanForm({ ...planForm, semester: Number(e.target.value) })}
              required
            />
            <Input
              label="Due Date"
              type="date"
              value={planForm.dueDate}
              onChange={(e) => setPlanForm({ ...planForm, dueDate: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Input
              label="Tuition (₹)"
              type="number"
              value={planForm.tuitionFee}
              onChange={(e) => setPlanForm({ ...planForm, tuitionFee: e.target.value })}
            />
            <Input
              label="Lab Fee (₹)"
              type="number"
              value={planForm.labFee}
              onChange={(e) => setPlanForm({ ...planForm, labFee: e.target.value })}
            />
            <Input
              label="Library (₹)"
              type="number"
              value={planForm.libraryFee}
              onChange={(e) => setPlanForm({ ...planForm, libraryFee: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Exam Fee (₹)"
              type="number"
              value={planForm.examFee}
              onChange={(e) => setPlanForm({ ...planForm, examFee: e.target.value })}
            />
            <Input
              label="Other Fees (₹)"
              type="number"
              value={planForm.otherFee}
              onChange={(e) => setPlanForm({ ...planForm, otherFee: e.target.value })}
            />
          </div>

          <div className="p-2.5 rounded-lg bg-navy-50 border border-navy-200 text-right">
            <span className="text-xs text-navy-600 mr-2">Total Plan Amount:</span>
            <span className="text-sm font-bold text-teal-800">
              ₹
              {(
                Number(planForm.tuitionFee || 0) +
                Number(planForm.labFee || 0) +
                Number(planForm.libraryFee || 0) +
                Number(planForm.examFee || 0) +
                Number(planForm.otherFee || 0)
              ).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setIsCreatePlanOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Publishing...' : 'Publish Fee Plan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Issue Student Invoice */}
      <Modal isOpen={isCreateInvoiceOpen} onClose={() => setIsCreateInvoiceOpen(false)} title="Issue Student Dues Invoice">
        <form onSubmit={handleCreateInvoice} className="space-y-3.5 text-xs">
          <Select
            label="Select Student"
            value={invoiceForm.student}
            onChange={(e) => setInvoiceForm({ ...invoiceForm, student: e.target.value })}
            options={students.map((s) => ({
              label: `${s.rollNumber} - ${s.user?.name || 'Student'} (Sem ${s.currentSemester})`,
              value: s._id
            }))}
            required
          />
          <Input
            label="Invoice Title"
            value={invoiceForm.title}
            onChange={(e) => setInvoiceForm({ ...invoiceForm, title: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Amount Due (INR)"
              type="number"
              value={invoiceForm.amountDue}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, amountDue: e.target.value })}
              required
            />
            <Input
              label="Payment Due Date"
              type="date"
              value={invoiceForm.dueDate}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
              required
            />
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setIsCreateInvoiceOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Issuing...' : 'Generate Invoice'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Apply Fee Waiver */}
      <Modal isOpen={isWaiverModalOpen} onClose={() => setIsWaiverModalOpen(false)} title="Apply Authorized Waiver / Adjustment">
        <form onSubmit={handleApplyWaiver} className="space-y-3.5 text-xs">
          {selectedInvoice && (
            <div className="p-3 bg-navy-50 rounded-lg text-xs space-y-1">
              <p className="font-semibold text-navy-900">
                Invoice: {selectedInvoice.invoiceNumber} ({selectedInvoice.student?.user?.name})
              </p>
              <p className="text-navy-600">
                Current Outstanding Balance:{' '}
                <span className="font-bold text-rose-700">₹{selectedInvoice.outstandingBalance}</span>
              </p>
            </div>
          )}

          <Select
            label="Adjustment Category"
            value={waiverForm.type}
            onChange={(e) => setWaiverForm({ ...waiverForm, type: e.target.value })}
            options={[
              { label: 'Institutional Fee Waiver', value: 'waiver' },
              { label: 'Academic Merit Scholarship', value: 'scholarship' },
              { label: 'Management Concession', value: 'discount' },
              { label: 'Administrative Correction', value: 'correction' }
            ]}
          />

          <Input
            label="Amount (INR)"
            type="number"
            min={1}
            max={selectedInvoice?.outstandingBalance || 100000}
            value={waiverForm.amount}
            onChange={(e) => setWaiverForm({ ...waiverForm, amount: e.target.value })}
            required
          />

          <Input
            label="Official Justification / Approval Order"
            value={waiverForm.reason}
            onChange={(e) => setWaiverForm({ ...waiverForm, reason: e.target.value })}
            placeholder="e.g. Principal order ref CET/SCH/2026/04"
            required
          />

          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setIsWaiverModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Applying...' : 'Authorize Waiver'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Record Cashier Payment */}
      <Modal isOpen={isRecordPaymentOpen} onClose={() => setIsRecordPaymentOpen(false)} title="Record Verified Counter Payment">
        <form onSubmit={handleRecordPayment} className="space-y-3.5 text-xs">
          <Select
            label="Student"
            value={paymentForm.student}
            onChange={(e) => setPaymentForm({ ...paymentForm, student: e.target.value })}
            options={students.map((s) => ({
              label: `${s.rollNumber} - ${s.user?.name || 'Student'}`,
              value: s._id
            }))}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Amount Paid (INR)"
              type="number"
              min={1}
              value={paymentForm.amountPaid}
              onChange={(e) => setPaymentForm({ ...paymentForm, amountPaid: e.target.value })}
              required
            />
            <Select
              label="Payment Method"
              value={paymentForm.paymentMethod}
              onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
              options={[
                { label: 'UPI / QR', value: 'UPI' },
                { label: 'Cash at Counter', value: 'Cash' },
                { label: 'Demand Draft (DD)', value: 'DemandDraft' },
                { label: 'Cheque Clearance', value: 'Cheque' },
                { label: 'NetBanking / NEFT', value: 'NetBanking' }
              ]}
            />
          </div>
          <Input
            label="Transaction / Bank Reference Number"
            value={paymentForm.transactionReference}
            onChange={(e) => setPaymentForm({ ...paymentForm, transactionReference: e.target.value })}
            placeholder="e.g. UTR-928471928471 or DD-482910"
            required
          />
          <Input
            label="Cashier Remarks"
            value={paymentForm.remarks}
            onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
          />

          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setIsRecordPaymentOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Verifying...' : 'Record & Generate Receipt'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Official Server-Verified Payment Receipt */}
      <Modal isOpen={isReceiptModalOpen} onClose={() => setIsReceiptModalOpen(false)} title="Official Verified Payment Receipt">
        {selectedReceipt && (
          <div className="p-4 bg-white border border-navy-200 rounded-xl space-y-4 text-xs">
            <div className="border-b border-navy-200 pb-3 flex justify-between items-start">
              <div>
                <h3 className="font-bold text-sm text-navy-950 uppercase">{selectedReceipt.institution}</h3>
                <p className="text-[10px] text-navy-500">Official Institutional Finance & Cashier Department</p>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-teal-700 block">{selectedReceipt.receiptNumber}</span>
                <span className="text-[10px] text-navy-400">Date: {new Date(selectedReceipt.generatedAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-navy-50/70 p-3 rounded-lg">
              <div>
                <p className="text-navy-500 text-[10px]">Student Name</p>
                <p className="font-semibold text-navy-900">{selectedReceipt.student?.name}</p>
                <p className="text-navy-500 text-[10px] mt-1">Roll Number</p>
                <p className="font-mono text-navy-800">{selectedReceipt.student?.rollNumber}</p>
              </div>
              <div>
                <p className="text-navy-500 text-[10px]">Department</p>
                <p className="font-semibold text-navy-900">{selectedReceipt.student?.department}</p>
                <p className="text-navy-500 text-[10px] mt-1">Semester</p>
                <p className="font-semibold text-navy-800">Sem {selectedReceipt.student?.semester}</p>
              </div>
            </div>

            <div className="border border-navy-100 rounded-lg p-3 space-y-1.5">
              <div className="flex justify-between font-semibold text-navy-900 text-sm">
                <span>Total Amount Paid:</span>
                <span className="text-emerald-700">₹{selectedReceipt.payment?.amount?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-navy-600 text-[11px]">
                <span>Payment Mode:</span>
                <span>{selectedReceipt.payment?.method}</span>
              </div>
              <div className="flex justify-between text-navy-600 text-[11px]">
                <span>Transaction Ref:</span>
                <span className="font-mono">{selectedReceipt.payment?.transactionReference}</span>
              </div>
              <div className="flex justify-between text-navy-600 text-[11px]">
                <span>Authorized Cashier / Verifier:</span>
                <span>{selectedReceipt.payment?.verifiedBy}</span>
              </div>
            </div>

            <div className="p-2.5 rounded bg-teal-50 border border-teal-200 text-teal-900 text-[10px] flex items-center justify-between">
              <span className="flex items-center">
                <CheckCircle2 className="w-4 h-4 text-teal-600 mr-1.5 shrink-0" />
                <span>Digitally Authenticated Server Digest: </span>
                <span className="font-mono font-bold ml-1">{selectedReceipt.verificationDigest}</span>
              </span>
              <span className="text-teal-700 font-semibold">VERIFIED</span>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => window.print()}>
                <Printer className="w-3.5 h-3.5 mr-1" />
                Print Official Copy
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsReceiptModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FeeManagementPage;

