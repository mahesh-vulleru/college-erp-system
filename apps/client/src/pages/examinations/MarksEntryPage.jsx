import React, { useState, useEffect, useCallback } from 'react';
import {
  Edit3,
  Save,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Award,
  Users,
  Check,
  Calculator
} from 'lucide-react';
import api from '../../api/apiClient';
import ExamNavHeader from './ExamNavHeader';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';

export const MarksEntryPage = () => {
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchQuery, setSearchQuery] = useState('');

  const loadExamsAndSubjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const [examsRes, subjectsRes] = await Promise.all([
        api.getExams(),
        api.getSubjects().catch(() => ({ data: [] }))
      ]);

      if (examsRes && examsRes.data) {
        setExams(examsRes.data);
        if (examsRes.data.length > 0 && !selectedExamId) {
          setSelectedExamId(examsRes.data[0]._id);
        }
      }
      if (subjectsRes && subjectsRes.data) {
        setSubjects(subjectsRes.data);
        if (subjectsRes.data.length > 0 && !selectedSubjectId) {
          setSelectedSubjectId(subjectsRes.data[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to load exams & subjects:', err);
      setMessage({ type: 'error', text: err.message || 'Error loading examination list.' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedExamId, selectedSubjectId]);

  useEffect(() => {
    loadExamsAndSubjects();
  }, [loadExamsAndSubjects]);

  const loadMarksSheet = useCallback(async () => {
    if (!selectedExamId || !selectedSubjectId) return;

    setIsLoading(true);
    setMessage({ type: '', text: '' });
    try {
      // 1. Fetch registered candidates for this examination
      const regsRes = await api.getExamRegistrations({ examination: selectedExamId });
      // 2. Fetch existing results
      const resultsRes = await api.getResults({
        examination: selectedExamId,
        subject: selectedSubjectId
      });

      const existingMap = new Map();
      if (resultsRes && resultsRes.data) {
        resultsRes.data.forEach((r) => {
          const sId = r.student?._id || r.student;
          existingMap.set(String(sId), r);
        });
      }

      const list = [];
      if (regsRes && regsRes.data) {
        regsRes.data.forEach((reg) => {
          const sId = reg.student?._id;
          const existing = existingMap.get(String(sId));
          const internal = existing ? existing.internalMarks : 0;
          const external = existing ? existing.externalMarks : 0;
          const total = internal + external;

          let grade = 'F';
          if (total >= 90) grade = 'O';
          else if (total >= 80) grade = 'A+';
          else if (total >= 70) grade = 'A';
          else if (total >= 60) grade = 'B+';
          else if (total >= 50) grade = 'B';
          else if (total >= 40) grade = 'C';

          list.push({
            studentId: sId,
            rollNumber: reg.student?.rollNumber,
            name: reg.student?.user?.name,
            internalMarks: internal,
            externalMarks: external,
            totalMarks: total,
            grade: existing?.grade || grade,
            status: existing?.status || (total >= 40 ? 'passed' : 'failed'),
            verificationStatus: existing?.verificationStatus || 'pending_verification'
          });
        });
      }

      setRecords(list);
    } catch (err) {
      console.error('Failed to load marks entry sheet:', err);
      setMessage({ type: 'error', text: err.message || 'Error loading marks sheet.' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedExamId, selectedSubjectId]);

  useEffect(() => {
    loadMarksSheet();
  }, [loadMarksSheet]);

  const handleMarksChange = (studentId, field, val) => {
    const num = Math.max(0, parseInt(val, 10) || 0);

    setRecords((prev) =>
      prev.map((r) => {
        if (r.studentId !== studentId) return r;

        let internal = field === 'internal' ? Math.min(40, num) : r.internalMarks;
        let external = field === 'external' ? Math.min(60, num) : r.externalMarks;
        let total = internal + external;

        let grade = 'F';
        let status = 'failed';
        if (total >= 90) { grade = 'O'; status = 'passed'; }
        else if (total >= 80) { grade = 'A+'; status = 'passed'; }
        else if (total >= 70) { grade = 'A'; status = 'passed'; }
        else if (total >= 60) { grade = 'B+'; status = 'passed'; }
        else if (total >= 50) { grade = 'B'; status = 'passed'; }
        else if (total >= 40) { grade = 'C'; status = 'passed'; }

        return {
          ...r,
          internalMarks: internal,
          externalMarks: external,
          totalMarks: total,
          grade,
          status
        };
      })
    );
  };

  const handleSaveMarks = async () => {
    if (!selectedExamId || !selectedSubjectId || records.length === 0) return;

    setIsSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const payload = records.map((r) => ({
        studentId: r.studentId,
        internalMarks: r.internalMarks,
        externalMarks: r.externalMarks
      }));

      const res = await api.batchRecordResults({
        examination: selectedExamId,
        subject: selectedSubjectId,
        records: payload
      });

      if (res && res.data) {
        setMessage({
          type: 'success',
          text: `Marks entered successfully! Persisted ${records.length} candidate evaluation records.`
        });
        loadMarksSheet();
      }
    } catch (err) {
      console.error('Marks save error:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to save marks.' });
    } finally {
      setIsSaving(false);
    }
  };

  const totalEvaluated = records.length;
  const passCount = records.filter((r) => r.status === 'passed').length;
  const failCount = records.filter((r) => r.status === 'failed').length;
  const classAvg = totalEvaluated > 0
    ? Math.round(records.reduce((s, r) => s + r.totalMarks, 0) / totalEvaluated)
    : 0;

  const filteredRecords = records.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const roll = r.rollNumber?.toLowerCase() || '';
    const name = r.name?.toLowerCase() || '';
    return roll.includes(q) || name.includes(q);
  });

  return (
    <div className="space-y-6">
      <ExamNavHeader
        title="Faculty Examination Marks Entry Sheet"
        subtitle="Capture continuous internal assessments (Max 40) and semester-end external evaluations (Max 60) with real-time grade computation"
        actionButton={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveMarks}
              disabled={isSaving || records.length === 0}
            >
              <Save className="w-4 h-4 mr-1.5" />
              <span>{isSaving ? 'Persisting...' : 'Save All Marks'}</span>
            </Button>
            <Button variant="outline" size="sm" onClick={loadMarksSheet} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        }
      />

      {message.text && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 text-sm ${
            message.type === 'error'
              ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
              : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
          }`}
        >
          {message.type === 'error' ? (
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Select Exam & Subject */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Select Examination
            </label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full py-2 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              {exams.map((ex) => (
                <option key={ex._id} value={ex._id}>
                  {ex.name} (Sem {ex.semester} • {ex.academicYear})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Select Subject Session
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full py-2 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              {subjects.map((sub) => (
                <option key={sub._id} value={sub._id}>
                  {sub.code} - {sub.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Evaluation Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-indigo-600">
          <p className="text-xs text-gray-500">Candidates Enrolled</p>
          <h4 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalEvaluated}</h4>
        </Card>
        <Card className="p-4 border-l-4 border-l-blue-600">
          <p className="text-xs text-gray-500">Class Average Score</p>
          <h4 className="text-2xl font-bold text-blue-600 mt-1">{classAvg} / 100</h4>
        </Card>
        <Card className="p-4 border-l-4 border-l-emerald-600">
          <p className="text-xs text-gray-500">Passing Candidates (≥ 40)</p>
          <h4 className="text-2xl font-bold text-emerald-600 mt-1">{passCount}</h4>
        </Card>
        <Card className="p-4 border-l-4 border-l-red-600">
          <p className="text-xs text-gray-500">Backlogs / Failing (&lt; 40)</p>
          <h4 className="text-2xl font-bold text-red-600 mt-1">{failCount}</h4>
        </Card>
      </div>

      {/* Marks Entry Grid */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search candidate roll no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <span className="text-xs text-gray-500">
            Rules: Internal [0-40] • External [0-60] • Passing Total ≥ 40
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-gray-800 font-semibold text-gray-600 dark:text-gray-300 uppercase">
              <tr>
                <th className="py-3 px-4">Roll Number</th>
                <th className="py-3 px-4">Candidate Name</th>
                <th className="py-3 px-4">Internal Marks (Max 40)</th>
                <th className="py-3 px-4">External Marks (Max 60)</th>
                <th className="py-3 px-4">Total Marks (100)</th>
                <th className="py-3 px-4">Grade</th>
                <th className="py-3 px-4">Result Status</th>
                <th className="py-3 px-4">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-gray-400">
                    Loading marks entry sheet...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-gray-400">
                    No candidates registered for this examination.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.studentId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-4 font-mono font-medium text-gray-900 dark:text-white">
                      {r.rollNumber}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      {r.name || 'Student'}
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        min="0"
                        max="40"
                        value={r.internalMarks}
                        onChange={(e) => handleMarksChange(r.studentId, 'internal', e.target.value)}
                        className="w-20 py-1 px-2 font-mono text-center text-xs rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        min="0"
                        max="60"
                        value={r.externalMarks}
                        onChange={(e) => handleMarksChange(r.studentId, 'external', e.target.value)}
                        className="w-20 py-1 px-2 font-mono text-center text-xs rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400">
                      {r.totalMarks}
                    </td>
                    <td className="py-3 px-4 font-bold text-xs">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs ${
                          r.grade === 'O' || r.grade === 'A+' || r.grade === 'A'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.grade === 'B+' || r.grade === 'B' || r.grade === 'C'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {r.grade}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={r.status === 'passed' ? 'success' : 'danger'}>
                        {r.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          r.verificationStatus === 'verified'
                            ? 'success'
                            : r.verificationStatus === 'flagged'
                            ? 'danger'
                            : 'warning'
                        }
                      >
                        {r.verificationStatus}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default MarksEntryPage;

