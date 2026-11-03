import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Activity,
  Bus,
  Clock,
  Calendar,
  Radio,
  UserCheck,
  Users,
  Wrench,
  ShieldAlert,
  MessageSquare,
  Megaphone,
  RefreshCw,
  TrendingUp,
  MapPin,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import api from '../../api/apiClient';

import SupervisorDashboardView from './SupervisorDashboardView';
import TripManagementView from './TripManagementView';
import DailyScheduleView from './DailyScheduleView';
import StudentAttendanceView from './StudentAttendanceView';
import LiveGpsTrackingView from './LiveGpsTrackingView';
import MaintenanceManagementView from './MaintenanceManagementView';
import SafetyManagementView from './SafetyManagementView';
import ComplaintsManagementView from './ComplaintsManagementView';
import AnnouncementsManagementView from './AnnouncementsManagementView';

export const TransportSupervisorPage = () => {
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(tabParam);

  useEffect(() => {
    if (tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (key) => {
    setActiveTab(key);
    if (key === 'overview') {
      searchParams.delete('tab');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ tab: key });
    }
  };

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchSupervisorStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getSupervisorDashboardSummary();
      if (res && res.data) {
        setSummary(res.data);
      }
    } catch (err) {
      addToast('Failed to load supervisor summary', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchSupervisorStats();
  }, [fetchSupervisorStats]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Dark Forest-Green Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#062a1e] via-[#0b3d2c] to-[#062a1e] p-6 sm:p-8 text-white border border-emerald-900/50 shadow-xl shadow-emerald-950/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Activity className="w-6 h-6" />
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 tracking-wide uppercase">
                Transit Dispatch & Operations Console
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Transport Supervisor Portal
            </h1>
            <p className="text-sm text-emerald-100/80 font-light max-w-2xl">
              Real-time daily dispatch management, active fleet tracking, route monitoring, and transit safety control for Apex Engineering College.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSupervisorStats}
              disabled={loading}
              className="text-emerald-100 border-emerald-500/40 hover:bg-emerald-800/40 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Operations
            </Button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
            Active Routes
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            {summary?.assignedRoutesCount || 8}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold block mt-1">Operational</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
            Today's Trips
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            {summary?.todayTripsCount || 16}
          </div>
          <span className="text-[11px] text-teal-600 font-semibold block mt-1">Scheduled</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
            Active Buses
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            {summary?.activeBusesCount || 12}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold block mt-1">On Route</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
            Drivers on Duty
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            {summary?.driversOnDutyCount || 11}
          </div>
          <span className="text-[11px] text-sky-600 font-semibold block mt-1">Checked In</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
            Maintenance Req.
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            {summary?.maintenanceRequestsCount || 2}
          </div>
          <span className="text-[11px] text-amber-600 font-semibold block mt-1">Pending Review</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
            Safety Alerts
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            {summary?.activeSafetyAlertsCount || 0}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold block mt-1">All Clear</span>
        </div>
      </div>

      {/* 3. Supervisor Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 overflow-x-auto pb-2 scrollbar-none">
        {[
          { key: 'overview', label: 'Supervisor Overview', icon: Activity },
          { key: 'trips', label: 'Trips & Dispatch', icon: Clock },
          { key: 'schedule', label: 'Transit Schedule', icon: Calendar },
          { key: 'attendance', label: 'Student Attendance', icon: UserCheck },
          { key: 'gps', label: 'Live GPS Radar', icon: Radio },
          { key: 'maintenance', label: 'Maintenance Requests', icon: Wrench },
          { key: 'safety', label: 'Safety & Emergency', icon: ShieldAlert },
          { key: 'complaints', label: 'Grievances & Complaints', icon: MessageSquare },
          { key: 'announcements', label: 'Announcements & Broadcasts', icon: Megaphone }
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

      {/* 4. Tab Views Content */}
      <div className="animate-fade-in">
        {activeTab === 'overview' && (
          <SupervisorDashboardView onNavigateTab={handleTabChange} />
        )}
        {activeTab === 'trips' && <TripManagementView />}
        {activeTab === 'schedule' && <DailyScheduleView />}
        {activeTab === 'attendance' && <StudentAttendanceView />}
        {activeTab === 'gps' && <LiveGpsTrackingView />}
        {activeTab === 'maintenance' && <MaintenanceManagementView />}
        {activeTab === 'safety' && <SafetyManagementView />}
        {activeTab === 'complaints' && <ComplaintsManagementView />}
        {activeTab === 'announcements' && <AnnouncementsManagementView />}
      </div>
    </div>
  );
};

export default TransportSupervisorPage;

