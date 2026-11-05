import React, { useState, useEffect, useCallback } from 'react';
import {
  UserCheck,
  Search,
  Filter,
  Plus,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ShieldAlert,
  CreditCard,
  Ticket
} from 'lucide-react';
import api from '../../api/apiClient';
import ExamNavHeader from './ExamNavHeader';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

export const ExamRegistrationsPage = () => {
  const [registrations, setRegistrations] = useState([]);
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [selectedExamId, setSelectedExamId] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    examination: '',
    student: '',
    examFeePaid: true
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [examsRes, regsRes, studentsRes] = await Promise.all([
        api.getExams(),
        api.getExamRegistrations({
          examination: selectedExamId || undefined,
          eligibilityStatus: statusFilter !== 'all' ? statusFilter : undefined
        }),
        api.getStudents().catch(() => ({ data: [] }))
      ]);

      if (examsRes && examsRes.data) {
        setExams(examsRes.data);
      }
      if (regsRes && regsRes.data) {
        setRegistrations(regsRes.data);
      }
      if (studentsRes && studentsRes.data) {
        setStudents(studentsRes.data);
      }
    } catch (err) {
      console.error('Failed to load registrations:', err);
      setError(err.message || 'Error fetching registrations.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedExamId, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.examination || !formData.student) {
      alert('Please select both an examination and a student.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.registerForExam(formData);
      setIsModalOpen(false);
      setFormData({
        examination: '',
        student: '',
        examFeePaid: true
      });
      loadData();
    } catch (err) {
      console.error('Registration failed:', err);
      alert(err.message || 'Failed to register student for examination');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRegistrations = registrations.filter((reg) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const roll = reg.student?.rollNumber?.toLowerCase() || '';
    const name = reg.student?.user?.name?.toLowerCase() || '';
    const regNum = reg.registrationNumber?.toLowerCase() || '';
    return roll.includes(q) || name.includes(q) || regNum.includes(q);
  });

  return (
    <div className="space-y-6">
      <ExamNavHeader
        title="Student Examination Registrations"
        subtitle="Manage student exam enrollment, fee settlement verification, and automated attendance-based eligibility status"
        actionButton={
          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Enroll Student</span>
            </Button>
            <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
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

      {/* Filter Ribbon */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search roll no, student name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full py-2 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">All Examinations</option>
              {exams.map((ex) => (
                <option key={ex._id} value={ex._id}>
                  {ex.name} (Sem {ex.semester})
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">All Eligibility Statuses</option>
              <option value="eligible">Eligible (Attendance ≥ 75%)</option>
              <option value="shortage">Attendance Shortage (&lt; 75%)</option>
              <option value="condoned">Condoned (Sanctioned)</option>
              <option value="disqualified">Disqualified</option>
            </select>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-end">
            Total Enrolled: <span className="font-bold text-gray-900 dark:text-white ml-1">{filteredRegistrations.length}</span>
          </div>
        </div>
      </Card>

      {/* Registrations Roster Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-gray-800 font-semibold text-gray-600 dark:text-gray-300 uppercase">
              <tr>
                <th className="py-3 px-4">Registration #</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Examination</th>
                <th className="py-3 px-4">Attendance %</th>
                <th className="py-3 px-4">Eligibility</th>
                <th className="py-3 px-4">Fee Status</th>
                <th className="py-3 px-4">Hall Ticket</th>
                <th className="py-3 px-4">Enrolled At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-gray-400">
                    <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2 text-indigo-600" />
                    <span>Loading student registrations...</span>
                  </td>
                </tr>
              ) : filteredRegistrations.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-gray-400">
                    No student registrations match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRegistrations.map((reg) => {
                  const isEligible = reg.eligibilityStatus === 'eligible' || reg.eligibilityStatus === 'condoned';
                  return (
                    <tr key={reg._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-4 font-mono font-medium text-indigo-600 dark:text-indigo-400">
                        {reg.registrationNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {reg.student?.user?.name || 'Student'}
                        </div>
                        <div className="text-[11px] text-gray-500 font-mono">
                          {reg.student?.rollNumber}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-gray-900 dark:text-white font-medium">
                          {reg.examination?.name || 'Examination'}
                        </div>
                        <div className="text-[11px] text-gray-400">
                          Sem {reg.examination?.semester} • {reg.examination?.examType}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-bold ${
                              reg.attendancePercentage >= 75
                                ? 'text-emerald-600'
                                : reg.attendancePercentage >= 65
                                ? 'text-amber-600'
                                : 'text-red-600'
                            }`}
                          >
                            {reg.attendancePercentage}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            reg.eligibilityStatus === 'eligible'
                              ? 'success'
                              : reg.eligibilityStatus === 'condoned'
                              ? 'primary'
                              : 'danger'
                          }
                        >
                          {reg.eligibilityStatus}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                            reg.examFeePaid ? 'text-emerald-600' : 'text-amber-600'
                          }`}
                        >
                          <CreditCard className="w-3 h-3" />
                          {reg.examFeePaid ? 'Cleared' : 'Due'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {reg.hallTicketIssued ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-medium text-[11px]">
                            <Ticket className="w-3.5 h-3.5" />
                            <span>{reg.seatNumber || 'Issued'}</span>
                          </span>
                        ) : (
                          <span className="text-gray-400 text-[11px]">Pending</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-[11px]">
                        {reg.createdAt ? new Date(reg.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Enroll Student Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Enroll Student in Examination"
      >
        <form onSubmit={handleRegister} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Select Examination *
            </label>
            <select
              required
              value={formData.examination}
              onChange={(e) => setFormData({ ...formData, examination: e.target.value })}
              className="w-full py-2 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">-- Choose Examination --</option>
              {exams.map((ex) => (
                <option key={ex._id} value={ex._id}>
                  {ex.name} (Sem {ex.semester} • {ex.academicYear})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Select Student *
            </label>
            <select
              required
              value={formData.student}
              onChange={(e) => setFormData({ ...formData, student: e.target.value })}
              className="w-full py-2 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">-- Choose Candidate --</option>
              {students.map((st) => (
                <option key={st._id} value={st._id}>
                  {st.rollNumber} - {st.user?.name || 'Student'} (Sem {st.currentSemester})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="feePaid"
              checked={formData.examFeePaid}
              onChange={(e) => setFormData({ ...formData, examFeePaid: e.target.checked })}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <label htmlFor="feePaid" className="text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
              Examination Fee Cleared & Verified
            </label>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Enrolling...' : 'Submit Enrollment'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ExamRegistrationsPage;

