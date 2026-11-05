import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  MapPin,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Save,
  RefreshCw,
  Search,
  Calendar,
  ShieldAlert,
  Users
} from 'lucide-react';
import api from '../../api/apiClient';
import ExamNavHeader from './ExamNavHeader';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';

export const ExaminationSchedulingPage = () => {
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [slots, setSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingClash, setIsCheckingClash] = useState(false);
  const [clashResult, setClashResult] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  // New slot draft
  const [newSlot, setNewSlot] = useState({
    subject: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:30 AM',
    endTime: '12:30 PM',
    venue: 'Main Examination Complex',
    roomNumber: 'Hall 101',
    maxCapacity: 60,
    invigilator: 'Assigned Faculty'
  });

  const loadData = useCallback(async () => {
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
          setSlots(examsRes.data[0].schedules || []);
        }
      }
      if (subjectsRes && subjectsRes.data) {
        setSubjects(subjectsRes.data);
      }
    } catch (err) {
      console.error('Failed to load scheduling data:', err);
      setMessage({ type: 'error', text: err.message || 'Error loading examination data' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedExamId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // When selected exam changes, update slots
  const handleExamChange = (examId) => {
    setSelectedExamId(examId);
    setClashResult(null);
    setMessage({ type: '', text: '' });
    const found = exams.find((e) => e._id === examId);
    if (found) {
      setSlots(found.schedules || []);
    } else {
      setSlots([]);
    }
  };

  const handleAddSlot = () => {
    if (!newSlot.subject) {
      setMessage({ type: 'error', text: 'Please select a subject for the examination slot.' });
      return;
    }
    if (!newSlot.date) {
      setMessage({ type: 'error', text: 'Please select an examination date.' });
      return;
    }

    const subObj = subjects.find((s) => s._id === newSlot.subject) || {
      _id: newSlot.subject,
      name: 'Subject Slot',
      code: 'SUB'
    };

    setSlots((prev) => [
      ...prev,
      {
        ...newSlot,
        subject: subObj
      }
    ]);

    setMessage({ type: 'success', text: 'Slot added to draft. Click "Save Schedule" to persist.' });
    setClashResult(null);
  };

  const handleRemoveSlot = (index) => {
    setSlots((prev) => prev.filter((_, i) => i !== index));
    setClashResult(null);
  };

  const handleCheckClashes = async () => {
    if (!selectedExamId || slots.length === 0) {
      setMessage({ type: 'error', text: 'No slots to check for clashes.' });
      return;
    }

    setIsCheckingClash(true);
    setClashResult(null);
    setMessage({ type: '', text: '' });

    try {
      const selectedExam = exams.find((e) => e._id === selectedExamId);
      const payloadSlots = slots.map((s) => ({
        subject: s.subject?._id || s.subject,
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        venue: s.venue,
        roomNumber: s.roomNumber,
        invigilator: s.invigilator
      }));

      const res = await api.checkExamClashes({
        examinationId: selectedExamId,
        semester: selectedExam?.semester,
        department: selectedExam?.department?._id || selectedExam?.department,
        slots: payloadSlots
      });

      if (res && res.data) {
        setClashResult(res.data);
        if (res.data.hasClashes) {
          setMessage({
            type: 'error',
            text: `Detected ${res.data.totalClashes} clash(es). Review details below before saving.`
          });
        } else {
          setMessage({
            type: 'success',
            text: 'Timetable check passed! Zero venue, cohort, or invigilator clashes detected.'
          });
        }
      }
    } catch (err) {
      console.error('Clash verification error:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to perform clash verification' });
    } finally {
      setIsCheckingClash(false);
    }
  };

  const handleSaveSchedule = async () => {
    if (!selectedExamId) return;

    setIsSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const payloadSlots = slots.map((s) => ({
        subject: s.subject?._id || s.subject,
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        venue: s.venue,
        roomNumber: s.roomNumber,
        maxCapacity: Number(s.maxCapacity) || 60,
        invigilator: s.invigilator || 'Assigned Faculty'
      }));

      await api.updateExamSchedules(selectedExamId, payloadSlots);
      setMessage({
        type: 'success',
        text: 'Examination schedule slots successfully saved to database.'
      });
      loadData();
    } catch (err) {
      console.error('Failed to save schedules:', err);
      setMessage({ type: 'error', text: err.message || 'Unable to save schedule slots.' });
    } finally {
      setIsSaving(false);
    }
  };

  const currentExam = exams.find((e) => e._id === selectedExamId);

  return (
    <div className="space-y-6">
      <ExamNavHeader
        title="Examination Scheduling & Slot Allocation"
        subtitle="Configure subject time-slots, allocate halls and room capacities, and run automated conflict detection"
        actionButton={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCheckClashes}
              disabled={isCheckingClash || slots.length === 0}
            >
              <ShieldAlert className={`w-4 h-4 mr-1.5 ${isCheckingClash ? 'animate-pulse' : ''}`} />
              <span>{isCheckingClash ? 'Checking...' : 'Check Clashes'}</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveSchedule}
              disabled={isSaving || slots.length === 0}
            >
              <Save className="w-4 h-4 mr-1.5" />
              <span>{isSaving ? 'Saving...' : 'Save Schedule'}</span>
            </Button>
          </div>
        }
      />

      {/* Notifications */}
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

      {/* Clash Diagnostics Banner */}
      {clashResult && clashResult.hasClashes && (
        <Card className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-bold text-amber-900 dark:text-amber-200 text-sm">
                Collision Diagnostics ({clashResult.totalClashes} Conflict{clashResult.totalClashes > 1 ? 's' : ''} Detected)
              </h4>
              <ul className="text-xs text-amber-800 dark:text-amber-300 list-disc list-inside space-y-1">
                {clashResult.clashes.map((c, i) => (
                  <li key={i}>
                    <strong>[{c.type.toUpperCase()}]</strong> {c.message} (Date: {c.date}, Time: {c.startTime}-{c.endTime})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
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
            <div className="flex items-center gap-2">
              <Badge variant="primary">{currentExam.examType}</Badge>
              <Badge variant={currentExam.status === 'scheduled' ? 'success' : 'secondary'}>
                {currentExam.status}
              </Badge>
              <span className="text-xs text-gray-500">
                Cutoff: {currentExam.attendanceCutoffPercentage || 75}% Attendance
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Slot Adder Form */}
      <Card className="p-5">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4 text-indigo-600" />
          <span>Add Subject Timetable Slot</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
            <select
              value={newSlot.subject}
              onChange={(e) => setNewSlot({ ...newSlot, subject: e.target.value })}
              className="w-full py-2 px-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
            <input
              type="date"
              value={newSlot.date}
              onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })}
              className="w-full py-2 px-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Timings</label>
            <div className="grid grid-cols-2 gap-1">
              <input
                type="text"
                placeholder="09:30 AM"
                value={newSlot.startTime}
                onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                className="w-full py-2 px-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <input
                type="text"
                placeholder="12:30 PM"
                value={newSlot.endTime}
                onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                className="w-full py-2 px-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Venue & Hall</label>
            <div className="grid grid-cols-2 gap-1">
              <input
                type="text"
                placeholder="Venue"
                value={newSlot.venue}
                onChange={(e) => setNewSlot({ ...newSlot, venue: e.target.value })}
                className="w-full py-2 px-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <input
                type="text"
                placeholder="Room"
                value={newSlot.roomNumber}
                onChange={(e) => setNewSlot({ ...newSlot, roomNumber: e.target.value })}
                className="w-full py-2 px-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Invigilator</label>
            <input
              type="text"
              placeholder="Prof. Name"
              value={newSlot.invigilator}
              onChange={(e) => setNewSlot({ ...newSlot, invigilator: e.target.value })}
              className="w-full py-2 px-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Max Hall Capacity</label>
            <input
              type="number"
              placeholder="60"
              value={newSlot.maxCapacity}
              onChange={(e) => setNewSlot({ ...newSlot, maxCapacity: e.target.value })}
              className="w-full py-2 px-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <div className="md:col-span-2 flex items-end">
            <Button variant="primary" size="sm" onClick={handleAddSlot} className="w-full">
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Add Slot to Timetable</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Slots Table */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm">
            Configured Timetable Slots ({slots.length})
          </h3>
          <span className="text-xs text-gray-500">
            {currentExam?.name}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-gray-800 font-semibold text-gray-600 dark:text-gray-300 uppercase">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Time Slot</th>
                <th className="py-3 px-4">Venue / Room</th>
                <th className="py-3 px-4">Capacity</th>
                <th className="py-3 px-4">Invigilator</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {slots.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-gray-400">
                    No slots configured for this examination yet. Add slots using the form above.
                  </td>
                </tr>
              ) : (
                slots.map((s, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-4 font-mono">{idx + 1}</td>
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                      {s.subject?.code ? `${s.subject.code} - ${s.subject.name}` : (s.subject?.name || 'Subject')}
                    </td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                      {s.date ? new Date(s.date).toLocaleDateString() : 'TBD'}
                    </td>
                    <td className="py-3 px-4 font-mono text-indigo-600 dark:text-indigo-400">
                      {s.startTime} - {s.endTime}
                    </td>
                    <td className="py-3 px-4">
                      {s.venue} ({s.roomNumber || 'Hall'})
                    </td>
                    <td className="py-3 px-4">{s.maxCapacity || 60}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{s.invigilator || 'Unassigned'}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleRemoveSlot(idx)}
                        className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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

export default ExaminationSchedulingPage;
