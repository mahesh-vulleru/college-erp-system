import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Siren,
  CheckCircle,
  Clock,
  MapPin,
  Car,
  FileText,
  UserCheck,
  Compass,
  Gauge,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Check,
  Eye,
  AlertOctagon,
  ArrowRight,
  PhoneCall
} from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/apiClient';

export default function SafetyManagementView({ onRefreshParent }) {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('sos'); // 'sos' | 'incidents' | 'geofences'
  const [summary, setSummary] = useState({
    totalSafetyIncidents: 0,
    openIncidents: 0,
    resolvedIncidents: 0,
    criticalIncidents: 0,
    activeSosAlerts: 0,
    accidentReports: 0,
    breakdownReports: 0,
    routeDeviationAlerts: 0,
    overspeedAlerts: 0,
    pendingSafetyActions: 0
  });

  const [sosAlerts, setSosAlerts] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [geofences, setGeofences] = useState([]);
  const [geofenceEvents, setGeofenceEvents] = useState([]);
  const [overspeedEvents, setOverspeedEvents] = useState([]);
  const [buses, setBuses] = useState([]);

  // Modals
  const [showSosModal, setShowSosModal] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showGeofenceModal, setShowGeofenceModal] = useState(false);
  const [actionAlert, setActionAlert] = useState(null); // Alert being acknowledged or resolved
  const [actionIncident, setActionIncident] = useState(null); // Incident being updated

  // Forms
  const [sosForm, setSosForm] = useState({
    bus: '',
    emergencyType: 'Medical Emergency',
    severity: 'Critical',
    description: '',
    latitude: '',
    longitude: ''
  });

  const [incidentForm, setIncidentForm] = useState({
    category: 'Accident',
    severity: 'Medium',
    bus: '',
    description: '',
    incidentDate: new Date().toISOString().split('T')[0]
  });

  const [geofenceForm, setGeofenceForm] = useState({
    name: '',
    geofenceType: 'Campus',
    latitude: 12.9716,
    longitude: 77.5946,
    radiusMeters: 200,
    speedLimitKmh: 40,
    description: ''
  });

  const [responseNotes, setResponseNotes] = useState('');
  const [incidentStatusForm, setIncidentStatusForm] = useState({
    status: 'Under Investigation',
    investigationNotes: '',
    correctiveActions: '',
    resolutionDetails: ''
  });

  // Filters
  const [incidentFilterCategory, setIncidentFilterCategory] = useState('all');
  const [incidentFilterStatus, setIncidentFilterStatus] = useState('all');
  const [incidentSearch, setIncidentSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [sumRes, sosRes, incRes, geoRes, busRes, geoEvtRes, spdEvtRes] = await Promise.all([
        api.getTransportSafetySummary().catch(() => ({})),
        api.getEmergencyAlerts().catch(() => ({ data: [] })),
        api.getTransportIncidents().catch(() => ({ data: [] })),
        api.getGeofences().catch(() => ({ data: [] })),
        api.getBuses().catch(() => ({ data: [] })),
        api.getGeofenceEvents().catch(() => ({ data: [] })),
        api.getOverspeedEvents().catch(() => ({ data: [] }))
      ]);

      if (sumRes.success && sumRes.summary) {
        setSummary(sumRes.summary);
      }
      setSosAlerts(sosRes.data || []);
      setIncidents(incRes.data || []);
      setGeofences(geoRes.data || []);
      setBuses(busRes.data || []);
      setGeofenceEvents(geoEvtRes.data || []);
      setOverspeedEvents(spdEvtRes.data || []);
    } catch (err) {
      addToast(err.message || 'Failed to load safety data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered incidents
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      if (incidentFilterCategory !== 'all' && inc.category !== incidentFilterCategory) return false;
      if (incidentFilterStatus !== 'all' && inc.status !== incidentFilterStatus) return false;
      if (incidentSearch.trim()) {
        const q = incidentSearch.toLowerCase();
        const idMatch = inc.incidentId?.toLowerCase().includes(q);
        const descMatch = inc.description?.toLowerCase().includes(q);
        const busMatch = inc.busRegistrationNumber?.toLowerCase().includes(q);
        if (!idMatch && !descMatch && !busMatch) return false;
      }
      return true;
    });
  }, [incidents, incidentFilterCategory, incidentFilterStatus, incidentSearch]);

  // SOS Trigger
  const handleTriggerSos = async (e) => {
    e.preventDefault();
    if (!sosForm.bus) {
      addToast('Please select a vehicle to trigger SOS', 'error');
      return;
    }

    try {
      const payload = {
        bus: sosForm.bus,
        emergencyType: sosForm.emergencyType,
        severity: sosForm.severity,
        description: sosForm.description,
        location: {
          latitude: sosForm.latitude ? Number(sosForm.latitude) : undefined,
          longitude: sosForm.longitude ? Number(sosForm.longitude) : undefined
        }
      };

      const res = await api.triggerSosAlert(payload);
      addToast(res.message || 'Emergency SOS broadcasted successfully!', 'warning');
      setShowSosModal(false);
      setSosForm({
        bus: '',
        emergencyType: 'Medical Emergency',
        severity: 'Critical',
        description: '',
        latitude: '',
        longitude: ''
      });
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to trigger SOS alert', 'error');
    }
  };

  // SOS Status Update (Acknowledge / Initiate / Resolve)
  const handleAcknowledgeSos = async (alertId) => {
    try {
      await api.acknowledgeEmergencyAlert(alertId, { notes: responseNotes });
      addToast('SOS Alert acknowledged', 'success');
      setActionAlert(null);
      setResponseNotes('');
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to acknowledge alert', 'error');
    }
  };

  const handleResolveSos = async (alertId) => {
    try {
      await api.resolveEmergencyAlert(alertId, { notes: responseNotes, status: 'Resolved' });
      addToast('Emergency SOS marked as Resolved', 'success');
      setActionAlert(null);
      setResponseNotes('');
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to resolve alert', 'error');
    }
  };

  // Incident Submit
  const handleCreateIncident = async (e) => {
    e.preventDefault();
    if (!incidentForm.description.trim()) {
      addToast('Please enter an incident description', 'error');
      return;
    }

    try {
      const res = await api.createTransportIncident({
        category: incidentForm.category,
        severity: incidentForm.severity,
        bus: incidentForm.bus || undefined,
        description: incidentForm.description,
        incidentDate: incidentForm.incidentDate
      });
      addToast(res.message || 'Incident logged successfully', 'success');
      setShowIncidentModal(false);
      setIncidentForm({
        category: 'Accident',
        severity: 'Medium',
        bus: '',
        description: '',
        incidentDate: new Date().toISOString().split('T')[0]
      });
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to report incident', 'error');
    }
  };

  // Incident Status Update
  const handleUpdateIncidentStatus = async (e) => {
    e.preventDefault();
    if (!actionIncident) return;

    try {
      await api.updateTransportIncidentStatus(actionIncident._id, incidentStatusForm);
      addToast('Incident updated successfully', 'success');
      setActionIncident(null);
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to update incident', 'error');
    }
  };

  // Create Geofence
  const handleCreateGeofence = async (e) => {
    e.preventDefault();
    if (!geofenceForm.name.trim()) {
      addToast('Geofence name is required', 'error');
      return;
    }

    try {
      await api.createGeofence({
        name: geofenceForm.name,
        geofenceType: geofenceForm.geofenceType,
        center: {
          latitude: Number(geofenceForm.latitude),
          longitude: Number(geofenceForm.longitude)
        },
        radiusMeters: Number(geofenceForm.radiusMeters),
        speedLimitKmh: Number(geofenceForm.speedLimitKmh),
        description: geofenceForm.description
      });
      addToast('Geofence zone registered successfully', 'success');
      setShowGeofenceModal(false);
      setGeofenceForm({
        name: '',
        geofenceType: 'Campus',
        latitude: 12.9716,
        longitude: 77.5946,
        radiusMeters: 200,
        speedLimitKmh: 40,
        description: ''
      });
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to create geofence', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-navy-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-200">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-navy-900">Transport Safety & Emergency Command</h2>
            <p className="text-xs text-navy-500">
              Live SOS alerts, incident investigation workflows, geofencing and overspeed monitoring.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            isLoading={loading}
            icon={RefreshCw}
          >
            Refresh
          </Button>

          <Button
            variant="danger"
            size="sm"
            className="font-bold shadow-md shadow-rose-600/20"
            icon={Siren}
            onClick={() => setShowSosModal(true)}
          >
            Trigger Emergency SOS
          </Button>

          <Button
            variant="teal"
            size="sm"
            icon={Plus}
            onClick={() => setShowIncidentModal(true)}
          >
            Report Incident
          </Button>
        </div>
      </div>

      {/* 2. Top Safety KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-rose-600 font-semibold mb-1">
            <span>Active SOS</span>
            <Siren className="w-4 h-4 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-rose-700">{summary.activeSosAlerts}</div>
          <span className="text-[10px] text-navy-400">Immediate response required</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-amber-600 font-semibold mb-1">
            <span>Open Incidents</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-amber-700">{summary.openIncidents}</div>
          <span className="text-[10px] text-navy-400">Under review or action</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-emerald-600 font-semibold mb-1">
            <span>Resolved</span>
            <CheckCircle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{summary.resolvedIncidents}</div>
          <span className="text-[10px] text-navy-400">Investigated and closed</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-blue-600 font-semibold mb-1">
            <span>Overspeed Alerts</span>
            <Gauge className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-blue-700">{summary.overspeedAlerts}</div>
          <span className="text-[10px] text-navy-400">GPS speed limit breaches</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-purple-600 font-semibold mb-1">
            <span>Route Deviations</span>
            <Compass className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-purple-700">{summary.routeDeviationAlerts}</div>
          <span className="text-[10px] text-navy-400">Geofence boundary alerts</span>
        </div>
      </div>

      {/* 3. Sub-tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-navy-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('sos')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all ${
            activeSubTab === 'sos'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-navy-600 hover:bg-navy-100'
          }`}
        >
          <Siren className="w-4 h-4" />
          Active SOS Alerts ({sosAlerts.filter((s) => s.status !== 'Closed').length})
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('incidents')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all ${
            activeSubTab === 'incidents'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-navy-600 hover:bg-navy-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          Safety Incidents & Accidents ({incidents.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('geofences')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all ${
            activeSubTab === 'geofences'
              ? 'bg-navy-800 text-white shadow-sm'
              : 'text-navy-600 hover:bg-navy-100'
          }`}
        >
          <Compass className="w-4 h-4" />
          Geofencing & Speed Zones ({geofences.length})
        </button>
      </div>

      {/* 4. Sub-tab Content: Active SOS */}
      {activeSubTab === 'sos' && (
        <div className="space-y-4">
          {sosAlerts.length === 0 ? (
            <div className="bg-white rounded-xl border border-navy-200 p-8 text-center text-navy-400">
              <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
              <p className="font-semibold text-navy-700">No Active Emergency SOS Alerts</p>
              <p className="text-xs mt-1">All vehicles are operating normally under scheduled parameters.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-navy-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-navy-50 text-navy-700 font-bold border-b border-navy-200">
                    <tr>
                      <th className="py-3 px-4">Alert ID</th>
                      <th className="py-3 px-4">Bus</th>
                      <th className="py-3 px-4">Emergency Type</th>
                      <th className="py-3 px-4">Severity</th>
                      <th className="py-3 px-4">Triggered By</th>
                      <th className="py-3 px-4">Time</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-100">
                    {sosAlerts.map((alert) => (
                      <tr key={alert._id} className={alert.status === 'Active' ? 'bg-rose-50/60' : 'hover:bg-warm-50/50'}>
                        <td className="py-3 px-4 font-mono font-bold text-rose-700">{alert.alertId}</td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-navy-900">{alert.bus?.busName || 'Bus'}</span>
                          <span className="block text-[11px] text-navy-500">{alert.busRegistrationNumber}</span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-navy-900">{alert.emergencyType}</td>
                        <td className="py-3 px-4">
                          <Badge variant={alert.severity === 'Critical' ? 'danger' : 'warning'} size="sm">
                            {alert.severity}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold">{alert.triggeredByName}</span>
                          <span className="block text-[10px] text-navy-400 capitalize">{alert.triggeredByRole}</span>
                        </td>
                        <td className="py-3 px-4 text-navy-500">{new Date(alert.createdAt).toLocaleTimeString()}</td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              alert.status === 'Active'
                                ? 'danger'
                                : alert.status === 'Acknowledged'
                                ? 'warning'
                                : alert.status === 'Resolved'
                                ? 'success'
                                : 'neutral'
                            }
                            size="sm"
                          >
                            {alert.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5">
                          {alert.status === 'Active' && (
                            <Button
                              variant="amber"
                              size="xs"
                              onClick={() => {
                                setActionAlert(alert);
                                setResponseNotes('Emergency team contacted');
                              }}
                            >
                              Acknowledge
                            </Button>
                          )}

                          {['Active', 'Acknowledged', 'Response Initiated'].includes(alert.status) && (
                            <Button
                              variant="teal"
                              size="xs"
                              onClick={() => {
                                setActionAlert(alert);
                                setResponseNotes('Situation verified and resolved');
                              }}
                            >
                              Resolve
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Sub-tab Content: Incidents & Accidents */}
      {activeSubTab === 'incidents' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-navy-200">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-navy-400" />
              <input
                type="text"
                placeholder="Search incidents by ID, description, bus..."
                value={incidentSearch}
                onChange={(e) => setIncidentSearch(e.target.value)}
                className="text-xs border-none bg-transparent focus:outline-none w-64"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={incidentFilterCategory}
                onChange={(e) => setIncidentFilterCategory(e.target.value)}
                className="text-xs border border-navy-200 rounded-lg px-2.5 py-1.5 bg-white text-navy-700"
              >
                <option value="all">All Categories</option>
                <option value="Accident">Accident</option>
                <option value="Vehicle Breakdown">Vehicle Breakdown</option>
                <option value="Student Safety">Student Safety</option>
                <option value="Driver Related">Driver Related</option>
                <option value="Route Issue">Route Issue</option>
              </select>

              <select
                value={incidentFilterStatus}
                onChange={(e) => setIncidentFilterStatus(e.target.value)}
                className="text-xs border border-navy-200 rounded-lg px-2.5 py-1.5 bg-white text-navy-700"
              >
                <option value="all">All Statuses</option>
                <option value="Reported">Reported</option>
                <option value="Acknowledged">Acknowledged</option>
                <option value="Under Investigation">Under Investigation</option>
                <option value="Action Required">Action Required</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-navy-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-navy-50 text-navy-700 font-bold border-b border-navy-200">
                <tr>
                  <th className="py-3 px-4">Incident ID</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Bus</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {filteredIncidents.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-navy-400">
                      No safety incidents matching filters.
                    </td>
                  </tr>
                ) : (
                  filteredIncidents.map((inc) => (
                    <tr key={inc._id} className="hover:bg-warm-50/50">
                      <td className="py-3 px-4 font-mono font-bold text-navy-900">{inc.incidentId}</td>
                      <td className="py-3 px-4 text-navy-600">{new Date(inc.incidentDate).toLocaleDateString()}</td>
                      <td className="py-3 px-4 font-semibold text-navy-900">{inc.category}</td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            inc.severity === 'Critical'
                              ? 'danger'
                              : inc.severity === 'High'
                              ? 'warning'
                              : inc.severity === 'Medium'
                              ? 'teal'
                              : 'neutral'
                          }
                          size="sm"
                        >
                          {inc.severity}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-navy-700">{inc.busRegistrationNumber || 'N/A'}</td>
                      <td className="py-3 px-4 max-w-xs truncate text-navy-600">{inc.description}</td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            inc.status === 'Resolved' || inc.status === 'Closed'
                              ? 'success'
                              : inc.status === 'Reported'
                              ? 'danger'
                              : 'warning'
                          }
                          size="sm"
                        >
                          {inc.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => {
                            setActionIncident(inc);
                            setIncidentStatusForm({
                              status: inc.status,
                              investigationNotes: inc.investigationNotes || '',
                              correctiveActions: inc.correctiveActions || '',
                              resolutionDetails: inc.resolutionDetails || ''
                            });
                          }}
                        >
                          Manage
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Sub-tab Content: Geofences & Overspeed */}
      {activeSubTab === 'geofences' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-navy-900">Configured Geofences & Speed Zones</h3>
            <Button
              variant="teal"
              size="sm"
              icon={Plus}
              onClick={() => setShowGeofenceModal(true)}
            >
              Add Geofence Zone
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {geofences.map((gf) => (
              <div key={gf._id} className="bg-white p-4 rounded-xl border border-navy-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-navy-900">{gf.name}</span>
                  <Badge variant="teal" size="sm">{gf.geofenceType}</Badge>
                </div>
                <div className="text-xs text-navy-500 space-y-1">
                  <p>Center: {gf.center?.latitude.toFixed(4)}, {gf.center?.longitude.toFixed(4)}</p>
                  <p>Radius: {gf.radiusMeters} meters</p>
                  <p>Speed Threshold: <span className="font-bold text-amber-700">{gf.speedLimitKmh} km/h</span></p>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Overspeed Events */}
          <div className="bg-white rounded-xl border border-navy-200 p-5 space-y-3">
            <h4 className="text-xs font-bold text-navy-700 uppercase tracking-wider flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-blue-600" />
              Recent Overspeed Breaches
            </h4>
            {overspeedEvents.length === 0 ? (
              <p className="text-xs text-navy-400 py-3">No speed limit breaches recorded.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-navy-50 text-navy-700">
                    <tr>
                      <th className="py-2 px-3">Vehicle</th>
                      <th className="py-2 px-3">Recorded Speed</th>
                      <th className="py-2 px-3">Speed Limit</th>
                      <th className="py-2 px-3">Driver</th>
                      <th className="py-2 px-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-100">
                    {overspeedEvents.slice(0, 10).map((evt) => (
                      <tr key={evt._id}>
                        <td className="py-2 px-3 font-semibold text-navy-900">{evt.busRegistrationNumber || 'Bus'}</td>
                        <td className="py-2 px-3 text-rose-600 font-bold">{evt.speed} km/h</td>
                        <td className="py-2 px-3 text-navy-500">{evt.speedLimit} km/h</td>
                        <td className="py-2 px-3">{evt.driverName || 'Assigned Driver'}</td>
                        <td className="py-2 px-3 text-navy-400">{new Date(evt.timestamp).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Trigger SOS */}
      {showSosModal && (
        <Modal
          isOpen={showSosModal}
          onClose={() => setShowSosModal(false)}
          title="TRIGGER EMERGENCY SOS BROADCAST"
        >
          <form onSubmit={handleTriggerSos} className="space-y-4 text-xs">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px] leading-relaxed">
              <span className="font-bold">CRITICAL WARNING:</span> Triggering SOS immediately alerts the Transport Command Control, Supervisors, and Admin teams with vehicle details and location data.
            </div>

            <div>
              <label className="block font-semibold text-navy-700 mb-1">Select Vehicle *</label>
              <select
                required
                value={sosForm.bus}
                onChange={(e) => setSosForm({ ...sosForm, bus: e.target.value })}
                className="w-full border border-navy-200 rounded-lg p-2.5 bg-white text-navy-900 text-xs"
              >
                <option value="">-- Select Bus Under Emergency --</option>
                {buses.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.busName} ({b.registrationNumber}) - Status: {b.currentStatus}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-navy-700 mb-1">Emergency Category *</label>
                <select
                  value={sosForm.emergencyType}
                  onChange={(e) => setSosForm({ ...sosForm, emergencyType: e.target.value })}
                  className="w-full border border-navy-200 rounded-lg p-2.5 bg-white text-navy-900 text-xs"
                >
                  <option value="Medical Emergency">Medical Emergency</option>
                  <option value="Accident">Accident</option>
                  <option value="Vehicle Breakdown">Vehicle Breakdown</option>
                  <option value="Student Safety Issue">Student Safety Issue</option>
                  <option value="Fire Emergency">Fire Emergency</option>
                  <option value="Security Issue">Security Issue</option>
                  <option value="Other Emergency">Other Emergency</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-navy-700 mb-1">Severity *</label>
                <select
                  value={sosForm.severity}
                  onChange={(e) => setSosForm({ ...sosForm, severity: e.target.value })}
                  className="w-full border border-navy-200 rounded-lg p-2.5 bg-white text-navy-900 text-xs font-bold text-rose-700"
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-navy-700 mb-1">Emergency Situation Notes</label>
              <textarea
                rows={3}
                placeholder="Describe current location landmarks, student condition, assistance required..."
                value={sosForm.description}
                onChange={(e) => setSosForm({ ...sosForm, description: e.target.value })}
                className="w-full border border-navy-200 rounded-lg p-2.5 text-xs text-navy-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-navy-100">
              <Button variant="outline" size="sm" onClick={() => setShowSosModal(false)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" type="submit" icon={Siren}>
                BROADCAST SOS ALERT
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: Report Incident */}
      {showIncidentModal && (
        <Modal
          isOpen={showIncidentModal}
          onClose={() => setShowIncidentModal(false)}
          title="Log Transport Safety Incident"
        >
          <form onSubmit={handleCreateIncident} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-navy-700 mb-1">Category *</label>
                <select
                  value={incidentForm.category}
                  onChange={(e) => setIncidentForm({ ...incidentForm, category: e.target.value })}
                  className="w-full border border-navy-200 rounded-lg p-2.5 bg-white text-navy-900 text-xs"
                >
                  <option value="Accident">Accident</option>
                  <option value="Vehicle Breakdown">Vehicle Breakdown</option>
                  <option value="Student Safety">Student Safety</option>
                  <option value="Driver Related">Driver Related</option>
                  <option value="Route Issue">Route Issue</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-navy-700 mb-1">Severity *</label>
                <select
                  value={incidentForm.severity}
                  onChange={(e) => setIncidentForm({ ...incidentForm, severity: e.target.value })}
                  className="w-full border border-navy-200 rounded-lg p-2.5 bg-white text-navy-900 text-xs"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-navy-700 mb-1">Associated Bus</label>
                <select
                  value={incidentForm.bus}
                  onChange={(e) => setIncidentForm({ ...incidentForm, bus: e.target.value })}
                  className="w-full border border-navy-200 rounded-lg p-2.5 bg-white text-navy-900 text-xs"
                >
                  <option value="">-- No Bus Linked --</option>
                  {buses.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.busName} ({b.registrationNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-navy-700 mb-1">Incident Date *</label>
                <input
                  type="date"
                  required
                  value={incidentForm.incidentDate}
                  onChange={(e) => setIncidentForm({ ...incidentForm, incidentDate: e.target.value })}
                  className="w-full border border-navy-200 rounded-lg p-2 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-navy-700 mb-1">Incident Description *</label>
              <textarea
                required
                rows={3}
                placeholder="Provide accurate description of the incident, people involved, damages..."
                value={incidentForm.description}
                onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })}
                className="w-full border border-navy-200 rounded-lg p-2.5 text-xs text-navy-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-navy-100">
              <Button variant="outline" size="sm" onClick={() => setShowIncidentModal(false)}>
                Cancel
              </Button>
              <Button variant="teal" size="sm" type="submit">
                Log Incident
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: Manage Incident Status */}
      {actionIncident && (
        <Modal
          isOpen={!!actionIncident}
          onClose={() => setActionIncident(null)}
          title={`Manage Incident: ${actionIncident.incidentId}`}
        >
          <form onSubmit={handleUpdateIncidentStatus} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-navy-700 mb-1">Update Status</label>
              <select
                value={incidentStatusForm.status}
                onChange={(e) => setIncidentStatusForm({ ...incidentStatusForm, status: e.target.value })}
                className="w-full border border-navy-200 rounded-lg p-2.5 bg-white text-navy-900 text-xs"
              >
                <option value="Reported">Reported</option>
                <option value="Acknowledged">Acknowledged</option>
                <option value="Under Investigation">Under Investigation</option>
                <option value="Action Required">Action Required</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-navy-700 mb-1">Investigation Notes</label>
              <textarea
                rows={2}
                value={incidentStatusForm.investigationNotes}
                onChange={(e) => setIncidentStatusForm({ ...incidentStatusForm, investigationNotes: e.target.value })}
                className="w-full border border-navy-200 rounded-lg p-2 text-xs text-navy-900"
                placeholder="Findings from investigation..."
              />
            </div>

            <div>
              <label className="block font-semibold text-navy-700 mb-1">Corrective Actions</label>
              <textarea
                rows={2}
                value={incidentStatusForm.correctiveActions}
                onChange={(e) => setIncidentStatusForm({ ...incidentStatusForm, correctiveActions: e.target.value })}
                className="w-full border border-navy-200 rounded-lg p-2 text-xs text-navy-900"
                placeholder="Measures taken to prevent recurrence..."
              />
            </div>

            <div>
              <label className="block font-semibold text-navy-700 mb-1">Resolution Details</label>
              <textarea
                rows={2}
                value={incidentStatusForm.resolutionDetails}
                onChange={(e) => setIncidentStatusForm({ ...incidentStatusForm, resolutionDetails: e.target.value })}
                className="w-full border border-navy-200 rounded-lg p-2 text-xs text-navy-900"
                placeholder="Final closure report..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-navy-100">
              <Button variant="outline" size="sm" onClick={() => setActionIncident(null)}>
                Cancel
              </Button>
              <Button variant="teal" size="sm" type="submit">
                Save Updates
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: Add Geofence */}
      {showGeofenceModal && (
        <Modal
          isOpen={showGeofenceModal}
          onClose={() => setShowGeofenceModal(false)}
          title="Create New Geofence Zone"
        >
          <form onSubmit={handleCreateGeofence} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-navy-700 mb-1">Zone Name *</label>
              <input
                required
                type="text"
                placeholder="e.g. Apex College Campus Hub"
                value={geofenceForm.name}
                onChange={(e) => setGeofenceForm({ ...geofenceForm, name: e.target.value })}
                className="w-full border border-navy-200 rounded-lg p-2.5 text-xs text-navy-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-navy-700 mb-1">Zone Type</label>
                <select
                  value={geofenceForm.geofenceType}
                  onChange={(e) => setGeofenceForm({ ...geofenceForm, geofenceType: e.target.value })}
                  className="w-full border border-navy-200 rounded-lg p-2.5 bg-white text-navy-900 text-xs"
                >
                  <option value="Campus">Campus</option>
                  <option value="Pickup/Drop Stop">Pickup/Drop Stop</option>
                  <option value="Restricted Zone">Restricted Zone</option>
                  <option value="High Risk Area">High Risk Area</option>
                  <option value="Depot">Depot</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-navy-700 mb-1">Radius (Meters) *</label>
                <input
                  type="number"
                  min="10"
                  required
                  value={geofenceForm.radiusMeters}
                  onChange={(e) => setGeofenceForm({ ...geofenceForm, radiusMeters: e.target.value })}
                  className="w-full border border-navy-200 rounded-lg p-2 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-navy-700 mb-1">Center Latitude *</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={geofenceForm.latitude}
                  onChange={(e) => setGeofenceForm({ ...geofenceForm, latitude: e.target.value })}
                  className="w-full border border-navy-200 rounded-lg p-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-navy-700 mb-1">Center Longitude *</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={geofenceForm.longitude}
                  onChange={(e) => setGeofenceForm({ ...geofenceForm, longitude: e.target.value })}
                  className="w-full border border-navy-200 rounded-lg p-2 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-navy-700 mb-1">Speed Limit Inside Zone (km/h)</label>
              <input
                type="number"
                min="5"
                max="120"
                value={geofenceForm.speedLimitKmh}
                onChange={(e) => setGeofenceForm({ ...geofenceForm, speedLimitKmh: e.target.value })}
                className="w-full border border-navy-200 rounded-lg p-2 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-navy-100">
              <Button variant="outline" size="sm" onClick={() => setShowGeofenceModal(false)}>
                Cancel
              </Button>
              <Button variant="teal" size="sm" type="submit">
                Register Geofence
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: Action SOS Response / Acknowledge */}
      {actionAlert && (
        <Modal
          isOpen={!!actionAlert}
          onClose={() => setActionAlert(null)}
          title={`Emergency Action: ${actionAlert.alertId}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-warm-50 rounded-lg border border-navy-200">
              <p><span className="font-bold">Bus:</span> {actionAlert.busRegistrationNumber}</p>
              <p><span className="font-bold">Type:</span> {actionAlert.emergencyType}</p>
              <p><span className="font-bold">Severity:</span> {actionAlert.severity}</p>
              <p><span className="font-bold">Description:</span> {actionAlert.description}</p>
            </div>

            <div>
              <label className="block font-semibold text-navy-700 mb-1">Action & Response Notes</label>
              <textarea
                rows={3}
                value={responseNotes}
                onChange={(e) => setResponseNotes(e.target.value)}
                placeholder="State response measures taken or resolution summary..."
                className="w-full border border-navy-200 rounded-lg p-2.5 text-xs text-navy-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-navy-100">
              <Button variant="outline" size="sm" onClick={() => setActionAlert(null)}>
                Cancel
              </Button>
              {actionAlert.status === 'Active' && (
                <Button variant="amber" size="sm" onClick={() => handleAcknowledgeSos(actionAlert._id)}>
                  Acknowledge SOS
                </Button>
              )}
              <Button variant="teal" size="sm" onClick={() => handleResolveSos(actionAlert._id)}>
                Resolve Emergency
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

