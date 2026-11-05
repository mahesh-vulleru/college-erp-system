import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  CalendarCheck,
  CreditCard,
  BookOpen,
  Bus,
  FileText,
  AlertTriangle,
  CheckCircle2,
  X,
  Clock,
  ShieldCheck,
  Award,
  DollarSign
} from 'lucide-react';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import Button from '../common/Button';
import api from '../../api/apiClient';

export default function Student360Modal({ isOpen, onClose, studentId, isSelf = false }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!isOpen) {
      setData(null);
      setError('');
      return;
    }

    const fetch360 = async () => {
      setIsLoading(true);
      setError('');
      try {
        const res = isSelf || !studentId
          ? await api.getMyStudent360()
          : await api.getStudent360(studentId);
        setData(res?.data || null);
      } catch (err) {
        setError(err.message || 'Failed to load Student 360 profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetch360();
  }, [isOpen, studentId, isSelf]);

  if (!isOpen) return null;

  const student = data?.student;
  const metrics = data?.metrics || {};

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" title="Student 360° Comprehensive Profile">
      <div className="space-y-5">
        {isLoading && (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-navy-500 font-medium">Aggregating academic, attendance, fee, and transit records...</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Access Notice</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {!isLoading && !error && data && (
          <>
            {/* Header Identity Card */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-navy-900 to-navy-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-bold">{student?.user?.name || student?.name || 'Student Name'}</h3>
                  <Badge variant={metrics.overallStanding === 'Good' ? 'emerald' : 'amber'} size="xs">
                    {metrics.overallStanding} Standing
                  </Badge>
                </div>
                <p className="text-xs text-navy-200 font-mono mt-0.5">
                  Roll: {student?.rollNumber} • Enrollment: {student?.enrollmentNumber || 'N/A'}
                </p>
                <p className="text-xs text-navy-300 mt-1">
                  {student?.department?.name || 'General Studies'} • Semester {student?.currentSemester || 1} • Batch {student?.batchYear || '2024-2028'}
                </p>
              </div>

              <div className="flex items-center space-x-4 bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                <div className="text-center">
                  <div className="text-xs text-navy-200 uppercase font-semibold">Attendance</div>
                  <div className={`text-base font-bold font-mono ${metrics.attendanceRate >= 75 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {metrics.attendanceRate}%
                  </div>
                </div>
                <div className="w-px h-8 bg-white/20" />
                <div className="text-center">
                  <div className="text-xs text-navy-200 uppercase font-semibold">CGPA</div>
                  <div className="text-base font-bold font-mono text-cyan-300">
                    {metrics.cgpa ? `${metrics.cgpa} / 10` : 'In Progress'}
                  </div>
                </div>
                <div className="w-px h-8 bg-white/20" />
                <div className="text-center">
                  <div className="text-xs text-navy-200 uppercase font-semibold">Fee Balance</div>
                  <div className={`text-base font-bold font-mono ${metrics.feeBalance > 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
                    ₹{Number(metrics.feeBalance || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-navy-200 flex space-x-4">
              <button
                onClick={() => setActiveTab('overview')}
                className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                  activeTab === 'overview' ? 'border-teal-600 text-teal-700' : 'border-transparent text-navy-500 hover:text-navy-900'
                }`}
              >
                360° Summary
              </button>
              <button
                onClick={() => setActiveTab('academics')}
                className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                  activeTab === 'academics' ? 'border-teal-600 text-teal-700' : 'border-transparent text-navy-500 hover:text-navy-900'
                }`}
              >
                Academics & Attendance
              </button>
              <button
                onClick={() => setActiveTab('finance')}
                className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                  activeTab === 'finance' ? 'border-teal-600 text-teal-700' : 'border-transparent text-navy-500 hover:text-navy-900'
                }`}
              >
                Finances & Library
              </button>
              <button
                onClick={() => setActiveTab('transit')}
                className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                  activeTab === 'transit' ? 'border-teal-600 text-teal-700' : 'border-transparent text-navy-500 hover:text-navy-900'
                }`}
              >
                Transport & Docs
              </button>
            </div>

            {/* Tab: Overview */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center space-x-2 text-teal-700 font-semibold text-xs mb-1">
                    <CalendarCheck className="w-4 h-4" />
                    <span>Attendance Standing</span>
                  </div>
                  <div className="text-xl font-bold font-mono text-navy-900">{metrics.attendanceRate}%</div>
                  <p className="text-[11px] text-navy-500 mt-0.5">
                    {metrics.presentClasses || 0} attended / {metrics.totalClasses || 0} classes
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center space-x-2 text-indigo-700 font-semibold text-xs mb-1">
                    <CreditCard className="w-4 h-4" />
                    <span>Fee Balance</span>
                  </div>
                  <div className="text-xl font-bold font-mono text-navy-900">
                    ₹{Number(metrics.feeBalance || 0).toLocaleString('en-IN')}
                  </div>
                  <p className="text-[11px] text-navy-500 mt-0.5">
                    {metrics.pendingFeeInvoices || 0} pending invoice(s)
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center space-x-2 text-amber-700 font-semibold text-xs mb-1">
                    <BookOpen className="w-4 h-4" />
                    <span>Library Loans</span>
                  </div>
                  <div className="text-xl font-bold font-mono text-navy-900">{metrics.activeBookIssues || 0}</div>
                  <p className="text-[11px] text-navy-500 mt-0.5">
                    Dues: ₹{Number(metrics.totalLibraryFines || 0).toLocaleString('en-IN')}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center space-x-2 text-cyan-700 font-semibold text-xs mb-1">
                    <Bus className="w-4 h-4" />
                    <span>Transport Pass</span>
                  </div>
                  <div className="text-sm font-bold text-navy-900 mt-1">
                    {metrics.transportAllocated ? (
                      <span className="text-emerald-700">Allocated</span>
                    ) : (
                      <span className="text-navy-400">Not Subscribed</span>
                    )}
                  </div>
                  <p className="text-[11px] text-navy-500 mt-0.5">
                    {metrics.busRoute ? `${metrics.busRoute}` : 'Day Scholar'}
                  </p>
                </div>
              </div>
            )}

            {/* Tab: Academics */}
            {activeTab === 'academics' && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-navy-600">Recent Exam Results</h4>
                {(!data.results || data.results.length === 0) ? (
                  <p className="text-xs text-navy-500 italic p-3 bg-slate-50 rounded-xl">No published exam results available for this semester cycle.</p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                    {data.results.map((res, i) => (
                      <div key={i} className="p-2.5 flex items-center justify-between bg-white hover:bg-slate-50">
                        <div>
                          <span className="font-semibold text-navy-900">{res.subject?.name || res.subject?.code || 'Course Subject'}</span>
                          <span className="text-[11px] text-navy-500 ml-2 font-mono">({res.examination?.name || 'Semester End'})</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="font-mono font-bold text-navy-800">{res.marksObtained} / {res.maxMarks}</span>
                          <Badge variant={res.grade === 'F' ? 'rose' : 'emerald'} size="xs">{res.grade}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Finance */}
            {activeTab === 'finance' && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-navy-600">Pending Invoices & Collections</h4>
                {(!data.invoices || data.invoices.length === 0) ? (
                  <p className="text-xs text-navy-500 italic p-3 bg-slate-50 rounded-xl">All institutional tuition and hostel dues are cleared.</p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                    {data.invoices.map((inv, i) => (
                      <div key={i} className="p-2.5 flex items-center justify-between bg-white hover:bg-slate-50">
                        <div>
                          <p className="font-semibold text-navy-900">{inv.title || `Invoice #${inv.invoiceNumber}`}</p>
                          <p className="text-[11px] text-navy-500 font-mono">Due: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-bold text-navy-900">₹{Number(inv.amountDue || 0).toLocaleString('en-IN')}</p>
                          <Badge variant={inv.status === 'paid' ? 'emerald' : 'rose'} size="xs">{inv.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Transit & Docs */}
            {activeTab === 'transit' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="font-bold text-navy-900 flex items-center">
                    <Bus className="w-4 h-4 mr-1.5 text-cyan-600" />
                    Transport Allocation
                  </h4>
                  <div className="space-y-1 text-navy-700">
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-navy-500">Route Assigned</span>
                      <span className="font-semibold">{metrics.busRoute || 'None'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-navy-500">Boarding Stop</span>
                      <span className="font-semibold">{metrics.pickupStop || 'None'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-navy-500">Pass Status</span>
                      <Badge variant={metrics.transportAllocated ? 'emerald' : 'slate'} size="xs">
                        {metrics.transportAllocated ? 'Active' : 'Unsubscribed'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="font-bold text-navy-900 flex items-center">
                    <FileText className="w-4 h-4 mr-1.5 text-indigo-600" />
                    Verified Records & Files
                  </h4>
                  <p className="text-navy-600">
                    <span className="font-bold text-navy-900">{metrics.documentsCount || 0}</span> official documents archived in College ERP secure storage.
                  </p>
                  <p className="text-[11px] text-navy-500">
                    Admission letter, ID card proof, and marksheets are tamper-proof and signed.
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        <div className="pt-3 border-t border-navy-100 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close Profile
          </Button>
        </div>
      </div>
    </Modal>
  );
}

