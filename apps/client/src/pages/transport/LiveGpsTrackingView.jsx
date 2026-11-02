import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  Activity,
  Bus,
  RefreshCw,
  Wifi,
  WifiOff,
  Navigation,
  Compass,
  Gauge,
  Clock,
  Send,
  Eye,
  AlertTriangle,
  Radio
} from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import api from '../../api/apiClient';

export const LiveGpsTrackingView = () => {
  const { addToast } = useToast();

  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedBus, setSelectedBus] = useState(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [locationHistory, setLocationHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Manual GPS Ping tool
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [simLat, setSimLat] = useState('12.9716');
  const [simLng, setSimLng] = useState('77.5946');
  const [simSpeed, setSimSpeed] = useState('42');
  const [isSimulating, setIsSimulating] = useState(false);

  const fetchGpsData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getActiveBusLocations();
      if (res && res.data) {
        setTrackingData(res.data);
        if (!selectedBus && res.data.buses?.length > 0) {
          setSelectedBus(res.data.buses[0]);
        } else if (selectedBus) {
          // Update selected bus data
          const updated = res.data.buses?.find((b) => b.busId === selectedBus.busId);
          if (updated) setSelectedBus(updated);
        }
      }
    } catch (err) {
      addToast(err.message || 'Failed to fetch GPS locations', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedBus, addToast]);

  useEffect(() => {
    fetchGpsData();
    const interval = setInterval(fetchGpsData, 15000); // Poll every 15s for live fleet tracking
    return () => clearInterval(interval);
  }, [fetchGpsData]);

  const handleFetchHistory = async (bus) => {
    try {
      setHistoryLoading(true);
      setHistoryModalOpen(true);
      const res = await api.getBusLocationHistory(bus.busId, 30);
      if (res && res.data) {
        setLocationHistory(res.data);
      }
    } catch (err) {
      addToast('Failed to fetch location history', 'error');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSendGpsPing = async () => {
    if (!selectedBus) return;
    try {
      setIsSimulating(true);
      const res = await api.submitGpsLocation({
        bus: selectedBus._id || selectedBus.busId,
        latitude: Number(simLat),
        longitude: Number(simLng),
        speed: Number(simSpeed),
        heading: 90,
        accuracy: 4
      });
      if (res.success) {
        addToast(`GPS ping recorded for ${selectedBus.busName}`, 'success');
        fetchGpsData();
        setIsSimulatorOpen(false);
      }
    } catch (err) {
      addToast(err.message || 'Failed to submit GPS update', 'error');
    } finally {
      setIsSimulating(false);
    }
  };

  const buses = trackingData?.buses || [];
  const connectedCount = trackingData?.summary?.connectedCount || 0;
  const disconnectedCount = trackingData?.summary?.disconnectedCount || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-navy-950 flex items-center gap-2">
            <Radio className="w-5 h-5 text-amber-500 animate-pulse" />
            Live GPS Fleet Radar & Tracking
          </h2>
          <p className="text-xs text-navy-500">
            Real-time GPS telemetry, vehicle connection status, and transit progress.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchGpsData} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Radar
          </Button>
          <Button
            size="sm"
            onClick={() => setIsSimulatorOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold"
          >
            <Navigation className="w-3.5 h-3.5 mr-1.5" />
            Simulate / Send GPS Ping
          </Button>
        </div>
      </div>

      {/* KPI Status Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-4 bg-white border border-navy-200">
          <span className="text-xs font-semibold text-navy-500 block">Fleet on Radar</span>
          <span className="text-2xl font-bold text-navy-950 mt-1 block">
            {buses.length} Vehicles
          </span>
        </Card>
        <Card className="p-4 bg-emerald-50 border border-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-700 block">
                GPS Connected & Online
              </span>
              <span className="text-2xl font-bold text-emerald-800 mt-1 block">
                {connectedCount} Buses
              </span>
            </div>
            <div className="p-2.5 rounded-full bg-emerald-100 text-emerald-600">
              <Wifi className="w-5 h-5" />
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-stone-50 border border-stone-200">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-stone-600 block">
                Disconnected / Offline
              </span>
              <span className="text-2xl font-bold text-stone-800 mt-1 block">
                {disconnectedCount} Buses
              </span>
            </div>
            <div className="p-2.5 rounded-full bg-stone-200 text-stone-600">
              <WifiOff className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Map & Fleet List Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Bus Fleet Selector */}
        <Card className="p-4 border border-navy-200 space-y-3 lg:col-span-1 h-[520px] overflow-y-auto">
          <h3 className="font-bold text-navy-950 text-sm">Active Fleet Roster</h3>
          {buses.length === 0 ? (
            <div className="text-xs text-navy-400 py-6 text-center">
              No active buses found in fleet.
            </div>
          ) : (
            buses.map((b) => {
              const isSelected = selectedBus?.busId === b.busId;
              return (
                <div
                  key={b.busId}
                  onClick={() => setSelectedBus(b)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50/50 shadow-sm'
                      : 'border-navy-100 hover:border-navy-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-navy-900 text-xs">{b.busName}</span>
                    <Badge variant={b.isOnline ? 'success' : 'neutral'} size="xs">
                      {b.isOnline ? 'LIVE' : 'OFFLINE'}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-navy-500 font-mono mt-1">
                    {b.registrationNumber} &bull; Route: {b.assignedRoute?.routeName || 'None'}
                  </div>
                  <div className="text-[11px] text-navy-600 mt-1 flex items-center justify-between">
                    <span>Driver: {b.assignedDriver?.fullName || 'None'}</span>
                    {b.lastLocation && (
                      <span className="text-emerald-700 font-semibold">
                        {b.lastLocation.speed} km/h
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </Card>

        {/* Right: Live Interactive Visual Radar & Telemetry */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-4 border border-navy-200 bg-navy-950 text-white relative overflow-hidden h-[360px] flex flex-col justify-between">
            {/* Visual Transit Radar Grid (SVG Map) */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <svg width="100%" height="100%">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path
                      d="M 40 0 L 0 0 0 40"
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.4)"
                      strokeWidth="1"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            {/* Radar Center Animation & Transit Waypoints */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-mono font-bold tracking-wider text-emerald-400">
                  RADAR ACTIVE &bull; 15s REFRESH
                </span>
              </div>
              {selectedBus && (
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => handleFetchHistory(selectedBus)}
                  className="border-navy-700 text-navy-300 hover:text-white"
                >
                  <Eye className="w-3.5 h-3.5 mr-1" />
                  View Breadcrumbs
                </Button>
              )}
            </div>

            {/* Center Visual Map Simulation */}
            <div className="relative z-10 flex-1 flex items-center justify-center">
              {selectedBus ? (
                <div className="text-center space-y-2">
                  <div className="inline-flex p-4 rounded-full bg-amber-500/20 text-amber-400 ring-8 ring-amber-500/10">
                    <Bus className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{selectedBus.busName}</h4>
                    <p className="text-xs text-navy-300 font-mono">
                      {selectedBus.registrationNumber}
                    </p>
                  </div>
                  {selectedBus.isOnline && selectedBus.lastLocation ? (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-mono">
                      <span>LAT: {selectedBus.lastLocation.latitude.toFixed(4)}</span>
                      <span>&bull;</span>
                      <span>LNG: {selectedBus.lastLocation.longitude.toFixed(4)}</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-800 border border-stone-600 text-stone-300 text-xs">
                      <WifiOff className="w-3.5 h-3.5" />
                      GPS Signal Offline / Disconnected
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-navy-400 text-xs">Select a vehicle to inspect live telemetry.</div>
              )}
            </div>

            {/* Radar Footer Telemetry Bar */}
            {selectedBus && selectedBus.lastLocation && selectedBus.isOnline && (
              <div className="relative z-10 grid grid-cols-4 gap-2 pt-3 border-t border-navy-800 text-center text-xs">
                <div>
                  <span className="text-[10px] text-navy-400 block">SPEED</span>
                  <span className="font-mono font-bold text-white text-sm">
                    {selectedBus.lastLocation.speed} km/h
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-navy-400 block">HEADING</span>
                  <span className="font-mono font-bold text-white text-sm">
                    {selectedBus.lastLocation.heading}&deg; N
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-navy-400 block">ACCURACY</span>
                  <span className="font-mono font-bold text-white text-sm">
                    &plusmn;{selectedBus.lastLocation.accuracy}m
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-navy-400 block">LAST FIX</span>
                  <span className="font-mono text-emerald-400 text-xs">
                    {new Date(selectedBus.lastLocation.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            )}
          </Card>

          {/* Telemetry Details Card */}
          {selectedBus && (
            <Card className="p-4 border border-navy-200 bg-white">
              <h4 className="font-bold text-navy-950 text-xs mb-3">Vehicle Telemetry Profile</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-navy-500 block text-[11px]">Assigned Driver</span>
                  <span className="font-semibold text-navy-900">
                    {selectedBus.assignedDriver?.fullName || 'None'}
                  </span>
                </div>
                <div>
                  <span className="text-navy-500 block text-[11px]">Assigned Route</span>
                  <span className="font-semibold text-navy-900">
                    {selectedBus.assignedRoute?.routeName || 'None'}
                  </span>
                </div>
                <div>
                  <span className="text-navy-500 block text-[11px]">Connection Status</span>
                  <Badge variant={selectedBus.isOnline ? 'success' : 'neutral'} size="xs">
                    {selectedBus.connectionStatus?.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <span className="text-navy-500 block text-[11px]">Hardware Integration</span>
                  <span className="font-semibold text-navy-700">Driver Telemetry / OBD-II</span>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* GPS BREADCRUMB HISTORY MODAL */}
      <Modal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        title={selectedBus ? `GPS Location Breadcrumbs — ${selectedBus.busName}` : 'History'}
      >
        <div className="space-y-3 text-xs max-h-96 overflow-y-auto">
          {historyLoading ? (
            <div className="p-6 text-center text-navy-400">Loading coordinate history...</div>
          ) : locationHistory.length === 0 ? (
            <div className="p-6 text-center text-navy-400">
              No historical location logs found for this vehicle.
            </div>
          ) : (
            <div className="divide-y divide-navy-100 border border-navy-200 rounded-lg">
              {locationHistory.map((item, idx) => (
                <div key={idx} className="p-2 flex items-center justify-between font-mono text-[11px]">
                  <div>
                    <span className="text-navy-900 font-semibold block">
                      LAT: {item.latitude.toFixed(5)}, LNG: {item.longitude.toFixed(5)}
                    </span>
                    <span className="text-navy-400 text-[10px]">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <Badge variant="info" size="xs">
                    {item.speed} km/h
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* SIMULATOR MODAL */}
      <Modal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        title="Simulate / Send Live GPS Coordinates"
      >
        <div className="space-y-4 text-xs">
          <p className="text-navy-600">
            Submit a real GPS coordinate update to test tracking for vehicle{' '}
            <strong>{selectedBus?.busName}</strong>.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-navy-700 font-semibold mb-1">Latitude</label>
              <Input value={simLat} onChange={(e) => setSimLat(e.target.value)} />
            </div>
            <div>
              <label className="block text-navy-700 font-semibold mb-1">Longitude</label>
              <Input value={simLng} onChange={(e) => setSimLng(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-navy-700 font-semibold mb-1">Current Speed (km/h)</label>
            <Input value={simSpeed} onChange={(e) => setSimSpeed(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsSimulatorOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={isSimulating}
              onClick={handleSendGpsPing}
              className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold"
            >
              {isSimulating ? 'Submitting...' : 'Send GPS Ping'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LiveGpsTrackingView;

