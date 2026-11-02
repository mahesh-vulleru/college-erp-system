import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  BarChart3,
  Calendar,
  Filter,
  RefreshCw,
  Bus,
  Users,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Fuel,
  Wrench,
  DollarSign,
  Award,
  ChevronRight,
  Activity,
  CheckCircle2,
  XCircle,
  FileSpreadsheet
} from 'lucide-react';
import Card from '../../components/common/Card';
import StatWidget from '../../components/common/StatWidget';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import Input from '../../components/common/Input';
import Table from '../../components/common/Table';
import EmptyState from '../../components/common/EmptyState';
import api from '../../api/apiClient';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export const TransportAnalyticsDashboard = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [activeCategory, setActiveCategory] = useState('executive');
  const [dateRange, setDateRange] = useState('last30days');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [loading, setLoading] = useState(true);

  // Analytics datasets
  const [executiveData, setExecutiveData] = useState(null);
  const [fleetData, setFleetData] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [driverData, setDriverData] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [tripData, setTripData] = useState(null);
  const [fuelMaintData, setFuelMaintData] = useState(null);
  const [financeData, setFinanceData] = useState(null);
  const [safetyData, setSafetyData] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const params = { range: dateRange };
      if (dateRange === 'custom' && customStart && customEnd) {
        params.startDate = customStart;
        params.endDate = customEnd;
      }

      if (activeCategory === 'executive') {
        const res = await api.getTransportExecutiveAnalytics(params);
        if (res.success) setExecutiveData(res);
      } else if (activeCategory === 'fleet') {
        const res = await api.getTransportFleetAnalytics(params);
        if (res.success) setFleetData(res);
      } else if (activeCategory === 'routes') {
        const res = await api.getTransportRouteAnalytics(params);
        if (res.success) setRouteData(res);
      } else if (activeCategory === 'drivers') {
        const res = await api.getTransportDriverAnalytics(params);
        if (res.success) setDriverData(res);
      } else if (activeCategory === 'students') {
        const res = await api.getTransportStudentAnalytics(params);
        if (res.success) setStudentData(res);
      } else if (activeCategory === 'trips') {
        const res = await api.getTransportTripAnalytics(params);
        if (res.success) setTripData(res);
      } else if (activeCategory === 'fuel_maint') {
        const res = await api.getTransportFuelAnalytics(params);
        if (res.success) setFuelMaintData(res);
      } else if (activeCategory === 'finance') {
        const res = await api.getTransportFinancialAnalytics(params);
        if (res.success) setFinanceData(res);
      } else if (activeCategory === 'safety') {
        const res = await api.getTransportSafetyAnalytics(params);
        if (res.success) setSafetyData(res);
      }
    } catch (err) {
      addToast(err.message || 'Failed to fetch analytics', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeCategory, dateRange, customStart, customEnd, addToast]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const categories = [
    { id: 'executive', label: 'Executive Dashboard', icon: TrendingUp },
    { id: 'fleet', label: 'Fleet & Vehicles', icon: Bus },
    { id: 'routes', label: 'Route Performance', icon: MapPin },
    { id: 'drivers', label: 'Driver Analytics', icon: Award },
    { id: 'students', label: 'Student Transport', icon: Users },
    { id: 'trips', label: 'Trips & Attendance', icon: Activity },
    { id: 'fuel_maint', label: 'Fuel & Maintenance', icon: Fuel },
    { id: 'finance', label: 'Financial Analytics', icon: DollarSign },
    { id: 'safety', label: 'Safety & Incidents', icon: ShieldCheck }
  ];

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            Transport Analytics & Intelligence
          </h2>
          <p className="text-sm text-slate-500">
            Real-time data-driven metrics, operational trends, and performance insights
          </p>
        </div>

        {/* Date Filter & Refresh */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
            <Calendar className="w-4 h-4 text-slate-500" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent border-none text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7days">Last 7 Days</option>
              <option value="last30days">Last 30 Days</option>
              <option value="thismonth">This Month</option>
              <option value="lastmonth">Last Month</option>
              <option value="thisyear">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {dateRange === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="text-xs border border-slate-300 rounded px-2 py-1"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="text-xs border border-slate-300 rounded px-2 py-1"
              />
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={fetchAnalytics}
            className="flex items-center gap-1.5 text-xs"
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Analytics Category Navigation Bar */}
      <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-none">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shadow-sm ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-indigo-100'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Content Panels */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3 bg-white rounded-xl border border-slate-200">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-sm font-medium text-slate-500">Calculating real-time analytics from database records...</p>
        </div>
      ) : (
        <>
          {/* 1. EXECUTIVE DASHBOARD OVERVIEW */}
          {activeCategory === 'executive' && executiveData && (
            <div className="space-y-6">
              {/* 16 Executive KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase">Total Buses</p>
                  <p className="text-xl font-bold text-slate-900 mt-1">{executiveData.kpis.totalVehicles}</p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                  <p className="text-[11px] font-semibold text-emerald-600 uppercase">Active Buses</p>
                  <p className="text-xl font-bold text-emerald-700 mt-1">{executiveData.kpis.activeVehicles}</p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                  <p className="text-[11px] font-semibold text-amber-600 uppercase">Under Maint.</p>
                  <p className="text-xl font-bold text-amber-700 mt-1">{executiveData.kpis.maintenanceVehicles}</p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                  <p className="text-[11px] font-semibold text-blue-600 uppercase">Total Drivers</p>
                  <p className="text-xl font-bold text-blue-700 mt-1">{executiveData.kpis.totalDrivers}</p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                  <p className="text-[11px] font-semibold text-indigo-600 uppercase">Students</p>
                  <p className="text-xl font-bold text-indigo-700 mt-1">{executiveData.kpis.totalStudents}</p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase">Active Routes</p>
                  <p className="text-xl font-bold text-slate-800 mt-1">{executiveData.kpis.activeRoutes}</p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                  <p className="text-[11px] font-semibold text-teal-600 uppercase">Trips Done</p>
                  <p className="text-xl font-bold text-teal-700 mt-1">
                    {executiveData.kpis.todayCompletedTrips} / {executiveData.kpis.todayScheduledTrips}
                  </p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                  <p className="text-[11px] font-semibold text-violet-600 uppercase">Attendance</p>
                  <p className="text-xl font-bold text-violet-700 mt-1">{executiveData.kpis.todayAttendanceRate}%</p>
                </div>
              </div>

              {/* Second row of Executive Financial & Safety KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-amber-800">Total Fuel Expenses</p>
                      <p className="text-2xl font-bold text-amber-900 mt-1">
                        ₹{(executiveData.kpis.totalFuelExpenses || 0).toLocaleString()}
                      </p>
                    </div>
                    <Fuel className="w-8 h-8 text-amber-600 opacity-80" />
                  </div>
                </Card>
                <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-blue-800">Maintenance Expenses</p>
                      <p className="text-2xl font-bold text-blue-900 mt-1">
                        ₹{(executiveData.kpis.totalMaintenanceExpenses || 0).toLocaleString()}
                      </p>
                    </div>
                    <Wrench className="w-8 h-8 text-blue-600 opacity-80" />
                  </div>
                </Card>
                <Card className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-emerald-800">Fee Collection</p>
                      <p className="text-2xl font-bold text-emerald-900 mt-1">
                        ₹{(executiveData.kpis.totalCollectedFees || 0).toLocaleString()}
                      </p>
                      <p className="text-[11px] text-emerald-700 mt-0.5">
                        Pending: ₹{(executiveData.kpis.pendingTransportFees || 0).toLocaleString()}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-emerald-600 opacity-80" />
                  </div>
                </Card>
                <Card className="p-4 bg-gradient-to-br from-rose-50 to-red-50 border-rose-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-rose-800">Safety Incidents</p>
                      <p className="text-2xl font-bold text-rose-900 mt-1">{executiveData.kpis.totalSafetyIncidents}</p>
                      <p className="text-[11px] text-rose-700 mt-0.5">Reported in selected range</p>
                    </div>
                    <ShieldCheck className="w-8 h-8 text-rose-600 opacity-80" />
                  </div>
                </Card>
              </div>

              {/* Monthly Trend Visualizations */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-5">
                  <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center justify-between">
                    <span>Monthly Operating Cost Breakdown</span>
                    <span className="text-xs font-normal text-slate-500">Last 6 Months</span>
                  </h3>
                  {executiveData.visualizations.monthlyTransportExpenses.length === 0 ? (
                    <EmptyState title="No historical cost data" description="Operating expenses will render here as records are recorded." />
                  ) : (
                    <div className="space-y-3">
                      {executiveData.visualizations.monthlyTransportExpenses.map((m) => (
                        <div key={m.month} className="space-y-1">
                          <div className="flex justify-between text-xs font-medium text-slate-700">
                            <span>{m.month}</span>
                            <span className="font-bold">₹{(m.total || 0).toLocaleString()}</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-3 flex overflow-hidden">
                            <div
                              style={{ width: `${m.total > 0 ? (m.fuelCost / m.total) * 100 : 0}%` }}
                              className="bg-amber-500 h-full"
                              title={`Fuel: ₹${m.fuelCost}`}
                            />
                            <div
                              style={{ width: `${m.total > 0 ? (m.maintenanceCost / m.total) * 100 : 0}%` }}
                              className="bg-blue-500 h-full"
                              title={`Maintenance: ₹${m.maintenanceCost}`}
                            />
                            <div
                              style={{ width: `${m.total > 0 ? (m.otherExpenses / m.total) * 100 : 0}%` }}
                              className="bg-violet-500 h-full"
                              title={`General: ₹${m.otherExpenses}`}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-400">
                            <span>Fuel: ₹{(m.fuelCost || 0).toLocaleString()}</span>
                            <span>Maint: ₹{(m.maintenanceCost || 0).toLocaleString()}</span>
                            <span>Other: ₹{(m.otherExpenses || 0).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Route-wise Student Distribution */}
                <Card className="p-5">
                  <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center justify-between">
                    <span>Top Routes by Student Density</span>
                    <span className="text-xs font-normal text-slate-500">Assigned Allocations</span>
                  </h3>
                  {executiveData.visualizations.routeDistribution.length === 0 ? (
                    <EmptyState title="No active routes assigned" description="Route allocations will appear here." />
                  ) : (
                    <div className="space-y-3">
                      {executiveData.visualizations.routeDistribution.map((r, i) => (
                        <div key={r.routeId || i} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold text-slate-800">
                              {r.routeName} <span className="text-slate-400 text-[11px]">({r.routeCode})</span>
                            </span>
                            <span className="font-bold text-indigo-600">{r.studentCount} students</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div
                              className="bg-indigo-600 h-2 rounded-full"
                              style={{ width: `${Math.min(100, (r.studentCount / 60) * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          )}

          {/* 2. FLEET & VEHICLE ANALYTICS */}
          {activeCategory === 'fleet' && fleetData && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatWidget label="Fleet Capacity" value={fleetData.summary.totalFleetCapacity} icon={Bus} color="indigo" />
                <StatWidget label="Total Allocated Seats" value={fleetData.summary.totalAllocatedStudents} icon={Users} color="emerald" />
                <StatWidget
                  label="Fleet Utilization"
                  value={`${fleetData.summary.overallCapacityUtilization}%`}
                  icon={Activity}
                  color="teal"
                />
                <StatWidget
                  label="Active vs Idle Buses"
                  value={`${fleetData.summary.activeFleet} / ${fleetData.summary.inactiveFleet}`}
                  icon={ShieldCheck}
                  color="blue"
                />
              </div>

              <Card className="p-5 overflow-x-auto">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Vehicle Operational Performance Ledger</h3>
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase">
                      <th className="py-2.5 px-3">Vehicle</th>
                      <th className="py-2.5 px-3">Type & Status</th>
                      <th className="py-2.5 px-3">Capacity Utilization</th>
                      <th className="py-2.5 px-3">Completed Trips</th>
                      <th className="py-2.5 px-3">Fuel Consumed</th>
                      <th className="py-2.5 px-3">Total Operating Cost</th>
                      <th className="py-2.5 px-3">Compliance Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {fleetData.vehicles.map((v) => (
                      <tr key={v._id} className="hover:bg-slate-50">
                        <td className="py-3 px-3">
                          <p className="font-semibold text-slate-800">{v.busName}</p>
                          <p className="text-[11px] text-slate-500">{v.registrationNumber}</p>
                        </td>
                        <td className="py-3 px-3">
                          <Badge variant={v.currentStatus === 'active' ? 'success' : v.currentStatus === 'under_maintenance' ? 'warning' : 'secondary'}>
                            {v.currentStatus}
                          </Badge>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">{v.allocatedStudents} / {v.capacity}</span>
                            <span className="text-slate-400">({v.capacityUtilization}%)</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-700">{v.metrics.completedTrips}</td>
                        <td className="py-3 px-3">
                          <p className="font-semibold text-slate-800">{v.metrics.totalFuelLiters} L</p>
                          <p className="text-[10px] text-slate-400">₹{(v.metrics.totalFuelCost || 0).toLocaleString()}</p>
                        </td>
                        <td className="py-3 px-3 font-bold text-indigo-600">
                          ₹{(v.metrics.totalOperatingCost || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-3">
                          {v.documentStatuses.some((d) => d.status === 'expired') ? (
                            <Badge variant="danger">Expired Docs</Badge>
                          ) : v.documentStatuses.some((d) => d.status === 'expiring_soon') ? (
                            <Badge variant="warning">Expiring Soon</Badge>
                          ) : (
                            <Badge variant="success">Compliant</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          )}

          {/* 3. ROUTE PERFORMANCE ANALYTICS */}
          {activeCategory === 'routes' && routeData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 bg-indigo-50 border-indigo-200">
                  <p className="text-xs font-semibold text-indigo-700">Total Monitored Routes</p>
                  <p className="text-2xl font-bold text-indigo-900 mt-1">{routeData.totalRoutes}</p>
                </Card>
                <Card className="p-4 bg-emerald-50 border-emerald-200">
                  <p className="text-xs font-semibold text-emerald-700">Top Dense Route</p>
                  <p className="text-lg font-bold text-emerald-900 mt-1 truncate">
                    {routeData.topRoutes[0]?.routeName || 'N/A'}
                  </p>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    {routeData.topRoutes[0]?.assignedStudents || 0} students assigned
                  </p>
                </Card>
                <Card className="p-4 bg-teal-50 border-teal-200">
                  <p className="text-xs font-semibold text-teal-700">Average Route Attendance</p>
                  <p className="text-2xl font-bold text-teal-900 mt-1">
                    {Math.round(
                      routeData.routes.reduce((acc, r) => acc + (r.attendancePercentage || 0), 0) /
                        Math.max(1, routeData.routes.length)
                    )}%
                  </p>
                </Card>
              </div>

              <Card className="p-5 overflow-x-auto">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Route Performance Metrics</h3>
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase">
                      <th className="py-2.5 px-3">Route</th>
                      <th className="py-2.5 px-3">Distance & Stops</th>
                      <th className="py-2.5 px-3">Assigned Students</th>
                      <th className="py-2.5 px-3">Trip Completion</th>
                      <th className="py-2.5 px-3">Avg Trip Duration</th>
                      <th className="py-2.5 px-3">Attendance Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {routeData.routes.map((r) => (
                      <tr key={r._id} className="hover:bg-slate-50">
                        <td className="py-3 px-3">
                          <p className="font-semibold text-slate-800">{r.routeName}</p>
                          <p className="text-[11px] text-slate-500">{r.routeCode}</p>
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-medium text-slate-700">{r.totalDistanceKm} km</p>
                          <p className="text-[11px] text-slate-400">{r.stopsCount} intermediate stops</p>
                        </td>
                        <td className="py-3 px-3 font-bold text-indigo-600">{r.assignedStudents}</td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-800">{r.tripCompletionRate}%</span>
                          <span className="text-[11px] text-slate-400 block">
                            {r.completedTripsCount} done, {r.cancelledTripsCount} cancelled
                          </span>
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-700">
                          {r.averageDurationMinutes > 0 ? `${r.averageDurationMinutes} mins` : 'N/A'}
                        </td>
                        <td className="py-3 px-3">
                          <Badge variant={r.attendancePercentage >= 80 ? 'success' : 'warning'}>
                            {r.attendancePercentage}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          )}

          {/* 4. DRIVER PERFORMANCE ANALYTICS */}
          {activeCategory === 'drivers' && driverData && (
            <div className="space-y-6">
              <Card className="p-5 overflow-x-auto">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Driver Performance Scorecard</h3>
                    <p className="text-xs text-slate-500">
                      Evaluated transparently: Completed Trips (+0.5) − Cancelled (−5) − Overspeeds (−3) − Safety Incidents (−10)
                    </p>
                  </div>
                  <Badge variant="secondary">{driverData.totalDrivers} Drivers Tracked</Badge>
                </div>

                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase">
                      <th className="py-2.5 px-3">Driver</th>
                      <th className="py-2.5 px-3">Assigned Vehicle</th>
                      <th className="py-2.5 px-3">Completed Trips</th>
                      <th className="py-2.5 px-3">Cancelled</th>
                      <th className="py-2.5 px-3">Overspeeds</th>
                      <th className="py-2.5 px-3">Safety Incidents</th>
                      <th className="py-2.5 px-3">Score & Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {driverData.drivers.map((d) => (
                      <tr key={d._id} className="hover:bg-slate-50">
                        <td className="py-3 px-3">
                          <p className="font-semibold text-slate-800">{d.fullName}</p>
                          <p className="text-[11px] text-slate-500">{d.driverId} • {d.contactNumber}</p>
                        </td>
                        <td className="py-3 px-3 text-slate-700">
                          {d.assignedBus ? `${d.assignedBus.busName} (${d.assignedBus.registrationNumber})` : 'Unassigned'}
                        </td>
                        <td className="py-3 px-3 font-bold text-emerald-600">{d.metrics.completedTrips}</td>
                        <td className="py-3 px-3 font-semibold text-rose-600">{d.metrics.cancelledTrips}</td>
                        <td className="py-3 px-3 font-semibold text-amber-600">{d.metrics.overspeedCount}</td>
                        <td className="py-3 px-3 font-semibold text-rose-700">{d.metrics.incidentsCount}</td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className="text-base font-extrabold text-slate-900">{d.metrics.performanceScore}</span>
                            <Badge
                              variant={
                                d.metrics.performanceGrade === 'A'
                                  ? 'success'
                                  : d.metrics.performanceGrade === 'B'
                                  ? 'primary'
                                  : d.metrics.performanceGrade === 'C'
                                  ? 'warning'
                                  : 'danger'
                              }
                            >
                              Grade {d.metrics.performanceGrade}
                            </Badge>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          )}

          {/* 5. STUDENT TRANSPORT ANALYTICS */}
          {activeCategory === 'students' && studentData && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatWidget label="Total Students" value={studentData.summary.totalStudents} icon={Users} color="indigo" />
                <StatWidget label="Active Allocations" value={studentData.summary.activeAllocations} icon={CheckCircle2} color="emerald" />
                <StatWidget label="Boarding Attendance" value={`${studentData.summary.boardingRate}%`} icon={Activity} color="teal" />
                <StatWidget label="Total Absences Recorded" value={studentData.summary.absentCount} icon={XCircle} color="rose" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-5">
                  <h3 className="text-sm font-bold text-slate-800 mb-3">Department-wise Transport Distribution</h3>
                  <div className="space-y-2">
                    {Object.entries(studentData.distributions.byDepartment).map(([dept, count]) => (
                      <div key={dept} className="flex justify-between items-center text-xs p-2 rounded bg-slate-50">
                        <span className="font-medium text-slate-700">{dept}</span>
                        <Badge variant="secondary">{count} students</Badge>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-5">
                  <h3 className="text-sm font-bold text-slate-800 mb-3">Top Pick-up & Drop Stops</h3>
                  <div className="space-y-2">
                    {Object.entries(studentData.distributions.byStop)
                      .slice(0, 6)
                      .map(([stop, count]) => (
                        <div key={stop} className="flex justify-between items-center text-xs p-2 rounded bg-slate-50">
                          <span className="font-medium text-slate-700 truncate">{stop}</span>
                          <span className="font-bold text-indigo-600">{count} students</span>
                        </div>
                      ))}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* 6. TRIPS & ATTENDANCE */}
          {activeCategory === 'trips' && tripData && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <StatWidget label="Scheduled Trips" value={tripData.tripsSummary.totalScheduled} icon={Calendar} color="indigo" />
                <StatWidget label="Completed" value={tripData.tripsSummary.completedCount} icon={CheckCircle2} color="emerald" />
                <StatWidget label="Cancelled" value={tripData.tripsSummary.cancelledCount} icon={XCircle} color="rose" />
                <StatWidget label="Delayed Trips" value={tripData.tripsSummary.delayedCount} icon={Clock} color="amber" />
                <StatWidget label="Completion Rate" value={`${tripData.tripsSummary.completionRate}%`} icon={Activity} color="teal" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-5 bg-emerald-50 border-emerald-200">
                  <p className="text-xs font-semibold text-emerald-800">Total Student Boardings</p>
                  <p className="text-3xl font-bold text-emerald-900 mt-2">{tripData.attendanceSummary.boardedCount}</p>
                  <p className="text-xs text-emerald-700 mt-1">Confirmed with RFID / Attendant tap</p>
                </Card>
                <Card className="p-5 bg-teal-50 border-teal-200">
                  <p className="text-xs font-semibold text-teal-800">Total Student Drops</p>
                  <p className="text-3xl font-bold text-teal-900 mt-2">{tripData.attendanceSummary.droppedCount}</p>
                  <p className="text-xs text-teal-700 mt-1">Confirmed at designated stop</p>
                </Card>
                <Card className="p-5 bg-rose-50 border-rose-200">
                  <p className="text-xs font-semibold text-rose-800">Absences / Unboarded</p>
                  <p className="text-3xl font-bold text-rose-900 mt-2">{tripData.attendanceSummary.absentCount}</p>
                  <p className="text-xs text-rose-700 mt-1">Absence notified to parents</p>
                </Card>
              </div>
            </div>
          )}

          {/* 7. FUEL & MAINTENANCE ANALYTICS */}
          {activeCategory === 'fuel_maint' && fuelMaintData && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatWidget
                  label="Total Fuel Cost"
                  value={`₹${(fuelMaintData.summary.totalFuelExpenses || 0).toLocaleString()}`}
                  icon={Fuel}
                  color="amber"
                />
                <StatWidget
                  label="Total Fuel Liters"
                  value={`${fuelMaintData.summary.totalFuelLiters} L`}
                  icon={Fuel}
                  color="amber"
                />
                <StatWidget
                  label="Maintenance Expenses"
                  value={`₹${(fuelMaintData.summary.totalMaintenanceExpenses || 0).toLocaleString()}`}
                  icon={Wrench}
                  color="blue"
                />
                <StatWidget
                  label="Avg Fuel Rate"
                  value={`₹${fuelMaintData.summary.averageFuelRate}/L`}
                  icon={DollarSign}
                  color="teal"
                />
              </div>

              <Card className="p-5 overflow-x-auto">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Vehicle Operating Cost Comparison</h3>
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase">
                      <th className="py-2.5 px-3">Vehicle</th>
                      <th className="py-2.5 px-3">Fuel Liters</th>
                      <th className="py-2.5 px-3">Fuel Cost</th>
                      <th className="py-2.5 px-3">Maintenance Cost</th>
                      <th className="py-2.5 px-3">Combined Operating Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {fuelMaintData.vehicleCostComparison.map((vc, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-semibold text-slate-800">{vc.vehicle}</td>
                        <td className="py-3 px-3 text-slate-600">{vc.fuelLiters} L</td>
                        <td className="py-3 px-3 text-amber-700 font-medium">₹{vc.fuelCost.toLocaleString()}</td>
                        <td className="py-3 px-3 text-blue-700 font-medium">₹{vc.maintenanceCost.toLocaleString()}</td>
                        <td className="py-3 px-3 font-bold text-slate-900">₹{vc.totalOperatingCost.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          )}

          {/* 8. FINANCIAL ANALYTICS */}
          {activeCategory === 'finance' && financeData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 bg-indigo-50 border-indigo-200">
                  <p className="text-xs font-semibold text-indigo-700">Total Fee Demand</p>
                  <p className="text-2xl font-bold text-indigo-900 mt-1">
                    ₹{(financeData.revenue.totalFeeDemand || 0).toLocaleString()}
                  </p>
                </Card>
                <Card className="p-4 bg-emerald-50 border-emerald-200">
                  <p className="text-xs font-semibold text-emerald-700">Total Fee Collected</p>
                  <p className="text-2xl font-bold text-emerald-900 mt-1">
                    ₹{(financeData.revenue.totalCollectedAmount || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    {financeData.revenue.collectionPercentage}% Collection Rate
                  </p>
                </Card>
                <Card className="p-4 bg-amber-50 border-amber-200">
                  <p className="text-xs font-semibold text-amber-700">Total Operating Expenses</p>
                  <p className="text-2xl font-bold text-amber-900 mt-1">
                    ₹{(financeData.operatingExpenses.totalOperatingCost || 0).toLocaleString()}
                  </p>
                  <p className="text-[11px] text-amber-600 mt-0.5">Fuel + Maintenance + Misc</p>
                </Card>
                <Card className={`p-4 border ${financeData.financialHealth.isProfitable ? 'bg-teal-50 border-teal-200' : 'bg-rose-50 border-rose-200'}`}>
                  <p className="text-xs font-semibold text-slate-700">Net Operating Margin</p>
                  <p className={`text-2xl font-bold mt-1 ${financeData.financialHealth.isProfitable ? 'text-teal-900' : 'text-rose-900'}`}>
                    ₹{(financeData.financialHealth.netMargin || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Recovery Ratio: {financeData.financialHealth.costRecoveryRatio}
                  </p>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-5">
                  <h3 className="text-sm font-bold text-slate-800 mb-4">Payment Method Breakdown</h3>
                  <div className="space-y-3">
                    {Object.entries(financeData.revenue.paymentMethods).map(([method, amount]) => (
                      <div key={method} className="flex justify-between items-center text-xs p-2 rounded bg-slate-50">
                        <span className="font-semibold text-slate-700">{method}</span>
                        <span className="font-bold text-indigo-600">₹{(amount || 0).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-5">
                  <h3 className="text-sm font-bold text-slate-800 mb-4">Operating Cost Breakdown</h3>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between p-2 rounded bg-amber-50">
                      <span className="font-medium text-amber-800">Fleet Fuel Expenses</span>
                      <span className="font-bold text-amber-900">₹{(financeData.operatingExpenses.fuelExpenses || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-blue-50">
                      <span className="font-medium text-blue-800">Vehicle Maintenance & Servicing</span>
                      <span className="font-bold text-blue-900">₹{(financeData.operatingExpenses.maintenanceExpenses || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-violet-50">
                      <span className="font-medium text-violet-800">Other Approved Expenses</span>
                      <span className="font-bold text-violet-900">₹{(financeData.operatingExpenses.otherExpenses || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* 9. SAFETY & INCIDENTS ANALYTICS */}
          {activeCategory === 'safety' && safetyData && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatWidget label="Total Incidents" value={safetyData.summary.totalIncidents} icon={ShieldCheck} color="rose" />
                <StatWidget label="Open / Investigating" value={safetyData.summary.openIncidents} icon={AlertTriangle} color="amber" />
                <StatWidget label="Resolved" value={safetyData.summary.resolvedIncidents} icon={CheckCircle2} color="emerald" />
                <StatWidget
                  label="Average Resolution Time"
                  value={`${safetyData.summary.averageResolutionHours} hrs`}
                  icon={Clock}
                  color="blue"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-5">
                  <h3 className="text-sm font-bold text-slate-800 mb-4">Incidents by Category</h3>
                  <div className="space-y-2">
                    {Object.entries(safetyData.breakdowns.byCategory).map(([cat, count]) => (
                      <div key={cat} className="flex justify-between items-center text-xs p-2 rounded bg-slate-50">
                        <span className="font-medium text-slate-700">{cat}</span>
                        <Badge variant="secondary">{count} events</Badge>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-5">
                  <h3 className="text-sm font-bold text-slate-800 mb-4">Incidents by Severity</h3>
                  <div className="space-y-2">
                    {Object.entries(safetyData.breakdowns.bySeverity).map(([sev, count]) => (
                      <div key={sev} className="flex justify-between items-center text-xs p-2 rounded bg-slate-50">
                        <span className="font-medium text-slate-700">{sev}</span>
                        <Badge variant={sev === 'Critical' ? 'danger' : sev === 'High' ? 'warning' : 'secondary'}>
                          {count} events
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TransportAnalyticsDashboard;

