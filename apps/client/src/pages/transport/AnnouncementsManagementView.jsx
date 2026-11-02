import React, { useState, useEffect } from 'react';
import {
  Bell,
  Megaphone,
  Plus,
  RefreshCw,
  Calendar,
  Users,
  AlertCircle,
  CheckCircle,
  EyeOff
} from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/apiClient';

export default function AnnouncementsManagementView() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    title: '',
    content: '',
    priority: 'Normal',
    targetRoles: ['parent', 'student'],
    expiryDate: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.getTransportAnnouncements();
      setAnnouncements(res.data || []);
    } catch (err) {
      addToast(err.message || 'Failed to load announcements', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      addToast('Title and content are required', 'error');
      return;
    }

    try {
      const res = await api.createTransportAnnouncement({
        title: form.title,
        content: form.content,
        priority: form.priority,
        targetRoles: form.targetRoles,
        expiryDate: form.expiryDate || undefined
      });
      addToast(res.message || 'Announcement published successfully', 'success');
      setShowModal(false);
      setForm({
        title: '',
        content: '',
        priority: 'Normal',
        targetRoles: ['parent', 'student'],
        expiryDate: ''
      });
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to create announcement', 'error');
    }
  };

  const handleDeactivate = async (id) => {
    try {
      await api.deactivateTransportAnnouncement(id);
      addToast('Announcement deactivated', 'success');
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to deactivate announcement', 'error');
    }
  };

  const isStaff = ['super_admin', 'transport_admin', 'transport_supervisor'].includes(user?.role);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-navy-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl border border-purple-200">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-navy-900">Transport Announcements & Notices</h2>
            <p className="text-xs text-navy-500">
              Broadcast schedule adjustments, weather alerts, and route notices to parents and students.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={loadData} isLoading={loading} icon={RefreshCw}>
            Refresh
          </Button>

          {isStaff && (
            <Button
              variant="teal"
              size="sm"
              icon={Plus}
              onClick={() => setShowModal(true)}
            >
              Publish Notice
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {announcements.length === 0 ? (
          <div className="col-span-2 bg-white p-8 rounded-xl border border-navy-200 text-center text-navy-400">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="font-semibold text-navy-700">No active transport announcements</p>
            <p className="text-xs mt-1">Institutional transport announcements will appear here.</p>
          </div>
        ) : (
          announcements.map((ann) => (
            <div
              key={ann._id}
              className={`p-5 rounded-xl border transition-all ${
                ann.priority === 'Urgent'
                  ? 'bg-rose-50/50 border-rose-200'
                  : ann.priority === 'Important'
                  ? 'bg-amber-50/50 border-amber-200'
                  : 'bg-white border-navy-200'
              } shadow-sm space-y-3`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        ann.priority === 'Urgent'
                          ? 'danger'
                          : ann.priority === 'Important'
                          ? 'warning'
                          : 'teal'
                      }
                      size="sm"
                    >
                      {ann.priority}
                    </Badge>
                    <span className="font-mono text-[10px] text-navy-400">{ann.announcementId}</span>
                  </div>
                  <h3 className="font-bold text-sm text-navy-900">{ann.title}</h3>
                </div>

                {isStaff && ann.isActive && (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => handleDeactivate(ann._id)}
                    title="Deactivate announcement"
                  >
                    <EyeOff className="w-3.5 h-3.5 text-navy-400 hover:text-navy-700" />
                  </Button>
                )}
              </div>

              <p className="text-xs text-navy-700 whitespace-pre-line leading-relaxed">{ann.content}</p>

              <div className="flex items-center justify-between pt-2 border-t border-navy-100 text-[11px] text-navy-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-navy-400" />
                  {new Date(ann.publishDate).toLocaleDateString()}
                </span>

                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-navy-400" />
                  <span className="capitalize">
                    {ann.targetRoles?.length ? ann.targetRoles.join(', ') : 'All Roles'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL: Publish Announcement */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Publish Transport Announcement"
        >
          <form onSubmit={handleCreate} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-navy-700 mb-1">Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Morning Pickup Schedule Adjusted - Sector 12"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-navy-200 rounded-lg p-2.5 text-xs text-navy-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-navy-700 mb-1">Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full border border-navy-200 rounded-lg p-2.5 bg-white text-navy-900 text-xs"
                >
                  <option value="Normal">Normal</option>
                  <option value="Important">Important</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-navy-700 mb-1">Expiry Date (Optional)</label>
                <input
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                  className="w-full border border-navy-200 rounded-lg p-2 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-navy-700 mb-1">Target Audience</label>
              <div className="flex flex-wrap gap-2 text-xs">
                {['parent', 'student', 'bus_driver', 'bus_attendant', 'transport_supervisor'].map((role) => {
                  const selected = form.targetRoles.includes(role);
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => {
                        if (selected) {
                          setForm({ ...form, targetRoles: form.targetRoles.filter((r) => r !== role) });
                        } else {
                          setForm({ ...form, targetRoles: [...form.targetRoles, role] });
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] capitalize font-medium ${
                        selected
                          ? 'bg-teal-50 border-teal-300 text-teal-800 font-bold'
                          : 'bg-white border-navy-200 text-navy-600'
                      }`}
                    >
                      {role.replace('_', ' ')}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-navy-700 mb-1">Announcement Message *</label>
              <textarea
                required
                rows={4}
                placeholder="Write the full announcement text here..."
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="w-full border border-navy-200 rounded-lg p-2.5 text-xs text-navy-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-navy-100">
              <Button variant="outline" size="sm" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="teal" size="sm" type="submit">
                Broadcast Announcement
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

