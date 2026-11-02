import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  Bus,
  MapPin,
  Users,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Play,
  CheckCircle2,
  XCircle,
  Eye,
  AlertTriangle
} from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import api from '../../api/apiClient';

export const TripManagementView = ({ buses = [], routes = [], drivers = [], onRefreshMaster }) => {
  const { addToast } = useToast();

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [busFilter, setBusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTripDetails, setSelectedTripDetails] = useState(null);
  const [cancellingTrip, setCancellingTrip] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    tripId: '',
    bus: '',
    driver: '',
    route: '',
    tripType: 'morning_pickup',
    tripDate: new Date().toISOString().split('T')[0],
    scheduledDeparture: '07:30',
    scheduledArrival: '08:45',
    delayReason: ''
  });

  const fetchTrips = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getTrips({
        search,
        status: statusFilter,
        tripType: typeFilter,
        bus: busFilter,
        date: dateFilter
      });
      if (res && res.data) {
        setTrips(res.data);
      }
    } catch (err) {
      addToast(err.message || 'Failed to fetch trips', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, typeFilter, busFilter, dateFilter, addToast]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    if (!formData.tripId || !formData.bus || !formData.driver || !formData.route) {
      addToast('Please complete all required fields', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.createTrip(formData);
      if (res.success) {
        addToast(`Trip ${formData.tripId.toUpperCase()} created successfully`, 'success');
        setIsCreateModalOpen(false);
        setFormData({
          tripId: '',
          bus: '',
          driver: '',
          route: '',
          tripType: 'morning_pickup',
          tripDate: new Date().toISOString().split('T')[0],
          scheduledDeparture: '07:30',
          scheduledArrival: '08:45',
          delayReason: ''
        });
        fetchTrips();
        if (onRefreshMaster) onRefreshMaster();
      }
    } catch (err) {
      addToast(err.message || 'Failed to create trip', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartTrip = async (id, tripCode) => {
    try {
      const res = await api.startTrip(id);
      if (res.success) {
        addToast(`Trip ${tripCode} started`, 'success');
        fetchTrips();
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
        fetchTrips();
      }
    } catch (err) {
      addToast(err.message || 'Failed to complete trip', 'error');
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancellationReason.trim()) {
      addToast('Please enter a cancellation reason', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.cancelTrip(cancellingTrip._id, cancellationReason);
      if (res.success) {
        addToast(`Trip ${cancellingTrip.tripId} cancelled`, 'success');
        setCancellingTrip(null);
        setCancellationReason('');
        fetchTrips();
      }
    } catch (err) {
      addToast(err.message || 'Failed to cancel trip', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDetails = async (id) => {
    try {
      const res = await api.getTripById(id);
      if (res.success) {
        setSelectedTripDetails(res.data);
      }
    } catch (err) {
      addToast('Failed to load trip details', 'error');
    }
  };

  // Helper for status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="info">Scheduled</Badge>;
      case 'started':
      case 'in_progress':
        return <Badge variant="warning">In Progress</Badge>;
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'delayed':
        return <Badge variant="error">Delayed</Badge>;
      case 'cancelled':
        return <Badge variant="neutral">Cancelled</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-navy-950 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            Trip & Schedule Management
          </h2>
          <p className="text-xs text-navy-500">
            Dispatch, monitor, and manage daily transit trips with conflict prevention.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchTrips} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Create Trip
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 bg-white border border-navy-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <Input
            placeholder="Search Trip ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-navy-400" />}
          />
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            placeholder="Filter Date"
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'scheduled', label: 'Scheduled' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'completed', label: 'Completed' },
              { value: 'delayed', label: 'Delayed' },
              { value: 'cancelled', label: 'Cancelled' }
            ]}
          />
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Trip Types' },
              { value: 'morning_pickup', label: 'Morning Pickup' },
              { value: 'evening_drop', label: 'Evening Drop' },
              { value: 'special', label: 'Special Service' }
            ]}
          />
          <Select
            value={busFilter}
            onChange={(e) => setBusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Buses' },
              ...buses.map((b) => ({ value: b._id, label: `${b.busName} (${b.busId})` }))
            ]}
          />
        </div>
      </Card>

      {/* Trips Table */}
      <Card className="overflow-hidden border border-navy-200">
        <Table
          columns={[
            {
              header: 'Trip ID & Type',
              accessor: 'tripId',
              render: (_, row) => (
                <div>
                  <span className="font-mono font-bold text-navy-950 text-xs block">
                    {row.tripId}
                  </span>
                  <Badge
                    variant={row.tripType === 'morning_pickup' ? 'warning' : 'info'}
                    size="xs"
                  >
                    {row.tripType === 'morning_pickup' ? 'Morning Pickup' : 'Evening Drop'}
                  </Badge>
                </div>
              )
            },
            {
              header: 'Date & Schedule',
              accessor: 'tripDate',
              render: (_, row) => (
                <div className="text-xs">
                  <span className="text-navy-900 font-medium block">
                    {new Date(row.tripDate).toLocaleDateString()}
                  </span>
                  <span className="text-navy-500">
                    {row.scheduledDeparture} &rarr; {row.scheduledArrival}
                  </span>
                </div>
              )
            },
            {
              header: 'Bus & Route',
              accessor: 'bus',
              render: (_, row) => (
                <div className="text-xs">
                  <span className="font-semibold text-navy-900 block">
                    {row.bus?.busName || 'Unassigned'} ({row.bus?.busId})
                  </span>
                  <span className="text-navy-500">
                    Route: {row.route?.routeName || row.route?.routeCode}
                  </span>
                </div>
              )
            },
            {
              header: 'Driver',
              accessor: 'driver',
              render: (_, row) => (
                <div className="text-xs">
                  <span className="font-medium text-navy-900 block">
                    {row.driver?.fullName || 'Unassigned'}
                  </span>
                  <span className="text-navy-400">{row.driver?.phoneNumber}</span>
                </div>
              )
            },
            {
              header: 'Status',
              accessor: 'tripStatus',
              render: (_, row) => getStatusBadge(row.tripStatus)
            },
            {
              header: 'Actions',
              accessor: '_id',
              render: (_, row) => (
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => handleViewDetails(row._id)}
                    title="View Trip Details"
                  >
                    <Eye className="w-3.5 h-3.5 text-navy-600" />
                  </Button>

                  {row.tripStatus === 'scheduled' && (
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => handleStartTrip(row._id, row.tripId)}
                      title="Start Trip"
                      className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </Button>
                  )}

                  {(row.tripStatus === 'started' || row.tripStatus === 'in_progress') && (
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => handleCompleteTrip(row._id, row.tripId)}
                      title="Complete Trip"
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </Button>
                  )}

                  {row.tripStatus !== 'completed' && row.tripStatus !== 'cancelled' && (
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => setCancellingTrip(row)}
                      title="Cancel Trip"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              )
            }
          ]}
          data={trips}
          isLoading={loading}
          emptyText="No trips found matching filter criteria."
        />
      </Card>

      {/* CREATE TRIP MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Schedule New Transit Trip"
      >
        <form onSubmit={handleCreateTrip} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-navy-700 font-semibold mb-1">
                Trip ID / Code <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g. TRP-2026-001"
                value={formData.tripId}
                onChange={(e) => setFormData({ ...formData, tripId: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-navy-700 font-semibold mb-1">
                Trip Type <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.tripType}
                onChange={(e) => setFormData({ ...formData, tripType: e.target.value })}
                options={[
                  { value: 'morning_pickup', label: 'Morning Pickup' },
                  { value: 'evening_drop', label: 'Evening Drop' },
                  { value: 'special', label: 'Special Service' }
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-navy-700 font-semibold mb-1">
                Assign Bus <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.bus}
                onChange={(e) => setFormData({ ...formData, bus: e.target.value })}
                options={[
                  { value: '', label: 'Select Active Bus' },
                  ...buses
                    .filter((b) => b.currentStatus === 'active')
                    .map((b) => ({
                      value: b._id,
                      label: `${b.busName} (${b.registrationNumber}) [Cap: ${b.seatingCapacity}]`
                    }))
                ]}
                required
              />
            </div>
            <div>
              <label className="block text-navy-700 font-semibold mb-1">
                Assign Driver <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.driver}
                onChange={(e) => setFormData({ ...formData, driver: e.target.value })}
                options={[
                  { value: '', label: 'Select Available Driver' },
                  ...drivers
                    .filter((d) => d.availabilityStatus === 'available' || d.availabilityStatus === 'on_duty')
                    .map((d) => ({
                      value: d._id,
                      label: `${d.fullName} (${d.driverId})`
                    }))
                ]}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-navy-700 font-semibold mb-1">
              Select Route <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.route}
              onChange={(e) => setFormData({ ...formData, route: e.target.value })}
              options={[
                { value: '', label: 'Select Transit Route' },
                ...routes.map((r) => ({
                  value: r._id,
                  label: `${r.routeName} (${r.routeCode}) &bull; ${r.stops?.length || 0} stops`
                }))
              ]}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-navy-700 font-semibold mb-1">
                Trip Date <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={formData.tripDate}
                onChange={(e) => setFormData({ ...formData, tripDate: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-navy-700 font-semibold mb-1">
                Scheduled Departure <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="07:30"
                value={formData.scheduledDeparture}
                onChange={(e) => setFormData({ ...formData, scheduledDeparture: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-navy-700 font-semibold mb-1">
                Scheduled Arrival <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="08:45"
                value={formData.scheduledArrival}
                onChange={(e) => setFormData({ ...formData, scheduledArrival: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-navy-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold"
            >
              {isSubmitting ? 'Creating...' : 'Schedule Trip'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* TRIP DETAILS MODAL */}
      <Modal
        isOpen={!!selectedTripDetails}
        onClose={() => setSelectedTripDetails(null)}
        title={selectedTripDetails ? `Trip Details — ${selectedTripDetails.tripId}` : ''}
      >
        {selectedTripDetails && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-navy-50 rounded-xl">
              <div>
                <span className="text-navy-500 block">Status & Type</span>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusBadge(selectedTripDetails.tripStatus)}
                  <span className="font-semibold text-navy-900 capitalize">
                    {selectedTripDetails.tripType?.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-navy-500 block">Scheduled Window</span>
                <span className="font-bold text-navy-900 text-sm mt-1 block">
                  {selectedTripDetails.scheduledDeparture} &rarr; {selectedTripDetails.scheduledArrival}
                </span>
              </div>
              <div>
                <span className="text-navy-500 block">Assigned Bus</span>
                <span className="font-semibold text-navy-900">
                  {selectedTripDetails.bus?.busName} ({selectedTripDetails.bus?.registrationNumber})
                </span>
              </div>
              <div>
                <span className="text-navy-500 block">Assigned Driver</span>
                <span className="font-semibold text-navy-900">
                  {selectedTripDetails.driver?.fullName} ({selectedTripDetails.driver?.phoneNumber})
                </span>
              </div>
            </div>

            {/* Attendance Roster Summary */}
            {selectedTripDetails.attendanceStats && (
              <div className="p-3 border border-navy-200 rounded-xl space-y-2">
                <h4 className="font-bold text-navy-900 flex items-center justify-between">
                  <span>Student Commuter Boarding</span>
                  <Badge variant="info" size="xs">
                    {selectedTripDetails.attendanceStats.totalExpected} Enrolled
                  </Badge>
                </h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <span className="text-[11px] text-emerald-600 block">Boarded</span>
                    <span className="text-lg font-bold text-emerald-700">
                      {selectedTripDetails.attendanceStats.boardedCount}
                    </span>
                  </div>
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <span className="text-[11px] text-blue-600 block">Dropped</span>
                    <span className="text-lg font-bold text-blue-700">
                      {selectedTripDetails.attendanceStats.droppedCount}
                    </span>
                  </div>
                  <div className="p-2 bg-amber-50 rounded-lg">
                    <span className="text-[11px] text-amber-600 block">Pending</span>
                    <span className="text-lg font-bold text-amber-700">
                      {selectedTripDetails.attendanceStats.pendingCount}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* CANCEL TRIP CONFIRMATION MODAL */}
      <Modal
        isOpen={!!cancellingTrip}
        onClose={() => setCancellingTrip(null)}
        title="Cancel Transit Trip"
      >
        <div className="space-y-4 text-xs">
          <p className="text-navy-700">
            Are you sure you want to cancel trip{' '}
            <strong className="text-navy-950 font-bold">{cancellingTrip?.tripId}</strong>?
            This will release the bus and driver back to available fleet.
          </p>
          <div>
            <label className="block text-navy-800 font-semibold mb-1">
              Cancellation Reason <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="e.g. Inclement weather, driver emergency, mechanical issue"
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setCancellingTrip(null)}>
              Dismiss
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmCancel}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              {isSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TripManagementView;

