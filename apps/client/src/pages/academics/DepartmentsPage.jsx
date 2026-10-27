import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Archive,
  RefreshCw,
  Users,
  Eye,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import api from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import Notification from '../../components/common/Notification';
import { ROLES } from '@college-erp/shared';

export const DepartmentsPage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const isPrivileged = user && [ROLES.SUPER_ADMIN, ROLES.PRINCIPAL].includes(user.role);

  const [departments, setDepartments] = useState([]);
  const [hodUsers, setHodUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    hod: '',
    intakeCapacity: 60,
    description: '',
    isActive: true,
    reassignHod: false
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchDepartments = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.getDepartments();
      setDepartments(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch departments');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchHods = useCallback(async () => {
    if (!isPrivileged) return;
    try {
      const res = await api.getUsers({ role: ROLES.HOD });
      setHodUsers(res.data?.users || res.data || []);
    } catch {
      // Non-blocking
    }
  }, [isPrivileged]);

  useEffect(() => {
    fetchDepartments();
    fetchHods();
  }, [fetchDepartments, fetchHods]);

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      code: '',
      hod: '',
      intakeCapacity: 60,
      description: '',
      isActive: true
    });
    setFormError('');
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (dept) => {
    setSelectedDept(dept);
    setFormData({
      name: dept.name || '',
      code: dept.code || '',
      hod: dept.hod?._id || dept.hod || '',
      intakeCapacity: dept.intakeCapacity || 60,
      description: dept.description || '',
      isActive: dept.isActive !== false
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleOpenDetail = (dept) => {
    setSelectedDept(dept);
    setIsDetailModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      setFormError('Department Name and Code are required');
      return;
    }
    setFormSubmitting(true);
    setFormError('');
    try {
      await api.createDepartment({
        name: formData.name.trim(),
        code: formData.code.toUpperCase().trim(),
        hod: formData.hod || null,
        intakeCapacity: Number(formData.intakeCapacity) || 60,
        description: formData.description.trim(),
        reassignHod: !!formData.reassignHod
      });
      addToast('Department created successfully', 'success');
      setIsCreateModalOpen(false);
      fetchDepartments();
    } catch (err) {
      setFormError(err.message || 'Failed to create department');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      setFormError('Department Name and Code are required');
      return;
    }
    setFormSubmitting(true);
    setFormError('');
    try {
      await api.updateDepartment(selectedDept._id, {
        name: formData.name.trim(),
        code: formData.code.toUpperCase().trim(),
        hod: formData.hod || null,
        intakeCapacity: Number(formData.intakeCapacity) || 60,
        description: formData.description.trim(),
        isActive: formData.isActive,
        reassignHod: !!formData.reassignHod
      });
      addToast('Department updated successfully', 'success');
      setIsEditModalOpen(false);
      fetchDepartments();
    } catch (err) {
      setFormError(err.message || 'Failed to update department');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleArchiveToggle = async (dept) => {
    try {
      const newStatus = dept.isActive === false;
      await api.updateDepartment(dept._id, { isActive: newStatus });
      addToast(`Department ${newStatus ? 'restored' : 'archived'} successfully`, 'success');
      fetchDepartments();
    } catch (err) {
      addToast(err.message || 'Failed to update department status', 'error');
    }
  };

  const filteredDepartments = departments.filter((dept) => {
    const matchesSearch =
      dept.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dept.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dept.hod?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && dept.isActive !== false) ||
      (statusFilter === 'archived' && dept.isActive === false);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-950 tracking-tight flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-teal-600" />
            Department Management
          </h1>
          <p className="text-sm text-navy-600">
            Institutional academic departments, intake allotments, and assigned Department Heads.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDepartments}
            disabled={isLoading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {isPrivileged && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700"
            >
              <Plus className="w-4 h-4" />
              Add Department
            </Button>
          )}
        </div>
      </div>

      {error && <Notification type="error" message={error} onClose={() => setError('')} />}

      {/* Filter and Search Bar */}
      <Card className="p-4 border-navy-100">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-navy-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, code, or HOD..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-xs font-semibold text-navy-600 uppercase">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border border-navy-200 rounded-lg px-3 py-2 bg-white text-navy-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="archived">Archived Only</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Departments Grid */}
      {isLoading ? (
        <div className="py-16 text-center">
          <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-2" />
          <p className="text-sm text-navy-500">Loading academic departments...</p>
        </div>
      ) : filteredDepartments.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-navy-200">
          <Building2 className="w-12 h-12 text-navy-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-navy-900">No departments found</h3>
          <p className="text-sm text-navy-500 max-w-sm mx-auto mt-1">
            {searchQuery ? 'No departments match your search criteria.' : 'No departments have been configured in the system.'}
          </p>
          {isPrivileged && !searchQuery && (
            <Button variant="primary" size="sm" onClick={handleOpenCreate} className="mt-4 bg-teal-600">
              Create First Department
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDepartments.map((dept) => {
            const isDeptActive = dept.isActive !== false;
            return (
              <Card
                key={dept._id}
                className={`p-5 flex flex-col justify-between hover:shadow-elevation transition-all border ${
                  isDeptActive ? 'border-navy-100' : 'border-rose-100 bg-rose-50/20'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-1 text-xs font-mono font-bold bg-navy-100 text-navy-800 rounded-md">
                      {dept.code}
                    </span>
                    <Badge variant={isDeptActive ? 'success' : 'neutral'}>
                      {isDeptActive ? 'Active' : 'Archived'}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-navy-950 line-clamp-1">{dept.name}</h3>
                    <p className="text-xs text-navy-500 line-clamp-2 mt-1">
                      {dept.description || 'Institutional engineering department.'}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-navy-100/60 space-y-1.5 text-xs text-navy-600">
                    <div className="flex items-center justify-between">
                      <span className="text-navy-400">Head of Dept:</span>
                      <span className="font-semibold text-navy-800">
                        {dept.hod?.name ? dept.hod.name : <span className="text-amber-600">Unassigned</span>}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-navy-400">Student Intake:</span>
                      <span className="font-semibold text-navy-800">{dept.intakeCapacity || 60} seats</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1.5 pt-4 mt-2 border-t border-navy-100">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => handleOpenDetail(dept)}
                    className="text-navy-600 hover:text-navy-950"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    Details
                  </Button>
                  {isPrivileged && (
                    <>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => handleOpenEdit(dept)}
                        className="text-teal-700 hover:text-teal-900"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => handleArchiveToggle(dept)}
                        className={isDeptActive ? 'text-rose-600 hover:text-rose-800' : 'text-emerald-600 hover:text-emerald-800'}
                      >
                        <Archive className="w-3.5 h-3.5 mr-1" />
                        {isDeptActive ? 'Archive' : 'Restore'}
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Department Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New Department"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && <Notification type="error" message={formError} onClose={() => setFormError('')} />}
          <Input
            label="Department Name *"
            placeholder="e.g. Mechanical Engineering"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Department Code *"
              placeholder="e.g. ME"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              required
            />
            <Input
              label="Intake Capacity *"
              type="number"
              min="10"
              max="300"
              value={formData.intakeCapacity}
              onChange={(e) => setFormData({ ...formData, intakeCapacity: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-navy-800 uppercase tracking-wider mb-1">
              Assign Head of Department (HOD)
            </label>
            <select
              value={formData.hod}
              onChange={(e) => setFormData({ ...formData, hod: e.target.value, reassignHod: false })}
              className="w-full text-sm border border-navy-200 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="">-- Leave Unassigned for Now --</option>
              {hodUsers.map((h) => {
                const assigned = departments.find((d) => (d.hod?._id === h._id || d.hod === h._id));
                return (
                  <option key={h._id} value={h._id}>
                    {h.name} ({h.email}){assigned ? ` [Assigned to: ${assigned.code}]` : ''}
                  </option>
                );
              })}
            </select>
            {(() => {
              const assigned = departments.find((d) => formData.hod && (d.hod?._id === formData.hod || d.hod === formData.hod));
              if (!assigned) return null;
              return (
                <div className="mt-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                  <p className="font-semibold flex items-center">
                    <AlertCircle className="w-3.5 h-3.5 mr-1 text-amber-600 inline" />
                    Notice: Currently assigned to {assigned.name} ({assigned.code})
                  </p>
                  <label className="flex items-center space-x-2 mt-1.5 cursor-pointer font-medium text-amber-950">
                    <input
                      type="checkbox"
                      checked={formData.reassignHod || false}
                      onChange={(e) => setFormData({ ...formData, reassignHod: e.target.checked })}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span>Reassign and transfer HOD to this department</span>
                  </label>
                </div>
              );
            })()}
          </div>
          <div>
            <label className="block text-xs font-semibold text-navy-800 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief overview of department objectives..."
              className="w-full text-sm border border-navy-200 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="ghost" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={formSubmitting} className="bg-teal-600">
              {formSubmitting ? 'Creating...' : 'Create Department'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Department Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Department"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {formError && <Notification type="error" message={formError} onClose={() => setFormError('')} />}
          <Input
            label="Department Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Department Code *"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              required
            />
            <Input
              label="Intake Capacity *"
              type="number"
              min="10"
              max="300"
              value={formData.intakeCapacity}
              onChange={(e) => setFormData({ ...formData, intakeCapacity: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-navy-800 uppercase tracking-wider mb-1">
              Assigned HOD
            </label>
            <select
              value={formData.hod}
              onChange={(e) => setFormData({ ...formData, hod: e.target.value, reassignHod: false })}
              className="w-full text-sm border border-navy-200 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="">-- No HOD Assigned --</option>
              {hodUsers.map((h) => {
                const assigned = departments.find(
                  (d) => (d.hod?._id === h._id || d.hod === h._id) && d._id !== selectedDept?._id
                );
                return (
                  <option key={h._id} value={h._id}>
                    {h.name} ({h.email}){assigned ? ` [Assigned to: ${assigned.code}]` : ''}
                  </option>
                );
              })}
            </select>
            {(() => {
              const assigned = departments.find(
                (d) => formData.hod && (d.hod?._id === formData.hod || d.hod === formData.hod) && d._id !== selectedDept?._id
              );
              if (!assigned) return null;
              return (
                <div className="mt-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                  <p className="font-semibold flex items-center">
                    <AlertCircle className="w-3.5 h-3.5 mr-1 text-amber-600 inline" />
                    Notice: Currently assigned to {assigned.name} ({assigned.code})
                  </p>
                  <label className="flex items-center space-x-2 mt-1.5 cursor-pointer font-medium text-amber-950">
                    <input
                      type="checkbox"
                      checked={formData.reassignHod || false}
                      onChange={(e) => setFormData({ ...formData, reassignHod: e.target.checked })}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span>Reassign and transfer HOD to this department</span>
                  </label>
                </div>
              );
            })()}
          </div>
          <div>
            <label className="block text-xs font-semibold text-navy-800 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full text-sm border border-navy-200 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isActiveCheck"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-navy-300 text-teal-600 focus:ring-teal-500"
            />
            <label htmlFor="isActiveCheck" className="text-sm font-medium text-navy-800">
              Department is active and accepting student enrollments
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="ghost" type="button" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={formSubmitting} className="bg-teal-600">
              {formSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      {selectedDept && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Department: ${selectedDept.name} (${selectedDept.code})`}
        >
          <div className="space-y-4 text-sm">
            <div className="bg-navy-50 p-4 rounded-xl border border-navy-100 space-y-2">
              <div className="flex justify-between">
                <span className="text-navy-500 font-medium">Unique Code:</span>
                <span className="font-mono font-bold text-navy-950">{selectedDept.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-500 font-medium">Head of Department:</span>
                <span className="font-semibold text-navy-900">
                  {selectedDept.hod?.name ? `${selectedDept.hod.name} (${selectedDept.hod.email})` : 'Unassigned'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-500 font-medium">Intake Capacity:</span>
                <span className="font-semibold text-navy-900">{selectedDept.intakeCapacity || 60} students/year</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-500 font-medium">Status:</span>
                <Badge variant={selectedDept.isActive !== false ? 'success' : 'neutral'}>
                  {selectedDept.isActive !== false ? 'Active Academic Department' : 'Archived'}
                </Badge>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-navy-800 uppercase tracking-wider mb-1">Overview</h4>
              <p className="text-navy-600 text-xs leading-relaxed">
                {selectedDept.description || 'No detailed description provided for this academic department.'}
              </p>
            </div>
            <div className="flex justify-end pt-3 border-t">
              <Button variant="outline" size="sm" onClick={() => setIsDetailModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DepartmentsPage;

