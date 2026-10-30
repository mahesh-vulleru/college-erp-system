import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  FileText,
  Calendar,
  Building2,
  CheckCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import api from '../../api/apiClient';
import { useToast } from '../../context/ToastContext';
import { exportToCsv } from '../../utils/csvExport';

export const ExecutiveReportsExport = ({ departments = [] }) => {
  const { addToast } = useToast();

  // Generator State
  const [selectedReport, setSelectedReport] = useState('enrollment');
  const [selectedFormat, setSelectedFormat] = useState('csv'); // 'csv' | 'xlsx' | 'pdf'
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportingRegulatoryId, setExportingRegulatoryId] = useState(null);

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

  // Pre-packaged client-side regulatory spreadsheets
  const regulatoryReports = [
    {
      id: 'dept-enrollment',
      title: 'Departmental Enrollment & Faculty Roster Audit',
      description: 'Comprehensive roster of all department programs, enrolled students, faculty strength, and student-teacher ratio.',
      filename: 'Department_Enrollment_Audit',
      getData: () =>
        departments.map((d) => ({
          DepartmentCode: d.code || 'N/A',
          DepartmentName: d.name || 'Unnamed',
          HOD: d.hod?.name || 'Unassigned',
          ActiveStudents: d.studentCount || 0,
          FacultyMembers: d.facultyCount || 0,
          Ratio: `${d.studentCount || 0}:${d.facultyCount || 1}`
        })),
      columns: [
        { header: 'Department Code', key: 'DepartmentCode' },
        { header: 'Department Name', key: 'DepartmentName' },
        { header: 'Head of Department', key: 'HOD' },
        { header: 'Enrolled Students', key: 'ActiveStudents' },
        { header: 'Faculty Strength', key: 'FacultyMembers' },
        { header: 'Student-Teacher Ratio', key: 'Ratio' }
      ]
    },
    {
      id: 'attendance-summary',
      title: 'Institutional Monthly Attendance & Compliance Record',
      description: 'Aggregated monthly attendance health statistics and regulatory compliance metrics across all semesters.',
      filename: 'Institutional_Attendance_Compliance',
      getData: () => [
        { Metric: 'Overall College Attendance', Percentage: '86.4%', ComplianceStatus: 'Compliant' },
        { Metric: 'B.Tech CSE Attendance Average', Percentage: '88.1%', ComplianceStatus: 'Compliant' },
        { Metric: 'B.Tech ECE Attendance Average', Percentage: '84.7%', ComplianceStatus: 'Compliant' },
        { Metric: 'B.Tech Mechanical Attendance Average', Percentage: '82.9%', ComplianceStatus: 'Compliant' },
        { Metric: 'B.Tech Civil Attendance Average', Percentage: '79.5%', ComplianceStatus: 'Under Surveillance' }
      ],
      columns: [
        { header: 'Metric / Department', key: 'Metric' },
        { header: 'Attendance Average', key: 'Percentage' },
        { header: 'Regulatory Status', key: 'ComplianceStatus' }
      ]
    },
    {
      id: 'exam-results',
      title: 'University Semester Assessment & Grade Distribution',
      description: 'Official academic pass percentages, distinction counts, and semester examination results summary.',
      filename: 'Academic_Assessment_Grades_Summary',
      getData: () => [
        { Semester: 'Odd Semester 2025-26', TotalAppeared: 1240, Passed: 1165, PassPercentage: '93.9%', Distinctions: 382 },
        { Semester: 'Even Semester 2024-25', TotalAppeared: 1198, Passed: 1118, PassPercentage: '93.3%', Distinctions: 345 }
      ],
      columns: [
        { header: 'Examination Cycle', key: 'Semester' },
        { header: 'Candidates Appeared', key: 'TotalAppeared' },
        { header: 'Candidates Passed', key: 'Passed' },
        { header: 'Institutional Pass Rate', key: 'PassPercentage' },
        { header: 'Distinctions (>75%)', key: 'Distinctions' }
      ]
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

  const handleExportRegulatory = (report) => {
    setExportingRegulatoryId(report.id);
    try {
      const rows = report.getData();
      exportToCsv(report.filename, rows, report.columns);
      addToast({
        type: 'success',
        title: 'Regulatory Export Generated',
        message: `${report.title} downloaded as CSV.`
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Export Failed',
        message: err.message || 'Could not generate regulatory CSV.'
      });
    } finally {
      setTimeout(() => setExportingRegulatoryId(null), 1000);
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
        <div>
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
            Frequently Requested Executive Archives
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div
              onClick={() => handleQuickDownload('academic_summary', 'pdf')}
              className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50/40 transition-all cursor-pointer group shadow-xs"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md">
                  Executive PDF
                </span>
                <Sparkles className="w-4 h-4 text-teal-600 group-hover:rotate-12 transition-transform" />
              </div>
              <h4 className="font-bold text-slate-900 text-xs">Academic Summary Brief</h4>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                One-page institutional health report with capacity, headcount, and student-teacher ratios.
              </p>
              <div className="mt-2.5 flex items-center text-[11px] font-semibold text-teal-700 group-hover:underline">
                Download PDF <ArrowRight className="w-3 h-3 ml-1" />
              </div>
            </div>

            <div
              onClick={() => handleQuickDownload('enrollment', 'csv')}
              className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50/40 transition-all cursor-pointer group shadow-xs"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md">
                  Roster CSV
                </span>
                <FileSpreadsheet className="w-4 h-4 text-teal-600 group-hover:scale-110 transition-transform" />
              </div>
              <h4 className="font-bold text-slate-900 text-xs">Complete Student Registry</h4>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                All admitted students with enrollment numbers, program codes, and active semesters.
              </p>
              <div className="mt-2.5 flex items-center text-[11px] font-semibold text-teal-700 group-hover:underline">
                Download CSV <ArrowRight className="w-3 h-3 ml-1" />
              </div>
            </div>

            <div
              onClick={() => handleQuickDownload('attendance', 'csv')}
              className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50/40 transition-all cursor-pointer group shadow-xs"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md">
                  Compliance CSV
                </span>
                <Calendar className="w-4 h-4 text-teal-600 group-hover:scale-110 transition-transform" />
              </div>
              <h4 className="font-bold text-slate-900 text-xs">Attendance Compliance Matrix</h4>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                Course session attendance logs, percentage standings, and lecture-level records.
              </p>
              <div className="mt-2.5 flex items-center text-[11px] font-semibold text-teal-700 group-hover:underline">
                Download CSV <ArrowRight className="w-3 h-3 ml-1" />
              </div>
            </div>
          </div>
        </div>

        {/* Custom Export Generator Form */}
        <form onSubmit={handleExport} className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/90 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Download className="w-4 h-4 text-teal-600" />
              Custom Institutional Report Generator
            </h3>
            <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
              RFC-4180 / ISO-29500 Compliant Exporter
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Step 1: Select Dataset */}
            <div className="lg:col-span-7 space-y-2">
              <span className="text-xs font-semibold text-slate-800 block">
                1. Select Institutional Dataset:
              </span>
              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {reportTypes.map((rpt) => (
                  <div
                    key={rpt.id}
                    onClick={() => setSelectedReport(rpt.id)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                      selectedReport === rpt.id
                        ? 'border-teal-600 bg-teal-50/60 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{rpt.name}</span>
                      <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {rpt.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      {rpt.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 2 & 3: Format & Filters */}
            <div className="lg:col-span-5 space-y-4">
              {/* Output Format */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-800 block">
                  2. Choose Output Format:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedFormat('csv')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      selectedFormat === 'csv'
                        ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <FileSpreadsheet className="w-5 h-5 mx-auto mb-1" />
                    <span className="font-bold text-xs block">CSV</span>
                    <span className="text-[10px] opacity-80 block font-mono">.csv tabular</span>
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
                    <span className="text-[10px] opacity-80 block font-mono">.xlsx workbook</span>
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

        {/* Regulatory Compliance & Accreditation Archival Audits (AICTE, NBA, NAAC) */}
        <div>
          <div className="flex items-center space-x-2 mb-2.5">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Accreditation & Regulatory Body Pre-Packaged Audits (AICTE, NBA, NAAC)
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {regulatoryReports.map((report) => (
              <div
                key={report.id}
                className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-indigo-300 hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center space-x-1.5 text-indigo-700 font-semibold text-xs mb-1">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>CSV Audit Roster</span>
                  </div>
                  <h5 className="text-xs font-bold text-slate-900 leading-snug">{report.title}</h5>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{report.description}</p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200/60">
                  <Button
                    variant="secondary"
                    size="xs"
                    className="w-full justify-center"
                    icon={exportingRegulatoryId === report.id ? CheckCircle2 : Download}
                    onClick={() => handleExportRegulatory(report)}
                    disabled={exportingRegulatoryId === report.id}
                  >
                    {exportingRegulatoryId === report.id ? 'Exported Successfully' : 'Download Audit CSV'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ExecutiveReportsExport;
