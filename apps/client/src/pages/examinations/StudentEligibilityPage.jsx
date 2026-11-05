import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  FileCheck2,
  Cpu
} from 'lucide-react';
import api from '../../api/apiClient';
import ExamNavHeader from './ExamNavHeader';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

export const StudentEligibilityPage = () => {
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [registrations, setRegistrations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Condonation Modal
  const [isCondoneModalOpen, setIsCondoneModalOpen] = useState(false);
  const [selectedReg, setSelectedReg] = useState(null);
  const [condoneRemarks, setCondoneRemarks] = useState('');
  const [isSubmittingCondone, setIsSubmittingCondone] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const examsRes = await api.getExams();
      if (examsRes && examsRes.data) {
        setExams(examsRes.data);
        const currentId = selectedExamId || (examsRes.data[0] ? examsRes.data[0]._id : '');
        if (currentId && !selectedExamId) {
          setSelectedExamId(currentId);
        }

        if (currentId) {
          const regsRes = await api.getExamRegistrations({
            examination: currentId,
            eligibilityStatus: statusFilter !== 'all' ? statusFilter : undefined
          });
          if (regsRes && regsRes.data) {
            setRegistrations(regsRes.data);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load eligibility data:', err);
      setMessage({ type: 'error', text: err.message || 'Error loading eligibility data' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedExamId, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExamChange = (examId) => {
    setSelectedExamId(examId);
    setMessage({ type: '', text: '' });
  };

  const handleEvaluateEligibility = async () => {
    if (!selectedExamId) return;

    setIsEvaluating(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await api.evaluateExamEligibility(selectedExamId);
      if (res && res.data) {
        setMessage({
          type: 'success',
          text: `Eligibility evaluation completed! Analyzed ${res.data.evaluatedCount} candidates against statutory 75% cutoff.`
        });
        loadData();
      }
    } catch (err) {
      console.error('Failed to evaluate eligibility:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to evaluate eligibility.' });
    } finally {
      setIsEvaluating(false);
    }
  };

  const openCondoneModal = (reg) => {
    setSelectedReg(reg);
    setCondoneRemarks('Medical certificate verified & sanctioned by Principal.');
    setIsCondoneModalOpen(true);
  };

  const handleSanctionCondone = async (e) => {
    e.preventDefault();
    if (!selectedReg) return;

    setIsSubmittingCondone(true);
    try {
      await api.condoneShortage(selectedReg._id, {
        condonedRemarks: condoneRemarks
      });
      setIsCondoneModalOpen(false);
      setMessage({
        type: 'success',
        text: `Attendance shortage successfully condoned for ${selectedReg.student?.rollNumber}. Status set to CONDONED.`
      });
      loadData();
    } catch (err) {
      console.error('Condonation sanction error:', err);
      alert(err.message || 'Failed to sanction condonation');
    } finally {
      setIsSubmittingCondone(false);
    }
  };

  const totalCandidates = registrations.length;
  const eligibleCount = registrations.filter((r) => r.eligibilityStatus === 'eligible').length;
  const shortageCount = registrations.filter((r) => r.eligibilityStatus === 'shortage').length;
  const condonedCount = registrations.filter((r) => r.eligibilityStatus === 'condoned').length;

  const filteredRegistrations = registrations.filter((reg) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const roll = reg.student?.rollNumber?.toLowerCase() || '';
    const name = reg.student?.user?.name?.toLowerCase() || '';
    return roll.includes(q) || name.includes(q);
  });

  const currentExam = exams.find((e) => e._id === selectedExamId);

  return (
    <div className="space-y-6">
      <ExamNavHeader
        title="Student Eligibility & Condonation Desk"
        subtitle="Enforce the statutory 75% attendance threshold cutoff, identify shortages, and process authorized condonation waivers"
        actionButton={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleEvaluateEligibility}
              disabled={isEvaluating || !selectedExamId}
            >
              <Cpu className={`w-4 h-4 mr-1.5 ${isEvaluating ? 'animate-spin' : ''}`} />
              <span>{isEvaluating ? 'Evaluating...' : 'Run Cutoff Evaluation'}</span>
            </Button>
            <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
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

      {/* Select Exam & Cutoff Info */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Select Examination
            </label>
            <select
              value={selectedExamId}
              onChange={(e) => handleExamChange(e.target.value)}
              className="w-full py-2 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              {exams.map((ex) => (
                <option key={ex._id} value={ex._id}>
                  {ex.name} (Sem {ex.semester} • {ex.academicYear})
                </option>
              ))}
            </select>
          </div>
          {currentExam && (
            <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-300">
              <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-lg font-medium">
                Mandatory Cutoff: {currentExam.attendanceCutoffPercentage || 75}%
              </span>
              <span>Semester {currentExam.semester}</span>
            </div>
          )}
        </div>
      </Card>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-indigo-600">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Enrolled</p>
          <h4 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalCandidates}</h4>
          <p className="text-[11px] text-gray-400 mt-1">Candidates in register</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-emerald-600">
          <p className="text-xs text-gray-500 dark:text-gray-400">Eligible (≥ 75%)</p>
          <h4 className="text-2xl font-bold text-emerald-600 mt-1">{eligibleCount}</h4>
          <p className="text-[11px] text-emerald-600/80 mt-1">Directly hall-ticket eligible</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-red-600">
          <p className="text-xs text-gray-500 dark:text-gray-400">Attendance Shortage (&lt; 75%)</p>
          <h4 className="text-2xl font-bold text-red-600 mt-1">{shortageCount}</h4>
          <p className="text-[11px] text-red-600/80 mt-1">Requires condonation waiver</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-amber-600">
          <p className="text-xs text-gray-500 dark:text-gray-400">Sanctioned Condonations</p>
          <h4 className="text-2xl font-bold text-amber-600 mt-1">{condonedCount}</h4>
          <p className="text-[11px] text-amber-600/80 mt-1">Medical/statutory approved</p>
        </Card>
      </div>

      {/* Roster & Actions */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search candidate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-3 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">All Statuses</option>
              <option value="shortage">Show Shortages Only</option>
              <option value="eligible">Show Eligible Only</option>
              <option value="condoned">Show Condoned Only</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-gray-800 font-semibold text-gray-600 dark:text-gray-300 uppercase">
              <tr>
                <th className="py-3 px-4">Roll Number</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Attendance %</th>
                <th className="py-3 px-4">Deficit / Margin</th>
                <th className="py-3 px-4">Eligibility Status</th>
                <th className="py-3 px-4">Remarks / Note</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-gray-400">
                    Loading student eligibility records...
                  </td>
                </tr>
              ) : filteredRegistrations.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-gray-400">
                    No student registrations found for this examination.
                  </td>
                </tr>
              ) : (
                filteredRegistrations.map((reg) => {
                  const cutoff = currentExam?.attendanceCutoffPercentage || 75;
                  const diff = (reg.attendancePercentage || 0) - cutoff;
                  const isShortage = reg.eligibilityStatus === 'shortage';
                  return (
                    <tr key={reg._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-4 font-mono font-medium text-gray-900 dark:text-white">
                        {reg.student?.rollNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {reg.student?.user?.name || 'Student'}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold">
                        <span
                          className={
                            reg.attendancePercentage >= 75
                              ? 'text-emerald-600'
                              : reg.attendancePercentage >= 65
                              ? 'text-amber-600'
                              : 'text-red-600'
                          }
                        >
                          {reg.attendancePercentage}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {diff >= 0 ? (
                          <span className="text-emerald-600">+{diff}% (Safe)</span>
                        ) : (
                          <span className="text-red-600 font-semibold">{diff}% Short</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            reg.eligibilityStatus === 'eligible'
                              ? 'success'
                              : reg.eligibilityStatus === 'condoned'
                              ? 'primary'
                              : 'danger'
                          }
                        >
                          {reg.eligibilityStatus}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-500 max-w-xs truncate">
                        {reg.condonedRemarks || (isShortage ? 'Attendance below statutory 75%' : 'Qualified')}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isShortage ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openCondoneModal(reg)}
                            className="text-amber-600 hover:text-amber-700 border-amber-300 hover:bg-amber-50"
                          >
                            Sanction Condonation
                          </Button>
                        ) : reg.eligibilityStatus === 'condoned' ? (
                          <span className="text-emerald-600 text-[11px] font-medium flex items-center justify-end gap-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>Condoned</span>
                          </span>
                        ) : (
                          <span className="text-gray-400 text-[11px]">Qualified</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Condonation Modal */}
      <Modal
        isOpen={isCondoneModalOpen}
        onClose={() => setIsCondoneModalOpen(false)}
        title="Sanction Attendance Condonation"
      >
        <form onSubmit={handleSanctionCondone} className="space-y-4 text-sm">
          <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-lg text-xs text-amber-800 dark:text-amber-300">
            Candidate: <strong>{selectedReg?.student?.rollNumber}</strong> ({selectedReg?.student?.user?.name})
            <br />
            Attendance: <strong>{selectedReg?.attendancePercentage}%</strong> (Shortage Deficit: {75 - (selectedReg?.attendancePercentage || 0)}%)
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Statutory Waiver Remarks / Reason *
            </label>
            <textarea
              required
              rows={3}
              value={condoneRemarks}
              onChange={(e) => setCondoneRemarks(e.target.value)}
              placeholder="e.g. Approved medical leave sanctioned by Dean of Academic Affairs."
              className="w-full p-2.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsCondoneModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={isSubmittingCondone}>
              {isSubmittingCondone ? 'Sanctioning...' : 'Approve & Sanction'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StudentEligibilityPage;

