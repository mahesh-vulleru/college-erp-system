import React, { useState, useEffect, useCallback } from 'react';
import {
  Briefcase,
  Award,
  TrendingUp,
  Users,
  Building,
  Calendar,
  Search,
  Plus,
  ExternalLink,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Check,
  X
} from 'lucide-react';
import DashboardHeaderBanner from '../../components/dashboard/DashboardHeaderBanner';
import DashboardKPICard from '../../components/dashboard/DashboardKPICard';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Table from '../../components/common/Table';
import EmptyState from '../../components/common/EmptyState';
import api from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ROLES } from '@college-erp/shared';

export const PlacementsPage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('drives'); // 'drives' | 'my-applications' | 'companies'
  const [drives, setDrives] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isPostDriveOpen, setIsPostDriveOpen] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [resumeUrl, setResumeUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Drive Form
  const [driveForm, setDriveForm] = useState({
    driveCode: '',
    company: '',
    jobTitle: '',
    jobDescription: '',
    ctc: { annualSalaryLpa: '', stipendMonthly: '' },
    eligibility: { minCgpa: 6.5, maxBacklogs: 0 },
    driveDate: '',
    registrationDeadline: '',
    status: 'registrations_open'
  });

  const isStudent = user?.role === ROLES.STUDENT;
  const canManage = [ROLES.SUPER_ADMIN, ROLES.PRINCIPAL].includes(user?.role);

  const fetchDrives = useCallback(async () => {
    setIsLoading(true);
    try {
      const [drivesRes, analyticsRes, companiesRes] = await Promise.all([
        api.getPlacementDrives(),
        api.getPlacementAnalytics(),
        api.getPlacementCompanies()
      ]);

      if (drivesRes?.data) setDrives(drivesRes.data);
      if (analyticsRes?.data) setAnalytics(analyticsRes.data.summary);
      if (companiesRes?.data) setCompanies(companiesRes.data);

      if (isStudent) {
        const myAppsRes = await api.getMyPlacementApplications();
        if (myAppsRes?.data) setMyApplications(myAppsRes.data);
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Error loading placement data',
        message: err.message || 'Could not connect to placement services'
      });
    } finally {
      setIsLoading(false);
    }
  }, [isStudent, addToast]);

  useEffect(() => {
    fetchDrives();
  }, [fetchDrives]);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!selectedDrive) return;

    setIsSubmitting(true);
    try {
      await api.applyToPlacementDrive(selectedDrive._id, { resumeUrl });
      addToast({
        type: 'success',
        title: 'Application Submitted',
        message: `Registered successfully for ${selectedDrive.company?.name || selectedDrive.jobTitle}`
      });
      setIsApplyModalOpen(false);
      setResumeUrl('');
      fetchDrives();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Application Rejected',
        message: err.message || 'You may not be eligible or registrations are closed'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateDrive = async (e) => {
    e.preventDefault();
    if (!driveForm.driveCode || !driveForm.company || !driveForm.jobTitle || !driveForm.ctc.annualSalaryLpa) {
      addToast({ type: 'warning', title: 'Missing Information', message: 'All mandatory fields must be filled' });
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createPlacementDrive({
        ...driveForm,
        ctc: {
          ...driveForm.ctc,
          annualSalaryLpa: Number(driveForm.ctc.annualSalaryLpa),
          stipendMonthly: Number(driveForm.ctc.stipendMonthly) || 0
        }
      });
      addToast({ type: 'success', title: 'Drive Published', message: 'Recruitment drive is now live' });
      setIsPostDriveOpen(false);
      setDriveForm({
        driveCode: '',
        company: '',
        jobTitle: '',
        jobDescription: '',
        ctc: { annualSalaryLpa: '', stipendMonthly: '' },
        eligibility: { minCgpa: 6.5, maxBacklogs: 0 },
        driveDate: '',
        registrationDeadline: '',
        status: 'registrations_open'
      });
      fetchDrives();
    } catch (err) {
      addToast({ type: 'error', title: 'Failed to Post Drive', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDrives = drives.filter(
    (d) =>
      d.company?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.driveCode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <DashboardHeaderBanner
        title="Training & Campus Placement Cell"
        subtitle="Corporate recruitment drives, campus eligibility screening, CTC analytics, and offer letter tracking."
        academicYear="2026 – 2027"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <DashboardKPICard
          title="Highest Annual Package"
          value={`₹${analytics?.highestPackageLpa || 44.5} LPA`}
          icon={Award}
          trend="New Campus Record"
          color="emerald"
        />
        <DashboardKPICard
          title="Average Package"
          value={`₹${analytics?.averagePackageLpa || 8.6} LPA`}
          icon={TrendingUp}
          trend="Graduating Cohort"
          color="blue"
        />
        <DashboardKPICard
          title="Total Placement Offers"
          value={`${analytics?.totalOffersGenerated || 0} Offers`}
          icon={Briefcase}
          trend={`${analytics?.totalApplicationsSubmitted || 0} applications registered`}
          color="purple"
        />
        <DashboardKPICard
          title="Active Drives Conducted"
          value={`${analytics?.totalDrivesConducted || drives.length} Drives`}
          icon={Building}
          trend="Tier 1 & Tier 2 Partners"
          color="emerald"
        />
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('drives')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'drives'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Active & Upcoming Drives ({filteredDrives.length})</span>
        </button>

        {isStudent && (
          <button
            onClick={() => setActiveTab('my-applications')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'my-applications'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>My Applications ({myApplications.length})</span>
          </button>
        )}
      </div>

      {/* TAB 1: Drives Catalog */}
      {activeTab === 'drives' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Corporate Campus Recruitment Drives</h3>
              <p className="text-xs text-slate-500">Graduating Batch 2026 – 2027</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search company or role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-48 sm:w-64"
                />
              </div>

              {canManage && (
                <button
                  onClick={() => setIsPostDriveOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Post Drive
                </button>
              )}
            </div>
          </div>

          {/* Drives Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Recruiting Company</th>
                  <th className="py-3 px-4">Role Title</th>
                  <th className="py-3 px-4">Offered Package</th>
                  <th className="py-3 px-4">Eligibility Criteria</th>
                  <th className="py-3 px-4">Drive Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      Loading placement drives from campus servers...
                    </td>
                  </tr>
                ) : filteredDrives.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-500">
                      No active recruitment drives found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredDrives.map((d) => (
                    <tr key={d._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-xs">
                          {d.company?.name ? d.company.name.charAt(0) : 'C'}
                        </span>
                        <div>
                          <span>{d.company?.name || 'Recruiter'}</span>
                          <span className="text-[10px] text-slate-400 block font-normal">{d.company?.tier || 'Tier 2'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{d.jobTitle}</td>
                      <td className="py-3 px-4 font-black text-emerald-700">₹{d.ctc?.annualSalaryLpa} LPA</td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        CGPA &ge; {d.eligibility?.minCgpa || 6.0} ({d.eligibility?.maxBacklogs || 0} backlogs max)
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-bold">
                        {d.driveDate ? new Date(d.driveDate).toLocaleDateString() : 'TBA'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            d.status === 'registrations_open'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {d.status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isStudent ? (
                          d.studentContext?.hasApplied ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                              <Check className="w-3.5 h-3.5" /> Applied
                            </span>
                          ) : (
                            <Button
                              variant="teal"
                              size="xs"
                              disabled={d.status !== 'registrations_open'}
                              onClick={() => {
                                setSelectedDrive(d);
                                setIsApplyModalOpen(true);
                              }}
                            >
                              Apply
                            </Button>
                          )
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Student My Applications */}
      {activeTab === 'my-applications' && isStudent && (
        <Card
          title="My Campus Placement Applications"
          subtitle="Real-time status tracking across interview rounds and corporate selections"
        >
          {myApplications.length === 0 ? (
            <EmptyState
              title="No Applications Submitted"
              message="You have not registered for any active placement drives yet. Browse the open drives tab to submit your application."
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {myApplications.map((app) => (
                <div key={app._id} className="py-3.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-sm text-slate-900 block">
                      {app.drive?.company?.name} — {app.drive?.jobTitle}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>Package: ₹{app.drive?.ctc?.annualSalaryLpa} LPA</span>
                      <span>•</span>
                      <span>Applied on: {new Date(app.appliedAt).toLocaleDateString()}</span>
                    </span>
                  </div>

                  <div>
                    <Badge
                      variant={
                        app.status === 'selected' || app.status === 'offer_accepted'
                          ? 'success'
                          : app.status === 'rejected'
                          ? 'danger'
                          : 'teal'
                      }
                      size="sm"
                      className="capitalize font-bold"
                    >
                      {app.status?.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Modal: Student 1-Click Apply */}
      {isApplyModalOpen && selectedDrive && (
        <Modal
          isOpen={isApplyModalOpen}
          onClose={() => setIsApplyModalOpen(false)}
          title={`Register for ${selectedDrive.company?.name || 'Recruitment Drive'}`}
          size="sm"
        >
          <form onSubmit={handleApply} className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <p className="font-bold text-slate-900">{selectedDrive.jobTitle}</p>
              <p className="text-emerald-700 font-bold">Package: ₹{selectedDrive.ctc?.annualSalaryLpa} LPA</p>
              <p className="text-slate-500">
                Minimum Eligibility: CGPA &ge; {selectedDrive.eligibility?.minCgpa}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Resume / Portfolio Link (Optional)
              </label>
              <Input
                id="resume-link"
                placeholder="https://drive.google.com/..."
                value={resumeUrl}
                onChange={(e) => setResumeUrl(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setIsApplyModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="teal" type="submit" isLoading={isSubmitting}>
                Confirm Application
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Post Placement Drive (Super Admin / Principal) */}
      {isPostDriveOpen && (
        <Modal
          isOpen={isPostDriveOpen}
          onClose={() => setIsPostDriveOpen(false)}
          title="Publish Campus Recruitment Drive"
          size="md"
        >
          <form onSubmit={handleCreateDrive} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Drive Code *</label>
                <Input
                  id="drive-code"
                  required
                  placeholder="e.g. DRV-2026-GOOG-01"
                  value={driveForm.driveCode}
                  onChange={(e) => setDriveForm({ ...driveForm, driveCode: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Recruiting Company *</label>
                <select
                  required
                  value={driveForm.company}
                  onChange={(e) => setDriveForm({ ...driveForm, company: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">Select Corporate Partner</option>
                  {companies.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.tier})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Role Title *</label>
                <Input
                  id="job-title"
                  required
                  placeholder="e.g. Software Engineer"
                  value={driveForm.jobTitle}
                  onChange={(e) => setDriveForm({ ...driveForm, jobTitle: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Annual CTC (LPA) *</label>
                <Input
                  id="ctc-lpa"
                  type="number"
                  step="0.1"
                  required
                  placeholder="e.g. 14.5"
                  value={driveForm.ctc.annualSalaryLpa}
                  onChange={(e) =>
                    setDriveForm({
                      ...driveForm,
                      ctc: { ...driveForm.ctc, annualSalaryLpa: e.target.value }
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Drive Date *</label>
                <Input
                  id="drive-date"
                  type="date"
                  required
                  value={driveForm.driveDate}
                  onChange={(e) => setDriveForm({ ...driveForm, driveDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Registration Deadline *</label>
                <Input
                  id="reg-deadline"
                  type="date"
                  required
                  value={driveForm.registrationDeadline}
                  onChange={(e) => setDriveForm({ ...driveForm, registrationDeadline: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setIsPostDriveOpen(false)}>
                Cancel
              </Button>
              <Button variant="teal" type="submit" isLoading={isSubmitting}>
                Publish Drive
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default PlacementsPage;
