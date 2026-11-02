import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Search,
  Filter,
  RefreshCw,
  FileText,
  AlertTriangle,
  Building2
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
import { ROLES } from '@college-erp/shared';
import api from '../../api/apiClient';

export const TransportExpensesView = ({ buses = [] }) => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const isFinanceOfficer = user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.ACCOUNTS || user?.role === ROLES.PRINCIPAL;

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [busFilter, setBusFilter] = useState('all');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [approvingExpense, setApprovingExpense] = useState(null);
  const [rejectingExpense, setRejectingExpense] = useState(null);
  const [approvalRemarks, setApprovalRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    expenseId: '',
    category: 'Repair Expenses',
    bus: '',
    expenseDate: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    vendor: '',
    invoiceNumber: '',
    paymentMethod: 'Bank Transfer'
  });

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getExpenses({
        search,
        category: categoryFilter,
        status: statusFilter,
        bus: busFilter
      });
      if (res && res.data) {
        setExpenses(res.data);
      }
    } catch (err) {
      addToast(err.message || 'Failed to fetch transport expenses', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, statusFilter, busFilter, addToast]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.expenseId || !formData.category || !formData.description || !formData.amount || !formData.vendor) {
      addToast('Please complete all mandatory fields', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.createExpense(formData);
      if (res.success) {
        addToast(`Expense ${formData.expenseId.toUpperCase()} submitted for approval`, 'success');
        setIsCreateModalOpen(false);
        setFormData({
          expenseId: '',
          category: 'Repair Expenses',
          bus: '',
          expenseDate: new Date().toISOString().split('T')[0],
          description: '',
          amount: '',
          vendor: '',
          invoiceNumber: '',
          paymentMethod: 'Bank Transfer'
        });
        fetchExpenses();
      }
    } catch (err) {
      addToast(err.message || 'Failed to submit expense', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmApproval = async () => {
    try {
      setIsSubmitting(true);
      const res = await api.approveExpense(approvingExpense._id, approvalRemarks);
      if (res.success) {
        addToast(`Expense ${approvingExpense.expenseId} approved`, 'success');
        setApprovingExpense(null);
        setApprovalRemarks('');
        fetchExpenses();
      }
    } catch (err) {
      addToast(err.message || 'Failed to approve expense', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmRejection = async () => {
    if (!approvalRemarks.trim()) {
      addToast('Please enter rejection remarks', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.rejectExpense(rejectingExpense._id, approvalRemarks);
      if (res.success) {
        addToast(`Expense ${rejectingExpense.expenseId} rejected`, 'success');
        setRejectingExpense(null);
        setApprovalRemarks('');
        fetchExpenses();
      }
    } catch (err) {
      addToast(err.message || 'Failed to reject expense', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAmount = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const approvedAmount = expenses.filter((e) => e.approvalStatus === 'Approved' || e.approvalStatus === 'Paid').reduce((s, e) => s + (e.amount || 0), 0);
  const pendingCount = expenses.filter((e) => e.approvalStatus === 'Submitted').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-navy-950 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-amber-500" />
            Transport Expense & Vendor Disbursements
          </h2>
          <p className="text-xs text-navy-500">
            Submit, audit, and approve operational fleet expenses, vendor bills, and transit costs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchExpenses} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Submit Expense
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4 bg-white border border-navy-200">
          <span className="text-[11px] font-semibold text-navy-500 block">Total Expenses Submitted</span>
          <span className="text-2xl font-bold text-navy-950 mt-1 block">₹{totalAmount.toLocaleString()}</span>
        </Card>
        <Card className="p-4 bg-emerald-50 border border-emerald-200">
          <span className="text-[11px] font-semibold text-emerald-700 block">Approved Expenses</span>
          <span className="text-2xl font-bold text-emerald-900 mt-1 block">₹{approvedAmount.toLocaleString()}</span>
        </Card>
        <Card className="p-4 bg-amber-50 border border-amber-200">
          <span className="text-[11px] font-semibold text-amber-700 block">Pending Finance Review</span>
          <span className="text-2xl font-bold text-amber-900 mt-1 block">{pendingCount} Requests</span>
        </Card>
        <Card className="p-4 bg-blue-50 border border-blue-200">
          <span className="text-[11px] font-semibold text-blue-700 block">Finance Role Authority</span>
          <span className="text-sm font-bold text-blue-900 mt-2 block">
            {isFinanceOfficer ? 'Accounts / Admin Approver' : 'Transport Requester'}
          </span>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 bg-white border border-navy-200">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <Input
            placeholder="Search ID, vendor, description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-navy-400" />}
          />
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Categories' },
              { value: 'Fuel Expenses', label: 'Fuel Expenses' },
              { value: 'Vehicle Maintenance', label: 'Vehicle Maintenance' },
              { value: 'Repair Expenses', label: 'Repair Expenses' },
              { value: 'Insurance Expenses', label: 'Insurance Expenses' },
              { value: 'Permit Expenses', label: 'Permit Expenses' },
              { value: 'Emergency Expenses', label: 'Emergency Expenses' },
              { value: 'Other Transport Expenses', label: 'Other Expenses' }
            ]}
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Approval Statuses' },
              { value: 'Submitted', label: 'Submitted / Pending' },
              { value: 'Approved', label: 'Approved' },
              { value: 'Rejected', label: 'Rejected' },
              { value: 'Paid', label: 'Paid' }
            ]}
          />
          <Select
            value={busFilter}
            onChange={(e) => setBusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Buses' },
              ...buses.map((b) => ({ value: b._id, label: `${b.busName} (${b.busId})` }))
            ]}
          />
        </div>
      </Card>

      {/* Expenses Table */}
      <Card className="overflow-hidden border border-navy-200">
        <Table
          columns={[
            {
              header: 'Expense ID & Date',
              accessor: 'expenseId',
              render: (_, row) => (
                <div>
                  <span className="font-mono font-bold text-navy-950 text-xs block">{row.expenseId}</span>
                  <span className="text-navy-500 text-[11px]">{new Date(row.expenseDate).toLocaleDateString()}</span>
                </div>
              )
            },
            {
              header: 'Category & Vendor',
              accessor: 'category',
              render: (_, row) => (
                <div className="text-xs">
                  <span className="font-semibold text-navy-900 block">{row.category}</span>
                  <span className="text-navy-500 text-[11px]">Vendor: {row.vendor}</span>
                </div>
              )
            },
            {
              header: 'Description & Vehicle',
              accessor: 'description',
              render: (_, row) => (
                <div className="text-xs">
                  <span className="font-medium text-navy-900 block line-clamp-1">{row.description}</span>
                  <span className="text-navy-400 text-[11px]">
                    {row.bus ? `Vehicle: ${row.bus.busName} (${row.bus.busId})` : 'General Fleet'}
                  </span>
                </div>
              )
            },
            {
              header: 'Amount',
              accessor: 'amount',
              render: (_, row) => (
                <span className="font-bold text-navy-950 text-sm">₹{row.amount?.toLocaleString()}</span>
              )
            },
            {
              header: 'Submitted By',
              accessor: 'submittedBy',
              render: (_, row) => (
                <span className="text-xs text-navy-700">{row.submittedBy?.name || 'Transport Staff'}</span>
              )
            },
            {
              header: 'Status',
              accessor: 'approvalStatus',
              render: (_, row) => (
                <Badge
                  variant={
                    row.approvalStatus === 'Approved' || row.approvalStatus === 'Paid'
                      ? 'success'
                      : row.approvalStatus === 'Rejected'
                      ? 'error'
                      : 'warning'
                  }
                  size="xs"
                >
                  {row.approvalStatus?.toUpperCase()}
                </Badge>
              )
            },
            {
              header: 'Actions',
              accessor: '_id',
              render: (_, row) => (
                <div className="flex items-center gap-1.5">
                  {isFinanceOfficer && row.approvalStatus === 'Submitted' && (
                    <>
                      <Button
                        size="xs"
                        onClick={() => setApprovingExpense(row)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        title="Approve Expense"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="xs"
                        onClick={() => setRejectingExpense(row)}
                        className="bg-red-600 hover:bg-red-700 text-white"
                        title="Reject Expense"
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}
                  {row.approvalRemarks && (
                    <span className="text-[10px] text-navy-400 italic max-w-28 truncate" title={row.approvalRemarks}>
                      {row.approvalRemarks}
                    </span>
                  )}
                </div>
              )
            }
          ]}
          data={expenses}
          isLoading={loading}
          emptyText="No transport expenses found matching criteria."
        />
      </Card>

      {/* SUBMIT EXPENSE MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Submit Transport Expense"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-navy-800 font-semibold mb-1">
                Expense ID <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g. EXP-2026-001"
                value={formData.expenseId}
                onChange={(e) => setFormData({ ...formData, expenseId: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-navy-800 font-semibold mb-1">Expense Category *</label>
              <Select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                options={[
                  { value: 'Fuel Expenses', label: 'Fuel Expenses' },
                  { value: 'Vehicle Maintenance', label: 'Vehicle Maintenance' },
                  { value: 'Repair Expenses', label: 'Repair Expenses' },
                  { value: 'Insurance Expenses', label: 'Insurance Expenses' },
                  { value: 'Permit Expenses', label: 'Permit Expenses' },
                  { value: 'Driver-related Authorized Expenses', label: 'Driver Expenses' },
                  { value: 'Emergency Expenses', label: 'Emergency Expenses' },
                  { value: 'Other Transport Expenses', label: 'Other Transport Expenses' }
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-navy-800 font-semibold mb-1">Expense Date *</label>
              <Input
                type="date"
                value={formData.expenseDate}
                onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-navy-800 font-semibold mb-1">Amount (₹) *</label>
              <Input
                type="number"
                placeholder="4500"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-navy-800 font-semibold mb-1">Payment Method</label>
              <Select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                options={[
                  { value: 'Bank Transfer', label: 'Bank Transfer' },
                  { value: 'Corporate Card', label: 'Corporate Card' },
                  { value: 'UPI', label: 'UPI' },
                  { value: 'Cash', label: 'Cash' }
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-navy-800 font-semibold mb-1">Vendor / Payee *</label>
              <Input
                placeholder="e.g. Metro Tyres & Wheel Alignment"
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-navy-800 font-semibold mb-1">Invoice / Receipt #</label>
              <Input
                placeholder="e.g. BILL-9921"
                value={formData.invoiceNumber}
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-navy-800 font-semibold mb-1">Linked Bus (Optional)</label>
            <Select
              value={formData.bus}
              onChange={(e) => setFormData({ ...formData, bus: e.target.value })}
              options={[
                { value: '', label: 'General / Fleet-wide' },
                ...buses.map((b) => ({
                  value: b._id,
                  label: `${b.busName} (${b.registrationNumber})`
                }))
              ]}
            />
          </div>

          <div>
            <label className="block text-navy-800 font-semibold mb-1">Description / Purpose *</label>
            <Input
              placeholder="e.g. Front axle alignment and spare tyre tube replacement"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-navy-100">
            <Button variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold"
            >
              {isSubmitting ? 'Submitting...' : 'Submit for Finance Approval'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* APPROVE EXPENSE MODAL */}
      <Modal
        isOpen={!!approvingExpense}
        onClose={() => setApprovingExpense(null)}
        title="Approve Transport Expense"
      >
        <div className="space-y-4 text-xs">
          <p className="text-navy-700">
            You are approving expense{' '}
            <strong className="text-navy-950">{approvingExpense?.expenseId}</strong> for{' '}
            <strong>₹{approvingExpense?.amount?.toLocaleString()}</strong> payable to{' '}
            <strong>{approvingExpense?.vendor}</strong>.
          </p>
          <div>
            <label className="block text-navy-800 font-semibold mb-1">Approval Remarks (Optional)</label>
            <Input
              placeholder="e.g. Verified with attached invoice, sanctioned for payment"
              value={approvalRemarks}
              onChange={(e) => setApprovalRemarks(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setApprovingExpense(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={isSubmitting}
              onClick={handleConfirmApproval}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              {isSubmitting ? 'Processing...' : 'Sanction & Approve'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* REJECT EXPENSE MODAL */}
      <Modal
        isOpen={!!rejectingExpense}
        onClose={() => setRejectingExpense(null)}
        title="Reject Transport Expense"
      >
        <div className="space-y-4 text-xs">
          <p className="text-navy-700">
            Rejecting expense <strong>{rejectingExpense?.expenseId}</strong> (₹
            {rejectingExpense?.amount?.toLocaleString()}).
          </p>
          <div>
            <label className="block text-navy-800 font-semibold mb-1">
              Mandatory Rejection Reason <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="e.g. Duplicate bill, vendor quotation exceeds sanctioned limit"
              value={approvalRemarks}
              onChange={(e) => setApprovalRemarks(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setRejectingExpense(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={isSubmitting}
              onClick={handleConfirmRejection}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              {isSubmitting ? 'Processing...' : 'Confirm Rejection'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TransportExpensesView;

