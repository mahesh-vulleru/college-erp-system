import React, { useState, useEffect, useCallback } from 'react';
import {
  FileCheck2,
  Calendar,
  Clock,
  MapPin,
  Plus,
  RefreshCw,
  Download,
  Edit2,
  XCircle,
  Eye,
  CheckCircle,
  Search
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

const EXAM_TYPES = ['Mid-Term 1', 'Mid-Term 2', 'Semester End', 'Practical / Lab', 'Supplementary'];

export const ExaminationsPage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const isPrivileged = user && [ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD].includes(user.role);

  const [exams, setExams] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedType, setSelectedType] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentExamId, setCurrentExamId] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    examType: 'Semester End',
    academicYear: '2025-2026',
    semester: 3,
    department: '',
    course: '',
    venue: 'Main Examination Hall',
    startDate: '',
    endDate: '',
    isPublished: false,
    status: 'scheduled'
  });
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDependencies = useCallback(async () => {
    try {
      const [dRes, cRes] = await Promise.all([
        api.getDepartments(),
        api.getCourses()
      ]);
      setDepartments(dRes.data || []);
      setCourses(cRes.data || []);
    } catch {
      // Non-blocking
    }
  }, []);

  const fetchExams = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = {};
      if (selectedSemester) params.semester = selectedSemester;
      if (selectedType) params.examType = selectedType;

      const res = await api.getExams(params);
      setExams(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch examination schedules');
    } finally {
      setIsLoading(false);
    }
  }, [selectedSemester, selectedType]);

  useEffect(() => {
    fetchDependencies();
  }, [fetchDependencies]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setCurrentExamId(null);
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setFormData({
      name: '',
      examType: 'Semester End',
      academicYear: '2025-2026',
      semester: 3,
      department: departments[0]?._id || '',
      course: courses[0]?._id || '',
      venue: 'Main Examination Hall',
      startDate: today,
      endDate: nextWeek,
      isPublished: false,
      status: 'scheduled'
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (exam) => {
    setIsEditing(true);
    setCurrentExamId(exam._id);
    setFormData({
      name: exam.name,
      examType: exam.examType,
      academicYear: exam.academicYear,
      semester: exam.semester,
      department: exam.department?._id || exam.department || '',
      course: exam.course?._id || exam.course || '',
      venue: exam.venue || 'Main Examination Hall',
      startDate: exam.startDate ? new Date(exam.startDate).toISOString().split('T')[0] : '',
      endDate: exam.endDate ? new Date(exam.endDate).toISOString().split('T')[0] : '',
      isPublished: Boolean(exam.isPublished),
      status: exam.status || 'scheduled'
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenDetail = (exam) => {
    setSelectedExam(exam);
    setIsDetailOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.startDate || !formData.endDate) {
      setModalError('Title, start date, and end date are mandatory');
      return;
    }
    setSubmitting(true);
    setModalError('');
    try {
      if (isEditing && currentExamId) {
        await api.updateExam(currentExamId, formData);
        addToast('Examination updated successfully', 'success');
      } else {
        await api.createExam(formData);
        addToast('Examination scheduled successfully', 'success');
      }
      setIsModalOpen(false);
      fetchExams();
    } catch (err) {
      setModalError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelExam = async (examId) => {
    if (!window.confirm('Cancel this examination schedule?')) return;
    try {
      await api.deleteExam(examId);
      addToast('Examination marked as cancelled', 'success');
      fetchExams();
    } catch (err) {
      addToast(err.message || 'Failed to cancel examination', 'error');
    }
  };

  const handleExportCSV = () => {
    if (exams.length === 0) return;
    const headers = ['Exam Title', 'Type', 'Semester', 'Venue', 'Start Date', 'End Date', 'Status', 'Published'];
    const rows = exams.map((e) => [
      `"${e.name}"`,
      e.examType,
      `Semester ${e.semester}`,
      `"${e.venue || ''}"`,
      new Date(e.startDate).toLocaleDateString(),
      new Date(e.endDate).toLocaleDateString(),
      e.status,
      e.isPublished ? 'Yes' : 'No'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Examinations_Schedule.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Schedule exported to CSV', 'success');
  };

  const filteredExams = exams.filter((e) => {
    const matchesSearch =
      e.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.venue?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-950 tracking-tight flex items-center gap-2.5">
            <FileCheck2 className="w-7 h-7 text-teal-600" />
            Examinations & Academic Assessments
          </h1>
          <p className="text-sm text-navy-600">
            Institutional mid-term exams, end-semester evaluations, and assessment hall schedules.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={exams.length === 0} className="flex items-center gap-1.5">
            <Download className="w-4 h-4" />
            Export Schedule
          </Button>
          <Button variant="outline" size="sm" onClick={fetchExams} disabled={isLoading} className="flex items-center gap-1.5">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {isPrivileged && (
            <Button variant="primary" size="sm" onClick={handleOpenCreate} className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700">
              <Plus className="w-4 h-4" />
              Schedule Exam
            </Button>
          )}
        </div>
      </div>

      {error && <Notification type="error" message={error} onClose={() => setError('')} />}

      {/* Filter Bar */}
      <Card className="p-4 border-navy-100">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
          <div className="relative">
            <Search className="w-4 h-4 text-navy-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search exam by title or venue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full text-xs border border-navy-200 rounded-lg p-2 bg-white text-navy-800 focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>
                  Semester {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full text-xs border border-navy-200 rounded-lg p-2 bg-white text-navy-800 focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Assessment Types</option>
              {EXAM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Examination Cards / Table */}
      {isLoading ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-2" />
          <p className="text-sm text-navy-500">Loading scheduled examinations...</p>
        </div>
      ) : filteredExams.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-navy-200">
          <FileCheck2 className="w-12 h-12 text-navy-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-navy-900">No Examinations Found</h3>
          <p className="text-sm text-navy-500 max-w-sm mx-auto mt-1">
            No examinations match your current filter parameters or have been scheduled yet.
          </p>
          {isPrivileged && (
            <Button variant="primary" size="sm" onClick={handleOpenCreate} className="mt-4 bg-teal-600">
              Schedule New Assessment
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredExams.map((exam) => (
            <Card
              key={exam._id}
              className={`p-5 flex flex-col justify-between hover:shadow-elevation transition-all border ${
                exam.status === 'cancelled'
                  ? 'border-rose-200 bg-rose-50/20'
                  : 'border-navy-100 bg-white'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant={exam.examType.includes('Mid-Term') ? 'primary' : 'warning'}>
                    {exam.examType}
                  </Badge>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      exam.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : exam.status === 'ongoing'
                        ? 'bg-amber-100 text-amber-800 animate-pulse'
                        : exam.status === 'cancelled'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-navy-100 text-navy-800'
                    }`}
                  >
                    {exam.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-navy-950 line-clamp-2">{exam.name}</h3>
                  <p className="text-xs text-navy-500 mt-1">
                    Academic Term: <span className="font-semibold text-navy-800">{exam.academicYear} &bull; Sem {exam.semester}</span>
                  </p>
                </div>

                <div className="pt-2 border-t border-navy-100/60 space-y-1.5 text-xs text-navy-600">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span className="font-medium text-navy-800 truncate">{exam.venue || 'Main Exam Hall'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-navy-400 shrink-0" />
                    <span>
                      {new Date(exam.startDate).toLocaleDateString()} &ndash; {new Date(exam.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-navy-400 text-[11px]">Marks Published:</span>
                    <Badge variant={exam.isPublished ? 'success' : 'neutral'}>
                      {exam.isPublished ? 'Published' : 'Confidential / Draft'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-4 mt-2 border-t border-navy-100">
                <Button variant="ghost" size="xs" onClick={() => handleOpenDetail(exam)} className="text-navy-600">
                  <Eye className="w-3.5 h-3.5 mr-1" />
                  Details
                </Button>
                {isPrivileged && (
                  <>
                    <Button variant="ghost" size="xs" onClick={() => handleOpenEdit(exam)} className="text-teal-700">
                      <Edit2 className="w-3.5 h-3.5 mr-1" />
                      Edit
                    </Button>
                    {exam.status !== 'cancelled' && (
                      <Button variant="ghost" size="xs" onClick={() => handleCancelExam(exam._id)} className="text-rose-600">
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                        Cancel
                      </Button>
                    )}
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Exam Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? 'Edit Examination Schedule' : 'Schedule Examination Assessment'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {modalError && <Notification type="error" message={modalError} onClose={() => setModalError('')} />}
          <Input
            label="Examination Title *"
            placeholder="e.g. End Semester Theory Examination 2025"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-navy-800 uppercase tracking-wider mb-1">
                Assessment Type *
              </label>
              <select
                value={formData.examType}
                onChange={(e) => setFormData({ ...formData, examType: e.target.value })}
                className="w-full text-xs border border-navy-200 rounded-lg p-2.5 bg-white text-navy-800 focus:ring-2 focus:ring-teal-500"
              >
                {EXAM_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-navy-800 uppercase tracking-wider mb-1">Semester *</label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                className="w-full text-xs border border-navy-200 rounded-lg p-2.5 bg-white text-navy-800 focus:ring-2 focus:ring-teal-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Academic Year *"
              placeholder="e.g. 2025-2026"
              value={formData.academicYear}
              onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
              required
            />
            <Input
              label="Examination Venue *"
              placeholder="e.g. Main Hall A or Systems Lab"
              value={formData.venue}
              onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Commencement Date *"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
            <Input
              label="Conclusion Date *"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3 items-center pt-1">
            <div>
              <label className="block text-xs font-semibold text-navy-800 uppercase tracking-wider mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full text-xs border border-navy-200 rounded-lg p-2 bg-white text-navy-800"
              >
                <option value="scheduled">Scheduled</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="pt-5 flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublishedCheck"
                checked={formData.isPublished}
                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                className="h-4 w-4 rounded border-navy-300 text-teal-600 focus:ring-teal-500"
              />
              <label htmlFor="isPublishedCheck" className="text-xs font-semibold text-navy-800">
                Publish results to students
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting} className="bg-teal-600">
              {submitting ? 'Checking Venue Conflicts...' : isEditing ? 'Update Schedule' : 'Schedule Exam'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      {selectedExam && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Exam: ${selectedExam.name}`}
        >
          <div className="space-y-4 text-xs">
            <div className="bg-navy-50 p-4 rounded-xl border border-navy-100 space-y-2">
              <div className="flex justify-between">
                <span className="text-navy-500">Evaluation Type:</span>
                <span className="font-bold text-navy-950">{selectedExam.examType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-500">Academic Year & Term:</span>
                <span className="font-bold text-navy-900">{selectedExam.academicYear} &bull; Semester {selectedExam.semester}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-500">Assigned Venue:</span>
                <span className="font-semibold text-teal-800">{selectedExam.venue || 'Main Exam Hall'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-500">Schedule Window:</span>
                <span className="font-medium text-navy-900">
                  {new Date(selectedExam.startDate).toLocaleDateString()} &ndash; {new Date(selectedExam.endDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-navy-200/50">
                <span className="text-navy-500">Results Publication:</span>
                <Badge variant={selectedExam.isPublished ? 'success' : 'neutral'}>
                  {selectedExam.isPublished ? 'Live & Accessible to Students' : 'Restricted (Faculty/Admin Only)'}
                </Badge>
              </div>
            </div>
            <div className="flex justify-end pt-3 border-t">
              <Button variant="outline" size="sm" onClick={() => setIsDetailOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ExaminationsPage;

