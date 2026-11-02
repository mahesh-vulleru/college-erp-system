import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Clock,
  Plus,
  RefreshCw,
  Search,
  Filter,
  User,
  Bus,
  MapPin,
  Send,
  Check
} from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/apiClient';

export default function ComplaintsManagementView() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState([]);
  const [buses, setBuses] = useState([]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [actionComplaint, setActionComplaint] = useState(null); // For responding

  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');

  // Submit Form
  const [submitForm, setSubmitForm] = useState({
    category: 'Bus Delay',
    subject: '',
    description: '',
    priority: 'Medium',
    bus: '',
    studentName: '',
    rollNumber: ''
  });

  // Response Form
  const [responseForm, setResponseForm] = useState({
    response: '',
    status: 'Resolved'
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [compRes, busRes] = await Promise.all([
        api.getTransportComplaints().catch(() => ({ data: [] })),
        api.getBuses().catch(() => ({ data: [] }))
      ]);

      setComplaints(compRes.data || []);
      setBuses(busRes.data || []);
    } catch (err) {
      addToast(err.message || 'Failed to load complaints', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      if (filterCategory !== 'all' && c.category !== filterCategory) return false;
      if (filterStatus !== 'all' && c.status !== filterStatus) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const idMatch = c.complaintId?.toLowerCase().includes(q);
        const subjMatch = c.subject?.toLowerCase().includes(q);
        const descMatch = c.description?.toLowerCase().includes(q);
        if (!idMatch && !subjMatch && !descMatch) return false;
      }
      return true;
    });
  }, [complaints, filterCategory, filterStatus, search]);

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    if (!submitForm.subject.trim() || !submitForm.description.trim()) {
      addToast('Subject and description are required', 'error');
      return;
    }

    try {
      const res = await api.submitTransportComplaint({
        category: submitForm.category,
        subject: submitForm.subject,
        description: submitForm.description,
        priority: submitForm.priority,
        bus: submitForm.bus || undefined,
        studentName: submitForm.studentName || undefined,
        rollNumber: submitForm.rollNumber || undefined
      });
      addToast(res.message || 'Complaint submitted successfully', 'success');
      setShowSubmitModal(false);
      setSubmitForm({
        category: 'Bus Delay',
        subject: '',
        description: '',
        priority: 'Medium',
        bus: '',
        studentName: '',
        rollNumber: ''
      });
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to submit complaint', 'error');
    }
  };

  const handleRespondComplaint = async (e) => {
    e.preventDefault();
    if (!actionComplaint) return;
    if (!responseForm.response.trim()) {
      addToast('Please enter an official response', 'error');
      return;
    }

    try {
      const res = await api.respondToTransportComplaint(actionComplaint._id, responseForm);
      addToast(res.message || 'Response recorded and complainant notified', 'success');
      setActionComplaint(null);
      setResponseForm({ response: '', status: 'Resolved' });
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to submit response', 'error');
    }
  };

  const isStaff = ['super_admin', 'transport_admin', 'transport_supervisor'].includes(user?.role);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-navy-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-200">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-navy-900">Transport Feedback & Complaint Center</h2>
            <p className="text-xs text-navy-500">
              Submit, review, and track resolution of student and parent transport grievances.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={loadData} isLoading={loading} icon={RefreshCw}>
            Refresh
          </Button>

          <Button
            variant="teal"
            size="sm"
            icon={Plus}
            onClick={() => setShowSubmitModal(true)}
          >
            Submit Grievance
          </Button>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-navy-200">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-navy-400" />
          <input
            type="text"
            placeholder="Search by ticket ID, subject, text..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs border-none bg-transparent focus:outline-none w-64 text-navy-900"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-xs border border-navy-200 rounded-lg px-2.5 py-1.5 bg-white text-navy-700"
          >
            <option value="all">All Categories</option>
            <option value="Bus Delay">Bus Delay</option>
            <option value="Driver Behaviour">Driver Behaviour</option>
            <option value="Route Problem">Route Problem</option>
            <option value="Pickup Problem">Pickup Problem</option>
            <option value="Drop-off Problem">Drop-off Problem</option>
            <option value="Student Safety">Student Safety</option>
            <option value="Bus Condition">Bus Condition</option>
            <option value="Transport Fee Issue">Transport Fee Issue</option>
            <option value="Other">Other</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs border border-navy-200 rounded-lg px-2.5 py-1.5 bg-white text-navy-700"
          >
            <option value="all">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Acknowledged">Acknowledged</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Rejected">Rejected</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="bg-white rounded-xl border border-navy-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-navy-50 text-navy-700 font-bold border-b border-navy-200">
              <tr>
                <th className="py-3 px-4">Ticket ID</th>
                <th className="py-3 px-4">Submitted By</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100">
              {filteredComplaints.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-navy-400">
                    No transport complaints found.
                  </td>
                </tr>
              ) : (
                filteredComplaints.map((c) => (
                  <tr key={c._id} className="hover:bg-warm-50/50">
                    <td className="py-3 px-4 font-mono font-bold text-navy-900">{c.complaintId}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-navy-900">{c.submittedByName || 'User'}</span>
                      <span className="block text-[10px] text-navy-400 capitalize">{c.submittedByRole}</span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-navy-800">{c.category}</td>
                    <td className="py-3 px-4 max-w-xs truncate text-navy-900">{c.subject}</td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          c.priority === 'Urgent'
                            ? 'danger'
                            : c.priority === 'High'
                            ? 'warning'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {c.priority}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-navy-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          c.status === 'Resolved' || c.status === 'Closed'
                            ? 'success'
                            : c.status === 'Rejected'
                            ? 'danger'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {c.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      {isStaff && (
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => {
                            setActionComplaint(c);
                            setResponseForm({
                              response: c.adminResponse || '',
                              status: c.status === 'Submitted' ? 'In Progress' : c.status
                            });
                          }}
                        >
                          Respond
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Submit Complaint */}
      {showSubmitModal && (
        <Modal
          isOpen={showSubmitModal}
          onClose={() => setShowSubmitModal(false)}
          title="Submit Transport Grievance"
        >
          <form onSubmit={handleSubmitComplaint} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-navy-700 mb-1">Category *</label>
                <select
                  value={submitForm.category}
                  onChange={(e) => setSubmitForm({ ...submitForm, category: e.target.value })}
                  className="w-full border border-navy-200 rounded-lg p-2.5 bg-white text-navy-900 text-xs"
                >
                  <option value="Bus Delay">Bus Delay</option>
                  <option value="Driver Behaviour">Driver Behaviour</option>
                  <option value="Route Problem">Route Problem</option>
                  <option value="Pickup Problem">Pickup Problem</option>
                  <option value="Drop-off Problem">Drop-off Problem</option>
                  <option value="Student Safety">Student Safety</option>
                  <option value="Bus Condition">Bus Condition</option>
                  <option value="Transport Fee Issue">Transport Fee Issue</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-navy-700 mb-1">Priority</label>
                <select
                  value={submitForm.priority}
                  onChange={(e) => setSubmitForm({ ...submitForm, priority: e.target.value })}
                  className="w-full border border-navy-200 rounded-lg p-2.5 bg-white text-navy-900 text-xs"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-navy-700 mb-1">Related Bus (Optional)</label>
              <select
                value={submitForm.bus}
                onChange={(e) => setSubmitForm({ ...submitForm, bus: e.target.value })}
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
              <label className="block font-semibold text-navy-700 mb-1">Subject *</label>
              <input
                type="text"
                required
                placeholder="e.g. Bus 04 delayed by 35 minutes at Sector 14"
                value={submitForm.subject}
                onChange={(e) => setSubmitForm({ ...submitForm, subject: e.target.value })}
                className="w-full border border-navy-200 rounded-lg p-2.5 text-xs text-navy-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-navy-700 mb-1">Description *</label>
              <textarea
                required
                rows={4}
                placeholder="Please describe the issue in detail..."
                value={submitForm.description}
                onChange={(e) => setSubmitForm({ ...submitForm, description: e.target.value })}
                className="w-full border border-navy-200 rounded-lg p-2.5 text-xs text-navy-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-navy-100">
              <Button variant="outline" size="sm" onClick={() => setShowSubmitModal(false)}>
                Cancel
              </Button>
              <Button variant="teal" size="sm" type="submit">
                Submit Grievance
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: Respond to Complaint */}
      {actionComplaint && (
        <Modal
          isOpen={!!actionComplaint}
          onClose={() => setActionComplaint(null)}
          title={`Respond to Grievance: ${actionComplaint.complaintId}`}
        >
          <form onSubmit={handleRespondComplaint} className="space-y-4 text-xs">
            <div className="p-3 bg-warm-50 rounded-lg border border-navy-200 space-y-1">
              <p><span className="font-bold">Complainant:</span> {actionComplaint.submittedByName} ({actionComplaint.submittedByRole})</p>
              <p><span className="font-bold">Subject:</span> {actionComplaint.subject}</p>
              <p><span className="font-bold">Description:</span> {actionComplaint.description}</p>
            </div>

            <div>
              <label className="block font-semibold text-navy-700 mb-1">Action Status *</label>
              <select
                value={responseForm.status}
                onChange={(e) => setResponseForm({ ...responseForm, status: e.target.value })}
                className="w-full border border-navy-200 rounded-lg p-2.5 bg-white text-navy-900 text-xs"
              >
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Rejected">Rejected</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-navy-700 mb-1">Official Response / Resolution Remarks *</label>
              <textarea
                required
                rows={4}
                placeholder="Explain the corrective action taken or resolution provided..."
                value={responseForm.response}
                onChange={(e) => setResponseForm({ ...responseForm, response: e.target.value })}
                className="w-full border border-navy-200 rounded-lg p-2.5 text-xs text-navy-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-navy-100">
              <Button variant="outline" size="sm" onClick={() => setActionComplaint(null)}>
                Cancel
              </Button>
              <Button variant="teal" size="sm" type="submit">
                Submit Response
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

