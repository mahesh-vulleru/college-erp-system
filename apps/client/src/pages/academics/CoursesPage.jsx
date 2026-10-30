import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  GraduationCap,
  BookOpen,
  Plus,
  Search,
  Edit2,
  Archive,
  RefreshCw,
  Layers,
  CheckCircle,
  FileText,
  Trash2
} from 'lucide-react';
import api from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import Notification from '../../components/common/Notification';
import { ROLES } from '@college-erp/shared';

export const CoursesPage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const isPrivileged = user && [ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD].includes(user.role);

  const location = useLocation();
  const [activeTab, setActiveTab] = useState(
    location.pathname.includes('/subjects') ? 'subjects' : 'courses'
  ); // 'courses' | 'subjects'

  useEffect(() => {
    if (location.pathname.includes('/subjects')) {
      setActiveTab('subjects');
    } else if (location.pathname.includes('/courses')) {
      setActiveTab('courses');
    }
  }, [location.pathname]);
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('');

  // Course Modals
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseFormData, setCourseFormData] = useState({
    name: '',
    code: '',
    department: '',
    degreeType: 'B.Tech',
    durationSemesters: 8,
    totalCredits: 160
  });

  // Subject Modals
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isEditingSubject, setIsEditingSubject] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [isDeleteSubjectModalOpen, setIsDeleteSubjectModalOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState(null);
  const [subjectFormData, setSubjectFormData] = useState({
    name: '',
    code: '',
    course: '',
    semester: 3,
    credits: 3,
    isLab: false
  });

  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [cRes, sRes, dRes] = await Promise.all([
        api.getCourses(),
        api.getSubjects(),
        api.getDepartments()
      ]);
      setCourses(cRes.data || []);
      setSubjects(sRes.data || []);
      setDepartments(dRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load curriculum data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenCreateCourse = () => {
    setIsEditingCourse(false);
    setCourseFormData({
      name: '',
      code: '',
      department: departments[0]?._id || '',
      degreeType: 'B.Tech',
      durationSemesters: 8,
      totalCredits: 160
    });
    setModalError('');
    setIsCourseModalOpen(true);
  };

  const handleOpenEditCourse = (course) => {
    setIsEditingCourse(true);
    setSelectedCourse(course);
    setCourseFormData({
      name: course.name,
      code: course.code,
      department: course.department?._id || course.department,
      degreeType: course.degreeType || 'B.Tech',
      durationSemesters: course.durationSemesters || 8,
      totalCredits: course.totalCredits || 160
    });
    setModalError('');
    setIsCourseModalOpen(true);
  };

  const handleCourseSubmit = async (e) => {
    e.preventDefault();
    if (!courseFormData.name || !courseFormData.code || !courseFormData.department) {
      setModalError('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    setModalError('');
    try {
      if (isEditingCourse && selectedCourse) {
        await api.updateCourse(selectedCourse._id, courseFormData);
        addToast('Degree program updated successfully', 'success');
      } else {
        await api.createCourse(courseFormData);
        addToast('Degree program created successfully', 'success');
      }
      setIsCourseModalOpen(false);
      fetchData();
    } catch (err) {
      setModalError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenCreateSubject = () => {
    setIsEditingSubject(false);
    setSelectedSubject(null);
    setSubjectFormData({
      name: '',
      code: '',
      course: courses[0]?._id || '',
      semester: 1,
      credits: 3,
      isLab: false
    });
    setModalError('');
    setIsSubjectModalOpen(true);
  };

  const handleOpenEditSubject = (sub) => {
    setIsEditingSubject(true);
    setSelectedSubject(sub);
    setSubjectFormData({
      name: sub.name || '',
      code: sub.code || '',
      course: sub.course?._id || sub.course || courses[0]?._id || '',
      semester: sub.semester || 1,
      credits: sub.credits || 3,
      isLab: !!sub.isLab
    });
    setModalError('');
    setIsSubjectModalOpen(true);
  };

  const handleConfirmDeleteSubject = (sub) => {
    setSubjectToDelete(sub);
    setIsDeleteSubjectModalOpen(true);
  };

  const handleDeleteSubject = async () => {
    if (!subjectToDelete) return;
    setSubmitting(true);
    try {
      await api.deleteSubject(subjectToDelete._id);
      addToast('Subject deleted successfully', 'success');
      setIsDeleteSubjectModalOpen(false);
      setSubjectToDelete(null);
      fetchData();
    } catch (err) {
      addToast(err.message || 'Failed to delete subject', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubjectSubmit = async (e) => {
    e.preventDefault();
    if (!subjectFormData.name || !subjectFormData.code || !subjectFormData.course) {
      setModalError('Subject Title, Code, and Degree Program are required');
      return;
    }
    setSubmitting(true);
    setModalError('');
    try {
      const payload = {
        ...subjectFormData,
        semester: Number(subjectFormData.semester),
        credits: Number(subjectFormData.credits)
      };
      if (isEditingSubject && selectedSubject) {
        await api.updateSubject(selectedSubject._id, payload);
        addToast('Subject updated successfully', 'success');
      } else {
        await api.createSubject(payload);
        addToast('Subject added to curriculum successfully', 'success');
      }
      setIsSubjectModalOpen(false);
      fetchData();
    } catch (err) {
      setModalError(err.message || 'Failed to save subject');
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchiveCourse = async (courseId) => {
    try {
      await api.deleteCourse(courseId);
      addToast('Program archived successfully', 'success');
      fetchData();
    } catch (err) {
      addToast(err.message || 'Failed to archive program', 'error');
    }
  };

  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.department?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = !selectedDeptFilter || c.department?._id === selectedDeptFilter;
    return matchesSearch && matchesDept;
  });

  const filteredSubjects = subjects.filter((s) => {
    const matchesSearch =
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-950 tracking-tight flex items-center gap-2.5">
            <GraduationCap className="w-7 h-7 text-teal-600" />
            Programs & Curriculum Courses
          </h1>
          <p className="text-sm text-navy-600">
            Institutional degree programs, academic credit frameworks, and semester syllabus subjects.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading} className="flex items-center gap-1.5">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {isPrivileged && (
            <Button
              variant="primary"
              size="sm"
              onClick={activeTab === 'courses' ? handleOpenCreateCourse : handleOpenCreateSubject}
              className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700"
            >
              <Plus className="w-4 h-4" />
              {activeTab === 'courses' ? 'Add Degree Program' : 'Add Subject'}
            </Button>
          )}
        </div>
      </div>

      {error && <Notification type="error" message={error} onClose={() => setError('')} />}

      {/* Tabs */}
      <div className="flex border-b border-navy-200 gap-6">
        <button
          onClick={() => setActiveTab('courses')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'courses'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-navy-500 hover:text-navy-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          Degree Programs ({courses.length})
        </button>
        <button
          onClick={() => setActiveTab('subjects')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'subjects'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-navy-500 hover:text-navy-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Curriculum Subjects ({subjects.length})
        </button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 border-navy-100">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-navy-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={activeTab === 'courses' ? 'Search program or code...' : 'Search subject name or code...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          {activeTab === 'courses' && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-xs font-semibold text-navy-600 uppercase">Department:</label>
              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="text-sm border border-navy-200 rounded-lg px-3 py-2 bg-white text-navy-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.code} - {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </Card>

      {/* Content Rendering */}
      {isLoading ? (
        <div className="py-16 text-center">
          <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-2" />
          <p className="text-sm text-navy-500">Loading curriculum records...</p>
        </div>
      ) : activeTab === 'courses' ? (
        filteredCourses.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-navy-200">
            <GraduationCap className="w-12 h-12 text-navy-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-navy-900">No Degree Programs Found</h3>
            <p className="text-sm text-navy-500 max-w-sm mx-auto mt-1">
              Create and manage degree qualifications such as B.Tech CSE or B.Tech ECE.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCourses.map((course) => (
              <Card key={course._id} className="p-5 flex flex-col justify-between hover:shadow-elevation transition-all border border-navy-100">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 text-xs font-mono font-bold bg-teal-50 text-teal-800 rounded-md border border-teal-100">
                      {course.code}
                    </span>
                    <Badge variant={course.isActive !== false ? 'success' : 'neutral'}>
                      {course.degreeType || 'B.Tech'}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-navy-950 line-clamp-2">{course.name}</h3>
                    <p className="text-xs text-navy-500 mt-1">
                      Department: <span className="font-semibold text-navy-700">{course.department?.name || 'Assigned'}</span>
                    </p>
                  </div>
                  <div className="pt-2 border-t border-navy-100/60 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-navy-50/70 p-2 rounded-lg">
                      <span className="text-navy-400 block text-[10px] uppercase font-bold">Duration</span>
                      <span className="font-bold text-navy-900">{course.durationSemesters || 8} Semesters</span>
                    </div>
                    <div className="bg-navy-50/70 p-2 rounded-lg">
                      <span className="text-navy-400 block text-[10px] uppercase font-bold">Total Credits</span>
                      <span className="font-bold text-teal-800">{course.totalCredits || 160} Credits</span>
                    </div>
                  </div>
                </div>

                {isPrivileged && (
                  <div className="flex items-center justify-end gap-1.5 pt-4 mt-2 border-t border-navy-100">
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => handleOpenEditCourse(course)}
                      className="text-teal-700 hover:text-teal-900"
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => handleArchiveCourse(course._id)}
                      className="text-rose-600 hover:text-rose-800"
                    >
                      <Archive className="w-3.5 h-3.5 mr-1" />
                      Archive
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )
      ) : (
        /* Subjects Catalog Table */
        <Card className="overflow-hidden border-navy-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-navy-50/80 border-b border-navy-200 text-xs font-bold text-navy-700 uppercase">
                  <th className="py-3 px-4">Subject Code</th>
                  <th className="py-3 px-4">Subject Title</th>
                  <th className="py-3 px-4">Program / Course</th>
                  <th className="py-3 px-4">Semester</th>
                  <th className="py-3 px-4">Credits</th>
                  <th className="py-3 px-4">Type</th>
                  {isPrivileged && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {filteredSubjects.length === 0 ? (
                  <tr>
                    <td colSpan={isPrivileged ? "7" : "6"} className="py-8 text-center text-navy-500 text-xs">
                      No curriculum subjects found. Add subjects using the button above.
                    </td>
                  </tr>
                ) : (
                  filteredSubjects.map((sub) => (
                    <tr key={sub._id} className="hover:bg-navy-50/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-teal-800">{sub.code}</td>
                      <td className="py-3 px-4 font-semibold text-navy-950">{sub.name}</td>
                      <td className="py-3 px-4 text-navy-600 text-xs">{sub.course?.name || sub.course?.code || 'Degree Course'}</td>
                      <td className="py-3 px-4 text-navy-800 font-medium">Semester {sub.semester}</td>
                      <td className="py-3 px-4 font-bold text-navy-900">{sub.credits} Credits</td>
                      <td className="py-3 px-4">
                        <Badge variant={sub.isLab ? 'warning' : 'primary'}>
                          {sub.isLab ? 'Lab Practical' : 'Theory'}
                        </Badge>
                      </td>
                      {isPrivileged && (
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditSubject(sub)}
                              className="px-2.5 py-1 text-xs font-medium text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 rounded-md transition-colors inline-flex items-center"
                              title="Edit Subject"
                            >
                              <Edit2 className="w-3.5 h-3.5 mr-1" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleConfirmDeleteSubject(sub)}
                              className="px-2.5 py-1 text-xs font-medium text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors inline-flex items-center"
                              title="Delete Subject"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" />
                              Delete
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create / Edit Course Modal */}
      <Modal
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        title={isEditingCourse ? 'Edit Degree Program' : 'Add Degree Program'}
      >
        <form onSubmit={handleCourseSubmit} className="space-y-4">
          {modalError && <Notification type="error" message={modalError} onClose={() => setModalError('')} />}
          <Input
            label="Degree Program Name *"
            placeholder="e.g. Bachelor of Technology in Civil Engineering"
            value={courseFormData.name}
            onChange={(e) => setCourseFormData({ ...courseFormData, name: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Course Code *"
              placeholder="e.g. BTECH-CE"
              value={courseFormData.code}
              onChange={(e) => setCourseFormData({ ...courseFormData, code: e.target.value.toUpperCase() })}
              required
            />
            <div>
              <label className="block text-xs font-semibold text-navy-800 uppercase tracking-wider mb-1">
                Degree Type *
              </label>
              <select
                value={courseFormData.degreeType}
                onChange={(e) => setCourseFormData({ ...courseFormData, degreeType: e.target.value })}
                className="w-full text-sm border border-navy-200 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="B.Tech">B.Tech</option>
                <option value="M.Tech">M.Tech</option>
                <option value="B.Arch">B.Arch</option>
                <option value="Ph.D">Ph.D</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-navy-800 uppercase tracking-wider mb-1">
              Academic Department *
            </label>
            <select
              value={courseFormData.department}
              onChange={(e) => setCourseFormData({ ...courseFormData, department: e.target.value })}
              className="w-full text-sm border border-navy-200 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 bg-white"
              required
            >
              <option value="">-- Select Department --</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Duration (Semesters) *"
              type="number"
              min="1"
              max="10"
              value={courseFormData.durationSemesters}
              onChange={(e) => setCourseFormData({ ...courseFormData, durationSemesters: e.target.value })}
              required
            />
            <Input
              label="Total Credits Required *"
              type="number"
              min="20"
              max="300"
              value={courseFormData.totalCredits}
              onChange={(e) => setCourseFormData({ ...courseFormData, totalCredits: e.target.value })}
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="ghost" type="button" onClick={() => setIsCourseModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting} className="bg-teal-600">
              {submitting ? 'Saving...' : isEditingCourse ? 'Update Program' : 'Create Program'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add / Edit Subject Modal */}
      <Modal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        title={isEditingSubject ? 'Edit Curriculum Subject' : 'Add Curriculum Subject'}
      >
        <form onSubmit={handleSubjectSubmit} className="space-y-4">
          {modalError && <Notification type="error" message={modalError} onClose={() => setModalError('')} />}
          <Input
            label="Subject Title *"
            placeholder="e.g. Operating Systems"
            value={subjectFormData.name}
            onChange={(e) => setSubjectFormData({ ...subjectFormData, name: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Subject Code *"
              placeholder="e.g. CS401"
              value={subjectFormData.code}
              onChange={(e) => setSubjectFormData({ ...subjectFormData, code: e.target.value.toUpperCase() })}
              required
            />
            <div>
              <label className="block text-xs font-semibold text-navy-800 uppercase tracking-wider mb-1">
                Semester (1-8) *
              </label>
              <input
                type="number"
                min="1"
                max="8"
                value={subjectFormData.semester}
                onChange={(e) => setSubjectFormData({ ...subjectFormData, semester: e.target.value })}
                className="w-full text-sm border border-navy-200 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-navy-800 uppercase tracking-wider mb-1">
              Degree Program *
            </label>
            <select
              value={subjectFormData.course}
              onChange={(e) => setSubjectFormData({ ...subjectFormData, course: e.target.value })}
              className="w-full text-sm border border-navy-200 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 bg-white"
              required
            >
              <option value="">-- Select Degree Course --</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3 items-center">
            <Input
              label="Credits *"
              type="number"
              min="1"
              max="6"
              value={subjectFormData.credits}
              onChange={(e) => setSubjectFormData({ ...subjectFormData, credits: e.target.value })}
              required
            />
            <div className="pt-5 flex items-center gap-2">
              <input
                type="checkbox"
                id="isLabCheck"
                checked={subjectFormData.isLab}
                onChange={(e) => setSubjectFormData({ ...subjectFormData, isLab: e.target.checked })}
                className="h-4 w-4 rounded border-navy-300 text-teal-600 focus:ring-teal-500"
              />
              <label htmlFor="isLabCheck" className="text-sm font-medium text-navy-800">
                Practical / Lab Subject
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="ghost" type="button" onClick={() => setIsSubjectModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting} className="bg-teal-600">
              {submitting ? 'Saving...' : isEditingSubject ? 'Update Subject' : 'Add to Curriculum'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Subject Confirmation Modal */}
      <Modal
        isOpen={isDeleteSubjectModalOpen}
        onClose={() => {
          setIsDeleteSubjectModalOpen(false);
          setSubjectToDelete(null);
        }}
        title="Delete Subject Confirmation"
      >
        <div className="space-y-4">
          <p className="text-sm text-navy-700">
            Are you sure you want to permanently delete curriculum subject{' '}
            <strong className="text-navy-950 font-bold">
              {subjectToDelete?.code} - {subjectToDelete?.name}
            </strong>
            ? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                setIsDeleteSubjectModalOpen(false);
                setSubjectToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDeleteSubject}
              disabled={submitting}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {submitting ? 'Deleting...' : 'Delete Subject'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CoursesPage;

