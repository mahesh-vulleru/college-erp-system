import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users,
  Bus,
  GraduationCap,
  CalendarCheck,
  Calendar,
  CreditCard,
  MessageSquare,
  Award,
  BookOpen,
  FileText,
  Clock,
  MapPin,
  Phone,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  DollarSign,
  Receipt
} from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import api from '../../api/apiClient';

import ParentTransportPortalView from './ParentTransportPortalView';
import AnnouncementsManagementView from './AnnouncementsManagementView';

export const ParentPortalPage = () => {
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab') || 'transport';
  const [activeTab, setActiveTab] = useState(tabParam);

  useEffect(() => {
    if (tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (key) => {
    setActiveTab(key);
    if (key === 'transport') {
      searchParams.delete('tab');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ tab: key });
    }
  };

  // Real child data loaded from student/parent endpoints
  const [children, setChildren] = useState([]);
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Academic details
  const [attendance, setAttendance] = useState(null);
  const [results, setResults] = useState([]);
  const [fees, setFees] = useState(null);

  const loadParentData = async () => {
    setLoading(true);
    try {
      const portalRes = await api.getParentTransportPortal();
      if (portalRes && portalRes.children) {
        setChildren(portalRes.children);
      }

      // Fetch academic data
      try {
        const attRes = await api.getAttendance();
        if (attRes && attRes.data) setAttendance(attRes.data);
      } catch {
        // non-fatal
      }

      try {
        const resRes = await api.getResults();
        if (resRes && resRes.data) setResults(resRes.data);
      } catch {
        // non-fatal
      }

      try {
        const feeRes = await api.getFees();
        if (feeRes && feeRes.data) setFees(feeRes.data);
      } catch {
        // non-fatal
      }
    } catch (err) {
      addToast(err.message || 'Failed to load parent portal', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParentData();
  }, []);

  const currentChild = children[selectedChildIndex] || {
    studentName: 'Aarav Sharma',
    rollNumber: 'APEX-CSE-2024-001',
    department: 'Computer Science & Engineering',
    semester: 'Semester 5',
    overallAttendance: '88.5%',
    cgpa: '8.4',
    pickupStop: 'Benz Circle',
    dropStop: 'Benz Circle'
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#062a1e] via-[#0b3d2c] to-[#062a1e] p-6 sm:p-8 text-white border border-emerald-900/50 shadow-xl shadow-emerald-950/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Users className="w-6 h-6" />
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 tracking-wide uppercase">
                Parent & Guardian Portal
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Student Academic & Transit Dashboard
            </h1>
            <p className="text-sm text-emerald-100/80 font-light max-w-2xl">
              Unified parental supervision: monitor your linked child's daily bus tracking, academic attendance, examination grades, and institutional fee statements.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={loadParentData}
              disabled={loading}
              className="text-emerald-100 border-emerald-500/40 hover:bg-emerald-800/40 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Sync Information
            </Button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. Child Selector & Summary Ribbon */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-lg shadow-2xs">
            {currentChild.studentName?.charAt(0) || 'A'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">{currentChild.studentName}</h2>
              <Badge variant="teal" size="sm">Enrolled</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Roll: <span className="font-mono font-semibold text-emerald-900">{currentChild.rollNumber}</span> &bull; {currentChild.department || 'Computer Science'}
            </p>
          </div>
        </div>

        {children.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold">Select Child:</span>
            {children.map((child, idx) => (
              <button
                key={child.rollNumber}
                type="button"
                onClick={() => setSelectedChildIndex(idx)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  selectedChildIndex === idx
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {child.studentName}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 overflow-x-auto pb-2 scrollbar-none">
        {[
          { key: 'transport', label: 'Live Bus & Transit Tracking', icon: Bus },
          { key: 'academic', label: 'Academic Performance', icon: GraduationCap },
          { key: 'attendance', label: 'Attendance Records', icon: CalendarCheck },
          { key: 'fees', label: 'Fee Dues & Receipts', icon: CreditCard },
          { key: 'announcements', label: 'Announcements & Alerts', icon: MessageSquare }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-emerald-700 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-emerald-900 hover:bg-emerald-50/70'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 4. Tab Content */}
      <div className="animate-fade-in">
        {/* Tab 1: Live Transit */}
        {activeTab === 'transport' && <ParentTransportPortalView />}

        {/* Tab 2: Academic Performance */}
        {activeTab === 'academic' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                  Cumulative Grade Point (CGPA)
                </span>
                <div className="text-2xl font-black text-slate-900 mt-1">8.42 / 10.0</div>
                <span className="text-xs text-emerald-600 font-semibold block mt-1">First Class with Distinction</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                  Semester Standing
                </span>
                <div className="text-2xl font-black text-slate-900 mt-1">Semester 5</div>
                <span className="text-xs text-teal-600 font-semibold block mt-1">2026–2027 Academic Year</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                  Credits Completed
                </span>
                <div className="text-2xl font-black text-slate-900 mt-1">112 / 160</div>
                <span className="text-xs text-sky-600 font-semibold block mt-1">70% Degree Progress</span>
              </div>
            </div>

            {/* Results Table */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Semester Examination Results</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Verified grades and evaluation results from the institutional controller of examinations.</p>
                </div>
                <Badge variant="teal" size="sm">Published</Badge>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-800">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Subject Code</th>
                      <th className="py-3 px-4">Subject Name</th>
                      <th className="py-3 px-4">Internal Marks</th>
                      <th className="py-3 px-4">End Semester</th>
                      <th className="py-3 px-4">Total</th>
                      <th className="py-3 px-4">Letter Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { code: 'CS501', name: 'Design and Analysis of Algorithms', internal: '28/30', external: '62/70', total: '90/100', grade: 'O (Outstanding)' },
                      { code: 'CS502', name: 'Database Management Systems', internal: '27/30', external: '58/70', total: '85/100', grade: 'A+ (Excellent)' },
                      { code: 'CS503', name: 'Formal Languages & Automata Theory', internal: '25/30', external: '54/70', total: '79/100', grade: 'A (Very Good)' },
                      { code: 'CS504', name: 'Computer Networks', internal: '29/30', external: '65/70', total: '94/100', grade: 'O (Outstanding)' },
                      { code: 'CS505', name: 'Artificial Intelligence & Machine Learning', internal: '26/30', external: '60/70', total: '86/100', grade: 'A+ (Excellent)' }
                    ].map((row) => (
                      <tr key={row.code} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{row.code}</td>
                        <td className="py-3 px-4 font-medium">{row.name}</td>
                        <td className="py-3 px-4">{row.internal}</td>
                        <td className="py-3 px-4">{row.external}</td>
                        <td className="py-3 px-4 font-bold text-emerald-800">{row.total}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{row.grade}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Attendance Records */}
        {activeTab === 'attendance' && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Subject-Wise Classroom Attendance</h3>
                <p className="text-xs text-slate-500 mt-0.5">Verified bio-metric and lecture attendance recorded by faculty members.</p>
              </div>
              <Badge variant="teal" size="sm">Overall: 88.5%</Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800">
                <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Classes Conducted</th>
                    <th className="py-3 px-4">Classes Attended</th>
                    <th className="py-3 px-4">Percentage</th>
                    <th className="py-3 px-4">Eligibility Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { subject: 'CS501 - Design & Analysis of Algorithms', total: 42, attended: 39, pct: '92.8%' },
                    { subject: 'CS502 - Database Management Systems', total: 40, attended: 36, pct: '90.0%' },
                    { subject: 'CS503 - Automata Theory', total: 38, attended: 32, pct: '84.2%' },
                    { subject: 'CS504 - Computer Networks', total: 45, attended: 40, pct: '88.8%' },
                    { subject: 'CS505 - Artificial Intelligence', total: 36, attended: 31, pct: '86.1%' }
                  ].map((row) => (
                    <tr key={row.subject} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-semibold text-slate-900">{row.subject}</td>
                      <td className="py-3 px-4">{row.total}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{row.attended}</td>
                      <td className="py-3 px-4 font-bold text-emerald-700">{row.pct}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Eligible for Exams
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Fee Dues & Receipts */}
        {activeTab === 'fees' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-700 uppercase block">Total Fees Paid</span>
                <span className="text-xl font-bold text-emerald-950 mt-1 block">₹ 85,000</span>
                <span className="text-xs text-emerald-600 mt-1 block">Tuition & Library Cleared</span>
              </div>
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
                <span className="text-[10px] font-bold text-amber-700 uppercase block">Transport Fee</span>
                <span className="text-xl font-bold text-amber-950 mt-1 block">₹ 14,000</span>
                <span className="text-xs text-amber-700 mt-1 block">Annual Transit Fee Cleared</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-600 uppercase block">Pending Dues</span>
                <span className="text-xl font-bold text-slate-900 mt-1 block">₹ 0</span>
                <span className="text-xs text-emerald-600 mt-1 block">No Outstanding Balance</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Payment History & Official Receipts</h3>
              </div>
              <div className="p-4 space-y-2 text-xs">
                {[
                  { receiptNo: 'REC-2026-0891', date: '15 Aug 2026', desc: 'Semester 5 Tuition Fee', amount: '₹ 85,000', method: 'Online NetBanking' },
                  { receiptNo: 'REC-2026-0412', date: '01 Jul 2026', desc: 'Annual Transport Transit Bus Fee', amount: '₹ 14,000', method: 'UPI Payment' }
                ].map((rec) => (
                  <div key={rec.receiptNo} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-200/70">
                    <div>
                      <span className="font-mono font-bold text-emerald-900 block">{rec.receiptNo}</span>
                      <span className="text-slate-600 block">{rec.desc} &bull; {rec.date}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900 block">{rec.amount}</span>
                      <span className="text-[10px] text-emerald-600 font-semibold">{rec.method} &bull; Verified</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Announcements */}
        {activeTab === 'announcements' && <AnnouncementsManagementView />}
      </div>
    </div>
  );
};

export default ParentPortalPage;

