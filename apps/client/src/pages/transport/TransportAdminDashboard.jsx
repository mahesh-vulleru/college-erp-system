import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Bus,
  MapPin,
  Users,
  ShieldCheck,
  LayoutDashboard,
  GraduationCap,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Calendar,
  Phone,
  Mail,
  UserCheck,
  TrendingUp,
  FileText,
  Activity,
  ArrowRight,
  ShieldAlert,
  Car,
  Wrench,
  Fuel,
  DollarSign,
  Receipt,
  MessageSquare,
  Megaphone,
  FileSpreadsheet
} from 'lucide-react';
import Card from '../../components/common/Card';
import StatWidget from '../../components/common/StatWidget';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../api/apiClient';

import TripManagementView from './TripManagementView';
import DailyScheduleView from './DailyScheduleView';
import LiveGpsTrackingView from './LiveGpsTrackingView';
import StudentAttendanceView from './StudentAttendanceView';
import DriverPortalView from './DriverPortalView';
import SupervisorDashboardView from './SupervisorDashboardView';

import MaintenanceManagementView from './MaintenanceManagementView';
import FuelManagementView from './FuelManagementView';
import TransportExpensesView from './TransportExpensesView';
import TransportFeeManagementView from './TransportFeeManagementView';
import SafetyManagementView from './SafetyManagementView';
import ComplaintsManagementView from './ComplaintsManagementView';
import AnnouncementsManagementView from './AnnouncementsManagementView';
import ParentTransportPortalView from './ParentTransportPortalView';
import TransportAnalyticsDashboard from './TransportAnalyticsDashboard';
import TransportReportCenter from './TransportReportCenter';

