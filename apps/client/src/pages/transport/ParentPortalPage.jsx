import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users,
  Bus,
  Clock,
  CheckCircle,
  AlertTriangle,
  Receipt,
  MessageSquare,
  RefreshCw,
  CreditCard,
  UserCheck,
  GraduationCap,
  CalendarCheck,
  Megaphone,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  FileText
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
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

  // Student 360 data for the active child
  const [child360, setChild360] = useState(null);
  const [loading360, setLoading360] = useState(false);

  const loadParentData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Try formal parent-student linkage endpoint
      let linkedList = [];
      try {
        const linkRes = await api.getParentLinkedChildren();
        if (linkRes && linkRes.success && Array.isArray(linkRes.data)) {
          linkedList = linkRes.data;
        }
      } catch {
        // Fallback to transport portal heuristic if link not yet migrated
      }

      if (linkedList.length === 0) {
        try {
          const transportRes = await api.getParentTransportPortal();
          if (transportRes && Array.isArray(transportRes.children)) {
            linkedList = transportRes.children.map((c) => ({
              studentId: c.studentId || c._id,
              name: c.studentName,
              rollNumber: c.rollNumber,
              department: c.department,
              relationship: 'Guardian'
            }));
          }
        } catch {
          // non-fatal
        }
      }

      setChildren(linkedList);

      // Load 360 profile for active child if available
      if (linkedList.length > 0) {
        const target = linkedList[selectedChildIndex] || linkedList[0];
        if (target && target.studentId) {
          fetchChild360(target.studentId);
        }
      }
    } catch (err) {
      addToast(err.message || 'Failed to load parent portal data', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, selectedChildIndex]);

  const fetchChild360 = async (studentId) => {
    try {
      setLoading360(true);
      const res = await api.getStudent360(studentId);
      if (res && res.success && res.data) {
        setChild360(res.data);
      }
    } catch (err) {
      // If 403 or unavailable, keep child360 null to show clear configuration status
      setChild360(null);
    } finally {
      setLoading360(false);
    }
  };

  useEffect(() => {
    loadParentData();
  }, [loadParentData]);

  const handleChildSelect = (idx) => {
    setSelectedChildIndex(idx);
    const child = children[idx];
    if (child && child.studentId) {
      fetchChild360(child.studentId);
    }
  };

  const currentChild = children[selectedChildIndex] || null;

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
              Supervise your verified ward's daily transit radar, academic attendance, examination grades, and institutional fee ledgers.
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
      {currentChild ? (
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-lg shadow-2xs">
              {currentChild.name?.charAt(0) || 'S'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">{currentChild.name}</h2>
                <Badge variant="teal" size="sm">Verified Ward</Badge>
                {currentChild.relationship && (
                  <span className="text-[11px] text-slate-400 font-medium">({currentChild.relationship})</span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Roll Number: <span className="font-mono font-semibold text-emerald-900">{currentChild.rollNumber}</span> &bull; {currentChild.department || 'Department'}
              </p>
            </div>
          </div>

          {children.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold">Switch Ward:</span>
              {children.map((child, idx) => (
                <button
                  key={child.studentId || child.rollNumber || idx}
                  type="button"
                  onClick={() => handleChildSelect(idx)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    selectedChildIndex === idx
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {child.name}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-6 flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-blue-100 text-blue-800 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-blue-950">Parent-Student Linkage Status</h3>
            <p className="text-xs text-blue-800 leading-relaxed max-w-2xl">
              No student profile is currently linked to your guardian account. To view your child's live bus tracking, examination grades, and fee receipts, contact the College Administration or Registrar to register your verified guardian relationship.
            </p>
          </div>
        </div>
      )}

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
            {child360?.academics?.recentResults && child360.academics.recentResults.length > 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Semester Examination Results</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Verified grades for {currentChild?.name || 'Student'}.</p>
                  </div>
                  <Badge variant="teal" size="sm">
                    Average Score: {child360.academics.averageScore ?? 'N/A'}%
                  </Badge>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-800">
                    <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Subject</th>
                        <th className="py-3 px-4">Code</th>
                        <th className="py-3 px-4">Marks</th>
                        <th className="py-3 px-4">Grade</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {child360.academics.recentResults.map((res, i) => (
                        <tr key={res.id || i} className="hover:bg-slate-50/60">
                          <td className="py-3 px-4 font-medium">{res.subject || 'Course'}</td>
                          <td className="py-3 px-4 font-mono text-slate-500">{res.subjectCode || 'N/A'}</td>
                          <td className="py-3 px-4 font-bold text-emerald-800">{res.marks ?? 'N/A'}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{res.grade || 'N/A'}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              res.status === 'passed' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {res.status || 'Verified'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 mx-auto flex items-center justify-center">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-amber-950">Academic Records Standby</h4>
                <p className="text-xs text-amber-800 max-w-xl mx-auto leading-relaxed">
                  No published semester examination results are currently on file for this student, or the evaluation session is in progress.
                </p>
                {currentChild && (
                  <div className="text-[11px] text-amber-900 font-medium">
                    Verified Ward: <span className="font-bold">{currentChild.name} ({currentChild.rollNumber})</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Attendance Records */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            {child360?.attendance ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Classes</span>
                    <div className="text-xl font-black text-slate-900 mt-1">{child360.attendance.totalClasses || 0}</div>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Attended</span>
                    <div className="text-xl font-black text-emerald-700 mt-1">{child360.attendance.presentClasses || 0}</div>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Absent</span>
                    <div className="text-xl font-black text-rose-700 mt-1">{child360.attendance.absentClasses || 0}</div>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Attendance Rate</span>
                    <div className="text-xl font-black text-teal-800 mt-1">{child360.attendance.percentage}%</div>
                  </div>
                </div>

                {child360.attendance.subjectBreakdown && child360.attendance.subjectBreakdown.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                    <div className="p-4 border-b border-slate-100">
                      <h4 className="text-xs font-bold uppercase text-slate-600 tracking-wider">Subject-Wise Breakdown</h4>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {child360.attendance.subjectBreakdown.map((s, idx) => (
                        <div key={idx} className="p-4 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-900">{s.subjectName}</span>
                            <span className="text-slate-400 ml-2">({s.subjectCode})</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-slate-500">{s.present} / {s.total} Lectures</span>
                            <span className="font-bold text-emerald-800">{s.percentage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 mx-auto flex items-center justify-center">
                  <CalendarCheck className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-amber-950">Attendance Records Standby</h4>
                <p className="text-xs text-amber-800 max-w-xl mx-auto leading-relaxed">
                  Classroom biometric attendance logs are being compiled for this semester. Live bus boarding attendance is available under the <strong>Live Bus & Transit Tracking</strong> tab.
                </p>
                {currentChild && (
                  <div className="text-[11px] text-amber-900 font-medium">
                    Verified Ward: <span className="font-bold">{currentChild.name} ({currentChild.rollNumber})</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Fee Dues & Receipts */}
        {activeTab === 'fees' && (
          <div className="space-y-6">
            {child360?.finances ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Billed</span>
                    <div className="text-xl font-black text-slate-900 mt-1">₹{child360.finances.totalInvoiced?.toLocaleString() || 0}</div>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Paid</span>
                    <div className="text-xl font-black text-emerald-700 mt-1">₹{child360.finances.totalPaid?.toLocaleString() || 0}</div>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending Dues</span>
                    <div className="text-xl font-black text-amber-700 mt-1">₹{child360.finances.pendingBalance?.toLocaleString() || 0}</div>
                  </div>
                </div>

                {child360.finances.recentPayments && child360.finances.recentPayments.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                    <div className="p-4 border-b border-slate-100">
                      <h4 className="text-xs font-bold uppercase text-slate-600 tracking-wider">Payment Transaction History</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-800">
                        <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                          <tr>
                            <th className="py-3 px-4">Receipt #</th>
                            <th className="py-3 px-4">Date</th>
                            <th className="py-3 px-4">Method</th>
                            <th className="py-3 px-4">Amount</th>
                            <th className="py-3 px-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {child360.finances.recentPayments.map((p, idx) => (
                            <tr key={p.id || idx} className="hover:bg-slate-50/60">
                              <td className="py-3 px-4 font-mono font-bold text-slate-900">{p.receiptNumber}</td>
                              <td className="py-3 px-4 text-slate-500">{new Date(p.date).toLocaleDateString()}</td>
                              <td className="py-3 px-4">{p.method}</td>
                              <td className="py-3 px-4 font-bold text-emerald-800">₹{p.amount?.toLocaleString()}</td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                                  {p.status || 'Completed'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 mx-auto flex items-center justify-center">
                  <CreditCard className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-amber-950">Tuition Fee Ledger Standby</h4>
                <p className="text-xs text-amber-800 max-w-xl mx-auto leading-relaxed">
                  Fee invoices and transaction ledgers are updated following accounting reconciliation. Contact the Accounts Desk for fee statements.
                </p>
                {currentChild && (
                  <div className="text-[11px] text-amber-900 font-medium">
                    Verified Ward: <span className="font-bold">{currentChild.name} ({currentChild.rollNumber})</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Announcements & Broadcasts */}
        {activeTab === 'announcements' && <AnnouncementsManagementView />}
      </div>
    </div>
  );
};

export default ParentPortalPage;
