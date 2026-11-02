import React, { useState, useEffect } from 'react';
import {
  Users,
  Bus,
  MapPin,
  Clock,
  Phone,
  CheckCircle,
  AlertTriangle,
  Receipt,
  MessageSquare,
  RefreshCw,
  Compass,
  CreditCard,
  UserCheck,
  Siren
} from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { useToast } from '../../context/ToastContext';
import api from '../../api/apiClient';

export default function ParentTransportPortalView({ onOpenComplaintModal }) {
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    totalLinkedChildren: 0,
    children: [],
    announcements: []
  });
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.getParentTransportPortal();
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      addToast(err.message || 'Failed to load parent transport portal', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const currentChild = data.children?.[selectedChildIndex] || null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-teal-900 to-navy-900 text-white p-6 rounded-2xl border border-teal-800 shadow-md">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-300">
            Parent Transport Portal
          </span>
          <h2 className="text-xl font-black mt-1">My Child's School Bus & Safety Tracking</h2>
          <p className="text-xs text-teal-100/80 mt-0.5">
            Real-time transit monitoring, boarding attendance, bus safety alerts, and fee statements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            isLoading={loading}
            className="text-white border-teal-400/30 hover:bg-white/10"
            icon={RefreshCw}
          >
            Refresh Live Radar
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-xl border border-navy-200 text-center text-navy-400">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-2 text-teal-600" />
          <p className="text-xs font-semibold">Synchronizing child transport telemetry...</p>
        </div>
      ) : data.children.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-navy-200 text-center text-navy-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-40 text-navy-600" />
          <h3 className="text-base font-bold text-navy-800">No Transport Allocations Found</h3>
          <p className="text-xs max-w-md mx-auto mt-1">
            No children currently registered for college bus transit under your linked parent contact details.
            Please verify student roll numbers with the institutional transport administration.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Child Selector Tabs */}
          {data.children.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {data.children.map((child, idx) => (
                <button
                  key={child.rollNumber}
                  type="button"
                  onClick={() => setSelectedChildIndex(idx)}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                    selectedChildIndex === idx
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-white text-navy-700 border border-navy-200 hover:bg-navy-50'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  {child.studentName} ({child.rollNumber})
                </button>
              ))}
            </div>
          )}

          {currentChild && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Bus, Route & Driver Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Active Emergency Alert Banner if any */}
                {currentChild.activeSafetyAlert && (
                  <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-xl flex items-start gap-3 text-rose-900 shadow-sm animate-pulse">
                    <Siren className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs">
                      <p className="font-bold text-sm text-rose-700">
                        ACTIVE EMERGENCY ALERT ON ASSIGNED VEHICLE
                      </p>
                      <p>
                        Type: <span className="font-semibold">{currentChild.activeSafetyAlert.emergencyType}</span> &bull; Status: {currentChild.activeSafetyAlert.status}
                      </p>
                      <p className="text-[11px] text-rose-600">
                        Transport control response team is active. Please contact emergency desk if urgent.
                      </p>
                    </div>
                  </div>
                )}

                {/* Child Transport Details Card */}
                <div className="bg-white p-6 rounded-2xl border border-navy-200 shadow-sm space-y-5">
                  <div className="flex items-center justify-between pb-4 border-b border-navy-100">
                    <div>
                      <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">
                        Enrolled Student
                      </span>
                      <h3 className="text-lg font-bold text-navy-900">{currentChild.studentName}</h3>
                      <p className="text-xs text-navy-500 font-mono">
                        Roll: {currentChild.rollNumber} &bull; Dept: {currentChild.department}
                      </p>
                    </div>

                    <Badge variant="teal" size="md" className="font-bold">
                      {currentChild.allocationStatus?.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 bg-navy-50/70 rounded-xl border border-navy-200/60 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-navy-900">
                        <Bus className="w-4 h-4 text-teal-600" />
                        <span>Assigned Vehicle</span>
                      </div>
                      <p className="text-sm font-extrabold text-navy-900">
                        {currentChild.bus?.busName || 'Bus Unassigned'}
                      </p>
                      <p className="text-navy-500 font-mono text-[11px]">
                        Reg: {currentChild.bus?.registrationNumber || 'N/A'}
                      </p>
                      {currentChild.bus?.driver && (
                        <div className="pt-2 border-t border-navy-200/60 text-[11px] text-navy-600">
                          <p className="font-semibold">Driver: {currentChild.bus.driver.fullName}</p>
                          <p className="text-navy-500">Contact: {currentChild.bus.driver.contactNumber || 'On file'}</p>
                        </div>
                      )}
                    </div>

                    <div className="p-3.5 bg-navy-50/70 rounded-xl border border-navy-200/60 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-navy-900">
                        <MapPin className="w-4 h-4 text-amber-600" />
                        <span>Route & Stops</span>
                      </div>
                      <p className="text-sm font-extrabold text-navy-900">
                        {currentChild.route?.routeName || 'Route Assigned'}
                      </p>
                      <div className="text-[11px] text-navy-600 space-y-0.5">
                        <p><span className="font-semibold">Pickup:</span> {currentChild.pickupStop}</p>
                        <p><span className="font-semibold">Drop:</span> {currentChild.dropStop}</p>
                      </div>
                    </div>
                  </div>

                  {/* Today's Boarding & Attendance Status */}
                  <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-teal-900 flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-teal-700" />
                        Today's Transit Attendance
                      </span>
                      <span className="text-[11px] text-teal-700 font-medium">
                        {new Date().toLocaleDateString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-white rounded-lg border border-teal-100">
                        <span className="text-[10px] text-navy-400 font-bold uppercase">Morning Boarding</span>
                        <div className="mt-1 flex items-center gap-1.5 font-bold text-navy-900">
                          <span className={`w-2 h-2 rounded-full ${currentChild.attendance?.boardingStatus === 'Boarded' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                          {currentChild.attendance?.boardingStatus || 'Pending'}
                        </div>
                        {currentChild.attendance?.boardingTime && (
                          <span className="text-[10px] text-navy-500 block mt-0.5">
                            at {new Date(currentChild.attendance.boardingTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>

                      <div className="p-3 bg-white rounded-lg border border-teal-100">
                        <span className="text-[10px] text-navy-400 font-bold uppercase">Evening Drop-off</span>
                        <div className="mt-1 flex items-center gap-1.5 font-bold text-navy-900">
                          <span className={`w-2 h-2 rounded-full ${currentChild.attendance?.dropStatus === 'Dropped' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                          {currentChild.attendance?.dropStatus || 'Pending'}
                        </div>
                        {currentChild.attendance?.dropTime && (
                          <span className="text-[10px] text-navy-500 block mt-0.5">
                            at {new Date(currentChild.attendance.dropTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Bus GPS Location Radar Card */}
                <div className="bg-white p-6 rounded-2xl border border-navy-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Compass className="w-5 h-5 text-teal-600" />
                      <h4 className="text-sm font-bold text-navy-900">Live Bus GPS Tracking</h4>
                    </div>

                    <Badge variant={currentChild.liveGps?.isOnline ? 'success' : 'neutral'} size="sm">
                      {currentChild.liveGps?.isOnline ? 'Live Transmitting' : 'Offline'}
                    </Badge>
                  </div>

                  {currentChild.liveGps?.latitude ? (
                    <div className="p-4 bg-navy-950 text-white rounded-xl space-y-3 font-mono text-xs">
                      <div className="flex items-center justify-between text-teal-400 text-[11px]">
                        <span>TELEMETRY FIX ACTIVE</span>
                        <span>Speed: {currentChild.liveGps.speed || 0} km/h</span>
                      </div>
                      <div className="text-sm">
                        Coordinates: {currentChild.liveGps.latitude.toFixed(5)}°N, {currentChild.liveGps.longitude.toFixed(5)}°E
                      </div>
                      <p className="text-[10px] text-navy-400">
                        Last ping: {currentChild.liveGps.lastUpdate ? new Date(currentChild.liveGps.lastUpdate).toLocaleTimeString() : 'N/A'}
                      </p>
                    </div>
                  ) : (
                    <div className="p-6 bg-warm-50 rounded-xl border border-navy-200 text-center text-xs text-navy-500">
                      GPS coordinates currently unavailable. Telemetry activates when bus commences scheduled transit.
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Fees, Announcements & Quick Actions */}
              <div className="space-y-6">
                {/* Fee Status Card */}
                <div className="bg-white p-5 rounded-2xl border border-navy-200 shadow-sm space-y-3">
                  <h4 className="text-xs font-bold text-navy-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-emerald-600" />
                    Transport Fee Summary
                  </h4>

                  {currentChild.feeStatus ? (
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-navy-100">
                        <span className="text-navy-500">Total Assessed:</span>
                        <span className="font-bold text-navy-900">₹{currentChild.feeStatus.totalFee}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-navy-100">
                        <span className="text-navy-500">Amount Paid:</span>
                        <span className="font-bold text-emerald-700">₹{currentChild.feeStatus.totalPaid}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-navy-100">
                        <span className="text-navy-500">Pending Balance:</span>
                        <span className={`font-bold ${currentChild.feeStatus.pendingBalance > 0 ? 'text-rose-600' : 'text-navy-900'}`}>
                          ₹{currentChild.feeStatus.pendingBalance}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-navy-500">Fee Status:</span>
                        <Badge
                          variant={
                            currentChild.feeStatus.paymentStatus === 'Paid'
                              ? 'success'
                              : currentChild.feeStatus.paymentStatus === 'Partial'
                              ? 'warning'
                              : 'danger'
                          }
                          size="sm"
                        >
                          {currentChild.feeStatus.paymentStatus}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-navy-400 py-2">Fee ledger pending generation.</p>
                  )}
                </div>

                {/* Announcements Card */}
                <div className="bg-white p-5 rounded-2xl border border-navy-200 shadow-sm space-y-3">
                  <h4 className="text-xs font-bold text-navy-700 uppercase tracking-wider">
                    Transport Announcements
                  </h4>

                  {data.announcements.length === 0 ? (
                    <p className="text-xs text-navy-400 py-2">No active announcements.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {data.announcements.map((ann) => (
                        <div key={ann._id} className="p-3 bg-warm-50/70 rounded-xl border border-navy-100 text-xs space-y-1">
                          <p className="font-bold text-navy-900">{ann.title}</p>
                          <p className="text-navy-600 line-clamp-2 text-[11px]">{ann.content}</p>
                          <span className="text-[10px] text-navy-400 block pt-1">
                            {new Date(ann.publishDate).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Action Button */}
                <div className="bg-white p-5 rounded-2xl border border-navy-200 shadow-sm text-center space-y-2">
                  <h4 className="text-xs font-bold text-navy-800">Need Assistance?</h4>
                  <p className="text-[11px] text-navy-500">
                    Submit a query or complaint directly to the transport department.
                  </p>
                  <Button
                    variant="teal"
                    size="sm"
                    className="w-full mt-2"
                    icon={MessageSquare}
                    onClick={() => {
                      if (onOpenComplaintModal) onOpenComplaintModal();
                      else addToast('Please use the Feedback & Grievances tab to submit', 'info');
                    }}
                  >
                    Submit Transport Grievance
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

