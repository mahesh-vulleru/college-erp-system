import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Flag,
  Check,
  RefreshCw,
  Search,
  Filter,
  ShieldCheck,
  Clock,
  UserCheck
} from 'lucide-react';
import api from '../../api/apiClient';
import ExamNavHeader from './ExamNavHeader';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

export const MarksVerificationPage = () => {
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifyingBatch, setIsVerifyingBatch] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchQuery, setSearchQuery] = useState('');

  // Flag Modal
  const [isFlagModalOpen, setIsFlagModalOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [flagNotes, setFlagNotes] = useState('');
  const [isSubmittingFlag, setIsSubmittingFlag] = useState(false);

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

  const loadResults = useCallback(async () => {
    if (!selectedExamId) return;

    setIsLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const params = {
        examination: selectedExamId
      };
      if (selectedSubjectId) params.subject = selectedSubjectId;
      if (statusFilter !== 'all') params.verificationStatus = statusFilter;

      const res = await api.getResults(params);
      if (res && res.data) {
        setResults(res.data);
      }
    } catch (err) {
      console.error('Failed to load results:', err);
      setMessage({ type: 'error', text: err.message || 'Error fetching marks.' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedExamId, selectedSubjectId, statusFilter]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  const handleVerifySingle = async (resultId) => {
    try {
      await api.verifyResult(resultId, {
        verificationStatus: 'verified'
      });
      setMessage({ type: 'success', text: 'Result verified and signed off successfully.' });
      loadResults();
    } catch (err) {
      console.error('Verification error:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to verify entry.' });
    }
  };

  const openFlagModal = (res) => {
    setSelectedResult(res);
    setFlagNotes('Re-totaling discrepancy detected during examination audit.');
    setIsFlagModalOpen(true);
  };

  const handleSubmitFlag = async (e) => {
    e.preventDefault();
    if (!selectedResult) return;

    setIsSubmittingFlag(true);
    try {
      await api.verifyResult(selectedResult._id, {
        verificationStatus: 'flagged',
        discrepancyNotes: flagNotes
      });
      setIsFlagModalOpen(false);
      setMessage({ type: 'success', text: 'Entry flagged with discrepancy notes.' });
      loadResults();
    } catch (err) {
      console.error('Flagging error:', err);
      alert(err.message || 'Failed to flag discrepancy');
    } finally {
      setIsSubmittingFlag(false);
    }
  };

  const handleBatchVerifyAll = async () => {
    if (!selectedExamId || results.length === 0) return;

    setIsVerifyingBatch(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await api.batchVerifyResults({
        examination: selectedExamId,
        subject: selectedSubjectId || undefined,
        verificationStatus: 'verified'
      });

      if (res && res.data) {
        setMessage({
          type: 'success',
          text: `Batch verification completed! Verified ${res.data.modifiedCount} records.`
        });
        loadResults();
      }
    } catch (err) {
      console.error('Batch verification error:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to batch verify records.' });
    } finally {
      setIsVerifyingBatch(false);
    }
  };

  const totalEntries = results.length;
  const verifiedCount = results.filter((r) => r.verificationStatus === 'verified').length;
  const flaggedCount = results.filter((r) => r.verificationStatus === 'flagged').length;
  const pendingCount = results.filter((r) => r.verificationStatus === 'pending_verification').length;

  const filteredResults = results.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const roll = r.student?.rollNumber?.toLowerCase() || '';
    const name = r.student?.user?.name?.toLowerCase() || '';
    const sub = r.subject?.name?.toLowerCase() || r.subject?.code?.toLowerCase() || '';
    return roll.includes(q) || name.includes(q) || sub.includes(q);
  });

  return (
    <div className="space-y-6">
      <ExamNavHeader
        title="Marks Verification & Quality Audit Desk"
        subtitle="Independent verification of entered marks sheets, discrepancy flagging, and audit sign-off before results processing"
        actionButton={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleBatchVerifyAll}
              disabled={isVerifyingBatch || pendingCount === 0}
            >
              <CheckCircle2 className={`w-4 h-4 mr-1.5 ${isVerifyingBatch ? 'animate-spin' : ''}`} />
              <span>{isVerifyingBatch ? 'Verifying...' : 'Batch Verify All Pending'}</span>
            </Button>
            <Button variant="outline" size="sm" onClick={loadResults} disabled={isLoading}>
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
              Filter by Subject (Optional)
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full py-2 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">All Subjects</option>
              {subjects.map((sub) => (
                <option key={sub._id} value={sub._id}>
                  {sub.code} - {sub.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Verification Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-indigo-600">
          <p className="text-xs text-gray-500">Total Entries</p>
          <h4 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalEntries}</h4>
          <p className="text-[11px] text-gray-400 mt-1">Under evaluation</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-emerald-600">
          <p className="text-xs text-gray-500">Verified & Approved</p>
          <h4 className="text-2xl font-bold text-emerald-600 mt-1">{verifiedCount}</h4>
          <p className="text-[11px] text-emerald-600/80 mt-1">Audit complete</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-amber-600">
          <p className="text-xs text-gray-500">Pending Verification</p>
          <h4 className="text-2xl font-bold text-amber-600 mt-1">{pendingCount}</h4>
          <p className="text-[11px] text-amber-600/80 mt-1">Awaiting review</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-red-600">
          <p className="text-xs text-gray-500">Flagged Discrepancies</p>
          <h4 className="text-2xl font-bold text-red-600 mt-1">{flaggedCount}</h4>
          <p className="text-[11px] text-red-600/80 mt-1">Requires correction</p>
        </Card>
      </div>

      {/* Results Verification Desk Table */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search candidate or subject..."
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
              <option value="all">All Verification Statuses</option>
              <option value="pending_verification">Pending Review Only</option>
              <option value="verified">Verified Only</option>
              <option value="flagged">Flagged Only</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-gray-800 font-semibold text-gray-600 dark:text-gray-300 uppercase">
              <tr>
                <th className="py-3 px-4">Roll Number</th>
                <th className="py-3 px-4">Candidate</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Internal</th>
                <th className="py-3 px-4">External</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Grade</th>
                <th className="py-3 px-4">Audit Status</th>
                <th className="py-3 px-4">Verified By</th>
                <th className="py-3 px-4 text-right">Verification Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan="10" className="py-8 text-center text-gray-400">
                    Loading results for audit...
                  </td>
                </tr>
              ) : filteredResults.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-8 text-center text-gray-400">
                    No examination results match your criteria.
                  </td>
                </tr>
              ) : (
                filteredResults.map((r) => (
                  <tr key={r._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-4 font-mono font-medium text-gray-900 dark:text-white">
                      {r.student?.rollNumber}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      {r.student?.user?.name || 'Student'}
                    </td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                      {r.subject?.code} - {r.subject?.name}
                    </td>
                    <td className="py-3 px-4 font-mono text-center">{r.internalMarks}</td>
                    <td className="py-3 px-4 font-mono text-center">{r.externalMarks}</td>
                    <td className="py-3 px-4 font-mono font-bold text-center text-indigo-600 dark:text-indigo-400">
                      {r.totalMarks}
                    </td>
                    <td className="py-3 px-4 font-bold text-center">{r.grade}</td>
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
                      {r.discrepancyNotes && (
                        <div className="text-[10px] text-red-600 mt-1 max-w-xs truncate">
                          Note: {r.discrepancyNotes}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[11px] text-gray-400">
                      {r.verifiedBy?.name ? (
                        <div>
                          <div className="font-medium text-gray-700 dark:text-gray-300">{r.verifiedBy.name}</div>
                          <div className="text-[10px]">{r.verifiedAt ? new Date(r.verifiedAt).toLocaleDateString() : ''}</div>
                        </div>
                      ) : (
                        'Pending'
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {r.verificationStatus !== 'verified' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVerifySingle(r._id)}
                            className="text-emerald-600 hover:text-emerald-700 border-emerald-300 hover:bg-emerald-50 text-[11px] py-1 px-2"
                          >
                            <Check className="w-3.5 h-3.5 mr-1" />
                            <span>Verify</span>
                          </Button>
                        )}
                        {r.verificationStatus !== 'flagged' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openFlagModal(r)}
                            className="text-red-600 hover:text-red-700 border-red-300 hover:bg-red-50 text-[11px] py-1 px-2"
                          >
                            <Flag className="w-3.5 h-3.5 mr-1" />
                            <span>Flag</span>
                          </Button>
                        )}
                        {r.verificationStatus === 'verified' && (
                          <span className="text-emerald-600 text-xs font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Signed Off</span>
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Flag Discrepancy Modal */}
      <Modal
        isOpen={isFlagModalOpen}
        onClose={() => setIsFlagModalOpen(false)}
        title="Flag Evaluation Discrepancy"
      >
        <form onSubmit={handleSubmitFlag} className="space-y-4 text-sm">
          <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-lg text-xs text-red-800 dark:text-red-300">
            Candidate: <strong>{selectedResult?.student?.rollNumber}</strong> ({selectedResult?.student?.user?.name})
            <br />
            Subject: <strong>{selectedResult?.subject?.code} - {selectedResult?.subject?.name}</strong>
            <br />
            Marks Recorded: <strong>{selectedResult?.internalMarks}</strong> (Internal) +{' '}
            <strong>{selectedResult?.externalMarks}</strong> (External) = <strong>{selectedResult?.totalMarks}</strong>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Discrepancy Notes / Audit Observation *
            </label>
            <textarea
              required
              rows={3}
              value={flagNotes}
              onChange={(e) => setFlagNotes(e.target.value)}
              placeholder="Detail reasons for audit rejection (e.g. Total calculation error on answer sheet page 4)..."
              className="w-full p-2.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsFlagModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" type="submit" disabled={isSubmittingFlag}>
              {isSubmittingFlag ? 'Flagging...' : 'Record Discrepancy'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MarksVerificationPage;

