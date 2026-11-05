import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Calendar,
  Clock,
  UserCheck,
  ShieldCheck,
  Ticket,
  ClipboardList,
  Edit3,
  CheckCircle2,
  Cpu,
  Award,
  BarChart3,
  RefreshCw,
  AlertTriangle,
  ArrowUpRight,
  MapPin,
  CheckCircle,
  FileCheck
} from 'lucide-react';
import api from '../../api/apiClient';
import ExamNavHeader from './ExamNavHeader';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';

export const ExaminationControllerDashboard = () => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.getExamControllerStats();
      if (res && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to load examination controller statistics:', err);
      setError(err.message || 'Unable to load examination controller statistics.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const cards = stats?.kpis || {
    totalExams: 0,
    activeSchedules: 0,
    totalRegistrations: 0,
    hallTicketsIssued: 0,
    resultsPublished: 0,
    condonedCount: 0,
    shortageCount: 0,
    verificationProgress: { total: 0, verified: 0, pending: 0, flagged: 0, percentage: 0 }
  };

  return (
    <div className="space-y-6">
      <ExamNavHeader
        title="Examination Controller Operations Center"
        subtitle="End-to-end administration: scheduling, student eligibility, hall ticket dispatch, marks verification & results"
        actionButton={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Telemetry</span>
          </Button>
        }
      />

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 7 KPI Executive Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Examinations */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Examinations</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {isLoading ? '...' : cards.totalExams}
              </h3>
              <p className="text-xs text-gray-400 mt-1">Conducted / Scheduled</p>
            </div>
            <div className="w-11 h-11 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
          </div>
        </Card>

        {/* KPI 2: Active Timetable Slots */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Timetable Slots</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {isLoading ? '...' : cards.activeSchedules}
              </h3>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Configured subject slots</p>
            </div>
            <div className="w-11 h-11 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </Card>

        {/* KPI 3: Registrations & Eligibility */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Exam Registrations</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {isLoading ? '...' : cards.totalRegistrations}
              </h3>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                {cards.shortageCount} attendance shortage(s)
              </p>
            </div>
            <div className="w-11 h-11 bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center">
              <UserCheck className="w-6 h-6" />
            </div>
          </div>
        </Card>

        {/* KPI 4: Hall Tickets Dispatched */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Hall Tickets Issued</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {isLoading ? '...' : cards.hallTicketsIssued}
              </h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Seat numbers assigned</p>
            </div>
            <div className="w-11 h-11 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
              <Ticket className="w-6 h-6" />
            </div>
          </div>
        </Card>

        {/* KPI 5: Marks Verification Progress */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Marks Verified</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {isLoading ? '...' : `${cards.verificationProgress?.percentage || 0}%`}
              </h3>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                {cards.verificationProgress?.verified || 0} / {cards.verificationProgress?.total || 0} verified
              </p>
            </div>
            <div className="w-11 h-11 bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </Card>

        {/* KPI 6: Results Published */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Published Results</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {isLoading ? '...' : cards.resultsPublished}
              </h3>
              <p className="text-xs text-teal-600 dark:text-teal-400 mt-1">Released to student portal</p>
            </div>
            <div className="w-11 h-11 bg-teal-50 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
          </div>
        </Card>

        {/* KPI 7: Shortage Condonations */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Condonations Sanctioned</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {isLoading ? '...' : cards.condonedCount}
              </h3>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Medical/statutory waivers</p>
            </div>
            <div className="w-11 h-11 bg-orange-50 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Operational Module Launchpad */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
          Examination Operational Modules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to="/examinations/calendar"
            className="group block p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-500 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg group-hover:scale-110 transition-transform">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600">
                    Examination Calendar
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Semester-wise schedule dates and timelines
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600" />
            </div>
          </Link>

          <Link
            to="/examinations/scheduling"
            className="group block p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg group-hover:scale-110 transition-transform">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600">
                    Examination Scheduling
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Slot allocator with real-time clash detection
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
            </div>
          </Link>

          <Link
            to="/examinations/registrations"
            className="group block p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-amber-500 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-lg group-hover:scale-110 transition-transform">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-amber-600">
                    Student Registrations
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Enrollment roster and fee clearance verification
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-amber-600" />
            </div>
          </Link>

          <Link
            to="/examinations/eligibility"
            className="group block p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-red-500 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-red-600">
                    Student Eligibility
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    75% attendance cutoff check & condonation desk
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
            </div>
          </Link>

          <Link
            to="/examinations/hall-tickets"
            className="group block p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-emerald-500 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-lg group-hover:scale-110 transition-transform">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-emerald-600">
                    Hall Ticket Management
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Seat assignment, batch generator & print view
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600" />
            </div>
          </Link>

          <Link
            to="/examinations/attendance"
            className="group block p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-500 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg group-hover:scale-110 transition-transform">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600">
                    Exam Attendance
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Exam hall attendance & malpractice tracking
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600" />
            </div>
          </Link>

          <Link
            to="/examinations/marks-entry"
            className="group block p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-500 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-lg group-hover:scale-110 transition-transform">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600">
                    Marks Entry Sheet
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Faculty internal & external marks capture
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600" />
            </div>
          </Link>

          <Link
            to="/examinations/marks-verification"
            className="group block p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-cyan-500 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-cyan-50 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400 rounded-lg group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-cyan-600">
                    Marks Verification Desk
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Controller audit, discrepancy notes & sign-off
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-cyan-600" />
            </div>
          </Link>

          <Link
            to="/examinations/results-processing"
            className="group block p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-yellow-500 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-yellow-50 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400 rounded-lg group-hover:scale-110 transition-transform">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-yellow-600">
                    Results Processing
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    GPA compilation, completeness checks & auditing
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-yellow-600" />
            </div>
          </Link>

          <Link
            to="/examinations/results"
            className="group block p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-teal-500 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-teal-50 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 rounded-lg group-hover:scale-110 transition-transform">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-teal-600">
                    Results Management
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Formal result publication & grade cards ledger
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-teal-600" />
            </div>
          </Link>

          <Link
            to="/examinations/reports"
            className="group block p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-rose-500 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-50 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-lg group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-rose-600">
                    Examination Reports
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Pass % analytics, grade distributions & CSV export
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-rose-600" />
            </div>
          </Link>
        </div>
      </div>

      {/* Upcoming Exam Timetable Schedules */}
      <Card className="overflow-hidden">
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">Upcoming Timetable Schedules</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Live scheduled slots across examination centers
            </p>
          </div>
          <Link to="/examinations/scheduling">
            <Button variant="outline" size="sm">Manage Slots</Button>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Examination</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Date & Timings</th>
                <th className="py-3 px-4">Venue / Hall</th>
                <th className="py-3 px-4">Invigilator</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {stats?.upcomingSchedules && stats.upcomingSchedules.length > 0 ? (
                stats.upcomingSchedules.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900 dark:text-white">{item.examName}</div>
                      <div className="text-xs text-gray-400">Sem {item.semester} • {item.examType}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-indigo-600 dark:text-indigo-400">
                      {item.subjectCode || 'GEN'} - {item.subjectName || 'Subject'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-gray-900 dark:text-white font-medium">
                        {item.date ? new Date(item.date).toLocaleDateString() : 'TBD'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.startTime} - {item.endTime}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span>{item.venue} {item.roomNumber ? `(${item.roomNumber})` : ''}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-600 dark:text-gray-300">
                      {item.invigilator || 'Unassigned'}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={item.status === 'scheduled' ? 'primary' : 'warning'}>
                        {item.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-400 text-sm">
                    No upcoming examination schedules configured yet. Click "Manage Slots" to configure examination schedules.
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

export default ExaminationControllerDashboard;
