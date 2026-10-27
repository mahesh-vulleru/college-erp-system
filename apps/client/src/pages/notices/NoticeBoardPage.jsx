import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  Search,
  Filter,
  PlusCircle,
  Pin,
  Calendar,
  Clock,
  User,
  Building2,
  AlertTriangle,
  Archive,
  Send,
  Eye,
  CheckCircle2,
  RefreshCw,
  FileText,
  Edit
} from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';
import api from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ROLES } from '@college-erp/shared';

const CATEGORIES = ['All', 'General', 'Academic', 'Examination', 'Fees', 'Holiday', 'Emergency', 'Placement'];

export const NoticeBoardPage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const canPublish = [ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD].includes(user?.role);

  const [notices, setNotices] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState(canPublish ? 'all' : 'published');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [activeNotice, setActiveNotice] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    content: '',
    category: 'General',
    targetRoles: ['*'],
    department: '',
    priority: 'normal',
    isPinned: false,
    status: 'published',
    publicationDate: new Date().toISOString().split('T')[0],
    expiryDate: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [noticeRes, deptRes] = await Promise.all([
        api.getNotices({
          category: selectedCategory !== 'All' ? selectedCategory : undefined,
          priority: priorityFilter !== 'all' ? priorityFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          q: searchQuery.trim() || undefined
        }),
        api.getDepartments().catch(() => ({ data: [] }))
      ]);

      if (noticeRes?.data) setNotices(noticeRes.data);
      if (deptRes?.data) setDepartments(deptRes.data);
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Error loading notice board',
        message: err.message
      });
    } finally {
      setIsLoading(false);
    }
  }, [addToast, selectedCategory, priorityFilter, statusFilter, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...noticeForm,
        department: noticeForm.department || null,
        expiryDate: noticeForm.expiryDate ? new Date(noticeForm.expiryDate) : null,
        publicationDate: noticeForm.publicationDate ? new Date(noticeForm.publicationDate) : new Date()
      };

      if (isEditing && activeNotice) {
        await api.updateNotice(activeNotice._id, payload);
        addToast({ type: 'success', title: 'Notice Updated', message: 'The circular has been modified.' });
      } else {
        await api.createNotice(payload);
        addToast({
          type: 'success',
          title: 'Notice Created',
          message: payload.status === 'published' ? 'Circular published to audience.' : 'Draft saved.'
        });
      }

      setIsCreateModalOpen(false);
      setIsEditing(false);
      resetForm();
      loadData();
    } catch (err) {
      addToast({ type: 'error', title: 'Action Failed', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublishDraft = async (id) => {
    try {
      await api.publishNotice(id);
      addToast({ type: 'success', title: 'Notice Published', message: 'The circular is now live for readers.' });
      loadData();
    } catch (err) {
      addToast({ type: 'error', title: 'Publish Failed', message: err.message });
    }
  };

  const handleArchiveNotice = async (id) => {
    if (!window.confirm('Archive this circular? It will no longer be visible on the public notice board.')) return;
    try {
      await api.archiveNotice(id);
      addToast({ type: 'success', title: 'Notice Archived', message: 'Circular moved to historical archives.' });
      loadData();
    } catch (err) {
      addToast({ type: 'error', title: 'Archival Failed', message: err.message });
    }
  };

  const openEditModal = (notice) => {
    setActiveNotice(notice);
    setIsEditing(true);
    setNoticeForm({
      title: notice.title || '',
      content: notice.content || '',
      category: notice.category || 'General',
      targetRoles: notice.targetRoles || ['*'],
      department: notice.department?._id || '',
      priority: notice.priority || 'normal',
      isPinned: notice.isPinned || false,
      status: notice.status || 'published',
      publicationDate: notice.publicationDate ? new Date(notice.publicationDate).toISOString().split('T')[0] : '',
      expiryDate: notice.expiryDate ? new Date(notice.expiryDate).toISOString().split('T')[0] : ''
    });
    setIsCreateModalOpen(true);
  };

  const openDetailModal = (notice) => {
    setActiveNotice(notice);
    setIsDetailModalOpen(true);
  };

  const resetForm = () => {
    setNoticeForm({
      title: '',
      content: '',
      category: 'General',
      targetRoles: ['*'],
      department: '',
      priority: 'normal',
      isPinned: false,
      status: 'published',
      publicationDate: new Date().toISOString().split('T')[0],
      expiryDate: ''
    });
    setActiveNotice(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-navy-950 flex items-center">
            <Bell className="w-6 h-6 mr-2.5 text-teal-600" />
            Institutional Notice Board
          </h1>
          <p className="text-xs sm:text-sm text-navy-600 mt-1">
            Official college circulars, administrative alerts, examination announcements, and emergency notices.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canPublish && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                resetForm();
                setIsEditing(false);
                setIsCreateModalOpen(true);
              }}
            >
              <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
              Publish Circular
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={loadData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Filter and Category Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-navy-200 pb-3">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              selectedCategory === cat
                ? 'bg-teal-600 text-white shadow-subtle'
                : 'bg-navy-100/70 text-navy-700 hover:bg-navy-200/80'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search and Secondary Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-navy-400" />
          <input
            type="text"
            placeholder="Search circular title or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-navy-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center space-x-2.5 w-full sm:w-auto">
          <span className="text-xs text-navy-500 font-medium">Priority:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-xl border border-navy-200 bg-white"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>

          {canPublish && (
            <>
              <span className="text-xs text-navy-500 font-medium ml-2">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-xl border border-navy-200 bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Drafts</option>
                <option value="archived">Archived</option>
              </select>
            </>
          )}
        </div>
      </div>

      {/* Notices Grid */}
      {isLoading ? (
        <div className="py-12 text-center text-navy-500 text-xs">Loading institutional circulars...</div>
      ) : notices.length === 0 ? (
        <Card className="p-8 text-center">
          <Bell className="w-10 h-10 text-navy-300 mx-auto mb-2" />
          <h3 className="font-semibold text-navy-900 text-sm">No notices currently posted</h3>
          <p className="text-xs text-navy-500 mt-1 max-w-sm mx-auto">
            There are no circulars matching your active audience or search criteria.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notices.map((n) => (
            <Card
              key={n._id}
              className={`p-4 flex flex-col justify-between transition-all hover:shadow-md border ${
                n.isPinned
                  ? 'border-amber-300 bg-amber-50/20'
                  : n.priority === 'urgent'
                  ? 'border-rose-200 bg-rose-50/10'
                  : 'border-navy-200/80 bg-white'
              }`}
            >
              <div className="space-y-2.5">
                {/* Badges bar */}
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {n.isPinned && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        <Pin className="w-3 h-3 mr-0.5 fill-current" /> PINNED
                      </span>
                    )}
                    <Badge variant={n.priority === 'urgent' ? 'danger' : n.priority === 'low' ? 'neutral' : 'teal'}>
                      {n.priority?.toUpperCase()}
                    </Badge>
                    <Badge variant="neutral">{n.category || 'General'}</Badge>
                  </div>

                  {n.status !== 'published' && (
                    <Badge variant={n.status === 'draft' ? 'warning' : 'neutral'}>
                      {n.status?.toUpperCase()}
                    </Badge>
                  )}
                </div>

                {/* Notice Title */}
                <h3
                  onClick={() => openDetailModal(n)}
                  className="font-bold text-sm text-navy-950 hover:text-teal-700 cursor-pointer line-clamp-2"
                >
                  {n.title}
                </h3>

                {/* Content snippet */}
                <p className="text-xs text-navy-600 line-clamp-3 font-normal leading-relaxed">
                  {n.content}
                </p>
              </div>

              {/* Footer Meta */}
              <div className="mt-4 pt-3 border-t border-navy-100 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-navy-500">
                  <span className="flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1 text-navy-400" />
                    {n.publicationDate ? new Date(n.publicationDate).toLocaleDateString() : 'N/A'}
                  </span>
                  <span className="flex items-center">
                    <User className="w-3.5 h-3.5 mr-1 text-navy-400" />
                    {n.publishedBy?.name || 'College Office'}
                  </span>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => openDetailModal(n)}
                    className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    Read Full
                  </button>

                  {canPublish && (
                    <div className="flex items-center space-x-1.5">
                      {n.status === 'draft' && (
                        <button
                          onClick={() => handlePublishDraft(n._id)}
                          className="px-2 py-0.5 text-[10px] rounded bg-teal-50 text-teal-700 font-semibold hover:bg-teal-100"
                        >
                          Publish
                        </button>
                      )}
                      <button
                        onClick={() => openEditModal(n)}
                        className="text-navy-400 hover:text-navy-700 p-1"
                        title="Edit"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      {n.status !== 'archived' && (
                        <button
                          onClick={() => handleArchiveNotice(n._id)}
                          className="text-rose-400 hover:text-rose-700 p-1"
                          title="Archive"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* MODAL: Read Full Notice Details */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Institutional Circular Announcement">
        {activeNotice && (
          <div className="space-y-4 text-xs">
            <div className="border-b border-navy-200 pb-3">
              <div className="flex items-center space-x-2 mb-2">
                <Badge variant={activeNotice.priority === 'urgent' ? 'danger' : 'teal'}>
                  {activeNotice.priority?.toUpperCase()} PRIORITY
                </Badge>
                <Badge variant="neutral">{activeNotice.category}</Badge>
                {activeNotice.department && <Badge variant="neutral">{activeNotice.department.name}</Badge>}
              </div>
              <h2 className="text-base font-bold text-navy-950">{activeNotice.title}</h2>
              <div className="flex items-center space-x-4 text-[11px] text-navy-500 mt-2">
                <span>Published by: <strong>{activeNotice.publishedBy?.name} ({activeNotice.publishedBy?.role})</strong></span>
                <span>Date: {new Date(activeNotice.publicationDate || activeNotice.createdAt).toLocaleDateString()}</span>
                {activeNotice.expiryDate && (
                  <span className="text-amber-700">Expires: {new Date(activeNotice.expiryDate).toLocaleDateString()}</span>
                )}
              </div>
            </div>

            <div className="text-navy-800 leading-relaxed whitespace-pre-line text-sm py-2">
              {activeNotice.content}
            </div>

            {/* Target Audience Information */}
            <div className="p-2.5 rounded-lg bg-navy-50 border border-navy-200 flex items-center justify-between text-[11px]">
              <span className="text-navy-600">Target Audience:</span>
              <span className="font-semibold text-navy-900">
                {activeNotice.targetRoles?.includes('*')
                  ? 'Entire Campus Community (Students, Faculty, Staff)'
                  : activeNotice.targetRoles?.join(', ')}
              </span>
            </div>

            {/* Publication History */}
            {activeNotice.history && activeNotice.history.length > 0 && (
              <div className="border-t border-navy-100 pt-3">
                <h4 className="text-[11px] font-bold text-navy-700 uppercase tracking-wider mb-2">Publication Audit Trail</h4>
                <div className="space-y-1.5">
                  {activeNotice.history.map((h, i) => (
                    <div key={i} className="flex justify-between text-[10px] text-navy-500">
                      <span>• {h.action?.toUpperCase()} - {h.note || 'Action taken'}</span>
                      <span>{new Date(h.timestamp).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="ghost" size="sm" onClick={() => setIsDetailModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL: Create / Edit Notice */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={isEditing ? 'Edit Circular Notice' : 'Post Institutional Circular'}
      >
        <form onSubmit={handleCreateOrUpdate} className="space-y-3.5 text-xs">
          <Input
            label="Circular Title"
            value={noticeForm.title}
            onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
            placeholder="e.g. Schedule for Mid-Term Laboratory Practicals"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Category"
              value={noticeForm.category}
              onChange={(e) => setNoticeForm({ ...noticeForm, category: e.target.value })}
              options={CATEGORIES.filter((c) => c !== 'All').map((c) => ({ label: c, value: c }))}
            />
            <Select
              label="Priority Level"
              value={noticeForm.priority}
              onChange={(e) => setNoticeForm({ ...noticeForm, priority: e.target.value })}
              options={[
                { label: 'Normal Priority', value: 'normal' },
                { label: 'Urgent / Immediate Action', value: 'urgent' },
                { label: 'Low / Information Only', value: 'low' }
              ]}
            />
          </div>

          <Textarea
            label="Circular Announcement Body"
            value={noticeForm.content}
            onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
            rows={5}
            placeholder="Draft the official institutional notice announcement..."
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Target Department (Optional)"
              value={noticeForm.department}
              onChange={(e) => setNoticeForm({ ...noticeForm, department: e.target.value })}
              options={[{ label: 'All Campus Departments', value: '' }, ...departments.map((d) => ({ label: d.name, value: d._id }))]}
            />
            <Select
              label="Target Audience"
              value={noticeForm.targetRoles[0] || '*'}
              onChange={(e) => setNoticeForm({ ...noticeForm, targetRoles: [e.target.value] })}
              options={[
                { label: 'All Users (*)', value: '*' },
                { label: 'Students Only', value: ROLES.STUDENT },
                { label: 'Faculty Only', value: ROLES.FACULTY },
                { label: 'HODs & Academic Staff', value: ROLES.HOD },
                { label: 'Accounts & Administration', value: ROLES.ACCOUNTS }
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Publication Date"
              type="date"
              value={noticeForm.publicationDate}
              onChange={(e) => setNoticeForm({ ...noticeForm, publicationDate: e.target.value })}
              required
            />
            <Input
              label="Expiry Date (Optional)"
              type="date"
              value={noticeForm.expiryDate}
              onChange={(e) => setNoticeForm({ ...noticeForm, expiryDate: e.target.value })}
            />
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="pinNotice"
              checked={noticeForm.isPinned}
              onChange={(e) => setNoticeForm({ ...noticeForm, isPinned: e.target.checked })}
              className="rounded text-teal-600 focus:ring-teal-500"
            />
            <label htmlFor="pinNotice" className="text-navy-700 font-medium">
              Pin to top of notice board banner
            </label>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-navy-100">
            <Button variant="ghost" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              type="button"
              disabled={isSubmitting}
              onClick={(e) => {
                setNoticeForm((prev) => ({ ...prev, status: 'draft' }));
                handleCreateOrUpdate(e);
              }}
            >
              Save as Draft
            </Button>
            <Button
              variant="primary"
              type="button"
              disabled={isSubmitting}
              onClick={(e) => {
                setNoticeForm((prev) => ({ ...prev, status: 'published' }));
                handleCreateOrUpdate(e);
              }}
            >
              {isSubmitting ? 'Posting...' : isEditing ? 'Save Changes' : 'Publish Circular'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default NoticeBoardPage;

