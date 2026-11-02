import React, { useState, useEffect, useCallback } from 'react';
import {
  Fuel,
  TrendingUp,
  Gauge,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  CreditCard,
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

export const FuelManagementView = ({ buses = [] }) => {
  const { addToast } = useToast();

  const [fuelRecords, setFuelRecords] = useState([]);
  const [fuelStats, setFuelStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [fuelTypeFilter, setFuelTypeFilter] = useState('all');
  const [busFilter, setBusFilter] = useState('all');

  // Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fuelRecordId: '',
    bus: '',
    fuelType: 'diesel',
    fuelStation: '',
    fuelDate: new Date().toISOString().split('T')[0],
    fuelQuantity: '',
    pricePerLitre: '92.50',
    odometerReading: '',
    previousOdometerReading: '',
    paymentMethod: 'Fuel Card',
    invoiceNumber: '',
    remarks: ''
  });

  const fetchFuelData = useCallback(async () => {
    try {
      setLoading(true);
      const [recRes, statRes] = await Promise.all([
        api.getFuelRecords({
          search,
          fuelType: fuelTypeFilter,
          bus: busFilter
        }),
        api.getFuelMileageStats()
      ]);

      if (recRes && recRes.data) setFuelRecords(recRes.data);
      if (statRes && statRes.data) setFuelStats(statRes.data);
    } catch (err) {
      addToast(err.message || 'Failed to fetch fuel records', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, fuelTypeFilter, busFilter, addToast]);

  useEffect(() => {
    fetchFuelData();
  }, [fetchFuelData]);

  // Derived calculations for modal form
  const calcQty = Number(formData.fuelQuantity) || 0;
  const calcPrice = Number(formData.pricePerLitre) || 0;
  const calcTotal = (calcQty * calcPrice).toFixed(2);

  const currentOdo = Number(formData.odometerReading) || 0;
  const prevOdo = Number(formData.previousOdometerReading) || 0;
  const calcDist = Math.max(0, currentOdo - prevOdo);
  const calcMileage = calcQty > 0 && calcDist > 0 ? (calcDist / calcQty).toFixed(2) : '0.00';

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fuelRecordId || !formData.bus || !formData.fuelStation || !formData.fuelQuantity || !formData.odometerReading) {
      addToast('Please complete all mandatory fuel fields', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.createFuelRecord(formData);
      if (res.success) {
        addToast(`Fuel entry ${formData.fuelRecordId.toUpperCase()} recorded`, 'success');
        setIsCreateModalOpen(false);
        setFormData({
          fuelRecordId: '',
          bus: '',
          fuelType: 'diesel',
          fuelStation: '',
          fuelDate: new Date().toISOString().split('T')[0],
          fuelQuantity: '',
          pricePerLitre: '92.50',
          odometerReading: '',
          previousOdometerReading: '',
          paymentMethod: 'Fuel Card',
          invoiceNumber: '',
          remarks: ''
        });
        fetchFuelData();
      }
    } catch (err) {
      addToast(err.message || 'Failed to record fuel entry', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-navy-950 flex items-center gap-2">
            <Fuel className="w-5 h-5 text-amber-500" />
            Fuel Management & Mileage Tracking
          </h2>
          <p className="text-xs text-navy-500">
            Monitor fuel consumption, station fills, mileage performance, and fuel expenditures.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchFuelData} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Fuel Entry
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4 bg-amber-50 border border-amber-200">
          <span className="text-[11px] font-semibold text-amber-700 block">Today's Fuel Expenses</span>
          <span className="text-2xl font-bold text-amber-900 mt-1 block">
            ₹{fuelStats?.todayFuelExpenses?.toLocaleString() || 0}
          </span>
        </Card>
        <Card className="p-4 bg-blue-50 border border-blue-200">
          <span className="text-[11px] font-semibold text-blue-700 block">Monthly Fuel Expenses</span>
          <span className="text-2xl font-bold text-blue-900 mt-1 block">
            ₹{fuelStats?.monthlyFuelExpenses?.toLocaleString() || 0}
          </span>
        </Card>
        <Card className="p-4 bg-emerald-50 border border-emerald-200">
          <span className="text-[11px] font-semibold text-emerald-700 block">Total Fuel Consumed</span>
          <span className="text-2xl font-bold text-emerald-900 mt-1 block">
            {fuelStats?.totalFuelConsumption?.toLocaleString() || 0} Litres
          </span>
        </Card>
        <Card className="p-4 bg-indigo-50 border border-indigo-200">
          <span className="text-[11px] font-semibold text-indigo-700 block">Average Fleet Mileage</span>
          <span className="text-2xl font-bold text-indigo-900 mt-1 block">
            {fuelStats?.averageFleetMileage || 0} km/L
          </span>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 bg-white border border-navy-200">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            placeholder="Search Record ID, station, invoice..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-navy-400" />}
          />
          <Select
            value={fuelTypeFilter}
            onChange={(e) => setFuelTypeFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Fuel Types' },
              { value: 'diesel', label: 'Diesel' },
              { value: 'cng', label: 'CNG' },
              { value: 'petrol', label: 'Petrol' },
              { value: 'electric', label: 'Electric' }
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

      {/* Fuel Entries Table */}
      <Card className="overflow-hidden border border-navy-200">
        <Table
          columns={[
            {
              header: 'Fuel ID & Date',
              accessor: 'fuelRecordId',
              render: (_, row) => (
                <div>
                  <span className="font-mono font-bold text-navy-950 text-xs block">
                    {row.fuelRecordId}
                  </span>
                  <span className="text-navy-500 text-[11px]">
                    {new Date(row.fuelDate).toLocaleDateString()}
                  </span>
                </div>
              )
            },
            {
              header: 'Vehicle & Station',
              accessor: 'bus',
              render: (_, row) => (
                <div className="text-xs">
                  <span className="font-semibold text-navy-900 block">
                    {row.bus?.busName || 'Vehicle'} ({row.bus?.busId})
                  </span>
                  <span className="text-navy-500 text-[11px]">{row.fuelStation}</span>
                </div>
              )
            },
            {
              header: 'Quantity & Price',
              accessor: 'fuelQuantity',
              render: (_, row) => (
                <div className="text-xs">
                  <span className="font-bold text-navy-900 block">
                    {row.fuelQuantity} Litres
                  </span>
                  <span className="text-navy-500 text-[11px]">₹{row.pricePerLitre}/L</span>
                </div>
              )
            },
            {
              header: 'Total Fuel Cost',
              accessor: 'totalFuelCost',
              render: (_, row) => (
                <span className="font-bold text-navy-950 text-sm">
                  ₹{row.totalFuelCost?.toLocaleString()}
                </span>
              )
            },
            {
              header: 'Odometer & Distance',
              accessor: 'odometerReading',
              render: (_, row) => (
                <div className="text-xs">
                  <span className="font-mono font-semibold text-navy-900 block">
                    {row.odometerReading} km
                  </span>
                  <span className="text-emerald-700 text-[11px] font-medium">
                    +{row.distanceTravelled || 0} km travelled
                  </span>
                </div>
              )
            },
            {
              header: 'Mileage',
              accessor: 'mileage',
              render: (_, row) => (
                <Badge variant={row.mileage >= 4 ? 'success' : 'warning'} size="xs">
                  {row.mileage} km/L
                </Badge>
              )
            },
            {
              header: 'Payment Method',
              accessor: 'paymentMethod',
              render: (_, row) => (
                <span className="text-xs text-navy-700 font-medium">{row.paymentMethod}</span>
              )
            }
          ]}
          data={fuelRecords}
          isLoading={loading}
          emptyText="No fuel records found matching criteria."
        />
      </Card>

      {/* ADD FUEL ENTRY MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Record Bus Fuel Fill / Topup"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-navy-800 font-semibold mb-1">
                Fuel Record ID <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g. FUEL-2026-001"
                value={formData.fuelRecordId}
                onChange={(e) => setFormData({ ...formData, fuelRecordId: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-navy-800 font-semibold mb-1">
                Assign Bus <span className="text-red-500">*</span>
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

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-navy-800 font-semibold mb-1">Fuel Date *</label>
              <Input
                type="date"
                value={formData.fuelDate}
                onChange={(e) => setFormData({ ...formData, fuelDate: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-navy-800 font-semibold mb-1">Fuel Type</label>
              <Select
                value={formData.fuelType}
                onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                options={[
                  { value: 'diesel', label: 'Diesel' },
                  { value: 'cng', label: 'CNG' },
                  { value: 'petrol', label: 'Petrol' },
                  { value: 'electric', label: 'Electric' }
                ]}
              />
            </div>
            <div>
              <label className="block text-navy-800 font-semibold mb-1">Payment Method</label>
              <Select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                options={[
                  { value: 'Fuel Card', label: 'Fuel Card' },
                  { value: 'Corporate Account', label: 'Corporate Account' },
                  { value: 'Cash', label: 'Cash' },
                  { value: 'UPI', label: 'UPI' }
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-navy-800 font-semibold mb-1">Fuel Station / Vendor *</label>
              <Input
                placeholder="e.g. Indian Oil Corporation - Central Outlet"
                value={formData.fuelStation}
                onChange={(e) => setFormData({ ...formData, fuelStation: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-navy-800 font-semibold mb-1">Bill / Invoice #</label>
              <Input
                placeholder="e.g. IOC-88291"
                value={formData.invoiceNumber}
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-navy-800 font-semibold mb-1">Quantity (Litres) *</label>
              <Input
                type="number"
                step="0.1"
                placeholder="50"
                value={formData.fuelQuantity}
                onChange={(e) => setFormData({ ...formData, fuelQuantity: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-navy-800 font-semibold mb-1">Price Per Litre (₹) *</label>
              <Input
                type="number"
                step="0.01"
                value={formData.pricePerLitre}
                onChange={(e) => setFormData({ ...formData, pricePerLitre: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-navy-800 font-semibold mb-1">Current Odometer (km) *</label>
              <Input
                type="number"
                placeholder="45250"
                value={formData.odometerReading}
                onChange={(e) => setFormData({ ...formData, odometerReading: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-navy-800 font-semibold mb-1">Previous Odometer (km)</label>
              <Input
                type="number"
                placeholder="45000"
                value={formData.previousOdometerReading}
                onChange={(e) => setFormData({ ...formData, previousOdometerReading: e.target.value })}
              />
            </div>
          </div>

          {/* Real-time Computed Summary */}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 grid grid-cols-3 gap-2 text-center">
            <div>
              <span className="text-[10px] text-amber-700 block">TOTAL FUEL COST</span>
              <span className="font-mono font-bold text-amber-950 text-sm">₹{calcTotal}</span>
            </div>
            <div>
              <span className="text-[10px] text-amber-700 block">DISTANCE TRAVELLED</span>
              <span className="font-mono font-bold text-amber-950 text-sm">{calcDist} km</span>
            </div>
            <div>
              <span className="text-[10px] text-amber-700 block">CALCULATED MILEAGE</span>
              <span className="font-mono font-bold text-amber-950 text-sm">{calcMileage} km/L</span>
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
              {isSubmitting ? 'Saving...' : 'Record Fuel Entry'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FuelManagementView;

