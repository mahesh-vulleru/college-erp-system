import React, { useState, useEffect, useCallback } from 'react';
import {
  Ticket,
  Printer,
  Download,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  User,
  Calendar,
  Clock,
  MapPin,
  FileText
} from 'lucide-react';
import api from '../../api/apiClient';
import ExamNavHeader from './ExamNavHeader';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

export const HallTicketManagementPage = () => {
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [hallTickets, setHallTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchQuery, setSearchQuery] = useState('');

  // Hall ticket preview modal
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

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
          const ticketsRes = await api.getHallTickets({ examination: currentId });
          if (ticketsRes && ticketsRes.data) {
            setHallTickets(ticketsRes.data);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load hall tickets:', err);
      setMessage({ type: 'error', text: err.message || 'Error loading hall tickets' });
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

  const handleGenerateBatch = async () => {
    if (!selectedExamId) return;

    setIsGenerating(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await api.generateHallTickets(selectedExamId, {
        seatPrefix: 'SEAT'
      });
      if (res && res.data) {
        setMessage({
          type: 'success',
          text: `Hall tickets generated successfully! ${res.data.generatedCount} seat tickets created/updated.`
        });
        loadData();
      }
    } catch (err) {
      console.error('Batch generation failed:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to generate hall tickets' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreview = (ticket) => {
    setSelectedTicket(ticket);
    setIsPreviewOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredTickets = hallTickets.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const roll = t.student?.rollNumber?.toLowerCase() || '';
    const name = t.student?.user?.name?.toLowerCase() || '';
    const seat = t.seatNumber?.toLowerCase() || '';
    return roll.includes(q) || name.includes(q) || seat.includes(q);
  });

  const currentExam = exams.find((e) => e._id === selectedExamId);

  return (
    <div className="space-y-6">
      <ExamNavHeader
        title="Hall Ticket Dispatch & Seating Desk"
        subtitle="Batch generate official examination hall tickets, allocate seat designations, and preview candidate entry passes"
        actionButton={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleGenerateBatch}
              disabled={isGenerating || !selectedExamId}
            >
              <Ticket className={`w-4 h-4 mr-1.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Generating...' : 'Generate Batch Tickets'}</span>
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

      {/* Select Exam */}
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
            <div className="text-xs text-gray-500">
              Exam Dates: <strong>{new Date(currentExam.startDate).toLocaleDateString()}</strong> -{' '}
              <strong>{new Date(currentExam.endDate).toLocaleDateString()}</strong>
            </div>
          )}
        </div>
      </Card>

      {/* Hall Tickets Table */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search seat #, roll no, name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <span className="text-xs text-gray-500">
            Total Issued: <strong className="text-gray-900 dark:text-white">{filteredTickets.length}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-gray-800 font-semibold text-gray-600 dark:text-gray-300 uppercase">
              <tr>
                <th className="py-3 px-4">Seat Number</th>
                <th className="py-3 px-4">Roll Number</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Examination</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Issued At</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-gray-400">
                    Loading hall tickets...
                  </td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-gray-400">
                    No hall tickets generated yet for this examination. Click "Generate Batch Tickets" above.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((t) => (
                  <tr key={t.registrationId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {t.seatNumber}
                    </td>
                    <td className="py-3 px-4 font-mono">{t.student?.rollNumber}</td>
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                      {t.student?.user?.name || 'Student'}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{t.examination?.name}</td>
                    <td className="py-3 px-4">
                      <Badge variant="success">Issued</Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-400">
                      {t.hallTicketIssuedAt ? new Date(t.hallTicketIssuedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="outline" size="sm" onClick={() => handlePreview(t)}>
                        <FileText className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                        <span>Preview Pass</span>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Printable Hall Ticket Modal */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="Official Examination Hall Ticket"
      >
        {selectedTicket && (
          <div className="space-y-4 text-sm" id="hall-ticket-print-area">
            {/* Header */}
            <div className="text-center border-b border-gray-200 pb-3">
              <h3 className="font-extrabold text-base uppercase text-gray-900 tracking-wider">
                College of Engineering & Technology
              </h3>
              <p className="text-xs text-gray-500 uppercase">Office of the Controller of Examinations</p>
              <div className="mt-2 inline-block px-3 py-1 bg-indigo-100 text-indigo-800 font-bold text-xs uppercase rounded">
                Official Hall Ticket / Examination Entry Pass
              </div>
            </div>

            {/* Candidate Metadata */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div>
                <p className="text-gray-500">Candidate Name:</p>
                <p className="font-bold text-gray-900">{selectedTicket.student?.user?.name || 'Student'}</p>
              </div>
              <div>
                <p className="text-gray-500">Roll Number:</p>
                <p className="font-bold font-mono text-gray-900">{selectedTicket.student?.rollNumber}</p>
              </div>
              <div>
                <p className="text-gray-500">Assigned Seat Number:</p>
                <p className="font-extrabold font-mono text-indigo-600">{selectedTicket.seatNumber}</p>
              </div>
              <div>
                <p className="text-gray-500">Examination:</p>
                <p className="font-bold text-gray-900">{selectedTicket.examination?.name}</p>
              </div>
            </div>

            {/* Timetable Schedule */}
            <div>
              <h4 className="font-bold text-xs uppercase text-gray-700 mb-2">Subject Schedule & Venues</h4>
              <table className="w-full text-left text-xs border border-gray-200">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="p-2 border-b">Subject</th>
                    <th className="p-2 border-b">Date</th>
                    <th className="p-2 border-b">Timings</th>
                    <th className="p-2 border-b">Hall / Room</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {selectedTicket.schedules && selectedTicket.schedules.length > 0 ? (
                    selectedTicket.schedules.map((s, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-medium">
                          {s.subject?.code ? `${s.subject.code} - ${s.subject.name}` : (s.subject?.name || 'Subject')}
                        </td>
                        <td className="p-2">{s.date ? new Date(s.date).toLocaleDateString() : 'TBD'}</td>
                        <td className="p-2 font-mono text-indigo-600">{s.startTime} - {s.endTime}</td>
                        <td className="p-2">{s.venue} ({s.roomNumber || 'Hall'})</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="p-3 text-center text-gray-400">
                        Detailed subject timetable will be displayed upon schedule finalization.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Instructions */}
            <div className="text-[11px] text-gray-500 bg-gray-50 p-2.5 rounded border border-gray-200 space-y-1">
              <p className="font-bold text-gray-700">Instructions for Candidate:</p>
              <p>1. Candidates must arrive at the examination venue 30 minutes before the scheduled start time.</p>
              <p>2. Physical Hall Ticket and College ID Card are mandatory for hall entry.</p>
              <p>3. Electronic devices, smartwatches, and programmable calculators are strictly prohibited.</p>
            </div>

            {/* Signatures */}
            <div className="flex justify-between items-end pt-4 border-t border-gray-200 text-xs">
              <div className="text-center">
                <div className="w-24 border-b border-gray-400 mb-1"></div>
                <span className="text-gray-500">Candidate Signature</span>
              </div>
              <div className="text-center">
                <div className="font-serif italic font-bold text-indigo-900 mb-1">Controller of Exams</div>
                <div className="w-32 border-b border-gray-400 mb-1"></div>
                <span className="text-gray-500">Controller of Examinations</span>
              </div>
            </div>

            {/* Print Trigger */}
            <div className="pt-3 flex justify-end gap-2 border-t border-gray-200">
              <Button variant="outline" size="sm" onClick={() => setIsPreviewOpen(false)}>
                Close
              </Button>
              <Button variant="primary" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-1.5" />
                <span>Print Pass</span>
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default HallTicketManagementPage;
