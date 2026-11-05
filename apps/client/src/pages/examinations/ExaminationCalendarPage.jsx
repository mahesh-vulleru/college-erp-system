import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Filter,
  Download,
  RefreshCw,
  Search,
  BookOpen,
  AlertCircle
} from 'lucide-react';
import api from '../../api/apiClient';
import ExamNavHeader from './ExamNavHeader';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';

export const ExaminationCalendarPage = () => {
  const [exams, setExams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCalendar = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.getExams();
      if (res && res.data) {
        setExams(res.data);
      }
    } catch (err) {
      console.error('Failed to load examination calendar:', err);
      setError(err.message || 'Unable to fetch examination calendar data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  // Flatten all schedules across exams for calendar view
  const allScheduledSlots = [];
  exams.forEach((exam) => {
    if (exam.schedules && exam.schedules.length > 0) {
      exam.schedules.forEach((slot) => {
        allScheduledSlots.push({
          examId: exam._id,
          examName: exam.name,
          examType: exam.examType,
          academicYear: exam.academicYear,
          semester: exam.semester,
          status: exam.status,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          venue: slot.venue,
          roomNumber: slot.roomNumber,
          maxCapacity: slot.maxCapacity,
          invigilator: slot.invigilator,
          subject: slot.subject
        });
      });
    } else {
      // Include parent exam dates if no granular schedules added yet
      allScheduledSlots.push({
        examId: exam._id,
        examName: exam.name,
        examType: exam.examType,
        academicYear: exam.academicYear,
        semester: exam.semester,
        status: exam.status,
        date: exam.startDate,
        startTime: '09:30 AM',
        endTime: '12:30 PM',
        venue: exam.venue || 'Main Examination Complex',
        roomNumber: 'Hall A',
        maxCapacity: 60,
        invigilator: 'TBD',
        subject: null
      });
    }
  });

  // Filter slots
  const filteredSlots = allScheduledSlots.filter((slot) => {
    if (selectedSemester !== 'all' && String(slot.semester) !== selectedSemester) return false;
    if (selectedType !== 'all' && slot.examType !== selectedType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = slot.examName?.toLowerCase().includes(q);
      const matchSub = slot.subject?.name?.toLowerCase().includes(q) || slot.subject?.code?.toLowerCase().includes(q);
      const matchVenue = slot.venue?.toLowerCase().includes(q) || slot.roomNumber?.toLowerCase().includes(q);
      if (!matchName && !matchSub && !matchVenue) return false;
    }
    return true;
  });

  // Sort chronologically by date
  filteredSlots.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Group by Date string
  const groupedByDate = filteredSlots.reduce((acc, slot) => {
    const dateKey = slot.date ? new Date(slot.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : 'Date To Be Announced';

    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(slot);
    return acc;
  }, {});

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <ExamNavHeader
        title="Examination Calendar & Timetable"
        subtitle="Chronological timetable schedule, session timings, and examination hall allocations"
        actionButton={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Download className="w-4 h-4 mr-1.5" />
              <span>Print Date Sheet</span>
            </Button>
            <Button variant="outline" size="sm" onClick={fetchCalendar} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        }
      />

      {/* Filter Ribbon */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search subject, exam, hall..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full py-2 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={String(s)}>Semester {s}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full py-2 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">All Exam Types</option>
              <option value="Mid-Term 1">Mid-Term 1</option>
              <option value="Mid-Term 2">Mid-Term 2</option>
              <option value="Semester End">Semester End</option>
              <option value="Practical / Lab">Practical / Lab</option>
              <option value="Supplementary">Supplementary</option>
            </select>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-end">
            Total Slots Scheduled: <span className="font-bold text-gray-900 dark:text-white ml-1">{filteredSlots.length}</span>
          </div>
        </div>
      </Card>

      {/* Calendar Timeline Grouped by Day */}
      {isLoading ? (
        <div className="p-12 text-center text-gray-500">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-2 text-indigo-600" />
          <p>Loading scheduled calendar slots...</p>
        </div>
      ) : Object.keys(groupedByDate).length === 0 ? (
        <Card className="p-12 text-center">
          <CalendarIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">No Examination Slots Found</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            No examination schedules match your filter criteria. Go to Examination Scheduling to add slots.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByDate).map(([dateStr, slots]) => (
            <div key={dateStr} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                  {dateStr}
                </h3>
                <span className="text-xs text-gray-400 font-normal">
                  ({slots.length} session{slots.length > 1 ? 's' : ''})
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {slots.map((slot, idx) => (
                  <Card key={idx} className="p-4 hover:shadow-md transition-shadow border-l-4 border-l-indigo-600">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge variant="primary" className="text-[10px] mb-1">
                          Sem {slot.semester} • {slot.examType}
                        </Badge>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                          {slot.subject ? `${slot.subject.code} - ${slot.subject.name}` : slot.examName}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {slot.examName}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                        <span>{slot.startTime} - {slot.endTime}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        <span>{slot.venue} {slot.roomNumber ? `(Room: ${slot.roomNumber})` : ''}</span>
                      </div>
                      <div className="flex items-center justify-between text-gray-400 pt-1">
                        <span>Invigilator: <strong className="text-gray-700 dark:text-gray-200">{slot.invigilator}</strong></span>
                        <span>Cap: {slot.maxCapacity || 60}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExaminationCalendarPage;

