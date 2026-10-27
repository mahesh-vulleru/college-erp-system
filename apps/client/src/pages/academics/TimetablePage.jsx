import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Plus,
  RefreshCw,
  Download,
  Trash2,
  Edit2,
  Filter,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import api from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Notification from '../../components/common/Notification';
import { ROLES } from '@college-erp/shared';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIOD_TIMES = [
  { period: 1, start: '09:00', end: '09:50' },
  { period: 2, start: '09:50', end: '10:40' },
  { period: 3, start: '10:55', end: '11:45' },
  { period: 4, start: '11:45', end: '12:35' },
  { period: 5, start: '01:30', end: '02:20' },
  { period: 6, start: '02:20', end: '03:10' },
  { period: 7, start: '03:20', end: '04:10' },
  { period: 8, start: '04:10', end: '05:00' }
];

export const TimetablePage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const isPrivileged = user && [ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD].includes(user.role);

  const [timetableSlots, setTimetableSlots] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [facultyList, setFacultyList] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('3');
  const [selectedSection, setSelectedSection] = useState('A');
  const [selectedDay, setSelectedDay] = useState(''); // '' for weekly grid

  // Modal
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSlotId, setCurrentSlotId] = useState(null);
  const [slotFormData, setSlotFormData] = useState({
    department: '',
    course: '',
    semester: 3,
    section: 'A',
    dayOfWeek: 'Monday',
    periodNumber: 1,
    startTime: '09:00',
    endTime: '09:50',
    subject: '',
    faculty: '',
    roomNumber: 'LH-101'
  });
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDependencies = useCallback(async () => {
    try {
      const [dRes, cRes, sRes, fRes] = await Promise.all([
        api.getDepartments(),
        api.getCourses(),
        api.getSubjects(),
        api.getFaculty()
      ]);
      setDepartments(dRes.data || []);
      setCourses(cRes.data || []);
      setSubjects(sRes.data || []);
      setFacultyList(fRes.data || []);
      if (dRes.data?.[0]?._id && !selectedDept) {
        setSelectedDept(dRes.data[0]._id);
      }
    } catch {
      // Non-blocking
    }
  }, [selectedDept]);

  const fetchTimetable = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = {};
      if (selectedDept) params.department = selectedDept;
      if (selectedSemester) params.semester = selectedSemester;
      if (selectedSection) params.section = selectedSection;
      if (selectedDay) params.dayOfWeek = selectedDay;

      const res = await api.getTimetable(params);
      setTimetableSlots(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch timetable');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDept, selectedSemester, selectedSection, selectedDay]);

  useEffect(() => {
    fetchDependencies();
  }, [fetchDependencies]);

  useEffect(() => {
    fetchTimetable();
  }, [fetchTimetable]);

  const handleOpenCreateSlot = () => {
    setIsEditing(false);
    setCurrentSlotId(null);
    setSlotFormData({
      department: selectedDept || departments[0]?._id || '',
      course: courses[0]?._id || '',
      semester: Number(selectedSemester) || 3,
      section: selectedSection || 'A',
      dayOfWeek: selectedDay || 'Monday',
      periodNumber: 1,
      startTime: '09:00',
      endTime: '09:50',
      subject: subjects[0]?._id || '',
      faculty: facultyList[0]?._id || '',
      roomNumber: 'LH-101'
    });
    setModalError('');
    setIsSlotModalOpen(true);
  };

  const handleOpenEditSlot = (slot) => {
    setIsEditing(true);
    setCurrentSlotId(slot._id);
    setSlotFormData({
      department: slot.department?._id || slot.department,
      course: slot.course?._id || slot.course,
      semester: slot.semester || 3,
      section: slot.section || 'A',
      dayOfWeek: slot.dayOfWeek,
      periodNumber: slot.periodNumber,
      startTime: slot.startTime,
      endTime: slot.endTime,
      subject: slot.subject?._id || slot.subject,
      faculty: slot.faculty?._id || slot.faculty,
      roomNumber: slot.roomNumber || ''
    });
    setModalError('');
    setIsSlotModalOpen(true);
  };

  const handleSlotPeriodChange = (pNum) => {
    const timing = PERIOD_TIMES.find((t) => t.period === Number(pNum));
    setSlotFormData((prev) => ({
      ...prev,
      periodNumber: Number(pNum),
      startTime: timing ? timing.start : prev.startTime,
      endTime: timing ? timing.end : prev.endTime
    }));
  };

  const handleSlotSubmit = async (e) => {
    e.preventDefault();
    if (!slotFormData.department || !slotFormData.subject || !slotFormData.faculty) {
      setModalError('Department, Subject, and Assigned Faculty are required.');
      return;
    }
    setSubmitting(true);
    setModalError('');
    try {
      if (isEditing && currentSlotId) {
        await api.updateTimetableSlot(currentSlotId, slotFormData);
        addToast('Timetable period updated successfully', 'success');
      } else {
        await api.createTimetableSlot(slotFormData);
        addToast('Timetable slot scheduled successfully', 'success');
      }
      setIsSlotModalOpen(false);
      fetchTimetable();
    } catch (err) {
      setModalError(err.message || 'Schedule conflict or validation error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Cancel and remove this class slot from schedule?')) return;
    try {
      await api.deleteTimetableSlot(slotId);
      addToast('Timetable slot removed', 'success');
      fetchTimetable();
    } catch (err) {
      addToast(err.message || 'Failed to remove slot', 'error');
    }
  };

  const handleExportCSV = () => {
    if (timetableSlots.length === 0) {
      addToast('No timetable records to export', 'warning');
      return;
    }
    const headers = ['Day', 'Period', 'Time', 'Subject Code', 'Subject Name', 'Room', 'Faculty', 'Section'];
    const rows = timetableSlots.map((s) => [
      s.dayOfWeek,
      s.periodNumber,
      `${s.startTime}-${s.endTime}`,
      s.subject?.code || '',
      `"${s.subject?.name || ''}"`,
      s.roomNumber || '',
      `"${s.faculty?.user?.name || s.faculty?.employeeId || ''}"`,
      `Sem ${s.semester}-${s.section}`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Timetable_Sem${selectedSemester}_Sec${selectedSection}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Timetable exported successfully', 'success');
  };

  // Organize slots into grid lookup: day -> periodNumber -> slot
  const slotGrid = {};
  DAYS.forEach((d) => {
    slotGrid[d] = {};
  });
  timetableSlots.forEach((slot) => {
    if (slotGrid[slot.dayOfWeek]) {
      slotGrid[slot.dayOfWeek][slot.periodNumber] = slot;
    }
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-950 tracking-tight flex items-center gap-2.5">
            <Calendar className="w-7 h-7 text-teal-600" />
            Class Schedule & Master Timetable
          </h1>
          <p className="text-sm text-navy-600">
            Interactive weekly class matrix, room occupancy, and period allocation.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="flex items-center gap-1.5">
            <Download className="w-4 h-4" />
            Export Schedule
          </Button>
          <Button variant="outline" size="sm" onClick={fetchTimetable} disabled={isLoading} className="flex items-center gap-1.5">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {isPrivileged && (
            <Button variant="primary" size="sm" onClick={handleOpenCreateSlot} className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700">
              <Plus className="w-4 h-4" />
              Schedule Period
            </Button>
          )}
        </div>
      </div>

      {error && <Notification type="error" message={error} onClose={() => setError('')} />}

      {/* Filter Bar */}
      <Card className="p-4 border-navy-100">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
          <div>
            <label className="block text-[11px] font-bold text-navy-700 uppercase mb-1">Department</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full text-xs border border-navy-200 rounded-lg p-2 bg-white text-navy-800 focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.code} - {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-navy-700 uppercase mb-1">Semester</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full text-xs border border-navy-200 rounded-lg p-2 bg-white text-navy-800 focus:ring-2 focus:ring-teal-500"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <option key={sem} value={sem}>
                  Semester {sem}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-navy-700 uppercase mb-1">Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full text-xs border border-navy-200 rounded-lg p-2 bg-white text-navy-800 focus:ring-2 focus:ring-teal-500"
            >
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-navy-700 uppercase mb-1">Day Filter</label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="w-full text-xs border border-navy-200 rounded-lg p-2 bg-white text-navy-800 focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Days (Weekly Matrix)</option>
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Timetable Weekly Matrix / View */}
      {isLoading ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-2" />
          <p className="text-sm text-navy-500">Compiling class schedules...</p>
        </div>
      ) : timetableSlots.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-navy-200">
          <Calendar className="w-12 h-12 text-navy-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-navy-900">No Timetable Records Scheduled</h3>
          <p className="text-sm text-navy-500 max-w-sm mx-auto mt-1">
            No class periods found for the selected department, semester, and section.
          </p>
          {isPrivileged && (
            <Button variant="primary" size="sm" onClick={handleOpenCreateSlot} className="mt-4 bg-teal-600">
              Schedule First Lecture Slot
            </Button>
          )}
        </Card>
      ) : (
        <Card className="overflow-hidden border-navy-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-navy-900 text-white font-semibold">
                  <th className="py-3 px-3 w-28 border-r border-navy-800">Day / Period</th>
                  {PERIOD_TIMES.map((pt) => (
                    <th key={pt.period} className="py-3 px-2 text-center border-r border-navy-800 last:border-r-0 min-w-[130px]">
                      <div>Period {pt.period}</div>
                      <div className="text-[10px] text-teal-300 font-normal">{pt.start} - {pt.end}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {(selectedDay ? [selectedDay] : DAYS).map((day) => (
                  <tr key={day} className="hover:bg-navy-50/30">
                    <td className="py-3 px-3 font-bold text-navy-950 bg-navy-50/70 border-r border-navy-200">
                      {day}
                    </td>
                    {PERIOD_TIMES.map((pt) => {
                      const slot = slotGrid[day]?.[pt.period];
                      return (
                        <td key={pt.period} className="p-1.5 border-r border-navy-100 last:border-r-0 align-top">
                          {slot ? (
                            <div className="bg-white p-2.5 rounded-lg border border-teal-100 shadow-xs hover:border-teal-300 transition-all flex flex-col justify-between h-full min-h-[95px]">
                              <div>
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <span className="font-mono font-bold text-teal-800 text-[11px]">
                                    {slot.subject?.code}
                                  </span>
                                  <span className="text-[10px] text-navy-500 font-semibold bg-navy-50 px-1 rounded">
                                    {slot.roomNumber || 'LH'}
                                  </span>
                                </div>
                                <div className="font-semibold text-navy-900 text-[11px] line-clamp-1" title={slot.subject?.name}>
                                  {slot.subject?.name}
                                </div>
                                <div className="text-[10px] text-navy-500 flex items-center gap-1 mt-1 line-clamp-1">
                                  <User className="w-3 h-3 text-navy-400" />
                                  {slot.faculty?.user?.name || slot.faculty?.employeeId || 'Instructor'}
                                </div>
                              </div>
                              {isPrivileged && (
                                <div className="flex items-center justify-end gap-1 mt-2 pt-1 border-t border-navy-100/60">
                                  <button
                                    onClick={() => handleOpenEditSlot(slot)}
                                    title="Edit slot"
                                    className="p-1 text-teal-600 hover:text-teal-800"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSlot(slot._id)}
                                    title="Cancel slot"
                                    className="p-1 text-rose-500 hover:text-rose-700"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="h-full min-h-[95px] flex items-center justify-center text-[10px] text-navy-300 font-light border border-dashed border-navy-100 rounded-lg">
                              Free Slot
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Schedule / Edit Modal */}
      <Modal
        isOpen={isSlotModalOpen}
        onClose={() => setIsSlotModalOpen(false)}
        title={isEditing ? 'Edit Scheduled Lecture Slot' : 'Schedule New Class Slot'}
      >
        <form onSubmit={handleSlotSubmit} className="space-y-4">
          {modalError && <Notification type="error" message={modalError} onClose={() => setModalError('')} />}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-navy-800 uppercase tracking-wider mb-1">
                Day of Week *
              </label>
              <select
                value={slotFormData.dayOfWeek}
                onChange={(e) => setSlotFormData({ ...slotFormData, dayOfWeek: e.target.value })}
                className="w-full text-xs border border-navy-200 rounded-lg p-2.5 bg-white text-navy-800 focus:ring-2 focus:ring-teal-500"
                required
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-navy-800 uppercase tracking-wider mb-1">
                Period Slot *
              </label>
              <select
                value={slotFormData.periodNumber}
                onChange={(e) => handleSlotPeriodChange(e.target.value)}
                className="w-full text-xs border border-navy-200 rounded-lg p-2.5 bg-white text-navy-800 focus:ring-2 focus:ring-teal-500"
                required
              >
                {PERIOD_TIMES.map((pt) => (
                  <option key={pt.period} value={pt.period}>
                    Period {pt.period} ({pt.start} - {pt.end})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-navy-800 uppercase tracking-wider mb-1">
                Academic Department *
              </label>
              <select
                value={slotFormData.department}
                onChange={(e) => setSlotFormData({ ...slotFormData, department: e.target.value })}
                className="w-full text-xs border border-navy-200 rounded-lg p-2.5 bg-white text-navy-800 focus:ring-2 focus:ring-teal-500"
                required
              >
                <option value="">-- Choose Department --</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.code} - {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-navy-800 uppercase tracking-wider mb-1">
                Curriculum Subject *
              </label>
              <select
                value={slotFormData.subject}
                onChange={(e) => setSlotFormData({ ...slotFormData, subject: e.target.value })}
                className="w-full text-xs border border-navy-200 rounded-lg p-2.5 bg-white text-navy-800 focus:ring-2 focus:ring-teal-500"
                required
              >
                <option value="">-- Choose Subject --</option>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.code} - {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-navy-800 uppercase tracking-wider mb-1">
                Assigned Faculty *
              </label>
              <select
                value={slotFormData.faculty}
                onChange={(e) => setSlotFormData({ ...slotFormData, faculty: e.target.value })}
                className="w-full text-xs border border-navy-200 rounded-lg p-2.5 bg-white text-navy-800 focus:ring-2 focus:ring-teal-500"
                required
              >
                <option value="">-- Choose Faculty --</option>
                {facultyList.map((f) => (
                  <option key={f._id} value={f._id}>
                    {f.user?.name || f.employeeId} ({f.designation || 'Faculty'})
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Room / Lab Number *"
              placeholder="e.g. LH-204 or Systems Lab"
              value={slotFormData.roomNumber}
              onChange={(e) => setSlotFormData({ ...slotFormData, roomNumber: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-navy-800 uppercase tracking-wider mb-1">Semester</label>
              <select
                value={slotFormData.semester}
                onChange={(e) => setSlotFormData({ ...slotFormData, semester: Number(e.target.value) })}
                className="w-full text-xs border border-navy-200 rounded-lg p-2.5 bg-white text-navy-800"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Section *"
              value={slotFormData.section}
              onChange={(e) => setSlotFormData({ ...slotFormData, section: e.target.value.toUpperCase() })}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="ghost" type="button" onClick={() => setIsSlotModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting} className="bg-teal-600">
              {submitting ? 'Checking Conflicts...' : isEditing ? 'Save Changes' : 'Schedule Slot'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TimetablePage;