export const TransportAdminDashboard = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab synchronization with URL query parameter
  const rawTab = searchParams.get('tab');
  const activeTab = useMemo(() => {
    if (!rawTab || rawTab === 'overview' || rawTab === 'dashboard') return 'overview';
    if ([
      'buses',
      'routes',
      'drivers',
      'students',
      'settings',
      'trips',
      'schedule',
      'gps',
      'attendance',
      'supervisor',
      'driver_portal',
      'maintenance',
      'fuel',
      'expenses',
      'fees',
      'safety',
      'complaints',
      'announcements',
      'parent',
      'analytics',
      'reports'
    ].includes(rawTab)) return rawTab;
    return 'overview';
  }, [rawTab]);

  const handleTabChange = (tabKey) => {
    if (tabKey === 'overview') {
      searchParams.delete('tab');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ tab: tabKey });
    }
  };

  // -------------------------------------------------------------------------
  // 1. DASHBOARD & SUMMARY STATE
  // -------------------------------------------------------------------------
  const [summaryData, setSummaryData] = useState(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    try {
      setIsSummaryLoading(true);
      const res = await api.getTransportSummary();
      if (res && res.data) {
        setSummaryData(res.data);
      }
    } catch (err) {
      addToast(err.message || 'Failed to load transport summary', 'error');
    } finally {
      setIsSummaryLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // -------------------------------------------------------------------------
  // 2. BUS MANAGEMENT STATE & MODALS
  // -------------------------------------------------------------------------
  const [buses, setBuses] = useState([]);
  const [busesLoading, setBusesLoading] = useState(false);
  const [busSearch, setBusSearch] = useState('');
  const [busStatusFilter, setBusStatusFilter] = useState('all');
  const [busTypeFilter, setBusTypeFilter] = useState('all');
  const [selectedBusDetails, setSelectedBusDetails] = useState(null);
  const [isAddBusModalOpen, setIsAddBusModalOpen] = useState(false);
  const [editingBus, setEditingBus] = useState(null);
  const [busFormSubmitting, setBusFormSubmitting] = useState(false);

  const [busForm, setBusForm] = useState({
    busId: '',
    registrationNumber: '',
    busName: '',
    manufacturer: 'Tata Motors',
    model: 'Starbus Ultra',
    manufacturingYear: 2023,
    busType: 'standard',
    fuelType: 'diesel',
    seatingCapacity: 40,
    currentStatus: 'active',
    insuranceNumber: '',
    insuranceExpiryDate: '',
    fitnessCertificateNumber: '',
    fitnessExpiryDate: '',
    remarks: ''
  });

  const fetchBuses = useCallback(async () => {
    try {
      setBusesLoading(true);
      const res = await api.getBuses({
        search: busSearch,
        status: busStatusFilter,
        busType: busTypeFilter
      });
      if (res && res.data) {
        setBuses(res.data);
      }
    } catch (err) {
      addToast(err.message || 'Failed to fetch buses', 'error');
    } finally {
      setBusesLoading(false);
    }
  }, [busSearch, busStatusFilter, busTypeFilter, addToast]);

  useEffect(() => {
    if (activeTab === 'buses' || activeTab === 'overview') {
      fetchBuses();
    }
  }, [activeTab, fetchBuses]);

  const handleOpenAddBus = () => {
    setEditingBus(null);
    setBusForm({
      busId: `BUS-0${buses.length + 1}`,
      registrationNumber: '',
      busName: `Campus Express ${buses.length + 1}`,
      manufacturer: 'Tata Motors',
      model: 'Starbus Ultra',
      manufacturingYear: 2023,
      busType: 'standard',
      fuelType: 'diesel',
      seatingCapacity: 40,
      currentStatus: 'active',
      insuranceNumber: '',
      insuranceExpiryDate: '',
      fitnessCertificateNumber: '',
      fitnessExpiryDate: '',
      remarks: ''
    });
    setIsAddBusModalOpen(true);
  };

  const handleOpenEditBus = (bus) => {
    setEditingBus(bus);
    setBusForm({
      busId: bus.busId || '',
      registrationNumber: bus.registrationNumber || '',
      busName: bus.busName || '',
      manufacturer: bus.manufacturer || 'Tata Motors',
      model: bus.model || '',
      manufacturingYear: bus.manufacturingYear || 2023,
      busType: bus.busType || 'standard',
      fuelType: bus.fuelType || 'diesel',
      seatingCapacity: bus.seatingCapacity || 40,
      currentStatus: bus.currentStatus || 'active',
      insuranceNumber: bus.insuranceNumber || '',
      insuranceExpiryDate: bus.insuranceExpiryDate ? bus.insuranceExpiryDate.slice(0, 10) : '',
      fitnessCertificateNumber: bus.fitnessCertificateNumber || '',
      fitnessExpiryDate: bus.fitnessExpiryDate ? bus.fitnessExpiryDate.slice(0, 10) : '',
      remarks: bus.remarks || ''
    });
    setIsAddBusModalOpen(true);
  };

  const handleSaveBusSubmit = async (e) => {
    e.preventDefault();
    try {
      setBusFormSubmitting(true);
      if (editingBus) {
        await api.updateBus(editingBus._id, busForm);
        addToast(`Bus '${busForm.busName}' updated successfully`, 'success');
      } else {
        await api.createBus(busForm);
        addToast(`Bus '${busForm.busName}' added to fleet`, 'success');
      }
      setIsAddBusModalOpen(false);
      fetchBuses();
      fetchSummary();
    } catch (err) {
      addToast(err.message || 'Error saving bus record', 'error');
    } finally {
      setBusFormSubmitting(false);
    }
  };

  const handleToggleBusStatus = async (bus) => {
    const nextStatus = bus.currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await api.deactivateBus(bus._id, nextStatus);
      addToast(`Bus status changed to '${nextStatus}'`, 'info');
      fetchBuses();
      fetchSummary();
    } catch (err) {
      addToast(err.message || 'Error updating status', 'error');
    }
  };

  // -------------------------------------------------------------------------
  // 3. ROUTE & STOP MANAGEMENT STATE & MODALS
  // -------------------------------------------------------------------------
  const [routes, setRoutes] = useState([]);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [routeSearch, setRouteSearch] = useState('');
  const [routeStatusFilter, setRouteStatusFilter] = useState('all');
  const [selectedRouteDetails, setSelectedRouteDetails] = useState(null);
  const [isAddRouteModalOpen, setIsAddRouteModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [routeFormSubmitting, setRouteFormSubmitting] = useState(false);

  const [routeForm, setRouteForm] = useState({
    routeId: '',
    routeName: '',
    routeCode: '',
    startingPoint: '',
    destination: 'Apex Engineering College Campus',
    totalDistance: 20,
    estimatedDuration: '45 mins',
    assignedBus: '',
    assignedDriver: '',
    routeStatus: 'active',
    remarks: '',
    stops: [
      {
        stopId: 'ST-01',
        stopName: '',
        stopAddress: '',
        stopSequence: 1,
        pickupTime: '07:15 AM',
        dropTime: '05:30 PM'
      }
    ]
  });

  const fetchRoutes = useCallback(async () => {
    try {
      setRoutesLoading(true);
      const res = await api.getRoutes({
        search: routeSearch,
        status: routeStatusFilter
      });
      if (res && res.data) {
        setRoutes(res.data);
      }
    } catch (err) {
      addToast(err.message || 'Failed to fetch routes', 'error');
    } finally {
      setRoutesLoading(false);
    }
  }, [routeSearch, routeStatusFilter, addToast]);

  useEffect(() => {
    if (activeTab === 'routes' || activeTab === 'overview') {
      fetchRoutes();
    }
  }, [activeTab, fetchRoutes]);

  const handleOpenAddRoute = () => {
    setEditingRoute(null);
    setRouteForm({
      routeId: `RT-0${routes.length + 1}`,
      routeName: `Route ${routes.length + 1}`,
      routeCode: `R-EX-${routes.length + 101}`,
      startingPoint: 'City Metro Station',
      destination: 'Apex Engineering College Campus',
      totalDistance: 25,
      estimatedDuration: '45 mins',
      assignedBus: buses.find((b) => b.currentStatus === 'active')?._id || '',
      assignedDriver: '',
      routeStatus: 'active',
      remarks: '',
      stops: [
        {
          stopId: 'ST-01',
          stopName: 'Metro Interchange Station',
          stopAddress: 'Main Entry Gate',
          stopSequence: 1,
          pickupTime: '07:10 AM',
          dropTime: '05:40 PM'
        },
        {
          stopId: 'ST-02',
          stopName: 'Ring Road Junction',
          stopAddress: 'Flyover Cross',
          stopSequence: 2,
          pickupTime: '07:35 AM',
          dropTime: '05:15 PM'
        },
        {
          stopId: 'ST-03',
          stopName: 'Apex Campus Gate 1',
          stopAddress: 'College Main Entrance',
          stopSequence: 3,
          pickupTime: '08:15 AM',
          dropTime: '04:30 PM'
        }
      ]
    });
    setIsAddRouteModalOpen(true);
  };

  const handleOpenEditRoute = (route) => {
    setEditingRoute(route);
    setRouteForm({
      routeId: route.routeId || '',
      routeName: route.routeName || '',
      routeCode: route.routeCode || '',
      startingPoint: route.startingPoint || '',
      destination: route.destination || 'Apex Engineering College Campus',
      totalDistance: route.totalDistance || 0,
      estimatedDuration: route.estimatedDuration || '45 mins',
      assignedBus: route.assignedBus?._id || route.assignedBus || '',
      assignedDriver: route.assignedDriver?._id || route.assignedDriver || '',
      routeStatus: route.routeStatus || 'active',
      remarks: route.remarks || '',
      stops: (route.stops && route.stops.length > 0)
        ? route.stops
        : [
            {
              stopId: 'ST-01',
              stopName: 'Origin Stop',
              stopAddress: '',
              stopSequence: 1,
              pickupTime: '07:15 AM',
              dropTime: '05:30 PM'
            }
          ]
    });
    setIsAddRouteModalOpen(true);
  };

  const handleAddStopToForm = () => {
    const nextSeq = routeForm.stops.length + 1;
    setRouteForm((prev) => ({
      ...prev,
      stops: [
        ...prev.stops,
        {
          stopId: `ST-0${nextSeq}`,
          stopName: '',
          stopAddress: '',
          stopSequence: nextSeq,
          pickupTime: '07:30 AM',
          dropTime: '05:15 PM'
        }
      ]
    }));
  };

  const handleRemoveStopFromForm = (idx) => {
    if (routeForm.stops.length <= 1) {
      addToast('A route must have at least one stop', 'warning');
      return;
    }
    const filtered = routeForm.stops.filter((_, i) => i !== idx);
    const resequenced = filtered.map((s, i) => ({ ...s, stopSequence: i + 1 }));
    setRouteForm((prev) => ({ ...prev, stops: resequenced }));
  };

  const handleSaveRouteSubmit = async (e) => {
    e.preventDefault();
    try {
      setRouteFormSubmitting(true);
      if (editingRoute) {
        await api.updateRoute(editingRoute._id, routeForm);
        addToast(`Route '${routeForm.routeName}' updated successfully`, 'success');
      } else {
        await api.createRoute(routeForm);
        addToast(`Route '${routeForm.routeName}' created successfully`, 'success');
      }
      setIsAddRouteModalOpen(false);
      fetchRoutes();
      fetchSummary();
    } catch (err) {
      addToast(err.message || 'Error saving route', 'error');
    } finally {
      setRouteFormSubmitting(false);
    }
  };

  // -------------------------------------------------------------------------
  // 4. DRIVER & STAFF MANAGEMENT STATE & MODALS
  // -------------------------------------------------------------------------
  const [drivers, setDrivers] = useState([]);
  const [driversLoading, setDriversLoading] = useState(false);
  const [driverSearch, setDriverSearch] = useState('');
  const [driverAvailabilityFilter, setDriverAvailabilityFilter] = useState('all');
  const [driverStatusFilter, setDriverStatusFilter] = useState('all');
  const [selectedDriverDetails, setSelectedDriverDetails] = useState(null);
  const [isAddDriverModalOpen, setIsAddDriverModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [driverFormSubmitting, setDriverFormSubmitting] = useState(false);

  const [driverForm, setDriverForm] = useState({
    driverId: '',
    fullName: '',
    staffType: 'driver',
    phoneNumber: '',
    email: '',
    address: '',
    drivingLicenceNumber: '',
    licenceType: 'heavy_transport',
    licenceExpiryDate: '',
    assignedBus: '',
    assignedRoute: '',
    employmentStatus: 'active',
    availabilityStatus: 'available',
    remarks: ''
  });

  const fetchDrivers = useCallback(async () => {
    try {
      setDriversLoading(true);
      const res = await api.getDrivers({
        search: driverSearch,
        availabilityStatus: driverAvailabilityFilter,
        employmentStatus: driverStatusFilter
      });
      if (res && res.data) {
        setDrivers(res.data);
      }
    } catch (err) {
      addToast(err.message || 'Failed to fetch drivers', 'error');
    } finally {
      setDriversLoading(false);
    }
  }, [driverSearch, driverAvailabilityFilter, driverStatusFilter, addToast]);

  useEffect(() => {
    if (activeTab === 'drivers' || activeTab === 'overview') {
      fetchDrivers();
    }
  }, [activeTab, fetchDrivers]);

  const handleOpenAddDriver = () => {
    setEditingDriver(null);
    setDriverForm({
      driverId: `DRV-0${drivers.length + 1}`,
      fullName: '',
      staffType: 'driver',
      phoneNumber: '+91 ',
      email: '',
      address: 'Bangalore, Karnataka',
      drivingLicenceNumber: '',
      licenceType: 'heavy_transport',
      licenceExpiryDate: '2028-12-31',
      assignedBus: '',
      assignedRoute: '',
      employmentStatus: 'active',
      availabilityStatus: 'available',
      remarks: ''
    });
    setIsAddDriverModalOpen(true);
  };

  const handleOpenEditDriver = (driver) => {
    setEditingDriver(driver);
    setDriverForm({
      driverId: driver.driverId || '',
      fullName: driver.fullName || '',
      staffType: driver.staffType || 'driver',
      phoneNumber: driver.phoneNumber || '',
      email: driver.email || '',
      address: driver.address || '',
      drivingLicenceNumber: driver.drivingLicenceNumber || '',
      licenceType: driver.licenceType || 'heavy_transport',
      licenceExpiryDate: driver.licenceExpiryDate ? driver.licenceExpiryDate.slice(0, 10) : '',
      assignedBus: driver.assignedBus?._id || driver.assignedBus || '',
      assignedRoute: driver.assignedRoute?._id || driver.assignedRoute || '',
      employmentStatus: driver.employmentStatus || 'active',
      availabilityStatus: driver.availabilityStatus || 'available',
      remarks: driver.remarks || ''
    });
    setIsAddDriverModalOpen(true);
  };

  const handleSaveDriverSubmit = async (e) => {
    e.preventDefault();
    try {
      setDriverFormSubmitting(true);
      if (editingDriver) {
        await api.updateDriver(editingDriver._id, driverForm);
        addToast(`Driver profile '${driverForm.fullName}' updated successfully`, 'success');
      } else {
        await api.createDriver(driverForm);
        addToast(`Driver '${driverForm.fullName}' added to personnel register`, 'success');
      }
      setIsAddDriverModalOpen(false);
      fetchDrivers();
      fetchSummary();
    } catch (err) {
      addToast(err.message || 'Error saving driver details', 'error');
    } finally {
      setDriverFormSubmitting(false);
    }
  };

  // -------------------------------------------------------------------------
  // 5. STUDENT TRANSPORT ALLOCATION STATE & MODALS
  // -------------------------------------------------------------------------
  const [allocations, setAllocations] = useState([]);
  const [allocationsLoading, setAllocationsLoading] = useState(false);
  const [allocationSearch, setAllocationSearch] = useState('');
  const [allocationStatusFilter, setAllocationStatusFilter] = useState('all');
  const [allocationFeeFilter, setAllocationFeeFilter] = useState('all');
  const [eligibleStudents, setEligibleStudents] = useState([]);
  const [eligibleLoading, setEligibleLoading] = useState(false);
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [allocateFormSubmitting, setAllocateFormSubmitting] = useState(false);

  const [allocationForm, setAllocationForm] = useState({
    student: '',
    bus: '',
    route: '',
    pickupStop: '',
    dropStop: '',
    academicYear: '2025-2026',
    transportFeeStatus: 'pending',
    remarks: ''
  });

  const fetchAllocations = useCallback(async () => {
    try {
      setAllocationsLoading(true);
      const res = await api.getAllocations({
        search: allocationSearch,
        allocationStatus: allocationStatusFilter,
        transportFeeStatus: allocationFeeFilter
      });
      if (res && res.data) {
        setAllocations(res.data);
      }
    } catch (err) {
      addToast(err.message || 'Failed to fetch allocations', 'error');
    } finally {
      setAllocationsLoading(false);
    }
  }, [allocationSearch, allocationStatusFilter, allocationFeeFilter, addToast]);

  useEffect(() => {
    if (activeTab === 'students' || activeTab === 'overview') {
      fetchAllocations();
    }
  }, [activeTab, fetchAllocations]);

  const handleOpenAllocateModal = async () => {
    try {
      setEligibleLoading(true);
      const res = await api.getEligibleStudents();
      if (res && res.data) {
        setEligibleStudents(res.data);
      }
      setAllocationForm({
        student: '',
        bus: buses.find((b) => b.currentStatus === 'active')?._id || '',
        route: routes.find((r) => r.routeStatus === 'active')?._id || '',
        pickupStop: '',
        dropStop: '',
        academicYear: '2025-2026',
        transportFeeStatus: 'paid',
        remarks: 'Registered via Transport Portal'
      });
      setIsAllocateModalOpen(true);
    } catch (err) {
      addToast(err.message || 'Error loading eligible student list', 'error');
    } finally {
      setEligibleLoading(false);
    }
  };

  const handleRouteSelectionInModal = (selectedRouteId) => {
    const matchedRoute = routes.find((r) => r._id === selectedRouteId);
    const firstStop = matchedRoute?.stops?.[0]?.stopName || '';
    setAllocationForm((prev) => ({
      ...prev,
      route: selectedRouteId,
      pickupStop: firstStop,
      dropStop: firstStop
    }));
  };

  const handleSaveAllocationSubmit = async (e) => {
    e.preventDefault();
    try {
      setAllocateFormSubmitting(true);
      await api.createAllocation(allocationForm);
      addToast('Student transport allocation created successfully', 'success');
      setIsAllocateModalOpen(false);
      fetchAllocations();
      fetchSummary();
      fetchBuses();
    } catch (err) {
      addToast(err.message || 'Failed to allocate student', 'error');
    } finally {
      setAllocateFormSubmitting(false);
    }
  };

  const handleCancelAllocation = async (allocationId, studentName) => {
    if (!window.confirm(`Are you sure you want to cancel the transport allocation for ${studentName}?`)) {
      return;
    }
    try {
      await api.cancelAllocation(allocationId, 'Cancelled by Transport Admin');
      addToast(`Allocation cancelled for ${studentName}`, 'info');
      fetchAllocations();
      fetchSummary();
      fetchBuses();
    } catch (err) {
      addToast(err.message || 'Error cancelling allocation', 'error');
    }
  };

  // -------------------------------------------------------------------------
  // 6. TRANSPORT SETTINGS STATE
  // -------------------------------------------------------------------------
  const [settings, setSettings] = useState({
    academicYear: '2025-2026',
    transportWorkingStatus: 'operational',
    defaultMorningPickup: '07:00 AM',
    defaultEveningDrop: '05:00 PM',
    maxSeatThresholdPercentage: 100,
    emergencyContactPhone: '+91 98765 43210',
    transportHelplineEmail: 'transport@college.edu'
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      setSettingsLoading(true);
      const res = await api.getTransportSettings();
      if (res && res.data) {
        setSettings(res.data);
      }
    } catch (err) {
      addToast(err.message || 'Failed to fetch transport settings', 'error');
    } finally {
      setSettingsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (activeTab === 'settings') {
      fetchSettings();
    }
  }, [activeTab, fetchSettings]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSettingsSaving(true);
      await api.updateTransportSettings(settings);
      addToast('Transport configuration rules saved successfully', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to save settings', 'error');
    } finally {
      setSettingsSaving(false);
    }
  };

  // Extract real metrics for summary cards
  const summary = summaryData?.summary || {
    totalBuses: 0,
    activeBuses: 0,
    inactiveBuses: 0,
    pendingMaintenance: 0,
    totalRoutes: 0,
    activeRoutes: 0,
    totalDrivers: 0,
    availableDrivers: 0,
    totalTransportStudents: 0,
    assignedStudents: 0,
    availableBusCapacity: 0,
    totalBusCapacity: 0,
    capacityUtilization: 0,
    pendingTransportFees: 0
  };

  const charts = summaryData?.charts || {
    busStatusOverview: { active: 0, inactive: 0, under_maintenance: 0, out_of_service: 0 },
    routeDistribution: [],
    driverAvailability: { available: 0, on_duty: 0, off_duty: 0, sick_leave: 0 },
    capacityUtilization: { utilized: 0, available: 0, total: 0, percentage: 0 }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ------------------------------------------------------------------- */}
      {/* HEADER BANNER */}
      {/* ------------------------------------------------------------------- */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#062a1e] via-[#0b3d2c] to-[#062a1e] p-6 sm:p-8 text-white border border-emerald-900/50 shadow-xl shadow-emerald-950/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Bus className="w-6 h-6" />
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 tracking-wide uppercase">
                Transport Management System &bull; Phase 1–5
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Transport Operations Command Portal
            </h1>
            <p className="text-sm text-emerald-100/80 font-light max-w-2xl">
              Centralized fleet monitoring, bus route allocation, driver rosters, and student transport coordination for Apex Engineering College.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchSummary();
                if (activeTab === 'buses') fetchBuses();
                if (activeTab === 'routes') fetchRoutes();
                if (activeTab === 'drivers') fetchDrivers();
                if (activeTab === 'students') fetchAllocations();
                addToast('Refreshing live fleet metrics...', 'info');
              }}
              className="text-emerald-100 border-emerald-500/40 hover:bg-emerald-800/40 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Sync Data
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenAllocateModal}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold border-none shadow-md shadow-emerald-950/30 cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Allocate Student
            </Button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* MODULE TAB NAVIGATION */}
      {/* ------------------------------------------------------------------- */}
      <div className="flex items-center gap-2 border-b border-navy-200 overflow-x-auto pb-2 scrollbar-none">
        {[
          { key: 'overview', label: 'Overview & Fleet Analytics', icon: LayoutDashboard },
          { key: 'trips', label: 'Trips & Dispatch', icon: Clock },
          { key: 'schedule', label: 'Daily Transit Schedule', icon: Calendar },
          { key: 'gps', label: 'Live GPS Radar', icon: Activity },
          { key: 'attendance', label: 'Student Attendance', icon: UserCheck },
          { key: 'buses', label: 'Bus & Vehicle Fleet', icon: Bus, count: summary.totalBuses },
          { key: 'routes', label: 'Route & Stop Network', icon: MapPin, count: summary.totalRoutes },
          { key: 'drivers', label: 'Drivers & Personnel', icon: Users, count: summary.totalDrivers },
          { key: 'students', label: 'Student Allocations', icon: GraduationCap, count: summary.assignedStudents },
          { key: 'maintenance', label: 'Maintenance & Compliance', icon: Wrench },
          { key: 'fuel', label: 'Fuel & Mileage', icon: Fuel },
          { key: 'expenses', label: 'Fleet Expenses', icon: DollarSign },
          { key: 'fees', label: 'Transport Fees & Receipts', icon: Receipt },
          { key: 'safety', label: 'Safety & Emergency SOS', icon: ShieldAlert },
          { key: 'complaints', label: 'Feedback & Grievances', icon: MessageSquare },
          { key: 'announcements', label: 'Notices & Broadcasts', icon: Megaphone },
          { key: 'parent', label: 'Parent Transit Portal', icon: Users },
          { key: 'analytics', label: 'Executive Analytics', icon: TrendingUp },
          { key: 'reports', label: 'Report Center & Exports', icon: FileSpreadsheet },
          { key: 'settings', label: 'Transport Rules & Settings', icon: ShieldCheck }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-emerald-700 text-white font-bold shadow-md shadow-emerald-900/20'
                  : 'text-slate-600 hover:text-emerald-900 hover:bg-emerald-50/70'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`ml-1 text-[11px] px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20 text-white font-bold' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* =================================================================== */}
      {/* TAB 1: OVERVIEW & DASHBOARD METRICS */}
      {/* =================================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 10 Required Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <StatWidget
              title="Total Buses"
              value={isSummaryLoading ? '...' : summary.totalBuses}
              icon={Bus}
              description="Full campus fleet"
              variant="default"
              onClick={() => handleTabChange('buses')}
            />
            <StatWidget
              title="Active Buses"
              value={isSummaryLoading ? '...' : summary.activeBuses}
              icon={CheckCircle2}
              description="Operating on daily routes"
              variant="success"
              onClick={() => handleTabChange('buses')}
            />
            <StatWidget
              title="Inactive Buses"
              value={isSummaryLoading ? '...' : summary.inactiveBuses}
              icon={XCircle}
              description="Standby / Off service"
              variant="default"
              onClick={() => handleTabChange('buses')}
            />
            <StatWidget
              title="Total Routes"
              value={isSummaryLoading ? '...' : summary.totalRoutes}
              icon={MapPin}
              description="Scheduled network corridors"
              variant="default"
              onClick={() => handleTabChange('routes')}
            />
            <StatWidget
              title="Total Drivers"
              value={isSummaryLoading ? '...' : summary.totalDrivers}
              icon={Users}
              description={`${summary.availableDrivers} on active duty`}
              variant="default"
              onClick={() => handleTabChange('drivers')}
            />
            <StatWidget
              title="Transport Students"
              value={isSummaryLoading ? '...' : summary.totalTransportStudents}
              icon={GraduationCap}
              description="Total enrolled members"
              variant="default"
              onClick={() => handleTabChange('students')}
            />
            <StatWidget
              title="Available Capacity"
              value={isSummaryLoading ? '...' : `${summary.availableBusCapacity} Seats`}
              icon={Activity}
              description={`Out of ${summary.totalBusCapacity} total seats`}
              variant="info"
            />
            <StatWidget
              title="Assigned Students"
              value={isSummaryLoading ? '...' : summary.assignedStudents}
              icon={TrendingUp}
              description={`${summary.capacityUtilization}% seat occupancy`}
              variant="success"
              onClick={() => handleTabChange('students')}
            />
            <StatWidget
              title="Pending Maintenance"
              value={isSummaryLoading ? '...' : summary.pendingMaintenance}
              icon={AlertTriangle}
              description="Vehicles requiring service"
              variant="danger"
              onClick={() => handleTabChange('buses')}
            />
            <StatWidget
              title="Pending Transport Fees"
              value={isSummaryLoading ? '...' : summary.pendingTransportFees}
              icon={Clock}
              description="Unpaid term transit dues"
              variant="warning"
              onClick={() => handleTabChange('students')}
            />
          </div>

          {/* Real Database Analytics Visualizations */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bus Capacity Utilization Gauge */}
            <Card className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-navy-950 uppercase tracking-wider">
                    Fleet Capacity Utilization
                  </h3>
                  <Badge variant={summary.capacityUtilization > 90 ? 'danger' : 'success'} size="xs">
                    {summary.capacityUtilization}% Occupancy
                  </Badge>
                </div>
                <p className="text-xs text-navy-500 mb-4">
                  Aggregated seating quota across all {summary.activeBuses} active fleet buses.
                </p>

                {/* Progress bar visual */}
                <div className="w-full bg-navy-100 rounded-full h-4 overflow-hidden mb-3">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, summary.capacityUtilization)}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                    <span className="text-navy-500 block">Occupied Seats</span>
                    <span className="text-base font-bold text-navy-950">{summary.assignedStudents}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                    <span className="text-navy-500 block">Vacant Seats</span>
                    <span className="text-base font-bold text-emerald-700">{summary.availableBusCapacity}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-navy-100 flex items-center justify-between text-xs text-navy-500">
                <span>Maximum Fleet Limit: {summary.totalBusCapacity} Seats</span>
                <button
                  type="button"
                  onClick={() => handleTabChange('students')}
                  className="font-semibold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1 cursor-pointer"
                >
                  Manage Allocations <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </Card>

            {/* Bus Status Breakdown */}
            <Card className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-navy-950 uppercase tracking-wider">
                    Bus Fleet Operational Status
                  </h3>
                  <span className="text-xs text-navy-500">{summary.totalBuses} Total Registered</span>
                </div>
                <p className="text-xs text-navy-500 mb-4">
                  Real-time mechanical and deployment condition of college vehicles.
                </p>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/70 border border-emerald-100">
                    <span className="flex items-center gap-2 font-medium text-emerald-950">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Active on Route
                    </span>
                    <span className="font-bold text-emerald-800">{charts.busStatusOverview.active}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50/70 border border-rose-100">
                    <span className="flex items-center gap-2 font-medium text-rose-950">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Under Maintenance
                    </span>
                    <span className="font-bold text-rose-800">{charts.busStatusOverview.under_maintenance}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="flex items-center gap-2 font-medium text-slate-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Inactive / Standby
                    </span>
                    <span className="font-bold text-slate-800">{charts.busStatusOverview.inactive}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-stone-100 border border-stone-200">
                    <span className="flex items-center gap-2 font-medium text-stone-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-stone-500" /> Out of Service
                    </span>
                    <span className="font-bold text-stone-800">{charts.busStatusOverview.out_of_service}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-navy-100 flex items-center justify-between text-xs text-navy-500">
                <span>Roster Readiness: {summary.activeBuses}/{summary.totalBuses}</span>
                <button
                  type="button"
                  onClick={() => handleTabChange('buses')}
                  className="font-semibold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1 cursor-pointer"
                >
                  View Buses <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </Card>

            {/* Driver Availability Breakdown */}
            <Card className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-navy-950 uppercase tracking-wider">
                    Driver & Personnel Duty Roster
                  </h3>
                  <span className="text-xs text-navy-500">{summary.totalDrivers} Staff Drivers</span>
                </div>
                <p className="text-xs text-navy-500 mb-4">
                  Licence-verified transport staff shift and dispatch status.
                </p>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/70 border border-emerald-100">
                    <span className="flex items-center gap-2 font-medium text-emerald-950">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Available for Dispatch
                    </span>
                    <span className="font-bold text-emerald-800">{charts.driverAvailability.available}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50/70 border border-amber-100">
                    <span className="flex items-center gap-2 font-medium text-amber-950">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> On Duty / En Route
                    </span>
                    <span className="font-bold text-amber-800">{charts.driverAvailability.on_duty}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="flex items-center gap-2 font-medium text-slate-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Off Duty / Rest
                    </span>
                    <span className="font-bold text-slate-800">{charts.driverAvailability.off_duty}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-purple-50 border border-purple-100">
                    <span className="flex items-center gap-2 font-medium text-purple-900">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Sick / Casual Leave
                    </span>
                    <span className="font-bold text-purple-800">{charts.driverAvailability.sick_leave}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-navy-100 flex items-center justify-between text-xs text-navy-500">
                <span>Active Coverage: {summary.availableDrivers} Drivers</span>
                <button
                  type="button"
                  onClick={() => handleTabChange('drivers')}
                  className="font-semibold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1 cursor-pointer"
                >
                  Manage Drivers <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </Card>
          </div>

          {/* Route-wise Student Distribution Bar Chart & Table */}
          <Card className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-navy-950 uppercase tracking-wider">
                  Route-Wise Student Distribution
                </h3>
                <p className="text-xs text-navy-500">
                  Real-time commuter volume across active college bus routes.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenAddRoute}
                className="text-amber-700 border-amber-300 hover:bg-amber-50"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                New Route
              </Button>
            </div>

            {charts.routeDistribution.length === 0 ? (
              <EmptyState
                title="No route distribution data"
                description="Create routes and allocate students to view traffic density."
                icon={MapPin}
              />
            ) : (
              <div className="space-y-3">
                {charts.routeDistribution.map((r) => {
                  const maxCount = Math.max(
                    1,
                    ...charts.routeDistribution.map((item) => item.studentCount)
                  );
                  const percentage = Math.round((r.studentCount / maxCount) * 100);

                  return (
                    <div key={r.routeId} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold text-navy-900">
                        <span className="flex items-center gap-2">
                          <Badge variant="navy" size="xs">
                            {r.routeCode}
                          </Badge>
                          <span>{r.routeName}</span>
                          <span className="text-navy-400 font-normal">({r.destination})</span>
                        </span>
                        <span className="font-bold text-amber-700">{r.studentCount} Students</span>
                      </div>
                      <div className="w-full bg-navy-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-amber-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.max(8, percentage)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: BUS & VEHICLE MANAGEMENT */}
      {/* =================================================================== */}
      {activeTab === 'buses' && (
        <Card className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-navy-950">Bus Fleet Registry</h2>
              <p className="text-xs text-navy-500">
                Manage registered college buses, seating capacities, vehicle fitness certificates, and maintenance schedules.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenAddBus}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold border-none shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Bus
            </Button>
          </div>

          {/* Filters & Search */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-navy-400" />
              <Input
                placeholder="Search by Bus ID, registration, name..."
                value={busSearch}
                onChange={(e) => setBusSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={busStatusFilter}
              onChange={(e) => setBusStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'active', label: 'Active Only' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'under_maintenance', label: 'Under Maintenance' },
                { value: 'out_of_service', label: 'Out of Service' }
              ]}
            />
            <Select
              value={busTypeFilter}
              onChange={(e) => setBusTypeFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Bus Types' },
                { value: 'standard', label: 'Standard' },
                { value: 'mini', label: 'Mini Bus' },
                { value: 'deluxe', label: 'Deluxe' },
                { value: 'ac', label: 'Air Conditioned' }
              ]}
            />
          </div>

          <div className="flex items-center gap-4 text-xs text-navy-500 font-medium">
            <span>Total Vehicles: {buses?.length || 0}</span>
            <span>Inactive Vehicles: {(buses || []).filter((b) => (b.currentStatus || b.status)?.toLowerCase() === 'inactive').length}</span>
          </div>

          {/* Buses Table */}
          {busesLoading ? (
            <div className="p-12 text-center text-xs text-navy-500">Loading fleet records...</div>
          ) : buses.length === 0 ? (
            <EmptyState
              title="No vehicles found"
              description="Adjust your search criteria or register a new bus to the college transport fleet."
              icon={Bus}
              action={{
                label: 'Register First Bus',
                onClick: handleOpenAddBus
              }}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-navy-800">
                <thead className="bg-navy-50 text-navy-700 uppercase font-bold border-b border-navy-200">
                  <tr>
                    <th className="py-3 px-3">Bus ID</th>
                    <th className="py-3 px-3">Vehicle Details</th>
                    <th className="py-3 px-3">Reg. Number</th>
                    <th className="py-3 px-3">Seating Capacity</th>
                    <th className="py-3 px-3">Assigned Route</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-100">
                  {buses.map((bus) => (
                    <tr key={bus._id} className="hover:bg-amber-50/40 transition-colors">
                      <td className="py-3 px-3 font-bold text-navy-950">{bus.busId}</td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-navy-900 block">{bus.busName}</span>
                        <span className="text-[11px] text-navy-500">
                          {bus.manufacturer} {bus.model} &bull; {bus.fuelType?.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono bg-navy-100 px-2 py-0.5 rounded text-navy-800 font-semibold">
                          {bus.registrationNumber}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-navy-950">{bus.seatingCapacity} Seats</span>
                        <span className="text-[11px] text-emerald-700 block">
                          {bus.availableSeats ?? bus.seatingCapacity} available
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {bus.assignedRoute ? (
                          <span className="inline-flex items-center gap-1 text-navy-900 font-medium">
                            <Badge variant="navy" size="xs">
                              {bus.assignedRoute.routeCode}
                            </Badge>
                            {bus.assignedRoute.routeName}
                          </span>
                        ) : (
                          <span className="text-navy-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={
                            bus.currentStatus === 'active'
                              ? 'success'
                              : bus.currentStatus === 'under_maintenance'
                              ? 'danger'
                              : 'default'
                          }
                          size="xs"
                        >
                          {bus.currentStatus?.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setSelectedBusDetails(bus)}
                          title="View Details & Passengers"
                        >
                          <Eye className="w-3.5 h-3.5 text-navy-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleOpenEditBus(bus)}
                          title="Edit Details"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-amber-700" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleToggleBusStatus(bus)}
                          title={bus.currentStatus === 'active' ? 'Deactivate' : 'Activate'}
                        >
                          {bus.currentStatus === 'active' ? (
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* =================================================================== */}
      {/* TAB 3: ROUTE & STOP MANAGEMENT */}
      {/* =================================================================== */}
      {activeTab === 'routes' && (
        <Card className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-navy-950">Transport Routes & Stops</h2>
              <p className="text-xs text-navy-500">
                Define transit corridors, pick-up/drop-off points, scheduled timings, and assigned buses.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenAddRoute}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold border-none shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Route
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-navy-400" />
              <Input
                placeholder="Search route by name, code, origin, destination..."
                value={routeSearch}
                onChange={(e) => setRouteSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={routeStatusFilter}
              onChange={(e) => setRouteStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Route Statuses' },
                { value: 'active', label: 'Active Routes' },
                { value: 'inactive', label: 'Inactive Routes' },
                { value: 'suspended', label: 'Suspended Routes' }
              ]}
            />
          </div>

          {routesLoading ? (
            <div className="p-12 text-center text-xs text-navy-500">Loading transit routes...</div>
          ) : routes.length === 0 ? (
            <EmptyState
              title="No routes defined"
              description="Establish new bus transit corridors connecting neighborhoods to the college campus."
              icon={MapPin}
              action={{
                label: 'Create First Route',
                onClick: handleOpenAddRoute
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {routes.map((route) => (
                <div
                  key={route._id}
                  className="p-4 rounded-xl border border-navy-200 bg-white shadow-subtle hover:border-amber-300 transition-colors flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="navy" size="xs">
                          {route.routeCode}
                        </Badge>
                        <h4 className="font-bold text-navy-950 text-sm">{route.routeName}</h4>
                      </div>
                      <Badge
                        variant={route.routeStatus === 'active' ? 'success' : 'default'}
                        size="xs"
                      >
                        {route.routeStatus}
                      </Badge>
                    </div>

                    <div className="text-xs text-navy-600 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="font-medium text-navy-900">{route.startingPoint}</span>
                        <span className="text-navy-400">&rarr;</span>
                        <span className="font-medium text-navy-900">{route.destination}</span>
                      </div>
                      <div className="flex items-center gap-4 text-[11px] text-navy-500 pt-1">
                        <span>Distance: {route.totalDistance || 0} km</span>
                        <span>Duration: {route.estimatedDuration || '45 mins'}</span>
                        <span>Stops: {route.totalStops || (route.stops || []).length}</span>
                      </div>
                    </div>

                    {/* Assigned Bus & Driver Pill */}
                    <div className="p-2 rounded-lg bg-navy-50 text-[11px] flex items-center justify-between">
                      <span className="text-navy-700">
                        Bus: <strong>{route.assignedBus?.busName || 'Not Assigned'}</strong>
                      </span>
                      <span className="text-amber-800 font-bold">
                        {route.assignedStudentCount || 0} Commuters
                      </span>
                    </div>

                    {/* Stops Timeline Preview */}
                    <div className="text-[11px] text-navy-500 pt-1">
                      <span className="font-semibold text-navy-700 block mb-1">Stops Sequence:</span>
                      <div className="flex flex-wrap gap-1">
                        {(route.stops || []).slice(0, 4).map((s, idx) => (
                          <span
                            key={idx}
                            className="bg-navy-100/70 text-navy-800 px-2 py-0.5 rounded text-[10px]"
                          >
                            {s.stopSequence}. {s.stopName} ({s.pickupTime})
                          </span>
                        ))}
                        {(route.stops || []).length > 4 && (
                          <span className="text-[10px] text-navy-400 self-center">
                            +{(route.stops || []).length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-navy-100 flex items-center justify-between text-xs">
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => setSelectedRouteDetails(route)}
                      className="text-navy-700"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" /> View Stops & Details
                    </Button>
                    <div className="space-x-1">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => handleOpenEditRoute(route)}
                        className="text-amber-700"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* =================================================================== */}
      {/* TAB 4: DRIVERS & STAFF MANAGEMENT */}
      {/* =================================================================== */}
      {activeTab === 'drivers' && (
        <Card className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-navy-950">Transport Personnel & Drivers</h2>
              <p className="text-xs text-navy-500">
                Maintain certified bus driver registers, emergency contacts, heavy commercial licences, and duty assignments.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenAddDriver}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold border-none shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Driver
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-navy-400" />
              <Input
                placeholder="Search driver by name, ID, licence, phone..."
                value={driverSearch}
                onChange={(e) => setDriverSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={driverAvailabilityFilter}
              onChange={(e) => setDriverAvailabilityFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Availability' },
                { value: 'available', label: 'Available' },
                { value: 'on_duty', label: 'On Duty' },
                { value: 'off_duty', label: 'Off Duty' },
                { value: 'sick_leave', label: 'On Leave' }
              ]}
            />
            <Select
              value={driverStatusFilter}
              onChange={(e) => setDriverStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Employment Statuses' },
                { value: 'active', label: 'Active Personnel' },
                { value: 'inactive', label: 'Inactive / Suspended' }
              ]}
            />
          </div>

          {driversLoading ? (
            <div className="p-12 text-center text-xs text-navy-500">Loading personnel records...</div>
          ) : drivers.length === 0 ? (
            <EmptyState
              title="No drivers registered"
              description="Register qualified commercial vehicle drivers to operate the college bus network."
              icon={Users}
              action={{
                label: 'Add Driver Profile',
                onClick: handleOpenAddDriver
              }}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-navy-800">
                <thead className="bg-navy-50 text-navy-700 uppercase font-bold border-b border-navy-200">
                  <tr>
                    <th className="py-3 px-3">Driver ID</th>
                    <th className="py-3 px-3">Full Name & Contact</th>
                    <th className="py-3 px-3">Licence Details</th>
                    <th className="py-3 px-3">Assigned Bus</th>
                    <th className="py-3 px-3">Availability</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-100">
                  {drivers.map((driver) => (
                    <tr key={driver._id} className="hover:bg-amber-50/40 transition-colors">
                      <td className="py-3 px-3 font-bold text-navy-950">{driver.driverId}</td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-navy-950 block">{driver.fullName}</span>
                        <span className="text-[11px] text-navy-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {driver.phoneNumber}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono font-medium text-navy-900 block">
                          {driver.drivingLicenceNumber}
                        </span>
                        <span className="text-[11px] text-navy-500">
                          Expires: {driver.licenceExpiryDate ? new Date(driver.licenceExpiryDate).toLocaleDateString() : 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {driver.assignedBus ? (
                          <Badge variant="navy" size="xs">
                            {driver.assignedBus.busName} ({driver.assignedBus.busId})
                          </Badge>
                        ) : (
                          <span className="text-navy-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={
                            driver.availabilityStatus === 'available'
                              ? 'success'
                              : driver.availabilityStatus === 'on_duty'
                              ? 'warning'
                              : 'default'
                          }
                          size="xs"
                        >
                          {driver.availabilityStatus?.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={driver.employmentStatus === 'active' ? 'success' : 'default'}
                          size="xs"
                        >
                          {driver.employmentStatus}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setSelectedDriverDetails(driver)}
                          title="View Profile"
                        >
                          <Eye className="w-3.5 h-3.5 text-navy-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleOpenEditDriver(driver)}
                          title="Edit Driver Details"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-amber-700" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* =================================================================== */}
      {/* TAB 5: STUDENT TRANSPORT ALLOCATIONS */}
      {/* =================================================================== */}
      {activeTab === 'students' && (
        <Card className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-navy-950">Student Transport Allocations</h2>
              <p className="text-xs text-navy-500">
                Enroll verified college students onto specific bus routes, track boarding stops, and inspect fee settlement status.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenAllocateModal}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold border-none shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              New Student Allocation
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-navy-400" />
              <Input
                placeholder="Search student name, roll number, stop, department..."
                value={allocationSearch}
                onChange={(e) => setAllocationSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={allocationStatusFilter}
              onChange={(e) => setAllocationStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Allocation Statuses' },
                { value: 'active', label: 'Active Passes' },
                { value: 'cancelled', label: 'Cancelled' },
                { value: 'suspended', label: 'Suspended' }
              ]}
            />
            <Select
              value={allocationFeeFilter}
              onChange={(e) => setAllocationFeeFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Fee Statuses' },
                { value: 'paid', label: 'Transit Fee Paid' },
                { value: 'pending', label: 'Transit Fee Pending' }
              ]}
            />
          </div>

          {allocationsLoading ? (
            <div className="p-12 text-center text-xs text-navy-500">Loading student allocations...</div>
          ) : allocations.length === 0 ? (
            <EmptyState
              title="No student allocations found"
              description="Assign eligible college students to active bus routes and pickup stops."
              icon={GraduationCap}
              action={{
                label: 'Allocate Student to Bus',
                onClick: handleOpenAllocateModal
              }}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-navy-800">
                <thead className="bg-navy-50 text-navy-700 uppercase font-bold border-b border-navy-200">
                  <tr>
                    <th className="py-3 px-3">Pass ID</th>
                    <th className="py-3 px-3">Student Info</th>
                    <th className="py-3 px-3">Bus & Route</th>
                    <th className="py-3 px-3">Boarding Stop & Time</th>
                    <th className="py-3 px-3">Fee Status</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-100">
                  {allocations.map((alloc) => (
                    <tr key={alloc._id} className="hover:bg-amber-50/40 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-navy-950">
                        {alloc.allocationId}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-navy-950 block">{alloc.studentName}</span>
                        <span className="text-[11px] text-navy-500 font-mono">
                          {alloc.rollNumber} &bull; {alloc.department}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-medium text-navy-900 block">
                          {alloc.bus?.busName || 'Bus'}
                        </span>
                        <span className="text-[11px] text-navy-500">
                          {alloc.route?.routeName || 'Route'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-navy-900 block flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-amber-600" /> {alloc.pickupStop}
                        </span>
                        <span className="text-[11px] text-navy-500">
                          Pickup: {alloc.pickupTime} &bull; Drop: {alloc.dropTime}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={alloc.transportFeeStatus === 'paid' ? 'success' : 'warning'}
                          size="xs"
                        >
                          Fee: {alloc.transportFeeStatus}
                        </Badge>
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={alloc.allocationStatus === 'active' ? 'success' : 'default'}
                          size="xs"
                        >
                          {alloc.allocationStatus}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {alloc.allocationStatus === 'active' && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleCancelAllocation(alloc._id, alloc.studentName)}
                            className="text-rose-600 hover:text-rose-800"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" /> Cancel Pass
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* =================================================================== */}
      {/* TAB 6: TRANSPORT CONFIGURATION & SETTINGS */}
      {/* =================================================================== */}
      {activeTab === 'settings' && (
        <Card className="p-6 max-w-3xl">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-navy-950">Transport System Configuration</h2>
            <p className="text-xs text-navy-500">
              Configure institution-wide academic year transport terms, capacity limits, default timings, and emergency contacts.
            </p>
          </div>

          {settingsLoading ? (
            <div className="p-8 text-center text-xs text-navy-500">Loading settings...</div>
          ) : (
            <form onSubmit={handleSaveSettings} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-navy-700 mb-1">
                    Academic Year Term
                  </label>
                  <Input
                    value={settings.academicYear}
                    onChange={(e) => setSettings({ ...settings, academicYear: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-navy-700 mb-1">
                    Transport Working Status
                  </label>
                  <Select
                    value={settings.transportWorkingStatus}
                    onChange={(e) =>
                      setSettings({ ...settings, transportWorkingStatus: e.target.value })
                    }
                    options={[
                      { value: 'operational', label: 'Fully Operational' },
                      { value: 'reduced', label: 'Reduced Schedule' },
                      { value: 'suspended', label: 'Suspended (Holidays/Advisory)' }
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-navy-700 mb-1">
                    Default Morning Pickup Window
                  </label>
                  <Input
                    value={settings.defaultMorningPickup}
                    onChange={(e) =>
                      setSettings({ ...settings, defaultMorningPickup: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-navy-700 mb-1">
                    Default Evening Drop Window
                  </label>
                  <Input
                    value={settings.defaultEveningDrop}
                    onChange={(e) =>
                      setSettings({ ...settings, defaultEveningDrop: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-navy-700 mb-1">
                    Emergency Helpline Phone
                  </label>
                  <Input
                    value={settings.emergencyContactPhone}
                    onChange={(e) =>
                      setSettings({ ...settings, emergencyContactPhone: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-navy-700 mb-1">
                    Transport Operations Email
                  </label>
                  <Input
                    type="email"
                    value={settings.transportHelplineEmail}
                    onChange={(e) =>
                      setSettings({ ...settings, transportHelplineEmail: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-navy-100 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={settingsSaving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold border-none shadow-xs cursor-pointer"
                >
                  {settingsSaving ? 'Saving...' : 'Save Transport Configuration'}
                </Button>
              </div>
            </form>
          )}
        </Card>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* TAB: TRIPS & DISPATCH MANAGEMENT (PHASE 2) */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'trips' && (
        <TripManagementView
          buses={buses}
          routes={routes}
          drivers={drivers}
          onRefreshMaster={() => {
            fetchSummary();
            fetchBuses();
            fetchRoutes();
            fetchDrivers();
          }}
        />
      )}

      {/* ------------------------------------------------------------------- */}
      {/* TAB: DAILY TRANSIT SCHEDULE (PHASE 2) */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'schedule' && <DailyScheduleView />}

      {/* ------------------------------------------------------------------- */}
      {/* TAB: LIVE GPS RADAR & TELEMETRY (PHASE 2) */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'gps' && <LiveGpsTrackingView />}

      {/* ------------------------------------------------------------------- */}
      {/* TAB: STUDENT ATTENDANCE (PHASE 2) */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'attendance' && <StudentAttendanceView />}

      {/* ------------------------------------------------------------------- */}
      {/* TAB: DRIVER DISPATCH CONSOLE (PHASE 2) */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'driver_portal' && <DriverPortalView />}

      {/* ------------------------------------------------------------------- */}
      {/* TAB: OPERATIONS SUPERVISOR DASHBOARD (PHASE 2) */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'supervisor' && (
        <SupervisorDashboardView onNavigateTab={handleTabChange} />
      )}

      {/* ------------------------------------------------------------------- */}
      {/* TAB: VEHICLE MAINTENANCE & COMPLIANCE (PHASE 3) */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'maintenance' && (
        <MaintenanceManagementView
          buses={buses}
          onRefreshMaster={() => {
            fetchSummary();
            fetchBuses();
          }}
        />
      )}

      {/* ------------------------------------------------------------------- */}
      {/* TAB: FUEL MANAGEMENT & MILEAGE (PHASE 3) */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'fuel' && (
        <FuelManagementView buses={buses} />
      )}

      {/* ------------------------------------------------------------------- */}
      {/* TAB: FLEET EXPENSES & DISBURSEMENTS (PHASE 3) */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'expenses' && (
        <TransportExpensesView buses={buses} />
      )}

      {/* ------------------------------------------------------------------- */}
      {/* TAB: TRANSPORT FEE LEDGER & RECEIPTS (PHASE 3) */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'fees' && (
        <TransportFeeManagementView routes={routes} />
      )}

      {/* ------------------------------------------------------------------- */}
      {/* TAB: TRANSPORT SAFETY & EMERGENCY SOS (PHASE 4) */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'safety' && (
        <SafetyManagementView onRefreshParent={fetchSummary} />
      )}

      {/* ------------------------------------------------------------------- */}
      {/* TAB: TRANSPORT COMPLAINTS & GRIEVANCES (PHASE 4) */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'complaints' && (
        <ComplaintsManagementView />
      )}

      {/* ------------------------------------------------------------------- */}
      {/* TAB: TRANSPORT ANNOUNCEMENTS & BROADCASTS (PHASE 4) */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'announcements' && (
        <AnnouncementsManagementView />
      )}

      {/* ------------------------------------------------------------------- */}
      {/* TAB: PARENT TRANSIT PORTAL (PHASE 4) */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'parent' && (
        <ParentTransportPortalView onOpenComplaintModal={() => handleTabChange('complaints')} />
      )}

      {/* ------------------------------------------------------------------- */}
      {/* TAB: TRANSPORT ANALYTICS & EXECUTIVE INTELLIGENCE (PHASE 5) */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'analytics' && (
        <TransportAnalyticsDashboard />
      )}

      {/* ------------------------------------------------------------------- */}
      {/* TAB: CENTRAL REPORT CENTER & EXPORTS (PHASE 5) */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'reports' && (
        <TransportReportCenter />
      )}

      {/* =================================================================== */}
      {/* MODAL: ADD / EDIT BUS */}
      {/* =================================================================== */}
      <Modal
        isOpen={isAddBusModalOpen}
        onClose={() => setIsAddBusModalOpen(false)}
        title={editingBus ? `Edit Bus Details (${editingBus.busId})` : 'Register New Vehicle to Fleet'}
      >
        <form onSubmit={handleSaveBusSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy-800 mb-1">Bus ID *</label>
              <Input
                value={busForm.busId}
                onChange={(e) => setBusForm({ ...busForm, busId: e.target.value })}
                placeholder="e.g. BUS-01"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-navy-800 mb-1">Registration Number *</label>
              <Input
                value={busForm.registrationNumber}
                onChange={(e) => setBusForm({ ...busForm, registrationNumber: e.target.value })}
                placeholder="e.g. KA-01-AB-1234"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy-800 mb-1">Bus Identifier Name *</label>
              <Input
                value={busForm.busName}
                onChange={(e) => setBusForm({ ...busForm, busName: e.target.value })}
                placeholder="e.g. Campus Express 1"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-navy-800 mb-1">Seating Capacity *</label>
              <Input
                type="number"
                min="1"
                max="100"
                value={busForm.seatingCapacity}
                onChange={(e) => setBusForm({ ...busForm, seatingCapacity: parseInt(e.target.value, 10) || 0 })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-navy-800 mb-1">Manufacturer</label>
              <Input
                value={busForm.manufacturer}
                onChange={(e) => setBusForm({ ...busForm, manufacturer: e.target.value })}
              />
            </div>
            <div>
              <label className="block font-semibold text-navy-800 mb-1">Model</label>
              <Input
                value={busForm.model}
                onChange={(e) => setBusForm({ ...busForm, model: e.target.value })}
              />
            </div>
            <div>
              <label className="block font-semibold text-navy-800 mb-1">Mfg Year</label>
              <Input
                type="number"
                value={busForm.manufacturingYear}
                onChange={(e) => setBusForm({ ...busForm, manufacturingYear: parseInt(e.target.value, 10) || 2023 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-navy-800 mb-1">Bus Type</label>
              <Select
                value={busForm.busType}
                onChange={(e) => setBusForm({ ...busForm, busType: e.target.value })}
                options={[
                  { value: 'standard', label: 'Standard' },
                  { value: 'mini', label: 'Mini Bus' },
                  { value: 'deluxe', label: 'Deluxe' },
                  { value: 'ac', label: 'Air Conditioned' }
                ]}
              />
            </div>
            <div>
              <label className="block font-semibold text-navy-800 mb-1">Fuel Type</label>
              <Select
                value={busForm.fuelType}
                onChange={(e) => setBusForm({ ...busForm, fuelType: e.target.value })}
                options={[
                  { value: 'diesel', label: 'Diesel' },
                  { value: 'cng', label: 'CNG' },
                  { value: 'electric', label: 'Electric' }
                ]}
              />
            </div>
            <div>
              <label className="block font-semibold text-navy-800 mb-1">Operational Status</label>
              <Select
                value={busForm.currentStatus}
                onChange={(e) => setBusForm({ ...busForm, currentStatus: e.target.value })}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'under_maintenance', label: 'Under Maintenance' },
                  { value: 'out_of_service', label: 'Out of Service' }
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy-800 mb-1">Insurance Expiry Date</label>
              <Input
                type="date"
                value={busForm.insuranceExpiryDate}
                onChange={(e) => setBusForm({ ...busForm, insuranceExpiryDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block font-semibold text-navy-800 mb-1">Fitness Certificate Expiry</label>
              <Input
                type="date"
                value={busForm.fitnessExpiryDate}
                onChange={(e) => setBusForm({ ...busForm, fitnessExpiryDate: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-navy-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddBusModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={busFormSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold border-none shadow-xs cursor-pointer"
            >
              {busFormSubmitting ? 'Saving...' : editingBus ? 'Update Bus' : 'Register Bus'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* =================================================================== */}
      {/* MODAL: VIEW BUS DETAILS & COMMUTERS */}
      {/* =================================================================== */}
      <Modal
        isOpen={!!selectedBusDetails}
        onClose={() => setSelectedBusDetails(null)}
        title={selectedBusDetails ? `${selectedBusDetails.busName} (${selectedBusDetails.busId})` : ''}
      >
        {selectedBusDetails && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-navy-50">
              <div>
                <span className="text-navy-500 block">Registration Number</span>
                <span className="font-mono font-bold text-navy-950 text-sm">
                  {selectedBusDetails.registrationNumber}
                </span>
              </div>
              <div>
                <span className="text-navy-500 block">Capacity & Available Seats</span>
                <span className="font-bold text-navy-950 text-sm">
                  {selectedBusDetails.seatingCapacity} Total / {selectedBusDetails.availableSeats ?? selectedBusDetails.seatingCapacity} Available
                </span>
              </div>
              <div>
                <span className="text-navy-500 block">Manufacturer / Model</span>
                <span className="font-medium text-navy-900">
                  {selectedBusDetails.manufacturer} {selectedBusDetails.model} ({selectedBusDetails.manufacturingYear})
                </span>
              </div>
              <div>
                <span className="text-navy-500 block">Assigned Route</span>
                <span className="font-medium text-navy-900">
                  {selectedBusDetails.assignedRoute?.routeName || 'Not Assigned'}
                </span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-navy-900 mb-2">
                Enrolled Students on this Vehicle ({selectedBusDetails.assignedStudents?.length || 0})
              </h4>
              {(!selectedBusDetails.assignedStudents || selectedBusDetails.assignedStudents.length === 0) ? (
                <p className="text-navy-400 italic">No students currently allocated to this bus.</p>
              ) : (
                <div className="max-h-48 overflow-y-auto divide-y divide-navy-100 border border-navy-200 rounded-lg">
                  {selectedBusDetails.assignedStudents.map((st, idx) => (
                    <div key={idx} className="p-2 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-navy-900 block">{st.studentName}</span>
                        <span className="text-[11px] text-navy-500">
                          {st.rollNumber} &bull; Stop: {st.pickupStop}
                        </span>
                      </div>
                      <Badge variant={st.transportFeeStatus === 'paid' ? 'success' : 'warning'} size="xs">
                        {st.transportFeeStatus}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* =================================================================== */}
      {/* MODAL: ADD / EDIT ROUTE WITH STOPS */}
      {/* =================================================================== */}
      <Modal
        isOpen={isAddRouteModalOpen}
        onClose={() => setIsAddRouteModalOpen(false)}
        title={editingRoute ? `Edit Route (${editingRoute.routeCode})` : 'Create New Transit Route'}
      >
        <form onSubmit={handleSaveRouteSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy-800 mb-1">Route ID *</label>
              <Input
                value={routeForm.routeId}
                onChange={(e) => setRouteForm({ ...routeForm, routeId: e.target.value })}
                placeholder="e.g. RT-01"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-navy-800 mb-1">Route Code *</label>
              <Input
                value={routeForm.routeCode}
                onChange={(e) => setRouteForm({ ...routeForm, routeCode: e.target.value })}
                placeholder="e.g. R-NC-101"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-navy-800 mb-1">Route Title Name *</label>
            <Input
              value={routeForm.routeName}
              onChange={(e) => setRouteForm({ ...routeForm, routeName: e.target.value })}
              placeholder="e.g. North City Express Route"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy-800 mb-1">Starting Origin *</label>
              <Input
                value={routeForm.startingPoint}
                onChange={(e) => setRouteForm({ ...routeForm, startingPoint: e.target.value })}
                placeholder="e.g. City Railway Station"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-navy-800 mb-1">Destination *</label>
              <Input
                value={routeForm.destination}
                onChange={(e) => setRouteForm({ ...routeForm, destination: e.target.value })}
                placeholder="e.g. Apex Engineering College Campus"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy-800 mb-1">Total Distance (km)</label>
              <Input
                type="number"
                value={routeForm.totalDistance}
                onChange={(e) => setRouteForm({ ...routeForm, totalDistance: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="block font-semibold text-navy-800 mb-1">Est. Duration</label>
              <Input
                value={routeForm.estimatedDuration}
                onChange={(e) => setRouteForm({ ...routeForm, estimatedDuration: e.target.value })}
                placeholder="e.g. 45 mins"
              />
            </div>
          </div>

          {/* Stops Dynamic Builder */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-bold text-navy-900 uppercase tracking-wider text-[11px]">
                Route Stops & Timings Sequence
              </label>
              <button
                type="button"
                onClick={handleAddStopToForm}
                className="text-amber-700 font-bold hover:text-amber-900 inline-flex items-center gap-1 cursor-pointer text-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Add Stop
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {routeForm.stops.map((stop, idx) => (
                <div key={idx} className="p-2.5 rounded-lg border border-navy-200 bg-navy-50/50 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-navy-200 text-navy-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                    {stop.stopSequence}
                  </span>
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Stop Name"
                      value={stop.stopName}
                      onChange={(e) => {
                        const updated = [...routeForm.stops];
                        updated[idx].stopName = e.target.value;
                        setRouteForm({ ...routeForm, stops: updated });
                      }}
                      className="px-2 py-1 rounded border border-navy-300 text-xs w-full bg-white"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Pickup e.g. 07:15 AM"
                      value={stop.pickupTime}
                      onChange={(e) => {
                        const updated = [...routeForm.stops];
                        updated[idx].pickupTime = e.target.value;
                        setRouteForm({ ...routeForm, stops: updated });
                      }}
                      className="px-2 py-1 rounded border border-navy-300 text-xs w-full bg-white"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Drop e.g. 05:30 PM"
                      value={stop.dropTime}
                      onChange={(e) => {
                        const updated = [...routeForm.stops];
                        updated[idx].dropTime = e.target.value;
                        setRouteForm({ ...routeForm, stops: updated });
                      }}
                      className="px-2 py-1 rounded border border-navy-300 text-xs w-full bg-white"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveStopFromForm(idx)}
                    className="text-rose-500 hover:text-rose-700 p-1"
                    title="Remove stop"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-navy-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddRouteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={routeFormSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold border-none shadow-xs cursor-pointer"
            >
              {routeFormSubmitting ? 'Saving...' : editingRoute ? 'Update Route' : 'Create Route'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* =================================================================== */}
      {/* MODAL: VIEW ROUTE DETAILS */}
      {/* =================================================================== */}
      <Modal
        isOpen={!!selectedRouteDetails}
        onClose={() => setSelectedRouteDetails(null)}
        title={selectedRouteDetails ? `${selectedRouteDetails.routeName} (${selectedRouteDetails.routeCode})` : ''}
      >
        {selectedRouteDetails && (
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-navy-50 flex items-center justify-between">
              <div>
                <span className="text-navy-500 block">Transit Path</span>
                <span className="font-bold text-navy-950 text-sm">
                  {selectedRouteDetails.startingPoint} &rarr; {selectedRouteDetails.destination}
                </span>
              </div>
              <Badge variant={selectedRouteDetails.routeStatus === 'active' ? 'success' : 'default'} size="xs">
                {selectedRouteDetails.routeStatus}
              </Badge>
            </div>

            <div>
              <h4 className="font-bold text-navy-900 mb-2">Sequential Stop Schedule</h4>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {(selectedRouteDetails.stops || []).map((s, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg border border-navy-100 bg-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 font-bold flex items-center justify-center text-[11px]">
                        {s.stopSequence}
                      </span>
                      <div>
                        <span className="font-semibold text-navy-900 block">{s.stopName}</span>
                        <span className="text-[11px] text-navy-500">{s.stopAddress || 'Scheduled halt'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-emerald-700 font-bold block">Pickup: {s.pickupTime}</span>
                      <span className="text-navy-500 text-[11px]">Drop: {s.dropTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* =================================================================== */}
      {/* MODAL: ADD / EDIT DRIVER */}
      {/* =================================================================== */}
      <Modal
        isOpen={isAddDriverModalOpen}
        onClose={() => setIsAddDriverModalOpen(false)}
        title={editingDriver ? `Edit Driver (${editingDriver.driverId})` : 'Register Qualified Driver Profile'}
      >
        <form onSubmit={handleSaveDriverSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy-800 mb-1">Driver ID *</label>
              <Input
                value={driverForm.driverId}
                onChange={(e) => setDriverForm({ ...driverForm, driverId: e.target.value })}
                placeholder="e.g. DRV-01"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-navy-800 mb-1">Full Legal Name *</label>
              <Input
                value={driverForm.fullName}
                onChange={(e) => setDriverForm({ ...driverForm, fullName: e.target.value })}
                placeholder="e.g. Rajesh Kumar"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy-800 mb-1">Phone Number *</label>
              <Input
                value={driverForm.phoneNumber}
                onChange={(e) => setDriverForm({ ...driverForm, phoneNumber: e.target.value })}
                placeholder="+91 98450 11223"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-navy-800 mb-1">Email Address</label>
              <Input
                type="email"
                value={driverForm.email}
                onChange={(e) => setDriverForm({ ...driverForm, email: e.target.value })}
                placeholder="driver@college.edu"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy-800 mb-1">Driving Licence Number *</label>
              <Input
                value={driverForm.drivingLicenceNumber}
                onChange={(e) => setDriverForm({ ...driverForm, drivingLicenceNumber: e.target.value })}
                placeholder="e.g. DL-KA-2015-001234"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-navy-800 mb-1">Licence Expiry Date *</label>
              <Input
                type="date"
                value={driverForm.licenceExpiryDate}
                onChange={(e) => setDriverForm({ ...driverForm, licenceExpiryDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy-800 mb-1">Availability</label>
              <Select
                value={driverForm.availabilityStatus}
                onChange={(e) => setDriverForm({ ...driverForm, availabilityStatus: e.target.value })}
                options={[
                  { value: 'available', label: 'Available for Duty' },
                  { value: 'on_duty', label: 'On Duty' },
                  { value: 'off_duty', label: 'Off Duty' },
                  { value: 'sick_leave', label: 'On Leave' }
                ]}
              />
            </div>
            <div>
              <label className="block font-semibold text-navy-800 mb-1">Employment Status</label>
              <Select
                value={driverForm.employmentStatus}
                onChange={(e) => setDriverForm({ ...driverForm, employmentStatus: e.target.value })}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'on_leave', label: 'On Leave' },
                  { value: 'inactive', label: 'Inactive' }
                ]}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-navy-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddDriverModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={driverFormSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold border-none shadow-xs cursor-pointer"
            >
              {driverFormSubmitting ? 'Saving...' : editingDriver ? 'Update Driver' : 'Save Driver'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* =================================================================== */}
      {/* MODAL: VIEW DRIVER DETAILS */}
      {/* =================================================================== */}
      <Modal
        isOpen={!!selectedDriverDetails}
        onClose={() => setSelectedDriverDetails(null)}
        title={selectedDriverDetails ? `${selectedDriverDetails.fullName} (${selectedDriverDetails.driverId})` : ''}
      >
        {selectedDriverDetails && (
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-navy-50 grid grid-cols-2 gap-3">
              <div>
                <span className="text-navy-500 block">Licence Number</span>
                <span className="font-mono font-bold text-navy-950">{selectedDriverDetails.drivingLicenceNumber}</span>
              </div>
              <div>
                <span className="text-navy-500 block">Licence Expiry</span>
                <span className="font-medium text-navy-900">
                  {selectedDriverDetails.licenceExpiryDate ? new Date(selectedDriverDetails.licenceExpiryDate).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-navy-500 block">Phone Contact</span>
                <span className="font-medium text-navy-900">{selectedDriverDetails.phoneNumber}</span>
              </div>
              <div>
                <span className="text-navy-500 block">Duty Availability</span>
                <Badge variant={selectedDriverDetails.availabilityStatus === 'available' ? 'success' : 'default'} size="xs">
                  {selectedDriverDetails.availabilityStatus}
                </Badge>
              </div>
            </div>

            <div>
              <span className="text-navy-500 block">Residential Address</span>
              <p className="text-navy-800">{selectedDriverDetails.address || 'Address on file'}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* =================================================================== */}
      {/* MODAL: ALLOCATE STUDENT TO BUS & ROUTE */}
      {/* =================================================================== */}
      <Modal
        isOpen={isAllocateModalOpen}
        onClose={() => setIsAllocateModalOpen(false)}
        title="Allocate Student to Campus Bus Transit"
      >
        <form onSubmit={handleSaveAllocationSubmit} className="space-y-4 text-xs">
          {/* Student selection from real ERP records */}
          <div>
            <label className="block font-semibold text-navy-800 mb-1">Select Student *</label>
            {eligibleLoading ? (
              <div className="text-navy-500 py-1">Loading students...</div>
            ) : (
              <Select
                value={allocationForm.student}
                onChange={(e) => setAllocationForm({ ...allocationForm, student: e.target.value })}
                options={[
                  { value: '', label: '-- Select Eligible Student --' },
                  ...eligibleStudents.map((st) => ({
                    value: st._id,
                    label: `${st.name} (${st.rollNumber}) - ${st.department} ${st.hasActiveTransport ? '[Has Pass]' : ''}`
                  }))
                ]}
                required
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Bus selection */}
            <div>
              <label className="block font-semibold text-navy-800 mb-1">Assigned Bus *</label>
              <Select
                value={allocationForm.bus}
                onChange={(e) => setAllocationForm({ ...allocationForm, bus: e.target.value })}
                options={[
                  { value: '', label: '-- Choose Active Bus --' },
                  ...buses
                    .filter((b) => b.currentStatus === 'active')
                    .map((b) => ({
                      value: b._id,
                      label: `${b.busName} (${b.availableSeats ?? b.seatingCapacity} seats left)`
                    }))
                ]}
                required
              />
            </div>

            {/* Route selection */}
            <div>
              <label className="block font-semibold text-navy-800 mb-1">Transit Route *</label>
              <Select
                value={allocationForm.route}
                onChange={(e) => handleRouteSelectionInModal(e.target.value)}
                options={[
                  { value: '', label: '-- Choose Active Route --' },
                  ...routes
                    .filter((r) => r.routeStatus === 'active')
                    .map((r) => ({
                      value: r._id,
                      label: `${r.routeCode} - ${r.routeName}`
                    }))
                ]}
                required
              />
            </div>
          </div>

          {/* Stop selection dynamically derived from selected route */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy-800 mb-1">Boarding Pickup Stop *</label>
              {(() => {
                const currentRoute = routes.find((r) => r._id === allocationForm.route);
                const stops = currentRoute?.stops || [];
                return (
                  <Select
                    value={allocationForm.pickupStop}
                    onChange={(e) =>
                      setAllocationForm({
                        ...allocationForm,
                        pickupStop: e.target.value,
                        dropStop: e.target.value
                      })
                    }
                    options={[
                      { value: '', label: '-- Select Route Stop --' },
                      ...stops.map((s) => ({
                        value: s.stopName,
                        label: `${s.stopSequence}. ${s.stopName} (${s.pickupTime})`
                      }))
                    ]}
                    required
                  />
                );
              })()}
            </div>

            <div>
              <label className="block font-semibold text-navy-800 mb-1">Evening Drop Stop *</label>
              {(() => {
                const currentRoute = routes.find((r) => r._id === allocationForm.route);
                const stops = currentRoute?.stops || [];
                return (
                  <Select
                    value={allocationForm.dropStop}
                    onChange={(e) => setAllocationForm({ ...allocationForm, dropStop: e.target.value })}
                    options={[
                      { value: '', label: '-- Select Drop Stop --' },
                      ...stops.map((s) => ({
                        value: s.stopName,
                        label: `${s.stopSequence}. ${s.stopName} (${s.dropTime})`
                      }))
                    ]}
                    required
                  />
                );
              })()}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy-800 mb-1">Academic Year</label>
              <Input
                value={allocationForm.academicYear}
                onChange={(e) => setAllocationForm({ ...allocationForm, academicYear: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-navy-800 mb-1">Transport Fee Status</label>
              <Select
                value={allocationForm.transportFeeStatus}
                onChange={(e) => setAllocationForm({ ...allocationForm, transportFeeStatus: e.target.value })}
                options={[
                  { value: 'paid', label: 'Transit Fee Paid' },
                  { value: 'pending', label: 'Payment Pending' },
                  { value: 'waived', label: 'Scholarship / Waived' }
                ]}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-navy-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAllocateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={allocateFormSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold border-none shadow-xs cursor-pointer"
            >
              {allocateFormSubmitting ? 'Allocating...' : 'Confirm Allocation Pass'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TransportAdminDashboard;

