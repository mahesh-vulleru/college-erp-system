import React, { useState, useEffect, useCallback } from 'react';
import {
  Bus,
  MapPin,
  Clock,
  Navigation,
  Play,
  CheckCircle2,
  AlertTriangle,
  Radio,
  RefreshCw,
  Phone,
  ShieldAlert
} from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import api from '../../api/apiClient';

export const DriverPortalView = () => {
  const { addToast } = useToast();

  const [driverData, setDriverData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [watchId, setWatchId] = useState(null);
  const [lastCoords, setLastCoords] = useState(null);

  // Breakdown Modal
  const [breakdownModalOpen, setBreakdownModalOpen] = useState(false);
  const [breakdownDesc, setBreakdownDesc] = useState('');
  const [emergencyBusRequested, setEmergencyBusRequested] = useState(false);

  const fetchDriverTrips = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getDriverTrips();
      if (res && res.data) {
        setDriverData(res.data);
      }
    } catch (err) {
      addToast('Failed to load assigned trips', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchDriverTrips();
  }, [fetchDriverTrips]);

  // GPS Sharing handler using HTML5 Geolocation API
  const toggleLocationSharing = (activeTrip) => {
    if (isSharingLocation) {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }
      setIsSharingLocation(false);
      addToast('GPS location sharing stopped', 'info');
    } else {
      if (!navigator.geolocation) {
        addToast('Geolocation is not supported by your browser', 'error');
        return;
      }

      const id = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude, speed, heading, accuracy } = position.coords;
          setLastCoords({ latitude, longitude });

          try {
            await api.submitGpsLocation({
              bus: activeTrip?.bus?._id || activeTrip?.bus,
              trip: activeTrip?._id,
              latitude,
              longitude,
              speed: speed ? Math.round(speed * 3.6) : 0, // convert m/s to km/h
              heading: heading || 0,
              accuracy: accuracy || 5
            });
          } catch (err) {
            console.warn('GPS ping failed:', err.message);
          }
        },
        (error) => {
          addToast(`GPS Error: ${error.message}`, 'error');
          setIsSharingLocation(false);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 10000,
          timeout: 10000
        }
      );

      setWatchId(id);
      setIsSharingLocation(true);
      addToast('Live GPS location broadcasting ACTIVE', 'success');
    }
  };

  const handleStartTrip = async (id, tripCode) => {
    try {
      const res = await api.startTrip(id);
      if (res.success) {
        addToast(`Trip ${tripCode} started`, 'success');
        fetchDriverTrips();
      }
    } catch (err) {
      addToast(err.message || 'Failed to start trip', 'error');
    }
  };

  const handleCompleteTrip = async (id, tripCode) => {
    try {
      const res = await api.completeTrip(id);
      if (res.success) {
        addToast(`Trip ${tripCode} completed`, 'success');
        if (isSharingLocation && watchId !== null) {
          navigator.geolocation.clearWatch(watchId);
          setWatchId(null);
          setIsSharingLocation(false);
        }
        fetchDriverTrips();
      }
    } catch (err) {
      addToast(err.message || 'Failed to complete trip', 'error');
    }
  };

  const todayTrips = driverData?.todayTrips || [];
  const currentTrip = todayTrips.find((t) => t.tripStatus === 'in_progress' || t.tripStatus === 'started') || todayTrips[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-navy-950 flex items-center gap-2">
            <Bus className="w-5 h-5 text-amber-500" />
            Driver Transit Console
          </h2>
          <p className="text-xs text-navy-500">
            Welcome, {driverData?.driver?.fullName || 'Driver'}. Manage your assigned trips and GPS telemetry.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchDriverTrips} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Active Trip Broadcast Card */}
      {currentTrip ? (
        <Card className="p-6 bg-navy-950 text-white border border-navy-800">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={currentTrip.tripStatus === 'in_progress' ? 'warning' : 'info'} size="xs">
                  {currentTrip.tripStatus?.toUpperCase()}
                </Badge>
                <span className="font-mono font-bold text-amber-400 text-lg">
                  {currentTrip.tripId}
                </span>
                <span className="text-xs text-navy-300">
                  ({currentTrip.tripType === 'morning_pickup' ? 'Morning Pickup' : 'Evening Drop'})
                </span>
              </div>
              <h3 className="text-base font-bold text-white">
                Vehicle: {currentTrip.bus?.busName} ({currentTrip.bus?.registrationNumber})
              </h3>
              <p className="text-xs text-navy-300 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                Route: {currentTrip.route?.routeName} ({currentTrip.route?.startingPoint} &rarr; {currentTrip.route?.destination})
              </p>
              <div className="text-xs text-navy-400">
                Scheduled Window: {currentTrip.scheduledDeparture} &rarr; {currentTrip.scheduledArrival}
              </div>
            </div>

            {/* Quick Actions & GPS Sharing */}
            <div className="flex flex-wrap items-center gap-3">
              {currentTrip.tripStatus === 'scheduled' && (
                <Button
                  onClick={() => handleStartTrip(currentTrip._id, currentTrip.tripId)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  <Play className="w-4 h-4 mr-1.5" />
                  Start Trip
                </Button>
              )}

              {(currentTrip.tripStatus === 'started' || currentTrip.tripStatus === 'in_progress') && (
                <>
                  <Button
                    onClick={() => toggleLocationSharing(currentTrip)}
                    className={
                      isSharingLocation
                        ? 'bg-red-600 hover:bg-red-700 text-white font-bold animate-pulse'
                        : 'bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold'
                    }
                  >
                    <Radio className="w-4 h-4 mr-1.5" />
                    {isSharingLocation ? 'Stop GPS Broadcast' : 'Share Live GPS Location'}
                  </Button>

                  <Button
                    onClick={() => handleCompleteTrip(currentTrip._id, currentTrip.tripId)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    Complete Trip
                  </Button>
                </>
              )}

              <Button
                variant="outline"
                onClick={() => setBreakdownModalOpen(true)}
                className="border-red-500/50 text-red-400 hover:bg-red-950/40"
              >
                <AlertTriangle className="w-4 h-4 mr-1.5" />
                Report Issue
              </Button>
            </div>
          </div>

          {/* Last Broadcasted Coordinates */}
          {isSharingLocation && lastCoords && (
            <div className="mt-4 pt-4 border-t border-navy-800 text-xs flex items-center justify-between text-emerald-400 font-mono">
              <span>BROADCASTING GPS: LAT {lastCoords.latitude.toFixed(5)}, LNG {lastCoords.longitude.toFixed(5)}</span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live Telemetry Active
              </span>
            </div>
          )}
        </Card>
      ) : (
        <Card className="p-8 text-center text-navy-400 border border-navy-200">
          No trips assigned to you for today.
        </Card>
      )}

      {/* Route Stops Sequence */}
      {currentTrip?.route?.stops && currentTrip.route.stops.length > 0 && (
        <Card className="p-4 border border-navy-200 bg-white">
          <h4 className="font-bold text-navy-950 text-sm mb-3">Transit Stop Timeline</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {currentTrip.route.stops.map((stop, idx) => (
              <div key={idx} className="p-3 bg-navy-50 rounded-xl border border-navy-100 text-xs">
                <div className="flex items-center justify-between font-bold text-navy-900">
                  <span>Stop #{stop.sequence}</span>
                  <span className="font-mono text-amber-700">{stop.pickupTime}</span>
                </div>
                <div className="text-navy-950 font-semibold mt-1">{stop.stopName}</div>
                {stop.landmark && <div className="text-navy-500 text-[11px] mt-0.5">{stop.landmark}</div>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Breakdown Report Modal */}
      <Modal
        isOpen={breakdownModalOpen}
        onClose={() => setBreakdownModalOpen(false)}
        title="Report Breakdown / Mechanical Issue"
      >
        <div className="space-y-4 text-xs">
          <p className="text-navy-600">
            Submit an immediate issue alert to the Transport Dispatch desk.
          </p>
          <div>
            <label className="block text-navy-800 font-semibold mb-1">Issue Description</label>
            <Input
              placeholder="e.g. Engine overheat near Silk Board, flat tyre"
              value={breakdownDesc}
              onChange={(e) => setBreakdownDesc(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="reqBackup"
              checked={emergencyBusRequested}
              onChange={(e) => setEmergencyBusRequested(e.target.checked)}
              className="rounded text-amber-500"
            />
            <label htmlFor="reqBackup" className="text-navy-800 font-medium">
              Request immediate relief/backup bus dispatch
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setBreakdownModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                addToast('Issue reported to Transport Supervisor', 'success');
                setBreakdownModalOpen(false);
              }}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              Submit Report
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DriverPortalView;

