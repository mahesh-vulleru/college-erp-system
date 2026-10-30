import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  HelpCircle,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Calendar,
  BookOpen,
  Phone,
  UserCheck,
  ChevronRight,
  TrendingDown,
  GraduationCap
} from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import Table from '../common/Table';
import Modal from '../common/Modal';
import Pagination from '../common/Pagination';
import EmptyState from '../common/EmptyState';
import api from '../../api/apiClient';
import { useToast } from '../../context/ToastContext';

export const StudentAtRiskAlerts = ({ departments = [] }) => {
  const { addToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState({
    totalEvaluated: 0,
    criticalCount: 0,
    warningCount: 0,
    safeCount: 0,
    below75Count: 0,
    withRecordsCount: 0,
    unassessedCount: 0
  });

  // Filters & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState('all');
  const [sortBy, setSortBy] = useState('risk');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Student Details Modal State
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [studentDetails, setStudentDetails] = useState(null);
  const [activeModalTab, setActiveModalTab] = useState('breakdown'); // 'breakdown' | 'results' | 'logs'

  // Fetch at-risk students from API
  const fetchAtRiskStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: pageSize,
        sortBy
      };

      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedDept !== 'all') params.department = selectedDept;
      if (selectedSemester !== 'all') params.semester = selectedSemester;
      if (selectedRiskLevel !== 'all') params.riskLevel = selectedRiskLevel;

      const res = await api.getAtRiskStudents(params);
      if (res?.data) {
        setStudents(res.data.students || []);
        if (res.data.summary) setSummary(res.data.summary);
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.totalPages || 1);
          setTotalRecords(res.data.pagination.total || 0);
        }
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Error loading at-risk students',
        message: err.message || 'Failed to fetch student attendance risk analytics.'
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, searchQuery, selectedDept, selectedSemester, selectedRiskLevel, sortBy, addToast]);

  useEffect(() => {
    fetchAtRiskStudents();
  }, [fetchAtRiskStudents]);

  // Handle View Details
  const handleViewDetails = async (studentId) => {
    setSelectedStudentId(studentId);
    setIsDetailsModalOpen(true);
    setIsLoadingDetails(true);
    setActiveModalTab('breakdown');
    try {
      const res = await api.getStudentRiskDetails(studentId);
      if (res?.data) {
        setStudentDetails(res.data);
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Failed to load details',
        message: err.message || 'Could not retrieve full attendance breakdown.'
      });
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedDept('all');
    setSelectedSemester('all');
    setSelectedRiskLevel('all');
    setSortBy('risk');
    setCurrentPage(1);
  };

  // Helper for risk badge
  const renderRiskBadge = (riskLevel) => {
    switch (riskLevel) {
      case 'critical':
        return (
          <Badge variant="danger" size="xs" className="font-semibold">
            <AlertOctagon className="w-3 h-3 mr-1 inline" /> Critical (&lt;65%)
          </Badge>
        );
      case 'warning':
        return (
          <Badge variant="amber" size="xs" className="font-semibold">
            <AlertTriangle className="w-3 h-3 mr-1 inline" /> Warning (65-74%)
          </Badge>
        );
      case 'safe':
        return (
          <Badge variant="success" size="xs" className="font-semibold">
            <CheckCircle2 className="w-3 h-3 mr-1 inline" /> Safe (≥75%)
          </Badge>
        );
      case 'unassessed':
      default:
        return (
          <Badge variant="neutral" size="xs" className="font-semibold">
            <HelpCircle className="w-3 h-3 mr-1 inline" /> Unassessed
          </Badge>
        );
    }
  };

  // Columns definition for Table
  const columns = [
    {
      header: 'Student Info',
      cell: (row) => (
        <div>
          <div className="font-bold text-navy-950 text-xs sm:text-sm">{row.name}</div>
          <div className="text-[11px] font-mono text-navy-500 mt-0.5">
            Roll: <span className="font-semibold text-navy-700">{row.rollNumber}</span>
            {row.batchYear && ` • Batch ${row.batchYear}`}
          </div>
          {row.guardianPhone && (
            <div className="text-[10px] text-slate-400 mt-0.5 flex items-center">
              <Phone className="w-2.5 h-2.5 mr-1 text-slate-400" />
              Guardian: {row.guardianPhone}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Department / Sem',
      cell: (row) => (
        <div>
          <span className="text-xs font-semibold text-navy-900 block">
            {row.department?.code || row.department?.name || 'General'}
          </span>
          <span className="text-[11px] text-navy-500 font-mono">
            Semester {row.currentSemester}
          </span>
        </div>
      )
    },
    {
      header: 'Attendance Record',
      cell: (row) => {
        const { totalClasses, presentClasses, percentage, hasRecords } = row.attendance;
        if (!hasRecords) {
          return (
            <span className="text-[11px] text-slate-400 italic">
              No sessions logged
            </span>
          );
        }
        return (
          <div className="w-32">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-navy-900">{percentage}%</span>
              <span className="text-[11px] text-navy-500 font-mono">
                {presentClasses}/{totalClasses}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  percentage < 65
                    ? 'bg-rose-500'
                    : percentage < 75
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>
        );
      }
    },
    {
      header: 'Academic Standing',
      cell: (row) => {
        const { failedCount, totalEvaluated, averageMarks } = row.academic;
        if (totalEvaluated === 0) {
          return <span className="text-[11px] text-slate-400 italic">No exams recorded</span>;
        }
        return (
          <div className="text-xs">
            {failedCount > 0 ? (
              <span className="text-rose-600 font-bold block">
                {failedCount} {failedCount === 1 ? 'Backlog' : 'Backlogs'}
              </span>
            ) : (
              <span className="text-emerald-700 font-semibold block">All Passed</span>
            )}
            <span className="text-[11px] text-navy-500 font-mono">
              Avg: {averageMarks !== null ? `${averageMarks}%` : 'N/A'} ({totalEvaluated} papers)
            </span>
          </div>
        );
      }
    },
    {
      header: 'Risk Classification',
      cell: (row) => (
        <div className="space-y-1">
          <div>{renderRiskBadge(row.riskLevel)}</div>
          {row.riskReasons && row.riskReasons.length > 0 && (
            <div className="text-[10px] text-slate-500 max-w-[200px] truncate" title={row.riskReasons.join('; ')}>
              {row.riskReasons[0]}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Action',
      cell: (row) => (
        <Button
          variant="outline"
          size="xs"
          onClick={() => handleViewDetails(row.id)}
          icon={Eye}
          className="text-teal-700 hover:text-teal-800 border-teal-300 hover:bg-teal-50"
        >
          View Details
        </Button>
      )
    }
  ];

  return (
    <Card
      title="Student At-Risk Identification & Attendance Alerts"
      subtitle="Early warning system monitoring attendance shortages (<75%) and academic backlogs across departments"
      headerAction={
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="xs"
            onClick={fetchAtRiskStudents}
            icon={RefreshCw}
            className="text-slate-600 hover:text-slate-900"
          >
            Refresh
          </Button>
        </div>
      }
    >
      {/* 1. Summary Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        {/* Below 75% Attendance */}
        <div
          onClick={() => {
            setSelectedRiskLevel(selectedRiskLevel === 'below75' ? 'all' : 'below75');
            setCurrentPage(1);
          }}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            selectedRiskLevel === 'below75'
              ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-200'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
              Total Below 75%
            </span>
            <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-950">{summary.below75Count}</div>
          <p className="text-[11px] text-rose-700/80 mt-1">
            Mandatory attendance shortage
          </p>
        </div>

        {/* Critical Risk (<65%) */}
        <div
          onClick={() => {
            setSelectedRiskLevel(selectedRiskLevel === 'critical' ? 'all' : 'critical');
            setCurrentPage(1);
          }}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            selectedRiskLevel === 'critical'
              ? 'bg-red-50 border-red-300 ring-2 ring-red-200'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-700">
              Critical Risk (&lt;65%)
            </span>
            <div className="w-7 h-7 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-red-950">{summary.criticalCount}</div>
          <p className="text-[11px] text-red-700/80 mt-1">
            Debarment threshold warning
          </p>
        </div>

        {/* Warning (65% to <75%) */}
        <div
          onClick={() => {
            setSelectedRiskLevel(selectedRiskLevel === 'warning' ? 'all' : 'warning');
            setCurrentPage(1);
          }}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            selectedRiskLevel === 'warning'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-200'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
              Warning (65% - 74%)
            </span>
            <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-950">{summary.warningCount}</div>
          <p className="text-[11px] text-amber-700/80 mt-1">
            Borderline academic status
          </p>
        </div>

        {/* Total Evaluated */}
        <div
          onClick={() => {
            setSelectedRiskLevel('all');
            setCurrentPage(1);
          }}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            selectedRiskLevel === 'all'
              ? 'bg-teal-50 border-teal-300 ring-2 ring-teal-200'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
              Evaluated Students
            </span>
            <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-teal-950">{summary.totalEvaluated}</div>
          <p className="text-[11px] text-teal-700/80 mt-1">
            {summary.withRecordsCount} active records logged
          </p>
        </div>
      </div>

      {/* 2. Filter & Search Bar */}
      <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 mb-5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search name or roll #..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id || d._id} value={d.id || d._id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          {/* Semester Filter */}
          <div>
            <select
              value={selectedSemester}
              onChange={(e) => {
                setSelectedSemester(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="all">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>
                  Semester {s}
                </option>
              ))}
            </select>
          </div>

          {/* Risk Level Filter */}
          <div>
            <select
              value={selectedRiskLevel}
              onChange={(e) => {
                setSelectedRiskLevel(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 font-medium"
            >
              <option value="all">All Risk Levels</option>
              <option value="below75">Below 75% Attendance (&lt;75%)</option>
              <option value="critical">Critical Risk (&lt;65% / Failures)</option>
              <option value="warning">Warning (65% - 74%)</option>
              <option value="safe">Safe (≥75% Attendance)</option>
              <option value="unassessed">Unassessed (No Data)</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="risk">Highest Risk First</option>
              <option value="attendance_asc">Lowest Attendance %</option>
              <option value="attendance_desc">Highest Attendance %</option>
              <option value="name">Student Name (A-Z)</option>
              <option value="rollNumber">Roll Number (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Active Filter Indicators */}
        {(searchQuery || selectedDept !== 'all' || selectedSemester !== 'all' || selectedRiskLevel !== 'all') && (
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
            <span className="text-slate-500">
              Showing filtered results ({totalRecords} students match)
            </span>
            <button
              onClick={handleResetFilters}
              className="text-teal-700 hover:text-teal-800 font-semibold cursor-pointer underline text-[11px]"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* 3. Students Table */}
      <Table
        columns={columns}
        data={students}
        keyField="id"
        isLoading={isLoading}
        emptyMessage="No at-risk students found matching the selected filters."
      />

      {/* 4. Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-end">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(p) => setCurrentPage(p)}
          />
        </div>
      )}

      {/* 5. Student Risk Details Modal */}
      {isDetailsModalOpen && (
        <Modal
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setStudentDetails(null);
          }}
          title="Student Academic & Attendance Profile"
          subtitle="Comprehensive institutional performance log for academic council evaluation"
          maxWidth="max-w-3xl"
        >
          {isLoadingDetails ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
              Loading student records from database...
            </div>
          ) : !studentDetails ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              Unable to load student details.
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              {/* Header Profile Info */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-slate-900">{studentDetails.student.name}</h3>
                    {renderRiskBadge(studentDetails.riskAssessment.riskLevel)}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                    <span>Roll: <strong className="text-slate-800">{studentDetails.student.rollNumber}</strong></span>
                    <span>•</span>
                    <span>Dept: <strong className="text-slate-800">{studentDetails.student.department}</strong></span>
                    <span>•</span>
                    <span>Sem: <strong className="text-slate-800">{studentDetails.student.semester}</strong></span>
                    <span>•</span>
                    <span>Batch: <strong className="text-slate-800">{studentDetails.student.batchYear}</strong></span>
                  </div>
                </div>

                <div className="text-right sm:border-l sm:border-slate-200 sm:pl-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Overall Attendance</span>
                  <div className="text-xl font-black text-slate-900 mt-0.5">
                    {studentDetails.attendanceSummary.hasRecords
                      ? `${studentDetails.attendanceSummary.percentage}%`
                      : 'No Records'}
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {studentDetails.attendanceSummary.presentClasses} of {studentDetails.attendanceSummary.totalClasses} classes
                  </span>
                </div>
              </div>

              {/* Reasons & Recommended Intervention */}
              {studentDetails.riskAssessment.reasons?.length > 0 && (
                <div
                  className={`p-3 rounded-xl border text-xs ${
                    studentDetails.riskAssessment.riskLevel === 'critical'
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : studentDetails.riskAssessment.riskLevel === 'warning'
                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}
                >
                  <span className="font-bold block mb-1">Risk Factors & Findings:</span>
                  <ul className="list-disc list-inside space-y-0.5">
                    {studentDetails.riskAssessment.reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                  {studentDetails.student.guardianPhone && (
                    <div className="mt-2 pt-2 border-t border-black/10 text-[11px] font-medium flex items-center">
                      <Phone className="w-3.5 h-3.5 mr-1.5" />
                      Guardian Contact: {studentDetails.student.guardianName || 'Guardian'} (
                      {studentDetails.student.guardianPhone})
                    </div>
                  )}
                </div>
              )}

              {/* Modal Tabs */}
              <div className="flex border-b border-slate-200 gap-4 text-xs font-semibold">
                <button
                  onClick={() => setActiveModalTab('breakdown')}
                  className={`pb-2 border-b-2 transition-colors cursor-pointer ${
                    activeModalTab === 'breakdown'
                      ? 'border-teal-600 text-teal-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Subject Attendance Breakdown ({studentDetails.subjectBreakdown?.length || 0})
                </button>
                <button
                  onClick={() => setActiveModalTab('results')}
                  className={`pb-2 border-b-2 transition-colors cursor-pointer ${
                    activeModalTab === 'results'
                      ? 'border-teal-600 text-teal-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Exam Results & Grades ({studentDetails.examResults?.length || 0})
                </button>
                <button
                  onClick={() => setActiveModalTab('logs')}
                  className={`pb-2 border-b-2 transition-colors cursor-pointer ${
                    activeModalTab === 'logs'
                      ? 'border-teal-600 text-teal-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Recent Attendance Logs ({studentDetails.recentAttendance?.length || 0})
                </button>
              </div>

              {/* Tab 1: Subject Attendance Breakdown */}
              {activeModalTab === 'breakdown' && (
                <div className="space-y-2">
                  {studentDetails.subjectBreakdown?.length === 0 ? (
                    <p className="text-center py-6 text-slate-400">
                      No subject-wise attendance logs recorded for this student.
                    </p>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                          <tr>
                            <th className="p-2.5">Subject</th>
                            <th className="p-2.5">Conducted</th>
                            <th className="p-2.5">Attended</th>
                            <th className="p-2.5">Absent</th>
                            <th className="p-2.5">Percentage</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {studentDetails.subjectBreakdown.map((sub, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2.5 font-medium text-slate-900">
                                {sub.subjectName}
                                <span className="text-[10px] text-slate-400 font-mono block">
                                  {sub.subjectCode}
                                </span>
                              </td>
                              <td className="p-2.5 font-mono text-slate-700">{sub.totalClasses}</td>
                              <td className="p-2.5 font-mono text-emerald-700 font-semibold">{sub.presentClasses}</td>
                              <td className="p-2.5 font-mono text-rose-600">{sub.absentClasses}</td>
                              <td className="p-2.5">
                                <div className="flex items-center space-x-2">
                                  <span
                                    className={`font-bold font-mono ${
                                      sub.percentage < 65
                                        ? 'text-rose-600'
                                        : sub.percentage < 75
                                        ? 'text-amber-600'
                                        : 'text-emerald-700'
                                    }`}
                                  >
                                    {sub.percentage}%
                                  </span>
                                  <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        sub.percentage < 65
                                          ? 'bg-rose-500'
                                          : sub.percentage < 75
                                          ? 'bg-amber-500'
                                          : 'bg-emerald-500'
                                      }`}
                                      style={{ width: `${Math.min(sub.percentage, 100)}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Exam Results */}
              {activeModalTab === 'results' && (
                <div className="space-y-2">
                  {studentDetails.examResults?.length === 0 ? (
                    <p className="text-center py-6 text-slate-400">
                      No published examination results found for this student.
                    </p>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                          <tr>
                            <th className="p-2.5">Subject</th>
                            <th className="p-2.5">Exam Series</th>
                            <th className="p-2.5">Internal</th>
                            <th className="p-2.5">External</th>
                            <th className="p-2.5">Total</th>
                            <th className="p-2.5">Grade</th>
                            <th className="p-2.5">Result</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {studentDetails.examResults.map((res, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2.5 font-medium text-slate-900">
                                {res.subject}
                                <span className="text-[10px] text-slate-400 font-mono block">
                                  {res.subjectCode}
                                </span>
                              </td>
                              <td className="p-2.5 text-slate-600">{res.examName}</td>
                              <td className="p-2.5 font-mono text-slate-700">{res.internalMarks}</td>
                              <td className="p-2.5 font-mono text-slate-700">{res.externalMarks}</td>
                              <td className="p-2.5 font-mono font-bold text-slate-900">{res.totalMarks}</td>
                              <td className="p-2.5 font-mono font-bold">{res.grade}</td>
                              <td className="p-2.5">
                                <Badge
                                  variant={res.status === 'passed' ? 'success' : 'danger'}
                                  size="xs"
                                >
                                  {res.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Recent Attendance Logs */}
              {activeModalTab === 'logs' && (
                <div className="space-y-2">
                  {studentDetails.recentAttendance?.length === 0 ? (
                    <p className="text-center py-6 text-slate-400">
                      No individual attendance logs found.
                    </p>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0">
                          <tr>
                            <th className="p-2">Date</th>
                            <th className="p-2">Period</th>
                            <th className="p-2">Subject</th>
                            <th className="p-2">Faculty</th>
                            <th className="p-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {studentDetails.recentAttendance.map((log, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2 font-mono text-slate-700">
                                {new Date(log.date).toLocaleDateString()}
                              </td>
                              <td className="p-2 font-mono text-slate-600">Period {log.periodNumber}</td>
                              <td className="p-2 font-medium text-slate-900">{log.subject}</td>
                              <td className="p-2 text-slate-600">{log.faculty}</td>
                              <td className="p-2">
                                <Badge
                                  variant={
                                    log.status === 'present'
                                      ? 'success'
                                      : log.status === 'absent'
                                      ? 'danger'
                                      : 'amber'
                                  }
                                  size="xs"
                                >
                                  {log.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex items-center justify-end pt-3 border-t border-slate-200">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setIsDetailsModalOpen(false);
                    setStudentDetails(null);
                  }}
                >
                  Close Profile
                </Button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </Card>
  );
};

export default StudentAtRiskAlerts;

