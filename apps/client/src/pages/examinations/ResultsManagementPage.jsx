import React, { useState, useEffect, useCallback } from 'react';
import {
  Award,
  Globe,
  Lock,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Download,
  Eye,
  FileText
} from 'lucide-react';
import api from '../../api/apiClient';
import ExamNavHeader from './ExamNavHeader';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

export const ResultsManagementPage = () => {
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');

  // Confirmation Modals
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isUnpublishModalOpen, setIsUnpublishModalOpen] = useState(false);

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
          const resultsRes = await api.getResults({ examination: currentId });
          if (resultsRes && resultsRes.data) {
            setResults(resultsRes.data);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load results management data:', err);
      setMessage({ type: 'error', text: err.message || 'Error loading examination results.' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedExamId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExamChange = (examId) => {
    setSelectedExamId(examId);
    setMessage({ type: '', text: '' });
  };

  const handlePublish = async () => {
    if (!selectedExamId) return;

    setIsPublishing(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await api.publishExamResults(selectedExamId);
      setIsPublishModalOpen(false);
      setMessage({
        type: 'success',
        text: `Results published successfully! Published ${res.data?.publishedCount || results.length} records to the student portal.`
      });
      loadData();
    } catch (err) {
      console.error('Publish error:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to publish results' });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    if (!selectedExamId) return;

    setIsPublishing(true);
    setMessage({ type: '', text: '' });
    try {
      await api.unpublishExamResults(selectedExamId);
      setIsUnpublishModalOpen(false);
      setMessage({
        type: 'success',
        text: 'Results revoked from student portal. Status set to Unpublished Draft.'
      });
      loadData();
    } catch (err) {
      console.error('Unpublish error:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to unpublish results' });
    } finally {
      setIsPublishing(false);
    }
  };

  const currentExam = exams.find((e) => e._id === selectedExamId);
  const isPublished = Boolean(currentExam?.isPublished || currentExam?.isResultsPublished);

  const filteredResults = results.filter((r) => {
    if (gradeFilter !== 'all' && r.grade !== gradeFilter) return false;
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
        title="Official Examination Results & Grade Cards Ledger"
        subtitle="Finalize semester results, control release to student and parent portals, and review comprehensive grade sheets"
        actionButton={
          <div className="flex items-center gap-2">
            {!isPublished ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsPublishModalOpen(true)}
                disabled={results.length === 0}
              >
                <Globe className="w-4 h-4 mr-1.5" />
                <span>Publish to Student Portal</span>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsUnpublishModalOpen(true)}
                className="text-amber-600 border-amber-300 hover:bg-amber-50"
              >
                <Lock className="w-4 h-4 mr-1.5" />
                <span>Revoke Publication</span>
              </Button>
            )}
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

      {/* Select Exam Bar */}
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
            <div className="flex items-center gap-3">
              <Badge variant={isPublished ? 'success' : 'warning'}>
                {isPublished ? 'PUBLISHED ON PORTAL' : 'UNPUBLISHED DRAFT'}
              </Badge>
              {currentExam.resultsPublishedAt && (
                <span className="text-xs text-gray-500">
                  Published on: {new Date(currentExam.resultsPublishedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Results Ledger Table */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search candidate, subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="py-1.5 px-3 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">All Grades</option>
              <option value="O">Grade O (Outstanding ≥90)</option>
              <option value="A+">Grade A+ (Excellent ≥80)</option>
              <option value="A">Grade A (Very Good ≥70)</option>
              <option value="B+">Grade B+ (Good ≥60)</option>
              <option value="B">Grade B (Above Average ≥50)</option>
              <option value="C">Grade C (Pass ≥40)</option>
              <option value="F">Grade F (Fail &lt;40)</option>
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
                <th className="py-3 px-4 text-center">Internal (40)</th>
                <th className="py-3 px-4 text-center">External (60)</th>
                <th className="py-3 px-4 text-center">Total (100)</th>
                <th className="py-3 px-4 text-center">Grade</th>
                <th className="py-3 px-4">Result</th>
                <th className="py-3 px-4">Portal Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-gray-400">
                    Loading results ledger...
                  </td>
                </tr>
              ) : filteredResults.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-gray-400">
                    No results recorded yet for this examination.
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
                    <td className="py-3 px-4 font-bold text-center">
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
                      <span
                        className={`inline-flex items-center gap-1 font-medium text-[11px] ${
                          r.isPublished ? 'text-emerald-600' : 'text-gray-400'
                        }`}
                      >
                        {r.isPublished ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                        <span>{r.isPublished ? 'Published' : 'Hidden'}</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Confirmation Modal - Publish */}
      <Modal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        title="Publish Examination Results"
      >
        <div className="space-y-4 text-sm">
          <p className="text-gray-600 dark:text-gray-300">
            Are you sure you want to formally publish results for{' '}
            <strong>{currentExam?.name}</strong>?
          </p>
          <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-lg text-xs text-amber-800 dark:text-amber-300 space-y-1">
            <p className="font-bold">What this does:</p>
            <p>• Makes all verified marks visible immediately on the Student Portal.</p>
            <p>• Updates parent portal academic notifications.</p>
            <p>• Sets publication timestamp and your Controller digital sign-off.</p>
          </div>
          <div className="pt-3 flex justify-end gap-2 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" size="sm" onClick={() => setIsPublishModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handlePublish} disabled={isPublishing}>
              {isPublishing ? 'Publishing...' : 'Confirm & Publish Results'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal - Unpublish */}
      <Modal
        isOpen={isUnpublishModalOpen}
        onClose={() => setIsUnpublishModalOpen(false)}
        title="Revoke / Unpublish Examination Results"
      >
        <div className="space-y-4 text-sm">
          <p className="text-gray-600 dark:text-gray-300">
            Are you sure you want to revoke results for{' '}
            <strong>{currentExam?.name}</strong>?
          </p>
          <p className="text-xs text-gray-500">
            Students will no longer be able to query these results until published again.
          </p>
          <div className="pt-3 flex justify-end gap-2 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" size="sm" onClick={() => setIsUnpublishModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleUnpublish} disabled={isPublishing}>
              {isPublishing ? 'Revoking...' : 'Confirm Revocation'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ResultsManagementPage;

