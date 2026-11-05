import React, { useState, useEffect, useCallback } from 'react';
import {
  LifeBuoy,
  Plus,
  Search,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertTriangle,
  Send,
  Filter,
  RefreshCw
} from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';
import api from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ROLES } from '@college-erp/shared';

const CATEGORIES = [
  { value: 'academic', label: 'Academic / Coursework' },
  { value: 'hostel', label: 'Hostel & Residential' },
  { value: 'transport', label: 'Transport & Bus Transit' },
  { value: 'accounts', label: 'Fees & Accounts' },
  { value: 'library', label: 'Library Services' },
  { value: 'it_support', label: 'IT & ERP Support' },
  { value: 'general', label: 'General Administration' }
];

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const STATUSES = ['open', 'in_progress', 'resolved', 'closed'];

export default function GrievanceHelpdeskView() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const isPrivileged = [ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.TRANSPORT_ADMIN, ROLES.ACCOUNTS].includes(user?.role);

  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    category: 'academic',
    priority: 'medium',
    subject: '',
    description: ''
  });

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await api.getHelpdeskTickets(params);
      setTickets(res.data || []);
    } catch (err) {
      addToast({ type: 'error', title: 'Helpdesk Error', message: err.message || 'Failed to load tickets' });
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter, statusFilter, addToast]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.description.trim()) {
      addToast({ type: 'error', title: 'Validation Error', message: 'Subject and description are required.' });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.createHelpdeskTicket(formData);
      addToast({
        type: 'success',
        title: 'Ticket Submitted',
        message: `Ticket #${res.data?.ticketNumber || ''} registered successfully.`
      });
      setIsCreateOpen(false);
      setFormData({ category: 'academic', priority: 'medium', subject: '', description: '' });
      fetchTickets();
    } catch (err) {
      addToast({ type: 'error', title: 'Submission Failed', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTicket) return;
    setIsSubmitting(true);
    try {
      const res = await api.addHelpdeskComment(selectedTicket._id, newComment.trim());
      setSelectedTicket(res.data);
      setNewComment('');
      addToast({ type: 'success', title: 'Response Posted', message: 'Comment appended to ticket thread.' });
      fetchTickets();
    } catch (err) {
      addToast({ type: 'error', title: 'Failed to Post', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    if (!selectedTicket) return;
    setIsSubmitting(true);
    try {
      const res = await api.updateHelpdeskTicket(selectedTicket._id, {
        status,
        resolutionNotes: status === 'resolved' ? 'Resolved by authorized administrator' : undefined
      });
      setSelectedTicket(res.data);
      addToast({ type: 'success', title: 'Ticket Updated', message: `Status updated to ${status}.` });
      fetchTickets();
    } catch (err) {
      addToast({ type: 'error', title: 'Update Failed', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.ticketNumber?.toLowerCase().includes(q) ||
      t.subject?.toLowerCase().includes(q) ||
      t.category?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-navy-900 flex items-center">
            <LifeBuoy className="w-5 h-5 mr-2 text-teal-600" />
            Institutional Grievances & Helpdesk
          </h2>
          <p className="text-xs text-navy-500 mt-0.5">
            Transparent ticketing, issue resolution, and escalation workflow for students, staff, and parents.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={fetchTickets} isLoading={isLoading}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Raise Ticket
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 rounded-xl border border-navy-100 shadow-subtle">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-navy-400" />
          <input
            type="text"
            placeholder="Search ticket # or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-navy-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs rounded-lg border border-navy-200 px-2.5 py-1.5 bg-white text-navy-800"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs rounded-lg border border-navy-200 px-2.5 py-1.5 bg-white text-navy-800"
          >
            <option value="all">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tickets List */}
      <Card>
        {isLoading ? (
          <div className="py-12 flex justify-center items-center">
            <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="py-12 text-center text-navy-400">
            <LifeBuoy className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold">No helpdesk tickets found</p>
            <p className="text-xs text-navy-500">Submit a ticket to request assistance or report an institutional grievance.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTickets.map((t) => (
              <div
                key={t._id}
                onClick={() => setSelectedTicket(t)}
                className="p-4 hover:bg-slate-50 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-teal-700">{t.ticketNumber}</span>
                    <Badge
                      variant={
                        t.status === 'resolved'
                          ? 'emerald'
                          : t.status === 'in_progress'
                          ? 'cyan'
                          : t.status === 'closed'
                          ? 'slate'
                          : 'amber'
                      }
                      size="xs"
                    >
                      {t.status.replace('_', ' ')}
                    </Badge>
                    <Badge
                      variant={
                        t.priority === 'urgent'
                          ? 'rose'
                          : t.priority === 'high'
                          ? 'amber'
                          : 'slate'
                      }
                      size="xs"
                    >
                      {t.priority}
                    </Badge>
                    <span className="text-[11px] text-navy-400 uppercase font-semibold">
                      {t.category.replace('_', ' ')}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-navy-900">{t.subject}</h4>
                  <p className="text-xs text-navy-500 line-clamp-1">{t.description}</p>
                </div>

                <div className="text-right text-xs text-navy-400 shrink-0">
                  <div className="flex items-center justify-end space-x-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{t.comments?.length || 0} messages</span>
                  </div>
                  <div className="text-[11px] text-navy-400 mt-1">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Ticket Details & Discussion Modal */}
      {selectedTicket && (
        <Modal
          isOpen={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          title={`Ticket: ${selectedTicket.ticketNumber}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-sm text-navy-900">{selectedTicket.subject}</h3>
                  <p className="text-navy-500 text-[11px]">
                    Filed by {selectedTicket.submittedBy?.name || 'User'} ({selectedTicket.role}) • {new Date(selectedTicket.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex space-x-1.5">
                  <Badge variant="cyan" size="xs">{selectedTicket.category}</Badge>
                  <Badge variant={selectedTicket.priority === 'urgent' ? 'rose' : 'slate'} size="xs">{selectedTicket.priority}</Badge>
                </div>
              </div>
              <p className="text-navy-800 bg-white p-3 rounded-lg border border-slate-100 whitespace-pre-wrap">
                {selectedTicket.description}
              </p>
            </div>

            {/* Workflow status controls for staff */}
            {isPrivileged && (
              <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl flex items-center justify-between text-xs">
                <span className="font-semibold text-amber-900">Manage Status:</span>
                <div className="flex space-x-2">
                  <Button
                    size="xs"
                    variant={selectedTicket.status === 'in_progress' ? 'primary' : 'outline'}
                    onClick={() => handleUpdateStatus('in_progress')}
                    disabled={isSubmitting}
                  >
                    In Progress
                  </Button>
                  <Button
                    size="xs"
                    variant={selectedTicket.status === 'resolved' ? 'primary' : 'outline'}
                    onClick={() => handleUpdateStatus('resolved')}
                    disabled={isSubmitting}
                  >
                    Mark Resolved
                  </Button>
                  <Button
                    size="xs"
                    variant={selectedTicket.status === 'closed' ? 'primary' : 'outline'}
                    onClick={() => handleUpdateStatus('closed')}
                    disabled={isSubmitting}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}

            {/* Conversation / Comments thread */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-navy-500">Activity & Responses</h4>
              {(!selectedTicket.comments || selectedTicket.comments.length === 0) ? (
                <p className="text-xs text-navy-400 italic">No responses posted yet.</p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
                  {selectedTicket.comments.map((c, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="flex justify-between items-center text-[11px] text-navy-500 mb-1">
                        <span className="font-semibold text-navy-800">{c.author?.name || 'ERP Support'}</span>
                        <span>{new Date(c.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-navy-700 whitespace-pre-wrap">{c.message}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Comment Input */}
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Post an update or reply..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <Button type="submit" size="sm" variant="primary" isLoading={isSubmitting}>
                  <Send className="w-3.5 h-3.5 mr-1" />
                  Reply
                </Button>
              </form>
            </div>
          </div>
        </Modal>
      )}

      {/* Raise Ticket Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Raise Helpdesk Ticket" size="md">
        <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-navy-700 mb-1">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full border border-navy-200 rounded-lg px-3 py-2 bg-white text-navy-800 focus:ring-2 focus:ring-teal-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-navy-700 mb-1">Priority Level</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full border border-navy-200 rounded-lg px-3 py-2 bg-white text-navy-800 focus:ring-2 focus:ring-teal-500"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-navy-700 mb-1">Subject</label>
            <Input
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="e.g. Bus Route 4 timing delay / Tuition invoice fee discrepancy"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-navy-700 mb-1">Detailed Description</label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide exact details, relevant dates, or numbers..."
              className="w-full border border-navy-200 rounded-lg p-2.5 text-xs text-navy-800 focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Submit Ticket
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

