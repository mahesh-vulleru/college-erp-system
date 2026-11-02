import React, { useState, useEffect, useCallback } from 'react';
import {
  Wrench,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Filter,
  RefreshCw,
  FileText,
  ShieldAlert,
  Car,
  Eye,
  DollarSign
} from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import api from '../../api/apiClient';

export const MaintenanceManagementView = ({ buses = [], onRefreshMaster }) => {
  const { addToast } = useToast();

  const [activeSection, setActiveSection] = useState('records'); // records, expiry
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [expiryAlerts, setExpiryAlerts] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [busFilter, setBusFilter] = useState('all');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    maintenanceId: '',
    bus: '',
    maintenanceType: 'Regular Service',
    serviceDate: new Date().toISOString().split('T')[0],
    nextServiceDate: '',
    odometerReading: '',
    serviceProvider: '',
    serviceDescription: '',
    partsReplaced: '',
    labourCost: '',
    partsCost: '',
    invoiceReference: '',
    maintenanceStatus: 'Scheduled',
    remarks: ''
  });

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const [recRes, alertRes] = await Promise.all([
        api.getMaintenanceRecords({
          search,
          status: statusFilter,
          type: typeFilter,
          bus: busFilter
        }),
        api.getDocumentExpiryAlerts()
      ]);

      if (recRes && recRes.data) setMaintenanceRecords(recRes.data);
      if (alertRes && alertRes.data) setExpiryAlerts(alertRes);
    } catch (err) {
      addToast(err.message || 'Failed to fetch maintenance data', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, typeFilter, busFilter, addToast]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.maintenanceId || !formData.bus || !formData.serviceProvider || !formData.serviceDescription) {
      addToast('Please complete all mandatory fields', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.createMaintenanceRecord(formData);
      if (res.success) {
        addToast(`Maintenance record ${formData.maintenanceId.toUpperCase()} created`, 'success');
        setIsCreateModalOpen(false);
        setFormData({
          maintenanceId: '',
          bus: '',
          maintenanceType: 'Regular Service',
          serviceDate: new Date().toISOString().split('T')[0],
          nextServiceDate: '',
          odometerReading: '',
          serviceProvider: '',
          serviceDescription: '',
          partsReplaced: '',
          labourCost: '',
          partsCost: '',
          invoiceReference: '',
          maintenanceStatus: 'Scheduled',
          remarks: ''
        });
        fetchRecords();
        if (onRefreshMaster) onRefreshMaster();
      }
    } catch (err) {
      addToast(err.message || 'Failed to create maintenance record', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteService = async (id, mntId) => {
    try {
      const res = await api.completeMaintenance(id, 'Service inspected and vehicle certified fit for duty');
      if (res.success) {
        addToast(`Maintenance ${mntId} marked Completed. Vehicle returned to active service.`, 'success');
        fetchRecords();
        if (onRefreshMaster) onRefreshMaster();
      }
    } catch (err) {
      addToast(err.message || 'Failed to complete maintenance', 'error');
    }
  };

  const underMntCount = maintenanceRecords.filter(
    (m) => m.maintenanceStatus === 'Scheduled' || m.maintenanceStatus === 'In Progress'
  ).length;
  const completedCount = maintenanceRecords.filter((m) => m.maintenanceStatus === 'Completed').length;
  const expiredDocsCount = expiryAlerts?.summary?.expiredCount || 0;
  const expiringSoonCount = expiryAlerts?.summary?.expiringSoonCount || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-navy-950 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-500" />
            Vehicle Maintenance & Document Compliance
          </h2>
          <p className="text-xs text-navy-500">
            Track garage services, repair expenses, odometer intervals, and legal compliance certificates.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchRecords} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Schedule Service
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4 bg-amber-50 border border-amber-200">
          <span className="text-[11px] font-semibold text-amber-700 block">Under Maintenance</span>
          <span className="text-2xl font-bold text-amber-900 mt-1 block">{underMntCount} Buses</span>
        </Card>
        <Card className="p-4 bg-emerald-50 border border-emerald-200">
          <span className="text-[11px] font-semibold text-emerald-700 block">Completed Services</span>
          <span className="text-2xl font-bold text-emerald-900 mt-1 block">{completedCount} Records</span>
        </Card>
        <Card className="p-4 bg-red-50 border border-red-200">
          <span className="text-[11px] font-semibold text-red-700 block">Expired Compliance Docs</span>
          <span className="text-2xl font-bold text-red-900 mt-1 block">{expiredDocsCount} Documents</span>
        </Card>
        <Card className="p-4 bg-yellow-50 border border-yellow-200">
          <span className="text-[11px] font-semibold text-yellow-800 block">Expiring Soon (30 Days)</span>
          <span className="text-2xl font-bold text-yellow-900 mt-1 block">{expiringSoonCount} Documents</span>
        </Card>
      </div>

      {/* Section Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-navy-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveSection('records')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-all ${
            activeSection === 'records'
              ? 'bg-navy-900 text-white'
              : 'text-navy-600 hover:bg-navy-100'
          }`}
        >
          Maintenance Records & Services ({maintenanceRecords.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('expiry')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-all ${
            activeSection === 'expiry'
              ? 'bg-amber-500 text-stone-950 font-bold'
              : 'text-navy-600 hover:bg-navy-100'
          }`}
        >
          Document Expiry Alerts & Certificates ({expiryAlerts?.data?.length || 0})
        </button>
      </div>

      {activeSection === 'records' ? (
        <>
          {/* Filters */}
          <Card className="p-4 bg-white border border-navy-200">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <Input
                placeholder="Search ID, provider, description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search className="w-4 h-4 text-navy-400" />}
              />
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'Scheduled', label: 'Scheduled' },
                  { value: 'In Progress', label: 'In Progress' },
                  { value: 'Completed', label: 'Completed' },
                  { value: 'Cancelled', label: 'Cancelled' }
                ]}
              />
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Maintenance Types' },
                  { value: 'Regular Service', label: 'Regular Service' },
                  { value: 'Engine Repair', label: 'Engine Repair' },
                  { value: 'Tyre Replacement', label: 'Tyre Replacement' },
                  { value: 'Brake Inspection', label: 'Brake Inspection' },
                  { value: 'Battery Replacement', label: 'Battery Replacement' },
                  { value: 'Electrical Repair', label: 'Electrical Repair' },
                  { value: 'Accident Repair', label: 'Accident Repair' }
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

          {/* Table */}
          <Card className="overflow-hidden border border-navy-200">
            <Table
              columns={[
                {
                  header: 'Maintenance ID & Type',
                  accessor: 'maintenanceId',
                  render: (_, row) => (
                    <div>
                      <span className="font-mono font-bold text-navy-950 text-xs block">
                        {row.maintenanceId}
                      </span>
                      <Badge variant="info" size="xs">
                        {row.maintenanceType}
                      </Badge>
                    </div>
                  )
                },
                {
                  header: 'Bus Vehicle',
                  accessor: 'bus',
                  render: (_, row) => (
                    <div className="text-xs">
                      <span className="font-semibold text-navy-900 block">
                        {row.bus?.busName || 'Vehicle'} ({row.bus?.busId})
                      </span>
                      <span className="text-navy-500 font-mono text-[11px]">
                        {row.busRegistrationNumber || row.bus?.registrationNumber}
                      </span>
                    </div>
                  )
                },
                {
                  header: 'Service Date',
                  accessor: 'serviceDate',
                  render: (_, row) => (
                    <div className="text-xs">
                      <span className="text-navy-900 font-medium block">
                        {new Date(row.serviceDate).toLocaleDateString()}
                      </span>
                      {row.nextServiceDate && (
                        <span className="text-navy-500 text-[11px]">
                          Next: {new Date(row.nextServiceDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  )
                },
                {
                  header: 'Garage / Description',
                  accessor: 'serviceProvider',
                  render: (_, row) => (
                    <div className="text-xs">
                      <span className="font-bold text-navy-900 block">{row.serviceProvider}</span>
                      <span className="text-navy-500 line-clamp-1">{row.serviceDescription}</span>
                    </div>
                  )
                },
                {
                  header: 'Cost Breakdown',
                  accessor: 'totalCost',
                  render: (_, row) => (
                    <div className="text-xs">
                      <span className="font-bold text-navy-950 text-sm block">
                        ₹{row.totalCost?.toLocaleString()}
                      </span>
                      <span className="text-navy-400 text-[11px]">
                        Labour: ₹{row.labourCost || 0} | Parts: ₹{row.partsCost || 0}
                      </span>
                    </div>
                  )
                },
                {
                  header: 'Status',
                  accessor: 'maintenanceStatus',
                  render: (_, row) => (
                    <Badge
                      variant={
                        row.maintenanceStatus === 'Completed'
                          ? 'success'
                          : row.maintenanceStatus === 'In Progress'
                          ? 'warning'
                          : 'info'
                      }
                      size="xs"
                    >
                      {row.maintenanceStatus?.toUpperCase()}
                    </Badge>
                  )
                },
                {
                  header: 'Actions',
                  accessor: '_id',
                  render: (_, row) => (
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => setSelectedRecord(row)}
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5 text-navy-600" />
                      </Button>
                      {row.maintenanceStatus !== 'Completed' && row.maintenanceStatus !== 'Cancelled' && (
                        <Button
                          size="xs"
                          onClick={() => handleCompleteService(row._id, row.maintenanceId)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          title="Complete Service & Return to Fleet"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Complete
                        </Button>
                      )}
                    </div>
                  )
                }
              ]}
              data={maintenanceRecords}
              isLoading={loading}
              emptyText="No maintenance records found matching criteria."
            />
          </Card>
        </>
      ) : (
        /* EXPIRY ALERTS TABLE */
        <Card className="overflow-hidden border border-navy-200">
          <Table
            columns={[
              {
                header: 'Vehicle & Registration',
                accessor: 'busName',
                render: (_, row) => (
                  <div>
                    <span className="font-bold text-navy-950 text-xs block">{row.busName} ({row.busId})</span>
                    <span className="font-mono text-navy-500 text-[11px]">{row.registrationNumber}</span>
                  </div>
                )
              },
              {
                header: 'Compliance Certificate',
                accessor: 'documentType',
                render: (_, row) => (
                  <span className="font-semibold text-navy-900 text-xs">{row.documentType}</span>
                )
              },
              {
                header: 'Expiry Date',
                accessor: 'expiryDate',
                render: (_, row) => (
                  <span className="font-medium text-navy-800 text-xs">
                    {new Date(row.expiryDate).toLocaleDateString()}
                  </span>
                )
              },
              {
                header: 'Timeline Remaining',
                accessor: 'daysRemaining',
                render: (_, row) => (
                  <span
                    className={`font-bold text-xs ${
                      row.daysRemaining <= 0
                        ? 'text-red-600'
                        : row.daysRemaining <= 15
                        ? 'text-amber-600'
                        : 'text-navy-700'
                    }`}
                  >
                    {row.daysRemaining <= 0
                      ? `EXPIRED (${Math.abs(row.daysRemaining)} days ago)`
                      : `${row.daysRemaining} days remaining`}
                  </span>
                )
              },
              {
                header: 'Status Alert',
                accessor: 'status',
                render: (_, row) => (
                  <Badge
                    variant={row.status === 'Expired' ? 'error' : row.status === 'Expiring Soon' ? 'warning' : 'success'}
                    size="xs"
                  >
                    {row.status?.toUpperCase()}
                  </Badge>
                )
              }
            ]}
            data={expiryAlerts?.data || []}
            isLoading={loading}
            emptyText="No document expiry alerts found."
          />
        </Card>
      )}

      {/* CREATE MAINTENANCE RECORD MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Schedule Vehicle Maintenance / Service"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-navy-800 font-semibold mb-1">
                Maintenance ID <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g. MNT-2026-001"
                value={formData.maintenanceId}
                onChange={(e) => setFormData({ ...formData, maintenanceId: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-navy-800 font-semibold mb-1">
                Select Vehicle <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.bus}
                onChange={(e) => setFormData({ ...formData, bus: e.target.value })}
                options={[
                  { value: '', label: 'Select Bus' },
                  ...buses.map((b) => ({
                    value: b._id,
                    label: `${b.busName} (${b.registrationNumber})`
                  }))
                ]}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-navy-800 font-semibold mb-1">Maintenance Type</label>
              <Select
                value={formData.maintenanceType}
                onChange={(e) => setFormData({ ...formData, maintenanceType: e.target.value })}
                options={[
                  { value: 'Regular Service', label: 'Regular Service' },
                  { value: 'Engine Repair', label: 'Engine Repair' },
                  { value: 'Tyre Replacement', label: 'Tyre Replacement' },
                  { value: 'Brake Inspection', label: 'Brake Inspection' },
                  { value: 'Battery Replacement', label: 'Battery Replacement' },
                  { value: 'Electrical Repair', label: 'Electrical Repair' },
                  { value: 'Accident Repair', label: 'Accident Repair' },
                  { value: 'Other Maintenance', label: 'Other Maintenance' }
                ]}
              />
            </div>
            <div>
              <label className="block text-navy-800 font-semibold mb-1">Service Status</label>
              <Select
                value={formData.maintenanceStatus}
                onChange={(e) => setFormData({ ...formData, maintenanceStatus: e.target.value })}
                options={[
                  { value: 'Scheduled', label: 'Scheduled (Takes Bus Out of Service)' },
                  { value: 'In Progress', label: 'In Progress' },
                  { value: 'Completed', label: 'Completed' }
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-navy-800 font-semibold mb-1">Service Date *</label>
              <Input
                type="date"
                value={formData.serviceDate}
                onChange={(e) => setFormData({ ...formData, serviceDate: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-navy-800 font-semibold mb-1">Next Service Date</label>
              <Input
                type="date"
                value={formData.nextServiceDate}
                onChange={(e) => setFormData({ ...formData, nextServiceDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-navy-800 font-semibold mb-1">Odometer (km)</label>
              <Input
                type="number"
                placeholder="45200"
                value={formData.odometerReading}
                onChange={(e) => setFormData({ ...formData, odometerReading: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-navy-800 font-semibold mb-1">Service Provider / Garage *</label>
              <Input
                placeholder="e.g. Apex Central Fleet Care"
                value={formData.serviceProvider}
                onChange={(e) => setFormData({ ...formData, serviceProvider: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-navy-800 font-semibold mb-1">Invoice / Bill Ref #</label>
              <Input
                placeholder="e.g. INV-GARAGE-882"
                value={formData.invoiceReference}
                onChange={(e) => setFormData({ ...formData, invoiceReference: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-navy-800 font-semibold mb-1">Service Description *</label>
            <Input
              placeholder="e.g. 50,000 km general overhaul, synthetic oil change, brake fluid topup"
              value={formData.serviceDescription}
              onChange={(e) => setFormData({ ...formData, serviceDescription: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-navy-800 font-semibold mb-1">Labour Cost (₹)</label>
              <Input
                type="number"
                placeholder="2500"
                value={formData.labourCost}
                onChange={(e) => setFormData({ ...formData, labourCost: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-navy-800 font-semibold mb-1">Parts Cost (₹)</label>
              <Input
                type="number"
                placeholder="6800"
                value={formData.partsCost}
                onChange={(e) => setFormData({ ...formData, partsCost: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-navy-100">
            <Button variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold"
            >
              {isSubmitting ? 'Recording...' : 'Record Maintenance'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* VIEW DETAILS MODAL */}
      <Modal
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title={selectedRecord ? `Service Record — ${selectedRecord.maintenanceId}` : ''}
      >
        {selectedRecord && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-navy-50 rounded-xl">
              <div>
                <span className="text-navy-500 block">Vehicle</span>
                <span className="font-bold text-navy-900">
                  {selectedRecord.bus?.busName} ({selectedRecord.busRegistrationNumber})
                </span>
              </div>
              <div>
                <span className="text-navy-500 block">Service Date</span>
                <span className="font-bold text-navy-900">
                  {new Date(selectedRecord.serviceDate).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-navy-500 block">Service Provider</span>
                <span className="font-bold text-navy-900">{selectedRecord.serviceProvider}</span>
              </div>
              <div>
                <span className="text-navy-500 block">Total Cost</span>
                <span className="font-mono font-bold text-amber-700 text-sm">
                  ₹{selectedRecord.totalCost?.toLocaleString()}
                </span>
              </div>
            </div>
            <div>
              <span className="text-navy-500 block">Description</span>
              <p className="text-navy-900 font-medium mt-0.5">{selectedRecord.serviceDescription}</p>
            </div>
            {selectedRecord.partsReplaced && (
              <div>
                <span className="text-navy-500 block">Parts Replaced</span>
                <p className="text-navy-800">{selectedRecord.partsReplaced}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MaintenanceManagementView;

