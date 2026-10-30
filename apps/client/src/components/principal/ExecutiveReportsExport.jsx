import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  FileText,
  FileCode,
  Calendar,
  Building2,
  CheckCircle,
  Clock,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import api from '../../api/apiClient';
import { useToast } from '../../context/ToastContext';

export const ExecutiveReportsExport = ({ departments = [] }) => {
  const { addToast } = useToast();

  const [selectedReport, setSelectedReport] = useState('enrollment');
  const [selectedFormat, setSelectedFormat] = useState('csv'); // 'csv' | 'xlsx' | 'pdf'
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const reportTypes = [
    {
      id: 'enrollment',
      name: 'Student Enrollment & Registry',
      category: 'Admissions & Students',
      description: 'Comprehensive student roster including roll numbers, enrolled departments, active semesters, and registration status.'
    },
    {
      id: 'attendance',
      name: 'Institutional Attendance Health',
      category: 'Academic Compliance',
      description: 'Class session logs, conducted vs. attended periods, and student attendance percentages.'
    },
    {
      id: 'finance',
      name: 'Fee Collection & Dues Clearance',
      category: 'Finance & Accounts',
      description: 'Invoice balances, fee receipts, payment waivers, and outstanding dues.'
    },
    {
      id: 'academic_summary',
      name: 'Academic Capacity & Ratios',
      category: 'Executive Summary',
      description: 'Institution-wide student headcount, faculty strength, student-to-teacher ratio, and capacity metrics.'
    },
    {
      id: 'departments',
      name: 'Department-Wise Summaries',
      category: 'Department Performance',
      description: 'Intake capacity, student enrollment, faculty allocations, and utilization per department.'
    },
    {
      id: 'examinations',
      name: 'Examinations & Scheduling Cycle',
      category: 'Exam Cell',
      description: 'Scheduled institutional examination series, dates, academic terms, and tabulation status.'
    },
    {
      id: 'results',
      name: 'Published Results & Grades',
      category: 'Grade Cell',
      description: 'Internal & external marks, awarded letter grades, pass/fail statistics across published examinations.'
    }
  ];

  const handleExport = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsExporting(true);
    try {
      const params = {
        type: selectedReport,
        format: selectedFormat
      };

      if (selectedDept !== 'all') params.department = selectedDept;
      if (selectedSemester !== 'all') params.semester = selectedSemester;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const result = await api.downloadReport(params);

      addToast({
        type: 'success',
        title: 'Report Exported Successfully',
        message: `Generated "${result.filename}" (${selectedFormat.toUpperCase()}). Download has started.`
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Export Failed',
        message: err.message || 'Could not generate report export.'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleQuickDownload = async (type, format) => {
    setIsExporting(true);
    try {
      const result = await api.downloadReport({ type, format });
      addToast({
        type: 'success',
        title: 'Download Complete',
        message: `Saved ${result.filename} to your downloads.`
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Download Failed',
        message: err.message
      });
    } finally {
      setIsExporting(false);
    }
  };

  const currentReportInfo = reportTypes.find((r) => r.id === selectedReport) || reportTypes[0];

  return (
    <Card
      title="Executive Reports Export & Institutional Archiving"
      subtitle="Export live institutional datasets in CSV, Microsoft Excel (.xlsx), or official PDF summary formats"
    >
      <div className="space-y-6">
        {/* Quick Export Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div
            onClick={() => handleQuickDownload('academic_summary', 'pdf')}
            className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50/40 transition-all cursor-pointer group shadow-xs"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase font-bold text-teal-700 tracking-wider">Executive PDF</span>
              <FileText className="w-4 h-4 text-teal-600 group-hover:scale-110 transition-transform" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Academic Summary PDF</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Formal executive brief with capacity ratios</p>
          </div>

          <div
            onClick={() => handleQuickDownload('enrollment', 'xlsx')}
            className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40 transition-all cursor-pointer group shadow-xs"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Spreadsheet</span>
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Student Registry Excel</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Enrolled students formatted with headers</p>
          </div>

          <div
            onClick={() => handleQuickDownload('attendance', 'csv')}
            className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40 transition-all cursor-pointer group shadow-xs"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">Raw CSV</span>
              <FileCode className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Attendance Log CSV</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Session attendance data with RFC 4180 BOM</p>
          </div>
        </div>

        {/* Custom Export Generator Form */}
        <form onSubmit={handleExport} className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-200">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">
              Custom Institutional Report Generator
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Report Type Selection (Left Column) */}
            <div className="lg:col-span-6 space-y-2">
              <label className="block text-xs font-semibold text-slate-800">
                1. Select Institutional Dataset:
              </label>
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {reportTypes.map((rpt) => (
                  <div
                    key={rpt.id}
                    onClick={() => setSelectedReport(rpt.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      selectedReport === rpt.id
                        ? 'bg-teal-50/80 border-teal-500 ring-1 ring-teal-400'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{rpt.name}</span>
                      <span className="text-[10px] font-mono text-slate-400">{rpt.category}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{rpt.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Format & Filters (Right Column) */}
            <div className="lg:col-span-6 space-y-4">
              {/* Format Buttons */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-2">
                  2. Choose File Format:
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedFormat('csv')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      selectedFormat === 'csv'
                        ? 'bg-teal-700 text-white border-teal-700 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <FileCode className="w-5 h-5 mx-auto mb-1" />
                    <span className="font-bold text-xs block">CSV</span>
                    <span className="text-[10px] opacity-80 block font-mono">.csv file</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedFormat('xlsx')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      selectedFormat === 'xlsx'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <FileSpreadsheet className="w-5 h-5 mx-auto mb-1" />
                    <span className="font-bold text-xs block">Excel</span>
                    <span className="text-[10px] opacity-80 block font-mono">.xlsx sheet</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedFormat('pdf')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      selectedFormat === 'pdf'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <FileText className="w-5 h-5 mx-auto mb-1" />
                    <span className="font-bold text-xs block">PDF</span>
                    <span className="text-[10px] opacity-80 block font-mono">.pdf document</span>
                  </button>
                </div>
              </div>

              {/* Optional Filters */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <span className="text-xs font-semibold text-slate-800 block">
                  3. Optional Export Filters:
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-500 font-medium block mb-1">
                      Department
                    </label>
                    <select
                      value={selectedDept}
                      onChange={(e) => setSelectedDept(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="all">All Departments</option>
                      {departments.map((d) => (
                        <option key={d.id || d._id} value={d.id || d._id}>
                          {d.code || d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-500 font-medium block mb-1">
                      Semester
                    </label>
                    <select
                      value={selectedSemester}
                      onChange={(e) => setSelectedSemester(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="all">All Semesters</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <option key={s} value={s}>
                          Semester {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedReport === 'attendance' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-500 font-medium block mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500 font-medium block mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              Ready to generate: <strong className="text-slate-900">{currentReportInfo.name}</strong> as{' '}
              <strong className="text-teal-700 uppercase font-mono">.{selectedFormat}</strong>
            </div>

            <Button
              variant="teal"
              size="sm"
              type="submit"
              isLoading={isExporting}
              icon={Download}
              className="w-full sm:w-auto"
            >
              Generate & Download Export
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
};

export default ExecutiveReportsExport;

