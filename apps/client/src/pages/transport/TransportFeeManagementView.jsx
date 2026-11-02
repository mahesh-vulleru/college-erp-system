import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  DollarSign,
  Receipt,
  Printer,
  Download,
  Plus,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  UserCheck
} from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../api/apiClient';

export const TransportFeeManagementView = ({ routes = [] }) => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [activeTabSection, setActiveTabSection] = useState('fees'); // fees, structures
  const [feeRecords, setFeeRecords] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);
  const [financialSummary, setFinancialSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [payingRecord, setPayingRecord] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Online Payment');
  const [payTxnRef, setPayTxnRef] = useState('');
  const [isSubmittingPay, setIsSubmittingPay] = useState(false);

  const [isAddStructureOpen, setIsAddStructureOpen] = useState(false);
  const [structureForm, setStructureForm] = useState({
    academicYear: '2025-2026',
    route: '',
    feeCategory: 'Regular',
    annualFee: '',
    semesterFee: '',
    dueDate: ''
  });

  const [activeReceipt, setActiveReceipt] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [feeRes, structRes, sumRes] = await Promise.all([
        api.getStudentTransportFees({
          search,
          status: statusFilter
        }),
        api.getFeeStructures(),
        api.getTransportFinancialSummary()
      ]);

      if (feeRes && feeRes.data) setFeeRecords(feeRes.data);
      if (structRes && structRes.data) setFeeStructures(structRes.data);
      if (sumRes && sumRes.data) setFinancialSummary(sumRes.data);
    } catch (err) {
      addToast(err.message || 'Failed to fetch transport fee data', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    const amt = Number(payAmount);
    if (!amt || amt <= 0) {
      addToast('Please enter a valid payment amount', 'error');
      return;
    }

    if (amt > payingRecord.pendingAmount) {
      addToast(`Payment amount cannot exceed pending balance (₹${payingRecord.pendingAmount})`, 'error');
      return;
    }

    try {
      setIsSubmittingPay(true);
      const res = await api.recordFeePayment(payingRecord._id, {
        amount: amt,
        paymentMethod: payMethod,
        transactionReference: payTxnRef
      });

      if (res.success) {
        addToast(res.message, 'success');
        setPayingRecord(null);
        setPayAmount('');
        setPayTxnRef('');
        if (res.receipt) {
          setActiveReceipt(res.receipt);
        }
        fetchData();
      }
    } catch (err) {
      addToast(err.message || 'Payment processing failed', 'error');
    } finally {
      setIsSubmittingPay(false);
    }
  };

  const handleCreateStructure = async (e) => {
    e.preventDefault();
    if (!structureForm.route || !structureForm.annualFee) {
      addToast('Please select route and specify annual fee', 'error');
      return;
    }

    try {
      const res = await api.createFeeStructure(structureForm);
      if (res.success) {
        addToast('Route transport fee structure created', 'success');
        setIsAddStructureOpen(false);
        setStructureForm({
          academicYear: '2025-2026',
          route: '',
          feeCategory: 'Regular',
          annualFee: '',
          semesterFee: '',
          dueDate: ''
        });
        fetchData();
      }
    } catch (err) {
      addToast(err.message || 'Failed to create fee structure', 'error');
    }
  };

  const totalAssessed = financialSummary?.totalFeesAssessed || 0;
  const totalCollected = financialSummary?.totalFeesCollected || 0;
  const totalPending = financialSummary?.pendingTransportFees || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-navy-950 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-500" />
            Transport Fee Ledger & Official Receipts
          </h2>
          <p className="text-xs text-navy-500">
            Route-based fee structures, student payment collections, and verified receipts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setIsAddStructureOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Configure Fee Structure
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4 bg-white border border-navy-200">
          <span className="text-[11px] font-semibold text-navy-500 block">Total Assessed Fees</span>
          <span className="text-2xl font-bold text-navy-950 mt-1 block">₹{totalAssessed.toLocaleString()}</span>
        </Card>
        <Card className="p-4 bg-emerald-50 border border-emerald-200">
          <span className="text-[11px] font-semibold text-emerald-700 block">Total Collected Fees</span>
          <span className="text-2xl font-bold text-emerald-900 mt-1 block">₹{totalCollected.toLocaleString()}</span>
        </Card>
        <Card className="p-4 bg-amber-50 border border-amber-200">
          <span className="text-[11px] font-semibold text-amber-700 block">Pending Outstanding Dues</span>
          <span className="text-2xl font-bold text-amber-900 mt-1 block">₹{totalPending.toLocaleString()}</span>
        </Card>
        <Card className="p-4 bg-blue-50 border border-blue-200">
          <span className="text-[11px] font-semibold text-blue-700 block">Collection Rate</span>
          <span className="text-2xl font-bold text-blue-900 mt-1 block">
            {totalAssessed > 0 ? ((totalCollected / totalAssessed) * 100).toFixed(1) : 0}%
          </span>
        </Card>
      </div>

      {/* Switcher */}
      <div className="flex items-center gap-2 border-b border-navy-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTabSection('fees')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-all ${
            activeTabSection === 'fees'
              ? 'bg-navy-900 text-white'
              : 'text-navy-600 hover:bg-navy-100'
          }`}
        >
          Student Fee Ledger ({feeRecords.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTabSection('structures')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-all ${
            activeTabSection === 'structures'
              ? 'bg-amber-500 text-stone-950 font-bold'
              : 'text-navy-600 hover:bg-navy-100'
          }`}
        >
          Route Fee Structures ({feeStructures.length})
        </button>
      </div>

      {activeTabSection === 'fees' ? (
        <>
          {/* Filters */}
          <Card className="p-4 bg-white border border-navy-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                placeholder="Search Roll No, student name, record ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search className="w-4 h-4 text-navy-400" />}
              />
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Payment Statuses' },
                  { value: 'Paid', label: 'Paid in Full' },
                  { value: 'Partially Paid', label: 'Partially Paid' },
                  { value: 'Pending', label: 'Pending Dues' },
                  { value: 'Overdue', label: 'Overdue' }
                ]}
              />
            </div>
          </Card>

          {/* Table */}
          <Card className="overflow-hidden border border-navy-200">
            <Table
              columns={[
                {
                  header: 'Roll No & Student',
                  accessor: 'rollNumber',
                  render: (_, row) => (
                    <div>
                      <span className="font-mono font-bold text-navy-950 text-xs block">{row.rollNumber}</span>
                      <span className="text-navy-900 font-medium text-xs">{row.studentName}</span>
                    </div>
                  )
                },
                {
                  header: 'Route & Academic Year',
                  accessor: 'route',
                  render: (_, row) => (
                    <div className="text-xs">
                      <span className="font-semibold text-navy-900 block">{row.route?.routeName || 'Route Assigned'}</span>
                      <span className="text-navy-500 text-[11px]">{row.academicYear}</span>
                    </div>
                  )
                },
                {
                  header: 'Total Assessed',
                  accessor: 'totalFee',
                  render: (_, row) => (
                    <span className="font-mono font-bold text-navy-900 text-xs">₹{row.totalFee?.toLocaleString()}</span>
                  )
                },
                {
                  header: 'Paid Amount',
                  accessor: 'paidAmount',
                  render: (_, row) => (
                    <span className="font-mono font-bold text-emerald-700 text-xs">₹{row.paidAmount?.toLocaleString()}</span>
                  )
                },
                {
                  header: 'Pending Balance',
                  accessor: 'pendingAmount',
                  render: (_, row) => (
                    <span className={`font-mono font-bold text-xs ${row.pendingAmount > 0 ? 'text-amber-700' : 'text-navy-400'}`}>
                      ₹{row.pendingAmount?.toLocaleString()}
                    </span>
                  )
                },
                {
                  header: 'Status',
                  accessor: 'paymentStatus',
                  render: (_, row) => (
                    <Badge
                      variant={
                        row.paymentStatus === 'Paid'
                          ? 'success'
                          : row.paymentStatus === 'Partially Paid'
                          ? 'info'
                          : row.paymentStatus === 'Overdue'
                          ? 'error'
                          : 'warning'
                      }
                      size="xs"
                    >
                      {row.paymentStatus?.toUpperCase()}
                    </Badge>
                  )
                },
                {
                  header: 'Actions',
                  accessor: '_id',
                  render: (_, row) => (
                    <div className="flex items-center gap-1.5">
                      {row.pendingAmount > 0 && (
                        <Button
                          size="xs"
                          onClick={() => {
                            setPayingRecord(row);
                            setPayAmount(String(row.pendingAmount));
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <CreditCard className="w-3.5 h-3.5 mr-1" />
                          Collect Fee
                        </Button>
                      )}

                      {row.payments && row.payments.length > 0 && (
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => {
                            const lastPayment = row.payments[row.payments.length - 1];
                            setActiveReceipt({
                              receiptNumber: lastPayment.receiptNumber,
                              studentName: row.studentName,
                              rollNumber: row.rollNumber,
                              academicYear: row.academicYear,
                              amountPaid: lastPayment.amount,
                              totalFee: row.totalFee,
                              pendingAmount: row.pendingAmount,
                              paymentDate: lastPayment.paymentDate,
                              paymentMethod: lastPayment.paymentMethod,
                              transactionReference: lastPayment.transactionReference,
                              issuedBy: 'Accounts Cell'
                            });
                          }}
                          title="View Latest Receipt"
                        >
                          <Receipt className="w-3.5 h-3.5 text-navy-600" />
                        </Button>
                      )}
                    </div>
                  )
                }
              ]}
              data={feeRecords}
              isLoading={loading}
              emptyText="No student transport fee records found."
            />
          </Card>
        </>
      ) : (
        /* STRUCTURES TABLE */
        <Card className="overflow-hidden border border-navy-200">
          <Table
            columns={[
              {
                header: 'Route Name',
                accessor: 'routeName',
                render: (_, row) => (
                  <div>
                    <span className="font-bold text-navy-950 text-xs block">{row.routeName || row.route?.routeName}</span>
                    <span className="text-navy-500 font-mono text-[11px]">{row.route?.routeCode}</span>
                  </div>
                )
              },
              {
                header: 'Academic Year',
                accessor: 'academicYear',
                render: (_, row) => <span className="font-semibold text-xs text-navy-900">{row.academicYear}</span>
              },
              {
                header: 'Category',
                accessor: 'feeCategory',
                render: (_, row) => <Badge variant="info" size="xs">{row.feeCategory}</Badge>
              },
              {
                header: 'Annual Transport Fee',
                accessor: 'annualFee',
                render: (_, row) => (
                  <span className="font-mono font-bold text-navy-950 text-sm">₹{row.annualFee?.toLocaleString()}</span>
                )
              },
              {
                header: 'Semester Fee',
                accessor: 'semesterFee',
                render: (_, row) => (
                  <span className="font-mono text-navy-700 text-xs">
                    {row.semesterFee ? `₹${row.semesterFee.toLocaleString()}` : 'N/A'}
                  </span>
                )
              }
            ]}
            data={feeStructures}
            isLoading={loading}
            emptyText="No route fee structures configured."
          />
        </Card>
      )}

      {/* RECORD PAYMENT MODAL */}
      <Modal
        isOpen={!!payingRecord}
        onClose={() => setPayingRecord(null)}
        title={payingRecord ? `Collect Transport Fee — ${payingRecord.studentName} (${payingRecord.rollNumber})` : ''}
      >
        {payingRecord && (
          <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
            <div className="p-3 bg-navy-50 rounded-xl grid grid-cols-2 gap-3">
              <div>
                <span className="text-navy-500 block">Total Assessed Fee</span>
                <span className="font-mono font-bold text-navy-950 text-sm">
                  ₹{payingRecord.totalFee?.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-navy-500 block">Pending Outstanding Balance</span>
                <span className="font-mono font-bold text-amber-800 text-sm">
                  ₹{payingRecord.pendingAmount?.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-navy-800 font-semibold mb-1">
                  Collection Amount (₹) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  max={payingRecord.pendingAmount}
                  required
                />
              </div>
              <div>
                <label className="block text-navy-800 font-semibold mb-1">Payment Method</label>
                <Select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  options={[
                    { value: 'Online Payment', label: 'Online Payment' },
                    { value: 'UPI', label: 'UPI' },
                    { value: 'Card', label: 'Debit / Credit Card' },
                    { value: 'Bank Transfer', label: 'Bank Transfer' },
                    { value: 'Cash', label: 'Cash Desk' },
                    { value: 'DD', label: 'Demand Draft' }
                  ]}
                />
              </div>
            </div>

            <div>
              <label className="block text-navy-800 font-semibold mb-1">Transaction Ref / Cheque #</label>
              <Input
                placeholder="e.g. TXN998827182"
                value={payTxnRef}
                onChange={(e) => setPayTxnRef(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-navy-100">
              <Button variant="outline" size="sm" onClick={() => setPayingRecord(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmittingPay}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                {isSubmittingPay ? 'Recording...' : 'Confirm & Generate Receipt'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* CONFIGURE FEE STRUCTURE MODAL */}
      <Modal
        isOpen={isAddStructureOpen}
        onClose={() => setIsAddStructureOpen(false)}
        title="Configure Route Fee Structure"
      >
        <form onSubmit={handleCreateStructure} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-navy-800 font-semibold mb-1">Academic Year *</label>
              <Input
                value={structureForm.academicYear}
                onChange={(e) => setStructureForm({ ...structureForm, academicYear: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-navy-800 font-semibold mb-1">Fee Category</label>
              <Select
                value={structureForm.feeCategory}
                onChange={(e) => setStructureForm({ ...structureForm, feeCategory: e.target.value })}
                options={[
                  { value: 'Regular', label: 'Regular' },
                  { value: 'Concession', label: 'Concession' },
                  { value: 'Hostel Commuter', label: 'Hostel Commuter' },
                  { value: 'Staff Dependent', label: 'Staff Dependent' }
                ]}
              />
            </div>
          </div>

          <div>
            <label className="block text-navy-800 font-semibold mb-1">Transit Route *</label>
            <Select
              value={structureForm.route}
              onChange={(e) => setStructureForm({ ...structureForm, route: e.target.value })}
              options={[
                { value: '', label: 'Select Route' },
                ...routes.map((r) => ({
                  value: r._id,
                  label: `${r.routeName} (${r.routeCode})`
                }))
              ]}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-navy-800 font-semibold mb-1">Annual Fee (₹) *</label>
              <Input
                type="number"
                placeholder="22000"
                value={structureForm.annualFee}
                onChange={(e) => setStructureForm({ ...structureForm, annualFee: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-navy-800 font-semibold mb-1">Semester Fee (₹)</label>
              <Input
                type="number"
                placeholder="11000"
                value={structureForm.semesterFee}
                onChange={(e) => setStructureForm({ ...structureForm, semesterFee: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-navy-100">
            <Button variant="outline" size="sm" onClick={() => setIsAddStructureOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold"
            >
              Save Structure
            </Button>
          </div>
        </form>
      </Modal>

      {/* OFFICIAL PAYMENT RECEIPT MODAL */}
      <Modal
        isOpen={!!activeReceipt}
        onClose={() => setActiveReceipt(null)}
        title="Official Transport Fee Receipt"
      >
        {activeReceipt && (
          <div className="space-y-4 text-xs font-sans">
            {/* Printable Receipt Paper Container */}
            <div className="p-6 bg-white border-2 border-navy-200 rounded-xl space-y-4 shadow-sm">
              {/* Header */}
              <div className="text-center pb-3 border-b border-navy-200">
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest block">
                  Apex Institute of Technology & Engineering
                </span>
                <h3 className="text-base font-bold text-navy-950 mt-0.5">
                  CAMPUS TRANSPORT CIRCULATION RECEIPT
                </h3>
                <span className="font-mono text-navy-500 text-[11px]">
                  Receipt #: <strong>{activeReceipt.receiptNumber}</strong>
                </span>
              </div>

              {/* Student & Pass Meta */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-navy-50/70 rounded-lg text-xs">
                <div>
                  <span className="text-navy-500 block text-[10px]">STUDENT NAME</span>
                  <span className="font-bold text-navy-900">{activeReceipt.studentName}</span>
                </div>
                <div>
                  <span className="text-navy-500 block text-[10px]">ROLL NUMBER</span>
                  <span className="font-mono font-bold text-navy-900">{activeReceipt.rollNumber}</span>
                </div>
                <div>
                  <span className="text-navy-500 block text-[10px]">ACADEMIC YEAR</span>
                  <span className="font-medium text-navy-900">{activeReceipt.academicYear}</span>
                </div>
                <div>
                  <span className="text-navy-500 block text-[10px]">PAYMENT DATE</span>
                  <span className="font-medium text-navy-900">
                    {new Date(activeReceipt.paymentDate).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Financial Ledger */}
              <div className="divide-y divide-navy-100 border border-navy-200 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-navy-700">
                  <span>Total Assessed Transport Fee:</span>
                  <span className="font-mono font-semibold">₹{activeReceipt.totalFee?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-800 font-bold pt-2 text-sm">
                  <span>AMOUNT PAID TODAY:</span>
                  <span className="font-mono text-base">₹{activeReceipt.amountPaid?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-navy-700 pt-2">
                  <span>Remaining Pending Balance:</span>
                  <span className="font-mono font-bold text-amber-700">₹{activeReceipt.pendingAmount?.toLocaleString()}</span>
                </div>
                {activeReceipt.transactionReference && (
                  <div className="flex justify-between text-navy-500 text-[11px] pt-1">
                    <span>Transaction Reference:</span>
                    <span className="font-mono">{activeReceipt.transactionReference}</span>
                  </div>
                )}
              </div>

              {/* Seal / Footer */}
              <div className="pt-3 border-t border-navy-100 flex items-center justify-between text-[11px] text-navy-400">
                <span>Issued by: {activeReceipt.issuedBy}</span>
                <span className="italic font-medium text-emerald-700">&bull; Computer Generated Official Receipt</span>
              </div>
            </div>

            {/* Print / Action buttons */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="text-navy-700"
              >
                <Printer className="w-3.5 h-3.5 mr-1.5" />
                Print Receipt
              </Button>
              <Button
                size="sm"
                onClick={() => setActiveReceipt(null)}
                className="bg-navy-900 text-white"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TransportFeeManagementView;

