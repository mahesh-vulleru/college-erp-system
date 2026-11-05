import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  Download,
  RefreshCw,
  Award,
  TrendingUp,
  Users,
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';
import api from '../../api/apiClient';
import ExamNavHeader from './ExamNavHeader';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';

export const ExaminationReportsPage = () => {
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadExams = useCallback(async () => {
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
      setError(err.message || 'Error loading examination list.');
    }
  }, [selectedExamId]);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  const loadReport = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.getExamReportsSummary({
        examination: selectedExamId || undefined
      });
      if (res && res.data) {
        setReportData(res.data);
      }
    } catch (err) {
      console.error('Failed to load report summary:', err);
      setError(err.message || 'Error generating examination report.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedExamId]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleExportCSV = () => {
    if (!reportData) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'EXAMINATION PERFORMANCE REPORT\n\n';

    // Summary Section
    csvContent += 'SUMMARY METRICS\n';
    csvContent += `Total Evaluated Entries,${reportData.summary?.totalEvaluated || 0}\n`;
    csvContent += `Pass Rate (%),${reportData.summary?.overallPassRate || 0}%\n`;
    csvContent += `Average Score,${reportData.summary?.averageMarks || 0}/100\n`;
    csvContent += `Distinctions (Grade O/A+/A),${reportData.summary?.distinctionCount || 0}\n\n`;

    // Grade Distribution Section
    csvContent += 'GRADE DISTRIBUTION\n';
    csvContent += 'Grade,Count,Percentage\n';
    const total = reportData.summary?.totalEvaluated || 1;
    Object.entries(reportData.gradeDistribution || {}).forEach(([grade, count]) => {
      const pct = Math.round((count / total) * 100);
      csvContent += `${grade},${count},${pct}%\n`;
    });
    csvContent += '\n';

    // Subject Breakdown Section
    csvContent += 'SUBJECT-WISE PASS RATES\n';
    csvContent += 'Subject Code,Subject Name,Evaluated Count,Pass Count,Pass Rate (%)\n';
    (reportData.subjectPassRates || []).forEach((sub) => {
      csvContent += `"${sub.code}","${sub.name}",${sub.totalEvaluated},${sub.passedCount},${sub.passRate}%\n`;
    });
    csvContent += '\n';

    // Top Rankers Section
    csvContent += 'TOP RANKERS\n';
    csvContent += 'Roll Number,Candidate Name,Subjects Taken,Passed,Average Score\n';
    (reportData.topRankers || []).forEach((r) => {
      csvContent += `"${r.rollNumber}","${r.name}",${r.totalSubjects},${r.passedSubjects},${r.averageMarks}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Examination_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const summary = reportData?.summary || {
    totalEvaluated: 0,
    overallPassRate: 0,
    averageMarks: 0,
    distinctionCount: 0
  };

  return (
    <div className="space-y-6">
      <ExamNavHeader
        title="Examination Analytics & Statistical Reports"
        subtitle="Institutional performance KPIs, pass percentage distributions, subject comparative insights, and automated CSV export"
        actionButton={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleExportCSV}
              disabled={isLoading || !reportData}
            >
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              <span>Export CSV Report</span>
            </Button>
            <Button variant="outline" size="sm" onClick={loadReport} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        }
      />

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Select Examination Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Select Examination
            </label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full py-2 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">All Examinations Combined</option>
              {exams.map((ex) => (
                <option key={ex._id} value={ex._id}>
                  {ex.name} (Sem {ex.semester} • {ex.academicYear})
                </option>
              ))}
            </select>
          </div>
          <div className="text-xs text-gray-500">
            Analytics Engine: Deterministic MongoDB Aggregation
          </div>
        </div>
      </Card>

      {/* 4 Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-l-4 border-l-indigo-600">
          <p className="text-xs text-gray-500">Total Entries Evaluated</p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {isLoading ? '...' : summary.totalEvaluated}
          </h3>
          <p className="text-[11px] text-gray-400 mt-1">Evaluated papers</p>
        </Card>
        <Card className="p-5 border-l-4 border-l-emerald-600">
          <p className="text-xs text-gray-500">Overall Pass Rate</p>
          <h3 className="text-2xl font-bold text-emerald-600 mt-1">
            {isLoading ? '...' : `${summary.overallPassRate}%`}
          </h3>
          <p className="text-[11px] text-emerald-600/80 mt-1">Scored ≥ 40</p>
        </Card>
        <Card className="p-5 border-l-4 border-l-blue-600">
          <p className="text-xs text-gray-500">Average Composite Score</p>
          <h3 className="text-2xl font-bold text-blue-600 mt-1">
            {isLoading ? '...' : `${summary.averageMarks} / 100`}
          </h3>
          <p className="text-[11px] text-blue-600/80 mt-1">Class arithmetic mean</p>
        </Card>
        <Card className="p-5 border-l-4 border-l-purple-600">
          <p className="text-xs text-gray-500">Distinctions (Grade O/A+/A)</p>
          <h3 className="text-2xl font-bold text-purple-600 mt-1">
            {isLoading ? '...' : summary.distinctionCount}
          </h3>
          <p className="text-[11px] text-purple-600/80 mt-1">Scored ≥ 70</p>
        </Card>
      </div>

      {/* Grade Distribution & Subject Pass Rates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grade Distribution Table */}
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">
              Grade Distribution Frequency
            </h3>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {reportData?.gradeDistribution &&
                Object.entries(reportData.gradeDistribution).map(([grade, count]) => {
                  const total = summary.totalEvaluated || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={grade} className="text-xs space-y-1">
                      <div className="flex justify-between font-medium">
                        <span className="text-gray-700 dark:text-gray-300">Grade {grade}</span>
                        <span className="text-gray-500">{count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            grade === 'O' || grade === 'A+' || grade === 'A'
                              ? 'bg-emerald-500'
                              : grade === 'B+' || grade === 'B' || grade === 'C'
                              ? 'bg-blue-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </Card>

        {/* Subject Pass Rates */}
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">
              Subject-wise Pass Rates
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-800 font-semibold text-gray-600 dark:text-gray-300">
                <tr>
                  <th className="py-2.5 px-3">Subject</th>
                  <th className="py-2.5 px-3 text-center">Evaluated</th>
                  <th className="py-2.5 px-3 text-center">Passed</th>
                  <th className="py-2.5 px-3 text-right">Pass Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {reportData?.subjectPassRates && reportData.subjectPassRates.length > 0 ? (
                  reportData.subjectPassRates.map((sub, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-2 px-3 font-medium text-gray-900 dark:text-white">
                        {sub.code} - {sub.name}
                      </td>
                      <td className="py-2 px-3 text-center">{sub.totalEvaluated}</td>
                      <td className="py-2 px-3 text-center text-emerald-600 font-semibold">{sub.passedCount}</td>
                      <td className="py-2 px-3 text-right">
                        <span
                          className={`font-bold ${
                            sub.passRate >= 75
                              ? 'text-emerald-600'
                              : sub.passRate >= 50
                              ? 'text-amber-600'
                              : 'text-red-600'
                          }`}
                        >
                          {sub.passRate}%
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-6 text-center text-gray-400">
                      No subject evaluations available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Top Rankers Leaderboard */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span>Academic Distinction Leaderboard (Top Rankers)</span>
          </h3>
          <span className="text-xs text-gray-400">Ranked by Mean Score</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-gray-800 font-semibold text-gray-600 dark:text-gray-300 uppercase">
              <tr>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Roll Number</th>
                <th className="py-3 px-4">Candidate Name</th>
                <th className="py-3 px-4 text-center">Subjects Evaluated</th>
                <th className="py-3 px-4 text-center">Cleared</th>
                <th className="py-3 px-4 text-right">Average Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {reportData?.topRankers && reportData.topRankers.length > 0 ? (
                reportData.topRankers.map((r, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-4 font-bold">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                          idx === 0
                            ? 'bg-amber-100 text-amber-800 font-extrabold'
                            : idx === 1
                            ? 'bg-gray-200 text-gray-800 font-bold'
                            : idx === 2
                            ? 'bg-orange-100 text-orange-800 font-bold'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-gray-900 dark:text-white">
                      {r.rollNumber}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      {r.name || 'Student'}
                    </td>
                    <td className="py-3 px-4 text-center">{r.totalSubjects}</td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-medium">{r.passedSubjects}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {r.averageMarks} / 100
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-400">
                    No ranker records available. Process results to populate the leaderboard.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default ExaminationReportsPage;

