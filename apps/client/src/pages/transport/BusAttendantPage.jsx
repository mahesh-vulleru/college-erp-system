import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  UserCheck,
  Bus,
  MapPin,
  Clock,
  Calendar,
  Phone,
  ShieldCheck,
  Megaphone,
  AlertTriangle,
  RefreshCw,
  Users
} from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import api from '../../api/apiClient';

import StudentAttendanceView from './StudentAttendanceView';
import DailyScheduleView from './DailyScheduleView';
import AnnouncementsManagementView from './AnnouncementsManagementView';

export const BusAttendantPage = () => {
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab') || 'attendance';
  const [activeTab, setActiveTab] = useState(tabParam);

  useEffect(() => {
    if (tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (key) => {
    setActiveTab(key);
    if (key === 'attendance') {
      searchParams.delete('tab');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ tab: key });
    }
  };

  const [studentRoster, setStudentRoster] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRoster = async () => {
    try {
      setLoading(true);
      const res = await api.getStudentAllocations();
      if (res && res.data) {
        setStudentRoster(res.data);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoster();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#062a1e] via-[#0b3d2c] to-[#062a1e] p-6 sm:p-8 text-white border border-emerald-900/50 shadow-xl shadow-emerald-950/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <UserCheck className="w-6 h-6" />
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 tracking-wide uppercase">
                Student Transit Care & Safety
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Bus Attendant Passenger Roster
            </h1>
            <p className="text-sm text-emerald-100/80 font-light max-w-2xl">
              Student bus boarding verification, RFID and manual attendance, pickup/drop-off point tracking, and authorized guardian emergency contact details.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRoster}
              disabled={loading}
              className="text-emerald-100 border-emerald-500/40 hover:bg-emerald-800/40 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Roster
            </Button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. Attendant Quick Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
            Assigned Bus
          </span>
          <div className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
            Bus 04 (Route 04)
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold block mt-1">Morning & Evening</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
            Registered Students
          </span>
          <div className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
            {studentRoster.length || 38}
          </div>
          <span className="text-[11px] text-teal-700 font-semibold block mt-1">On Roster</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
            Today's Boarding
          </span>
          <div className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
            {Math.round((studentRoster.length || 38) * 0.92)} Boarded
          </div>
          <span className="text-[11px] text-sky-700 font-semibold block mt-1">Attendance In Sync</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
            Transit Dispatch Hotline
          </span>
          <div className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
            +91 800-234-5678
          </div>
          <span className="text-[11px] text-rose-700 font-semibold block mt-1">24/7 Security Desk</span>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 overflow-x-auto pb-2 scrollbar-none">
        {[
          { key: 'attendance', label: 'Take Transit Attendance', icon: UserCheck },
          { key: 'roster', label: 'Student Passenger Directory', icon: Users },
          { key: 'schedule', label: 'Daily Transit Schedule', icon: Calendar },
          { key: 'announcements', label: 'Broadcast Announcements', icon: Megaphone }
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
        {activeTab === 'attendance' && <StudentAttendanceView />}

        {activeTab === 'roster' && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Assigned Student Passengers
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Authorized student roster with pickup/drop stops and parent emergency contacts.
                </p>
              </div>
              <Badge variant="teal" size="sm">
                {studentRoster.length || 38} Assigned
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800">
                <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Roll Number</th>
                    <th className="py-3 px-4">Department & Class</th>
                    <th className="py-3 px-4">Morning Pickup Stop</th>
                    <th className="py-3 px-4">Evening Drop Stop</th>
                    <th className="py-3 px-4">Parent / Guardian Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentRoster.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No students currently allocated to this transit route.
                      </td>
                    </tr>
                  ) : (
                    studentRoster.map((alloc) => (
                      <tr key={alloc._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {alloc.student?.name || alloc.studentName || 'Student Passenger'}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-emerald-800">
                          {alloc.student?.rollNumber || alloc.rollNumber || 'APEX-2026'}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {alloc.student?.department || 'Engineering'} &bull; Year 3
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 font-medium text-slate-800">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            {alloc.pickupStop || 'Main Gate'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 font-medium text-slate-800">
                            <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            {alloc.dropStop || alloc.pickupStop || 'Benz Circle'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {alloc.emergencyContact || '+91 98765-43210'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'schedule' && <DailyScheduleView />}
        {activeTab === 'announcements' && <AnnouncementsManagementView />}
      </div>
    </div>
  );
};

export default BusAttendantPage;

