import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  Bus,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Play
} from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { useToast } from '../../context/ToastContext';
import api from '../../api/apiClient';

export const DailyScheduleView = () => {
  const { addToast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTabSection, setActiveTabSection] = useState('all'); // all, morning, evening

  const fetchSchedule = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getDailySchedule(selectedDate);
      if (res && res.data) {
        setScheduleData(res.data);
      }
    } catch (err) {
      addToast(err.message || 'Failed to fetch daily schedule', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, addToast]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const changeDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const getStatusBadge = (status) => {
    const s = String(status || '').toLowerCase();
    switch (s) {
      case 'completed':
        return <Badge variant="success" size="xs">Completed</Badge>;
      case 'in_progress':
      case 'in-progress':
      case 'started':
        return <Badge variant="warning" size="xs">In Progress</Badge>;
      case 'upcoming':
        return <Badge variant="info" size="xs">Upcoming</Badge>;
      case 'scheduled':
        return <Badge variant="info" size="xs">Scheduled</Badge>;
      case 'delayed':
        return <Badge variant="danger" size="xs">Delayed</Badge>;
      case 'cancelled':
        return <Badge variant="neutral" size="xs">Cancelled</Badge>;
      default:
        return <Badge variant="info" size="xs">{status || 'Upcoming'}</Badge>;
    }
  };

  const trips = scheduleData?.trips || [];
  const filteredTrips = trips.filter((t) => {
    if (activeTabSection === 'morning') return t.tripType === 'morning_pickup';
    if (activeTabSection === 'evening') return t.tripType === 'evening_drop';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Date Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-navy-950 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-500" />
            Daily Transport Transit Schedule
          </h2>
          <p className="text-xs text-navy-500">
            Monitor real-time morning pickups and evening drop schedules.
          </p>
        </div>

        {/* Date Navigator */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => changeDate(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-36 text-xs"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
          >
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={() => changeDate(1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={fetchSchedule} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Summary KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-3 text-center bg-white border border-navy-200">
          <span className="text-[11px] font-medium text-navy-500 block">Total Trips</span>
          <span className="text-xl font-bold text-navy-950">
            {scheduleData?.totalScheduled || 0}
          </span>
        </Card>
        <Card className="p-3 text-center bg-amber-50 border border-amber-200">
          <span className="text-[11px] font-medium text-amber-700 flex items-center justify-center gap-1">
            <Sun className="w-3 h-3" /> Morning
          </span>
          <span className="text-xl font-bold text-amber-800">
            {scheduleData?.summary?.morningCount || 0}
          </span>
        </Card>
        <Card className="p-3 text-center bg-indigo-50 border border-indigo-200">
          <span className="text-[11px] font-medium text-indigo-700 flex items-center justify-center gap-1">
            <Moon className="w-3 h-3" /> Evening
          </span>
          <span className="text-xl font-bold text-indigo-800">
            {scheduleData?.summary?.eveningCount || 0}
          </span>
        </Card>
        <Card className="p-3 text-center bg-emerald-50 border border-emerald-200">
          <span className="text-[11px] font-medium text-emerald-700 block">Completed</span>
          <span className="text-xl font-bold text-emerald-800">
            {scheduleData?.summary?.completedCount || 0}
          </span>
        </Card>
        <Card className="p-3 text-center bg-blue-50 border border-blue-200">
          <span className="text-[11px] font-medium text-blue-700 block">In Progress</span>
          <span className="text-xl font-bold text-blue-800">
            {scheduleData?.summary?.activeCount || 0}
          </span>
        </Card>
        <Card className="p-3 text-center bg-red-50 border border-red-200">
          <span className="text-[11px] font-medium text-red-700 block">Delayed</span>
          <span className="text-xl font-bold text-red-800">
            {scheduleData?.summary?.delayedCount || 0}
          </span>
        </Card>
      </div>

      {/* Section Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-navy-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTabSection('all')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-all ${
            activeTabSection === 'all'
              ? 'bg-navy-900 text-white'
              : 'text-navy-600 hover:bg-navy-100'
          }`}
        >
          All Transit ({trips.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTabSection('morning')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-all ${
            activeTabSection === 'morning'
              ? 'bg-amber-500 text-stone-950 font-bold'
              : 'text-navy-600 hover:bg-navy-100'
          }`}
        >
          Morning Pickup ({scheduleData?.summary?.morningCount || 0})
        </button>
        <button
          type="button"
          onClick={() => setActiveTabSection('evening')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-all ${
            activeTabSection === 'evening'
              ? 'bg-indigo-600 text-white font-bold'
              : 'text-navy-600 hover:bg-navy-100'
          }`}
        >
          Evening Drop ({scheduleData?.summary?.eveningCount || 0})
        </button>
      </div>

      {/* Timeline Schedule Cards */}
      {filteredTrips.length === 0 ? (
        <Card className="p-8 text-center text-navy-400">
          No transit trips scheduled for this date.
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTrips.map((trip) => (
            <Card
              key={trip._id}
              className="p-4 bg-white border border-navy-200 hover:border-amber-400 transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 shrink-0">
                    <Bus className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-navy-950 text-sm">
                        {trip.tripId}
                      </span>
                      <Badge
                        variant={trip.tripType === 'morning_pickup' ? 'warning' : 'info'}
                        size="xs"
                      >
                        {trip.tripType === 'morning_pickup' ? 'Morning Pickup' : 'Evening Drop'}
                      </Badge>
                      {getStatusBadge(trip.tripStatus)}
                    </div>
                    <div className="text-xs text-navy-700 font-medium mt-1">
                      Route: {trip.route?.routeName} ({trip.route?.routeCode}) &bull;{' '}
                      {trip.route?.startingPoint} &rarr; {trip.route?.destination}
                    </div>
                    <div className="text-[11px] text-navy-500 mt-0.5">
                      Assigned Vehicle: {trip.bus?.busName} ({trip.bus?.registrationNumber}) &bull; Driver:{' '}
                      {trip.driver?.fullName} ({trip.driver?.phoneNumber})
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-xs">
                  <div>
                    <span className="text-navy-400 block text-[11px]">Departure Window</span>
                    <span className="font-mono font-bold text-navy-900 text-sm">
                      {trip.scheduledDeparture} &rarr; {trip.scheduledArrival}
                    </span>
                  </div>

                  {trip.actualDeparture && (
                    <div>
                      <span className="text-navy-400 block text-[11px]">Actual Departed</span>
                      <span className="font-mono text-emerald-600 font-semibold">
                        {new Date(trip.actualDeparture).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  )}

                  {trip.route?.stops && trip.route.stops.length > 0 && (
                    <div className="hidden sm:block">
                      <span className="text-navy-400 block text-[11px]">Total Stops</span>
                      <span className="font-bold text-navy-900">
                        {trip.route.stops.length} Stops
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DailyScheduleView;

