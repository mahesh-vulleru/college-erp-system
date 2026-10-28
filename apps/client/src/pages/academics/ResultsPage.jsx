import React, { useState, useEffect, useCallback } from 'react';
import {
  Award,
  CheckCircle,
  XCircle,
  FileText,
  Plus,
  RefreshCw,
  Download,
  AlertTriangle,
  Search,
  BookOpen,
  ShieldAlert
} from 'lucide-react';
import api from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Notification from '../../components/common/Notification';
import { ROLES } from '@college-erp/shared';

export const ResultsPage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const isStudent = user?.role === ROLES.STUDENT;
  const isFacultyOrAdmin = user && [ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY].includes(user.role);

  const [results, setResults] = useState([]);
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Marks Entry Modal
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [entryFormData, setEntryFormData] = useState({
    examination: '',
    subject: '',
    student: '',
    internalMarks: 0,
    externalMarks: 0,
    status: 'passed'
  });
  const [entryError, setEntryError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDependencies = useCallback(async () => {
    try {
      const [eRes, sRes, stRes] = await Promise.all([
        api.getExams(),
        api.getSubjects(),
        api.getStudents()
      ]);
      const examList = eRes.data || [];
      const subList = sRes.data || [];
      const studentList = stRes.data?.students || stRes.data || [];

      setExams(examList);
      setSubjects(subList);
      setStudents(studentList);

      if (examList.length > 0) {
        setSelectedExam((prev) => prev || examList[0]._id);
      }
    } catch {
      // Non-blocking
    }
  }, []);

  const fetchResults = useCallback(async () => {
    if (!api.getToken()) return;
    setIsLoading(true);
    setError('');
    try {
      const params = {};
      if (selectedExam && !isStudent) params.examination = selectedExam;
      if (selectedSubject) params.subject = selectedSubject;

      const res = await api.getResults(params);
      setResults(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to retrieve assessment grades');
    } finally {
      setIsLoading(false);
    }
  }, [selectedExam, selectedSubject, isStudent]);

  useEffect(() => {
    fetchDependencies();
  }, [fetchDependencies]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const handleOpenEntry = () => {
    setEntryFormData({
      examination: selectedExam || exams[0]?._id || '',
      subject: selectedSubject || subjects[0]?._id || '',
      student: students[0]?._id || '',
      internalMarks: 25,
      externalMarks: 45,
      status: 'passed'
    });
    setEntryError('');
    setIsEntryModalOpen(true);
  };

  const handleEntrySubmit = async (e) => {
    e.preventDefault();
    const internal = Number(entryFormData.internalMarks);
    const external = Number(entryFormData.externalMarks);

    if (internal < 0 || internal > 40) {
      setEntryError('Internal Marks must be between 0 and 40');
      return;
    }
    if (external < 0 || external > 60) {
      setEntryError('External Marks must be between 0 and 60');
      return;
    }

    setSubmitting(true);
    setEntryError('');
    try {
      await api.recordResult(entryFormData);
      addToast('Marks submitted and grade computed', 'success');
      setIsEntryModalOpen(false);
      fetchResults();
    } catch (err) {
      setEntryError(err.message || 'Failed to record assessment marks');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    if (results.length === 0) return;
    const headers = ['Roll Number', 'Student Name', 'Subject Code', 'Internal (40)', 'External (60)', 'Total (100)', 'Grade', 'Status'];
    const rows = results.map((r) => [
      r.student?.rollNumber || '',
      `"${r.student?.user?.name || ''}"`,
      r.subject?.code || '',
      r.internalMarks,
      r.externalMarks,
      r.totalMarks,
      r.grade,
      r.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Grade_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Grade report exported successfully', 'success');
  };

  // Preview grade computation in entry modal
  const previewTotal = Number(entryFormData.internalMarks || 0) + Number(entryFormData.externalMarks || 0);
  let previewGrade = 'F';
  if (previewTotal >= 90) previewGrade = 'O';
  else if (previewTotal >= 80) previewGrade = 'A+';
  else if (previewTotal >= 70) previewGrade = 'A';
  else if (previewTotal >= 60) previewGrade = 'B+';
  else if (previewTotal >= 50) previewGrade = 'B';
  else if (previewTotal >= 40) previewGrade = 'C';

  const filteredResults = results.filter((r) => {
    const studentName = r.student?.user?.name || '';
    const rollNo = r.student?.rollNumber || '';
    const subCode = r.subject?.code || '';
    const q = searchQuery.toLowerCase();
    return studentName.toLowerCase().includes(q) || rollNo.toLowerCase().includes(q) || subCode.toLowerCase().includes(q);
  });

  // Calculate SGPA for student view
  const totalCredits = results.reduce((acc, r) => acc + (r.subject?.credits || 3), 0);
  const gradePointsMap = { O: 10, 'A+': 9, A: 8, 'B+': 7, B: 6, C: 5, F: 0, AB: 0 };
  const weightedPoints = results.reduce((acc, r) => acc + (gradePointsMap[r.grade] || 0) * (r.subject?.credits || 3), 0);
  const computedSGPA = totalCredits > 0 ? (weightedPoints / totalCredits).toFixed(2) : '0.00';

  const activeExamObj = exams.find((e) => e._id === selectedExam);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-950 tracking-tight flex items-center gap-2.5">
            <Award className="w-7 h-7 text-teal-600" />
            Marks & Academic Grade Evaluation
          </h1>
          <p className="text-sm text-navy-600">
            {isStudent
              ? 'Your authenticated semester grade card and published evaluation results.'
              : 'Internal & external marks entry, letter grade computation, and academic grade sheets.'}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={results.length === 0} className="flex items-center gap-1.5">
            <Download className="w-4 h-4" />
            Export Grade Sheet
          </Button>
          <Button variant="outline" size="sm" onClick={fetchResults} disabled={isLoading} className="flex items-center gap-1.5">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {isFacultyOrAdmin && (
            <Button variant="primary" size="sm" onClick={handleOpenEntry} className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700">
              <Plus className="w-4 h-4" />
              Enter Student Marks
            </Button>
          )}
        </div>
      </div>

      {error && <Notification type="error" message={error} onClose={() => setError('')} />}

      {/* STUDENT OFFICIAL GRADE CARD VIEW */}
      {isStudent && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <Card className="p-5 border-navy-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-navy-500 uppercase">Cumulative SGPA</span>
                <div className="text-3xl font-extrabold text-teal-800 mt-1">{computedSGPA}</div>
                <span className="text-xs text-navy-500">Scale of 10.00</span>
              </div>
              <div className="p-3 bg-teal-50 text-teal-700 rounded-2xl">
                <Award className="w-8 h-8" />
              </div>
            </Card>
            <Card className="p-5 border-navy-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-navy-500 uppercase">Evaluated Subjects</span>
                <div className="text-3xl font-extrabold text-navy-950 mt-1">{results.length}</div>
                <span className="text-xs text-navy-500">{totalCredits} Total Credits Registered</span>
              </div>
              <div className="p-3 bg-navy-50 text-navy-700 rounded-2xl">
                <BookOpen className="w-8 h-8" />
              </div>
            </Card>
            <Card className="p-5 border-navy-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-navy-500 uppercase">Academic Status</span>
                <div className="text-lg font-bold text-emerald-700 mt-1">
                  {results.some((r) => r.grade === 'F') ? 'Supplementary Pending' : 'Semester Cleared'}
                </div>
                <span className="text-xs text-navy-500">Institutional Governance</span>
              </div>
              <Badge variant={results.some((r) => r.grade === 'F') ? 'danger' : 'success'}>
                {results.some((r) => r.grade === 'F') ? 'Backlog' : 'Pass'}
              </Badge>
            </Card>
          </div>
        </div>
      )}

      {/* FACULTY / ADMIN FILTER CARD */}
      {isFacultyOrAdmin && (
        <Card className="p-4 border-navy-100 bg-white space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
            <div>
              <label className="block text-[11px] font-bold text-navy-700 uppercase mb-1">Assessment Examination</label>
              <select
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
                className="w-full text-xs border border-navy-200 rounded-lg p-2.5 bg-white text-navy-800 focus:ring-2 focus:ring-teal-500"
              >
                <option value="">All Examinations</option>
                {exams.map((e) => (
                  <option key={e._id} value={e._id}>
                    {e.name} ({e.examType})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-navy-700 uppercase mb-1">Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full text-xs border border-navy-200 rounded-lg p-2.5 bg-white text-navy-800 focus:ring-2 focus:ring-teal-500"
              >
                <option value="">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.code} - {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative pt-4 sm:pt-0">
              <label className="block text-[11px] font-bold text-navy-700 uppercase mb-1">Search Student</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-navy-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Roll number or student name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {activeExamObj && (
            <div className="pt-2 border-t border-navy-100 flex items-center justify-between text-xs">
              <span className="text-navy-500">
                Selected Exam Publication Status:{' '}
                <strong className={activeExamObj.isPublished ? 'text-emerald-700' : 'text-amber-700'}>
                  {activeExamObj.isPublished ? 'Published to Students' : 'Draft / Moderation (Unpublished)'}
                </strong>
              </span>
              {!activeExamObj.isPublished && (
                <span className="text-amber-600 flex items-center gap-1 text-[11px]">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Students cannot view these marks until publication is enabled in Examinations.
                </span>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Grade Table */}
      <Card className="overflow-hidden border-navy-100 shadow-sm">
        {isLoading ? (
          <div className="py-20 text-center">
            <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-2" />
            <p className="text-sm text-navy-500">Compiling assessment grade sheets...</p>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="py-16 text-center text-navy-500 text-sm">
            <Award className="w-10 h-10 text-navy-300 mx-auto mb-2" />
            <p className="font-semibold text-navy-800">No examination results registered</p>
            <p className="text-xs text-navy-500 mt-1">
              {isStudent
                ? 'Your instructors have not yet published results for the selected examination cycle.'
                : 'Click "Enter Student Marks" to evaluate marks for students.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-navy-900 text-white font-semibold">
                  {!isStudent && <th className="py-3 px-4">Roll Number</th>}
                  {!isStudent && <th className="py-3 px-4">Student Name</th>}
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4 text-center">Internal (Max 40)</th>
                  <th className="py-3 px-4 text-center">External (Max 60)</th>
                  <th className="py-3 px-4 text-center">Total (100)</th>
                  <th className="py-3 px-4 text-center">Grade</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {filteredResults.map((res) => (
                  <tr key={res._id} className="hover:bg-navy-50/40 transition-colors">
                    {!isStudent && (
                      <td className="py-3 px-4 font-mono font-bold text-navy-950">
                        {res.student?.rollNumber || 'N/A'}
                      </td>
                    )}
                    {!isStudent && (
                      <td className="py-3 px-4 font-semibold text-navy-900">
                        {res.student?.user?.name || 'Registered Student'}
                      </td>
                    )}
                    <td className="py-3 px-4">
                      <div className="font-bold text-navy-950">{res.subject?.code}</div>
                      <div className="text-[11px] text-navy-500 line-clamp-1">{res.subject?.name}</div>
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-navy-800">{res.internalMarks}</td>
                    <td className="py-3 px-4 text-center font-semibold text-navy-800">{res.externalMarks}</td>
                    <td className="py-3 px-4 text-center font-extrabold text-navy-950 text-sm">{res.totalMarks}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block w-8 py-0.5 text-center font-bold text-xs rounded ${
                          res.grade === 'O' || res.grade === 'A+' || res.grade === 'A'
                            ? 'bg-emerald-100 text-emerald-800'
                            : res.grade === 'F'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-teal-100 text-teal-800'
                        }`}
                      >
                        {res.grade}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={res.status === 'passed' ? 'success' : 'danger'}>
                        {res.status.toUpperCase()}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Enter Marks Modal */}
      <Modal
        isOpen={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
        title="Enter Assessment Marks"
      >
        <form onSubmit={handleEntrySubmit} className="space-y-4">
          {entryError && <Notification type="error" message={entryError} onClose={() => setEntryError('')} />}

          <div>
            <label className="block text-xs font-semibold text-navy-800 uppercase tracking-wider mb-1">
              Examination *
            </label>
            <select
              value={entryFormData.examination}
              onChange={(e) => setEntryFormData({ ...entryFormData, examination: e.target.value })}
              className="w-full text-xs border border-navy-200 rounded-lg p-2.5 bg-white text-navy-800 focus:ring-2 focus:ring-teal-500"
              required
            >
              <option value="">-- Select Examination --</option>
              {exams.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.name} ({e.examType})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-navy-800 uppercase tracking-wider mb-1">
                Curriculum Subject *
              </label>
              <select
                value={entryFormData.subject}
                onChange={(e) => setEntryFormData({ ...entryFormData, subject: e.target.value })}
                className="w-full text-xs border border-navy-200 rounded-lg p-2.5 bg-white text-navy-800 focus:ring-2 focus:ring-teal-500"
                required
              >
                <option value="">-- Choose Subject --</option>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.code} - {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-navy-800 uppercase tracking-wider mb-1">
                Student *
              </label>
              <select
                value={entryFormData.student}
                onChange={(e) => setEntryFormData({ ...entryFormData, student: e.target.value })}
                className="w-full text-xs border border-navy-200 rounded-lg p-2.5 bg-white text-navy-800 focus:ring-2 focus:ring-teal-500"
                required
              >
                <option value="">-- Select Student --</option>
                {students.map((st) => (
                  <option key={st._id} value={st._id}>
                    {st.rollNumber} - {st.user?.name || 'Student'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-navy-50/70 p-3.5 rounded-xl border border-navy-100">
            <div>
              <label className="block text-xs font-bold text-navy-800 mb-1">
                Internal Test Marks (Max 40) *
              </label>
              <input
                type="number"
                min="0"
                max="40"
                value={entryFormData.internalMarks}
                onChange={(e) => setEntryFormData({ ...entryFormData, internalMarks: e.target.value })}
                className="w-full text-sm font-semibold border border-navy-200 rounded-lg p-2 text-navy-950 focus:ring-2 focus:ring-teal-500 bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-navy-800 mb-1">
                External Exam Marks (Max 60) *
              </label>
              <input
                type="number"
                min="0"
                max="60"
                value={entryFormData.externalMarks}
                onChange={(e) => setEntryFormData({ ...entryFormData, externalMarks: e.target.value })}
                className="w-full text-sm font-semibold border border-navy-200 rounded-lg p-2 text-navy-950 focus:ring-2 focus:ring-teal-500 bg-white"
                required
              />
            </div>
          </div>

          {/* Real-time Computed Grade Preview */}
          <div className="flex items-center justify-between p-3 bg-teal-50/80 rounded-xl border border-teal-100 text-xs">
            <div>
              <span className="text-teal-900 font-medium">Computed Total Marks:</span>
              <span className="font-extrabold text-teal-950 ml-1.5 text-sm">{previewTotal} / 100</span>
            </div>
            <div>
              <span className="text-teal-900 font-medium">Letter Grade:</span>
              <span className="font-extrabold text-teal-800 ml-1.5 text-sm bg-teal-200/60 px-2 py-0.5 rounded">
                {previewGrade}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="ghost" type="button" onClick={() => setIsEntryModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting} className="bg-teal-600">
              {submitting ? 'Recording Marks...' : 'Submit & Compute Grade'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ResultsPage;

