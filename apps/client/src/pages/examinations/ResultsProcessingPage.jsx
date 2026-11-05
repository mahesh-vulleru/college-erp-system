import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Cpu,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Award,
  ArrowRight,
  ShieldAlert,
  FileCheck2,
  BarChart2,
  PieChart
} from 'lucide-react';
import api from '../../api/apiClient';
import ExamNavHeader from './ExamNavHeader';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';

export const ResultsProcessingPage = () => {
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processSummary, setProcessSummary] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(true);

  const loadExams = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getExams();
      if (res && res.data) {
        setExams(res.data);
        if (res.data.length > 0 && !selectedExamId) {
          setSelectedExamId(res.data[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to load examinations:', err);
      setMessage({ type: 'error', text: err.message || 'Error loading examination list.' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedExamId]);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  const handleProcessResults = async () => {
    if (!selectedExamId) return;

    setIsProcessing(true);
    setMessage({ type: '', text: '' });
    setProcessSummary(null);

    try {
      const res = await api.processExamResults(selectedExamId);
      if (res && res.data) {
        setProcessSummary(res.data);
        setMessage({
          type: 'success',
          text: `Results processed successfully! Evaluated ${res.data.totalEntries} marks records across ${res.data.totalStudents} candidate(s).`
        });
      }
    } catch (err) {
      console.error('Processing error:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to process examination results.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const currentExam = exams.find((e) => e._id === selectedExamId);

  return (
    <div className="space-y-6">
      <ExamNavHeader
        title="Results Processing & GPA Compilation Engine"
        subtitle="Batch compute total scores, apply standard grading scales, evaluate pass percentages, and audit pre-publication readiness"
        actionButton={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleProcessResults}
              disabled={isProcessing || !selectedExamId}
            >
              <Cpu className={`w-4 h-4 mr-1.5 ${isProcessing ? 'animate-spin' : ''}`} />
              <span>{isProcessing ? 'Compiling Scores...' : 'Run Results Processing'}</span>
            </Button>
            <Button variant="outline" size="sm" onClick={loadExams} disabled={isLoading}>
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

      {/* Select Examination */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Select Examination for Processing
            </label>
            <select
              value={selectedExamId}
              onChange={(e) => {
                setSelectedExamId(e.target.value);
                setProcessSummary(null);
                setMessage({ type: '', text: '' });
              }}
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
            <div className="flex items-center gap-2">
              <Badge variant={currentExam.isResultsPublished ? 'success' : 'warning'}>
                {currentExam.isResultsPublished ? 'Results Published' : 'Unpublished Draft'}
              </Badge>
              <span className="text-xs text-gray-500">
                Academic Year: {currentExam.academicYear}
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Processing Engine Output */}
      {processSummary && (
        <div className="space-y-6">
          {/* Readiness Banner */}
          <Card
            className={`p-5 border-l-4 ${
              processSummary.isReadyForPublication
                ? 'border-l-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20'
                : 'border-l-amber-600 bg-amber-50/50 dark:bg-amber-950/20'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                {processSummary.isReadyForPublication ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <ShieldAlert className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">
                    {processSummary.isReadyForPublication
                      ? 'Pre-Publication Quality Audit Passed!'
                      : 'Audit Review Incomplete: Blockers Detected'}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                    {processSummary.isReadyForPublication
                      ? 'All marks entries are fully verified with zero unresolved flags. You can proceed to Results Management to publish results.'
                      : `You have ${processSummary.pendingCount} pending verification(s) and ${processSummary.flaggedCount} flagged discrepancy(ies). Resolve before publication.`}
                  </p>
                </div>
              </div>
              <div>
                <Link to="/examinations/results">
                  <Button variant="primary" size="sm" className="whitespace-nowrap">
                    <span>Go to Results Management</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 border-l-4 border-l-indigo-600">
              <p className="text-xs text-gray-500">Total Records Evaluated</p>
              <h4 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {processSummary.totalEntries}
              </h4>
              <p className="text-[11px] text-gray-400 mt-1">
                {processSummary.totalStudents} candidate(s) • {processSummary.totalSubjects} subject(s)
              </p>
            </Card>

            <Card className="p-4 border-l-4 border-l-emerald-600">
              <p className="text-xs text-gray-500">Passing Candidates</p>
              <h4 className="text-2xl font-bold text-emerald-600 mt-1">
                {processSummary.passCount} ({processSummary.passPercentage}%)
              </h4>
              <p className="text-[11px] text-emerald-600/80 mt-1">Cleared all components</p>
            </Card>

            <Card className="p-4 border-l-4 border-l-red-600">
              <p className="text-xs text-gray-500">Failing / Backlogs</p>
              <h4 className="text-2xl font-bold text-red-600 mt-1">
                {processSummary.failCount}
              </h4>
              <p className="text-[11px] text-red-600/80 mt-1">Subject arrears</p>
            </Card>

            <Card className="p-4 border-l-4 border-l-purple-600">
              <p className="text-xs text-gray-500">Verified by Audit</p>
              <h4 className="text-2xl font-bold text-purple-600 mt-1">
                {processSummary.verifiedCount} / {processSummary.totalEntries}
              </h4>
              <p className="text-[11px] text-purple-600/80 mt-1">Signed off entries</p>
            </Card>
          </div>

          {/* Verification Audit Breakdown */}
          <Card className="p-5">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-3">
              Pre-Publication Audit Checklist
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    1. Faculty Marks Submission Completeness:
                  </span>
                  <span className="text-gray-500">
                    {processSummary.totalEntries > 0 ? 'Submitted' : 'Pending'}
                  </span>
                </div>
                <Badge variant={processSummary.totalEntries > 0 ? 'success' : 'danger'}>
                  {processSummary.totalEntries > 0 ? 'COMPLETE' : 'MISSING'}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    2. Verification Sign-Off Progress:
                  </span>
                  <span className="text-gray-500">
                    {processSummary.verifiedCount} / {processSummary.totalEntries} verified ({processSummary.pendingCount} pending)
                  </span>
                </div>
                <Badge variant={processSummary.pendingCount === 0 ? 'success' : 'warning'}>
                  {processSummary.pendingCount === 0 ? 'ALL VERIFIED' : 'PENDING REVIEW'}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    3. Quality Discrepancy Flags:
                  </span>
                  <span className="text-gray-500">
                    {processSummary.flaggedCount} active discrepancy flags
                  </span>
                </div>
                <Badge variant={processSummary.flaggedCount === 0 ? 'success' : 'danger'}>
                  {processSummary.flaggedCount === 0 ? 'ZERO FLAGS' : `${processSummary.flaggedCount} FLAGGED`}
                </Badge>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ResultsProcessingPage;

