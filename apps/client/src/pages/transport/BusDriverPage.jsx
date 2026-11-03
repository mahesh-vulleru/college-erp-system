import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Bus,
  MapPin,
  Clock,
  Calendar,
  Radio,
  ShieldAlert,
  Megaphone,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Phone
} from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import api from '../../api/apiClient';

import DriverPortalView from './DriverPortalView';
import DailyScheduleView from './DailyScheduleView';
import SafetyManagementView from './SafetyManagementView';
import AnnouncementsManagementView from './AnnouncementsManagementView';

export const BusDriverPage = () => {
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab') || 'console';
  const [activeTab, setActiveTab] = useState(tabParam);

  useEffect(() => {
    if (tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (key) => {
    setActiveTab(key);
    if (key === 'console') {
      searchParams.delete('tab');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ tab: key });
    }
  };

  const [driverData, setDriverData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const res = await api.getDriverTrips();
      if (res && res.data) {
        setDriverData(res.data);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const activeTrip = driverData?.activeTrip;
  const assignedBus = driverData?.assignedBus;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#062a1e] via-[#0b3d2c] to-[#062a1e] p-6 sm:p-8 text-white border border-emerald-900/50 shadow-xl shadow-emerald-950/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Bus className="w-6 h-6" />
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 tracking-wide uppercase">
                Driver Navigation Console
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Bus Driver Transit Dashboard
            </h1>
            <p className="text-sm text-emerald-100/80 font-light max-w-2xl">
              Real-time trip start and finish controls, passenger boarding checklist, HTML5 GPS broadcasting, and vehicle breakdown alerts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchTrips}
              disabled={loading}
              className="text-emerald-100 border-emerald-500/40 hover:bg-emerald-800/40 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Trips
            </Button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. Driver Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
            Assigned Vehicle
          </span>
          <div className="text-lg sm:text-xl font-bold text-slate-900 mt-1 truncate">
            {assignedBus?.busName || 'Bus 04 (Starbus)'}
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold block mt-1">
            {assignedBus?.registrationNumber || 'AP 16 TE 4521'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
            Current Route
          </span>
          <div className="text-lg sm:text-xl font-bold text-slate-900 mt-1 truncate">
            {activeTrip?.route?.routeName || 'Route 04 - Benz Circle'}
          </div>
          <span className="text-[11px] text-teal-700 font-semibold block mt-1">
            {activeTrip?.tripType === 'morning_pickup' ? 'Morning Pickup' : 'Evening Drop'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
            Trip Status
          </span>
          <div className="text-lg sm:text-xl font-bold text-slate-900 mt-1 truncate">
            {activeTrip ? 'In Progress' : 'Scheduled / Ready'}
          </div>
          <span className="text-[11px] text-sky-700 font-semibold block mt-1">GPS Telemetry Ready</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
            Transport Helpline
          </span>
          <div className="text-lg sm:text-xl font-bold text-slate-900 mt-1 truncate">
            +91 800-234-5678
          </div>
          <span className="text-[11px] text-rose-700 font-semibold block mt-1">Emergency Dispatch</span>
        </div>
      </div>

      {/* 3. Driver Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 overflow-x-auto pb-2 scrollbar-none">
        {[
          { key: 'console', label: 'Trip Console & GPS', icon: Bus },
          { key: 'schedule', label: 'Daily Transit Schedule', icon: Calendar },
          { key: 'safety', label: 'Safety & Emergency SOS', icon: ShieldAlert },
          { key: 'announcements', label: 'Notices & Broadcasts', icon: Megaphone }
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
        {activeTab === 'console' && <DriverPortalView />}
        {activeTab === 'schedule' && <DailyScheduleView />}
        {activeTab === 'safety' && <SafetyManagementView />}
        {activeTab === 'announcements' && <AnnouncementsManagementView />}
      </div>
    </div>
  );
};

export default BusDriverPage;

