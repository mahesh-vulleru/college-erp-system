import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  Download,
  Calendar,
  Clock,
  User,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  Terminal,
  Server,
  Layers,
  Lock
} from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import api from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ROLES } from '@college-erp/shared';

export const AuditLogsPage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected Detail Modal
  const [selectedLog, setSelectedLog] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const loadLogs = useCallback(
    async (pageToLoad = 1) => {
      setIsLoading(true);
      try {
        const res = await api.getAuditLogs({
          page: pageToLoad,
          limit: pagination.limit,
          action: actionFilter || undefined,
          entityType: moduleFilter || undefined,
          outcome: outcomeFilter || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          q: searchQuery.trim() || undefined
        });

        if (res?.data) {
          setLogs(res.data);
          if (res.meta) {
            setPagination({
              page: res.meta.page,
              limit: res.meta.limit,
              total: res.meta.total,
              totalPages: res.meta.totalPages
            });
          }
        }
      } catch (err) {
        addToast({
          type: 'error',
          title: 'Error loading audit history',
          message: err.message
        });
      } finally {
        setIsLoading(false);
      }
    },
    [addToast, pagination.limit, actionFilter, moduleFilter, outcomeFilter, startDate, endDate, searchQuery]
  );

  useEffect(() => {
    loadLogs(1);
  }, [actionFilter, moduleFilter, outcomeFilter, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadLogs(1);
  };

  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (actionFilter) params.append('action', actionFilter);
    if (moduleFilter) params.append('entityType', moduleFilter);
    if (outcomeFilter) params.append('outcome', outcomeFilter);
    window.open(`/api/v1/audit-logs/export?${params.toString()}`, '_blank');
  };

  const openLogDetails = (log) => {
    setSelectedLog(log);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-navy-950 flex items-center">
            <ShieldCheck className="w-6 h-6 mr-2.5 text-teal-600" />
            Security & Compliance Audit Logs
          </h1>
          <p className="text-xs sm:text-sm text-navy-600 mt-1">
            Persisted records of administrative mutations, privileged authentication events, and financial actions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleExportCsv}>
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export Audit Trail (CSV)
          </Button>
          <Button variant="ghost" size="sm" onClick={() => loadLogs(pagination.page)} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 space-y-3.5">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-navy-400" />
            <input
              type="text"
              placeholder="Search action, IP, or module..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-navy-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Outcome Filter */}
            <select
              value={outcomeFilter}
              onChange={(e) => setOutcomeFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-xl border border-navy-200 bg-white"
            >
              <option value="">All Outcomes</option>
              <option value="success">Success</option>
              <option value="failure">Failure / Alert</option>
            </select>

            {/* Module Filter */}
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-xl border border-navy-200 bg-white"
            >
              <option value="">All Modules</option>
              <option value="User">User Accounts</option>
              <option value="FeeStructure">Fee Plans</option>
              <option value="Invoice">Fee Invoices</option>
              <option value="Payment">Payments & Receipts</option>
              <option value="Notice">Notice Board</option>
              <option value="Department">Departments</option>
            </select>

            {/* Action Type Filter */}
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-xl border border-navy-200 bg-white"
            >
              <option value="">All Action Types</option>
              <option value="AUTH_LOGIN_SUCCESS">Login Success</option>
              <option value="AUTH_LOGIN_FAILED">Login Failed</option>
              <option value="USER_PROVISIONED">User Created</option>
              <option value="USER_UPDATED">User Modified</option>
              <option value="FEE_STRUCTURE_CREATED">Fee Plan Published</option>
              <option value="PAYMENT_RECORDED_AND_VERIFIED">Payment Cleared</option>
              <option value="FEE_ADJUSTMENT_APPLIED">Fee Waiver Applied</option>
              <option value="NOTICE_PUBLISHED">Notice Published</option>
              <option value="DEPARTMENT_UPDATED">HOD Assigned</option>
            </select>

            <Button type="submit" size="xs" variant="primary">
              Filter
            </Button>
          </div>
        </form>

        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-navy-100 text-xs">
          <span className="text-navy-500 font-medium">Date Range:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2 py-1 text-[11px] rounded-lg border border-navy-200 bg-white"
          />
          <span className="text-navy-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2 py-1 text-[11px] rounded-lg border border-navy-200 bg-white"
          />
          {(startDate || endDate || actionFilter || moduleFilter || outcomeFilter || searchQuery) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setActionFilter('');
                setModuleFilter('');
                setOutcomeFilter('');
                setSearchQuery('');
              }}
              className="text-teal-700 hover:text-teal-900 text-[11px] font-semibold underline ml-2"
            >
              Reset Filters
            </button>
          )}
        </div>
      </Card>

      {/* Logs Table */}
      <Card className="p-4 space-y-4">
        <Table
          columns={[
            {
              header: 'Timestamp',
              render: (row) => (
                <div>
                  <span className="font-mono text-xs text-navy-950 block">
                    {new Date(row.createdAt).toLocaleDateString()}
                  </span>
                  <span className="text-[10px] text-navy-500 font-mono">
                    {new Date(row.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              )
            },
            {
              header: 'Actor / Account',
              render: (row) => (
                <div>
                  <span className="font-semibold text-navy-900 block">{row.user?.name || 'System Daemon'}</span>
                  <span className="text-[10px] text-navy-500">
                    {row.user?.email || 'N/A'} • <span className="uppercase font-semibold">{row.user?.role?.replace(/_/g, ' ') || 'SYSTEM'}</span>
                  </span>
                </div>
              )
            },
            {
              header: 'Action Type',
              render: (row) => (
                <span className="font-mono text-xs font-semibold text-navy-900 bg-navy-50 px-2 py-0.5 rounded border border-navy-200">
                  {row.action}
                </span>
              )
            },
            {
              header: 'Module / Target',
              render: (row) => (
                <div>
                  <Badge variant="neutral">{row.entityType || 'General'}</Badge>
                  {row.entityId && (
                    <span className="text-[10px] font-mono text-navy-400 block mt-0.5 truncate max-w-[120px]">
                      {row.entityId}
                    </span>
                  )}
                </div>
              )
            },
            {
              header: 'Outcome',
              render: (row) =>
                row.outcome === 'failure' ? (
                  <Badge variant="danger" dot>
                    FAILED
                  </Badge>
                ) : (
                  <Badge variant="success" dot>
                    SUCCESS
                  </Badge>
                )
            },
            {
              header: 'Client Network',
              render: (row) => (
                <div>
                  <span className="font-mono text-[11px] text-navy-600 block">{row.ipAddress || '127.0.0.1'}</span>
                  <span className="text-[10px] text-navy-400 truncate max-w-[140px] block" title={row.userAgent}>
                    {row.userAgent?.split(' ')[0] || 'Browser Client'}
                  </span>
                </div>
              )
            },
            {
              header: 'Details',
              render: (row) => (
                <Button variant="ghost" size="xs" onClick={() => openLogDetails(row)}>
                  <Eye className="w-3.5 h-3.5 mr-1 text-teal-600" />
                  Inspect
                </Button>
              )
            }
          ]}
          data={logs}
          isLoading={isLoading}
          emptyMessage="No audit logs recorded matching this query."
        />

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="pt-2 flex justify-end">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={(p) => loadLogs(p)}
            />
          </div>
        )}
      </Card>

      {/* MODAL: Audit Event Detail Inspector */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Audit Event Security Details">
        {selectedLog && (
          <div className="space-y-4 text-xs">
            <div className="border-b border-navy-200 pb-3 flex justify-between items-start">
              <div>
                <span className="font-mono text-sm font-bold text-navy-950 block">{selectedLog.action}</span>
                <span className="text-navy-500 text-[11px]">Subsystem: {selectedLog.entityType}</span>
              </div>
              <Badge variant={selectedLog.outcome === 'failure' ? 'danger' : 'success'}>
                {selectedLog.outcome?.toUpperCase()}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-navy-50 p-3 rounded-lg">
              <div>
                <p className="text-navy-500 text-[10px]">Actor Name</p>
                <p className="font-semibold text-navy-900">{selectedLog.user?.name || 'System / Unauthenticated'}</p>
                <p className="text-navy-500 text-[10px] mt-1.5">Email & Role</p>
                <p className="text-navy-700">{selectedLog.user?.email || 'N/A'} ({selectedLog.user?.role || 'SYSTEM'})</p>
              </div>
              <div>
                <p className="text-navy-500 text-[10px]">Timestamp (UTC)</p>
                <p className="font-mono text-navy-900">{new Date(selectedLog.createdAt).toISOString()}</p>
                <p className="text-navy-500 text-[10px] mt-1.5">Origin IP Address</p>
                <p className="font-mono text-navy-700">{selectedLog.ipAddress}</p>
              </div>
            </div>

            {selectedLog.requestId && (
              <div className="p-2 rounded bg-navy-100 text-[11px] font-mono text-navy-700">
                Request ID: {selectedLog.requestId}
              </div>
            )}

            <div>
              <h4 className="font-bold text-navy-800 text-[11px] uppercase mb-1.5 flex items-center">
                <Terminal className="w-3.5 h-3.5 mr-1 text-teal-600" />
                Sanitized Payload Details (Sensitive Data Redacted)
              </h4>
              <div className="p-3 rounded-xl bg-navy-950 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-56">
                <pre>{JSON.stringify(selectedLog.details, null, 2)}</pre>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="ghost" size="sm" onClick={() => setIsDetailModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AuditLogsPage;

