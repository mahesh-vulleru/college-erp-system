import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Package,
  Plus,
  Search,
  Filter,
  Wrench,
  DollarSign,
  TrendingDown,
  Building,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Edit2,
  Calendar,
  Layers,
  Clock
} from 'lucide-react';
import DashboardHeaderBanner from '../../components/dashboard/DashboardHeaderBanner';
import DashboardKPICard from '../../components/dashboard/DashboardKPICard';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import api from '../../api/apiClient';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '@college-erp/shared';

export const AssetManagementPage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [assets, setAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filters & Search
  const [searchParams, setSearchParams] = useSearchParams();
  const queryCategory = searchParams.get('category');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(queryCategory || '');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (queryCategory !== null && queryCategory !== undefined) {
      setCategoryFilter(queryCategory);
    }
  }, [queryCategory]);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    assetCode: '',
    category: 'it_equipment',
    subCategory: '',
    purchaseCost: '',
    depreciationRate: 10,
    status: 'in_service',
    location: { building: 'Main Campus', floor: '1st Floor', roomNumber: '' },
    remarks: ''
  });

  // Maintenance Form
  const [maintenanceForm, setMaintenanceForm] = useState({
    description: '',
    cost: '',
    technician: '',
    nextServiceDue: ''
  });

  const canMutate = [ROLES.SUPER_ADMIN, ROLES.ACCOUNTS, ROLES.LIBRARIAN].includes(user?.role);

  const fetchAssets = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getAssets({
        q: searchQuery || undefined,
        category: categoryFilter || undefined,
        status: statusFilter || undefined,
        limit: 50
      });
      if (res?.data) {
        setAssets(res.data);
        setTotalCount(res.meta?.total || res.data.length);
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Failed to load assets',
        message: err.message || 'Error connecting to asset inventory service'
      });
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, categoryFilter, statusFilter, addToast]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleCreateAsset = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.assetCode || !formData.purchaseCost) {
      addToast({ type: 'warning', title: 'Validation Warning', message: 'Name, Asset Code, and Cost are required' });
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createAsset(formData);
      addToast({ type: 'success', title: 'Asset Registered', message: `${formData.assetCode} added to inventory` });
      setIsAddModalOpen(false);
      setFormData({
        name: '',
        assetCode: '',
        category: 'it_equipment',
        subCategory: '',
        purchaseCost: '',
        depreciationRate: 10,
        status: 'in_service',
        location: { building: 'Main Campus', floor: '1st Floor', roomNumber: '' },
        remarks: ''
      });
      fetchAssets();
    } catch (err) {
      addToast({ type: 'error', title: 'Registration Failed', message: err.message || 'Error saving asset' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMaintenance = async (e) => {
    e.preventDefault();
    if (!selectedAsset || !maintenanceForm.description) return;

    setIsSubmitting(true);
    try {
      await api.addAssetMaintenance(selectedAsset._id, maintenanceForm);
      addToast({ type: 'success', title: 'Maintenance Logged', message: `Service record added for ${selectedAsset.assetCode}` });
      setIsMaintenanceModalOpen(false);
      setMaintenanceForm({ description: '', cost: '', technician: '', nextServiceDue: '' });
      fetchAssets();
    } catch (err) {
      addToast({ type: 'error', title: 'Logging Failed', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAsset = async (id, code) => {
    if (!window.confirm(`Are you sure you want to decommission and remove asset ${code}?`)) return;
    try {
      await api.deleteAsset(id);
      addToast({ type: 'success', title: 'Asset Removed', message: `${code} decommissioned` });
      fetchAssets();
    } catch (err) {
      addToast({ type: 'error', title: 'Decommission Failed', message: err.message });
    }
  };

  // KPI calculations
  const totalValue = assets.reduce((sum, a) => sum + (Number(a.purchaseCost) || 0), 0);
  const totalDepreciatedValue = assets.reduce((sum, a) => sum + (Number(a.depreciatedValue) || Number(a.purchaseCost) || 0), 0);
  const inServiceCount = assets.filter((a) => a.status === 'in_service').length;
  const maintenanceCount = assets.filter((a) => a.status === 'maintenance').length;

  const columns = [
    {
      header: 'Asset Details',
      cell: (row) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">{row.name}</span>
          <span className="text-[11px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded mt-0.5 inline-block">
            {row.assetCode}
          </span>
        </div>
      )
    },
    {
      header: 'Category & Type',
      cell: (row) => (
        <div>
          <span className="capitalize text-xs font-semibold text-slate-700 block">
            {row.category?.replace(/_/g, ' ')}
          </span>
          <span className="text-[11px] text-slate-500">{row.subCategory || 'General'}</span>
        </div>
      )
    },
    {
      header: 'Location',
      cell: (row) => (
        <span className="text-xs text-slate-600">
          {row.location?.building || 'Main Campus'} {row.location?.roomNumber ? `(${row.location.roomNumber})` : ''}
        </span>
      )
    },
    {
      header: 'Cost / Book Value',
      cell: (row) => (
        <div>
          <span className="text-xs font-bold text-slate-900 block">
            ₹{Number(row.purchaseCost).toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            Depreciated: ₹{Number(row.depreciatedValue || row.purchaseCost).toLocaleString('en-IN')}
          </span>
        </div>
      )
    },
    {
      header: 'Status',
      cell: (row) => {
        let variant = 'success';
        if (row.status === 'maintenance') variant = 'warning';
        if (row.status === 'retired' || row.status === 'disposed') variant = 'danger';
        return (
          <Badge variant={variant} size="xs" className="capitalize font-semibold">
            {row.status?.replace(/_/g, ' ')}
          </Badge>
        );
      }
    },
    {
      header: 'Actions',
      cellClassName: 'text-right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          {canMutate && (
            <Button
              variant="secondary"
              size="xs"
              icon={Wrench}
              onClick={() => {
                setSelectedAsset(row);
                setIsMaintenanceModalOpen(true);
              }}
              title="Log Maintenance"
            >
              Service
            </Button>
          )}
          {canMutate && (
            <Button
              variant="danger"
              size="xs"
              icon={Trash2}
              onClick={() => handleDeleteAsset(row._id, row.assetCode)}
              title="Decommission Asset"
            />
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <DashboardHeaderBanner
        title="Campus Asset & Inventory Management"
        subtitle="Infrastructure tracking, straight-line equipment depreciation, location allocation, and maintenance records."
        academicYear="2026 – 2027"
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardKPICard
          title="Total Registered Assets"
          value={totalCount}
          icon={Package}
          trend={`${assets.length} Active in view`}
          color="emerald"
        />
        <DashboardKPICard
          title="In-Service Equipment"
          value={inServiceCount}
          icon={CheckCircle}
          trend={`${Math.round((inServiceCount / (totalCount || 1)) * 100)}% operational`}
          color="blue"
        />
        <DashboardKPICard
          title="In Maintenance"
          value={maintenanceCount}
          icon={Wrench}
          trend="Workshop & repairs"
          color="amber"
        />
        <DashboardKPICard
          title="Current Book Value"
          value={`₹${(totalDepreciatedValue / 100000).toFixed(1)}L`}
          icon={TrendingDown}
          trend={`Cost: ₹${(totalValue / 100000).toFixed(1)}L`}
          color="purple"
        />
      </div>

      {/* Main Asset Table Card */}
      <Card
        title="Institutional Equipment & Asset Registry"
        subtitle="Centralized ledger across IT hardware, laboratories, audio-visual devices, and classroom infrastructure"
        headerAction={
          canMutate && (
            <Button
              variant="teal"
              size="sm"
              icon={Plus}
              onClick={() => setIsAddModalOpen(true)}
            >
              Add Asset
            </Button>
          )
        }
      >
        {/* Filters */}
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            id="search-asset"
            placeholder="Search code, name, serial..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Select
            id="filter-category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={[
              { value: '', label: 'All Categories' },
              { value: 'it_equipment', label: 'IT & Computing Equipment' },
              { value: 'lab_equipment', label: 'Laboratory Apparatus' },
              { value: 'audio_visual', label: 'Audio-Visual & Projectors' },
              { value: 'furniture', label: 'Campus Furniture' },
              { value: 'classroom_hardware', label: 'Classroom Hardware' }
            ]}
          />
          <Select
            id="filter-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'in_service', label: 'In Service' },
              { value: 'maintenance', label: 'Under Maintenance' },
              { value: 'retired', label: 'Retired / Decommissioned' }
            ]}
          />
        </div>

        {/* Table */}
        <Table
          columns={columns}
          data={assets}
          isLoading={isLoading}
          emptyMessage="No campus assets found matching the selected filter criteria."
        />
      </Card>

      {/* Modal: Add Asset */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Register New Campus Asset"
          size="md"
        >
          <form onSubmit={handleCreateAsset} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Asset Name *</label>
                <Input
                  id="asset-name"
                  required
                  placeholder="e.g. Dell OptiPlex 7090 Desktop"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Asset Code *</label>
                <Input
                  id="asset-code"
                  required
                  placeholder="e.g. AST-IT-204"
                  value={formData.assetCode}
                  onChange={(e) => setFormData({ ...formData, assetCode: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <Select
                  id="asset-cat"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  options={[
                    { value: 'it_equipment', label: 'IT Equipment' },
                    { value: 'lab_equipment', label: 'Lab Equipment' },
                    { value: 'audio_visual', label: 'Audio-Visual' },
                    { value: 'furniture', label: 'Furniture' },
                    { value: 'classroom_hardware', label: 'Classroom Hardware' }
                  ]}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Purchase Cost (₹) *</label>
                <Input
                  id="asset-cost"
                  type="number"
                  required
                  min="0"
                  placeholder="e.g. 65000"
                  value={formData.purchaseCost}
                  onChange={(e) => setFormData({ ...formData, purchaseCost: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Room / Location</label>
                <Input
                  id="asset-room"
                  placeholder="e.g. LAB-201, CS Block"
                  value={formData.location.roomNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      location: { ...formData.location, roomNumber: e.target.value }
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Annual Depreciation %</label>
                <Input
                  id="asset-depr"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.depreciationRate}
                  onChange={(e) => setFormData({ ...formData, depreciationRate: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="teal" type="submit" isLoading={isSubmitting}>
                Save to Inventory
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Add Maintenance Record */}
      {isMaintenanceModalOpen && selectedAsset && (
        <Modal
          isOpen={isMaintenanceModalOpen}
          onClose={() => setIsMaintenanceModalOpen(false)}
          title={`Log Maintenance: ${selectedAsset.assetCode}`}
          size="sm"
        >
          <form onSubmit={handleAddMaintenance} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Service Description *</label>
              <Input
                id="maint-desc"
                required
                placeholder="e.g. Power supply unit replacement, diagnostic pass"
                value={maintenanceForm.description}
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cost (₹)</label>
                <Input
                  id="maint-cost"
                  type="number"
                  min="0"
                  placeholder="e.g. 2400"
                  value={maintenanceForm.cost}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, cost: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Technician / Vendor</label>
                <Input
                  id="maint-tech"
                  placeholder="e.g. Dell Authorized Service"
                  value={maintenanceForm.technician}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, technician: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setIsMaintenanceModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="teal" type="submit" isLoading={isSubmitting}>
                Record Maintenance
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AssetManagementPage;

