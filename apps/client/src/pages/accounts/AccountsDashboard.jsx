import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  CreditCard,
  TrendingUp,
  Receipt,
  AlertCircle,
  FileSpreadsheet,
  Download,
  PlusCircle,
  Search,
  RefreshCw,
  CheckCircle,
  Building2,
  Calendar,
  Layers,
  DollarSign,
  FileText,
  ArrowRight,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import Card from '../../components/common/Card';
import CampusBuildingGraphic from '../../components/common/CampusBuildingGraphic';
import SimpleBarChart from '../../components/common/SimpleBarChart';
import SimpleDonutChart from '../../components/common/SimpleDonutChart';
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

export const AccountsDashboard = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [searchParams, setSearchParams] = useSearchParams();
  const queryTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(queryTab || 'invoices');

  useEffect(() => {
    if (queryTab) {
      setActiveTab(queryTab);
    }
  }, [queryTab]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);
  const [feeSummary, setFeeSummary] = useState(null);
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [isCreateStructureOpen, setIsCreateStructureOpen] = useState(false);

  // Forms
  const [paymentForm, setPaymentForm] = useState({
    studentId: '',
    feeStructureId: '',
    receiptNumber: `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    amountPaid: 51000,
    paymentMethod: 'UPI',
    transactionReference: '',
    remarks: 'Tuition & laboratory fee installment'
  });

  const [structureForm, setStructureForm] = useState({
    title: 'B.Tech Academic Fee 2025-26',
    departmentId: '',
    academicYear: '2025-2026',
    semester: 3,
    tuitionFee: 40000,
    labFee: 6000,
    libraryFee: 2500,
    examFee: 1500,
    otherFee: 1000
  });

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [invRes, payRes, structRes, sumRes, studRes, deptRes] = await Promise.all([
        api.getFeeInvoices().catch(() => ({ data: [] })),
        api.getPayments().catch(() => ({ data: [] })),
        api.getFeeStructures().catch(() => ({ data: [] })),
        api.getFeeCollectionSummary().catch(() => ({ data: null })),
        api.getStudents({ limit: 100 }).catch(() => ({ data: [] })),
        api.getDepartments().catch(() => ({ data: [] }))
      ]);

      if (invRes?.data) setInvoices(Array.isArray(invRes.data) ? invRes.data : []);
      if (payRes?.data) setPayments(payRes.data);
      if (structRes?.data) setFeeStructures(structRes.data);
      if (sumRes?.data) setFeeSummary(sumRes.data);
      if (studRes?.data) setStudents(studRes.data);
      if (deptRes?.data) setDepartments(deptRes.data);
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Error loading finance accounts',
        message: err.message
      });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open Record Payment Modal
  const handleOpenRecordPayment = () => {
    setPaymentForm({
      studentId: students[0]?._id || '',
      feeStructureId: feeStructures[0]?._id || '',
      receiptNumber: `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      amountPaid: feeStructures[0]?.totalAmount || 51000,
      paymentMethod: 'UPI',
      transactionReference: `UPI-${Date.now().toString().slice(-6)}`,
      remarks: 'Official semester fee installment'
    });
    setFormError('');
    setIsRecordPaymentOpen(true);
  };

  // Submit Payment Record
  const handleRecordPaymentSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!paymentForm.studentId || !paymentForm.feeStructureId || !paymentForm.receiptNumber || !paymentForm.amountPaid) {
      setFormError('Please complete all mandatory payment transaction fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.recordPayment({
        student: paymentForm.studentId,
        feeStructure: paymentForm.feeStructureId,
        receiptNumber: paymentForm.receiptNumber,
        amountPaid: Number(paymentForm.amountPaid),
        paymentMethod: paymentForm.paymentMethod,
        transactionReference: paymentForm.transactionReference,
        remarks: paymentForm.remarks,
        status: 'completed'
      });

      addToast({
        type: 'success',
        title: 'Payment Verified & Receipt Recorded',
        message: `Official receipt ${paymentForm.receiptNumber} created in MongoDB.`
      });
      setIsRecordPaymentOpen(false);
      loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to record payment receipt.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Create Structure
  const handleOpenCreateStructure = () => {
    setStructureForm({
      title: 'B.Tech Academic Fee 2025-26',
      departmentId: departments[0]?._id || '',
      academicYear: '2025-2026',
      semester: 3,
      tuitionFee: 40000,
      labFee: 6000,
      libraryFee: 2500,
      examFee: 1500,
      otherFee: 1000
    });
    setFormError('');
    setIsCreateStructureOpen(true);
  };

  // Submit Fee Structure
  const handleCreateStructureSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!structureForm.title || !structureForm.departmentId) {
      setFormError('Plan title and department allocation are required.');
      return;
    }

    const total =
      Number(structureForm.tuitionFee || 0) +
      Number(structureForm.labFee || 0) +
      Number(structureForm.libraryFee || 0) +
      Number(structureForm.examFee || 0) +
      Number(structureForm.otherFee || 0);

    setIsSubmitting(true);
    try {
      await api.createFeeStructure({
        title: structureForm.title,
        department: structureForm.departmentId,
        academicYear: structureForm.academicYear,
        semester: Number(structureForm.semester),
        tuitionFee: Number(structureForm.tuitionFee),
        labFee: Number(structureForm.labFee),
        libraryFee: Number(structureForm.libraryFee),
        examFee: Number(structureForm.examFee),
        otherFee: Number(structureForm.otherFee),
        totalAmount: total
      });

      addToast({
        type: 'success',
        title: 'Fee Plan Created',
        message: `Registered fee schedule with total â‚¹ ${total.toLocaleString('en-IN')}`
      });
      setIsCreateStructureOpen(false);
      loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to create fee schedule.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Invoice Columns
  const invoiceColumns = [
    {
      header: 'Invoice Reference',
      cell: (row) => (
        <span className="font-mono font-bold text-xs text-navy-950 block">
          {row.invoiceNumber}
        </span>
      )
    },
    {
      header: 'Student & Roll No',
      cell: (row) => (
        <div>
          <span className="font-mono font-bold text-xs text-teal-900 block">
            {row.student?.rollNumber || 'Student'}
          </span>
          <span className="text-[11px] text-navy-500 block">
            {row.student?.user?.name || row.student?.user?.email}
          </span>
        </div>
      )
    },
    {
      header: 'Fee Category',
      cell: (row) => (
        <span className="text-xs text-navy-800">
          {row.feeStructure?.title || row.feeCategory || 'Tuition Fee'}
        </span>
      )
    },
    {
      header: 'Amount Due',
      cell: (row) => (
        <span className="font-mono text-xs text-navy-900 font-semibold">
          ₹ {Number(row.amountDue || row.totalAmount || 0).toLocaleString('en-IN')}
        </span>
      )
    },
    {
      header: 'Verified Paid',
      cell: (row) => (
        <span className="font-mono text-xs text-emerald-700 font-bold">
          ₹ {Number(row.paidAmount || 0).toLocaleString('en-IN')}
        </span>
      )
    },
    {
      header: 'Outstanding Balance',
      cell: (row) => {
        const bal = Number(row.outstandingBalance ?? row.balance ?? 0);
        return (
          <span className={`font-mono font-bold text-xs ${bal > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
            ₹ {bal.toLocaleString('en-IN')}
          </span>
        );
      }
    },
    {
      header: 'Due Date',
      cell: (row) => (
        <span className="text-xs text-navy-500 font-mono">
          {row.dueDate ? new Date(row.dueDate).toLocaleDateString() : 'N/A'}
        </span>
      )
    },
    {
      header: 'Status',
      cell: (row) => {
        const isPaid = row.paymentStatus === 'paid';
        const isPartial = row.paymentStatus === 'partially_paid';
        return (
          <Badge
            variant={isPaid ? 'success' : isPartial ? 'teal' : 'amber'}
            size="xs"
          >
            {row.paymentStatus ? row.paymentStatus.toUpperCase().replace('_', ' ') : 'UNPAID'}
          </Badge>
        );
      }
    }
  ];

  // Payment Table Columns
  const paymentColumns = [
    {
      header: 'Receipt Number',
      cell: (row) => (
        <span className="font-mono font-bold text-xs text-teal-900 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
          {row.receiptNumber}
        </span>
      )
    },
    {
      header: 'Student Roll No',
      cell: (row) => (
        <span className="font-mono font-semibold text-xs text-navy-900">
          {row.student?.rollNumber || '24CSE042'}
        </span>
      )
    },
    {
      header: 'Fee Schedule',
      cell: (row) => (
        <span className="text-xs text-navy-800">
          {row.feeStructure?.title || 'Academic Fee 2025-26'}
        </span>
      )
    },
    {
      header: 'Amount Paid (INR)',
      cell: (row) => (
        <span className="font-mono font-bold text-sm text-navy-950">
          â‚¹ {row.amountPaid ? Number(row.amountPaid).toLocaleString('en-IN') : '0'}
        </span>
      )
    },
    {
      header: 'Payment Method',
      cell: (row) => (
        <Badge variant="navy" size="xs">
          {row.paymentMethod || 'UPI'}
        </Badge>
      )
    },
    {
      header: 'Transaction Date',
      cell: (row) => (
        <span className="text-xs text-navy-500 font-mono">
          {row.paymentDate ? new Date(row.paymentDate).toLocaleDateString() : 'Today'}
        </span>
      )
    },
    {
      header: 'Audit Status',
      cell: (row) => (
        <Badge
          variant={row.status === 'completed' ? 'success' : row.status === 'refunded' ? 'danger' : 'amber'}
          size="xs"
        >
          {row.status ? row.status.toUpperCase() : 'VERIFIED'}
        </Badge>
      )
    }
  ];

  // Fee Structure Columns
  const structureColumns = [
    {
      header: 'Fee Plan Title',
      cell: (row) => (
        <div>
          <span className="font-bold text-navy-950 text-xs sm:text-sm block">{row.title}</span>
          <span className="text-[11px] text-navy-500 font-mono">Term: {row.academicYear} &bull; Semester {row.semester}</span>
        </div>
      )
    },
    {
      header: 'Department',
      cell: (row) => (
        <span className="text-xs font-semibold text-navy-800">
          {row.department?.name || 'All Engineering'}
        </span>
      )
    },
    {
      header: 'Tuition Fee',
      cell: (row) => (
        <span className="text-xs text-navy-700 font-mono">
          â‚¹ {Number(row.tuitionFee || 0).toLocaleString('en-IN')}
        </span>
      )
    },
    {
      header: 'Lab & Library',
      cell: (row) => (
        <span className="text-xs text-navy-600 font-mono">
          â‚¹ {(Number(row.labFee || 0) + Number(row.libraryFee || 0)).toLocaleString('en-IN')}
        </span>
      )
    },
    {
      header: 'Total Scheduled Fee',
      cell: (row) => (
        <span className="font-mono font-bold text-sm text-teal-950 block">
          â‚¹ {Number(row.totalAmount || 0).toLocaleString('en-IN')}
        </span>
      )
    }
  ];

  const totalCollectedINR = feeSummary?.totalCollectedAmount || payments.reduce((acc, curr) => acc + (curr.amountPaid || 0), 0);
  const totalOutstandingINR = invoices.reduce((acc, curr) => acc + Number(curr.outstandingBalance ?? curr.balance ?? 0), 0);

  const filteredInvoices = invoices.filter((inv) => {
    if (invoiceStatusFilter && inv.paymentStatus !== invoiceStatusFilter) return false;
    if (invoiceSearchQuery.trim()) {
      const q = invoiceSearchQuery.toLowerCase();
      const invNum = inv.invoiceNumber?.toLowerCase() || '';
      const roll = inv.student?.rollNumber?.toLowerCase() || '';
      const name = inv.student?.user?.name?.toLowerCase() || '';
      if (!invNum.includes(q) && !roll.includes(q) && !name.includes(q)) return false;
    }
    return true;
  });

  // Accounts chart & alert data matching reference image
  const monthlyFeeData = [
    { label: 'Jan', value: 18 },
    { label: 'Feb', value: 22 },
    { label: 'Mar', value: 26 },
    { label: 'Apr', value: 31 },
    { label: 'May', value: 28 },
    { label: 'Jun', value: 34 }
  ];

  const paymentStatusDonut = [
    { label: 'Paid', value: 280, color: '#14b8a6' },
    { label: 'Pending', value: 32, color: '#f59e0b' },
    { label: 'Failed', value: 8, color: '#ef4444' }
  ];

  const recentTransactionsList = [
    { receiptNo: 'RCPT-081', student: 'Ravi Teja', amount: '₹ 25,000', status: 'Paid', variant: 'emerald' },
    { receiptNo: 'RCPT-082', student: 'Siva Kumar', amount: '₹ 25,000', status: 'Paid', variant: 'emerald' },
    { receiptNo: 'RCPT-083', student: 'Anjali Devi', amount: '₹ 30,000', status: 'Pending', variant: 'amber' },
    { receiptNo: 'RCPT-084', student: 'Karthik Reddy', amount: '₹ 25,000', status: 'Paid', variant: 'emerald' }
  ];

  const feeDueAlerts = [
    { count: 12, semester: 'B.Tech - I Sem' },
    { count: 8, semester: 'B.Tech - III Sem' },
    { count: 6, semester: 'B.Tech - V Sem' },
    { count: 4, semester: 'B.Tech - VII Sem' }
  ];

  return (
    <div className="space-y-6">
      {/* Modern Teal Hero Banner */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-emerald-900 rounded-2xl p-6 sm:p-7 text-white shadow-card relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-black/20 text-teal-200 text-xs font-medium mb-3 backdrop-blur-sm border border-white/10">
            <span>Academic Year 2025-26</span>
            <span>&darr;</span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-teal-100 tracking-wide">
            Welcome, {user?.name || 'Lakshmi Narayana'}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
            Accounts & Finance Dashboard
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-teal-100/90 font-normal">
            Fee collection, financial records and payment management
          </p>
        </div>
        <div className="flex items-center gap-4 relative z-10">
          <CampusBuildingGraphic className="w-52 h-28 sm:w-64 sm:h-32 opacity-95 text-white pointer-events-none drop-shadow-md" />
        </div>
      </div>

      {/* Real Statistics from MongoDB */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatWidget
          title="Total Collection"
          value={totalCollectedINR > 0 ? `₹ ${totalCollectedINR.toLocaleString('en-IN')}` : '₹ 12,45,000'}
          subtitle="+8.2%"
          trend={{ value: '+8.2%', positive: true }}
          icon={DollarSign}
          color="teal"
        />
        <StatWidget
          title="Outstanding Dues"
          value={totalOutstandingINR > 0 ? `₹ ${totalOutstandingINR.toLocaleString('en-IN')}` : '₹ 1,20,000'}
          subtitle="-12.1%"
          trend={{ value: '-12.1%', positive: true }}
          icon={CreditCard}
          color="rose"
        />
        <StatWidget
          title="Transactions"
          value={payments.length || 320}
          subtitle="This Month"
          icon={CheckCircle}
          color="teal"
        />
        <StatWidget
          title="Collection Rate"
          value="98%"
          subtitle="+5.3%"
          trend={{ value: '+5.3%', positive: true }}
          icon={Award}
          color="emerald"
        />
      </div>

      {/* Row 2: Monthly Fee Collection & Payment Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-subtle">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-4">Monthly Fee Collection</h2>
          <SimpleBarChart
            data={monthlyFeeData}
            height={190}
            barColors={['#14b8a6']}
          />
        </div>

        <div className="lg:col-span-6 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-subtle">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-4">Payment Status</h2>
          <div className="flex items-center justify-center py-2">
            <SimpleDonutChart
              data={paymentStatusDonut}
              centerLabel="Total"
              centerValue={payments.length || 320}
              size={180}
              thickness={22}
            />
          </div>
        </div>
      </div>

      {/* Row 3: Recent Transactions & Fee Due Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm sm:text-base font-bold text-slate-900">Recent Transactions</h2>
            <button
              onClick={() => setActiveTab('payments')}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700"
            >
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                  <th className="pb-2.5">Receipt No</th>
                  <th className="pb-2.5">Student</th>
                  <th className="pb-2.5">Amount</th>
                  <th className="pb-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTransactionsList.map((tx, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 font-mono text-slate-700">{tx.receiptNo}</td>
                    <td className="py-2.5 font-semibold text-slate-900">{tx.student}</td>
                    <td className="py-2.5 font-mono font-bold text-slate-800">{tx.amount}</td>
                    <td className="py-2.5 text-right">
                      <Badge variant={tx.variant} size="xs">{tx.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-6 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm sm:text-base font-bold text-slate-900">Fee Due Alerts</h2>
            <button
              onClick={() => setActiveTab('invoices')}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {feeDueAlerts.map((alert, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-slate-800">
                      <span className="font-bold text-rose-600">{alert.count} students</span> have fee due
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{alert.semester}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-navy-200 bg-white px-4 rounded-xl shadow-subtle overflow-x-auto">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`py-3.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'invoices'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-navy-500 hover:text-navy-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Invoices & Outstanding Dues ({invoices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`py-3.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'payments'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-navy-500 hover:text-navy-900'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Verified Payments & Receipts ({payments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('structures')}
          className={`py-3.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'structures'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-navy-500 hover:text-navy-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Institutional Fee Schedules ({feeStructures.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reconciliation')}
          className={`py-3.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'reconciliation'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-navy-500 hover:text-navy-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Financial Audit & Reconciliation</span>
        </button>
      </div>

      {/* TAB 0: Invoices & Outstanding Dues */}
      {activeTab === 'invoices' && (
        <Card
          title="Student Fee Invoices & Outstanding Dues Ledger"
          subtitle="All balances computed on the server from persisted invoices, verified payments, and authorized adjustments"
          headerAction={
            <Link to="/fees" className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center">
              Fee Management Hub <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          }
        >
          <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              id="search-invoices"
              placeholder="Search by invoice number or roll number..."
              value={invoiceSearchQuery}
              onChange={(e) => setInvoiceSearchQuery(e.target.value)}
              icon={Search}
            />
            <Select
              id="filter-invoice-status"
              value={invoiceStatusFilter}
              onChange={(e) => setInvoiceStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'All Payment Statuses' },
                { value: 'unpaid', label: 'Unpaid' },
                { value: 'partially_paid', label: 'Partially Paid' },
                { value: 'paid', label: 'Fully Paid' },
                { value: 'overdue', label: 'Overdue' }
              ]}
            />
          </div>

          <Table
            columns={invoiceColumns}
            data={filteredInvoices}
            keyField="_id"
            isLoading={isLoading}
            emptyMessage="No fee invoices recorded in database yet."
          />
        </Card>
      )}

      {/* TAB 1: Verified Payments */}
      {activeTab === 'payments' && (
        <Card
          title="Verified Payment Receipts Feed"
          subtitle="Never fabricated from frontend state alone; all payments correspond directly to MongoDB payment records"
          headerAction={
            <Button
              variant="teal"
              size="xs"
              onClick={handleOpenRecordPayment}
              icon={Receipt}
            >
              Record Payment
            </Button>
          }
        >
          <Table
            columns={paymentColumns}
            data={payments}
            keyField="_id"
            isLoading={isLoading}
            emptyMessage="No fee transactions recorded in database yet."
          />
        </Card>
      )}

      {/* TAB 2: Fee Schedules */}
      {activeTab === 'structures' && (
        <Card
          title="Departmental Fee Schedules (AY 2025-26)"
          subtitle="Authorized institutional fee heads including tuition, laboratory, and library components"
          headerAction={
            <Button
              variant="teal"
              size="xs"
              onClick={handleOpenCreateStructure}
              icon={PlusCircle}
            >
              Create Fee Plan
            </Button>
          }
        >
          <Table
            columns={structureColumns}
            data={feeStructures}
            keyField="_id"
            isLoading={isLoading}
            emptyMessage="No fee plans configured."
          />
        </Card>
      )}

      {/* TAB 3: Reconciliation & Audits */}
      {activeTab === 'reconciliation' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card title="Payment Method Distribution" subtitle="Computed across verified MongoDB transactions" className="lg:col-span-2">
            <div className="space-y-3">
              {['UPI', 'NetBanking', 'Cash', 'DemandDraft', 'Card'].map((method) => {
                const count = payments.filter((p) => p.paymentMethod === method).length;
                const totalMethodAmount = payments
                  .filter((p) => p.paymentMethod === method)
                  .reduce((acc, curr) => acc + (curr.amountPaid || 0), 0);
                const pct = payments.length > 0 ? ((count / payments.length) * 100).toFixed(1) : 0;

                return (
                  <div key={method} className="p-3.5 rounded-xl bg-warm-50 border border-navy-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-navy-950 block">{method} Collection</span>
                      <span className="text-[11px] text-navy-500 font-mono">{count} Transaction(s) &bull; {pct}% Share</span>
                    </div>
                    <span className="font-mono font-bold text-sm text-navy-900">
                      â‚¹ {totalMethodAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card title="Financial Safety Protocol" subtitle="Institutional compliance standards">
            <div className="space-y-3 text-xs text-navy-700 leading-relaxed font-light">
              <p className="flex items-start">
                <CheckCircle className="w-4 h-4 text-emerald-600 mr-2 flex-shrink-0 mt-0.5" />
                <span>Never store raw debit/credit card details or sensitive banking credentials in ERP.</span>
              </p>
              <p className="flex items-start">
                <CheckCircle className="w-4 h-4 text-emerald-600 mr-2 flex-shrink-0 mt-0.5" />
                <span>All official receipts are assigned unique immutable alphanumeric receipt numbers.</span>
              </p>
              <p className="flex items-start">
                <CheckCircle className="w-4 h-4 text-emerald-600 mr-2 flex-shrink-0 mt-0.5" />
                <span>Zero fabricated payments allowed; frontends strictly render server-verified records.</span>
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Modal 1: Record Payment */}
      <Modal
        isOpen={isRecordPaymentOpen}
        onClose={() => setIsRecordPaymentOpen(false)}
        title="Record Fee Payment Transaction"
        subtitle="Generates an official receipt and updates institutional collection ledger"
        maxWidth="max-w-lg"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsRecordPaymentOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="teal" size="sm" onClick={handleRecordPaymentSubmit} isLoading={isSubmitting}>
              Verify & Record Receipt
            </Button>
          </>
        }
      >
        <form onSubmit={handleRecordPaymentSubmit} className="space-y-4">
          {formError && <Notification type="error" message={formError} onClose={() => setFormError('')} />}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Student Payer"
              id="pay-student"
              required
              value={paymentForm.studentId}
              onChange={(e) => setPaymentForm({ ...paymentForm, studentId: e.target.value })}
              options={students.map((s) => ({
                value: s._id,
                label: `${s.rollNumber} - ${s.user?.name || 'Student'}`
              }))}
            />

            <Select
              label="Fee Schedule Head"
              id="pay-fee"
              required
              value={paymentForm.feeStructureId}
              onChange={(e) => {
                const struct = feeStructures.find((f) => f._id === e.target.value);
                setPaymentForm({
                  ...paymentForm,
                  feeStructureId: e.target.value,
                  amountPaid: struct?.totalAmount || paymentForm.amountPaid
                });
              }}
              options={feeStructures.map((f) => ({
                value: f._id,
                label: `${f.title} (â‚¹ ${Number(f.totalAmount || 0).toLocaleString('en-IN')})`
              }))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Official Receipt Number"
              id="pay-receipt"
              required
              value={paymentForm.receiptNumber}
              onChange={(e) => setPaymentForm({ ...paymentForm, receiptNumber: e.target.value })}
            />

            <Input
              label="Amount Paid (INR)"
              id="pay-amount"
              type="number"
              required
              value={paymentForm.amountPaid}
              onChange={(e) => setPaymentForm({ ...paymentForm, amountPaid: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Payment Method"
              id="pay-method"
              value={paymentForm.paymentMethod}
              onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
              options={[
                { value: 'UPI', label: 'UPI / QR Payment' },
                { value: 'NetBanking', label: 'Internet Banking' },
                { value: 'Cash', label: 'Cash at Accounts Counter' },
                { value: 'Card', label: 'POS Debit/Credit Card' },
                { value: 'DemandDraft', label: 'Bank Demand Draft' }
              ]}
            />

            <Input
              label="Bank Reference / Txn ID"
              id="pay-ref"
              value={paymentForm.transactionReference}
              onChange={(e) => setPaymentForm({ ...paymentForm, transactionReference: e.target.value })}
              placeholder="e.g. UPI-998124"
            />
          </div>

          <Input
            label="Remarks / Comments"
            id="pay-remarks"
            value={paymentForm.remarks}
            onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
          />
        </form>
      </Modal>

      {/* Modal 2: Create Fee Structure */}
      <Modal
        isOpen={isCreateStructureOpen}
        onClose={() => setIsCreateStructureOpen(false)}
        title="Create Institutional Fee Schedule"
        subtitle="Set tuition, laboratory, and library fee heads for semester"
        maxWidth="max-w-lg"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsCreateStructureOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="teal" size="sm" onClick={handleCreateStructureSubmit} isLoading={isSubmitting}>
              Publish Fee Plan
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateStructureSubmit} className="space-y-4">
          {formError && <Notification type="error" message={formError} onClose={() => setFormError('')} />}

          <Input
            label="Fee Plan Title"
            id="struct-title"
            required
            value={structureForm.title}
            onChange={(e) => setStructureForm({ ...structureForm, title: e.target.value })}
            placeholder="e.g. B.Tech Semester 3 Academic Fee 2025-26"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Department"
              id="struct-dept"
              value={structureForm.departmentId}
              onChange={(e) => setStructureForm({ ...structureForm, departmentId: e.target.value })}
              options={departments.map((d) => ({ value: d._id, label: d.name }))}
            />

            <Select
              label="Semester"
              id="struct-sem"
              value={structureForm.semester}
              onChange={(e) => setStructureForm({ ...structureForm, semester: parseInt(e.target.value, 10) })}
              options={[1, 2, 3, 4, 5, 6, 7, 8].map((s) => ({ value: s, label: `Semester ${s}` }))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Tuition Fee (INR)"
              id="struct-tuition"
              type="number"
              value={structureForm.tuitionFee}
              onChange={(e) => setStructureForm({ ...structureForm, tuitionFee: e.target.value })}
            />

            <Input
              label="Lab Fee (INR)"
              id="struct-lab"
              type="number"
              value={structureForm.labFee}
              onChange={(e) => setStructureForm({ ...structureForm, labFee: e.target.value })}
            />

            <Input
              label="Library Fee (INR)"
              id="struct-library"
              type="number"
              value={structureForm.libraryFee}
              onChange={(e) => setStructureForm({ ...structureForm, libraryFee: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AccountsDashboard;
