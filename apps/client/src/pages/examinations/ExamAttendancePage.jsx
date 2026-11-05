import React, { useState, useEffect, useCallback } from 'react';
import {
  ClipboardList,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Save,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  ShieldAlert
} from 'lucide-react';
import api from '../../api/apiClient';
import ExamNavHeader from './ExamNavHeader';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';

export const ExamAttendancePage = () => {
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [roster, setRoster] = useState([]);
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
      console.error('Failed to load initial exam data:', err);
      setMessage({ type: 'error', text: err.message || 'Error loading examination list.' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedExamId, selectedSubjectId]);

  useEffect(() => {
    loadExamsAndSubjects();
  }, [loadExamsAndSubjects]);

  const loadAttendanceRoster = useCallback(async () => {
    if (!selectedExamId || !selectedSubjectId) return;

    setIsLoading(true);
    setMessage({ type: '', text: '' });
    try {
      // 1. Fetch registrations for this exam
      const regsRes = await api.getExamRegistrations({ examination: selectedExamId });
      // 2. Fetch existing exam attendance records for this exam & subject
      const attRes = await api.getExamAttendance({
        examination: selectedExamId,
        subject: selectedSubjectId
      });

      const existingMap = new Map();
      if (attRes && attRes.data) {
        attRes.data.forEach((a) => {
          const sId = a.student?._id || a.student;
          existingMap.set(String(sId), a);
        });
      }

      const list = [];
      if (regsRes && regsRes.data) {
        regsRes.data.forEach((reg) => {
          const sId = reg.student?._id;
          const existing = existingMap.get(String(sId));
          list.push({
            studentId: sId,
            rollNumber: reg.student?.rollNumber,
            name: reg.student?.user?.name,
            seatNumber: reg.seatNumber || 'TBD',
            status: existing ? existing.status : 'present',
            remarks: existing ? existing.remarks : ''
          });
        });
      }

      setRoster(list);
    } catch (err) {
      console.error('Failed to load attendance roster:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to load attendance roster.' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedExamId, selectedSubjectId]);

  useEffect(() => {
    loadAttendanceRoster();
  }, [loadAttendanceRoster]);

  const setStatusForStudent = (studentId, status) => {
    setRoster((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, status } : r))
    );
  };

  const setRemarksForStudent = (studentId, remarks) => {
    setRoster((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, remarks } : r))
    );
  };

  const handleMarkAll = (status) => {
    setRoster((prev) => prev.map((r) => ({ ...r, status })));
  };

  const handleSaveAttendance = async () => {
    if (!selectedExamId || !selectedSubjectId || roster.length === 0) return;

    setIsSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const records = roster.map((r) => ({
        studentId: r.studentId,
        status: r.status,
        remarks: r.remarks
      }));

      const res = await api.recordExamAttendanceBatch({
        examination: selectedExamId,
        subject: selectedSubjectId,
        records
      });

      if (res && res.data) {
        setMessage({
          type: 'success',
          text: `Attendance successfully submitted! Recorded attendance for ${roster.length} candidate(s).`
        });
        loadAttendanceRoster();
      }
    } catch (err) {
      console.error('Attendance submit error:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to record examination attendance.' });
    } finally {
      setIsSaving(false);
    }
  };

  const presentCount = roster.filter((r) => r.status === 'present').length;
  const absentCount = roster.filter((r) => r.status === 'absent').length;
  const malpracticeCount = roster.filter((r) => r.status === 'malpractice').length;

  const filteredRoster = roster.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const roll = r.rollNumber?.toLowerCase() || '';
    const name = r.name?.toLowerCase() || '';
    const seat = r.seatNumber?.toLowerCase() || '';
    return roll.includes(q) || name.includes(q) || seat.includes(q);
  });

  return (
    <div className="space-y-6">
      <ExamNavHeader
        title="Examination Hall Attendance Desk"
        subtitle="Record invigilator attendance sheets, mark absentees, and flag examination hall malpractice infractions"
        actionButton={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveAttendance}
              disabled={isSaving || roster.length === 0}
            >
              <Save className="w-4 h-4 mr-1.5" />
              <span>{isSaving ? 'Submitting...' : 'Submit Attendance'}</span>
            </Button>
            <Button variant="outline" size="sm" onClick={loadAttendanceRoster} disabled={isLoading}>
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
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
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

      {/* Roster Counters & Quick Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-l-emerald-600 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Present Candidates</p>
            <h4 className="text-2xl font-bold text-emerald-600 mt-1">{presentCount}</h4>
          </div>
          <Button variant="outline" size="sm" onClick={() => handleMarkAll('present')}>
            Mark All Present
          </Button>
        </Card>
        <Card className="p-4 border-l-4 border-l-red-600 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Absent Candidates</p>
            <h4 className="text-2xl font-bold text-red-600 mt-1">{absentCount}</h4>
          </div>
          <Button variant="outline" size="sm" onClick={() => handleMarkAll('absent')}>
            Mark All Absent
          </Button>
        </Card>
        <Card className="p-4 border-l-4 border-l-amber-600 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Malpractice Cases</p>
            <h4 className="text-2xl font-bold text-amber-600 mt-1">{malpracticeCount}</h4>
          </div>
          <span className="text-xs text-amber-600 font-medium">Invigilator Report</span>
        </Card>
      </div>

      {/* Attendance Roster Grid */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search candidate or seat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <span className="text-xs text-gray-500">
            Total Candidates on Roll: <strong className="text-gray-900 dark:text-white">{filteredRoster.length}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-gray-800 font-semibold text-gray-600 dark:text-gray-300 uppercase">
              <tr>
                <th className="py-3 px-4">Seat #</th>
                <th className="py-3 px-4">Roll Number</th>
                <th className="py-3 px-4">Candidate Name</th>
                <th className="py-3 px-4 text-center">Attendance Status</th>
                <th className="py-3 px-4">Malpractice / Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-gray-400">
                    Loading candidate attendance roster...
                  </td>
                </tr>
              ) : filteredRoster.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-gray-400">
                    No candidates registered for this examination.
                  </td>
                </tr>
              ) : (
                filteredRoster.map((item) => (
                  <tr key={item.studentId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {item.seatNumber}
                    </td>
                    <td className="py-3 px-4 font-mono">{item.rollNumber}</td>
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                      {item.name || 'Student'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setStatusForStudent(item.studentId, 'present')}
                          className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                            item.status === 'present'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          Present
                        </button>
                        <button
                          type="button"
                          onClick={() => setStatusForStudent(item.studentId, 'absent')}
                          className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                            item.status === 'absent'
                              ? 'bg-red-600 text-white'
                              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          Absent
                        </button>
                        <button
                          type="button"
                          onClick={() => setStatusForStudent(item.studentId, 'malpractice')}
                          className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                            item.status === 'malpractice'
                              ? 'bg-amber-600 text-white'
                              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          Malpractice
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {item.status === 'malpractice' ? (
                        <input
                          type="text"
                          placeholder="Note infraction detail (e.g. Unauthorized material)..."
                          value={item.remarks}
                          onChange={(e) => setRemarksForStudent(item.studentId, e.target.value)}
                          className="w-full py-1 px-2 text-xs rounded border border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200"
                        />
                      ) : (
                        <span className="text-gray-400 text-xs">Normal</span>
                      )}
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

export default ExamAttendancePage;

