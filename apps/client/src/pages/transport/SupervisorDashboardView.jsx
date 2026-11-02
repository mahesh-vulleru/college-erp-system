import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Bus,
  Clock,
  Radio,
  UserCheck,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import api from '../../api/apiClient';

export const SupervisorDashboardView = ({ onNavigateTab }) => {
  const { addToast } = useToast();

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-navy-950 flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-500" />
            Transport Operations Monitoring Console
          </h2>
          <p className="text-xs text-navy-500">
            Real-time supervisor dispatch overview, active transit tracking, and student commuter counts.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSupervisorStats} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Operations
        </Button>
      </div>

      {/* 8 Required Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4 bg-white border border-navy-200">
          <span className="text-[11px] font-semibold text-navy-500 block">Today's Total Trips</span>
          <span className="text-2xl font-bold text-navy-950 mt-1 block">
            {summary?.todayTrips || 0}
          </span>
        </Card>

        <Card className="p-4 bg-blue-50 border border-blue-200">
          <span className="text-[11px] font-semibold text-blue-700 block">Active Trips on Road</span>
          <span className="text-2xl font-bold text-blue-900 mt-1 block">
            {summary?.activeTrips || 0}
          </span>
        </Card>

        <Card className="p-4 bg-emerald-50 border border-emerald-200">
          <span className="text-[11px] font-semibold text-emerald-700 block">Completed Trips</span>
          <span className="text-2xl font-bold text-emerald-900 mt-1 block">
            {summary?.completedTrips || 0}
          </span>
        </Card>

        <Card className="p-4 bg-red-50 border border-red-200">
          <span className="text-[11px] font-semibold text-red-700 block">Delayed Trips</span>
          <span className="text-2xl font-bold text-red-900 mt-1 block">
            {summary?.delayedTrips || 0}
          </span>
        </Card>

        <Card className="p-4 bg-emerald-50 border border-emerald-200">
          <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
            <Radio className="w-3.5 h-3.5" /> GPS Connected
          </span>
          <span className="text-2xl font-bold text-emerald-900 mt-1 block">
            {summary?.gpsConnected || 0} Buses
          </span>
        </Card>

        <Card className="p-4 bg-stone-50 border border-stone-200">
          <span className="text-[11px] font-semibold text-stone-600 block">GPS Disconnected</span>
          <span className="text-2xl font-bold text-stone-900 mt-1 block">
            {summary?.gpsDisconnected || 0} Buses
          </span>
        </Card>

        <Card className="p-4 bg-amber-50 border border-amber-200">
          <span className="text-[11px] font-semibold text-amber-700 block">Total Students Expected</span>
          <span className="text-2xl font-bold text-amber-900 mt-1 block">
            {summary?.totalStudentsExpected || 0}
          </span>
        </Card>

        <Card className="p-4 bg-emerald-50 border border-emerald-200">
          <span className="text-[11px] font-semibold text-emerald-700 block">Students Boarded</span>
          <span className="text-2xl font-bold text-emerald-900 mt-1 block">
            {summary?.studentsBoarded || 0}
          </span>
        </Card>
      </div>

      {/* Operational Dispatch Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          onClick={() => onNavigateTab && onNavigateTab('schedule')}
          className="p-4 bg-white border border-navy-200 hover:border-amber-400 cursor-pointer transition-all space-y-2"
        >
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-navy-900 text-sm">Transit Timetable</h4>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xs text-navy-500">
            Monitor and coordinate morning and evening scheduled runs.
          </p>
        </Card>

        <Card
          onClick={() => onNavigateTab && onNavigateTab('gps')}
          className="p-4 bg-white border border-navy-200 hover:border-amber-400 cursor-pointer transition-all space-y-2"
        >
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-navy-900 text-sm">Live GPS Radar</h4>
            <Radio className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xs text-navy-500">
            Track active vehicle locations and examine telemetry in real time.
          </p>
        </Card>

        <Card
          onClick={() => onNavigateTab && onNavigateTab('attendance')}
          className="p-4 bg-white border border-navy-200 hover:border-amber-400 cursor-pointer transition-all space-y-2"
        >
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-navy-900 text-sm">Commuter Attendance</h4>
            <UserCheck className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-xs text-navy-500">
            Verify passenger counts, record boarding, and audit changes.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default SupervisorDashboardView;

