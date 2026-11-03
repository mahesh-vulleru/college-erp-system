import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Download,
  Filter,
  Search,
  RefreshCw,
  FileSpreadsheet,
  FileCode,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Bus,
  Users,
  MapPin,
  Award,
  Activity,
  Fuel,
  Wrench,
  DollarSign,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Clock
} from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import EmptyState from '../../components/common/EmptyState';
import api from '../../api/apiClient';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export const TransportReportCenter = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [selectedReport, setSelectedReport] = useState('vehicle');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('last30days');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [loading, setLoading] = useState(true);

  const [reportResult, setReportResult] = useState(null);

  const reportDefinitions = [
    { id: 'vehicle', title: 'Vehicle Report', category: 'Fleet', icon: Bus },
    { id: 'driver', title: 'Driver Report', category: 'Staff', icon: Award },
    { id: 'route', title: 'Route Report', category: 'Operations', icon: MapPin },
    { id: 'student-transport', title: 'Student Transport Report', category: 'Students', icon: Users },
    { id: 'trip', title: 'Trip Operations Report', category: 'Operations', icon: Activity },
    { id: 'student-attendance', title: 'Student Attendance Report', category: 'Students', icon: Clock },
    { id: 'fuel-consumption', title: 'Fuel Consumption Report', category: 'Maintenance', icon: Fuel },
    { id: 'vehicle-maintenance', title: 'Vehicle Maintenance Report', category: 'Maintenance', icon: Wrench },
    { id: 'transport-expense', title: 'Transport Expense Report', category: 'Financial', icon: DollarSign },
    { id: 'fee-collection', title: 'Fee Collection Report', category: 'Financial', icon: DollarSign },
    { id: 'pending-fee', title: 'Pending Fee Defaulters Report', category: 'Financial', icon: AlertTriangle },
    { id: 'safety-incident', title: 'Safety Incident Report', category: 'Safety', icon: ShieldCheck },
    { id: 'emergency-alert', title: 'Emergency Alert Log Report', category: 'Safety', icon: Zap },
    { id: 'overspeed', title: 'Overspeed Events Report', category: 'Safety', icon: AlertTriangle },
    { id: 'geofence-violation', title: 'Geofence Violation Report', category: 'Safety', icon: MapPin }
  ];

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        reportType: selectedReport,
        range: dateRange,
        page,
        limit
      };
      if (searchTerm) params.search = searchTerm;
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;

      const res = await api.getTransportReport(params);
      if (res.success) {
        setReportResult(res.data);
      }
    } catch (err) {
      addToast(err.message || 'Failed to fetch report data', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedReport, dateRange, statusFilter, searchTerm, page, limit, addToast]);

  useEffect(() => {
    setPage(1);
  }, [selectedReport, statusFilter, dateRange, searchTerm]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleExport = (format) => {
    const params = {
      reportType: selectedReport,
      range: dateRange,
      format
    };
    if (searchTerm) params.search = searchTerm;
    if (statusFilter && statusFilter !== 'all') params.status = statusFilter;

    // Use token from localStorage or api client header to authorize export download
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token') || '';
    if (token) params.token = token;

    const url = api.getTransportExportUrl(params);
    window.open(url, '_blank');
    addToast(`Exporting ${selectedReport} report as ${format.toUpperCase()}...`, 'info');
  };

  return (
    <div className="space-y-6">
      {/* Header and Report Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            Central Transport Report Center
          </h2>
          <p className="text-sm text-slate-500">
            Generate, filter, and export official institution-wide transport records
          </p>
        </div>

        {/* 1-Click Export Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('csv')}
            className="flex items-center gap-1.5 text-xs font-semibold"
          >
            <FileCode className="w-3.5 h-3.5 text-slate-500" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('xlsx')}
            className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Excel XLSX
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700"
          >
            <Download className="w-3.5 h-3.5" />
            PDF Export
          </Button>
        </div>
      </div>

      {/* 15 Report Selection Pills */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Available Institutional Reports</p>
        <div className="flex flex-wrap gap-2">
          {reportDefinitions.map((rep) => {
            const Icon = rep.icon;
            const isSelected = selectedReport === rep.id;
            return (
              <button
                key={rep.id}
                onClick={() => setSelectedReport(rep.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                {rep.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1 flex flex-wrap items-center gap-3">
          <div className="w-64 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search in report..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
            <Calendar className="w-4 h-4 text-slate-500" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent border-none text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="today">Today</option>
              <option value="last7days">Last 7 Days</option>
              <option value="last30days">Last 30 Days</option>
              <option value="thismonth">This Month</option>
              <option value="thisyear">This Year</option>
              <option value="all">All Time</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-none text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active / Completed</option>
              <option value="inactive">Inactive / Cancelled</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchReport}
          className="flex items-center gap-1.5 text-xs"
          disabled={loading}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Totals for Selected Report */}
      {reportResult?.summaryTotals && Object.keys(reportResult.summaryTotals).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(reportResult.summaryTotals).map(([key, val]) => (
            <div key={key} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
              <p className="text-[11px] font-semibold text-slate-500 uppercase">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </p>
              <p className="text-xl font-bold text-slate-900 mt-1">
                {typeof val === 'number' && key.toLowerCase().includes('cost') || key.toLowerCase().includes('demand') || key.toLowerCase().includes('paid') || key.toLowerCase().includes('balance') || key.toLowerCase().includes('amount')
                  ? `₹${val.toLocaleString()}`
                  : val}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Data Table */}
      <Card className="p-0 overflow-hidden shadow-sm border border-slate-200">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">{reportResult?.title || 'Report Records'}</h3>
          <span className="text-xs font-medium text-slate-500">
            Total Records: {reportResult?.pagination?.total || 0}
          </span>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-sm font-medium text-slate-500">Querying institutional records from database...</p>
          </div>
        ) : !reportResult || reportResult.rows.length === 0 ? (
          <div className="py-16">
            <EmptyState
              title="No records found"
              description="No data matching the selected date range and filters was found."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-semibold uppercase border-b border-slate-200">
                  {reportResult.headers.map((h, i) => (
                    <th key={i} className="py-3 px-4 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportResult.rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="py-3 px-4 text-slate-700 whitespace-nowrap">
                        {typeof cell === 'number' && String(reportResult.headers[cIdx]).includes('(₹)')
                          ? `₹${cell.toLocaleString()}`
                          : cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {reportResult?.pagination && reportResult.pagination.totalPages > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span>
              Showing Page {reportResult.pagination.page} of {reportResult.pagination.totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= reportResult.pagination.totalPages}
                className="p-1.5"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default TransportReportCenter;
