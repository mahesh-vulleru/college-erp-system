import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Download,
  RefreshCw,
  Users,
  Search,
  BookOpen
} from 'lucide-react';
import api from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Notification from '../../components/common/Notification';
import { ROLES } from '@college-erp/shared';

export const AttendancePage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const isStudent = user?.role === ROLES.STUDENT;
  const isFacultyOrAdmin = user && [ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY].includes(user.role);

  // Selector filters
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPeriod, setSelectedPeriod] = useState(1);

  // Student Attendance Roster
  const [roster, setRoster] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [savedSuccessMsg, setSavedSuccessMsg] = useState('');

  // Student perspective states
  const [mySummary, setMySummary] = useState(null);
  const [myRecords, setMyRecords] = useState([]);

  // Load subject choices & initial data
  useEffect(() => {
    async function loadMeta() {
      try {
        const [sRes, dRes] = await Promise.all([
          api.getSubjects(),
          api.getDepartments()
        ]);
        const subList = sRes.data || [];
        setSubjects(subList);
        setDepartments(dRes.data || []);
        if (subList.length > 0) {
          setSelectedSubject(subList[0]._id);
        }
      } catch (err) {
        setError(err.message || 'Failed to load curriculum subjects');
      }
    }
    loadMeta();
  }, []);

  // For Student view: load personal attendance
  const fetchStudentPersonalData = useCallback(async () => {
    if (!isStudent) return;
    setIsLoading(true);
    try {
      const [sumRes, recRes] = await Promise.all([
        api.getAttendanceSummary(),
        api.getAttendance()
      ]);
      setMySummary(sumRes.data || null);
      setMyRecords(recRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load attendance history');
    } finally {
      setIsLoading(false);
    }
  }, [isStudent]);

  useEffect(() => {
    if (isStudent) {
      fetchStudentPersonalData();
    }
  }, [isStudent, fetchStudentPersonalData]);

  // For Faculty / Admin view: load student roster and check existing session marks
  const fetchSessionRoster = useCallback(async () => {
    if (!isFacultyOrAdmin || !selectedSubject) return;
    setIsLoading(true);
    setError('');
    setSavedSuccessMsg('');
    try {
      // 1. Get Subject details to know semester/department
      const targetSub = subjects.find((s) => s._id === selectedSubject);
      const studentQuery = {};
      if (targetSub?.semester) studentQuery.semester = targetSub.semester;
      if (targetSub?.department) {
        studentQuery.department = targetSub.department?._id || targetSub.department?.id || (typeof targetSub.department === 'string' ? targetSub.department : null);
      }

      // 2. Fetch enrolled students
      const studentsRes = await api.getStudents(studentQuery);
      const studentList = studentsRes.data?.students || studentsRes.data || [];

      // 3. Fetch existing attendance for this date & subject
      const existingAttendanceRes = await api.getAttendance({
        subject: selectedSubject,
        date: selectedDate
      });
      const existingRecords = existingAttendanceRes.data || [];

      // 4. Map into roster
      const mergedRoster = studentList.map((st) => {
        const existing = existingRecords.find(
          (rec) =>
            (rec.student?._id === st._id || rec.student === st._id) &&
            rec.periodNumber === Number(selectedPeriod)
        );
        return {
          studentId: st._id,
          rollNumber: st.rollNumber,
          name: st.user?.name || st.name || `Student ${st.rollNumber}`,
          status: existing ? existing.status : 'present',
          remarks: existing?.remarks || ''
        };
      });

      setRoster(mergedRoster);
    } catch (err) {
      setError(err.message || 'Failed to fetch student session roster');
    } finally {
      setIsLoading(false);
    }
  }, [isFacultyOrAdmin, selectedSubject, selectedDate, selectedPeriod, subjects]);

  useEffect(() => {
    if (isFacultyOrAdmin && selectedSubject) {
      fetchSessionRoster();
    }
  }, [isFacultyOrAdmin, selectedSubject, fetchSessionRoster]);

  const handleStatusChange = (studentId, status) => {
    setRoster((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, status } : r))
    );
  };

  const handleRemarksChange = (studentId, remarks) => {
    setRoster((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, remarks } : r))
    );
  };

  const handleMarkAll = (status) => {
    setRoster((prev) => prev.map((r) => ({ ...r, status })));
  };

  const handleSaveAttendance = async () => {
    if (roster.length === 0) return;
    setIsSubmitting(true);
    setError('');
    setSavedSuccessMsg('');
    try {
      await api.markAttendanceBatch({
        subject: selectedSubject,
        date: selectedDate,
        periodNumber: Number(selectedPeriod),
        records: roster.map((r) => ({
          studentId: r.studentId,
          status: r.status,
          remarks: r.remarks
        }))
      });
      setSavedSuccessMsg('Attendance recorded and synced to student transcripts successfully.');
      addToast('Daily attendance saved successfully', 'success');
    } catch (err) {
      setError(err.message || 'Failed to record attendance batch');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    if (roster.length === 0) return;
    const subName = subjects.find((s) => s._id === selectedSubject)?.name || 'Subject';
    const headers = ['Roll Number', 'Student Name', 'Status', 'Date', 'Period', 'Subject'];
    const rows = roster.map((r) => [
      r.rollNumber,
      `"${r.name}"`,
      r.status,
      selectedDate,
      `Period ${selectedPeriod}`,
      `"${subName}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_${selectedDate}_Period${selectedPeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Stats calculation
  const totalStudents = roster.length;
  const presentCount = roster.filter((r) => r.status === 'present').length;
  const absentCount = roster.filter((r) => r.status === 'absent').length;
  const lateCount = roster.filter((r) => r.status === 'late').length;
  const attendanceRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-950 tracking-tight flex items-center gap-2.5">
            <CalendarCheck className="w-7 h-7 text-teal-600" />
            Daily Attendance Management
          </h1>
          <p className="text-sm text-navy-600">
            {isStudent
              ? 'Your semester class attendance records, percentages, and eligibility status.'
              : 'Record period-wise lecture attendance, log student statuses, and compute verified percentages.'}
          </p>
        </div>
        {isFacultyOrAdmin && (
          <div className="flex items-center gap-2.5">
            <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={roster.length === 0} className="flex items-center gap-1.5">
              <Download className="w-4 h-4" />
              Export Session
            </Button>
            <Button variant="outline" size="sm" onClick={fetchSessionRoster} disabled={isLoading} className="flex items-center gap-1.5">
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        )}
      </div>

      {error && <Notification type="error" message={error} onClose={() => setError('')} />}
      {savedSuccessMsg && <Notification type="success" message={savedSuccessMsg} onClose={() => setSavedSuccessMsg('')} />}

      {/* STUDENT PERSPECTIVE */}
      {isStudent && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <Card className="p-5 border-navy-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-navy-500 uppercase">Overall Attendance</span>
                <div className="text-3xl font-extrabold text-navy-950 mt-1">{mySummary?.percentage || 0}%</div>
                <span className="text-xs text-navy-500">Minimum 75% required for exam clearance</span>
              </div>
              <div className={`p-3 rounded-2xl ${Number(mySummary?.percentage || 0) >= 75 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                <CheckCircle2 className="w-8 h-8" />
              </div>
            </Card>
            <Card className="p-5 border-navy-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-navy-500 uppercase">Classes Attended</span>
                <div className="text-3xl font-extrabold text-teal-700 mt-1">
                  {mySummary?.presentClasses || 0} / {mySummary?.totalClasses || 0}
                </div>
                <span className="text-xs text-navy-500">Recorded sessions this academic term</span>
              </div>
              <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl">
                <CalendarCheck className="w-8 h-8" />
              </div>
            </Card>
            <Card className="p-5 border-navy-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-navy-500 uppercase">Eligibility Standing</span>
                <div className="text-lg font-bold text-navy-900 mt-1">
                  {mySummary?.statusAlert || 'Good Standing'}
                </div>
                <span className="text-xs text-navy-500">Exam Hall Ticket Status</span>
              </div>
              <Badge variant={Number(mySummary?.percentage || 0) >= 75 ? 'success' : 'danger'}>
                {Number(mySummary?.percentage || 0) >= 75 ? 'Eligible' : 'At Risk'}
              </Badge>
            </Card>
          </div>

          <Card className="p-5 border-navy-100">
            <h3 className="text-base font-bold text-navy-950 mb-3">Attendance History</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-navy-50 border-b text-navy-700 uppercase font-bold">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Subject</th>
                    <th className="py-2.5 px-3">Period</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-100">
                  {myRecords.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-navy-400">
                        No individual attendance records have been registered yet.
                      </td>
                    </tr>
                  ) : (
                    myRecords.map((rec) => (
                      <tr key={rec._id} className="hover:bg-navy-50/40">
                        <td className="py-2.5 px-3 font-medium text-navy-900">{new Date(rec.date).toLocaleDateString()}</td>
                        <td className="py-2.5 px-3 font-semibold text-navy-950">{rec.subject?.name || rec.subject?.code}</td>
                        <td className="py-2.5 px-3 text-navy-600">Period {rec.periodNumber}</td>
                        <td className="py-2.5 px-3">
                          <Badge variant={rec.status === 'present' ? 'success' : rec.status === 'late' ? 'warning' : 'danger'}>
                            {rec.status.toUpperCase()}
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
      )}

      {/* FACULTY & ADMIN ATTENDANCE SESSION RENDERER */}
      {isFacultyOrAdmin && (
        <div className="space-y-6">
          {/* Session Selector Card */}
          <Card className="p-4 border-navy-100 bg-white">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div>
                <label className="block text-[11px] font-bold text-navy-700 uppercase mb-1">Curriculum Subject *</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full text-xs border border-navy-200 rounded-lg p-2.5 bg-white text-navy-800 focus:ring-2 focus:ring-teal-500"
                >
                  {subjects.map((sub) => (
                    <option key={sub._id} value={sub._id}>
                      {sub.code} - {sub.name} (Sem {sub.semester})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-navy-700 uppercase mb-1">Session Date *</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full text-xs border border-navy-200 rounded-lg p-2.5 bg-white text-navy-800 focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-navy-700 uppercase mb-1">Period Slot *</label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(Number(e.target.value))}
                  className="w-full text-xs border border-navy-200 rounded-lg p-2.5 bg-white text-navy-800 focus:ring-2 focus:ring-teal-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
                    <option key={p} value={p}>
                      Period {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Quick Metrics & Batch Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="p-4 border-navy-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-navy-400 uppercase">Enrolled Students</span>
                <div className="text-2xl font-extrabold text-navy-950 mt-0.5">{totalStudents}</div>
              </div>
              <Users className="w-6 h-6 text-navy-300" />
            </Card>
            <Card className="p-4 border-navy-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase">Present</span>
                <div className="text-2xl font-extrabold text-emerald-700 mt-0.5">{presentCount}</div>
              </div>
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </Card>
            <Card className="p-4 border-navy-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-rose-500 uppercase">Absent</span>
                <div className="text-2xl font-extrabold text-rose-700 mt-0.5">{absentCount}</div>
              </div>
              <XCircle className="w-6 h-6 text-rose-400" />
            </Card>
            <Card className="p-4 border-navy-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-teal-700 uppercase">Attendance Rate</span>
                <div className="text-2xl font-extrabold text-teal-800 mt-0.5">{attendanceRate}%</div>
              </div>
              <div className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded">Rate</div>
            </Card>
          </div>

          {/* Student Roster Table */}
          <Card className="overflow-hidden border-navy-100">
            <div className="p-3 bg-navy-50/70 border-b border-navy-200 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-bold text-navy-800 uppercase tracking-wider">
                Session Student Roster ({roster.length} registered)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => handleMarkAll('present')}
                  className="text-emerald-700 border-emerald-200 bg-emerald-50/40"
                >
                  Mark All Present
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => handleMarkAll('absent')}
                  className="text-rose-700 border-rose-200 bg-rose-50/40"
                >
                  Mark All Absent
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="py-16 text-center">
                <RefreshCw className="w-7 h-7 text-teal-600 animate-spin mx-auto mb-2" />
                <p className="text-xs text-navy-500">Loading student roster...</p>
              </div>
            ) : roster.length === 0 ? (
              <div className="py-12 text-center text-navy-500 text-sm">
                No students enrolled in this department / semester. Verify student registrations.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-navy-50/40 border-b border-navy-200 text-navy-700 font-bold uppercase">
                      <th className="py-3 px-4">Roll Number</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4 text-center">Status Toggle</th>
                      <th className="py-3 px-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-100">
                    {roster.map((student) => (
                      <tr key={student.studentId} className="hover:bg-navy-50/30">
                        <td className="py-2.5 px-4 font-mono font-bold text-navy-900">{student.rollNumber}</td>
                        <td className="py-2.5 px-4 font-semibold text-navy-950">{student.name}</td>
                        <td className="py-2.5 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleStatusChange(student.studentId, 'present')}
                              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                                student.status === 'present'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-navy-100 text-navy-600 hover:bg-navy-200'
                              }`}
                            >
                              Present
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(student.studentId, 'absent')}
                              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                                student.status === 'absent'
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'bg-navy-100 text-navy-600 hover:bg-navy-200'
                              }`}
                            >
                              Absent
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(student.studentId, 'late')}
                              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                                student.status === 'late'
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : 'bg-navy-100 text-navy-600 hover:bg-navy-200'
                              }`}
                            >
                              Late
                            </button>
                          </div>
                        </td>
                        <td className="py-2.5 px-4">
                          <input
                            type="text"
                            placeholder="Optional note..."
                            value={student.remarks}
                            onChange={(e) => handleRemarksChange(student.studentId, e.target.value)}
                            className="w-full text-xs border border-navy-200 rounded px-2 py-1 text-navy-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {roster.length > 0 && (
              <div className="p-4 bg-navy-50/40 border-t border-navy-200 flex justify-end gap-3">
                <Button
                  variant="primary"
                  onClick={handleSaveAttendance}
                  disabled={isSubmitting}
                  className="bg-teal-600 hover:bg-teal-700 px-6 font-semibold"
                >
                  {isSubmitting ? 'Submitting Records...' : 'Save & Submit Attendance'}
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default AttendancePage;

